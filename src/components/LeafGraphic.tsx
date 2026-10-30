import React from 'react';

interface LeafGraphicProps {
  imageUrl?: string;
  variant?: 'healthy' | 'early_blight' | 'late_blight' | 'uncertain' | 'blurry';
  className?: string;
  showShadow?: boolean;
}

export const LeafGraphic: React.FC<LeafGraphicProps> = ({
  imageUrl,
  variant = 'early_blight',
  className = '',
  showShadow = false,
}) => {
  // If an actual image URL was captured or uploaded by user, render the photo
  if (imageUrl && !imageUrl.startsWith('sample:')) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt="Crop leaf"
          className="w-full h-full object-cover"
        />
        {showShadow && (
          <div className="absolute inset-y-0 left-0 w-1/4 bg-black/45 pointer-events-none" />
        )}
      </div>
    );
  }

  // Otherwise, render high-fidelity vector matching the reference graphics
  const isBlurry = variant === 'uncertain' || variant === 'blurry';
  const isHealthy = variant === 'healthy';
  const isLateBlight = variant === 'late_blight';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center bg-[#172b1d] overflow-hidden select-none ${className}`}
    >
      {/* Optional shadow mask on left side simulating realistic leaf check */}
      {showShadow && (
        <div className="absolute inset-y-0 left-0 w-[28%] bg-black/40 z-10 pointer-events-none" />
      )}

      <svg
        viewBox="0 0 200 320"
        className={`w-3/4 max-h-[82%] object-contain transition-all ${
          isBlurry ? 'blur-[3px] opacity-75' : ''
        }`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Leaf gradient */}
          <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#468853" />
            <stop offset="100%" stop-color="#346a40" />
          </linearGradient>

          {/* Late blight wet patch filter */}
          <radialGradient id="waterSoaked" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#2d3f27" stop-opacity="0.9" />
            <stop offset="70%" stop-color="#1e2c1a" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#141f11" stop-opacity="0" />
          </radialGradient>
        </defs>

        {/* Leaf base shape */}
        <path
          d="M100 20 C160 80 180 180 100 300 C20 180 40 80 100 20 Z"
          fill="url(#leafGrad)"
        />

        {/* Central main stem vein */}
        <path
          d="M100 25 L100 295"
          stroke="#264c2f"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Side lateral veins */}
        <path
          d="M100 80 L145 110 M100 80 L55 110"
          stroke="#2d5837"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M100 140 L160 175 M100 140 L40 175"
          stroke="#2d5837"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M100 205 L150 240 M100 205 L50 240"
          stroke="#2d5837"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Disease Symptoms representation */}
        {!isHealthy && !isBlurry && !isLateBlight && (
          // Early Blight: Characteristic concentric bullseye spots
          <g>
            {/* Spot 1 (Upper left) */}
            <circle cx="75" cy="135" r="13" fill="#995837" opacity="0.9" />
            <circle cx="75" cy="135" r="8" fill="#753d20" />
            <circle cx="75" cy="135" r="3" fill="#502511" />
            <circle
              cx="75"
              cy="135"
              r="17"
              stroke="#bf7b49"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              fill="none"
              opacity="0.6"
            />

            {/* Spot 2 (Lower right) */}
            <circle cx="128" cy="165" r="11" fill="#995837" opacity="0.9" />
            <circle cx="128" cy="165" r="6" fill="#753d20" />
            <circle cx="128" cy="165" r="2" fill="#502511" />

            {/* Spot 3 (Center lower) */}
            <circle cx="86" cy="205" r="8" fill="#8d4d2d" opacity="0.85" />
            <circle cx="86" cy="205" r="4" fill="#693318" />

            {/* Aphid tiny pest clusters */}
            <circle cx="106" cy="118" r="2.2" fill="#c49a45" />
            <circle cx="109" cy="122" r="1.8" fill="#d4ad57" />
            <circle cx="104" cy="124" r="1.9" fill="#bfa14c" />
          </g>
        )}

        {isLateBlight && (
          // Late Blight: Irregular dark brown water-soaked lesions
          <g>
            <path
              d="M60 110 Q90 100 110 130 Q120 170 85 185 Q50 170 60 110 Z"
              fill="url(#waterSoaked)"
            />
            <path
              d="M95 190 Q140 180 145 220 Q130 250 90 230 Z"
              fill="url(#waterSoaked)"
            />
            <circle cx="80" cy="140" r="16" fill="#3b2b1a" opacity="0.85" />
            <circle cx="120" cy="210" r="12" fill="#312214" opacity="0.85" />
          </g>
        )}
      </svg>
    </div>
  );
};
