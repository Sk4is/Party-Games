import React, { useState } from 'react';
import {
  CriptaAcquiredRelic,
  CriptaItemId,
  CriptaPendingInventoryReplacement,
  CriptaPlayer,
  CriptaRelicId,
  CriptaRoomGroundDrop,
  CriptaShopSlot,
} from '../../types/laCripta';
import {
  CRIPTA_ITEMS_REGISTRY,
  CRIPTA_RELICS_REGISTRY,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_WEAPONS_REGISTRY,
  getEquippedWeaponForPlayer,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

/**
 * Original 16x16 Pixel-Art SVG Icons for the 12 Normal Consumable Items (No emojis).
 */
export const LaCriptaItemPixelIcon: React.FC<{
  itemId: CriptaItemId;
  size?: number;
}> = ({ itemId, size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="shrink-0 select-none"
    >
      {itemId === 'venda' && (
        <g>
          {/* Bandage roll with crimson cross */}
          <rect x="2" y="4" width="12" height="8" fill="#D9D0BC" />
          <rect x="3" y="3" width="10" height="10" fill="#EAE2D0" />
          <rect x="4" y="5" width="8" height="6" fill="#D8C6A0" />
          <rect x="7" y="5" width="2" height="6" fill="#C93B5B" />
          <rect x="5" y="7" width="6" height="2" fill="#C93B5B" />
          <rect x="12" y="9" width="3" height="2" fill="#D9D0BC" />
        </g>
      )}
      {(itemId === 'pocion_curacion' || itemId === 'pocion_mayor') && (
        <g>
          {/* Cork & glass neck */}
          <rect x="6" y="1" width="4" height="2" fill="#B88746" />
          <rect x="5" y="3" width="6" height="1" fill="#A9C6D9" />
          <rect x="6" y="4" width="4" height="2" fill="#7D9FB8" />
          {/* Flask body */}
          <rect
            x="3"
            y="6"
            width="10"
            height="8"
            fill={itemId === 'pocion_mayor' ? '#E02F56' : '#C93B5B'}
          />
          <rect
            x="4"
            y="5"
            width="8"
            height="10"
            fill={itemId === 'pocion_mayor' ? '#C93B5B' : '#9E2340'}
          />
          {/* Liquid highlight & gold trim on Mayor */}
          <rect x="5" y="7" width="2" height="4" fill="#FF9BB0" />
          {itemId === 'pocion_mayor' && (
            <rect x="3" y="9" width="10" height="2" fill="#E7A54A" />
          )}
        </g>
      )}
      {itemId === 'antidoto' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#B88746" />
          <rect x="6" y="3" width="4" height="3" fill="#A9C6D9" />
          <rect x="4" y="6" width="8" height="8" fill="#3B9B64" />
          <rect x="5" y="7" width="6" height="6" fill="#5EE088" />
          <rect x="5" y="7" width="2" height="3" fill="#C8FFE0" />
        </g>
      )}
      {itemId === 'tonico_claridad' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#A9C6D9" />
          <rect x="4" y="5" width="8" height="9" fill="#468EA8" />
          <rect x="5" y="6" width="6" height="7" fill="#6CD4FF" />
          <rect x="7" y="7" width="2" height="4" fill="#FFFFFF" />
        </g>
      )}
      {itemId === 'unguento_igneo' && (
        <g>
          {/* Wide jar with warm salve */}
          <rect x="4" y="2" width="8" height="2" fill="#8C5A32" />
          <rect x="3" y="4" width="10" height="9" fill="#D97A2B" />
          <rect x="4" y="5" width="8" height="7" fill="#FFB347" />
          <rect x="6" y="6" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'sal_purificadora' && (
        <g>
          {/* Crystalline pouch */}
          <rect x="6" y="2" width="4" height="2" fill="#E7A54A" />
          <rect x="4" y="4" width="8" height="9" fill="#9B72CF" />
          <rect x="5" y="5" width="6" height="7" fill="#D8C6A0" />
          <rect x="7" y="6" width="2" height="5" fill="#FFFFFF" />
          <rect x="5" y="8" width="6" height="2" fill="#FFFFFF" />
        </g>
      )}
      {itemId === 'elixir_fuerza' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="3" fill="#593E25" />
          <rect x="3" y="6" width="10" height="8" fill="#B83227" />
          <rect x="4" y="7" width="8" height="6" fill="#FF6B3D" />
          <rect x="7" y="7" width="2" height="5" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'elixir_hierro' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#D8C6A0" />
          <rect x="4" y="3" width="8" height="11" fill="#4A6475" />
          <rect x="5" y="4" width="6" height="9" fill="#7CA3B8" />
          <rect x="6" y="5" width="4" height="4" fill="#C4E8F5" />
        </g>
      )}
      {itemId === 'elixir_arcano' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#7656A8" />
          <rect x="3" y="5" width="10" height="9" fill="#63389E" />
          <rect x="4" y="6" width="8" height="7" fill="#B57CFF" />
          <rect x="7" y="7" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'bomba_humo' && (
        <g>
          {/* Fuse + dark iron sphere */}
          <rect x="9" y="1" width="3" height="2" fill="#E7A54A" />
          <rect x="7" y="2" width="2" height="2" fill="#D8C6A0" />
          <rect x="3" y="4" width="10" height="10" fill="#2A2633" />
          <rect x="4" y="5" width="8" height="8" fill="#474157" />
          <rect x="5" y="6" width="3" height="3" fill="#8C84A3" />
        </g>
      )}
      {itemId === 'frasco_volatil' && (
        <g>
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#A9C6D9" />
          <rect x="3" y="5" width="10" height="9" fill="#2C8C4B" />
          <rect x="4" y="6" width="8" height="7" fill="#7CFC00" />
          <rect x="6" y="7" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}
    </svg>
  );
};

/**
 * Original 16x16 Pixel-Art SVG Icons for the 12 Build-Defining Relics (No emojis).
 */
export const LaCriptaRelicPixelIcon: React.FC<{
  relicId: CriptaRelicId;
  size?: number;
}> = ({ relicId, size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="shrink-0 select-none"
    >
      {relicId === 'corazon_de_hierro' && (
        <g>
          <rect x="2" y="3" width="5" height="5" fill="#7CA3B8" />
          <rect x="9" y="3" width="5" height="5" fill="#7CA3B8" />
          <rect x="3" y="5" width="10" height="6" fill="#C93B5B" />
          <rect x="5" y="11" width="6" height="2" fill="#7CA3B8" />
          <rect x="7" y="13" width="2" height="2" fill="#E7A54A" />
          <rect x="5" y="5" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}
      {relicId === 'diente_del_rey' && (
        <g>
          <rect x="4" y="2" width="8" height="3" fill="#E7A54A" />
          <rect x="5" y="5" width="6" height="5" fill="#EAE2D0" />
          <rect x="6" y="10" width="4" height="3" fill="#D8C6A0" />
          <rect x="7" y="13" width="2" height="2" fill="#C93B5B" />
        </g>
      )}
      {relicId === 'ojo_del_oraculo' && (
        <g>
          <rect x="2" y="6" width="12" height="4" fill="#9B72CF" />
          <rect x="4" y="4" width="8" height="8" fill="#E7A54A" />
          <rect x="5" y="5" width="6" height="6" fill="#6CD4FF" />
          <rect x="7" y="6" width="2" height="4" fill="#0B0A0E" />
        </g>
      )}
      {relicId === 'frasco_sin_fondo' && (
        <g>
          <rect x="5" y="1" width="6" height="2" fill="#E7A54A" />
          <rect x="3" y="4" width="10" height="10" fill="#5EA87A" />
          <rect x="5" y="6" width="6" height="6" fill="#9FFFCB" />
          <rect x="7" y="7" width="2" height="4" fill="#FFFFFF" />
        </g>
      )}
      {relicId === 'sello_del_vacio' && (
        <g>
          <rect x="3" y="3" width="10" height="10" fill="#7656A8" />
          <rect x="5" y="5" width="6" height="6" fill="#0B0A0E" />
          <rect x="7" y="2" width="2" height="12" fill="#B57CFF" />
          <rect x="2" y="7" width="12" height="2" fill="#B57CFF" />
        </g>
      )}
      {relicId === 'moneda_del_muerto' && (
        <g>
          <rect x="3" y="2" width="10" height="12" fill="#E7A54A" />
          <rect x="2" y="3" width="12" height="10" fill="#FFD166" />
          <rect x="5" y="5" width="6" height="6" fill="#593E25" />
          <rect x="6" y="6" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}
      {(relicId === 'espina_viva' || relicId === 'toxina_real') && (
        <g>
          <rect x="7" y="1" width="2" height="14" fill="#3B9B64" />
          <rect x="4" y="4" width="8" height="3" fill="#5EE088" />
          <rect x="5" y="9" width="6" height="3" fill="#5EE088" />
          <rect x="7" y="2" width="2" height="3" fill="#C8FFE0" />
        </g>
      )}
      {relicId === 'guantes_del_boticario' && (
        <g>
          <rect x="3" y="3" width="10" height="10" fill="#6E472B" />
          <rect x="4" y="4" width="8" height="8" fill="#9E6840" />
          <rect x="5" y="6" width="6" height="3" fill="#5EE088" />
        </g>
      )}
      {relicId === 'libro_prohibido' && (
        <g>
          <rect x="2" y="2" width="12" height="12" fill="#541826" />
          <rect x="4" y="3" width="9" height="10" fill="#8F263D" />
          <rect x="6" y="5" width="5" height="6" fill="#E7A54A" />
          <rect x="7" y="6" width="3" height="4" fill="#B57CFF" />
        </g>
      )}
      {relicId === 'corona_de_cristal' && (
        <g>
          <rect x="2" y="9" width="12" height="4" fill="#E7A54A" />
          <rect x="2" y="4" width="2" height="5" fill="#6CD4FF" />
          <rect x="7" y="2" width="2" height="7" fill="#B57CFF" />
          <rect x="12" y="4" width="2" height="5" fill="#6CD4FF" />
          <rect x="4" y="7" width="8" height="3" fill="#FFF3C4" />
        </g>
      )}
      {relicId === 'escudo_del_sepulturero' && (
        <g>
          <rect x="3" y="2" width="10" height="9" fill="#69A8A5" />
          <rect x="4" y="11" width="8" height="2" fill="#69A8A5" />
          <rect x="6" y="13" width="4" height="2" fill="#E7A54A" />
          <rect x="7" y="4" width="2" height="7" fill="#FFF3C4" />
          <rect x="5" y="6" width="6" height="2" fill="#FFF3C4" />
        </g>
      )}
    </svg>
  );
};

/**
 * Custom Pixel-Art Door Progress Counter (Requirement 2):
 * PUERTAS SUPERADAS ■ □ □ 1 / 3
 */
export const LaCriptaDoorCounterBadge: React.FC<{
  completedDoorCount?: number;
  completedDoors?: number;
  compact?: boolean;
}> = ({ completedDoorCount, completedDoors, compact = false }) => {
  const count = completedDoorCount ?? completedDoors ?? 0;
  const clamped = Math.max(0, Math.min(3, count));
  return (
    <div
      className={`inline-flex items-center gap-2 border bg-[#120D18] ${
        compact ? 'px-2 py-0.5 border-[#E7A54A]/45' : 'px-3 py-1.5 border-2 border-[#E7A54A]'
      }`}
      title={`Puertas de mazmorra superadas en esta expedición: ${clamped} de 3`}
    >
      <span
        className={`font-cripta-pixel uppercase tracking-wider text-[#D8C6A0] ${
          compact ? 'text-[9px]' : 'text-[10px] sm:text-xs font-bold'
        }`}
      >
        PUERTAS SUPERADAS
      </span>

      <div className="flex items-center gap-1">
        {[0, 1, 2].map((idx) => {
          const isDone = idx < clamped;
          return (
            <svg
              key={idx}
              width={compact ? 12 : 15}
              height={compact ? 14 : 17}
              viewBox="0 0 12 14"
              shapeRendering="crispEdges"
              className="shrink-0"
            >
              {/* Outer stone arch */}
              <rect
                x="1"
                y="2"
                width="10"
                height="12"
                fill={isDone ? '#E7A54A' : '#282039'}
              />
              <rect
                x="2"
                y="1"
                width="8"
                height="1"
                fill={isDone ? '#FFF3C4' : '#3E3256'}
              />
              {/* Inner doorway */}
              <rect
                x="3"
                y="3"
                width="6"
                height="10"
                fill={isDone ? '#FFB347' : '#09070D'}
              />
              {isDone && <rect x="5" y="5" width="2" height="6" fill="#FFF3C4" />}
            </svg>
          );
        })}
      </div>

      <span
        className={`font-cripta-mono font-bold ${
          clamped >= 3 ? 'text-[#FFD166]' : 'text-[#E7A54A]'
        } ${compact ? 'text-[10px]' : 'text-xs'}`}
      >
        {clamped} / 3
      </span>
    </div>
  );
};

/**
 * Physical Ground Drops Overlay inside Dungeon Rooms (Requirements 10, 11, 23).
 */
export const LaCriptaGroundDropsOverlay: React.FC<{
  drops: CriptaRoomGroundDrop[];
  onClaimDrop: (dropId: string) => void;
}> = ({ drops, onClaimDrop }) => {
  const unclaimed = drops.filter((d) => !d.claimedByPlayerId);
  if (unclaimed.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-2.5 z-30 flex flex-wrap items-center justify-center gap-3">
      {unclaimed.map((drop) => {
        const itemDef = drop.kind === 'ITEM' && drop.itemId ? CRIPTA_ITEMS_REGISTRY[drop.itemId] : null;
        const relicDef = drop.kind === 'RELIC' && drop.relicId ? CRIPTA_RELICS_REGISTRY[drop.relicId] : null;
        const title = itemDef ? itemDef.name : relicDef ? relicDef.name : 'Botín';
        const isRelic = drop.kind === 'RELIC';

        return (
          <button
            key={drop.id}
            type="button"
            onClick={() => {
              laCriptaAudio.playGoldChange(true);
              onClaimDrop(drop.id);
            }}
            className={`pointer-events-auto group px-2.5 py-1.5 border-2 flex items-center gap-2 transition-all cursor-pointer animate-bounce shadow-[0_0_18px_rgba(0,0,0,0.9)] ${
              isRelic
                ? 'bg-[#221233]/95 hover:bg-[#2F1A46] border-[#FFD166]'
                : 'bg-[#171122]/95 hover:bg-[#241B35] border-[#E7A54A]'
            }`}
            title={
              itemDef
                ? `Recoger ${itemDef.name}: ${itemDef.description}`
                : relicDef
                ? `Reclamar Reliquia ${relicDef.name}: ${relicDef.description}`
                : 'Recoger botín'
            }
          >
            {itemDef && <LaCriptaItemPixelIcon itemId={itemDef.id} size={20} />}
            {relicDef && <LaCriptaRelicPixelIcon relicId={relicDef.id} size={20} />}
            <div className="text-left">
              <div className="text-[8px] font-cripta-pixel uppercase tracking-wider text-[#D8C6A0]">
                {isRelic ? '✦ RELIQUIA CAÍDA' : 'BOTÍN EN EL SUELO'}
              </div>
              <div className="font-cripta-pixel text-[10px] font-bold text-[#FFD166]">
                RECOGER: {title.toUpperCase()}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Physical Shop Shelves, Arsenal Rack, Forge Anvil & Rare Relic Pedestal.
 */
export const LaCriptaShopShelvesPanel: React.FC<{
  slots: CriptaShopSlot[];
  partyGold: number;
  disabled: boolean;
  hasDiscountRelic?: boolean;
  localPlayer?: CriptaPlayer | null;
  purchaseHistory?: Array<{
    id: string;
    buyerName: string;
    itemName: string;
    priceGold: number;
    timestamp: number;
  }>;
  onBuySlot: (slotId: string) => void;
}> = ({
  slots,
  partyGold,
  disabled,
  hasDiscountRelic = false,
  localPlayer,
  purchaseHistory = [],
  onBuySlot,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(
    slots[0]?.id || null
  );

  const shelfSlots = slots.filter((s) => s.kind !== 'RELIC');
  const relicSlot = slots.find((s) => s.kind === 'RELIC') || null;
  const activeSlot = slots.find((s) => s.id === selectedSlotId) || slots[0] || null;

  const activeItemDef =
    activeSlot?.kind === 'ITEM' && activeSlot.itemId
      ? CRIPTA_ITEMS_REGISTRY[activeSlot.itemId]
      : null;
  const activeRelicDef =
    activeSlot?.kind === 'RELIC' && activeSlot.relicId
      ? CRIPTA_RELICS_REGISTRY[activeSlot.relicId]
      : null;
  const activeWeaponDef =
    activeSlot?.kind === 'WEAPON' && activeSlot.weaponId
      ? CRIPTA_WEAPONS_REGISTRY[activeSlot.weaponId]
      : null;
  const activeArmorDef =
    activeSlot?.kind === 'ARMOR' && activeSlot.armorId
      ? CRIPTA_ARMORS_REGISTRY[activeSlot.armorId]
      : null;
  const activeAccDef =
    activeSlot?.kind === 'ACCESSORY' && activeSlot.accessoryId
      ? CRIPTA_ACCESSORIES_REGISTRY[activeSlot.accessoryId]
      : null;
  const isForgeSlot = activeSlot?.kind === 'FORGE_UPGRADE';

  const currentEquipped = localPlayer ? getEquippedWeaponForPlayer(localPlayer) : null;

  const resolveSlotTitleAndBadge = (slot: CriptaShopSlot) => {
    if (slot.kind === 'ITEM' && slot.itemId) {
      const def = CRIPTA_ITEMS_REGISTRY[slot.itemId];
      return {
        title: def?.name || 'Consumible',
        tag: 'CONSUMIBLE',
        sub: def?.description || '',
        color: '#E7A54A',
      };
    }
    if (slot.kind === 'WEAPON' && slot.weaponId) {
      const w = CRIPTA_WEAPONS_REGISTRY[slot.weaponId];
      return {
        title: w?.name || 'Arma',
        tag: `ARMA · ${w?.baseMinDamage}–${w?.baseMaxDamage} DAÑO`,
        sub: `${w?.specialEffectText} · Especial: ${w?.specialAttack.name}`,
        color: w?.accentColor || '#FFD166',
      };
    }
    if (slot.kind === 'ARMOR' && slot.armorId) {
      const a = CRIPTA_ARMORS_REGISTRY[slot.armorId];
      return {
        title: a?.name || 'Armadura',
        tag: 'ARMADURA PERSONAL',
        sub: a?.specialEffectText || '',
        color: '#69A8A5',
      };
    }
    if (slot.kind === 'ACCESSORY' && slot.accessoryId) {
      const acc = CRIPTA_ACCESSORIES_REGISTRY[slot.accessoryId];
      return {
        title: acc?.name || 'Accesorio',
        tag: 'ACCESORIO PERSONAL',
        sub: acc?.specialEffectText || '',
        color: '#9B72CF',
      };
    }
    if (slot.kind === 'FORGE_UPGRADE') {
      const nextLvl = Math.min(3, (currentEquipped?.level || 1) + 1);
      return {
        title: `Forjar Arma a Nivel ${nextLvl}`,
        tag: 'YUNQUE DE FORJA',
        sub: currentEquipped
          ? `Mejora tu ${currentEquipped.weapon.name} (+Daño base y +Escalado)`
          : 'Templa tu arma equipada al siguiente nivel.',
        color: '#E76F38',
      };
    }
    if (slot.kind === 'RELIC' && slot.relicId) {
      const r = CRIPTA_RELICS_REGISTRY[slot.relicId];
      return {
        title: r?.name || 'Reliquia',
        tag: r?.ownershipType === 'PARTY' ? 'RELIQUIA DE GRUPO' : 'RELIQUIA PERSONAL',
        sub: r?.description || '',
        color: '#FFD166',
      };
    }
    return { title: 'Objeto', tag: 'TIENDA', sub: '', color: '#D8C6A0' };
  };

  return (
    <div className="p-3 bg-[#110C17] border-2 border-[#E7A54A]/60 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-cripta-pixel text-xs font-bold text-[#E7A54A]">
            MOSTRADOR DEL MERCADER Y FORJA
          </span>
          {hasDiscountRelic && (
            <span className="px-1.5 py-0.5 bg-[#1E152A] border border-[#E7A54A] text-[9px] font-cripta-pixel text-[#FFD166]">
              MONEDA DEL MUERTO (-25% PRECIOS)
            </span>
          )}
        </div>
        <span className="font-cripta-mono text-xs font-bold text-[#E7A54A]">
          ORO DEL GRUPO: {partyGold}
        </span>
      </div>

      {/* Physical Shelf + Arsenal + Illuminated Relic Pedestal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-stretch">
        {/* Left 3 Columns: Shop Shelf with Consumables, Weapon, Gear & Forge */}
        <div className="lg:col-span-3 p-2.5 bg-[#18111D] border-2 border-[#593E25] flex flex-col justify-between">
          <div className="text-[9px] font-cripta-pixel uppercase tracking-wider text-[#D8C6A0]/70 mb-2">
            CONSUMIBLES · ARMAMENTO · EQUIPO · YUNQUE
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {shelfSlots.map((slot) => {
              const info = resolveSlotTitleAndBadge(slot);
              const isSelected = activeSlot?.id === slot.id;
              const canAfford = partyGold >= slot.priceGold && !slot.soldOut;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    setSelectedSlotId(slot.id);
                  }}
                  className={`relative p-2 border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
                    slot.soldOut
                      ? 'bg-[#0B090F] border-[#282039] opacity-40'
                      : isSelected
                      ? 'bg-[#261B30] border-[#FFD166] -translate-y-0.5 shadow-[0_0_12px_rgba(231,165,74,0.3)]'
                      : 'bg-[#120D18] hover:bg-[#1E1628] border-[#3E2D4A]'
                  }`}
                >
                  <span
                    className="px-1 py-0.2 bg-[#09070D] border text-[7px] font-cripta-pixel uppercase tracking-wider mb-1"
                    style={{ borderColor: `${info.color}66`, color: info.color }}
                  >
                    {slot.kind === 'WEAPON'
                      ? '⚔ ARMA'
                      : slot.kind === 'ARMOR'
                      ? '🛡 CORAZA'
                      : slot.kind === 'ACCESSORY'
                      ? '✦ JOYA'
                      : slot.kind === 'FORGE_UPGRADE'
                      ? '🔥 FORJA'
                      : 'POCIÓN'}
                  </span>

                  {slot.kind === 'ITEM' && slot.itemId ? (
                    <LaCriptaItemPixelIcon itemId={slot.itemId} size={28} />
                  ) : (
                    <div
                      className="w-7 h-7 flex items-center justify-center border font-cripta-pixel text-xs font-bold"
                      style={{
                        borderColor: info.color,
                        backgroundColor: '#0B090F',
                        color: info.color,
                      }}
                    >
                      {slot.kind === 'WEAPON'
                        ? '⚔'
                        : slot.kind === 'ARMOR'
                        ? '🛡'
                        : slot.kind === 'ACCESSORY'
                        ? '◈'
                        : '⚒'}
                    </div>
                  )}

                  <div className="w-full h-1 bg-[#6E472B] border-t border-[#9E6840] my-1.5" />
                  <div className="font-cripta-pixel text-[10px] font-bold text-[#D9D0BC] truncate w-full">
                    {info.title}
                  </div>
                  <div
                    className={`mt-0.5 font-cripta-mono text-[10px] font-bold truncate w-full ${
                      slot.soldOut
                        ? 'text-[#D8C6A0]/50'
                        : canAfford
                        ? 'text-[#E7A54A]'
                        : 'text-[#C93B5B]'
                    }`}
                  >
                    {slot.soldOut
                      ? slot.buyerName
                        ? `✓ ${slot.buyerName}`
                        : 'ADQUIRIDO'
                      : `${slot.priceGold} ORO`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Illuminated Relic Pedestal */}
        {relicSlot && relicSlot.relicId && (
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              setSelectedSlotId(relicSlot.id);
            }}
            className={`relative p-2.5 border-2 flex flex-col items-center justify-between text-center transition-all cursor-pointer ${
              relicSlot.soldOut
                ? 'bg-[#0B090F] border-[#282039] opacity-40'
                : activeSlot?.id === relicSlot.id
                ? 'bg-[#241634] border-[#FFD166] shadow-[0_0_20px_rgba(181,124,255,0.45)]'
                : 'bg-[#1A1026] hover:bg-[#231533] border-[#9B72CF]'
            }`}
          >
            <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#E7A54A] text-[8px] font-cripta-pixel font-bold text-[#E7A54A] tracking-widest">
              ✦ RELIQUIA RARA
            </span>
            <div className="my-1.5 p-2 rounded-full bg-[#2E1C44]/70 border border-[#B57CFF]/50">
              <LaCriptaRelicPixelIcon relicId={relicSlot.relicId} size={32} />
            </div>
            <div className="w-16 h-2 bg-[#4A3E5E] border border-[#9B72CF]" />
            <div className="mt-1 font-cripta-pixel text-[10px] font-bold text-[#FFD166] truncate w-full">
              {CRIPTA_RELICS_REGISTRY[relicSlot.relicId]?.name}
            </div>
            <div
              className={`font-cripta-mono text-[10px] font-bold ${
                relicSlot.soldOut
                  ? 'text-[#D8C6A0]/50'
                  : partyGold >= relicSlot.priceGold
                  ? 'text-[#FFD166]'
                  : 'text-[#C93B5B]'
              }`}
            >
              {relicSlot.soldOut
                ? relicSlot.buyerName
                  ? `✓ ${relicSlot.buyerName}`
                  : 'ADQUIRIDA'
                : `${relicSlot.priceGold} ORO`}
            </div>
          </button>
        )}
      </div>

      {/* Multiplayer Real-Time Shop Purchase Feed (Section 11) */}
      {purchaseHistory.length > 0 && (
        <div className="px-2.5 py-1.5 bg-[#0D0914] border border-[#282039] flex flex-wrap items-center gap-2 text-[9px] font-cripta-pixel">
          <span className="text-[#E7A54A] font-bold uppercase">
            🛒 COMPRAS DEL GRUPO:
          </span>
          {purchaseHistory.slice(-3).map((entry) => (
            <span
              key={entry.id}
              className="px-1.5 py-0.5 bg-[#19111D] border border-[#5EA87A]/40 text-[#D9D0BC]"
            >
              <strong className="text-[#5EA87A]">{entry.buyerName}</strong> adquirió{' '}
              <span className="text-[#FFD166]">{entry.itemName}</span> ({entry.priceGold}{' '}
              ORO)
            </span>
          ))}
        </div>
      )}

      {/* Selected Slot Detail, Side-by-Side Weapon Comparison & Purchase Bar */}
      {activeSlot && (
        <div className="p-2.5 bg-[#09070D] border border-[#E7A54A]/50 flex flex-col gap-2">
          {(() => {
            const info = resolveSlotTitleAndBadge(activeSlot);
            return (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  {activeItemDef && <LaCriptaItemPixelIcon itemId={activeItemDef.id} size={28} />}
                  {activeRelicDef && (
                    <LaCriptaRelicPixelIcon relicId={activeRelicDef.id} size={28} />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="font-cripta-pixel text-xs font-bold uppercase"
                        style={{ color: info.color }}
                      >
                        {info.title}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#19111D] border border-[#7656A8] text-[9px] font-cripta-pixel text-[#D8C6A0]">
                        {info.tag}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[#121D18] border border-[#5EA87A]/50 text-[8px] font-cripta-pixel text-[#8EE6AE]">
                        {activeRelicDef?.ownershipType === 'PARTY'
                          ? 'GRUPO COMPARTIDO'
                          : `PERSONAL · ${localPlayer?.name || 'AVENTURERO'}`}
                      </span>
                    </div>
                    <div className="text-[11px] font-cripta-pixel text-[#5EA87A] mt-0.5">
                      {info.sub}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">PRECIO</div>
                    <div className="font-cripta-mono text-xs font-bold text-[#E7A54A]">
                      {activeSlot.priceGold} ORO
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={
                      disabled ||
                      activeSlot.soldOut ||
                      partyGold < activeSlot.priceGold ||
                      (isForgeSlot && (currentEquipped?.level || 1) >= 3)
                    }
                    onClick={() => {
                      laCriptaAudio.playGoldChange(false);
                      onBuySlot(activeSlot.id);
                    }}
                    className={`px-3.5 py-1.5 border-2 font-cripta-pixel text-xs font-bold ${
                      activeSlot.soldOut
                        ? 'bg-[#140F1A] border-[#282039] text-[#D8C6A0]/40 cursor-default'
                        : disabled || partyGold < activeSlot.priceGold
                        ? 'bg-[#140F1A] border-[#8F263D]/50 text-[#C93B5B]/70 cursor-not-allowed'
                        : 'bg-[#E7A54A] hover:bg-[#f3b965] border-[#FFF3C4] text-[#0B0A0E] cursor-pointer'
                    }`}
                  >
                    {activeSlot.soldOut
                      ? 'COMPRADO'
                      : activeWeaponDef || activeArmorDef || activeAccDef
                      ? 'COMPRAR Y EQUIPAR'
                      : isForgeSlot
                      ? 'MEJORAR ARMA'
                      : 'COMPRAR'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Side-by-side Weapon Comparison (Section 14) */}
          {activeWeaponDef && currentEquipped && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#282039]">
              <div className="p-2 bg-[#120D18] border border-[#282039] flex items-center justify-between text-[10px] font-cripta-pixel">
                <div>
                  <span className="text-[#D8C6A0]/60 block text-[8px]">ARMA ACTUAL EQUIPADA</span>
                  <span className="text-[#D9D0BC] font-bold">
                    {currentEquipped.weapon.name} (NV.{currentEquipped.level})
                  </span>
                </div>
                <div className="text-right font-cripta-mono text-[#D8C6A0]">
                  <div>
                    {currentEquipped.scaledMin}–{currentEquipped.scaledMax} DAÑO
                  </div>
                  <div className="text-[8px] text-[#69A8A5]">
                    ESPECIAL: {currentEquipped.weapon.specialAttack.name}
                  </div>
                </div>
              </div>
              <div className="p-2 bg-[#1A1324] border border-[#FFD166]/60 flex items-center justify-between text-[10px] font-cripta-pixel">
                <div>
                  <span className="text-[#FFD166] block text-[8px]">NUEVA ARMA EN VENTA</span>
                  <span className="text-[#FFD166] font-bold">{activeWeaponDef.name}</span>
                </div>
                <div className="text-right font-cripta-mono text-[#8EE6AE]">
                  <div>
                    {activeWeaponDef.baseMinDamage}–{activeWeaponDef.baseMaxDamage} DAÑO (
                    {activeWeaponDef.scalingStat})
                  </div>
                  <div className="text-[8px] text-[#FFD166]">
                    ESPECIAL: {activeWeaponDef.specialAttack.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Inventory Full Prompt (Requirement 24):
 * Never silently deletes an item when all 6 slots are full; lets player replace a slot or leave the new item.
 */
export const LaCriptaInventoryFullModal: React.FC<{
  pending?: CriptaPendingInventoryReplacement;
  currentInventory?: CriptaItemId[];
  onResolve?: (replaceSlotIndex: number | null) => void;
  pendingItem?: CriptaItemId;
  currentSlots?: Array<{ itemId: CriptaItemId; acquiredInDungeonName?: string } | CriptaItemId>;
  onReplaceSlot?: (slotIdx: number) => void;
  onDiscardNew?: () => void;
}> = ({
  pending,
  currentInventory,
  onResolve,
  pendingItem,
  currentSlots,
  onReplaceSlot,
  onDiscardNew,
}) => {
  const resolvedNewItemId = pending?.newItemId || pendingItem;
  const newItemDef = resolvedNewItemId ? CRIPTA_ITEMS_REGISTRY[resolvedNewItemId] : null;
  if (!newItemDef) return null;

  const resolvedInventory: CriptaItemId[] =
    currentInventory && currentInventory.length > 0
      ? currentInventory
      : (currentSlots || []).map((s) => (typeof s === 'string' ? s : s.itemId));

  const handleDiscard = () => {
    if (onResolve) onResolve(null);
    if (onDiscardNew) onDiscardNew();
  };

  const handleReplace = (idx: number) => {
    if (onResolve) onResolve(idx);
    if (onReplaceSlot) onReplaceSlot(idx);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-3 bg-[#1A0D18] border-2 border-[#E7A54A] shadow-[0_0_30px_rgba(0,0,0,0.95)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-cripta-pixel text-xs font-bold text-[#FFD166]">
            ⚠ INVENTARIO LLENO ({resolvedInventory.length} / {resolvedInventory.length})
          </span>
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              handleDiscard();
            }}
            className="px-2.5 py-1 bg-[#09070D] hover:bg-[#282039] border border-[#C93B5B] text-[10px] font-cripta-pixel text-[#D9D0BC] cursor-pointer"
          >
            DEJAR {newItemDef.name.toUpperCase()}
          </button>
        </div>

        <div className="flex items-center gap-2 p-2 bg-[#09070D] border border-[#7656A8]">
          <LaCriptaItemPixelIcon itemId={newItemDef.id} size={24} />
          <div>
            <div className="font-cripta-pixel text-xs font-bold text-[#E7A54A]">
              NUEVO OBJETO: {newItemDef.name.toUpperCase()}
            </div>
            <div className="text-[10px] font-cripta-pixel text-[#5EA87A]">
              {newItemDef.description}
            </div>
          </div>
        </div>

        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]">
          Elige qué objeto de tu inventario reemplazar por {newItemDef.name}:
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {resolvedInventory.map((itemId, idx) => {
            const def = CRIPTA_ITEMS_REGISTRY[itemId];
            if (!def) return null;
            return (
              <button
                key={`${itemId}_${idx}`}
                type="button"
                onClick={() => {
                  laCriptaAudio.playDoorVote();
                  handleReplace(idx);
                }}
                className="p-2 bg-[#120D18] hover:bg-[#261B30] border border-[#E7A54A]/60 hover:border-[#FFD166] flex items-center gap-2 text-left cursor-pointer"
              >
                <LaCriptaItemPixelIcon itemId={itemId} size={20} />
                <div className="min-w-0">
                  <div className="font-cripta-pixel text-[10px] font-bold text-[#D9D0BC] truncate">
                    {def.name}
                  </div>
                  <div className="text-[9px] font-cripta-pixel text-[#E7A54A]">
                    REEMPLAZAR #{idx + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Relic Acquisition Reveal Banner (Requirement 23).
 */
export const LaCriptaRelicRevealBanner: React.FC<{
  relicId: CriptaRelicId;
  ownerName?: string;
  isPartyRelic?: boolean;
}> = ({ relicId, ownerName, isPartyRelic }) => {
  const def = CRIPTA_RELICS_REGISTRY[relicId];
  if (!def) return null;

  return (
    <div className="pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#140B20]/95 border-2 border-[#FFD166] shadow-[0_0_32px_rgba(231,165,74,0.55)] flex items-center gap-3 animate-cripta-crit-pop">
      <div className="p-2 bg-[#28163D] border-2 border-[#B57CFF]">
        <LaCriptaRelicPixelIcon relicId={relicId} size={36} />
      </div>
      <div>
        <div className="text-[9px] font-cripta-pixel font-bold tracking-widest text-[#B57CFF] uppercase">
          ✦ RELIQUIA ANCESTRAL DESCUBIERTA ✦
        </div>
        <div className="font-cripta-display text-base sm:text-lg font-black text-[#FFD166] uppercase">
          {def.name}
        </div>
        <div className="text-[10px] font-cripta-pixel text-[#5EA87A]">
          {def.description}
        </div>
        <div className="text-[9px] font-cripta-pixel text-[#D8C6A0] mt-0.5 uppercase">
          {isPartyRelic || def.ownershipType === 'PARTY'
            ? 'RELIQUIA DEL GRUPO · AFECTA A TODOS LOS AVENTUREROS'
            : `OBTENIDA POR: ${ownerName || 'AVENTURERO'}`}
        </div>
      </div>
    </div>
  );
};

/**
 * Shared Party Relics Bar for the Persistent Bottom HUD.
 */
export const LaCriptaPartyRelicsBar: React.FC<{
  relics: CriptaAcquiredRelic[];
  onInspectRelic?: (relic: CriptaAcquiredRelic) => void;
}> = ({ relics, onInspectRelic }) => {
  if (!relics || relics.length === 0) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 bg-[#140D1E] border border-[#9B72CF]/70">
      <span className="text-[9px] font-cripta-pixel font-bold tracking-widest text-[#B57CFF] uppercase">
        ✦ RELIQUIAS ({relics.length}):
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {relics.map((acq, idx) => {
          const rDef = CRIPTA_RELICS_REGISTRY[acq.relicId];
          if (!rDef) return null;
          return (
            <button
              key={`${acq.relicId}_${idx}`}
              type="button"
              onClick={() => {
                laCriptaAudio.playStoneClick();
                onInspectRelic?.(acq);
              }}
              title={`${rDef.name}: ${rDef.description}`}
              className="group inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1F142E] hover:bg-[#2C1B40] border border-[#FFD166]/70 hover:border-[#FFD166] transition-colors cursor-pointer"
            >
              <LaCriptaRelicPixelIcon relicId={acq.relicId} size={16} />
              <span className="text-[9px] font-cripta-pixel font-bold text-[#FFD166]">
                {rDef.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Modal for inspecting an acquired Relic's lore, passive effect, and provenance.
 */
export const LaCriptaRelicDetailModal: React.FC<{
  relic: CriptaAcquiredRelic;
  players?: CriptaPlayer[];
  onClose: () => void;
}> = ({ relic, players = [], onClose }) => {
  const rDef = CRIPTA_RELICS_REGISTRY[relic.relicId];
  if (!rDef) return null;

  const ownerPlayer = relic.ownerPlayerId
    ? players.find((p) => p.id === relic.ownerPlayerId)
    : null;
  const isParty = !relic.ownerPlayerId || rDef.ownershipType === 'PARTY';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-4 bg-[#160F24] border-2 border-[#FFD166] shadow-[0_0_36px_rgba(231,165,74,0.45)] flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#282039] pb-2.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#26183A] border-2 border-[#B57CFF]">
              <LaCriptaRelicPixelIcon relicId={relic.relicId} size={32} />
            </div>
            <div>
              <div className="text-[9px] font-cripta-pixel font-bold tracking-widest text-[#B57CFF] uppercase">
                {isParty
                  ? 'RELIQUIA COMPARTIDA DEL GRUPO'
                  : `RELIQUIA DE ${(ownerPlayer?.name || relic.ownerPlayerName || 'AVENTURERO').toUpperCase()}`}
              </div>
              <h3 className="font-cripta-display text-lg font-black text-[#FFD166] uppercase">
                {rDef.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onClose();
            }}
            className="px-2 py-0.5 bg-[#09070D] hover:bg-[#282039] border border-[#D8C6A0]/40 text-[10px] font-cripta-pixel text-[#D9D0BC] cursor-pointer"
          >
            CERRAR
          </button>
        </div>

        <div className="p-2.5 bg-[#0B0812] border border-[#5EA87A]/50 text-xs font-cripta-pixel text-[#5EA87A]">
          ✦ {rDef.description}
        </div>

        {rDef.lore && (
          <p className="text-[11px] font-cripta-pixel text-[#D9D0BC]/80 italic">
            “{rDef.lore}”
          </p>
        )}

        <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 flex items-center justify-between pt-1 border-t border-[#282039]">
          <span>
            HALLADA EN:{' '}
            <strong className="text-[#E7A54A]">
              {relic.obtainedInDungeonName || relic.acquiredInDungeonName || 'LA CRIPTA'}
            </strong>
          </span>
          <span className="uppercase text-[#FFD166]">{rDef.rarity}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Personal Inventory Bar — supports both the compact 3-slot HUD strip and the full 6-slot drawer.
 */
export const LaCriptaPlayerInventoryBar: React.FC<{
  slots?: Array<{ itemId: CriptaItemId; acquiredInDungeonName?: string } | CriptaItemId>;
  isLocalPlayer?: boolean;
  canUseNow?: boolean;
  onUseSlot?: (slotIdx: number) => void;
  me?: CriptaPlayer;
  allPlayers?: CriptaPlayer[];
  partyRelics?: CriptaAcquiredRelic[];
  inCombat?: boolean;
  disabled?: boolean;
  activeTargetEnemyId?: string;
  onUseItem?: (slotIndex: number, targetPlayerId?: string, targetEnemyId?: string) => void;
}> = ({
  slots,
  isLocalPlayer = false,
  canUseNow = false,
  onUseSlot,
  me,
  allPlayers = [],
  partyRelics = [],
  inCombat = false,
  disabled = false,
  activeTargetEnemyId,
  onUseItem,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [targetAllyId, setTargetAllyId] = useState<string>(me?.id || '');
  const [showRelicDrawer, setShowRelicDrawer] = useState(false);

  // Compact HUD 3-slot mode when `slots` is provided directly from LaCriptaPartyHud
  if (slots !== undefined && !me) {
    return (
      <div className="inline-flex items-center gap-1" title="Inventario personal (3 ranuras)">
        {[0, 1, 2].map((idx) => {
          const entry = slots[idx];
          const itemId = entry ? (typeof entry === 'string' ? entry : entry.itemId) : null;
          const def = itemId ? CRIPTA_ITEMS_REGISTRY[itemId] : null;
          const interactive = Boolean(def && isLocalPlayer && canUseNow && onUseSlot);

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (!interactive || !onUseSlot) return;
                onUseSlot(idx);
              }}
              title={
                def
                  ? `${def.name}: ${def.description}${
                      isLocalPlayer
                        ? canUseNow
                          ? ' · Clic para usar'
                          : ' · Espera tu turno para usar'
                        : ''
                    }`
                  : `Ranura de inventario vacía #${idx + 1}`
              }
              className={`w-6 h-6 border flex items-center justify-center transition-all ${
                !def
                  ? 'bg-[#09070D] border-[#282039] opacity-55 cursor-default'
                  : interactive
                  ? 'bg-[#1D1429] hover:bg-[#2C1E3E] border-[#E7A54A] hover:border-[#FFD166] cursor-pointer shadow-[0_0_8px_rgba(231,165,74,0.3)]'
                  : 'bg-[#140F1C] border-[#7656A8]/70 opacity-80 cursor-default'
              }`}
            >
              {def ? (
                <LaCriptaItemPixelIcon itemId={def.id} size={14} />
              ) : (
                <span className="text-[7px] font-cripta-mono text-[#3E3256]">·</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (!me) return null;

  const inventory = me.normalInventory || [];
  const personalRelics = me.personalRelics || [];
  const combinedRelics: CriptaAcquiredRelic[] = [...partyRelics, ...personalRelics];

  const selectedItemId =
    selectedSlot !== null && inventory[selectedSlot] ? inventory[selectedSlot] : null;
  const selectedItemDef = selectedItemId ? CRIPTA_ITEMS_REGISTRY[selectedItemId] : null;

  const livingAllies = allPlayers.filter((p) => p.isConnected && !p.isDead && p.hp > 0);

  return (
    <div className="px-3 py-2 bg-[#0E0A14] border border-[#282039] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: 6 Normal Consumable Slots */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-cripta-pixel font-bold text-[#D8C6A0] uppercase">
            INVENTARIO ({inventory.length}/6):
          </span>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, idx) => {
              const itemId = inventory[idx] || null;
              const def = itemId ? CRIPTA_ITEMS_REGISTRY[itemId] : null;
              const isSelected = selectedSlot === idx && Boolean(def);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!def || disabled}
                  onClick={() => {
                    if (!def) return;
                    laCriptaAudio.playStoneClick();
                    setSelectedSlot((prev) => (prev === idx ? null : idx));
                  }}
                  title={
                    def
                      ? `${def.name}: ${def.description}`
                      : `Ranura de inventario vacía #${idx + 1}`
                  }
                  className={`w-8 h-8 sm:w-9 sm:h-9 border-2 flex items-center justify-center transition-all ${
                    !def
                      ? 'bg-[#08060C] border-[#1E182B] text-[#282039] cursor-default'
                      : isSelected
                      ? 'bg-[#281B36] border-[#FFD166] -translate-y-0.5 cursor-pointer'
                      : 'bg-[#15101E] hover:bg-[#221930] border-[#7656A8] cursor-pointer'
                  }`}
                >
                  {def ? (
                    <LaCriptaItemPixelIcon itemId={def.id} size={20} />
                  ) : (
                    <span className="text-[8px] font-cripta-mono text-[#282039]">·</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Relics Strip (Separate from 6 Normal Slots) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-cripta-pixel font-bold text-[#B57CFF] uppercase">
            RELIQUIAS ({combinedRelics.length}):
          </span>

          {combinedRelics.length === 0 ? (
            <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]/45">
              NINGUNA
            </span>
          ) : (
            <div className="flex items-center gap-1">
              {combinedRelics.slice(0, 5).map((acq, idx) => {
                const rDef = CRIPTA_RELICS_REGISTRY[acq.relicId];
                if (!rDef) return null;
                const isParty = acq.ownerPlayerId === null || rDef.ownershipType === 'PARTY';
                return (
                  <button
                    key={`${acq.relicId}_${idx}`}
                    type="button"
                    onClick={() => setShowRelicDrawer((prev) => !prev)}
                    title={`${rDef.name} (${
                      isParty ? 'RELIQUIA DEL GRUPO' : `RELIQUIA DE ${acq.ownerPlayerName}`
                    })\n────────────────\n${rDef.description}\nOBTENIDO EN: ${
                      acq.obtainedInDungeonName
                    }`}
                    className={`w-7 h-7 border flex items-center justify-center cursor-pointer ${
                      isParty
                        ? 'bg-[#1F142E] border-[#FFD166]'
                        : 'bg-[#161022] border-[#9B72CF]'
                    }`}
                  >
                    <LaCriptaRelicPixelIcon relicId={acq.relicId} size={18} />
                  </button>
                );
              })}
              {combinedRelics.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowRelicDrawer((prev) => !prev)}
                  className="px-1.5 py-0.5 bg-[#1F142E] border border-[#B57CFF] text-[9px] font-cripta-pixel text-[#FFD166] cursor-pointer"
                >
                  +{combinedRelics.length - 5}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Consumable Action Sub-Bar */}
      {selectedItemDef && selectedSlot !== null && (
        <div className="p-2 bg-[#161021] border border-[#E7A54A] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LaCriptaItemPixelIcon itemId={selectedItemDef.id} size={22} />
            <div>
              <span className="font-cripta-pixel text-xs font-bold text-[#FFD166]">
                {selectedItemDef.name}
              </span>
              <span className="ml-2 text-[10px] font-cripta-pixel text-[#5EA87A]">
                {selectedItemDef.description}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Ally Target Picker if item targets SELF_OR_ALLY and there are multiple players */}
            {selectedItemDef.targetType === 'SELF_OR_ALLY' && livingAllies.length > 1 && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]">USAR EN:</span>
                {livingAllies.map((ally) => (
                  <button
                    key={ally.id}
                    type="button"
                    onClick={() => setTargetAllyId(ally.id)}
                    className={`px-1.5 py-0.5 border text-[9px] font-cripta-pixel cursor-pointer ${
                      targetAllyId === ally.id
                        ? 'bg-[#281E12] border-[#FFD166] text-[#FFD166] font-bold'
                        : 'bg-[#09070D] border-[#282039] text-[#D9D0BC]'
                    }`}
                  >
                    {ally.name}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={
                disabled ||
                (inCombat && !selectedItemDef.combatUsable) ||
                (!inCombat && !selectedItemDef.roomUsable)
              }
              onClick={() => {
                laCriptaAudio.playHealChime();
                onUseItem?.(
                  selectedSlot,
                  selectedItemDef.targetType === 'SELF_OR_ALLY' ? targetAllyId : me.id,
                  activeTargetEnemyId
                );
                setSelectedSlot(null);
              }}
              className="px-3 py-1 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] font-cripta-pixel text-[10px] font-bold cursor-pointer"
            >
              USAR {selectedItemDef.name.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {/* Compact Relic Inspection Drawer */}
      {showRelicDrawer && combinedRelics.length > 0 && (
        <div className="p-2 bg-[#120C1C] border border-[#9B72CF] grid grid-cols-1 sm:grid-cols-2 gap-2">
          {combinedRelics.map((acq, idx) => {
            const rDef = CRIPTA_RELICS_REGISTRY[acq.relicId];
            if (!rDef) return null;
            const isParty = acq.ownerPlayerId === null || rDef.ownershipType === 'PARTY';
            return (
              <div
                key={`${acq.relicId}_drawer_${idx}`}
                className="p-1.5 bg-[#09070D] border border-[#282039] flex items-center gap-2"
              >
                <LaCriptaRelicPixelIcon relicId={acq.relicId} size={22} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-cripta-pixel text-[10px] font-bold text-[#FFD166] truncate">
                      {rDef.name}
                    </span>
                    <span className="text-[8px] font-cripta-pixel text-[#B57CFF]">
                      {isParty ? '[GRUPO]' : `[${acq.ownerPlayerName}]`}
                    </span>
                  </div>
                  <div className="text-[9px] font-cripta-pixel text-[#5EA87A]">
                    {rDef.description}
                  </div>
                  <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/60">
                    OBTENIDO EN: {acq.obtainedInDungeonName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
