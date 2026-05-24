export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>;
}

export const ApiResponse = {
  success<T>(data: T, message?: string): SuccessResponse<T> {
    return { success: true, data, ...(message && { message }) };
  },

  error(error: string, details?: Record<string, string[]>): ErrorResponse {
    return { success: false, error, ...(details && { details }) };
  },
};
