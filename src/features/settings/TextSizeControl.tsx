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
    <div className="bg-[var(--color-surface)] rounded-3xl p-5 border border-[var(--color-border)] transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Type className="w-5 h-5 text-[var(--color-accent-text)] shrink-0" aria-hidden="true" />
        <h3 className="font-editorial text-base font-bold text-[var(--color-text)]">
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
        className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--color-inset)] border border-[var(--color-border)] rounded-2xl"
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
              className={`min-h-[46px] py-2 px-2 flex flex-col items-center justify-center rounded-xl text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isSelected
                  ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-selected-border)] font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)] font-medium border border-transparent'
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
      <div className="mt-4 p-3.5 bg-[var(--color-inset)] border border-[var(--color-border)] rounded-2xl">
        <div className="text-[10px] font-bold text-[var(--color-accent-text)] uppercase tracking-wider mb-1">
          Preview
        </div>
        <p className="text-[var(--color-text)] leading-relaxed break-words font-medium">
          {t('text_size_preview', undefined, currentLanguage)}
        </p>
      </div>
    </div>
  );
};
