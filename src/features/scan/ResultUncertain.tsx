import React from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { t } from '../../services/i18n';
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
  const trans = translations[language] || translations.en;
  const isNotPlant = Boolean(prediction.isNotPlant || prediction.inferenceStatus === 'NOT_PLANT');

  const badgeText = isNotPlant
    ? t('not_plant_title', undefined, language)
    : trans.uncertain_badge;

  const titleText = isNotPlant
    ? t('not_plant_title', undefined, language)
    : trans.uncertain_title;

  const descText = isNotPlant
    ? t('not_plant_desc', undefined, language)
    : (language === 'ml'
        ? prediction.uncertaintyReasonMl || trans.uncertain_desc
        : prediction.uncertaintyReason || trans.uncertain_desc);

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onRetake}
          className="p-1 -ml-1 text-[var(--color-ink)] hover:opacity-75 transition-opacity rounded-xl retro-focus"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
          {trans.result_title}
        </h2>
      </div>

      {/* Dark Leaf Silhouette Container */}
      <div className="w-full aspect-[4/2.6] bg-[var(--color-vf-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden mt-2 relative">
        <LeafGraphic
          imageUrl={prediction.imageUrl}
          variant="uncertain"
          className="w-full h-full"
        />
      </div>

      {/* Uncertainty / Not Plant Header Content */}
      <div className="mt-4">
        <span className="inline-block px-3 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] rounded-full text-xs font-bold">
          {badgeText}
        </span>

        <h3 className="font-editorial text-[30px] font-bold text-[var(--color-ink)] mt-2 leading-tight">
          {titleText}
        </h3>

        <p className="text-sm text-[var(--color-muted)] mt-2 leading-relaxed">
          {descText}
        </p>
      </div>

      {/* 3 Tips Card */}
      <div className="mt-4 retro-card p-5 space-y-3.5">
        {/* Tip 1 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            1
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
            {trans.tip_1}
          </p>
        </div>

        <div className="retro-divider" />

        {/* Tip 2 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            2
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
            {trans.tip_2}
          </p>
        </div>

        <div className="retro-divider" />

        {/* Tip 3 */}
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            3
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
            {trans.tip_3}
          </p>
        </div>
      </div>

      {/* Action Button: Retake Photo */}
      <div className="mt-6">
        <button
          onClick={onRetake}
          className="w-full min-h-[52px] py-3.5 retro-btn-primary text-base flex items-center justify-center gap-2 retro-focus"
        >
          <Camera className="w-5 h-5" />
          <span>{trans.btn_retake_photo}</span>
        </button>
      </div>
    </div>
  );
};
