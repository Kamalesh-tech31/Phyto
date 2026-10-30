import React, { useState, useMemo } from 'react';
import { PredictionResult, Language } from '../../types';
import { translations } from '../../data/translations';
import {
  ChevronLeft,
  ArrowRight,
  Bug,
  ChevronRight,
} from 'lucide-react';
import { LeafGraphic } from '../../components/LeafGraphic';
import { restricted22Service } from '../../services/restricted22Service';
import { CompactPreventionCard } from '../../components/CompactPreventionCard';
import { CompactSevereSchemeCard } from '../../components/CompactSevereSchemeCard';

interface ResultConfidentProps {
  prediction: PredictionResult;
  language: Language;
  isOnline?: boolean;
  onBack: () => void;
  onSeeTreatment: () => void;
  onViewRelatedScheme?: () => void;
}

export const ResultConfident: React.FC<ResultConfidentProps> = ({
  prediction,
  language,
  isOnline = true,
  onBack,
  onSeeTreatment,
}) => {
  const t = translations[language];
  const [showPestModal, setShowPestModal] = useState(false);

  // Hierarchy 2 (SECONDARY): Compact Prevention KB Lookup (Frozen 22-Class Scope)
  const { entry: preventionEntry, isPest } = useMemo(() => {
    return restricted22Service.lookupPrevention(prediction.crop, prediction.diseaseName);
  }, [prediction.crop, prediction.diseaseName]);

  // 3-segment visual bar for severity
  const getSeverityBars = () => {
    if (prediction.severity === 'severe') {
      return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#1b4d2e]', severe: 'bg-[#b91c1c]' };
    }
    if (prediction.severity === 'moderate') {
      return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#d97706]', severe: 'bg-[#e2e1d7]' };
    }
    return { mild: 'bg-[#1b4d2e]', moderate: 'bg-[#e2e1d7]', severe: 'bg-[#e2e1d7]' };
  };

  const severityBars = getSeverityBars();

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
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
      </div>

      {/* ============================================================== */}
      {/* 1. PREDICTION — PRIMARY DISPLAY (Visual Anchor)                */}
      {/* ============================================================== */}
      <div className="mt-2 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs flex items-center gap-4">
        {/* Leaf / Pest square thumbnail */}
        <div className="w-20 h-20 bg-[#172b1d] rounded-2xl overflow-hidden shrink-0">
          <LeafGraphic
            imageUrl={prediction.imageUrl}
            variant={prediction.diseaseId as any}
            className="w-full h-full"
          />
        </div>

        {/* Text details */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
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

      {/* Prediction Confidence & Severity Metrics */}
      <div className="mt-3 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs space-y-3">
        {/* Confidence Row */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#f1f0e9]">
          <span className="text-xs font-semibold text-[#162a45]">
            {t.confidence_label}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-3 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3 h-1.5 rounded-full bg-[#1b4d2e]" />
            </div>
            <span className="text-xs font-bold text-[#1b4d2e]">
              {prediction.confidence === 'high' ? t.confidence_high : prediction.confidence} (
              {Math.round(prediction.confidenceScore * 100)}%)
            </span>
          </div>
        </div>

        {/* Affected Area & Severity */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#64748b] font-medium">
              {t.affected_area_label}:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-editorial text-2xl font-bold text-[#162a45]">
                {prediction.affectedAreaPercent}%
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  prediction.severity === 'severe'
                    ? 'bg-[#fee2e2] text-[#b91c1c]'
                    : prediction.severity === 'moderate'
                    ? 'bg-[#fef3c7] text-[#92400e]'
                    : 'bg-[#e2f2e5] text-[#1e5c2b]'
                }`}
              >
                {prediction.severity}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2">
            <div className={`h-1.5 rounded-full ${severityBars.mild}`} />
            <div className={`h-1.5 rounded-full ${severityBars.moderate}`} />
            <div className={`h-1.5 rounded-full ${severityBars.severe}`} />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PREVENTION — SECONDARY (Compact Card)                       */}
      {/* ============================================================== */}
      <CompactPreventionCard
        entry={preventionEntry}
        isPest={isPest}
        language={language}
      />

      {/* ============================================================== */}
      {/* 3. GOVERNMENT SUPPORT — CONDITIONAL / RARE                      */}
      {/* Only rendered when severity is severe/critical AND matches KB  */}
      {/* State dropdown is kept compact inside this section             */}
      {/* ============================================================== */}
      <CompactSevereSchemeCard
        crop={prediction.crop}
        severity={prediction.severity}
        diseaseClass={prediction.diseaseName}
        language={language}
      />

      {/* Pest Warning Modal Toggle (if present) */}
      {prediction.pestWarning && (
        <button
          onClick={() => setShowPestModal(true)}
          className="mt-3 bg-white rounded-2xl p-3.5 border border-[#e8e7de] shadow-xs flex items-center justify-between text-left hover:bg-[#fafaf7] transition-all"
        >
          <div>
            <div className="text-[11px] text-[#64748b] font-medium">
              {t.also_found_title}
            </div>
            <div className="text-sm font-bold text-[#162a45]">
              {language === 'ml'
                ? prediction.pestWarning.nameMl
                : prediction.pestWarning.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#fef3c7] text-[#92400e] rounded-full text-[11px] font-semibold">
              {language === 'ml'
                ? prediction.pestWarning.severityLabelMl
                : prediction.pestWarning.severityLabel}
            </span>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </div>
        </button>
      )}

      {/* Action: View Full Treatment Guidance */}
      <button
        onClick={onSeeTreatment}
        className="mt-4 w-full py-3.5 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-xs shadow-xs transition-all flex items-center justify-center gap-2"
      >
        <span>
          {language === 'ml'
            ? 'വിശദമായ ചികിത്സാ മാർഗ്ഗങ്ങൾ കാണുക'
            : 'View Full Treatment Details & Price Outlook'}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Disclaimer Text */}
      <p className="text-[11px] text-[#94a3b8] mt-3.5 px-1 leading-relaxed text-center">
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
                ? 'പ്രതിവിധി: വേപ്പെണ്ണ മിശ്രിതം ഇലയുടെ അടിഭാഗത്ത് കൂടി തളിക്കുന്നത് കീടങ്ങളെ ഫലപ്രദമായി നിയന്ത്രിക്കും.'
                : 'Tip: Spraying neem oil solution directly under leaves deters pests without harming crops.'}
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
