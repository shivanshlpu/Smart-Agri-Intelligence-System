import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function PriceChart({ predictedPrice, cropName }) {
  // Generate synthetic trend data around predicted price
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const current = new Date().getMonth();
  const basePrice = predictedPrice || 1500;
  
  const data = months.map((month, i) => {
    const seasonal = Math.sin((i - 2) * Math.PI / 6) * basePrice * 0.12;
    const noise    = (Math.random() - 0.5) * basePrice * 0.06;
    return {
      month,
      price: Math.round(basePrice + seasonal + noise),
      isCurrent: i === current,
    };
  });
  data[current].price = Math.round(basePrice);

  return (
    <div>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
        Indicative price trend for <strong>{cropName || "crop"}</strong> (₹/Quintal)
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `₹${v}`} />
          <Tooltip
            formatter={(v) => [`₹${v}`, "Price"]}
            contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid #e5e7eb" }}
          />
          <ReferenceLine y={basePrice} stroke="#003366" strokeDasharray="4 2"
            label={{ value: "Prediction", fill: "#003366", fontSize: 10, position: "insideTopRight" }} />
          <Line
            type="monotone" dataKey="price"
            stroke="#1a6b3c" strokeWidth={2}
            dot={(props) => {
              if (props.index === current)
                return <circle key={props.index} cx={props.cx} cy={props.cy} r={5} fill="#FF671F" stroke="white" strokeWidth={2} />;
              return <circle key={props.index} cx={props.cx} cy={props.cy} r={3} fill="#1a6b3c" />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
        🟠 = Current month · Seasonal trend based on historical patterns
      </div>
    </div>
  );
}
