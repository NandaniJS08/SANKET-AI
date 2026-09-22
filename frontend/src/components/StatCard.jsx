import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ title, value, subtitle, change, changeType = "neutral", accentColor = "orange", icon: Icon, children }) {
  const accentMap = {
    orange: { light: "bg-[#FEF0E7] dark:bg-[#031e2d]", text: "text-[#F27F0C] dark:text-[#F27F0C]", border: "border-[#FDDFCC] dark:border-[#F27F0C]/30" },
    red: { light: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", border: "border-red-100 dark:border-red-800/40" },
    green: { light: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-800/40" },
    blue: { light: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-[#429EBD] dark:text-[#9FE7F5]", border: "border-cyan-100 dark:border-[#429EBD]/30" },
  };
  const acc = accentMap[accentColor] || accentMap.orange;

  return (
    <div className="bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 card-hover shadow-sm transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-[#78716C] dark:text-slate-300 font-medium">{title}</p>
          {subtitle && <p className="text-xs text-[#A8A29E] dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-transparent ${acc.light} ${acc.border}`}>
            <Icon size={18} className={acc.text} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-[#1C1917] dark:text-white tracking-tight">{value}</span>
        {change !== undefined && (
          <div className={`flex items-center gap-0.5 text-sm font-medium mb-0.5 ${changeType === "up" ? "text-[#F27F0C]" : changeType === "down" ? "text-emerald-600 dark:text-emerald-400" : "text-[#78716C] dark:text-slate-400"}`}>
            {changeType === "up" ? <ArrowUpRight size={14} /> : changeType === "down" ? <ArrowDownRight size={14} /> : null}
            {change}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
