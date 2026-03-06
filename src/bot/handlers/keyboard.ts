import type { Bot, Context } from "grammy";
import { messages } from "../messages";
import * as branchService from "../services/branchService";
import * as planService from "../services/planService";
import { handleSlides, handleSlideSelection } from "./slidesHandler";
import { handleBooks, handleBookSelection } from "./booksHandler";
import { handleCalendars, handleCalendarSelection } from "./calendarsHandler";
import { handlePlanSelection, handleStudyPlans } from "./studyPlansHandler";
import { handleEvents } from "./eventsHandler";
import { handleCourses, handleCourseSelection } from "./coursesHandler";
import { handleGroups, handleGroupSelection } from "./groupsHandler";
import { handleFAQ, handleFAQSelection } from "./faqHandler";
import { handleEmails, handleBranchSelection, handleDepartmentSelection } from "./emailHandlers";
import { CacheKeys, miftahdb } from "@/lib/miftahdbService";
import { faqService } from "../services/faqService";
import { calendarService } from "../services/calendarService";
import { groupService } from "../services/groupService";
import { courseService } from "../services/courseService";
import { bookService } from "../services/bookService";
import { slideService } from "../services/slideService";
import { handleCalculator, handleCalculatorText } from "./calculatorHandler";
import { handleBroadcastStep } from "./broadcastHandler";
import materials from "@/data/materials.json";

interface Material {
  id: string;
  credits: number;
  nameAr: string;
  nameEn: string;
  reqs: string[];
}

interface AdminSession {
  step: string;
  data: any;
}

export function setUpKeyboardHandlers(bot: Bot<Context>) {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message?.text;
    const userLang = ctx.user?.lang as "ar" | "en";
    const userId = ctx.from?.id?.toString();

    if (!text) return;

    // Handle Back button
    const backText = userLang === "ar" ? "رجوع" : "Back";
    if (text === backText && userId) {
      const selectedBranch = miftahdb.get<string>(CacheKeys.userEmail(userId));

      // Delete all user cache keys
      miftahdb.delete(userId);
      miftahdb.delete(CacheKeys.userEmail(userId));
      miftahdb.delete(CacheKeys.userPlan(userId));
      miftahdb.delete(CacheKeys.userCommand(userId));

      if (selectedBranch) {
        // User is in department selection, go back to branch selection
        await handleEmails(ctx, userId, userLang);
      } else {
        // User is in branch selection or FAQ, go back to main menu
        await ctx.reply(messages.menuTitle[userLang], {
          reply_to_message_id: ctx.message?.message_id,
          reply_markup: {
            keyboard: messages.keyboard[userLang] as any,
            resize_keyboard: true,
          }
        });
      }
      return;
    }

    // Get keyboard buttons for current language
    const keyboardButtons = messages.keyboard[userLang].flat() as string[];

    // Check if the text matches any keyboard button
    if (keyboardButtons.includes(text)) {
      if (!userId) return;

      switch (text) {
        case messages.menu.slides[userLang]:
          await handleSlides(ctx, userId, userLang);
          break;
        case messages.menu.books[userLang]:
          await handleBooks(ctx, userId, userLang);
          break;
        case messages.menu.schedules[userLang]:
          await handleCalendars(ctx, userId, userLang);
          break;
        case messages.menu.emails[userLang]:
          await handleEmails(ctx, userId, userLang);
          break;
        case messages.menu.studyPlans[userLang]:
          await handleStudyPlans(ctx, userId, userLang);
          break;
        case messages.menu.events[userLang]:
          await handleEvents(ctx, userId, userLang);
          break;
        case messages.menu.courses[userLang]:
          await handleCourses(ctx, userId, userLang);
          break;
        case messages.menu.groups[userLang]:
          await handleGroups(ctx, userId, userLang);
          break;
        case messages.menu.faq[userLang]:
          await handleFAQ(ctx, userId, userLang);
          break;
        case messages.menu.calculator[userLang]:
          await handleCalculator(ctx, userId, userLang);
      }
      return;
    }

    const chechUserHasCache = miftahdb.get(userId);

    if (chechUserHasCache === "book") {
      await handleBookSelection(ctx, userId, text.toUpperCase(), userLang);
    }

    if (chechUserHasCache === "slide") {
      await handleSlideSelection(ctx, userId, text.toUpperCase(), userLang);
    }

    // Check if text is a branch name (only if user is in emails flow)
    if (chechUserHasCache === "email") {
      const branchNames = branchService.getBranchNames(userLang);
      if (branchNames.includes(text) && userId) {
        await handleBranchSelection(ctx, userId, userLang, text);
        return;
      }
    }

    // Check if text is a department name (only if user is in emails flow)
    if (chechUserHasCache === "email") {
      const departmentNames = branchService.getDepartmentNames(userLang);
      if (departmentNames.includes(text) && userId) {
        await handleDepartmentSelection(ctx, userId, userLang, text);
        return;
      }
    }

    // Check if text is a plan name (only if user is in plans flow)
    if (chechUserHasCache === "plan") {
      const planNames = planService.getPlanNames(userLang);
      if (planNames.includes(text) && userId) {
        await handlePlanSelection(ctx, userId, userLang, text);
        return;
      }
    }

    // Check if text is a faq name (only if user is in faqs flow)
    if (chechUserHasCache === "faq") {
      const faqNames = await faqService.getFAQQuestionNames(userLang);
      if (faqNames.includes(text) && userId) {
        await handleFAQSelection(ctx, text, userLang);
        return;
      }
    }

    // Check if text is a calendar name (only if user is in calendars flow)
    if (chechUserHasCache === "calendar") {
      const calendarNames = await calendarService.getCalendarTitles(userLang);
      if (calendarNames.includes(text) && userId) {
        await handleCalendarSelection(ctx, text, userLang);
        return;
      }
    }

    // Check if text is a group name (only if user is in groups flow)
    if (chechUserHasCache === "group") {
      const groupNames = await groupService.getGroupCourseCodes();
      if (groupNames.includes(text) && userId) {
        await handleGroupSelection(ctx, text, userLang);
        return;
      }
    }

    // Check if text is a course name (only if user is in courses flow)
    if (chechUserHasCache === "course") {
      const courseNames = await courseService.getCourseTitles(userLang);
      if (courseNames.includes(text) && userId) {
        await handleCourseSelection(ctx, text, userLang);
        return;
      }
    }

    // Handle calculator text messages
    if (chechUserHasCache && userId) {
      await handleCalculatorText(ctx, text, userId, userLang);
    }

    if (ctx.user?.role !== 'user') {
      const session = miftahdb.get<AdminSession>(userId);
      if (!session) return;

      const { step, data } = session;

      // FAQ Creation Flow
      if (step === "add_faq_question_ar") {
        miftahdb.set(userId, {
          step: "add_faq_question_en",
          data: { ...data, question: { ar: text }}
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *السؤال بالعربية تم حفظه*\n\nالآن أدخل السؤال باللغة الإنجليزية"
            : "📝 *Arabic question saved*\n\nNow enter the question in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_faq_question_en") {
        miftahdb.set(userId, {
          step: "add_faq_answer_ar",
          data: { ...data, question: { ...data.question, en: text }}
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *السؤال بالإنجليزية تم حفظه*\n\nالآن أدخل الإجابة باللغة العربية"
            : "📝 *English question saved*\n\nNow enter the answer in Arabic",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_faq_answer_ar") {
        miftahdb.set(userId, {
          step: "add_faq_answer_en",
          data: { ...data, answer: { ar: text }}
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *الإجابة بالعربية تم حفظها*\n\nالآن أدخل الإجابة باللغة الإنجليزية"
            : "📝 *Arabic answer saved*\n\nNow enter the answer in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_faq_answer_en") {
        try {
          await faqService.createFAQ({
            question: data.question,
            answer: { ...data.answer, en: text }
          });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة السؤال الشائع بنجاح!*\n\nيمكنك الآن رؤية السؤال الجديد في قائمة الأسئلة الشائعة."
              : "✅ *FAQ added successfully!*\n\nYou can now see the new question in the FAQ list.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة السؤال الشائع*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding the FAQ*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }


      if (step === "add_group_course_code") {
        miftahdb.set(userId, {
          step: "add_group_main_link",
          data: { ...data, courseCode: text.toUpperCase() }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *رمز الكورس تم حفظه*\n\nالآن أدخل رابط القروب العام"
            : "📝 *Course code saved*\n\nNow enter main group link",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_group_main_link") {
        miftahdb.set(userId, {
          step: "add_group_section_link",
          data: { ...data, main: { ar: "القروب العام", en: "Main Group", link: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *رابط القروب العام تم حفظه*\n\nالآن أدخل رابط قروب الشعب"
            : "📝 *Main group link saved*\n\nNow enter section group link",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_group_section_link") {
        try {
          await groupService.createGroup({
            courseCode: data.courseCode,
            main: data.main,
            section: { ar: "قروب الشعب", en: "Section Group", link: text }
          });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة القروب بنجاح!*\n\nيمكنك الآن رؤية القروب الجديد في قائمة القروبات."
              : "✅ *Group added successfully!*\n\nYou can now see new group in groups list.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة القروب*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding group*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }


      // Course Creation Flow
      if (step === "add_course_title_ar") {
        miftahdb.set(userId, {
          step: "add_course_title_en",
          data: { ...data, title: { ar: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالعربية تم حفظه*\n\nالآن أدخل العنوان باللغة الإنجليزية"
            : "📝 *Arabic title saved*\n\nNow enter the title in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_course_title_en") {
        miftahdb.set(userId, {
          step: "add_course_link",
          data: { ...data, title: { ...data.title, en: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالإنجليزية تم حفظه*\n\nالآن أدخل رابط الكورس"
            : "📝 *English title saved*\n\nNow enter the course link",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_course_link") {
        try {
          await courseService.createCourse({
            title: data.title,
            link: text
          });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة الكورس بنجاح!*\n\nيمكنك الآن رؤية الكورس الجديد في قائمة الكورسات."
              : "✅ *Course added successfully!*\n\nYou can now see the new course in the courses list.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة الكورس*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding the course*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }


      // Calendar Event Creation Flow
      if (step === "add_calendar_title_ar") {
        miftahdb.set(userId, {
          step: "add_calendar_title_en",
          data: { ...data, title: { ar: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالعربية تم حفظه*\n\nالآن أدخل العنوان باللغة الإنجليزية"
            : "📝 *Arabic title saved*\n\nNow enter title in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_calendar_title_en") {
        miftahdb.set(userId, {
          step: "add_calendar_answer_ar",
          data: { ...data, title: { ...data.title, en: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالإنجليزية تم حفظه*\n\nالآن أدخل الإجابة باللغة العربية"
            : "📝 *English title saved*\n\nNow enter answer in Arabic",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_calendar_answer_ar") {
        miftahdb.set(userId, {
          step: "add_calendar_answer_en",
          data: { ...data, answer: { ar: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *الإجابة بالعربية تم حفظها*\n\nالآن أدخل الإجابة باللغة الإنجليزية"
            : "📝 *Arabic answer saved*\n\nNow enter answer in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_calendar_answer_en") {
        try {
          await calendarService.createCalendarEvent({
            title: data.title,
            answer: { ...data.answer, en: text }
          });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة الحدث التقويمي بنجاح!*\n\nيمكنك الآن رؤية الحدث الجديد في التقويم الأكاديمي."
              : "✅ *Calendar event added successfully!*\n\nYou can now see the new event in the academic calendar.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة الحدث التقويمي*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding the calendar event*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }

      // Book Creation Flow
      if (step === "add_book_course_code") {
        const courseCode = text.toUpperCase();
        
        // Check if book already exists
        const existingBook = await bookService.getBookByCourseCode(courseCode);
        
        if (existingBook) {
          // Book exists, ask for new metadata to update
          miftahdb.set(userId, {
            step: "update_book_metadata",
            data: { ...data, courseCode }
          });
          await ctx.reply(
            userLang === "ar"
              ? `📚 *الكتاب موجود بالفعل*\n\nرمز الكورس: ${courseCode}\n\nالآن أدخل معرفات الملفات الجديدة (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد`
              : `📚 *Book already exists*\n\nCourse code: ${courseCode}\n\nNow enter new file IDs - you can enter multiple IDs, each on a new line`,
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [messages.inlineButtons.cancel(userLang)]
                ]
              }
            }
          );
          return;
        }
        
        // Check if course code exists in materials.json
        const material = (materials as Material[]).find(m => m.id === courseCode);
        
        if (material) {
          // Course found in materials.json, auto-fill the title
          miftahdb.set(userId, {
            step: "add_book_file_ids",
            data: {
              ...data,
              courseCode,
              title: {
                ar: material.nameAr,
                en: material.nameEn
              }
            }
          });
          await ctx.reply(
            userLang === "ar"
              ? `📝 *رمز الكورس تم حفظه*\n\n📚 اسم الكورس: ${material.nameAr}\n\nتم تعبئة العنوان تلقائياً من قائمة المواد.\n\nالآن أدخل معرفات الملفات (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد`
              : `📝 *Course code saved*\n\n📚 Course name: ${material.nameEn}\n\nTitle has been auto-filled from materials list.\n\nNow enter file IDs - you can enter multiple IDs, each on a new line`,
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [messages.inlineButtons.cancel(userLang)]
                ]
              }
            }
          );
          return;
        }
        
        // Course not found in materials.json, proceed with manual title entry
        miftahdb.set(userId, {
          step: "add_book_title_ar",
          data: { ...data, courseCode }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *رمز الكورس تم حفظه*\n\n⚠️ لم يتم العثور على الكورس في قائمة المواد.\n\nالآن أدخل عنوان الكتاب باللغة العربية"
            : "📝 *Course code saved*\n\n⚠️ Course not found in materials list.\n\nNow enter the book title in Arabic",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_book_title_ar") {
        miftahdb.set(userId, {
          step: "add_book_title_en",
          data: { ...data, title: { ar: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالعربية تم حفظه*\n\nالآن أدخل عنوان الكتاب باللغة الإنجليزية"
            : "📝 *Arabic title saved*\n\nNow enter the book title in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_book_title_en") {
        miftahdb.set(userId, {
          step: "add_book_file_ids",
          data: { ...data, title: { ...data.title, en: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالإنجليزية تم حفظه*\n\nالآن أدخل معرفات الملفات (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد"
            : "📝 *English title saved*\n\nNow enter file IDs - you can enter multiple IDs, each on a new line",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_book_file_ids") {
        try {
          const fileIds = text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
          
          // Check if no file IDs provided
          if (fileIds.length === 0) {
            miftahdb.delete(userId);
            await ctx.reply(
              userLang === "ar"
                ? "❌ *تم إلغاء العملية*\n\nلم يتم إدخال أي معرفات ملفات."
                : "❌ *Operation cancelled*\n\nNo file IDs were provided.",
              {
                reply_to_message_id: ctx.message?.message_id,
                parse_mode: "Markdown"
              }
            );
            return;
          }
          
          await bookService.createBook({
            courseCode: data.courseCode,
            title: data.title,
            metaData: fileIds
          } as any);
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة الكتاب بنجاح!*\n\nيمكنك الآن رؤية الكتاب الجديد في قائمة الكتب."
              : "✅ *Book added successfully!*\n\nYou can now see the new book in the books list.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة الكتاب*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding the book*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }

      if (step === "update_book_metadata") {
        try {
          const fileIds = text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
          
          // Check if no file IDs provided
          if (fileIds.length === 0) {
            miftahdb.delete(userId);
            await ctx.reply(
              userLang === "ar"
                ? "❌ *تم إلغاء العملية*\n\nلم يتم إدخال أي معرفات ملفات."
                : "❌ *Operation cancelled*\n\nNo file IDs were provided.",
              {
                reply_to_message_id: ctx.message?.message_id,
                parse_mode: "Markdown"
              }
            );
            return;
          }
          
          await bookService.updateBook(undefined, data.courseCode, { metaData: fileIds });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تم تحديث الكتاب بنجاح!*\n\nتم تحديث معرفات الملفات للكتاب."
              : "✅ *Book updated successfully!*\n\nThe book file IDs have been updated.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          return;
        } catch (error) {
          miftahdb.delete(userId);
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء تحديث الكتاب*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while updating the book*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          return;
        }
      }


      // Slide Creation Flow
      if (step === "add_slide_course_code") {
        const courseCode = text.toUpperCase();
        
        // Check if slide already exists
        const existingSlide = await slideService.getSlideByCourseCode(courseCode);
        
        if (existingSlide) {
          // Slide exists, ask for new metadata to update
          miftahdb.set(userId, {
            step: "update_slide_metadata",
            data: { ...data, courseCode }
          });
          await ctx.reply(
            userLang === "ar"
              ? `📊 *السلايد موجود بالفعل*\n\nرمز الكورس: ${courseCode}\n\nالآن أدخل معرفات الملفات الجديدة (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد`
              : `📊 *Slide already exists*\n\nCourse code: ${courseCode}\n\nNow enter new file IDs - you can enter multiple IDs, each on a new line`,
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [messages.inlineButtons.cancel(userLang)]
                ]
              }
            }
          );
          return;
        }
        
        // Check if course code exists in materials.json
        const material = (materials as Material[]).find(m => m.id === courseCode);
        
        if (material) {
          // Course found in materials.json, auto-fill the title
          miftahdb.set(userId, {
            step: "add_slide_file_ids",
            data: {
              ...data,
              courseCode,
              title: {
                ar: material.nameAr,
                en: material.nameEn
              }
            }
          });
          await ctx.reply(
            userLang === "ar"
              ? `📝 *رمز الكورس تم حفظه*\n\n📚 اسم الكورس: ${material.nameAr}\n\nتم تعبئة العنوان تلقائياً من قائمة المواد.\n\nالآن أدخل معرفات الملفات (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد`
              : `📝 *Course code saved*\n\n📚 Course name: ${material.nameEn}\n\nTitle has been auto-filled from materials list.\n\nNow enter file IDs - you can enter multiple IDs, each on a new line`,
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [messages.inlineButtons.cancel(userLang)]
                ]
              }
            }
          );
          return;
        }
        
        // Course not found in materials.json, proceed with manual title entry
        miftahdb.set(userId, {
          step: "add_slide_title_ar",
          data: { ...data, courseCode }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *رمز الكورس تم حفظه*\n\n⚠️ لم يتم العثور على الكورس في قائمة المواد.\n\nالآن أدخل عنوان السلايد باللغة العربية"
            : "📝 *Course code saved*\n\n⚠️ Course not found in materials list.\n\nNow enter the slide title in Arabic",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_slide_title_ar") {
        miftahdb.set(userId, {
          step: "add_slide_title_en",
          data: { ...data, title: { ar: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالعربية تم حفظه*\n\nالآن أدخل عنوان السلايد باللغة الإنجليزية"
            : "📝 *Arabic title saved*\n\nNow enter the slide title in English",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_slide_title_en") {
        miftahdb.set(userId, {
          step: "add_slide_file_ids",
          data: { ...data, title: { ...data.title, en: text } }
        });
        await ctx.reply(
          userLang === "ar"
            ? "📝 *العنوان بالإنجليزية تم حفظه*\n\nالآن أدخل معرفات الملفات (File IDs) - يمكنك إدخال عدة معرفات، كل معرف في سطر جديد"
            : "📝 *English title saved*\n\nNow enter file IDs - you can enter multiple IDs, each on a new line",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [messages.inlineButtons.cancel(userLang)]
              ]
            }
          }
        );
        return;
      }

      if (step === "add_slide_file_ids") {
        try {
          const fileIds = text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
          
          // Check if no file IDs provided
          if (fileIds.length === 0) {
            miftahdb.delete(userId);
            await ctx.reply(
              userLang === "ar"
                ? "❌ *تم إلغاء العملية*\n\nلم يتم إدخال أي معرفات ملفات."
                : "❌ *Operation cancelled*\n\nNo file IDs were provided.",
              {
                reply_to_message_id: ctx.message?.message_id,
                parse_mode: "Markdown"
              }
            );
            return;
          }
          
          await slideService.createSlide({
            courseCode: data.courseCode,
            title: data.title,
            metaData: fileIds
          } as any);
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تمت إضافة السلايد بنجاح!*\n\nيمكنك الآن رؤية السلايد الجديد في قائمة السلايدات."
              : "✅ *Slide added successfully!*\n\nYou can now see the new slide in the slides list.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء إضافة السلايد*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while adding the slide*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
          miftahdb.delete(userId);
        }
        return;
      }

      // Slide Update Metadata Flow
      if (step === "update_slide_metadata") {
        try {
          const fileIds = text.split("\n").map(s => s.trim()).filter(s => s.length > 0);
          
          // Check if no file IDs provided
          if (fileIds.length === 0) {
            miftahdb.delete(userId);
            await ctx.reply(
              userLang === "ar"
                ? "❌ *تم إلغاء العملية*\n\nلم يتم إدخال أي معرفات ملفات."
                : "❌ *Operation cancelled*\n\nNo file IDs were provided.",
              {
                reply_to_message_id: ctx.message?.message_id,
                parse_mode: "Markdown"
              }
            );
            return;
          }
          
          await slideService.updateSlide(undefined, data.courseCode, { metaData: fileIds });
          
          // Clear session
          miftahdb.delete(userId);
          
          await ctx.reply(
            userLang === "ar"
              ? "✅ *تم تحديث السلايد بنجاح!*\n\nتم تحديث معرفات الملفات للسلايد."
              : "✅ *Slide updated successfully!*\n\nThe slide file IDs have been updated.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        } catch (error) {
          miftahdb.delete(userId);
          await ctx.reply(
            userLang === "ar"
              ? "❌ *حدث خطأ أثناء تحديث السلايد*\n\nيرجى المحاولة مرة أخرى أو التواصل مع المطور."
              : "❌ *An error occurred while updating the slide*\n\nPlease try again or contact the developer.",
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown"
            }
          );
        }
        return;
      }

      // Broadcast Flow
      if (step.startsWith("broadcast_")) {
        await handleBroadcastStep(ctx, userId, userLang);
        return;
      }
    }
  });
}
