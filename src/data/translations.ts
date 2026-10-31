import { Language } from '../types';
import uiEn from './lang/ui_en.json';
import uiTa from './lang/ui_ta.json';
import uiHi from './lang/ui_hi.json';
import uiMl from './lang/ui_ml.json';
import uiTe from './lang/ui_te.json';

export const translations: Record<Language, Record<string, string>> = {
  en: uiEn,
  ta: uiTa,
  hi: uiHi,
  ml: uiMl,
  te: uiTe,
};
