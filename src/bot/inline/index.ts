import type { Bot, Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { messages } from "../messages";

export function setUpInlineHandlers(bot: Bot<Context>) {
  bot.on("inline_query", async (ctx) => {
    const query = ctx.inlineQuery?.query || "";
    
    // Handle empty query or specific Arabic/English text
    if (query === "" ||
        query === "جرب بوت المساعد الطلابي الخاص بالجامعة العربية المفتوحة الان" ||
        query === "Try the Arab Open University Student Assistant Bot now") {
      try {
        // Determine language based on query
        const isArabic = query === "" || query.includes("العربية");
        const lang = isArabic ? "ar" : "en";

        const keyboard = new InlineKeyboard()
          .url(
            isArabic ? "جرب البوت الان !" : "Try the Bot Now !",
            "https://t.me/aouksabot"
          );

        const result = {
          type: "article",
          id: "1",
          title: "AOU BOT",
          description: isArabic ? "اضغط هنا لنشر البوت" : "Click here to share the bot",
          input_message_content: {
            message_text: messages.welcome[lang],
          },
          thumbnail_url: "https://i.postimg.cc/D0D9yPBw/14718d12-60be-4d04-bf0a-15dc28c091a0.jpg",
          reply_markup: keyboard,
        };

        await ctx.answerInlineQuery([result] as any);
      } catch (error) {
        console.error("Error answering inline query:", error);
      }
    }
  });
}
