import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

// Manejador centralizado de errores. Siempre va AL FINAL de app.ts.
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err: error, path: req.path, method: req.method }, error.message);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Error no controlado → nunca exponer el stack en producción
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
