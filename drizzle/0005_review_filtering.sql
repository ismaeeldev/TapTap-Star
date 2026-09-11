CREATE TYPE "public"."private_feedback_status" AS ENUM('new', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."review_destination_type" AS ENUM('google', 'custom');--> statement-breakpoint
CREATE TABLE "private_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"device_id" uuid,
	"rating" integer NOT NULL,
	"comment" text,
	"contact_name" text,
	"contact_email" text,
	"status" "private_feedback_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "review_filter_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "review_filter_threshold" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "review_destination_type" "review_destination_type" DEFAULT 'google' NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "review_destination_url" text;--> statement-breakpoint
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_feedback" ADD CONSTRAINT "private_feedback_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "private_feedback_account_id_idx" ON "private_feedback" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "private_feedback_location_id_idx" ON "private_feedback" USING btree ("location_id");