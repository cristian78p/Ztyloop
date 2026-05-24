import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import type { RegisterDto, LoginDto } from '../validators/auth.validator';

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
        bannerUrl: true,
        bio: true,
        role: true,
      },
    });

    const accessToken = this.signAccessToken(user.id);
    return { user, accessToken };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bannerUrl: true,
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

    const family = crypto.randomUUID();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, family, expiresAt, ip, userAgent },
    });

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
        bannerUrl: true,
        bio: true,
        role: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });

    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  async refreshAccessToken(token: string, ip?: string, userAgent?: string) {
    let payload: { userId: string };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AppError('Token de actualización inválido o expirado', 401);
    }

    const tokenHash = this.hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) throw new AppError('Token de actualización inválido', 401);

    if (stored.revokedAt) {
      logger.warn({ family: stored.family, userId: stored.userId }, 'Reuse of revoked refresh token detected — revoking entire family');
      await prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError('Token de actualización revocado. Inicia sesión de nuevo.', 401);
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });
      throw new AppError('Token de actualización expirado', 401);
    }

    const newRefreshToken = this.signRefreshToken(payload.userId);
    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + this.parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date(), replacedBy: newTokenHash },
      }),
      prisma.refreshToken.create({
        data: { userId: payload.userId, tokenHash: newTokenHash, family: stored.family, expiresAt, ip, userAgent },
      }),
    ]);

    return { accessToken: this.signAccessToken(payload.userId), refreshToken: newRefreshToken };
  }

  async logout(token: string) {
    const tokenHash = this.hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (stored && !stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { family: stored.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * (multipliers[unit] ?? 86_400_000);
  }
}
