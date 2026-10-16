"""
AQUILA Machine Learning Pipeline — Module 4: Model Transpilation to JSON AST
Compiles trained leak_rf_model.joblib into JSON AST for Node.js runtime execution.
Saves copies to training/models/ and src/models/
"""

import sys
import json
import joblib
from pathlib import Path

# Windows terminal UTF-8 encoding guard
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Setup relative paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
SRC_MODELS_DIR = BASE_DIR.parent / "src" / "models"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
SRC_MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 70)
print(" AQUILA ML PIPELINE -- MODULE 4: TREE TRANSPILATION TO JSON AST")
print("=" * 70)

model_path = MODELS_DIR / "leak_rf_model.joblib"
if not model_path.exists():
    raise FileNotFoundError("Model binary missing in training/models/. Run src/train_model.py first.")

print("\n[1/2] Loading trained Scikit-Learn model binary...")
rf_model = joblib.load(model_path)
print(f"  * Loaded {rf_model.n_estimators} decision trees from {model_path.name}")

# Recursive AST Serializer
def serialize_tree(tree):
    def recurse(node_id):
        if tree.children_left[node_id] == -1 and tree.children_right[node_id] == -1:
            value = tree.value[node_id][0]
            total = sum(value)
            prob_leak = float(value[1] / total) if total > 0 else 0.0
            return {"type": "leaf", "prob": round(prob_leak, 4)}
        else:
            return {
                "type": "split",
                "feature": int(tree.feature[node_id]),
                "threshold": round(float(tree.threshold[node_id]), 4),
                "left": recurse(tree.children_left[node_id]),
                "right": recurse(tree.children_right[node_id])
            }
    return recurse(0)

features = ['flow_rate_lpm', 'rolling_mean_5m', 'effective_std', 'duration_minutes', 'hour_of_day']

serialized_forest = {
    "model_name": "AQUILA_RandomForest_Leak_Classifier",
    "version": "2.2.0",
    "n_estimators": len(rf_model.estimators_),
    "operating_threshold": 0.40,
    "features": features,
    "trees": [serialize_tree(estimator.tree_) for estimator in rf_model.estimators_]
}

# Export to training/models/
export_path1 = MODELS_DIR / "leak_trees.json"
with open(export_path1, "w", encoding="utf-8") as f:
    json.dump(serialized_forest, f, indent=2)

# Export copy to agent-engine/src/models/
export_path2 = SRC_MODELS_DIR / "leak_trees.json"
with open(export_path2, "w", encoding="utf-8") as f:
    json.dump(serialized_forest, f, indent=2)

print(f"\n[2/2] Saved compiled AST weights to dual deployment targets:")
print(f"  -> {export_path1}")
print(f"  -> {export_path2}")

print("\n" + "=" * 70)
print(" MODULE 4 COMPLETE: LEAK_TREES.JSON SYNCHRONIZED ACROSS DEPLOYMENT TARGETS")
print("=" * 70)