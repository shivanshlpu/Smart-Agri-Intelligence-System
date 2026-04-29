import { useState } from "react";
import API from "../api/axiosConfig";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";
import SupplyResult from "../components/Charts/SupplyResult";
import RecommendationCard from "../components/RecommendationCard";

const INIT = {
  region: "", delivery_time: "", transport_cost: "",
  distance_km: "", spoilage_rate: "", delay_days: "",
  storage_availability: true, congestion_level: "", risk_level: ""
};

export default function SupplyChain() {
  const { t } = useLang();
  const [form, setForm]     = useState(INIT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/predict/supply", {
        region:               form.region,
        delivery_time:        Number(form.delivery_time) || 0,
        transport_cost:       Number(form.transport_cost) || 0,
        spoilage_rate:        Number(form.spoilage_rate) || 0,
        distance_km:          Number(form.distance_km) || 0,
        delay_days:           Number(form.delay_days) || 0,
        storage_availability: Boolean(form.storage_availability),
        congestion_level:     Number(form.congestion_level) || 0,
        risk_level:           Number(form.risk_level) || 0,
      });
      setResult({ ...data, inputData: form });
      toast.success(`✅ ${data.efficiency}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 {t("nav.dashboard")} › <span>{t("nav.supply")}</span></div>
          <h1>{t("supply.title")}</h1>
          <p>{t("supply.subtitle")}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="form-section">
          <div className="form-section-header">{t("supply.formTitle")}</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>{t("supply.region")}</label>
                  <input id="supply-region" name="region" className="form-control"
                    placeholder="e.g. North UP, Western Maharashtra" value={form.region} onChange={handle} />
                </div>

                <div className="form-group">
                  <label>{t("supply.deliveryTime")} <span className="required">*</span></label>
                  <input id="supply-delivery" name="delivery_time" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 5" min={0} value={form.delivery_time} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>{t("supply.delayDays")}</label>
                  <input id="supply-delay" name="delay_days" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 2" min={0} value={form.delay_days} onChange={handle} />
                </div>

                <div className="form-group">
                  <label>{t("supply.transportCost")} <span className="required">*</span></label>
                  <input id="supply-cost" name="transport_cost" type="number" className="form-control"
                    placeholder="e.g. 800" min={0} value={form.transport_cost} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>{t("supply.distance")} <span className="required">*</span></label>
                  <input id="supply-distance" name="distance_km" type="number" className="form-control"
                    placeholder="e.g. 150" min={0} value={form.distance_km} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>{t("supply.spoilage")} <span className="required">*</span></label>
                  <input id="supply-spoilage" name="spoilage_rate" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 5.5" min={0} max={100} value={form.spoilage_rate} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>{t("supply.risk")}</label>
                  <input id="supply-risk" name="risk_level" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 2.5" min={0} max={10} value={form.risk_level} onChange={handle} />
                </div>
                
                <div className="form-group">
                  <label>{t("supply.congestion")}</label>
                  <input id="supply-congestion" name="congestion_level" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 4.0" min={0} max={10} value={form.congestion_level} onChange={handle} />
                </div>

                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input id="supply-storage" name="storage_availability" type="checkbox"
                      checked={form.storage_availability} onChange={handle}
                      style={{ width: 18, height: 18 }} />
                    {t("supply.storage")}
                  </label>
                </div>
              </div>

              <button id="btn-predict-supply" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 16 }} disabled={loading}>
                {loading ? t("supply.predicting") : t("supply.predictBtn")}
              </button>
            </form>
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state">
                <div className="icon">🚛</div>
                <p>{t("supply.emptyState")}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card"><div className="loading-center"><div className="spinner" /><p>{t("supply.analyzing")}</p></div></div>
          )}

          {result && (
            <div className="fade-in">
              <SupplyResult
                efficiency={result.efficiency}
                cluster={result.cluster}
                inputData={form}
                costPerKm={result.cost_per_km}
                avgCostPerKm={result.avg_cost_per_km}
              />

              {result.note && (
                <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 12 }}>{result.note}</div>
              )}

              <RecommendationCard
                recommendations={result.recommendations}
                recommendations_hi={result.recommendations_hi}
                title="rec.supplyAdvisory"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
