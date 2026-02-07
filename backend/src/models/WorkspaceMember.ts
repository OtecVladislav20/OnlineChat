import { Schema, model } from "mongoose";

export type WorkspaceRole = "owner" | "member";

export type WorkspaceMemberDoc = {
  _id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
};

const workspaceMemberSchema = new Schema<WorkspaceMemberDoc>(
  {
    _id: { type: String, required: true },
    workspaceId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ["owner", "member"] }
  },
  { timestamps: { createdAt: "joinedAt", updatedAt: false } }
);

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMemberModel = model<WorkspaceMemberDoc>("WorkspaceMember", workspaceMemberSchema);

