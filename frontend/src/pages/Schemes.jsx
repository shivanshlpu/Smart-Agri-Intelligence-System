import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import schemesData from "../data/schemesData.json";

const CATEGORIES = [
  { key: "all",        labelEn: "All Schemes",    labelHi: "सभी योजनाएँ",     icon: "📋" },
  { key: "financial",  labelEn: "Financial Aid",   labelHi: "वित्तीय सहायता",   icon: "💰" },
  { key: "insurance",  labelEn: "Insurance",       labelHi: "बीमा",            icon: "🛡️" },
  { key: "market",     labelEn: "Market Access",   labelHi: "बाज़ार पहुँच",     icon: "🏪" },
  { key: "technology", labelEn: "Technology",       labelHi: "प्रौद्योगिकी",     icon: "🧪" },
];

export default function Schemes() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const userState = user?.location?.state || "";

  // Filter: show central ("all") schemes + schemes matching user's state
  const filtered = useMemo(() => {
    let list = schemesData.filter(
      (s) => s.states.includes("all") || s.states.includes(userState)
    );
    if (activeCategory !== "all") {
      list = list.filter((s) => s.category === activeCategory);
    }
    return list;
  }, [activeCategory, userState]);

  const centralCount = filtered.filter((s) => s.type === "central").length;
  const stateCount = filtered.filter((s) => s.type === "state").length;

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const l = (obj) => (obj ? obj[lang] || obj.en : "");

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            🏠 <span>{t("nav.dashboard")}</span> › <span>{t("nav.schemes")}</span>
          </div>
          <h1>{t("schemes.title")}</h1>
          <p>{t("schemes.subtitle")}</p>
        </div>
        {userState && (
          <div className="badge badge-green" style={{ fontSize: 12, padding: "4px 12px" }}>
            📍 {userState}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-label">{t("schemes.totalSchemes")}</div>
          <div className="stat-value">{filtered.length}</div>
          <div className="stat-sub">{t("schemes.availableForYou")}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🇮🇳</div>
          <div className="stat-label">{t("schemes.centralSchemes")}</div>
          <div className="stat-value">{centralCount}</div>
          <div className="stat-sub">{t("schemes.govOfIndia")}</div>
        </div>
        <div className="stat-card saffron">
          <div className="stat-icon">🏛️</div>
          <div className="stat-label">{t("schemes.stateSchemes")}</div>
          <div className="stat-value">{stateCount}</div>
          <div className="stat-sub">{userState || t("schemes.yourState")}</div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`btn ${activeCategory === cat.key ? "btn-primary" : "btn-outline"} btn-sm`}
                style={{ borderRadius: 20 }}
              >
                {cat.icon} {lang === "hi" ? cat.labelHi : cat.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schemes List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body empty-state">
            <div className="icon">🏛️</div>
            <p>{t("schemes.noSchemes")}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((scheme) => {
            const isExpanded = expandedId === scheme.id;
            return (
              <div
                key={scheme.id}
                className="card scheme-card fade-in"
                style={{
                  borderLeft: `4px solid ${
                    scheme.category === "financial" ? "var(--gov-green)" :
                    scheme.category === "insurance" ? "var(--gov-saffron)" :
                    scheme.category === "market" ? "var(--gov-navy)" :
                    "var(--gov-gold)"
                  }`,
                }}
              >
                {/* Scheme Header — always visible */}
                <div
                  className="card-body"
                  style={{ cursor: "pointer", padding: "16px 18px" }}
                  onClick={() => toggleExpand(scheme.id)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{scheme.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--gov-navy)", margin: 0 }}>
                            {l(scheme.name)}
                          </h3>
                          <span className={`badge ${scheme.type === "central" ? "badge-blue" : "badge-yellow"}`}>
                            {scheme.type === "central"
                              ? (lang === "hi" ? "केंद्र सरकार" : "Central Govt")
                              : (lang === "hi" ? "राज्य सरकार" : "State Govt")}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                          {l(scheme.description)}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 18, color: "var(--text-muted)", flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid var(--border-light)",
                    padding: "18px",
                    background: "#f9fafb",
                    animation: "fadeIn 0.25s ease"
                  }}>
                    <div className="grid-2" style={{ gap: 20 }}>
                      {/* Benefits */}
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--gov-green)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {t("schemes.benefits")}
                        </h4>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                          {(l(scheme.benefits) || []).map((b, i) => (
                            <li key={i} style={{
                              display: "flex", gap: 8, alignItems: "flex-start",
                              fontSize: 13, color: "var(--text-secondary)",
                              padding: "6px 10px", background: "white", borderRadius: 4,
                              borderLeft: "3px solid var(--gov-green)"
                            }}>
                              <span style={{ color: "var(--gov-green)", flexShrink: 0 }}>✔</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Eligibility */}
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--gov-navy)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {t("schemes.eligibility")}
                        </h4>
                        <div style={{
                          background: "white", borderRadius: 4, padding: "12px 14px",
                          border: "1px solid var(--border-light)", fontSize: 13,
                          color: "var(--text-secondary)", lineHeight: 1.6
                        }}>
                          {l(scheme.eligibility)}
                        </div>

                        {/* Apply Button */}
                        <a
                          href={scheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6,
                            textDecoration: "none", width: "100%", justifyContent: "center"
                          }}
                        >
                          🔗 {t("schemes.applyNow")}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Note */}
      <div style={{ marginTop: 20, fontSize: 11, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>
        {t("schemes.disclaimer")}
      </div>
    </div>
  );
}
