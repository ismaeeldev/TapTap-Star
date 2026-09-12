// Modifications 9 (client PDF, item 1): "I want that reviews over the rating that owner selects
// be auto answered using AI." Isolated in its own module so the one real OpenAI API call lives
// in exactly one place — easy to find, easy to swap models, easy to stub in tests.
import { getOpenAiClient } from "@/lib/ai/client";

const MODEL = "gpt-4o-mini";

/**
 * Generates a short, business-owner-voiced reply draft to a piece of customer feedback. Never
 * auto-sent — the caller stores this as a draft (private_feedback.aiReplyDraft) for the business
 * owner to review/edit in the dashboard, since this app has no guaranteed outbound channel back
 * to an anonymous customer (contact info is optional, not required, on the feedback form).
 *
 * Throws on any failure (missing key, API error, empty response) — the caller is responsible for
 * catching this and recording aiReplyStatus: 'failed' rather than silently leaving a stale
 * 'generating' status forever.
 */
export async function generateReviewReply({
  businessName,
  rating,
  comment,
}: {
  businessName: string;
  rating: number;
  comment: string | null;
}): Promise<string> {
  const openai = getOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You draft short, warm, genuine-sounding replies from a small business owner to customer " +
          "feedback. Keep it under 80 words, first person plural (\"we\"), no corporate boilerplate, " +
          "no emojis, no exclamation-point overload. Thank the customer specifically for what they " +
          "mentioned when there's enough detail to reference, and if the rating is on the lower end " +
          "of what's being answered, acknowledge the feedback constructively rather than being " +
          "defensive. Output only the reply text — no preamble, no quotation marks around it.",
      },
      {
        role: "user",
        content:
          `Business: ${businessName}\nRating: ${rating}/5 stars\n` +
          `Customer comment: ${comment?.trim() || "(no written comment, rating only)"}\n\n` +
          "Draft a reply.",
      },
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("OpenAI response contained no text content");
  }
  return reply;
}
