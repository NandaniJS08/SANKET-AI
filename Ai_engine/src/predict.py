import os
import joblib
import numpy as np
import pandas as pd
import shap
import json
import warnings
from sklearn.exceptions import InconsistentVersionWarning

class DrishtiPredictor:
    FEATURE_LABELS = {
        "log_original_cost": "Sanctioned Capital Outlay",
        "multi_state": "Multi-State Operational Footprint",
        "agency_freq": "Implementing Agency Portfolio Experience",
        "sector_freq": "Sector Project Concentration",
        "ministry_freq": "Administrative Ministry Oversight Volume",
        "approval_to_start_months": "Statutory Clearance & Pre-Execution Lag",
        "approval_year": "Original Sanction Year",
        "planned_duration_months": "Statutory Planned Project Duration",
        "age_at_t_months": "Active Project Execution Age",
        "cost_overrun_so_far_pct": "Cumulative Cost Escalation Rate",
        "cost_already_revised": "Prior Sanction Cost Revision History",
        "expenditure_vs_revised": "Financial Utilization vs Revised Budget",
        "progress_pct": "Cumulative Physical Progress",
        "progress_vs_expected": "Physical Progress vs Statutory Expected Benchmark",
        "time_overrun_months": "Cumulative Timeline Slippage",
        "deadline_revised_so_far": "Commissioning Date Postponement Flag",
        "total_doc_push_months": "Total Statutory Target Date Push",
        "months_to_revised_doc": "Time Horizon Remaining to Revised Deadline",
        "spend_vs_progress": "Capital Burn Ratio vs Physical Work Absorption",
        "exp_per_pct": "Expenditure Incurred per 1% Physical Progress",
        "progress_rate_3m": "Recent 3-Month Physical Progress Velocity",
        "spend_rate_3m": "Recent 3-Month Capital Burn Velocity",
        "cost_change_3m": "Recent 3-Month Cost Variation Velocity",
        "progress_stall": "Physical Milestone Stagnation (Stall Detection)",
        "doc_push_recent": "Recent Target Commissioning Shift",
        "cost_revisions_so_far": "Number of Formal Cost Revisions"
    }

    def __init__(self, models_dir=None):
        if models_dir is None:
            models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
        self.models_dir = models_dir
        self.models = {}
        self.feature_cols = []
        self.shap_explainer = None
        self._load_models()

    def _load_models(self):
        # BUG-004 FIX: Suppress expected InconsistentVersionWarning from sklearn version mismatch.
        # Models were trained on scikit-learn==1.6.1; pin that version to eliminate this permanently.
        warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

        targets = ['high_risk', 'deadline_slip', 'cost_escalation']
        for target in targets:
            model_path = os.path.join(self.models_dir, f"{target}_model.joblib")
            if os.path.exists(model_path):
                data = joblib.load(model_path)
                self.models[target] = data['model']
                # Each .joblib dict stores features under 'features' key
                if data.get('features'):
                    self.feature_cols = data['features']
            else:
                self.models[target] = None

        # BUG-005 FIX: If feature_cols still empty, load from model_meta.json using correct key 'feature_columns'
        if not self.feature_cols:
            meta_path = os.path.join(self.models_dir, "model_meta.json")
            if os.path.exists(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as mf:
                        meta = json.load(mf)
                    # Correct key is 'feature_columns', NOT 'features'
                    self.feature_cols = meta.get("feature_columns", [])
                    if self.feature_cols:
                        print(f"[DrishtiPredictor] Loaded {len(self.feature_cols)} features from model_meta.json (feature_columns key).")
                except Exception as exc:
                    print(f"[DrishtiPredictor] Warning: Could not load model_meta.json: {exc}")

        # Pre-initialize TreeSHAP explainer for high_risk model
        if self.models.get('high_risk') is not None:
            try:
                self.shap_explainer = shap.TreeExplainer(self.models['high_risk'])
            except Exception as exc:
                print(f"[DrishtiPredictor] TreeExplainer initialization warning: {exc}")
                self.shap_explainer = None


    def _build_feature_vector(self, project_data: dict) -> pd.DataFrame:
        """Constructs the exact 26-feature DataFrame vector required for inference and SHAP."""
        vector = []
        for col in self.feature_cols:
            val = project_data.get(col, 0.0)
            try:
                vector.append(float(val))
            except (ValueError, TypeError):
                vector.append(0.0)
        return pd.DataFrame([vector], columns=self.feature_cols)

    def _get_tree_shap_drivers(self, model, X: pd.DataFrame) -> list:
        """Computes real TreeSHAP attribution drivers for the positive risk class."""
        if self.shap_explainer is None:
            return []

        vals = self.shap_explainer.shap_values(X)
        if isinstance(vals, list):
            class1_shap = vals[1][0]
        elif len(vals.shape) == 3:
            class1_shap = vals[0, :, 1]
        else:
            class1_shap = vals[0]

        drivers = []
        for i, col in enumerate(self.feature_cols):
            sv = float(class1_shap[i])
            drivers.append({
                "feature": col,
                "raw_shap_value": sv,
                "weight": abs(sv),
                "direction": "increases_risk" if sv > 0 else "decreases_risk"
            })
        drivers.sort(key=lambda d: d["weight"], reverse=True)
        return drivers

    def _feature_label(self, feat_name: str) -> str:
        """Returns standard institutional plain-language label for a feature code."""
        return self.FEATURE_LABELS.get(feat_name, feat_name.replace("_", " ").title())

    def _feature_description(self, feat_name: str, project_data: dict) -> str:
        """Synthesizes factual, evidence-based description from real telemetry value."""
        val = project_data.get(feat_name, 0.0)
        try:
            num = float(val)
        except (ValueError, TypeError):
            num = 0.0

        if feat_name == "progress_pct":
            return f"Current physical progress recorded at {num:.1f}% completion."
        elif feat_name == "time_overrun_months":
            return f"Schedule delayed by {int(num)} months past original approved commissioning date."
        elif feat_name == "progress_stall":
            return "Active progress stagnation: physical progress moved <0.3%/month in recent reporting cycles." if num > 0 else "Physical milestone progress actively advancing."
        elif feat_name == "spend_vs_progress":
            return f"Capital burn ratio stands at {num:.2f}x standard progress absorption."
        elif feat_name == "months_to_revised_doc":
            return f"{num:.1f} months remaining until revised statutory completion target."
        elif feat_name == "cost_revisions_so_far":
            return f"Budget sanction has been revised upward {int(num)} time(s) to date."
        elif feat_name == "cost_overrun_so_far_pct":
            return f"Cumulative project cost has escalated by +{num:.1f}% above initial baseline."
        elif feat_name == "progress_vs_expected":
            if num < 0:
                return f"Physical progress is {abs(num):.1f}% points behind statutory target schedule."
            return f"Physical progress is tracking at {num:+.1f}% points relative to planned trajectory."
        elif feat_name == "agency_freq":
            return f"Implementing agency manages {int(num)} central infrastructure projects in the portfolio."
        elif feat_name == "log_original_cost":
            cost_cr = 10 ** num if num > 0 else 0
            return f"Original sanctioned baseline outlay: approx ₹{cost_cr:,.1f} Crore."
        elif feat_name == "approval_to_start_months":
            return f"Pre-construction statutory clearance lag of {int(num)} months between sanction and work order."
        elif feat_name == "planned_duration_months":
            return f"Original approved project execution duration was {int(num)} months."
        elif feat_name == "age_at_t_months":
            return f"Project has been under active execution for {int(num)} months since inception."
        elif feat_name == "progress_rate_3m":
            return f"Recent 3-month physical progress velocity is {num:.2f}% per month."
        elif feat_name == "spend_rate_3m":
            return f"Recent 3-month capital expenditure rate is ₹{num:.2f} Crore per month."
        elif feat_name == "expenditure_vs_revised":
            return f"Cumulative expenditure has consumed {num * 100:.1f}% of revised sanctioned cost."
        elif feat_name == "total_doc_push_months":
            return f"Commissioning target date has slipped by a total of {int(num)} months."
        elif feat_name == "deadline_revised_so_far":
            return "Target commissioning date has been formally revised." if num > 0 else "Original commissioning target date remains unchanged."
        elif feat_name == "cost_already_revised":
            return "Sanctioned capital cost has already been formally revised." if num > 0 else "Project is operating within original sanctioned cost."
        elif feat_name == "multi_state":
            return "Project spans multiple states/UT jurisdictions." if num > 0 else "Single-state infrastructure asset."
        else:
            return f"{self._feature_label(feat_name)} measured value: {num}."

    def predict_project(self, project_data: dict) -> dict:
        """
        Takes raw project fields and computes comprehensive risk probabilities,
        early warnings, delay projections, and real TreeSHAP risk factors.
        """
        X = self._build_feature_vector(project_data)

        results = {
            "risk_score": 0.0,
            "risk_level": "Low",
            "high_risk_probability": 0.0,
            "deadline_slip_probability": 0.0,
            "cost_escalation_probability": 0.0,
            "predicted_delay_months": 0,
            "top_risk_drivers": [],
            "recommendation": ""
        }

        # High Risk Classifier
        if self.models.get('high_risk'):
            clf = self.models['high_risk']
            probs = clf.predict_proba(X)[0]
            prob_high = float(probs[1]) if len(probs) > 1 else 0.0
            results["high_risk_probability"] = round(prob_high * 100, 1)
            results["risk_score"] = round(prob_high * 100, 1)
            
            if prob_high >= 0.70:
                results["risk_level"] = "Critical"
            elif prob_high >= 0.40:
                results["risk_level"] = "High"
            elif prob_high >= 0.20:
                results["risk_level"] = "Medium"
            else:
                results["risk_level"] = "Low"

        # Deadline Slip Classifier
        if self.models.get('deadline_slip'):
            clf = self.models['deadline_slip']
            probs = clf.predict_proba(X)[0]
            prob_slip = float(probs[1]) if len(probs) > 1 else 0.0
            results["deadline_slip_probability"] = round(prob_slip * 100, 1)
            
            # Estimate delay months based on features (safely handle None/null/non-numeric values)
            raw_overrun = project_data.get('time_overrun_months')
            try:
                time_overrun = float(raw_overrun) if raw_overrun is not None else 0.0
            except (ValueError, TypeError):
                time_overrun = 0.0

            raw_stall = project_data.get('progress_stall')
            try:
                stall = float(raw_stall) if raw_stall is not None else 0.0
            except (ValueError, TypeError):
                stall = 0.0

            est_delay = int(time_overrun + (stall * 4) + (prob_slip * 6))
            results["predicted_delay_months"] = max(0, est_delay)

        # Cost Escalation Classifier
        if self.models.get('cost_escalation'):
            clf = self.models['cost_escalation']
            probs = clf.predict_proba(X)[0]
            prob_cost = float(probs[1]) if len(probs) > 1 else 0.0
            results["cost_escalation_probability"] = round(prob_cost * 100, 1)

        # Real TreeSHAP Risk Drivers Attribution
        if self.shap_explainer is not None and self.models.get('high_risk'):
            raw_drivers = self._get_tree_shap_drivers(self.models['high_risk'], X)
            drivers = []
            for d in raw_drivers[:5]:
                feat_name = d["feature"]
                weight = d["weight"]
                raw_val = d["raw_shap_value"]
                impact = (
                    "High" if weight >= 0.08
                    else "Medium" if weight >= 0.03
                    else "Low"
                )
                drivers.append({
                    "factor": self._feature_label(feat_name),
                    "feature": feat_name,
                    "impact": impact,
                    "weight": round(weight * 100, 1),
                    "shap_value": round(raw_val, 4),
                    "raw_shap_value": raw_val,
                    "direction": d["direction"],
                    "evidence": self._feature_description(feat_name, project_data)
                })
            results["top_risk_drivers"] = drivers

        # Generate actionable recommendation
        if results["risk_level"] in ["Critical", "High"]:
            results["recommendation"] = "Immediate IPMD Inter-Ministerial Taskforce Review required. Freeze non-critical disbursements and conduct contractor liquidity audit."
        elif results["risk_level"] == "Medium":
            results["recommendation"] = "Monthly milestone escalation triggered. Review Right of Way (RoW) clearances and fast-track utility shifting."
        else:
            results["recommendation"] = "Project progress tracking within standard tolerance envelope. Continue automated sensor monitoring."

        return results

# Singleton instance
_predictor = None

def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = DrishtiPredictor()
    return _predictor

if __name__ == "__main__":
    predictor = get_predictor()
    sample = {
        "progress_pct": 35.0,
        "time_overrun_months": 12,
        "progress_stall": 1,
        "spend_vs_progress": 1.85,
        "log_original_cost": 6.5,
        "months_to_revised_doc": 6.0,
        "cost_revisions_so_far": 2
    }
    print("Sample Prediction Output:")
    import pprint
    pprint.pprint(predictor.predict_project(sample))
