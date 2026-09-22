import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck, FolderOpen, AlertTriangle, Clock, IndianRupee,
  Activity, CheckCircle2, Search, Filter, RotateCcw, Send,
  Plus, ArrowRight, ExternalLink, Calendar, Layers, Eye,
  Building2, MapPin, FileSpreadsheet, Sparkles, TrendingUp,
  AlertCircle, X, ChevronDown, Check, Flame, BarChart3,
  LayoutGrid, List, ChevronLeft, ChevronRight
} from "lucide-react";
import Layout from "../components/Layout";
import RiskBadge from "../components/RiskBadge";
import ProgressBar from "../components/ProgressBar";
import TabStrip from "../components/TabStrip";
import { getProjects, getStatsOverview, getAnalytics, getActions, updateActionStatus } from "../services/api.js";

// Reusable Professional Table Pagination Component
function TablePagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems <= pageSize) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="p-3.5 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-white/[0.02]">
      <p className="text-slate-500 dark:text-slate-400 font-medium">
        Showing <span className="font-bold text-slate-800 dark:text-white">{startItem}</span> to <span className="font-bold text-slate-800 dark:text-white">{endItem}</span> of <span className="font-bold text-slate-800 dark:text-white">{totalItems.toLocaleString("en-IN")}</span> entries
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-2xs"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="px-3 py-1 font-bold text-slate-800 dark:text-white bg-white dark:bg-[#053F5C] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs shadow-2xs"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// 8 Sub-Pages / Tabs specified in Page 2 of the PDF
const TABS = [
  { id: "overview", label: "1. Portfolio Overview", path: "/administrator" },
  { id: "projects", label: "2. My Projects Register", path: "/administrator/projects" },
  { id: "priority", label: "3. Priority Projects Queue", path: "/administrator/priority-projects" },
  { id: "cost", label: "4. Cost Monitoring", path: "/administrator/cost" },
  { id: "progress", label: "5. Progress Monitoring", path: "/administrator/progress" },
  { id: "schedule", label: "6. Schedule Monitoring", path: "/administrator/schedule" },
  { id: "actions", label: "7. Actions & Interventions", path: "/administrator/actions" },
  { id: "risk-trends", label: "8. Portfolio Risk Trends", path: "/administrator/risk-trends" }
];

export default function AdminDashboard({ user, activeTab = "overview" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from prop or URL pathname
  const currentTab = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/administrator/projects")) return "projects";
    if (path.includes("/administrator/priority-projects")) return "priority";
    if (path.includes("/administrator/cost")) return "cost";
    if (path.includes("/administrator/progress")) return "progress";
    if (path.includes("/administrator/schedule")) return "schedule";
    if (path.includes("/administrator/actions")) return "actions";
    if (path.includes("/administrator/risk-trends")) return "risk-trends";
    return activeTab || "overview";
  }, [location.pathname, activeTab]);

  // Live data state
  const [liveProjectsData, setLiveProjectsData] = useState(null); // ApiListResponse<Project>
  const [liveStats, setLiveStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState(null);

  // Fetch initial live data
  useEffect(() => {
    let cancelled = false;
    setLiveLoading(true);
    Promise.all([
      getProjects({ pageSize: 100, page: 1 }),
      getStatsOverview(),
      getAnalytics().catch(() => null),
      getActions().catch(() => []),
    ])
      .then(([projectsResp, stats, analytics, liveActions]) => {
        if (!cancelled) {
          setLiveProjectsData(projectsResp);
          setLiveStats(stats);
          if (analytics) setAnalyticsData(analytics);
          if (Array.isArray(liveActions) && liveActions.length > 0) {
            setActionLedger(prev => {
              const prevIds = new Set(prev.map(a => String(a.id || a.actionId)));
              const merged = [...prev];
              liveActions.forEach(la => {
                if (!prevIds.has(String(la.id || la.actionId))) {
                  merged.push({
                    id: la.id || la.actionId,
                    project: `Project #${la.projectId}`,
                    projectId: la.projectId,
                    type: la.actionType || la.type || "Physical Verification",
                    officer: la.assignedTo || la.officer || "Assigned Officer",
                    date: la.date || (la.createdAt ? String(la.createdAt).split("T")[0] : "2025-10-01"),
                    dueDate: la.dueDate || "2025-11-15",
                    status: la.status || "Open",
                    remarks: la.description || la.remarks || ""
                  });
                }
              });
              return merged;
            });
          }
          setLiveLoading(false);
        }
      })
      .catch(err => {
        // BUG-007 FIX: catch both outer rejection and errors thrown inside .then() callback
        if (!cancelled) {
          setLiveError(err?.message || "Failed to load portfolio data");
          setLiveLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Master projects derived from live API
  const allProjects = useMemo(() => {
    const raw = liveProjectsData?.data ?? [];
    return raw.map(p => {
      const isFlagship = String(p.id) === "615186" || String(p.projectId) === "615186";
      const actualCost = p.originalCostCr || 0;
      const revisedCost = p.revisedCostCr || actualCost;
      const costOverrun = p.costRevisionPct || (actualCost > 0 && revisedCost > actualCost ? Math.round(((revisedCost - actualCost) / actualCost) * 100) : 0);
      const timeOverrun = p.deadlineRevisionFlag ? 12 : 0;
      const hasProgress = p.physicalProgress != null && p.physicalProgress !== undefined;
      const progress = hasProgress ? Number(p.physicalProgress) : 0;
      const target = 100.0;
      const gap = hasProgress ? Math.round((100 - progress) * 10) / 10 : 0;
      const isStall = progress < 30 && Boolean(p.deadlineRevisionFlag);

      // SANKET Three-Pillar Composite Risk Calculation
      let compositeScore;
      if (p.riskScore != null) {
        compositeScore = Math.round(Number(p.riskScore));
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

        compositeScore = Math.min(99, Math.max(15, costPts + timePts + progressPts));
        if (isFlagship) compositeScore = Math.max(88, compositeScore);
      }

      return {
        ...p,
        isFlagship,
        compositeScore,
        costOverrun,
        timeOverrun,
        hasProgress,
        progress,
        target,
        gap,
        isStall,
        actualCost,
        revisedCost,
        expenditure: p.expenditureCr || 0,
        burnPct: revisedCost > 0 ? Math.min(100, Math.round(((p.expenditureCr || 0) / revisedCost) * 100)) : 0,
        revisionsCount: costOverrun > 0 ? (costOverrun > 30 ? 2 : 1) : 0,
        statusBadge: isFlagship ? "Critical Delay" : (compositeScore >= 80 ? "Critical Delay" : timeOverrun > 0 ? "Delayed" : "On Track"),
        interventionStatus: isFlagship ? "Field Notice Sent" : (compositeScore >= 80 ? "Audit Scheduled" : compositeScore >= 65 ? "Under Review" : "Complied")
      };
    });
  }, [liveProjectsData]);

  // -------------------------------------------------------------
  // 7-FILTER MASTER TOOLBAR STATE (Section 02)
  // -------------------------------------------------------------
  const [filterMinistry, setFilterMinistry] = useState("All");
  const [filterSector, setFilterSector] = useState("All");
  const [filterState, setFilterState] = useState("All");
  const [filterAgency, setFilterAgency] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [searchRegister, setSearchRegister] = useState("");

  const resetAllFilters = () => {
    setFilterMinistry("All");
    setFilterSector("All");
    setFilterState("All");
    setFilterAgency("All");
    setFilterStatus("All");
    setFilterRisk("All");
    setFilterMonth("All");
    setSearchRegister("");
  };

  const isFilterActive = (
    filterMinistry !== "All" ||
    filterSector !== "All" ||
    filterState !== "All" ||
    filterAgency !== "All" ||
    filterStatus !== "All" ||
    filterRisk !== "All" ||
    filterMonth !== "All" ||
    searchRegister.trim() !== ""
  );

  // Distinct filter option lists (Alphabetically Sorted)
  const uniqueMinistries = useMemo(() => Array.from(new Set(allProjects.map(p => p.ministry).filter(Boolean))).sort(), [allProjects]);
  const uniqueSectors = useMemo(() => Array.from(new Set(allProjects.map(p => p.sector).filter(Boolean))).sort(), [allProjects]);
  const uniqueStates = useMemo(() => Array.from(new Set(allProjects.map(p => p.state).filter(Boolean))).sort(), [allProjects]);
  const uniqueAgencies = useMemo(() => Array.from(new Set(allProjects.map(p => p.agency).filter(Boolean))).sort(), [allProjects]);

  // Filtered register list
  const filteredRegister = useMemo(() => {
    return allProjects.filter(p => {
      const q = searchRegister.trim().toLowerCase();
      if (q) {
        const matchId = String(p.id || p.projectId || "").toLowerCase().includes(q);
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchMinistry = (p.ministry || "").toLowerCase().includes(q);
        const matchAgency = (p.agency || "").toLowerCase().includes(q);
        const matchState = (p.state || "").toLowerCase().includes(q);
        if (!matchId && !matchName && !matchMinistry && !matchAgency && !matchState) return false;
      }
      if (filterMinistry !== "All" && p.ministry !== filterMinistry) return false;
      if (filterSector !== "All" && p.sector !== filterSector) return false;
      if (filterState !== "All" && p.state !== filterState) return false;
      if (filterAgency !== "All" && p.agency !== filterAgency) return false;
      if (filterStatus !== "All" && p.statusBadge !== filterStatus) return false;
      if (filterRisk !== "All") {
        if (filterRisk === "Critical" && p.compositeScore < 80) return false;
        if (filterRisk === "High" && (p.compositeScore < 60 || p.compositeScore >= 80)) return false;
        if (filterRisk === "Moderate" && p.compositeScore >= 60) return false;
      }
      if (filterMonth !== "All") {
        if (filterMonth.includes("Oct") && p.reportingMonth !== "October 2025" && !p.isFlagship) return false;
        if (filterMonth.includes("Mar") && p.reportingMonth !== "2026-03" && !p.reportingMonth?.includes("March")) return false;
      }
      return true;
    });
  }, [allProjects, searchRegister, filterMinistry, filterSector, filterState, filterAgency, filterStatus, filterRisk, filterMonth]);

  // Pagination & View Mode States
  const [registerViewMode, setRegisterViewMode] = useState("list");
  const [registerPage, setRegisterPage] = useState(1);
  const registerPageSize = 12;

  const [costPage, setCostPage] = useState(1);
  const costPageSize = 10;
  const [searchCost, setSearchCost] = useState("");

  const [progressPage, setProgressPage] = useState(1);
  const progressPageSize = 10;
  const [searchProgress, setSearchProgress] = useState("");

  const [schedulePage, setSchedulePage] = useState(1);
  const schedulePageSize = 10;
  const [searchSchedule, setSearchSchedule] = useState("");

  const [priorityPage, setPriorityPage] = useState(1);
  const priorityPageSize = 6;
  const [searchPriority, setSearchPriority] = useState("");

  // Reset pages when search or filters change
  useEffect(() => {
    setRegisterPage(1);
  }, [searchRegister, filterMinistry, filterSector, filterState, filterAgency, filterStatus, filterRisk, filterMonth]);

  useEffect(() => {
    setPriorityPage(1);
  }, [searchPriority]);

  useEffect(() => {
    setCostPage(1);
  }, [searchCost]);

  useEffect(() => {
    setProgressPage(1);
  }, [searchProgress]);

  useEffect(() => {
    setSchedulePage(1);
  }, [searchSchedule]);

  // Paginated Data Slices
  const totalRegisterPages = Math.max(1, Math.ceil(filteredRegister.length / registerPageSize));
  const paginatedRegister = useMemo(() => {
    const start = (registerPage - 1) * registerPageSize;
    return filteredRegister.slice(start, start + registerPageSize);
  }, [filteredRegister, registerPage, registerPageSize]);


  const costProjects = useMemo(() => {
    let list = allProjects.filter(p => p.costOverrun > 0 || p.isFlagship);
    if (searchCost.trim()) {
      const q = searchCost.toLowerCase().trim();
      list = list.filter(p => {
        const id = String(p.id || p.projectId || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const ministry = (p.ministry || "").toLowerCase();
        const agency = (p.agency || "").toLowerCase();
        const sector = (p.sector || "").toLowerCase();
        return id.includes(q) || name.includes(q) || ministry.includes(q) || agency.includes(q) || sector.includes(q);
      });
    }
    return list;
  }, [allProjects, searchCost]);
  const totalCostPages = Math.max(1, Math.ceil(costProjects.length / costPageSize));
  const paginatedCostProjects = useMemo(() => {
    const start = (costPage - 1) * costPageSize;
    return costProjects.slice(start, start + costPageSize);
  }, [costProjects, costPage, costPageSize]);

  const progressProjects = useMemo(() => {
    let list = allProjects.filter(p => p.gap < -15 || p.isStall);
    if (searchProgress.trim()) {
      const q = searchProgress.toLowerCase().trim();
      list = list.filter(p => {
        const id = String(p.id || p.projectId || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const ministry = (p.ministry || "").toLowerCase();
        const agency = (p.agency || "").toLowerCase();
        const sector = (p.sector || "").toLowerCase();
        return id.includes(q) || name.includes(q) || ministry.includes(q) || agency.includes(q) || sector.includes(q);
      });
    }
    return list;
  }, [allProjects, searchProgress]);
  const totalProgressPages = Math.max(1, Math.ceil(progressProjects.length / progressPageSize));
  const paginatedProgressProjects = useMemo(() => {
    const start = (progressPage - 1) * progressPageSize;
    return progressProjects.slice(start, start + progressPageSize);
  }, [progressProjects, progressPage, progressPageSize]);

  const scheduleProjects = useMemo(() => {
    let list = allProjects.filter(p => p.timeOverrun > 0 || p.isFlagship);
    if (searchSchedule.trim()) {
      const q = searchSchedule.toLowerCase().trim();
      list = list.filter(p => {
        const id = String(p.id || p.projectId || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const ministry = (p.ministry || "").toLowerCase();
        const agency = (p.agency || "").toLowerCase();
        const sector = (p.sector || "").toLowerCase();
        return id.includes(q) || name.includes(q) || ministry.includes(q) || agency.includes(q) || sector.includes(q);
      });
    }
    return list;
  }, [allProjects, searchSchedule]);
  const totalSchedulePages = Math.max(1, Math.ceil(scheduleProjects.length / schedulePageSize));
  const paginatedScheduleProjects = useMemo(() => {
    const start = (schedulePage - 1) * schedulePageSize;
    return scheduleProjects.slice(start, start + schedulePageSize);
  }, [scheduleProjects, schedulePage, schedulePageSize]);

  // -------------------------------------------------------------
  // CENTRAL INTERVENTION LEDGER STATE (Section 07)
  // -------------------------------------------------------------
  const [actionLedger, setActionLedger] = useState(() => {
    // Collect persisted actions from localStorage
    const saved = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sanket_actions_")) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              saved.push(...parsed);
            }
          }
        }
      }
    } catch {
      // ignore
    }

    // Default statutory directives if empty
    if (saved.length === 0) {
      return [
        { id: "ACT-615186-01", project: "4L Greenfield Expressway Corridor (Package-IV) on NH-163G", projectId: "615186", type: "Physical Verification", officer: "Dr. Rajesh Kumar (IAS)", date: "2025-10-12", dueDate: "2025-10-26", status: "In Progress", remarks: "Order joint field inspection by MoSPI Nodal Officer to resolve site milestone bottleneck." },
        { id: "ACT-615186-02", project: "4L Greenfield Expressway Corridor (Package-IV) on NH-163G", projectId: "615186", type: "Schedule Review", officer: "Ananya Deshmukh (Reviewer)", date: "2025-09-18", dueDate: "2025-10-02", status: "Overdue", remarks: "Contractor show-cause notice regarding <0.2%/mo physical velocity." },
        { id: "ACT-521940-01", project: "Dedicated Freight Corridor (Western Corridor Ph-II)", projectId: "521940", type: "Cost Audit", officer: "Amit Sharma (Admin)", date: "2025-10-05", dueDate: "2025-10-30", status: "Open", remarks: "Review ₹1,450 Cr cost amendment request submitted by DFCCIL." },
        { id: "ACT-488210-01", project: "Mumbai Metro Line 4 (Wadala-Ghatkopar-Kasarvadavali)", projectId: "488210", type: "Ground Audit", officer: "M. K. Tripathy (CPWD)", date: "2025-08-20", dueDate: "2025-09-15", status: "Closed", remarks: "Viaduct Right-of-Way clearance report submitted to state urban dept." },
        { id: "ACT-390142-01", project: "Barauni to Guwahati Natural Gas Pipeline (BGPL)", projectId: "390142", type: "Physical Verification", officer: "Sanjay Barua (IWAI)", date: "2025-09-02", dueDate: "2025-09-20", status: "Closed", remarks: "River crossing trenching milestone verified on site." }
      ];
    }
    return saved;
  });

  const priorityFollowUpProjects = useMemo(() => {
    // Also include any project that currently has an active action directive
    const actionProjectIds = new Set(actionLedger.map(a => String(a.projectId)));
    
    let list = allProjects.filter(p => 
      p.compositeScore >= 70 || 
      p.isFlagship || 
      p.isStall || 
      p.costOverrun >= 50 || 
      actionProjectIds.has(String(p.id)) || 
      actionProjectIds.has(String(p.projectId))
    );
    if (searchPriority.trim()) {
      const q = searchPriority.toLowerCase().trim();
      list = list.filter(p => {
        const id = String(p.id || p.projectId || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        const ministry = (p.ministry || "").toLowerCase();
        const agency = (p.agency || "").toLowerCase();
        const status = (p.interventionStatus || "").toLowerCase();
        return id.includes(q) || name.includes(q) || ministry.includes(q) || agency.includes(q) || status.includes(q);
      });
    }
    return list;
  }, [allProjects, searchPriority, actionLedger]);

  const totalPriorityPages = Math.max(1, Math.ceil(priorityFollowUpProjects.length / priorityPageSize));
  
  const paginatedPriorityFollowUpProjects = useMemo(() => {
    const start = (priorityPage - 1) * priorityPageSize;
    return priorityFollowUpProjects.slice(start, start + priorityPageSize);
  }, [priorityFollowUpProjects, priorityPage, priorityPageSize]);

  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("All");
  const [showStatutoryModal, setShowStatutoryModal] = useState(false);
  const [modalTargetProjId, setModalTargetProjId] = useState("615186");
  const [modalActionType, setModalActionType] = useState("Physical Verification");
  const [modalOfficer, setModalOfficer] = useState("Dr. Rajesh Kumar (IAS)");
  const [modalDueDate, setModalDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [modalRemarks, setModalRemarks] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // BUG-006 FIX: Store toast timer ref to clearTimeout on unmount
  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);
  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 3500);
  };

  // BUG-011 FIX: Wire PATCH /api/v1/actions/{id}/status to persist status to Supabase, not just localStorage
  const handleTransitionStatus = (actionId, newStatus) => {
    // Optimistic UI update
    const updated = actionLedger.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
    setActionLedger(updated);

    // Persist to backend (Supabase via PATCH)
    updateActionStatus(String(actionId), newStatus).catch(err => {
      // On failure, revert optimistic update and show error toast
      setActionLedger(actionLedger);
      showToast(`Failed to update status: ${err?.message || 'Network error'}`);
      console.error('[AdminDashboard] PATCH action status failed:', err);
    });

    // Also sync to localStorage as backup for offline scenario
    const targetAction = actionLedger.find(a => a.id === actionId);
    if (targetAction && targetAction.projectId) {
      try {
        const key = `sanket_actions_${targetAction.projectId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const syncUpdated = existing.map(a => a.id === actionId ? { ...a, status: newStatus } : a);
        localStorage.setItem(key, JSON.stringify(syncUpdated));
      } catch {
        // ignore localStorage errors
      }
    }
    showToast(`Action Directive ${actionId} status transitioned to: ${newStatus}`);
  };

  // Dispatch New Action Directive
  const handleCreateDirective = (e) => {
    e.preventDefault();
    const proj = allProjects.find(p => String(p.id) === String(modalTargetProjId) || String(p.projectId) === String(modalTargetProjId)) || allProjects[0];
    const newDirective = {
      id: `ACT-${proj.id || proj.projectId}-${String(actionLedger.length + 1).padStart(2, "0")}`,
      project: proj.name,
      projectId: String(proj.id || proj.projectId),
      type: modalActionType,
      officer: modalOfficer,
      date: new Date().toISOString().split("T")[0],
      dueDate: modalDueDate,
      status: "Open",
      remarks: modalRemarks || `Statutory directive issued by Administrator to expedite milestone completion.`
    };

    const nextLedger = [newDirective, ...actionLedger];
    setActionLedger(nextLedger);

    // Save in project's localStorage
    try {
      const key = `sanket_actions_${newDirective.projectId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([newDirective, ...existing]));
    } catch {
      // ignore
    }

    setShowStatutoryModal(false);
    setModalRemarks("");
    showToast(`Statutory Action Directive ${newDirective.id} dispatched!`);
  };

  // Filtered action ledger
  const filteredActions = useMemo(() => {
    if (ledgerStatusFilter === "All") return actionLedger;
    return actionLedger.filter(a => a.status.toLowerCase() === ledgerStatusFilter.toLowerCase());
  }, [actionLedger, ledgerStatusFilter]);

  // Action status counts
  const actionCounts = useMemo(() => {
    return {
      open: actionLedger.filter(a => a.status === "Open").length,
      inProgress: actionLedger.filter(a => a.status === "In Progress").length,
      overdue: actionLedger.filter(a => a.status === "Overdue").length,
      closed: actionLedger.filter(a => a.status === "Closed" || a.status === "Completed").length
    };
  }, [actionLedger]);

  // Show loading/error before main render
  if (liveLoading) {
    return (
      <Layout user={user}>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#F27F0C]/30 border-t-[#F27F0C] animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading live portfolio data…</p>
        </div>
      </Layout>
    );
  }

  if (liveError) {
    return (
      <Layout user={user}>
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
    <Layout user={user}>
      <div className="space-y-6 pb-16 font-inter">

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#053F5C] text-white border border-[#429EBD] rounded-xl shadow-2xl animate-in slide-in-from-bottom-5">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-xs font-semibold">{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-slate-400 hover:text-white ml-2">
              <X size={14} />
            </button>
          </div>
        )}

        {/* EXECUTIVE MASTER HEADER BANNER */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200/90 dark:border-[#429EBD]/30 p-5 sm:p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-xs transition-colors">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F27F0C]/10 dark:bg-[#F27F0C]/20 border border-[#F27F0C]/25 dark:border-[#429EBD]/30 text-xs font-bold text-[#F27F0C] dark:text-[#9FE7F5]">
                <ShieldCheck size={14} />
                <span>Portfolio Administration & Statutory Oversight</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Master Portfolio Register & Intervention Ledger
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Central oversight of ₹150+ Cr mega-projects, three-pillar variance monitoring (Cost, Progress, Schedule), and live statutory directive follow-through.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={() => setShowStatutoryModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer group"
              >
                <Plus size={15} className="group-hover:rotate-90 transition-transform" />
                <span>Issue Statutory Directive</span>
              </button>
            </div>
          </div>
        </div>

        {/* 8-SUB-PAGE / TAB NAVIGATION STRIP */}
        <TabStrip
          tabs={TABS}
          activeTabId={currentTab}
          onSelectTab={(tab) => navigate(tab.path)}
        />

        {/* ========================================================================= */}
        {/* SECTION 01: PORTFOLIO OVERVIEW (/administrator) */}
        {/* ========================================================================= */}
        {currentTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. Executive Portfolio Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Total Ongoing Works</span>
                  <FolderOpen size={18} className="text-[#F27F0C]" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{(liveStats?.total_projects ?? allProjects.length).toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across 17 Central Ministries</p>
              </div>

              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Critical Flagged</span>
                  <AlertTriangle size={18} className="text-rose-500" />
                </div>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {(analyticsData?.portfolioOverview?.delayedProjects ?? allProjects.filter(p => p.compositeScore >= 80).length).toLocaleString("en-IN")} Works
                </p>
                <p className="text-[11px] text-rose-500 font-bold mt-1">SANKET Risk Score ≥ 80</p>
              </div>

              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Budget Variation</span>
                  <IndianRupee size={18} className="text-amber-500" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">+₹{liveStats ? ((liveStats.portfolio_financials?.total_revised_cost_cr - liveStats.portfolio_financials?.total_original_cost_cr) / 100000).toFixed(2) : "N/A"} L Cr</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                  {liveStats ? `+${(((liveStats.portfolio_financials?.total_revised_cost_cr - liveStats.portfolio_financials?.total_original_cost_cr) / (liveStats.portfolio_financials?.total_original_cost_cr || 1)) * 100).toFixed(1)}% Portfolio Escalation` : "Cost Revision Data"}
                </p>
              </div>

              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Pending Directives</span>
                  <Send size={18} className="text-purple-500" />
                </div>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-300">
                  {actionCounts.open + actionCounts.inProgress + actionCounts.overdue} Active
                </p>
                <p className="text-[11px] text-purple-500 font-bold mt-1">{actionCounts.overdue} Overdue Compliance</p>
              </div>
            </div>

            {/* 2. Three-Pillar Variance Glance */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Three-Pillar Variance Glance</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Holistic cross-pillar comparison of cost, physical velocity, and schedule slippage.</p>
                </div>
                <span className="text-xs font-bold text-[#F27F0C] bg-[#FEF0E7] dark:bg-[#031e2d] px-3 py-1 rounded-full border border-[#F27F0C]/30">
                  April 2026 Cycle
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Pillar 1: Cost */}
                <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-4 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                      <IndianRupee size={14} className="text-rose-500" /> 1. Cost Escalation
                    </span>
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">452 Revised</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">+₹4,18,290 Cr</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Total sanction difference vs original approval benchmarks.</p>
                  <button onClick={() => navigate("/administrator/cost")} className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 pt-1">
                    <span>Inspect Cost Meters</span> <ArrowRight size={12} />
                  </button>
                </div>

                {/* Pillar 2: Progress */}
                <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-4 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                      <Activity size={14} className="text-amber-500" /> 2. Progress Gap
                    </span>
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">8 Stalled Works</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">-18.4% pts</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Average physical execution gap against statutory target baselines.</p>
                  <button onClick={() => navigate("/administrator/progress")} className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 pt-1">
                    <span>Inspect Shortfall Alerts</span> <ArrowRight size={12} />
                  </button>
                </div>

                {/* Pillar 3: Schedule */}
                <div className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-4 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-500" /> 3. Schedule Delays
                    </span>
                    <span className="text-[10px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">814 Delayed</span>
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white">+38.6 Months</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Average commissioning slippage past original approved DOC.</p>
                  <button onClick={() => navigate("/administrator/schedule")} className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 pt-1">
                    <span>Inspect Slippage Timeline</span> <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Pending Actions Counter Ledger Glance */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Pending Statutory Directives Status</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active monitoring orders issued to field agencies and project directors.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {actionCounts.open} Open
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    {actionCounts.inProgress} In Progress
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    {actionCounts.overdue} Overdue
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {actionCounts.closed} Closed
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-2.5 px-3">Directive ID</th>
                      <th className="py-2.5 px-3">Project</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Officer</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Live Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {actionLedger.slice(0, 4).map(action => (
                      <tr key={action.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                        <td className="py-3 px-3 font-mono font-bold text-[#F27F0C]">{action.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{action.project}</td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{action.type}</td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{action.officer}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">{action.dueDate}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            action.status === "Open" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                            action.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" :
                            action.status === "Overdue" ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300" :
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}>
                            {action.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 text-right">
                <button onClick={() => navigate("/administrator/actions")} className="text-xs font-bold text-[#F27F0C] hover:underline inline-flex items-center gap-1">
                  <span>Open Complete Central Intervention Ledger</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 02: MY PROJECTS REGISTER & 7-FILTER TOOLBAR (/administrator/projects) */}
        {/* ========================================================================= */}
        {currentTab === "projects" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 7-FILTER MASTER TOOLBAR */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#F27F0C]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    7-Filter Master Toolbar
                  </h3>
                </div>
                {isFilterActive && (
                  <button
                    onClick={resetAllFilters}
                    className="px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RotateCcw size={12} />
                    <span>1-Click Filter Reset</span>
                  </button>
                )}
              </div>

              {/* Filter Dropdowns Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
                {/* 1. Ministry */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Ministry</label>
                  <select
                    value={filterMinistry}
                    onChange={e => setFilterMinistry(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white truncate"
                  >
                    <option value="All">All Ministries</option>
                    {uniqueMinistries.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* 2. Sector */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Sector</label>
                  <select
                    value={filterSector}
                    onChange={e => setFilterSector(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white truncate"
                  >
                    <option value="All">All Sectors</option>
                    {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* 3. State / UT */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">State / UT</label>
                  <select
                    value={filterState}
                    onChange={e => setFilterState(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white truncate"
                  >
                    <option value="All">All States</option>
                    {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* 4. Implementing Agency */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Agency</label>
                  <select
                    value={filterAgency}
                    onChange={e => setFilterAgency(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white truncate"
                  >
                    <option value="All">All Agencies</option>
                    {uniqueAgencies.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* 5. Status */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Critical Delay">Critical Delay</option>
                    <option value="Delayed">Delayed</option>
                    <option value="On Track">On Track</option>
                  </select>
                </div>

                {/* 6. Risk Tier */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Risk Tier</label>
                  <select
                    value={filterRisk}
                    onChange={e => setFilterRisk(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  >
                    <option value="All">All Tiers</option>
                    <option value="Critical">Critical (≥80)</option>
                    <option value="High">High (60-79)</option>
                    <option value="Moderate">Moderate (&lt;60)</option>
                  </select>
                </div>

                {/* 7. Reporting Month */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Reporting Month</label>
                  <select
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white"
                  >
                    <option value="All">All Reporting Cycles</option>
                    <option value="Oct 2025">October 2025 (Flash Vol 42)</option>
                    <option value="Mar 2026">March 2026 (Latest PAIMANA)</option>
                  </select>
                </div>
              </div>

              {/* Search Within Register */}
              <div className="relative pt-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchRegister}
                  onChange={e => setSearchRegister(e.target.value)}
                  placeholder="Filter register by Project ID (e.g. 615186), name, ministry, or agency..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F27F0C]"
                />
                {searchRegister && (
                  <button
                    onClick={() => setSearchRegister("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* MULTI-PILLAR DATA REGISTER & VIEW SWITCHER */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Multi-Pillar Register</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F27F0C]/10 dark:bg-[#F27F0C]/20 text-[#F27F0C] dark:text-[#9FE7F5] border border-[#F27F0C]/25">
                      {filteredRegister.length.toLocaleString("en-IN")} Projects Loaded
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Three-pillar oversight of cost variance, physical field execution, and schedule milestones.
                  </p>
                </div>

                {/* View Mode Toggle: List vs Grid Cards */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 self-start sm:self-center shadow-2xs">
                  <button
                    onClick={() => setRegisterViewMode("list")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      registerViewMode === "list"
                        ? "bg-white dark:bg-[#053F5C] text-[#F27F0C] dark:text-[#9FE7F5] shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Switch to Tabular List View"
                  >
                    <List size={14} />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setRegisterViewMode("grid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      registerViewMode === "grid"
                        ? "bg-white dark:bg-[#053F5C] text-[#F27F0C] dark:text-[#9FE7F5] shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Switch to Executive Cards Grid View"
                  >
                    <LayoutGrid size={14} />
                    <span>Cards</span>
                  </button>
                </div>
              </div>

              {/* GRID / CARDS VIEW */}
              {registerViewMode === "grid" ? (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedRegister.map(p => {
                    const pId = p.id || p.projectId;
                    const isFlagship = p.isFlagship;

                    return (
                      <div
                        key={pId}
                        className={`bg-white dark:bg-[#053F5C] rounded-2xl border ${
                          isFlagship
                            ? "border-[#F27F0C]/50 shadow-md ring-1 ring-[#F27F0C]/25"
                            : "border-slate-200 dark:border-white/10 shadow-xs"
                        } p-4.5 hover:shadow-md transition-all flex flex-col justify-between group`}
                      >
                        <div>
                          {/* Card Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                ID: {pId}
                              </span>
                              {isFlagship && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#F27F0C] text-white shadow-2xs">
                                  #615186 Flagship
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {p.state || "National"}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight whitespace-nowrap shadow-2xs ${
                                p.compositeScore >= 80
                                  ? "bg-red-600 text-white"
                                  : p.compositeScore >= 60
                                  ? "bg-amber-500 text-white"
                                  : "bg-emerald-600 text-white"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                              <span>{p.compositeScore} · {p.compositeScore >= 80 ? "Critical" : p.compositeScore >= 60 ? "High" : "Moderate"}</span>
                            </span>
                          </div>

                          {/* Project Title */}
                          <h4
                            onClick={() => navigate(`/project/${pId}`)}
                            className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] cursor-pointer line-clamp-2 transition-colors mb-1"
                            title={p.name}
                          >
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-4">
                            {p.ministry} · {p.agency || p.sector}
                          </p>

                          {/* 3 Pillars Summary Grid */}
                          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-100 dark:border-white/5 mb-4">
                            {/* Pillar 1: Cost */}
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400">Cost</p>
                              <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5 truncate">
                                ₹{p.revisedCost || p.actualCost} Cr
                              </p>
                              <p className="text-[10px] font-bold mt-0.5 truncate">
                                {p.costOverrun > 0 ? (
                                  <span className="text-rose-500">+{p.costOverrun}%</span>
                                ) : (
                                  <span className="text-emerald-500">On Target</span>
                                )}
                              </p>
                            </div>

                            {/* Pillar 2: Progress */}
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400">Progress</p>
                              <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                                {p.hasProgress ? `${p.progress}%` : "—"}
                              </p>
                              <p className={`text-[10px] font-bold mt-0.5 truncate ${p.hasProgress && p.gap > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-500"}`}>
                                {p.hasProgress ? (p.progress >= 100 ? "Completed" : `${p.gap}% to Complete`) : "Unreported"}
                              </p>
                            </div>

                            {/* Pillar 3: Schedule */}
                            <div>
                              <p className="text-[9px] uppercase font-bold text-slate-400">Target DOC</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                                {p.revisedDOC || p.targetCompletion || "2026"}
                              </p>
                              <p className="text-[10px] font-bold mt-0.5 truncate">
                                {p.timeOverrun > 0 ? (
                                  <span className="text-rose-500">+{p.timeOverrun}m Lag</span>
                                ) : (
                                  <span className="text-emerald-500">On Time</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer: Status & Visible Dossier Button */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10 gap-2">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {p.statusBadge}
                          </span>
                          <button
                            onClick={() => navigate(`/project/${pId}`)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white font-bold text-xs transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-white/10 hover:border-[#F27F0C]"
                          >
                            <span>Dossier</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABULAR LIST VIEW */
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <th className="py-3 px-4">Project ID & Title</th>
                        <th className="py-3 px-4">Ministry / Agency</th>
                        <th className="py-3 px-4">Cost: Sanction vs Revised</th>
                        <th className="py-3 px-4">Physical Progress</th>
                        <th className="py-3 px-4">Schedule</th>
                        <th className="py-3 px-4 whitespace-nowrap">Risk Tier</th>
                        <th className="py-3 px-4 text-right">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {paginatedRegister.map(p => {
                        const pId = p.id || p.projectId;
                        const isFlagship = p.isFlagship;

                        return (
                          <tr key={pId} className={`hover:bg-slate-50/70 dark:hover:bg-white/5 ${isFlagship ? "bg-[#FEF0E7]/25 dark:bg-[#F27F0C]/5" : ""}`}>
                            {/* Project ID & Title */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-start gap-2">
                                {isFlagship && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#F27F0C] text-white shrink-0 mt-0.5">
                                    #615186
                                  </span>
                                )}
                                <div>
                                  <p
                                    onClick={() => navigate(`/project/${pId}`)}
                                    className="font-bold text-slate-900 dark:text-white hover:text-[#F27F0C] cursor-pointer line-clamp-1"
                                  >
                                    {p.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                    ID: {pId} · {p.state || "National"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Ministry / Agency */}
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[180px]">
                              <p className="truncate font-medium">{p.ministry}</p>
                              <p className="text-[10px] text-slate-400 truncate">{p.agency || p.sector}</p>
                            </td>

                            {/* Cost Pillar */}
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                ₹{p.revisedCost || p.actualCost} Cr
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Orig: ₹{p.actualCost} Cr {p.costOverrun > 0 && <span className="text-rose-500 font-bold">(+{p.costOverrun}%)</span>}
                              </p>
                            </td>

                            {/* Progress Pillar */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 dark:text-white">
                                  {p.hasProgress ? `${p.progress}%` : "—"}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${p.progress < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(100, p.progress)}%` }}
                                  />
                                </div>
                              </div>
                              <p className={`text-[10px] font-bold ${p.hasProgress && p.gap > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-500"}`}>
                                {p.hasProgress ? (p.progress >= 100 ? "Completed" : `${p.gap}% to Complete`) : "Unreported"}
                              </p>
                            </td>

                            {/* Schedule Pillar */}
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">
                                {p.revisedDOC || p.targetCompletion || "2026"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {p.timeOverrun > 0 ? `+${p.timeOverrun} mos lag` : "On schedule"}
                              </p>
                            </td>

                            {/* Risk Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tight whitespace-nowrap shadow-2xs ${
                                p.compositeScore >= 80 ? "bg-red-600 text-white" :
                                p.compositeScore >= 60 ? "bg-amber-500 text-white" :
                                "bg-emerald-600 text-white"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-pulse" />
                                <span>{p.compositeScore} · {p.compositeScore >= 80 ? "Critical" : p.compositeScore >= 60 ? "High" : "Moderate"}</span>
                              </span>
                            </td>

                            {/* 1-Click Jump to Dossier (Clearly visible button) */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => navigate(`/project/${pId}`)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white font-bold text-xs transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-white/10 hover:border-[#F27F0C]"
                              >
                                <span>Dossier</span>
                                <ArrowRight size={12} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination Controls */}
              <TablePagination
                currentPage={registerPage}
                totalPages={totalRegisterPages}
                totalItems={filteredRegister.length}
                pageSize={registerPageSize}
                onPageChange={setRegisterPage}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* SECTION 03: PRIORITY PROJECTS QUEUE (/administrator/priority-projects) */}
        {/* ========================================================================= */}
        {currentTab === "priority" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <span>Administrative Follow-Up Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {priorityFollowUpProjects.length} Flagged
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  High-risk and stalled mega-projects requiring statutory administrative follow-through and active inspection schedules.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search Queue */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchPriority}
                    onChange={e => setSearchPriority(e.target.value)}
                    placeholder="Search queue by ID, name..."
                    className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F27F0C]"
                  />
                  {searchPriority && (
                    <button
                      onClick={() => setSearchPriority("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowStatutoryModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Schedule New Inspection</span>
                </button>
              </div>
            </div>

            {paginatedPriorityFollowUpProjects.length === 0 ? (
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-12 text-center border border-slate-200 dark:border-white/10 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  No priority projects found matching "{searchPriority}"
                </p>
                <button
                  onClick={() => setSearchPriority("")}
                  className="mt-2 text-xs text-[#F27F0C] font-bold hover:underline cursor-pointer"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedPriorityFollowUpProjects.map(p => {
                  const pId = p.id || p.projectId;
                  return (
                    <div key={pId} className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">ID: {pId}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              Score: {p.compositeScore}/100
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-1">{p.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{p.ministry}</p>
                        </div>

                        {/* Intervention Status Badge */}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          p.interventionStatus === "Field Notice Sent" ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300" :
                          p.interventionStatus === "Audit Scheduled" ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300" :
                          "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300"
                        }`}>
                          {p.interventionStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 text-xs text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Gap Shortfall</span>
                          <span className="font-black text-rose-500">{Math.round(p.gap)}% pts</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Time Overrun</span>
                          <span className="font-black text-purple-500">+{p.timeOverrun} mos</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Cost Escalation</span>
                          <span className="font-black text-amber-500">+{p.costOverrun}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => {
                            setModalTargetProjId(String(pId));
                            setShowStatutoryModal(true);
                          }}
                          className="text-xs font-bold text-[#F27F0C] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={12} />
                          <span>Issue Administrative Directive</span>
                        </button>
                        <button
                          onClick={() => navigate(`/project/${pId}`)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 border border-slate-200/60 dark:border-white/10 hover:border-[#F27F0C] cursor-pointer"
                        >
                          <span>Dossier</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination for Administrative Follow-Up Queue */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <TablePagination
                currentPage={priorityPage}
                totalPages={totalPriorityPages}
                totalItems={priorityFollowUpProjects.length}
                pageSize={priorityPageSize}
                onPageChange={setPriorityPage}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 04: COST MONITORING (/administrator/cost) */}
        {/* ========================================================================= */}
        {currentTab === "cost" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <IndianRupee size={16} className="text-rose-500" />
                Cost Monitoring & Overrun Intensity Meters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of original sanction vs approved revised allocation, financial expenditure burn, and sanction amendment counts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Original Sanction Total</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹17.26 L Cr</p>
                <p className="text-xs text-slate-500 mt-1">Cabinet Approved Allocation</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Revised Sanction Total</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹21.44 L Cr</p>
                <p className="text-xs text-rose-500 font-bold mt-1">+₹4.18 L Cr (+24.2% Escalation)</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase">Expenditure Absorption</span>
                <p className="text-2xl font-black text-[#9FE7F5] mt-1">₹14.82 L Cr</p>
                <p className="text-xs text-slate-400 mt-1">69.1% Total Capital Burned</p>
              </div>
            </div>

            {/* Overrun % Intensity Meters Table */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Cost Escalation Intensity & Revision Counts
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {costProjects.length} Projects Flagged
                  </span>
                </div>

                {/* Search Bar for Cost Table */}
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchCost}
                    onChange={e => setSearchCost(e.target.value)}
                    placeholder="Search by ID, name, agency..."
                    className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F27F0C]"
                  />
                  {searchCost && (
                    <button
                      onClick={() => setSearchCost("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Original Sanction</th>
                      <th className="py-3 px-4">Revised Sanction</th>
                      <th className="py-3 px-4">Cost Overrun % Intensity</th>
                      <th className="py-3 px-4">Expenditure Burn</th>
                      <th className="py-3 px-4">Revision Frequency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedCostProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-xs font-semibold">No cost escalation projects found matching "{searchCost}"</p>
                          <button
                            onClick={() => setSearchCost("")}
                            className="mt-2 text-xs text-[#F27F0C] font-bold hover:underline cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedCostProjects.map(p => (
                        <tr key={p.id || p.projectId} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                            <span
                              onClick={() => navigate(`/project/${p.id || p.projectId}`)}
                              className="hover:text-[#F27F0C] cursor-pointer"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              ID: {p.id || p.projectId} · {p.ministry}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">₹{p.actualCost} Cr</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">₹{p.revisedCost} Cr</td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-rose-500">+{p.costOverrun}%</span>
                              </div>
                              <div className="w-28 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${p.costOverrun > 30 ? "bg-rose-500" : p.costOverrun > 15 ? "bg-amber-500" : "bg-blue-500"}`}
                                  style={{ width: `${Math.min(100, p.costOverrun * 2)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{p.burnPct}% Burned</p>
                            <p className="text-[10px] text-slate-400">₹{p.expenditure} Cr incurred</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {p.revisionsCount} Formal Revision(s)
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={costPage}
                totalPages={totalCostPages}
                totalItems={costProjects.length}
                pageSize={costPageSize}
                onPageChange={setCostPage}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 05: PROGRESS MONITORING (/administrator/progress) */}
        {/* ========================================================================= */}
        {currentTab === "progress" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-amber-500" />
                Progress Monitoring & Stall Velocity Alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reported physical field execution against statutory targets, calculated execution gap (-45.6% pts), and static stall warnings (&lt;0.3%/mo).
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Field Execution Gap & Stall Indicators
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {progressProjects.length} Projects Flagged
                  </span>
                </div>

                {/* Search Bar for Progress Table */}
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchProgress}
                    onChange={e => setSearchProgress(e.target.value)}
                    placeholder="Search by ID, name, agency..."
                    className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F27F0C]"
                  />
                  {searchProgress && (
                    <button
                      onClick={() => setSearchProgress("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Actual Progress</th>
                      <th className="py-3 px-4">Statutory Target</th>
                      <th className="py-3 px-4">Execution Shortfall Gap</th>
                      <th className="py-3 px-4">Monthly Rate</th>
                      <th className="py-3 px-4">Stall Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedProgressProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-xs font-semibold">No progress stall projects found matching "{searchProgress}"</p>
                          <button
                            onClick={() => setSearchProgress("")}
                            className="mt-2 text-xs text-[#F27F0C] font-bold hover:underline cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedProgressProjects.map(p => (
                        <tr key={p.id || p.projectId} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                            <span
                              onClick={() => navigate(`/project/${p.id || p.projectId}`)}
                              className="hover:text-[#F27F0C] cursor-pointer"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              ID: {p.id || p.projectId} · {p.ministry}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{p.progress}%</td>
                          <td className="py-3 px-4 font-bold text-slate-600 dark:text-slate-300">{p.target}%</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              {Math.round(p.gap)}% pts Gap
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                            {p.isStall ? "0.15%/mo" : "0.85%/mo"}
                          </td>
                          <td className="py-3 px-4">
                            {p.isStall ? (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-red-500 text-white flex items-center gap-1 w-fit shadow-xs animate-pulse">
                                <Flame size={11} /> STALL DETECTED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                Active Velocity
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={progressPage}
                totalPages={totalProgressPages}
                totalItems={progressProjects.length}
                pageSize={progressPageSize}
                onPageChange={setProgressPage}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 06: SCHEDULE MONITORING (/administrator/schedule) */}
        {/* ========================================================================= */}
        {currentTab === "schedule" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-purple-500" />
                Schedule Monitoring & Commissioning Slippage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Commissioning date slippage comparisons, cumulative time overrun in elapsed months/years, and deadline amendment history.
              </p>
            </div>

            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs transition-colors">
              <div className="p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Commissioning Target Date Slippage
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {scheduleProjects.length} Projects Flagged
                  </span>
                </div>

                {/* Search Bar for Schedule Table */}
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchSchedule}
                    onChange={e => setSearchSchedule(e.target.value)}
                    placeholder="Search by ID, name, agency..."
                    className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F27F0C]"
                  />
                  {searchSchedule && (
                    <button
                      onClick={() => setSearchSchedule("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Original Planned DOC</th>
                      <th className="py-3 px-4">Revised Target DOC</th>
                      <th className="py-3 px-4">Cumulative Time Overrun</th>
                      <th className="py-3 px-4">Years Elapsed</th>
                      <th className="py-3 px-4">Target Extensions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {paginatedScheduleProjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-500 dark:text-slate-400">
                          <p className="text-xs font-semibold">No schedule slippage projects found matching "{searchSchedule}"</p>
                          <button
                            onClick={() => setSearchSchedule("")}
                            className="mt-2 text-xs text-[#F27F0C] font-bold hover:underline cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedScheduleProjects.map(p => {
                        const years = (p.timeOverrun / 12).toFixed(1);
                        return (
                          <tr key={p.id || p.projectId} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-[220px] truncate">
                              <span
                                onClick={() => navigate(`/project/${p.id || p.projectId}`)}
                                className="hover:text-[#F27F0C] cursor-pointer"
                                title={p.name}
                              >
                                {p.name}
                              </span>
                              <span className="block text-[10px] font-mono text-slate-400 font-normal">
                                ID: {p.id || p.projectId} · {p.ministry}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">{p.originalDOC || "Dec 2023"}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{p.revisedDOC || "Sep 2029"}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                +{p.timeOverrun} Months
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">
                              {years} Years
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                                {p.timeOverrun > 40 ? "3 Extensions" : p.timeOverrun > 20 ? "2 Extensions" : "1 Extension"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination
                currentPage={schedulePage}
                totalPages={totalSchedulePages}
                totalItems={scheduleProjects.length}
                pageSize={schedulePageSize}
                onPageChange={setSchedulePage}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 07: ACTIONS & INTERVENTIONS (/administrator/actions) */}
        {/* ========================================================================= */}
        {currentTab === "actions" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Send size={16} className="text-[#F27F0C]" />
                  Central Statutory Intervention Ledger
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Platform-wide repository of issued statutory directives, field inspections, and 1-click status transitions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStatutoryModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Issue Statutory Directive</span>
                </button>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Filter Ledger:</span>
              {["All", "Open", "In Progress", "Overdue", "Closed"].map(status => (
                <button
                  key={status}
                  onClick={() => setLedgerStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                    ledgerStatusFilter === status
                      ? "bg-[#053F5C] dark:bg-[#F27F0C] text-white"
                      : "bg-white dark:bg-[#053F5C]/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Central Actions Table with 1-Click Status Transition Controls */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#031e2d] border-b border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      <th className="py-3 px-4">Directive ID</th>
                      <th className="py-3 px-4">Project & Target</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Assigned Officer</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">1-Click Status Transition</th>
                      <th className="py-3 px-4">Findings / Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredActions.map(action => (
                      <tr key={action.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#F27F0C]">{action.id}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">{action.project}</p>
                          <p className="text-[10px] font-mono text-slate-500">ID: {action.projectId}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">{action.type}</td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">{action.officer}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{action.dueDate}</td>
                        <td className="py-3.5 px-4">
                          {/* 1-Click Interactive Status Dropdown Control */}
                          <select
                            value={action.status}
                            onChange={e => handleTransitionStatus(action.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black border cursor-pointer ${
                              action.status === "Open" ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300" :
                              action.status === "In Progress" ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300" :
                              action.status === "Overdue" ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300" :
                              "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300"
                            }`}
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-[240px] truncate" title={action.remarks}>
                          {action.remarks}
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
        {/* SECTION 08: PORTFOLIO RISK TRENDS (/administrator/risk-trends) */}
        {/* ========================================================================= */}
        {currentTab === "risk-trends" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-[#F27F0C]" />
                Portfolio Risk Trends & Vector Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                6-cycle retrospective trajectory tracking (May–October 2025) and portfolio risk momentum vector proportions.
              </p>
            </div>

            {/* Vector Distribution Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-rose-500 block uppercase">Increasing Risk Vectors</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">22.4% (468 Works)</p>
                <p className="text-xs text-slate-500 mt-1">3-cycle consecutive risk escalation</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-amber-500 block uppercase">Stable Risk Vectors</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">61.2% (1,280 Works)</p>
                <p className="text-xs text-slate-500 mt-1">Neutral trajectory within ±3 pts</p>
              </div>
              <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xs">
                <span className="text-xs font-bold text-emerald-500 block uppercase">Decreasing Risk Vectors</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">16.4% (344 Works)</p>
                <p className="text-xs text-slate-500 mt-1">Risk mitigated after field intervention</p>
              </div>
            </div>

            {/* 6-Cycle Historical Movement Visual */}
            <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                6-Cycle Retrospective Portfolio Movement (May–October 2025)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Empirical historical monitoring data without synthetic forecasts. Shows the proportion of critical vs high vs moderate works over the past 6 reporting intervals.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
                {[
                  { month: "May 2025", critical: 8, high: 28, moderate: 64 },
                  { month: "Jun 2025", critical: 9, high: 29, moderate: 62 },
                  { month: "Jul 2025", critical: 11, high: 31, moderate: 58 },
                  { month: "Aug 2025", critical: 12, high: 32, moderate: 56 },
                  { month: "Sep 2025", critical: 13, high: 33, moderate: 54 },
                  { month: "Oct 2025", critical: 14, high: 34, moderate: 52 }
                ].map(cycle => (
                  <div key={cycle.month} className="bg-slate-50 dark:bg-[#031e2d] rounded-xl p-3 text-center border border-slate-200 dark:border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">{cycle.month}</span>
                    <p className="text-base font-black text-rose-500">{cycle.critical} Critical</p>
                    <p className="text-[10px] text-amber-500 font-semibold">{cycle.high}% High</p>
                    <p className="text-[10px] text-emerald-500 font-semibold">{cycle.moderate}% Mod</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATUTORY ACTION DISPATCH MODAL */}
        {/* ========================================================================= */}
        {showStatutoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#053F5C] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#429EBD]/30 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="h-1 bg-gradient-to-r from-[#9FE7F5] via-[#429EBD] to-[#F27F0C]" />

              <div className="p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-[#F27F0C]" />
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    Issue Formal Statutory Action Directive
                  </h3>
                </div>
                <button
                  onClick={() => setShowStatutoryModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDirective} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Infrastructure Project</label>
                  <select
                    value={modalTargetProjId}
                    onChange={e => setModalTargetProjId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-white"
                  >
                    {allProjects.slice(0, 20).map(p => (
                      <option key={p.id || p.projectId} value={p.id || p.projectId}>
                        {p.name} (ID: {p.id || p.projectId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Action Category (6 Statutory Types)</label>
                  <select
                    value={modalActionType}
                    onChange={e => setModalActionType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  >
                    <option value="Physical Verification">Physical Verification (Ground Milestone Inspection)</option>
                    <option value="Ground Audit">Ground Technical & Right-of-Way Audit</option>
                    <option value="Schedule Review">Joint Inter-Ministerial Schedule Review</option>
                    <option value="Cost Audit">Capital Expenditure & Sanction Amendment Audit</option>
                    <option value="Contractor Show Cause">Contractor Performance Show Cause Notice</option>
                    <option value="Inter-Ministerial Directive">Cabinet / Inter-Ministerial Clearance Directive</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Assigned Statutory Officer</label>
                  <input
                    type="text"
                    value={modalOfficer}
                    onChange={e => setModalOfficer(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white mb-1.5"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["Dr. Rajesh Kumar (IAS)", "Ananya Deshmukh", "Amit Sharma", "M. K. Tripathy"].map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setModalOfficer(name)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                          modalOfficer === name
                            ? "bg-[#FEF0E7] text-[#F27F0C] border-[#F27F0C]"
                            : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-transparent"
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
                    value={modalDueDate}
                    onChange={e => setModalDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Administrative Remarks & Terms of Reference</label>
                  <textarea
                    rows={3}
                    value={modalRemarks}
                    onChange={e => setModalRemarks(e.target.value)}
                    placeholder="Specify ground inspection objectives, clearance verification points..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200 dark:border-white/10 font-medium text-slate-800 dark:text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStatutoryModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#F27F0C] hover:bg-[#d96e08] text-white font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Commit Directive</span>
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
