import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../../src/server";

describe("E2E -> Server", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createServer();
    await app.ready();
  });

  it("", async () => {
    const response = await app.inject({ method: "GET", url: "/rooms" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      results: [
        {
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          code: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ],
    });
  });
});
