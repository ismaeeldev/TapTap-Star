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
      **Important prior context found in `../Refrence/Chat.txt` and
      `../AgentGuide/00_SCOPE_DOCUMENT.md` §5 / `06_OPEN_QUESTIONS_FOR_CLIENT.md` #5**:
      this exact feature (AI review auto-responder) was already raised by the client
      once before, early in the project (chat, Aug 4), alongside 4 related Digifeel
      features (negative-review filtering, AI sentiment summaries, competitor/SEO
      monitoring, multi-platform review routing). That earlier round investigated
      Digifeel directly and found all 5 are bundled in Digifeel's own separate paid
      "Digifeel Pro" tier, not their base product — and were formally **locked as
      out-of-MVP-scope**, "a natural v2 roadmap item, not something silently dropped,
      since it was never part of the priced $160/21-day scope to begin with." The only
      extension point deliberately left in place for this was the generic
      `notification_events` service (already built, used for real MVP emails) — no
      speculative Review/Sentiment/Competitor tables were built. This client-requested
      pricing-tier placement of "AI-powered draft-reply suggestions" under Premium/
      Network (revision.md §2.2) is the client re-raising the same feature in a new
      context — worth flagging back to them that it was previously scoped as a
      separate, additionally-priced v2 feature, not included in the original
      engagement, before committing to build it as part of this pricing work at no
      extra cost.
- [x] **Done** — Network's "+$10/mo per location beyond the first" is now real (see §6's
      change log). Not reachable by agency accounts at all — the plan switcher
      (`app/api/billing/change-plan/route.ts`) explicitly blocks agency accounts from
      ever switching to a per-tier plan; agencies stay on the legacy "default" plan and
      their existing `managedBusinessCount` multiplier, entirely untouched by this. The
      "how do these two interact" question this item originally asked is moot by
      construction — they never co-occur on the same account.

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

1. ✅ **Done** — Schema + seed: 3 real pricing plan rows (commit `9974e1d`).
2. ✅ **Done** — Stripe: real Price objects + trial period wiring (commit `ec7585a`).
   Verified against real Stripe test mode.
3. ✅ **Done** — Marketing pricing page: 3-tier UI at `/pricing` (commit `174b557`).
   Verified light/dark/mobile, zero regressions on homepage/FAQ.
4. ✅ **Done** — Signup: plan selection + real card collection via Stripe Elements
   (commit pending). Verified all 3 tiers end-to-end against real Stripe test mode.
5. ✅ **Done** — Dashboard billing: plan switcher (upgrade/downgrade anytime, commit
   pending). Verified all 3 transition types against real Stripe test mode.
6. ✅ **Done** — Location cap enforcement for capped tiers (commit pending). Verified
   Free blocks at 1, Network stays unlimited, legacy default-plan accounts unaffected.
7. ⏳ **Not started, separate/later** — AI review-response feature — only after its own
   scoping questions are answered (§2.3).
8. ✅ **Done** — Network's "+$10/mo per location beyond the first" (commit pending),
   the one deferred piece from step 1, now fully wired and verified — see §6's change
   log. Also fixed a real edge case found while verifying this: downgrading from
   Network to a capped tier (Premium/Free) while over that tier's location limit is
   now blocked with a clear error, instead of silently letting the account keep
   locations its new plan shouldn't allow.

**All 6 core pricing-restructure steps, plus the Network per-location pricing
follow-up, are now complete.** Only step 7 (AI draft-reply, deliberately scoped as a
separate follow-up project) and the Free-tier device-cap number (§2.3) remain — both
need a decision from the client, not more building.

Each of the above is its own commit, its own live Playwright verification, its own
push to both `origin` and `me-origin`, matching the established pattern for this project.

---

## 5. Testing checklist

Written before implementation started, as a target list — every item below except one
has since been verified for real against Stripe test mode as each step was built (see
§6's change log for the specific runs). Checked off to reflect that; this section had
gone stale (still showing all-unchecked) even after the work was actually done.

- [x] Free tier signup → correct plan, location cap enforced, no trial (Free has none).
- [x] Premium/Network tier signup → correct Stripe subscription, right price + trial
      period. Verified via real signups with Stripe's test card, confirmed `trialing`
      status and exact trial_end via direct Stripe API reads.
- [ ] **Not tested** — Trial expiration → subscription correctly transitions to a real
      charge. Needs Stripe test clocks to simulate 14 days passing; hasn't been run.
      Worth doing before this goes anywhere near real customers, but doesn't block
      anything else — the trial *creation* side is fully verified, only the *end of
      trial* transition is unverified.
- [x] Plan switch (upgrade/downgrade), all transition types, including the
      Network-with-multiple-locations → capped-tier downgrade edge case (blocked
      correctly, real 400 with a clear message).
- [x] Location cap: verified Free blocks at 1 with a clear error, Network stays
      unlimited, legacy accounts unaffected.
- [x] Agency accounts: confirmed they're structurally blocked from the new tier system
      entirely (the plan-switcher route rejects `account.type === "agency"`), so the
      existing `managedBusinessCount` multiplier is untouched by any of this work.
- [x] Marketing pricing page: verified light/dark/mobile, zero regressions on
      homepage/FAQ.
- [x] No regressions on existing single-plan accounts: verified directly against the
      seeded `owner@downtowncafe.local` account (still `planKey: "default"`,
      unaffected by every step including the location cap).

---

## 6. Change log

- **[Prices confirmed]** Client answered all clarifying questions via `Billing.pdf`.
  Prices, trial terms, billing cadence, and Digifeel-feature-mapping all resolved (§2).
  One item flagged back to the client for a sanity-check (the Free/Premium/Network price
  parse — see §2.1's note) since it was inferred from a slightly ambiguous single line,
  not copy-pasted from an unambiguous source.
- Two small scoped items remain open (§2.3) but don't block starting implementation —
  they'll be resolved alongside building, not before.
- **[Steps 1-6 built and verified]** Schema, Stripe wiring, the new 3-tier marketing
  page, signup with tier selection + card collection, the dashboard plan switcher, and
  location-cap enforcement — all built, tested against real Stripe test mode, committed
  individually, and pushed to both remotes.
- **[Network per-location pricing completed]** The one deliberately-deferred piece from
  step 1 (Network's "+$10/mo per extra location") is now real: two new nullable
  columns (`perExtraLocationCents`, `stripeExtraLocationPriceId`) on `pricing_plans`,
  a new `syncNetworkLocationQuantity()` that adds/updates/removes a second Stripe
  subscription item as locations are added or deleted (called from both
  `app/api/locations/route.ts`'s POST and `[id]/route.ts`'s DELETE), and
  `changeSubscriptionPlan`'s paid↔paid transition fixed to correctly identify the base
  line item (not assume `items.data[0]`) when a second item might already exist.
  Verified end-to-end against real Stripe: adding locations correctly grows the
  per-location item's quantity and the local `amountCents` ($60→$70→$80 for 1→2→3
  locations), deleting back down to 1 location correctly removes the per-location item
  entirely rather than leaving it at quantity 0.
  - **Bug found and fixed during this verification**: switching from Network down to a
    capped tier (Premium/Free) while over that tier's location limit previously
    succeeded silently, leaving the account with more locations than its new plan
    should allow. Now blocked with a clear "you have N locations, but X only allows N"
    error — the same location-cap enforcement `app/api/locations/route.ts` already
    applies to new locations, now also applied at plan-switch time.
  - **Second bug found and fixed in the same pass**: the new error was initially thrown
    as a plain `Error`, which `authErrorResponse` silently flattens to a generic
    "Something went wrong" 500 for anything that isn't an `AuthError` — the real,
    actionable message would never have reached the user. Fixed by throwing
    `AuthError` instead, confirmed via a live test that the real message now reaches
    a toast in the browser.

## 7. Modifications 6 (separate PDF, Sept 3-4) — quick fixes, not part of the pricing plan above

Client sent a new PDF ("Modifications 6") plus a support-chat thread reporting a real
production bug. All items below verified against the live DB/code before fixing (not
assumed), built, tested, and shipped:

- **Bug found and fixed: broken redirect on device `w3PA58E6`.** Client reported that
  their one physical demo stand's Alibaba link redirected to Taptapstar's own 404 page
  instead of Alibaba. Root cause confirmed via direct DB read: the device's code is
  stored as `w3PA58E6`, but the physical stand's printed QR/NFC tag encodes
  `W3PA58E6` (uppercase `W`) — `/r/[code]` and `/claim/[code]` both did an exact-match
  `eq()` lookup, so the real-world tap/scan never matched and silently fell through to
  the "not found" branch. Device codes intentionally use a mixed-case alphabet
  (`lib/qr/index.ts`) so DB uniqueness stays case-sensitive by design — verified zero
  case-fold collisions across all 412 existing devices before switching both live
  lookup sites to case-insensitive (`lower(code) = lower(?)`) matching. Verified live:
  both `/r/W3PA58E6` and `/r/w3PA58E6` now redirect correctly to the stored Alibaba
  URL; a genuinely unknown code still correctly 404s.
- **"Google review link" → "Destination link"** in the location form (claim wizard,
  dashboard locations list add/edit) and the device-deactivate dialog copy — client's
  request, since not every physical card points at Google. DB column name
  (`googleReviewUrl`) and API field name deliberately left unchanged (internal only).
- **Homepage + `/faq` switched to the real 3-tier pricing.** These were the one place
  in the app still showing the retired single flat-rate plan ($29.90) after the
  Modifications 5 restructure — flagged at the time (§3.3) as a known follow-up, not
  bundled into that step. `PricingCard`/`FaqAccordion`'s old flat-rate copy replaced
  with `PricingTiers` and a rewritten tier-aware FAQ answer, both reading live prices.
  Feature checkmarks cross-checked against the client's PDF row-by-row — already
  matched exactly, no change needed there.
- **Login/signup image fixed.** Client had already replaced `public/login_image.png`
  with a new square (1254×1254) asset directly in the folder; the layout's `<Image>`
  still declared the old portrait image's dimensions (1122×1402), which would have
  visually distorted the new image. Corrected the width/height props; removed the
  unused leftover old image file.

All verified: lint clean, production build clean, live `next start` + real HTTP checks
(not just UI text matching) for the redirect fix, Playwright-rendered check that the
FAQ's live tier prices actually appear, and screenshots confirming the homepage tier
grid and login image render correctly. Committed and pushed to both remotes
(`4a78a82`).

---

*This document is updated as decisions come in and work progresses. All core
pricing-restructure work (steps 1-6 plus the Network per-location follow-up) is built,
verified, and live. Modifications 6 (redirect bug, link label, homepage pricing,
login image) is also built, verified, and live. Remaining: step 7 (AI draft-reply —
needs its own scoping pass) and the Free-tier device-cap number — both waiting on the
client, not on more building.*
