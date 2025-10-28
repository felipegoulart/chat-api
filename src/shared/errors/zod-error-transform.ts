// src/utils/formatZodError.ts
import type { ZodError } from "zod";

export type FieldErrors = Record<string, string[]>;

export const formatZodError = (error: ZodError): FieldErrors => {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const pathKey = issue.path.join(".") || "global";

    if (!fieldErrors[pathKey]) {
      fieldErrors[pathKey] = [];
    }

    fieldErrors[pathKey].push(issue.message);
  }

  return fieldErrors;
};
