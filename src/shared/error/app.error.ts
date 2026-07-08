import { ErrorCode } from "../enums/error-code.enum";

export default class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public override readonly cause?: unknown;

  constructor(statusCode: number, message: string, errorCode: ErrorCode, cause?: unknown, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.cause = cause;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
