"""
Smart Agri Intelligence System -- REAL DATA Processing & Model Training
Team: Anti-Gravity Software | Shivansh Tiwari

This script:
  1. Reads all CSV datasets from the project folder
  2. Cleans, merges, and feature-engineers 3 processed datasets
  3. Trains 3 ML models with REAL data
  4. Saves .pkl models + processed CSVs

Usage:  python process_and_train.py
"""

import pandas as pd
import numpy as np
import os
import sys
import warnings
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score, mean_absolute_error, r2_score, silhouette_score
from sklearn.cluster import KMeans
from xgboost import XGBRegressor
import joblib

warnings.filterwarnings("ignore")

# ---- Paths ----
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
DATA_DIR      = os.path.join(BASE_DIR, "..", "..")  # points to 'CSE274 project'
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
MODEL_DIR     = os.path.join(BASE_DIR, "saved_models")

os.makedirs(PROCESSED_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

def safe_read(filename, **kwargs):
    fp = os.path.join(DATA_DIR, filename)
    if not os.path.exists(fp):
        print(f"  [SKIP] File not found: {filename}")
        return None
    try:
        df = pd.read_csv(fp, encoding="utf-8", on_bad_lines="skip", **kwargs)
    except:
        df = pd.read_csv(fp, encoding="latin1", on_bad_lines="skip", **kwargs)
    print(f"  [OK] Loaded {filename}: {df.shape[0]} rows x {df.shape[1]} cols")
    return df


###############################################################################
# MODEL 1 -- Post-Harvest Loss Classification (RandomForest)
###############################################################################
def train_loss_model():
    print("\n" + "="*70)
    print("MODEL 1 -- Post-Harvest Loss Classification (RandomForest)")
    print("="*70)

    df1 = safe_read("agriculture_dataset 2.csv")
    df2 = safe_read("Smart_Farming_Crop_Yield_2024.csv")
    df3 = safe_read("Crop_recommendation.csv")

    # ---- Process agriculture_dataset 2 ----
    if df1 is not None:
        cols1 = {
            "Crop_Type": "crop_type", "Temperature": "temperature",
            "Humidity": "humidity", "Rainfall": "rainfall",
            "Soil_pH": "ph", "Soil_Moisture": "soil_moisture",
            "Crop_Stress_Indicator": "crop_stress",
            "Pest_Damage": "pest_damage", "NDVI": "ndvi",
            "Expected_Yield": "expected_yield",
            "Crop_Health_Label": "health_label",
            "Wind_Speed": "wind_speed",
        }
        df1_clean = df1.rename(columns=cols1)
        df1_clean = df1_clean[[c for c in cols1.values() if c in df1_clean.columns]].copy()
        print(f"  Primary dataset cleaned: {df1_clean.shape}")
    else:
        df1_clean = pd.DataFrame()

    # ---- Process Smart_Farming ----
    if df2 is not None:
        cols2 = {
            "crop_type": "crop_type", "temperature_C": "temperature",
            "humidity_%": "humidity", "rainfall_mm": "rainfall",
            "soil_pH": "ph", "soil_moisture_%": "soil_moisture",
            "total_days": "total_days", "crop_disease_status": "disease_status",
            "NDVI_index": "ndvi",
        }
        df2_clean = df2.rename(columns=cols2)
        df2_clean = df2_clean[[c for c in cols2.values() if c in df2_clean.columns]].copy()
        if "disease_status" in df2_clean.columns:
            disease_map = {"None": 10, "Mild": 40, "Moderate": 65, "Severe": 90}
            df2_clean["crop_stress"] = df2_clean["disease_status"].map(disease_map).fillna(50)
        print(f"  Secondary dataset cleaned: {df2_clean.shape}")
    else:
        df2_clean = pd.DataFrame()

    # ---- Process Crop_recommendation ----
    if df3 is not None:
        cols3 = {
            "label": "crop_type", "temperature": "temperature",
            "humidity": "humidity", "rainfall": "rainfall",
            "ph": "ph", "N": "nitrogen", "P": "phosphorus", "K": "potassium"
        }
        df3_clean = df3.rename(columns=cols3)
        df3_clean = df3_clean[[c for c in cols3.values() if c in df3_clean.columns]].copy()
        df3_clean["crop_type"] = df3_clean["crop_type"].str.strip().str.title()
        print(f"  Support dataset cleaned: {df3_clean.shape}")
    else:
        df3_clean = pd.DataFrame()

    # ---- Merge ----
    frames = [f for f in [df1_clean, df2_clean] if not f.empty]
    if not frames:
        print("  [ERROR] No loss datasets found!")
        return

    merged = pd.concat(frames, ignore_index=True)
    merged["crop_type"] = merged["crop_type"].astype(str).str.strip().str.title()

    if not df3_clean.empty:
        npk_means = df3_clean.groupby("crop_type")[["nitrogen","phosphorus","potassium"]].mean().reset_index()
        merged = merged.merge(npk_means, on="crop_type", how="left")

    # ---- Create loss_category label ----
    merged["temperature"] = pd.to_numeric(merged.get("temperature"), errors="coerce")
    merged["humidity"]    = pd.to_numeric(merged.get("humidity"), errors="coerce")
    stress = merged.get("crop_stress", pd.Series(50, index=merged.index)).fillna(50).astype(float)
    ndvi   = merged.get("ndvi", pd.Series(0.5, index=merged.index)).fillna(0.5).astype(float)
    
    env_score = (
        (merged["temperature"] > 32).astype(int) +
        (merged["humidity"] > 75).astype(int) +
        (stress > 50).astype(int) +
        (ndvi < 0.4).astype(int)
    )
    
    loss_cat = pd.Series(1, index=merged.index)
    if "health_label" in merged.columns:
        hl = pd.to_numeric(merged["health_label"], errors="coerce")
        loss_cat = np.where(
            (hl == 1) & (env_score <= 1), 0,
            np.where(
                (hl == 0) & (env_score >= 3), 2,
                1
            )
        )
        loss_cat = pd.Series(loss_cat, index=merged.index)
    
    if "disease_status" in merged.columns:
        dmap = {"None": 0, "Mild": 0, "Moderate": 1, "Severe": 2}
        ds = merged["disease_status"].map(dmap)
        loss_cat = ds.combine_first(loss_cat)
        
    merged["loss_category"] = loss_cat.fillna(1).astype(int)

    le_crop = LabelEncoder()
    merged["crop_type_enc"] = le_crop.fit_transform(merged["crop_type"].fillna("Unknown"))

    feature_cols = ["crop_type_enc", "temperature", "humidity"]
    for c in ["rainfall", "ph", "soil_moisture", "crop_stress", "ndvi", "nitrogen", "phosphorus", "potassium"]:
        if c in merged.columns:
            feature_cols.append(c)

    merged[feature_cols] = merged[feature_cols].apply(pd.to_numeric, errors="coerce")
    clean = merged.dropna(subset=feature_cols + ["loss_category"])
    print(f"\n  Final loss dataset: {clean.shape[0]} rows, {len(feature_cols)} features")
    print(f"  Loss distribution: {dict(clean['loss_category'].value_counts().sort_index())}")

    save_cols = feature_cols + ["loss_category"]
    clean[save_cols].to_csv(os.path.join(PROCESSED_DIR, "loss_data.csv"), index=False)

    # ---- TRAIN ----
    X = clean[feature_cols].values
    y = clean["loss_category"].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n  Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["Low","Medium","High"]))

    cv = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"  5-Fold CV Accuracy: {cv.mean():.4f} +/- {cv.std():.4f}")

    joblib.dump(model, os.path.join(MODEL_DIR, "loss_model.pkl"))
    joblib.dump(le_crop, os.path.join(MODEL_DIR, "loss_label_encoder.pkl"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "loss_feature_cols.pkl"))
    print(f"  Saved: saved_models/loss_model.pkl")


###############################################################################
# MODEL 2 -- Crop Price Prediction (XGBoost Regressor)
###############################################################################
def train_price_model():
    print("\n" + "="*70)
    print("MODEL 2 -- Crop Price Prediction (XGBoost Regressor)")
    print("="*70)

    df1 = safe_read("Agriculture_price_dataset.csv")
    df2 = safe_read("India Agriculture Crop Production.csv")
    df4 = safe_read("dataset.csv")  # NEW: State-crop-price data

    if df1 is None:
        print("  [ERROR] Agriculture_price_dataset.csv not found!")
        return

    # ---- Clean price data ----
    df1.columns = df1.columns.str.strip()
    price = df1.rename(columns={
        "STATE": "state", "Commodity": "crop_name",
        "Min_Price": "min_price", "Max_Price": "max_price",
        "Modal_Price": "modal_price", "Price Date": "date",
        "District Name": "district", "Market Name": "market",
    })

    price = price.dropna(subset=["modal_price", "crop_name", "state"])
    price["modal_price"] = pd.to_numeric(price["modal_price"], errors="coerce")
    price["min_price"]   = pd.to_numeric(price["min_price"], errors="coerce")
    price["max_price"]   = pd.to_numeric(price["max_price"], errors="coerce")
    price = price.dropna(subset=["modal_price"])
    price = price[price["modal_price"] > 0]

    price["date"] = pd.to_datetime(price["date"], format="mixed", dayfirst=True, errors="coerce")
    price["month"] = price["date"].dt.month.fillna(6).astype(int)
    price["year"]  = price["date"].dt.year.fillna(2023).astype(int)

    def get_season(m):
        if m in [6,7,8,9,10]: return "Kharif"
        elif m in [11,12,1,2,3]: return "Rabi"
        else: return "Zaid"
    price["season"] = price["month"].apply(get_season)

    price["crop_name"] = price["crop_name"].str.strip().str.title()
    price["state"]     = price["state"].str.strip().str.title()

    # ---- Integrate dataset.csv (State-crop-price supplement) ----
    if df4 is not None:
        df4.columns = df4.columns.str.strip()
        sup = df4.rename(columns={
            "State": "state", "Crop": "crop_name", "Price": "modal_price",
            "Production": "production", "Yield": "yield_val",
            "Temperature": "temperature", "RainFall Annual": "rainfall",
        })
        sup["crop_name"] = sup["crop_name"].str.strip().str.title()
        sup["state"]     = sup["state"].str.strip().str.title()
        sup["modal_price"] = pd.to_numeric(sup["modal_price"], errors="coerce")
        sup = sup.dropna(subset=["modal_price", "crop_name", "state"])
        sup = sup[sup["modal_price"] > 0]
        sup["month"] = 6  # default mid-year
        sup["year"]  = 2023
        sup["season"] = "Kharif"
        sup["min_price"] = sup["modal_price"] * 0.85
        sup["max_price"] = sup["modal_price"] * 1.15
        # Keep only columns that match
        common_cols = [c for c in price.columns if c in sup.columns]
        price = pd.concat([price[common_cols], sup[common_cols]], ignore_index=True)
        print(f"  Integrated dataset.csv: +{len(sup)} rows")

    # Encode
    le_crop  = LabelEncoder()
    le_state = LabelEncoder()
    le_season = LabelEncoder()
    price["crop_enc"]   = le_crop.fit_transform(price["crop_name"])
    price["state_enc"]  = le_state.fit_transform(price["state"])
    price["season_enc"] = le_season.fit_transform(price["season"])

    # ---- Merge production volume ----
    if df2 is not None:
        df2.columns = df2.columns.str.strip()
        prod = df2.rename(columns={"Crop": "crop_name", "State": "state", "Season": "season", "Production": "production"})
        prod["crop_name"] = prod["crop_name"].str.strip().str.title()
        prod["state"]     = prod["state"].str.strip().str.title()
        prod["production"] = pd.to_numeric(prod["production"], errors="coerce")
        prod_agg = prod.groupby(["crop_name", "state"])["production"].mean().reset_index()
        prod_agg.rename(columns={"production": "avg_production"}, inplace=True)
        price = price.merge(prod_agg, on=["crop_name", "state"], how="left")
        price["avg_production"] = price["avg_production"].fillna(price["avg_production"].median())
        print(f"  Merged production volumes from India Agriculture Crop Production")
    else:
        price["avg_production"] = 0

    # ---- Sample for training ----
    if len(price) > 100000:
        price = price.sample(100000, random_state=42)
        print(f"  Sampled 100,000 rows for training")

    feature_cols = ["crop_enc", "state_enc", "season_enc", "month", "year", "avg_production"]
    target = "modal_price"

    clean = price.dropna(subset=feature_cols + [target])
    print(f"\n  Final price dataset: {clean.shape[0]} rows, {len(feature_cols)} features")
    print(f"  Price range: Rs.{clean[target].min():.0f} — Rs.{clean[target].max():.0f}")
    print(f"  Unique crops: {clean['crop_name'].nunique()}, Unique states: {clean['state'].nunique()}")

    save_df = clean[feature_cols + [target, "crop_name", "state", "season"]].copy()
    save_df.to_csv(os.path.join(PROCESSED_DIR, "price_data.csv"), index=False)

    # ---- TRAIN ----
    X = clean[feature_cols].values
    y = clean[target].values
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=7, random_state=42,
                         tree_method="hist")
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    print(f"\n  MAE:  Rs.{mae:.2f}")
    print(f"  R2:   {r2:.4f}")

    cv = cross_val_score(model, X, y, cv=3, scoring="r2")
    print(f"  3-Fold CV R2: {cv.mean():.4f} +/- {cv.std():.4f}")

    joblib.dump(model, os.path.join(MODEL_DIR, "price_model.pkl"))
    joblib.dump(le_crop, os.path.join(MODEL_DIR, "price_crop_encoder.pkl"))
    joblib.dump(le_state, os.path.join(MODEL_DIR, "price_state_encoder.pkl"))
    joblib.dump(le_season, os.path.join(MODEL_DIR, "price_season_encoder.pkl"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "price_feature_cols.pkl"))
    print(f"  Saved: saved_models/price_model.pkl + encoders")


###############################################################################
# MODEL 3 -- Supply Chain Efficiency Clustering (K-Means)
###############################################################################
def train_supply_model():
    print("\n" + "="*70)
    print("MODEL 3 -- Supply Chain Efficiency Clustering (K-Means)")
    print("="*70)

    df1 = safe_read("dynamic_supply_chain_logistics_dataset.csv")
    df2 = safe_read("smart_logistics_dataset.csv")
    # NOTE: supply_chain_data.csv REMOVED — contains non-agricultural products

    frames = []

    # ---- Process dynamic supply chain (primary — real logistics data) ----
    if df1 is not None:
        d1 = pd.DataFrame()
        d1["delivery_time"]        = np.clip(pd.to_numeric(df1.get("lead_time_days"), errors="coerce"), 1, 30)
        # Use shipping_costs directly as transport_cost (real data)
        d1["transport_cost"]       = np.clip(pd.to_numeric(df1.get("shipping_costs"), errors="coerce"), 50, 50000)
        # Derive distance from eta_variation and delivery time
        eta_var = pd.to_numeric(df1.get("eta_variation_hours"), errors="coerce").fillna(2)
        d1["distance_km"]          = np.clip(d1["delivery_time"] * 80 + eta_var * 30, 50, 2000)
        d1["spoilage_rate"]        = np.clip(pd.to_numeric(df1.get("delay_probability"), errors="coerce") * 20, 0, 25)
        d1["delay_days"]           = np.clip(pd.to_numeric(df1.get("delivery_time_deviation"), errors="coerce"), 0, 10)
        d1["storage_availability"] = (pd.to_numeric(df1.get("warehouse_inventory_level"), errors="coerce") > 500).astype(float)
        d1["congestion_level"]     = np.clip(pd.to_numeric(df1.get("traffic_congestion_level"), errors="coerce"), 1, 10)
        d1["risk_level"]           = np.clip(pd.to_numeric(df1.get("route_risk_level"), errors="coerce"), 1, 10)
        frames.append(d1)
        print(f"  Dynamic logistics: {d1.shape}")

    # ---- Process smart_logistics (secondary) ----
    if df2 is not None:
        d2 = pd.DataFrame()
        waiting = pd.to_numeric(df2.get("Waiting_Time"), errors="coerce").fillna(24)
        d2["delivery_time"]        = np.clip(waiting / 24, 1, 30)
        # Derive distance from demand forecast and inventory
        demand = pd.to_numeric(df2.get("Demand_Forecast"), errors="coerce").fillna(200)
        d2["distance_km"]          = np.clip(demand * 2 + waiting * 5, 50, 2000)
        # Derive transport cost from distance and asset utilization
        asset_util = pd.to_numeric(df2.get("Asset_Utilization"), errors="coerce").fillna(50)
        d2["transport_cost"]       = np.clip(d2["distance_km"] * (12 - asset_util / 15), 100, 50000)
        logistics_delay = pd.to_numeric(df2.get("Logistics_Delay"), errors="coerce").fillna(0)
        d2["spoilage_rate"]        = np.clip(logistics_delay * 3 + waiting / 24 * 1.5, 0, 25)
        d2["delay_days"]           = np.clip(waiting / 24 * 0.3 + logistics_delay * 1.5, 0, 10)
        d2["storage_availability"] = (pd.to_numeric(df2.get("Inventory_Level"), errors="coerce") > 300).astype(float)
        # Derive congestion from traffic status
        traffic_map = {"Clear": 2, "Moderate": 5, "Heavy": 8, "Detour": 7}
        if "Traffic_Status" in df2.columns:
            d2["congestion_level"] = df2["Traffic_Status"].map(traffic_map).fillna(5)
        else:
            d2["congestion_level"] = 5.0
        d2["risk_level"]           = np.clip(asset_util / 10, 1, 10)
        frames.append(d2)
        print(f"  Smart logistics: {d2.shape}")

    if not frames:
        print("  [ERROR] No supply chain datasets found!")
        return

    merged = pd.concat(frames, ignore_index=True)

    feature_cols = ["delivery_time", "transport_cost", "spoilage_rate", "distance_km",
                    "delay_days", "storage_availability", "congestion_level", "risk_level"]

    merged[feature_cols] = merged[feature_cols].apply(pd.to_numeric, errors="coerce")
    clean = merged.dropna(subset=feature_cols)

    if len(clean) > 50000:
        clean = clean.sample(50000, random_state=42)
        print(f"  Sampled 50,000 rows for clustering")

    print(f"\n  Final supply dataset: {clean.shape[0]} rows, {len(feature_cols)} features")

    # ---- Logical Scoring & Classification ----
    cost_per_km = clean["transport_cost"] / clean["distance_km"].clip(lower=1)
    score = clean["delivery_time"] + (clean["delay_days"] * 2) + (clean["spoilage_rate"] * 2) + (cost_per_km * 5)
    
    clean["cluster"] = pd.qcut(score, q=3, labels=[0, 1, 2]).astype(int)
    
    efficiency_map = {0: "High Efficiency", 1: "Medium Efficiency", 2: "Low Efficiency"}
    clean["efficiency"] = clean["cluster"].map(efficiency_map)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(clean[feature_cols])

    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression(random_state=42, max_iter=1000)
    clf.fit(X_scaled, clean["cluster"])

    y_pred = clf.predict(X_scaled)
    acc = accuracy_score(clean["cluster"], y_pred)
    print(f"  Training Accuracy: {acc:.4f}")
    print(f"  Cluster distribution: {dict(clean['cluster'].value_counts().sort_index())}")

    clean[feature_cols + ["cluster", "efficiency"]].to_csv(
        os.path.join(PROCESSED_DIR, "supply_data.csv"), index=False
    )

    joblib.dump(clf, os.path.join(MODEL_DIR, "supply_model.pkl"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "supply_scaler.pkl"))
    joblib.dump(feature_cols, os.path.join(MODEL_DIR, "supply_feature_cols.pkl"))
    print(f"  Saved: saved_models/supply_model.pkl + supply_scaler.pkl")


###############################################################################
# MAIN
###############################################################################
if __name__ == "__main__":
    print("=" * 70)
    print("SMART AGRI INTELLIGENCE -- REAL DATA PROCESSING & TRAINING")
    print("Team: Anti-Gravity Software | Shivansh Tiwari")
    print("=" * 70)

    train_loss_model()
    train_price_model()
    train_supply_model()

    print("\n" + "=" * 70)
    print("ALL 3 MODELS TRAINED WITH REAL DATA!")
    print("=" * 70)
    print(f"\nProcessed data: {PROCESSED_DIR}")
    print(f"Saved models:   {MODEL_DIR}")
    for f in os.listdir(MODEL_DIR):
        fp = os.path.join(MODEL_DIR, f)
        print(f"  {f}: {os.path.getsize(fp)//1024} KB")
    print("\nRestart Flask server (python app.py) to use new models!")
