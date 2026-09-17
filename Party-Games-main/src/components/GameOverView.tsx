import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Award, Zap, Flame, ShieldAlert } from 'lucide-react';
import { GameStats, Player } from '../types';
import { audio } from '../utils/audio';
import { SoundToggle } from './SoundToggle';

interface GameOverViewProps {
  stats: GameStats;
  players: Player[];
  onRematch: () => void;
  onBackToMenu: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  stats,
  players,
  onRematch,
  onBackToMenu,
}) => {
  useEffect(() => {
    audio.playVictory();

    // Trigger celebratory confetti cannon!
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  const winner = stats.winner;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-radial from-slate-900 via-slate-950 to-black text-slate-100 select-none">
      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto pb-4">
        <button
          id="gameover-back-menu-button"
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>

        <SoundToggle />
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-4">
        {/* Winner Hero Card */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl mb-4 shadow-2xl shadow-amber-500/30 animate-bounce">
            🏆
          </div>

          <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 font-extrabold text-xs uppercase tracking-widest mb-2">
            ¡Último superviviente en pie!
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-400 font-display uppercase tracking-wider">
            Ganador
          </h2>

          <h1 className="text-5xl sm:text-7xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 tracking-tight mt-1">
            {winner ? winner.name.toUpperCase() : '¡EMPATE!'}
          </h1>

          {winner && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-3xl">{winner.avatar}</span>
              <span className="text-slate-300 font-bold text-lg">
                Conservó {winner.lives} {winner.lives === 1 ? 'vida' : 'vidas'}
              </span>
            </div>
          )}
        </div>

        {/* Game Statistics Grid */}
        <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Estadísticas de la partida
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Stat 1: Palabras Válidas */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400 font-semibold mb-1">
                Palabras válidas
              </span>
              <span className="text-3xl font-black font-display text-emerald-400">
                {stats.totalValidWords}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Dichas antes de explotar
              </span>
            </div>

            {/* Stat 2: Fallos */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400 font-semibold mb-1">
                Fallos cometidos
              </span>
              <span className="text-3xl font-black font-display text-amber-400">
                {stats.totalMistakes}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Respuestas repetidas o no válidas
              </span>
            </div>

            {/* Stat 3: Bombas Recibidas */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col">
              <span className="text-xs text-slate-400 font-semibold mb-1">
                Bombas recibidas
              </span>
              <span className="text-3xl font-black font-display text-rose-500">
                {stats.totalExplosions}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Explosiones en total
              </span>
            </div>

            {/* Stat 4: Respuesta Más Rápida */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col col-span-1 sm:col-span-1">
              <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Respuesta más rápida
              </span>
              {stats.fastestAnswer ? (
                <>
                  <span className="text-xl sm:text-2xl font-black font-display text-yellow-300 truncate">
                    {stats.fastestAnswer.timeSeconds.toFixed(1)}s
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 truncate">
                    {stats.fastestAnswer.playerName} (&ldquo;{stats.fastestAnswer.word}&rdquo;)
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate-500 font-bold mt-2">-</span>
              )}
            </div>

            {/* Stat 5: Jugador Más Chamuscado */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col col-span-2 sm:col-span-2">
              <span className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Jugador más chamuscado
              </span>
              {stats.mostBurntPlayer && stats.mostBurntPlayer.explosions > 0 ? (
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{stats.mostBurntPlayer.player.avatar}</span>
                    <div>
                      <span className="text-base sm:text-lg font-black font-display text-orange-400">
                        {stats.mostBurntPlayer.player.name}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Se comió {stats.mostBurntPlayer.explosions} {stats.mostBurntPlayer.explosions === 1 ? 'explosión' : 'explosiones'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-orange-950 border border-orange-800 text-orange-400">
                    💀 Quemado
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-500 font-bold mt-2">
                  ¡Nadie sufrió demasiado!
                </span>
              )}
            </div>
          </div>

          {/* Ranking list of players */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              Supervivientes y eliminados
            </span>
            <div className="space-y-2">
              {players.map((p, index) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                    p.id === winner?.id
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-200'
                      : p.isEliminated
                      ? 'bg-slate-900/60 border border-slate-800/80 text-stone-500 line-through'
                      : 'bg-slate-800/60 border border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{p.avatar}</span>
                    <span className="font-bold">{p.name}</span>
                    {p.id === winner?.id && (
                      <span className="text-xs font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                        CAMPEÓN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span>{p.isEliminated ? 'Eliminado' : `${p.lives} vidas`}</span>
                    <span>{p.validWordsCount} palabras</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <button
            id="rematch-button"
            type="button"
            onClick={onRematch}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>REVANCHA</span>
          </button>

          <button
            id="back-to-menu-from-gameover-button"
            type="button"
            onClick={onBackToMenu}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-base shadow-md active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>VOLVER AL MENÚ</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-2">
        Fiesta de Juegos &bull; La Bomba
      </footer>
    </div>
  );
};
