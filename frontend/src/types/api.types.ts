/**
 * SANKET-AI Canonical API & Domain Types
 * Single source of truth for all API responses, domain models, and error structures.
 * Based STRICTLY on verified backend response contracts and Supabase PostgreSQL schema.
 * ZERO mock data dependencies.
 */

// ============================================================================
// 1. RISK LEVEL ENUM
// ============================================================================

/** Canonical 4-tier risk classification matching AI Engine and MoSPI standards. */
export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

/** Raw risk level representations encountered in backend/DB/legacy systems. */
export type RawRiskLevel =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Moderate"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "MODERATE"
  | "High Risk"
  | "Medium Risk"
  | "Low Risk"
  | string;

// ============================================================================
// 2. PROJECT ENTITY CONTRACT
// ============================================================================

/**
 * Canonical Project shape.
 * Sourced STRICTLY from real database columns in `projects`.
 * No fabricated or unrecorded fields.
 */
export interface Project {
  /** Master primary key string from `projects.project_id` (e.g. "400010"). */
  projectId: string;
  /** Backward-compatibility alias pointing to `projectId`. */
  id: string;
  /** Full official project title from `projects.name`. */
  name: string;
  /** Central ministry from `projects.ministry`. */
  ministry: string;
  /** Infrastructure sector from `projects.sector`. */
  sector: string;
  /** Location state/UT from `projects.state`. */
  state: string;
  /** Implementing agency from `projects.implementing_agency` (e.g. NHAI). */
  agency: string;
  /** Sanctioned capital cost in ₹ Cr from `projects.original_cost_cr`. */
  originalCostCr: number | null;
  /** Revised sanctioned cost in ₹ Cr from `projects.revised_cost_cr`. */
  revisedCostCr: number | null;
  /** Cumulative capital expenditure in ₹ Cr from `projects.cumulative_expenditure_cr`. */
  expenditureCr: number | null;
  /** Physical completion percentage from `projects.physical_progress_pct`. */
  physicalProgress: number | null;
  /** Financial expenditure percentage from `projects.financial_progress_pct`. */
  financialProgress: number | null;
  /**
   * ML High Risk Probability Score (0-100).
   * Note: In PostgreSQL `projects.risk_score` is initially NULL until dynamically inferred.
   */
  riskScore: number | null;
  /** Canonical 4-tier risk classification. */
  riskLevel: RiskLevel | null;
  /** Cost revision percentage from `projects.cost_revision_pct`. */
  costRevisionPct: number | null;
  /** Commissioning deadline revision flag from `projects.deadline_revision_flag`. */
  deadlineRevisionFlag: boolean | null;
  /** Raw OCMS project status from `projects.project_status` (e.g. "Ongoing"). */
  status: string;
  /** Approval / sanction date from `projects.approval_date`. */
  approvalDate: string | null;
  /** Work order / start date from `projects.start_date`. */
  startDate: string | null;
  /** Baseline statutory completion date from `projects.original_completion_date`. */
  originalCompletionDate: string | null;
  /** Current revised target completion date from `projects.revised_completion_date`. */
  revisedCompletionDate: string | null;
  /** Latest reporting month cycle from `projects.reporting_month` (e.g. "2026-03-01"). */
  reportingMonth: string | null;
  /** Status at month end from `projects.status_at_month_end`. */
  statusAtMonthEnd: string | null;
  /** Ingestion data quality flag from `projects.data_quality_flag`. */
  dataQualityFlag: boolean | null;
  /** Source PDF report page index from `projects.source_page`. */
  sourcePage: number | null;
}

// ============================================================================
// 3. PROJECT HISTORY / MONTHLY SNAPSHOT CONTRACT
// ============================================================================

/**
 * Historical snapshot item for a project.
 * Sourced STRICTLY from authentic `project_monthly_snapshots` records.
 * Planned progress and historical risk bands are intentionally omitted as they are unrecorded in DB.
 */
export interface ProjectHistoryItem {
  /** Reporting cycle date string (e.g. "2025-07-01"). */
  cycle: string;
  /** Full reporting month from `reporting_month`. */
  reportingMonth: string;
  /** Actual physical completion percentage from `physical_progress_pct`. */
  actual: number | null;
  /** Explicit physical progress percentage alias. */
  physicalProgressPct: number | null;
  /** Cumulative capital expenditure in ₹ Cr from `cumulative_expenditure_cr`. */
  expenditure: number | null;
  /** Explicit cumulative expenditure alias. */
  cumulativeExpenditureCr: number | null;
  /** Cost revision percentage from `cost_revision_pct`. */
  costRevision: number | null;
  /** Explicit cost revision percentage alias. */
  costRevisionPct: number | null;
  /** Latest revised cost in ₹ Cr from `latest_revised_cost_cr` / `revised_cost_cr`. */
  revisedCostCr: number | null;
  /** Revised target completion date at this snapshot. */
  revisedCompletionDate: string | null;
  /** Deadline revision flag at this snapshot. */
  deadlineRevisionFlag: boolean | null;
  /** Status at month end (e.g. "Ongoing"). */
  statusAtMonthEnd: string | null;
  /** Source page index from PDF. */
  sourcePage: number | null;
  /** Data quality validation flag. */
  dataQualityFlag: boolean | null;
}

export interface ProjectHistoryResponse {
  projectId: string;
  count: number;
  history: ProjectHistoryItem[];
}

// ============================================================================
// 4. ML PREDICTION & TREESHAP EXPLAINABILITY CONTRACT
// ============================================================================

/** Real TreeSHAP attribution factor for high-risk classifier. */
export interface ShapDriver {
  /** Human-readable plain-language factor title (e.g. "Repeat Cost Revisions"). */
  factor: string;
  /** Machine feature code (e.g. "cost_revisions_so_far"). */
  feature: string;
  /** Normalized impact category based on absolute SHAP weight. */
  impact: "High" | "Medium" | "Low";
  /** Normalized attribution weight percentage (0-100). */
  weight: number;
  /** Rounded SHAP value. */
  shapValue: number;
  /** Exact unrounded float SHAP value. */
  rawShapValue: number;
  /** Influence on risk probability. */
  direction: "increases_risk" | "decreases_risk";
  /** Grounded plain-language description synthesized from real project telemetry. */
  evidence: string;
}

/** Canonical multi-target risk prediction response. */
export interface RiskPrediction {
  projectId: string;
  /** High risk probability score (0.0 - 100.0). */
  riskScore: number;
  /** Canonical 4-tier risk classification ("Critical" | "High" | "Medium" | "Low"). */
  riskLevel: RiskLevel;
  /** Probability of project falling into high-risk tier (0-100). */
  highRiskProbability: number;
  /** Probability of commissioning date slippage (0-100). */
  deadlineSlipProbability: number;
  /** Probability of sanctioned cost escalation (0-100). */
  costEscalationProbability: number;
  /** Estimated schedule delay in months based on physical lag and stall indicators. */
  predictedDelayMonths: number;
  /** Top 5 TreeSHAP risk attribution drivers. */
  topRiskDrivers: ShapDriver[];
  /** Statutory recommendation text based on risk category. */
  recommendation: string;

  // Compatibility aliases for existing UI components
  overallRisk: number;
  costRisk: number;
  timeRisk: number;
  confidenceScore: string;
  modelVersion: string;
  predictionMethod: string;
  topDrivers: Array<{ key: string; name: string; value: number; weight: string }>;
}

/** Canonical project explanation from `GET /predictions/explain/{id}`. */
export interface ProjectExplanation {
  projectId: string;
  projectName: string;
  explanationAvailable: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  whyFlagged: string;
  topDrivers: ShapDriver[];
  evidenceMonth: string;
  recommendation: string;
}

// ============================================================================
// 5. EARLY WARNINGS & WATCHLIST CONTRACT
// ============================================================================

/** Canonical Early Warning notification item from `warning_service`. */
export interface Warning {
  id?: string;
  alertId?: string;
  warningId: string;
  projectId: string;
  projectName: string;
  warningType: string;
  type?: string;
  severity: RiskLevel;
  priority?: string;
  reason: string;
  evidence: any;
  metricName?: string;
  metricValue?: number | string | null;
  threshold?: number | string | null;
  whatHappened?: string;
  whichProject?: string;
  whyItMatters?: string;
  state?: string;
  ministry: string;
  sector: string;
  timestamp?: string;
  source?: string;
}

export interface WarningsResponse {
  count: number;
  total: number;
  warnings: Warning[];
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// 6. ACTION & DIRECTIVES WORKFLOW CONTRACT
// ============================================================================

/** Canonical Statutory Action Directive from `actions_log`. */
export interface Action {
  id?: string;
  actionId: string;
  projectId: string;
  userId: string | null;
  actionType: string;
  type?: string;
  description: string;
  remarks?: string;
  status: "Open" | "In Progress" | "Completed" | "Overdue";
  assignedTo: string | null;
  officer?: string | null;
  dueDate: string | null;
  createdAt: string | null;
  date?: string | null;
  updatedAt: string | null;
}

export interface CreateActionPayload {
  projectId: string;
  actionType: string;
  description: string;
  status?: "Open" | "In Progress" | "Completed" | "Overdue";
  assignedTo?: string;
  dueDate?: string;
}

// ============================================================================
// 7. PORTFOLIO ANALYTICS CONTRACT
// ============================================================================

export interface PortfolioOverview {
  totalProjects: number;
  delayedProjects: number;
  onTrackProjects: number;
  costOverrunProjects?: number;
  criticalRiskProjects?: number;
  totalOriginalCostCr: number;
  totalRevisedCostCr: number;
  totalCumulativeExpenditureCr: number;
  averagePhysicalProgressPct: number;
  averageCostRevisionPct: number;
}

export interface MinistryComparisonItem {
  ministry: string;
  projects: number;
  delayed: number;
  onTrack: number;
  avgCostRevisionPct: number;
  avgPhysicalProgressPct: number;
  totalRevisedCostCr: number;
}

export interface SectorDataItem {
  sector: string;
  projects: number;
  delayed: number;
  onTrack: number;
  avgPhysicalProgressPct: number;
  totalRevisedCostCr: number;
}

export interface MonthlyCostOverrunTrendItem {
  reportingMonth: string;
  month: string;
  avgCostRevisionPct: number;
  avgPhysicalProgressPct: number;
  totalExpenditureCr: number;
  snapshotsCount: number;
}

export interface AnalyticsOverview {
  portfolioOverview: PortfolioOverview;
  ministryComparison: MinistryComparisonItem[];
  sectorData: SectorDataItem[];
  costOverrunTrend: MonthlyCostOverrunTrendItem[];
  /** Structured report explicitly documenting unrecorded UI radar metrics. */
  missingMetricsReport: Record<string, string>;
}

// ============================================================================
// 8. PAGINATION & WRAPPERS
// ============================================================================

export interface ApiListResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// 9. CENTRALIZED STRUCTURED API ERROR
// ============================================================================

export interface ApiError {
  isError: true;
  status: number;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}
