import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  FortunariumActiveModifier,
  FortunariumUpgradeId,
  FortunariumPlayer,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_MODIFIERS_CATALOG,
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_SYMBOLS,
  ALL_UPGRADE_IDS,
  getUpgradeLevelDetails,
  getUpgradeCostMoney,
} from '../../data/fortunarium/fortunariumAssets';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumPaperBoardProps {
  activeModifiers: FortunariumActiveModifier[];
  installedUpgrades: [FortunariumUpgradeId, number][];
  players: FortunariumPlayer[];
  localPlayerId: string;
  onOpenWorkshop?: () => void;
}

type NoteKind = 'efectos' | 'mejoras';

interface NoteOriginTransform {
  deltaX: number;
  deltaY: number;
  scale: number;
  rotateDeg: number;
}

export const FortunariumPaperBoard: React.FC<FortunariumPaperBoardProps> = ({
  activeModifiers,
  installedUpgrades,
  players,
  localPlayerId,
  onOpenWorkshop,
}) => {
  const efectosRef = useRef<HTMLDivElement | null>(null);
  const mejorasRef = useRef<HTMLDivElement | null>(null);
  const compactEfectosRef = useRef<HTMLButtonElement | null>(null);
  const compactMejorasRef = useRef<HTMLButtonElement | null>(null);

  const [inspectedNote, setInspectedNote] = useState<NoteKind | null>(null);
  const [animStage, setAnimStage] = useState<'entering' | 'open' | 'closing'>('open');
  const [originTransform, setOriginTransform] = useState<NoteOriginTransform>({
    deltaX: -340,
    deltaY: 0,
    scale: 0.46,
    rotateDeg: -1.1,
  });
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const computeTransformFromNote = useCallback((kind: NoteKind): NoteOriginTransform => {
    const desktopEl = kind === 'efectos' ? efectosRef.current : mejorasRef.current;
    const compactEl = kind === 'efectos' ? compactEfectosRef.current : compactMejorasRef.current;
    const baseRotate = kind === 'efectos' ? -1.15 : 1.05;

    if (typeof window === 'undefined') {
      return { deltaX: -340, deltaY: 0, scale: 0.46, rotateDeg: baseRotate };
    }

    const activeEl =
      desktopEl && desktopEl.getBoundingClientRect().width > 0 ? desktopEl : compactEl;

    if (!activeEl) {
      return { deltaX: -340, deltaY: 0, scale: 0.46, rotateDeg: baseRotate };
    }

    const rect = activeEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return { deltaX: -340, deltaY: 0, scale: 0.46, rotateDeg: baseRotate };
    }

    const noteCenterX = rect.left + rect.width / 2;
    const noteCenterY = rect.top + rect.height / 2;
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    const targetWidth = Math.min(540, window.innerWidth * 0.92);
    const scale = Math.max(0.32, Math.min(0.72, rect.width / targetWidth));

    return {
      deltaX: Math.round(noteCenterX - viewportCenterX),
      deltaY: Math.round(noteCenterY - viewportCenterY),
      scale: Number(scale.toFixed(3)),
      rotateDeg: baseRotate,
    };
  }, []);

  const handleOpenNote = useCallback(
    (kind: NoteKind) => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      fortunariumAudio.playButtonClick();
      const transform = computeTransformFromNote(kind);
      setOriginTransform(transform);
      setInspectedNote(kind);
      setAnimStage('entering');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimStage('open');
        });
      });
    },
    [computeTransformFromNote]
  );

  const handleCloseNote = useCallback(() => {
    if (!inspectedNote || animStage === 'closing') return;
    fortunariumAudio.playButtonClick();
    const freshTransform = computeTransformFromNote(inspectedNote);
    setOriginTransform(freshTransform);
    setAnimStage('closing');

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setInspectedNote(null);
      setAnimStage('open');
      closeTimerRef.current = null;
    }, 380);
  }, [inspectedNote, animStage, computeTransformFromNote]);

  useEffect(() => {
    if (!inspectedNote) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseNote();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inspectedNote, handleCloseNote]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const getPlayerName = (playerId?: string) => {
    if (!playerId) return null;
    if (playerId === localPlayerId) return 'TÚ';
    const found = players.find((p) => p.id === playerId);
    return found ? found.name.slice(0, 10).toUpperCase() : 'JUG.';
  };

  const getDurationInfo = (mod: FortunariumActiveModifier) => {
    if (mod.durationType === 'UNTIL_TRIGGER') {
      return {
        short: '1 activación',
        badge: '1 ACT',
        full: 'Hasta su próxima activación',
      };
    }
    const spins = mod.spinsRemaining ?? 0;
    return {
      short: `${spins} ${spins === 1 ? 'tirada' : 'tiradas'}`,
      badge: `${spins}G`,
      full: `${spins} ${spins === 1 ? 'tirada restante' : 'tiradas restantes'}`,
    };
  };

  const totalUpgradeSlots = ALL_UPGRADE_IDS.length;
  const isNoteTransformedOut = animStage === 'entering' || animStage === 'closing';

  return (
    <>
      {/* ===================================================================== */}
      {/* WIDE DESKTOP PHYSICAL TAPED PAPER NOTES OVERLAY (100% OUT OF FLOW)    */}
      {/* Never participates in machine flex/grid layout or pushes the cabinet  */}
      {/* ===================================================================== */}
      <aside
        aria-label="Notas físicas de mantenimiento y efectos"
        style={{
          left: 'max(10px, calc(50% - 465px - 246px))',
        }}
        className="left-notes-overlay hidden min-[1380px]:flex flex-col gap-4 w-[234px] fixed top-[62px] z-20 select-none pointer-events-none"
      >
        {/* =================================================================== */}
        {/* PAPER 1: EFECTOS (Temporary Buffs / Debuffs)                        */}
        {/* =================================================================== */}
        <div
          ref={efectosRef}
          role="button"
          tabIndex={0}
          onClick={() => handleOpenNote('efectos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenNote('efectos');
            }
          }}
          title="Haz clic para inspeccionar la nota de Efectos"
          className={`fort-paper-note pointer-events-auto group relative rounded-[3px] px-3.5 pt-4 pb-2.5 text-[#17110b] transform -rotate-[1.15deg] hover:-rotate-[0.3deg] hover:-translate-y-0.5 hover:scale-[1.015] transition-all duration-200 cursor-pointer border border-[#b69d74] ${
            inspectedNote === 'efectos' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Translucent Masking Tape Top Center */}
          <div className="fort-tape -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 rounded-[1px] rotate-[-1.5deg]" />
          {/* Red Push-Pin Top Right */}
          <div className="fort-red-pin top-1.5 right-2.5 w-3 h-3" />

          {/* Paper Header */}
          <div className="border-b-2 border-[#2b2015]/55 pb-1.5 mb-2">
            <div className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#4a3623] leading-none">
              NOTAS TEMPORALES
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-fortunarium text-[17px] font-extrabold uppercase tracking-wide text-[#120d08] leading-none">
                EFECTOS
              </span>
              <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded-[2px] bg-[#1f160e] text-[#fef3c7] tabular-nums leading-none">
                {activeModifiers.length}/4
              </span>
            </div>
          </div>

          {/* Active Modifiers Compact List */}
          {activeModifiers.length === 0 ? (
            <div className="py-2.5 px-1 text-center">
              <p className="text-[12.5px] italic font-bold text-[#3b2c1d] leading-snug">
                — Sin efectos activos en este turno —
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[172px] overflow-y-auto pr-0.5 fort-paper-scroll">
              {activeModifiers.map((mod) => {
                const cat = FORTUNARIUM_MODIFIERS_CATALOG[mod.modifierId];
                const isPos = (cat?.type || mod.type) === 'BUFF';
                const targetLabel = mod.targetPlayerName || getPlayerName(mod.targetPlayerId);
                const dur = getDurationInfo(mod);
                const displayName = (cat?.name || mod.name).toUpperCase();
                const displayEffect = cat?.effect || mod.effect;

                return (
                  <div
                    key={mod.id}
                    className={`px-2 py-1.5 rounded-[2px] border-l-[3px] ${
                      isPos
                        ? 'bg-[#14532d]/[0.11] border-[#14532d]'
                        : 'bg-[#7f1d1d]/[0.12] border-[#7f1d1d]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 leading-tight">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`inline-flex items-center justify-center w-4 h-4 rounded-[2px] text-[10px] font-black shrink-0 ${
                            isPos
                              ? 'bg-[#14532d] text-[#ecfdf5]'
                              : 'bg-[#7f1d1d] text-[#fef2f2]'
                          }`}
                        >
                          {isPos ? '⚡' : '⚠'}
                        </span>
                        <span
                          className={`text-[12px] font-extrabold truncate ${
                            isPos ? 'text-[#0c3b1e]' : 'text-[#691212]'
                          }`}
                        >
                          {displayName}
                        </span>
                      </div>
                      {targetLabel && (
                        <span className="font-mono text-[9px] font-extrabold px-1 rounded bg-[#5c2209]/15 text-[#4a1b07] shrink-0">
                          {targetLabel}
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 pl-5 text-[11px] font-bold text-[#1f160e] leading-snug">
                      <span className="line-clamp-1">{displayEffect}</span>
                      <span className="block text-[10.5px] font-extrabold text-[#4a3623] tabular-nums">
                        · {dur.short}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Inspect Prompt */}
          <div className="mt-2 pt-1.5 border-t border-[#3b2c1d]/30 flex items-center justify-between text-[10px] font-mono font-extrabold text-[#3b2c1d] group-hover:text-[#120d08] transition-colors">
            <span>CLIC PARA INSPECCIONAR</span>
            <span>🔍</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* PAPER 2: MEJORAS INSTALADAS (Permanent Machine Upgrades)            */}
        {/* =================================================================== */}
        <div
          ref={mejorasRef}
          role="button"
          tabIndex={0}
          onClick={() => handleOpenNote('mejoras')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenNote('mejoras');
            }
          }}
          title="Haz clic para inspeccionar la nota de Mejoras Instaladas"
          className={`fort-paper-note-warm pointer-events-auto group relative rounded-[3px] px-3.5 pt-4 pb-2.5 text-[#17110b] transform rotate-[1.05deg] hover:rotate-[0.2deg] hover:-translate-y-0.5 hover:scale-[1.015] transition-all duration-200 cursor-pointer border border-[#b69d74] ${
            inspectedNote === 'mejoras' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Translucent Masking Tape Strips Top Left & Top Right */}
          <div className="fort-tape -top-2.5 left-3 w-12 h-4 rounded-[1px] -rotate-6" />
          <div className="fort-tape -top-2.5 right-3 w-12 h-4 rounded-[1px] rotate-6" />

          {/* Paper Header */}
          <div className="border-b-2 border-[#2b2015]/55 pb-1.5 mb-2">
            <div className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-[#4a3623] leading-none">
              REGISTRO TALLER
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-fortunarium text-[16px] font-extrabold uppercase tracking-wide text-[#120d08] leading-none">
                MEJORAS INSTALADAS
              </span>
              <span className="font-mono text-[11px] font-extrabold px-1.5 py-0.5 rounded-[2px] bg-[#1f160e] text-[#fef3c7] tabular-nums leading-none">
                {installedUpgrades.length}
              </span>
            </div>
          </div>

          {/* Installed Upgrades Compact List */}
          {installedUpgrades.length === 0 ? (
            <div className="py-2.5 px-1 text-center">
              <p className="text-[12.5px] italic font-bold text-[#3b2c1d] leading-snug">
                — Chasis de serie (0 mejoras instaladas) —
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[215px] overflow-y-auto pr-0.5 fort-paper-scroll">
              {installedUpgrades.map(([upId, lv]) => {
                const cat = FORTUNARIUM_UPGRADES_CATALOG[upId];
                if (!cat) return null;
                const symAsset = FORTUNARIUM_SYMBOLS[cat.iconSymbol]?.asset;
                const details = getUpgradeLevelDetails(upId, lv);

                return (
                  <div
                    key={upId}
                    className="px-2 py-1.5 rounded-[2px] bg-[#261b10]/[0.09] border border-[#3b2c1d]/35 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {symAsset && (
                          <img
                            src={symAsset}
                            alt=""
                            className="w-4 h-4 object-contain shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                          />
                        )}
                        <span className="text-[12px] font-extrabold text-[#120d08] uppercase truncate leading-tight">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10.5px] font-extrabold text-[#fef3c7] bg-[#1f160e] px-1.5 py-0.5 rounded-[2px] shrink-0 tabular-nums leading-none">
                        Nv. {lv}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5 pl-5">
                      {details.compactLines.map((line, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10.5px] font-bold text-[#0f4526] leading-tight"
                        >
                          • {line}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Workshop Summary + Inspect Prompt */}
          <div className="mt-2 pt-1.5 border-t border-[#3b2c1d]/30 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10.5px] font-mono font-extrabold text-[#1f160e] tabular-nums">
              <span>TALLER MECÁNICO:</span>
              <span>
                {installedUpgrades.length}/{totalUpgradeSlots}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono font-extrabold text-[#4a3623] group-hover:text-[#120d08] transition-colors">
              <span>CLIC PARA INSPECCIONAR</span>
              <span>🔍</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* NARROW DESKTOP / TABLET / MOBILE COMPACT PAPER TABS                   */}
      {/* Zero horizontal space reserved — machine stays 100% centered          */}
      {/* ===================================================================== */}
      <div
        aria-label="Accesos rápidos a notas de taller"
        className="left-notes-compact-tabs flex min-[1380px]:hidden flex-col sm:flex-row items-start sm:items-center gap-1.5 fixed top-[54px] left-2.5 z-30 pointer-events-auto select-none"
      >
        <button
          ref={compactEfectosRef}
          type="button"
          onClick={() => handleOpenNote('efectos')}
          className="fort-paper-note px-2.5 py-1 rounded-[3px] border border-[#b69d74] text-[#17110b] font-mono text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] transition-transform"
        >
          <span>📄 EFECTOS · {activeModifiers.length}</span>
        </button>

        <button
          ref={compactMejorasRef}
          type="button"
          onClick={() => handleOpenNote('mejoras')}
          className="fort-paper-note-warm px-2.5 py-1 rounded-[3px] border border-[#b69d74] text-[#17110b] font-mono text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] transition-transform"
        >
          <span>🔧 MEJORAS · {installedUpgrades.length}</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ENLARGED PHYSICAL NOTE INSPECTION OVERLAY (FLIP PICK-UP ANIMATION)    */}
      {/* ===================================================================== */}
      {inspectedNote &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              inspectedNote === 'efectos'
                ? 'Nota de efectos activos ampliada'
                : 'Nota de mejoras instaladas ampliada'
            }
            onClick={handleCloseNote}
            className={`fortunarium-root fixed inset-0 z-[88] flex items-center justify-center p-4 sm:p-6 transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] select-none ${
              isNoteTransformedOut
                ? 'bg-black/0 backdrop-blur-0'
                : 'bg-black/60 backdrop-blur-[5px]'
            }`}
          >
            {/* Physical Paper Sheet picked up and held closer to the camera */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(540px, 92vw)',
                maxHeight: '86dvh',
                transform: isNoteTransformedOut
                  ? `translate3d(${originTransform.deltaX}px, ${originTransform.deltaY}px, 0) scale(${originTransform.scale}) rotate(${originTransform.rotateDeg}deg)`
                  : 'translate3d(0px, 0px, 0) scale(1) rotate(-0.25deg)',
                transition:
                  'transform 380ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 380ms cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isNoteTransformedOut
                  ? '0 10px 24px rgba(0,0,0,0.55)'
                  : '0 34px 85px rgba(0,0,0,0.88), 0 8px 24px rgba(0,0,0,0.65)',
              }}
              className={`${
                inspectedNote === 'efectos' ? 'fort-paper-note' : 'fort-paper-note-warm'
              } relative rounded-[4px] px-5 sm:px-7 pt-7 pb-5 text-[#17110b] border-2 border-[#b59c73] flex flex-col will-change-transform`}
            >
              {/* Physical Tape & Pin preserved on the enlarged note */}
              {inspectedNote === 'efectos' ? (
                <>
                  <div className="fort-tape -top-3.5 left-1/2 -translate-x-1/2 w-32 h-7 rounded-[2px] rotate-[-1deg]" />
                  <div className="fort-red-pin top-3 right-4 w-4 h-4" />
                </>
              ) : (
                <>
                  <div className="fort-tape -top-3 left-8 w-24 h-6 rounded-[2px] -rotate-6" />
                  <div className="fort-tape -top-3 right-8 w-24 h-6 rounded-[2px] rotate-6" />
                  <div className="fort-red-pin top-3 left-1/2 -translate-x-1/2 w-4 h-4" />
                </>
              )}

              {/* Note Header */}
              <div className="flex items-start justify-between gap-3 border-b-2 border-[#2b2015] pb-3 mb-3.5">
                <div>
                  <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#4a3724] block">
                    {inspectedNote === 'efectos'
                      ? 'NOTAS TEMPORALES · INSPECCIÓN DE TALLER'
                      : `REGISTRO TALLER · ${installedUpgrades.length}/${totalUpgradeSlots} PIEZAS`}
                  </span>
                  <h3 className="font-fortunarium text-2xl sm:text-3xl font-extrabold text-[#120d08] tracking-wide mt-0.5">
                    {inspectedNote === 'efectos' ? 'EFECTOS ACTIVOS' : 'MEJORAS INSTALADAS'}
                  </h3>
                </div>

                <span className="font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded bg-[#1f160e] text-[#fef3c7] shrink-0 tabular-nums">
                  {inspectedNote === 'efectos'
                    ? `${activeModifiers.length}/4 ACTIVOS`
                    : `${installedUpgrades.length} INSTALADAS`}
                </span>
              </div>

              {/* Scrollable Note Body */}
              <div className="overflow-y-auto pr-1 flex flex-col gap-3 fort-paper-scroll max-h-[58dvh]">
                {inspectedNote === 'efectos' ? (
                  activeModifiers.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center gap-2">
                      <p className="text-lg italic font-extrabold text-[#2b2015]">
                        — No hay efectos ni modificadores temporales activos en este momento —
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-[#3b2c1d] max-w-sm leading-relaxed">
                        Los efectos temporales se anotan aquí cuando se activa la Ruleta de Efectos, el símbolo Misterioso (❓) o eventos de taller.
                      </p>
                    </div>
                  ) : (
                    activeModifiers.map((mod) => {
                      const cat = FORTUNARIUM_MODIFIERS_CATALOG[mod.modifierId];
                      const isPos = (cat?.type || mod.type) === 'BUFF';
                      const targetLabel = mod.targetPlayerName || getPlayerName(mod.targetPlayerId);
                      const dur = getDurationInfo(mod);
                      const displayName = cat?.name || mod.name;
                      const displayEffect = cat?.effect || mod.effect;

                      return (
                        <div
                          key={mod.id}
                          className={`p-3.5 rounded-[3px] border-l-4 border border-[#3b2c1d]/35 ${
                            isPos
                              ? 'bg-[#14532d]/[0.11] border-l-[#14532d]'
                              : 'bg-[#7f1d1d]/[0.12] border-l-[#7f1d1d]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded uppercase ${
                                  isPos
                                    ? 'bg-[#14532d] text-[#ecfdf5]'
                                    : 'bg-[#7f1d1d] text-[#fef2f2]'
                                }`}
                              >
                                {isPos ? '⚡ BONIFICADOR' : '⚠ PENALIZADOR'}
                              </span>
                              <h4 className="font-fortunarium text-lg sm:text-xl font-extrabold text-[#120d08] tracking-wide">
                                {displayName.toUpperCase()}
                              </h4>
                            </div>

                            <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#231910]/15 text-[#120d08] tabular-nums">
                              {dur.full}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-[#1f160e] mt-2 leading-relaxed">
                            {displayEffect}
                          </p>

                          <div className="mt-2 pt-1.5 border-t border-[#3b2c1d]/25 flex items-center justify-between text-xs font-mono font-extrabold text-[#3b2c1d]">
                            <span>Duración base: {cat?.defaultSpins ?? mod.spinsRemaining} tiradas</span>
                            <span>
                              Alcance: {targetLabel ? `Jugador (${targetLabel})` : 'Global (Equipo)'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : installedUpgrades.length === 0 ? (
                  <div className="py-8 text-center flex flex-col items-center gap-2">
                    <p className="text-lg italic font-extrabold text-[#2b2015]">
                      — La máquina opera actualmente con piezas de serie (0 mejoras) —
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-[#3b2c1d] max-w-sm leading-relaxed">
                      Superad cuotas para elegir mejoras gratuitas en equipo o abrid el Taller Mecánico para instalar piezas con créditos o llaves.
                    </p>
                  </div>
                ) : (
                  installedUpgrades.map(([upId, lv]) => {
                    const cat = FORTUNARIUM_UPGRADES_CATALOG[upId];
                    if (!cat) return null;
                    const symAsset = FORTUNARIUM_SYMBOLS[cat.iconSymbol]?.asset;
                    const details = getUpgradeLevelDetails(upId, lv);
                    const nextCostMoney = !details.isMax ? getUpgradeCostMoney(upId, lv) : null;

                    return (
                      <div
                        key={upId}
                        className="p-3.5 rounded-[3px] bg-[#2a1d11]/[0.09] border-2 border-[#3b2c1d]/35 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#3b2c1d]/25 pb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {symAsset && (
                              <div className="w-10 h-10 rounded bg-[#231910]/15 border border-[#3b2c1d]/35 p-1 flex items-center justify-center shrink-0">
                                <img
                                  src={symAsset}
                                  alt={cat.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <h4 className="font-fortunarium text-lg sm:text-xl font-extrabold text-[#120d08] tracking-wide leading-none">
                                {cat.name.toUpperCase()}
                              </h4>
                              <span className="font-mono text-[11px] font-extrabold text-[#4a3724] uppercase">
                                Rareza {cat.rarity} · {cat.effectSummary}
                              </span>
                            </div>
                          </div>

                          <span className="font-mono text-xs sm:text-sm font-extrabold px-2.5 py-1 rounded bg-[#1f160e] text-[#fef3c7] shrink-0 tabular-nums">
                            Nv. {lv} / {cat.maxLevel}
                          </span>
                        </div>

                        {/* Current Live Values & Next Level Comparison */}
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          {details.detailedLines.map((stat, idx) => (
                            <div
                              key={idx}
                              className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs sm:text-[13px]"
                            >
                              <span className="font-extrabold text-[#231910]">{stat.label}:</span>
                              <div className="flex items-center gap-1.5 tabular-nums">
                                <span className="font-extrabold text-[#0f4c29] bg-[#14532d]/15 px-1.5 py-0.5 rounded">
                                  {stat.currentValue}
                                </span>
                                {stat.nextValue && (
                                  <span className="text-[11px] font-extrabold text-[#5c4022]">
                                    (Nv.{lv + 1}: {stat.nextValue})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {!details.isMax && nextCostMoney !== null && (
                          <div className="pt-1.5 border-t border-dashed border-[#3b2c1d]/30 flex items-center justify-between text-[11px] font-mono font-extrabold text-[#3b2c1d]">
                            <span>Coste siguiente nivel (Nv. {lv + 1}):</span>
                            <span className="font-extrabold text-[#120d08] tabular-nums">
                              {nextCostMoney} CR o {cat.keyCost} 🔑 en Taller
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-4 pt-3 border-t-2 border-[#2b2015]/40 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-extrabold text-[#3b2c1d] uppercase tracking-wider">
                  Haz clic fuera o en cerrar para devolver la nota
                </span>

                <div className="flex items-center gap-2">
                  {inspectedNote === 'mejoras' && onOpenWorkshop && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseNote();
                        onOpenWorkshop();
                      }}
                      className="px-3 py-1.5 rounded bg-[#1f160e] hover:bg-[#332417] text-[#fcd34d] font-mono text-xs font-extrabold uppercase tracking-wider cursor-pointer transition shadow"
                    >
                      🔧 Ir al Taller
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseNote();
                    }}
                    className="px-3 py-1.5 rounded bg-[#3b2c1d]/15 hover:bg-[#3b2c1d]/25 border border-[#3b2c1d]/45 text-[#120d08] font-mono text-xs font-extrabold uppercase tracking-wider cursor-pointer transition"
                  >
                    Devolver Nota ↩
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
