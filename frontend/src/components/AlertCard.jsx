import { ArrowUpRight, Clock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RiskBadge from "./RiskBadge";

export default function AlertCard({ alert, onMarkReviewed }) {
  const navigate = useNavigate();
  const isCritical = alert.priority === "Critical";

  return (
    <div
      className={`bg-white rounded-2xl p-5 border shadow-sm fade-in relative overflow-hidden
        ${isCritical ? "border-l-4 border-l-red-500 pulse-red border-[#E7E5E4]" : "border-[#E7E5E4]"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-[#1C1917] text-sm">{alert.projectName}</h3>
            <RiskBadge level={alert.priority} size="sm" />
            {alert.reviewed && (
              <span className="text-[10px] text-[#78716C] bg-[#F5F5F4] px-2 py-0.5 rounded-full">Reviewed</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#78716C]">{alert.sector}</span>
            <span className="w-1 h-1 rounded-full bg-[#D6D3D1]" />
            <span className="text-xs text-[#78716C]">{alert.state}</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-[#78716C]">{alert.prevScore}</span>
            <ArrowUpRight size={14} className="text-red-500" />
            <span className="text-base font-bold text-red-600">{alert.currentScore}</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${alert.change > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
              {alert.change > 0 ? `+${alert.change}` : alert.change}
            </span>
          </div>

          <p className="text-sm text-[#44403C] leading-relaxed mb-3">{alert.reason}</p>

          <div className="flex items-center gap-1.5 text-xs text-[#A8A29E]">
            <Clock size={11} />
            {alert.timestamp}
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/projects/${alert.projectId}`)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#E8602A] bg-[#FEF0E7] hover:bg-[#FDDFCC] px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            <Eye size={12} /> View Project
          </button>
          {!alert.reviewed && onMarkReviewed && (
            <button
              onClick={() => onMarkReviewed(alert.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#78716C] bg-[#F5F5F4] hover:bg-[#E7E5E4] px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              Mark Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
