import { FastifyReply, FastifyRequest } from "fastify";
import { depositSchema, transferSchema } from "./wallets.schema";
import { depositToWallet, transferBetweenUsers } from "./wallets.service";

export async function depositHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { user_id, amount } = depositSchema.parse(request.body);

    const result = await depositToWallet(request.server, user_id, amount);

    return reply.code(200).send(result);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return reply.code(400).send({
        error: "Invalid request",
        issues: err.errors,
      });
    }

    if (err.message === "Wallet not found") {
      return reply.code(404).send({ error: err.message });
    }

    console.error("err: ", err);

    request.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
}

export async function transferHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const key = request.headers["idempotencyKey"];
  const endpoint = request.url;

  try {
    const { from_user_id, to_user_id, amount } = transferSchema.parse(
      request.body,
    );

    const result = await request.server.db.transaction(async (trx) => {
      const existingKey = await trx("idempotency_keys")
        .where({
          id: key,
          endpoint,
        })
        .first();

      if (existingKey?.completed) return existingKey.response;

      const transferResult = await transferBetweenUsers(
        trx,
        from_user_id,
        to_user_id,
        amount,
      );

      await trx("idempotency_keys")
        .where({ id: key })
        .update({ completed: true, response: transferResult });

      return transferResult;
    });

    return reply.code(200).send(result);
  } catch (err: any) {
    if (err?.name === "ZodError") {
      return reply.code(400).send({ error: "Invalid request" });
    }

    if (
      err.message === "Insufficient funds" ||
      err.message.includes("not found")
    ) {
      return reply.code(400).send({ error: err.message });
    }

    request.log.error(err);
    return reply.code(500).send({ error: "Internal server error" });
  }
}
