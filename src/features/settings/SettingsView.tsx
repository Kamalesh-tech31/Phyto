import React from 'react';
import { Language } from '../../types';
import { LanguageSelect } from './LanguageSelect';
import { TextSizeControl } from './TextSizeControl';
import { ThemeControl } from './ThemeControl';
import { useSettings } from '../../services/settingsService';
import { t } from '../../services/i18n';
import { RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  language?: Language;
  onLanguageToggle?: () => void;
  isOnline?: boolean;
  onOpenSchemes?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language: propLanguage,
}) => {
  const { settings, setLanguage, setTextSize, setTheme, resetToDefaults } = useSettings();
  const currentLang = propLanguage || settings.language;

  const handleResetDefaults = () => {
    if (confirm(t('reset_confirm', undefined, currentLang))) {
      resetToDefaults();
      alert(t('reset_success', undefined, currentLang));
    }
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-36 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div>
        <h1 className="font-editorial text-[1.875rem] font-bold text-[var(--color-text)] leading-tight">
          {t('settings_header_title', undefined, currentLang)}
        </h1>
      </div>

      {/* 1. Language Dropdown Control */}
      <LanguageSelect
        currentLanguage={settings.language}
        onSelectLanguage={setLanguage}
      />

      {/* 2. Text Size Control */}
      <TextSizeControl
        currentSize={settings.textSize}
        currentLanguage={currentLang}
        onSelectSize={setTextSize}
      />

      {/* 3. Theme Control */}
      <ThemeControl
        currentTheme={settings.theme}
        currentLanguage={currentLang}
        onSelectTheme={setTheme}
      />

      {/* 4. Reset Preferences to Defaults Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-[var(--color-surface)] hover:bg-[var(--color-inset)] text-[var(--color-text)] border border-[var(--color-border)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <RefreshCw className="w-4 h-4 text-[var(--color-muted)] shrink-0" aria-hidden="true" />
          <span>{t('btn_reset_defaults', undefined, currentLang)}</span>
        </button>
      </div>
    </div>
  );
};
