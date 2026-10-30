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
          className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
          {t.result_title}
        </h2>
      </div>

      {/* Dark Leaf Silhouette Container from Reference #5 */}
      <div className="w-full aspect-[4/2.6] bg-[#172b1d] rounded-3xl overflow-hidden mt-2 relative shadow-xs">
        <LeafGraphic
          imageUrl={prediction.imageUrl}
          variant="uncertain"
          className="w-full h-full"
        />
      </div>

      {/* Uncertainty Header Content */}
      <div className="mt-4">
        <span className="inline-block px-3 py-1 bg-[#fef3c7] text-[#92400e] rounded-full text-xs font-semibold">
          {t.uncertain_badge}
        </span>

        <h3 className="font-editorial text-[30px] font-bold text-[#162a45] mt-2 leading-tight">
          {t.uncertain_title}
        </h3>

        <p className="text-sm text-[#475569] mt-2 leading-relaxed">
          {language === 'ml'
            ? prediction.uncertaintyReasonMl || t.uncertain_desc
            : prediction.uncertaintyReason || t.uncertain_desc}
        </p>
      </div>

      {/* Model Predictions Breakdown */}
      {prediction.top3 && prediction.top3.length > 0 && (
        <div className="mt-3.5 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs">
          <div className="text-xs font-semibold text-[#162a45] mb-2">
            {language === 'ml' ? 'മോഡൽ വിതരണം (കുറഞ്ഞ കൃത്യത)' : 'Model Distribution (Low Confidence / Margin)'}
          </div>
          <div className="space-y-2">
            {prediction.top3.map((pred, i) => {
              const pct = Math.round(pred.prob * 100);
              const labelClean = pred.label.replace('_', ' ');
              return (
                <div key={pred.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#475569]">
                    <span className="capitalize">{i + 1}. {labelClean}</span>
                    <span className="font-semibold">{pct}%</span>
                  </div>
                  <div className="w-full bg-[#f1f0e9] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#64748b] mt-2">
            {language === 'ml'
              ? 'രോഗലക്ഷണങ്ങൾ പരസ്പരം സാമ്യമുള്ളതിനാലാണ് കൃത്യത കുറഞ്ഞത്.'
              : 'Predictions are close or below safety threshold. AgriScan avoids false certainty.'}
          </p>
        </div>
      )}

      {/* 3 Tips Card matching Reference #5 */}
      <div className="mt-4 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        <div className="space-y-4">
          {/* Tip 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#e5f1fb] text-[#0b72c9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <p className="text-xs font-medium text-[#162a45] leading-relaxed">
              {t.tip_1}
            </p>
          </div>

          <div className="border-t border-[#f1f0e9]" />

          {/* Tip 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#e5f1fb] text-[#0b72c9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <p className="text-xs font-medium text-[#162a45] leading-relaxed">
              {t.tip_2}
            </p>
          </div>

          <div className="border-t border-[#f1f0e9]" />

          {/* Tip 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#e5f1fb] text-[#0b72c9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <p className="text-xs font-medium text-[#162a45] leading-relaxed">
              {t.tip_3}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons: Retake Photo */}
      <div className="mt-6">
        <button
          onClick={onRetake}
          className="w-full py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-xs transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          <span>{t.btn_retake_photo}</span>
        </button>
      </div>
    </div>
  );
};
