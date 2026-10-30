export type FrozenCrop = 'tomato' | 'potato' | 'corn' | 'rice';

export type SupportedState = 'TN' | 'KL' | 'UP' | 'AP' | 'CENTRAL';

export interface StateOption {
  id: SupportedState;
  label: string;
  meaning?: string;
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

export interface RestrictedPreventionKB {
  dataset_name: string;
  version: string;
  scope: {
    crops: string[];
    total_classes: number;
    disease_and_healthy_classes: number;
    pest_classes: number;
    healthy_classes: number;
    actual_non_healthy_classes: number;
    note: string;
  };
  entries: RestrictedPreventionEntry[];
}

export interface SchemeV3 {
  scheme_id: string;
  jurisdiction: string;
  state_filter: SupportedState;
  name: string;
  category: string;
  model_crops: FrozenCrop[];
  trigger: string[];
  why_relevant: string;
  hard_gates: string[];
  important_warning?: string;
  official_source?: string;
  official_source_pdf?: string;
  official_portal?: string;
  official_state_page?: string;
  application_portal?: string;
  supporting_official_document?: string;
  disease_rule?: string;
  important_loss_rule?: string;
  crop_note?: string;
  tomato_note?: string;
  english_interpretation_of_official_up_source?: {
    paddy_rice?: string;
    maize_corn?: string;
    potato?: string;
    tomato?: string;
  };
}

export interface SchemeKBV3 {
  dataset_name: string;
  version: string;
  purpose: string;
  important_scope_rule: {
    model_crops: FrozenCrop[];
    model_classes: number;
    state_options: StateOption[];
    others_is_not_all_states: boolean;
  };
  severity_policy: {
    show_schemes_only_for: string[];
    do_not_show_for: string[];
    severity_source: string;
    never_infer_severity_from_confidence: boolean;
    never_infer_severity_from_class_name: boolean;
  };
  recommendation_policy: {
    maximum_cards: number;
    rank_by: string[];
    if_eligibility_cannot_be_verified: string;
    no_generic_scheme_dump: boolean;
  };
  ui_copy: {
    section_title: string;
    badge: string;
    card_status: string;
    cta: string;
    disclaimer: string;
  };
  schemes: SchemeV3[];
  no_recommendation_rules: string[];
  implementation_note: string;
}

export interface CompactSchemeCard {
  scheme_id: string;
  scheme_name: string;
  jurisdiction: string;
  crop: string;
  why_relevant: string;
  important_condition: string;
  official_link: string;
  status: string;
  category?: string;
}
