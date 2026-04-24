"""
Train Supply Chain Efficiency Clustering Model (K-Means)

Usage:
  python models/train_supply_model.py

Reads: ../data/processed/supply_data.csv
Saves: ../saved_models/supply_model.pkl
       ../saved_models/supply_scaler.pkl
"""
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import joblib, os

DATA_PATH  = os.path.join(os.path.dirname(__file__), "../data/processed/supply_data.csv")
MODEL_SAVE = os.path.join(os.path.dirname(__file__), "../saved_models/supply_model.pkl")
SCALER_SAVE = os.path.join(os.path.dirname(__file__), "../saved_models/supply_scaler.pkl")

FEATURES = ["delivery_time", "transport_cost", "storage_availability", "distance_km", "spoilage_rate"]

def generate_synthetic_data(n=2000):
    print("⚠️  No real dataset found. Generating synthetic supply chain data...")
    np.random.seed(42)
    # High efficiency cluster
    h = pd.DataFrame({
        "delivery_time": np.random.uniform(4,12,n//3),
        "transport_cost": np.random.uniform(100,400,n//3),
        "storage_availability": np.ones(n//3),
        "distance_km": np.random.uniform(10,100,n//3),
        "spoilage_rate": np.random.uniform(1,8,n//3),
    })
    # Medium efficiency
    m = pd.DataFrame({
        "delivery_time": np.random.uniform(12,24,n//3),
        "transport_cost": np.random.uniform(400,800,n//3),
        "storage_availability": np.random.randint(0,2,n//3).astype(float),
        "distance_km": np.random.uniform(100,300,n//3),
        "spoilage_rate": np.random.uniform(8,20,n//3),
    })
    # Low efficiency
    l = pd.DataFrame({
        "delivery_time": np.random.uniform(24,72,n//3),
        "transport_cost": np.random.uniform(800,2000,n//3),
        "storage_availability": np.zeros(n//3),
        "distance_km": np.random.uniform(300,600,n//3),
        "spoilage_rate": np.random.uniform(20,50,n//3),
    })
    return pd.concat([h, m, l], ignore_index=True)

if os.path.exists(DATA_PATH):
    df = pd.read_csv(DATA_PATH)
    print(f"✅ Loaded dataset: {DATA_PATH} ({len(df)} rows)")
else:
    df = generate_synthetic_data()

X = df[FEATURES]

scaler  = StandardScaler()
X_scaled = scaler.fit_transform(X)

kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans.fit(X_scaled)

score = silhouette_score(X_scaled, kmeans.labels_)
print(f"\n📊 Silhouette Score: {score:.4f}")
print(f"📊 Cluster distribution: {np.bincount(kmeans.labels_)}")

os.makedirs(os.path.dirname(MODEL_SAVE), exist_ok=True)
joblib.dump(kmeans,  MODEL_SAVE)
joblib.dump(scaler,  SCALER_SAVE)
print(f"\n✅ supply_model.pkl  → {MODEL_SAVE}")
print(f"✅ supply_scaler.pkl → {SCALER_SAVE}")
