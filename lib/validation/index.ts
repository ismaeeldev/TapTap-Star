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
