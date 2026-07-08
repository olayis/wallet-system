import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class NotFoundError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(httpStatus.NOT_FOUND, message, ErrorCode.NOT_FOUND, cause);
  }
}
