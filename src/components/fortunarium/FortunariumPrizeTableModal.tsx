import React, { useState, useMemo } from 'react';
import { X, Trophy, Sparkles, Shapes, Percent, TrendingUp } from 'lucide-react';
import {
  FORTUNARIUM_SYMBOLS,
  FORTUNARIUM_BET_MODES,
  createInitialUpgradesState,
  computeLiveSymbolStats,
  computeEffectiveJackpotChance,
} from '../../data/fortunarium/fortunariumAssets';
import {
  FortunariumUpgradeId,
  FortunariumBetMode,
  FortunariumActiveModifier,
} from '../../types/fortunarium';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumPrizeTableModalProps {
  isOpen?: boolean;
  onClose: () => void;
  upgrades?: Record<FortunariumUpgradeId, number>;
  betMode?: FortunariumBetMode;
  currentVoltage?: number;
  activeModifiers?: FortunariumActiveModifier[];
}

const PATTERN_GEOMETRIES: {
  id: string;
  name: string;
  baseMult: number;
  isJackpotPattern?: boolean;
  rule: string;
  mask: number[][];
}[] = [
  {
    id: 'horizontal',
    name: 'HORIZONTAL (3, 4 o 5)',
    baseMult: 1.0,
    rule: '3, 4 o 5 símbolos iguales contiguos en la misma fila horizontal (p. ej. cols 0-1-2, 1-2-3 o 2-3-4). Solo puntúa la racha máxima de esa fila.',
    mask: [
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
    ],
  },
  {
    id: 'vertical',
    name: 'VERTICAL (×3)',
    baseMult: 1.15,
    rule: 'Los 3 símbolos de una misma columna vertical iguales (cualquiera de las 5 columnas).',
    mask: [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: 'diagonal',
    name: 'DIAGONAL (×3)',
    baseMult: 1.3,
    rule: '3 símbolos iguales en diagonal continua de 3 filas (↘ o ↙) comenzando en col. 1, 2 o 3.',
    mask: [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: 'pat_x',
    name: 'PATRÓN X (5 CASILLAS)',
    baseMult: 3.5,
    rule: 'Las 4 esquinas exteriores más el centro exacto del tablero con el mismo símbolo.',
    mask: [
      [1, 0, 0, 0, 1],
      [0, 0, 1, 0, 0],
      [1, 0, 0, 0, 1],
    ],
  },
  {
    id: 'triangulo',
    name: 'TRIÁNGULO ▲ (8 CASILLAS)',
    baseMult: 8.0,
    rule: 'Cúspide central superior, 2 apoyos medios y las 5 casillas de la base inferior iguales.',
    mask: [
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
    ],
  },
  {
    id: 'triangulo_inv',
    name: 'TRIÁNGULO INVERTIDO ▼ (8 CASILLAS)',
    baseMult: 8.0,
    rule: 'Las 5 casillas superiores, 2 apoyos medios y el vértice central inferior iguales.',
    mask: [
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    id: 'pantalla_completa',
    name: 'PANTALLA COMPLETA / JACKPOT (15 CASILLAS)',
    baseMult: 12.0,
    isJackpotPattern: true,
    rule: 'Las 15 casillas de la cuadrícula 3×5 muestran el mismo símbolo compatible (o con Comodín ⭐). Otorga el multiplicador máximo ×12.0 y activa el Gran Jackpot.',
    mask: [
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
    ],
  },
];

export const FortunariumPrizeTableModal: React.FC<FortunariumPrizeTableModalProps> = ({
  isOpen = true,
  onClose,
  upgrades,
  betMode = 'normal' as FortunariumBetMode,
  currentVoltage = 1.0,
  activeModifiers = [],
}) => {
  const [showLiveMode, setShowLiveMode] = useState<boolean>(true);

  const effectiveUpgrades = useMemo(
    () => upgrades || createInitialUpgradesState(),
    [upgrades]
  );

  const liveSymbolStats = useMemo(
    () =>
      computeLiveSymbolStats(
        effectiveUpgrades,
        betMode,
        currentVoltage,
        activeModifiers
      ),
    [effectiveUpgrades, betMode, currentVoltage, activeModifiers]
  );

  const normalStats = useMemo(
    () => liveSymbolStats.filter((s) => s.category === 'normal'),
    [liveSymbolStats]
  );

  const specialStats = useMemo(
    () => liveSymbolStats.filter((s) => s.category === 'special'),
    [liveSymbolStats]
  );

  const geometraLv = effectiveUpgrades.geometra || 0;
  const geometraMult = 1 + geometraLv * 0.35;

  const liveJackpotChancePct = useMemo(
    () =>
      Number(
        (
          computeEffectiveJackpotChance(effectiveUpgrades, betMode, activeModifiers) * 100
        ).toFixed(2)
      ),
    [effectiveUpgrades, betMode, activeModifiers]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fortunarium-root font-fortunarium fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto select-none"
      onClick={onClose}
    >
      <div
        className="fort-cyber-modal w-full max-w-5xl rounded-2xl p-4 sm:p-6 flex flex-col gap-5 my-auto max-h-[92dvh] overflow-hidden text-cyan-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FF2A6D]/40 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1f0815] border-2 border-[#FF2A6D]/80 flex items-center justify-center text-[#FF2A6D] shadow-[0_0_18px_rgba(255,42,109,0.35)] shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF2A6D] font-bold block">
                TABLA DE SÍMBOLOS, VALOR BASE Y PROBABILIDADES EN TIEMPO REAL
              </span>
              <h2 className="text-2xl sm:text-3xl font-fortunarium text-white tracking-wide">
                TABLA DE PREMIOS · FORTUNARIUM
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle between Live (with upgrades/bet/voltage) and Base values */}
            <div className="inline-flex rounded-xl bg-[#050a14] border border-[#FF2A6D]/45 p-0.5">
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowLiveMode(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition ${
                  showLiveMode
                    ? 'bg-[#FF2A6D] text-white shadow-[0_0_14px_rgba(255,42,109,0.45)]'
                    : 'text-cyan-200/80 hover:text-white'
                }`}
              >
                ⚡ En Vivo ({FORTUNARIUM_BET_MODES[betMode].shortLabel} · {currentVoltage.toFixed(2)}x)
              </button>
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowLiveMode(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition ${
                  !showLiveMode
                    ? 'bg-[#FF2A6D] text-white shadow-[0_0_14px_rgba(255,42,109,0.45)]'
                    : 'text-cyan-200/80 hover:text-white'
                }`}
              >
                Base (×1.0)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                fortunariumAudio.playButtonClick();
                onClose();
              }}
              className="fort-arcade-btn p-2 rounded-xl bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/65 text-[#FF2A6D] hover:text-white cursor-pointer"
              title="Cerrar Tabla de Premios"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-6">
          {/* ================================================================= */}
          {/* 1. SYMBOLS / BASE VALUE / PERCENTAGE TABLE                        */}
          {/* ================================================================= */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#FF2A6D]">
                <Percent className="w-4 h-4" />
                <span>
                  1. Símbolos Normales — Símbolo · Valor Base · Probabilidad (%)
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-cyan-200/85">
                {showLiveMode
                  ? 'Mostrando valores base y probabilidades con tus mejoras activas'
                  : 'Mostrando valores base y probabilidades de serie'}
              </span>
            </div>

            {/* Structured CRT Table (3 Columns: SÍMBOLO & MEJORAS | VALOR BASE | PROBABILIDAD %) */}
            <div className="fort-crt-display rounded-2xl border border-cyan-400/45 overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-[#0a1828]/90 border-b border-cyan-500/35 text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider text-cyan-300">
                <div className="col-span-5 sm:col-span-6">SÍMBOLO &amp; MEJORAS</div>
                <div className="col-span-4 sm:col-span-3 text-center">VALOR BASE</div>
                <div className="col-span-3 text-right">PROBABILIDAD %</div>
              </div>

              <div className="divide-y divide-cyan-500/20">
                {normalStats.map((sym) => {
                  const canonicalBase = Number.isFinite(Number(sym.baseSymbolValue))
                    ? Number(sym.baseSymbolValue)
                    : FORTUNARIUM_SYMBOLS[sym.id]?.baseSymbolValue ?? 0;
                  const liveBase = Number.isFinite(Number(sym.liveBaseSymbolValue))
                    ? Number(sym.liveBaseSymbolValue)
                    : Number.isFinite(Number(sym.liveSymbolBaseValue))
                    ? Number(sym.liveSymbolBaseValue)
                    : canonicalBase;
                  const baseVal = showLiveMode ? liveBase : canonicalBase;
                  const probPct = showLiveMode
                    ? sym.liveProbabilityPct
                    : sym.baseProbabilityPct;
                  const isValueModified =
                    showLiveMode &&
                    (liveBase !== canonicalBase ||
                      sym.upgradePayoutMult > 1.001 ||
                      sym.totalPayoutMult > 1.001);
                  const hasUpgradeBoost = showLiveMode && sym.upgradePayoutMult > 1.001;
                  const isProbBoosted = showLiveMode && sym.isProbabilityModified;
                  const probDelta = isProbBoosted ? sym.probabilityDeltaPct : 0;
                  const formattedProb =
                    probPct < 1 ? `${probPct.toFixed(2)}%` : `${probPct.toFixed(1)}%`;

                  const isMono = sym.id === 'siete';

                  return (
                    <div
                      key={sym.id}
                      className={`grid grid-cols-12 gap-3 px-4 py-3 items-center transition-colors ${
                        isValueModified || isProbBoosted
                          ? 'bg-[#0b1f33]/75'
                          : 'hover:bg-[#091726]/60'
                      }`}
                    >
                      {/* Column 1: Symbol Icon + Name + Active Upgrade Tags */}
                      <div className="col-span-5 sm:col-span-6 flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-[#07111d] border border-cyan-400/50 p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                          <img
                            src={sym.asset}
                            alt={sym.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-fortunarium text-base sm:text-lg tracking-wide truncate leading-tight ${
                                isMono ? 'fort-mono-rainbow font-black' : 'text-white'
                              }`}
                            >
                              {sym.name.toUpperCase()}
                            </span>
                            {hasUpgradeBoost && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-mono font-black text-emerald-300 tabular-nums">
                                +{Math.round((sym.upgradePayoutMult - 1) * 100)}%
                              </span>
                            )}
                          </div>
                          {isMono ? (
                            <span className="text-[10px] font-mono font-bold text-amber-300/90 tracking-wider uppercase truncate leading-tight">
                              ★ SÍMBOLO NORMAL MÁS VALIOSO
                              {showLiveMode && sym.activeUpgradeSources.length > 0
                                ? ` · 🔧 ${sym.activeUpgradeSources.join(' · ')}`
                                : ''}
                            </span>
                          ) : (
                            showLiveMode &&
                            sym.activeUpgradeSources.length > 0 && (
                              <span className="text-[11px] font-mono font-bold text-[#FF2A6D] truncate leading-tight">
                                🔧 {sym.activeUpgradeSources.join(' · ')}
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      {/* Column 2: Large Readable Canonical Base Symbol Value */}
                      <div className="col-span-4 sm:col-span-3 flex flex-col items-center justify-center font-mono tabular-nums">
                        <div
                          className={`inline-flex items-baseline gap-1 px-3 py-1 rounded-xl border ${
                            isValueModified
                              ? 'bg-emerald-950/85 border-emerald-400/70 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)]'
                              : 'bg-[#050d17] border-amber-400/55 text-amber-300'
                          }`}
                        >
                          <span className="text-lg sm:text-2xl font-black leading-none tracking-tight">
                            {baseVal}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold opacity-90">
                            CR
                          </span>
                        </div>
                        {isValueModified ? (
                          <span className="text-[10px] font-bold text-emerald-300/90 mt-1 tracking-wide">
                            ↑ MODIFICADO · BASE {canonicalBase} CR
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-cyan-300/65 mt-1 tracking-wider uppercase">
                            VALOR BASE
                          </span>
                        )}
                      </div>

                      {/* Column 3: Probability Percentage */}
                      <div className="col-span-3 flex flex-col items-end justify-center font-mono tabular-nums">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isProbBoosted && Math.abs(probDelta) >= 0.01 && (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                probDelta > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                  : 'bg-amber-500/15 text-amber-200 border border-amber-400/30'
                              }`}
                            >
                              {probDelta > 0 ? `▲ +${probDelta}%` : `▼ ${probDelta}%`}
                            </span>
                          )}
                          <span className="text-base sm:text-lg font-black text-white">
                            {formattedProb}
                          </span>
                        </div>

                        {/* Subtle visual probability bar */}
                        <div className="w-20 sm:w-28 h-1.5 rounded-full bg-[#030810] border border-cyan-500/30 overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isProbBoosted ? 'bg-emerald-400' : 'bg-[#FF2A6D]'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, probPct * 5.0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* 2. SPECIAL SYMBOLS TABLE (Símbolo · Efecto/Valor · Probabilidad)  */}
          {/* ================================================================= */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#FF2A6D]">
                <Sparkles className="w-4 h-4" />
                <span>
                  2. Símbolos Especiales — Símbolo · Valor / Efecto · Probabilidad (%)
                </span>
              </div>
              <span className="fort-crt-display px-3 py-1 rounded-lg border border-amber-400/50 text-xs font-mono font-black text-amber-300 tabular-nums">
                Prob. Jackpot Directo: {liveJackpotChancePct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {specialStats.map((sym) => {
                const meta = FORTUNARIUM_SYMBOLS[sym.id];
                const isHazard = sym.id === 'bomba' || sym.id === 'calavera';
                const probPct = showLiveMode
                  ? sym.liveProbabilityPct
                  : sym.baseProbabilityPct;
                const isProbBoosted = showLiveMode && sym.isProbabilityModified;
                const probDelta = isProbBoosted ? sym.probabilityDeltaPct : 0;
                const formattedProb =
                  probPct < 1 ? `${probPct.toFixed(2)}%` : `${probPct.toFixed(1)}%`;

                return (
                  <div
                    key={sym.id}
                    className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 ${
                      isHazard
                        ? 'bg-[#240b12]/90 border-rose-500/65 shadow-[inset_0_0_16px_rgba(244,63,94,0.15)]'
                        : 'fort-crt-panel border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-11 h-11 rounded-xl p-1.5 flex items-center justify-center shrink-0 border ${
                          isHazard
                            ? 'bg-[#140509] border-rose-500/50'
                            : 'bg-[#050d17] border-cyan-400/45'
                        }`}
                      >
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-fortunarium text-sm text-white tracking-wide truncate">
                            {sym.name.toUpperCase()}
                          </span>
                          <span className="font-mono text-xs font-black text-amber-300 tabular-nums shrink-0">
                            {formattedProb}
                          </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {sym.specialLiveValueLabel && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-black ${
                                isHazard
                                  ? 'bg-rose-950 text-rose-200 border border-rose-400/50'
                                  : 'bg-[#05141c] text-emerald-300 border border-emerald-400/40'
                              }`}
                            >
                              {sym.specialLiveValueLabel}
                            </span>
                          )}
                          {isProbBoosted && Math.abs(probDelta) >= 0.01 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9.5px] font-black tabular-nums">
                              {probDelta > 0 ? `+${probDelta}%` : `${probDelta}%`}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-cyan-100/80 leading-snug mt-1 font-sans">
                          {meta.shortDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================= */}
          {/* 3. CANONICAL WINNING PATTERNS (Including Full-Grid Jackpot 15/15) */}
          {/* ================================================================= */}
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#FF2A6D]">
                <Shapes className="w-4 h-4" />
                <span>3. Geometría Canónica de Patrones Ganadores (Cuadrícula 3×5)</span>
              </div>
              {geometraLv > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 font-mono text-xs font-black text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                  El Geómetra Nv.{geometraLv}: +{geometraLv * 35}% en patrones no horizontales
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PATTERN_GEOMETRIES.map((pat) => {
                const liveMult =
                  pat.id === 'horizontal'
                    ? pat.baseMult
                    : Number((pat.baseMult * (showLiveMode ? geometraMult : 1)).toFixed(2));
                const isBoosted = showLiveMode && pat.id !== 'horizontal' && geometraLv > 0;

                return (
                  <div
                    key={pat.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 ${
                      pat.isJackpotPattern
                        ? 'bg-gradient-to-br from-[#230918] via-[#130c1c] to-[#081624] border-[#FF2A6D] shadow-[0_0_24px_rgba(255,42,109,0.28)] sm:col-span-2 lg:col-span-3'
                        : 'fort-crt-panel border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-fortunarium text-sm sm:text-base text-white tracking-wide">
                          {pat.name}
                        </span>
                        {pat.isJackpotPattern && (
                          <span className="px-2 py-0.5 rounded bg-[#FF2A6D] text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-[0_0_10px_rgba(255,42,109,0.5)]">
                            🏆 GRAN JACKPOT 15/15
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-black tabular-nums ${
                          pat.isJackpotPattern
                            ? 'bg-amber-400 text-slate-950'
                            : isBoosted
                            ? 'bg-emerald-950 border border-emerald-400 text-emerald-300'
                            : 'bg-[#1a0914] border border-[#FF2A6D]/60 text-pink-200'
                        }`}
                      >
                        ×{liveMult}
                        {pat.isJackpotPattern ? ' + JACKPOT' : ''}
                      </span>
                    </div>

                    <div
                      className={`flex ${
                        pat.isJackpotPattern
                          ? 'flex-col sm:flex-row items-center gap-4'
                          : 'flex-col gap-2'
                      }`}
                    >
                      {/* Visual 3x5 Grid Diagram */}
                      <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-[#040a12] border border-cyan-500/35 w-fit mx-auto shrink-0">
                        {pat.mask.map((row, rIdx) =>
                          row.map((cell, cIdx) => (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className={`w-6 h-5 rounded ${
                                cell === 1
                                  ? pat.isJackpotPattern
                                    ? 'bg-amber-400 border border-yellow-100 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                                    : 'bg-[#FF2A6D] border border-pink-200 shadow-[0_0_8px_rgba(255,42,109,0.75)]'
                                  : 'bg-[#0b1929]/55 border border-cyan-500/20'
                              }`}
                            />
                          ))
                        )}
                      </div>

                      <p className="text-[11px] sm:text-xs text-cyan-100/85 leading-snug font-sans">
                        {pat.rule}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#FF2A6D]/35 shrink-0">
          <span className="text-xs text-cyan-100/85 font-bold font-sans">
            💡 El Comodín ⭐ sustituye cualquier símbolo normal y añade +25% al premio del patrón.
          </span>
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onClose();
            }}
            className="fort-arcade-btn px-5 py-2 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-fortunarium text-sm tracking-wider shadow-[0_0_20px_rgba(255,42,109,0.4)] cursor-pointer"
          >
            VOLVER A LA MÁQUINA
          </button>
        </div>
      </div>
    </div>
  );
};
