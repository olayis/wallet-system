# Wallet System

Ledger-backed wallet API. Each user has one wallet; balances are derived from append-only ledger entries; mutating endpoints require a JWT and a UUID idempotency key.

## Stack

- Node.js 20, TypeScript, Fastify
- PostgreSQL via Knex / Objection.js
- Zod for I/O validation, fastify-type-provider-zod for route schemas
- tsyringe for DI
- Vitest + Supertest

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run migrate:latest
npm run dev
```

Or run everything in containers:

```bash
docker compose up --build
```

## Configuration

All environment variables are listed in `.env.example`. The process refuses to boot if any required variable is missing or invalid; check stderr for the exact field. `JWT_SECRET` must be at least 32 characters.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | ts-node-dev with respawn |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run the full vitest suite |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |
| `npm run migrate:latest` | Apply pending migrations |
| `npm run migrate:rollback` | Roll back the last batch |

## API

All money-moving endpoints require:

- `Authorization: Bearer <jwt>` (from `/auth/login` or `/auth/register`)
- `x-idempotency-key: <uuid v4>`

Amounts are JSON strings with up to 4 decimal places; the API echoes them in canonical `numeric(19,4)` form.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/auth/register` | Creates user + wallet, returns token |
| `POST` | `/auth/login` | Returns token |
| `GET` | `/wallets/balance` | Authenticated user's balance |
| `POST` | `/wallets/deposit` | `{ amount }` |
| `POST` | `/wallets/withdraw` | `{ amount }` |
| `POST` | `/wallets/transfer` | `{ toUserId, amount }` |
| `GET` | `/wallets/transactions?limit=&cursor=` | Reverse-chronological history with cursor pagination |
| `GET` | `/livez` | Process is up |
| `GET` | `/readyz` | Process is ready (DB reachable) |

### Idempotency semantics

A repeated request with the same `x-idempotency-key` is replayed: the original status code and response body are returned. Reusing a key with a different body returns `400`. A key issued to user A cannot be claimed by user B (`409`).

## Layout

```
src/
  config/          env, app, knex, logger
  db/              knex bootstrap, migrations
  modules/
    auth/          register, login, JWT issuance
    idempotency/   request-replay store
    wallets/       deposit, withdraw, transfer, balance, history
    ledgers/       append-only ledger entries
    users/         user model + repo
    health/        livez / readyz
  plugins/         db, security, auth fastify plugins
  shared/          errors, repositories, utils, money
  tests/
```

## Design notes

- **Single source of truth:** balances are `SUM(amount)` over `ledger_entries`. There is no cached `wallets.balance` column.
- **Money:** stored as `numeric(19,4)`, returned by `pg` as a string, manipulated through `decimal.js`. JS `number` never touches a balance.
- **Idempotency:** dedicated `idempotency_keys` table per `(user, key)` storing the response body for replay; backed by the `UNIQUE` constraint on `transactions.idempotency_key` for defense in depth.
- **Concurrency:** transfers acquire `FOR UPDATE` on both wallets in stable id order. Deposits also lock the wallet row to prevent interleaving with a concurrent transfer.
- **Schema invariants** are enforced in Postgres: `CHECK (amount > 0)`, status enum, transaction-shape check (`deposit` sets `to_user_id`, `transfer` sets both ids and distinct, `withdrawal` sets `from_user_id`), ledger sign matches type.


## Architecture

### Data model

```mermaid
erDiagram
    users  ||--|| wallets           : "has one"
    users  ||--o{ transactions      : "from / to"
    users  ||--o{ idempotency_keys  : "owns"
    wallets ||--o{ ledger_entries   : "has many"
    transactions ||--o{ ledger_entries : "produces"

    users {
        uuid id PK
        string email UK
        string password_hash
        timestamp created_at
    }
    wallets {
        uuid id PK
        uuid user_id FK "UNIQUE — one wallet per user; no balance column"
        timestamp created_at
    }
    ledger_entries {
        uuid id PK
        uuid wallet_id FK
        numeric amount "numeric(19,4), signed, CHECK <> 0"
        enum type "credit (>0) | debit (<0)"
        uuid reference "original link to the transaction (NOT NULL)"
        uuid transaction_id "same link, newer name; back-filled from reference"
        timestamp created_at
    }
    transactions {
        uuid id PK
        enum type "deposit | transfer | withdrawal"
        numeric amount "numeric(19,4), CHECK > 0"
        uuid from_user_id FK "null for deposit"
        uuid to_user_id FK "null for withdrawal"
        string idempotency_key UK "UNIQUE, NOT NULL — the backstop"
        string status "pending|completed|failed|reversed"
        timestamp created_at
    }
    idempotency_keys {
        uuid id PK "= the client's idempotency key"
        uuid user_id FK
        string endpoint
        string request_hash
        int status_code
        jsonb response_body "stored response, replayed on retry"
        string state "pending | completed"
        timestamp created_at
        timestamp completed_at
    }
```

### Transfer flow

```mermaid
sequenceDiagram
    actor Client
    participant API as API (route + plugins)
    participant SVC as Wallet service
    participant DB as PostgreSQL

    Client->>API: POST /wallets/transfer (JWT, x-idempotency-key, {recipient, amount})
    API->>API: verify JWT (401 if invalid)
    API->>API: validate body with Zod (400 if invalid)
    API->>DB: look up idempotency key (user_id, key)
    alt key already completed
        DB-->>API: stored result
        API-->>Client: replay original response
    else new key
        API->>SVC: transfer(sender, recipient, amount)
        SVC->>DB: BEGIN transaction
        SVC->>DB: SELECT ... FOR UPDATE both wallets, ascending id order
        Note over SVC,DB: fixed lock order prevents A to B / B to A deadlock
        SVC->>SVC: balance = SUM(ledger), check funds INSIDE the lock
        alt insufficient funds
            SVC->>DB: ROLLBACK
            SVC-->>Client: insufficient funds error
        else sufficient
            SVC->>DB: INSERT debit ledger row (sender)
            SVC->>DB: INSERT credit ledger row (recipient)
            SVC->>DB: INSERT transaction row
            SVC->>DB: mark idempotency key completed
            SVC->>DB: COMMIT
            SVC-->>Client: 201 transfer complete
        end
    end
```


