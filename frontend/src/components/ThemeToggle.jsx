import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ compact = false, className = "" }) {
  const { theme, isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Currently in ${isDark ? "Dark" : "Light"} mode. Click to toggle.`}
        className={`relative inline-flex items-center justify-between h-8 w-16 p-1 rounded-full border transition-all duration-300 cursor-pointer select-none ${
          isDark
            ? "bg-[#031e2d] border-[#429EBD]/40 text-[#9FE7F5] shadow-inner shadow-[#000000]/40"
            : "bg-[#f1f5f9] border-[#053F5C]/20 text-[#053F5C] shadow-sm"
        } ${className}`}
      >
        {/* Sun Icon */}
        <span
          className={`flex items-center justify-center w-6 h-6 transition-all duration-300 z-10 ${
            !isDark ? "text-[#F27F0C] scale-110" : "text-[#429EBD]/50 scale-90 hover:text-[#9FE7F5]"
          }`}
        >
          <Sun size={13} strokeWidth={2.5} />
        </span>

        {/* Moon Icon */}
        <span
          className={`flex items-center justify-center w-6 h-6 transition-all duration-300 z-10 ${
            isDark ? "text-[#9FE7F5] scale-110" : "text-slate-400 scale-90 hover:text-[#053F5C]"
          }`}
        >
          <Moon size={13} strokeWidth={2.5} />
        </span>

        {/* Sliding Indicator Pill */}
        <span
          className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform duration-300 ease-out shadow-sm flex items-center justify-center ${
            isDark
              ? "translate-x-8 bg-gradient-to-br from-[#053F5C] to-[#429EBD] border border-[#9FE7F5]/40"
              : "translate-x-0 bg-gradient-to-br from-[#F7AD19] to-[#F27F0C] border border-[#F7AD19]/60"
          }`}
        />
      </button>
    );
  }

  // Full / expanded mode with label
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none ${
        isDark
          ? "bg-[#053F5C]/60 hover:bg-[#053F5C] border-[#429EBD]/40 text-[#9FE7F5] shadow-xs"
          : "bg-white hover:bg-slate-100 border-slate-200 text-[#053F5C] shadow-2xs"
      } ${className}`}
    >
      {isDark ? (
        <>
          <Moon size={14} className="text-[#9FE7F5]" />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={14} className="text-[#F27F0C]" />
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
