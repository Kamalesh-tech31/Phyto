import React, { useState, useMemo } from 'react';
import { DiseaseGuidance, DiseaseId, Language } from '../../types';
import { translations } from '../../data/translations';
import diseasesData from '../../data/diseases.json';
import { restricted22Service } from '../../services/restricted22Service';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface TreatmentDetailProps {
  diseaseId: DiseaseId;
  crop?: string;
  diseaseName?: string;
  language: Language;
  onBack: () => void;
  onNavigateToSchemes: () => void;
}

export const TreatmentDetail: React.FC<TreatmentDetailProps> = ({
  diseaseId,
  crop,
  diseaseName,
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

  // Look up prevention from Restricted_22_Class_Prevention_KB.json
  const { entry: preventionEntry } = useMemo(() => {
    return restricted22Service.lookupPrevention(
      crop || guidance.crop,
      diseaseName || guidance.name
    );
  }, [crop, guidance.crop, diseaseName, guidance.name]);

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
          {diseaseName || (language === 'ml' ? guidance.nameMl : guidance.name)}
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

          {/* Section 2: Chemical Caution Card */}
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

          {/* Section 3: Indicative Costs */}
          <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-editorial text-base font-bold text-[#162a45]">
                {t.cost_heading}
              </h4>
              <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider">
                Indicative
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-[#f1f0e9]">
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

          {/* Contextual Schemes Action Banner */}
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

      {/* Main Tab Content: Prevention (Curated from Restricted_22_Class_Prevention_KB.json) */}
      {activeTab === 'prevention' && (
        <div className="mt-5 space-y-4">
          {preventionEntry ? (
            <>
              {/* Core Prevention measures */}
              <div className="bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-[#f1f0e9]">
                  <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                  <span className="text-xs font-bold text-[#162a45] uppercase tracking-wide">
                    {language === 'ml' ? 'പ്രതിരോധ നടപടികൾ' : 'Prevention Protocol'}
                  </span>
                </div>

                <ul className="space-y-2">
                  {preventionEntry.prevention.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-[#162a45] leading-relaxed p-1"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Local Prevention */}
              {preventionEntry.local_prevention &&
                preventionEntry.local_prevention.length > 0 && (
                  <div className="bg-[#f0f7f2] border border-[#cbe8d2] rounded-3xl p-4 text-[#1a512b]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin className="w-4 h-4 text-[#16a34a]" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {language === 'ml'
                          ? 'പ്രാദേശിക മുൻകരുതൽ (Local tip)'
                          : 'Regional Prevention Tip'}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {preventionEntry.local_prevention.map((localItem, idx) => (
                        <li key={idx} className="text-xs text-[#285f39] leading-relaxed">
                          • {localItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs text-[#64748b] leading-relaxed">
                Prevention guidance for this prediction is not available in the current knowledge base.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Crop Price Prediction Section */}
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
            Indicative
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-[#f1f0e9] space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന ശരാശരി വില:' : 'Current / expected mandi price:'}
            </span>
            <div className="text-right">
              <span className="font-editorial text-2xl font-bold text-[#162a45]">
                ₹32
              </span>
              <span className="text-xs font-medium text-[#64748b]"> / kg</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'വിപണി പ്രവണത (Trend):' : 'Market trend:'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span>↑</span>
              <span>{language === 'ml' ? 'വർദ്ധിക്കുന്നു (Rising)' : 'Rising (+12%)'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748b]">
              {language === 'ml' ? 'വിപണി നിരക്ക് പരിധി:' : 'Indicative market range:'}
            </span>
            <span className="text-xs font-bold text-[#162a45]">
              ₹26 – ₹38 / kg
            </span>
          </div>
        </div>
      </div>

      {/* Guidance Disclaimer */}
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
