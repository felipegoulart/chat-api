import status from "statuses";
import { InternalError } from "@/shared/errors/internal-error.js";

export class EmailAlreadyExistsError extends InternalError {
  constructor(
    message: string = "Email already exists",
    description: string = "The provided email address is already registered. Please use a different email or log in.",
    code: number = status("conflict"),
  ) {
    super(message, code, description);
  }
}
