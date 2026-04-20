import DuplicateError from "../error/duplicate.error";

export function handleDbError(err: any, defaultMessage: string = "Request already processed."): void {
  const errorCode = err.code || err?.nativeError?.code;

  if (err.name === "UniqueViolationError" || errorCode === "23505") {
    throw new DuplicateError(defaultMessage);
  }
}
