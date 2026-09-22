"""
MoSPI DRISHTI AI Engine - Multi-Target Predictive Model Training
Trains ensemble classifiers for Early Warnings, High-Risk Overruns, and Deadline Slips.
Uses GroupShuffleSplit on stable_id to prevent multi-snapshot entity leakage.
Excludes unobserved terminal records (n_future == 0).
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
)

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def train_models(data_path="features.csv", output_dir=None):
    if output_dir is None:
        # Save newly trained models into separate evaluation/output directory; DO NOT overwrite production models
        output_dir = os.path.join(os.path.dirname(__file__), "..", "models_corrected")
    os.makedirs(output_dir, exist_ok=True)

    print("[AI Engine] Loading features dataset...")
    
    # Path resolution
    candidate_paths = [
        data_path,
        os.path.join(os.path.dirname(__file__), "..", "..", data_path),
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", data_path),
        os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "features.csv"),
    ]
    resolved_path = None
    for cp in candidate_paths:
        if os.path.exists(cp):
            resolved_path = cp
            break
    if not resolved_path:
        raise FileNotFoundError(f"features.csv not found in candidate paths: {candidate_paths}")

    df_raw = pd.read_csv(resolved_path, low_memory=False)
    print(f"[AI Engine] Total raw rows: {len(df_raw)}")

    # 1. Exclude rows where n_future == 0 from supervised training/evaluation
    if 'n_future' in df_raw.columns:
        df = df_raw[df_raw['n_future'] > 0].copy().reset_index(drop=True)
        excluded_count = len(df_raw) - len(df)
        print(f"[AI Engine] Excluded {excluded_count} rows with n_future == 0. Valid supervised records: {len(df)}")
    else:
        df = df_raw.copy().reset_index(drop=True)

    feature_cols = [
        'log_original_cost', 'multi_state', 'agency_freq', 'sector_freq', 'ministry_freq',
        'approval_to_start_months', 'approval_year', 'planned_duration_months',
        'age_at_t_months', 'cost_overrun_so_far_pct', 'cost_already_revised',
        'expenditure_vs_revised', 'progress_pct', 'progress_vs_expected',
        'time_overrun_months', 'deadline_revised_so_far', 'total_doc_push_months',
        'months_to_revised_doc', 'spend_vs_progress', 'exp_per_pct',
        'progress_rate_3m', 'spend_rate_3m', 'cost_change_3m',
        'progress_stall', 'doc_push_recent', 'cost_revisions_so_far'
    ]

    target_cols = {
        'high_risk': 'y_high_risk',
        'deadline_slip': 'y_deadline_slip',
        'cost_escalation': 'y_cost_escalation'
    }

    # Clean features
    X = pd.DataFrame()
    for col in feature_cols:
        X[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    # 2. Project-level grouped split by stable_id so snapshots from the same project NEVER appear in both train and test
    groups = df['stable_id'] if 'stable_id' in df.columns else df['project_name']
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, groups=groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    train_groups = set(groups.iloc[train_idx])
    test_groups = set(groups.iloc[test_idx])
    overlap = train_groups.intersection(test_groups)

    print(f"\n[AI Engine] Grouped Split Summary (by stable_id):")
    print(f"   Train samples: {len(X_train)} across {len(train_groups)} unique projects")
    print(f"   Test samples:  {len(X_test)} across {len(test_groups)} unique projects")
    print(f"   Train/Test Project Overlap: {len(overlap)} projects (Must be 0)")
    assert len(overlap) == 0, f"Error: Project overlap detected ({len(overlap)})!"

    trained_models = {}
    metrics_report = {}

    for model_name, target_col in target_cols.items():
        print(f"\n[AI Engine] Training Ensemble Model for [{model_name}] ({target_col})...")
        y = pd.to_numeric(df[target_col], errors='coerce').fillna(0).astype(int)
        y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

        train_pos = int((y_train == 1).sum())
        train_neg = int((y_train == 0).sum())
        test_pos = int((y_test == 1).sum())
        test_neg = int((y_test == 0).sum())
        print(f"   Train distribution: Positive={train_pos} ({train_pos/len(y_train)*100:.1f}%), Negative={train_neg}")
        print(f"   Test distribution:  Positive={test_pos} ({test_pos/len(y_test)*100:.1f}%), Negative={test_neg}")

        # For cost_escalation use class_weight="balanced_subsample"
        class_weight = "balanced_subsample" if model_name == "cost_escalation" else None

        # Train Random Forest Classifier with optimized hyperparameters
        clf = RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight=class_weight,
            random_state=42,
            n_jobs=-1
        )
        clf.fit(X_train, y_train)

        # Evaluation
        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1] if len(clf.classes_) > 1 else np.zeros(len(y_test))

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 1.0
        cm = confusion_matrix(y_test, y_pred)

        print(f"   Accuracy:  {acc * 100:.2f}%")
        print(f"   Precision: {prec * 100:.2f}%")
        print(f"   Recall:    {rec * 100:.2f}%")
        print(f"   F1-Score:  {f1 * 100:.2f}%")
        print(f"   ROC-AUC:   {roc:.4f}")
        print(f"   Confusion Matrix: TN={cm[0,0]}, FP={cm[0,1]}, FN={cm[1,0]}, TP={cm[1,1]}")

        # Feature importances
        importances = dict(zip(feature_cols, clf.feature_importances_))
        sorted_imp = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]
        print(f"   Top 5 Risk Drivers: {', '.join([k for k, _ in sorted_imp])}")

        # Save model artifact into output_dir
        model_file = os.path.join(output_dir, f"{model_name}_model.joblib")
        joblib.dump({
            'model': clf,
            'features': feature_cols,
            'metrics': {
                'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1, 'roc_auc': roc,
                'confusion_matrix': {
                    'tn': int(cm[0,0]), 'fp': int(cm[0,1]), 'fn': int(cm[1,0]), 'tp': int(cm[1,1])
                }
            },
            'top_features': sorted_imp
        }, model_file)

        trained_models[model_name] = clf
        metrics_report[model_name] = {
            'accuracy': acc, 'precision': prec, 'recall': rec, 'f1': f1, 'roc_auc': roc,
            'confusion_matrix': {
                'tn': int(cm[0,0]), 'fp': int(cm[0,1]), 'fn': int(cm[1,0]), 'tp': int(cm[1,1])
            }
        }

    # Save meta config
    meta_path = os.path.join(output_dir, "model_meta.json")
    with open(meta_path, 'w') as f:
        json.dump({
            'trained_samples': len(X_train),
            'test_samples': len(X_test),
            'unique_train_projects': len(train_groups),
            'unique_test_projects': len(test_groups),
            'project_overlap': len(overlap),
            'feature_columns': feature_cols,
            'metrics': metrics_report
        }, f, indent=2)

    print(f"\n[AI Engine] Corrected models successfully saved to: {output_dir}")
    print("[AI Engine] (Production models in models/ remain untouched)")
    return trained_models

if __name__ == "__main__":
    train_models()
