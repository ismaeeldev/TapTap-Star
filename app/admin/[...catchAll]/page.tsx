import { notFound } from "next/navigation";

// Same catch-all pattern as app/dashboard/[...catchAll] — keeps the admin shell for a bad
// admin link instead of falling through to the marketing 404. See that file's comment for why
// this is needed at all.
export default function AdminCatchAll(): never {
  notFound();
}
