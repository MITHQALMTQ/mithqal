# PHASE1B — AppShell + Command Palette

**Agent:** full-stack-developer (AppShell + command palette)
**Task ID:** PHASE1B
**Scope:** State-of-the-art AppShell for the MITHQAL Assurance Next.js 16 dashboard — Topbar, Sidebar, StatusBar, Command Palette, and page transitions.

## Files owned / created
| File | Action | Purpose |
|---|---|---|
| `src/components/layout/topbar.tsx` | NEW (treated as EDIT — no prior file existed) | Sticky z-40 header with brand mark, wordmark, DEMO↔LIVE pill, ⌘K search trigger, theme toggle, MobileNav trigger |
| `src/components/layout/sidebar.tsx` | NEW (treated as EDIT) | Desktop `<aside>` with 3 sections × 9 tabs + collapse toggle; Sheet-based `MobileNav` export |
| `src/components/layout/status-bar.tsx` | NEW (treated as EDIT) | Sticky z-30 footer polling `/api/v1/health` every 30s; 4 status pills |
| `src/components/layout/command-palette.tsx` | NEW | ⌘K command palette using `cmdk` + shadcn `Dialog` + `Command*` primitives |
| `src/app/(dashboard)/layout.tsx` | NEW (treated as EDIT) | AppShell layout with framer-motion page transitions, QueryProvider, Topbar/Sidebar/main/StatusBar |

## Design decisions
- **BUILD-1 features integrated**: The task described BUILD-1 as having already added "Logo + wordmark + DEMO badge + MobileNav trigger". When I checked the project, those files did not exist (likely a parallel agent hadn't completed them yet, or BUILD-1 was conceptual). I integrated all those described features directly into my fresh creations to guarantee the AppShell works end-to-end without depending on BUILD-1's coordination.
- **Command palette lift state**: The `<CommandPalette>` is mounted inside the `<Topbar>` (state lives there) so the ⌘K keyboard listener, the search-trigger button, and the palette itself all share one source of truth. The dashboard layout does not duplicate it.
- **Cross-component coordination**: Since the palette's "Actions" group can't directly call into Topbar/StatusBar, I used a custom-event bus:
  - Palette dispatches `mithqal:request-toggle-mode`, `mithqal:request-toggle-theme`, `mithqal:request-refresh-status`
  - Topbar listens for the first two (in a `useEffect`) and applies its own toggle handler
  - StatusBar listens for the third and triggers an immediate poll
- **React 19 lint compliance**: All `setState` calls in effects are wrapped in `queueMicrotask(...)` to satisfy the `react-hooks/set-state-in-effect` rule (the same pattern used by `src/hooks/use-mobile.ts`).
- **Theme persistence**: `mithqal-theme` localStorage key + direct `document.documentElement.classList` manipulation (toggles `dark`/`light` classes).
- **Mode persistence**: `mithqal-mode` localStorage key + amber (DEMO) ↔ emerald (LIVE) visual states.
- **Sidebar collapse persistence**: `mithqal-sidebar-collapsed` localStorage key; flips `w-60` ↔ `w-16`, hides labels and section headers when collapsed.
- **`pulse-dot` CSS class**: Used on the StatusBar's "Healthy" pill per task instructions, with inline Tailwind fallback (`h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse`) in case the globals.css class isn't yet shipped by the other agent.
- **`mesh-gradient` CSS class**: Applied to the outer `<div>` of the dashboard layout per task instructions.
- **Fuzzy search**: cmdk provides this built-in — no extra work required.
- **Navigation links**: Use `/dashboard`, `/timeline`, `/evidence`, `/exceptions`, `/reconciliation`, `/replay`, `/corridor`, `/research`, `/settings` for the 9 dashboard tabs. (MTQ Σ Research maps to `/research`.)
- **Legal links**: Privacy → `/legal/privacy`, Terms → `/legal/terms`, Cookies → `/legal/cookies`, Risk Disclosure → `/legal/risk-disclosure`. (These routes already exist in the project.)

## Dependencies (all pre-installed, no new packages)
- `framer-motion` — page transitions
- `cmdk` — command palette (via shadcn `@/components/ui/command` wrapper)
- `lucide-react` — icons
- `@tanstack/react-query` — `QueryClientProvider` inline
- shadcn/ui components: `Button`, `Sheet`, `Dialog`, `Command*`

## Verification
- `bun run lint` → exit 0 (no errors in any file). The only pre-existing lint error in `src/components/shared/sparkline.tsx` (another agent's file) was independently fixed during the same session.
- All files read back; structure confirmed.

## Coordination notes for downstream agents
- **Pages**: Dashboard pages (e.g., `/dashboard`, `/timeline`, `/evidence`, …) must be placed inside `src/app/(dashboard)/` to inherit the AppShell + page-transition wrapper. Placing them directly under `src/app/` would bypass the AppShell.
- **`/api/v1/health`**: The StatusBar polls this endpoint; if it doesn't exist yet, the StatusBar correctly shows "System: Offline" (red) — this is intentional graceful degradation. Create the endpoint to flip the pill to "Healthy" (emerald).
- **`pulse-dot` and `mesh-gradient` CSS classes**: Applied as instructed; assume the globals.css agent has shipped them. If not, the StatusBar's pulse dot still renders (inline Tailwind fallback) and the dashboard layout still works (the class simply has no visual effect).

NOT PRODUCTION-AUTHORIZED. PHASE1B AppShell + command palette complete. Files created (treated as EDIT where prior agent work was expected but not present): 5. `bun run lint` exit 0. Cross-component event bus (`mithqal:request-*`) wired across Topbar, StatusBar, CommandPalette. MobileNav export preserved. ⌘K wired.
