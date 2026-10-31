import React from 'react';
import { Language } from '../../types';
import { i18n } from '../../services/i18nService';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, AlertCircle, RotateCcw } from 'lucide-react';

interface ResultNotLeafProps {
  imageUrl: string;
  language: Language;
  onRetake: () => void;
}

export const ResultNotLeaf: React.FC<ResultNotLeafProps> = ({
  imageUrl,
  onRetake,
}) => {
  return (
    <div className="flex flex-col px-5 pt-2 pb-36 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onRetake}
            className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
            aria-label="Back"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2]" />
          </button>
          <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
            {i18n.t('result_title')}
          </h2>
        </div>

        <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
          {i18n.t('val_not_leaf')}
        </span>
      </div>

      {/* Uploaded Photo Preview */}
      <div className="w-full aspect-[4/2.6] bg-[#172b1d] rounded-3xl overflow-hidden mt-2 relative shadow-xs border border-[#23422a]">
        <LeafGraphic
          imageUrl={imageUrl}
          className="w-full h-full"
        />
      </div>

      {/* Not a Leaf Notice Card */}
      <div className="mt-4 p-5 bg-amber-50 border border-amber-300 rounded-3xl shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h3 className="font-editorial text-lg font-bold text-amber-950 mb-1">
              {i18n.t('val_not_leaf')}
            </h3>
            <p className="text-xs text-amber-900 leading-relaxed">
              {i18n.t('photo_check_notice_not_leaf')}
            </p>
          </div>
        </div>
      </div>

      {/* Retake Photo Action */}
      <button
        onClick={onRetake}
        className="w-full mt-6 py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-5 h-5" />
        <span>{i18n.t('btn_retake_photo')}</span>
      </button>

      {/* Disclaimer Text */}
      <p className="text-xs text-[#64748b] mt-4 px-1 text-center leading-relaxed">
        {i18n.t('disclaimer_text')}
      </p>
    </div>
  );
};
