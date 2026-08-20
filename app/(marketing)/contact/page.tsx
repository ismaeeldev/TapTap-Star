import { ContactForm } from "./contact-form";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-bold">Contact us</h1>
      <ContactForm />
    </div>
  );
}
