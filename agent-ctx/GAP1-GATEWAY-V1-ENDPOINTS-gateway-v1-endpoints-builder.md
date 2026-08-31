# Task: GAP1-GATEWAY-V1-ENDPOINTS
## Agent: Gateway V1 Endpoints Builder

### Context Reviewed
- `/home/z/my-project/worklog.md` (last 50 lines) — prior v25.0 amendment work, 8-endpoint discovery route already shipped, UI dashboards mounted.
- `/home/z/my-project/src/app/api/gateway/v1/route.ts` (316 lines) — existing versioned gateway discovery index listing the 8 (now expanded to 12 with the new amendment endpoints) endpoints via `BANK_GATEWAY_API_ENDPOINTS`.

### Work Done
Created 12 individual API route files under `/home/z/my-project/src/app/api/gateway/v1/`. Each file:
- Imports `NextResponse` from `next/server`.
- Exports an async `GET()` (or `POST()` for instructions / attestation / redemptions).
- Returns JSON with: endpoint, method, description, status="SIMULATED", data (spec-defined shape), requires[] (security flags), honestState, timestamp.
- Sets response header `X-Endpoint-Status: SIMULATED`.
- Wraps body in try/catch with HTTP 500 fallback.

### Files Created (12)
1. `instructions/route.ts` — POST — MTQ settlement instruction
2. `attestation/route.ts` — POST — bank compliance attestation
3. `backing-certificates/route.ts` — GET — list backing certificates
4. `minting-capacity/route.ts` — GET — dynamic minting capacity
5. `reserves/route.ts` — GET — reserve status
6. `rebalancing/route.ts` — GET — rebalancing status
7. `reconciliation/route.ts` — GET — 5-way reconciliation
8. `custody/route.ts` — GET — custody status
9. `proof-of-reserves/route.ts` — GET — latest proof of reserves
10. `redemptions/route.ts` — POST — redemption request
11. `incidents/route.ts` — GET — list active incidents
12. `foundation/oversight/route.ts` — GET — Foundation read-only oversight dashboard

### POST handlers (3)
POST handlers parse JSON body (`req.json().catch(() => ({}))`) and echo back minimal `received` metadata (idempotencyKey / signature presence / corporateReference / mtqAmount). They generate a SIMULATED ID using `crypto.randomUUID()`.

### Verification
- `bun run lint` — exit 0, 0 errors, 0 warnings.
- `curl` smoke tests on 3 endpoints (reserves GET, instructions POST, foundation/oversight GET) — all returned HTTP 200, `X-Endpoint-Status: SIMULATED` header present, body contains `endpoint`, `method`, `description`, `status:"SIMULATED"`, `data`, `requires`, `honestState`, `timestamp`.
- All 12 file paths confirmed via `find src/app/api/gateway/v1 -name route.ts -type f` (count = 13 incl. existing discovery route).

### Honest State Preserved
- banksContracted: 0 (every response)
- integrationState: "INTEGRATION-READY" (every response)
- forcedToPass: false (every response)
- All data values are explicitly SIMULATED (zeroed counts, empty arrays, "SIMULATED" string placeholders where amounts would live).

### No Regressions
- Existing `/api/gateway/v1` discovery route untouched.
- No new packages installed.
- No changes to `public-site.tsx` or any UI component.
