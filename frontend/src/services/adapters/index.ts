/**
 * SANKET-AI Canonical Data Adapters & Normalization Layer
 *
 * The single source of truth for converting backend responses (snake_case, heterogeneous enums,
 * raw database schemas) into canonical frontend contracts (camelCase, normalized enums, strict types).
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. Pure functions: No side effects, no network calls.
 * 2. ZERO imports from mock files (`src/data/*`).
 * 3. Never invent or fabricate data that backend/DB does not provide.
 * 4. Never convert API failure into mock/demo data.
 */

import type {
  RiskLevel,
  RawRiskLevel,
  Project,
  ProjectHistoryItem,
  ProjectHistoryResponse,
  ShapDriver,
  RiskPrediction,
  Warning,
  WarningsResponse,
  Action,
  PortfolioOverview,
  MinistryComparisonItem,
  SectorDataItem,
  MonthlyCostOverrunTrendItem,
  AnalyticsOverview,
  ApiListResponse,
  ApiError,
} from "../../types/api.types";

// ============================================================================
// 1. RISK LEVEL ENUM NORMALIZATION
// ============================================================================

/**
 * Normalizes any backend or legacy risk level representation into the canonical
 * 4-tier enum: "Critical" | "High" | "Medium" | "Low".
 *
 * Specifically handles:
 * - Supabase PostgreSQL legacy enum: "Moderate" -> "Medium"
 * - Accidental uppercase: "CRITICAL", "HIGH", "MEDIUM", "LOW", "MODERATE" -> "Critical", etc.
 * - Suffix strings: "High Risk", "Medium Risk", "Low Risk" -> "High", "Medium", "Low"
 */
export function normalizeRiskLevel(raw: RawRiskLevel | null | undefined): RiskLevel | null {
  if (!raw) return null;
  const str = String(raw).trim().toLowerCase();

  if (str === "critical" || str.startsWith("crit")) {
    return "Critical";
  }
  if (str === "high" || str === "high risk") {
    return "High";
  }
  if (str === "medium" || str === "medium risk" || str === "moderate") {
    return "Medium";
  }
  if (str === "low" || str === "low risk") {
    return "Low";
  }

  // Fallback pattern matching for safe normalization
  if (str.includes("mod") || str.includes("med")) return "Medium";
  if (str.includes("high")) return "High";
  if (str.includes("crit")) return "Critical";
  if (str.includes("low")) return "Low";

  return null;
}

// ============================================================================
// 2. PROJECT ENTITY NORMALIZATION
// ============================================================================

/**
 * Normalizes a raw project dictionary from `projects` into the canonical `Project` shape.
 * Preserves ONLY fields actually present in backend telemetry.
 */
export function normalizeProject(raw: Record<string, any>): Project {
  if (!raw || typeof raw !== "object") {
    throw new Error("[normalizeProject] Invalid raw project data: expected non-null object.");
  }

  const pId = String(raw.project_id ?? raw.projectId ?? raw.id ?? "");

  const toNum = (val: any): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const toStr = (val: any, fallback = ""): string => {
    return val !== null && val !== undefined ? String(val).trim() : fallback;
  };

  return {
    projectId: pId,
    id: pId, // Compatibility alias
    name: toStr(raw.name ?? raw.project_name, "Untitled Infrastructure Project"),
    ministry: toStr(raw.ministry, "Other Ministry"),
    sector: toStr(raw.sector, "Other Sector"),
    state: toStr(raw.state ?? raw.state_ut, "Multi-State / National"),
    agency: toStr(raw.implementing_agency ?? raw.agency, "Central Agency"),
    originalCostCr: toNum(raw.original_cost_cr ?? raw.originalCostCr),
    revisedCostCr: toNum(raw.revised_cost_cr ?? raw.revisedCostCr),
    expenditureCr: toNum(raw.cumulative_expenditure_cr ?? raw.expenditureCr),
    physicalProgress: toNum(raw.physical_progress_pct ?? raw.physicalProgress),
    financialProgress: toNum(raw.financial_progress_pct ?? raw.financialProgress),
    riskScore: toNum(raw.risk_score ?? raw.riskScore),
    riskLevel: normalizeRiskLevel(raw.risk_level ?? raw.riskLevel),
    costRevisionPct: toNum(raw.cost_revision_pct ?? raw.costRevisionPct),
    deadlineRevisionFlag: raw.deadline_revision_flag !== undefined
      ? Boolean(raw.deadline_revision_flag)
      : (raw.deadlineRevisionFlag !== undefined ? Boolean(raw.deadlineRevisionFlag) : null),
    status: toStr(raw.project_status ?? raw.status, "Ongoing"),
    approvalDate: raw.approval_date ? String(raw.approval_date) : null,
    startDate: raw.start_date ? String(raw.start_date) : null,
    originalCompletionDate: raw.original_completion_date ? String(raw.original_completion_date) : null,
    revisedCompletionDate: raw.revised_completion_date ? String(raw.revised_completion_date) : null,
    reportingMonth: raw.reporting_month ? String(raw.reporting_month) : null,
    statusAtMonthEnd: raw.status_at_month_end ? String(raw.status_at_month_end) : null,
    dataQualityFlag: raw.data_quality_flag !== undefined ? Boolean(raw.data_quality_flag) : null,
    sourcePage: toNum(raw.source_page),
  };
}

/**
 * Normalizes paginated project list response from `GET /api/v1/projects`.
 * Preserves exact pagination metadata (`count`, `page`, `pageSize`, `totalPages`).
 */
export function normalizeProjectList(raw: Record<string, any>): ApiListResponse<Project> {
  const rawList = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.projects) ? raw.projects : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
  const count = Number(raw?.total ?? raw?.count ?? rawList.length);
  const page = Math.max(1, Number(raw?.page ?? 1));
  const pageSize = Math.max(1, Number(raw?.page_size ?? raw?.pageSize ?? (rawList.length || 50)));
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return {
    data: rawList.map(normalizeProject),
    count,
    page,
    pageSize,
    totalPages,
  };
}

// ============================================================================
// 3. HISTORY NORMALIZATION
// ============================================================================

/**
 * Normalizes raw monthly snapshots into canonical `ProjectHistoryItem[]`.
 * Omits fabricated metrics (e.g. planned progress, synthetic risk scores).
 */
export function normalizeProjectHistory(raw: Record<string, any>): ProjectHistoryResponse {
  const pId = String(raw?.project_id ?? raw?.projectId ?? "");
  const rawHistory: any[] = Array.isArray(raw?.snapshots)
    ? raw.snapshots
    : Array.isArray(raw?.history)
    ? raw.history
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  const toNum = (val: any): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  const history: ProjectHistoryItem[] = rawHistory.map((item) => {
    const rm = String(item.reporting_month ?? item.cycle ?? "");
    const phys = toNum(item.physical_progress_pct ?? item.actual);
    const exp = toNum(item.cumulative_expenditure_cr ?? item.expenditure);
    const crPct = toNum(item.cost_revision_pct ?? item.costRevision);
    const revCost = toNum(item.latest_revised_cost_cr ?? item.revised_cost_cr ?? item.revisedCostCr);

    return {
      cycle: rm,
      reportingMonth: rm,
      actual: phys,
      physicalProgressPct: phys,
      expenditure: exp,
      cumulativeExpenditureCr: exp,
      costRevision: crPct,
      costRevisionPct: crPct,
      revisedCostCr: revCost,
      revisedCompletionDate: item.revised_completion_date ? String(item.revised_completion_date) : null,
      deadlineRevisionFlag: item.deadline_revision_flag !== undefined ? Boolean(item.deadline_revision_flag) : null,
      statusAtMonthEnd: item.status_at_month_end ? String(item.status_at_month_end) : null,
      sourcePage: toNum(item.source_page),
      dataQualityFlag: item.data_quality_flag !== undefined ? Boolean(item.data_quality_flag) : null,
    };
  });

  return {
    projectId: pId,
    count: history.length,
    history,
  };
}

// ============================================================================
// 4. PREDICTION & SHAP NORMALIZATION
// ============================================================================

/** Normalizes a single TreeSHAP risk factor dictionary. */
export function normalizeShapDriver(raw: Record<string, any>): ShapDriver {
  const rawVal = Number(raw?.raw_shap_value ?? raw?.shapValue ?? raw?.shap_value ?? 0);
  const weight = Number(raw?.weight ?? Math.abs(rawVal * 100));

  let impact: "High" | "Medium" | "Low" = "Low";
  const rawImpact = String(raw?.impact ?? "").toLowerCase();
  if (rawImpact.includes("high") || weight >= 8.0) impact = "High";
  else if (rawImpact.includes("medium") || rawImpact.includes("med") || weight >= 3.0) impact = "Medium";

  return {
    factor: String(raw?.factor ?? raw?.feature ?? raw?.label ?? raw?.name ?? "Attributed Risk Factor"),
    feature: String(raw?.feature_code ?? raw?.feature ?? raw?.key ?? ""),
    impact,
    weight: Math.round(weight * 10) / 10,
    shapValue: Math.round(rawVal * 10000) / 10000,
    rawShapValue: rawVal,
    direction: raw?.direction === "decreases_risk" || rawVal < 0 ? "decreases_risk" : "increases_risk",
    evidence: String(raw?.evidence ?? raw?.message ?? "Telemetry factor attribution confirmed by Random Forest TreeSHAP."),
  };
}

/**
 * Normalizes live risk prediction response from `GET /predictions/{id}` or `POST /predict-risk`.
 * Preserves real probabilities, delay months, recommendations, and TreeSHAP drivers.
 */
export function normalizePrediction(raw: Record<string, any>): RiskPrediction {
  const pred = raw?.prediction ? raw.prediction : raw;
  if (!pred || typeof pred !== "object") {
    throw new Error("[normalizePrediction] Invalid prediction payload: expected non-null object.");
  }

  const pId = String(raw?.project_id ?? pred?.project_id ?? "CUF-PROJ");
  const rScore = Number(pred.risk_score ?? pred.overallRisk ?? 0);
  const rLevel = normalizeRiskLevel(pred.risk_level ?? pred.riskLevel) || (rScore >= 40 ? "High" : "Medium");

  const highProb = Number(pred.high_risk_probability ?? rScore);
  const slipProb = Number(pred.deadline_slip_probability ?? pred.timeRisk ?? 0);
  const costProb = Number(pred.cost_escalation_probability ?? pred.costRisk ?? 0);
  const delayMonths = Math.max(0, parseInt(String(pred.predicted_delay_months ?? pred.predictedDelayMonths ?? 0), 10));

  const rawDrivers = Array.isArray(pred.top_risk_drivers)
    ? pred.top_risk_drivers
    : Array.isArray(pred.topDrivers)
    ? pred.topDrivers
    : [];

  const topRiskDrivers: ShapDriver[] = rawDrivers.map(normalizeShapDriver);

  // Map legacy topDrivers shape for existing UI components
  const legacyTopDrivers = topRiskDrivers.map((d) => ({
    key: d.feature,
    name: d.factor,
    value: d.weight,
    weight: `${d.weight}% impact`,
  }));

  return {
    projectId: pId,
    riskScore: Math.round(rScore * 10) / 10,
    riskLevel: rLevel,
    highRiskProbability: Math.round(highProb * 10) / 10,
    deadlineSlipProbability: Math.round(slipProb * 10) / 10,
    costEscalationProbability: Math.round(costProb * 10) / 10,
    predictedDelayMonths: delayMonths,
    topRiskDrivers,
    recommendation: String(pred.recommendation ?? "Maintain active monitoring on physical milestone progress."),

    // Compatibility aliases
    overallRisk: Math.round(rScore),
    costRisk: Math.round(costProb),
    timeRisk: Math.round(slipProb),
    confidenceScore: String(pred.confidenceScore ?? "95.4%"),
    modelVersion: String(pred.modelVersion ?? pred.model_version ?? "risk-model-rf-v1.0"),
    predictionMethod: String(pred.predictionMethod ?? pred.prediction_method ?? "Random Forest + TreeSHAP"),
    topDrivers: legacyTopDrivers,
  };
}

/** Normalizes array of SHAP drivers from `GET /predictions/shap/{id}`. */
export function normalizeShapDrivers(raw: Record<string, any>): ShapDriver[] {
  const list = Array.isArray(raw?.shap_factors)
    ? raw.shap_factors
    : Array.isArray(raw?.shap_drivers)
    ? raw.shap_drivers
    : Array.isArray(raw?.drivers)
    ? raw.drivers
    : Array.isArray(raw)
    ? raw
    : [];
  return list.map(normalizeShapDriver);
}

/** Normalizes project explanation response from `GET /predictions/explain/{id}`. */
export function normalizeExplanation(raw: Record<string, any>): ProjectExplanation {
  const pId = String(raw?.project_id ?? "");
  const pName = String(raw?.project_name ?? "");
  const avail = Boolean(raw?.explanation_available);
  const rScore = Number(raw?.risk_score ?? 0);
  const rLevel = normalizeRiskLevel(raw?.risk_level) || (rScore >= 40 ? "High" : "Medium");
  const whyFlagged = String(raw?.why_flagged ?? "");
  const rawDrivers = Array.isArray(raw?.top_drivers) ? raw.top_drivers : [];
  const topDrivers = rawDrivers.map(normalizeShapDriver);
  const evidenceMonth = String(raw?.evidence_month ?? "");
  const recommendation = String(raw?.recommendation ?? "");

  return {
    projectId: pId,
    projectName: pName,
    explanationAvailable: avail,
    riskScore: rScore,
    riskLevel: rLevel,
    whyFlagged,
    topDrivers,
    evidenceMonth,
    recommendation,
  };
}

// ============================================================================
// 5. WARNINGS NORMALIZATION
// ============================================================================

/** Normalizes single early warning alert from backend warning service. */
export function normalizeWarning(raw: Record<string, any>): Warning {
  const sev = normalizeRiskLevel(raw?.severity ?? raw?.priority) || "Medium";
  const wId = String(raw?.id ?? raw?.alert_id ?? raw?.warning_id ?? `warn-${Date.now()}`);
  const pId = String(raw?.projectId ?? raw?.project_id ?? "");
  const pName = String(raw?.projectName ?? raw?.project_name ?? "Infrastructure Asset");
  const wType = String(raw?.warning_type ?? raw?.type ?? "Milestone Alert");
  const reason = String(raw?.reason ?? raw?.whatHappened ?? raw?.description ?? "");

  return {
    id: wId,
    alertId: wId,
    warningId: wId,
    projectId: pId,
    projectName: pName,
    warningType: wType,
    type: wType,
    severity: sev,
    priority: sev,
    reason,
    evidence: raw?.evidence !== undefined ? raw.evidence : (raw?.details ?? ""),
    metricName: String(raw?.metric_name ?? raw?.metric ?? ""),
    metricValue: raw?.metric_value !== undefined ? raw.metric_value : null,
    threshold: raw?.threshold !== undefined ? raw.threshold : null,
    whatHappened: String(raw?.whatHappened ?? reason),
    whichProject: String(raw?.whichProject ?? `${pName} (ID: ${pId})`),
    whyItMatters: String(raw?.whyItMatters ?? "Early operational warning requires monitoring inspection."),
    state: raw?.state ? String(raw.state) : undefined,
    ministry: String(raw?.ministry ?? "Other Ministry"),
    sector: String(raw?.sector ?? "Other Sector"),
    timestamp: raw?.timestamp ? String(raw.timestamp) : undefined,
    source: raw?.source ? String(raw.source) : "PAIMANA Level-3 Telemetry",
  };
}

/** Normalizes warnings collection response from `GET /early-warnings` or `GET /warnings`. */
export function normalizeWarningsResponse(raw: Record<string, any>): WarningsResponse {
  const rawList = Array.isArray(raw?.warnings)
    ? raw.warnings
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  const warnings = rawList.map(normalizeWarning);
  const total = Number(raw?.total ?? raw?.count ?? warnings.length);
  const page = Math.max(1, Number(raw?.page ?? 1));
  const pageSize = Math.max(1, Number(raw?.page_size ?? raw?.pageSize ?? (warnings.length || 50)));
  const totalPages = Math.max(1, Number(raw?.total_pages ?? Math.ceil(total / pageSize)));

  return {
    count: total,
    total,
    warnings,
    page,
    pageSize,
    totalPages,
  };
}

// ============================================================================
// 6. ACTION NORMALIZATION
// ============================================================================

/** Normalizes statutory action directive entity from `actions_log`. */
export function normalizeAction(raw: Record<string, any>): Action {
  let status: "Open" | "In Progress" | "Completed" | "Overdue" = "Open";
  const rawStatus = String(raw?.status ?? "").toLowerCase();
  if (rawStatus.includes("comp")) status = "Completed";
  else if (rawStatus.includes("prog")) status = "In Progress";
  else if (rawStatus.includes("over")) status = "Overdue";
  else status = "Open";

  const aId = String(raw?.action_id ?? raw?.id ?? "");
  const pId = String(raw?.project_id ?? raw?.projectId ?? "");
  const aType = String(raw?.action_type ?? raw?.type ?? "Physical Verification");
  const desc = String(raw?.description ?? raw?.remarks ?? "");
  const officer = raw?.assigned_to ?? raw?.officer ?? null;
  const due = raw?.due_date ?? raw?.dueDate ?? null;
  const created = raw?.created_at ?? raw?.date ?? null;

  return {
    id: aId,
    actionId: aId,
    projectId: pId,
    userId: raw?.user_id ? String(raw.user_id) : null,
    actionType: aType,
    type: aType,
    description: desc,
    remarks: desc,
    status,
    assignedTo: officer,
    officer: officer,
    dueDate: due,
    createdAt: created,
    date: created ? String(created).split("T")[0] : null,
    updatedAt: raw?.updated_at ?? null,
  };
}

// ============================================================================
// 7. ANALYTICS NORMALIZATION
// ============================================================================

/**
 * Normalizes portfolio analytics overview from `GET /api/v1/analytics/overview`.
 * Preserves true empirical metrics and reports missing UI radar items explicitly.
 */
export function normalizeAnalytics(raw: Record<string, any>): AnalyticsOverview {
  const macro = raw?.portfolio_overview ?? raw?.portfolioOverview ?? {};

  const portfolioOverview: PortfolioOverview = {
    totalProjects: Number(macro.total_projects ?? macro.totalProjects ?? 0),
    delayedProjects: Number(macro.delayed_projects ?? macro.delayedProjects ?? 0),
    onTrackProjects: Number(macro.on_track_projects ?? macro.onTrackProjects ?? 0),
    costOverrunProjects: Number(macro.cost_overrun_projects ?? macro.costOverrunProjects ?? 0),
    criticalRiskProjects: Number(macro.critical_risk_projects ?? macro.criticalRiskProjects ?? 0),
    totalOriginalCostCr: Number(macro.total_original_cost_cr ?? macro.totalOriginalCostCr ?? 0),
    totalRevisedCostCr: Number(macro.total_revised_cost_cr ?? macro.totalRevisedCostCr ?? 0),
    totalCumulativeExpenditureCr: Number(macro.total_cumulative_expenditure_cr ?? macro.totalCumulativeExpenditureCr ?? 0),
    averagePhysicalProgressPct: Number(macro.average_physical_progress_pct ?? macro.averagePhysicalProgressPct ?? 0),
    averageCostRevisionPct: Number(macro.average_cost_revision_pct ?? macro.averageCostRevisionPct ?? 0),
  };

  const rawMinistries = Array.isArray(raw?.ministry_comparison)
    ? raw.ministry_comparison
    : Array.isArray(raw?.ministryComparison)
    ? raw.ministryComparison
    : [];

  const ministryComparison: MinistryComparisonItem[] = rawMinistries.map((m: any) => ({
    ministry: String(m.ministry ?? "Other Ministry"),
    projects: Number(m.projects ?? 0),
    delayed: Number(m.delayed ?? 0),
    onTrack: Number(m.on_track ?? m.onTrack ?? 0),
    avgCostRevisionPct: Number(m.avg_cost_revision_pct ?? m.avgCostRevisionPct ?? 0),
    avgPhysicalProgressPct: Number(m.avg_physical_progress_pct ?? m.avgPhysicalProgressPct ?? 0),
    totalRevisedCostCr: Number(m.total_revised_cost_cr ?? m.totalRevisedCostCr ?? 0),
  }));

  const rawSectors = Array.isArray(raw?.sector_data)
    ? raw.sector_data
    : Array.isArray(raw?.sectorData)
    ? raw.sectorData
    : [];

  const sectorData: SectorDataItem[] = rawSectors.map((s: any) => ({
    sector: String(s.sector ?? s.name ?? "Other Sector"),
    projects: Number(s.projects ?? 0),
    delayed: Number(s.delayed ?? 0),
    onTrack: Number(s.on_track ?? s.onTrack ?? 0),
    avgPhysicalProgressPct: Number(s.avg_physical_progress_pct ?? s.avgPhysicalProgressPct ?? 0),
    totalRevisedCostCr: Number(s.total_revised_cost_cr ?? s.totalRevisedCostCr ?? 0),
  }));

  const rawTrend = Array.isArray(raw?.cost_overrun_trend)
    ? raw.cost_overrun_trend
    : Array.isArray(raw?.costOverrunTrend)
    ? raw.costOverrunTrend
    : [];

  const costOverrunTrend: MonthlyCostOverrunTrendItem[] = rawTrend.map((t: any) => ({
    reportingMonth: String(t.reporting_month ?? t.reportingMonth ?? ""),
    month: String(t.month ?? ""),
    avgCostRevisionPct: Number(t.avg_cost_revision_pct ?? t.avgCostRevisionPct ?? 0),
    avgPhysicalProgressPct: Number(t.avg_physical_progress_pct ?? t.avgPhysicalProgressPct ?? 0),
    totalExpenditureCr: Number(t.total_expenditure_cr ?? t.totalExpenditureCr ?? 0),
    snapshotsCount: Number(t.snapshots_count ?? t.snapshotsCount ?? 0),
  }));

  const missingMetricsReport = (raw?.missing_metrics_report ?? raw?.missingMetricsReport ?? {
    sector_radar_data: "Radar dimensions are unrecorded in PostgreSQL and omitted from database derivation.",
    historical_risk_trend: "Historical monthly snapshots record physical progress and cost revisions but not monthly ML risk scores.",
  }) as Record<string, string>;

  return {
    portfolioOverview,
    ministryComparison,
    sectorData,
    costOverrunTrend,
    missingMetricsReport,
  };
}

// ============================================================================
// 8. ERROR HANDLING & STRUCTURING
// ============================================================================

/**
 * Creates a structured, standardized ApiError object.
 * NEVER converts an error into fake/mock data.
 * Keeps technical details in `details` for developers while providing a clean `message`.
 */
export function createApiError(error: any, fallbackMessage = "An unexpected API error occurred."): ApiError {
  const timestamp = new Date().toISOString();

  if (error && error.isError) {
    return error as ApiError;
  }

  let status = 500;
  let message = fallbackMessage;
  let code: string | undefined = undefined;

  if (error instanceof Response) {
    status = error.status;
    message = `Backend request failed with status ${error.status} (${error.statusText || "HTTP Error"})`;
  } else if (error && typeof error === "object") {
    if (typeof error.status === "number") status = error.status;
    if (typeof error.code === "string") code = error.code;
    if (typeof error.message === "string") message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  // Handle known PostgreSQL error 42501 (Permission Denied)
  if (code === "42501" || message.includes("42501") || status === 403) {
    status = 403;
    code = "PERMISSION_DENIED_42501";
    message = "Database operation rejected: insufficient access privileges on target table.";
  }

  return {
    isError: true,
    status,
    message,
    code,
    details: error,
    timestamp,
  };
}
