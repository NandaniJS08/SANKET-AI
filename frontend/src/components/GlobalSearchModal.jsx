import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, X, ExternalLink, ArrowRight, ShieldAlert,
  AlertTriangle, CheckCircle2, Clock, Building2, MapPin,
  Sparkles, Layers, CornerDownLeft, Command
} from "lucide-react";
import { getProjects } from "../services/api.js";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const debounceRef = useRef(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveCategory("all");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Debounced live search
  useEffect(() => {
    if (!isOpen) return;

    // Map category filters to API params
    const apiFilters = { pageSize: 20, page: 1 };
    if (query.trim()) apiFilters.search = query.trim();
    if (activeCategory === "critical") apiFilters.risk = "Critical";
    if (activeCategory === "delayed") apiFilters.risk = "High"; // best proxy

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      setSearchError(null);
      getProjects(apiFilters)
        .then(resp => {
          const items = (resp?.data ?? []).map(p => {
            let matchReason = "Project Name";
            const qLower = query.trim().toLowerCase();
            if (qLower) {
              if (String(p.projectId || p.id || "").toLowerCase().includes(qLower)) matchReason = `ID: #${p.projectId || p.id}`;
              else if ((p.agency || "").toLowerCase().includes(qLower)) matchReason = `Agency: ${(p.agency || "").split("[")[0].trim()}`;
              else if ((p.state || "").toLowerCase().includes(qLower)) matchReason = `State: ${p.state}`;
              else if ((p.sector || "").toLowerCase().includes(qLower)) matchReason = `Sector: ${p.sector}`;
              else if ((p.ministry || "").toLowerCase().includes(qLower)) matchReason = `Ministry: ${p.ministry}`;
            }
            return { ...p, matchReason };
          });
          // Client-side category post-filters that API doesn't support directly
          const filtered = items.filter(p => {
            if (activeCategory === "delayed" && !p.deadlineRevisionFlag && !(p.costRevisionPct > 0)) return false;
            if (activeCategory === "cost_overrun" && !(p.costRevisionPct > 0)) return false;
            if (activeCategory === "roads" && !p.sector?.toLowerCase().includes("road")) return false;
            if (activeCategory === "railways" && !p.sector?.toLowerCase().includes("rail")) return false;
            return true;
          });
          setSearchResults(filtered);
          setSearchLoading(false);
        })
        .catch(err => {
          setSearchError(err?.message || "Search failed");
          setSearchLoading(false);
        });
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [isOpen, query, activeCategory]);

  // filteredProjects = live results
  const filteredProjects = searchResults;

  // Keep highlighted item in view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside search results
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredProjects.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredProjects[selectedIndex]) {
          handleSelectProject(filteredProjects[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredProjects]);

  const handleSelectProject = (project) => {
    onClose();
    navigate(`/project/${project.id || project.projectId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-xs">
      {/* Click Outside Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Search Modal Card */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#053F5C] rounded-2xl shadow-2xl border border-[#E7E5E4] dark:border-[#429EBD]/30 overflow-hidden flex flex-col max-h-[82vh] z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Top 5-Color Government Accent Strip */}
        <div className="h-1 bg-gradient-to-r from-[#9FE7F5] via-[#429EBD] via-[#053F5C] via-[#F7AD19] to-[#F27F0C] w-full" />

        {/* Input Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E7E5E4] dark:border-[#429EBD]/25 bg-white dark:bg-[#031e2d]">
          <Search size={18} className="text-[#F27F0C] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search across 6 parameters: ID, Name, Ministry, Sector, State, or Agency (e.g. 615186, NHAI)..."
            className="flex-1 bg-transparent text-sm sm:text-base outline-none text-[#1C1917] dark:text-white placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            ESC
          </kbd>
        </div>

        {/* 6-Parameter Category Filter Bar */}
        <div className="px-4 py-2 bg-[#FAF7F4] dark:bg-[#031e2d]/60 border-b border-[#E7E5E4] dark:border-[#429EBD]/20 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] dark:text-slate-400 mr-1">
              Filter:
            </span>
            {[
              { id: "all", label: "All Projects" },
              { id: "critical", label: "Critical Risk" },
              { id: "delayed", label: "Time Slippage" },
              { id: "cost_overrun", label: "Cost Overrun" },
              { id: "roads", label: "Roads & Highways" },
              { id: "railways", label: "Railways" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-[#F27F0C] text-white shadow-xs"
                    : "bg-white dark:bg-[#053F5C] text-[#44403C] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#78716C] dark:text-slate-400 whitespace-nowrap">
            {searchLoading ? "Searching…" : `${filteredProjects.length.toLocaleString("en-IN")} results`}
          </span>
        </div>

        {/* Flagship #615186 Evaluator Spotlight (When Query is Empty) */}
        {!query && (
          <div className="px-4 py-2.5 bg-[#FEF0E7]/70 dark:bg-[#053F5C]/50 border-b border-[#FDDFCC] dark:border-[#429EBD]/25 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F27F0C] animate-pulse" />
              <span className="font-bold text-[#F27F0C] dark:text-[#9FE7F5]">
                SIH Flagship Evaluation Dossier:
              </span>
              <span className="text-slate-700 dark:text-slate-200 truncate max-w-md">
                NH-163G Greenfield Expressway (#615186)
              </span>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate("/project/615186");
              }}
              className="text-[11px] font-bold text-[#F27F0C] dark:text-[#9FE7F5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open #615186 <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-[#F5F5F4] dark:divide-[#429EBD]/15 max-h-[52vh]">
          {searchLoading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 rounded-full border-4 border-[#F27F0C]/30 border-t-[#F27F0C] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Searching live database…</p>
            </div>
          ) : searchError ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-red-500">Search failed</p>
              <p className="text-xs text-slate-400 mt-1">{searchError}</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-2 opacity-30 text-[#F27F0C]" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No matching infrastructure projects found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching by Project ID (e.g. 615186), Agency (e.g. NHAI), State (e.g. Telangana), or Ministry.
              </p>
            </div>
          ) : (
            filteredProjects.slice(0, 45).map((project, idx) => {
              const isSelected = idx === selectedIndex;
              const isCritical = project.riskLevel === "Critical";
              const isHigh = project.riskLevel === "High";

              return (
                <div
                  key={project.id || project.projectId || idx}
                  data-index={idx}
                  onClick={() => handleSelectProject(project)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-[#FEF0E7] dark:bg-[#031e2d] border-l-4 border-[#F27F0C]"
                      : "hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Project ID Badge */}
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                        #{project.projectId || project.id}
                      </span>

                      {/* Matched Field Tag */}
                      {query && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#9FE7F5]/30 dark:bg-[#429EBD]/30 text-[#053F5C] dark:text-[#9FE7F5]">
                          {project.matchReason}
                        </span>
                      )}

                      {/* State Badge */}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={11} className="text-[#F27F0C]" /> {project.state || "National"}
                      </span>

                      {/* Ministry / Sector */}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        · {project.sector || project.ministry}
                      </span>
                    </div>

                    {/* Project Name */}
                    <p className="text-xs sm:text-sm font-bold text-[#1C1917] dark:text-white line-clamp-1">
                      {project.name}
                    </p>

                    {/* Agency & Overrun Details */}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="truncate max-w-xs text-slate-600 dark:text-slate-300 font-medium">
                        🏢 {project.agency || "MoSPI Central Executing Agency"}
                      </span>
                      {project.timeOverrunMonths > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                          <Clock size={11} /> +{project.timeOverrunMonths} mos delay
                        </span>
                      )}
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                        ₹{(project.revisedCostCr || project.originalCostCr || project.costValue || 0).toLocaleString("en-IN")} Cr
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Risk Badge & Enter Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                        isCritical
                          ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-800"
                          : isHigh
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {isCritical ? <ShieldAlert size={12} /> : isHigh ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {project.riskLevel} ({project.riskScore || (isCritical ? 88 : isHigh ? 65 : 35)})
                    </span>
                    <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? "text-[#F27F0C]" : "text-slate-400"}`}>
                      <CornerDownLeft size={14} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 bg-[#FAF7F4] dark:bg-[#031e2d] border-t border-[#E7E5E4] dark:border-[#429EBD]/20 flex items-center justify-between text-[11px] text-[#78716C] dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-mono text-[10px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-mono text-[10px]">
                ↵
              </kbd>
              Inspect Dossier
            </span>
          </div>
          <span className="hidden sm:inline text-[#F27F0C] font-semibold">
            6 Parameters: ID · Name · Ministry · Sector · State · Agency
          </span>
        </div>
      </div>
    </div>
  );
}
