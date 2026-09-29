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
      className={`fortunarium-root font-fortunarium relative rounded-md px-3.5 py-3 text-[#261d13] shadow-[0_14px_32px_rgba(0,0,0,0.75),inset_0_0_24px_rgba(180,145,95,0.28)] border border-[#c5ae87] ${
        isModal ? 'w-72' : 'w-52 -rotate-1'
      }`}
      style={{
        background:
          'linear-gradient(165deg, #f6eedc 0%, #eadbc0 58%, #dfc9a3 100%)',
      }}
    >
      {/* Top-Left Masking Tape Strip */}
      <div
        className="absolute -top-2.5 left-3 w-14 h-4 -rotate-6 pointer-events-none shadow-xs border border-[#d6c39a]/70"
        style={{
          background: 'rgba(236, 220, 182, 0.85)',
        }}
      />
      {/* Top-Right Masking Tape Strip */}
      <div
        className="absolute -top-2 right-3 w-12 h-4 rotate-6 pointer-events-none shadow-xs border border-[#d6c39a]/70"
        style={{
          background: 'rgba(236, 220, 182, 0.85)',
        }}
      />

      {/* Brass Thumbtack at Top Center */}
      <div className="mx-auto -mt-1 mb-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-800 border border-amber-950 shadow" />

      {/* Header */}
      <div className="border-b-2 border-dashed border-[#8c7352]/60 pb-1.5 mb-2 flex items-center justify-between">
        <span className="font-fortunarium text-xs tracking-wider text-[#3b2b1a] uppercase">
          NOTAS DE LA MÁQUINA
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#3b2b1a]/12 text-[#4a3620] tabular-nums">
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
        <div className="py-2 text-center">
          <p className="text-[11px] italic text-[#5c4730] leading-snug">
            Sin efectos activos.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {activeModifiers.map((mod) => {
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
                className={`animate-fort-note-slap relative rounded px-2 py-1.5 border text-left shadow-xs ${
                  isJackpotBuff
                    ? 'bg-amber-100 border-amber-600/65 text-amber-950'
                    : isBuff
                    ? 'bg-[#e7f5e8] border-[#2e7d32]/45 text-[#143d18]'
                    : 'bg-[#fbe7e7] border-[#b71c1c]/45 text-[#4a1212]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-fortunarium text-[11px] tracking-wide leading-tight truncate">
                    {mod.name}
                  </span>
                  <span className="text-[9px] font-mono font-extrabold tabular-nums shrink-0 px-1 py-0.2 rounded bg-black/10">
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
          className="mt-2 w-full pt-1.5 border-t border-[#8c7352]/40 flex items-center justify-between text-[10px] font-mono font-bold text-[#4a3620] hover:text-[#1e140a] cursor-pointer transition"
        >
          <span>PIEZAS CHASIS:</span>
          <span className="px-1.5 py-0.5 rounded bg-[#3b2b1a]/15 tabular-nums">
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
