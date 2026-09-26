import React, { useState, useEffect, useRef } from 'react';
import { Cog, CheckCircle2, Lock } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface SecuenciaCineticaModuleProps {
  operatorState: {
    pistons: {
      id: number;
      collar: 'Dorado' | 'Carmesí' | 'Cobalto' | 'Esmeralda';
      stroke: 'Corto' | 'Medio' | 'Largo';
      pressed: boolean;
    }[];
    pressedPistonIds?: number[];
    stepProgress?: number;
  };
  solved: boolean;
  onAction: (action: { pressedPistonId: number }) => void;
}

const COLLAR_THEMES: Record<
  string,
  { bg: string; border: string; text: string; glow: string }
> = {
  Dorado: {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
  },
  Carmesí: {
    bg: 'bg-red-600',
    border: 'border-red-400',
    text: 'text-red-400',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
  },
  Cobalto: {
    bg: 'bg-blue-600',
    border: 'border-blue-400',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  },
  Esmeralda: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  },
};

export const SecuenciaCineticaModule: React.FC<SecuenciaCineticaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { pistons = [] } = operatorState;
  const pressedIds = operatorState.pressedPistonIds || [];
  const stepProgress = operatorState.stepProgress || 0;

  // Short input lock to prevent accidental double-clicks (~200ms)
  const [isInputLocked, setIsInputLocked] = useState(false);

  // Local rejection & reset animation tracking
  const [rejectedPistonId, setRejectedPistonId] = useState<number | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [justActivatedDotIndex, setJustActivatedDotIndex] = useState<number | null>(null);

  // Allow ~320ms to see the 4th piston lock & 4th dot illuminate before displaying solved banner
  const [showFinalSolvedBanner, setShowFinalSolvedBanner] = useState(solved);

  const prevProgressRef = useRef(stepProgress);
  const prevSolvedRef = useRef(solved);

  // Detect step progress changes & resets
  useEffect(() => {
    if (stepProgress > prevProgressRef.current) {
      // Step advanced! Animate the newly illuminated dot
      const newDotIndex = stepProgress - 1;
      setJustActivatedDotIndex(newDotIndex);
      const dotTimer = setTimeout(() => setJustActivatedDotIndex(null), 300);
      return () => clearTimeout(dotTimer);
    } else if (stepProgress === 0 && prevProgressRef.current > 0 && !solved) {
      // Sequence reset due to wrong order!
      setIsResetting(true);
      audio.playValveTurn();
      const resetTimer = setTimeout(() => {
        setIsResetting(false);
        setRejectedPistonId(null);
      }, 450);
      return () => clearTimeout(resetTimer);
    }
    prevProgressRef.current = stepProgress;
  }, [stepProgress, solved]);

  // Handle final solve presentation delay
  useEffect(() => {
    if (solved && !prevSolvedRef.current) {
      // Wait 320ms so player sees 4th piston engage and 4th dot light up
      const timer = setTimeout(() => {
        setShowFinalSolvedBanner(true);
      }, 320);
      return () => clearTimeout(timer);
    } else if (solved) {
      setShowFinalSolvedBanner(true);
    }
    prevSolvedRef.current = solved;
  }, [solved]);

  const handlePistonClick = (id: number) => {
    if (solved || isInputLocked || pressedIds.includes(id)) return;

    // Short lock to avoid duplicate clicks during travel
    setIsInputLocked(true);
    setTimeout(() => setIsInputLocked(false), 220);

    // Play mechanical click
    audio.playMechanicalSwitch();

    // Anticipate potential rejection if sequence reset happens
    setRejectedPistonId(id);

    onAction({ pressedPistonId: id });
  };

  const effectiveStepCount = solved ? 4 : Math.min(4, Math.max(0, stepProgress));

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/95 rounded-2xl border-2 border-slate-700/80 shadow-2xl select-none font-mono">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cog className="w-4 h-4 text-amber-400 animate-spin [animation-duration:12s]" />
          <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
            CONTROL
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            // BLOQUEO DE PISTONES CINÉTICOS
          </span>
        </div>

        {/* 4-Step Progress Indicator (PASO X/4 + 4 Dots) */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-slate-400">
            PASO <span className="text-white font-black">{effectiveStepCount}/4</span>:
          </span>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 shadow-inner">
            {[0, 1, 2, 3].map((stepIdx) => {
              const isDone = stepIdx < effectiveStepCount;
              const isPopping = justActivatedDotIndex === stepIdx;

              return (
                <div
                  key={stepIdx}
                  className={`w-3 h-3 rounded-full transition-all duration-250 flex items-center justify-center ${
                    isDone
                      ? 'bg-emerald-400 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : 'bg-slate-800 border border-slate-700'
                  } ${isPopping ? 'scale-125 ring-2 ring-emerald-300' : 'scale-100'}`}
                  title={`Paso ${stepIdx + 1} de 4: ${isDone ? 'Completado' : 'Pendiente'}`}
                >
                  {isDone && <div className="w-1 h-1 rounded-full bg-white/90" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Piston Stations Bank */}
      <div className="w-full flex items-end justify-center gap-3 sm:gap-6 my-6 max-w-lg px-2">
        {pistons.map((piston) => {
          const isEngaged = solved || pressedIds.includes(piston.id);
          const isRejected = rejectedPistonId === piston.id && isResetting;
          const collar = COLLAR_THEMES[piston.collar] || COLLAR_THEMES.Dorado;

          // Height based on stroke specifications
          const heightClasses =
            piston.stroke === 'Largo'
              ? 'h-44 sm:h-52'
              : piston.stroke === 'Medio'
              ? 'h-36 sm:h-44'
              : 'h-32 sm:h-36';

          // Stroke depth displacement (distance the piston compresses into the sleeve)
          const travelClass = isEngaged
            ? 'translate-y-10 sm:translate-y-12'
            : isRejected
            ? 'translate-y-2 animate-shake'
            : isResetting
            ? 'translate-y-0 transition-transform duration-400 ease-out'
            : 'translate-y-0';

          return (
            <div
              key={piston.id}
              className="flex-1 flex flex-col items-center gap-2 max-w-[85px]"
            >
              {/* Piston Identifier & State Label */}
              <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-black font-mono tracking-wider text-slate-300">
                  P-{piston.id}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase transition-colors duration-200 ${
                    isEngaged ? 'text-emerald-400 font-black' : 'text-slate-500'
                  }`}
                >
                  {isEngaged ? 'ENCLAVADO' : 'RETRAÍDO'}
                </span>
              </div>

              {/* Piston Outer Housing Sleeve with Plunger Shaft */}
              <div className="relative w-full flex flex-col items-center">
                {/* Active Piston Shaft (Physically moves downward into sleeve) */}
                <button
                  type="button"
                  disabled={solved || isEngaged || isInputLocked}
                  onClick={() => handlePistonClick(piston.id)}
                  className={`relative w-full ${heightClasses} rounded-t-xl border-2 flex flex-col items-center justify-between p-1.5 transition-all duration-200 transform cursor-pointer select-none ${travelClass} ${
                    isEngaged
                      ? 'bg-slate-950 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] pointer-events-none'
                      : isRejected
                      ? 'bg-red-950/80 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                      : 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-slate-600 hover:border-amber-400/80 hover:-translate-y-1 active:translate-y-3 shadow-lg shadow-slate-950/80'
                  }`}
                  style={{ touchAction: 'none' }}
                  title={`Pistón P-${piston.id} • Collar ${piston.collar}, Recorrido ${piston.stroke}`}
                >
                  {/* Metallic Top Plunger Head */}
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-3 rounded-t-lg bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border-b border-slate-500 shadow-sm" />
                    <div className="w-2/3 h-1 bg-slate-500" />
                  </div>

                  {/* Anodized Color Identification Collar */}
                  <div
                    className={`w-full py-1.5 rounded-md text-center border font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-md transition-all ${
                      collar.bg
                    } ${collar.border} ${isEngaged ? collar.glow : ''}`}
                  >
                    {piston.collar}
                  </div>

                  {/* Precision Stroke Depth Rings/Grooves */}
                  <div className="flex flex-col gap-1 w-full px-1 items-center">
                    <div className="w-full h-0.5 bg-slate-600 rounded" />
                    {piston.stroke !== 'Corto' && (
                      <div className="w-full h-0.5 bg-slate-600 rounded" />
                    )}
                    {piston.stroke === 'Largo' && (
                      <div className="w-full h-0.5 bg-slate-600 rounded" />
                    )}
                  </div>

                  {/* Base Status Pin Indicator */}
                  <div className="w-full flex items-center justify-center gap-1 py-0.5 bg-slate-950/80 rounded border border-slate-800">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        isEngaged
                          ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                          : 'bg-slate-700'
                      }`}
                    />
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-300">
                      {isEngaged ? 'LOCK' : piston.stroke}
                    </span>
                  </div>
                </button>

                {/* Grounded Hydraulic Cylinder Chamber Base (Sits at the bottom of the rack) */}
                <div className="w-full h-7 rounded-b-xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-slate-700 shadow-inner -mt-1 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1.5 rounded-full bg-slate-950 border border-slate-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Instructions / Module Status */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-3 border-t border-slate-800 text-center">
        {showFinalSolvedBanner ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>ENCLAVAMIENTO CINÉTICO NEUTRALIZADO</span>
          </div>
        ) : (
          <>
            <span className="text-xs font-mono font-bold text-slate-300">
              Pulsa los pistones en el orden riguroso de cuatro pasos indicado por el Guía
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Un error de orden provocará 1 fallo y reiniciará los pistones levantados
            </span>
          </>
        )}
      </div>
    </div>
  );
};
