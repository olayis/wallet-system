# Mini Payment & Wallet Backend System

A fintech-inspired backend system that simulates core wallet and payment operations using a **ledger-based accounting model**.


## Features

* User and wallet management
* Deposit and transfer operations
* Double-entry ledger system (financial source of truth)
* Idempotent APIs (safe retries)
* Concurrency-safe transfers (row-level locking)
* Transaction history (business layer)
* Balance computation from ledger


## Core Design Principles

### 1. Ledger-Based Accounting

All balances are derived from immutable ledger entries:

```
Balance = SUM(ledger_entries.amount)
```

* No direct reliance on mutable balances
* Fully auditable system
* Prevents data inconsistencies

### 2. Separation of Concerns

| Layer        | Responsibility                             |
| ------------ | ------------------------------------------ |
| Transactions | Business events (e.g. transfers, deposits) |
| Ledger       | Financial truth (money movement)           |

### 3. Idempotency

All financial endpoints support idempotency using:

```
Idempotency-Key (header)
```

This ensures:

* Safe retries
* No duplicate transactions
* Consistent responses

### 4. Concurrency Control

Transfers use:

* Database transactions
* Row-level locking (`FOR UPDATE`)
* Consistent lock ordering

This prevents:

* Race conditions
* Double spending
* Deadlocks

## System Architecture

```
Client
  ↓
Fastify API
  ↓
Service Layer
  ↓
PostgreSQL
  ├── users
  ├── wallets (balance cache)
  ├── transactions (business events)
  └── ledger_entries (source of truth)
```

## Transfer Flow

```
POST /wallets/transfer

1. Validate request
2. Check idempotency
3. Start DB transaction
4. Lock wallets (ordered)
5. Compute balance from ledger
6. Validate sufficient funds
7. Create transaction (business record)
8. Create ledger entries (debit + credit)
9. Commit transaction
```

## Data Model

### Transactions (Business Layer)

* One record per operation
* Represents intent

```json
{
  "id": "uuid",
  "type": "transfer",
  "amount": 5000,
  "from_user_id": "uuid",
  "to_user_id": "uuid"
}
```

### Ledger Entries (Financial Layer)

* Multiple records per transaction
* Represents money movement

```json
{
  "wallet_id": "uuid",
  "amount": -5000,
  "type": "transfer",
  "reference": "transaction_id"
}
```

## Tech Stack

* Node.js
* Fastify
* TypeScript
* PostgreSQL
* Knex.js

## Getting Started

### 1. Install dependencies

```
npm install
```

### 2. Setup environment variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wallet_system
DB_USER=postgres
DB_PASSWORD=yourpassword
```

### 3. Run migrations

```
npx knex migrate:latest
```

### 4. Start the server

```
npm run dev
```

## Example Endpoints

### Health Check

```
GET /health
```

### Deposit

```
POST /wallets/deposit
Headers:
  Idempotency-Key: <unique-key>
```

### Transfer

```
POST /wallets/transfer
Headers:
  Idempotency-Key: <unique-key>
```
