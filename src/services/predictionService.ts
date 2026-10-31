import {
  ConfidenceLevel,
  DiseaseId,
  PredictionResult,
  QualityCheckResult,
  SeverityLevel,
} from '../types';
import { pesticideKbService } from './pesticideKbService';

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

    // Default reference quality check matching screenshot #2
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
      shadowPass: false, // warning amber check

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
   * Runs crop disease/pest diagnosis across all 22 classes
   */
  public async predict(imageUrl: string, presetType?: string): Promise<PredictionResult> {
    // Simulate AI inference time (1.2 seconds for realistic model feel)
    await new Promise((r) => setTimeout(r, 1200));

    const id = `scan_${Date.now()}`;
    const timestamp = Date.now();

    // 1. Uncertain state
    if (presetType === 'blurry' || presetType === 'uncertain') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
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
          'The photo is too blurry to tell a disease from a nutrient problem. I would rather ask for a clearer photo than guess wrong.',
        uncertaintyReasonMl:
          'ഫോട്ടോ അവ്യക്തമായതിനാൽ രോഗമാണോ പോഷകക്കുറവാണോ എന്ന് വേർതിരിക്കാൻ സാധിക്കുന്നില്ല. തെറ്റായി പറയുന്നതിനേക്കാൾ വ്യക്തമായ ഫോട്ടോ ആവശ്യപ്പെടുന്നതാണ് നല്ലത്.',
      };
    }

    // 2. Check if presetType is one of the 22 frozen classes
    if (presetType && presetType !== 'early_blight' && presetType !== 'late_blight' && presetType !== 'healthy' && presetType !== 'custom') {
      const kbRec = pesticideKbService.getRecordByClassId(presetType);
      if (kbRec) {
        const isHealthy = kbRec.type === 'healthy';
        const isPest = kbRec.type === 'pest';
        return {
          id,
          timestamp,
          imageUrl,
          crop: `${kbRec.crop.charAt(0).toUpperCase() + kbRec.crop.slice(1)} leaf`,
          cropMl: `${kbRec.crop} ഇല`,
          diseaseId: kbRec.class_id as DiseaseId,
          diseaseName: kbRec.class_name,
          diseaseNameMl: kbRec.class_name,
          category: isPest ? 'Insect pest' : isHealthy ? 'Normal crop' : 'Foliar pathology',
          categoryMl: isPest ? 'കീടബാധ' : isHealthy ? 'സാധാരണ വിളവ്' : 'രോഗബാധ',
          confidence: 'high',
          confidenceScore: 0.95,
          affectedAreaPercent: isHealthy ? 0 : 35,
          severity: isHealthy ? 'mild' : 'moderate',
          isUncertain: false,
        };
      }
    }

    // 3. Late Blight state
    if (presetType === 'late_blight') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
        diseaseId: 'tomato_late_blight',
        diseaseName: 'Late blight',
        diseaseNameMl: 'ലേറ്റ് ബ്ലൈറ്റ് (കരിമ്പൻ)',
        category: 'Oomycete / Water mold',
        categoryMl: 'പൂപ്പൽ രോഗം',
        confidence: 'high',
        confidenceScore: 0.96,
        affectedAreaPercent: 42,
        severity: 'severe',
        isUncertain: false,
        pestWarning: {
          name: 'Leaf Miner',
          nameMl: 'ഇല തുരപ്പൻ പുഴു',
          severityLabel: 'Pest · mild',
          severityLabelMl: 'കീടം · ലഘുവായത്',
          details: 'Occasional serpentine mines observed on surrounding foliage.',
          detailsMl: 'ചുറ്റുമുള്ള ഇലകളിൽ വെളുത്ത പാടുകൾ കണ്ടുവരുന്നു.',
        },
      };
    }

    // 4. Healthy state
    if (presetType === 'healthy') {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
        diseaseId: 'tomato_healthy',
        diseaseName: 'Healthy leaf',
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

    // 5. Default: Early Blight (Exact match to Reference Screenshot 3)
    return {
      id,
      timestamp,
      imageUrl,
      crop: 'Tomato leaf',
      cropMl: 'തക്കാളി ഇല',
      diseaseId: 'tomato_early_blight',
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
