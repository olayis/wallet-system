import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("idempotency_keys", (t) => {
    t.uuid("id").primary();
    t.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    t.string("endpoint", 128).notNullable();
    t.string("request_hash", 64).notNullable();
    t.integer("status_code").nullable();
    t.jsonb("response_body").nullable();
    t.string("state", 16).notNullable().defaultTo("pending");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("completed_at").nullable();

    t.unique(["user_id", "id"]);
    t.index(["user_id", "endpoint"]);
  });

  await knex.raw(`
    ALTER TABLE idempotency_keys
      ADD CONSTRAINT idempotency_keys_state_valid
        CHECK (state IN ('pending','completed'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("idempotency_keys");
}
