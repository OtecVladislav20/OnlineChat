import { Router } from "express";
import { z } from "zod";
import { WorkspaceModel } from "../../models/Workspace.js";
import { ChannelModel } from "../../models/Channel.js";
import { WorkspaceMemberModel } from "../../models/WorkspaceMember.js";
import { randomId } from "../../utils/id.js";

export const workspaceRouter = Router();

function getUserIdFromReq(req: { headers: Record<string, string | string[] | undefined> }) {
  const raw = req.headers["x-user-id"];
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

workspaceRouter.get("/", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "missing_user" });

  const memberships = await WorkspaceMemberModel.find({ userId }).select({ workspaceId: 1 }).lean();
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const list = await WorkspaceModel.find({ _id: { $in: workspaceIds } }).sort({ createdAt: -1 }).lean();
  res.json({ items: list });
});

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(60)
});

workspaceRouter.post("/", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "missing_user" });

  const parsed = createWorkspaceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const workspaceId = `wsp_${randomId(18)}`;
  const workspace = await WorkspaceModel.create({
    _id: workspaceId,
    ownerId: userId,
    name: parsed.data.name
  });

  const generalId = `chn_${randomId(18)}`;
  const voiceId = `chn_${randomId(18)}`;
  await ChannelModel.create([
    { _id: generalId, workspaceId, name: "general", type: "text" },
    { _id: voiceId, workspaceId, name: "voice", type: "voice" }
  ]);

  await WorkspaceMemberModel.create({
    _id: `wsm_${randomId(18)}`,
    workspaceId,
    userId,
    role: "owner"
  });

  res.status(201).json({ workspace });
});

workspaceRouter.post("/:workspaceId/join", async (req, res) => {
  const userId = getUserIdFromReq(req);
  if (!userId) return res.status(401).json({ error: "missing_user" });

  const { workspaceId } = req.params;
  const workspace = await WorkspaceModel.findById(workspaceId).lean();
  if (!workspace) return res.status(404).json({ error: "not_found" });

  const existing = await WorkspaceMemberModel.findOne({ workspaceId, userId }).lean();
  if (existing) return res.json({ ok: true, workspace });

  await WorkspaceMemberModel.create({
    _id: `wsm_${randomId(18)}`,
    workspaceId,
    userId,
    role: "member"
  });

  res.json({ ok: true, workspace });
});
