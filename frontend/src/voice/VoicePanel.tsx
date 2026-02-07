import {
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type RemoteAudioTrack
} from "livekit-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createVoiceToken } from "../api";

type DevSession = { userId: string; username: string };

type Props = {
  session: DevSession;
  channelId: string;
};

type ParticipantView = {
  identity: string;
  label: string;
  isLocal: boolean;
};

export function VoicePanel({ session, channelId }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micStatus, setMicStatus] = useState<"unknown" | "ok" | "blocked">("unknown");
  const [participants, setParticipants] = useState<ParticipantView[]>([]);
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const inCall = room?.state === "connected";
  const micAllowed = micStatus === "ok";

  const sortedParticipants = useMemo(() => {
    return participants.slice().sort((a, b) => {
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return a.identity.localeCompare(b.identity);
    });
  }, [participants]);

  const insecureContextWarning = useMemo(() => {
    try {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (window.isSecureContext) return null;
      if (isLocalhost) return null;
      return "Микрофон обычно не работает на HTTP для публичного IP. Для голоса нужен HTTPS (сертификат).";
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      audioElsRef.current.forEach((el) => {
        try {
          el.pause();
          el.srcObject = null;
          el.remove();
        } catch {
          // ignore
        }
      });
      audioElsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!room) return;

    const refreshParticipants = () => {
      const remotes = Array.from(room.remoteParticipants.values()).map((p) => ({
        identity: p.identity,
        label: p.name || p.identity,
        isLocal: false
      }));
      setParticipants([
        { identity: room.localParticipant.identity, label: room.localParticipant.name || room.localParticipant.identity, isLocal: true },
        ...remotes
      ]);
    };

    const onConnected = () => refreshParticipants();
    const onDisconnected = () => setParticipants([]);
    const onParticipantConnected = () => refreshParticipants();
    const onParticipantDisconnected = (p: RemoteParticipant) => {
      audioElsRef.current.get(p.identity)?.remove();
      audioElsRef.current.delete(p.identity);
      refreshParticipants();
    };

    const onTrackSubscribed = (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (track.kind !== Track.Kind.Audio) return;
      const audioTrack = track as RemoteAudioTrack;

      const identity = participant.identity;
      const audioEl = audioTrack.attach() as HTMLAudioElement;
      audioEl.autoplay = true;
      audioEl.volume = volumes[identity] ?? 1;
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      audioElsRef.current.set(identity, audioEl);
    };

    const onTrackUnsubscribed = (_track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
      const el = audioElsRef.current.get(participant.identity);
      if (el) {
        el.remove();
        audioElsRef.current.delete(participant.identity);
      }
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);

    refreshParticipants();

    return () => {
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    // When volumes update, apply to existing audio elements.
    audioElsRef.current.forEach((el, identity) => {
      el.volume = volumes[identity] ?? 1;
    });
  }, [volumes]);

  useEffect(() => {
    // Leave call if user switches voice channels
    return () => {
      void leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  function normalizeLivekitUrl(rawUrl: string) {
    // livekit-client prefers ws(s) endpoints; accept http(s) from backend for convenience.
    if (rawUrl.startsWith("https://")) return `wss://${rawUrl.slice("https://".length)}`;
    if (rawUrl.startsWith("http://")) return `ws://${rawUrl.slice("http://".length)}`;
    return rawUrl;
  }

  async function join() {
    if (connecting || inCall) return;
    setConnecting(true);
    setError(null);
    try {
      // Request mic while we still have user gesture (some browsers block after awaits).
      let localAudioTrack: Awaited<ReturnType<typeof createLocalAudioTrack>> | null = null;
      try {
        localAudioTrack = await createLocalAudioTrack();
        setMicStatus("ok");
      } catch {
        localAudioTrack = null;
        setMicStatus("blocked");
      }

      const { url, token } = await createVoiceToken(session, channelId);
      const nextRoom = new Room();
      await nextRoom.connect(normalizeLivekitUrl(url), token);
      if (localAudioTrack) {
        await nextRoom.localParticipant.publishTrack(localAudioTrack);
      }
      setRoom(nextRoom);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "voice_join_failed";
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }

  async function leave() {
    if (!room) return;
    try {
      room.localParticipant.trackPublications.forEach((pub) => {
        try {
          if (pub.track) {
            room.localParticipant.unpublishTrack(pub.track);
            pub.track.stop();
          }
        } catch {
          // ignore
        }
      });
      await room.disconnect();
    } catch {
      // ignore
    } finally {
      setRoom(null);
      setParticipants([]);
    }
  }

  function setVolume(identity: string, value: number) {
    setVolumes((prev) => ({ ...prev, [identity]: value }));
  }

  return (
    <div className="voicePanel">
      <div className="voiceTop">
        <div className="voiceTitle">Voice</div>
        {inCall ? (
          <button className="secondary" onClick={() => void leave()}>
            Leave
          </button>
        ) : (
          <button onClick={() => void join()} disabled={connecting}>
            {connecting ? "Connecting..." : "Join"}
          </button>
        )}
      </div>

      <div className="voiceList">
        {insecureContextWarning ? <div className="voiceWarn">{insecureContextWarning}</div> : null}
        {error ? <div className="voiceError">{error}</div> : null}
        {sortedParticipants.map((p) => (
          <div key={p.identity} className="voiceRow">
            <div className="voiceName">
              {p.isLocal ? "You" : p.label}
              {p.isLocal ? <span className="voiceHint">{micAllowed ? " (mic)" : " (no mic)"}</span> : null}
            </div>
            {!p.isLocal ? (
              <input
                className="voiceSlider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volumes[p.identity] ?? 1}
                onChange={(e) => setVolume(p.identity, Number(e.target.value))}
                aria-label={`volume ${p.identity}`}
              />
            ) : (
              <div className="voiceMutedHint">—</div>
            )}
          </div>
        ))}
        {sortedParticipants.length === 0 ? <div className="voiceEmpty">Нажми Join чтобы зайти в голос.</div> : null}
      </div>
    </div>
  );
}
