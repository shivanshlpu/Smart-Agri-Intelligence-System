import { createContext, useContext, useState, useCallback } from "react";
import translations from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem("app_lang") || "en"; }
    catch { return "en"; }
  });

  const setLang = useCallback((l) => {
    localStorage.setItem("app_lang", l);
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "hi" : "en");
  }, [lang, setLang]);

  /** Translation function: t("key") → returns translated string */
  const t = useCallback((key) => {
    const entry = translations[key];
    if (!entry) return key; // Fallback: return the key itself
    return entry[lang] || entry["en"] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
