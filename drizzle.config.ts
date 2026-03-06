import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default {
  schema: [
    'src/db/schema/auth.ts',
    'src/db/schema/book.ts',
    'src/db/schema/slide.ts',
  ],
  out: 'src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} as Config;
