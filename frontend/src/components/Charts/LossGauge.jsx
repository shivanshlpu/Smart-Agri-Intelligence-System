import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

const RISK_COLORS = { Low: "#1a6b3c", Medium: "#d97706", High: "#dc2626" };
const RISK_EMOJI  = { Low: "🟢", Medium: "🟡", High: "🔴" };

export default function LossGauge({ prediction, probabilities = [] }) {
  if (!prediction) return null;

  const color = RISK_COLORS[prediction] || "#003366";
  const prob  = probabilities[["Low","Medium","High"].indexOf(prediction)] ?? 0;
  const pct   = Math.round(prob * 100);

  const gaugeData = [
    { name: "bg",   value: 100, fill: "#e5e7eb" },
    { name: "fill", value: pct, fill: color },
  ];

  return (
    <div className="gauge-wrap">
      <div className="gauge-label">LOSS RISK PROBABILITY</div>
      <div style={{ position: "relative", width: 160, margin: "0 auto" }}>
        <ResponsiveContainer width={160} height={160}>
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="100%"
            data={gaugeData}
            startAngle={225} endAngle={-45}
          >
            <RadialBar dataKey="value" background={{ fill: "#e5e7eb" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)", textAlign: "center"
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{RISK_EMOJI[prediction]} {prediction}</div>
        </div>
      </div>

      {/* Probability bars */}
      <div className="prob-bar-container" style={{ marginTop: 12 }}>
        {["Low","Medium","High"].map((lvl, i) => (
          <div className="prob-bar-row" key={lvl}>
            <div className="prob-bar-label">{lvl}</div>
            <div className="prob-bar-track">
              <div
                className={`prob-bar-fill ${lvl.toLowerCase()}`}
                style={{ width: `${Math.round((probabilities[i] ?? 0) * 100)}%` }}
              />
            </div>
            <div className="prob-bar-value">{Math.round((probabilities[i] ?? 0)*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
