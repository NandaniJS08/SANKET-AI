import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, Clock,
  Search, ShieldAlert, FileText, Send, Calendar, CheckSquare,
  Sparkles, ExternalLink, HelpCircle, Sliders, TrendingDown,
  IndianRupee, Zap, ArrowRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import Layout from "../components/Layout";
import { apiService } from "../services/api";

export default function ExplainableAI({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("id") || "400010";

  const [projectsList, setProjectsList] = useState([]);
  const [selectedId, setSelectedId] = useState(initialProjectId);
  const [toastMsg, setToastMsg] = useState("");

  // Live AI Prediction, SHAP Drivers & Explanation States
  const [prediction, setPrediction] = useState(null);
  const [shapDrivers, setShapDrivers] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // What-If Simulation Sliders State
  const [deltaLand, setDeltaLand] = useState(15);
  const [deltaVelocity, setDeltaVelocity] = useState(8);
  const [deltaInflation, setDeltaInflation] = useState(-3);

  // Fetch verified projects on mount
  useEffect(() => {
    let isCurrent = true;
    apiService.getProjects({ pageSize: 100 })
      .then(res => {
        if (!isCurrent) return;
        const list = res.data || res.projects || [];
        setProjectsList(list);
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
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Fetch live AI prediction, TreeSHAP attributions & explanation on selectedId change
  useEffect(() => {
    let isCurrent = true;
    if (!selectedId) return;

    setLoading(true);
    setError(null);
    setPrediction(null);
    setShapDrivers([]);
    setExplanation(null);

    Promise.allSettled([
      apiService.getPrediction(selectedId),
      apiService.getShapDrivers(selectedId),
      apiService.getExplanation(selectedId),
    ]).then(([predRes, shapRes, explRes]) => {
      if (!isCurrent) return;
      setLoading(false);

      if (predRes.status === "fulfilled" && predRes.value) {
        setPrediction(predRes.value);
      }

      if (shapRes.status === "fulfilled" && Array.isArray(shapRes.value)) {
        setShapDrivers(shapRes.value);
      }

      if (explRes.status === "fulfilled" && explRes.value) {
        setExplanation(explRes.value);
      }

      if (predRes.status === "rejected" && shapRes.status === "rejected") {
        setError("AI explainability data is currently unavailable for this project.");
      }
    // BUG-007 FIX: catch errors thrown inside the .then() callback itself
    }).catch(err => {
      if (!isCurrent) return;
      setError("AI explainability data is currently unavailable for this project.");
      console.error('[ExplainableAI] Prediction allSettled callback error:', err);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedId]);

  // Active project metadata
  const selectedProject = useMemo(() => {
    const found = projectsList.find(p => String(p.id || p.projectId) === String(selectedId));
    if (found) return found;
    return {
      id: selectedId,
      projectId: selectedId,
      name: prediction?.projectName || `Project ${selectedId}`,
      ministry: "Central Ministry",
      state: "National",
      sector: "Infrastructure",
      agency: "Nodal Authority",
      riskLevel: prediction?.riskLevel || "Medium",
      riskScore: prediction?.riskScore != null ? prediction.riskScore : null,
      physicalProgress: null
    };
  }, [projectsList, selectedId, prediction]);

  // Reactive What-If Policy Simulation Engine
  const simResult = useMemo(() => {
    if (!selectedProject) return null;
    const baseScore = prediction?.riskScore != null
      ? Number(prediction.riskScore)
      : (selectedProject.riskScore != null ? Number(selectedProject.riskScore) : 50);
    const cost = selectedProject.revisedCostCr || selectedProject.originalCostCr || 1200;
    const land = Number(deltaLand || 0);
    const vel = Number(deltaVelocity || 0);
    const inf = Number(deltaInflation || 0);

    const totalMitigation = (land * 0.45 + vel * 0.65) - (inf * 0.40);
    const simScore = Math.max(10, Math.min(98, Math.round(baseScore - totalMitigation)));
    const mitPct = Math.max(0, Math.round(((baseScore - simScore) / (baseScore || 1)) * 100));
    const costSaving = Math.max(0, Math.round(cost * (mitPct / 100) * 0.18));
    const monthsSaved = Math.max(0, Math.round((baseScore - simScore) * 0.16));

    return {
      baseline_risk_score: baseScore,
      simulated_risk_score: simScore,
      simulated_risk_level: simScore >= 75 ? "Critical" : simScore >= 50 ? "High" : simScore >= 25 ? "Moderate" : "Low",
      risk_mitigation_pct: mitPct,
      projected_cost_saving_cr: costSaving,
      months_saved: monthsSaved,
      policy_synthesis: `Intervention mitigates risk by ${mitPct}%, protecting ₹${costSaving.toLocaleString('en-IN')} Cr and saving ${monthsSaved} months.`
    };
  }, [selectedProject, prediction, deltaLand, deltaVelocity, deltaInflation]);

  // Recharts horizontal data from real TreeSHAP drivers
  const chartData = useMemo(() => {
    return shapDrivers.map(d => ({
      factor: d.factor,
      contribution: d.direction === "decreases_risk" ? -Math.abs(d.weight) : Math.abs(d.weight),
      fill: d.direction === "decreases_risk"
        ? "#10B981"
        : Math.abs(d.weight) >= 15
          ? "#DC2626"
          : Math.abs(d.weight) >= 8
            ? "#F27F0C"
            : "#F7AD19",
      evidence: d.evidence
    }));
  }, [shapDrivers]);

  // BUG-006 FIX: Store action toast timer ref to prevent setState on unmounted component
  const actionToastRef = useRef(null);
  useEffect(() => () => { if (actionToastRef.current) clearTimeout(actionToastRef.current); }, []);
  const handleAction = (actionTitle) => {
    setToastMsg(`Action successfully executed: "${actionTitle}" for ${selectedProject.name}`);
    if (actionToastRef.current) clearTimeout(actionToastRef.current);
    actionToastRef.current = setTimeout(() => setToastMsg(""), 4500);
  };

  return (
    <Layout
      user={user}
      title="Explainable AI (XAI) Risk Diagnostics"
      subtitle="Auditable ML feature attributions, SHAP breakdown, and plain-language governance rationales for Central Sector Projects."
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg("")} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer font-bold px-1">✕</button>
        </div>
      )}

      {/* Top Project Selector & Search Bar */}
      <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-4 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-bold text-[#78716C] dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Select Monitored Project for AI Diagnostic Attribution
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full text-xs font-bold bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2.5 outline-none focus:border-[#F27F0C] text-[#1C1917] dark:text-white cursor-pointer"
            >
              {projectsList.map(p => {
                const pId = String(p.id || p.projectId);
                return (
                  <option key={pId} value={pId}>
                    {pId} — {p.name} ({p.ministry}) [{p.riskLevel || 'Medium'} Risk]
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => navigate(`/projects/${selectedProject.id || selectedProject.projectId}`)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-[#E7E5E4] dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 text-[#1C1917] dark:text-white rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          >
            <ExternalLink size={13} /> View Full Project Detail
          </button>
        </div>
      </div>

      {/* Selected Project Summary Card */}
      <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-transparent dark:border-[#429EBD]/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#F27F0C] dark:text-[#9FE7F5]">{selectedProject.projectId || selectedProject.id}</span>
              <h3 className="text-sm font-black text-[#1C1917] dark:text-white">{selectedProject.name}</h3>
            </div>
            <p className="text-xs text-[#78716C] dark:text-slate-300 mt-0.5">
              {selectedProject.ministry} · {selectedProject.state} · Agency: <strong>{selectedProject.agency || "Nodal Authority"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-[#78716C] dark:text-slate-400">Physical Completion</p>
            <p className="text-xs font-bold text-[#1C1917] dark:text-white">
              {selectedProject.physicalProgress != null ? `${selectedProject.physicalProgress}%` : "—"}
            </p>
          </div>
          <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            (prediction?.riskLevel || selectedProject.riskLevel) === "High" || (prediction?.riskLevel || selectedProject.riskLevel) === "Critical"
              ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50"
              : (prediction?.riskLevel || selectedProject.riskLevel) === "Medium"
                ? "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              (prediction?.riskLevel || selectedProject.riskLevel) === "High" || (prediction?.riskLevel || selectedProject.riskLevel) === "Critical"
                ? "bg-red-600"
                : (prediction?.riskLevel || selectedProject.riskLevel) === "Medium"
                  ? "bg-[#F27F0C]"
                  : "bg-emerald-600"
            }`} />
            {(prediction?.riskLevel || selectedProject.riskLevel || "Medium")?.toUpperCase()} RISK — Score {prediction?.riskScore != null ? prediction.riskScore : (selectedProject.riskScore != null ? selectedProject.riskScore : "—")}/100
          </div>
        </div>
      </div>

      {/* SHAP Chart & Horizontal Feature Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-5">
        {/* SHAP Visual Graph */}
        <div className="lg:col-span-7 bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1C1917] dark:text-white text-sm">Feature Contribution (SHAP Analysis)</h3>
              <p className="text-xs text-[#A8A29E] dark:text-slate-400 mt-0.5">
                Red bars indicate factors driving risk upward; green bars indicate stabilizing factors.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-lg text-[#78716C] dark:text-slate-300">
              Model: Random Forest + TreeSHAP
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[#78716C] dark:text-slate-300">Loading TreeSHAP factor attributions...</p>
            </div>
          ) : shapDrivers.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#78716C] dark:text-slate-400">
              Explainability data is currently unavailable.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" className="dark:opacity-10" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#A8A29E" }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="factor" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={180} />
                <ReferenceLine x={0} stroke="#429EBD" strokeWidth={1.5} />
                <Tooltip
                  formatter={(v) => [`${v > 0 ? "+" : ""}${v}% Risk Impact`, "SHAP Weight"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #429EBD30", fontSize: 12 }}
                />
                <Bar dataKey="contribution" radius={4}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F4] dark:border-[#429EBD]/20 text-xs text-[#78716C] dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600 inline-block" />
              <span>Risk Escalating Factors (+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span>Risk Mitigating Factors (-)</span>
            </div>
          </div>
        </div>

        {/* Detailed Factor Attribution Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h3 className="font-bold text-[#1C1917] dark:text-white text-sm mb-1">Attribution Factor Weights</h3>
            <p className="text-xs text-[#A8A29E] dark:text-slate-400 mb-4">Normalized multi-variable correlation metrics from TreeSHAP.</p>

            {loading ? (
              <p className="text-xs text-[#78716C] dark:text-slate-400 py-6 text-center">Loading attributions...</p>
            ) : shapDrivers.length === 0 ? (
              <p className="text-xs text-[#78716C] dark:text-slate-400 py-6 text-center">Explainability data is currently unavailable.</p>
            ) : (
              <div className="space-y-3.5">
                {shapDrivers.map((f, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[#1C1917] dark:text-white">{f.factor}</span>
                      <span className={`font-mono font-bold ${f.direction === "decreases_risk" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {f.direction === "decreases_risk" ? "-" : "+"}{f.weight}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-1.5 rounded-full ${f.direction === "decreases_risk" ? "bg-emerald-500" : Math.abs(f.weight) >= 15 ? "bg-red-600" : "bg-[#F27F0C]"}`}
                        style={{ width: `${Math.min(100, (Math.abs(f.weight) / 30) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#78716C] dark:text-slate-300 leading-snug">{f.evidence}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHAT-IF POLICY INTERVENTION & SIMULATION SANDBOX */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#053F5C] dark:via-[#031e2d] dark:to-[#053F5C] rounded-3xl p-6 mb-5 text-[#1C1917] dark:text-white shadow-sm dark:shadow-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E7E5E4] dark:border-[#429EBD]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F27F0C] flex items-center justify-center text-white shadow-md">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-[#1C1917] dark:text-white tracking-wide">Interactive What-If Policy Intervention Simulator</h3>
                <span className="text-[10px] font-bold bg-[#F27F0C]/15 dark:bg-[#F27F0C]/20 text-[#F27F0C] dark:text-[#9FE7F5] border border-[#F27F0C]/30 dark:border-[#F27F0C]/40 px-2 py-0.5 rounded-full">
                  Real-Time Decision Engine
                </span>
              </div>
              <p className="text-xs text-[#78716C] dark:text-slate-300 mt-0.5">
                Simulate executive policy decisions to forecast risk mitigation, budget savings, and schedule recovery.
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-[#44403C] dark:text-slate-300 bg-[#FAF7F4] dark:bg-[#031e2d] px-3 py-1.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30">
            Target: <strong>{selectedProject.name.slice(0, 30)}...</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders Control Panel */}
          <div className="lg:col-span-7 space-y-4">
            {/* Slider 1: Land Acquisition */}
            <div className="bg-[#FAF7F4] dark:bg-[#031e2d]/70 border border-[#E7E5E4] dark:border-[#429EBD]/30 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#1C1917] dark:text-slate-200 flex items-center gap-1.5">
                  <Zap size={14} className="text-[#F27F0C]" /> Expedited Land Handover & Clearances
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">+{deltaLand}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={deltaLand}
                onChange={e => setDeltaLand(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F27F0C]"
              />
              <div className="flex justify-between text-[10px] text-[#A8A29E] dark:text-slate-400 mt-1">
                <span>Baseline (+0%)</span>
                <span>Inter-departmental Taskforce (+15%)</span>
                <span>Fast-track Handover (+30%)</span>
              </div>
            </div>

            {/* Slider 2: Progress Velocity */}
            <div className="bg-[#FAF7F4] dark:bg-[#031e2d]/70 border border-[#E7E5E4] dark:border-[#429EBD]/30 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#1C1917] dark:text-slate-200 flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-[#429EBD]" /> Contractor Monthly Progress Velocity Boost
                </label>
                <span className="text-xs font-mono font-bold text-[#053F5C] dark:text-[#9FE7F5]">+{deltaVelocity}% / Mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="2"
                value={deltaVelocity}
                onChange={e => setDeltaVelocity(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#429EBD]"
              />
              <div className="flex justify-between text-[10px] text-[#A8A29E] dark:text-slate-400 mt-1">
                <span>Current Pace (+0%)</span>
                <span>Double Shift Work (+10%)</span>
                <span>Triple Shift Construction (+20%)</span>
              </div>
            </div>

            {/* Slider 3: Material Inflation */}
            <div className="bg-[#FAF7F4] dark:bg-[#031e2d]/70 border border-[#E7E5E4] dark:border-[#429EBD]/30 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-[#1C1917] dark:text-slate-200 flex items-center gap-1.5">
                  <IndianRupee size={14} className="text-[#F7AD19]" /> Material Price Stabilization / Bulk Procurement
                </label>
                <span className={`text-xs font-mono font-bold ${deltaInflation < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {deltaInflation > 0 ? `+${deltaInflation}` : deltaInflation}%
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={deltaInflation}
                onChange={e => setDeltaInflation(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#F7AD19]"
              />
              <div className="flex justify-between text-[10px] text-[#A8A29E] dark:text-slate-400 mt-1">
                <span>-10% (Central Bulk Tender)</span>
                <span>0% (Market Baseline)</span>
                <span>+10% (High Inflation)</span>
              </div>
            </div>
          </div>

          {/* Real-Time Simulation Results Panel */}
          <div className="lg:col-span-5 bg-[#FAF7F4] dark:bg-[#031e2d]/80 border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#44403C] dark:text-slate-300 uppercase tracking-wider">Forecasted Policy Impact</span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600/50 px-2.5 py-0.5 rounded-full">
                  -{simResult?.risk_mitigation_pct || 0}% Risk Reduction
                </span>
              </div>

              {/* Comparative Scores */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white dark:bg-[#053F5C]/50 rounded-xl border border-red-200 dark:border-[#429EBD]/30 text-center shadow-2xs">
                  <p className="text-[11px] text-[#78716C] dark:text-slate-400">Baseline Score</p>
                  <p className="text-lg font-black text-red-600 dark:text-red-400 font-mono mt-0.5">{simResult?.baseline_risk_score || 68} / 100</p>
                  <span className="text-[10px] text-[#78716C] dark:text-slate-400">{selectedProject.riskLevel} Risk</span>
                </div>
                <div className="p-3 bg-white dark:bg-[#053F5C]/50 rounded-xl border border-emerald-300 dark:border-emerald-700/60 text-center shadow-2xs">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Simulated Outcome</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{simResult?.simulated_risk_score || 46} / 100</p>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">{simResult?.simulated_risk_level || "Moderate"} Risk</span>
                </div>
              </div>

              {/* Impact Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-[#053F5C]/40 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 shadow-2xs">
                  <span className="text-[#44403C] dark:text-slate-300 flex items-center gap-1.5">
                    <IndianRupee size={13} className="text-emerald-600 dark:text-emerald-400" /> Projected Public Cost Savings:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    ₹{simResult?.projected_cost_saving_cr?.toLocaleString('en-IN') || 0} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-[#053F5C]/40 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 shadow-2xs">
                  <span className="text-[#44403C] dark:text-slate-300 flex items-center gap-1.5">
                    <Clock size={13} className="text-[#053F5C] dark:text-[#9FE7F5]" /> Schedule Delay Mitigated:
                  </span>
                  <span className="font-mono font-bold text-[#053F5C] dark:text-[#9FE7F5] text-xs">
                    {simResult?.months_saved || 0} Months Recovered
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#44403C] dark:text-slate-300 italic leading-relaxed bg-white dark:bg-[#053F5C]/40 p-3 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 shadow-2xs">
                "{simResult?.policy_synthesis || 'Simulate interventions to view AI synthesis.'}"
              </p>
            </div>

            <button
              onClick={() => handleAction(`Adopt Simulated Policy Action Package (-${simResult?.risk_mitigation_pct || 0}% Risk)`)}
              className="mt-4 w-full py-2.5 bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Adopt Simulated Policy Package</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Plain English Governance Narrative */}
      <div className="bg-[#FEF0E7] dark:bg-[#053F5C] border border-[#FDDFCC] dark:border-[#429EBD]/30 rounded-2xl p-5 mb-5 shadow-2xs transition-colors">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 bg-[#F27F0C] rounded-xl flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1C1917] dark:text-white text-sm">Official Plain-English Executive Summary</h3>
            <p className="text-[11px] text-[#78716C] dark:text-slate-300">Automated synthesis for Reviewers and Monitoring Officers</p>
          </div>
        </div>
        <blockquote className="text-[#1C1917] dark:text-slate-200 text-xs sm:text-sm leading-relaxed italic border-l-4 border-[#F27F0C] pl-4 py-1">
          {explanation?.whyFlagged ? (
            <span>"{explanation.whyFlagged}"</span>
          ) : loading ? (
            <span className="text-[#78716C] dark:text-slate-400">Loading verified AI executive explanation...</span>
          ) : (
            <span className="text-[#78716C] dark:text-slate-400">Project explanation is currently unavailable.</span>
          )}
        </blockquote>
      </div>

      {/* Reviewer Actionable Recommendations */}
      <div className="mb-2">
        <h3 className="font-bold text-[#1C1917] dark:text-white text-sm mb-3">Targeted AI Mitigation Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 1,
              title: "Deploy Nodal Site Verification Team",
              urgency: "Immediate (48 Hours)",
              desc: `Dispatch physical audit inspectors to ${selectedProject.state} to inspect on-ground construction milestones vs contractor-reported submissions.`,
              action: "Initiate Site Inspection",
              color: "red"
            },
            {
              id: 2,
              title: "Convene Inter-Ministerial Review",
              urgency: "Within 5 Days",
              desc: `Hold emergency bilateral coordination meeting between ${selectedProject.ministry} and implementing agency ${selectedProject.agency || 'Nodal Body'} for budget reconciliation.`,
              action: "Schedule Coordination Meeting",
              color: "amber"
            },
            {
              id: 3,
              title: "Issue Statutory MoSPI Flash Escalation",
              urgency: "Immediate",
              desc: "Transmit formal high-risk alert memo to the Cabinet Secretariat Project Monitoring Group (PMG) for expedited land and statutory clearances.",
              action: "Transmit PMG Escalation",
              color: "orange"
            }
          ].map(r => (
            <div key={r.id} className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.color === "red" ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50" :
                    r.color === "amber" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50" :
                    "bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-[#FDDFCC] dark:border-[#429EBD]/30"
                  }`}>
                    {r.urgency}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-[#1C1917] dark:text-white mb-1.5">{r.title}</h4>
                <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed mb-4">{r.desc}</p>
              </div>

              <button
                onClick={() => handleAction(r.action)}
                className="w-full py-2 bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                {r.action} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
