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
 * Full-Viewport Physical Dungeon Door Transition (100vw x 100vh).
 * 1. ENTERING / CLOSING (0 -> 450ms): Left & right biome-styled door leaves slide in from off-screen and slam shut.
 * 2. SEALED / LOCKED (450 -> 1080ms): Doors remain closed across 100vw x 100vh with impact tremor and glowing central seal while the room swaps underneath.
 * 3. OPENING (1080 -> 1620ms): Doors part open to reveal the new room.
 */
export const LaCriptaGiantDoorTransition: React.FC<LaCriptaGiantDoorTransitionProps> = ({
  transition,
  totalRooms = 6,
}) => {
  const [stage, setStage] = useState<'ENTERING' | 'CLOSING' | 'SEALED' | 'OPENING'>('ENTERING');
  const [impactShake, setImpactShake] = useState(false);

  useEffect(() => {
    if (!transition?.active) {
      setStage('ENTERING');
      setImpactShake(false);
      return;
    }

    setStage('ENTERING');
    setImpactShake(false);

    // Next animation frame: slide leaves from offscreen (-101% / +101%) to closed (0%)
    const rafId = window.requestAnimationFrame(() => {
      setStage('CLOSING');
      laCriptaAudio.playRoomDoorClose();
    });

    // At 450ms: leaves meet and seal completely across the viewport
    const sealTimer = window.setTimeout(() => {
      setStage('SEALED');
      setImpactShake(true);
      window.setTimeout(() => setImpactShake(false), 140);
    }, 450);

    // At 1020ms: after room state has swapped behind the closed doors, part the door leaves open
    const openTimer = window.setTimeout(() => {
      setStage('OPENING');
      laCriptaAudio.playRoomDoorOpen(Boolean(transition.isEnteringMiniboss));
    }, 1020);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(sealTimer);
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

  const isClosedState = stage === 'CLOSING' || stage === 'SEALED';

  const leftLeafStyle: React.CSSProperties = {
    transform:
      stage === 'ENTERING'
        ? 'translate3d(-101%, 0, 0)'
        : isClosedState
        ? 'translate3d(0%, 0, 0)'
        : 'translate3d(-102%, 0, 0)',
    transition:
      stage === 'ENTERING'
        ? 'none'
        : stage === 'CLOSING'
        ? 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'transform 540ms cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: stoneDark,
    borderColor: primaryAccent,
    willChange: 'transform',
  };

  const rightLeafStyle: React.CSSProperties = {
    transform:
      stage === 'ENTERING'
        ? 'translate3d(101%, 0, 0)'
        : isClosedState
        ? 'translate3d(0%, 0, 0)'
        : 'translate3d(102%, 0, 0)',
    transition:
      stage === 'ENTERING'
        ? 'none'
        : stage === 'CLOSING'
        ? 'transform 440ms cubic-bezier(0.22, 1, 0.36, 1)'
        : 'transform 540ms cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: stoneDark,
    borderColor: primaryAccent,
    willChange: 'transform',
  };

  const renderBiomeDoorLeafSvg = (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    const dId = dungeon.id;

    return (
      <svg
        viewBox="0 0 120 200"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="pointer-events-none absolute inset-0 w-full h-full opacity-100"
      >
        {/* Base Slab */}
        <rect x="0" y="0" width="120" height="200" fill={stoneDark} />
        <rect x={isLeft ? 8 : 6} y="10" width="106" height="180" fill={stone} />
        <rect x={isLeft ? 14 : 12} y="18" width="94" height="164" fill="#0A0810" />

        {/* Biome-Specific Architectural Relief on the Full-Screen Door Leaves */}
        {dId === 'la_colmena' ? (
          <g>
            {[36, 76, 116, 152].map((hy, idx) => (
              <polygon
                key={hy}
                points={`30,${hy} 55,${hy - 10} 85,${hy - 10} 105,${hy} 85,${hy + 12} 55,${hy + 12}`}
                fill={idx % 2 === 0 ? '#D97706' : '#78350F'}
                stroke="#1C0F05"
                strokeWidth="2"
              />
            ))}
          </g>
        ) : dId === 'palacio_de_los_espejos' || dId === 'cripta_de_cristal' ? (
          <g>
            <polygon
              points="22,26 98,26 98,174 22,174"
              fill={stone}
              stroke={secondaryAccent}
              strokeWidth="2"
            />
            <polygon points="26,32 94,88 94,116 26,60" fill="#FFFFFF" opacity="0.22" />
            <polygon points="26,104 94,160 94,172 26,116" fill={secondaryAccent} opacity="0.28" />
          </g>
        ) : dId === 'prision_maldita' || dId === 'castillo_del_verdugo' ? (
          <g>
            {[26, 46, 66, 86].map((bx) => (
              <rect key={bx} x={bx} y="18" width="6" height="164" fill="#2D3748" />
            ))}
            <rect x="14" y="54" width="94" height="16" fill="#741323" opacity="0.7" />
            <rect x="14" y="128" width="94" height="16" fill="#741323" opacity="0.7" />
          </g>
        ) : dId === 'cementerio_de_gigantes' || dId === 'catacumbas_del_rey' ? (
          <g>
            {[42, 76, 110, 144].map((ry) => (
              <rect
                key={ry}
                x="22"
                y={ry}
                width="76"
                height="12"
                fill="#D5CEBC"
                opacity="0.75"
              />
            ))}
          </g>
        ) : (
          <g>
            <rect x="28" y="48" width="64" height="38" fill={stone} />
            <rect x="32" y="52" width="56" height="30" fill={primaryAccent} opacity="0.35" />
            <rect x="28" y="114" width="64" height="38" fill={stone} />
            <rect x="32" y="118" width="56" height="30" fill={secondary} opacity="0.35" />
          </g>
        )}

        {/* Heavy Horizontal Reinforcing Crossbars & Rivets */}
        {[28, 95, 162].map((by) => (
          <g key={by}>
            <rect x="0" y={by} width="120" height="10" fill="#1E1726" />
            <rect x="0" y={by + 2} width="120" height="6" fill={primaryAccent} opacity="0.6" />
            {[14, 38, 62, 86, 106].map((rx) => (
              <rect key={rx} x={rx} y={by + 3} width="4" height="4" fill={secondaryAccent} />
            ))}
          </g>
        ))}

        {/* Central Interlocking Lock Flange */}
        <rect x={isLeft ? 102 : 0} y="76" width="18" height="48" fill="#140E1C" />
        <rect x={isLeft ? 106 : 0} y="82" width="14" height="36" fill={primaryAccent} />
        <rect x={isLeft ? 110 : 0} y="90" width="10" height="20" fill={secondaryAccent} />
      </svg>
    );
  };

  return (
    <div
      className={`pointer-events-auto fixed inset-0 w-screen h-screen z-50 overflow-hidden flex items-center justify-center select-none ${
        impactShake ? 'translate-x-0.5' : ''
      }`}
      aria-live="polite"
    >
      {/* Solid occlusion only while the physical door leaves are sealed */}
      {stage === 'SEALED' && (
        <div className="pointer-events-none absolute inset-0 bg-[#050408]" />
      )}

      {/* FULL-SCREEN GIANT DOUBLE-LEAF DOOR CONTAINER */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Top Monumental Lintel Bar (slides with the door closure) */}
        <div
          className={`pointer-events-none absolute top-0 inset-x-0 h-9 sm:h-12 border-b-2 z-30 flex items-center justify-between px-6 transition-transform duration-300 ${
            isClosedState ? 'translate-y-0' : '-translate-y-full'
          }`}
          style={{
            backgroundColor: '#09070D',
            borderColor: primaryAccent,
          }}
        >
          <span className="text-[9px] font-cripta-pixel tracking-widest uppercase text-[#D8C6A0]">
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

        {/* LEFT GIANT BIOME DOOR LEAF (50vw x 100vh) */}
        <div
          style={leftLeafStyle}
          className="relative w-1/2 h-full border-r-2 flex flex-col justify-between shadow-[12px_0_32px_rgba(0,0,0,0.95)] z-10"
        >
          {renderBiomeDoorLeafSvg('left')}
        </div>

        {/* RIGHT GIANT BIOME DOOR LEAF (50vw x 100vh) */}
        <div
          style={rightLeafStyle}
          className="relative w-1/2 h-full border-l-2 flex flex-col justify-between shadow-[-12px_0_32px_rgba(0,0,0,0.95)] z-10"
        >
          {renderBiomeDoorLeafSvg('right')}
        </div>
      </div>

      {/* CENTRAL THRESHOLD SEAL & CHAMBER ANNOUNCEMENT CREST (Only visible while doors are closed) */}
      <div
        className={`pointer-events-none absolute z-40 flex flex-col items-center justify-center px-6 py-4 border-2 bg-[#0B0811] shadow-[0_12px_36px_rgba(0,0,0,0.95)] transition-all duration-200 max-w-md mx-4 text-center ${
          stage === 'SEALED'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95'
        }`}
        style={{
          borderColor: secondaryAccent,
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
              : `SALA ${Math.min(totalRooms, transition.toRoomIndex + 1)} DE ${totalRooms}`}
          </span>
        </div>

        <div
          className="font-cripta-display text-lg sm:text-2xl font-black uppercase tracking-wider"
          style={{ color: secondaryAccent }}
        >
          {transition.targetRoomTitle}
        </div>

        <div className="mt-1 text-[10px] font-cripta-pixel text-[#D8C6A0]/85">
          {isReturning
            ? 'El grupo cruza el umbral ancestral de regreso a las Tres Puertas...'
            : isMiniboss
            ? 'Un poderoso guardián custodia la salida final de esta mazmorra.'
            : `Cámara: ${
                ROOM_TYPE_LABELS[transition.targetRoomType] ||
                transition.targetRoomType
              }`}
        </div>
      </div>
    </div>
  );
};
