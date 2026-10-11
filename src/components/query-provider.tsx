"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/**
 * TanStack Query provider for the MITHQAL dashboard (MITHQAL-TECH-SPEC-001 §2.1).
 *
 * All client dashboard pages wrap their data fetches in `useQuery` /
 * `useMutation` hooks that hit `/api/v1/*`. The QueryClient is created
 * per-client (not as a module global) so each browser session gets a
 * fresh cache — important because the dashboard is the only consumer
 * of these endpoints today.
 *
 * Defaults are conservative (1min stale, 1 retry) — the data is
 * synthetic in pilot and there is no real-time feed yet (SSE is Phase 4).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
