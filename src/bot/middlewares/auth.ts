import type { Context } from "grammy";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { createId } from "@paralleldrive/cuid2";
import { userService } from "../services/userService";
import { messages } from "../messages";
import { env } from "@/config/env";

// Extend Context type to include user data
declare module "grammy" {
  interface Context {
    user?: {
      id: string;
      userId: string;
      userName: string | null;
      fullName: string | null;
      isActive: boolean;
      lang: string | null;
      role: string;
      createdAt: Date;
      isBanned: boolean;
      bannedAt: Date | null;
      bannedReason: string | null;
    };
  }
}

export async function authMiddleware(ctx: Context, next: () => Promise<void>) {
  if (!ctx.from) return null;

  // Check if message is from a private chat (DM) or the specific channel
  const allowedChannelId = env.FILES_CHANNEL_ID ? parseInt(env.FILES_CHANNEL_ID) : null;
  if (ctx.chat?.type !== 'private' && ctx.chat?.id !== allowedChannelId) {
    return null;
  }

  const userId = ctx.from;

  try {
    const userResult = await userService.getUserById(userId.id.toString());

    if (!userResult) {
      const newUser = await db
        .insert(user)
        .values({
          id: createId(),
          userId: userId.id.toString(),
          userName: userId.username ?? "None",
          fullName: `${userId.first_name ?? ""} ${userId.last_name ?? ""}`.trim(),
          isActive: true,
        })
        .returning();
      
      ctx.user = newUser[0];
      await next();
      return;
    };

    if (userResult.isBanned) {
      const banDate = userResult.bannedAt
        ? new Date(userResult.bannedAt).toLocaleDateString(userResult.lang === "ar" ? "ar-SA" : "en-US")
        : "";
      ctx.reply(messages.banned[userResult.lang as "ar" | "en"](userResult.bannedReason || "", banDate), { reply_to_message_id: ctx.message?.message_id });
      return;
    };

    ctx.user = userResult;
    await next();
  } catch (error) {
    console.log(error)
  }

}