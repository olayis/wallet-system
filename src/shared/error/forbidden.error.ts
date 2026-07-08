import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class ForbiddenError extends AppError {
  constructor(message = "Forbidden", cause?: unknown) {
    super(httpStatus.FORBIDDEN, message, ErrorCode.FORBIDDEN, cause);
  }
}
