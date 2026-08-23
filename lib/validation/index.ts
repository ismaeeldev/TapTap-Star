// Zod schemas per entity, used by every API route (see architecture doc section 1).
// Step 3 adds the auth-flow schemas; later steps append their own entity schemas here.
import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// --- Step 4: locations / employees / device activation ---

export const locationSchema = z.object({
  name: z.string().trim().min(1, "Location name is required").max(200),
  address: z.string().trim().min(1, "Address is required").max(500),
  googleReviewUrl: z.url("Enter a valid URL").trim(),
  language: z.string().trim().min(2).max(10).default("en"),
});
export type LocationInput = z.infer<typeof locationSchema>;

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required").max(200),
  locationId: z.uuid("Invalid location"),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export const employeeUpdateSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required").max(200),
});
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

export const activateDeviceSchema = z.object({
  locationId: z.uuid("Invalid location"),
  employeeId: z.uuid("Invalid employee").nullable().optional(),
});
export type ActivateDeviceInput = z.infer<typeof activateDeviceSchema>;

// --- Step 5: dashboard core (devices reassign, location edit, targets) ---

export const reassignDeviceSchema = z.object({
  locationId: z.uuid("Invalid location"),
  employeeId: z.uuid("Invalid employee").nullable().optional(),
});
export type ReassignDeviceInput = z.infer<typeof reassignDeviceSchema>;

export const locationUpdateSchema = z.object({
  name: z.string().trim().min(1, "Location name is required").max(200).optional(),
  address: z.string().trim().min(1, "Address is required").max(500).optional(),
  googleReviewUrl: z.url("Enter a valid URL").trim().optional(),
  language: z.string().trim().min(2).max(10).optional(),
});
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;

export const targetSchema = z.object({
  locationId: z.uuid("Invalid location"),
  periodType: z.enum(["weekly", "monthly"]),
  targetScans: z.coerce.number().int().min(1, "Target must be at least 1"),
});
export type TargetInput = z.infer<typeof targetSchema>;

// --- Step 6: analytics date-range + dimension filters ---
// Shared by app/api/analytics/route.ts and app/api/scans/export/route.ts so the on-screen view
// and the exported file are always filtered identically.
export type AnalyticsFilterResult =
  | { ok: true; range: { start: Date; end: Date }; locationId?: string; deviceId?: string }
  | { ok: false; message: string };

export function parseAnalyticsFilters(searchParams: URLSearchParams): AnalyticsFilterResult {
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  // Default: current calendar month (UTC), matching lib/queries/leaderboard.ts's convention.
  const now = new Date();
  const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const start = fromRaw ? new Date(fromRaw) : defaultStart;
  // `to` is inclusive of the whole day in the UI, so the exclusive upper bound is the day after.
  const end = toRaw ? new Date(new Date(toRaw).getTime() + 24 * 60 * 60 * 1000) : defaultEnd;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, message: "Invalid date range" };
  }
  if (start >= end) {
    return { ok: false, message: "Start date must be before end date" };
  }

  const locationId = searchParams.get("locationId");
  const deviceId = searchParams.get("deviceId");
  if (locationId && !z.uuid().safeParse(locationId).success) {
    return { ok: false, message: "Invalid location filter" };
  }
  if (deviceId && !z.uuid().safeParse(deviceId).success) {
    return { ok: false, message: "Invalid device filter" };
  }

  return {
    ok: true,
    range: { start, end },
    locationId: locationId ?? undefined,
    deviceId: deviceId ?? undefined,
  };
}

// --- Step 7: agency / multi-client accounts ---

export const createClientAccountSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(200),
  ownerName: z.string().trim().min(1, "Owner name is required").max(200),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
});
export type CreateClientAccountInput = z.infer<typeof createClientAccountSchema>;

export const agencyRejectSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
export type AgencyRejectInput = z.infer<typeof agencyRejectSchema>;

// --- Step 8: billing / subscriptions ---

export const updatePricingPlanSchema = z.object({
  // Stored in cents — $1.00 minimum sanity floor, well under the real $29.90 price but guards
  // against an accidental $0.00 submit.
  priceCents: z.coerce.number().int().min(100, "Price must be at least $1.00").max(100_000_000),
});
export type UpdatePricingPlanInput = z.infer<typeof updatePricingPlanSchema>;

// --- Step 9: notifications (contact form) ---

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  message: z.string().trim().min(1, "Message is required").max(5000),
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;

// --- Step 10: internal admin panel ---

export const batchGenerateSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(1000, "Generate at most 1000 at a time"),
  deviceType: z.enum(["card", "plaque", "stand"]),
});
export type BatchGenerateInput = z.infer<typeof batchGenerateSchema>;

export const batchImportSchema = z.object({
  csvText: z.string().trim().min(1, "Paste or upload a CSV first"),
});
export type BatchImportInput = z.infer<typeof batchImportSchema>;

export const supportForceReassignSchema = z.object({
  locationId: z.uuid("A location is required"),
  employeeId: z.uuid().optional().nullable(),
});
export type SupportForceReassignInput = z.infer<typeof supportForceReassignSchema>;

export const supportBillingCreditSchema = z.object({
  amountCents: z.coerce.number().int().min(1, "Amount must be greater than $0").max(100_000_00),
  reason: z.string().trim().min(1, "A reason is required").max(1000),
});
export type SupportBillingCreditInput = z.infer<typeof supportBillingCreditSchema>;

export const adminAccountSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export const adminDeviceSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["unassigned", "active", "deactivated"]).optional(),
  source: z.enum(["generated", "imported"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
