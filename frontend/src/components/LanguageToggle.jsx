import { useLang } from "../context/LanguageContext";

export default function LanguageToggle({ style = {} }) {
  const { lang, toggleLang, t } = useLang();

  return (
    <button
      id="btn-lang-toggle"
      className="lang-toggle-btn"
      onClick={toggleLang}
      title={t("lang.label")}
      style={style}
    >
      <span className="lang-toggle-icon">{lang === "en" ? "🇮🇳" : "🌐"}</span>
      <span className="lang-toggle-text">{t("lang.toggle")}</span>
    </button>
  );
}
