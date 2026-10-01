import type {
  CriptaAccessoryId,
  CriptaAcquiredRelic,
  CriptaArmorId,
  CriptaCharacterId,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaItemDefinition,
  CriptaItemId,
  CriptaPlayer,
  CriptaRelicDefinition,
  CriptaRelicId,
  CriptaRoomEnemy,
  CriptaRoomGroundDrop,
  CriptaShopSlot,
  CriptaWeaponId,
  CriptaWeaponRuneId,
} from '../../types/laCripta';
import {
  buildEnemyAiProfileForArchetype,
  createInitialEnemyMemory,
} from './criptaEnemyAiEngine';

export const NORMAL_INVENTORY_MAX_SLOTS = 6;

export const ALL_CRIPTA_ITEM_IDS: CriptaItemId[] = [
  'venda',
  'pocion_curacion',
  'pocion_mayor',
  'antidoto',
  'tonico_claridad',
  'unguento_igneo',
  'sal_purificadora',
  'elixir_fuerza',
  'elixir_hierro',
  'elixir_arcano',
  'bomba_humo',
  'frasco_volatil',
];

export const CRIPTA_ITEMS_REGISTRY: Record<CriptaItemId, CriptaItemDefinition> = {
  venda: {
    id: 'venda',
    name: 'Venda de Lino',
    description: 'Recupera +14 PV y detiene el SANGRADO del aventurero.',
    category: 'HEALING',
    rarity: 'COMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 16,
    healAmount: 14,
    cleanseTypes: ['BLEED'],
  },
  pocion_curacion: {
    id: 'pocion_curacion',
    name: 'Poción de Curación',
    description: 'Recupera +26 PV de inmediato con esencia carmesí.',
    category: 'HEALING',
    rarity: 'COMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 28,
    healAmount: 26,
  },
  pocion_mayor: {
    id: 'pocion_mayor',
    name: 'Poción Mayor',
    description: 'Recupera +46 PV y otorga REGENERACIÓN (2T).',
    category: 'HEALING',
    rarity: 'RARE',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 48,
    healAmount: 46,
    grantStatus: 'REGENERATION',
    grantStatusTurns: 2,
  },
  antidoto: {
    id: 'antidoto',
    name: 'Antídoto Destilado',
    description: 'Elimina VENENO de un aventurero y restaura +10 PV.',
    category: 'CLEANSE',
    rarity: 'COMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 20,
    healAmount: 10,
    cleanseTypes: ['POISON'],
  },
  tonico_claridad: {
    id: 'tonico_claridad',
    name: 'Tónico de Claridad',
    description: 'Elimina CONFUSIÓN y TEMOR, restaurando +10 PV.',
    category: 'CLEANSE',
    rarity: 'UNCOMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 22,
    healAmount: 10,
    cleanseTypes: ['CONFUSION', 'FEAR'],
  },
  unguento_igneo: {
    id: 'unguento_igneo',
    name: 'Ungüento Ígneo',
    description: 'Elimina QUEMADURA y ESCARCHA, otorgando +2 ARMADURA.',
    category: 'CLEANSE',
    rarity: 'UNCOMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 22,
    tempDefense: 2,
    cleanseTypes: ['BURN', 'FROST'],
  },
  sal_purificadora: {
    id: 'sal_purificadora',
    name: 'Sal Purificadora',
    description: 'Purifica todas las maldiciones y estados negativos de un aliado (+12 PV).',
    category: 'CLEANSE',
    rarity: 'RARE',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 32,
    healAmount: 12,
    cleanseAllDebuffs: true,
  },
  elixir_fuerza: {
    id: 'elixir_fuerza',
    name: 'Elixir de Fuerza',
    description: 'Aumenta +2 ATAQUE y otorga BENDECIDO (3T).',
    category: 'BUFF',
    rarity: 'UNCOMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 34,
    tempAttack: 2,
    grantStatus: 'BLESSED',
    grantStatusTurns: 3,
  },
  elixir_hierro: {
    id: 'elixir_hierro',
    name: 'Elixir de Hierro',
    description: 'Aumenta +4 ARMADURA y otorga ESCUDO (3T).',
    category: 'BUFF',
    rarity: 'UNCOMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 32,
    tempDefense: 4,
    grantStatus: 'SHIELDED',
    grantStatusTurns: 3,
  },
  elixir_arcano: {
    id: 'elixir_arcano',
    name: 'Elixir Arcano',
    description: 'Aumenta +2 MAGIA y otorga REGENERACIÓN (3T).',
    category: 'BUFF',
    rarity: 'UNCOMMON',
    targetType: 'SELF_OR_ALLY',
    combatUsable: true,
    roomUsable: true,
    basePrice: 34,
    tempMagic: 2,
    grantStatus: 'REGENERATION',
    grantStatusTurns: 3,
  },
  bomba_humo: {
    id: 'bomba_humo',
    name: 'Bomba de Humo',
    description: 'Otorga ESCUDO (2T) y +2 ARMADURA a todo el grupo.',
    category: 'UTILITY',
    rarity: 'UNCOMMON',
    targetType: 'PARTY',
    combatUsable: true,
    roomUsable: false,
    basePrice: 34,
    tempDefense: 2,
    grantStatus: 'SHIELDED',
    grantStatusTurns: 2,
  },
  frasco_volatil: {
    id: 'frasco_volatil',
    name: 'Frasco Volátil',
    description: 'Inflige 26 de daño alquímico al enemigo y lo vulnera.',
    category: 'OFFENSIVE',
    rarity: 'UNCOMMON',
    targetType: 'ENEMY',
    combatUsable: true,
    roomUsable: false,
    basePrice: 36,
    enemyDamage: 26,
    enemyStatus: 'POISON',
  },
};

export const ALL_CRIPTA_RELIC_IDS: CriptaRelicId[] = [
  'corazon_de_hierro',
  'diente_del_rey',
  'ojo_del_oraculo',
  'frasco_sin_fondo',
  'sello_del_vacio',
  'moneda_del_muerto',
  'espina_viva',
  'toxina_real',
  'guantes_del_boticario',
  'libro_prohibido',
  'corona_de_cristal',
  'escudo_del_sepulturero',
];

export const CRIPTA_RELICS_REGISTRY: Record<CriptaRelicId, CriptaRelicDefinition> = {
  corazon_de_hierro: {
    id: 'corazon_de_hierro',
    name: 'Corazón de Hierro',
    description: '+15% Vida Máxima y +2 Armadura al entrar en cada cámara.',
    rarity: 'RARE',
    ownershipType: 'PERSONAL',
    triggers: ['ON_ROOM_ENTER'],
    buildTag: 'DEFENSE',
    basePrice: 125,
  },
  diente_del_rey: {
    id: 'diente_del_rey',
    name: 'Diente del Rey',
    description: 'Los golpes críticos infligen un +35% de daño adicional.',
    rarity: 'RARE',
    ownershipType: 'PERSONAL',
    triggers: ['ON_CRITICAL'],
    buildTag: 'CRIT',
    basePrice: 135,
  },
  ojo_del_oraculo: {
    id: 'ojo_del_oraculo',
    name: 'Ojo del Oráculo',
    description: 'Ilumina cámaras ocultas y otorga +1 MAGIA a todo el grupo.',
    rarity: 'RARE',
    ownershipType: 'PARTY',
    triggers: ['ON_ROOM_ENTER'],
    buildTag: 'MAGIC',
    basePrice: 130,
  },
  frasco_sin_fondo: {
    id: 'frasco_sin_fondo',
    name: 'Frasco sin Fondo',
    description: 'Las vendas y pociones de curación restauran un +40% más de PV.',
    rarity: 'RARE',
    ownershipType: 'PERSONAL',
    triggers: ['ON_HEAL', 'ON_ITEM_USE'],
    buildTag: 'DEFENSE',
    basePrice: 120,
  },
  sello_del_vacio: {
    id: 'sello_del_vacio',
    name: 'Sello del Vacío',
    description: 'Reduce la duración de CONFUSIÓN/MALDICIÓN en 1 turno y +2 daño arcano.',
    rarity: 'RARE',
    ownershipType: 'PARTY',
    triggers: ['ON_COMBAT_START', 'ON_ATTACK'],
    buildTag: 'MAGIC',
    basePrice: 125,
  },
  moneda_del_muerto: {
    id: 'moneda_del_muerto',
    name: 'Moneda del Muerto',
    description: 'Descuento del 25% en todas las tiendas y +8 ORO al despejar cámaras.',
    rarity: 'RARE',
    ownershipType: 'PARTY',
    triggers: ['ON_ROOM_ENTER'],
    buildTag: 'UTILITY',
    basePrice: 115,
  },
  espina_viva: {
    id: 'espina_viva',
    name: 'Espina Viva',
    description: 'Tus ataques envenenan al enemigo y causan +6 de daño a objetivos envenenados.',
    rarity: 'RARE',
    ownershipType: 'PERSONAL',
    triggers: ['ON_ATTACK', 'ON_POISON'],
    buildTag: 'POISON',
    basePrice: 135,
  },
  toxina_real: {
    id: 'toxina_real',
    name: 'Toxina Real',
    description: 'El grupo inflige un +25% de daño adicional a enemigos envenenados.',
    rarity: 'LEGENDARY',
    ownershipType: 'PARTY',
    triggers: ['ON_POISON', 'ON_ATTACK'],
    buildTag: 'POISON',
    basePrice: 155,
  },
  guantes_del_boticario: {
    id: 'guantes_del_boticario',
    name: 'Guantes del Boticario',
    description: 'Al usar cualquier consumible, envenena al enemigo activo y cura +6 PV extra.',
    rarity: 'RARE',
    ownershipType: 'PERSONAL',
    triggers: ['ON_ITEM_USE'],
    buildTag: 'POISON',
    basePrice: 125,
  },
  libro_prohibido: {
    id: 'libro_prohibido',
    name: 'Libro Prohibido',
    description: 'Las habilidades de clase infligen +30% de daño y otorgan BENDECIDO.',
    rarity: 'LEGENDARY',
    ownershipType: 'PERSONAL',
    triggers: ['ON_ATTACK'],
    buildTag: 'MAGIC',
    basePrice: 150,
  },
  corona_de_cristal: {
    id: 'corona_de_cristal',
    name: 'Corona de Cristal',
    description: 'Al iniciar cada combate, todo el grupo recibe ESCUDO (2T) y +1 MAGIA.',
    rarity: 'LEGENDARY',
    ownershipType: 'PARTY',
    triggers: ['ON_COMBAT_START'],
    buildTag: 'MAGIC',
    basePrice: 160,
  },
  escudo_del_sepulturero: {
    id: 'escudo_del_sepulturero',
    name: 'Escudo del Sepulturero',
    description: 'Al derrotar a un enemigo, todo el grupo recupera +6 PV y +2 Armadura.',
    rarity: 'RARE',
    ownershipType: 'PARTY',
    triggers: ['ON_ENEMY_DEATH'],
    buildTag: 'DEFENSE',
    basePrice: 140,
  },
};

export const CRIPTA_CONSUMABLES_BY_ID = CRIPTA_ITEMS_REGISTRY;
export const CRIPTA_RELICS_BY_ID = CRIPTA_RELICS_REGISTRY;

export const RARITY_BADGE_COLORS: Record<
  string,
  { border: string; text: string; label: string; bg: string }
> = {
  COMMON: {
    border: '#D8C6A0',
    text: '#D8C6A0',
    label: 'COMÚN',
    bg: '#1A1622',
  },
  UNCOMMON: {
    border: '#5EA87A',
    text: '#5EA87A',
    label: 'POCO COMÚN',
    bg: '#13241B',
  },
  RARE: {
    border: '#9B72CF',
    text: '#B57CFF',
    label: 'RARA',
    bg: '#201530',
  },
  LEGENDARY: {
    border: '#FFD166',
    text: '#FFD166',
    label: 'LEGENDARIA',
    bg: '#2A1D12',
  },
};

function pseudoRandom(seed: number, step: number): number {
  let t = (seed + step * 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function playerHasRelic(
  player: CriptaPlayer,
  partyRelics: CriptaAcquiredRelic[] | undefined,
  relicId: CriptaRelicId
): boolean {
  if ((player.personalRelics || []).some((r) => r.relicId === relicId)) {
    return true;
  }
  if ((partyRelics || []).some((r) => r.relicId === relicId)) {
    return true;
  }
  return false;
}

export function pickUnownedRelic(
  seed: number,
  step: number,
  players: CriptaPlayer[],
  partyRelics: CriptaAcquiredRelic[] = []
): CriptaRelicId {
  const ownedIds = new Set<CriptaRelicId>();
  for (const r of partyRelics) ownedIds.add(r.relicId);
  for (const p of players) {
    for (const r of p.personalRelics || []) {
      ownedIds.add(r.relicId);
    }
  }
  const available = ALL_CRIPTA_RELIC_IDS.filter((id) => !ownedIds.has(id));
  const pool = available.length > 0 ? available : ALL_CRIPTA_RELIC_IDS;
  const idx = Math.floor(pseudoRandom(seed, step) * pool.length);
  return pool[idx % pool.length];
}

/**
 * Controlled enemy loot drop table (Requirements 10 & 11):
 * - Common enemies: ~32% chance for a practical consumable
 * - Elite enemies: 85% chance for high-value consumable or Relic
 * - Boss enemies: Guaranteed rare consumable or Relic
 */
export function rollEnemyLootDrop(
  seed: number,
  roomIndex: number,
  enemyIndex: number,
  enemyName: string,
  isElite: boolean,
  isBoss: boolean,
  players: CriptaPlayer[],
  partyRelics: CriptaAcquiredRelic[]
): CriptaRoomGroundDrop | null {
  const step = roomIndex * 97 + enemyIndex * 31 + 17;
  const roll = pseudoRandom(seed, step);
  const generatedId = `drop_${roomIndex}_${enemyIndex}_${seed}`;

  if (isBoss) {
    const relicId = pickUnownedRelic(seed, step + 3, players, partyRelics);
    const rDef = CRIPTA_RELICS_REGISTRY[relicId];
    return {
      id: generatedId,
      dropId: generatedId,
      kind: 'RELIC',
      type: 'RELIC_PEDESTAL',
      label: rDef?.name || 'Reliquia Ancestral',
      relicId,
      droppedByEnemyName: enemyName,
      xPercent: 52,
      claimed: false,
      claimedByPlayerId: null,
    };
  }

  if (isElite) {
    if (roll < 0.42) {
      const relicId = pickUnownedRelic(seed, step + 5, players, partyRelics);
      const rDef = CRIPTA_RELICS_REGISTRY[relicId];
      return {
        id: generatedId,
        dropId: generatedId,
        kind: 'RELIC',
        type: 'RELIC_PEDESTAL',
        label: rDef?.name || 'Reliquia Ancestral',
        relicId,
        droppedByEnemyName: enemyName,
        xPercent: 48,
        claimed: false,
        claimedByPlayerId: null,
      };
    }
    const eliteItems: CriptaItemId[] = [
      'pocion_curacion',
      'pocion_mayor',
      'sal_purificadora',
      'elixir_fuerza',
      'elixir_arcano',
      'frasco_volatil',
    ];
    const itemIdx = Math.floor(pseudoRandom(seed, step + 9) * eliteItems.length);
    const chosenItemId = eliteItems[itemIdx % eliteItems.length];
    const iDef = CRIPTA_ITEMS_REGISTRY[chosenItemId];
    return {
      id: generatedId,
      dropId: generatedId,
      kind: 'ITEM',
      type: 'ITEM',
      label: iDef?.name || 'Suministro de Élite',
      itemId: chosenItemId,
      droppedByEnemyName: enemyName,
      xPercent: 45 + (enemyIndex % 3) * 10,
      claimed: false,
      claimedByPlayerId: null,
    };
  }

  // Normal enemy: ~34% drop chance
  if (roll > 0.34) {
    return null;
  }

  const commonPool: CriptaItemId[] = [
    'venda',
    'pocion_curacion',
    'antidoto',
    'tonico_claridad',
    'unguento_igneo',
    'elixir_hierro',
    'frasco_volatil',
    'bomba_humo',
  ];
  const itemIdx = Math.floor(pseudoRandom(seed, step + 11) * commonPool.length);
  const chosenCommonId = commonPool[itemIdx % commonPool.length];
  const commonDef = CRIPTA_ITEMS_REGISTRY[chosenCommonId];
  return {
    id: generatedId,
    dropId: generatedId,
    kind: 'ITEM',
    type: 'ITEM',
    label: commonDef?.name || 'Suministro de Cripta',
    itemId: chosenCommonId,
    droppedByEnemyName: enemyName,
    xPercent: 38 + (enemyIndex % 3) * 14,
    claimed: false,
    claimedByPlayerId: null,
  };
}

/**
 * Authoritative Shop Inventory Generator (Requirements 12, 13, 19):
 * 3 normal consumables on shelves + 1 rare Relic slot on an illuminated pedestal.
 */
export function generateShopInventoryForRoom(
  seed: number,
  roomIndex: number,
  hasDiscountRelic = false,
  preferredClassIds: CriptaCharacterId[] = [],
  excludedRelicIds: CriptaRelicId[] = [],
  excludedWeaponIds: CriptaWeaponId[] = [],
  rerollStep = 0
): CriptaShopSlot[] {
  const stepBase = roomIndex * 131 + rerollStep * 271 + 43;
  const discountMult = hasDiscountRelic ? 0.75 : 1;

  // Slot 1: Healing or Recovery Consumable
  const healPool: CriptaItemId[] = ['venda', 'pocion_curacion', 'pocion_mayor', 'sal_purificadora'];
  const hId =
    healPool[
      (Math.floor(pseudoRandom(seed, stepBase + 1) * healPool.length) + rerollStep) %
        healPool.length
    ];
  const hDef = CRIPTA_ITEMS_REGISTRY[hId];

  // Slot 2: Weapon Rune / Elemental Infusion for sale (Tactical weapon customization)
  const shopWeaponRunePool: Array<{
    id: CriptaWeaponRuneId;
    name: string;
    rarity: string;
    description: string;
    price: number;
  }> = [
    {
      id: 'runa_brasa_infernal',
      name: 'Runa de Brasa Infernal',
      rarity: 'RARA',
      description: 'Infunde FUEGO (+12% Daño Base y aplica Quemadura; −10% Crítico).',
      price: 48,
    },
    {
      id: 'runa_escarcha_permafrost',
      name: 'Runa de Escarcha Eterna',
      rarity: 'RARA',
      description: 'Infunde HIELO (aplica Escarcha y +2 DEFENSA; −12% Daño directo).',
      price: 46,
    },
    {
      id: 'runa_toxina_abisal',
      name: 'Runa de Colmillo Micótico',
      rarity: 'POCO COMÚN',
      description: 'Infunde VENENO / ALQUÍMICO (aplica Veneno y Corrosión en críticos; −16% Daño directo).',
      price: 44,
    },
    {
      id: 'runa_luz_consagrada',
      name: 'Runa del Sol Consagrado',
      rarity: 'RARA',
      description: 'Infunde SAGRADO (+10% Daño y Técnica sana +4 PV al grupo; −8% Crítico y anula Sangrado/Veneno).',
      price: 52,
    },
    {
      id: 'runa_plomo_contundente',
      name: 'Runa de Plomo Quebrantahuesos',
      rarity: 'POCO COMÚN',
      description: 'Convierte en CONTUNDENTE (+3 Perforación de Armadura; −12% Crítico y +1T CD en Técnica).',
      price: 42,
    },
    {
      id: 'runa_aguja_perforante',
      name: 'Runa de Aguja Carmesí',
      rarity: 'RARA',
      description: 'Convierte en PERFORANTE (+16% Crítico y Sangrado; −20% vs blindaje pesado sin crítico).',
      price: 50,
    },
    {
      id: 'runa_resonancia_astral',
      name: 'Runa de Resonancia Astral',
      rarity: 'LEGENDARIA',
      description: 'Infunde ASTRAL (+2 MAGIA y +35% escalado con MAGIA; −2 ATAQUE físico).',
      price: 62,
    },
    {
      id: 'runa_vacio_umbrio',
      name: 'Runa del Vacío Umbrío',
      rarity: 'LEGENDARIA',
      description: 'Infunde SOMBRA (+22% Daño Total y Maldición en críticos; −1 DEFENSA y −3 PV al usar Técnica).',
      price: 64,
    },
  ];
  const rRunePick =
    shopWeaponRunePool[
      (Math.floor(pseudoRandom(seed, stepBase + 2) * shopWeaponRunePool.length) +
        rerollStep * 2) %
        shopWeaponRunePool.length
    ];

  // Slot 3: Class-aware Weapon for sale (drawn from full 19 non-starter weapons)
  const shopWeaponPool: Array<{
    id: CriptaWeaponId;
    name: string;
    rarity: string;
    description: string;
    classes: CriptaCharacterId[];
    price: number;
  }> = [
    {
      id: 'espada_del_sepulcro',
      name: 'Espada del Sepulcro',
      rarity: 'POCO COMÚN',
      description: '6–8 DAÑO (ATQ) · +20% vs No-Muertos · Técnica: Tajo Consagrado.',
      classes: ['caballero'],
      price: 56,
    },
    {
      id: 'espadon_del_rey_hundido',
      name: 'Espadón del Rey Hundido',
      rarity: 'RARA',
      description: '7–10 DAÑO (ATQ) · +2 ATQ · Técnica: Marea del Rey Hundido (2 obj.).',
      classes: ['caballero'],
      price: 78,
    },
    {
      id: 'hacha_forja_infernal',
      name: 'Hacha de la Forja Infernal',
      rarity: 'RARA',
      description: '7–9 DAÑO (ATQ) · Aplica Quemadura · Técnica: Hendidura Ígnea.',
      classes: ['caballero', 'cazador'],
      price: 76,
    },
    {
      id: 'alabarda_del_juramento',
      name: 'Alabarda del Juramento',
      rarity: 'LEGENDARIA',
      description: '8–12 DAÑO (ATQ) · +3 ATQ, +2 DEF · Técnica: Barrido del Bastión (Área + Escudo).',
      classes: ['caballero'],
      price: 96,
    },
    {
      id: 'vara_de_cristal_astral',
      name: 'Vara de Cristal Astral',
      rarity: 'POCO COMÚN',
      description: '5–8 DAÑO (MAG) · +1 MAG, +8% Crítico · Técnica: Rayo Prismático.',
      classes: ['mago', 'clerigo'],
      price: 58,
    },
    {
      id: 'grimorio_prohibido_arma',
      name: 'Códice de las Sombras',
      rarity: 'RARA',
      description: '6–9 DAÑO (MAG) · +2 MAG · Técnica: Tormenta del Vacío (Área).',
      classes: ['mago', 'alquimista'],
      price: 80,
    },
    {
      id: 'cetro_del_eclipse',
      name: 'Cetro del Eclipse Abisal',
      rarity: 'LEGENDARIA',
      description: '8–11 DAÑO (MAG) · +3 MAG, +12% Crítico · Técnica: Supernova del Umbral.',
      classes: ['mago'],
      price: 98,
    },
    {
      id: 'hojas_colmillo_venenoso',
      name: 'Hojas Colmillo Venenoso',
      rarity: 'POCO COMÚN',
      description: '5–7 DAÑO (ATQ) · +12% Crítico, aplica Veneno · Técnica: Doble Colmillo.',
      classes: ['picaro'],
      price: 58,
    },
    {
      id: 'estoque_carmesi',
      name: 'Estoque Carmesí',
      rarity: 'RARA',
      description: '7–10 DAÑO (ATQ) · +2 ATQ, +18% Crítico · Técnica: Estocada Imperial (Perfora DEF).',
      classes: ['picaro'],
      price: 84,
    },
    {
      id: 'guadana_del_verdugo',
      name: 'Guadaña de Sombra Real',
      rarity: 'LEGENDARIA',
      description: '9–12 DAÑO (ATQ) · +3 ATQ, +20% Crítico · Técnica: Cosecha de Sombras.',
      classes: ['picaro', 'cazador'],
      price: 98,
    },
    {
      id: 'arco_de_espinas',
      name: 'Arco de Espinas Vivas',
      rarity: 'POCO COMÚN',
      description: '6–8 DAÑO (ATQ) · Aplica Sangrado · Técnica: Lluvia de Espinas (2 obj.).',
      classes: ['cazador'],
      price: 58,
    },
    {
      id: 'ballesta_de_asedio',
      name: 'Ballesta de Asedio',
      rarity: 'RARA',
      description: '7–10 DAÑO (ATQ) · +2 ATQ · Técnica: Virote Perforante (Ignora 3 DEF).',
      classes: ['cazador', 'picaro'],
      price: 76,
    },
    {
      id: 'canon_de_azufre',
      name: 'Cañón de Azufre Rúnico',
      rarity: 'LEGENDARIA',
      description: '9–13 DAÑO (ATQ) · +3 ATQ, +15% Crítico · Técnica: Andanada de Asedio (Área).',
      classes: ['cazador'],
      price: 96,
    },
    {
      id: 'martillo_del_juicio',
      name: 'Martillo del Juicio Consagrado',
      rarity: 'POCO COMÚN',
      description: '6–8 DAÑO (MAG) · +2 DEF, +25% vs No-Muertos · Técnica: Sentencia de Luz.',
      classes: ['clerigo', 'caballero'],
      price: 62,
    },
    {
      id: 'simbolo_del_alba',
      name: 'Cetro del Alba Sagrada',
      rarity: 'RARA',
      description: '6–8 DAÑO (MAG) · +2 MAG, +25% Curación · Técnica: Luz del Alba (Daño + Cura).',
      classes: ['clerigo'],
      price: 76,
    },
    {
      id: 'relicario_serafin',
      name: 'Relicario del Serafín',
      rarity: 'LEGENDARIA',
      description: '7–10 DAÑO (MAG) · +3 MAG, +35% Curación · Técnica: Milagro del Sol Negro.',
      classes: ['clerigo'],
      price: 95,
    },
    {
      id: 'catalizador_esporas',
      name: 'Catalizador Micótico',
      rarity: 'RARA',
      description: '6–8 DAÑO (MAG) · +2 MAG, +25% Pociones · Técnica: Bomba Micótica (Área).',
      classes: ['alquimista'],
      price: 74,
    },
    {
      id: 'guantelete_mutageno',
      name: 'Inyector de Mutágeno Real',
      rarity: 'LEGENDARIA',
      description: '7–11 DAÑO (MAG) · +3 MAG, +35% Pociones · Técnica: Cataclismo Químico.',
      classes: ['alquimista'],
      price: 94,
    },
    {
      id: 'pico_de_minero_runico',
      name: 'Pico de Minero Rúnico',
      rarity: 'POCO COMÚN',
      description: '6–8 DAÑO (ATQ) · +1 ATQ, +1 DEF · Técnica: Golpe Sísmico (Rompe armadura).',
      classes: ['caballero', 'cazador', 'alquimista'],
      price: 52,
    },
  ];

  const unownedWeaponPool = shopWeaponPool.filter(
    (w) => !excludedWeaponIds.includes(w.id)
  );
  const classMatchedWeapons =
    preferredClassIds.length > 0
      ? unownedWeaponPool.filter((w) =>
          w.classes.some((c) => preferredClassIds.includes(c))
        )
      : [];
  const candidateWeaponPool =
    classMatchedWeapons.length > 0
      ? classMatchedWeapons
      : unownedWeaponPool.length > 0
      ? unownedWeaponPool
      : shopWeaponPool;

  const wPick =
    candidateWeaponPool[
      (Math.floor(pseudoRandom(seed, stepBase + 3) * candidateWeaponPool.length) +
        rerollStep) %
        candidateWeaponPool.length
    ];

  // Slot 4: Armor or Accessory for sale
  const shopGearPool: Array<
    | {
        kind: 'ARMOR';
        armorId: CriptaArmorId;
        name: string;
        rarity: string;
        description: string;
        price: number;
      }
    | {
        kind: 'ACCESSORY';
        accessoryId: CriptaAccessoryId;
        name: string;
        rarity: string;
        description: string;
        price: number;
      }
  > = [
    {
      kind: 'ARMOR',
      armorId: 'cota_de_malla_cripta',
      name: 'Cota de Malla de Cripta',
      rarity: 'POCO COMÚN',
      description: '+2 DEFENSA y +6 VIDA MÁXIMA para resistir emboscadas.',
      price: 48,
    },
    {
      kind: 'ARMOR',
      armorId: 'coraza_del_sepulturero',
      name: 'Coraza del Sepulturero',
      rarity: 'RARA',
      description: '+2 DEFENSA, +8 VIDA MÁXIMA y resistencia a Maldición.',
      price: 66,
    },
    {
      kind: 'ARMOR',
      armorId: 'tunica_del_astrologo',
      name: 'Túnica del Astrólogo',
      rarity: 'RARA',
      description: '+2 MAGIA, +1 DEFENSA y +5 VIDA MÁXIMA.',
      price: 64,
    },
    {
      kind: 'ARMOR',
      armorId: 'armadura_escamas_fungicas',
      name: 'Escamas del Jardín',
      rarity: 'POCO COMÚN',
      description: '+2 DEFENSA, +6 VIDA MÁXIMA y resistencia al Veneno.',
      price: 52,
    },
    {
      kind: 'ARMOR',
      armorId: 'manto_de_sombra_real',
      name: 'Manto de Sombra Real',
      rarity: 'RARA',
      description: '+2 DEFENSA, +7 VIDA MÁXIMA y protección contra Sangrado.',
      price: 68,
    },
    {
      kind: 'ARMOR',
      armorId: 'placas_del_juramento',
      name: 'Placas del Juramento',
      rarity: 'RARA',
      description: '+3 DEFENSA y +10 VIDA MÁXIMA de acero pesado.',
      price: 74,
    },
    {
      kind: 'ACCESSORY',
      accessoryId: 'anillo_del_boticario',
      name: 'Anillo del Boticario',
      rarity: 'POCO COMÚN',
      description: '+1 MAGIA y +20% efectividad de pociones y elixires.',
      price: 44,
    },
    {
      kind: 'ACCESSORY',
      accessoryId: 'colgante_de_cristal',
      name: 'Colgante de Cristal',
      rarity: 'RARA',
      description: '+2 MAGIA para amplificar hechizos y plegarias.',
      price: 56,
    },
    {
      kind: 'ACCESSORY',
      accessoryId: 'sello_del_cazador',
      name: 'Anillo del Acechador',
      rarity: 'RARA',
      description: '+2 ATAQUE y +10% probabilidad de golpe Crítico.',
      price: 56,
    },
    {
      kind: 'ACCESSORY',
      accessoryId: 'amuleto_rompeescudos',
      name: 'Amuleto Rompeescudos',
      rarity: 'RARA',
      description: '+2 ATAQUE y +1 DEFENSA para quebrar corazas.',
      price: 60,
    },
    {
      kind: 'ACCESSORY',
      accessoryId: 'reloj_de_arena_astral',
      name: 'Reloj de Arena Astral',
      rarity: 'RARA',
      description: '+2 MAGIA y +8% Crítico en técnicas arcanas.',
      price: 62,
    },
  ];
  const gPick =
    shopGearPool[
      (Math.floor(pseudoRandom(seed, stepBase + 5) * shopGearPool.length) +
        rerollStep) %
        shopGearPool.length
    ];

  const slot1Id = `shop_${roomIndex}_slot_1_${rerollStep}`;
  const slot2Id = `shop_${roomIndex}_slot_2_${rerollStep}`;
  const slotWeaponId = `shop_${roomIndex}_slot_weapon_${rerollStep}`;
  const slotGearId = `shop_${roomIndex}_slot_gear_${rerollStep}`;
  const slotForgeId = `shop_${roomIndex}_slot_forge_${rerollStep}`;
  const slotRelicId = `shop_${roomIndex}_slot_relic_${rerollStep}`;

  const slots: CriptaShopSlot[] = [
    {
      id: slot1Id,
      slotId: slot1Id,
      kind: 'ITEM',
      itemId: hId,
      name: hDef.name,
      category: 'CONSUMIBLE · CURACIÓN',
      rarity: RARITY_BADGE_COLORS[hDef.rarity]?.label || 'COMÚN',
      description: hDef.description,
      priceGold: Math.max(10, Math.round(hDef.basePrice * discountMult)),
      soldOut: false,
      sold: false,
    },
    {
      id: slot2Id,
      slotId: slot2Id,
      kind: 'WEAPON_RUNE',
      weaponRuneId: rRunePick.id,
      name: rRunePick.name,
      category: 'RUNA DE ARMA · INFUSIÓN',
      rarity: rRunePick.rarity,
      description: rRunePick.description,
      priceGold: Math.max(36, Math.round(rRunePick.price * discountMult)),
      soldOut: false,
      sold: false,
    },
    {
      id: slotWeaponId,
      slotId: slotWeaponId,
      kind: 'WEAPON',
      weaponId: wPick.id,
      name: wPick.name,
      category: `ARMA · ${wPick.classes.map((c) => c.toUpperCase()).join('/')}`,
      rarity: wPick.rarity,
      description: wPick.description,
      priceGold: Math.max(38, Math.round(wPick.price * discountMult)),
      soldOut: false,
      sold: false,
    },
    gPick.kind === 'ARMOR'
      ? {
          id: slotGearId,
          slotId: slotGearId,
          kind: 'ARMOR',
          armorId: gPick.armorId,
          name: gPick.name,
          category: 'ARMADURA PERSONAL',
          rarity: gPick.rarity,
          description: gPick.description,
          priceGold: Math.max(34, Math.round(gPick.price * discountMult)),
          soldOut: false,
          sold: false,
        }
      : {
          id: slotGearId,
          slotId: slotGearId,
          kind: 'ACCESSORY',
          accessoryId: gPick.accessoryId,
          name: gPick.name,
          category: 'ACCESORIO PERSONAL',
          rarity: gPick.rarity,
          description: gPick.description,
          priceGold: Math.max(34, Math.round(gPick.price * discountMult)),
          soldOut: false,
          sold: false,
        },
    {
      id: slotForgeId,
      slotId: slotForgeId,
      kind: 'FORGE_UPGRADE',
      name: 'Yunque del Mercader',
      category: 'MEJORA DE ARMA',
      rarity: 'FORJA',
      description: 'Templa tu arma equipada al siguiente nivel (+Daño base y +Escalado).',
      priceGold: Math.max(30, Math.round(42 * discountMult)),
      soldOut: false,
      sold: false,
    },
  ];

  // Slot 6: Unowned Relic on Pedestal
  const unownedRelics = ALL_CRIPTA_RELIC_IDS.filter(
    (r) => !excludedRelicIds.includes(r)
  );
  const relicPool = unownedRelics.length > 0 ? unownedRelics : ALL_CRIPTA_RELIC_IDS;
  const relicIdx =
    (Math.floor(pseudoRandom(seed, stepBase + 7) * relicPool.length) + rerollStep) %
    relicPool.length;
  const relicId = relicPool[relicIdx];
  const relicDef = CRIPTA_RELICS_REGISTRY[relicId];

  slots.push({
    id: slotRelicId,
    slotId: slotRelicId,
    kind: 'RELIC',
    relicId,
    name: relicDef.name,
    category:
      relicDef.ownershipType === 'PARTY' ? 'RELIQUIA DE GRUPO' : 'RELIQUIA PERSONAL',
    rarity: relicDef.rarity === 'LEGENDARY' ? 'LEGENDARIA' : 'RARA',
    description: relicDef.description,
    priceGold: Math.max(68, Math.round(relicDef.basePrice * discountMult)),
    soldOut: false,
    sold: false,
  });

  return slots;
}

/**
 * Builds the Climactic 2-Phase Final Boss Chamber after 3 doors are completed (Requirements 31–38).
 */
export function buildFinalBossChamber(
  seed: number,
  playerCount: number,
  completedDungeonIds: CriptaDungeonId[] = []
): CriptaDungeonRoom {
  const partyScale = 1 + Math.max(0, playerCount - 1) * 0.42;
  const phase1Hp = Math.round(135 * partyScale);

  const primaryDungeonId = completedDungeonIds?.[2] || 'el_abismo';

  const bossPhase1Base: CriptaRoomEnemy = {
    id: `final_boss_core_${seed}`,
    slug: 'soberano_del_umbral',
    name: 'Malkorath, Soberano Encadenado',
    title: 'FASE I · GUARDIÁN DE LOS TRES SELLOS',
    isElite: true,
    isBoss: true,
    isFinalBoss: true,
    bossPhase: 1,
    hp: phase1Hp,
    maxHp: phase1Hp,
    attack: 16,
    armor: 5,
    intent: 'MALDICIÓN',
    intentCategory: 'MAGIC',
    intentValue: 16,
    accentColor: '#E7A54A',
    statusThreat: 'CURSE',
    statusSecondaryThreat: 'POISON',
    abilityName: 'Cadenas de los Tres Sellos',
    poisonStacks: 0,
    vulnerableTurns: 0,
    spriteArchetype: 'final_boss_phase1',
  };
  const p1Ai = buildEnemyAiProfileForArchetype(bossPhase1Base, 0);
  const bossPhase1: CriptaRoomEnemy = {
    ...bossPhase1Base,
    roleTag: p1Ai.roleTag,
    aiProfile: p1Ai.aiProfile,
    memory: createInitialEnemyMemory(),
    defendingRoundsRemaining: 0,
    protectedByEnemyId: null,
  };

  return {
    id: `room_final_boss_${seed}`,
    index: 0,
    roomNumber: 1,
    dungeonId: primaryDungeonId,
    type: 'BOSS',
    state: 'IN_PROGRESS',
    revealed: true,
    visited: true,
    resolved: false,
    isFinalBossRoom: true,
    title: 'EL CORAZÓN DE LA CRIPTA',
    subtitle: 'SANTUARIO ABISAL FINAL · FASE I',
    narrative:
      'Los tres sellos ancestrales convergen en el altar abisal. Malkorath despierta envuelto en cadenas rúnicas.',
    outcomeLog: null,
    biomeVariant: 0,
    combatTurn: 1,
    combatRoundPhase: 'PLAYER_PHASE',
    combatBannerText: 'RONDA 1 — FASE DE JUGADORES',
    queuedPlayerActions: {},
    activeCombatActorId: null,
    activeTargetedPlayerIds: [],
    activeTurnPlayerId: null,
    actedPlayerIdsThisRound: [],
    enemies: [bossPhase1],
    options: [],
    groundDrops: [],
    readyToAdvancePlayerIds: [],
    optionVotes: {},
  };
}

/**
 * Transforms the Final Boss from Phase 1 into Phase 2 with new mechanics and a summoned shard.
 */
export function transformFinalBossToPhase2(
  room: CriptaDungeonRoom,
  playerCount: number,
  seed: number
): void {
  const partyScale = 1 + Math.max(0, playerCount - 1) * 0.45;
  const phase2Hp = Math.round(165 * partyScale);
  const shardHp = Math.round(42 * partyScale);

  room.subtitle = 'EL CORAZÓN DESATADO · FASE II';
  room.narrative =
    '¡LAS CADENAS SE ROMPEN! El Corazón de la Cripta abre sus alas abisales, invoca una Esquirla del Vacío y desata ataques grupales.';

  const bossPhase2Base: CriptaRoomEnemy = {
    id: `final_boss_core_${seed}`,
    slug: 'corazon_de_la_cripta',
    name: 'El Corazón Desatado de la Cripta',
    title: 'FASE II · AVATAR DEL ECLIPSE ETERNO',
    isElite: true,
    isBoss: true,
    isFinalBoss: true,
    bossPhase: 2,
    hp: phase2Hp,
    maxHp: phase2Hp,
    attack: 20,
    armor: 4,
    intent: 'CATACLISMO',
    intentCategory: 'TELEGRAPH',
    intentValue: 19,
    accentColor: '#C93B5B',
    statusThreat: 'BURN',
    statusSecondaryThreat: 'CONFUSION',
    abilityName: 'Cataclismo del Eclipse (Ataque Grupal)',
    poisonStacks: 0,
    vulnerableTurns: 1,
    spriteArchetype: 'final_boss_phase2',
  };
  const p2Ai = buildEnemyAiProfileForArchetype(bossPhase2Base, 1);
  const bossPhase2: CriptaRoomEnemy = {
    ...bossPhase2Base,
    roleTag: p2Ai.roleTag,
    aiProfile: p2Ai.aiProfile,
    memory: createInitialEnemyMemory(),
    defendingRoundsRemaining: 0,
    protectedByEnemyId: null,
  };

  const voidShardBase: CriptaRoomEnemy = {
    id: `final_boss_shard_${seed}`,
    slug: 'esquirla_del_vacio_chaman',
    name: 'Esquirla del Corazón',
    title: 'CONDUCTO DE ENERGÍA ABISAL',
    isElite: false,
    isBoss: false,
    hp: shardHp,
    maxHp: shardHp,
    attack: 11,
    armor: 1,
    intent: 'AFLICCIÓN',
    intentCategory: 'HEAL',
    intentValue: 11,
    accentColor: '#9B72CF',
    statusThreat: 'POISON',
    abilityName: 'Pulso de Miasma',
    poisonStacks: 0,
    vulnerableTurns: 0,
    spriteArchetype: 'crystal_sentinel',
  };
  const shardAi = buildEnemyAiProfileForArchetype(voidShardBase, 1);
  const voidShard: CriptaRoomEnemy = {
    ...voidShardBase,
    roleTag: shardAi.roleTag,
    aiProfile: shardAi.aiProfile,
    memory: createInitialEnemyMemory(),
    defendingRoundsRemaining: 0,
    protectedByEnemyId: null,
  };

  room.enemies = [bossPhase2, voidShard];
  room.combatRoundPhase = 'PLAYER_PHASE';
  room.queuedPlayerActions = {};
  room.activeCombatActorId = null;
  room.activeTargetedPlayerIds = [];
  room.combatBannerText = `RONDA ${room.combatTurn || 1} — FASE II: EL CORAZÓN DESATADO`;
}
