// Drizzle schema per ../../AgentGuide/03_DATA_MODEL_AND_ARCHITECTURE.md section 2.
// Every table/enum/column/index below mirrors that doc exactly — if you need a new field,
// add it there first, then here, per this whole doc set's own rule about staying in sync.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------------------

export const accountTypeEnum = pgEnum("account_type", ["business", "agency"]);
export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "grace_period",
  "suspended",
]);
export const agencyStatusEnum = pgEnum("agency_status", [
  "none",
  "pending",
  "approved",
  "rejected",
]);
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "agency_admin",
  "taptapstar_admin",
]);
export const deviceTypeEnum = pgEnum("device_type", ["card", "plaque", "stand"]);
export const deviceStatusEnum = pgEnum("device_status", [
  "unassigned",
  "active",
  "deactivated",
]);
export const deviceSourceEnum = pgEnum("device_source", ["generated", "imported"]);
export const targetPeriodEnum = pgEnum("target_period_type", ["weekly", "monthly"]);
export const billingUnitEnum = pgEnum("billing_unit", ["flat", "per_device"]);
export const planAppliesToEnum = pgEnum("plan_applies_to", ["business", "agency"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["paid", "open", "failed"]);
export const contactMessageStatusEnum = pgEnum("contact_message_status", [
  "new",
  "read",
  "resolved",
]);

// ---------------------------------------------------------------------------------------
// accounts
// ---------------------------------------------------------------------------------------

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: accountTypeEnum("type").notNull().default("business"),
    name: text("name").notNull(),
    billingEmail: text("billing_email").notNull(),
    locale: text("locale").notNull().default("en"),
    // Self-referential FK — the (): AnyPgColumn => ... callback form is required for
    // same-table references so TypeScript's circular-type inference resolves.
    parentAgencyId: uuid("parent_agency_id").references((): AnyPgColumn => accounts.id, {
      onDelete: "set null",
    }),
    stripeCustomerId: text("stripe_customer_id"),
    status: accountStatusEnum("status").notNull().default("active"),
    agencyStatus: agencyStatusEnum("agency_status").notNull().default("none"),
    agencyRequestedAt: timestamp("agency_requested_at", { withTimezone: true }),
    agencyApprovedAt: timestamp("agency_approved_at", { withTimezone: true }),
    // Forward reference to `users`, defined further down this file — safe because Drizzle
    // evaluates this callback lazily, after the whole module (including `users`) has loaded.
    agencyApprovedBy: uuid("agency_approved_by").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
    agencyTier: text("agency_tier"),
    planKey: text("plan_key").notNull().default("default"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("accounts_parent_agency_id_idx").on(table.parentAgencyId),
    index("accounts_agency_status_idx").on(table.agencyStatus),
  ]
);

// ---------------------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("owner"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_account_id_idx").on(table.accountId),
  ]
);

// ---------------------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------------------

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    googleReviewUrl: text("google_review_url").notNull(),
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("locations_account_id_idx").on(table.accountId)]
);

// ---------------------------------------------------------------------------------------
// employees
// ---------------------------------------------------------------------------------------

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // random, unguessable (nanoid) — powers the no-login /e/[token] personal view.
    accessToken: text("access_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("employees_access_token_idx").on(table.accessToken),
    index("employees_location_id_idx").on(table.locationId),
  ]
);

// ---------------------------------------------------------------------------------------
// targets
// ---------------------------------------------------------------------------------------

export const targets = pgTable(
  "targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    periodType: targetPeriodEnum("period_type").notNull(),
    targetScans: integer("target_scans").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("targets_location_id_idx").on(table.locationId)]
);

// ---------------------------------------------------------------------------------------
// devices
// ---------------------------------------------------------------------------------------

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    type: deviceTypeEnum("type").notNull(),
    status: deviceStatusEnum("status").notNull().default("unassigned"),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    qrImageUrl: text("qr_image_url"),
    source: deviceSourceEnum("source").notNull().default("generated"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("devices_code_idx").on(table.code),
    index("devices_account_id_idx").on(table.accountId),
  ]
);

// ---------------------------------------------------------------------------------------
// scans
// ---------------------------------------------------------------------------------------

export const scans = pgTable(
  "scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    ipHash: text("ip_hash").notNull(),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("scans_device_id_idx").on(table.deviceId),
    index("scans_location_id_idx").on(table.locationId),
    index("scans_scanned_at_idx").on(table.scannedAt),
  ]
);

// ---------------------------------------------------------------------------------------
// pricing_plans
// ---------------------------------------------------------------------------------------

// Modifications 5 (page 2) pricing restructure — see revision.md for the full plan. This
// table was already shaped to support multiple tiers (planKey/billingUnit/appliesTo are
// all per-row) even though v1 only ever seeded one "default" row; these new columns extend
// it for the 3-tier Free/Premium/Network rollout rather than requiring a rewrite.
export const pricingPlans = pgTable(
  "pricing_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planKey: text("plan_key").notNull(),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull(),
    // 20% annual discount (client-confirmed, revision.md §2.1) — null for the Free tier
    // (nothing to discount) and for any plan that hasn't set up annual billing yet.
    // Deliberately one extra column on the same row rather than a second pricing_plans row
    // per cadence — keeps every existing "one row per plan_key" query/read in this codebase
    // (getDefaultPricingPlan, billing overview, etc.) working unchanged; annual is just an
    // alternate price on the same tier, not a different tier.
    annualPriceCents: integer("annual_price_cents"),
    currency: text("currency").notNull().default("usd"),
    billingUnit: billingUnitEnum("billing_unit").notNull().default("flat"),
    appliesTo: planAppliesToEnum("applies_to").notNull().default("business"),
    // Max locations this plan allows; null = unlimited (Network tier). Enforced in
    // app/api/locations/route.ts's POST handler (added in the same pricing-restructure
    // pass) — see revision.md §3.4.
    locationLimit: integer("location_limit"),
    // Free trial length in days for this plan; null/0 = no trial (the Free tier itself, and
    // the initial "default" legacy row, which predates trials entirely). Read by
    // lib/stripe/subscription.ts when creating a Stripe subscription — see revision.md §3.2.
    trialDays: integer("trial_days"),
    stripePriceId: text("stripe_price_id"),
    stripeAnnualPriceId: text("stripe_annual_price_id"),
    // Network tier's client-confirmed "+$10/mo per location beyond the first" (revision.md
    // §2.1/§2.3) — null for every other plan (flat pricing, no per-unit component). Billed as a
    // SEPARATE Stripe subscription item (quantity = locationCount - 1) alongside the base
    // priceCents item, not folded into one tiered Price — mirrors the existing agency
    // managedBusinessCount pattern (lib/stripe/pricing.ts's getAgencyManagedBusinessCount +
    // syncAgencySubscriptionQuantity), the one proven "quantity-based Stripe item" precedent
    // already in this codebase, rather than introducing a second, different mechanism
    // (Stripe's native tiered/graduated pricing) for the same kind of problem.
    perExtraLocationCents: integer("per_extra_location_cents"),
    stripeExtraLocationPriceId: text("stripe_extra_location_price_id"),
    isActive: boolean("is_active").notNull().default(true),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("pricing_plans_plan_key_idx").on(table.planKey)]
);

// ---------------------------------------------------------------------------------------
// subscriptions
// ---------------------------------------------------------------------------------------

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id"),
    billableQuantity: integer("billable_quantity").notNull().default(1),
    amountCents: integer("amount_cents").notNull().default(0),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("subscriptions_account_id_idx").on(table.accountId)]
);

// ---------------------------------------------------------------------------------------
// invoices
// ---------------------------------------------------------------------------------------

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id"),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    amountCents: integer("amount_cents").notNull(),
    status: invoiceStatusEnum("status").notNull().default("open"),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("invoices_account_id_idx").on(table.accountId)]
);

// ---------------------------------------------------------------------------------------
// notification_events
// ---------------------------------------------------------------------------------------

export const notificationEvents = pgTable(
  "notification_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payloadJson: jsonb("payload_json"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("notification_events_account_id_idx").on(table.accountId)]
);

// ---------------------------------------------------------------------------------------
// email_verification_tokens
// ---------------------------------------------------------------------------------------

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("email_verification_tokens_token_idx").on(table.token)]
);

// ---------------------------------------------------------------------------------------
// password_reset_tokens
// ---------------------------------------------------------------------------------------

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("password_reset_tokens_token_idx").on(table.token)]
);

// ---------------------------------------------------------------------------------------
// contact_messages
// ---------------------------------------------------------------------------------------

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    message: text("message").notNull(),
    status: contactMessageStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("contact_messages_status_idx").on(table.status)]
);

// ---------------------------------------------------------------------------------------
// audit_logs
// ---------------------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_target_id_idx").on(table.targetId)]
);

// ---------------------------------------------------------------------------------------
// Relations (for ergonomic joined queries in later steps — not a schema requirement itself,
// but cheap to define alongside the tables and avoids hand-rolled joins drifting from the FKs
// above).
// ---------------------------------------------------------------------------------------

export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(users),
  locations: many(locations),
  devices: many(devices),
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  childAccounts: many(accounts, { relationName: "agencyChildren" }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  account: one(accounts, { fields: [users.accountId], references: [accounts.id] }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  account: one(accounts, { fields: [locations.accountId], references: [accounts.id] }),
  employees: many(employees),
  devices: many(devices),
  targets: many(targets),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  location: one(locations, { fields: [employees.locationId], references: [locations.id] }),
  devices: many(devices),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  account: one(accounts, { fields: [devices.accountId], references: [accounts.id] }),
  location: one(locations, { fields: [devices.locationId], references: [locations.id] }),
  employee: one(employees, { fields: [devices.employeeId], references: [employees.id] }),
  scans: many(scans),
}));

export const scansRelations = relations(scans, ({ one }) => ({
  device: one(devices, { fields: [scans.deviceId], references: [devices.id] }),
  location: one(locations, { fields: [scans.locationId], references: [locations.id] }),
  employee: one(employees, { fields: [scans.employeeId], references: [employees.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  account: one(accounts, { fields: [subscriptions.accountId], references: [accounts.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  account: one(accounts, { fields: [invoices.accountId], references: [accounts.id] }),
}));

// ---------------------------------------------------------------------------------------
// Inferred row types (Step 8 — used by lib/stripe/*.ts so those modules don't have to redeclare
// shapes that already exist here).
// ---------------------------------------------------------------------------------------
export type Account = typeof accounts.$inferSelect;
export type PricingPlan = typeof pricingPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
