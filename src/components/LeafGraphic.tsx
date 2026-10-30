import React from 'react';
import { RetroViewfinderArt } from './RetroViewfinderArt';

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

  // Otherwise, render stylish retro poster art using theme tokens
  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {showShadow && (
        <div className="absolute inset-y-0 left-0 w-[28%] bg-black/35 z-10 pointer-events-none" />
      )}
      <RetroViewfinderArt
        variant={variant}
        showOverlay={false}
        className="w-full h-full"
      />
    </div>
  );
};
