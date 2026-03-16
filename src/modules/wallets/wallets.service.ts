import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { Knex } from "knex";

export async function depositToWallet(
  fastify: FastifyInstance,
  userId: string,
  amount: number,
) {
  return fastify.db.transaction(async (trx) => {
    // Find user wallet
    const wallet = await trx("wallets").where({ user_id: userId }).first();

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Update balance atomically
    const newBalance = Number(wallet.balance) + amount;

    await trx("wallets")
      .where({ id: wallet.id })
      .update({ balance: newBalance });

    // Insert transaction record
    await trx("transactions").insert({
      id: randomUUID(),
      wallet_id: wallet.id,
      type: "deposit",
      amount,
      description: "Deposit",
    });

    return {
      wallet_id: wallet.id,
      balance: newBalance,
    };
  });
}

export async function transferBetweenUsers(
  trx: Knex.Transaction,
  fromUserId: string,
  toUserId: string,
  amount: number,
) {
  // Get sender wallet
  const sender = await trx("wallets").where({ user_id: fromUserId }).first();
  if (!sender) throw new Error("Sender wallet not found");

  // Get receiver wallet
  const receiver = await trx("wallets").where({ user_id: toUserId }).first();
  if (!receiver) throw new Error("Receiver wallet not found");

  // Check balance
  if (Number(sender.balance) < amount) throw new Error("Insufficient funds");

  const newSenderBalance = Number(sender.balance) - amount;
  const newReceiverBalance = Number(receiver.balance) + amount;

  // Update balances
  await trx("wallets")
    .where({ id: sender.id })
    .update({ balance: newSenderBalance });

  await trx("wallets")
    .where({ id: receiver.id })
    .update({ balance: newReceiverBalance });

  // Record transactions
  await trx("transactions").insert([
    {
      id: randomUUID(),
      wallet_id: sender.id,
      type: "transfer",
      amount: -amount,
      description: `Transfer to ${toUserId}`,
    },
    {
      id: randomUUID(),
      wallet_id: receiver.id,
      type: "transfer",
      amount,
      description: `Transfer from ${fromUserId}`,
    },
  ]);

  return {
    from_wallet_balance: newSenderBalance,
    to_wallet_balance: newReceiverBalance,
  };
}
