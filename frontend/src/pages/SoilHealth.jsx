import { useState } from "react";
import API from "../api/axiosConfig";
import { useLang } from "../context/LanguageContext";
import { toast } from "react-toastify";
import RecommendationCard from "../components/RecommendationCard";

export default function SoilHealth() {
  const { t, lang } = useLang();

  const [form, setForm] = useState({
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    ph: "",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await API.post("/predict/soil", {
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        ph: Number(form.ph),
      });
      setResult(data);
      const label = lang === "hi" ? data.health_label_hi : data.health_label;
      toast.success(`${t("soil.healthLabel")}: ${label} (${data.health_score}/100)`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const healthColors = {
    green: { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
    yellow: { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
    red: { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" },
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            🏠 {t("nav.dashboard")} › <span>{t("nav.soil")}</span>
          </div>
          <h1>{t("soil.title")}</h1>
          <p>{t("soil.subtitle")}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="form-section">
          <div className="form-section-header">{t("soil.formTitle")}</div>
          <div className="form-body">
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    {t("soil.nitrogen")} <span className="required">*</span>
                  </label>
                  <input
                    id="soil-nitrogen"
                    type="number"
                    name="nitrogen"
                    className="form-control"
                    placeholder="e.g. 80"
                    value={form.nitrogen}
                    onChange={handle}
                    min="0"
                    max="400"
                    required
                  />
                  <span className="form-hint">{t("soil.nitrogenHint")}</span>
                </div>

                <div className="form-group">
                  <label>
                    {t("soil.phosphorus")} <span className="required">*</span>
                  </label>
                  <input
                    id="soil-phosphorus"
                    type="number"
                    name="phosphorus"
                    className="form-control"
                    placeholder="e.g. 45"
                    value={form.phosphorus}
                    onChange={handle}
                    min="0"
                    max="200"
                    required
                  />
                  <span className="form-hint">{t("soil.phosphorusHint")}</span>
                </div>

                <div className="form-group">
                  <label>
                    {t("soil.potassium")} <span className="required">*</span>
                  </label>
                  <input
                    id="soil-potassium"
                    type="number"
                    name="potassium"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={form.potassium}
                    onChange={handle}
                    min="0"
                    max="400"
                    required
                  />
                  <span className="form-hint">{t("soil.potassiumHint")}</span>
                </div>

                <div className="form-group">
                  <label>
                    {t("soil.ph")} <span className="required">*</span>
                  </label>
                  <input
                    id="soil-ph"
                    type="number"
                    step="0.1"
                    name="ph"
                    className="form-control"
                    placeholder="e.g. 6.5"
                    value={form.ph}
                    onChange={handle}
                    min="0"
                    max="14"
                    required
                  />
                  <span className="form-hint">{t("soil.phHint")}</span>
                </div>
              </div>

              <button
                id="btn-analyze-soil"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                style={{ marginTop: 18 }}
                disabled={loading}
              >
                {loading ? t("soil.analyzing") : t("soil.analyzeBtn")}
              </button>
            </form>

            {/* Info Box */}
            <div className="alert alert-info" style={{ marginTop: 16, fontSize: 12 }}>
              {t("soil.infoBox")}
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div>
          {!result && !loading && (
            <div className="card">
              <div className="card-body empty-state">
                <div className="icon">🧪</div>
                <p>{t("soil.emptyState")}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="loading-center">
                <div className="spinner" />
                <p>{t("soil.loadingText")}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Health Score Card */}
              <div
                className="farmer-result-card"
                style={{
                  background: healthColors[result.health_color]?.bg || "#f0fdf4",
                  borderColor: healthColors[result.health_color]?.border || "#6ee7b7",
                  color: healthColors[result.health_color]?.text || "#065f46",
                }}
              >
                <div className="farmer-result-emoji">
                  {result.health_color === "green" ? "🌿" : result.health_color === "yellow" ? "⚠️" : "🚨"}
                </div>
                <div className="farmer-result-message">
                  {t("soil.healthLabel")}: {lang === "hi" ? result.health_label_hi : result.health_label}
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
                  {result.health_score}<span style={{ fontSize: 18, fontWeight: 600 }}>/100</span>
                </div>
              </div>

              {/* Soil Issues */}
              <div className="card">
                <div className="card-header">
                  <h3>{t("soil.issuesTitle")}</h3>
                </div>
                <div className="card-body">
                  <ul className="recommendations-list">
                    {(lang === "hi" ? result.issues_hi : result.issues).map((issue, i) => (
                      <li key={i} style={{ borderLeftColor: result.health_color === "green" ? "var(--gov-green)" : result.health_color === "yellow" ? "#d97706" : "#dc2626" }}>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Top Crops Table */}
              <div className="card">
                <div className="card-header">
                  <h3>{t("soil.bestCrops")}</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="table-wrapper">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t("soil.cropName")}</th>
                          <th>{t("soil.suitability")}</th>
                          <th>{t("soil.season")}</th>
                          <th>{t("soil.idealPh")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.top_crops?.map((crop, i) => (
                          <tr key={crop.crop}>
                            <td style={{ fontWeight: 700 }}>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{crop.crop}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                  width: 80, height: 10, background: "#e5e7eb",
                                  borderRadius: 5, overflow: "hidden"
                                }}>
                                  <div style={{
                                    width: `${Math.min(crop.score, 100)}%`, height: "100%",
                                    background: crop.score >= 70 ? "var(--gov-green)" : crop.score >= 45 ? "#d97706" : "#dc2626",
                                    borderRadius: 5
                                  }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{crop.score}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${crop.season === "Kharif" ? "badge-green" : "badge-blue"}`}>
                                {crop.season}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>pH {crop.ph_range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Fertilizer Recommendations */}
              <RecommendationCard
                recommendations={result.fertilizer_recommendations}
                recommendations_hi={result.fertilizer_recommendations_hi}
                title="soil.fertTitle"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
