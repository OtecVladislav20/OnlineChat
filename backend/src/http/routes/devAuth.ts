import { Router } from "express";
import { z } from "zod";
import { UserModel } from "../../models/User.js";
import { randomId } from "../../utils/id.js";

export const devAuthRouter = Router();

const loginSchema = z.object({
  username: z.string().trim().min(2).max(32)
});

devAuthRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_body" });

  const username = parsed.data.username;
  const userId = `usr_${randomId(18)}`;

  await UserModel.create({
    _id: userId,
    username
  });

  res.json({ userId, username });
});

