import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from scipy.stats import ks_2samp
import os

# Set visual style
sns.set_theme(style="whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

def generate_data(n_samples=1000, drift=False):
    """
    Simulates a loan approval dataset.
    Features: income, credit_score, debt_ratio
    Target: approved (0 or 1)
    """
    np.random.seed(42)
    
    # Base distributions
    income = np.random.normal(50000, 15000, n_samples)
    credit_score = np.random.normal(650, 100, n_samples)
    debt_ratio = np.random.beta(2, 5, n_samples) * 100
    
    if drift:
        # Simulate drift: Economy recession
        # Income drops, Credit Scores drop slightly, Debt Ratios rise
        income = np.random.normal(40000, 12000, n_samples)
        credit_score = np.random.normal(580, 120, n_samples)
        debt_ratio = np.random.beta(4, 4, n_samples) * 100
        
    df = pd.DataFrame({
        'income': income,
        'credit_score': credit_score,
        'debt_ratio': debt_ratio
    })
    
    # Simple logic for ground truth (re-used for training and comparison)
    # approved if income > 45k and credit_score > 600 and debt_ratio < 40
    df['approved'] = (
        (df['income'] > 45000) & 
        (df['credit_score'] > 600) & 
        (df['debt_ratio'] < 40)
    ).astype(int)
    
    return df

def calculate_ks_drift(reference, production):
    """Detects drift using Kolmogorov-Smirnov test."""
    results = {}
    for col in reference.columns:
        stat, p_value = ks_2samp(reference[col], production[col])
        results[col] = {
            'ks_stat': stat,
            'p_value': p_value,
            'drift_detected': p_value < 0.05
        }
    return results

def plot_drift(reference, production, feature_name, title):
    plt.figure()
    sns.kdeplot(reference[feature_name], label='Reference (Training)', fill=True, alpha=0.5)
    sns.kdeplot(production[feature_name], label='Production (Real-time)', fill=True, alpha=0.5)
    plt.title(f"Distribution Shift: {feature_name} ({title})")
    plt.legend()
    plt.savefig(f"{title}_{feature_name}_drift.png")
    plt.close()

def main():
    print("--- 🚀 Initializing Model Drift Monitoring Prototype ---")
    
    # 1. Training Phase
    print("\n[1/5] Training model on 'Source' data...")
    train_data = generate_data(n_samples=2000, drift=False)
    X = train_data[['income', 'credit_score', 'debt_ratio']]
    y = train_data['approved']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    baseline_acc = accuracy_score(y_test, model.predict(X_test))
    print(f"✅ Model Baseline Accuracy: {baseline_acc:.2f}")

    # 2. Production - Normal Operation
    print("\n[2/5] Simulating Phase 1: Normal Production Data...")
    normal_prod = generate_data(n_samples=500, drift=False)
    X_normal = normal_prod[['income', 'credit_score', 'debt_ratio']]
    y_normal = normal_prod['approved']
    
    normal_acc = accuracy_score(y_normal, model.predict(X_normal))
    print(f"📊 Production Accuracy (Normal): {normal_acc:.2f}")
    
    # 3. Production - Drifted Operation
    print("\n[3/5] Simulating Phase 2: Drifted Production Data (Market Shift)...")
    drifted_prod = generate_data(n_samples=500, drift=True)
    X_drifted = drifted_prod[['income', 'credit_score', 'debt_ratio']]
    y_drifted = drifted_prod['approved']
    
    drifted_acc = accuracy_score(y_drifted, model.predict(X_drifted))
    print(f"🚨 Production Accuracy (Drifted): {drifted_acc:.2f}")
    print(f"📉 PERFORMANCE DROP: {baseline_acc - drifted_acc:.2%}")

    # 4. Drift Detection (Feature Level)
    print("\n[4/5] Running Statistical Drift Detection (KS-Test)...")
    drift_results = calculate_ks_drift(X_train, X_drifted)
    
    for feature, metrics in drift_results.items():
        status = "❌ DRIFT DETECTED" if metrics['drift_detected'] else "✅ STABLE"
        print(f"Feature '{feature}': KS-Stat={metrics['ks_stat']:.3f}, P-Value={metrics['p_value']:.4f} -> {status}")
    
    # 5. Visualization
    print("\n[5/5] Generating Visualizations...")
    for feat in X_train.columns:
        plot_drift(X_train, X_drifted, feat, "Market_Recession")
    
    print("\n✨ Reports generated! Check png files for distribution shifts.")
    print("\n--- Summary ---")
    print("Silent drift occurred because the input feature distributions changed (Data Drift),")
    print("leading to a degradation in model accuracy even though the model itself didn't change.")

if __name__ == "__main__":
    main()
