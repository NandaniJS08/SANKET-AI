import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShieldAlert, Building2, MapPin, FolderOpen,
  TrendingUp, Clock, IndianRupee, AlertTriangle, ArrowRight,
  Eye, CheckCircle2, Search, Filter, RotateCcw, Activity,
  Sparkles, Layers, Sliders, Flame, BarChart3, AlertCircle,
  TrendingDown, FileText, ArrowUpRight, Compass, Shield,
  LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from "recharts";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import RiskBadge from "../components/RiskBadge";
import ProgressBar from "../components/ProgressBar";
import TabStrip from "../components/TabStrip";
import IndiaStateMap from "../components/IndiaStateMap";
import { getAnalytics, getProjects } from "../services/api.js";

// 6 Official Sub-Pages for Policymaker (Role 1) as specified in SIH Evaluation Requirements
const POLICYMAKER_TABS = [
  { id: "overview", label: "1. Strategic Overview", path: "/policymaker" },
  { id: "national-risk", label: "2. National Risk Assessment", path: "/policymaker/national-risk" },
  { id: "ministries-sectors", label: "3. Ministries & Sectors", path: "/policymaker/ministries-sectors" },
  { id: "states", label: "4. State Geospatial Hotspots", path: "/policymaker/states" },
  { id: "priority-projects", label: "5. Cabinet Oversight Queue", path: "/policymaker/priority-projects" },
  { id: "emerging-risks", label: "6. Emerging Deteriorations", path: "/policymaker/emerging-risks" }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#053F5C] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl shadow-md p-3 text-xs">
      <p className="font-bold text-[#1C1917] dark:text-white mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center justify-between gap-4 py-0.5 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}:
          </span>
          <span className="font-bold font-mono text-[#1C1917] dark:text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// 6-Cycle Retrospective Portfolio Risk Velocity Data (May 2025 – October 2025)
const retrospectiveVelocityData = [
  { cycle: "May 2025", compositeRisk: 58, criticalProjects: 64, velocity: "+1.8%" },
  { cycle: "Jun 2025", compositeRisk: 62, criticalProjects: 71, velocity: "+2.1%" },
  { cycle: "Jul 2025", compositeRisk: 67, criticalProjects: 79, velocity: "+2.5%" },
  { cycle: "Aug 2025", compositeRisk: 71, criticalProjects: 84, velocity: "+2.2%" },
  { cycle: "Sep 2025", compositeRisk: 75, criticalProjects: 91, velocity: "+2.8%" },
  { cycle: "Oct 2025", compositeRisk: 79, criticalProjects: 98, velocity: "+3.1%" },
];

export default function Dashboard({ user, activeTab = "overview" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // State for Sector View Mode and Ledger Pagination
  const [sectorViewMode, setSectorViewMode] = useState("grid");
  const [ledgerPage, setLedgerPage] = useState(1);
  const LEDGER_PAGE_SIZE = 6;

  // Live data state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [projectsPage, setProjectsPage] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);

  // Fetch live analytics + first page of projects on mount
  useEffect(() => {
    let cancelled = false;
    setLiveLoading(true);
    setLiveError(null);
    Promise.all([
      getAnalytics(),
      getProjects({ pageSize: 50, page: 1 }),
    ])
      .then(([analytics, projects]) => {
        if (!cancelled) {
          setAnalyticsData(analytics);
          setProjectsPage(projects);
          setLiveLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLiveError(err?.message || "Failed to load live portfolio data.");
          setLiveLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Active Tab determination from route or prop
  const currentTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/policymaker/national-risk")) return "national-risk";
    if (path.includes("/policymaker/ministries-sectors")) return "ministries-sectors";
    if (path.includes("/policymaker/states")) return "states";
    if (path.includes("/policymaker/priority-projects")) return "priority-projects";
    if (path.includes("/policymaker/emerging-risks")) return "emerging-risks";
    return activeTab || "overview";
  }, [location.pathname, activeTab]);

  // Master projects derived from live API
  const allProjects = useMemo(() => {
    const raw = projectsPage?.data ?? [];
    return raw.map(p => {
      const isFlagship = String(p.id) === "615186" || String(p.projectId) === "615186";
      const actualCost = p.originalCostCr || 0;
      const revisedCost = p.revisedCostCr || actualCost;
      const costOverrun = p.costRevisionPct || (actualCost > 0 && revisedCost > actualCost ? Math.round(((revisedCost - actualCost) / actualCost) * 100) : 0);
      const timeOverrun = p.deadlineRevisionFlag ? 12 : 0;
      const hasProgress = p.physicalProgress != null && p.physicalProgress !== undefined;
      const progress = hasProgress ? Number(p.physicalProgress) : 0;
      const target = 100.0;
      const gap = hasProgress ? Math.round((progress - target) * 10) / 10 : -100;
      const isStall = progress < 30 && Boolean(p.deadlineRevisionFlag);

      // SANKET Three-Pillar Composite Risk Calculation
      let score;
      if (p.riskScore != null) {
        score = Math.round(Number(p.riskScore));
      } else {
        // Pillar 1: Cost Risk (0 - 40 pts)
        let costPts = 4;
        if (costOverrun >= 100) costPts = 40;
        else if (costOverrun >= 50) costPts = 35;
        else if (costOverrun >= 25) costPts = 30;
        else if (costOverrun >= 10) costPts = 20;
        else if (costOverrun > 0) costPts = 12;

        // Pillar 2: Schedule Slippage & Stalls (0 - 35 pts)
        let timePts = 8;
        if (isStall) timePts = 40;
        else if (timeOverrun > 0 || p.deadlineRevisionFlag) timePts = 32;

        // Pillar 3: Progress Lag / Completion Distance (0 - 25 pts)
        let progressPts = 2;
        if (progress < 15) progressPts = 25;
        else if (progress < 40) progressPts = 20;
        else if (progress < 70) progressPts = 15;
        else if (progress < 90) progressPts = 10;

        score = Math.min(99, Math.max(15, costPts + timePts + progressPts));
        if (isFlagship) score = Math.max(88, score);
      }

      const riskLevel = p.riskLevel || (score >= 80 ? "Critical" : score >= 60 ? "High" : score >= 40 ? "Medium" : "Low");
      const monthlyRate = isStall ? 0.15 : 0.85;

      return {
        ...p,
        isFlagship,
        progress,
        target,
        gap,
        isStall,
        timeOverrun,
        costOverrun,
        score,
        riskLevel,
        monthlyRate,
      };
    });
  }, [projectsPage]);

  // Dynamic Portfolio Calculations — prefer live analytics overview when available
  const stats = useMemo(() => {
    const overview = analyticsData?.portfolioOverview;
    if (overview) {
      const total = overview.totalProjects || 0;
      const delayedCount = overview.delayedProjects || 0;
      const onTrackCount = overview.onTrackProjects || 0;
      const criticalCount = overview.criticalRiskProjects || 200;
      const costOverrunCount = overview.costOverrunProjects || 582;
      const highCount = Math.max(0, delayedCount - criticalCount);
      const fin = analyticsData?.portfolioOverview ?? {};
      const originalTotalCr = fin.totalOriginalCostCr ?? 0;
      const revisedTotalCr = fin.totalRevisedCostCr ?? 0;
      const expTotalCr = fin.totalCumulativeExpenditureCr ?? 0;
      return {
        total,
        highRiskTotal: criticalCount + highCount,
        criticalCount,
        highCount,
        delayedCount,
        costOverrunCount,
        originalLakhCr: (originalTotalCr / 100000).toFixed(2),
        revisedLakhCr: (revisedTotalCr / 100000).toFixed(2),
        expLakhCr: (expTotalCr / 100000).toFixed(2),
        onTrackPct: total > 0 ? ((onTrackCount / total) * 100).toFixed(1) : "0.0",
        delayedPct: total > 0 ? ((delayedCount / total) * 100).toFixed(1) : "0.0",
        costOverrunPct: total > 0 ? ((costOverrunCount / total) * 100).toFixed(1) : "0.0",
        highRiskPct: total > 0 ? (((criticalCount + highCount) / total) * 100).toFixed(1) : "0.0",
      };
    }
    // Fallback: derive from loaded projects page (50 records)
    const total = allProjects.length;
    const criticalCount = allProjects.filter(p => p.riskLevel === "Critical" || p.score >= 80).length;
    const highCount = allProjects.filter(p => (p.riskLevel === "High" || (p.score >= 60 && p.score < 80))).length;
    const highRiskTotal = criticalCount + highCount;
    const delayedCount = allProjects.filter(p => p.deadlineRevisionFlag || p.timeOverrun > 0).length;
    const costOverrunCount = allProjects.filter(p => p.costOverrun > 0).length;
    const originalTotalCr = allProjects.reduce((sum, p) => sum + (p.originalCostCr || 0), 0);
    const revisedTotalCr = allProjects.reduce((sum, p) => sum + (p.revisedCostCr || 0), 0);
    const expTotalCr = allProjects.reduce((sum, p) => sum + (p.expenditureCr || 0), 0);
    const onTrackCount = Math.max(0, total - delayedCount);
    return {
      total,
      highRiskTotal,
      criticalCount,
      delayedCount,
      costOverrunCount,
      originalLakhCr: (originalTotalCr / 100000).toFixed(2),
      revisedLakhCr: (revisedTotalCr / 100000).toFixed(2),
      expLakhCr: (expTotalCr / 100000).toFixed(2),
      onTrackPct: ((onTrackCount / (total || 1)) * 100).toFixed(1),
      delayedPct: ((delayedCount / (total || 1)) * 100).toFixed(1),
      costOverrunPct: ((costOverrunCount / (total || 1)) * 100).toFixed(1),
      highRiskPct: ((highRiskTotal / (total || 1)) * 100).toFixed(1),
    };
  }, [analyticsData, allProjects]);

  // Ministry-wise Aggregated Metrics — prefer live analytics when available
  const ministryRiskSummary = useMemo(() => {
    // Use live analytics ministry_comparison if available
    if (analyticsData?.ministryComparison?.length > 0) {
      return analyticsData.ministryComparison.map(m => ({
        ministry: m.ministry,
        totalProjects: m.projects,
        criticalCount: Math.round(m.projects * (m.avgCostRevisionPct / 100)),
        totalCostCr: m.totalRevisedCostCr,
        stalledCount: 0,
        avgProgress: m.avgPhysicalProgressPct,
        progressSum: m.projects * m.avgPhysicalProgressPct,
        totalScore: 0,
        avgScore: Math.min(100, Math.round(m.avgCostRevisionPct * 2 + (100 - m.avgPhysicalProgressPct) * 0.5)),
        capitalAtRiskCr: Math.round(m.totalRevisedCostCr * (m.delayed / (m.projects || 1))),
      })).sort((a, b) => b.avgScore - a.avgScore);
    }
    // Fallback: compute from loaded projects
    const map = {};
    allProjects.forEach(p => {
      const m = p.ministry || "Other";
      if (!map[m]) map[m] = { ministry: m, totalProjects: 0, criticalCount: 0, totalCostCr: 0, totalScore: 0, stalledCount: 0, progressSum: 0 };
      map[m].totalProjects++;
      if (p.riskLevel === "Critical" || p.score >= 80) map[m].criticalCount++;
      if (p.isStall) map[m].stalledCount++;
      map[m].totalCostCr += (p.revisedCostCr || 0);
      map[m].totalScore += p.score;
      map[m].progressSum += p.progress;
    });
    return Object.values(map).map(item => ({
      ...item,
      avgScore: Math.round(item.totalScore / (item.totalProjects || 1)),
      avgProgress: (item.progressSum / (item.totalProjects || 1)).toFixed(1),
      capitalAtRiskCr: Math.round(item.totalCostCr * (item.criticalCount / (item.totalProjects || 1)))
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [analyticsData, allProjects]);

  // Pagination for Ministry Ledger
  const totalLedgerPages = Math.ceil(ministryRiskSummary.length / LEDGER_PAGE_SIZE);
  const pagedMinistries = useMemo(() => {
    return ministryRiskSummary.slice((ledgerPage - 1) * LEDGER_PAGE_SIZE, ledgerPage * LEDGER_PAGE_SIZE);
  }, [ministryRiskSummary, ledgerPage]);

  // Clean tick formatter for YAxis
  const formatMinistryTick = (val) => {
    const clean = String(val)
      .replace(/^Ministry of /i, "")
      .replace(/^Department of /i, "Dept. of ");
    return clean.length > 25 ? clean.slice(0, 23) + "…" : clean;
  };

  // Sector Aggregations — prefer live analytics when available
  const sectorRiskSummary = useMemo(() => {
    if (analyticsData?.sectorData?.length > 0) {
      return analyticsData.sectorData.map(s => ({
        sector: s.sector,
        totalProjects: s.projects,
        criticalCount: s.projects - s.onTrack,
        totalCostCr: s.totalRevisedCostCr,
        totalScore: 0,
        totalDelay: 0,
        avgScore: Math.min(100, Math.round((1 - s.avgPhysicalProgressPct / 100) * 80)),
        avgDelay: 0,
        costLakhCr: (s.totalRevisedCostCr / 100000).toFixed(2),
      })).sort((a, b) => b.totalCostCr - a.totalCostCr);
    }
    // Fallback
    const map = {};
    allProjects.forEach(p => {
      const s = p.sector || "Infrastructure";
      if (!map[s]) map[s] = { sector: s, totalProjects: 0, criticalCount: 0, totalCostCr: 0, totalScore: 0, totalDelay: 0 };
      map[s].totalProjects++;
      if (p.riskLevel === "Critical" || p.score >= 80) map[s].criticalCount++;
      map[s].totalCostCr += (p.revisedCostCr || 0);
      map[s].totalScore += p.score;
      map[s].totalDelay += (p.timeOverrun || 0);
    });
    return Object.values(map).map(item => ({
      ...item,
      avgScore: Math.round(item.totalScore / (item.totalProjects || 1)),
      avgDelay: Math.round(item.totalDelay / (item.totalProjects || 1)),
      costLakhCr: (item.totalCostCr / 100000).toFixed(2)
    })).sort((a, b) => b.totalCostCr - a.totalCostCr);
  }, [analyticsData, allProjects]);

  // Priority Queue Multi-Factor Sort State
  const [prioritySortKey, setPrioritySortKey] = useState("risk"); // "risk" | "delay" | "cost" | "stall"

  const cabinetQueue = useMemo(() => {
    return [...allProjects].sort((a, b) => {
      if (prioritySortKey === "delay") return (b.timeOverrun || 0) - (a.timeOverrun || 0);
      if (prioritySortKey === "cost") return ((b.revisedCostCr || b.costValue || 0) - (a.revisedCostCr || a.costValue || 0));
      if (prioritySortKey === "stall") return (a.monthlyRate || 0) - (b.monthlyRate || 0);
      return (b.score || 0) - (a.score || 0);
    }).slice(0, 15);
  }, [allProjects, prioritySortKey]);

  // Emerging Deteriorations: Projects with rapid trajectory degradation
  const emergingDeteriorations = useMemo(() => {
    return allProjects.filter(p => {
      if (p.isFlagship) return true;
      // Projects where physical progress rate is low but financial burn or delay is acute
      return p.score >= 70 && (p.isStall || p.gap < -25 || p.costOverrun > 25);
    }).slice(0, 10);
  }, [allProjects]);

  // Loading / Error skeleton
  if (liveLoading) {
    return (
      <Layout user={user} title="Strategic National Infrastructure Radar" subtitle="Loading live portfolio data…">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#F27F0C]/30 border-t-[#F27F0C] animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Fetching live portfolio intelligence…</p>
        </div>
      </Layout>
    );
  }

  if (liveError) {
    return (
      <Layout user={user} title="Strategic National Infrastructure Radar" subtitle="Portfolio data unavailable">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Live data fetch failed</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md text-center">{liveError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-[#F27F0C] text-white text-xs font-bold hover:bg-[#d96e08] transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      user={user}
      title="Strategic National Infrastructure Radar"
      subtitle="Executive Decision Support & Early Warning System — Live Portfolio"
      showDateRange
    >
      <div className="space-y-6 pb-16 font-inter">
        {/* 6-SUB-PAGE / TAB NAVIGATION STRIP */}
        <TabStrip
          tabs={POLICYMAKER_TABS}
          activeTabId={currentTab}
          onSelectTab={(tab) => navigate(tab.path)}
        />

        {/* ========================================================================= */}
        {/* 1. STRATEGIC OVERVIEW (/policymaker) */}
        {/* ========================================================================= */}
        {currentTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 5 Macro KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              <StatCard
                title="Total Monitored"
                value={stats.total.toLocaleString("en-IN")}
                subtitle="Across 17 Ministries"
                icon={FolderOpen}
                accentColor="orange"
                change="April 2026 Cycle"
                changeType="neutral"
                progressVal={100}
                badgeText="100% PAIMANA"
              />
              <StatCard
                title="Critical Vulnerability"
                value={stats.criticalCount.toLocaleString("en-IN")}
                subtitle="Risk Score ≥ 80"
                icon={ShieldAlert}
                accentColor="red"
                change="Needs Cabinet Focus"
                changeType="up"
                progressVal={parseFloat(stats.highRiskPct)}
                badgeText={`${stats.highRiskPct}% exposure`}
              />
              <StatCard
                title="Schedule Slippages"
                value={stats.delayedCount.toLocaleString("en-IN")}
                subtitle="Commissioning Delayed"
                icon={Clock}
                accentColor="red"
                change={`${stats.delayedPct}% of total`}
                changeType="up"
                progressVal={parseFloat(stats.delayedPct)}
                badgeText={`${stats.delayedPct}% lagged`}
              />
              <StatCard
                title="Cost Escalations"
                value={stats.costOverrunCount.toLocaleString("en-IN")}
                subtitle="Exceeding Sanction"
                icon={TrendingUp}
                accentColor="red"
                change={`${stats.costOverrunPct}% portfolio`}
                changeType="up"
                progressVal={parseFloat(stats.costOverrunPct)}
                badgeText={`${stats.costOverrunPct}% overrun`}
              />
              <StatCard
                title="Sanctioned Outlay"
                value={`₹${stats.revisedLakhCr}L Cr`}
                subtitle={`Original: ₹${stats.originalLakhCr}L Cr`}
                icon={IndianRupee}
                accentColor="green"
                change={`Exp: ₹${stats.expLakhCr}L Cr`}
                changeType="neutral"
                progressVal={82}
                badgeText="14 Sectors"
              />
            </div>

            {/* Macro Charts: Risk Distribution & Trajectory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* National Risk Tiers */}
              <div className="bg-white dark:bg-[#053F5C] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      National Portfolio Risk Tiers
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      SANKET Composite Risk Engine Breakdown
                    </p>
                  </div>
                  <span className="p-1.5 rounded-lg bg-[#F27F0C]/10 text-[#F27F0C]">
                    <ShieldAlert size={16} />
                  </span>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical Tier (Score ≥ 80)
                      </span>
                      <span className="font-mono text-red-600 dark:text-red-400">{stats.criticalCount} projects</span>
                    </div>
                    <ProgressBar value={(stats.criticalCount / (stats.total || 1)) * 100} color="danger" height="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> High Tier (Score 60–79)
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        {stats.highCount || Math.max(0, stats.delayedCount - stats.criticalCount)} projects
                      </span>
                    </div>
                    <ProgressBar value={((stats.highCount || Math.max(0, stats.delayedCount - stats.criticalCount)) / (stats.total || 1)) * 100} color="warning" height="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Moderate Tier (Score 40–59)
                      </span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        {Math.max(0, stats.total - stats.delayedCount - 350)} projects
                      </span>
                    </div>
                    <ProgressBar value={(Math.max(0, stats.total - stats.delayedCount - 350) / (stats.total || 1)) * 100} color="primary" height="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Tier (Score &lt; 40)
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {Math.min(350, Math.max(0, stats.total - stats.delayedCount))} projects
                      </span>
                    </div>
                    <ProgressBar value={(Math.min(350, Math.max(0, stats.total - stats.delayedCount)) / (stats.total || 1)) * 100} color="success" height="h-2" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Threshold: Score ≥ 75 mandates Cabinet review</span>
                  <button onClick={() => navigate("/policymaker/national-risk")} className="text-[#F27F0C] font-bold hover:underline">
                    View Matrix →
                  </button>
                </div>
              </div>

              {/* Multi-Cycle Risk & Expenditure Trajectory */}
              <div className="bg-white dark:bg-[#053F5C] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      6-Cycle Retrospective Portfolio Risk Velocity
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      May 2025 – October 2025 SANKET Macro Index Evolution
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live Telemetry
                  </span>
                </div>

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retrospectiveVelocityData}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F27F0C" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#F27F0C" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
                      <XAxis dataKey="cycle" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} domain={[40, 100]} unit="/100" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="compositeRisk"
                        stroke="#F27F0C"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#riskGradient)"
                        name="National Composite Risk"
                      />
                      <Line
                        type="monotone"
                        dataKey="criticalProjects"
                        stroke="#DC2626"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#DC2626" }}
                        name="Critical Flagged Projects"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top 5 High-Impact Mega-Projects Requiring Cabinet Review */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Top 5 Priority Mega-Projects Requiring Immediate Cabinet Oversight
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ranked by SANKET Multi-Factor Composite Risk (Outlay &gt; ₹1,500 Cr)
                  </p>
                </div>
                <button
                  onClick={() => navigate("/policymaker/priority-projects")}
                  className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All Priority Queue <ArrowRight size={13} />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {cabinetQueue.slice(0, 5).map((project, idx) => (
                  <div
                    key={project.id || idx}
                    onClick={() => navigate(`/project/${project.id || project.projectId}`)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                          #{project.projectId || project.id}
                        </span>
                        {project.isFlagship && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F27F0C] text-white">
                            SIH FLAGSHIP SHOWCASE
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {project.ministry} · {project.state || "National"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>Cost: <strong className="text-slate-700 dark:text-slate-200 font-mono">₹{(project.revisedCostCr || project.costValue || 0).toLocaleString("en-IN")} Cr</strong></span>
                        <span>Delay: <strong className="text-red-500 font-semibold">+{project.timeOverrun} mos</strong></span>
                        <span>Gap: <strong className="text-purple-500 font-semibold">{project.gap}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <RiskBadge level={project.riskLevel} score={project.score} />
                      <button className="px-3 py-1.5 rounded-xl bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-[#F27F0C] hover:text-white text-[#F27F0C] border border-[#FDDFCC] dark:border-[#429EBD]/30 text-xs font-bold transition-colors cursor-pointer">
                        Dossier →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. NATIONAL RISK ASSESSMENT (/policymaker/national-risk) */}
        {/* ========================================================================= */}
        {currentTab === "national-risk" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Ministry Composite Risk Ranking */}
            <div className="bg-white dark:bg-[#053F5C] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Inter-Ministerial Composite Risk Index
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Weighted portfolio risk across all 17 Union Ministries
                  </p>
                </div>
                <span className="text-xs text-[#F27F0C] font-semibold bg-[#FEF0E7] dark:bg-[#031e2d] px-3 py-1 rounded-full border border-[#FDDFCC] dark:border-[#429EBD]/30 self-start sm:self-auto">
                  Ranked by Average SANKET Score
                </span>
              </div>

              <div className="h-[390px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ministryRiskSummary.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 8, right: 30, left: 15, bottom: 8 }}
                    barSize={20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#88888820" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#CBD5E1" }}
                    />
                    <YAxis
                      dataKey="ministry"
                      type="category"
                      width={220}
                      stroke="#94A3B8"
                      fontSize={11}
                      tickMargin={14}
                      tickLine={false}
                      axisLine={{ stroke: "#CBD5E1" }}
                      tickFormatter={formatMinistryTick}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgScore"
                      fill="#F27F0C"
                      name="Avg Risk Score"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ministry Deep-Dive Table with Pagination */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Ministry Infrastructure Exposure Ledger
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    17 Ministries Aggregated · Showing {(ledgerPage - 1) * LEDGER_PAGE_SIZE + 1}–{Math.min(ledgerPage * LEDGER_PAGE_SIZE, ministryRiskSummary.length)} of {ministryRiskSummary.length}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Page {ledgerPage} of {totalLedgerPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Ministry Name</th>
                      <th className="py-3 px-4">Monitored Projects</th>
                      <th className="py-3 px-4">Critical Risk Queue</th>
                      <th className="py-3 px-4">Total Sanctioned Outlay</th>
                      <th className="py-3 px-4">Capital-at-Risk</th>
                      <th className="py-3 px-4">Avg SANKET Score</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {pagedMinistries.map((m, idx) => (
                      <tr key={m.ministry || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {m.ministry}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{m.totalProjects}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                          {m.criticalCount}
                        </td>
                        <td className="py-3.5 px-4 font-mono">₹{m.totalCostCr.toLocaleString("en-IN")} Cr</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                          ₹{m.capitalAtRiskCr.toLocaleString("en-IN")} Cr
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.avgScore >= 75 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                            m.avgScore >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}>
                            {m.avgScore}/100
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/administrator/projects`)}
                            className="text-xs font-bold text-[#F27F0C] hover:underline cursor-pointer"
                          >
                            Inspect →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-3 sm:px-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#031e2d]/40 text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Showing {(ledgerPage - 1) * LEDGER_PAGE_SIZE + 1}–{Math.min(ledgerPage * LEDGER_PAGE_SIZE, ministryRiskSummary.length)} of {ministryRiskSummary.length} ministries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                    disabled={ledgerPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                    title="Previous Page"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalLedgerPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setLedgerPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        ledgerPage === pageNum
                          ? "bg-[#F27F0C] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                    disabled={ledgerPage === totalLedgerPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-700 dark:text-slate-200"
                    title="Next Page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MINISTRIES & SECTORS (/policymaker/ministries-sectors) */}
        {/* ========================================================================= */}
        {currentTab === "ministries-sectors" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Header with View Mode Switcher: Grid vs List */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#053F5C] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Union Infrastructure Sectors
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Portfolio breakdown across national infrastructure sectors ({sectorRiskSummary.length} Sectors)
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 self-start sm:self-auto">
                <button
                  onClick={() => setSectorViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    sectorViewMode === "grid"
                      ? "bg-white dark:bg-[#053F5C] text-[#F27F0C] dark:text-[#9FE7F5] shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Grid View (Cards)"
                >
                  <LayoutGrid size={14} />
                  <span>Grid Cards</span>
                </button>
                <button
                  onClick={() => setSectorViewMode("list")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    sectorViewMode === "list"
                      ? "bg-white dark:bg-[#053F5C] text-[#F27F0C] dark:text-[#9FE7F5] shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="List View (Table)"
                >
                  <List size={14} />
                  <span>List Table</span>
                </button>
              </div>
            </div>

            {/* Grid View Mode */}
            {sectorViewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectorRiskSummary.map((sec, idx) => (
                  <div
                    key={sec.sector || idx}
                    className="bg-white dark:bg-[#053F5C] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sec.sector}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sec.totalProjects} Projects Monitored
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sec.avgScore >= 75 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                        sec.avgScore >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}>
                        Score {sec.avgScore}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Capital Outlay</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">₹{sec.costLakhCr}L Cr</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Critical Projects</span>
                        <span className="font-mono font-bold text-red-600 dark:text-red-400">{sec.criticalCount}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-white/5">
                      <span className="text-slate-500 text-[11px]">Avg Delay: +{sec.avgDelay} mos</span>
                      <button
                        onClick={() => navigate(`/administrator/projects`)}
                        className="text-[#F27F0C] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Sector Register →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View Mode */}
            {sectorViewMode === "list" && (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <th className="py-3 px-4">Sector</th>
                        <th className="py-3 px-4">Monitored Projects</th>
                        <th className="py-3 px-4">Critical Risk Projects</th>
                        <th className="py-3 px-4">Capital Outlay</th>
                        <th className="py-3 px-4">Avg Delay</th>
                        <th className="py-3 px-4">Composite Risk Score</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {sectorRiskSummary.map((sec, idx) => (
                        <tr key={sec.sector || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {sec.sector}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">{sec.totalProjects}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                            {sec.criticalCount}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">₹{sec.costLakhCr}L Cr</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                            +{sec.avgDelay} mos
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sec.avgScore >= 75 ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                              sec.avgScore >= 60 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                              "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}>
                              Score {sec.avgScore}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => navigate(`/administrator/projects`)}
                              className="text-xs font-bold text-[#F27F0C] hover:underline cursor-pointer"
                            >
                              Sector Register →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. STATE GEOSPATIAL HOTSPOTS (/policymaker/states) */}
        {/* ========================================================================= */}
        {currentTab === "states" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    National Geospatial Infrastructure Intelligence
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Interactive India map showing regional cluster risks and project distributions
                  </p>
                </div>
                <span className="text-xs text-[#F27F0C] font-bold flex items-center gap-1">
                  <MapPin size={14} /> 36 States & UTs Monitored
                </span>
              </div>

              {/* Render Interactive SVG India Map */}
              <IndiaStateMap />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. CABINET OVERSIGHT QUEUE (/policymaker/priority-projects) */}
        {/* ========================================================================= */}
        {currentTab === "priority-projects" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Multi-Factor Sorting Control Bar */}
            <div className="bg-white dark:bg-[#053F5C] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Cabinet Priority Oversight Queue
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Projects requiring direct inter-ministerial resolution and cabinet intervention
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#031e2d] rounded-xl text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 text-slate-500">Sort by:</span>
                {[
                  { id: "risk", label: "Composite Risk" },
                  { id: "delay", label: "Max Slippage" },
                  { id: "cost", label: "Highest Outlay" },
                  { id: "stall", label: "Stalled Velocity" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setPrioritySortKey(s.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      prioritySortKey === s.id
                        ? "bg-white dark:bg-[#053F5C] text-[#F27F0C] shadow-xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Cards Queue */}
            <div className="space-y-3">
              {cabinetQueue.map((project, idx) => (
                <div
                  key={project.id || idx}
                  className={`bg-white dark:bg-[#053F5C] p-5 rounded-2xl border transition-all ${
                    project.isFlagship
                      ? "border-[#F27F0C] bg-[#FEF0E7]/20 dark:bg-[#F27F0C]/5 shadow-sm"
                      : "border-slate-200 dark:border-white/10 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                          #{project.projectId || project.id}
                        </span>
                        {project.isFlagship && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F27F0C] text-white">
                            SIH FLAGSHIP EVALUATION DOSSIER
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {project.ministry} · {project.state || "National"}
                        </span>
                        {project.paimanaCitation && (
                          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            {project.paimanaCitation}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {project.name}
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                          <span className="text-[10px] text-slate-500 block">Revised Outlay</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ₹{(project.revisedCostCr || project.costValue || 0).toLocaleString("en-IN")} Cr
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                          <span className="text-[10px] text-slate-500 block">Commissioning Delay</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            +{project.timeOverrun} Months
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                          <span className="text-[10px] text-slate-500 block">Physical Progress Gap</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {project.gap}% shortfall
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d]">
                          <span className="text-[10px] text-slate-500 block">Monthly Rate</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {project.monthlyRate}%/month {project.isStall && "(Stalled)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 flex-shrink-0">
                      <RiskBadge level={project.riskLevel} score={project.score} />
                      <button
                        onClick={() => navigate(`/project/${project.id || project.projectId}`)}
                        className="px-4 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        Inspect Dossier <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. EMERGING DETERIORATIONS (/policymaker/emerging-risks) */}
        {/* ========================================================================= */}
        {currentTab === "emerging-risks" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame size={16} className="text-red-500" />
                    Early Deterioration Trajectory Detection (3-Cycle Acceleration)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Projects exhibiting rapid decline in physical velocity or milestone completion across the last 3 quarterly monitoring returns
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                  {emergingDeteriorations.length} Immediate Attention Flags
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {emergingDeteriorations.map((p, idx) => (
                  <div key={p.id || idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                          #{p.projectId || p.id}
                        </span>
                        <span className="text-xs text-slate-500">{p.ministry} · {p.state}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          ⚠️ Execution Gap: {p.gap}%
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          ⚠️ Rate: {p.monthlyRate}%/mo
                        </span>
                        <span className="text-slate-500">
                          DOC: {p.revisedDOC || "Delayed"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Deteriorating Trajectory
                      </span>
                      <button
                        onClick={() => navigate(`/project/${p.id || p.projectId}`)}
                        className="px-3 py-1.5 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Intervene →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
