export type Language = 'en' | 'ml';

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
export type DiseaseId =
  | 'healthy'
  | 'early_blight'
  | 'late_blight'
  | 'uncertain'
  | 'rice_blast'
  | 'chilli_damping'
  | 'unknown_disease'
  | string;

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
  affectedAreaPercent: number; // e.g. 18
  severity: SeverityLevel;
  pestWarning?: {
    name: string;
    nameMl: string;
    severityLabel: string;
    severityLabelMl: string;
    details: string;
    detailsMl: string;
  };
  isUncertain: boolean;
  uncertaintyReason?: string;
  uncertaintyReasonMl?: string;
  imageUrl: string;
  timestamp: number;
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
  severity: SeverityLevel;
  affectedAreaPercent: number;
  confidence: ConfidenceLevel;
  isUncertain: boolean;
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
