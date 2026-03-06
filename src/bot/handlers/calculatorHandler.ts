/**
 * Calculator Handler
 * Handles fee calculator functionality
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { calculateFees, formatCalculationResult, COURSE_PRICES } from "../services/calculatorService";
import { miftahdb } from "@/lib/miftahdbService";

interface CalcSession {
  step: string;
  data: {
    calculate?: {
      mode: number; // 1 = Saudi, 2 = Non-Saudi
      selectedCourses: string[];
    };
  };
}

/**
 * Handle calculator main menu - shows nationality selection
 */
export async function handleCalculator(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    // Initialize calculator session in miftahdb
    miftahdb.set<CalcSession>(userId, {
      step: "nationality",
      data: {}
    });

    const keyboard = [
      [
        { text: userLang === "ar" ? "نعم (سعودي)" : "Yes (Saudi)", callback_data: "calc_saudi" },
      ],
      [
        { text: userLang === "ar" ? "لا (غير سعودي)" : "No (Non-Saudi)", callback_data: "calc_nonsaudi" }
      ]
    ];

    await ctx.reply(
      userLang === "ar" 
        ? "للبدء، حدد هل أنت سعودي الجنسية أم لا."
        : "To start, select whether you are Saudi or not.",
      {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: keyboard
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
 * Show course selection keyboard
 */
export async function showCourseSelection(ctx: Context, userLang: "ar" | "en") {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const session = miftahdb.get<CalcSession>(userId);
  if (!session || !session.data.calculate) return;

  const selectedCourses = session.data.calculate.selectedCourses || [];

  // Build keyboard with courses (2 per row)
  const keyboard: string[][] = [];

  // Sort courses by ID
  const sortedCourses = [...COURSE_PRICES].sort((a, b) => a.id.localeCompare(b.id));

  // Create course buttons with selection status
  const courseButtons = sortedCourses.map((course) => {
    const isSelected = selectedCourses.includes(course.id);
    const prefix = isSelected ? "✅ " : "";
    return `${prefix}${course.id}`;
  });

  // Add courses 2 per row
  for (let i = 0; i < courseButtons.length; i += 2) {
    const row = courseButtons.slice(i, i + 2);
    keyboard.push(row);
  }

  // Add action buttons
  keyboard.push([userLang === "ar" ? "مسح الكل 🗑️" : "Clear All 🗑️"]);
  keyboard.push([userLang === "ar" ? "جاهز للحساب ✅" : "Ready to Calculate ✅"]);
  keyboard.push([userLang === "ar" ? "إلغاء" : "Cancel"]);

  const selectedCount = selectedCourses.length;
  const header = userLang === "ar"
    ? `📚 اختر المقررات (${selectedCount} محدد)`
    : `📚 Select Courses (${selectedCount} selected)`;

  const instruction = userLang === "ar"
    ? "\n\n💡 يمكنك اختيار المقرر من القائمة أو كتابة اسم المقرر مباشرة"
    : "\n\n💡 You can select a course from the list or type the course name directly";

  await ctx.reply(header + instruction, {
    reply_to_message_id: ctx.message?.message_id,
    reply_markup: {
      keyboard: keyboard as any,
      resize_keyboard: true,
    }
  });
}

/**
 * Handle calculator callback queries (nationality selection only)
 */
export async function handleCalculatorCallback(ctx: Context, callbackData: string, userId: string, userLang: "ar" | "en") {
  try {
    // Handle Saudi nationality selection
    if (callbackData === "calc_saudi") {
      miftahdb.set<CalcSession>(userId, {
        step: "courses",
        data: {
          calculate: {
            mode: 1,
            selectedCourses: []
          }
        }
      });
      
      const selectedText = userLang === "ar" ? "✅ تم اختيار: سعودي" : "✅ Selected: Saudi";
      await ctx.editMessageText(selectedText);
      
      await showCourseSelection(ctx, userLang);
      await ctx.answerCallbackQuery();
      return;
    }

    // Handle Non-Saudi nationality selection
    if (callbackData === "calc_nonsaudi") {
      miftahdb.set<CalcSession>(userId, {
        step: "courses",
        data: {
          calculate: {
            mode: 2,
            selectedCourses: []
          }
        }
      });
      
      const selectedText = userLang === "ar" ? "✅ تم اختيار: غير سعودي" : "✅ Selected: Non-Saudi";
      await ctx.editMessageText(selectedText);
      
      await showCourseSelection(ctx, userLang);
      await ctx.answerCallbackQuery();
      return;
    }

    await ctx.answerCallbackQuery();
  } catch {
    ctx.reply(messages.error[userLang], {
      reply_to_message_id: ctx.message?.message_id
    });
  }
}

/**
 * Handle calculator text messages (course selection, clear, ready, cancel)
 */
export async function handleCalculatorText(ctx: Context, text: string, userId: string, userLang: "ar" | "en") {
  const session = miftahdb.get<CalcSession>(userId);
  if (!session || session.step !== "courses") return;

  const clearText = userLang === "ar" ? "مسح الكل 🗑️" : "Clear All 🗑️";
  const readyText = userLang === "ar" ? "جاهز للحساب ✅" : "Ready to Calculate ✅";
  const cancelText = userLang === "ar" ? "إلغاء" : "Cancel";

  // Handle clear all
  if (text === clearText) {
    if (session.data.calculate) {
      session.data.calculate.selectedCourses = [];
      miftahdb.set(userId, session);
    }
    await showCourseSelection(ctx, userLang);
    return;
  }

  // Handle ready to calculate
  if (text === readyText) {
    if (!session.data.calculate || session.data.calculate.selectedCourses.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "الرجاء اختيار مقرر واحد على الأقل" : "Please select at least one course",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }

    const { mode, selectedCourses } = session.data.calculate;
    const result = calculateFees(mode.toString(), selectedCourses, COURSE_PRICES);
    const formattedResult = formatCalculationResult(result, selectedCourses, userLang);

    await ctx.reply(formattedResult, {
      reply_to_message_id: ctx.message?.message_id,
      reply_markup: {
        inline_keyboard: [
        [
          messages.inlineButtons.channel(userLang),
          messages.inlineButtons.share(userLang)
        ],
        [messages.inlineButtons.suggestion(userLang)]
        ]
      },
      parse_mode: "HTML"
    });

    // Show main menu keyboard after result
    await ctx.reply(messages.menuTitle[userLang], {
      reply_markup: {
        keyboard: messages.keyboard[userLang] as any,
        resize_keyboard: true,
      }
    });

    miftahdb.delete(userId);
    return;
  }

  // Handle cancel
  if (text === cancelText) {
    miftahdb.delete(userId);
    await ctx.reply(messages.menuTitle[userLang], {
      reply_to_message_id: ctx.message?.message_id,
      reply_markup: {
        keyboard: messages.keyboard[userLang] as any,
        resize_keyboard: true,
      }
    });
    return;
  }

  // Handle course selection - convert to uppercase
  const courseIds = COURSE_PRICES.map(c => c.id);
  const cleanText = text.replace("✅ ", "").toUpperCase();
  
  if (courseIds.includes(cleanText)) {
    if (session.data.calculate) {
      const index = session.data.calculate.selectedCourses.indexOf(cleanText);
      if (index > -1) {
        session.data.calculate.selectedCourses.splice(index, 1);
      } else {
        session.data.calculate.selectedCourses.push(cleanText);
      }
      miftahdb.set(userId, session);
    }
    await showCourseSelection(ctx, userLang);
    return;
  }
}
