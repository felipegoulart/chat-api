import type { FastifyReply, FastifyRequest } from "fastify";
import { status } from "http-status";
import { Types } from "mongoose";
import z from "zod";
import { SessionHandler } from "@/shared/session-handler.js";
import { User } from "../user/model.js";
import { toChatChannelResponse } from "./mappers.js";
import { ChatChannelModel } from "./model.js";

const searchChatChannelQuerySchema = z.object({
  q: z.string().min(1).max(50).optional(),
});

export type SearchChatChannelsQuery = z.infer<typeof searchChatChannelQuerySchema>;

export const createChatChannelBodySchema = z.object({
  adminId: z.string(),
  name: z.string().min(3).max(50),
  description: z.string().min(3).max(255).optional(),
});

export type createChatChannel = z.infer<typeof createChatChannelBodySchema>;

export const createChatChannelResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  code: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatChannelResponse = z.infer<typeof createChatChannelResponseSchema>;

const sessionHandler = new SessionHandler();

export class ChatChannelController {
  async list(request: FastifyRequest<{ Headers: { user: string } }>, reply: FastifyReply) {
    try {
      const results = await ChatChannelModel.find({ members: request.headers.user }).sort({ createdAt: -1 });

      return reply.code(status.OK).send({
        count: results.length, // TODO: implement pagination
        data: results.map(toChatChannelResponse),
        message: status[200],
        total: results.length,
      });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  }

  async getByCode(request: FastifyRequest<{ Params: { code: string } }>, reply: FastifyReply) {
    const { code } = request.params;

    const chatChannel = await ChatChannelModel.findOne({ code });

    if (!chatChannel) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    return reply.status(status.OK).send({
      message: status[200],
      count: 1,
      total: 1,
      data: toChatChannelResponse(chatChannel),
    });
  }

  async create(request: FastifyRequest<{ Body: createChatChannel }>, reply: FastifyReply) {
    const { name, description, adminId } = request.body;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    const channel = new ChatChannelModel({ name, description, code, adminId: adminId, members: [adminId] });

    await channel.save();

    await User.updateOne({ _id: adminId }, { $push: { chatChannel: channel._id } });

    return reply.status(status.CREATED).send({
      message: status[201],
      count: 1,
      total: 1,
      data: toChatChannelResponse(channel),
    });
  }

  async join(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;

    const userId = new Types.ObjectId(user);

    const channel = await ChatChannelModel.findOne({ code });
    if (!channel) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    if (channel.members.includes(userId)) {
      return reply.status(status.CONFLICT).send({ message: status[409] });
    }

    channel.members.push(userId);
    await channel.save();

    await User.updateOne({ _id: userId }, { $push: { chatChannel: channel._id } });

    return reply.status(status.OK).send({ message: `User ${userId.toString()} joined channel` });
  }

  async leave(request: FastifyRequest<{ Params: { code: string }; Headers: { user: string } }>, reply: FastifyReply) {
    const { code } = request.params;
    const { user } = request.headers;
    const userId = new Types.ObjectId(user);

    const channel = await ChatChannelModel.findOneAndUpdate({ code }, { $pull: { members: userId } });
    if (!channel) {
      return reply.status(status.NOT_FOUND).send({ message: status[404] });
    }

    await User.updateOne({ _id: userId }, { $pull: { chatChannel: channel._id } });

    return reply.status(status.OK).send({ message: status[200] });
  }
}
