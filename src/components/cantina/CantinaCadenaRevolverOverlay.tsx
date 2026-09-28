import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CadenaRevolverState, RouletteSpinEventData } from '../../types/cantina';
import {
  CANTINA_CARD_ASSETS,
  logCantinaCardAssetError,
} from '../../data/cantina/cantinaAssets';
import { audio } from '../../utils/audio';
import { Crosshair, RotateCw, ShieldCheck, Zap } from 'lucide-react';

export interface CantinaCadenaRevolverOverlayProps {
  key?: string | number | null;
  revolverState: CadenaRevolverState;
  localPlayerId: string;
  interactive: boolean;
  rouletteSpinEvent?: RouletteSpinEventData | null;
  onPullRevolver: (eventId: string) => void;
  onSpinRevolver: (
    eventId: string,
    velocity: number,
    angle: number,
    spinId: string,
    settled?: boolean
  ) => void;
}

const CHAMBER_BASE_ANGLES_DEG = [-90, -30, 30, 90, 150, 210] as const;

function snapAngleToChamber(angle: number): number {
  return Math.round(angle / 60) * 60;
}

function getTopChamberIndex(angle: number): number {
  return (((-Math.round(angle / 60)) % 6) + 6) % 6;
}

/**
 * Isolated Cadena Mode REVÓLVER Special-Card Minigame Overlay.
 * Completely independent from the persistent Clásico/Diablo personal revolver state:
 * - 6 chambers: 3 loaded, 3 empty
 * - Never kills or eliminates any player
 * - ¡BANG! forces the targeted rival to draw +5 penalty cards from the Cadena deck
 * - ¡CLICK! leaves the targeted rival unscathed (0 penalty cards)
 */
export function CantinaCadenaRevolverOverlay({
  revolverState,
  localPlayerId,
  interactive,
  rouletteSpinEvent,
  onPullRevolver,
  onSpinRevolver,
}: CantinaCadenaRevolverOverlayProps) {
  const isTargetShooter =
    Boolean(interactive) && revolverState.shooterPlayerId === localPlayerId;
  const initialAngle = Number.isFinite(revolverState.cylinderAngle)
    ? snapAngleToChamber(revolverState.cylinderAngle)
    : 0;

  const [cylinderAngle, setCylinderAngle] = useState<number>(initialAngle);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [ratchetTick, setRatchetTick] = useState<boolean>(false);
  const [hasRequestedPull, setHasRequestedPull] = useState<boolean>(false);
  const [resolveStage, setResolveStage] = useState<'WAITING' | 'TENSION' | 'IMPACT'>(
    'WAITING'
  );

  const cylinderRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef<number>(initialAngle);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const hasSettledRef = useRef<boolean>(true);
  const isLockedForShotRef = useRef<boolean>(false);
  const lastPointerAngleRef = useRef<number>(0);
  const lastPointerTimeRef = useRef<number>(0);
  const lastDetentIndexRef = useRef<number>(Math.floor(initialAngle / 30));
  const lastBroadcastTimeRef = useRef<number>(0);
  const lastProcessedSpinIdRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);
  const moveTickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eventIdRef = useRef<string>(revolverState.eventId);
  eventIdRef.current = revolverState.eventId;

  const interactiveRef = useRef<boolean>(interactive);
  interactiveRef.current = interactive;

  const isTargetShooterRef = useRef<boolean>(isTargetShooter);
  isTargetShooterRef.current = isTargetShooter;

  const onSpinRevolverRef = useRef(onSpinRevolver);
  onSpinRevolverRef.current = onSpinRevolver;

  const onPullRevolverRef = useRef(onPullRevolver);
  onPullRevolverRef.current = onPullRevolver;

  const invokeSpinRevolver = useCallback(
    (
      eventId: string,
      velocity: number,
      angle: number,
      spinId: string,
      settled?: boolean
    ) => {
      if (!interactiveRef.current || !isTargetShooterRef.current) {
        return;
      }
      if (typeof onSpinRevolverRef.current !== 'function') {
        console.error(
          '[CantinaCadenaRevolverOverlay] Missing valid onSpinRevolver callback for interactive target.'
        );
        return;
      }
      onSpinRevolverRef.current(eventId, velocity, angle, spinId, settled);
    },
    []
  );

  const invokePullRevolver = useCallback((eventId: string) => {
    if (!interactiveRef.current || !isTargetShooterRef.current) {
      return;
    }
    if (typeof onPullRevolverRef.current !== 'function') {
      console.error(
        '[CantinaCadenaRevolverOverlay] Missing valid onPullRevolver callback for interactive target.'
      );
      return;
    }
    onPullRevolverRef.current(eventId);
  }, []);

  // Release any active pointer capture safely
  const releaseActivePointerCapture = useCallback(() => {
    if (activePointerIdRef.current !== null && cylinderRef.current) {
      try {
        if (cylinderRef.current.hasPointerCapture(activePointerIdRef.current)) {
          cylinderRef.current.releasePointerCapture(activePointerIdRef.current);
        }
      } catch {
        // Ignore if element lost capture
      }
    }
    activePointerIdRef.current = null;
  }, []);

  // Reset all transient local state when a new Revolver eventId starts
  useEffect(() => {
    releaseActivePointerCapture();
    if (moveTickTimeoutRef.current) {
      clearTimeout(moveTickTimeoutRef.current);
      moveTickTimeoutRef.current = null;
    }

    setHasRequestedPull(false);
    setResolveStage('WAITING');
    setRatchetTick(false);
    isLockedForShotRef.current = false;
    isDraggingRef.current = false;
    hasSettledRef.current = true;
    lastProcessedSpinIdRef.current = '';
    lastBroadcastTimeRef.current = 0;
    setIsDragging(false);
    setIsSpinning(false);

    const startAngle = Number.isFinite(revolverState.cylinderAngle)
      ? snapAngleToChamber(revolverState.cylinderAngle)
      : 0;
    angleRef.current = startAngle;
    velocityRef.current = 0;
    lastDetentIndexRef.current = Math.floor(startAngle / 30);
    setCylinderAngle(startAngle);

    return () => {
      releaseActivePointerCapture();
      if (moveTickTimeoutRef.current) {
        clearTimeout(moveTickTimeoutRef.current);
        moveTickTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revolverState.eventId, releaseActivePointerCapture]);

  // Synchronize remote cylinder spin events for spectators / non-shooter players
  useEffect(() => {
    if (!rouletteSpinEvent) return;
    if (rouletteSpinEvent.rouletteEventId !== revolverState.eventId) return;
    if (rouletteSpinEvent.playerId === localPlayerId) return;
    if (rouletteSpinEvent.spinId === lastProcessedSpinIdRef.current) return;
    if (isLockedForShotRef.current || revolverState.shotResolved) return;

    lastProcessedSpinIdRef.current = rouletteSpinEvent.spinId;
    angleRef.current = rouletteSpinEvent.angle;
    velocityRef.current = rouletteSpinEvent.settled ? 0 : rouletteSpinEvent.velocity;
    hasSettledRef.current = Boolean(rouletteSpinEvent.settled);
    setCylinderAngle(rouletteSpinEvent.angle);
    setIsSpinning(
      !rouletteSpinEvent.settled && Math.abs(rouletteSpinEvent.velocity) > 0.15
    );
  }, [
    rouletteSpinEvent,
    revolverState.eventId,
    revolverState.shotResolved,
    localPlayerId,
  ]);

  // Synchronize authoritative shot resolution (TENSION -> IMPACT)
  useEffect(() => {
    if (!revolverState.shotResolved) {
      setResolveStage('WAITING');
      isLockedForShotRef.current = false;
      return;
    }

    releaseActivePointerCapture();
    isLockedForShotRef.current = true;
    isDraggingRef.current = false;
    hasSettledRef.current = true;
    setIsDragging(false);
    velocityRef.current = 0;
    setIsSpinning(false);

    const authoritativeSnap = snapAngleToChamber(revolverState.cylinderAngle);
    angleRef.current = authoritativeSnap;
    setCylinderAngle(authoritativeSnap);

    setResolveStage('TENSION');
    audio.playHammerCock();

    const impactTimer = setTimeout(() => {
      setResolveStage('IMPACT');
      if (revolverState.fired) {
        audio.playRevolverShot();
      } else {
        audio.playRevolverClick();
      }
    }, 340);

    return () => {
      clearTimeout(impactTimer);
    };
  }, [
    revolverState.shotResolved,
    revolverState.fired,
    revolverState.cylinderAngle,
    revolverState.eventId,
    releaseActivePointerCapture,
  ]);

  // Single physics & detent animation loop per mounted overlay
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
        hasSettledRef.current = false;
        angleRef.current += velocityRef.current;
        velocityRef.current *= 0.962;

        if (Math.abs(velocityRef.current) < 1.15) {
          const nearestDetent = snapAngleToChamber(angleRef.current);
          const diff = nearestDetent - angleRef.current;
          angleRef.current += diff * 0.24;
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
          tickTimeout = setTimeout(() => {
            if (active) setRatchetTick(false);
          }, 60);
        }

        setCylinderAngle(angleRef.current);

        if (velocityRef.current === 0) {
          setIsSpinning(false);
          if (!hasSettledRef.current) {
            hasSettledRef.current = true;
            invokeSpinRevolver(
              eventIdRef.current,
              0,
              angleRef.current,
              `csettle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        const snapped = snapAngleToChamber(angleRef.current);
        angleRef.current = snapped;
        setCylinderAngle(snapped);
        setIsSpinning(false);

        if (!hasSettledRef.current) {
          hasSettledRef.current = true;
          invokeSpinRevolver(
            eventIdRef.current,
            0,
            snapped,
            `csettle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            true
          );
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      active = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (tickTimeout) {
        clearTimeout(tickTimeout);
        tickTimeout = null;
      }
    };
  }, [invokeSpinRevolver]);

  const computePointerAngle = useCallback((clientX: number, clientY: number) => {
    if (!cylinderRef.current) return 0;
    const rect = cylinderRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isTargetShooter ||
      revolverState.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current
    ) {
      return;
    }
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointerIdRef.current = e.pointerId;
    } catch {
      activePointerIdRef.current = null;
    }
    isDraggingRef.current = true;
    hasSettledRef.current = false;
    setIsDragging(true);
    setIsSpinning(true);
    velocityRef.current = 0;
    lastPointerAngleRef.current = computePointerAngle(e.clientX, e.clientY);
    lastPointerTimeRef.current = performance.now();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (
      !isDraggingRef.current ||
      !isTargetShooter ||
      revolverState.shotResolved ||
      isLockedForShotRef.current
    ) {
      return;
    }
    if (
      activePointerIdRef.current !== null &&
      e.pointerId !== activePointerIdRef.current
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
    hasSettledRef.current = false;

    const currentDetent = Math.floor(angleRef.current / 30);
    if (currentDetent !== lastDetentIndexRef.current) {
      lastDetentIndexRef.current = currentDetent;
      audio.playRevolverRatchetClick(0.85);
      setRatchetTick(true);
      if (moveTickTimeoutRef.current) {
        clearTimeout(moveTickTimeoutRef.current);
      }
      moveTickTimeoutRef.current = setTimeout(() => {
        setRatchetTick(false);
        moveTickTimeoutRef.current = null;
      }, 55);
    }

    lastPointerAngleRef.current = currentPointerAngle;
    lastPointerTimeRef.current = now;
    setCylinderAngle(angleRef.current);

    if (
      now - lastBroadcastTimeRef.current > 90 &&
      Math.abs(velocityRef.current) > 1.2
    ) {
      lastBroadcastTimeRef.current = now;
      invokeSpinRevolver(
        revolverState.eventId,
        velocityRef.current,
        angleRef.current,
        `cspin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        false
      );
    }
  };

  const finishPointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture already released
    }
    activePointerIdRef.current = null;

    if (
      !isTargetShooter ||
      revolverState.shotResolved ||
      isLockedForShotRef.current
    ) {
      return;
    }

    if (Math.abs(velocityRef.current) < 0.8) {
      velocityRef.current = 14 + Math.random() * 10;
    } else {
      velocityRef.current = Math.max(
        -56,
        Math.min(56, velocityRef.current * 1.28)
      );
    }
    hasSettledRef.current = false;
    setIsSpinning(true);

    invokeSpinRevolver(
      revolverState.eventId,
      velocityRef.current,
      angleRef.current,
      `cspin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      false
    );
  };

  const handleLostPointerCapture = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    setIsDragging(false);
  };

  const handleQuickSpin = () => {
    if (
      !isTargetShooter ||
      revolverState.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current
    ) {
      return;
    }
    const impulse = (Math.random() > 0.25 ? 1 : -1) * (24 + Math.random() * 16);
    velocityRef.current = impulse;
    hasSettledRef.current = false;
    setIsSpinning(true);
    audio.playRevolverRatchetClick(1.1);
    invokeSpinRevolver(
      revolverState.eventId,
      impulse,
      angleRef.current,
      `cspin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      false
    );
  };

  const handleTriggerClick = () => {
    if (
      !isTargetShooter ||
      revolverState.shotResolved ||
      hasRequestedPull ||
      isLockedForShotRef.current ||
      isDragging ||
      isSpinning
    ) {
      return;
    }
    isLockedForShotRef.current = true;
    setHasRequestedPull(true);
    audio.playHammerCock();
    invokePullRevolver(revolverState.eventId);
  };

  const isImpactBang = resolveStage === 'IMPACT' && revolverState.fired;
  const isImpactClick = resolveStage === 'IMPACT' && !revolverState.fired;
  const isCylinderMoving = isDragging || isSpinning;
  const currentTopChamberIdx = getTopChamberIndex(cylinderAngle);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none transition-colors duration-300 ${
        isImpactBang
          ? 'bg-red-950/90'
          : isImpactClick
          ? 'bg-stone-950/90'
          : 'bg-black/85 backdrop-blur-md'
      }`}
    >
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl border-2 px-6 py-6 sm:px-8 sm:py-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.95)] transition-all duration-300 ${
          isImpactBang
            ? 'bg-gradient-to-b from-red-950 via-[#220909] to-stone-950 border-amber-400 shadow-[0_0_80px_rgba(239,68,68,0.6)] scale-[1.02]'
            : isImpactClick
            ? 'bg-gradient-to-b from-stone-900 via-[#111924] to-stone-950 border-emerald-400/80 shadow-[0_0_65px_rgba(16,185,129,0.35)]'
            : 'bg-gradient-to-b from-[#0e1b2e] via-[#111622] to-[#0a0d14] border-sky-400/75 shadow-[0_0_65px_rgba(56,189,248,0.28)]'
        }`}
      >
        {/* Top Header with REVOLVER Card Artwork Badge */}
        <div className="flex flex-col items-center gap-2 mb-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/90 border border-sky-400/50 text-sky-300 text-xs font-black uppercase tracking-[0.18em]">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {revolverState.isReflected
                ? `🪞 REVÓLVER REFLEJADO POR ${revolverState.actorPlayerName}`
                : `CARTA ESPECIAL • REVÓLVER DE ${revolverState.actorPlayerName}`}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-1">
            <img
              src={CANTINA_CARD_ASSETS.REVOLVER}
              alt="Revólver"
              onError={() =>
                logCantinaCardAssetError('REVOLVER', CANTINA_CARD_ASSETS.REVOLVER)
              }
              className="w-11 h-16 object-contain rounded-lg border border-sky-400/50 shadow-lg bg-stone-950"
            />
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-amber-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {isTargetShooter
                  ? '¡TE APUNTAN CON EL REVÓLVER!'
                  : `${revolverState.shooterPlayerName} ANTE EL REVÓLVER`}
              </h2>
              <p className="text-xs font-bold text-sky-200/85 uppercase tracking-wider mt-0.5">
                ¡BANG! = Roba +5 cartas &bull; ¡CLICK! = Se salva (0 cartas)
              </p>
            </div>
          </div>
        </div>

        {/* Interactive 6-Chamber Cadena Cylinder */}
        <div className="relative flex flex-col items-center justify-center my-3">
          <div className="z-20 flex flex-col items-center pointer-events-none -mb-1.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-300/90 mb-0.5">
              CAÑÓN / 12 EN PUNTO
            </span>
            <div
              className={`w-9 h-7 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center transition-transform duration-150 ${
                resolveStage === 'TENSION' || hasRequestedPull
                  ? '-translate-y-1.5 scale-110 bg-amber-500 border-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.9)]'
                  : isImpactBang
                  ? 'translate-y-2 bg-red-500 border-yellow-200 shadow-[0_0_28px_rgba(239,68,68,1)]'
                  : isImpactClick
                  ? 'translate-y-1.5 bg-emerald-500 border-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.8)]'
                  : 'bg-stone-800 border-sky-400/75 shadow-md'
              }`}
            >
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-sky-100" />
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className={`absolute -inset-4 rounded-full blur-xl pointer-events-none transition-opacity duration-300 ${
                isImpactBang
                  ? 'bg-red-500/60 opacity-100'
                  : isImpactClick
                  ? 'bg-emerald-500/35 opacity-100'
                  : isCylinderMoving
                  ? 'bg-sky-500/35 opacity-100'
                  : 'bg-sky-500/15 opacity-75'
              }`}
            />

            <div
              style={{
                transform: 'translateY(-64px)',
              }}
              className={`absolute z-30 w-14 h-14 rounded-full border-2 pointer-events-none transition-all duration-200 ${
                isImpactBang
                  ? 'border-amber-300 shadow-[0_0_28px_rgba(239,68,68,0.95)] scale-110'
                  : isImpactClick
                  ? 'border-emerald-400 shadow-[0_0_22px_rgba(16,185,129,0.8)] scale-105'
                  : resolveStage === 'TENSION'
                  ? 'border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)] scale-105'
                  : 'border-sky-400/60 border-dashed'
              }`}
            />

            <div
              ref={cylinderRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointerDrag}
              onPointerCancel={finishPointerDrag}
              onLostPointerCapture={handleLostPointerCapture}
              style={{
                transform: `rotate(${cylinderAngle}deg) scale(${ratchetTick ? 1.02 : 1})`,
                touchAction: 'none',
              }}
              className={`relative w-52 h-52 sm:w-56 sm:h-56 rounded-full border-[5px] flex items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.9),0_14px_35px_rgba(0,0,0,0.85)] transition-colors ${
                isTargetShooter && !revolverState.shotResolved && !hasRequestedPull
                  ? 'cursor-grab active:cursor-grabbing border-sky-400/85 bg-gradient-to-br from-slate-700 via-slate-800 to-stone-950 hover:border-sky-300'
                  : isImpactBang
                  ? 'border-red-500 bg-gradient-to-br from-red-950 via-stone-900 to-black'
                  : isImpactClick
                  ? 'border-emerald-500/80 bg-gradient-to-br from-stone-800 via-stone-900 to-black'
                  : 'border-slate-600 bg-gradient-to-br from-slate-800 via-stone-900 to-stone-950'
              }`}
            >
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const fluteAngle = i * 60 + 30;
                return (
                  <div
                    key={`cflute_${i}`}
                    style={{
                      transform: `rotate(${fluteAngle}deg) translateY(-86px)`,
                    }}
                    className="absolute w-5 h-3 rounded-full bg-black/55 border border-white/5 pointer-events-none"
                  />
                );
              })}

              {CHAMBER_BASE_ANGLES_DEG.map((angleDeg, idx) => {
                const rad = (angleDeg * Math.PI) / 180;
                const radius = 64;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;
                const isCurrentlyAtTop = idx === currentTopChamberIdx;

                let chamberStyle =
                  'bg-stone-950 border-sky-500/50 text-sky-200/80 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)]';

                if (isCurrentlyAtTop && isImpactBang) {
                  chamberStyle =
                    'bg-gradient-to-br from-yellow-300 via-amber-500 to-red-600 border-white text-black shadow-[0_0_24px_rgba(239,68,68,1)] scale-110';
                } else if (isCurrentlyAtTop && isImpactClick) {
                  chamberStyle =
                    'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.6)]';
                } else if (isCurrentlyAtTop) {
                  chamberStyle =
                    'bg-gradient-to-br from-sky-800/50 via-stone-950 to-black border-sky-300 text-sky-200 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95),0_0_12px_rgba(56,189,248,0.35)]';
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
                      <span className="text-[11px] font-black text-red-950">
                        +{revolverState.penaltyCardsCount || 5}🃏
                      </span>
                    ) : isCurrentlyAtTop && isImpactClick ? (
                      <span className="text-[10px] font-black text-emerald-300">
                        VACÍA
                      </span>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-sky-400/50 bg-gradient-to-br from-sky-500/30 to-sky-900/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-sky-300/70" />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500/40 via-slate-800 to-stone-950 border-2 border-sky-400/60 shadow-inner flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-sky-300/50 border border-sky-100/50" />
              </div>
            </div>
          </div>

          {resolveStage === 'WAITING' && !hasRequestedPull && (
            <div className="mt-3 flex items-center justify-center gap-3">
              {isTargetShooter ? (
                <>
                  <span className="text-xs font-bold text-sky-200/85">
                    Gira el tambor antes de probar suerte
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickSpin}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-sky-400/50 text-sky-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`}
                    />
                    GIRAR TAMBOR
                  </button>
                </>
              ) : (
                <span className="text-xs font-bold text-sky-200/80 uppercase tracking-wider">
                  {isSpinning
                    ? `¡${revolverState.shooterPlayerName} ESTÁ GIRANDO EL TAMBOR!`
                    : `${revolverState.shooterPlayerName} DEBE APRETAR EL GATILLO`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action or Verdict Area */}
        <div className="mt-4 min-h-[90px] flex flex-col items-center justify-center">
          {resolveStage === 'WAITING' && (
            <>
              {isTargetShooter ? (
                <div className="w-full flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={hasRequestedPull || isCylinderMoving}
                    onClick={handleTriggerClick}
                    className="w-full max-w-xs py-3.5 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wider text-stone-950 bg-gradient-to-r from-sky-400 via-amber-400 to-sky-400 hover:from-sky-300 hover:to-amber-300 border-2 border-white/80 shadow-[0_10px_30px_rgba(56,189,248,0.45)] active:scale-95 transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {isCylinderMoving
                      ? 'GIRANDO EL TAMBOR...'
                      : hasRequestedPull
                      ? 'PROBANDO CÁMARA...'
                      : 'APRETAR GATILLO'}
                  </button>
                  <p className="text-[11px] font-bold text-sky-200/70 uppercase tracking-widest">
                    3 de 6 recámaras cargadas &bull; Si dispara, robas 5 cartas
                  </p>
                </div>
              ) : (
                <div className="w-full py-3.5 px-5 rounded-2xl bg-black/55 border border-sky-500/35 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2 text-sky-300 font-black text-sm sm:text-base uppercase tracking-wider animate-pulse">
                    <Crosshair className="w-4 h-4 text-amber-400" />
                    ESPERANDO A QUE {revolverState.shooterPlayerName} APRIETE EL GATILLO...
                  </div>
                </div>
              )}
            </>
          )}

          {resolveStage === 'TENSION' && (
            <div className="w-full py-3.5 px-5 rounded-2xl bg-sky-950/45 border border-sky-400/50 flex flex-col items-center gap-1">
              <div className="text-lg sm:text-xl font-black text-amber-300 uppercase tracking-[0.2em] animate-pulse">
                ¡MARTILLO CAYENDO...!
              </div>
            </div>
          )}

          {resolveStage === 'IMPACT' && (
            <div
              className={`w-full py-3.5 px-5 rounded-2xl border-2 transition-all duration-300 ${
                revolverState.fired
                  ? 'bg-red-950/90 border-amber-400 shadow-[0_0_35px_rgba(239,68,68,0.5)]'
                  : 'bg-emerald-950/80 border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
              }`}
            >
              <div className="flex items-center justify-center gap-2.5 mb-1">
                {revolverState.fired ? (
                  <>
                    <Zap className="w-6 h-6 text-amber-300 animate-bounce" />
                    <span className="text-xl sm:text-2xl font-black text-amber-200 uppercase tracking-wider">
                      ¡BANG!{' '}
                      {isTargetShooter
                        ? `¡ROBAS +${revolverState.penaltyCardsCount || 5} CARTAS!`
                        : `${revolverState.shooterPlayerName} ROBA +${
                            revolverState.penaltyCardsCount || 5
                          } CARTAS`}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6 text-emerald-300" />
                    <span className="text-xl sm:text-2xl font-black text-emerald-200 uppercase tracking-wider">
                      ¡CLICK!{' '}
                      {isTargetShooter
                        ? '¡TE HAS SALVADO!'
                        : `${revolverState.shooterPlayerName} SE SALVA`}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-200">
                {revolverState.fired
                  ? 'Cámara cargada — Las cartas de penalización vuelan desde el mazo'
                  : 'Cámara vacía — 0 cartas robadas'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
