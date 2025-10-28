import status from "statuses";
import z from "zod";
import type { DomainError } from "./domain-error.js";
import type { InternalError } from "./internal-error.js";

export const apiErrorResponseFormatterReturnSchema = z.object({
  code: z.number(),
  message: z.string(),
  error: z.string(),
  description: z.string().optional(),
  fields: z.record(z.string(), z.array(z.string())).optional(),
});

export type ApiErrorResponseFormatterReturn = z.infer<typeof apiErrorResponseFormatterReturnSchema>;

export function apiErrorResponseFormatter<T extends InternalError & DomainError>(
  error: T,
): ApiErrorResponseFormatterReturn {
  return {
    message: error.message,
    code: error.statusCode,
    error: error.codeAsString ? error.codeAsString : status(error.statusCode),
    ...(error.description && { description: error.description }),
    ...(error.fields && { fields: error.fields }),
  };
}
