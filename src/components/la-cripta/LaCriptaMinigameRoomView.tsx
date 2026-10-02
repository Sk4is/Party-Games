import React, { useEffect, useRef, useState } from 'react';
import {
  CriptaDungeonDefinition,
  CriptaDungeonRoom,
  CriptaMinigameFamilyId,
  CriptaPlayer,
  CriptaRoomMinigameState,
} from '../../types/laCripta';
import {
  CRIPTA_MINIGAME_REGISTRY,
  getBiomeMinigameFlavor,
} from '../../data/la-cripta/criptaMinigames';
import { LaCriptaStatusEffectBadge } from './LaCriptaStatusEffectBadge';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

export interface LaCriptaMinigameStageArtProps {
  room: CriptaDungeonRoom;
  dungeon: CriptaDungeonDefinition;
  minigame: CriptaRoomMinigameState;
  players: CriptaPlayer[];
  currentPlayerId: string;
}

/**
 * Left-side Encounter Stage Interactive Visual Mechanism for all 10 Minigame Families.
 * Uses smooth 60 FPS requestAnimationFrame for roulette rotation, pulse rings, and beam glow.
 */
export const LaCriptaMinigameStageArt: React.FC<LaCriptaMinigameStageArtProps> = ({
  dungeon,
  minigame,
}) => {
  const family: CriptaMinigameFamilyId =
    minigame.family ||
    (minigame.minigameType === 'ALCHEMICAL_BALANCE'
      ? 'ALCHEMICAL_BALANCE'
      : minigame.minigameType === 'TRAP_STEPPING'
      ? 'PRESSURE_SIGILS'
      : minigame.minigameType === 'LOCKPICK_TIMING'
      ? 'ECLIPSE_PULSE'
      : 'RUNIC_MEMORY');

  const flavor = getBiomeMinigameFlavor(dungeon.id);
  const wheelDomRef = useRef<HTMLDivElement | null>(null);
  const needleDomRef = useRef<HTMLDivElement | null>(null);
  const currentAngleRef = useRef<number>(
    minigame.rouletteLandingAngleDeg || 0
  );
  const [pulsePhase, setPulsePhase] = useState<number>(50);
  const [activeFlashStep, setActiveFlashStep] = useState<number>(-1);
  const lastTickSectorRef = useRef<number>(-1);

  // 1. 60 FPS Roulette Deceleration Animation via direct DOM transform (0 React state re-renders per frame)
  useEffect(() => {
    if (family !== 'CURSED_ROULETTE') return;
    const targetAngle = minigame.rouletteLandingAngleDeg ?? 0;
    const spinStartedAt = minigame.rouletteSpinStartedAt;
    if (!spinStartedAt) {
      currentAngleRef.current = targetAngle;
      if (wheelDomRef.current) {
        wheelDomRef.current.style.transform = `rotate(${targetAngle}deg)`;
      }
      return;
    }

    const durationMs = 2600;
    const startTime = performance.now();
    const startAngle = 0;
    const sectorsCount = (minigame.rouletteSectors || []).length || 8;
    const degPerSector = 360 / sectorsCount;
    let rafId = 0;

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, Math.max(0, elapsed / durationMs));
      // Smooth cubic-out deceleration curve (60 FPS)
      const easeOut = 1 - Math.pow(1 - t, 3.4);
      const currentDeg = startAngle + (targetAngle - startAngle) * easeOut;
      currentAngleRef.current = currentDeg;

      if (wheelDomRef.current) {
        wheelDomRef.current.style.transform = `rotate(${currentDeg.toFixed(2)}deg)`;
      }

      const currentSectorTick = Math.floor(currentDeg / degPerSector);
      if (currentSectorTick !== lastTickSectorRef.current && t < 0.98) {
        lastTickSectorRef.current = currentSectorTick;
        laCriptaAudio.playRouletteTick();
        if (needleDomRef.current) {
          needleDomRef.current.style.transform = 'translateX(-50%) rotate(-14deg)';
          window.setTimeout(() => {
            if (needleDomRef.current) {
              needleDomRef.current.style.transform = 'translateX(-50%) rotate(0deg)';
            }
          }, 55);
        }
      }

      if (t < 1) {
        rafId = window.requestAnimationFrame(animateWheel);
      } else {
        if (wheelDomRef.current) {
          wheelDomRef.current.style.transform = `rotate(${targetAngle}deg)`;
        }
        const landedIdx = minigame.rouletteLandedSectorIndex ?? 0;
        const landedSec = minigame.rouletteSectors?.[landedIdx];
        laCriptaAudio.playRouletteResult(Boolean(landedSec?.isPositive));
      }
    };

    rafId = window.requestAnimationFrame(animateWheel);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    family,
    minigame.rouletteSpinStartedAt,
    minigame.rouletteLandingAngleDeg,
    minigame.rouletteLandedSectorIndex,
    minigame.rouletteSectors,
  ]);

  // 2. 60 FPS Smooth Pulse / Timing Oscillation for ECLIPSE_PULSE
  useEffect(() => {
    if (family !== 'ECLIPSE_PULSE' || minigame.completed) return;
    let rafId = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsedSec = (now - start) / 1000;
      // Smooth sine wave oscillating 8..92 at 60 FPS
      const wave = 50 + Math.sin(elapsedSec * 2.7) * 42;
      setPulsePhase(wave);
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [family, minigame.completed]);

  // 3. Periodic Rune Sequence Preview Flash for RUNIC_MEMORY
  useEffect(() => {
    if (family !== 'RUNIC_MEMORY' || minigame.completed) return;
    const seq = minigame.targetSequence || minigame.targetPattern || [0, 1, 2, 3];
    let idx = 0;
    const timer = window.setInterval(() => {
      if (idx < seq.length) {
        setActiveFlashStep(seq[idx]);
      } else {
        setActiveFlashStep(-1);
      }
      idx = (idx + 1) % (seq.length + 2);
    }, 680);
    return () => window.clearInterval(timer);
  }, [family, minigame.completed, minigame.targetSequence, minigame.targetPattern]);

  const isCompleted = Boolean(minigame.completed);
  const isSuccess = Boolean(minigame.succeeded);

  return (
    <div className="relative w-full max-w-[330px] flex flex-col items-center justify-center select-none">
      {/* Status Banner Pill Above Stage Artifact */}
      <div
        className={`mb-2 px-3 py-1 border text-[9px] font-cripta-pixel font-bold uppercase tracking-widest transition-all ${
          isCompleted
            ? isSuccess
              ? 'bg-[#12291D] border-[#5EA87A] text-[#8EE6AE] shadow-[0_0_16px_rgba(94,168,122,0.4)]'
              : 'bg-[#2A1019] border-[#C93B5B] text-[#FF8FA3]'
            : 'bg-[#150E22]/95 border-[#E7A54A] text-[#FFD166]'
        }`}
      >
        {isCompleted
          ? isSuccess
            ? '✦ MECANISMO RESUELTO CON ÉXITO ✦'
            : '✦ MECANISMO ACTIVADO CON PENALIZACIÓN ✦'
          : `✦ ${CRIPTA_MINIGAME_REGISTRY[family]?.categoryLabel || 'DESAFÍO ACTIVO'} · ${flavor.biomeTitlePrefix} ✦`}
      </div>

      {/* =====================================================================
          VISUAL ARTIFACT BY MINIGAME FAMILY
          ===================================================================== */}
      {family === 'CURSED_ROULETTE' && (
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Top Golden Pointer Needle with 60fps tick deflection */}
          <div
            ref={needleDomRef}
            className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-transform duration-75 origin-top"
          >
            <svg width="24" height="24" viewBox="0 0 16 16" shapeRendering="crispEdges">
              <rect x="6" y="1" width="4" height="3" fill="#E7A54A" />
              <rect x="5" y="4" width="6" height="4" fill="#FFD166" />
              <rect x="6" y="8" width="4" height="4" fill="#FFF3C4" />
              <rect x="7" y="12" width="2" height="3" fill={flavor.accentColor} />
            </svg>
          </div>

          {/* 60 FPS GPU-Accelerated Rotating Wheel */}
          <div
            ref={wheelDomRef}
            className="w-52 h-52 rounded-full border-4 bg-[#0F0A18] relative overflow-hidden"
            style={{
              borderColor: flavor.accentColor || '#E7A54A',
              boxShadow: `0 0 36px ${flavor.accentColor || '#E7A54A'}55`,
              transform: `rotate(${currentAngleRef.current}deg)`,
              willChange: 'transform',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {(minigame.rouletteSectors || []).map((sec, idx, arr) => {
                const count = arr.length || 8;
                const startDeg = (idx * 360) / count - 90 - 360 / count / 2;
                const endDeg = startDeg + 360 / count;
                const startRad = (startDeg * Math.PI) / 180;
                const endRad = (endDeg * Math.PI) / 180;
                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);
                const midRad = ((startDeg + endDeg) / 2) * (Math.PI / 180);
                const labelX = 50 + 31 * Math.cos(midRad);
                const labelY = 50 + 31 * Math.sin(midRad);

                return (
                  <g key={sec.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={idx % 2 === 0 ? '#181124' : '#231834'}
                      stroke={flavor.accentColor || '#E7A54A'}
                      strokeWidth="0.8"
                    />
                    <circle
                      cx={labelX}
                      cy={labelY}
                      r="5.5"
                      fill={sec.color}
                      opacity="0.92"
                    />
                  </g>
                );
              })}
              <circle
                cx="50"
                cy="50"
                r="13"
                fill="#0D0914"
                stroke="#FFD166"
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="5" fill={flavor.accentColor || '#E7A54A'} />
            </svg>
          </div>
        </div>
      )}

      {family === 'CRYPT_LOCK' && (
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Top Zenith Alignment Marker */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 bg-[#1B1328] border border-[#FFD166] text-[8px] font-cripta-pixel text-[#FFD166]">
            ▼ CENIT 0° ▼
          </div>
          {[0, 1, 2].map((ringIdx) => {
            const angle = minigame.lockRingAngles?.[ringIdx] ?? 0;
            const aligned = angle % 360 === 0;
            const sizePx = ringIdx === 0 ? 204 : ringIdx === 1 ? 148 : 94;
            return (
              <div
                key={ringIdx}
                className={`absolute rounded-full border-4 flex items-start justify-center transition-transform duration-300 ${
                  aligned
                    ? 'border-[#5EA87A] bg-[#12261C]/50 shadow-[0_0_16px_rgba(94,168,122,0.4)]'
                    : 'border-[#4A3B5C] bg-[#140E20]/80'
                }`}
                style={{
                  width: sizePx,
                  height: sizePx,
                  transform: `rotate(${angle}deg)`,
                }}
              >
                {/* Golden Notch at 0 deg */}
                <div
                  className={`w-3.5 h-5 -mt-1 border ${
                    aligned
                      ? 'bg-[#8EE6AE] border-[#FFF3C4]'
                      : 'bg-[#FFD166] border-[#E7A54A]'
                  }`}
                />
              </div>
            );
          })}
          <div className="relative z-10 w-10 h-10 rounded-full bg-[#09070E] border-2 border-[#FFD166] flex items-center justify-center text-[9px] font-cripta-pixel font-bold text-[#FFD166]">
            {(minigame.lockRingAngles || []).filter((a) => a % 360 === 0).length}/3
          </div>
        </div>
      )}

      {family === 'ECLIPSE_PULSE' && (
        <div className="relative w-56 h-56 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border-2 border-[#3E2F4B] bg-[#0B0812]/90 flex items-center justify-center overflow-hidden">
            {/* Sweet Spot Golden Ring */}
            <div className="absolute w-28 h-28 rounded-full border-4 border-[#FFD166]/80 bg-[#E7A54A]/10 shadow-[0_0_20px_rgba(255,209,102,0.3)]" />
            {/* 60 FPS Contracting / Expanding Pulse Ring */}
            <div
              className="absolute rounded-full border-2 border-[#7BDFF2] shadow-[0_0_14px_#7BDFF2] pointer-events-none"
              style={{
                width: `${Math.round(24 + pulsePhase * 1.6)}%`,
                height: `${Math.round(24 + pulsePhase * 1.6)}%`,
              }}
            />
            <div className="relative z-10 text-center">
              <div className="text-[9px] font-cripta-pixel text-[#FFD166] uppercase">
                SELLO {(minigame.currentStep || 0) + 1}/{minigame.maxSteps || 3}
              </div>
              <div className="text-xs font-cripta-display font-black text-[#F5EFE6]">
                {pulsePhase >= 32 && pulsePhase <= 68 ? '¡AHORA!' : 'ESPERA...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {(family === 'RUNIC_MEMORY' ||
        family === 'PRESSURE_SIGILS' ||
        family === 'ALCHEMICAL_BALANCE' ||
        family === 'SOUL_CHAINS' ||
        family === 'SHADOW_MIRRORS' ||
        family === 'COOP_GAMBLE_CHEST' ||
        family === 'FORBIDDEN_COFFERS') && (
        <div className="w-56 h-52 bg-[#0D0916]/90 border-2 border-[#3E2F4B] p-3 flex flex-col items-center justify-between shadow-[0_8px_28px_rgba(0,0,0,0.85)]">
          {/* Pixel-Art Altar / Mechanism SVG */}
          <svg
            viewBox="0 0 64 48"
            shapeRendering="crispEdges"
            className="w-44 h-36 select-none"
          >
            {/* Pedestal Base */}
            <rect x="8" y="40" width="48" height="6" fill="#231934" />
            <rect x="12" y="36" width="40" height="4" fill="#382952" />

            {family === 'RUNIC_MEMORY' && (
              <g>
                <rect x="22" y="6" width="20" height="30" fill="#2B1F42" />
                <rect x="25" y="9" width="14" height="24" fill="#181126" />
                {[0, 1, 2, 3, 4, 5].map((rIdx) => {
                  const col = rIdx % 2;
                  const row = Math.floor(rIdx / 2);
                  const isFlashing = activeFlashStep === rIdx;
                  const isDone = (minigame.playerInputs || []).includes(rIdx);
                  return (
                    <rect
                      key={rIdx}
                      x={27 + col * 6}
                      y={11 + row * 7}
                      width="4"
                      height="5"
                      fill={
                        isFlashing
                          ? '#FFD166'
                          : isDone
                          ? '#5EA87A'
                          : flavor.accentColor
                      }
                      opacity={isFlashing || isDone ? 1 : 0.45}
                    />
                  );
                })}
              </g>
            )}

            {family === 'ALCHEMICAL_BALANCE' && (
              <g>
                {/* Alchemical Cauldron & Gauge */}
                <rect x="18" y="14" width="28" height="22" fill="#1F2937" />
                <rect x="21" y="17" width="22" height="16" fill="#111827" />
                <rect
                  x="21"
                  y={33 - Math.round(((minigame.alchemicalMeter ?? 25) / 100) * 16)}
                  width="22"
                  height={Math.round(((minigame.alchemicalMeter ?? 25) / 100) * 16)}
                  fill={
                    (minigame.alchemicalMeter ?? 25) >= 70 &&
                    (minigame.alchemicalMeter ?? 25) <= 86
                      ? '#5EA87A'
                      : '#9B72CF'
                  }
                />
                <rect x="26" y="8" width="4" height="4" fill="#8EE6AE" />
                <rect x="34" y="6" width="3" height="3" fill="#FFD166" />
              </g>
            )}

            {family === 'SOUL_CHAINS' && (
              <g>
                {[0, 1, 2, 3].map((cIdx) => {
                  const broken = minigame.chainsBroken?.[cIdx];
                  const isWeak = (minigame.chainsWeakIndices || []).includes(cIdx);
                  const isTrap = minigame.chainsTrapIndex === cIdx;
                  const x = 14 + cIdx * 11;
                  return (
                    <g key={cIdx}>
                      {!broken && (
                        <>
                          <rect
                            x={x}
                            y="6"
                            width="4"
                            height="30"
                            fill={
                              isWeak
                                ? '#FFD166'
                                : isTrap
                                ? '#C93B5B'
                                : '#64748B'
                            }
                          />
                          {isWeak && (
                            <rect x={x + 1} y="18" width="2" height="4" fill="#FFF3C4" />
                          )}
                        </>
                      )}
                    </g>
                  );
                })}
              </g>
            )}

            {family === 'SHADOW_MIRRORS' && (
              <g>
                {/* Source Crystal Left -> 4 Mirrors -> Target Crystal Right */}
                <rect x="6" y="18" width="6" height="10" fill="#FFD166" />
                <rect x="52" y="18" width="6" height="10" fill="#7BDFF2" />
                <rect
                  x="12"
                  y="22"
                  width="40"
                  height="2"
                  fill={minigame.mirrorTargetLit ? '#FFD166' : '#9B72CF'}
                />
                {[0, 1, 2, 3].map((mIdx) => {
                  const aligned =
                    minigame.mirrorOrientations?.[mIdx] ===
                    minigame.mirrorSolution?.[mIdx];
                  return (
                    <rect
                      key={mIdx}
                      x={16 + mIdx * 9}
                      y="16"
                      width="5"
                      height="14"
                      fill={aligned ? '#5EA87A' : '#4A3B5C'}
                    />
                  );
                })}
              </g>
            )}

            {(family === 'PRESSURE_SIGILS' ||
              family === 'COOP_GAMBLE_CHEST' ||
              family === 'FORBIDDEN_COFFERS') && (
              <g>
                {/* Ornate Coffer / Altar */}
                <rect x="16" y="14" width="32" height="22" fill="#4A2E1B" />
                <rect x="16" y="12" width="32" height="4" fill="#E7A54A" />
                <rect x="16" y="23" width="32" height="2" fill="#E7A54A" />
                <rect x="29" y="20" width="6" height="8" fill="#FFD166" />
              </g>
            )}
          </svg>

          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0] uppercase text-center">
            {family === 'RUNIC_MEMORY' && activeFlashStep >= 0
              ? `DESTELLO RÚNICO: ${flavor.runeNames[activeFlashStep]}`
              : `${dungeon.name} · ${flavor.biomeTitlePrefix}`}
          </div>
        </div>
      )}
    </div>
  );
};

export interface LaCriptaMinigameControlBoardProps {
  room: CriptaDungeonRoom;
  dungeon: CriptaDungeonDefinition;
  minigame: CriptaRoomMinigameState;
  players: CriptaPlayer[];
  currentPlayerId: string;
  partyGold: number;
  iAmDead: boolean;
  onPuzzleInput: (actionCode: number) => void;
  onPresentationBusyChange?: (busy: boolean) => void;
}

/**
 * Right-side Interactive Control Board for all 10 Minigame Families.
 * Sequences Roulette spins and Puzzle mistake consequences before revealing results.
 */
export const LaCriptaMinigameControlBoard: React.FC<
  LaCriptaMinigameControlBoardProps
> = ({
  dungeon,
  minigame,
  partyGold,
  iAmDead,
  onPuzzleInput,
  onPresentationBusyChange,
}) => {
  const family: CriptaMinigameFamilyId =
    minigame.family ||
    (minigame.minigameType === 'ALCHEMICAL_BALANCE'
      ? 'ALCHEMICAL_BALANCE'
      : minigame.minigameType === 'TRAP_STEPPING'
      ? 'PRESSURE_SIGILS'
      : minigame.minigameType === 'LOCKPICK_TIMING'
      ? 'ECLIPSE_PULSE'
      : 'RUNIC_MEMORY');

  const flavor = getBiomeMinigameFlavor(dungeon.id);
  const maxMistakes = minigame.maxMistakes ?? 3;
  const mistakes = minigame.mistakes ?? 0;
  const attemptsLeft = Math.max(0, maxMistakes - mistakes);
  const heartsDisplay =
    '♥'.repeat(attemptsLeft) + '♡'.repeat(Math.max(0, maxMistakes - attemptsLeft));

  const [pulseTick, setPulseTick] = useState(0);

  // Roulette Spin Suspense Gate (Sections 34-39 & 58):
  // Never reveal the landed sector or claim buttons until the 2600ms wheel spin finishes!
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const lastSpinTimestampRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (family !== 'CURSED_ROULETTE') return;
    const spinTs = minigame.rouletteSpinStartedAt;
    if (spinTs && spinTs !== lastSpinTimestampRef.current) {
      lastSpinTimestampRef.current = spinTs;
      setIsWheelSpinning(true);
      onPresentationBusyChange?.(true);
      const timer = window.setTimeout(() => {
        setIsWheelSpinning(false);
        onPresentationBusyChange?.(false);
      }, 2650);
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [family, minigame.rouletteSpinStartedAt, onPresentationBusyChange]);

  // Sequenced Puzzle Failure Consequence State (Sections 40-44 & 57):
  // Step 1: Wrong rune flashes red + mechanism shakes
  // Step 2: Consequence banner reveals HP/Gold/Curse penalty
  // Step 3: Attempts update & puzzle unlocks for retry
  const prevMistakesRef = useRef<number>(mistakes);
  const [puzzleFailPhase, setPuzzleFailPhase] = useState<
    'NONE' | 'FLASH_WRONG' | 'PENALTY_REVEAL'
  >('NONE');
  const [lastWrongInputCode, setLastWrongInputCode] = useState<number | null>(null);

  useEffect(() => {
    if (mistakes > prevMistakesRef.current) {
      prevMistakesRef.current = mistakes;
      setPuzzleFailPhase('FLASH_WRONG');
      onPresentationBusyChange?.(true);
      laCriptaAudio.playRouletteResult(false);
      const t1 = window.setTimeout(() => {
        setPuzzleFailPhase('PENALTY_REVEAL');
      }, 450);
      const t2 = window.setTimeout(() => {
        setPuzzleFailPhase('NONE');
        setLastWrongInputCode(null);
        onPresentationBusyChange?.(false);
      }, 1750);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    prevMistakesRef.current = mistakes;
  }, [mistakes, onPresentationBusyChange]);

  useEffect(() => {
    return () => {
      onPresentationBusyChange?.(false);
    };
  }, []);

  useEffect(() => {
    if (family !== 'ECLIPSE_PULSE' || minigame.completed || puzzleFailPhase !== 'NONE') return;
    const id = window.setInterval(() => {
      setPulseTick((t) => (t + 1) % 40);
    }, 55);
    return () => window.clearInterval(id);
  }, [family, minigame.completed, puzzleFailPhase]);

  const rawPhase = pulseTick <= 20 ? pulseTick : 40 - pulseTick;
  const needlePct = Math.round(4 + (rawPhase / 20) * 92);
  const sweetStart = minigame.sweetSpotStart ?? 32;
  const sweetEnd = minigame.sweetSpotEnd ?? 68;
  const inSweetSpot = needlePct >= sweetStart && needlePct <= sweetEnd;

  const triggerAction = (code: number) => {
    if (iAmDead || isWheelSpinning || puzzleFailPhase !== 'NONE') return;
    if (family === 'CURSED_ROULETTE' && (code === 0 || code === 2)) {
      setIsWheelSpinning(true);
      onPresentationBusyChange?.(true);
    } else {
      setLastWrongInputCode(code);
    }
    laCriptaAudio.playMechanismRotate();
    onPuzzleInput(code);
  };

  const landedRouletteSector =
    !isWheelSpinning &&
    typeof minigame.rouletteLandedSectorIndex === 'number' &&
    minigame.rouletteSectors
      ? minigame.rouletteSectors[minigame.rouletteLandedSectorIndex]
      : null;

  return (
    <div
      className={`w-full max-w-3xl bg-[#110C1B]/95 border-2 p-3.5 sm:p-4 flex flex-col items-center gap-3 shadow-[0_0_28px_rgba(0,0,0,0.85)] transition-all duration-300 ${
        puzzleFailPhase !== 'NONE'
          ? 'border-[#E03E52] shadow-[0_0_32px_rgba(224,62,82,0.65)] animate-[criptaHitShake_0.42s_ease-in-out]'
          : 'border-[#E7A54A]/85'
      }`}
    >
      {/* Header Strip */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-[#2E223D] pb-2">
        <div>
          <div className="text-[9px] font-cripta-pixel text-[#FFD166] uppercase tracking-widest">
            ✦ {CRIPTA_MINIGAME_REGISTRY[family]?.categoryLabel || 'MINIJUEGO'} · PASO{' '}
            {Math.min(minigame.maxSteps || 1, (minigame.currentStep || 0) + 1)} /{' '}
            {minigame.maxSteps || 1}
          </div>
          <div className="font-cripta-display text-sm sm:text-base font-black text-[#F5EFE6] uppercase">
            {minigame.title}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {minigame.rewardBlessingStatus && (
            <LaCriptaStatusEffectBadge
              effectType={minigame.rewardBlessingStatus}
              turnsRemaining={3}
              compact
            />
          )}
          {family !== 'CURSED_ROULETTE' && (
            <div
              className={`px-2.5 py-1 border text-[10px] font-cripta-pixel font-bold tracking-wider ${
                mistakes > 0
                  ? 'bg-[#36111D] border-[#E03E52] text-[#FCA5A5]'
                  : 'bg-[#1D142B] border-[#4A3B5C] text-[#F87171]'
              }`}
            >
              INTENTOS: {heartsDisplay}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <p className="text-[11px] font-cripta-pixel text-[#D8C6A0] text-center leading-relaxed">
        {minigame.instructions}
      </p>

      {/* SEQUENCED PUZZLE FAILURE CONSEQUENCE BANNER (Sections 40-44 & 57) */}
      {puzzleFailPhase !== 'NONE' && (
        <div className="w-full border-2 border-[#E03E52] bg-gradient-to-r from-[#3B1019] via-[#2A0B14] to-[#3B1019] p-3 text-center shadow-[0_0_24px_rgba(224,62,82,0.5)] animate-[criptaBannerSlideIn_0.22s_cubic-bezier(0.2,0.9,0.3,1)]">
          <div className="text-[10px] font-cripta-pixel font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">
            {puzzleFailPhase === 'FLASH_WRONG'
              ? '⚠ ¡SECUENCIA RÚNICA INCORRECTA!'
              : `⚡ ${minigame.lastPenaltyDetail?.title || 'TRAMPA RÚNICA ACTIVADA'}`}
          </div>
          {puzzleFailPhase === 'PENALTY_REVEAL' && (
            <>
              <div className="text-xs font-cripta-pixel text-[#FDE8E8] mt-1">
                {minigame.lastPenaltyDetail?.description ||
                  'El mecanismo rechaza la acción y descarga una penalización sobre el grupo.'}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                {minigame.lastPenaltyDetail?.hpLost && (
                  <span className="px-2.5 py-0.5 bg-[#E03E52]/30 border border-[#E03E52] text-[10px] font-cripta-pixel font-bold text-[#FCA5A5]">
                    -{minigame.lastPenaltyDetail.hpLost} PV
                  </span>
                )}
                {minigame.lastPenaltyDetail?.goldLost && (
                  <span className="px-2.5 py-0.5 bg-[#E7A54A]/25 border border-[#E7A54A] text-[10px] font-cripta-pixel font-bold text-[#FDE047]">
                    -{minigame.lastPenaltyDetail.goldLost} ORO
                  </span>
                )}
                {minigame.lastPenaltyDetail?.statusApplied && (
                  <span className="px-2.5 py-0.5 bg-[#9B72CF]/30 border border-[#9B72CF] text-[10px] font-cripta-pixel font-bold text-[#E9D8FD]">
                    +{minigame.lastPenaltyDetail.statusApplied}
                  </span>
                )}
                <span className="px-2.5 py-0.5 bg-black/45 border border-white/20 text-[10px] font-cripta-pixel font-bold text-[#F5EFE6]">
                  INTENTOS: {heartsDisplay}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          1. RUNIC_MEMORY (6 Runic Pedestals)
          ===================================================================== */}
      {family === 'RUNIC_MEMORY' && (
        <div className="w-full flex flex-col items-center gap-2.5">
          <div className="px-3 py-1 bg-[#1A1228] border border-[#9B72CF] text-[10px] font-cripta-pixel text-[#E0AAFF] uppercase tracking-wider">
            SECUENCIA OBJETIVO:{' '}
            {(minigame.targetSequence || minigame.targetPattern || [])
              .map((rIdx, sIdx) => {
                const done = sIdx < (minigame.currentStep || 0);
                const rName = flavor.runeNames[rIdx] || `RUNA #${rIdx + 1}`;
                return `${done ? '✓' : `${sIdx + 1}.º`} ${rName}`;
              })
              .join('  →  ')}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full">
            {flavor.runeNames.map((rName, rIdx) => {
              const expectedNow =
                (minigame.targetSequence || minigame.targetPattern || [])[
                  minigame.currentStep || 0
                ] === rIdx;
              const alreadyPressed = (minigame.playerInputs || []).includes(rIdx);
              const isWrongFlash =
                puzzleFailPhase !== 'NONE' && lastWrongInputCode === rIdx;
              return (
                <button
                  key={rIdx}
                  type="button"
                  disabled={iAmDead || puzzleFailPhase !== 'NONE'}
                  onClick={() => triggerAction(rIdx)}
                  className={`p-2.5 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    isWrongFlash
                      ? 'bg-[#45121E] border-[#E03E52] text-[#FCA5A5] scale-95 shadow-[0_0_20px_rgba(224,62,82,0.85)]'
                      : alreadyPressed
                      ? 'bg-[#13291E] border-[#5EA87A] text-[#8EE6AE]'
                      : expectedNow
                      ? 'bg-[#221638] hover:bg-[#2E1E4A] border-[#FFD166] text-[#F5EFE6] shadow-[0_0_12px_rgba(255,209,102,0.3)]'
                      : 'bg-[#171124] hover:bg-[#231936] border-[#4A3B5C] text-[#D8C6A0]'
                  }`}
                >
                  <span className="text-[8px] font-cripta-pixel text-[#E7A54A]">
                    GLIFO #{rIdx + 1}
                  </span>
                  <span className="font-cripta-display text-xs font-black uppercase">
                    {rName}
                  </span>
                  <span className="text-[8px] font-cripta-pixel uppercase opacity-80">
                    {alreadyPressed ? '✓ ACTIVO' : 'PULSAR'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. CURSED_ROULETTE (Spin Wheel -> Wait for Stop -> Reveal -> Claim)
          ===================================================================== */}
      {family === 'CURSED_ROULETTE' && (
        <div className="w-full flex flex-col items-center gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
            {(minigame.rouletteSectors || []).map((sec, idx) => {
              // NEVER highlight the landed sector while the wheel is still spinning!
              const isLanded =
                !isWheelSpinning && minigame.rouletteLandedSectorIndex === idx;
              return (
                <div
                  key={sec.id}
                  className={`px-2 py-1.5 border text-center transition-all ${
                    isLanded
                      ? 'bg-[#2A1C12] border-[#FFD166] text-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.55)] scale-105 ring-1 ring-[#FFF3C4]'
                      : sec.isPositive
                      ? 'bg-[#141E19] border-[#3B7A54] text-[#8EE6AE]'
                      : 'bg-[#21111A] border-[#8F263D] text-[#FF8FA3]'
                  }`}
                >
                  <div className="text-[9px] font-cripta-pixel font-bold uppercase truncate">
                    {sec.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revealed Outcome Banner ONLY after wheel stops */}
          {landedRouletteSector && (
            <div
              className={`w-full px-3.5 py-2.5 border-2 text-center animate-[criptaBannerSlideIn_0.25s_cubic-bezier(0.2,0.9,0.3,1)] ${
                landedRouletteSector.isPositive
                  ? 'bg-[#13291E]/95 border-[#5EA87A] text-[#8EE6AE]'
                  : 'bg-[#2E111B]/95 border-[#E03E52] text-[#FCA5A5]'
              }`}
            >
              <div className="text-[10px] font-cripta-pixel font-bold uppercase tracking-widest text-[#FFD166]">
                ✦ VEREDICTO DE LA RUEDA: {landedRouletteSector.label} ✦
              </div>
              <div className="text-xs font-cripta-pixel mt-0.5 text-[#F5EFE6]">
                {landedRouletteSector.description}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            {isWheelSpinning ? (
              <div className="px-6 py-2.5 bg-[#1D142B] border-2 border-[#E7A54A] text-[#FFD166] font-cripta-pixel text-xs font-bold uppercase tracking-wider animate-pulse">
                🎡 GIRANDO LA RUEDA DEL DESTINO...
              </div>
            ) : (minigame.rouletteSpinCount || 0) === 0 ? (
              <button
                type="button"
                disabled={iAmDead}
                onClick={() => triggerAction(0)}
                className="px-6 py-2.5 bg-[#E7A54A] hover:bg-[#F3B861] text-[#09070D] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(231,165,74,0.45)]"
              >
                ✦ GIRAR RULETA DEL DESTINO ✦
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={iAmDead}
                  onClick={() => triggerAction(1)}
                  className="px-5 py-2 bg-[#163022] hover:bg-[#1F422F] border-2 border-[#5EA87A] text-[#8EE6AE] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_16px_rgba(94,168,122,0.35)]"
                >
                  ✓ ACEPTAR DESTINO Y CONTINUAR
                </button>
                {minigame.rouletteCanReroll && (
                  <button
                    type="button"
                    disabled={
                      iAmDead ||
                      partyGold < (minigame.rouletteRerollCostGold || 18)
                    }
                    onClick={() => triggerAction(2)}
                    className="px-4 py-2 bg-[#231734] hover:bg-[#312048] disabled:opacity-40 border border-[#E7A54A] text-[#FFD166] font-cripta-pixel text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    ↻ FORZAR NUEVO GIRO ({minigame.rouletteRerollCostGold || 18} ORO)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PRESSURE_SIGILS (6 Engraved Pressure Plates)
          ===================================================================== */}
      {family === 'PRESSURE_SIGILS' && (
        <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(
            minigame.sigilClueSymbols || [
              'SOL',
              'LUNA',
              'ECLIPSE',
              'SANGRE',
              'VACÍO',
              'CORONA',
            ]
          ).map((sym, idx) => {
            const isLocked = (minigame.sigilLockedPlates || []).includes(idx);
            const isTargetNow =
              (minigame.targetSequence || minigame.targetPattern || [])[
                minigame.currentStep || 0
              ] === idx;
            return (
              <button
                key={sym}
                type="button"
                disabled={iAmDead || isLocked}
                onClick={() => triggerAction(idx)}
                className={`p-2.5 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  isLocked
                    ? 'bg-[#13291E] border-[#5EA87A] text-[#8EE6AE]'
                    : isTargetNow
                    ? 'bg-[#211834] hover:bg-[#2E2148] border-[#E7A54A] text-[#FFD166]'
                    : 'bg-[#151020] hover:bg-[#211832] border-[#3E2F4B] text-[#D8C6A0]'
                }`}
              >
                <span className="text-[8px] font-cripta-pixel uppercase text-[#D8C6A0]/70">
                  LOSA #{idx + 1}
                </span>
                <span className="font-cripta-display text-xs font-black uppercase">
                  {sym}
                </span>
                <span className="text-[8px] font-cripta-pixel uppercase">
                  {isLocked ? '✓ SELLADA' : 'PISAR LOSA'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          4. CRYPT_LOCK (3 Concentric Rotating Rings)
          ===================================================================== */}
      {family === 'CRYPT_LOCK' && (
        <div className="w-full flex flex-col items-center gap-2.5">
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {[0, 1, 2].map((ringIdx) => {
              const angle = (minigame.lockRingAngles?.[ringIdx] ?? 0) % 360;
              const aligned = angle === 0;
              const labels = ['ANILLO EXTERIOR', 'ANILLO MEDIO', 'ANILLO INTERIOR'];
              return (
                <div
                  key={ringIdx}
                  className={`p-2.5 border-2 flex flex-col items-center gap-1.5 ${
                    aligned
                      ? 'bg-[#13291E] border-[#5EA87A]'
                      : 'bg-[#161022] border-[#4A3B5C]'
                  }`}
                >
                  <span className="text-[9px] font-cripta-pixel font-bold text-[#FFD166]">
                    {labels[ringIdx]}
                  </span>
                  <span className="text-xs font-cripta-mono font-bold text-[#F5EFE6]">
                    {angle}° {aligned ? '✓ CENIT' : ''}
                  </span>
                  <button
                    type="button"
                    disabled={iAmDead}
                    onClick={() => triggerAction(ringIdx)}
                    className="w-full py-1.5 bg-[#241936] hover:bg-[#32234B] border border-[#E7A54A] text-[9px] font-cripta-pixel font-bold text-[#FFD166] uppercase cursor-pointer"
                  >
                    ↻ GIRAR +45°
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={iAmDead}
            onClick={() => triggerAction(99)}
            className="px-6 py-2 bg-[#163022] hover:bg-[#204632] border-2 border-[#5EA87A] text-[#8EE6AE] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            ⚡ SELLAR Y ABRIR CERROJO ASTRAL
          </button>
        </div>
      )}

      {/* =====================================================================
          5. ALCHEMICAL_BALANCE (Volatile Cauldron Pressure 70%-86%)
          ===================================================================== */}
      {family === 'ALCHEMICAL_BALANCE' && (
        <div className="w-full max-w-xl flex flex-col items-center gap-2.5">
          <div className="w-full bg-[#09070E] border-2 border-[#4A3B5C] h-7 relative overflow-hidden">
            <div
              className="absolute inset-y-0 bg-[#5EA87A]/35 border-x-2 border-[#5EA87A]"
              style={{ left: '70%', width: '16%' }}
            />
            <div
              className="h-full bg-gradient-to-r from-[#69A8A5] via-[#9B72CF] to-[#FFD166] transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, minigame.alchemicalMeter ?? 25))}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-cripta-pixel font-bold text-[#F5EFE6] uppercase">
              PRESIÓN ALQUÍMICA: {minigame.alchemicalMeter ?? 25}% (ÓPTIMO: 70%–86%)
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              disabled={iAmDead}
              onClick={() => triggerAction(0)}
              className="px-3 py-1.5 bg-[#24131A] hover:bg-[#361B26] border border-[#FF7A33] text-[10px] font-cripta-pixel text-[#FFD166] uppercase cursor-pointer"
            >
              +22% EXTRACTO ÍGNEO
            </button>
            <button
              type="button"
              disabled={iAmDead}
              onClick={() => triggerAction(1)}
              className="px-3 py-1.5 bg-[#132229] hover:bg-[#1B313B] border border-[#7BDFF2] text-[10px] font-cripta-pixel text-[#A5F3FC] uppercase cursor-pointer"
            >
              -12% SAL DE ESCARCHA
            </button>
            <button
              type="button"
              disabled={iAmDead}
              onClick={() => triggerAction(2)}
              className="px-3 py-1.5 bg-[#181326] hover:bg-[#241C38] border border-[#9B72CF] text-[10px] font-cripta-pixel text-[#E0AAFF] uppercase cursor-pointer"
            >
              +14% ESPORA LUNAR
            </button>
            <button
              type="button"
              disabled={iAmDead}
              onClick={() => triggerAction(3)}
              className="px-4 py-1.5 bg-[#14291E] hover:bg-[#1E3D2D] border-2 border-[#5EA87A] text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase cursor-pointer"
            >
              ✓ ESTABILIZAR MATRAZ
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. SOUL_CHAINS (4 Chains: Sever 2 Weak Links, Avoid Trap Link)
          ===================================================================== */}
      {family === 'SOUL_CHAINS' && (
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[0, 1, 2, 3].map((cIdx) => {
            const broken = Boolean(minigame.chainsBroken?.[cIdx]);
            const isWeak = (minigame.chainsWeakIndices || []).includes(cIdx);
            const isTrap = minigame.chainsTrapIndex === cIdx;
            return (
              <button
                key={cIdx}
                type="button"
                disabled={iAmDead || broken}
                onClick={() => triggerAction(cIdx)}
                className={`p-3 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  broken
                    ? 'bg-[#13291E] border-[#5EA87A] text-[#8EE6AE]'
                    : isWeak
                    ? 'bg-[#221834] hover:bg-[#30224A] border-[#FFD166] text-[#F5EFE6]'
                    : 'bg-[#161020] hover:bg-[#211830] border-[#4A3B5C] text-[#D8C6A0]'
                }`}
              >
                <span className="font-cripta-display text-xs font-black uppercase">
                  CADENA #{cIdx + 1}
                </span>
                <span className="text-[9px] font-cripta-pixel text-[#FFD166]">
                  {broken
                    ? '✓ ESLABÓN CORTADO'
                    : isWeak
                    ? '✦ FISURA INCANDESCENTE'
                    : isTrap
                    ? '⚡ TENSIÓN MALDITA'
                    : 'HIERRO REFORZADO'}
                </span>
                <span className="text-[8px] font-cripta-pixel uppercase text-[#8EE6AE]">
                  {broken ? 'LIBERADA' : 'CORTAR CADENA →'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          7. SHADOW_MIRRORS (4 Rotatable Optical Mirrors)
          ===================================================================== */}
      {family === 'SHADOW_MIRRORS' && (
        <div className="w-full flex flex-col items-center gap-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
            {[0, 1, 2, 3].map((mIdx) => {
              const orient = minigame.mirrorOrientations?.[mIdx] ?? 0;
              const targetOrient = minigame.mirrorSolution?.[mIdx] ?? 0;
              const aligned = orient === targetOrient;
              const glyphs = ['╱ (45°)', '╲ (135°)', '─ (0°)', '│ (90°)'];
              return (
                <button
                  key={mIdx}
                  type="button"
                  disabled={iAmDead}
                  onClick={() => triggerAction(mIdx)}
                  className={`p-2.5 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    aligned
                      ? 'bg-[#13291E] border-[#5EA87A] text-[#8EE6AE]'
                      : 'bg-[#181226] hover:bg-[#241B38] border-[#9B72CF] text-[#F5EFE6]'
                  }`}
                >
                  <span className="text-[9px] font-cripta-pixel text-[#E7A54A]">
                    ESPEJO #{mIdx + 1}
                  </span>
                  <span className="font-cripta-mono text-xs font-bold">
                    {glyphs[orient % 4]}
                  </span>
                  <span className="text-[8px] font-cripta-pixel uppercase">
                    {aligned ? '✦ ENFOCADO' : '↻ ROTAR ESPEJO'}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={iAmDead}
            onClick={() => triggerAction(99)}
            className="px-6 py-2 bg-[#163022] hover:bg-[#204632] border-2 border-[#5EA87A] text-[#8EE6AE] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            ✦ CANALIZAR HAZ ASTRAL ✦
          </button>
        </div>
      )}

      {/* =====================================================================
          8. COOP_GAMBLE_CHEST (Push-Your-Luck Coffer)
          ===================================================================== */}
      {family === 'COOP_GAMBLE_CHEST' && (
        <div className="w-full flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-cripta-pixel">
            <span className="px-3 py-1 bg-[#1D1510] border border-[#E7A54A] text-[#FFD166] font-bold">
              SELLO ACTUAL: NIVEL {minigame.gambleChestTier || 1} /{' '}
              {minigame.gambleMaxTier || 3}
            </span>
            <span className="px-3 py-1 bg-[#13261B] border border-[#5EA87A] text-[#8EE6AE] font-bold">
              BOTÍN ACUMULADO: +{minigame.gambleAccumulatedGold || 28} ORO
            </span>
            <span className="px-3 py-1 bg-[#26111B] border border-[#C93B5B] text-[#FF8FA3] font-bold">
              RIESGO DE MALDICIÓN: {minigame.gambleCurseChancePct || 20}%
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={iAmDead}
              onClick={() => triggerAction(1)}
              className="px-5 py-2.5 bg-[#163022] hover:bg-[#204632] border-2 border-[#5EA87A] text-[#8EE6AE] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              ✓ PLANTARSE Y RECLAMAR BOTÍN SEGURO
            </button>
            {(minigame.gambleChestTier || 1) < (minigame.gambleMaxTier || 3) && (
              <button
                type="button"
                disabled={iAmDead}
                onClick={() => triggerAction(2)}
                className="px-5 py-2.5 bg-[#2A141F] hover:bg-[#3B1C2B] border-2 border-[#E7A54A] text-[#FFD166] font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                🔥 ARRIESGAR SIGUIENTE SELLO (+BOTÍN MAYOR)
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          9. ECLIPSE_PULSE (Precision Timing Bar)
          ===================================================================== */}
      {family === 'ECLIPSE_PULSE' && (
        <div className="w-full max-w-xl flex flex-col items-center gap-3">
          <div className="w-full bg-[#09070E] border-2 border-[#4A3B5C] h-8 relative overflow-hidden">
            <div
              className="absolute inset-y-0 bg-[#5EA87A]/35 border-x-2 border-[#5EA87A]"
              style={{
                left: `${sweetStart}%`,
                width: `${sweetEnd - sweetStart}%`,
              }}
            />
            <div
              className={`absolute inset-y-0 w-2 -ml-1 ${
                inSweetSpot
                  ? 'bg-[#FFD166] shadow-[0_0_12px_#FFD166]'
                  : 'bg-[#FF4D6D]'
              }`}
              style={{ left: `${needlePct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] font-cripta-pixel font-bold text-[#F5EFE6] uppercase">
              CORONA DORADA ({sweetStart}%–{sweetEnd}%) · SELLO{' '}
              {(minigame.currentStep || 0) + 1} DE {minigame.maxSteps || 3}
            </div>
          </div>

          <button
            type="button"
            disabled={iAmDead}
            onClick={() => triggerAction(inSweetSpot ? 100 : 200)}
            className={`px-6 py-2.5 border-2 font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
              inSweetSpot
                ? 'bg-[#183626] border-[#6EE7B7] text-[#FFD166] shadow-[0_0_16px_rgba(110,231,183,0.45)]'
                : 'bg-[#231834] hover:bg-[#2F2046] border-[#E7A54A] text-[#F5EFE6]'
            }`}
          >
            ⚡ SINCRONIZAR PULSO AHORA
          </button>
        </div>
      )}

      {/* =====================================================================
          10. FORBIDDEN_COFFERS (Deduction of 3 Ancient Relic Coffers)
          ===================================================================== */}
      {family === 'FORBIDDEN_COFFERS' && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['COFRE DEL SOL', 'COFRE DE LA LUNA', 'COFRE DEL ECLIPSE'].map(
            (cName, cIdx) => {
              const isTrue = minigame.cofferTrueIndex === cIdx;
              return (
                <button
                  key={cName}
                  type="button"
                  disabled={iAmDead}
                  onClick={() => triggerAction(cIdx)}
                  className={`p-3 border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    isTrue
                      ? 'bg-[#1F1730] hover:bg-[#2C2044] border-[#E7A54A] text-[#F5EFE6]'
                      : 'bg-[#151020] hover:bg-[#211832] border-[#4A3B5C] text-[#D8C6A0]'
                  }`}
                >
                  <span className="text-[9px] font-cripta-pixel text-[#FFD166]">
                    RELICARIO #{cIdx + 1}
                  </span>
                  <span className="font-cripta-display text-sm font-black uppercase">
                    {cName}
                  </span>
                  <span className="text-[8px] font-cripta-pixel uppercase text-[#8EE6AE]">
                    ABRIR COFRE →
                  </span>
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
};
