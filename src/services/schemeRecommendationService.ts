import {
  FarmerLossAssessment,
  FarmerState,
  RecommendedSchemeResult,
  SchemeKBDocument,
  SchemeKBItem,
  SchemeSeverityLevel,
} from '../types/schemes_kb';
import rawSchemeData from '../data/India_Central_Kerala_TamilNadu_Government_Agriculture_Scheme_KB_v2.json';
import { preventionService } from './preventionService';

const schemeKB = rawSchemeData as SchemeKBDocument;

const HORTICULTURE_CROPS = new Set([
  'tomato',
  'chilli',
  'brinjal',
  'okra',
  'potato',
  'onion',
  'banana',
  'papaya',
  'pineapple',
  'mango',
  'guava',
  'jackfruit',
  'coconut',
  'pepper',
  'ginger',
  'turmeric',
  'cardamom',
  'nutmeg',
  'cabbage',
  'carrot',
  'garlic',
  'french bean',
  'ash gourd',
  'pumpkin',
  'cucumber',
  'snake gourd',
  'bitter gourd',
  'yard long bean',
]);

const NOTIFIED_FIELD_AND_COMMERCIAL_CROPS = new Set([
  'rice',
  'paddy',
  'wheat',
  'maize',
  'corn',
  'pulses',
  'oilseeds',
  'millets',
  'sugarcane',
  'cotton',
  'groundnut',
  'sesamum',
  'rubber',
  'cashew',
  'arecanut',
  'tea',
  'coffee',
  'tobacco',
  'betelvine',
]);

export class SchemeRecommendationService {
  private kb: SchemeKBDocument = schemeKB;

  /**
   * Evaluates severity from farmer's loss assessment
   */
  public evaluateSeverity(assessment: FarmerLossAssessment): SchemeSeverityLevel {
    // If the farmer explicitly confirmed/selected a severity chip
    if (assessment.confirmedSeverity) {
      return assessment.confirmedSeverity;
    }

    if (
      assessment.impact === 'crop_lost' ||
      assessment.affectedAreaRange === '>70%'
    ) {
      return 'critical';
    }

    if (
      assessment.impact === 'major_loss' ||
      assessment.affectedAreaRange === '>50%'
    ) {
      return 'severe';
    }

    if (
      assessment.impact === 'yield_affected' ||
      assessment.affectedAreaRange === '25-50%' ||
      (assessment.isSpreading && assessment.affectedAreaRange !== '<25%')
    ) {
      return 'moderate';
    }

    return 'low';
  }

  /**
   * Recommends top 1 to 3 schemes based on dataset rules and farmer profile
   */
  public recommendSchemes(
    rawCrop: string,
    rawDisease: string,
    assessment: FarmerLossAssessment
  ): {
    severity: SchemeSeverityLevel;
    recommended: RecommendedSchemeResult[];
    noMatchMessage?: string;
    criticalRule: string;
  } {
    const normalizedCrop = preventionService.normalizeCrop(rawCrop, rawDisease);
    const normalizedDisease = preventionService.normalizeDisease(rawDisease, normalizedCrop);
    const severity = this.evaluateSeverity(assessment);
    const state = assessment.state;
    const isLossOver50 =
      assessment.affectedAreaRange === '>50%' ||
      assessment.affectedAreaRange === '>70%' ||
      assessment.impact === 'major_loss' ||
      assessment.impact === 'crop_lost';

    const isRecognizedAgricultureCrop =
      HORTICULTURE_CROPS.has(normalizedCrop) ||
      NOTIFIED_FIELD_AND_COMMERCIAL_CROPS.has(normalizedCrop);

    // If crop is not a recognized cultivated crop in the knowledge base, do not hallucinate matching schemes
    if (!isRecognizedAgricultureCrop) {
      return {
        severity,
        recommended: [],
        noMatchMessage:
          'No specific government scheme could be confidently matched to the current crop, location and reported situation.',
        criticalRule: this.kb.critical_rule,
      };
    }

    const scoredSchemes: { scheme: SchemeKBItem; score: number; reason: string; eligibility: string }[] = [];

    for (const scheme of this.kb.schemes) {
      let score = 0;
      let reason = '';
      let eligibility = '';

      // Rule 1: Jurisdiction Match
      const jLower = scheme.jurisdiction.toLowerCase();
      const isKeralaScheme = jLower === 'kerala';
      const isTamilNaduScheme = jLower === 'tamil nadu';
      const isCentralScheme = jLower.includes('india');

      if (state === 'Kerala') {
        if (isTamilNaduScheme) continue; // Exclude TN schemes
      } else if (state === 'Tamil Nadu') {
        if (isKeralaScheme) continue; // Exclude Kerala schemes
      } else {
        // Other states
        if (isKeralaScheme || isTamilNaduScheme) continue;
      }

      // Rule 2 & Special Rule: Kerala Restructured State Crop Insurance Scheme
      if (scheme.id === 'KL-STATE-CROP-INSURANCE') {
        // Crucial Official 2025-26 Rule: Pest/disease compensation is specifically provided for PADDY (RICE) only!
        // Also: loss must exceed 50% and partial damage is not considered.
        if (normalizedCrop !== 'rice') {
          // Do NOT create false relationship: Tomato/Banana/etc -> Kerala State Crop Insurance disease compensation
          continue;
        }

        if (!isLossOver50 || (severity !== 'severe' && severity !== 'critical')) {
          // Paddy compensation is only provided when crop loss exceeds 50%
          continue;
        }

        score += 150; // Top ranked for paddy with >50% pest/disease loss in Kerala
        reason = 'Official Kerala 2025-26 order explicitly provides crop-loss compensation for pest/disease attack in paddy when loss exceeds 50%.';
        eligibility = 'Requires active AIMS registration, enrollment under State Crop Insurance, qualifying crop loss >50%, and official Krishi Bhavan verification.';
      }

      // Crop-specific gate: Coconut Development Board
      if (scheme.id === 'TN-CDB') {
        if (normalizedCrop !== 'coconut') continue;
        score += 80;
        reason = 'Specifically supports coconut growers with insurance and management interventions in Tamil Nadu.';
        eligibility = 'Registered coconut farmers with eligible tree count and beneficiary contribution.';
      }

      // Crop-specific gate: Oil Palm
      if (scheme.id === 'TN-NMEO-OP') {
        if (normalizedCrop !== 'oil palm') continue;
        score += 80;
        reason = 'Assistance for oil palm cultivation and maintenance interventions.';
        eligibility = 'Approved oil palm cultivation area and grower guidelines.';
      }

      // Crop-specific gate: Bamboo
      if (scheme.id === 'TN-NBM') {
        if (normalizedCrop !== 'bamboo') continue;
        score += 80;
        reason = 'National Bamboo Mission support.';
        eligibility = 'Approved bamboo project component.';
      }

      // Crop-specific gate: Kerala Crop Diversification
      if (scheme.id === 'KL-CROP-DIVERSIFICATION') {
        const isPulseOrMillet = ['pulses', 'oilseeds', 'millets', 'betel vine'].some((c) =>
          normalizedCrop.includes(c)
        );
        if (!isPulseOrMillet) continue;
        score += 60;
        reason = 'Assistance for small/marginal farmers cultivating pulses, oilseeds, or millets in Kerala.';
        eligibility = 'Small and marginal farmers or registered groups in approved areas.';
      }

      // Crop-specific gate: Kerala PMFBY / RWBCIS
      if (scheme.id === 'KL-PMFBY-RWBCIS') {
        const covered = scheme.covered_crops_from_kerala_plan || [];
        const isCropCovered = covered.some((c) =>
          normalizedCrop.includes(c.toLowerCase()) || c.toLowerCase().includes(normalizedCrop)
        );
        if (!isCropCovered) continue;

        if (severity !== 'severe' && severity !== 'critical') {
          // Insurance priority is for severe/critical loss
          continue;
        }

        score += 90;
        reason = `Notified crop (${normalizedCrop}) covered under Kerala's Annual Plan for crop insurance.`;
        eligibility = 'Seasonal notification, insurance enrollment before cut-off date, and covered perils/damage criteria.';
      }

      // Horticulture Schemes (IN-MIDH, TN-MIDH)
      if (scheme.id === 'IN-MIDH' || scheme.id === 'TN-MIDH') {
        if (!HORTICULTURE_CROPS.has(normalizedCrop)) {
          continue; // Not a horticulture crop
        }
        if (severity === 'low') {
          score += 40;
          reason = `Horticulture development support, certified planting material, and protected cultivation for ${normalizedCrop}.`;
        } else if (severity === 'moderate') {
          score += 70;
          reason = `Crop management and horticulture input support for ${normalizedCrop} under Mission for Integrated Development of Horticulture.`;
        } else {
          score += 60;
          reason = `Support for rejuvenation, replanting material, and canopy management under MIDH for ${normalizedCrop}.`;
        }
        eligibility = 'Eligible horticulture grower adhering to current state action plan and scheme guidelines.';
      }

      // Emergency / Contingency Crop Health (KL-CONTINGENCY-CROP-HEALTH)
      if (scheme.id === 'KL-CONTINGENCY-CROP-HEALTH') {
        if (severity === 'severe' || severity === 'critical') {
          score += 100;
          reason = 'Departmental contingency programme activated during endemic pest/disease attack in Kerala to supply buffer seeds, debris removal, and crop recovery.';
          eligibility = 'Subject to departmental programme activation by the Kerala Agriculture Department in affected areas.';
        } else {
          continue;
        }
      }

      // Crop Health Management (KL-CROP-HEALTH-MANAGEMENT)
      if (scheme.id === 'KL-CROP-HEALTH-MANAGEMENT') {
        if (severity === 'moderate' || severity === 'severe') {
          score += 75;
          reason = 'Kerala state plan scheme providing technical and subsidized crop health management for disease-affected plots.';
          eligibility = 'Available through local Krishi Bhavan subject to current departmental implementation.';
        } else {
          score += 35;
          reason = 'Routine crop health monitoring and plant health clinic advisory in Kerala.';
          eligibility = 'Active farmer registered with Krishi Bhavan.';
        }
      }

      // All-India Crop Insurance (IN-PMFBY)
      if (scheme.id === 'IN-PMFBY') {
        if (severity !== 'severe' && severity !== 'critical') {
          continue; // Not shown for low/moderate per dataset severity logic
        }
        score += 85;
        reason = 'National crop insurance scheme for notified crops and areas in participating states.';
        eligibility = 'Crop must be notified in the current season/district; policy enrollment prior to cut-off date required.';
      }

      // Agricultural Credit (IN-KCC)
      if (scheme.id === 'IN-KCC') {
        if (severity === 'moderate' || severity === 'severe') {
          score += 55;
          reason = 'Short-term credit for crop cultivation expenses, bio-inputs, and working capital needs caused by crop distress.';
          eligibility = 'All eligible farmers, subject to bank appraisal and RBI/NABARD guidelines.';
        } else {
          continue;
        }
      }

      // PM-KISAN
      if (scheme.id === 'IN-PMKISAN') {
        if (severity === 'low') {
          score += 30;
          reason = 'General direct income support (₹6,000/year) for landholding farmer families.';
          eligibility = 'Landholding farmer family with cultivable land, subject to standard institutional exclusion criteria.';
        } else {
          // Lower priority for severe losses
          score += 10;
          reason = 'Assured basic income support; disease status does not alter eligibility.';
          eligibility = 'Registered landholding farmer family on PM-KISAN portal.';
        }
      }

      // Micro Irrigation (IN-PER-DROP-MORE-CROP, TN-PER-DROP-MORE-CROP)
      if (scheme.id === 'IN-PER-DROP-MORE-CROP' || scheme.id === 'TN-PER-DROP-MORE-CROP') {
        if (severity === 'low' || severity === 'moderate') {
          score += 35;
          reason = 'Irrigation efficiency and drainage improvement support; beneficial to prevent water stagnation in disease-prone fields.';
          eligibility = 'Operational landholding farmers with higher subsidy patterns for small/marginal farmers.';
        } else {
          continue;
        }
      }

      // Soil Health Card
      if (scheme.id === 'IN-SOIL-HEALTH-CARD') {
        if (severity === 'low') {
          score += 25;
          reason = 'Free soil testing and customized nutrient recommendations to boost plant immunity.';
          eligibility = 'Available to all cultivating farmers via local agriculture department.';
        } else {
          continue;
        }
      }

      // Organic / Natural Farming (PKVY, NMNF, TN-PKVY, TN-NMNF)
      if (
        scheme.id === 'IN-PKVY' ||
        scheme.id === 'TN-PKVY' ||
        scheme.id === 'IN-NMNF' ||
        scheme.id === 'TN-NMNF'
      ) {
        if (severity === 'low' || severity === 'moderate') {
          score += 25;
          reason = 'Capacity building, organic certification, and bio-input support to enhance crop resilience naturally.';
          eligibility = 'Farmers participating in recognized organic/natural farming clusters.';
        } else {
          continue;
        }
      }

      // PM-RKVY (IN-PM-RKVY, TN-PM-RKVY, TN-AGROFORESTRY-PM-RKVY)
      if (
        scheme.id === 'IN-PM-RKVY' ||
        scheme.id === 'TN-PM-RKVY' ||
        scheme.id === 'TN-AGROFORESTRY-PM-RKVY'
      ) {
        if (severity === 'moderate' || severity === 'severe') {
          score += 45;
          reason = 'Broad agricultural development framework funding infrastructure, extension, and approved state project components.';
          eligibility = 'Approved state project/DPR component and targeted beneficiary group.';
        } else {
          continue;
        }
      }

      // State priority bonus
      if ((state === 'Kerala' && isKeralaScheme) || (state === 'Tamil Nadu' && isTamilNaduScheme)) {
        score += 15;
      }

      if (score > 0) {
        scoredSchemes.push({
          scheme,
          score,
          reason,
          eligibility: eligibility || scheme.matching_note || 'Official verification required.',
        });
      }
    }

    // Sort descending by score
    scoredSchemes.sort((a, b) => b.score - a.score);

    // Limit to top 1-3 schemes (Part 8 requirement: recommended 1-3 schemes, do not dump database)
    const topCandidates = scoredSchemes.slice(0, 3);

    if (topCandidates.length === 0) {
      return {
        severity,
        recommended: [],
        noMatchMessage:
          'No specific government scheme could be confidently matched to the current crop, location and reported situation.',
        criticalRule: this.kb.critical_rule,
      };
    }

    const recommended: RecommendedSchemeResult[] = topCandidates.map((c, index) => {
      // Determine verification status
      const status: 'Potentially Relevant' | 'Eligibility Requires Verification' =
        c.scheme.type.includes('insurance') || c.scheme.type.includes('compensation')
          ? 'Eligibility Requires Verification'
          : 'Potentially Relevant';

      return {
        scheme: c.scheme,
        rank: index + 1,
        status,
        relevanceReason: c.reason,
        importantEligibility: c.eligibility,
        benefitInfo:
          c.scheme.source_evidence ||
          c.scheme.matching_note ||
          'Assistance and subsidy subject to applicable government guidelines.',
        officialReference: {
          source: c.scheme.official_source || 'State Agriculture Department Portal',
          document: c.scheme.official_document,
          evidence: c.scheme.source_evidence,
        },
      };
    });

    return {
      severity,
      recommended,
      criticalRule: this.kb.critical_rule,
    };
  }
}

export const schemeRecommendationService = new SchemeRecommendationService();
