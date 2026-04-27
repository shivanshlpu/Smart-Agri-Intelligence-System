import { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import { useLang } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import PriceResult from "../components/Charts/PriceResult";
import RecommendationCard from "../components/RecommendationCard";
import PriceChart from "../components/Charts/PriceChart";

const CROPS = ["Wheat","Rice","Tomato","Onion","Potato","Maize","Sugarcane","Cotton",
  "Soybean","Groundnut","Bajra","Jowar","Barley","Mustard","Mango","Apple","Banana",
  "Chickpea","Lentil","Turmeric","Chilli","Ginger","Garlic","Coffee","Tea"];
const SEASONS = ["Kharif","Rabi","Zaid"];
const STATES = [
  "Andhra Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"
];

export default function PredictPrice() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    crop_type: "Wheat", 
    season: "Rabi", 
    state: user?.location?.state || "Uttar Pradesh",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/predict/price", {
        crop_type:     form.crop_type,
        season:        form.season,
        state:         form.state,
        month:         Number(form.month),
        year:          Number(form.year),
        min_price:     0,  // Auto-filled by ML server from historical data
        max_price:     0,
        demand_index:  50,
        supply_index:  50,
        avg_production: 5000,
      });
      setResult(data);
      const priceDisplay = Math.max(data.predicted_price || 0, 0);
      toast.success(`₹${priceDisplay.toLocaleString("en-IN")}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 {t("nav.dashboard")} › <span>{t("nav.price")}</span></div>
          <h1>{t("price.title")}</h1>
          <p>{t("price.subtitle")}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="form-section">
          <div className="form-section-header">{t("price.formTitle")}</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t("price.crop")} <span className="required">*</span></label>
                  <select id="price-crop" name="crop_type" className="form-control"
                    value={form.crop_type} onChange={handle}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("price.season")} <span className="required">*</span></label>
                  <select id="price-season" name="season" className="form-control"
                    value={form.season} onChange={handle}>
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("price.state")} <span className="required">*</span></label>
                  <select id="price-state" name="state" className="form-control"
                    value={form.state} onChange={handle}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("price.month")}</label>
                  <select id="price-month" name="month" className="form-control"
                    value={form.month} onChange={handle}>
                    {[...Array(12)].map((_,i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(2024,i).toLocaleString(lang === "hi" ? "hi-IN" : "en",{month:"long"})} ({i+1})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button id="btn-predict-price" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 18 }} disabled={loading}>
                {loading ? t("price.predicting") : t("price.predictBtn")}
              </button>
            </form>
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state">
                <div className="icon">💰</div>
                <p>{t("price.emptyState")}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center"><div className="spinner" /><p>{t("price.analyzing")}</p></div>
            </div>
          )}

          {result && (
            <div className="fade-in">
              <PriceResult
                predictedPrice={result.predicted_price}
                cropName={form.crop_type}
                season={form.season}
                state={form.state}
              />

              {result.note && (
                <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 12 }}>{result.note}</div>
              )}

              <RecommendationCard
                recommendations={result.recommendations}
                recommendations_hi={result.recommendations_hi}
                title="rec.marketAdvisory"
              />

              <PriceChart crop={form.crop_type} state={form.state} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
