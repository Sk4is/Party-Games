import React, { useEffect, useRef, useState } from 'react';
import { FortunariumActiveModifier, FortunariumUpgradeId } from '../../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  FortunariumUpgradeCatalogItem,
} from '../../data/fortunarium/fortunariumAssets';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { X, Wrench, Sparkles } from 'lucide-react';

export interface InstalledUpgradeItem {
  id: FortunariumUpgradeId;
  level: number;
  meta: FortunariumUpgradeCatalogItem;
}

interface FortunariumPaperBoardProps {
  activeModifiers: FortunariumActiveModifier[];
  installedUpgradesCount: number;
  installedUpgrades?: InstalledUpgradeItem[];
  effectiveJackpotChance?: number;
  onOpenWorkshop?: () => void;
}

export const FortunariumPaperBoard: React.FC<FortunariumPaperBoardProps> = ({
  activeModifiers,
  installedUpgradesCount,
  installedUpgrades = [],
  effectiveJackpotChance = 0.0025,
  onOpenWorkshop,
}) => {
  const prevModifiersCountRef = useRef<number>(activeModifiers.length);
  const prevUpgradesCountRef = useRef<number>(installedUpgrades.length);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'effects' | 'upgrades'>('upgrades');

  useEffect(() => {
    if (activeModifiers.length > prevModifiersCountRef.current) {
      fortunariumAudio.playPaperTapeNote();
    }
    prevModifiersCountRef.current = activeModifiers.length;
  }, [activeModifiers.length]);

  useEffect(() => {
    if (installedUpgrades.length > prevUpgradesCountRef.current) {
      fortunariumAudio.playPaperTapeNote();
    }
    prevUpgradesCountRef.current = installedUpgrades.length;
  }, [installedUpgrades.length]);

  // =========================================================================
  // PAPER 1: TEMPORARY ACTIVE EFFECTS (BUFFS / DEBUFFS)
  // =========================================================================
  const renderEffectsPaperSheet = (isModal = false) => (
    <div
      className={`fortunarium-root font-fortunarium relative rounded-xs px-3.5 py-3.5 text-[#241b11] shadow-[0_16px_34px_rgba(0,0,0,0.82),inset_0_0_28px_rgba(166,128,76,0.34)] border-2 border-[#b89f74] ${
        isModal ? 'w-72' : 'w-56 -rotate-[1.4deg]'
      }`}
      style={{
        background:
          'radial-gradient(circle at 82% 18%, rgba(138, 102, 56, 0.16) 0%, transparent 45%), linear-gradient(168deg, #f5ecd7 0%, #e9d7b6 56%, #dcc297 100%)',
      }}
    >
      {/* Subtle folded corner & workshop smudge */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-[#a88c5e] via-[#cbb183] to-transparent pointer-events-none opacity-80" />

      {/* Top-Left Masking Tape Strip */}
      <div
        className="absolute -top-2.5 left-2.5 w-14 h-3.5 -rotate-6 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{ background: 'rgba(239, 224, 184, 0.88)' }}
      />
      {/* Top-Right Masking Tape Strip */}
      <div
        className="absolute -top-2 right-2.5 w-12 h-3.5 rotate-7 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{ background: 'rgba(239, 224, 184, 0.88)' }}
      />

      {/* Brass Pin at Top Center */}
      <div className="mx-auto -mt-1.5 mb-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#fef08a] via-[#d99b26] to-[#613f11] border border-[#2b1a06] shadow-[0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#fffbeb]/70" />
      </div>

      {/* Header */}
      <div className="border-b-2 border-dashed border-[#7c6342]/70 pb-1 mb-2 flex items-center justify-between">
        <div>
          <span className="block font-mono text-[8px] font-black tracking-widest text-[#7a2e1d] uppercase">
            NOTAS TEMPORALES
          </span>
          <span className="font-fortunarium text-xs tracking-wider text-[#2e2012] uppercase">
            EFECTOS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-xs bg-[#3b2b1a]/15 border border-[#7c6342]/50 text-[#3b2b1a] tabular-nums">
            {activeModifiers.length}/4
          </span>
          {isModal && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-0.5 rounded bg-[#3b2b1a]/15 text-[#3b2b1a] hover:bg-[#3b2b1a]/25 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Modifiers List */}
      {activeModifiers.length === 0 ? (
        <div className="py-2 px-2 text-center border border-dashed border-[#8c7352]/45 rounded-xs bg-[#efe2c6]/45">
          <p className="text-[10px] font-mono font-bold italic text-[#5c4730] leading-snug">
            — Sin efectos activos —
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeModifiers.map((mod, idx) => {
            const isBuff = mod.type === 'BUFF';
            const isJackpotBuff =
              mod.id === 'fortuna_desatada' || mod.id === 'siete_suerte';
            const currentJackpotPct = (effectiveJackpotChance * 100).toFixed(2);
            return (
              <div
                key={mod.id}
                title={
                  isJackpotBuff
                    ? `${mod.name}: Prob. Base 0.25% → Actual ${currentJackpotPct}% · ${mod.spinsRemaining}T restantes`
                    : `${mod.name}: ${mod.effect} (${mod.spinsRemaining}T restantes)`
                }
                className={`animate-fort-note-slap relative rounded-xs px-2 py-1 border-l-3 border text-left shadow-2xs ${
                  idx % 2 === 0 ? 'rotate-[0.3deg]' : '-rotate-[0.3deg]'
                } ${
                  isJackpotBuff
                    ? 'bg-[#fef3c7] border-[#b45309] text-[#451a03]'
                    : isBuff
                    ? 'bg-[#e3f2e4] border-[#1b5e20] text-[#113314]'
                    : 'bg-[#fae1e1] border-[#991b1b] text-[#450a0a]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-fortunarium text-[10px] tracking-wide leading-tight truncate">
                    {mod.name}
                  </span>
                  <span className="text-[8px] font-mono font-extrabold tabular-nums shrink-0 px-1 py-0.2 rounded-xs bg-black/12 border border-black/15">
                    {mod.spinsRemaining}T
                  </span>
                </div>
                <div className="text-[9px] font-mono font-bold opacity-90 leading-tight mt-0.5 truncate">
                  {mod.effect}
                </div>
                {isJackpotBuff && (
                  <div className="text-[8px] font-mono font-black text-amber-900 mt-0.5 tabular-nums">
                    Jackpot: {currentJackpotPct}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // =========================================================================
  // PAPER 2: PERMANENT PURCHASED MACHINE UPGRADES (BUG 4)
  // =========================================================================
  const renderUpgradesPaperSheet = (isModal = false) => (
    <div
      className={`fortunarium-root font-fortunarium relative rounded-xs px-3.5 py-3.5 text-[#241b11] shadow-[0_16px_34px_rgba(0,0,0,0.82),inset_0_0_28px_rgba(166,128,76,0.34)] border-2 border-[#b89f74] ${
        isModal ? 'w-72' : 'w-56 rotate-[1.3deg]'
      }`}
      style={{
        background:
          'radial-gradient(circle at 18% 82%, rgba(138, 102, 56, 0.16) 0%, transparent 45%), linear-gradient(172deg, #f7eedc 0%, #ebdcc0 56%, #dec6a0 100%)',
      }}
    >
      {/* Subtle folded corner & workshop smudge */}
      <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-bl from-[#a88c5e] via-[#cbb183] to-transparent pointer-events-none opacity-80" />

      {/* Top-Left Masking Tape Strip */}
      <div
        className="absolute -top-2.5 left-3 w-13 h-3.5 rotate-4 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{ background: 'rgba(239, 224, 184, 0.88)' }}
      />
      {/* Top-Right Masking Tape Strip */}
      <div
        className="absolute -top-2 right-3 w-14 h-3.5 -rotate-5 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{ background: 'rgba(239, 224, 184, 0.88)' }}
      />

      {/* Brass Pin at Top Center */}
      <div className="mx-auto -mt-1.5 mb-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#fef08a] via-[#d99b26] to-[#613f11] border border-[#2b1a06] shadow-[0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#fffbeb]/70" />
      </div>

      {/* Header */}
      <div className="border-b-2 border-dashed border-[#7c6342]/70 pb-1 mb-2 flex items-center justify-between">
        <div>
          <span className="block font-mono text-[8px] font-black tracking-widest text-[#7a2e1d] uppercase">
            REGISTRO TALLER
          </span>
          <span className="font-fortunarium text-xs tracking-wider text-[#2e2012] uppercase">
            MEJORAS INSTALADAS
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-xs bg-[#3b2b1a]/15 border border-[#7c6342]/50 text-[#3b2b1a] tabular-nums">
            {installedUpgrades.length}
          </span>
        </div>
      </div>

      {/* Upgrades List */}
      {installedUpgrades.length === 0 ? (
        <div className="py-3 px-2 text-center border border-dashed border-[#8c7352]/45 rounded-xs bg-[#efe2c6]/45">
          <p className="text-[10px] font-mono font-bold italic text-[#5c4730] leading-snug">
            — Ninguna mejora instalada —
          </p>
          <span className="text-[9px] font-mono text-[#7a6449] mt-0.5 block">
            Adquiérelas en Taller o al superar la Cuota
          </span>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
          {installedUpgrades.map((item, idx) => {
            const symAsset = FORTUNARIUM_SYMBOLS[item.meta.iconSymbol]?.asset;
            return (
              <div
                key={item.id}
                className={`group relative rounded-xs px-2 py-1.5 border border-[#8c7352]/40 bg-[#f4ebd4]/80 hover:bg-[#fff9ea] transition-all shadow-2xs ${
                  idx % 2 === 0 ? '-rotate-[0.3deg]' : 'rotate-[0.3deg]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {symAsset && (
                      <img
                        src={symAsset}
                        alt={item.meta.name}
                        className="w-4 h-4 object-contain shrink-0"
                      />
                    )}
                    <span className="font-fortunarium text-[10px] text-[#2e2012] tracking-wide truncate">
                      {item.meta.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded-xs bg-[#3b2b1a]/15 border border-[#7c6342]/40 text-[#2e2012] tabular-nums shrink-0">
                    Nv. {item.level}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-[#5c4730] truncate mt-0.5 leading-tight">
                  {item.meta.effectSummary}
                </div>

                {/* Hover / Tap tooltip with authoritative details */}
                <div className="pointer-events-none absolute left-full top-0 ml-2 w-52 p-2.5 rounded-lg bg-[#141d24]/95 border-2 border-[#d99b26] text-[#fef3c7] shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 text-left">
                  <div className="text-[11px] font-fortunarium text-[#fde047] uppercase tracking-wider">
                    {item.meta.name} · Nv. {item.level}
                  </div>
                  <div className="text-[10px] font-mono text-[#e5d5be] mt-1 leading-snug">
                    {item.meta.description}
                  </div>
                  <div className="text-[9px] font-mono text-[#fde047]/85 mt-1 border-t border-stone-700/60 pt-1 flex items-center justify-between">
                    <span>Nivel {item.level} de {item.meta.maxLevel}</span>
                    <span className="text-emerald-400 font-bold">Permanente ✓</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Button to open workshop */}
      {onOpenWorkshop && (
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onOpenWorkshop();
          }}
          className="mt-2.5 w-full pt-1.5 border-t-2 border-dashed border-[#7c6342]/55 flex items-center justify-between text-[10px] font-mono font-black text-[#3b2712] hover:text-[#140d06] cursor-pointer transition"
        >
          <span className="flex items-center gap-1">
            <Wrench className="w-3 h-3 text-[#7a2e1d]" />
            <span>TALLER MECÁNICO:</span>
          </span>
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3b2b1a]/15 border border-[#7c6342]/50 tabular-nums">
            {installedUpgradesCount} 🔧
          </span>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* ===================================================================== */}
      {/* WIDE DESKTOP (>= 1360px): Stacked vertical papers on the LEFT rail    */}
      {/* Absolute overlay anchored to left of machine (28px gap).              */}
      {/* NEVER PARTICIPATES IN MACHINE CENTERING LAYOUT.                       */}
      {/* ===================================================================== */}
      <aside
        className="hidden min-[1360px]:flex flex-col gap-4 absolute top-2 right-[calc(100%+28px)] z-20 select-none pointer-events-auto"
        aria-label="Notas y Mejoras de la máquina"
      >
        {renderEffectsPaperSheet(false)}
        {renderUpgradesPaperSheet(false)}
      </aside>

      {/* ===================================================================== */}
      {/* MEDIUM & MOBILE (< 1360px): Compact pinned tab overlay                */}
      {/* ===================================================================== */}
      <div className="min-[1360px]:hidden fixed left-2.5 top-14 z-30 select-none">
        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            setMobileOpen((v) => !v);
          }}
          className="px-2.5 py-1.5 rounded-md border border-[#c5ae87] shadow-lg text-[#261d13] font-fortunarium text-xs tracking-wider flex items-center gap-1.5 cursor-pointer"
          style={{
            background:
              'linear-gradient(165deg, #f6eedc 0%, #eadbc0 58%, #dfc9a3 100%)',
          }}
        >
          <span>📋 NOTAS</span>
          <span className="px-1.5 py-0.2 rounded bg-[#3b2b1a]/15 font-mono text-[10px] font-extrabold tabular-nums">
            {activeModifiers.length + installedUpgrades.length}
          </span>
        </button>

        {mobileOpen && (
          <div className="mt-2 flex flex-col gap-2 max-h-[82dvh] overflow-y-auto pr-1 animate-fort-note-slap">
            {/* Mobile Tab Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-900/90 border border-stone-700 shadow-md">
              <button
                type="button"
                onClick={() => setActiveTabMobile('upgrades')}
                className={`flex-1 py-1 px-2 rounded font-fortunarium text-[11px] cursor-pointer transition ${
                  activeTabMobile === 'upgrades'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
              >
                MEJORAS ({installedUpgrades.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMobile('effects')}
                className={`flex-1 py-1 px-2 rounded font-fortunarium text-[11px] cursor-pointer transition ${
                  activeTabMobile === 'effects'
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
              >
                EFECTOS ({activeModifiers.length})
              </button>
            </div>

            {activeTabMobile === 'upgrades'
              ? renderUpgradesPaperSheet(true)
              : renderEffectsPaperSheet(true)}
          </div>
        )}
      </div>
    </>
  );
};
