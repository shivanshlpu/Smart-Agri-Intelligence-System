import { useLang } from "../../context/LanguageContext";

const EFF_CONFIG = {
  "High Efficiency":   { emoji: "🏆", bg: "#d1fae5", border: "#6ee7b7", color: "#065f46" },
  "Medium Efficiency": { emoji: "⚠️",  bg: "#fef3c7", border: "#fcd34d", color: "#92400e" },
  "Low Efficiency":    { emoji: "🚨", bg: "#fee2e2", border: "#fca5a5", color: "#991b1b" },
};

export default function SupplyResult({ efficiency, cluster, inputData }) {
  const { t } = useLang();
  if (!efficiency) return null;

  const config = EFF_CONFIG[efficiency] || EFF_CONFIG["Medium Efficiency"];
  const msgKey = efficiency.includes("High") ? "supply.high"
               : efficiency.includes("Medium") ? "supply.medium"
               : "supply.low";

  const metrics = [
    { icon: "🚛", label: t("supply.distance"),      value: inputData?.distance_km, unit: "km" },
    { icon: "⏱️", label: t("supply.deliveryTime"),   value: inputData?.delivery_time, unit: t("supply.deliveryTime").includes("दिन") ? "दिन" : "days" },
    { icon: "💰", label: t("supply.transportCost"),  value: inputData?.transport_cost, unit: "₹" },
    { icon: "📦", label: t("supply.spoilage"),       value: inputData?.spoilage_rate, unit: "%" },
    { icon: "⏳", label: t("supply.delayDays"),      value: inputData?.delay_days, unit: t("supply.delayDays").includes("दिन") ? "दिन" : "days" },
  ].filter(m => m.value);

  return (
    <div className="farmer-result-card" style={{ background: config.bg, borderColor: config.border }}>
      {/* Big emoji */}
      <div className="farmer-result-emoji">{config.emoji}</div>

      {/* Main message */}
      <div className="farmer-result-message" style={{ color: config.color }}>
        {t(msgKey)}
      </div>

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
