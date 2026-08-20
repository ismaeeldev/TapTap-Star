import type { Metadata } from "next";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { Card } from "@/components/ui/card";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Taptapstar",
  description: "Get in touch to get started with Taptapstar for your business.",
};

export default function ContactPage() {
  return (
    <GradientMesh className="pt-32 pb-24">
      <div className="mx-auto max-w-2xl px-6 md:px-8">
        <div className="text-center">
          <h1 className="font-display text-display-lg font-bold text-text-primary">
            Get in touch
          </h1>
          <p className="mt-4 text-body-lg text-text-secondary">
            Tell us about your business and we&apos;ll get back to you with next steps.
          </p>
        </div>
        <Card variant="glass" className="mt-10 p-8">
          <ContactForm />
        </Card>
      </div>
    </GradientMesh>
  );
}
