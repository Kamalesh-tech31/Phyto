import React, { useEffect } from 'react';
import { Language, QualityCheckResult } from '../../types';
import { t } from '../../services/i18n';
import { speechService } from '../../services/speechService';
import { LeafGraphic } from '../../components/LeafGraphic';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react';

interface PhotoCheckProps {
  imageUrl: string;
  presetType?: string;
  quality: QualityCheckResult;
  language: Language;
  onAnalyse: () => void;
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
  // Trigger speech once if leaf check fails
  useEffect(() => {
    if (quality.isLeafPass === false) {
      try {
        speechService.speak({
          clipId: 'voice_not_leaf',
          text: t('voice_not_leaf', undefined, language),
          language,
        });
      } catch {
        // Autoplay restrictions safely caught
      }
    }
  }, [quality.isLeafPass, language]);

  // Helper for check icon (green check or amber warning sticker)
  const renderStatusIcon = (passed: boolean) => {
    if (passed) {
      return (
        <div className="w-6 h-6 rounded-full bg-[var(--color-success-bg)] border border-[var(--color-outline)] flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5 text-[var(--color-success-text)] stroke-[3]" />
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-outline)] flex items-center justify-center shrink-0">
        <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning-text)] stroke-[2.5]" />
      </div>
    );
  };

  const isBlurry = !quality.sharpnessPass || presetType === 'blurry';
  const isRealPhoto = imageUrl && !imageUrl.startsWith('sample:');

  return (
    <div className="flex flex-col px-5 pt-2 pb-24 max-w-md mx-auto">
      {/* Top Header with Back Arrow and Title */}
      <div className="flex items-center gap-3 py-2">
        <button
          onClick={onRetake}
          className="p-1 -ml-1 text-[var(--color-ink)] hover:opacity-75 transition-opacity retro-focus rounded-xl"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2]" />
        </button>
        <h2 className="font-editorial text-2xl font-bold text-[var(--color-ink)]">
          {t('photo_check_title', undefined, language)}
        </h2>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="mt-1 mb-2">
        <div className="grid grid-cols-4 gap-1.5 h-2 w-full">
          <div className="bg-[var(--color-primary)] border border-[var(--color-outline)] rounded-full" />
          <div className="bg-[var(--color-primary)] border border-[var(--color-outline)] rounded-full" />
          <div className="bg-[var(--color-inset)] border border-[var(--color-divider)] rounded-full" />
          <div className="bg-[var(--color-inset)] border border-[var(--color-divider)] rounded-full" />
        </div>
        <p className="text-xs text-[var(--color-muted)] mt-2 font-medium">
          {t('step_indicator', undefined, language)}
        </p>
      </div>

      {/* Captured Image Preview with Left Shadow */}
      <div className="w-full aspect-[4/3] bg-[var(--color-vf-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden mt-3 relative">
        <LeafGraphic
          imageUrl={imageUrl}
          variant={(presetType as any) || 'early_blight'}
          className="w-full h-full"
          showShadow={!isBlurry && !isRealPhoto}
        />
      </div>

      {/* Not Leaf Notice */}
      {quality.isLeafPass === false && (
        <div className="mt-3 p-3 rounded-xl border border-[var(--color-outline)] bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>{t('photo_check_notice_not_leaf', undefined, language)}</span>
        </div>
      )}

      {/* Quality Checks Card */}
      <div className="mt-4 retro-card overflow-hidden divide-y-[1.5px] divide-dashed divide-[var(--color-divider)]">
        {/* Sharpness */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.sharpnessPass)}
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              {t('quality_sharpness', undefined, language)}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.sharpnessPass ? 'text-[var(--color-muted)]' : 'text-[var(--color-warning-text)]'
            }`}
          >
            {language === 'ml' ? quality.sharpnessLabelMl : quality.sharpnessLabel}
          </span>
        </div>

        {/* Light */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.lightPass)}
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              {t('quality_light', undefined, language)}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.lightPass ? 'text-[var(--color-muted)]' : 'text-[var(--color-warning-text)]'
            }`}
          >
            {language === 'ml' ? quality.lightLabelMl : quality.lightLabel}
          </span>
        </div>

        {/* Shadow */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.shadowPass)}
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              {t('quality_shadow', undefined, language)}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.shadowPass ? 'text-[var(--color-muted)]' : 'text-[var(--color-warning-text)]'
            }`}
          >
            {language === 'ml' ? quality.shadowLabelMl : quality.shadowLabel}
          </span>
        </div>

        {/* Distance */}
        <div className="flex items-center justify-between p-3.5">
          <div className="flex items-center gap-3">
            {renderStatusIcon(quality.distancePass)}
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              {t('quality_distance', undefined, language)}
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              quality.distancePass ? 'text-[var(--color-muted)]' : 'text-[var(--color-warning-text)]'
            }`}
          >
            {language === 'ml' ? quality.distanceLabelMl : quality.distanceLabel}
          </span>
        </div>
      </div>

      {/* Advisory Note */}
      <p className="text-xs text-[var(--color-muted)] mt-3 px-1 leading-relaxed">
        {isBlurry
          ? t('photo_check_notice_blurry', undefined, language)
          : language === 'ml'
          ? quality.adviceMl
          : quality.advice}
      </p>

      {/* Action Buttons: If acceptable, Analyse is primary. If unacceptable (blurry), Retake is primary. */}
      <div className="mt-8 flex flex-col gap-3">
        {!isBlurry ? (
          <>
            <button
              onClick={onAnalyse}
              className="w-full min-h-[52px] py-3.5 retro-btn-primary text-base retro-focus"
            >
              {t('btn_analyse_leaf', undefined, language)}
            </button>

            <button
              onClick={onRetake}
              className="w-full min-h-[48px] py-3 retro-btn-surface text-base retro-focus"
            >
              {t('btn_retake_photo', undefined, language)}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onRetake}
              className="w-full min-h-[52px] py-3.5 retro-btn-primary text-base retro-focus"
            >
              {t('btn_retake_photo', undefined, language)}
            </button>

            <button
              onClick={onAnalyse}
              className="w-full min-h-[48px] py-3 retro-btn-surface text-base retro-focus"
            >
              {t('btn_scan_anyway', undefined, language)}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
