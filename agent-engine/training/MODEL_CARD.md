# AQUILA Model Card: Supervised Leak Detection Classifier (`CMP-LDA-01`)

## Model Details
* **Model Name:** AQUILA Random Forest Subterranean Leak Classifier
* **Version:** 2.2.0
* **Architecture:** Bagged Random Forest Ensemble (50 Estimator Decision Trees, Max Depth 7)
* **Target Environment:** Zero-dependency Node.js runtime AST evaluation (`RandomForestModel.js`)
* **Primary Objective:** Classifies pipe telemetry snapshots into `NORMAL`, `SUSPICIOUS`, or `LEAK`

---

## Input Features (`X ∈ ℝ⁵`)

| Index | Feature Name | Variable | Description & Physical Boundary |
| :---: | :--- | :---: | :--- |
| `0` | `flow_rate_lpm` | $Q$ | Instantaneous flow velocity in Liters per Minute ($0.0 \le Q \le 45.0$). |
| `1` | `rolling_mean_5m` | $\mu_Q$ | 20-snapshot ($5$-minute) rolling flow average in $\text{L/min}$. |
| `2` | `effective_std` | $\sigma_Q$ | Rolling standard deviation ($\sigma_Q \ge 0.02$). Measures flow turbulence. |
| `3` | `duration_minutes` | $t_{\text{active}}$ | Continuous active flow duration without returning to $0.0\text{ L/min}$. |
| `4` | `hour_of_day` | $H$ | Local Philippine Standard Time integer hour ($0\text{ to }23$). |

---

## Feature Importance (Gini Mean Decrease in Impurity)

1. **`duration_minutes` ($41.9\%$):** Primary discriminator. Domestic events rarely exceed 15 continuous minutes, while subterranean ruptures discharge indefinitely.
2. **`effective_std` ($31.9\%$):** Secondary discriminator. Domestic fixtures produce turbulent flow ($\sigma_Q > 0.25$), whereas pipe ruptures produce steady laminar flow ($\sigma_Q \le 0.08$).
3. **`rolling_mean_5m` ($13.8\%$):** Filters short sensor spikes.
4. **`flow_rate_lpm` ($12.1\%$):** Baseline volumetric velocity.
5. **`hour_of_day` ($0.2\%$):** Provides nocturnal prior weighting.

---

## Decision Threshold & Neyman-Pearson Strategy
* **Default Threshold:** $0.50$
* **Calibrated Operating Threshold ($\tau$):** **`0.40`**
* **Rationale:** Asymmetric cost matrix prioritizes **Recall ($\ge 90\%$)** over Precision. A missed subterranean leak causes catastrophic water loss and property damage, whereas a false alarm is safely triaged by human operators via Action Cards.

---

## Performance Summary (Held-Out Test Set $N = 1,500$)
* **ROC-AUC Score:** $1.0000$
* **Accuracy:** $100.0\%$
* **Recall (Sensitivity):** $100.0\%$ ($0$ False Negatives)
* **Precision:** $100.0\%$ ($0$ False Positives)
* **5-Fold Cross-Validation Accuracy:** $100.0\% \pm 0.0\%$
* **30% Sensor Noise Degradation Accuracy:** $> 94.0\%$