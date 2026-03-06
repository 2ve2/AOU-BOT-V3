import type { Bot, Context } from "grammy";
import { messages } from "../messages";
import { userService } from "../services/userService";
import { bookService } from "../services/bookService";
import { slideService } from "../services/slideService";
import { faqService } from "../services/faqService";
import { calendarService } from "../services/calendarService";
import { groupService } from "../services/groupService";
import { courseService } from "../services/courseService";
import { miftahdb } from "@/lib/miftahdbService";
import { handleCalculatorCallback } from "../handlers/calculatorHandler";

export function setUpCallbackHandlers(bot: Bot<Context>) {
  bot.on("callback_query:data", async (ctx) => {
    const callbackData = ctx.callbackQuery?.data;
    const userLang = ctx.user?.lang as "ar" | "en";
    const userId = ctx.from?.id?.toString();
    
    if (!callbackData) return;

    // Handle language change
    if (callbackData === "lang_ar" || callbackData === "lang_en") {
      if (userId) {
        const newLang = callbackData.replace("lang_", "") as "ar" | "en";
        await userService.updateUser(userId, { lang: newLang });
        await ctx.answerCallbackQuery({
          text: messages.languageChanged[newLang],
        });
        // Refresh start message
        await ctx.reply(messages.welcome[newLang], {
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
        });

        // Send menu keyboard (regular keyboard)
        await ctx.reply(messages.menuTitle[newLang as "ar" | "en"], {
          reply_markup: {
            keyboard: messages.keyboard[newLang as "ar" | "en"] as any,
            resize_keyboard: true,
          }
        });
      }
      return;
    }

    // Handle calculator callbacks
    if (callbackData.startsWith("calc_")) {
      if (userId) {
        await handleCalculatorCallback(ctx, callbackData, userId, userLang);
      }
      return;
    }

    // Handle Delete Book
    if (callbackData.startsWith("delete_book_")) {
      if (userId && ctx.user?.role !== 'user') {
        const courseCode = callbackData.replace("delete_book_", "");
        try {
          const deleted = await bookService.deleteBook(undefined, courseCode);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف الكورس' : 'Course deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف الكورس بنجاح!"
                : "✅ Course deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'الكورس غير موجود' : 'Course not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Book File
    if (callbackData.startsWith("delete_book1_file_")) {
      console.log(callbackData)
      if (userId && ctx.user?.role !== 'user') {
        const parts = callbackData.replace("delete_book1_file_", "").split("_");
        const courseCode = parts[0] as string;
        const fileIndex = parseInt(parts[1] as string);
        
        try {
          const book = await bookService.getBookByCourseCode(courseCode);
          
          if (book && book.metaData && Array.isArray(book.metaData) && book.metaData[fileIndex]) {
            const newMetaData = [...book.metaData];
            newMetaData.splice(fileIndex, 1);
            
            await bookService.updateBook(undefined, courseCode, { metaData: newMetaData });
            
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف الكتاب' : 'Book deleted'
            });
            await ctx.deleteMessage();
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'الكتاب غير موجود' : 'Book not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Slide
    if (callbackData.startsWith("delete_slide_")) {
      if (userId && ctx.user?.role !== 'user') {
        const courseCode = callbackData.replace("delete_slide_", "");
        try {
          const deleted = await slideService.deleteSlide(undefined, courseCode);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف الكورس' : 'Course deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف الكورس بنجاح!"
                : "✅ Course deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'الكورس غير موجود' : 'Course not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Slide File
    if (callbackData.startsWith("delete_slide1_file_")) {
      if (userId && ctx.user?.role !== 'user') {
        const parts = callbackData.replace("delete_slide1_file_", "").split("_");
        const courseCode = parts[0] as string;
        const fileIndex = parseInt(parts[1] as string);
        
        try {
          const slide = await slideService.getSlideByCourseCode(courseCode);
          
          if (slide && slide.metaData && Array.isArray(slide.metaData) && slide.metaData[fileIndex]) {
            const newMetaData = [...slide.metaData];
            newMetaData.splice(fileIndex, 1);
            
            await slideService.updateSlide(undefined, courseCode, { metaData: newMetaData });
            
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف السلايد' : 'Slide deleted'
            });
            await ctx.deleteMessage();
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'السلايد غير موجود' : 'Slide not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete FAQ
    if (callbackData.startsWith("delete_faq_")) {
      if (userId && ctx.user?.role !== 'user') {
        const faqId = parseInt(callbackData.replace("delete_faq_", ""));
        try {
          const deleted = await faqService.deleteFAQ(faqId);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف السؤال الشائع' : 'FAQ deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف السؤال الشائع بنجاح!"
                : "✅ FAQ deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'السؤال الشائع غير موجود' : 'FAQ not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Calendar
    if (callbackData.startsWith("delete_calendar_")) {
      if (userId && ctx.user?.role !== 'user') {
        const calendarId = parseInt(callbackData.replace("delete_calendar_", ""));
        try {
          const deleted = await calendarService.deleteCalendar(calendarId);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف الحدث التقويمي' : 'Calendar event deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف الحدث التقويمي بنجاح!"
                : "✅ Calendar event deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'الحدث التقويمي غير موجود' : 'Calendar event not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Group
    if (callbackData.startsWith("delete_group_")) {
      if (userId && ctx.user?.role !== 'user') {
        const groupId = parseInt(callbackData.replace("delete_group_", ""));
        try {
          const deleted = await groupService.deleteGroup(groupId);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف القروب' : 'Group deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف القروب بنجاح!"
                : "✅ Group deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'القروب غير موجود' : 'Group not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle Delete Course
    if (callbackData.startsWith("delete_course_")) {
      if (userId && ctx.user?.role !== 'user') {
        const courseId = parseInt(callbackData.replace("delete_course_", ""));
        try {
          const deleted = await courseService.deleteCourse(courseId);
          
          if (deleted) {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'تم حذف الكورس' : 'Course deleted'
            });
            await ctx.editMessageText(
              userLang === "ar"
                ? "✅ تم حذف الكورس بنجاح!"
                : "✅ Course deleted successfully!"
            );
          } else {
            await ctx.answerCallbackQuery({
              text: userLang === 'ar' ? 'الكورس غير موجود' : 'Course not found',
              show_alert: true
            });
          }
        } catch (error) {
          await ctx.answerCallbackQuery({
            text: userLang === 'ar' ? 'حدث خطأ' : 'Error occurred',
            show_alert: true
          });
        }
      }
      return;
    }

    // Handle cancel admin operation
    if (callbackData === "admin_cancel") {
      if (userId) {
        miftahdb.delete(userId);
        
        const userLang = ctx.user?.lang || 'ar';
        await ctx.answerCallbackQuery({
          text: userLang === 'ar' ? 'تم الإلغاء' : 'Cancelled'
        });
        
        await ctx.editMessageText(
          userLang === "ar" ? "تم إلغاء العملية" : "Operation cancelled",
        );
      }
    }
  });
}
