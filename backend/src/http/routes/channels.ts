import { Router } from "express";
import { z } from "zod";
import { ChannelModel } from "../../models/Channel.js";
import { MessageModel } from "../../models/Message.js";
import { randomId } from "../../utils/id.js";

export const channelRouter = Router();

channelRouter.get("/:channelId/messages", async (req, res) => {
  const { channelId } = req.params;
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
  const before = typeof req.query.before === "string" ? new Date(req.query.before) : null;

  const query: Record<string, unknown> = { channelId };
  if (before && !Number.isNaN(before.getTime())) query.createdAt = { $lt: before };

  const items = await MessageModel.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  res.json({ items });
});

channelRouter.get("/by-workspace/:workspaceId", async (req, res) => {
  const { workspaceId } = req.params;
  const items = await ChannelModel.find({ workspaceId }).sort({ createdAt: 1 }).lean();
  res.json({ items });
});

const createChannelSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  type: z.enum(["text", "voice"])
});

channelRouter.post("/", async (req, res) => {
  const parsed = createChannelSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const channelId = `chn_${randomId(18)}`;
  const channel = await ChannelModel.create({
    _id: channelId,
    workspaceId: parsed.data.workspaceId,
    name: parsed.data.name,
    type: parsed.data.type
  });

  res.status(201).json({ channel });
});

