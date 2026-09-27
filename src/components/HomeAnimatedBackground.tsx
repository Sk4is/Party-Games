import React from 'react';

/**
 * HomeAnimatedBackground
 *
 * Dedicated multi-layer atmospheric background for FAM2PLAY home menu:
 * - Layer 1: Deep navy / near-black base
 * - Layer 2: 6 oversized, independent drifting ambient color fields (18s - 38s cycles)
 *            reflecting the signature game accents (amber, rose, cyan, emerald, purple, orange)
 * - Layer 3: Living aurora ribbon layer drifting horizontally & breathing behind the game grid
 * - Layer 4: Subtle tactile dot texture
 * - Layer 5: Soft radial vignette keeping focus on the brand & game cards
 *
 * 100% GPU-accelerated CSS keyframes (transform3d & opacity) with zero React re-renders.
 */
export const HomeAnimatedBackground: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* =====================================================================
          LAYER 1: DEEP NAVY BASE
          ===================================================================== */}
      <div className="absolute inset-0 bg-[#050713]" />

      {/* =====================================================================
          LAYER 2: AMBIENT COLOR BLOBS (LIVING ILLUMINATION)
          Noticeable but elegant atmospheric light illuminating the dark room.
          ===================================================================== */}
      {/* 1. Amber / Gold Warm Glow (Top-left, drifting right & down) */}
      <div
        className="absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full blur-[100px] animate-home-blob-amber"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(217, 119, 6, 0.14) 45%, transparent 70%)',
        }}
      />

      {/* 2. Coral / Rose Red Glow (Top-right, drifting diagonally) */}
      <div
        className="absolute top-12 -right-28 w-[46rem] h-[46rem] rounded-full blur-[110px] animate-home-blob-rose"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.24) 0%, rgba(225, 29, 72, 0.12) 50%, transparent 72%)',
        }}
      />

      {/* 3. Cyan / Electric Sky Glow (Bottom-left under Pinturillo/Cards) */}
      <div
        className="absolute bottom-10 -left-24 w-[40rem] h-[40rem] rounded-full blur-[105px] animate-home-blob-cyan"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(14, 165, 233, 0.11) 45%, transparent 70%)',
        }}
      />

      {/* 4. Deep Violet / Indigo Party Glow (Center behind cards, creating translucent glow) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52rem] h-[48rem] rounded-full blur-[120px] animate-home-blob-violet"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.20) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)',
        }}
      />

      {/* 5. Emerald / Mint Glow (Mid-left edge) */}
      <div
        className="absolute top-2/3 -left-16 w-[36rem] h-[36rem] rounded-full blur-[95px] animate-home-blob-emerald"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.08) 50%, transparent 70%)',
        }}
      />

      {/* 6. Warm Orange / Flame Glow (Bottom-right edge) */}
      <div
        className="absolute -bottom-24 right-10 w-[42rem] h-[42rem] rounded-full blur-[105px] animate-home-blob-orange"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, rgba(234, 88, 12, 0.10) 48%, transparent 70%)',
        }}
      />

      {/* =====================================================================
          LAYER 3: SECOND DYNAMIC LAYER - AMBIENT AURORA STREAM
          A soft living aurora ribbon drifting across the screen behind the grid.
          ===================================================================== */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen filter blur-[70px] animate-home-aurora-stream">
        <div
          className="w-[180%] h-[120%] -translate-x-[25%] -translate-y-[10%]"
          style={{
            background:
              'linear-gradient(115deg, transparent 15%, rgba(245, 158, 11, 0.12) 28%, rgba(244, 63, 94, 0.14) 42%, rgba(139, 92, 246, 0.15) 58%, rgba(6, 182, 212, 0.13) 74%, transparent 88%)',
          }}
        />
      </div>

      {/* Subtle secondary diagonal counter-wave */}
      <div className="absolute inset-0 opacity-25 mix-blend-screen filter blur-[90px] animate-home-aurora-counter">
        <div
          className="w-[160%] h-[100%] -translate-x-[15%]"
          style={{
            background:
              'linear-gradient(240deg, transparent 20%, rgba(99, 102, 241, 0.16) 40%, rgba(236, 72, 153, 0.13) 60%, rgba(245, 158, 11, 0.11) 75%, transparent 90%)',
          }}
        />
      </div>

      {/* =====================================================================
          LAYER 4: SUBTLE TACTILE TEXTURE
          Fine dot pattern for physical depth and material feel.
          ===================================================================== */}
      <div className="absolute inset-0 bg-subtle-dots opacity-20 mix-blend-screen" />

      {/* =====================================================================
          LAYER 5: FOCUS VIGNETTE
          Gently darkens edges while keeping center vivid and readable.
          ===================================================================== */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 80% at 50% 40%, transparent 35%, rgba(5, 7, 19, 0.55) 70%, rgba(3, 4, 11, 0.92) 100%)',
        }}
      />
    </div>
  );
};
