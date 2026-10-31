export type TreatmentDisplayMode =
  | 'full'
  | 'actives_only'
  | 'vector_control_only'
  | 'crop_prompt'
  | 'expert_only'
  | 'no_treatment_needed'
  | 'no_recommendation';

export type TreatmentTier = 'A' | 'B' | 'C' | 'N';

export type DoseBasis =
  | 'per_litre_or_tank'
  | 'per_hectare'
  | 'percent_solution'
  | 'no_numeric_dose';

export interface ChemicalRecommendation {
  active: string;
  dose_text?: string;
  dose_basis?: DoseBasis | string;
  display: boolean;
  note?: string;
  regulatory_flag?: string;
  hidden_reason?: string;
}

export interface CropSpecificManagement {
  display_mode: TreatmentDisplayMode;
  chemical: ChemicalRecommendation[];
  message?: string;
}

export interface PesticideKBRecord {
  class_id: string;
  crop: string;
  class_name: string;
  type: 'disease' | 'healthy' | 'pest';
  tier: TreatmentTier;
  display_mode: TreatmentDisplayMode;
  status: string;
  chemical: ChemicalRecommendation[];
  ipm: string[];
  sources: string[];
  display_note?: string;
  show_badge?: string;
  review_notes?: string;
  requires_user_crop_choice?: boolean;
  prompt_text?: string;
  by_crop?: Record<string, CropSpecificManagement>;
}

export interface PesticideKB {
  dataset_name: string;
  version: string;
  date: string;
  frozen_class_count: number;
  schema_notes: Record<string, string>;
  records: PesticideKBRecord[];
}
