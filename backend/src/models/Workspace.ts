import { Schema, model } from "mongoose";

export type WorkspaceDoc = {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
};

const workspaceSchema = new Schema<WorkspaceDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

workspaceSchema.index({ ownerId: 1, createdAt: -1 });

export const WorkspaceModel = model<WorkspaceDoc>("Workspace", workspaceSchema);

