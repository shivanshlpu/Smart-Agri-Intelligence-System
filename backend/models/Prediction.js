const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["loss", "price", "supply"],
    required: true
  },
  cropName: { type: String, default: "" },
  inputData: { type: Object, required: true },
  result: { type: Object, required: true },
  recommendations: [{ type: String }],
  confidence: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Prediction", PredictionSchema);
