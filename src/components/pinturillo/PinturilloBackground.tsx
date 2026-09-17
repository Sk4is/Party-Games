import React from 'react';

/**
 * PinturilloBackground: A sophisticated, dark, minimal, animated ambient background.
 * Palette: Dark charcoal/navy base (#050816, #080B18, #0B1020).
 * Features: Soft drifting ambient light glows, subtle fine artist grid & organic pencil curves,
 * micro-texture grain, and ultra-gentle breathing opacity (25s-40s cycles).
 * Guaranteed to keep the #FFFFFF drawing canvas as the high-contrast centerpiece.
 */
export const PinturilloBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 bg-[#050816]"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, #0B1020 0%, #080B18 55%, #050816 100%)',
      }}
    >
      {/* 1. Ultra-soft ambient gradient blobs drifting gently */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full blur-3xl opacity-[0.07] animate-ambient-drift-1"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, #d97706 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[35%] -right-[15%] w-[50vw] h-[50vw] rounded-full blur-3xl opacity-[0.06] animate-ambient-drift-2"
        style={{
          background: 'radial-gradient(circle, #6366f1 0%, #3b82f6 40%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full blur-3xl opacity-[0.05] animate-ambient-drift-3"
        style={{
          background: 'radial-gradient(circle, #10b981 0%, #0d9488 40%, transparent 70%)',
        }}
      />

      {/* 2. Delicate isometric artist grid dots (50px interval) with faint opacity */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="pinturillo-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
            <circle cx="26" cy="26" r="0.8" fill="#94a3b8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pinturillo-grid-pattern)" />
      </svg>

      {/* 3. Subtle pencil-like ambient curves & strokes (subtle, continuous, organic) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.05] stroke-slate-400 fill-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft flowing topographic/drafting lines */}
        <path
          d="M-100,180 C280,240 450,110 820,160 C1190,210 1380,120 1600,180"
          strokeWidth="1.2"
          strokeDasharray="6 8"
        />
        <path
          d="M-120,680 C320,590 600,750 940,660 C1280,570 1460,700 1620,650"
          strokeWidth="1.2"
          strokeDasharray="4 10"
        />
        <path
          d="M120,-80 C180,320 90,620 140,1050"
          strokeWidth="1"
          strokeDasharray="3 12"
        />
        <path
          d="M1320,-80 C1280,280 1360,580 1300,1020"
          strokeWidth="1"
          strokeDasharray="3 12"
        />
      </svg>

      {/* 4. Fine canvas grain texture (SVG filter, micro noise) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] mix-blend-screen pointer-events-none">
        <filter id="canvas-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#canvas-grain)" />
      </svg>

      {/* 5. Vignette darkening towards edges for focus on center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(5, 8, 22, 0.65) 100%)',
        }}
      />
    </div>
  );
};

// Re-export as PinturilloBackgroundDoodles for compatibility
export const PinturilloBackgroundDoodles = PinturilloBackground;
