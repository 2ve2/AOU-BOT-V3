import { Bot, Context } from "grammy";
import { env } from "../config/env";
import { Logger } from "../utils/logger";
import { setUpCommands } from "./commands";
import { setUpInlineHandlers } from "./inline";
import { setUpCallbackHandlers } from "./callbacks";
import { setUpKeyboardHandlers } from "./handlers/keyboard";
import { authMiddleware } from "./middlewares/auth";
import { handleChannelPost } from "./handlers/channelHandler";
import { startEventScheduler } from "./schedulers/eventScheduler";

export async function createBot(): Promise<Bot<Context>> {
  try {
    // Validate configuration
    // validateConfig();
    
    // Initialize database and run migrations
    // await initializeDatabase();
    
    // Create bot instance
    const bot = new Bot<Context>(env.BOT_TOKEN);
    
    // Setup channel post handler BEFORE auth middleware - captures file IDs when files are sent to channel
    // Channel posts don't have ctx.from, so they need to bypass auth middleware
    bot.on("channel_post", handleChannelPost);
    
    // Setup middlewares
    // setupMiddlewares(bot);
    
    // Apply auth middleware globally (for user messages only)
    bot.use(authMiddleware);
    
    // Setup commands
    setUpCommands(bot);
    
    // Setup inline handlers
    setUpInlineHandlers(bot);
    
    // Setup callback handlers
    setUpCallbackHandlers(bot);
    
    // Setup keyboard handlers
    setUpKeyboardHandlers(bot);
    
    // Global error handler
    bot.catch((err) => {
      Logger.error("Bot error occurred", err);
    });
    
    return bot;
  } catch (error) {
    Logger.error("Failed to create bot", error);
    throw error;
  }
}

export async function startBot() {
  // Graceful shutdown handlers
  const setupShutdownHandlers = (bot: Bot<Context>) => {
    process.on("SIGINT", () => {
      Logger.info("🛑 Shutting down bot...");
      bot.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      Logger.info("🛑 Shutting down bot...");
      bot.stop();
      process.exit(0);
    });
    
    process.on("unhandledRejection", (reason) => {
      Logger.error("Unhandled Rejection:", reason);
    });
    
    process.on("uncaughtException", (error) => {
      Logger.error("Uncaught Exception:", error);
      process.exit(1);
    });
  };

  // Main polling loop with error handling and retry
  while (true) {
    try {
      Logger.info("🔄 Running bot polling...");
      
      const bot = await createBot();
      
      // Start event scheduler (auto-scrapes events every 24 hours)
      startEventScheduler();
      
      // Setup graceful shutdown handlers
      setupShutdownHandlers(bot);
      
      // Start bot with polling
      await bot.start({
        drop_pending_updates: true,
        onStart: (info) => {
          Logger.info(`🤖 Bot started successfully - ${info.username} (ID: ${info.id})`);
        }
      });
      
    } catch (error) {
      Logger.error(`❌ Bot error occurred: ${error}`);
      Logger.info("⏳ Waiting 5 seconds before restarting...");
      
      // Wait 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}