import { useLang } from "../../context/LanguageContext";

// Reference average prices per crop (₹/quintal) for sell advisory
const AVG_PRICES = {
  Wheat: 2200, Rice: 1950, Tomato: 800, Onion: 1200, Potato: 600, Maize: 1800,
  Sugarcane: 350, Cotton: 6800, Soybean: 4500, Groundnut: 5800, Bajra: 1950,
  Jowar: 2500, Barley: 2050, Mustard: 5300, Mango: 4000, Apple: 7000,
  Banana: 1500, Chickpea: 4800, Lentil: 6100, Turmeric: 7700, Chilli: 13500,
  Ginger: 5000, Garlic: 10000, Coffee: 17500, Tea: 14000,
};

export default function PriceResult({ predictedPrice, cropName, season, state }) {
  const { t } = useLang();
  if (!predictedPrice && predictedPrice !== 0) return null;

  const price = Math.max(predictedPrice, 0);
  const avgPrice = AVG_PRICES[cropName] || 1500;
  const isAboveAvg = price > avgPrice;

  // Sell advisory based on price level
  let advisory, advisoryColor, advisoryEmoji, advisoryBg;
  if (price > avgPrice * 1.15) {
    advisory = t("price.sellNow");
    advisoryColor = "#065f46";
    advisoryEmoji = "🟢";
    advisoryBg = "#d1fae5";
  } else if (price > avgPrice * 0.85) {
    advisory = t("price.wait");
    advisoryColor = "#92400e";
    advisoryEmoji = "🟡";
    advisoryBg = "#fef3c7";
  } else {
    advisory = t("price.hold");
    advisoryColor = "#991b1b";
    advisoryEmoji = "🔴";
    advisoryBg = "#fee2e2";
  }

  return (
    <div className="farmer-price-card">
      {/* Main price display */}
      <div className="farmer-price-amount">
        <div className="farmer-price-label">{t("price.predicted")}</div>
        <div className="farmer-price-value">
          ₹{price.toLocaleString("en-IN")}
        </div>
        <div className="farmer-price-unit">{t("price.perQuintal")}</div>
      </div>

      {/* Above/Below average indicator */}
      <div className="farmer-price-comparison" style={{ color: isAboveAvg ? "#065f46" : "#991b1b" }}>
        {isAboveAvg ? "⬆️" : "⬇️"} {isAboveAvg ? t("price.aboveAvg") : t("price.belowAvg")}
        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
          (Avg: ₹{avgPrice.toLocaleString("en-IN")})
        </span>
      </div>

      {/* Sell Advisory — the main farmer-friendly output */}
      <div className="farmer-advisory" style={{ background: advisoryBg, color: advisoryColor }}>
        <span className="farmer-advisory-emoji">{advisoryEmoji}</span>
        <span className="farmer-advisory-text">{advisory}</span>
      </div>

      {/* Context badges */}
      <div className="farmer-price-tags">
        {cropName && <span className="badge badge-green">{cropName}</span>}
        {season && <span className="badge badge-blue">{season}</span>}
        {state && <span className="badge badge-gray">{state}</span>}
      </div>
    </div>
  );
}
