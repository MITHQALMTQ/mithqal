import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Risk Disclosure",
  description: "Material risks and current limitations of the Mithqal testnet.",
};

export default function RiskDisclosurePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-fg-muted transition hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
      </Link>
      <h1 className="font-display mt-6 text-3xl text-foreground sm:text-4xl">Risk Disclosure</h1>
      <p className="mt-2 text-xs text-fg-muted">Last updated: {new Date().toISOString().slice(0, 10)}</p>

      <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
        MITHQAL is currently operated by JOZOUR LLC during the institutional
        development phase. The constitutional architecture described throughout
        this documentation represents the intended institutional destination of
        the project. Planned entities do not yet exist and are not currently
        operating.
      </div>

      <div className="mt-8 max-w-none space-y-6 text-sm leading-relaxed text-fg-muted">
        <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-amber-200">
          <strong>Plain summary:</strong> Mithqal is at a pre-mainnet,
          pre-audit, pre-licensed stage. The testnet demonstrates a working
          monetary-engine specification; it does not custody value, it has
          not been independently audited, and no MTQ is in mainnet
          circulation. The following disclosures are material.
        </p>

        <section>
          <h2 className="font-display text-lg text-foreground">1. Smart-Contract Risk</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>Contracts are deployed on Monad Testnet only. They have <strong>not</strong> been audited by an independent third party.</li>
            <li>Certora formal-verification <strong>specifications</strong> exist but have <strong>not been executed</strong> (commercial licence pending).</li>
            <li>Foundry fuzz-test <strong>specifications</strong> exist; the Foundry toolchain is not currently installed in CI, so the &quot;69/69 PASS&quot; figure should be treated as unverified pending an independent run.</li>
            <li>The on-chain testnet self-audit was performed by the MITHQAL Formation Committee (the operator). It is a <strong>self-assessment</strong>, not an independent audit.</li>
            <li>The Governance contract&apos;s anti-platform enforcement is currently a stub (`return false`) and must be implemented before mainnet.</li>
            <li>`attestReserves()` allows the minter role to publish a reserve value; on mainnet this must be backed by an independent custodian attestation.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">2. Regulatory Status</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>JOZOUR LLC is a New Jersey LLC (active). EIN assigned.</li>
            <li><strong>FinCEN Form 107 (MSB registration):</strong> preparation in progress; not yet filed. No MSB registration number exists.</li>
            <li><strong>NJ Money Transmitter License:</strong> not held; under evaluation.</li>
            <li>No qualified custody arrangement is in place. The Safe Multi-Sig on Monad Testnet is <strong>not</strong> a qualified custodian under federal or state securities law.</li>
            <li>No KYC/AML/OFAC screening program is in production. The &quot;Mithqal Brain&quot; compliance panel is an LLM-based advisory heuristic, not a sanctions-list or identity-verification product.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">3. Operational Risk</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>A formation team is being assembled. Until the team is seated, a single operator holds all keys and credentials (key-person risk).</li>
            <li>Multi-factor authentication is not yet enforced on the operator account; rate-limiting is in-memory and per-instance on Vercel.</li>
            <li>No Content-Security-Policy header is currently emitted for the public site.</li>
            <li>Operational database is single-region (us-east-1). No cross-region replication.</li>
            <li>No 24/7 incident-response team. No cyber, professional-indemnity, or custody insurance is in force.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">4. Data Risk</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>PII you submit to the optional Mithqal Brain compliance panel is forwarded to up to three third-party LLM providers (Google, Hugging Face, Groq). See <Link href="/legal/privacy" className="text-gold hover:underline">Privacy Policy</Link>.</li>
            <li>A historical iCloud SMTP credential was inadvertently committed to git history. It has been rotated; users should not rely on any cached copy.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">5. Market &amp; Monetary-Engine Risk</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>The currency basket weights are derived from <strong>static</strong> COFER, SWIFT, and BIS reference values, not from live feeds of those sources. Live gold/FX/crypto prices are fetched; currency structural weights are not.</li>
            <li>Historical price references (e.g. gold 12 months ago) used in the momentum / SDP calculations are conservative constants; they are not fetched from a historical price API.</li>
            <li>The dashboard&apos;s &quot;live&quot; reserve-ratio and supply figures currently reflect the <strong>testnet simulator ledger</strong>, not mainnet reserves. No mainnet reserves exist.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">6. Forward-Looking Statements</h2>
          <p>
            Statements about future licensing, audits, custody arrangements,
            Council formation, and mainnet launch are forward-looking and
            subject to change. They are not commitments.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">7. Acknowledgement</h2>
          <p>
            By using this site you acknowledge that you have read and
            understood the risks above. If you do not accept them, do not use
            the site or submit information via the intake form.
          </p>
        </section>
      </div>
    </main>
  );
}
