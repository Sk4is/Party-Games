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

        {/* Game Cards Grid (Max 3 per row on desktop, centered incomplete row) */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-7 w-full max-w-6xl mx-auto">
          {/* CARD 1: LA BOMBA (ACTIVE & PLAYABLE) */}
          <div
            id="card-la-bomba"
            onClick={() => handleSelectGame('la-bomba')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-[#FFB000]/80 hover:border-[#FFB000] shadow-2xl hover:shadow-[#FFB000]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Dynamic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FFB000]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFB000] to-[#FF8A00] flex items-center justify-center text-3xl shadow-lg shadow-[#FFB000]/30 group-hover:scale-110 transition-transform">
                  💣
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FFB000] transition-colors">
                LA BOMBA
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Piensa rápido antes de que explote.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">2–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Multijugador Online</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Alta tensión</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FFB000] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FFB000] group-hover:bg-[#FF8A00] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#FFB000]/25 transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 2: LA PEOR RESPUESTA (ACTIVE & PLAYABLE) */}
          <div
            id="card-la-peor-respuesta"
            onClick={() => handleSelectGame('la-peor-respuesta')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-stone-900 to-slate-950 border-2 border-[#FF3B4F]/80 hover:border-[#FF3B4F] shadow-2xl hover:shadow-[#FF3B4F]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Ambient card glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF3B4F]/15 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF3B4F] to-[#E6293D] flex items-center justify-center text-3xl shadow-lg shadow-[#FF3B4F]/30 group-hover:scale-110 transition-transform">
                  💀
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FF3B4F] transition-colors">
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
                  Multijugador Online
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900/90 border border-stone-800 text-stone-300">
                  Votación simultánea
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FF3B4F] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FF3B4F] group-hover:bg-[#E6293D] text-white flex items-center justify-center font-black shadow-md shadow-[#FF3B4F]/25 transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 3: PINTURILLO (ACTIVE & ONLINE MULTIPLAYER) */}
          <div
            id="card-pinturillo"
            onClick={() => handleSelectGame('pinturillo')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-[#00BCEB]/80 hover:border-[#00BCEB] shadow-2xl hover:shadow-[#00BCEB]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Dynamic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#00BCEB]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00BCEB] to-[#009ED0] flex items-center justify-center text-3xl shadow-lg shadow-[#00BCEB]/30 group-hover:scale-110 transition-transform">
                  🎨
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#00BCEB] transition-colors">
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
              <span className="text-sm font-bold text-[#00BCEB] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#00BCEB] group-hover:bg-[#009ED0] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#00BCEB]/25 transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 4: PALABRA SECRETA (ACTIVE & PLAYABLE ONLINE) */}
          <div
            id="card-palabra-secreta"
            onClick={() => handleSelectGame('palabra-secreta')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-[#10B981]/80 hover:border-[#10B981] shadow-2xl hover:shadow-[#10B981]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Dynamic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#10B981]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-3xl shadow-lg shadow-[#10B981]/30 group-hover:scale-110 transition-transform">
                  🗣️
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#10B981] transition-colors">
                PALABRA SECRETA
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;3 modos de juego: Clásico, Contraseña y Emoji Misterioso.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">4–16 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Por Equipos</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold">3 Modos de Juego</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#10B981] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#10B981] group-hover:bg-[#059669] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#10B981]/25 transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 5: CÓDIGO ROJO (COOPERATIVE ASYMMETRIC MACHINE & MANUAL) */}
          <div
            id="card-codigo-rojo"
            onClick={() => handleSelectGame('codigo-rojo')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-850 to-slate-900 border-2 border-[#FF3B30]/80 hover:border-[#FF3B30] shadow-2xl hover:shadow-[#FF3B30]/25 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Ambient crimson glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF3B30]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#991B1B] flex items-center justify-center text-3xl shadow-lg shadow-[#FF3B30]/30 group-hover:scale-110 transition-transform">
                  🚨
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FF453A] transition-colors">
                CÓDIGO ROJO
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Describe la máquina. Sigue el manual. Que no cunda el pánico.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">2–6 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 font-bold">Cooperativo</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700">Comunicación</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FF453A] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FF3B30] group-hover:bg-[#DC2626] text-white flex items-center justify-center font-black shadow-md shadow-[#FF3B30]/25 transition-all">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 6: COARTADA (DETECTIVE NOIR INTERROGATION 1v1) */}
          <div
            id="card-coartada"
            onClick={() => handleSelectGame('coartada')}
            className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm sm:max-w-none group relative flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#1c1815] to-[#120f0d] border-2 border-[#d97706]/70 hover:border-[#f59e0b] shadow-2xl hover:shadow-[#d97706]/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-98 overflow-hidden"
          >
            {/* Ambient amber desk lamp glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#d97706]/15 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#78350f] to-[#451a03] border border-[#d97706]/40 flex items-center justify-center text-3xl shadow-lg shadow-[#d97706]/20 group-hover:scale-110 transition-transform">
                  🕵️
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Online
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-serif text-stone-100 tracking-wide mb-2 group-hover:text-[#f59e0b] transition-colors">
                COARTADA
              </h2>
              <p className="text-stone-300 text-base sm:text-lg font-medium leading-snug">
                &ldquo;Uno es el detective, el otro el sospechoso. Interrogatorio, coartadas y una verdad oculta bajo la lluvia.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-400">
                <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-amber-300 font-bold">2 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900/60 text-amber-200">Deducción 1v1</span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800">Interrogatorio</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#f59e0b] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#d97706] group-hover:bg-[#b45309] text-stone-950 flex items-center justify-center font-black shadow-md shadow-[#d97706]/25 transition-all">
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
