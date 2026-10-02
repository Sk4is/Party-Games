import React, { useEffect, useState } from 'react';
import { X, Crosshair } from 'lucide-react';
import {
  CriptaAcquiredRelic,
  CriptaDungeonDefinition,
  CriptaDungeonRoom,
  CriptaItemId,
  CriptaPlayer,
  CriptaRoomEnemy,
  CriptaStatusEffectType,
  CriptaWeaponRuneId,
} from '../../types/laCripta';
import {
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_DUNGEONS_REGISTRY,
  normalizeCriptaCharacterId,
} from '../../data/la-cripta/criptaCatalog';

import {
  CRIPTA_ITEMS_REGISTRY,
  CRIPTA_RELICS_REGISTRY,
  NORMAL_INVENTORY_MAX_SLOTS,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  computeEnemyApproxDamageRange,
  computePlayerEffectiveStats,
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_DAMAGE_TYPE_META,
  CRIPTA_WEAPON_RUNES_REGISTRY,
  CriptaEnemyTraitEntry,
  estimatePlayerActionDamage,
  formatDamageRange,
  getEnemyWeaknessAndResistanceProfile,
  getEquippedWeaponForPlayer,
  getWeaponVsEnemyMatchupSummary,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { buildEnemyAiProfileForArchetype } from '../../data/la-cripta/criptaEnemyAiEngine';
import { CRIPTA_STATUS_EFFECTS_REGISTRY } from '../../data/la-cripta/criptaStatusEffects';
import {
  getClassMechanicForCharacter,
  getEnemyActiveStatuses,
  getPlayerClassMechanicHudState,
} from '../../data/la-cripta/criptaClassMechanics';
import {
  LaCriptaAccessoryPixelIcon,
  LaCriptaArmorPixelIcon,
  LaCriptaDamageTypeBadge,
  LaCriptaItemPixelIcon,
  LaCriptaRelicPixelIcon,
  LaCriptaWeaponPixelIcon,
  LaCriptaWeaponRunePixelIcon,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaStatusEffectBadge,
  LaCriptaStatusPixelIcon,
} from './LaCriptaStatusEffectBadge';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import { LaCriptaPixelPortrait } from './LaCriptaPartyHud';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import { LaCriptaStatSegments } from './LaCriptaStatBar';
import { LaCriptaEnemyPixelSprite } from './LaCriptaRoomEnvironment';
import { LaCriptaBiomeStageBackdrop } from './LaCriptaEncounterCards';
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
  dungeon?: CriptaDungeonDefinition;
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
  onEquipWeaponRune?: (runeId: CriptaWeaponRuneId | null) => void;
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
  dungeon,
  partyRelics,
  discoveredAbilityIds,
  isMyTurnInCombat,
  hasActiveCombat,
  selectedTargetEnemyId,
  onSelectTargetEnemy,
  onUseConsumable,
  onEquipWeaponRune,
}) => {
  const [pendingSlotIndex, setPendingSlotIndex] = useState<number | null>(null);
  const [showMechanicDetails, setShowMechanicDetails] = useState(false);
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
        className={`relative z-10 w-full ${
          mode === 'ENEMY_INSPECTION'
            ? 'sm:w-[440px] md:w-[490px]'
            : 'sm:w-[400px] md:w-[430px]'
        } max-h-[88dvh] lg:max-h-none lg:h-full bg-[#0E0A16]/98 border-t-2 sm:border-t-0 sm:border-l-2 border-[#E7A54A] shadow-[-16px_0_48px_rgba(0,0,0,0.94)] flex flex-col justify-between overflow-hidden animate-[slideInRight_220ms_cubic-bezier(0.16,1,0.3,1)]`}
      >
        {/* ===================================================================
            MODE 1: MOCHILA (CLEAN VISUAL GRID INVENTORY DRAWER)
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
                  <div className="font-cripta-display text-base font-black text-[#FFD166] uppercase tracking-wider leading-none flex items-center gap-2">
                    <span>MOCHILA</span>
                    <span className="px-1.5 py-0.5 bg-[#0C0814] border border-[#E7A54A]/70 font-cripta-mono text-xs text-[#FFF3C4]">
                      {(localPlayer.normalInventory || []).length} / {NORMAL_INVENTORY_MAX_SLOTS}
                    </span>
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
            <div className="px-4 py-1.5 bg-[#120D1B] border-b border-[#261C34] flex items-center justify-between gap-2 text-[9px] font-cripta-pixel">
              {hasActiveCombat ? (
                activeRoom.consumableUsedThisTurn ? (
                  <span className="text-[#E7A54A] font-bold uppercase">
                    ✦ 1 OBJETO USADO ESTE TURNO
                  </span>
                ) : isMyTurnInCombat ? (
                  <span className="text-[#8EE6AE] font-bold uppercase">
                    ✦ ACCIÓN LIBRE (0 AP · MÁX. 1 POR TURNO)
                  </span>
                ) : (
                  <span className="text-[#D8C6A0]/75 uppercase">
                    ✦ DISPONIBLE EN TU TURNO
                  </span>
                )
              ) : (
                <span className="text-[#8EE6AE] uppercase">
                  ✦ CLIC EN UN OBJETO PARA USARLO
                </span>
              )}
            </div>

            {/* Satisfying Item Use Visual Feedback Toast inside Drawer */}
            {recentUsedItemBanner && (
              <div className="mx-4 mt-2.5 p-2 bg-[#13241B] border-2 border-[#5EA87A] flex items-center gap-2.5 animate-pulse">
                <LaCriptaItemPixelIcon
                  itemId={recentUsedItemBanner.itemId}
                  size={26}
                />
                <div className="min-w-0">
                  <div className="text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase">
                    ✦ {recentUsedItemBanner.name} USADO
                  </div>
                  <div className="text-[9px] font-cripta-pixel text-[#D9D0BC] truncate">
                    {recentUsedItemBanner.effectText}
                  </div>
                </div>
              </div>
            )}

            {/* Compact 3-Column Visual Slot Grid */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {(() => {
                const grouped = groupPlayerInventoryItems(
                  localPlayer.normalInventory || []
                );
                const iAmDown = Boolean(
                  localPlayer.isDead || localPlayer.hp <= 0
                );
                const emptySlotsCount = Math.max(
                  0,
                  NORMAL_INVENTORY_MAX_SLOTS - grouped.length
                );

                return (
                  <>
                    <div className="grid grid-cols-3 gap-2.5">
                      {grouped.map((entry) => {
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
                          ? 'ESPERA TURNO'
                          : hasActiveCombat && activeRoom.consumableUsedThisTurn
                          ? 'YA USADO'
                          : !canUseContext
                          ? 'SOLO COMBATE'
                          : 'USAR';

                        return (
                          <LaCriptaPixelTooltip
                            key={entry.itemId}
                            title={def.name}
                            category={catInfo.label}
                            description={def.description}
                            footerLabel={`CANTIDAD: x${entry.count} · ${
                              isUsableNow ? 'CLIC PARA USAR' : unavailableReason
                            }`}
                            borderColor={catInfo.color}
                            accentColor={catInfo.color}
                            icon={
                              <LaCriptaItemPixelIcon
                                itemId={entry.itemId}
                                size={18}
                              />
                            }
                            className="block w-full"
                          >
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
                              className={`group relative w-full aspect-square p-2 border-2 flex flex-col items-center justify-between transition-all select-none ${
                                isUsableNow
                                  ? 'bg-[#161022] hover:bg-[#221835] border-[#4A3B5C] hover:border-[#FFD166] cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.65)] hover:-translate-y-0.5'
                                  : 'bg-[#110C1A]/80 border-[#2A1F38] opacity-60 cursor-not-allowed'
                              }`}
                            >
                              {/* Top Category Dot + Stack Count */}
                              <div className="w-full flex items-center justify-between">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: catInfo.color }}
                                />
                                <span className="px-1.5 py-0.2 bg-[#09070D] border border-[#E7A54A] font-cripta-mono text-[10px] font-black text-[#FFD166]">
                                  x{entry.count}
                                </span>
                              </div>

                              {/* Center Large Pixel Icon */}
                              <div className="my-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                <LaCriptaItemPixelIcon
                                  itemId={entry.itemId}
                                  size={40}
                                />
                              </div>

                              {/* Bottom Concise Name + Action Pill */}
                              <div className="w-full text-center">
                                <div className="font-cripta-display text-[10px] font-black text-[#F5EFE6] uppercase truncate">
                                  {def.name}
                                </div>
                                <div
                                  className={`mt-0.5 py-0.5 text-[8px] font-cripta-pixel font-bold uppercase tracking-wider ${
                                    isUsableNow
                                      ? 'bg-[#1C2F23] text-[#8EE6AE] border border-[#5EA87A]/70 group-hover:bg-[#274432]'
                                      : 'text-[#D8C6A0]/45'
                                  }`}
                                >
                                  {isUsableNow ? 'USAR' : unavailableReason}
                                </div>
                              </div>
                            </button>
                          </LaCriptaPixelTooltip>
                        );
                      })}

                      {/* Empty Visual Backpack Slots up to 6 */}
                      {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                        <div
                          key={`empty_${idx}`}
                          className="w-full aspect-square border border-dashed border-[#2E223D] bg-[#0B0812]/50 flex flex-col items-center justify-center p-2 text-center select-none"
                        >
                          <div className="w-6 h-6 border border-[#261C34] bg-[#120D1B]/60 flex items-center justify-center text-[9px] font-cripta-mono text-[#D8C6A0]/25">
                            ·
                          </div>
                          <span className="mt-1.5 text-[8px] font-cripta-pixel text-[#D8C6A0]/30 uppercase">
                            VACÍO
                          </span>
                        </div>
                      ))}
                    </div>

                    {grouped.length === 0 && (
                      <div className="p-3 bg-[#120D1A]/70 border border-[#2A1F38] text-center text-[10px] font-cripta-pixel text-[#D8C6A0]/70">
                        Mochila vacía. Recoge botín de enemigos, cofres o el mercader.
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer Capacity */}
            <div className="px-4 py-2.5 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]">
              <span>
                MOCHILA:{' '}
                <strong className="text-[#FFD166]">
                  {(localPlayer.normalInventory || []).length} /{' '}
                  {NORMAL_INVENTORY_MAX_SLOTS}
                </strong>
              </span>
              <span className="text-[#D8C6A0]/65">PASA EL CURSOR PARA DETALLES</span>
            </div>
          </>
        )}

        {/* ===================================================================
            MODE 2: PLAYER_INSPECTION (REDESIGNED CHARACTER INSPECT SHEET)
            =================================================================== */}
        {mode === 'PLAYER_INSPECTION' && inspectedPlayer && (
          <>
            {(() => {
              const rawId = inspectedPlayer.characterId || inspectedPlayer.selectedCharacterId;
              const charId = (rawId ? normalizeCriptaCharacterId(rawId) : null) || 'caballero';
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
              const isSelf = Boolean(
                localPlayer && inspectedPlayer.id === localPlayer.id
              );

              const baseAtk = charDef?.stats.attack || 5;
              const bonusAtk = effStats.attack - baseAtk;
              const baseDef = charDef?.stats.defense || 5;
              const bonusDef = effStats.defense - baseDef;
              const baseMag = charDef?.stats.magic || 5;
              const bonusMag = effStats.magic - baseMag;
              const baseAgi = charDef?.stats.agility || 5;
              const bonusAgi = effStats.agility - baseAgi;
              const basePre = charDef?.stats.precision || 5;
              const bonusPre = effStats.precision - basePre;
              const baseVol = charDef?.stats.willpower || 5;
              const bonusVol = effStats.willpower - baseVol;
              const classResVal = inspectedPlayer.classResource ?? charDef?.classResource?.initialValue ?? 0;

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
              const playerRelics = [
                ...(partyRelics || []),
                ...(inspectedPlayer.personalRelics || []),
              ];
              const hpPct = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (Math.max(0, inspectedPlayer.hp) /
                      Math.max(1, inspectedPlayer.maxHp)) *
                      100
                  )
                )
              );

              const dmgTypeLabel =
                CRIPTA_DAMAGE_TYPE_META[eqWeapon.activeDamageType]?.label ||
                eqWeapon.activeDamageType;

              return (
                <>
                  {/* Top Bar with Title & Close Button */}
                  <div className="px-4 py-2.5 bg-[#171123] border-b border-[#2E223D] flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-cripta-pixel font-bold text-[#E7A54A] uppercase tracking-widest">
                        ✦ IDENTIDAD DEL AVENTURERO
                      </span>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 bg-[#231934] border border-[#E7A54A] text-[8px] font-cripta-pixel font-bold text-[#FFD166] uppercase">
                          TÚ
                        </span>
                      )}
                      {isDowned && (
                        <span className="px-1.5 py-0.5 bg-[#2A0E17] border border-[#C93B5B] text-[8px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase">
                          ☠ CAÍDO
                        </span>
                      )}
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

                  {/* Body: Visual, Scannable Dark-Fantasy Character Panel */}
                  <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                    {/* 1. IDENTIDAD: Large Animated Sprite + Name + Class + Actual Combat HP Bar */}
                    <div className="p-3 bg-[#130D1D] border border-[#342648] flex items-center gap-3.5 relative overflow-hidden">
                      <div
                        className="w-20 h-20 bg-[#09060F] border-2 flex items-center justify-center shrink-0 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
                        style={{
                          borderColor: isDowned
                            ? '#C93B5B'
                            : inspectedPlayer.color || '#E7A54A',
                        }}
                      >
                        <LaCriptaPixelSprite
                          characterId={charId}
                          animationState={isDowned ? 'idle' : 'ready'}
                          size="md"
                          classResource={classResVal}
                        />
                        {(inspectedPlayer.armor || 0) > 0 && (
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-[#0E1E26] border border-[#7BDFF2] font-cripta-mono text-[8px] font-bold text-[#7BDFF2]">
                            🛡 +{inspectedPlayer.armor}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-cripta-display text-lg sm:text-xl font-black text-[#F5EFE6] uppercase truncate leading-tight">
                          {inspectedPlayer.name}
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#E7A54A] uppercase tracking-wider truncate mt-0.5">
                          {charDef?.className || 'AVENTURERO'} · {charDef?.name}
                        </div>

                        {/* Dedicated Combat HP Bar (Kept strictly separate from VIDA aptitude) */}
                        <div className="mt-2.5 space-y-1">
                          <div className="w-full h-3 bg-[#08050D] border border-[#3E2D52] overflow-hidden relative">
                            <div
                              className="h-full transition-all duration-300"
                              style={{
                                width: `${hpPct}%`,
                                backgroundColor:
                                  hpPct <= 30
                                    ? '#C93B5B'
                                    : hpPct <= 60
                                    ? '#E7A54A'
                                    : '#5EA87A',
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-cripta-mono font-bold">
                            <span className="text-[#8EE6AE]">
                              {Math.max(0, inspectedPlayer.hp)} / {inspectedPlayer.maxHp} PV
                            </span>
                            <span
                              className="text-[8px] font-cripta-pixel text-[#D8C6A0]/70 uppercase cursor-help"
                              title={`Crítico: ${effStats.critChancePct}% (×${effStats.critDamageMult}) · Evasión: ${effStats.dodgeChancePct}% · Res. Estados: ${effStats.statusResistPct}% · Iniciativa: ${effStats.initiativeScore}`}
                            >
                              CRIT {effStats.critChancePct}% · EVA {effStats.dodgeChancePct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. ATRIBUTOS: Shared 10-Segment Pixel-Square Bars (Same Visual Language as Lobby) */}
                    <div className="p-3 bg-[#120C1B] border border-[#2E223D]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-cripta-pixel text-[#E7A54A] font-bold uppercase tracking-widest">
                          ATRIBUTOS
                        </span>
                        <span className="text-[8px] font-cripta-pixel text-[#D8C6A0]/55 uppercase">
                          PASA EL CURSOR PARA DETALLES
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <LaCriptaStatSegments
                          stat="health"
                          value={charDef?.stats.health ?? 5}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_health`}
                          tooltip={`VIDA (${charDef?.stats.health ?? 5}/10): Aptitud vital de clase · Salud máxima actual: ${inspectedPlayer.maxHp} PV`}
                        />
                        <LaCriptaStatSegments
                          stat="attack"
                          value={effStats.attack}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_attack`}
                          tooltip={`ATAQUE (${effStats.attack}): Base ${baseAtk}${
                            bonusAtk !== 0 ? ` (${bonusAtk > 0 ? `+${bonusAtk}` : bonusAtk} por equipo/bonos)` : ''
                          } · Daño estimado: ${formatDamageRange(weaponDmgEst.min, weaponDmgEst.max)}`}
                        />
                        <LaCriptaStatSegments
                          stat="defense"
                          value={effStats.defense}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_defense`}
                          tooltip={`DEFENSA (${effStats.defense}): Base ${baseDef}${
                            bonusDef !== 0 ? ` (${bonusDef > 0 ? `+${bonusDef}` : bonusDef} por equipo/bonos)` : ''
                          } · Escudo activo: +${inspectedPlayer.armor || 0}`}
                        />
                        <LaCriptaStatSegments
                          stat="magic"
                          value={effStats.magic}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_magic`}
                          tooltip={`MAGIA (${effStats.magic}): Base ${baseMag}${
                            bonusMag !== 0 ? ` (${bonusMag > 0 ? `+${bonusMag}` : bonusMag} por equipo/bonos)` : ''
                          } · Potencia conjuros, alquimia y drenaje`}
                        />
                        <LaCriptaStatSegments
                          stat="agility"
                          value={effStats.agility}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_agility`}
                          tooltip={`AGILIDAD (${effStats.agility}): Base ${baseAgi}${
                            bonusAgi !== 0 ? ` (${bonusAgi > 0 ? `+${bonusAgi}` : bonusAgi} por equipo/bonos)` : ''
                          } · Evasión: ${effStats.dodgeChancePct}% · Iniciativa: ${effStats.initiativeScore}`}
                        />
                        <LaCriptaStatSegments
                          stat="precision"
                          value={effStats.precision}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_precision`}
                          tooltip={`PRECISIÓN (${effStats.precision}): Base ${basePre}${
                            bonusPre !== 0 ? ` (${bonusPre > 0 ? `+${bonusPre}` : bonusPre} por equipo/bonos)` : ''
                          } · Crítico: ${effStats.critChancePct}% (×${effStats.critDamageMult}) · Perforación: +${effStats.armorPierceBonus} ARM`}
                        />
                        <LaCriptaStatSegments
                          stat="willpower"
                          value={effStats.willpower}
                          max={10}
                          triggerKey={`${inspectedPlayer.id}_willpower`}
                          tooltip={`VOLUNTAD (${effStats.willpower}): Base ${baseVol}${
                            bonusVol !== 0 ? ` (${bonusVol > 0 ? `+${bonusVol}` : bonusVol} por equipo/bonos)` : ''
                          } · Res. Estados: ${effStats.statusResistPct}% · Bono Curación: +${Math.max(effStats.potionBoostPct || 0, effStats.healBoostPct || 0)}%`}
                        />
                      </div>
                    </div>

                    {/* 3. MECÁNICA DE CLASE (Compact Visual Bar/Pips + Hover/Tap for Details) */}
                    {(() => {
                      const mechHud = getPlayerClassMechanicHudState(inspectedPlayer);
                      const mechDef = getClassMechanicForCharacter(charId);
                      if (!mechHud || !mechDef) return null;
                      return (
                        <div
                          className="p-3 bg-[#120C1C] border flex flex-col gap-2"
                          style={{ borderColor: `${mechHud.colorHex}88` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="text-[10px] font-cripta-pixel font-bold uppercase tracking-wider flex items-center gap-1.5"
                              style={{ color: mechHud.colorHex }}
                            >
                              <span>{mechHud.iconSymbol}</span>
                              <span>{mechHud.label}</span>
                            </span>
                            <span
                              className="font-cripta-mono text-xs font-black"
                              style={{ color: mechHud.colorHex }}
                            >
                              {mechHud.current} / {mechHud.max}
                            </span>
                          </div>

                          {/* Visual Bar for FURIA (0-100) or Compact Segment Pips for 1-5 Mechanics */}
                          {mechHud.kind === 'FURIA' ? (
                            <div className="w-full h-2.5 bg-[#08060C] border border-[#3B1D26] overflow-hidden relative">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, classResVal)}%`,
                                  backgroundColor:
                                    classResVal >= 75 ? '#EF4444' : '#F97316',
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: mechHud.max }).map((_, idx) => {
                                const lit = classResVal > idx;
                                return (
                                  <div
                                    key={idx}
                                    className="flex-1 h-2.5 border transition-colors"
                                    style={{
                                      borderColor: lit ? mechHud.colorHex : '#282039',
                                      backgroundColor: lit
                                        ? mechHud.colorHex
                                        : '#08060C',
                                    }}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* Compact Active State & Bonus Line + [? VER DETALLES] */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <div className="min-w-0">
                              <div
                                className="text-[9px] font-cripta-pixel font-bold uppercase truncate"
                                style={{ color: '#FFD166' }}
                              >
                                ★ {mechHud.stateBadge}
                              </div>
                              <div className="text-[9px] font-cripta-pixel text-[#8EE6AE] truncate">
                                {mechHud.bonusSummary}
                              </div>
                            </div>

                            <LaCriptaPixelTooltip
                              title={`${mechHud.iconSymbol} ${mechDef.name} (${mechHud.current}/${mechHud.max})`}
                              category={`MECÁNICA DE CLASE · ${charDef?.className || ''}`}
                              description={`${mechDef.shortDescription} | CÓMO GANAR: ${mechDef.howToGain} | CÓMO USAR: ${mechDef.howToSpendOrTrigger}`}
                              footerLabel={`${mechHud.stateBadge} · ${mechHud.bonusSummary}`}
                              borderColor={mechHud.colorHex}
                            >
                              <button
                                type="button"
                                onClick={() => setShowMechanicDetails((v) => !v)}
                                className="px-2 py-1 bg-[#1D142C] hover:bg-[#291C3D] border border-[#4A3B5C] hover:border-[#FFD166] text-[8px] font-cripta-pixel font-bold text-[#D8C6A0] hover:text-[#FFD166] uppercase tracking-wider cursor-pointer shrink-0"
                              >
                                ? {showMechanicDetails ? 'OCULTAR' : 'VER DETALLES'}
                              </button>
                            </LaCriptaPixelTooltip>
                          </div>

                          {showMechanicDetails && (
                            <div className="pt-2 border-t border-[#2E223D] space-y-1 text-[8.5px] font-cripta-pixel text-[#D8C6A0]/90 leading-relaxed">
                              <div className="text-[#F5EFE6]">
                                {mechDef.shortDescription}
                              </div>
                              <div>
                                <strong className="text-[#8EE6AE]">GANAR:</strong>{' '}
                                {mechDef.howToGain}
                              </div>
                              <div>
                                <strong className="text-[#FFD166]">USAR:</strong>{' '}
                                {mechDef.howToSpendOrTrigger}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 4. EQUIPO (Visual Weapon Card + Armor, Accessory & Relics) */}
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-cripta-pixel text-[#E7A54A] font-bold uppercase tracking-widest">
                        EQUIPO
                      </div>

                      {/* Weapon Card */}
                      <LaCriptaPixelTooltip
                        title={`${eqWeapon.weapon.name} (Nv.${eqWeapon.level})`}
                        category={`ARMA · ${dmgTypeLabel}`}
                        description={`${eqWeapon.weapon.specialEffectText}${
                          eqWeapon.activeRune
                            ? ` | RUNA (${eqWeapon.activeRune.name}): ${eqWeapon.activeRune.benefitText} · ${eqWeapon.activeRune.tradeoffText}`
                            : ''
                        }`}
                        footerLabel={`ESCALA CON ${eqWeapon.weapon.scalingStat} · TÉCNICA: ${eqWeapon.weapon.specialAttack.name}`}
                        borderColor={eqWeapon.activeRune?.accentColor || '#E7A54A'}
                        className="block w-full"
                      >
                        <div className="p-2.5 bg-[#150F20] border border-[#E7A54A]/70 flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-11 h-11 bg-[#0B0811] border border-[#E7A54A] flex items-center justify-center shrink-0 relative">
                              <LaCriptaWeaponPixelIcon
                                weaponId={eqWeapon.weapon.id}
                                upgradeLevel={eqWeapon.level}
                                size={34}
                              />
                              <span className="absolute -bottom-1 -right-1 px-1 bg-[#09070D] border border-[#FFD166] font-cripta-mono text-[8px] font-bold text-[#FFD166]">
                                NV.{eqWeapon.level}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-cripta-display text-xs font-black text-[#FFD166] uppercase truncate">
                                {eqWeapon.weapon.name}
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <LaCriptaDamageTypeBadge
                                  damageType={eqWeapon.activeDamageType}
                                  secondaryType={eqWeapon.secondaryDamageType}
                                  compact
                                />
                                <span className="font-cripta-mono text-[10px] font-bold text-[#FF8FA3]">
                                  {formatDamageRange(weaponDmgEst.min, weaponDmgEst.max)} daño
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Compact Rune Switcher if player owns runes */}
                          {(inspectedPlayer.ownedWeaponRunes || []).length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {(inspectedPlayer.ownedWeaponRunes || []).map((rId) => {
                                const rDef = CRIPTA_WEAPON_RUNES_REGISTRY[rId];
                                if (!rDef) return null;
                                const isEquippedRune =
                                  inspectedPlayer.equippedWeaponRuneId === rId;
                                return (
                                  <button
                                    key={rId}
                                    type="button"
                                    disabled={!isSelf || !onEquipWeaponRune}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isSelf || !onEquipWeaponRune) return;
                                      laCriptaAudio.playDoorVote();
                                      onEquipWeaponRune(isEquippedRune ? null : rId);
                                    }}
                                    title={`${rDef.name}: ${rDef.benefitText} (${rDef.tradeoffText})`}
                                    className={`p-1 border transition-all ${
                                      isEquippedRune
                                        ? 'bg-[#251838] border-[#FFD166]'
                                        : 'bg-[#120D1B] border-[#4A3B5C] opacity-70 hover:opacity-100'
                                    } ${
                                      isSelf && onEquipWeaponRune
                                        ? 'cursor-pointer'
                                        : 'cursor-default'
                                    }`}
                                  >
                                    <LaCriptaWeaponRunePixelIcon
                                      runeId={rId}
                                      size={16}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </LaCriptaPixelTooltip>

                      {/* Armor & Accessory Compact Cards */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <LaCriptaPixelTooltip
                          title={armorDef ? armorDef.name : 'Sin Armadura'}
                          category="ARMADURA"
                          description={
                            armorDef
                              ? armorDef.specialEffectText
                              : 'Puedes adquirir corazas y túnicas en el Mercader.'
                          }
                          borderColor="#3E7B96"
                        >
                          <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#0B0811] border border-[#3E7B96] flex items-center justify-center shrink-0">
                              {armorDef ? (
                                <LaCriptaArmorPixelIcon
                                  armorId={armorDef.id}
                                  size={24}
                                />
                              ) : (
                                <span className="text-[8px] font-cripta-pixel text-[#D8C6A0]/35">
                                  ARM
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 font-cripta-pixel">
                              <div className="text-[9px] text-[#7BDFF2] font-bold uppercase truncate">
                                {armorDef ? armorDef.name : 'Sin Armadura'}
                              </div>
                              <div className="text-[8px] text-[#D8C6A0]/70 truncate">
                                {armorDef
                                  ? `+${armorDef.bonusMaxHp} PV · +${armorDef.bonusDefense} DEF`
                                  : 'Vacío'}
                              </div>
                            </div>
                          </div>
                        </LaCriptaPixelTooltip>

                        <LaCriptaPixelTooltip
                          title={accDef ? accDef.name : 'Sin Accesorio'}
                          category="ACCESORIO"
                          description={
                            accDef
                              ? accDef.specialEffectText
                              : 'Puedes adquirir anillos y amuletos en el Mercader.'
                          }
                          borderColor="#7656A8"
                        >
                          <div className="p-2 bg-[#140E1E] border border-[#2E223D] flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#0B0811] border border-[#7656A8] flex items-center justify-center shrink-0">
                              {accDef ? (
                                <LaCriptaAccessoryPixelIcon
                                  accessoryId={accDef.id}
                                  size={24}
                                />
                              ) : (
                                <span className="text-[8px] font-cripta-pixel text-[#D8C6A0]/35">
                                  ACC
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 font-cripta-pixel">
                              <div className="text-[9px] text-[#C8A6F5] font-bold uppercase truncate">
                                {accDef ? accDef.name : 'Sin Accesorio'}
                              </div>
                              <div className="text-[8px] text-[#D8C6A0]/70 truncate">
                                {accDef ? accDef.specialEffectText : 'Vacío'}
                              </div>
                            </div>
                          </div>
                        </LaCriptaPixelTooltip>
                      </div>

                      {/* Relics Strip inside EQUIPO */}
                      {playerRelics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {playerRelics.map((acq, idx) => {
                            const rDef = CRIPTA_RELICS_REGISTRY[acq.relicId];
                            if (!rDef) return null;
                            return (
                              <LaCriptaPixelTooltip
                                key={`${acq.relicId}_${idx}`}
                                title={rDef.name}
                                category="RELIQUIA ACTIVA"
                                description={rDef.description}
                                footerLabel={`HALLADA EN: ${
                                  acq.obtainedInDungeonName || 'LA CRIPTA'
                                }`}
                                borderColor="#FFD166"
                              >
                                <div className="px-2 py-1 bg-[#1A1228] border border-[#9B72CF] flex items-center gap-1.5 text-[9px] font-cripta-pixel text-[#FFD166] cursor-help">
                                  <LaCriptaRelicPixelIcon
                                    relicId={acq.relicId}
                                    size={16}
                                  />
                                  <span>{rDef.name}</span>
                                </div>
                              </LaCriptaPixelTooltip>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 5. ESTADOS (Compact Visual Status Chips) */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#E7A54A] font-bold uppercase tracking-widest mb-1.5">
                        ESTADOS
                      </div>
                      {inspectedPlayer.statuses?.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {inspectedPlayer.statuses.map((st) => (
                            <LaCriptaStatusEffectBadge key={st.id} status={st} />
                          ))}
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 bg-[#120D1A] border border-[#281E36] text-[9px] font-cripta-pixel text-[#D8C6A0]/55">
                          Sin estados alterados activos.
                        </div>
                      )}
                    </div>

                    {/* 6. HABILIDADES (Compact Visual Skill Chips with Hover Tooltip) */}
                    <div>
                      <div className="text-[9px] font-cripta-pixel text-[#E7A54A] font-bold uppercase tracking-widest mb-1.5">
                        HABILIDADES
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Weapon Special Chip */}
                        <LaCriptaPixelTooltip
                          title={eqWeapon.weapon.specialAttack.name}
                          category={`TÉCNICA DE ARMA · CD ${eqWeapon.weapon.specialAttack.cooldownRounds}T`}
                          description={eqWeapon.weapon.specialAttack.description}
                          footerLabel={
                            eqWeapon.weapon.specialAttack.dealsDamage === false
                              ? `+${eqWeapon.weapon.specialAttack.partyHealBase || 14} PV GRUPO`
                              : `${formatDamageRange(specialDmgEst.min, specialDmgEst.max)} DAÑO`
                          }
                          borderColor="#FFD166"
                        >
                          <div className="p-2 bg-[#140E1E] hover:bg-[#1C142B] border border-[#E7A54A]/70 flex flex-col items-center text-center gap-1 cursor-help">
                            <LaCriptaWeaponPixelIcon
                              weaponId={eqWeapon.weapon.id}
                              upgradeLevel={eqWeapon.level}
                              size={22}
                            />
                            <div className="font-cripta-pixel text-[8px] font-bold text-[#FFD166] uppercase truncate w-full">
                              {eqWeapon.weapon.specialAttack.name}
                            </div>
                            <div className="font-cripta-mono text-[8px] text-[#FF8FA3]">
                              {(inspectedPlayer.weaponSpecialCooldown || 0) > 0
                                ? `CD ${inspectedPlayer.weaponSpecialCooldown}T`
                                : eqWeapon.weapon.specialAttack.dealsDamage === false
                                ? `+${eqWeapon.weapon.specialAttack.partyHealBase || 14} PV`
                                : formatDamageRange(specialDmgEst.min, specialDmgEst.max)}
                            </div>
                          </div>
                        </LaCriptaPixelTooltip>

                        {/* Class Abilities Chips */}
                        {(charDef?.abilities || []).map((ab) => {
                          const liveCd =
                            inspectedPlayer.abilityCooldowns?.[ab.id] || 0;
                          return (
                            <LaCriptaPixelTooltip
                              key={ab.id}
                              title={ab.name}
                              category={`HABILIDAD DE CLASE · CD ${ab.cooldownTurns}T`}
                              description={ab.description}
                              footerLabel={
                                liveCd > 0
                                  ? `EN RECARGA: ${liveCd} TURNOS`
                                  : 'LISTA PARA USAR'
                              }
                              borderColor="#9B72CF"
                            >
                              <div className="p-2 bg-[#140E1E] hover:bg-[#1C142B] border border-[#4A3B5C] flex flex-col items-center text-center gap-1 cursor-help">
                                <span className="w-5 h-5 bg-[#211533] border border-[#9B72CF] flex items-center justify-center text-[10px] font-cripta-pixel text-[#C8A6F5]">
                                  ✦
                                </span>
                                <div className="font-cripta-pixel text-[8px] font-bold text-[#C8A6F5] uppercase truncate w-full">
                                  {ab.name}
                                </div>
                                <div
                                  className={`font-cripta-mono text-[8px] ${
                                    liveCd > 0 ? 'text-[#FF8FA3]' : 'text-[#8EE6AE]'
                                  }`}
                                >
                                  {liveCd > 0 ? `CD ${liveCd}T` : `${ab.cooldownTurns}T CD`}
                                </div>
                              </div>
                            </LaCriptaPixelTooltip>
                          );
                        })}
                      </div>
                    </div>

                    {/* 7. MOCHILA (Visual Slot Grid: Items + Empty Slots) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-cripta-pixel text-[#8EE6AE] font-bold uppercase tracking-widest">
                          MOCHILA
                        </span>
                        <span className="font-cripta-mono text-[9px] text-[#D8C6A0]/70">
                          {(inspectedPlayer.normalInventory || []).length} /{' '}
                          {NORMAL_INVENTORY_MAX_SLOTS}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {Array.from({ length: NORMAL_INVENTORY_MAX_SLOTS }).map(
                          (_, slotIdx) => {
                            const rawItem = (inspectedPlayer.normalInventory || [])[
                              slotIdx
                            ];
                            const itemId =
                              typeof rawItem === 'string'
                                ? rawItem
                                : (rawItem as { itemId?: CriptaItemId })?.itemId;
                            const itemDef = itemId
                              ? CRIPTA_ITEMS_REGISTRY[itemId]
                              : null;

                            if (!itemId || !itemDef) {
                              return (
                                <div
                                  key={`empty_${slotIdx}`}
                                  className="h-12 bg-[#0D0914]/70 border border-dashed border-[#2A1F38] flex items-center justify-center text-[8px] font-cripta-pixel text-[#D8C6A0]/30 uppercase"
                                >
                                  VACÍO
                                </div>
                              );
                            }

                            const canUseHere =
                              isSelf &&
                              !isDowned &&
                              onUseConsumable &&
                              (hasActiveCombat
                                ? itemDef.combatUsable &&
                                  isMyTurnInCombat &&
                                  !activeRoom.consumableUsedThisTurn
                                : itemDef.roomUsable);

                            return (
                              <LaCriptaPixelTooltip
                                key={`slot_${slotIdx}_${itemId}`}
                                title={itemDef.name}
                                category="CONSUMIBLE"
                                description={itemDef.description}
                                footerLabel={
                                  canUseHere ? 'CLIC EN USAR' : 'EN MOCHILA'
                                }
                                borderColor="#5EA87A"
                              >
                                <div className="h-12 px-2 bg-[#140E1E] border border-[#382A4B] flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <LaCriptaItemPixelIcon
                                      itemId={itemId}
                                      size={22}
                                    />
                                    <span className="text-[8px] font-cripta-pixel text-[#F5EFE6] truncate">
                                      {itemDef.name}
                                    </span>
                                  </div>
                                  {canUseHere && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        laCriptaAudio.playDoorVote();
                                        onUseConsumable(
                                          slotIdx,
                                          selectedTargetEnemyId || undefined,
                                          inspectedPlayer.id
                                        );
                                      }}
                                      className="px-1 py-0.5 bg-[#1C2F23] hover:bg-[#274432] border border-[#5EA87A] text-[7px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase cursor-pointer shrink-0"
                                    >
                                      USAR
                                    </button>
                                  )}
                                </div>
                              </LaCriptaPixelTooltip>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[9px] font-cripta-pixel text-[#D8C6A0]/75 shrink-0">
                    <span>PANEL DE AVENTURERO</span>
                    <span>ESC PARA CERRAR</span>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ===================================================================
            MODE 3: ENEMY_INSPECTION (BESTIARY / CREATURE SHEET REDESIGN)
            =================================================================== */}
        {mode === 'ENEMY_INSPECTION' && inspectedEnemy && (
          <>
            {(() => {
              const approxRange = computeEnemyApproxDamageRange(inspectedEnemy);
              const traits = getEnemyWeaknessAndResistanceProfile(inspectedEnemy);
              const builtArchetype = buildEnemyAiProfileForArchetype(inspectedEnemy);
              const aiProfile =
                inspectedEnemy.aiProfile || builtArchetype.aiProfile;
              const enemyProfession =
                inspectedEnemy.profession || builtArchetype.profession || 'GUERRERO';
              const enemyDef = inspectedEnemy.armor || 0;
              const magicRes = inspectedEnemy.magicResistance || 0;
              const resolvedDungeon =
                dungeon || CRIPTA_DUNGEONS_REGISTRY.catacumbas_del_rey;

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

              const spriteDisplaySize =
                inspectedEnemy.isBoss ||
                inspectedEnemy.isFinalBoss ||
                inspectedEnemy.isMiniboss
                  ? 224
                  : 204;

              return (
                <>
                  {/* 1. PANEL HEADER: Category, Profession Badge, Large Name, Subtitle & Close Button */}
                  <div className="px-4 py-3.5 bg-[#171123] border-b-2 border-[#2E223D] flex items-start justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-cripta-pixel font-bold text-[#E7A54A] uppercase tracking-widest">
                          {inspectedEnemy.isFinalBoss || inspectedEnemy.isBoss
                            ? 'SOBERANO DEL ABISMO'
                            : inspectedEnemy.isMiniboss
                            ? 'MINIJFE DE LA MAZMORRA'
                            : inspectedEnemy.isElite
                            ? 'CRIATURA ÉLITE'
                            : 'CRIATURA DE CRIPTA'}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#241838] border border-[#7656A8] text-[8px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-wider">
                          ROL: {enemyProfession}
                        </span>
                      </div>
                      <h3 className="mt-0.5 font-cripta-display text-lg sm:text-xl font-black text-[#F5EFE6] uppercase leading-tight tracking-wide">
                        {inspectedEnemy.name}
                      </h3>
                      <div className="mt-0.5 text-[10px] font-cripta-pixel text-[#D8C6A0]/80 uppercase tracking-wider">
                        {resolvedDungeon.name}
                        {inspectedEnemy.title ? ` · ${inspectedEnemy.title}` : ''}
                      </div>
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
                            className="px-2.5 py-1.5 bg-[#2A121D] hover:bg-[#3D1A2A] border border-[#FF4D6D] text-[9px] font-cripta-pixel font-bold text-[#FFD166] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Crosshair className="w-3 h-3" />
                            <span>FIJAR OBJETIVO</span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar examen de enemigo"
                        className="p-1.5 bg-[#221832] hover:bg-[#312247] border border-[#4A3B5C] hover:border-[#FFD166] text-[#D8C6A0] hover:text-[#FFD166] cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* SCROLLABLE BESTIARY SHEET CONTENT */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* 2. DEDICATED LARGE ANIMATED SPRITE STAGE WITH SUBTLE BIOME BACKDROP */}
                    <div className="relative w-full min-h-[205px] sm:min-h-[228px] bg-[#09060E] border-2 border-[#38294A] overflow-hidden flex flex-col items-center justify-center py-3 shadow-[inset_0_0_38px_rgba(0,0,0,0.9)]">
                      {/* Subtle Biome-Specific Inspection Backdrop */}
                      <div className="absolute inset-0 opacity-65 pointer-events-none">
                        <LaCriptaBiomeStageBackdrop
                          dungeon={resolvedDungeon}
                          transparentSkybox={false}
                          isBossOrMiniboss={Boolean(
                            inspectedEnemy.isBoss ||
                              inspectedEnemy.isFinalBoss ||
                              inspectedEnemy.isMiniboss
                          )}
                        />
                      </div>

                      {/* Large Live Idle Creature Sprite (purely visual representation) */}
                      <div className="relative z-10 flex items-center justify-center">
                        <LaCriptaEnemyPixelSprite
                          enemy={inspectedEnemy}
                          dungeonId={resolvedDungeon.id}
                          animState={inspectedEnemy.hp <= 0 ? 'death' : 'idle'}
                          customSizePx={spriteDisplaySize}
                        />
                      </div>

                      {/* Active Status Badges Floating at Bottom of Bestiary Stage (All Active Buffs/Debuffs) */}
                      {(() => {
                        const activeEnStatuses = getEnemyActiveStatuses(inspectedEnemy);
                        if (activeEnStatuses.length === 0) return null;
                        return (
                          <div className="relative z-20 mt-2 flex flex-wrap items-center justify-center gap-1.5 px-3">
                            {activeEnStatuses.map((st) => (
                              <LaCriptaStatusEffectBadge
                                key={st.id}
                                effectType={st.effectType}
                                turnsRemaining={st.remainingTurns}
                                stacks={st.stacks}
                              />
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* 3. PRIMARY STATS: SALUD | DAÑO | DEFENSA */}
                    <div className="grid grid-cols-3 gap-2.5 text-center font-cripta-pixel">
                      {/* SALUD: Red/Pink Accent */}
                      <div className="px-2.5 py-2.5 bg-[#170C14] border border-[#9E2A45] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold tracking-widest text-[#FF8FA3]/80 uppercase">
                          SALUD
                        </span>
                        <span className="mt-1 font-cripta-mono text-sm sm:text-base font-black text-[#FF8FA3]">
                          {Math.max(0, inspectedEnemy.hp)} / {inspectedEnemy.maxHp}
                        </span>
                      </div>

                      {/* DAÑO: Warm Yellow/Orange Accent */}
                      <div className="px-2.5 py-2.5 bg-[#19120B] border border-[#C88A32] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold tracking-widest text-[#FFD166]/80 uppercase">
                          DAÑO
                        </span>
                        <span className="mt-1 font-cripta-mono text-sm sm:text-base font-black text-[#FFD166]">
                          ~{approxRange.min}–{approxRange.max}
                        </span>
                      </div>

                      {/* DEFENSA: Cyan/Blue-Grey Accent */}
                      <div className="px-2.5 py-2.5 bg-[#0C151D] border border-[#3E7B96] flex flex-col items-center justify-center">
                        <span className="text-[9px] font-bold tracking-widest text-[#7BDFF2]/80 uppercase">
                          DEFENSA
                        </span>
                        <span className="mt-1 font-cripta-mono text-sm sm:text-base font-black text-[#7BDFF2]">
                          {enemyDef}
                          {magicRes > 0 ? ` · RM ${magicRes}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* 4 & 5. WEAKNESSES & RESISTANCES + LIVE WEAPON MATCHUP BANNER */}
                    {localPlayer && (
                      (() => {
                        const myMatchup = getWeaponVsEnemyMatchupSummary(
                          localPlayer,
                          'ATTACK',
                          inspectedEnemy
                        );
                        const myWeapon = getEquippedWeaponForPlayer(localPlayer);
                        return (
                          <div
                            className={`p-2 border flex items-center justify-between gap-2 font-cripta-pixel text-[10px] ${
                              myMatchup.state === 'WEAKNESS'
                                ? 'bg-[#102419] border-[#48BB78] text-[#8EE6AE]'
                                : myMatchup.state === 'RESISTANCE'
                                ? 'bg-[#261219] border-[#E53E3E] text-[#FF8FA3]'
                                : 'bg-[#140F1E] border-[#382A4B] text-[#D8C6A0]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <LaCriptaDamageTypeBadge
                                damageType={myWeapon.activeDamageType}
                                secondaryType={myWeapon.secondaryDamageType}
                                compact
                              />
                              <span className="truncate font-bold">
                                TU ARMA ({myWeapon.weapon.name}):
                              </span>
                            </div>
                            <span className="font-bold shrink-0">
                              {myMatchup.state === 'WEAKNESS'
                                ? `✦ VULNERABLE (+${myMatchup.deltaPct}% DAÑO)`
                                : myMatchup.state === 'RESISTANCE'
                                ? `⚠ RESISTENTE (${myMatchup.deltaPct}% DAÑO)`
                                : 'DAÑO ESTÁNDAR (×1.0)'}
                            </span>
                          </div>
                        );
                      })()
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* DEBILIDADES */}
                      <div>
                        <div className="text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase tracking-widest mb-2">
                          DEBILIDADES
                        </div>
                        <div className="space-y-2">
                          {traits.weaknesses.map((w) => (
                            <div
                              key={w.id}
                              className="p-2.5 bg-[#101E17] border border-[#3B7A54] flex flex-col gap-1 font-cripta-pixel"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-[#F5EFE6] uppercase">
                                <LaCriptaTraitPixelIcon kind={w.iconKind} size={14} />
                                <span>{w.label}</span>
                              </div>
                              <div className="pl-5 text-[10px] font-bold text-[#8EE6AE] uppercase tracking-wider">
                                {w.modifierText.includes('DAÑO')
                                  ? w.modifierText
                                  : `${w.modifierText} DAÑO RECIBIDO`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RESISTENCIAS */}
                      <div>
                        <div className="text-[10px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase tracking-widest mb-2">
                          RESISTENCIAS
                        </div>
                        <div className="space-y-2">
                          {traits.resistances.map((r) => (
                            <div
                              key={r.id}
                              className="p-2.5 bg-[#1F1017] border border-[#8F263D] flex flex-col gap-1 font-cripta-pixel"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-[#F5EFE6] uppercase">
                                <LaCriptaTraitPixelIcon kind={r.iconKind} size={14} />
                                <span>{r.label}</span>
                              </div>
                              <div className="pl-5 text-[10px] font-bold text-[#FF8FA3] uppercase tracking-wider">
                                {r.modifierText === 'INMUNE' ||
                                r.modifierText.includes('DAÑO')
                                  ? r.modifierText
                                  : `${r.modifierText} DAÑO RECIBIDO`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 6. ATAQUES DE LA CRIATURA (Known & Unknown Attacks with Comfortable Spacing) */}
                    <div>
                      <div className="text-[10px] font-cripta-pixel font-bold text-[#E7A54A] uppercase tracking-widest mb-2">
                        ATAQUES DE LA CRIATURA
                      </div>
                      <div className="space-y-2.5">
                        {(aiProfile.abilities || []).map((ab) => {
                          const isKnown = true;

                          const mult = ab.damageMultiplier || 1;
                          const abMin = Math.max(
                            2,
                            Math.round(approxRange.min * mult)
                          );
                          const abMax = Math.max(
                            abMin + 1,
                            Math.round(approxRange.max * mult)
                          );

                          const isSupportOrDefense =
                            ab.actionKind === 'DEFEND_SELF' ||
                            ab.actionKind === 'BUFF_ARMOR' ||
                            ab.actionKind === 'BUFF_ALLY_ATTACK' ||
                            ab.actionKind === 'CLEANSE_ALLY' ||
                            ab.actionKind === 'SUMMON' ||
                            ab.actionKind === 'HEAL_SELF' ||
                            ab.actionKind === 'HEAL_ALLY';

                          const attackCategoryLabel =
                            ab.actionKind === 'HEAL_SELF' ||
                            ab.actionKind === 'HEAL_ALLY'
                              ? 'Curación · Apoyo'
                              : ab.actionKind === 'CLEANSE_ALLY'
                              ? 'Purificación · Soporte'
                              : ab.actionKind === 'BUFF_ALLY_ATTACK'
                              ? 'Potenciación · Soporte'
                              : ab.actionKind === 'SUMMON'
                              ? 'Invocación · Esbirro'
                              : ab.actionKind === 'DEFEND_SELF' ||
                                ab.actionKind === 'BUFF_ARMOR'
                              ? 'Defensa · Guardia'
                              : ab.actionKind === 'DEBUFF_ARMOR'
                              ? 'Debilitación · Control'
                              : ab.actionKind === 'DRAIN_ATTACK'
                              ? 'Drenaje Vital'
                              : ab.actionKind === 'AOE_ATTACK'
                              ? 'Ataque de área'
                              : ab.statusToApply
                              ? 'Ataque · Aflicción'
                              : 'Ataque directo';

                          const statusName = ab.statusToApply
                            ? CRIPTA_STATUS_EFFECTS_REGISTRY[ab.statusToApply]
                                ?.name || ab.statusToApply
                            : null;

                          const actionSummary =
                            ab.actionKind === 'AOE_ATTACK'
                              ? `Impacta a todos los aventureros del grupo.${
                                  statusName
                                    ? ` Puede aplicar ${statusName} durante ${
                                        ab.statusTurns || 2
                                      } turnos.`
                                    : ''
                                }`
                              : ab.actionKind === 'HEAL_SELF' ||
                                ab.actionKind === 'HEAL_ALLY'
                              ? `Restaura ~${ab.healAmount || 12} PV a sí mismo o a un aliado herido (<60% PV).`
                              : ab.actionKind === 'CLEANSE_ALLY'
                              ? `Purifica estados negativos de un aliado y restaura ~${
                                  ab.healAmount || 8
                                } PV.`
                              : ab.actionKind === 'BUFF_ALLY_ATTACK'
                              ? `Potencia el ataque de un aliado o propio (+25% ATQ) y otorga +${
                                  ab.armorBonus || 2
                                } DEF.`
                              : ab.actionKind === 'SUMMON'
                              ? `Invoca un esbirro menor en la sala (máx. 1 invocación activa, límite 3 enemigos).`
                              : ab.actionKind === 'DEFEND_SELF' ||
                                ab.actionKind === 'BUFF_ARMOR'
                              ? `Alza su guardia y refuerza la defensa (+${
                                  ab.armorBonus || 3
                                } DEF).`
                              : ab.actionKind === 'DEBUFF_ARMOR'
                              ? `Fractura la defensa del objetivo y aplica Vulnerabilidad.`
                              : ab.actionKind === 'DRAIN_ATTACK'
                              ? `Drena vitalidad del objetivo y se cura ~${
                                  ab.healAmount || 8
                                } PV.`
                              : statusName
                              ? `Puede aplicar ${statusName} durante ${
                                  ab.statusTurns || 2
                                } turnos.`
                              : 'Ataque directo contra un aventurero.';

                          if (!isKnown) {
                            return (
                              <div
                                key={ab.id}
                                className="p-3 bg-[#120C1A] border border-dashed border-[#38294A] font-cripta-pixel space-y-1"
                              >
                                <div className="text-xs font-bold text-[#D8C6A0]/70 uppercase tracking-wider">
                                  ???  ATAQUE NO OBSERVADO
                                </div>
                                <div className="text-[10px] text-[#D8C6A0]/55 leading-relaxed">
                                  Se revelará cuando la criatura utilice esta técnica.
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={ab.id}
                              className="p-3 bg-[#150F21] border border-[#342647] font-cripta-pixel space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-cripta-display text-xs sm:text-sm font-black text-[#FFD166] uppercase tracking-wide">
                                    {ab.name}
                                  </div>
                                  <div className="text-[9px] text-[#D8C6A0]/70 uppercase tracking-wider">
                                    {attackCategoryLabel}
                                  </div>
                                </div>

                                {!isSupportOrDefense && (
                                  <span className="px-2 py-0.5 bg-[#24131D] border border-[#C93B5B] font-cripta-mono text-[11px] font-bold text-[#FF8FA3] shrink-0">
                                    ~{abMin}–{abMax} DAÑO
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-[#E8DFCE] leading-relaxed">
                                {actionSummary}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 7. EFECTOS QUE PUEDE APLICAR (With Real Canonical Gameplay Description) */}
                    <div>
                      <div className="text-[10px] font-cripta-pixel font-bold text-[#D8C6A0] uppercase tracking-widest mb-2">
                        EFECTOS QUE PUEDE APLICAR
                      </div>
                      {statusCapabilities.length > 0 ? (
                        <div className="space-y-2">
                          {statusCapabilities.map((cap) => {
                            const stDef =
                              CRIPTA_STATUS_EFFECTS_REGISTRY[cap.statusType];
                            if (!stDef) return null;
                            return (
                              <div
                                key={cap.statusType}
                                className="p-2.5 border font-cripta-pixel space-y-1"
                                style={{
                                  backgroundColor: stDef.visualTreatment.bgTint,
                                  borderColor: stDef.visualTreatment.borderColor,
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div
                                    className="flex items-center gap-2 text-xs font-bold uppercase"
                                    style={{ color: stDef.visualTreatment.color }}
                                  >
                                    <LaCriptaStatusPixelIcon
                                      effectType={cap.statusType}
                                      size={14}
                                    />
                                    <span>{stDef.name}</span>
                                  </div>
                                  <span className="px-1.5 py-0.5 bg-[#09070D]/80 border border-[#38294A] text-[9px] font-bold text-[#F5EFE6] uppercase">
                                    {cap.turns} TURNOS
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#E8DFCE]/90 leading-relaxed">
                                  {stDef.description}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-[#120D1A] border border-[#2A1F38] text-[10px] font-cripta-pixel text-[#D8C6A0]/60">
                          Ataques físicos directos sin estados alterados adicionales.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-[#140E1F] border-t border-[#2E223D] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]/75 shrink-0">
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
