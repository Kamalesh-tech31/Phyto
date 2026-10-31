import {
  FieldDamageRange,
  FrozenCrop,
  GroupedSchemesResult,
  PreventionLookupResult,
  RestrictedPreventionEntry,
  SchemeCardDisplay,
  SchemeV2,
  SchemeV3,
  StateOption,
  SupportedState,
} from '../types/restricted_22';
import rawPreventionData from '../data/Restricted_22_Class_Prevention_KB.json';
import rawSchemeDataV3 from '../data/Crop_Support_Scheme_KB_22Class_v3.json';
import rawSchemeDataV2 from '../data/India_Central_Kerala_TamilNadu_Government_Agriculture_Scheme_KB_v2.json';
import { mapToFrozenClass } from './classMappingAdapter';

const preventionKB = rawPreventionData as { entries: Record<string, RestrictedPreventionEntry> | RestrictedPreventionEntry[] };
const schemeKBV3 = rawSchemeDataV3 as { schemes: SchemeV3[] };
const schemeKBV2 = rawSchemeDataV2 as { schemes: SchemeV2[] };

export const STATE_OPTIONS: StateOption[] = [
  { id: 'TN', labelKey: 'state_tn', defaultLabel: 'Tamil Nadu' },
  { id: 'KL', labelKey: 'state_kl', defaultLabel: 'Kerala' },
  { id: 'UP', labelKey: 'state_up', defaultLabel: 'Uttar Pradesh' },
  { id: 'AP', labelKey: 'state_ap', defaultLabel: 'Andhra Pradesh' },
  { id: 'OTHER', labelKey: 'state_other', defaultLabel: 'Other state' },
];

const LOCAL_STORAGE_FARM_STATE_KEY = 'phyto.farmState';

export class Restricted22Service {
  private preventionList: RestrictedPreventionEntry[];
  private schemesV3: SchemeV3[];
  private schemesV2: SchemeV2[];

  constructor() {
    this.preventionList = Array.isArray(preventionKB.entries)
      ? preventionKB.entries
      : Object.values(preventionKB.entries || {});
    this.schemesV3 = schemeKBV3.schemes || [];
    this.schemesV2 = schemeKBV2.schemes || [];
  }

  /**
   * Safe localStorage getter for farmer's state selection
   */
  public getSavedState(): SupportedState {
    if (typeof window === 'undefined' || !window.localStorage) {
      return '';
    }
    try {
      const val = window.localStorage.getItem(LOCAL_STORAGE_FARM_STATE_KEY);
      if (val === 'TN' || val === 'KL' || val === 'UP' || val === 'AP' || val === 'OTHER') {
        return val;
      }
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Safe localStorage setter for farmer's state selection
   */
  public saveState(state: SupportedState): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    try {
      if (state) {
        window.localStorage.setItem(LOCAL_STORAGE_FARM_STATE_KEY, state);
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_FARM_STATE_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist farm state in localStorage:', e);
    }
  }

  /**
   * Looks up prevention guidance for an identified crop and disease class.
   * If a per-language file exists for `lang`, it loads it; otherwise falls back to English.
   */
  public lookupPrevention(
    rawCrop?: string,
    rawDiseaseIdOrName?: string,
    lang: string = 'en'
  ): PreventionLookupResult {
    const mapped = mapToFrozenClass(rawCrop, rawDiseaseIdOrName);
    if (!mapped) {
      return {
        entry: null,
        isPest: false,
        isHealthy: false,
        isFallbackEnglish: false,
        className: rawDiseaseIdOrName || '',
        crop: null,
      };
    }

    const { crop, className, type } = mapped;
    const isPest = type === 'pest';
    const isHealthy = type === 'healthy';

    // Search in primary prevention dataset
    const match = this.preventionList.find(
      (e) => e.crop === crop && e.class_name.toLowerCase() === className.toLowerCase()
    );

    const isFallbackEnglish = Boolean(lang && lang !== 'en');

    return {
      entry: match || null,
      isPest,
      isHealthy,
      isFallbackEnglish,
      className,
      crop,
    };
  }

  /**
   * Evaluates and groups government schemes for a crop and disease into:
   * 1. "Support for this crop" (Subsidies & general schemes from V2)
   * 2. "If you suffer crop loss" (Insurance & calamity schemes from V3)
   */
  public evaluateSchemes(params: {
    crop?: string;
    diseaseIdOrName?: string;
    modelSeverity?: string;
    selectedState: SupportedState;
    fieldDamageRange?: FieldDamageRange;
  }): GroupedSchemesResult {
    const { crop: rawCrop, diseaseIdOrName, modelSeverity, selectedState, fieldDamageRange } = params;

    const mapped = mapToFrozenClass(rawCrop, diseaseIdOrName);

    // Default empty response
    const emptyResult: GroupedSchemesResult = {
      cropSupportSchemes: [],
      cropLossSchemes: [],
      totalCount: 0,
      hasStateSpecificSchemes: false,
      selectedState,
      effectiveSeverity: 'low',
    };

    if (!mapped) {
      return emptyResult;
    }

    // HEALTHY GATE: No schemes for healthy crops
    if (mapped.type === 'healthy') {
      return emptyResult;
    }

    const crop = mapped.crop;

    // Severity calculation
    const isModelSevere = modelSeverity === 'severe' || modelSeverity === 'critical';
    const isDamageSevere = fieldDamageRange === '>50%' || fieldDamageRange === '>70%';
    const isDamageModerate = fieldDamageRange === '25-50%';

    const effectiveSeverity: 'low' | 'moderate' | 'severe' | 'critical' =
      isModelSevere || isDamageSevere
        ? 'severe'
        : isDamageModerate || modelSeverity === 'moderate'
        ? 'moderate'
        : 'low';

    const isSevereLoss = effectiveSeverity === 'severe';

    // -------------------------------------------------------------
    // GROUP 1: "Support for this crop" (from V2 catalog)
    // -------------------------------------------------------------
    const cropSupportCards: SchemeCardDisplay[] = [];

    // Helper to format clean HTTP URLs
    const getHttpUrl = (url?: string): string | undefined => {
      if (!url) return undefined;
      const clean = url.trim();
      return clean.startsWith('http://') || clean.startsWith('https://') ? clean : undefined;
    };

    // Central crop support schemes
    if (crop === 'tomato' || crop === 'potato') {
      const midh = this.schemesV2.find((s) => s.id === 'IN-MIDH');
      if (midh) {
        cropSupportCards.push({
          scheme_id: midh.id,
          scheme_name: midh.name,
          jurisdiction: 'Central Government',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_support',
          why_relevant: 'Provides subsidy assistance for quality seeds, nursery establishment, and bio-protection inputs for horticultural crops.',
          hard_gates: [
            'Horticultural crop cultivation',
            'Registration through State Horticulture Mission / Department',
            'Subsidy disbursed per approved programmatic components',
          ],
          important_warning: 'Financial assistance is project and component based, subject to state allocation.',
          official_link: getHttpUrl(midh.official_source),
        });
      }
    }

    // Micro-irrigation / Per Drop More Crop (all crops)
    const pdmc = this.schemesV2.find((s) => s.id === 'IN-PER-DROP-MORE-CROP');
    if (pdmc) {
      cropSupportCards.push({
        scheme_id: pdmc.id,
        scheme_name: pdmc.name,
        jurisdiction: 'Central Government',
        crop: crop.charAt(0).toUpperCase() + crop.slice(1),
        group: 'crop_support',
        why_relevant: 'Assistance for drip and sprinkler irrigation installations to prevent water logging and improve moisture control.',
        hard_gates: [
          'Operational cultivable landholding',
          'Beneficiary contribution per state subsidy pattern (higher subsidy for small/marginal farmers)',
        ],
        important_warning: 'Requires registration through local Agriculture or Horticulture engineering wing.',
        official_link: getHttpUrl(pdmc.official_source),
      });
    }

    // Natural & Organic Farming (PKVY / bio-inputs)
    const pkvy = this.schemesV2.find((s) => s.id === 'IN-PKVY');
    if (pkvy) {
      cropSupportCards.push({
        scheme_id: pkvy.id,
        scheme_name: pkvy.name,
        jurisdiction: 'Central Government',
        crop: crop.charAt(0).toUpperCase() + crop.slice(1),
        group: 'crop_support',
        why_relevant: 'Cluster-based financial assistance for bio-fungicides, neem formulations, and organic inputs to build plant resilience.',
        hard_gates: [
          'Farmer group / cluster formation (minimum 20-50 ha)',
          'Commitment to residue-free / organic practices',
        ],
        important_warning: 'Support is channelled through designated cluster societies or local groups.',
        official_link: getHttpUrl(pkvy.official_source),
      });
    }

    // State-specific crop support schemes from V2
    let hasStateSpecific = false;

    if (selectedState === 'TN') {
      const tnPdmc = this.schemesV2.find((s) => s.id === 'TN-PER-DROP-MORE-CROP');
      if (tnPdmc) {
        hasStateSpecific = true;
        cropSupportCards.unshift({
          scheme_id: tnPdmc.id,
          scheme_name: tnPdmc.name,
          jurisdiction: 'Tamil Nadu',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_support',
          why_relevant: 'Up to 100% subsidy for small/marginal farmers and 75% for other farmers for micro-irrigation installation in Tamil Nadu.',
          hard_gates: [
            'Patta / chitta land records verification',
            'Aadhaar seeded Uzhavan App or TNAU Agrisnet registration',
          ],
          important_warning: 'Applications processed via Uzhavan App and block Assistant Director of Horticulture.',
          official_link: undefined, // Non-http text in source
        });
      }
    } else if (selectedState === 'KL') {
      const klCropHealth = this.schemesV2.find((s) => s.id === 'KL-CROP-HEALTH-MANAGEMENT');
      if (klCropHealth) {
        hasStateSpecific = true;
        cropSupportCards.unshift({
          scheme_id: klCropHealth.id,
          scheme_name: klCropHealth.name,
          jurisdiction: 'Kerala',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_support',
          why_relevant: 'Subsidized bio-control agents, pseudomonas, trichoderma, and field clinic advisory to control crop disease.',
          hard_gates: [
            'Registered farmer with local Krishi Bhavan',
            'Subsidies channelled through Agro-Service Centres / Plant Health Clinics',
          ],
          important_warning: 'Biological inputs distributed seasonally through local Krishi Bhavans.',
          official_link: getHttpUrl(klCropHealth.official_source),
        });
      }
    } else if (selectedState === 'UP' || selectedState === 'AP') {
      hasStateSpecific = false; // State schemes in V3 below
    }

    // -------------------------------------------------------------
    // GROUP 2: "If you suffer crop loss" (from V3 calamity/insurance)
    // -------------------------------------------------------------
    const cropLossCards: SchemeCardDisplay[] = [];

    // Central PMFBY (ALWAYS included for all states and every crop)
    const centralPmfby = this.schemesV3.find((s) => s.scheme_id === 'CENTRAL-PMFBY');
    if (centralPmfby && centralPmfby.model_crops.includes(crop)) {
      cropLossCards.push({
        scheme_id: centralPmfby.scheme_id,
        scheme_name: centralPmfby.name,
        jurisdiction: 'Central Government',
        crop: crop.charAt(0).toUpperCase() + crop.slice(1),
        group: 'crop_loss',
        why_relevant: centralPmfby.why_relevant,
        hard_gates: centralPmfby.hard_gates,
        important_warning: centralPmfby.important_warning || 'A disease prediction alone does not establish an insurance claim.',
        official_link: getHttpUrl(centralPmfby.official_source),
        isRelevantNow: isSevereLoss,
      });
    }

    // State-specific crop loss schemes
    if (selectedState === 'TN') {
      const tnPmfby = this.schemesV3.find((s) => s.scheme_id === 'TN-PMFBY');
      if (tnPmfby && tnPmfby.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.unshift({
          scheme_id: tnPmfby.scheme_id,
          scheme_name: tnPmfby.name,
          jurisdiction: 'Tamil Nadu',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: tnPmfby.why_relevant,
          hard_gates: tnPmfby.hard_gates,
          important_warning: tnPmfby.important_warning || 'Verification required by revenue and agriculture department survey.',
          official_link: getHttpUrl(tnPmfby.official_source),
          isRelevantNow: isSevereLoss,
        });
      }
    } else if (selectedState === 'KL') {
      // 1. KL State Crop Insurance (specifically for paddy/rice exceeding 50% loss)
      if (crop === 'rice') {
        const klIns = this.schemesV3.find((s) => s.scheme_id === 'KL-STATE-CROP-INSURANCE');
        if (klIns) {
          hasStateSpecific = true;
          cropLossCards.unshift({
            scheme_id: klIns.scheme_id,
            scheme_name: klIns.name,
            jurisdiction: 'Kerala',
            crop: 'Rice (Paddy)',
            group: 'crop_loss',
            why_relevant: 'Provides full crop-loss compensation specifically for pest or disease attack in paddy exceeding 50% damage.',
            hard_gates: klIns.hard_gates,
            important_warning: 'Applies specifically to paddy/rice. Mandatory AIMS registration and Krishi Bhavan field verification required.',
            official_link: getHttpUrl(klIns.official_source),
            isRelevantNow: isSevereLoss,
          });
        }
      }

      // 2. KL RWBCIS (Weather-based insurance)
      const klRwbcis = this.schemesV3.find((s) => s.scheme_id === 'KL-RWBCIS');
      if (klRwbcis && klRwbcis.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.push({
          scheme_id: klRwbcis.scheme_id,
          scheme_name: klRwbcis.name,
          jurisdiction: 'Kerala',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: klRwbcis.why_relevant,
          hard_gates: klRwbcis.hard_gates,
          important_warning: klRwbcis.important_warning || 'Notification varies by district and season.',
          official_link: getHttpUrl(klRwbcis.official_source),
          isRelevantNow: isSevereLoss,
        });
      }
    } else if (selectedState === 'UP') {
      // UP PMFBY (covers rice, corn, potato - NOT tomato)
      const upPmfby = this.schemesV3.find((s) => s.scheme_id === 'UP-PMFBY');
      if (upPmfby && upPmfby.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.unshift({
          scheme_id: upPmfby.scheme_id,
          scheme_name: upPmfby.name,
          jurisdiction: 'Uttar Pradesh',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: upPmfby.why_relevant,
          hard_gates: upPmfby.hard_gates,
          important_warning: upPmfby.important_warning || 'Applicable to notified insurance units in UP.',
          official_link: undefined, // Missing official_source in Ashwin's V3 data
          isRelevantNow: isSevereLoss,
        });
      }

      // UP RWBCIS (covers tomato, potato, corn, rice)
      const upRwbcis = this.schemesV3.find((s) => s.scheme_id === 'UP-RWBCIS');
      if (upRwbcis && upRwbcis.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.push({
          scheme_id: upRwbcis.scheme_id,
          scheme_name: upRwbcis.name,
          jurisdiction: 'Uttar Pradesh',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: upRwbcis.why_relevant,
          hard_gates: upRwbcis.hard_gates,
          important_warning: upRwbcis.important_warning || 'Tomato covered in designated pilot districts only.',
          official_link: undefined, // Missing official_source in Ashwin's V3 data
          isRelevantNow: isSevereLoss,
        });
      }
    } else if (selectedState === 'AP') {
      // AP Free Crop Insurance (covers rice and corn - NOT tomato or potato)
      const apPmfby = this.schemesV3.find((s) => s.scheme_id === 'AP-DR-YSR-FCI-PMFBY');
      if (apPmfby && apPmfby.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.unshift({
          scheme_id: apPmfby.scheme_id,
          scheme_name: apPmfby.name,
          jurisdiction: 'Andhra Pradesh',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: apPmfby.why_relevant,
          hard_gates: apPmfby.hard_gates,
          important_warning: apPmfby.important_warning || 'Requires valid enrollment record in e-Panta/e-crop portal.',
          official_link: undefined, // Missing official_source in Ashwin's V3 data
          isRelevantNow: isSevereLoss,
        });
      }

      // AP Calamity Assistance (all crops)
      const apCalamity = this.schemesV3.find((s) => s.scheme_id === 'AP-CROP-LOSS-ASSISTANCE');
      if (apCalamity && apCalamity.model_crops.includes(crop)) {
        hasStateSpecific = true;
        cropLossCards.push({
          scheme_id: apCalamity.scheme_id,
          scheme_name: apCalamity.name,
          jurisdiction: 'Andhra Pradesh',
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          group: 'crop_loss',
          why_relevant: apCalamity.why_relevant,
          hard_gates: apCalamity.hard_gates,
          important_warning: apCalamity.important_warning || 'Input subsidy support upon government disaster declaration.',
          official_link: getHttpUrl(apCalamity.official_source),
          isDistrictSpecific: true, // Note: Tirupati portal
          isRelevantNow: isSevereLoss,
        });
      }

      // AP MIDH (tomato)
      if (crop === 'tomato') {
        const apMidh = this.schemesV3.find((s) => s.scheme_id === 'AP-MIDH-HORTICULTURE');
        if (apMidh) {
          hasStateSpecific = true;
          cropLossCards.push({
            scheme_id: apMidh.scheme_id,
            scheme_name: apMidh.name,
            jurisdiction: 'Andhra Pradesh',
            crop: 'Tomato',
            group: 'crop_loss',
            why_relevant: apMidh.why_relevant,
            hard_gates: apMidh.hard_gates,
            important_warning: apMidh.important_warning || 'Subject to district horticulture plan approvals.',
            official_link: getHttpUrl(apMidh.official_source),
            isDistrictSpecific: true, // Note: Kurnool portal
            isRelevantNow: isSevereLoss,
          });
        }
      }
    }

    const totalCount = cropSupportCards.length + cropLossCards.length;

    return {
      cropSupportSchemes: cropSupportCards,
      cropLossSchemes: cropLossCards,
      totalCount,
      hasStateSpecificSchemes: Boolean(selectedState && selectedState !== 'OTHER' && hasStateSpecific),
      selectedState,
      effectiveSeverity,
    };
  }

  /**
   * Helper to normalize raw crop or pest name to a FrozenCrop
   */
  public normalizeCrop(rawCrop?: string, rawDisease?: string): FrozenCrop | null {
    const mapped = mapToFrozenClass(rawCrop, rawDisease);
    return mapped ? mapped.crop : null;
  }

  /**
   * Severe schemes evaluator (returns loss/insurance schemes that qualify when severity is severe/critical)
   */
  public evaluateSevereSchemes(
    crop: string,
    severity: string,
    state: string,
    diseaseName?: string
  ): SchemeCardDisplay[] {
    const normSeverity = (severity || '').toLowerCase();
    if (normSeverity !== 'severe' && normSeverity !== 'critical') {
      return [];
    }

    let normalizedState: SupportedState = '';
    const sLower = (state || '').toLowerCase();
    if (sLower === 'tamil nadu' || sLower === 'tn') normalizedState = 'TN';
    else if (sLower === 'kerala' || sLower === 'kl') normalizedState = 'KL';
    else if (sLower === 'uttar pradesh' || sLower === 'up') normalizedState = 'UP';
    else if (sLower === 'andhra pradesh' || sLower === 'ap') normalizedState = 'AP';
    else if (sLower === 'others' || sLower === 'other' || sLower === 'other state') normalizedState = 'OTHER';

    const evaluated = this.evaluateSchemes({
      crop,
      diseaseIdOrName: diseaseName,
      modelSeverity: normSeverity,
      selectedState: normalizedState,
    });

    return evaluated.cropLossSchemes.filter((s) => s.isRelevantNow);
  }
}

export const restricted22Service = new Restricted22Service();
