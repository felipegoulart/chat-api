import status from "statuses";
import z from "zod";
import type { InternalError } from "./internal-error.js";

export const apiErrorResponseFormatterReturnSchema = z.object({
  code: z.number(),
  message: z.string(),
  error: z.string(),
  description: z.string().optional(),
});

export type ApiErrorResponseFormatterReturn = z.infer<typeof apiErrorResponseFormatterReturnSchema>;

export function apiErrorResponseFormatter<T extends InternalError>(error: T): ApiErrorResponseFormatterReturn {
  return {
    message: error.message,
    code: error.code,
    error: error.codeAsString ? error.codeAsString : status(error.code),
    ...(error.description && { description: error.description }),
  };
}
