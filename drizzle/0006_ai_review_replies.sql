CREATE TYPE "public"."ai_reply_status" AS ENUM('idle', 'generating', 'drafted', 'failed');--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "ai_reply_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "ai_reply_threshold" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "private_feedback" ADD COLUMN "ai_reply_status" "ai_reply_status" DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "private_feedback" ADD COLUMN "ai_reply_draft" text;