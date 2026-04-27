"""
Preprocessor utilities for all three ML models.
UPDATED: Uses real feature sets from actual CSV training data.
"""
import numpy as np
import os
import joblib

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "saved_models")

# ── Load encoders if available ─────────────────────────────────
def _load(name):
    fp = os.path.join(MODEL_DIR, name)
    return joblib.load(fp) if os.path.exists(fp) else None

loss_feature_cols   = _load("loss_feature_cols.pkl")
price_feature_cols  = _load("price_feature_cols.pkl")
supply_feature_cols = _load("supply_feature_cols.pkl")

price_crop_encoder   = _load("price_crop_encoder.pkl")
price_state_encoder  = _load("price_state_encoder.pkl")
price_season_encoder = _load("price_season_encoder.pkl")
loss_label_encoder   = _load("loss_label_encoder.pkl")

# ── Fallback crop/storage maps ──────────────────────────────────
CROP_MAP_FALLBACK = {
    "Wheat": 0, "Rice": 1, "Tomato": 2, "Onion": 3, "Potato": 4,
    "Maize": 5, "Sugarcane": 6, "Cotton": 7, "Soybean": 8, "Groundnut": 9,
    "Bajra": 10, "Jowar": 11, "Barley": 12, "Mustard": 13
}
STORAGE_MAP = {"Cold Storage": 0, "Ambient": 1, "Open Shed": 2, "Warehouse": 3}
SEASON_MAP  = {"Kharif": 0, "Rabi": 1, "Zaid": 2}
DISEASE_MAP = {"None": 10, "none": 10, "Mild": 40, "mild": 40, "Moderate": 65, "moderate": 65, "Severe": 90, "severe": 90}


def preprocess_loss(data: dict) -> np.ndarray:
    """
    Real feature order (11 features):
    crop_type_enc, temperature, humidity, rainfall, ph, soil_moisture,
    crop_stress, ndvi, nitrogen, phosphorus, potassium
    """
    crop = data.get("crop_type", "Wheat")
    if loss_label_encoder is not None:
        try:
            crop_enc = loss_label_encoder.transform([crop.strip().title()])[0]
        except:
            crop_enc = 0
    else:
        crop_enc = CROP_MAP_FALLBACK.get(crop, 0)

    temperature   = float(data.get("temperature", 25))
    humidity      = float(data.get("humidity", 60))
    rainfall      = float(data.get("rainfall", 50))
    ph            = float(data.get("ph", 6.5))
    soil_moisture = float(data.get("soil_moisture", 30))
    crop_stress   = float(data.get("crop_stress",
                          DISEASE_MAP.get(data.get("storage_condition", "Mild"), 40)))
    ndvi          = float(data.get("ndvi", 0.5))
    nitrogen      = float(data.get("nitrogen", data.get("N", 50)))
    phosphorus    = float(data.get("phosphorus", data.get("P", 40)))
    potassium     = float(data.get("potassium", data.get("K", 40)))

    features = [crop_enc, temperature, humidity, rainfall, ph, soil_moisture,
                crop_stress, ndvi, nitrogen, phosphorus, potassium]

    # If feature_cols loaded, ensure correct count
    expected = len(loss_feature_cols) if loss_feature_cols else 11
    features = features[:expected]
    while len(features) < expected:
        features.append(0)

    return np.array([features])


# ── Crop-specific median prices (₹/quintal) for auto-fill when user sends 0 ──
CROP_MEDIAN_PRICES = {
    "Wheat": (1900, 2400), "Rice": (1700, 2100), "Tomato": (600, 1200),
    "Onion": (800, 1500), "Potato": (400, 800), "Maize": (1500, 2000),
    "Sugarcane": (280, 380), "Cotton": (5500, 7500), "Soybean": (3800, 5200),
    "Groundnut": (4800, 6500), "Bajra": (1600, 2200), "Jowar": (2000, 2800),
    "Barley": (1600, 2300), "Mustard": (4500, 5800), "Mango": (2500, 5500),
    "Apple": (5000, 9000), "Banana": (1000, 2000), "Chickpea": (4000, 5500),
    "Lentil": (5000, 7000), "Turmeric": (6000, 9000), "Chilli": (10000, 16000),
    "Ginger": (3500, 6500), "Garlic": (7000, 13000), "Coffee": (14000, 21000),
    "Tea": (9000, 19000), "Millet": (1700, 2600), "Watermelon": (500, 1500),
}

def preprocess_price(data: dict) -> np.ndarray:
    """
    Real feature order (9 features):
    crop_enc, state_enc, season_enc, month, year,
    min_price, max_price, avg_production, price_spread

    IMPORTANT: When min_price or max_price is 0 (farmer doesn't know),
    we auto-fill from crop-specific historical median values to prevent
    the model from predicting negative prices.
    """
    crop   = data.get("crop_type", "Wheat").strip().title()
    state  = data.get("state", "Maharashtra").strip().title()
    season = data.get("season", "Kharif").strip().title()

    # Encode using saved encoders
    if price_crop_encoder is not None:
        try: crop_enc = price_crop_encoder.transform([crop])[0]
        except: crop_enc = 0
    else:
        crop_enc = CROP_MAP_FALLBACK.get(crop, 0)

    if price_state_encoder is not None:
        try: state_enc = price_state_encoder.transform([state])[0]
        except: state_enc = 0
    else:
        state_enc = 0

    if price_season_encoder is not None:
        try: season_enc = price_season_encoder.transform([season])[0]
        except: season_enc = 0
    else:
        season_enc = SEASON_MAP.get(season, 0)

    import datetime
    month = int(data.get("month", datetime.datetime.now().month))
    year  = int(data.get("year", datetime.datetime.now().year))

    # Auto-fill min/max from historical medians when user sends 0
    default_min, default_max = CROP_MEDIAN_PRICES.get(crop, (1200, 2000))
    min_price = float(data.get("min_price", 0))
    max_price = float(data.get("max_price", 0))
    if min_price <= 0:
        min_price = float(default_min)
    if max_price <= 0:
        max_price = float(default_max)
    # Ensure max >= min
    if max_price < min_price:
        max_price = min_price * 1.2

    avg_production = float(data.get("avg_production", data.get("supply_index", 50)) or 50)
    price_spread   = max(max_price - min_price, 0)  # Never negative

    features = [crop_enc, state_enc, season_enc, month, year,
                min_price, max_price, avg_production, price_spread]

    expected = len(price_feature_cols) if price_feature_cols else 9
    features = features[:expected]
    while len(features) < expected:
        features.append(0)

    return np.array([features])


def preprocess_supply(data: dict) -> np.ndarray:
    """
    Real feature order (8 features):
    delivery_time, transport_cost, spoilage_rate, distance_km,
    delay_days, storage_availability, congestion_level, risk_level
    """
    delivery_time       = float(data.get("delivery_time", 12))
    transport_cost      = float(data.get("transport_cost", 500))
    spoilage_rate       = float(data.get("spoilage_rate", 10))
    distance_km         = float(data.get("distance_km", 100))
    delay_days          = float(data.get("delay_days", delivery_time * 0.3))
    storage_availability = 1.0 if data.get("storage_availability", True) in [True, "true", 1, "1", "yes"] else 0.0
    congestion_level    = float(data.get("congestion_level", 5))
    risk_level          = float(data.get("risk_level", 2))

    features = [delivery_time, transport_cost, spoilage_rate, distance_km,
                delay_days, storage_availability, congestion_level, risk_level]

    expected = len(supply_feature_cols) if supply_feature_cols else 8
    features = features[:expected]
    while len(features) < expected:
        features.append(0)

    return np.array([features])
