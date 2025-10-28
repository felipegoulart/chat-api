import { describe, expect, it } from "vitest";
import { DomainError } from "./domain-error.js";

describe("UNIT -> DomainError", () => {
  it("should create an instance with default status code", () => {
    const error = new DomainError("Validation Error");

    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe("Validation Error");
    expect(error.statusCode).toBe(400);
    expect(error.description).toBeUndefined();
    expect(error.fields).toBeUndefined();
    expect(error.name).toBe("DomainError");
  });

  it("should create an instance with a specific status code and description", () => {
    const error = new DomainError("Conflict", 409, "Resource already exists");

    expect(error.message).toBe("Conflict");
    expect(error.statusCode).toBe(409);
    expect(error.description).toBe("Resource already exists");
    expect(error.fields).toBeUndefined();
  });

  it("should create an instance with field errors", () => {
    const fieldErrors = { email: ["Invalid format"] };
    const error = new DomainError("Invalid Data", 422, "Validation failed", fieldErrors);

    expect(error.message).toBe("Invalid Data");
    expect(error.statusCode).toBe(422);
    expect(error.description).toBe("Validation failed");
    expect(error.fields).toEqual(fieldErrors);
  });

  it("should inherit from InternalError", () => {
    const error = new DomainError("Test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.stack).toBeDefined();
  });
});
