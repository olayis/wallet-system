import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wallets", (t) => {
    t.dropColumn("balance");
  });
  await knex.raw("ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id)");

  await knex.raw("ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(19,4)");
  await knex.raw("ALTER TABLE transactions ALTER COLUMN idempotency_key SET NOT NULL");
  await knex.raw("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check");
  await knex.raw(`
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_type_check
        CHECK (type IN ('deposit','transfer','withdrawal'))
  `);
  await knex.raw(`
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0),
      ADD CONSTRAINT transactions_status_valid CHECK (status IN ('pending','completed','failed','reversed')),
      ADD CONSTRAINT transactions_shape_valid CHECK (
        (type = 'deposit'    AND from_user_id IS NULL     AND to_user_id IS NOT NULL) OR
        (type = 'transfer'   AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL AND from_user_id <> to_user_id) OR
        (type = 'withdrawal' AND from_user_id IS NOT NULL AND to_user_id IS NULL)
      )
  `);
  await knex.schema.alterTable("transactions", (t) => {
    t.index(["from_user_id", "created_at"], "transactions_from_user_idx");
    t.index(["to_user_id", "created_at"], "transactions_to_user_idx");
  });

  await knex.raw("ALTER TABLE ledger_entries ALTER COLUMN amount TYPE numeric(19,4)");
  await knex.schema.alterTable("ledger_entries", (t) => {
    t.uuid("transaction_id").nullable();
    t.index(["wallet_id", "created_at"], "ledger_wallet_created_idx");
    t.index("reference", "ledger_reference_idx");
  });
  await knex.raw(`
    UPDATE ledger_entries SET transaction_id = reference
    WHERE transaction_id IS NULL
      AND EXISTS (SELECT 1 FROM transactions t WHERE t.id = ledger_entries.reference)
  `);
  await knex.raw(`
    ALTER TABLE ledger_entries
      ADD CONSTRAINT ledger_entries_amount_nonzero CHECK (amount <> 0),
      ADD CONSTRAINT ledger_entries_sign_matches_type CHECK (
        (type = 'credit' AND amount > 0) OR (type = 'debit' AND amount < 0)
      )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_amount_nonzero");
  await knex.raw("ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_sign_matches_type");
  await knex.schema.alterTable("ledger_entries", (t) => {
    t.dropIndex(["wallet_id", "created_at"], "ledger_wallet_created_idx");
    t.dropIndex("reference", "ledger_reference_idx");
    t.dropColumn("transaction_id");
  });

  await knex.raw("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_positive");
  await knex.raw("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_valid");
  await knex.raw("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_shape_valid");
  await knex.raw("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check");
  await knex.raw(`
    ALTER TABLE transactions
      ADD CONSTRAINT transactions_type_check CHECK (type IN ('deposit','transfer'))
  `);
  await knex.schema.alterTable("transactions", (t) => {
    t.dropIndex(["from_user_id", "created_at"], "transactions_from_user_idx");
    t.dropIndex(["to_user_id", "created_at"], "transactions_to_user_idx");
  });
  await knex.raw("ALTER TABLE transactions ALTER COLUMN idempotency_key DROP NOT NULL");

  await knex.raw("ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_unique");
  await knex.schema.alterTable("wallets", (t) => {
    t.decimal("balance", 14, 2).notNullable().defaultTo(0);
  });
}
