/**
 * Canonical Projects Service
 * Sourced STRICTLY from FastAPI `/api/v1/projects` endpoints.
 * ZERO mock data dependencies.
 */

import { fetchApi } from "./client";
import {
  normalizeProject,
  normalizeProjectList,
  normalizeProjectHistory,
} from "../adapters";
import type {
  Project,
  ProjectHistoryResponse,
  ApiListResponse,
} from "../../types/api.types";

export interface ProjectFilterParams {
  search?: string;
  ministry?: string;
  sector?: string;
  state?: string;
  risk?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Fetch paginated project list from `GET /api/v1/projects`.
 * Normalizes all records into canonical `Project` entities and preserves pagination.
 */
export async function getProjects(
  filters: ProjectFilterParams = {}
): Promise<ApiListResponse<Project>> {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.ministry && filters.ministry !== "All") params.append("ministry", filters.ministry);
  if (filters.sector && filters.sector !== "All") params.append("sector", filters.sector);
  if (filters.state && filters.state !== "All") params.append("state", filters.state);
  if (filters.risk && filters.risk !== "All") params.append("risk_level", filters.risk);
  params.append("page", String(filters.page || 1));
  params.append("page_size", String(filters.pageSize || 50));

  const raw = await fetchApi<Record<string, any>>(`/projects?${params.toString()}`);
  return normalizeProjectList(raw);
}

/**
 * Fetch detailed project telemetry from `GET /api/v1/projects/{id}`.
 * Normalizes snake_case database columns into canonical `Project`.
 */
export async function getProjectById(id: string | number): Promise<Project> {
  const raw = await fetchApi<Record<string, any>>(`/projects/${id}`);
  const projectData = raw?.data ?? raw;
  return normalizeProject(projectData);
}

/**
 * Fetch chronological monthly snapshot history from `GET /api/v1/projects/{id}/history`.
 * Sourced from verified `project_monthly_snapshots` table.
 */
export async function getProjectHistory(id: string | number): Promise<ProjectHistoryResponse> {
  const raw = await fetchApi<Record<string, any>>(`/projects/${id}/history`);
  return normalizeProjectHistory(raw);
}

/**
 * Fetch portfolio monitoring statistics overview from `GET /api/v1/projects/stats/overview`.
 */
export async function getStatsOverview(): Promise<Record<string, any>> {
  return await fetchApi<Record<string, any>>("/projects/stats/overview");
}

/**
 * Fetch distinct filter dropdown metadata from `GET /api/v1/projects/filters-meta`.
 */
export async function getFiltersMeta(): Promise<Record<string, any>> {
  return await fetchApi<Record<string, any>>("/projects/filters-meta");
}

