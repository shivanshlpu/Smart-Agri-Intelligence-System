"""
Smart Agri Intelligence — Python Flask ML Server
Team: Anti-Gravity Software | Shivansh Tiwari
Endpoints:
  GET  /health            → server status
  POST /predict/loss      → RandomForest classifier (Low/Medium/High risk)
  POST /predict/price     → XGBoost regressor (₹/quintal) + monthly forecast
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

# ─── MSP Reference (₹/quintal, 2024-25 Govt rates) ───────────────
MSP_DATA = {
    "Wheat": 2275, "Rice": 2300, "Maize": 2090, "Bajra": 2500, "Jowar": 3371,
    "Barley": 1850, "Mustard": 5650, "Soybean": 4892, "Groundnut": 6377,
    "Cotton": 7020, "Sugarcane": 340, "Chickpea": 5440, "Lentil": 6425,
    "Turmeric": 7700, "Chilli": 13500,
}

# ─── Month names (bilingual) ─────────────────────────────────────
MONTH_NAMES_EN = ["", "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"]
MONTH_NAMES_HI = ["", "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
                  "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"]

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
        pred_label = label_map[int(pred)]
        
        recs_en = []
        recs_hi = []
        if pred_label == "High":
            recs_en = ["Use cold storage immediately", "Sell within 48 hours", "Contact nearest FPO cold chain facility"]
            recs_hi = ["तुरंत कोल्ड स्टोरेज का उपयोग करें", "48 घंटों के भीतर बेच दें", "निकटतम FPO कोल्ड चेन सुविधा से संपर्क करें"]
        elif pred_label == "Medium":
            recs_en = ["Monitor storage conditions", "Consider selling within 1 week", "Ensure proper ventilation"]
            recs_hi = ["भंडारण की स्थिति पर नजर रखें", "1 सप्ताह के भीतर बेचने पर विचार करें", "उचित वेंटिलेशन सुनिश्चित करें"]
        else:
            recs_en = ["Optimal storage conditions", "Standard shelf life expected", "No immediate action required"]
            recs_hi = ["इष्टतम भंडारण की स्थिति", "मानक शेल्फ जीवन की उम्मीद है", "तत्काल कार्रवाई की आवश्यकता नहीं है"]

        return jsonify({
            "prediction":    pred_label,
            "probabilities": [round(p, 4) for p in proba],
            "recommendations": recs_en,
            "recommendations_hi": recs_hi
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/price", methods=["POST"])
def predict_price():
    try:
        data = request.json
        X = preprocess_price(data)
        crop = data.get("crop_type", "Wheat").strip().title()
        month = int(data.get("month", 6))
        state = data.get("state", "Uttar Pradesh").strip().title()

        if price_model is None:
            import random
            base = {"Wheat": 2200, "Rice": 1950, "Tomato": 800, "Onion": 1200,
                    "Potato": 600, "Maize": 1800, "Sugarcane": 350}.get(crop, 1500)
            noise = random.uniform(-200, 400)
            return jsonify({
                "predicted_price": round(base + noise, 2),
                "unit": "₹/Quintal",
                "note": "Stub result — train model with your dataset."
            })

        pred = price_model.predict(X)[0]
        predicted_price = max(round(float(pred), 2), 0)

        # ── Monthly price forecast (predict for all 12 months) ────
        monthly_prices = []
        for m in range(1, 13):
            month_data = data.copy()
            month_data["month"] = m
            # Determine season from month
            if m in [6,7,8,9,10]:
                month_data["season"] = "Kharif"
            elif m in [11,12,1,2,3]:
                month_data["season"] = "Rabi"
            else:
                month_data["season"] = "Zaid"
            X_m = preprocess_price(month_data)
            p_m = max(round(float(price_model.predict(X_m)[0]), 2), 0)
            monthly_prices.append({
                "month": m,
                "month_en": MONTH_NAMES_EN[m],
                "month_hi": MONTH_NAMES_HI[m],
                "price": p_m
            })

        # Find best month to sell
        best_entry = max(monthly_prices, key=lambda x: x["price"])
        best_month = best_entry["month"]
        best_price = best_entry["price"]
        current_price = predicted_price
        price_diff = best_price - current_price
        months_to_wait = (best_month - month) % 12
        if months_to_wait == 0:
            months_to_wait = 0

        # MSP data
        msp = MSP_DATA.get(crop, None)

        # ── Generate professional bilingual sell/hold advisory ────
        recs_en = []
        recs_hi = []

        if months_to_wait == 0 or price_diff <= 50:
            # Current month IS the best month or near-best
            recs_en.append(f"📈 This is the best time to sell {crop}! Current estimated price ₹{current_price:,.0f}/Qtl is at its peak.")
            recs_hi.append(f"📈 यह {crop} बेचने का सबसे अच्छा समय है! अभी अनुमानित भाव ₹{current_price:,.0f}/क्विंटल सबसे ज़्यादा है।")
            recs_en.append("🏪 Sell at your nearest mandi or through e-NAM portal for best price discovery.")
            recs_hi.append("🏪 बेहतर भाव के लिए अपनी नज़दीकी मंडी या e-NAM पोर्टल पर बेचें।")
        else:
            recs_en.append(f"⏳ DO NOT sell now! Wait until {MONTH_NAMES_EN[best_month]} — you can get ₹{best_price:,.0f}/Qtl (₹{price_diff:,.0f} more than today's ₹{current_price:,.0f}).")
            recs_hi.append(f"⏳ अभी न बेचें! {MONTH_NAMES_HI[best_month]} तक रुकें — आपको ₹{best_price:,.0f}/क्विंटल मिलेगा (आज के ₹{current_price:,.0f} से ₹{price_diff:,.0f} ज़्यादा)।")
            recs_en.append(f"📦 Store your {crop} safely for {months_to_wait} month(s). Use cold storage or proper warehouse to prevent spoilage.")
            recs_hi.append(f"📦 अपनी {crop} को {months_to_wait} महीने सुरक्षित रखें। खराबी से बचने के लिए कोल्ड स्टोरेज या गोदाम का उपयोग करें।")

        if msp:
            if current_price < msp:
                recs_en.append(f"🏛️ Current price is below MSP (₹{msp:,}/Qtl). You can sell to government at MSP through your nearest procurement center.")
                recs_hi.append(f"🏛️ अभी का भाव MSP (₹{msp:,}/क्विंटल) से कम है। आप सरकारी खरीद केंद्र पर MSP पर बेच सकते हैं।")
            else:
                recs_en.append(f"✅ Price is above MSP (₹{msp:,}/Qtl). Open market sale is profitable.")
                recs_hi.append(f"✅ भाव MSP (₹{msp:,}/क्विंटल) से ज़्यादा है। खुले बाज़ार में बेचना फ़ायदेमंद है।")

        recs_en.append("📱 Monitor daily prices on Agmarknet (agmarknet.gov.in) or e-NAM app before selling.")
        recs_hi.append("📱 बेचने से पहले Agmarknet (agmarknet.gov.in) या e-NAM ऐप पर रोज़ भाव देखें।")

        if current_price > 5000:
            recs_en.append("🌍 Consider export via APEDA if you have large quantity. Export prices may be even higher.")
            recs_hi.append("🌍 अगर आपके पास बड़ी मात्रा है तो APEDA के ज़रिए निर्यात पर विचार करें। निर्यात भाव और भी ज़्यादा हो सकते हैं।")

        result = {
            "predicted_price": predicted_price,
            "unit": "₹/Quintal",
            "monthly_prices": monthly_prices,
            "best_month": best_month,
            "best_month_en": MONTH_NAMES_EN[best_month],
            "best_month_hi": MONTH_NAMES_HI[best_month],
            "best_price": best_price,
            "current_month": month,
            "msp": msp,
            "recommendations": recs_en,
            "recommendations_hi": recs_hi
        }
        
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
        efficiency_map = {0: "High Efficiency", 1: "Medium Efficiency", 2: "Low Efficiency"}
        eff_label = efficiency_map.get(cluster, "Unknown")

        # ── Input-aware professional suggestions ──────────────────
        delivery_time = float(data.get("delivery_time", 5))
        transport_cost = float(data.get("transport_cost", 500))
        distance_km = float(data.get("distance_km", 100))
        spoilage_rate = float(data.get("spoilage_rate", 5))
        delay_days = float(data.get("delay_days", 0))
        storage_avail = data.get("storage_availability", True)
        congestion = float(data.get("congestion_level", 5))

        cost_per_km = transport_cost / max(distance_km, 1)
        avg_cost_per_km = 8.0  # national avg ₹8/km for agri transport

        recs_en = []
        recs_hi = []

        if "Low" in eff_label:
            recs_en.append("🚨 Your supply chain efficiency is critically low. Immediate improvement needed to reduce losses.")
            recs_hi.append("🚨 आपकी आपूर्ति श्रृंखला की कार्यक्षमता बहुत कम है। नुकसान कम करने के लिए तुरंत सुधार ज़रूरी है।")
        elif "Medium" in eff_label:
            recs_en.append("⚠️ Your supply chain has room for improvement. Follow the suggestions below to improve efficiency.")
            recs_hi.append("⚠️ आपकी आपूर्ति श्रृंखला में सुधार की गुंजाइश है। कार्यक्षमता बढ़ाने के लिए नीचे दी गई सलाह अपनाएं।")
        else:
            recs_en.append("🏆 Excellent! Your supply chain is running efficiently. Keep maintaining current practices.")
            recs_hi.append("🏆 बहुत बढ़िया! आपकी आपूर्ति श्रृंखला कुशलता से चल रही है। मौजूदा तरीके बनाए रखें।")

        # Transport cost analysis
        if cost_per_km > avg_cost_per_km * 1.3:
            savings = round((cost_per_km - avg_cost_per_km) * distance_km)
            recs_en.append(f"💰 Your transport cost ₹{cost_per_km:.1f}/km is {round((cost_per_km/avg_cost_per_km - 1)*100)}% above average (₹{avg_cost_per_km}/km). Switch to shared FPO transport to save ~₹{savings:,}.")
            recs_hi.append(f"💰 आपकी परिवहन लागत ₹{cost_per_km:.1f}/किमी औसत (₹{avg_cost_per_km}/किमी) से {round((cost_per_km/avg_cost_per_km - 1)*100)}% ज़्यादा है। FPO साझा परिवहन अपनाकर ~₹{savings:,} बचाएं।")

        # Spoilage advice
        if spoilage_rate > 10:
            recs_en.append(f"🧊 Spoilage rate {spoilage_rate}% is very high! Use refrigerated transport or pack with ice packs. Target below 5%.")
            recs_hi.append(f"🧊 खराबी दर {spoilage_rate}% बहुत ज़्यादा है! रेफ्रिजरेटेड ट्रक या आइस पैक का उपयोग करें। लक्ष्य 5% से नीचे रखें।")
        elif spoilage_rate > 5:
            recs_en.append(f"📦 Spoilage rate {spoilage_rate}% can be improved. Use ventilated crates and avoid overloading.")
            recs_hi.append(f"📦 खराबी दर {spoilage_rate}% को और कम किया जा सकता है। हवादार क्रेट्स का उपयोग करें और ओवरलोडिंग से बचें।")

        # Delay advice
        if delay_days > 3:
            recs_en.append(f"⏱️ {delay_days:.0f} days delay is too long. Plan dispatches early morning (4-6 AM) to avoid traffic and heat.")
            recs_hi.append(f"⏱️ {delay_days:.0f} दिन की देरी बहुत ज़्यादा है। ट्रैफ़िक और गर्मी से बचने के लिए सुबह 4-6 बजे माल भेजें।")

        # Storage advice
        if not storage_avail or storage_avail in [False, "false", 0, "0", "no"]:
            recs_en.append("🏗️ No warehouse available. Apply for WDRA (Warehouse Development & Regulatory Authority) subsidy for building cold storage near your farm.")
            recs_hi.append("🏗️ कोई गोदाम उपलब्ध नहीं। अपने खेत के पास कोल्ड स्टोरेज बनाने के लिए WDRA सब्सिडी के लिए आवेदन करें।")

        # Congestion advice
        if congestion > 7:
            recs_en.append(f"🚦 Traffic congestion level {congestion:.0f}/10 is very high. Use alternate routes or night transport for perishables.")
            recs_hi.append(f"🚦 यातायात भीड़ {congestion:.0f}/10 बहुत ज़्यादा है। जल्दी खराब होने वाली फसलों के लिए वैकल्पिक मार्ग या रात का परिवहन अपनाएं।")

        return jsonify({
            "cluster": cluster,
            "efficiency": eff_label,
            "cost_per_km": round(cost_per_km, 2),
            "avg_cost_per_km": avg_cost_per_km,
            "recommendations": recs_en,
            "recommendations_hi": recs_hi
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ─── Soil Health — NPK / pH Recommendation Engine ────────────────
# Uses ICAR (Indian Council of Agricultural Research) guidelines
SOIL_CROP_DB = {
    "Wheat":     {"N": (120,150), "P": (40,60),  "K": (40,60),  "pH": (6.0,7.5), "season": "Rabi"},
    "Rice":      {"N": (100,120), "P": (30,50),  "K": (30,50),  "pH": (5.5,6.5), "season": "Kharif"},
    "Maize":     {"N": (120,150), "P": (50,75),  "K": (40,60),  "pH": (5.8,7.0), "season": "Kharif"},
    "Tomato":    {"N": (100,130), "P": (60,80),  "K": (60,80),  "pH": (6.0,6.8), "season": "Rabi"},
    "Potato":    {"N": (120,150), "P": (80,100), "K": (100,120),"pH": (5.0,6.5), "season": "Rabi"},
    "Onion":     {"N": (80,100),  "P": (40,60),  "K": (60,80),  "pH": (6.0,7.0), "season": "Rabi"},
    "Sugarcane": {"N": (150,200), "P": (60,80),  "K": (60,80),  "pH": (6.0,7.5), "season": "Kharif"},
    "Cotton":    {"N": (80,120),  "P": (40,60),  "K": (40,60),  "pH": (6.0,7.5), "season": "Kharif"},
    "Soybean":   {"N": (20,30),   "P": (60,80),  "K": (40,60),  "pH": (6.0,7.0), "season": "Kharif"},
    "Groundnut": {"N": (15,25),   "P": (40,60),  "K": (40,50),  "pH": (6.0,6.5), "season": "Kharif"},
    "Mustard":   {"N": (60,80),   "P": (30,40),  "K": (20,30),  "pH": (6.0,7.0), "season": "Rabi"},
    "Chickpea":  {"N": (15,20),   "P": (40,60),  "K": (20,30),  "pH": (6.0,7.5), "season": "Rabi"},
    "Banana":    {"N": (150,200), "P": (40,60),  "K": (200,300),"pH": (6.0,7.5), "season": "Kharif"},
    "Turmeric":  {"N": (60,80),   "P": (30,50),  "K": (80,120), "pH": (5.5,7.0), "season": "Kharif"},
}

FERTILIZER_DB = {
    "Urea":      {"N": 46, "P": 0,  "K": 0,  "desc_en": "Urea (46% N)", "desc_hi": "यूरिया (46% N)"},
    "DAP":       {"N": 18, "P": 46, "K": 0,  "desc_en": "DAP (18-46-0)", "desc_hi": "DAP (18-46-0)"},
    "MOP":       {"N": 0,  "P": 0,  "K": 60, "desc_en": "Muriate of Potash (60% K₂O)", "desc_hi": "म्युरेट ऑफ पोटाश (60% K₂O)"},
    "SSP":       {"N": 0,  "P": 16, "K": 0,  "desc_en": "Single Super Phosphate (16% P₂O₅)", "desc_hi": "सिंगल सुपर फॉस्फेट (16% P₂O₅)"},
    "NPK_10":    {"N": 10, "P": 26, "K": 26, "desc_en": "NPK Complex (10-26-26)", "desc_hi": "NPK कॉम्प्लेक्स (10-26-26)"},
}


@app.route("/predict/soil", methods=["POST"])
def predict_soil():
    try:
        data = request.json
        nitrogen   = float(data.get("nitrogen", 50))
        phosphorus = float(data.get("phosphorus", 50))
        potassium  = float(data.get("potassium", 50))
        ph         = float(data.get("ph", 7.0))

        # ── 1. Soil Health Assessment ─────────────────────────────
        health_score = 0
        issues_en = []
        issues_hi = []

        # Nitrogen assessment
        if nitrogen < 50:
            issues_en.append(f"⚠️ Nitrogen is LOW ({nitrogen} kg/ha). Crops will show yellowing leaves.")
            issues_hi.append(f"⚠️ नाइट्रोजन कम है ({nitrogen} kg/ha)। फसल की पत्तियाँ पीली पड़ सकती हैं।")
        elif nitrogen > 200:
            issues_en.append(f"⚠️ Nitrogen is EXCESSIVE ({nitrogen} kg/ha). Risk of water contamination.")
            issues_hi.append(f"⚠️ नाइट्रोजन अत्यधिक है ({nitrogen} kg/ha)। पानी प्रदूषण का खतरा।")
            health_score += 15
        else:
            health_score += 25

        # Phosphorus assessment
        if phosphorus < 20:
            issues_en.append(f"⚠️ Phosphorus is LOW ({phosphorus} kg/ha). Poor root development expected.")
            issues_hi.append(f"⚠️ फॉस्फोरस कम है ({phosphorus} kg/ha)। जड़ों का विकास कमजोर होगा।")
        elif phosphorus > 100:
            issues_en.append(f"⚠️ Phosphorus is HIGH ({phosphorus} kg/ha). May block micronutrient absorption.")
            issues_hi.append(f"⚠️ फॉस्फोरस ज़्यादा है ({phosphorus} kg/ha)। सूक्ष्म पोषक तत्वों का अवशोषण रुक सकता है।")
            health_score += 15
        else:
            health_score += 25

        # Potassium assessment
        if potassium < 30:
            issues_en.append(f"⚠️ Potassium is LOW ({potassium} kg/ha). Weak stems and poor fruit quality.")
            issues_hi.append(f"⚠️ पोटैशियम कम है ({potassium} kg/ha)। कमजोर तने और खराब फल गुणवत्ता।")
        elif potassium > 150:
            issues_en.append(f"⚠️ Potassium is EXCESSIVE ({potassium} kg/ha).")
            issues_hi.append(f"⚠️ पोटैशियम अत्यधिक है ({potassium} kg/ha)।")
            health_score += 15
        else:
            health_score += 25

        # pH assessment
        if ph < 5.5:
            issues_en.append(f"🔴 Soil is too ACIDIC (pH {ph}). Add lime (calcium carbonate) to raise pH.")
            issues_hi.append(f"🔴 मिट्टी बहुत अम्लीय है (pH {ph})। pH बढ़ाने के लिए चूना (कैल्शियम कार्बोनेट) डालें।")
        elif ph > 8.0:
            issues_en.append(f"🔴 Soil is too ALKALINE (pH {ph}). Add gypsum or sulphur to lower pH.")
            issues_hi.append(f"🔴 मिट्टी बहुत क्षारीय है (pH {ph})। pH कम करने के लिए जिप्सम या सल्फर डालें।")
        else:
            health_score += 25

        if not issues_en:
            issues_en.append("✅ All soil parameters are within optimal range!")
            issues_hi.append("✅ मिट्टी के सभी पैरामीटर इष्टतम सीमा में हैं!")

        # Health label
        if health_score >= 80:
            health_label = "Good"
            health_label_hi = "अच्छी"
            health_color = "green"
        elif health_score >= 50:
            health_label = "Moderate"
            health_label_hi = "ठीक-ठाक"
            health_color = "yellow"
        else:
            health_label = "Poor"
            health_label_hi = "खराब"
            health_color = "red"

        # ── 2. Best Crops for this Soil ───────────────────────────
        crop_scores = []
        for crop_name, req in SOIL_CROP_DB.items():
            score = 0
            n_mid = sum(req["N"]) / 2
            p_mid = sum(req["P"]) / 2
            k_mid = sum(req["K"]) / 2
            ph_mid = sum(req["pH"]) / 2

            # Score each factor (closer to ideal = higher score)
            n_score = max(0, 100 - abs(nitrogen - n_mid) * 1.2)
            p_score = max(0, 100 - abs(phosphorus - p_mid) * 1.5)
            k_score = max(0, 100 - abs(potassium - k_mid) * 1.5)
            ph_score = max(0, 100 - abs(ph - ph_mid) * 25)

            score = (n_score * 0.3 + p_score * 0.25 + k_score * 0.2 + ph_score * 0.25)
            crop_scores.append({
                "crop": crop_name,
                "score": round(score, 1),
                "season": req["season"],
                "ph_range": f"{req['pH'][0]}-{req['pH'][1]}",
            })

        crop_scores.sort(key=lambda x: x["score"], reverse=True)
        top_crops = crop_scores[:5]

        # ── 3. Fertilizer Recommendations ─────────────────────────
        fert_recs_en = []
        fert_recs_hi = []

        # Calculate deficiencies based on ideal mid-range for general crops
        ideal_n, ideal_p, ideal_k = 100, 50, 50
        n_deficit = max(0, ideal_n - nitrogen)
        p_deficit = max(0, ideal_p - phosphorus)
        k_deficit = max(0, ideal_k - potassium)

        if n_deficit > 20:
            urea_kg = round(n_deficit / 0.46)
            fert_recs_en.append(f"🌿 Apply {urea_kg} kg/ha Urea to fix nitrogen deficiency.")
            fert_recs_hi.append(f"🌿 नाइट्रोजन की कमी दूर करने के लिए {urea_kg} kg/ha यूरिया डालें।")

        if p_deficit > 10:
            dap_kg = round(p_deficit / 0.46)
            fert_recs_en.append(f"🧪 Apply {dap_kg} kg/ha DAP to fix phosphorus deficiency.")
            fert_recs_hi.append(f"🧪 फॉस्फोरस की कमी दूर करने के लिए {dap_kg} kg/ha DAP डालें।")

        if k_deficit > 10:
            mop_kg = round(k_deficit / 0.60)
            fert_recs_en.append(f"💎 Apply {mop_kg} kg/ha MOP (Muriate of Potash) to fix potassium deficiency.")
            fert_recs_hi.append(f"💎 पोटैशियम की कमी दूर करने के लिए {mop_kg} kg/ha MOP (म्युरेट ऑफ पोटाश) डालें।")

        if ph < 5.5:
            lime_kg = round((6.5 - ph) * 500)
            fert_recs_en.append(f"ite Apply {lime_kg} kg/ha agricultural lime to correct acidic soil.")
            fert_recs_hi.append(f"�ite अम्लीय मिट्टी सुधारने के लिए {lime_kg} kg/ha कृषि चूना डालें।")
        elif ph > 8.0:
            gypsum_kg = round((ph - 7.0) * 400)
            fert_recs_en.append(f"🔧 Apply {gypsum_kg} kg/ha gypsum to reduce alkalinity.")
            fert_recs_hi.append(f"🔧 क्षारीयता कम करने के लिए {gypsum_kg} kg/ha जिप्सम डालें।")

        if not fert_recs_en:
            fert_recs_en.append("✅ No fertilizer correction needed. Soil nutrients are balanced.")
            fert_recs_hi.append("✅ कोई उर्वरक सुधार की आवश्यकता नहीं। मिट्टी के पोषक तत्व संतुलित हैं।")

        # General organic advice
        fert_recs_en.append("🌱 Add 5-10 tonnes/ha of organic compost (FYM or vermicompost) for long-term soil health.")
        fert_recs_hi.append("🌱 दीर्घकालिक मिट्टी स्वास्थ्य के लिए 5-10 टन/ha जैविक खाद (गोबर या वर्मीकम्पोस्ट) डालें।")

        return jsonify({
            "health_score": health_score,
            "health_label": health_label,
            "health_label_hi": health_label_hi,
            "health_color": health_color,
            "issues": issues_en,
            "issues_hi": issues_hi,
            "top_crops": top_crops,
            "fertilizer_recommendations": fert_recs_en,
            "fertilizer_recommendations_hi": fert_recs_hi,
            "input": {"nitrogen": nitrogen, "phosphorus": phosphorus, "potassium": potassium, "ph": ph}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("ML_PORT", 8000))
    print(f"\n[ML] Smart Agri ML Server running on port {port}")
    print(f"[ML] Models loaded: loss={loss_model is not None}, price={price_model is not None}, supply={supply_model is not None}\n")
    app.run(host="0.0.0.0", port=port, debug=True)

