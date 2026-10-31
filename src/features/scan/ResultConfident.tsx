import React, { useState } from 'react';
import { Language, PredictionResult } from '../../types';
import { i18n } from '../../services/i18nService';
import { LeafGraphic } from '../../components/LeafGraphic';
import {
  ChevronLeft,
  ChevronRight,
  Bug,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

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
  onBack,
  onSeeTreatment,
  onViewRelatedScheme,
}) => {
  const [showPestModal, setShowPestModal] = useState(false);

  // Lookup disease knowledge base entry for selected language with fallback
  const kb = i18n.getKB(prediction.class_id);

  // Helper for translated severity level word
  const getSeverityLevelLabel = () => {
    if (prediction.severity === 'severe') return i18n.t('severity_severe');
    if (prediction.severity === 'moderate') return i18n.t('severity_moderate');
    return i18n.t('severity_mild');
  };

  // Severity 3-segment progress bar helper
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

  // Unrecognized fallback if class_id is missing in KB
  if (!kb) {
    return (
      <div className="flex flex-col px-5 pt-3 pb-36 max-w-md mx-auto">
        <div className="flex items-center gap-3 py-2">
          <button onClick={onBack} className="p-1 -ml-1 text-[#162a45]">
            <ChevronLeft className="w-7 h-7 stroke-[2]" />
          </button>
          <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
            {i18n.t('result_title')}
          </h2>
        </div>
        <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl text-center">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h3 className="font-editorial text-xl font-bold text-[#162a45] mb-2">
            {i18n.t('uncertain_title')}
          </h3>
          <p className="text-xs text-[#64748b] leading-relaxed">
            {i18n.t('not_recognised_message')}
          </p>
          <button
            onClick={onBack}
            className="mt-6 px-6 py-2.5 bg-[#0b72c9] text-white rounded-xl text-xs font-semibold"
          >
            {i18n.t('btn_retake_photo')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-5 pt-2 pb-36 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title (No duplicate voice button) */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2]" />
          </button>
          <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
            {i18n.t('result_title')}
          </h2>
        </div>

        {/* Demo Result Badge */}
        <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {i18n.t('demo_result_badge')}
        </span>
      </div>

      {/* Leaf Photo Container */}
      <div className="w-full aspect-[4/2.6] bg-[#172b1d] rounded-3xl overflow-hidden mt-2 relative shadow-xs border border-[#23422a]">
        <LeafGraphic
          imageUrl={prediction.imageData || prediction.imageUrl}
          variant={(prediction.diseaseId as any) || 'early_blight'}
          className="w-full h-full"
        />
      </div>

      {/* Card 1: Diagnosis Identity Card */}
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#64748b]">
            {kb.crop}
          </span>
          <h3 className="font-editorial text-2xl font-bold text-[#162a45] leading-tight break-words">
            {kb.name}
          </h3>
          <span className="mt-1.5 inline-block self-start px-2.5 py-0.5 bg-[#e5f1fb] text-[#0e5b9e] rounded-full text-xs font-semibold">
            {kb.type}
          </span>
        </div>
      </div>

      {/* Card 2: Confidence & Severity Breakdown */}
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        {/* Confidence Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#f1f0e9]">
          <span className="text-sm font-semibold text-[#162a45]">
            {i18n.t('confidence_label')}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[#1b4d2e]" />
            </div>
            <span className="text-xs font-bold text-[#1b4d2e]">
              {prediction.confidence === 'high'
                ? i18n.t('confidence_high')
                : prediction.confidence === 'medium'
                ? i18n.t('confidence_medium')
                : i18n.t('confidence_low')}
            </span>
          </div>
        </div>

        {/* Severity Section */}
        <div className="pt-3.5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold text-[#162a45]">
              {i18n.t('affected_area_label')}
            </span>
            <span className="text-xs text-[#64748b]">
              {i18n.t('severity_summary_template', {
                pct: prediction.affectedAreaPercent,
                level: getSeverityLevelLabel(),
              })}
            </span>
          </div>

          {/* 3-Part Segmented Severity Bar */}
          <div className="grid grid-cols-3 gap-1.5 h-2 w-full">
            <div className={`rounded-full transition-all ${severityBars.mild}`} />
            <div className={`rounded-full transition-all ${severityBars.moderate}`} />
            <div className={`rounded-full transition-all ${severityBars.severe}`} />
          </div>

          <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1.5 font-medium">
            <span>{i18n.t('severity_mild')}</span>
            <span>{i18n.t('severity_moderate')}</span>
            <span>{i18n.t('severity_severe')}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Also Found on this Leaf (Pest Warning) */}
      {prediction.pestWarning && (
        <div
          onClick={() => setShowPestModal(true)}
          className="mt-3.5 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs flex items-center justify-between cursor-pointer hover:bg-[#fafaf7] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
              <Bug className="w-4 h-4 text-[#d97706]" />
            </div>
            <div>
              <span className="text-[10px] text-[#64748b] block font-medium">
                {i18n.t('also_found_title')}
              </span>
              <span className="text-xs font-bold text-[#162a45]">
                {i18n.t('pest_label')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
              {i18n.t('pest_badge')}
            </span>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </div>
        </div>
      )}

      {/* Card 4: Related Government Scheme */}
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        <span className="text-[10px] font-bold text-[#0b72c9] uppercase tracking-wider block mb-1">
          {i18n.t('related_schemes_label')}
        </span>
        <h4 className="font-editorial text-base font-bold text-[#162a45]">
          {i18n.t('related_scheme_title')}
        </h4>
        <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
          {i18n.t('related_scheme_desc')}
        </p>

        <button
          onClick={onViewRelatedScheme}
          className="mt-3 text-xs font-bold text-[#0b72c9] flex items-center gap-1 hover:underline"
        >
          <span>{i18n.t('btn_view_scheme')}</span>
        </button>
      </div>

      {/* Primary Action: View Treatment & Prevention */}
      <button
        onClick={onSeeTreatment}
        className="w-full mt-4 py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all flex items-center justify-between px-5"
      >
        <span className="font-semibold text-sm">
          {i18n.t('btn_see_treatment')}
        </span>
        <ArrowRight className="w-4 h-4 stroke-[2.4]" />
      </button>

      {/* Disclaimer Text */}
      <p className="text-xs text-[#64748b] mt-4 px-1 leading-relaxed">
        {i18n.t('disclaimer_text')}
      </p>

      {/* Pest Information Modal */}
      {showPestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-[#162a45] mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Bug className="w-4 h-4 text-amber-700" />
              </div>
              <h3 className="font-bold text-base">
                {i18n.t('pest_tip_title')} · {i18n.t('pest_label')}
              </h3>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed mt-2">
              {prediction.pestWarning?.details || i18n.t('pest_tip_desc')}
            </p>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {i18n.t('pest_tip_desc')}
            </div>
            <button
              onClick={() => setShowPestModal(false)}
              className="mt-4 w-full rounded-2xl bg-[#162a45] py-2.5 text-xs font-semibold text-white"
            >
              {i18n.t('btn_got_it')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
