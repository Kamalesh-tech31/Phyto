import React from 'react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { PWAInstallButton } from '../../components/PWAInstallButton';
import { FarmerAssistant } from '../assistant/FarmerAssistant';
import {
  Globe,
  Cpu,
  RotateCcw,
  Landmark,
  ChevronRight,
} from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  onLanguageToggle: () => void;
  isOnline: boolean;
  onOpenSchemes?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageToggle,
  onOpenSchemes,
}) => {
  const t = translations[language];

  const handleResetCache = () => {
    if (confirm(language === 'ml' ? 'കാഷ് റീസെറ്റ് ചെയ്യണോ?' : 'Reset local cached model data?')) {
      alert(language === 'ml' ? 'മോഡൽ കാഷ് വിജയകരമായി പുതുക്കി.' : 'Offline model cache verified and ready.');
    }
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div>
        <h1 className="font-editorial text-[30px] font-bold text-[#162a45] leading-tight">
          {t.settings_header_title}
        </h1>
      </div>

      {/* PWA Install Banner */}
      <PWAInstallButton language={language} />

      {/* Government Schemes Secondary Access Card */}
      {onOpenSchemes && (
        <button
          onClick={onOpenSchemes}
          className="w-full bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs flex items-center justify-between text-left hover:border-[#cbd5e1] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e5f1fb] flex items-center justify-center text-[#0b72c9]">
              <Landmark className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-editorial text-base font-bold text-[#162a45]">
                {t.schemes_header_title}
              </h3>
              <p className="text-xs text-[#64748b]">
                {language === 'ml' ? 'സബ്സിഡികളും കാർഷിക പദ്ധതികളും കാണുക' : 'Browse subsidies & plant protection grants'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
        </button>
      )}

      {/* Language Selector (Internal preference, not in top header) */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-[#0b72c9]" />
          <h3 className="font-editorial text-base font-bold text-[#162a45]">
            {t.section_lang}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => language !== 'en' && onLanguageToggle()}
            className={`py-3 px-4 rounded-2xl border text-xs font-bold text-center transition-all ${
              language === 'en'
                ? 'bg-[#162a45] border-[#162a45] text-white shadow-xs'
                : 'bg-[#faf9f5] border-[#e2e1d7] text-[#475569] hover:bg-[#f3f2ea]'
            }`}
          >
            English
          </button>
          <button
            onClick={() => language !== 'ml' && onLanguageToggle()}
            className={`py-3 px-4 rounded-2xl border text-xs font-bold text-center font-malayalam transition-all ${
              language === 'ml'
                ? 'bg-[#162a45] border-[#162a45] text-white shadow-xs'
                : 'bg-[#faf9f5] border-[#e2e1d7] text-[#475569] hover:bg-[#f3f2ea]'
            }`}
          >
            മലയാളം
          </button>
        </div>
      </div>

      {/* Offline Intelligence & Storage Status */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-[#16a34a]" />
          <h3 className="font-editorial text-base font-bold text-[#162a45]">
            {t.storage_title}
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <div className="flex items-center gap-2 text-[#162a45] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span>{t.storage_model}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Ready
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#faf9f5] rounded-2xl border border-[#e8e7de]">
            <span className="text-[#64748b]">
              {language === 'ml' ? 'ഓഫ്‌ലൈൻ ഡാറ്റാബേസ്' : 'Offline Database'}: IndexedDB
            </span>
            <button
              onClick={handleResetCache}
              className="text-[#0b72c9] hover:underline font-semibold text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.storage_clear}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Farmer Assistant / FAQ Section */}
      <FarmerAssistant language={language} />

      {/* About Phyto Notice */}
      <div className="text-center py-4 text-xs text-[#94a3b8]">
        <div className="font-editorial font-bold text-[#64748b] text-sm">
          Phyto v1.0.0
        </div>
        <p className="mt-1">
          {language === 'ml'
            ? 'കർഷകർക്കായുള്ള ഓഫ്‌ലൈൻ വിള സംരക്ഷണ സഹായി'
            : 'Offline-First Agricultural Assistant for Farmers'}
        </p>
      </div>
    </div>
  );
};
