import React from 'react';
import { Language } from '../types';
import { t } from '../services/i18n';
import { Volume2, Square } from 'lucide-react';

interface HeaderProps {
  language: Language;
  isOnline: boolean;
  isSpeaking: boolean;
  onVoiceToggle: () => void;
  onTitleClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  isOnline,
  isSpeaking,
  onVoiceToggle,
  onTitleClick,
}) => {
  return (
    <header className="w-full bg-[var(--color-bg)] pt-3 pb-2.5 px-5 sticky top-0 z-40 border-b-2 border-[var(--color-outline)] transition-colors">
      <div className="flex items-center justify-between">
        {/* Brand Logo and Title */}
        <button
          onClick={onTitleClick}
          className="flex items-center gap-2.5 text-left rounded-xl group retro-btn-press retro-focus min-h-[44px]"
          aria-label="Phyto Home"
        >
          {/* Retro Leaf Logo Mark: green circle, cream leaf, 2px ink outline */}
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-[var(--color-on-primary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="font-editorial text-[1.5rem] font-bold tracking-tight text-[var(--color-ink)]">
            Phyto
          </span>
        </button>

        {/* Global Voice / Listen Button in Top Right */}
        <button
          onClick={onVoiceToggle}
          className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] retro-btn-press retro-focus transition-all ${
            isSpeaking
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] animate-pulse'
              : 'bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-inset)]'
          }`}
          title={isSpeaking ? 'Stop speaking' : 'Listen to this page'}
          aria-label={isSpeaking ? 'Stop audio' : 'Listen to page'}
        >
          {isSpeaking ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>{t('btn_stop_listen', undefined, language)}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-[var(--color-accent-text)]" aria-hidden="true" />
              <span>{t('btn_listen', undefined, language)}</span>
            </>
          )}
        </button>
      </div>

      {/* Online / Offline Status Indicator */}
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 bg-[var(--color-success-text)] border border-[var(--color-outline)]"
          aria-hidden="true"
        />
        <span className="text-[var(--color-muted)] font-medium">
          {isOnline
            ? t('status_online', undefined, language)
            : t('status_offline', undefined, language)}
        </span>
      </div>
    </header>
  );
};
