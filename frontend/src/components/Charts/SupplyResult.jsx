import { useLang } from "../../context/LanguageContext";

const EFF_CONFIG = {
  "High Efficiency":   { emoji: "🏆", bg: "#d1fae5", border: "#6ee7b7", color: "#065f46" },
  "Medium Efficiency": { emoji: "⚠️",  bg: "#fef3c7", border: "#fcd34d", color: "#92400e" },
  "Low Efficiency":    { emoji: "🚨", bg: "#fee2e2", border: "#fca5a5", color: "#991b1b" },
};

export default function SupplyResult({ efficiency, cluster, inputData, costPerKm, avgCostPerKm }) {
  const { t, lang } = useLang();
  if (!efficiency) return null;

  const config = EFF_CONFIG[efficiency] || EFF_CONFIG["Medium Efficiency"];
  const msgKey = efficiency.includes("High") ? "supply.high"
               : efficiency.includes("Medium") ? "supply.medium"
               : "supply.low";

  const metrics = [
    { icon: "🚛", label: t("supply.distance"),      value: inputData?.distance_km, unit: "km" },
    { icon: "⏱️", label: t("supply.deliveryTime"),   value: inputData?.delivery_time, unit: lang === "hi" ? "दिन" : "days" },
    { icon: "💰", label: t("supply.transportCost"),  value: inputData?.transport_cost, unit: "₹" },
    { icon: "📦", label: t("supply.spoilage"),       value: inputData?.spoilage_rate, unit: "%" },
    { icon: "⏳", label: t("supply.delayDays"),      value: inputData?.delay_days, unit: lang === "hi" ? "दिन" : "days" },
  ].filter(m => m.value);

  // Calculate cost efficiency comparison
  const userCostPerKm = costPerKm || (
    inputData?.transport_cost && inputData?.distance_km
      ? (Number(inputData.transport_cost) / Math.max(Number(inputData.distance_km), 1)).toFixed(1)
      : null
  );
  const avgCpk = avgCostPerKm || 8;
  const costDiffPct = userCostPerKm ? Math.round(((userCostPerKm / avgCpk) - 1) * 100) : null;

  return (
    <div className="farmer-result-card" style={{ background: config.bg, borderColor: config.border }}>
      {/* Big emoji */}
      <div className="farmer-result-emoji">{config.emoji}</div>

      {/* Main message */}
      <div className="farmer-result-message" style={{ color: config.color }}>
        {t(msgKey)}
      </div>

      {/* Cost efficiency comparison */}
      {userCostPerKm && (
        <div style={{
          margin: "14px 0", padding: "12px 16px", borderRadius: 12,
          background: "#fff", border: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
              {lang === "hi" ? "आपकी लागत" : "Your Cost"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: costDiffPct > 20 ? "#dc2626" : "#065f46" }}>
              ₹{Number(userCostPerKm).toFixed(1)}/{lang === "hi" ? "किमी" : "km"}
            </div>
          </div>
          <div style={{ fontSize: 20, color: "#94a3b8" }}>vs</div>
          <div>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
              {lang === "hi" ? "राष्ट्रीय औसत" : "National Avg"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>
              ₹{avgCpk}/{lang === "hi" ? "किमी" : "km"}
            </div>
          </div>
          {costDiffPct !== null && (
            <div style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: costDiffPct > 20 ? "#fee2e2" : costDiffPct < -5 ? "#d1fae5" : "#fef3c7",
              color: costDiffPct > 20 ? "#991b1b" : costDiffPct < -5 ? "#065f46" : "#92400e"
            }}>
              {costDiffPct > 0 ? `+${costDiffPct}%` : `${costDiffPct}%`}
              {costDiffPct > 20
                ? (lang === "hi" ? " ⬆️ बहुत ज़्यादा" : " ⬆️ Too High")
                : costDiffPct < -5
                  ? (lang === "hi" ? " ✅ अच्छा" : " ✅ Good")
                  : (lang === "hi" ? " ➡️ ठीक" : " ➡️ OK")}
            </div>
          )}
        </div>
      )}

      {/* Metrics as simple icon+value pairs */}
      <div className="farmer-metrics-grid">
        {metrics.map((m, i) => (
          <div className="farmer-metric-item" key={i}>
            <span className="farmer-metric-icon">{m.icon}</span>
            <div>
              <div className="farmer-metric-label">{m.label}</div>
              <div className="farmer-metric-value">
                {m.unit === "₹" ? `₹${Number(m.value).toLocaleString("en-IN")}` : `${m.value} ${m.unit}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {inputData?.region && (
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#6b7280" }}>
          📍 {inputData.region}
        </div>
      )}
    </div>
  );
}
