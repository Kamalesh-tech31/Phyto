export type SchemeSeverityLevel = 'low' | 'moderate' | 'severe' | 'critical';

export interface SchemeSeverityLogic {
  meaning: string;
  scheme_priority: string;
}

export interface SchemeKBItem {
  id: string;
  name: string;
  jurisdiction: string;
  type: string;
  best_when: string[];
  severity_priority: SchemeSeverityLevel[];
  disease_direct_trigger: boolean | string;
  matching_note?: string;
  official_source?: string;
  covered_crops_from_source?: string[];
  covered_crops_from_kerala_plan?: string[];
  hard_gate?: string[];
  special_rule?: string;
  official_document?: string;
  source_evidence?: string;
  support_examples_from_source?: string[];
}

export interface SchemeKBDocument {
  dataset_name: string;
  version: string;
  purpose: string;
  critical_rule: string;
  severity_logic: {
    low: SchemeSeverityLogic;
    moderate: SchemeSeverityLogic;
    severe: SchemeSeverityLogic;
    critical: SchemeSeverityLogic;
  };
  ranking_rules: string[];
  schemes: SchemeKBItem[];
  implementation_note?: {
    recommended_app_output: string;
    severe_case: string;
    non_severe_case: string;
    verification_message: string;
  };
}

export type FarmerState = 'Kerala' | 'Tamil Nadu' | 'Other';

export interface FarmerLossAssessment {
  affectedAreaRange: '<25%' | '25-50%' | '>50%' | '>70%';
  isSpreading: boolean;
  impact: 'manageable' | 'yield_affected' | 'major_loss' | 'crop_lost';
  confirmedSeverity?: SchemeSeverityLevel;
  state: FarmerState;
  isInsuredOrEnrolled?: boolean;
}

export interface RecommendedSchemeResult {
  scheme: SchemeKBItem;
  rank: number;
  status: 'Potentially Relevant' | 'Eligibility Requires Verification';
  relevanceReason: string;
  importantEligibility: string;
  benefitInfo: string;
  officialReference: {
    source: string;
    document?: string;
    evidence?: string;
  };
}
