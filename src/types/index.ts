export type Language = 'en' | 'ta' | 'ml' | 'hi' | 'te';

export type TextSize = 'small' | 'default' | 'large';
export type ThemeMode = 'light' | 'dark';

export interface PhytoSettings {
  language: Language;
  textSize: TextSize;
  theme: ThemeMode;
}

export type BottomNavTab = 'scan' | 'history' | 'settings';

export type ScanStep =
  | 'capture'         // Step 1: Scan / Home viewfinder
  | 'photo_check'     // Step 2: Quality checks (sharpness, light, shadow, distance)
  | 'analyzing'       // Step 3: Scanning AI animation
  | 'result'          // Step 4: Diagnosis result (confident, ambiguous, uncertain, or not-plant)
  | 'treatment'       // Guidance detail (Treatment & Prevention tabs + Price outlook)
  | 'scheme_context'; // Contextual scheme detail from Result or Treatment

export type SeverityLevel = 'mild' | 'moderate' | 'severe';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DiseaseId = 'healthy' | 'early_blight' | 'late_blight' | 'uncertain' | string;

export type InferenceStatus = 'CONFIDENT' | 'AMBIGUOUS' | 'UNCERTAIN' | 'NOT_PLANT';

export interface CandidatePrediction {
  label: string;
  prob: number; // 0 to 1
  plant: string;
  plantMl: string;
  condition: string;
  conditionMl: string;
  category: string;
  categoryMl: string;
  diseaseId: string;
  isHealthy: boolean;
  isPest: boolean;
  isComingSoon?: boolean;
}

export interface QualityCheckResult {
  sharpness: 'sharp' | 'blurry' | 'fair';
  sharpnessLabel: string;
  sharpnessLabelMl: string;
  sharpnessPass: boolean;

  light: 'good' | 'too_bright' | 'dim';
  lightLabel: string;
  lightLabelMl: string;
  lightPass: boolean;

  shadow: 'none' | 'left_dark' | 'heavy' | 'good';
  shadowLabel: string;
  shadowLabelMl: string;
  shadowPass: boolean;

  distance: 'good' | 'too_far' | 'too_close';
  distanceLabel: string;
  distanceLabelMl: string;
  distancePass: boolean;

  isAcceptable: boolean;
  advice: string;
  adviceMl: string;
  quality?: {
    ok: boolean;
    reason?: 'blur' | 'dark' | 'shadow' | 'distance';
  };
}

export interface DiseaseGuidance {
  id: DiseaseId;
  name: string;
  nameMl: string;
  crop: string;
  cropMl: string;
  category: string;
  categoryMl: string;
  summary: string;
  summaryMl: string;
  organicTreatments: {
    step: number;
    text: string;
    textMl: string;
  }[];
  chemicalCaution: {
    headline: string;
    headlineMl: string;
    caution: string;
    cautionMl: string;
  };
  costEstimate: {
    avgPrice: string;
    govtPrice: string;
    unit: string;
    unitMl: string;
    note: string;
    noteMl: string;
  };
  preventions: {
    step: number;
    text: string;
    textMl: string;
  }[];
}

export interface PredictionResult {
  id: string;
  crop: string;
  cropMl: string;
  diseaseId: DiseaseId;
  diseaseName: string;
  diseaseNameMl: string;
  category: string;
  categoryMl: string;
  confidence: ConfidenceLevel;
  confidenceScore: number; // e.g. 0.94
  imageUrl: string;
  timestamp: number;
  inferenceStatus: InferenceStatus;
  topCandidates: CandidatePrediction[];
  secondCandidate?: CandidatePrediction;
  isUncertain: boolean;
  isAmbiguous: boolean;
  isNotPlant: boolean;
  isHealthy: boolean;
  isPest: boolean;
  isComingSoon: boolean;
  uncertaintyReason?: string;
  uncertaintyReasonMl?: string;
  modelClassName?: string;
  inferenceMs?: number;
  modelVersion?: string;

  // Optional backward-compatibility fields
  severity?: SeverityLevel;
  affectedAreaPercent?: number;
  status?: 'supported' | 'healthy' | 'pest' | 'coming_soon';
  grapeNotice?: boolean;
  pestNotice?: boolean;
  pestWarning?: {
    name: string;
    nameMl: string;
    severityLabel: string;
    severityLabelMl: string;
    details: string;
    detailsMl: string;
  };
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  crop: string;
  cropMl: string;
  diseaseName: string;
  diseaseNameMl: string;
  diseaseId: DiseaseId;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  inferenceStatus: 'CONFIDENT' | 'AMBIGUOUS';
  secondDiseaseName?: string;
  severity?: SeverityLevel;
  affectedAreaPercent?: number;
  isUncertain?: boolean;
}

export interface SchemeItem {
  id: string;
  name: string;
  nameMl: string;
  tag: string;
  tagMl: string;
  benefit: string;
  benefitMl: string;
  eligibility: string[];
  eligibilityMl: string[];
  documents: string[];
  documentsMl: string[];
  lastUpdated: string;
  officialUrl: string;
  subsidyPercentage?: string;
  helpline?: string;
}

export interface FAQItem {
  id: string;
  category: 'disease' | 'prevention' | 'schemes' | 'camera';
  question: string;
  questionMl: string;
  answer: string;
  answerMl: string;
  speechText?: string;
  speechTextMl?: string;
}
