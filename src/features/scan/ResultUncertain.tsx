import React from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, Camera } from 'lucide-react';

interface ResultUncertainProps {
  prediction: PredictionResult;
  language: Language;
  isOnline: boolean;
  onRetake: () => void;
}

export const ResultUncertain: React.FC<ResultUncertainProps> = ({
  prediction,
  language,
  onRetake,
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onRetake}
          className="p-1 -ml-1 text-[var(--color-text)] hover:opacity-75 transition-opacity rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-text)]">
          {t.result_title}
        </h2>
      </div>

      {/* Dark Leaf Silhouette Container from Reference #5 */}
      <div className="w-full aspect-[4/2.6] bg-[#172b1d] rounded-3xl overflow-hidden mt-2 relative">
        <LeafGraphic
          imageUrl={prediction.imageUrl}
          variant="uncertain"
          className="w-full h-full"
        />
      </div>

      {/* Uncertainty Header Content */}
      <div className="mt-4">
        <span className="inline-block px-3 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] rounded-full text-xs font-semibold">
          {t.uncertain_badge}
        </span>

        <h3 className="font-editorial text-[30px] font-bold text-[var(--color-text)] mt-2 leading-tight">
          {t.uncertain_title}
        </h3>

        <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">
          {language === 'ml'
            ? prediction.uncertaintyReasonMl || t.uncertain_desc
            : prediction.uncertaintyReason || t.uncertain_desc}
        </p>
      </div>

      {/* 3 Tips Card matching Reference #5 */}
      <div className="mt-4 bg-[var(--color-surface)] rounded-3xl p-5 border border-[var(--color-border)]">
        <div className="space-y-4">
          {/* Tip 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <p className="text-xs font-medium text-[var(--color-text)] leading-relaxed">
              {t.tip_1}
            </p>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Tip 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <p className="text-xs font-medium text-[var(--color-text)] leading-relaxed">
              {t.tip_2}
            </p>
          </div>

          <div className="border-t border-[var(--color-border)]" />

          {/* Tip 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <p className="text-xs font-medium text-[var(--color-text)] leading-relaxed">
              {t.tip_3}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Retake Photo */}
      <div className="mt-6">
        <button
          onClick={onRetake}
          className="w-full min-h-[52px] py-3.5 bg-[var(--color-primary)] hover:opacity-95 active:scale-[0.98] text-[var(--color-on-primary)] font-semibold rounded-2xl text-base shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <Camera className="w-5 h-5" />
          <span>{t.btn_retake_photo}</span>
        </button>
      </div>
    </div>
  );
};
