import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy of JOZOUR LLC, operator of the Mithqal testnet.",
};

export default function PrivacyPage() {
  return (
    <>
    <div className="flex-1">
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-fg-muted transition hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
      </Link>
      <h1 className="font-display mt-6 text-3xl text-foreground sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-xs text-fg-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
        MITHQAL is currently operated by JOZOUR LLC during the institutional
        development phase. The constitutional architecture described throughout
        this documentation represents the intended institutional destination of
        the project. Planned entities do not yet exist and are not currently
        operating.
      </div>

      <div className="mt-8 max-w-none space-y-6 text-sm leading-relaxed text-fg-muted">
        <section>
          <h2 className="font-display text-lg text-foreground">1. Controller</h2>
          <p>
            The data controller is <strong>JOZOUR LLC</strong>, a New Jersey
            Limited Liability Company (NJ filing 0600463904, EIN 84-3470275),
            sole member Mohamed S. Eltonsy. For privacy enquiries contact{" "}
            <a href="mailto:operator@mithqal.org" className="text-gold hover:underline">operator@mithqal.org</a>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">2. Data We Collect</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Formation Committee intake:</strong> name, email, organisation, role, and any message you submit via the public intake form.</li>
            <li><strong>Testnet simulator activity:</strong> the wallet address you connect (read-only), simulator mint/redeem amounts, and timestamps. These are stored in our operational database.</li>
            <li><strong>Server logs:</strong> IP address, user agent, request path, and timestamp for every HTTP request. Retained for 30 days for security and abuse prevention.</li>
            <li><strong>Public on-chain data:</strong> any read of Monad Testnet is public and outside our control.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">3. Sub-processors</h2>
          <p>
            We use the following sub-processors. PII you submit may be processed
            by them. We do not sell personal data.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Vercel Inc.</strong> (USA) — web hosting and edge functions.</li>
            <li><strong>Turso / LibSQL</strong> (USA, us-east-1) — operational database for testnet ledger and intake records.</li>
            <li><strong>Google Cloud / Gemini API</strong> — LLM inference for the optional "Mithqal Brain" compliance / risk panels (only invoked when you explicitly submit a compliance inquiry).</li>
            <li><strong>Groq Inc.</strong> — LLM inference (same scope as above).</li>
            <li><strong>Hugging Face Inc.</strong> — LLM inference (same scope as above).</li>
            <li><strong>Apple iCloud Mail</strong> — outbound transactional email (intake acknowledgements, operator alerts).</li>
            <li><strong>Monad Labs</strong> — public testnet RPC node provider; on-chain reads are public.</li>
          </ul>
          <p className="mt-2 text-xs">
            Note: the three LLM sub-processors receive only the free-text
            compliance inquiry you explicitly submit; they do not receive your
            wallet, your testnet ledger, or your server logs.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">4. Lawful Basis (GDPR)</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Consent (Art. 6(1)(a))</strong> — when you submit the intake form or a Brain inquiry.</li>
            <li><strong>Legitimate interest (Art. 6(1)(f))</strong> — server logs for security, fraud prevention, and rate-limiting.</li>
            <li><strong>Legal obligation</strong> — where future regulatory frameworks require record retention.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">5. Retention</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>Formation Committee intake records: retained until you request deletion.</li>
            <li>Testnet simulator ledger: retained for the lifetime of the testnet.</li>
            <li>Server logs: 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">6. Your Rights</h2>
          <p>
            EU/UK/California residents may request access, rectification,
            erasure, restriction, portability, or objection. Email{" "}
            <a href="mailto:operator@mithqal.org" className="text-gold hover:underline">operator@mithqal.org</a>.
            We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">7. International Transfers</h2>
          <p>
            Data may be transferred to the United States (where our
            sub-processors operate). Where required, transfers rely on
            Standard Contractual Clauses or the recipient&apos;s participation in
            an approved certification framework.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">8. Security</h2>
          <p>
            Authentication uses scrypt-hashed credentials. Rate-limiting is
            applied to public endpoints. Database access is scoped to a
            single operator credential. We have not yet completed SOC 2 Type
            II or ISO 27001 certification; see our{" "}
            <Link href="/legal/risk-disclosure" className="text-gold hover:underline">Risk Disclosure</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">9. Changes</h2>
          <p>
            We will update this policy as our sub-processors or practices
            change. Material changes will be announced at the top of this
            page.
          </p>
        </section>
      </div>
    </main>
    </div>
    <SiteFooter />
    </>
  );
}
