const { predictLoss, predictPrice, predictSupply } = require("../services/mlService");
const Prediction = require("../models/Prediction");

// ─── Recommendations Logic ─────────────────────────────────────
function getLossRecommendations(level) {
  const map = {
    "Low":    ["Continue current storage practices.", "Monitor temperature weekly.", "Ensure proper packaging before transport."],
    "Medium": ["Reduce transport time by at least 20%.", "Improve cold storage conditions.", "Check humidity levels daily.", "Contact nearest FPO for assistance."],
    "High":   ["Immediate cold chain intervention required!", "Sell or process within 48 hours.", "Contact nearest Farmer Producer Organization (FPO).", "Apply for PM-FASAL insurance claim if crop damaged.", "Shift to cool, dry storage immediately."]
  };
  return map[level] || ["No specific recommendations available."];
}

function getPriceRecommendations(price, crop) {
  if (price > 3000) return [`Good time to sell ${crop} — prices are high.`, "Consider forward contracts to lock in current rates.", "Explore export opportunities via APEDA."];
  if (price > 1500) return [`Market prices for ${crop} are moderate.`, "Monitor for 1-2 weeks before selling.", "Consider value-added processing."];
  return [`Low price period for ${crop}.`, "Store if possible and wait for better market.", "Explore government procurement (MSP) options.", "Register on e-NAM portal for better price discovery."];
}

function getSupplyRecommendations(efficiency) {
  const map = {
    "High Efficiency":   ["Your supply chain is well-optimized.", "Continue monitoring delivery timelines.", "Consider scaling operations."],
    "Medium Efficiency": ["Moderate supply chain performance.", "Reduce transport time to improve margins.", "Upgrade cold storage infrastructure.", "Explore co-operative logistics with nearby farmers."],
    "Low Efficiency":    ["Supply chain needs urgent improvement.", "Transport costs are too high — explore alternatives.", "Storage availability is critical — apply for warehouse subsidy.", "Consider joining FPO for collective bargaining."]
  };
  return map[efficiency] || [];
}

// POST /api/predict/loss
exports.getLossPrediction = async (req, res, next) => {
  try {
    const { data } = await predictLoss(req.body);
    const recommendations = getLossRecommendations(data.prediction);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "loss",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations,
        confidence: data.probabilities ? Math.max(...data.probabilities) * 100 : null
      });
    } catch (_) { /* DB not connected — continue */ }

    res.json({ ...data, id: saved?._id, recommendations });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server is not running. Start with: cd ml-server && python app.py" });
    }
    next(err);
  }
};

// POST /api/predict/price
exports.getPricePrediction = async (req, res, next) => {
  try {
    const { data } = await predictPrice(req.body);
    const recommendations = getPriceRecommendations(data.predicted_price, req.body.crop_type);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "price",
        cropName: req.body.crop_type || "Unknown",
        inputData: req.body,
        result: data,
        recommendations
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server is not running. Start with: cd ml-server && python app.py" });
    }
    next(err);
  }
};

// POST /api/predict/supply
exports.getSupplyPrediction = async (req, res, next) => {
  try {
    const { data } = await predictSupply(req.body);
    const recommendations = getSupplyRecommendations(data.efficiency);

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user._id,
        type: "supply",
        cropName: req.body.region || "Unknown",
        inputData: req.body,
        result: data,
        recommendations
      });
    } catch (_) {}

    res.json({ ...data, id: saved?._id, recommendations });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ECONNRESET") {
      return res.status(503).json({ error: "ML Server is not running. Start with: cd ml-server && python app.py" });
    }
    next(err);
  }
};
