import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = { 0: "#1a6b3c", 1: "#d97706", 2: "#dc2626" };
const LABELS = { 0: "High Efficiency", 1: "Medium Efficiency", 2: "Low Efficiency" };

export default function ClusterMap({ cluster, inputData }) {
  if (cluster === undefined || cluster === null) return null;

  const metrics = [
    { name: "Delivery Time",   value: Number(inputData?.delivery_time ?? 0),   max: 72,   unit: "days" },
    { name: "Delay Days",      value: Number(inputData?.delay_days ?? 0),      max: 10,   unit: "days" },
    { name: "Transport Cost",  value: Number(inputData?.transport_cost ?? 0),  max: 2000, unit: "₹" },
    { name: "Distance",        value: Number(inputData?.distance_km ?? 0),     max: 600,  unit: "km" },
    { name: "Spoilage Rate",   value: Number(inputData?.spoilage_rate ?? 0),   max: 50,   unit: "%" },
  ];

  const barData = metrics.map(m => ({
    name: m.name,
    score: Math.round((m.value / m.max) * 100),
    unit: m.unit,
  }));

  return (
    <div>
      <div className={`risk-badge ${LABELS[cluster].toLowerCase().replace(" ", "-")}`}
        style={{ marginBottom: 12, fontSize: 13 }}>
        Cluster {cluster + 1} — {LABELS[cluster]}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
            domain={[0,100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            formatter={(v, _, props) => [`${v}%`, props.payload.name]}
            contentStyle={{ fontSize: 12, borderRadius: 4 }}
          />
          <Bar dataKey="score" radius={[3,3,0,0]}>
            {barData.map((_, i) => (
              <Cell key={i} fill={COLORS[cluster]} opacity={0.7 + i * 0.08} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>
        Normalized performance indicators (lower = better for cost/time)
      </div>
    </div>
  );
}
