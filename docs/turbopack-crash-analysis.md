# MITHQAL Turbopack Crash Analysis

**Document ID:** MITHQAL-TURBOPACK-CRASH
**Status:** DECISION (Correction 6 — FULL-PLATFORM-BUILD)
**Truth state:** WIRED. The crash is reproducible; the root cause is
identified; the fix is documented and applied to the local-dev
workflow.

## 1. Summary

When running `bun run dev` (which resolves to `next dev -p 3000`),
Next.js 16's Turbopack dev-server occasionally crashes during the
first or second compile with an unhandled error rooted in the
`.next/dev/build/postcss.js` file. The crash is non-deterministic in
the sense that it does not reproduce on every cold start, but it
reproduces reliably when the `.next` directory contains a stale
`dev/build/postcss.js` from a previous Turbopack run AND the process
is launched under the Bun runtime (rather than the Node.js runtime).

## 2. Symptom

```
$ bun run dev
[next]   ▲ Next.js 16.1.1
[next]   - Local: http://localhost:3000
[next]   - Network: http://192.168.1.10:3000
[next]
[next]   ✘ {module: '.next/dev/build/postcss.js', code: 'ERR_MODULE_NOT_FOUND'}
[next]   unhandledRejection: TypeError [ERR_MODULE_NOT_FOUND]:
[next]   Cannot find module '/home/z/my-project/.next/dev/build/postcss.js'
[next]   └── at Object.<anonymous> (file:///home/z/my-project/.next/dev/build/postcss.js)
[next]       at Module.load (node:internal/modules/cjs/loader:...)
[next]       ...
[next]   [bun] 💿 process exited with code 1
```

The crash happens after the first successful compile. The dev server
serves the first page load, then dies on the second hot-reload
compile.

## 3. Root cause analysis

### 3.1 The Turbopack `.next/dev/build/postcss.js` file

Next.js 16's Turbopack dev-server compiles the project's PostCSS
configuration (`postcss.config.mjs` + `@tailwindcss/postcss` plugin)
into a CommonJS shim at `.next/dev/build/postcss.js` on the first
run. This shim is loaded by the Turbopack CSS pipeline at the start
of every dev-server boot.

When the dev server is killed (Ctrl-C) mid-compile, the shim file can
be left in a half-written state — the file exists on disk but its
content is truncated or its `require()` calls point to a stale path.

### 3.2 The Bun runtime + Turbopack interaction

Bun (the runtime used by `bun run dev`) implements its own CommonJS
loader. When Bun encounters a `require()` call inside the Turbopack
shim, it resolves the path against its own internal module graph,
NOT against Next.js's runtime. If the shim's `require()` calls
reference a path that does not exist in Bun's graph (because
Turbopack wrote it expecting the Node.js runtime), Bun throws
`ERR_MODULE_NOT_FOUND` synchronously.

Node.js, by contrast, falls back to the on-disk file system for the
same `require()` call and finds the file (or fails more gracefully).

### 3.3 Why the second compile crashes

The first compile uses a fresh Turbopack pipeline (no `.next/dev`
directory exists yet), so Turbopack writes the shim from scratch
and loads it successfully. The shim is now persisted on disk.

The second compile (hot-reload) re-reads the persisted shim. Because
the shim was written by Turbopack under the assumption that the
Node.js runtime will load it, Bun's loader fails on the second read
and the dev server dies.

### 3.4 Why clearing `.next` fixes it

Deleting the `.next` directory removes the stale shim file. The
next cold start writes a fresh shim and the cycle restarts. This is
a workaround, not a fix — the crash will reproduce on the second
hot-reload after every clear.

## 4. Fix

### 4.1 The canonical fix — use the Node.js runtime

The canonical fix is to invoke the Next.js dev server via the
Node.js runtime rather than the Bun runtime. The Bun runtime's
CommonJS loader is incompatible with the Turbopack PostCSS shim;
Node.js is not.

The corrected `dev` script in `package.json` is:

```json
{
  "scripts": {
    "dev": "node node_modules/.bin/next dev -p 3000"
  }
}
```

This invokes the Next.js CLI via Node.js (the `node` binary), not
via Bun's process spawn. The Turbopack pipeline then runs under
Node.js, the PostCSS shim is loaded by Node's CommonJS loader, and
hot-reload works as expected.

### 4.2 The fallback fix — clear `.next` and re-run

If the operator must use `bun run dev` (e.g. the project's `engines`
field has `bun >= 1.1` and Node.js is not installed), the workaround
is to clear `.next` before every cold start:

```bash
rm -rf .next && bun run dev
```

This workaround is fragile (the crash will reproduce on every second
hot-reload) and is NOT recommended for production dev workflows.

### 4.3 The postcss.config.mjs context

The project's PostCSS configuration (`postcss.config.mjs`) is:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

This is the canonical Tailwind CSS v4 configuration and is correct.
The crash is NOT caused by the PostCSS configuration itself; it is
caused by the runtime mismatch (§3.2). The PostCSS shim that
Turbopack generates from this config is the artefact that exposes
the runtime mismatch.

## 5. Prevention

### 5.1 Document the canonical dev workflow

The `DEV-WORKFLOW.md` document MUST be updated to record:

1. The canonical dev command: `node node_modules/.bin/next dev -p 3000`.
2. The Bun-only workaround: `rm -rf .next && bun run dev` (use only
   when Node.js is unavailable).
3. The Turbopack `.next/dev/build/postcss.js` crash is a known issue
   with the Bun runtime; do NOT file a bug against Next.js for it.

### 5.2 CI uses `next build`, not `next dev`

The CI pipeline (`.github/workflows/ci.yml`) uses `bun run build`
(which resolves to `next build`) — `next build` does not use the
Turbopack dev-server and is NOT affected by this crash. The crash
is dev-only.

### 5.3 Update `package.json` `engines` field

The `package.json` `engines` field currently lists both `node >= 20`
and `bun >= 1.1`. The canonical runtime for development is Node.js;
Bun is supported as a package manager only. The `engines` field
should be clarified:

```json
{
  "engines": {
    "node": ">=20"
  },
  "packageManager": "bun@1.1"
}
```

This is a documentation change; it does not affect the build.

## 6. Verification

The fix was verified by:

1. Clearing `.next` and running `node node_modules/.bin/next dev -p 3000`.
2. Loading the home page (`http://localhost:3000`) — first compile
   succeeded.
3. Triggering a hot-reload by editing `src/app/page.tsx` and saving
   — second compile succeeded (no crash).
4. Triggering a third compile by editing
   `src/components/layout/sidebar.tsx` — third compile succeeded.
5. Repeating the test with `bun run dev` (Bun runtime) — the crash
   reproduced on the second hot-reload, confirming the root-cause
   diagnosis.

## 7. References

- `package.json` — `dev` script.
- `postcss.config.mjs` — PostCSS configuration (Tailwind v4).
- `next.config.ts` — Next.js configuration.
- `DEV-WORKFLOW.md` — operator-facing dev workflow document.
- `docs/gap-register.md` §11.6 — gap-register entry for this fix.
