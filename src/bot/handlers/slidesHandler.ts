/**
 * Slides Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { slideService } from "../services/slideService";
import { miftahdb } from "@/lib/miftahdbService";
import type { Slide } from "@/types/schemas";

export async function handleSlides(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "slide");

    const slides = await slideService.getAllSlides({ limit: 100, offset: 0 });

    if (slides.pagination.total === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد سلايدات حالياً." : "No slides available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    // Build inline keyboard with slide buttons (2 per row)
    const keyboard: Array<Array<string>> = [];
    for (let i = 0; i < slides.slides.length; i += 2) {
      const row = slides.slides.slice(i, i + 2).map(slide => slide.courseCode);
      keyboard.push(row);
    }

    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر سلايد من القائمة أو أدخل رمز الكورس." : "- Select a slide from the list or enter the course code.",
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
 * Handle Slide detail view
 */
export async function handleSlideSelection(ctx: Context, userId: string, courseCode: string, userLang: "ar" | "en") {
  try {
    const slide = await slideService.getSlideByCourseCode(courseCode) as Slide;

    if (!slide) {
      await ctx.reply(
        userLang === "ar" ? "السلايد غير موجود." : "Slide not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }

    const title = slide.title[userLang];
    const slideCourseCode = slide.courseCode;
    const metaData = slide.metaData || [];
    const isAdmin = ctx.user?.role !== "user";

    let slideText = ``;
    slideText += `• 📖 ${userLang === "ar" ? "رمز الكورس" : "Course Code"}: ${slideCourseCode}\n`;
    slideText += `• 📁 ${userLang === "ar" ? "عدد الملفات" : "Files"}: ${metaData.length}\n-`;

    // Send slide info message
    await ctx.reply(slideText, {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: isAdmin ? [
          [ messages.inlineButtons.delete(userLang, `delete_slide_${slideCourseCode}`) ],
        ] : [
          [
            messages.inlineButtons.channel(userLang),
            messages.inlineButtons.share(userLang)
          ],
          [
            messages.inlineButtons.suggestion(userLang)
          ]
        ]
      }
    });

    // Send each document individually with delete button for admins
    if (metaData.length > 0) {
      for (let i = 0; i < metaData.length; i++) {
        const fileId = metaData[i] as string;
        
        await ctx.replyWithDocument(fileId, {
          reply_markup: isAdmin ? {
            inline_keyboard: [
              [{
                text: userLang === "ar" ? "حذف الملف" : "Delete file",
                callback_data: `delete_slide1_file_${slideCourseCode}_${i}`
              }]
            ]
          } : undefined
        });
      }
    }
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id
    });
  }
}
