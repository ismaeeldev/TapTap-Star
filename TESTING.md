# Taptapstar — Complete Testing Guide

This guide has two parts. **Part 1** is a plain how-to guide for actually using Taptapstar day to
day — keep this handy after testing is done, it's the same guide you'd hand a new team member.
**Part 2** is a full testing checklist for confirming everything works before launch. You don't
need any technical background for either — just follow along step by step.

---

## Part 1 — How to Use Taptapstar

A quick reference for the things you'll actually do day to day, once your account is set up.

### Logging in

Go to the site and click **Log in** (top right), enter your email and password. Forgot your
password? Click **"Forgot password?"** on that same page and follow the emailed link.

### Activating a new device

This is the core thing Taptapstar does — turning a physical NFC card, plaque, or stand into a
working review-collector.

**Note**: a brand-new account needs a payment method added first (Billing → Manage payment
method & invoices) — there's no free trial, so this is expected, not a bug, if it's your very
first device.

1. Scan the device's NFC tap or QR code with your phone (or open its link directly).
2. Since it's new, you'll land on the **activation wizard** instead of the review page.
3. **Step 1**: pick which of your locations this device is for, or add a new one on the spot
   (name, address, and the Google review link customers should land on).
4. **Step 2** (optional): assign it to a specific employee, so their scans count toward their own
   leaderboard total — or skip this if it's a shared/front-counter device.
5. **Step 3**: review the summary and click **Activate Device**. That's it — from now on, tapping
   or scanning that device sends customers straight to your Google review page.

### Managing locations

**Dashboard → Locations.** Click **Add location** to create one. Click any existing location to
edit its name/address/review link, or delete it (you'll be asked to confirm first — and you'll
need to deactivate or reassign any device still active there before you can delete it).

### Managing employees

**Dashboard → Employees.** This is a live leaderboard, ranked by scan count.

- **Copy a personal link**: click "Copy link" next to anyone's name and send it to them — it's a
  public link, no login needed, showing just their own name, rank, and scan count. This is the
  link employees use to check their own standing.
- **Rename or remove someone**: click the pencil icon to rename, or the trash icon to remove them
  (their past scans and any devices linked to them are kept — removing someone just retires their
  leaderboard entry and disables their personal link).
- **Set a team target**: pick a location, choose weekly or monthly, and enter a scan goal — every
  employee at that location will see a progress bar toward it on their personal link.

### Checking analytics

**Dashboard → Analytics.** Filter by date range, location, or device. Click **Export CSV** or
**Export PDF** to download a copy of the numbers for a report or a meeting.

### Managing billing

**Dashboard → Billing.** Shows your current plan and subscription status. Click **Manage payment
method & invoices** to add/update a card or download past invoices — this opens Stripe's own
secure page, not a form on this site.

### Requesting agency access (managing multiple businesses)

If you manage more than one business, go to **Dashboard → Settings** and click **Request Agency
Access**. Once a Taptapstar admin approves it (you'll get an email), a **Clients** section appears
in your sidebar where you can add and switch between every business you manage from one login.

### Dark mode & getting help

Click the sun/moon icon (top right) anytime to switch themes — it's remembered for next time.
Click the **"?"** icon next to it to replay the short getting-started tour whenever you want a
refresher on where things are.

---

## Part 2 — Testing Checklist

This part walks you through testing **every feature** of the app, one at a time, in plain
language. You don't need any technical background — just follow each section top to bottom,
check the boxes as you go, and note anything that doesn't match what's described.

This checklist is split into two clearly separate sections so you can test each role on its own:

- **Part 2A — Testing as a Business Owner**: everything a normal customer sees and does. Use the
  `owner@downtowncafe.local` login for all of this.
- **Part 2B — Testing as an Admin**: the separate internal staff tool, hidden from every normal
  customer. Use the `admin@taptapstar.local` login for all of this.

A couple of steps genuinely need both roles (e.g. a business owner requests agency access, and an
admin has to approve it) — those are clearly marked with a pointer to the other section, so you
always know exactly which login to use for each step.

**A note on emails**: whether emails actually arrive in your inbox depends on whether a real
email account has been connected yet. If a step says "check your email" and nothing shows up
after a few minutes (check spam too), ask your developer to confirm an email account is
connected — the app will always tell you clearly on-screen whether it thinks the email went out
or not (it never just pretends), so if you see a message like "we couldn't send this email right
now," that's the app being honest, not a bug.

**How to report a problem**: for anything that doesn't work as described, note down: (a) which
numbered step you were on, (b) what you expected to happen, (c) what actually happened.
Screenshots help a lot.

---

## Part 2A — Testing as a Business Owner

Log in at the live site with:

| Email | Password |
|---|---|
| `owner@downtowncafe.local` | `DevPassword123!` |

This is the one dashboard every real customer uses. Their own employees (the people ranked on
the leaderboard) never log into anything themselves — they only get a public, no-login personal
link (see Module 5.5 below).

---

## Module 1 — Public Website (the part anyone can see, no login needed)

- [ ] **1.1** Open the homepage. You should see: a headline, a short explanation of what
      Taptapstar does, a "How it works" section, a features section, an employee leaderboard
      example, benefits, a pricing card showing one price, a "Preview" testimonials section
      (clearly marked as illustrative — there's no real customer reviews to show yet, which is
      expected and intentional, not a bug), FAQ questions, and a contact form. Nothing should
      look broken or cut off.
- [ ] **1.2** Click **"Get started"** anywhere on the page (top navigation bar, or the pricing
      card). It should take you to the **sign-up page** — not a contact form.
- [ ] **1.3** Click **"Pricing"** in the navigation — it should open a dedicated pricing page
      showing the same price as the homepage.
- [ ] **1.4** Click **"FAQ"** in the navigation — confirm it opens a dedicated FAQ page and the
      questions expand/collapse when clicked.
- [ ] **1.5** Scroll to the bottom (footer) — click **"Privacy policy"** and **"Terms of
      service"**. Both should open real pages (currently placeholder text, clearly labeled as
      such — that's expected until final legal copy is provided).
- [ ] **1.6** Fill out the **contact form** at the bottom of the homepage with a fake name/email
      and a short message, then submit. You should see a confirmation message on screen. (An
      admin can confirm it landed in the support inbox — see Part 2B, Module 9.)
- [ ] **1.7** Resize your browser window narrow (or open the site on your phone) — check that
      nothing overlaps, no button is cut off or hidden, and the menu collapses into a hamburger
      icon.

---

## Module 2 — Creating an Account (Sign Up)

- [ ] **2.1** Click "Get started" → fill in a business name, a real email you can check, and a
      password. Try a password shorter than 8 characters first — confirm you see a message
      telling you the minimum length **before** you even submit (not just after failing).
- [ ] **2.2** Now use a valid password and submit. You should land on a "check your inbox" page
      (or, if email isn't connected yet in this environment, an honest "we couldn't send this
      right now" message with a **Resend** button — either is correct, see the email note above).
- [ ] **2.3** Try signing up again with the exact same email — confirm you get a clear message
      that the email is already registered (not a confusing generic error).
- [ ] **2.4** Ask your developer to confirm the verification email was sent (see the note above),
      and get you the verification link.
- [ ] **2.5** Click the verification link — you should be logged in automatically and land on
      your new, empty dashboard with a prompt to activate your first device (not a blank page).
- [ ] **2.6** Click that same verification link a second time — confirm you see a clear "already
      verified — go to login" message, not the same "invalid link" error as a broken link.
- [ ] **2.7** **A brand-new account can't actually use the product yet — this is intentional,
      there's no free trial.** Confirm you see a banner saying something like "Add a payment
      method to activate your account." Try adding a location, an employee, or activating a
      device — every one of these should be blocked with a clear message telling you to add a
      payment method first (never a silent failure, a blank error, or something that just quietly
      doesn't save).
- [ ] **2.8** Go to **Billing** → **Manage payment method & invoices** → in Stripe's test page,
      add the test card `4242 4242 4242 4242` (any future expiry date, any 3-digit CVC). Return to
      the site — within a minute or two (once Stripe's confirmation reaches the app) confirm the
      banner disappears and the account shows **Active**. Once that happens, everything blocked
      in 2.7 should now work normally — this is what the rest of this guide (Module 4 onward)
      assumes, since the built-in `owner@downtowncafe.local` test account is already active.

---

## Module 3 — Logging In / Password Recovery

- [ ] **3.1** Log out (button in the top-right of the dashboard), then log back in with
      `owner@downtowncafe.local` / `DevPassword123!` — you should land on the dashboard.
- [ ] **3.2** Try logging in with the wrong password — confirm you see a clear "incorrect email
      or password" message, not a technical error.
- [ ] **3.3** Go to **"Forgot password?"** on the login page, enter an email, and submit —
      confirm you see a message like "if that email exists, we've sent a reset link" (this is
      intentional — the system never confirms whether an email is or isn't registered, for
      security).
- [ ] **3.4** Try visiting `/dashboard` directly without being logged in — confirm you're
      redirected to the login page, not shown a broken/blank dashboard.

---

## Module 4 — Activating a Device (the core feature)

This simulates what happens when a business owner receives a physical NFC/QR device and scans
it for the first time. The `owner@downtowncafe.local` account is already active/paid, so this
module works normally with it — a brand-new self-signed-up account needs step 2.7/2.8 (add a
payment method) done first, or activation is correctly blocked.

- [ ] **4.1** Ask your developer for an **unclaimed device code** (a code that hasn't been
      activated yet). Visit `yoursite.com/r/{code}` — since it's unclaimed, you should land on
      the **activation wizard**, not a dead page.
- [ ] **4.2** If you're not logged in, the wizard should ask you to log in first — and take you
      right back into the same wizard afterward (it shouldn't lose track of which device you
      were activating).
- [ ] **4.3** Step 1 — pick a location, or click "+ Add new location" and fill in a name,
      address, and a Google review link. Confirm it saves without leaving the wizard.
- [ ] **4.4** Step 2 (optional) — assign an employee, add a new one, or skip this step entirely.
- [ ] **4.5** Step 3 — review the summary and click **"Activate Device"**. You should see a
      short animated success confirmation, then a button to go to your dashboard.
- [ ] **4.6** Now visit that same `/r/{code}` link again — since it's now active, it should
      **instantly redirect you to the Google review page** with no Taptapstar screen shown at
      all. This is exactly what a real customer will experience.
- [ ] **4.7** Ask your developer to confirm a "scan" was logged for that visit (visible in your
      dashboard's analytics/live feed).
- [ ] **4.8** Try visiting a code that doesn't exist at all, e.g. `yoursite.com/r/doesnotexist` —
      confirm you see a friendly "not found" page, never a raw error screen.

---

## Quick guide — testing the dashboard's new look

The dashboard was just given a visual refresh (nicer sidebar, cards, hover effects, and a
built-in "getting started" tour). Here's the fast way to sanity-check it all took effect, in
under 5 minutes, before doing the full Module 5 walkthrough below:

- [ ] **Log in** as `owner@downtowncafe.local` — you land on `/dashboard`.
- [ ] **First-time tour**: on a fresh browser (or after clearing your browser's site data for
      this app), the very first dashboard visit should pop up a short "welcome" tour that walks
      through each sidebar item with a small highlighted card. Click through **Next** a couple of
      times, then click **Skip** — confirm it closes cleanly and doesn't reappear if you refresh
      the page.
- [ ] **Replay the tour**: click the **"?"** icon in the top-right corner (next to the sun/moon
      icon) — confirm it restarts the same tour from the beginning, anytime, not just on first
      visit.
- [ ] **Sidebar**: click through every item (Overview, Devices, Locations, Employees, Analytics,
      Billing, Settings). The item you're currently on should show a small colored bar on its
      left edge and a tinted background — you should always be able to tell which page you're on
      at a glance.
- [ ] **Top-right corner**: confirm you see a small circle with your initials next to your name,
      and a sun/moon icon next to it.
- [ ] **Dark mode**: click the sun/moon icon. The whole dashboard — sidebar, cards, tables, text —
      should flip to a dark background with light text, instantly, with nothing left over in the
      wrong color (no white boxes on a dark page, no unreadable dark-on-dark text). Click it again
      to flip back. Try this on 2-3 different pages (Overview, Analytics, Devices), not just one.
- [ ] **Analytics page**: the date/location/device filters should sit inside one clean bordered
      panel at the top (not loose controls scattered across the page), and the 4 number cards
      below should each sit in their own card that gently lifts (a soft shadow) when you hover
      your mouse over it.
- [ ] **Devices / Locations pages**: hover over a row — it should visibly highlight before you
      click it, so it's clear it's clickable.
- [ ] **Resize your browser narrow** (or check on your phone) — the sidebar should collapse into a
      horizontal scrollable bar at the top, nothing should overlap or get cut off.
- [ ] Nothing above should require a page refresh to look right, and no page should ever show a
      blank white screen or a raw error while loading — see Module 11 for the general loading/
      toast/error checklist that still applies everywhere in the dashboard.

If all of the above look right, the redesign is working as intended — the rest of Module 5 below
tests the dashboard's actual features (not just its look).

---

## Module 5 — Dashboard: Devices, Locations, Employees

Log in as `owner@downtowncafe.local`.

- [ ] **5.1** **Dashboard home** — confirm you see an overview with key numbers (total scans,
      etc.) and a live activity feed, not a blank page.
- [ ] **5.2** **Devices page** — confirm you see a list/table of devices with their status.
      Click into one device — confirm you can reassign it to a different location, and
      deactivate it (with a confirmation prompt first, since that's a meaningful action).
- [ ] **5.3** **Locations page** — add a new location, edit an existing one, and confirm the
      changes save correctly and show a success message.
- [ ] **5.4** **Employees page** — confirm you see a ranked leaderboard of employees by scan
      count. Click **"copy personal link"** next to an employee — confirm it copies a link and
      shows a small confirmation. Then try the small pencil icon to **rename** an employee, and
      the trash icon to **remove** one (with a confirmation prompt first) — both should save
      instantly and update the list without needing a page refresh.
- [ ] **5.5** Open that copied employee link in a **private/incognito browser window** (so
      you're not logged in) — confirm it shows that employee's name, rank, and scan count
      without asking for any login. This is a public, shareable link by design.
- [ ] **5.6** Try a made-up employee link, e.g. `yoursite.com/e/fake123` — confirm you see a
      "link not valid" message, not a crash.
- [ ] **5.7** On the Employees page, set a **team target** (e.g. "500 scans this month") for a
      location — confirm the employee's personal link (5.5) now shows a progress bar toward
      that goal.

---

## Module 6 — Analytics & Reports

- [ ] **6.1** Open **Analytics** — confirm you see summary numbers, a chart of scans over time,
      and filters (date range, location, device).
- [ ] **6.2** Change the date range to a period with no activity — confirm you see a clear "no
      activity in this period" message, not a blank chart or an error.
- [ ] **6.3** Click **"Export CSV"** and **"Export PDF"** — confirm both downloads work and the
      numbers in the file match what's shown on screen.

---

## Module 7 — Billing & Subscription

- [ ] **7.1** Open **Billing** — confirm you see the current plan price, unlimited-usage
      wording, and a subscription status. If instead you see "Billing isn't fully set up on this
      account yet," that's a real signal worth flagging to your developer (it means something
      went wrong connecting this account to Stripe when it was created) — it's not something to
      just click past.
- [ ] **7.2** Click **"Manage payment method & invoices"** — confirm it takes you to a real
      Stripe-hosted page (this uses Stripe's test mode right now — use test card
      `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC, to simulate adding a real
      card).
- [ ] **7.3** After adding a card in Stripe's test page, return to the site — confirm the
      billing page reflects the update (not stuck showing old information).
- [ ] **7.4** Changing the price itself is an **admin** action — see Part 2B, Module 9, step 9.7.
      Once an admin does that, come back here and confirm the new price shows correctly on the
      public pricing page (Module 1.3) and on this billing page.

---

## Module 8 — Agency Accounts (managing multiple businesses)

- [ ] **8.1** As `owner@downtowncafe.local`, go to **Settings** and click **"Request Agency
      Access"** — confirm the page now shows a clear "your request is pending review" message.
- [ ] **8.2** Approving the request is an **admin** action — see Part 2B, Module 9, step 9.8. Once
      an admin approves it, come back here.
- [ ] **8.3** Log back in as `owner@downtowncafe.local` (or just refresh if already logged in) —
      confirm a new **"Clients"** section now appears in the dashboard navigation, and you can
      create a new client business from there.
- [ ] **8.4** Open one of your created clients — confirm you see a "viewing: [Client Name]"
      banner and can see that client's own devices/employees/analytics, with a clear way to
      exit back to your main agency view.

---

## Module 10 — Notifications (Emails) — the business-owner side

Check the inbox of whichever email account is connected for this environment (ask your developer
which one, if you're not sure) to confirm an email arrived for each of these actions you've
already performed above. If nothing arrives for any of them, ask your developer to check that an
email account is properly connected — see the note at the top of Part 2.
- [ ] **10.1** Signing up (Module 2.2) → verification email
- [ ] **10.2** Verifying your email (Module 2.5) → welcome email
- [ ] **10.3** Activating a device (Module 4.5) → activation confirmation to the owner
- [ ] **10.4** Submitting the contact form (Module 1.6) → internal notification to the admin inbox

(One more notification — the agency-approval confirmation email — is checked in Part 2B, since it
only fires once an admin approves the request.)

---

## Part 2B — Testing as an Admin

Log in at the live site with:

| Email | Password |
|---|---|
| `admin@taptapstar.local` | `DevPassword123!` |

This is the separate internal staff tool — completely hidden from every normal business account,
used only by your own team to manage the whole platform.

---

## Module 9 — Internal Admin Panel (staff-only tools)

- [ ] **9.1** Confirm a normal business account (`owner@downtowncafe.local`) **cannot** reach any
      `/admin/...` page — trying should redirect them away, not show admin content.
- [ ] **9.2** **`/admin/devices/batch-create`** — generate 5 new device codes, confirm a
      downloadable file is produced with working links.
- [ ] **9.3** On the same page, switch to **import mode** and paste/upload a small test list of
      codes — confirm it reports how many were imported vs. skipped as duplicates.
- [ ] **9.4** **`/admin/accounts`** — search for an account by name/email, confirm results
      filter correctly, and a "no matches" message with a way to clear the search appears if
      nothing matches.
- [ ] **9.5** **`/admin/devices`** — search/filter the full device list by status and code.
- [ ] **9.6** **`/admin/support`** — confirm you see the contact-form submission from Part 2A's
      step 1.6 in an inbox list, and can mark it as read/resolved.
- [ ] **9.7** **`/admin/billing-settings`** — change the price. Confirm it asks you to confirm
      before saving (since this affects every customer). This is the other half of Part 2A's
      step 7.4 — go back and check it there once you're done here.
- [ ] **9.8** **`/admin/agency-requests`** — confirm you see the pending request from Part 2A's
      step 8.1, with **Approve** and **Reject** buttons. Click **Approve** — confirm a success
      message appears. This is the other half of Part 2A's step 8.2 — go back and continue from
      8.3 once you're done here.

---

## Module 10B — Notifications (Emails) — the admin side

- [ ] **10.5** Approving the agency request (step 9.8 above) → confirmation email to the business
      owner who requested it.

---

## Module 11 — General Feel & Polish (do this throughout both parts, not as a separate pass)

While going through every module above — in both Part 2A and Part 2B — also keep an eye on:
- [ ] Every button you click gives some kind of immediate response (a loading state, a message,
      or a page change) — nothing should feel "dead" or leave you wondering if it worked.
- [ ] Pages that are loading show a skeleton/placeholder layout, never a blank white screen.
- [ ] Error messages are in plain English, never a raw technical error dump.
- [ ] The site looks and works the same in both light and dark mode (try the theme toggle in the
      top corner).
- [ ] Nothing looks broken on a narrow (phone-width) screen.

---

## When you're done

If every box above is checked with no surprises, the application is working as designed and
ready for the next stage (real payment setup and going live). Send your developer the list of
anything that didn't match what this guide describes, with the module/step number and whether it
was in Part 2A or 2B — that's all they'll need to find and fix it.
