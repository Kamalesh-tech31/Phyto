import { DiseaseKBEntry, Language, SUPPORTED_LANGUAGES } from '../types';
import { translationService } from './translationService';
import { storageService } from './storageService';
import { checkRealConnectivity } from './connectivityService';

// Static bundle imports for 100% offline capability
import uiEn from '../data/lang/ui_en.json';
import uiTa from '../data/lang/ui_ta.json';
import uiHi from '../data/lang/ui_hi.json';
import uiMl from '../data/lang/ui_ml.json';
import uiTe from '../data/lang/ui_te.json';

import kbEn from '../data/kb/en.json';
import kbTa from '../data/kb/ta.json';
import kbHi from '../data/kb/hi.json';
import kbMl from '../data/kb/ml.json';
import kbTe from '../data/kb/te.json';

const UI_DICTIONARIES: Record<Language, Record<string, string>> = {
  en: uiEn,
  ta: uiTa,
  hi: uiHi,
  ml: uiMl,
  te: uiTe,
};

const KB_DICTIONARIES: Record<Language, Record<string, DiseaseKBEntry>> = {
  en: kbEn as Record<string, DiseaseKBEntry>,
  ta: kbTa as Record<string, DiseaseKBEntry>,
  hi: kbHi as Record<string, DiseaseKBEntry>,
  ml: kbMl as Record<string, DiseaseKBEntry>,
  te: kbTe as Record<string, DiseaseKBEntry>,
};

const STORAGE_LANG_KEY = 'phyto_selected_language';
const STORAGE_SPEAK_SLOW_KEY = 'phyto_speak_slowly';
const STORAGE_FIRST_LAUNCH_KEY = 'phyto_first_launch_done';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

class I18nService {
  private currentLanguage: Language = 'en';
  private speakSlowly: boolean = false;
  private listeners: Set<(lang: Language) => void> = new Set();
  // In-memory cache of online translations loaded from IndexedDB
  private dynamicTranslations: Map<string, string> = new Map();
  private autoTranslatedKeys: Set<string> = new Set();

  constructor() {
    this.currentLanguage = this.loadInitialLanguage();
    this.speakSlowly = this.loadInitialSpeakSlowly();
    this.applyDocumentLang(this.currentLanguage);
    this.preloadCachedTranslations();
  }

  private loadInitialLanguage(): Language {
    if (typeof window === 'undefined') return 'en';
    try {
      const stored = localStorage.getItem(STORAGE_LANG_KEY) as Language;
      if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
    } catch (e) {
      console.warn('Unable to read language from localStorage:', e);
    }
    return 'en';
  }

  private loadInitialSpeakSlowly(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_SPEAK_SLOW_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public getSpeakSlowly(): boolean {
    return this.speakSlowly;
  }

  public setSpeakSlowly(slow: boolean) {
    this.speakSlowly = slow;
    try {
      localStorage.setItem(STORAGE_SPEAK_SLOW_KEY, String(slow));
    } catch (e) {
      console.warn('Unable to save speakSlowly preference:', e);
    }
    this.notifyListeners();
  }

  public isFirstLaunch(): boolean {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_FIRST_LAUNCH_KEY);
  }

  public markFirstLaunchComplete(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_FIRST_LAUNCH_KEY, 'true');
    }
  }

  public getLanguage(): Language {
    return this.currentLanguage;
  }

  public setLanguage(lang: Language) {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
      console.warn(`Unsupported language "${lang}", defaulting to en`);
      lang = 'en';
    }

    if (this.currentLanguage === lang) return;

    this.currentLanguage = lang;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (e) {
      console.warn('Unable to save language to localStorage:', e);
    }

    this.applyDocumentLang(lang);
    this.preloadCachedTranslations();
    this.notifyListeners();
  }

  private applyDocumentLang(lang: Language) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  public subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentLanguage));
  }

  /**
   * Preloads any cached online translations from IndexedDB into memory
   */
  private async preloadCachedTranslations() {
    if (this.currentLanguage === 'en') return;
    try {
      const enDict = UI_DICTIONARIES.en;
      for (const [key, enText] of Object.entries(enDict)) {
        const hash = simpleHash(enText);
        const cached = await storageService.getCachedTranslation(this.currentLanguage, key, hash);
        if (cached) {
          const mapKey = `${this.currentLanguage}:${key}`;
          this.dynamicTranslations.set(mapKey, cached);
          this.autoTranslatedKeys.add(mapKey);
        }
      }
    } catch (e) {
      console.warn('Failed loading cached translations from IndexedDB:', e);
    }
  }

  /**
   * Hybrid translation lookup adhering to strict priority:
   * 1. Bundled file for the selected language
   * 2. Cached online translation from IndexedDB
   * 3. Online translation (asynchronously requested when online & proxy configured)
   * 4. English fallback (never empty label or raw key)
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const langDict = UI_DICTIONARIES[this.currentLanguage] || UI_DICTIONARIES.en;
    let text = langDict[key];
    const mapKey = `${this.currentLanguage}:${key}`;

    // 1. Bundled file
    if (text && text.trim() !== '') {
      return this.interpolate(text, params);
    }

    // 2. Cached online translation in memory
    if (this.dynamicTranslations.has(mapKey)) {
      return this.interpolate(this.dynamicTranslations.get(mapKey)!, params);
    }

    // 3. Trigger online translation in background if online
    const enText = UI_DICTIONARIES.en[key] || key;
    this.tryOnlineTranslation(key, enText);

    // 4. English fallback
    return this.interpolate(enText, params);
  }

  private interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) return text;
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
    return text;
  }

  public isAutoTranslated(key: string): boolean {
    return this.autoTranslatedKeys.has(`${this.currentLanguage}:${key}`);
  }

  private async tryOnlineTranslation(key: string, enText: string) {
    if (this.currentLanguage === 'en' || !enText) return;
    const isOnline = await checkRealConnectivity();
    if (!isOnline) return;

    const hash = simpleHash(enText);
    const translated = await translationService.translate(enText, 'en', this.currentLanguage);
    if (translated) {
      const mapKey = `${this.currentLanguage}:${key}`;
      this.dynamicTranslations.set(mapKey, translated);
      this.autoTranslatedKeys.add(mapKey);
      await storageService.saveCachedTranslation(this.currentLanguage, key, hash, translated);
      this.notifyListeners();
    }
  }

  /**
   * Knowledge Base lookup by class_id
   */
  public getKB(classId: string): DiseaseKBEntry | null {
    const langKB = KB_DICTIONARIES[this.currentLanguage] || KB_DICTIONARIES.en;
    if (langKB[classId]) {
      return langKB[classId];
    }
    if (KB_DICTIONARIES.en[classId]) {
      return KB_DICTIONARIES.en[classId];
    }
    return null;
  }

  public getDiseaseName(classId: string): string {
    const entry = this.getKB(classId);
    if (entry && entry.name) {
      return entry.name;
    }
    return this.t('not_recognised_message');
  }
}

export const i18n = new I18nService();
