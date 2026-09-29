import React, { useEffect, useRef, useState } from 'react';
import { FortunariumActiveModifier } from '../../types/fortunarium';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { X } from 'lucide-react';

interface FortunariumPaperBoardProps {
  activeModifiers: FortunariumActiveModifier[];
  installedUpgradesCount: number;
  effectiveJackpotChance?: number;
  onOpenWorkshop?: () => void;
}

export const FortunariumPaperBoard: React.FC<FortunariumPaperBoardProps> = ({
  activeModifiers,
  installedUpgradesCount,
  effectiveJackpotChance = 0.0025,
  onOpenWorkshop,
}) => {
  const prevCountRef = useRef<number>(activeModifiers.length);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeModifiers.length > prevCountRef.current) {
      fortunariumAudio.playPaperTapeNote();
    }
    prevCountRef.current = activeModifiers.length;
  }, [activeModifiers.length]);

  const renderPaperSheet = (isModal = false) => (
    <div
      className={`fortunarium-root font-fortunarium relative rounded-sm px-3.5 py-3.5 text-[#241b11] shadow-[0_16px_34px_rgba(0,0,0,0.82),inset_0_0_28px_rgba(166,128,76,0.34)] border-2 border-[#b89f74] ${
        isModal ? 'w-72' : 'w-54 -rotate-[1.5deg]'
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
        className="absolute -top-2.5 left-2.5 w-15 h-4 -rotate-6 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{
          background: 'rgba(239, 224, 184, 0.88)',
        }}
      />
      {/* Top-Right Masking Tape Strip */}
      <div
        className="absolute -top-2 right-2.5 w-13 h-4 rotate-7 pointer-events-none shadow-xs border border-[#cbb486]/80"
        style={{
          background: 'rgba(239, 224, 184, 0.88)',
        }}
      />

      {/* Brass Thumbtack / Pin at Top Center */}
      <div className="mx-auto -mt-1.5 mb-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#fef08a] via-[#d99b26] to-[#613f11] border border-[#2b1a06] shadow-[0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#fffbeb]/70" />
      </div>

      {/* Stamped Maintenance Header */}
      <div className="border-b-2 border-dashed border-[#7c6342]/70 pb-1.5 mb-2 flex items-center justify-between">
        <div>
          <span className="block font-mono text-[8px] font-black tracking-widest text-[#7a2e1d] uppercase">
            HOJA DE REVISIÓN #84
          </span>
          <span className="font-fortunarium text-xs tracking-wider text-[#2e2012] uppercase">
            NOTAS DE LA MÁQUINA
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

      {/* Active Temporary Modifiers List (Max 3 data points per item: Name, Short Value, Spins) */}
      {activeModifiers.length === 0 ? (
        <div className="py-2.5 px-2 text-center border border-dashed border-[#8c7352]/45 rounded-xs bg-[#efe2c6]/45">
          <p className="text-[11px] font-mono font-bold italic text-[#5c4730] leading-snug">
            — Sin anomalías ni parches activos —
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
                    ? `${mod.name}: Prob. Base 0.25% → Actual ${currentJackpotPct}% (Máx 1.00%) · ${mod.spinsRemaining} tiradas restantes`
                    : `${mod.name}: ${mod.effect} (${mod.spinsRemaining} tiradas restantes)`
                }
                className={`animate-fort-note-slap relative rounded-xs px-2 py-1.5 border-l-4 border text-left shadow-xs ${
                  idx % 2 === 0 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]'
                } ${
                  isJackpotBuff
                    ? 'bg-[#fef3c7] border-[#b45309] text-[#451a03]'
                    : isBuff
                    ? 'bg-[#e3f2e4] border-[#1b5e20] text-[#113314]'
                    : 'bg-[#fae1e1] border-[#991b1b] text-[#450a0a]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-fortunarium text-[11px] tracking-wide leading-tight truncate">
                    {mod.name}
                  </span>
                  <span className="text-[9px] font-mono font-extrabold tabular-nums shrink-0 px-1 py-0.2 rounded-xs bg-black/12 border border-black/15">
                    {mod.spinsRemaining}T
                  </span>
                </div>
                <div className="text-[10px] font-mono font-bold opacity-90 leading-tight mt-0.5">
                  {mod.effect}
                </div>
                {isJackpotBuff && (
                  <div className="text-[9px] font-mono font-black text-amber-900 mt-0.5 tabular-nums">
                    Jackpot: 0.25% → {currentJackpotPct}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Workshop Permanent Parts Stamp */}
      {onOpenWorkshop && (
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onOpenWorkshop();
          }}
          className="mt-2.5 w-full pt-1.5 border-t-2 border-dashed border-[#7c6342]/55 flex items-center justify-between text-[10px] font-mono font-black text-[#3b2712] hover:text-[#140d06] cursor-pointer transition"
        >
          <span>PIEZAS INSTALADAS:</span>
          <span className="px-1.5 py-0.5 rounded-xs bg-[#3b2b1a]/15 border border-[#7c6342]/50 tabular-nums">
            {installedUpgradesCount} 🔧
          </span>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* WIDE DESKTOP (>= 1360px): Absolute overlay anchored to the left of the centered machine (28px gap), NEVER affecting layout */}
      <aside
        className="hidden min-[1360px]:block absolute top-6 right-[calc(100%+28px)] z-20 select-none pointer-events-auto"
        aria-label="Notas de la máquina"
      >
        {renderPaperSheet(false)}
      </aside>

      {/* MEDIUM & MOBILE (< 1360px): Compact pinned paper tab that opens the note as an overlay without moving the machine */}
      <div className="min-[1360px]:hidden fixed left-2.5 top-16 z-30 select-none">
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
          <span>📋 EFECTOS</span>
          <span className="px-1.5 py-0.2 rounded bg-[#3b2b1a]/15 font-mono text-[10px] font-extrabold tabular-nums">
            {activeModifiers.length}
          </span>
        </button>

        {mobileOpen && (
          <div className="mt-2 animate-fort-note-slap">
            {renderPaperSheet(true)}
          </div>
        )}
      </div>
    </>
  );
};
