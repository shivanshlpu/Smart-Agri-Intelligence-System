import { useState } from "react";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";
import PriceChart from "../components/Charts/PriceChart";
import RecommendationCard from "../components/RecommendationCard";

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

const INIT = {
  crop_type: "Wheat", season: "Rabi", state: "Uttar Pradesh",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  min_price: "", max_price: "",
  demand_index: 50, supply_index: 50,
  temperature: "", humidity: ""
};

export default function PredictPrice() {
  const [form, setForm]     = useState(INIT);
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
        min_price:     Number(form.min_price) || 0,
        max_price:     Number(form.max_price) || 0,
        demand_index:  Number(form.demand_index),
        supply_index:  Number(form.supply_index),
        avg_production: Number(form.supply_index) * 100,
        temperature:   Number(form.temperature) || 25,
        humidity:      Number(form.humidity) || 60,
      });
      setResult(data);
      toast.success(`Price forecast: Rs.${data.predicted_price}/Quintal`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 Dashboard › <span>Price Forecasting</span></div>
          <h1>💰 Crop Price Forecasting</h1>
          <p>Predict market modal price based on XGBoost model trained on 737,000+ real Agmarknet mandi records.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="form-section">
          <div className="form-section-header">📋 Crop & Market Information</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Commodity / Crop <span className="required">*</span></label>
                  <select id="price-crop" name="crop_type" className="form-control"
                    value={form.crop_type} onChange={handle}>
                    {CROPS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Season / Ritu <span className="required">*</span></label>
                  <select id="price-season" name="season" className="form-control"
                    value={form.season} onChange={handle}>
                    {SEASONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>State / Rajya <span className="required">*</span></label>
                  <select id="price-state" name="state" className="form-control"
                    value={form.state} onChange={handle}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Month</label>
                  <select id="price-month" name="month" className="form-control"
                    value={form.month} onChange={handle}>
                    {[...Array(12)].map((_,i) => (
                      <option key={i+1} value={i+1}>
                        {new Date(2024,i).toLocaleString("en",{month:"long"})} ({i+1})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Min Price (Rs./Quintal)</label>
                  <input id="price-min" name="min_price" type="number" className="form-control"
                    placeholder="e.g. 1800" min={0} value={form.min_price} onChange={handle} />
                  <span className="form-hint">Known mandi min price (if available)</span>
                </div>

                <div className="form-group">
                  <label>Max Price (Rs./Quintal)</label>
                  <input id="price-max" name="max_price" type="number" className="form-control"
                    placeholder="e.g. 2500" min={0} value={form.max_price} onChange={handle} />
                  <span className="form-hint">Known mandi max price (if available)</span>
                </div>

                <div className="form-group">
                  <label>Demand Index (0–100)</label>
                  <input id="price-demand" name="demand_index" type="range" min={0} max={100}
                    className="form-control" style={{ padding: "4px 0" }}
                    value={form.demand_index} onChange={handle} />
                  <span className="form-hint">Demand: {form.demand_index} / 100</span>
                </div>

                <div className="form-group">
                  <label>Supply Index (0–100)</label>
                  <input id="price-supply" name="supply_index" type="range" min={0} max={100}
                    className="form-control" style={{ padding: "4px 0" }}
                    value={form.supply_index} onChange={handle} />
                  <span className="form-hint">Supply: {form.supply_index} / 100</span>
                </div>
              </div>

              <button id="btn-predict-price" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 18 }} disabled={loading}>
                {loading ? "Forecasting..." : "📈 Forecast Market Price"}
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
                <p>Enter crop details and click <strong>Forecast Market Price</strong>.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center"><div className="spinner" /><p>Running XGBoost on 737k+ records...</p></div>
            </div>
          )}

          {result && (
            <div className="fade-in">
              <div className="card">
                <div className="card-header">
                  <h3>💰 Forecasted Price — {form.crop_type}</h3>
                  <span className="badge badge-green">XGBoost (R²=0.96)</span>
                </div>
                <div className="card-body" style={{ textAlign: "center", padding: "24px" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Predicted Modal Price
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: "#003366", lineHeight: 1, marginTop: 4 }}>
                    ₹{result.predicted_price?.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{result.unit || "per Quintal"}</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    <span className="badge badge-blue">{form.season}</span>
                    <span className="badge badge-gray">{form.state}</span>
                    <span className="badge badge-green">{form.crop_type}</span>
                    <span className="badge badge-yellow">
                      {new Date(2024, Number(form.month)-1).toLocaleString("en",{month:"short"})} {form.year}
                    </span>
                  </div>
                  {result.note && (
                    <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 12, textAlign: "left" }}>{result.note}</div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-header"><h3>📈 Seasonal Price Trend</h3></div>
                <div className="card-body">
                  <PriceChart predictedPrice={result.predicted_price} cropName={form.crop_type} />
                </div>
              </div>

              <RecommendationCard recommendations={result.recommendations} title="Market Advisory" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
