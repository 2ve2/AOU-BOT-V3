/**
 * Courses Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { courseService } from "../services/courseService";
import { miftahdb } from "@/lib/miftahdbService";

export async function handleCourses(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "course");

    const courses = await courseService.getAllCourses();

    if (courses.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد دورات أو معسكرات حالياً." : "No courses or bootcamps available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    // Build inline keyboard with course buttons
    const keyboard: Array<Array<string>> = [];

    courses.forEach((course) => {
      const title = course.title[userLang];
      keyboard.push([title]);
    });

    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر دورة أو معسكر لعرض التفاصيل." : "- Select a course or bootcamp to view details.",
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
 * Handle Course detail view
 */
export async function handleCourseSelection(ctx: Context, courseTitle: string, userLang: "ar" | "en") {
  try {
    const course = await courseService.getCourseByTitle(courseTitle, userLang);

    if (!course) {
      await ctx.reply(
        userLang === "ar" ? "الدورة غير موجودة." : "Course not found.",
      );
      return;
    }

    const title = course.title[userLang];
    const link = course.link;
    const isAdmin = ctx.user?.role !== "user";

    const linkText = userLang === "ar" ? "اضغط هنا" : "Click here";

    let courseText = `${title}\n\n`;
    courseText += `• 🔗 ${userLang === "ar" ? "الرابط" : "Link"} : [${linkText}](${link})\n`;

    await ctx.reply(courseText, {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: isAdmin ? [
          [ messages.inlineButtons.delete(userLang, `delete_course_${course.id}`) ],
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
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id,
    });
  }
}
