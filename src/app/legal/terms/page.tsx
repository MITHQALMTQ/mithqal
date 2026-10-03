import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Mithqal testnet website and simulator.",
};

export default function TermsPage() {
  return (
    <>
    <div className="flex-1">
    <main className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-fg-muted transition hover:text-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Mithqal
      </Link>
      <h1 className="font-display mt-6 text-3xl text-foreground sm:text-4xl">Terms of Service</h1>
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
          <h2 className="font-display text-lg text-foreground">1. Operator</h2>
          <p>
            This website is operated by <strong>JOZOUR LLC</strong>, a New
            Jersey Limited Liability Company (NJ filing 0600463904). The
            &quot;Mithqal Institution&quot; is a constitutional concept
            described in the Mithqal Constitution v19.0.3; it is not itself a
            separately incorporated legal entity at this time.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">2. Testnet Only</h2>
          <p>
            All smart-contract interactions on this site occur on the
            <strong> Monad Testnet</strong> (Chain ID 10143). Testnet tokens
            have no monetary value. The MTQ token does not exist on any
            mainnet. No real funds, reserves, or custodied assets are
            involved. Any &quot;mint&quot;, &quot;redeem&quot;, or
            &quot;transfer&quot; you perform is a <strong>simulation</strong>{" "}
            recorded in our operational database for the purpose of
            validating the protocol design.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">3. No Solicitation</h2>
          <p>
            Nothing on this site constitutes an offer to sell, or a
            solicitation of an offer to buy, any security, token, or
            financial instrument. The Mithqal Constitution constitutionally
            prohibits a token sale. Expressions of interest submitted via the
            Formation Committee intake are <strong>not</strong> commitments
            and do not create any obligation on either party.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">4. No Advice</h2>
          <p>
            Content on this site is informational and does not constitute
            financial, legal, tax, or investment advice. You should consult
            qualified advisers before making any decision based on this
            material.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">5. Acceptable Use</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>You will not attempt to disrupt, overload, or reverse-engineer the service.</li>
            <li>You will not submit content that is unlawful, infringing, or harmful.</li>
            <li>You will not attempt to access data belonging to other users.</li>
            <li>Automated scraping of the public API is permitted at a reasonable rate; abusive rates will be throttled.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">6. Intellectual Property</h2>
          <p>
            The Mithqal name, logo, MTQ token, and the Mithqal Constitution
            are intellectual property of JOZOUR LLC. Source code is published
            on GitHub under the licence stated in the repository.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">7. Disclaimer of Warranties</h2>
          <p>
            The site and the testnet contracts are provided &quot;as is&quot;
            without warranty of any kind, express or implied, including
            without limitation warranties of merchantability, fitness for a
            particular purpose, or non-infringement. Smart contracts have not
            been independently audited; see our{" "}
            <Link href="/legal/risk-disclosure" className="text-gold hover:underline">Risk Disclosure</Link>.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, JOZOUR LLC shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits or revenues, arising
            from your use of the site or the testnet contracts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">9. Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of New Jersey,
            United States of America, without regard to conflict-of-laws
            principles.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-foreground">10. Changes</h2>
          <p>
            We may update these terms as the project matures. Material
            changes will be announced at the top of this page.
          </p>
        </section>
      </div>
    </main>
    </div>
    <SiteFooter />
    </>
  );
}
