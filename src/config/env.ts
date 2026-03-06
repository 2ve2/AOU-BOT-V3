import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BOT_TOKEN: z.string(),
  OWNER_ID: z.string(),
  FILES_CHANNEL_ID: z.string(),
  UPDATES_CHANNEL_ID: z.string(),
});

export const env = envSchema.parse(process.env);