import { useState } from "react";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";
import RecommendationCard from "../components/RecommendationCard";

const CROPS = ["Wheat","Rice","Tomato","Onion","Potato","Maize","Sugarcane","Cotton",
  "Soybean","Groundnut","Bajra","Jowar","Barley","Mustard","Mango","Apple","Banana",
  "Chickpea","Lentil","Turmeric","Chilli","Ginger","Garlic","Coffee","Tea"];

const STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

const TEXT = {
  en: {
    title: "💰 Crop Price Forecasting",
    subtitle: "Prediction based on past market data",
    breadcrumb: "🏠 Dashboard › Price Forecasting",
    formHeader: "📋 Crop & Market Information",
    cropLabel: "Commodity / Crop",
    stateLabel: "State",
    monthLabel: "Month",
    btnForecast: "📈 Check Price",
    btnLoading: "Forecasting...",
    emptyState: "Enter crop details and click Check Price.",
    forecastTitle: "💰 Expected Price —",
    unit: "per Quintal",
    priceUp: "📈 Price is High",
    priceDown: "📉 Low Price",
    priceStable: "➖ Stable Price",
    advisoryTitle: "Market Advisory"
  },
  hi: {
    title: "💰 फसल मूल्य अनुमान",
    subtitle: "यह अनुमान पिछले बाजार डेटा पर आधारित है",
    breadcrumb: "🏠 डैशबोर्ड › मूल्य अनुमान",
    formHeader: "📋 फसल और बाजार की जानकारी",
    cropLabel: "फसल (Crop)",
    stateLabel: "राज्य (State)",
    monthLabel: "महीना (Month)",
    btnForecast: "📈 कीमत देखें",
    btnLoading: "अनुमान लगाया जा रहा है...",
    emptyState: "फसल का विवरण दर्ज करें और 'कीमत देखें' पर क्लिक करें।",
    forecastTitle: "💰 अनुमानित कीमत —",
    unit: "प्रति क्विंटल",
    priceUp: "📈 कीमत अधिक है",
    priceDown: "📉 कम कीमत",
    priceStable: "➖ स्थिर कीमत",
    advisoryTitle: "बाजार सलाह (Advisory)"
  }
};

const INIT = {
  crop_type: "Wheat", state: "Uttar Pradesh",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear())
};

export default function PredictPrice() {
  const [lang, setLang]     = useState("en");
  const [form, setForm]     = useState(INIT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const t = TEXT[lang];

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // We send default technical values to the backend to keep the ML model working
      const { data } = await API.post("/predict/price", {
        crop_type:     form.crop_type,
        season:        "Rabi", // Defaulting season
        state:         form.state,
        month:         Number(form.month),
        year:          Number(form.year),
        min_price:     0,
        max_price:     0,
        demand_index:  50,
        supply_index:  50,
        avg_production: 5000,
        temperature:   25,
        humidity:      60,
      });
      setResult(data);
      toast.success(lang === "en" ? `Price forecast: Rs.${data.predicted_price}/Quintal` : `अनुमानित कीमत: ₹${data.predicted_price}/क्विंटल`);
    } catch (err) {
      toast.error(err.response?.data?.error || (lang === "en" ? "Prediction failed." : "अनुमान विफल रहा।"));
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div className="breadcrumb">{t.breadcrumb}</div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        
        {/* Language Toggle */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "4px" }}>
          <button 
            type="button"
            onClick={() => setLang("en")}
            style={{ 
              padding: "6px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
              background: lang === "en" ? "#fff" : "transparent",
              color: lang === "en" ? "#003366" : "#64748b",
              boxShadow: lang === "en" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}>
            English
          </button>
          <button 
            type="button"
            onClick={() => setLang("hi")}
            style={{ 
              padding: "6px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "14px",
              background: lang === "hi" ? "#fff" : "transparent",
              color: lang === "hi" ? "#003366" : "#64748b",
              boxShadow: lang === "hi" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}>
            हिंदी
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="form-section">
          <div className="form-section-header">{t.formHeader}</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>{t.cropLabel}</label>
                  <select id="price-crop" name="crop_type" className="form-control" style={{ fontSize: "16px", padding: "12px" }}
                    value={form.crop_type} onChange={handle}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.stateLabel}</label>
                  <select id="price-state" name="state" className="form-control" style={{ fontSize: "16px", padding: "12px" }}
                    value={form.state} onChange={handle}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.monthLabel}</label>
                  <select id="price-month" name="month" className="form-control" style={{ fontSize: "16px", padding: "12px" }}
                    value={form.month} onChange={handle}>
                    {[...Array(12)].map((_,i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(2024,i).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {month:"long"})} ({i+1})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button id="btn-predict-price" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 24, fontSize: "18px", padding: "16px" }} disabled={loading}>
                {loading ? t.btnLoading : t.btnForecast}
              </button>
            </form>
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state" style={{ padding: "60px 20px" }}>
                <div className="icon">💰</div>
                <p style={{ fontSize: "16px" }}>{t.emptyState}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center" style={{ padding: "60px 20px" }}>
                <div className="spinner" />
                <p>{t.btnLoading}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="fade-in">
              <div className="card">
                <div className="card-header" style={{ justifyContent: "center", background: "#f8fafc" }}>
                  <h3 style={{ fontSize: "18px", color: "#334155" }}>{t.forecastTitle} {form.crop_type}</h3>
                </div>
                <div className="card-body" style={{ textAlign: "center", padding: "32px 24px" }}>
                  
                  {/* Dynamic Trend Indicator */}
                  {result.recommendations?.trend === "up" && (
                    <div style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>
                      {t.priceUp}
                    </div>
                  )}
                  {result.recommendations?.trend === "down" && (
                    <div style={{ display: "inline-block", background: "#fee2e2", color: "#991b1b", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>
                      {t.priceDown}
                    </div>
                  )}
                  {result.recommendations?.trend === "stable" && (
                    <div style={{ display: "inline-block", background: "#fef9c3", color: "#854d0e", padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>
                      {t.priceStable}
                    </div>
                  )}

                  {/* Main Price */}
                  <div style={{ fontSize: 56, fontWeight: 800, color: "#003366", lineHeight: 1 }}>
                    ₹{result.predicted_price?.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 16, color: "#6b7280", marginTop: 8, fontWeight: 500 }}>{t.unit}</div>
                  
                </div>
              </div>

              {/* Localized Recommendations */}
              <RecommendationCard 
                recommendations={result.recommendations?.[lang] || []} 
                title={t.advisoryTitle} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
