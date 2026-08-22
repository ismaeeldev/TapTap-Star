# Taptapstar — Complete Testing Guide

This guide walks you through testing **every feature** of the app, one at a time, in plain
language. You don't need any technical background — just follow each section top to bottom,
check the boxes as you go, and note anything that doesn't match what's described.

---

## Before you start

**1. Get the app running.**
Ask your developer for the live testing link (or, if running it yourself locally, the link will
look like `http://localhost:xxxx`).

**2. You'll use these two ready-made test accounts** (already set up in the system, no need to
create them):

| Role | Email | Password |
|---|---|---|
| Business owner | `owner@downtowncafe.local` | `DevPassword123!` |
| Taptapstar admin (staff) | `admin@taptapstar.local` | `DevPassword123!` |

**3. A note on emails**: this test environment can only send emails to one specific test inbox,
not your real email address. If a step says "check your email," ask your developer to confirm
the email was sent (they can check the email service's dashboard) rather than expecting it in
your own inbox — this is a testing-environment limitation only, not how it will work for real
customers once launched.

**4. How to report a problem**: for anything that doesn't work as described, note down:
(a) which numbered step you were on, (b) what you expected to happen, (c) what actually
happened. Screenshots help a lot.

---

## Module 1 — Public Website (the part anyone can see, no login needed)

- [ ] **1.1** Open the homepage. You should see: a headline, a short explanation of what
      Taptapstar does, a "How it works" section, a features section, an employee leaderboard
      example, benefits, a pricing card showing one price, example testimonials, FAQ questions,
      and a contact form. Nothing should look broken or cut off.
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
      and a short message, then submit. You should see a confirmation message on screen. (Ask
      your developer to confirm it landed in `/admin/support`'s inbox — see Module 8.)
- [ ] **1.7** Resize your browser window narrow (or open the site on your phone) — check that
      nothing overlaps, no button is cut off or hidden, and the menu collapses into a hamburger
      icon.

---

## Module 2 — Creating an Account (Sign Up)

- [ ] **2.1** Click "Get started" → fill in a business name, a real email you can check, and a
      password. Try a password shorter than 8 characters first — confirm you see a message
      telling you the minimum length **before** you even submit (not just after failing).
- [ ] **2.2** Now use a valid password and submit. You should land on a "check your inbox" page,
      not an error.
- [ ] **2.3** Try signing up again with the exact same email — confirm you get a clear message
      that the email is already registered (not a confusing generic error).
- [ ] **2.4** Ask your developer to confirm the verification email was sent (see the note above
      about the test email inbox), and get you the verification link.
- [ ] **2.5** Click the verification link — you should be logged in automatically and land on
      your new, empty dashboard with a prompt to activate your first device (not a blank page).

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
it for the first time.

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
      shows a small confirmation.
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
      wording, and a subscription status.
- [ ] **7.2** Click **"Manage payment method & invoices"** — confirm it takes you to a real
      Stripe-hosted page (this uses Stripe's test mode right now — use test card
      `4242 4242 4242 4242`, any future expiry date, any 3-digit CVC, to simulate adding a real
      card).
- [ ] **7.3** After adding a card in Stripe's test page, return to the site — confirm the
      billing page reflects the update (not stuck showing old information).
- [ ] **7.4** As the **admin** account (`admin@taptapstar.local`), go to
      **`/admin/billing-settings`** and change the price — confirm it asks you to confirm before
      saving (since this affects every customer), and afterward the new price shows correctly
      on the public pricing page (Module 1.3) and the business owner's billing page.

---

## Module 8 — Agency Accounts (managing multiple businesses)

- [ ] **8.1** As `owner@downtowncafe.local`, go to **Settings** and click **"Request Agency
      Access"** — confirm the page now shows a clear "your request is pending review" message.
- [ ] **8.2** Log in as the **admin** account, go to **`/admin/agency-requests`** — confirm you
      see the pending request, with **Approve** and **Reject** buttons.
- [ ] **8.3** Click **Approve** — confirm a success message appears.
- [ ] **8.4** Log back in as `owner@downtowncafe.local` (or just refresh if already logged in) —
      confirm a new **"Clients"** section now appears in the dashboard navigation, and you can
      create a new client business from there.
- [ ] **8.5** Open one of your created clients — confirm you see a "viewing: [Client Name]"
      banner and can see that client's own devices/employees/analytics, with a clear way to
      exit back to your main agency view.

---

## Module 9 — Internal Admin Panel (staff-only tools)

Log in as `admin@taptapstar.local`.

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
- [ ] **9.6** **`/admin/support`** — confirm you see the contact-form submission from Module
      1.6 in an inbox list, and can mark it as read/resolved.

---

## Module 10 — Notifications (Emails)

Ask your developer to confirm (via the email service's dashboard, since this test environment
can't deliver to arbitrary real inboxes) that an email was triggered for each of these actions
you've already performed above:
- [ ] **10.1** Signing up (Module 2.2) → verification email
- [ ] **10.2** Verifying your email (Module 2.5) → welcome email
- [ ] **10.3** Activating a device (Module 4.5) → activation confirmation to the owner
- [ ] **10.4** Submitting the contact form (Module 1.6) → internal notification to the admin inbox
- [ ] **10.5** Approving/rejecting an agency request (Module 8.3) → confirmation email to the
      requester

---

## Module 11 — General Feel & Polish (do this throughout, not as a separate pass)

While going through every module above, also keep an eye on:
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
anything that didn't match what this guide describes, with the module/step number — that's all
they'll need to find and fix it.
