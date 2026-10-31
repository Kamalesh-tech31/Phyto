import React from 'react';
import { BottomNavTab, Language } from '../types';
import { t } from '../services/i18n';
import { Scan, History, SlidersHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
}) => {
  const navItems = [
    {
      id: 'scan' as BottomNavTab,
      label: t('nav_scan', undefined, language),
      icon: Scan,
    },
    {
      id: 'history' as BottomNavTab,
      label: t('nav_history', undefined, language),
      icon: History,
    },
    {
      id: 'settings' as BottomNavTab,
      label: t('nav_settings', undefined, language),
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--color-surface)] z-40 transition-colors"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Top Edge: Mirrored Thick-Thin Rule (1px rule-soft on top, 3px gap, 2px rule-strong below) */}
      <div className="w-full h-[6px] flex flex-col justify-between" aria-hidden="true">
        {/* 1px solid line in rule-soft on top */}
        <div className="h-[1px] w-full bg-[var(--color-rule-soft)]" />
        {/* 3px gap is between the two lines */}
        {/* 2px solid line in rule-strong below */}
        <div className="h-[2px] w-full bg-[var(--color-rule-strong)]" />
      </div>

      <div className="flex items-center justify-around px-4 pt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] min-w-[72px] transition-all retro-focus ${
                isActive
                  ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] border-[1.5px] border-[var(--color-selected-border)] rounded-[12px] shadow-[2px_2px_0_var(--color-shadow-color)] font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] border-[1.5px] border-transparent rounded-[12px]'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform shrink-0 ${
                  isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-[0.75rem] mt-1 font-medium leading-tight text-center break-words max-w-full ${
                  isActive ? 'font-bold text-[var(--color-selected-text)]' : ''
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
