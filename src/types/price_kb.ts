export type EstimateGrade =
  | 'farmer_ready_range'
  | 'indicative_only'
  | 'benchmark_only'
  | 'unavailable'
  | 'not_researched';

export type FormulationMatch = 'exact' | 'unspecified' | 'none_found';

export interface PriceNormalizedSummary {
  n_observations_used: number;
  min: number;
  median: number;
  max: number;
  unit: 'INR/kg' | 'INR/L' | string;
  method?: string;
}

export interface OfficialBenchmark {
  value: number;
  unit: string;
  year: string;
  source: string;
  url?: string;
  price_type: string;
  scope?: string;
}

export interface CostEstimate {
  cost_basis: 'per_litre_of_spray' | 'per_hectare' | string;
  dose_used: string;
  median_price_used: number;
  cost_per_litre_of_spray_inr?: {
    low: number;
    high: number;
  };
  cost_per_hectare_inr?: {
    low: number;
    high: number;
  };
  note?: string;
}

export interface PriceRecord {
  class_id: string;
  crop: string;
  disease_or_pest: string;
  active: string;
  treatment_dose_text: string;
  treatment_dose_basis: string;
  display_eligible: boolean;
  formulation_in_treatment_kb: string;
  price_status: 'available' | 'unavailable' | 'not_researched_this_pass';
  estimate_grade: EstimateGrade;
  grade_reasons: string[];
  priced_product?: string;
  formulation_match?: FormulationMatch;
  observations?: any[];
  normalized_summary?: PriceNormalizedSummary | null;
  official_benchmark?: OfficialBenchmark | null;
  cost_estimate?: CostEstimate | null;
  indicative_cost_estimate?: CostEstimate | null;
  cost_estimate_withheld_reason?: string | null;
  state_restriction_flag?: {
    text: string;
    source: string;
    confidence: string;
  } | null;
  reason?: string;
}

export interface PriceKB {
  dataset_name: string;
  version: string;
  date: string;
  purpose: string;
  scope: {
    frozen_classes: number;
    treatment_source: string;
    price_records: number;
    classes_with_no_price_by_design: string[];
  };
  records: PriceRecord[];
}

export interface CalculatedCostResult {
  hasPrice: boolean;
  estimateGrade: EstimateGrade;
  formulationMatch?: FormulationMatch;
  productPriceDisplay?: string; // e.g. "₹400–₹650/kg"
  treatmentCostDisplay: string; // e.g. "Estimated pesticide cost: ~₹1.45 per litre of spray"
  subtext: string; // e.g. "Approximate retail estimate • Check local shop price"
  isDefinitive: boolean;
  badgeLabel?: string;
  stateRestrictionFlag?: string;
  isVectorControlOnly?: boolean;
  vectorControlNote?: string;
  costEstimateUnavailableReason?: string;
  officialBenchmark?: {
    value: number;
    unit: string;
    scope?: string;
  } | null;
}
