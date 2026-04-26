import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axiosConfig";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const QUICK_ACTIONS = [
  { label: "Predict Crop Loss",   icon: "🌿", path: "/loss",   color: "var(--gov-green)" },
  { label: "Price Forecasting",   icon: "💰", path: "/price",  color: "var(--gov-navy)" },
  { label: "Supply Chain",         icon: "🚛", path: "/supply", color: "var(--gov-saffron)" },
  { label: "View History",         icon: "📋", path: "/history",color: "#6b7280" },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState({ total: 0, byType: [] });
  const [history, setHistory] = useState([]);
  const [mlStatus, setMlStatus]   = useState(null);
  const [weather, setWeather]     = useState(null);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [showAllMandi, setShowAllMandi] = useState(false);

  useEffect(() => {
    // Fetch stats & recent history from backend
    Promise.all([
      API.get("/history/stats").catch(() => ({ data: { total: 0, byType: [] } })),
      API.get("/history?limit=5").catch(() => ({ data: { records: [] } }))
    ]).then(([s, h]) => {
      setStats(s.data);
      setHistory(h.data.records || []);
    });

    // Check ML server status
    fetch(`${import.meta.env.VITE_ML_SERVER_URL || "http://localhost:8000"}/health`)
      .then(r => r.json()).then(d => setMlStatus(d.status))
      .catch(() => setMlStatus("offline"));

    // ─── LIVE WEATHER from OpenWeatherMap API ─────────────────
    const weatherKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (weatherKey && weatherKey !== "your_openweathermap_api_key_here") {
      const userCity = user?.location?.district || "Lucknow";
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${userCity},IN&units=metric&appid=${weatherKey}`)
        .then(r => r.json())
        .then(d => {
          if (d.main) {
            setWeather({
              temp: Math.round(d.main.temp),
              humidity: d.main.humidity,
              desc: d.weather?.[0]?.description || "",
              icon: d.weather?.[0]?.icon,
              wind: d.wind?.speed || 0,
              city: d.name || userCity,
            });
          }
        })
        .catch(() => {
          // Fallback to Open-Meteo (no key needed)
          fetch("https://api.open-meteo.com/v1/forecast?latitude=26.84&longitude=80.94&current_weather=true")
            .then(r => r.json())
            .then(d => {
              if (d.current_weather) {
                setWeather({
                  temp: Math.round(d.current_weather.temperature),
                  humidity: null,
                  desc: `Wind: ${d.current_weather.windspeed} km/h`,
                  wind: d.current_weather.windspeed,
                  city: userCity,
                });
              }
            }).catch(() => {});
        });
    }

    // ─── LIVE MANDI PRICES from data.gov.in API ────────────────
    const govKey = import.meta.env.VITE_DATA_GOV_API_KEY;
    const mandiUrl = import.meta.env.VITE_DATA_GOV_MANDI_URL;
    if (govKey && govKey !== "your_data_gov_in_api_key_here" && mandiUrl) {
      const userState = user?.location?.state || "Uttar Pradesh";
      fetch(`${mandiUrl}?api-key=${govKey}&format=json&limit=50&filters[State.keyword]=${userState}`)
        .then(r => r.json())
        .then(d => {
          if (d.records && d.records.length > 0) {
            const prices = d.records.map(r => ({
              crop:    r.Commodity || r.commodity || "—",
              market:  r.Market || r.market || r["Market Name"] || "—",
              state:   r.State || r.state || userState,
              minPrice:  Number(r.Min_Price || r.min_price || 0),
              maxPrice:  Number(r.Max_Price || r.max_price || 0),
              modalPrice: Number(r.Modal_Price || r.modal_price || 0),
              date:    r.Arrival_Date || r["Price Date"] || "—",
            }));
            setMandiPrices(prices);
          } else {
            // Fallback demo data if API returns empty
            setMandiPrices(getDemoMandiPrices());
          }
        })
        .catch(() => setMandiPrices(getDemoMandiPrices()))
        .finally(() => setMandiLoading(false));
    } else {
      setMandiPrices(getDemoMandiPrices());
      setMandiLoading(false);
    }
  }, []);

  function getDemoMandiPrices() {
    const city = user?.location?.district || "Lucknow";
    const state = user?.location?.state || "UP";
    const ALL_CROPS = [
      { c: "Wheat", min: 2100, max: 2350 }, { c: "Rice", min: 1850, max: 2050 }, { c: "Tomato", min: 700, max: 1000 },
      { c: "Onion", min: 1000, max: 1400 }, { c: "Potato", min: 500, max: 750 }, { c: "Maize", min: 1700, max: 1950 },
      { c: "Sugarcane", min: 280, max: 350 }, { c: "Cotton", min: 6500, max: 7200 }, { c: "Soybean", min: 4200, max: 4800 },
      { c: "Groundnut", min: 5500, max: 6200 }, { c: "Bajra", min: 1800, max: 2100 }, { c: "Jowar", min: 2300, max: 2700 },
      { c: "Barley", min: 1900, max: 2200 }, { c: "Mustard", min: 5000, max: 5600 }, { c: "Mango", min: 3000, max: 5000 },
      { c: "Apple", min: 6000, max: 8000 }, { c: "Banana", min: 1200, max: 1800 }, { c: "Chickpea", min: 4500, max: 5200 },
      { c: "Lentil", min: 5800, max: 6500 }, { c: "Turmeric", min: 7000, max: 8500 }, { c: "Chilli", min: 12000, max: 15000 },
      { c: "Ginger", min: 4000, max: 6000 }, { c: "Garlic", min: 8000, max: 12000 }, { c: "Coffee", min: 15000, max: 20000 },
      { c: "Tea", min: 10000, max: 18000 }, { c: "Millet", min: 2000, max: 2500 }, { c: "Watermelon", min: 800, max: 1500 }
    ];
    return ALL_CROPS.map(cr => ({
      crop: cr.c, market: city, state: state, minPrice: cr.min, maxPrice: cr.max, 
      modalPrice: Math.floor((cr.min + cr.max) / 2), date: "Indicative"
    }));
  }

  const typeCount = (type) =>
    stats.byType?.find(b => b._id === type)?.count ?? 0;

  const chartData = [
    { name: "Loss Predictions",   value: typeCount("loss")   },
    { name: "Price Forecasts",    value: typeCount("price")  },
    { name: "Supply Chain",       value: typeCount("supply") },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 <span>Dashboard</span></div>
          <h1>🏠 Dashboard Overview</h1>
          <p>{greeting()}, {user?.name?.split(" ")[0] || "Farmer"}! Here is your agriculture intelligence summary.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className={`badge ${mlStatus === "ok" ? "badge-green" : "badge-red"}`} style={{ fontSize: 11 }}>
            🐍 ML: {mlStatus === "ok" ? "Online" : mlStatus === "offline" ? "Offline" : "..."}
          </div>
          {weather && (
            <div className="badge badge-blue" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              {weather.icon && (
                <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                  alt="" style={{ width: 20, height: 20 }} />
              )}
              {weather.city}: {weather.temp}°C
              {weather.humidity ? ` · ${weather.humidity}% humidity` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Total Predictions</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">All-time analyses run</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🌿</div>
          <div className="stat-label">Loss Predictions</div>
          <div className="stat-value">{typeCount("loss")}</div>
          <div className="stat-sub">Crop risk assessments</div>
        </div>
        <div className="stat-card saffron">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Price Forecasts</div>
          <div className="stat-value">{typeCount("price")}</div>
          <div className="stat-sub">Market price predictions</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">🚛</div>
          <div className="stat-label">Supply Analyses</div>
          <div className="stat-value">{typeCount("supply")}</div>
          <div className="stat-sub">Supply chain reports</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>⚡ Quick Actions — Shighra Prakriya</h3>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.path} id={`quick-${a.path.replace("/","")}`}
              onClick={() => navigate(a.path)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "16px 12px", borderRadius: 6, border: `1px solid ${a.color}20`,
                background: `${a.color}08`, cursor: "pointer",
                transition: "all 0.18s ease", color: a.color,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${a.color}18`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${a.color}08`; e.currentTarget.style.transform = ""; }}
            >
              <span style={{ fontSize: 28 }}>{a.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Card + Activity Chart */}
      <div className="grid-2" style={{ marginBottom: 18 }}>
        {/* Weather Card */}
        <div className="card">
          <div className="card-header">
            <h3>🌤️ Live Weather — {weather?.city || "India"}</h3>
            <span className="badge badge-green" style={{ fontSize: 10 }}>OpenWeatherMap API</span>
          </div>
          <div className="card-body">
            {weather ? (
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                {weather.icon && (
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                    alt={weather.desc} style={{ width: 64, height: 64 }} />
                )}
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#003366", lineHeight: 1 }}>
                    {weather.temp}°C
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize", marginTop: 4 }}>
                    {weather.desc}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    {weather.humidity ? `Humidity: ${weather.humidity}% · ` : ""}
                    Wind: {weather.wind} m/s
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-center"><div className="spinner" /><p>Loading weather...</p></div>
            )}
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, borderTop: "1px solid #e5e7eb", paddingTop: 6 }}>
              Source: OpenWeatherMap API · Updates on page load
            </div>
          </div>
        </div>

        {/* Activity chart */}
        <div className="card">
          <div className="card-header"><h3>📊 Prediction Activity</h3></div>
          <div className="card-body">
            {stats.total === 0 ? (
              <div className="empty-state">
                <div className="icon">📊</div>
                <p>No predictions yet. Start with a Quick Action above.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill="#003366" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Live Mandi Prices from data.gov.in */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>🏪 Live Mandi Prices (₹/Quintal)</h3>
            <span className="badge badge-blue" style={{ fontSize: 10 }}>
              {mandiPrices[0]?.date === "Indicative" ? "Indicative" : "data.gov.in API"}
            </span>
          </div>
          {mandiPrices.length > 5 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowAllMandi(!showAllMandi)}>
              {showAllMandi ? "View Less" : "View All →"}
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {mandiLoading ? (
            <div className="loading-center"><div className="spinner" /><p>Fetching mandi prices from data.gov.in...</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Commodity</th>
                    <th>Market</th>
                    <th>State</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Modal Price</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllMandi ? mandiPrices : mandiPrices.slice(0, 5)).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.crop}</td>
                      <td>{p.market}</td>
                      <td>{p.state}</td>
                      <td>₹{p.minPrice?.toLocaleString("en-IN")}</td>
                      <td>₹{p.maxPrice?.toLocaleString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: "#003366" }}>₹{p.modalPrice?.toLocaleString("en-IN")}</td>
                      <td style={{ fontSize: 11 }}>{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize: 10, color: "#9ca3af", padding: "6px 14px", borderTop: "1px solid #e5e7eb" }}>
            Source: data.gov.in (Agmarknet) · API Key connected · Go to Price Forecasting for ML predictions
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Recent Predictions</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/history")} id="btn-view-all">
            View All →
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>No prediction history found.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr><th>#</th><th>Type</th><th>Crop</th><th>Result</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={r._id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className={`badge ${r.type === "loss" ? "badge-green" : r.type === "price" ? "badge-blue" : "badge-yellow"}`}>
                          {r.type.toUpperCase()}
                        </span>
                      </td>
                      <td>{r.cropName}</td>
                      <td style={{ fontWeight: 600 }}>
                        {r.result?.prediction || (r.result?.predicted_price ? `₹${r.result.predicted_price}` : r.result?.efficiency || "—")}
                      </td>
                      <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
