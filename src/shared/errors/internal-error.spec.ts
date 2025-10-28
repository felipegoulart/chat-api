import { describe, expect, it } from "vitest";
import { InternalError } from "./internal-error.js";

describe("UNIT -> InternalError", () => {
  it("should create an instance of InternalError with default values", () => {
    const errorMessage = "Something went wrong";
    const error = new InternalError(errorMessage);

    expect(error).toBeInstanceOf(InternalError);
    expect(error.message).toBe(errorMessage);
    expect(error.statusCode).toBe(500);
    expect(error.description).toBeUndefined();
    expect(error.name).toBe("InternalError");
  });

  it("should create an instance with a specific code", () => {
    const errorMessage = "Not Found";
    const errorCode = 404;
    const error = new InternalError(errorMessage, errorCode);

    expect(error.message).toBe(errorMessage);
    expect(error.statusCode).toBe(errorCode);
    expect(error.description).toBeUndefined();
  });

  it("should create an instance with a specific code and description", () => {
    const errorMessage = "Bad Request";
    const errorCode = 400;
    const errorDescription = "Invalid input provided";
    const error = new InternalError(errorMessage, errorCode, errorDescription);

    expect(error.message).toBe(errorMessage);
    expect(error.statusCode).toBe(errorCode);
    expect(error.description).toBe(errorDescription);
  });

  it("should have a stack trace", () => {
    const error = new InternalError("Test stack trace");
    expect(error.stack).toBeDefined();
    expect(error.stack).toEqual(expect.any(String));
  });
});
