import { Schema, model } from "mongoose";

export type ChannelType = "text" | "voice";

export type ChannelDoc = {
  _id: string;
  workspaceId: string;
  name: string;
  type: ChannelType;
  createdAt: Date;
};

const channelSchema = new Schema<ChannelDoc>(
  {
    _id: { type: String, required: true },
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["text", "voice"] }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

channelSchema.index({ workspaceId: 1, createdAt: 1 });

export const ChannelModel = model<ChannelDoc>("Channel", channelSchema);

