import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Target,
  Cpu,
  Trophy,
  Grid,
  Sparkles,
  Coins,
  Shield,
  Zap,
  Users,
  Wrench,
  Flame,
} from 'lucide-react';
import {
  FORTUNARIUM_MACHINE_ASSET,
  FORTUNARIUM_SYMBOL_ASSETS,
  FORTUNARIUM_SYMBOLS,
  NORMAL_SYMBOLS_BY_VALUE_DESC,
  SPECIAL_SYMBOL_IDS,
  FORTUNARIUM_PATTERNS_CATALOG,
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_BET_MODES,
  FORTUNARIUM_CURSOR_COLORS,
} from '../../data/fortunarium/fortunariumAssets';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RuleSectionId =
  | 'objetivo'
  | 'maquina'
  | 'simbolos'
  | 'patrones'
  | 'especiales'
  | 'cuotas'
  | 'integridad'
  | 'voltaje'
  | 'multijugador'
  | 'taller'
  | 'buffs';

const SECTIONS: {
  id: RuleSectionId;
  num: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'objetivo', num: '01', label: 'OBJETIVO', icon: Target },
  { id: 'maquina', num: '02', label: 'LA MÁQUINA', icon: Cpu },
  { id: 'simbolos', num: '03', label: 'SÍMBOLOS', icon: Trophy },
  { id: 'patrones', num: '04', label: 'PATRONES', icon: Grid },
  { id: 'especiales', num: '05', label: 'SÍMBOLOS ESPECIALES', icon: Sparkles },
  { id: 'cuotas', num: '06', label: 'CUOTAS', icon: Coins },
  { id: 'integridad', num: '07', label: 'INTEGRIDAD', icon: Shield },
  { id: 'voltaje', num: '08', label: 'VOLTAJE / APUESTAS', icon: Zap },
  { id: 'multijugador', num: '09', label: 'MULTIJUGADOR', icon: Users },
  { id: 'taller', num: '10', label: 'TALLER / MEJORAS', icon: Wrench },
  { id: 'buffs', num: '11', label: 'BUFFS Y DEBUFFS', icon: Flame },
];

const MiniPatternGrid: React.FC<{
  cells: { col: number; row: number }[];
  symbolAsset?: string;
}> = ({ cells, symbolAsset = FORTUNARIUM_SYMBOL_ASSETS.cereza }) => {
  const activeSet = new Set(cells.map((c) => `${c.col},${c.row}`));
  return (
    <div className="p-2 rounded-xl bg-stone-950 border border-amber-500/30 grid grid-cols-5 gap-1.5 w-full max-w-[230px]">
      {[0, 1, 2, 3, 4].map((col) => (
        <div key={col} className="grid grid-rows-3 gap-1.5">
          {[0, 1, 2].map((row) => {
            const active = activeSet.has(`${col},${row}`);
            return (
              <div
                key={row}
                className={`h-7 rounded-md flex items-center justify-center p-0.5 ${
                  active
                    ? 'bg-amber-400/25 border border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]'
                    : 'bg-stone-900 border border-stone-800 opacity-40'
                }`}
              >
                {active && (
                  <img
                    src={symbolAsset}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const FortunariumRulebookModal: React.FC<FortunariumRulebookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeId, setActiveId] = useState<RuleSectionId>('objetivo');

  if (!isOpen) return null;

  const currentIndex = SECTIONS.findIndex((s) => s.id === activeId);
  const currentSection = SECTIONS[currentIndex] || SECTIONS[0];

  const selectSection = (id: RuleSectionId) => {
    fortunariumAudio.playButtonClick();
    setActiveId(id);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      selectSection(SECTIONS[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < SECTIONS.length - 1) {
      selectSection(SECTIONS[currentIndex + 1].id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl bg-stone-950 border border-amber-500/50 shadow-2xl flex flex-col max-h-[90dvh] my-auto text-amber-50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Book Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                Enciclopedia Interactiva en Partida
              </span>
              <h2 className="text-xl sm:text-2xl font-fortunarium text-amber-300 tracking-wide">
                MANUAL DEL FORTUNARIUM
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Sidebar Chapters + Illustrated Page */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Index (3 cols on desktop, horizontal scroll on mobile) */}
          <nav className="md:col-span-4 lg:col-span-3 bg-stone-900/70 border-b md:border-b-0 md:border-r border-stone-800 p-2.5 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = sec.id === activeId;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => selectSection(sec.id)}
                  className={`px-3 py-2 rounded-xl text-left flex items-center gap-2.5 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 font-black shadow-md'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white font-semibold'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-950 text-amber-400'
                    }`}
                  >
                    {sec.num}
                  </span>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs whitespace-nowrap md:whitespace-normal">
                    {sec.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Right Page Content */}
          <div className="md:col-span-8 lg:col-span-9 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="border-b border-stone-800 pb-2.5 flex items-center justify-between">
                <h3 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wide">
                  {currentSection.num}. {currentSection.label}
                </h3>
                <span className="text-xs font-mono text-stone-400">
                  Página {currentIndex + 1} de {SECTIONS.length}
                </span>
              </div>

              {/* 1. OBJETIVO */}
              {activeId === 'objetivo' && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={FORTUNARIUM_MACHINE_ASSET}
                      alt="Fortunarium"
                      className="w-28 h-28 object-contain shrink-0"
                    />
                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-stone-200 leading-relaxed">
                      <p>
                        En <strong className="text-amber-300">FORTUNARIUM</strong>, de 1 a 4 jugadores operáis{' '}
                        <strong className="text-white">una única máquina tragaperras física compartida</strong> (en solitario o cooperativo).
                      </p>
                      <p>
                        Para ganar la partida debéis superar todos los <strong className="text-amber-300">Ciclos de Cuota</strong> (5, 7 o 10 ciclos) generando el <strong className="text-amber-300">Progreso de Cuota</strong> exigido antes de quedaros sin tiradas y sin que la <strong className="text-emerald-300">Integridad</strong> baje al 0%.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/35">
                      <div className="text-sm font-fortunarium text-emerald-300 mb-1">
                        CÓMO GANAR
                      </div>
                      <p className="text-xs text-stone-300">
                        Alcanza o supera la <strong>Cuota</strong> de cada ciclo antes de agotar las tiradas disponibles.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/35">
                      <div className="text-sm font-fortunarium text-rose-300 mb-1">
                        DERROTA POR CUOTA
                      </div>
                      <p className="text-xs text-stone-300">
                        Si las tiradas del ciclo llegan a <strong>0</strong> y la Caja Común no alcanza la Cuota, el casino os embarga.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/35">
                      <div className="text-sm font-fortunarium text-rose-300 mb-1">
                        DERROTA POR EXPLOSIÓN
                      </div>
                      <p className="text-xs text-stone-300">
                        Si la <strong>Integridad</strong> cae al <strong>0%</strong> por Bombas, Calaveras o Sobrecargas, la máquina revienta al instante.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. LA MÁQUINA */}
              {activeId === 'maquina' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs sm:text-sm text-stone-200">
                    Todos los botones y pantallas están integrados directamente sobre el mueble físico de la tragaperras:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-amber-300 block mb-1">
                        1. Ventana Central 3×5 (15 Casillas)
                      </strong>
                      <p className="text-stone-300">
                        5 columnas verticales con 3 filas visibles. Al girar, los rodillos caen de arriba abajo y se bloquean en orden de columna 1 a 5.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-amber-300 block mb-1">
                        2. Botón Central «GIRAR» y Palanca Derecha
                      </strong>
                      <p className="text-stone-300">
                        Puedes iniciar la tirada pulsando el gran botón rojo <strong>GIRAR</strong> del frontal o tirando de la <strong>palanca lateral derecha</strong>.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-amber-300 block mb-1">
                        3. Botones «APUESTA MÍN», «APUESTA MÁX», «-» y «+»
                      </strong>
                      <p className="text-stone-300">
                        Regulan el modo de voltaje de la máquina entre Estándar (x1), Doble (x2) y Sobrecarga (x3).
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-amber-300 block mb-1">
                        4. Tres Visores Digitales Inferiores
                      </strong>
                      <p className="text-stone-300">
                        Muestran el coste/apuesta actual, la ganancia una vez resuelta la tirada y el saldo común respecto a la cuota.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SÍMBOLOS */}
              {activeId === 'simbolos' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-stone-200">
                    Existen <strong className="text-amber-300">12 símbolos normales</strong> ordenados de mayor a menor valor. Pagan al alinear 3, 4 o 5 iguales en un patrón:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {NORMAL_SYMBOLS_BY_VALUE_DESC.map((id) => {
                      const s = FORTUNARIUM_SYMBOLS[id];
                      return (
                        <div
                          key={id}
                          className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center gap-2.5"
                        >
                          <img
                            src={s.asset}
                            alt={s.name}
                            className="w-10 h-10 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate">
                              {s.name}
                            </div>
                            <div className="text-[10px] font-mono text-amber-300">
                              3×{s.basePayout3}€ · 5×{s.basePayout5}€
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. PATRONES */}
              {activeId === 'patrones' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-stone-200">
                    Un patrón se activa cuando <strong className="text-amber-300">3, 4 o 5 símbolos iguales contiguos</strong> siguen una de las geometrías válidas. Si consigues varios patrones en la misma tirada, se iluminan y cobran uno tras otro:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FORTUNARIUM_PATTERNS_CATALOG.slice(0, 6).map((pat) => (
                      <div
                        key={pat.id}
                        className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-2"
                      >
                        <div className="text-sm font-fortunarium text-amber-300">
                          {pat.name.toUpperCase()}
                        </div>
                        <MiniPatternGrid cells={pat.cells} />
                        <p className="text-xs text-stone-300">{pat.geometryDesc}</p>
                        <span className="text-[11px] font-mono text-emerald-300">
                          {pat.payoutDesc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. SÍMBOLOS ESPECIALES */}
              {activeId === 'especiales' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-stone-200">
                    Los <strong className="text-amber-300">7 símbolos especiales</strong> (excepto el Comodín) producen su efecto con <strong className="text-white">una sola aparición</strong> en cualquier lugar de la ventana:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SPECIAL_SYMBOL_IDS.map((id) => {
                      const s = FORTUNARIUM_SYMBOLS[id];
                      return (
                        <div
                          key={id}
                          className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3"
                        >
                          <img
                            src={s.asset}
                            alt={s.name}
                            className="w-12 h-12 object-contain shrink-0"
                          />
                          <div>
                            <div className="text-sm font-fortunarium text-amber-300">
                              {s.name.toUpperCase()}
                            </div>
                            <p className="text-xs text-stone-300 leading-snug">
                              {s.shortDesc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. CUOTAS */}
              {activeId === 'cuotas' && (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-stone-200 leading-relaxed">
                  <div className="p-4 rounded-2xl bg-stone-900 border border-amber-500/30 flex items-center gap-4">
                    <img
                      src={FORTUNARIUM_SYMBOL_ASSETS.moneda}
                      alt="Cuota"
                      className="w-14 h-14 object-contain shrink-0"
                    />
                    <div>
                      <h4 className="text-base font-fortunarium text-amber-300">
                        ¿QUÉ ES LA CUOTA DEL CICLO?
                      </h4>
                      <p className="text-stone-300 mt-1">
                        Cada ciclo tiene un objetivo de dinero (por ejemplo, <strong>220€</strong> en el Ciclo 1) y un número limitado de tiradas (8 tiradas base).
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-emerald-300 block mb-1">
                        Cierre Anticipado con Bono
                      </strong>
                      <p className="text-xs text-stone-300">
                        En cuanto la Caja Común iguala o supera la Cuota, podéis pulsar <strong>«Cerrar Ciclo»</strong> para pasar inmediatamente al Taller y cobrar un bono en metálico por cada tirada ahorrada.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                      <strong className="text-amber-300 block mb-1">
                        Tributo entre Ciclos
                      </strong>
                      <p className="text-xs text-stone-300">
                        Al superar un ciclo, el casino cobra el 50% de la cuota como tributo y os deja el resto del capital para comprar mejoras en el Taller y afrontar el siguiente ciclo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. INTEGRIDAD */}
              {activeId === 'integridad' && (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-stone-200">
                  <div className="p-4 rounded-2xl bg-stone-900 border border-emerald-500/30 flex items-center gap-4">
                    <img
                      src={FORTUNARIUM_SYMBOL_ASSETS.llave}
                      alt="Integridad"
                      className="w-14 h-14 object-contain shrink-0"
                    />
                    <div>
                      <h4 className="text-base font-fortunarium text-emerald-300">
                        SALUD MECÁNICA DEL CHASIS (0% – 100%+)
                      </h4>
                      <p className="text-stone-300 mt-1">
                        La Integridad representa la resistencia física de la máquina. Si cae al <strong>0%</strong>, la máquina explota y el grupo pierde la partida en el acto.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/35">
                      <strong className="text-rose-300 block mb-1">
                        ¿Qué daña la Integridad?
                      </strong>
                      <ul className="list-disc list-inside text-stone-300 space-y-1">
                        <li>Cada <strong>Bomba</strong> sin desactivar (-14%).</li>
                        <li>Cada <strong>Calavera</strong> sin Trébol (-7%).</li>
                        <li>Tirar en modo <strong>Doble x2</strong> (-3%) o <strong>Sobrecarga x3</strong> (-7%).</li>
                      </ul>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/35">
                      <strong className="text-emerald-300 block mb-1">
                        ¿Cómo se repara?
                      </strong>
                      <ul className="list-disc list-inside text-stone-300 space-y-1">
                        <li>Símbolo <strong>Llave</strong> en los rodillos (+8% automático).</li>
                        <li>Línea ganadora de <strong>Herraduras</strong> (+4%).</li>
                        <li>Botón <strong>Reparar (+25%)</strong> usando dinero o 1 Llave.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. VOLTAJE / APUESTAS */}
              {activeId === 'voltaje' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-stone-200">
                    El premio de cualquier patrón se multiplica por el <strong className="text-sky-300">Voltaje de la Máquina</strong> y por el <strong className="text-amber-300">Modo de Apuesta</strong> elegido:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['normal', 'doble', 'sobrecarga'] as const).map((m) => {
                      const cfg = FORTUNARIUM_BET_MODES[m];
                      return (
                        <div
                          key={m}
                          className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-1.5"
                        >
                          <div className="text-base font-fortunarium text-amber-300">
                            {cfg.shortLabel}
                          </div>
                          <div className="text-xs font-mono text-white">
                            Coste: x{cfg.costMultiplier} · Premios: x{cfg.payoutMultiplier}
                          </div>
                          <div className="text-[11px] text-rose-300 font-semibold">
                            Desgaste por tirada: -{cfg.integrityWear}% Integridad
                          </div>
                          <p className="text-xs text-stone-300 mt-1">{cfg.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 9. MULTIJUGADOR */}
              {activeId === 'multijugador' && (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-stone-200">
                  <p>
                    Todos los jugadores ven exactamente los mismos rodillos en tiempo real y comparten la misma Caja Común, pero <strong className="text-amber-300">cada jugador tiene su propio cursor de color y su balance económico individual</strong>:
                  </p>
                  <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-2">
                    <strong className="text-amber-300">
                      Colores de Cursor en Tiempo Real
                    </strong>
                    <p className="text-xs text-stone-300">
                      Cada operador elige su color en la sala. Verás el puntero de tus compañeros moverse sobre la máquina para señalar símbolos, botones o mejoras.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {FORTUNARIUM_CURSOR_COLORS.map((c) => (
                        <span
                          key={c.id}
                          style={{ borderColor: c.hex, color: c.hex }}
                          className="px-2.5 py-1 rounded-lg bg-stone-950 border text-xs font-bold flex items-center gap-1.5"
                        >
                          <span
                            style={{ backgroundColor: c.hex }}
                            className="w-2.5 h-2.5 rounded-full"
                          />
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 10. TALLER / MEJORAS */}
              {activeId === 'taller' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-stone-200">
                    En el <strong className="text-amber-300">Taller del Fortunarium</strong> podéis instalar mejoras permanentes pagando con dinero de la Caja Común o con Llaves:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.values(FORTUNARIUM_UPGRADES_CATALOG).map((up) => (
                      <div
                        key={up.id}
                        className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-start gap-3"
                      >
                        <img
                          src={FORTUNARIUM_SYMBOL_ASSETS[up.iconSymbol]}
                          alt={up.name}
                          className="w-10 h-10 object-contain shrink-0"
                        />
                        <div>
                          <div className="text-xs font-black text-amber-300">
                            {up.name} (Máx. Nv.{up.maxLevel})
                          </div>
                          <p className="text-[11px] text-stone-300 leading-snug mt-0.5">
                            {up.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. BUFFS Y DEBUFFS */}
              {activeId === 'buffs' && (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/35 flex flex-col gap-2">
                      <div className="text-base font-fortunarium text-emerald-300">
                        SINERGIAS POSITIVAS (BUFFS)
                      </div>
                      <p className="text-stone-200">
                        • <strong>Llave + Bomba:</strong> Cada Llave en pantalla (o nivel de Artificiero) desactiva 1 Bomba y la convierte en <strong>+40€</strong> de recompensa.
                      </p>
                      <p className="text-stone-200">
                        • <strong>Trébol + Calavera:</strong> Cada Trébol bloquea la maldición de 1 Calavera en la misma tirada y otorga <strong>+10€</strong>.
                      </p>
                      <p className="text-stone-200">
                        • <strong>3+ Rayos:</strong> Además de subir el Voltaje, otorgan <strong>+1 Tirada Extra</strong> inmediata.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/35 flex flex-col gap-2">
                      <div className="text-base font-fortunarium text-rose-300">
                        PELIGROS Y PENALIZACIONES (DEBUFFS)
                      </div>
                      <p className="text-stone-200">
                        • <strong>Explosión de Bomba:</strong> Resta <strong>-14% de Integridad</strong> y destruye dinero del fondo común.
                      </p>
                      <p className="text-stone-200">
                        • <strong>Corrupción de Calavera:</strong> Absorbe el <strong>15% de la ganancia</strong> de la tirada (mínimo -16€) y daña -7% la Integridad.
                      </p>
                      <p className="text-stone-200">
                        • <strong>Desgaste por Sobrecarga:</strong> Jugar en x2 o x3 consume Integridad en cada giro aunque ganes premios mayores.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Page Navigation */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === SECTIONS.length - 1}
                onClick={handleNext}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Siguiente Capítulo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
