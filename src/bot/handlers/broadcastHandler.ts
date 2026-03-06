/**
 * Broadcast Handler
 * Handles sending messages with buttons to the updates channel
 */

import type { Context } from "grammy";
import { miftahdb } from "@/lib/miftahdbService";
import { env } from "@/config/env";

interface BroadcastData {
  messageText: string;
  buttons: Array<{ text: string; url: string }>;
}

export async function handleBroadcastStep(ctx: Context, userId: string, userLang: "ar" | "en") {
  try {
    const userData = miftahdb.get(userId);
    if (!userData || typeof userData !== "object") return;

    const step = (userData as any).step;
    const data = (userData as any).data || {};

    switch (step) {
      case "broadcast_message":
        // Store the message text
        data.messageText = ctx.message?.text || "";
        (userData as any).data = data;
        (userData as any).step = "broadcast_button_count";
        miftahdb.set(userId, userData);

        await ctx.reply(
          userLang === "ar"
            ? "🔘 *عدد الأزرار*\n\nكم عدد الأزرار التي تريد إضافتها؟ (1-10)"
            : "🔘 *Number of buttons*\n\nHow many buttons do you want to add? (1-10)",
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "إلغاء" : "Cancel", callback_data: "admin_cancel" }]
              ]
            }
          }
        );
        break;

      case "broadcast_button_count":
        const buttonCount = parseInt(ctx.message?.text || "0");
        if (isNaN(buttonCount) || buttonCount < 1 || buttonCount > 10) {
          await ctx.reply(
            userLang === "ar"
              ? "⚠️ الرجاء إدخال رقم صحيح بين 1 و 10."
              : "⚠️ Please enter a valid number between 1 and 10.",
            { reply_to_message_id: ctx.message?.message_id }
          );
          return;
        }

        data.buttonCount = buttonCount;
        data.buttons = [];
        data.currentButtonIndex = 0;
        (userData as any).data = data;
        (userData as any).step = "broadcast_button_text";
        miftahdb.set(userId, userData);

        await ctx.reply(
          userLang === "ar"
            ? `🔘 *الزر 1/${buttonCount}*\n\nأدخل نص الزر:`
            : `🔘 *Button 1/${buttonCount}*\n\nEnter button text:`,
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "إلغاء" : "Cancel", callback_data: "admin_cancel" }]
              ]
            }
          }
        );
        break;

      case "broadcast_button_text":
        const buttonText = ctx.message?.text || "";
        if (!buttonText) {
          await ctx.reply(
            userLang === "ar"
              ? "⚠️ الرجاء إدخال نص الزر."
              : "⚠️ Please enter button text.",
            { reply_to_message_id: ctx.message?.message_id }
          );
          return;
        }

        data.buttons[data.currentButtonIndex] = { text: buttonText, url: "" };
        (userData as any).data = data;
        (userData as any).step = "broadcast_button_url";
        miftahdb.set(userId, userData);

        await ctx.reply(
          userLang === "ar"
            ? `🔗 *رابط الزر*\n\nأدخل رابط الزر:`
            : `🔗 *Button URL*\n\nEnter button URL:`,
          {
            reply_to_message_id: ctx.message?.message_id,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "إلغاء" : "Cancel", callback_data: "admin_cancel" }]
              ]
            }
          }
        );
        break;

      case "broadcast_button_url":
        const buttonUrl = ctx.message?.text || "";
        if (!buttonUrl) {
          await ctx.reply(
            userLang === "ar"
              ? "⚠️ الرجاء إدخال رابط الزر."
              : "⚠️ Please enter button URL.",
            { reply_to_message_id: ctx.message?.message_id }
          );
          return;
        }

        data.buttons[data.currentButtonIndex].url = buttonUrl;
        data.currentButtonIndex++;

        // Check if all buttons are done
        if (data.currentButtonIndex >= data.buttonCount) {
          // Send the broadcast
          await sendBroadcast(ctx, data, userLang, userId);
          miftahdb.delete(userId);
        } else {
          (userData as any).data = data;
          (userData as any).step = "broadcast_button_text";
          miftahdb.set(userId, userData);

          await ctx.reply(
            userLang === "ar"
              ? `🔘 *الزر ${data.currentButtonIndex + 1}/${data.buttonCount}*\n\nأدخل نص الزر:`
              : `🔘 *Button ${data.currentButtonIndex + 1}/${data.buttonCount}*\n\nEnter button text:`,
            {
              reply_to_message_id: ctx.message?.message_id,
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [{ text: userLang === "ar" ? "إلغاء" : "Cancel", callback_data: "admin_cancel" }]
                ]
              }
            }
          );
        }
        break;
    }
  } catch (error) {
    await ctx.reply(
      userLang === "ar" ? "❌ حدث خطأ." : "❌ An error occurred.",
      { reply_to_message_id: ctx.message?.message_id }
    );
    miftahdb.delete(userId);
  }
}

async function sendBroadcast(ctx: Context, data: any, userLang: "ar" | "en", userId: string) {
  try {
    if (!env.UPDATES_CHANNEL_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ لم يتم تكوين قناة التحديثات."
          : "⚠️ Updates channel is not configured.",
        { reply_to_message_id: ctx.message?.message_id }
      );
      miftahdb.delete(userId);
      return;
    }

    // Build inline keyboard
    const inlineKeyboard = data.buttons.map((btn: any) => [
      { text: btn.text, url: btn.url }
    ]);

    // Send message to updates channel
    await ctx.api.sendMessage(env.UPDATES_CHANNEL_ID, data.messageText, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });

    await ctx.reply(
      userLang === "ar"
        ? "✅ تم إرسال الرسالة إلى قناة التحديثات بنجاح!"
        : "✅ Message sent to updates channel successfully!",
      {
        reply_to_message_id: ctx.message?.message_id
      }
    );
  } catch (error) {
    await ctx.reply(
      userLang === "ar"
        ? "❌ فشل في إرسال الرسالة. تأكد من أن البوت لديه صلاحيات في القناة."
        : "❌ Failed to send message. Make sure the bot has permissions in the channel.",
      { reply_to_message_id: ctx.message?.message_id }
    );
    miftahdb.delete(userId);
  }
}
