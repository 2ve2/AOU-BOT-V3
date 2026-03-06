/**
 * Academic Calendar Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { calendarService } from "../services/calendarService";
import { miftahdb } from "@/lib/miftahdbService";

export async function handleCalendars(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "calendar");
    
    const calendars = await calendarService.getAllCalendars();

    if (calendars.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد أحداث في التقويم الأكاديمي حالياً." : "No academic calendar events available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    // Build inline keyboard with calendar buttons
    const keyboard: Array<Array<string>> = [];

    calendars.forEach((calendar) => {
      const title = calendar.title[userLang];
      keyboard.push([title]);
    });

    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر احد المواعيد." : "- Select an calendar to view details.",
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
      reply_to_message_id: ctx.message?.message_id,
    });
  }
}

/**
 * Handle Calendar detail view
 */
export async function handleCalendarSelection(ctx: Context, title: string, userLang: "ar" | "en") {
  try {
    const calendar = await calendarService.getCalendarByTitle(title, userLang);

    if (!calendar) {
      await ctx.reply(
        userLang === "ar" ? "الموعد غير موجود." : "Calendar not found.", {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    const answer = calendar.answer[userLang];
    const isAdmin = ctx.user?.role !== "user";

    if (answer.startsWith("BQA")) {
      await ctx.replyWithDocument(answer, {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: isAdmin ? [ [ messages.inlineButtons.delete(userLang, `delete_calendar_${calendar.id}`) ] ] : [
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
          inline_keyboard: isAdmin ? [ [ messages.inlineButtons.delete(userLang, `delete_calendar_${calendar.id}`) ] ] : [
            [
              messages.inlineButtons.channel(userLang),
              messages.inlineButtons.share(userLang)
            ],
            [messages.inlineButtons.suggestion(userLang)]
          ]
        }
      })
    }

  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
}
