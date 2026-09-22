/**
 * SANKET-AI Canonical API Service & Adapters — Unified Barrel Re-Export
 *
 * Provides typed access to domain services, canonical adapters, and backward-compatible apiService.
 * ZERO mock data dependencies.
 */

export * from "../types/api.types";
export * from "./adapters";

import { getProjects, getProjectById, getProjectHistory, getStatsOverview, getFiltersMeta } from "./api/projects.service";
import {
  predictProjectRisk,
  predictCUFRisk,
  getShapAttributions,
  simulateWhatIf,
  getExplanation,
  getPrediction,
  getShapDrivers,
} from "./api/ml.service";
import { getAlerts, getWarnings, getProjectWarnings, getWarningById } from "./api/alerts.service";
import { getActions, createAction, updateActionStatus } from "./api/actions.service";
import { getAnalytics } from "./api/analytics.service";
import { chatWithCopilot } from "./api/ai.service";
import { login, getCurrentUserProfile } from "./api/auth.service";

export {
  getProjects,
  getProjectById,
  getProjectHistory,
  getStatsOverview,
  getFiltersMeta,
  predictProjectRisk,
  predictCUFRisk,
  getShapAttributions,
  simulateWhatIf,
  getExplanation,
  getPrediction,
  getShapDrivers,
  getAlerts,
  getWarnings,
  getProjectWarnings,
  getWarningById,
  getActions,
  createAction,
  updateActionStatus,
  getAnalytics,
  chatWithCopilot,
  login,
  getCurrentUserProfile,
};

/** Unified API service preserving existing call signatures without mock fallbacks. */
export const apiService = {
  login,
  getCurrentUserProfile,
  getProjects,
  getProjectById,
  getProjectHistory,
  getStatsOverview,
  getFiltersMeta,
  predictProjectRisk,
  getPrediction,
  predictCUFRisk,
  getShapAttributions,
  getShapDrivers,
  getExplanation,
  simulateWhatIf,
  getAlerts,
  getWarnings,
  getProjectWarnings,
  getWarningById,
  getActions,
  createAction,
  updateActionStatus,
  getAnalytics,
  chatWithCopilot,
};

export default apiService;

