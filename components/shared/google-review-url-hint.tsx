import { ExternalLink } from "lucide-react";

// Client-requested quick fix (Sept 2026 round): "so how can they know their google review url?"
// The full fix — a Google Places search/autocomplete that derives this automatically — is a real
// scope addition the client deferred ("not interested right now... when some people pay my plans
// we will come back to this point"). This is the no-cost interim fix: a short, concrete hint
// telling a business owner exactly where Google puts this link, right next to the field that
// previously gave no guidance at all beyond a bare URL placeholder.
export function GoogleReviewUrlHint() {
  return (
    <p className="text-caption text-text-muted">
      Find this in your{" "}
      <a
        href="https://support.google.com/business/answer/7035772"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-0.5 text-brand hover:underline"
      >
        Google Business Profile
        <ExternalLink className="size-3" />
      </a>{" "}
      under &ldquo;Ask for reviews,&rdquo; or search your business on Google Maps, click Share,
      and copy the link.
    </p>
  );
}
