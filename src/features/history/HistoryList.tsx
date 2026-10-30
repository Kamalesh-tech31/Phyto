import React, { useEffect, useState } from 'react';
import { Language, ScanHistoryItem } from '../../types';
import { translations } from '../../data/translations';
import { storageService } from '../../services/storageService';
import { LeafGraphic } from '../../components/LeafGraphic';
import { Trash2, Calendar, ChevronRight, Sparkles } from 'lucide-react';

interface HistoryListProps {
  language: Language;
  onSelectScan: (item: ScanHistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  language,
  onSelectScan,
}) => {
  const t = translations[language];
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const data = await storageService.getAllScans();
    setScans(data);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (confirm(language === 'ml' ? 'സ്കാൻ ചരിത്രം മുഴുവൻ മായ്ക്കണമെന്നുറപ്പാണോ?' : 'Clear all saved scans from this phone?')) {
      await storageService.clearAllScans();
      setScans([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto">
      {/* Title & Clear Action */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h1 className="font-editorial text-[30px] font-bold text-[var(--color-ink)] leading-tight">
            {t.history_header_title}
          </h1>
          <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
            {t.history_header_desc}
          </p>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2 text-[var(--color-muted)] hover:text-[var(--color-danger-text)] rounded-xl transition-colors shrink-0 retro-focus"
            title={t.btn_clear_history}
            aria-label={t.btn_clear_history}
          >
            <Trash2 className="w-5 h-5 stroke-[1.8]" />
          </button>
        )}
      </div>

      {/* Loading or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--color-muted)] font-medium">
          Loading records...
        </div>
      ) : scans.length === 0 ? (
        <div className="retro-card p-8 text-center my-6">
          <div className="w-16 h-16 rounded-full bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border border-[var(--color-outline)] mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-editorial text-lg font-bold text-[var(--color-ink)]">
            {t.history_empty_title}
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-1.5 max-w-xs mx-auto leading-relaxed">
            {t.history_empty_desc}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const isUncertain = scan.isUncertain;

            return (
              <button
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="w-full retro-card-press p-3.5 text-left flex items-center gap-3.5 group retro-focus"
              >
                {/* Leaf thumbnail */}
                <div className="w-16 h-16 rounded-[10px] bg-[#141C16] border border-[var(--color-outline)] overflow-hidden shrink-0">
                  <LeafGraphic
                    imageUrl={scan.imageUrl}
                    variant={scan.diseaseId as any}
                    className="w-full h-full"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] mb-0.5 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(scan.timestamp)}</span>
                  </div>

                  <h4 className="font-editorial text-base font-bold text-[var(--color-ink)] truncate">
                    {language === 'ml' ? scan.diseaseNameMl : scan.diseaseName}
                  </h4>

                  <div className="flex items-center gap-2 mt-1">
                    {isUncertain ? (
                      <span className="px-2 py-0.5 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] rounded-full text-[10px] font-bold">
                        {t.uncertain_badge}
                      </span>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--color-outline)] rounded-full text-[10px] font-bold capitalize">
                          {scan.severity === 'mild'
                            ? t.severity_mild
                            : scan.severity === 'moderate'
                            ? t.severity_moderate
                            : t.severity_severe}
                        </span>
                        <span className="text-[11px] font-bold text-[var(--color-muted)]">
                          {scan.affectedAreaPercent}% {language === 'ml' ? 'ബാധിച്ചു' : 'area'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-[var(--color-muted)] group-hover:text-[var(--color-ink)] transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
