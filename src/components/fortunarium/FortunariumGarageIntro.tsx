import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

export interface FortunariumNextQuotaPaperInfo {
  quotaNumber: number;
  quotaTarget: number;
  currentCredits: number;
  currentIntegrity: number;
  repairCost: number;
  flavorQuote?: string;
}

interface FortunariumGarageIntroProps {
  matchId: string;
  onComplete: () => void;
  quotaInfo?: FortunariumNextQuotaPaperInfo | null;
  initialSlideDown?: boolean;
}

export const FortunariumGarageIntro: React.FC<FortunariumGarageIntroProps> = ({
  matchId,
  onComplete,
  quotaInfo,
  initialSlideDown = false,
}) => {
  // progress: 0 = fully closed (door down), 1 = fully open (door raised up)
  const [progress, setProgress] = useState<number>(initialSlideDown ? 1 : 0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [phase, setPhase] = useState<'closing' | 'interactive' | 'auto_completing' | 'done'>(
    initialSlideDown ? 'closing' : 'interactive'
  );
  
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(progress);
  progressRef.current = progress;

  const dragStartYRef = useRef<number | null>(null);
  const dragStartProgressRef = useRef<number>(0);
  const lastRattleTickRef = useRef<number>(0);

  // If initialSlideDown is true, animate door closing down
  useEffect(() => {
    if (initialSlideDown) {
      setProgress(1);
      setPhase('closing');
      fortunariumAudio.playGarageDoorClose();
      const t = setTimeout(() => {
        setProgress(0);
        const t2 = setTimeout(() => {
          setPhase('interactive');
        }, 550);
        return () => clearTimeout(t2);
      }, 100);
      return () => clearTimeout(t);
    } else {
      setProgress(0);
      setIsDragging(false);
      setPhase('interactive');
    }
  }, [matchId, quotaInfo?.quotaNumber, initialSlideDown]);

  const triggerFullOpen = useCallback(() => {
    if (phase === 'auto_completing' || phase === 'done') return;
    setPhase('auto_completing');
    setIsDragging(false);
    dragStartYRef.current = null;
    fortunariumAudio.playGarageDoorOpen();
    setProgress(1);

    const t = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 450);

    return () => {
      clearTimeout(t);
    };
  }, [phase, onComplete]);

  // Keyboard accessibility: SPACE, ENTER or ARROW_UP opens the garage shutter
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

  // 1:1 Natural Pointer Drag with Window Listeners
  const handlePointerDown = (e: React.PointerEvent) => {
    if (phase !== 'interactive') return;
    
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    dragStartProgressRef.current = progressRef.current;
    fortunariumAudio.playButtonClick();

    const requiredTravelPx = Math.max(300, containerRef.current?.clientHeight || window.innerHeight || 800);

    const handleWindowPointerMove = (ev: PointerEvent) => {
      if (dragStartYRef.current === null) return;
      const deltaY = dragStartYRef.current - ev.clientY;
      const rawProgress = dragStartProgressRef.current + deltaY / requiredTravelPx;
      const nextProgress = Math.max(0, Math.min(1, rawProgress));
      setProgress(nextProgress);

      // Subtle metallic rattle clicks every ~12% of travel
      const bucket = Math.floor(nextProgress * 8);
      if (bucket !== lastRattleTickRef.current) {
        lastRattleTickRef.current = bucket;
        fortunariumAudio.playReelStopClack(bucket % 5);
      }

      if (nextProgress >= 0.82) {
        cleanupListeners();
        triggerFullOpen();
      }
    };

    const handleWindowPointerUp = () => {
      cleanupListeners();
      setIsDragging(false);
      dragStartYRef.current = null;

      // Release threshold: if dragged >= 55%, smoothly finish opening; otherwise smoothly return closed
      if (progressRef.current >= 0.55) {
        triggerFullOpen();
      } else {
        fortunariumAudio.playGarageDoorClose();
        setProgress(0);
      }
    };

    const cleanupListeners = () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
  };

  const handleSkip = () => {
    fortunariumAudio.playButtonClick();
    setPhase('done');
    onComplete();
  };

  if (phase === 'done') return null;

  // 1:1 Direct physical translation in percentage
  const translateYPercent = -(progress * 100);

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className="fortunarium-root font-fortunarium fixed inset-0 z-50 pointer-events-auto overflow-hidden select-none"
      aria-label="Compuerta manual del taller Fortunarium"
    >
      {/* Heavy Corrugated Steel Garage Shutter */}
      <div
        onPointerDown={handlePointerDown}
        className={`absolute inset-0 flex flex-col justify-between ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          transform: `translate3d(0, ${translateYPercent}%, 0)`,
          transition: isDragging
            ? 'none'
            : phase === 'closing'
            ? 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          background:
            'repeating-linear-gradient(180deg, #182230 0px, #243142 16px, #121924 32px, #0f151e 38px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.95)',
          touchAction: 'none',
        }}
      >
        {/* Top Heavy Steel Overhead Beam */}
        <div className="w-full h-12 bg-gradient-to-b from-[#0a0f16] to-[#17202c] border-b-4 border-[#070b10] flex items-center justify-between px-6 shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#FF2A6D] shadow-[0_0_8px_#FF2A6D] animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-pink-200 font-bold">
              {quotaInfo
                ? `TALLER FORTUNARIUM · COMPUERTA CUOTA ${quotaInfo.quotaNumber}`
                : 'TALLER CLANDESTINO · COMPUERTA MANUAL'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-cyan-300/85 tabular-nums">
              APERTURA: {Math.round(progress * 100)}%
            </span>
          </div>
        </div>

        {/* Center Canvas: Either Next-Quota Taped Paper Note (Part H) OR Initial Stenciled Emblem */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
          {/* Left & Right Vertical Guide Tracks */}
          <div className="absolute inset-y-0 left-0 w-6 sm:w-8 bg-gradient-to-r from-[#0b0f17] via-[#1e293b] to-[#0f172a] border-r-2 border-amber-500/20 flex flex-col justify-around items-center py-4 pointer-events-none">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-800 shadow-inner"
              />
            ))}
          </div>
          <div className="absolute inset-y-0 right-0 w-6 sm:w-8 bg-gradient-to-l from-[#0b0f17] via-[#1e293b] to-[#0f172a] border-l-2 border-amber-500/20 flex flex-col justify-around items-center py-4 pointer-events-none">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-800 shadow-inner"
              />
            ))}
          </div>

          {quotaInfo ? (
            /* PART H: NEXT-QUOTA TAPED PAPER NOTE (Handwritten / Marker workshop style) */
            <div className="relative max-w-lg w-full mx-auto p-6 sm:p-7 bg-[#fbf5e5] text-[#17120d] rounded-sm shadow-[0_24px_65px_rgba(0,0,0,0.94)] border-2 border-[#b8a27b] rotate-[-0.6deg] select-none my-auto">
              {/* Masking tape pieces on all 4 corners */}
              <div className="absolute -top-3.5 -left-4 w-14 h-7 bg-[#fef08a]/80 border border-[#ca8a04]/50 rotate-[-22deg] shadow-sm pointer-events-none" />
              <div className="absolute -top-3.5 -right-4 w-14 h-7 bg-[#fef08a]/80 border border-[#ca8a04]/50 rotate-[24deg] shadow-sm pointer-events-none" />
              <div className="absolute -bottom-3.5 -left-4 w-14 h-7 bg-[#fef08a]/80 border border-[#ca8a04]/50 rotate-[18deg] shadow-sm pointer-events-none" />
              <div className="absolute -bottom-3.5 -right-4 w-14 h-7 bg-[#fef08a]/80 border border-[#ca8a04]/50 rotate-[-20deg] shadow-sm pointer-events-none" />

              <div className="flex items-center justify-between border-b-2 border-[#261c12] pb-2.5 mb-3.5">
                <div>
                  <span className="font-mono text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#3b2c1d] block">
                    TALLER FORTUNARIUM · PARTE DE OBJETIVO
                  </span>
                  <h2 className="font-fortunarium text-2xl sm:text-3xl font-extrabold text-[#120d08] tracking-wide mt-0.5">
                    CUOTA {quotaInfo.quotaNumber}
                  </h2>
                </div>
                <span className="font-mono text-xs sm:text-sm font-black bg-[#17120d] text-amber-300 px-3 py-1 rounded shadow">
                  NIVEL ACTIVO
                </span>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm font-mono">
                <div className="flex justify-between items-baseline bg-amber-500/20 p-2.5 rounded border-2 border-amber-700/45">
                  <span className="font-extrabold text-[#120d08] text-xs sm:text-sm tracking-wide">
                    OBJETIVO DE CAJA:
                  </span>
                  <span className="font-black text-lg sm:text-2xl text-[#064e3b] tabular-nums tracking-tight">
                    {quotaInfo.quotaTarget} CR
                  </span>
                </div>

                <div className="flex justify-between items-baseline px-1 py-0.5">
                  <span className="text-[#231910] font-bold">Caja común acumulada:</span>
                  <span className="font-extrabold text-[#120d08] text-sm sm:text-[15px] tabular-nums">
                    {quotaInfo.currentCredits} CR (CONSERVADA)
                  </span>
                </div>

                <div className="flex justify-between items-baseline px-1 py-0.5">
                  <span className="text-[#231910] font-bold">Integridad del chasis:</span>
                  <span
                    className={`font-extrabold text-sm sm:text-[15px] tabular-nums ${
                      quotaInfo.currentIntegrity <= 35 ? 'text-[#8c1515]' : 'text-[#120d08]'
                    }`}
                  >
                    {quotaInfo.currentIntegrity}% (LA MÁQUINA AGUANTA)
                  </span>
                </div>

                <div className="flex justify-between items-baseline px-1 py-0.5">
                  <span className="text-[#231910] font-bold">Coste de reparación:</span>
                  <span className="font-extrabold text-[#120d08] text-sm sm:text-[15px] tabular-nums">
                    {quotaInfo.repairCost} CR
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-[#6e563b] text-[13px] sm:text-sm italic font-semibold text-[#231910] leading-snug">
                "{quotaInfo.flavorQuote || 'Si escucháis golpes o chispas dentro, probablemente no sea nada. La manivela sigue respondiendo.'}"
              </div>

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-extrabold text-[#120d08] uppercase tracking-wider">
                  <span className="animate-bounce">⬆</span>
                  <span>ARRASTRA HACIA ARRIBA PARA ACCEDER</span>
                  <span className="animate-bounce">⬆</span>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={triggerFullOpen}
                  className="px-4 py-1.5 rounded-lg bg-[#17120d] hover:bg-[#2b2118] text-amber-300 font-fortunarium font-bold text-xs tracking-wider shadow cursor-pointer transition active:scale-95 border border-amber-500/40"
                >
                  ABRIR MANUALMENTE
                </button>
              </div>
            </div>
          ) : (
            /* INITIAL RUN STENCILED PLATE */
            <div className="relative px-8 py-6 rounded-2xl bg-[#09101b]/95 border-2 border-[#FF2A6D]/70 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_28px_rgba(255,42,109,0.28)] text-center max-w-lg">
              <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#FF2A6D]/80 border border-pink-200/60" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#FF2A6D]/80 border border-pink-200/60" />
              <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#FF2A6D]/80 border border-pink-200/60" />
              <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#FF2A6D]/80 border border-pink-200/60" />

              <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300 mb-1">
                CÁMARA MECÁNICA DE AZAR
              </div>
              <h1 className="font-fortunarium text-4xl sm:text-6xl text-[#FF2A6D] tracking-wider drop-shadow-[0_0_16px_rgba(255,42,109,0.55)]">
                FORTUNARIUM
              </h1>

              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1a0812] border border-[#FF2A6D]/45 text-xs font-mono text-pink-100 uppercase tracking-wider">
                  <span className="animate-bounce">⬆</span>
                  <span>ARRASTRA EL TIRADOR HACIA ARRIBA (1:1)</span>
                  <span className="animate-bounce">⬆</span>
                </div>

                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={triggerFullOpen}
                  className="mt-1 px-4 py-1.5 rounded-lg bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-fortunarium text-sm tracking-wider shadow-[0_0_18px_rgba(255,42,109,0.45)] cursor-pointer transition active:scale-95"
                >
                  LEVANTAR COMPUERTA MANUALMENTE
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Hazard Strip + Heavy Interactive Steel Handle Bar */}
        <div className="w-full shrink-0">
          <div
            className="w-full h-5 border-t-2 border-b-2 border-black"
            style={{
              background:
                'repeating-linear-gradient(-45deg, #f59e0b 0px, #f59e0b 16px, #111827 16px, #111827 32px)',
            }}
          />
          <div className="w-full h-16 bg-gradient-to-b from-[#243042] to-[#0d141e] border-t border-slate-400/30 flex flex-col items-center justify-center relative gap-1">
            <div className="w-56 sm:w-64 h-5 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center">
              <span className="text-[10px] font-mono font-extrabold text-slate-950 uppercase tracking-widest">
                ▲ TIRADOR MANUAL (1:1) ▲
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Skip Button in Corner */}
      <button
        type="button"
        onClick={handleSkip}
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-amber-200/90 border border-amber-400/35 text-[11px] font-mono uppercase tracking-wider shadow-lg cursor-pointer transition active:scale-95"
      >
        Saltar ⏭
      </button>
    </div>
  );
};
