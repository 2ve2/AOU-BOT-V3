/**
 * Groups Handler
 */

import type { Context } from "grammy";
import { messages } from "../messages";
import { groupService } from "../services/groupService";
import { miftahdb } from "@/lib/miftahdbService";

export async function handleGroups(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    miftahdb.set(userId, "group");
    
    const groups = await groupService.getAllGroups();

    if (groups.length === 0) {
      await ctx.reply(
        userLang === "ar" ? "لا توجد قروبات حالياً." : "No groups available at the moment.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return
    }


    const keyboard: string[][] = [];
    for (let i = 0; i < groups.length; i += 2) {
      const row = groups.slice(i, i + 2).map(group => group.courseCode);
      keyboard.push(row);
    }

    keyboard.push([userLang === "ar" ? "رجوع" : "Back"]);

    await ctx.reply(
      userLang === "ar" ? "- اختر احد الكورسات." : "- Select a course code.",
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


export async function handleGroupSelection(ctx: Context, courseCode: string, userLang: "ar" | "en") {
  try {
    const group = await groupService.getGroupByCourseCode(courseCode);

    if (!group) {
      await ctx.reply(
        userLang === "ar" ? "القروب غير موجود." : "Group not found.", {
          reply_to_message_id: ctx.message?.message_id,
        } 
      );
      return;
    }

    const mainLink = group.main.link;
    const sectionLink = group.section.link;

    const isAdmin = ctx.user?.role !== "user";

    const linkText = userLang === "ar" ? "اضغط هنا" : "Click here";
    const mainGroupText = userLang === "ar" ? "القروب العام" : "Main Group";
    const sectionGroupText = userLang === "ar" ? "قروب الشعب" : "Section Group";

    let groupsText = `📚 ${group.courseCode}\n\n`;
    groupsText += `- ${mainGroupText}\n`;
    groupsText += `• 🔗 ${userLang === "ar" ? "الرابط" : "Link"} : [${linkText}](${mainLink})\n-\n`;
    groupsText += `- ${sectionGroupText}\n`;
    groupsText += `• 🔗 ${userLang === "ar" ? "الرابط" : "Link"} : [${linkText}](${sectionLink})\n`;

    await ctx.reply(groupsText, {
      reply_to_message_id: ctx.message?.message_id,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: isAdmin ? [
          [ messages.inlineButtons.delete(userLang, `delete_group_${group.id}`) ],
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