import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { Language, ThemeMode } from '../../types';
import { t } from '../../services/i18n';

interface ThemeControlProps {
  currentTheme: ThemeMode;
  currentLanguage: Language;
  onSelectTheme: (theme: ThemeMode) => void;
}

export const ThemeControl: React.FC<ThemeControlProps> = ({
  currentTheme,
  currentLanguage,
  onSelectTheme,
}) => {
  const themes: { id: ThemeMode; labelKey: string; icon: React.ElementType }[] = [
    { id: 'light', labelKey: 'theme_light', icon: Sun },
    { id: 'dark', labelKey: 'theme_dark', icon: Moon },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-3xl p-5 border border-[var(--color-border)] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Palette className="w-5 h-5 text-[var(--color-accent-text)] shrink-0" aria-hidden="true" />
        <h3 className="font-editorial text-base font-bold text-[var(--color-text)]">
          {t('section_theme', undefined, currentLanguage)}
        </h3>
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        {t(currentTheme === 'dark' ? 'theme_dark' : 'theme_light', undefined, currentLanguage)}
      </p>

      {/* Segmented Control */}
      <div
        role="radiogroup"
        aria-label={t('section_theme', undefined, currentLanguage)}
        className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--color-inset)] border border-[var(--color-border)] rounded-2xl"
      >
        {themes.map((item) => {
          const isSelected = currentTheme === item.id;
          const Icon = item.icon;
          const label = t(item.labelKey, undefined, currentLanguage);

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectTheme(item.id)}
              className={`min-h-[48px] py-2.5 px-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-selected-border)] shadow-xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
