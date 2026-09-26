import React, { useState } from 'react';
import { Play, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
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

  const handleKeyDown = (e: React.KeyboardEvent, gameId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectGame(gameId);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-hidden bg-[#07090e]">
      {/* =========================================================================
          BACKGROUND: SOFT DRIFTING AMBIENT GLOWS + SUBTLE VIGNETTE + DOT TEXTURE
          ========================================================================= */}
      {/* Drifting soft ambient color lights */}
      <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none animate-ambient-1" />
      <div className="absolute top-1/3 -right-28 w-[38rem] h-[38rem] bg-rose-600/10 rounded-full blur-[140px] pointer-events-none animate-ambient-2" />
      <div className="absolute -bottom-24 left-1/4 w-[34rem] h-[34rem] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none animate-ambient-3" />
      <div className="absolute top-2/3 -left-20 w-[30rem] h-[30rem] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none animate-ambient-4" />

      {/* Atmospheric micro-specks (quiet, floating dust motes) */}
      <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-amber-300/30 rounded-full blur-[0.5px] pointer-events-none animate-speck-1" />
      <div className="absolute top-3/5 right-1/4 w-1.5 h-1.5 bg-rose-300/25 rounded-full blur-[0.5px] pointer-events-none animate-speck-2" />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-sky-300/25 rounded-full blur-[0.5px] pointer-events-none animate-speck-1" style={{ animationDelay: '-6s' }} />
      <div className="absolute top-1/6 right-1/3 w-1 h-1 bg-emerald-300/20 rounded-full blur-[0.5px] pointer-events-none animate-speck-2" style={{ animationDelay: '-10s' }} />

      {/* Subtle dot texture pattern */}
      <div className="absolute inset-0 bg-subtle-dots pointer-events-none opacity-40 mix-blend-screen" />

      {/* Soft radial vignette darkening towards edges */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_95%_75%_at_50%_40%,transparent_35%,rgba(6,8,14,0.65)_80%,rgba(3,4,8,0.95)_100%)]" />

      {/* =========================================================================
          TOP BAR: EDICIÓN AMIGOS BADGE + ACTIONS (CÓMO JUGAR & SONIDO)
          ========================================================================= */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto pb-4 sm:pb-6">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.08)] backdrop-blur-sm select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Edición Amigos
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            id="how-to-play-header-button"
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer active:scale-95 select-none"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform duration-200" />
            <span>Cómo jugar</span>
          </button>
          <SoundToggle />
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION: FIESTA DE JUEGOS TITLE & POLISHED SUBTITLE
          ========================================================================= */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full py-4 sm:py-6 md:py-8">
        <div className="text-center mb-8 sm:mb-12 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500 hero-title-shadow leading-[1.12] pb-2 sm:pb-3 mb-1.5 sm:mb-2 animate-hero-title select-none">
            FIESTA DE JUEGOS
          </h1>
          <p className="text-base sm:text-xl text-slate-300/90 font-medium max-w-2xl mx-auto leading-relaxed animate-hero-sub">
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

        {/* =========================================================================
            GAME GRID: STRICT 3-COLUMN DESKTOP (3 PER ROW) WITH ACCENT GLOWS
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 w-full max-w-6xl mx-auto items-stretch">
          {/* CARD 1: LA BOMBA */}
          <div
            id="card-la-bomba"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('la-bomba')}
            onKeyDown={(e) => handleKeyDown(e, 'la-bomba')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-[#FFB000]/30 hover:border-[#FFB000] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(255,176,0,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
          >
            {/* Top inner sheen and radial accent light */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/20 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,176,0,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#FFB000] to-[#FF8A00] flex items-center justify-center text-3xl shadow-lg shadow-[#FFB000]/25 group-hover:scale-105 group-hover:-translate-y-1 group-hover:rotate-2 transition-all duration-300">
                  💣
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FFB000] transition-colors duration-200">
                LA BOMBA
              </h2>
              <p className="text-slate-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;Piensa rápido antes de que explote.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">2–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">Multijugador Online</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-amber-300/90">Alta tensión</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FFB000] group-hover:text-[#ffc338] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FFB000] group-hover:bg-[#FF8A00] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#FFB000]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 2: LA PEOR RESPUESTA */}
          <div
            id="card-la-peor-respuesta"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('la-peor-respuesta')}
            onKeyDown={(e) => handleKeyDown(e, 'la-peor-respuesta')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-[#FF3B4F]/30 hover:border-[#FF3B4F] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(255,59,79,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
            style={{ animationDelay: '0.04s' }}
          >
            {/* Top inner sheen and radial accent light */}
            <div className="inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/20 to-transparent absolute" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,59,79,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#FF3B4F] to-[#E6293D] flex items-center justify-center text-3xl shadow-lg shadow-[#FF3B4F]/25 group-hover:scale-105 group-hover:-translate-y-1 group-hover:-rotate-2 transition-all duration-300">
                  💀
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FF3B4F] transition-colors duration-200">
                LA PEOR RESPUESTA
              </h2>
              <p className="text-slate-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;Cuanto peor, mejor.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">3–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">Multijugador Online</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-rose-300/90">Votación simultánea</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FF3B4F] group-hover:text-[#ff5c6d] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FF3B4F] group-hover:bg-[#E6293D] text-white flex items-center justify-center font-black shadow-md shadow-[#FF3B4F]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 3: LIENZO LOCO */}
          <div
            id="card-pinturillo"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('pinturillo')}
            onKeyDown={(e) => handleKeyDown(e, 'pinturillo')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-[#00BCEB]/30 hover:border-[#00BCEB] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(0,188,235,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
            style={{ animationDelay: '0.08s' }}
          >
            {/* Top inner sheen and radial accent light */}
            <div className="inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent absolute" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,188,235,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#00BCEB] to-[#009ED0] flex items-center justify-center text-3xl shadow-lg shadow-[#00BCEB]/25 group-hover:scale-105 group-hover:-translate-y-1 group-hover:rotate-2 transition-all duration-300">
                  🎨
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#00BCEB] transition-colors duration-200">
                LIENZO LOCO
              </h2>
              <p className="text-slate-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;Dibuja, adivina y compite en tiempo real.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">2–10 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">Multijugador Online</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-cyan-300/90">Lienzo en vivo</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#00BCEB] group-hover:text-[#38d4fc] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#00BCEB] group-hover:bg-[#009ED0] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#00BCEB]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 4: PALABRA SECRETA */}
          <div
            id="card-palabra-secreta"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('palabra-secreta')}
            onKeyDown={(e) => handleKeyDown(e, 'palabra-secreta')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-[#10B981]/30 hover:border-[#10B981] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(16,185,129,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
            style={{ animationDelay: '0.12s' }}
          >
            {/* Top inner sheen and radial accent light */}
            <div className="inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent absolute" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-3xl shadow-lg shadow-[#10B981]/25 group-hover:scale-105 group-hover:-translate-y-1 group-hover:-rotate-2 transition-all duration-300">
                  🗣️
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#10B981] transition-colors duration-200">
                PALABRA SECRETA
              </h2>
              <p className="text-slate-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;3 modos de juego: Clásico, Contraseña y Emoji Misterioso.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">4–16 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">Por Equipos</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">3 Modos de Juego</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#10B981] group-hover:text-[#34d399] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#10B981] group-hover:bg-[#059669] text-slate-950 flex items-center justify-center font-black shadow-md shadow-[#10B981]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 5: CÓDIGO ROJO */}
          <div
            id="card-codigo-rojo"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('codigo-rojo')}
            onKeyDown={(e) => handleKeyDown(e, 'codigo-rojo')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-[#FF3B30]/30 hover:border-[#FF3B30] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(255,59,48,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
            style={{ animationDelay: '0.16s' }}
          >
            {/* Top inner sheen and radial accent light */}
            <div className="inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/20 to-transparent absolute" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,59,48,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#FF3B30] to-[#991B1B] flex items-center justify-center text-3xl shadow-lg shadow-[#FF3B30]/25 group-hover:scale-105 group-hover:-translate-y-1 group-hover:rotate-2 transition-all duration-300">
                  🚨
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-wide mb-2 group-hover:text-[#FF453A] transition-colors duration-200">
                CÓDIGO ROJO
              </h2>
              <p className="text-slate-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;Describe la máquina. Sigue el manual. Que no cunda el pánico.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">2–6 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 font-bold">Cooperativo</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/70 border border-slate-700/60 text-slate-300">Comunicación</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#FF453A] group-hover:text-[#ff6b62] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#FF3B30] group-hover:bg-[#DC2626] text-white flex items-center justify-center font-black shadow-md shadow-[#FF3B30]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* CARD 6: COARTADA */}
          <div
            id="card-coartada"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectGame('coartada')}
            onKeyDown={(e) => handleKeyDown(e, 'coartada')}
            className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-[#120f0d]/90 border border-[#d97706]/35 hover:border-[#f59e0b] shadow-xl hover:shadow-[0_14px_40px_-10px_rgba(217,119,6,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 active:scale-[0.98] overflow-hidden backdrop-blur-sm animate-card-reveal"
            style={{ animationDelay: '0.2s' }}
          >
            {/* Top inner sheen and radial accent light */}
            <div className="inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent absolute" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.13),transparent_65%)] pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#78350f] to-[#451a03] border border-[#d97706]/40 flex items-center justify-center text-3xl shadow-lg shadow-[#d97706]/20 group-hover:scale-105 group-hover:-translate-y-1 group-hover:-rotate-2 transition-all duration-300">
                  🕵️
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/35 text-emerald-300 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-status-breathe" />
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black font-serif text-stone-100 tracking-wide mb-2 group-hover:text-[#f59e0b] transition-colors duration-200">
                COARTADA
              </h2>
              <p className="text-stone-300/90 text-sm sm:text-base font-normal leading-snug">
                &ldquo;Uno es el detective, el otro el sospechoso. Interrogatorio, coartadas y una verdad oculta bajo la lluvia.&rdquo;
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-400">
                <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-amber-300 font-bold">2 Jugadores</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900/60 text-amber-200">Deducción 1v1</span>
                <span className="px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">Interrogatorio</span>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-sm font-bold text-[#f59e0b] group-hover:text-[#fbbf24] group-hover:translate-x-1.5 transition-all duration-200 flex items-center gap-1.5">
                Entrar a la sala <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="w-10 h-10 rounded-full bg-[#d97706] group-hover:bg-[#b45309] text-stone-950 flex items-center justify-center font-black shadow-md shadow-[#d97706]/25 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          FOOTER BAR
          ========================================================================= */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-4 max-w-6xl mx-auto w-full select-none">
        Fiesta de Juegos &bull; Diseñado para jugar con amigos en directo &bull; 100% en castellano
      </footer>

      {/* How to play modal */}
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
