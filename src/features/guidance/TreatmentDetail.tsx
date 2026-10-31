import React, { useState } from 'react';
import { DiseaseGuidance, DiseaseId, Language } from '../../types';
import { translations } from '../../data/translations';
import { t as translate } from '../../services/i18n';
import diseasesData from '../../data/diseases.json';
import { restricted22Service } from '../../services/restricted22Service';
import {
  ChevronLeft,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface TreatmentDetailProps {
  diseaseId: DiseaseId;
  crop?: string;
  diseaseName?: string;
  language: Language;
  onBack: () => void;
  onNavigateToSchemes?: () => void;
}

export const TreatmentDetail: React.FC<TreatmentDetailProps> = ({
  diseaseId,
  crop,
  diseaseName,
  language,
  onBack,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'treatment' | 'prevention'>('treatment');

  const isGrape = Boolean(
    (crop && crop.toLowerCase() === 'grape') ||
    (diseaseId && diseaseId.startsWith('grape_'))
  );

  // Find disease guidance data if available (e.g. for tomato early/late blight)
  const guidance: DiseaseGuidance | undefined = diseasesData.find((d) => d.id === diseaseId) as
    | DiseaseGuidance
    | undefined;

  // Look up class-specific prevention guidance from Ashwin's frozen 22-class KB
  const preventionResult = restricted22Service.lookupPrevention(
    crop || (guidance ? guidance.crop : undefined),
    diseaseName || (guidance ? guidance.name : undefined),
    language
  );

  const displayTitle =
    diseaseName ||
    (guidance ? (language === 'ml' ? guidance.nameMl : guidance.name) : (language === 'ml' ? 'വിവരങ്ങൾ' : 'Details'));

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Disease Name */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-[var(--color-ink)] hover:opacity-75 transition-opacity rounded-xl retro-focus"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
          {displayTitle}
        </h2>
      </div>

      {/* Segmented Toggle: Treatment | Prevention */}
      <div className="mt-2 retro-inset p-1 flex items-center">
        <button
          onClick={() => setActiveTab('treatment')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all retro-focus ${
            activeTab === 'treatment'
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] rounded-[10px]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-[10px]'
          }`}
        >
          {t.tab_treatment}
        </button>
        <button
          onClick={() => setActiveTab('prevention')}
          className={`flex-1 py-2.5 text-sm font-bold transition-all retro-focus ${
            activeTab === 'prevention'
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] rounded-[10px]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-[10px]'
          }`}
        >
          {t.tab_prevention}
        </button>
      </div>

      {/* Main Tab Content: Treatment */}
      {activeTab === 'treatment' && (
        <div className="mt-5 space-y-4">
          {isGrape ? (
            /* Grape Coming Soon Card */
            <div className="retro-card p-6 text-center space-y-3 bg-[var(--color-warning-bg)]/20 border-2 border-[var(--color-outline)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[var(--color-ink)]">
                {translate('grape_coming_soon_title', undefined, language)}
              </h3>
              <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed">
                {translate('grape_coming_soon_desc', undefined, language)}
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-ink)]">
                  {translate('grape_no_healthy_note', undefined, language)}
                </span>
              </div>
            </div>
          ) : guidance ? (
            /* Structured Organic Treatments */
            <>
              <div>
                <h3
                  className={`text-xs font-bold text-[var(--color-primary)] mb-2 ${
                    language === 'en' ? 'uppercase tracking-wider' : ''
                  }`}
                >
                  {t.heading_organic}
                </h3>

                <div className="retro-card p-2 divide-y-[1.5px] divide-dashed divide-[var(--color-divider)]">
                  {guidance.organicTreatments.map((step) => (
                    <div key={step.step} className="flex items-start gap-3.5 p-3.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step.step}
                      </div>
                      <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
                        {language === 'ml' ? step.textMl : step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chemical Caution Card */}
              <div>
                <h3
                  className={`text-xs font-bold text-[var(--color-warning-text)] mb-2 ${
                    language === 'en' ? 'uppercase tracking-wider' : ''
                  }`}
                >
                  {t.heading_chemical}
                </h3>

                <div className="bg-[var(--color-warning-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] p-4 text-[var(--color-warning-text)]">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold leading-snug">
                        {language === 'ml'
                          ? guidance.chemicalCaution.headlineMl
                          : guidance.chemicalCaution.headline}
                      </p>
                      <p className="text-xs text-[var(--color-warning-text)] opacity-90 leading-relaxed font-medium">
                        {language === 'ml'
                          ? guidance.chemicalCaution.cautionMl
                          : guidance.chemicalCaution.caution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="retro-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-editorial text-base font-bold text-[var(--color-ink)]">
                    {t.cost_heading}
                  </h4>
                  <span
                    className={`px-2 py-0.5 bg-[var(--color-inset)] text-[var(--color-muted)] border border-[var(--color-outline)] text-[10px] font-bold rounded-full ${
                      language === 'en' ? 'uppercase tracking-wider' : ''
                    }`}
                  >
                    Demo data
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t-[1.5px] border-dashed border-[var(--color-divider)]">
                  <div>
                    <span className="text-xs text-[var(--color-muted)] block font-medium">
                      {t.cost_average}
                    </span>
                    <span className="font-editorial text-2xl font-bold text-[var(--color-ink)] mt-0.5 block">
                      {guidance.costEstimate.avgPrice}
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {language === 'ml'
                        ? guidance.costEstimate.unitMl
                        : guidance.costEstimate.unit}
                    </span>
                  </div>

                  <div className="border-l-[1.5px] border-dashed border-[var(--color-divider)] pl-4">
                    <span className="text-xs text-[var(--color-muted)] block font-medium">
                      {t.cost_govt}
                    </span>
                    <span className="font-editorial text-2xl font-bold text-[var(--color-ink)] mt-0.5 block">
                      {guidance.costEstimate.govtPrice}
                    </span>
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {t.cost_subtext}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Non-Grape class without specific chemical treatment card in diseases.json */
            <div className="retro-card p-6 text-center space-y-3 bg-[var(--color-surface)] border-2 border-[var(--color-outline)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-selected-bg)] text-[var(--color-primary)] border border-[var(--color-outline)] flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-lg font-bold text-[var(--color-ink)]">
                {displayTitle}
              </h3>
              <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed">
                {translate('treatment_curating_note', undefined, language)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Tab Content: Prevention */}
      {activeTab === 'prevention' && (
        <div className="mt-5 space-y-4">
          {isGrape ? (
            /* Grape Coming Soon Card for Prevention Tab */
            <div className="retro-card p-6 text-center space-y-3 bg-[var(--color-warning-bg)]/20 border-2 border-[var(--color-outline)]">
              <div className="w-12 h-12 mx-auto rounded-full bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-[var(--color-ink)]">
                {translate('grape_coming_soon_title', undefined, language)}
              </h3>
              <p className="text-xs text-[var(--color-muted)] max-w-xs mx-auto leading-relaxed">
                {translate('grape_coming_soon_desc', undefined, language)}
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-ink)]">
                  {translate('grape_no_healthy_note', undefined, language)}
                </span>
              </div>
            </div>
          ) : (
            <>
              {preventionResult.isFallbackEnglish && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-[var(--color-muted)]">
                    {translate('prevention_title', undefined, language)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-inset)] text-[var(--color-muted)] border border-[var(--color-outline)]">
                    {translate('shown_in_english', undefined, language)}
                  </span>
                </div>
              )}

              {preventionResult.entry && preventionResult.entry.prevention.length > 0 ? (
                <div className="retro-card p-2 divide-y-[1.5px] divide-dashed divide-[var(--color-divider)]">
                  {preventionResult.entry.prevention.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 p-3.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="retro-card p-4 text-center">
                  <p className="text-xs font-medium text-[var(--color-muted)]">
                    {translate('no_guidance_available', undefined, language)}
                  </p>
                </div>
              )}

              {preventionResult.entry?.local_prevention && preventionResult.entry.local_prevention.length > 0 && (
                <div className="bg-[var(--color-selected-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] p-4 text-[var(--color-selected-text)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className={`text-xs font-bold ${language === 'en' ? 'uppercase tracking-wider' : ''}`}>
                      {translate('local_tip_label', undefined, language)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-selected-text)] leading-relaxed font-medium">
                    {preventionResult.entry.local_prevention.join(' ')}
                  </p>
                </div>
              )}

              {preventionResult.entry?.sources && preventionResult.entry.sources.length > 0 && (
                <div className="px-1 text-[11px] text-[var(--color-muted)]">
                  <span className="font-semibold block mb-1">
                    {translate('sources_label', undefined, language)}:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {preventionResult.entry.sources.map((src, idx) => (
                      <li key={idx} className="break-all">{src}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Crop Price Prediction Section */}
      <div className="mt-5 retro-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--color-selected-bg)] border border-[var(--color-outline)] flex items-center justify-center text-[var(--color-selected-text)]">
              <TrendingUp className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h4 className="font-editorial text-lg font-bold text-[var(--color-ink)]">
              {language === 'ml' ? 'വിള വില അനുമാനം' : 'Crop price outlook'}
            </h4>
          </div>
          <span
            className={`px-2 py-0.5 bg-[var(--color-inset)] text-[var(--color-muted)] border border-[var(--color-outline)] text-[10px] font-bold rounded-full ${
              language === 'en' ? 'uppercase tracking-wider' : ''
            }`}
          >
            Demo data
          </span>
        </div>

        <div className="mt-3 pt-3 border-t-[1.5px] border-dashed border-[var(--color-divider)] space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {language === 'ml' ? 'പ്രതീക്ഷിക്കുന്ന തക്കാളി വില:' : 'Current / expected tomato price:'}
            </span>
            <div className="text-right">
              <span className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
                ₹32
              </span>
              <span className="text-xs font-medium text-[var(--color-muted)]"> / kg</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {language === 'ml' ? 'വിപണി പ്രവണത (Trend):' : 'Market trend:'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)]">
              <span>↑</span>
              <span>{language === 'ml' ? 'വർദ്ധിക്കുന്നു (Rising)' : 'Rising (+12%)'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {language === 'ml' ? 'വിപണി നിരക്ക് പരിധി:' : 'Indicative market range:'}
            </span>
            <span className="text-xs font-bold text-[var(--color-ink)]">
              ₹26 – ₹38 / kg
            </span>
          </div>

          <p className="text-[11px] text-[var(--color-muted)] pt-1 leading-normal">
            {language === 'ml'
              ? 'പ്രാദേശിക കാർഷിക മൊത്തവ്യാപാര മാർക്കറ്റുകളിലെ ശരാശരി വില നിലവാരം. (മാതൃകാ ഡാറ്റ)'
              : 'Indicative mandi rate based on regional vegetable arrivals. (Demo estimation)'}
          </p>
        </div>
      </div>

      {/* Sample Content Disclaimer */}
      <p className="text-xs text-[var(--color-muted)] mt-4 px-1 leading-relaxed">
        {t.guidance_disclaimer}
      </p>

      {/* Return to Result Button */}
      <div className="mt-5">
        <button
          onClick={onBack}
          className="w-full min-h-[48px] py-3.5 px-4 retro-btn-surface text-sm text-center retro-focus"
        >
          {language === 'ml' ? '← ഫലത്തിലേക്ക് മടങ്ങുക' : '← Back to Result'}
        </button>
      </div>
    </div>
  );
};
