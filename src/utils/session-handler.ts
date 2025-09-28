import type { WebSocket } from "@fastify/websocket";

interface UserSession {
  userId: string;
  room: string;
  socket: WebSocket;
}

interface Session {
  id: string;
  session: UserSession;
}

export class SessionHandler {
  private connections: Map<string, UserSession> = new Map();
  private static instance: SessionHandler;

  constructor() {
    if (SessionHandler.instance) return;

    SessionHandler.instance = this;
  }

  public initSession({ userId, room, socket }: UserSession): Session {
    const id = `${userId}:${room}`;

    const session = this.connections.get(id);
    if (session) return { id, session };

    this.connections.set(id, { userId, room, socket });
    return { id, session: { userId, room, socket } };
  }

  public getSessionsByRoom(room: string) {
    return Array.from(this.connections.values()).filter((session) => session.room === room);
  }

  public getSessionsByUserId(user: string): UserSession | undefined {
    return this.connections.values().find((session) => session.userId === user);
  }

  public removeSessionId(sessionId: string) {
    this.connections.delete(sessionId);
  }
}
