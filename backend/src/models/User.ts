import { Schema, model } from "mongoose";

export type UserDoc = {
  _id: string;
  username: string;
  createdAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userSchema.index({ username: 1 });

export const UserModel = model<UserDoc>("User", userSchema);

