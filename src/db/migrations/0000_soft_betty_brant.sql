CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_name" text,
	"full_name" text,
	"is_active" boolean NOT NULL,
	"lang" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"is_banned" boolean NOT NULL,
	"banned_at" timestamp,
	"banned_reason" text,
	CONSTRAINT "user_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "book" (
	"id" text PRIMARY KEY NOT NULL,
	"course_code" text NOT NULL,
	"title" jsonb NOT NULL,
	"meta_data" json,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "book_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE "slide" (
	"id" text PRIMARY KEY NOT NULL,
	"course_code" text NOT NULL,
	"title" jsonb NOT NULL,
	"meta_data" json,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "slide_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE INDEX "idx_user_user_id" ON "user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_active_role" ON "user" USING btree ("is_active","role");--> statement-breakpoint
CREATE INDEX "idx_user_lang" ON "user" USING btree ("lang");--> statement-breakpoint
CREATE INDEX "idx_user_banned" ON "user" USING btree ("is_banned");--> statement-breakpoint
CREATE INDEX "idx_user_banned_at" ON "user" USING btree ("banned_at");--> statement-breakpoint
CREATE INDEX "idx_book_course_code" ON "book" USING btree ("course_code");--> statement-breakpoint
CREATE INDEX "idx_book_title" ON "book" USING gin ("title");--> statement-breakpoint
CREATE INDEX "idx_book_created_at" ON "book" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_slide_course_code" ON "slide" USING btree ("course_code");--> statement-breakpoint
CREATE INDEX "idx_slide_title" ON "slide" USING gin ("title");--> statement-breakpoint
CREATE INDEX "idx_slide_created_at" ON "slide" USING btree ("created_at");