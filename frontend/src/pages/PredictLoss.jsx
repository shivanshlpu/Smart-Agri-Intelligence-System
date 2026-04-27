import { useState, useEffect } from "react";
import API from "../api/axiosConfig";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";
import LossResult from "../components/Charts/LossResult";
import RecommendationCard from "../components/RecommendationCard";

const CROPS = ["Wheat","Rice","Tomato","Onion","Potato","Maize","Sugarcane","Cotton",
  "Soybean","Groundnut","Bajra","Jowar","Barley","Mustard","Mango","Apple",
  "Banana","Chickpea","Lentil","Jute","Coffee","Tea","Millet","Watermelon"];

const INIT = {
  crop_type: "Wheat", temperature: "", humidity: "", rainfall: "",
  ph: "6.5", soil_moisture: "30", storage_condition: "Mild",
  ndvi: "0.55", nitrogen: "50", phosphorus: "40", potassium: "40"
};

export default function PredictLoss() {
  const { t } = useLang();
  const [form, setForm]     = useState(INIT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);

  useEffect(() => {
    // Attempt to auto-fetch weather on mount
    fetchWeatherWithGPS(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWeatherWithGPS = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    setFetchingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const weatherKey = import.meta.env.VITE_WEATHER_API_KEY;
          
          if (weatherKey && weatherKey !== "your_openweathermap_api_key_here") {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherKey}`);
            const data = await res.json();
            if (data.main) {
              setForm(prev => ({
                ...prev,
                temperature: Math.round(data.main.temp),
                humidity: data.main.humidity
              }));
              if (!silent) toast.success("✅ Auto-filled weather from your location!");
            } else if (!silent) {
              toast.error("Could not fetch weather data for your location.");
            }
          } else if (!silent) {
            toast.error("Weather API key is not configured.");
          }
        } catch (error) {
          console.error("Weather fetch error", error);
          if (!silent) toast.error("Failed to fetch weather data.");
        } finally {
          setFetchingWeather(false);
        }
      },
      (error) => {
        console.warn("Geolocation denied or error:", error);
        if (!silent) toast.warning("Could not get your location. Please enter weather manually.");
        setFetchingWeather(false);
      }
    );
  };

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
      toast.success(`✅ ${data.prediction}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Prediction failed. Check ML Server.");
    } finally { setLoading(false); }
  };

  const reset = () => { setForm(INIT); setResult(null); };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 {t("nav.dashboard")} › <span>{t("nav.loss")}</span></div>
          <h1>{t("loss.title")}</h1>
          <p>{t("loss.subtitle")}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Input Form */}
        <div>
          <div className="form-section">
            <div className="form-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{t("loss.formTitle")}</span>
              <button type="button" className="btn btn-sm btn-outline" 
                onClick={() => fetchWeatherWithGPS(false)} disabled={fetchingWeather}
                style={{ padding: "4px 8px", fontSize: 12, color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
                {fetchingWeather ? t("loss.gpsFetching") : t("loss.gpsBtn")}
              </button>
            </div>
            <div className="form-body">
              <form onSubmit={submit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("loss.cropType")} <span className="required">*</span></label>
                    <select id="loss-crop" name="crop_type" className="form-control"
                      value={form.crop_type} onChange={handle} required>
                      {CROPS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("loss.stressLevel")} <span className="required">*</span></label>
                    <select id="loss-storage" name="storage_condition" className="form-control"
                      value={form.storage_condition} onChange={handle}>
                      <option value="None">{t("loss.stressNone")}</option>
                      <option value="Mild">{t("loss.stressMild")}</option>
                      <option value="Moderate">{t("loss.stressMod")}</option>
                      <option value="Severe">{t("loss.stressSevere")}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t("loss.temp")} <span className="required">*</span></label>
                    <input id="loss-temp" name="temperature" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 28.5" min={-10} max={55} value={form.temperature} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.humidity")} <span className="required">*</span></label>
                    <input id="loss-humidity" name="humidity" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 65" min={0} max={100} value={form.humidity} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.rainfall")} <span className="required">*</span></label>
                    <input id="loss-rainfall" name="rainfall" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 120" min={0} max={1000} value={form.rainfall} onChange={handle} required />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.soilPh")}</label>
                    <input id="loss-ph" name="ph" type="number" step="0.01" className="form-control"
                      placeholder="e.g. 6.5" min={0} max={14} value={form.ph} onChange={handle} />
                    <span className="form-hint">{t("loss.phHint")}</span>
                  </div>

                  <div className="form-group">
                    <label>{t("loss.soilMoisture")}</label>
                    <input id="loss-moisture" name="soil_moisture" type="number" step="0.1" className="form-control"
                      placeholder="e.g. 30" min={0} max={100} value={form.soil_moisture} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.greenness")}</label>
                    <input id="loss-ndvi" name="ndvi" type="number" step="0.01" className="form-control"
                      placeholder="e.g. 0.55" min={0} max={1} value={form.ndvi} onChange={handle} />
                    <span className="form-hint">{t("loss.greennessHint")}</span>
                  </div>

                  <div className="form-group">
                    <label>{t("loss.nitrogen")}</label>
                    <input id="loss-n" name="nitrogen" type="number" className="form-control"
                      placeholder="e.g. 50" min={0} max={200} value={form.nitrogen} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.phosphorus")}</label>
                    <input id="loss-p" name="phosphorus" type="number" className="form-control"
                      placeholder="e.g. 40" min={0} max={200} value={form.phosphorus} onChange={handle} />
                  </div>

                  <div className="form-group">
                    <label>{t("loss.potassium")}</label>
                    <input id="loss-k" name="potassium" type="number" className="form-control"
                      placeholder="e.g. 40" min={0} max={200} value={form.potassium} onChange={handle} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button id="btn-predict-loss" type="submit" className="btn btn-success btn-lg"
                    disabled={loading} style={{ flex: 1 }}>
                    {loading ? t("loss.predicting") : t("loss.predictBtn")}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={reset}>{t("loss.reset")}</button>
                </div>
              </form>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: 14 }}>
            <div>{t("loss.howItWorks")}</div>
          </div>
        </div>

        {/* Results */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state" style={{ padding: "50px 20px" }}>
                <div className="icon">🌿</div>
                <p>{t("loss.emptyState")}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center"><div className="spinner" /><p>{t("loss.analyzing")}</p></div>
            </div>
          )}

          {result && !loading && (
            <div className="fade-in">
              <LossResult prediction={result.prediction} probabilities={result.probabilities || []} />

              {result.note && (
                <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 12 }}>{result.note}</div>
              )}

              <RecommendationCard
                recommendations={result.recommendations}
                recommendations_hi={result.recommendations_hi}
                title="rec.govActions"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
