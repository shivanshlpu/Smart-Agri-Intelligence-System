const { predictLoss, predictPrice, predictSupply } = require("../services/mlService");
const Prediction = require("../models/Prediction");

// ─── Recommendations Logic (Bilingual: English + Hindi) ─────────
function getLossRecommendations(level) {
  const map = {
    "Low": {
      en: ["Continue current storage practices.", "Monitor temperature weekly.", "Ensure proper packaging before transport."],
      hi: ["वर्तमान भंडारण तरीके जारी रखें।", "साप्ताहिक तापमान जांचें।", "परिवहन से पहले उचित पैकेजिंग सुनिश्चित करें।"]
    },
    "Medium": {
      en: ["Reduce transport time by at least 20%.", "Improve cold storage conditions.", "Check humidity levels daily.", "Contact nearest FPO for assistance."],
      hi: ["परिवहन समय कम से कम 20% कम करें।", "कोल्ड स्टोरेज की स्थिति सुधारें।", "रोज़ाना नमी का स्तर जांचें।", "नज़दीकी FPO से संपर्क करें।"]
    },
    "High": {
      en: ["Immediate cold chain intervention required!", "Sell or process within 48 hours.", "Contact nearest Farmer Producer Organization (FPO).", "Apply for PM-FASAL insurance claim if crop damaged.", "Shift to cool, dry storage immediately."],
      hi: ["तुरंत कोल्ड चेन की व्यवस्था करें!", "48 घंटे के अंदर बेचें या प्रोसेस करें।", "नज़दीकी किसान उत्पादक संगठन (FPO) से संपर्क करें।", "फसल क्षतिग्रस्त होने पर PM-FASAL बीमा दावा करें।", "तुरंत ठंडे, सूखे भंडारण में ले जाएं।"]
    }
  };
  return map[level] || { en: ["No specific recommendations available."], hi: ["कोई विशेष सलाह उपलब्ध नहीं है।"] };
}

function getPriceRecommendations(price, crop) {
  if (price > 3000) return {
    en: [`Good time to sell ${crop} — prices are high.`, "Consider forward contracts to lock in current rates.", "Explore export opportunities via APEDA."],
    hi: [`${crop} बेचने का अच्छा समय — भाव ऊँचे हैं।`, "मौजूदा दरों पर फॉरवर्ड कॉन्ट्रैक्ट पर विचार करें।", "APEDA के ज़रिए निर्यात के अवसर देखें।"]
  };
  if (price > 1500) return {
    en: [`Market prices for ${crop} are moderate.`, "Monitor for 1-2 weeks before selling.", "Consider value-added processing."],
    hi: [`${crop} के बाज़ार भाव ठीक-ठाक हैं।`, "1-2 हफ्ते इंतज़ार करें, फिर बेचें।", "मूल्य संवर्धन (प्रोसेसिंग) पर विचार करें।"]
  };
  return {
    en: [`Low price period for ${crop}.`, "Store if possible and wait for better market.", "Explore government procurement (MSP) options.", "Register on e-NAM portal for better price discovery."],
    hi: [`${crop} के भाव कम हैं।`, "हो सके तो स्टोर करें और बेहतर बाज़ार का इंतज़ार करें।", "सरकारी खरीद (MSP) विकल्प देखें।", "बेहतर भाव के लिए e-NAM पोर्टल पर रजिस्टर करें।"]
  };
}

function getSupplyRecommendations(efficiency) {
  const map = {
    "High Efficiency": {
      en: ["Your supply chain is well-optimized.", "Continue monitoring delivery timelines.", "Consider scaling operations."],
      hi: ["आपकी आपूर्ति श्रृंखला अच्छी तरह अनुकूलित है।", "डिलीवरी समय पर नज़र रखें।", "संचालन बढ़ाने पर विचार करें।"]
    },
    "Medium Efficiency": {
      en: ["Moderate supply chain performance.", "Reduce transport time to improve margins.", "Upgrade cold storage infrastructure.", "Explore co-operative logistics with nearby farmers."],
      hi: ["आपूर्ति श्रृंखला का प्रदर्शन ठीक-ठाक है।", "मार्जिन सुधारने के लिए परिवहन समय कम करें।", "कोल्ड स्टोरेज सुविधा अपग्रेड करें।", "आस-पास के किसानों के साथ सहकारी परिवहन अपनाएं।"]
    },
    "Low Efficiency": {
      en: ["Supply chain needs urgent improvement.", "Transport costs are too high — explore alternatives.", "Storage availability is critical — apply for warehouse subsidy.", "Consider joining FPO for collective bargaining."],
      hi: ["आपूर्ति श्रृंखला में तुरंत सुधार ज़रूरी है।", "परिवहन लागत बहुत ज़्यादा है — विकल्प खोजें।", "भंडारण बहुत ज़रूरी है — गोदाम सब्सिडी के लिए आवेदन करें।", "सामूहिक सौदेबाज़ी के लिए FPO में शामिल हों।"]
    }
  };
  return map[efficiency] || { en: [], hi: [] };
}

// POST /api/predict/loss
exports.getLossPrediction = async (req, res, next) => {
  try {
    const { data } = await predictLoss(req.body);
    const recs = getLossRecommendations(data.prediction);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "loss",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs.en,
        confidence: data.probabilities ? Math.max(...data.probabilities) * 100 : null
      });
    } catch (_) { /* DB not connected — continue */ }

    res.json({ ...data, id: saved?._id, recommendations: recs.en, recommendations_hi: recs.hi });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server connection refused. Make sure ML_SERVER_URL is correct on Render." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "ML Server timed out. It might be waking up (takes ~50s on free Render). Try again in a minute." });
    }
    if (err.response) {
      return res.status(502).json({ error: `ML Server returned an error: ${err.response.status}` });
    }
    next(err);
  }
};

// POST /api/predict/price
exports.getPricePrediction = async (req, res, next) => {
  try {
    const { data } = await predictPrice(req.body);
    // Clamp price to be non-negative
    const price = Math.max(data.predicted_price || 0, 0);
    data.predicted_price = price;
    const recs = getPriceRecommendations(price, req.body.crop_type);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "price",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs.en
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations: recs.en, recommendations_hi: recs.hi });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server connection refused. Make sure ML_SERVER_URL is correct on Render." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "ML Server timed out. It might be waking up (takes ~50s on free Render). Try again in a minute." });
    }
    if (err.response) {
      return res.status(502).json({ error: `ML Server returned an error: ${err.response.status}` });
    }
    next(err);
  }
};

// POST /api/predict/supply
exports.getSupplyPrediction = async (req, res, next) => {
  try {
    const { data } = await predictSupply(req.body);
    const recs = getSupplyRecommendations(data.efficiency);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "supply",
        cropName: req.body.region || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs.en
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations: recs.en, recommendations_hi: recs.hi });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server connection refused. Make sure ML_SERVER_URL is correct on Render." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "ML Server timed out. It might be waking up (takes ~50s on free Render). Try again in a minute." });
    }
    if (err.response) {
      return res.status(502).json({ error: `ML Server returned an error: ${err.response.status}` });
    }
    next(err);
  }
};
