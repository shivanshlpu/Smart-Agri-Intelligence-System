import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell, Legend
} from "recharts";
import { useLang } from "../../context/LanguageContext";

const MONTH_SHORT_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_SHORT_HI = ["जन","फर","मार्च","अप्रै","मई","जून","जुला","अग","सित","अक्टू","नव","दिस"];

export default function PriceChart({ crop, state, monthlyPrices, bestMonth, currentMonth, msp }) {
  const { t, lang } = useLang();
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (monthlyPrices && monthlyPrices.length > 0) {
      // Use ML-predicted monthly data
      const data = monthlyPrices.map((mp) => ({
        month: mp.month,
        label: lang === "hi" ? MONTH_SHORT_HI[mp.month - 1] : MONTH_SHORT_EN[mp.month - 1],
        price: Math.round(mp.price),
        isCurrent: mp.month === currentMonth,
        isBest: mp.month === bestMonth,
      }));
      setChartData(data);
    } else {
      // Fallback: generate estimated trend
      generateFallbackData();
    }
  }, [monthlyPrices, bestMonth, currentMonth, crop, state, lang]);

  const generateFallbackData = () => {
    const base = 2000 + Math.random() * 1000;
    const data = [];
    const cm = currentMonth || (new Date().getMonth() + 1);
    for (let m = 1; m <= 12; m++) {
      const seasonal = Math.sin(((m - 3) / 12) * Math.PI * 2) * 300;
      data.push({
        month: m,
        label: lang === "hi" ? MONTH_SHORT_HI[m - 1] : MONTH_SHORT_EN[m - 1],
        price: Math.round(base + seasonal + (Math.random() * 200 - 100)),
        isCurrent: m === cm,
        isBest: false,
      });
    }
    // Mark the best month
    const maxPrice = Math.max(...data.map(d => d.price));
    data.forEach(d => { if (d.price === maxPrice) d.isBest = true; });
    setChartData(data);
  };

  const getBarColor = (entry) => {
    if (entry.isBest) return "#059669";     // Green for best month
    if (entry.isCurrent) return "#2563eb";  // Blue for current month
    return "#94a3b8";                        // Gray for others
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: "#fff", padding: "12px 16px", borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)", border: "none",
        minWidth: 180
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: "#1e293b" }}>
          {lang === "hi" ? MONTH_SHORT_HI[d.month - 1] : MONTH_SHORT_EN[d.month - 1]} 
          {d.isCurrent ? (lang === "hi" ? " (अभी)" : " (Now)") : ""}
          {d.isBest ? (lang === "hi" ? " ⭐ सर्वोत्तम" : " ⭐ Best") : ""}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: d.isBest ? "#059669" : "#2563eb" }}>
          ₹{d.price.toLocaleString("en-IN")}
          <span style={{ fontSize: 11, fontWeight: 400, color: "#6b7280" }}>
            /{lang === "hi" ? "क्विंटल" : "Qtl"}
          </span>
        </div>
        {d.isBest && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#059669", fontWeight: 600 }}>
            {lang === "hi" ? "✅ इस महीने बेचें — सबसे ज़्यादा भाव!" : "✅ Sell this month — highest price!"}
          </div>
        )}
        {d.isCurrent && !d.isBest && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
            {lang === "hi" ? "⏳ रुकें — बेहतर भाव आएगा" : "⏳ Hold — better price coming"}
          </div>
        )}
      </div>
    );
  };

  if (!chartData.length) return null;

  const maxPrice = Math.max(...chartData.map(d => d.price));
  const minPrice = Math.min(...chartData.map(d => d.price));

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          📊 {lang === "hi" ? "12-महीने का मूल्य पूर्वानुमान" : "12-Month Price Forecast"}
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#2563eb", display: "inline-block" }}></span>
            {lang === "hi" ? "अभी का महीना" : "Current Month"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#059669", display: "inline-block" }}></span>
            {lang === "hi" ? "⭐ बेचने का सबसे अच्छा महीना" : "⭐ Best Month to Sell"}
          </div>
          {msp && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <span style={{ width: 16, height: 2, background: "#dc2626", display: "inline-block" }}></span>
              MSP ₹{msp.toLocaleString("en-IN")}
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        {!monthlyPrices && (
          <div className="alert alert-warning" style={{ fontSize: 12, marginBottom: 16 }}>
            {lang === "hi" ? "ML मॉडल से डेटा उपलब्ध नहीं। अनुमानित ट्रेंड दिखाया जा रहा है।"
              : "ML model data unavailable. Showing estimated trend."}
          </div>
        )}

        <div style={{ height: 300, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(v) => `₹${(v/1000).toFixed(1)}k`}
                domain={[Math.floor(minPrice * 0.85), Math.ceil(maxPrice * 1.1)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              {msp && (
                <ReferenceLine
                  y={msp}
                  stroke="#dc2626"
                  strokeDasharray="6 4"
                  strokeWidth={2}
                  label={{
                    value: `MSP ₹${msp.toLocaleString("en-IN")}`,
                    position: "right",
                    fill: "#dc2626",
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
              )}
              <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry)}
                    stroke={entry.isBest ? "#047857" : entry.isCurrent ? "#1d4ed8" : "transparent"}
                    strokeWidth={entry.isBest || entry.isCurrent ? 2 : 0}
                    opacity={entry.isBest || entry.isCurrent ? 1 : 0.65}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Best month summary below chart */}
        {bestMonth && (
          <div style={{
            marginTop: 16, padding: "14px 18px", borderRadius: 12,
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #6ee7b7", textAlign: "center"
          }}>
            <div style={{ fontSize: 13, color: "#065f46", fontWeight: 700 }}>
              {lang === "hi"
                ? `⭐ सर्वोत्तम बिक्री समय: ${MONTH_SHORT_HI[bestMonth - 1]} — अनुमानित भाव ₹${maxPrice.toLocaleString("en-IN")}/क्विंटल`
                : `⭐ Best Time to Sell: ${MONTH_SHORT_EN[bestMonth - 1]} — Est. Price ₹${maxPrice.toLocaleString("en-IN")}/Qtl`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
