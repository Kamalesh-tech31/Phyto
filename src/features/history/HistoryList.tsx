import React, { useEffect, useState } from 'react';
import { Language, ScanHistoryItem } from '../../types';
import { i18n } from '../../services/i18nService';
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
    if (confirm(i18n.t('history_clear_confirm'))) {
      await storageService.clearAllScans();
      setScans([]);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const locale =
      language === 'ta'
        ? 'ta-IN'
        : language === 'hi'
        ? 'hi-IN'
        : language === 'ml'
        ? 'ml-IN'
        : language === 'te'
        ? 'te-IN'
        : 'en-IN';

    return d.toLocaleDateString(locale, {
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
          <h1 className="font-editorial text-[30px] font-bold text-[#162a45] leading-tight">
            {i18n.t('history_header_title')}
          </h1>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            {i18n.t('history_header_desc')}
          </p>
        </div>

        {scans.length > 0 && (
          <button
            onClick={handleClear}
            className="p-2 text-[#94a3b8] hover:text-[#dc2626] rounded-xl transition-colors shrink-0"
            title={i18n.t('btn_clear_history')}
            aria-label={i18n.t('btn_clear_history')}
          >
            <Trash2 className="w-5 h-5 stroke-[1.8]" />
          </button>
        )}
      </div>

      {/* Loading or Empty State */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#94a3b8]">
          {i18n.t('history_loading')}
        </div>
      ) : scans.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-[#e8e7de] text-center my-6 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-[#f4f7f4] mx-auto flex items-center justify-center text-[#245e31] mb-3">
            <Sparkles className="w-8 h-8 stroke-[1.8]" />
          </div>
          <h3 className="font-editorial text-lg font-bold text-[#162a45]">
            {i18n.t('history_empty_title')}
          </h3>
          <p className="text-xs text-[#64748b] mt-1.5 max-w-xs mx-auto leading-relaxed">
            {i18n.t('history_empty_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const isUncertain = scan.isUncertain;
            // Dynamically translate disease name from current KB
            const diseaseName = i18n.getDiseaseName(scan.class_id);

            const severityLabel =
              scan.affectedAreaPercent >= 30
                ? i18n.t('severity_severe')
                : scan.affectedAreaPercent >= 10
                ? i18n.t('severity_moderate')
                : i18n.t('severity_mild');

            const variantName =
              scan.class_id === 'tomato_late_blight'
                ? 'late_blight'
                : scan.class_id === 'tomato_healthy'
                ? 'healthy'
                : 'early_blight';

            return (
              <button
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="w-full bg-white rounded-2xl p-3.5 border border-[#e8e7de] shadow-2xs hover:border-[#cbd5e1] text-left flex items-center gap-3.5 transition-all group active:scale-[0.99]"
              >
                {/* Leaf thumbnail stored in IndexedDB */}
                <div className="w-16 h-16 rounded-xl bg-[#172b1d] overflow-hidden shrink-0 shadow-2xs">
                  <LeafGraphic
                    imageUrl={scan.imageData || scan.imageUrl}
                    variant={variantName}
                    className="w-full h-full"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mb-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(scan.timestamp)}</span>
                  </div>

                  <h4 className="font-editorial text-base font-bold text-[#162a45] truncate">
                    {diseaseName}
                  </h4>

                  <div className="flex items-center gap-2 mt-1">
                    {isUncertain ? (
                      <span className="px-2 py-0.5 bg-[#fef3c7] text-[#92400e] rounded-full text-[10px] font-bold">
                        {i18n.t('uncertain_badge')}
                      </span>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 bg-[#e2f2e5] text-[#1b5e20] rounded-full text-[10px] font-bold capitalize">
                          {severityLabel}
                        </span>
                        <span className="text-[11px] font-semibold text-[#64748b]">
                          {scan.affectedAreaPercent}% {i18n.t('history_area_affected')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#cbd5e1] group-hover:text-[#0b72c9] transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
