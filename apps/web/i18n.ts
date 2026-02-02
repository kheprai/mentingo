import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "app/locales/en/translation.json";
import esTranslations from "app/locales/es/translation.json";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  fallbackLng: "en",
  lng: import.meta.env.VITE_E2E === "true" ? "en" : "es",
  ns: ["translation"],
  defaultNS: "translation",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: enTranslations,
    },
    es: {
      translation: esTranslations,
    },
  },
});

export default i18n;
