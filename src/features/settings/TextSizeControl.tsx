import React from 'react';
import { Type } from 'lucide-react';
import { Language, TextSize } from '../../types';
import { t } from '../../services/i18n';

interface TextSizeControlProps {
  currentSize: TextSize;
  currentLanguage: Language;
  onSelectSize: (size: TextSize) => void;
}

interface SizeStep {
  id: TextSize;
  labelKey: string;
  percentLabel: string;
}

const STEPS: SizeStep[] = [
  { id: 'small', labelKey: 'text_size_small', percentLabel: '87%' },
  { id: 'default', labelKey: 'text_size_default', percentLabel: '100%' },
  { id: 'large', labelKey: 'text_size_large', percentLabel: '112%' },
];

export const TextSizeControl: React.FC<TextSizeControlProps> = ({
  currentSize,
  currentLanguage,
  onSelectSize,
}) => {
  return (
    <div className="retro-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-5 h-5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
        <h3 className="font-editorial text-base font-bold text-[var(--color-ink)]">
          {t('section_text_size', undefined, currentLanguage)}
        </h3>
      </div>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        {t('text_size_preview', undefined, currentLanguage)}
      </p>

      {/* Segmented Control with min 44px touch targets */}
      <div
        role="radiogroup"
        aria-label={t('section_text_size', undefined, currentLanguage)}
        className="retro-inset grid grid-cols-3 gap-1.5 p-1"
      >
        {STEPS.map((step) => {
          const isSelected = currentSize === step.id;
          const label = t(step.labelKey, undefined, currentLanguage);

          return (
            <button
              key={step.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectSize(step.id)}
              className={`min-h-[46px] py-2 px-2 flex flex-col items-center justify-center text-center transition-all retro-focus ${
                isSelected
                  ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] shadow-[2px_2px_0_var(--color-shadow-color)] font-bold rounded-[10px]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] font-medium border border-transparent rounded-[10px]'
              }`}
            >
              <span className="text-xs leading-tight break-words max-w-full">
                {label}
              </span>
              <span
                className={`text-[10px] mt-0.5 leading-none ${
                  isSelected ? 'text-[var(--color-selected-text)] opacity-90' : 'text-[var(--color-muted)]'
                }`}
              >
                {step.percentLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Preview Box */}
      <div className="mt-4 p-3.5 retro-inset">
        <div className={`text-[10px] font-bold text-[var(--color-primary)] mb-1 ${currentLanguage === 'en' ? 'uppercase tracking-wider' : ''}`}>
          Preview
        </div>
        <p className="text-[var(--color-ink)] leading-relaxed break-words font-medium">
          {t('text_size_preview', undefined, currentLanguage)}
        </p>
      </div>
    </div>
  );
};
