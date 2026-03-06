/**
 * Books Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { bookService } from "../services/bookService";
import { miftahdb } from "@/lib/miftahdbService";
import type { Book } from "@/types/schemas";

export async function handleBooks(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "book");

    const books = await bookService.getAllBooks({ limit: 100, offset: 0 });

    if (books.pagination.total == 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد كتب حالياً." : "No books available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    // Build inline keyboard with book buttons (2 per row)
    const keyboard: Array<Array<string>> = [];
    for (let i = 0; i < books.books.length; i += 2) {
      const row = books.books.slice(i, i + 2).map(book => book.courseCode);
      keyboard.push(row);
    }

    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر كتاب من القائمة أو أدخل رمز الكورس." : "- Select a book from the list or enter the course code.",
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
 * Handle Book detail view
 */
export async function handleBookSelection(ctx: Context, userId: string, bookTitle: string, userLang: "ar" | "en") {
  try {
    const book = await bookService.getBookByCourseCode(bookTitle) as Book;

    if (!book) {
      await ctx.reply(
        userLang === "ar" ? "الكتاب غير موجود." : "Book not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }

    const title = book.title[userLang];
    const courseCode = book.courseCode;
    const metaData = book.metaData || [];
    const isAdmin = ctx.user?.role !== "user";

    let bookText = ``;
    bookText += `• 📖 ${userLang === "ar" ? "رمز الكورس" : "Course Code"}: ${courseCode}\n`;
    bookText += `• 📁 ${userLang === "ar" ? "عدد الملفات" : "Files"}: ${metaData.length}\n-`;

    // Send book info message
    await ctx.reply(bookText, {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: isAdmin ? [
          [ messages.inlineButtons.delete(userLang, `delete_book_${courseCode}`) ],
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
                callback_data: `delete_book1_file_${courseCode}_${i}`
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
