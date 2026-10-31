export type FrozenCrop = 'tomato' | 'potato' | 'corn' | 'rice';

export type SupportedState = 'TN' | 'KL' | 'UP' | 'AP' | 'OTHER' | '';

export type FieldDamageRange = '<25%' | '25-50%' | '>50%' | '>70%' | '';

export interface StateOption {
  id: SupportedState;
  labelKey: string;
  defaultLabel: string;
}

export interface RestrictedPreventionEntry {
  crop: FrozenCrop;
  class_name: string;
  class_type: 'disease' | 'healthy' | 'pest';
  prevention: string[];
  local_prevention?: string[];
  notes?: string[];
  sources?: string[];
}

export interface PreventionLookupResult {
  entry: RestrictedPreventionEntry | null;
  isPest: boolean;
  isHealthy: boolean;
  isFallbackEnglish: boolean;
  className: string;
  crop: FrozenCrop | null;
}

export interface SchemeV3 {
  scheme_id: string;
  jurisdiction: string;
  state_filter: string;
  name: string;
  category: string;
  model_crops: string[];
  trigger: string[];
  why_relevant: string;
  hard_gates: string[];
  important_warning?: string;
  official_source?: string;
  official_source_pdf?: string;
  official_portal?: string;
  official_state_page?: string;
  application_portal?: string;
}

export interface SchemeV2 {
  id: string;
  name: string;
  jurisdiction: string;
  type: string;
  best_when?: string[];
  severity_priority?: string[];
  disease_direct_trigger?: boolean | string;
  matching_note?: string;
  official_source?: string;
  covered_crops_from_source?: string[];
  hard_gate?: string[];
  source_evidence?: string;
}

export interface SchemeCardDisplay {
  scheme_id: string;
  scheme_name: string;
  jurisdiction: string;
  crop: string;
  group: 'crop_support' | 'crop_loss';
  why_relevant: string;
  hard_gates: string[];
  important_warning: string;
  official_link?: string;
  isRelevantNow?: boolean;
  isDistrictSpecific?: boolean;
}

export interface GroupedSchemesResult {
  cropSupportSchemes: SchemeCardDisplay[];
  cropLossSchemes: SchemeCardDisplay[];
  totalCount: number;
  hasStateSpecificSchemes: boolean;
  selectedState: SupportedState;
  effectiveSeverity: 'low' | 'moderate' | 'severe' | 'critical';
}
