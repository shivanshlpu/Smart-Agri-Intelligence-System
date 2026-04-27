import { useLang } from "../context/LanguageContext";

export default function RecommendationCard({ recommendations = [], recommendations_hi = [], title = "rec.title" }) {
  const { t, lang } = useLang();
  if (!recommendations.length) return null;

  // Use Hindi recommendations if available and lang is Hindi
  const recs = (lang === "hi" && recommendations_hi.length > 0) ? recommendations_hi : recommendations;
  const displayTitle = title.includes(".") ? t(title) : title;

  return (
    <div className="card mt-4 fade-in">
      <div className="card-header">
        <h3>{displayTitle}</h3>
      </div>
      <div className="card-body">
        <ul className="recommendations-list">
          {recs.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
