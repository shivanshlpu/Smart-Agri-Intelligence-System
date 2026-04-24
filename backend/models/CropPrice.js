const mongoose = require("mongoose");

const CropPriceSchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  market: { type: String, default: "" },
  state: { type: String, default: "" },
  district: { type: String, default: "" },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 0 },
  modalPrice: { type: Number, default: 0 },
  unit: { type: String, default: "Quintal" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CropPrice", CropPriceSchema);
