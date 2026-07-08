export interface SuccessEnvelope<T = unknown> {
  success: true;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  success: false;
  message: string;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
}

export const SuccessResponse = <T>(message: string, data?: T, meta?: Record<string, unknown>): SuccessEnvelope<T> => ({
  success: true,
  message,
  data,
  meta,
});

export const ErrorResponse = (
  message: string,
  errorCode?: string,
  errors?: Array<{ field: string; message: string }>,
): ErrorEnvelope => ({
  success: false,
  message,
  errorCode,
  errors,
});
