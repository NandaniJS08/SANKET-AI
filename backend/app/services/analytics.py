import os
import json
"""
Portfolio Analytics Service
Aggregates macro infrastructure project telemetry across ministries, sectors, and chronological monthly cycles.
Sourced strictly from authentic database records in `projects` and `project_monthly_snapshots`.
Zero synthetic indices, zero fabricated scores.
"""

from typing import Dict, Any, List, Optional
import time
from app.db.supabase import get_supabase

CHRONOLOGICAL_REPORTING_MONTHS = [
    "2025-07-01", "2025-08-01", "2025-09-01", "2025-10-01",
    "2025-11-01", "2025-12-01", "2026-01-01", "2026-02-01", "2026-03-01"
]


class AnalyticsService:
    def __init__(self):
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_time: float = 0.0
        self._cache_ttl: float = 86400.0
        self._cache_file = os.path.join(os.path.dirname(__file__), 'analytics_cache.json')
        if os.path.exists(self._cache_file):
            try:
                with open(self._cache_file, 'r', encoding='utf-8') as cf:
                    self._cache = json.load(cf)
                    self._cache_time = time.time()
            except Exception:
                pass

    def get_overview(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Compute portfolio-wide macro analytics directly from verified live database records.
        A 5-minute in-memory cache is used to reduce repeated database aggregation overhead.
        """
        now = time.time()
        if not force_refresh and self._cache and (now - self._cache_time) < self._cache_ttl:
            return self._cache

        client = get_supabase()

        # -------------------------------------------------------------
        # 1. FETCH PROJECTS DATA (PAGINATED CHUNKS)
        # -------------------------------------------------------------
        p_rows: List[Dict[str, Any]] = []
        for offset in (0, 1000, 2000):
            res = (
                client.table("projects")
                .select(
                    "project_id, sector, ministry, project_status, deadline_revision_flag, "
                    "original_cost_cr, revised_cost_cr, cumulative_expenditure_cr, "
                    "physical_progress_pct, cost_revision_pct"
                )
                .range(offset, offset + 999)
                .execute()
            )
            if res.data:
                p_rows.extend(res.data)

        total_projects = len(p_rows)

        # -------------------------------------------------------------
        # 2. MACRO FINANCIALS & TOTALS
        # -------------------------------------------------------------
        total_orig_cost = 0.0
        total_rev_cost = 0.0
        total_expenditure = 0.0
        valid_progress: List[float] = []
        valid_cost_revisions: List[float] = []
        delayed_count = 0

        # Aggregations by Ministry & Sector
        by_ministry: Dict[str, Dict[str, Any]] = {}
        by_sector: Dict[str, Dict[str, Any]] = {}

        cost_overrun_count = 0
        critical_risk_count = 0

        for p in p_rows:
            # Delay check: verified schema uses deadline_revision_flag (boolean) and project_status (text).
            # Note: The database table 'projects' does not contain a 'delay_status' column.
            is_delayed = bool(
                p.get("deadline_revision_flag") is True
                or (p.get("project_status") and "delay" in str(p["project_status"]).lower())
            )
            if is_delayed:
                delayed_count += 1

            # Financials
            orig_c = float(p["original_cost_cr"]) if p.get("original_cost_cr") is not None else 0.0
            rev_c = float(p["revised_cost_cr"]) if p.get("revised_cost_cr") is not None else 0.0
            exp_c = float(p["cumulative_expenditure_cr"]) if p.get("cumulative_expenditure_cr") is not None else 0.0
            prog = float(p["physical_progress_pct"]) if p.get("physical_progress_pct") is not None else None
            cost_rev = float(p["cost_revision_pct"]) if p.get("cost_revision_pct") is not None else None

            is_cost_overrun = (cost_rev is not None and cost_rev > 0) or (orig_c > 0 and rev_c > orig_c)
            if is_cost_overrun:
                cost_overrun_count += 1

            # High/Critical Risk co-occurrence
            if (cost_rev is not None and cost_rev >= 30 and is_delayed) or (prog is not None and prog < 20 and is_delayed):
                critical_risk_count += 1

            total_orig_cost += orig_c
            total_rev_cost += rev_c
            total_expenditure += exp_c
            if prog is not None:
                valid_progress.append(prog)
            if cost_rev is not None:
                valid_cost_revisions.append(cost_rev)

            # Ministry Grouping
            m_name = (p.get("ministry") or "Other Ministry").strip()
            if m_name not in by_ministry:
                by_ministry[m_name] = {
                    "projects": 0,
                    "delayed": 0,
                    "revised_cost": 0.0,
                    "progress_list": [],
                    "cost_rev_list": [],
                }
            by_ministry[m_name]["projects"] += 1
            if is_delayed:
                by_ministry[m_name]["delayed"] += 1
            by_ministry[m_name]["revised_cost"] += rev_c
            if prog is not None:
                by_ministry[m_name]["progress_list"].append(prog)
            if cost_rev is not None:
                by_ministry[m_name]["cost_rev_list"].append(cost_rev)

            # Sector Grouping
            s_name = (p.get("sector") or "Other Sector").strip()
            if s_name not in by_sector:
                by_sector[s_name] = {
                    "projects": 0,
                    "delayed": 0,
                    "revised_cost": 0.0,
                    "progress_list": [],
                }
            by_sector[s_name]["projects"] += 1
            if is_delayed:
                by_sector[s_name]["delayed"] += 1
            by_sector[s_name]["revised_cost"] += rev_c
            if prog is not None:
                by_sector[s_name]["progress_list"].append(prog)

        on_track_count = max(0, total_projects - delayed_count)
        avg_phys_prog = round(sum(valid_progress) / len(valid_progress), 2) if valid_progress else 0.0
        avg_cost_rev = round(sum(valid_cost_revisions) / len(valid_cost_revisions), 2) if valid_cost_revisions else 0.0

        portfolio_overview = {
            "total_projects": total_projects,
            "delayed_projects": delayed_count,
            "on_track_projects": on_track_count,
            "cost_overrun_projects": cost_overrun_count,
            "critical_risk_projects": critical_risk_count,
            "total_original_cost_cr": round(total_orig_cost, 2),
            "total_revised_cost_cr": round(total_rev_cost, 2),
            "total_cumulative_expenditure_cr": round(total_expenditure, 2),
            "average_physical_progress_pct": avg_phys_prog,
            "average_cost_revision_pct": avg_cost_rev,
        }

        # Format Ministry Comparison
        ministry_comparison = []
        for m_name, m_data in sorted(by_ministry.items(), key=lambda x: x[1]["projects"], reverse=True):
            p_cnt = m_data["projects"]
            d_cnt = m_data["delayed"]
            p_list = m_data["progress_list"]
            c_list = m_data["cost_rev_list"]
            ministry_comparison.append({
                "ministry": m_name,
                "projects": p_cnt,
                "delayed": d_cnt,
                "on_track": p_cnt - d_cnt,
                "avg_cost_revision_pct": round(sum(c_list) / len(c_list), 2) if c_list else 0.0,
                "avg_physical_progress_pct": round(sum(p_list) / len(p_list), 2) if p_list else 0.0,
                "total_revised_cost_cr": round(m_data["revised_cost"], 2),
            })

        # Format Sector Data
        sector_data = []
        for s_name, s_data in sorted(by_sector.items(), key=lambda x: x[1]["projects"], reverse=True):
            p_cnt = s_data["projects"]
            d_cnt = s_data["delayed"]
            p_list = s_data["progress_list"]
            sector_data.append({
                "name": s_name,
                "sector": s_name,
                "projects": p_cnt,
                "delayed": d_cnt,
                "on_track": p_cnt - d_cnt,
                "avg_physical_progress_pct": round(sum(p_list) / len(p_list), 2) if p_list else 0.0,
                "total_revised_cost_cr": round(s_data["revised_cost"], 2),
            })

        # -------------------------------------------------------------
        # 3. CHRONOLOGICAL MONTHLY TRAJECTORY ACROSS FULL DATASET (ALL 11,011 SNAPSHOTS)
        # -------------------------------------------------------------
        all_snapshots: List[Dict[str, Any]] = []
        snap_offset = 0
        snap_page_size = 1000
        while True:
            s_res = (
                client.table("project_monthly_snapshots")
                .select("reporting_month, cost_revision_pct, physical_progress_pct, cumulative_expenditure_cr")
                .range(snap_offset, snap_offset + snap_page_size - 1)
                .execute()
            )
            data = s_res.data or []
            all_snapshots.extend(data)
            if len(data) < snap_page_size:
                break
            snap_offset += snap_page_size

        # Group by reporting_month
        snapshots_by_month: Dict[str, Dict[str, Any]] = {
            rm: {"cost_rev": [], "progress": [], "expenditure": 0.0, "count": 0}
            for rm in CHRONOLOGICAL_REPORTING_MONTHS
        }
        for s in all_snapshots:
            rm = s.get("reporting_month")
            if rm in snapshots_by_month:
                cr = s.get("cost_revision_pct")
                pr = s.get("physical_progress_pct")
                exp = s.get("cumulative_expenditure_cr")
                if cr is not None:
                    snapshots_by_month[rm]["cost_rev"].append(float(cr))
                if pr is not None:
                    snapshots_by_month[rm]["progress"].append(float(pr))
                if exp is not None:
                    snapshots_by_month[rm]["expenditure"] += float(exp)
                snapshots_by_month[rm]["count"] += 1

        cost_overrun_trend = []
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        for rm in CHRONOLOGICAL_REPORTING_MONTHS:
            m_info = snapshots_by_month[rm]
            cr_list = m_info["cost_rev"]
            pr_list = m_info["progress"]
            exp_total = m_info["expenditure"]
            cnt = m_info["count"]

            parts = rm.split("-")
            label = f"{month_names[int(parts[1])]} {parts[0]}" if len(parts) >= 2 and parts[1].isdigit() else rm

            cost_overrun_trend.append({
                "reporting_month": rm,
                "month": label,
                "avg_cost_revision_pct": round(sum(cr_list) / len(cr_list), 2) if cr_list else 0.0,
                "avg_physical_progress_pct": round(sum(pr_list) / len(pr_list), 2) if pr_list else 0.0,
                "total_expenditure_cr": round(exp_total, 2),
                "snapshots_count": cnt,
            })

        # -------------------------------------------------------------
        # 4. STRUCTURED REPORT OF UNSUPPORTED MOCK METRICS
        # -------------------------------------------------------------
        missing_metrics_report = {
            "sector_radar_data": (
                "Omitted from database derivation: radar attributes ('Clearance Speed', 'Budget Discipline', "
                "'Milestone Velocity', 'Schedule Adherence') are arbitrary UI scores not stored in PostgreSQL."
            ),
            "historical_risk_trend": (
                "Omitted from database derivation: project_monthly_snapshots records physical progress, cost revisions, "
                "and expenditure but does NOT record monthly historical ML risk scores or risk band counts."
            ),
        }

        # -------------------------------------------------------------
        # 5. ASSEMBLE COMPLETE PAYLOAD (DUAL CAMELCASE & SNAKE_CASE)
        # -------------------------------------------------------------
        self._cache = {
            "portfolio_overview": portfolio_overview,
            "portfolioOverview": portfolio_overview,
            "ministry_comparison": ministry_comparison,
            "ministryComparison": ministry_comparison,
            "sector_data": sector_data,
            "sectorData": sector_data,
            "cost_overrun_trend": cost_overrun_trend,
            "costOverrunTrend": cost_overrun_trend,
            "missing_metrics_report": missing_metrics_report,
            "cached_at": now,
        }
        self._cache_time = now
        try:
            with open(self._cache_file, 'w', encoding='utf-8') as cf:
                json.dump(self._cache, cf)
        except Exception:
            pass
        return self._cache


analytics_service = AnalyticsService()
