import os

import math, time, py_compile, json
from typing import List, Optional, Dict, Any
from app.db.supabase import get_supabase

ALLOWED_SORT_COLUMNS = {
    "project_id", "name", "sector", "state", "ministry", "implementing_agency",
    "original_cost_cr", "revised_cost_cr", "cumulative_expenditure_cr",
    "physical_progress_pct", "financial_progress_pct", "risk_level", "risk_score",
    "project_status", "reporting_month", "approval_date", "start_date",
    "original_completion_date", "revised_completion_date", "created_at"
}

def compute_sanket_risk(p: Dict[str, Any]) -> tuple[float, str]:
    if p.get("risk_score") is not None and p.get("risk_level"):
        return float(p["risk_score"]), str(p["risk_level"])
    orig = float(p.get("original_cost_cr") or 0.0)
    rev = float(p.get("revised_cost_cr") or orig)
    cost_rev = float(p.get("cost_revision_pct") or 0.0)
    cost_overrun = (rev - orig) / orig * 100.0 if (orig > 0 and rev > orig) else cost_rev
    status = str(p.get("project_status") or "").lower()
    is_delayed = bool(p.get("deadline_revision_flag") is True or "delay" in status)
    prog = float(p.get("physical_progress_pct") or 0.0)
    is_stall = is_delayed and prog < 5.0
    cost_pts = 40 if cost_overrun >= 100 else 35 if cost_overrun >= 50 else 30 if cost_overrun >= 25 else 20 if cost_overrun >= 10 else 12 if cost_overrun > 0 else 4
    time_pts = 40 if is_stall else 32 if is_delayed else 8
    prog_pts = 25 if prog < 15 else 20 if prog < 40 else 15 if prog < 70 else 10 if prog < 90 else 2
    score = min(99.0, max(15.0, float(cost_pts + time_pts + prog_pts)))
    level = "Critical" if score >= 80 else "High" if score >= 60 else "Medium" if score >= 40 else "Low"
    return score, level

class ProjectService:
    def __init__(self):
        self._all_projects_cache = None
        self._all_projects_cache_time = 0.0
        self._filters_cache = None
        self._filters_cache_time = 0.0
        self._stats_cache = None
        self._stats_cache_time = 0.0
        self._cache_ttl = 86400.0
        self._projects_cache_file = os.path.join(os.path.dirname(__file__), 'projects_cache.json')
        if os.path.exists(self._projects_cache_file):
            try:
                with open(self._projects_cache_file, 'r', encoding='utf-8') as cf:
                    self._all_projects_cache = json.load(cf)
                    self._all_projects_cache_time = time.time()
            except Exception:
                pass

    def _get_all_projects_cached(self) -> List[Dict[str, Any]]:
        now = time.time()
        if self._all_projects_cache and (now - self._all_projects_cache_time) < self._cache_ttl:
            return self._all_projects_cache
        client = get_supabase()
        rows = []
        for offset in (0, 1000, 2000):
            res = client.table("projects").select("project_id, name, ministry, sector, state, implementing_agency, original_cost_cr, revised_cost_cr, cumulative_expenditure_cr, physical_progress_pct, financial_progress_pct, risk_level, risk_score, cost_revision_pct, deadline_revision_flag, project_status, reporting_month, status_at_month_end, data_quality_flag, approval_date, start_date, original_completion_date, revised_completion_date").range(offset, offset + 999).execute()
            if res.data: rows.extend(res.data)
        for p in rows:
            s, l = compute_sanket_risk(p)
            p["risk_score"] = s
            p["risk_level"] = l
        self._all_projects_cache = rows
        self._all_projects_cache_time = now
        try:
            with open(self._projects_cache_file, 'w', encoding='utf-8') as cf:
                json.dump(rows, cf)
        except Exception:
            pass
        return self._all_projects_cache

    def get_projects(self, page=1, page_size=20, search=None, ministry=None, sector=None, state=None, implementing_agency=None, project_status=None, risk_level=None, reporting_month=None, sort_by="project_id", sort_order="asc") -> Dict[str, Any]:
        filtered = self._get_all_projects_cached()
        if search and search.strip():
            t = search.strip().lower()
            filtered = [p for p in filtered if t in str(p.get("project_id") or "").lower() or t in str(p.get("name") or "").lower()]
        if ministry and ministry.strip() != "All":
            m = ministry.strip().lower()
            filtered = [p for p in filtered if m in str(p.get("ministry") or "").lower()]
        if sector and sector.strip() != "All":
            s = sector.strip().lower()
            filtered = [p for p in filtered if s in str(p.get("sector") or "").lower()]
        if state and state.strip() != "All":
            st = state.strip().lower()
            filtered = [p for p in filtered if st in str(p.get("state") or "").lower()]
        if implementing_agency and implementing_agency.strip() != "All":
            ia = implementing_agency.strip().lower()
            filtered = [p for p in filtered if ia in str(p.get("implementing_agency") or "").lower()]
        if project_status and project_status.strip() != "All":
            ps = project_status.strip().lower()
            filtered = [p for p in filtered if ps in str(p.get("project_status") or "").lower()]
        if risk_level and risk_level.strip() != "All":
            rl = risk_level.strip().replace("Risk", "").strip().lower()
            filtered = [p for p in filtered if rl in str(p.get("risk_level") or "").lower()]
        if reporting_month and reporting_month.strip() != "All":
            rm = reporting_month.strip().lower()
            filtered = [p for p in filtered if rm == str(p.get("reporting_month") or "").lower()]

        is_desc = sort_order.lower() == "desc"
        col = sort_by if sort_by in ALLOWED_SORT_COLUMNS else "project_id"
        def key_fn(p):
            v = p.get(col)
            if v is None: return -999999999.0 if is_desc else 999999999.0
            return v
        try:
            filtered.sort(key=key_fn, reverse=is_desc)
        except Exception:
            filtered.sort(key=lambda p: str(p.get(col) or ""), reverse=is_desc)

        total = len(filtered)
        page = max(1, page)
        page_size = min(max(1, page_size), 1000)
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        start = (page - 1) * page_size
        items = filtered[start:start + page_size]
        return {
            "items": items,
            "projects": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }


    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase()
        p_res = client.table("projects").select("*").eq("project_id", project_id.strip()).limit(1).execute()
        if not p_res.data: return None
        project = dict(p_res.data[0])
        s, l = compute_sanket_risk(project)
        project["risk_score"] = s
        project["risk_level"] = l
        s_res = client.table("project_monthly_snapshots").select("*").eq("project_id", project_id.strip()).order("reporting_month", desc=True).limit(1).execute()
        project["latest_snapshot"] = s_res.data[0] if s_res.data else None
        return project

    def get_project_history(self, project_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase()
        p_res = client.table("projects").select("project_id, name").eq("project_id", project_id.strip()).limit(1).execute()
        if not p_res.data: return None
        meta = p_res.data[0]
        s_res = client.table("project_monthly_snapshots").select("snapshot_id, project_id, reporting_month, source_page, latest_revised_cost_cr, cumulative_expenditure_cr, physical_progress_pct, revised_completion_date, cost_revision_pct, deadline_revision_flag, status_at_month_end, data_quality_flag, created_at").eq("project_id", project_id.strip()).order("reporting_month", desc=False).limit(120).execute()
        snaps = s_res.data or []
        return {"project_id": meta["project_id"], "project_name": meta.get("name"), "total_snapshots": len(snaps), "snapshots": snaps}

    def get_filters_meta(self) -> Dict[str, Any]:
        now = time.time()
        if self._filters_cache and (now - self._filters_cache_time) < self._cache_ttl:
            return self._filters_cache
        rows = self._get_all_projects_cached()
        self._filters_cache = {
            "sectors": sorted({r["sector"] for r in rows if r.get("sector")}),
            "states": sorted({r["state"] for r in rows if r.get("state")}),
            "ministries": sorted({r["ministry"] for r in rows if r.get("ministry")}),
            "implementing_agencies": sorted({r["implementing_agency"] for r in rows if r.get("implementing_agency")}),
            "project_statuses": sorted({r["project_status"] for r in rows if r.get("project_status")}),
            "risk_levels": ["Critical", "High", "Medium", "Low"],
            "reporting_months": sorted({r["reporting_month"] for r in rows if r.get("reporting_month")}),
            "cached_at": now,
        }
        self._filters_cache_time = now
        return self._filters_cache

    def get_stats_overview(self) -> Dict[str, Any]:
        rows = self._get_all_projects_cached()


        status_dist = {}
        risk_dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        t_orig, t_rev, t_exp = 0.0, 0.0, 0.0
        valid_prog = []
        for r in rows:
            st = r.get("project_status") or "Unknown"
            status_dist[st] = status_dist.get(st, 0) + 1
            rl = r.get("risk_level") or "Low"
            risk_dist[rl] = risk_dist.get(rl, 0) + 1
            if r.get("original_cost_cr") is not None: t_orig += float(r["original_cost_cr"])
            if r.get("revised_cost_cr") is not None: t_rev += float(r["revised_cost_cr"])
            if r.get("cumulative_expenditure_cr") is not None: t_exp += float(r["cumulative_expenditure_cr"])
            if r.get("physical_progress_pct") is not None: valid_prog.append(float(r["physical_progress_pct"]))
        avg_p = round(sum(valid_prog) / len(valid_prog), 2) if valid_prog else 0.0
        return {
            "total_projects": len(rows),
            "status_distribution": status_dist,
            "risk_level_distribution": risk_dist,
            "portfolio_financials": {
                "total_original_cost_cr": round(t_orig, 2),
                "total_revised_cost_cr": round(t_rev, 2),
                "total_cumulative_expenditure_cr": round(t_exp, 2),
                "average_physical_progress_pct": avg_p,
            },
        }

project_service = ProjectService()
