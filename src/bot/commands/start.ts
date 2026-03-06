import type { Context } from "grammy";
import { messages } from "../messages";
import { miftahdb } from "@/lib/miftahdbService";

export async function handleStart(ctx: Context) {
  // Get user language from middleware (default to Arabic if not set)
  const userLang = ctx.user?.lang || 'ar';
  const userId = ctx.from?.id?.toString();

  miftahdb.delete(userId!);

  // Send welcome message with language button (inline keyboard)
  await ctx.reply(messages.welcome[userLang as "ar" | "en"], {
    reply_to_message_id: ctx.message?.message_id,
    reply_markup: {
      inline_keyboard: [
        [messages.inlineButtons.channel(userLang), messages.inlineButtons.share(userLang)],
        [messages.inlineButtons.suggestion(userLang)],
        [messages.inlineButtons.lang(userLang)]
      ],
    }
  });

  // Send menu keyboard (regular keyboard)
  await ctx.reply(messages.menuTitle[userLang as "ar" | "en"], {
    reply_markup: {
      keyboard: messages.keyboard[userLang as "ar" | "en"] as any,
      resize_keyboard: true,
    }
  });
}