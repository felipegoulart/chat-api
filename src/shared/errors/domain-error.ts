import { InternalError } from "./internal-error.js";
import type { FieldErrors } from "./zod-error-transform.js";

export class DomainError extends InternalError {
  public readonly fields?: FieldErrors;

  constructor(message: string, statusCode: number = 400, description?: string, fields?: FieldErrors) {
    super(message, statusCode, description);
    this.fields = fields;
  }
}
