import React, { useState } from 'react';
import { DiseaseId, Language } from '../../types';
import { translations } from '../../data/translations';
import { pesticideKbService } from '../../services/pesticideKbService';
import { treatmentResolver } from '../../services/treatmentResolver';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Sprout,
  HelpCircle,
  Tag,
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
  language,
  onBack,
  onNavigateToSchemes,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'treatment' | 'prevention'>('treatment');
  const [armywormCrop, setArmywormCrop] = useState<'corn' | 'rice'>('corn');
  const [showAllTreatments, setShowAllTreatments] = useState(false);

  // Centralized CSV-based treatment resolver
  const treatment = treatmentResolver.resolveTreatment(
    diseaseId,
    diseaseId === 'armyworm' ? armywormCrop : undefined
  );

  const displayName = treatment.className;
  const displayCrop = treatment.crop;
  const tierBadge = treatment.tier !== 'N' ? pesticideKbService.getTierBadge(treatment.tier as any) : null;

  // Pagination / compact display: max 3 primary cards initially
  const pesticides = treatment.pesticides;
  const visiblePesticides = showAllTreatments ? pesticides : pesticides.slice(0, 3);
  const hasMoreTreatments = pesticides.length > 3;

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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#64748b] font-semibold">
              {displayCrop}
            </span>
            {tierBadge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tierBadge.bg} ${tierBadge.text}`}
              >
                {tierBadge.label}
              </span>
            )}
          </div>
          <h2 className="font-editorial text-2xl font-bold text-[#162a45] leading-tight">
            {displayName}
          </h2>
        </div>
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
          {/* SPECIAL CASE: Healthy Crop */}
          {treatment.displayMode === 'no_treatment_needed' && (
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-3xl p-5 text-[#065f46] shadow-2xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[#065f46]">
                    {language === 'ml' ? 'വിള ആരോഗ്യകരമാണ്' : 'Healthy Crop Detected'}
                  </h4>
                  <p className="text-xs text-[#047857] mt-1 leading-relaxed">
                    {language === 'ml'
                      ? 'ഇലകളിൽ രോഗലക്ഷണങ്ങളൊന്നുമില്ല. രാസവസ്തുക്കളുടെ ആവശ്യമില്ല. ചിട്ടയായ നിരീക്ഷണവും സമീകൃത വളപ്രയോഗവും തുടരുക.'
                      : 'No active disease or pest infestation detected. No chemical pesticide application is required. Continue routine scouting and balanced nutrition.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SPECIAL CASE: No Chemical Recommendation Warranted (e.g., Rice Leaf Smut) */}
          {treatment.displayMode === 'no_recommendation' && (
            <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-3xl p-5 text-[#334155] shadow-2xs">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-[#64748b] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[#1e293b]">
                    {language === 'ml'
                      ? 'രാസ കുമിൾനാശിനി നിർദ്ദേശിച്ചിട്ടില്ല'
                      : 'No Chemical Treatment Recommended'}
                  </h4>
                  <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">
                    {treatment.displayNote ||
                      'Authoritative agricultural extension sources report that this condition rarely causes economic yield loss, and chemical fungicide sprays are not warranted or recommended. Practice good field sanitation and balanced nitrogen.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SPECIAL CASE: Expert Consultation Only (e.g., Rice Asiatic Borer held until species verified) */}
          {treatment.displayMode === 'expert_only' && (
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-3xl p-5 text-[#991b1b] shadow-2xs">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-[#dc2626] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-[#991b1b]">
                    {language === 'ml'
                      ? 'വിദഗ്ദ്ധോപദേശം ആവശ്യമാണ്'
                      : 'Expert Verification Required'}
                  </h4>
                  <p className="text-xs text-[#b91c1c] mt-1.5 leading-relaxed">
                    {treatment.displayNote ||
                      'Exact pest species verification is required before chemical application to prevent crop harm. Please consult your local Agricultural Officer or Krishi Bhavan for diagnosis.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SPECIAL CASE: Viral Disease Vector Management Only (Mandatory Rule 15) */}
          {treatment.displayMode === 'vector_control_only' && (
            <div className="bg-[#fffbeb] border-2 border-[#f59e0b] rounded-3xl p-4.5 text-[#92400e] shadow-2xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#b45309]">
                    {language === 'ml'
                      ? 'പ്രധാന മുന്നറിയിപ്പ്: വാഹക നിയന്ത്രണം മാത്രം'
                      : 'Important: Vector Control Only'}
                  </p>
                  <p className="text-xs font-semibold text-[#78350f] leading-snug">
                    {language === 'ml'
                      ? 'ഈ ചികിത്സ വൈറസിനെ ഭേദമാക്കില്ല. ഇത് കീട വാഹകരെ (വെള്ളീച്ച) നിയന്ത്രിക്കാൻ മാത്രമുള്ളതാണ്.'
                      : 'This treatment does not cure the virus. It is intended only for management of the insect vector.'}
                  </p>
                  <p className="text-[11px] text-[#92400e] leading-relaxed pt-1">
                    {language === 'ml'
                      ? 'രോഗബാധയേറ്റ ചെടികൾ വേരോടെ പിഴുതു നശിപ്പിക്കുകയും പുതിയ ചെടികളിലേക്ക് രോഗം പടർത്തുന്ന വെള്ളീച്ചകളെ നിയന്ത്രിക്കുകയും ചെയ്യുക.'
                      : 'Infected plants cannot be cured. Roguing infected plants and controlling vector populations prevents secondary spread.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SPECIAL CASE: Crop Prompt for Multi-crop Pest (Mandatory Rule 16) */}
          {treatment.displayMode === 'crop_prompt' && (
            <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#0b72c9]" />
                <h4 className="font-bold text-sm text-[#162a45]">
                  {treatment.promptText ||
                    (language === 'ml'
                      ? 'ഏത് വിളയാണ്? ചോളത്തിനും നെല്ലിനും ലക്ഷണങ്ങളും മരുന്നും വ്യത്യസ്തമാണ്.'
                      : 'Which crop is this? Treatment differs for corn and rice.')}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1f0e9] rounded-2xl">
                <button
                  onClick={() => setArmywormCrop('corn')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    armywormCrop === 'corn'
                      ? 'bg-white text-[#162a45] shadow-xs'
                      : 'text-[#64748b] hover:text-[#162a45]'
                  }`}
                >
                  🌽 Corn / Maize
                </button>
                <button
                  onClick={() => setArmywormCrop('rice')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    armywormCrop === 'rice'
                      ? 'bg-white text-[#162a45] shadow-xs'
                      : 'text-[#64748b] hover:text-[#162a45]'
                  }`}
                >
                  🌾 Rice / Paddy
                </button>
              </div>

              {armywormCrop === 'rice' && (
                <div className="bg-[#fff7ed] border border-[#fed7aa] rounded-2xl p-3.5 text-[#9a3412] text-xs leading-relaxed">
                  <p className="font-semibold">Rice Armyworm Notice:</p>
                  <p className="mt-0.5">
                    No verified chemical recommendation is available for rice armyworm. Use the
                    IPM steps and contact your local agriculture officer. (Trichlorfon is banned in
                    India).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section: Recommended Treatment Cards (From CSV Data) */}
          {visiblePesticides.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-[#854d0e] tracking-wide uppercase flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  {language === 'ml'
                    ? 'ശുപാർശ ചെയ്യുന്ന കുമിൾനാശിനി / കീടനാശിനി'
                    : 'Recommended Treatment'}
                </h3>
                <span className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">
                  {pesticides.length} {pesticides.length === 1 ? 'Option' : 'Options'} Available
                </span>
              </div>

              <div className="space-y-3">
                {visiblePesticides.map((pest, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-4.5 border border-[#e8e7de] shadow-2xs space-y-3"
                  >
                    {/* Pesticide Active Molecule / Formulation */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] block">
                          Pesticide / Formulation
                        </span>
                        <h4 className="font-editorial text-lg font-bold text-[#162a45] leading-snug">
                          {pest.name}
                        </h4>
                      </div>
                    </div>

                    {/* Vector Control Note if applicable */}
                    {pest.isVectorControl && (
                      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-2.5 text-[11px] text-[#92400e] leading-snug font-medium">
                        ⚠️ <strong>Vector control:</strong> This helps manage the insect vector (whitefly); it does not cure the virus.
                      </div>
                    )}

                    {/* Dose Section */}
                    <div className="pt-2 border-t border-[#f1f0e9]">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] block mb-1">
                        Dose
                      </span>
                      <div className="inline-block px-3 py-1 bg-[#f0f9ff] text-[#0369a1] text-xs font-bold rounded-xl border border-[#bae6fd]">
                        {pest.doseDisplay}
                      </div>
                      {pest.doseNote && (
                        <p className="text-[11px] text-[#64748b] mt-1.5 leading-snug italic">
                          {pest.doseNote}
                        </p>
                      )}
                    </div>

                    {/* What It Should Cost Section */}
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#059669]" />
                          What it should cost
                        </span>
                        {pest.badgeLabel && (
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                              pest.badgeType === 'approximate'
                                ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                                : pest.badgeType === 'benchmark'
                                ? 'bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]'
                                : pest.badgeType === 'indicative'
                                ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {pest.badgeLabel}
                          </span>
                        )}
                      </div>

                      <div className="font-editorial text-base font-bold text-[#162a45]">
                        {pest.priceDisplay}
                      </div>

                      {pest.gradeSubtext && (
                        <p className="text-[10px] text-[#64748b] leading-tight">
                          {pest.gradeSubtext}
                        </p>
                      )}

                      {/* State Restriction Notice (e.g., Kerala Mancozeb alert) */}
                      {pest.stateRestrictionFlag && (
                        <div className="mt-2 bg-[#fff7ed] border border-[#fed7aa] rounded-xl p-2 text-[11px] text-[#9a3412] leading-snug font-medium flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#ea580c] shrink-0 mt-0.5" />
                          <span>{pest.stateRestrictionFlag}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* View More / Show Less Toggle (Section 12) */}
              {hasMoreTreatments && (
                <div className="mt-3">
                  {!showAllTreatments ? (
                    <button
                      onClick={() => setShowAllTreatments(true)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-[#fafaf7] border border-[#cbd5e1] text-[#0b72c9] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>View more treatments ({pesticides.length - 3} more)</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAllTreatments(false)}
                      className="w-full py-2 px-4 text-[#64748b] hover:text-[#162a45] text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1"
                    >
                      <span>Show fewer treatments</span>
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Safety Disclaimer (Section 20) */}
              <div className="mt-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3.5 text-[11px] text-[#334155] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-[#1b5e20] shrink-0 mt-0.5" />
                <span>{treatment.safetyDisclaimer}</span>
              </div>

              {/* General Pricing Disclaimer */}
              <p className="text-[10px] text-[#94a3b8] mt-2 px-1 text-center leading-tight">
                Prices are approximate retail estimates and may vary by brand, pack size, shop and location. Treatment recommendations are based solely on agronomic evidence.
              </p>
            </div>
          )}

          {/* Section: Organic & Cultural IPM Practices */}
          <div>
            <h3 className="text-xs font-bold text-[#2e5e3b] tracking-wide mb-2 uppercase flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" />
              {language === 'ml'
                ? 'ജൈവ രീതികളും പ്രതിരോധ നടപടികളും (IPM)'
                : 'Cultural & Organic Management (IPM)'}
            </h3>

            <div className="bg-white rounded-3xl p-3 border border-[#e8e7de] shadow-2xs divide-y divide-[#f1f0e9]">
              {treatment.ipm && treatment.ipm.length > 0 ? (
                treatment.ipm.map((stepText, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3">
                    <div className="w-6 h-6 rounded-full bg-[#e2f2e5] text-[#1b5e20] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs font-medium text-[#162a45] leading-relaxed capitalize">
                      {stepText}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-[#64748b]">
                  Maintain field sanitation, balanced irrigation, and routine crop scouting.
                </div>
              )}
            </div>
          </div>

          {/* Section: Authoritative Sources */}
          {treatment.sources && treatment.sources.length > 0 && (
            <div className="bg-[#f8fafc] rounded-3xl p-4 border border-[#e2e8f0] text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] block">
                Verified Agricultural Sources
              </span>
              <ul className="space-y-1 text-[#0369a1]">
                {treatment.sources.map((src, i) => (
                  <li key={i} className="truncate">
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{src}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section: Contextual Related Schemes Banner */}
          <button
            onClick={onNavigateToSchemes}
            className="w-full bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-2xs flex items-center justify-between text-left hover:bg-[#fafaf7] transition-all"
          >
            <div>
              <div className="font-editorial text-base font-bold text-[#162a45]">
                {t.schemes_banner_title}
              </div>
              <div className="text-xs text-[#64748b] mt-0.5">{t.schemes_banner_sub}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
          </button>
        </div>
      )}

      {/* Main Tab Content: Prevention */}
      {activeTab === 'prevention' && (
        <div className="mt-5 space-y-4">
          <div className="bg-white rounded-3xl p-2 border border-[#e8e7de] shadow-2xs divide-y divide-[#f1f0e9]">
            {treatment.ipm && treatment.ipm.length > 0 ? (
              treatment.ipm.map((prevText, idx) => (
                <div key={idx} className="flex items-start gap-3.5 p-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#e5f1fb] text-[#0b72c9] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-medium text-[#162a45] leading-relaxed capitalize">
                    {prevText}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 text-xs text-[#64748b]">
                Maintain multi-year crop rotation and balanced fertilization.
              </div>
            )}
          </div>

          <div className="bg-[#eef8f0] border border-[#cbe8d2] rounded-3xl p-4 text-[#1a512b]">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#1b5e20]" />
              <h4 className="font-editorial text-base font-bold text-[#1a512b]">
                {language === 'ml' ? 'ദീർഘകാല പ്രതിരോധം' : 'Long-term Crop Health'}
              </h4>
            </div>
            <p className="text-xs text-[#285f39] leading-relaxed">
              {language === 'ml'
                ? 'വിളപരിക്രമം പാലിക്കുക, രോഗപ്രതിരോധ ശേഷിയുള്ള വിത്തുകൾ ഉപയോഗിക്കുക, നീർവാർച്ച സൗകര്യം ഉറപ്പാക്കുക.'
                : 'Practice multi-year crop rotation with non-host crops, install certified disease-free seeds, avoid prolonged canopy wetness, and adhere to recommended spacing.'}
            </p>
          </div>
        </div>
      )}

      {/* Return Button */}
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
