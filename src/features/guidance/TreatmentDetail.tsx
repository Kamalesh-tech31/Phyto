import React, { useState } from 'react';
import { DiseaseId, Language } from '../../types';
import { translations } from '../../data/translations';
import { t as translate } from '../../services/i18n';
import { restricted22Service } from '../../services/restricted22Service';
import { treatmentResolver } from '../../services/treatmentResolver';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  ShieldCheck,
  FlaskConical,
  Tag,
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
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'treatment' | 'prevention'>('treatment');
  const [armywormCrop, setArmywormCrop] = useState<'corn' | 'rice'>('corn');
  const [showAllTreatments, setShowAllTreatments] = useState(false);

  const isGrape = Boolean(
    (crop && crop.toLowerCase() === 'grape') ||
    (diseaseId && diseaseId.startsWith('grape_'))
  );

  // Centralized CSV-based verified treatment resolver for all 22 classes
  const isArmyworm = diseaseId === 'armyworm' || diseaseId === 'pest_armyworm';
  const treatment = treatmentResolver.resolveTreatment(
    diseaseId,
    isArmyworm ? armywormCrop : 'corn',
    crop
  );

  // Look up class-specific prevention guidance from Ashwin's frozen 22-class KB
  const preventionResult = restricted22Service.lookupPrevention(
    crop || treatment.crop,
    diseaseName || treatment.className,
    language
  );

  const displayTitle = diseaseName || treatment.className || 'Details';

  // Pagination: top 3 primary treatment cards initially
  const pesticides = treatment.pesticides || [];
  const visiblePesticides = showAllTreatments ? pesticides : pesticides.slice(0, 3);
  const hasMoreTreatments = pesticides.length > 3;

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

      {/* Main Tab Content: Treatment (Pesticides and Average Cost Boxes Only) */}
      {activeTab === 'treatment' && (
        <div className="mt-5 space-y-4">
          {/* SPECIAL CASE 1: Grape Coming Soon */}
          {isGrape ? (
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
          ) : treatment.displayMode === 'no_treatment_needed' ? (
            /* SPECIAL CASE 2: Healthy Crop (Zero Pesticides Needed) */
            <div className="retro-card p-5 bg-[var(--color-success-bg)]/20 border-2 border-[var(--color-outline)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[var(--color-success-text)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[var(--color-ink)]">
                    {language === 'ml' ? 'വിള ആരോഗ്യകരമാണ്' : 'Healthy Crop Detected'}
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                    {language === 'ml'
                      ? 'ഇലകളിൽ രോഗലക്ഷണങ്ങളൊന്നുമില്ല. രാസവസ്തുക്കളുടെ ആവശ്യമില്ല. ചിട്ടയായ നിരീക്ഷണവും സമീകൃത വളപ്രയോഗവും തുടരുക.'
                      : 'No active disease or pest infestation detected. No chemical pesticide application is required. Continue routine scouting and balanced nutrition.'}
                  </p>
                </div>
              </div>
            </div>
          ) : treatment.displayMode === 'no_recommendation' ? (
            /* SPECIAL CASE 3: No Chemical Recommendation Warranted (e.g. Rice Leaf Smut) */
            <div className="retro-card p-5 border-2 border-[var(--color-outline)]">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-[var(--color-muted)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[var(--color-ink)]">
                    {language === 'ml'
                      ? 'രാസ കുമിൾനാശിനി നിർദ്ദേശിച്ചിട്ടില്ല'
                      : 'No Chemical Treatment Recommended'}
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">
                    {treatment.displayNote ||
                      'Authoritative agricultural extension sources report that this condition rarely causes economic yield loss, and chemical fungicide sprays are not warranted or recommended.'}
                  </p>
                </div>
              </div>
            </div>
          ) : treatment.displayMode === 'expert_only' ? (
            /* SPECIAL CASE 4: Expert Consultation Only (e.g. Rice Asiatic Borer) */
            <div className="retro-card p-5 bg-[var(--color-warning-bg)]/20 border-2 border-[var(--color-outline)]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[var(--color-ink)]">
                    {language === 'ml'
                      ? 'വിദഗ്ദ്ധോപദേശം ആവശ്യമാണ്'
                      : 'Expert Verification Required'}
                  </h4>
                  <p className="text-xs text-[var(--color-muted)] mt-1.5 leading-relaxed">
                    {treatment.displayNote ||
                      'Exact pest species verification is required before chemical application to prevent crop harm. Please consult your local Agricultural Officer or Krishi Bhavan.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* SPECIAL CASE 5: Viral Vector Control Warning */}
              {treatment.displayMode === 'vector_control_only' && (
                <div className="bg-[var(--color-warning-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] p-4 text-[var(--color-warning-text)]">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {language === 'ml'
                          ? 'പ്രധാന മുന്നറിയിപ്പ്: വാഹക നിയന്ത്രണം മാത്രം'
                          : 'Important: Vector Control Only'}
                      </p>
                      <p className="text-xs font-semibold leading-snug">
                        {language === 'ml'
                          ? 'ഈ ചികിത്സ വൈറസിനെ ഭേദമാക്കില്ല. ഇത് കീട വാഹകരെ (വെള്ളീച്ച) നിയന്ത്രിക്കാൻ മാത്രമുള്ളതാണ്.'
                          : 'This treatment does not cure the virus. It is intended only for management of the insect vector.'}
                      </p>
                      <p className="text-[11px] opacity-90 leading-relaxed pt-1">
                        {language === 'ml'
                          ? 'രോഗബാധയേറ്റ ചെടികൾ വേരോടെ പിഴുതു നശിപ്പിക്കുകയും പുതിയ ചെടികളിലേക്ക് രോഗം പടർത്തുന്ന വെള്ളീച്ചകളെ നിയന്ത്രിക്കുകയും ചെയ്യുക.'
                          : 'Infected plants cannot be cured. Roguing infected plants and controlling vector populations prevents secondary spread.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIAL CASE 6: Crop Prompt for Multi-crop Pest (Armyworm: Corn vs Rice) */}
              {treatment.displayMode === 'crop_prompt' && (
                <div className="retro-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[var(--color-primary)]" />
                    <h4 className="font-bold text-sm text-[var(--color-ink)]">
                      {treatment.promptText ||
                        (language === 'ml'
                          ? 'ഏത് വിളയാണ്? ചോളത്തിനും നെല്ലിനും ലക്ഷണങ്ങളും മരുന്നും വ്യത്യസ്തമാണ്.'
                          : 'Which crop is this? Treatment differs for corn and rice.')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-1 retro-inset">
                    <button
                      onClick={() => setArmywormCrop('corn')}
                      className={`py-2 px-3 rounded-[10px] text-xs font-bold transition-all retro-focus ${
                        armywormCrop === 'corn'
                          ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      🌽 Corn / Maize
                    </button>
                    <button
                      onClick={() => setArmywormCrop('rice')}
                      className={`py-2 px-3 rounded-[10px] text-xs font-bold transition-all retro-focus ${
                        armywormCrop === 'rice'
                          ? 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      🌾 Rice / Paddy
                    </button>
                  </div>

                  {armywormCrop === 'rice' && (
                    <div className="bg-[var(--color-warning-bg)] border border-[var(--color-outline)] rounded-xl p-3 text-[var(--color-warning-text)] text-xs leading-relaxed">
                      <p className="font-semibold">Rice Armyworm Notice:</p>
                      <p className="mt-0.5">
                        No verified chemical recommendation is available for rice armyworm. Use IPM steps and contact your local agriculture officer. (Trichlorfon is banned in India).
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* RECOMMENDED TREATMENT CARDS: PESTICIDES AND AVERAGE COST BOXES */}
              {visiblePesticides.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <h3 className="text-xs font-bold text-[var(--color-primary)] tracking-wide uppercase flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 stroke-[2.2]" />
                      {language === 'ml'
                        ? 'ശുപാർശ ചെയ്യുന്ന കുമിൾനാശിനി / കീടനാശിനി'
                        : 'Recommended Treatment'}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] tracking-wider">
                      {pesticides.length} {pesticides.length === 1 ? 'Option' : 'Options'} Available
                    </span>
                  </div>

                  <div className="space-y-3">
                    {visiblePesticides.map((pest, idx) => (
                      <div
                        key={idx}
                        className="retro-card p-4 space-y-3"
                      >
                        {/* Pesticide Active Molecule / Formulation */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)] block">
                              Pesticide / Formulation
                            </span>
                            <h4 className="font-editorial text-lg font-bold text-[var(--color-ink)] leading-snug">
                              {pest.name}
                            </h4>
                          </div>
                        </div>

                        {/* Vector Control Note if applicable */}
                        {pest.isVectorControl && (
                          <div className="bg-[var(--color-warning-bg)]/30 border border-[var(--color-outline)] rounded-xl p-2.5 text-[11px] text-[var(--color-warning-text)] leading-snug font-medium">
                            ⚠️ <strong>Vector control:</strong> This helps manage the insect vector (whitefly); it does not cure the virus.
                          </div>
                        )}

                        {/* Dose Section */}
                        <div className="pt-2 border-t-[1.5px] border-dashed border-[var(--color-divider)]">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)] block mb-1">
                            Dose
                          </span>
                          <div className="inline-block px-3 py-1 bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] text-xs font-bold rounded-xl border border-[var(--color-outline)]">
                            {pest.doseDisplay}
                          </div>
                          {pest.doseNote && (
                            <p className="text-[11px] text-[var(--color-muted)] mt-1.5 leading-snug italic">
                              {pest.doseNote}
                            </p>
                          )}
                        </div>

                        {/* What It Should Cost / Average Cost Box */}
                        <div className="bg-[var(--color-inset)] border-[1.5px] border-[var(--color-outline)] rounded-xl p-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-muted)] flex items-center gap-1">
                              <Tag className="w-3 h-3 text-[var(--color-primary)]" />
                              What it should cost
                            </span>
                            {pest.badgeLabel && (
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                                  pest.badgeType === 'approximate'
                                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)]'
                                    : pest.badgeType === 'benchmark'
                                    ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)]'
                                    : 'bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-outline)]'
                                }`}
                              >
                                {pest.badgeLabel}
                              </span>
                            )}
                          </div>

                          <div className="font-editorial text-base font-bold text-[var(--color-ink)]">
                            {pest.priceDisplay}
                          </div>

                          {pest.gradeSubtext && (
                            <p className="text-[10px] text-[var(--color-muted)] leading-tight">
                              {pest.gradeSubtext}
                            </p>
                          )}

                          {/* State Restriction Notice (e.g. Kerala Mancozeb alert) */}
                          {pest.stateRestrictionFlag && (
                            <div className="mt-2 bg-[var(--color-warning-bg)] border border-[var(--color-outline)] rounded-xl p-2 text-[11px] text-[var(--color-warning-text)] leading-snug font-medium flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
                              <span>{pest.stateRestrictionFlag}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View More / Show Less Toggle */}
                  {hasMoreTreatments && (
                    <div className="mt-3">
                      {!showAllTreatments ? (
                        <button
                          onClick={() => setShowAllTreatments(true)}
                          className="w-full py-2.5 px-4 bg-[var(--color-surface)] hover:opacity-90 border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] text-[var(--color-primary)] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 retro-focus"
                        >
                          <span>View more treatments ({pesticides.length - 3} more)</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAllTreatments(false)}
                          className="w-full py-2 px-4 text-[var(--color-muted)] hover:text-[var(--color-ink)] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1 retro-focus"
                        >
                          <span>Show fewer treatments</span>
                          <ChevronUp className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Safety Disclaimer */}
                  <div className="mt-3.5 retro-card p-3.5 text-[11px] text-[var(--color-ink)] leading-relaxed flex items-start gap-2.5">
                    <ShieldCheck className="w-4.5 h-4.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <span>{treatment.safetyDisclaimer}</span>
                  </div>

                  {/* Retail Pricing Note */}
                  <p className="text-[10px] text-[var(--color-muted)] mt-2 px-1 text-center leading-tight">
                    Prices are approximate retail estimates and may vary by brand, pack size, shop and location. Treatment recommendations are based solely on agronomic evidence.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Main Tab Content: Prevention (Untouched 22-Class Localized Prevention Guidance) */}
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
