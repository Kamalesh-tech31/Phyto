import React, { useState, useEffect } from 'react';
import { Language, SUPPORTED_LANGUAGES } from '../../types';
import { i18n } from '../../services/i18nService';
import { storageService } from '../../services/storageService';
import { speechService, SpeechDiagnostics } from '../../services/speechService';
import { PWAInstallButton } from '../../components/PWAInstallButton';
import { FarmerAssistant } from '../assistant/FarmerAssistant';
import {
  Globe,
  Cpu,
  RotateCcw,
  Landmark,
  ChevronRight,
  Download,
  CheckCircle2,
  Volume2,
  Activity,
  Play,
} from 'lucide-react';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isOnline: boolean;
  onOpenSchemes?: () => void;
}

const LANGUAGE_PACK_SIZES: Record<Language, { formatted: string; bytes: number }> = {
  en: { formatted: '71 KB (0.07 MB)', bytes: 72555 },
  ta: { formatted: '127 KB (0.12 MB)', bytes: 130175 },
  hi: { formatted: '189 KB (0.18 MB)', bytes: 193925 },
  ml: { formatted: '162 KB (0.16 MB)', bytes: 166111 },
  te: { formatted: '196 KB (0.19 MB)', bytes: 200512 },
};

const FONT_MAP: Record<Language, string[]> = {
  en: ['/assets/fonts/plus-jakarta-sans.woff2', '/assets/fonts/newsreader.woff2'],
  ta: ['/assets/fonts/noto-sans-tamil.woff2'],
  hi: ['/assets/fonts/noto-sans-devanagari.woff2'],
  ml: ['/assets/fonts/noto-sans-malayalam.woff2'],
  te: ['/assets/fonts/noto-sans-telugu.woff2'],
};

const AUDIO_CLIPS_LIST = [
  'page_scan_home',
  'page_photo_check',
  'page_analyzing',
  'page_result_uncertain',
  'page_history',
  'page_schemes',
  'page_settings',
  'tomato_early_blight_overview',
  'tomato_early_blight_treatment',
  'tomato_early_blight_prevention',
  'tomato_late_blight_overview',
  'tomato_late_blight_treatment',
  'tomato_late_blight_prevention',
  'tomato_healthy_overview',
  'tomato_healthy_treatment',
  'tomato_healthy_prevention',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  onOpenSchemes,
}) => {
  const [downloadedLangs, setDownloadedLangs] = useState<Language[]>([]);
  const [downloadingLang, setDownloadingLang] = useState<Language | null>(null);
  const [speakSlowly, setSpeakSlowly] = useState(i18n.getSpeakSlowly());
  const [diagnostics, setDiagnostics] = useState<SpeechDiagnostics>(() =>
    speechService.getDiagnostics(language)
  );

  const refreshDiagnostics = () => {
    setDiagnostics(speechService.getDiagnostics(language));
  };

  useEffect(() => {
    setDownloadedLangs(storageService.getDownloadedLanguages());
    refreshDiagnostics();
  }, [language]);

  const handleTestVoice = () => {
    speechService.speak({
      text: i18n.t('voice_guide_settings'),
      clipId: 'page_settings',
      language,
      onStateChange: () => {
        refreshDiagnostics();
      },
      onVoiceMissing: (msg) => {
        alert(msg);
        refreshDiagnostics();
      },
    });
    refreshDiagnostics();
  };

  const handleResetCache = () => {
    if (confirm(i18n.t('cache_reset_confirm'))) {
      alert(i18n.t('cache_reset_success'));
    }
  };

  const handleToggleSpeakSlowly = () => {
    const nextVal = !speakSlowly;
    setSpeakSlowly(nextVal);
    i18n.setSpeakSlowly(nextVal);
  };

  const handleDownloadLanguage = async (targetLang: Language) => {
    if (downloadedLangs.includes(targetLang) || downloadingLang) return;
    setDownloadingLang(targetLang);

    try {
      // Assemble full asset list for this language: JSONs, script fonts, and all 16 audio clips
      const urlsToCache = [
        `/assets/lang/ui_${targetLang}.json`,
        `/assets/kb/${targetLang}.json`,
        `/assets/audio/manifest.json`,
        ...(FONT_MAP[targetLang] || []),
        ...AUDIO_CLIPS_LIST.map((id) => `/assets/audio/${targetLang}/${id}.mp3`),
      ];

      // Pre-fetch files into browser cache if Cache API is available
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await window.caches.open('phyto-cache-v2');
          await cache.addAll(urlsToCache);
        } catch (e) {
          console.warn('CacheStorage prefetch notice:', e);
        }
      }

      await new Promise((r) => setTimeout(r, 450));

      storageService.markLanguageDownloaded(targetLang);
      setDownloadedLangs(storageService.getDownloadedLanguages());
    } finally {
      setDownloadingLang(null);
    }
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto space-y-4">
      {/* Title */}
      <div>
        <h1 className="font-editorial text-[30px] font-bold text-[#162a45] leading-tight">
          {i18n.t('settings_header_title')}
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
                {i18n.t('schemes_header_title')}
              </h3>
              <p className="text-xs text-[#64748b]">
                {i18n.t('schemes_header_desc')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#94a3b8]" />
        </button>
      )}

      {/* Language Selector (All 5 offline languages) */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-[#0b72c9]" />
          <h3 className="font-editorial text-base font-bold text-[#162a45]">
            {i18n.t('section_lang')}
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`py-3 px-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                language === lang.code
                  ? 'bg-[#162a45] border-[#162a45] text-white shadow-xs'
                  : 'bg-[#faf9f5] border-[#e2e1d7] text-[#475569] hover:bg-[#f3f2ea]'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Offline Download Language Packs */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-[#16a34a]" />
            <h3 className="font-editorial text-base font-bold text-[#162a45]">
              {i18n.t('download_offline_btn')}
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#64748b] mb-3 leading-relaxed">
          Full offline pack includes UI translations, crop guides, script fonts, and all 16 voice clips.
        </p>

        <div className="space-y-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isDownloaded = downloadedLangs.includes(lang.code);
            const isDownloading = downloadingLang === lang.code;
            const packSize = LANGUAGE_PACK_SIZES[lang.code]?.formatted || '0.1 MB';

            return (
              <div
                key={lang.code}
                className="flex items-center justify-between p-3 bg-[#faf9f5] rounded-2xl border border-[#e8e7de]"
              >
                <div>
                  <div className="text-xs font-bold text-[#162a45]">
                    {lang.label} ({lang.script})
                  </div>
                  <div className="text-[10px] text-[#94a3b8]">
                    {packSize}
                  </div>
                </div>

                {isDownloaded ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{i18n.t('downloaded_badge')}</span>
                  </span>
                ) : isDownloading ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                    <span>{i18n.t('downloading_badge')}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleDownloadLanguage(lang.code)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0b72c9] hover:bg-[#085da5] active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{i18n.t('download_offline_btn')}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voice Guide Settings ("Speak slowly") */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="w-5 h-5 text-[#0b72c9]" />
          <h3 className="font-editorial text-base font-bold text-[#162a45]">
            {i18n.t('voice_guide_btn')}
          </h3>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-[#faf9f5] rounded-2xl border border-[#e8e7de]">
          <div className="space-y-0.5 max-w-[75%]">
            <div className="text-xs font-bold text-[#162a45]">
              {i18n.t('speak_slowly_label')}
            </div>
            <div className="text-[11px] text-[#64748b] leading-tight">
              {i18n.t('speak_slowly_desc')}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={speakSlowly}
            onClick={handleToggleSpeakSlowly}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              speakSlowly ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                speakSlowly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Live Voice Diagnostics & Immediate Test Button */}
        <div className="mt-4 pt-4 border-t border-[#f1f0e9] space-y-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[#162a45] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#0b72c9]" />
              <span>{i18n.t('voice_test_title')}</span>
            </span>
            <button
              onClick={handleTestVoice}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{i18n.t('voice_test_btn')}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de]">
              <span className="text-[#64748b] block">{i18n.t('voice_test_supported')}</span>
              <span className="font-bold text-[#162a45]">
                {diagnostics.isSupported ? '✓ Ready' : '✗ Unsupported'}
              </span>
            </div>
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de]">
              <span className="text-[#64748b] block">{i18n.t('voice_test_total_voices')}</span>
              <span className="font-bold text-[#162a45]">{diagnostics.totalVoices}</span>
            </div>
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de]">
              <span className="text-[#64748b] block">Tier Used</span>
              <span className="font-bold text-[#0b72c9] uppercase">{diagnostics.activeTier}</span>
            </div>
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de]">
              <span className="text-[#64748b] block">HTTP Status</span>
              <span className="font-bold text-emerald-700">{diagnostics.lastHttpStatus || 'N/A'}</span>
            </div>
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de] col-span-2">
              <span className="text-[#64748b] block">Clip Path Tried</span>
              <span className="font-mono text-[10px] text-[#162a45] break-all block">
                {diagnostics.lastClipPath || 'None'}
              </span>
            </div>
            <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de] col-span-2">
              <span className="text-[#64748b] block">Status / Last Error</span>
              <span className="font-semibold text-[#162a45] truncate block">
                {diagnostics.lastError ? `Error: ${diagnostics.lastError}` : (diagnostics.lastStatus || 'Idle')}
              </span>
            </div>
          </div>

          <div className="p-2 bg-[#faf9f5] rounded-xl border border-[#e8e7de] text-[11px]">
            <span className="text-[#64748b] block">{i18n.t('voice_test_matching')}:</span>
            <span className="font-medium text-[#162a45] break-words">
              {diagnostics.voicesForLanguage.length > 0
                ? diagnostics.voicesForLanguage.join(', ')
                : 'No offline voice detected for this language'}
            </span>
          </div>
        </div>
      </div>

      {/* Offline Intelligence & Storage Status */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8e7de] shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-[#16a34a]" />
          <h3 className="font-editorial text-base font-bold text-[#162a45]">
            {i18n.t('storage_title')}
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
            <div className="flex items-center gap-2 text-[#162a45] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span>{i18n.t('storage_model')}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {i18n.t('storage_ready')}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#faf9f5] rounded-2xl border border-[#e8e7de]">
            <span className="text-[#64748b]">
              {i18n.t('storage_db_status')}
            </span>
            <button
              onClick={handleResetCache}
              className="text-[#0b72c9] hover:underline font-semibold text-[11px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{i18n.t('storage_clear')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Farmer Assistant / FAQ Section */}
      <FarmerAssistant language={language} />

      {/* About Phyto Notice */}
      <div className="text-center py-4 text-xs text-[#94a3b8]">
        <div className="font-editorial font-bold text-[#64748b] text-sm">
          {i18n.t('about_app_name')}
        </div>
        <p className="mt-1">
          {i18n.t('about_app_desc')}
        </p>
      </div>
    </div>
  );
};
