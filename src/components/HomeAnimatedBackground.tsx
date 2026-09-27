import React, { useEffect } from 'react';

/**
 * HomeAnimatedBackground
 *
 * Dedicated multi-layer atmospheric background for FAM2PLAY home menu:
 * - Layer 1: Deep navy / near-black base
 * - Layer 2: 6 oversized, independent drifting ambient color fields (18s - 36s cycles)
 *            with substantial travel distance (5-12vw / 3-8vh) reflecting signature game accents
 * - Layer 3: Living aurora veil streams drifting diagonally across and breathing behind cards
 * - Layer 4: Desktop pointer-following soft ambient illumination (smooth lerp, 0 React rerenders)
 * - Layer 5: Subtle tactile dot texture
 * - Layer 6: Soft radial focus vignette
 *
 * 100% GPU-accelerated CSS keyframes (transform3d & opacity) with zero React re-renders.
 */
export const HomeAnimatedBackground: React.FC = () => {
  // Desktop-only smooth pointer ambient response (0 React state re-renders)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let currentX = mouseX;
    let currentY = mouseY;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const loop = () => {
      // Smooth lerp (interpolation factor 0.045 for relaxed, elegant drift)
      currentX += (mouseX - currentX) * 0.045;
      currentY += (mouseY - currentY) * 0.045;

      const el = document.documentElement;
      el.style.setProperty('--home-mouse-x', `${currentX.toFixed(1)}px`);
      el.style.setProperty('--home-mouse-y', `${currentY.toFixed(1)}px`);

      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

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
          Noticeable independent drifting motion across 5-12vw / 3-8vh.
          ===================================================================== */}
      {/* 1. Amber / Gold Warm Glow (Top-left, drifting right & down) */}
      <div
        className="absolute -top-28 -left-20 w-[44rem] h-[44rem] rounded-full blur-[105px] animate-home-blob-amber"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.30) 0%, rgba(217, 119, 6, 0.15) 45%, transparent 72%)',
        }}
      />

      {/* 2. Coral / Rose Red Glow (Top-right, drifting diagonally) */}
      <div
        className="absolute top-8 -right-28 w-[48rem] h-[48rem] rounded-full blur-[115px] animate-home-blob-rose"
        style={{
          background: 'radial-gradient(circle, rgba(244, 63, 94, 0.26) 0%, rgba(225, 29, 72, 0.13) 50%, transparent 72%)',
        }}
      />

      {/* 3. Cyan / Electric Sky Glow (Bottom-left under Cards) */}
      <div
        className="absolute bottom-6 -left-24 w-[42rem] h-[42rem] rounded-full blur-[105px] animate-home-blob-cyan"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.24) 0%, rgba(14, 165, 233, 0.12) 45%, transparent 70%)',
        }}
      />

      {/* 4. Deep Violet / Indigo Party Glow (Distant glow centered behind cards) */}
      <div
        className="absolute top-1/2 left-1/2 w-[54rem] h-[50rem] rounded-full blur-[125px] animate-home-blob-violet"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.13) 45%, transparent 70%)',
        }}
      />

      {/* 5. Emerald / Mint Glow (Mid-left edge) */}
      <div
        className="absolute top-2/3 -left-16 w-[38rem] h-[38rem] rounded-full blur-[95px] animate-home-blob-emerald"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(5, 150, 105, 0.09) 50%, transparent 70%)',
        }}
      />

      {/* 6. Warm Orange / Flame Glow (Bottom-right edge) */}
      <div
        className="absolute -bottom-24 right-6 w-[44rem] h-[44rem] rounded-full blur-[110px] animate-home-blob-orange"
        style={{
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.24) 0%, rgba(234, 88, 12, 0.11) 48%, transparent 70%)',
        }}
      />

      {/* =====================================================================
          LAYER 3: SECOND DYNAMIC LAYER - MOVING ATMOSPHERIC LIGHT VEIL
          A huge diagonal blurred aurora/light band crossing part of the background.
          ===================================================================== */}
      <div className="absolute inset-0 opacity-45 mix-blend-screen filter blur-[75px] animate-home-aurora-stream">
        <div
          className="w-[190%] h-[130%] -translate-x-[30%] -translate-y-[15%]"
          style={{
            background:
              'linear-gradient(115deg, transparent 15%, rgba(245, 158, 11, 0.14) 28%, rgba(244, 63, 94, 0.16) 42%, rgba(139, 92, 246, 0.18) 58%, rgba(6, 182, 212, 0.15) 74%, transparent 88%)',
          }}
        />
      </div>

      {/* Counter-drifting ambient light veil */}
      <div className="absolute inset-0 opacity-30 mix-blend-screen filter blur-[95px] animate-home-aurora-counter">
        <div
          className="w-[170%] h-[110%] -translate-x-[20%]"
          style={{
            background:
              'linear-gradient(240deg, transparent 20%, rgba(99, 102, 241, 0.18) 40%, rgba(236, 72, 153, 0.15) 60%, rgba(245, 158, 11, 0.13) 75%, transparent 90%)',
          }}
        />
      </div>

      {/* =====================================================================
          LAYER 4: DESKTOP POINTER AMBIENT RESPONSE
          Faint, oversized, highly blurred light following cursor (not a flashlight).
          ===================================================================== */}
      <div
        className="hidden md:block absolute -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[46rem] rounded-full blur-[140px] pointer-events-none opacity-40 transition-opacity duration-1000"
        style={{
          left: 'var(--home-mouse-x, 50%)',
          top: 'var(--home-mouse-y, 35%)',
          background:
            'radial-gradient(circle, rgba(251, 146, 60, 0.14) 0%, rgba(139, 92, 246, 0.08) 42%, transparent 70%)',
          willChange: 'left, top',
        }}
      />

      {/* =====================================================================
          LAYER 5: SUBTLE TACTILE TEXTURE
          Fine dot pattern for physical depth and material feel.
          ===================================================================== */}
      <div className="absolute inset-0 bg-subtle-dots opacity-20 mix-blend-screen" />

      {/* =====================================================================
          LAYER 6: FOCUS VIGNETTE
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
