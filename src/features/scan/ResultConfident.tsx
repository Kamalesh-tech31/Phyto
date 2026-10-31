import React, { useState } from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { t } from '../../services/i18n';
import { LeafGraphic } from '../../components/LeafGraphic';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bug,
  ArrowRight,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  restricted22Service,
  STATE_OPTIONS,
} from '../../services/restricted22Service';
import {
  FieldDamageRange,
  SchemeCardDisplay,
  SupportedState,
} from '../../types/restricted_22';

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
  const [selectedState, setSelectedState] = useState<SupportedState>(() =>
    restricted22Service.getSavedState()
  );
  const [fieldDamage, setFieldDamage] = useState<FieldDamageRange>('');
  const [expandedGates, setExpandedGates] = useState<Record<string, boolean>>({});
  const [offlineNoticeSchemeId, setOfflineNoticeSchemeId] = useState<string | null>(null);

  const handleStateChange = (newState: SupportedState) => {
    setSelectedState(newState);
    restricted22Service.saveState(newState);
  };

  const handleToggleFieldDamage = (dmg: FieldDamageRange) => {
    setFieldDamage((prev) => (prev === dmg ? '' : dmg));
  };

  const handleOpenLink = (schemeId: string, url?: string) => {
    if (!url) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOfflineNoticeSchemeId(schemeId);
      setTimeout(() => {
        setOfflineNoticeSchemeId((curr) => (curr === schemeId ? null : curr));
      }, 5000);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Evaluate schemes dynamically based on current prediction, state, and damage choice
  const schemesResult = restricted22Service.evaluateSchemes({
    crop: prediction.crop,
    diseaseIdOrName: prediction.diseaseName || prediction.diseaseId,
    modelSeverity: prediction.severity,
    selectedState,
    fieldDamageRange: fieldDamage,
  });

  // Healthy gate & uncertain filter
  const hasRelatedSchemes =
    prediction.diseaseId !== 'healthy' &&
    !prediction.isUncertain &&
    schemesResult.totalCount > 0;

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

  const renderSchemeCard = (card: SchemeCardDisplay) => {
    const isGatesOpen = Boolean(expandedGates[card.scheme_id]);

    return (
      <div key={card.scheme_id} className="retro-card p-4 space-y-2">
        {/* Top: Jurisdiction & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
            {card.jurisdiction}
          </span>
          {card.isRelevantNow ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)]">
              {t('relevant_now', undefined, language)}
            </span>
          ) : card.group === 'crop_loss' ? (
            <span className="text-[10px] text-[var(--color-muted)] font-medium">
              {t('requires_severe_loss', undefined, language)}
            </span>
          ) : null}
        </div>

        {/* Name */}
        <h5 className="font-editorial text-base font-bold text-[var(--color-ink)] leading-snug">
          {card.scheme_name}
        </h5>

        {/* Why relevant */}
        <p className="text-xs text-[var(--color-ink)] leading-relaxed">
          {card.why_relevant}
        </p>

        {/* Collapsible hard gates */}
        {card.hard_gates && card.hard_gates.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() =>
                setExpandedGates((prev) => ({
                  ...prev,
                  [card.scheme_id]: !prev[card.scheme_id],
                }))
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline retro-focus"
            >
              <span>
                {t('scheme_conditions', undefined, language)} ({card.hard_gates.length})
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isGatesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isGatesOpen && (
              <ul className="mt-2 space-y-1.5 pl-2 border-l-2 border-[var(--color-divider)]">
                {card.hard_gates.map((gate, i) => (
                  <li
                    key={i}
                    className="text-xs text-[var(--color-muted)] leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="text-[var(--color-primary)] font-bold">•</span>
                    <span>{gate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Important warning */}
        {card.important_warning && (
          <div className="mt-2 p-2.5 bg-[var(--color-inset)] border border-[var(--color-outline)] rounded-[10px] text-[11px] text-[var(--color-muted)] leading-relaxed">
            <strong className="text-[var(--color-ink)]">Note: </strong>
            {card.important_warning}
          </div>
        )}

        {/* Official Link Button (if available) */}
        {card.official_link && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenLink(card.scheme_id, card.official_link)}
              className="retro-btn-surface py-2 px-3 text-xs font-bold inline-flex items-center gap-1.5 retro-focus"
            >
              <span>{t('official_site', undefined, language)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Offline Notice banner if tapped while offline */}
        {offlineNoticeSchemeId === card.scheme_id && (
          <div className="mt-2 text-[11px] font-medium text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] p-2 rounded-[8px] border border-[var(--color-outline)]">
            {t('scheme_offline_notice', undefined, language)}
          </div>
        )}
      </div>
    );
  };

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
        <div className="w-20 h-20 bg-[var(--color-vf-bg)] border border-[var(--color-outline)] rounded-[10px] overflow-hidden shrink-0">
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

      {/* 5. Related Schemes Action Button with Expandable Panel */}
      {hasRelatedSchemes && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsSchemesExpanded(!isSchemesExpanded)}
            aria-expanded={isSchemesExpanded}
            aria-controls="related-schemes-panel"
            className="w-full min-h-[52px] py-3.5 px-4 retro-btn-secondary text-sm flex items-center justify-center gap-2 retro-focus"
          >
            <span>{t('related_schemes', undefined, language)}</span>
            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0">
              {schemesResult.totalCount}
            </span>
            <ChevronDown
              className={`w-4 h-4 stroke-[2.2] transition-transform duration-200 ${
                isSchemesExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Expandable Panel */}
          {isSchemesExpanded && (
            <div
              id="related-schemes-panel"
              className="mt-3 retro-card p-4 space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 retro-divider">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                  <h4 className="font-editorial text-lg font-bold text-[var(--color-ink)]">
                    {t('schemes_section_title', undefined, language)}
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)]">
                  {schemesResult.totalCount}
                </span>
              </div>

              {/* State Selector Control (Retro Dropdown Style) */}
              <div>
                <label className="text-xs font-bold text-[var(--color-ink)] block mb-1.5">
                  {t('schemes_state_label', undefined, language)}
                </label>
                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value as SupportedState)}
                    className="w-full min-h-[46px] px-3.5 py-2.5 bg-[var(--color-inset)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] rounded-[12px] text-xs font-bold text-[var(--color-ink)] appearance-none cursor-pointer retro-focus pr-10"
                  >
                    <option value="">
                      {t('schemes_select_state_prompt', undefined, language)}
                    </option>
                    {STATE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {t(opt.labelKey, undefined, language) || opt.defaultLabel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--color-ink)] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* State selection advisory / fallback note */}
              {!selectedState ? (
                <div className="p-3 bg-[var(--color-inset)] border border-[var(--color-outline)] rounded-[10px] text-xs text-[var(--color-muted)] leading-relaxed">
                  {t('schemes_select_state_prompt', undefined, language)}
                </div>
              ) : selectedState !== 'OTHER' && !schemesResult.hasStateSpecificSchemes ? (
                <div className="p-3 bg-[var(--color-inset)] border border-[var(--color-outline)] rounded-[10px] text-xs text-[var(--color-muted)] leading-relaxed">
                  {t('no_state_schemes_note', undefined, language)}
                </div>
              ) : null}

              {/* Field Damage Step Choice (Optional) */}
              <div>
                <label className="text-xs font-bold text-[var(--color-ink)] block mb-1.5">
                  {t('schemes_field_damage_label', undefined, language)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { range: '<25%' as FieldDamageRange, key: 'damage_under_25' },
                    { range: '25-50%' as FieldDamageRange, key: 'damage_25_to_50' },
                    { range: '>50%' as FieldDamageRange, key: 'damage_over_50' },
                    { range: '>70%' as FieldDamageRange, key: 'damage_over_70' },
                  ].map((item) => {
                    const isSelected = fieldDamage === item.range;
                    return (
                      <button
                        key={item.range}
                        type="button"
                        onClick={() => handleToggleFieldDamage(item.range)}
                        className={`min-h-[40px] px-2.5 py-2 text-xs rounded-[10px] border-[1.5px] border-[var(--color-outline)] transition-all flex items-center justify-center text-center font-bold retro-focus ${
                          isSelected
                            ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)]'
                            : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                        }`}
                      >
                        {t(item.key, undefined, language)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group 1: Support for this crop */}
              {schemesResult.cropSupportSchemes.length > 0 && (
                <div className="space-y-3 pt-1">
                  <h5 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                    {t('schemes_crop_support_group', undefined, language)}
                  </h5>
                  <div className="space-y-3">
                    {schemesResult.cropSupportSchemes.map(renderSchemeCard)}
                  </div>
                </div>
              )}

              {/* Group 2: If you suffer crop loss */}
              {schemesResult.cropLossSchemes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h5 className="text-xs font-bold text-[var(--color-warning-text)] uppercase tracking-wider">
                    {t('schemes_loss_group', undefined, language)}
                  </h5>
                  <div className="space-y-3">
                    {schemesResult.cropLossSchemes.map(renderSchemeCard)}
                  </div>
                </div>
              )}

              {/* General Disclaimer */}
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed text-center pt-2 border-t-[1.5px] border-dashed border-[var(--color-divider)]">
                {t('scheme_disclaimer', undefined, language)}
              </p>
            </div>
          )}
        </div>
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
