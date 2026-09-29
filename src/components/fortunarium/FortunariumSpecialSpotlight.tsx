import React from 'react';
import {
  FortunariumSpecialEffectLog,
  FortunariumUpgradeId,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_SYMBOL_ASSETS,
  FORTUNARIUM_UPGRADES_CATALOG,
} from '../../data/fortunarium/fortunariumAssets';

interface FortunariumSpecialSpotlightProps {
  activeEffect: FortunariumSpecialEffectLog | null;
  installedUpgradeToast: FortunariumUpgradeId | null;
}

export const FortunariumSpecialSpotlight: React.FC<
  FortunariumSpecialSpotlightProps
> = ({ activeEffect, installedUpgradeToast }) => {
  return (
    <>
      {/* Special Symbol Sequential Spotlight Overlay inside Reel Frame */}
      {activeEffect && (
        <div
          className="pointer-events-none absolute inset-x-3 bottom-2.5 z-30 flex items-center justify-center animate-modal-pop-in"
          aria-live="polite"
        >
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 shadow-[0_14px_34px_rgba(0,0,0,0.88)] backdrop-blur-md ${
              activeEffect.symbolId === 'bomba'
                ? 'bg-rose-950/95 border-rose-400 text-rose-100'
                : activeEffect.symbolId === 'calavera'
                ? 'bg-purple-950/95 border-purple-400 text-purple-100'
                : activeEffect.symbolId === 'rayo'
                ? 'bg-cyan-950/95 border-cyan-300 text-cyan-100'
                : activeEffect.symbolId === 'llave' ||
                  activeEffect.symbolId === 'synergy'
                ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
                : activeEffect.symbolId === 'moneda'
                ? 'bg-amber-950/95 border-amber-300 text-amber-100'
                : 'bg-indigo-950/95 border-amber-300 text-amber-100'
            }`}
          >
            {/* Canonical Symbol Icon */}
            <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/15 flex items-center justify-center shrink-0 p-1">
              <img
                src={
                  activeEffect.symbolId === 'synergy'
                    ? FORTUNARIUM_SYMBOL_ASSETS.llave
                    : FORTUNARIUM_SYMBOL_ASSETS[activeEffect.symbolId]
                }
                alt={activeEffect.title}
                className="w-full h-full object-contain drop-shadow"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-fortunarium text-sm sm:text-base tracking-wide uppercase">
                  {activeEffect.title}
                </span>
                {activeEffect.moneyDelta !== 0 && (
                  <span
                    className={`font-mono text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded tabular-nums ${
                      activeEffect.moneyDelta > 0
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                        : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                    }`}
                  >
                    {activeEffect.moneyDelta > 0
                      ? `+${activeEffect.moneyDelta} CR`
                      : `${activeEffect.moneyDelta} CR`}
                  </span>
                )}
                {activeEffect.integrityDelta !== 0 && (
                  <span
                    className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded tabular-nums ${
                      activeEffect.integrityDelta > 0
                        ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40'
                        : 'bg-orange-500/30 text-orange-200 border border-orange-400/40'
                    }`}
                  >
                    {activeEffect.integrityDelta > 0
                      ? `+${activeEffect.integrityDelta}% INT`
                      : `${activeEffect.integrityDelta}% INT`}
                  </span>
                )}
                {activeEffect.voltageDelta !== 0 && (
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/25 text-cyan-200 border border-cyan-300/40 tabular-nums">
                    +{activeEffect.voltageDelta.toFixed(2)}x VOLT
                  </span>
                )}
                {activeEffect.keysDelta > 0 && (
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-300/40 tabular-nums">
                    +{activeEffect.keysDelta} LLAVE
                  </span>
                )}
              </div>
              <p className="text-[11px] font-mono opacity-90 leading-snug mt-0.5">
                {activeEffect.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Installation Physical Plate Toast (Section 25) */}
      {installedUpgradeToast &&
        FORTUNARIUM_UPGRADES_CATALOG[installedUpgradeToast] && (
          <div className="pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-modal-pop-in">
            <div className="px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#2b1f12] to-[#171008] border-2 border-amber-400 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-stone-950 border border-amber-500/40 p-1 flex items-center justify-center shrink-0">
                <img
                  src={
                    FORTUNARIUM_SYMBOL_ASSETS[
                      FORTUNARIUM_UPGRADES_CATALOG[installedUpgradeToast].iconSymbol
                    ]
                  }
                  alt={FORTUNARIUM_UPGRADES_CATALOG[installedUpgradeToast].name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300 font-bold">
                  🔧 MEJORA INSTALADA EN CHASIS
                </div>
                <div className="font-fortunarium text-base text-amber-100 tracking-wide">
                  {FORTUNARIUM_UPGRADES_CATALOG[installedUpgradeToast].name}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
