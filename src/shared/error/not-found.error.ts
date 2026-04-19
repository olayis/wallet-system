import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class NotFoundError extends AppError {
  constructor(message: string) {
    super(httpStatus.NOT_FOUND, message);

    this.errorCode = ErrorCode.NOT_FOUND;
  }
}
