import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import httpStatus from "http-status";
import { ErrorResponse } from "../utils/response.util";

const validate = <T>(schema: z.ZodType<T, any, any>, target: "body" | "query" | "params" | "headers" = "body") => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const dataToValidate = req[target];
    const result = schema.safeParse(dataToValidate);

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

    req[target] = result.data;
  };
};

export default validate;
