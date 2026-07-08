import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.uuid("id").primary();
    table.enum("type", ["deposit", "transfer"]).notNullable();
    table.decimal("amount", 14, 2).notNullable();

    table
      .uuid("from_user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table
      .uuid("to_user_id")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("status").defaultTo("completed");
    table.string("idempotency_key").unique().nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("transactions");
}
