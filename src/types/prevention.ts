export interface PreventionSource {
  source_type: string;
  source: string;
  pdf_page?: string | null;
  printed_page?: string | null;
  note: string;
}

export interface PreventionEntry {
  crop: string;
  disease: string;
  prevention: string[];
  local_prevention?: string[];
  sources?: PreventionSource[];
}

export interface GeneralPrevention {
  practice: string;
  prevention: string;
  source_type: string;
  source: string;
  note: string;
}

export interface PreventionDataset {
  dataset_name: string;
  version: string;
  purpose: string;
  region: string[];
  entries: PreventionEntry[];
  general_prevention?: GeneralPrevention[];
}

export interface PreventionLookupResult {
  found: boolean;
  entry: PreventionEntry | null;
  normalizedCrop: string;
  normalizedDisease: string;
  fallbackMessage?: string;
  generalGuidance?: GeneralPrevention[];
}
