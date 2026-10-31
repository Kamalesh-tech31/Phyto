import React from 'react';
import { Language, PredictionResult } from '../../types';
import { translations } from '../../data/translations';
import { t } from '../../services/i18n';
import { LeafGraphic } from '../../components/LeafGraphic';
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { restricted22Service } from '../../services/restricted22Service';
import classStatusData from '../../data/class_status.json';

interface ResultConfidentProps {
  prediction: PredictionResult;
  language: Language;
  onBack: () => void;
  onSeeTreatment: () => void;
  onViewRelatedScheme?: () => void;
}

export const ResultConfident: React.FC<ResultConfidentProps> = ({
  prediction,
  language,
  onBack,
  onSeeTreatment,
  onViewRelatedScheme,
}) => {
  const trans = translations[language] || translations.en;
  const selectedState = restricted22Service.getSavedState();

  const isHealthy = Boolean(
    prediction.isHealthy ||
    prediction.diseaseId === 'healthy' ||
    prediction.diseaseName.toLowerCase().includes('healthy')
  );

  const isGrape = Boolean(
    prediction.isComingSoon ||
    prediction.grapeNotice ||
    prediction.crop === 'Grape' ||
    (prediction.diseaseId && prediction.diseaseId.startsWith('grape_'))
  );

  const isPest = Boolean(
    prediction.isPest ||
    prediction.pestNotice ||
    (prediction.diseaseId && prediction.diseaseId.startsWith('pest_'))
  );

  const isAmbiguous = Boolean(
    prediction.isAmbiguous ||
    prediction.inferenceStatus === 'AMBIGUOUS'
  );

  // Softmax certainty percentage (0 - 100%)
  const certaintyPercent = Math.round(prediction.confidenceScore * 100);

  // Evaluate schemes dynamically (gate healthy, grape, and uncertain scans)
  const schemesResult = !isHealthy && !isGrape && !prediction.isUncertain
    ? restricted22Service.evaluateSchemes({
        crop: prediction.crop,
        diseaseIdOrName: prediction.diseaseName || prediction.diseaseId,
        selectedState,
      })
    : { totalCount: 0, centralCount: 0, stateCount: 0, stateShortlisted: [], centralShortlisted: [] };

  const hasRelatedSchemes = schemesResult.totalCount > 0;

  // Filter top candidates for display
  const topCandidates = prediction.topCandidates && prediction.topCandidates.length > 0
    ? prediction.topCandidates.slice(0, 3)
    : [];

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

      {/* 1. Card 1: Identity & Leaf Thumbnail */}
      <div className="mt-2 retro-card p-4 flex items-center gap-4">
        <div className="w-20 h-20 bg-[var(--color-vf-bg)] border border-[var(--color-outline)] rounded-[10px] overflow-hidden shrink-0">
          <LeafGraphic
            imageUrl={prediction.imageUrl}
            variant={prediction.diseaseId as any}
            className="w-full h-full"
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-[var(--color-muted)] truncate">
            {language === 'ml' ? prediction.cropMl : prediction.crop}
          </span>
          <h3 className="font-editorial text-2xl font-bold text-[var(--color-ink)] leading-tight truncate">
            {language === 'ml' ? prediction.diseaseNameMl : prediction.diseaseName}
          </h3>
          <span className="mt-1.5 inline-block self-start px-2.5 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)] rounded-full text-xs font-bold">
            {language === 'ml' ? prediction.categoryMl : prediction.category}
          </span>
        </div>
      </div>

      {/* Ambiguity Alert: When top1 and top2 are within 15% */}
      {isAmbiguous && prediction.secondCandidate && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-warning-bg)]/20 border-2 border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {t('could_be_either', undefined, language)}
              </h4>
              <p className="text-xs text-[var(--color-ink)] mt-1 font-medium leading-relaxed">
                1. <span className="font-bold">{language === 'ml' ? prediction.diseaseNameMl : prediction.diseaseName}</span> ({certaintyPercent}%)
                <br />
                2. <span className="font-bold">{language === 'ml' ? prediction.secondCandidate.conditionMl : prediction.secondCandidate.condition}</span> ({Math.round(prediction.secondCandidate.prob * 100)}%)
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-2 leading-relaxed">
                {t('ambiguous_advice', undefined, language)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Healthy Positive State Card */}
      {isHealthy && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-success-bg)]/20 border-2 border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[var(--color-success-text)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {t('looks_healthy_title', undefined, language)}
              </h4>
              <p className="text-xs text-[var(--color-ink)] mt-1 leading-relaxed">
                {t('looks_healthy_desc', undefined, language)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grape Coming Soon Notice */}
      {isGrape && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-warning-bg)]/30 border-[1.5px] border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {t('grape_coming_soon_title', undefined, language)}
              </h4>
              <p className="text-xs text-[var(--color-ink)] mt-1 leading-relaxed">
                {t('grape_coming_soon_desc', undefined, language)}
              </p>
              <div className="mt-2">
                <span className="inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[var(--color-surface)] border border-[var(--color-outline)] text-[var(--color-ink)]">
                  {t('grape_no_healthy_note', undefined, language)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pest Insect Visibility Notice */}
      {isPest && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-selected-bg)]/40 border-[1.5px] border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {t('pest_photo_notice_title', undefined, language)}
              </h4>
              <p className="text-xs text-[var(--color-ink)] mt-1 leading-relaxed">
                {language === 'ml'
                  ? 'കീടത്തിന്റെ ചിത്രം തന്നെ വ്യക്തമായി വേണം (needs a close-up photo of the insect).'
                  : 'Pest classes need a close-up photo of the insect itself, not just leaf damage.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Class Status Notices */}
      {prediction.modelClassName && (classStatusData as Record<string, any>)[prediction.modelClassName]?.status === 'disabled' && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-warning-bg)]/20 border-2 border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {language === 'ml' ? 'ഇതുവരെ സ്ഥിരീകരിച്ചിട്ടില്ല' : 'Not reliably supported yet'}
              </h4>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                {language === 'ml'
                  ? 'ഈ അവസ്ഥയ്ക്കുള്ള ഫീൽഡ് പരിശോധനാ ഡാറ്റ പരിമിതമാണ് (<10 ചിത്രങ്ങൾ).'
                  : 'Under 10 field validation images available. Not reliably supported yet in field conditions.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {prediction.modelClassName && (classStatusData as Record<string, any>)[prediction.modelClassName]?.status === 'limited' && (
        <div className="mt-3.5 retro-card p-4 bg-[var(--color-selected-bg)]/30 border border-[var(--color-outline)]">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-[var(--color-ink)]">
                {language === 'ml' ? 'പരിമിതമായ പിന്തുണ' : 'Limited field support'}
              </h4>
              <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                {language === 'ml'
                  ? 'ഫീൽഡ് പരിശോധനയിൽ 50-70% കൃത്യത മാത്രം.'
                  : 'Validation recall is 50-70%. Verify symptoms in person with extension staff.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Card 2: Model Certainty & Candidates Breakdown */}
      <div className="mt-3.5 retro-card p-5">
        {/* Confidence Header */}
        <div className="flex items-center justify-between pb-3.5 retro-divider">
          <span className="text-sm font-bold text-[var(--color-ink)]">
            {t('model_certainty_title', undefined, language)}
          </span>
          <div className="flex items-center gap-2">
            {/* Visual certainty dots */}
            <div className="flex items-center gap-1" aria-hidden="true">
              <span
                className={`w-3.5 h-1.5 rounded-full ${
                  prediction.confidence === 'high'
                    ? 'bg-[var(--color-success-text)]'
                    : 'bg-[var(--color-warning-text)]'
                }`}
              />
              <span
                className={`w-3.5 h-1.5 rounded-full ${
                  prediction.confidence === 'high'
                    ? 'bg-[var(--color-success-text)]'
                    : 'bg-[var(--color-warning-text)]'
                }`}
              />
              <span
                className={`w-3.5 h-1.5 rounded-full ${
                  prediction.confidence === 'high'
                    ? 'bg-[var(--color-success-text)]'
                    : 'bg-[var(--color-inset)]'
                }`}
              />
            </div>
            <span
              className={`px-2 py-0.5 border border-[var(--color-outline)] rounded-full text-xs font-bold ${
                prediction.confidence === 'high'
                  ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]'
                  : 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
              }`}
            >
              {prediction.confidence === 'high'
                ? t('certainty_high', undefined, language)
                : t('certainty_medium', undefined, language)}
            </span>
          </div>
        </div>

        {/* Softmax Certainty % */}
        <div className="pt-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs font-semibold text-[var(--color-muted)]">
                {t('model_certainty_title', undefined, language)}
              </div>
              <div className="font-editorial text-4xl font-bold text-[var(--color-ink)] mt-1">
                {certaintyPercent}%
              </div>
            </div>
          </div>

          {/* Top-3 Horizontal Candidate Bars */}
          {topCandidates.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-[var(--color-divider)]">
              <div className="text-xs font-bold text-[var(--color-muted)] mb-2.5 uppercase tracking-wide">
                {t('top_alternatives', undefined, language)}
              </div>
              <div className="space-y-2.5">
                {topCandidates.map((cand, idx) => {
                  const candProbPct = Math.round(cand.prob * 100);
                  const isTop = idx === 0;
                  return (
                    <div key={cand.label} className="flex flex-col text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`truncate max-w-[240px] ${
                            isTop
                              ? 'text-[var(--color-ink)] font-bold'
                              : 'text-[var(--color-muted)] font-medium'
                          }`}
                        >
                          {language === 'ml' ? cand.conditionMl : cand.condition}
                        </span>
                        <span className="font-bold text-[var(--color-ink)] shrink-0 ml-2">
                          {candProbPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[var(--color-inset)] overflow-hidden border border-[var(--color-outline)]/30">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTop
                              ? 'bg-[var(--color-primary)]'
                              : 'bg-[var(--color-muted)]/50'
                          }`}
                          style={{
                            width: `${Math.max(4, Math.min(100, candProbPct))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Primary Action Button: View Treatment & Prevention (Hidden for healthy) */}
      {!isHealthy && (
        <button
          onClick={onSeeTreatment}
          className="mt-4 w-full min-h-[52px] py-3.5 px-4 retro-btn-primary text-sm flex items-center justify-center gap-2 retro-focus"
        >
          <span>
            {isGrape
              ? t('treatment_coming_soon', undefined, language)
              : t('view_treatment_prevention', undefined, language)}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}

      {/* 4. Related Schemes Action Button (Hidden for healthy and grape) */}
      {hasRelatedSchemes && (
        <button
          type="button"
          onClick={onViewRelatedScheme}
          className="mt-3 w-full min-h-[52px] py-3.5 px-4 retro-btn-secondary text-sm flex items-center justify-center gap-2 retro-focus"
        >
          <span>{t('related_schemes', undefined, language)}</span>
          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] text-xs font-bold flex items-center justify-center shrink-0">
            {schemesResult.totalCount}
          </span>
          <ArrowRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}

      {/* 5. Agriculture Officer Disclaimer Text */}
      <p className="text-xs text-[var(--color-muted)] mt-4 px-1 leading-relaxed">
        {trans.disclaimer_text}
      </p>
    </div>
  );
};
