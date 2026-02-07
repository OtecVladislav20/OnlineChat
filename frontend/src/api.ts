import type { Channel, Message, Workspace } from "./types";

type DevSession = { userId: string; username: string };

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

async function api<T>(
  path: string,
  init?: RequestInit & { session?: DevSession },
) {
  const url = apiUrl ? `${apiUrl}${path}` : path;
  const headers = new Headers(init?.headers ?? {});
  headers.set("content-type", "application/json");
  if (init?.session) headers.set("x-user-id", init.session.userId);

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`api_error ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function createDevUser(username: string) {
  return api<{ userId: string; username: string }>("/api/dev/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function fetchWorkspaces(session: DevSession) {
  return api<{ items: Workspace[] }>("/api/workspaces", {
    method: "GET",
    session,
  });
}

export async function createWorkspace(session: DevSession, name: string) {
  return api<{ workspace: Workspace }>("/api/workspaces", {
    method: "POST",
    session,
    body: JSON.stringify({ name }),
  });
}

export async function joinWorkspace(session: DevSession, workspaceId: string) {
  return api<{ ok: true; workspace: Workspace }>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/join`,
    {
      method: "POST",
      session,
    },
  );
}

export async function fetchChannels(workspaceId: string) {
  return api<{ items: Channel[] }>(
    `/api/channels/by-workspace/${encodeURIComponent(workspaceId)}`,
    { method: "GET" },
  );
}

export async function fetchChannelMessages(channelId: string) {
  return api<{ items: Message[] }>(
    `/api/channels/${encodeURIComponent(channelId)}/messages?limit=50`,
    {
      method: "GET",
    },
  );
}

export async function createVoiceToken(session: DevSession, channelId: string) {
  const resp = await api<unknown>("/api/voice/token", {
    method: "POST",
    session,
    body: JSON.stringify({ channelId }),
  });
  if (
    !resp ||
    typeof resp !== "object" ||
    typeof (resp as { url?: unknown }).url !== "string" ||
    typeof (resp as { token?: unknown }).token !== "string" ||
    typeof (resp as { roomName?: unknown }).roomName !== "string"
  ) {
    throw new Error("invalid_voice_token_response");
  }
  return resp as { url: string; token: string; roomName: string };
}
