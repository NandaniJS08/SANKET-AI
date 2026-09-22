/**
 * Canonical Actions & Directives Service
 * Interacts with FastAPI `/api/v1/actions` endpoints.
 * ZERO fake action success. Properly exposes PostgreSQL 42501 permission status.
 */

import { fetchApi } from "./client";
import { normalizeAction } from "../adapters";
import type { Action, CreateActionPayload } from "../../types/api.types";

/**
 * Fetch action history / audit ledger for a specific project or all projects.
 * Calls `GET /api/v1/actions?project_id={id}`.
 */
export async function getActions(projectId?: string | number): Promise<Action[]> {
  const query = projectId ? `?project_id=${encodeURIComponent(String(projectId))}` : "";
  const raw = await fetchApi<Record<string, any>>(`/actions${query}`);
  const list = Array.isArray(raw?.actions) ? raw.actions : Array.isArray(raw) ? raw : [];
  return list.map(normalizeAction);
}

/**
 * Issue a new statutory action directive.
 * Calls `POST /api/v1/actions`.
 */
export async function createAction(payload: CreateActionPayload): Promise<Action> {
  const body = {
    project_id: String(payload.projectId),
    action_type: payload.actionType,
    description: payload.description,
    status: payload.status || "Open",
    assigned_to: payload.assignedTo,
    due_date: payload.dueDate,
  };

  const raw = await fetchApi<Record<string, any>>("/actions", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const actionObj = raw?.action ?? raw;
  return normalizeAction(actionObj);
}

/**
 * Update the status of an existing statutory action directive.
 * Calls `PATCH /api/v1/actions/{action_id}/status`.
 */
export async function updateActionStatus(
  actionId: string,
  status: "Open" | "In Progress" | "Completed" | "Overdue",
  remarks?: string
): Promise<Action> {
  const body = {
    status,
    remarks,
  };

  const raw = await fetchApi<Record<string, any>>(`/actions/${encodeURIComponent(String(actionId))}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  const actionObj = raw?.action ?? raw;
  return normalizeAction(actionObj);
}
