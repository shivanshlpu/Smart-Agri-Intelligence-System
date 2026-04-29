const { predictLoss, predictPrice, predictSupply, predictSoil } = require("../services/mlService");
const Prediction = require("../models/Prediction");

// ─── Recommendations Logic (Bilingual: English + Hindi) ─────────
function getLossRecommendations(level) {
  const map = {
    "Low": {
      en: ["🟢 Continue current storage practices — your crop is safe.", "🌡️ Monitor temperature weekly to maintain quality.", "📦 Ensure proper packaging before transport to avoid minor damage."],
      hi: ["🟢 वर्तमान भंडारण तरीके जारी रखें — आपकी फसल सुरक्षित है।", "🌡️ गुणवत्ता बनाए रखने के लिए साप्ताहिक तापमान जांचें।", "📦 मामूली नुकसान से बचने के लिए परिवहन से पहले उचित पैकेजिंग करें।"]
    },
    "Medium": {
      en: ["⚠️ Reduce transport time by at least 20% to prevent further loss.", "🧊 Improve cold storage conditions — maintain 2-8°C for perishables.", "💧 Check humidity levels daily — high humidity accelerates spoilage.", "📞 Contact nearest FPO for cold chain assistance."],
      hi: ["⚠️ और नुकसान रोकने के लिए परिवहन समय कम से कम 20% कम करें।", "🧊 कोल्ड स्टोरेज सुधारें — जल्दी खराब होने वाली फसलों के लिए 2-8°C रखें।", "💧 रोज़ाना नमी का स्तर जांचें — ज़्यादा नमी से खराबी बढ़ती है।", "📞 कोल्ड चेन सहायता के लिए नज़दीकी FPO से संपर्क करें।"]
    },
    "High": {
      en: ["🚨 URGENT: Immediate cold chain intervention required!", "⏰ Sell or process within 48 hours to avoid total loss.", "📞 Contact nearest Farmer Producer Organization (FPO) immediately.", "📋 Apply for PM-FASAL Bima Yojana insurance claim if crop is damaged.", "🏗️ Shift to cool, dry storage immediately — target temperature below 10°C."],
      hi: ["🚨 जरूरी: तुरंत कोल्ड चेन की व्यवस्था करें!", "⏰ पूरी तरह नुकसान से बचने के लिए 48 घंटे के अंदर बेचें या प्रोसेस करें।", "📞 तुरंत नज़दीकी किसान उत्पादक संगठन (FPO) से संपर्क करें।", "📋 फसल क्षतिग्रस्त होने पर PM-FASAL बीमा योजना में दावा करें।", "🏗️ तुरंत ठंडे, सूखे भंडारण में ले जाएं — तापमान 10°C से नीचे रखें।"]
    }
  };
  return map[level] || { en: ["No specific recommendations available."], hi: ["कोई विशेष सलाह उपलब्ध नहीं है।"] };
}

function getPriceRecommendations(price, crop, month) {
  // ML server now generates context-aware suggestions. 
  // This is a fallback only.
  if (price > 3000) return {
    en: [`📈 Good time to sell ${crop} — prices are high at ₹${price.toLocaleString()}/Qtl.`, "📝 Consider forward contracts to lock in current rates.", "🌍 Explore export via APEDA for even higher returns."],
    hi: [`📈 ${crop} बेचने का अच्छा समय — भाव ₹${price.toLocaleString()}/क्विंटल ऊँचे हैं।`, "📝 मौजूदा दरों पर फॉरवर्ड कॉन्ट्रैक्ट पर विचार करें।", "🌍 और ज़्यादा मुनाफ़े के लिए APEDA से निर्यात देखें।"]
  };
  if (price > 1500) return {
    en: [`⏳ Market prices for ${crop} are moderate (₹${price.toLocaleString()}/Qtl).`, "📊 Monitor for 1-2 weeks before selling — prices may rise.", "🏭 Consider value-added processing (flour, oil, etc.) for better margins."],
    hi: [`⏳ ${crop} के बाज़ार भाव ठीक-ठाक हैं (₹${price.toLocaleString()}/क्विंटल)।`, "📊 1-2 हफ्ते इंतज़ार करें — भाव बढ़ सकते हैं।", "🏭 बेहतर मार्जिन के लिए मूल्य संवर्धन (आटा, तेल आदि) पर विचार करें।"]
  };
  return {
    en: [`📉 Low price period for ${crop} (₹${price.toLocaleString()}/Qtl).`, "📦 Store safely and wait for better market conditions.", "🏛️ Explore government MSP procurement options.", "📱 Register on e-NAM portal for better price discovery."],
    hi: [`📉 ${crop} के भाव कम हैं (₹${price.toLocaleString()}/क्विंटल)।`, "📦 सुरक्षित रखें और बेहतर बाज़ार का इंतज़ार करें।", "🏛️ सरकारी MSP खरीद विकल्प देखें।", "📱 बेहतर भाव के लिए e-NAM पोर्टल पर रजिस्टर करें।"]
  };
}

function getSupplyRecommendations(efficiency) {
  // ML server now generates input-aware suggestions.
  // This is a fallback only.
  const map = {
    "High Efficiency": {
      en: ["🏆 Your supply chain is well-optimized.", "📊 Continue monitoring delivery timelines.", "📈 Consider scaling operations."],
      hi: ["🏆 आपकी आपूर्ति श्रृंखला अच्छी तरह अनुकूलित है।", "📊 डिलीवरी समय पर नज़र रखें।", "📈 संचालन बढ़ाने पर विचार करें।"]
    },
    "Medium Efficiency": {
      en: ["⚠️ Moderate supply chain performance.", "🚛 Reduce transport time to improve margins.", "🧊 Upgrade cold storage infrastructure.", "🤝 Explore co-operative logistics with nearby farmers."],
      hi: ["⚠️ आपूर्ति श्रृंखला का प्रदर्शन ठीक-ठाक है।", "🚛 मार्जिन सुधारने के लिए परिवहन समय कम करें।", "🧊 कोल्ड स्टोरेज सुविधा अपग्रेड करें।", "🤝 आस-पास के किसानों के साथ सहकारी परिवहन अपनाएं।"]
    },
    "Low Efficiency": {
      en: ["🚨 Supply chain needs urgent improvement.", "💰 Transport costs are too high — explore shared transport.", "🏗️ Storage is critical — apply for warehouse subsidy (WDRA).", "🤝 Join FPO for collective bargaining and shared logistics."],
      hi: ["🚨 आपूर्ति श्रृंखला में तुरंत सुधार ज़रूरी है।", "💰 परिवहन लागत बहुत ज़्यादा है — साझा परिवहन अपनाएं।", "🏗️ भंडारण बहुत ज़रूरी है — गोदाम सब्सिडी (WDRA) के लिए आवेदन करें।", "🤝 सामूहिक सौदेबाज़ी के लिए FPO में शामिल हों।"]
    }
  };
  return map[efficiency] || { en: [], hi: [] };
}

// POST /api/predict/loss
exports.getLossPrediction = async (req, res, next) => {
  try {
    const { data } = await predictLoss(req.body);
    // ML server may send its own recs; backend provides fallback
    const fallbackRecs = getLossRecommendations(data.prediction);
    const recs_en = data.recommendations || fallbackRecs.en;
    const recs_hi = data.recommendations_hi || fallbackRecs.hi;

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "loss",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs_en,
        confidence: data.probabilities ? Math.max(...data.probabilities) * 100 : null
      });
    } catch (_) { /* DB not connected — continue */ }

    res.json({ ...data, id: saved?._id, recommendations: recs_en, recommendations_hi: recs_hi });
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
    const price = Math.max(data.predicted_price || 0, 0);
    data.predicted_price = price;

    // Use ML server recommendations (which include monthly analysis), fallback to backend recs
    const fallbackRecs = getPriceRecommendations(price, req.body.crop_type, req.body.month);
    const recs_en = data.recommendations || fallbackRecs.en;
    const recs_hi = data.recommendations_hi || fallbackRecs.hi;

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "price",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs_en
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations: recs_en, recommendations_hi: recs_hi });
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
    // Use ML server input-aware recommendations, fallback to backend recs
    const fallbackRecs = getSupplyRecommendations(data.efficiency);
    const recs_en = data.recommendations || fallbackRecs.en;
    const recs_hi = data.recommendations_hi || fallbackRecs.hi;

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "supply",
        cropName: req.body.region || "Unknown",
        inputData: req.body,
        result: data,
        recommendations: recs_en
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations: recs_en, recommendations_hi: recs_hi });
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

// POST /api/predict/soil
exports.getSoilPrediction = async (req, res, next) => {
  try {
    const { data } = await predictSoil(req.body);
    res.json(data);
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server connection refused." });
    }
    if (err.code === "ECONNABORTED") {
      return res.status(504).json({ error: "ML Server timed out. Try again." });
    }
    if (err.response) {
      return res.status(502).json({ error: `ML Server error: ${err.response.status}` });
    }
    next(err);
  }
};
