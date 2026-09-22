/**
 * Canonical Analytics Service
 * Sourced STRICTLY from FastAPI `/api/v1/analytics/overview` (and root `/analytics`).
 * ZERO mock data dependencies.
 */

import { fetchApi } from "./client";
import { normalizeAnalytics } from "../adapters";
import type { AnalyticsOverview } from "../../types/api.types";

/**
 * Fetch portfolio-wide analytics aggregated from 2,100 master projects
 * and 11,011 monthly snapshot records across 9 chronological cycles.
 */
export async function getAnalytics(forceRefresh = false): Promise<AnalyticsOverview> {
  const query = forceRefresh ? "?force_refresh=true" : "";
  const raw = await fetchApi<Record<string, any>>(`/analytics/overview${query}`);
  return normalizeAnalytics(raw);
}
