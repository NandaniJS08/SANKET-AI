/**
 * Centralized API Client
 *
 * Single source of truth for backend communication, request timeouts,
 * header standardization, and structured error propagation.
 *
 * CRITICAL RULE:
 * Never catch an error and return mock/demo data.
 * Propagates structured ApiError instances to caller.
 */

import { createApiError } from "../adapters";
import type { ApiError } from "../../types/api.types";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Standardized typed HTTP fetch wrapper.
 * Automatically handles JSON serialization, error structuring, and network failures.
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeoutMs = 45000, ...fetchOpts } = options;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = new Headers(fetchOpts.headers || {});
  if (!headers.has("Content-Type") && !(fetchOpts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Supabase Auth Bearer token if present in localStorage
  if (!headers.has("Authorization")) {
    try {
      const explicitToken =
        localStorage.getItem("sanket_auth_token") ||
        localStorage.getItem("infrawatch_auth_token");
      if (explicitToken) {
        headers.set("Authorization", `Bearer ${explicitToken.trim()}`);
      } else {
        const userJson = localStorage.getItem("infrawatch_user");
        if (userJson) {
          const parsed = JSON.parse(userJson);
          if (parsed?.token) {
            headers.set("Authorization", `Bearer ${parsed.token.trim()}`);
          }
        }
      }
    } catch {
      // Ignore localStorage parse exceptions
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errBody: any = null;
      try {
        errBody = await res.json();
      } catch {
        try {
          errBody = await res.text();
        } catch {
          // ignore
        }
      }
      throw createApiError(
        {
          status: res.status,
          code: errBody?.code || errBody?.error || `HTTP_${res.status}`,
          message: errBody?.message || errBody?.detail || res.statusText || "Request failed",
          details: errBody,
        },
        `HTTP Error ${res.status}: ${res.statusText}`
      );
    }

    // 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json();
    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.isError) {
      throw err;
    }
    if (err?.name === "AbortError") {
      throw createApiError(
        {
          status: 408,
          code: "REQUEST_TIMEOUT",
          message: `Request to ${endpoint} timed out after ${timeoutMs}ms.`,
          details: err,
        },
        "Request timed out."
      );
    }
    throw createApiError(err, `Failed to fetch from ${endpoint}: ${err?.message || "Network Error"}`);
  }
}
