import { useState, useEffect } from 'react';
import { Language, PhytoSettings, TextSize, ThemeMode } from '../types';
import { setI18nLanguage } from './i18n';

const SETTINGS_STORAGE_KEY = 'phyto_settings';

export const TEXT_SIZE_SCALES: Record<TextSize, string> = {
  small: '87.5%',
  default: '100%',
  large: '112.5%',
};

export function getSystemPreferredTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function getDefaultSettings(): PhytoSettings {
  return {
    language: 'en',
    textSize: 'default',
    theme: getSystemPreferredTheme(),
  };
}

export function readStoredSettings(): PhytoSettings {
  try {
    if (typeof window === 'undefined') {
      return { language: 'en', textSize: 'default', theme: 'light' };
    }

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      // First launch (no saved choice): start with OS prefers-color-scheme and save it
      const initial = getDefaultSettings();
      writeStoredSettings(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    let needsSave = false;

    // Handle text size: map older 'larger' or 'largest' to 'large'
    const rawSize = parsed.textSize;
    let textSize: TextSize = 'default';
    if (rawSize === 'small' || rawSize === 'default' || rawSize === 'large') {
      textSize = rawSize;
    } else if (rawSize === 'larger' || rawSize === 'largest') {
      textSize = 'large';
      needsSave = true;
    }

    // Handle theme: resolve older 'system' or invalid once to OS preference
    let theme: ThemeMode;
    if (parsed.theme === 'light' || parsed.theme === 'dark') {
      theme = parsed.theme;
    } else {
      theme = getSystemPreferredTheme();
      needsSave = true;
    }

    const settings: PhytoSettings = {
      language: ['en', 'ta', 'ml', 'hi', 'te'].includes(parsed.language)
        ? parsed.language
        : 'en',
      textSize,
      theme,
    };

    if (needsSave) {
      writeStoredSettings(settings);
    }

    return settings;
  } catch (e) {
    console.warn('Failed to read settings from localStorage, using defaults', e);
    const fallback = getDefaultSettings();
    writeStoredSettings(fallback);
    return fallback;
  }
}

export function writeStoredSettings(settings: PhytoSettings): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    console.warn('Failed to write settings to localStorage', e);
  }
}

export function applySettingsToDOM(settings: PhytoSettings): void {
  if (typeof window === 'undefined') return;

  // Apply theme attribute
  document.documentElement.setAttribute('data-theme', settings.theme);

  // Apply meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', settings.theme === 'dark' ? '#101611' : '#F1E9D2');
  }

  // Apply root font-size scale
  const scale = TEXT_SIZE_SCALES[settings.textSize] || '100%';
  document.documentElement.style.fontSize = scale;

  // Apply html lang
  document.documentElement.setAttribute('lang', settings.language);

  // Sync i18n helper
  setI18nLanguage(settings.language);
}

// Global subscribers for multi-component reactive sync
type SettingsListener = (settings: PhytoSettings) => void;
const listeners = new Set<SettingsListener>();

let memorySettings: PhytoSettings = readStoredSettings();

export function getGlobalSettings(): PhytoSettings {
  return memorySettings;
}

export function updateSettings(partial: Partial<PhytoSettings>): void {
  memorySettings = { ...memorySettings, ...partial };
  applySettingsToDOM(memorySettings);
  writeStoredSettings(memorySettings);
  listeners.forEach((fn) => fn(memorySettings));
}

export function resetSettingsToDefault(): void {
  // Resets theme to the OS-matching light or dark, text size to Default, and language to English
  memorySettings = getDefaultSettings();
  applySettingsToDOM(memorySettings);
  writeStoredSettings(memorySettings);
  listeners.forEach((fn) => fn(memorySettings));
}

/**
 * React hook to read and manipulate device settings
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<PhytoSettings>(memorySettings);

  useEffect(() => {
    // Sync initial state
    applySettingsToDOM(memorySettings);

    const handleChange: SettingsListener = (newSettings) => {
      setSettingsState(newSettings);
    };

    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const setLanguage = (language: Language) => updateSettings({ language });
  const setTextSize = (textSize: TextSize) => updateSettings({ textSize });
  const setTheme = (theme: ThemeMode) => updateSettings({ theme });
  const resetToDefaults = () => resetSettingsToDefault();

  return {
    settings,
    resolvedTheme: settings.theme,
    setLanguage,
    setTextSize,
    setTheme,
    resetToDefaults,
  };
}
