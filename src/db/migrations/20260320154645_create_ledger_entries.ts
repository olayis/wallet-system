import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ledger_entries", (table) => {
    table.uuid("id").primary();

    table.uuid("wallet_id").notNullable();
    table.foreign("wallet_id").references("id").inTable("wallets");

    table.decimal("amount", 14, 2).notNullable();
    table.enum("type", ["credit", "debit"]).notNullable();

    table.uuid("reference").notNullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("ledger_entries");
}
