import { CachedTranslation, Language, ScanHistoryItem } from '../types';

const DB_NAME = 'phyto_farmer_db';
const DB_VERSION = 3;
const STORE_SCANS = 'scan_history';
const STORE_TRANSLATIONS = 'cached_translations';
const LOCALSTORAGE_KEY = 'phyto_saved_scans';
const DOWNLOADED_LANGS_KEY = 'phyto_downloaded_languages';

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Scan history store
          if (!db.objectStoreNames.contains(STORE_SCANS)) {
            const store = db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('class_id', 'class_id', { unique: false });
          }

          // 2. Cached translations store
          if (!db.objectStoreNames.contains(STORE_TRANSLATIONS)) {
            const transStore = db.createObjectStore(STORE_TRANSLATIONS, { keyPath: 'id' });
            transStore.createIndex('lang', 'lang', { unique: false });
            transStore.createIndex('key', 'key', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          console.warn('IndexedDB opening error, falling back to localStorage');
          reject(request.error);
        };
      } catch (e) {
        reject(e);
      }
    });

    return this.dbPromise;
  }

  /* ================= SCAN HISTORY ================= */

  public async saveScan(scan: ScanHistoryItem): Promise<void> {
    const cleanScan: ScanHistoryItem = {
      id: scan.id,
      class_id: scan.class_id || (scan.diseaseId as string) || 'tomato_healthy',
      confidenceScore: scan.confidenceScore ?? 0.9,
      affectedAreaPercent: scan.affectedAreaPercent ?? 0,
      timestamp: scan.timestamp || Date.now(),
      imageData: scan.imageData || scan.imageUrl || '',
      isUncertain: !!scan.isUncertain,
    };

    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SCANS, 'readwrite');
        const store = tx.objectStore(STORE_SCANS);
        const req = store.put(cleanScan);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      try {
        const existing = this.getScansFromLocalStorage();
        const updated = [cleanScan, ...existing.filter((s) => s.id !== cleanScan.id)].slice(0, 30);
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage save failed', err);
      }
    }
  }

  public async getAllScans(): Promise<ScanHistoryItem[]> {
    try {
      const db = await this.initDB();
      return await new Promise<ScanHistoryItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_SCANS, 'readonly');
        const store = tx.objectStore(STORE_SCANS);
        const req = store.getAll();
        req.onsuccess = () => {
          const results = (req.result || []) as ScanHistoryItem[];
          results.sort((a, b) => b.timestamp - a.timestamp);
          resolve(results);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.getScansFromLocalStorage();
    }
  }

  public async clearAllScans(): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SCANS, 'readwrite');
        const store = tx.objectStore(STORE_SCANS);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  }

  private getScansFromLocalStorage(): ScanHistoryItem[] {
    try {
      const data = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /* ================= CACHED TRANSLATIONS ================= */

  public async getCachedTranslation(
    lang: Language,
    key: string,
    hash: string
  ): Promise<string | null> {
    try {
      const db = await this.initDB();
      const id = `${lang}:${key}`;
      return await new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_TRANSLATIONS, 'readonly');
        const store = tx.objectStore(STORE_TRANSLATIONS);
        const req = store.get(id);
        req.onsuccess = () => {
          const record = req.result as CachedTranslation;
          if (record && record.hash === hash) {
            resolve(record.text);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async saveCachedTranslation(
    lang: Language,
    key: string,
    hash: string,
    text: string
  ): Promise<void> {
    try {
      const db = await this.initDB();
      const record: CachedTranslation = {
        id: `${lang}:${key}`,
        lang,
        key,
        hash,
        text,
        auto: true,
        timestamp: Date.now(),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_TRANSLATIONS, 'readwrite');
        const store = tx.objectStore(STORE_TRANSLATIONS);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Failed to cache translation in IndexedDB:', e);
    }
  }

  /* ================= OFFLINE DOWNLOAD PACKS ================= */

  public getDownloadedLanguages(): Language[] {
    try {
      const raw = localStorage.getItem(DOWNLOADED_LANGS_KEY);
      return raw ? JSON.parse(raw) : ['en'];
    } catch {
      return ['en'];
    }
  }

  public markLanguageDownloaded(lang: Language): void {
    try {
      const current = this.getDownloadedLanguages();
      if (!current.includes(lang)) {
        current.push(lang);
        localStorage.setItem(DOWNLOADED_LANGS_KEY, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Failed to mark language downloaded:', e);
    }
  }
}

export const storageService = new StorageService();
