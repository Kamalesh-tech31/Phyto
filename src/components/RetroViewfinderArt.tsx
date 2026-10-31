import React from 'react';

export const RetroFrameOverlay: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 400 450"
    className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    preserveAspectRatio="none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 1.5px dashed inner line in vf-frame at 40% opacity, inset 14px, connecting corners */}
    <rect
      x="14"
      y="14"
      width="372"
      height="422"
      rx="6"
      fill="none"
      stroke="var(--color-vf-frame)"
      strokeWidth="1.5"
      strokeDasharray="6 6"
      opacity="0.4"
    />

    {/* 4px vf-frame L-shaped corners with rounded outer corners and thin dark outline for contrast, placed 14px inside frame edges */}
    <g stroke="var(--color-shadow-color)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Top-Left */}
      <path d="M 14,48 L 14,20 Q 14,14 20,14 L 48,14" />
      {/* Top-Right */}
      <path d="M 352,14 L 380,14 Q 386,14 386,20 L 386,48" />
      {/* Bottom-Left */}
      <path d="M 14,402 L 14,430 Q 14,436 20,436 L 48,436" />
      {/* Bottom-Right */}
      <path d="M 386,402 L 386,430 Q 386,436 380,436 L 352,436" />
    </g>

    {/* 4px vf-frame corner stroke on top */}
    <g stroke="var(--color-vf-frame)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Top-Left */}
      <path d="M 14,48 L 14,20 Q 14,14 20,14 L 48,14" />
      {/* Top-Right */}
      <path d="M 352,14 L 380,14 Q 386,14 386,20 L 386,48" />
      {/* Bottom-Left */}
      <path d="M 14,402 L 14,430 Q 14,436 20,436 L 48,436" />
      {/* Bottom-Right */}
      <path d="M 386,402 L 386,430 Q 386,436 380,436 L 352,436" />
    </g>
  </svg>
);

interface RetroViewfinderArtProps {
  variant?: 'healthy' | 'early_blight' | 'late_blight' | 'uncertain' | 'blurry';
  className?: string;
  showOverlay?: boolean;
  isVideoLive?: boolean;
  children?: React.ReactNode;
}

export const RetroViewfinderArt: React.FC<RetroViewfinderArtProps> = ({
  variant = 'early_blight',
  className = '',
  showOverlay = true,
  isVideoLive = false,
  children,
}) => {
  const isHealthy = variant === 'healthy';

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      {/* Layer 1: Background flat vector poster art (rendered at z-0, visible unless video is live) */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 z-0 ${
          isVideoLive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <svg
          viewBox="0 0 400 450"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer a: Flat background in vf-bg */}
          <rect width="400" height="450" fill="var(--color-vf-bg)" />

          {/* Layer b: Retro Sunburst (16 alternating rays radiating from a point behind the leaf) */}
          <g fill="var(--color-vf-ray)">
            <path d="M 200,185 L 700.0,185.0 L 661.9,376.3 Z" />
            <path d="M 200,185 L 553.6,538.6 L 391.3,646.9 Z" />
            <path d="M 200,185 L 200.0,685.0 L 8.7,646.9 Z" />
            <path d="M 200,185 L -153.6,538.6 L -261.9,376.3 Z" />
            <path d="M 200,185 L -300.0,185.0 L -261.9,-6.3 Z" />
            <path d="M 200,185 L -153.6,-168.6 L 8.7,-276.9 Z" />
            <path d="M 200,185 L 200.0,-315.0 L 391.3,-276.9 Z" />
            <path d="M 200,185 L 553.6,-168.6 L 661.9,-6.3 Z" />
          </g>

          {/* Layer c: Large sun disc behind the leaf in vf-sun, partly hidden by the leaf, with a thin ring */}
          <circle cx="200" cy="185" r="92" fill="var(--color-vf-sun)" />
          <circle cx="200" cy="185" r="106" fill="none" stroke="var(--color-vf-sun)" strokeWidth="2" />

          {/* Layer d: Subtle halftone dot pattern along the bottom third in vf-ray */}
          <g fill="var(--color-vf-ray)">
            <circle cx="36" cy="325" r="1.5" /><circle cx="64" cy="325" r="1.5" /><circle cx="92" cy="325" r="1.5" /><circle cx="120" cy="325" r="1.5" /><circle cx="148" cy="325" r="1.5" /><circle cx="176" cy="325" r="1.5" /><circle cx="204" cy="325" r="1.5" /><circle cx="232" cy="325" r="1.5" /><circle cx="260" cy="325" r="1.5" /><circle cx="288" cy="325" r="1.5" /><circle cx="316" cy="325" r="1.5" /><circle cx="344" cy="325" r="1.5" /><circle cx="368" cy="325" r="1.5" />
            <circle cx="36" cy="350" r="2.2" /><circle cx="64" cy="350" r="2.2" /><circle cx="92" cy="350" r="2.2" /><circle cx="120" cy="350" r="2.2" /><circle cx="148" cy="350" r="2.2" /><circle cx="176" cy="350" r="2.2" /><circle cx="204" cy="350" r="2.2" /><circle cx="232" cy="350" r="2.2" /><circle cx="260" cy="350" r="2.2" /><circle cx="288" cy="350" r="2.2" /><circle cx="316" cy="350" r="2.2" /><circle cx="344" cy="350" r="2.2" /><circle cx="368" cy="350" r="2.2" />
            <circle cx="36" cy="375" r="2.8" /><circle cx="64" cy="375" r="2.8" /><circle cx="92" cy="375" r="2.8" /><circle cx="120" cy="375" r="2.8" /><circle cx="148" cy="375" r="2.8" /><circle cx="176" cy="375" r="2.8" /><circle cx="204" cy="375" r="2.8" /><circle cx="232" cy="375" r="2.8" /><circle cx="260" cy="375" r="2.8" /><circle cx="288" cy="375" r="2.8" /><circle cx="316" cy="375" r="2.8" /><circle cx="344" cy="375" r="2.8" /><circle cx="368" cy="375" r="2.8" />
            <circle cx="36" cy="400" r="3.4" /><circle cx="64" cy="400" r="3.4" /><circle cx="92" cy="400" r="3.4" /><circle cx="120" cy="400" r="3.4" /><circle cx="148" cy="400" r="3.4" /><circle cx="176" cy="400" r="3.4" /><circle cx="204" cy="400" r="3.4" /><circle cx="232" cy="400" r="3.4" /><circle cx="260" cy="400" r="3.4" /><circle cx="288" cy="400" r="3.4" /><circle cx="316" cy="400" r="3.4" /><circle cx="344" cy="400" r="3.4" /><circle cx="368" cy="400" r="3.4" />
            <circle cx="36" cy="425" r="4.0" /><circle cx="64" cy="425" r="4.0" /><circle cx="92" cy="425" r="4.0" /><circle cx="120" cy="425" r="4.0" /><circle cx="148" cy="425" r="4.0" /><circle cx="176" cy="425" r="4.0" /><circle cx="204" cy="425" r="4.0" /><circle cx="232" cy="425" r="4.0" /><circle cx="260" cy="425" r="4.0" /><circle cx="288" cy="425" r="4.0" /><circle cx="316" cy="425" r="4.0" /><circle cx="344" cy="425" r="4.0" /><circle cx="368" cy="425" r="4.0" />
          </g>

          {/* Layer e: The leaf with hard offset shadow, outline, veins, and spots */}
          <path
            d="M 204,324 L 204,349"
            stroke="var(--color-vf-leaf-shadow)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 204,64 C 279,119 299,224 204,324 C 109,224 129,119 204,64 Z"
            fill="var(--color-vf-leaf-shadow)"
          />

          <path
            d="M 200,320 L 200,345"
            stroke="var(--color-vf-leaf-outline)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <path
            d="M 200,60 C 275,115 295,220 200,320 C 105,220 125,115 200,60 Z"
            fill="var(--color-vf-leaf)"
            stroke="var(--color-vf-leaf-outline)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          <path
            d="M 200,75 L 200,315"
            stroke="var(--color-vf-vein)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          <path
            d="M 200,120 L 240,95 M 200,120 L 160,95 M 200,165 L 255,138 M 200,165 L 145,138 M 200,215 L 255,190 M 200,215 L 145,190 M 200,265 L 235,250 M 200,265 L 165,250"
            stroke="var(--color-vf-vein)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {!isHealthy && (
            <g>
              <circle cx="160" cy="145" r="14" fill="var(--color-vf-leaf-outline)" />
              <circle cx="160" cy="145" r="12" fill="var(--color-vf-spot)" />
              <circle cx="160" cy="145" r="6.5" fill="none" stroke="var(--color-vf-leaf-outline)" strokeWidth="1.5" />
              <circle cx="157" cy="142" r="2.2" fill="var(--color-vf-vein)" />

              <circle cx="240" cy="190" r="17" fill="var(--color-vf-leaf-outline)" />
              <circle cx="240" cy="190" r="15" fill="var(--color-vf-spot)" />
              <circle cx="240" cy="190" r="8" fill="none" stroke="var(--color-vf-leaf-outline)" strokeWidth="1.5" />
              <circle cx="236" cy="186" r="2.5" fill="var(--color-vf-vein)" />

              <circle cx="180" cy="245" r="12" fill="var(--color-vf-leaf-outline)" />
              <circle cx="180" cy="245" r="10" fill="var(--color-vf-spot)" />
              <circle cx="180" cy="245" r="5" fill="none" stroke="var(--color-vf-leaf-outline)" strokeWidth="1.5" />
              <circle cx="178" cy="243" r="2" fill="var(--color-vf-vein)" />
            </g>
          )}
        </svg>
      </div>

      {/* Layer 2: Always mounted children (video element) at z-10 */}
      {children && (
        <div className="absolute inset-0 w-full h-full z-10 overflow-hidden">
          {children}
        </div>
      )}

      {/* Layer 3: Frame Overlay at z-20 */}
      {showOverlay && <RetroFrameOverlay className="z-20" />}
    </div>
  );
};
