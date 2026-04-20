import httpStatus from "http-status";
import AppError from "./app.error";
import { ErrorCode } from "../enums/error-code.enum";

export default class InvalidRequestError extends AppError {
  constructor(message: string) {
    super(httpStatus.BAD_REQUEST, message);

    this.errorCode = ErrorCode.BAD_REQUEST;
  }
}
