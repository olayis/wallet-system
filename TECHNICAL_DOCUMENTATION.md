# Wallet System Technical Notes

## Architecture

Layered:

```
HTTP route -> controller -> service -> repository -> Objection model -> Knex -> Postgres
```

DI via tsyringe; controllers and services are constructor-injected.

Plugins (registered before routes):

1. `dbPlugin`: owns the Knex/Objection instance, closes it on `onClose`.
2. `securityPlugin`: `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` (auth-token-aware key generator).
3. `authPlugin`: `@fastify/jwt`, decorates `app.authenticate`.

The validator/serializer compilers come from `fastify-type-provider-zod`; route schemas are plain Zod and double as TypeScript inference sources.

## Money

- Postgres column: `numeric(19, 4)`.
- pg type parser: `NUMERIC` and `INT8` are returned as strings (see `src/config/knex.ts`).
- App type: `Money = string` with `decimal.js` for arithmetic.
- Validation: `moneySchema` rejects non-numeric strings, negative or zero amounts, more than 4 decimal places, and amounts above `1e14`.

There is no implicit conversion to `number` anywhere; all arithmetic happens through `add`, `sub`, `neg`, `gte`, etc. in `src/shared/utils/money.ts`.

## Ledger

`ledger_entries` is append-only:

- `credit` rows store `amount > 0`, `debit` rows store `amount < 0` (CHECK enforced).
- Each entry references the originating `transactions.id` via both `reference` (legacy) and `transaction_id`.
- `(wallet_id, created_at DESC)` index for balance + statement queries.
- Balance: `SELECT SUM(amount) FROM ledger_entries WHERE wallet_id = ?`.

The `wallets.balance` column was removed in `20260501000000_strengthen_money_schema.ts`. There is no cache to drift.

## Idempotency

Two layers:

1. **`idempotency_keys` table** (per user + endpoint + request hash). `IdempotencyService.run`:
   - If a record exists in `completed` state with matching hash, replay the original status code and body.
   - If `pending`, return `409` (concurrent in-flight request).
   - Mismatched body returns `400`. Mismatched user returns `409` (treated as a stolen key).
   - Otherwise insert as `pending` and run the handler. On success, mark `completed`. On failure the handler's transaction has already rolled back, so the key is released and the caller can retry.
2. **`transactions.idempotency_key UNIQUE NOT NULL`** as the database-level safety net. If two requests with the same key race past the table check, the second insert into `transactions` fails with `23505` and surfaces as `DuplicateError`.

## Concurrency

- `WalletRepository.lockWalletsByUserIds` issues `WHERE user_id IN (?, ?) ORDER BY id FOR UPDATE`. Postgres acquires the locks in row-scan order, so two concurrent reciprocal transfers serialize on the same wallet pair without deadlock.
- `WalletRepository.lockWalletByUserId` is used by deposits and withdrawals to take an explicit `FOR UPDATE` on the single wallet row, so they serialize against in-flight transfers touching the same wallet.
- Insufficient-funds check (transfer and withdrawal) is done **inside** the locked transaction.

## Schema invariants

Enforced by Postgres rather than only by the service (defense in depth):

- `wallets.user_id` is `UNIQUE` (one wallet per user).
- `transactions.amount > 0`.
- `transactions.status IN ('pending','completed','failed','reversed')`.
- `transactions.type IN ('deposit','transfer','withdrawal')`.
- `transactions` shape:
  - `deposit`: `from_user_id IS NULL AND to_user_id IS NOT NULL`
  - `transfer`: both ids set and distinct
  - `withdrawal`: `from_user_id IS NOT NULL AND to_user_id IS NULL`
- `ledger_entries.amount <> 0`.
- `ledger_entries`: `(type='credit' AND amount>0) OR (type='debit' AND amount<0)`.

## Timestamps

Every table records `created_at`. Application rows are write-once: `users`, `wallets`, `transactions`, and `ledger_entries` are never updated after insert, so a generic `updated_at` would always equal `created_at`. The only table that mutates is `idempotency_keys`, which moves from `pending` to `completed` and records that moment in `completed_at`. If transactions later gain a status lifecycle such as reversals, `updated_at` would be reintroduced on that table alone.

## Auth

- `POST /auth/register` creates the user + wallet in one transaction, hashes the password with `bcrypt` at the configured cost (default 12), returns a JWT.
- `POST /auth/login` does a constant-time-ish bcrypt compare against either the user's hash or a fixed dummy hash (so timing reveals less about which emails exist).
- `app.authenticate` is the route hook; a missing/invalid token surfaces as `401` from the global error handler.

## Observability

- Pino logger; production omits the `pino-pretty` transport and writes JSON.
- Redaction list covers `req.headers.authorization`, `cookie`, `x-idempotency-key`, and any `password`/`passwordHash` keys.
- `genReqId` honors an inbound `x-request-id` header for trace propagation.
- `/livez` is process-only; `/readyz` runs `select 1` against the DB pool and returns `503` if it fails.

## Error model

A single `setErrorHandler` in `app.ts` maps:

| Source | Status | Notes |
| --- | --- | --- |
| Zod validation (route schema) | 400 | Returns the first message + full list |
| `AppError` subclass | as set | Logs `warn` for 4xx, `error` for 5xx |
| `@fastify/jwt` 401 | 401 | |
| `@fastify/rate-limit` 429 | 429 | |
| Anything else | 500 | Generic message; no internal leak |

`handleDbError` (in `src/shared/utils/db-error.util.ts`) translates Postgres SQLSTATEs to `AppError`s, switching on the `constraint` name so each unique/check violation produces the right user-facing message.

## Tests

Vitest + Supertest, integration-style. Global setup drops and recreates the `public` schema, then runs migrations. `beforeEach` truncates application tables. Tests cover:

- registration, duplicate email, weak passwords, login, unauthenticated access
- deposit happy path, non-positive amounts, decimal-place limits, fractional precision
- withdraw happy path, insufficient funds, idempotent replay, unauthenticated access
- transfer happy path, insufficient funds, self-transfer, missing recipient, concurrent reciprocal transfers
- idempotency replay, body mismatch, cross-user key reuse, malformed key
- transaction history ordering and cursor pagination

CI runs typecheck, lint, test, build, then `npm audit --audit-level=high` against a real Postgres service.
