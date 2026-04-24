import { useState } from "react";
import API from "../api/axiosConfig";
import { toast } from "react-toastify";
import ClusterMap from "../components/Charts/ClusterMap";
import RecommendationCard from "../components/RecommendationCard";

const INIT = {
  region: "", delivery_time: "", transport_cost: "",
  distance_km: "", spoilage_rate: "", delay_days: "",
  storage_availability: true, congestion_level: "", risk_level: ""
};

const EFFICIENCY_COLORS = {
  "High Efficiency":   { bg: "var(--status-low-bg)",  border: "#6ee7b7", color: "#065f46" },
  "Medium Efficiency": { bg: "var(--status-med-bg)",  border: "#fcd34d", color: "#92400e" },
  "Low Efficiency":    { bg: "var(--status-high-bg)", border: "#fca5a5", color: "#991b1b" },
};

export default function SupplyChain() {
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
      toast.success(`Analysis complete: ${data.efficiency}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed.");
    } finally { setLoading(false); }
  };

  const ec = result ? EFFICIENCY_COLORS[result.efficiency] || {} : {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">🏠 Dashboard › <span>Supply Chain Analysis</span></div>
          <h1>🚛 Supply Chain Efficiency Analysis</h1>
          <p>Identify your supply chain efficiency routing cluster using K-Means ML model trained on real historical logistics data.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="form-section">
          <div className="form-section-header">📋 Detailed Logistics Information</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label>Region / Kshetra</label>
                  <input id="supply-region" name="region" className="form-control"
                    placeholder="e.g. North UP, Western Maharashtra" value={form.region} onChange={handle} />
                </div>

                <div className="form-group">
                  <label>Standard Delivery Time (Days) <span className="required">*</span></label>
                  <input id="supply-delivery" name="delivery_time" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 5" min={0} value={form.delivery_time} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>Delay Days</label>
                  <input id="supply-delay" name="delay_days" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 2" min={0} value={form.delay_days} onChange={handle} />
                  <span className="form-hint">Expected delay</span>
                </div>

                <div className="form-group">
                  <label>Transport Cost (₹) <span className="required">*</span></label>
                  <input id="supply-cost" name="transport_cost" type="number" className="form-control"
                    placeholder="e.g. 800" min={0} value={form.transport_cost} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>Distance to Market (km) <span className="required">*</span></label>
                  <input id="supply-distance" name="distance_km" type="number" className="form-control"
                    placeholder="e.g. 150" min={0} value={form.distance_km} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>Spoilage / Defect Rate (%) <span className="required">*</span></label>
                  <input id="supply-spoilage" name="spoilage_rate" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 5.5" min={0} max={100} value={form.spoilage_rate} onChange={handle} required />
                </div>

                <div className="form-group">
                  <label>Route Risk Level (0-10)</label>
                  <input id="supply-risk" name="risk_level" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 2.5" min={0} max={10} value={form.risk_level} onChange={handle} />
                </div>
                
                <div className="form-group">
                  <label>Congestion Level (0-10)</label>
                  <input id="supply-congestion" name="congestion_level" type="number" step="0.1" className="form-control"
                    placeholder="e.g. 4.0" min={0} max={10} value={form.congestion_level} onChange={handle} />
                </div>

                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input id="supply-storage" name="storage_availability" type="checkbox"
                      checked={form.storage_availability} onChange={handle}
                      style={{ width: 16, height: 16 }} />
                    Storage / Warehouse Facility Available
                  </label>
                </div>
              </div>

              <button id="btn-predict-supply" type="submit" className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 16 }} disabled={loading}>
                {loading ? "Analysing cluster..." : "🔍 Analyse Supply Chain"}
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
                <p>Enter logistics data and click <strong>Analyse Supply Chain</strong>.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card"><div className="loading-center"><div className="spinner" /><p>Running K-Means clustering...</p></div></div>
          )}

          {result && (
            <div className="fade-in">
              <div style={{ background: ec.bg, border: `1px solid ${ec.border}`, borderRadius: 6, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: ec.color }}>
                      Cluster {result.cluster + 1} · K-Means Analysis
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ec.color, marginTop: 4 }}>
                      {result.efficiency}
                    </div>
                    {result.region && (
                      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>📍 {form.region}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 44 }}>
                    {result.efficiency?.includes("High") ? "🏆" : result.efficiency?.includes("Medium") ? "⚠️" : "🚨"}
                  </div>
                </div>
                {result.note && (
                  <div className="alert alert-warning" style={{ marginTop: 12, fontSize: 12 }}>{result.note}</div>
                )}
              </div>

              <div className="card" style={{ marginTop: 14 }}>
                <div className="card-header"><h3>📊 Performance Metrics</h3></div>
                <div className="card-body">
                  <ClusterMap cluster={result.cluster} inputData={form} />
                </div>
              </div>

              <RecommendationCard recommendations={result.recommendations} title="Supply Chain Advisory" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
