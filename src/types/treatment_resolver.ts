export interface CsvPesticideRecord {
  class_id: string;
  crop: string;
  class_name: string;
  type: string;
  tier: string;
  pesticide: string;
  dose: string;
  dose_basis: string;
  pesticide_rate?: string;
  rate_min_inr?: number | null;
  rate_median_inr?: number | null;
  rate_max_inr?: number | null;
  rate_unit?: string;
  price_status: 'available' | 'unavailable' | 'not_researched_this_pass' | string;
  estimate_grade: 'farmer_ready_range' | 'indicative_only' | 'benchmark_only' | 'unavailable' | 'not_researched' | string;
  formulation_match?: string;
  priced_product?: string;
  price_observation_count?: number;
  price_verified_date?: string;
  price_source_urls?: string;
}

export interface ResolvedPesticide {
  name: string;
  dose: string;
  doseBasis: string;
  doseDisplay: string;
  doseNote?: string;
  priceDisplay: string;
  rateUnit?: string;
  rateMin?: number | null;
  rateMax?: number | null;
  rateMedian?: number | null;
  priceStatus: 'available' | 'unavailable' | 'not_researched';
  estimateGrade: 'farmer_ready_range' | 'indicative_only' | 'benchmark_only' | 'unavailable' | 'not_researched';
  formulationMatch?: string;
  badgeLabel?: string;
  badgeType: 'approximate' | 'indicative' | 'benchmark' | 'unavailable';
  gradeSubtext: string;
  stateRestrictionFlag?: string;
  isVectorControl?: boolean;
}

export interface ResolvedTreatment {
  classId: string;
  className: string;
  crop: string;
  type: 'disease' | 'pest' | 'healthy';
  tier: string;
  displayMode:
    | 'treatment'
    | 'no_treatment_needed'
    | 'no_recommendation'
    | 'expert_only'
    | 'crop_prompt'
    | 'vector_control_only';
  displayNote?: string;
  promptText?: string;
  pesticides: ResolvedPesticide[];
  ipm: string[];
  sources: string[];
  safetyDisclaimer: string;
}
