import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumGarageIntroProps {
  matchId: string;
  onComplete: () => void;
}

export const FortunariumGarageIntro: React.FC<FortunariumGarageIntroProps> = ({
  matchId,
  onComplete,
}) => {
  // progress: 0 = fully closed, 1 = fully open
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [phase, setPhase] = useState<'interactive' | 'auto_completing' | 'powering' | 'done'>(
    'interactive'
  );
  const dragStartYRef = useRef<number | null>(null);
  const dragStartProgressRef = useRef<number>(0);
  const lastRattleTickRef = useRef<number>(0);

  // Reset when matchId changes or manual replay is triggered
  useEffect(() => {
    setProgress(0);
    setIsDragging(false);
    setPhase('interactive');
  }, [matchId]);

  const triggerFullOpen = useCallback(() => {
    if (phase !== 'interactive') return;
    setPhase('auto_completing');
    setIsDragging(false);
    fortunariumAudio.playGarageDoorOpen();
    setProgress(1);

    const t1 = setTimeout(() => {
      setPhase('powering');
      fortunariumAudio.playMachinePowerOn();
    }, 520);

    const t2 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 1150);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, onComplete]);

  // Keyboard accessibility: SPACE or ENTER opens the garage shutter
  useEffect(() => {
    if (phase !== 'interactive') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') {
        e.preventDefault();
        triggerFullOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, triggerFullOpen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'interactive') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartProgressRef.current = progress;
    fortunariumAudio.playButtonClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || phase !== 'interactive' || dragStartYRef.current === null) return;
    const deltaY = dragStartYRef.current - e.clientY; // positive when dragging UP
    const fullTravelPx = Math.max(260, window.innerHeight * 0.55);
    const nextProgress = Math.max(
      0,
      Math.min(1, dragStartProgressRef.current + deltaY / fullTravelPx)
    );
    setProgress(nextProgress);

    // Subtle metallic rattle ticks every 14% of upward travel
    const bucket = Math.floor(nextProgress * 7);
    if (bucket !== lastRattleTickRef.current) {
      lastRattleTickRef.current = bucket;
      fortunariumAudio.playReelStopClack(bucket % 5);
    }

    if (nextProgress >= 0.85) {
      triggerFullOpen();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || phase !== 'interactive') return;
    setIsDragging(false);
    dragStartYRef.current = null;

    // Above threshold (>= 60% opened): complete opening smoothly; below 60%: drop back down to closed
    if (progress >= 0.6) {
      triggerFullOpen();
    } else {
      // Heavy metallic drop back to closed
      fortunariumAudio.playReelStopClack(0);
      setProgress(0);
    }
  };

  const handleSkip = () => {
    fortunariumAudio.playButtonClick();
    setPhase('done');
    onComplete();
  };

  if (phase === 'done') return null;

  const translateYPercent = -(progress * 102);

  return (
    <div
      className="fortunarium-root font-fortunarium fixed inset-0 z-50 pointer-events-auto overflow-hidden select-none"
      aria-label="Compuerta manual del taller Fortunarium"
    >
      {/* Warm cabinet ignition glow behind the shutter as it opens */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: Math.min(1, progress * 1.25),
          background:
            'radial-gradient(circle at 50% 48%, rgba(251,191,36,0.26) 0%, rgba(6,182,212,0.10) 45%, rgba(2,6,23,0.45) 80%)',
        }}
      />

      {/* Corrugated Metal Garage Shutter */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 flex flex-col justify-between ${
          isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab transition-transform duration-500 ease-out'
        }`}
        style={{
          transform: `translateY(${translateYPercent}%)`,
          background:
            'repeating-linear-gradient(180deg, #1b2432 0px, #253142 18px, #131a24 36px, #0f151e 42px)',
          boxShadow: '0 32px 70px rgba(0,0,0,0.95)',
          touchAction: 'none',
        }}
      >
        {/* Top Industrial Header Beam */}
        <div className="w-full h-12 bg-gradient-to-b from-[#0d121a] to-[#1a2230] border-b-4 border-[#090d12] flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300/85 font-bold">
              TALLER CLANDESTINO · COMPUERTA MANUAL
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              APERTURA: {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        {/* Side Guide Rails & Rivets + Center Stenciled Emblem */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-6">
          {/* Left & Right Vertical Steel Tracks */}
          <div className="absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-[#0b0f17] via-[#1e293b] to-[#0f172a] border-r-2 border-amber-500/20 flex flex-col justify-around items-center py-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-800 shadow-inner"
              />
            ))}
          </div>
          <div className="absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-[#0b0f17] via-[#1e293b] to-[#0f172a] border-l-2 border-amber-500/20 flex flex-col justify-around items-center py-4">
            {Array.from({ length: 10 }).map((_, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-800 shadow-inner"
              />
            ))}
          </div>

          {/* Stenciled Workshop Plate */}
          <div className="relative px-8 py-6 rounded-2xl bg-[#111823]/92 border-2 border-amber-500/45 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-center max-w-lg">
            <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-amber-600/70 border border-amber-300/50" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-amber-600/70 border border-amber-300/50" />
            <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-amber-600/70 border border-amber-300/50" />
            <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-amber-600/70 border border-amber-300/50" />

            <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-400/85 mb-1">
              CÁMARA MECÁNICA DE AZAR
            </div>
            <h1 className="font-fortunarium text-4xl sm:text-6xl text-amber-300 tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.9)]">
              FORTUNARIUM
            </h1>

            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-xs font-mono text-amber-200 uppercase tracking-wider">
                <span className="animate-bounce">⬆</span>
                <span>ARRASTRA EL TIRADOR HACIA ARRIBA PARA ABRIR</span>
                <span className="animate-bounce">⬆</span>
              </div>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={triggerFullOpen}
                className="mt-1 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-fortunarium text-sm tracking-wider shadow-md cursor-pointer transition"
              >
                LEVANTAR COMPUERTA MANUALMENTE
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Hazard Strip + Heavy Interactive Steel Handle Bar */}
        <div className="w-full">
          {/* Yellow/Black Diagonal Hazard Stripe */}
          <div
            className="w-full h-5 border-t-2 border-b-2 border-black"
            style={{
              background:
                'repeating-linear-gradient(-45deg, #f59e0b 0px, #f59e0b 16px, #111827 16px, #111827 32px)',
            }}
          />
          {/* Bottom Steel Lip & Pull Handle */}
          <div className="w-full h-16 bg-gradient-to-b from-[#263244] to-[#0f1622] border-t border-slate-400/30 flex flex-col items-center justify-center relative gap-1">
            <div className="w-56 h-5 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <span className="text-[10px] font-mono font-extrabold text-slate-950 uppercase tracking-widest">
                ▲ TIRAR AQUÍ ▲
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Skip Button in Corner (Section 59) */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-amber-200/90 border border-amber-400/35 text-[11px] font-mono uppercase tracking-wider shadow-lg cursor-pointer transition"
      >
        Saltar ⏭
      </button>
    </div>
  );
};
