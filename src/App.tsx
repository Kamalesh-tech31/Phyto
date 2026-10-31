import { useState, useEffect } from 'react';
import {
  BottomNavTab,
  DiseaseId,
  Language,
  PredictionResult,
  QualityCheckResult,
  ScanHistoryItem,
  ScanStep,
  VoiceSequenceItem,
} from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ScanHome } from './features/scan/ScanHome';
import { PhotoCheck } from './features/scan/PhotoCheck';
import { AnalyzingLeaf } from './features/scan/AnalyzingLeaf';
import { ResultConfident } from './features/scan/ResultConfident';
import { ResultUncertain } from './features/scan/ResultUncertain';
import { TreatmentDetail } from './features/guidance/TreatmentDetail';
import { SchemesList } from './features/schemes/SchemesList';
import { HistoryList } from './features/history/HistoryList';
import { SettingsView } from './features/settings/SettingsView';
import { useConnectivity } from './services/connectivityService';
import { predictionService } from './services/predictionService';
import { storageService } from './services/storageService';
import { speechService } from './services/speechService';
import { t } from './services/i18n';
import { useSettings } from './services/settingsService';

export default function App() {
  const isOnline = useConnectivity();
  const { settings, setLanguage } = useSettings();
  const language = settings.language;
  const [activeTab, setActiveTab] = useState<BottomNavTab>('scan');

  // Voice speech state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Scan Flow State
  const [scanStep, setScanStep] = useState<ScanStep>('capture');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [samplePreset, setSamplePreset] = useState<string | undefined>('early_blight');
  const [qualityCheck, setQualityCheck] = useState<QualityCheckResult | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<DiseaseId>('early_blight');

  // Contextual Schemes Navigation State
  const [contextualSchemeId, setContextualSchemeId] = useState<string>('subhiksha-keralam');
  const [schemesReturnStep, setSchemesReturnStep] = useState<ScanStep>('result');
  const [isSettingsSchemesOpen, setIsSettingsSchemesOpen] = useState<boolean>(false);

  // Auto-register speech service state listener
  useEffect(() => {
    speechService.registerStateListener((state) => {
      setIsSpeaking(state === 'speaking');
    });
    return () => {
      speechService.unregisterStateListener();
      speechService.stop();
    };
  }, []);

  // Stop speech when tab or step or language changes
  useEffect(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, [activeTab, scanStep, isSettingsSchemesOpen, language]);

  // Language toggle (available in Settings)
  const handleLanguageToggle = () => {
    setLanguage(language === 'en' ? 'ml' : 'en');
  };

  // Global Header Voice / Listen functionality
  const handleGlobalVoiceToggle = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    if (activeTab === 'scan') {
      if (scanStep === 'capture') {
        speechService.speak({
          clipId: 'page_scan_home',
          text: t('voice_guide_scan_home', undefined, language),
          language,
          onStateChange: (state) => setIsSpeaking(state === 'speaking'),
        });
        return;
      } else if (scanStep === 'photo_check') {
        speechService.speak({
          clipId: 'page_photo_check',
          text: t('voice_guide_photo_check', undefined, language),
          language,
          onStateChange: (state) => setIsSpeaking(state === 'speaking'),
        });
        return;
      } else if (scanStep === 'analyzing') {
        speechService.speak({
          clipId: 'page_analyzing',
          text: t('voice_guide_analyzing', undefined, language),
          language,
          onStateChange: (state) => setIsSpeaking(state === 'speaking'),
        });
        return;
      } else if (scanStep === 'result') {
        if (!prediction) return;

        if (prediction.isNotPlant) {
          speechService.speak({
            clipId: 'voice_not_plant',
            text: t('voice_not_plant', undefined, language),
            language,
            onStateChange: (state) => setIsSpeaking(state === 'speaking'),
          });
          return;
        }

        if (prediction.isUncertain) {
          speechService.speak({
            clipId: 'voice_result_uncertain',
            text: t('voice_result_uncertain', undefined, language),
            language,
            onStateChange: (state) => setIsSpeaking(state === 'speaking'),
          });
          return;
        }

        // Build result voice from short clips played in sequence (Directive 3):
        // 1. Class overview
        // 2. Certainty band (high, medium, low)
        // 3. 'Also possible' intro + second candidate class clip (if ambiguous)
        // 4. Grape / Pest special notices
        const items: VoiceSequenceItem[] = [];

        // 1. Overview clip
        const diseaseIdentifier = (prediction.diseaseId || 'healthy').toLowerCase();
        const cropLower = (prediction.crop || '').toLowerCase();
        const classKey = `${cropLower}_${diseaseIdentifier}_overview`;
        items.push({
          clipId: classKey,
          text: t(classKey, undefined, language) || `${prediction.crop}: ${prediction.diseaseName}`,
        });

        // 2. Certainty band
        const score = prediction.confidenceScore ?? 0;
        const bandKey = score >= 0.8 ? 'certainty_band_high' : (score >= 0.6 ? 'certainty_band_medium' : 'certainty_band_low');
        items.push({
          clipId: bandKey,
          text: t(bandKey, undefined, language),
        });

        // 3. Ambiguous check
        if (prediction.isAmbiguous && prediction.secondCandidate) {
          items.push({
            clipId: 'also_possible_intro',
            text: t('also_possible_intro', undefined, language),
          });
          const secondClassKey = `${prediction.secondCandidate.diseaseId}_overview`;
          items.push({
            clipId: secondClassKey,
            text: t(secondClassKey, undefined, language) || prediction.secondCandidate.condition,
          });
        }

        // 4. Grape / Pest special notices
        if (cropLower === 'grape') {
          items.push({
            clipId: 'grape_notice_voice',
            text: t('grape_notice_voice', undefined, language),
          });
        } else if (prediction.isPest) {
          items.push({
            clipId: 'pest_notice_voice',
            text: t('pest_notice_voice', undefined, language),
          });
        }

        speechService.speakSequence(items, language, {
          onStateChange: (state) => setIsSpeaking(state === 'speaking'),
        });
        return;
      } else if (scanStep === 'treatment') {
        const diseaseIdentifier = (prediction?.diseaseId || 'healthy').toLowerCase();
        const cropLower = (prediction?.crop || '').toLowerCase();
        const treatKey = `${cropLower}_${diseaseIdentifier}_treatment`;
        speechService.speak({
          clipId: treatKey,
          text: t(treatKey, undefined, language) || t('view_treatment_prevention', undefined, language),
          language,
          onStateChange: (state) => setIsSpeaking(state === 'speaking'),
        });
        return;
      }
    } else if (activeTab === 'history') {
      speechService.speak({
        clipId: 'page_history',
        text: t('voice_guide_history', undefined, language),
        language,
        onStateChange: (state) => setIsSpeaking(state === 'speaking'),
      });
      return;
    } else if (activeTab === 'settings') {
      speechService.speak({
        clipId: 'page_settings',
        text: t('voice_guide_settings', undefined, language),
        language,
        onStateChange: (state) => setIsSpeaking(state === 'speaking'),
      });
      return;
    } else if (activeTab === 'schemes') {
      speechService.speak({
        clipId: 'page_schemes',
        text: t('voice_guide_schemes', undefined, language),
        language,
        onStateChange: (state) => setIsSpeaking(state === 'speaking'),
      });
      return;
    }
  };

  const handleImageSelected = async (imageUrl: string, presetType?: string) => {
    setSelectedImage(imageUrl);
    setSamplePreset(presetType);

    // Compute quality check
    const quality = await predictionService.checkQuality(imageUrl, presetType);
    setQualityCheck(quality);
    setScanStep('photo_check');
  };

  // Step 2 -> Step 3: Run AI analysis
  const handleStartAnalysis = async () => {
    setScanStep('analyzing');

    try {
      const result = await predictionService.predict(selectedImage, samplePreset);
      setPrediction(result);
      setSelectedDiseaseId(result.diseaseId);

      // Save to IndexedDB Scan History ONLY if status is CONFIDENT or AMBIGUOUS (never UNCERTAIN or NOT_PLANT)
      if (
        result.inferenceStatus === 'CONFIDENT' ||
        result.inferenceStatus === 'AMBIGUOUS'
      ) {
        const historyItem: ScanHistoryItem = {
          id: result.id,
          timestamp: result.timestamp,
          imageUrl: result.imageUrl,
          crop: result.crop,
          cropMl: result.cropMl,
          diseaseName: result.diseaseName,
          diseaseNameMl: result.diseaseNameMl,
          diseaseId: result.diseaseId,
          confidence: result.confidence,
          confidenceScore: result.confidenceScore,
          inferenceStatus: result.inferenceStatus,
          secondDiseaseName: result.secondCandidate?.condition,
        };
        await storageService.saveScan(historyItem);
      }

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

  // Select scan from history
  const handleSelectFromHistory = (item: ScanHistoryItem) => {
    setPrediction({
      id: item.id,
      timestamp: item.timestamp,
      imageUrl: item.imageUrl,
      crop: item.crop,
      cropMl: item.cropMl,
      diseaseId: item.diseaseId,
      diseaseName: item.diseaseName,
      diseaseNameMl: item.diseaseNameMl,
      category: 'Diagnostic result',
      categoryMl: 'പരിശോധനാ ഫലം',
      confidence: item.confidence,
      confidenceScore: item.confidenceScore || 0.9,
      inferenceStatus: item.inferenceStatus || 'CONFIDENT',
      topCandidates: [
        {
          label: item.diseaseId,
          prob: item.confidenceScore || 0.9,
          plant: item.crop,
          plantMl: item.cropMl,
          condition: item.diseaseName,
          conditionMl: item.diseaseNameMl,
          category: 'Diagnostic result',
          categoryMl: 'പരിശോധനാ ഫലം',
          diseaseId: item.diseaseId,
          isHealthy:
            item.diseaseId === 'healthy' ||
            item.diseaseName.toLowerCase().includes('healthy'),
          isPest: item.diseaseId.startsWith('pest_'),
          isComingSoon:
            item.crop === 'Grape' || item.diseaseId.startsWith('grape_'),
        },
      ],
      isUncertain: false,
      isAmbiguous: item.inferenceStatus === 'AMBIGUOUS',
      isNotPlant: false,
      isHealthy:
        item.diseaseId === 'healthy' ||
        item.diseaseName.toLowerCase().includes('healthy'),
      isPest: item.diseaseId.startsWith('pest_'),
      isComingSoon:
        item.crop === 'Grape' || item.diseaseId.startsWith('grape_'),
    });
    setSelectedDiseaseId(item.diseaseId);
    setScanStep('result');
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col items-center overflow-x-hidden transition-colors">
      <div className="w-full max-w-md min-h-screen bg-[var(--color-bg)] flex flex-col relative transition-colors app-column">
        {/* Global Persistent Header: Phyto | Online/Offline status | Voice */}
        <Header
          language={language}
          isOnline={isOnline}
          isSpeaking={isSpeaking}
          onVoiceToggle={handleGlobalVoiceToggle}
          onTitleClick={() => {
            setActiveTab('scan');
            setScanStep('capture');
            setIsSettingsSchemesOpen(false);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-y-auto pb-4">
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

              {/* Step 4: Diagnosis Result (Confident vs Uncertain) */}
              {scanStep === 'result' && prediction && (
                <>
                  {prediction.isUncertain ? (
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
                  crop={prediction?.crop}
                  diseaseName={prediction?.diseaseName}
                  language={language}
                  onBack={() => setScanStep('result')}
                />
              )}

              {/* Contextual Related Schemes View (Result → Related Schemes) */}
              {scanStep === 'scheme_context' && (
                <SchemesList
                  prediction={prediction}
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
                  onLanguageToggle={handleLanguageToggle}
                  isOnline={isOnline}
                  onOpenSchemes={() => setIsSettingsSchemesOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Persistent Navigation: ONLY Scan | History | Settings */}
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
