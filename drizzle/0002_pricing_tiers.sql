ALTER TABLE "pricing_plans" ADD COLUMN "annual_price_cents" integer;--> statement-breakpoint
ALTER TABLE "pricing_plans" ADD COLUMN "location_limit" integer;--> statement-breakpoint
ALTER TABLE "pricing_plans" ADD COLUMN "trial_days" integer;--> statement-breakpoint
ALTER TABLE "pricing_plans" ADD COLUMN "stripe_annual_price_id" text;