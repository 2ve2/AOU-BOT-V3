/**
 * Events Handler
 */

import type { Context } from "grammy";
// import { commandService } from "../services/commandService";
import { messages } from "../messages";
import { getUpcomingEvents } from "../services/eventService";

export async function handleEvents(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    // await commandService.createCommnadById(userId, "events");
    
    const events = await getUpcomingEvents();
    
    if (events.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد فعاليات حاليا 😞" : "No events available at the moment 😞",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    let eventsText = userLang === "ar" 
      ? "🎪 الفعاليات القادمة بالجامعة\n\n"
      : "🎪 Upcoming University Events\n\n";
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event) continue;
      
      if (userLang === "ar") {
        eventsText += `- فعالية : ${event.title}\n`;
        eventsText += `• 📅 التاريخ : ${event.date}\n`;
        if (event.description) {
          eventsText += `• 📝 الوصف : ${event.description}\n`;
        }
        eventsText += `• 🔗 الرابط : [اضغط هنا](${event.link})\n-\n`;
      } else {
        eventsText += `- Event : ${event.title}\n`;
        eventsText += `• 📅 Date : ${event.date}\n`;
        if (event.description) {
          eventsText += `• 📝 Description : ${event.description}\n`;
        }
        eventsText += `• 🔗 Link : [Click here](${event.link})\n-\n`;
      }
    }
    
    await ctx.reply(eventsText, {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true }
    });
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id
    });
  }
}
