import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

const validate = <T>(schema: z.ZodType<T, any, any>) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).send({
        error: "Your data is invalid",
        issues: formattedErrors,
      });
    }

    req.body = result.data;
  };
};

export default validate;
