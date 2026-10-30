import React, { useState } from 'react';
import { Landmark, ExternalLink, AlertTriangle, ShieldCheck, WifiOff } from 'lucide-react';
import { CompactSchemeCard, SupportedState } from '../types/restricted_22';
import { STATE_OPTIONS, restricted22Service } from '../services/restricted22Service';
import { Language } from '../types';

interface CompactSevereSchemeCardProps {
  crop: string;
  severity: string;
  diseaseClass?: string;
  language: Language;
  defaultState?: SupportedState;
}

export const CompactSevereSchemeCard: React.FC<CompactSevereSchemeCardProps> = ({
  crop,
  severity,
  diseaseClass,
  language,
  defaultState,
}) => {
  // Only evaluate when severity is "severe" or "critical"
  const sevLower = (severity || '').toLowerCase().trim();
  const isSevereOrCritical = sevLower === 'severe' || sevLower === 'critical';

  // Do not show for healthy or non-severe predictions
  const isHealthy =
    (diseaseClass || '').toLowerCase().includes('healthy') ||
    crop.toLowerCase().includes('healthy');

  // Internal state for farm state selection
  const [selectedState, setSelectedState] = useState<SupportedState>(
    defaultState || (language === 'ml' ? 'KL' : 'TN')
  );

  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  if (!isSevereOrCritical || isHealthy) {
    return null;
  }

  // Lookup schemes deterministically and offline
  const schemes: CompactSchemeCard[] = restricted22Service.evaluateSevereSchemes(
    crop,
    severity,
    selectedState,
    diseaseClass
  );

  // If no scheme passes rules, hide silently (no huge NO SCHEMES banner)
  if (!schemes || schemes.length === 0) {
    return null;
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      e.preventDefault();
      setOfflineNotice(
        language === 'ml'
          ? 'ഔദ്യോഗിക രേഖ കാണാൻ ഇന്റർനെറ്റ് കണക്ഷൻ ആവശ്യമാണ്.'
          : 'Official document requires an internet connection.'
      );
      setTimeout(() => setOfflineNotice(null), 4000);
    }
  };

  return (
    <div className="mt-3 bg-white rounded-2xl p-3.5 border border-[#e8e7de] shadow-2xs space-y-3">
      {/* Header row with badge */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#f1f0e9]">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-[#0b72c9]" />
          <span className="font-editorial text-sm font-bold text-[#162a45]">
            {language === 'ml' ? 'സർക്കാർ സഹായ പദ്ധതികൾ' : 'Government Support'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]">
          <AlertTriangle className="w-3 h-3 text-[#b91c1c]" />
          <span>{language === 'ml' ? 'ഗുരുതരമായ വിളനാശം' : 'Severe crop loss'}</span>
        </span>
      </div>

      {/* Compact State Selector */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <label
          htmlFor="farm-state-select"
          className="text-[11px] font-semibold text-[#475569] shrink-0"
        >
          {language === 'ml' ? 'നിങ്ങളുടെ സംസ്ഥാനം:' : 'Farm state:'}
        </label>
        <select
          id="farm-state-select"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value as SupportedState)}
          className="text-xs bg-[#f8fafc] text-[#162a45] font-medium border border-[#cbd5e1] rounded-lg px-2.5 py-1.5 outline-none focus:border-[#0b72c9] focus:ring-1 focus:ring-[#0b72c9] transition-all cursor-pointer"
        >
          {STATE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Offline Alert if clicked without network */}
      {offlineNotice && (
        <div className="flex items-center gap-1.5 p-2 bg-[#fff7ed] border border-[#ffedd5] text-[#9a3412] rounded-xl text-[11px]">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{offlineNotice}</span>
        </div>
      )}

      {/* Schemes Cards (Maximum 2) */}
      <div className="space-y-2.5">
        {schemes.slice(0, 2).map((scheme) => (
          <div
            key={scheme.scheme_id}
            className="bg-[#fafaf7] rounded-xl p-3 border border-[#ecebe1] space-y-2 text-xs"
          >
            {/* Status and Crop Tag */}
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                <ShieldCheck className="w-3 h-3 text-[#b45309]" />
                <span>{scheme.status}</span>
              </span>
              <span className="text-[10px] font-bold text-[#64748b] uppercase">
                {language === 'ml' ? `വിള: ${scheme.crop}` : `Crop: ${scheme.crop}`}
              </span>
            </div>

            {/* Scheme Title */}
            <h5 className="font-editorial text-[13px] font-bold text-[#162a45] leading-snug">
              {scheme.scheme_name}
            </h5>

            {/* Relevance explanation */}
            <p className="text-[11px] text-[#475569] leading-relaxed">
              {scheme.why_relevant}
            </p>

            {/* Important eligibility gate */}
            <div className="text-[11px] text-[#475569] leading-relaxed bg-white/80 p-2 rounded-lg border border-[#e8e7de]">
              <strong className="text-[#b45309]">
                {language === 'ml' ? 'പ്രധാന നിബന്ധന: ' : 'Important condition: '}
              </strong>
              {scheme.important_condition}
            </div>

            {/* Official Link Button */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-[#94a3b8] italic">
                {language === 'ml' ? 'യോഗ്യത പരിശോധന ആവശ്യമാണ്' : 'Eligibility requires verification.'}
              </span>
              <a
                href={scheme.official_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLinkClick(e, scheme.official_link)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b72c9] hover:text-[#085da5] hover:underline transition-colors py-1 px-2 rounded-md hover:bg-[#e0f2fe]"
              >
                <span>{language === 'ml' ? 'ഔദ്യോഗിക വിവരങ്ങൾ കാണുക' : 'View official details'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Mandatory Conservative Disclaimer */}
      <p className="text-[10px] text-[#94a3b8] leading-tight pt-1 border-t border-[#f1f0e9]">
        {language === 'ml'
          ? 'ഇതൊരു സാധ്യമായ സഹായ മാർഗ്ഗമാണ്, ഉറപ്പായ ആനുകൂല്യമല്ല. അന്തിമ യോഗ്യത, വിജ്ഞാപനം ചെയ്ത വിള, പ്രദേശം, സീസൺ, രജിസ്ട്രേഷൻ എന്നിവ കൃഷി ഭവനുമായോ ഇൻഷുററുമായോ പരിശോധിക്കേണ്ടതാണ്.'
          : 'This is a potential support pathway, not a confirmed claim or entitlement. Final eligibility, notified crop, area, season, enrollment and loss assessment must be verified with the official department or insurer.'}
      </p>
    </div>
  );
};
