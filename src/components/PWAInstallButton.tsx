import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Info } from 'lucide-react';
import { Language } from '../types';
import { i18n } from '../services/i18nService';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ language?: Language }> = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{i18n.t('pwa_ready_banner')}</span>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-white rounded-2xl border border-[#e5e4dc] shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[#162a45]">
              {i18n.t('pwa_install_btn')}
            </h4>
            <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
              {i18n.t('pwa_install_desc')}
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-[#0b72c9] hover:bg-[#085da5] text-white rounded-xl text-xs font-semibold shadow-xs active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{i18n.t('take_photo_btn') ? i18n.t('pwa_install_btn').split(' ')[0] : 'Install'}</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-[#162a45] mb-3">
              <Info className="w-5 h-5 text-[#0b72c9]" />
              <h3 className="font-semibold text-base">
                {i18n.t('pwa_ios_title')}
              </h3>
            </div>
            <div className="space-y-2 text-xs text-[#475569] leading-relaxed">
              <p>1. {i18n.t('pwa_ios_step1')}</p>
              <p>2. {i18n.t('pwa_ios_step2')}</p>
              <p>3. {i18n.t('pwa_ios_step3')}</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-2xl bg-[#162a45] py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              {i18n.t('pwa_ios_done')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
