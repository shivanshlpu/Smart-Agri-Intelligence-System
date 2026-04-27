import { useLang } from "../../context/LanguageContext";

const RISK_CONFIG = {
  Low:    { emoji: "🟢", bg: "#d1fae5", border: "#6ee7b7", color: "#065f46", icon: "✅" },
  Medium: { emoji: "🟡", bg: "#fef3c7", border: "#fcd34d", color: "#92400e", icon: "⚠️" },
  High:   { emoji: "🔴", bg: "#fee2e2", border: "#fca5a5", color: "#991b1b", icon: "🚨" },
};

export default function LossResult({ prediction, probabilities = [] }) {
  const { t } = useLang();
  if (!prediction) return null;

  const config = RISK_CONFIG[prediction] || RISK_CONFIG.Medium;
  const prob = probabilities[["Low", "Medium", "High"].indexOf(prediction)] ?? 0;
  const pct = Math.round(prob * 100);

  const messageKey = `loss.${prediction.toLowerCase()}`;

  return (
    <div className="farmer-result-card" style={{ background: config.bg, borderColor: config.border }}>
      {/* Big emoji icon */}
      <div className="farmer-result-emoji">{config.icon}</div>

      {/* Main message */}
      <div className="farmer-result-message" style={{ color: config.color }}>
        {t(messageKey)}
      </div>

      {/* Confidence */}
      <div className="farmer-result-confidence">
        <span style={{ fontSize: 14, color: "#6b7280" }}>
          {t("history.confidence")}: <strong style={{ color: config.color }}>{pct}%</strong>
        </span>
      </div>

      {/* Simple progress bars */}
      <div className="farmer-prob-bars">
        {["Low", "Medium", "High"].map((lvl, i) => {
          const p = Math.round((probabilities[i] ?? 0) * 100);
          const c = RISK_CONFIG[lvl];
          return (
            <div className="farmer-prob-row" key={lvl}>
              <span className="farmer-prob-emoji">{c.emoji}</span>
              <span className="farmer-prob-label">
                {lvl === "Low" ? (t("loss.low").split("—")[0]) :
                 lvl === "Medium" ? (t("loss.medium").split("—")[0]) :
                 (t("loss.high").split("—")[0])}
              </span>
              <div className="farmer-prob-track">
                <div
                  className="farmer-prob-fill"
                  style={{ width: `${p}%`, background: c.color }}
                />
              </div>
              <span className="farmer-prob-value" style={{ color: c.color }}>{p}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
