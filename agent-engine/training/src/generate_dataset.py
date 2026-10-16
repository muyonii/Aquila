"""
AQUILA Machine Learning Pipeline — Module 1: Dataset Generation & Splitting
Generates physical WDN dataset (N=10,000) and writes raw/split CSV files to data/
Windows-safe encoding version (ASCII safe)
"""

import os
import random
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

# Force UTF-8 on Windows terminal if supported
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Set random seed for 100% deterministic reproducibility
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# Determine data output directory relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 70)
print(" AQUILA ML PIPELINE -- MODULE 1: DATASET GENERATION & PREPROCESSING")
print("=" * 70)

# ------------------------------------------------------------------------------
# 1. SYNTHETIC HYDRAULIC DATASET SYNTHESIS (N = 10,000)
# ------------------------------------------------------------------------------
print("\n[1/4] Generating 10,000 physics-informed hydraulic telemetry samples...")

records = []

# A. Generate 7,500 Normal / Intermittent Usage Samples (is_leak = 0)
for _ in range(7500):
    hour = random.randint(0, 23)
    
    # Diurnal Profile Modeling
    if 0 <= hour < 5:      # Nocturnal Lull (00:00 - 05:00)
        is_active = random.random() < 0.05
        base_q = random.uniform(0.5, 2.0) if is_active else 0.0
        dur_min = random.uniform(0.2, 2.0) if is_active else 0.0
    elif 5 <= hour < 9:    # Morning Peak (05:00 - 09:00)
        is_active = random.random() < 0.70
        base_q = random.uniform(2.5, 7.5) if is_active else 0.0
        dur_min = random.uniform(1.0, 15.0) if is_active else 0.0
    elif 9 <= hour < 17:   # Midday Lull (09:00 - 17:00)
        is_active = random.random() < 0.25
        base_q = random.uniform(1.0, 4.0) if is_active else 0.0
        dur_min = random.uniform(0.5, 5.0) if is_active else 0.0
    else:                  # Evening Peak (17:00 - 23:59)
        is_active = random.random() < 0.60
        base_q = random.uniform(2.0, 6.0) if is_active else 0.0
        dur_min = random.uniform(1.0, 12.0) if is_active else 0.0

    if base_q > 0.0:
        # Domestic turbulent flow: high standard deviation
        sigma = random.uniform(0.25, 0.75)
        mean_q = max(0.1, base_q + random.uniform(-0.3, 0.3))
        q = max(0.0, base_q + random.gauss(0, sigma))
    else:
        q = 0.0
        mean_q = 0.0
        sigma = 0.02
        dur_min = 0.0

    # Distractor event: garden hose or continuous domestic fill (5% of normal)
    if random.random() < 0.05:
        q = random.uniform(3.5, 6.0)
        mean_q = q
        sigma = random.uniform(0.18, 0.35)  # High variance separates it from leaks
        dur_min = random.uniform(10.0, 25.0)

    # Physical Boundary Rule (EXC-02): Sub-floor mechanical friction (< 1.0 LPM)
    if q < 1.0:
        q = 0.0 if q < 0.2 else q
        sigma = 0.02

    records.append({
        'flow_rate_lpm': round(q, 2),
        'rolling_mean_5m': round(mean_q, 2),
        'effective_std': round(sigma, 3),
        'duration_minutes': round(dur_min, 1),
        'hour_of_day': hour,
        'is_leak': 0
    })

# B. Generate 2,500 Subterranean Physical Pipe Leaks (is_leak = 1)
for _ in range(2500):
    hour = random.randint(0, 23)
    leak_archetype = random.choice(['hairline', 'lateral', 'blowout'])
    
    if leak_archetype == 'hairline':
        base_q = random.uniform(1.5, 2.2)
        dur_min = random.uniform(10.0, 180.0)
        sigma = random.uniform(0.02, 0.05)  # Characteristically flat variance
    elif leak_archetype == 'lateral':
        base_q = random.uniform(2.5, 4.5)
        dur_min = random.uniform(15.0, 240.0)
        sigma = random.uniform(0.03, 0.06)
    else:  # blowout
        base_q = random.uniform(5.0, 8.5)
        dur_min = random.uniform(20.0, 360.0)
        sigma = random.uniform(0.04, 0.08)

    q = max(1.0, base_q + random.gauss(0, sigma))
    mean_q = base_q

    records.append({
        'flow_rate_lpm': round(q, 2),
        'rolling_mean_5m': round(mean_q, 2),
        'effective_std': round(sigma, 3),
        'duration_minutes': round(dur_min, 1),
        'hour_of_day': hour,
        'is_leak': 1
    })

df = pd.DataFrame(records)

# ------------------------------------------------------------------------------
# 2. SAVE RAW DATASET TO DISK (.csv)
# ------------------------------------------------------------------------------
raw_csv_path = DATA_DIR / "raw_dataset.csv"
df.to_csv(raw_csv_path, index=False)
print(f"[2/4] Saved complete raw dataset ({len(df)} rows) to:\n      -> {raw_csv_path}")

# ------------------------------------------------------------------------------
# 3. STRATIFIED PARTITIONING (70% Train, 15% Validation, 15% Test)
# ------------------------------------------------------------------------------
print("\n[3/4] Performing stratified train/validation/test split...")

X = df.drop(columns=['is_leak'])
y = df['is_leak']

X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=RANDOM_SEED, stratify=y
)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=RANDOM_SEED, stratify=y_temp
)

# Save partition CSV files
train_df = pd.concat([X_train, y_train], axis=1)
val_df   = pd.concat([X_val, y_val], axis=1)
test_df  = pd.concat([X_test, y_test], axis=1)

train_csv_path = DATA_DIR / "train_split.csv"
val_csv_path   = DATA_DIR / "val_split.csv"
test_csv_path  = DATA_DIR / "test_split.csv"

train_df.to_csv(train_csv_path, index=False)
val_df.to_csv(val_csv_path, index=False)
test_df.to_csv(test_csv_path, index=False)

print(f"  * Train Set ({len(train_df)} rows, {y_train.sum()} leaks) -> {train_csv_path.name}")
print(f"  * Val Set   ({len(val_df)} rows, {y_val.sum()} leaks) -> {val_csv_path.name}")
print(f"  * Test Set  ({len(test_df)} rows, {y_test.sum()} leaks) -> {test_csv_path.name}")

# ------------------------------------------------------------------------------
# 4. DESCRIPTIVE STATISTICAL SUMMARY
# ------------------------------------------------------------------------------
print("\n[4/4] Feature Statistics Comparison (Normal vs. Leak):")
stats = df.groupby('is_leak')[['flow_rate_lpm', 'effective_std', 'duration_minutes']].mean()
stats.index = ['Normal (0)', 'Leak (1)']
print(stats.to_string())

print("\n" + "=" * 70)
print(" MODULE 1 COMPLETE: DATASET FILES ARE READY IN training/data/")
print("=" * 70)