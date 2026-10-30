import React, { useState } from 'react';
import { Language, SchemeItem } from '../../types';
import { translations } from '../../data/translations';
import schemesData from '../../data/schemes.json';
import {
  ExternalLink,
  CheckCircle,
  FileText,
  AlertCircle,
  Phone,
  Calendar,
  ChevronLeft,
} from 'lucide-react';

interface SchemesListProps {
  language: Language;
  isOnline: boolean;
  onBack?: () => void;
  highlightSchemeId?: string;
}

export const SchemesList: React.FC<SchemesListProps> = ({
  language,
  isOnline,
  onBack,
  highlightSchemeId,
}) => {
  const t = translations[language];
  const [filter, setFilter] = useState<'all' | 'subsidy' | 'insurance'>('all');
  const [offlineToast, setOfflineToast] = useState(false);

  const schemes = schemesData as SchemeItem[];

  const filteredSchemes = schemes.filter((s) => {
    if (highlightSchemeId && s.id === highlightSchemeId) return true;
    if (filter === 'subsidy') return s.id.includes('subhiksha') || s.id.includes('micro') || s.id.includes('kisan');
    if (filter === 'insurance') return s.id.includes('insurance');
    return true;
  });

  const handleOpenLink = (url: string) => {
    if (!isOnline) {
      setOfflineToast(true);
      setTimeout(() => setOfflineToast(false), 3800);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Header with optional Back button */}
      <div className="flex items-center gap-2 mb-3">
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
          <h1 className="font-editorial text-[28px] font-bold text-[var(--color-ink)] leading-tight">
            {t.schemes_header_title}
          </h1>
        </div>
      </div>

      <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed">
        {t.schemes_header_desc}
      </p>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all retro-focus ${
            filter === 'all'
              ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] shadow-[2px_2px_0_var(--color-shadow-color)]'
              : 'bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.schemes_filter_all}
        </button>
        <button
          onClick={() => setFilter('subsidy')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all retro-focus ${
            filter === 'subsidy'
              ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] shadow-[2px_2px_0_var(--color-shadow-color)]'
              : 'bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.schemes_filter_subsidy}
        </button>
        <button
          onClick={() => setFilter('insurance')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all retro-focus ${
            filter === 'insurance'
              ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] shadow-[2px_2px_0_var(--color-shadow-color)]'
              : 'bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
          }`}
        >
          {t.schemes_filter_insurance}
        </button>
      </div>

      {/* Offline Toast Notification when attempting to click external portal link */}
      {offlineToast && (
        <div className="mb-4 p-3.5 bg-[var(--color-warning-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] flex items-start gap-2 text-xs text-[var(--color-warning-text)]">
          <AlertCircle className="w-4 h-4 text-[var(--color-warning-text)] shrink-0 mt-0.5" />
          <span className="font-medium">{t.portal_offline_warning}</span>
        </div>
      )}

      {/* Schemes Cards List */}
      <div className="space-y-4">
        {filteredSchemes.map((scheme) => {
          const isHighlighted = highlightSchemeId === scheme.id;

          return (
            <div
              key={scheme.id}
              className={`retro-card p-5 transition-all ${
                isHighlighted
                  ? 'border-2 border-[var(--color-primary)]'
                  : ''
              }`}
            >
              {/* Category tag */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] rounded-full text-[11px] font-bold">
                  {language === 'ml' ? scheme.tagMl : scheme.tag}
                </span>

                {isHighlighted && (
                  <span className={`text-[10px] font-bold text-[var(--color-success-text)] bg-[var(--color-success-bg)] border border-[var(--color-outline)] px-2 py-0.5 rounded-full ${language === 'en' ? 'uppercase tracking-wider' : ''}`}>
                    Recommended for this crop
                  </span>
                )}
              </div>

              {/* Scheme Title */}
              <h3 className="font-editorial text-xl font-bold text-[var(--color-ink)] leading-snug">
                {language === 'ml' ? scheme.nameMl : scheme.name}
              </h3>

              {/* Primary Benefit Highlight Card */}
              <div className="mt-3 p-3.5 retro-inset">
                <div className={`text-[11px] font-bold text-[var(--color-primary)] ${language === 'en' ? 'uppercase tracking-wider' : ''}`}>
                  {language === 'ml' ? 'പ്രധാന നേട്ടം' : 'Core Benefit'}
                </div>
                <p className="text-xs font-bold text-[var(--color-ink)] mt-0.5 leading-relaxed">
                  {language === 'ml' ? scheme.benefitMl : scheme.benefit}
                </p>
              </div>

              {/* Eligibility Section */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)] mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>{t.eligibility_label}</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {(language === 'ml' ? scheme.eligibilityMl : scheme.eligibility).map(
                    (elig, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-[var(--color-muted)] flex items-start gap-2 leading-relaxed font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-muted)] mt-1.5 shrink-0" />
                        <span>{elig}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Required Documents Section */}
              <div className="mt-4 pt-3 retro-divider">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)] mb-2">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>{t.documents_label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(language === 'ml' ? scheme.documentsMl : scheme.documents).map(
                    (doc, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[var(--color-inset)] border border-[var(--color-divider)] text-[var(--color-ink)] rounded-full text-[11px] font-bold"
                      >
                        {doc}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Metadata & Official Portal Action */}
              <div className="mt-4 pt-3 border-t-[1.5px] border-dashed border-[var(--color-divider)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{scheme.lastUpdated}</span>
                  </span>
                  {scheme.helpline && (
                    <span className="flex items-center gap-1 font-bold text-[var(--color-ink)]">
                      <Phone className="w-3 h-3 text-[var(--color-primary)]" />
                      <span>{scheme.helpline}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenLink(scheme.officialUrl)}
                  className="w-full sm:w-auto px-4 py-2 retro-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 retro-focus"
                >
                  <span>{t.btn_open_portal}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
