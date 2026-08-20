"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { fadeUp } from "@/lib/motion";
import { ContactForm } from "@/app/(marketing)/contact/contact-form";

export function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-6 py-24 md:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15%" }}
        className="text-center"
      >
        <p className="text-caption font-semibold uppercase tracking-wide text-brand">
          Contact us
        </p>
        <h2 className="mt-3 font-display text-display-lg font-bold text-text-primary">
          Questions before you sign up?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-body text-text-secondary">
          Send us a message and we&apos;ll get back to you — or{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            create your account
          </Link>{" "}
          directly, no sales call required.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-15%" }}
        className="mt-10"
      >
        <Card variant="standard" className="p-8">
          <ContactForm />
        </Card>
      </motion.div>
    </section>
  );
}
