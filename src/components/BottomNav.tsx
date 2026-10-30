import React from 'react';
import { BottomNavTab, Language } from '../types';
import { translations } from '../data/translations';
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
  const t = translations[language];

  const navItems = [
    {
      id: 'scan' as BottomNavTab,
      label: t.nav_scan,
      icon: Scan,
    },
    {
      id: 'history' as BottomNavTab,
      label: t.nav_history,
      icon: History,
    },
    {
      id: 'settings' as BottomNavTab,
      label: t.nav_settings,
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#faf9f5]/95 backdrop-blur-md border-t border-[#e8e7de] px-6 py-2 z-40">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 min-w-[70px] rounded-xl transition-colors ${
                isActive ? 'text-[#0b72c9]' : 'text-[#64748b] hover:text-[#162a45]'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[11px] mt-1 font-medium leading-none ${
                  language === 'ml' ? 'font-malayalam' : ''
                } ${isActive ? 'font-semibold text-[#0b72c9]' : ''}`}
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
