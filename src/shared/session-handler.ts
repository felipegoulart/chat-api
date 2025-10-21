import type { WebSocket } from "@fastify/websocket";

interface UserSession {
  userId: string;
  chatServer: string;
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

  public initSession({ userId, chatServer, socket }: UserSession): Session {
    const id = `${userId}:${chatServer}`;

    const session = this.connections.get(id);
    if (session) return { id, session };

    this.connections.set(id, { userId, chatServer, socket });
    return { id, session: { userId, chatServer, socket } };
  }

  public getSessionsByChatServer(chatServer: string) {
    return Array.from(this.connections.values()).filter((session) => session.chatServer === chatServer);
  }

  public getSessionsByUserId(user: string): UserSession | undefined {
    return this.connections.values().find((session) => session.userId === user);
  }

  public removeSessionById(sessionId: string) {
    this.connections.delete(sessionId);
  }
}
