import React, { useState } from 'react';
import { Flame, Skull, Palette, Play, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { SoundToggle } from './SoundToggle';
import { HowToPlayModal } from './HowToPlayModal';
import { audio } from '../utils/audio';

interface MainMenuProps {
  onSelectGame: (gameId: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onSelectGame }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null);

  const handleSelectGame = (gameId: string) => {
    audio.playTurnChange();
    onSelectGame(gameId);
  };

  const handleComingSoon = (gameName: string) => {
    audio.playBombWarning(1.2);
    setComingSoonToast(gameName);
    setTimeout(() => {
      setComingSoonToast(null);
    }, 3000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-hidden bg-radial from-slate-900 via-slate-950 to-black">
      {/* Background playful party glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto pb-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Edición Amigos
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="how-to-play-header-button"
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Cómo jugar</span>
          </button>
          <SoundToggle />
        </div>
      </header>

      {/* Main hero title */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-14">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 drop-shadow-sm leading-none mb-4">
            FIESTA DE JUEGOS
          </h1>
          <p className="text-lg sm:text-2xl text-slate-300 font-medium max-w-2xl mx-auto">
            Juegos multijugador rápidos, competitivos y ligeramente caóticos para jugar con amigos.
          </p>
        </div>

        {/* Coming soon toast notification */}
        {comingSoonToast && (
          <div className="fixed top-20 z-50 animate-bounce px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-2xl border border-amber-300 flex items-center gap-2">
            <span>⏳</span>
            <span>¡{comingSoonToast} estará disponible muy pronto! Juega a La Bomba mientras tanto.</span>
          </div>
        )}

        {/* 3 Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full">
          {/* CARD 1: LA BOMBA (ACTIVE & PLAYABLE) */}
          <div
            id="card-la-bomba"
            onClick={() => handleSelectGame('la-bomba')}
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-amber-500/80 hover:border-amber-400 shadow-2xl hover:shadow-amber-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Dynamic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  💣
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Disponible
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-amber-300 transition-colors">
                LA BOMBA
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Piensa rápido antes de que explote.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">2–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Secuencias de letras</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Alta tensión</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Configurar partida <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 2: LA PEOR RESPUESTA (ACTIVE & PLAYABLE) */}
          <div
            id="card-la-peor-respuesta"
            onClick={() => handleSelectGame('la-peor-respuesta')}
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-stone-900 to-slate-950 border-2 border-stone-700/90 hover:border-amber-400/90 shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Ambient card glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-700/15 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 via-neutral-900 to-black border border-stone-700 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:border-amber-400/60 transition-transform">
                  💀
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Disponible
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-amber-400 transition-colors">
                LA PEOR RESPUESTA
              </h2>
              <p className="text-stone-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Cuanto peor, mejor.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-400">
                <span className="px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300">
                  3–10 Jugadores
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300">
                  Humor irreverente
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300">
                  Votación secreta
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Configurar partida <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-amber-500 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 3: PINTURILLO (ACTIVE & ONLINE MULTIPLAYER) */}
          <div
            id="card-pinturillo"
            onClick={() => handleSelectGame('pinturillo')}
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-cyan-500/80 hover:border-cyan-400 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Dynamic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                  🎨
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-cyan-300 transition-colors">
                PINTURILLO
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Dibuja, adivina y compite en tiempo real.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">2–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Multijugador Online</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Lienzo en vivo</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-cyan-500 group-hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-black shadow-md transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-4 max-w-6xl mx-auto w-full">
        Fiesta de Juegos &bull; Diseñado para jugar con amigos en directo &bull; 100% en castellano
      </footer>

      {/* How to play modal */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
