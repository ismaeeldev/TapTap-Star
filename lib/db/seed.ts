// Dev seed script per ../../AgentGuide/05_MASTER_BUILD_GUIDE.md Step 2.2.
// Run with: npx tsx lib/db/seed.ts
// Deliberately does NOT import the real 400-code CSV (../../Refrence/taptapstar_qr_links_400
// (2).csv) — that's a one-time production/admin action via the CSV-import feature built in
// Step 10, not something that runs automatically in every dev environment.
//
// SAFETY (Step 12 pre-deploy sweep): this script is NOT wired into any build/deploy/postinstall
// hook anywhere in this repo (checked package.json's scripts and vercel.json) — it only ever
// runs if someone types `npx tsx lib/db/seed.ts` by hand. That said, this exact database already
// holds real production data (the real 400-code device batch imported in Step 10), so as one
// more explicit guard against an accidental re-run against a production DATABASE_URL, this
// requires SEED_CONFIRM=yes to be set. Delete/rename Taptapstar Internal + Downtown Cafe demo
// accounts manually before ever pointing this at a real production database on purpose.
import { config } from "dotenv";

// tsx doesn't auto-load Next.js's .env.local convention the way `next dev`/`next build` do —
// load it explicitly here so this script (run standalone) sees the same DATABASE_URL. Must
// happen before importing ./client (which reads process.env.DATABASE_URL at module-load time)
// — but static `import` statements are hoisted above all other top-level code in ESM
// regardless of source order, so a static `import { db } from "./client"` above this line
// would still run before config() does. Using a dynamic import() after config() sidesteps
// that hoisting entirely.
config({ path: ".env.local" });

if (process.env.SEED_CONFIRM !== "yes") {
  console.error(
    "Refusing to run: this seeds demo data (test accounts, sample devices) against whatever " +
      "DATABASE_URL is currently loaded. Set SEED_CONFIRM=yes to proceed — only do this against " +
      "a dev/test database, never production."
  );
  process.exit(1);
}

async function seed() {
  const { hash } = await import("bcryptjs");
  const { nanoid } = await import("nanoid");
  const { db } = await import("./client");
  const { accounts, users, locations, devices, employees, pricingPlans } = await import(
    "./schema"
  );

  console.log("Seeding...");

  // --- pricing_plans: the real, final, confirmed price — not a placeholder ---
  const [plan] = await db
    .insert(pricingPlans)
    .values({
      planKey: "default",
      name: "Taptapstar",
      priceCents: 2990, // $29.90/month flat, client's final decision
      currency: "usd",
      billingUnit: "flat",
      appliesTo: "business",
      isActive: true,
    })
    .returning();
  console.log(`  pricing_plans: seeded '${plan.planKey}' at $${plan.priceCents / 100}/mo`);

  // --- taptapstar_admin account + user (internal admin testing) ---
  const [adminAccount] = await db
    .insert(accounts)
    .values({
      type: "business",
      name: "Taptapstar Internal",
      billingEmail: "admin@taptapstar.local",
      planKey: "default",
    })
    .returning();

  const adminPasswordHash = await hash("DevPassword123!", 10);
  const [adminUser] = await db
    .insert(users)
    .values({
      accountId: adminAccount.id,
      email: "admin@taptapstar.local",
      passwordHash: adminPasswordHash,
      role: "taptapstar_admin",
      name: "Taptapstar Admin",
      emailVerifiedAt: new Date(),
    })
    .returning();
  console.log(`  users: seeded taptapstar_admin (${adminUser.email} / DevPassword123!)`);

  // --- sample business account with a location and 2 devices ---
  const [businessAccount] = await db
    .insert(accounts)
    .values({
      type: "business",
      name: "Downtown Cafe",
      billingEmail: "owner@downtowncafe.local",
      planKey: "default",
    })
    .returning();

  const businessPasswordHash = await hash("DevPassword123!", 10);
  const [ownerUser] = await db
    .insert(users)
    .values({
      accountId: businessAccount.id,
      email: "owner@downtowncafe.local",
      passwordHash: businessPasswordHash,
      role: "owner",
      name: "Sample Business Owner",
      emailVerifiedAt: new Date(),
    })
    .returning();
  console.log(`  users: seeded business owner (${ownerUser.email} / DevPassword123!)`);

  const [location] = await db
    .insert(locations)
    .values({
      accountId: businessAccount.id,
      name: "Downtown Cafe — Main St",
      address: "123 Main St, Springfield, USA",
      googleReviewUrl: "https://g.page/r/example-review-link/review",
      language: "en",
    })
    .returning();
  console.log(`  locations: seeded '${location.name}'`);

  // --- employee with a generated access_token, so /e/[token] (Step 5) has real data ---
  const [employee] = await db
    .insert(employees)
    .values({
      locationId: location.id,
      name: "Alex Rivera",
      accessToken: nanoid(24),
    })
    .returning();
  console.log(`  employees: seeded '${employee.name}' (access_token: ${employee.accessToken})`);

  // --- 2 devices: one active (claimed, linked to the employee), one unassigned ---
  const [activeDevice] = await db
    .insert(devices)
    .values({
      code: nanoid(8),
      type: "card",
      status: "active",
      accountId: businessAccount.id,
      locationId: location.id,
      employeeId: employee.id,
      source: "generated",
      activatedAt: new Date(),
    })
    .returning();
  console.log(`  devices: seeded active device (code: ${activeDevice.code})`);

  const [unassignedDevice] = await db
    .insert(devices)
    .values({
      code: nanoid(8),
      type: "plaque",
      status: "unassigned",
      source: "generated",
    })
    .returning();
  console.log(`  devices: seeded unassigned device (code: ${unassignedDevice.code})`);

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .then(() => process.exit(0));
