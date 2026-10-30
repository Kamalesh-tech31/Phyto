import React, { useState } from 'react';
import { DiseaseGuidance, DiseaseId, Language } from '../../types';
import { translations } from '../../data/translations';
import diseasesData from '../../data/diseases.json';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface TreatmentDetailProps {
  diseaseId: DiseaseId;
  language: Language;
  onBack: () => void;
  onNavigateToSchemes: () => void;
}

export const TreatmentDetail: React.FC<TreatmentDetailProps> = ({
  diseaseId,
  language,
  onBack,
  onNavigateToSchemes,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'treatment' | 'prevention'>('treatment');

  // Find disease guidance data
  const guidance: DiseaseGuidance =
    (diseasesData.find((d) => d.id === diseaseId) as DiseaseGuidance) ||
    (diseasesData[0] as DiseaseGuidance);

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Disease Name */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
          {language === 'ml' ? guidance.nameMl : guidance.name}
        </h2>
      </div>

      {/* Segmented Toggle: Treatment | Prevention */}
      <div className="mt-2 bg-[#eae9e1] p-1 rounded-2xl flex items-center">
        <button
          onClick={() => setActiveTab('treatment')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'treatment'
              ? 'bg-white text-[#162a45] shadow-xs'
              : 'text-[#64748b] hover:text-[#162a45]'
          }`}
        >
          {t.tab_treatment}
        </button>
        <button
          onClick={() => setActiveTab('prevention')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'prevention'
              ? 'bg-white text-[#162a45] shadow-xs'
              : 'text-[#64748b] hover:text-[#162a45]'
          }`}
        >
          {t.tab_prevention}
        </button>
      </div>

      {/* Main Tab Content: Treatment */}
      {activeTab === 'treatment' && (
        <div className="mt-5 space-y-4">
          {/* Section 1: Organic Recommendations */}
          <div>
            <h3 className="text-xs font-bold text-[#2e5e3b] tracking-wide mb-2 uppercase">
              {t.heading_organic}
            </h3>

            {/* Structured Numbered Recommendations */}
            <div className="bg-white rounded-3xl p-2 border border-[#e8e7de] shadow-2xs divide-y divide-[#f1f0e9]">
              {guidance.organicTreatments.map((step) => (
                <div key={step.step} className="flex items-start gap-3.5 p-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#e2f2e5] text-[#1b5e20] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step.step}
                  </div>
                  <p className="text-xs font-medium text-[#162a45] leading-relaxed">
                    {language === 'ml' ? step.textMl : step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Chemical / Stronger Option Caution Card */}
          <div>
            <h3 className="text-xs font-bold text-[#854d0e] tracking-wide mb-2 uppercase">
              {t.heading_chemical}
            </h3>

            <div className="bg-[#fef3c7]/75 border border-[#fde68a] rounded-3xl p-4 text-[#78350f] shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#b45309] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold leading-snug">
                    {language === 'ml'
                      ? guidance.chemicalCaution.headlineMl
                      : guidance.chemicalCaution.headline}
                  </p>
                  <p className="text-xs text-[#92400e] leading-relaxed">
                    {language === 'ml'
                      ? guidance.chemicalCaution.cautionMl
                      : guidance.chemicalCaution.caution}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: What It Should Cost */}
          <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-editorial text-base font-bold text-[#162a45]">
                {t.cost_heading}
              </h4>
              <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                Demo data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-[#f1f0e9]">
              {/* Average Price */}
              <div>
                <span className="text-xs text-[#64748b] block">
                  {t.cost_average}
                </span>
                <span className="font-editorial text-2xl font-bold text-[#162a45] mt-0.5 block">
                  {guidance.costEstimate.avgPrice}
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {language === 'ml'
                    ? guidance.costEstimate.unitMl
                    : guidance.costEstimate.unit}
                </span>
              </div>

              {/* Government / Subsidized Price */}
              <div className="border-l border-[#f1f0e9] pl-4">
                <span className="text-xs text-[#64748b] block">
                  {t.cost_govt}
                </span>
                <span className="font-editorial text-2xl font-bold text-[#162a45] mt-0.5 block">
                  {guidance.costEstimate.govtPrice}
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {t.cost_subtext}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Contextual Related Schemes Banner */}
          <button
            onClick={onNavigateToSchemes}
            className="w-full bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-2xs flex items-center justify-between text-left hover:bg-[#fafaf7] transition-all"
          >
            <div>
              <div className="font-editorial text-base font-bold text-[#162a45]">
                {t.schemes_banner_title}
              </div>
              <div className="text-xs text-[#64748b] mt-0.5">
                {t.schemes_banner_sub}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
          </button>
        </div>
      )}

      {/* Main Tab Content: Prevention */}
      {activeTab === 'prevention' && (
        <div className="mt-5 space-y-4">
          <div className="bg-white rounded-3xl p-2 border border-[#e8e7de] shadow-2xs divide-y divide-[#f1f0e9]">
            {guidance.preventions.map((prev) => (
              <div key={prev.step} className="flex items-start gap-3.5 p-3.5">
                <div className="w-7 h-7 rounded-full bg-[#e5f1fb] text-[#0b72c9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {prev.step}
                </div>
                <p className="text-xs font-medium text-[#162a45] leading-relaxed">
                  {language === 'ml' ? prev.textMl : prev.text}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-[#eef8f0] border border-[#cbe8d2] rounded-3xl p-4 text-[#1a512b]">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#16a34a]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {language === 'ml' ? 'കർഷക ശ്രദ്ധയ്ക്ക്' : 'Farmer Pro Tip'}
              </span>
            </div>
            <p className="text-xs text-[#285f39] leading-relaxed">
              {language === 'ml'
                ? 'വിളവെടുപ്പിന് ശേഷം രോഗബാധയുള്ള ചെടികളുടെ അവശിഷ്ടങ്ങൾ ഉടനടി തോട്ടത്തിൽ നിന്ന് മാറ്റി കത്തിച്ചു കളയുക. ഇത് അടുത്ത സീസണിലെ രോഗസാധ്യത 80% വരെ കുറയ്ക്കും.'
                : 'Thoroughly destroy crop residue after harvest to break the fungal pathogen cycle for the next season.'}
            </p>
          </div>
        </div>
      )}

      {/* Crop Price Prediction Section (Requested in Section 4) */}
      <div className="mt-5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#e5f1fb] flex items-center justify-center text-[#0b72c9]">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="font-editorial text-lg font-bold text-[#162a45]">
              {language === 'ml' ? 'വിള വില അനുമാനം' : 'Crop price outlook'}
            </h4>
          </div>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded-md tracking-wider">
            Demo data
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-[#f1f0e9] space-y-2.5">
          {/* Current / Expected Tomato Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന തക്കാളി വില:' : 'Current / expected tomato price:'}
            </span>
            <div className="text-right">
              <span className="font-editorial text-2xl font-bold text-[#162a45]">
                ₹32
              </span>
              <span className="text-xs font-medium text-[#64748b]"> / kg</span>
            </div>
          </div>

          {/* Trend */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'വിപണി പ്രവണത (Trend):' : 'Market trend:'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>↑</span>
              <span>{language === 'ml' ? 'വർദ്ധിക്കുന്നു (Rising)' : 'Rising (+12%)'}</span>
            </span>
          </div>

          {/* Indicative Market Range */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'വിപണി നിരക്ക് പരിധി:' : 'Indicative market range:'}
            </span>
            <span className="text-xs font-bold text-[#162a45]">
              ₹26 – ₹38 / kg
            </span>
          </div>

          <p className="text-[11px] text-[#94a3b8] pt-1 leading-normal">
            {language === 'ml'
              ? 'പ്രാദേശിക കാർഷിക മൊത്തവ്യാപാര മാർക്കറ്റുകളിലെ ശരാശരി വില നിലവാരം. (മാതൃകാ ഡാറ്റ)'
              : 'Indicative mandi rate based on regional vegetable arrivals. (Demo estimation)'}
          </p>
        </div>
      </div>

      {/* Sample Content Disclaimer */}
      <p className="text-xs text-[#64748b] mt-4 px-1 leading-relaxed">
        {t.guidance_disclaimer}
      </p>

      {/* Return to Result Button */}
      <div className="mt-5">
        <button
          onClick={onBack}
          className="w-full py-3.5 px-4 bg-transparent border-2 border-[#162a45] hover:bg-[#f3f2ea] active:scale-[0.98] text-[#162a45] font-semibold rounded-2xl text-sm transition-all text-center"
        >
          {language === 'ml' ? '← ഫലത്തിലേക്ക് മടങ്ങുക' : '← Back to Result'}
        </button>
      </div>
    </div>
  );
};
