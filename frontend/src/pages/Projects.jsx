import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, MapPin, List } from "lucide-react";
import Layout from "../components/Layout";
import RiskBadge from "../components/RiskBadge";
import ProgressBar from "../components/ProgressBar";
import IndiaStateMap from "../components/IndiaStateMap";
import apiService from "../services/api";

const PAGE_SIZE = 8;

const BASE_MINISTRIES = [
  "All",
  "Department for Promotion of Industry & Internal Trade",
  "Department of Higher Education",
  "Department of Sports",
  "Ministry of Civil Aviation",
  "Ministry of Coal",
  "Ministry of Housing and Urban Affairs",
  "Ministry of Mines",
  "Ministry of New and Renewable Energy",
  "Ministry of Petroleum and Natural Gas",
  "Ministry of Power",
  "Ministry of Railways",
  "Ministry of Road Transport and Highways",
  "Ministry of Shipping",
  "Ministry of Steel",
  "Ministry of Telecommunications",
  "Ministry of Water Resources, River Development and Ganga Rejuvenation"
];

const BASE_SECTORS = [
  "All",
  "Aviation & Aviation Infrastructure",
  "Coal",
  "Construction",
  "Health and Family Welfare",
  "Higher Education",
  "Industrial Infrastructure",
  "Mines",
  "Petroleum",
  "Power",
  "Railways",
  "Road Transport and Highways",
  "Shipping and Ports",
  "Steel",
  "Telecommunications"
];

const BASE_STATES = [
  "All",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

const riskLevels = ["All", "Critical", "High", "Medium", "Low"];

// Calculate multi-dimensional AI overrun risk probabilities for each project using real telemetry
export function getProjectOverrunRisks(p) {
  const origCost = p.originalCostCr || 0;
  const revCost = p.revisedCostCr || origCost;
  const costOverrun = p.costRevisionPct || (origCost > 0 && revCost > origCost ? Math.round(((revCost - origCost) / origCost) * 100) : 0);
  const isDelayed = Boolean(p.deadlineRevisionFlag || (p.revisedCompletionDate && p.originalCompletionDate && p.revisedCompletionDate !== p.originalCompletionDate));
  const physProg = p.physicalProgress != null ? Number(p.physicalProgress) : 0;
  const isStall = physProg < 30 && isDelayed;

  // 1. Cost Overrun Risk (%)
  let costRisk;
  if (p.costRisk !== undefined && p.costRisk !== null) {
    costRisk = p.costRisk;
  } else if (costOverrun > 0) {
    costRisk = Math.min(99, Math.round(50 + costOverrun * 0.8));
  } else {
    // Grounded risk from financial absorption lag
    const spend = p.financialProgress || (origCost > 0 && p.expenditureCr ? (p.expenditureCr / origCost) * 100 : 0);
    const spendLag = Math.max(0, spend - physProg);
    costRisk = Math.min(65, Math.max(12, Math.round(spendLag * 0.6 + (isDelayed ? 20 : 10))));
  }

  // 2. Time Overrun Risk (%)
  let timeRisk;
  if (p.timeRisk !== undefined && p.timeRisk !== null) {
    timeRisk = p.timeRisk;
  } else if (isStall) {
    timeRisk = 92;
  } else if (isDelayed) {
    timeRisk = Math.min(95, Math.max(68, Math.round(70 + (costOverrun > 0 ? 15 : 0) + (physProg < 50 ? 10 : 0))));
  } else {
    timeRisk = Math.min(45, Math.max(12, Math.round((100 - physProg) * 0.25 + (costOverrun > 0 ? 15 : 8))));
  }

  // SANKET 3-Pillar Composite Risk Calculation
  let dynamicScore;
  if (p.riskScore != null) {
    dynamicScore = Math.round(Number(p.riskScore));
  } else {
    let costPts = 4;
    if (costOverrun >= 100) costPts = 40;
    else if (costOverrun >= 50) costPts = 35;
    else if (costOverrun >= 25) costPts = 30;
    else if (costOverrun >= 10) costPts = 20;
    else if (costOverrun > 0) costPts = 12;

    let timePts = 8;
    if (isStall) timePts = 40;
    else if (isDelayed) timePts = 32;

    let progressPts = 2;
    if (physProg < 15) progressPts = 25;
    else if (physProg < 40) progressPts = 20;
    else if (physProg < 70) progressPts = 15;
    else if (physProg < 90) progressPts = 10;

    dynamicScore = Math.min(99, Math.max(15, costPts + timePts + progressPts));
  }

  const dynamicLevel = p.riskLevel || (dynamicScore >= 80 ? "Critical" : dynamicScore >= 60 ? "High" : dynamicScore >= 40 ? "Medium" : "Low");

  return { costRisk, timeRisk, dynamicScore, dynamicLevel };
}

export default function Projects({ user }) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'state_hotspots'
  const [search, setSearch] = useState("");
  const [ministry, setMinistry] = useState("All");
  const [sector, setSector] = useState("All");
  const [state, setState] = useState("All");
  const [risk, setRisk] = useState("All");
  const [page, setPage] = useState(1);

  // Live backend data state
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const isInitialLoad = projects.length === 0 && loading;
  const hasDataRef = React.useRef(false);
  if (projects.length > 0) hasDataRef.current = true;

  // Fetch live projects from verified backend API via canonical adapter
  const fetchProjects = useCallback(async () => {
    // On first load (no data yet), show full spinner; on re-fetch, show subtle overlay
    if (!hasDataRef.current) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }
    setError(null);
    try {
      const res = await apiService.getProjects({
        page,
        pageSize: PAGE_SIZE,
        search: search.trim() || undefined,
        ministry: ministry !== "All" ? ministry : undefined,
        sector: sector !== "All" ? sector : undefined,
        state: state !== "All" ? state : undefined,
        risk: risk !== "All" ? risk : undefined,
      });

      setProjects(res.data || []);
      setTotalCount(res.count || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      setError("Unable to load infrastructure projects from monitoring repository. Please try again.");
      setProjects([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, search, ministry, sector, state, risk]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <Layout
      user={user}
      title={user?.role === "Reviewer / Monitoring Officer" ? "Projects Repository & Verification" : "Monitored Projects Repository"}
      subtitle={`Comprehensive SANKET-AI portfolio tracking ${totalCount > 0 ? totalCount.toLocaleString('en-IN') : '2,100+'} central infrastructure projects across 17 ministries & 14 sectors.`}
    >
      {/* View Switcher & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1C1917] dark:text-white bg-white dark:bg-[#053F5C] border border-[#E7E5E4] dark:border-[#429EBD]/30 px-3 py-1.5 rounded-xl shadow-xs">
            {totalCount.toLocaleString('en-IN')} Projects Filtered
          </span>
          <span className="text-xs text-[#78716C] dark:text-slate-400">Total Portfolio: {totalCount.toLocaleString('en-IN')} Projects</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "list" ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold" : "text-[#78716C] dark:text-slate-400 hover:text-[#1C1917] dark:hover:text-white"
            }`}
          >
            <List size={13} /> Project Table
          </button>
          <button
            onClick={() => setViewMode("state_hotspots")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "state_hotspots" ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 font-bold" : "text-[#78716C] dark:text-slate-400 hover:text-[#1C1917] dark:hover:text-white"
            }`}
          >
            <MapPin size={13} /> Geographic Clusters
          </button>
        </div>
      </div>

      {viewMode === "state_hotspots" ? (
        /* Interactive State Geospatial Map */
        <div className="mb-6">
          <IndiaStateMap />
        </div>
      ) : (
        /* Standard Project Filter & Table */
        <>
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-4 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm mb-4 transition-colors">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 min-w-44">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search project name, ID or agency..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl text-xs outline-none focus:border-[#F27F0C] text-[#1C1917] dark:text-white placeholder:text-slate-400"
                />
              </div>

              {/* Ministry Filter */}
              <select
                value={ministry}
                onChange={handleFilterChange(setMinistry)}
                className="text-xs bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2 outline-none focus:border-[#F27F0C] text-[#44403C] dark:text-slate-200 max-w-48 cursor-pointer"
              >
                {BASE_MINISTRIES.map(m => (
                  <option key={m} value={m}>{m === "All" ? "All Ministries" : m}</option>
                ))}
              </select>

              {/* Sector Filter */}
              <select
                value={sector}
                onChange={handleFilterChange(setSector)}
                className="text-xs bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2 outline-none focus:border-[#F27F0C] text-[#44403C] dark:text-slate-200 max-w-44 cursor-pointer"
              >
                {BASE_SECTORS.map(s => (
                  <option key={s} value={s}>{s === "All" ? "All Sectors" : s}</option>
                ))}
              </select>

              {/* State Filter */}
              <select
                value={state}
                onChange={handleFilterChange(setState)}
                className="text-xs bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2 outline-none focus:border-[#F27F0C] text-[#44403C] dark:text-slate-200 max-w-36 cursor-pointer"
              >
                {BASE_STATES.map(st => (
                  <option key={st} value={st}>{st === "All" ? "All States" : st}</option>
                ))}
              </select>

              {/* Risk Level Filter */}
              <select
                value={risk}
                onChange={handleFilterChange(setRisk)}
                className="text-xs bg-[#FAF7F4] dark:bg-[#031e2d] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-xl px-3 py-2 outline-none focus:border-[#F27F0C] text-[#44403C] dark:text-slate-200 cursor-pointer"
              >
                {riskLevels.map(r => (
                  <option key={r} value={r}>{r === "All" ? "All Risk Levels" : `${r} Risk`}</option>
                ))}
              </select>

              {/* Clear */}
              {(search || ministry !== "All" || sector !== "All" || state !== "All" || risk !== "All") && (
                <button
                  onClick={() => { setSearch(""); setMinistry("All"); setSector("All"); setState("All"); setRisk("All"); setPage(1); }}
                  className="text-xs text-[#F27F0C] hover:underline font-bold px-1 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Subtle refetch progress bar - prevents full table flash on filter changes */}
          {isFetching && (
            <div className="h-0.5 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#F27F0C] animate-pulse w-full" />
            </div>
          )}
          <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm overflow-hidden mb-4 transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F5F5F4] dark:border-[#429EBD]/20 bg-[#FAF7F4] dark:bg-[#031e2d] text-[#78716C] dark:text-slate-300 font-semibold">
                    <th className="py-3.5 pl-4">Project Details</th>
                    <th className="py-3.5 px-3">Ministry & Sector</th>
                    <th className="py-3.5 px-3">Approved / Revised Cost</th>
                    <th className="py-3.5 px-3 min-w-44">Overrun Risk (Cost & Time)</th>
                    <th className="py-3.5 px-3">Risk Assessment</th>
                    <th className="py-3.5 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F4] dark:divide-slate-700/50 relative">
                  {isInitialLoad ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#78716C] dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-7 h-7 border-2 border-[#F27F0C] border-t-transparent rounded-full animate-spin" />
                          <p className="text-xs font-semibold">Loading live infrastructure projects from MoSPI repository...</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-red-600 dark:text-red-400">
                          <p className="text-xs font-bold">{error}</p>
                          <button
                            onClick={() => fetchProjects()}
                            className="text-xs font-semibold underline hover:opacity-80 cursor-pointer"
                          >
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#78716C] dark:text-slate-400">
                        <p className="text-xs font-medium">No projects found matching the criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    projects.map((p, idx) => {
                      const { costRisk, timeRisk, dynamicScore, dynamicLevel } = getProjectOverrunRisks(p);
                      const getRiskColor = (val) => val >= 70 ? "danger" : val >= 40 ? "warning" : "success";
                      const getTextColor = (val) => val >= 70 ? "text-red-600 dark:text-red-400 font-bold" : val >= 40 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold";
                      const projectIdentifier = String(p.projectId || p.id);

                      return (
                        <tr
                          key={`${projectIdentifier}-${idx}`}
                          onClick={() => navigate(`/projects/${projectIdentifier}`)}
                          className="hover:bg-[#FAF7F4]/70 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 pl-4 max-w-sm">
                            <p className="font-bold text-[#1C1917] dark:text-white hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] transition-colors line-clamp-1">{p.name}</p>
                            <p className="text-[11px] text-[#A8A29E] dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin size={11} /> {p.state} · ID: {projectIdentifier}
                            </p>
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-medium text-[#44403C] dark:text-slate-200 line-clamp-1">{p.ministry}</p>
                            <p className="text-[11px] text-[#A8A29E] dark:text-slate-400">{p.sector}</p>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-medium text-[#1C1917] dark:text-white">
                            <p>₹{(p.originalCostCr || 0).toLocaleString('en-IN')} Cr</p>
                            {p.revisedCostCr && p.revisedCostCr > (p.originalCostCr || 0) ? (
                              <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">Rev: ₹{p.revisedCostCr.toLocaleString('en-IN')} Cr</p>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-3 min-w-44">
                            <div className="space-y-2 py-0.5">
                              {/* Cost Overrun Risk Bar */}
                              <div>
                                <div className="flex justify-between items-center text-[10px] mb-1">
                                  <span className="font-semibold text-[#44403C] dark:text-slate-300 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F27F0C]" /> Cost Overrun
                                  </span>
                                  <span className={`font-mono ${getTextColor(costRisk)}`}>{costRisk}%</span>
                                </div>
                                <ProgressBar
                                  value={costRisk}
                                  color={getRiskColor(costRisk)}
                                  height="h-1.5"
                                  animate
                                />
                              </div>

                              {/* Time Overrun Risk Bar */}
                              <div>
                                <div className="flex justify-between items-center text-[10px] mb-1">
                                  <span className="font-semibold text-[#44403C] dark:text-slate-300 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#429EBD]" /> Time Overrun
                                  </span>
                                  <span className={`font-mono ${getTextColor(timeRisk)}`}>{timeRisk}%</span>
                                </div>
                                <ProgressBar
                                  value={timeRisk}
                                  color={getRiskColor(timeRisk)}
                                  height="h-1.5"
                                  animate
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <RiskBadge level={dynamicLevel} score={dynamicScore} />
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <span className="text-xs font-bold text-[#F27F0C] hover:underline whitespace-nowrap">
                              View Analysis →
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F5F5F4] dark:border-[#429EBD]/20 text-xs">
                <span className="text-[#78716C] dark:text-slate-300">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} projects
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1 || loading}
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                    className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#429EBD]/30 dark:text-white disabled:opacity-40 hover:bg-[#F5F5F4] dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-medium text-[#1C1917] dark:text-white">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages || loading}
                    onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                    className="p-1.5 rounded-lg border border-[#E7E5E4] dark:border-[#429EBD]/30 dark:text-white disabled:opacity-40 hover:bg-[#F5F5F4] dark:hover:bg-white/10 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
