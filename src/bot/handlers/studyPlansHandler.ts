/**
 * Study Plans Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import * as planService from "../services/planService";
import { CacheKeys, CacheTTL, miftahdb } from "@/lib/miftahdbService";

/**
 * Handler for "Plans" button
 * Shows plan selection keyboard
 */
export async function handleStudyPlans(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    // Add user to miftahdb when entering study plans flow
    miftahdb.set(userId, "plan");

    const plans = planService.getPlanNames(userLang);
    
    // Create keyboard with plan titles in rows of 2
    const keyboard: string[][] = [];
    for (let i = 0; i < plans.length; i += 2) {
      const row = plans.slice(i, i + 2);
      keyboard.push(row);
    }
    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);
    
    await ctx.reply(
      userLang === "ar" ? "- اختر احد الخطط الدراسية." : "- Select a study plan.",
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
 * Handler for plan selection
 * Sends the plan document
 */
export async function handlePlanSelection(ctx: Context, userId: string, userLang: "ar" | "en", planName: string) {
  try {
    // Store selected plan in miftahdb
    miftahdb.set(CacheKeys.userPlan(userId), { "plan": planName }, CacheTTL.LONG );

    const plan = planService.getPlanByNames(planName);
    if (!plan) {
      ctx.reply(
        userLang === "ar" ? "الخطة غير موجودة." : "Plan not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    await ctx.replyWithDocument(userLang === "ar" ? plan.file_id_ar : plan.file_id_en, {
      reply_to_message_id: ctx.message?.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            messages.inlineButtons.channel(userLang),
            messages.inlineButtons.share(userLang)
          ],
          [messages.inlineButtons.suggestion(userLang)]
        ]
      }
    });
  } catch {
    ctx.reply(
      messages.error[userLang],
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
}
