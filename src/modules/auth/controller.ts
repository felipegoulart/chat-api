import { hash } from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";
import z from "zod";
import { User } from "../user/index.js";

export const createUserBodySchema = z
  .object({
    nickname: z.string().min(3).max(36),
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

export type CreateUser = z.infer<typeof createUserBodySchema>;
export class AuthController {
  public async register(request: FastifyRequest<{ Body: CreateUser }>, reply: FastifyReply) {
    const { nickname, password, email } = request.body;

    const result = await User.findOne({ email });
    if (result) {
      return reply.status(status.CONFLICT).send({ message: "User already exists" });
    }

    const hashedPassword = await hash(password, 10);

    await User.create({ nickname, password: hashedPassword, email });

    return reply.status(status.CREATED).send({ message: status[201] });
  }
}
