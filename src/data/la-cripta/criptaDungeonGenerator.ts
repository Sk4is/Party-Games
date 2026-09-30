import {
  CriptaCanonicalRoomType,
  CriptaDungeonId,
  CriptaDungeonLengthTier,
  CriptaDungeonRoom,
  CriptaRoomEnemy,
  CriptaRoomInteractiveOption,
  CriptaRoomNode,
} from '../../types/laCripta';
import { CRIPTA_DUNGEONS_REGISTRY } from './criptaCatalog';
import {
  CRIPTA_STATUS_EFFECTS_REGISTRY,
  DUNGEON_BIOME_THREAT_PROFILES,
} from './criptaStatusEffects';
import { generateShopInventoryForRoom } from './criptaItemsAndRelics';

export interface DungeonGenerationConfig {
  tier: CriptaDungeonLengthTier;
  minRooms: number;
  maxRooms: number;
  spriteArchetype: CriptaRoomEnemy['spriteArchetype'];
  weights: Partial<Record<CriptaCanonicalRoomType, number>>;
}

export const DUNGEON_GENERATION_CONFIGS: Record<CriptaDungeonId, DungeonGenerationConfig> = {
  catacumbas_del_rey: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'skeleton_warrior',
    weights: { COMBAT: 32, LOOT: 14, EVENT: 14, TRAP: 12, SHRINE: 10, TREASURE: 10, ELITE: 12, PUZZLE: 8, SHOP: 8, REST: 10, DECISION: 10 },
  },
  jardin_podrido: {
    tier: 'CORTA',
    minRooms: 5,
    maxRooms: 6,
    spriteArchetype: 'plague_bloom',
    weights: { COMBAT: 30, EVENT: 18, LOOT: 15, TRAP: 14, SHRINE: 12, ELITE: 10, TREASURE: 10, REST: 10, DECISION: 12 },
  },
  forja_infernal: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'iron_golem',
    weights: { COMBAT: 34, ELITE: 16, TRAP: 15, SHOP: 12, TREASURE: 12, LOOT: 10, EVENT: 10, REST: 12, PUZZLE: 8, DECISION: 8 },
  },
  templo_sumergido: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'deep_serpent',
    weights: { COMBAT: 28, PUZZLE: 16, SHRINE: 15, EVENT: 14, TREASURE: 12, LOOT: 12, ELITE: 10, TRAP: 10, REST: 10, DECISION: 12 },
  },
  minas_abandonadas: {
    tier: 'CORTA',
    minRooms: 5,
    maxRooms: 6,
    spriteArchetype: 'mine_stalker',
    weights: { COMBAT: 30, LOOT: 18, TRAP: 16, TREASURE: 14, DECISION: 14, EVENT: 12, SHOP: 10, ELITE: 10, REST: 10 },
  },
  castillo_del_verdugo: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'executioner',
    weights: { COMBAT: 34, ELITE: 16, TRAP: 16, EVENT: 12, TREASURE: 12, LOOT: 10, SHRINE: 8, SHOP: 10, REST: 10, DECISION: 10 },
  },
  bosque_de_los_susurros: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'wisp_phantom',
    weights: { COMBAT: 26, EVENT: 18, DECISION: 18, SHRINE: 14, PUZZLE: 12, LOOT: 12, ELITE: 10, TREASURE: 10, REST: 10 },
  },
  alcantarillas_imperiales: {
    tier: 'CORTA',
    minRooms: 5,
    maxRooms: 6,
    spriteArchetype: 'sewer_abomination',
    weights: { COMBAT: 32, TRAP: 18, LOOT: 16, EVENT: 14, SHOP: 12, ELITE: 10, TREASURE: 10, DECISION: 12, REST: 8 },
  },
  biblioteca_prohibida: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'arcane_archivist',
    weights: { COMBAT: 26, PUZZLE: 20, EVENT: 18, SHRINE: 14, TREASURE: 14, ELITE: 12, SHOP: 10, LOOT: 10, DECISION: 12, REST: 10 },
  },
  torre_del_astrologo: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'astral_weaver',
    weights: { COMBAT: 26, PUZZLE: 18, SHRINE: 16, EVENT: 16, ELITE: 14, TREASURE: 12, DECISION: 12, SHOP: 10, REST: 10, LOOT: 10 },
  },
  la_colmena: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'chitin_drone',
    weights: { COMBAT: 36, ELITE: 16, LOOT: 16, TRAP: 14, DECISION: 12, EVENT: 10, TREASURE: 10, REST: 10 },
  },
  cripta_de_cristal: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'crystal_sentinel',
    weights: { COMBAT: 28, PUZZLE: 16, TREASURE: 16, SHRINE: 14, ELITE: 12, LOOT: 12, EVENT: 12, TRAP: 10, REST: 10 },
  },
  prision_maldita: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'chained_wraith',
    weights: { COMBAT: 32, TRAP: 18, EVENT: 16, ELITE: 14, LOOT: 12, DECISION: 12, TREASURE: 10, REST: 10, SHOP: 8 },
  },
  santuario_de_sangre: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'blood_acolyte',
    weights: { COMBAT: 32, SHRINE: 18, ELITE: 16, EVENT: 14, TRAP: 12, TREASURE: 12, DECISION: 10, REST: 10, LOOT: 10 },
  },
  ciudad_sepultada: {
    tier: 'PROFUNDA',
    minRooms: 12,
    maxRooms: 14,
    spriteArchetype: 'sand_mummy',
    weights: { COMBAT: 30, TREASURE: 16, PUZZLE: 15, TRAP: 15, ELITE: 14, EVENT: 14, SHOP: 12, SHRINE: 12, LOOT: 12, DECISION: 12, REST: 10 },
  },
  palacio_de_los_espejos: {
    tier: 'LARGA',
    minRooms: 10,
    maxRooms: 12,
    spriteArchetype: 'mirror_doppel',
    weights: { COMBAT: 28, PUZZLE: 18, DECISION: 18, EVENT: 16, ELITE: 14, TREASURE: 12, SHRINE: 12, SHOP: 10, REST: 10 },
  },
  cavernas_heladas: {
    tier: 'MEDIA',
    minRooms: 7,
    maxRooms: 9,
    spriteArchetype: 'frost_wolf',
    weights: { COMBAT: 32, TRAP: 16, REST: 14, EVENT: 14, ELITE: 12, LOOT: 12, TREASURE: 12, DECISION: 10, SHRINE: 10 },
  },
  fortaleza_goblin: {
    tier: 'CORTA',
    minRooms: 5,
    maxRooms: 6,
    spriteArchetype: 'goblin_raider',
    weights: { COMBAT: 34, TRAP: 18, LOOT: 16, SHOP: 14, TREASURE: 14, EVENT: 12, ELITE: 12, DECISION: 10, REST: 10 },
  },
  cementerio_de_gigantes: {
    tier: 'PROFUNDA',
    minRooms: 12,
    maxRooms: 14,
    spriteArchetype: 'bone_colossus',
    weights: { COMBAT: 32, ELITE: 18, SHRINE: 14, TREASURE: 14, EVENT: 14, LOOT: 12, DECISION: 12, REST: 12, TRAP: 10, PUZZLE: 10 },
  },
  el_abismo: {
    tier: 'PROFUNDA',
    minRooms: 13,
    maxRooms: 15,
    spriteArchetype: 'void_herald',
    weights: { COMBAT: 34, ELITE: 18, EVENT: 16, PUZZLE: 14, SHRINE: 14, DECISION: 14, TRAP: 12, TREASURE: 12, REST: 12, SHOP: 10 },
  },
};

function createSeededRng(seed: number) {
  let s = (seed >>> 0) || 1337;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function formatSlugTitle(slug: string): string {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const ROOM_TYPE_TITLES: Record<CriptaCanonicalRoomType, string[]> = {
  COMBAT: [
    'Galería de la Guardia Caída',
    'Sala de las Sombras Acechantes',
    'Crucero de Piedra Quebrada',
    'Bóveda de los Centinelas',
  ],
  ELITE: [
    'Trono del Campeón Maldito',
    'Arena de los Juramentos Rotos',
    'Claustro del Verdugo Mayor',
  ],
  TREASURE: [
    'Cámara del Arca Sellada',
    'Relicario del Monarca Antiguo',
    'Bóveda de Oro Sepultado',
  ],
  LOOT: [
    'Restos de una Expedición Anterior',
    'Alijo entre las Losas',
    'Pertrechos Abandonados',
  ],
  EVENT: [
    'Encuentro en la Penumbra',
    'Inscripción del Antiguo Reino',
    'Ecos entre las Columnas',
  ],
  DECISION: [
    'Bifurcación del Destino',
    'Las Dos Sendas del Umbral',
    'Encrucijada Subterránea',
  ],
  SHOP: [
    'Puesto del Mercader Errante',
    'Farol del Buhonero Ciego',
    'Bazar de las Cenizas',
  ],
  REST: [
    'Hoguera de Resguardo',
    'Refugio entre las Ruinas',
    'Brasero Consagrado',
  ],
  SHRINE: [
    'Altar de la Sangre Antigua',
    'Santuario del Cáliz Dormido',
    'Pilar de Bendición Arcana',
  ],
  TRAP: [
    'Corredor de Cuchillas Ocultas',
    'Losas de Presión Mortal',
    'Mecanismo de Agujas y Fuego',
  ],
  PUZZLE: [
    'Cámara de los Tres Sellos',
    'Pedestales del Orden Astral',
    'Enigma de las Runas Antiguas',
  ],
  SECRET: [
    'Sancta Sanctorum Oculto',
    'Cámara Prohibida tras el Muro',
    'Bóveda Secreta de los Arquitectos',
  ],
  BOSS: [
    'Trono del Señor de la Mazmorra',
    'Santuario Final del Abismo',
    'Cámara del Guardián Supremo',
  ],
};

const ROOM_TYPE_SUBTITLES: Record<CriptaCanonicalRoomType, string> = {
  COMBAT: 'COMATE EN LA CÁMARA · DERROTA A LOS GUARDIANES PARA AVANZAR',
  ELITE: 'AMENAZA DE ÉLITE · UN CAMPEÓN LETAL BLOQUEA EL PASO',
  TREASURE: 'CÁMARA DEL TESORO · RECLAMA EL BOTÍN ANCESTRAL',
  LOOT: 'HALLAZGO · RECOGE LOS SUMINISTROS DEL CAMINO',
  EVENT: 'SUCESO MISTERIOSO · DECIDE CÓMO ACTUAR ANTE EL ENCUENTRO',
  DECISION: 'ENCRUCIJADA · ELIGE QUÉ RUTA TOMARÁ LA EXPEDICIÓN',
  SHOP: 'MERCADER · INTERCAMBIA ORO POR PERTRECHOS Y BENDICIONES',
  REST: 'CAMPAMENTO · DESCANSA JUNTO AL FUEGO O REFUERZA EL EQUIPO',
  SHRINE: 'SANTUARIO · OFRECE UN TRIBUTO O RECIBE UNA GRACIA',
  TRAP: 'TRAMPA ACTIVA · DESACTIVA O SUPERA EL MECANISMO',
  PUZZLE: 'ACERTIJO ARCANO · ACTIVA LAS RUNAS EN EL ORDEN CORRECTO',
  SECRET: 'SALA SECRETA DESCUBIERTA · RELIQUIAS OCULTAS DEL REINO',
  BOSS: 'JEFE DE LA MAZMORRA · EL ENFRENTAMIENTO FINAL',
};

function buildEnemiesForRoom(
  dungeonId: CriptaDungeonId,
  roomType: 'COMBAT' | 'ELITE' | 'BOSS',
  roomIndex: number,
  playerCount: number,
  rng: () => number
): CriptaRoomEnemy[] {
  const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
  const config = DUNGEON_GENERATION_CONFIGS[dungeonId];
  const threatProfile =
    DUNGEON_BIOME_THREAT_PROFILES[dungeonId] ||
    DUNGEON_BIOME_THREAT_PROFILES.catacumbas_del_rey;
  const scaleFactor = 1 + (Math.max(1, playerCount) - 1) * 0.42 + roomIndex * 0.1;

  if (roomType === 'BOSS') {
    const bossSlug = dungeon.bossPool[0] || 'guardian_del_abismo';
    const bossMaxHp = Math.round(95 * scaleFactor);
    return [
      {
        id: `enemy_boss_${roomIndex}_0`,
        slug: bossSlug,
        name: formatSlugTitle(bossSlug),
        title: `Señor de ${dungeon.name}`,
        isElite: false,
        isBoss: true,
        hp: bossMaxHp,
        maxHp: bossMaxHp,
        attack: Math.round(14 + roomIndex * 1.2),
        armor: 6,
        intent: 'AFLICCIÓN',
        intentValue: Math.round(15 + roomIndex * 1.2),
        accentColor: dungeon.palette.glow,
        statusThreat: threatProfile.primaryStatus,
        statusSecondaryThreat: threatProfile.secondaryStatus,
        abilityName: threatProfile.bossAbilityLabel,
        spriteArchetype: config.spriteArchetype,
      },
    ];
  }

  if (roomType === 'ELITE') {
    const eliteSlug =
      dungeon.elitePool[Math.floor(rng() * dungeon.elitePool.length)] || 'campeon_maldito';
    const eliteMaxHp = Math.round(62 * scaleFactor);
    return [
      {
        id: `enemy_elite_${roomIndex}_0`,
        slug: eliteSlug,
        name: formatSlugTitle(eliteSlug),
        title: 'Campeón de Élite',
        isElite: true,
        isBoss: false,
        hp: eliteMaxHp,
        maxHp: eliteMaxHp,
        attack: Math.round(11 + roomIndex),
        armor: 4,
        intent: 'AFLICCIÓN',
        intentValue: Math.round(12 + roomIndex),
        accentColor: dungeon.palette.highlight,
        statusThreat: threatProfile.primaryStatus,
        statusSecondaryThreat: threatProfile.secondaryStatus,
        abilityName: threatProfile.enemyAbilityLabel,
        spriteArchetype: config.spriteArchetype,
      },
    ];
  }

  // COMBAT: 1 to 2 enemies in solo, 2 to 3 enemies in multiplayer
  const count = playerCount <= 1 ? (rng() > 0.45 ? 2 : 1) : rng() > 0.55 ? 3 : 2;
  const enemies: CriptaRoomEnemy[] = [];
  for (let i = 0; i < count; i++) {
    const slug =
      dungeon.enemyPool[(roomIndex + i) % Math.max(1, dungeon.enemyPool.length)] ||
      'centinela_de_cripta';
    const baseHp = count === 1 ? 38 : count === 2 ? 26 : 22;
    const maxHp = Math.round(baseHp * scaleFactor);
    const intents: CriptaRoomEnemy['intent'][] = ['ATAQUE', 'AFLICCIÓN', 'GUARDIA', 'MALDICIÓN'];
    const intent = intents[(roomIndex + i) % intents.length];
    const assignedStatus =
      i % 2 === 0 ? threatProfile.primaryStatus : threatProfile.secondaryStatus;
    enemies.push({
      id: `enemy_${roomIndex}_${i}`,
      slug,
      name: formatSlugTitle(slug),
      title: `Guardián de ${dungeon.name}`,
      isElite: false,
      isBoss: false,
      hp: maxHp,
      maxHp,
      attack: Math.round(7 + roomIndex * 0.8),
      armor: 2 + (i % 2),
      intent,
      intentValue: Math.round(7 + roomIndex * 0.8),
      accentColor: dungeon.palette.glow,
      statusThreat: assignedStatus,
      statusSecondaryThreat: threatProfile.secondaryStatus,
      abilityName: threatProfile.enemyAbilityLabel,
      spriteArchetype: config.spriteArchetype,
    });
  }
  return enemies;
}

function buildInteractiveOptionsForRoom(
  dungeonId: CriptaDungeonId,
  roomType: CriptaCanonicalRoomType,
  roomIndex: number,
  rng: () => number
): CriptaRoomInteractiveOption[] {
  const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
  const threatProfile =
    DUNGEON_BIOME_THREAT_PROFILES[dungeonId] ||
    DUNGEON_BIOME_THREAT_PROFILES.catacumbas_del_rey;
  const trapStatusDef = CRIPTA_STATUS_EFFECTS_REGISTRY[threatProfile.trapStatus];
  const treasureName = formatSlugTitle(
    dungeon.treasurePool[roomIndex % Math.max(1, dungeon.treasurePool.length)] || 'reliquia_antigua'
  );
  const eventName = formatSlugTitle(
    dungeon.eventPool[roomIndex % Math.max(1, dungeon.eventPool.length)] || 'altar_olvidado'
  );
  const shopName = formatSlugTitle(
    dungeon.shopPool[0] || 'mercader_errante'
  );

  switch (roomType) {
    case 'TREASURE':
      return [
        {
          id: `opt_${roomIndex}_open_chest`,
          label: `ABRIR ARCA: ${treasureName.toUpperCase()}`,
          subtitle: 'Cofre reliquia custodiado en el pedestal central',
          effectText: `+45 ORO · +1 ATAQUE · +3 ARMADURA · +12 VIDA Y RELIQUIA (${treasureName})`,
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_purify_relic`,
          label: 'CANALIZAR ESENCIA DE LA RELIQUIA',
          subtitle: 'Extraer su luz restauradora y poder arcano para el grupo',
          effectText: '+20 ORO · +1 MAGIA · CURA +24 VIDA · PURIFICA Y OTORGA BENDECIDO (3T)',
          iconKey: 'chalice',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'LOOT':
      return [
        {
          id: `opt_${roomIndex}_loot_pouch`,
          label: 'RECOGER PERTRECHOS Y ANTÍDOTOS',
          subtitle: 'Bolsa de cuero y viales intactos entre las losas',
          effectText: '+28 ORO DEL GRUPO · RESTAURA +10 VIDA Y LIMPIA 1 AFLICCIÓN',
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_loot_armor`,
          label: 'REFORZAR GUARDIA Y ARMAS ANTIGUAS',
          subtitle: 'Aprovechar hojas templadas y placas de armadura',
          effectText: '+1 ATAQUE · +2 ARMADURA · OTORGA ESCUDO (3 TURNOS) Y +15 ORO',
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'REST':
      return [
        {
          id: `opt_${roomIndex}_rest_heal`,
          label: 'DESCANSAR JUNTO A LA HOGUERA DE ALMAS',
          subtitle: 'El fuego cálido disipa las aflicciones y reanima a los caídos',
          effectText: 'REVIVE ALIADOS CAÍDOS (50% PV) · CURA +35% VIDA Y PURIFICA ESTADOS',
          isReviveOption: true,
          iconKey: 'flame',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_rest_sharpen`,
          label: 'TEMPLAR ARMAS Y CORAZAS EN LAS BRASAS',
          subtitle: 'Preparación marcial antes de las cámaras profundas',
          effectText: '+1 ATAQUE · +3 ARMADURA · +15 VIDA Y OTORGA REGENERACIÓN (3T)',
          iconKey: 'sword',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'SHRINE':
      return [
        {
          id: `opt_${roomIndex}_shrine_blessing`,
          label: 'PLEGARIA DE RESURRECCIÓN Y GRACIA',
          subtitle: 'Invocar la luz del santuario sobre vivos y caídos',
          effectText: 'REVIVE CAÍDOS (60% PV) · +1 MAGIA · +22 VIDA, PURIFICA Y OTORGA BENDECIDO',
          isReviveOption: true,
          iconKey: 'chalice',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_shrine_pact`,
          label: 'PACTO DE SANGRE Y PODER',
          subtitle: 'Ofrecer vitalidad a cambio de riquezas y furia marcial',
          effectText: '-8 VIDA (SANGRADO 2T) · +55 ORO · +2 ATAQUE Y +4 ARMADURA',
          iconKey: 'eye',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'SHOP':
      return [
        {
          id: `opt_${roomIndex}_shop_elixir`,
          label: 'ELIXIR PURIFICADOR DE SANGRE SOLAR',
          subtitle: `Vendido por ${shopName}`,
          effectText: 'CURA +30 VIDA · PURIFICA TODAS LAS AFLICCIONES Y OTORGA REGENERACIÓN',
          costGold: 25,
          iconKey: 'potion',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_shop_revive`,
          label: 'CENIZA DEL FÉNIX SEPULCRAL',
          subtitle: 'Reliquia de resurrección y amparo sagrado',
          effectText: 'REVIVE A TODOS LOS ALIADOS CAÍDOS (60% PV) Y OTORGA ESCUDO AL GRUPO',
          costGold: 20,
          isReviveOption: true,
          iconKey: 'flame',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_shop_plate`,
          label: 'SELLOS DE HIERRO Y FILO FORJADO',
          subtitle: 'Refuerzo de armas y coraza para toda la expedición',
          effectText: '+1 ATAQUE · +4 ARMADURA Y ESTADO ESCUDO (3T) PARA TODO EL GRUPO',
          costGold: 30,
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_shop_relic`,
          label: `RELIQUIA: ${treasureName.toUpperCase()}`,
          subtitle: 'Artefacto mayor de las profundidades',
          effectText: '+18 VIDA MÁX · +1 MAGIA · +1 ATAQUE Y ESTADO BENDECIDO (3T)',
          costGold: 45,
          iconKey: 'chalice',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'TRAP':
      return [
        {
          id: `opt_${roomIndex}_trap_disarm`,
          label: 'DESACTIVAR ENGRANAJES CON PRECISIÓN',
          subtitle: 'Bloquear los contrapesos y recuperar piezas valiosas',
          effectText: 'EVITA LA TRAMPA · +20 ORO DEL GRUPO',
          iconKey: 'key',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_trap_shield_rush`,
          label: 'CRUZAR TRAS LOS ESCUDOS ALZADOS',
          subtitle: `Avance rápido resistiendo el mecanismo de ${dungeon.name}`,
          effectText: `-6 VIDA Y APLICA ${trapStatusDef.name} (${trapStatusDef.defaultTurns}T) · +2 ARMADURA Y PASO DESPEJADO`,
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'EVENT':
      return [
        {
          id: `opt_${roomIndex}_event_inspect`,
          label: `INVESTIGAR ${eventName.toUpperCase()}`,
          subtitle: 'Examinar de cerca el hallazgo con cautela arcana',
          effectText: '+30 ORO · +1 MAGIA · +12 VIDA Y OTORGA BENDECIDO (3 TURNOS)',
          iconKey: 'eye',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_event_respect`,
          label: 'ENCENDER UN CIRIO POR LOS CAÍDOS',
          subtitle: 'Honrar la memoria de quienes cayeron en esta cámara',
          effectText: 'REVIVE ALIADOS CAÍDOS (45% PV) · +20 VIDA, +2 ARMADURA Y PURIFICA',
          isReviveOption: true,
          iconKey: 'flame',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'DECISION':
      return [
        {
          id: `opt_${roomIndex}_path_left`,
          label: 'SENDA DE LA ANTORCHA ÁUREA',
          subtitle: 'Galería iluminada con antiguos braseros y cofres',
          effectText: '+30 ORO · +1 ATAQUE · +10 VIDA Y OTORGA REGENERACIÓN (3 TURNOS)',
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_path_right`,
          label: 'BÓVEDA DEL BALUARTE DE PIEDRA',
          subtitle: 'Pasaje fortificado con estandartes y armería intacta',
          effectText: '+3 ARMADURA · +1 MAGIA · +15 VIDA Y OTORGA ESCUDO (3 TURNOS)',
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'SECRET':
      return [
        {
          id: `opt_${roomIndex}_secret_hoard`,
          label: `RECLAMAR TESORO PROHIBIDO DE ${dungeon.name}`,
          subtitle: 'Cámara oculta intacta durante siglos',
          effectText: 'REVIVE CAÍDOS · +75 ORO · +2 ATAQUE · +1 MAGIA · +4 ARMADURA · +25 VIDA',
          isReviveOption: true,
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    default:
      return [];
  }
}

export interface GeneratedProceduralDungeon {
  dungeonId: CriptaDungeonId;
  seed: number;
  tier: CriptaDungeonLengthTier;
  rooms: CriptaDungeonRoom[];
  secretRoom: CriptaDungeonRoom;
  legacyNodes: CriptaRoomNode[];
}

export function generateProceduralDungeon(
  dungeonId: CriptaDungeonId,
  seed: number,
  playerCount = 1,
  hasDiscountRelic = false
): GeneratedProceduralDungeon {
  const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
  const config = DUNGEON_GENERATION_CONFIGS[dungeonId] || DUNGEON_GENERATION_CONFIGS.catacumbas_del_rey;
  const rng = createSeededRng(seed);

  const totalRooms =
    config.minRooms + Math.floor(rng() * (config.maxRooms - config.minRooms + 1));

  const roomTypes: CriptaCanonicalRoomType[] = [];

  for (let i = 0; i < totalRooms; i++) {
    if (i === totalRooms - 1) {
      roomTypes.push('BOSS');
      continue;
    }

    const prev1 = i >= 1 ? roomTypes[i - 1] : null;
    const prev2 = i >= 2 ? roomTypes[i - 2] : null;

    // Pre-boss room (N - 1): always a preparation room (REST, SHRINE, or SHOP)
    if (i === totalRooms - 2) {
      const prepCandidates: CriptaCanonicalRoomType[] = ['REST', 'SHRINE', 'SHOP'].filter(
        (t) => t !== prev1
      ) as CriptaCanonicalRoomType[];
      const chosenPrep = prepCandidates[Math.floor(rng() * prepCandidates.length)] || 'REST';
      roomTypes.push(chosenPrep);
      continue;
    }

    // Room 1 (Entry room): COMBAT, EVENT, LOOT, or DECISION
    if (i === 0) {
      const entryPool: { type: CriptaCanonicalRoomType; weight: number }[] = [
        { type: 'COMBAT', weight: 48 },
        { type: 'EVENT', weight: 20 },
        { type: 'LOOT', weight: 16 },
        { type: 'DECISION', weight: 16 },
      ];
      const totalW = entryPool.reduce((acc, item) => acc + item.weight, 0);
      let roll = rng() * totalW;
      let picked: CriptaCanonicalRoomType = 'COMBAT';
      for (const item of entryPool) {
        roll -= item.weight;
        if (roll <= 0) {
          picked = item.type;
          break;
        }
      }
      roomTypes.push(picked);
      continue;
    }

    // Determine candidate pool for early vs mid rooms
    const isEarly = i < Math.ceil(totalRooms * 0.36);
    const allowedTypes: CriptaCanonicalRoomType[] = isEarly
      ? ['COMBAT', 'LOOT', 'EVENT', 'TRAP', 'DECISION']
      : [
          'COMBAT',
          'ELITE',
          'TREASURE',
          'LOOT',
          'EVENT',
          'DECISION',
          'SHOP',
          'REST',
          'SHRINE',
          'TRAP',
          'PUZZLE',
        ];

    // Enforce anti-repetition rules
    const filtered = allowedTypes.filter((candidate) => {
      // Never 2 SHOP or 2 REST or 2 PUZZLE or 2 ELITE back-to-back
      if (
        (candidate === 'SHOP' ||
          candidate === 'REST' ||
          candidate === 'PUZZLE' ||
          candidate === 'ELITE' ||
          candidate === 'SHRINE') &&
        prev1 === candidate
      ) {
        return false;
      }
      // Never more than 2 COMBAT in a row
      if (candidate === 'COMBAT' && prev1 === 'COMBAT' && prev2 === 'COMBAT') {
        return false;
      }
      // At least 1 non-combat room in any 3-room window (COMBAT or ELITE)
      const prev1Combat = prev1 === 'COMBAT' || prev1 === 'ELITE';
      const prev2Combat = prev2 === 'COMBAT' || prev2 === 'ELITE';
      if ((candidate === 'COMBAT' || candidate === 'ELITE') && prev1Combat && prev2Combat) {
        return false;
      }
      return true;
    });

    const weightedPool = filtered.map((t) => ({
      type: t,
      weight: config.weights[t] ?? 10,
    }));
    const sumWeights = weightedPool.reduce((acc, item) => acc + item.weight, 0);
    let r = rng() * sumWeights;
    let selected: CriptaCanonicalRoomType = weightedPool[0]?.type || 'EVENT';
    for (const item of weightedPool) {
      r -= item.weight;
      if (r <= 0) {
        selected = item.type;
        break;
      }
    }
    roomTypes.push(selected);
  }

  // Pick one mid-dungeon room to host a subtle secret room trigger
  const secretHostIndex = Math.max(1, Math.min(totalRooms - 2, Math.floor(totalRooms * 0.5)));

  const rooms: CriptaDungeonRoom[] = roomTypes.map((rType, idx) => {
    const isFirst = idx === 0;
    const poolSlug =
      dungeon.roomPool[idx % Math.max(1, dungeon.roomPool.length)] || 'camara_antigua';
    const fallbackTitles = ROOM_TYPE_TITLES[rType];
    const specificTitle =
      idx < dungeon.roomPool.length
        ? formatSlugTitle(poolSlug)
        : fallbackTitles[idx % fallbackTitles.length];

    const isCombatLike = rType === 'COMBAT' || rType === 'ELITE' || rType === 'BOSS';
    const enemies = isCombatLike
      ? buildEnemiesForRoom(dungeonId, rType, idx, playerCount, rng)
      : [];
    const options =
      !isCombatLike && rType !== 'PUZZLE' && rType !== 'SHOP'
        ? buildInteractiveOptionsForRoom(dungeonId, rType, idx, rng)
        : [];
    const shopInventory =
      rType === 'SHOP'
        ? generateShopInventoryForRoom(seed, idx, hasDiscountRelic)
        : undefined;

    // 3-rune sequence for PUZZLE rooms
    const puzzleRunes =
      rType === 'PUZZLE'
        ? {
            sequence: [0, 1, 2],
            currentInput: [],
            solved: false,
          }
        : undefined;

    return {
      id: `room_${dungeonId}_${idx + 1}`,
      index: idx,
      roomNumber: idx + 1,
      dungeonId,
      type: rType,
      state: isFirst ? 'IN_PROGRESS' : 'LOCKED',
      revealed: isFirst,
      visited: isFirst,
      resolved: false,
      title: rType === 'BOSS' ? `Trono de ${formatSlugTitle(dungeon.bossPool[0] || 'Guardián')}` : specificTitle,
      subtitle: ROOM_TYPE_SUBTITLES[rType],
      narrative:
        idx === 0
          ? `Habéis cruzado el umbral de ${dungeon.name}. ${dungeon.description}`
          : rType === 'BOSS'
          ? `La cámara final de ${dungeon.name} tiembla ante la presencia de su guardián supremo.`
          : `Sala ${idx + 1} de ${dungeon.name} (${dungeon.environmentModifiers.join(' · ')}).`,
      outcomeLog: null,
      biomeVariant: idx % 4,
      enemies,
      options,
      groundDrops: [],
      shopInventory,
      puzzleRunes,
      secretHook:
        idx === secretHostIndex
          ? {
              discovered: false,
              hint: 'Una grieta rúnica brilla débilmente en el muro del fondo...',
            }
          : undefined,
      readyToAdvancePlayerIds: [],
      optionVotes: {},
    };
  });

  const secretRoom: CriptaDungeonRoom = {
    id: `room_${dungeonId}_secret`,
    index: -1,
    roomNumber: secretHostIndex + 1,
    dungeonId,
    type: 'SECRET',
    state: 'AVAILABLE',
    revealed: true,
    visited: false,
    resolved: false,
    title: `Sancta Sanctorum de ${dungeon.name}`,
    subtitle: ROOM_TYPE_SUBTITLES.SECRET,
    narrative:
      'Tras el muro agrietado se abre una bóveda intacta iluminada por cristales antiguos y cofres sellados.',
    outcomeLog: null,
    biomeVariant: 3,
    enemies: [],
    options: buildInteractiveOptionsForRoom(dungeonId, 'SECRET', 99, rng),
    readyToAdvancePlayerIds: [],
    optionVotes: {},
  };

  const legacyNodes: CriptaRoomNode[] = rooms.map((rm, idx) => ({
    id: rm.id,
    type: rm.type,
    floor: 1,
    depth: idx,
    title: rm.title,
    connections: idx + 1 < rooms.length ? [rooms[idx + 1].id] : [],
    contentId: rm.id,
    revealed: rm.revealed,
    visited: rm.visited,
    resolved: rm.resolved,
  }));

  return {
    dungeonId,
    seed,
    tier: config.tier,
    rooms,
    secretRoom,
    legacyNodes,
  };
}
