import React from 'react';
import { Language, QualityCheckResult } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react';

interface PhotoCheckProps {
  imageUrl: string;
  presetType?: string;
  quality: QualityCheckResult;
  language: Language;
  onAnalyse: () => void;
  onRetake: () => void;
}

export const PhotoCheck: React.FC<PhotoCheckProps> = ({
  imageUrl,
  presetType,
  quality,
  language,
  onAnalyse,
  onRetake,
}) => {
  const t = translations[language];
  const [showEnhanced, setShowEnhanced] = React.useState(Boolean(quality.enhancedImageUrl));

  // Helper for check icon (green check or amber warning)
  const renderStatusIcon = (passed: boolean) => {
    if (passed) {
      return (
        <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-[#16a34a] stroke-[3]" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-[#d97706] stroke-[2.5]" />
      </div>
    );
  };

  const isBlurryPreset = presetType === 'blurry';
  const displayImage = showEnhanced && quality.enhancedImageUrl ? quality.enhancedImageUrl : imageUrl;

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
          {t.photo_check_title}
        </h2>
      </div>

      {/* 4-Step Progress Indicator Matching Reference #2 */}
      <div className="mt-1 mb-2">
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#e2e1d7] rounded-full" />
          <div className="bg-[#e2e1d7] rounded-full" />
        </div>
        <p className="text-xs text-[#64748b] mt-2 font-medium">
          {t.step_indicator}
        </p>
      </div>

      {/* Enhanced Photo Banner (if borderline enhancement applied) */}
      {quality.enhancedImageUrl && (
        <div className="mt-2 bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="text-xs font-semibold text-[#065f46]">
              {language === 'ml' ? 'ഫോട്ടോ തെളിമ കൂട്ടിയിട്ടുണ്ട്' : 'We improved this photo'}
            </span>
          </div>
          <div className="flex bg-[#d1fae5] p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setShowEnhanced(true)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                showEnhanced ? 'bg-white text-[#065f46] font-bold shadow-2xs' : 'text-[#047857]'
              }`}
            >
              Enhanced
            </button>
            <button
              onClick={() => setShowEnhanced(false)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                !showEnhanced ? 'bg-white text-[#065f46] font-bold shadow-2xs' : 'text-[#047857]'
              }`}
            >
              Original
            </button>
          </div>
        </div>
      )}

      {/* Captured Image Preview */}
      <div className="w-full aspect-[4/3] bg-[#172b1d] rounded-3xl overflow-hidden mt-3 relative shadow-xs">
        <LeafGraphic
          imageUrl={displayImage}
          variant={(presetType as any) || 'early_blight'}
          className="w-full h-full"
          showShadow={imageUrl.startsWith('sample:') && !isBlurryPreset}
        />
      </div>

      {/* Quality Checks Card */}
      <div className="mt-4 bg-white rounded-2xl border border-[#e8e7de] overflow-hidden shadow-2xs divide-y divide-[#f1f0e9]">
        {/* Sharpness */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.sharpnessPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {t.quality_sharpness}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.sharpnessPass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {language === 'ml' ? quality.sharpnessLabelMl : quality.sharpnessLabel}
          </span>
        </div>

        {/* Light */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.lightPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {t.quality_light}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.lightPass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {language === 'ml' ? quality.lightLabelMl : quality.lightLabel}
          </span>
        </div>

        {/* Shadow */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.shadowPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {t.quality_shadow}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.shadowPass ? 'text-[#475569]' : 'text-[#92400e]'
            }`}
          >
            {language === 'ml' ? quality.shadowLabelMl : quality.shadowLabel}
          </span>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.distancePass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {t.quality_distance}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.distancePass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {language === 'ml' ? quality.distanceLabelMl : quality.distanceLabel}
          </span>
        </div>
      </div>

      {/* Advisory Note */}
      <p className={`text-xs mt-3 px-1 leading-relaxed ${!quality.isAcceptable ? 'text-amber-700 font-medium' : 'text-[#556980]'}`}>
        {language === 'ml' ? quality.adviceMl : quality.advice}
      </p>

      {/* Action Buttons: If acceptable, Analyse is primary. If unacceptable (retake), Retake is primary. */}
      <div className="mt-8 flex flex-col gap-3">
        {quality.isAcceptable ? (
          <>
            <button
              onClick={onAnalyse}
              className="w-full py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all"
            >
              {t.btn_analyse_leaf}
            </button>

            <button
              onClick={onRetake}
              className="w-full py-3.5 bg-transparent border-2 border-[#162a45] hover:bg-[#f3f2ea] active:scale-[0.98] text-[#162a45] font-semibold rounded-2xl text-base transition-all"
            >
              {t.btn_retake_photo}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onRetake}
              className="w-full py-4 bg-[#b91c1c] hover:bg-[#991b1b] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all"
            >
              {t.btn_retake_photo}
            </button>

            <button
              onClick={onAnalyse}
              className="w-full py-3.5 bg-transparent border-2 border-slate-300 hover:bg-slate-100 active:scale-[0.98] text-slate-600 font-semibold rounded-2xl text-sm transition-all"
            >
              {language === 'ml' ? 'ഇത് തന്നെ സ്കാൻ ചെയ്യുക (കുറഞ്ഞ കൃത്യത)' : 'Scan anyway (Low confidence)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
