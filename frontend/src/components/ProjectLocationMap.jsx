import { useState, useMemo } from "react";
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw, Target, Globe } from "lucide-react";
import { indiaMapData } from "../data/indiaMapPaths";

// Exact Centroids for all 36 Indian States & UTs (viewBox 0 0 612 696)
const ALL_STATE_CENTROIDS = {
  "Jammu and Kashmir": { x: 175, y: 70 },
  "Himachal Pradesh": { x: 191, y: 135 },
  "Punjab": { x: 151, y: 152 },
  "Chandigarh": { x: 176, y: 158 },
  "Uttarakhand": { x: 232, y: 175 },
  "Haryana": { x: 165, y: 195 },
  "Delhi": { x: 186, y: 205 },
  "Uttar Pradesh": { x: 255, y: 245 },
  "Rajasthan": { x: 130, y: 260 },
  "Gujarat": { x: 95, y: 345 },
  "Daman and Diu": { x: 70, y: 380 },
  "Dadra and Nagar Haveli": { x: 105, y: 405 },
  "Maharashtra": { x: 180, y: 435 },
  "Goa": { x: 125, y: 505 },
  "Madhya Pradesh": { x: 220, y: 325 },
  "Chhattisgarh": { x: 295, y: 385 },
  "Bihar": { x: 355, y: 270 },
  "Jharkhand": { x: 360, y: 325 },
  "West Bengal": { x: 395, y: 330 },
  "Odisha": { x: 340, y: 405 },
  "Sikkim": { x: 410, y: 230 },
  "Arunachal Pradesh": { x: 530, y: 215 },
  "Assam": { x: 495, y: 265 },
  "Nagaland": { x: 535, y: 265 },
  "Manipur": { x: 525, y: 300 },
  "Mizoram": { x: 505, y: 335 },
  "Tripura": { x: 485, y: 325 },
  "Meghalaya": { x: 465, y: 280 },
  "Telangana": { x: 240, y: 455 },
  "Andhra Pradesh": { x: 260, y: 505 },
  "Karnataka": { x: 175, y: 520 },
  "Kerala": { x: 175, y: 615 },
  "Tamil Nadu": { x: 215, y: 605 },
  "Puducherry": { x: 250, y: 560 },
  "Andaman and Nicobar Islands": { x: 518, y: 605 },
  "Lakshadweep": { x: 110, y: 600 }
};

export default function ProjectLocationMap({ stateName, projectName }) {
  // Zoom state: 1.0 (Full National Map), 1.8, 2.5, 3.2 (Focused Regional State)
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Normalize state name to match map path ID / names
  const normalizedState = useMemo(() => {
    if (!stateName) return "Bihar";
    const clean = stateName.toLowerCase().trim();
    if (clean.includes("andaman")) return "Andaman and Nicobar Islands";
    if (clean.includes("andhra")) return "Andhra Pradesh";
    if (clean.includes("arunachal")) return "Arunachal Pradesh";
    if (clean.includes("assam")) return "Assam";
    if (clean.includes("bihar")) return "Bihar";
    if (clean.includes("chhattisgarh")) return "Chhattisgarh";
    if (clean.includes("delhi")) return "Delhi";
    if (clean.includes("goa")) return "Goa";
    if (clean.includes("gujarat")) return "Gujarat";
    if (clean.includes("haryana")) return "Haryana";
    if (clean.includes("himachal")) return "Himachal Pradesh";
    if (clean.includes("jammu") || clean.includes("kashmir")) return "Jammu and Kashmir";
    if (clean.includes("jharkhand")) return "Jharkhand";
    if (clean.includes("karnataka")) return "Karnataka";
    if (clean.includes("kerala")) return "Kerala";
    if (clean.includes("ladakh")) return "Ladakh";
    if (clean.includes("lakshadweep")) return "Lakshadweep";
    if (clean.includes("madhya")) return "Madhya Pradesh";
    if (clean.includes("maharashtra")) return "Maharashtra";
    if (clean.includes("manipur")) return "Manipur";
    if (clean.includes("meghalaya")) return "Meghalaya";
    if (clean.includes("mizoram")) return "Mizoram";
    if (clean.includes("nagaland")) return "Nagaland";
    if (clean.includes("odisha") || clean.includes("orissa")) return "Odisha";
    if (clean.includes("puducherry") || clean.includes("pondicherry")) return "Puducherry";
    if (clean.includes("punjab")) return "Punjab";
    if (clean.includes("rajasthan")) return "Rajasthan";
    if (clean.includes("sikkim")) return "Sikkim";
    if (clean.includes("tamil")) return "Tamil Nadu";
    if (clean.includes("telangana")) return "Telangana";
    if (clean.includes("tripura")) return "Tripura";
    if (clean.includes("uttar pradesh") || clean === "up") return "Uttar Pradesh";
    if (clean.includes("uttarakhand")) return "Uttarakhand";
    if (clean.includes("west bengal") || clean === "wb") return "West Bengal";
    return stateName;
  }, [stateName]);

  // Find centroid coordinates for radar beacon
  const centroid = useMemo(() => {
    return ALL_STATE_CENTROIDS[normalizedState] || { x: 300, y: 350 };
  }, [normalizedState]);

  // Compute dynamic SVG viewBox centered on state when zoomed
  const currentViewBox = useMemo(() => {
    const origW = 612;
    const origH = 696;
    if (zoomLevel <= 1.0) {
      return `0 0 ${origW} ${origH}`;
    }
    const viewW = origW / zoomLevel;
    const viewH = origH / zoomLevel;
    const minX = Math.max(0, Math.min(origW - viewW, centroid.x - viewW / 2));
    const minY = Math.max(0, Math.min(origH - viewH, centroid.y - viewH / 2));
    return `${minX} ${minY} ${viewW} ${viewH}`;
  }, [zoomLevel, centroid]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(3.2, Number((prev + 0.6).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(1.0, Number((prev - 0.6).toFixed(1))));
  };

  const handleToggleFocus = () => {
    setZoomLevel(prev => (prev > 1.0 ? 1.0 : 2.4));
  };

  const handleReset = () => {
    setZoomLevel(1.0);
  };

  return (
    <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm overflow-hidden p-4 transition-colors">
      {/* Header Info & Controls */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-transparent dark:border-[#429EBD]/30 rounded-lg">
            <MapPin size={14} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1C1917] dark:text-white">Geospatial Project Location</h4>
            <p className="text-[10px] text-[#78716C] dark:text-slate-300 font-medium">{normalizedState}, India</p>
          </div>
        </div>

        {/* Zoom & Focus Action Bar */}
        <div className="flex items-center gap-1.5 bg-[#F5F5F4] dark:bg-[#031e2d] p-1 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30">
          {/* Quick Focus State Toggle */}
          <button
            onClick={handleToggleFocus}
            title={zoomLevel > 1.0 ? "Switch to Pan-India National View" : `Focus Zoom on ${normalizedState}`}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs
              ${zoomLevel > 1.0
                ? "bg-[#F27F0C] text-white"
                : "bg-white dark:bg-[#053F5C] text-[#44403C] dark:text-slate-200 hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] hover:bg-[#FEF0E7] dark:hover:bg-white/10"}`}
          >
            {zoomLevel > 1.0 ? (
              <>
                <Globe size={11} /> National View
              </>
            ) : (
              <>
                <Target size={11} /> Focus {normalizedState.split(" ")[0]}
              </>
            )}
          </button>

          <div className="h-3.5 w-px bg-[#E7E5E4] dark:bg-[#429EBD]/30 mx-0.5" />

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3.2}
            title="Zoom In"
            className="p-1 rounded-lg bg-white dark:bg-[#053F5C] hover:bg-[#FEF0E7] dark:hover:bg-white/10 hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] text-[#57534E] dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-[#E7E5E4] dark:border-[#429EBD]/30 transition-colors cursor-pointer"
          >
            <ZoomIn size={12} />
          </button>

          {/* Current Zoom Scale Badge */}
          <span className="text-[10px] font-bold text-[#78716C] dark:text-slate-300 px-1 min-w-[28px] text-center select-none">
            {zoomLevel.toFixed(1)}x
          </span>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1.0}
            title="Zoom Out"
            className="p-1 rounded-lg bg-white dark:bg-[#053F5C] hover:bg-[#FEF0E7] dark:hover:bg-white/10 hover:text-[#F27F0C] dark:hover:text-[#9FE7F5] text-[#57534E] dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed border border-[#E7E5E4] dark:border-[#429EBD]/30 transition-colors cursor-pointer"
          >
            <ZoomOut size={12} />
          </button>

          {/* Reset */}
          {zoomLevel > 1.0 && (
            <button
              onClick={handleReset}
              title="Reset Zoom"
              className="p-1 rounded-lg bg-white dark:bg-[#053F5C] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 text-[#78716C] dark:text-slate-300 border border-[#E7E5E4] dark:border-[#429EBD]/30 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Visual with Dynamic Vector Viewport */}
      <div className="relative w-full h-60 bg-gradient-to-br from-[#FBF8F5] to-[#F5ECE1] dark:from-[#031e2d] dark:to-[#053F5C] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20 flex items-center justify-center overflow-hidden">
        {/* Subtle Map Grid Lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#BA4746 0.75px, transparent 0.75px)",
            backgroundSize: "16px 16px"
          }}
        />

        {/* Vector SVG India Map with smooth viewBox transition */}
        <svg
          viewBox={currentViewBox}
          className="w-full h-full max-h-56 object-contain filter drop-shadow-xs transition-all duration-500 ease-out"
          aria-label={`Map of India showing ${normalizedState}`}
        >
          {/* Base States */}
          <g>
            {indiaMapData.locations.map((loc) => {
              const isSelected = loc.name.toLowerCase() === normalizedState.toLowerCase();
              return (
                <path
                  key={loc.id}
                  d={loc.path}
                  id={`loc-${loc.id}`}
                  className="transition-all duration-300"
                  fill={isSelected ? "#F27F0C" : "#429EBD25"}
                  stroke={isSelected ? "#F7AD19" : "#429EBD50"}
                  strokeWidth={isSelected ? (zoomLevel > 1.5 ? "1.2" : "1.8") : (zoomLevel > 1.5 ? "0.4" : "0.75")}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* Animated Pulsing Sonar Beacon at Centroid */}
          <g transform={`translate(${centroid.x}, ${centroid.y})`} className="pointer-events-none">
            {/* Concentric Expanding Rings */}
            <circle r={zoomLevel > 1.5 ? "4" : "6"} fill="#F27F0C" fillOpacity="0.4" className="animate-sonar-1" />
            <circle r={zoomLevel > 1.5 ? "8" : "12"} fill="#F27F0C" fillOpacity="0.25" className="animate-sonar-2" />
            <circle r={zoomLevel > 1.5 ? "12" : "18"} fill="#F27F0C" fillOpacity="0.1" className="animate-sonar-3" />
            {/* Center Core GPS Pinpoint */}
            <circle r={zoomLevel > 1.5 ? "2.5" : "4"} fill="#F27F0C" stroke="#FFFFFF" strokeWidth={zoomLevel > 1.5 ? "1" : "1.5"} className="drop-shadow-sm" />
          </g>
        </svg>

        {/* Floating Location Overlay Badge */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/90 dark:bg-[#031e2d]/90 backdrop-blur-xs border border-[#E7E5E4] dark:border-[#429EBD]/30 rounded-lg px-2.5 py-1.5 shadow-xs flex items-center gap-2 pointer-events-none">
          <Navigation size={12} className="text-[#F27F0C] dark:text-[#9FE7F5] flex-shrink-0" />
          <div className="text-left">
            <p className="text-[10px] font-bold text-[#1C1917] dark:text-white leading-none">{normalizedState}</p>
            <p className="text-[8px] text-[#78716C] dark:text-slate-300 leading-tight mt-0.5">
              {zoomLevel > 1.0 ? `Regional Cluster View (${zoomLevel.toFixed(1)}x)` : "Regional Project Ground Nodal Site"}
            </p>
          </div>
        </div>

        {/* Live Telemetry Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50/90 dark:bg-emerald-950/70 backdrop-blur-xs border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-full text-[9px] font-bold pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          GIS Live Telemetry
        </div>
      </div>
    </div>
  );
}
