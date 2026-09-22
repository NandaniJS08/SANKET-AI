"""
Early Warnings Service
Institutional risk signals and threshold alerts for MoSPI Central Sector Infrastructure Projects.
Evaluates 5 verified early warning signals using real telemetry and live AI Engine prediction:
  1. Progress Stall
  2. Execution Gap
  3. Chronic Delay
  4. Spend vs Progress Absorption Gap
  5. Increasing Risk Vectors
Strictly uses real project/project_features data and live prediction service; zero fake risk scores or training label inference.
"""

from typing import List, Dict, Any, Optional
import math
from app.db.supabase import get_supabase
from app.services.projects import project_service
from app.services.predictions import prediction_service


class WarningService:
    """
    IMPORTANT — DATABASE SCHEMA NOTE (BUG-001 FIX):
    There is NO 'public.warnings' table in Supabase.
    All warnings are computed dynamically at request time from:
      - 'projects' table (telemetry: cost_revision_pct, deadline_revision_flag, physical_progress_pct)
      - 'project_features' table (ML-derived: progress_stall, spend_vs_progress, time_overrun_months)
      - Live AI prediction service (high_risk_probability, risk_score)
    Do NOT attempt to query or create a 'warnings' table in Supabase.
    """
    def __init__(self):
        pass

    def evaluate_project_warnings(
        self,
        project: Dict[str, Any],
        feature_row: Optional[Dict[str, Any]] = None,
        include_live_ai: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Evaluates the 5 canonical warning signals for a single project using real telemetry.
        """
        pid = str(project.get("project_id") or "")
        name = project.get("name") or "Unnamed Project"
        ministry = project.get("ministry")
        sector = project.get("sector")
        state = project.get("state")
        agency = project.get("implementing_agency")
        rep_month = project.get("reporting_month") or "Current Cycle"

        # Latest snapshot if available
        snapshot = project.get("latest_snapshot") or {}

        # Real telemetry variables
        phys_prog = snapshot.get("physical_progress_pct") or project.get("physical_progress_pct") or 0.0
        exp_cr = snapshot.get("cumulative_expenditure_cr") or project.get("cumulative_expenditure_cr") or 0.0
        rev_cost_cr = snapshot.get("latest_revised_cost_cr") or project.get("revised_cost_cr") or project.get("original_cost_cr") or 0.0
        cost_rev_pct = snapshot.get("cost_revision_pct") or project.get("cost_revision_pct") or 0.0
        deadline_flag = snapshot.get("deadline_revision_flag") if snapshot.get("deadline_revision_flag") is not None else project.get("deadline_revision_flag")

        # Feature variables if mapped
        stall_flag = float(feature_row.get("progress_stall", 0.0) or 0.0) if feature_row else 0.0
        exec_gap = float(feature_row.get("progress_vs_expected", 0.0) or 0.0) if feature_row else 0.0
        time_overrun = int(feature_row.get("time_overrun_months", 0) or 0) if feature_row else 0
        spend_ratio = float(feature_row.get("spend_vs_progress", 0.0) or 0.0) if feature_row else 0.0

        # Fallback to direct telemetry if feature row absent
        if not feature_row and rev_cost_cr > 0 and phys_prog > 0:
            fin_prog = (exp_cr / rev_cost_cr) * 100.0
            spend_ratio = round(fin_prog / phys_prog, 2)

        warnings: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # 1. SIGNAL: PROGRESS STALL
        # -------------------------------------------------------------
        if stall_flag == 1.0 or (feature_row and float(feature_row.get("progress_rate_3m", 1.0) or 1.0) < 0.3 and phys_prog < 95.0):
            severity = "Critical" if phys_prog < 50.0 else "High"
            warnings.append({
                "id": f"ALERT-{pid}-STALL",
                "alert_id": f"ALERT-{pid}-STALL",
                "projectId": pid,
                "project_id": pid,
                "projectName": name,
                "project_name": name,
                "ministry": ministry,
                "sector": sector,
                "state": state,
                "type": "Progress Stall",
                "warning_type": "Progress Stall",
                "severity": severity,
                "priority": severity,
                "reason": "Active progress stagnation: physical progress moved <0.3%/month in recent reporting cycles.",
                "whatHappened": f"Physical progress stagnated at {phys_prog:.1f}% with negligible advance across consecutive monitoring cycles.",
                "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                "whyItMatters": "Exceeds statutory stall threshold (<0.3%/mo). Site mobilization or statutory impasse requires field review.",
                "evidence": {
                    "physical_progress_pct": phys_prog,
                    "progress_stall_flag": stall_flag,
                    "recent_rate_3m": feature_row.get("progress_rate_3m") if feature_row else None,
                },
                "timestamp": rep_month,
                "source": "PAIMANA Level-3 Telemetry",
            })

        # -------------------------------------------------------------
        # 2. SIGNAL: EXECUTION GAP
        # -------------------------------------------------------------
        if exec_gap <= -15.0:
            severity = "Critical" if exec_gap <= -30.0 else "High"
            warnings.append({
                "id": f"ALERT-{pid}-GAP",
                "alert_id": f"ALERT-{pid}-GAP",
                "projectId": pid,
                "project_id": pid,
                "projectName": name,
                "project_name": name,
                "ministry": ministry,
                "sector": sector,
                "state": state,
                "type": "Execution Gap",
                "warning_type": "Execution Gap",
                "severity": severity,
                "priority": severity,
                "reason": f"Physical progress is {abs(exec_gap):.1f}% points behind statutory target schedule.",
                "whatHappened": f"Reported field execution of {phys_prog:.1f}% severely lags benchmark milestone schedule by {abs(exec_gap):.1f}% pts.",
                "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                "whyItMatters": f"Execution shortfall gap ({exec_gap:.1f}% pts) exceeds standard monitoring tolerance (threshold: -15.0% pts).",
                "evidence": {
                    "execution_gap_pct": exec_gap,
                    "physical_progress_pct": phys_prog,
                },
                "timestamp": rep_month,
                "source": "PAIMANA Level-3 Telemetry",
            })

        # -------------------------------------------------------------
        # 3. SIGNAL: CHRONIC DELAY
        # -------------------------------------------------------------
        if time_overrun >= 12 or deadline_flag is True:
            severity = "Critical" if time_overrun >= 24 else "High"
            delay_text = (
                f"Schedule delayed by {int(time_overrun)} months past original approved commissioning date."
                if time_overrun > 0
                else "Statutory commissioning target date has been formally postponed / amended."
            )
            warnings.append({
                "id": f"ALERT-{pid}-DELAY",
                "alert_id": f"ALERT-{pid}-DELAY",
                "projectId": pid,
                "project_id": pid,
                "projectName": name,
                "project_name": name,
                "ministry": ministry,
                "sector": sector,
                "state": state,
                "type": "Chronic Delay",
                "warning_type": "Chronic Delay",
                "severity": severity,
                "priority": severity,
                "reason": delay_text,
                "whatHappened": delay_text,
                "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                "whyItMatters": "Project commissioning date has experienced material slippage past the original Cabinet/CCEA sanctioned timeline.",
                "evidence": {
                    "time_overrun_months": time_overrun,
                    "deadline_revision_flag": deadline_flag,
                },
                "timestamp": rep_month,
                "source": "PAIMANA Level-3 Telemetry",
            })

        # -------------------------------------------------------------
        # 4. SIGNAL: SPEND VS PROGRESS ABSORPTION GAP
        # -------------------------------------------------------------
        if spend_ratio >= 1.5:
            severity = "Critical" if spend_ratio >= 2.0 else "High"
            warnings.append({
                "id": f"ALERT-{pid}-BURN",
                "alert_id": f"ALERT-{pid}-BURN",
                "projectId": pid,
                "project_id": pid,
                "projectName": name,
                "project_name": name,
                "ministry": ministry,
                "sector": sector,
                "state": state,
                "type": "Spend vs Progress Absorption Gap",
                "warning_type": "Spend vs Progress Absorption Gap",
                "severity": severity,
                "priority": severity,
                "reason": f"Capital burn ratio stands at {spend_ratio:.2f}x standard progress absorption.",
                "whatHappened": f"Financial expenditure burn ({spend_ratio:.2f}x) is disproportionate to physical completion ({phys_prog:.1f}%).",
                "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                "whyItMatters": "Capital outlay significantly outpacing physical work completion flags potential front-loading or contractor inflation.",
                "evidence": {
                    "spend_vs_progress_ratio": spend_ratio,
                    "cumulative_expenditure_cr": exp_cr,
                    "revised_cost_cr": rev_cost_cr,
                    "physical_progress_pct": phys_prog,
                },
                "timestamp": rep_month,
                "source": "PAIMANA Level-3 Telemetry",
            })

        # -------------------------------------------------------------
        # 5. SIGNAL: INCREASING RISK VECTORS
        # Strictly uses verified live ML prediction or verified multi-cycle escalation
        # Does NOT use historical y_high_risk training labels or fabricated static scores.
        # -------------------------------------------------------------
        live_risk_detected = False

        if include_live_ai:
            try:
                pred_res = prediction_service.predict_for_project(pid)
                if pred_res and pred_res.get("prediction"):
                    pred = pred_res["prediction"]
                    score = float(pred.get("risk_score") or 0.0)
                    level = str(pred.get("risk_level") or "LOW").upper()
                    if score >= 70.0 or level in ["HIGH", "CRITICAL"]:
                        live_risk_detected = True
                        severity = "Critical" if score >= 80.0 else "High"
                        warnings.append({
                            "id": f"ALERT-{pid}-RISK",
                            "alert_id": f"ALERT-{pid}-RISK",
                            "projectId": pid,
                            "project_id": pid,
                            "projectName": name,
                            "project_name": name,
                            "ministry": ministry,
                            "sector": sector,
                            "state": state,
                            "type": "Increasing Risk Vectors",
                            "warning_type": "Increasing Risk Vectors",
                            "severity": severity,
                            "priority": severity,
                            "reason": f"Elevated risk vector: live AI model prediction evaluated at {round(score)}/100 ({level}).",
                            "whatHappened": f"Live Random Forest multi-target model flagged high composite risk ({round(score)}/100) based on verified 26-feature vector.",
                            "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                            "whyItMatters": "Triggers automatic threshold alert for nodal monitoring officer. Field inspection mandated.",
                            "evidence": {
                                "live_risk_score": round(score),
                                "live_risk_level": level,
                                "cost_escalation_prob": pred.get("cost_escalation_probability"),
                                "deadline_slip_prob": pred.get("deadline_slip_probability"),
                            },
                            "timestamp": rep_month,
                            "source": "SANKET-AI Live Prediction Engine",
                        })
            except Exception:
                pass

        # If live AI was not run or did not fire, check verified budget escalation from real telemetry
        if not live_risk_detected and cost_rev_pct >= 20.0:
            severity = "Critical" if cost_rev_pct >= 35.0 else "High"
            warnings.append({
                "id": f"ALERT-{pid}-COSTREV",
                "alert_id": f"ALERT-{pid}-COSTREV",
                "projectId": pid,
                "project_id": pid,
                "projectName": name,
                "project_name": name,
                "ministry": ministry,
                "sector": sector,
                "state": state,
                "type": "Increasing Risk Vectors",
                "warning_type": "Increasing Risk Vectors",
                "severity": severity,
                "priority": severity,
                "reason": f"Escalating budget risk: project cost has been formally revised upward by +{cost_rev_pct:.1f}%.",
                "whatHappened": f"Approved project cost escalated by +{cost_rev_pct:.1f}% to ₹{rev_cost_cr:,.1f} Cr above initial sanctioned baseline.",
                "whichProject": f"{name} (ID: {pid}) · {state or 'National'}",
                "whyItMatters": "Severe financial escalation creates budgetary strain and statutory compliance review obligations.",
                "evidence": {
                    "cost_revision_pct": cost_rev_pct,
                    "latest_revised_cost_cr": rev_cost_cr,
                },
                "timestamp": rep_month,
                "source": "PAIMANA Level-3 Telemetry",
            })

        return warnings

    def get_project_warnings(self, project_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve all active warning signals for a single project ID.
        Returns None if project does not exist in master registry.
        """
        project = project_service.get_project_by_id(project_id)
        if not project:
            return None

        # Resolve verified feature row if available
        mapping = prediction_service._resolve_feature_mapping(project)
        feature_row = mapping.get("feature_row") if mapping.get("status") == "matched" else None

        warnings = self.evaluate_project_warnings(project, feature_row, include_live_ai=True)

        return {
            "project_id": str(project.get("project_id")),
            "project_name": project.get("name"),
            "total_warnings": len(warnings),
            "warnings": warnings,
        }

    def get_active_warnings(
        self,
        severity: Optional[str] = None,
        warning_type: Optional[str] = None,
        project_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Dict[str, Any]:
        """
        Retrieve active risk signals across projects with optional filtering and pagination.
        Sourced directly from real database telemetry.
        """
        if project_id:
            res = self.get_project_warnings(project_id)
            if not res:
                return {
                    "total": 0,
                    "page": 1,
                    "page_size": page_size,
                    "total_pages": 0,
                    "warnings": [],
                }
            warnings = res["warnings"]
            if severity and severity.lower() != "all":
                warnings = [w for w in warnings if w["severity"].lower() == severity.lower()]
            if warning_type and warning_type.lower() != "all":
                warnings = [w for w in warnings if w["type"].lower() == warning_type.lower()]
            return {
                "total": len(warnings),
                "page": 1,
                "page_size": page_size,
                "total_pages": 1 if warnings else 0,
                "warnings": warnings,
            }

        client = get_supabase()

        # Query top candidate projects ordered by cost_revision_pct desc to evaluate real warnings
        p_res = (
            client.table("projects")
            .select(
                "project_id, name, ministry, sector, state, implementing_agency, "
                "original_cost_cr, revised_cost_cr, cumulative_expenditure_cr, "
                "physical_progress_pct, cost_revision_pct, deadline_revision_flag, "
                "reporting_month"
            )
            .order("cost_revision_pct", desc=True)
            .limit(100)
            .execute()
        )
        projects = p_res.data or []

        all_warnings: List[Dict[str, Any]] = []

        for p in projects:
            # We don't invoke full live AI across all 100 projects in batch listing for sub-second performance,
            # but we use verified telemetry (burn ratio, cost revisions, deadline slips, etc.)
            p_warnings = self.evaluate_project_warnings(p, feature_row=None, include_live_ai=False)
            all_warnings.extend(p_warnings)

        # Filters
        if severity and severity.lower() != "all":
            all_warnings = [w for w in all_warnings if w["severity"].lower() == severity.lower()]
        if warning_type and warning_type.lower() != "all":
            all_warnings = [w for w in all_warnings if w["type"].lower() == warning_type.lower()]

        # Pagination
        total = len(all_warnings)
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        total_pages = math.ceil(total / page_size) if total > 0 else 1

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_warnings = all_warnings[start_idx:end_idx]

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "warnings": paginated_warnings,
        }


warning_service = WarningService()
