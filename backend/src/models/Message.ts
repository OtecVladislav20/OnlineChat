import { Schema, model } from "mongoose";

export type MessageDoc = {
  _id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  editedAt?: Date | null;
};

const messageSchema = new Schema<MessageDoc>(
  {
    _id: { type: String, required: true },
    channelId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true },
    editedAt: { type: Date, required: false, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ channelId: 1, createdAt: -1 });

export const MessageModel = model<MessageDoc>("Message", messageSchema);

