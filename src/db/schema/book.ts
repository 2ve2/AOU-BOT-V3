import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  json,
  jsonb
} from "drizzle-orm/pg-core";

export const book = pgTable(
  "book",
  {
    id: text("id").primaryKey(),
    courseCode: text("course_code").notNull().unique(),
    title: jsonb("title").notNull(),
    metaData: json("meta_data"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    // Index for fetching books by course code
    index("idx_book_course_code").on(table.courseCode),

    // GIN index for JSONB title column
    index("idx_book_title").using("gin", table.title),

    // Index for sorting by date
    index("idx_book_created_at").on(table.createdAt),
  ]
);
