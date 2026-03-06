import type { Context } from "grammy";
import { messages } from "../messages";
import { userService } from "../services/userService";

export async function handleLang(ctx: Context) {
  try {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const currentLang = ctx.user?.lang || 'ar';
    const newLang = currentLang === 'ar' ? 'en' : 'ar';

    await userService.updateUser(userId, { lang: newLang });

    await ctx.reply(
      messages.languageChanged[newLang],
      {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              messages.inlineButtons.channel(newLang),
              messages.inlineButtons.share(newLang)
            ],
            [messages.inlineButtons.suggestion(newLang)],
            [messages.inlineButtons.lang(newLang)]
          ]
        }
      }
    );

    // Send menu keyboard (regular keyboard)
    await ctx.reply(messages.menuTitle[newLang as "ar" | "en"], {
      reply_markup: {
        keyboard: messages.keyboard[newLang as "ar" | "en"] as any,
        resize_keyboard: true,
      }
    });
  } catch {
    const userLang = ctx.user?.lang || 'ar';
    ctx.reply(messages.error[userLang as "ar" | "en"], {
      reply_to_message_id: ctx.message?.message_id
    });
  }
}
