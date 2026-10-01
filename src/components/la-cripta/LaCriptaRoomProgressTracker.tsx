import React from 'react';
import {
  CriptaCanonicalRoomType,
  CriptaDungeonDefinition,
  CriptaDungeonLengthTier,
  CriptaDungeonRoom,
} from '../../types/laCripta';
import { LaCriptaDoorCounterBadge } from './LaCriptaItemRelicArt';

interface LaCriptaRoomTypeIconProps {
  type: CriptaCanonicalRoomType | 'UNEXPLORED';
  color?: string;
  size?: number;
}

export const ROOM_TYPE_LABELS: Record<CriptaCanonicalRoomType, string> = {
  COMBAT: 'Combate',
  ELITE: 'Élite',
  TREASURE: 'Tesoro',
  LOOT: 'Botín',
  EVENT: 'Evento',
  DECISION: 'Decisión',
  SHOP: 'Mercader',
  REST: 'Descanso',
  SHRINE: 'Santuario',
  TRAP: 'Trampa',
  PUZZLE: 'Acertijo',
  MINIGAME: 'Minijuego',
  SECRET: 'Secreto',
  MINIBOSS: 'Minijefe',
  BOSS: 'Jefe Final',
};

/**
 * Crisp 12x12 pixel-art SVG icon for each canonical room category.
 */
export const LaCriptaRoomTypeIcon: React.FC<LaCriptaRoomTypeIconProps> = ({
  type,
  color = '#D8C6A0',
  size = 16,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className="shrink-0"
      aria-hidden="true"
    >
      {type === 'MINIGAME' && (
        <g fill={color}>
          {/* Runic Roulette / Mechanism Wheel */}
          <rect x="4" y="1" width="4" height="2" />
          <rect x="4" y="9" width="4" height="2" />
          <rect x="1" y="4" width="2" height="4" />
          <rect x="9" y="4" width="2" height="4" />
          <rect x="3" y="3" width="6" height="6" />
          <rect x="5" y="5" width="2" height="2" fill="#E7A54A" />
        </g>
      )}
      {type === 'UNEXPLORED' && (
        <g fill={color}>
          <rect x="4" y="2" width="4" height="1" />
          <rect x="3" y="3" width="2" height="1" />
          <rect x="7" y="3" width="2" height="2" />
          <rect x="5" y="5" width="2" height="2" />
          <rect x="5" y="9" width="2" height="2" />
        </g>
      )}

      {type === 'COMBAT' && (
        <g fill={color}>
          {/* Crossed Pixel Swords */}
          <rect x="2" y="2" width="2" height="2" />
          <rect x="4" y="4" width="2" height="2" />
          <rect x="6" y="6" width="2" height="2" />
          <rect x="8" y="8" width="2" height="2" />
          <rect x="8" y="2" width="2" height="2" />
          <rect x="6" y="4" width="2" height="2" />
          <rect x="4" y="6" width="2" height="2" />
          <rect x="2" y="8" width="2" height="2" />
        </g>
      )}

      {type === 'ELITE' && (
        <g fill={color}>
          {/* Horned Skull */}
          <rect x="1" y="2" width="2" height="2" />
          <rect x="9" y="2" width="2" height="2" />
          <rect x="3" y="3" width="6" height="5" />
          <rect x="4" y="8" width="4" height="2" />
          <rect x="4" y="5" width="1" height="2" fill="#0B0A0E" />
          <rect x="7" y="5" width="1" height="2" fill="#0B0A0E" />
        </g>
      )}

      {type === 'TREASURE' && (
        <g fill={color}>
          {/* Pixel Treasure Chest */}
          <rect x="2" y="3" width="8" height="3" />
          <rect x="2" y="7" width="8" height="3" />
          <rect x="5" y="5" width="2" height="3" fill="#E7A54A" />
        </g>
      )}

      {type === 'LOOT' && (
        <g fill={color}>
          {/* Coin Pouch */}
          <rect x="4" y="2" width="4" height="2" />
          <rect x="3" y="4" width="6" height="6" />
          <rect x="5" y="6" width="2" height="2" fill="#0B0A0E" />
        </g>
      )}

      {type === 'EVENT' && (
        <g fill={color}>
          {/* Exclamation Rune */}
          <rect x="5" y="2" width="2" height="5" />
          <rect x="5" y="9" width="2" height="2" />
          <rect x="2" y="5" width="1" height="2" opacity="0.6" />
          <rect x="9" y="5" width="1" height="2" opacity="0.6" />
        </g>
      )}

      {type === 'DECISION' && (
        <g fill={color}>
          {/* Forked Path */}
          <rect x="5" y="7" width="2" height="4" />
          <rect x="3" y="4" width="2" height="3" />
          <rect x="7" y="4" width="2" height="3" />
          <rect x="2" y="2" width="2" height="2" />
          <rect x="8" y="2" width="2" height="2" />
        </g>
      )}

      {type === 'SHOP' && (
        <g fill={color}>
          {/* Merchant Lantern / Coin */}
          <rect x="4" y="1" width="4" height="1" />
          <rect x="3" y="3" width="6" height="6" />
          <rect x="5" y="4" width="2" height="4" fill="#0B0A0E" />
          <rect x="3" y="10" width="6" height="1" />
        </g>
      )}

      {type === 'REST' && (
        <g fill={color}>
          {/* Campfire */}
          <rect x="5" y="2" width="2" height="2" />
          <rect x="4" y="4" width="4" height="3" />
          <rect x="3" y="7" width="6" height="1" />
          <rect x="2" y="9" width="8" height="2" fill="#8F263D" />
        </g>
      )}

      {type === 'SHRINE' && (
        <g fill={color}>
          {/* Sacred Chalice / Altar */}
          <rect x="3" y="2" width="6" height="3" />
          <rect x="4" y="5" width="4" height="2" />
          <rect x="5" y="7" width="2" height="2" />
          <rect x="3" y="9" width="6" height="2" />
        </g>
      )}

      {type === 'TRAP' && (
        <g fill={color}>
          {/* Floor Spikes */}
          <rect x="2" y="6" width="2" height="3" />
          <rect x="5" y="4" width="2" height="5" />
          <rect x="8" y="6" width="2" height="3" />
          <rect x="1" y="9" width="10" height="2" />
        </g>
      )}

      {type === 'PUZZLE' && (
        <g fill={color}>
          {/* Rune Key / Diamond */}
          <rect x="5" y="1" width="2" height="2" />
          <rect x="3" y="3" width="6" height="3" />
          <rect x="5" y="6" width="2" height="5" />
          <rect x="7" y="8" width="2" height="1" />
          <rect x="7" y="10" width="2" height="1" />
        </g>
      )}

      {type === 'SECRET' && (
        <g fill={color}>
          {/* Arcane Eye */}
          <rect x="3" y="3" width="6" height="1" />
          <rect x="1" y="5" width="10" height="2" />
          <rect x="3" y="8" width="6" height="1" />
          <rect x="5" y="5" width="2" height="2" fill="#0B0A0E" />
        </g>
      )}

      {type === 'MINIBOSS' && (
        <g fill={color}>
          {/* Warden Horned Crest & Glowing Eyes */}
          <rect x="1" y="1" width="2" height="3" fill="#E7A54A" />
          <rect x="9" y="1" width="2" height="3" fill="#E7A54A" />
          <rect x="3" y="2" width="6" height="6" />
          <rect x="4" y="8" width="4" height="3" />
          <rect x="3" y="4" width="2" height="2" fill="#C93B5B" />
          <rect x="7" y="4" width="2" height="2" fill="#C93B5B" />
        </g>
      )}

      {type === 'BOSS' && (
        <g fill={color}>
          {/* Crowned Boss Skull */}
          <rect x="2" y="1" width="2" height="2" fill="#E7A54A" />
          <rect x="5" y="1" width="2" height="2" fill="#E7A54A" />
          <rect x="8" y="1" width="2" height="2" fill="#E7A54A" />
          <rect x="2" y="3" width="8" height="5" />
          <rect x="3" y="8" width="6" height="3" />
          <rect x="3" y="5" width="2" height="2" fill="#0B0A0E" />
          <rect x="7" y="5" width="2" height="2" fill="#0B0A0E" />
        </g>
      )}
    </svg>
  );
};

interface LaCriptaRoomProgressTrackerProps {
  dungeon: CriptaDungeonDefinition;
  floor: number;
  rooms: CriptaDungeonRoom[];
  currentRoomIndex: number;
  inSecretRoom?: boolean;
  partyGold: number;
  lengthTier?: CriptaDungeonLengthTier;
  completedDoorCount?: number;
}

export const LaCriptaRoomProgressTracker: React.FC<LaCriptaRoomProgressTrackerProps> = ({
  dungeon,
  floor,
  rooms,
  currentRoomIndex,
  inSecretRoom = false,
  partyGold,
  lengthTier = 'MEDIA',
  completedDoorCount = 0,
}) => {
  return (
    <div className="w-full bg-[#0E0A14]/95 border-2 border-[#282039] px-3 sm:px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.85)]">
      {/* Row 1: Dungeon Title, Floor, Door Counter, Room Counter & Party Gold */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 shrink-0"
            style={{ backgroundColor: dungeon.palette.glow }}
          />
          <span
            className="font-cripta-display text-sm sm:text-base font-bold tracking-wider uppercase truncate"
            style={{ color: dungeon.palette.highlight }}
          >
            {dungeon.name}
          </span>
          <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]/70 shrink-0">
            · PUERTA {Math.min(3, completedDoorCount + 1)}/3
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#19111D] border border-[#282039] text-[9px] font-cripta-pixel text-[#D8C6A0]/75">
            {lengthTier} ({rooms.length} SALAS)
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <LaCriptaDoorCounterBadge completedDoorCount={completedDoorCount} compact />
          {inSecretRoom && (
            <span className="px-2 py-0.5 bg-[#282039] border border-[#9B72CF] text-[10px] font-cripta-pixel text-[#9B72CF] animate-pulse">
              ★ CÁMARA SECRETA
            </span>
          )}
          <div className="px-2 py-0.5 bg-[#19111D] border border-[#E7A54A]/60 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#E7A54A] inline-block" />
            <span className="text-[10px] font-cripta-pixel text-[#E7A54A] font-bold">
              ORO: {partyGold}
            </span>
          </div>
          <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]">
            SALA {Math.min(rooms.length, currentRoomIndex + 1)}/{rooms.length}
          </span>
        </div>
      </div>

      {/* Row 2: Horizontal Connected Node Sequence [⚔]—[CHEST]—[!]—[●]—[?]—[MINIJEFE] */}
      <div className="w-full overflow-x-auto pb-0.5">
        <div className="flex items-center min-w-max gap-1">
          {rooms.map((rm, idx) => {
            const isCurrent = idx === currentRoomIndex && !inSecretRoom;
            const isCompleted = rm.resolved && idx < currentRoomIndex;
            const isBossNode = rm.type === 'BOSS' || rm.type === 'MINIBOSS' || rm.isMinibossRoom;
            // Final Miniboss / Boss node is always iconic on the dungeon track
            const isRevealed = rm.revealed || isCompleted || isCurrent || isBossNode;

            const borderColor = isCurrent
              ? '#E7A54A'
              : isCompleted
              ? dungeon.palette.glow
              : isBossNode
              ? '#C93B5B'
              : '#282039';

            const bgColor = isCurrent
              ? '#24182E'
              : isCompleted
              ? '#15101D'
              : isBossNode
              ? '#1C0B13'
              : '#09070D';

            const iconColor = isCurrent
              ? '#E7A54A'
              : isCompleted
              ? dungeon.palette.highlight
              : isBossNode
              ? '#C93B5B'
              : '#D8C6A0';

            const labelTitle = isRevealed
              ? `Sala ${idx + 1}: ${ROOM_TYPE_LABELS[rm.type] || rm.type} (${rm.title})`
              : isBossNode
              ? `Sala ${idx + 1}: Cámara del Minijefe`
              : `Sala ${idx + 1}: Inexplorada (?)`;

            return (
              <React.Fragment key={rm.id}>
                <div
                  title={labelTitle}
                  className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 border-2 transition-all ${
                    isCurrent ? 'scale-110 z-10' : ''
                  }`}
                  style={{
                    borderColor,
                    backgroundColor: bgColor,
                    boxShadow: isCurrent
                      ? '0 0 12px rgba(231, 165, 74, 0.55)'
                      : 'none',
                  }}
                >
                  {isRevealed ? (
                    <LaCriptaRoomTypeIcon
                      type={rm.type}
                      color={iconColor}
                      size={15}
                    />
                  ) : (
                    <LaCriptaRoomTypeIcon
                      type="UNEXPLORED"
                      color={isBossNode ? '#C93B5B' : '#D8C6A088'}
                      size={14}
                    />
                  )}

                  {/* Tiny completion dot */}
                  {isCompleted && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 border border-[#0B0A0E]"
                      style={{ backgroundColor: '#5EA87A' }}
                    />
                  )}

                  {/* Current room indicator */}
                  {isCurrent && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#E7A54A]" />
                  )}
                </div>

                {idx < rooms.length - 1 && (
                  <div
                    className="w-2.5 sm:w-4 h-0.5 shrink-0"
                    style={{
                      backgroundColor:
                        idx < currentRoomIndex
                          ? dungeon.palette.glow
                          : '#282039',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
