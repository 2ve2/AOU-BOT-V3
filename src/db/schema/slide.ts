import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  json
} from "drizzle-orm/pg-core";

export const slide = pgTable(
  "slide",
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
    // Index for fetching slides by course code
    index("idx_slide_course_code").on(table.courseCode),

    // GIN index for JSONB title column
    index("idx_slide_title").using("gin", table.title),

    // Index for sorting by date
    index("idx_slide_created_at").on(table.createdAt),
  ]
);
