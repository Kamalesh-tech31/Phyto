import { Language } from '../types';

export interface LanguageMeta {
  code: Language;
  name: string;
  nativeName: string;
  intlLocale: string;
  fontFamily: string;
}

export const LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    intlLocale: 'en-IN',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    intlLocale: 'ta-IN',
    fontFamily: "'Noto Sans Tamil', 'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    intlLocale: 'ml-IN',
    fontFamily: "'Noto Sans Malayalam', 'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    intlLocale: 'hi-IN',
    fontFamily: "'Noto Sans Devanagari', 'Plus Jakarta Sans', sans-serif",
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    intlLocale: 'te-IN',
    fontFamily: "'Noto Sans Telugu', 'Plus Jakarta Sans', sans-serif",
  },
];
