import type { Context } from "grammy";
import { messages } from "../messages";

export async function handleHelp(ctx: Context) {
  const userLang = ctx.user?.lang || 'ar';
  const isAdmin = ctx.user?.role === 'admin' || ctx.user?.role === 'owner';

  // General help message for all users
  const generalHelp = userLang === 'ar' ? `
🤖 *كيفية استخدام البوت:*

1️⃣ *السلايدات والكتب 📚*
   - اضغط على زر "السلايدات" أو "الكتب"
   - اختر الكورس من القائمة أو اكتب رمز الكورس
   - احصل على السلايدات أو الكتب المطلوبة

2️⃣ *المواعيد الدراسية 🗓️*
   - اضغط على زر "المواعيد"
   - اختر إحدى المواعيد
   - احصل على الموعد المطلوب

3️⃣ *الإيميلات الجامعية 💌*
   - اضغط على زر "الايميلات"
   - اختر الفرع والقسم
   - احصل على إيميلات الجامعة

4️⃣ *الخطط الدراسية 🎯*
   - اضغط على زر "الخطط الدراسية"
   - اختر التخصص
   - احصل على خطتك الدراسية

5️⃣ *فعاليات الجامعة 🎪*
   - اضغط على زر "فعاليات الجامعة"
   - تصفح الفعاليات المتاحة

6️⃣ *الدورات والمعسكرات 🚀*
   - اضغط على زر "الدورات والمعسكرات"
   - تصفح الدورات و الكورسات المتاحة

7️⃣ *قروبات الشعب 👥*
   - اضغط على زر "قروبات الشعب"
   - اختر الكورس
   - احصل على رابط القروب

8️⃣ *الأسئلة الشائعة ❓*
   - اضغط على زر "الأسئلة الشائعة"
   - اختر السؤال
   - احصل على الإجابة

9️⃣ *حاسبة الرسوم 💰*
   - اضغط على زر "حاسبة الرسوم"
   - أدخل الجنسية و أختر الكورسات المعتمدة
   - احصل على حساب الرسوم

💡 *ملاحظة:* استخدم زر "رجوع" للعودة للقائمة الرئيسية في أي وقت.
  ` : `
📚 *Available Commands List*

━━━━━━━━━━━━━━━━━━━━━

🔹 *General Commands:*
/start - Start the bot and show main menu
/help - Show this list
/me - Show your profile

━━━━━━━━━━━━━━━━━━━━━

🎯 *How to Use the Bot:*

1️⃣ *Slides and Books 📚*
   - Press "Slides" or "Books" button
   - Select the course from the list or type the course code
   - Get the required slides or books

2️⃣ *Study Schedules 🗓️*
   - Press "Schedules" button
   - Select one of the schedules
   - Get the required schedule

3️⃣ *University Emails 💌*
   - Press "Emails" button
   - Select branch and department
   - Get university emails

4️⃣ *Study Plans 🎯*
   - Press "Study Plans" button
   - Select your major
   - Get your study plan

5️⃣ *University Events 🎪*
   - Press "University Events" button
   - Browse available events

6️⃣ *Courses and Bootcamps 🚀*
   - Press "Courses and Bootcamps" button
   - Browse available courses and bootcamps

7️⃣ *Course Groups 👥*
   - Press "Course Groups" button
   - Select the course
   - Get the group link

8️⃣ *FAQ ❓*
   - Press "FAQ" button
   - Select a question
   - Get the answer

9️⃣ *Fee Calculator 💰*
   - Press "Fee Calculator" button
   - Enter nationality and select credit courses
   - Get the fee calculation

💡 *Note:* Use the "Back" button to return to the main menu at any time.
  `;

  // Admin help message (only shown to admins)
  const adminHelp = userLang === 'ar' ? `

━━━━━━━━━━━━━━━━━━━━━

🛡️ *أوامر المشرفين:*

👑 *أوامر المالك فقط:*
/admin <userId> - جعل المستخدم مشرف
/unadmin <userId> - إزالة صلاحية المشرف
/user <userId> - عرض معلومات مستخدم
/users - عرض إحصائيات المستخدمين
/system - عرض إحصائيات النظام
/stats - عرض إحصائيات البوت

🔧 *أوامر المشرفين:*
/ban <userId> [reason] - حظر مستخدم
/unban <userId> - إلغاء حظر مستخدم

📝 *أوامر إضافة المحتوى:*
/addbook - إضافة كتاب جديد
/addslide - إضافة سلايد جديد
/addcalendar - إضافة حدث تقويمي
/addgroup - إضافة قروب جديد
/addfaq - إضافة سؤال شائع
/addcourse - إضافة كورس جديد

━━━━━━━━━━━━━━━━━━━━━
  ` : `

━━━━━━━━━━━━━━━━━━━━━

🛡️ *Admin Commands:*

👑 *Owner Only Commands:*
/admin <userId> - Make user admin
/unadmin <userId> - Remove admin privileges
/user <userId> - Show user information
/users - Show user statistics
/system - Show system statistics
/stats - Show bot statistics

🔧 *Admin Commands:*
/ban <userId> [reason] - Ban a user
/unban <userId> - Unban a user

📝 *Content Addition Commands:*
/addbook - Add a new book
/addslide - Add a new slide
/addcalendar - Add a calendar event
/addgroup - Add a new group
/addfaq - Add a new FAQ
/addcourse - Add a new course

━━━━━━━━━━━━━━━━━━━━━
  `;

  const helpMessage = isAdmin ? generalHelp + adminHelp : generalHelp;

  await ctx.reply(helpMessage, {
    reply_to_message_id: ctx.message?.message_id,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [messages.inlineButtons.channel(userLang), messages.inlineButtons.share(userLang)],
        [messages.inlineButtons.suggestion(userLang)]
      ]
    }
  });
}
