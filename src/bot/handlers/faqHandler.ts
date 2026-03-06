/**
 * FAQ Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { faqService } from "../services/faqService";
import { miftahdb } from "@/lib/miftahdbService";

export async function handleFAQ(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "faq");
    
    const faqs = await faqService.getAllFAQs();

    if (faqs.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد أسئلة شائعة حالياً." : "No FAQs available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    // Build keyboard with FAQ buttons
    const keyboard: Array<Array<string>> = [];

    faqs.forEach((faq) => {
      const question = faq.question[userLang];
      keyboard.push([question]);
    });

    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر احد الاسئلة الشائعة." : "- Select a question to view the answer.",
      {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        }
      }
    );
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id
    });
  }
}

/**
 * Handle FAQ detail view
 */
export async function handleFAQSelection(ctx: Context, question: string, userLang: "ar" | "en") {
  try {
    const faq = await faqService.getFAQByQuestion(question, userLang);

    if (!faq) {
      await ctx.reply(
        userLang === "ar" ? "السؤال غير موجود." : "Question not found.", {
          reply_to_message_id: ctx.message?.message_id,
        } 
      );
      return;
    }

    const answer = faq.answer[userLang];
    const isAdmin = ctx.user?.role !== "user";

    if (answer.startsWith("BQA")) {
      await ctx.replyWithDocument(answer, {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: isAdmin ? [ [ messages.inlineButtons.delete(userLang, `delete_faq_${faq.id}`) ] ] : [
            [
              messages.inlineButtons.channel(userLang),
              messages.inlineButtons.share(userLang)
            ],
            [messages.inlineButtons.suggestion(userLang)]
          ]
        }
      })
    } else {
      await ctx.reply(answer, {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: isAdmin ? [ [ messages.inlineButtons.delete(userLang, `delete_faq_${faq.id}`) ] ] : [
            [
              messages.inlineButtons.channel(userLang),
              messages.inlineButtons.share(userLang)
            ],
            [messages.inlineButtons.suggestion(userLang)]
          ]
        },parse_mode: 'Markdown'
      });
    }
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
}
