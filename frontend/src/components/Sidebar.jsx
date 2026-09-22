import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Brain, BarChart3,
  Lightbulb, MessageSquare, FileText, LogOut, X,
  ShieldCheck, CheckSquare, Star, ChevronLeft, ChevronRight
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import sanketLogo from "../assets/sanket-logo.png";

export default function Sidebar({ user, mobileOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible sidebar state with local storage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sanket_sidebar_collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("sanket_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("infrawatch_user");
    window.dispatchEvent(new Event("infrawatch_logout"));
    navigate("/login");
  };

  // Strictly Role-Based Navigation Items (Clean, distinct top-level pages)
  const getNavItems = () => {
    // 1. Reviewer / Monitoring Officer (Audit & Verification Authority)
    if (user?.role === "Reviewer / Monitoring Officer") {
      return [
        { path: "/monitoring/watchlist", label: "Priority Watchlist (Hero)", icon: Star },
        { path: "/reviewer-dashboard", label: "CUF Audit & Review", icon: CheckSquare },
        { path: "/projects", label: "Projects Repository", icon: FolderOpen },
        { path: "/explainable-ai", label: "Explainable AI (XAI)", icon: Lightbulb },
        { path: "/reports", label: "Audit Logs & Export", icon: FileText },
      ];
    }

    // 2. Project Administrator (System & Ingestion Authority)
    if (user?.role === "Project Administrator") {
      return [
        { path: "/administrator", label: "Portfolio Overview", icon: ShieldCheck },
        { path: "/administrator/projects", label: "Master Register", icon: FolderOpen },
        { path: "/analytics", label: "Ingestion Analytics", icon: BarChart3 },
        { path: "/reports", label: "System Logs & Reports", icon: FileText },
      ];
    }

    // 3. Government Officer / Policymaker (Strategic Cabinet Authority)
    return [
      { path: "/policymaker", label: "Strategic Overview", icon: LayoutDashboard },
      { path: "/projects", label: "Projects Repository", icon: FolderOpen },
      { path: "/ai-prediction", label: "AI Prediction Engine", icon: Brain },
      { path: "/explainable-ai", label: "Explainable AI (XAI)", icon: Lightbulb },
      { path: "/ai-assistant", label: "MoSPI AI Copilot", icon: MessageSquare },
      { path: "/reports", label: "Reports & Export", icon: FileText },
    ];
  };

  const navItems = getNavItems();

  const isItemActive = (path) => {
    if (path === "/policymaker") {
      return (
        location.pathname === "/policymaker" ||
        location.pathname.startsWith("/policymaker/") ||
        location.pathname === "/dashboard"
      );
    }
    if (path === "/administrator") {
      return (
        location.pathname === "/administrator" &&
        !location.pathname.startsWith("/administrator/projects")
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const renderNavLinks = (isMobile = false) => {
    const collapsed = !isMobile && isCollapsed;
    return (
      <div className="space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isItemActive(path);
          return (
            <NavLink
              key={path}
              to={path}
              onClick={isMobile ? onClose : undefined}
              className={`relative flex items-center ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3.5 py-2.5"
              } rounded-xl text-xs font-semibold transition-all duration-150 group select-none ${
                active
                  ? `bg-[#FEF0E7] dark:bg-[#053F5C] text-[#F27F0C] dark:text-[#9FE7F5] font-bold shadow-2xs border border-[#FDDFCC] dark:border-[#429EBD]/40 ${
                      !collapsed
                        ? "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-[#F27F0C] dark:before:bg-[#9FE7F5]"
                        : ""
                    }`
                  : "text-[#78716C] dark:text-slate-300 hover:bg-[#F5F5F4] dark:hover:bg-white/5 hover:text-[#1C1917] dark:hover:text-white border border-transparent"
              }`}
              title={label}
            >
              <Icon
                size={collapsed ? 20 : 17}
                className={`flex-shrink-0 transition-colors ${
                  active
                    ? "text-[#F27F0C] dark:text-[#9FE7F5]"
                    : "text-[#A8A29E] dark:text-slate-400 group-hover:text-[#44403C] dark:group-hover:text-white"
                }`}
              />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar with toggleable collapse */}
      <aside
        className={`hidden md:flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        } bg-white dark:bg-[#031e2d] border-r border-[#E7E5E4] dark:border-[#429EBD]/20 h-full flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* SANKET Artwork Logo & Collapse Button in Sidebar Header */}
          <div className="px-3.5 py-3.5 border-b border-[#F5F5F4] dark:border-[#429EBD]/20 flex items-center justify-between flex-shrink-0 min-h-[57px]">
            {!isCollapsed ? (
              <>
                <img
                  src={sanketLogo}
                  alt="SANKET"
                  className="h-8 w-auto max-w-[140px] object-contain select-none"
                />
                <button
                  onClick={toggleCollapse}
                  className="p-1.5 rounded-xl bg-amber-50 dark:bg-white/10 border border-amber-300 dark:border-[#429EBD]/30 text-[#F27F0C] dark:text-[#9FE7F5] hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center group"
                  title="Collapse sidebar (compact mode)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-center">
                <button
                  onClick={toggleCollapse}
                  className="p-2 rounded-xl bg-amber-50 dark:bg-white/10 border border-amber-300 dark:border-[#429EBD]/30 text-[#F27F0C] dark:text-[#9FE7F5] hover:bg-[#F27F0C] hover:text-white dark:hover:bg-[#F27F0C] dark:hover:text-white transition-all shadow-xs cursor-pointer flex items-center justify-center group"
                  title="Expand sidebar (full width)"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

          {/* Clean Navigation Links */}
          <nav className="flex-1 px-2.5 py-3 overflow-y-auto min-h-0">
            {renderNavLinks(false)}
          </nav>

          {/* Sidebar Footer: Theme Toggle & User Info */}
          <div className="p-2.5 border-t border-[#F5F5F4] dark:border-[#429EBD]/20 flex-shrink-0 space-y-2 bg-stone-50/40 dark:bg-[#053F5C]/15">
            {!isCollapsed ? (
              <>
                {/* Theme Switch Row */}
                <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#053F5C]/50 border border-[#E7E5E4] dark:border-[#429EBD]/25 flex items-center justify-between shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#78716C] dark:text-slate-300">Appearance</span>
                  <ThemeToggle compact />
                </div>

                {/* User Profile Card with Sign Out */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#053F5C]/60 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F27F0C] to-[#F7AD19] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {user?.avatar || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-[#F27F0C] dark:text-[#9FE7F5] font-semibold truncate">
                        {user?.role || ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-2 flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-xs font-semibold text-[#78716C] dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                  >
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </>
            ) : (
              /* Collapsed Footer */
              <div className="flex flex-col items-center gap-2 py-1">
                <div title="Toggle Appearance">
                  <ThemeToggle compact />
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F27F0C] to-[#F7AD19] text-white text-xs font-black flex items-center justify-center shadow-2xs cursor-default"
                  title={`${user?.name || "User"} (${user?.role || ""})`}
                >
                  {user?.avatar || "U"}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-[#78716C] dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#031e2d] border-r border-[#E7E5E4] dark:border-[#429EBD]/20 slide-in shadow-xl z-10 flex flex-col">
            {/* Mobile Header with SANKET Logo */}
            <div className="px-5 py-4 border-b border-[#F5F5F4] dark:border-[#429EBD]/20 flex items-center justify-between flex-shrink-0">
              <img
                src={sanketLogo}
                alt="SANKET"
                className="h-8 w-auto max-w-[160px] object-contain select-none"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F4] dark:hover:bg-white/10 cursor-pointer transition-colors"
                aria-label="Close sidebar"
              >
                <X size={16} className="text-[#78716C] dark:text-slate-200" />
              </button>
            </div>

            {/* Mobile Nav - Only Top-Level Page Names */}
            <nav className="flex-1 px-3 py-3 overflow-y-auto min-h-0">
              {renderNavLinks(true)}
            </nav>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-[#F5F5F4] dark:border-[#429EBD]/20 flex-shrink-0 space-y-2 bg-stone-50/40 dark:bg-[#053F5C]/15">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#053F5C]/50 border border-[#E7E5E4] dark:border-[#429EBD]/25 flex items-center justify-between shadow-2xs">
                <span className="text-[11px] font-semibold text-[#78716C] dark:text-slate-300">Appearance</span>
                <ThemeToggle compact />
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#053F5C]/60 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F27F0C] to-[#F7AD19] text-white text-xs font-black flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {user?.avatar || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#1C1917] dark:text-white truncate">{user?.name || "User"}</p>
                    <p className="text-[10px] text-[#F27F0C] dark:text-[#9FE7F5] font-semibold truncate">{user?.role || ""}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-2 flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-xs font-semibold text-[#78716C] dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
