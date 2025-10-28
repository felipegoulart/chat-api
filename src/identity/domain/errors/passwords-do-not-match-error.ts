import status from "statuses";
import { DomainError } from "@/shared/errors/domain-error.js";
import type { FieldErrors } from "@/shared/errors/zod-error-transform.js";

export class PasswordsDoNotMatchError extends DomainError {
  constructor({
    message = "Passwords don't match",
    description = "The password and confirm password don't match.",
    statusCode = status("unprocessable entity"),
    fields = {},
  }: {
    message?: string;
    description?: string;
    statusCode?: number;
    fields?: FieldErrors;
  }) {
    super(message, statusCode, description, fields);
  }
}
