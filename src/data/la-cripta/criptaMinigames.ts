import {
  CriptaDungeonId,
  CriptaItemId,
  CriptaMinigameFamilyId,
  CriptaMinigameRouletteSector,
  CriptaRelicId,
  CriptaRoomMinigameState,
  CriptaStatusEffectType,
  CriptaWeaponId,
} from '../../types/laCripta';

export interface CriptaMinigameFamilyDefinition {
  id: CriptaMinigameFamilyId;
  title: string;
  subtitle: string;
  categoryLabel: string;
  defaultInstructions: string;
  coopRuleDescription: string;
  soloRuleDescription: string;
}

export const ALL_MINIGAME_FAMILIES: CriptaMinigameFamilyId[] = [
  'RUNIC_MEMORY',
  'CURSED_ROULETTE',
  'PRESSURE_SIGILS',
  'CRYPT_LOCK',
  'ALCHEMICAL_BALANCE',
  'SOUL_CHAINS',
  'SHADOW_MIRRORS',
  'COOP_GAMBLE_CHEST',
  'ECLIPSE_PULSE',
  'FORBIDDEN_COFFERS',
];

export const CRIPTA_MINIGAME_REGISTRY: Record<
  CriptaMinigameFamilyId,
  CriptaMinigameFamilyDefinition
> = {
  RUNIC_MEMORY: {
    id: 'RUNIC_MEMORY',
    title: 'ALTAR DE SECUENCIA RÚNICA',
    subtitle: 'Resonancia de Glifos Ancestrales',
    categoryLabel: 'MEMORIA RÚNICA',
    defaultInstructions:
      'Observa el orden en que destellan los glifos del obelisco y reprodúcelo sin romper el sello.',
    coopRuleDescription:
      'Cooperativo: Cada aventurero activo tiene glifos vinculados o puede pulsar el siguiente paso de la secuencia.',
    soloRuleDescription:
      'Solitario: Reproduce la secuencia completa de glifos en orden exacto.',
  },
  CURSED_ROULETTE: {
    id: 'CURSED_ROULETTE',
    title: 'RULETA DEL DESTINO ABISAL',
    subtitle: 'Rueda de Fortuna y Condena',
    categoryLabel: 'RULETA MALDITA',
    defaultInstructions:
      'Haz girar la rueda de piedra y hierro. Donde se detenga la aguja del eclipse dictará bendición, fortuna o castigo.',
    coopRuleDescription:
      'Cooperativo: El grupo comparte el giro o puede pagar oro para forzar un segundo giro.',
    soloRuleDescription:
      'Solitario: Gira la rueda o acepta un segundo giro pagando tributo de oro.',
  },
  PRESSURE_SIGILS: {
    id: 'PRESSURE_SIGILS',
    title: 'SELLOS DE PRESIÓN',
    subtitle: 'Cámara de Losas Sincronizadas',
    categoryLabel: 'COORDINACIÓN DE SELLOS',
    defaultInstructions:
      'Lee la inscripción mural de la cámara y activa únicamente las losas grabadas con los símbolos verdaderos.',
    coopRuleDescription:
      'Cooperativo: Los jugadores deben situarse sobre los sellos correctos para desbloquear el mecanismo.',
    soloRuleDescription:
      'Solitario: Activa los 3 sellos verdaderos en orden para abrir el cofre central.',
  },
  CRYPT_LOCK: {
    id: 'CRYPT_LOCK',
    title: 'CERRADURA ASTRAL DE LA CRIPTA',
    subtitle: 'Alineación de Tres Anillos Concéntricos',
    categoryLabel: 'MECANISMO DE PRECISIÓN',
    defaultInstructions:
      'Gira cada anillo de piedra hasta alinear su muesca dorada con el cenit superior (0°) y fija el cerrojo.',
    coopRuleDescription:
      'Cooperativo: Cada aventurero puede rotar uno de los anillos concéntricos para alinear el sello.',
    soloRuleDescription:
      'Solitario: Rota y alinea los 3 anillos concéntricos hacia la marca superior.',
  },
  ALCHEMICAL_BALANCE: {
    id: 'ALCHEMICAL_BALANCE',
    title: 'DESTILACIÓN INESTABLE',
    subtitle: 'Caldero de Presión Alquímica',
    categoryLabel: 'ALQUIMIA VOLÁTIL',
    defaultInstructions:
      'Inyecta reactivos de Fuego, Escarcha o Espora para llevar la presión a la Zona Óptima (70%–86%) y estabiliza la mezcla.',
    coopRuleDescription:
      'Cooperativo: Los jugadores combinan reactivos térmicos y catalizadores antes de sellar el matraz.',
    soloRuleDescription:
      'Solitario: Ajusta la presión del caldero entre 70% y 86% sin provocar una explosión.',
  },
  SOUL_CHAINS: {
    id: 'SOUL_CHAINS',
    title: 'CADENAS DE ÁNIMA',
    subtitle: 'Relicario Encadenado por Espectros',
    categoryLabel: 'TENSIÓN Y DEDUCCIÓN',
    defaultInstructions:
      'Examina la vibración de las 4 cadenas. Corta los 2 eslabones corroídos evitando la cadena maldita de descarga.',
    coopRuleDescription:
      'Cooperativo: El grupo inspecciona y corta los eslabones débiles sincronizando el golpe.',
    soloRuleDescription:
      'Solitario: Identifica y corta los 2 eslabones débiles guiándote por las grietas de ánima.',
  },
  SHADOW_MIRRORS: {
    id: 'SHADOW_MIRRORS',
    title: 'ESPEJOS DEL UMBRAL',
    subtitle: 'Refracción del Haz Purificador',
    categoryLabel: 'PUZZLE ÓPTICO',
    defaultInstructions:
      'Rota los 4 espejos rúnicos para guiar el haz de luz astral desde el emisor hasta el Cristal Receptor.',
    coopRuleDescription:
      'Cooperativo: Cualquier miembro del grupo puede rotar los pedestales de espejo hasta completar el circuito.',
    soloRuleDescription:
      'Solitario: Ajusta la orientación de los 4 espejos para iluminar el cristal receptor.',
  },
  COOP_GAMBLE_CHEST: {
    id: 'COOP_GAMBLE_CHEST',
    title: 'ARCA DE LAS ÁNIMAS',
    subtitle: 'Tentación del Tesoro Sellado',
    categoryLabel: 'RIESGO Y RECOMPENSA',
    defaultInstructions:
      'Cada sello roto incrementa el botín acumulado pero despierta la maldición del cofre. ¿Plantarse o arriesgar un sello más?',
    coopRuleDescription:
      'Cooperativo: El grupo decide si reclamar el botín seguro o forzar el siguiente sello abisal.',
    soloRuleDescription:
      'Solitario: Decide cuándo plantarte con el tesoro o arriesgar hasta el nivel legendario.',
  },
  ECLIPSE_PULSE: {
    id: 'ECLIPSE_PULSE',
    title: 'PULSO DEL ECLIPSE',
    subtitle: 'Sincronización del Péndulo Abisal',
    categoryLabel: 'PRECISIÓN RÍTMICA',
    defaultInstructions:
      'Pulsa el Sello Astral justo cuando el anillo de energía converja sobre la corona dorada (Zona Maestra).',
    coopRuleDescription:
      'Cooperativo: Completad 3 sellos armónicos seguidos sincronizando el pulso con el anillo.',
    soloRuleDescription:
      'Solitario: Fija los 3 sellos armónicos en el instante exacto de resonancia.',
  },
  FORBIDDEN_COFFERS: {
    id: 'FORBIDDEN_COFFERS',
    title: 'LOS COFRES PROHIBIDOS',
    subtitle: 'Juicio de los Tres Relicarios',
    categoryLabel: 'DEDUCCIÓN DE CRIPTA',
    defaultInstructions:
      'Analiza las pistas grabadas en piedra: un cofre guarda la Reliquia Verdadera, otro contiene oro menor y otro oculta una trampa.',
    coopRuleDescription:
      'Cooperativo: Marcad sospechas y abrid el cofre verdadero siguiendo las inscripciones.',
    soloRuleDescription:
      'Solitario: Deduce cuál de los 3 cofres es el auténtico antes de romper el sello.',
  },
};

export interface BiomeMinigameFlavor {
  biomeTitlePrefix: string;
  accentColor: string;
  runeNames: [string, string, string, string, string, string];
  hazardStatus: CriptaStatusEffectType;
  blessingStatus: CriptaStatusEffectType;
}

export function getBiomeMinigameFlavor(dungeonId: CriptaDungeonId): BiomeMinigameFlavor {
  switch (dungeonId) {
    case 'jardin_podrido':
    case 'la_colmena':
    case 'alcantarillas_imperiales':
      return {
        biomeTitlePrefix: 'BIO-ALTAR DE ESPORAS',
        accentColor: '#5EA87A',
        runeNames: ['ESPORA', 'RAÍZ', 'NÉCTAR', 'MICELIO', 'SAVIA', ' LARVA'],
        hazardStatus: 'POISON',
        blessingStatus: 'REGENERATION',
      };
    case 'forja_infernal':
    case 'fortaleza_goblin':
      return {
        biomeTitlePrefix: 'MECANISMO DE LA FORJA',
        accentColor: '#FF7A33',
        runeNames: ['BRASA', 'YUNQUE', 'ESCORIA', 'CRISOL', 'LLAMA', 'ACERO'],
        hazardStatus: 'BURN',
        blessingStatus: 'STRENGTHENED',
      };
    case 'cavernas_heladas':
    case 'cripta_de_cristal':
    case 'palacio_de_los_espejos':
      return {
        biomeTitlePrefix: 'PRISMA DE ESCARCHA',
        accentColor: '#7BDFF2',
        runeNames: ['PRISMA', 'ESCARCHA', 'ESPEJO', 'AURORA', 'CRISTAL', 'ECO'],
        hazardStatus: 'FROST',
        blessingStatus: 'MAGIC_BARRIER',
      };
    case 'santuario_de_sangre':
    case 'castillo_del_verdugo':
    case 'prision_maldita':
      return {
        biomeTitlePrefix: 'RELICARIO CARMESÍ',
        accentColor: '#C93B5B',
        runeNames: ['SANGRE', 'CADENA', 'CÁLIZ', 'HIERRO', 'JURAMENTO', 'ESPINA'],
        hazardStatus: 'BLEED',
        blessingStatus: 'CRIT_BOOST',
      };
    default:
      return {
        biomeTitlePrefix: 'OBELISCO DEL UMBRAL',
        accentColor: '#9B72CF',
        runeNames: ['SOL', 'LUNA', 'VACÍO', 'SANGRE', 'ASTRAL', 'CENIZA'],
        hazardStatus: 'CURSE',
        blessingStatus: 'BLESSED',
      };
  }
}

/**
 * Picks a minigame family for a room while guaranteeing:
 * - No two consecutive minigame rooms use the same family
 * - At least 4 families rotate across a run
 * - Biome affinity influences selection while preserving full variety
 */
export function pickNextMinigameFamily(
  dungeonId: CriptaDungeonId,
  roomIndex: number,
  rng: () => number,
  recentFamilies: CriptaMinigameFamilyId[] = []
): CriptaMinigameFamilyId {
  const lastFamily =
    recentFamilies.length > 0 ? recentFamilies[recentFamilies.length - 1] : null;
  const recentSet = new Set(recentFamilies.slice(-3));

  let candidates = ALL_MINIGAME_FAMILIES.filter(
    (fam) => fam !== lastFamily && !recentSet.has(fam)
  );
  if (candidates.length === 0) {
    candidates = ALL_MINIGAME_FAMILIES.filter((fam) => fam !== lastFamily);
  }

  // Deterministic but varied selection using rng + roomIndex + dungeonId hash
  const hash = dungeonId
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), roomIndex * 17);
  const pickIdx = Math.floor(rng() * candidates.length + hash) % candidates.length;
  return candidates[pickIdx] || 'RUNIC_MEMORY';
}

const DEFAULT_ROULETTE_ITEMS: CriptaItemId[] = [
  'pocion_mayor',
  'sal_purificadora',
  'elixir_fuerza',
  'frasco_volatil',
];

const DEFAULT_ROULETTE_RELICS: CriptaRelicId[] = [
  'corazon_de_hierro',
  'diente_del_rey',
  'ojo_del_oraculo',
  'corona_de_cristal',
];

export function buildRouletteSectorsForBiome(
  dungeonId: CriptaDungeonId,
  droppedWeaponId: CriptaWeaponId
): CriptaMinigameRouletteSector[] {
  const flavor = getBiomeMinigameFlavor(dungeonId);
  const itemReward =
    DEFAULT_ROULETTE_ITEMS[dungeonId.length % DEFAULT_ROULETTE_ITEMS.length];
  const relicReward =
    DEFAULT_ROULETTE_RELICS[dungeonId.length % DEFAULT_ROULETTE_RELICS.length];

  return [
    {
      id: 'sec_gold_large',
      label: '+65 ORO REAL',
      shortLabel: '+65 ORO',
      outcomeType: 'GOLD_LARGE',
      isPositive: true,
      color: '#E7A54A',
      iconKind: 'GOLD',
      goldDelta: 65,
      description: 'El arca del eclipse derrama +65 de oro para todo el grupo.',
    },
    {
      id: 'sec_curse_status',
      label: 'MALDICIÓN ABISAL',
      shortLabel: 'MALDICIÓN',
      outcomeType: 'CURSE_STATUS',
      isPositive: false,
      color: '#7656A8',
      iconKind: 'CURSE',
      statusType: flavor.hazardStatus,
      statusTurns: 2,
      hpDelta: -6,
      description: `El sello oscuro inflige -6 PV y aplica ${flavor.hazardStatus} (2T).`,
    },
    {
      id: 'sec_relic',
      label: 'RELIQUIA ANCESTRAL',
      shortLabel: 'RELIQUIA',
      outcomeType: 'RELIC',
      isPositive: true,
      color: '#9B72CF',
      iconKind: 'RELIC',
      relicId: relicReward,
      goldDelta: 25,
      description: 'Desbloquea una Reliquia Ancestral para el grupo y +25 de oro.',
    },
    {
      id: 'sec_poison_trap',
      label: 'DESCARGA DE TRAMPA',
      shortLabel: '-10 PV',
      outcomeType: 'POISON_TRAP',
      isPositive: false,
      color: '#C93B5B',
      iconKind: 'POISON',
      hpDelta: -10,
      statusType: 'VULNERABLE',
      statusTurns: 2,
      description: 'Agujas ocultas golpean por -10 PV y dejan Vulnerable (2T).',
    },
    {
      id: 'sec_party_heal',
      label: 'GRACIA DEL CÁLIZ',
      shortLabel: '+24 PV GRUPO',
      outcomeType: 'PARTY_HEAL',
      isPositive: true,
      color: '#5EA87A',
      iconKind: 'HEAL',
      hpDelta: 24,
      statusType: 'REGENERATION',
      statusTurns: 2,
      description: 'Restaura +24 PV a todos los aventureros y otorga Regeneración (2T).',
    },
    {
      id: 'sec_lose_gold',
      label: 'TRIBUTO DE SOMBRA',
      shortLabel: '-35% ORO',
      outcomeType: 'LOSE_HALF_GOLD',
      isPositive: false,
      color: '#8F263D',
      iconKind: 'SKULL',
      goldDelta: -25,
      description: 'El vórtice absorbe parte del oro del grupo (-25 Oro) pero abre el paso.',
    },
    {
      id: 'sec_blessing',
      label: 'BENDICIÓN DE ARMAS',
      shortLabel: 'ARMA + BENDICIÓN',
      outcomeType: 'BLESSING_BUFF',
      isPositive: true,
      color: '#FFD166',
      iconKind: 'BLESS',
      weaponId: droppedWeaponId,
      statusType: flavor.blessingStatus,
      statusTurns: 3,
      goldDelta: 30,
      description: 'Otorga Arma de Clase, +30 de oro y Bendición de Combate (3T).',
    },
    {
      id: 'sec_consumable',
      label: 'ALIJO DE BOTICARIO',
      shortLabel: 'ELIXIR + ORO',
      outcomeType: 'CONSUMABLE',
      isPositive: true,
      color: '#69A8A5',
      iconKind: 'ITEM',
      itemId: itemReward,
      goldDelta: 35,
      hpDelta: 10,
      description: 'Entrega un Elixir Mayor en la mochila, +35 de oro y +10 PV.',
    },
  ];
}

/**
 * Builds a rich, authoritative CriptaRoomMinigameState for any of the 10 minigame families.
 */
export function createAuthoritativeMinigameState(
  family: CriptaMinigameFamilyId,
  dungeonId: CriptaDungeonId,
  roomIndex: number,
  rng: () => number,
  droppedWeaponId: CriptaWeaponId,
  playerIds: string[] = []
): CriptaRoomMinigameState {
  const def = CRIPTA_MINIGAME_REGISTRY[family];
  const flavor = getBiomeMinigameFlavor(dungeonId);
  const itemReward =
    DEFAULT_ROULETTE_ITEMS[(roomIndex + dungeonId.length) % DEFAULT_ROULETTE_ITEMS.length];
  const relicReward =
    DEFAULT_ROULETTE_RELICS[(roomIndex + dungeonId.length) % DEFAULT_ROULETTE_RELICS.length];

  const baseState: CriptaRoomMinigameState = {
    family,
    kind:
      family === 'RUNIC_MEMORY'
        ? 'RUNE_MEMORY'
        : family === 'CRYPT_LOCK' || family === 'ECLIPSE_PULSE'
        ? 'LOCKPICK_TUMBLER'
        : family === 'PRESSURE_SIGILS'
        ? 'TRAP_STEPPING_STONES'
        : 'SOUL_WHEEL',
    minigameType:
      family === 'RUNIC_MEMORY'
        ? 'RUNE_SEQUENCE'
        : family === 'ALCHEMICAL_BALANCE'
        ? 'ALCHEMICAL_BALANCE'
        : family === 'PRESSURE_SIGILS'
        ? 'TRAP_STEPPING'
        : 'LOCKPICK_TIMING',
    phase: 'ACTIVE',
    title: `${def.title} · ${flavor.biomeTitlePrefix}`,
    subtitle: def.subtitle,
    instructions: def.defaultInstructions,
    biomeTheme: dungeonId,
    completed: false,
    failed: false,
    succeeded: false,
    step: 0,
    currentStep: 0,
    maxSteps: 4,
    attemptsLeft: 2,
    mistakes: 0,
    maxMistakes: 2,
    targetPattern: [0, 1, 2, 3],
    targetSequence: [0, 1, 2, 3],
    currentProgress: [],
    playerInputs: [],
    rewardGold: 48,
    rewardItemId: itemReward,
    rewardRelicId: relicReward,
    rewardWeaponId: droppedWeaponId,
    rewardBlessingStatus: flavor.blessingStatus,
    failurePenaltyHp: 8,
    failureStatus: flavor.hazardStatus,
    startedAtMs: Date.now(),
  };

  switch (family) {
    case 'RUNIC_MEMORY': {
      // 4-step sequence of 6 possible runes (0..5), no immediate duplicate
      const seq: number[] = [];
      for (let i = 0; i < 4; i++) {
        let next = Math.floor(rng() * 6) % 6;
        if (i > 0 && next === seq[i - 1]) {
          next = (next + 1 + (i % 3)) % 6;
        }
        seq.push(next);
      }
      const assignments: Record<string, number[]> = {};
      if (playerIds.length > 1) {
        playerIds.forEach((pid, idx) => {
          assignments[pid] = [0, 1, 2, 3, 4, 5].filter(
            (r) => r % playerIds.length === idx
          );
        });
      }
      const clueStr = seq.map((rIdx) => flavor.runeNames[rIdx] || `RUNA ${rIdx + 1}`).join(' → ');
      return {
        ...baseState,
        maxSteps: seq.length,
        targetPattern: seq,
        targetSequence: seq,
        runePlayerAssignments: assignments,
        instructions: `Secuencia de Resonancia: ${clueStr}. Observa el destello de los glifos y púlsalos en el orden exacto.`,
      };
    }

    case 'CURSED_ROULETTE': {
      const sectors = buildRouletteSectorsForBiome(dungeonId, droppedWeaponId);
      return {
        ...baseState,
        maxSteps: 1,
        attemptsLeft: 2,
        maxMistakes: 2,
        rouletteSectors: sectors,
        rouletteSpinCount: 0,
        rouletteRerollCostGold: 18,
        rouletteCanReroll: true,
        instructions:
          'Haz girar la Ruleta del Destino (60 FPS). Donde se detenga el puntero determinará el destino del grupo. Puedes forzar 1 giro adicional por 18 de oro.',
      };
    }

    case 'PRESSURE_SIGILS': {
      // 6 pressure plates (0..5), 3 of them are the true sigils
      const sigilSymbols = ['SOL', 'LUNA', 'ECLIPSE', 'SANGRE', 'VACÍO', 'CORONA'];
      const p0 = Math.floor(rng() * 2); // 0 or 1
      const p1 = 2 + (Math.floor(rng() * 2) % 2); // 2 or 3
      const p2 = 4 + (Math.floor(rng() * 2) % 2); // 4 or 5
      const target = [p0, p1, p2];
      const clueText = `INSCRIPCIÓN DEL MURO: «Solo quienes pisen ${sigilSymbols[p0]}, luego ${sigilSymbols[p1]} y finalmente ${sigilSymbols[p2]} cruzarán sin despertar las cuchillas.»`;
      return {
        ...baseState,
        maxSteps: 3,
        targetPattern: target,
        targetSequence: target,
        sigilClueSymbols: sigilSymbols,
        sigilActivePlates: {},
        sigilLockedPlates: [],
        instructions: clueText,
      };
    }

    case 'CRYPT_LOCK': {
      // 3 concentric rings; target is 0 deg (12 o'clock) for all 3 rings.
      // Start each ring at a non-zero multiple of 45 deg
      const startAngles = [
        ((1 + Math.floor(rng() * 6)) * 45) % 360,
        ((2 + Math.floor(rng() * 6)) * 45) % 360,
        ((3 + Math.floor(rng() * 6)) * 45) % 360,
      ];
      return {
        ...baseState,
        maxSteps: 3,
        attemptsLeft: 3,
        maxMistakes: 3,
        lockRingAngles: startAngles,
        lockTargetAngles: [0, 0, 0],
        lockRingLocked: [false, false, false],
        instructions:
          'Gira los 3 anillos concéntricos (+45° / -45°) hasta alinear sus muescas doradas en el Cenit Superior (0°) y pulsa SELLAR CERROJO.',
      };
    }

    case 'ALCHEMICAL_BALANCE': {
      const startPressure = 24 + (Math.floor(rng() * 3) * 5); // 24, 29, or 34
      return {
        ...baseState,
        maxSteps: 4,
        attemptsLeft: 2,
        maxMistakes: 2,
        alchemicalMeter: startPressure,
        alchemyPressure: startPressure,
        alchemyOptimalMin: 70,
        alchemyOptimalMax: 86,
        alchemyStepsRemaining: 5,
        alchemyHistory: [],
        instructions:
          'Ajusta la presión del caldero hasta la Zona Dorada (70%–86%) usando reactivos alquímicos y pulsa ESTABILIZAR DESTILADO.',
      };
    }

    case 'SOUL_CHAINS': {
      // 4 chains (0..3): 2 weak links (must cut), 1 cursed trap link, 1 reinforced link
      const weakA = Math.floor(rng() * 2); // 0 or 1
      const weakB = 2 + (Math.floor(rng() * 2) % 2); // 2 or 3
      const trapIdx = weakA === 0 ? 1 : 0;
      return {
        ...baseState,
        maxSteps: 2,
        attemptsLeft: 2,
        maxMistakes: 2,
        targetPattern: [weakA, weakB],
        targetSequence: [weakA, weakB],
        chainsIntegrity: [100, 100, 100, 100],
        chainsBroken: [false, false, false, false],
        chainsWeakIndices: [weakA, weakB],
        chainsTrapIndex: trapIdx,
        instructions: `El relicario está atado por 4 Cadenas de Ánima. Las cadenas #${
          weakA + 1
        } y #${
          weakB + 1
        } muestran fisuras incandescentes; la cadena #${
          trapIdx + 1
        } rezuma electricidad maldita. Corta las 2 cadenas fisuradas.`,
      };
    }

    case 'SHADOW_MIRRORS': {
      // 4 mirrors (0..3), each has orientation 0..3 ('/', '\', '-', '|').
      // Solution is [1, 2, 0, 3]
      const sol = [1, 2, 0, 3];
      const init = [
        (sol[0] + 1) % 4,
        (sol[1] + 2) % 4,
        (sol[2] + 1) % 4,
        (sol[3] + 3) % 4,
      ];
      return {
        ...baseState,
        maxSteps: 4,
        attemptsLeft: 3,
        maxMistakes: 3,
        mirrorOrientations: init,
        mirrorSolution: sol,
        mirrorBeamPath: [0],
        mirrorTargetLit: false,
        instructions:
          'Rota los 4 Espejos del Umbral hasta que cada pedestal marque RESONANCIA ÓPTIMA y el haz astral alcance el Cristal del Eclipse.',
      };
    }

    case 'COOP_GAMBLE_CHEST': {
      return {
        ...baseState,
        maxSteps: 3,
        attemptsLeft: 1,
        maxMistakes: 1,
        gambleChestTier: 1,
        gambleMaxTier: 3,
        gambleAccumulatedGold: 28,
        gambleCurseChancePct: 20,
        gamblePlayerVotes: {},
        instructions:
          'Nivel 1 desbloqueado (+28 Oro garantizados). ¿Reclamar el botín ahora sin riesgo o forzar el siguiente sello por +60 Oro y Reliquia/Arma?',
      };
    }

    case 'ECLIPSE_PULSE': {
      return {
        ...baseState,
        maxSteps: 3,
        attemptsLeft: 2,
        maxMistakes: 2,
        sweetSpotStart: 32,
        sweetSpotEnd: 68,
        pulseHitQualities: [],
        instructions:
          'Sincroniza los 3 Sellos del Eclipse pulsando cuando el anillo converja dentro de la Corona Dorada.',
      };
    }

    case 'FORBIDDEN_COFFERS': {
      const trueIdx = Math.floor(rng() * 3) % 3;
      const mimicIdx = (trueIdx + 1) % 3;
      const minorIdx = (trueIdx + 2) % 3;
      const cofferNames = ['COFRE DEL SOL', 'COFRE DE LA LUNA', 'COFRE DEL ECLIPSE'];
      const clues = [
        `Inscripción I: «El ${cofferNames[mimicIdx]} exhala aliento de hierro y dientes ocultos; jamás lo abras.»`,
        `Inscripción II: «El tesoro sagrado no reposa en el ${cofferNames[minorIdx]}, sino en el relicario bendecido del ${cofferNames[trueIdx]}.»`,
      ];
      return {
        ...baseState,
        maxSteps: 1,
        attemptsLeft: 2,
        maxMistakes: 2,
        cofferClues: clues,
        cofferTrueIndex: trueIdx,
        cofferMimicIndex: mimicIdx,
        cofferOpenedIndices: [],
        cofferPlayerMarks: {},
        instructions: `${clues[0]} ${clues[1]}`,
      };
    }
  }
}
