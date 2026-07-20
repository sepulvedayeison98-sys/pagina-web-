"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Cta from "./Cta";

/** Form de newsletter (client, sin backend). Solo feedback visual. */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-4 text-text-light">
        <Check size={20} className="text-accent" />
        <span className="text-sm">
          ¡Listo! Te escribiremos a <strong>{email}</strong>.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className="flex-1 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm text-text-light placeholder:text-text-light/40 focus:border-accent focus:outline-none"
      />
      <Cta type="submit" variant="primary">
        Suscribirme
      </Cta>
    </form>
  );
}
