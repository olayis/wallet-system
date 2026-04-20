# Mini Payment & Wallet Backend System

A fintech-inspired backend system that simulates core wallet and payment operations using a **ledger-based accounting model** and **layered architecture**.

## Features

- **Layered Architecture**: Decoupled Controllers, Services, and Repositories.
- **Double-Entry Ledger**: Financial source of truth using `credit` and `debit` entries.
- **Idempotent APIs**: Native database-level uniqueness for safe retries via `x-idempotency-key`.
- **Concurrency-Safe**: Row-level locking to prevent race conditions during transfers.
- **Isolated Testing**: Dedicated test database setup with automated migrations.

## Tech Stack

- **Runtime**: Node.js (TypeScript)
- **Framework**: Fastify
- **ORM/Query Builder**: Objection.js / Knex.js
- **Database**: PostgreSQL
- **DI/IoC**: tsyringe
- **Validation**: Zod
- **Testing**: Vitest + Supertest

## Core Design Principles

### 1. Ledger-Based Accounting

Balances are derived from immutable ledger entries.
`Balance = SUM(ledger_entries.amount)`
This ensures a fully auditable system and prevents drift between "cached" balances and transaction history.

### 2. Idempotency

All mutation endpoints require a valid UUID in the `x-idempotency-key` header. This prevents duplicate processing of the same request at the database engine level.

## Getting Started

### 1. Setup Environment

Create a `.env` file in the root based on the following template:

```bash
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wallet_db
DB_NAME_TEST=wallet_db_test
DB_USER=your_user
DB_PASSWORD=your_password
```

### 2. Create Databases

```bash
# Development Database
createdb wallet_db

# Test Database
createdb wallet_db_test
```

### 3. Installation & Database Init

```bash
npm install
npm run knex -- migrate:latest
```

### 4. Running the App

```bash
# Development mode
npm run dev

# Run test suite
npm test
```

## API Documentation

### Endpoints

| Method | Endpoint                   | Description                                                 |
| ------ | -------------------------- | ----------------------------------------------------------- |
| `POST` | `/wallets/deposit`         | Deposit funds. Requires `x-idempotency-key`.                |
| `POST` | `/wallets/transfer`        | Transfer funds between users. Requires `x-idempotency-key`. |
| `GET`  | `/wallets/:userId/balance` | Retrieve real-time balance for a user.                      |
| `GET`  | `/health`                  | System health check.                                        |

### Header Requirements

- `x-idempotency-key`: **Required** for POST operations. Must be a valid UUID.

## Directory Structure

```text
src/
├── config/             # App and Knex configurations
├── db/                 # Migrations and Seeds
├── modules/
│   ├── users/          # User domain
│   └── wallets/        # Core wallet logic (Services, Repositories, Controllers)
├── shared/             # Middlewares, Errors, and Utilities
└── tests/              # Vitest suites and global setup
```
