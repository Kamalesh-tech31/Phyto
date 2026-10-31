import { FrozenCrop } from '../types/restricted_22';

export interface FrozenClassDefinition {
  classId: number;
  crop: FrozenCrop;
  className: string;
  type: 'disease' | 'healthy' | 'pest';
  aliases: string[];
}

export const FROZEN_22_CLASSES: FrozenClassDefinition[] = [
  // Tomato (0 - 6)
  {
    classId: 0,
    crop: 'tomato',
    className: 'Early blight',
    type: 'disease',
    aliases: ['early_blight', 'early blight', 'tomato early blight', 'bullseye spots'],
  },
  {
    classId: 1,
    crop: 'tomato',
    className: 'Late blight',
    type: 'disease',
    aliases: ['late_blight', 'late blight', 'tomato late blight', 'water-soaked patches'],
  },
  {
    classId: 2,
    crop: 'tomato',
    className: 'Leaf mold',
    type: 'disease',
    aliases: ['leaf_mold', 'leaf mold', 'leaf mould', 'tomato leaf mold'],
  },
  {
    classId: 3,
    crop: 'tomato',
    className: 'Septoria leaf spot',
    type: 'disease',
    aliases: ['septoria', 'septoria_leaf_spot', 'septoria leaf spot'],
  },
  {
    classId: 4,
    crop: 'tomato',
    className: 'Bacterial spot',
    type: 'disease',
    aliases: ['bacterial_spot', 'bacterial spot', 'tomato bacterial spot'],
  },
  {
    classId: 5,
    crop: 'tomato',
    className: 'Yellow leaf curl virus',
    type: 'disease',
    aliases: ['yellow_leaf_curl_virus', 'yellow leaf curl', 'curl virus', 'tylcv', 'leaf curl'],
  },
  {
    classId: 6,
    crop: 'tomato',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'tomato healthy', 'healthy leaf', 'clean green foliage'],
  },

  // Potato (7 - 9)
  {
    classId: 7,
    crop: 'potato',
    className: 'Early blight',
    type: 'disease',
    aliases: ['early_blight', 'early blight', 'potato early blight'],
  },
  {
    classId: 8,
    crop: 'potato',
    className: 'Late blight',
    type: 'disease',
    aliases: ['late_blight', 'late blight', 'potato late blight'],
  },
  {
    classId: 9,
    crop: 'potato',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'potato healthy'],
  },

  // Corn (10 - 13)
  {
    classId: 10,
    crop: 'corn',
    className: 'Gray leaf spot',
    type: 'disease',
    aliases: ['gray_leaf_spot', 'gray leaf spot', 'grey leaf spot'],
  },
  {
    classId: 11,
    crop: 'corn',
    className: 'Common rust',
    type: 'disease',
    aliases: ['common_rust', 'common rust', 'corn rust', 'rust'],
  },
  {
    classId: 12,
    crop: 'corn',
    className: 'Northern leaf blight',
    type: 'disease',
    aliases: ['northern_leaf_blight', 'northern leaf blight', 'nlb'],
  },
  {
    classId: 13,
    crop: 'corn',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'corn healthy', 'maize healthy'],
  },

  // Rice (14 - 16)
  {
    classId: 14,
    crop: 'rice',
    className: 'Bacterial leaf blight',
    type: 'disease',
    aliases: ['bacterial_leaf_blight', 'bacterial blight', 'rice bacterial leaf blight', 'blb', 'rice_bacterial_blight'],
  },
  {
    classId: 15,
    crop: 'rice',
    className: 'Brown spot',
    type: 'disease',
    aliases: ['brown_spot', 'brown spot', 'rice brown spot'],
  },
  {
    classId: 16,
    crop: 'rice',
    className: 'Leaf smut',
    type: 'disease',
    aliases: ['leaf_smut', 'leaf smut', 'smut'],
  },

  // Pests (17 - 21)
  {
    classId: 17,
    crop: 'rice',
    className: 'Brown planthopper',
    type: 'pest',
    aliases: ['brown_planthopper', 'brown planthopper', 'bph', 'planthopper'],
  },
  {
    classId: 18,
    crop: 'rice',
    className: 'Asiatic rice borer',
    type: 'pest',
    aliases: ['asiatic_rice_borer', 'rice borer', 'stem borer', 'stem_borer', 'rice stem borer'],
  },
  {
    classId: 19,
    crop: 'rice',
    className: 'Rice leaf roller',
    type: 'pest',
    aliases: ['rice_leaf_roller', 'leaf roller', 'leaf_roller', 'leaf folder'],
  },
  {
    classId: 20,
    crop: 'corn',
    className: 'Corn borer',
    type: 'pest',
    aliases: ['corn_borer', 'corn borer', 'european corn borer'],
  },
  {
    classId: 21,
    crop: 'corn',
    className: 'Armyworm',
    type: 'pest',
    aliases: ['armyworm', 'fall armyworm', 'faw', 'spodoptera'],
  },
];

/**
 * Normalizes an arbitrary crop string to one of the 4 model crops: tomato, potato, corn, rice.
 */
export function normalizeCrop(rawCrop?: string, rawDisease?: string): FrozenCrop | null {
  const cropStr = (rawCrop || '').toLowerCase();
  const diseaseStr = (rawDisease || '').toLowerCase();

  if (cropStr.includes('tomato')) return 'tomato';
  if (cropStr.includes('potato')) return 'potato';
  if (cropStr.includes('corn') || cropStr.includes('maize')) return 'corn';
  if (cropStr.includes('rice') || cropStr.includes('paddy')) return 'rice';

  // Check disease string for clues
  if (diseaseStr.includes('rice') || diseaseStr.includes('planthopper') || diseaseStr.includes('leaf roller') || diseaseStr.includes('rice borer')) {
    return 'rice';
  }
  if (diseaseStr.includes('corn') || diseaseStr.includes('maize') || diseaseStr.includes('corn borer') || diseaseStr.includes('common rust') || diseaseStr.includes('gray leaf') || diseaseStr.includes('northern leaf')) {
    return 'corn';
  }
  if (diseaseStr.includes('potato')) return 'potato';
  if (diseaseStr.includes('tomato') || diseaseStr.includes('septoria') || diseaseStr.includes('leaf mold')) return 'tomato';
  if (diseaseStr.includes('armyworm')) return 'corn';

  return null;
}

/**
 * Maps a crop and disease identifier (or model output) to one of the 22 frozen classes.
 * Returns null if not mappable, and warns in development.
 */
export function mapToFrozenClass(
  rawCrop?: string,
  rawDiseaseIdOrName?: string
): FrozenClassDefinition | null {
  const crop = normalizeCrop(rawCrop, rawDiseaseIdOrName);
  if (!crop) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ClassMappingAdapter] Unable to resolve crop from:', { rawCrop, rawDiseaseIdOrName });
    }
    return null;
  }

  const query = (rawDiseaseIdOrName || '').toLowerCase().trim();
  if (!query) {
    // If crop is recognized but disease is not specified, treat as general crop disease condition
    return {
      classId: -1,
      crop,
      className: `${crop.charAt(0).toUpperCase() + crop.slice(1)} condition`,
      type: 'disease',
      aliases: [],
    };
  }

  // 1. Direct search by crop and alias
  const match = FROZEN_22_CLASSES.find((item) => {
    if (item.crop !== crop) return false;
    if (item.className.toLowerCase() === query) return true;
    return item.aliases.some((alias) => query.includes(alias) || alias.includes(query));
  });

  if (match) {
    return match;
  }

  // 2. Global search for unique pest or disease name if crop was ambiguous
  const globalMatch = FROZEN_22_CLASSES.find((item) => {
    if (item.className.toLowerCase() === query) return true;
    return item.aliases.some((alias) => alias === query);
  });

  if (globalMatch) {
    return globalMatch;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[ClassMappingAdapter] Unmapped disease class for crop:', { crop, query, rawDiseaseIdOrName });
  }

  return null;
}
