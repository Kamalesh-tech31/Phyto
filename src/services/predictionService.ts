import { analyzeQuality } from '../ml/quality';
import defaultQualityConfig from '../ml/quality.config.json';
import {
  ConfidenceLevel,
  DiseaseId,
  PredictionResult,
  QualityCheckResult,
  SeverityLevel,
} from '../types';
import { modelService } from './modelService';
import { mapModelClassName } from './classMappingAdapter';
import { t } from './i18n';

/**
 * Pluggable Prediction Engine interface
 * Implemented by TensorFlow.js MobileNetV3 GraphModel engine for on-device inference.
 */
export interface IPredictionEngine {
  checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult>;
  predict(imageUrl: string, presetType?: string): Promise<PredictionResult>;
}

class PredictionService implements IPredictionEngine {
  /**
   * Evaluates leaf image quality using on-device neural edge quality analysis
   */
  public async checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult> {
    // Artificial small delay to simulate neural edge quality check
    await new Promise((r) => setTimeout(r, 350));

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
        advice: 'Photo is blurry — tap screen to focus on the leaf.',
        adviceMl: 'ഫോട്ടോ അവ്യക്തമാണ്. ക്യാമറ ഫോക്കസ് ചെയ്ത് വീണ്ടും ഫോട്ടോയെടുക്കുക.',
      };
    }

    // Real photo evaluation (from camera capture or gallery upload)
    if (imageUrl && !imageUrl.startsWith('sample:')) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image for quality check'));
          img.src = imageUrl;
        });

        let source: ImageBitmap | ImageData;
        if (typeof createImageBitmap === 'function') {
          source = await createImageBitmap(img);
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 256;
          canvas.height = img.naturalHeight || img.height || 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context failed');
          ctx.drawImage(img, 0, 0);
          source = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        const report = await analyzeQuality(source);

        const isBlurry =
          report.blur < defaultQualityConfig.blur.retakeThreshold ||
          report.tenengrad < defaultQualityConfig.tenengrad.retakeThreshold ||
          report.motionLikely;

        const isDim = report.brightness < defaultQualityConfig.brightness.minLuminance;
        const isBright = report.brightness > defaultQualityConfig.brightness.maxLuminance;
        const hasHeavyShadow = report.darkFraction > defaultQualityConfig.brightness.maxDarkFraction;
        const isLowCoverage = report.coverage < defaultQualityConfig.coverage.minCoverage;

        const sharpnessPass = !isBlurry;
        const lightPass = !isDim && !isBright;
        const shadowPass = !hasHeavyShadow;
        const distancePass = !isLowCoverage;

        const isAcceptable = sharpnessPass && report.verdict !== 'retake';

        return {
          sharpness: isBlurry
            ? 'blurry'
            : report.blur < defaultQualityConfig.blur.enhanceThreshold
            ? 'fair'
            : 'sharp',
          sharpnessLabel: isBlurry
            ? (report.motionLikely ? 'Motion blur' : 'Blurry / Unclear')
            : (report.blur < defaultQualityConfig.blur.enhanceThreshold ? 'Fair sharpness' : 'Sharp'),
          sharpnessLabelMl: isBlurry
            ? (report.motionLikely ? 'ചലനം കാരണം മങ്ങിയത്' : 'മങ്ങിയത് / വ്യക്തമല്ല')
            : 'വ്യക്തം',
          sharpnessPass,

          light: isDim ? 'dim' : isBright ? 'too_bright' : 'good',
          lightLabel: isDim ? 'Dim lighting' : isBright ? 'Too bright' : 'Good',
          lightLabelMl: isDim ? 'വെളിച്ചക്കുറവ്' : isBright ? 'അമിത വെളിച്ചം' : 'നല്ലത്',
          lightPass,

          shadow: hasHeavyShadow ? 'heavy' : 'good',
          shadowLabel: hasHeavyShadow ? 'Heavy shadow' : 'Even lighting',
          shadowLabelMl: hasHeavyShadow ? 'കനത്ത നിഴൽ' : 'തുല്യ വെളിച്ചം',
          shadowPass,

          distance: isLowCoverage ? 'too_far' : 'good',
          distanceLabel: isLowCoverage ? 'Too far / Not centered' : 'Good',
          distanceLabelMl: isLowCoverage ? 'വളരെ അകലെ' : 'നല്ലത്',
          distancePass,

          isAcceptable,
          advice: isBlurry
            ? (report.hints[0] || 'Photo is blurry — tap screen to focus or hold still.')
            : 'Good enough to analyse. Retaking in even light may improve accuracy.',
          adviceMl: isBlurry
            ? 'ഫോട്ടോ അവ്യക്തമാണ്. ക്യാമറ ഫോക്കസ് ചെയ്ത് അനങ്ങാതെ വീണ്ടുമെടുക്കുക.'
            : 'പരിശോധിക്കാൻ പര്യാപ്തമാണ്. തുല്യമായ വെളിച്ചത്തിൽ വീണ്ടുമെടുത്താൽ കൂടുതൽ കൃത്യത ലഭിച്ചേക്കാം.',
          quality: {
            ok: isAcceptable,
            reason: isBlurry ? 'blur' : undefined,
          },
        };
      } catch (err) {
        console.warn('Quality analysis error:', err);
      }
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
   * Runs disease & pest prediction:
   * - Preset demo samples retain their deterministic mock responses (Option to be decided by user)
   * - Real camera captures and gallery uploads run through the TensorFlow.js GraphModel
   */
  public async predict(imageUrl: string, presetType?: string): Promise<PredictionResult> {
    const id = `scan_${Date.now()}`;
    const timestamp = Date.now();

    // 1. Preset samples (Preserving existing behavior for demo presets)
    if (presetType === 'blurry' || presetType === 'uncertain' || (imageUrl && imageUrl.includes('blurry'))) {
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

    if (presetType === 'late_blight' || (imageUrl && imageUrl.includes('late_blight'))) {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
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

    if (presetType === 'healthy' || (imageUrl && imageUrl.includes('healthy'))) {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
        diseaseId: 'healthy',
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

    if (presetType === 'early_blight' || (imageUrl && imageUrl.startsWith('sample:'))) {
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Tomato leaf',
        cropMl: 'തക്കാളി ഇല',
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

    // 2. Real photo path: quality check first
    try {
      const quality = await this.checkQuality(imageUrl);
      if (!quality.isAcceptable || !quality.sharpnessPass) {
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
    } catch (e) {
      console.warn('[PredictionService] Quality check warning:', e);
    }

    // 3. Run TensorFlow.js on-device inference
    try {
      const inference = await modelService.predict(imageUrl);

      // Low confidence gate (< 0.60 as specified in labels.json)
      const minConfidence = modelService.getLabelsConfig()?.min_confidence ?? 0.6;
      if (inference.confidence < minConfidence) {
        return {
          id,
          timestamp,
          imageUrl,
          crop: 'Crop leaf',
          cropMl: 'വിളയുടെ ഇല',
          diseaseId: 'uncertain',
          diseaseName: 'I am not sure yet',
          diseaseNameMl: 'ഇതുവരെ ഉറപ്പില്ല',
          category: 'Low confidence',
          categoryMl: 'കുറഞ്ഞ ആത്മവിശ്വാസം',
          confidence: 'low',
          confidenceScore: inference.confidence,
          affectedAreaPercent: 0,
          severity: 'mild',
          isUncertain: true,
          uncertaintyReason: t('not_sure_retake'),
          uncertaintyReasonMl: 'ഉറപ്പില്ല. നല്ല വെളിച്ചത്തിൽ വീണ്ടും ഫോട്ടോയെടുക്കുക.',
          modelClassName: inference.class_name,
        };
      }

      // Map predicted class to UI & agronomic metadata
      const mapping = mapModelClassName(inference.class_name);
      if (!mapping) {
        return {
          id,
          timestamp,
          imageUrl,
          crop: 'Crop leaf',
          cropMl: 'വിളയുടെ ഇല',
          diseaseId: 'uncertain',
          diseaseName: 'I am not sure yet',
          diseaseNameMl: 'ഇതുവരെ ഉറപ്പില്ല',
          category: 'Unrecognized class',
          categoryMl: 'തിരിച്ചറിയാത്ത വിഭാഗം',
          confidence: 'low',
          confidenceScore: inference.confidence,
          affectedAreaPercent: 0,
          severity: 'mild',
          isUncertain: true,
          uncertaintyReason: 'This condition is not recognized by the model.',
          uncertaintyReasonMl: 'ഈ അവസ്ഥ മോഡൽ തിരിച്ചറിഞ്ഞിട്ടില്ല.',
          modelClassName: inference.class_name,
        };
      }

      const isHealthy = mapping.kind === 'healthy';
      const isPest = mapping.kind === 'pest';
      const isComingSoon = mapping.status === 'coming_soon';

      const confidenceLevel: ConfidenceLevel = inference.confidence >= 0.85 ? 'high' : 'medium';

      let affectedAreaPercent = 0;
      let severity: SeverityLevel = 'mild';

      if (isHealthy) {
        affectedAreaPercent = 0;
        severity = 'mild';
      } else if (isPest) {
        affectedAreaPercent = 15;
        severity = 'moderate';
      } else if (mapping.diseaseId.includes('late_blight')) {
        affectedAreaPercent = 42;
        severity = 'severe';
      } else {
        affectedAreaPercent = 20;
        severity = 'mild';
      }

      return {
        id,
        timestamp,
        imageUrl,
        crop: mapping.cropDisplayName,
        cropMl: mapping.cropDisplayNameMl,
        diseaseId: mapping.diseaseId as DiseaseId,
        diseaseName: mapping.diseaseName,
        diseaseNameMl: mapping.diseaseNameMl,
        category: mapping.category,
        categoryMl: mapping.categoryMl,
        confidence: confidenceLevel,
        confidenceScore: inference.confidence,
        affectedAreaPercent,
        severity,
        isUncertain: false,
        modelClassName: inference.class_name,
        status: mapping.status,
        grapeNotice: isComingSoon,
        pestNotice: isPest,
      };
    } catch (err) {
      console.error('[PredictionService] Inference failed:', err);
      // Fallback safe uncertain response, NEVER Early Blight
      return {
        id,
        timestamp,
        imageUrl,
        crop: 'Crop leaf',
        cropMl: 'വിളയുടെ ഇല',
        diseaseId: 'uncertain',
        diseaseName: 'I am not sure yet',
        diseaseNameMl: 'ഇതുവരെ ഉറപ്പില്ല',
        category: 'Inference error',
        categoryMl: 'സ്കാൻ പിശക്',
        confidence: 'low',
        confidenceScore: 0.3,
        affectedAreaPercent: 0,
        severity: 'mild',
        isUncertain: true,
        uncertaintyReason: 'Analysis could not be completed. Please retake the photo.',
        uncertaintyReasonMl: 'സ്കാൻ പൂർത്തിയാക്കാൻ കഴിഞ്ഞില്ല. വീണ്ടും ഫോട്ടോയെടുക്കുക.',
      };
    }
  }
}

export const predictionService = new PredictionService();
