"""
AQUILA Machine Learning Pipeline — Module 2: Model Training & Binary Persistence
Trains the 50-tree Random Forest ensemble on train_split.csv and saves leak_rf_model.joblib
"""

import sys
import joblib
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score

# Windows terminal UTF-8 encoding guard
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

RANDOM_SEED = 42

# Setup relative paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 70)
print(" AQUILA ML PIPELINE -- MODULE 2: MODEL TRAINING & PERSISTENCE")
print("=" * 70)

# ------------------------------------------------------------------------------
# 1. LOAD PREPROCESSED DATASET SPLITS
# ------------------------------------------------------------------------------
train_csv_path = DATA_DIR / "train_split.csv"
val_csv_path   = DATA_DIR / "val_split.csv"

if not train_csv_path.exists() or not val_csv_path.exists():
    raise FileNotFoundError("Training or Validation CSV missing in training/data/. Run src/generate_dataset.py first.")

print("\n[1/4] Loading preprocessed dataset partitions from data/...")
train_df = pd.read_csv(train_csv_path)
val_df   = pd.read_csv(val_csv_path)

X_train = train_df.drop(columns=['is_leak'])
y_train = train_df['is_leak']

X_val = val_df.drop(columns=['is_leak'])
y_val = val_df['is_leak']

print(f"  * Training Set   : {len(X_train)} samples")
print(f"  * Validation Set : {len(X_val)} samples")

# ------------------------------------------------------------------------------
# 2. FIT RANDOM FOREST CLASSIFIER (50 Trees)
# ------------------------------------------------------------------------------
print("\n[2/4] Fitting Random Forest Classifier (50 Trees, class_weight='balanced')...")

rf_model = RandomForestClassifier(
    n_estimators=50,
    max_depth=7,
    min_samples_split=6,
    min_samples_leaf=3,
    class_weight='balanced',
    random_state=RANDOM_SEED,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)
print("  * Model fitting complete.")

# ------------------------------------------------------------------------------
# 3. FEATURE IMPORTANCE ANALYSIS (Gini Impurity / MDI)
# ------------------------------------------------------------------------------
print("\n[3/4] Feature Importance Ranking (Gini Mean Decrease Impurity):")
features = X_train.columns.tolist()
importances = rf_model.feature_importances_

for name, imp in sorted(zip(features, importances), key=lambda x: x[1], reverse=True):
    print(f"      - {name:<18}: {imp:.4f} ({imp*100:.1f}%)")

# Validation Score
val_probs = rf_model.predict_proba(X_val)[:, 1]
val_auc = roc_auc_score(y_val, val_probs)
print(f"\n  * Validation Set ROC-AUC Score: {val_auc:.4f}")

# ------------------------------------------------------------------------------
# 4. PERSIST MODEL BINARY (.joblib)
# ------------------------------------------------------------------------------
model_output_path = MODELS_DIR / "leak_rf_model.joblib"
joblib.dump(rf_model, model_output_path)

print(f"\n[4/4] Saved trained model binary to:\n      -> {model_output_path}")

print("\n" + "=" * 70)
print(" MODULE 2 COMPLETE: MODEL BINARY SAVED IN training/models/")
print("=" * 70)