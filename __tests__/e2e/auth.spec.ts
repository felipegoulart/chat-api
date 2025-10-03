import type { FastifyInstance } from "fastify";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/server";

describe("E2E -> Authorization", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  it("should allow to create an user", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
    });

    expect(response.statusCode).toBe(201);
    expect(await response.json()).toEqual({
      message: "Created",
    });
  });
});
