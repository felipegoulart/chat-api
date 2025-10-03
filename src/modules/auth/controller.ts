import { hash } from "bcryptjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";
import z from "zod";
import { MailSender } from "@/utils/mail-sender.js";
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

    const mailSender = new MailSender({
      email: "MS_vtre0r@test-y7zpl98qz9545vx6.mlsender.net", // TODO: Move it to database
      name: "Checkpoint App",
    });

    mailSender.setTemplateId("z86org8omwn4ew13");
    mailSender.setRecipient({ email, name: nickname });
    mailSender.setSubject("Welcome to Checkpoint!");
    mailSender.setTags(["verify-email"]);

    const hashedToken = await hash(email, 10); // change hash alg
    mailSender.setPersonalization([
      {
        email: email,
        data: {
          name: nickname,
          verifyLink: `http://localhost:3000/auth/verify?token=${hashedToken}`,
        },
      },
    ]);

    mailSender.send();

    return reply.status(status.CREATED).send({ message: status[201] });
  }
}
