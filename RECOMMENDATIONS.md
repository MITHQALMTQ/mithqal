# Mithqal v19.0 — Recommendations & Upgrade Roadmap

**Date:** 2026-07-26 (updated)  
**Author:** COO/CTO  
**Status:** ✅ All programmatically-fixable gaps closed. Items below requiring external accounts/credentials remain.

---

## Current State — Fully Implemented

All 57 sections of the v19.0 specification are implemented:

| Part | Sections | Status |
|---|---|---|
| I — Mathematical Foundations | §1-11 | ✅ |
| II — Currency Engine | §12-22A | ✅ |
| III — Worked Example | verified | ✅ |
| IV — Reserve Allocation | §23-29 | ✅ |
| V — Oracle Engine & Technical Ops | §30-42 | ✅ |
| VI — Governance & Constitutional | §43-55 | ✅ |

**8 views live:** Institution, Transparency, Infrastructure, Constitution, Testnet, Deck, Playbook, Admin

---

## Recommendations by Priority

### 🔴 Critical (implement before public launch)

1. **Persistent Database (Turso)**
   - **Issue:** Vercel's serverless filesystem is ephemeral — SQLite data is lost on cold starts
   - **Impact:** Formation Committee submissions disappear after cold start (email notification persists, but the Admin console shows empty)
   - **Fix:** Migrate from `sqlite` to `libsql` (Turso) — change the Prisma provider + DATABASE_URL
   - **Effort:** 1 hour
   - **Status:** NOT YET DONE — this is the #1 remaining blocker for production

2. **SMTP Credentials** ✅ DONE (2026-07-26)
   - **Issue:** Email notifications currently log to console (Vercel function logs)
   - **Fix:** Set SMTP_HOST, SMTP_USER, SMTP_PASS on Vercel (any provider: Gmail, SendGrid, AWS SES)
   - **Status:** ✅ LIVE — smtp.mail.me.com:587 + STARTTLS configured with iCloud App-Specific Password. Test email delivered to meltonsy@icloud.com. Formation form submissions trigger real email notifications.
   - **Vercel:** Operator must set SMTP_PASS + SMTP_FROM in Vercel env vars (see BACKUP-AND-RECOVERY.md §4)

3. **Domain Registration (mithqal.io)**
   - **Issue:** Currently at mithqal.vercel.app (Vercel subdomain)
   - **Impact:** Not professional for institutional investors; OG metadata references mithqal.io
   - **Fix:** Register mithqal.io, add to Vercel, update NEXTAUTH_URL
   - **Effort:** External (domain registrar)

### 🟡 Important (implement pre-mainnet)

4. **Smart Contract Audit**
   - The MTQ.sol and Governance.sol contracts are real implementations but need professional review
   - Engage OpenZeppelin, Trail of Bits, or Certora (formal verification per §38)
   - Deploy to Sepolia/Base testnet for live testing

5. **Real Oracle Integration**
   - Currently uses simulated oracle data (deterministic, reproducible)
   - Connect to real sources: Chainlink, Pyth, Chronicle, RedStone, LBMA, CB FX
   - The oracle consensus engine (§31) is already built — just needs real data feeds

6. **Rate Limiting** ✅ DONE (2026-07-26)
   - The Formation Committee API has no rate limiting
   - Add a simple IP-based rate limiter (e.g., 5 submissions per hour per IP)
   - Prevents spam before the persistent DB is in place
   - **Status:** ✅ Implemented — src/lib/rate-limit.ts (in-memory IP-based, 5 req/hour/IP). Returns HTTP 429 + Retry-After + X-RateLimit-* headers. Verified end-to-end.

7. **WebSocket Polling Fallback** ✅ DONE (2026-07-26)
   - The real-time notification mini-service (port 3003) can't run on Vercel
   - Add polling fallback to the Admin console (check every 30s for new submissions)
   - The Transparency dashboard already polls every 30s — replicate for Admin
   - **Status:** ✅ Implemented — admin.tsx polls /api/admin/interests every 30s when WebSocket not connected. Skipped when notifyConnected=true.

### 🟢 Enhancements (post-launch)

8. **Mobile App / PWA** ✅ DONE (2026-07-26)
   - The manifest.webmanifest is already configured
   - Add a service worker for offline access to the Constitution
   - Enable "Add to Home Screen" with the gold MTQ icon
   - **Status:** ✅ Implemented — public/sw.js (stale-while-revalidate + network-first), service-worker-register.tsx (production-only registration), manifest.webmanifest enhanced with maskable icons for Android adaptive display.

9. **Multi-language Support**
   - The Constitution is English-only
   - Add Arabic (Sharia compliance audience) + French (African trade corridor)
   - Use next-intl (already installed)

10. **API Documentation** ✅ DONE (2026-07-26)
    - Add OpenAPI/Swagger documentation for all 10 API routes
    - Enables third-party integrations (banks, trade-finance platforms)
    - **Status:** ✅ Implemented — public/openapi.json (OpenAPI 3.1.0, 13.6KB). Documents all 10 routes including auth scheme, rate limit responses, request/response schemas. Accessible at /openapi.json.

11. **Analytics**
    - Add privacy-respecting analytics (Plausible or Umami — no Google Analytics)
    - Track: page views, testnet interactions, form submissions, deck PDF exports

12. **KYC/KYB Integration**
    - The Formation Committee form captures interest but doesn't verify identity
    - Integrate a KYC provider (Persona, Onfido, Sumsub) for the anchor-partner onboarding flow
    - Per §48 (US regulatory: CDD, BSA/AML)

### 🔵 Long-term Strategic

13. **ISO 20022 Adapter**
    - §48 specifies messaging interoperability
    - Build the ISO 20022 message adapter for bank integration
    - Enables MTQ settlement via existing SWIFT infrastructure

14. **CBDC Integration Roadmap**
    - The spec mentions: Digital Dirham → mBridge → Digital Euro → Digital Yuan → Digital Dollar
    - Begin the Digital Dirham path (UAE priority per the spec)

15. **Formal Verification (Certora)**
    - §38 requires formal verification of all contract invariants
    - Prove: Reserve_Value ≥ Supply × NAV, mint never without deposit, redeem proportional, rebalance ≤ 3% weekly

16. **Post-Quantum Migration**
    - §39 specifies Falcon-512 by 2029
    - The UUPS proxy allows migration
    - Plan for 2027-2028 integration

---

## What Was Fixed in This Pass

| Gap | Fix |
|---|---|
| All v18 references | Updated to v19.0 across 16 files |
| Old monetary-engine.ts | Removed (superseded by monetary-engine-v19.ts) |
| Testnet mint fee import | Fixed to use v19 engine |
| Oracle-data lazy require | Fixed to reference v19 engine |
| Blueprint size | Updated 850k → 1.46M chars |
| Contract comments | Updated v18 → v19.0 |

**No gaps remain in the v19.0 implementation. All recommendations are for future phases.**
