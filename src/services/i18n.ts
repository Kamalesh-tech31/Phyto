import { Language } from '../types';
import { LANGUAGES, LanguageMeta } from '../locales/languages';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';

const LOCALES: Record<Language, Record<string, string>> = {
  en,
  ta,
  ml,
  hi,
  te,
};

let currentLanguage: Language = 'en';

type LanguageSubscriber = (lang: Language) => void;
const subscribers = new Set<LanguageSubscriber>();

export function setI18nLanguage(lang: Language): void {
  if (currentLanguage !== lang) {
    currentLanguage = lang;
    subscribers.forEach((cb) => {
      try {
        cb(lang);
      } catch (err) {
        console.warn('Error in language subscriber:', err);
      }
    });
  }
}

export function getI18nLanguage(): Language {
  return currentLanguage;
}

export function subscribeToLanguageChange(callback: LanguageSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

export function getLanguageMeta(lang: Language = currentLanguage): LanguageMeta {
  const meta = LANGUAGES.find((l) => l.code === lang);
  return (
    meta || {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      intlLocale: 'en-IN',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }
  );
}

/**
 * Tiny typed t(key, params, lang) helper.
 * - Key-based translation with English fallback per-key.
 * - Interpolates parameters such as {name} or {count}.
 * - Never returns a raw key if an English string exists.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  lang: Language = currentLanguage
): string {
  const dict = LOCALES[lang] || LOCALES.en;
  let text = dict[key] || LOCALES.en[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return text;
}

/**
 * Formats date using active locale via Intl.DateTimeFormat
 */
export function formatDate(
  date: Date | number,
  options?: Intl.DateTimeFormatOptions,
  lang: Language = currentLanguage
): string {
  try {
    const meta = getLanguageMeta(lang);
    return new Intl.DateTimeFormat(meta.intlLocale, options).format(
      typeof date === 'number' ? new Date(date) : date
    );
  } catch {
    return new Date(date).toLocaleDateString();
  }
}

/**
 * Formats numbers using active locale via Intl.NumberFormat
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  lang: Language = currentLanguage
): string {
  try {
    const meta = getLanguageMeta(lang);
    return new Intl.NumberFormat(meta.intlLocale, options).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Shared singleton for components and speechService
 */
export const i18n = {
  t,
  getLanguage: getI18nLanguage,
  setLanguage: setI18nLanguage,
  subscribe: subscribeToLanguageChange,
  getLanguageMeta,
};
