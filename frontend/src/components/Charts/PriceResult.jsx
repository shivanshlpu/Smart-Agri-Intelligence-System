import { useLang } from "../../context/LanguageContext";

const MONTH_EN = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_HI = ["","जनवरी","फरवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

// Reference average prices per crop (₹/quintal) for sell advisory
const AVG_PRICES = {
  Wheat: 2200, Rice: 1950, Tomato: 800, Onion: 1200, Potato: 600, Maize: 1800,
  Sugarcane: 350, Cotton: 6800, Soybean: 4500, Groundnut: 5800, Bajra: 1950,
  Jowar: 2500, Barley: 2050, Mustard: 5300, Mango: 4000, Apple: 7000,
  Banana: 1500, Chickpea: 4800, Lentil: 6100, Turmeric: 7700, Chilli: 13500,
  Ginger: 5000, Garlic: 10000, Coffee: 17500, Tea: 14000,
};

export default function PriceResult({ predictedPrice, cropName, season, state, bestMonth, bestPrice, currentMonth, msp }) {
  const { t, lang } = useLang();
  if (!predictedPrice && predictedPrice !== 0) return null;

  const price = Math.max(predictedPrice, 0);
  const avgPrice = AVG_PRICES[cropName] || 1500;
  const isAboveAvg = price > avgPrice;
  const priceDiff = bestPrice ? (bestPrice - price) : 0;
  const monthsToWait = bestMonth ? ((bestMonth - (currentMonth || new Date().getMonth() + 1)) % 12) : 0;
  const shouldWait = priceDiff > 50 && monthsToWait > 0;

  // Best month names
  const bestMonthEN = bestMonth ? MONTH_EN[bestMonth] : "";
  const bestMonthHI = bestMonth ? MONTH_HI[bestMonth] : "";

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

      {/* ── Professional Sell/Hold Advisory ── */}
      {shouldWait ? (
        <div style={{
          margin: "16px 0", padding: "16px 20px", borderRadius: 14,
          background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
          border: "2px solid #f59e0b"
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#92400e", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            ⏳ {lang === "hi" ? "अभी न बेचें!" : "DON'T Sell Now!"}
          </div>
          <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.7 }}>
            {lang === "hi" ? (
              <>
                📦 अगर आप <strong>{monthsToWait} महीने</strong> तक अपनी <strong>{cropName}</strong> रख सकते हैं, 
                तो <strong>{bestMonthHI}</strong> में आपको <strong>₹{bestPrice?.toLocaleString("en-IN")}/क्विंटल</strong> मिलेगा 
                — यानी आज से <strong style={{color: "#059669"}}>₹{priceDiff?.toLocaleString("en-IN")} ज़्यादा</strong>!
                <br/>💡 फसल को सुरक्षित रखने के लिए कोल्ड स्टोरेज या गोदाम का उपयोग करें।
              </>
            ) : (
              <>
                📦 If you can store your <strong>{cropName}</strong> for <strong>{monthsToWait} month(s)</strong>, 
                you can get <strong>₹{bestPrice?.toLocaleString("en-IN")}/Qtl</strong> in <strong>{bestMonthEN}</strong> 
                — that's <strong style={{color: "#059669"}}>₹{priceDiff?.toLocaleString("en-IN")} more</strong> than today!
                <br/>💡 Use cold storage or warehouse to keep your produce safe.
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          margin: "16px 0", padding: "16px 20px", borderRadius: 14,
          background: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)",
          border: "2px solid #34d399"
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#065f46", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            🟢 {lang === "hi" ? "अभी बेचने का सही समय!" : "Good Time to Sell Now!"}
          </div>
          <div style={{ fontSize: 13, color: "#064e3b", lineHeight: 1.6 }}>
            {lang === "hi" ? (
              <>
                📈 अभी <strong>{cropName}</strong> का भाव सबसे अच्छा है। 
                मंडी में <strong>₹{price.toLocaleString("en-IN")}/क्विंटल</strong> मिल सकता है।
                <br/>🏪 अपनी नज़दीकी मंडी या e-NAM पर बेचें।
              </>
            ) : (
              <>
                📈 <strong>{cropName}</strong> price is currently at its best. 
                You can get <strong>₹{price.toLocaleString("en-IN")}/Qtl</strong> in the market.
                <br/>🏪 Sell at your nearest mandi or through e-NAM portal.
              </>
            )}
          </div>
        </div>
      )}

      {/* MSP Badge */}
      {msp && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
          borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: price >= msp ? "#ecfdf5" : "#fef2f2",
          color: price >= msp ? "#065f46" : "#991b1b",
          border: `1px solid ${price >= msp ? "#a7f3d0" : "#fecaca"}`
        }}>
          🏛️ MSP (न्यूनतम समर्थन मूल्य): ₹{msp.toLocaleString("en-IN")}/Qtl
          <span style={{ marginLeft: "auto" }}>
            {price >= msp
              ? (lang === "hi" ? "✅ MSP से ज़्यादा" : "✅ Above MSP")
              : (lang === "hi" ? "⚠️ MSP से कम — सरकारी खरीद पर बेचें" : "⚠️ Below MSP — sell via govt procurement")}
          </span>
        </div>
      )}

      {/* Context badges */}
      <div className="farmer-price-tags" style={{ marginTop: 12 }}>
        {cropName && <span className="badge badge-green">{cropName}</span>}
        {season && <span className="badge badge-blue">{season}</span>}
        {state && <span className="badge badge-gray">{state}</span>}
      </div>
    </div>
  );
}
