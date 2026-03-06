import { Bot, Context, InputFile } from "grammy";
// import { autoRetry } from "@grammyjs/auto-retry";
import { userService } from "../services/userService";
import { authMiddleware } from "../middlewares/auth";
import { env } from "bun";
import { miftahdb } from "@/lib/miftahdbService";
import { statisticsService } from "../services/statisticsService";
import { backupService } from "../services/backupService";

export function setupAdminCommands(bot: Bot<Context>) {
  // // Enable auto-retry for handling rate limits and 429 errors
  // bot.api.config.use(autoRetry({
  //   maxRetryAttempts: 1,
  //   maxDelaySeconds: 5
  // }));


  // Admin command - make user admin
  bot.command("admin", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Get text after /admin command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const targetUserId = parts[1]; // Get the user ID after the command
 
    if (!targetUserId) {
      await ctx.reply(
        userLang === "ar" ? "الاستخدام: /admin <userId>" : "Usage: /admin <userId>",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Update user role to admin
      const updatedUser = await userService.updateUser(targetUserId, { role: 'admin' });
      if (updatedUser) {
        await ctx.reply(
          userLang === "ar"
            ? `✅ ${updatedUser.userId} أصبح الآن مشرف.`
            : `✅ ${updatedUser.userId} is now an admin.`,
          {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "👤 عرض الملف الشخصي" : "👤 View Profile", url: `tg://user?id=${updatedUser.userId}` }]
              ]
            }
          }
        );
      }
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في جعل المستخدم مشرف. قد لا يكون المستخدم موجوداً." : "❌ Failed to make user admin. User may not exist.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Unadmin command - remove admin from user
  bot.command("unadmin", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Get text after /unadmin command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const targetUserId = parts[1]; // Get the user ID after the command
 
    if (!targetUserId) {
      await ctx.reply(
        userLang === "ar" ? "الاستخدام: /unadmin <userId>" : "Usage: /unadmin <userId>",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Update user role to user
      const updatedUser = await userService.updateUser(targetUserId, { role: "user" });
      if (updatedUser) {
        await ctx.reply(
          userLang === "ar"
            ? `✅ ${updatedUser.userId} لم يعد مشرف.`
            : `✅ ${updatedUser.userId} is no longer an admin.`,
          {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "👤 عرض الملف الشخصي" : "👤 View Profile", url: `tg://user?id=${updatedUser.userId}` }]
              ]
            }
          }
        );
      }
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في إزالة المشرف. قد لا يكون المستخدم موجوداً." : "❌ Failed to remove admin. User may not exist.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Ban command - ban a user
  bot.command("ban", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner or admin
    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Get text after /ban command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const targetUserId = parts[1]; // Get the user ID after the command
    const reason = parts.slice(2).join(" ") || (userLang === "ar" ? "لا يوجد سبب" : "No reason provided"); // Get the reason
 
    if (!targetUserId) {
      await ctx.reply(
        userLang === "ar" ? "الاستخدام: /ban <userId> [reason]" : "Usage: /ban <userId> [reason]",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Ban the user
      const bannedUser = await userService.banUser(targetUserId, reason);

      if (bannedUser) {
        await ctx.reply(
          userLang === "ar"
            ? `✅ تم حظر المستخدم ${bannedUser.userId}\nالسبب: ${reason}`
            : `✅ User ${bannedUser.userId} has been banned.\nReason: ${reason}`,
          {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "👤 عرض الملف الشخصي" : "👤 View Profile", url: `tg://user?id=${targetUserId}` }]
              ]
            }
          }
        );
      }
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في حظر المستخدم. قد لا يكون المستخدم موجوداً." : "❌ Failed to ban user. User may not exist.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Unban command - unban a user
  bot.command("unban", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner or admin
    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Get text after /unban command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const targetUserId = parts[1]; // Get the user ID after the command

    if (!targetUserId) {
      await ctx.reply(
        userLang === "ar" ? "الاستخدام: /unban <userId>" : "Usage: /unban <userId>",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Unban the user
      const unbannedUser = await userService.unBanUser(targetUserId);

      if (unbannedUser) {
        await ctx.reply(
          userLang === "ar"
            ? `✅ تم إلغاء حظر المستخدم ${unbannedUser.userId}`
            : `✅ User ${unbannedUser.userId} has been unbanned.`,
          {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
              inline_keyboard: [
                [{ text: userLang === "ar" ? "👤 عرض الملف الشخصي" : "👤 View Profile", url: `tg://user?id=${targetUserId}` }]
              ]
            }
          }
        );
      }
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في إلغاء حظر المستخدم. قد لا يكون المستخدم موجوداً." : "❌ Failed to unban user. User may not exist.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // User command - show user information (owner only)
  bot.command("user", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Get text after /user command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const targetUserId = parts[1]; // Get the user ID after the command
 
    if (!targetUserId) {
      await ctx.reply(
        userLang === "ar" ? "الاستخدام: /user <userId>" : "Usage: /user <userId>",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Get user information
      const userResult = await userService.getUserById(targetUserId);
 
      if (!userResult) {
        await ctx.reply(
          userLang === "ar" ? "❌ المستخدم غير موجود." : "❌ User not found.",
          {
            reply_to_message_id: ctx.message?.message_id
          }
        );
        return;
      }
 
      const user = userResult;
      const status = user.isBanned ? (userLang === "ar" ? "🚫 محظور" : "🚫 Banned") : (userLang === "ar" ? "✅ نشط" : "✅ Active");
      const role = user.role === "admin" ? (userLang === "ar" ? "👑 مشرف" : "👑 Admin") : user.role === "owner" ? (userLang === "ar" ? "👑 مالك" : "👑 Owner") : (userLang === "ar" ? "👤 مستخدم" : "👤 User");
      const activeStatus = user.isActive ? (userLang === "ar" ? "✅ نشط" : "✅ Active") : (userLang === "ar" ? "❌ غير نشط" : "❌ Inactive");
 
      const message = (userLang === "ar" ? "👤 معلومات المستخدم\n\n" : "👤 User Information\n\n") +
        (userLang === "ar" ? "• معرف المستخدم: " : "• User ID: ") + `${user.userId}\n` +
        (userLang === "ar" ? "• اسم المستخدم: " : "• Username: ") + `${user.userName || "N/A"}\n` +
        (userLang === "ar" ? "• الاسم الكامل: " : "• Full Name: ") + `${user.fullName || "N/A"}\n` +
        (userLang === "ar" ? "• الحالة: " : "• Status: ") + `${status}\n` +
        (userLang === "ar" ? "• النشاط: " : "• Active: ") + `${activeStatus}\n` +
        (userLang === "ar" ? "• الدور: " : "• Role: ") + `${role}\n` +
        (userLang === "ar" ? "• تاريخ الإنشاء: " : "• Created At: ") + `${new Date(user.createdAt).toLocaleDateString()}\n` +
        (user.isBanned ? `\n${userLang === "ar" ? "• تاريخ الحظر: " : "• Banned At: "}${new Date(user.bannedAt || "").toLocaleDateString()}\n${userLang === "ar" ? "• سبب الحظر: " : "• Banned Reason: "}${user.bannedReason || "N/A"}` : "");
 
      await ctx.reply(message, {
        reply_to_message_id: ctx.message?.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: userLang === "ar" ? "👤 عرض الملف الشخصي" : "👤 View Profile", url: `tg://user?id=${targetUserId}` }]
          ]
        }
      });
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في الحصول على معلومات المستخدم. قد لا يكون المستخدم موجوداً." : "❌ Failed to get user info. User may not exist.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Users command - show user statistics (owner only)
  bot.command("users", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Get user statistics
      const stats = await userService.getUserStats();
 
      if (!stats) {
        await ctx.reply(
          userLang === "ar" ? "❌ فشل في جلب إحصائيات المستخدمين." : "❌ Failed to fetch user statistics.",
          {
            reply_to_message_id: ctx.message?.message_id
          }
        );
        return;
      }
 
      // Format message similar to email handler style
      const message = (userLang === "ar" ? "📊 إحصائيات المستخدمين\n\n" : "📊 User Statistics\n\n") +
        (userLang === "ar" ? "• إجمالي المستخدمين: " : "• Total Users: ") + `${stats.totalUsers}\n` +
        (userLang === "ar" ? "• المستخدمين غير النشطين: " : "• inactive Users: ") + `${stats.inactiveUsers}\n` +
        (userLang === "ar" ? "• المستخدمين المحظورين: " : "• Banned Users: ") + `${stats.bannedUsers}\n` +
        (userLang === "ar" ? "• مستخدمين جدد (اليوم): " : "• New Users (Today): ") + `${stats.newUsers.today}\n` +
        (userLang === "ar" ? "• مستخدمين جدد (هذا الأسبوع): " : "• New Users (This Week): ") + `${stats.newUsers.thisWeek}\n` +
        (userLang === "ar" ? "• مستخدمين جدد (هذا الشهر): " : "• New Users (This Month): ") + `${stats.newUsers.thisMonth}\n`;
 
      await ctx.reply(message, {
        reply_to_message_id: ctx.message?.message_id
      });
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في جلب إحصائيات المستخدمين." : "❌ Failed to fetch user statistics.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  bot.command("addbook", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_book_course_code",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📚 *إضافة كتاب جديد*\n\nأدخل رمز الكورس (مثال: CS101)"
        : "📚 *Add New Book*\n\nEnter course code (e.g., CS101)",
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
  });
  bot.command("addslide", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_slide_course_code",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📊 *إضافة سلايد جديد*\n\nأدخل رمز الكورس (مثال: CS101)"
        : "📊 *Add New Slide*\n\nEnter course code (e.g., CS101)",
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
  });
  bot.command("addcalendar", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_calendar_title_ar",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📝 *إضافة حدث تقويمي جديد*\n\nأدخل عنوان تقويم باللغة العربية"
        : "📝 *Add New Calendar*\n\nEnter the calendar title in Arabic",
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
  });
  bot.command("addgroup", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_group_course_code",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📝 *إضافة قروب جديد*\n\nأدخل رمز الكورس (مثال: CS101)"
        : "📝 *Add New Group*\n\nEnter course code (e.g., CS101)",
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
  });

  bot.command("addfaq", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_faq_question_ar",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📝 *إضافة سؤال شائع جديد*\n\nأدخل السؤال باللغة العربية"
        : "📝 *Add New FAQ*\n\nEnter the question in Arabic",
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
  });

  bot.command("addcourse", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    if (ctx.user?.role === "user") {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك أو المشرف يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner or admin can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id,
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "add_course_title_ar",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📝 *إضافة كورس جديد*\n\nأدخل عنوان الكورس باللغة العربية"
        : "📝 *Add New Course*\n\nEnter the course title in Arabic",
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
  });

  // System command - show system statistics (owner only)
  bot.command("system", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Get system statistics
      const stats = await statisticsService.getSystemStats();

      const uptime = Math.floor(stats.uptime);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;

      const memoryMB = Math.round(stats.memory.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(stats.memory.heapTotal / 1024 / 1024);

      const message = (userLang === "ar" ? "⚙️ إحصائيات النظام\n\n" : "⚙️ System Statistics\n\n") +
        (userLang === "ar" ? "• وقت التشغيل: " : "• Uptime: ") + `${hours}h ${minutes}m ${seconds}s\n` +
        (userLang === "ar" ? "• الذاكرة المستخدمة: " : "• Memory Used: ") + `${memoryMB} MB / ${memoryTotalMB} MB\n` +
        (userLang === "ar" ? "• معدل ضربات الكاش: " : "• Cache Hit Rate: ") + `${(stats.cache.hitRate * 100).toFixed(2)}%\n` +
        (userLang === "ar" ? "• حجم الكاش: " : "• Cache Size: ") + `${stats.cache.size} items\n` +
        (userLang === "ar" ? "• ضربات الكاش: " : "• Cache Hits: ") + `${stats.cache.hits}\n` +
        (userLang === "ar" ? "• أخطاء الكاش: " : "• Cache Misses: ") + `${stats.cache.misses}\n` +
        (userLang === "ar" ? "• آخر تحديث: " : "• Last Updated: ") + `${new Date(stats.timestamp).toLocaleString()}`;

      await ctx.reply(message, {
        reply_to_message_id: ctx.message?.message_id
      });
    } catch (error) {
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في جلب إحصائيات النظام." : "❌ Failed to fetch system statistics.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Stats command - show all statistics (owner only)
  bot.command("stats", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    try {
      // Get all statistics
      const stats = await statisticsService.getAllStats();

      const message = (userLang === "ar" ? "📊 إحصائيات البوت\n\n" : "📊 Bot Statistics\n\n") +
        (userLang === "ar" ? "📚 الكتب\n" : "📚 Books\n") +
        (userLang === "ar" ? "• إجمالي الكتب: " : "• Total Books: ") + `${stats.books.totalBooks}\n` +
        (userLang === "ar" ? "• إجمالي الملفات: " : "• Total Files: ") + `${stats.books.totalFiles}\n\n` +
        (userLang === "ar" ? "📊 السلايدات\n" : "📊 Slides\n") +
        (userLang === "ar" ? "• إجمالي السلايدات: " : "• Total Slides: ") + `${stats.slides.totalSlides}\n` +
        (userLang === "ar" ? "• إجمالي الملفات: " : "• Total Files: ") + `${stats.slides.totalFiles}\n\n` +
        (userLang === "ar" ? "📅 التقويم\n" : "📅 Calendar\n") +
        (userLang === "ar" ? "• إجمالي الأحداث: " : "• Total Events: ") + `${stats.calendars.totalCalendars}\n\n` +
        (userLang === "ar" ? "🎓 الكورسات\n" : "🎓 Courses\n") +
        (userLang === "ar" ? "• إجمالي الكورسات: " : "• Total Courses: ") + `${stats.courses.totalCourses}\n\n` +
        (userLang === "ar" ? "👥 القروبات\n" : "👥 Groups\n") +
        (userLang === "ar" ? "• إجمالي القروبات: " : "• Total Groups: ") + `${stats.groups.totalGroups}\n\n` +
        (userLang === "ar" ? "❓ الأسئلة الشائعة\n" : "❓ FAQs\n") +
        (userLang === "ar" ? "• إجمالي الأسئلة: " : "• Total FAQs: ") + `${stats.faqs.totalFAQs}\n\n` +
        (userLang === "ar" ? "• آخر تحديث: " : "• Last Updated: ") + `${new Date(stats.timestamp).toLocaleString()}`;

      await ctx.reply(message, {
        reply_to_message_id: ctx.message?.message_id
      });
    } catch (error) {
      console.log(error)
      await ctx.reply(
        userLang === "ar" ? "❌ فشل في جلب الإحصائيات." : "❌ Failed to fetch statistics.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    }
  });

  // Backup command - create database backup (owner only)
  bot.command("backup", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Send processing message
    const processingMsg = await ctx.reply(
      userLang === "ar" ? "⏳ جاري إنشاء نسخة احتياطية من قاعدة البيانات..." : "⏳ Creating database backup...",
      {
        reply_to_message_id: ctx.message?.message_id
      }
    );

    try {
      // Create backup file
      const result = await backupService.createBackupFile();

      if (!result.success || !result.filepath) {
        await ctx.api.editMessageText(
          processingMsg.chat.id,
          processingMsg.message_id,
          userLang === "ar"
            ? `❌ فشل في إنشاء النسخة الاحتياطية.\nالخطأ: ${result.error}`
            : `❌ Failed to create backup.\nError: ${result.error}`
        );
        return;
      }

      // Read the backup file
      const backupFile = Bun.file(result.filepath);
      const backupData = await backupFile.arrayBuffer();

      // Send the backup file as a document
      await ctx.replyWithDocument(
        new InputFile(new Uint8Array(backupData), backupFile.name),
        {
          caption: userLang === "ar"
            ? `💾 نسخة احتياطية من قاعدة البيانات\nالتاريخ: ${new Date().toLocaleString('ar-SA')}`
            : `💾 Database Backup\nDate: ${new Date().toLocaleString()}`,
          reply_to_message_id: ctx.message?.message_id
        }
      );

      // Delete the processing message
      await ctx.api.deleteMessage(processingMsg.chat.id, processingMsg.message_id);

      // Optionally delete the backup file after sending
      await Bun.write(result.filepath, "");
    } catch (error) {
      await ctx.api.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        userLang === "ar"
          ? "❌ حدث خطأ أثناء إنشاء النسخة الاحتياطية."
          : "❌ An error occurred while creating the backup."
      );
    }
  });

  // JSON files command - send all JSON data files (owner only)
  bot.command("files", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Send processing message
    const processingMsg = await ctx.reply(
      userLang === "ar" ? "⏳ جاري إرسال ملفات JSON..." : "⏳ Sending JSON files...",
      {
        reply_to_message_id: ctx.message?.message_id
      }
    );

    try {
      const jsonFiles = [
        "branches.json",
        "calendars.json",
        "coursePrices.json",
        "courses.json",
        "faqs.json",
        "groups.json",
        "materials.json",
        "plans.json"
      ];

      for (const filename of jsonFiles) {
        const filepath = `./src/data/${filename}`;
        const file = Bun.file(filepath);
        const fileData = await file.arrayBuffer();

        await ctx.replyWithDocument(
          new InputFile(new Uint8Array(fileData), filename),
          {
            caption: userLang === "ar"
              ? `📄 ${filename}`
              : `📄 ${filename}`
          }
        );
      }

      // Delete the processing message
      await ctx.api.deleteMessage(processingMsg.chat.id, processingMsg.message_id);

      await ctx.reply(
        userLang === "ar"
          ? "✅ تم إرسال جميع ملفات JSON بنجاح!"
          : "✅ All JSON files sent successfully!",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
    } catch (error) {
      await ctx.api.editMessageText(
        processingMsg.chat.id,
        processingMsg.message_id,
        userLang === "ar"
          ? "❌ حدث خطأ أثناء إرسال ملفات JSON."
          : "❌ An error occurred while sending JSON files."
      );
    }
  });

  // Broadcast command - send message with buttons to updates channel (owner only)
  bot.command("broadcast", authMiddleware, async (ctx) => {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    const userLang = ctx.user?.lang || "ar";

    // Check if user is bot owner
    if (userId !== env.OWNER_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ فقط المالك يمكنه استخدام هذا الأمر."
          : "⚠️ Only the bot owner can use this command.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    // Check if UPDATES_CHANNEL_ID is configured
    if (!env.UPDATES_CHANNEL_ID) {
      await ctx.reply(
        userLang === "ar"
          ? "⚠️ لم يتم تكوين قناة التحديثات."
          : "⚠️ Updates channel is not configured.",
        {
          reply_to_message_id: ctx.message?.message_id
        }
      );
      return;
    }

    miftahdb.set(userId, {
      step: "broadcast_message",
      data: {}
    });

    await ctx.reply(
      userLang === "ar"
        ? "📢 *إرسال رسالة إلى قناة التحديثات*\n\nأدخل نص الرسالة:"
        : "📢 *Send message to updates channel*\n\nEnter the message text:",
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
  });
}

