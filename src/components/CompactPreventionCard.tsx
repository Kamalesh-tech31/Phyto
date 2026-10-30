import React from 'react';
import { RestrictedPreventionEntry } from '../types/restricted_22';
import { ShieldCheck, Bug, Lightbulb } from 'lucide-react';
import { Language } from '../types';

interface CompactPreventionCardProps {
  entry: RestrictedPreventionEntry | null;
  isPest: boolean;
  language: Language;
}

export const CompactPreventionCard: React.FC<CompactPreventionCardProps> = ({
  entry,
  isPest,
  language,
}) => {
  if (!entry) return null;

  return (
    <div className="mt-3 bg-white rounded-2xl p-4 border border-[#e8e7de] shadow-2xs">
      {/* Title */}
      <div className="flex items-center gap-1.5 pb-2.5 mb-2.5 border-b border-[#f1f0e9]">
        {isPest ? (
          <Bug className="w-4 h-4 text-amber-600" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
        )}
        <h4 className="text-xs font-bold text-[#162a45] uppercase tracking-wide">
          {isPest
            ? language === 'ml'
              ? 'കീട പ്രതിരോധം (Pest Prevention)'
              : 'Pest Prevention'
            : language === 'ml'
            ? 'പ്രതിരോധം (Prevention)'
            : 'Prevention'}
        </h4>
      </div>

      {/* 3-5 Short Actionable Points */}
      <ul className="space-y-1.5">
        {entry.prevention.slice(0, 4).map((point, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-[11px] text-[#334155] leading-relaxed"
          >
            <span className="text-[#16a34a] font-bold shrink-0 mt-0.5">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {/* Optional Small Local Tip */}
      {entry.local_prevention && entry.local_prevention.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#f4f3ec] flex items-start gap-1.5 text-[10.5px] text-[#285f39] bg-[#f2f8f4] p-2 rounded-xl">
          <Lightbulb className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
          <span>
            <strong>{language === 'ml' ? 'പ്രാദേശിക സൂചന:' : 'Local tip:'} </strong>
            {entry.local_prevention[0]}
          </span>
        </div>
      )}
    </div>
  );
};
