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
    <div className="p-2 rounded-xl bg-[#040a12] border border-cyan-500/35 grid grid-cols-5 gap-1.5 w-full max-w-[230px]">
      {[0, 1, 2, 3, 4].map((col) => (
        <div key={col} className="grid grid-rows-3 gap-1.5">
          {[0, 1, 2].map((row) => {
            const active = activeSet.has(`${col},${row}`);
            return (
              <div
                key={row}
                className={`h-7 rounded-md flex items-center justify-center p-0.5 ${
                  active
                    ? 'bg-[#FF2A6D]/25 border border-[#FF2A6D] shadow-[0_0_8px_rgba(255,42,109,0.5)]'
                    : 'bg-[#081320] border border-cyan-500/20 opacity-40'
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
      className="fortunarium-root font-fortunarium fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none"
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(1024px, calc(100vw - 32px))',
          height: 'min(820px, calc(100dvh - 32px))',
        }}
        className="fort-cyber-modal rounded-2xl flex flex-col text-cyan-50 overflow-hidden shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Book Header (Fixed) */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#130714] via-[#091322] to-[#081524] border-b border-[#FF2A6D]/45 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1f0815] border border-[#FF2A6D]/75 flex items-center justify-center text-[#FF2A6D] shadow-[0_0_14px_rgba(255,42,109,0.3)] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF2A6D] block">
                MANUAL DE TALLER Y OPERACIÓN · EDICIÓN CYBER-MECÁNICA
              </span>
              <h2 className="text-xl sm:text-2xl font-fortunarium text-white tracking-wide">
                MANUAL DEL FORTUNARIUM
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onClose();
            }}
            className="fort-arcade-btn p-2 rounded-xl bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/65 text-[#FF2A6D] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Fixed Sidebar + Independently Scrollable Chapter Content + Fixed Footer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Index (Fixed width on desktop, horizontal scroll on mobile) */}
          <nav className="shrink-0 md:w-[255px] lg:w-[275px] md:h-full bg-[#050b14] border-b md:border-b-0 md:border-r border-[#FF2A6D]/35 p-2.5 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isSelected = sec.id === activeId;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => selectSection(sec.id)}
                  className={`px-3 py-2 rounded-xl text-left flex items-center gap-2.5 shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#FF2A6D] text-white font-black border-pink-200 shadow-[0_0_16px_rgba(255,42,109,0.45)]'
                      : 'text-cyan-100/80 hover:bg-[#0b1828] hover:text-white font-semibold border-transparent'
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums ${
                      isSelected
                        ? 'bg-black/30 text-white'
                        : 'bg-[#081320] text-[#FF2A6D] border border-[#FF2A6D]/40'
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

          {/* Right Column: Fixed Chapter Title + Scrollable Body + Fixed Navigation Footer */}
          <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden font-sans">
            <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-[#FF2A6D]/35 flex items-center justify-between gap-2 bg-[#060d18]/60">
              <h3 className="text-2xl sm:text-3xl font-fortunarium text-[#FF2A6D] tracking-wide truncate">
                {currentSection.num}. {currentSection.label}
              </h3>
              <span className="text-xs font-mono text-cyan-300/80 tabular-nums shrink-0">
                Capítulo {currentIndex + 1} de {SECTIONS.length}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4">

              {/* 1. OBJETIVO */}
              {activeId === 'objetivo' && (
                <div className="flex flex-col gap-4">
                  <div className="fort-crt-panel p-4 rounded-2xl border border-cyan-500/40 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={FORTUNARIUM_MACHINE_ASSET}
                      alt="Fortunarium"
                      className="w-28 h-28 object-contain shrink-0"
                    />
                    <div className="flex flex-col gap-2 text-xs sm:text-sm text-cyan-50 leading-relaxed">
                      <p>
                        En <strong className="text-[#FF2A6D]">FORTUNARIUM</strong>, de 1 a 4 jugadores operáis{' '}
                        <strong className="text-white">una única máquina tragaperras física compartida</strong> (en solitario o cooperativo).
                      </p>
                      <p>
                        Para ganar la partida debéis superar los <strong className="text-amber-300">Umbrales de Cuota</strong> (5, 10, 15, 20 o Ilimitadas) acumulando créditos en la <strong className="text-amber-300">Caja Común</strong> sin caer en bancarrota (0 CR) y sin que la <strong className="text-emerald-300">Integridad</strong> baje al 0%.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/35 border border-emerald-400/45">
                      <div className="text-sm font-fortunarium text-emerald-300 mb-1">
                        CÓMO GANAR
                      </div>
                      <p className="text-xs text-cyan-100/85">
                        Alcanza o supera el umbral de <strong>Cuota</strong> en créditos y séllala para elegir 1 mejora gratis y pasar al siguiente umbral sin perder tu dinero.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/35 border border-rose-500/45">
                      <div className="text-sm font-fortunarium text-rose-300 mb-1">
                        DERROTA: SIN CRÉDITOS
                      </div>
                      <p className="text-xs text-cyan-100/85">
                        Si al terminar una tirada la Caja Común queda a <strong>0 CR</strong> (o no podéis pagar la tirada mínima), la fortuna se termina.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/35 border border-rose-500/45">
                      <div className="text-sm font-fortunarium text-rose-300 mb-1">
                        DERROTA POR EXPLOSIÓN
                      </div>
                      <p className="text-xs text-cyan-100/85">
                        Si la <strong>Integridad</strong> cae al <strong>0%</strong> por Bombas, Calaveras o Sobrecargas, la máquina revienta al instante.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. LA MÁQUINA */}
              {activeId === 'maquina' && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs sm:text-sm text-cyan-100">
                    Todos los botones y visores CRT están integrados directamente sobre el chasis electromecánico de la máquina:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35">
                      <strong className="text-[#FF2A6D] block mb-1 uppercase">
                        1. Ventana CRT Central 3×5 (15 Casillas)
                      </strong>
                      <p className="text-cyan-100/85">
                        5 columnas verticales con 3 filas visibles. Al girar, los rodillos caen de arriba abajo y se bloquean en orden de columna 1 a 5.
                      </p>
                    </div>
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35">
                      <strong className="text-[#FF2A6D] block mb-1 uppercase">
                        2. Botón Central «GIRAR» y Palanca Derecha
                      </strong>
                      <p className="text-cyan-100/85">
                        Puedes iniciar la tirada pulsando el gran botón <strong>GIRAR</strong> del frontal o arrastrando la <strong>palanca lateral derecha</strong>.
                      </p>
                    </div>
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35">
                      <strong className="text-cyan-300 block mb-1 uppercase">
                        3. Selectores «AP. MÍN», «AP. MÁX», «-» y «+»
                      </strong>
                      <p className="text-cyan-100/85">
                        Regulan el modo de voltaje de la máquina entre Estándar (x1), Doble (x2) y Sobrecarga (x3).
                      </p>
                    </div>
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35">
                      <strong className="text-amber-300 block mb-1 uppercase">
                        4. Tres Indicadores CRT Animados
                      </strong>
                      <p className="text-cyan-100/85">
                        Muestran en tiempo real el progreso de Cuota, el saldo de Créditos / Voltaje / Llaves y la barra de Integridad del chasis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SÍMBOLOS */}
              {activeId === 'simbolos' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-cyan-100">
                    Existen <strong className="text-[#FF2A6D]">{NORMAL_SYMBOLS_BY_VALUE_DESC.length} símbolos normales canónicos</strong> ordenados de mayor a menor Valor Base. Cada patrón multiplica el <strong className="text-amber-300">Valor Base</strong> del símbolo.{' '}
                    <strong className="text-white">MONO — El símbolo normal más valioso de Fortunarium.</strong>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {NORMAL_SYMBOLS_BY_VALUE_DESC.map((id) => {
                      const s = FORTUNARIUM_SYMBOLS[id];
                      const isMono = id === 'siete';
                      return (
                        <div
                          key={id}
                          className="fort-crt-panel p-3 rounded-xl border border-cyan-500/35 flex items-center gap-3"
                        >
                          <img
                            src={s.asset}
                            alt={s.name}
                            className="w-11 h-11 object-contain shrink-0"
                          />
                          <div className="min-w-0">
                            <div
                              className={`text-sm font-fortunarium tracking-wide truncate ${
                                isMono ? 'fort-mono-rainbow-static font-black' : 'text-white'
                              }`}
                            >
                              {s.name.toUpperCase()}
                            </div>
                            <div className="text-xs font-mono font-black text-amber-300 tabular-nums mt-0.5">
                              Valor Base: {s.baseSymbolValue} CR
                            </div>
                            {isMono && (
                              <div className="text-[10px] font-mono font-bold text-amber-200/90 truncate mt-0.5">
                                MONO — El símbolo normal más valioso de Fortunarium.
                              </div>
                            )}
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
                  <div className="p-3 rounded-2xl bg-[#1f0815]/80 border border-[#FF2A6D]/50 text-xs sm:text-sm text-pink-100">
                    <strong className="text-[#FF2A6D]">Regla fundamental:</strong>{' '}
                    <span className="underline font-bold text-white">
                      Todas las casillas marcadas deben contener el mismo símbolo compatible
                    </span>{' '}
                    (3, 4 o 5 en Horizontal; 3 en Vertical; 3 en Diagonal; las 5 casillas de esquina y centro en <strong>Patrón X</strong>; las 8 casillas en Triángulo y Triángulo Invertido; o las 15 casillas en <strong>Pantalla Completa / Jackpot</strong>).
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FORTUNARIUM_PATTERNS_CATALOG.map((pat) => (
                      <div
                        key={pat.id}
                        className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-fortunarium text-white tracking-wide">
                            {pat.name.toUpperCase()}
                          </div>
                          <span className="px-2 py-0.5 rounded bg-[#FF2A6D]/20 border border-[#FF2A6D]/55 text-[10px] font-mono font-black text-pink-200 tabular-nums">
                            ×{pat.baseMultiplier}
                          </span>
                        </div>
                        <MiniPatternGrid cells={pat.cells} />
                        <p className="text-xs text-cyan-100/85">{pat.geometryDesc}</p>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
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
                  <p className="text-xs sm:text-sm text-cyan-100">
                    Los <strong className="text-[#FF2A6D]">{SPECIAL_SYMBOL_IDS.length} símbolos especiales</strong> (excepto el Comodín) producen su efecto con <strong className="text-white">una sola aparición</strong> en cualquier lugar de la ventana:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SPECIAL_SYMBOL_IDS.map((id) => {
                      const s = FORTUNARIUM_SYMBOLS[id];
                      const isHazard = id === 'bomba' || id === 'calavera';
                      return (
                        <div
                          key={id}
                          className={`p-3 rounded-2xl border flex items-start gap-3 ${
                            isHazard
                              ? 'bg-[#240b12]/85 border-rose-500/55'
                              : 'fort-crt-panel border-cyan-500/35'
                          }`}
                        >
                          <img
                            src={s.asset}
                            alt={s.name}
                            className="w-12 h-12 object-contain shrink-0"
                          />
                          <div>
                            <div
                              className={`text-sm font-fortunarium tracking-wide ${
                                isHazard ? 'text-rose-300' : 'text-amber-300'
                              }`}
                            >
                              {s.name.toUpperCase()}
                            </div>
                            <p className="text-xs text-cyan-100/85 leading-snug">
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
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-cyan-100 leading-relaxed">
                  <div className="fort-crt-panel p-4 rounded-2xl border border-amber-400/45 flex items-center gap-4">
                    <img
                      src={FORTUNARIUM_SYMBOL_ASSETS.moneda}
                      alt="Cuota"
                      className="w-14 h-14 object-contain shrink-0"
                    />
                    <div>
                      <h4 className="text-base font-fortunarium text-amber-300">
                        LAS CUOTAS SON UMBRALES DE DINERO (NUNCA SE RESETEAN)
                      </h4>
                      <p className="text-cyan-100/85 mt-1">
                        Cada cuota es un umbral de créditos (por ejemplo, <strong>220 CR</strong> en la Cuota 1). Al sellar una cuota, <strong>conserváis el 100% de vuestro dinero</strong> y el siguiente umbral aproximadamente se duplica respecto al objetivo anterior.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-emerald-400/40">
                      <strong className="text-emerald-300 block mb-1">
                        Sellar Ahora o Seguir Arriesgando
                      </strong>
                      <p className="text-xs text-cyan-100/85">
                        Al alcanzar la cuota podéis pulsar <strong>«SELLAR CUOTA»</strong> para asegurar vuestro avance y elegir 1 de 3 mejoras gratuitas, o seguir girando para acumular más margen (la siguiente cuota se calcula sobre el objetivo anterior, ¡no os penaliza por superar el umbral!).
                      </p>
                    </div>
                    <div className="fort-crt-panel p-3.5 rounded-2xl border border-rose-500/45">
                      <strong className="text-rose-300 block mb-1">
                        Bancarrota (Sin Créditos) y Modo Ilimitado
                      </strong>
                      <p className="text-xs text-cyan-100/85">
                        Si al terminar una tirada os quedáis a <strong>0 CR</strong> (o sin créditos suficientes para pagar la tirada mínima), la partida termina por bancarrota. En modo <strong>CUOTAS ILIMITADAS</strong> la partida continúa indefinidamente hasta caer en bancarrota o romper la máquina.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. INTEGRIDAD */}
              {activeId === 'integridad' && (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-cyan-100">
                  <div className="fort-crt-panel p-4 rounded-2xl border border-emerald-400/45 flex items-center gap-4">
                    <img
                      src={FORTUNARIUM_SYMBOL_ASSETS.llave}
                      alt="Integridad"
                      className="w-14 h-14 object-contain shrink-0"
                    />
                    <div>
                      <h4 className="text-base font-fortunarium text-emerald-300">
                        SALUD MECÁNICA DEL CHASIS (0% – 300%)
                      </h4>
                      <p className="text-cyan-100/85 mt-1">
                        La Integridad representa la resistencia física de la máquina. Si cae al <strong>0%</strong>, la máquina explota y el grupo pierde la partida en el acto. El coste de reparación en créditos escala con cada cuota y con cada reparación realizada dentro de la misma cuota.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-rose-950/35 border border-rose-500/45">
                      <strong className="text-rose-300 block mb-1">
                        ¿Qué daña la Integridad?
                      </strong>
                      <ul className="list-disc list-inside text-cyan-100/85 space-y-1">
                        <li>Cada <strong>Bomba</strong> sin desactivar (-16% INT y -26 CR).</li>
                        <li>Cada <strong>Calavera</strong> sin Trébol (-8% INT y -20% premio).</li>
                        <li>Tirar en modo <strong>Doble x2</strong> (-3%) o <strong>Sobrecarga x3</strong> (-7%).</li>
                      </ul>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-950/35 border border-emerald-500/45">
                      <strong className="text-emerald-300 block mb-1">
                        ¿Cómo se repara?
                      </strong>
                      <ul className="list-disc list-inside text-cyan-100/85 space-y-1">
                        <li>Símbolo <strong>Llave</strong> en los rodillos (+6% automático y +1 🔑).</li>
                        <li>Patrón ganador de <strong>Herraduras</strong> (+5% INT por patrón).</li>
                        <li>Botón <strong>Reparar (+25% base)</strong> usando créditos o 1 Llave.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. VOLTAJE / APUESTAS */}
              {activeId === 'voltaje' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs sm:text-sm text-cyan-100">
                    El premio de cualquier patrón se multiplica por el <strong className="text-cyan-300">Voltaje de la Máquina</strong> y por el <strong className="text-[#FF2A6D]">Modo de Apuesta</strong> elegido:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['normal', 'doble', 'sobrecarga'] as const).map((m) => {
                      const cfg = FORTUNARIUM_BET_MODES[m];
                      return (
                        <div
                          key={m}
                          className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35 flex flex-col gap-1.5"
                        >
                          <div className="text-base font-fortunarium text-[#FF2A6D]">
                            {cfg.shortLabel}
                          </div>
                          <div className="text-xs font-mono text-white">
                            Coste: x{cfg.costMultiplier} · Premios: x{cfg.payoutMultiplier}
                          </div>
                          <div className="text-[11px] text-rose-300 font-semibold">
                            Desgaste por tirada: -{cfg.integrityWear}% Integridad
                          </div>
                          <p className="text-xs text-cyan-100/85 mt-1">{cfg.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 9. MULTIJUGADOR */}
              {activeId === 'multijugador' && (
                <div className="flex flex-col gap-3 text-xs sm:text-sm text-cyan-100">
                  <p>
                    Todos los jugadores ven exactamente los mismos rodillos en tiempo real y comparten la misma Caja Común, pero <strong className="text-[#FF2A6D]">cada jugador tiene su propio cursor de color y su balance económico individual</strong>:
                  </p>
                  <div className="fort-crt-panel p-3.5 rounded-2xl border border-cyan-500/35 flex flex-col gap-2">
                    <strong className="text-amber-300">
                      Colores de Cursor en Tiempo Real
                    </strong>
                    <p className="text-xs text-cyan-100/85">
                      Cada operador elige su color en la sala o desde el panel de Equipo. Verás el puntero de tus compañeros moverse sobre la máquina para señalar símbolos, botones o mejoras.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {FORTUNARIUM_CURSOR_COLORS.map((c) => (
                        <span
                          key={c.id}
                          style={{ borderColor: c.hex, color: c.hex }}
                          className="px-2.5 py-1 rounded-lg bg-[#040a12] border text-xs font-bold flex items-center gap-1.5"
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
                  <p className="text-xs sm:text-sm text-cyan-100">
                    En el <strong className="text-[#FF2A6D]">Taller del Fortunarium</strong> podéis instalar hasta <strong className="text-amber-300">Nivel 10</strong> en cada mejora permanente pagando con créditos de la Caja Común o con Llaves:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.values(FORTUNARIUM_UPGRADES_CATALOG).map((up) => (
                      <div
                        key={up.id}
                        className="fort-crt-panel p-3 rounded-2xl border border-cyan-500/35 flex items-start gap-3"
                      >
                        <img
                          src={FORTUNARIUM_SYMBOL_ASSETS[up.iconSymbol]}
                          alt={up.name}
                          className="w-10 h-10 object-contain shrink-0"
                        />
                        <div>
                          <div className="text-xs font-black text-[#FF2A6D]">
                            {up.name} (Máx. Nv.{up.maxLevel})
                          </div>
                          <p className="text-[11px] text-cyan-100/85 leading-snug mt-0.5">
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
                    <div className="p-3.5 rounded-2xl bg-emerald-950/35 border border-emerald-400/45 flex flex-col gap-2">
                      <div className="text-base font-fortunarium text-emerald-300">
                        SINERGIAS POSITIVAS (BUFFS)
                      </div>
                      <p className="text-cyan-100">
                        • <strong>Llave + Bomba:</strong> Cada Llave en pantalla (o nivel de Artificiero) desactiva 1 Bomba y la convierte en <strong>+30 CR</strong> de recompensa.
                      </p>
                      <p className="text-cyan-100">
                        • <strong>Trébol + Calavera:</strong> Cada Trébol bloquea la maldición de 1 Calavera en la misma tirada y otorga <strong>+14 CR</strong>.
                      </p>
                      <p className="text-cyan-100">
                        • <strong>3+ Rayos:</strong> Además de subir el Voltaje, otorgan <strong>+1 Tirada Extra</strong> inmediata.
                      </p>
                      <p className="text-amber-200">
                        • <strong>Fortuna Desatada / Mono de la Suerte:</strong> Buffs de probabilidad de <strong>JACKPOT SUPREMO</strong> (base 0.25% → hasta un tope máximo del 1.00% durante las tiradas indicadas).
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/35 border border-rose-500/45 flex flex-col gap-2">
                      <div className="text-base font-fortunarium text-rose-300">
                        PELIGROS Y PENALIZACIONES (DEBUFFS)
                      </div>
                      <p className="text-cyan-100">
                        • <strong>Explosión de Bomba:</strong> Resta <strong>-16% de Integridad</strong> y destruye <strong>-26 CR</strong> del fondo común.
                      </p>
                      <p className="text-cyan-100">
                        • <strong>Corrupción de Calavera:</strong> Absorbe el <strong>20% de la ganancia</strong> de la tirada (mínimo -14 CR) y daña -8% la Integridad.
                      </p>
                      <p className="text-cyan-100">
                        • <strong>Desgaste por Sobrecarga:</strong> Jugar en x2 o x3 consume Integridad en cada giro aunque ganes premios mayores.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Page Navigation (Fixed) */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-[#FF2A6D]/35 bg-[#050b14]/90 flex items-center justify-between">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={handlePrev}
                className="fort-arcade-btn px-3.5 py-2 rounded-xl bg-[#0a1422] hover:bg-[#102036] disabled:opacity-40 border border-cyan-500/45 text-cyan-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === SECTIONS.length - 1}
                onClick={handleNext}
                className="fort-arcade-btn px-4 py-2 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] disabled:opacity-40 border border-pink-200 text-white text-xs font-black flex items-center gap-1.5 shadow-[0_0_16px_rgba(255,42,109,0.4)] cursor-pointer disabled:cursor-not-allowed"
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
