DO $$ BEGIN
 CREATE TYPE "public"."ai_model" AS ENUM('claude-3-haiku', 'claude-3-opus', 'openai-gpt-3.5-turbo', 'openai-gpt-4o');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_identifier" varchar(300) NOT NULL,
	"name" varchar(300) NOT NULL,
	"ai_model" "ai_model" NOT NULL,
	CONSTRAINT "users_external_identifier_unique" UNIQUE("external_identifier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"ai_model" "ai_model" NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "token_ai_model_user_id_uk" UNIQUE("ai_model","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar NOT NULL,
	"message" varchar(4096) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"user_id" integer NOT NULL,
	"ai_model" "ai_model" NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE restrict;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE restrict;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_identifier_idx" ON "users" ("external_identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_user_id_idx" ON "tokens" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_user_id_ai_model_idx" ON "messages" ("user_id","ai_model");