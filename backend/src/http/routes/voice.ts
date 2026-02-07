import { Router } from "express";
import { z } from "zod";
import { AccessToken } from "livekit-server-sdk";
import { env } from "../../env.js";
import { ChannelModel } from "../../models/Channel.js";
import { WorkspaceMemberModel } from "../../models/WorkspaceMember.js";
import { UserModel } from "../../models/User.js";

export const voiceRouter = Router();

function getUserIdFromReq(req: { headers: Record<string, string | string[] | undefined> }) {
  const raw = req.headers["x-user-id"];
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

const tokenSchema = z.object({
  channelId: z.string().min(1)
});

voiceRouter.post("/token", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "missing_user" });

  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  if (!env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    return res.status(500).json({ error: "livekit_not_configured" });
  }

  const channel = await ChannelModel.findById(parsed.data.channelId).lean();
  if (!channel) return res.status(404).json({ error: "channel_not_found" });
  if (channel.type !== "voice") return res.status(400).json({ error: "not_voice_channel" });

  const isMember = await WorkspaceMemberModel.exists({ workspaceId: channel.workspaceId, userId });
  if (!isMember) return res.status(403).json({ error: "not_a_member" });

  const user = await UserModel.findById(userId).lean();
  const displayName = user?.username ?? userId;

  const roomName = `voice_${channel._id}`;
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: userId,
    name: displayName
  });
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true
  });

  const token = await at.toJwt();

  res.json({
    url: env.LIVEKIT_URL,
    roomName,
    token
  });
});
