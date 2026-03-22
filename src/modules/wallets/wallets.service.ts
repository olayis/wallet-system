import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { Knex } from "knex";
import { createLedgerEntry, getWalletBalance } from "../ledgers/ledger.service";

/**
 * Deposit funds to a user's wallet
 * @param fastify
 * @param userId
 * @param amount
 * @returns New wallet balance after deposit
 */
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

    // Update balance cache
    await trx("wallets")
      .where({ id: wallet.id })
      .update({ balance: trx.raw("balance + ?", [amount]) });

    const transactionId = randomUUID();

    await createLedgerEntry(trx, wallet.id, amount, "deposit", transactionId);

    // Insert transaction record
    await trx("transactions").insert({
      id: transactionId,
      to_user_id: userId,
      type: "deposit",
      amount,
    });

    const balance = await getWalletBalance(trx, wallet.id);

    return {
      wallet_id: wallet.id,
      balance,
    };
  });
}

/**
 * Transfer funds between two users' wallets
 * @param trx
 * @param fromUserId
 * @param toUserId
 * @param amount
 * @returns New balances for both wallets after transfer
 */
export async function transferBetweenUsers(
  trx: Knex.Transaction,
  fromUserId: string,
  toUserId: string,
  amount: number,
) {
  // Get wallets for sender and receiver
  const wallets = await trx("wallets").whereIn("user_id", [
    fromUserId,
    toUserId,
  ]);

  const sender = wallets.find((wallet) => wallet.user_id === fromUserId);
  const receiver = wallets.find((wallet) => wallet.user_id === toUserId);

  if (!sender) throw new Error("Sender wallet not found");
  if (!receiver) throw new Error("Receiver wallet not found");

  // Lock both rows for updates in consistent order
  await trx("wallets")
    .whereIn("id", [sender.id, receiver.id])
    .orderBy("id")
    .forUpdate();

  // Check balance from ledger
  const senderBalance = await getWalletBalance(trx, sender.id);

  if (senderBalance < amount) throw new Error("Insufficient funds");

  const newSenderBalance = Number(sender.balance) - amount;
  const newReceiverBalance = Number(receiver.balance) + amount;

  // Update balances
  await trx("wallets")
    .where({ id: sender.id })
    .update({ balance: newSenderBalance });

  await trx("wallets")
    .where({ id: receiver.id })
    .update({ balance: newReceiverBalance });

  const transactionId = randomUUID();

  // Record ledger entries
  await createLedgerEntry(trx, sender.id, -amount, "transfer", transactionId);
  await createLedgerEntry(trx, receiver.id, amount, "transfer", transactionId);

  // Record transaction
  await trx("transactions").insert([
    {
      id: transactionId,
      type: "transfer",
      amount,
      from_user_id: fromUserId,
      to_user_id: toUserId,
    },
  ]);

  return {
    from_wallet_balance: newSenderBalance,
    to_wallet_balance: newReceiverBalance,
  };
}
