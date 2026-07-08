import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class InvalidRequestError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(httpStatus.BAD_REQUEST, message, ErrorCode.BAD_REQUEST, cause);
  }
}
