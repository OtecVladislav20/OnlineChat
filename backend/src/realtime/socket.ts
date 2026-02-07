import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { z } from "zod";
import { env } from "../env.js";
import { MessageModel } from "../models/Message.js";
import { randomId } from "../utils/id.js";

type SocketAuth = {
  userId: string;
  username?: string;
};

const joinChannelSchema = z.object({
  channelId: z.string().min(1)
});

const sendMessageSchema = z.object({
  channelId: z.string().min(1),
  nonce: z.string().min(1).max(64),
  content: z.string().trim().min(1).max(4000)
});

export function attachSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.use((socket, next) => {
    const auth = socket.handshake.auth as Partial<SocketAuth> | undefined;
    if (!auth?.userId) return next(new Error("missing_user"));
    (socket.data as { auth: SocketAuth }).auth = { userId: auth.userId, username: auth.username };
    next();
  });

  io.on("connection", (socket) => {
    socket.on("channel:join", (payload) => {
      const parsed = joinChannelSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.join(`channel:${parsed.data.channelId}`);
    });

    socket.on("channel:leave", (payload) => {
      const parsed = joinChannelSchema.safeParse(payload);
      if (!parsed.success) return;
      socket.leave(`channel:${parsed.data.channelId}`);
    });

    socket.on("message:send", async (payload, ack?: (resp: unknown) => void) => {
      const parsed = sendMessageSchema.safeParse(payload);
      if (!parsed.success) return ack?.({ ok: false, error: "invalid_body" });

      const { userId } = (socket.data as { auth: SocketAuth }).auth;

      const msgId = `msg_${randomId(18)}`;
      const createdAt = new Date();
      const doc = {
        _id: msgId,
        channelId: parsed.data.channelId,
        authorId: userId,
        content: parsed.data.content,
        createdAt,
        editedAt: null
      } as const;

      await MessageModel.create(doc);

      io.to(`channel:${parsed.data.channelId}`).emit("message:new", {
        ...doc,
        nonce: parsed.data.nonce
      });

      ack?.({ ok: true, id: msgId, createdAt: createdAt.toISOString() });
    });
  });

  return io;
}

