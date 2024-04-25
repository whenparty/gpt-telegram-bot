CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar NOT NULL,
	"messaage" varchar(4096) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"user_tg_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"tg_id" integer PRIMARY KEY NOT NULL,
	"anthropic_tokens" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_user_tg_id_users_tg_id_fk" FOREIGN KEY ("user_tg_id") REFERENCES "users"("tg_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
