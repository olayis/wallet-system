import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class DuplicateError extends AppError {
  constructor(message: string) {
    super(httpStatus.CONFLICT, message);

    this.errorCode = ErrorCode.DUPLICATE;
  }
}
