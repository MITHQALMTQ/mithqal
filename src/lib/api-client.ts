"use client";

/**
 * TanStack Query API client — MITHQAL-TECH-SPEC-001 §4.4 (Phase 4).
 *
 * Thin wrapper around `fetch` so every hook uses the same error envelope,
 * the same JSON-parsing path, and the same `{ ok, data, error }` shape
 * emitted by the /api/v1/* routes.
 *
 * Truth state: WIRED. Base URL is `/api/v1` in pilot (no separate host
 * provisioned yet). When NEXT_PUBLIC_API_BASE_URL is set, it overrides.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export interface ApiError {
  code: string;
  message?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  ok: boolean;
}

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ApiClientError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { idempotencyKey?: string },
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (init?.idempotencyKey) {
    headers["X-Idempotency-Key"] = init.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      // Always include credentials so next-auth session cookies ride along.
      credentials: "include",
    });
  } catch (err) {
    throw new ApiClientError(
      "NETWORK_ERROR",
      err instanceof Error ? err.message : "Network request failed",
      0,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      `Server returned status ${response.status} with non-JSON body`,
      response.status,
    );
  }

  if (!response.ok) {
    const envelope = body as { error?: ApiError };
    const err = envelope?.error;
    throw new ApiClientError(
      err?.code ?? "HTTP_ERROR",
      err?.message ?? `Request failed (${response.status})`,
      response.status,
    );
  }

  // The /api/v1/* routes return either the raw resource or an envelope
  // { data, ... }. We return the body as-is and let callers type it.
  return body as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),

  post: <T>(path: string, data?: unknown, init?: RequestInit & { idempotencyKey?: string }) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  put: <T>(path: string, data?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PUT",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),

  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" }),
};
