import React from 'react';
import { Language, SUPPORTED_LANGUAGES } from '../types';
import { i18n } from '../services/i18nService';
import { Globe, Check } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onTitleClick?: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  onTitleClick,
  isOnline = true,
}) => {
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

        {/* Top-Bar Language Dropdown */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 bg-white border border-[#dfded5] rounded-full px-2.5 py-1 shadow-2xs hover:border-[#cbd5e1] transition-all">
            <Globe className="w-3.5 h-3.5 text-[#0b72c9] shrink-0" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs font-bold text-[#162a45] focus:outline-none cursor-pointer pr-1 py-0.5"
              aria-label={i18n.t('select_language')}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-sm font-semibold">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Online / Offline Status Badge */}
      <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isOnline ? 'bg-[#16a34a]' : 'bg-[#d97706]'
          }`}
        />
        <span className={isOnline ? 'text-[#2e5e3b]' : 'text-[#92400e]'}>
          {isOnline ? i18n.t('status_online') : i18n.t('status_offline_mode')} · {i18n.t('status_offline')}
        </span>
      </div>
    </header>
  );
};
