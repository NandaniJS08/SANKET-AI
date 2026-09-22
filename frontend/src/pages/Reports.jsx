import { useState, useEffect, useRef } from "react";
import {
  FileText, Download, Loader2, CheckCircle, FileSpreadsheet,
  File, ShieldCheck, CheckSquare, BarChart3, CheckCircle2, ArrowDownToLine
} from "lucide-react";
import Layout from "../components/Layout";
import { getProjects, getStatsOverview } from "../services/api.js";

// Client-side file downloader helper
function triggerDownload(filename, content, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Generate CSV string from array of objects
function generateCSV(headers, rows) {
  const headerLine = headers.map(h => `"${h.label}"`).join(",");
  const dataLines = rows.map(row =>
    headers.map(h => {
      const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : "";
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export default function Reports({ user }) {
  const [downloadNotification, setDownloadNotification] = useState(null);
  // Track per-handler loading state to prevent double-clicks
  const [handlerLoading, setHandlerLoading] = useState({});
  // Live stats fetched on mount for flash report totals
  const [statsOverview, setStatsOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getStatsOverview()
      .then(data => { if (!cancelled) setStatsOverview(data); })
      .catch(() => {/* non-critical; flash report falls back to N/A */});
    return () => { cancelled = true; };
  }, []);

  // BUG-006 FIX: Store timer ref to clearTimeout on unmount (prevent setState on unmounted component)
  const notifTimerRef = useRef(null);
  useEffect(() => () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); }, []);
  const showNotification = (msg) => {
    setDownloadNotification(msg);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setDownloadNotification(null), 3500);
  };

  // Helper: set per-handler loading flag
  const withLoading = async (key, fn) => {
    setHandlerLoading(prev => ({ ...prev, [key]: true }));
    try { await fn(); }
    finally { setHandlerLoading(prev => ({ ...prev, [key]: false })); }
  };

  // Helper: fetch all pages of a filtered project query (batches of 100, up to maxPages)
  const fetchAllProjectPages = async (filters = {}, maxPages = 25) => {
    const allItems = [];
    let page = 1;
    let totalPages = 1;
    do {
      const resp = await getProjects({ ...filters, page, pageSize: 100 });
      allItems.push(...(resp.data ?? []));
      totalPages = resp.totalPages ?? 1;
      page++;
    } while (page <= totalPages && page <= maxPages);
    return allItems;
  };

  // 1. Download Master Projects CSV — live API fetch on demand
  const handleDownloadMasterDataset = () => withLoading("master", async () => {
    const headers = [
      { label: "Project ID", key: "projectId" },
      { label: "Project Name", key: "name" },
      { label: "Administrative Ministry", key: "ministry" },
      { label: "Sector", key: "sector" },
      { label: "State / UT", key: "state" },
      { label: "Implementing Agency", key: "agency" },
      { label: "Sanctioned Cost (₹ Cr)", key: "originalCostCr" },
      { label: "Revised Cost (₹ Cr)", key: "revisedCostCr" },
      { label: "Cumulative Expenditure (₹ Cr)", key: "expenditureCr" },
      { label: "Physical Progress (%)", key: "physicalProgress" },
      { label: "Financial Utilization (%)", key: "financialProgress" },
      { label: "Risk Level", key: "riskLevel" },
      { label: "Risk Score (0-100)", key: "riskScore" },
      { label: "Cost Revision Flag (%)", key: "costRevisionPct" },
      { label: "Deadline Revision Flag", key: "deadlineRevisionFlag" },
      { label: "Operational Status", key: "status" },
      { label: "Reporting Cycle", key: "reportingMonth" }
    ];
    const allProjects = await fetchAllProjectPages();
    const csvContent = generateCSV(headers, allProjects);
    triggerDownload(`SANKET_AI_Central_Infrastructure_Master_Dataset_${allProjects.length}_Projects.csv`, csvContent);
    showNotification(`Downloaded SANKET-AI Master Dataset (${allProjects.length.toLocaleString("en-IN")} Projects)!`);
  });

  // 2. Download MoSPI Flash Report — live stats from /api/v1/projects/stats/overview
  const handleDownloadFlashReport = () => withLoading("flash", async () => {
    const fin = statsOverview?.portfolio_financials ?? {};
    const total = statsOverview?.total_projects ?? "N/A";
    const originalCostCr = fin.total_original_cost_cr;
    const revisedCostCr = fin.total_revised_cost_cr;
    const expenditureCr = fin.total_cumulative_expenditure_cr;
    const delayedCount = statsOverview?.delayed_projects ?? "N/A";
    const onTrackCount = statsOverview?.on_track_projects ?? "N/A";

    const fmtCr = (v) => v != null ? `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr` : "N/A";
    const burnPct = (revisedCostCr && expenditureCr) ? `${((expenditureCr / revisedCostCr) * 100).toFixed(2)}% financial disbursement realized` : "N/A";
    const costEscPct = (originalCostCr && revisedCostCr) ? `+${(((revisedCostCr - originalCostCr) / originalCostCr) * 100).toFixed(2)}% net portfolio cost overrun` : "N/A";
    const delayedPct = (typeof delayedCount === "number" && typeof total === "number") ? `${((delayedCount / total) * 100).toFixed(2)}% of total portfolio behind schedule` : "N/A";

    const summaryHeader = [
      { label: "Metric Parameter", key: "param" },
      { label: "Portfolio Value", key: "val" },
      { label: "Official Audit Remarks", key: "remarks" }
    ];
    const summaryRows = [
      { param: "Total Monitored Infrastructure Projects", val: `${total} Projects`, remarks: "Projects with sanctioned cost ≥ ₹150 Cr." },
      { param: "Total Sanctioned Original Cost", val: fmtCr(originalCostCr), remarks: "Cumulative cabinet sanction baseline" },
      { param: "Total Revised Cost Estimate", val: fmtCr(revisedCostCr), remarks: costEscPct },
      { param: "Total Cumulative Expenditure", val: fmtCr(expenditureCr), remarks: burnPct },
      { param: "Projects Reporting Schedule Delay", val: `${delayedCount} Projects`, remarks: delayedPct },
      { param: "Projects On-Track", val: `${onTrackCount} Projects`, remarks: "Within original schedule parameters" },
      { param: "Audit Assessment Period", val: "July 2025 – March 2026 (9 Months)", remarks: "MoSPI Central Infrastructure Division (IPMD)" }
    ];
    const csvContent = generateCSV(summaryHeader, summaryRows);
    triggerDownload("MoSPI_Monthly_Flash_Report_April_2026_Executive_Summary.csv", csvContent);
    showNotification("Downloaded MoSPI Monthly Flash Report (April 2026)!");
  });

  // 3. Download Ingestion Sync Report
  const handleDownloadIngestionReport = () => {
    const headers = [
      { label: "Ministry Name", key: "ministry" },
      { label: "Monitored Projects", key: "projects" },
      { label: "Records Validated", key: "records" },
      { label: "Ingestion Pipeline Status", key: "status" },
      { label: "Last Synchronization", key: "lastSync" },
      { label: "Pipeline Latency (s)", key: "latency" }
    ];
    const rows = [
      { ministry: "Ministry of Road Transport & Highways", projects: 312, records: 312, status: "Validated & Synced", lastSync: "28 Apr 2026", latency: "1.2s" },
      { ministry: "Ministry of Railways", projects: 405, records: 405, status: "Validated & Synced", lastSync: "29 Apr 2026", latency: "2.1s" },
      { ministry: "Ministry of Petroleum & Natural Gas", projects: 218, records: 218, status: "Validated & Synced", lastSync: "30 Apr 2026", latency: "0.9s" },
      { ministry: "Ministry of Power & Renewable Energy", projects: 366, records: 366, status: "Validated & Synced", lastSync: "30 Apr 2026", latency: "1.4s" },
      { ministry: "Ministry of Coal", projects: 165, records: 165, status: "Validated & Synced", lastSync: "29 Apr 2026", latency: "0.8s" },
      { ministry: "Ministry of Jal Shakti", projects: 280, records: 268, status: "Validation Warning", lastSync: "Today", latency: "1.8s" },
      { ministry: "Ministry of Civil Aviation", projects: 94, records: 94, status: "Validated & Synced", lastSync: "30 Apr 2026", latency: "0.7s" },
      { ministry: "Ministry of Ports, Shipping & Waterways", projects: 88, records: 88, status: "Validated & Synced", lastSync: "28 Apr 2026", latency: "0.6s" }
    ];
    const csvContent = generateCSV(headers, rows);
    triggerDownload("MoSPI_17_Ministry_Ingestion_Sync_Report_2026.csv", csvContent);
    showNotification("Downloaded 17-Ministry Ingestion Sync Report!");
  };

  // 4. Download Security Audit Trail
  const handleDownloadSecurityAudit = () => {
    const headers = [
      { label: "Audit Log ID", key: "id" },
      { label: "Timestamp (IST)", key: "time" },
      { label: "System Action", key: "action" },
      { label: "Target Resource", key: "target" },
      { label: "Authenticated Actor", key: "actor" },
      { label: "Integrity Hash (SHA-256)", key: "hash" },
      { label: "Compliance Status", key: "status" }
    ];
    const rows = [
      { id: "LOG-9821", time: "2026-04-30 10:14:22", action: "User Role Elevated to Analyst", target: "Sunita Rao", actor: "Amit Sharma (Admin)", hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", status: "ISO 27001 Compliant" },
      { id: "LOG-9820", time: "2026-04-30 09:30:00", action: "ML Ensemble Retrained (v3.2)", target: "SANKET-AI-ML-Engine", actor: "System Scheduled Cron", hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4", status: "ISO 27001 Compliant" },
      { id: "LOG-9819", time: "2026-04-30 08:45:12", action: "API Gateway Token Issued", target: "NHAI Project Connect", actor: "Amit Sharma (Admin)", hash: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", status: "ISO 27001 Compliant" },
      { id: "LOG-9818", time: "2026-04-30 06:12:05", action: "Failed Login Challenge (3 attempts)", target: "IP 192.168.1.44", actor: "Security Firewall", hash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce", status: "Firewall Blocked" }
    ];
    const csvContent = generateCSV(headers, rows);
    triggerDownload("SANKET_AI_System_Security_Audit_Trail_ISO27001.csv", csvContent);
    showNotification("Downloaded System & Security Audit Trail!");
  };

  // 5. Download User Directory
  const handleDownloadUserDirectory = () => {
    const headers = [
      { label: "User ID", key: "id" },
      { label: "Officer Name", key: "name" },
      { label: "Gov.in Email Address", key: "email" },
      { label: "Assigned System Role", key: "role" },
      { label: "Department / Ministry", key: "department" },
      { label: "Account Status", key: "status" },
      { label: "Last Activity Session", key: "lastActive" }
    ];
    const rows = [
      { id: 1, name: "Rajesh Kumar", email: "officer@infrawatch.gov.in", role: "Government Officer", department: "Ministry of Road Transport", status: "Active", lastActive: "Just now" },
      { id: 2, name: "Amit Sharma", email: "admin@infrawatch.gov.in", role: "Project Administrator", department: "Infrastructure Division (MoSPI)", status: "Active", lastActive: "5 mins ago" },
      { id: 3, name: "Priya Patel", email: "analyst@infrawatch.gov.in", role: "Analyst", department: "Risk & Analytics Cell", status: "Active", lastActive: "12 mins ago" },
      { id: 4, name: "Vikram Malhotra", email: "vikram.m@nhai.gov.in", role: "Government Officer", department: "NHAI North Zone", status: "Active", lastActive: "1 hour ago" },
      { id: 5, name: "Sunita Rao", email: "sunita.r@jalshakti.gov.in", role: "Analyst", department: "Jal Shakti Water Board", status: "Pending", lastActive: "Yesterday" },
      { id: 6, name: "Arun Verma", email: "arun.v@railways.gov.in", role: "Government Officer", department: "Ministry of Railways", status: "Active", lastActive: "2 days ago" }
    ];
    const csvContent = generateCSV(headers, rows);
    triggerDownload("SANKET_AI_Master_User_Directory_2026.csv", csvContent);
    showNotification("Downloaded Master User Directory & Permissions!");
  };

  // 6. Download High-Risk Escalation Matrix — live fetch Critical + High on demand
  const handleDownloadHighRiskMatrix = () => withLoading("highrisk", async () => {
    // Fetch Critical and High risk projects via two parallel API calls
    const [criticalResp, highResp] = await Promise.all([
      fetchAllProjectPages({ risk: "Critical" }),
      fetchAllProjectPages({ risk: "High" }),
    ]);
    const highRiskProjects = [...criticalResp, ...highResp];
    const headers = [
      { label: "Project ID", key: "projectId" },
      { label: "Project Name", key: "name" },
      { label: "Ministry", key: "ministry" },
      { label: "Sector", key: "sector" },
      { label: "State", key: "state" },
      { label: "Approved Cost (₹Cr)", key: "originalCostCr" },
      { label: "Revised Cost (₹Cr)", key: "revisedCostCr" },
      { label: "Cost Escalation (%)", key: "costRevisionPct" },
      { label: "Physical Progress (%)", key: "physicalProgress" },
      { label: "Risk Score (0-100)", key: "riskScore" },
      { label: "Risk Classification", key: "riskLevel" },
      { label: "Recommended Action", key: "action" }
    ];
    const rows = highRiskProjects.map(p => ({
      ...p,
      action: (p.costRevisionPct ?? 0) > 20
        ? "Inter-Ministerial Revised Cost Committee (RCE) Review"
        : "Field Ground Verification & Milestone Acceleration"
    }));
    const csvContent = generateCSV(headers, rows);
    triggerDownload("MoSPI_High_Risk_Projects_Escalation_Matrix.csv", csvContent);
    showNotification(`Downloaded High-Risk Escalation Matrix (${highRiskProjects.length} Projects)!`);
  });

  const getRoleReports = () => {
    if (user?.role === "Reviewer / Monitoring Officer") {
      return [
        {
          id: 1,
          title: "Nodal Verification & Audit Summary",
          format: "PDF (Official)",
          icon: CheckSquare,
          color: "orange",
          desc: "Complete audit record of approved and rejected CUF monthly submissions for April 2026 cycle.",
          onDownload: handleDownloadIngestionReport
        },
        {
          id: 2,
          title: "CUF Discrepancy & Rejection Log",
          format: "Excel / CSV",
          icon: FileSpreadsheet,
          color: "red",
          desc: "Tabular log of algorithmic progress-vs-expenditure discrepancy flags and reviewer correction remarks.",
          onDownload: handleDownloadHighRiskMatrix
        },
        {
          id: 3,
          title: "New Project Registration Audit",
          format: "PDF / CSV",
          icon: FileText,
          color: "green",
          desc: "Registry of all new project proposals approved and onboarded into the national 2,092 portfolio.",
          onDownload: handleDownloadMasterDataset
        },
      ];
    }

    if (user?.role === "Project Administrator") {
      return [
        {
          id: 1,
          title: "17-Ministry Ingestion Sync Report",
          format: "PDF / CSV",
          icon: BarChart3,
          color: "orange",
          desc: "Monthly CUF data lake ingestion pipeline health, submission latency, and validation error breakdown.",
          onDownload: handleDownloadIngestionReport
        },
        {
          id: 2,
          title: "System & Security Audit Trail",
          format: "Encrypted PDF",
          icon: ShieldCheck,
          color: "green",
          desc: "Immutable system activity log, authentication events, role changes, and ISO 27001 compliance logs.",
          onDownload: handleDownloadSecurityAudit
        },
        {
          id: 3,
          title: "Master User Directory & Permissions",
          format: "CSV",
          icon: FileSpreadsheet,
          color: "red",
          desc: "Export active government officers, reviewers, and agency credentials across all 17 Central Ministries.",
          onDownload: handleDownloadUserDirectory
        },
      ];
    }

    // Default: Government Officer
    return [
      {
        id: 1,
        title: "MoSPI Monthly Flash Report (MPR)",
        format: "PDF (Govt Standard)",
        icon: FileText,
        color: "orange",
        desc: "Official monthly infrastructure monitoring report for ₹150 Cr+ Central Sector Projects covering 2,092 projects.",
        onDownload: handleDownloadFlashReport
      },
      {
        id: 2,
        title: "High-Risk Projects Escalation Matrix",
        format: "PDF / CSV",
        icon: File,
        color: "red",
        desc: "Ranked list of high-risk projects with projected cost overruns and recommended inter-ministerial interventions.",
        onDownload: handleDownloadHighRiskMatrix
      },
      {
        id: 3,
        title: "National Infrastructure Dataset Export",
        format: "CSV / Excel",
        icon: FileSpreadsheet,
        color: "green",
        desc: "Raw export of all 2,092 project parameters including original/revised costs, cumulative expenditures, and timelines.",
        onDownload: handleDownloadMasterDataset
      },
    ];
  };

  const reports = getRoleReports();

  return (
    <Layout
      user={user}
      title={
        user?.role === "Reviewer / Monitoring Officer"
          ? "Reviewer Audit Logs & Report Centre"
          : user?.role === "Project Administrator"
          ? "System Compliance & Ingestion Reports"
          : "Reports & Publications Centre"
      }
      subtitle={
        user?.role === "Reviewer / Monitoring Officer"
          ? "Export verification logs, discrepancy records, and monthly clearance certificates."
          : user?.role === "Project Administrator"
          ? "Export ministry batch ingestion logs, server cluster metrics, and security audit reports."
          : "Generate official MoSPI Monthly Flash Reports, portfolio cost overrun audits, and raw dataset exports."
      }
    >
      <div className="space-y-6">
        {/* Floating Download Success Notification Toast */}
        {downloadNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] dark:bg-[#031e2d] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#44403C] dark:border-[#429EBD]/40 animate-slide-up">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-xs font-bold">{downloadNotification}</p>
              <p className="text-[10px] text-[#A8A29E] dark:text-slate-400">File saved to your local browser downloads.</p>
            </div>
          </div>
        )}

        {/* Top Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        {/* Recent Generated Archive */}
        <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/20 p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1C1917] dark:text-white text-sm">Recently Generated Publications</h3>
              <p className="text-xs text-[#78716C] dark:text-slate-300 mt-0.5">Archived official reports available for instant download.</p>
            </div>
            <span className="text-xs bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-[#FDDFCC] dark:border-[#429EBD]/30 font-bold px-2.5 py-1 rounded-lg">
              April 2026 Cycle
            </span>
          </div>

          <div className="divide-y divide-[#F5F5F4] dark:divide-slate-700/50 text-xs">
            {/* Publication 1 */}
            <div className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-transparent dark:border-[#429EBD]/30 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  CSV
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1C1917] dark:text-white truncate">MoSPI_Monthly_Flash_Report_April_2026_Executive_Summary.csv</p>
                  <p className="text-[#A8A29E] dark:text-slate-400 text-[11px]">2,092 Projects Covered · Executive Portfolio Audit · Published Today</p>
                </div>
              </div>
              <button
                onClick={handleDownloadFlashReport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-[#F5F5F4] dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 font-semibold text-[#1C1917] dark:text-white cursor-pointer transition-all shadow-2xs flex-shrink-0"
              >
                <ArrowDownToLine size={13} className="text-[#F27F0C] dark:text-[#9FE7F5]" /> Download
              </button>
            </div>

            {/* Publication 2 */}
            <div className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/40 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  CSV
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1C1917] dark:text-white truncate">SANKET_AI_Central_Infrastructure_Master_Dataset_2092_Projects.csv</p>
                  <p className="text-[#A8A29E] dark:text-slate-400 text-[11px]">17 Ministries Complete Master Dataset · 2,092 Projects · Updated 2 days ago</p>
                </div>
              </div>
              <button
                onClick={handleDownloadMasterDataset}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-[#F5F5F4] dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 font-semibold text-[#1C1917] dark:text-white cursor-pointer transition-all shadow-2xs flex-shrink-0"
              >
                <ArrowDownToLine size={13} className="text-emerald-600 dark:text-emerald-400" /> Download
              </button>
            </div>

            {/* Publication 3 */}
            <div className="py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/40 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                  CSV
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1C1917] dark:text-white truncate">MoSPI_High_Risk_Projects_Escalation_Matrix.csv</p>
                  <p className="text-[#A8A29E] dark:text-slate-400 text-[11px]">Critical & High Risk Escalation Projects · Priority Audit · Published Today</p>
                </div>
              </div>
              <button
                onClick={handleDownloadHighRiskMatrix}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF7F4] dark:bg-[#031e2d] hover:bg-[#F5F5F4] dark:hover:bg-white/10 border border-[#E7E5E4] dark:border-[#429EBD]/30 font-semibold text-[#1C1917] dark:text-white cursor-pointer transition-all shadow-2xs flex-shrink-0"
              >
                <ArrowDownToLine size={13} className="text-red-600 dark:text-red-400" /> Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ReportCard({ report }) {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);

  const colors = {
    red: { bg: "bg-red-50 dark:bg-red-950/40", icon: "text-red-600 dark:text-red-400", iconBg: "bg-red-100 dark:bg-red-900/40", btn: "bg-red-600 hover:bg-red-700", badge: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50" },
    orange: { bg: "bg-[#FEF0E7] dark:bg-[#031e2d]", icon: "text-[#F27F0C] dark:text-[#9FE7F5]", iconBg: "bg-[#FDDFCC] dark:bg-[#031e2d]", btn: "bg-[#F27F0C] hover:bg-[#d96e08]", badge: "text-[#F27F0C] dark:text-[#9FE7F5] bg-[#FEF0E7] dark:bg-[#031e2d] border-[#FDDFCC] dark:border-[#429EBD]/30" },
    green: { bg: "bg-green-50 dark:bg-emerald-950/40", icon: "text-green-700 dark:text-emerald-400", iconBg: "bg-green-100 dark:bg-emerald-900/40", btn: "bg-green-700 hover:bg-green-800", badge: "text-green-800 dark:text-emerald-300 bg-green-50 dark:bg-emerald-950/40 border-green-200 dark:border-emerald-900/50" },
  };
  const c = colors[report.color] || colors.orange;
  const Icon = report.icon;

  const handleGenerate = () => {
    setState("loading");
    setProgress(0);
    let curr = 0;
    const interval = setInterval(() => {
      curr += 30;
      if (curr >= 100) {
        clearInterval(interval);
        setProgress(100);
        setState("done");
        setTimeout(() => {
          if (report.onDownload) {
            report.onDownload();
          }
        }, 50);
      } else {
        setProgress(curr);
      }
    }, 100);
  };

  const handleDirectDownload = () => {
    if (report.onDownload) {
      report.onDownload();
    }
  };

  return (
    <div className="bg-white dark:bg-[#053F5C] rounded-2xl border border-[#E7E5E4] dark:border-[#429EBD]/20 p-5 shadow-xs flex flex-col justify-between transition-colors">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.icon} flex items-center justify-center shrink-0 shadow-2xs border border-transparent dark:border-[#429EBD]/30`}>
            <Icon size={20} />
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${c.badge}`}>
            {report.format}
          </span>
        </div>

        <h3 className="font-bold text-[#1C1917] dark:text-white text-sm mb-1.5">{report.title}</h3>
        <p className="text-xs text-[#78716C] dark:text-slate-300 leading-relaxed mb-4">{report.desc}</p>
      </div>

      <div>
        {state === "loading" && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Loader2 size={13} className="animate-spin text-[#F27F0C] dark:text-[#9FE7F5]" /> Compiling database...
              </span>
              <span className="font-mono font-bold text-[#1C1917] dark:text-white">{Math.min(100, Math.round(progress))}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-full overflow-hidden border border-[#E7E5E4] dark:border-[#429EBD]/30">
              <div
                className="h-full bg-[#F27F0C] rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {state === "done" && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" /> Compiled & Downloaded!
            </span>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">Ready</span>
          </div>
        )}

        <button
          onClick={state === "done" ? handleDirectDownload : handleGenerate}
          disabled={state === "loading"}
          className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all duration-150 flex items-center justify-center gap-2 shadow-2xs cursor-pointer ${
            state === "done" ? "bg-[#1C1917] dark:bg-[#031e2d] hover:bg-[#44403C] dark:hover:bg-white/10 border border-transparent dark:border-[#429EBD]/30" : c.btn
          } disabled:opacity-60`}
        >
          {state === "loading" ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Compiling & Exporting...
            </>
          ) : state === "done" ? (
            <>
              <Download size={14} /> Download Again
            </>
          ) : (
            <>
              <Download size={14} /> Generate & Export
            </>
          )}
        </button>
      </div>
    </div>
  );
}
