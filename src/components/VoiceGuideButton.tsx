import React, { useState, useEffect } from 'react';
import { speechService, VoiceState } from '../services/speechService';
import { i18n } from '../services/i18nService';
import { Volume2, Square, Loader2, Info, X } from 'lucide-react';

interface VoiceGuideButtonProps {
  pageId: string;
  customText?: string;
  clipId?: string;
  className?: string;
}

export const VoiceGuideButton: React.FC<VoiceGuideButtonProps> = ({
  pageId,
  customText,
  clipId,
  className = '',
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  // Update on language changes
  useEffect(() => {
    return i18n.subscribe(() => {
      setVoiceState('idle');
      setWarningMessage(null);
    });
  }, []);

  const getGuideText = (): string => {
    if (customText && customText.trim() !== '') {
      return customText;
    }
    switch (pageId) {
      case 'scan_home':
        return i18n.t('voice_guide_scan_home');
      case 'photo_check':
        return i18n.t('voice_guide_photo_check');
      case 'photo_check_not_leaf':
      case 'result_not_leaf':
        return i18n.t('voice_not_leaf');
      case 'analyzing':
        return i18n.t('voice_guide_analyzing');
      case 'result_uncertain':
        return i18n.t('voice_guide_result_uncertain');
      case 'history':
        return i18n.t('voice_guide_history');
      case 'schemes':
        return i18n.t('voice_guide_schemes');
      case 'settings':
        return i18n.t('voice_guide_settings');
      default:
        // Generic fallback built from pageId
        return `${i18n.t('app_name')}. ${pageId.replace('_', ' ')}`;
    }
  };

  const getEffectiveClipId = (): string | undefined => {
    if (clipId) return clipId;
    switch (pageId) {
      case 'scan_home':
        return 'page_scan_home';
      case 'photo_check':
        return 'page_photo_check';
      case 'photo_check_not_leaf':
      case 'result_not_leaf':
        return 'voice_not_leaf';
      case 'analyzing':
        return 'page_analyzing';
      case 'result_uncertain':
        return 'page_result_uncertain';
      case 'history':
        return 'page_history';
      case 'schemes':
        return 'page_schemes';
      case 'settings':
        return 'page_settings';
      default:
        return undefined;
    }
  };

  const handleToggle = () => {
    if (voiceState === 'speaking' || voiceState === 'loading') {
      speechService.stop();
      setVoiceState('idle');
      return;
    }

    const textToSpeak = getGuideText();
    if (!textToSpeak) return;

    setWarningMessage(null);

    // Call speak directly inside the user gesture
    speechService.speak({
      text: textToSpeak,
      clipId: getEffectiveClipId(),
      language: i18n.getLanguage(),
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onVoiceMissing: (msg) => {
        setWarningMessage(msg);
        setTimeout(() => {
          setWarningMessage(null);
        }, 7000);
      },
    });
  };

  const isSpeaking = voiceState === 'speaking';
  const isLoading = voiceState === 'loading';

  const buttonLabel = isSpeaking
    ? i18n.t('voice_guide_stop')
    : isLoading
    ? i18n.t('voice_guide_loading')
    : i18n.t('voice_guide_btn');

  const ariaLabel = `${buttonLabel} (${pageId})`;

  return (
    <div
      className={`absolute bottom-20 right-4 z-40 flex flex-col items-end pointer-events-auto select-none ${className}`}
    >
      {/* Voice Warning Banner */}
      {warningMessage && (
        <div
          role="alert"
          className="mb-2 max-w-xs rounded-xl bg-amber-900/95 text-amber-100 text-xs p-3 shadow-2xl border border-amber-600/50 backdrop-blur-sm animate-fade-in flex items-start gap-2"
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{warningMessage}</div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-300 hover:text-white p-0.5"
            aria-label="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Large 56px+ Voice Guide Touch Target */}
      <button
        onClick={handleToggle}
        aria-label={ariaLabel}
        className={`group flex items-center justify-center gap-2.5 min-h-[56px] px-5 py-3 rounded-full font-bold shadow-xl transition-all duration-200 active:scale-95 border cursor-pointer ${
          isSpeaking
            ? 'bg-rose-700 hover:bg-rose-800 text-white border-rose-500 shadow-rose-950/40 animate-pulse'
            : isLoading
            ? 'bg-amber-600 text-white border-amber-400 shadow-amber-950/40'
            : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-500 shadow-emerald-950/40 hover:shadow-2xl'
        }`}
      >
        {isSpeaking ? (
          <>
            <Volume2 className="w-5 h-5 text-white animate-bounce" />
            <span className="text-sm font-semibold tracking-wide">
              {buttonLabel}
            </span>
            <Square className="w-4 h-4 fill-white text-white" />
          </>
        ) : isLoading ? (
          <>
            <Loader2 className="w-5 h-5 text-white animate-spin" />
            <span className="text-sm font-semibold tracking-wide">
              {buttonLabel}
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tracking-wide">
              {buttonLabel}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
