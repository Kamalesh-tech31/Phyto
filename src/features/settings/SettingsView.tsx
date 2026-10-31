import React, { useState, useEffect } from 'react';
import { Language, SpeechDiagnostics } from '../../types';
import { LanguageSelect } from './LanguageSelect';
import { TextSizeControl } from './TextSizeControl';
import { ThemeControl } from './ThemeControl';
import { useSettings } from '../../services/settingsService';
import { t } from '../../services/i18n';
import { speechService } from '../../services/speechService';
import { RefreshCw, Volume2 } from 'lucide-react';

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

  // Diagnostics for dev or ?debug=1 mode only (Directive 4)
  const isDebug =
    import.meta.env.DEV ||
    (typeof window !== 'undefined' && window.location.search.includes('debug=1'));

  const [diagnostics, setDiagnostics] = useState<SpeechDiagnostics | null>(null);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (isDebug) {
      setDiagnostics(speechService.getDiagnostics(currentLang));
    }
  }, [isDebug, currentLang, isTestingVoice]);

  const handleTestVoice = () => {
    setIsTestingVoice(true);
    speechService.speak({
      text: t('voice_guide_settings', undefined, currentLang),
      clipId: 'page_settings',
      language: currentLang,
      onStateChange: (state) => {
        setIsTestingVoice(state === 'speaking');
        if (isDebug) {
          setDiagnostics(speechService.getDiagnostics(currentLang));
        }
      },
    });
  };

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
        <h1 className="font-editorial text-[1.875rem] font-bold text-[var(--color-ink)] leading-tight">
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
          className="retro-btn-surface w-full min-h-[48px] px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 retro-focus"
        >
          <RefreshCw className="w-4 h-4 text-[var(--color-muted)] shrink-0" aria-hidden="true" />
          <span>{t('btn_reset_defaults', undefined, currentLang)}</span>
        </button>
      </div>

      {/* 5. Voice Test Diagnostics (Rendered ONLY in development or with ?debug=1 per Directive 4) */}
      {isDebug && (
        <div className="p-4 rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface)] space-y-3 mt-4 text-xs">
          <div className="flex items-center justify-between border-b border-[var(--color-rule-soft)] pb-2">
            <span className="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>{t('voice_test_title', undefined, currentLang)}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-inset)] text-[var(--color-muted)] font-mono">
              DEBUG ONLY
            </span>
          </div>

          <div className="space-y-1 text-[var(--color-ink)]">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('voice_test_supported', undefined, currentLang)}:</span>
              <span className="font-semibold">{diagnostics?.isSupported ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('voice_test_total_voices', undefined, currentLang)}:</span>
              <span className="font-semibold">{diagnostics?.totalVoices ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('voice_test_matching', undefined, currentLang)}:</span>
              <span className="font-semibold">{diagnostics?.voicesForLanguage.length ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted)]">{t('voice_test_tier', undefined, currentLang)}:</span>
              <span className="font-semibold uppercase font-mono">{diagnostics?.activeTier || 'none'}</span>
            </div>
            {diagnostics?.lastClipPath && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">{t('voice_test_clip_path', undefined, currentLang)}:</span>
                <span className="font-mono text-[10px] truncate max-w-[180px]">{diagnostics.lastClipPath}</span>
              </div>
            )}
            {diagnostics?.lastHttpStatus && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted)]">{t('voice_test_http_status', undefined, currentLang)}:</span>
                <span className="font-mono">{diagnostics.lastHttpStatus}</span>
              </div>
            )}
            {diagnostics?.lastError && (
              <div className="flex justify-between text-[var(--color-danger-text)]">
                <span>{t('voice_test_last_error', undefined, currentLang)}:</span>
                <span className="truncate max-w-[180px]">{diagnostics.lastError}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isTestingVoice}
            className="retro-btn-primary w-full py-2 px-3 text-xs font-bold rounded-lg mt-2 flex items-center justify-center gap-2"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTestingVoice ? 'Speaking...' : t('voice_test_btn', undefined, currentLang)}</span>
          </button>
        </div>
      )}
    </div>
  );
};
