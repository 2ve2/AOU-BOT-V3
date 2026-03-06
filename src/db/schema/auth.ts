import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";


export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    userName: text("user_name"),
    fullName: text("full_name"),
    isActive: boolean("is_active")
      .notNull()
      .$defaultFn(() => false),
    lang: text("lang")
      .notNull()
      .$defaultFn(() => "ar"),
    role: text("role")
      .notNull()
      .$defaultFn(() => "user"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    isBanned: boolean("is_banned")
			.notNull()
			.$defaultFn(() => false),
		bannedAt: timestamp("banned_at"),
		bannedReason: text("banned_reason"),
  },
  (table) => [
    index("idx_user_user_id").on(table.userId),
    index("idx_user_active_role").on(table.isActive, table.role),
    index("idx_user_lang").on(table.lang),
    index("idx_user_banned").on(table.isBanned),
    index("idx_user_banned_at").on(table.bannedAt)
  ],
);