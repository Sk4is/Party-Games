import {
  CriptaAcquiredRelic,
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
} from '../../types/laCripta';

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

  if (isBoss) {
    const relicId = pickUnownedRelic(seed, step + 3, players, partyRelics);
    return {
      id: `drop_${roomIndex}_${enemyIndex}_${seed}`,
      kind: 'RELIC',
      relicId,
      droppedByEnemyName: enemyName,
      xPercent: 52,
      claimedByPlayerId: null,
    };
  }

  if (isElite) {
    if (roll < 0.42) {
      const relicId = pickUnownedRelic(seed, step + 5, players, partyRelics);
      return {
        id: `drop_${roomIndex}_${enemyIndex}_${seed}`,
        kind: 'RELIC',
        relicId,
        droppedByEnemyName: enemyName,
        xPercent: 48,
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
    return {
      id: `drop_${roomIndex}_${enemyIndex}_${seed}`,
      kind: 'ITEM',
      itemId: eliteItems[itemIdx % eliteItems.length],
      droppedByEnemyName: enemyName,
      xPercent: 45 + (enemyIndex % 3) * 10,
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
  return {
    id: `drop_${roomIndex}_${enemyIndex}_${seed}`,
    kind: 'ITEM',
    itemId: commonPool[itemIdx % commonPool.length],
    droppedByEnemyName: enemyName,
    xPercent: 38 + (enemyIndex % 3) * 14,
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
  hasDiscountRelic = false
): CriptaShopSlot[] {
  const stepBase = roomIndex * 131 + 43;
  const discountMult = hasDiscountRelic ? 0.75 : 1;

  // Slot 1: Healing (Venda or Poción de Curación)
  const healPool: CriptaItemId[] = ['venda', 'pocion_curacion', 'pocion_mayor'];
  const hId = healPool[Math.floor(pseudoRandom(seed, stepBase + 1) * healPool.length)];
  const hDef = CRIPTA_ITEMS_REGISTRY[hId];

  // Slot 2: Cleanse (Antídoto, Tónico, Ungüento, Sal)
  const cleansePool: CriptaItemId[] = [
    'antidoto',
    'tonico_claridad',
    'unguento_igneo',
    'sal_purificadora',
  ];
  const cId = cleansePool[Math.floor(pseudoRandom(seed, stepBase + 2) * cleansePool.length)];
  const cDef = CRIPTA_ITEMS_REGISTRY[cId];

  // Slot 3: Elixir / Utility / Offensive
  const utilPool: CriptaItemId[] = [
    'elixir_fuerza',
    'elixir_hierro',
    'elixir_arcano',
    'bomba_humo',
    'frasco_volatil',
  ];
  const uId = utilPool[Math.floor(pseudoRandom(seed, stepBase + 3) * utilPool.length)];
  const uDef = CRIPTA_ITEMS_REGISTRY[uId];

  const slots: CriptaShopSlot[] = [
    {
      id: `shop_${roomIndex}_slot_1`,
      kind: 'ITEM',
      itemId: hId,
      priceGold: Math.max(10, Math.round(hDef.basePrice * discountMult)),
      soldOut: false,
    },
    {
      id: `shop_${roomIndex}_slot_2`,
      kind: 'ITEM',
      itemId: cId,
      priceGold: Math.max(12, Math.round(cDef.basePrice * discountMult)),
      soldOut: false,
    },
    {
      id: `shop_${roomIndex}_slot_3`,
      kind: 'ITEM',
      itemId: uId,
      priceGold: Math.max(16, Math.round(uDef.basePrice * discountMult)),
      soldOut: false,
    },
  ];

  // Slot 4: Expensive Relic Pedestal (Requirement 19)
  const relicIdx = Math.floor(
    pseudoRandom(seed, stepBase + 7) * ALL_CRIPTA_RELIC_IDS.length
  );
  const relicId = ALL_CRIPTA_RELIC_IDS[relicIdx % ALL_CRIPTA_RELIC_IDS.length];
  const relicDef = CRIPTA_RELICS_REGISTRY[relicId];

  slots.push({
    id: `shop_${roomIndex}_slot_relic`,
    kind: 'RELIC',
    relicId,
    priceGold: Math.max(75, Math.round(relicDef.basePrice * discountMult)),
    soldOut: false,
  });

  return slots;
}

/**
 * Builds the Climactic 2-Phase Final Boss Chamber after 3 doors are completed (Requirements 31–38).
 */
export function buildFinalBossChamber(
  seed: number,
  playerCount: number,
  completedDungeonIds: CriptaDungeonId[]
): CriptaDungeonRoom {
  const partyScale = 1 + Math.max(0, playerCount - 1) * 0.42;
  const phase1Hp = Math.round(135 * partyScale);

  const primaryDungeonId = completedDungeonIds[2] || 'el_abismo';

  const bossPhase1: CriptaRoomEnemy = {
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
    intentValue: 16,
    accentColor: '#E7A54A',
    statusThreat: 'CURSE',
    statusSecondaryThreat: 'POISON',
    abilityName: 'Cadenas de los Tres Sellos',
    poisonStacks: 0,
    vulnerableTurns: 0,
    spriteArchetype: 'final_boss_phase1',
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

  const bossPhase2: CriptaRoomEnemy = {
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
    intentValue: 19,
    accentColor: '#C93B5B',
    statusThreat: 'BURN',
    statusSecondaryThreat: 'CONFUSION',
    abilityName: 'Cataclismo del Eclipse (Ataque Grupal)',
    poisonStacks: 0,
    vulnerableTurns: 1,
    spriteArchetype: 'final_boss_phase2',
  };

  const voidShard: CriptaRoomEnemy = {
    id: `final_boss_shard_${seed}`,
    slug: 'esquirla_del_vacio',
    name: 'Esquirla del Corazón',
    title: 'CONDUCTO DE ENERGÍA ABISAL',
    isElite: false,
    isBoss: false,
    hp: shardHp,
    maxHp: shardHp,
    attack: 11,
    armor: 1,
    intent: 'AFLICCIÓN',
    intentValue: 11,
    accentColor: '#9B72CF',
    statusThreat: 'POISON',
    abilityName: 'Pulso de Miasma',
    poisonStacks: 0,
    vulnerableTurns: 0,
    spriteArchetype: 'crystal_sentinel',
  };

  room.enemies = [bossPhase2, voidShard];
}
