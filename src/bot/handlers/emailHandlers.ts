/**
 * Email/Department Info Handlers
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import * as branchService from "../services/branchService";
import { CacheKeys, CacheTTL, miftahdb } from "@/lib/miftahdbService";

/**
 * Handler for "Emails" button
 * Shows branch selection keyboard
 */
export async function handleEmails(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    // Add user to miftahdb when entering emails flow
    miftahdb.set(userId, "email");

    const branches = branchService.getBranchNames(userLang);
    
    // Create keyboard with branch names in rows of 2
    const keyboard: string[][] = [];
    for (let i = 0; i < branches.length; i += 2) {
      const row = branches.slice(i, i + 2);
      keyboard.push(row);
    }
    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);
    
    await ctx.reply(
      userLang === "ar" ? "- اختر احد الفروع." : "- Select a branch.",
      {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        }
      }
    );
  } catch {
    ctx.reply(
      messages.error[userLang],
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
}

/**
 * Handler for branch selection
 * Shows department selection keyboard
 */
export async function handleBranchSelection(ctx: Context, userId: string, userLang: "ar" | "en", branchName: string) {
  try {
    // Store selected branch in cache
    miftahdb.set(CacheKeys.userEmail(userId), branchName, CacheTTL.MEDIUM); // 5 minutes
    
    const branch = branchService.getBranchByName(branchName);
    if (!branch) {
      ctx.reply(
        userLang === "ar" ? "الفرع غير موجود." : "Branch not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    const departments = branch.departments.map((d: any) => d.department_name[userLang]);
    // Create keyboard with departments in rows of 2
    const keyboard: string[][] = [];
    for (let i = 0; i < departments.length; i += 2) {
      const row = departments.slice(i, i + 2);
      keyboard.push(row);
    }
    // Add back button
    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);
    
    await ctx.reply(
      userLang === "ar" ? "- اختر احد الاقسام." : "- Select a department.",
      {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          keyboard,
          resize_keyboard: true,
        }
      }
    );
  } catch {
    ctx.reply(
      messages.error[userLang],
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
}

/**
 * Handler for department selection
 * Shows department info with emails
 */
export async function handleDepartmentSelection(ctx: Context, userId: string, userLang: "ar" | "en", departmentName: string) {
  try {
    // Get selected branch from cache
    const selectedBranch = miftahdb.get<string>(CacheKeys.userEmail(userId));
    
    if (!selectedBranch) {
      ctx.reply(
        userLang === "ar" ? "يرجى اختيار الفرع أولاً." : "Please select a branch first.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    const message = branchService.formatDepartmentInfo(selectedBranch, departmentName, userLang);
    
    if (!message) {
      ctx.reply(
        userLang === "ar" ? "القسم غير موجود." : "Department not found.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }
    
    await ctx.reply(message, {
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
    
    // Clear the cache
    miftahdb.delete(CacheKeys.userEmail(userId));

    // Return to main menu
    await ctx.reply(messages.menuTitle[userLang], {
      reply_markup: {
        keyboard: messages.keyboard[userLang] as any,
        resize_keyboard: true,
      }
    });
  } catch {
    ctx.reply(
      messages.error[userLang],
      { reply_to_message_id: ctx.message?.message_id }
    );
  }
}
