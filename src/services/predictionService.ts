import {
  ConfidenceLevel,
  DiseaseId,
  PredictionResult,
  QualityCheckResult,
  SeverityLevel,
} from '../types';

/**
 * Pluggable Prediction Engine interface
 * When a real TensorFlow.js model (.json + .bin weights) is loaded,
 * this interface will be implemented by the TF.js engine without touching UI components.
 */
export interface IPredictionEngine {
  checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult>;
  predict(imageUrl: string, presetType?: string): Promise<PredictionResult>;
}

class PredictionService implements IPredictionEngine {
  /**
   * Evaluates leaf image quality (sharpness, lighting, shadow, distance)
   */
  public async checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult> {
    // Artificial small delay to simulate neural edge quality check
    await new Promise((r) => setTimeout(r, 450));

    // If preset is explicitly blurry
    if (presetType === 'blurry') {
      return {
        sharpness: 'blurry',
        sharpnessLabel: 'Blurry / Unclear',
        sharpnessLabelMl: 'മങ്ങിയത് / വ്യക്തമല്ല',
        sharpnessPass: false,

        light: 'dim',
        lightLabel: 'Dim lighting',
        lightLabelMl: 'വെളിച്ചക്കുറവ്',
        lightPass: false,

        shadow: 'heavy',
        shadowLabel: 'Heavy shadow',
        shadowLabelMl: 'കനത്ത നിഴൽ',
        shadowPass: false,

        distance: 'too_close',
        distanceLabel: 'Too close',
        distanceLabelMl: 'വളരെ അടുത്ത്',
        distancePass: false,

        isAcceptable: false,
        advice: 'Good enough to analyse. Retaking in even light may improve accuracy.',
        adviceMl: 'പരിശോധിക്കാൻ പര്യാപ്തമാണ്. തുല്യമായ വെളിച്ചത്തിൽ വീണ്ടുമെടുത്താൽ കൂടുതൽ കൃത്യത ലഭിച്ചേക്കാം.',
      };
    }

    // Default reference quality check
    return {
      sharpness: 'sharp',
      sharpnessLabel: 'Sharp',
      sharpnessLabelMl: 'വ്യക്തം',
      sharpnessPass: true,

      light: 'good',
      lightLabel: 'Good',
      lightLabelMl: 'നല്ലത്',
      lightPass: true,

      shadow: 'left_dark',
      shadowLabel: 'Left side dark',
      shadowLabelMl: 'ഇടതുഭാഗത്ത് ഇരുണ്ട്',
      shadowPass: false,

      distance: 'good',
      distanceLabel: 'Good',
      distanceLabelMl: 'നല്ലത്',
      distancePass: true,

      isAcceptable: true,
      advice: 'Good enough to analyse. Retaking in even light may improve accuracy.',
      adviceMl: 'പരിശോധിക്കാൻ പര്യാപ്തമാണ്. തുല്യമായ വെളിച്ചത്തിൽ വീണ്ടുമെടുത്താൽ കൂടുതൽ കൃത്യത ലഭിച്ചേക്കാം.',
    };
  }

  /**
   * Runs crop disease/pest diagnosis within the frozen 22-class model scope
   */
  public async predict(imageUrl: string, presetType?: string): Promise<PredictionResult> {
    // Simulate AI inference time (1.2 seconds)
    await new Promise((r) => setTimeout(r, 1200));

    const id = `scan_${Date.now()}`;
    const timestamp = Date.now();

    // 1. Uncertain state
    if (presetType === 'blurry' || presetType === 'uncertain') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato',
        cropMl: 'തക്കാളി',
        diseaseId: 'uncertain',
        diseaseName: 'I am not sure yet',
        diseaseNameMl: 'ഇതുവരെ ഉറപ്പില്ല',
        category: 'Inconclusive scan',
        categoryMl: 'വ്യക്തമല്ലാത്ത സ്കാൻ',
        confidence: 'low',
        confidenceScore: 0.38,
        affectedAreaPercent: 0,
        severity: 'mild',
        isUncertain: true,
        uncertaintyReason:
          'The photo is too blurry to tell a disease from a nutrient problem. Please retake photo in clear daylight.',
        uncertaintyReasonMl:
          'ഫോട്ടോ അവ്യക്തമായതിനാൽ കൃത്യമായ രോഗനിർണ്ണയം സാധ്യമല്ല. വ്യക്തമായ വെളിച്ചത്തിൽ വീണ്ടും ഫോട്ടോയെടുക്കുക.',
      };
    }

    // 2. Tomato: Late blight (Severe)
    if (presetType === 'late_blight') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato',
        cropMl: 'തക്കാളി',
        diseaseId: 'late_blight',
        diseaseName: 'Late blight',
        diseaseNameMl: 'ലേറ്റ് ബ്ലൈറ്റ് (കരിമ്പൻ)',
        category: 'Oomycete / Water mold',
        categoryMl: 'പൂപ്പൽ രോഗം',
        confidence: 'high',
        confidenceScore: 0.96,
        affectedAreaPercent: 42,
        severity: 'severe',
        isUncertain: false,
      };
    }

    // 3. Rice: Bacterial leaf blight (Severe)
    if (presetType === 'rice_bacterial_blight') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Rice',
        cropMl: 'നെല്ല് (Paddy)',
        diseaseId: 'bacterial_leaf_blight',
        diseaseName: 'Bacterial leaf blight',
        diseaseNameMl: 'ബാക്ടീരിയൽ ഇല കരിച്ചിൽ',
        category: 'Bacterial blight',
        categoryMl: 'ബാക്ടീരിയ രോഗം',
        confidence: 'high',
        confidenceScore: 0.95,
        affectedAreaPercent: 55,
        severity: 'severe',
        isUncertain: false,
      };
    }

    // 4. Rice Pest: Brown planthopper (Severe insect infestation)
    if (presetType === 'brown_planthopper') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Rice',
        cropMl: 'നെല്ല് (Paddy)',
        diseaseId: 'brown_planthopper',
        diseaseName: 'Brown planthopper',
        diseaseNameMl: 'മുഞ്ഞ (Brown planthopper)',
        category: 'Insect pest infestation',
        categoryMl: 'കീടബാധ (Pest)',
        confidence: 'high',
        confidenceScore: 0.93,
        affectedAreaPercent: 60,
        severity: 'severe',
        isUncertain: false,
      };
    }

    // 5. Corn: Common rust (Moderate)
    if (presetType === 'corn_common_rust') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Corn',
        cropMl: 'ചോളം (Maize)',
        diseaseId: 'common_rust',
        diseaseName: 'Common rust',
        diseaseNameMl: 'കോമൺ റസ്റ്റ് (തുരുമ്പ് രോഗം)',
        category: 'Fungal rust disease',
        categoryMl: 'ഫംഗസ് രോഗം',
        confidence: 'high',
        confidenceScore: 0.91,
        affectedAreaPercent: 28,
        severity: 'moderate',
        isUncertain: false,
      };
    }

    // 6. Corn/Rice Pest: Armyworm (Severe)
    if (presetType === 'armyworm') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Corn',
        cropMl: 'ചോളം (Maize)',
        diseaseId: 'armyworm',
        diseaseName: 'Armyworm',
        diseaseNameMl: 'പട്ടാളപ്പുഴു (Armyworm)',
        category: 'Lepidopteran pest',
        categoryMl: 'കീടബാധ (Pest)',
        confidence: 'high',
        confidenceScore: 0.94,
        affectedAreaPercent: 48,
        severity: 'severe',
        isUncertain: false,
      };
    }

    // 7. Healthy leaf
    if (presetType === 'healthy') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato',
        cropMl: 'തക്കാളി',
        diseaseId: 'healthy',
        diseaseName: 'Healthy',
        diseaseNameMl: 'ആരോഗ്യമുള്ള ഇല',
        category: 'Normal crop',
        categoryMl: 'സാധാരണ വിളവ്',
        confidence: 'high',
        confidenceScore: 0.98,
        affectedAreaPercent: 0,
        severity: 'mild',
        isUncertain: false,
      };
    }

    // 8. Default: Tomato Early Blight (Mild)
    return {
      id,
      timestamp,
      imageUrl,
      crop: 'Tomato',
      cropMl: 'തക്കാളി',
      diseaseId: 'early_blight',
      diseaseName: 'Early blight',
      diseaseNameMl: 'ഏർലി ബ്ലൈറ്റ് (ഇലപ്പുള്ളി)',
      category: 'Fungal disease',
      categoryMl: 'ഫംഗസ് രോഗം',
      confidence: 'high',
      confidenceScore: 0.94,
      affectedAreaPercent: 18,
      severity: 'mild',
      isUncertain: false,
      pestWarning: {
        name: 'Aphids',
        nameMl: 'മുഞ്ഞ (Aphids)',
        severityLabel: 'Pest · moderate',
        severityLabelMl: 'കീടബാധ · ഇടത്തരം',
        details: 'Small cluster of sap-sucking insects detected near midrib vein.',
        detailsMl: 'ഇലയുടെ ഞരമ്പുകൾക്ക് സമീപം നീരൂറ്റിക്കുടിക്കുന്ന പ്രാണികളെ കണ്ടെത്തി.',
      },
    };
  }
}

export const predictionService = new PredictionService();
