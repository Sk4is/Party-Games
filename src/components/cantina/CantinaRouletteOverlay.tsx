import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RouletteResult, RouletteSpinEventData } from '../../types/cantina';
import { audio } from '../../utils/audio';
import { Skull, ShieldCheck, Flame, Crosshair, RotateCw } from 'lucide-react';

interface CantinaRouletteOverlayProps {
  rouletteResult: RouletteResult;
  localPlayerId: string;
  rouletteSpinEvent?: RouletteSpinEventData | null;
  onPullTrigger: (rouletteEventId: string) => void;
  onSpinCylinder: (
    rouletteEventId: string,
    velocity: number,
    angle: number,
    spinId: string
  ) => void;
}

/**
 * Conceptual 6-chamber geometry on the revolver cylinder:
 * chamber 0 = -90° (12 o'clock / TOP firing position when cylinderAngle = 0°)
 * chamber 1 = -30° (upper-right)
 * chamber 2 =  30° (lower-right)
 * chamber 3 =  90° (bottom)
 * chamber 4 = 150° (lower-left)
 * chamber 5 = 210° (upper-left)
 *
 * When the cylinder rotates by `cylinderAngle` degrees, chamber `idx` sits at:
 *   worldAngle = -90° + idx * 60° + cylinderAngle
 * Therefore, chamber `idx` is aligned at 12 o'clock (-90°) when:
 *   cylinderAngle ≡ -idx * 60° (mod 360°)
 */
const CHAMBER_BASE_ANGLES_DEG = [-90, -30, 30, 90, 150, 210] as const;

export const CantinaRouletteOverlay: React.FC<CantinaRouletteOverlayProps> = ({
  rouletteResult,
  localPlayerId,
  rouletteSpinEvent,
  onPullTrigger,
  onSpinCylinder,
}) => {
  const isTargetPlayer = rouletteResult.targetPlayerId === localPlayerId;
  const chambersTestedBefore = Math.min(
    5,
    Math.max(0, rouletteResult.chamberPullsBefore || 0)
  );
  const activeChamberIdx = chambersTestedBefore;

  // Cylinder physics & shot sequence state
  const [cylinderAngle, setCylinderAngle] = useState<number>(
    () => -activeChamberIdx * 60
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [ratchetTick, setRatchetTick] = useState<boolean>(false);
  const [hasRequestedPull, setHasRequestedPull] = useState<boolean>(false);
  const [resolveStage, setResolveStage] = useState<
    'WAITING' | 'ALIGNING' | 'TENSION' | 'IMPACT'
  >('WAITING');

  const cylinderRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef<number>(-activeChamberIdx * 60);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isLockedForShotRef = useRef<boolean>(false);
  const lastPointerAngleRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const lastDetentIndexRef = useRef<number>(
    Math.floor((-activeChamberIdx * 60) / 30)
  );
  const lastBroadcastTimeRef = useRef<number>(0);
  const lastProcessedSpinIdRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  // Reset state when a new roulette step begins: align current firing chamber at 12 o'clock
  useEffect(() => {
    setHasRequestedPull(false);
    setResolveStage('WAITING');
    isLockedForShotRef.current = false;

    const initialTopAngle = -activeChamberIdx * 60;
    angleRef.current = initialTopAngle;
    velocityRef.current = 0;
    lastDetentIndexRef.current = Math.floor(initialTopAngle / 30);
    setCylinderAngle(initialTopAngle);
  }, [rouletteResult.rouletteEventId, activeChamberIdx]);

  // Listen for remote cylinder spins from the active shooter
  useEffect(() => {
    if (!rouletteSpinEvent) return;
    if (rouletteSpinEvent.rouletteEventId !== rouletteResult.rouletteEventId) return;
    if (rouletteSpinEvent.playerId === localPlayerId) return;
    if (rouletteSpinEvent.spinId === lastProcessedSpinIdRef.current) return;
    if (isLockedForShotRef.current || rouletteResult.shotResolved) return;

    lastProcessedSpinIdRef.current = rouletteSpinEvent.spinId;
    angleRef.current = rouletteSpinEvent.angle;
    velocityRef.current = rouletteSpinEvent.velocity;
    setCylinderAngle(rouletteSpinEvent.angle);
  }, [
    rouletteSpinEvent,
    rouletteResult.rouletteEventId,
    rouletteResult.shotResolved,
    localPlayerId,
  ]);

  // Authoritative Shot Sequence:
  // 1. Lock cylinder interaction
  // 2. Smoothly rotate/settle cylinder so `activeChamberIdx` aligns at 12 o'clock (-activeChamberIdx * 60 mod 360)
  // 3. Short tension pause under fixed top firing marker
  // 4. Trigger strike & impact reveal at 12 o'clock
  useEffect(() => {
    if (!rouletteResult.shotResolved) {
      setResolveStage('WAITING');
      isLockedForShotRef.current = false;
      return;
    }

    isLockedForShotRef.current = true;
    isDraggingRef.current = false;
    setIsDragging(false);
    velocityRef.current = 0;
    setIsSpinning(false);

    // Calculate smooth rotational settle angle so `activeChamberIdx` lands at exact 12 o'clock
    const currentAngle = angleRef.current;
    const desiredAngleMod = -activeChamberIdx * 60;
    const shortestDelta =
      ((((desiredAngleMod - currentAngle) % 360) + 540) % 360) - 180;
    const targetTopAngle = currentAngle + shortestDelta;

    angleRef.current = targetTopAngle;
    setCylinderAngle(targetTopAngle);
    setResolveStage('ALIGNING');
    audio.playRevolverRatchetClick(1.0);

    const tensionTimer = setTimeout(() => {
      setResolveStage('TENSION');
      audio.playHammerCock();
    }, 360);

    const impactTimer = setTimeout(() => {
      setResolveStage('IMPACT');
      if (rouletteResult.fired) {
        audio.playRevolverShot();
      } else {
        audio.playRevolverClick();
      }
    }, 740);

    return () => {
      clearTimeout(tensionTimer);
      clearTimeout(impactTimer);
    };
  }, [
    rouletteResult.shotResolved,
    rouletteResult.shotEventId,
    rouletteResult.fired,
    activeChamberIdx,
  ]);

  // Continuous 60fps cylinder inertia & ratchet click loop while in WAITING state
  useEffect(() => {
    let active = true;
    let tickTimeout: ReturnType<typeof setTimeout> | null = null;

    const step = () => {
      if (!active) return;

      if (
        !isLockedForShotRef.current &&
        !isDraggingRef.current &&
        Math.abs(velocityRef.current) > 0.08
      ) {
        angleRef.current += velocityRef.current;
        velocityRef.current *= 0.962;

        // Soft magnetic detent alignment to 60° chamber slots when slowing down
        if (Math.abs(velocityRef.current) < 1.2) {
          const nearestDetent = Math.round(angleRef.current / 60) * 60;
          const diff = nearestDetent - angleRef.current;
          angleRef.current += diff * 0.14;
        }

        const currentDetent = Math.floor(angleRef.current / 30);
        if (currentDetent !== lastDetentIndexRef.current) {
          lastDetentIndexRef.current = currentDetent;
          const intensity = Math.min(
            1.3,
            Math.max(0.3, Math.abs(velocityRef.current) / 14)
          );
          audio.playRevolverRatchetClick(intensity);
          setRatchetTick(true);
          if (tickTimeout) clearTimeout(tickTimeout);
          tickTimeout = setTimeout(() => setRatchetTick(false), 60);
        }

        setCylinderAngle(angleRef.current);
        setIsSpinning(Math.abs(velocityRef.current) > 0.35);
      } else if (
        !isLockedForShotRef.current &&
        !isDraggingRef.current &&
        Math.abs(velocityRef.current) <= 0.08
      ) {
        if (velocityRef.current !== 0) {
          velocityRef.current = 0;
          const snapped = Math.round(angleRef.current / 60) * 60;
          angleRef.current = snapped;
          setCylinderAngle(snapped);
          setIsSpinning(false);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickTimeout) clearTimeout(tickTimeout);
    };
  }, []);

  const computePointerAngle = useCallback((clientX: number, clientY: number) => {
    if (!cylinderRef.current) return 0;
    const rect = cylinderRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isTargetPlayer ||
      rouletteResult.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current
    ) {
      return;
    }
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    velocityRef.current = 0;
    lastPointerAngleRef.current = computePointerAngle(e.clientX, e.clientY);
    lastPointerTimeRef.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isDraggingRef.current ||
      !isTargetPlayer ||
      rouletteResult.shotResolved ||
      isLockedForShotRef.current
    ) {
      return;
    }
    const currentPointerAngle = computePointerAngle(e.clientX, e.clientY);
    let delta = currentPointerAngle - lastPointerAngleRef.current;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const now = performance.now();
    const dt = Math.max(8, now - lastPointerTimeRef.current);

    angleRef.current += delta;
    velocityRef.current = Math.max(-52, Math.min(52, (delta / dt) * 16.67));

    const currentDetent = Math.floor(angleRef.current / 30);
    if (currentDetent !== lastDetentIndexRef.current) {
      lastDetentIndexRef.current = currentDetent;
      audio.playRevolverRatchetClick(0.85);
      setRatchetTick(true);
      setTimeout(() => setRatchetTick(false), 55);
    }

    lastPointerAngleRef.current = currentPointerAngle;
    lastPointerTimeRef.current = now;
    setCylinderAngle(angleRef.current);

    if (
      now - lastBroadcastTimeRef.current > 90 &&
      Math.abs(velocityRef.current) > 1.5
    ) {
      lastBroadcastTimeRef.current = now;
      onSpinCylinder(
        rouletteResult.rouletteEventId,
        velocityRef.current,
        angleRef.current,
        `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (Math.abs(velocityRef.current) < 2.2) {
      velocityRef.current = 24 + Math.random() * 14;
    } else {
      velocityRef.current = Math.max(
        -55,
        Math.min(55, velocityRef.current * 1.35)
      );
    }

    onSpinCylinder(
      rouletteResult.rouletteEventId,
      velocityRef.current,
      angleRef.current,
      `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    );
  };

  const handleQuickFlickSpin = () => {
    if (
      !isTargetPlayer ||
      rouletteResult.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current
    ) {
      return;
    }
    const impulse = (Math.random() > 0.2 ? 1 : -1) * (28 + Math.random() * 18);
    velocityRef.current = impulse;
    audio.playRevolverRatchetClick(1.1);
    onSpinCylinder(
      rouletteResult.rouletteEventId,
      impulse,
      angleRef.current,
      `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    );
  };

  const handleTriggerClick = () => {
    if (
      !isTargetPlayer ||
      rouletteResult.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current
    ) {
      return;
    }
    setHasRequestedPull(true);
    // Stop manual spin immediately and begin aligning to 12 o'clock while awaiting server confirmation
    velocityRef.current = 0;
    const currentAngle = angleRef.current;
    const desiredAngleMod = -activeChamberIdx * 60;
    const shortestDelta =
      ((((desiredAngleMod - currentAngle) % 360) + 540) % 360) - 180;
    const targetTopAngle = currentAngle + shortestDelta;
    angleRef.current = targetTopAngle;
    setCylinderAngle(targetTopAngle);

    audio.playHammerCock();
    onPullTrigger(rouletteResult.rouletteEventId);
  };

  const isImpactBang = resolveStage === 'IMPACT' && rouletteResult.fired;
  const isImpactClick = resolveStage === 'IMPACT' && !rouletteResult.fired;
  const isSettlingToTop =
    resolveStage === 'ALIGNING' ||
    resolveStage === 'TENSION' ||
    resolveStage === 'IMPACT' ||
    hasRequestedPull;

  // Which chamber index is currently closest to the 12 o'clock top marker
  const currentTopChamberIdx =
    (((-Math.round(cylinderAngle / 60)) % 6) + 6) % 6;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none transition-colors duration-300 ${
        isImpactBang
          ? 'bg-red-950/95'
          : isImpactClick
          ? 'bg-stone-950/90'
          : 'bg-black/88 backdrop-blur-md'
      }`}
    >
      {/* Muzzle Flash & Blood Vignette on Fatal Shot */}
      {isImpactBang && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(251, 191, 36, 0.38) 0%, rgba(220, 38, 38, 0.55) 42%, rgba(69, 10, 10, 0.92) 100%)',
            animation: 'pulse 0.45s cubic-bezier(0.16, 1, 0.3, 1) 1',
          }}
        />
      )}

      {/* Main Saloon Revolver Card */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl border-2 px-6 py-6 sm:px-8 sm:py-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.95)] transition-all duration-300 ${
          isImpactBang
            ? 'bg-gradient-to-b from-red-950 via-[#240707] to-stone-950 border-red-500 shadow-[0_0_90px_rgba(220,38,38,0.65)] scale-[1.02]'
            : isImpactClick
            ? 'bg-gradient-to-b from-stone-900 via-[#171311] to-stone-950 border-emerald-500/80 shadow-[0_0_70px_rgba(16,185,129,0.35)]'
            : rouletteResult.isDevilSequence
            ? 'bg-gradient-to-b from-[#290b0b] via-[#170909] to-stone-950 border-red-600/80 shadow-[0_0_70px_rgba(220,38,38,0.35)]'
            : 'bg-gradient-to-b from-[#231914] via-[#16100d] to-[#0c0907] border-amber-500/60'
        }`}
      >
        {/* Top Tag: Devil Sequence or Ruleta Rusa */}
        <div className="flex flex-col items-center gap-1.5 mb-4">
          {rouletteResult.isDevilSequence ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/90 border border-red-500/60 text-red-300 text-xs font-black uppercase tracking-[0.2em]">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              MALDICIÓN DEL DIABLO • DISPARO {rouletteResult.stepIndex + 1} DE{' '}
              {rouletteResult.totalSteps}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-[0.2em]">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              RULETA RUSA EN LA CANTINA
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-amber-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {isTargetPlayer
              ? '¡TE TOCA EL REVÓLVER!'
              : `TURNO DE ${rouletteResult.targetPlayerName}`}
          </h2>

          <p className="text-xs sm:text-sm font-bold text-amber-200/75 uppercase tracking-widest">
            CÁMARA {rouletteResult.chamberNumber} DE 6 • ({chambersTestedBefore}
            /6 PROBADAS ANTES)
          </p>
        </div>

        {/* Devil Sequence Previous Shots Strip */}
        {rouletteResult.isDevilSequence &&
          rouletteResult.shots &&
          rouletteResult.shots.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {rouletteResult.shots.map((s, idx) => (
                <div
                  key={`${s.playerId}_${idx}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${
                    s.fired
                      ? 'bg-red-950/80 border-red-500/60 text-red-300'
                      : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  <span>{s.playerName}:</span>
                  <span>{s.fired ? '¡BANG!' : 'CLICK'}</span>
                </div>
              ))}
            </div>
          )}

        {/* Interactive 6-Chamber Revolver Cylinder — Fixed Top Firing Marker at 12 O'Clock */}
        <div className="relative flex flex-col items-center justify-center my-3">
          {/* FIXED TOP FIRING MARKER (12 O'CLOCK — NEVER ROTATES WITH CYLINDER) */}
          <div className="z-20 flex flex-col items-center pointer-events-none -mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/90 mb-0.5">
              CAÑÓN / PERCUTOR
            </span>
            <div
              className={`w-9 h-7 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center transition-transform duration-150 ${
                resolveStage === 'TENSION' || resolveStage === 'ALIGNING' || hasRequestedPull
                  ? '-translate-y-1.5 scale-110 bg-amber-500 border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.9)]'
                  : isImpactBang
                  ? 'translate-y-2 bg-red-500 border-yellow-200 shadow-[0_0_28px_rgba(239,68,68,1)]'
                  : isImpactClick
                  ? 'translate-y-1.5 bg-emerald-500 border-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.8)]'
                  : 'bg-stone-800 border-amber-500/75 shadow-md'
              }`}
              title="Posición de disparo fija (12 en punto)"
            >
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-amber-100" />
            </div>
          </div>

          {/* Outer Cylinder Frame */}
          <div className="relative flex items-center justify-center">
            {/* Ambient Glow behind Cylinder */}
            <div
              className={`absolute -inset-4 rounded-full blur-xl pointer-events-none transition-opacity duration-300 ${
                isImpactBang
                  ? 'bg-red-500/60 opacity-100'
                  : isImpactClick
                  ? 'bg-emerald-500/35 opacity-100'
                  : isDragging || isSpinning
                  ? 'bg-amber-500/35 opacity-100'
                  : 'bg-amber-500/15 opacity-75'
              }`}
            />

            {/* Fixed 12 O'Clock Target Ring Highlight (Stationary directly under top marker) */}
            <div
              style={{
                transform: 'translateY(-64px)',
              }}
              className={`absolute z-30 w-14 h-14 rounded-full border-2 pointer-events-none transition-all duration-200 ${
                isImpactBang
                  ? 'border-red-400 shadow-[0_0_28px_rgba(239,68,68,0.95)] scale-110'
                  : isImpactClick
                  ? 'border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.8)] scale-105'
                  : resolveStage === 'TENSION' || resolveStage === 'ALIGNING'
                  ? 'border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)] scale-105'
                  : 'border-amber-400/45 border-dashed'
              }`}
            />

            {/* Rotating Cylinder Body */}
            <div
              ref={cylinderRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                transform: `rotate(${cylinderAngle}deg) scale(${ratchetTick ? 1.02 : 1})`,
                transition: isSettlingToTop
                  ? 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1)'
                  : 'none',
                touchAction: 'none',
              }}
              className={`relative w-52 h-52 sm:w-56 sm:h-56 rounded-full border-[5px] flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.85)] transition-colors ${
                isTargetPlayer && !rouletteResult.shotResolved && !hasRequestedPull
                  ? 'cursor-grab active:cursor-grabbing border-amber-500/80 bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 hover:border-amber-400'
                  : isImpactBang
                  ? 'border-red-500 bg-gradient-to-br from-red-950 via-stone-900 to-black'
                  : isImpactClick
                  ? 'border-emerald-500/80 bg-gradient-to-br from-stone-800 via-stone-900 to-black'
                  : 'border-stone-600 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950'
              }`}
            >
              {/* Fluted cylinder grooves */}
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const fluteAngle = i * 60 + 30;
                return (
                  <div
                    key={`flute_${i}`}
                    style={{
                      transform: `rotate(${fluteAngle}deg) translateY(-86px)`,
                    }}
                    className="absolute w-5 h-3 rounded-full bg-black/55 border border-white/5 pointer-events-none"
                  />
                );
              })}

              {/* 6 Revolver Chambers:
                  chamber 0 = -90° (TOP / 12 o'clock when cylinderAngle = 0)
                  chamber 1 = -30° (upper-right)
                  chamber 2 =  30° (lower-right)
                  chamber 3 =  90° (bottom)
                  chamber 4 = 150° (lower-left)
                  chamber 5 = 210° (upper-left)
              */}
              {CHAMBER_BASE_ANGLES_DEG.map((angleDeg, idx) => {
                const rad = (angleDeg * Math.PI) / 180;
                const radius = 64;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                const isSpentBefore = idx < chambersTestedBefore;
                // The chamber being fired on this pull is `activeChamberIdx`, which settles at 12 o'clock (-activeChamberIdx * 60)
                const isFiringChamber = idx === activeChamberIdx;
                const isCurrentlyAtTop = idx === currentTopChamberIdx;

                let chamberStyle =
                  'bg-stone-950 border-amber-600/50 text-amber-200/70 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)]';

                if (isFiringChamber && isImpactBang) {
                  chamberStyle =
                    'bg-gradient-to-br from-yellow-300 via-amber-500 to-red-600 border-white text-black shadow-[0_0_24px_rgba(239,68,68,1)] scale-110';
                } else if (isFiringChamber && isImpactClick) {
                  chamberStyle =
                    'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.6)]';
                } else if (isSpentBefore) {
                  chamberStyle =
                    'bg-stone-900/70 border-stone-700/70 text-stone-500 shadow-inner opacity-60';
                } else if (isCurrentlyAtTop) {
                  chamberStyle =
                    'bg-gradient-to-br from-amber-800/50 via-stone-950 to-black border-amber-400 text-amber-200 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95),0_0_12px_rgba(245,158,11,0.3)]';
                } else {
                  chamberStyle =
                    'bg-gradient-to-br from-amber-900/40 via-stone-950 to-black border-amber-500/65 text-amber-300/90 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)]';
                }

                return (
                  <div
                    key={idx}
                    style={{
                      transform: `translate(${x}px, ${y}px) rotate(${-cylinderAngle}deg)`,
                      transition: isSettlingToTop
                        ? 'transform 340ms cubic-bezier(0.22, 1, 0.36, 1)'
                        : 'none',
                    }}
                    className={`absolute w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center font-black text-xs pointer-events-none ${chamberStyle}`}
                  >
                    {isFiringChamber && isImpactBang ? (
                      <Skull className="w-6 h-6 text-red-950 animate-pulse" />
                    ) : isFiringChamber && isImpactClick ? (
                      <span className="text-[10px] font-black text-emerald-300">
                        VACÍA
                      </span>
                    ) : isSpentBefore ? (
                      <span className="text-[10px] font-bold text-stone-500">
                        ✕
                      </span>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-amber-400/50 bg-gradient-to-br from-amber-500/30 to-amber-900/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-300/60" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Center Cylinder Axis Pin */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600/40 via-stone-800 to-stone-950 border-2 border-amber-500/60 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-amber-400/40 border border-amber-200/50" />
              </div>
            </div>
          </div>

          {/* Interactive Spin Hint / Quick Spin Button for Shooter */}
          {resolveStage === 'WAITING' && !hasRequestedPull && (
            <div className="mt-3 flex items-center justify-center gap-3">
              {isTargetPlayer ? (
                <>
                  <span className="text-xs font-bold text-amber-200/80">
                    Arrastra el tambor para girarlo
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickFlickSpin}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`}
                    />
                    GIRAR TAMBOR
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-amber-200/75 uppercase tracking-wider">
                  {isSpinning
                    ? `¡${rouletteResult.targetPlayerName} ESTÁ GIRANDO EL TAMBOR!`
                    : `EL REVÓLVER APUNTA A ${rouletteResult.targetPlayerName}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action or Verdict Area */}
        <div className="mt-4 min-h-[96px] flex flex-col items-center justify-center">
          {resolveStage === 'WAITING' && (
            <>
              {isTargetPlayer ? (
                <div className="w-full flex flex-col items-center gap-2.5">
                  <button
                    type="button"
                    disabled={hasRequestedPull}
                    onClick={handleTriggerClick}
                    className="w-full max-w-xs py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-white bg-gradient-to-b from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:to-red-800 border-2 border-amber-400/80 shadow-[0_10px_30px_rgba(220,38,38,0.5)] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {hasRequestedPull
                      ? 'ALINEANDO TAMBOR...'
                      : 'APRETAR EL GATILLO'}
                  </button>
                  <p className="text-[11px] font-bold text-amber-200/60 uppercase tracking-widest">
                    La cámara superior (12 en punto) será la que se dispare
                  </p>
                </div>
              ) : (
                <div className="w-full py-4 px-5 rounded-2xl bg-black/55 border border-amber-500/30 flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-sm sm:text-base uppercase tracking-wider animate-pulse">
                    <Crosshair className="w-4 h-4 text-red-400" />
                    ESPERANDO A QUE {rouletteResult.targetPlayerName} APRIETE EL
                    GATILLO...
                  </div>
                  <p className="text-xs text-stone-400 font-medium">
                    Solo {rouletteResult.targetPlayerName} puede accionar el
                    revólver
                  </p>
                </div>
              )}
            </>
          )}

          {(resolveStage === 'ALIGNING' || resolveStage === 'TENSION') && (
            <div className="w-full py-4 px-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col items-center gap-1">
              <div className="text-lg sm:text-xl font-black text-amber-300 uppercase tracking-[0.2em] animate-pulse">
                {resolveStage === 'ALIGNING'
                  ? 'FIJANDO CÁMARA SUPERIOR...'
                  : '¡APRETANDO EL GATILLO...!'}
              </div>
              <p className="text-xs text-amber-200/70 uppercase tracking-widest">
                El percutor cae sobre la cámara superior (
                {rouletteResult.chamberNumber}/6)
              </p>
            </div>
          )}

          {resolveStage === 'IMPACT' && (
            <div
              className={`w-full py-4 px-5 rounded-2xl border-2 transition-all duration-300 ${
                rouletteResult.fired
                  ? 'bg-red-950/90 border-red-400 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                  : 'bg-emerald-950/80 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2.5 mb-1">
                {rouletteResult.fired ? (
                  <>
                    <Skull className="w-7 h-7 text-red-300 animate-bounce" />
                    <span className="text-2xl sm:text-3xl font-black text-red-200 uppercase tracking-wider">
                      ¡BANG!{' '}
                      {isTargetPlayer
                        ? '¡HAS MUERTO!'
                        : `${rouletteResult.targetPlayerName} CAÍDO`}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-7 h-7 text-emerald-300" />
                    <span className="text-2xl sm:text-3xl font-black text-emerald-200 uppercase tracking-wider">
                      ¡CLICK!{' '}
                      {isTargetPlayer
                        ? '¡TE HAS SALVADO!'
                        : `${rouletteResult.targetPlayerName} SE SALVA`}
                    </span>
                  </>
                )}
              </div>

              <p
                className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                  rouletteResult.fired ? 'text-red-200/90' : 'text-emerald-200/90'
                }`}
              >
                {rouletteResult.fired
                  ? `La bala estaba en la cámara superior (${rouletteResult.chamberNumber}/6) — Eliminado`
                  : `Cámara superior (${rouletteResult.chamberNumber}/6) vacía — Sigue con vida`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
