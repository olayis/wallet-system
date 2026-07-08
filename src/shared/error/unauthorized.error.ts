import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", cause?: unknown) {
    super(httpStatus.UNAUTHORIZED, message, ErrorCode.UNAUTHORIZED, cause);
  }
}
