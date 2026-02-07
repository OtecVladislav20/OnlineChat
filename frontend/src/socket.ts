import { io } from "socket.io-client";

type DevSession = { userId: string; username: string };

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export function connectSocket(session: DevSession) {
  return io(apiUrl, {
    transports: ["websocket"],
    auth: {
      userId: session.userId,
      username: session.username
    }
  });
}

