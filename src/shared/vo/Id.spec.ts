import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { DomainError } from "../errors/domain-error.js";
import { Id } from "./Id.js";

describe("UNIT -> Id value object", () => {
  it("should create an Id with a valid UUID if no value is provided", () => {
    const id = new Id();
    expect(id).toBeInstanceOf(Id);
    // Regex to check for a valid v4 UUID
    expect(id.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("should create an Id with the provided valid UUID", () => {
    const validUUID = randomUUID();
    const id = new Id(validUUID);
    expect(id).toBeInstanceOf(Id);
    expect(id.toString()).toBe(validUUID);
  });

  it("should throw a DomainError if an invalid UUID is provided", () => {
    const invalidUUID = "not-a-uuid";
    expect(() => new Id(invalidUUID)).toThrow(
      new DomainError("Invalid Id", 400, "The provided ID is not a valid UUID.", {
        id: ["The provided ID is not a valid UUID."],
      }),
    );
  });

  it("should throw a DomainError with correct details for an invalid UUID", () => {
    const invalidUUID = "not-a-uuid";
    try {
      new Id(invalidUUID);
      // Fail test if constructor does not throw
      expect.fail("Constructor should have thrown a DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toHaveProperty("statusCode", 400);
      expect(error).toHaveProperty("description", "The provided ID is not a valid UUID.");
      expect(error).toHaveProperty("fields", { id: ["The provided ID is not a valid UUID."] });
    }
  });

  it("should return the string value of the Id when toString() is called", () => {
    const validUUID = randomUUID();
    const id = new Id(validUUID);
    expect(id.toString()).toBe(validUUID);
  });

  describe("equals()", () => {
    it("should return true for two Id instances with the same value", () => {
      const uuid = randomUUID();
      const id1 = new Id(uuid);
      const id2 = new Id(uuid);
      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for two Id instances with different values", () => {
      const id1 = new Id();
      const id2 = new Id();
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
