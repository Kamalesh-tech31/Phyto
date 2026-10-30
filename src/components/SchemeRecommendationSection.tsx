import React, { useState } from 'react';
import { Language } from '../types';
import { RecommendedSchemeResult } from '../types/schemes_kb';
import {
  Landmark,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SchemeRecommendationSectionProps {
  schemes: RecommendedSchemeResult[];
  noMatchMessage?: string;
  criticalRule: string;
  isOnline: boolean;
  language: Language;
}

export const SchemeRecommendationSection: React.FC<SchemeRecommendationSectionProps> = ({
  schemes,
  noMatchMessage,
  criticalRule,
  isOnline,
  language,
}) => {
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(
    schemes.length > 0 ? schemes[0].scheme.id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedSchemeId(expandedSchemeId === id ? null : id);
  };

  const handleOpenSource = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f0e9]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e5f1fb] text-[#0b72c9] flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#162a45] leading-tight">
              {language === 'ml'
                ? 'ശുപാർശ ചെയ്യുന്ന സർക്കാർ പദ്ധതികൾ'
                : 'Government Scheme Recommendation'}
            </h3>
            <span className="text-[11px] font-medium text-[#64748b]">
              {schemes.length > 0
                ? `${schemes.length} ${
                    schemes.length === 1 ? 'Scheme' : 'Schemes'
                  } Prioritized (Top Match)`
                : 'Decision Support'}
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 bg-[#f4f3ec] text-[#475569] rounded-full text-[10px] font-bold uppercase tracking-wider">
          Decision Support
        </span>
      </div>

      {/* Critical Rule Note */}
      <p className="text-[11px] text-[#64748b] leading-relaxed bg-[#fbfaf4] p-3 rounded-2xl border border-[#edebe0]">
        <strong>{language === 'ml' ? 'പ്രധാന നിയമം:' : 'Dataset Principle:'} </strong>
        {criticalRule}
      </p>

      {/* No match fallback */}
      {schemes.length === 0 ? (
        <div className="p-4 bg-[#faf9f5] rounded-2xl border border-[#edece4] text-center space-y-2">
          <p className="text-xs font-medium text-[#475569] leading-relaxed">
            {noMatchMessage ||
              'No specific government scheme could be confidently matched to the current crop, location and reported situation.'}
          </p>
          <div className="pt-2 text-[11px] text-[#64748b] border-t border-[#edece4]">
            {language === 'ml'
              ? 'കൂടുതൽ വിവരങ്ങൾക്കായി പ്രാദേശിക കൃഷിഭവനുമായോ അഗ്രികൾച്ചർ ഓഫീസറുമായോ ബന്ധപ്പെടുക.'
              : 'General advisory: Please consult your local Krishi Bhavan / Agricultural Extension Officer for localized emergency assistance.'}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {schemes.map((item) => {
            const isExpanded = expandedSchemeId === item.scheme.id;

            return (
              <div
                key={item.scheme.id}
                className="bg-[#faf9f5] rounded-2xl border border-[#edece4] overflow-hidden transition-all shadow-2xs"
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.scheme.id)}
                  className="w-full p-4 flex items-start justify-between text-left hover:bg-[#f5f4ed] transition-colors"
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#162a45] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {item.rank}
                      </span>
                      <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                        {item.scheme.jurisdiction} · {item.scheme.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-editorial text-base font-bold text-[#162a45] leading-snug">
                      {item.scheme.name}
                    </h4>

                    {/* Status badge: NEVER "Guaranteed eligible" */}
                    <div className="pt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'Eligibility Requires Verification'
                            ? 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                            : 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]'
                        }`}
                      >
                        <ShieldAlert className="w-3 h-3" />
                        <span>{item.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-[#94a3b8]">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-[#edece4] bg-white space-y-3 text-xs">
                    {/* Why relevant */}
                    <div>
                      <div className="text-[11px] font-bold text-[#162a45] uppercase tracking-wider mb-1">
                        {language === 'ml'
                          ? 'എന്തുകൊണ്ട് ഈ പദ്ധതി പ്രസക്തമാണ്:'
                          : 'Why this scheme is relevant:'}
                      </div>
                      <p className="text-[#475569] leading-relaxed bg-[#f8f7f2] p-2.5 rounded-xl border border-[#edebe0]">
                        {item.relevanceReason}
                      </p>
                    </div>

                    {/* Important Eligibility Condition */}
                    <div>
                      <div className="text-[11px] font-bold text-[#b45309] uppercase tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-[#b45309]" />
                        <span>
                          {language === 'ml'
                            ? 'പ്രധാന അർഹതാ നിബന്ധന (Hard Gate):'
                            : 'Important Eligibility Condition (Verification Gate):'}
                        </span>
                      </div>
                      <p className="text-[#475569] leading-relaxed">
                        {item.importantEligibility}
                      </p>
                    </div>

                    {/* Assistance / Benefit information */}
                    {item.benefitInfo && (
                      <div>
                        <div className="text-[11px] font-bold text-[#1b5e20] uppercase tracking-wider mb-1">
                          {language === 'ml' ? 'സഹായ വിവരങ്ങൾ:' : 'Benefit / Assistance Details:'}
                        </div>
                        <p className="text-[#334155] leading-relaxed">
                          {item.benefitInfo}
                        </p>
                      </div>
                    )}

                    {/* Official source / reference */}
                    <div className="pt-2 border-t border-[#f1f0e9] flex items-center justify-between">
                      <div className="text-[10px] text-[#64748b]">
                        {item.officialReference.document && (
                          <div>
                            <strong>Doc: </strong>
                            {item.officialReference.document}
                          </div>
                        )}
                        <div>
                          <strong>Source: </strong>
                          {item.officialReference.source}
                        </div>
                      </div>

                      {item.scheme.official_source && (
                        <button
                          type="button"
                          onClick={() => handleOpenSource(item.scheme.official_source)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded-xl text-xs font-semibold transition-colors"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official verification reminder */}
      <p className="text-[11px] text-[#94a3b8] leading-tight text-center pt-1">
        {language === 'ml'
          ? 'പദ്ധതി പ്രസക്തത ഒരു വഴികാട്ടി മാത്രമാണ്. യഥാർത്ഥ ആനുകൂല്യങ്ങൾക്ക് കൃഷിവകുപ്പ് പരിശോധന നിർബന്ധമാണ്.'
          : 'Potentially relevant schemes. Final eligibility, notification, and claim approval must be confirmed through the official department/portal.'}
      </p>
    </div>
  );
};
