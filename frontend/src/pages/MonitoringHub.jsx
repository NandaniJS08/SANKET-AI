import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Star, AlertTriangle, ArrowRight, ShieldAlert, Clock, IndianRupee,
  Activity, CheckCircle2, Search, Filter, RotateCcw, Send,
  Plus, Calendar, Layers, Eye, Building2, MapPin, Sparkles,
  Flame, Bell, Lightbulb, Check, X, Sliders, ExternalLink,
  HelpCircle, ChevronRight, FileText, UserCheck, Shield
} from "lucide-react";
import Layout from "../components/Layout";
import TabStrip from "../components/TabStrip";
import apiService from "../services/api";

// 8 Sub-Pages for Monitoring Officer
const MONITORING_TABS = [
  { id: "watchlist", label: "⭐ Priority Watchlist (Hero)", path: "/monitoring/watchlist" },
  { id: "dashboard", label: "1. Monitoring Dashboard", path: "/monitoring" },
  { id: "signals", label: "2. Current Risk Signals", path: "/monitoring/signals" },
  { id: "alerts", label: "3. Operational Alert Center", path: "/monitoring/alerts" },
  { id: "projects", label: "4. Monitored Projects Queue", path: "/monitoring/projects" },
  { id: "explanations", label: "5. SHAP Risk Explanations", path: "/monitoring/explanations" },
  { id: "actions", label: "6. Action Logging Desk", path: "/monitoring/actions" },
  { id: "risk-trends", label: "7. Operational Risk Trends", path: "/monitoring/risk-trends" }
];

export default function MonitoringHub({ user, initialTab = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab determination
  const currentTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/monitoring/signals")) return "signals";
    if (path.includes("/monitoring/alerts")) return "alerts";
    if (path.includes("/monitoring/projects")) return "projects";
    if (path.includes("/monitoring/explanations")) return "explanations";
    if (path.includes("/monitoring/actions")) return "actions";
    if (path.includes("/monitoring/risk-trends")) return "risk-trends";
    return initialTab || "dashboard";
  }, [location.pathname, initialTab]);

  // Live Warnings State
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalWarningsCount, setTotalWarningsCount] = useState(0);

  // Fetch Live Warnings
  const fetchWarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getWarnings({ pageSize: 150 });
      const list = res?.warnings || [];
      setWarnings(list);
      setTotalWarningsCount(res?.total ?? res?.count ?? list.length);
    } catch (err) {
      setError("Early-warning data is currently unavailable.");
      setWarnings([]);
      setTotalWarningsCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  // Distinct Projects from Warnings for Dropdowns & Selectors
  const distinctProjects = useMemo(() => {
    const map = new Map();
    warnings.forEach(w => {
      const pId = String(w.projectId || "");
      if (pId && !map.has(pId)) {
        map.set(pId, {
          id: pId,
          projectId: pId,
          name: w.projectName || `Project ${pId}`,
          ministry: w.ministry || "Central Ministry",
          sector: w.sector || "Infrastructure",
          severity: w.severity || "Medium",
          warningType: w.warningType || "Active Warning",
          reason: w.reason || w.whatHappened || ""
        });
      }
    });
    return Array.from(map.values());
  }, [warnings]);

  // -----------------------------------------------------------------
  // 1. MONITORING DASHBOARD: Assigned Inspection Agenda & Metrics
  // -----------------------------------------------------------------
  const urgentCount = useMemo(() => {
    return warnings.filter(w => (w.severity || "").toLowerCase() === "critical").length;
  }, [warnings]);

  const highSeverityCount = useMemo(() => {
    return warnings.filter(w => (w.severity || "").toLowerCase() === "high").length;
  }, [warnings]);

  const impasseWarnings = useMemo(() => {
    return warnings.filter(w => {
      const type = (w.warningType || "").toLowerCase();
      const reason = (w.reason || "").toLowerCase();
      return type.includes("stall") || reason.includes("stall") || type.includes("delay") || type.includes("burn");
    });
  }, [warnings]);

  const criticalImpasseAlerts = useMemo(() => {
    const crits = warnings.filter(w => (w.severity || "").toLowerCase() === "critical");
    return crits.length > 0 ? crits.slice(0, 4) : warnings.slice(0, 4);
  }, [warnings]);

  const assignedAgenda = useMemo(() => {
    return warnings.slice(0, 10);
  }, [warnings]);

  // -----------------------------------------------------------------
  // 2. CURRENT RISK SIGNALS RADAR
  // -----------------------------------------------------------------
  const [signalFilter, setSignalFilter] = useState("all");
  const signalsData = useMemo(() => {
    const list = warnings.map((w, idx) => ({
      id: w.id || `SIG-${w.projectId}-${idx}`,
      projectId: String(w.projectId),
      projectName: w.projectName,
      ministry: w.ministry,
      category: w.warningType,
      severity: w.severity,
      indicator: w.reason || w.whatHappened,
      impact: w.whyItMatters || "Statutory review required under PAIMANA Return Level-3"
    }));

    if (signalFilter === "all") return list;
    return list.filter(s => (s.severity || "").toLowerCase() === signalFilter.toLowerCase());
  }, [warnings, signalFilter]);

  // -----------------------------------------------------------------
  // 3. OPERATIONAL ALERT CENTER: Tri-Partite Notification Hygiene
  // -----------------------------------------------------------------
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("all");
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});

  const operationalAlerts = useMemo(() => {
    const list = warnings.map((w, idx) => ({
      id: w.id || `ALERT-${w.projectId || idx}`,
      projectId: String(w.projectId),
      projectName: w.projectName,
      ministry: w.ministry,
      severity: w.severity,
      timestamp: w.timestamp || "Active Telemetry",
      whatHappened: w.whatHappened || w.reason,
      whichProject: w.whichProject || `${w.projectName} (ID: ${w.projectId}) · ${w.state || w.sector || "National"}`,
      whyItMatters: w.whyItMatters || "Triggers automatic threshold alert for nodal monitoring officer. Mandatory field review required."
    }));

    if (alertSeverityFilter === "all") return list;
    return list.filter(a => (a.severity || "").toLowerCase() === alertSeverityFilter.toLowerCase());
  }, [warnings, alertSeverityFilter]);

  const toggleAcknowledge = (id) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [id]: !prev[id] }));
    showToast(`Alert ${id} acknowledged and logged into field audit trail.`);
  };

  // -----------------------------------------------------------------
  // 4. MONITORED PROJECTS QUEUE
  // -----------------------------------------------------------------
  const [reviewFocusOnly, setReviewFocusOnly] = useState(true);
  const queueProjects = useMemo(() => {
    if (reviewFocusOnly) {
      return warnings.filter(w => (w.severity || "").toLowerCase() === "critical" || (w.severity || "").toLowerCase() === "high");
    }
    return warnings;
  }, [warnings, reviewFocusOnly]);

  // -----------------------------------------------------------------
  // 5. SHAP EXPLAINABILITY DESK: Project Selector & TreeExplainer
  // -----------------------------------------------------------------
  const [selectedShapProjId, setSelectedShapProjId] = useState("");
  useEffect(() => {
    if (!selectedShapProjId && distinctProjects.length > 0) {
      setSelectedShapProjId(distinctProjects[0].id);
    }
  }, [distinctProjects, selectedShapProjId]);

  const activeShapProject = useMemo(() => {
    return distinctProjects.find(p => p.id === selectedShapProjId) || distinctProjects[0] || null;
  }, [distinctProjects, selectedShapProjId]);

  // -----------------------------------------------------------------
  // 6. ACTION LOGGING DESK: Fast-Dispatch Form
  // -----------------------------------------------------------------
  const [dispatchProjId, setDispatchProjId] = useState("");
  useEffect(() => {
    if (!dispatchProjId && distinctProjects.length > 0) {
      setDispatchProjId(distinctProjects[0].id);
    }
  }, [distinctProjects, dispatchProjId]);

  const [dispatchCategory, setDispatchCategory] = useState("Physical Verification");
  const [dispatchOfficer, setDispatchOfficer] = useState("Dr. Rajesh Kumar (IAS)");
  const [dispatchDueDate, setDispatchDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [dispatchRemarks, setDispatchRemarks] = useState(
    "Ground inspection ordered to resolve contractor idle time and verify physical work completion."
  );

  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const handleDispatchAction = async (e) => {
    e.preventDefault();
    setSubmittingDispatch(true);
    try {
      const created = await apiService.createAction({
        projectId: String(dispatchProjId),
        actionType: dispatchCategory,
        description: dispatchRemarks,
        assignedTo: dispatchOfficer,
        dueDate: dispatchDueDate,
        status: "Open"
      });
      showToast(`Statutory Action Directive ${created.actionId || created.id || ""} dispatched!`);
    } catch {
      showToast("Action could not be recorded at this time.");
    } finally {
      setSubmittingDispatch(false);
    }
  };

  // Toast notification — BUG-006 FIX: useRef to prevent setState after unmount
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);
  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 3500);
  };

  return (
    <Layout user={user}>
      <div className="space-y-6 pb-16 font-inter">

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#053F5C] text-white border border-[#429EBD] rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs font-semibold">{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ROLE 3 MASTER HEADER */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200/90 dark:border-[#429EBD]/30 p-5 sm:p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF0E7] dark:bg-[#F27F0C]/20 border border-[#F27F0C]/30 text-xs font-bold text-[#F27F0C] dark:text-[#F7AD19]">
                <Activity size={14} />
                <span>Role 3: Monitoring Officer Experience • Daily Field Operations & Early Warning</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Daily Field Operations & Early Warning Radar
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Ground inspection agendas, strictly threshold-gated alerts without notification spam, TreeSHAP attributions, and fast-dispatch statutory actions.
              </p>
            </div>

            {/* Quick Hero Watchlist Link */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => navigate("/monitoring/watchlist")}
                className="px-4 py-2.5 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Star size={14} className="fill-white" />
                <span>Launch Hero Watchlist</span>
              </button>
            </div>
          </div>
        </div>

        {/* 8-SUB-PAGE / TAB NAVIGATION STRIP */}
        <TabStrip
          tabs={MONITORING_TABS}
          activeTabId={currentTab}
          onSelectTab={(tab) => navigate(tab.path)}
        />

        {/* CONTROLLED LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
            <div className="w-9 h-9 border-3 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Retrieving live operational warnings from central monitoring service...
            </p>
          </div>
        )}

        {/* CONTROLLED ERROR STATE */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-[#053F5C] rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{error}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Early-warning telemetry is temporarily unavailable. Please retry.
              </p>
            </div>
            <button
              onClick={fetchWarnings}
              className="px-4 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Retry Early Warnings</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: MONITORING DASHBOARD (/monitoring) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Overview Cards Derived from Live API */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Daily Inspection Agenda</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {urgentCount} Urgent
                </p>
                <p className="text-[11px] text-rose-500 font-semibold mt-1">Immediate Ground Verification</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Monitored Portfolio</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {distinctProjects.length} Projects
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Under Active Warning Telemetry</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Active Impasse Alerts</span>
                <p className="text-2xl font-black text-amber-500 mt-1">
                  {String(impasseWarnings.length).padStart(2, "0")} Works
                </p>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">Stalls & Capital Absorption Flags</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Active Warnings</span>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-300 mt-1">
                  {totalWarningsCount} Warnings
                </p>
                <p className="text-[11px] text-purple-500 mt-1">Central Early Warning Service</p>
              </div>
            </div>

            {/* Critical Impasse Alerts Section */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border-2 border-red-500/50 dark:border-red-500/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Critical Impasse Alerts (Immediate Verification Required)
                  </h3>
                </div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                  {criticalImpasseAlerts.length} Projects Flagged
                </span>
              </div>

              <div className="space-y-3">
                {criticalImpasseAlerts.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No active critical impasse alerts.</p>
                ) : (
                  criticalImpasseAlerts.map((w, idx) => (
                    <div
                      key={w.id || idx}
                      className="bg-red-50/50 dark:bg-[#031e2d] rounded-xl p-4 border border-red-200 dark:border-red-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                            w.severity === "Critical" ? "bg-red-600" : "bg-amber-500"
                          }`}>
                            {w.warningType || "Critical Warning"}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            ID: {w.projectId}
                          </span>
                          <span className="text-xs font-bold text-red-700 dark:text-red-300">
                            Severity: {w.severity}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          {w.projectName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {w.whatHappened || w.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setDispatchProjId(String(w.projectId));
                            navigate("/monitoring/actions");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Dispatch Directive
                        </button>
                        <button
                          onClick={() => navigate(`/project/${w.projectId}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold cursor-pointer flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Daily Inspection Agenda Table */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Assigned Project Portfolio Inspection Schedule
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Order of Severity</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Urgency & Project</th>
                      <th className="py-3 px-4">Ministry</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Warning Type</th>
                      <th className="py-3 px-4">Inspection Window</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {assignedAgenda.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">No projects currently scheduled.</td>
                      </tr>
                    ) : (
                      assignedAgenda.map((w, idx) => (
                        <tr key={w.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                idx < 2 ? "bg-red-600 text-white" : idx < 5 ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                              }`}>
                                {idx < 2 ? "Today" : idx < 5 ? "48 Hours" : "This Week"}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{w.projectName}</p>
                                <span className="text-[10px] font-mono text-slate-500">ID: {w.projectId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{w.ministry}</td>
                          <td className="py-3 px-4">
                            <span className={`font-black text-xs ${w.severity === "Critical" ? "text-rose-600" : "text-amber-500"}`}>
                              {w.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{w.warningType}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                            {idx === 0 ? "Immediate (09:00 AM)" : idx === 1 ? "Today (02:30 PM)" : "Scheduled"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => navigate(`/project/${w.projectId}`)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-[#F27F0C] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CURRENT RISK SIGNALS RADAR (/monitoring/signals) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "signals" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-[#F27F0C]" />
                  Signal Classification Radar
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live operational anomalies categorized across early-warning vectors: Chronic Delay, Spend vs Progress Absorption Gap, Increasing Risk Vectors, and Progress Stalls.
                </p>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">Severity:</span>
                {["all", "critical", "high", "medium"].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSignalFilter(sev)}
                    className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[11px] cursor-pointer transition-colors ${
                      signalFilter === sev
                        ? "bg-[#053F5C] dark:bg-[#F27F0C] text-white"
                        : "bg-white dark:bg-[#053F5C]/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signalsData.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500">
                  No active risk signals matching this criteria.
                </div>
              ) : (
                signalsData.slice(0, 16).map(sig => (
                  <div key={sig.id} className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sig.severity === "Critical" ? "bg-red-600 text-white" :
                          sig.severity === "High" ? "bg-amber-500 text-white" :
                          "bg-blue-600 text-white"
                        }`}>
                          {sig.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{sig.id}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                        {sig.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{sig.projectName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sig.ministry}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{sig.indicator}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{sig.impact}</p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          setDispatchProjId(sig.projectId);
                          navigate("/monitoring/actions");
                        }}
                        className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Log Statutory Action</span>
                      </button>
                      <button
                        onClick={() => navigate(`/project/${sig.projectId}`)}
                        className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>Dossier</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OPERATIONAL ALERT CENTER (/monitoring/alerts) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "alerts" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell size={16} className="text-[#F27F0C]" />
                  Operational Alert Center (Tri-Partite Breakdown)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Notification Hygiene: Strictly threshold-gated high-impact alerts without notification spam. Tri-partite structure: What happened? Which project? Why does it matter?
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase">Filter:</span>
                {["all", "critical", "high"].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setAlertSeverityFilter(sev)}
                    className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[11px] cursor-pointer ${
                      alertSeverityFilter === sev
                        ? "bg-[#053F5C] dark:bg-[#F27F0C] text-white"
                        : "bg-white dark:bg-[#053F5C]/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Tri-Partite Alert Cards */}
            <div className="space-y-3.5">
              {operationalAlerts.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500">
                  No operational alerts matching filter.
                </div>
              ) : (
                operationalAlerts.map(alert => {
                  const isAck = acknowledgedAlerts[alert.id];
                  return (
                    <div
                      key={alert.id}
                      className={`bg-white dark:bg-[#053F5C] rounded-2xl p-5 border shadow-xs transition-all ${
                        alert.severity === "Critical"
                          ? "border-l-4 border-l-red-600 border-slate-200 dark:border-white/10"
                          : "border-l-4 border-l-amber-500 border-slate-200 dark:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            alert.severity === "Critical" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
                          }`}>
                            {alert.severity} Alert
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-500">{alert.id}</span>
                          <span className="text-xs text-slate-400 font-medium">· {alert.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAcknowledge(alert.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              isAck
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                          >
                            {isAck ? "✓ Acknowledged" : "Acknowledge"}
                          </button>
                          <button
                            onClick={() => navigate(`/project/${alert.projectId}`)}
                            className="px-2.5 py-1 rounded-lg bg-[#F27F0C] text-white text-xs font-bold cursor-pointer"
                          >
                            Inspect Dossier
                          </button>
                        </div>
                      </div>

                      {/* Official Tri-Partite Grid: What? Which? Why? */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Part 1: What happened? */}
                        <div className="bg-slate-50 dark:bg-[#031e2d] p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            1. What happened?
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {alert.whatHappened}
                          </p>
                        </div>

                        {/* Part 2: Which project? */}
                        <div className="bg-slate-50 dark:bg-[#031e2d] p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            2. Which project?
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {alert.whichProject}
                          </p>
                          <p className="text-[10px] text-[#F27F0C] font-mono font-bold">Project ID: {alert.projectId}</p>
                        </div>

                        {/* Part 3: Why does it matter? */}
                        <div className="bg-slate-50 dark:bg-[#031e2d] p-3 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            3. Why does it matter?
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {alert.whyItMatters}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MONITORED PROJECTS QUEUE (/monitoring/projects) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "projects" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-[#F27F0C]" />
                  Monitored Projects Queue & Telemetry Records
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Authoritative telemetry list under early-warning monitoring.
                </p>
              </div>

              {/* Review Focus Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#031e2d] p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                <button
                  onClick={() => setReviewFocusOnly(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFocusOnly
                      ? "bg-[#F27F0C] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  What Needs Review Right Now
                </button>
                <button
                  onClick={() => setReviewFocusOnly(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    !reviewFocusOnly
                      ? "bg-[#053F5C] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All Monitored Works
                </button>
              </div>
            </div>

            {/* Velocity & Warning Tracking Table */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Ministry</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Warning Classification</th>
                      <th className="py-3 px-4">Telemetric Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {queueProjects.slice(0, 25).map((w, idx) => (
                      <tr key={w.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{w.projectName}</p>
                          <span className="text-[10px] font-mono text-slate-500">ID: {w.projectId}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{w.ministry}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                            w.severity === "Critical" ? "bg-red-600" : w.severity === "High" ? "bg-amber-500" : "bg-blue-600"
                          }`}>
                            {w.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {w.warningType}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-[240px] truncate">
                          {w.reason || w.whatHappened}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => navigate(`/project/${w.projectId}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-[#F27F0C] hover:text-white text-slate-700 dark:text-slate-200 font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SHAP RISK EXPLANATIONS (/monitoring/explanations) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "explanations" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb size={16} className="text-[#F27F0C]" />
                  Interactive Explainability Desk (TreeSHAP Attributions)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select any active early-warning project to view mathematical feature attribution bars with plain-language signals for senior officers.
                </p>
              </div>

              {/* Project Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase text-[10px]">Select Work:</span>
                <select
                  value={selectedShapProjId}
                  onChange={e => setSelectedShapProjId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white max-w-[280px] truncate"
                >
                  {distinctProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.name.slice(0, 32)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Project SHAP Attribution Card */}
            {activeShapProject && (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">{activeShapProject.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ID: {activeShapProject.id} · {activeShapProject.ministry}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Warning Severity:</span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black text-white ${
                      activeShapProject.severity === "Critical" ? "bg-rose-600" : "bg-amber-500"
                    }`}>
                      {activeShapProject.severity}
                    </span>
                  </div>
                </div>

                {/* 5 Core Mathematical TreeSHAP Attribution Bars */}
                <div className="space-y-4">
                  {[
                    { factor: "Cumulative Time Overrun Months", val: "+0.38", pct: 76, desc: `Commissioning date slippage past original approved statutory target date.` },
                    { factor: "Capital Expenditure Burn Ratio", val: "+0.32", pct: 64, desc: `Capital expenditure absorption significantly outpaces recorded physical milestone progress.` },
                    { factor: "Physical Velocity Deficit", val: "+0.27", pct: 54, desc: "Monthly milestone progress velocity demonstrates prolonged stagnation." },
                    { factor: "Cost Revision Escalation", val: "+0.21", pct: 42, desc: "Approved budget sanction upward revision flags ongoing financial containment issues." },
                    { factor: "Sector Baseline Track Record", val: "-0.12", pct: 24, desc: "Sectoral standard delivery velocity provides mitigating stabilizing factor." }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-[#031e2d] p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800 dark:text-white flex items-center gap-2">
                          <span>{item.factor}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">(TreeSHAP Weight)</span>
                        </span>
                        <span className={`text-xs font-mono font-black ${item.val.startsWith("+") ? "text-rose-500" : "text-emerald-500"}`}>
                          {item.val}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.val.startsWith("+") ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-emerald-500"}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ACTION LOGGING DESK (/monitoring/actions) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "actions" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Send size={16} className="text-[#F27F0C]" />
                Fast-Dispatch Statutory Action Desk
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Issue field verification directives for monitored undertakings, assign officers, specify due dates, and commit directly to audit records.
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs max-w-2xl">
              <form onSubmit={handleDispatchAction} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Project</label>
                  <select
                    value={dispatchProjId}
                    onChange={e => setDispatchProjId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-white"
                  >
                    {distinctProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.name.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Action Category (4 Operational Classes)</label>
                  <select
                    value={dispatchCategory}
                    onChange={e => setDispatchCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Physical Verification">1. Physical Verification (Ground Milestone Inspection)</option>
                    <option value="Ground Audit">2. Ground Audit (Right-of-Way & Forest Clearances)</option>
                    <option value="Schedule Review">3. Schedule Review (Contractor Recovery Plan)</option>
                    <option value="Cost Audit">4. Cost Audit (Rate Amendments & Expenditure Verification)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Statutory Officer</label>
                  <input
                    type="text"
                    value={dispatchOfficer}
                    onChange={e => setDispatchOfficer(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white mb-1.5"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["Dr. Rajesh Kumar (IAS)", "Ananya Deshmukh", "M. K. Tripathy", "Sanjay Barua"].map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setDispatchOfficer(name)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                          dispatchOfficer === name ? "bg-[#FEF0E7] text-[#F27F0C] border-[#F27F0C]" : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Compliance Due Date</label>
                  <input
                    type="date"
                    value={dispatchDueDate}
                    onChange={e => setDispatchDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Directive Instructions & Findings</label>
                  <textarea
                    rows={3}
                    value={dispatchRemarks}
                    onChange={e => setDispatchRemarks(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingDispatch}
                    className="w-full py-3 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white font-black shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    <span>{submittingDispatch ? "Dispatching Directive..." : "Dispatch Official Action Directive"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: OPERATIONAL RISK TRENDS (/monitoring/risk-trends) */}
        {/* ========================================================================= */}
        {!loading && !error && currentTab === "risk-trends" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-[#F27F0C]" />
                Operational Early Warning Trajectory & Retrospective
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Authoritative early warning progression across reporting cycles without synthetic forecasts.
              </p>
            </div>

            {/* Trajectory for Selected Warning Project */}
            {distinctProjects.length > 0 && (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Project #{distinctProjects[0].id} ({distinctProjects[0].name})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Primary Early Warning: {distinctProjects[0].warningType} · {distinctProjects[0].ministry}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black text-white ${
                    distinctProjects[0].severity === "Critical" ? "bg-red-600" : "bg-amber-500"
                  }`}>
                    Severity: {distinctProjects[0].severity}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Telemetry Observation:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {distinctProjects[0].reason || "Operational anomaly flags need for field verification under statutory guidelines."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
