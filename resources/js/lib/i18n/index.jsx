import { createContext, useContext, useState, useEffect } from 'react';
import en from './en';
import bn from './bn';

const LANGS = { en, bn };
const I18nContext = createContext({ t: k => k, lang: 'en', setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('edubd_lang') || 'en'; } catch { return 'en'; }
  });

  const setLang = (l) => {
    setLangState(l);
    try { localStorage.setItem('edubd_lang', l); } catch {}
    document.documentElement.setAttribute('lang', l === 'bn' ? 'bn' : 'en');
  };

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let val = LANGS[lang] || LANGS.en;
    for (const k of keys) { val = val?.[k]; if (!val) break; }
    return val || keyPath;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
      title="Switch language / ভাষা পরিবর্তন"
      style={{ background:'none', border:'1.5px solid #E4DBC8', borderRadius:8,
        padding:'5px 10px', cursor:'pointer', fontSize:12, fontWeight:700, color:'#5B564E' }}>
      {lang === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
    </button>
  );
}
