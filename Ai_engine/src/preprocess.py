"""
MoSPI DRISHTI AI Engine - Data Preprocessing & Pipeline
Cleans and prepares SIH DRISHTI and features datasets for ML training and real-time inference.
"""

import os
import pandas as pd
import numpy as np

def load_features_dataset(filepath="features.csv"):
    """
    Loads and cleans features.csv with robust handling for quotes and commas.
    """
    if not os.path.exists(filepath):
        # Fallback to parent directory if called from src
        filepath = os.path.join("..", "..", filepath)
    
    df = pd.read_csv(filepath, low_memory=False)
    
    # Target columns
    target_cols = ['y_high_risk', 'y_deadline_slip', 'y_cost_escalation']
    
    # Select numeric feature columns
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
    
    # Ensure all feature columns exist and are numeric
    for col in feature_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)
        else:
            df[col] = 0.0
            
    for col in target_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
        else:
            df[col] = 0

    return df, feature_cols, target_cols

if __name__ == "__main__":
    df, features, targets = load_features_dataset()
    print(f"Loaded {len(df)} records with {len(features)} features and {len(targets)} targets.")
