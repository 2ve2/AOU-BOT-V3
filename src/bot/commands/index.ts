import type { Bot, Context } from "grammy";
import { handleStart } from "./start";
import { handleHelp } from "./help";
import { authMiddleware } from "../middlewares/auth";
import { setupAdminCommands } from "./admin";
import { handleMe } from "./me";
import { handleLang } from "./lang";

export function setUpCommands(bot: Bot<Context>) {
  bot.api.setMyCommands([
    { command: "start", description: "Start the bot / بدء البوت" },
    { command: "help", description: "Show help / عرض المساعدة" },
    { command: "me", description: "My profile / ملفي الشخصي" },
    { command: "lang", description: "Change language / تغيير اللغة" },
  ]);

  // Start command
  bot.command("start", authMiddleware, handleStart);

  // Help command
  bot.command("help", authMiddleware, handleHelp);

  // Me command
  bot.command("me", authMiddleware, handleMe);

  // Lang command
  bot.command("lang", authMiddleware, handleLang);

  // Setup admin commands
  setupAdminCommands(bot);
}