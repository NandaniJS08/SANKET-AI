import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star, AlertTriangle, ArrowRight, ShieldAlert, Clock, IndianRupee,
  Activity, CheckCircle2, Search, Filter, Sparkles, Building2,
  MapPin, Calendar, FileText, Send, X, Eye, Flame, TrendingUp, AlertCircle,
  ChevronLeft, ChevronRight, RotateCcw
} from "lucide-react";
import Layout from "../components/Layout";
import TabStrip from "../components/TabStrip";
import apiService from "../services/api";

export default function PriorityWatchlist({ user }) {
  const navigate = useNavigate();

  // Live Warning State
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSignal, setSelectedSignal] = useState("all");
  const [selectedRiskTier, setSelectedRiskTier] = useState("all");
  const [selectedMinistry, setSelectedMinistry] = useState("all");

  // Interactive Pagination State
  const [watchlistPage, setWatchlistPage] = useState(1);
  const [watchlistPageSize, setWatchlistPageSize] = useState(15);

  // Action Logging Modal State
  const [activeModalWarning, setActiveModalWarning] = useState(null);
  const [actionCategory, setActionCategory] = useState("Physical Verification");
  const [assignedOfficer, setAssignedOfficer] = useState("Dr. Rajesh Kumar (IAS)");
  const [actionDueDate, setActionDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [actionRemarks, setActionRemarks] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Officer quick chips
  const officerPresets = [
    "Dr. Rajesh Kumar (IAS)",
    "Ananya Deshmukh (Reviewer)",
    "M. K. Tripathy (CPWD)",
    "Sanjay Barua (IWAI)",
    "Vikram Malhotra (NHAI)"
  ];

  // Fetch Live Warnings from Backend
  const fetchWarnings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getWarnings({ pageSize: 200 });
      const rawList = res?.warnings || [];
      setWarnings(rawList);
      setTotalCount(res?.total ?? res?.count ?? rawList.length);
    } catch (err) {
      setError("Early-warning data is currently unavailable.");
      setWarnings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  // Live Aggregated Metric Counts
  const criticalCount = useMemo(() => {
    return warnings.filter(w => (w.severity || "").toLowerCase() === "critical").length;
  }, [warnings]);

  const highCount = useMemo(() => {
    return warnings.filter(w => (w.severity || "").toLowerCase() === "high").length;
  }, [warnings]);

  const stallCount = useMemo(() => {
    return warnings.filter(w => {
      const type = (w.warningType || "").toLowerCase();
      const reason = (w.reason || "").toLowerCase();
      return type.includes("stall") || reason.includes("stall") || type.includes("chronic") || type.includes("burn");
    }).length;
  }, [warnings]);

  // Unique Filter Dropdown Values from Live Data
  const uniqueWarningTypes = useMemo(() => {
    const set = new Set(warnings.map(w => w.warningType).filter(Boolean));
    return Array.from(set).sort();
  }, [warnings]);

  const uniqueMinistries = useMemo(() => {
    const set = new Set(warnings.map(w => w.ministry).filter(Boolean));
    return Array.from(set).sort().slice(0, 10);
  }, [warnings]);

  // Filtered Warnings Collection
  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      // Text Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchId = String(w.projectId || "").toLowerCase().includes(q);
        const matchName = (w.projectName || "").toLowerCase().includes(q);
        const matchMinistry = (w.ministry || "").toLowerCase().includes(q);
        const matchSector = (w.sector || "").toLowerCase().includes(q);
        const matchType = (w.warningType || "").toLowerCase().includes(q);
        const matchReason = (w.reason || "").toLowerCase().includes(q);
        if (!matchId && !matchName && !matchMinistry && !matchSector && !matchType && !matchReason) return false;
      }

      // Signal / Warning Type filter
      if (selectedSignal !== "all") {
        if (w.warningType !== selectedSignal) return false;
      }

      // Risk Tier filter
      if (selectedRiskTier !== "all") {
        if ((w.severity || "").toLowerCase() !== selectedRiskTier.toLowerCase()) return false;
      }

      // Ministry filter
      if (selectedMinistry !== "all" && w.ministry !== selectedMinistry) {
        return false;
      }

      return true;
    });
  }, [warnings, searchQuery, selectedSignal, selectedRiskTier, selectedMinistry]);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setWatchlistPage(1);
  }, [searchQuery, selectedSignal, selectedRiskTier, selectedMinistry]);

  // Pagination Slicing
  const totalWatchlistPages = Math.max(1, Math.ceil(filteredWarnings.length / watchlistPageSize));
  const paginatedWarnings = useMemo(() => {
    const start = (watchlistPage - 1) * watchlistPageSize;
    return filteredWarnings.slice(start, start + watchlistPageSize);
  }, [filteredWarnings, watchlistPage, watchlistPageSize]);

  // Hero Warning (Top Critical or First Ranked Live Warning)
  const heroWarning = useMemo(() => {
    if (filteredWarnings.length === 0) return null;
    const critical = filteredWarnings.find(w => (w.severity || "").toLowerCase() === "critical");
    return critical || filteredWarnings[0];
  }, [filteredWarnings]);

  // Handle Open Action Modal
  const handleOpenActionModal = (warning) => {
    setActiveModalWarning(warning);
    const isStall = (warning.warningType || "").toLowerCase().includes("stall") || (warning.warningType || "").toLowerCase().includes("delay");
    setActionCategory(isStall ? "Physical Verification" : "Schedule Review");
    setActionRemarks(`Mandatory ground review required for ${warning.projectName} due to ${warning.warningType}: ${warning.reason || warning.whatHappened || "Early operational warning."}`);
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setActionDueDate(d.toISOString().split("T")[0]);
  };

  const [submittingModalAction, setSubmittingModalAction] = useState(false);

  // Commit Statutory Action to real backend API
  const handleSaveAction = async (e) => {
    e.preventDefault();
    if (!activeModalWarning) return;

    const projId = String(activeModalWarning.projectId || "");
    setSubmittingModalAction(true);
    try {
      const created = await apiService.createAction({
        projectId: projId,
        actionType: actionCategory,
        description: actionRemarks,
        assignedTo: assignedOfficer,
        dueDate: actionDueDate,
        status: "Open"
      });
      setActiveModalWarning(null);
      setToastMessage(`Statutory Directive ${created.actionId || created.id || ""} logged for ${activeModalWarning.projectName.slice(0, 35)}...`);
    } catch {
      setActiveModalWarning(null);
      setToastMessage("Action could not be recorded at this time.");
    } finally {
      setSubmittingModalAction(false);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastMessage(""), 4000);
    }
  };

  // Toast timer ref to prevent setState on unmounted component
  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  return (
    <Layout user={user}>
      <div className="space-y-6 pb-14 font-inter">

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#053F5C] text-white border border-[#429EBD] rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-semibold">{toastMessage}</span>
            <button onClick={() => setToastMessage("")} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* HERO HEADER BAR */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200/90 dark:border-[#429EBD]/30 p-5 sm:p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF0E7] dark:bg-[#F27F0C]/20 border border-[#F27F0C]/30 text-xs font-bold text-[#F27F0C] dark:text-[#F7AD19]">
                <Star size={14} className="fill-[#F27F0C] dark:fill-[#F7AD19]" />
                <span>Operational Hero Priority Watchlist</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Which Project Needs Attention Right Now?
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Live authoritative early-warning telemetry detecting execution shortfalls, chronic commissioning lag, and capital expenditure absorption gaps across central sector undertakings.
              </p>
            </div>

            {/* Top Stat Pills Derived from Live API */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 text-center min-w-[100px] shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Critical Works</p>
                <p className="text-xl font-black text-rose-500 dark:text-rose-400">
                  {loading ? "..." : String(criticalCount).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Action Required</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 text-center min-w-[100px] shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Stalled / High</p>
                <p className="text-xl font-black text-amber-500 dark:text-amber-400">
                  {loading ? "..." : String(stallCount || highCount).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Velocity Flags</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 text-center min-w-[100px] shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Active Warnings</p>
                <p className="text-xl font-black text-[#053F5C] dark:text-[#9FE7F5]">
                  {loading ? "..." : totalCount}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Live Telemetry</p>
              </div>
            </div>
          </div>
        </div>

        {/* 8-SUB-PAGE / TAB NAVIGATION STRIP */}
        <TabStrip
          tabs={[
            { id: "watchlist", label: "⭐ Priority Watchlist (Hero)", path: "/monitoring/watchlist" },
            { id: "dashboard", label: "1. Monitoring Dashboard", path: "/monitoring" },
            { id: "signals", label: "2. Current Risk Signals", path: "/monitoring/signals" },
            { id: "alerts", label: "3. Operational Alert Center", path: "/monitoring/alerts" },
            { id: "projects", label: "4. Monitored Projects Queue", path: "/monitoring/projects" },
            { id: "explanations", label: "5. SHAP Risk Explanations", path: "/monitoring/explanations" },
            { id: "actions", label: "6. Action Logging Desk", path: "/monitoring/actions" },
            { id: "risk-trends", label: "7. Operational Risk Trends", path: "/monitoring/risk-trends" }
          ]}
          activeTabId="watchlist"
          onSelectTab={(tab) => navigate(tab.path)}
        />

        {/* CONTROLLED LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
            <div className="w-9 h-9 border-3 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Retrieving live early-warning telemetry from central monitoring service...
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
                Authoritative warning telemetry could not be loaded. Please verify connection and retry.
              </p>
            </div>
            <button
              onClick={fetchWarnings}
              className="px-4 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Retry Telemetry Fetch</span>
            </button>
          </div>
        )}

        {/* LIVE HERO WARNING CARD */}
        {!loading && !error && heroWarning && (
          <div className="relative rounded-2xl bg-white dark:bg-[#053F5C] border-2 border-[#F27F0C] dark:border-[#F27F0C]/80 p-5 sm:p-6 shadow-xl transition-all">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#F27F0C] text-white flex items-center gap-1.5 shadow-xs">
                  <Flame size={14} /> #1 HIGHEST PRIORITY OPERATIONAL WARNING
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 dark:bg-[#031e2d] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                  Project ID: {heroWarning.projectId}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${
                  heroWarning.severity === "Critical"
                    ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                    : "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${heroWarning.severity === "Critical" ? "bg-red-500 animate-ping" : "bg-amber-500"}`} />
                  {heroWarning.severity?.toUpperCase()} SEVERITY
                </span>
              </div>

              {/* Backend Warning Severity Classification */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Warning Classification</p>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    {heroWarning.severity === "Critical" ? "Critical Impasse Alert" : `${heroWarning.severity} Priority Alert`}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-md ${
                  heroWarning.severity === "Critical"
                    ? "bg-gradient-to-br from-red-500 to-rose-700"
                    : "bg-gradient-to-br from-amber-500 to-orange-600"
                }`}>
                  <AlertTriangle size={20} />
                  <span className="text-[9px] uppercase tracking-wider">{heroWarning.severity}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-center">
              <div className="lg:col-span-7 space-y-2.5">
                <h2 className="text-lg sm:text-xl font-black text-[#1C1917] dark:text-white leading-snug">
                  {heroWarning.projectName}
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-[#F27F0C]">
                    <Building2 size={14} /> {heroWarning.ministry}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {heroWarning.sector || heroWarning.state || "Central Sector"}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                    <FileText size={14} /> {heroWarning.source || "PAIMANA Level-3 Telemetry"}
                  </span>
                </div>

                {/* Primary Warning Signal Banner */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600 dark:text-rose-400">
                    <Flame size={14} />
                    <span>{heroWarning.warningType}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {heroWarning.whatHappened || heroWarning.reason}
                  </p>
                </div>
              </div>

              {/* Impact Card & Actions */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-[#031e2d] rounded-xl p-4 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Statutory Impact & Why It Matters
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {heroWarning.whyItMatters || "Disproportionate capital expenditure or milestone delay flags immediate need for field verification."}
                  </p>
                </div>

                {/* Dual Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOpenActionModal(heroWarning)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-[#053F5C] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-white/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send size={13} className="text-[#F27F0C]" />
                    <span>Log Action</span>
                  </button>
                  <button
                    onClick={() => navigate(`/project/${heroWarning.projectId}`)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md group"
                  >
                    <span>Inspect Dossier →</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7-FILTER TOOLBAR */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID (e.g. 400010), Name, Ministry..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#F27F0C]"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Signal:</span>
                <select
                  value={selectedSignal}
                  onChange={(e) => setSelectedSignal(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 max-w-[200px] truncate"
                >
                  <option value="all">All Warning Signals</option>
                  {uniqueWarningTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tier:</span>
                <select
                  value={selectedRiskTier}
                  onChange={(e) => setSelectedRiskTier(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Tiers</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ministry:</span>
                <select
                  value={selectedMinistry}
                  onChange={(e) => setSelectedMinistry(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 max-w-[170px] truncate"
                >
                  <option value="all">All Ministries</option>
                  {uniqueMinistries.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {(searchQuery || selectedSignal !== "all" || selectedRiskTier !== "all" || selectedMinistry !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSignal("all");
                    setSelectedRiskTier("all");
                    setSelectedMinistry("all");
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ALGORITHMIC PRIORITY TABLE */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#F27F0C]" />
              <h3 className="text-sm font-black text-[#1C1917] dark:text-white uppercase tracking-wider">
                Ranked Operational Watchlist ({filteredWarnings.length} Warnings)
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
              Source of Truth: Central Warning Engine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Rank & Project</th>
                  <th className="py-3 px-4">Ministry & Sector</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Warning Signal</th>
                  <th className="py-3 px-4">Telemetric Reason</th>
                  <th className="py-3 px-4">Why It Matters</th>
                  <th className="py-3 px-4 text-right">Statutory Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {paginatedWarnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      <p className="font-semibold text-sm">
                        {loading ? "Loading early warnings..." : "No active early warnings."}
                      </p>
                      {(searchQuery || selectedSignal !== "all" || selectedRiskTier !== "all" || selectedMinistry !== "all") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedSignal("all");
                            setSelectedRiskTier("all");
                            setSelectedMinistry("all");
                          }}
                          className="mt-2 text-xs font-bold text-[#F27F0C] hover:underline cursor-pointer"
                        >
                          Reset all filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedWarnings.map((w, idx) => {
                    const rankNumber = (watchlistPage - 1) * watchlistPageSize + idx + 1;
                    const isCritical = (w.severity || "").toLowerCase() === "critical";

                    return (
                      <tr
                        key={`${w.projectId}-${w.id || idx}`}
                        className={`hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors ${
                          isCritical ? "bg-[#FEF0E7]/20 dark:bg-[#F27F0C]/5" : ""
                        }`}
                      >
                        {/* Rank & Project */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                              rankNumber === 1
                                ? "bg-[#F27F0C] text-white"
                                : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                            }`}>
                              #{rankNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="font-bold text-slate-900 dark:text-white line-clamp-1 hover:text-[#F27F0C] cursor-pointer"
                                  onClick={() => navigate(`/project/${w.projectId}`)}
                                >
                                  {w.projectName}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                ID: {w.projectId} · {w.state || "Central Sector"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Ministry & Sector */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          <p className="font-medium truncate max-w-[170px]">{w.ministry}</p>
                          <p className="text-[10px] text-slate-400">{w.sector}</p>
                        </td>

                        {/* Severity Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase inline-block ${
                            w.severity === "Critical"
                              ? "bg-red-600 text-white"
                              : w.severity === "High"
                              ? "bg-amber-500 text-white"
                              : w.severity === "Medium"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                          }`}>
                            {w.severity}
                          </span>
                        </td>

                        {/* Warning Signal */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            <Flame size={12} className={isCritical ? "text-red-500" : "text-amber-500"} />
                            <span className="line-clamp-1">{w.warningType}</span>
                          </div>
                          {w.source && (
                            <span className="text-[10px] font-mono text-slate-400 block">{w.source}</span>
                          )}
                        </td>

                        {/* Telemetric Reason */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {w.reason || w.whatHappened}
                          </p>
                        </td>

                        {/* Why It Matters */}
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                            {w.whyItMatters || "Early monitoring flag."}
                          </p>
                        </td>

                        {/* Dual Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenActionModal(w)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-[#FEF0E7] dark:hover:bg-[#F27F0C]/20 text-slate-700 dark:text-slate-200 hover:text-[#F27F0C] text-xs font-bold transition-colors cursor-pointer"
                              title="Log Statutory Action"
                            >
                              Log Action
                            </button>
                            <button
                              onClick={() => navigate(`/project/${w.projectId}`)}
                              className="px-3 py-1.5 rounded-lg bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
                              title="Inspect Project Dossier"
                            >
                              <span>Inspect</span>
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Watchlist Table Pagination Controls */}
          {filteredWarnings.length > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Showing <span className="font-bold text-slate-800 dark:text-white">{(watchlistPage - 1) * watchlistPageSize + 1}</span> to{" "}
                  <span className="font-bold text-slate-800 dark:text-white">{Math.min(filteredWarnings.length, watchlistPage * watchlistPageSize)}</span> of{" "}
                  <span className="font-bold text-slate-800 dark:text-white">{filteredWarnings.length.toLocaleString("en-IN")}</span> warnings
                </p>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
                <div className="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span>Show:</span>
                  <select
                    value={watchlistPageSize}
                    onChange={e => { setWatchlistPageSize(Number(e.target.value)); setWatchlistPage(1); }}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-bold cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setWatchlistPage(p => Math.max(1, p - 1))}
                  disabled={watchlistPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 font-bold shadow-2xs"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span className="px-3 py-1 font-bold text-slate-800 dark:text-white bg-white dark:bg-[#053F5C] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
                  Page {watchlistPage} of {totalWatchlistPages}
                </span>
                <button
                  onClick={() => setWatchlistPage(p => Math.min(totalWatchlistPages, p + 1))}
                  disabled={watchlistPage === totalWatchlistPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 font-bold shadow-2xs"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATUTORY ACTION MODAL */}
        {activeModalWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#053F5C] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#429EBD]/30 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="h-1 bg-gradient-to-r from-[#9FE7F5] via-[#429EBD] to-[#F27F0C]" />
              
              <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-[#F27F0C]" />
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    Dispatch Statutory Action Directive
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModalWarning(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAction} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Project</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10">
                    <p className="font-bold text-slate-900 dark:text-white">{activeModalWarning.projectName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {activeModalWarning.projectId} · {activeModalWarning.ministry}</p>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Statutory Action Category</label>
                  <select
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Physical Verification">Physical Verification (Field Audit)</option>
                    <option value="Ground Audit">Ground Technical & Clearance Audit</option>
                    <option value="Schedule Review">Joint Inter-Ministerial Schedule Review</option>
                    <option value="Cost Audit">Capital Expenditure & Revision Audit</option>
                    <option value="Contractor Show Cause">Contractor Performance Notice</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Statutory Officer</label>
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white mb-2"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {officerPresets.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setAssignedOfficer(name)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                          assignedOfficer === name
                            ? "bg-[#FEF0E7] text-[#F27F0C] border-[#F27F0C]"
                            : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-transparent"
                        }`}
                      >
                        {name.split(" ")[0]} {name.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Compliance Due Date</label>
                  <input
                    type="date"
                    value={actionDueDate}
                    onChange={(e) => setActionDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Directive Remarks & Findings</label>
                  <textarea
                    rows={3}
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white resize-none"
                    placeholder="Provide specific directions for ground inspection..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalWarning(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingModalAction}
                    className="px-4 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{submittingModalAction ? "Dispatching..." : "Issue Directive"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
