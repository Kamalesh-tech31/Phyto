import React, { useState } from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { t } from '../../services/i18n';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, ChevronRight, ChevronDown, Bug, ArrowRight } from 'lucide-react';

interface ResultConfidentProps {
  prediction: PredictionResult;
  language: Language;
  onBack: () => void;
  onSeeTreatment: () => void;
  onViewRelatedScheme?: () => void;
  onPestClick?: () => void;
}

export const ResultConfident: React.FC<ResultConfidentProps> = ({
  prediction,
  language,
  onBack,
  onSeeTreatment,
  onViewRelatedScheme,
}) => {
  const trans = translations[language];
  const [showPestModal, setShowPestModal] = useState(false);
  const [isSchemesExpanded, setIsSchemesExpanded] = useState(false);

  // Check if there are related schemes for the diagnosis
  const hasRelatedSchemes = prediction.diseaseId !== 'healthy' && !prediction.isUncertain;

  // Severity 3-segment progress bar helper with 1.5px outline
  const getSeverityBars = () => {
    if (prediction.severity === 'severe') {
      return {
        mild: 'bg-[var(--color-severity-mild)]',
        moderate: 'bg-[var(--color-severity-moderate)]',
        severe: 'bg-[var(--color-severity-severe)]',
      };
    }
    if (prediction.severity === 'moderate') {
      return {
        mild: 'bg-[var(--color-severity-mild)]',
        moderate: 'bg-[var(--color-severity-moderate)]',
        severe: 'bg-[var(--color-inset)]',
      };
    }
    // Mild
    return {
      mild: 'bg-[var(--color-severity-mild)]',
      moderate: 'bg-[var(--color-inset)]',
      severe: 'bg-[var(--color-inset)]',
    };
  };

  const severityBars = getSeverityBars();

  return (
    <div className="flex flex-col px-5 pt-2 pb-36 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-[var(--color-ink)] hover:opacity-75 transition-opacity rounded-xl retro-focus"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
          {trans.result_title}
        </h2>
      </div>

      {/* 1. Card 1: Disease Identity & Leaf Thumbnail */}
      <div className="mt-2 retro-card p-4 flex items-center gap-4">
        {/* Leaf square thumbnail */}
        <div className="w-20 h-20 bg-[#141C16] border border-[var(--color-outline)] rounded-[10px] overflow-hidden shrink-0">
          <LeafGraphic
            imageUrl={prediction.imageUrl}
            variant={prediction.diseaseId as any}
            className="w-full h-full"
          />
        </div>

        {/* Text details */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[var(--color-muted)]">
            {language === 'ml' ? prediction.cropMl : prediction.crop}
          </span>
          <h3 className="font-editorial text-2xl font-bold text-[var(--color-ink)] leading-tight">
            {language === 'ml' ? prediction.diseaseNameMl : prediction.diseaseName}
          </h3>
          <span className="mt-1.5 inline-block self-start px-2.5 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)] rounded-full text-xs font-bold">
            {language === 'ml' ? prediction.categoryMl : prediction.category}
          </span>
        </div>
      </div>

      {/* 2. Card 2: Confidence & Severity Breakdown */}
      <div className="mt-3.5 retro-card p-5">
        {/* Confidence Header */}
        <div className="flex items-center justify-between pb-3.5 retro-divider">
          <span className="text-sm font-bold text-[var(--color-ink)]">
            {trans.confidence_label}
          </span>
          <div className="flex items-center gap-2">
            {/* 3-bar confidence indicator */}
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="w-3.5 h-1.5 rounded-full bg-[var(--color-success-text)]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[var(--color-success-text)]" />
              <span className="w-3.5 h-1.5 rounded-full bg-[var(--color-success-text)]" />
            </div>
            <span className="px-2 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)] rounded-full text-xs font-bold">
              {trans.confidence_high}
            </span>
          </div>
        </div>

        {/* Affected Leaf Area & Severity */}
        <div className="pt-4">
          <div className="text-xs font-semibold text-[var(--color-muted)]">
            {trans.affected_area_label}
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-editorial text-4xl font-bold text-[var(--color-ink)]">
              {prediction.affectedAreaPercent}%
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border border-[var(--color-outline)] ${
                prediction.severity === 'mild'
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                  : prediction.severity === 'moderate'
                  ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                  : 'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)]'
              }`}
            >
              {prediction.severity === 'mild'
                ? trans.severity_mild
                : prediction.severity === 'moderate'
                ? trans.severity_moderate
                : trans.severity_severe}
            </span>
          </div>

          {/* 3-segment severity bar with 1.5px outline */}
          <div className="grid grid-cols-3 gap-2 mt-3.5" aria-hidden="true">
            <div className={`h-2.5 rounded-full border-[1.5px] border-[var(--color-outline)] ${severityBars.mild}`} />
            <div className={`h-2.5 rounded-full border-[1.5px] border-[var(--color-outline)] ${severityBars.moderate}`} />
            <div className={`h-2.5 rounded-full border-[1.5px] border-[var(--color-outline)] ${severityBars.severe}`} />
          </div>

          <div className="grid grid-cols-3 text-[11px] font-bold text-[var(--color-muted)] mt-1.5">
            <span>{trans.severity_mild}</span>
            <span className="text-center">{trans.severity_moderate}</span>
            <span className="text-right">{trans.severity_severe}</span>
          </div>
        </div>
      </div>

      {/* 3. Card 3: Pest Observation on Leaf ("Also found" row) */}
      {prediction.pestWarning && (
        <button
          onClick={() => setShowPestModal(true)}
          className="mt-3.5 retro-card-press p-4 flex items-center justify-between text-left retro-focus"
        >
          <div>
            <div className="text-xs text-[var(--color-muted)] font-medium">
              {trans.also_found_title}
            </div>
            <div className="text-base font-bold text-[var(--color-ink)] mt-0.5">
              {language === 'ml'
                ? prediction.pestWarning.nameMl
                : prediction.pestWarning.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] rounded-full text-xs font-bold">
              {language === 'ml'
                ? prediction.pestWarning.severityLabelMl
                : prediction.pestWarning.severityLabel}
            </span>
            <ChevronRight className="w-5 h-5 text-[var(--color-muted)]" />
          </div>
        </button>
      )}

      {/* 4. Primary Action Button: View Treatment & Prevention */}
      <button
        onClick={onSeeTreatment}
        className="mt-4 w-full min-h-[52px] py-3.5 px-4 retro-btn-primary text-sm flex items-center justify-center gap-2 retro-focus"
      >
        <span>{t('view_treatment_prevention', undefined, language)}</span>
        <ArrowRight className="w-4 h-4 stroke-[2.2]" />
      </button>

      {/* 5. Related Schemes Action Button (Secondary button with count badge & chevron) */}
      {hasRelatedSchemes && (
        <>
          <button
            type="button"
            onClick={() => setIsSchemesExpanded(!isSchemesExpanded)}
            aria-expanded={isSchemesExpanded}
            aria-controls="related-schemes-panel"
            className="mt-3 w-full min-h-[52px] py-3.5 px-4 retro-btn-secondary text-sm flex items-center justify-between retro-focus"
          >
            <div className="flex items-center gap-2">
              <span>{t('related_schemes', undefined, language)}</span>
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isSchemesExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Inline Expandable Related Schemes Panel */}
          {isSchemesExpanded && (
            <div
              id="related-schemes-panel"
              className="mt-2 retro-card p-4 transition-all"
            >
              <div className="flex items-center justify-between pb-2 retro-divider">
                <h4 className="font-editorial text-base font-bold text-[var(--color-ink)]">
                  {language === 'ml'
                    ? 'സുഭിക്ഷ കേരളം - പച്ചക്കറി വികസന പദ്ധതി'
                    : 'Vegetable Development Programme'}
                </h4>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-2 leading-relaxed">
                {language === 'ml'
                  ? 'തക്കാളി ചെടികൾക്ക് ജൈവ കുമിൾനാശിനികൾക്കും സ്പ്രേയർ ടാങ്കുകൾക്കും 50% സബ്സിഡി സഹായം.'
                  : '50% subsidy on bio-fungicides and knapsack sprayers for tomato crop protection.'}
              </p>
              {onViewRelatedScheme && (
                <button
                  type="button"
                  onClick={onViewRelatedScheme}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent-text)] hover:underline retro-focus rounded-sm"
                >
                  <span>{language === 'ml' ? 'പദ്ധതി കാണുക →' : 'View scheme →'}</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* 6. Disclaimer Text */}
      <p className="text-xs text-[var(--color-muted)] mt-4 px-1 leading-relaxed">
        {trans.disclaimer_text}
      </p>

      {/* Pest Information Modal */}
      {showPestModal && prediction.pestWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowPestModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm retro-card p-5"
          >
            <div className="flex items-center gap-2.5 text-[var(--color-ink)] mb-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-outline)] text-[var(--color-warning-text)] flex items-center justify-center shrink-0">
                <Bug className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-[var(--color-ink)]">
                {language === 'ml'
                  ? prediction.pestWarning.nameMl
                  : prediction.pestWarning.name}
              </h3>
            </div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed mt-2">
              {language === 'ml'
                ? prediction.pestWarning.detailsMl
                : prediction.pestWarning.details}
            </p>
            <div className="mt-4 p-3 bg-[var(--color-warning-bg)] border border-[var(--color-outline)] rounded-[12px] text-xs text-[var(--color-warning-text)] font-medium">
              {language === 'ml'
                ? 'പ്രതിവിധി: വേപ്പെണ്ണ മിശ്രിതം ഇലയുടെ അടിഭാഗത്ത് കൂടി തളിക്കുന്നത് മുഞ്ഞയെ ഫലപ്രദമായി നിയന്ത്രിക്കും.'
                : 'Tip: Spraying neem oil solution directly under the leaves deters aphids without harming crops.'}
            </div>
            <button
              onClick={() => setShowPestModal(false)}
              className="mt-4 w-full min-h-[44px] retro-btn-surface py-2.5 text-xs font-bold retro-focus"
            >
              {t('close', undefined, language)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
