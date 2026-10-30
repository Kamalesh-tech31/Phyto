import React from 'react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { Cpu } from 'lucide-react';

interface AnalyzingLeafProps {
  imageUrl: string;
  presetType?: string;
  language: Language;
}

export const AnalyzingLeaf: React.FC<AnalyzingLeafProps> = ({
  imageUrl,
  presetType,
  language,
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-5 py-6 max-w-md mx-auto text-center">
      {/* 4-Step Progress Indicator */}
      <div className="w-full mb-6">
        <div className="grid grid-cols-4 gap-1.5 h-2 w-full">
          <div className="bg-[var(--color-primary)] border border-[var(--color-outline)] rounded-full" />
          <div className="bg-[var(--color-primary)] border border-[var(--color-outline)] rounded-full" />
          <div className="bg-[var(--color-primary)] border border-[var(--color-outline)] rounded-full animate-pulse" />
          <div className="bg-[var(--color-inset)] border border-[var(--color-divider)] rounded-full" />
        </div>
      </div>

      {/* Scanning Viewport */}
      <div className="relative w-64 h-64 bg-[#141C16] rounded-[14px] overflow-hidden border-2 border-[var(--color-outline)] shadow-[3px_3px_0_var(--color-shadow-color)]">
        <LeafGraphic
          imageUrl={imageUrl}
          variant={presetType as any || 'early_blight'}
          className="w-full h-full"
        />

        {/* Laser Scanning Line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent animate-scan-line" />

        {/* Scanning grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
      </div>

      {/* Status Heading */}
      <div className="mt-8">
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
          {t.analyzing_title}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-2 max-w-xs mx-auto leading-relaxed">
          {t.analyzing_desc}
        </p>
      </div>

      {/* Offline AI indicator badge */}
      <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-selected-bg)] border-[1.5px] border-[var(--color-selected-border)] rounded-full text-xs font-bold text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)]">
        <Cpu className="w-3.5 h-3.5 animate-spin" />
        <span>{t.analyzing_hint}</span>
      </div>
    </div>
  );
};
