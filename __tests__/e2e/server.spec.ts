import type { FastifyInstance } from "fastify";
import { beforeAll, describe, expect, it } from "vitest";
import { HttpServer } from "../../src/server";

const server = new HttpServer();

describe("E2E -> Server", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await server.createServer();
  });

  it("should return a Luffy's promise", async () => {
    const response = await app.inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("The Pirate King I'll be!");
  });

  it("should return ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("ok");
  });
});
