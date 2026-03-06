import type { Context } from "grammy";
import { userService } from "../services/userService";

export async function handleMe(ctx: Context) {
  const userId = ctx.from?.id?.toString();
  if (!userId) return;

  const userLang = ctx.user?.lang || "ar";

  try {
    const user = await userService.getUserById(userId);

    if (!user) {
      await ctx.reply(
        userLang === "ar" ? "❌ لم يتم العثور على ملفك الشخصي." : "❌ Your profile not found.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    const status = user.isBanned
      ? (userLang === "ar" ? "محظور" : "Banned")
      : (userLang === "ar" ? "نشط" : "Active");

    const role = user.role === "admin"
      ? (userLang === "ar" ? "مشرف" : "Admin")
      : user.role === "owner"
      ? (userLang === "ar" ? "مالك" : "Owner")
      : (userLang === "ar" ? "مستخدم" : "User");

    const activeStatus = user.isActive
      ? (userLang === "ar" ? "نشط" : "Active")
      : (userLang === "ar" ? "غير نشط" : "Inactive");

    const message = (userLang === "ar" ? "👤 ملفي الشخصي\n\n" : "👤 My Profile\n\n") +
      (userLang === "ar" ? "• معرف المستخدم: " : "• User ID: ") + `${user.userId}\n` +
      (userLang === "ar" ? "• اسم المستخدم: " : "• Username: ") + `${user.userName || "N/A"}\n` +
      (userLang === "ar" ? "• الاسم الكامل: " : "• Full Name: ") + `${user.fullName || "N/A"}\n` +
      (userLang === "ar" ? "• الحالة: " : "• Status: ") + `${status}\n` +
      (userLang === "ar" ? "• النشاط: " : "• Active: ") + `${activeStatus}\n` +
      (userLang === "ar" ? "• الرتبة: " : "• Role: ") + `${role}\n` +
      (userLang === "ar" ? "• اللغة: " : "• Language: ") + `${userLang === "ar" ? "العربية" : "English"}\n` +
      (userLang === "ar" ? "• تاريخ الإنشاء: " : "• Created At: ") + `${new Date(user.createdAt).toLocaleDateString()}\n` +
      (user.isBanned
        ? `\n${userLang === "ar" ? "• تاريخ الحظر: " : "• Banned At: "}${new Date(user.bannedAt || "").toLocaleDateString()}\n${userLang === "ar" ? "• سبب الحظر: " : "• Banned Reason: "}${user.bannedReason || "N/A"}`
        : "");

    await ctx.reply(message + "\n-", {
      reply_to_message_id: ctx.message?.message_id
    });
  } catch (error) {
    await ctx.reply(
      userLang === "ar" ? "❌ فشل في الحصول على ملفك الشخصي." : "❌ Failed to get your profile.",
      {
        reply_to_message_id: ctx.message?.message_id
      }
    );
  }
}
