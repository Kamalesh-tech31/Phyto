export type Language = 'en' | 'ta' | 'hi' | 'ml' | 'te';

export interface LanguageOption {
  code: Language;
  label: string; // written in its own script
  script: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', script: 'Latin' },
  { code: 'ta', label: 'தமிழ்', script: 'Tamil' },
  { code: 'hi', label: 'हिन्दी', script: 'Devanagari' },
  { code: 'ml', label: 'മലയാളം', script: 'Malayalam' },
  { code: 'te', label: 'తెలుగు', script: 'Telugu' },
];

export type BottomNavTab = 'scan' | 'history' | 'settings';

export type ScanStep =
  | 'capture'         // Step 1: Scan / Home viewfinder
  | 'photo_check'     // Step 2: Quality checks (sharpness, light, shadow, distance)
  | 'analyzing'       // Step 3: Scanning AI animation
  | 'result'          // Step 4: Diagnosis result (confident or uncertain)
  | 'treatment'       // Guidance detail (Treatment & Prevention tabs + Price outlook)
  | 'scheme_context'; // Contextual scheme detail from Result or Treatment

export type SeverityLevel = 'mild' | 'moderate' | 'severe';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DiseaseId = 'healthy' | 'early_blight' | 'late_blight' | 'uncertain';

export interface QualityCheckResult {
  sharpness: 'sharp' | 'blurry' | 'fair';
  sharpnessPass: boolean;

  light: 'good' | 'too_bright' | 'dim';
  lightPass: boolean;

  shadow: 'none' | 'left_dark' | 'heavy' | 'good';
  shadowPass: boolean;

  distance: 'good' | 'too_far' | 'too_close';
  distancePass: boolean;

  isLeaf: boolean;
  isLeafPass: boolean;
  leafScore?: number;

  isAcceptable: boolean;
  adviceKey?: string;
}

export interface DiseaseKBEntry {
  review_status: string;
  name: string;
  crop: string;
  type: string;
  symptoms: string;
  treatments_organic: {
    step: number;
    text: string;
  }[];
  chemical_caution: {
    headline: string;
    caution: string;
  };
  cost: {
    avg_price: string;
    govt_price: string;
    unit: string;
    note: string;
  };
  prevention: {
    step: number;
    text: string;
  }[];
  fertilizer: string;
  farmer_tip: string;
  voice_text: string;
  voice_treatment?: string;
  voice_prevention?: string;
}

export interface CachedTranslation {
  id: string; // `${lang}:${key}`
  lang: Language;
  key: string;
  hash: string;
  text: string;
  auto: boolean;
  timestamp: number;
}

export interface PredictionResult {
  id: string;
  class_id: string; // e.g. "tomato_early_blight", "tomato_late_blight", "tomato_healthy"
  confidenceScore: number; // e.g. 0.94
  confidence: ConfidenceLevel;
  affectedAreaPercent: number; // e.g. 18
  severity: SeverityLevel;
  isUncertain: boolean;
  imageData: string; // Data URL stored in IndexedDB
  timestamp: number;
  diseaseId?: DiseaseId;
  imageUrl?: string;
  pestWarning?: {
    name: string;
    severityLabel: string;
    details: string;
  };
  notLeaf?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  class_id: string; // language-free class identifier
  confidenceScore: number;
  affectedAreaPercent: number; // severity number
  timestamp: number;
  imageData: string; // Image stored directly in IndexedDB, not external URL
  isUncertain: boolean;
  notLeaf?: boolean;
  imageUrl?: string;
  crop?: string;
  cropMl?: string;
  diseaseName?: string;
  diseaseNameMl?: string;
  diseaseId?: DiseaseId;
  severity?: SeverityLevel;
  confidence?: ConfidenceLevel;
}

export interface SchemeItem {
  id: string;
  lastUpdated: string;
  officialUrl: string;
  subsidyPercentage?: string;
  helpline?: string;
  i18n?: Record<
    Language,
    {
      name: string;
      tag: string;
      benefit: string;
      eligibility: string[];
      documents: string[];
    }
  >;
  name?: string;
  nameMl?: string;
  tag?: string;
  tagMl?: string;
  benefit?: string;
  benefitMl?: string;
  eligibility?: string[];
  eligibilityMl?: string[];
  documents?: string[];
  documentsMl?: string[];
}

export interface FAQItem {
  id: string;
  category: 'disease' | 'prevention' | 'schemes' | 'camera';
  question: string;
  questionMl?: string;
  answer: string;
  answerMl?: string;
  speechText?: string;
  speechTextMl?: string;
}
