export const messages = {
  // Welcome Messages
  welcome: {
    ar: `
👋 مرحبا بك في بوت المساعد الطلابي للجامعة العربية المفتوحة !

أنا هنا لمساعدتك في جميع احتياجاتك الجامعية .

الخدمات المتوفره بالبوت :

• الكتب والسلايدات الدراسية
• ايميلات الجامعة
• مواعيد الدراسة
• الخطط الدراسية لجميع التخصصات
• فعاليات الجامعة
• الدورات و المعسكرات
• قروبات الشعب
• حاسبة الرسوم الدراسية
• اسئلة شائعة مع اجابات

نتمنى من الجميع نشر البوت لإفادة الطلاب الآخرين وشكرا .
    `,
    en: `
👋 Welcome to the Arab Open University Student Assistant Bot!

I'm here to help you with all your university needs.

Available Services:

• Books and study slides
• University emails
• Study schedules
• Study plans for all majors
• University events
• Courses and bootcamps
• Course groups
• Fee Calculator
• Frequently asked questions with answers

We hope everyone shares the bot to help other students. Thank you.
    `,
  },

  // Ban Messages
  banned: {
    ar: (reason: string, date: string) => `
⛔ تم حظرك من استخدام البوت

سبب الحظر: ${reason}
تاريخ الحظر: ${date}

إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة.
    `,
    en: (reason: string, date: string) => `
⛔ You have been banned from using the bot

Ban reason: ${reason}
Ban date: ${date}

If you believe this is a mistake, please contact the administration.
    `,
  },

  // Error Messages
  error: {
    ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.",
    en: "Something went wrong. Please try again later.",
  },

  notAuthorized: {
    ar: "ليس لديك صلاحية للقيام بهذا الإجراء.",
    en: "You are not authorized to perform this action.",
  },

  // Success Messages
  success: {
    ar: "تمت العملية بنجاح!",
    en: "Operation completed successfully!",
  },

  // User Messages
  userNotFound: {
    ar: "المستخدم غير موجود.",
    en: "User not found.",
  },

  userCreated: {
    ar: "تم إنشاء حسابك بنجاح!",
    en: "Your account has been created successfully!",
  },

  // Command Messages
  commandNotFound: {
    ar: "الأمر غير موجود. استخدم /start لرؤية القائمة.",
    en: "Command not found. Use /start to see the menu.",
  },

  // Menu Buttons
  menu: {
    slides: { ar: "السلايدات 📋", en: "Slides 📋" },
    books: { ar: "الكتب 📚", en: "Books 📚" },
    schedules: { ar: "المواعيد 🗓️", en: "Schedules 🗓️" },
    emails: { ar: "الايميلات 💌", en: "Emails 💌" },
    studyPlans: { ar: "الخطط الدراسية لجميع التخصصات 🎯", en: "Study Plans for All Majors 🎯" },
    events: { ar: "فعاليات الجامعة 🎪", en: "University Events 🎪" },
    courses: { ar: "الدورات و المعسكرات 🚀", en: "Courses and Bootcamps 🚀" },
    groups: { ar: "قروبات الشعب 👥", en: "Course Groups 👥" },
    faq: { ar: "الاسئلة الشائعه ❓", en: "FAQ ❓" },
    calculator: { ar: "حاسبة الرسوم 💰", en: "Fee Calculator 💰" },
  },

  // Menu Keyboard Layout
  keyboard: {
    ar: [
      ["السلايدات 📋", "الكتب 📚"],
      ["المواعيد 🗓️", "الايميلات 💌"],
      ["الخطط الدراسية لجميع التخصصات 🎯"],
      ["فعاليات الجامعة 🎪"],
      ["الدورات و المعسكرات 🚀"],
      ["قروبات الشعب 👥"],
      ["الاسئلة الشائعه ❓", "حاسبة الرسوم 💰"]
    ],
    en: [
      ["Slides 📋", "Books 📚"],
      ["Schedules 🗓️", "Emails 💌"],
      ["Study Plans for All Majors 🎯"],
      ["University Events 🎪"],
      ["Courses and Bootcamps 🚀"],
      ["Course Groups 👥"],
      ["FAQ ❓", "Fee Calculator 💰"]
    ],
  },

  // Inline Keyboard Buttons
  inlineButtons: {
    lang: (userLang: string) => userLang === 'ar'
      ? { text: "🇬🇧 English", callback_data: "lang_en" }
      : { text: "🇸🇦 العربية", callback_data: "lang_ar" },
    channel: (userLang: string) => userLang === 'ar'
      ? { text: "قناة البوت 📣", url: "https://t.me/aouksaa" }
      : { text: "Bot Channel 📣", url: "https://t.me/aouksaa" },
    share: (userLang: string) => userLang === 'ar'
      ? { text: "شارك البوت 🤝", switch_inline_query: "جرب بوت المساعد الطلابي الخاص بالجامعة العربية المفتوحة الان" }
      : { text: "Share Bot 🤝", switch_inline_query: "Try the Arab Open University Student Assistant Bot now" },
    suggestion: (userLang: string) => userLang === 'ar'
      ? { text: "اقتراح - استفسار 💡", url: "tg://user?id=5029420526" }
      : { text: "Suggestion - Inquiry 💡", url: "tg://user?id=5029420526" },
    cancel: (userLang: string) => userLang === 'ar'
      ? { text: "إلغاء", callback_data: "admin_cancel" }
      : { text: "Cancel", callback_data: "admin_cancel" },
    delete: (userLang: string, data: string) => userLang === 'ar'
      ? { text: "حذف", callback_data: `${data}`}
      : { text: "Delete", callback_data: `${data}`},
  },

  // Menu Messages
  menuTitle: {
    ar: "📋 القائمة الرئيسية",
    en: "📋 Main Menu",
  },

  // Language Messages
  languageChanged: {
    ar: "تم تغيير اللغة إلى العربية.",
    en: "Language changed to English.",
  },
};