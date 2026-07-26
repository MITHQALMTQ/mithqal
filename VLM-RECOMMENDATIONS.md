# Mithqal — VLM Page Audit + Recommendations (Target: 9.5/10)

**Date:** 26 July 2026
**Auditor:** VLM (glm-5v-turbo) + COO/CTO analysis
**Method:** Screenshot each of the 11 views → VLM evaluation → score + top improvements

---

## Current VLM Scores

| # | View | Score | Status |
|---|------|-------|--------|
| 1 | Institution | 6.5/10 | ⚠️ Needs work |
| 2 | Transparency | 7.5/10 | ✅ Recently rebuilt (was 6.0) |
| 3 | Engine | 7.5/10 | ✅ Recently built |
| 4 | Infrastructure | 7.5/10 | ⚠️ Static |
| 5 | Constitution | 7.5/10 | ⚠️ Static |
| 6 | Testnet | 7.5/10 | ✅ Functional |
| 7 | OS (Operating System) | 6.5/10 | ⚠️ Needs polish |
| 8 | Audit | 7.5/10 | ✅ Comprehensive |
| 9 | Deck | 7.5/10 | ✅ Investor-ready |
| 10 | Playbook | 7.5/10 | ⚠️ Text-heavy |
| 11 | Admin | 6.0/10 | ⚠️ Needs security UI |
| | **Average** | **7.2/10** | **Target: 9.5/10** |

---

## Common Themes (VLM flagged these across multiple pages)

### 1. "Live Data Pulse" Missing (flagged on 8/11 pages)
**Problem:** Pages feel static. Institutional dashboards (Bloomberg, Circle, Tether) show live ticking numbers, real-time refresh indicators, and ± delta arrows.

**Fix (apply to ALL pages):**
- Add a global "Live" pulse indicator in the header (green dot + "Live" text)
- Add count-up animations on all KPI numbers (AnimatedNumber component — already built)
- Add ± delta arrows (green up / red down) comparing to previous reading
- Add "Last updated: 2s ago" timestamps on all data cards
- Show realistic variance (not perfect round numbers — e.g., $49,987,321.42 not $50,000,000)

### 2. "Interactive Depth" Missing (flagged on 7/11 pages)
**Problem:** Pages are readable but not interactive. Users expect to click → drill down → see details.

**Fix:**
- Make every card clickable → opens a detail modal/panel
- Add hover states with tooltips on all metrics
- Add "Expand" / "Collapse" toggles on long sections
- Add a global search/command palette (Cmd+K)

### 3. "Real-Time Verification" Missing (flagged on 6/11 pages)
**Problem:** No visible proof of on-chain state. Institutional users need to verify claims instantly.

**Fix:**
- Add "Verify on Chain" buttons linking to MonadScan
- Show the last block number + timestamp
- Display the PoR (Proof of Reserves) hash prominently
- Add a "Last on-chain test: 9/9 PASS" badge

### 4. WCAG Accessibility (flagged on 5/11 pages)
**Problem:** Light grey text (#9ca3af) on dark background fails WCAG AA contrast.

**Fix:**
- Bump body text from `text-fg-muted` to `text-fg` (brighter)
- Ensure all interactive elements have `:focus-visible` styles
- Add `aria-label` to all icon-only buttons
- Test with a screen reader

---

## Page-Specific Recommendations

### 1. Institution (6.5 → 9.5)
- **Add "Live Reserve Status" widget** in the hero — show current supply, NAV, reserve ratio as live counters (not static text)
- **Add animated formation progress bar** — show the Phase 0 timeline as an animated horizontal progress bar with completed milestones
- **Add a "Recent Activity" ticker** — last 5 Formation Committee submissions (anonymous: "Investor from UAE joined 2h ago")
- **Add social proof** — "Built on Monad" + "Audited by Foundry (69 tests)" badges

### 2. Transparency (7.5 → 9.5)
- **Add a real-time NAV ticker** at the top — animated number that updates every 30s
- **Add a "Reserve Health" gauge** — semicircular gauge showing reserve ratio (100%+ = green, <100% = red)
- **Add ± delta on gold price** — "Gold: $4,053.70 ▲ +0.12% (24h)"
- **Add a "Methodology" expandable** — show the exact formulas (NAV = R_m / S, RR = R_a / (S × NAV))

### 3. Engine (7.5 → 9.5)
- **Add a "Try a Scenario" CTA** above the fold —引导 users to the interactive simulator
- **Add animated step-by-step** when the shock slider moves — show numbers changing in real-time with count-up
- **Add a "Compare Scenarios" feature** — let users save 2 scenarios and see them side-by-side
- **Add a "Share this scenario" button** — generates a URL with the slider state encoded

### 4. Infrastructure (7.5 → 9.5)
- **Add an interactive "Architecture Map"** — node-graph showing how the 21 invariants connect to each other
- **Make the 26 constants clickable** — click → see the constitutional basis + modification rules
- **Add a "Stress Test Simulator"** — pick a stress scenario → see which invariants activate
- **Add search/filter** on the invariant list

### 5. Constitution (7.5 → 9.5)
- **Add machine-readable legal citations** — `Art.XII.3.b` anchors that link directly to the section
- **Add a "Compare Versions" feature** — diff v18 vs v19.0 to show what changed
- **Add a "Propose Amendment" flow** (mock) — show the 7-day public window + supermajority requirement
- **Add a table of contents sidebar** that highlights the current section as you scroll

### 6. Testnet (7.5 → 9.5)
- **Add a "Drill-Down" on each operation** — click a mint → see the full transaction details + block explorer link
- **Add a "Mint Flow" walkthrough** — animated 6-step visualization of what happens when you mint
- **Add a "Reserve Tier Breakdown" pie chart** — show the 4 tiers (Tier 1: 60%, Tier 2: 25%, etc.)
- **Add a "Your Balance" widget** — if MetaMask connected, show the user's MTQ balance prominently

### 7. OS (6.5 → 9.5)
- **Add real-time data visualization** — live charts (supply over time, NAV history, reserve ratio trend)
- **Add a "Transaction Feed"** — real-time stream of new transactions as they're recorded
- **Add a "Wallet Health" indicator** — show if MetaMask is connected + on the right network
- **Add "Quick Actions" floating bar** — Mint / Redeem / Transfer always accessible

### 8. Audit (7.5 → 9.5)
- **Add a "Live Compliance Status" dashboard** — real-time checklist showing which findings are resolved
- **Add a "Risk Heat Map"** — visual grid showing severity × likelihood for each finding
- **Add a "Remediation Progress" bar** — show % of findings resolved
- **Add a "Download Audit Report" button** — generates a PDF of the full audit

### 9. Deck (7.5 → 9.5)
- **Add a "Live Protocol State" widget** on slide 1 — show current supply, NAV, reserve ratio
- **Add slide transitions** — smooth horizontal scroll-snap between slides
- **Add a "Download Deck as PDF" button**
- **Add presenter notes** — expandable section under each slide

### 10. Playbook (7.5 → 9.5)
- **Add a "Executive Summary" dashboard** at the top — real-time status of all phases
- **Add a Gantt chart** — visual timeline of Phase 0 → Phase 3 with milestones
- **Add progress indicators** on each task (Not Started / In Progress / Done)
- **Add a "Responsibility Matrix"** — who owns each task

### 11. Admin (6.0 → 9.5)
- **Add institutional-grade security UI:**
  - MFA/2FA toggle indicator
  - Hardware key (YubiKey) support badge
  - Session integrity meter (time remaining, IP, device)
  - "Last login: 2h ago from 1.2.3.4" display
- **Add real-time system status** — Turso DB status, SMTP status, on-chain test status
- **Add a "Notifications" bell** — live count of new submissions + SMTP delivery confirmations
- **Add bulk actions** — select multiple submissions → export CSV / mark as contacted

---

## Priority Matrix

| Priority | Action | Pages Affected | Effort | Score Impact |
|----------|--------|----------------|--------|--------------|
| 🔴 P0 | Add "Live Data Pulse" (animated numbers + timestamps + deltas) | ALL 11 | Medium | +1.0 avg |
| 🔴 P0 | Add "Verify on Chain" buttons + PoR hash | Institution, Transparency, Testnet, OS, Audit | Low | +0.5 each |
| 🔴 P0 | Fix WCAG contrast (brighter text) | ALL 11 | Low | +0.3 avg |
| 🟡 P1 | Add interactive drill-downs (clickable cards → detail modals) | Institution, Infrastructure, Constitution, Testnet, OS | Medium | +0.5 each |
| 🟡 P1 | Add real-time charts (supply, NAV, reserve ratio over time) | Transparency, OS, Testnet | Medium | +0.7 each |
| 🟡 P1 | Add Admin security UI (2FA, session, hardware key) | Admin | High | +1.5 |
| 🟢 P2 | Add search/command palette (Cmd+K) | ALL | Medium | +0.3 avg |
| 🟢 P2 | Add Gantt chart + progress indicators | Playbook | Medium | +0.8 |
| 🟢 P2 | Add "Download as PDF" for deck + audit | Deck, Audit | Low | +0.3 each |
| 🟢 P2 | Add slide transitions + presenter notes | Deck | Low | +0.5 |

---

## Estimated Score After All Fixes

| Page | Current | After P0 | After P0+P1 | After All |
|------|---------|----------|-------------|-----------|
| Institution | 6.5 | 8.0 | 9.0 | 9.5 |
| Transparency | 7.5 | 8.5 | 9.2 | 9.5 |
| Engine | 7.5 | 8.5 | 9.2 | 9.5 |
| Infrastructure | 7.5 | 8.0 | 9.0 | 9.5 |
| Constitution | 7.5 | 8.0 | 9.0 | 9.5 |
| Testnet | 7.5 | 8.5 | 9.2 | 9.5 |
| OS | 6.5 | 7.5 | 8.5 | 9.5 |
| Audit | 7.5 | 8.0 | 9.0 | 9.5 |
| Deck | 7.5 | 8.0 | 9.0 | 9.5 |
| Playbook | 7.5 | 8.0 | 9.0 | 9.5 |
| Admin | 6.0 | 7.0 | 8.5 | 9.5 |
| **Average** | **7.2** | **8.2** | **9.1** | **9.5** |

---

## Quick Wins (can implement in 1 session)

1. **Global "Live" pulse indicator** in the header (green dot + "Live" text) — 15 min
2. **AnimatedNumber on all KPIs** (component already built, just needs wiring) — 30 min
3. **± Delta arrows** on gold price + NAV + reserve ratio — 20 min
4. **"Last updated: Xs ago"** timestamps on all data cards — 20 min
5. **"Verify on Chain" buttons** linking to MonadScan — 15 min
6. **WCAG contrast fix** (text-fg-muted → text-fg) — 10 min
7. **"9/9 PASS" badge** in the header — 10 min

**Total: ~2 hours for +1.0 average score improvement**

---

## Strategic Note (COO/CTO perspective)

The VLM consistently flags the same pattern: **"looks premium but feels static."** The fix is not more content — it's more **life**. Institutional users (sovereign wealth funds, central banks, large trade-finance desks) expect to see numbers moving. They expect to see "last updated 2 seconds ago." They expect to click and drill down.

The Mithqal aesthetic is already world-class (8-9/10 on visual polish). The gap is in **dynamic feedback**. If you implement just the P0 items (live data pulse + verify on chain + WCAG), the average jumps from 7.2 → 8.2. That's the single highest-ROI work you can do.

The P1 items (interactive drill-downs + real-time charts + admin security) take it to 9.1. The P2 items (search palette, Gantt, PDF downloads) get to 9.5.
