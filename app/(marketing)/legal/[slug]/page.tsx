import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Real placeholder legal copy — NOT final legal text. Per 07_TRACEABILITY_MATRIX.md item 13
// (resolved decision): the developer supplies placeholder Terms/Privacy content so the site
// isn't shipping a broken link, and the client swaps in real, lawyer-reviewed copy before
// launch. Both pages say so explicitly and visibly, not just in a code comment, so nobody
// mistakes this for finished legal text.
const PAGES: Record<string, { title: string; updated: string; body: string[] }> = {
  terms: {
    title: "Terms of Service",
    updated: "Placeholder — not yet reviewed by legal counsel",
    body: [
      "This is placeholder content generated during development so the site's footer links resolve to a real page instead of a broken one. It is NOT final legal text and must be replaced with counsel-reviewed Terms of Service before Taptapstar goes live.",
      "In general terms, using Taptapstar means: you're responsible for the accuracy of the business information you provide, your subscription bills at the flat rate shown on your account, devices remain the property of Taptapstar unless otherwise agreed, and you agree not to use the service to manipulate or falsify reviews.",
      "A complete Terms of Service — covering liability, termination, data ownership, and dispute resolution — should be drafted by a licensed attorney before this page is considered final.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "Placeholder — not yet reviewed by legal counsel",
    body: [
      "This is placeholder content generated during development so the site's footer links resolve to a real page instead of a broken one. It is NOT final legal text and must be replaced with counsel-reviewed privacy documentation before Taptapstar goes live.",
      "In general terms, Taptapstar collects: account and business information you provide at signup, scan events (device, location, timestamp, and a hashed — never raw — IP address for fraud prevention), and payment information handled directly by Stripe, not stored on our own servers.",
      "A complete Privacy Policy — covering data retention, third-party processors (Stripe, Resend, Neon, Upstash), user rights/deletion requests, and cookie usage — should be drafted by a licensed attorney before this page is considered final.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  return { title: page ? `${page.title} — Taptapstar` : "Not found — Taptapstar" };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 md:px-8">
      <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-body-sm text-warning">
        {page.updated}. This page is a development placeholder — see below.
      </div>
      <h1 className="mt-8 font-display text-display-lg font-bold text-text-primary">
        {page.title}
      </h1>
      <div className="mt-6 space-y-4 text-body text-text-secondary">
        {page.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}
