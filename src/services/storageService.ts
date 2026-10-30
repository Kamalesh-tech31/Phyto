import { ScanHistoryItem } from '../types';

const DB_NAME = 'phyto_farmer_db';
const DB_VERSION = 1;
const STORE_SCANS = 'scan_history';
const LOCALSTORAGE_KEY = 'phyto_saved_scans';
const QUEUE_KEY = 'phyto_expert_queue';

export interface ExpertQueueItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  diseaseId: string;
  crop: string;
  notes: string;
  status: 'pending' | 'sent';
}

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
          if (!db.objectStoreNames.contains(STORE_SCANS)) {
            const store = db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
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

  public async saveScan(scan: ScanHistoryItem): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SCANS, 'readwrite');
        const store = tx.objectStore(STORE_SCANS);
        const req = store.put(scan);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // LocalStorage fallback
      try {
        const existing = this.getScansFromLocalStorage();
        const updated = [scan, ...existing.filter((s) => s.id !== scan.id)].slice(0, 30);
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

  public async deleteScan(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SCANS, 'readwrite');
        const store = tx.objectStore(STORE_SCANS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const existing = this.getScansFromLocalStorage();
      const updated = existing.filter((s) => s.id !== id);
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(updated));
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

  // Queue expert consultation offline
  public queueExpertRequest(item: ExpertQueueItem): void {
    try {
      const queue = this.getExpertQueue();
      queue.push(item);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to queue expert request', e);
    }
  }

  public getExpertQueue(): ExpertQueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const storageService = new StorageService();
