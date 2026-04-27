import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import API from "../api/axiosConfig";

export default function Home() {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats]     = useState({ total: 0, byType: [] });
  const [history, setHistory] = useState([]);
  const [mlStatus, setMlStatus]   = useState(null);
  const [weather, setWeather]     = useState(null);
  const [mandiPrices, setMandiPrices] = useState([]);
  const [mandiLoading, setMandiLoading] = useState(true);
  const [mandiConnected, setMandiConnected] = useState(false);
  const [showAllMandi, setShowAllMandi] = useState(false);

  const QUICK_ACTIONS = [
    { labelKey: "home.predictLoss",  icon: "🌿", path: "/loss",   color: "var(--gov-green)" },
    { labelKey: "home.predictPrice", icon: "💰", path: "/price",  color: "var(--gov-navy)" },
    { labelKey: "home.supplyChain",  icon: "🚛", path: "/supply", color: "var(--gov-saffron)" },
    { labelKey: "home.viewHistory",  icon: "📋", path: "/history", color: "#6b7280" },
  ];

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
          // Fallback to Open-Meteo (no key needed — this is a real API, not static)
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
      fetch(`${mandiUrl}?api-key=${govKey}&format=json&limit=50&filters[state]=${userState}`)
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
            setMandiConnected(true);
          }
        })
        .catch(() => {})
        .finally(() => setMandiLoading(false));
    } else {
      setMandiLoading(false);
    }
  }, []);

  const typeCount = (type) =>
    stats.byType?.find(b => b._id === type)?.count ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("home.greeting.morning");
    if (h < 17) return t("home.greeting.afternoon");
    return t("home.greeting.evening");
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 <span>{t("nav.dashboard")}</span></div>
          <h1>{t("home.title")}</h1>
          <p>{greeting()}, {user?.name?.split(" ")[0] || "Farmer"}! {t("home.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div className={`badge ${mlStatus === "ok" ? "badge-green" : "badge-red"}`} style={{ fontSize: 11 }}>
            🐍 {mlStatus === "ok" ? t("home.mlOnline") : mlStatus === "offline" ? t("home.mlOffline") : "..."}
          </div>
          {weather && (
            <div className="badge badge-blue" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              {weather.icon && (
                <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
                  alt="" style={{ width: 20, height: 20 }} />
              )}
              {weather.city}: {weather.temp}°C
              {weather.humidity ? ` · ${weather.humidity}%` : ""}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">{t("home.totalPred")}</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">{t("home.totalSub")}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🌿</div>
          <div className="stat-label">{t("home.lossPred")}</div>
          <div className="stat-value">{typeCount("loss")}</div>
          <div className="stat-sub">{t("home.lossSub")}</div>
        </div>
        <div className="stat-card saffron">
          <div className="stat-icon">💰</div>
          <div className="stat-label">{t("home.pricePred")}</div>
          <div className="stat-value">{typeCount("price")}</div>
          <div className="stat-sub">{t("home.priceSub")}</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">🚛</div>
          <div className="stat-label">{t("home.supplyPred")}</div>
          <div className="stat-value">{typeCount("supply")}</div>
          <div className="stat-sub">{t("home.supplySub")}</div>
        </div>
      </div>

      {/* Quick Actions — Large thumb-friendly buttons */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>{t("home.quickActions")}</h3>
        </div>
        <div className="card-body quick-actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.path} id={`quick-${a.path.replace("/","")}`}
              onClick={() => navigate(a.path)}
              className="quick-action-btn"
              style={{ '--action-color': a.color }}
            >
              <span className="quick-action-icon">{a.icon}</span>
              <span className="quick-action-label">{t(a.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weather Card */}
      <div className="card mb-4">
        <div className="card-header">
          <h3>{t("home.weather")} — {weather?.city || "India"}</h3>
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
                  {weather.humidity ? `${t("loss.humidity")}: ${weather.humidity}% · ` : ""}
                  Wind: {weather.wind} m/s
                </div>
              </div>
            </div>
          ) : (
            <div className="loading-center"><div className="spinner" /><p>{t("home.loadingWeather")}</p></div>
          )}
          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, borderTop: "1px solid #e5e7eb", paddingTop: 6 }}>
            {t("home.weatherSource")}
          </div>
        </div>
      </div>

      {/* Live Mandi Prices from data.gov.in */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>{t("home.mandi")}</h3>
            {mandiConnected && (
              <span className="badge badge-blue" style={{ fontSize: 10 }}>data.gov.in API</span>
            )}
          </div>
          {mandiPrices.length > 5 && (
            <button className="btn btn-outline btn-sm" onClick={() => setShowAllMandi(!showAllMandi)}>
              {showAllMandi ? t("home.viewLess") : t("home.viewAll")}
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {mandiLoading ? (
            <div className="loading-center"><div className="spinner" /><p>{t("home.mandiLoading")}</p></div>
          ) : mandiPrices.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 20px" }}>
              <div className="icon">🏪</div>
              <p>{t("home.mandiNoApi")}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>{t("home.commodity")}</th>
                    <th>{t("home.market")}</th>
                    <th>{t("home.minPrice")}</th>
                    <th>{t("home.maxPrice")}</th>
                    <th>{t("home.modalPrice")}</th>
                    <th>{t("home.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllMandi ? mandiPrices : mandiPrices.slice(0, 5)).map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.crop}</td>
                      <td>{p.market}</td>
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
            {t("home.mandiSource")}
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="card">
        <div className="card-header">
          <h3>{t("home.recentPred")}</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate("/history")} id="btn-view-all">
            {t("home.viewAll")}
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {history.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><p>{t("home.noPred")}</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr><th>#</th><th>{t("home.type")}</th><th>{t("home.crop")}</th><th>{t("home.result")}</th><th>{t("home.date")}</th></tr>
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
