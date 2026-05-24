import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

const MULTER_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'El archivo excede el tamaño máximo permitido',
  LIMIT_FILE_COUNT: 'Demasiados archivos',
  LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
};

export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err: error, path: req.path, method: req.method }, error.message);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  if (error.name === 'MulterError' && 'code' in error) {
    const code = (error as Error & { code: string }).code;
    res.status(400).json({
      success: false,
      error: MULTER_MESSAGES[code] ?? error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : error.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.method} ${req.path} no encontrada`,
  });
}
