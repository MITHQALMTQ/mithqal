#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "============================================"
echo "  §V25.2 INTEGRITY VERIFICATION"
echo "============================================"
ERRORS=0
for f in mtq-final-reserve-spec protected-backing-cell bank-default-resolution legal-liability-framework licensing-entity-matrix three-book-separation systemic-exposure-engine finality-before-mint contradiction-scan implementation-status-report; do
  [ ! -f "src/lib/${f}.ts" ] && echo "  ✗ MISSING: src/lib/${f}.ts" && ERRORS=$((ERRORS + 1))
done
for f in "mtq-os/index.ts" "reserve-simulator/index.ts" "corridor/aed-sgd.ts" "tokenization/index.ts"; do
  [ ! -f "src/lib/${f}" ] && echo "  ✗ MISSING: src/lib/${f}" && ERRORS=$((ERRORS + 1))
done
for ep in mtq-final-reserve mtq-protected-backing-cell mtq-bank-default-resolution mtq-legal-liability-framework mtq-licensing-entity-matrix mtq-three-book-separation mtq-systemic-exposure-engine mtq-finality-before-mint mtq-contradiction-scan mtq-implementation-status mtq-os reserve-simulator corridor tokenization; do
  [ ! -f "src/app/api/${ep}/route.ts" ] && echo "  ✗ MISSING: /api/${ep}/route.ts" && ERRORS=$((ERRORS + 1))
done
grep -q "rrTarget: 1.30" src/lib/calm.ts || { echo "  ✗ calm.ts: rrTarget not 1.30"; ERRORS=$((ERRORS + 1)); }
grep -q "Bullion 18%" src/lib/nav-compute.ts 2>/dev/null || { echo "  ✗ nav-compute.ts: Bullion not 18%"; ERRORS=$((ERRORS + 1)); }
grep -q "L_MAX = 0.20" src/lib/monetary-engine-v19.ts 2>/dev/null || { echo "  ✗ monetary-engine-v19.ts: L_MAX not 0.20"; ERRORS=$((ERRORS + 1)); }
[ -f src/app/page.tsx ] || { echo "  ✗ page.tsx MISSING"; ERRORS=$((ERRORS + 1)); }
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL §V25.2 INTEGRITY CHECKS PASSED (0 errors)"
  exit 0
else
  echo "❌ $ERRORS INTEGRITY ERRORS DETECTED"
  exit 1
fi
