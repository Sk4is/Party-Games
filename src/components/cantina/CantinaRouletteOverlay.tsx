import React, { useEffect, useState } from 'react';
import { RouletteResult } from '../../types/cantina';
import { audio } from '../../utils/audio';
import { Skull, ShieldCheck, Flame, Crosshair } from 'lucide-react';

interface CantinaRouletteOverlayProps {
  rouletteResult: RouletteResult;
}

export const CantinaRouletteOverlay: React.FC<CantinaRouletteOverlayProps> = ({
  rouletteResult,
}) => {
  const [animStage, setAnimStage] = useState<'spin' | 'aim' | 'cock' | 'resolve'>('spin');
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);

  const { targetPlayerName, chamberNumber, fired, isFatal, isDevilSequence, stepIndex, totalSteps } =
    rouletteResult;

  // Whenever stepIndex or target changes, run the theatrical revolver sequence
  useEffect(() => {
    setAnimStage('spin');
    setScreenFlash(false);

    // 1. Cylinder spin
    audio.playRevolverSpin();
    const spinAngle = 720 + chamberNumber * 60;
    setCylinderAngle(spinAngle);

    // 2. Aim & tension pause
    const aimTimer = setTimeout(() => {
      setAnimStage('aim');

      // 3. Cock hammer / trigger tension
      const cockTimer = setTimeout(() => {
        setAnimStage('cock');
        audio.playRevolverTrigger();

        // 4. Resolve: CLICK or BANG!
        const resolveTimer = setTimeout(() => {
          setAnimStage('resolve');
          if (fired) {
            audio.playRevolverShot();
            setScreenFlash(true);
            setTimeout(() => setScreenFlash(false), 300);
          } else {
            audio.playRevolverClick();
          }
        }, 700);

        return () => clearTimeout(resolveTimer);
      }, 650);

      return () => clearTimeout(cockTimer);
    }, 1100);

    return () => clearTimeout(aimTimer);
  }, [stepIndex, chamberNumber, fired]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200">
      {/* Gunshot flash effect */}
      {screenFlash && (
        <div className="absolute inset-0 bg-red-600/60 pointer-events-none z-10 animate-ping" />
      )}

      <div className="relative z-20 w-full max-w-md bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-amber-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-6">
        {/* Header Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest">
          {isDevilSequence ? (
            <span className="flex items-center gap-1.5 text-rose-400">
              <Flame className="w-3.5 h-3.5 fill-current" /> CONDENA DEL DIABLO ({stepIndex + 1}/{totalSteps})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-300">
              <Crosshair className="w-3.5 h-3.5" /> RULETA RUSA
            </span>
          )}
        </div>

        {/* Target Player Announcement */}
        <div>
          <span className="text-xs text-stone-400 uppercase tracking-wider block font-medium">
            Toma el revólver:
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide mt-0.5">
            {targetPlayerName}
          </h2>
          <span className="text-xs text-amber-400/90 font-mono mt-1 block">
            Recámara {chamberNumber} de 6
          </span>
        </div>

        {/* 3D-styled Revolver Cylinder Visual */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-stone-950 border-4 border-stone-800 shadow-2xl flex items-center justify-center p-3">
          {/* Rotating Cylinder Rim */}
          <div
            style={{
              transform: `rotate(${cylinderAngle}deg)`,
              transition: animStage === 'spin' ? 'transform 1000ms cubic-bezier(0.15, 0.9, 0.3, 1)' : 'none',
            }}
            className="relative w-full h-full rounded-full border-2 border-amber-600/40 bg-stone-900 flex items-center justify-center"
          >
            {/* 6 Chambers */}
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const angle = idx * 60;
              const isLoaded = idx === 0; // visual representation
              return (
                <div
                  key={idx}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-46px)`,
                  }}
                  className="absolute w-8 h-8 rounded-full border-2 border-stone-700 bg-stone-950 shadow-inner flex items-center justify-center"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-stone-800" />
                </div>
              );
            })}

            {/* Central Axle Pivot */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-400 shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-stone-950" />
            </div>
          </div>

          {/* Top Barrel Indicator */}
          <div className="absolute -top-3 w-4 h-6 bg-amber-500 rounded-sm shadow-md" />
        </div>

        {/* Result Stage Presentation */}
        <div className="min-h-[50px] flex flex-col items-center justify-center">
          {animStage === 'spin' && (
            <span className="text-xs font-bold text-stone-400 tracking-wider uppercase animate-pulse">
              Girando el tambor...
            </span>
          )}

          {animStage === 'aim' && (
            <span className="text-xs font-bold text-amber-300 tracking-wider uppercase animate-pulse">
              Apuntando a la sien...
            </span>
          )}

          {animStage === 'cock' && (
            <span className="text-xs font-bold text-rose-400 tracking-wider uppercase animate-pulse">
              Apretando el gatillo...
            </span>
          )}

          {animStage === 'resolve' && (
            <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200">
              {fired ? (
                <div className="flex flex-col items-center text-rose-500">
                  <div className="flex items-center gap-2 text-3xl font-black font-serif">
                    <Skull className="w-7 h-7" /> ¡¡BANG!!
                  </div>
                  <span className="text-xs font-bold text-rose-300 mt-1 uppercase tracking-wider">
                    ¡La bala ha salido! {targetPlayerName} queda eliminado.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-emerald-400">
                  <div className="flex items-center gap-2 text-3xl font-black font-serif">
                    <ShieldCheck className="w-7 h-7" /> ¡¡CLIC!!
                  </div>
                  <span className="text-xs font-bold text-emerald-300 mt-1 uppercase tracking-wider">
                    ¡Recámara vacía! {targetPlayerName} sobrevive.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
