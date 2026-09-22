import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TabStrip({ tabs, activeTabId, onSelectTab }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [tabs]);

  // Auto-center active tab on mount or change
  useEffect(() => {
    if (!scrollRef.current) return;
    const timer = setTimeout(() => {
      const activeEl = scrollRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
      checkScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTabId]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const distance = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth"
    });
    setTimeout(checkScroll, 320);
  };

  return (
    <div className="relative flex items-center bg-white dark:bg-[#053F5C] rounded-2xl border border-slate-200/90 dark:border-white/10 p-1.5 shadow-xs transition-colors group">
      {/* Left Gradient Fade Mask */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-[#053F5C] to-transparent rounded-l-2xl z-10" />
      )}

      {/* Left Scroll Navigation Button */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-1.5 z-20 p-1.5 rounded-xl bg-white/95 dark:bg-[#031e2d]/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 shadow-md hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="Scroll Left"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* Hidden Scrollbar Container (Cross-Browser Zero-Scrollbar) */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-1 overflow-x-auto scroll-smooth w-full px-1 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              data-active={isActive ? "true" : "false"}
              onClick={() => onSelectTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? "bg-[#F27F0C] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.icon && <tab.icon size={13} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Gradient Fade Mask */}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-[#053F5C] to-transparent rounded-r-2xl z-10" />
      )}

      {/* Right Scroll Navigation Button with Hint */}
      {canScrollRight && (
        <div className="absolute right-1.5 z-20 flex items-center">
          <button
            onClick={() => handleScroll("right")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#031e2d]/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/15 shadow-md hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white transition-all cursor-pointer text-xs font-bold group/btn"
            title="More tabs available — Click to scroll right"
            aria-label="Scroll tabs right"
          >
            <span className="text-[10px] uppercase font-bold text-[#F27F0C] group-hover/btn:text-white dark:text-[#F7AD19] hidden sm:inline">
              More
            </span>
            <ChevronRight size={15} className="text-[#F27F0C] group-hover/btn:text-white dark:text-[#F7AD19] animate-pulse" />
          </button>
        </div>
      )}
    </div>
  );
}
