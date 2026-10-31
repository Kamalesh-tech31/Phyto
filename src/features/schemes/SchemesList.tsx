import React, { useState } from 'react';
import { Language, SchemeItem } from '../../types';
import { i18n } from '../../services/i18nService';
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
            className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2]" />
          </button>
        )}
        <div>
          <h1 className="font-editorial text-[28px] font-bold text-[#162a45] leading-tight">
            {i18n.t('schemes_header_title')}
          </h1>
        </div>
      </div>

      <p className="text-xs text-[#64748b] mb-4 leading-relaxed">
        {i18n.t('schemes_header_desc')}
      </p>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            filter === 'all'
              ? 'bg-[#162a45] text-white shadow-2xs'
              : 'bg-white border border-[#e8e7de] text-[#64748b]'
          }`}
        >
          {i18n.t('schemes_filter_all')}
        </button>
        <button
          onClick={() => setFilter('subsidy')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            filter === 'subsidy'
              ? 'bg-[#162a45] text-white shadow-2xs'
              : 'bg-white border border-[#e8e7de] text-[#64748b]'
          }`}
        >
          {i18n.t('schemes_filter_subsidy')}
        </button>
        <button
          onClick={() => setFilter('insurance')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            filter === 'insurance'
              ? 'bg-[#162a45] text-white shadow-2xs'
              : 'bg-white border border-[#e8e7de] text-[#64748b]'
          }`}
        >
          {i18n.t('schemes_filter_insurance')}
        </button>
      </div>

      {/* Offline Toast Notification when attempting to click external portal link */}
      {offlineToast && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2 text-xs text-amber-900 shadow-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{i18n.t('portal_offline_warning')}</span>
        </div>
      )}

      {/* Schemes Cards List */}
      <div className="space-y-4">
        {filteredSchemes.map((scheme) => {
          const isHighlighted = highlightSchemeId === scheme.id;
          const loc = (scheme.i18n && scheme.i18n[language]) || scheme.i18n?.en || {
            name: scheme.name || '',
            tag: scheme.tag || '',
            benefit: scheme.benefit || '',
            eligibility: scheme.eligibility || [],
            documents: scheme.documents || [],
          };

          return (
            <div
              key={scheme.id}
              className={`bg-white rounded-3xl p-5 border transition-all ${
                isHighlighted
                  ? 'border-[#0b72c9] ring-2 ring-[#0b72c9]/20 shadow-md'
                  : 'border-[#e8e7de] shadow-xs'
              }`}
            >
              {/* Category tag */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#e5f1fb] text-[#0b72c9] rounded-full text-[11px] font-semibold">
                  {loc.tag}
                </span>

                {isHighlighted && (
                  <span className="text-[10px] uppercase font-bold text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded-full">
                    {i18n.t('schemes_rec_crop')}
                  </span>
                )}
              </div>

              {/* Scheme Title */}
              <h3 className="font-editorial text-xl font-bold text-[#162a45] leading-snug">
                {loc.name}
              </h3>

              {/* Primary Benefit Highlight Card */}
              <div className="mt-3 p-3.5 bg-[#f0f7f1] border border-[#d2ead6] rounded-2xl">
                <div className="text-[11px] font-bold text-[#1b5e20] uppercase tracking-wider">
                  {i18n.t('schemes_core_benefit')}
                </div>
                <p className="text-xs font-semibold text-[#1e4620] mt-0.5 leading-relaxed">
                  {loc.benefit}
                </p>
              </div>

              {/* Eligibility Section */}
              <div className="mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#162a45] mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#16a34a]" />
                  <span>{i18n.t('eligibility_label')}</span>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {loc.eligibility.map((elig, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-[#475569] flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8] mt-1.5 shrink-0" />
                      <span>{elig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Documents Section */}
              <div className="mt-4 pt-3 border-t border-[#f1f0e9]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#162a45] mb-2">
                  <FileText className="w-3.5 h-3.5 text-[#0b72c9]" />
                  <span>{i18n.t('documents_label')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {loc.documents.map((doc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[#f8fafc] border border-[#e2e8f0] text-[#334155] rounded-xl text-[11px] font-medium"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata & Official Portal Action */}
              <div className="mt-4 pt-3 border-t border-[#f1f0e9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{scheme.lastUpdated}</span>
                  </span>
                  {scheme.helpline && (
                    <span className="flex items-center gap-1 font-medium text-[#162a45]">
                      <Phone className="w-3 h-3 text-[#16a34a]" />
                      <span>{scheme.helpline}</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleOpenLink(scheme.officialUrl)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0b72c9] hover:bg-[#085da5] active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                >
                  <span>{i18n.t('btn_open_portal')}</span>
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
