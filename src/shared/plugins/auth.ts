import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "@/env.js";
import { redis } from "@/infra/cache/request.redisCache.js";

const plugin = async (app: FastifyInstance) => {
  app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "refreshToken",
      signed: false,
    },
    sign: {
      expiresIn: "15m",
    },
    trusted: async (request) => {
      const refreshToken = request.cookies.refreshToken || "";
      const accessToken = request.headers.authorization?.split?.(" ")[1] || "";

      if (!refreshToken || !accessToken) return false;

      if (await request.redisCache.get(accessToken)) return false;
      if (await request.redisCache.get(refreshToken)) return false;

      return true;
    },
  });

  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.send(err);
    }
  });
};

export const authPlugin = fp(plugin, { name: "auth" });

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: {
      id: string;
    };
  }
}
