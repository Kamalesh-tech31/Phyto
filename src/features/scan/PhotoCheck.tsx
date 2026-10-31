import React, { useEffect } from 'react';
import { Language, QualityCheckResult } from '../../types';
import { i18n } from '../../services/i18nService';
import { speechService } from '../../services/speechService';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, Check, AlertTriangle, AlertCircle } from 'lucide-react';

interface PhotoCheckProps {
  imageUrl: string;
  presetType?: string;
  quality: QualityCheckResult;
  language: Language;
  onAnalyse: (notLeaf?: boolean) => void;
  onRetake: () => void;
}

export const PhotoCheck: React.FC<PhotoCheckProps> = ({
  imageUrl,
  presetType,
  quality,
  language,
  onAnalyse,
  onRetake,
}) => {
  const renderStatusIcon = (passed: boolean) => {
    if (passed) {
      return (
        <div className="w-6 h-6 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-[#16a34a] stroke-[3]" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-[#d97706] stroke-[2.5]" />
      </div>
    );
  };

  const isBlurryPreset = presetType === 'blurry';
  const isLeafFailed = quality.isLeafPass === false;

  // Automatically attempt to speak voice_not_leaf once if check fails
  useEffect(() => {
    if (isLeafFailed) {
      try {
        speechService.speak({
          text: i18n.t('voice_not_leaf'),
          clipId: 'voice_not_leaf',
          language,
        });
      } catch {
        // Silently catch in case browser autoplay policy intercepts
      }
    }
    return () => {
      speechService.stop();
    };
  }, [isLeafFailed, language]);

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onRetake}
          className="p-1 -ml-1 text-[#162a45] hover:opacity-75 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[#162a45]">
          {i18n.t('photo_check_title')}
        </h2>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="mt-1 mb-2">
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#0b72c9] rounded-full" />
          <div className="bg-[#e2e1d7] rounded-full" />
          <div className="bg-[#e2e1d7] rounded-full" />
        </div>
        <p className="text-[11px] text-[#64748b] mt-1.5 font-medium">
          {i18n.t('step_indicator')}
        </p>
      </div>

      {/* Leaf Photo Preview */}
      <div className="w-full aspect-[4/2.6] bg-[#172b1d] rounded-3xl overflow-hidden mt-2 relative shadow-xs border border-[#23422a]">
        <LeafGraphic
          imageUrl={imageUrl}
          variant={(presetType as any) || 'early_blight'}
          className="w-full h-full"
          showShadow={!quality.shadowPass}
        />
      </div>

      {/* 5 Quality Check Rows */}
      <div className="mt-4 bg-white rounded-3xl border border-[#e8e7de] shadow-xs divide-y divide-[#f1f0e9]">
        {/* Leaf Check */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.isLeafPass !== false)}
            <span className="text-sm font-semibold text-[#162a45]">
              {i18n.t('quality_leaf_detected')}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.isLeafPass !== false ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {quality.isLeafPass !== false ? i18n.t('val_leaf_ok') : i18n.t('val_not_leaf')}
          </span>
        </div>

        {/* Sharpness */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.sharpnessPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {i18n.t('quality_sharpness')}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.sharpnessPass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {quality.sharpness === 'sharp' ? i18n.t('val_sharp') : i18n.t('val_blurry')}
          </span>
        </div>

        {/* Light */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.lightPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {i18n.t('quality_light')}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.lightPass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {quality.light === 'good' ? i18n.t('val_good') : i18n.t('val_dim')}
          </span>
        </div>

        {/* Shadow */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.shadowPass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {i18n.t('quality_shadow')}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.shadowPass ? 'text-[#475569]' : 'text-[#92400e]'
            }`}
          >
            {quality.shadowPass ? i18n.t('val_no_shadow') : i18n.t('val_shadow_warn')}
          </span>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.distancePass)}
            <span className="text-sm font-semibold text-[#162a45]">
              {i18n.t('quality_distance')}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.distancePass ? 'text-[#475569]' : 'text-[#b45309]'
            }`}
          >
            {quality.distance === 'good' ? i18n.t('val_good') : i18n.t('val_too_close')}
          </span>
        </div>
      </div>

      {/* Advisory Note Banner */}
      {isLeafFailed ? (
        <div className="mt-3 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-amber-900 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            {i18n.t('photo_check_notice_not_leaf')}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[#556980] mt-3 px-1 leading-relaxed">
          {isBlurryPreset ? i18n.t('photo_check_notice_blurry') : i18n.t('photo_check_notice')}
        </p>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        {isLeafFailed ? (
          <>
            <button
              onClick={onRetake}
              className="w-full py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all"
            >
              {i18n.t('btn_retake_photo')}
            </button>
            <button
              onClick={() => onAnalyse(true)}
              className="w-full py-3 bg-white border border-[#cbd5e1] hover:bg-slate-50 active:scale-[0.98] text-[#475569] font-medium rounded-2xl text-xs transition-all"
            >
              {i18n.t('btn_use_anyway')}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onAnalyse(false)}
              className="w-full py-4 bg-[#0b72c9] hover:bg-[#085da5] active:scale-[0.98] text-white font-semibold rounded-2xl text-base shadow-sm transition-all"
            >
              {i18n.t('btn_analyse_leaf')}
            </button>
            <button
              onClick={onRetake}
              className="w-full py-3.5 bg-transparent border-2 border-[#162a45] hover:bg-[#f3f2ea] active:scale-[0.98] text-[#162a45] font-semibold rounded-2xl text-base transition-all"
            >
              {i18n.t('btn_retake_photo')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
