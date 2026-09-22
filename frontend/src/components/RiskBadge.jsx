export default function RiskBadge({ level, size = "md", score }) {
  const configs = {
    Critical: { bg: "bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", label: "CRITICAL" },
    High: { bg: "bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60", text: "text-[#F27F0C] dark:text-orange-300", dot: "bg-[#F27F0C]", label: "HIGH" },
    Medium: { bg: "bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60", text: "text-amber-800 dark:text-amber-300", dot: "bg-amber-500", label: "MEDIUM" },
    Moderate: { bg: "bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60", text: "text-amber-800 dark:text-amber-300", dot: "bg-amber-500", label: "MODERATE" },
    Low: { bg: "bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", label: "LOW" },
  };

  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  const cfg = configs[level] || configs.Low;

  const hasValidScore = score !== undefined && score !== null && score !== "" && !isNaN(Number(score));

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold tracking-wide whitespace-nowrap ${cfg.bg} ${cfg.text} ${sizeClass}`}>
      <span className={`${dotSize} rounded-full ${cfg.dot} flex-shrink-0`} />
      {cfg.label} {hasValidScore ? `· ${Math.round(Number(score))}` : ""}
    </span>
  );
}
