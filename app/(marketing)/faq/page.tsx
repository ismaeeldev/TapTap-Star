import type { Metadata } from "next";
import { FaqAccordion } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "FAQ — Taptapstar",
  description: "Answers to common questions about pricing, devices, and how Taptapstar works.",
};

// Standalone route reusing the same FaqAccordion component as the homepage FAQ section.
export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:px-8">
      <div className="text-center">
        <h1 className="font-display text-display-lg font-bold text-text-primary">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-body-lg text-text-secondary">
          Everything you need to know before getting started.
        </p>
      </div>
      <div className="mt-14">
        <FaqAccordion />
      </div>
    </div>
  );
}
