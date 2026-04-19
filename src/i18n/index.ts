import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

export type Language = "en" | "hi";

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem("nutrilens-profile");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.language === "en" || parsed?.language === "hi") return parsed.language;
    }
  } catch {
    /* noop */
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
