import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import type { RegisterDto, LoginDto } from '../validators/auth.validator';

// El Service contiene TODA la lógica de negocio.
// No sabe nada de HTTP (sin req/res). Solo recibe datos y retorna resultados.
export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existing) {
      throw new AppError(
        existing.email === dto.email
          ? 'El email ya está registrado'
          : 'El nombre de usuario no está disponible',
        409,
      );
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName ?? dto.username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
      },
    });

    const accessToken = this.signAccessToken(user.id);
    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!user) throw new AppError('Credenciales inválidas', 401);
    if (user.status === 'SUSPENDED') throw new AppError('Tu cuenta ha sido suspendida', 403);

    const valid = await argon2.verify(user.passwordHash!, dto.password);
    if (!valid) throw new AppError('Credenciales inválidas', 401);

    const accessToken = this.signAccessToken(user.id);
    const refreshToken = this.signRefreshToken(user.id);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  async refreshAccessToken(token: string) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
      return { accessToken: this.signAccessToken(payload.userId) };
    } catch {
      throw new AppError('Token de actualización inválido o expirado', 401);
    }
  }

  private signAccessToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  private signRefreshToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }
}
