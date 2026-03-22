import { Knex } from "knex";
import { randomUUID } from "node:crypto";

export async function createLedgerEntry(
  trx: Knex.Transaction,
  walletId: string,
  amount: number,
  type: string,
  reference: string,
) {
  await trx("ledger_entries").insert({
    id: randomUUID(),
    wallet_id: walletId,
    amount,
    type,
    reference,
  });
}

export async function getWalletBalance(
  trx: Knex.Transaction | Knex,
  walletId: string,
): Promise<number> {
  const result = await trx("ledger_entries")
    .where({ wallet_id: walletId })
    .sum({ balance: "amount" })
    .first();

  return Number(result?.balance || 0);
}
