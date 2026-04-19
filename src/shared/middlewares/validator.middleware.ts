import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import httpStatus from "http-status";
import { ErrorResponse } from "../utils/response.util";

const validate = <T>(schema: z.ZodType<T, any, any>) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const firstErrorMessage = formattedErrors[0]?.message;

      return res
        .status(httpStatus.BAD_REQUEST)
        .send(ErrorResponse(firstErrorMessage ?? "Your data is invalid", formattedErrors));
    }

    req.body = result.data;
  };
};

export default validate;
