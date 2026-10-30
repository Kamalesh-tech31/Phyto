import React, { useState } from 'react';
import { Language } from '../types';
import { PreventionLookupResult } from '../types/prevention';
import {
  ShieldCheck,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface PreventionSectionProps {
  crop: string;
  disease: string;
  lookupResult: PreventionLookupResult;
  language: Language;
}

export const PreventionSection: React.FC<PreventionSectionProps> = ({
  crop,
  disease,
  lookupResult,
  language,
}) => {
  const [showSources, setShowSources] = useState(false);
  const { found, entry, fallbackMessage } = lookupResult;

  if (!found || !entry) {
    return (
      <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs">
        <div className="flex items-center gap-2 text-[#94a3b8] mb-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-editorial text-lg font-bold text-[#162a45]">
            {language === 'ml' ? 'പ്രതിരോധ നിർദ്ദേശങ്ങൾ' : 'Prevention Guidance'}
          </h3>
        </div>
        <p className="text-xs text-[#64748b] leading-relaxed bg-[#f8f7f0] p-3.5 rounded-2xl border border-[#edebe0]">
          {fallbackMessage ||
            'Prevention guidance for this prediction is not available in the current knowledge base.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3.5 bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f1f0e9]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e2f2e5] text-[#1b5e20] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-[#162a45] leading-tight">
              {language === 'ml' ? 'പ്രതിരോധ നിർദ്ദേശങ്ങൾ' : 'Prevention Guidance'}
            </h3>
            <span className="text-[11px] font-medium text-[#64748b] capitalize">
              {crop} · {disease}
            </span>
          </div>
        </div>

        <span className="px-2.5 py-0.5 bg-[#e2f2e5] text-[#1b5e20] rounded-full text-[10px] font-bold uppercase tracking-wider">
          Curated KB
        </span>
      </div>

      {/* Core Prevention Measures */}
      <div>
        <h4 className="text-xs font-bold text-[#1b5e20] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>{language === 'ml' ? 'പ്രതിരോധ നടപടികൾ' : 'Prevention Measures'}</span>
        </h4>

        <ul className="space-y-2">
          {entry.prevention.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#162a45] leading-relaxed bg-[#fbfbf8] p-2.5 rounded-2xl border border-[#f1f0e9]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Local Prevention (Regional context: Kerala / TN monsoon drainage, etc.) */}
      {entry.local_prevention && entry.local_prevention.length > 0 && (
        <div className="bg-[#f0f7f2] rounded-2xl p-3.5 border border-[#d2ead7]">
          <h4 className="text-xs font-bold text-[#166534] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#166534]" />
            <span>{language === 'ml' ? 'പ്രാദേശിക മുൻകരുതൽ' : 'Local Prevention (South India)'}</span>
          </h4>

          <ul className="space-y-1.5">
            {entry.local_prevention.map((localItem, idx) => (
              <li
                key={idx}
                className="text-xs text-[#1e3d25] font-medium leading-relaxed pl-2 border-l-2 border-[#16a34a]"
              >
                {localItem}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Secondary Reference Information (Collapsible) */}
      {entry.sources && entry.sources.length > 0 && (
        <div className="pt-1">
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748b] hover:text-[#162a45] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {language === 'ml'
                ? 'ഔദ്യോഗിക റഫറൻസ് വിവരങ്ങൾ'
                : 'Official Knowledge Sources'}
            </span>
            {showSources ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showSources && (
            <div className="mt-2.5 p-3 bg-[#f8f7f2] rounded-2xl border border-[#edebe0] space-y-2 text-[11px] text-[#475569]">
              {entry.sources.map((src, sIdx) => (
                <div key={sIdx} className="border-b border-[#e5e4dc] pb-1.5 last:border-b-0 last:pb-0">
                  <div className="font-semibold text-[#162a45]">
                    {src.source} {src.pdf_page && `(Page ${src.pdf_page})`}
                  </div>
                  <div className="text-[10px] text-[#64748b] mt-0.5">{src.note}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
