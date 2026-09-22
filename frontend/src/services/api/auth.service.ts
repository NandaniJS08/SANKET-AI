/**
 * Canonical Authentication Service
 * Interacts with FastAPI `/api/v1/auth` endpoints.
 * ZERO mock data dependencies.
 */

import { fetchApi } from "./client";
import type { User } from "../../types/user.types";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: "policymaker" | "admin" | "officer";
  };
}

/**
 * Fetch authenticated user session profile from `GET /api/v1/auth/me`.
 */
export async function getCurrentUserProfile(): Promise<{ message: string; user?: User }> {
  return fetchApi<{ message: string; user?: User }>("/auth/me");
}

/**
 * Verify credentials against backend auth service and obtain Supabase JWT session.
 */
export async function login(emailOrRole: string, password?: string): Promise<LoginResponse> {
  return fetchApi<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: emailOrRole, role: emailOrRole, password }),
  });
}
