import csvPesticidesData from '../data/Crop_Pesticide_Treatment_With_Price_Rate.json';
import treatmentKbData from '../data/Crop_Treatment_Pesticide_KB_22Class_Production_v2.json';
import {
  CsvPesticideRecord,
  ResolvedPesticide,
  ResolvedTreatment,
} from '../types/treatment_resolver';
import { PesticideKB, PesticideKBRecord } from '../types/pesticide_kb';

const csvRecords = csvPesticidesData as unknown as CsvPesticideRecord[];
const tkb = treatmentKbData as unknown as PesticideKB;
const tkbClassIds = new Set(tkb.records.map((r) => r.class_id.toLowerCase()));

/**
 * Normalizes input class_id or common alias to exact frozen class_id
 */
export function normalizeClassId(rawId?: string, crop?: string): string {
  if (!rawId) return 'tomato_early_blight';
  const norm = rawId.toLowerCase().trim();
  if (tkbClassIds.has(norm)) return norm;

  if (norm.startsWith('pest_')) {
    const unpest = norm.replace(/^pest_/, '');
    if (unpest === 'brown_planthopper') return 'rice_brown_planthopper';
    if (unpest === 'rice_leaf_roller') return 'rice_leaf_roller';
    if (unpest === 'asiatic_rice_borer') return 'rice_asiatic_rice_borer';
    if (tkbClassIds.has(unpest)) return unpest;
  }

  if (crop) {
    const cropClean = crop.toLowerCase().trim();
    const candidate = `${cropClean}_${norm}`;
    if (tkbClassIds.has(candidate)) return candidate;
  }

  if (norm === 'early_blight') {
    return crop && crop.toLowerCase().includes('potato')
      ? 'potato_early_blight'
      : 'tomato_early_blight';
  }
  if (norm === 'late_blight') {
    return crop && crop.toLowerCase().includes('potato')
      ? 'potato_late_blight'
      : 'tomato_late_blight';
  }
  if (norm === 'healthy') {
    if (crop && crop.toLowerCase().includes('potato')) return 'potato_healthy';
    if (crop && crop.toLowerCase().includes('corn')) return 'corn_healthy';
    return 'tomato_healthy';
  }

  return norm;
}

/**
 * Cleans the rate unit from CSV (e.g. "INR/kg" -> "kg", "INR/L" -> "L")
 */
function cleanRateUnit(unit?: string): string {
  if (!unit) return 'kg';
  const clean = unit.replace(/^INR\s*\/?/i, '').trim();
  return clean || 'kg';
}

/**
 * Capitalizes pesticide formulation display name (e.g. "mancozeb 75 WP" -> "Mancozeb 75 WP")
 */
function formatPesticideName(name: string): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Formats CSV price fields deterministically according to exact prompt rules
 */
function formatPrice(row: CsvPesticideRecord): {
  priceDisplay: string;
  badgeLabel?: string;
  badgeType: 'approximate' | 'indicative' | 'benchmark' | 'unavailable';
  gradeSubtext: string;
} {
  const unit = cleanRateUnit(row.rate_unit);

  // Case 1: Benchmark Only (e.g. Corn Borer Chlorantraniliprole 20 SC)
  if (row.estimate_grade === 'benchmark_only') {
    return {
      priceDisplay: 'Reference price: ~₹5,977 / L',
      badgeLabel: 'BENCHMARK',
      badgeType: 'benchmark',
      gradeSubtext: 'All-India average; not a retail price.',
    };
  }

  // Case 2: Unavailable or Not Researched
  const hasValidPrice =
    row.price_status === 'available' &&
    (row.rate_min_inr !== null || row.rate_median_inr !== null || row.rate_max_inr !== null);

  if (!hasValidPrice) {
    return {
      priceDisplay: 'Price unavailable',
      badgeLabel: undefined,
      badgeType: 'unavailable',
      gradeSubtext:
        row.estimate_grade === 'not_researched' || row.price_status === 'not_researched_this_pass'
          ? 'Formulation pricing not researched in current pass.'
          : 'Verified retail price currently unavailable for this formulation.',
    };
  }

  // Case 3: Available Range or Median
  const min = row.rate_min_inr !== null && row.rate_min_inr !== undefined ? Math.round(row.rate_min_inr) : null;
  const max = row.rate_max_inr !== null && row.rate_max_inr !== undefined ? Math.round(row.rate_max_inr) : null;
  const med = row.rate_median_inr !== null && row.rate_median_inr !== undefined ? Math.round(row.rate_median_inr) : null;

  let priceDisplay: string;
  if (min !== null && max !== null && min !== max) {
    priceDisplay = `Approx. ₹${min.toLocaleString('en-IN')}–₹${max.toLocaleString('en-IN')} / ${unit}`;
  } else if (med !== null) {
    priceDisplay = `Approx. ₹${med.toLocaleString('en-IN')} / ${unit}`;
  } else if (min !== null) {
    priceDisplay = `Approx. ₹${min.toLocaleString('en-IN')} / ${unit}`;
  } else {
    priceDisplay = 'Price unavailable';
  }

  if (row.estimate_grade === 'farmer_ready_range') {
    return {
      priceDisplay,
      badgeLabel: 'APPROXIMATE',
      badgeType: 'approximate',
      gradeSubtext: 'Prices vary by brand and shop.',
    };
  }

  // Indicative only / formulation unspecified
  return {
    priceDisplay,
    badgeLabel: 'INDICATIVE PRICE',
    badgeType: 'indicative',
    gradeSubtext: 'Formulation/market data is limited; actual price may vary.',
  };
}

/**
 * Formats dose from CSV strictly respecting original dose and dose basis
 */
function formatDose(row: CsvPesticideRecord): { doseDisplay: string; doseNote?: string } {
  const rawDose = (row.dose || '').trim();
  const lowerDose = rawDose.toLowerCase();
  const basis = (row.dose_basis || '').toLowerCase();

  if (basis === 'no_numeric_dose') {
    if (lowerDose.includes('dose not supplied') || lowerDose.includes('not specified')) {
      return {
        doseDisplay: 'Follow registered product label',
        doseNote: 'Dose not specified in source; adhere to registered container label.',
      };
    }
    if (lowerDose.includes('current registered label required') || lowerDose.includes('use current registered label')) {
      return {
        doseDisplay: 'Follow registered product label',
        doseNote: rawDose,
      };
    }
    return {
      doseDisplay: 'Follow registered product label',
      doseNote: rawDose,
    };
  }

  return {
    doseDisplay: rawDose,
    doseNote: undefined,
  };
}

export class TreatmentResolver {
  private csvData: CsvPesticideRecord[] = csvRecords;
  private tkbRecords: PesticideKBRecord[] = tkb.records;

  /**
   * Primary resolver matching predicted class_id to exact CSV pesticide and price records.
   */
  public resolveTreatment(
    rawClassId?: string,
    subCropChoice: 'corn' | 'rice' = 'corn',
    inputCrop?: string
  ): ResolvedTreatment {
    const classId = normalizeClassId(rawClassId, inputCrop);
    const tkbRec = this.tkbRecords.find((r) => r.class_id.toLowerCase() === classId);

    const className = tkbRec ? tkbRec.class_name : 'Crop condition';
    const crop = tkbRec ? tkbRec.crop : 'Crop';
    const tier = tkbRec ? tkbRec.tier : 'B';
    const type = (tkbRec ? tkbRec.type : 'disease') as 'disease' | 'pest' | 'healthy';
    const ipm = tkbRec && tkbRec.ipm ? tkbRec.ipm : [];
    const sources = tkbRec && tkbRec.sources ? tkbRec.sources : [];

    const safetyDisclaimer =
      'Check the current registered label, the waiting period before harvest and the protective equipment before spraying. Keep sprays away from children, food and water. This is guidance, not a replacement for your agriculture officer.';

    // 1. Healthy Crop State
    if (classId === 'tomato_healthy' || classId === 'potato_healthy' || classId === 'corn_healthy') {
      return {
        classId,
        className: 'Healthy Crop',
        crop,
        type: 'healthy',
        tier: 'N',
        displayMode: 'no_treatment_needed',
        displayNote:
          'No active disease or pest infestation detected. No chemical pesticide application is required. Continue routine scouting and balanced nutrition.',
        pesticides: [],
        ipm: [
          'Continue routine morning and evening scouting.',
          'Maintain balanced N-P-K nutrition avoiding excess nitrogen.',
          'Ensure drip lines and drainage channels remain free of weeds.',
        ],
        sources,
        safetyDisclaimer,
      };
    }

    // 2. Rice Leaf Smut (No chemical treatment recommended)
    if (classId === 'rice_leaf_smut') {
      return {
        classId,
        className,
        crop,
        type,
        tier: 'N',
        displayMode: 'no_recommendation',
        displayNote:
          'Authoritative agricultural extension sources report that this condition rarely causes economic yield loss, and chemical fungicide sprays are not warranted or recommended. Practice good field sanitation and balanced nitrogen.',
        pesticides: [],
        ipm,
        sources,
        safetyDisclaimer,
      };
    }

    // 3. Rice Asiatic Rice Borer (Expert verification required)
    if (classId === 'rice_asiatic_rice_borer') {
      return {
        classId,
        className,
        crop,
        type,
        tier: 'C',
        displayMode: 'expert_only',
        displayNote:
          'Exact pest species verification is required before chemical application to prevent crop harm. Please consult your local Agricultural Officer or Krishi Bhavan for diagnosis.',
        pesticides: [],
        ipm,
        sources,
        safetyDisclaimer,
      };
    }

    // 4. Armyworm (Multi-crop: Corn vs Rice)
    if (classId === 'armyworm') {
      if (subCropChoice === 'rice') {
        return {
          classId,
          className: 'Rice Armyworm',
          crop: 'rice',
          type,
          tier: 'B',
          displayMode: 'crop_prompt',
          promptText: 'Which crop is this? Treatment differs for corn and rice.',
          displayNote:
            'No verified chemical recommendation is available for rice armyworm. Use IPM steps and contact your local agriculture officer. (Trichlorfon is banned in India).',
          pesticides: [],
          ipm,
          sources,
          safetyDisclaimer,
        };
      }

      // Corn armyworm from CSV
      const cornRows = this.csvData.filter((r) => r.class_id === 'armyworm');
      const pesticides = cornRows.map((r) => this.mapPesticide(r, classId));

      return {
        classId,
        className: 'Fall Armyworm (Corn)',
        crop: 'corn',
        type,
        tier: 'B',
        displayMode: 'crop_prompt',
        promptText: 'Which crop is this? Treatment differs for corn and rice.',
        pesticides,
        ipm,
        sources,
        safetyDisclaimer,
      };
    }

    // 5. Tomato Yellow Leaf Curl Virus (Vector Control Only)
    if (classId === 'tomato_yellow_leaf_curl_virus') {
      const rows = this.csvData.filter((r) => r.class_id === classId);
      const pesticides = rows.map((r) => this.mapPesticide(r, classId));

      return {
        classId,
        className,
        crop,
        type,
        tier,
        displayMode: 'vector_control_only',
        displayNote:
          'This treatment does not cure the virus. It is intended only for management of the insect vector (whitefly). Roguing infected plants and controlling vector populations prevents secondary spread.',
        pesticides,
        ipm,
        sources,
        safetyDisclaimer,
      };
    }

    // 6. Standard Foliar Diseases & Pests (Query exact CSV class_id)
    const matchingRows = this.csvData.filter((r) => r.class_id === classId);
    const pesticides = matchingRows.map((r) => this.mapPesticide(r, classId));

    return {
      classId,
      className,
      crop,
      type,
      tier,
      displayMode: (tkbRec ? tkbRec.display_mode : 'treatment') as any,
      displayNote: tkbRec ? tkbRec.display_note : undefined,
      pesticides,
      ipm,
      sources,
      safetyDisclaimer,
    };
  }

  private mapPesticide(r: CsvPesticideRecord, classId: string): ResolvedPesticide {
    const doseInfo = formatDose(r);
    const priceInfo = formatPrice(r);
    const isMancozeb = r.pesticide.toLowerCase().includes('mancozeb');
    const isVectorControl = classId === 'tomato_yellow_leaf_curl_virus';

    return {
      name: formatPesticideName(r.pesticide),
      dose: r.dose,
      doseBasis: r.dose_basis,
      doseDisplay: doseInfo.doseDisplay,
      doseNote: doseInfo.doseNote,
      priceDisplay: priceInfo.priceDisplay,
      rateUnit: cleanRateUnit(r.rate_unit),
      rateMin: r.rate_min_inr,
      rateMax: r.rate_max_inr,
      rateMedian: r.rate_median_inr,
      priceStatus:
        r.price_status === 'available'
          ? 'available'
          : r.price_status === 'unavailable'
          ? 'unavailable'
          : 'not_researched',
      estimateGrade: (r.estimate_grade || 'unavailable') as any,
      formulationMatch: r.formulation_match,
      badgeLabel: priceInfo.badgeLabel,
      badgeType: priceInfo.badgeType,
      gradeSubtext: priceInfo.gradeSubtext,
      stateRestrictionFlag: isMancozeb
        ? 'Note: Check local state regulations. Some states (e.g., Kerala) restrict the sale/use of this chemical.'
        : undefined,
      isVectorControl,
    };
  }
}

export const treatmentResolver = new TreatmentResolver();
