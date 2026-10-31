import React, { useState } from 'react';
import { Language, PredictionResult, SchemeItem } from '../../types';
import { translations } from '../../data/translations';
import { t as translate } from '../../services/i18n';
import schemesData from '../../data/schemes.json';
import { LeafGraphic } from '../../components/LeafGraphic';
import {
  ExternalLink,
  CheckCircle,
  FileText,
  AlertCircle,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import {
  restricted22Service,
  STATE_OPTIONS,
} from '../../services/restricted22Service';
import {
  SchemeCardDisplay,
  SupportedState,
} from '../../types/restricted_22';

interface SchemesListProps {
  prediction?: PredictionResult | null;
  language: Language;
  isOnline: boolean;
  onBack?: () => void;
  highlightSchemeId?: string;
}

export const SchemesList: React.FC<SchemesListProps> = ({
  prediction,
  language,
  isOnline,
  onBack,
  highlightSchemeId,
}) => {
  const t = translations[language];
  const [selectedState, setSelectedState] = useState<SupportedState>(() =>
    restricted22Service.getSavedState()
  );
  const [expandedGates, setExpandedGates] = useState<Record<string, boolean>>({});
  const [offlineToast, setOfflineToast] = useState(false);
  const [offlineNoticeSchemeId, setOfflineNoticeSchemeId] = useState<string | null>(null);

  // Fallback filter for general legacy view when no diagnosis prediction exists
  const [legacyFilter, setLegacyFilter] = useState<'all' | 'subsidy' | 'insurance'>('all');

  const handleStateChange = (newState: SupportedState) => {
    setSelectedState(newState);
    restricted22Service.saveState(newState);
  };

  const handleOpenLink = (schemeId: string, url?: string) => {
    if (!url) return;
    if (!isOnline) {
      setOfflineNoticeSchemeId(schemeId);
      setOfflineToast(true);
      setTimeout(() => {
        setOfflineNoticeSchemeId((curr) => (curr === schemeId ? null : curr));
        setOfflineToast(false);
      }, 4000);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Evaluate dynamic schemes if prediction is present
  const schemesResult = prediction
    ? restricted22Service.evaluateSchemes({
        crop: prediction.crop,
        diseaseIdOrName: prediction.diseaseName || prediction.diseaseId,
        modelSeverity: prediction.severity,
        selectedState,
      })
    : null;

  const renderContextualSchemeCard = (card: SchemeCardDisplay) => {
    const isGatesOpen = Boolean(expandedGates[card.scheme_id]);

    return (
      <div key={card.scheme_id} className="retro-card p-5 space-y-3">
        {/* Top Header: Jurisdiction & Relevance Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">
            {card.jurisdiction}
          </span>
          {card.isRelevantNow ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)]">
              {translate('relevant_now', undefined, language)}
            </span>
          ) : card.group === 'crop_loss' ? (
            <span className="text-[11px] text-[var(--color-muted)] font-medium">
              {translate('requires_severe_loss', undefined, language)}
            </span>
          ) : null}
        </div>

        {/* Scheme Title */}
        <h3 className="font-editorial text-xl font-bold text-[var(--color-ink)] leading-snug">
          {card.scheme_name}
        </h3>

        {/* Why Relevant Section */}
        <div className="p-3.5 retro-inset">
          <div className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1">
            {language === 'ml' ? 'എന്തുകൊണ്ട് ഈ പദ്ധതി പ്രസക്തമാണ്' : 'Why this scheme is relevant'}
          </div>
          <p className="text-xs font-medium text-[var(--color-ink)] leading-relaxed">
            {card.why_relevant}
          </p>
        </div>

        {/* Conditions to Meet (Hard Gates) */}
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
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-[var(--color-primary)] retro-focus"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <span>
                  {translate('scheme_conditions', undefined, language)} ({card.hard_gates.length})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isGatesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isGatesOpen && (
              <ul className="mt-2 space-y-2 pl-3 border-l-2 border-[var(--color-primary)]/40">
                {card.hard_gates.map((gate, i) => (
                  <li
                    key={i}
                    className="text-xs text-[var(--color-ink)] leading-relaxed font-medium flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                    <span>{gate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Important Warning Notice */}
        {card.important_warning && (
          <div className="p-3 bg-[var(--color-inset)] border border-[var(--color-outline)] rounded-[12px] text-xs text-[var(--color-muted)] leading-relaxed">
            <strong className="text-[var(--color-ink)]">
              {language === 'ml' ? 'ശ്രദ്ധിക്കുക: ' : 'Important Notice: '}
            </strong>
            {card.important_warning}
          </div>
        )}

        {/* Action Button: Official Portal */}
        {card.official_link && (
          <div className="pt-2 border-t-[1.5px] border-dashed border-[var(--color-divider)] flex items-center justify-between gap-3">
            <span className="text-[11px] text-[var(--color-muted)] font-medium">
              {language === 'ml' ? 'ഔദ്യോഗിക പോർട്ടൽ' : 'Official Portal'}
            </span>
            <button
              type="button"
              onClick={() => handleOpenLink(card.scheme_id, card.official_link)}
              className="px-4 py-2 retro-btn-primary text-xs font-bold flex items-center gap-1.5 retro-focus"
            >
              <span>{translate('official_site', undefined, language)}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Offline Notification */}
        {offlineNoticeSchemeId === card.scheme_id && (
          <div className="p-3 bg-[var(--color-warning-bg)] border border-[var(--color-outline)] rounded-[10px] text-xs text-[var(--color-warning-text)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{translate('scheme_offline_notice', undefined, language)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col px-5 pt-2 pb-36 max-w-md mx-auto">
      {/* Top Header with Back button and Title */}
      <div className="flex items-center gap-3 py-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-[var(--color-ink)] hover:opacity-75 transition-opacity rounded-xl retro-focus"
            aria-label="Back"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2]" />
          </button>
        )}
        <div>
          <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)] leading-tight">
            {translate('schemes_section_title', undefined, language)}
          </h2>
        </div>
      </div>

      {/* Offline Toast Notification Banner */}
      {offlineToast && (
        <div className="mb-4 p-3.5 bg-[var(--color-warning-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] flex items-start gap-2 text-xs text-[var(--color-warning-text)]">
          <AlertCircle className="w-4 h-4 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
          <span className="font-medium">{t.portal_offline_warning}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CASE A: CONTEXTUAL VIEW (Navigated from leaf diagnosis)       */}
      {/* ------------------------------------------------------------- */}
      {prediction && schemesResult ? (
        <div className="space-y-4 mt-2">
          {/* Leaf Diagnosis Summary Badge Card */}
          <div className="retro-card p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-[10px] bg-[var(--color-vf-bg)] border border-[var(--color-outline)] overflow-hidden shrink-0">
                <LeafGraphic
                  imageUrl={prediction.imageUrl}
                  variant={prediction.diseaseId as any}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-[var(--color-muted)] truncate block">
                  {language === 'ml' ? prediction.cropMl : prediction.crop}
                </span>
                <h3 className="font-editorial text-lg font-bold text-[var(--color-ink)] leading-tight truncate">
                  {language === 'ml' ? prediction.diseaseNameMl : prediction.diseaseName}
                </h3>
                <span className="inline-block mt-0.5 px-2 py-0.2 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)] rounded-full text-[10px] font-bold">
                  {language === 'ml' ? prediction.categoryMl : prediction.category}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] shadow-[1px_1px_0_var(--color-shadow-color)]">
                {schemesResult.totalCount} {schemesResult.totalCount === 1 ? 'Scheme' : 'Schemes'}
              </span>
            </div>
          </div>

          {/* State Selector Control (Retro Dropdown Style) */}
          <div className="retro-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <label className="text-xs font-bold text-[var(--color-ink)]">
                {translate('schemes_state_label', undefined, language)}
              </label>
            </div>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value as SupportedState)}
                className="w-full min-h-[46px] px-3.5 py-2.5 bg-[var(--color-inset)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] rounded-[12px] text-xs font-bold text-[var(--color-ink)] appearance-none cursor-pointer retro-focus pr-10"
              >
                <option value="">
                  {translate('schemes_select_state_prompt', undefined, language)}
                </option>
                {STATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {translate(opt.labelKey, undefined, language) || opt.defaultLabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--color-ink)] pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* State selection advisory notes */}
            {!selectedState ? (
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed pt-1">
                {translate('schemes_select_state_prompt', undefined, language)}
              </p>
            ) : selectedState !== 'OTHER' && !schemesResult.hasStateSpecificSchemes ? (
              <p className="text-[11px] text-[var(--color-muted)] leading-relaxed pt-1">
                {translate('no_state_schemes_note', undefined, language)}
              </p>
            ) : null}
          </div>

          {/* Group 1: Support for this crop */}
          {schemesResult.cropSupportSchemes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  {translate('schemes_crop_support_group', undefined, language)}
                </h4>
                <span className="text-xs font-bold text-[var(--color-muted)]">
                  {schemesResult.cropSupportSchemes.length}
                </span>
              </div>
              <div className="space-y-3">
                {schemesResult.cropSupportSchemes.map(renderContextualSchemeCard)}
              </div>
            </div>
          )}

          {/* Group 2: If you suffer crop loss */}
          {schemesResult.cropLossSchemes.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-[var(--color-warning-text)] uppercase tracking-wider">
                  {translate('schemes_loss_group', undefined, language)}
                </h4>
                <span className="text-xs font-bold text-[var(--color-muted)]">
                  {schemesResult.cropLossSchemes.length}
                </span>
              </div>
              <div className="space-y-3">
                {schemesResult.cropLossSchemes.map(renderContextualSchemeCard)}
              </div>
            </div>
          )}

          {/* Conservative Official Verification Disclaimer */}
          <p className="text-[11px] text-[var(--color-muted)] leading-relaxed text-center px-2 pt-4 border-t-[1.5px] border-dashed border-[var(--color-divider)]">
            {translate('scheme_disclaimer', undefined, language)}
          </p>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* CASE B: GENERAL CATALOG VIEW (Opened from Settings or standalone) */
        /* ------------------------------------------------------------- */
        <div className="space-y-4 mt-2">
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            {t.schemes_header_desc}
          </p>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {(['all', 'subsidy', 'insurance'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setLegacyFilter(mode)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all retro-focus ${
                  legacyFilter === mode
                    ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] shadow-[2px_2px_0_var(--color-shadow-color)]'
                    : 'bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                {mode === 'all'
                  ? t.schemes_filter_all
                  : mode === 'subsidy'
                  ? t.schemes_filter_subsidy
                  : t.schemes_filter_insurance}
              </button>
            ))}
          </div>

          {/* Schemes Cards List */}
          <div className="space-y-4">
            {(schemesData as SchemeItem[])
              .filter((s) => {
                if (highlightSchemeId && s.id === highlightSchemeId) return true;
                if (legacyFilter === 'subsidy')
                  return s.id.includes('subhiksha') || s.id.includes('micro') || s.id.includes('kisan');
                if (legacyFilter === 'insurance') return s.id.includes('insurance');
                return true;
              })
              .map((scheme) => (
                <div key={scheme.id} className="retro-card p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] rounded-full text-[11px] font-bold">
                      {language === 'ml' ? scheme.tagMl : scheme.tag}
                    </span>
                  </div>

                  <h3 className="font-editorial text-xl font-bold text-[var(--color-ink)] leading-snug">
                    {language === 'ml' ? scheme.nameMl : scheme.name}
                  </h3>

                  <div className="p-3.5 retro-inset">
                    <div className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-0.5">
                      {language === 'ml' ? 'പ്രധാന നേട്ടം' : 'Core Benefit'}
                    </div>
                    <p className="text-xs font-bold text-[var(--color-ink)] leading-relaxed">
                      {language === 'ml' ? scheme.benefitMl : scheme.benefit}
                    </p>
                  </div>

                  <div className="pt-2 border-t-[1.5px] border-dashed border-[var(--color-divider)] flex items-center justify-between gap-3">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {scheme.lastUpdated}
                    </span>
                    <button
                      onClick={() => handleOpenLink(scheme.id, scheme.officialUrl)}
                      className="px-4 py-2 retro-btn-primary text-xs font-bold flex items-center gap-1.5 retro-focus"
                    >
                      <span>{t.btn_open_portal}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
