import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { createDevUser, createWorkspace, fetchChannelMessages, fetchChannels, fetchWorkspaces, joinWorkspace } from "./api";
import { connectSocket } from "./socket";
import type { Channel, Message, Workspace } from "./types";
import { randomNonce } from "./utils";
import { VoicePanel } from "./voice/VoicePanel";

type DevSession = { userId: string; username: string };

function getWorkspaceIdFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    const wsp = url.searchParams.get("wsp")?.trim();
    return wsp ? wsp : null;
  } catch {
    return null;
  }
}

function clearWorkspaceIdFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("wsp");
    window.history.replaceState(null, "", url.toString());
  } catch {
    // ignore
  }
}

function loadSession(): DevSession | null {
  try {
    const raw = localStorage.getItem("devSession");
    if (!raw) return null;
    return JSON.parse(raw) as DevSession;
  } catch {
    return null;
  }
}

function saveSession(session: DevSession) {
  localStorage.setItem("devSession", JSON.stringify(session));
}

export default function App() {
  const [session, setSession] = useState<DevSession | null>(() => loadSession());
  const [loginName, setLoginName] = useState("");
  const [pendingJoinWorkspaceId, setPendingJoinWorkspaceId] = useState<string | null>(() => getWorkspaceIdFromUrl());

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeChannel = useMemo(() => channels.find((c) => c._id === activeChannelId) ?? null, [channels, activeChannelId]);

  const socket = useMemo(() => {
    if (!session) return null;
    return connectSocket(session);
  }, [session]);

  useEffect(() => {
    if (!socket) return;

    const onMessageNew = (msg: Message & { nonce?: string }) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("message:new", onMessageNew);
    return () => {
      socket.off("message:new", onMessageNew);
      socket.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!session) return;
    fetchWorkspaces(session).then((r) => setWorkspaces(r.items)).catch(() => setWorkspaces([]));
  }, [session]);

  useEffect(() => {
    if (!session) return;
    if (!pendingJoinWorkspaceId) return;

    (async () => {
      try {
        await joinWorkspace(session, pendingJoinWorkspaceId);
        const r = await fetchWorkspaces(session);
        setWorkspaces(r.items);
        setActiveWorkspaceId(pendingJoinWorkspaceId);
        clearWorkspaceIdFromUrl();
      } finally {
        setPendingJoinWorkspaceId(null);
      }
    })();
  }, [session, pendingJoinWorkspaceId]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setChannels([]);
      setActiveChannelId(null);
      return;
    }
    fetchChannels(activeWorkspaceId).then((r) => setChannels(r.items)).catch(() => setChannels([]));
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!socket) return;
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    socket.emit("channel:join", { channelId: activeChannelId });
    fetchChannelMessages(activeChannelId).then((r) => setMessages(r.items.slice().reverse()));

    return () => {
      socket.emit("channel:leave", { channelId: activeChannelId });
    };
  }, [socket, activeChannelId]);

  async function doLogin() {
    const username = loginName.trim();
    if (username.length < 2) return;
    const resp = await createDevUser(username);
    const next = { userId: resp.userId, username: resp.username };
    saveSession(next);
    setSession(next);
    setLoginName("");
  }

  async function doCreateWorkspace() {
    if (!session) return;
    const name = prompt("Workspace name?")?.trim();
    if (!name) return;
    const created = await createWorkspace(session, name);
    const r = await fetchWorkspaces(session);
    setWorkspaces(r.items);
    setActiveWorkspaceId(created.workspace._id);
  }

  async function doJoinWorkspace() {
    if (!session) return;
    const id = prompt("Workspace link or ID?")?.trim();
    if (!id) return;

    const extracted = (() => {
      if (id.startsWith("http://") || id.startsWith("https://")) {
        try {
          const url = new URL(id);
          const wsp = url.searchParams.get("wsp")?.trim();
          return wsp ? wsp : null;
        } catch {
          return null;
        }
      }
      return id;
    })();

    if (!extracted) return;
    await joinWorkspace(session, extracted);
    const r = await fetchWorkspaces(session);
    setWorkspaces(r.items);
    setActiveWorkspaceId(extracted);
  }

  async function doSend() {
    if (!socket || !activeChannelId) return;
    if (activeChannel?.type === "voice") return;
    const content = draft.trim();
    if (!content) return;

    const nonce = randomNonce();
    setDraft("");
    socket.emit("message:send", { channelId: activeChannelId, content, nonce }, (_ack: unknown) => {});
  }

  const inviteLink = useMemo(() => {
    if (!activeWorkspaceId) return "";
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set("wsp", activeWorkspaceId);
      return url.toString();
    } catch {
      return `${window.location.origin}/?wsp=${encodeURIComponent(activeWorkspaceId)}`;
    }
  }, [activeWorkspaceId]);

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">OnlineChat</div>
        <div className="status">
          {session && inviteLink ? (
            <div className="invite">
              <span className="inviteLabel">Invite</span>
              <input className="inviteInput" value={inviteLink} readOnly />
              <button
                className="secondary"
                onClick={() => {
                  void navigator.clipboard?.writeText(inviteLink);
                }}
              >
                Copy
              </button>
            </div>
          ) : null}
          {session ? (
            <>
              <span className="pill">{session.username}</span>
              <button
                className="secondary"
                onClick={() => {
                  localStorage.removeItem("devSession");
                  setSession(null);
                  setActiveWorkspaceId(null);
                  setActiveChannelId(null);
                  setMessages([]);
                }}
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </header>

      {!session ? (
        <main className="center">
          <div className="panel">
            <h2>Dev login</h2>
            <input
              value={loginName}
              placeholder="Username"
              onChange={(e) => setLoginName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void doLogin();
              }}
            />
            <button onClick={() => void doLogin()}>Login</button>
            <p className="hint">
              Это временный dev-логин без пароля.
              {pendingJoinWorkspaceId ? ` После входа ты автоматически присоединишься к wsp=${pendingJoinWorkspaceId}.` : ""}
            </p>
          </div>
        </main>
      ) : (
        <main className="grid">
          <aside className="sidebar">
            <div className="sidebarHeader">
              <div>Workspaces</div>
              <div className="row">
                <button className="secondary" onClick={() => void doJoinWorkspace()}>
                  Join
                </button>
                <button className="secondary" onClick={() => void doCreateWorkspace()}>
                  +
                </button>
              </div>
            </div>
            <div className="list">
              {workspaces.map((w) => (
                <button
                  key={w._id}
                  className={w._id === activeWorkspaceId ? "item active" : "item"}
                  onClick={() => setActiveWorkspaceId(w._id)}
                >
                  {w.name}
                </button>
              ))}
              {workspaces.length === 0 ? <div className="empty">Нет воркспейсов</div> : null}
            </div>
          </aside>

          <aside className="channels">
            <div className="sidebarHeader">Channels</div>
            <div className="list">
              {channels.map((c) => (
                <button
                  key={c._id}
                  className={c._id === activeChannelId ? "item active" : "item"}
                  onClick={() => setActiveChannelId(c._id)}
                >
                  <span className="channelIcon">{c.type === "voice" ? "🔊" : "#"}</span>
                  {c.name}
                </button>
              ))}
              {!activeWorkspaceId ? <div className="empty">Выбери воркспейс</div> : null}
            </div>
          </aside>

          <section className="chat">
            <div className="chatHeader">
              {activeChannelId ? (
                <span className="pill">{channels.find((c) => c._id === activeChannelId)?.name ?? "channel"}</span>
              ) : (
                <span className="hint">Выбери канал</span>
              )}
            </div>

            <div className="messages">
              {session && activeChannel?.type === "voice" && activeChannelId ? (
                <VoicePanel session={session} channelId={activeChannelId} />
              ) : null}
              {messages.map((m) => (
                <div key={m._id} className="msg">
                  <div className="meta">
                    <span className="author">{m.authorId}</span>
                    <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="body">{m.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="composer">
              <input
                value={draft}
                disabled={!activeChannelId || activeChannel?.type === "voice"}
                placeholder={
                  !activeChannelId ? "Pick a channel" : activeChannel?.type === "voice" ? "Voice channel" : "Message..."
                }
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void doSend();
                }}
              />
              <button disabled={!activeChannelId || activeChannel?.type === "voice"} onClick={() => void doSend()}>
                Send
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
