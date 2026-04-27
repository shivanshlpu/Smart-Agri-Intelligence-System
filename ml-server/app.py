"""
Smart Agri Intelligence — Python Flask ML Server
Team: Anti-Gravity Software | Shivansh Tiwari
Endpoints:
  GET  /health            → server status
  POST /predict/loss      → RandomForest classifier (Low/Medium/High risk)
  POST /predict/price     → XGBoost regressor (₹/quintal)
  POST /predict/supply    → K-Means clustering (efficiency label)
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_DIR = os.getenv("MODEL_DIR", "./saved_models")

# ─── Load Models ──────────────────────────────────────────────────
import joblib

def load_model(name):
    path = os.path.join(MODEL_DIR, name)
    if os.path.exists(path):
        return joblib.load(path)
    return None

loss_model   = load_model("loss_model.pkl")
price_model  = load_model("price_model.pkl")
supply_model = load_model("supply_model.pkl")
supply_scaler = load_model("supply_scaler.pkl")

# ─── Preprocessors ────────────────────────────────────────────────
from utils.preprocessor import preprocess_loss, preprocess_price, preprocess_supply

# ─── Routes ───────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "Smart Agri ML Server",
        "models": {
            "loss_model":  loss_model  is not None,
            "price_model": price_model is not None,
            "supply_model": supply_model is not None
        }
    })


@app.route("/predict/loss", methods=["POST"])
def predict_loss():
    try:
        data = request.json
        X = preprocess_loss(data)

        if loss_model is None:
            # Stub: return synthetic result when model not trained yet
            import random
            labels   = ["Low", "Medium", "High"]
            idx      = random.choices([0,1,2], weights=[0.4,0.35,0.25])[0]
            proba    = [round(random.uniform(0.05,0.2),2)] * 3
            proba[idx] = round(1 - sum(p for i,p in enumerate(proba) if i!=idx), 2)
            return jsonify({
                "prediction":    labels[idx],
                "probabilities": proba,
                "note":          "Stub result — train model with your dataset."
            })

        pred  = loss_model.predict(X)[0]
        proba = loss_model.predict_proba(X)[0].tolist()
        label_map = {0: "Low", 1: "Medium", 2: "High"}
        return jsonify({
            "prediction":    label_map[int(pred)],
            "probabilities": [round(p, 4) for p in proba]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/price", methods=["POST"])
def predict_price():
    try:
        data = request.json
        X = preprocess_price(data)

        if price_model is None:
            import random
            base = {"Wheat": 2200, "Rice": 1950, "Tomato": 800, "Onion": 1200,
                    "Potato": 600, "Maize": 1800, "Sugarcane": 350}.get(data.get("crop_type",""), 1500)
            noise = random.uniform(-200, 400)
            return jsonify({
                "predicted_price": round(base + noise, 2),
                "unit": "₹/Quintal",
                "note": "Stub result — train model with your dataset."
            })

        pred = price_model.predict(X)[0]
        predicted_price = max(round(float(pred), 2), 0)  # Never negative
        
        result = {"predicted_price": predicted_price, "unit": "₹/Quintal"}
        
        # Add note if min/max were auto-filled (user sent 0)
        min_sent = float(data.get("min_price", 0))
        max_sent = float(data.get("max_price", 0))
        if min_sent <= 0 or max_sent <= 0:
            result["note"] = "Market price estimates were used as you did not provide min/max prices. For more accurate results, enter current mandi prices."
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/supply", methods=["POST"])
def predict_supply():
    try:
        data = request.json
        X = preprocess_supply(data)

        if supply_model is None:
            import random
            cluster = random.randint(0, 2)
            efficiency = {0: "High Efficiency", 1: "Medium Efficiency", 2: "Low Efficiency"}
            return jsonify({
                "cluster":    cluster,
                "efficiency": efficiency[cluster],
                "note":       "Stub result — train model with your dataset."
            })

        if supply_scaler is not None:
            X = supply_scaler.transform(X)
        cluster = int(supply_model.predict(X)[0])
        efficiency = {0: "High Efficiency", 1: "Medium Efficiency", 2: "Low Efficiency"}
        return jsonify({"cluster": cluster, "efficiency": efficiency.get(cluster, "Unknown")})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8000))
    print(f"\n[ML] Smart Agri ML Server running on port {port}")
    print(f"[ML] Models loaded: loss={loss_model is not None}, price={price_model is not None}, supply={supply_model is not None}\n")
    app.run(host="0.0.0.0", port=port, debug=True)
