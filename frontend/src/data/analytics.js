export const ministryComparisonData = [
  { ministry: "Civil Aviation", avgRisk: 62, projects: 145, delayed: 48 },
  { ministry: "Road Transport & Highways", avgRisk: 58, projects: 640, delayed: 182 },
  { ministry: "Railways", avgRisk: 54, projects: 420, delayed: 110 },
  { ministry: "Petroleum & Natural Gas", avgRisk: 46, projects: 290, delayed: 58 },
  { ministry: "Power & New Energy", avgRisk: 42, projects: 215, delayed: 42 },
  { ministry: "Water Resources & Jal Shakti", avgRisk: 49, projects: 180, delayed: 46 },
  { ministry: "Housing & Urban Affairs", avgRisk: 51, projects: 120, delayed: 34 },
  { ministry: "Ports & Shipping", avgRisk: 38, projects: 82, delayed: 16 }
];

export const sectorRadarData = [
  { subject: "Risk Level", Transport: 62, Energy: 42, Petroleum: 46, Water: 49, Aviation: 60 },
  { subject: "Schedule Adherence", Transport: 54, Energy: 72, Petroleum: 68, Water: 58, Aviation: 52 },
  { subject: "Budget Discipline", Transport: 56, Energy: 78, Petroleum: 74, Water: 62, Aviation: 58 },
  { subject: "Milestone Velocity", Transport: 50, Energy: 69, Petroleum: 65, Water: 55, Aviation: 49 },
  { subject: "Clearance Speed", Transport: 48, Energy: 64, Petroleum: 62, Water: 52, Aviation: 65 },
];

export const costOverrunTrendData = [
  { month: "Jul 25", overrun: 14.2 },
  { month: "Aug 25", overrun: 14.8 },
  { month: "Sep 25", overrun: 15.6 },
  { month: "Oct 25", overrun: 16.1 },
  { month: "Nov 25", overrun: 16.8 },
  { month: "Dec 25", overrun: 17.5 },
  { month: "Jan 26", overrun: 18.2 },
  { month: "Feb 26", overrun: 18.9 },
  { month: "Mar 26", overrun: 19.5 },
];

export const keyInsights = [
  {
    id: 1,
    icon: "TrendingUp",
    color: "danger",
    title: "Aviation & Highways Lead Cost Escalations",
    detail: "Road Transport & Aviation have a 24% higher probability of budget revision due to RoW and terminal expansion scope increases.",
  },
  {
    id: 2,
    icon: "AlertTriangle",
    color: "warning",
    title: "Q4 Peak Cost Overrun Trajectory",
    detail: "March 2026 recorded an average cumulative cost revision of +19.5% across delayed infrastructure projects.",
  },
  {
    id: 3,
    icon: "CheckCircle",
    color: "success",
    title: "Energy & Petroleum High Efficiency",
    detail: "Power Grid & IOCL projects demonstrate the highest milestone adherence with 78% on-budget performance.",
  },
  {
    id: 4,
    icon: "BarChart2",
    color: "accent",
    title: "Port & Shipping Fastest Clearances",
    detail: "Major Port Trust projects completed regulatory clearances 28 days faster than the cross-sector median.",
  },
];

export const shapFactors = [
  { factor: "Expenditure vs Progress Discrepancy", contribution: 34, direction: "positive" },
  { factor: "3-Month Progress Velocity Stall", contribution: 28, direction: "positive" },
  { factor: "Historical Deadline Push Frequency", contribution: 18, direction: "positive" },
  { factor: "Sector Specific Overrun Weight", contribution: 12, direction: "positive" },
  { factor: "Approval to Ground Execution Lag", contribution: 8, direction: "positive" },
  { factor: "Tier-1 Agency Contractor Efficiency", contribution: -6, direction: "negative" },
];
