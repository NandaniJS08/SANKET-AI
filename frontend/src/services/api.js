/**
 * SANKET-AI Central API Service
 * Delegated to canonical domain services and adapters.
 * ZERO imports from mock data files (`src/data/*`).
 * ZERO fabricated fallbacks.
 */

import {
  apiService,
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
} from "./index";

export {
  apiService,
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

export default apiService;

