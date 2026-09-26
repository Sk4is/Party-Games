import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { audio } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: string;
}

interface GameRuleItem {
  num: string;
  title: string;
  content: React.ReactNode;
}

interface GameGuide {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  playersBadge: string;
  typeBadge: string;
  accent: {
    primary: string;
    contrastText: string;
    borderClass: string;
    glowColor: string;
    titleColor: string;
    iconBg: string;
    iconBorder: string;
    numberBg: string;
    numberColor: string;
    tagBg: string;
    tagBorder: string;
    tagText: string;
  };
  rules: GameRuleItem[];
}

const GAMES: GameGuide[] = [
  {
    id: 'bomba',
    name: 'La Bomba',
    icon: '💣',
    tagline: 'Piensa rápido antes de que explote',
    playersBadge: '2–10 Jugadores',
    typeBadge: 'Multijugador Online',
    accent: {
      primary: '#FFB000',
      contrastText: '#0a0f1d',
      borderClass: 'border-[#FFB000]/40',
      glowColor: 'rgba(255, 176, 0, 0.15)',
      titleColor: 'text-[#FFB000]',
      iconBg: 'bg-[#FFB000]/15',
      iconBorder: 'border-[#FFB000]/30',
      numberBg: 'rgba(255, 176, 0, 0.18)',
      numberColor: '#FFB000',
      tagBg: 'bg-amber-500/10',
      tagBorder: 'border-amber-500/30',
      tagText: 'text-amber-300',
    },
    rules: [
      {
        num: '01',
        title: 'Nueva secuencia en cada respuesta válida',
        content: (
          <p>
            El jugador activo recibe una combinación de <strong>2 o 3 letras</strong> (por ejemplo:{' '}
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-amber-300 font-semibold">
              «TRA»
            </span>
            ). Debe escribir una <strong className="text-white">palabra real en español</strong> que las contenga juntas y en ese mismo orden (ej:{' '}
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-slate-200">
              «trabajo»
            </span>
            ,{' '}
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-slate-200">
              «trampa»
            </span>
            ). Al acertar, la bomba pasa instantáneamente al siguiente jugador con una secuencia nueva.
          </p>
        ),
      },
      {
        num: '02',
        title: 'Bomba global continua',
        content: (
          <p>
            Toda la sala comparte <strong className="text-white">una sola mecha continua</strong> que dura entre <strong>60 y 180 segundos</strong>. La mecha no se detiene ni se reinicia entre turnos: acelera su pulso y explota de improviso en el turno de quien tenga la bomba en ese momento.
          </p>
        ),
      },
      {
        num: '03',
        title: 'Vidas y eliminación directa',
        content: (
          <p>
            Cada participante inicia con <strong className="text-white">3 vidas</strong>. Cada explosión en tu turno te descuenta una vida. Si pierdes todas tus vidas pasas a modo espectador. ¡El último jugador con vidas en pie se corona campeón!
          </p>
        ),
      },
    ],
  },
  {
    id: 'lpr',
    name: 'La Peor Respuesta',
    icon: '💀',
    tagline: 'Cuanto peor sea la ocurrencia, mejor',
    playersBadge: '3–10 Jugadores',
    typeBadge: 'Votación simultánea',
    accent: {
      primary: '#FF3B4F',
      contrastText: '#ffffff',
      borderClass: 'border-[#FF3B4F]/40',
      glowColor: 'rgba(255, 59, 79, 0.15)',
      titleColor: 'text-[#FF3B4F]',
      iconBg: 'bg-[#FF3B4F]/15',
      iconBorder: 'border-[#FF3B4F]/30',
      numberBg: 'rgba(255, 59, 79, 0.18)',
      numberColor: '#FF3B4F',
      tagBg: 'bg-rose-500/10',
      tagBorder: 'border-rose-500/30',
      tagText: 'text-rose-300',
    },
    rules: [
      {
        num: '01',
        title: 'Pregunta irreverente y surrealista',
        content: (
          <p>
            En cada ronda se revela una carta pública con una <strong className="text-white">situación incómoda, bizarra o un dilema disparatado</strong> que todos deben responder antes de que concluya el temporizador.
          </p>
        ),
      },
      {
        num: '02',
        title: 'Respuesta libre y secreta',
        content: (
          <p>
            Cada jugador redacta su respuesta en privado sin que nadie la vea. La meta no es ser correcto ni educado, sino ser <strong className="text-white">lo más divertido, ocurrente o políticamente incorrecto</strong> posible.
          </p>
        ),
      },
      {
        num: '03',
        title: 'Votación anónima comunitaria',
        content: (
          <p>
            Todas las respuestas se barajan de manera <strong className="text-white">100% anónima</strong>. Todos leen las ocurrencias y votan por su favorita (no puedes votar por tu propia respuesta). ¡La respuesta más votada suma puntos para la clasificación general!
          </p>
        ),
      },
    ],
  },
  {
    id: 'pinturillo',
    name: 'Lienzo Loco',
    icon: '🎨',
    tagline: 'Dibuja, adivina y compite en tiempo real',
    playersBadge: '2–10 Jugadores',
    typeBadge: 'Lienzo en vivo',
    accent: {
      primary: '#00BCEB',
      contrastText: '#070f1a',
      borderClass: 'border-[#00BCEB]/40',
      glowColor: 'rgba(0, 188, 235, 0.15)',
      titleColor: 'text-[#00BCEB]',
      iconBg: 'bg-[#00BCEB]/15',
      iconBorder: 'border-[#00BCEB]/30',
      numberBg: 'rgba(0, 188, 235, 0.18)',
      numberColor: '#00BCEB',
      tagBg: 'bg-cyan-500/10',
      tagBorder: 'border-cyan-500/30',
      tagText: 'text-cyan-300',
    },
    rules: [
      {
        num: '01',
        title: 'Un dibujante con palabra secreta',
        content: (
          <p>
            Por turnos, un participante asume el rol de artista con una <strong className="text-white">palabra secreta exclusiva</strong>. Cuenta con un lienzo interactivo y herramientas (lápiz, pincel, rotulador, goma y cubo de pintura) para trazar pistas visuales sin escribir letras ni números.
          </p>
        ),
      },
      {
        num: '02',
        title: 'Adivinanza en directo por chat',
        content: (
          <p>
            El resto de jugadores intentan adivinar escribiendo en el chat de la sala. Cuanto más rápido aciertes, más puntos sumas (<strong className="text-white">hasta 1.500 pts</strong>). El dibujante también recibe puntos extra por cada participante que descifre su dibujo.
          </p>
        ),
      },
      {
        num: '03',
        title: 'Pistas automáticas y aviso «¡Casi!»',
        content: (
          <p>
            Conforme avanza el reloj se van destapando letras en el marcador superior. Si tu mensaje se queda a solo una letra de la respuesta correcta, recibirás un aviso privado de{' '}
            <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs">
              «🔥 ¡Casi!»
            </span>{' '}
            para que ajustes tu respuesta al instante.
          </p>
        ),
      },
    ],
  },
  {
    id: 'palabra-secreta',
    name: 'Palabra Secreta',
    icon: '🗣️',
    tagline: 'Deducción y comunicación por equipos con 3 modalidades',
    playersBadge: '4–16 Jugadores',
    typeBadge: '3 Modos de Juego',
    accent: {
      primary: '#10B981',
      contrastText: '#051b14',
      borderClass: 'border-[#10B981]/40',
      glowColor: 'rgba(16, 185, 129, 0.15)',
      titleColor: 'text-[#10B981]',
      iconBg: 'bg-[#10B981]/15',
      iconBorder: 'border-[#10B981]/30',
      numberBg: 'rgba(16, 185, 129, 0.18)',
      numberColor: '#10B981',
      tagBg: 'bg-emerald-500/10',
      tagBorder: 'border-emerald-500/30',
      tagText: 'text-emerald-300',
    },
    rules: [
      {
        num: '01',
        title: 'Dos equipos enfrentados en turnos alternos',
        content: (
          <p>
            Los jugadores se dividen en <strong className="text-white">dos equipos</strong> (mínimo 2 personas por bando). En cada turno rota el descriptor del equipo, quien debe guiar a sus compañeros mientras el equipo rival supervisa el cumplimiento estricto de las reglas.
          </p>
        ),
      },
      {
        num: '02',
        title: 'Tres modalidades de juego',
        content: (
          <div className="space-y-2 mt-1">
            <p>
              • <strong className="text-emerald-300">Modo Clásico:</strong> Describe la palabra secreta sin pronunciar las 5 palabras prohibidas ni derivados antes de que se agote el cronómetro.
            </p>
            <p>
              • <strong className="text-amber-300">Modo Contraseña:</strong> 10 palabras objetivo con un cupo total de 15 pistas verbales. Administra tus pistas para obtener multiplicadores de eficiencia (hasta x1.5).
            </p>
            <p>
              • <strong className="text-cyan-300">Modo Emoji Misterioso:</strong> Selecciona 1 de 3 títulos y compón pistas en directo usando exclusivamente hasta 5 emojis para que tu equipo adivine.
            </p>
          </div>
        ),
      },
      {
        num: '03',
        title: 'Puntuación y penalizaciones',
        content: (
          <p>
            Cada acierto legal suma puntos al casillero de tu equipo. Cometer faltas verbales, nombrar palabras prohibidas o saltar tarjetas en momentos indebidos acarrea deducciones o la pérdida inmediata del turno.
          </p>
        ),
      },
    ],
  },
  {
    id: 'codigo-rojo',
    name: 'Código Rojo',
    icon: '🚨',
    tagline: 'Misión cooperativa asimétrica de desactivación bajo tensión',
    playersBadge: '2–6 Jugadores',
    typeBadge: 'Cooperativo',
    accent: {
      primary: '#FF3B30',
      contrastText: '#ffffff',
      borderClass: 'border-[#FF3B30]/40',
      glowColor: 'rgba(255, 59, 48, 0.15)',
      titleColor: 'text-[#FF453A]',
      iconBg: 'bg-[#FF3B30]/15',
      iconBorder: 'border-[#FF3B30]/30',
      numberBg: 'rgba(255, 59, 48, 0.18)',
      numberColor: '#FF453A',
      tagBg: 'bg-red-500/10',
      tagBorder: 'border-red-500/30',
      tagText: 'text-red-300',
    },
    rules: [
      {
        num: '01',
        title: 'Roles asimétricos: Operador y Guías',
        content: (
          <p>
            Exactamente un participante actúa como <strong className="text-white">Operador</strong> (ve y pulsa la máquina con cables, símbolos y manómetros, pero carece de manual). Todos los demás son <strong className="text-white">Guías</strong> (tienen el manual técnico de desactivación pero no pueden ver la pantalla de la máquina).
          </p>
        ),
      },
      {
        num: '02',
        title: 'Comunicación verbal estricta',
        content: (
          <p>
            El Operador debe describir con precisión milimétrica lo que observa en cada módulo. Los Guías hojean el manual, interrogan sobre detalles clave y dictan las instrucciones exactas de intervención.
          </p>
        ),
      },
      {
        num: '03',
        title: 'Strikes acumulativos y rotación de roles',
        content: (
          <p>
            Cualquier fallo suma un <strong className="text-red-400">Strike (X)</strong>. Con 3 strikes o al expirar el tiempo, la máquina colapsa. ¡Entre misiones, el rol de Operador rota automáticamente para que todos experimenten ambos lados!
          </p>
        ),
      },
    ],
  },
  {
    id: 'coartada',
    name: 'Coartada',
    icon: '🕵️',
    tagline: 'Deducción e interrogatorio 1v1 estilo noir bajo la lluvia',
    playersBadge: '2 Jugadores',
    typeBadge: 'Deducción 1v1',
    accent: {
      primary: '#d97706',
      contrastText: '#1c140a',
      borderClass: 'border-[#d97706]/40',
      glowColor: 'rgba(217, 119, 6, 0.15)',
      titleColor: 'text-[#f59e0b]',
      iconBg: 'bg-[#d97706]/15',
      iconBorder: 'border-[#d97706]/30',
      numberBg: 'rgba(217, 119, 6, 0.20)',
      numberColor: '#f59e0b',
      tagBg: 'bg-amber-950/40',
      tagBorder: 'border-amber-900/60',
      tagText: 'text-amber-200',
    },
    rules: [
      {
        num: '01',
        title: 'Duelo de ingenio uno contra uno',
        content: (
          <p>
            Un jugador encarna al <strong className="text-white">Detective</strong> y el otro al <strong className="text-white">Sospechoso</strong>. El sistema genera un caso confidencial con un incidente, escenario del suceso, franja horaria y posibles indicios.
          </p>
        ),
      },
      {
        num: '02',
        title: 'Fase de lectura y preparación de coartadas',
        content: (
          <p>
            El Detective examina los primeros indicios del expediente. El Sospechoso memoriza su identidad, su coartada oficial y su secreto personal (puede ser el autor culpable o un inocente que oculta un secreto comprometedor).
          </p>
        ),
      },
      {
        num: '03',
        title: 'Interrogatorio en tiempo real y veredicto',
        content: (
          <p>
            Durante el interrogatorio, el Detective contrasta horarios, busca fisuras en el testimonio y confronta pruebas. Al concluir el tiempo, el Detective dicta su <strong className="text-amber-300">Veredicto Final</strong> (¿Culpable o Inocente?), desvelando la verdad completa del caso.
          </p>
        ),
      },
    ],
  },
];

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, initialGame }) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialGame && GAMES.some((g) => g.id === initialGame)) {
      return initialGame;
    }
    return 'bomba';
  });

  const carouselRef = useRef<HTMLDivElement>(null);
  const rulesContentRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds for navigation arrows and edge fades
  const updateScrollBounds = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }, []);

  // Update scroll bounds on open, resize, and scroll
  useEffect(() => {
    if (!isOpen) return;
    updateScrollBounds();

    const el = carouselRef.current;
    if (!el) return;

    const handleResize = () => updateScrollBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateScrollBounds]);

  // When initialGame changes while modal opens
  useEffect(() => {
    if (initialGame && GAMES.some((g) => g.id === initialGame)) {
      setActiveTab(initialGame);
    }
  }, [initialGame]);

  // Auto-scroll selected tab into view inside the horizontal carousel
  // and reset the rules content scroll to top
  useEffect(() => {
    if (!isOpen) return;

    const activeEl = tabRefs.current[activeTab];
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }

    if (rulesContentRef.current) {
      rulesContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab, isOpen]);

  // Mouse wheel horizontal scrolling over the carousel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = carouselRef.current;
    if (!el) return;
    if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      updateScrollBounds();
    }
  };

  const handleArrowScroll = (direction: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(updateScrollBounds, 250);
  };

  const handleSelectTab = (gameId: string) => {
    audio.playClick();
    setActiveTab(gameId);
  };

  // Keyboard navigation for tabstrip (ArrowLeft, ArrowRight, Home, End)
  const handleTablistKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = GAMES.findIndex((g) => g.id === activeTab);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % GAMES.length;
      const nextGame = GAMES[nextIndex];
      handleSelectTab(nextGame.id);
      tabRefs.current[nextGame.id]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + GAMES.length) % GAMES.length;
      const prevGame = GAMES[prevIndex];
      handleSelectTab(prevGame.id);
      tabRefs.current[prevGame.id]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleSelectTab(GAMES[0].id);
      tabRefs.current[GAMES[0].id]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      handleSelectTab(GAMES[GAMES.length - 1].id);
      tabRefs.current[GAMES[GAMES.length - 1].id]?.focus();
    }
  };

  if (!isOpen) return null;

  const currentGame = GAMES.find((g) => g.id === activeTab) || GAMES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        id="how-to-play-modal"
        className={`relative w-full max-w-[780px] bg-[#0c1017] border-2 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-32px)] overflow-hidden transition-all duration-300 ${currentGame.accent.borderClass}`}
        style={{
          boxShadow: `0 0 50px -15px ${currentGame.accent.glowColor}, 0 20px 40px -15px rgba(0, 0, 0, 0.7)`,
        }}
      >
        {/* =========================================================================
            STICKY HEADER ZONE: TITLE ROW + HORIZONTALLY SCROLLABLE CAROUSEL
            ========================================================================= */}
        <div className="shrink-0 bg-[#0e1422]/95 border-b border-slate-800/80 backdrop-blur-md z-20">
          {/* Top Row: Modal title badge and Close Button */}
          <div className="flex items-center justify-between px-5 sm:px-7 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm select-none">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Cómo Jugar</span>
              </span>
            </div>

            <button
              id="close-how-to-play-button"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95 shadow-sm"
              aria-label="Cerrar instrucciones"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Carousel Navigation Strip */}
          <div className="relative px-2 sm:px-4 pb-3 pt-1">
            {/* Left Edge Fade */}
            <div
              className={`pointer-events-none absolute left-8 top-1 bottom-3 w-8 bg-gradient-to-r from-[#0e1422] to-transparent z-10 transition-opacity duration-200 ${
                canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Right Edge Fade */}
            <div
              className={`pointer-events-none absolute right-8 top-1 bottom-3 w-8 bg-gradient-to-l from-[#0e1422] to-transparent z-10 transition-opacity duration-200 ${
                canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <div className="flex items-center gap-1.5">
              {/* Left Arrow Button (Desktop) */}
              <button
                type="button"
                onClick={() => handleArrowScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Juegos anteriores"
                className={`hidden sm:flex shrink-0 w-7 h-7 rounded-lg items-center justify-center transition-all ${
                  canScrollLeft
                    ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 cursor-pointer shadow-sm active:scale-95'
                    : 'text-slate-600 bg-slate-900/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Scrollable Tab Strip Container */}
              <div
                ref={carouselRef}
                role="tablist"
                aria-label="Selector de juegos"
                onScroll={updateScrollBounds}
                onWheel={handleWheel}
                onKeyDown={handleTablistKeyDown}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 flex-1 select-none"
              >
                {GAMES.map((game) => {
                  const isSelected = activeTab === game.id;
                  return (
                    <button
                      key={game.id}
                      ref={(el) => {
                        tabRefs.current[game.id] = el;
                      }}
                      id={`tab-${game.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isSelected}
                      aria-controls={`panel-${game.id}`}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => handleSelectTab(game.id)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 select-none active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isSelected
                          ? 'shadow-md scale-[1.02]'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: game.accent.primary,
                              color: game.accent.contrastText,
                              boxShadow: `0 4px 14px -3px ${game.accent.glowColor}`,
                            }
                          : undefined
                      }
                    >
                      <span className="text-base">{game.icon}</span>
                      <span>{game.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow Button (Desktop) */}
              <button
                type="button"
                onClick={() => handleArrowScroll('right')}
                disabled={!canScrollRight}
                aria-label="Siguientes juegos"
                className={`hidden sm:flex shrink-0 w-7 h-7 rounded-lg items-center justify-center transition-all ${
                  canScrollRight
                    ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 cursor-pointer shadow-sm active:scale-95'
                    : 'text-slate-600 bg-slate-900/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SCROLLABLE RULES CONTENT AREA: POLISHED GAME INSTRUCTION SHEET
            ========================================================================= */}
        <div
          ref={rulesContentRef}
          role="tabpanel"
          id={`panel-${currentGame.id}`}
          aria-labelledby={`tab-${currentGame.id}`}
          className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6 sm:space-y-7"
        >
          {/* Animated wrapper for smooth content transition on game change */}
          <div key={currentGame.id} className="animate-rules-fade space-y-6 sm:space-y-7">
            {/* Header: Game Icon, Display Title, Tagline and Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center text-3xl shrink-0 shadow-lg ${currentGame.accent.iconBg} ${currentGame.accent.iconBorder}`}
                >
                  {currentGame.icon}
                </div>
                <div>
                  <h3 className={`text-2xl sm:text-3xl font-black font-display tracking-wide ${currentGame.accent.titleColor}`}>
                    Reglas de {currentGame.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300/90 font-medium mt-0.5">
                    {currentGame.tagline}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-semibold">
                  {currentGame.playersBadge}
                </span>
                <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${currentGame.accent.tagBg} ${currentGame.accent.tagBorder} ${currentGame.accent.tagText}`}>
                  {currentGame.typeBadge}
                </span>
              </div>
            </div>

            {/* Instruction Sheet Rules List */}
            <div className="space-y-5 sm:space-y-6">
              {currentGame.rules.map((rule, idx) => {
                const isLast = idx === currentGame.rules.length - 1;
                return (
                  <div key={rule.num} className="group">
                    {/* Rule Title Row */}
                    <div className="flex items-center gap-3 mb-1.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-mono font-black shrink-0 tracking-wider shadow-sm select-none"
                        style={{
                          backgroundColor: currentGame.accent.numberBg,
                          color: currentGame.accent.numberColor,
                        }}
                      >
                        {rule.num}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                        {rule.title}
                      </h4>
                    </div>

                    {/* Rule Explanation */}
                    <div className="text-sm text-slate-300 leading-relaxed pl-8 sm:pl-9">
                      {rule.content}
                    </div>

                    {/* Subtle Divider (not on the last rule) */}
                    {!isLast && <div className="mt-5 sm:mt-6 border-b border-slate-800/60" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            MODAL FOOTER (CLEAN & MINIMAL)
            ========================================================================= */}
        <div className="shrink-0 px-6 py-3 bg-[#0a0d14] border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-500 select-none">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            <span>FAM2PLAY &bull; Manual de Reglas</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
