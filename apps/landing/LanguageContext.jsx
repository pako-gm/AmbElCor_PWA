import { createContext, useContext, useMemo, useState } from 'react';
import { translations } from './translations';

const COOKIE_NAME = 'ambelcor_lang';
const COOKIE_MAX_AGE_DAYS = 365;
const DEFAULT_LANG = 'va';

const LanguageContext = createContext(null);

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

function getInitialLang() {
  if (typeof document === 'undefined') return DEFAULT_LANG;
  const saved = getCookie(COOKIE_NAME);
  return translations[saved] ? saved : DEFAULT_LANG;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLang = (code) => {
    if (!translations[code]) return;
    setLangState(code);
    setCookie(COOKIE_NAME, code, COOKIE_MAX_AGE_DAYS);
  };

  const value = useMemo(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  return ctx;
}
