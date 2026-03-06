export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG"
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string, error?: any): string {
    const timestamp = new Date().toISOString();
    const errorStr = error ? `\n${error.stack || error}` : "";
    return `[${timestamp}] ${level}: ${message}${errorStr}`;
  }

  static error(message: string, error?: any) {
    console.error(this.formatMessage(LogLevel.ERROR, message, error));
  }

  static warn(message: string) {
    console.warn(this.formatMessage(LogLevel.WARN, message));
  }

  static info(message: string) {
    console.log(this.formatMessage(LogLevel.INFO, message));
  }

  static debug(message: string) {
    if (process.env.NODE_ENV === "development") {
      console.log(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  static userAction(userId: string, action: string, details?: string) {
    this.info(`User ${userId} performed action: ${action}${details ? ` - ${details}` : ""}`);
  }

  static commandUsage(userId: string, command: string, success: boolean) {
    this.info(`Command ${command} ${success ? "executed successfully" : "failed"} by user ${userId}`);
  }

  static databaseOperation(operation: string, table: string, success: boolean, error?: any) {
    const status = success ? "completed" : "failed";
    const message = `Database ${operation} on table ${table} ${status}`;
    
    if (success) {
      this.info(message);
    } else {
      this.error(message, error);
    }
  }
}