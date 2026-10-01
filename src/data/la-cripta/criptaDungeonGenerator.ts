import type {
  CriptaCanonicalRoomType,
  CriptaCharacterId,
  CriptaDungeonId,
  CriptaDungeonLengthTier,
  CriptaDungeonRoom,
  CriptaMinigameFamilyId,
  CriptaRelicId,
  CriptaRoomEnemy,
  CriptaRoomInteractiveOption,
  CriptaRoomMinigameState,
  CriptaRoomNode,
  CriptaWeaponId,
} from '../../types/laCripta';
import { CRIPTA_DUNGEONS_REGISTRY } from './criptaCatalog';
import {
  createAuthoritativeMinigameState,
  pickNextMinigameFamily,
} from './criptaMinigames';
import {
  buildEnemyAiProfileForArchetype,
  createInitialEnemyMemory,
} from './criptaEnemyAiEngine';
import {
  CRIPTA_STATUS_EFFECTS_REGISTRY,
  DUNGEON_BIOME_THREAT_PROFILES,
} from './criptaStatusEffects';
import { generateShopInventoryForRoom } from './criptaItemsAndRelics';
import {
  buildRoomEncounterSubjectAndObjects,
  computeEnemyApproxDamageRange,
  pickMysteriousEventBlueprint,
  pickWeaponDropForDungeon,
} from './criptaEquipmentAndEvents';
import {
  CRIPTA_MINIBOSS_ARENAS_REGISTRY,
  getBiomeBestiaryEntries,
  resolveEnemyVisualBlueprint,
} from './criptaBiomeBestiary';

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

export interface DungeonMinibossBlueprint {
  slug: string;
  name: string;
  title: string;
  signatureMoveName: string;
  enrageBannerText: string;
}

export const DUNGEON_MINIBOSS_REGISTRY: Record<CriptaDungeonId, DungeonMinibossBlueprint> = {
  catacumbas_del_rey: {
    slug: 'comandante_del_sepulcro',
    name: 'Comandante del Sepulcro',
    title: 'MINIBOSS · GUARDIÁN DE LA PUERTA REAL',
    signatureMoveName: 'Mandato de la Guardia Sepulcral',
    enrageBannerText: '¡EL COMANDANTE DEL SEPULCRO ALZA SU ESTANDARTE REAL (FURIA SEPULCRAL)!',
  },
  jardin_podrido: {
    slug: 'reina_fungica_menor',
    name: 'Reina Fúngica Menor',
    title: 'MINIBOSS · MATRIARCA DEL MICELIO',
    signatureMoveName: 'Marea de Esporas Reales',
    enrageBannerText: '¡LA REINA FÚNGICA MENOR LIBERA UNA NUBE DE ESPORAS LETALES!',
  },
  forja_infernal: {
    slug: 'forjador_maldito',
    name: 'Forjador Maldito',
    title: 'MINIBOSS · MAESTRO DEL YUNQUE ABISAL',
    signatureMoveName: 'Martillo de Escoria Fundida',
    enrageBannerText: '¡EL FORJADOR MALDITO AVIVA SU CORAZA AL ROJO VIVO!',
  },
  templo_sumergido: {
    slug: 'leviatán_del_altar',
    name: 'Sacerdote del Abismo Salobre',
    title: 'MINIBOSS · GUARDIÁN DE LA MAREA PROFUNDA',
    signatureMoveName: 'Torrente de las Profundidades',
    enrageBannerText: '¡LAS AGUAS DEL TEMPLO SUMERGIDO RUGEN CON FURIA ABISAL!',
  },
  minas_abandonadas: {
    slug: 'capataz_de_la_veta',
    name: 'Capataz de la Veta Negra',
    title: 'MINIBOSS · SEÑOR DEL DERRUMBE',
    signatureMoveName: 'Colapso de Galería',
    enrageBannerText: '¡EL CAPATAZ DE LA VETA HACE TEMBLAR LOS PILARES DE LA MINA!',
  },
  castillo_del_verdugo: {
    slug: 'gran_inquisidor_del_cadalso',
    name: 'Gran Verdugo del Cadalso',
    title: 'MINIBOSS · JUEZ DE HIERRO SANGRIENTO',
    signatureMoveName: 'Sentencia de la Guillotina',
    enrageBannerText: '¡EL GRAN VERDUGO AFILA SU HACHA DE EJECUCIÓN!',
  },
  bosque_de_los_susurros: {
    slug: 'ciervo_de_las_almas',
    name: 'Acechador de las Ramas Pálidas',
    title: 'MINIBOSS · ESPÍRITU MAYOR DEL BOSQUE',
    signatureMoveName: 'Coro de Susurros Malditos',
    enrageBannerText: '¡LAS VOCES DEL BOSQUE ENVUELVEN AL GUARDIÁN EN SOMBRAS!',
  },
  alcantarillas_imperiales: {
    slug: 'rey_de_la_cloaca',
    name: 'Amalgama de la Cloaca Imperial',
    title: 'MINIBOSS · DEVORADOR DE DESECHOS',
    signatureMoveName: 'Ola de Miasma Corrosivo',
    enrageBannerText: '¡LA AMALGAMA IMPERIAL REGURGITA LODO TÓXICO HIRVIENTE!',
  },
  biblioteca_prohibida: {
    slug: 'archivista_encadenado',
    name: 'Archivista Encadenado',
    title: 'MINIBOSS · CUSTODIO DE LOS TOMOS PROHIBIDOS',
    signatureMoveName: 'Decreto del Silencio Arcano',
    enrageBannerText: '¡EL ARCHIVISTA ENCADENADO ROMPE LOS SELLOS DEL GRIMORIO PROHIBIDO!',
  },
  torre_del_astrologo: {
    slug: 'oraculo_del_eclipse',
    name: 'Oráculo del Eclipse Eterno',
    title: 'MINIBOSS · VIGÍA DEL FIRMAMENTO ROTO',
    signatureMoveName: 'Alineación de Estrellas Muertas',
    enrageBannerText: '¡EL ORÁCULO DEL ECLIPSE CONVOCA EL FUEGO DEL COSMOS!',
  },
  la_colmena: {
    slug: 'pretor_de_quitina',
    name: 'Pretor de Quitina Real',
    title: 'MINIBOSS · GUARDIÁN DE LA CÁMARA DE CRÍA',
    signatureMoveName: 'Frenesí del Enjambre Real',
    enrageBannerText: '¡EL PRETOR DE QUITINA ENDURECE SU CAPARAZÓN Y ENTRA EN FRENESÍ!',
  },
  cripta_de_cristal: {
    slug: 'arconte_prismatico',
    name: 'Arconte del Prisma Roto',
    title: 'MINIBOSS · CENTINELA DE CUARZO ASTRAL',
    signatureMoveName: 'Haz de Refracción Letal',
    enrageBannerText: '¡EL ARCONTE PRISMÁTICO SOBRECARGA SU NÚCLEO DE CRISTAL!',
  },
  prision_maldita: {
    slug: 'alcaide_de_las_cadenas',
    name: 'Alcaide de las Cadenas Eternas',
    title: 'MINIBOSS · CARCELERO DE ALMAS',
    signatureMoveName: 'Grilletes de Condenación',
    enrageBannerText: '¡EL ALCAIDE ARRASTRA LAS CADENAS DEL PENAL CON FURIA ESPECTRAL!',
  },
  santuario_de_sangre: {
    slug: 'cardenal_carmesi',
    name: 'Cardenal del Cáliz Carmesí',
    title: 'MINIBOSS · SUMO OFICIANTE DE SANGRE',
    signatureMoveName: 'Liturgia de Desangramiento',
    enrageBannerText: '¡EL CARDENAL CARMESÍ BEBE DEL CÁLIZ Y DESATA SU RITO FINAL!',
  },
  ciudad_sepultada: {
    slug: 'faraon_de_ceniza',
    name: 'Visir de la Arena Sepultada',
    title: 'MINIBOSS · SEÑOR DEL OBELISCO ENTERRADO',
    signatureMoveName: 'Tormenta del Sarcófago Dorado',
    enrageBannerText: '¡EL VISIR DE CENIZA INVOCA LA MALDICIÓN DE LA DINASTÍA MUERTA!',
  },
  palacio_de_los_espejos: {
    slug: 'regente_del_reflejo',
    name: 'Regente de los Mil Espejos',
    title: 'MINIBOSS · ILUSIONISTA DE LA CORTE DE AZOGUE',
    signatureMoveName: 'Danza de Cristales Quebrados',
    enrageBannerText: '¡EL REGENTE FRACTURA LOS ESPEJOS DE LA SALA EN MIL FILOS!',
  },
  cavernas_heladas: {
    slug: 'alfa_de_la_escarcha',
    name: 'Patriarca del Colmillo Blanco',
    title: 'MINIBOSS · BESTIA ANCESTRAL DEL GLACIAR',
    signatureMoveName: 'Ventisca de Colmillo Helado',
    enrageBannerText: '¡EL PATRIARCA DEL GLACIAR DESATA UNA VENTISCA CONGELANTE!',
  },
  fortaleza_goblin: {
    slug: 'caudillo_rompehuesos',
    name: 'Caudillo Rompehuesos',
    title: 'MINIBOSS · TIRANO DEL BASTIÓN CHATARRA',
    signatureMoveName: 'Bombardeo de Pólvora Negra',
    enrageBannerText: '¡EL CAUDILLO ROMPEHUESOS ENCIENDE SUS BARRILES DE GUERRA!',
  },
  cementerio_de_gigantes: {
    slug: 'titan_de_osario',
    name: 'Coloso del Osario Antiguo',
    title: 'MINIBOSS · GUARDIÁN DE LOS CRÁNEOS TITÁNICOS',
    signatureMoveName: 'Pisotón de Fémur Colosal',
    enrageBannerText: '¡EL COLOSO DEL OSARIO RECOMPONE SUS HUESOS CON IRA ANCESTRAL!',
  },
  el_abismo: {
    slug: 'heraldo_del_velo',
    name: 'Heraldo del Velo',
    title: 'MINIBOSS · EMISARIO DEL VACÍO PROFUNDO',
    signatureMoveName: 'Ruptura del Velo Abisal',
    enrageBannerText: '¡EL HERALDO DEL VELO RASGA LA REALIDAD CON ENERGÍA DEL VACÍO!',
  },
};

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
  MINIGAME: [
    'Cámara de Pruebas del Eclipse',
    'Mecanismo de los Arquitectos',
    'Santuario del Acertijo Viviente',
    'Rueda y Sellos del Umbral',
  ],
  SECRET: [
    'Sancta Sanctorum Oculto',
    'Cámara Prohibida tras el Muro',
    'Bóveda Secreta de los Arquitectos',
  ],
  MINIBOSS: [
    'Umbral del Guardián de la Puerta',
    'Cámara del Sello de la Mazmorra',
    'Bastión del Custodio Mayor',
  ],
  BOSS: [
    'Trono del Señor de la Mazmorra',
    'Santuario Final del Abismo',
    'Cámara del Guardián Supremo',
  ],
};

const ROOM_TYPE_SUBTITLES: Record<CriptaCanonicalRoomType, string> = {
  COMBAT: 'COMBATE EN LA CÁMARA · DERROTA A LOS GUARDIANES PARA AVANZAR',
  ELITE: 'AMENAZA DE ÉLITE · UN CAMPEÓN LETAL BLOQUEA EL PASO',
  TREASURE: 'CÁMARA DEL TESORO · RECLAMA EL BOTÍN ANCESTRAL',
  LOOT: 'HALLAZGO · RECOGE LOS SUMINISTROS DEL CAMINO',
  EVENT: 'SUCESO MISTERIOSO · DECIDE CÓMO ACTUAR ANTE EL ENCUENTRO',
  DECISION: 'ENCRUCIJADA · ELIGE QUÉ RUTA TOMARÁ LA EXPEDICIÓN',
  SHOP: 'MERCADER · INTERCAMBIA ORO POR PERTRECHOS Y BENDICIONES',
  REST: 'CAMPAMENTO · DESCANSA JUNTO AL FUEGO O REFUERZA EL EQUIPO',
  SHRINE: 'SANTUARIO · OFRECE UN TRIBUTO O RECIBE UNA GRACIA',
  TRAP: 'TRAMPA ACTIVA · DESACTIVA O SUPERA EL MECANISMO',
  PUZZLE: 'ACERTIJO ARCANO · RESUELVE EL DESAFÍO INTERACTIVO DE LA CÁMARA',
  MINIGAME: 'DESAFÍO COOPERATIVO · SUPERA LA PRUEBA DE LA CÁMARA PARA OBTENER BOTÍN',
  SECRET: 'SALA SECRETA DESCUBIERTA · RELIQUIAS OCULTAS DEL REINO',
  MINIBOSS: 'MINIBOSS DE MAZMORRA · DERROTA AL CUSTODIO PARA COMPLETAR ESTA PUERTA',
  BOSS: 'JEFE FINAL DE LA EXPEDICIÓN · EL ENFRENTAMIENTO SUPREMO',
};

function enrichEnemyInstance(
  enemy: CriptaRoomEnemy,
  roomIndex: number,
  dungeonId?: CriptaDungeonId
): CriptaRoomEnemy {
  const bp = resolveEnemyVisualBlueprint(enemy, dungeonId);
  const withVisuals: CriptaRoomEnemy = {
    ...enemy,
    profession: enemy.profession || bp.profession || 'GUERRERO',
    visualProfile: enemy.visualProfile || bp.visualProfile,
  };
  const { roleTag, aiProfile, profession } = buildEnemyAiProfileForArchetype(withVisuals, roomIndex);
  return {
    ...withVisuals,
    roleTag,
    profession: profession || withVisuals.profession,
    aiProfile,
    memory: createInitialEnemyMemory(),
    defendingRoundsRemaining: 0,
    protectedByEnemyId: null,
    attackBuffBonus: 0,
    attackBuffRounds: 0,
    armorBuffBonus: 0,
    armorBuffRounds: 0,
    preparedTelegraphLabel: null,
    furiaActive: false,
  };
}

function buildEnemiesForRoom(
  dungeonId: CriptaDungeonId,
  roomType: 'COMBAT' | 'ELITE' | 'MINIBOSS' | 'BOSS',
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

  const bestiaryPool = getBiomeBestiaryEntries(dungeonId);

  if (roomType === 'MINIBOSS' || roomType === 'BOSS') {
    const minibossDef =
      DUNGEON_MINIBOSS_REGISTRY[dungeonId] || DUNGEON_MINIBOSS_REGISTRY.catacumbas_del_rey;
    const blueprint =
      bestiaryPool.minibosses[roomIndex % Math.max(1, bestiaryPool.minibosses.length)] ||
      resolveEnemyVisualBlueprint(
        {
          slug: minibossDef.slug,
          name: minibossDef.name,
          isMiniboss: roomType === 'MINIBOSS',
          isBoss: true,
          isFinalBoss: roomType === 'BOSS',
        },
        dungeonId
      );
    const bossMaxHp = Math.round(96 * scaleFactor);
    const baseAtk = Math.round(13 + roomIndex * 1.15);
    return [
      enrichEnemyInstance(
        {
          id: `enemy_miniboss_${roomIndex}_0`,
          slug: blueprint.slug,
          name: blueprint.name || minibossDef.name,
          title: `${ blueprint.profession || 'JEFE' } · ${blueprint.title}`,
          profession: blueprint.profession || 'JEFE',
          visualProfile: blueprint.visualProfile,
          isElite: false,
          isMiniboss: true,
          isBoss: true,
          isFinalBoss: roomType === 'BOSS',
          signatureMoveName: blueprint.signatureMoveName || minibossDef.signatureMoveName,
          enrageTriggered: false,
          hp: bossMaxHp,
          maxHp: bossMaxHp,
          attack: baseAtk,
          armor: 5,
          intent: 'AFLICCIÓN',
          intentCategory: 'SPECIAL',
          intentValue: baseAtk + 2,
          accentColor: blueprint.palette.eyeGlow || dungeon.palette.glow,
          statusThreat: blueprint.statusThreat || threatProfile.primaryStatus,
          statusSecondaryThreat: threatProfile.secondaryStatus,
          abilityName: blueprint.signatureMoveName || minibossDef.signatureMoveName,
          spriteArchetype: config.spriteArchetype,
        },
        roomIndex,
        dungeonId
      ),
    ];
  }

  if (roomType === 'ELITE') {
    const blueprint =
      bestiaryPool.elites[Math.floor(rng() * Math.max(1, bestiaryPool.elites.length))] ||
      bestiaryPool.elites[0] ||
      bestiaryPool.normals[0];
    const eliteMaxHp = Math.round(62 * scaleFactor);
    return [
      enrichEnemyInstance(
        {
          id: `enemy_elite_${roomIndex}_0`,
          slug: blueprint.slug,
          name: blueprint.name,
          title: `ÉLITE · ${blueprint.profession || 'CAMPEÓN'} · ${blueprint.title}`,
          profession: blueprint.profession,
          visualProfile: blueprint.visualProfile,
          isElite: true,
          isBoss: false,
          hp: eliteMaxHp,
          maxHp: eliteMaxHp,
          attack: Math.round(11 + roomIndex),
          armor: 4,
          intent: 'AFLICCIÓN',
          intentCategory: 'ATTACK',
          intentValue: Math.round(12 + roomIndex),
          accentColor: blueprint.palette.eyeGlow || dungeon.palette.highlight,
          statusThreat: blueprint.statusThreat || threatProfile.primaryStatus,
          statusSecondaryThreat: threatProfile.secondaryStatus,
          abilityName: blueprint.signatureMoveName || threatProfile.enemyAbilityLabel,
          spriteArchetype: config.spriteArchetype,
        },
        roomIndex,
        dungeonId
      ),
    ];
  }

  // COMBAT: 1 to 2 enemies in solo, 2 to 3 enemies in multiplayer
  // Every enemy in the room picks a DISTINCT canonical creature from the biome's 4 normal creatures
  // so no two enemies in an encounter ever share the same canonical name, sprite, or role!
  const count = playerCount <= 1 ? (rng() > 0.45 ? 2 : 1) : rng() > 0.55 ? 3 : 2;
  const canonicalNormals = bestiaryPool.normals;
  const pickedBlueprints: typeof canonicalNormals = [];

  for (let i = 0; i < count; i++) {
    const candidateIdx = (roomIndex * 2 + i) % Math.max(1, canonicalNormals.length);
    let candidate = canonicalNormals[candidateIdx];
    if (pickedBlueprints.some((b) => b.slug === candidate.slug)) {
      const unused = canonicalNormals.find(
        (b) => !pickedBlueprints.some((p) => p.slug === b.slug)
      );
      if (unused) candidate = unused;
    }
    if (candidate) {
      pickedBlueprints.push(candidate);
    }
  }

  const enemies: CriptaRoomEnemy[] = [];
  for (let i = 0; i < pickedBlueprints.length; i++) {
    const blueprint = pickedBlueprints[i];
    const prof = blueprint.profession || 'GUERRERO';

    const isTankOrBrute =
      prof === 'TANQUE' ||
      prof === 'GUARDIÁN' ||
      prof === 'BRUTO' ||
      blueprint.roleTag === 'TANK' ||
      blueprint.roleTag === 'BRUTE';
    const isCasterOrHealer =
      prof === 'CHAMÁN' ||
      prof === 'MAGO' ||
      prof === 'CURANDERO' ||
      prof === 'CONTROLADOR' ||
      prof === 'INVOCADOR' ||
      prof === 'ALQUIMISTA' ||
      prof === 'SOPORTE';

    const baseHp = count === 1 ? 38 : count === 2 ? 26 : 22;
    const roleHpMod = isTankOrBrute ? 1.18 : isCasterOrHealer ? 0.88 : 1.0;
    const maxHp = Math.round(baseHp * scaleFactor * roleHpMod);
    const intents: CriptaRoomEnemy['intent'][] = ['ATAQUE', 'AFLICCIÓN', 'GUARDIA', 'MALDICIÓN'];
    const intent = isTankOrBrute
      ? i === 0 && roomIndex % 2 === 1
        ? 'GUARDIA'
        : 'ATAQUE'
      : isCasterOrHealer
      ? 'MALDICIÓN'
      : intents[(roomIndex + i) % intents.length];
    const assignedStatus =
      blueprint.statusThreat ||
      (i % 2 === 0 ? threatProfile.primaryStatus : threatProfile.secondaryStatus);

    enemies.push(
      enrichEnemyInstance(
        {
          id: `enemy_${roomIndex}_${i}`,
          slug: blueprint.slug,
          name: blueprint.name,
          title: `${prof} · ${blueprint.title}`,
          profession: prof,
          visualProfile: blueprint.visualProfile,
          isElite: false,
          isBoss: false,
          hp: maxHp,
          maxHp,
          attack: Math.round(7 + roomIndex * 0.8),
          armor: isTankOrBrute ? 4 : 2 + (i % 2),
          intent,
          intentCategory:
            intent === 'GUARDIA' ? 'DEFEND' : intent === 'ATAQUE' ? 'ATTACK' : 'MAGIC',
          intentValue: Math.round(7 + roomIndex * 0.8),
          accentColor: blueprint.palette.eyeGlow || dungeon.palette.glow,
          statusThreat: assignedStatus,
          statusSecondaryThreat: threatProfile.secondaryStatus,
          abilityName: blueprint.signatureMoveName || threatProfile.enemyAbilityLabel,
          spriteArchetype: config.spriteArchetype,
        },
        roomIndex + i,
        dungeonId
      )
    );
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

  const droppedWeaponId = pickWeaponDropForDungeon(
    dungeonId,
    roomIndex,
    roomType === 'TREASURE' || roomType === 'SECRET'
  );

  switch (roomType) {
    case 'TREASURE':
      return [
        {
          id: `opt_${roomIndex}_open_chest`,
          label: `ABRIR ARCA: ${treasureName.toUpperCase()}`,
          subtitle: 'Reclamar arma forjada, oro y reliquia del pedestal',
          effectText: `EQUIPA ARMA NUEVA · +35 ORO · +1 ATAQUE Y RELIQUIA (${treasureName})`,
          grantsWeaponId: droppedWeaponId,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_purify_relic`,
          label: 'CANALIZAR ESENCIA RESTAURADORA',
          subtitle: 'Extraer su luz sagrada para sanar al grupo sin tomar el objeto maldito',
          effectText: '+20 ORO · +1 MAGIA · CURA +18 VIDA · PURIFICA Y OTORGA BENDECIDO (2T)',
          recommendedClass: 'clerigo',
          recommendedStat: 'MAGIA',
          recommendedStatLevel: 6,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
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
          effectText: '+24 ORO · RESTAURA +10 VIDA Y LIMPIA 1 AFLICCIÓN',
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_loot_armor`,
          label: 'EQUIPAR ARMA Y CORAZA DEL ARSENAL',
          subtitle: 'Tomar armamento abandonado por una expedición anterior',
          effectText: 'EQUIPA ARMA DEL BIOMA · +2 DEFENSA Y ESCUDO (2 TURNOS)',
          grantsWeaponId: droppedWeaponId,
          grantsArmorId: roomIndex % 2 === 0 ? 'cota_de_malla_cripta' : 'armadura_escamas_fungicas',
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'PERSONAL',
          iconKey: 'sword',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'REST':
      return [
        {
          id: `opt_${roomIndex}_rest_heal`,
          label: 'DESCANSAR JUNTO A LA HOGUERA DE ALMAS',
          subtitle: 'El fuego cálido restaura la vitalidad y disipa las aflicciones',
          effectText: 'CURA +35% VIDA MÁXIMA · PURIFICA ESTADOS NEGATIVOS Y OTORGA ESCUDO (+4)',
          isReviveOption: false,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'flame',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_rest_sharpen`,
          label: 'FORJAR Y MEJORAR ARMA EN LAS BRASAS',
          subtitle: 'Templar tu arma equipada al siguiente nivel en el yunque de campaña',
          effectText: 'MEJORA TU ARMA EQUIPADA (+NIVEL) · +1 ATAQUE Y REGENERACIÓN (2T)',
          isWeaponUpgradeOption: true,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'PERSONAL',
          iconKey: 'sword',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_rest_train`,
          label: 'ENTRENAR TÉCNICA Y TEMPLE TÁCTICO',
          subtitle: 'Practicar maniobras de guardia y coordinación junto a las brasas',
          effectText: '+1 ATAQUE · +1 DEFENSA · OTORGA BENDECIDO (2 TURNOS) A TODO EL GRUPO',
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'SHRINE':
      return [
        {
          id: `opt_${roomIndex}_shrine_blessing`,
          label: 'PLEGARIA DE LUZ Y AMPARO SAGRADO',
          subtitle: 'Invocar la gracia del santuario para bendecir y sanar al grupo',
          effectText: '+1 MAGIA · CURA +18 VIDA · PURIFICA AFLICCIONES Y OTORGA BENDECIDO (2T)',
          isReviveOption: false,
          recommendedClass: 'clerigo',
          recommendedStat: 'MAGIA',
          recommendedStatLevel: 6,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'chalice',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_shrine_pact`,
          label: 'PACTO DE SANGRE Y FORJA OSCURA',
          subtitle: 'Ofrecer vitalidad a cambio de mejorar tu arma y ganar oro',
          effectText: '-7 VIDA (SANGRADO 2T) · MEJORA ARMA EQUIPADA · +40 ORO Y +1 ATAQUE',
          isWeaponUpgradeOption: true,
          riskLabel: 'ARRIESGADO',
          ownershipScope: 'PERSONAL',
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
          effectText: 'CURA +25 VIDA · PURIFICA TODAS LAS AFLICCIONES Y OTORGA REGENERACIÓN',
          costGold: 24,
          ownershipScope: 'GRUPO',
          iconKey: 'potion',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'TRAP':
      return [
        {
          id: `opt_${roomIndex}_trap_disarm`,
          label: 'DESACTIVAR ENGRANAJES CON PRECISIÓN',
          subtitle: 'Prueba de destreza técnica sobre los contrapesos',
          effectText: 'PRUEBA DE CLASE/ATRIBUTO: EVITA LA TRAMPA Y OBTIENE +22 ORO',
          recommendedClass: 'picaro',
          recommendedStat: 'ATAQUE',
          recommendedStatLevel: 6,
          riskLabel: 'ARRIESGADO',
          ownershipScope: 'GRUPO',
          iconKey: 'key',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_trap_arcane`,
          label: 'DISOLVER SELLOS O CONTENER CON ESCUDO',
          subtitle: `Usar alquimia/magia o resistir tras el pavés en ${dungeon.name}`,
          effectText: `CON MAGIA/DEFENSA ALTA: BLOQUEA EL DAÑO · SI FALLA: -6 PV Y ${trapStatusDef.name}`,
          recommendedClass: 'caballero',
          recommendedStat: 'DEFENSA',
          recommendedStatLevel: 6,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    case 'EVENT': {
      const evBlueprint = pickMysteriousEventBlueprint(dungeonId, roomIndex);
      const isSubmergeWeapon = evBlueprint.respectLabel.includes('SUMERGIR EL ARMA');
      const isRepairArmor = evBlueprint.respectLabel.includes('REPARAR ARMADURA');
      return [
        {
          id: `opt_${roomIndex}_event_inspect`,
          eventId: evBlueprint.eventId,
          label: evBlueprint.inspectLabel,
          subtitle: evBlueprint.inspectSubtitle,
          effectText: '+30 ORO · +1 MAGIA · +12 VIDA Y BENDECIDO (3T)',
          recommendedClass: 'mago',
          recommendedStat: 'MAGIA',
          recommendedStatLevel: 7,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          grantsAccessoryId: roomIndex % 2 === 0 ? 'colgante_de_cristal' : 'anillo_del_boticario',
          iconKey: 'rune',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_event_respect`,
          eventId: evBlueprint.eventId,
          label: evBlueprint.respectLabel.trim(),
          subtitle: evBlueprint.respectSubtitle,
          effectText: isSubmergeWeapon
            ? 'TEMPLA TU ARMA EQUIPADA (+NIVEL) · +20 VIDA · +2 ARMADURA Y PURIFICA'
            : isRepairArmor
            ? 'REPARA Y EQUIPA CORAZA · +20 VIDA · +2 ARMADURA Y PURIFICA'
            : 'EQUIPA ARMA DE CLASE · +20 VIDA · +2 ARMADURA Y PURIFICA',
          isReviveOption: false,
          isWeaponUpgradeOption: isSubmergeWeapon,
          grantsWeaponId: isSubmergeWeapon || isRepairArmor ? undefined : droppedWeaponId,
          grantsArmorId: isRepairArmor ? 'placas_del_juramento' : undefined,
          recommendedClass: 'caballero',
          recommendedStat: 'ATAQUE',
          recommendedStatLevel: 6,
          riskLabel: 'ARRIESGADO',
          ownershipScope: isSubmergeWeapon || isRepairArmor ? 'PERSONAL' : 'EXPEDICIÓN',
          iconKey: 'sword',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_event_abandon`,
          eventId: evBlueprint.eventId,
          label: evBlueprint.cautionLabel,
          subtitle: evBlueprint.cautionSubtitle,
          effectText: '+12 ORO · PASO DESPEJADO SIN RIESGO',
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'shield',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];
    }

    case 'DECISION':
      return [
        {
          id: `opt_${roomIndex}_path_left`,
          label: 'FORZAR LA COMPUERTA DEL ARSENAL',
          subtitle: 'Requiere fuerza marcial o herramientas de brecha',
          effectText: 'EQUIPA ARMA · +26 ORO · +1 ATAQUE Y REGENERACIÓN (2 TURNOS)',
          grantsWeaponId: droppedWeaponId,
          recommendedClass: 'caballero',
          recommendedStat: 'ATAQUE',
          recommendedStatLevel: 6,
          riskLabel: 'ARRIESGADO',
          ownershipScope: 'GRUPO',
          iconKey: 'sword',
          usedByPlayerIds: [],
          resolved: false,
        },
        {
          id: `opt_${roomIndex}_path_right`,
          label: 'PURIFICAR EL ALTAR DEL BALUARTE',
          subtitle: 'Canalizar fe o alquimia para proteger al grupo',
          effectText: 'EQUIPA CORAZA · +2 DEFENSA · +14 VIDA Y ESCUDO (2 TURNOS)',
          grantsArmorId: 'coraza_del_sepulturero',
          recommendedClass: 'alquimista',
          recommendedStat: 'MAGIA',
          recommendedStatLevel: 6,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
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
          effectText: 'EQUIPA ARMA RARA · MEJORA ARMA · +60 ORO · +20 VIDA Y RELIQUIA',
          isReviveOption: false,
          isWeaponUpgradeOption: true,
          grantsWeaponId: droppedWeaponId,
          riskLabel: 'PARECE SEGURO',
          ownershipScope: 'GRUPO',
          iconKey: 'gold',
          usedByPlayerIds: [],
          resolved: false,
        },
      ];

    default:
      return [];
  }
}

const RUNES_ORDER_NAMES = ['SOL', 'LUNA', 'VACIO', 'SANGRE'] as const;

function buildRoomMinigameForRoom(
  dungeonId: CriptaDungeonId,
  roomType: CriptaCanonicalRoomType,
  roomIndex: number,
  rng: () => number,
  droppedWeaponId: CriptaWeaponId,
  recentFamilies: CriptaMinigameFamilyId[]
): CriptaRoomMinigameState | undefined {
  if (
    roomType === 'PUZZLE' ||
    roomType === 'MINIGAME' ||
    roomType === 'TRAP'
  ) {
    const chosenFamily = pickNextMinigameFamily(
      dungeonId,
      roomIndex,
      rng,
      recentFamilies
    );
    recentFamilies.push(chosenFamily);
    return createAuthoritativeMinigameState(
      chosenFamily,
      dungeonId,
      roomIndex,
      rng,
      droppedWeaponId
    );
  }

  return undefined;
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
  hasDiscountRelic = false,
  preferredClassIds: CriptaCharacterId[] = [],
  excludedRelicIds: CriptaRelicId[] = [],
  excludedWeaponIds: CriptaWeaponId[] = []
): GeneratedProceduralDungeon {
  const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
  const config = DUNGEON_GENERATION_CONFIGS[dungeonId] || DUNGEON_GENERATION_CONFIGS.catacumbas_del_rey;
  const rng = createSeededRng(seed);

  const totalRooms =
    config.minRooms + Math.floor(rng() * (config.maxRooms - config.minRooms + 1));

  const roomTypes: CriptaCanonicalRoomType[] = [];

  for (let i = 0; i < totalRooms; i++) {
    if (i === totalRooms - 1) {
      roomTypes.push('MINIBOSS');
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
      ? ['COMBAT', 'LOOT', 'EVENT', 'MINIGAME', 'DECISION']
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
          'MINIGAME',
        ];

    // Enforce anti-repetition rules
    const filtered = allowedTypes.filter((candidate) => {
      // Never 2 SHOP or 2 REST or 2 PUZZLE or 2 MINIGAME or 2 ELITE back-to-back
      if (
        (candidate === 'SHOP' ||
          candidate === 'REST' ||
          candidate === 'PUZZLE' ||
          candidate === 'MINIGAME' ||
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
      weight: t === 'MINIGAME' ? 16 : config.weights[t] ?? 10,
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

  // Guarantee at least 1 interactive MINIGAME or PUZZLE room in every dungeon
  const hasMinigameRoom = roomTypes.some(
    (rt) => rt === 'MINIGAME' || rt === 'PUZZLE'
  );
  if (!hasMinigameRoom && totalRooms >= 4) {
    const targetSlot = Math.max(1, Math.min(totalRooms - 3, Math.floor(totalRooms / 2)));
    roomTypes[targetSlot] = 'MINIGAME';
  }

  // Pick one mid-dungeon room to host a subtle secret room trigger
  const secretHostIndex = Math.max(1, Math.min(totalRooms - 2, Math.floor(totalRooms * 0.5)));
  const recentMinigameFamilies: CriptaMinigameFamilyId[] = [];

  const rooms: CriptaDungeonRoom[] = roomTypes.map((rType, idx) => {
    const isFirst = idx === 0;
    const poolSlug =
      dungeon.roomPool[idx % Math.max(1, dungeon.roomPool.length)] || 'camara_antigua';
    const fallbackTitles = ROOM_TYPE_TITLES[rType];
    const specificTitle =
      idx < dungeon.roomPool.length
        ? formatSlugTitle(poolSlug)
        : fallbackTitles[idx % fallbackTitles.length];

    const isCombatLike =
      rType === 'COMBAT' || rType === 'ELITE' || rType === 'MINIBOSS' || rType === 'BOSS';
    const enemies = isCombatLike
      ? buildEnemiesForRoom(dungeonId, rType, idx, playerCount, rng)
      : [];
    const options =
      !isCombatLike &&
      rType !== 'PUZZLE' &&
      rType !== 'MINIGAME' &&
      rType !== 'TRAP' &&
      rType !== 'SHOP'
        ? buildInteractiveOptionsForRoom(dungeonId, rType, idx, rng)
        : [];
    const shopInventory =
      rType === 'SHOP'
        ? generateShopInventoryForRoom(
            seed,
            idx,
            hasDiscountRelic,
            preferredClassIds,
            excludedRelicIds,
            excludedWeaponIds,
            0
          )
        : undefined;

    const roomDroppedWeaponId = pickWeaponDropForDungeon(
      dungeonId,
      idx,
      rType === 'TREASURE' || rType === 'SECRET',
      preferredClassIds
    );

    const minigame = buildRoomMinigameForRoom(
      dungeonId,
      rType,
      idx,
      rng,
      roomDroppedWeaponId,
      recentMinigameFamilies
    );

    // 3-rune sequence for PUZZLE rooms (matching RUNE_MEMORY minigame pattern)
    const puzzleRunes =
      rType === 'PUZZLE' && minigame
        ? {
            sequence: minigame.targetPattern.map(
              (pIdx) => RUNES_ORDER_NAMES[pIdx] || 'SOL'
            ) as unknown as number[],
            currentInput: [],
            attemptsLeft: 2,
            solved: false,
          }
        : undefined;

    const { encounterSubject, interactiveObjects } = buildRoomEncounterSubjectAndObjects(
      dungeonId,
      rType,
      idx,
      rng
    );

    const minibossDef =
      DUNGEON_MINIBOSS_REGISTRY[dungeonId] || DUNGEON_MINIBOSS_REGISTRY.catacumbas_del_rey;
    const minibossArena =
      CRIPTA_MINIBOSS_ARENAS_REGISTRY[dungeonId] ||
      CRIPTA_MINIBOSS_ARENAS_REGISTRY.catacumbas_del_rey;
    const minibossEnemyName = enemies[0]?.name || minibossDef.name;

    return {
      id: `room_${dungeonId}_${idx + 1}`,
      index: idx,
      roomNumber: idx + 1,
      dungeonId,
      type: rType,
      state: isFirst ? 'IN_PROGRESS' : 'LOCKED',
      lifecyclePhase: isFirst ? 'ACTIVE' : 'ENTERING',
      resolvedAtTimestamp: null,
      isMinibossRoom: rType === 'MINIBOSS',
      revealed: isFirst,
      visited: isFirst,
      resolved: false,
      title:
        rType === 'MINIBOSS' || rType === 'BOSS'
          ? minibossArena.arenaTitle
          : (rType === 'PUZZLE' || rType === 'MINIGAME' || rType === 'TRAP') &&
            minigame?.title
          ? minigame.title
          : rType === 'EVENT' && encounterSubject?.name
          ? encounterSubject.name
          : specificTitle,
      subtitle:
        rType === 'MINIBOSS' || rType === 'BOSS'
          ? `${minibossArena.arenaSubtitle} · CUSTODIO: ${minibossEnemyName.toUpperCase()}`
          : (rType === 'PUZZLE' || rType === 'MINIGAME' || rType === 'TRAP') &&
            minigame?.subtitle
          ? minigame.subtitle
          : rType === 'EVENT' && encounterSubject?.roleSubtitle
          ? encounterSubject.roleSubtitle
          : ROOM_TYPE_SUBTITLES[rType],
      narrative:
        idx === 0
          ? `Habéis cruzado el umbral de ${dungeon.name}. ${dungeon.description}`
          : rType === 'MINIBOSS'
          ? `${minibossArena.arenaTitle}: ${minibossEnemyName} aguarda en el santuario final de ${dungeon.name}. Derrotadlo para sellar esta puerta.`
          : rType === 'BOSS'
          ? `La cámara final de ${dungeon.name} tiembla ante la presencia de su guardián supremo.`
          : rType === 'EVENT' && encounterSubject?.dialogueQuote
          ? `${encounterSubject.name}: ${encounterSubject.dialogueQuote}`
          : `Sala ${idx + 1} de ${dungeon.name} (${dungeon.environmentModifiers.join(' · ')}).`,
      outcomeLog: null,
      biomeVariant: idx % 4,
      encounterSubject,
      interactiveObjects,
      enemies,
      options,
      groundDrops: [],
      shopInventory,
      shopSlots: shopInventory,
      shopRerollCount: rType === 'SHOP' ? 0 : undefined,
      shopPurchaseHistory: rType === 'SHOP' ? [] : undefined,
      minigame,
      puzzleRunes,
      combatTurn: isCombatLike ? 1 : undefined,
      combatRoundPhase: isCombatLike ? 'PLAYER_PHASE' : undefined,
      combatBannerText:
        rType === 'MINIBOSS'
          ? `¡MINIBOSS DE MAZMORRA: ${minibossDef.name.toUpperCase()}!`
          : isCombatLike
          ? 'RONDA 1 — FASE DE JUGADORES'
          : null,
      queuedPlayerActions: isCombatLike ? {} : undefined,
      activeCombatActorId: null,
      activeTargetedPlayerIds: [],
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
