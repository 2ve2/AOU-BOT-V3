import { startBot } from "./bot/bot";
import { Logger } from "./utils/logger";

/**
 * Maximum number of retry attempts when bot fails to start
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Delay between retry attempts in milliseconds
 */
const RETRY_DELAY_MS = 5000;

/**
 * Main application entry point with retry logic
 * Handles bot startup with proper error handling and recovery
 */
async function main(retryCount = 0): Promise<void> {
  try {
    Logger.info("Starting AOU Bot...");
    await startBot();
    Logger.info("Bot started successfully");
  } catch (error) {
    Logger.error("Failed to start bot", error);
    
    // Log additional error details
    if (error instanceof Error) {
      Logger.error(`Error message: ${error.message}`);
      Logger.error(`Error stack: ${error.stack}`);
    }
    
    // Retry logic
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      const nextAttempt = retryCount + 1;
      Logger.warn(`Retrying to start bot (attempt ${nextAttempt}/${MAX_RETRY_ATTEMPTS}) in ${RETRY_DELAY_MS}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return main(nextAttempt);
    } else {
      Logger.error(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Exiting...`);
      process.exit(1);
    }
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  Logger.error("Unhandled Rejection at:", promise);
  Logger.error("Reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle SIGTERM for graceful shutdown
process.on("SIGTERM", () => {
  Logger.info("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Handle SIGINT for graceful shutdown
process.on("SIGINT", () => {
  Logger.info("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

// Start the application
main();