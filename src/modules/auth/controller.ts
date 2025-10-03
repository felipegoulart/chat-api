import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";

export class AuthController {
  public register(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(status.CREATED).send({ message: status[201] });
  }
}
