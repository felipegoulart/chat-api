import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";
import z from "zod";
import { User } from "./model.js";

export const createUserBodySchema = z
  .object({
    username: z.string().min(3).max(36),
    email: z.email(),
    password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.confirmPassword === data.password);

export type createUser = z.infer<typeof createUserBodySchema>;

export class UserController {
  async create(request: FastifyRequest<{ Body: createUser }>, reply: FastifyReply) {
    const { confirmPassword, email, password, username } = request.body;

    if (confirmPassword !== password) {
      return reply.status(status.UNPROCESSABLE_ENTITY).send({ message: status[422] });
    }

    await User.create({
      email,
      password,
      username,
    });

    reply.status(status.CREATED).send({
      message: status[201],
    });
  }
}
