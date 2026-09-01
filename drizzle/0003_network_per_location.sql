ALTER TABLE "pricing_plans" ADD COLUMN "per_extra_location_cents" integer;--> statement-breakpoint
ALTER TABLE "pricing_plans" ADD COLUMN "stripe_extra_location_price_id" text;