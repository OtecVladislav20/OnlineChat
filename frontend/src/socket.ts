import { io } from "socket.io-client";

type DevSession = { userId: string; username: string };

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export function connectSocket(session: DevSession) {
  const opts = {
    transports: ["websocket" as const],
    auth: {
      userId: session.userId,
      username: session.username
    }
  };

  return apiUrl ? io(apiUrl, opts) : io(opts);
}
