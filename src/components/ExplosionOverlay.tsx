import React, { useEffect } from 'react';
import { Player } from '../types';
import { Skull, Flame } from 'lucide-react';
import { audio } from '../utils/audio';

interface ExplosionOverlayProps {
  affectedPlayer: Player;
  isEliminated: boolean;
  maxLives?: number;
  onDismiss: () => void;
}

export const ExplosionOverlay: React.FC<ExplosionOverlayProps> = ({
  affectedPlayer,
  isEliminated,
  maxLives = 3,
  onDismiss,
}) => {
  const currentLives = Math.max(0, affectedPlayer.lives);
  const totalSlots = Math.max(currentLives, maxLives || 3);

  useEffect(() => {
    // Sound playback
    audio.playExplosion();

    if (isEliminated || currentLives <= 0) {
      setTimeout(() => {
        audio.playElimination();
      }, 700);
    } else {
      setTimeout(() => {
        audio.playLifeLost();
      }, 600);
    }

    console.log(
      `[LIFE_UI] ExplosionOverlay displayed for ${affectedPlayer.name} (${affectedPlayer.id}): lives=${currentLives}/${totalSlots}, isEliminated=${isEliminated}`
    );

    // Auto-dismiss after dramatic display so everyone digests what happened
    const dismissTimer = setTimeout(() => {
      onDismiss();
    }, isEliminated || currentLives <= 0 ? 3800 : 3000);

    return () => clearTimeout(dismissTimer);
  }, [affectedPlayer, isEliminated, currentLives, totalSlots, onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn select-none">
      {/* Intense screen flash */}
      <div className="absolute inset-0 bg-amber-500/20 mix-blend-screen animate-ping pointer-events-none" />

      {/* Explosion Shockwave rings */}
      <div className="absolute w-[500px] h-[500px] rounded-full border-8 border-orange-500/60 animate-ping pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full border-4 border-rose-500/80 animate-ping pointer-events-none" />

      {/* Main Explosion Comic Starburst Badge */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        {/* Cartoon Fireball & Smoke Cloud */}
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center animate-critical-shake">
          {/* Jagged Explosion Starburst Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-rose-600 rounded-full blur-xl opacity-80 animate-pulse" />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_35px_rgba(239,68,68,0.9)] animate-pulse"
          >
            <polygon
              points="50,0 63,26 95,15 80,42 100,60 74,75 80,100 50,85 20,100 26,75 0,60 20,42 5,15 37,26"
              fill="#f59e0b"
            />
            <polygon
              points="50,10 60,30 85,22 73,44 90,58 69,70 74,90 50,78 26,90 31,70 10,58 27,44 15,22 40,30"
              fill="#ef4444"
            />
            <polygon
              points="50,22 57,36 74,30 65,46 78,56 63,64 67,78 50,70 33,78 37,64 22,56 35,46 26,30 43,36"
              fill="#fef08a"
            />
          </svg>

          {/* Central Boom Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-6xl font-black font-display text-slate-950 tracking-tighter drop-shadow-md">
              💥 ¡BOOM!
            </span>
          </div>
        </div>

        {/* Affected Player Card Status */}
        <div className="mt-6 w-full p-6 rounded-3xl bg-slate-900/95 border-2 border-rose-500/80 shadow-2xl shadow-rose-600/30">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 border-white/20 ${
                isEliminated ? 'grayscale brightness-50' : ''
              }`}
              style={{ backgroundColor: affectedPlayer.color }}
            >
              {affectedPlayer.avatar}
            </div>
            <div className="text-left">
              <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
                {affectedPlayer.name}
              </h3>
              <p className="text-rose-400 font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-current" />
                {isEliminated ? '¡Ha perdido su última vida!' : '¡Pierde una vida!'}
              </p>
            </div>
          </div>

          {/* Elimination vs Life Loss notice */}
          {isEliminated ? (
            <div className="mt-4 p-4 rounded-2xl bg-stone-950 border-2 border-amber-900 text-orange-400 text-sm font-bold flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-base font-black text-rose-500">
                <Skull className="w-5 h-5" />
                <span>¡JUGADOR CHAMUSCADO Y ELIMINADO!</span>
              </div>
              <span className="text-xs text-stone-400 font-medium">
                {affectedPlayer.name} queda fuera de combate para el resto de la partida.
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-center gap-2 text-2xl font-bold">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mr-2">
                Vidas restantes:
              </span>
              <span className="text-rose-500">
                {'❤️'.repeat(currentLives)}
              </span>
              <span className="text-slate-600">
                {'🖤'.repeat(Math.max(0, totalSlots - currentLives))}
              </span>
            </div>
          )}
        </div>

        {/* Continue button for quick skipping if group is ready */}
        <button
          id="dismiss-explosion-button"
          type="button"
          onClick={onDismiss}
          className="mt-6 px-6 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-widest border border-slate-700 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          Continuar turno ↵
        </button>
      </div>
    </div>
  );
};
