import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Language } from '../../types';
import { LANGUAGES } from '../../locales/languages';
import { t } from '../../services/i18n';

interface LanguageSelectProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
}

export const LanguageSelect: React.FC<LanguageSelectProps> = ({
  currentLanguage,
  onSelectLanguage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeOption = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = LANGUAGES.findIndex((l) => l.code === currentLanguage);
      const nextIndex =
        e.key === 'ArrowDown'
          ? (currentIndex + 1) % LANGUAGES.length
          : (currentIndex - 1 + LANGUAGES.length) % LANGUAGES.length;
      onSelectLanguage(LANGUAGES[nextIndex].code);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div
      ref={containerRef}
      className="retro-card p-5"
    >
      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-5 h-5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
        <h3 className="font-editorial text-base font-bold text-[var(--color-ink)]">
          {t('section_lang', undefined, currentLanguage)}
        </h3>
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        {t('section_lang_label', undefined, currentLanguage)}
      </p>

      {/* Accessible Select Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t('section_lang_label', undefined, currentLanguage)}
          className="w-full min-h-[48px] px-4 py-3 bg-[var(--color-inset)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] hover:bg-[var(--color-surface)] rounded-[12px] flex items-center justify-between text-left transition-all retro-focus"
        >
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-bold text-[var(--color-ink)]"
              lang={activeOption.code}
            >
              {activeOption.nativeName}
            </span>
            {activeOption.code !== 'en' && (
              <span className="text-xs text-[var(--color-muted)]">
                ({activeOption.name})
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[var(--color-ink)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu Options */}
        {isOpen && (
          <ul
            role="listbox"
            aria-label={t('section_lang', undefined, currentLanguage)}
            className="absolute left-0 right-0 mt-2 z-30 bg-[var(--color-surface)] border-2 border-[var(--color-outline)] rounded-[12px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden divide-y-[1.5px] divide-dashed divide-[var(--color-divider)] max-h-72 overflow-y-auto"
          >
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <li
                  key={lang.code}
                  role="option"
                  aria-selected={isSelected}
                  lang={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`min-h-[48px] px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] font-bold'
                      : 'hover:bg-[var(--color-inset)] text-[var(--color-ink)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm" lang={lang.code}>
                      {lang.nativeName}
                    </span>
                    {lang.code !== 'en' && (
                      <span className="text-xs text-[var(--color-muted)] font-normal">
                        ({lang.name})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--color-selected-text)] shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
