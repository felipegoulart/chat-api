import { hash } from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";
import z from "zod";
import { User } from "./model.js";

export const createUserBodySchema = z
  .object({
    username: z.string().min(3).max(36),
    email: z.email(),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Your password must have at least 8 characters, one uppercase, one lowercase, one number and one special character",
      ),
    confirm: z.string(),
  })
  .refine((data) => data.confirm === data.password, {
    error: "Passwords don't match",
    path: ["confirm"],
  });

export type createUser = z.infer<typeof createUserBodySchema>;

export class UserController {
  async create(request: FastifyRequest<{ Body: createUser }>, reply: FastifyReply) {
    const { confirm: confirmPassword, email, password, username } = request.body;

    if (confirmPassword !== password) {
      return reply.status(status.UNPROCESSABLE_ENTITY).send({ message: status[422] });
    }

    const hashedPassword = await hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      username,
    });

    await user.save();

    reply.status(status.CREATED).send({
      message: status[201],
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  }
}
