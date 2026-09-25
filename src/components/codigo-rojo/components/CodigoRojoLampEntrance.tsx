import React, { useEffect, useRef, useState } from 'react';
import { audio } from '../../../utils/audio';

interface CodigoRojoLampEntranceProps {
  roomCode: string;
  missionNumber: number;
  onComplete: () => void;
}

export const CodigoRojoLampEntrance: React.FC<CodigoRojoLampEntranceProps> = ({
  roomCode,
  missionNumber,
  onComplete,
}) => {
  // Check if this mission's entrance was already seen in this session
  const [shouldRender] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const sessionKey = `cr_lamp_seen_${roomCode}_m${missionNumber}`;
      if (sessionStorage.getItem(sessionKey) === 'true') {
        return false;
      }
      sessionStorage.setItem(sessionKey, 'true');
      return true;
    } catch {
      return true;
    }
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const maskPolygonRef = useRef<SVGPolygonElement>(null);
  const maskTopRef = useRef<SVGEllipseElement>(null);
  const darknessRectRef = useRef<SVGRectElement>(null);
  const beamPolygonRef = useRef<SVGPolygonElement>(null);
  const bulbRef = useRef<SVGEllipseElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  const isFinishedRef = useRef(false);

  const handleFinish = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    if (!shouldRender) {
      onCompleteRef.current();
      return;
    }

    // Check prefers-reduced-motion
    const isReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isReducedMotion) {
      const t = setTimeout(handleFinish, 300);
      return () => clearTimeout(t);
    }

    let rafId: number | null = null;
    let lampSoundPlayed = false;
    const TOTAL_DURATION = 1700; // 1.7 seconds target
    const startTime = performance.now();

    const animate = (now: number) => {
      if (isFinishedRef.current) return;

      const elapsed = now - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / TOTAL_DURATION));

      // Play soft lamp switch-on audio at 150ms
      if (!lampSoundPlayed && elapsed >= 150) {
        lampSoundPlayed = true;
        try {
          audio.playOverheadLampOn();
        } catch {
          // ignore
        }
      }

      // Lighting variables
      let spreadX = 0;
      let topRx = 0;
      let bulbOpacity = 0;
      let beamOpacity = 0;
      let darknessOpacity = 1;
      let blurAmount = 25;

      if (progress < 0.09) {
        // 0.00s - 0.15s: Pure absolute black
        spreadX = 0;
        topRx = 0;
        bulbOpacity = 0;
        beamOpacity = 0;
        darknessOpacity = 1;
        blurAmount = 20;
      } else if (progress < 0.24) {
        // 0.15s - 0.40s: Overhead lamp bulb activates, narrow beam starts
        const subP = (progress - 0.09) / 0.15;
        spreadX = subP * 85;
        topRx = subP * 28;
        bulbOpacity = subP * 0.95;
        beamOpacity = subP * 0.45;
        darknessOpacity = 1;
        blurAmount = 20 + subP * 12;
      } else if (progress < 0.74) {
        // 0.40s - 1.25s: Triangular conical beam progressively widens across machine
        const subP = (progress - 0.24) / 0.5;
        const easedP = Math.pow(subP, 1.25);
        spreadX = 85 + easedP * (950 - 85);
        topRx = 28 + subP * 55;
        bulbOpacity = 0.95;
        beamOpacity = 0.45 + subP * 0.25;
        darknessOpacity = 1;
        blurAmount = 32 + subP * 20;
      } else {
        // 1.25s - 1.70s: Beam covers entire screen, ambient darkness smoothly lifts
        const subP = (progress - 0.74) / 0.26;
        spreadX = 950 + subP * 1250;
        topRx = 83 + subP * 40;
        darknessOpacity = Math.max(0, 1 - subP);
        beamOpacity = Math.max(0, (1 - subP) * 0.7);
        bulbOpacity = Math.max(0, (1 - subP) * 0.95);
        blurAmount = 52 + subP * 15;
      }

      // Directly update SVG attributes for maximum 60fps/120fps performance without React re-renders
      const p1 = `500,0 ${500 - spreadX},1000 ${500 + spreadX},1000`;
      if (maskPolygonRef.current) {
        maskPolygonRef.current.setAttribute('points', p1);
      }
      if (maskTopRef.current) {
        maskTopRef.current.setAttribute('rx', topRx.toFixed(1));
      }
      if (beamPolygonRef.current) {
        beamPolygonRef.current.setAttribute('points', p1);
        beamPolygonRef.current.setAttribute('opacity', beamOpacity.toFixed(3));
      }
      if (bulbRef.current) {
        bulbRef.current.setAttribute('rx', (topRx * 1.4).toFixed(1));
        bulbRef.current.setAttribute('opacity', bulbOpacity.toFixed(3));
      }
      if (darknessRectRef.current) {
        darknessRectRef.current.setAttribute('opacity', darknessOpacity.toFixed(3));
      }
      if (blurRef.current) {
        blurRef.current.setAttribute('stdDeviation', blurAmount.toFixed(1));
      }

      if (progress >= 1) {
        handleFinish();
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    // Robust safety fallback at 2.0s
    const safetyTimer = setTimeout(handleFinish, 2000);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
    };
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      onClick={handleFinish}
      className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden bg-transparent cursor-pointer"
      title="Toca para saltar la secuencia"
      style={{ touchAction: 'none' }}
    >
      <svg
        className="w-full h-full absolute inset-0 block"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gaussian blur for soft, feathered light falloff */}
          <filter id="cr-lamp-feather" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur ref={blurRef} stdDeviation="25" />
          </filter>

          {/* Mask: White keeps pitch black, Black cuts transparent hole to reveal game UI */}
          <mask id="cr-lamp-mask">
            <rect width="1000" height="1000" fill="#ffffff" />
            <polygon
              ref={maskPolygonRef}
              points="500,0 500,1000 500,1000"
              fill="#000000"
              filter="url(#cr-lamp-feather)"
            />
            <ellipse
              ref={maskTopRef}
              cx="500"
              cy="0"
              rx="0"
              ry="22"
              fill="#000000"
              filter="url(#cr-lamp-feather)"
            />
          </mask>

          {/* Subtle warm volumetric sheen gradient inside the light cone */}
          <linearGradient id="cr-volumetric-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="25%" stopColor="#fffbeb" stopOpacity="0.18" />
            <stop offset="65%" stopColor="#fef3c7" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 1. Pitch black darkness layer that gets perforated by the lamp mask */}
        <rect
          ref={darknessRectRef}
          width="1000"
          height="1000"
          fill="#000000"
          mask="url(#cr-lamp-mask)"
          opacity="1"
        />

        {/* 2. Soft volumetric light beam sheen in dark room */}
        <polygon
          ref={beamPolygonRef}
          points="500,0 500,1000 500,1000"
          fill="url(#cr-volumetric-beam)"
          opacity="0"
          filter="url(#cr-lamp-feather)"
        />

        {/* 3. Overhead lamp source fixture at top-center */}
        <ellipse
          ref={bulbRef}
          cx="500"
          cy="0"
          rx="0"
          ry="20"
          fill="#fffbeb"
          opacity="0"
          filter="url(#cr-lamp-feather)"
        />
      </svg>
    </div>
  );
};
