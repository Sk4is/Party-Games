import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
    spinId: string,
    settled?: boolean
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
 * When the cylinder is at `cylinderAngle` degrees, chamber `idx` sits at:
 *   worldAngle = -90° + idx * 60° + cylinderAngle
 * Therefore, the chamber physically located at 12 o'clock (-90°) is:
 *   topChamberIdx = (((-Math.round(cylinderAngle / 60)) % 6) + 6) % 6
 */
const CHAMBER_BASE_ANGLES_DEG = [-90, -30, 30, 90, 150, 210] as const;

function snapAngleToChamber(angle: number): number {
  return Math.round(angle / 60) * 60;
}

function getTopChamberIndex(angle: number): number {
  return (((-Math.round(angle / 60)) % 6) + 6) % 6;
}

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

  // Set of chamber indices (0..5) already tested on THIS player's personal revolver before this shot
  const firedChambersBeforeSet = useMemo(() => {
    if (Array.isArray(rouletteResult.firedChambersBefore)) {
      return new Set<number>(rouletteResult.firedChambersBefore);
    }
    return new Set<number>(
      Array.from({ length: chambersTestedBefore }, (_, idx) => idx)
    );
  }, [rouletteResult.firedChambersBefore, chambersTestedBefore]);

  const initialCylinderAngle = Number.isFinite(rouletteResult.cylinderAngle)
    ? snapAngleToChamber(rouletteResult.cylinderAngle)
    : -chambersTestedBefore * 60;

  // Cylinder physics & shot sequence state
  // CRITICAL INVARIANT: Pressing DISPARAR NEVER changes cylinderAngle.
  const [cylinderAngle, setCylinderAngle] = useState<number>(initialCylinderAngle);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [ratchetTick, setRatchetTick] = useState<boolean>(false);
  const [hasRequestedPull, setHasRequestedPull] = useState<boolean>(false);
  const [resolveStage, setResolveStage] = useState<'WAITING' | 'TENSION' | 'IMPACT'>(
    'WAITING'
  );

  const cylinderRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef<number>(initialCylinderAngle);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isLockedForShotRef = useRef<boolean>(false);
  const lastPointerAngleRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const lastDetentIndexRef = useRef<number>(Math.floor(initialCylinderAngle / 30));
  const lastBroadcastTimeRef = useRef<number>(0);
  const lastProcessedSpinIdRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  const firedChambersRef = useRef<Set<number>>(firedChambersBeforeSet);
  firedChambersRef.current = firedChambersBeforeSet;

  const rouletteEventIdRef = useRef<string>(rouletteResult.rouletteEventId);
  rouletteEventIdRef.current = rouletteResult.rouletteEventId;

  const isTargetPlayerRef = useRef<boolean>(isTargetPlayer);
  isTargetPlayerRef.current = isTargetPlayer;

  const onSpinCylinderRef = useRef(onSpinCylinder);
  onSpinCylinderRef.current = onSpinCylinder;

  // Reset state ONLY when a new roulette step (rouletteEventId) begins
  useEffect(() => {
    setHasRequestedPull(false);
    setResolveStage('WAITING');
    isLockedForShotRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
    setIsSpinning(false);

    const startAngle = Number.isFinite(rouletteResult.cylinderAngle)
      ? snapAngleToChamber(rouletteResult.cylinderAngle)
      : -chambersTestedBefore * 60;

    angleRef.current = startAngle;
    velocityRef.current = 0;
    lastDetentIndexRef.current = Math.floor(startAngle / 30);
    setCylinderAngle(startAngle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rouletteResult.rouletteEventId]);

  // Listen for remote cylinder spins from the active shooter (spectator sync)
  useEffect(() => {
    if (!rouletteSpinEvent) return;
    if (rouletteSpinEvent.rouletteEventId !== rouletteResult.rouletteEventId) return;
    if (rouletteSpinEvent.playerId === localPlayerId) return;
    if (rouletteSpinEvent.spinId === lastProcessedSpinIdRef.current) return;
    if (isLockedForShotRef.current || rouletteResult.shotResolved) return;

    lastProcessedSpinIdRef.current = rouletteSpinEvent.spinId;
    angleRef.current = rouletteSpinEvent.angle;
    velocityRef.current = rouletteSpinEvent.settled ? 0 : rouletteSpinEvent.velocity;
    setCylinderAngle(rouletteSpinEvent.angle);
    setIsSpinning(!rouletteSpinEvent.settled && Math.abs(rouletteSpinEvent.velocity) > 0.15);
  }, [
    rouletteSpinEvent,
    rouletteResult.rouletteEventId,
    rouletteResult.shotResolved,
    localPlayerId,
  ]);

  // Authoritative Shot Resolution:
  // CRITICAL: ZERO rotation when DISPARAR is pressed or when shotResolved arrives!
  // The chamber already sitting at 12 o'clock is fired in place.
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

    setResolveStage('TENSION');
    audio.playHammerCock();

    const impactTimer = setTimeout(() => {
      setResolveStage('IMPACT');
      if (rouletteResult.fired) {
        audio.playRevolverShot();
      } else {
        audio.playRevolverClick();
      }
    }, 440);

    return () => {
      clearTimeout(impactTimer);
    };
  }, [
    rouletteResult.shotResolved,
    rouletteResult.shotEventId,
    rouletteResult.fired,
  ]);

  // Continuous 60fps cylinder inertia & chamber snapping loop BEFORE pressing DISPARAR
  useEffect(() => {
    let active = true;
    let tickTimeout: ReturnType<typeof setTimeout> | null = null;

    const step = () => {
      if (!active) return;

      if (
        !isLockedForShotRef.current &&
        !isDraggingRef.current &&
        Math.abs(velocityRef.current) > 0.05
      ) {
        angleRef.current += velocityRef.current;
        velocityRef.current *= 0.964;

        // If slowing down and approaching a chamber that was already tested on this revolver,
        // maintain gentle momentum so it glides into the next untested chamber BEFORE stopping.
        const spentSet = firedChambersRef.current;
        if (
          spentSet.size > 0 &&
          spentSet.size < 6 &&
          Math.abs(velocityRef.current) < 2.2
        ) {
          const nearestSlotAngle = snapAngleToChamber(angleRef.current);
          const candidateTopIdx = getTopChamberIndex(nearestSlotAngle);
          if (spentSet.has(candidateTopIdx)) {
            const dir = velocityRef.current >= 0 ? 1 : -1;
            velocityRef.current = dir * 2.35;
          }
        }

        // Gentle magnetic snap to the nearest 60° chamber detent as part of manual spin deceleration
        if (Math.abs(velocityRef.current) < 1.15) {
          const nearestDetent = snapAngleToChamber(angleRef.current);
          const diff = nearestDetent - angleRef.current;
          angleRef.current += diff * 0.22;
          if (Math.abs(diff) < 0.35 && Math.abs(velocityRef.current) < 0.35) {
            angleRef.current = nearestDetent;
            velocityRef.current = 0;
          }
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

        if (velocityRef.current === 0) {
          setIsSpinning(false);
          if (isTargetPlayerRef.current) {
            onSpinCylinderRef.current(
              rouletteEventIdRef.current,
              0,
              angleRef.current,
              `settle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              true
            );
          }
        } else {
          setIsSpinning(true);
        }
      } else if (
        !isLockedForShotRef.current &&
        !isDraggingRef.current &&
        Math.abs(velocityRef.current) <= 0.05 &&
        velocityRef.current !== 0
      ) {
        velocityRef.current = 0;
        let snapped = snapAngleToChamber(angleRef.current);
        const spentSet = firedChambersRef.current;
        if (spentSet.size > 0 && spentSet.size < 6) {
          for (let i = 0; i < 6; i++) {
            if (!spentSet.has(getTopChamberIndex(snapped))) break;
            snapped -= 60;
          }
        }
        angleRef.current = snapped;
        setCylinderAngle(snapped);
        setIsSpinning(false);

        if (isTargetPlayerRef.current) {
          onSpinCylinderRef.current(
            rouletteEventIdRef.current,
            0,
            snapped,
            `settle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            true
          );
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
    setIsSpinning(true);
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
      Math.abs(velocityRef.current) > 1.2
    ) {
      lastBroadcastTimeRef.current = now;
      onSpinCylinder(
        rouletteResult.rouletteEventId,
        velocityRef.current,
        angleRef.current,
        `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        false
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

    // Proportional flick physics:
    // If quick tap without drag, impart a moderate spin; if dragged, preserve proportional flick velocity
    if (Math.abs(velocityRef.current) < 0.8) {
      velocityRef.current = 12 + Math.random() * 8;
    } else {
      velocityRef.current = Math.max(
        -56,
        Math.min(56, velocityRef.current * 1.28)
      );
    }
    setIsSpinning(true);

    onSpinCylinder(
      rouletteResult.rouletteEventId,
      velocityRef.current,
      angleRef.current,
      `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      false
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
    const impulse = (Math.random() > 0.2 ? 1 : -1) * (24 + Math.random() * 16);
    velocityRef.current = impulse;
    setIsSpinning(true);
    audio.playRevolverRatchetClick(1.1);
    onSpinCylinder(
      rouletteResult.rouletteEventId,
      impulse,
      angleRef.current,
      `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      false
    );
  };

  const handleTriggerClick = () => {
    if (
      !isTargetPlayer ||
      rouletteResult.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current ||
      isDragging ||
      isSpinning
    ) {
      return;
    }
    // CRITICAL INVARIANT: Do NOT modify angleRef.current or cylinderAngle when DISPARAR is pressed!
    isLockedForShotRef.current = true;
    setHasRequestedPull(true);
    audio.playHammerCock();
    onPullTrigger(rouletteResult.rouletteEventId);
  };

  const isImpactBang = resolveStage === 'IMPACT' && rouletteResult.fired;
  const isImpactClick = resolveStage === 'IMPACT' && !rouletteResult.fired;
  const isCylinderMoving = isDragging || isSpinning;

  // The chamber currently physically located at 12 o'clock (-90°)
  const currentTopChamberIdx = getTopChamberIndex(cylinderAngle);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none transition-colors duration-300 ${
        isImpactBang
          ? 'bg-red-950/95'
          : isImpactClick
          ? 'bg-emerald-950/88 backdrop-blur-md'
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

      {/* Relief Emerald Halo on Safe Shot (Clásico / Diablo) */}
      {isImpactClick && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.34) 0%, rgba(5, 150, 105, 0.22) 44%, rgba(6, 46, 34, 0.82) 100%)',
            animation: 'pulse 0.5s cubic-bezier(0.16, 1, 0.3, 1) 1',
          }}
        />
      )}

      {/* Main Saloon Revolver Card — FIXED GEOMETRY so it never jumps or resizes across states */}
      <div
        className={`relative z-10 w-full max-w-lg h-[572px] sm:h-[596px] rounded-3xl border-2 px-6 py-5 sm:px-8 sm:py-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden transition-colors duration-300 ${
          isImpactBang
            ? 'bg-gradient-to-b from-red-950 via-[#240707] to-stone-950 border-red-500 shadow-[0_0_90px_rgba(220,38,38,0.65)]'
            : isImpactClick
            ? 'bg-gradient-to-b from-emerald-950/95 via-[#0f241d] to-stone-950 border-emerald-400 shadow-[0_0_85px_rgba(16,185,129,0.55)]'
            : rouletteResult.isDevilSequence
            ? 'bg-gradient-to-b from-[#290b0b] via-[#170909] to-stone-950 border-red-600/80 shadow-[0_0_70px_rgba(220,38,38,0.35)]'
            : 'bg-gradient-to-b from-[#231914] via-[#16100d] to-[#0c0907] border-amber-500/60'
        }`}
      >
        {/* Top Header Zone — Fixed Height */}
        <div className="h-[112px] shrink-0 flex flex-col items-center justify-center gap-1">
          {rouletteResult.isDevilSequence ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/90 border border-red-500/60 text-red-300 text-xs font-black uppercase tracking-[0.2em]">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              MALDICIÓN DEL DIABLO • DISPARO {rouletteResult.stepIndex + 1} DE{' '}
              {rouletteResult.totalSteps}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-[0.2em]">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              REVÓLVER DE {rouletteResult.targetPlayerName}
            </div>
          )}

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wide text-amber-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] truncate max-w-full">
            {isImpactClick
              ? isTargetPlayer
                ? '¡CLICK! ¡ESTÁS A SALVO!'
                : `¡${rouletteResult.targetPlayerName} SE SALVA!`
              : isImpactBang
              ? isTargetPlayer
                ? '¡BANG! ¡HAS CAÍDO!'
                : `¡${rouletteResult.targetPlayerName} ELIMINADO!`
              : isTargetPlayer
              ? '¡TU REVÓLVER EN JUEGO!'
              : `TURNO DE ${rouletteResult.targetPlayerName}`}
          </h2>

          {/* Sub-header / Devil Sequence Previous Shots Strip — Fixed 24px slot */}
          <div className="h-6 flex items-center justify-center overflow-hidden">
            {rouletteResult.isDevilSequence &&
            rouletteResult.shots &&
            rouletteResult.shots.length > 0 ? (
              <div className="flex items-center justify-center gap-1.5 overflow-hidden">
                {rouletteResult.shots.map((s, idx) => (
                  <div
                    key={`${s.playerId}_${idx}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${
                      s.fired
                        ? 'bg-red-950/80 border-red-500/60 text-red-300'
                        : 'bg-emerald-950/75 border-emerald-400/60 text-emerald-300'
                    }`}
                  >
                    <span>{s.playerName}:</span>
                    <span>{s.fired ? '¡BANG!' : '✓ SALVO'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-bold text-amber-200/75 uppercase tracking-widest whitespace-nowrap">
                TAMBOR PERSONAL: {chambersTestedBefore}/6 PROBADAS • TIRO{' '}
                {rouletteResult.chamberNumber}/6
              </p>
            )}
          </div>
        </div>

        {/* Center Interactive 6-Chamber Revolver Cylinder Zone — Fixed Height */}
        <div className="relative flex-1 flex flex-col items-center justify-center">
          {/* FIXED TOP FIRING MARKER (12 O'CLOCK — NEVER ROTATES WITH CYLINDER) */}
          <div className="z-20 flex flex-col items-center pointer-events-none -mb-1.5">
            <span
              className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 transition-colors ${
                isImpactClick
                  ? 'text-emerald-300'
                  : isImpactBang
                  ? 'text-red-300'
                  : 'text-amber-400/90'
              }`}
            >
              {isImpactClick
                ? '✓ CÁMARA VACÍA • SIN BALA'
                : isImpactBang
                ? '☠ BALA DISPARADA'
                : 'CAÑÓN / 12 EN PUNTO'}
            </span>
            <div
              className={`w-9 h-7 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center transition-transform duration-150 ${
                resolveStage === 'TENSION' || hasRequestedPull
                  ? '-translate-y-1.5 scale-110 bg-amber-500 border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.9)]'
                  : isImpactBang
                  ? 'translate-y-2 bg-red-500 border-yellow-200 shadow-[0_0_28px_rgba(239,68,68,1)]'
                  : isImpactClick
                  ? 'translate-y-1.5 bg-emerald-500 border-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.95)]'
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
                  ? 'bg-emerald-400/55 opacity-100'
                  : isCylinderMoving
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
                  ? 'border-emerald-300 bg-emerald-400/15 shadow-[0_0_32px_rgba(16,185,129,0.95)] scale-110'
                  : resolveStage === 'TENSION'
                  ? 'border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)] scale-105'
                  : 'border-amber-400/50 border-dashed'
              }`}
            />

            {/* Prominent Center SAFE Stamp Overlay on Cylinder when SAFE Shot Resolves */}
            {isImpactClick && (
              <div className="absolute z-40 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-90 fade-in duration-200">
                <div className="px-4 py-1.5 rounded-2xl bg-emerald-950/95 border-2 border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.9)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
                  <span className="text-sm sm:text-base font-black uppercase tracking-[0.18em] text-emerald-100 whitespace-nowrap">
                    ¡CLICK! • A SALVO
                  </span>
                </div>
              </div>
            )}

            {/* Rotating Cylinder Body — ZERO rotation transition after pressing DISPARAR */}
            <div
              ref={cylinderRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                transform: `rotate(${cylinderAngle}deg) scale(${ratchetTick ? 1.02 : 1})`,
                touchAction: 'none',
              }}
              className={`relative w-52 h-52 sm:w-56 sm:h-56 rounded-full border-[5px] flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.85)] transition-colors ${
                isTargetPlayer && !rouletteResult.shotResolved && !hasRequestedPull
                  ? 'cursor-grab active:cursor-grabbing border-amber-500/80 bg-gradient-to-br from-stone-700 via-stone-800 to-stone-950 hover:border-amber-400'
                  : isImpactBang
                  ? 'border-red-500 bg-gradient-to-br from-red-950 via-stone-900 to-black'
                  : isImpactClick
                  ? 'border-emerald-400 bg-gradient-to-br from-emerald-950/80 via-stone-900 to-black shadow-[inset_0_0_30px_rgba(16,185,129,0.25),0_0_35px_rgba(16,185,129,0.35)]'
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

              {/* 6 Revolver Chambers */}
              {CHAMBER_BASE_ANGLES_DEG.map((angleDeg, idx) => {
                const rad = (angleDeg * Math.PI) / 180;
                const radius = 64;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                const isSpentBefore = firedChambersBeforeSet.has(idx);
                const isCurrentlyAtTop = idx === currentTopChamberIdx;

                let chamberStyle =
                  'bg-stone-950 border-amber-600/50 text-amber-200/70 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)]';

                if (isCurrentlyAtTop && isImpactBang) {
                  chamberStyle =
                    'bg-gradient-to-br from-yellow-300 via-amber-500 to-red-600 border-white text-black shadow-[0_0_24px_rgba(239,68,68,1)] scale-110';
                } else if (isCurrentlyAtTop && isImpactClick) {
                  chamberStyle =
                    'bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-900 border-emerald-100 text-stone-950 shadow-[0_0_24px_rgba(16,185,129,0.95)] scale-110';
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
                    }}
                    className={`absolute w-12 h-12 sm:w-13 sm:h-13 rounded-full border-2 flex items-center justify-center font-black text-xs pointer-events-none ${chamberStyle}`}
                  >
                    {isCurrentlyAtTop && isImpactBang ? (
                      <Skull className="w-6 h-6 text-red-950 animate-pulse" />
                    ) : isCurrentlyAtTop && isImpactClick ? (
                      <ShieldCheck className="w-6 h-6 text-stone-950 stroke-[2.5]" />
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

          {/* Interactive Spin Hint / Status Row — ALWAYS occupies fixed 36px height so modal never jumps */}
          <div className="mt-3 h-9 flex items-center justify-center gap-3 shrink-0">
            {resolveStage === 'WAITING' && !hasRequestedPull ? (
              isTargetPlayer ? (
                <>
                  <span className="text-xs font-bold text-amber-200/80 whitespace-nowrap">
                    Arrastra el tambor las veces que quieras
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickFlickSpin}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800/90 hover:bg-stone-700 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95 whitespace-nowrap"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`}
                    />
                    GIRAR TAMBOR
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-amber-200/75 uppercase tracking-wider whitespace-nowrap">
                  {isSpinning
                    ? `¡${rouletteResult.targetPlayerName} ESTÁ GIRANDO SU TAMBOR!`
                    : `EL REVÓLVER APUNTA A ${rouletteResult.targetPlayerName}`}
                </span>
              )
            ) : (
              <span
                className={`text-xs font-black uppercase tracking-widest whitespace-nowrap ${
                  isImpactClick
                    ? 'text-emerald-300'
                    : isImpactBang
                    ? 'text-red-300'
                    : 'text-amber-300/80'
                }`}
              >
                {isImpactClick
                  ? `✓ RECÁMARA ${rouletteResult.chamberNumber}/6 VACÍA • SIGUE CON VIDA`
                  : isImpactBang
                  ? `☠ BALA EN LA RECÁMARA ${rouletteResult.chamberNumber}/6`
                  : 'TAMBOR BLOQUEADO EN LAS 12 EN PUNTO'}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Action or Verdict Area — Strictly Fixed 108px Height */}
        <div className="h-[108px] shrink-0 flex flex-col items-center justify-center">
          {resolveStage === 'WAITING' && (
            <>
              {isTargetPlayer ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={hasRequestedPull || isCylinderMoving}
                    onClick={handleTriggerClick}
                    className="w-full max-w-xs py-3.5 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-white bg-gradient-to-b from-red-600 via-red-700 to-red-900 hover:from-red-500 hover:to-red-800 border-2 border-amber-400/80 shadow-[0_10px_30px_rgba(220,38,38,0.5)] active:scale-95 transition-all disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isCylinderMoving
                      ? 'GIRANDO EL TAMBOR...'
                      : hasRequestedPull
                      ? 'DISPARANDO...'
                      : 'DISPARAR'}
                  </button>
                  <p className="text-[11px] font-bold text-amber-200/65 uppercase tracking-widest whitespace-nowrap">
                    Se disparará la cámara situada a las 12 en punto sin rotar más
                  </p>
                </div>
              ) : (
                <div className="w-full h-full px-5 rounded-2xl bg-black/55 border border-amber-500/30 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-sm sm:text-base uppercase tracking-wider animate-pulse">
                    <Crosshair className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate">
                      ESPERANDO A QUE {rouletteResult.targetPlayerName} PULSE
                      DISPARAR...
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 font-medium">
                    Revólver personal de {rouletteResult.targetPlayerName} (
                    {chambersTestedBefore}/6 cámaras probadas)
                  </p>
                </div>
              )}
            </>
          )}

          {resolveStage === 'TENSION' && (
            <div className="w-full h-full px-5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col items-center justify-center gap-1">
              <div className="text-lg sm:text-xl font-black text-amber-300 uppercase tracking-[0.2em] animate-pulse">
                ¡MARTILLO CAYENDO...!
              </div>
              <p className="text-xs text-amber-200/70 uppercase tracking-widest">
                Percutor sobre la cámara superior (12 en punto)
              </p>
            </div>
          )}

          {resolveStage === 'IMPACT' && (
            <div
              className={`w-full h-full px-5 rounded-2xl border-2 flex flex-col items-center justify-center transition-colors duration-300 ${
                rouletteResult.fired
                  ? 'bg-red-950/90 border-red-400 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                  : 'bg-gradient-to-b from-emerald-900/90 to-emerald-950/95 border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2.5 mb-1">
                {rouletteResult.fired ? (
                  <>
                    <Skull className="w-7 h-7 text-red-300 animate-bounce shrink-0" />
                    <span className="text-xl sm:text-2xl font-black text-red-100 uppercase tracking-wider truncate">
                      ¡BANG!{' '}
                      {isTargetPlayer
                        ? '¡HAS MUERTO!'
                        : `${rouletteResult.targetPlayerName} CAÍDO`}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-7 h-7 text-emerald-300 shrink-0" />
                    <span className="text-xl sm:text-2xl font-black text-emerald-100 uppercase tracking-wider truncate">
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
                  rouletteResult.fired ? 'text-red-200/90' : 'text-emerald-200'
                }`}
              >
                {rouletteResult.fired
                  ? `La bala estaba en la cámara (${rouletteResult.chamberNumber}/6) — Eliminado`
                  : `Cámara vacía (${rouletteResult.chamberNumber}/6 probadas) — ¡Sigue en la partida!`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
