import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, TrendingUp, ExternalLink, Info, FileSpreadsheet,
  Sliders, CheckCircle2, AlertTriangle, Play, Sparkles,
  Database, Cpu, GitBranch, Layers, ShieldCheck, Search,
  Calendar, Building2, MapPin, Gauge, Activity, ArrowUpRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
import Layout from "../components/Layout";
import ProgressBar from "../components/ProgressBar";
import { apiService } from "../services/api";
import { useTheme } from "../context/ThemeContext";

// Custom Theme-Adaptive Tooltip for TreeSHAP Parameter Attributions
function CustomShapTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#053F5C] p-3 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/40 shadow-xl text-xs transition-colors pointer-events-none max-w-xs">
        <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-[#E7E5E4] dark:border-[#429EBD]/20">
          <span className="font-bold text-[#1C1917] dark:text-white text-xs">
            {data.factor}
          </span>
          {data.key && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAF7F4] dark:bg-[#031e2d] text-[#053F5C] dark:text-[#9FE7F5] border border-[#E7E5E4] dark:border-[#429EBD]/30 font-semibold">
              {data.key}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-[#78716C] dark:text-slate-300">Parameter Value:</span>
          <strong className="font-mono text-sm text-[#F27F0C] dark:text-[#F7AD19] font-black">
            {data.rawValue}
          </strong>
        </div>
        {data.message && (
          <p className="text-[11px] text-[#44403C] dark:text-slate-200 leading-relaxed font-medium mt-1 pt-1 border-t border-[#E7E5E4] dark:border-[#429EBD]/20">
            "{data.message}"
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function AIPrediction({ user }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("existing"); // 'existing' | 'cuf_simulator' | 'data_provenance'

  // Master live project list
  const [projectsList, setProjectsList] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("400010");

  // Live AI Prediction, SHAP Explainability & Explanation State
  const [prediction, setPrediction] = useState(null);
  const [shapDrivers, setShapDrivers] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [predictionError, setPredictionError] = useState(null);

  const [filterTier, setFilterTier] = useState("all"); // 'all' | 'high' | 'medium' | 'low'
  const [searchQuery, setSearchQuery] = useState("");
  const [animated, setAnimated] = useState(false);

  // CUF Form state - Authentic ML Parameters from Dataset
  const [cufMinistry, setCufMinistry] = useState("Ministry of Road Transport & Highways");
  const [cufAgency, setCufAgency] = useState("NHAI");
  const [cufApprovedCost, setCufApprovedCost] = useState("2400");
  const [cufExpenditure, setCufExpenditure] = useState("1650");
  const [cufPhysicalProgress, setCufPhysicalProgress] = useState("45");
  const [cufMonthsToDoc, setCufMonthsToDoc] = useState("8");
  const [cufTimeOverrun, setCufTimeOverrun] = useState("0");
  const [cufCostRevisions, setCufCostRevisions] = useState("1");
  const [cufSpendRate3m, setCufSpendRate3m] = useState("14.5");
  const [cufProgressStall, setCufProgressStall] = useState(false);
  const [cufEvaluating, setCufEvaluating] = useState(false);
  const [cufResult, setCufResult] = useState(null);

  // Fetch verified project roster on mount
  useEffect(() => {
    let isCurrent = true;
    apiService.getProjects({ pageSize: 100 })
      .then(res => {
        if (!isCurrent) return;
        const list = res.data || res.projects || [];
        setProjectsList(list);
        setProjectsLoading(false);
        if (list.length > 0) {
          const hasSelected = list.some(p => String(p.id || p.projectId) === String(selectedId));
          if (!hasSelected) {
            setSelectedId(String(list[0].id || list[0].projectId));
          }
        }
      })
      .catch(() => {
        if (!isCurrent) return;
        setProjectsList([]);
        setProjectsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Fetch live AI prediction, TreeSHAP drivers, and explanation when selectedId changes
  useEffect(() => {
    let isCurrent = true;
    if (!selectedId) return;

    setPredictionLoading(true);
    setPredictionError(null);
    setPrediction(null);
    setShapDrivers([]);
    setExplanation(null);

    Promise.allSettled([
      apiService.getPrediction(selectedId),
      apiService.getShapDrivers(selectedId),
      apiService.getExplanation(selectedId),
    ]).then(([predRes, shapRes, explRes]) => {
      if (!isCurrent) return;
      setPredictionLoading(false);

      if (predRes.status === "fulfilled" && predRes.value) {
        setPrediction(predRes.value);
      } else {
        setPredictionError("AI risk prediction is currently unavailable for this project.");
      }

      if (shapRes.status === "fulfilled" && Array.isArray(shapRes.value)) {
        setShapDrivers(shapRes.value);
      }

      if (explRes.status === "fulfilled" && explRes.value) {
        setExplanation(explRes.value);
      }
    }).catch((err) => {
      // BUG-007 FIX: catch errors thrown inside the .then() callback itself
      if (!isCurrent) return;
      setPredictionError("Failed to process prediction data.");
      console.error("[AIPrediction] Promise.allSettled callback error:", err);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedId]);

  const agencyFrequencyMap = {
    "MoRTH": 2485,
    "NHIDCL": 1264,
    "NHAI": 1166,
    "NLC India Limited [NLCIL]": 105,
    "Hindustan Petroleum Corporation Limited": 77,
    "National Aluminium Company Limited [NALCO]": 56,
    "North Eastern Electric Power Corporation": 30,
    "Ministry of Railways / CAO": 16,
    "Employee's State Insurance Company [ESIC]": 6
  };

  const handleRunCUFSimulation = async (e) => {
    e.preventDefault();
    setCufEvaluating(true);
    const res = await apiService.predictCUFRisk({
      approvedCost: parseFloat(cufApprovedCost) || 1000,
      expenditure: parseFloat(cufExpenditure) || 500,
      physicalProgress: parseFloat(cufPhysicalProgress) || 50,
      monthsToDoc: parseFloat(cufMonthsToDoc) || 8,
      timeOverrunMonths: parseFloat(cufTimeOverrun) || 0,
      costRevisionsSoFar: parseInt(cufCostRevisions) || 0,
      spendRate3m: parseFloat(cufSpendRate3m) || 10,
      progressStall: cufProgressStall,
      ministry: cufMinistry,
      agency: cufAgency,
      agencyFreq: agencyFrequencyMap[cufAgency] || 1166
    });
    setCufResult(res);
    setCufEvaluating(false);
  };

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [selectedId]);

  // Filtered project list for selector
  const filteredProjects = projectsList.filter(p => {
    const pRisk = (p.riskLevel || "").toLowerCase();
    if (filterTier === "high" && pRisk !== "high") return false;
    if (filterTier === "medium" && pRisk !== "medium") return false;
    if (filterTier === "low" && pRisk !== "low") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || "").toLowerCase().includes(q);
      const matchId = String(p.id || p.projectId || "").toLowerCase().includes(q);
      const matchMin = (p.ministry || "").toLowerCase().includes(q);
      const matchState = (p.state || "").toLowerCase().includes(q);
      const matchSec = (p.sector || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchMin && !matchState && !matchSec) return false;
    }
    return true;
  });

  const highCount = projectsList.filter(p => (p.riskLevel || "").toLowerCase() === "high").length;
  const mediumCount = projectsList.filter(p => (p.riskLevel || "").toLowerCase() === "medium").length;
  const lowCount = projectsList.filter(p => (p.riskLevel || "").toLowerCase() === "low").length;

  // Selected project metadata
  const currentProject = projectsList.find(p => String(p.id || p.projectId) === String(selectedId)) || {
    id: selectedId,
    projectId: selectedId,
    name: prediction?.projectName || `Project ${selectedId}`,
    ministry: "Central Ministry",
    state: "National",
    sector: "Infrastructure"
  };

  // Authentic ML Model Output Parameters (Percentages 0-100)
  const costProbNum = prediction?.costEscalationProbability != null ? Number(prediction.costEscalationProbability) : 0;
  const timeProbNum = prediction?.deadlineSlipProbability != null ? Number(prediction.deadlineSlipProbability) : 0;
  const costProbPct = costProbNum.toFixed(1);
  const timeProbPct = timeProbNum.toFixed(1);
  const riskScoreNum = prediction?.riskScore != null ? Number(prediction.riskScore) : (currentProject.riskScore != null ? Number(currentProject.riskScore) : 0);
  const riskLevel = prediction?.riskLevel || currentProject.riskLevel || "Medium";
  const modelVersion = prediction?.modelVersion || "risk-model-v1.0";
  const predictionMethod = prediction?.predictionMethod || "Random Forest + TreeSHAP";
  const asOfMonth = currentProject.reportingMonth || "2026-07";

  // Dynamic risk classifications triggered by model
  const riskTypes = [];
  if (costProbNum >= 15) riskTypes.push("COST_ESCALATION_RISK");
  if (timeProbNum >= 15) riskTypes.push("DEADLINE_SLIPPAGE_RISK");
  if (riskScoreNum >= 40) riskTypes.push("CRITICAL_PATH_EXPOSURE");

  // Dynamic risk color styling based on authentic risk level
  const riskTheme = (riskLevel.toUpperCase() === "HIGH" || riskLevel.toUpperCase() === "CRITICAL")
    ? {
      label: "HIGH RISK",
      badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/60",
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-[#031e2d] border-red-200 dark:border-red-900/50",
      indicator: "bg-red-500"
    }
    : riskLevel.toUpperCase() === "MEDIUM"
      ? {
        label: "MEDIUM RISK",
        badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60",
        text: "text-[#F27F0C] dark:text-[#F7AD19]",
        bg: "bg-amber-50/60 dark:bg-[#031e2d] border-amber-200 dark:border-amber-900/50",
        indicator: "bg-amber-500"
      }
      : {
        label: "LOW RISK",
        badge: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50/60 dark:bg-[#031e2d] border-emerald-200 dark:border-emerald-900/50",
        indicator: "bg-emerald-500"
      };

  // Recharts horizontal data for TreeSHAP drivers from real backend API
  const activeDrivers = shapDrivers.length > 0 ? shapDrivers : (prediction?.topRiskDrivers || []);
  const shapData = activeDrivers.map((driver, idx) => ({
    factor: driver.factor,
    key: driver.feature,
    value: Math.abs(driver.weight),
    rawValue: driver.shapValue !== undefined ? driver.shapValue : driver.weight,
    message: driver.evidence,
    impact: driver.impact,
    direction: driver.direction,
    idx
  }));

  return (
    <Layout
      user={user}
      title="SANKET-AI Predictive Risk Engine"
      subtitle="Operational ML Multi-Target Inferencing using XGBoost Classifiers with TreeSHAP Root-Cause Explainability."
    >
      {/* Top Header Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/30">
          <button
            onClick={() => setActiveTab("existing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "existing"
              ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold"
              : "text-[#78716C] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white"
              }`}
          >
            <Brain size={14} className={activeTab === "existing" ? "text-[#F27F0C] dark:text-[#9FE7F5]" : ""} />
            Authentic ML Predictions ({projectsList.length > 0 ? `${projectsList.length} Projects` : 'Live API'})
          </button>
          <button
            onClick={() => setActiveTab("cuf_simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "cuf_simulator"
              ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold"
              : "text-[#78716C] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white"
              }`}
          >
            <FileSpreadsheet size={14} className={activeTab === "cuf_simulator" ? "text-[#F27F0C] dark:text-[#9FE7F5]" : ""} />
            CUF Inference Simulator
          </button>
          <button
            onClick={() => setActiveTab("data_provenance")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === "data_provenance"
              ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold"
              : "text-[#78716C] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white"
              }`}
          >
            <Database size={14} className={activeTab === "data_provenance" ? "text-[#429EBD] dark:text-[#9FE7F5]" : ""} />
            Data Provenance & Model Architecture
          </button>
        </div>

        {/* Global ML Model Metadata Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#053F5C] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 text-xs">
          <Cpu size={13} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
          <span className="text-[#78716C] dark:text-slate-300 font-medium">Model:</span>
          <span className="font-mono font-bold text-[#1C1917] dark:text-white">{modelVersion}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-[#78716C] dark:text-slate-300 font-medium">Cycle:</span>
          <span className="font-mono font-semibold text-[#053F5C] dark:text-[#9FE7F5]">{asOfMonth}</span>
        </div>
      </div>

      {activeTab === "existing" ? (
        <>
          {/* Project Selector & Search Filter Bar */}
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-4 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 transition-colors">
            <div className="flex flex-col gap-3">
              {/* Row 1: Filter Pills & Search */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Risk Level Filter Tabs */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#78716C] dark:text-slate-300 mr-1 hidden sm:inline">Filter:</span>
                  <button
                    onClick={() => setFilterTier("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterTier === "all"
                      ? "bg-[#053F5C] text-white dark:bg-[#429EBD] dark:text-[#031e2d] font-bold"
                      : "bg-[#F5F5F4] dark:bg-[#031e2d] text-[#78716C] dark:text-slate-300 hover:text-[#1C1917]"
                      }`}
                  >
                    All ({projectsList.length})
                  </button>
                  <button
                    onClick={() => setFilterTier("high")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterTier === "high"
                      ? "bg-red-600 text-white font-bold"
                      : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-900/40"
                      }`}
                  >
                    High Risk ({highCount})
                  </button>
                  <button
                    onClick={() => setFilterTier("medium")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterTier === "medium"
                      ? "bg-[#F27F0C] text-white font-bold"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40"
                      }`}
                  >
                    Medium Risk ({mediumCount})
                  </button>
                  <button
                    onClick={() => setFilterTier("low")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterTier === "low"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40"
                      }`}
                  >
                    Low Risk ({lowCount})
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by project name, state, or ministry..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                  />
                </div>
              </div>

              {/* Row 2: Dropdown Select of Filtered Projects */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-[#E7E5E4] dark:border-[#429EBD]/20">
                <label className="text-xs font-bold text-[#1C1917] dark:text-white flex-shrink-0 flex items-center gap-1.5">
                  <Activity size={14} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
                  Active ML Target Project:
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex-1 text-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2 outline-none focus:border-[#F27F0C] text-[#1C1917] dark:text-white bg-[#FAF7F4] dark:bg-[#031e2d] font-medium cursor-pointer"
                >
                  {filteredProjects.map((p) => {
                    const pId = String(p.id || p.projectId);
                    return (
                      <option key={pId} value={pId}>
                        [{p.riskLevel || 'Medium'} · Score {p.riskScore != null ? p.riskScore : '—'}] {p.name} ({p.state || p.ministry})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Active Project Meta Banner */}
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-4 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${riskTheme.badge}`}>
                    {riskTheme.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#F5F5F4] dark:bg-[#031e2d] text-[#78716C] dark:text-slate-300 font-mono">
                    ID: {String(currentProject.id || currentProject.projectId || selectedId).split("|")[0]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[#F5F5F4] dark:bg-[#031e2d] text-[#053F5C] dark:text-[#9FE7F5] font-semibold">
                    {currentProject.sector}
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#1C1917] dark:text-white">
                  {currentProject.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#78716C] dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-[#429EBD]" /> {currentProject.ministry}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#F27F0C]" /> {currentProject.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-[#78716C] dark:text-slate-400" /> MoSPI Cycle: {asOfMonth}
                  </span>
                </div>
              </div>

              {/* Risk Types Badges */}
              <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
                <span className="text-[11px] font-semibold text-[#78716C] dark:text-slate-400 uppercase tracking-wider">
                  Triggered ML Risk Classifications
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {riskTypes.length > 0 ? (
                    riskTypes.map((rt, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center gap-1"
                      >
                        <AlertTriangle size={12} /> {rt.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 size={12} /> NORMAL EXECUTION TRAJECTORY
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controlled Loading & Error States for Live AI Prediction */}
          {predictionLoading ? (
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-12 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm text-center mb-5">
              <div className="w-8 h-8 border-3 border-[#F27F0C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1C1917] dark:text-white">Loading Live AI Risk Prediction & TreeSHAP Explainability...</p>
              <p className="text-xs text-[#78716C] dark:text-slate-400 mt-1">Executing multi-target inferencing for Project {selectedId}</p>
            </div>
          ) : predictionError ? (
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-12 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm text-center mb-5">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-[#F27F0C] rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={20} />
              </div>
              <p className="text-sm font-bold text-[#1C1917] dark:text-white">{predictionError}</p>
              <p className="text-xs text-[#78716C] dark:text-slate-400 mt-1">No verified inference record returned by the AI engine for this identifier.</p>
            </div>
          ) : (
            <>
              {/* Executive Explanation Block if Available */}
              {explanation?.whyFlagged && (
                <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-4 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={16} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
                    <h3 className="font-bold text-[#1C1917] dark:text-white text-xs">Official AI Executive Explanation:</h3>
                  </div>
                  <p className="text-xs text-[#44403C] dark:text-slate-200 leading-relaxed font-medium pl-6 border-l-2 border-[#F27F0C]">
                    "{explanation.whyFlagged}"
                  </p>
                </div>
              )}

              {/* Primary Real ML Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Real Cost Overrun Probability */}
                <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <p className="text-xs font-bold text-[#78716C] dark:text-slate-300 uppercase tracking-wider">
                          Cost Overrun Probability (ML)
                        </p>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] dark:text-slate-400 mt-0.5">
                        Multi-target XGBoost Classifier · Feature Key: <code className="text-[#053F5C] dark:text-[#9FE7F5]">cost_overrun_probability</code>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center justify-center border border-red-100 dark:border-red-900/40">
                      <TrendingUp size={19} className="text-red-500" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-red-600 dark:text-red-400">
                      {costProbPct}%
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${costProbNum >= 50
                      ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                      : costProbNum > 10
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                      }`}>
                      {costProbNum >= 50 ? "High Escalation Likelihood" : costProbNum > 10 ? "Moderate Escalation" : "Negligible Escalation Risk"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#78716C] dark:text-slate-300">
                      <span className="font-mono">P(Cost Overrun &gt; 0)</span>
                      <span className="font-medium text-[#1C1917] dark:text-white">
                        Value: <strong className="font-mono">{(costProbNum / 100).toFixed(4)}</strong> (0.0 to 1.0 scale)
                      </span>
                    </div>
                    <div className="h-3 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-full overflow-hidden p-0.5">
                      {animated && (
                        <div
                          className="h-2 bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(4, Math.min(100, costProbNum))}%` }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A8A29E] dark:text-slate-400 pt-1">
                      <span>Engine: <code>xgboost_v1</code></span>
                      <span>Target: <code>target_cost_overrun_binary</code></span>
                    </div>
                  </div>
                </div>

                {/* Real Time Overrun (Schedule Delay) Probability */}
                <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors relative overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F27F0C] animate-pulse" />
                        <p className="text-xs font-bold text-[#78716C] dark:text-slate-300 uppercase tracking-wider">
                          Schedule Delay Probability (ML)
                        </p>
                      </div>
                      <p className="text-[11px] text-[#A8A29E] dark:text-slate-400 mt-0.5">
                        Multi-target XGBoost Classifier · Feature Key: <code className="text-[#053F5C] dark:text-[#9FE7F5]">time_overrun_probability</code>
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-900/40">
                      <Brain size={19} className="text-[#F27F0C]" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-5xl font-black text-[#F27F0C] dark:text-[#F7AD19]">
                      {timeProbPct}%
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${timeProbNum >= 70
                      ? "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                      : timeProbNum >= 30
                        ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300"
                      }`}>
                      {timeProbNum >= 70 ? "Critical Deadline Slippage" : timeProbNum >= 30 ? "Moderate Delay Risk" : "On-Time Trajectory"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-[#78716C] dark:text-slate-300">
                      <span className="font-mono">P(Time Overrun &gt; 0)</span>
                      <span className="font-medium text-[#1C1917] dark:text-white">
                        Value: <strong className="font-mono">{(timeProbNum / 100).toFixed(4)}</strong> (0.0 to 1.0 scale)
                      </span>
                    </div>
                    <div className="h-3 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-full overflow-hidden p-0.5">
                      {animated && (
                        <div
                          className="h-2 bg-gradient-to-r from-amber-400 to-[#F27F0C] rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(4, Math.min(100, timeProbNum))}%` }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#A8A29E] dark:text-slate-400 pt-1">
                      <span>Engine: <code>xgboost_v1</code></span>
                      <span>Target: <code>target_time_overrun_binary</code></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Composite Score Card & Real TreeSHAP Explainability Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
                {/* Composite ML Risk Score Card */}
                <div className={`lg:col-span-4 rounded-2xl p-6 border shadow-sm flex flex-col justify-between ${riskTheme.bg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-[#78716C] dark:text-slate-400 uppercase tracking-wider">
                        Composite ML Risk Score
                      </p>
                      <span className={`w-2.5 h-2.5 rounded-full ${riskTheme.indicator}`} />
                    </div>
                    <p className={`text-2xl font-black mb-1 ${riskTheme.text}`}>
                      {riskTheme.label}
                    </p>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className={`text-6xl font-black tracking-tight ${riskTheme.text}`}>
                        {riskScoreNum}
                      </span>
                      <span className="text-lg font-bold text-[#78716C] dark:text-slate-400">/ 100</span>
                    </div>
                    <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed mb-4">
                      Calculated from multi-objective loss function combining binary classification probabilities, historical agency track record, and milestone lag penalties.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-[#E7E5E4] dark:border-[#429EBD]/20 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#78716C] dark:text-slate-400">Inference Engine</span>
                      <span className="font-mono font-bold text-[#1C1917] dark:text-white">{predictionMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C] dark:text-slate-400">Active SHAP Drivers</span>
                      <span className="font-semibold text-[#1C1917] dark:text-white">{activeDrivers.length} High-Impact Variables</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#78716C] dark:text-slate-400">Audit Status</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">MoSPI Verified Dataset</span>
                    </div>
                  </div>
                </div>

                {/* Real TreeSHAP Feature Attributions Bar Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-[#1C1917] dark:text-white text-sm flex items-center gap-2">
                        <Sparkles size={16} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
                        TreeSHAP Parameter Attributions (Real Drivers)
                      </h3>
                      <p className="text-xs text-[#78716C] dark:text-slate-300">
                        Exact parameter magnitudes driving this project's risk inference in model <code>{modelVersion}</code>
                      </p>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-[#F5F5F4] dark:bg-[#031e2d] text-[#053F5C] dark:text-[#9FE7F5] font-mono">
                      SHAP Absolute Value
                    </span>
                  </div>

                  {shapData.length > 0 ? (
                    <div className="mt-2">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={shapData}
                          layout="vertical"
                          margin={{ left: 20, right: 30, top: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" className="dark:opacity-10" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 11, fill: "#A8A29E" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="factor"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            width={150}
                          />
                          <Tooltip
                            content={<CustomShapTooltip />}
                            cursor={{ fill: isDark ? "rgba(66, 158, 189, 0.08)" : "rgba(5, 63, 92, 0.04)" }}
                          />
                          <Bar dataKey="value" name="Parameter Magnitude" radius={[0, 6, 6, 0]}>
                            {shapData.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={
                                  entry.direction === "decreases_risk"
                                    ? "#10B981"
                                    : idx === 0
                                      ? "#DC2626"
                                      : idx === 1
                                        ? "#F27F0C"
                                        : idx === 2
                                          ? "#429EBD"
                                          : "#053F5C"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-xs text-[#78716C] dark:text-slate-400">
                      Explainability data is currently unavailable.
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed TreeSHAP Risk Drivers Cards with Real Values & Messages */}
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-[#1C1917] dark:text-white text-sm flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#429EBD] dark:text-[#9FE7F5]" />
                      Real ML Parameters & Model Interpretation Messages
                    </h3>
                    <p className="text-xs text-[#78716C] dark:text-slate-300">
                      Direct output from <code>top_risk_drivers</code> in the ML inference JSON object.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#78716C] dark:text-slate-400">
                    Method: <strong>{predictionMethod}</strong>
                  </span>
                </div>

                {activeDrivers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDrivers.map((driver, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-[#053F5C] text-[#053F5C] dark:text-[#9FE7F5] border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold">
                              {driver.feature || `driver-${idx + 1}`}
                            </span>
                            <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mt-1">
                              {driver.factor}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${
                              driver.impact === "High"
                                ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50"
                                : driver.impact === "Medium"
                                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
                                  : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            }`}>
                              {driver.impact} Impact
                            </span>
                            <p className="text-lg font-black font-mono text-[#053F5C] dark:text-[#9FE7F5] mt-1">
                              {driver.weight}%
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#E7E5E4] dark:border-[#429EBD]/20">
                          <p className="text-xs text-[#44403C] dark:text-slate-200 leading-relaxed font-medium">
                            "{driver.evidence}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-[#78716C] dark:text-slate-400">
                    Explainability data is currently unavailable.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : activeTab === "cuf_simulator" ? (
        /* CUF Simulator Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CUF Input Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
              <h3 className="font-bold text-[#1C1917] dark:text-white">Common Upload Form (CUF) ML Simulator</h3>
            </div>
            <p className="text-xs text-[#78716C] dark:text-slate-300 mb-5">
              Simulate any upcoming infrastructure project by supplying authentic MoSPI feature parameters to the trained XGBoost model.
            </p>

            <form onSubmit={handleRunCUFSimulation} className="space-y-4 text-xs">
              {/* Section 1: Agency & Administrative Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1">
                    Ministry / Sponsoring Department
                  </label>
                  <select
                    value={cufMinistry}
                    onChange={(e) => setCufMinistry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 text-xs bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                  >
                    <option>Ministry of Road Transport & Highways</option>
                    <option>Ministry of Railways</option>
                    <option>Ministry of Power</option>
                    <option>Ministry of Coal</option>
                    <option>Ministry of Petroleum & Natural Gas</option>
                    <option>Ministry of Mines</option>
                    <option>Ministry of Labour and Employment</option>
                    <option>Department of Higher Education</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Implementing Agency</span>
                    <span className="text-[10px] text-[#053F5C] dark:text-[#9FE7F5] font-mono">Feature: agency_freq</span>
                  </label>
                  <select
                    value={cufAgency}
                    onChange={(e) => setCufAgency(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 text-xs bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                  >
                    <option value="NHAI">NHAI · National Highways Authority (1,166 projects)</option>
                    <option value="NHIDCL">NHIDCL · Highways Infrastructure Dev (1,264 projects)</option>
                    <option value="MoRTH">MoRTH · State PWD Highways (2,485 projects)</option>
                    <option value="Ministry of Railways / CAO">Ministry of Railways / CAO Construction (16 projects)</option>
                    <option value="NLC India Limited [NLCIL]">NLC India Limited [NLCIL] (105 projects)</option>
                    <option value="Hindustan Petroleum Corporation Limited">HPCL · Hindustan Petroleum (77 projects)</option>
                    <option value="National Aluminium Company Limited [NALCO]">NALCO · National Aluminium (56 projects)</option>
                    <option value="North Eastern Electric Power Corporation">NEEPCO · Electric Power Corp (30 projects)</option>
                    <option value="Employee's State Insurance Company [ESIC]">ESIC · Hospital Infrastructure (6 projects)</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Capital Scale & Spending Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1">
                    Approved Cost (₹ Cr)
                  </label>
                  <input
                    type="number"
                    value={cufApprovedCost}
                    onChange={(e) => setCufApprovedCost(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    placeholder="e.g. 2400"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1">
                    Cumulative Spend (₹ Cr)
                  </label>
                  <input
                    type="number"
                    value={cufExpenditure}
                    onChange={(e) => setCufExpenditure(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    placeholder="e.g. 1650"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Spending Rate (3M)</span>
                    <span className="text-[10px] text-[#F27F0C] font-mono">₹ Cr/mo</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cufSpendRate3m}
                    onChange={(e) => setCufSpendRate3m(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    placeholder="e.g. 14.5"
                    required
                  />
                </div>
              </div>

              {/* Section 3: Physical Progress & Schedule Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Physical Progress</span>
                    <span className="text-[10px] text-[#053F5C] dark:text-[#9FE7F5] font-mono">% (progress_pct)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={cufPhysicalProgress}
                    onChange={(e) => setCufPhysicalProgress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Months to Deadline</span>
                    <span className="text-[10px] text-[#053F5C] dark:text-[#9FE7F5] font-mono">months_to_revised_doc</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={cufMonthsToDoc}
                    onChange={(e) => setCufMonthsToDoc(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    placeholder="e.g. 8"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Time Overrun</span>
                    <span className="text-[10px] text-[#053F5C] dark:text-[#9FE7F5] font-mono">time_overrun_months</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={cufTimeOverrun}
                    onChange={(e) => setCufTimeOverrun(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Section 4: Cost Revisions & Site Momentum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#44403C] dark:text-slate-200 mb-1 flex items-center justify-between">
                    <span>Repeat Cost Revisions (Count)</span>
                    <span className="text-[10px] text-[#053F5C] dark:text-[#9FE7F5] font-mono">cost_revisions_so_far</span>
                  </label>
                  <select
                    value={cufCostRevisions}
                    onChange={(e) => setCufCostRevisions(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 text-xs bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C]"
                  >
                    <option value="0">0 Revisions (Original Budget Intact)</option>
                    <option value="1">1 Revision (Prior Formal Cost Revision Approved)</option>
                    <option value="2">2 Revisions (Multiple Sunk Cost Escalations)</option>
                    <option value="3">3+ Revisions (Chronic Structural Escalation)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#1C1917] dark:text-white flex items-center gap-1.5">
                      <span>Physical Progress Stalled</span>
                      <span className="text-[10px] text-[#F27F0C] font-mono font-normal">progress_stall</span>
                    </p>
                    <p className="text-[11px] text-[#78716C] dark:text-slate-300">
                      Zero physical progress movement in past 2 reporting cycles.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cufProgressStall}
                    onChange={(e) => setCufProgressStall(e.target.checked)}
                    className="w-4 h-4 accent-[#F27F0C] cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cufEvaluating}
                className="w-full py-3 bg-[#F27F0C] hover:bg-[#d96e08] text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {cufEvaluating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing XGBoost ML Inference...
                  </span>
                ) : (
                  <>
                    <Play size={14} className="fill-white" /> Run SANKET-AI Inferencing
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CUF Prediction Output */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {cufResult ? (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm flex-1 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#F27F0C] dark:text-[#9FE7F5] uppercase tracking-wider">
                    Model: {cufResult.modelVersion || "risk-model-v1.0"}
                  </span>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-mono">
                    {cufResult.predictionMethod || "xgboost_v1 + shap"}
                  </span>
                </div>

                <div className="text-center py-4 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/20 mb-5">
                  <p className="text-xs text-[#78716C] dark:text-slate-300 font-medium">Composite ML Risk Score</p>
                  <p className={`text-5xl font-black mt-1 ${cufResult.overallRisk > 70 ? "text-red-600 dark:text-red-400" : cufResult.overallRisk > 35 ? "text-[#F27F0C] dark:text-[#F7AD19]" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {cufResult.overallRisk}
                    <span className="text-base text-[#78716C] dark:text-slate-400">/100</span>
                  </p>
                  <span className={`inline-block mt-2 text-xs font-extrabold px-3 py-1 rounded-full ${cufResult.overallRisk > 70 ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50" : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50"
                    }`}>
                    {cufResult.riskLevel} Risk Project
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-red-800 dark:text-red-300">Cost Overrun Prob</p>
                    <p className="text-xl font-black text-red-600 dark:text-red-400">{cufResult.costRisk}%</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">XGBoost (cost_overrun)</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300">Time Overrun Prob</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{cufResult.timeRisk}%</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">XGBoost (time_overrun)</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#1C1917] dark:text-white mb-2">SHAP Risk Attributions:</p>
                  <div className="space-y-2">
                    {cufResult.topDrivers.map((driver, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2.5 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-lg border border-[#E7E5E4] dark:border-[#429EBD]/20">
                        <div>
                          <span className="font-bold text-[#1C1917] dark:text-white">{driver.name}</span>
                          {driver.key && (
                            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-[#053F5C] text-[#053F5C] dark:text-[#9FE7F5] border border-slate-200 dark:border-slate-700">
                              {driver.key}
                            </span>
                          )}
                          <p className="text-[11px] text-[#78716C] dark:text-slate-300 mt-0.5">{driver.weight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-8 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm text-center flex-1 flex flex-col items-center justify-center transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#FEF0E7] dark:bg-[#031e2d] flex items-center justify-center text-[#F27F0C] dark:text-[#9FE7F5] border border-[#FDDFCC] dark:border-[#429EBD]/30 mb-3">
                  <FileSpreadsheet size={24} />
                </div>
                <h4 className="font-bold text-[#1C1917] dark:text-white text-sm">CUF Evaluator Ready</h4>
                <p className="text-xs text-[#78716C] dark:text-slate-300 mt-1 max-w-xs leading-relaxed">
                  Fill out the parameters on the left and click <strong>"Run SANKET-AI Inferencing"</strong> to generate multi-target predictions.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Data Provenance & Model Architecture Tab */
        <div className="space-y-6">
          {/* Executive Architecture Header */}
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Database size={18} className="text-[#429EBD] dark:text-[#9FE7F5]" />
              <h3 className="text-base font-bold text-[#1C1917] dark:text-white">
                Data Provenance, Pipeline Lineage & Model Architecture
              </h3>
            </div>
            <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed max-w-4xl">
              The <strong>SANKET-AI ML Pipeline</strong> ingests monthly infrastructure project monitoring reports from the Ministry of Statistics & Programme Implementation (MoSPI) Online Computerized Monitoring System (OCMS). Raw project records are transformed into 18 standardized quantitative features and evaluated by dual XGBoost gradient boosting classifiers with TreeSHAP local explainability.
            </p>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-black text-sm mb-3">
                01
              </div>
              <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1">MoSPI OCMS Ingestion</h4>
              <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed">
                Extracts monthly Flash Reports for all central sector infrastructure projects costing ₹150+ Crore across 17 ministries.
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#F27F0C] dark:text-[#F7AD19] flex items-center justify-center font-black text-sm mb-3">
                02
              </div>
              <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1">Feature Engineering</h4>
              <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed">
                Transforms raw dates, budgets, and physical milestones into 18 normalized ratios (e.g. <code>spend_rate_3m</code>, <code>agency_freq</code>).
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black text-sm mb-3">
                03
              </div>
              <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1">Dual XGBoost Models</h4>
              <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed">
                Trained on 20+ years of historical outturns to compute independent probabilities for cost overrun and schedule slippage.
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-black text-sm mb-3">
                04
              </div>
              <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1">TreeSHAP Explainability</h4>
              <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed">
                Deconstructs the black-box risk score into exact additive parameter contributions and plain-language bottleneck explanations.
              </p>
            </div>
          </div>

          {/* Complete 18 Real ML Feature Parameter Reference Table */}
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
            <h4 className="font-bold text-sm text-[#1C1917] dark:text-white mb-1 flex items-center gap-2">
              <Layers size={16} className="text-[#F27F0C] dark:text-[#9FE7F5]" />
              Real ML Features & Mathematical Definitions (18 Parameters)
            </h4>
            <p className="text-xs text-[#78716C] dark:text-slate-300 mb-4">
              These are the authentic feature variables ingested by <code>risk-model-v1.0</code> to compute <code>risk_score</code>, <code>cost_overrun_probability</code>, and <code>time_overrun_probability</code>.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-white border-b border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">Feature Key</th>
                    <th className="py-2.5 px-3 font-bold">Human Label</th>
                    <th className="py-2.5 px-3 font-bold">Domain & Unit</th>
                    <th className="py-2.5 px-3 font-bold">Model Interpretation & Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4] dark:divide-[#429EBD]/20 text-[#44403C] dark:text-slate-200">
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">progress_pct</td>
                    <td className="py-2 px-3 font-medium">Current Progress</td>
                    <td className="py-2 px-3">0.0 to 100.0%</td>
                    <td className="py-2 px-3">Cumulative reported physical completion milestone percentage.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">time_overrun_months</td>
                    <td className="py-2 px-3 font-medium">Time Overrun</td>
                    <td className="py-2 px-3">Months (integer)</td>
                    <td className="py-2 px-3">Number of calendar months elapsed past the original approved Date of Commissioning (DOC).</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">months_to_revised_doc</td>
                    <td className="py-2 px-3 font-medium">Months to Deadline</td>
                    <td className="py-2 px-3">Months (+ / -)</td>
                    <td className="py-2 px-3">Time remaining to revised completion target. Negative values indicate active schedule breach.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">cost_overrun_so_far_pct</td>
                    <td className="py-2 px-3 font-medium">Cost Overrun So Far</td>
                    <td className="py-2 px-3">Percentage (%)</td>
                    <td className="py-2 px-3">Share by which the latest revised sanctioned cost exceeds the initial original sanctioned cost.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">expenditure_vs_revised</td>
                    <td className="py-2 px-3 font-medium">Budget Consumed</td>
                    <td className="py-2 px-3">0.0 to 1.0+ ratio</td>
                    <td className="py-2 px-3">Cumulative expenditure incurred divided by total revised project cost.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">agency_freq</td>
                    <td className="py-2 px-3 font-medium">Agency Track Record</td>
                    <td className="py-2 px-3">Count (e.g. 1166 for NHAI)</td>
                    <td className="py-2 px-3">Total central infrastructure projects managed by this implementing agency in the historical dataset.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">spend_rate_3m</td>
                    <td className="py-2 px-3 font-medium">Spending Rate (3M)</td>
                    <td className="py-2 px-3">₹ Cr / month</td>
                    <td className="py-2 px-3">Trailing 3-month rolling expenditure velocity indicating capital absorption health.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">progress_rate_3m</td>
                    <td className="py-2 px-3 font-medium">Progress Velocity</td>
                    <td className="py-2 px-3">% / month</td>
                    <td className="py-2 px-3">Trailing 3-month physical progress gain. Flat values flag stalled construction sites.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">progress_vs_expected</td>
                    <td className="py-2 px-3 font-medium">Behind Schedule</td>
                    <td className="py-2 px-3">% deviation</td>
                    <td className="py-2 px-3">Actual reported progress minus linear expected completion based on project age.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">log_original_cost</td>
                    <td className="py-2 px-3 font-medium">Project Size (Log Scale)</td>
                    <td className="py-2 px-3">Log value (e.g. 7.1)</td>
                    <td className="py-2 px-3">Log-transformed original sanctioned cost preventing large mega-projects from skewing model weights.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">cost_revisions_so_far</td>
                    <td className="py-2 px-3 font-medium">Repeat Cost Revisions</td>
                    <td className="py-2 px-3">Count (0, 1, 2...)</td>
                    <td className="py-2 px-3">Number of times the project budget has been formally increased by Cabinet/CCEA.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">total_doc_push_months</td>
                    <td className="py-2 px-3 font-medium">Deadline Push</td>
                    <td className="py-2 px-3">Months (cumulative)</td>
                    <td className="py-2 px-3">Total months by which target commissioning date has shifted across successive revisions.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">spend_vs_progress</td>
                    <td className="py-2 px-3 font-medium">Spend vs Progress</td>
                    <td className="py-2 px-3">Ratio</td>
                    <td className="py-2 px-3">Rupees spent per 1% physical progress. High values flag contractor inflation or front-loading.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">exp_per_pct</td>
                    <td className="py-2 px-3 font-medium">Cost per Progress</td>
                    <td className="py-2 px-3">Normalized ratio</td>
                    <td className="py-2 px-3">Normalized capital outlay efficiency per unit of completed infrastructure works.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">approval_to_start_months</td>
                    <td className="py-2 px-3 font-medium">Slow Start</td>
                    <td className="py-2 px-3">Months</td>
                    <td className="py-2 px-3">Dormancy duration from administrative sanction to physical ground-breaking.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">planned_duration_months</td>
                    <td className="py-2 px-3 font-medium">Planned Duration</td>
                    <td className="py-2 px-3">Months</td>
                    <td className="py-2 px-3">Originally planned project duration from sanction date to original DOC.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">approval_year</td>
                    <td className="py-2 px-3 font-medium">Approval Year</td>
                    <td className="py-2 px-3">Year (e.g. 2022.0)</td>
                    <td className="py-2 px-3">Year of project sanction for macroeconomic cohort normalization.</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[#053F5C] dark:text-[#9FE7F5] font-semibold">progress_stall</td>
                    <td className="py-2 px-3 font-medium">Progress Stall</td>
                    <td className="py-2 px-3">Binary flag (0.0 / 1.0)</td>
                    <td className="py-2 px-3">Stagnation indicator flagging zero physical progress advancement over 2 consecutive reporting cycles.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
