import { useState } from "react";
import Sidebar from "./Sidebar";
import GovtHeaderBanner from "./GovtHeaderBanner";

export default function Layout({
  user,
  children,
  title,
  subtitle,
  showDateRange,
  onExport
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full bg-[#FAF7F4] dark:bg-[#031e2d] text-[#1C1917] dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Unified Official Single Master Header Banner */}
        <GovtHeaderBanner
          title={title}
          subtitle={subtitle}
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          showDateRange={showDateRange}
          onExport={onExport}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FAF7F4] dark:bg-[#031e2d] transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
