import mongoose from "mongoose";

export async function connectMongo(mongoUrl: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUrl);
}

