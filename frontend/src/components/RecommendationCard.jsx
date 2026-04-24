export default function RecommendationCard({ recommendations = [], title = "Recommendations" }) {
  if (!recommendations.length) return null;
  return (
    <div className="card mt-4 fade-in">
      <div className="card-header">
        <h3>💡 {title}</h3>
      </div>
      <div className="card-body">
        <ul className="recommendations-list">
          {recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
