import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.uuid("id").primary();
    table.uuid("wallet_id").notNullable().references("id").inTable("wallets");
    table.enum("type", ["deposit", "transfer"]).notNullable();
    table.decimal("amount", 14, 2).notNullable();
    table.string("description").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("transactions");
}
