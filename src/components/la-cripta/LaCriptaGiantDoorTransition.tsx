import React, { useEffect, useState } from 'react';
import {
  CriptaCanonicalRoomType,
  CriptaDungeonId,
} from '../../types/laCripta';
import { CRIPTA_DUNGEONS_REGISTRY } from '../../data/la-cripta/criptaCatalog';
import {
  LaCriptaRoomTypeIcon,
  ROOM_TYPE_LABELS,
} from './LaCriptaRoomProgressTracker';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

export interface LaCriptaGiantDoorTransitionProps {
  transition: {
    active: boolean;
    fromRoomIndex: number;
    toRoomIndex: number;
    fromDungeonId: CriptaDungeonId;
    targetRoomType: CriptaCanonicalRoomType;
    targetRoomTitle: string;
    isEnteringMiniboss: boolean;
    isReturningToDoors: boolean;
    startedAt: number;
  } | null | undefined;
  totalRooms?: number;
}

/**
 * Physical Giant Dungeon Door Transition Overlay (Sections 18–35).
 * Physically closes two monumental biome-styled stone/iron door leaves across the screen,
 * locks the central seal while the authoritative room swaps, and parts open into the new chamber.
 */
export const LaCriptaGiantDoorTransition: React.FC<LaCriptaGiantDoorTransitionProps> = ({
  transition,
  totalRooms = 6,
}) => {
  const [stage, setStage] = useState<'CLOSING' | 'SEALED' | 'OPENING'>('CLOSING');

  useEffect(() => {
    if (!transition?.active) return;

    setStage('CLOSING');
    laCriptaAudio.playRoomDoorClose();

    const sealedTimer = window.setTimeout(() => {
      setStage('SEALED');
    }, 420);

    const openTimer = window.setTimeout(() => {
      setStage('OPENING');
      laCriptaAudio.playRoomDoorOpen(Boolean(transition.isEnteringMiniboss));
    }, 860);

    return () => {
      window.clearTimeout(sealedTimer);
      window.clearTimeout(openTimer);
    };
  }, [transition?.active, transition?.startedAt, transition?.isEnteringMiniboss]);

  if (!transition?.active) return null;

  const dungeon =
    CRIPTA_DUNGEONS_REGISTRY[transition.fromDungeonId] ||
    CRIPTA_DUNGEONS_REGISTRY.catacumbas_del_rey;

  const { stone, stoneDark, highlight, glow, secondary } = dungeon.palette;
  const isMiniboss = Boolean(transition.isEnteringMiniboss);
  const isReturning = Boolean(transition.isReturningToDoors);

  const primaryAccent = isMiniboss
    ? '#C93B5B'
    : isReturning
    ? '#FFD166'
    : glow;
  const secondaryAccent = isMiniboss
    ? '#FFD166'
    : isReturning
    ? '#E7A54A'
    : highlight;

  // Compute horizontal slide transform for left and right heavy stone door slabs
  const leftLeafStyle: React.CSSProperties = {
    transform:
      stage === 'CLOSING'
        ? 'translateX(0%)'
        : stage === 'SEALED'
        ? 'translateX(0%)'
        : 'translateX(-102%)',
    transition:
      stage === 'CLOSING'
        ? 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
        : stage === 'OPENING'
        ? 'transform 480ms cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none',
    backgroundColor: stoneDark,
    borderColor: primaryAccent,
  };

  const rightLeafStyle: React.CSSProperties = {
    transform:
      stage === 'CLOSING'
        ? 'translateX(0%)'
        : stage === 'SEALED'
        ? 'translateX(0%)'
        : 'translateX(102%)',
    transition:
      stage === 'CLOSING'
        ? 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
        : stage === 'OPENING'
        ? 'transform 480ms cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none',
    backgroundColor: stoneDark,
    borderColor: primaryAccent,
  };

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 overflow-hidden flex items-center justify-center select-none"
      aria-live="polite"
    >
      {/* Subtle dark backdrop while door is closed */}
      <div
        className={`absolute inset-0 bg-[#050408] transition-opacity duration-300 ${
          stage === 'OPENING' ? 'opacity-0' : 'opacity-85'
        }`}
      />

      {/* Top & Bottom Monumental Stone Arch Lintel Frame */}
      <div
        className="pointer-events-none absolute top-0 inset-x-0 h-8 sm:h-12 border-b-4 z-20 flex items-center justify-between px-6"
        style={{
          backgroundColor: '#09070D',
          borderColor: primaryAccent,
        }}
      >
        <span className="text-[9px] font-cripta-pixel tracking-widest uppercase text-[#D8C6A0]/70">
          {dungeon.name} · {dungeon.artTheme.doorMaterial}
        </span>
        <span
          className="text-[9px] font-cripta-pixel tracking-widest uppercase font-bold"
          style={{ color: secondaryAccent }}
        >
          {isReturning
            ? 'SALA DE LAS TRES PUERTAS'
            : isMiniboss
            ? '⚠ UMBRAL DEL GUARDIÁN'
            : `SALA ${transition.fromRoomIndex + 1} → SALA ${Math.min(
                totalRooms,
                transition.toRoomIndex + 1
              )}`}
        </span>
      </div>

      {/* LEFT GIANT DOOR SLAB */}
      <div
        style={leftLeafStyle}
        className="relative w-1/2 h-full border-r-4 flex flex-col justify-between p-4 sm:p-8 shadow-[18px_0_44px_rgba(0,0,0,0.95)] z-10"
      >
        {/* Crisp Pixel-Art Stone Courses & Iron Bands on Left Door Leaf */}
        <svg
          viewBox="0 0 120 200"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-90"
        >
          <rect x="0" y="0" width="120" height="200" fill={stoneDark} />
          {/* Inner recessed stone panel */}
          <rect x="10" y="14" width="104" height="172" fill={stone} />
          <rect x="16" y="22" width="92" height="156" fill="#0B0910" />

          {/* Heavy horizontal iron/bronze reinforcement bands */}
          {[32, 96, 160].map((by) => (
            <g key={by}>
              <rect x="0" y={by} width="120" height="10" fill="#241C2B" />
              <rect x="0" y={by + 2} width="120" height="6" fill={primaryAccent} opacity="0.55" />
              {/* Iron rivets */}
              {[14, 38, 62, 86, 106].map((rx) => (
                <rect key={rx} x={rx} y={by + 3} width="4" height="4" fill={secondaryAccent} />
              ))}
            </g>
          ))}

          {/* Biome Relief Motif on Left Door */}
          <rect x="36" y="54" width="56" height="32" fill={stone} />
          <rect x="40" y="58" width="48" height="24" fill={primaryAccent} opacity="0.35" />
          <rect x="36" y="116" width="56" height="32" fill={stone} />
          <rect x="40" y="120" width="48" height="24" fill={secondary} opacity="0.35" />

          {/* Half of the Central Lock Ring on the Right Edge (x=104..120) */}
          <rect x="102" y="80" width="18" height="40" fill="#140E1C" />
          <rect x="106" y="84" width="14" height="32" fill={primaryAccent} />
          <rect x="110" y="90" width="10" height="20" fill={secondaryAccent} />
        </svg>
      </div>

      {/* RIGHT GIANT DOOR SLAB */}
      <div
        style={rightLeafStyle}
        className="relative w-1/2 h-full border-l-4 flex flex-col justify-between p-4 sm:p-8 shadow-[-18px_0_44px_rgba(0,0,0,0.95)] z-10"
      >
        {/* Crisp Pixel-Art Stone Courses & Iron Bands on Right Door Leaf */}
        <svg
          viewBox="0 0 120 200"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          className="pointer-events-none absolute inset-0 w-full h-full opacity-90"
        >
          <rect x="0" y="0" width="120" height="200" fill={stoneDark} />
          {/* Inner recessed stone panel */}
          <rect x="6" y="14" width="104" height="172" fill={stone} />
          <rect x="12" y="22" width="92" height="156" fill="#0B0910" />

          {/* Heavy horizontal iron/bronze reinforcement bands */}
          {[32, 96, 160].map((by) => (
            <g key={by}>
              <rect x="0" y={by} width="120" height="10" fill="#241C2B" />
              <rect x="0" y={by + 2} width="120" height="6" fill={primaryAccent} opacity="0.55" />
              {/* Iron rivets */}
              {[10, 30, 54, 78, 102].map((rx) => (
                <rect key={rx} x={rx} y={by + 3} width="4" height="4" fill={secondaryAccent} />
              ))}
            </g>
          ))}

          {/* Biome Relief Motif on Right Door */}
          <rect x="28" y="54" width="56" height="32" fill={stone} />
          <rect x="32" y="58" width="48" height="24" fill={primaryAccent} opacity="0.35" />
          <rect x="28" y="116" width="56" height="32" fill={stone} />
          <rect x="32" y="120" width="48" height="24" fill={secondary} opacity="0.35" />

          {/* Half of the Central Lock Ring on the Left Edge (x=0..18) */}
          <rect x="0" y="80" width="18" height="40" fill="#140E1C" />
          <rect x="0" y="84" width="14" height="32" fill={primaryAccent} />
          <rect x="0" y="90" width="10" height="20" fill={secondaryAccent} />
        </svg>
      </div>

      {/* CENTRAL THRESHOLD SEAL & CHAMBER ANNOUNCEMENT CREST */}
      <div
        className={`pointer-events-none absolute z-30 flex flex-col items-center justify-center px-6 py-4 border-4 bg-[#0B0811]/95 shadow-[0_0_50px_rgba(0,0,0,0.98)] transition-all duration-300 max-w-md mx-4 text-center ${
          stage === 'OPENING'
            ? 'opacity-0 scale-90'
            : 'opacity-100 scale-100'
        }`}
        style={{
          borderColor: primaryAccent,
          boxShadow: `0 0 36px ${primaryAccent}66`,
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div
            className="w-8 h-8 border-2 flex items-center justify-center bg-[#150E1F]"
            style={{ borderColor: secondaryAccent }}
          >
            <LaCriptaRoomTypeIcon
              type={isMiniboss ? 'MINIBOSS' : transition.targetRoomType}
              color={secondaryAccent}
              size={18}
            />
          </div>
          <span
            className="text-[10px] font-cripta-pixel font-bold uppercase tracking-widest"
            style={{ color: primaryAccent }}
          >
            {isReturning
              ? '✦ PUERTA COMPLETADA ✦'
              : isMiniboss
              ? '⚠ CÁMARA DEL MINIJEFE ⚠'
              : `CRUZANDO PUERTA · SALA ${Math.min(
                  totalRooms,
                  transition.toRoomIndex + 1
                )} DE ${totalRooms}`}
          </span>
        </div>

        <div
          className="font-cripta-display text-lg sm:text-2xl font-black uppercase tracking-wider"
          style={{ color: secondaryAccent }}
        >
          {transition.targetRoomTitle}
        </div>

        <div className="mt-1 text-[10px] font-cripta-pixel text-[#D8C6A0]/80">
          {isReturning
            ? 'El grupo cruza el umbral ancestral de regreso a las Tres Puertas...'
            : isMiniboss
            ? 'Un poderoso guardián custodia la salida final de esta mazmorra.'
            : `Tipo de cámara: ${
                ROOM_TYPE_LABELS[transition.targetRoomType] ||
                transition.targetRoomType
              }`}
        </div>
      </div>
    </div>
  );
};
