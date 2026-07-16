import React, { createContext, useContext, useState, useEffect } from "react";

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState("tr");
  const [translations, setTranslations] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("unipulse_lang");
    const validLangs = ["tr", "en", "es", "it", "ru"];
    const initialLang = validLangs.includes(saved) ? saved : 
                        (navigator.language.startsWith("tr") ? "tr" : "en");
    setLanguageState(initialLang);
  }, []);

  useEffect(() => {
    setIsLoaded(false);
    import(`../locales/${language}.json`)
      .then((module) => {
        setTranslations(module.default);
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load translations for", language, err);
        // Fallback to English if loading fails
        import(`../locales/en.json`).then(m => {
          setTranslations(m.default);
          setIsLoaded(true);
        });
      });
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem("unipulse_lang", lang);
  };

  const t = (key) => {
    return translations[key] || key;
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
