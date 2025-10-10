import { randomUUID } from "node:crypto";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { RawData } from "ws";

export class WebSocketHandler {
  private readonly sockets: Map<string, WebSocket> = new Map();
  private readonly app: FastifyInstance;
  private static instance: WebSocketHandler;

  private constructor(app: FastifyInstance) {
    this.app = app;
    this.subscribe();
  }

  static getInstance(fastify: FastifyInstance) {
    if (!WebSocketHandler.instance) {
      WebSocketHandler.instance = new WebSocketHandler(fastify);
    }

    return WebSocketHandler.instance;
  }

  public async connectionHandler(socket: WebSocket, request: FastifyRequest) {
    const { id } = request.user;
    const { sessionId: userSessionId } = request.cookies;
    const sessionId = userSessionId ?? randomUUID();

    try {
      this.sockets.set(sessionId, socket);

      socket.on("message", (data: RawData) => {
        this.handleIncomingRequest(id, data);
      });

      socket.on("close", () => {
        console.log(`User: ${id} was disconnected.`);
        this.sockets.delete(sessionId);
      });
    } catch (error) {
      socket.terminate();
      console.error(error);
    }
  }

  private async handleIncomingRequest(userId: string, data: RawData) {
    await this.app.redisPublisher.PUBLISH("user:message:send", data.toString());
  }

  private handleBroadcastMessage(message: string, channel: string) {
    this.sockets.entries().forEach(([sessionId, socket]) => {
      socket.send(message);
    });
  }

  private async subscribe() {
    try {
      await this.app.redisSubscriber.PSUBSCRIBE("user:*", this.handleBroadcastMessage.bind(this));
    } catch (error) {
      console.error(error);
    }
  }
}
