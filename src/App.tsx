import { useState, useEffect } from 'react';
import {
  BottomNavTab,
  Language,
  PredictionResult,
  QualityCheckResult,
  ScanHistoryItem,
  ScanStep,
} from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VoiceGuideButton } from './components/VoiceGuideButton';
import { ScanHome } from './features/scan/ScanHome';
import { PhotoCheck } from './features/scan/PhotoCheck';
import { AnalyzingLeaf } from './features/scan/AnalyzingLeaf';
import { ResultConfident } from './features/scan/ResultConfident';
import { ResultUncertain } from './features/scan/ResultUncertain';
import { ResultNotLeaf } from './features/scan/ResultNotLeaf';
import { TreatmentDetail } from './features/guidance/TreatmentDetail';
import { SchemesList } from './features/schemes/SchemesList';
import { HistoryList } from './features/history/HistoryList';
import { SettingsView } from './features/settings/SettingsView';
import { useConnectivity } from './services/connectivityService';
import { predictionService } from './services/predictionService';
import { storageService } from './services/storageService';
import { speechService } from './services/speechService';
import { i18n } from './services/i18nService';

export default function App() {
  const isOnline = useConnectivity();
  const [language, setLanguage] = useState<Language>(() => i18n.getLanguage());
  const [activeTab, setActiveTab] = useState<BottomNavTab>('scan');

  // Scan Flow State
  const [scanStep, setScanStep] = useState<ScanStep>('capture');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [samplePreset, setSamplePreset] = useState<string | undefined>('early_blight');
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>('tomato_early_blight');
  const [treatmentTab, setTreatmentTab] = useState<'treatment' | 'prevention'>('treatment');

  // Contextual Schemes Navigation State
  const [contextualSchemeId, setContextualSchemeId] = useState<string>('subhiksha-keralam');
  const [schemesReturnStep, setSchemesReturnStep] = useState<ScanStep>('result');
  const [isSettingsSchemesOpen, setIsSettingsSchemesOpen] = useState<boolean>(false);

  // Service Worker Update State
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setSwUpdateAvailable(true);
      });
    }
  }, []);

  // Stop speech when tab or step changes
  useEffect(() => {
    speechService.stop();
  }, [activeTab, scanStep, isSettingsSchemesOpen, treatmentTab]);

  // Handle immediate language change across whole app
  const handleLanguageChange = (newLang: Language) => {
    speechService.stop();
    i18n.setLanguage(newLang);
    setLanguage(newLang);
  };

  // Step 1 -> Step 2: Image captured or chosen
  const handleImageSelected = async (imageUrl: string, presetType?: string) => {
    setSelectedImage(imageUrl);
    setSamplePreset(presetType);

    // Compute quality check with on-device botanical leaf verification
    const quality = await predictionService.checkQuality(imageUrl, presetType);
    setQualityCheck(quality);
    setScanStep('photo_check');
  };

  // Step 2 -> Step 3: Run AI analysis
  const handleStartAnalysis = async (notLeaf = false) => {
    setScanStep('analyzing');

    try {
      const result = await predictionService.predict(selectedImage, samplePreset);
      if (notLeaf) {
        result.notLeaf = true;
      }
      setPrediction(result);
      setSelectedDiseaseId(result.class_id);

      // Save to IndexedDB Scan History with clean language-free properties
      const historyItem: ScanHistoryItem = {
        id: result.id,
        timestamp: result.timestamp,
        imageData: result.imageData || selectedImage,
        class_id: result.class_id,
        affectedAreaPercent: result.affectedAreaPercent,
        confidenceScore: result.confidenceScore,
        isUncertain: result.isUncertain,
        notLeaf: result.notLeaf,
      };
      await storageService.saveScan(historyItem);

      // Move to Result
      setScanStep('result');
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setScanStep('capture');
    }
  };

  // Retake photo action
  const handleRetake = () => {
    setScanStep('capture');
    setSelectedImage('');
    setQualityCheck(null);
    setPrediction(null);
  };

  // Open related scheme contextually from Result screen
  const handleViewRelatedSchemeFromResult = () => {
    setContextualSchemeId('subhiksha-keralam');
    setSchemesReturnStep('result');
    setScanStep('scheme_context');
  };

  // Open related scheme contextually from Treatment screen
  const handleViewRelatedSchemeFromTreatment = () => {
    setContextualSchemeId('subhiksha-keralam');
    setSchemesReturnStep('treatment');
    setScanStep('scheme_context');
  };

  // Select scan from history - loads cleanly and renders in currently active language
  const handleSelectFromHistory = (item: ScanHistoryItem) => {
    const classId = item.class_id || (item.diseaseId as string) || 'tomato_healthy';
    const confidenceScore = item.confidenceScore ?? (item.isUncertain ? 0.4 : 0.94);
    const affectedArea = item.affectedAreaPercent ?? (item.severity === 'severe' ? 42 : item.severity === 'moderate' ? 25 : 18);

    setPrediction({
      id: item.id,
      timestamp: item.timestamp,
      class_id: classId,
      confidenceScore,
      confidence: confidenceScore >= 0.85 ? 'high' : confidenceScore >= 0.65 ? 'medium' : 'low',
      affectedAreaPercent: affectedArea,
      severity: affectedArea >= 30 ? 'severe' : affectedArea >= 10 ? 'moderate' : 'mild',
      isUncertain: item.isUncertain,
      notLeaf: item.notLeaf,
      imageData: item.imageData || item.imageUrl || '',
      imageUrl: item.imageData || item.imageUrl || '',
      pestWarning:
        classId === 'tomato_early_blight'
          ? {
              name: 'Aphids',
              severityLabel: 'Pest · moderate',
              details: 'Small cluster of sap-sucking insects detected near midrib vein.',
            }
          : undefined,
    });
    setSelectedDiseaseId(classId);
    setScanStep('result');
    setActiveTab('scan');
  };

  // Centrally computed voice guide narration properties for the single global button
  const getActiveVoiceProps = (): { pageId: string; customText?: string; clipId?: string } => {
    if (isSettingsSchemesOpen) {
      return { pageId: 'schemes', clipId: 'page_schemes' };
    }

    if (activeTab === 'history') {
      return { pageId: 'history', clipId: 'page_history' };
    }

    if (activeTab === 'settings') {
      return { pageId: 'settings', clipId: 'page_settings' };
    }

    // activeTab === 'scan'
    switch (scanStep) {
      case 'capture':
        return { pageId: 'scan_home', clipId: 'page_scan_home' };
      case 'photo_check': {
        if (qualityCheck?.isLeafPass === false) {
          return {
            pageId: 'photo_check_not_leaf',
            customText: i18n.t('voice_not_leaf'),
            clipId: 'voice_not_leaf',
          };
        }
        return { pageId: 'photo_check', clipId: 'page_photo_check' };
      }
      case 'analyzing':
        return { pageId: 'analyzing', clipId: 'page_analyzing' };
      case 'result': {
        if (prediction?.notLeaf) {
          return {
            pageId: 'result_not_leaf',
            customText: i18n.t('voice_not_leaf'),
            clipId: 'voice_not_leaf',
          };
        }
        if (prediction?.isUncertain) {
          return { pageId: 'result_uncertain', clipId: 'page_result_uncertain' };
        }
        const classId = prediction?.class_id || selectedDiseaseId;
        const kb = i18n.getKB(classId);
        const severityWord =
          prediction?.severity === 'severe'
            ? i18n.t('severity_severe')
            : prediction?.severity === 'moderate'
            ? i18n.t('severity_moderate')
            : i18n.t('severity_mild');
        const confidenceWord =
          (prediction?.confidenceScore ?? 0.9) >= 0.8
            ? i18n.t('confidence_high')
            : i18n.t('confidence_medium');

        const firstStep = kb?.treatments_organic?.[0]?.text;
        const resultTemplate = i18n.t('voice_result_template', {
          disease_name: kb?.name || classId,
          severity_word: severityWord,
          confidence_word: confidenceWord,
        });

        const narration = firstStep ? `${resultTemplate} ${firstStep}` : resultTemplate;

        return {
          pageId: 'result',
          customText: narration,
          clipId: `${classId}_overview`,
        };
      }
      case 'treatment': {
        const classId = selectedDiseaseId || 'tomato_early_blight';
        const kb = i18n.getKB(classId) || i18n.getKB('tomato_early_blight');
        if (treatmentTab === 'prevention') {
          return {
            pageId: 'prevention',
            customText: kb?.voice_prevention,
            clipId: `${classId}_prevention`,
          };
        }
        return {
          pageId: 'treatment',
          customText: kb?.voice_treatment,
          clipId: `${classId}_treatment`,
        };
      }
      case 'scheme_context':
        return { pageId: 'schemes', clipId: 'page_schemes' };
      default:
        return { pageId: 'scan_home', clipId: 'page_scan_home' };
    }
  };

  const activeVoiceProps = getActiveVoiceProps();

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center">
      {/* Phone Shell: max-w-md, h-screen, relative, overflow-hidden */}
      <div className="w-full max-w-md h-screen max-h-screen bg-[#faf9f5] flex flex-col relative shadow-xl border-x border-[#edece4] overflow-hidden">
        {/* Global Persistent Header: Phyto Logo | Offline status | 5-Language Dropdown */}
        <Header
          language={language}
          isOnline={isOnline}
          onLanguageChange={handleLanguageChange}
          onTitleClick={() => {
            setActiveTab('scan');
            setScanStep('capture');
            setIsSettingsSchemesOpen(false);
          }}
        />

        {/* Update Available Banner if new Service Worker build is ready */}
        {swUpdateAvailable && (
          <div className="bg-[#0b72c9] text-white text-xs px-4 py-2 flex items-center justify-between shrink-0 shadow-xs z-50">
            <span>{i18n.t('update_available')}</span>
            <button
              onClick={() => window.location.reload()}
              className="underline font-bold text-white cursor-pointer hover:text-blue-100"
            >
              {i18n.t('btn_refresh')}
            </button>
          </div>
        )}

        {/* Main Scrollable Content Area with bottom padding to avoid button collision */}
        <main className="flex-1 w-full overflow-y-auto pb-28">
          {activeTab === 'scan' && (
            <>
              {/* Step 1: Capture / Home */}
              {scanStep === 'capture' && (
                <ScanHome
                  language={language}
                  onImageSelected={handleImageSelected}
                />
              )}

              {/* Step 2: Photo Check */}
              {scanStep === 'photo_check' && qualityCheck && (
                <PhotoCheck
                  imageUrl={selectedImage}
                  presetType={samplePreset}
                  quality={qualityCheck}
                  language={language}
                  onAnalyse={handleStartAnalysis}
                  onRetake={handleRetake}
                />
              )}

              {/* Step 3: AI Analyzing Animation */}
              {scanStep === 'analyzing' && (
                <AnalyzingLeaf
                  imageUrl={selectedImage}
                  presetType={samplePreset}
                  language={language}
                />
              )}

              {/* Step 4: Diagnosis Result (Confident vs Uncertain vs Not Leaf) */}
              {scanStep === 'result' && prediction && (
                <>
                  {prediction.notLeaf ? (
                    <ResultNotLeaf
                      imageUrl={prediction.imageData || selectedImage}
                      language={language}
                      onRetake={handleRetake}
                    />
                  ) : prediction.isUncertain ? (
                    <ResultUncertain
                      prediction={prediction}
                      language={language}
                      isOnline={isOnline}
                      onRetake={handleRetake}
                    />
                  ) : (
                    <ResultConfident
                      prediction={prediction}
                      language={language}
                      onBack={handleRetake}
                      onSeeTreatment={() => setScanStep('treatment')}
                      onViewRelatedScheme={handleViewRelatedSchemeFromResult}
                    />
                  )}
                </>
              )}

              {/* Step 5: Treatment & Prevention Detail Guidance + Price Outlook */}
              {scanStep === 'treatment' && (
                <TreatmentDetail
                  diseaseId={selectedDiseaseId}
                  language={language}
                  activeTab={treatmentTab}
                  onTabChange={setTreatmentTab}
                  onBack={() => setScanStep('result')}
                  onNavigateToSchemes={handleViewRelatedSchemeFromTreatment}
                />
              )}

              {/* Contextual Related Schemes View (Result → Related Schemes) */}
              {scanStep === 'scheme_context' && (
                <SchemesList
                  language={language}
                  isOnline={isOnline}
                  highlightSchemeId={contextualSchemeId}
                  onBack={() => setScanStep(schemesReturnStep)}
                />
              )}
            </>
          )}

          {activeTab === 'history' && (
            <HistoryList
              language={language}
              onSelectScan={handleSelectFromHistory}
            />
          )}

          {activeTab === 'settings' && (
            <>
              {isSettingsSchemesOpen ? (
                <SchemesList
                  language={language}
                  isOnline={isOnline}
                  onBack={() => setIsSettingsSchemesOpen(false)}
                />
              ) : (
                <SettingsView
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  isOnline={isOnline}
                  onOpenSchemes={() => setIsSettingsSchemesOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* ONE Global Voice Guide Button: Positioned absolute inside the phone shell above BottomNav */}
        <VoiceGuideButton
          pageId={activeVoiceProps.pageId}
          customText={activeVoiceProps.customText}
          clipId={activeVoiceProps.clipId}
        />

        {/* Bottom Persistent Navigation: Scan | History | Settings */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSettingsSchemesOpen(false);
          }}
          language={language}
        />
      </div>
    </div>
  );
}
