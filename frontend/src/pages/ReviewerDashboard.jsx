import { useState } from "react";
import {
  CheckSquare, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  ShieldCheck, FileSpreadsheet, Eye, MessageSquare, Clock, Filter,
  FolderPlus, Building2, MapPin, FileCheck2, Send, Download, ArrowDownToLine
} from "lucide-react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";

// Client-side file downloader
function triggerDownload(filename, content, mimeType = "text/plain;charset=utf-8;") {
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

const initialRegistrations = [
  {
    id: "REG-2026-089",
    name: "Vadodara-Mumbai Expressway Phase 3 (South Corridor)",
    ministry: "Ministry of Road Transport & Highways",
    sector: "Road Transport & Highways",
    agency: "National Highways Authority of India (NHAI)",
    state: "Gujarat / Maharashtra",
    approvedCost: 4850,
    startDate: "May 2026",
    targetCompletion: "Dec 2029",
    landAcquired: 64,
    submittedBy: "Dr. Rajesh Kumar (Project Officer)",
    submissionDate: "Today, 09:15 AM",
    dprDoc: "DPR-NHAI-VM3-Final.pdf",
    description: "Construction of 8-lane access-controlled greenfield expressway connecting South Gujarat to MMR border with 4 major river bridges and automated tolling."
  },
  {
    id: "REG-2026-090",
    name: "Brahmaputra River Multi-Modal Logistics Hub",
    ministry: "Ministry of Ports, Shipping and Waterways",
    sector: "Ports & Shipping",
    agency: "Inland Waterways Authority of India (IWAI)",
    state: "Assam",
    approvedCost: 1420,
    startDate: "June 2026",
    targetCompletion: "Nov 2028",
    landAcquired: 78,
    submittedBy: "Sanjay Barua (IWAI Lead)",
    submissionDate: "Yesterday, 03:40 PM",
    dprDoc: "IWAI-Brahmaputra-Hub-v2.pdf",
    description: "Integrated riverine cargo terminal with rail sidings, container freight station, and highway connectivity at Pandu Port."
  },
  {
    id: "REG-2026-091",
    name: "AIIMS Sambalpur 750-Bed Super Specialty Hospital",
    ministry: "Ministry of Health and Family Welfare",
    sector: "Social & Health Infrastructure",
    agency: "Central Public Works Department (CPWD)",
    state: "Odisha",
    approvedCost: 1180,
    startDate: "July 2026",
    targetCompletion: "March 2029",
    landAcquired: 92,
    submittedBy: "M. K. Tripathy (CPWD)",
    submissionDate: "2 days ago",
    dprDoc: "CPWD-AIIMS-SBL-DPR.pdf",
    description: "Tertiary healthcare and medical college infrastructure under PMSSY Phase VII with emergency trauma care and research wings."
  },
];

const initialMonthlyUpdates = [
  {
    id: "SUB-101",
    projectName: "NH-48 Highway Expansion (Gujarat)",
    agency: "NHAI North Corridor",
    ministry: "Ministry of Road Transport & Highways",
    submissionDate: "Today, 10:30 AM",
    submittedBy: "Dr. Rajesh Kumar",
    prevSnapshot: { progress: 40, exp: 1420, revisedCost: 2400, land: 68 },
    currSubmission: { progress: 45, exp: 1650, revisedCost: 2640, land: 72 },
    delayReason: "Utility shifting delay in section 4 + cost revision due to steel and bitumen price index escalation.",
    discrepancyFlag: "Cost revised upwards (+₹240 Cr) · Land clearance hold noted in Section 4."
  },
  {
    id: "SUB-102",
    projectName: "Eastern Dedicated Freight Corridor (Package 3)",
    agency: "Dedicated Freight Corridor Corp (DFCCIL)",
    ministry: "Ministry of Railways",
    submissionDate: "Yesterday, 04:15 PM",
    submittedBy: "Arun Verma",
    prevSnapshot: { progress: 58, exp: 3200, revisedCost: 4800, land: 88 },
    currSubmission: { progress: 62, exp: 3450, revisedCost: 4800, land: 91 },
    delayReason: "On track for revised commissioning milestone Q3 FY26-27.",
    discrepancyFlag: null
  },
  {
    id: "SUB-103",
    projectName: "Khurda Road-Bolangir New Railway Line",
    agency: "East Coast Railway",
    ministry: "Ministry of Railways",
    submissionDate: "2 days ago",
    submittedBy: "P. K. Mohapatra",
    prevSnapshot: { progress: 51, exp: 2890, revisedCost: 3800, land: 70 },
    currSubmission: { progress: 53, exp: 3180, revisedCost: 4150, land: 74 },
    delayReason: "Forest clearance Stage-II awaited for 42 hectares in Daspalla segment.",
    discrepancyFlag: "Expenditure increased by ₹290 Cr while progress moved only 2%. High cost sensitivity."
  },
];

export default function ReviewerDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("registrations"); // 'registrations' | 'monthly_updates'
  const [regQueue, setRegQueue] = useState(initialRegistrations);
  const [updateQueue, setUpdateQueue] = useState(initialMonthlyUpdates);
  const [selectedReg, setSelectedReg] = useState(initialRegistrations[0]);
  const [selectedUpdate, setSelectedUpdate] = useState(initialMonthlyUpdates[0]);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [approvedCount, setApprovedCount] = useState(14);

  // Client-Side DPR Generation & Download
  const handleDownloadDPR = (reg) => {
    const dprSummary = `================================================================================
          GOVERNMENT OF INDIA - MINISTRY OF STATISTICS & PROGRAMME IMPL.
              CENTRAL INFRASTRUCTURE PROJECT MONITORING DIVISION (IPMD)
                 DETAILED PROJECT REPORT (DPR) FEASIBILITY SUMMARY
================================================================================
Generated Date:        ${new Date().toLocaleString("en-IN")}
Registration Reference: ${reg.id}
Project Nomenclature:  ${reg.name}
Administrative Parent: ${reg.ministry}
Sector Division:       ${reg.sector}
Implementing Agency:   ${reg.agency}
Geographical Region:   ${reg.state}

--------------------------------------------------------------------------------
1. FINANCIAL SANCTION & SCOPE
--------------------------------------------------------------------------------
Approved Project Cost: ₹${reg.approvedCost} Crore
Initial Land Status:   ${reg.landAcquired}% Acquired & Certified
Scheduled Start Date:  ${reg.startDate}
Target Commissioning:  ${reg.targetCompletion}

--------------------------------------------------------------------------------
2. EXECUTIVE TECHNICAL BRIEF
--------------------------------------------------------------------------------
${reg.description}

--------------------------------------------------------------------------------
3. STATUTORY STATS & CLEARANCES
--------------------------------------------------------------------------------
- Environmental & Forest Clearance: Approved Stage-1
- Nodal NHA / State Land Handover: In Progress (${reg.landAcquired}% Ready)
- DPR Certification Authority: Central Implementing Directorate
- Verification Submission: ${reg.submissionDate} by ${reg.submittedBy}

================================================================================
                    END OF OFFICIAL DPR SUMMARY DOCUMENT
================================================================================`;

    triggerDownload(`${reg.id}_DPR_Feasibility_Report.txt`, dprSummary);
    setToastType("success");
    setToastMsg(`Downloaded Official Feasibility Report for ${reg.id}!`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Registration Actions
  const handleApproveRegistration = (id) => {
    setRegQueue(prev => prev.filter(r => r.id !== id));
    setApprovedCount(prev => prev + 1);
    setToastType("success");
    setToastMsg(`Project Registration ${id} Approved! Assigned SANKET Master ID: PRJ-${Math.floor(1000 + Math.random() * 9000)}`);
    setReviewRemarks("");
    if (regQueue.length > 1) {
      setSelectedReg(regQueue.find(r => r.id !== id));
    } else {
      setSelectedReg(null);
    }
    setTimeout(() => setToastMsg(""), 4500);
  };

  const handleRejectRegistration = (id) => {
    setRegQueue(prev => prev.filter(r => r.id !== id));
    setToastType("warning");
    setToastMsg(`Project Proposal ${id} returned to Implementing Agency for clarification.`);
    setReviewRemarks("");
    if (regQueue.length > 1) {
      setSelectedReg(regQueue.find(r => r.id !== id));
    } else {
      setSelectedReg(null);
    }
    setTimeout(() => setToastMsg(""), 4500);
  };

  // Monthly Updates Actions
  const handleApproveUpdate = (id) => {
    setUpdateQueue(prev => prev.filter(q => q.id !== id));
    setApprovedCount(prev => prev + 1);
    setToastType("success");
    setToastMsg(`CUF Monthly Submission ${id} Verified & Ingested into SANKET-AI Data Lake!`);
    setReviewRemarks("");
    if (updateQueue.length > 1) {
      setSelectedUpdate(updateQueue.find(q => q.id !== id));
    } else {
      setSelectedUpdate(null);
    }
    setTimeout(() => setToastMsg(""), 4500);
  };

  const handleRejectUpdate = (id) => {
    setUpdateQueue(prev => prev.filter(q => q.id !== id));
    setToastType("warning");
    setToastMsg(`Submission ${id} returned to Agency Officer for discrepancy reconciliation.`);
    setReviewRemarks("");
    if (updateQueue.length > 1) {
      setSelectedUpdate(updateQueue.find(q => q.id !== id));
    } else {
      setSelectedUpdate(null);
    }
    setTimeout(() => setToastMsg(""), 4500);
  };

  return (
    <Layout
      user={user}
      title="Reviewer & Monitoring Authority Centre"
      subtitle="Verify new project registrations, audit monthly CUF progress submissions, check discrepancy diffs, and approve snapshots into SANKET-AI."
      showDateRange={false}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`mb-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs ${
          toastType === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
            : "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
        }`}>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className={toastType === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"} />
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg("")} className="text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer font-bold px-1">✕</button>
        </div>
      )}

      {/* Top Reviewer KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          {
            title: "Pending Registrations",
            value: String(regQueue.length),
            subtitle: "New project proposals",
            icon: FolderPlus,
            accentColor: "orange",
            change: regQueue.length > 0 ? "Requires review" : "All cleared",
            changeType: regQueue.length > 0 ? "neutral" : "up"
          },
          {
            title: "Pending Monthly Updates",
            value: String(updateQueue.length),
            subtitle: "CUF Submissions to verify",
            icon: Clock,
            accentColor: "orange",
            change: "April 2026 Cycle",
            changeType: "neutral"
          },
          {
            title: "Approved This Month",
            value: String(approvedCount),
            subtitle: "Ingested into SANKET-AI Data Lake",
            icon: CheckCircle2,
            accentColor: "green",
            change: "+16 this week",
            changeType: "up"
          },
          {
            title: "High Risk Escalations",
            value: "5",
            subtitle: "Escalated to MoSPI Authority",
            icon: AlertTriangle,
            accentColor: "red",
            change: "Critical notice issued",
            changeType: "up"
          },
        ].map((k, i) => (
          <StatCard key={i} {...k}>
            <div className="mt-3">
              <ProgressBar
                value={i === 0 ? Math.min(100, regQueue.length * 33) : i === 1 ? Math.min(100, updateQueue.length * 33) : i === 2 ? 85 : 25}
                color={i === 0 || i === 1 ? "warning" : i === 3 ? "danger" : "success"}
                height="h-1"
                animate
              />
              <p className="text-xs text-[#A8A29E] dark:text-slate-400 mt-1.5 font-medium">
                {i === 0 ? `${regQueue.length} New proposals` : i === 1 ? "April 2026 Cycle" : i === 2 ? "Sync verified" : "Escalated to Central MoSPI"}
              </p>
            </div>
          </StatCard>
        ))}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 mb-5 p-1.5 bg-[#F5F5F4] dark:bg-[#031e2d] rounded-2xl w-fit border border-[#E7E5E4] dark:border-[#429EBD]/30">
        <button
          onClick={() => setActiveTab("registrations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "registrations"
              ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30"
              : "text-[#78716C] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white"
          }`}
        >
          <FolderPlus size={14} className={activeTab === "registrations" ? "text-[#F27F0C] dark:text-[#9FE7F5]" : ""} />
          Pending Project-Registration Requests ({regQueue.length})
        </button>
        <button
          onClick={() => setActiveTab("monthly_updates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "monthly_updates"
              ? "bg-white dark:bg-[#053F5C] text-[#1C1917] dark:text-white shadow-xs border border-[#E7E5E4] dark:border-[#429EBD]/30"
              : "text-[#78716C] dark:text-slate-300 hover:text-[#1C1917] dark:hover:text-white"
          }`}
        >
          <FileSpreadsheet size={14} className={activeTab === "monthly_updates" ? "text-[#F27F0C] dark:text-[#9FE7F5]" : ""} />
          Pending Monthly CUF Updates ({updateQueue.length})
        </button>
      </div>

      {activeTab === "registrations" ? (
        /* TAB 1: PENDING PROJECT-REGISTRATION REQUESTS */
        selectedReg ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-5 bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#1C1917] dark:text-white text-sm">New Registration Requests</h3>
                  <p className="text-xs text-[#78716C] dark:text-slate-300 mt-0.5">{regQueue.length} Proposals waiting for master portfolio registration.</p>
                </div>
                <span className="text-xs bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-[#FDDFCC] dark:border-[#429EBD]/30 font-bold px-2.5 py-1 rounded-lg">
                  New Proposals
                </span>
              </div>

              <div className="space-y-3">
                {regQueue.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedReg(reg)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedReg.id === reg.id
                        ? "bg-[#FEF0E7]/60 dark:bg-[#031e2d] border-[#F27F0C] dark:border-[#9FE7F5] shadow-xs"
                        : "bg-[#FAF7F4]/60 dark:bg-[#031e2d]/50 border-[#E7E5E4] dark:border-[#429EBD]/20 hover:bg-[#FAF7F4] dark:hover:bg-[#031e2d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#F27F0C] dark:text-[#9FE7F5]">{reg.id}</span>
                      <span className="text-[10px] text-[#A8A29E] dark:text-slate-400">{reg.submissionDate}</span>
                    </div>
                    <p className="font-bold text-xs text-[#1C1917] dark:text-white line-clamp-1">{reg.name}</p>
                    <p className="text-[11px] text-[#78716C] dark:text-slate-300 mt-0.5">{reg.agency}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#44403C] dark:text-slate-200">
                      <span>Approved Cost: ₹{reg.approvedCost} Cr</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{reg.landAcquired}% Land Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Detail View & Approval */}
            <div className="lg:col-span-7 bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="flex items-start justify-between pb-3 mb-4 border-b border-[#F5F5F4] dark:border-[#429EBD]/20">
                <div>
                  <span className="text-xs font-mono font-bold text-[#F27F0C] dark:text-[#9FE7F5]">{selectedReg.id}</span>
                  <h3 className="font-black text-[#1C1917] dark:text-white text-base mt-0.5">{selectedReg.name}</h3>
                  <p className="text-xs text-[#78716C] dark:text-slate-300">{selectedReg.ministry} · Submitted by: <strong>{selectedReg.submittedBy}</strong></p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-[#031e2d] text-blue-800 dark:text-[#9FE7F5] border border-blue-200 dark:border-[#429EBD]/30">
                  New Registration
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
                <div className="p-3 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <p className="text-[#78716C] dark:text-slate-400">Approved Cost</p>
                  <p className="text-base font-black text-[#1C1917] dark:text-white mt-0.5">₹{selectedReg.approvedCost} Cr</p>
                </div>
                <div className="p-3 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <p className="text-[#78716C] dark:text-slate-400">Target Timeline</p>
                  <p className="text-xs font-bold text-[#1C1917] dark:text-white mt-1">{selectedReg.targetCompletion}</p>
                </div>
                <div className="p-3 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <p className="text-[#78716C] dark:text-slate-400">Initial Land Handover</p>
                  <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedReg.landAcquired}%</p>
                </div>
                <div className="p-3 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <p className="text-[#78716C] dark:text-slate-400">State / Region</p>
                  <p className="text-xs font-bold text-[#1C1917] dark:text-white mt-1 truncate">{selectedReg.state}</p>
                </div>
              </div>

              <div className="mb-4 p-3.5 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20 text-xs">
                <p className="font-bold text-[#1C1917] dark:text-white mb-1">Project Scope & DPR Summary:</p>
                <p className="text-[#44403C] dark:text-slate-200 leading-relaxed">{selectedReg.description}</p>
                <div className="mt-2 pt-2 border-t border-[#E7E5E4] dark:border-[#429EBD]/20 flex items-center justify-between">
                  <span className="text-[11px] text-[#78716C] dark:text-slate-300">Attached Feasibility Report: <strong>{selectedReg.dprDoc}</strong></span>
                  <button
                    onClick={() => handleDownloadDPR(selectedReg)}
                    className="text-[11px] text-[#F27F0C] dark:text-[#9FE7F5] hover:underline font-bold cursor-pointer flex items-center gap-1"
                  >
                    <ArrowDownToLine size={12} /> Download DPR Summary →
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#44403C] dark:text-slate-200">
                  Reviewer Registration Remarks:
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Enter remarks for registration approval or required clarifications..."
                  className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C] resize-none"
                />

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => handleRejectRegistration(selectedReg.id)}
                    className="flex-1 py-2.5 bg-white dark:bg-[#031e2d] border border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <XCircle size={14} /> Send Back for Clarification
                  </button>
                  <button
                    onClick={() => handleApproveRegistration(selectedReg.id)}
                    className="flex-1 py-2.5 bg-[#1C1917] dark:bg-[#F27F0C] hover:bg-[#44403C] dark:hover:bg-[#d96e08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Approve Registration & Assign SANKET ID
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#053F5C] rounded-3xl p-12 text-center border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm flex flex-col items-center justify-center transition-colors">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-bold text-[#1C1917] dark:text-white text-base">All Project Registrations Verified!</h3>
            <p className="text-xs text-[#78716C] dark:text-slate-300 mt-1 max-w-sm">
              All submitted new project proposals have been processed and added to the Central SANKET-AI master repository.
            </p>
          </div>
        )
      ) : (
        /* TAB 2: PENDING MONTHLY CUF UPDATES */
        selectedUpdate ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-5 bg-white dark:bg-[#053F5C] rounded-2xl p-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#1C1917] dark:text-white text-sm">Monthly Submissions Queue</h3>
                  <p className="text-xs text-[#78716C] dark:text-slate-300 mt-0.5">{updateQueue.length} CUF submissions awaiting audit.</p>
                </div>
                <span className="text-xs bg-[#FEF0E7] dark:bg-[#031e2d] text-[#F27F0C] dark:text-[#9FE7F5] border border-[#FDDFCC] dark:border-[#429EBD]/30 font-bold px-2.5 py-1 rounded-lg">
                  Cycle: Apr 2026
                </span>
              </div>

              <div className="space-y-3">
                {updateQueue.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedUpdate(sub)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedUpdate.id === sub.id
                        ? "bg-[#FEF0E7]/60 dark:bg-[#031e2d] border-[#F27F0C] dark:border-[#9FE7F5] shadow-xs"
                        : "bg-[#FAF7F4]/60 dark:bg-[#031e2d]/50 border-[#E7E5E4] dark:border-[#429EBD]/20 hover:bg-[#FAF7F4] dark:hover:bg-[#031e2d]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#F27F0C] dark:text-[#9FE7F5]">{sub.id}</span>
                      <span className="text-[10px] text-[#A8A29E] dark:text-slate-400">{sub.submissionDate}</span>
                    </div>
                    <p className="font-bold text-xs text-[#1C1917] dark:text-white line-clamp-1">{sub.projectName}</p>
                    <p className="text-[11px] text-[#78716C] dark:text-slate-300 mt-0.5">{sub.agency}</p>
                    {sub.discrepancyFlag && (
                      <div className="mt-2 text-[10px] bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/50 p-1.5 rounded-lg flex items-center gap-1 font-semibold">
                        <AlertTriangle size={11} className="flex-shrink-0" />
                        <span className="truncate">{sub.discrepancyFlag}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Update Detail View & Side-by-side Diff */}
            <div className="lg:col-span-7 bg-white dark:bg-[#053F5C] rounded-2xl p-6 border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm transition-colors">
              <div className="flex items-start justify-between pb-3 mb-4 border-b border-[#F5F5F4] dark:border-[#429EBD]/20">
                <div>
                  <span className="text-xs font-mono font-bold text-[#F27F0C] dark:text-[#9FE7F5]">{selectedUpdate.id}</span>
                  <h3 className="font-bold text-[#1C1917] dark:text-white text-base mt-0.5">{selectedUpdate.projectName}</h3>
                  <p className="text-xs text-[#78716C] dark:text-slate-300">{selectedUpdate.ministry} · Officer: <strong>{selectedUpdate.submittedBy}</strong></p>
                </div>
              </div>

              {/* Discrepancy Callout */}
              {selectedUpdate.discrepancyFlag && (
                <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200 rounded-xl text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-bold">Algorithmic Discrepancy Flag:</p>
                    <p className="text-[11px] mt-0.5">{selectedUpdate.discrepancyFlag}</p>
                  </div>
                </div>
              )}

              {/* Side-by-side Comparison Table */}
              <div className="mb-5 border border-[#E7E5E4] dark:border-[#429EBD]/20 rounded-2xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-[#FAF7F4] dark:bg-[#031e2d] p-3 font-semibold text-[#78716C] dark:text-slate-300 border-b border-[#E7E5E4] dark:border-[#429EBD]/20">
                  <span>Parameter</span>
                  <span>Previous Snapshot (Mar 26)</span>
                  <span className="text-[#F27F0C] dark:text-[#9FE7F5]">Current Submission (Apr 26)</span>
                </div>
                <div className="divide-y divide-[#F5F5F4] dark:divide-slate-700/50 p-1">
                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold text-[#44403C] dark:text-slate-300">Physical Progress</span>
                    <span className="font-mono text-[#1C1917] dark:text-slate-200">{selectedUpdate.prevSnapshot.progress}%</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedUpdate.currSubmission.progress}% (+{selectedUpdate.currSubmission.progress - selectedUpdate.prevSnapshot.progress}%)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold text-[#44403C] dark:text-slate-300">Cumulative Expenditure</span>
                    <span className="font-mono text-[#1C1917] dark:text-slate-200">₹{selectedUpdate.prevSnapshot.exp} Cr</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      ₹{selectedUpdate.currSubmission.exp} Cr (+₹{selectedUpdate.currSubmission.exp - selectedUpdate.prevSnapshot.exp} Cr)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold text-[#44403C] dark:text-slate-300">Approved / Revised Cost</span>
                    <span className="font-mono text-[#1C1917] dark:text-slate-200">₹{selectedUpdate.prevSnapshot.revisedCost} Cr</span>
                    <span className={`font-mono font-bold ${selectedUpdate.currSubmission.revisedCost > selectedUpdate.prevSnapshot.revisedCost ? "text-red-600 dark:text-red-400" : "text-[#1C1917] dark:text-white"}`}>
                      ₹{selectedUpdate.currSubmission.revisedCost} Cr
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold text-[#44403C] dark:text-slate-300">Land Handover</span>
                    <span className="font-mono text-[#1C1917] dark:text-slate-200">{selectedUpdate.prevSnapshot.land}%</span>
                    <span className="font-mono font-bold text-[#1C1917] dark:text-white">{selectedUpdate.currSubmission.land}%</span>
                  </div>
                </div>
              </div>

              {/* Delay explanation */}
              <div className="mb-5 p-3.5 bg-[#FAF7F4] dark:bg-[#031e2d] rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/20 text-xs">
                <p className="font-bold text-[#1C1917] dark:text-white mb-1">Agency Delay Justification:</p>
                <p className="text-[#44403C] dark:text-slate-300 italic leading-relaxed">"{selectedUpdate.delayReason}"</p>
              </div>

              {/* Reviewer Action Area */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-[#44403C] dark:text-slate-200">
                  Reviewer Verification Remarks / Correction Notes:
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  placeholder="Enter remarks for approval or required remediation..."
                  className="w-full p-2.5 rounded-xl border border-[#E7E5E4] dark:border-[#429EBD]/30 bg-[#FAF7F4] dark:bg-[#031e2d] text-xs text-[#1C1917] dark:text-white outline-none focus:border-[#F27F0C] resize-none"
                />

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => handleRejectUpdate(selectedUpdate.id)}
                    className="flex-1 py-2.5 bg-white dark:bg-[#031e2d] border border-red-300 dark:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <XCircle size={14} /> Send Back for Correction
                  </button>
                  <button
                    onClick={() => handleApproveUpdate(selectedUpdate.id)}
                    className="flex-1 py-2.5 bg-[#1C1917] dark:bg-[#F27F0C] hover:bg-[#44403C] dark:hover:bg-[#d96e08] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Approve & Ingest into AI Engine
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#053F5C] rounded-3xl p-12 text-center border border-[#E7E5E4] dark:border-[#429EBD]/20 shadow-sm flex flex-col items-center justify-center transition-colors">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="font-bold text-[#1C1917] dark:text-white text-base">All Monthly Submissions Audited!</h3>
            <p className="text-xs text-[#78716C] dark:text-slate-300 mt-1 max-w-sm">
              All monthly CUF data has been audited and ingested into the SANKET-AI predictive AI pipeline.
            </p>
          </div>
        )
      )}
    </Layout>
  );
}
