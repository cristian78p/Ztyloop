import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../utils/api-response';
import type { RegisterDto, LoginDto } from '../validators/auth.validator';

// El Controller SOLO:
// 1. Extrae datos del request
// 2. Llama al service
// 3. Formatea y envía la respuesta
// No contiene lógica de negocio.
export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RegisterDto;
      const result = await this.authService.register(dto);
      res.status(201).json(ApiResponse.success(result, 'Cuenta creada exitosamente'));
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const result = await this.authService.login(dto, ip, userAgent);

      // refreshToken como cookie HttpOnly (más seguro que localStorage)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json(
        ApiResponse.success({ accessToken: result.accessToken, user: result.user }, 'Sesión iniciada'),
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.refreshToken as string;
      if (token) {
        await this.authService.logout(token);
      }
      res.clearCookie('refreshToken');
      res.json(ApiResponse.success(null, 'Sesión cerrada'));
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getMe(req.user!.id);
      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies.refreshToken as string;
      if (!token) {
        res.status(401).json(ApiResponse.error('Refresh token requerido'));
        return;
      }

      const ip = req.ip;
      const userAgent = req.get('user-agent');
      const result = await this.authService.refreshAccessToken(token, ip, userAgent);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json(ApiResponse.success({ accessToken: result.accessToken }));
    } catch (error) {
      next(error);
    }
  };
}
