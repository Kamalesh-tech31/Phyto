import {
  CompactSchemeCard,
  FrozenCrop,
  RestrictedPreventionEntry,
  RestrictedPreventionKB,
  SchemeKBV3,
  SchemeV3,
  StateOption,
  SupportedState,
} from '../types/restricted_22';
import rawPreventionData from '../data/Restricted_22_Class_Prevention_KB.json';
import rawSchemeDataV3 from '../data/Crop_Support_Scheme_KB_22Class_v3.json';

const preventionKB = rawPreventionData as RestrictedPreventionKB;
const schemeKBV3 = rawSchemeDataV3 as SchemeKBV3;

const FROZEN_CROPS = new Set<FrozenCrop>(['tomato', 'potato', 'corn', 'rice']);

export const STATE_OPTIONS: StateOption[] = [
  { id: 'TN', label: 'Tamil Nadu' },
  { id: 'KL', label: 'Kerala' },
  { id: 'UP', label: 'Uttar Pradesh' },
  { id: 'AP', label: 'Andhra Pradesh' },
  { id: 'CENTRAL', label: 'Others', meaning: 'Central Government schemes only' },
];

export class Restricted22Service {
  private preventionData: RestrictedPreventionKB = preventionKB;
  private schemeData: SchemeKBV3 = schemeKBV3;

  /**
   * Normalizes crop to one of the 4 frozen model crops: tomato, potato, corn, rice.
   * Returns null if outside frozen 4-crop scope.
   */
  public normalizeCrop(rawCrop: string, rawClass?: string): FrozenCrop | null {
    let clean = (rawCrop || '').toLowerCase().trim();
    clean = clean.replace(/\b(leaf|leaves|plant|crop|tree|seedling)\b/g, '').trim();

    if (clean.includes('tomato')) return 'tomato';
    if (clean.includes('potato')) return 'potato';
    if (clean.includes('corn') || clean.includes('maize')) return 'corn';
    if (clean.includes('rice') || clean.includes('paddy')) return 'rice';

    // If crop not clear, check rawClass (e.g., "Tomato Early Blight", "Asiatic rice borer", "Armyworm - Corn/Rice")
    if (rawClass) {
      const classLower = rawClass.toLowerCase();
      if (
        classLower.includes('rice') ||
        classLower.includes('paddy') ||
        classLower.includes('planthopper') ||
        classLower.includes('leaf roller') ||
        classLower.includes('rice borer')
      ) {
        return 'rice';
      }
      if (classLower.includes('tomato')) return 'tomato';
      if (classLower.includes('potato')) return 'potato';
      if (
        classLower.includes('corn') ||
        classLower.includes('maize') ||
        classLower.includes('corn borer')
      ) {
        return 'corn';
      }
      if (classLower.includes('armyworm')) {
        return 'corn'; // Fallback to corn for Armyworm if crop unspecified
      }
    }

    return null;
  }

  /**
   * Normalizes state input to SupportedState ('TN' | 'KL' | 'UP' | 'AP' | 'CENTRAL')
   */
  public normalizeState(rawState: string): SupportedState | null {
    if (!rawState) return null;
    const clean = rawState.toUpperCase().trim();
    if (clean === 'TN' || clean === 'TAMIL NADU') return 'TN';
    if (clean === 'KL' || clean === 'KERALA') return 'KL';
    if (clean === 'UP' || clean === 'UTTAR PRADESH') return 'UP';
    if (clean === 'AP' || clean === 'ANDHRA PRADESH') return 'AP';
    if (clean === 'CENTRAL' || clean === 'OTHERS' || clean === 'OTHER' || clean === 'CENTRAL GOVERNMENT') return 'CENTRAL';
    return null;
  }

  /**
   * Normalizes class name into one of the 22 frozen labels
   */
  public normalizeClassName(rawClass: string, crop: FrozenCrop): string {
    let clean = (rawClass || '').toLowerCase().trim();

    // Remove language scripts / parens
    clean = clean.replace(/\(.*?\)/g, '').trim();

    // Remove crop name prefix if present
    clean = clean.replace(new RegExp(`^${crop}\\s+`, 'i'), '').trim();

    // Map common aliases
    if (clean.includes('early blight')) return 'Early blight';
    if (clean.includes('late blight')) return 'Late blight';
    if (clean.includes('leaf mold') || clean.includes('leaf mould')) return 'Leaf mold';
    if (clean.includes('septoria')) return 'Septoria leaf spot';
    if (clean.includes('bacterial spot')) return 'Bacterial spot';
    if (
      clean.includes('yellow leaf curl') ||
      clean.includes('leaf curl virus') ||
      clean.includes('curl virus')
    ) {
      return 'Yellow leaf curl virus';
    }
    if (clean.includes('healthy')) return 'Healthy';

    if (clean.includes('gray leaf') || clean.includes('grey leaf')) return 'Gray leaf spot';
    if (clean.includes('common rust') || clean === 'rust') return 'Common rust';
    if (clean.includes('northern leaf')) return 'Northern leaf blight';

    if (clean.includes('bacterial leaf blight') || clean.includes('bacterial blight')) {
      return 'Bacterial leaf blight';
    }
    if (clean.includes('brown spot')) return 'Brown spot';
    if (clean.includes('leaf smut') || clean.includes('smut')) return 'Leaf smut';

    // Pests
    if (clean.includes('planthopper') || clean.includes('bph')) return 'Brown planthopper';
    if (clean.includes('rice borer') || clean.includes('stem borer')) return 'Asiatic rice borer';
    if (clean.includes('leaf roller') || clean.includes('leaf folder')) return 'Rice leaf roller';
    if (clean.includes('corn borer')) return 'Corn borer';
    if (clean.includes('armyworm')) return 'Armyworm';

    // Fallback: match capitalized original
    return rawClass.trim();
  }

  /**
   * Looks up prevention from Restricted_22_Class_Prevention_KB.json
   * Match using: crop + class_name
   */
  public lookupPrevention(
    rawCrop: string,
    rawClass: string
  ): {
    entry: RestrictedPreventionEntry | null;
    isPest: boolean;
  } {
    const crop = this.normalizeCrop(rawCrop, rawClass);
    if (!crop || !FROZEN_CROPS.has(crop)) {
      return { entry: null, isPest: false };
    }

    const normalizedClass = this.normalizeClassName(rawClass, crop);

    // Exact crop + class_name match
    const match = this.preventionData.entries.find(
      (e) =>
        e.crop === crop &&
        e.class_name.toLowerCase() === normalizedClass.toLowerCase()
    );

    if (match) {
      return {
        entry: match,
        isPest: match.class_type === 'pest',
      };
    }

    return { entry: null, isPest: false };
  }

  /**
   * Evaluates Government Schemes from Crop_Support_Scheme_KB_22Class_v3.json
   *
   * STRICT GATES:
   * 1. Severity Gate: Only evaluates when existing severity is "severe" or "critical".
   *    If severity is "healthy", "low", "moderate", "unknown", or missing, returns [].
   * 2. Crop Gate: Crop must be in frozen 4 crops (tomato, potato, corn, rice).
   * 3. Healthy Gate: If predicted class is "healthy", returns [] (no schemes for healthy crops).
   * 4. State Gate: Supported states are TN, KL, UP, AP, CENTRAL ("Others").
   *    Others ("CENTRAL") evaluates Central schemes ONLY.
   * 5. Hard rules:
   *    - Kerala: KL-STATE-CROP-INSURANCE applies specifically to Rice/Paddy pest/disease loss > 50%.
   *      Do NOT apply to Tomato, Potato, Corn.
   *    - Uttar Pradesh: UP-PMFBY covers Rice, Corn, Potato. Tomato must NOT automatically receive PMFBY.
   *    - Andhra Pradesh: AP-DR-YSR-FCI-PMFBY covers Rice and Corn. Tomato and Potato must NOT automatically receive PMFBY.
   * 6. Conservative language: Always "Potentially relevant" & "Eligibility requires verification".
   * 7. Limit: Maximum 2 cards returned.
   */
  public evaluateSevereSchemes(
    rawCrop: string,
    rawSeverity: string,
    rawState: string = 'TN',
    rawClass?: string
  ): CompactSchemeCard[] {
    const severityLower = (rawSeverity || '').toLowerCase().trim();

    // GATE 1: Severity Gate (severe / critical only)
    if (severityLower !== 'severe' && severityLower !== 'critical') {
      return [];
    }

    // GATE 2: Healthy Crop Gate (healthy crops never show government schemes)
    if (rawClass) {
      const classLower = rawClass.toLowerCase().trim();
      if (classLower === 'healthy' || classLower.includes('healthy')) {
        return [];
      }
    }

    // GATE 3: Scope Crop Gate
    const crop = this.normalizeCrop(rawCrop, rawClass);
    if (!crop || !FROZEN_CROPS.has(crop)) {
      return [];
    }

    // GATE 4: State Gate
    const state = this.normalizeState(rawState);
    if (!state) {
      return [];
    }

    const matchedSchemes: CompactSchemeCard[] = [];

    const formatCard = (
      scheme: SchemeV3,
      whyRelevant: string,
      importantCondition: string
    ): CompactSchemeCard => {
      const officialLink =
        scheme.official_source ||
        scheme.official_source_pdf ||
        scheme.official_portal ||
        scheme.official_state_page ||
        scheme.application_portal ||
        'https://pmfby.gov.in/';

      const cropCapitalized = crop.charAt(0).toUpperCase() + crop.slice(1);

      return {
        scheme_id: scheme.scheme_id,
        scheme_name: scheme.name,
        jurisdiction: scheme.jurisdiction,
        crop: cropCapitalized,
        why_relevant: whyRelevant,
        important_condition: importantCondition,
        official_link: officialLink,
        status: 'Potentially relevant',
        category: scheme.category,
      };
    };

    // Filter available schemes strictly matching state filter
    const stateSchemes = this.schemeData.schemes.filter(
      (s) => s.state_filter === state
    );

    if (state === 'CENTRAL') {
      // OTHERS = Central Government schemes ONLY
      const pmfby = stateSchemes.find((s) => s.scheme_id === 'CENTRAL-PMFBY');
      if (pmfby && pmfby.model_crops.includes(crop)) {
        matchedSchemes.push(
          formatCard(
            pmfby,
            pmfby.why_relevant,
            'Crop must be currently notified in your district and season, and enrollment / loss assessment conditions satisfied.'
          )
        );
      }
    } else if (state === 'TN') {
      // TAMIL NADU
      const tnPmfby = stateSchemes.find((s) => s.scheme_id === 'TN-PMFBY');
      if (tnPmfby && tnPmfby.model_crops.includes(crop)) {
        matchedSchemes.push(
          formatCard(
            tnPmfby,
            tnPmfby.why_relevant,
            'Requires current Tamil Nadu notification for your crop, insurance unit, and season, with valid policy enrollment.'
          )
        );
      }
    } else if (state === 'KL') {
      // KERALA
      // 1. KL-STATE-CROP-INSURANCE: Paddy/Rice only for pest/disease loss > 50%
      if (crop === 'rice') {
        const stateCropIns = stateSchemes.find(
          (s) => s.scheme_id === 'KL-STATE-CROP-INSURANCE'
        );
        if (stateCropIns) {
          matchedSchemes.push(
            formatCard(
              stateCropIns,
              'Official 2025 circular provides full crop-loss compensation specifically for pest/disease attack in paddy exceeding 50% loss.',
              'Mandatory AIMS registration, verified qualifying loss >50%, and official Krishi Bhavan field inspection.'
            )
          );
        }
      }

      // 2. KL-RWBCIS: Weather Based Crop Insurance
      const rwbcis = stateSchemes.find((s) => s.scheme_id === 'KL-RWBCIS');
      if (rwbcis && rwbcis.model_crops.includes(crop)) {
        let note = 'Requires current Kerala RWBCIS notification for your crop, season, and covered weather trigger.';
        if (crop === 'tomato') {
          note = 'Listed under Rabi RWBCIS in Kerala Annual Plan; exact current notification and weather triggers must be verified.';
        } else if (crop === 'potato') {
          note = 'Listed in Idukki under Rabi crops; exact notification and weather triggers must be verified.';
        }
        matchedSchemes.push(
          formatCard(
            rwbcis,
            rwbcis.why_relevant,
            note
          )
        );
      }
    } else if (state === 'UP') {
      // UTTAR PRADESH
      // 1. UP-PMFBY: explicitly covers rice, corn, potato. Tomato must NOT get PMFBY!
      const upPmfby = stateSchemes.find((s) => s.scheme_id === 'UP-PMFBY');
      if (upPmfby && upPmfby.model_crops.includes(crop)) {
        matchedSchemes.push(
          formatCard(
            upPmfby,
            upPmfby.why_relevant,
            'Requires current UP season notification for your district/insurance unit and valid farmer coverage.'
          )
        );
      }

      // 2. UP-RWBCIS: Restructured Weather Based Crop Insurance Scheme
      const upRwbcis = stateSchemes.find((s) => s.scheme_id === 'UP-RWBCIS');
      if (upRwbcis && upRwbcis.model_crops.includes(crop)) {
        let condition = 'Current UP notification, district weather trigger, and seasonal enrollment conditions must be satisfied.';
        if (crop === 'tomato') {
          condition = 'Referenced under RWBCIS in selected UP districts only (not statewide coverage); current district notification must be verified.';
        }
        matchedSchemes.push(
          formatCard(
            upRwbcis,
            upRwbcis.why_relevant,
            condition
          )
        );
      }
    } else if (state === 'AP') {
      // ANDHRA PRADESH
      // 1. AP-DR-YSR-FCI-PMFBY: covers Rice and Corn only. NOT Tomato or Potato!
      const apPmfby = stateSchemes.find((s) => s.scheme_id === 'AP-DR-YSR-FCI-PMFBY');
      if (apPmfby && apPmfby.model_crops.includes(crop)) {
        matchedSchemes.push(
          formatCard(
            apPmfby,
            apPmfby.why_relevant,
            'Requires current AP notification for your district, season, e-Panta/e-crop record, and Aadhaar verification.'
          )
        );
      }

      // 2. AP-MIDH-HORTICULTURE: Tomato only (development/subsidy support)
      if (crop === 'tomato') {
        const midh = stateSchemes.find((s) => s.scheme_id === 'AP-MIDH-HORTICULTURE');
        if (midh) {
          matchedSchemes.push(
            formatCard(
              midh,
              midh.why_relevant,
              'Development/re-establishment subsidy support; not automatic disease-loss compensation. Requires active AP horticulture component.'
            )
          );
        }
      }

      // 3. AP-CROP-LOSS-ASSISTANCE: Natural Calamity Assistance (contingent on official declaration)
      const apCalamity = stateSchemes.find((s) => s.scheme_id === 'AP-CROP-LOSS-ASSISTANCE');
      if (apCalamity && apCalamity.model_crops.includes(crop)) {
        matchedSchemes.push(
          formatCard(
            apCalamity,
            apCalamity.why_relevant,
            'Requires official calamity declaration and village agriculture assistant field damage assessment; not automatic disease compensation.'
          )
        );
      }
    }

    // Rank & return maximum 2 cards
    return matchedSchemes.slice(0, 2);
  }
}

export const restricted22Service = new Restricted22Service();
