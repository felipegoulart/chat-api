import crypto from "node:crypto";
import { compare, hash } from "bcryptjs";
import dayjs from "dayjs";
import type { FastifyReply, FastifyRequest } from "fastify";
import status from "http-status";
import z from "zod";
import { env } from "@/env.js";
import { redis } from "@/infra/cache/redis.js";
import { MailSender } from "@/shared/mail-sender.js";
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
  public async login(request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
    const { email, password } = request.body;

    const user = await User.findOne({ email });
    if (!user) {
      return reply.status(status.NOT_FOUND).send({ message: "User or password is incorrect" });
    }

    const isCorrectPassword = await compare(password, user.password);
    if (!isCorrectPassword) {
      return reply.status(status.NOT_FOUND).send({ message: "User or password is incorrect" });
    }

    const refreshToken = await reply.jwtSign({ sub: user._id });
    const accessToken = await reply.jwtSign({ sub: user._id }, { expiresIn: "7d" });

    reply.setCookie("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      expires: dayjs().add(7, "days").toDate(),
    });

    return reply.status(status.OK).send({ message: status[200], data: { accessToken } });
  }

  public async register(request: FastifyRequest<{ Body: CreateUser }>, reply: FastifyReply) {
    const { nickname, password, email } = request.body;

    const result = await User.findOne({ email });
    if (result) {
      return reply.status(status.CONFLICT).send({ message: "User already exists" });
    }

    const hashedPassword = await hash(password, 10);

    const user = new User({ nickname, password: hashedPassword, email });

    const token = crypto.randomUUID();

    user.verified.isVerified = false;
    user.verified.token = token;
    user.verified.tokenCreatedAt = new Date();

    await user.save();

    // TODO: Move to async strategy
    const mailSender = new MailSender({
      email: env.APP_EMAIL_ADDRESS || "",
      name: "Checkpoint App",
    });

    mailSender.setTemplateId("z86org8omwn4ew13");
    mailSender.setRecipient({ email, name: nickname });
    mailSender.setSubject("Welcome to Checkpoint!");
    mailSender.setTags(["verify-email"]);

    mailSender.setPersonalization([
      {
        email: email,
        data: {
          name: nickname,
          verifyLink: `http://localhost:3000/auth/verify?token=${token}`,
        },
      },
    ]);

    mailSender.send();

    return reply.status(status.CREATED).send({ message: status[201] });
  }

  public async verify(request: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) {
    const { token } = request.query;

    const user = await User.findOne({ "verified.token": token });
    if (!user) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    if (user.verified.isVerified) {
      return reply.status(status.CONFLICT).send({ message: status[409] });
    }

    const isTokenExpired = dayjs(user.verified.tokenCreatedAt).add(24, "hours").isBefore(dayjs());
    if (isTokenExpired) {
      return reply.status(status.GONE).send({ message: status[410] });
    }

    user.verified.token = null;
    user.verified.tokenCreatedAt = null;
    user.verified.isVerified = true;
    user.verified.verifiedAt = new Date();

    await user.save();

    return reply.status(status.OK).send({ message: status[200] });
  }

  public async refresh(request: FastifyRequest, reply: FastifyReply) {
    const currentRefreshToken = request.cookies.refreshToken || "";

    await request.jwtDecode({ decode: { complete: true }, verify: { onlyCookie: true } });

    redis.set(currentRefreshToken, "revoked");
    redis.expire(currentRefreshToken, 60 * 60 * 24 * 7);

    const newRefreshToken = await reply.jwtSign({ sub: request.user }, { expiresIn: "7d" });
    return reply
      .setCookie("refreshToken", newRefreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        expires: dayjs().add(7, "days").toDate(),
      })
      .status(status.OK)
      .send({ message: status[200], data: { accessToken: await reply.jwtSign({ sub: request.user }) } });
  }
}
