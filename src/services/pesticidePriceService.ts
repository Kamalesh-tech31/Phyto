import priceKbJson from '../data/Crop_Pesticide_Price_KB_22Class_v2.json';
import {
  PriceKB,
  PriceRecord,
  CalculatedCostResult,
  EstimateGrade,
} from '../types/price_kb';

const priceKb = priceKbJson as unknown as PriceKB;

/**
 * Normalizes price units to user-friendly display (e.g. INR/kg -> kg, INR/L -> L).
 */
function normalizeUnit(unit?: string): string {
  if (!unit) return '';
  const lower = unit.toLowerCase();
  if (lower.includes('kg')) return 'kg';
  if (lower.includes('litre') || lower.includes('/l')) return 'L';
  return unit.replace(/inr\s*\/?/i, '').trim();
}

/**
 * Deterministically formats numeric cost values:
 * - Values < 10 (e.g. per-litre spray cost): 2 decimal places (e.g. 1.45, 3.01)
 * - Values >= 10 (e.g. per-hectare cost): integer with Indian locale commas (e.g. 1,160, 946)
 */
function formatCost(val?: number): string {
  if (val === undefined || val === null || isNaN(val)) return '';
  if (val < 10) {
    return (Math.round(val * 100) / 100).toFixed(2).replace(/\.00$/, '');
  }
  return Math.round(val).toLocaleString('en-IN');
}

/**
 * Checks whether an active ingredient or formulation is banned, restricted, or withdrawn in India.
 * Mandatory Rule 19: These must NEVER be priced or recommended.
 */
export function isBannedOrRestricted(active: string): boolean {
  if (!active) return false;
  const lower = active.toLowerCase();
  return (
    lower.includes('metalaxyl 4% + mancozeb 64%') ||
    lower.includes('metalaxyl 4%') ||
    lower.includes('acephate 75') ||
    lower.includes('acephate') ||
    lower.includes('carbofuran') ||
    lower.includes('trichlorphon') ||
    lower.includes('trichlorfon') ||
    lower.includes('streptocycline') ||
    lower.includes('streptomycin')
  );
}

/**
 * Checks whether a class has no price by design:
 * - Healthy classes: tomato_healthy, potato_healthy, corn_healthy
 * - No chemical recommended: rice_leaf_smut
 * - Expert consultation required: rice_asiatic_rice_borer
 * - Multi-crop Rice armyworm: no chemical recommendation
 */
export function isZeroCostClass(classId: string, cropChoice?: string): boolean {
  if (!classId) return false;
  const lower = classId.toLowerCase();
  if (
    lower === 'tomato_healthy' ||
    lower === 'potato_healthy' ||
    lower === 'corn_healthy' ||
    lower === 'rice_leaf_smut' ||
    lower === 'rice_asiatic_rice_borer'
  ) {
    return true;
  }
  if (lower === 'armyworm' && cropChoice === 'rice') {
    return true;
  }
  return false;
}

export class PesticidePriceService {
  private kb: PriceKB;

  constructor() {
    this.kb = priceKb;
  }

  public getKB(): PriceKB {
    return this.kb;
  }

  public getAllRecords(): PriceRecord[] {
    return this.kb.records;
  }

  /**
   * Matches a price record based on class_id, active, and sub-crop choice.
   */
  public matchPriceRecord(
    classId: string,
    active: string,
    cropChoice?: string
  ): PriceRecord | undefined {
    if (isBannedOrRestricted(active)) return undefined;
    if (isZeroCostClass(classId, cropChoice)) return undefined;

    const lookupClassId =
      classId.toLowerCase() === 'armyworm' && cropChoice === 'corn'
        ? 'armyworm:corn'
        : classId.toLowerCase();

    const normalizedActive = active.trim().toLowerCase();

    return this.kb.records.find(
      (r) =>
        r.class_id.toLowerCase() === lookupClassId &&
        r.active.trim().toLowerCase() === normalizedActive
    );
  }

  /**
   * Deterministically calculates cost estimate and returns display-ready formatted values.
   */
  public getCostEstimate(
    classId: string,
    active: string,
    doseText: string,
    doseBasis: string,
    cropChoice?: string
  ): CalculatedCostResult {
    // 1. Regulatory Banned / Severely Restricted Check
    if (isBannedOrRestricted(active)) {
      return {
        hasPrice: false,
        estimateGrade: 'unavailable',
        treatmentCostDisplay: 'Cost estimate unavailable (restricted substance)',
        subtext: 'Banned or restricted pesticide; not eligible for pricing or recommendation.',
        isDefinitive: false,
      };
    }

    // 2. Zero-Cost Class Check (Healthy, Leaf Smut, Asiatic Borer, Rice Armyworm)
    if (isZeroCostClass(classId, cropChoice)) {
      return {
        hasPrice: false,
        estimateGrade: 'unavailable',
        treatmentCostDisplay: '',
        subtext: '',
        isDefinitive: false,
      };
    }

    // 3. Match record in Price KB
    const record = this.matchPriceRecord(classId, active, cropChoice);

    if (!record) {
      return {
        hasPrice: false,
        estimateGrade: 'unavailable',
        treatmentCostDisplay: 'Cost estimate unavailable',
        subtext: 'No price record available for this formulation.',
        isDefinitive: false,
      };
    }

    const grade: EstimateGrade = record.estimate_grade;
    const formulationMatch = record.formulation_match;

    // Check for Not Researched
    if (grade === 'not_researched') {
      return {
        hasPrice: false,
        estimateGrade: 'not_researched',
        formulationMatch,
        treatmentCostDisplay: 'Cost estimate unavailable',
        subtext: 'Formulation pricing not researched in current pass.',
        isDefinitive: false,
      };
    }

    // Check for Unavailable
    if (grade === 'unavailable' && !record.official_benchmark) {
      return {
        hasPrice: false,
        estimateGrade: 'unavailable',
        formulationMatch,
        treatmentCostDisplay: 'Cost estimate unavailable',
        subtext: 'Retail pricing currently unavailable for this formulation.',
        isDefinitive: false,
      };
    }

    // Handle Benchmark Only (e.g. Corn Borer Chlorantraniliprole 20 SC)
    if (grade === 'benchmark_only') {
      const benchmarkVal = record.official_benchmark?.value;
      const benchmarkUnit = record.official_benchmark?.unit || 'L';
      const cleanUnit = normalizeUnit(benchmarkUnit);

      return {
        hasPrice: true,
        estimateGrade: 'benchmark_only',
        formulationMatch: 'none_found',
        productPriceDisplay: benchmarkVal
          ? `Reference benchmark: ~₹${benchmarkVal.toLocaleString('en-IN')}/${cleanUnit} (all-India average)`
          : undefined,
        treatmentCostDisplay: 'Cost estimate unavailable (benchmark data only)',
        subtext: 'Reference benchmark only (all-India average); actual retail price may vary.',
        isDefinitive: false,
        badgeLabel: 'Official Benchmark',
        costEstimateUnavailableReason: 'Benchmark data only; formulation retail price not found.',
        officialBenchmark: record.official_benchmark,
      };
    }

    // 4. Determine Product Price Display for Farmer Ready & Indicative
    let productPriceDisplay: string | undefined;
    if (record.normalized_summary) {
      const min = Math.round(record.normalized_summary.min).toLocaleString('en-IN');
      const max = Math.round(record.normalized_summary.max).toLocaleString('en-IN');
      const unit = normalizeUnit(record.normalized_summary.unit);
      if (min === max) {
        productPriceDisplay = `Product price: ~₹${min}/${unit}`;
      } else {
        productPriceDisplay = `Product price: ₹${min}–₹${max}/${unit}`;
      }
    }

    // 5. Determine Treatment Cost Display based on Cases A-G
    let treatmentCostDisplay = 'Cost estimate unavailable';
    let costEstimateUnavailableReason: string | undefined;

    const lowerDoseText = (doseText || '').toLowerCase();
    const lowerDoseBasis = (doseBasis || '').toLowerCase();

    // CASE F: Percentage solutions (e.g. Potato Early/Late Blight Mancozeb 75 WP 0.2% / 0.25%)
    if (lowerDoseBasis === 'percent_solution' || lowerDoseText.includes('%')) {
      treatmentCostDisplay = 'Cost estimate unavailable (spray volume varies by field)';
      costEstimateUnavailableReason =
        'Percentage dose; field spray volume varies depending on crop canopy and equipment.';
    }
    // CASE G: Missing or Non-numeric dose (e.g. Tomato Leaf Mold Azoxystrobin)
    else if (
      lowerDoseBasis === 'no_numeric_dose' ||
      lowerDoseText.includes('label') ||
      lowerDoseText.includes('consultation') ||
      lowerDoseText.includes('vector management only')
    ) {
      treatmentCostDisplay =
        'Price information available, but treatment cost cannot be calculated because a verified dose is unavailable.';
      costEstimateUnavailableReason = 'A verified numeric field dose is required for calculation.';
    }
    // CASE A / C / D / E: Verified Numeric Cost Estimates
    else if (record.cost_estimate) {
      if (record.cost_estimate.cost_per_litre_of_spray_inr) {
        const { low, high } = record.cost_estimate.cost_per_litre_of_spray_inr;
        if (low === high) {
          treatmentCostDisplay = `Estimated pesticide cost: ~₹${formatCost(low)} per litre of spray`;
        } else {
          treatmentCostDisplay = `Estimated pesticide cost: ~₹${formatCost(low)}–₹${formatCost(high)} per litre of spray`;
        }
      } else if (record.cost_estimate.cost_per_hectare_inr) {
        const { low, high } = record.cost_estimate.cost_per_hectare_inr;
        if (low === high) {
          treatmentCostDisplay = `Estimated pesticide cost: ~₹${formatCost(low)} per hectare`;
        } else {
          treatmentCostDisplay = `Estimated pesticide cost: ~₹${formatCost(low)}–₹${formatCost(high)} per hectare`;
        }
      }
    } else if (record.indicative_cost_estimate) {
      if (record.indicative_cost_estimate.cost_per_litre_of_spray_inr) {
        const { low, high } = record.indicative_cost_estimate.cost_per_litre_of_spray_inr;
        if (low === high) {
          treatmentCostDisplay = `Estimated pesticide cost (indicative): ~₹${formatCost(low)} per litre of spray`;
        } else {
          treatmentCostDisplay = `Estimated pesticide cost (indicative): ~₹${formatCost(low)}–₹${formatCost(high)} per litre of spray`;
        }
      } else if (record.indicative_cost_estimate.cost_per_hectare_inr) {
        const { low, high } = record.indicative_cost_estimate.cost_per_hectare_inr;
        if (low === high) {
          treatmentCostDisplay = `Estimated pesticide cost (indicative): ~₹${formatCost(low)} per hectare`;
        } else {
          treatmentCostDisplay = `Estimated pesticide cost (indicative): ~₹${formatCost(low)}–₹${formatCost(high)} per hectare`;
        }
      }
    } else if (record.cost_estimate_withheld_reason) {
      treatmentCostDisplay = 'Cost estimate unavailable';
      costEstimateUnavailableReason = record.cost_estimate_withheld_reason;
    }

    // 6. Subtext by Estimate Grade
    let subtext = 'Approximate retail estimate • Check local shop price';
    let badgeLabel = 'Retail Range';

    if (grade === 'indicative_only') {
      subtext = 'Formulation/market data is limited; actual price may vary.';
      badgeLabel = 'Indicative Price';
    }

    // 7. Vector Control Flag & Clarification (Mandatory Rule 18)
    const isVectorControlOnly = classId.toLowerCase() === 'tomato_yellow_leaf_curl_virus';
    const vectorControlNote = isVectorControlOnly
      ? 'Vector control cost only (whitefly management); does not cure viral infection.'
      : undefined;

    // 8. State Restriction Alert (Mandatory Rule 20)
    let stateRestrictionFlag: string | undefined;
    if (record.state_restriction_flag) {
      stateRestrictionFlag =
        'Note: Check local state regulations. Some states (e.g., Kerala) restrict the sale/use of this chemical.';
    }

    return {
      hasPrice: true,
      estimateGrade: grade,
      formulationMatch,
      productPriceDisplay,
      treatmentCostDisplay,
      subtext,
      isDefinitive: grade === 'farmer_ready_range',
      badgeLabel,
      stateRestrictionFlag,
      isVectorControlOnly,
      vectorControlNote,
      costEstimateUnavailableReason,
    };
  }

  public getDisclaimer(): string {
    return 'Prices are approximate retail estimates and may vary by brand, pack size, shop and location.';
  }
}

export const pesticidePriceService = new PesticidePriceService();
