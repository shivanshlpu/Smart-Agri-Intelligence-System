"""
Train Post-Harvest Loss Prediction Model (RandomForest Classifier)
Labels: 0=Low, 1=Medium, 2=High

Usage:
  python models/train_loss_model.py

Reads: ../data/processed/loss_data.csv
Saves: ../saved_models/loss_model.pkl
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib, os, sys

DATA_PATH  = os.path.join(os.path.dirname(__file__), "../data/processed/loss_data.csv")
SAVE_PATH  = os.path.join(os.path.dirname(__file__), "../saved_models/loss_model.pkl")

FEATURES = ["crop_type_enc", "temperature", "humidity",
            "storage_condition_enc", "transport_time", "distance_to_market"]
TARGET   = "loss_category"

def generate_synthetic_data(n=2000):
    """Generate synthetic training data if real CSV not available."""
    print("⚠️  No real dataset found. Generating synthetic training data...")
    np.random.seed(42)
    df = pd.DataFrame({
        "crop_type_enc":        np.random.randint(0, 14, n),
        "temperature":          np.random.uniform(10, 45, n),
        "humidity":             np.random.uniform(20, 95, n),
        "storage_condition_enc": np.random.randint(0, 4, n),
        "transport_time":       np.random.uniform(1, 48, n),
        "distance_to_market":  np.random.uniform(5, 500, n),
    })
    # Rule-based labels for realistic synthetic data
    risk = (
        (df["temperature"] > 35).astype(int) +
        (df["humidity"] > 75).astype(int) +
        (df["transport_time"] > 24).astype(int) +
        (df["storage_condition_enc"] >= 2).astype(int)
    )
    df["loss_category"] = pd.cut(risk, bins=[-1,1,2,4], labels=[0,1,2]).astype(int)
    return df

if os.path.exists(DATA_PATH):
    df = pd.read_csv(DATA_PATH)
    print(f"✅ Loaded dataset: {DATA_PATH} ({len(df)} rows)")
else:
    df = generate_synthetic_data()

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"\n📊 Test Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"📊 Classification Report:\n{classification_report(y_test, y_pred, target_names=['Low','Medium','High'])}")

cv = cross_val_score(model, X, y, cv=5, scoring="accuracy")
print(f"📊 5-Fold CV Accuracy: {cv.mean():.4f} ± {cv.std():.4f}")

os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
joblib.dump(model, SAVE_PATH)
print(f"\n✅ Model saved → {SAVE_PATH}")
