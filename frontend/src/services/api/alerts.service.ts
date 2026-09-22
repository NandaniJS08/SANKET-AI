/**
 * Canonical Alerts & Early Warnings Service
 * Sourced STRICTLY from FastAPI `/api/v1/early-warnings` and `/api/v1/warnings`.
 * ZERO mock data dependencies.
 */

import { fetchApi } from "./client";
import { normalizeWarningsResponse, normalizeWarning } from "../adapters";
import type { Warning, WarningsResponse } from "../../types/api.types";

export interface WarningFilterParams {
  severity?: string;
  warningType?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch portfolio-wide early warning alerts.
 * Calls `GET /api/v1/warnings` and normalizes severity to canonical 4-tier enum.
 */
export async function getWarnings(
  filters: WarningFilterParams = {}
): Promise<WarningsResponse> {
  const params = new URLSearchParams();
  if (filters.severity && filters.severity.toLowerCase() !== "all") {
    params.append("severity", filters.severity);
  }
  if (filters.warningType && filters.warningType.toLowerCase() !== "all") {
    params.append("warning_type", filters.warningType);
  }
  if (filters.projectId) {
    params.append("project_id", String(filters.projectId));
  }
  params.append("page", String(filters.page || 1));
  params.append("page_size", String(filters.pageSize || 50));

  const raw = await fetchApi<Record<string, any>>(`/warnings?${params.toString()}`);
  return normalizeWarningsResponse(raw);
}

/** Backward compatibility alias for getWarnings */
export const getAlerts = getWarnings;

/**
 * Fetch early warnings for a specific project.
 * Calls `GET /api/v1/warnings/{project_id}`.
 */
export async function getProjectWarnings(projectId: string | number): Promise<Warning[]> {
  const raw = await fetchApi<Record<string, any>>(`/warnings/${String(projectId)}`);
  const list = Array.isArray(raw?.warnings) ? raw.warnings : Array.isArray(raw) ? raw : [];
  return list.map(normalizeWarning);
}

/** Backward compatibility alias for getProjectWarnings */
export const getWarningById = getProjectWarnings;

