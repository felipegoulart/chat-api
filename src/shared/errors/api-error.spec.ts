import { describe, expect, it } from "vitest";
import { apiErrorResponseFormatter } from "./api-error.js";
import { DomainError } from "./domain-error.js";
import { InternalError } from "./internal-error.js";

describe("UNIT -> apiErrorResponseFormatter", () => {
  it("should format a basic InternalError correctly", () => {
    const error = new InternalError("An error occurred", 500);
    const formatted = apiErrorResponseFormatter(error);

    expect(formatted).toEqual({
      message: "An error occurred",
      code: 500,
      error: "Internal Server Error",
    });
  });

  it("should include the description when it is provided", () => {
    const error = new InternalError("Not Found", 404, "The requested resource could not be found.");
    const formatted = apiErrorResponseFormatter(error);

    expect(formatted).toEqual({
      message: "Not Found",
      code: 404,
      error: "Not Found",
      description: "The requested resource could not be found.",
    });
  });

  it("should include field errors when they are provided in a DomainError", () => {
    const fieldErrors = { email: ["Invalid email format"] };
    const error = new DomainError("Invalid Data", 422, "Validation failed", fieldErrors);
    const formatted = apiErrorResponseFormatter(error);

    expect(formatted).toEqual({
      message: "Invalid Data",
      code: 422,
      error: "Unprocessable Entity",
      description: "Validation failed",
      fields: fieldErrors,
    });
  });

  it("should format a DomainError without optional fields", () => {
    const error = new DomainError("Conflict", 409);
    const formatted = apiErrorResponseFormatter(error);

    expect(formatted).toEqual({
      message: "Conflict",
      code: 409,
      error: "Conflict",
    });
  });
});
