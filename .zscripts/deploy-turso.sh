#!/bin/bash
# =============================================================================
# MITHQAL Deploy → Turso (database)
# =============================================================================
# Pushes the LOCAL Prisma schema to Turso (the durable database).
# Run this only after you've changed prisma/schema.prisma and tested locally.
#
# What this does:
#   1. Shows the current schema vs Turso tables
#   2. Asks for confirmation
#   3. Runs prisma db push (applies schema changes to Turso)
#   4. Verifies the connection
#
# WARNING: db:push can cause data loss if you drop columns/tables.
#          Review schema changes carefully before running this.
# =============================================================================

set -euo pipefail
cd /home/z/my-project

set -a; source .env 2>/dev/null; set +a

export DATABASE_URL="$TURSO_DATABASE_URL"
export DATABASE_AUTH_TOKEN="$TURSO_AUTH_TOKEN"

echo "============================================"
echo "  MITHQAL Deploy → Turso (database)"
echo "============================================"
echo ""
echo "Database: $TURSO_DATABASE_URL"
echo ""

# Show current Turso tables
echo "--- Current Turso tables ---"
bun -e "
import { createClient } from '@libsql/client';
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const r = await c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
for (const row of r.rows) console.log('  -', row.name);
" 2>&1 | grep -v "^\[" || echo "  (could not list tables)"

echo ""
echo "--- Local schema (prisma/schema.prisma) ---"
echo "  Models defined:"
grep -E "^model " prisma/schema.prisma | sed 's/model/  -/' || echo "  (none found)"
echo ""

echo "⚠️  This will apply local schema changes to Turso."
echo "   If you dropped fields/tables, DATA MAY BE LOST."
echo ""
echo "Proceed? [y/N]"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Aborted. Turso unchanged."
    exit 0
fi

echo ""
echo "--- Running: prisma db push (to Turso) ---"
if bunx prisma db push 2>&1; then
    echo ""
    echo "--- Verifying connection ---"
    bun -e "
import { createClient } from '@libsql/client';
const c = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const r = await c.execute('SELECT 1 as ok');
console.log('✅ Turso OK:', r.rows[0].ok === 1 ? 'connected' : 'FAILED');
const t = await c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\");
console.log('   Tables:', t.rows.length);
" 2>&1 | grep -v "^\["
    echo ""
    echo "✅ Turso schema updated successfully."
else
    echo ""
    echo "❌ db push failed. Check schema for errors."
    exit 1
fi
