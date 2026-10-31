import pesticideKbData from '../data/Crop_Treatment_Pesticide_KB_22Class_Production_v2.json';
import {
  ChemicalRecommendation,
  PesticideKB,
  PesticideKBRecord,
  TreatmentDisplayMode,
  TreatmentTier,
} from '../types/pesticide_kb';

const kb = pesticideKbData as unknown as PesticideKB;

class PesticideKbService {
  private records: PesticideKBRecord[] = kb.records;

  /**
   * Return all 22 frozen class records
   */
  public getAllRecords(): PesticideKBRecord[] {
    return this.records;
  }

  /**
   * Look up record by exact class_id or fuzzy alias
   */
  public getRecordByClassId(classId: string): PesticideKBRecord | undefined {
    if (!classId) return undefined;
    const normalized = classId.toLowerCase().trim();

    // Direct match
    let match = this.records.find((r) => r.class_id.toLowerCase() === normalized);
    if (match) return match;

    // Common short aliases from scan flow
    if (normalized === 'early_blight') {
      return this.records.find((r) => r.class_id === 'tomato_early_blight');
    }
    if (normalized === 'late_blight') {
      return this.records.find((r) => r.class_id === 'tomato_late_blight');
    }
    if (normalized === 'healthy') {
      return this.records.find((r) => r.class_id === 'tomato_healthy');
    }

    return undefined;
  }

  /**
   * Look up record by crop and disease name
   */
  public getRecord(cropName?: string, diseaseName?: string): PesticideKBRecord | undefined {
    if (!diseaseName) return undefined;

    const normCrop = (cropName || '').toLowerCase().trim();
    const normDisease = diseaseName.toLowerCase().trim();

    // Try finding by exact class_id pattern
    for (const record of this.records) {
      const recCrop = record.crop.toLowerCase();
      const recName = record.class_name.toLowerCase();

      // If diseaseName matches class_id
      if (record.class_id.toLowerCase() === normDisease) {
        return record;
      }

      // If diseaseName matches class_name
      if (recName === normDisease) {
        if (!normCrop || recCrop.includes(normCrop) || normCrop.includes(recCrop)) {
          return record;
        }
      }

      // Partial name match
      if (normDisease.includes(recName) || recName.includes(normDisease)) {
        if (!normCrop || recCrop.includes(normCrop) || normCrop.includes(recCrop)) {
          return record;
        }
      }
    }

    // Fallback: check class_id prefix/suffix
    return this.getRecordByClassId(diseaseName);
  }

  /**
   * Returns only displayable chemicals (strictly respecting display: true)
   */
  public getDisplayableChemicals(
    record: PesticideKBRecord,
    cropChoice?: 'corn' | 'rice'
  ): ChemicalRecommendation[] {
    if (record.display_mode === 'crop_prompt' && record.by_crop && cropChoice) {
      const cropMgmt = record.by_crop[cropChoice];
      if (cropMgmt && cropMgmt.chemical) {
        return cropMgmt.chemical.filter((c) => c.display === true);
      }
      return [];
    }

    if (
      record.display_mode === 'expert_only' ||
      record.display_mode === 'no_treatment_needed' ||
      record.display_mode === 'no_recommendation'
    ) {
      return [];
    }

    return (record.chemical || []).filter((c) => c.display === true);
  }

  /**
   * Formats safe dose presentation for farmers
   */
  public formatDose(chemical: ChemicalRecommendation): {
    doseDisplay: string;
    warningNote?: string;
  } {
    if (chemical.dose_basis === 'no_numeric_dose' || !chemical.dose_text) {
      return {
        doseDisplay: 'Use current registered label dose',
        warningNote: 'Check the pesticide package label for approved dilution before application.',
      };
    }

    if (chemical.dose_basis === 'per_hectare') {
      return {
        doseDisplay: chemical.dose_text,
        warningNote:
          'Dose is per hectare. Ask your local agriculture officer or Krishi Bhavan for the knapsack tank dilution rate.',
      };
    }

    if (chemical.dose_basis === 'percent_solution') {
      return {
        doseDisplay: chemical.dose_text,
        warningNote: 'Spray volume as recommended for field crops; ensure uniform leaf canopy coverage.',
      };
    }

    return {
      doseDisplay: chemical.dose_text,
    };
  }

  /**
   * Explains the tier status
   */
  public getTierBadge(tier: TreatmentTier): { label: string; bg: string; text: string } {
    switch (tier) {
      case 'A':
        return {
          label: 'Tier A · Verified Indian Source',
          bg: 'bg-emerald-100',
          text: 'text-emerald-800',
        };
      case 'B':
        return {
          label: 'Tier B · Label / Verification Check',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
        };
      case 'C':
        return {
          label: 'Tier C · Hold / Species Check',
          bg: 'bg-amber-100',
          text: 'text-amber-800',
        };
      case 'N':
      default:
        return {
          label: 'Tier N · Non-chemical',
          bg: 'bg-slate-100',
          text: 'text-slate-700',
        };
    }
  }
}

export const pesticideKbService = new PesticideKbService();
