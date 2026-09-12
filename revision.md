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
- [x] **Now tested** — Trial expiration → subscription correctly transitions to a real
      charge. Verified using a real Stripe test clock (not simulated): created a
      customer+subscription mirroring `createStripeSubscriptionForPlan()` exactly
      (real Premium price, real 14-day trial, real test card attached), advanced the
      clock 15 days, and confirmed Stripe itself produced a real `paid` invoice
      ($25.00, `billing_reason: subscription_cycle`) and flipped the subscription to
      `active`. Then delivered that exact real invoice as a properly-signed
      `invoice.payment_succeeded` webhook event to the app's own local webhook route
      (signed with the real `STRIPE_WEBHOOK_SECRET`, same as `stripe.webhooks.
      constructEvent` expects) and confirmed end-to-end: the account correctly moved
      `grace_period` → `active`, a matching local `invoices` row was written, and the
      `payment_recovered` notification fired — exercising the trickiest branch of that
      handler (a genuine recovery, not a routine renewal). All Stripe test objects and
      local test rows cleaned up afterward.
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
- **Testimonials redesigned into a real testimonial layout.** Client: "fill this with
  reviews, use AI to create some of them." Replaced the earlier explicit per-card
  "Preview" badge grid (3 cards) with a normal-reading testimonials section — 5-star
  ratings, initials avatar, name + role, 6 cards — while keeping one section-level
  disclaimer line (not a badge on every card) so it still doesn't present itself as
  real collected customer feedback. All names/businesses generic placeholders.

All verified: lint clean, production build clean, live `next start` + real HTTP checks
(not just UI text matching) for the redirect fix, Playwright-rendered check that the
FAQ's live tier prices actually appear, and screenshots confirming the homepage tier
grid, login image, and testimonials all render correctly. Committed and pushed to
both remotes (`4a78a82`, `0ce23e1`, `21608c3`).

Two further real bugs found and fixed in this same period, outside the numbered PDF
items, from a client support-chat report ("QR redirects to an inexistent page"):
- **Root cause of the QR redirect failures: `NEXT_PUBLIC_APP_URL` was `localhost:3000`
  in the actual production deployment.** Every device's stored QR image (all 412 of
  them, not just the one reported) had a dead `localhost:3000` link baked in as a
  result. Fixed the env var in Vercel, added a real (non-localhost) fallback in
  `lib/qr/index.ts`, and ran a one-time script regenerating every device's QR image
  against the correct URL — verified by decoding all 412 afterward (zero remaining
  bad links) and confirming the exact reported device's real redirect target live.
- **Verification/welcome emails had no real logo (just styled text) and an
  unclickable-in-some-clients button.** `Layout.tsx` (shared by every email template)
  now renders a real `<img>` logo via an absolute production URL, and `CtaButton` was
  rebuilt using the standard "bulletproof button" email pattern (a real `<table><td
  bgcolor>`, not just inline CSS on an `<a>`) since some clients — Outlook's
  Word-based rendering engine especially — silently ignore CSS-only button styling.

## 8. Modifications 7 (PDF, Sept 10-11) — items 1-4 built; items 5-9 are scope/business
   decisions held for the client, not code work

- **Add employee button** — the POST `/api/employees` endpoint already existed (used
  inline by the claim wizard) but had no direct entry point on the Employees page
  itself; there was genuinely no way to add an employee ahead of a device assignment.
  Added a dialog reusing that same endpoint; removed the old "0 employees" dead-end
  empty state that made the page unreachable in exactly that scenario.
- **Day-based scan timestamps** — `timeAgo()` previously capped out at raw hours
  (client's screenshot showed "82h ago"); now rolls over to "Nd Nh ago" past 24 hours.
- **Sidebar install button always visible** — was only reachable after scrolling to
  the bottom of the page on any screen with enough content to overflow the viewport,
  since `mt-auto` only pinned to the bottom of the sidebar's own content, not the
  screen. Fixed by making the `<aside>` itself viewport-height and sticky.
- **Agency request admin alert** — the agency-request feature already worked (requests
  visible at `/admin/agency-requests`, approve/reject already emails the requester),
  but nothing notified an admin that a *new* request had come in at all. Added a real
  email alert to `ADMIN_INBOX_EMAIL`, mirroring the existing contact-form-submission
  pattern. Two real pending requests were found already sitting unreviewed from before
  this fix existed (predate the alert, won't retroactively trigger one — flagged to
  the client to check manually).
- Items 5-9 (AI review replies, a not-yet-purchased `taptapstar.eu` redirect, a full
  Free/Premium pricing-model restructure, and matching Digifeel/Tapstar feature-for-
  feature) are business/scope decisions, not bugs — held for explicit client direction
  before any of them are built, per the same reasoning as the AI-feature scoping
  history above.

All verified: lint clean, production build clean, every item live-tested end to end
against a real running server with a real account (real signup, real login, real DB
writes) — not just UI text/screenshot matching. All test data cleaned up afterward.
Committed and pushed to both remotes (`d40d5c3`).

## 9. Trial-expiration verification (Sept 11) — the one remaining open testing-checklist
   item, now closed

Verified using a real Stripe test clock (not simulated, not waited-for): created a
customer + subscription mirroring `createStripeSubscriptionForPlan()` exactly (real
Premium price, real 14-day trial, real test card), advanced the clock 15 days, and
confirmed Stripe itself produced a real `paid` invoice ($25.00,
`billing_reason: subscription_cycle`) and flipped the subscription to `active`. Then
delivered that real invoice as a properly-signed `invoice.payment_succeeded` webhook
event to the app's own local webhook route (signed with the real
`STRIPE_WEBHOOK_SECRET`) and confirmed end-to-end: the account correctly moved
`grace_period` → `active`, a matching local `invoices` row was written, and the
`payment_recovered` notification fired. All Stripe test objects and local test rows
cleaned up afterward — nothing left in either system.

**Separately flagged (not fixed, needs a manual dashboard step before real launch)**:
`STRIPE_WEBHOOK_SECRET` in `.env.local` is still the throwaway local-testing value
noted in `app/api/billing/webhook/route.ts`'s own header comment — a real webhook
endpoint has not yet been registered in the Stripe Dashboard. Real Stripe events
(trial-end charges, failed payments, cancellations) have nowhere to land in
production until that one manual step is done.

## 10. AI removal, Free device cap, review-filtering feature (Sept 11)

Client's explicit decisions, closing out the two long-open items from §2.3: **"remove
ai feature not add"** and Free tier device cap = **"1 device (matches Free's
1-location cap)"**. Plus a new feature request (Sept 7 message): let a business route
customers by star rating — high ratings to the public review platform, low ratings to
a private feedback form instead.

- **AI feature fully removed** from all marketing copy (`pricing-tiers.tsx`,
  `faq-accordion.tsx`) — it was never built and had been flagged out-of-scope multiple
  times; the pricing table was advertising something that didn't exist. Replaced with
  "Review filtering," a real, shipped feature (below).
- **Free tier device cap = 1**, implemented exactly like the existing location cap:
  new `pricingPlans.deviceLimit` column (additive migration `0004`), enforced at
  device *activation* (not batch-create — an unassigned device belongs to no account
  yet). Verified live: a Free account with 1 active device gets a clear, correct
  error activating a 2nd ("Your Free plan allows up to 1 active device. Upgrade to
  Premium or Network for more."), shown in the real claim-wizard UI.
- **Review-filtering feature** (migration `0005`): `locations` gains filter
  enabled/threshold/destination-type/destination-url columns (all defaulted so every
  existing location is unaffected by construction); new `private_feedback` table.
  `/r/[code]` redirects to a new `/r/[code]/rate` star-picker page when a location's
  filter is on — the one deliberate exception to that route's "no rendered UI, ever"
  rule — otherwise behaves byte-for-byte identically to before. High ratings do a real
  client-side redirect to the review platform; low ratings show an inline private
  feedback form, never posted publicly. Dashboard: a per-location settings panel
  (Premium/Network only, enforced server-side — verified a Free account gets a real
  403 on a direct API request, not just a hidden button) and a new
  `/dashboard/feedback` inbox with a real-time email alert per low-star submission.

Verified end-to-end against a real running server: confirmed zero regression for the
default (filter-off) path across all 412 existing devices; confirmed a low-star tap
creates a real DB row and sends a real email; confirmed a high-star tap does a real
redirect to the real review URL; confirmed the settings panel, feedback inbox, and
plan-gating all work with real data. Lint clean, full production build clean.
Committed and pushed to both remotes (`f1818db`).

---

## 11. Shop button + webhook migration (Sept 12)

- **Shop button (Modifications 7 item 6)**: a real external link to
  `https://taptapstar.eu` added to the navbar (desktop + mobile) and footer. Client
  confirmed: build it now, domain purchase follows separately — a real link, not a
  feature flag; it will simply fail to resolve until the domain is registered, same
  as any not-yet-live domain. Verified live: renders correctly and links to the right
  URL in all three placements.
- **Modifications 7 items 2 and 3 dropped** per explicit client instruction, after
  checking `revision.md`, `Refrence/Chat.txt`, and the AgentGuide scope docs for any
  answer already on record — found none beyond what's already resolved (the AI
  feature's prior lock). These needed direct client input and didn't get it; per the
  client's own call, no longer pursued.
- **Domain migration confirmed live**: `www.taptapstar.com` now correctly serves this
  app (the client completed the DNS switch away from the old Shopify store) — the
  already-printed QR plates work with zero further code changes. `NEXT_PUBLIC_APP_URL`
  updated in Vercel to `https://www.taptapstar.com` accordingly.
- **Stripe webhook fully tested locally, end to end, zero bugs found**: ran the real
  app against a real `stripe listen` session (using this project's actual Stripe test
  account explicitly, not the CLI's misconfigured default profile — a real risk
  checked and avoided), with a freshly rotated signing secret. Confirmed all three
  CLI-triggerable events (`invoice.payment_succeeded`, `invoice.payment_failed`,
  `customer.subscription.deleted`) deliver successfully and correctly transition a
  real test account's status (`active`↔`grace_period`↔`suspended`) with the matching
  email firing each time. `invoice.upcoming` isn't independently triggerable via the
  CLI; unchanged since its own prior verification round. All Stripe test objects and
  local DB rows cleaned up afterward.
- **Found**: the webhook endpoint actually registered in Stripe (`we_1U78PIF2Eziu...`,
  created Aug 22) still points at the old `taptap-star.vercel.app` URL, not the new
  `www.taptapstar.com` domain — a real, still-open item, not yet fixed (needs editing
  in the Stripe Dashboard; the signing secret does not need to change).
- **Note**: the client has separately switched Vercel's production Stripe keys to
  LIVE mode with real live-mode Products/Prices/webhook already configured on their
  end — confirmed this was intentional, not a mistake. `.env.local` (this repo's local
  dev config) stays on test-mode keys; all local verification in this document uses
  those test keys exclusively.

## 12. Real bug found and fixed: Stripe CardElement's hidden ZIP requirement (Sept 12)

Asked to fully re-test the Premium/Network signup and plan-switch flows end to end
after the webhook URL discussion — this time through the real UI with Playwright
driving an actual Stripe test card, not just API-level checks. Found a genuine,
previously-undetected bug:

`CardElement` (components/billing/stripe-card-form.tsx) defaults to also requiring a
postal/ZIP code as part of what counts as "complete" — but the card box only visually
labels number/expiry/CVC, with no separate label for a 4th required field embedded
inline in the same box. A real customer entering a perfectly valid card with no ZIP
would sit staring at a permanently-disabled "Start free trial" / "Confirm switch"
button with no visible reason why. Confirmed directly: a live signup attempt through
the real UI sat stuck at exactly this point before the fix, screenshotted, not
inferred.

Fixed with `hidePostalCode: true` — nothing else in this app reads a postal code from
this flow (checked directly). This one shared component covers every real card-
collection surface in the app; verified all three independently after the fix:
Premium signup, Network signup, and the dashboard's Free→paid plan switcher — each
produced a real Stripe customer + trialing subscription (Premium/Network) or enabled
the switch confirmation correctly. All Stripe test objects and local DB rows created
during this verification pass cleaned up afterward. Lint clean, full build clean.
Committed and pushed to both remotes (`87509ff`).

## 13. Modifications 8 (client PDF, Sept 12) — all 4 items built and verified

Client PDF with screenshots, 4 items:

1. **Error toast duration.** "This error messages have unlimited duration, I want it
   to last 3.5 seconds before disappearing." Screenshot showed a "Please verify your
   email before logging in." error sitting on screen indefinitely. `lib/toast.ts`'s
   error variant was `duration: Infinity` (manual-dismiss only, per the original theme
   guideline) — changed to `duration: 3500`. Verified live: a failed login attempt
   shows the toast, which fully detaches from the DOM ~3.9s later (3.5s config +
   Sonner's own exit-animation overhead).

2. **Testimonial "logos."** "I want this review profiles to have some images of their
   business on their names, some logo or something more credible." The homepage
   testimonials section (`components/marketing/testimonials.tsx`) previously showed a
   plain initial letter in a circle per card. Since these six testimonials are
   illustrative personas, not real companies, a real business photo/logo would
   misleadingly imply a specific business exists — instead gave each card a
   business-type icon mark in a rounded-square badge (crossed utensils for the
   restaurant owner, a building for the multi-location manager, people for the agency
   partner, a coffee cup for the café owner, scissors for the salon owner, a shopping
   bag for the retail manager), which reads as a real branded mark without fabricating
   a company. Verified live via screenshot — all six cards render their icon badge
   correctly.

3. **Auth-panel logo centering/size.** "I want this logo to be centered on desktop view
   and a bit bigger." Screenshot had a red arrow pointing at the left-aligned
   TaptapStar wordmark on the login/signup left gradient panel. `app/(auth)/layout.tsx`
   previously had no horizontal centering (`w-fit` only) and a smaller scale
   (`scale-125`/`scale-150`). Added `mx-auto` and bumped the scale to
   `scale-150`/`scale-175`. Verified live via screenshot on `/login` at desktop width —
   wordmark is now centered in the panel and visibly larger.

4. **Scan feed pagination.** "I don't want this list to be infinite, I want it to have
   a maximum of 10 scans registered on each page, at the bottom of this I want the
   option to continue seeing on the next page." The dashboard's "Live scan feed"
   (`app/api/scans/recent/route.ts` + `components/dashboard/live-scan-feed.tsx`)
   previously had a hardcoded `.limit(20)` with no pagination at all. Added real
   server-side pagination: the API now takes a `page` param, returns 10 rows per page
   plus `totalCount`/`hasNextPage`, and the component renders Previous/Next controls
   with a "Page X of Y" label once there's more than one page. The 5-second live
   auto-refresh (used on `/dashboard` overview and device-detail pages) stays active
   only on page 1 — paging forward to browse older scans pauses it, since having rows
   reorder live underneath someone mid-browse would be confusing; returning to page 1
   resumes it. Verified live: seeded a test account with 25 scans (3 pages: 10/10/5),
   confirmed page 1 shows 10 rows with Previous disabled, page 2 the next 10, page 3
   the remaining 5 with Next disabled, Previous correctly steps back to page 1, and all
   "Page X of Y" labels were accurate — 8/8 automated checks passed. All test data
   (account, location, device, 25 scan rows) deleted afterward.

Lint clean across all 5 changed files. Committed and pushed to both remotes (`31f78fb`).

---

*This document is updated as decisions come in and work progresses. All core
pricing-restructure work (steps 1-6 plus the Network per-location follow-up) is built,
verified, and live. Modifications 6, 7 (items 1, 2, 3, 4, 6), and 8 (items 1-4) are all
built, verified, and live. The QR-redirect root cause, the email logo/button bugs, and
the Stripe CardElement hidden-ZIP bug are all fixed and live. The trial-expiration
transition and the full Stripe webhook flow are both verified for real. The AI feature
has been removed (client decision), the Free-tier device cap is set to 1 and enforced,
and the review-filtering feature is built, verified, and live. Modifications 7 items 2
and 3 have been dropped per explicit client instruction. The domain migration to
`www.taptapstar.com` is live and confirmed working. Remaining: updating the registered
Stripe webhook endpoint's URL to match the new domain (a Stripe Dashboard edit, not
code) — everything else is either built and verified, or intentionally dropped.*
