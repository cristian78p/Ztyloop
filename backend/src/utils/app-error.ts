/**
 * Error con código HTTP. Lanzado desde services/controllers.
 * El error.middleware lo intercepta y responde con el statusCode correcto.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
