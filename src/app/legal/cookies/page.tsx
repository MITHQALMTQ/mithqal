import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How the Mithqal testnet site uses cookies and local storage.",
};

export default function CookiesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-fg-muted transition hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
      </Link>
      <h1 className="font-display mt-6 text-3xl text-foreground sm:text-4xl">Cookie Policy</h1>
      <p className="mt-2 text-xs text-fg-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="mt-8 max-w-none space-y-6 text-sm leading-relaxed text-fg-muted">
        <section>
          <h2 className="font-display text-lg text-foreground">1. Cookies</h2>
          <p>
            This site uses a minimal set of cookies required for
            authentication and session continuity. We do not use
            advertising or third-party tracking cookies.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li><code className="text-gold">next-auth.session-token</code> — issued only after an operator signs in. HttpOnly, SameSite=Lax. Deleted on sign-out.</li>
            <li><code className="text-gold">__Secure-next-auth.callback-url</code> — callback URL for the auth flow.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">2. Local Storage</h2>
          <p>
            We use <code className="text-gold">localStorage</code> for UI
            preferences only — never for tracking:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li><code className="text-gold">mithqal.view</code> — the currently selected view (Institution / Transparency / etc.).</li>
            <li><code className="text-gold">mithqal.theme</code> — light/dark preference.</li>
            <li><code className="text-gold">mithqal.locale</code> — language preference (en / ar / fr).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">3. Analytics</h2>
          <p>
            We do not currently run a third-party analytics service. Server
            logs (IP, user agent, path, timestamp) are retained for 30 days
            for security and capacity planning.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">4. Managing Cookies</h2>
          <p>
            You can clear cookies and local storage from your browser
            settings at any time. Authentication cookies will be removed on
            sign-out; UI-preference storage will persist until you clear it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">5. Contact</h2>
          <p>
            Questions:{" "}
            <a href="mailto:operator@mithqal.org" className="text-gold hover:underline">operator@mithqal.org</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
