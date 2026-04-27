import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useLang } from "../../context/LanguageContext";

export default function PriceChart({ crop, state }) {
  const { t } = useLang();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!crop || !state) return;

    const fetchMandiData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_DATA_GOV_API_KEY;
        const baseUrl = import.meta.env.VITE_DATA_GOV_MANDI_URL;
        
        if (!apiKey || !baseUrl || apiKey.includes("your_api_key")) {
          throw new Error("API Key not configured");
        }

        // Add filters for commodity and state
        const url = `${baseUrl}?api-key=${apiKey}&format=json&filters[commodity]=${crop}&filters[state]=${state}&limit=30`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Failed to fetch mandi data");
        const json = await res.json();
        
        if (json.records && json.records.length > 0) {
          // Process and sort by date
          const processed = json.records.map(r => {
            // Convert DD/MM/YYYY to a sortable date
            const [day, month, year] = (r.Arrival_Date || "").split("/");
            const dateObj = new Date(`${year}-${month}-${day}`);
            
            return {
              dateObj,
              date: dateObj.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }),
              price: parseFloat(r.Modal_Price || r.Max_Price),
              market: r.Market
            };
          }).filter(r => !isNaN(r.price));
          
          // Sort oldest to newest for chart
          processed.sort((a, b) => a.dateObj - b.dateObj);
          
          setData(processed);
          // Set latest price
          if (processed.length > 0) {
            setLivePrice(processed[processed.length - 1].price);
          }
        } else {
          // If no exact match, fallback to some mock trend for visual completeness as per requirements
          throw new Error("No records found for this crop/state");
        }
      } catch (err) {
        console.warn("Mandi API fetch error:", err);
        // Fallback mock data if API fails or no data (so graph still shows as promised)
        generateMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchMandiData();
  }, [crop, state]);

  const generateMockData = () => {
    const mock = [];
    const base = 2000 + Math.random() * 1000;
    for (let i = 30; i > 0; i -= 3) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      mock.push({
        date: d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }),
        price: Math.round(base + (Math.random() * 400 - 200)),
        market: "Mock Mandi"
      });
    }
    setData(mock);
    setLivePrice(mock[mock.length - 1].price);
    setError(t("price.apiFallback"));
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }}></div>
        <p style={{ marginTop: 10, color: "#6b7280" }}>{t("price.fetchingLive") || "Fetching live mandi prices..."}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>📈 {t("price.trendTitle") || "30-Day Market Trend"}</h3>
        {livePrice && (
          <div style={{ background: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: "bold" }}>
            {t("price.liveMandi") || "Live Mandi"}: ₹{livePrice.toLocaleString("en-IN")}/Qtl
          </div>
        )}
      </div>
      
      <div className="card-body">
        {error && (
          <div className="alert alert-warning" style={{ fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}
        
        <div style={{ height: 250, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`₹${value}`, 'Price']}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#0284c7" }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
