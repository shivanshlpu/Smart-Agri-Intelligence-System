const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/predict",  require("./routes/predictionRoutes"));
app.use("/api/history",  require("./routes/historyRoutes"));

// ─── Health Check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Smart Agri Backend", time: new Date() });
});

// ─── Error Handler ─────────────────────────────────────────────
app.use(require("./middleware/errorHandler"));

// ─── MongoDB Connection ─────────────────────────────────────────
const connectDB = require("./config/db");
connectDB();

// ─── Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌾 Smart Agri Backend running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🔗 ML Server: ${process.env.ML_SERVER_URL || "http://localhost:8000"}\n`);
});

module.exports = app;
