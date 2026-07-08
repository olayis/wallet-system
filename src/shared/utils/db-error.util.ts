import DuplicateError from "../error/duplicate.error";
import InvalidRequestError from "../error/invalid-request.error";

interface PgError {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  nativeError?: PgError;
}

const DUPLICATE_MESSAGES: Record<string, string> = {
  users_email_unique: "Email already exists",
  wallets_user_id_unique: "Wallet already exists for user",
  transactions_idempotency_key_unique: "Request already processed",
};

const CHECK_MESSAGES: Record<string, string> = {
  transactions_amount_positive: "Amount must be positive",
  transactions_status_valid: "Invalid transaction status",
  transactions_shape_valid: "Invalid transaction shape",
  transactions_type_check: "Invalid transaction type",
  ledger_entries_amount_nonzero: "Ledger amount must be non-zero",
  ledger_entries_sign_matches_type: "Ledger entry sign does not match its type",
  idempotency_keys_state_valid: "Invalid idempotency state",
};

function unwrap(err: PgError): PgError {
  return err.nativeError ?? err;
}

export function handleDbError(err: unknown, fallback?: string): never {
  const pg = unwrap(err as PgError);
  const code = pg.code;
  const constraint = pg.constraint;

  if (code === "23505") {
    const message = (constraint && DUPLICATE_MESSAGES[constraint]) ?? fallback ?? "Resource already exists";
    throw new DuplicateError(message, err);
  }

  if (code === "23514") {
    const message = (constraint && CHECK_MESSAGES[constraint]) ?? "Constraint violation";
    throw new InvalidRequestError(message, err);
  }

  if (code === "23503") {
    throw new InvalidRequestError("Referenced resource does not exist", err);
  }

  throw err;
}
