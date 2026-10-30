import { useState, useEffect } from 'react';
import {
  BottomNavTab,
  DiseaseId,
  Language,
  PredictionResult,
  QualityCheckResult,
  ScanHistoryItem,
  ScanStep,
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

export default function App() {
  const isOnline = useConnectivity();
  const [language, setLanguage] = useState<Language>('en');
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

  // Stop speech when tab or step changes
  useEffect(() => {
    speechService.stop();
    setIsSpeaking(false);
  }, [activeTab, scanStep, isSettingsSchemesOpen]);

  // Language toggle (available in Settings)
  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'ml' : 'en'));
  };

  // Global Header Voice / Listen functionality
  const handleGlobalVoiceToggle = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';

    if (activeTab === 'scan') {
      if (scanStep === 'capture') {
        speechText =
          language === 'ml'
            ? 'നിങ്ങളുടെ വിള പരിശോധിക്കുക. ഒരൊറ്റ ഇലയുടെ വ്യക്തമായ ഫോട്ടോയെടുക്കുക. പ്രശ്നവും പരിഹാരവും ഫൈറ്റോ പറയും.'
            : 'Check your crop. Take one clear photo of a single leaf. Phyto tells you what is wrong and what to do.';
      } else if (scanStep === 'photo_check') {
        speechText =
          language === 'ml'
            ? 'ഫോട്ടോ പരിശോധന. വ്യക്തതയും വെളിച്ചവും നല്ലതാണ്. പരിശോധിക്കാൻ പര്യാപ്തമാണ്.'
            : 'Photo check. Sharpness is sharp, light is good, left side has shadow, distance is good. Good enough to analyse.';
      } else if (scanStep === 'analyzing') {
        speechText =
          language === 'ml'
            ? 'ഇല പരിശോധിക്കുന്നു. കോശഘടനകളും കുമിൾ ലക്ഷണങ്ങളും ഓഫ്‌ലൈനായി വിശകലനം ചെയ്യുന്നു.'
            : 'Checking your leaf cells and fungal symptoms offline.';
      } else if (scanStep === 'result') {
        if (prediction?.isUncertain) {
          speechText =
            language === 'ml'
              ? 'കുറഞ്ഞ വിശ്വാസ്യത. ഇതുവരെ ഉറപ്പില്ല. ഫോട്ടോ അവ്യക്തമാണ്. നല്ല വെളിച്ചത്തിൽ ഒരു ചാൺ അകലെ നിന്ന് വീണ്ടും ഫോട്ടോയെടുക്കുക.'
              : 'Low confidence scan. I am not sure yet. The photo is too blurry to tell a disease from a nutrient problem. Please retake photo in daylight.';
        } else {
          speechText =
            language === 'ml'
              ? `ഇല പരിശോധനാ ഫലം: ${prediction?.diseaseNameMl}. ശാസ്ത്രീയ പ്രതിരോധ നിർദ്ദേശങ്ങളും സർക്കാർ പദ്ധതികളും താഴെ കാണാം.`
              : `Leaf diagnosis: ${prediction?.diseaseName}, ${prediction?.category}. Verified prevention guidelines and government schemes are shown below.`;
        }
      } else if (scanStep === 'treatment') {
        speechText =
          language === 'ml'
            ? 'ചികിത്സാ നിർദ്ദേശങ്ങൾ. രോഗബാധയുള്ള അടിയിലെ ഇലകൾ പറിച്ച് നശിപ്പിക്കുക, വൈകുന്നേരങ്ങളിൽ വേപ്പെണ്ണ മിശ്രിതം തളിക്കുക, ചുവട്ടിൽ മാത്രം നനയ്ക്കുക.'
            : 'Management guide. Organic recommendations: Remove and burn infected lower leaves, spray neem-based solution in evening, water at base.';
      } else if (scanStep === 'scheme_context') {
        speechText =
          language === 'ml'
            ? 'സർക്കാർ പദ്ധതി വിവരങ്ങൾ. യോഗ്യതയും അപേക്ഷാ രേഖകളും പരിശോധിച്ച് Krishi Bhavan വഴി ആനുകൂല്യങ്ങൾ നേടുക.'
            : 'Government scheme details. View eligibility and documents to apply through your local agriculture portal or office.';
      }
    } else if (activeTab === 'history') {
      speechText =
        language === 'ml'
          ? 'സ്കാൻ ചരിത്രം. ഫോണിൽ സൂക്ഷിച്ചിരിക്കുന്ന മുൻകാല പരിശോധനാ ഫലങ്ങൾ ഇവിടെ കാണാം.'
          : 'Scan history. View all saved crop leaf diagnoses stored on this device.';
    } else if (activeTab === 'settings') {
      speechText =
        language === 'ml'
          ? 'സെറ്റിംഗ്സും കർഷക സഹായിയും. ഇന്റർനെറ്റ് ഇല്ലാതെയും മോഡൽ ഫോണിൽ സജ്ജമാണ്.'
          : 'Settings and farm assistant. Phyto is an offline-first agricultural assistant ready on this phone.';
    }

    if (speechText) {
      speechService.speak(speechText, language, (speaking) => {
        setIsSpeaking(speaking);
      });
    }
  };

  // Step 1 -> Step 2: Image captured or chosen
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

      // Save to IndexedDB Scan History automatically
      const historyItem: ScanHistoryItem = {
        id: result.id,
        timestamp: result.timestamp,
        imageUrl: result.imageUrl,
        crop: result.crop,
        cropMl: result.cropMl,
        diseaseName: result.diseaseName,
        diseaseNameMl: result.diseaseNameMl,
        diseaseId: result.diseaseId,
        severity: result.severity,
        affectedAreaPercent: result.affectedAreaPercent,
        confidence: result.confidence,
        isUncertain: result.isUncertain,
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

  // Select scan from history
  const handleSelectFromHistory = (item: ScanHistoryItem) => {
    if (item.isUncertain) {
      setPrediction({
        id: item.id,
        timestamp: item.timestamp,
        imageUrl: item.imageUrl,
        crop: item.crop,
        cropMl: item.cropMl,
        diseaseId: item.diseaseId,
        diseaseName: item.diseaseName,
        diseaseNameMl: item.diseaseNameMl,
        category: 'Inconclusive scan',
        categoryMl: 'വ്യക്തമല്ലാത്ത സ്കാൻ',
        confidence: 'low',
        confidenceScore: 0.38,
        affectedAreaPercent: 0,
        severity: item.severity,
        isUncertain: true,
      });
      setScanStep('result');
      setActiveTab('scan');
    } else {
      setPrediction({
        id: item.id,
        timestamp: item.timestamp,
        imageUrl: item.imageUrl,
        crop: item.crop,
        cropMl: item.cropMl,
        diseaseId: item.diseaseId,
        diseaseName: item.diseaseName,
        diseaseNameMl: item.diseaseNameMl,
        category: 'Fungal disease',
        categoryMl: 'ഫംഗസ് രോഗം',
        confidence: item.confidence,
        confidenceScore: 0.94,
        affectedAreaPercent: item.affectedAreaPercent,
        severity: item.severity,
        pestWarning: {
          name: 'Aphids',
          nameMl: 'മുഞ്ഞ (Aphids)',
          severityLabel: 'Pest · moderate',
          severityLabelMl: 'കീടബാധ · ഇടത്തരം',
          details: 'Sap-sucking pest cluster noted on leaf.',
          detailsMl: 'ഇലയിൽ മുഞ്ഞയുടെ സാന്നിധ്യം കണ്ടെത്തി.',
        },
        isUncertain: false,
      });
      setSelectedDiseaseId(item.diseaseId);
      setScanStep('result');
      setActiveTab('scan');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen bg-[#faf9f5] flex flex-col relative shadow-xl border-x border-[#edece4]">
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
                      isOnline={isOnline}
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
