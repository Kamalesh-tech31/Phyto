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
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#0b72c9] rounded-full animate-pulse" />
          <div className="bg-[#e2e1d7] rounded-full" />
        </div>
      </div>

      {/* Scanning Viewport */}
      <div className="relative w-64 h-64 bg-[#172b1d] rounded-3xl overflow-hidden shadow-lg border-2 border-[#2b4c34]">
        <LeafGraphic
          imageUrl={imageUrl}
          variant={presetType as any || 'early_blight'}
          className="w-full h-full"
        />

        {/* Laser Scanning Line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_12px_#38bdf8] animate-scan-line" />

        {/* Scanning grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
      </div>

      {/* Status Heading */}
      <div className="mt-8">
        <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
          {t.analyzing_title}
        </h2>
        <p className="text-sm text-[#475569] mt-2 max-w-xs mx-auto leading-relaxed">
          {t.analyzing_desc}
        </p>
      </div>

      {/* Offline AI indicator badge */}
      <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#eaf2f8] border border-[#d2e4f3] rounded-full text-xs font-medium text-[#0b72c9]">
        <Cpu className="w-3.5 h-3.5 animate-spin" />
        <span>{t.analyzing_hint}</span>
      </div>
    </div>
  );
};
