import { randomUUID } from "node:crypto";
import type { WebSocket } from "@fastify/websocket";
import type { FastifyRequest } from "fastify";
import type { RawData } from "ws";
import type { RedisEventBus } from "@/modules/message/infrastructure/event-bus.js";

export class WebSocketHandler {
  private readonly sockets: Map<string, WebSocket> = new Map();

  constructor(private readonly pubSub: RedisEventBus) {}

  public async subscribe() {
    try {
      await this.pubSub.subscribe<string>("user:*", (message) => this.handleBroadcastMessage(message));
    } catch (error) {
      console.error(error);
    }
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
    await this.pubSub.publish("ws:user:message:new", data.toString());
  }

  private handleBroadcastMessage(message: string) {
    console.log({ message });
    this.sockets.entries().forEach(([sessionId, socket]) => {
      socket.send(message);
    });
  }
}
