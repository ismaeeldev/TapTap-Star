# Revision Plan — Modifications 5 (page 2): Pricing Restructure

Status: **PRICES CONFIRMED — ready to start implementation.** All previously-open
questions answered by the client in `Billing.pdf`. Section 2 below is now fully resolved;
implementation can begin at Section 4's step 1.

Source: `Modifications 5 (1).pdf` page 2 (original request) + `Billing.pdf` (client's
answers to the clarifying questions) — Taptapstar's pricing is being restructured to 3
tiers (Free / Premium / Network) matching competitor **Digifeel's plan structure and
functionality** (explicitly NOT Digifeel's exact prices — client's own words: "Don't copy
prices, just functionabilities"), replacing the current single flat $29.90/month plan.
Also answers "where is this request going?" about Agency access requests.

---

## 0. Quick answer already given to the client: "where is this request going?"

Not a code change — just an explanation, for reference:

Agency access requests go to a **human review queue**, not an automatic process:

1. Business owner clicks "Request Agency Access" on `/dashboard/agency` →
   `POST /api/agency/request` sets `accounts.agencyStatus = "pending"`.
2. It appears in `/admin/agency-requests`, visible only to the `taptapstar_admin` role.
3. A Taptapstar admin manually clicks Approve or Reject.
   - **Approve** (`/api/admin/agency-requests/[id]/approve`): flips the account to
     `type: "agency"`, promotes every user on it to `agency_admin`, sends an email.
   - **Reject**: sets `agencyStatus: "rejected"` with a reason the owner can see on their
     own Agency page.

No SLA/timeout — it waits for a human. If the client wants faster turnaround, that's a
process question for them (checking `/admin/agency-requests` regularly), not a bug.

---

## 1. What currently exists (confirmed by reading the actual code)

| Area | Current state | File(s) |
|---|---|---|
| Pricing | **One single flat plan**, hardcoded price $29.90/mo, seeded once | `lib/db/seed.ts:44-57`, `lib/db/schema.ts:246-263` (`pricingPlans` table) |
| Marketing pricing page | One plan card, no tier selector, explicit "no tiers to compare" copy | `app/(marketing)/pricing/page.tsx`, `components/marketing/pricing-card.tsx` |
| Dashboard billing page | Shows the one plan's price, portal link, invoices — no plan switcher | `app/dashboard/billing/page.tsx`, `lib/queries/billing.ts` |
| Stripe trial support | **Does not exist.** Comment in code literally says "no trial exists in v1" | `lib/stripe/subscription.ts:14` |
| AI-powered review responses | **Does not exist at all** — no schema, no route, no UI, zero code | (nothing to reference — net-new feature) |
| Location limit / cap | **Does not exist** — locations are unlimited today, by design | `app/api/locations/route.ts` (no count check anywhere) |
| Agency billing multiplier | Already exists (agency pays `managedBusinessCount × plan price`) | `lib/stripe/pricing.ts:75-80` |

**Important finding:** the `pricingPlans` DB table is actually already shaped to support
multiple tiers (`planKey`, `billingUnit`, `appliesTo` are all per-row columns) — it was
just never used for more than one row. This means the tier system is a real, buildable
feature on top of the existing schema, not a rewrite. Good news for scope.

---

## 2. Client's answers (from `Billing.pdf`) — all decisions now resolved

### 2.1 Pricing

| Tier | Price | Locations | Card required to sign up? |
|---|---|---|---|
| **Free** | $0/mo, forever | 1 | No — "truly free forever," no card |
| **Premium** | $25/mo base | 1 | Yes — trial requires card upfront |
| **Network** | $60/mo base, **+$10/mo per additional location** | Unlimited (pay-per-location) | Yes — trial requires card upfront |

**How this was parsed** (client's raw line: "Free - 25$ - 60$ (1 location) each location +
increment price by 10$"): read as Free=$0 / Premium=$25 base / Network=$60 base-for-1-
location-then-+$10/each-additional — the only reading consistent with (a) the client's own
separate "truly free forever" answer for Free, and (b) the Digifeel screenshot's Network
tier having an "I manage N locations" selector (i.e., Network is priced per-location, the
other two tiers are flat). **Flagging this explicitly since it was inferred from a
slightly ambiguous line, not a literal 1:1 quote — confirm this table is what you meant
before it becomes the seeded price if there's any doubt.**

- **Annual billing**: offered on top of monthly, **20% discount** on the annual price for
  every paid tier.
- **Trial**: **14 days, on both paid tiers** (Premium + Network) — **not** Free (Free has
  no trial concept, it just IS free forever). **Card required at signup**, before the
  trial starts (not "card only after trial ends") — this is a real Stripe
  `trial_period_days` subscription with a payment method attached immediately, not a
  card-less trial.
- **Plan switching**: **anytime**, upgrade or downgrade, no restriction.
- **Digifeel-specific things to explicitly avoid copying**: none flagged by the client
  ("Not now I believe") — but prices themselves are the one hard no ("Don't copy prices,
  just functionabilities").

### 2.2 Feature split per tier — translated from the Digifeel screenshot into Taptapstar's
actual product (devices/scans/locations/analytics, not Digifeel's literal
review-management wording), functionality only, no prices copied:

**Free** — "just enough to set up and manage your account":
- 1 location
- Devices: reasonable low cap (needs a concrete number — see open question in §2.3)
- Basic analytics dashboard (the existing scans-over-time line chart)
- No AI draft-reply feature

**Premium** — "activate automation and grow faster with AI-powered tools" (everything in
Free, plus):
- AI-powered draft-reply suggestions for reviews (see §2.3 — new feature, needs its own
  scope pass; "suggest a draft the owner approves," never auto-sends)
- Real-time scan alerts/notifications (new — doesn't exist today, needs its own scope)
- Full analytics (the pie-by-location breakdown + line chart, unlocked vs. Free's basic
  view)
- Still 1 location

**Network** — "all the growth tools to manage multiple locations" (everything in Premium,
plus):
- **Unlimited locations**, billed **+$10/mo per location beyond the first** (this is the
  tier's whole point — multi-location businesses)
- Centralized multi-location dashboard (this already effectively exists — the existing
  location filter on Analytics — mostly a "make sure it scales/reads well with many
  locations" pass, not a new build)
- Agency-relevant: this is the natural tier for agency accounts managing multiple client
  businesses, ties into the existing `managedBusinessCount` billing multiplier
  (`lib/stripe/pricing.ts:75-80`) — needs a decision on how Network-tier pricing and the
  existing agency multiplier combine (see §2.3)

### 2.3 Still open — small, scoped follow-ups (not blocking pricing implementation start)

These are narrow enough to resolve alongside implementation rather than blocking it, but
are called out so they don't get silently skipped:

- [ ] Free tier's exact device cap (a number — e.g. "up to 3 devices") — the Digifeel
      screenshot doesn't show a device limit at all (it's a review-management tool, no
      device concept), so this one has no Digifeel equivalent to reference; needs a
      Taptapstar-specific number.
- [ ] AI draft-reply feature: full scope still needs its own pass once pricing tiers are
      live — this needs a Google-reviews-import feature that doesn't exist yet before any
      "draft a reply" UI is meaningful. Treated as its own follow-up project (see §3.5),
      not bundled into the initial pricing-tier rollout.
- [ ] How does Network tier's own per-location price (+$10/location) interact with the
      *existing* agency-only `managedBusinessCount` multiplier? (e.g., does an agency on
      Network pay $60 + $10×extra-locations × managed-business-count, or is agency
      billing kept as a separate, parallel model from the new per-location Network
      pricing?) Needs a decision before Network-tier Stripe wiring for agency accounts
      specifically.

---

## 3. Planned implementation (prices confirmed — ready to build)

### 3.1 Data model
- Seed 3 real `pricingPlans` rows:
  - `free` — $0/mo, `billingUnit: "flat"`, `locationLimit: 1`
  - `premium` — $2500 cents/mo, `billingUnit: "flat"`, `locationLimit: 1`
  - `network` — $6000 cents/mo base, `billingUnit: "per_device"`-style but per-*location*
    not per-device (the existing `billingUnit` enum is `"flat" | "per_device"` — Network's
    "+$10 per location beyond the first" doesn't cleanly fit either value as-is; likely
    needs a new `"per_location"` billing-unit value added to the enum, or a dedicated
    `perExtraLocationCents` column — a real schema decision to make at implementation
    time, not just data entry), `locationLimit: null` (unlimited)
  - Each row also needs an **annual** variant (or an `annualPriceCents` column /
    a second Stripe Price per tier) for the 20% annual discount.
- Add `locationLimit` (nullable int) column to `pricingPlans` — null = unlimited
  (Network), a number = capped (Free=1, Premium=1).
- `accounts.planKey` already exists and just needs to point at the right row.

### 3.2 Stripe
- Create real Stripe Price objects: 2 per paid tier (monthly + annual) = 4 total, plus
  Network's per-location increment (Stripe supports this via a metered/tiered price or a
  separate per-unit line item — needs to mirror how `managedBusinessCount` already works
  for agency billing in `lib/stripe/pricing.ts`, since that's the one existing precedent
  for "quantity-based" pricing in this codebase).
- Add `trial_period_days: 14` to the subscription-creation call in
  `lib/stripe/subscription.ts` (currently absent entirely) — for Premium + Network only,
  never Free (Free never creates a Stripe subscription at all, being $0 forever).
- **Card required at trial start**: this means `createStripeCustomerAndSubscription()`
  needs a `payment_method` attached BEFORE the subscription is created (currently signup
  uses `payment_behavior: "default_incomplete"` — no card required at all today; this
  needs a real card-collection step in the paid-tier signup/upgrade flow, e.g. Stripe
  Elements or Checkout, that doesn't exist yet for any tier).
- Handle Stripe's `trialing` subscription status as its own real state instead of the
  current "treat as active, no trial exists" shortcut (`lib/stripe/subscription.ts:14`).

### 3.3 Marketing pricing page
- Replace the single pricing card with a 3-tier comparison layout (`app/(marketing)/pricing/page.tsx` + `pricing-card.tsx`), each tier's feature list, "Get started" → signup
  with the chosen plan pre-selected.

### 3.4 Signup / dashboard
- Signup flow needs a plan-selection step (currently signs everyone up to `"default"`
  with no choice).
- Dashboard billing page needs an actual plan-switcher (upgrade/downgrade), not just a
  read-only display of one plan.
- Enforce the location cap for Free/Premium tiers in `app/api/locations/route.ts` (add
  the count check that doesn't exist today), with a clear upgrade-prompt error message
  when blocked.

### 3.5 AI review responses (net-new feature, scope TBD)
- Needs its own separate scoping pass once the client clarifies what this means for
  Taptapstar specifically — likely out of scope for the first pricing-restructure pass,
  called out separately so it doesn't silently get bundled in.

---

## 4. Execution plan once prices are provided

Same discipline as every round so far — one step at a time, each verified with a real
browser test before moving to the next, committed and pushed individually:

1. ✅ **Done** — Schema + seed: 3 real pricing plan rows (commit `9974e1d`). Network
   shipped flat ($60/mo) for now — the per-location increment is deferred, see §2.3/§3.1.
2. ✅ **Done** — Stripe: real Price objects + trial period wiring (commit `ec7585a`).
   Verified against real Stripe test mode.
3. ✅ **Done** — Marketing pricing page: 3-tier UI at `/pricing` (commit `174b557`).
   Verified light/dark/mobile, zero regressions on homepage/FAQ.
4. ⏳ **Not started** — Signup: plan selection + real card collection (Stripe Elements or
   Checkout — doesn't exist yet for any tier today).
5. ⏳ **Not started** — Dashboard billing: plan switcher (upgrade/downgrade anytime).
6. ⏳ **Not started** — Location cap enforcement for capped tiers.
7. ⏳ **Not started, separate/later** — AI review-response feature — only after its own
   scoping questions are answered (§2.3).

Each of the above is its own commit, its own live Playwright verification, its own
push to both `origin` and `me-origin`, matching the established pattern for this project.

---

## 5. Testing checklist (to run once each step above is built)

- [ ] Free tier signup → correct default plan, location cap enforced, trial banner (if
      applicable) shows correctly.
- [ ] Premium/Network tier signup → correct Stripe subscription created with the right
      price + trial period.
- [ ] Trial expiration → subscription correctly transitions to a real charge (test via
      Stripe test clocks, not by waiting 14 real days).
- [ ] Plan switch (upgrade/downgrade) from dashboard billing page → Stripe subscription
      updated correctly, `accounts.planKey` updated, no double-billing.
- [ ] Location cap: attempting to add a location past the limit on Free/Premium shows a
      clear error + upgrade prompt, not a silent failure or crash.
- [ ] Agency accounts: confirm the existing per-managed-business multiplier still works
      correctly against whichever tier an agency is on.
- [ ] Marketing pricing page: all 3 tiers render correctly, light + dark mode, mobile.
- [ ] No regressions on the existing single-plan accounts already in the DB during/after
      migration to the new multi-tier model.

---

## 6. Change log

- **[Prices confirmed]** Client answered all clarifying questions via `Billing.pdf`.
  Prices, trial terms, billing cadence, and Digifeel-feature-mapping all resolved (§2).
  One item flagged back to the client for a sanity-check (the Free/Premium/Network price
  parse — see §2.1's note) since it was inferred from a slightly ambiguous single line,
  not copy-pasted from an unambiguous source.
- Two small scoped items remain open (§2.3) but don't block starting implementation —
  they'll be resolved alongside building, not before.

---

*This document is updated as decisions come in and work progresses. Implementation has
not started yet — this is still the plan, not a build log, until Section 4's steps begin
getting checked off.*
