import React, { useState, useEffect } from "react";
import { Menu, Calendar, Download, Search } from "lucide-react";
import mospiLogo from "../assets/mospi-emblem-clean.png";
import GlobalSearchModal from "./GlobalSearchModal";

export default function GovtHeaderBanner({
  title,
  subtitle,
  onMenuClick,
  showDateRange,
  onExport
}) {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Global keyboard listener for Ctrl + K and Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Clean subtitle: remove duplicate Ministry mentions if already displayed on the emblem
  const cleanSubtitle = subtitle
    ? subtitle.replace(/\s*[•·|]\s*Ministry of Statistics.*$/i, "").trim()
    : "";

  return (
    <header className="bg-white dark:bg-[#053F5C] border-b border-[#E7E5E4] dark:border-[#429EBD]/20 flex-shrink-0 shadow-2xs transition-colors duration-200">
      {/* Official Top 5-Color Government Accent Strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#9FE7F5] via-[#429EBD] via-[#053F5C] via-[#F7AD19] to-[#F27F0C] w-full" />

      {/* Unified Single Master Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Mobile Menu Button + National Emblem of India (Ministry of Statistics) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl hover:bg-[#F5F5F4] dark:hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={18} className="text-[#78716C] dark:text-slate-200" />
          </button>
          <div className="flex items-center bg-white dark:bg-white/95 rounded-xl px-2.5 py-1 border border-stone-200/60 dark:border-transparent shadow-2xs">
            <img
              src={mospiLogo}
              alt="National Emblem of India · Ministry of Statistics and Programme Implementation"
              className="h-9 sm:h-10 md:h-11 w-auto max-w-[180px] sm:max-w-[240px] md:max-w-[280px] object-contain select-none"
            />
          </div>
        </div>

        {/* Center: Clean Page Title & Subtitle (No duplicate department badge) */}
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className="text-base sm:text-lg md:text-xl font-black text-[#1C1917] dark:text-white tracking-tight truncate max-w-lg mx-auto">
            {title || "SANKET-AI Portal"}
          </h1>
          {cleanSubtitle && (
            <p className="text-[11px] sm:text-xs text-[#78716C] dark:text-slate-300 mt-0.5 truncate max-w-xl mx-auto">
              {cleanSubtitle}
            </p>
          )}
        </div>

        {/* Right Side: Global Search (Ctrl + K), ThemeToggle Switch, Date Cycle, Export & Specially Made SANKET Artwork Logo */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Visible Global Search Trigger Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center justify-between gap-3 px-3.5 py-2 w-44 sm:w-60 md:w-72 lg:w-80 rounded-xl bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-white dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 text-xs text-[#78716C] dark:text-slate-300 transition-all shadow-2xs group cursor-pointer"
            title="Search projects across 6 parameters (Ctrl + K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search size={14} className="text-[#F27F0C] group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">Search projects, ministries...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#78716C] dark:text-slate-300 bg-white dark:bg-[#053F5C] border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded shadow-2xs shrink-0">
              Ctrl K
            </kbd>
          </button>


          {showDateRange && (
            <button className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-[#44403C] dark:text-slate-200 bg-[#F5F5F4] dark:bg-[#031e2d] hover:bg-[#E7E5E4] dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 px-3 py-1.5 rounded-xl transition-colors">
              <Calendar size={13} />
              Apr 2026 Cycle
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-white bg-[#F27F0C] hover:bg-[#d96e08] px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              <Download size={13} /> Export Report
            </button>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </header>
  );
}
