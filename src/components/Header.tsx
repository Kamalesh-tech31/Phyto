import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';
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
  const t = translations[language];

  return (
    <header className="w-full bg-[#faf9f5] pt-3 pb-2 px-5 sticky top-0 z-40 border-b border-[#f1f0e8]/80">
      <div className="flex items-center justify-between">
        {/* Brand Logo and Title */}
        <button
          onClick={onTitleClick}
          className="flex items-center gap-2.5 text-left focus:outline-none group active:scale-95 transition-transform"
          aria-label="Phyto Home"
        >
          <div className="w-9 h-9 rounded-full bg-[#0b72c9] flex items-center justify-center shadow-xs">
            {/* Phyto stylized leaf mark */}
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <span className="font-editorial text-2xl font-bold tracking-tight text-[#162a45]">
            Phyto
          </span>
        </button>

        {/* Global Voice / Listen Button in Top Right */}
        <button
          onClick={onVoiceToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 shadow-2xs ${
            isSpeaking
              ? 'bg-[#0b72c9] border-[#0b72c9] text-white animate-pulse'
              : 'bg-[#eae9e2] border-[#dfded5] text-[#162a45] hover:bg-[#dfded5]'
          }`}
          title={isSpeaking ? 'Stop speaking' : 'Listen to this page'}
          aria-label={isSpeaking ? 'Stop audio' : 'Listen to page'}
        >
          {isSpeaking ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>{language === 'ml' ? 'നിർത്തുക' : 'Stop'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-[#0b72c9]" />
              <span>{language === 'ml' ? 'കേൾക്കുക' : 'Voice'}</span>
            </>
          )}
        </button>
      </div>

      {/* Online / Offline Status Indicator */}
      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-[#15803d]' : 'bg-[#16a34a]'
          }`}
        />
        <span
          className={
            isOnline ? 'text-[#166534]' : 'text-[#2e5e3b]'
          }
        >
          {isOnline ? t.status_online : t.status_offline}
        </span>
      </div>
    </header>
  );
};
