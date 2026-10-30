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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] px-4 py-2 z-40 transition-colors">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[48px] min-w-[72px] rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isActive
                  ? 'bg-[var(--color-selected-bg)] text-[var(--color-selected-text)] font-bold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
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
