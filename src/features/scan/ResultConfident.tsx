import React, { useState } from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, ChevronRight, Bug, ArrowRight } from 'lucide-react';

interface ResultConfidentProps {
  prediction: PredictionResult;
  language: Language;
  onBack: () => void;
  onSeeTreatment: () => void;
  onViewRelatedScheme: () => void;
  onPestClick?: () => void;
}

export const ResultConfident: React.FC<ResultConfidentProps> = ({
  prediction,
  language,
  onBack,
  onSeeTreatment,
  onViewRelatedScheme,
}) => {
  const t = translations[language];
  const [showPestModal, setShowPestModal] = useState(false);

  // Severity 3-segment progress bar helper
  const getSeverityBars = () => {
    if (prediction.severity === 'severe') {
      return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#1b4d2e]', severe: 'bg-[#b91c1c]' };
    }
    if (prediction.severity === 'moderate') {
      return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#d97706]', severe: 'bg-[#e2e1d7]' };
    }
    // Mild
    return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#e2e1d7]', severe: 'bg-[#e2e1d7]' };
  };

  const severityBars = getSeverityBars();

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
          {t.result_title}
        </h2>
      </div>

      {/* Card 1: Disease Identity & Leaf Thumbnail */}
      <div className="mt-2 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs flex items-center gap-4">
        {/* Leaf square thumbnail */}
        <div className="w-20 h-20 bg-[#172b1d] rounded-2xl overflow-hidden shrink-0">
          <LeafGraphic
            imageUrl={prediction.imageUrl}
            variant={prediction.diseaseId as any}
            className="w-full h-full"
          />
        </div>

        {/* Text details */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#64748b]">
            {language === 'ml' ? prediction.cropMl : prediction.crop}
          </span>
          <h3 className="font-editorial text-2xl font-bold text-[#162a45] leading-tight">
            {language === 'ml' ? prediction.diseaseNameMl : prediction.diseaseName}
          </h3>
          <span className="mt-1.5 inline-block self-start px-2.5 py-0.5 bg-[#e5f1fb] text-[#0e5b9e] rounded-full text-xs font-semibold">
            {language === 'ml' ? prediction.categoryMl : prediction.category}
          </span>
        </div>
      </div>

      {/* Card 2: Confidence & Severity Breakdown */}
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        {/* Confidence Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#f1f0e9]">
          <span className="text-sm font-semibold text-[#162a45]">
            {t.confidence_label}
          </span>
          <div className="flex items-center gap-2">
            {/* 3-bar confidence indicator */}
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
            </div>
            <span className="text-xs font-bold text-[#1b4d2e]">
              {t.confidence_high}
            </span>
          </div>
        </div>

        {/* Affected Leaf Area & Severity */}
        <div className="pt-4">
          <div className="text-xs font-medium text-[#64748b]">
            {t.affected_area_label}
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-editorial text-4xl font-bold text-[#162a45]">
              {prediction.affectedAreaPercent}%
            </span>
            <span className="px-2.5 py-0.5 bg-[#e2f2e5] text-[#1e5c2b] rounded-full text-xs font-bold capitalize">
              {prediction.severity === 'mild'
                ? t.severity_mild
                : prediction.severity === 'moderate'
                ? t.severity_moderate
                : t.severity_severe}
            </span>
          </div>

          {/* 3-segment severity bar */}
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <div className={`h-2 rounded-full ${severityBars.mild}`} />
            <div className={`h-2 rounded-full ${severityBars.moderate}`} />
            <div className={`h-2 rounded-full ${severityBars.severe}`} />
          </div>

          <div className="grid grid-cols-3 text-[11px] font-semibold text-[#64748b] mt-1.5">
            <span>{t.severity_mild}</span>
            <span className="text-center">{t.severity_moderate}</span>
            <span className="text-right">{t.severity_severe}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Pest Observation on Leaf */}
      {prediction.pestWarning && (
        <button
          onClick={() => setShowPestModal(true)}
          className="mt-3.5 bg-white rounded-2xl p-4 border border-[#e8e7de] shadow-xs flex items-center justify-between text-left hover:bg-[#fafaf7] transition-all"
        >
          <div>
            <div className="text-xs text-[#64748b] font-medium">
              {t.also_found_title}
            </div>
            <div className="text-base font-bold text-[#162a45] mt-0.5">
              {language === 'ml'
                ? prediction.pestWarning.nameMl
                : prediction.pestWarning.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#fef3c7] text-[#92400e] rounded-full text-xs font-semibold">
              {language === 'ml'
                ? prediction.pestWarning.severityLabelMl
                : prediction.pestWarning.severityLabel}
            </span>
            <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
          </div>
        </button>
      )}

      {/* Prominent Action: View Treatment & Prevention */}
      <button
        onClick={onSeeTreatment}
        className="mt-4 w-full py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-sm shadow-xs transition-all flex items-center justify-center gap-2"
      >
        <span>{language === 'ml' ? 'ചികിത്സയും പ്രതിരോധവും കാണുക' : 'View Treatment & Prevention'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Prominent Related Schemes Action Card (Contextual Scheme Access) */}
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        <div className="text-[11px] font-bold text-[#1b5e20] uppercase tracking-wider">
          {language === 'ml' ? 'ബന്ധപ്പെട്ട സർക്കാർ പദ്ധതി' : 'Related schemes'}
        </div>
        <h4 className="font-editorial text-lg font-bold text-[#162a45] mt-1 leading-snug">
          {language === 'ml'
            ? 'സുഭിക്ഷ കേരളം - പച്ചക്കറി വികസന പദ്ധതി'
            : 'Vegetable Development Programme'}
        </h4>
        <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
          {language === 'ml'
            ? 'തക്കാളി ചെടികൾക്ക് ജൈവ കുമിൾനാശിനികൾക്കും സ്പ്രേയർ ടാങ്കുകൾക്കും 50% സബ്സിഡി സഹായം.'
            : '50% subsidy on bio-fungicides and knapsack sprayers for tomato crop protection.'}
        </p>

        <button
          onClick={onViewRelatedScheme}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#0b72c9] hover:text-[#085da5] active:scale-95 transition-all"
        >
          <span>{language === 'ml' ? 'പദ്ധതി കാണുക →' : 'View scheme →'}</span>
        </button>
      </div>

      {/* Disclaimer Text */}
      <p className="text-xs text-[#64748b] mt-4 px-1 leading-relaxed">
        {t.disclaimer_text}
      </p>

      {/* Pest Information Modal */}
      {showPestModal && prediction.pestWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-[#162a45] mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Bug className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-bold text-base">
                {language === 'ml'
                  ? prediction.pestWarning.nameMl
                  : prediction.pestWarning.name}
              </h3>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed mt-2">
              {language === 'ml'
                ? prediction.pestWarning.detailsMl
                : prediction.pestWarning.details}
            </p>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {language === 'ml'
                ? 'പ്രതിവിധി: വേപ്പെണ്ണ മിശ്രിതം ഇലയുടെ അടിഭാഗത്ത് കൂടി തളിക്കുന്നത് മുഞ്ഞയെ ഫലപ്രദമായി നിയന്ത്രിക്കും.'
                : 'Tip: Spraying neem oil solution directly under the leaves deters aphids without harming crops.'}
            </div>
            <button
              onClick={() => setShowPestModal(false)}
              className="mt-4 w-full rounded-2xl bg-[#162a45] py-2.5 text-xs font-semibold text-white"
            >
              {language === 'ml' ? 'മനസ്സിലായി (Close)' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
