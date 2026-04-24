import { useState } from "react";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";
import LossGauge from "../components/Charts/LossGauge";
import RecommendationCard from "../components/RecommendationCard";

const CROPS = ["Wheat","Rice","Tomato","Onion","Potato","Maize","Sugarcane","Cotton",
  "Soybean","Groundnut","Bajra","Jowar","Barley","Mustard","Mango","Apple",
  "Banana","Chickpea","Lentil","Jute","Coffee","Tea","Millet","Watermelon"];
const STORAGE_OPTIONS = [
  { label: "None / No Disease", value: "None" },
  { label: "Mild Stress", value: "Mild" },
  { label: "Moderate Stress", value: "Moderate" },
  { label: "Severe Stress / Open Shed", value: "Severe" },
];

const INIT = {
  crop_type: "Wheat", temperature: "", humidity: "", rainfall: "",
  ph: "6.5", soil_moisture: "30", storage_condition: "Mild",
  ndvi: "0.55", nitrogen: "50", phosphorus: "40", potassium: "40"
};

export default function PredictLoss() {
  const [form, setForm]     = useState(INIT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/predict/loss", {
        crop_type:         form.crop_type,
        temperature:       Number(form.temperature),
        humidity:          Number(form.humidity),
        rainfall:          Number(form.rainfall),
        ph:                Number(form.ph),
        soil_moisture:     Number(form.soil_moisture),
        storage_condition: form.storage_condition,
        ndvi:              Number(form.ndvi),
        nitrogen:          Number(form.nitrogen),
        phosphorus:        Number(form.phosphorus),
        potassium:         Number(form.potassium),
      });
      setResult(data);
      toast.success(`Prediction complete: ${data.prediction} Risk detected.`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed. Check ML Server.");
    } finally { setLoading(false); }
  };

  const reset = () => { setForm(INIT); setResult(null); };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 Dashboard › <span>Crop Loss Prediction</span></div>
          <h1>🌿 Post-Harvest Loss Prediction</h1>
          <p>Enter crop, weather, and soil details to predict post-harvest loss risk using RandomForest ML model.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Input Form */}
        <div>
          <div className="form-section">
            <div className="form-section-header">
              📋 Crop, Weather & Soil Information
            </div>
            <div className="form-body">
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Crop Type / Fasal <span className="required">*</span></label>
                    <select id="loss-crop" name="crop_type" className="form-control"
                      value={form.crop_type} onChange={handle} required>
                      {CROPS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Crop Stress Level <span className="required">*</span></label>
                    <select id="loss-storage" name="storage_condition" className="form-control"
                      value={form.storage_condition} onChange={handle}>
                      {STORAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <span className="form-hint">Disease/storage stress condition</span>
                  </div>

                  <div className="form-group">
                    <label>Temperature (°C) <span className="required">*</span></label>
                    <input id="loss-temp" name="temperature" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 28.5" min={-10} max={55} value={form.temperature} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>Humidity (%) <span className="required">*</span></label>
                    <input id="loss-humidity" name="humidity" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 65" min={0} max={100} value={form.humidity} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>Rainfall (mm) <span className="required">*</span></label>
                    <input id="loss-rainfall" name="rainfall" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 120" min={0} max={1000} value={form.rainfall} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>Soil pH</label>
                    <input id="loss-ph" name="ph" type="number" step="0.01" className="form-control"
                      placeholder="e.g. 6.5" min={0} max={14} value={form.ph} onChange={handle} />
                    <span className="form-hint">Ideal: 5.5 – 7.5</span>
                  </div>

                  <div className="form-group">
                    <label>Soil Moisture (%)</label>
                    <input id="loss-moisture" name="soil_moisture" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 30" min={0} max={100} value={form.soil_moisture} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>NDVI Index</label>
                    <input id="loss-ndvi" name="ndvi" type="number" step="0.01" className="form-control"
                      placeholder="e.g. 0.55" min={0} max={1} value={form.ndvi} onChange={handle} />
                    <span className="form-hint">Vegetation health: 0=dead, 1=healthy</span>
                  </div>

                  <div className="form-group">
                    <label>Nitrogen (N) kg/ha</label>
                    <input id="loss-n" name="nitrogen" type="number" className="form-control"
                      placeholder="e.g. 50" min={0} max={200} value={form.nitrogen} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>Phosphorus (P) kg/ha</label>
                    <input id="loss-p" name="phosphorus" type="number" className="form-control"
                      placeholder="e.g. 40" min={0} max={200} value={form.phosphorus} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>Potassium (K) kg/ha</label>
                    <input id="loss-k" name="potassium" type="number" className="form-control"
                      placeholder="e.g. 40" min={0} max={200} value={form.potassium} onChange={handle} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button id="btn-predict-loss" type="submit" className="btn btn-success btn-lg"
                    disabled={loading} style={{ flex: 1 }}>
                    {loading ? "Analysing..." : "🔍 Predict Loss Risk"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={reset}>Reset</button>
                </div>
              </form>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 14 }}>
            <div>
              <strong>How this works:</strong> Model uses <strong>RandomForest</strong> classifier trained on 85,000+ real data points
              from <em>agriculture_dataset 2.csv</em>, <em>Smart_Farming_Crop_Yield_2024.csv</em>, and <em>Crop_recommendation.csv</em>.
              Features include crop type, weather, soil nutrients (NPK), NDVI vegetation index, and stress levels.
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state" style={{ padding: "50px 20px" }}>
                <div className="icon">🌿</div>
                <p>Fill the form and click <strong>Predict Loss Risk</strong> to get your result.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center"><div className="spinner" /><p>Running RandomForest model on 85k+ data...</p></div>
            </div>
          )}

          {result && !loading && (
            <div className="fade-in">
              <div className={`result-card risk-${result.prediction?.toLowerCase()}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Prediction Result</h3>
                  <span className={`risk-badge ${result.prediction?.toLowerCase()}`}>
                    {result.prediction} Risk
                  </span>
                </div>
                {result.note && (
                  <div className="alert alert-warning" style={{ marginBottom: 12, fontSize: 12 }}>{result.note}</div>
                )}
                <div className="card" style={{ marginTop: 12 }}>
                  <div className="card-body">
                    <LossGauge prediction={result.prediction} probabilities={result.probabilities || []} />
                  </div>
                </div>
              </div>
              <RecommendationCard recommendations={result.recommendations} title="Government-Recommended Actions" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
