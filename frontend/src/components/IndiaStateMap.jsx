import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { indiaMapData } from "../data/indiaMapPaths";
import { stateProjectsData, getChoroplethColor, getStateData } from "../data/stateProjectsData";
import { ArrowRight, ShieldAlert, Layers, Radio, Flame } from "lucide-react";

// Exact Centroids for all 36 Indian States & UTs (viewBox 0 0 612 696)
const ALL_STATE_CENTROIDS = {
  // Northern Region
  "Jammu and Kashmir": { x: 175, y: 70 },
  "Himachal Pradesh": { x: 191, y: 135 },
  "Punjab": { x: 151, y: 152 },
  "Chandigarh": { x: 176, y: 158 },
  "Uttarakhand": { x: 232, y: 175 },
  "Haryana": { x: 165, y: 195 },
  "Delhi": { x: 186, y: 205 },
  "Uttar Pradesh": { x: 255, y: 245 },
  
  // Western Region
  "Rajasthan": { x: 130, y: 260 },
  "Gujarat": { x: 95, y: 345 },
  "Daman and Diu": { x: 70, y: 380 },
  "Dadra and Nagar Haveli": { x: 105, y: 405 },
  "Maharashtra": { x: 180, y: 435 },
  "Goa": { x: 125, y: 505 },

  // Central Region
  "Madhya Pradesh": { x: 220, y: 325 },
  "Chhattisgarh": { x: 295, y: 385 },

  // Eastern Region
  "Bihar": { x: 355, y: 270 },
  "Jharkhand": { x: 360, y: 325 },
  "West Bengal": { x: 395, y: 330 },
  "Odisha": { x: 340, y: 405 },

  // North-Eastern Region
  "Sikkim": { x: 410, y: 230 },
  "Arunachal Pradesh": { x: 530, y: 215 },
  "Assam": { x: 495, y: 265 },
  "Nagaland": { x: 535, y: 265 },
  "Manipur": { x: 525, y: 300 },
  "Mizoram": { x: 505, y: 335 },
  "Tripura": { x: 485, y: 325 },
  "Meghalaya": { x: 465, y: 280 },

  // Southern Region
  "Telangana": { x: 240, y: 455 },
  "Andhra Pradesh": { x: 260, y: 505 },
  "Karnataka": { x: 175, y: 520 },
  "Kerala": { x: 175, y: 615 },
  "Tamil Nadu": { x: 215, y: 605 },
  "Puducherry": { x: 250, y: 560 },

  // Islands
  "Andaman and Nicobar Islands": { x: 518, y: 605 },
  "Lakshadweep": { x: 110, y: 600 }
};

// Interactive Metric Info Tooltip
const InfoTooltip = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center cursor-help ml-1 select-none"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      title={text}
    >
      <span
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold transition-all duration-150 shadow-xs ${
          show
            ? "bg-[#F27F0C] text-white ring-2 ring-[#F27F0C]/30 scale-110"
            : "bg-slate-200 dark:bg-white/20 text-slate-600 dark:text-slate-200 hover:bg-[#F27F0C] hover:text-white"
        }`}
      >
        i
      </span>
      {show && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-xl bg-[#0B1528] dark:bg-[#031e2d] text-white text-[11px] leading-relaxed shadow-2xl border border-sky-400/30 z-50 text-center font-normal whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0B1528] dark:border-t-[#031e2d]" />
        </span>
      )}
    </span>
  );
};

// Official MoSPI Custom Detailed Line Icons
const CalculatorDocIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <rect x="8" y="6" width="22" height="36" rx="3" />
    <rect x="12" y="11" width="14" height="6" rx="1.5" strokeWidth="2" fill="#F1F5F9" />
    <circle cx="15" cy="22" r="1.5" fill="currentColor" />
    <circle cx="21" cy="22" r="1.5" fill="currentColor" />
    <circle cx="27" cy="22" r="1.5" fill="currentColor" />
    <circle cx="15" cy="28" r="1.5" fill="currentColor" />
    <circle cx="21" cy="28" r="1.5" fill="currentColor" />
    <circle cx="27" cy="28" r="1.5" fill="currentColor" />
    <circle cx="15" cy="34" r="1.5" fill="currentColor" />
    <circle cx="21" cy="34" r="1.5" fill="currentColor" />
    <circle cx="27" cy="34" r="1.5" fill="currentColor" />
    <path d="M30 12h8a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H22" strokeDasharray="2 2" opacity="0.6" />
  </svg>
);

const CoinStackIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <ellipse cx="20" cy="14" rx="12" ry="5" strokeWidth="2.2" fill="#F8FAFC" />
    <path d="M8 14v8c0 2.76 5.37 5 12 5s12-2.24 12-5v-8" />
    <path d="M8 22v8c0 2.76 5.37 5 12 5s12-2.24 12-5v-8" />
    <path d="M8 30v8c0 2.76 5.37 5 12 5s12-2.24 12-5v-8" />
    <ellipse cx="34" cy="26" rx="8" ry="3.5" strokeWidth="2" fill="#F1F5F9" />
    <path d="M26 26v6c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-6" />
    <path d="M26 32v6c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-6" />
  </svg>
);

const MoneyInHandIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <path d="M19 14h10l3 5c0 6-3 12-8 12s-8-6-8-12l3-5z" fill="#F8FAFC" strokeWidth="2.2" />
    <path d="M21 14c0-2 1.3-4 3-4s3 2 3 4" strokeWidth="2" />
    <circle cx="24" cy="21" r="3" strokeWidth="1.8" />
    <text x="24" y="23.5" fontSize="6" fontWeight="bold" textAnchor="middle" fill="currentColor" stroke="none">₹</text>
    <path d="M6 34h9l6 4h15a3 3 0 0 0 3-3c0-2-2-3-4-3h-9l-5-3H6" strokeWidth="2.2" />
    <path d="M6 30v9" strokeWidth="2.2" />
  </svg>
);

const AscendingBarChartIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <rect x="8" y="28" width="6" height="14" rx="1.5" fill="#F8FAFC" strokeWidth="2" />
    <rect x="18" y="20" width="6" height="22" rx="1.5" fill="#F8FAFC" strokeWidth="2" />
    <rect x="28" y="12" width="6" height="30" rx="1.5" fill="#F8FAFC" strokeWidth="2" />
    <rect x="38" y="6" width="6" height="36" rx="1.5" fill="#F8FAFC" strokeWidth="2" />
    <path d="M7 25l10-8 10 5 13-13" stroke="#E8602A" strokeWidth="2.5" />
    <polyline points="33 9 40 9 40 16" stroke="#E8602A" strokeWidth="2.5" />
  </svg>
);

const CalendarCheckIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <rect x="7" y="10" width="34" height="32" rx="4" fill="#F8FAFC" strokeWidth="2.2" />
    <line x1="7" y1="18" x2="41" y2="18" strokeWidth="2.2" />
    <line x1="15" y1="6" x2="15" y2="12" strokeWidth="2.5" />
    <line x1="33" y1="6" x2="33" y2="12" strokeWidth="2.5" />
    <circle cx="14" cy="25" r="1.5" fill="currentColor" />
    <circle cx="21" cy="25" r="1.5" fill="currentColor" />
    <circle cx="28" cy="25" r="1.5" fill="currentColor" />
    <circle cx="35" cy="25" r="1.5" fill="currentColor" />
    <circle cx="14" cy="33" r="1.5" fill="currentColor" />
    <circle cx="21" cy="33" r="1.5" fill="currentColor" />
    <circle cx="28" cy="33" r="1.5" fill="currentColor" />
    <circle cx="35" cy="33" r="1.5" fill="currentColor" />
  </svg>
);

const ConstructionCraneIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9 text-[#1E293B]">
    <line x1="14" y1="42" x2="14" y2="14" strokeWidth="2.5" />
    <line x1="20" y1="42" x2="20" y2="14" strokeWidth="2.5" />
    <line x1="14" y1="42" x2="20" y2="42" strokeWidth="3" />
    <line x1="10" y1="42" x2="24" y2="42" strokeWidth="2.5" />
    <line x1="14" y1="20" x2="20" y2="26" strokeWidth="1.8" />
    <line x1="20" y1="20" x2="14" y2="26" strokeWidth="1.8" />
    <line x1="14" y1="28" x2="20" y2="34" strokeWidth="1.8" />
    <line x1="20" y1="28" x2="14" y2="34" strokeWidth="1.8" />
    <line x1="6" y1="14" x2="42" y2="14" strokeWidth="2.5" />
    <rect x="6" y="11" width="5" height="6" fill="#1E293B" />
    <polygon points="17,6 14,14 20,14" fill="#F1F5F9" strokeWidth="2" />
    <line x1="17" y1="6" x2="38" y2="14" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="17" y1="6" x2="6" y2="14" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="36" y1="14" x2="36" y2="26" strokeWidth="2" />
    <path d="M33 26h6l-3 4-3-4z" fill="#E8602A" stroke="none" />
    <rect x="32" y="30" width="8" height="7" rx="1" fill="#F8FAFC" strokeWidth="1.8" />
  </svg>
);

// High-Risk Hotspots Leaderboard
const TOP_HOTSPOTS = [
  { name: "Maharashtra", count: 28, cost: "₹62,400 Cr", driver: "Land & Environmental" },
  { name: "Uttar Pradesh", count: 24, cost: "₹48,900 Cr", driver: "Contractor Delays" },
  { name: "West Bengal", count: 22, cost: "₹32,100 Cr", driver: "Right of Way Lag" },
  { name: "Karnataka", count: 18, cost: "₹37,800 Cr", driver: "Utility Shifting" },
  { name: "Bihar", count: 17, cost: "₹28,900 Cr", driver: "Contractor Liquidity" },
  { name: "Gujarat", count: 15, cost: "₹44,500 Cr", driver: "Supply Chain Choke" },
  { name: "Rajasthan", count: 12, cost: "₹33,200 Cr", driver: "Forest Clearance" }
];

export default function IndiaStateMap() {
  const [selectedState, setSelectedState] = useState("Rajasthan");
  const [hoveredState, setHoveredState] = useState(null);
  const [showRadarHotspots, setShowRadarHotspots] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, stateName: "", count: 0, highRisk: 0 });
  const navigate = useNavigate();

  const activeStateName = hoveredState || selectedState;
  const currentData = useMemo(() => {
    return getStateData(activeStateName);
  }, [activeStateName]);

  const handleMouseMove = (e, stateName, projectCount, highRiskCount) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
      stateName,
      count: projectCount,
      highRisk: highRiskCount
    });
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#BFDBFE]/70 dark:border-[#429EBD]/30 bg-gradient-to-br from-[#EBF5FB] via-[#F3F9FD] to-[#E5F1FB] dark:from-[#031e2d] dark:via-[#053F5C]/70 dark:to-[#031e2d] p-6 lg:p-9 shadow-sm transition-colors">
      
      {/* Background Graphic Grid/Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-15 overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
          <path d="M 0 0 L 600 300 L 0 600 Z" fill="#DCEEFB" opacity="0.4" />
          <path d="M 1200 200 L 700 500 L 1200 800 Z" fill="#E0F2FE" opacity="0.35" />
          <path d="M 300 0 L 900 800 L 1200 0 Z" fill="#EBF6FD" opacity="0.5" />
        </svg>
      </div>

      {/* Main Header & AI Radar Toggle */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#BFDBFE]/80 dark:border-[#429EBD]/30">
        <div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1528] dark:text-white tracking-tight">
              State-wise Projects
            </h2>
            <span className="text-xs sm:text-sm font-semibold text-[#475569] dark:text-slate-300">
              (as of July, 2026)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-1 font-medium">
            Central Sector Infrastructure Projects (₹150 Cr. and above) geospatial monitoring & AI Early Warning hotspots.
          </p>
        </div>

        {/* AI Radar & View Mode Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            onClick={() => setShowRadarHotspots(!showRadarHotspots)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
              showRadarHotspots
                ? "bg-red-600 text-white border-red-700 ring-2 ring-red-300"
                : "bg-white text-[#475569] border-[#CBD5E1] hover:bg-slate-50"
            }`}
          >
            <Radio size={14} className={showRadarHotspots ? "animate-pulse text-white" : "text-[#E8602A]"} />
            <span>{showRadarHotspots ? "Pan-India AI Radar Active" : "Enable AI Radar Hotspots"}</span>
          </button>

          <span className="text-xs font-bold text-[#0F172A] bg-white/80 backdrop-blur-xs border border-[#BFDBFE] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <Layers size={14} className="text-[#E8602A]" />
            <span>1,981 Monitored Projects</span>
          </span>
        </div>
      </div>

      {/* Top High-Risk Quick Hotspot Selector Chips */}
      <div className="relative z-10 mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#0B1528] shrink-0 mr-1">
          <Flame size={14} className="text-red-600 animate-bounce" />
          <span>Top Hotspots:</span>
        </div>
        {TOP_HOTSPOTS.map((hotspot) => {
          const isSelected = activeStateName.toLowerCase() === hotspot.name.toLowerCase();
          return (
            <button
              key={hotspot.name}
              onClick={() => {
                setSelectedState(hotspot.name);
              }}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-[#0B1528] text-white border-[#0B1528] shadow-sm scale-105"
                  : "bg-white/90 text-[#334155] border-[#CBD5E1] hover:border-red-400 hover:bg-red-50/50"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hotspot.count >= 20 ? "bg-red-600 animate-ping" : "bg-amber-500"}`} />
              <span>{hotspot.name}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${isSelected ? "bg-red-600 text-white" : "bg-red-100 text-red-700"}`}>
                {hotspot.count} Flagged
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Statistics Card & Right High-Precision India Map */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* ================= LEFT SIDE: EXACT MOSPI STATE DETAILS CARD ================= */}
        <div className="lg:col-span-6 bg-white/95 dark:bg-[#053F5C] backdrop-blur-md rounded-3xl border border-[#CBD5E1]/80 dark:border-[#429EBD]/20 shadow-xl p-6 sm:p-7 relative transition-all duration-300">
          
          {/* Top Navy Blue Header Banner matching PAIMANA Reference */}
          <div className="w-full bg-[#0B1528] dark:bg-[#031e2d] text-white py-3.5 px-6 rounded-2xl text-center shadow-md mb-6 transition-all duration-200 border border-transparent dark:border-[#429EBD]/30">
            <h3 className="text-xl sm:text-2xl font-black tracking-wide flex items-center justify-center gap-2">
              <span>{currentData.name}</span>
              {currentData.id && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/10 dark:bg-[#053F5C] text-sky-300">
                  {currentData.id}
                </span>
              )}
            </h3>
          </div>

          {/* 6 Metric Grid Tiles with Exact Line Icons and Dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
            
            {/* 1. Project Count */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-dashed border-[#E2E8F0] dark:border-[#429EBD]/20 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-amber-50 dark:group-hover:bg-white/10 group-hover:border-amber-200 transition-colors">
                <CalculatorDocIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Project Count</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(No.)</span>
                  <InfoTooltip text="Total active central sector infrastructure projects (₹150 Cr & above) monitored in this state." />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#0B1528] dark:text-white mt-0.5 tracking-tight group-hover:text-[#F27F0C] dark:group-hover:text-[#9FE7F5] transition-colors">
                  {currentData.projectCount}
                </div>
              </div>
            </div>

            {/* 2. Original Cost */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-dashed border-[#E2E8F0] dark:border-[#429EBD]/20 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-emerald-50 dark:group-hover:bg-white/10 group-hover:border-emerald-200 transition-colors">
                <CoinStackIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Original Cost</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(in Cr.)</span>
                  <InfoTooltip text="Initial sanctioned project budgetary allocation approved at the time of cabinet clearance." />
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B1528] dark:text-white mt-0.5 tracking-tight truncate">
                  ₹ {currentData.originalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 3. Latest Revised Cost */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-dashed border-[#E2E8F0] dark:border-[#429EBD]/20 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-orange-50 dark:group-hover:bg-white/10 group-hover:border-orange-200 transition-colors">
                <MoneyInHandIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Latest Revised Cost</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(in Cr.)</span>
                  <InfoTooltip text="Current updated anticipated completion cost accounting for scope and timeline revisions." />
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B1528] dark:text-white mt-0.5 tracking-tight truncate">
                  ₹ {currentData.revisedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 4. Expenditure (Cumm.) */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-dashed border-[#E2E8F0] dark:border-[#429EBD]/20 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-blue-50 dark:group-hover:bg-white/10 group-hover:border-blue-200 transition-colors">
                <AscendingBarChartIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Expenditure(Cumm.)</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(in Cr.)</span>
                  <InfoTooltip text="Cumulative capital deployed and disbursed to date across active projects in this state." />
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0B1528] dark:text-white mt-0.5 tracking-tight truncate">
                  ₹ {currentData.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* 5. Completed During Month */}
            <div className="flex items-center gap-3.5 pt-1 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-emerald-50 dark:group-hover:bg-white/10 group-hover:border-emerald-200 transition-colors">
                <CalendarCheckIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Completed During month</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(No.)</span>
                  <InfoTooltip text="Central infrastructure projects achieving full operational commissioning during this month." />
                </div>
                <div className="text-2xl font-black text-[#0B1528] dark:text-white mt-0.5">
                  {currentData.completedDuringMonth}
                </div>
              </div>
            </div>

            {/* 6. Newly Added */}
            <div className="flex items-center gap-3.5 pt-1 group">
              <div className="shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-[#031e2d] border border-slate-200/80 dark:border-[#429EBD]/30 group-hover:bg-purple-50 dark:group-hover:bg-white/10 group-hover:border-purple-200 transition-colors">
                <ConstructionCraneIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-xs font-bold text-[#475569] dark:text-slate-300">
                  <span>Newly Added</span>
                  <span className="text-[11px] font-normal text-[#64748B] dark:text-slate-400">(No.)</span>
                  <InfoTooltip text="New infrastructure projects sanctioned and brought under MoSPI Central IPMD tracking in this cycle." />
                </div>
                <div className="text-2xl font-black text-[#0B1528] dark:text-white mt-0.5">
                  {currentData.newlyAdded}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Card Footer: AI Risk Intelligence & Explore Link */}
          <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#429EBD]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-bold border border-red-200/80 dark:border-red-900/50 shadow-2xs">
                <ShieldAlert size={14} className="text-red-600" />
                <span>{currentData.highRiskCount} AI High-Risk Overrun Flagged</span>
              </span>
            </div>

            <button
              onClick={() => navigate(`/projects?state=${encodeURIComponent(currentData.name)}`)}
              className="flex items-center gap-1.5 text-[#F27F0C] dark:text-[#9FE7F5] hover:underline font-bold text-xs cursor-pointer ml-auto transition-colors"
            >
              <span>View all {currentData.projectCount} projects</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

        {/* ================= RIGHT SIDE: HIGH-PRECISION VECTOR INDIA MAP WITH COMPLETE PAN-INDIA RADAR BEACONS ================= */}
        <div className="lg:col-span-6 flex items-center justify-center relative p-2 sm:p-4">
          
          {/* SVG Map Container */}
          <div className="relative w-full max-w-[540px] aspect-[612/696] flex items-center justify-center">
            
            <svg
              viewBox={indiaMapData.viewBox || "0 0 612 696"}
              className="w-full h-full filter drop-shadow-md select-none transition-all duration-200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Active State Drop Shadow */}
                <filter id="activeStateShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.4" floodColor="#0F172A" />
                </filter>

                {/* Radar Pulse Glow Filter */}
                <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Render all 36 authentic State & UT vector paths */}
              <g className="transition-all duration-150">
                {indiaMapData.locations.map((loc) => {
                  const stateData = getStateData(loc.name);
                  const isSelected = activeStateName.toLowerCase() === loc.name.toLowerCase() || (currentData.id && loc.id.toUpperCase() === currentData.id);
                  const fillColor = getChoroplethColor(stateData.projectCount);

                  return (
                    <path
                      key={loc.id}
                      id={`state-${loc.id}`}
                      d={loc.path}
                      fill={fillColor}
                      stroke={isSelected ? "#0B1528" : "#2E3F50"}
                      strokeWidth={isSelected ? 2.8 : 0.85}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isSelected ? "url(#activeStateShadow)" : undefined}
                      className="cursor-pointer transition-all duration-150 hover:brightness-115 hover:opacity-95"
                      style={{
                        transformOrigin: "center",
                        paintOrder: "stroke fill"
                      }}
                      onMouseEnter={(e) => {
                        setHoveredState(loc.name);
                        handleMouseMove(e, loc.name, stateData.projectCount, stateData.highRiskCount);
                      }}
                      onMouseMove={(e) => handleMouseMove(e, loc.name, stateData.projectCount, stateData.highRiskCount)}
                      onMouseLeave={() => {
                        setHoveredState(null);
                        setTooltipPos(prev => ({ ...prev, visible: false }));
                      }}
                      onClick={() => {
                        setSelectedState(loc.name);
                      }}
                    />
                  );
                })}
              </g>

              {/* ================= COMPLETE PAN-INDIA RADAR SONAR LAYER (EVERY STATE, UT & ISLAND) ================= */}
              {showRadarHotspots && (
                <g>
                  {Object.entries(ALL_STATE_CENTROIDS).map(([stateName, coord]) => {
                    const sData = getStateData(stateName);
                    const isSelected = activeStateName.toLowerCase() === stateName.toLowerCase();
                    const isCritical = sData.highRiskCount >= 18;
                    const isHigh = sData.highRiskCount >= 8;
                    
                    // Dynamic theme color based on risk & selection
                    let ringColor = "#38BDF8"; // Electric Sky Blue for islands & low-risk
                    let coreColor = "#0284C7";
                    let ringRadius = 14;

                    if (isSelected) {
                      ringColor = "#0284C7";
                      coreColor = "#0369A1";
                      ringRadius = 24;
                    } else if (isCritical) {
                      ringColor = "#EF4444"; // Vivid Crimson Red for Critical
                      coreColor = "#DC2626";
                      ringRadius = 24;
                    } else if (isHigh) {
                      ringColor = "#F59E0B"; // Warm Amber Orange for High
                      coreColor = "#D97706";
                      ringRadius = 18;
                    } else {
                      ringColor = "#38BDF8"; // Cyan/Blue for Islands & General
                      coreColor = "#0284C7";
                      ringRadius = 13;
                    }

                    return (
                      <g
                        key={`radar-${stateName}`}
                        transform={`translate(${coord.x}, ${coord.y})`}
                        className="cursor-pointer group"
                        onMouseEnter={(e) => {
                          setHoveredState(stateName);
                          handleMouseMove(e, stateName, sData.projectCount, sData.highRiskCount);
                        }}
                        onMouseMove={(e) => handleMouseMove(e, stateName, sData.projectCount, sData.highRiskCount)}
                        onMouseLeave={() => {
                          setHoveredState(null);
                          setTooltipPos(prev => ({ ...prev, visible: false }));
                        }}
                        onClick={() => {
                          setSelectedState(stateName);
                        }}
                      >
                        {/* Invisible Large Hit Target for Easy Hover/Click (especially for islands) */}
                        <circle
                          cx="0"
                          cy="0"
                          r="24"
                          fill="transparent"
                          className="cursor-pointer"
                        />

                        {/* Concentric Expanding Sonar Wave 1 */}
                        <circle
                          cx="0"
                          cy="0"
                          r={ringRadius * 0.5}
                          fill="none"
                          stroke={ringColor}
                          className="animate-sonar-1 pointer-events-none"
                          filter="url(#radarGlow)"
                        />
                        {/* Concentric Expanding Sonar Wave 2 */}
                        <circle
                          cx="0"
                          cy="0"
                          r={ringRadius * 0.85}
                          fill="none"
                          stroke={ringColor}
                          className="animate-sonar-2 pointer-events-none"
                          filter="url(#radarGlow)"
                        />
                        {/* Concentric Expanding Sonar Wave 3 (for high/critical/selected states) */}
                        {(isHigh || isSelected) && (
                          <circle
                            cx="0"
                            cy="0"
                            r={ringRadius * 1.25}
                            fill="none"
                            stroke={ringColor}
                            className="animate-sonar-3 pointer-events-none"
                            filter="url(#radarGlow)"
                          />
                        )}
                        {/* Central Pulsing Beacon Core */}
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? 4.5 : isCritical ? 4 : 3}
                          fill={ringColor}
                          className="animate-ping pointer-events-none"
                          opacity="0.8"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r={isSelected ? 3.5 : isCritical ? 3 : 2.2}
                          fill="#FFFFFF"
                          stroke={coreColor}
                          strokeWidth="1.5"
                          className="pointer-events-none group-hover:scale-125 transition-transform"
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Interactive Floating Hover Tooltip (Subtle, sleek & clean) */}
            {tooltipPos.visible && (
              <div
                className="absolute pointer-events-none z-40 transition-all duration-75"
                style={{
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y - 10}px`,
                  transform: "translate(-50%, -100%)"
                }}
              >
                <div className="bg-[#0B1528]/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xl border border-sky-400/40 text-xs font-bold whitespace-nowrap flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E8602A] animate-ping" />
                  <span>{tooltipPos.stateName}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-sky-200 font-extrabold text-[10px]">
                    {tooltipPos.count} Projects
                  </span>
                  {tooltipPos.highRisk > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-red-600/80 text-white font-extrabold text-[10px]">
                      {tooltipPos.highRisk} Flagged
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ================= HEATMAP COLOR SCALE BAR (Exact MoSPI Reference) ================= */}
          <div className="ml-3 sm:ml-5 flex flex-col items-center justify-between h-[300px] sm:h-[360px] bg-white/90 backdrop-blur-md py-3 px-2 rounded-2xl border border-[#CBD5E1]/80 shadow-md text-[11px] font-black text-[#475569] select-none">
            
            {/* 182 Indicator */}
            <span className="text-[#9E2D2F] font-extrabold">182</span>
            
            {/* 137 Indicator */}
            <span className="text-[#BA4746] font-bold text-[10px]">137</span>

            {/* Gradient Bar */}
            <div className="w-3.5 sm:w-4 flex-1 my-1.5 rounded-full bg-gradient-to-b from-[#9E2D2F] via-[#BA4746] via-[#E59E8D] via-[#F5D2BE] to-[#FBF3E3] shadow-inner border border-slate-300/60" />

            {/* 91 Indicator */}
            <span className="text-[#E59E8D] font-bold text-[10px]">91</span>

            {/* 46 Indicator */}
            <span className="text-[#D97706] font-bold text-[10px]">46</span>

            {/* 0 Indicator */}
            <span className="text-[#64748B] font-extrabold">0</span>
          </div>

        </div>

      </div>

    </div>
  );
}
