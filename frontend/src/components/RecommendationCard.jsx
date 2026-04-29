import { useLang } from "../context/LanguageContext";

export default function RecommendationCard({ recommendations = [], recommendations_hi = [], title = "rec.title" }) {
  const { t, lang } = useLang();
  if (!recommendations.length) return null;

  const displayTitle = title.includes(".") ? t(title) : title;

  // Show both languages: primary language first, secondary in smaller text
  const showBilingual = recommendations_hi.length > 0;

  return (
    <div className="card mt-4 fade-in">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>{displayTitle}</h3>
        {showBilingual && (
          <span style={{ fontSize: 10, color: "#6b7280", background: "#f3f4f6", padding: "3px 8px", borderRadius: 8 }}>
            🌐 EN + हिंदी
          </span>
        )}
      </div>
      <div className="card-body" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {recommendations.map((rec, i) => {
            const hiRec = recommendations_hi[i];
            return (
              <div key={i} style={{
                padding: "14px 16px", borderRadius: 12,
                background: i === 0 ? "linear-gradient(135deg, #eff6ff, #dbeafe)" : "#f8fafc",
                border: `1px solid ${i === 0 ? "#93c5fd" : "#e2e8f0"}`,
                transition: "transform 0.15s",
              }}>
                {/* English recommendation */}
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#1e293b",
                  lineHeight: 1.6, letterSpacing: "0.01em"
                }}>
                  {rec}
                </div>
                {/* Hindi translation below */}
                {hiRec && (
                  <div style={{
                    fontSize: 12, color: "#64748b", marginTop: 6,
                    lineHeight: 1.6, fontStyle: "normal",
                    paddingTop: 6, borderTop: "1px dashed #e2e8f0"
                  }}>
                    {hiRec}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
