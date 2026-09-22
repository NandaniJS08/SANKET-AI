/**
 * SANKET-AI Landing Page — Static Data
 *
 * All static configuration arrays for the public landing page.
 * Extracted from Landing.jsx to keep the component focused on presentation.
 * Data values, ordering, labels, and SVG markup are preserved EXACTLY.
 */

import {
  Database, Cpu, ShieldAlert, Lightbulb, Target,
  IndianRupee, Clock, TrendingUp, Zap, Building2,
  FileText, Bell, ShieldCheck,
} from "lucide-react";

/* ─────────────── Tech Stack (10 items) ─────────────── */
export const TECH_STACK = [
  {
    name: "Python",
    category: "Language",
    desc: "Core AI/ML engine",
    color: "#3776AB",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M11.9 2C6.7 2 7 4.3 7 4.3l.01 2.3h5V7.4H5.3S2 7 2 12.2s2.9 5 2.9 5h1.7v-2.4s-.1-2.9 2.8-2.9h4.9s2.7.1 2.7-2.6V4.6S17.4 2 11.9 2z" fill="#3776AB" /><circle cx="8.9" cy="4.2" r=".7" fill="#fff" /><path d="M12.1 22c5.2 0 4.9-2.3 4.9-2.3l-.01-2.3h-5v-.8h6.7s3.3.4 3.3-4.8-2.9-5-2.9-5h-1.7v2.4s.1 2.9-2.8 2.9H9.6s-2.7-.1-2.7 2.6v4.7s-.4 2.6 5.2 2.6z" fill="#FFD438" /><circle cx="15.1" cy="19.8" r=".7" fill="#fff" /></svg>,
  },
  {
    name: "XGBoost",
    category: "ML Model",
    desc: "97.6% accuracy",
    color: "#22C55E",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M3 17l6-6-6-6h4l6 6-6 6H3zm8 0l6-6-6-6h4l6 6-6 6h-4z" fill="#22C55E" /></svg>,
  },
  {
    name: "FastAPI",
    category: "Backend",
    desc: "Async REST API",
    color: "#009688",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><circle cx="12" cy="12" r="10" fill="#009688" /><path d="M13 4L7 13h5l-1 7 7-10h-5l1-6z" fill="#fff" /></svg>,
  },
  {
    name: "React 19",
    category: "Frontend",
    desc: "Reactive UI layer",
    color: "#61DAFB",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.5" /><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="1.8" fill="#61DAFB" /></svg>,
  },
  {
    name: "PostgreSQL",
    category: "Database",
    desc: "Project data store",
    color: "#336791",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 3c-4.5 0-8 3-8 6.8 0 2.6 1.7 4.9 4.2 6.1-.2.8-.8 2-1.7 2.8 1.8 0 3.3-1.1 4.1-2.2.5.1 1 .2 1.4.2 4.5 0 8-3 8-6.9S16.5 3 12 3z" fill="#336791" /><circle cx="9" cy="8.5" r="1" fill="#fff" /></svg>,
  },
  {
    name: "Scikit-learn",
    category: "ML Library",
    desc: "Random Forest",
    color: "#F89939",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><circle cx="8" cy="8" r="4.5" fill="#F89939" /><circle cx="16" cy="16" r="4.5" fill="#3499CD" /><path d="M8 8l8 8" stroke="#fff" strokeWidth="1.5" /></svg>,
  },
  {
    name: "SHAP",
    category: "XAI",
    desc: "Explainability engine",
    color: "#EC4899",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><circle cx="6" cy="12" r="3" fill="#EC4899" /><circle cx="18" cy="6" r="2.5" fill="#3B82F6" /><circle cx="18" cy="18" r="2.5" fill="#10B981" /><path d="M9 12h5m-2 0l4-5m-4 5l4 5" stroke="#EC4899" strokeWidth="1.5" /></svg>,
  },
  {
    name: "Pandas",
    category: "Data",
    desc: "Feature engineering",
    color: "#E70488",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="3" y="4" width="4" height="16" rx="1" fill="#150458" /><rect x="10" y="7" width="4" height="13" rx="1" fill="#E70488" /><rect x="17" y="10" width="4" height="10" rx="1" fill="#FFD438" /></svg>,
  },
  {
    name: "NumPy",
    category: "Compute",
    desc: "Numerical arrays",
    color: "#4DABCF",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="2" y="3" width="20" height="18" rx="3" fill="#013243" stroke="#4DABCF" strokeWidth="1.5" /><path d="M6 7h3l4 6V7h3v10h-3l-4-6v6H6V7z" fill="#4DABCF" /></svg>,
  },
  {
    name: "Vite",
    category: "Build Tool",
    desc: "Lightning dev server",
    color: "#646CFF",
    icon: <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><path d="M12 2L2 19.5h20L12 2z" fill="#646CFF" opacity=".8" /><path d="M12 6l-6 11h12L12 6z" fill="#FFBD44" /></svg>,
  },
];

/* ─────────────── PPT Slide 3 — Model Comparison Metrics ─────────────── */
export const DEADLINE_SLIP_METRICS = [
  { metric: "Accuracy",  lr: 70.46, rf: 75.55, xgb: 75.45 },
  { metric: "Precision", lr: 70.54, rf: 76.38, xgb: 77.23 },
  { metric: "Recall",    lr: 78.25, rf: 82.25, xgb: 82.25 },
  { metric: "ROC-AUC",  lr: 78.25, rf: 82.25, xgb: 82.25 },
  { metric: "F1 Score",  lr: 63.09, rf: 56.47, xgb: 63.09 },
];

export const COST_ESCALATION_METRICS = [
  { metric: "Accuracy",  lr: 82.97, rf: 97.07, xgb: 97.60 },
  { metric: "Precision", lr: 92.56, rf: 77.21, xgb: 78.60 },
  { metric: "Recall",    lr: 95.34, rf: 96.02, xgb: 96.63 },
  { metric: "ROC-AUC",  lr: 32.81, rf: 70.34, xgb: 74.61 },
  { metric: "F1 Score",  lr: 32.81, rf: 70.34, xgb: 74.61 },
];

/* ─────────────── PPT Slide 3 — 26 ML Feature Categories ─────────────── */
export const ML_FEATURE_CATEGORIES = [
  {
    category: "Cost-Related Features",
    count: 6,
    icon: IndianRupee,
    color: "#F27F0C",
    features: [
      { id: 1,  name: "log_original_cost",       desc: "Log-transformed baseline sanctioned cost (₹ Cr)" },
      { id: 2,  name: "cost_overrun_so_far_pct",  desc: "Cumulative cost revision percentage relative to sanction" },
      { id: 3,  name: "cost_already_revised",     desc: "Binary flag indicating whether prior cost revisions occurred" },
      { id: 4,  name: "expenditure_vs_revised",   desc: "Ratio of cumulative expenditure to anticipated revised cost" },
      { id: 5,  name: "cost_change_3m",           desc: "Cost variance acceleration velocity in past 3 reporting cycles" },
      { id: 6,  name: "cost_revisions_so_far",    desc: "Cumulative number of formal CCEA/Ministry sanction revisions" },
    ],
  },
  {
    category: "Time-Related Features",
    count: 6,
    icon: Clock,
    color: "#3B82F6",
    features: [
      { id: 7,  name: "approval_to_start_months", desc: "Administrative latency from cabinet sanction to ground mobilization" },
      { id: 8,  name: "approval_year",            desc: "Sanction epoch capturing inflation and macroeconomic policy shifts" },
      { id: 9,  name: "planned_duration_months",  desc: "Original baseline commissioning timeframe (months)" },
      { id: 10, name: "age_at_t_months",          desc: "Months elapsed since physical groundbreaking at cycle t" },
      { id: 11, name: "time_overrun_months",      desc: "Cumulative commissioning slippage beyond original DOC" },
      { id: 12, name: "deadline_revised_so_far",  desc: "Count of official commissioning date extensions granted" },
    ],
  },
  {
    category: "Progress-Related Features",
    count: 5,
    icon: TrendingUp,
    color: "#10B981",
    features: [
      { id: 13, name: "progress_pct",          desc: "Current authentic physical progress milestone achieved (%)" },
      { id: 14, name: "progress_vs_expected",  desc: "Linear progress shortfall gap against expected schedule curve (%)" },
      { id: 15, name: "progress_rate_3m",      desc: "Average monthly physical achievement velocity over last 3 cycles" },
      { id: 16, name: "progress_stall",        desc: "Binary flag detecting physical progress pace < 0.3% per month" },
      { id: 17, name: "doc_push_recent",       desc: "Indicator of commissioning deadline revisions in previous 2 cycles" },
    ],
  },
  {
    category: "Spending & Efficiency Features",
    count: 4,
    icon: Zap,
    color: "#8B5CF6",
    features: [
      { id: 18, name: "spend_vs_progress",       desc: "Discrepancy ratio between financial fund burn % and physical progress %" },
      { id: 19, name: "exp_per_pct",             desc: "Capital absorbed per 1% physical milestone completion (₹ Cr / %)" },
      { id: 20, name: "spend_rate_3m",           desc: "Quarterly capital disbursement velocity and absorption acceleration" },
      { id: 21, name: "total_doc_push_months",   desc: "Aggregate sum of all historical commissioning extensions" },
    ],
  },
  {
    category: "Project Context Features",
    count: 5,
    icon: Building2,
    color: "#EC4899",
    features: [
      { id: 22, name: "multi_state",          desc: "Binary flag indicating inter-state execution coordination friction" },
      { id: 23, name: "agency_freq",          desc: "Implementing agency historical frequency & institutional performance factor" },
      { id: 24, name: "sector_freq",          desc: "Sectoral risk weight (Roads, Railways, Petroleum, Power, Coal, etc.)" },
      { id: 25, name: "ministry_freq",        desc: "Ministry portfolio density and supervisory oversight capacity" },
      { id: 26, name: "months_to_revised_doc", desc: "Time remaining until anticipated revised Date of Commissioning" },
    ],
  },
];

/* ─────────────── PPT Slide 2 — 5-Stage Operational Pipeline ─────────────── */
export const PIPELINE_STAGES = [
  {
    step: "01",
    label: "PROJECT DATA",
    sub: "Collect & Integrate",
    icon: Database,
    color: "#053F5C",
    tag: "Data Lake",
    headline: "Central Ingestion of Longitudinal Multi-Format Records",
    details: "Project details, periodic progress, expenditure, and commissioning timelines ingested from PAIMANA CUF returns, PDFs, and ministry databases across 2,098 projects.",
    points: ["Longitudinal project master records", "Expenditure vs CapEx allocations", "Physical milestone returns"],
  },
  {
    step: "02",
    label: "AI ANALYSIS",
    sub: "Process & Analyze",
    icon: Cpu,
    color: "#429EBD",
    tag: "Data Engineering",
    headline: "Extracting 26 Multi-Dimensional Predictive Signals",
    details: "Analyzes cost, expenditure, physical progress, and schedule behavior over time. Computes progress stalls (<0.3%/mo) and spend-to-progress mismatch ratios.",
    points: ["3-Month progress velocity", "Spend-to-milestone burn mismatch", "Multi-state coordination flags"],
  },
  {
    step: "03",
    label: "RISK ENGINE",
    sub: "Predictive AI",
    icon: ShieldAlert,
    color: "#F27F0C",
    tag: "ML Ensemble",
    headline: "Dual-Target Machine Learning Risk Inference",
    details: "Estimates Delay Risk and Cost-Overrun Risk using trained Random Forest and XGBoost ensemble classifiers with 97.6% accuracy.",
    points: ["Cost escalation prediction", "Deadline slip probability", "SANKET Composite Risk Index (0–100)"],
  },
  {
    step: "04",
    label: "EXPLAINABLE ALERT",
    sub: "Why is it at risk?",
    icon: Lightbulb,
    color: "#F7AD19",
    tag: "XAI / SHAP",
    headline: "TreeSHAP Local Attributions & Transparent Drivers",
    details: "Highlights key risk patterns: progress vs time shortfall (-45.6%), spend vs progress lag, and deadline revisions. No black-box guesswork.",
    points: ["TreeSHAP feature impact bars", "Plain-language plaints for officers", "Confidence rating (High/Medium/Low)"],
  },
  {
    step: "05",
    label: "PRIORITIZED ACTION",
    sub: "Focus where it matters",
    icon: Target,
    color: "#10B981",
    tag: "Decision Support",
    headline: "Ranked Priority Watchlist & Statutory Directives",
    details: "Ranks projects by risk level into Critical, High, Medium, and Low tiers. Enables earlier, evidence-based administrative intervention.",
    points: ["Top-N critical priority watchlist", "Field notice & audit logging", "Continuous longitudinal tracking"],
  },
];

/* ─────────────── PPT Slide 4 — Real-World Challenges & Mitigations ─────────────── */
export const CHALLENGES_MITIGATION = [
  {
    challenge: "PDF extraction errors; missing or inconsistent fields in legacy returns",
    solution: "Use official structured data (PAIMANA/CRIP exports); automatically validate ranges and flag anomalous inputs before model ingestion.",
    icon: FileText,
    badge: "Data Integrity",
  },
  {
    challenge: "Explanations via risk patterns only (no explicit delay text reasons in data)",
    solution: "Display model prediction confidence (High/Medium/Low) and explain risk via measurable physical/financial patterns using simple, transparent models.",
    icon: Lightbulb,
    badge: "Explainability",
  },
  {
    challenge: "False positives/negatives; sector-specific thresholds (models can make mistakes)",
    solution: "Use SHAP TreeExplainer to attribute exact input feature contributions (e.g. spend vs progress gap) rather than guessing administrative causes.",
    icon: ShieldAlert,
    badge: "Accuracy & Trust",
  },
  {
    challenge: "Alert fatigue (officers overwhelmed when early warnings become noise)",
    solution: "Officers review and verify alerts before escalation; restrict priority watchlist to Top-N critical projects; maintain complete audit logs.",
    icon: Bell,
    badge: "Operational Hygiene",
  },
  {
    challenge: "Data security and administrative authority boundaries",
    solution: "Strict decision support principle: SANKET-AI suggests risks and priorities; final decisions and statutory interventions remain solely with authorized officers.",
    icon: ShieldCheck,
    badge: "Governance",
  },
];

/* ─────────────── PPT Slide 6 — Capability Comparison Matrix ─────────────── */
export const CAPABILITIES_TABLE = [
  { label: "Cost & Expenditure Tracking",       paimana: true,  sanket: true  },
  { label: "Physical Progress Tracking",         paimana: true,  sanket: true  },
  { label: "Deadline Prediction",                paimana: false, sanket: true  },
  { label: "Uses Only Official MoSPI Data",      paimana: true,  sanket: true  },
  { label: "High Risk Prediction",               paimana: false, sanket: true  },
  { label: "Cost Escalation Prediction",         paimana: false, sanket: true  },
  { label: "Prioritized / Ranked Watchlisting",  paimana: false, sanket: true  },
  { label: "Explainable AI & SHAP",              paimana: false, sanket: true  },
  { label: "Early Warning System",               paimana: false, sanket: true  },
  { label: "Machine Learning (XGBoost / RF)",    paimana: false, sanket: true  },
  { label: "CUF Creation / Submission",          paimana: true,  sanket: true  },
  { label: "Automated Decision Support System",  paimana: false, sanket: true  },
  { label: "Flash Report Evaluation",            paimana: true,  sanket: true  },
];
