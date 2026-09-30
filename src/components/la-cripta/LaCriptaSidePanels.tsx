import React, { useEffect, useState } from 'react';
import { X, Crosshair } from 'lucide-react';
import {
  CriptaAcquiredRelic,
  CriptaDungeonRoom,
  CriptaItemId,
  CriptaPlayer,
  CriptaRoomEnemy,
  CriptaStatusEffectType,
} from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from '../../data/la-cripta/criptaCatalog';
import {
  CRIPTA_ITEMS_REGISTRY,
  NORMAL_INVENTORY_MAX_SLOTS,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  computeEnemyApproxDamageRange,
  computePlayerEffectiveStats,
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CriptaEnemyTraitEntry,
  estimatePlayerActionDamage,
  formatDamageRange,
  getEnemyWeaknessAndResistanceProfile,
  getEquippedWeaponForPlayer,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { buildEnemyAiProfileForArchetype } from '../../data/la-cripta/criptaEnemyAiEngine';
import { CRIPTA_STATUS_EFFECTS_REGISTRY } from '../../data/la-cripta/criptaStatusEffects';
import { LaCriptaItemPixelIcon } from './LaCriptaItemRelicArt';
import {
  LaCriptaStatusEffectBadge,
  LaCriptaStatusPixelIcon,
} from './LaCriptaStatusEffectBadge';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import { LaCriptaPixelPortrait } from './LaCriptaPartyHud';
import { LaCriptaEnemyPixelSprite } from './LaCriptaRoomEnvironment';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

export type CriptaContextualPanelMode =
  | 'NONE'
  | 'INVENTORY'
  | 'PLAYER_INSPECTION'
  | 'ENEMY_INSPECTION';

/**
 * Original 16x16 pixel-art leather adventurer backpack icon (replaces any emoji).
 */
export const LaCriptaBackpackPixelIcon: React.FC<{ size?: number }> = ({
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className="shrink-0 select-none"
  >
    {/* Top Handle Loop */}
    <rect x="6" y="1" width="4" height="1" fill="#8C583A" />
    <rect x="5" y="2" width="1" height="2" fill="#8C583A" />
    <rect x="10" y="2" width="1" height="2" fill="#8C583A" />
    {/* Main Leather Pack Body */}
    <rect x="3" y="4" width="10" height="10" fill="#6E4228" />
    <rect x="4" y="5" width="8" height="8" fill="#8C583A" />
    {/* Top Flap */}
    <rect x="3" y="4" width="10" height="4" fill="#52301C" />
    <rect x="4" y="4" width="8" height="3" fill="#78492D" />
    {/* Side Pockets */}
    <rect x="2" y="7" width="1" height="5" fill="#52301C" />
    <rect x="13" y="7" width="1" height="5" fill="#52301C" />
    {/* Golden Buckle & Straps */}
    <rect x="5" y="6" width="2" height="5" fill="#3E2314" />
    <rect x="9" y="6" width="2" height="5" fill="#3E2314" />
    <rect x="7" y="7" width="2" height="3" fill="#FFD166" />
    <rect x="5" y="9" width="2" height="2" fill="#E7A54A" />
    <rect x="9" y="9" width="2" height="2" fill="#E7A54A" />
  </svg>
);

/**
 * Crisp 12x12 pixel-art icons for enemy weaknesses and resistances (replaces any emoji).
 */
export const LaCriptaTraitPixelIcon: React.FC<{
  kind: CriptaEnemyTraitEntry['iconKind'];
  size?: number;
}> = ({ kind, size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className="shrink-0 select-none"
  >
    {kind === 'holy' && (
      <g>
        <rect x="5" y="1" width="2" height="10" fill="#FFD166" />
        <rect x="2" y="4" width="8" height="2" fill="#FFD166" />
        <rect x="5" y="4" width="2" height="2" fill="#FFF3C4" />
      </g>
    )}
    {kind === 'arcane' && (
      <g>
        <rect x="4" y="1" width="4" height="2" fill="#9B72CF" />
        <rect x="2" y="3" width="8" height="6" fill="#9B72CF" />
        <rect x="4" y="9" width="4" height="2" fill="#9B72CF" />
        <rect x="4" y="4" width="4" height="4" fill="#E0C3FC" />
      </g>
    )}
    {kind === 'blunt' && (
      <g>
        <rect x="2" y="2" width="8" height="4" fill="#D9D0BC" />
        <rect x="3" y="3" width="6" height="2" fill="#9A96A4" />
        <rect x="5" y="6" width="2" height="5" fill="#8C583A" />
      </g>
    )}
    {kind === 'pierce' && (
      <g>
        <rect x="8" y="2" width="2" height="2" fill="#FFF3C4" />
        <rect x="6" y="4" width="3" height="3" fill="#D9D0BC" />
        <rect x="4" y="6" width="3" height="3" fill="#9A96A4" />
        <rect x="2" y="8" width="2" height="2" fill="#E7A54A" />
      </g>
    )}
    {kind === 'alchemy' && (
      <g>
        <rect x="5" y="1" width="2" height="3" fill="#FFF3C4" />
        <rect x="3" y="4" width="6" height="4" fill="#FF7A33" />
        <rect x="4" y="8" width="4" height="3" fill="#C93B5B" />
      </g>
    )}
    {kind === 'poison' && (
      <g>
        <rect x="5" y="1" width="2" height="3" fill="#8EE6AE" />
        <rect x="3" y="4" width="6" height="5" fill="#5EA87A" />
        <rect x="4" y="9" width="4" height="2" fill="#3B7A54" />
      </g>
    )}
    {kind === 'slash' && (
      <g>
        <rect x="8" y="1" width="3" height="3" fill="#D9D0BC" />
        <rect x="5" y="4" width="3" height="3" fill="#D9D0BC" />
        <rect x="2" y="7" width="3" height="3" fill="#E7A54A" />
      </g>
    )}
  </svg>
);

const ITEM_CATEGORY_DISPLAY: Record<
  string,
  { label: string; color: string; borderColor: string }
> = {
  HEALING: { label: 'CURACIÓN', color: '#5EA87A', borderColor: '#3B7A54' },
  CLEANSE: { label: 'ESTADO', color: '#69A8A5', borderColor: '#3F7270' },
  CLEANSING: { label: 'ESTADO', color: '#69A8A5', borderColor: '#3F7270' },
  BUFF: { label: 'COMBATE', color: '#E7A54A', borderColor: '#9E6B24' },
  COMBAT_BUFF: { label: 'COMBATE', color: '#E7A54A', borderColor: '#9E6B24' },
  OFFENSIVE: { label: 'COMBATE', color: '#C93B5B', borderColor: '#8F263D' },
  UTILITY: { label: 'UTILIDAD', color: '#9B72CF', borderColor: '#63438E' },
};

interface GroupedInventoryItem {
  itemId: CriptaItemId;
  count: number;
  firstSlotIndex: number;
  slotIndices: number[];
}

function groupPlayerInventoryItems(
  normalInventory: CriptaItemId[] = []
): GroupedInventoryItem[] {
  const map = new Map<CriptaItemId, GroupedInventoryItem>();
  normalInventory.forEach((rawSlot, idx) => {
    const itemId =
      typeof rawSlot === 'string'
        ? rawSlot
        : (rawSlot as { itemId?: CriptaItemId })?.itemId;
    if (!itemId || !CRIPTA_ITEMS_REGISTRY[itemId]) return;
    const existing = map.get(itemId);
    if (existing) {
      existing.count += 1;
      existing.slotIndices.push(idx);
    } else {
      map.set(itemId, {
        itemId,
        count: 1,
        firstSlotIndex: idx,
        slotIndices: [idx],
      });
    }
  });
  return Array.from(map.values());
}

export interface LaCriptaContextualSidePanelProps {
  mode: CriptaContextualPanelMode;
  onClose: () => void;
  localPlayer: CriptaPlayer | null;
  inspectedPlayer: CriptaPlayer | null;
  inspectedEnemy: CriptaRoomEnemy | null;
  activeRoom: CriptaDungeonRoom;
  partyRelics: CriptaAcquiredRelic[];
  discoveredAbilityIds: string[];
  isMyTurnInCombat: boolean;
  hasActiveCombat: boolean;
  selectedTargetEnemyId: string | null;
  onSelectTargetEnemy?: (enemyId: string) => void;
  onUseConsumable?: (
    slotIndex: number,
    targetEnemyId?: string,
    targetPlayerId?: string
  ) => void;
}

export const LaCriptaContextualSidePanel: React.FC<
  LaCriptaContextualSidePanelProps
> = ({
  mode,
  onClose,
  localPlayer,
  inspectedPlayer,
  inspectedEnemy,
  activeRoom,
  partyRelics,
  discoveredAbilityIds,
  isMyTurnInCombat,
  hasActiveCombat,
  selectedTargetEnemyId,
  onSelectTargetEnemy,
  onUseConsumable,
}) => {
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [recentUsedItemBanner, setRecentUsedItemBanner] = useState<{
    itemId: CriptaItemId;
    name: string;
    effectText: string;
  } | null>(null);

  // Unlock pending button when inventory state updates from server
  useEffect(() => {
    setPendingSlotIndex(null);
  }, [localPlayer?.normalInventory?.length, activeRoom.consumableUsedThisTurn]);

  // Close panel on ESC key
  useEffect(() => {
    if (mode === 'NONE') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onClose]);

  if (mode === 'NONE') return null;

  return (
    <div className="fixed lg:absolute inset-0 z-40 flex justify-end items-end lg:items-stretch pointer-events-auto">
      {/* Subtle Dim Backdrop (preserves Left Creature Stage visibility) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#050408]/55 backdrop-blur-[1px] transition-opacity duration-200"
      />

      {/* Slide-in Contextual Game Panel */}
      <aside
        role="dialog"
        aria-label={
          mode === 'INVENTORY'
            ? 'Mochila de Aventurero'
            : mode === 'PLAYER_INSPECTION'
            ? 'Inspección de Aventurero'
            : 'Examinar Criatura'
        }
        className="relative z-10 w-full sm:w-[390px] md:w-[420px] max-h-[82dvh] lg:max-h-none lg:h-full bg-[#0E0A16]/98 border-t-2 sm:border-t-0 sm:border-l-2 border-[#E7A54A] shadow-[-16px_0_48px_rgba(0,0,0,0.92)] flex flex-col justify-between overflow-hidden animate-[slideInRight_240ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* ===================================================================
            MODE 1: MOCHILA (DEDICATED INVENTORY DRAWER)
            =================================================================== */}
        {mode === 'INVENTORY' && localPlayer && (
          <>
            {/* Header */}
            <div className="px-4 py-3 bg-[#171123] border-b-2 border-[#2E223D] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#241934] border border-[#E7A54A] flex items-center justify-center">
                  <LaCriptaBackpackPixelIcon size={20} />
                </div>
                <div>
                  <div className="font-cripta-display text-base font-black text-[#FFD166] uppercase tracking-wider leading-none">
                    MOCHILA
                  </div>
                  <div className="mt-0.5 text-[10px] font-cripta-pixel text-[#D8C6A0]">
                    {localPlayer.name} ·{' '}
                    {localPlayer.characterId
                      ? CRIPTA_CHARACTERS_CATALOG[localPlayer.characterId]?.className
                      : 'AVENTURERO'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar mochila"
                className="p-1.5 bg-[#221832] hover:bg-[#312247] border border-[#4A3B5C] hover:border-[#FFD166] text-[#D8C6A0] hover:text-[#FFD166] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Free Action Rule Subbanner */}
            <div className="px-4 py-2 bg-[#120D1B] border-b border-[#261C34] flex items-center justify-between gap-2 text-[9px] font-cripta-pixel">
              {hasActiveCombat ? (
                activeRoom.consumableUsedThisTurn ? (
                  <span className="text-[#E7A54A] font-bold uppercase">
                    ✦ CONSUMIBLE USADO ESTE TURNO
                  </span>
                ) : isMyTurnInCombat ? (
                  <span className="text-[#8EE6AE] font-bold uppercase">
                    ✦ ACCIÓN LIBRE: NO CONSUME AP NI TU TURNO (MÁX. 1)
                  </span>
                ) : (
                  <span className="text-[#D8C6A0]/75 uppercase">
                    ✦ DISPONIBLE EN TU TURNO
                  </span>
                )
              ) : (
                <span className="text-[#8EE6AE] uppercase">
                  ✦ PUEDES USAR OBJETOS DE CURACIÓN Y UTILIDAD AQUÍ
                </span>
              )}
            </div>

            {/* Satisfying Item Use Visual Feedback Toast inside Drawer */}
            {recentUsedItemBanner && (
              <div className="mx-4 mt-2.5 p-2.5 bg-[#13241B] border-2 border-[#5EA87A] flex items-center gap-2.5 animate-pulse">
                <LaCriptaItemPixelIcon
                  itemId={recentUsedItemBanner.itemId}
                  size={28}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase">
                    ✦ {recentUsedItemBanner.name} UTILIZADO
                  </div>
                  <div className="text-[9px] font-cripta-pixel text-[#D9D0BC] truncate">
                    {recentUsedItemBanner.effectText}
                  </div>
                </div>
              </div>
            )}

            {/* Item List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {(() => {
                const grouped = groupPlayerInventoryItems(
                  localPlayer.normalInventory || []
                );
                if (grouped.length === 0) {
                  return (
                    <div className="h-48 border border-dashed border-[#342744] bg-[#120D1A]/60 flex flex-col items-center justify-center p-6 text-center">
                      <LaCriptaBackpackPixelIcon size={32} />
                      <div className="mt-2 font-cripta-display text-sm font-bold text-[#D8C6A0] uppercase">
                        MOCHILA VACÍA
                      </div>
                      <p className="mt-1 text-[10px] font-cripta-pixel text-[#D8C6A0]/65 leading-relaxed">
                        Recoge botín de los enemigos derrotados, cofres o el
                        mercader para almacenar consumibles aquí.
                      </p>
                    </div>
                  );
                }

                const iAmDown = Boolean(
                  localPlayer.isDead || localPlayer.hp <= 0
                );

                return grouped.map((entry) => {
                  const def = CRIPTA_ITEMS_REGISTRY[entry.itemId];
                  if (!def) return null;
                  const catInfo =
                    ITEM_CATEGORY_DISPLAY[def.category] ||
                    ITEM_CATEGORY_DISPLAY.UTILITY;

                  const canUseContext = hasActiveCombat
                    ? def.combatUsable &&
                      isMyTurnInCombat &&
                      !activeRoom.consumableUsedThisTurn
                    : def.roomUsable;

                  const isUsableNow =
                    !iAmDown &&
                    canUseContext &&
                    pendingSlotIndex === null;

                  const unavailableReason = iAmDown
                    ? 'CAÍDO'
                    : hasActiveCombat && !isMyTurnInCombat
                    ? 'DISPONIBLE EN TU TURNO'
                    : hasActiveCombat && activeRoom.consumableUsedThisTurn
                    ? 'USADO ESTE TURNO'
                    : !canUseContext
                    ? 'NO DISPONIBLE AQUÍ'
                    : 'USAR';

                  return (
                    <LaCriptaPixelTooltip
                      key={entry.itemId}
                      title={def.name}
                      category={catInfo.label}
                      description={def.description}
                      footerLabel={`CANTIDAD: x${entry.count} · ${
                        isUsableNow ? 'DISPONIBLE AHORA' : unavailableReason
                      }`}
                      borderColor={catInfo.color}
                      accentColor={catInfo.color}
                      icon={<LaCriptaItemPixelIcon itemId={entry.itemId} size={18} />}
                      className="block w-full"
                    >
                      <div className="w-full p-2.5 bg-[#150F20] hover:bg-[#1C142B] border border-[#382A4B] hover:border-[#E7A54A] flex items-center justify-between gap-3 transition-colors">
                        {/* Left Pixel Icon + Item Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-11 h-11 bg-[#0B0811] border flex items-center justify-center shrink-0 relative"
                            style={{ borderColor: catInfo.borderColor }}
                          >
                            <LaCriptaItemPixelIcon
                              itemId={entry.itemId}
                              size={32}
                            />
                            <span className="absolute -bottom-1 -right-1 px-1 bg-[#09070D] border border-[#E7A54A] text-[9px] font-cripta-mono font-bold text-[#FFD166]">
                              x{entry.count}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-cripta-display text-xs sm:text-sm font-black text-[#F5EFE6] uppercase truncate">
                                {def.name}
                              </span>
                              <span
                                className="px-1 py-0.2 border text-[8px] font-cripta-pixel uppercase shrink-0"
                                style={{
                                  color: catInfo.color,
                                  borderColor: catInfo.borderColor,
                                }}
                              >
                                {catInfo.label}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[10px] font-cripta-pixel text-[#D8C6A0] leading-snug">
                              {def.description}
                            </div>
                          </div>
                        </div>

                        {/* Right Action Button */}
                        <button
                          type="button"
                          disabled={!isUsableNow}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUsableNow || !onUseConsumable) return;
                            laCriptaAudio.playDoorVote();
                            setPendingSlotIndex(entry.firstSlotIndex);
                            setRecentUsedItemBanner({
                              itemId: entry.itemId,
                              name: def.name,
                              effectText: def.description,
                            });
                            window.setTimeout(() => {
                              setRecentUsedItemBanner(null);
                            }, 1800);
                            onUseConsumable(
                              entry.firstSlotIndex,
                              selectedTargetEnemyId || undefined,
                              localPlayer.id
                            );
                          }}
                          className={`px-2.5 py-1.5 border font-cripta-pixel text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                            isUsableNow
                              ? 'bg-[#1C2F23] hover:bg-[#274432] border-[#5EA87A] text-[#8EE6AE] cursor-pointer shadow-[0_0_12px_rgba(94,168,122,0.25)]'
                              : 'bg-[#140F1D] border-[#2E223D] text-[#D8C6A0]/45 cursor-not-allowed'
                          }`}
                        >
                          {isUsableNow ? 'USAR' : unavailableReason}
                        </button>
                      </div>
                    </LaCriptaPixelTooltip>
                  );
                });
              })()}
            </div>

            {/* Footer Capacity */}
            <div className="px-4 py-2.5 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]">
              <span>
                CAPACIDAD:{' '}
                <strong className="text-[#FFD166]">
                  {(localPlayer.normalInventory || []).length} /{' '}
                  {NORMAL_INVENTORY_MAX_SLOTS}
                </strong>
              </span>
              <span className="text-[#D8C6A0]/65">ESC PARA CERRAR</span>
            </div>
          </>
        )}

        {/* ===================================================================
            MODE 2: PLAYER_INSPECTION (SELF OR TEAMMATE INSPECTION PANEL)
            =================================================================== */}
        {mode === 'PLAYER_INSPECTION' && inspectedPlayer && (
          <>
            {(() => {
              const charId =
                inspectedPlayer.characterId ||
                inspectedPlayer.selectedCharacterId ||
                'caballero';
              const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
              const effStats = computePlayerEffectiveStats(inspectedPlayer);
              const eqWeapon = getEquippedWeaponForPlayer(inspectedPlayer);
              const armorDef = inspectedPlayer.equippedArmorId
                ? CRIPTA_ARMORS_REGISTRY[inspectedPlayer.equippedArmorId]
                : null;
              const accDef = inspectedPlayer.equippedAccessoryId
                ? CRIPTA_ACCESSORIES_REGISTRY[inspectedPlayer.equippedAccessoryId]
                : null;
              const isDowned = Boolean(
                inspectedPlayer.isDead || inspectedPlayer.hp <= 0
              );

              const baseAtk = charDef?.stats.attack || 5;
              const bonusAtk = effStats.attack - baseAtk;
              const baseDef = charDef?.stats.defense || 5;
              const bonusDef = effStats.defense - baseDef;
              const baseMag = charDef?.stats.magic || 5;
              const bonusMag = effStats.magic - baseMag;

              const weaponDmgEst = estimatePlayerActionDamage(
                inspectedPlayer,
                'ATTACK',
                null,
                [],
                partyRelics
              );
              const specialDmgEst = estimatePlayerActionDamage(
                inspectedPlayer,
                'WEAPON_SPECIAL',
                null,
                [],
                partyRelics
              );

              const groupedInv = groupPlayerInventoryItems(
                inspectedPlayer.normalInventory || []
              );

              return (
                <>
                  {/* Header: Portrait + Name + Class */}
                  <div className="px-4 py-3 bg-[#171123] border-b-2 border-[#2E223D] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 bg-[#0B0811] border-2 flex items-center justify-center shrink-0"
                        style={{
                          borderColor: isDowned
                            ? '#C93B5B'
                            : inspectedPlayer.color || '#E7A54A',
                        }}
                      >
                        <LaCriptaPixelPortrait
                          characterId={charId}
                          size={36}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-cripta-display text-base font-black text-[#F5EFE6] uppercase truncate">
                            {inspectedPlayer.name}
                          </span>
                          {isDowned && (
                            <span className="px-1.5 py-0.5 bg-[#2A0E17] border border-[#C93B5B] text-[8px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase">
                              CAÍDO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#E7A54A] uppercase tracking-wider">
                          {charDef?.className || 'AVENTURERO'} · {charDef?.name}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar inspección de jugador"
                      className="p-1.5 bg-[#221832] hover:bg-[#312247] border border-[#4A3B5C] hover:border-[#FFD166] text-[#D8C6A0] hover:text-[#FFD166] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* 1. FOUR CANONICAL PRIMARY STATS + DERIVED */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        ATRIBUTOS PRIMARIOS
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-cripta-pixel">
                        <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between">
                          <span className="text-[10px] text-[#D8C6A0]">VIDA</span>
                          <span className="text-xs font-bold text-[#8EE6AE]">
                            {Math.max(0, inspectedPlayer.hp)} / {inspectedPlayer.maxHp}
                          </span>
                        </div>
                        <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between">
                          <span className="text-[10px] text-[#D8C6A0]">ATAQUE</span>
                          <span className="text-xs font-bold text-[#FF8FA3]">
                            {baseAtk}
                            {bonusAtk > 0 && (
                              <span className="text-[#FFD166] ml-1">
                                (+{bonusAtk})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between">
                          <span className="text-[10px] text-[#D8C6A0]">DEFENSA</span>
                          <span className="text-xs font-bold text-[#7BDFF2]">
                            {baseDef}
                            {bonusDef > 0 && (
                              <span className="text-[#FFD166] ml-1">
                                (+{bonusDef})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between">
                          <span className="text-[10px] text-[#D8C6A0]">MAGIA</span>
                          <span className="text-xs font-bold text-[#C8A6F5]">
                            {baseMag}
                            {bonusMag > 0 && (
                              <span className="text-[#FFD166] ml-1">
                                (+{bonusMag})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Secondary Derived Strip */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                        <span className="px-2 py-0.5 bg-[#120C1A] border border-[#2A1F38]">
                          ARMADURA ACTUAL: <strong className="text-[#7BDFF2]">{inspectedPlayer.armor || 0}</strong>
                        </span>
                        <span className="px-2 py-0.5 bg-[#120C1A] border border-[#2A1F38]">
                          CRÍTICO: <strong className="text-[#FFD166]">{effStats.critChancePct}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* 2. ACTIVE STATUSES */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        ESTADOS ACTIVOS
                      </div>
                      {(inspectedPlayer.statuses || []).length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {inspectedPlayer.statuses.map((st) => (
                            <LaCriptaStatusEffectBadge key={st.id} status={st} />
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/50">
                          Sin estados alterados activos.
                        </div>
                      )}
                    </div>

                    {/* 3. EQUIPPED WEAPON & GEAR */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        ARMA Y EQUIPO
                      </div>
                      <div className="space-y-1.5">
                        <LaCriptaPixelTooltip
                          title={`${eqWeapon.weapon.name} (Nv.${eqWeapon.level})`}
                          category="ARMA EQUIPADA"
                          description={eqWeapon.weapon.specialEffectText}
                          footerLabel={`DAÑO BASE: ~${eqWeapon.scaledMin}–${eqWeapon.scaledMax} · ESCALA CON ${eqWeapon.weapon.scalingStat}`}
                          borderColor="#E7A54A"
                          className="block w-full"
                        >
                          <div className="p-2.5 bg-[#150F20] border border-[#382A4B] flex items-center justify-between">
                            <div>
                              <div className="font-cripta-display text-xs font-bold text-[#FFD166] uppercase">
                                {eqWeapon.weapon.name}{' '}
                                <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]">
                                  NV.{eqWeapon.level}
                                </span>
                              </div>
                              <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                                {eqWeapon.weapon.specialEffectText}
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-[#241623] border border-[#C93B5B] font-cripta-mono text-[10px] font-bold text-[#FF8FA3] shrink-0">
                              {formatDamageRange(weaponDmgEst.min, weaponDmgEst.max)} DAÑO
                            </span>
                          </div>
                        </LaCriptaPixelTooltip>

                        {(armorDef || accDef) && (
                          <div className="grid grid-cols-2 gap-2">
                            {armorDef && (
                              <div className="p-2 bg-[#140E1E] border border-[#2E223D] text-[9px] font-cripta-pixel">
                                <div className="text-[#7BDFF2] font-bold uppercase">
                                  {armorDef.name}
                                </div>
                                <div className="text-[#D8C6A0]/75 mt-0.5">
                                  {armorDef.specialEffectText}
                                </div>
                              </div>
                            )}
                            {accDef && (
                              <div className="p-2 bg-[#140E1E] border border-[#2E223D] text-[9px] font-cripta-pixel">
                                <div className="text-[#C8A6F5] font-bold uppercase">
                                  {accDef.name}
                                </div>
                                <div className="text-[#D8C6A0]/75 mt-0.5">
                                  {accDef.specialEffectText}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. TECHNIQUES & CLASS ABILITIES (READ-ONLY) */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        TÉCNICAS Y HABILIDADES (SOLO LECTURA)
                      </div>
                      <div className="space-y-1.5">
                        {/* Weapon Special */}
                        <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-cripta-display text-xs font-bold text-[#FFD166] uppercase">
                              {eqWeapon.weapon.specialAttack.name}
                            </div>
                            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                              {eqWeapon.weapon.specialAttack.description}
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-cripta-pixel text-[9px]">
                            <div className="text-[#FF8FA3] font-bold">
                              {formatDamageRange(specialDmgEst.min, specialDmgEst.max)}
                            </div>
                            <div className="text-[#D8C6A0]/65">
                              CD {eqWeapon.weapon.specialAttack.cooldownRounds}
                            </div>
                          </div>
                        </div>

                        {/* Class Abilities */}
                        {(charDef?.abilities || []).map((ab) => (
                          <div
                            key={ab.id}
                            className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-cripta-display text-xs font-bold text-[#C8A6F5] uppercase">
                                {ab.name}
                              </div>
                              <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                                {ab.description}
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 bg-[#1F162E] border border-[#4A3B5C] text-[8px] font-cripta-pixel text-[#D8C6A0] shrink-0">
                              CD {ab.cooldownTurns}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. PLAYER INVENTORY (READ-ONLY VIEW FOR CO-OP COORDINATION) */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        MOCHILA ({(inspectedPlayer.normalInventory || []).length}/
                        {NORMAL_INVENTORY_MAX_SLOTS})
                      </div>
                      {groupedInv.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {groupedInv.map((g) => {
                            const itemDef = CRIPTA_ITEMS_REGISTRY[g.itemId];
                            if (!itemDef) return null;
                            return (
                              <LaCriptaPixelTooltip
                                key={g.itemId}
                                title={itemDef.name}
                                category="MOCHILA"
                                description={itemDef.description}
                                footerLabel={`CANTIDAD: x${g.count}`}
                                borderColor="#5EA87A"
                                icon={
                                  <LaCriptaItemPixelIcon
                                    itemId={g.itemId}
                                    size={16}
                                  />
                                }
                              >
                                <div className="px-2 py-1 bg-[#140E1E] border border-[#382A4B] flex items-center gap-1.5 text-[10px] font-cripta-pixel text-[#F5EFE6] cursor-help">
                                  <LaCriptaItemPixelIcon
                                    itemId={g.itemId}
                                    size={16}
                                  />
                                  <span>{itemDef.name}</span>
                                  <span className="text-[#FFD166] font-bold">
                                    ×{g.count}
                                  </span>
                                </div>
                              </LaCriptaPixelTooltip>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/50">
                          Sin objetos en la mochila.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]/75">
                    <span>INSPECCIÓN COOPERATIVA · SOLO LECTURA</span>
                    <span>ESC PARA CERRAR</span>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ===================================================================
            MODE 3: ENEMY_INSPECTION (LIVE TACTICAL CREATURE EXAMINER)
            =================================================================== */}
        {mode === 'ENEMY_INSPECTION' && inspectedEnemy && (
          <>
            {(() => {
              const approxRange = computeEnemyApproxDamageRange(inspectedEnemy);
              const traits = getEnemyWeaknessAndResistanceProfile(inspectedEnemy);
              const aiProfile =
                inspectedEnemy.aiProfile ||
                buildEnemyAiProfileForArchetype(inspectedEnemy).aiProfile;
              const enemyDef = inspectedEnemy.armor || 0;
              const magicRes = inspectedEnemy.magicResistance || 0;

              // Collect statuses this creature can apply from its abilities & threats
              const statusCapabilities: Array<{
                statusType: CriptaStatusEffectType;
                turns: number;
                abilityName: string;
              }> = [];
              (aiProfile.abilities || []).forEach((ab) => {
                if (ab.statusToApply) {
                  if (
                    !statusCapabilities.some(
                      (s) => s.statusType === ab.statusToApply!
                    )
                  ) {
                    statusCapabilities.push({
                      statusType: ab.statusToApply,
                      turns: ab.statusTurns || 2,
                      abilityName: ab.name,
                    });
                  }
                }
              });
              if (
                inspectedEnemy.statusThreat &&
                !statusCapabilities.some(
                  (s) => s.statusType === inspectedEnemy.statusThreat
                )
              ) {
                statusCapabilities.push({
                  statusType: inspectedEnemy.statusThreat,
                  turns: 2,
                  abilityName: inspectedEnemy.abilityName || 'Ataque Especial',
                });
              }

              const isCurrentTarget =
                selectedTargetEnemyId === inspectedEnemy.id ||
                !selectedTargetEnemyId;

              return (
                <>
                  {/* Header */}
                  <div className="px-4 py-3 bg-[#171123] border-b-2 border-[#2E223D] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[9px] font-cripta-pixel text-[#E7A54A] uppercase tracking-widest">
                        {inspectedEnemy.isFinalBoss || inspectedEnemy.isBoss
                          ? 'SOBERANO DEL ABISMO'
                          : inspectedEnemy.isMiniboss
                          ? 'MINIJFE DE LA MAZMORRA'
                          : inspectedEnemy.isElite
                          ? 'CRIATURA ÉLITE'
                          : 'CRIATURA DE CRIPTA'}
                      </div>
                      <h3 className="font-cripta-display text-base sm:text-lg font-black text-[#F5EFE6] uppercase truncate">
                        {inspectedEnemy.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectTargetEnemy &&
                        inspectedEnemy.hp > 0 &&
                        !isCurrentTarget && (
                          <button
                            type="button"
                            onClick={() => {
                              laCriptaAudio.playDoorHover();
                              onSelectTargetEnemy(inspectedEnemy.id);
                            }}
                            className="px-2 py-1 bg-[#2A121D] hover:bg-[#3D1A2A] border border-[#FF4D6D] text-[9px] font-cripta-pixel font-bold text-[#FFD166] flex items-center gap-1 cursor-pointer"
                          >
                            <Crosshair className="w-3 h-3" />
                            <span>FIJAR OBJETIVO</span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar examen de enemigo"
                        className="p-1.5 bg-[#221832] hover:bg-[#312247] border border-[#4A3B5C] hover:border-[#FFD166] text-[#D8C6A0] hover:text-[#FFD166] cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Creature Mini Portrait + Live Vitals */}
                    <div className="p-3 bg-[#140E1E] border border-[#2E223D] flex items-center gap-4">
                      <div className="w-20 h-20 bg-[#0B0811] border border-[#3E2F4B] flex items-center justify-center shrink-0 overflow-hidden">
                        <LaCriptaEnemyPixelSprite
                          enemy={inspectedEnemy}
                          customSizePx={72}
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-3 gap-2 text-center font-cripta-pixel">
                        <div className="p-1.5 bg-[#0D0914] border border-[#281E36]">
                          <div className="text-[8px] text-[#D8C6A0]/65">PV</div>
                          <div className="text-xs font-bold text-[#FF8FA3] mt-0.5">
                            {inspectedEnemy.hp}/{inspectedEnemy.maxHp}
                          </div>
                        </div>
                        <div className="p-1.5 bg-[#0D0914] border border-[#281E36]">
                          <div className="text-[8px] text-[#D8C6A0]/65">DAÑO</div>
                          <div className="text-xs font-bold text-[#FFD166] mt-0.5">
                            ~{approxRange.min}–{approxRange.max}
                          </div>
                        </div>
                        <div className="p-1.5 bg-[#0D0914] border border-[#281E36]">
                          <div className="text-[8px] text-[#D8C6A0]/65">DEFENSA</div>
                          <div className="text-xs font-bold text-[#7BDFF2] mt-0.5">
                            {enemyDef}
                            {magicRes > 0 ? ` · RM ${magicRes}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ACTIVE STATUSES ON ENEMY */}
                    {(Boolean(inspectedEnemy.poisonStacks && inspectedEnemy.poisonStacks > 0) ||
                      Boolean(inspectedEnemy.vulnerableTurns && inspectedEnemy.vulnerableTurns > 0) ||
                      Boolean(inspectedEnemy.isDefending)) && (
                      <div>
                        <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                          ESTADOS ACTIVOS EN LA CRIATURA
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Boolean(inspectedEnemy.poisonStacks && inspectedEnemy.poisonStacks > 0) && (
                            <LaCriptaStatusEffectBadge
                              effectType="POISON"
                              turnsRemaining={inspectedEnemy.poisonStacks || 1}
                              stacks={inspectedEnemy.poisonStacks}
                            />
                          )}
                          {Boolean(inspectedEnemy.vulnerableTurns && inspectedEnemy.vulnerableTurns > 0) && (
                            <LaCriptaStatusEffectBadge
                              effectType="MARKED"
                              turnsRemaining={inspectedEnemy.vulnerableTurns || 1}
                            />
                          )}
                          {Boolean(inspectedEnemy.isDefending) && (
                            <LaCriptaStatusEffectBadge
                              effectType="SHIELDED"
                              turnsRemaining={inspectedEnemy.defendingRoundsRemaining || 1}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* DEBILIDADES & RESISTENCIAS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] font-cripta-pixel text-[#8EE6AE] uppercase tracking-widest mb-1.5">
                          DEBILIDADES
                        </div>
                        <div className="space-y-1.5">
                          {traits.weaknesses.map((w) => (
                            <div
                              key={w.id}
                              className="px-2.5 py-1.5 bg-[#12211A] border border-[#3B7A54] flex items-center justify-between text-[10px] font-cripta-pixel"
                            >
                              <span className="flex items-center gap-1.5 text-[#F5EFE6] font-bold">
                                <LaCriptaTraitPixelIcon kind={w.iconKind} />
                                <span>{w.label}</span>
                              </span>
                              <span className="text-[#8EE6AE] font-bold">
                                {w.modifierText}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-cripta-pixel text-[#FF8FA3] uppercase tracking-widest mb-1.5">
                          RESISTENCIAS
                        </div>
                        <div className="space-y-1.5">
                          {traits.resistances.map((r) => (
                            <div
                              key={r.id}
                              className="px-2.5 py-1.5 bg-[#22121A] border border-[#8F263D] flex items-center justify-between text-[10px] font-cripta-pixel"
                            >
                              <span className="flex items-center gap-1.5 text-[#F5EFE6] font-bold">
                                <LaCriptaTraitPixelIcon kind={r.iconKind} />
                                <span>{r.label}</span>
                              </span>
                              <span className="text-[#FF8FA3] font-bold">
                                {r.modifierText}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ATAQUES CONOCIDOS */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        ATAQUES DE LA CRIATURA
                      </div>
                      <div className="space-y-1.5">
                        {(aiProfile.abilities || []).map((ab, idx) => {
                          const isKnown =
                            idx === 0 ||
                            discoveredAbilityIds.includes(ab.id) ||
                            inspectedEnemy.isBoss ||
                            inspectedEnemy.isFinalBoss ||
                            Boolean(inspectedEnemy.isMiniboss);

                          const mult = ab.damageMultiplier || 1;
                          const abMin = Math.max(
                            2,
                            Math.round(approxRange.min * mult)
                          );
                          const abMax = Math.max(
                            abMin + 1,
                            Math.round(approxRange.max * mult)
                          );

                          const actionSummary =
                            ab.actionKind === 'AOE_ATTACK'
                              ? 'Ataque de área contra todo el grupo.'
                              : ab.actionKind === 'HEAL_SELF' || ab.actionKind === 'HEAL_ALLY'
                              ? `Restaura ~${ab.healAmount || 12} PV.`
                              : ab.actionKind === 'DEFEND_SELF' || ab.actionKind === 'BUFF_ARMOR'
                              ? `Refuerza la defensa (+${ab.armorBonus || 3} DEF).`
                              : ab.statusToApply
                              ? `Golpe que aplica ${
                                  CRIPTA_STATUS_EFFECTS_REGISTRY[ab.statusToApply]?.name ||
                                  ab.statusToApply
                                }.`
                              : 'Ataque directo contra un aventurero.';

                          return (
                            <div
                              key={ab.id}
                              className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center justify-between gap-2 text-[10px] font-cripta-pixel"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-[#FFD166] uppercase">
                                  {isKnown ? ab.name : '??? (Ataque no observado)'}
                                </div>
                                <div className="text-[9px] text-[#D8C6A0]/80 mt-0.5">
                                  {isKnown
                                    ? actionSummary
                                    : 'Se revelará cuando la criatura ejecute esta técnica.'}
                                </div>
                              </div>
                              {ab.actionKind !== 'DEFEND_SELF' &&
                                ab.actionKind !== 'BUFF_ARMOR' &&
                                ab.actionKind !== 'HEAL_SELF' &&
                                ab.actionKind !== 'HEAL_ALLY' && (
                                  <span className="px-2 py-0.5 bg-[#24131D] border border-[#C93B5B] font-cripta-mono font-bold text-[#FF8FA3] shrink-0">
                                    ~{abMin}–{abMax}
                                  </span>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* EFECTOS QUE PUEDE APLICAR */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest mb-1.5">
                        EFECTOS QUE PUEDE APLICAR
                      </div>
                      {statusCapabilities.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {statusCapabilities.map((cap) => {
                            const stDef =
                              CRIPTA_STATUS_EFFECTS_REGISTRY[cap.statusType];
                            if (!stDef) return null;
                            return (
                              <LaCriptaPixelTooltip
                                key={cap.statusType}
                                title={stDef.name}
                                category="AMENAZA DE ESTADO"
                                description={stDef.description}
                                footerLabel={`DURACIÓN TÍPICA: ${cap.turns} TURNOS · VÍA ${cap.abilityName.toUpperCase()}`}
                                borderColor={stDef.visualTreatment.color}
                                accentColor={stDef.visualTreatment.color}
                                icon={
                                  <LaCriptaStatusPixelIcon
                                    effectType={cap.statusType}
                                    size={12}
                                  />
                                }
                              >
                                <div
                                  className="px-2.5 py-1 border flex items-center gap-1.5 text-[10px] font-cripta-pixel cursor-help"
                                  style={{
                                    backgroundColor: stDef.visualTreatment.bgTint,
                                    borderColor: stDef.visualTreatment.borderColor,
                                    color: stDef.visualTreatment.color,
                                  }}
                                >
                                  <LaCriptaStatusPixelIcon
                                    effectType={cap.statusType}
                                    size={12}
                                  />
                                  <span className="font-bold uppercase">
                                    {stDef.name}
                                  </span>
                                  <span className="text-[#D9D0BC]">
                                    · {cap.turns} turnos
                                  </span>
                                </div>
                              </LaCriptaPixelTooltip>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/55">
                          Ataques físicos directos sin estados alterados adicionales.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]/75">
                    <span>EXAMINAR NO CONSUME AP NI TURNO</span>
                    <span>ESC PARA CERRAR</span>
                  </div>
                </>
              );
            })()}
          </>
        )}
      </aside>
    </div>
  );
};
