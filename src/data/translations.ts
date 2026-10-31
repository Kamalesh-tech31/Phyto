import { Language } from '../types';
import en from '../locales/en.json';
import ta from '../locales/ta.json';
import ml from '../locales/ml.json';
import hi from '../locales/hi.json';
import te from '../locales/te.json';

// Proxy / Fallback dictionary to guarantee no crashes across the app
function createFallbackDict(specific: Record<string, string>): Record<string, string> {
  return new Proxy(specific, {
    get(target, prop: string) {
      if (prop in target && target[prop]) {
        return target[prop];
      }
      return (en as Record<string, string>)[prop] || prop;
    },
  });
}

export const translations: Record<Language, Record<string, string>> = {
  en: createFallbackDict(en),
  ta: createFallbackDict(ta),
  ml: createFallbackDict(ml),
  hi: createFallbackDict(hi),
  te: createFallbackDict(te),
};
