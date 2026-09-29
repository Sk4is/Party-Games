import React, { useState } from 'react';
import { X, Trophy, Sparkles, Grid } from 'lucide-react';
import {
  FORTUNARIUM_SYMBOLS,
  NORMAL_SYMBOLS_BY_VALUE_DESC,
  SPECIAL_SYMBOL_IDS,
  FORTUNARIUM_PATTERNS_CATALOG,
} from '../../data/fortunarium/fortunariumAssets';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumPrizeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoltage?: number;
}

export const FortunariumPrizeTableModal: React.FC<FortunariumPrizeTableModalProps> = ({
  isOpen,
  onClose,
  currentVoltage = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'normales' | 'especiales' | 'patrones'>('normales');

  if (!isOpen) return null;

  const switchTab = (tab: 'normales' | 'especiales' | 'patrones') => {
    fortunariumAudio.playButtonClick();
    setActiveTab(tab);
  };

  return (
    <div
      className="fortunarium-root font-fortunarium fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-[#132a34] border-[3px] border-[#b98532] p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.12)] flex flex-col gap-4 my-auto text-amber-50 max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8c6b32] pb-3">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#f4d06f]">
              PLACA TÉCNICA DE PAGOS · VOLTAJE ACTUAL x{currentVoltage.toFixed(2)}
            </span>
            <h2 className="text-2xl sm:text-3xl font-fortunarium text-[#fff3d6] tracking-wide">
              TABLA DE PREMIOS
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-lg bg-[#0a181f] border-2 border-[#6e5223]">
              <button
                type="button"
                onClick={() => switchTab('normales')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'normales'
                    ? 'bg-[#d99b26] text-stone-950 shadow font-black border border-[#fef08a]'
                    : 'text-[#d9e5e3] hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>NORMALES (12)</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab('especiales')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'especiales'
                    ? 'bg-[#d99b26] text-stone-950 shadow font-black border border-[#fef08a]'
                    : 'text-[#d9e5e3] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ESPECIALES (7)</span>
              </button>
              <button
                type="button"
                onClick={() => switchTab('patrones')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'patrones'
                    ? 'bg-[#d99b26] text-stone-950 shadow font-black border border-[#fef08a]'
                    : 'text-[#d9e5e3] hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>PATRONES</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="fort-arcade-btn p-2 rounded-lg bg-[#2b1a14] hover:bg-[#3d251d] border-2 border-[#b98532] text-[#f4d06f] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1 flex-1">
          {/* TAB 1: NORMALES (ORDERED HIGHEST TO LOWEST VALUE) */}
          {activeTab === 'normales' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span>
                  Ordenados de <strong className="text-amber-300">MAYOR VALOR</strong> a{' '}
                  <strong className="text-stone-300">MENOR VALOR</strong> (pagos base antes de multiplicadores).
                </span>
                <span className="hidden sm:inline font-mono text-amber-300/90">
                  3× / 4× / 5× iguales en patrón
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {NORMAL_SYMBOLS_BY_VALUE_DESC.map((symId, index) => {
                  const sym = FORTUNARIUM_SYMBOLS[symId];
                  const isTopTier = index < 4;

                  return (
                    <div
                      key={sym.id}
                      className={`p-3.5 rounded-xl border-2 flex flex-col justify-between gap-2.5 transition-all shadow-[inset_0_2px_0_rgba(255,255,255,0.1)] ${
                        isTopTier
                          ? 'bg-gradient-to-b from-[#2b2012] via-[#1c3842] to-[#132933] border-[#d99b26] shadow-lg'
                          : 'bg-[#193640] border-[#8c6b32]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-[#f4ead2] border-2 border-[#8c6b32] p-1.5 flex items-center justify-center shrink-0 shadow-inner">
                          <img
                            src={sym.asset}
                            alt={sym.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-base font-fortunarium text-[#fff3d6] tracking-wide truncate">
                              {sym.name.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#c2d6d3]">
                              #{index + 1}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              sym.tier >= 4
                                ? 'text-[#f4d06f]'
                                : sym.tier === 3
                                ? 'text-sky-300'
                                : sym.tier === 2
                                ? 'text-[#7ae582]'
                                : 'text-[#c2d6d3]'
                            }`}
                          >
                            {sym.tier >= 4
                              ? 'Legendario'
                              : sym.tier === 3
                              ? 'Muy Valioso'
                              : sym.tier === 2
                              ? 'Intermedio'
                              : 'Común'}
                          </span>
                        </div>
                      </div>

                      {/* 3x / 4x / 5x Payout Table */}
                      <div className="p-2.5 rounded-lg bg-[#081318] border border-[#6e5223] grid grid-cols-3 gap-1 text-center font-mono">
                        <div>
                          <span className="text-[10px] text-[#9eb8b4] block">3×</span>
                          <span className="text-xs sm:text-sm font-black text-amber-200 tabular-nums">
                            {sym.basePayout3} CR
                          </span>
                        </div>
                        <div className="border-x border-[#3b525c]">
                          <span className="text-[10px] text-[#9eb8b4] block">4×</span>
                          <span className="text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                            {sym.basePayout4} CR
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#9eb8b4] block">5×</span>
                          <span className="text-xs sm:text-sm font-black text-[#f4d06f] tabular-nums">
                            {sym.basePayout5} CR
                          </span>
                        </div>
                      </div>

                      {/* Only show specialProperty if relevant */}
                      {sym.specialProperty && (
                        <div className="px-2.5 py-1.5 rounded-md bg-[#2b1d0e] border border-[#b98532] text-[11px] font-medium text-[#f4d06f] leading-tight">
                          {sym.specialProperty}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ESPECIALES (SEPARATED & CLEARLY EXPLAINED) */}
          {activeTab === 'especiales' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                <strong>Importante:</strong> A diferencia de las frutas y joyas normales, los símbolos especiales (salvo el Comodín en línea){' '}
                <strong className="text-white underline">
                  se activan con UNA SOLA aparición
                </strong>{' '}
                en cualquier casilla de la ventana 3×5.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPECIAL_SYMBOL_IDS.map((symId) => {
                  const sym = FORTUNARIUM_SYMBOLS[symId];
                  const isHazard = symId === 'bomba' || symId === 'calavera';

                  return (
                    <div
                      key={sym.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                        isHazard
                          ? 'bg-rose-950/25 border-rose-500/40'
                          : 'bg-stone-900/90 border-amber-500/30'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-stone-950 border border-amber-500/30 p-2 flex items-center justify-center shrink-0 shadow-md">
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-lg font-fortunarium text-white tracking-wide">
                            {sym.name.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isHazard
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {sym.activationRule || 'SE ACTIVA CON 1 APARICIÓN'}
                          </span>
                        </div>

                        <p className="text-xs text-stone-200 leading-relaxed">
                          {sym.shortDesc}
                        </p>

                        {sym.id === 'comodin' && (
                          <div className="mt-1 text-[11px] font-mono text-amber-300 tabular-nums">
                            Sustituye a cualquier símbolo normal en los 6 patrones oficiales (+25% bono por Comodín).
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PATRONES (VISUAL MINIATURE 3x5 SLOT GRIDS) */}
          {activeTab === 'patrones' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-stone-200">
                <strong className="text-amber-300">Regla Oficial de Patrones:</strong>{' '}
                <strong className="text-white underline">
                  Todas las casillas marcadas deben contener el mismo símbolo compatible
                </strong>{' '}
                (el Comodín puede sustituir a cualquier símbolo normal otorgando +25% de bono).
                En líneas horizontales se paga la cadena máxima contigua (3, 4 o 5).
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FORTUNARIUM_PATTERNS_CATALOG.map((pat) => {
                  const cellSet = new Set(pat.cells.map((c) => `${c.col},${c.row}`));

                  return (
                    <div
                      key={pat.id}
                      className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-base font-fortunarium text-amber-300 tracking-wide">
                            {pat.name.toUpperCase()}
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-xs font-mono font-black text-amber-300 tabular-nums">
                            x{pat.baseMultiplier}
                          </span>
                        </div>

                        {/* Visual Miniature 3x5 Grid */}
                        <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 grid grid-cols-5 gap-1.5 mb-2.5">
                          {[0, 1, 2, 3, 4].map((col) => (
                            <div key={col} className="grid grid-rows-3 gap-1.5">
                              {[0, 1, 2].map((row) => {
                                const active = cellSet.has(`${col},${row}`);
                                return (
                                  <div
                                    key={row}
                                    className={`h-5 rounded flex items-center justify-center transition-all ${
                                      active
                                        ? 'bg-amber-400 border border-yellow-200 shadow-[0_0_8px_rgba(251,191,36,0.65)]'
                                        : 'bg-stone-900 border border-stone-800/80'
                                    }`}
                                  >
                                    {active && (
                                      <span className="w-2 h-2 rounded-full bg-stone-950" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-stone-200 leading-snug">
                          {pat.geometryDesc}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-800/80 flex flex-col gap-1 text-[11px]">
                        <div className="text-amber-300 font-semibold">{pat.payoutDesc}</div>
                        <div className="text-stone-400">
                          Comodín:{' '}
                          <strong className="text-stone-200">
                            {pat.allowsWild
                              ? 'Sí completa el patrón (+25% bono)'
                              : 'No aplica en agrupación dispersa'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
