import React, { useState } from 'react';
import {
  CriptaAccessoryId,
  CriptaAcquiredRelic,
  CriptaArmorId,
  CriptaDamageType,
  CriptaItemId,
  CriptaPendingInventoryReplacement,
  CriptaPlayer,
  CriptaRelicId,
  CriptaRoomGroundDrop,
  CriptaShopSlot,
  CriptaWeaponId,
  CriptaWeaponRuneId,
} from '../../types/laCripta';
import {
  CRIPTA_ITEMS_REGISTRY,
  CRIPTA_RELICS_REGISTRY,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_DAMAGE_TYPE_META,
  CRIPTA_WEAPON_RUNES_REGISTRY,
  CRIPTA_WEAPONS_REGISTRY,
  getEquippedWeaponForPlayer,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { laCriptaAudio } from '../../utils/laCriptaAudio';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';

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
          {/* Dark Pixel Outline */}
          <rect x="2" y="3" width="12" height="10" fill="#18121E" />
          {/* Multi-tone Linen Bandage Roll with Folds & Crimson Cross */}
          <rect x="3" y="4" width="10" height="8" fill="#B8AC96" />
          <rect x="4" y="4" width="8" height="7" fill="#D9D0BC" />
          <rect x="4" y="4" width="7" height="2" fill="#F2ECE1" />
          <rect x="4" y="9" width="8" height="1" fill="#8C7F6A" />
          {/* Crimson Healer Cross */}
          <rect x="7" y="5" width="2" height="6" fill="#9E2340" />
          <rect x="5" y="7" width="6" height="2" fill="#9E2340" />
          <rect x="7" y="6" width="2" height="4" fill="#E02F56" />
          <rect x="6" y="7" width="4" height="2" fill="#E02F56" />
          <rect x="7" y="7" width="1" height="1" fill="#FF9BB0" />
          {/* Loose Linen Tail */}
          <rect x="13" y="9" width="2" height="3" fill="#18121E" />
          <rect x="13" y="10" width="2" height="1" fill="#D9D0BC" />
        </g>
      )}
      {(itemId === 'pocion_curacion' || itemId === 'pocion_mayor') && (
        <g>
          {/* Dark Outline */}
          <rect x="5" y="1" width="6" height="4" fill="#140E1C" />
          <rect x="2" y="5" width="12" height="10" fill="#140E1C" />
          {/* Cork & Glass Lip */}
          <rect x="6" y="1" width="4" height="2" fill="#9E6B30" />
          <rect x="6" y="1" width="2" height="1" fill="#D9A05B" />
          <rect x="5" y="3" width="6" height="1" fill="#C4E8F5" />
          <rect x="6" y="4" width="4" height="2" fill="#7D9FB8" />
          {/* Multi-Tone Crimson Alchemical Flask */}
          <rect
            x="3"
            y="6"
            width="10"
            height="8"
            fill={itemId === 'pocion_mayor' ? '#7A1129' : '#631022'}
          />
          <rect
            x="4"
            y="6"
            width="8"
            height="7"
            fill={itemId === 'pocion_mayor' ? '#C9244B' : '#A82040'}
          />
          <rect
            x="4"
            y="8"
            width="7"
            height="4"
            fill={itemId === 'pocion_mayor' ? '#FF3B6B' : '#E02F56'}
          />
          {/* Specular Glass Reflection & Meniscus */}
          <rect x="4" y="7" width="7" height="1" fill="#FF85A1" />
          <rect x="4" y="7" width="2" height="4" fill="#FFD6E0" />
          {itemId === 'pocion_mayor' && (
            <g>
              <rect x="3" y="9" width="10" height="2" fill="#B87D28" />
              <rect x="4" y="9" width="8" height="1" fill="#FFD166" />
              <rect x="7" y="8" width="2" height="4" fill="#FFF3C4" />
            </g>
          )}
        </g>
      )}
      {itemId === 'antidoto' && (
        <g>
          <rect x="5" y="1" width="6" height="5" fill="#140E1C" />
          <rect x="3" y="5" width="10" height="10" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#9E6B30" />
          <rect x="5" y="3" width="6" height="1" fill="#C4E8F5" />
          <rect x="6" y="4" width="4" height="2" fill="#7D9FB8" />
          <rect x="4" y="6" width="8" height="8" fill="#1E5E3A" />
          <rect x="4" y="7" width="7" height="6" fill="#3B9B64" />
          <rect x="5" y="8" width="5" height="4" fill="#5EE088" />
          <rect x="5" y="7" width="2" height="3" fill="#D4FFE4" />
        </g>
      )}
      {itemId === 'tonico_claridad' && (
        <g>
          <rect x="5" y="1" width="6" height="4" fill="#140E1C" />
          <rect x="3" y="4" width="10" height="11" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#A9C6D9" />
          <rect x="4" y="5" width="8" height="9" fill="#245B73" />
          <rect x="5" y="6" width="6" height="7" fill="#46A8CC" />
          <rect x="5" y="7" width="5" height="5" fill="#7CE0FF" />
          <rect x="5" y="6" width="2" height="4" fill="#FFFFFF" />
        </g>
      )}
      {itemId === 'unguento_igneo' && (
        <g>
          <rect x="3" y="1" width="10" height="3" fill="#140E1C" />
          <rect x="2" y="4" width="12" height="10" fill="#140E1C" />
          <rect x="4" y="2" width="8" height="2" fill="#8C5A32" />
          <rect x="5" y="2" width="6" height="1" fill="#C48852" />
          <rect x="3" y="4" width="10" height="9" fill="#9E421B" />
          <rect x="4" y="5" width="8" height="7" fill="#E06D2B" />
          <rect x="5" y="6" width="6" height="5" fill="#FFB347" />
          <rect x="6" y="6" width="3" height="3" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'sal_purificadora' && (
        <g>
          <rect x="5" y="1" width="6" height="3" fill="#140E1C" />
          <rect x="3" y="4" width="10" height="10" fill="#140E1C" />
          <rect x="6" y="2" width="4" height="2" fill="#E7A54A" />
          <rect x="4" y="4" width="8" height="9" fill="#5E3D82" />
          <rect x="5" y="5" width="6" height="7" fill="#9B72CF" />
          <rect x="7" y="6" width="2" height="5" fill="#FFFFFF" />
          <rect x="5" y="8" width="6" height="2" fill="#FFFFFF" />
        </g>
      )}
      {itemId === 'elixir_fuerza' && (
        <g>
          <rect x="5" y="1" width="6" height="4" fill="#140E1C" />
          <rect x="2" y="5" width="12" height="10" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#593E25" />
          <rect x="3" y="6" width="10" height="8" fill="#7D1D18" />
          <rect x="4" y="6" width="8" height="7" fill="#C93829" />
          <rect x="5" y="7" width="6" height="5" fill="#FF6B3D" />
          <rect x="5" y="7" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'elixir_hierro' && (
        <g>
          <rect x="5" y="1" width="6" height="3" fill="#140E1C" />
          <rect x="3" y="3" width="10" height="12" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#D8C6A0" />
          <rect x="4" y="3" width="8" height="11" fill="#324654" />
          <rect x="5" y="4" width="6" height="9" fill="#688DA3" />
          <rect x="5" y="5" width="5" height="7" fill="#9BC4DB" />
          <rect x="5" y="5" width="2" height="4" fill="#EBF8FF" />
        </g>
      )}
      {itemId === 'elixir_arcano' && (
        <g>
          <rect x="5" y="1" width="6" height="4" fill="#140E1C" />
          <rect x="2" y="5" width="12" height="10" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#FFD166" />
          <rect x="5" y="3" width="6" height="2" fill="#7656A8" />
          <rect x="3" y="5" width="10" height="9" fill="#3D1E6D" />
          <rect x="4" y="6" width="8" height="7" fill="#7B46CC" />
          <rect x="5" y="7" width="6" height="5" fill="#C77DFF" />
          <rect x="5" y="7" width="2" height="3" fill="#FFF3C4" />
        </g>
      )}
      {itemId === 'bomba_humo' && (
        <g>
          <rect x="9" y="1" width="3" height="2" fill="#FF6B3D" />
          <rect x="10" y="1" width="1" height="1" fill="#FFF3C4" />
          <rect x="7" y="2" width="2" height="2" fill="#D8C6A0" />
          <rect x="2" y="4" width="12" height="11" fill="#120E1A" />
          <rect x="3" y="4" width="10" height="10" fill="#2A2633" />
          <rect x="4" y="5" width="8" height="8" fill="#474157" />
          <rect x="5" y="6" width="5" height="5" fill="#68607D" />
          <rect x="5" y="6" width="2" height="2" fill="#B8B0CC" />
        </g>
      )}
      {itemId === 'frasco_volatil' && (
        <g>
          <rect x="5" y="1" width="6" height="4" fill="#140E1C" />
          <rect x="2" y="5" width="12" height="10" fill="#140E1C" />
          <rect x="6" y="1" width="4" height="2" fill="#E7A54A" />
          <rect x="5" y="3" width="6" height="2" fill="#A9C6D9" />
          <rect x="3" y="5" width="10" height="9" fill="#1B5E2E" />
          <rect x="4" y="6" width="8" height="7" fill="#38B04A" />
          <rect x="5" y="7" width="6" height="5" fill="#80FF40" />
          <rect x="5" y="7" width="2" height="3" fill="#FFF3C4" />
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
      viewBox="0 0 20 20"
      shapeRendering="crispEdges"
      className="shrink-0 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="2" y="2" width="16" height="16" fill="#FFD166" opacity="0.08" />

      {relicId === 'corazon_de_hierro' && (
        <g>
          <rect x="4" y="4" width="4" height="3" fill="#4A5568" />
          <rect x="12" y="4" width="4" height="3" fill="#4A5568" />
          <rect x="3" y="6" width="14" height="5" fill="#718096" />
          <rect x="5" y="11" width="10" height="3" fill="#4A5568" />
          <rect x="7" y="14" width="6" height="2" fill="#2D3748" />
          <rect x="9" y="16" width="2" height="2" fill="#2D3748" />
          <rect x="7" y="7" width="6" height="4" fill="#C93B5B" />
          <rect x="8" y="8" width="4" height="2" fill="#FF758F" />
          <rect x="9" y="8" width="2" height="1" fill="#FFF3C4" />
          <rect x="5" y="7" width="1" height="1" fill="#E2E8F0" />
          <rect x="14" y="7" width="1" height="1" fill="#E2E8F0" />
        </g>
      )}
      {relicId === 'diente_del_rey' && (
        <g>
          <rect x="6" y="2" width="8" height="3" fill="#B7791F" />
          <rect x="7" y="3" width="6" height="2" fill="#FFD166" />
          <rect x="9" y="3" width="2" height="1" fill="#C93B5B" />
          <rect x="6" y="5" width="8" height="4" fill="#F4EBD9" />
          <rect x="7" y="9" width="6" height="4" fill="#D8C6A0" />
          <rect x="8" y="13" width="4" height="3" fill="#B8A37A" />
          <rect x="9" y="16" width="2" height="2" fill="#FFF3C4" />
          <rect x="7" y="6" width="2" height="5" fill="#FFFFFF" />
        </g>
      )}
      {relicId === 'ojo_del_oraculo' && (
        <g>
          <rect x="5" y="4" width="10" height="2" fill="#D69E2E" />
          <rect x="3" y="6" width="14" height="8" fill="#E7A54A" />
          <rect x="5" y="14" width="10" height="2" fill="#B7791F" />
          <rect x="5" y="7" width="10" height="6" fill="#1A102C" />
          <rect x="7" y="7" width="6" height="6" fill="#9B72CF" />
          <rect x="9" y="8" width="2" height="4" fill="#0B0A0E" />
          <rect x="8" y="8" width="1" height="2" fill="#FFF3C4" />
        </g>
      )}
      {relicId === 'frasco_sin_fondo' && (
        <g>
          <rect x="7" y="2" width="6" height="3" fill="#FFD166" />
          <rect x="8" y="5" width="4" height="2" fill="#69A8A5" />
          <rect x="4" y="7" width="12" height="10" fill="#1F4E5B" />
          <rect x="5" y="9" width="10" height="7" fill="#38B2AC" />
          <rect x="6" y="11" width="8" height="4" fill="#81E6D9" />
          <rect x="6" y="8" width="2" height="6" fill="#FFF3C4" />
          <rect x="4" y="11" width="12" height="1" fill="#E7A54A" />
        </g>
      )}
      {relicId === 'sello_del_vacio' && (
        <g>
          <rect x="4" y="4" width="12" height="12" fill="#2D1B4E" />
          <rect x="5" y="5" width="10" height="10" fill="#553C9A" />
          <rect x="7" y="7" width="6" height="6" fill="#0B0714" />
          <rect x="9" y="5" width="2" height="10" fill="#D6BCFA" />
          <rect x="5" y="9" width="10" height="2" fill="#D6BCFA" />
          <rect x="9" y="9" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}
      {relicId === 'moneda_del_muerto' && (
        <g>
          <rect x="5" y="3" width="10" height="14" fill="#B7791F" />
          <rect x="3" y="5" width="14" height="10" fill="#E7A54A" />
          <rect x="5" y="5" width="10" height="10" fill="#FFD166" />
          <rect x="7" y="6" width="6" height="5" fill="#744210" />
          <rect x="8" y="11" width="4" height="3" fill="#744210" />
          <rect x="8" y="8" width="1" height="1" fill="#FFF3C4" />
          <rect x="11" y="8" width="1" height="1" fill="#FFF3C4" />
        </g>
      )}
      {(relicId === 'espina_viva' || relicId === 'toxina_real') && (
        <g>
          <rect x="9" y="2" width="3" height="4" fill="#9AE6B4" />
          <rect x="7" y="6" width="5" height="5" fill="#48BB78" />
          <rect x="6" y="11" width="5" height="5" fill="#276749" />
          <rect x="5" y="15" width="4" height="3" fill="#22543D" />
          <rect x="5" y="7" width="2" height="2" fill="#C93B5B" />
          <rect x="12" y="9" width="2" height="2" fill="#C93B5B" />
          <rect x="10" y="3" width="1" height="4" fill="#F0FFF4" />
        </g>
      )}
      {relicId === 'guantes_del_boticario' && (
        <g>
          <rect x="4" y="6" width="12" height="11" fill="#5D3A24" />
          <rect x="5" y="7" width="10" height="8" fill="#8C583A" />
          <rect x="4" y="3" width="2" height="3" fill="#8C583A" />
          <rect x="7" y="2" width="2" height="4" fill="#8C583A" />
          <rect x="10" y="2" width="2" height="4" fill="#8C583A" />
          <rect x="13" y="4" width="2" height="3" fill="#8C583A" />
          <rect x="7" y="9" width="6" height="4" fill="#E7A54A" />
          <rect x="8" y="10" width="4" height="2" fill="#48BB78" />
        </g>
      )}
      {relicId === 'libro_prohibido' && (
        <g>
          <rect x="3" y="3" width="14" height="14" fill="#4A1525" />
          <rect x="5" y="4" width="11" height="12" fill="#701A32" />
          <rect x="15" y="4" width="2" height="12" fill="#E8DFCE" />
          <rect x="3" y="3" width="2" height="14" fill="#E7A54A" />
          <rect x="8" y="7" width="5" height="5" fill="#FFD166" />
          <rect x="9" y="8" width="3" height="3" fill="#9B72CF" />
          <rect x="10" y="9" width="1" height="1" fill="#FFF3C4" />
        </g>
      )}
      {relicId === 'corona_de_cristal' && (
        <g>
          <rect x="3" y="12" width="14" height="4" fill="#319795" />
          <rect x="4" y="13" width="12" height="2" fill="#81E6D9" />
          <rect x="3" y="7" width="3" height="5" fill="#4FD1C5" />
          <rect x="8" y="4" width="4" height="8" fill="#81E6D9" />
          <rect x="14" y="7" width="3" height="5" fill="#4FD1C5" />
          <rect x="9" y="5" width="2" height="6" fill="#E6FFFA" />
          <rect x="9" y="13" width="2" height="2" fill="#FFD166" />
        </g>
      )}
      {relicId === 'escudo_del_sepulturero' && (
        <g>
          <rect x="4" y="3" width="12" height="10" fill="#2D3748" />
          <rect x="6" y="13" width="8" height="3" fill="#2D3748" />
          <rect x="8" y="16" width="4" height="2" fill="#2D3748" />
          <rect x="5" y="4" width="10" height="8" fill="#4A5568" />
          <rect x="9" y="4" width="2" height="12" fill="#E7A54A" />
          <rect x="5" y="8" width="10" height="2" fill="#E7A54A" />
          <rect x="9" y="8" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}
    </svg>
  );
};

/**
 * High-Detail 32x32 Pixel-Art Weapon Sprites for all Canonical Weapons in La Cripta.
 */
export const LaCriptaWeaponPixelIcon: React.FC<{
  weaponId: CriptaWeaponId | string;
  upgradeLevel?: number;
  size?: number;
}> = ({ weaponId, upgradeLevel = 1, size = 36 }) => {
  const isUpgraded = upgradeLevel >= 2;
  const isMaxUpgraded = upgradeLevel >= 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className="shrink-0 select-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]"
      style={{ imageRendering: 'pixelated' }}
    >
      {isUpgraded && (
        <rect
          x="3"
          y="3"
          width="26"
          height="26"
          fill={isMaxUpgraded ? '#FFD166' : '#E7A54A'}
          opacity={isMaxUpgraded ? 0.16 : 0.1}
        />
      )}

      {/* 1. ESPADA OXIDADA (Rusted & Notched Iron Blade, Orange Corrosion, Worn Leather Hilt) */}
      {(weaponId === 'espada_oxidada' || weaponId === 'espada') && (
        <g>
          {/* Blade Silhouette & Multi-Level Shading */}
          <rect x="22" y="3" width="5" height="5" fill="#94A3B8" />
          <rect x="19" y="6" width="5" height="5" fill="#64748B" />
          <rect x="16" y="9" width="5" height="5" fill="#475569" />
          <rect x="13" y="12" width="5" height="5" fill="#64748B" />
          {/* Rust Patches & Chipped Edge Details */}
          <rect x="23" y="4" width="2" height="2" fill="#E2E8F0" />
          <rect x="20" y="7" width="2" height="2" fill="#B45309" />
          <rect x="17" y="10" width="3" height="2" fill="#9A3412" />
          <rect x="14" y="13" width="2" height="2" fill="#D97706" />
          <rect x="22" y="7" width="1" height="1" fill="#0F172A" />
          {/* Tarnished Iron Crossguard */}
          <rect x="8" y="14" width="4" height="3" fill="#78350F" />
          <rect x="11" y="16" width="5" height="3" fill="#92400E" />
          <rect x="14" y="19" width="4" height="3" fill="#78350F" />
          {/* Wrapped Leather Grip & Iron Pommel */}
          <rect x="7" y="20" width="4" height="4" fill="#451A03" />
          <rect x="5" y="23" width="4" height="4" fill="#78350F" />
          <rect x="3" y="25" width="4" height="4" fill="#64748B" />
          <rect x="4" y="26" width="2" height="2" fill="#94A3B8" />
        </g>
      )}

      {/* 2. ESPADA DEL SEPULCRO (Funerary Broadsword, Skull Guard, Violet Necrotic Fuller) */}
      {weaponId === 'espada_del_sepulcro' && (
        <g>
          <rect x="21" y="2" width="6" height="6" fill="#E2E8F0" />
          <rect x="18" y="5" width="6" height="6" fill="#CBD5E1" />
          <rect x="15" y="8" width="6" height="6" fill="#94A3B8" />
          <rect x="12" y="11" width="6" height="6" fill="#64748B" />
          {/* Necrotic Runic Fuller */}
          <rect x="22" y="4" width="2" height="2" fill="#FFFFFF" />
          <rect x="19" y="7" width="2" height="2" fill="#C084FC" />
          <rect x="16" y="10" width="2" height="2" fill="#9333EA" />
          <rect x="13" y="13" width="2" height="2" fill="#C084FC" />
          {/* Bone & Skull Crossguard */}
          <rect x="7" y="13" width="5" height="3" fill="#E2E8F0" />
          <rect x="10" y="15" width="6" height="5" fill="#F8FAFC" />
          <rect x="14" y="19" width="5" height="3" fill="#CBD5E1" />
          <rect x="11" y="16" width="1" height="1" fill="#0F172A" />
          <rect x="13" y="16" width="1" height="1" fill="#0F172A" />
          {/* Sepulchral Grip */}
          <rect x="6" y="20" width="4" height="5" fill="#3B0764" />
          <rect x="3" y="24" width="5" height="5" fill="#E2E8F0" />
        </g>
      )}

      {/* 3. ESPADÓN DEL REY HUNDIDO, ESPADA ÍGNEA & ESPADA BASTARDA REAL */}
      {(weaponId === 'espadon_del_rey_hundido' ||
        weaponId === 'espada_ignea' ||
        weaponId === 'espada_bastarda_real') && (
        <g>
          <rect
            x="20"
            y="2"
            width="8"
            height="7"
            fill={
              weaponId === 'espada_ignea'
                ? '#FEF08A'
                : weaponId === 'espada_bastarda_real'
                ? '#F8FAFC'
                : '#67E8F9'
            }
          />
          <rect
            x="17"
            y="5"
            width="8"
            height="7"
            fill={
              weaponId === 'espada_ignea'
                ? '#F97316'
                : weaponId === 'espada_bastarda_real'
                ? '#E2E8F0'
                : '#06B6D4'
            }
          />
          <rect
            x="14"
            y="8"
            width="8"
            height="7"
            fill={
              weaponId === 'espada_ignea'
                ? '#EA580C'
                : weaponId === 'espada_bastarda_real'
                ? '#94A3B8'
                : '#0E7490'
            }
          />
          <rect
            x="11"
            y="11"
            width="8"
            height="7"
            fill={
              weaponId === 'espada_ignea'
                ? '#9A3412'
                : weaponId === 'espada_bastarda_real'
                ? '#64748B'
                : '#155E75'
            }
          />
          {/* Glowing Core & Shimmer */}
          <rect x="23" y="4" width="3" height="3" fill="#FFFFFF" />
          <rect
            x="19"
            y="7"
            width="3"
            height="3"
            fill={
              weaponId === 'espada_ignea'
                ? '#FDE047'
                : weaponId === 'espada_bastarda_real'
                ? '#FFD166'
                : '#CFFAFE'
            }
          />
          <rect
            x="15"
            y="11"
            width="3"
            height="3"
            fill={
              weaponId === 'espada_ignea'
                ? '#FDBA74'
                : weaponId === 'espada_bastarda_real'
                ? '#F59E0B'
                : '#67E8F9'
            }
          />
          {/* Royal Golden / Molten Crossguard */}
          <rect x="6" y="13" width="6" height="4" fill="#F59E0B" />
          <rect x="10" y="15" width="7" height="5" fill="#FBBF24" />
          <rect x="14" y="19" width="6" height="4" fill="#D97706" />
          <rect
            x="12"
            y="17"
            width="2"
            height="2"
            fill={
              weaponId === 'espada_ignea'
                ? '#EF4444'
                : weaponId === 'espada_bastarda_real'
                ? '#FFF3C4'
                : '#22D3EE'
            }
          />
          {/* Heavy Two-Handed Hilt */}
          <rect x="5" y="20" width="5" height="5" fill="#451A03" />
          <rect x="2" y="24" width="5" height="5" fill="#FBBF24" />
        </g>
      )}

      {/* 4. DAGAS, ESTOQUE, COLMILLOS DE SOMBRA & GUADAÑA DEL VERDUGO */}
      {(weaponId === 'dagas_melladas' ||
        weaponId === 'hojas_colmillo_venenoso' ||
        weaponId === 'dagas_sombra_nocturna' ||
        weaponId === 'estoque_carmesi' ||
        weaponId === 'guadana_del_verdugo') && (
        <g>
          {weaponId === 'guadana_del_verdugo' ? (
            <>
              <rect x="7" y="3" width="18" height="4" fill="#E2E8F0" />
              <rect x="4" y="6" width="12" height="4" fill="#C93B5B" />
              <rect x="3" y="10" width="5" height="5" fill="#FF4D6D" />
              <rect x="9" y="4" width="14" height="2" fill="#FFFFFF" />
              <rect x="20" y="5" width="3" height="24" fill="#3B0764" />
              <rect x="21" y="5" width="1" height="24" fill="#A855F7" />
              <rect x="18" y="14" width="6" height="2" fill="#FFD166" />
            </>
          ) : weaponId === 'estoque_carmesi' ? (
            <>
              {/* Aristocratic Crimson Rapier with Swept Basket Hilt */}
              <rect x="24" y="3" width="3" height="3" fill="#FFF1F2" />
              <rect x="21" y="6" width="3" height="3" fill="#FB7185" />
              <rect x="18" y="9" width="3" height="3" fill="#E11D48" />
              <rect x="15" y="12" width="3" height="3" fill="#BE123C" />
              <rect x="12" y="15" width="3" height="3" fill="#9F1239" />
              {/* Ornate Golden Cup Guard */}
              <rect x="8" y="14" width="8" height="6" fill="#F59E0B" />
              <rect x="9" y="15" width="6" height="4" fill="#FDE047" />
              <rect x="10" y="16" width="3" height="2" fill="#E11D48" />
              <rect x="5" y="20" width="4" height="5" fill="#881337" />
              <rect x="3" y="24" width="4" height="4" fill="#FBBF24" />
            </>
          ) : (
            <>
              {/* Twin Daggers / Venom Fangs / Night Shadow Fangs */}
              <rect
                x="20"
                y="4"
                width="5"
                height="5"
                fill={
                  weaponId === 'hojas_colmillo_venenoso'
                    ? '#86EFAC'
                    : weaponId === 'dagas_sombra_nocturna'
                    ? '#D8B4FE'
                    : '#E2E8F0'
                }
              />
              <rect
                x="16"
                y="8"
                width="5"
                height="5"
                fill={
                  weaponId === 'hojas_colmillo_venenoso'
                    ? '#22C55E'
                    : weaponId === 'dagas_sombra_nocturna'
                    ? '#9333EA'
                    : '#94A3B8'
                }
              />
              <rect
                x="13"
                y="12"
                width="4"
                height="4"
                fill={
                  weaponId === 'hojas_colmillo_venenoso'
                    ? '#15803D'
                    : weaponId === 'dagas_sombra_nocturna'
                    ? '#581C87'
                    : '#64748B'
                }
              />
              <rect
                x="9"
                y="15"
                width="8"
                height="3"
                fill={weaponId === 'dagas_sombra_nocturna' ? '#C93B5B' : '#D97706'}
              />
              <rect x="7" y="18" width="4" height="5" fill="#451A03" />
              <rect x="5" y="23" width="3" height="3" fill="#FBBF24" />
              {/* Secondary Off-Hand Dagger */}
              <rect
                x="23"
                y="11"
                width="4"
                height="5"
                fill={
                  weaponId === 'hojas_colmillo_venenoso'
                    ? '#4ADE80'
                    : weaponId === 'dagas_sombra_nocturna'
                    ? '#F43F5E'
                    : '#CBD5E1'
                }
              />
              <rect x="14" y="5" width="2" height="2" fill="#FEF08A" />
            </>
          )}
        </g>
      )}

      {/* 5. BÁCULOS, VARITAS, CETROS & GRIMORIOS */}
      {(weaponId === 'baston_ceniza' ||
        weaponId === 'vara_de_cristal_astral' ||
        weaponId === 'grimorio_prohibido_arma' ||
        weaponId === 'grimorio_sepulcral' ||
        weaponId === 'cetro_del_eclipse' ||
        weaponId === 'baculo_del_eclipse') && (
        <g>
          {weaponId === 'grimorio_prohibido_arma' ||
          weaponId === 'grimorio_sepulcral' ? (
            <>
              <rect
                x="6"
                y="4"
                width="20"
                height="23"
                fill={weaponId === 'grimorio_sepulcral' ? '#14261D' : '#2E1065'}
              />
              <rect
                x="8"
                y="6"
                width="16"
                height="19"
                fill={weaponId === 'grimorio_sepulcral' ? '#1E3A2F' : '#4C1D95'}
              />
              <rect x="22" y="6" width="3" height="19" fill="#FEF3C7" />
              <rect
                x="6"
                y="4"
                width="3"
                height="23"
                fill={weaponId === 'grimorio_sepulcral' ? '#D6D3D1' : '#F59E0B'}
              />
              {/* Skull / Forbidden Eye on Cover */}
              <rect
                x="11"
                y="10"
                width="9"
                height="8"
                fill={weaponId === 'grimorio_sepulcral' ? '#E7E5E4' : '#A855F7'}
              />
              <rect
                x="13"
                y="12"
                width="5"
                height="4"
                fill={weaponId === 'grimorio_sepulcral' ? '#34D399' : '#FEF08A'}
              />
              <rect x="15" y="13" width="2" height="2" fill="#0F172A" />
              <rect
                x="10"
                y="7"
                width="2"
                height="2"
                fill={weaponId === 'grimorio_sepulcral' ? '#6EE7B7' : '#FBBF24'}
              />
              <rect
                x="18"
                y="20"
                width="2"
                height="2"
                fill={weaponId === 'grimorio_sepulcral' ? '#A855F7' : '#FBBF24'}
              />
            </>
          ) : (
            <>
              {/* Crescent / Astral Crown Head */}
              <rect x="9" y="3" width="14" height="3" fill="#F59E0B" />
              <rect x="7" y="5" width="4" height="7" fill="#D97706" />
              <rect x="21" y="5" width="4" height="7" fill="#D97706" />
              <rect
                x="12"
                y="5"
                width="8"
                height="7"
                fill={
                  weaponId === 'vara_de_cristal_astral'
                    ? '#22D3EE'
                    : weaponId === 'cetro_del_eclipse' ||
                      weaponId === 'baculo_del_eclipse'
                    ? '#A855F7'
                    : '#F97316'
                }
              />
              <rect x="14" y="6" width="4" height="4" fill="#FFFFFF" />
              {/* Staff Shaft */}
              <rect x="14" y="12" width="4" height="17" fill="#451A03" />
              <rect x="15" y="12" width="2" height="17" fill="#78350F" />
              <rect x="13" y="16" width="6" height="2" fill="#FBBF24" />
              <rect x="13" y="26" width="6" height="2" fill="#FBBF24" />
            </>
          )}
        </g>
      )}

      {/* 6. ARCOS, BALLESTAS & CAÑONES */}
      {(weaponId === 'arco_cazador' ||
        weaponId === 'arco_de_espinas' ||
        weaponId === 'arco_de_raiz' ||
        weaponId === 'ballesta_de_asedio' ||
        weaponId === 'canon_de_azufre') && (
        <g>
          {weaponId === 'canon_de_azufre' ? (
            <>
              {/* Heavy Brass & Iron Hand-Cannon with Glowing Sulfur Core */}
              <rect x="5" y="9" width="22" height="9" fill="#1E293B" />
              <rect x="7" y="10" width="18" height="6" fill="#475569" />
              <rect x="23" y="8" width="5" height="11" fill="#D97706" />
              <rect x="25" y="10" width="3" height="7" fill="#F97316" />
              <rect x="26" y="12" width="2" height="3" fill="#FEF08A" />
              <rect x="11" y="12" width="8" height="3" fill="#EF4444" />
              <rect x="6" y="18" width="7" height="8" fill="#78350F" />
              <rect x="14" y="6" width="4" height="3" fill="#FBBF24" />
            </>
          ) : weaponId === 'ballesta_de_asedio' ? (
            <>
              <rect x="4" y="8" width="24" height="4" fill="#64748B" />
              <rect x="6" y="9" width="20" height="2" fill="#E2E8F0" />
              <rect x="13" y="5" width="6" height="23" fill="#78350F" />
              <rect x="15" y="3" width="2" height="19" fill="#FEF08A" />
              <rect x="13" y="2" width="6" height="4" fill="#22C55E" />
              <rect x="11" y="15" width="10" height="3" fill="#F59E0B" />
            </>
          ) : (
            <>
              {/* Curved Wood / Living Root Limbs */}
              <rect
                x="7"
                y="4"
                width="4"
                height="24"
                fill={
                  weaponId === 'arco_de_espinas' || weaponId === 'arco_de_raiz'
                    ? '#166534'
                    : '#78350F'
                }
              />
              <rect
                x="9"
                y="6"
                width="2"
                height="20"
                fill={
                  weaponId === 'arco_de_espinas' || weaponId === 'arco_de_raiz'
                    ? '#22C55E'
                    : '#B45309'
                }
              />
              {/* Living Root Sprouts / Brass Tips */}
              <rect
                x="10"
                y="3"
                width="6"
                height="3"
                fill={
                  weaponId === 'arco_de_espinas' || weaponId === 'arco_de_raiz'
                    ? '#4ADE80'
                    : '#F59E0B'
                }
              />
              <rect
                x="10"
                y="26"
                width="6"
                height="3"
                fill={
                  weaponId === 'arco_de_espinas' || weaponId === 'arco_de_raiz'
                    ? '#4ADE80'
                    : '#F59E0B'
                }
              />
              {/* Bowstring & Nocked Arrow */}
              <rect x="14" y="5" width="1" height="22" fill="#E2E8F0" />
              <rect x="5" y="15" width="19" height="2" fill="#FEF3C7" />
              <rect x="22" y="13" width="6" height="6" fill="#22C55E" />
              <rect x="25" y="15" width="3" height="2" fill="#FFFFFF" />
            </>
          )}
        </g>
      )}

      {/* 7. HACHAS, MARTILLOS, MAZAS, PICOS, ALABARDAS & RELICARIOS */}
      {(weaponId === 'maza_consagrada' ||
        weaponId === 'simbolo_del_alba' ||
        weaponId === 'martillo_del_juicio' ||
        weaponId === 'martillo_del_osario' ||
        weaponId === 'relicario_serafin' ||
        weaponId === 'hacha_forja_infernal' ||
        weaponId === 'hacha_de_guerra' ||
        weaponId === 'pico_de_minero_runico' ||
        weaponId === 'alabarda_del_juramento') && (
        <g>
          {weaponId === 'hacha_forja_infernal' || weaponId === 'hacha_de_guerra' ? (
            <>
              {/* Double-Bitted War Axe / Molten Infernal Axe */}
              <polygon
                points="6,4 13,7 13,17 6,20 4,12"
                fill={weaponId === 'hacha_forja_infernal' ? '#EA580C' : '#94A3B8'}
              />
              <polygon
                points="26,4 19,7 19,17 26,20 28,12"
                fill={weaponId === 'hacha_forja_infernal' ? '#EA580C' : '#94A3B8'}
              />
              <rect
                x="5"
                y="6"
                width="3"
                height="12"
                fill={weaponId === 'hacha_forja_infernal' ? '#FEF08A' : '#F8FAFC'}
              />
              <rect
                x="24"
                y="6"
                width="3"
                height="12"
                fill={weaponId === 'hacha_forja_infernal' ? '#FEF08A' : '#F8FAFC'}
              />
              <rect x="14" y="3" width="4" height="26" fill="#78350F" />
              <rect x="13" y="8" width="6" height="6" fill="#F59E0B" />
            </>
          ) : weaponId === 'alabarda_del_juramento' ? (
            <>
              {/* Golden Bastion Halberd with Spear Point, Crescent Axe Blade & Back Fluke */}
              <rect x="14" y="1" width="4" height="6" fill="#FEF08A" />
              <rect x="15" y="2" width="2" height="5" fill="#FFFFFF" />
              <rect x="14" y="7" width="4" height="23" fill="#78350F" />
              <rect x="15" y="7" width="2" height="23" fill="#B45309" />
              <polygon points="4,6 14,8 14,18 5,20 3,13" fill="#F59E0B" />
              <rect x="4" y="8" width="3" height="10" fill="#FEF3C7" />
              <polygon points="18,9 26,7 23,14 18,15" fill="#D97706" />
              <rect x="12" y="8" width="8" height="4" fill="#FBBF24" />
            </>
          ) : weaponId === 'pico_de_minero_runico' ? (
            <>
              {/* Curved Twin-Pick Head with Glowing Cyan Runes */}
              <polygon points="3,9 14,5 18,5 29,9 26,12 16,9 6,12" fill="#475569" />
              <rect x="4" y="8" width="5" height="2" fill="#38BDF8" />
              <rect x="23" y="8" width="5" height="2" fill="#38BDF8" />
              <rect x="13" y="4" width="6" height="6" fill="#F59E0B" />
              <rect x="14" y="10" width="4" height="19" fill="#5C341D" />
              <rect x="15" y="10" width="2" height="19" fill="#8A5230" />
            </>
          ) : weaponId === 'relicario_serafin' || weaponId === 'simbolo_del_alba' ? (
            <>
              {/* Radiant Sunburst Reliquary / Dawn Scepter */}
              <rect x="14" y="1" width="4" height="4" fill="#FEF08A" />
              <rect x="7" y="8" width="4" height="4" fill="#FEF08A" />
              <rect x="21" y="8" width="4" height="4" fill="#FEF08A" />
              <rect x="9" y="4" width="14" height="12" fill="#D97706" />
              <rect x="11" y="6" width="10" height="8" fill="#FDE047" />
              <rect x="13" y="8" width="6" height="4" fill="#FFFFFF" />
              <rect x="14" y="16" width="4" height="13" fill="#78350F" />
              <rect x="12" y="26" width="8" height="3" fill="#FBBF24" />
            </>
          ) : (
            <>
              {/* Massive Warhammer / Bone Maul / Sacred Flanged Mace */}
              <rect
                x="6"
                y="4"
                width="20"
                height="10"
                fill={
                  weaponId === 'martillo_del_osario'
                    ? '#CBD5E1'
                    : weaponId === 'maza_consagrada'
                    ? '#B45309'
                    : '#D97706'
                }
              />
              <rect
                x="8"
                y="5"
                width="16"
                height="8"
                fill={
                  weaponId === 'martillo_del_osario'
                    ? '#F8FAFC'
                    : weaponId === 'maza_consagrada'
                    ? '#FBBF24'
                    : '#FACC15'
                }
              />
              <rect x="14" y="2" width="4" height="4" fill="#FFFFFF" />
              <rect x="14" y="14" width="4" height="15" fill="#451A03" />
              <rect x="15" y="14" width="2" height="15" fill="#92400E" />
              <rect x="12" y="26" width="8" height="3" fill="#FBBF24" />
            </>
          )}
        </g>
      )}

      {/* 8. ARTEFACTOS ALQUÍMICOS & CATALIZADORES */}
      {(weaponId === 'lanzador_alquimico' ||
        weaponId === 'catalizador_esporas' ||
        weaponId === 'guantelete_mutageno') && (
        <g>
          {weaponId === 'guantelete_mutageno' ? (
            <>
              {/* Brass & Glass Mutagen Injector Gauntlet with Twin Syringe Needles */}
              <rect x="11" y="2" width="3" height="6" fill="#E2E8F0" />
              <rect x="18" y="2" width="3" height="6" fill="#E2E8F0" />
              <rect x="7" y="8" width="18" height="16" fill="#14532D" />
              <rect x="9" y="10" width="14" height="12" fill="#22C55E" />
              <rect x="11" y="12" width="10" height="7" fill="#86EFAC" />
              <rect x="7" y="8" width="18" height="3" fill="#D97706" />
              <rect x="8" y="23" width="16" height="5" fill="#78350F" />
            </>
          ) : weaponId === 'catalizador_esporas' ? (
            <>
              {/* Fungal Spore Censer-Catalyst with Glowing Violet & Emerald Spores */}
              <rect x="8" y="6" width="16" height="13" fill="#3B0764" />
              <rect x="10" y="8" width="12" height="9" fill="#A855F7" />
              <rect x="12" y="10" width="8" height="5" fill="#4ADE80" />
              <rect x="6" y="3" width="3" height="3" fill="#86EFAC" />
              <rect x="23" y="4" width="3" height="3" fill="#C084FC" />
              <rect x="14" y="19" width="4" height="10" fill="#166534" />
            </>
          ) : (
            <>
              <rect x="7" y="5" width="18" height="15" fill="#134E4A" />
              <rect x="9" y="7" width="14" height="11" fill="#14B8A6" />
              <rect x="11" y="9" width="10" height="7" fill="#4ADE80" />
              <rect x="13" y="10" width="4" height="3" fill="#FFFFFF" />
              <rect x="6" y="4" width="20" height="2" fill="#F59E0B" />
              <rect x="6" y="19" width="20" height="2" fill="#F59E0B" />
              <rect x="12" y="21" width="8" height="6" fill="#78350F" />
              <rect x="14" y="2" width="4" height="3" fill="#86EFAC" />
            </>
          )}
        </g>
      )}

      {/* 9. ARMAS DE BÁRBARO: GRAN HACHA BÁRBARA, MAZO COLOSAL ROMPECRÁNEOS, ESPADÓN DE FURIA SANGRIENTA */}
      {weaponId === 'gran_hacha_barbara' && (
        <g>
          {/* Dark Pixel Silhouette Outline */}
          <rect x="13" y="2" width="5" height="28" fill="#140C0C" />
          {/* Heavy Iron-Shod Oak Shaft with Leather Wraps */}
          <rect x="14" y="3" width="3" height="26" fill="#5C341D" />
          <rect x="15" y="4" width="1" height="24" fill="#8A5230" />
          <rect x="13" y="18" width="5" height="2" fill="#9E2A2B" />
          <rect x="13" y="22" width="5" height="2" fill="#9E2A2B" />
          {/* Colossal Asymmetric Bearded Executioner Blade (Left Wing) */}
          <polygon points="3,4 14,6 14,17 4,21 2,12" fill="#1E242B" />
          <polygon points="4,5 13,7 13,16 5,19 3,12" fill="#64748B" />
          <rect x="4" y="6" width="3" height="12" fill="#CBD5E1" />
          <rect x="3" y="7" width="2" height="9" fill="#F8FAFC" />
          {/* Brutal Notch & Dried Blood Stain on Blade */}
          <rect x="3" y="11" width="2" height="2" fill="#140C0C" />
          <rect x="6" y="8" width="2" height="6" fill="#991B1B" />
          <rect x="7" y="10" width="2" height="3" fill="#DC2626" />
          {/* Back Counter-Spike & Bone Trophy Binding */}
          <polygon points="17,8 26,6 24,12 17,14" fill="#475569" />
          <rect x="21" y="7" width="4" height="2" fill="#E2E8F0" />
          <rect x="12" y="7" width="7" height="5" fill="#78350F" />
          <rect x="13" y="8" width="5" height="3" fill="#E7D8C1" />
          <rect x="13" y="27" width="5" height="3" fill="#D97706" />
        </g>
      )}

      {(weaponId === 'mazo_colosal_rompecraneos' ||
        weaponId === 'maza_rompecraneos') && (
        <g>
          {/* Heavy Maul Head with Horned Bone & Iron Studs */}
          <rect x="4" y="3" width="24" height="12" fill="#1C1917" />
          <rect x="5" y="4" width="22" height="10" fill="#57534E" />
          <rect x="7" y="5" width="18" height="8" fill="#78716C" />
          {/* Bone Skull Faceplate & Iron Impact Spikes */}
          <rect x="11" y="4" width="10" height="9" fill="#E7E5E4" />
          <rect x="12" y="5" width="8" height="7" fill="#F5F5F4" />
          <rect x="13" y="7" width="2" height="2" fill="#DC2626" />
          <rect x="17" y="7" width="2" height="2" fill="#DC2626" />
          <rect x="2" y="5" width="3" height="3" fill="#E2E8F0" />
          <rect x="2" y="10" width="3" height="3" fill="#E2E8F0" />
          <rect x="27" y="5" width="3" height="3" fill="#E2E8F0" />
          <rect x="27" y="10" width="3" height="3" fill="#E2E8F0" />
          {/* Shaft & Fur Trophy */}
          <rect x="14" y="15" width="4" height="14" fill="#451A03" />
          <rect x="15" y="15" width="2" height="14" fill="#78350F" />
          <rect x="11" y="15" width="3" height="5" fill="#9A3412" />
          <rect x="13" y="27" width="6" height="3" fill="#F59E0B" />
        </g>
      )}

      {weaponId === 'espadon_furia_sangrienta' && (
        <g>
          {/* Massive Jagged Greatsword Blade with Glowing Crimson Fuller */}
          <rect x="19" y="2" width="9" height="8" fill="#450A0A" />
          <rect x="16" y="5" width="9" height="8" fill="#7F1D1D" />
          <rect x="13" y="8" width="9" height="8" fill="#991B1B" />
          <rect x="10" y="11" width="9" height="8" fill="#450A0A" />
          {/* Serrated Steel Edges & Pulsing Blood Vein */}
          <rect x="21" y="3" width="5" height="5" fill="#F87171" />
          <rect x="23" y="4" width="3" height="3" fill="#FEF2F2" />
          <rect x="18" y="7" width="4" height="4" fill="#EF4444" />
          <rect x="15" y="10" width="4" height="4" fill="#DC2626" />
          <rect x="12" y="13" width="3" height="3" fill="#F87171" />
          {/* Wolf-Jaw & Bone Crossguard */}
          <rect x="6" y="13" width="6" height="4" fill="#D6D3D1" />
          <rect x="10" y="15" width="7" height="5" fill="#B45309" />
          <rect x="15" y="19" width="5" height="4" fill="#D6D3D1" />
          <rect x="12" y="16" width="3" height="3" fill="#EF4444" />
          {/* Heavy Two-Handed Hilt */}
          <rect x="5" y="20" width="5" height="5" fill="#451A03" />
          <rect x="2" y="24" width="5" height="5" fill="#DC2626" />
        </g>
      )}

      {/* 10. ARMAS DE BARDO: LAÚD DE RESONANCIA ARCANA, VIOLA DEL ECLIPSE, LIRA DEL VELO ASTRAL, CAMPANA DEL CORO UMBRÍO */}
      {weaponId === 'laud_resonancia_arcana' && (
        <g>
          {/* Angled Pegbox & Fretted Neck */}
          <rect x="21" y="2" width="6" height="4" fill="#B45309" />
          <rect x="23" y="3" width="3" height="2" fill="#FDE047" />
          <rect x="18" y="5" width="4" height="5" fill="#134E4A" />
          <rect x="15" y="8" width="4" height="5" fill="#115E59" />
          {/* Rounded Resonator Body (Dark Teal, Burgundy & Brass Ribs) */}
          <rect x="4" y="12" width="15" height="15" fill="#1E1B4B" />
          <rect x="5" y="13" width="13" height="13" fill="#134E4A" />
          <rect x="6" y="14" width="11" height="11" fill="#0F766E" />
          <rect x="5" y="12" width="13" height="2" fill="#F59E0B" />
          <rect x="4" y="25" width="15" height="2" fill="#F59E0B" />
          {/* Arcane Glowing Rose Soundhole & Luminous Strings */}
          <rect x="9" y="16" width="5" height="5" fill="#042F2E" />
          <rect x="10" y="17" width="3" height="3" fill="#38BDF8" />
          <rect x="11" y="18" width="1" height="1" fill="#FFFFFF" />
          <rect x="19" y="6" width="1" height="11" fill="#7DD3FC" />
          <rect x="16" y="9" width="1" height="11" fill="#FDE047" />
          <rect x="7" y="21" width="6" height="2" fill="#D97706" />
        </g>
      )}

      {(weaponId === 'viola_del_eclipse' ||
        weaponId === 'lira_del_velo_astral') && (
        <g>
          {/* Swan-Necked Celestial Brass / Eclipse Viola Frame */}
          <rect x="5" y="5" width="4" height="18" fill="#D97706" />
          <rect x="23" y="5" width="4" height="18" fill="#D97706" />
          <rect x="6" y="6" width="2" height="16" fill="#FDE047" />
          <rect x="24" y="6" width="2" height="16" fill="#FDE047" />
          {/* Top Yoke & Bottom Soundbox */}
          <rect x="7" y="4" width="18" height="3" fill="#F59E0B" />
          <rect x="6" y="21" width="20" height="6" fill="#1E1B4B" />
          <rect x="8" y="22" width="16" height="4" fill="#4C1D95" />
          <rect x="13" y="23" width="6" height="2" fill="#38BDF8" />
          {/* Glowing Starlight Strings & Central Astral Bow/Star */}
          <rect x="11" y="7" width="1" height="14" fill="#7DD3FC" />
          <rect x="14" y="7" width="1" height="14" fill="#E0F2FE" />
          <rect x="17" y="7" width="1" height="14" fill="#FDE047" />
          <rect x="20" y="7" width="1" height="14" fill="#C084FC" />
          <rect x="4" y="12" width="24" height="2" fill="#FDE047" />
          <rect x="15" y="10" width="2" height="6" fill="#FFFFFF" />
        </g>
      )}

      {weaponId === 'campana_del_coro_umbrio' && (
        <g>
          {/* Ornate Occult Tuning-Bell & Resonator Scepter */}
          <rect x="13" y="2" width="6" height="3" fill="#F59E0B" />
          <polygon points="8,5 24,5 27,16 5,16" fill="#78350F" />
          <polygon points="10,6 22,6 25,15 7,15" fill="#D97706" />
          <polygon points="12,7 20,7 22,14 10,14" fill="#FBBF24" />
          {/* Void Clapper & Sonic Wave Rings */}
          <rect x="14" y="15" width="4" height="4" fill="#A855F7" />
          <rect x="15" y="16" width="2" height="2" fill="#FFFFFF" />
          <rect x="3" y="10" width="2" height="5" fill="#38BDF8" />
          <rect x="27" y="10" width="2" height="5" fill="#38BDF8" />
          {/* Handle */}
          <rect x="14" y="19" width="4" height="10" fill="#1E1B4B" />
          <rect x="15" y="19" width="2" height="10" fill="#0F766E" />
          <rect x="12" y="27" width="8" height="2" fill="#F59E0B" />
        </g>
      )}

      {/* 11. ARMAS DE NIGROMANTE: GUADAÑA DE HUESO, INCENSARIO DE ALMAS, CETRO DEL OSARIO */}
      {weaponId === 'guadana_de_hueso' && (
        <g>
          {/* Curved Ossuary Bone Scythe Blade */}
          <rect x="5" y="3" width="19" height="4" fill="#D6D3D1" />
          <rect x="6" y="4" width="16" height="2" fill="#FAFAF9" />
          <rect x="3" y="6" width="11" height="3" fill="#A8A29E" />
          <rect x="2" y="9" width="5" height="5" fill="#34D399" />
          <rect x="3" y="10" width="3" height="2" fill="#ECFDF5" />
          {/* Necrotic Emerald Edge Glow */}
          <rect x="6" y="7" width="13" height="2" fill="#10B981" />
          {/* Skull Socket & Curved Spine Shaft */}
          <rect x="19" y="3" width="6" height="6" fill="#E7E5E4" />
          <rect x="21" y="5" width="2" height="2" fill="#10B981" />
          <rect x="20" y="9" width="3" height="20" fill="#292524" />
          <rect x="21" y="9" width="1" height="20" fill="#78716C" />
          {/* Hanging Soul Lantern */}
          <rect x="16" y="9" width="1" height="4" fill="#A8A29E" />
          <rect x="14" y="13" width="5" height="6" fill="#064E3B" />
          <rect x="15" y="14" width="3" height="4" fill="#34D399" />
          <rect x="16" y="15" width="1" height="2" fill="#FFFFFF" />
        </g>
      )}

      {weaponId === 'incensario_de_almas' && (
        <g>
          {/* Top Grip Ring & Twin Hanging Chains */}
          <rect x="13" y="2" width="6" height="3" fill="#D97706" />
          <rect x="11" y="5" width="2" height="8" fill="#94A3B8" />
          <rect x="19" y="5" width="2" height="8" fill="#94A3B8" />
          {/* Ritual Skull Thurible / Soul Censer */}
          <polygon points="7,13 25,13 22,25 10,25" fill="#1F2937" />
          <rect x="9" y="14" width="14" height="9" fill="#374151" />
          <rect x="7" y="13" width="18" height="2" fill="#F59E0B" />
          <rect x="10" y="24" width="12" height="3" fill="#F59E0B" />
          {/* Glowing Emerald & Violet Soul-Fire Billowing Out */}
          <rect x="11" y="16" width="10" height="5" fill="#10B981" />
          <rect x="13" y="17" width="6" height="3" fill="#A7F3D0" />
          <rect x="8" y="8" width="3" height="4" fill="#34D399" />
          <rect x="21" y="7" width="3" height="4" fill="#A855F7" />
          <rect x="15" y="8" width="3" height="4" fill="#6EE7B7" />
        </g>
      )}

      {weaponId === 'cetro_del_osario' && (
        <g>
          {/* Crowned Lich-Skull & Ribcage Scepter Head */}
          <rect x="10" y="2" width="12" height="3" fill="#F59E0B" />
          <rect x="12" y="1" width="2" height="2" fill="#FDE047" />
          <rect x="18" y="1" width="2" height="2" fill="#FDE047" />
          <rect x="9" y="5" width="14" height="9" fill="#E7E5E4" />
          <rect x="10" y="6" width="12" height="7" fill="#FAFAF9" />
          {/* Glowing Emerald Eye Sockets & Soul Core */}
          <rect x="11" y="8" width="3" height="3" fill="#064E3B" />
          <rect x="18" y="8" width="3" height="3" fill="#064E3B" />
          <rect x="12" y="9" width="2" height="2" fill="#34D399" />
          <rect x="18" y="9" width="2" height="2" fill="#34D399" />
          {/* Ribcage Collar & Bone Shaft */}
          <rect x="8" y="14" width="16" height="3" fill="#A8A29E" />
          <rect x="13" y="15" width="6" height="3" fill="#A855F7" />
          <rect x="14" y="18" width="4" height="11" fill="#44403C" />
          <rect x="15" y="18" width="2" height="11" fill="#D6D3D1" />
          <rect x="13" y="27" width="6" height="2" fill="#10B981" />
        </g>
      )}
    </svg>
  );
};

/**
 * High-Detail 28x28 Pixel-Art Armor Sprites for all Canonical Armors.
 */
export const LaCriptaArmorPixelIcon: React.FC<{
  armorId: CriptaArmorId | string;
  size?: number;
}> = ({ armorId, size = 32 }) => {
  const isRobe =
    armorId === 'tunica_del_astrologo' || armorId === 'manto_de_sombra_real';
  const isFungal = armorId === 'armadura_escamas_fungicas';
  const isHeavy =
    armorId === 'placas_del_juramento' || armorId === 'coraza_del_sepulturero';

  const primary = isRobe
    ? '#553C9A'
    : isFungal
    ? '#276749'
    : isHeavy
    ? '#718096'
    : '#8C583A';
  const highlight = isRobe
    ? '#9B72CF'
    : isFungal
    ? '#48BB78'
    : isHeavy
    ? '#CBD5E0'
    : '#B87D56';
  const trim = isRobe || isHeavy ? '#FFD166' : '#E7A54A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      shapeRendering="crispEdges"
      className="shrink-0 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="3" y="5" width="6" height="6" fill={primary} />
      <rect x="19" y="5" width="6" height="6" fill={primary} />
      <rect x="4" y="6" width="4" height="3" fill={highlight} />
      <rect x="20" y="6" width="4" height="3" fill={highlight} />
      <rect x="7" y="6" width="14" height="15" fill={primary} />
      <rect x="9" y="8" width="10" height="11" fill={highlight} />
      <rect x="10" y="5" width="8" height="2" fill="#1A102C" />
      <rect x="13" y="8" width="2" height="11" fill={trim} />
      <rect x="9" y="13" width="10" height="2" fill={trim} />
      <rect x="7" y="20" width="14" height="3" fill="#3E2314" />
      <rect x="12" y="20" width="4" height="3" fill="#FFD166" />
      <rect x="8" y="23" width="5" height="3" fill={primary} />
      <rect x="15" y="23" width="5" height="3" fill={primary} />
    </svg>
  );
};

/**
 * High-Detail 28x28 Pixel-Art Accessory Sprites for all Canonical Accessories.
 */
export const LaCriptaAccessoryPixelIcon: React.FC<{
  accessoryId: CriptaAccessoryId | string;
  size?: number;
}> = ({ accessoryId, size = 32 }) => {
  const isRing =
    accessoryId === 'anillo_del_boticario' || accessoryId === 'sello_del_cazador';
  const isHourglass = accessoryId === 'reloj_de_arena_astral';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      shapeRendering="crispEdges"
      className="shrink-0 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
      style={{ imageRendering: 'pixelated' }}
    >
      {isRing ? (
        <g>
          <rect x="10" y="4" width="8" height="6" fill="#FFD166" />
          <rect
            x="11"
            y="5"
            width="6"
            height="4"
            fill={accessoryId === 'anillo_del_boticario' ? '#48BB78' : '#C93B5B'}
          />
          <rect x="12" y="6" width="2" height="2" fill="#FFF3C4" />
          <rect x="6" y="10" width="16" height="13" fill="#D69E2E" />
          <rect x="8" y="12" width="12" height="9" fill="#FFD166" />
          <rect x="10" y="13" width="8" height="7" fill="#0B0812" />
        </g>
      ) : isHourglass ? (
        <g>
          <rect x="6" y="4" width="16" height="3" fill="#FFD166" />
          <rect x="6" y="21" width="16" height="3" fill="#FFD166" />
          <rect x="8" y="7" width="12" height="5" fill="#4FD1C5" />
          <rect x="11" y="12" width="6" height="4" fill="#81E6D9" />
          <rect x="8" y="16" width="12" height="5" fill="#4FD1C5" />
          <rect x="13" y="9" width="2" height="10" fill="#FFF3C4" />
        </g>
      ) : (
        <g>
          <rect x="8" y="3" width="2" height="6" fill="#D69E2E" />
          <rect x="18" y="3" width="2" height="6" fill="#D69E2E" />
          <rect x="7" y="8" width="14" height="14" fill="#FFD166" />
          <rect x="9" y="10" width="10" height="10" fill="#9B72CF" />
          <rect x="11" y="12" width="6" height="6" fill="#81E6D9" />
          <rect x="13" y="13" width="2" height="2" fill="#FFFFFF" />
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
  const unclaimed = drops.filter((d) => !d.claimed && !d.claimedByPlayerId);
  if (unclaimed.length === 0) return null;

  return (
    <div className="pointer-events-none relative z-30 flex flex-wrap items-center justify-center gap-3 py-1">
      {unclaimed.map((drop) => {
        const resolvedId = drop.dropId || drop.id || drop.label || 'drop';
        const isRelic = drop.type === 'RELIC_PEDESTAL' || drop.kind === 'RELIC';
        const isWeapon = drop.type === 'WEAPON' || drop.kind === 'WEAPON' || Boolean(drop.weaponId);
        const isGold = drop.type === 'GOLD_POUCH' || drop.kind === 'GOLD';
        const itemDef = drop.itemId ? CRIPTA_ITEMS_REGISTRY[drop.itemId] : null;
        const relicDef = drop.relicId ? CRIPTA_RELICS_REGISTRY[drop.relicId] : null;
        const weaponDef = drop.weaponId ? CRIPTA_WEAPONS_REGISTRY[drop.weaponId] : null;
        const title =
          drop.label ||
          itemDef?.name ||
          relicDef?.name ||
          weaponDef?.name ||
          'Botín';

        return (
          <LaCriptaPixelTooltip
            key={resolvedId}
            title={title}
            category={
              isRelic
                ? 'RELIQUIA ANCESTRAL'
                : isWeapon
                ? 'ARMA DEL GUARDIÁN'
                : isGold
                ? 'BOLSA DE ORO'
                : 'BOTÍN DE LA SALA'
            }
            description={
              itemDef
                ? itemDef.description
                : relicDef
                ? relicDef.description
                : weaponDef
                ? `${weaponDef.baseMinDamage}–${weaponDef.baseMaxDamage} DAÑO · ${weaponDef.specialEffectText}`
                : isGold && drop.goldAmount
                ? `Bolsa con +${drop.goldAmount} de oro para el grupo.`
                : 'Haz clic para recoger este botín del altar de piedra.'
            }
            footerLabel="CLIC PARA RECOGER"
            borderColor={isRelic || isWeapon ? '#FFD166' : '#E7A54A'}
            icon={
              itemDef ? (
                <LaCriptaItemPixelIcon itemId={itemDef.id} size={16} />
              ) : relicDef ? (
                <LaCriptaRelicPixelIcon relicId={relicDef.id} size={16} />
              ) : weaponDef ? (
                <LaCriptaWeaponPixelIcon weaponId={weaponDef.id} size={16} />
              ) : undefined
            }
            className="pointer-events-auto inline-flex"
          >
            <button
              type="button"
              onClick={() => {
                laCriptaAudio.playGoldChange(true);
                onClaimDrop(resolvedId);
              }}
              className={`group px-3 py-2 border-2 flex items-center gap-2.5 transition-all cursor-pointer hover:-translate-y-0.5 shadow-[0_6px_20px_rgba(0,0,0,0.92)] ${
                isRelic || isWeapon
                  ? 'bg-[#221233]/95 hover:bg-[#2F1A46] border-[#FFD166]'
                  : 'bg-[#171122]/95 hover:bg-[#241B35] border-[#E7A54A]'
              }`}
            >
              {itemDef && <LaCriptaItemPixelIcon itemId={itemDef.id} size={22} />}
              {relicDef && <LaCriptaRelicPixelIcon relicId={relicDef.id} size={22} />}
              {weaponDef && <LaCriptaWeaponPixelIcon weaponId={weaponDef.id} size={24} />}
              {isGold && !itemDef && !relicDef && !weaponDef && (
                <svg
                  width={22}
                  height={22}
                  viewBox="0 0 16 16"
                  shapeRendering="crispEdges"
                  className="shrink-0"
                >
                  <rect x="5" y="2" width="6" height="2" fill="#9E6B30" />
                  <rect x="4" y="4" width="8" height="2" fill="#FFD166" />
                  <rect x="3" y="6" width="10" height="8" fill="#8C5A32" />
                  <rect x="4" y="7" width="8" height="6" fill="#C48852" />
                  <rect x="6" y="8" width="4" height="4" fill="#FFD166" />
                  <rect x="7" y="9" width="2" height="2" fill="#FFF3C4" />
                </svg>
              )}
              <div className="text-left">
                <div className="text-[8px] font-cripta-pixel uppercase tracking-wider text-[#D8C6A0]">
                  {isRelic
                    ? '✦ RELIQUIA EN EL PEDESTAL'
                    : isGold
                    ? '✦ ORO EN EL SUELO'
                    : '✦ BOTÍN EN EL SUELO'}
                </div>
                <div className="font-cripta-pixel text-[10px] font-bold text-[#FFD166]">
                  RECOGER: {title.toUpperCase()}
                </div>
              </div>
            </button>
          </LaCriptaPixelTooltip>
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
  const activeRuneDef =
    activeSlot?.kind === 'WEAPON_RUNE' && activeSlot.weaponRuneId
      ? CRIPTA_WEAPON_RUNES_REGISTRY[activeSlot.weaponRuneId]
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
    if (slot.kind === 'WEAPON_RUNE' && slot.weaponRuneId) {
      const r = CRIPTA_WEAPON_RUNES_REGISTRY[slot.weaponRuneId];
      return {
        title: r?.name || 'Runa de Arma',
        tag: `INFUSIÓN · DAÑO ${r?.infusedDamageType || 'ELEMENTAL'}`,
        sub: r ? `${r.benefitText} · ${r.tradeoffText}` : '',
        color: r?.accentColor || '#B57CFF',
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
                      : slot.kind === 'WEAPON_RUNE'
                      ? '◈ RUNA'
                      : slot.kind === 'FORGE_UPGRADE'
                      ? '🔥 FORJA'
                      : 'POCIÓN'}
                  </span>

                  {slot.kind === 'ITEM' && slot.itemId ? (
                    <LaCriptaItemPixelIcon itemId={slot.itemId} size={28} />
                  ) : slot.kind === 'WEAPON_RUNE' && slot.weaponRuneId ? (
                    <LaCriptaWeaponRunePixelIcon runeId={slot.weaponRuneId} size={28} />
                  ) : slot.kind === 'WEAPON' && slot.weaponId ? (
                    <LaCriptaWeaponPixelIcon weaponId={slot.weaponId} size={28} />
                  ) : slot.kind === 'ARMOR' && slot.armorId ? (
                    <LaCriptaArmorPixelIcon armorId={slot.armorId} size={28} />
                  ) : slot.kind === 'ACCESSORY' && slot.accessoryId ? (
                    <LaCriptaAccessoryPixelIcon accessoryId={slot.accessoryId} size={28} />
                  ) : (
                    <div
                      className="w-7 h-7 flex items-center justify-center border font-cripta-pixel text-xs font-bold"
                      style={{
                        borderColor: info.color,
                        backgroundColor: '#0B090F',
                        color: info.color,
                      }}
                    >
                      ⚒
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
                  {activeWeaponDef && (
                    <LaCriptaWeaponPixelIcon weaponId={activeWeaponDef.id} size={32} />
                  )}
                  {activeArmorDef && (
                    <LaCriptaArmorPixelIcon armorId={activeArmorDef.id} size={28} />
                  )}
                  {activeAccDef && (
                    <LaCriptaAccessoryPixelIcon accessoryId={activeAccDef.id} size={28} />
                  )}
                  {activeRuneDef && (
                    <LaCriptaWeaponRunePixelIcon runeId={activeRuneDef.id} size={28} />
                  )}
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
                      : activeWeaponDef || activeArmorDef || activeAccDef || activeRuneDef
                      ? 'COMPRAR E INFUNDIR'
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
  pendingItem?: CriptaItemId | CriptaPendingInventoryReplacement;
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
  const rawPendingItemId =
    pending?.newItemId ||
    (typeof pendingItem === 'string'
      ? pendingItem
      : pendingItem && typeof pendingItem === 'object'
      ? pendingItem.newItemId
      : undefined);
  const newItemDef = rawPendingItemId ? CRIPTA_ITEMS_REGISTRY[rawPendingItemId] : null;
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
            <LaCriptaPixelTooltip
              key={`${acq.relicId}_${idx}`}
              title={rDef.name}
              category={rDef.ownershipType === 'PARTY' ? 'RELIQUIA DE GRUPO' : 'RELIQUIA'}
              description={rDef.description}
              footerLabel="CLIC PARA VER DETALLES"
              borderColor="#FFD166"
              icon={<LaCriptaRelicPixelIcon relicId={acq.relicId} size={14} />}
            >
              <button
                type="button"
                onClick={() => {
                  laCriptaAudio.playStoneClick();
                  onInspectRelic?.(acq);
                }}
                className="group inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1F142E] hover:bg-[#2C1B40] border border-[#FFD166]/70 hover:border-[#FFD166] transition-colors cursor-pointer"
              >
                <LaCriptaRelicPixelIcon relicId={acq.relicId} size={16} />
                <span className="text-[9px] font-cripta-pixel font-bold text-[#FFD166]">
                  {rDef.name}
                </span>
              </button>
            </LaCriptaPixelTooltip>
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

/**
 * High-Detail 24x24 Pixel-Art SVG Icons for the 9 Tactical Weapon Runes / Elemental Infusions.
 */
export const LaCriptaWeaponRunePixelIcon: React.FC<{
  runeId: CriptaWeaponRuneId | string;
  size?: number;
}> = ({ runeId, size = 24 }) => {
  const runeDef = CRIPTA_WEAPON_RUNES_REGISTRY[runeId as CriptaWeaponRuneId];
  const color = runeDef?.accentColor || '#B57CFF';
  const kind = runeDef?.iconKind || 'rune_astral';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="shrink-0 select-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Carved Obsidian Rune Tablet Backing */}
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#140F1D" stroke="#08060C" strokeWidth="1.5" />
      <polygon points="12,4 19,8 19,16 12,20 5,16 5,8" fill="#1F172B" stroke={color} strokeWidth="1" />

      {kind === 'rune_fire' && (
        <g>
          <polygon points="12,5 8,13 11,13 9,18 16,11 13,11" fill={color} />
          <rect x="11" y="10" width="3" height="4" fill="#FFF3C4" />
        </g>
      )}
      {kind === 'rune_ice' && (
        <g>
          <polygon points="12,5 8,12 12,19 16,12" fill={color} />
          <polygon points="12,7 10,12 12,17 14,12" fill="#E6FFFA" />
        </g>
      )}
      {kind === 'rune_poison' && (
        <g>
          <rect x="10" y="6" width="4" height="3" fill="#CBD5E0" />
          <polygon points="8,9 16,9 18,16 6,16" fill={color} />
          <rect x="10" y="11" width="2" height="2" fill="#F0FFF4" />
          <rect x="13" y="13" width="2" height="2" fill="#F0FFF4" />
        </g>
      )}
      {kind === 'rune_holy' && (
        <g>
          <rect x="11" y="5" width="2" height="14" fill={color} />
          <rect x="6" y="10" width="12" height="2" fill={color} />
          <rect x="10" y="9" width="4" height="4" fill="#FFFBEB" />
        </g>
      )}
      {kind === 'rune_blunt' && (
        <g>
          <rect x="7" y="6" width="10" height="6" fill={color} />
          <rect x="9" y="7" width="6" height="3" fill="#EDF2F7" />
          <rect x="11" y="12" width="2" height="7" fill="#A0AEC0" />
        </g>
      )}
      {kind === 'rune_pierce' && (
        <g>
          <polygon points="12,4 7,15 12,13 17,15" fill={color} />
          <rect x="11" y="7" width="2" height="11" fill="#FED7D7" />
        </g>
      )}
      {kind === 'rune_blood' && (
        <g>
          <polygon points="12,5 7,13 12,19 17,13" fill={color} />
          <rect x="10" y="11" width="3" height="4" fill="#FFF5F5" />
        </g>
      )}
      {kind === 'rune_shadow' && (
        <g>
          <path d="M14,6 A6,6 0 1,0 14,18 A4,5 0 1,1 14,6 Z" fill={color} />
          <rect x="14" y="10" width="2" height="2" fill="#FAF5FF" />
        </g>
      )}
      {kind === 'rune_astral' && (
        <g>
          <polygon points="12,5 14,10 19,12 14,14 12,19 10,14 5,12 10,10" fill={color} />
          <rect x="11" y="11" width="2" height="2" fill="#FFFFFF" />
        </g>
      )}
    </svg>
  );
};

/**
 * Compact Pixel-Art Damage Type Badge used on Weapons, Runes, and Combat Action Cards.
 */
export const LaCriptaDamageTypeBadge: React.FC<{
  damageType: CriptaDamageType;
  secondaryType?: CriptaDamageType;
  compact?: boolean;
}> = ({ damageType, secondaryType, compact = false }) => {
  const meta = CRIPTA_DAMAGE_TYPE_META[damageType] || CRIPTA_DAMAGE_TYPE_META.FISICO;
  const secMeta = secondaryType ? CRIPTA_DAMAGE_TYPE_META[secondaryType] : null;

  return (
    <span
      className={`inline-flex items-center gap-1 border font-cripta-pixel uppercase tracking-wider select-none ${
        compact ? 'px-1 py-0.5 text-[7px]' : 'px-1.5 py-0.5 text-[8px]'
      }`}
      style={{
        backgroundColor: meta.bgTint,
        borderColor: meta.borderColor,
        color: meta.color,
      }}
      title={`${meta.label}: ${meta.tacticalHint}`}
    >
      <span
        className="w-1.5 h-1.5 rotate-45 shrink-0"
        style={{ backgroundColor: meta.color }}
      />
      <span className="font-bold">
        {meta.shortLabel}
        {secMeta ? ` / ${secMeta.shortLabel}` : ''}
      </span>
    </span>
  );
};

