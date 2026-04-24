"""
Train Crop Price Forecasting Model (XGBoost Regressor)

Usage:
  python models/train_price_model.py

Reads: ../data/processed/price_data.csv
Saves: ../saved_models/price_model.pkl
"""
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
import joblib, os

DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/processed/price_data.csv")
SAVE_PATH = os.path.join(os.path.dirname(__file__), "../saved_models/price_model.pkl")

FEATURES = ["crop_type_enc", "season_enc", "state_enc",
            "demand_index", "supply_index", "temperature", "humidity"]
TARGET   = "modal_price"

# Base crop prices (₹/quintal) for synthetic generation
BASE_PRICES = {0:2200, 1:1950, 2:800, 3:1200, 4:600, 5:1800,
               6:350, 7:5500, 8:3800, 9:4200, 10:1600, 11:1400, 12:1700, 13:4800}

def generate_synthetic_data(n=3000):
    print("⚠️  No real dataset found. Generating synthetic price data...")
    np.random.seed(42)
    crop_enc   = np.random.randint(0, 14, n)
    season_enc = np.random.randint(0, 3, n)
    state_enc  = np.random.randint(0, 15, n)
    demand     = np.random.uniform(20, 100, n)
    supply     = np.random.uniform(20, 100, n)
    temp       = np.random.uniform(10, 45, n)
    humidity   = np.random.uniform(20, 90, n)
    base = np.array([BASE_PRICES.get(c, 1500) for c in crop_enc], dtype=float)
    price = base * (1 + (demand - supply) / 200) + np.random.normal(0, 100, n)
    price = np.clip(price, 100, 15000)
    return pd.DataFrame({
        "crop_type_enc": crop_enc, "season_enc": season_enc, "state_enc": state_enc,
        "demand_index": demand, "supply_index": supply,
        "temperature": temp, "humidity": humidity, "modal_price": price
    })

if os.path.exists(DATA_PATH):
    df = pd.read_csv(DATA_PATH)
    print(f"✅ Loaded dataset: {DATA_PATH} ({len(df)} rows)")
else:
    df = generate_synthetic_data()

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=6, random_state=42)
model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

y_pred = model.predict(X_test)
print(f"\n📊 MAE:  ₹{mean_absolute_error(y_test, y_pred):.2f}")
print(f"📊 R²:   {r2_score(y_test, y_pred):.4f}")

cv = cross_val_score(model, X, y, cv=5, scoring="r2")
print(f"📊 5-Fold CV R²: {cv.mean():.4f} ± {cv.std():.4f}")

os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)
joblib.dump(model, SAVE_PATH)
print(f"\n✅ Model saved → {SAVE_PATH}")
