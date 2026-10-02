import type {
  CriptaDungeonId,
  CriptaMinigameFamilyId,
  CriptaMinigameRouletteSector,
  CriptaRoomMinigameState,
  CriptaWeaponId,
} from '../../types/laCripta';

export type CriptaRoomMinigameType =
  | 'RUNE_SEQUENCE'
  | 'LOCKPICK_TIMING'
  | 'TRAP_STEPPING'
  | 'ALCHEMICAL_BALANCE'
  | 'TIMING_ALTAR'
  | 'ARCANE_DECIPHER'
  | 'PRESSURE_PLATES'
  | 'WHEEL_OF_FORTUNE';

export interface CriptaMinigameFamilyDefinition {
  id: CriptaMinigameFamilyId;
  categoryLabel: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultInstructions: string;
}

export const CRIPTA_MINIGAME_REGISTRY: Record<
  CriptaMinigameFamilyId,
  CriptaMinigameFamilyDefinition
> = {
  RUNIC_MEMORY: {
    id: 'RUNIC_MEMORY',
    categoryLabel: 'MEMORIA Y SECUENCIA RÚNICA',
    defaultTitle: 'PÚLPITO DE GLIFOS ANCESTRALES',
    defaultSubtitle: 'SECUENCIA DE MEMORIA ARCANA',
    defaultInstructions:
      'Observa la inscripción de la cámara y activa los glifos exactamente en el orden tallado. Cada fallo activa la trampa del pedestal.',
  },
  CURSED_ROULETTE: {
    id: 'CURSED_ROULETTE',
    categoryLabel: 'RULETA DEL DESTINO',
    defaultTitle: 'LA RUEDA DEL DESTINO ANCESTRAL',
    defaultSubtitle: 'FORTUNA, RELIQUIAS Y RIESGO',
    defaultInstructions:
      'Haz girar la Rueda del Destino de esta cámara. Espera a que la aguja se detenga por completo para descubrir el veredicto de la Cripta.',
  },
  PRESSURE_SIGILS: {
    id: 'PRESSURE_SIGILS',
    categoryLabel: 'LOSAS DE CONTRAPESO',
    defaultTitle: 'LOSAS DE PRESIÓN GRABADAS',
    defaultSubtitle: 'SINCRONIZACIÓN MECÁNICA',
    defaultInstructions:
      'Pisa las losas grabadas en la secuencia correcta para liberar el contrapeso de la compuerta sin activar los dardos.',
  },
  CRYPT_LOCK: {
    id: 'CRYPT_LOCK',
    categoryLabel: 'CERROJO ASTRAL',
    defaultTitle: 'CERRADURA DE TRES ANILLOS',
    defaultSubtitle: 'ALINEACIÓN EN EL CENIT (0°)',
    defaultInstructions:
      'Gira los 3 anillos concéntricos hasta alinear sus muescas doradas en el Cenit (0°) y sella el mecanismo.',
  },
  ALCHEMICAL_BALANCE: {
    id: 'ALCHEMICAL_BALANCE',
    categoryLabel: 'DESTILACIÓN ALQUÍMICA',
    defaultTitle: 'ALAMBIQUE DE EQUILIBRIO VOLÁTIL',
    defaultSubtitle: 'RESONANCIA ÓPTIMA (70%–86%)',
    defaultInstructions:
      'Combina los reactivos para llevar la presión del matraz a la franja óptima (70%–86%) y estabilízalo sin sobrecargarlo.',
  },
  SOUL_CHAINS: {
    id: 'SOUL_CHAINS',
    categoryLabel: 'CADENAS DE ÁNIMA',
    defaultTitle: 'RELICARIO ENCADENADO',
    defaultSubtitle: 'CORTAR ESLABONES FISURADOS',
    defaultInstructions:
      'Corta únicamente las 2 cadenas con fisuras incandescentes y evita tocar el eslabón maldito.',
  },
  SHADOW_MIRRORS: {
    id: 'SHADOW_MIRRORS',
    categoryLabel: 'ÓPTICA ASTRAL',
    defaultTitle: 'PRISMA DE LOS CUATRO ESPEJOS',
    defaultSubtitle: 'REFRACCIÓN DEL HAZ SOLAR',
    defaultInstructions:
      'Rota los 4 espejos hasta enfocar todos los haces sobre el Cristal del Eclipse y canaliza la luz.',
  },
  COOP_GAMBLE_CHEST: {
    id: 'COOP_GAMBLE_CHEST',
    categoryLabel: 'ARCA DE LA CODICIA',
    defaultTitle: 'ARCA DE LOS SELLOS ABISALES',
    defaultSubtitle: 'RIESGO Y RECOMPENSA',
    defaultInstructions:
      'Asegura el botín actual o arriesga abrir el siguiente sello abisal para multiplicar el oro y optar a una Reliquia.',
  },
  ECLIPSE_PULSE: {
    id: 'ECLIPSE_PULSE',
    categoryLabel: 'PULSO DE PRECISIÓN',
    defaultTitle: 'CRONÓMETRO DEL ECLIPSE',
    defaultSubtitle: 'SINCRONIZACIÓN EN CORONA DORADA',
    defaultInstructions:
      'Detén el pulso oscilante cuando cruce la Corona Dorada central para desbloquear los 3 pernos del mecanismo.',
  },
  FORBIDDEN_COFFERS: {
    id: 'FORBIDDEN_COFFERS',
    categoryLabel: 'DEDUCCIÓN HERMÉTICA',
    defaultTitle: 'TRÍPTICO DE LOS RELICARIOS',
    defaultSubtitle: 'DEDUCCIÓN Y OBSERVACIÓN',
    defaultInstructions:
      'Lee las pistas talladas en el pedestal y abre el Cofre Verdadero evitando el Cofre Mímico.',
  },
};

export interface CriptaBiomeMinigameFlavor {
  biomeTitlePrefix: string;
  accentColor: string;
  runeNames: string[];
}

const BIOME_FLAVORS: Partial<Record<CriptaDungeonId, CriptaBiomeMinigameFlavor>> = {
  catacumbas_del_rey: {
    biomeTitlePrefix: 'SEPULCRO REAL',
    accentColor: '#E7A54A',
    runeNames: ['CORONA', 'CETRO', 'CÁLIZ', 'ESPADA', 'TRONO', 'SELLO'],
  },
  jardin_podrido: {
    biomeTitlePrefix: 'JARDÍN MARCHITO',
    accentColor: '#5EA87A',
    runeNames: ['ESPORA', 'RAÍZ', 'SAVIA', 'ESPINA', 'HONGO', 'BROTE'],
  },
  forja_infernal: {
    biomeTitlePrefix: 'FORJA DE HIERRO',
    accentColor: '#FF7A33',
    runeNames: ['YUNQUE', 'BRASA', 'MARTILLO', 'ACERO', 'CENIZA', 'LLAMA'],
  },
  templo_sumergido: {
    biomeTitlePrefix: 'TEMPLO ABISAL',
    accentColor: '#38BDF8',
    runeNames: ['MAREA', 'CORAL', 'PERLA', 'TRIDENTE', 'ABISMO', 'ESPonja'],
  },
  minas_abandonadas: {
    biomeTitlePrefix: 'GALERÍA PROFUNDA',
    accentColor: '#FBBF24',
    runeNames: ['CUARZO', 'VETA', 'PICO', 'FAROL', 'GEODA', 'PIRITA'],
  },
  castillo_del_verdugo: {
    biomeTitlePrefix: 'BASTIÓN CARMESÍ',
    accentColor: '#E03E52',
    runeNames: ['CADENA', 'HACHA', 'GRILLETE', 'SANGRE', 'TORRE', 'SENTENCIA'],
  },
  bosque_de_los_susurros: {
    biomeTitlePrefix: 'ARBOLEDA ESPECTRAL',
    accentColor: '#A78BFA',
    runeNames: ['LUNA', 'ECO', 'NIEBLA', 'CUERVO', 'RAMA', 'SUSURRO'],
  },
  alcantarillas_imperiales: {
    biomeTitlePrefix: 'CLOACA IMPERIAL',
    accentColor: '#34D399',
    runeNames: ['REJA', 'ÁCIDO', 'VÁLVULA', ' VAPOR', 'CONDUCTO', 'LLAVE'],
  },
  torre_del_astrologo: {
    biomeTitlePrefix: 'SANTUARIO ASTRAL',
    accentColor: '#C084FC',
    runeNames: ['SOL', 'LUNA', 'ECLIPSE', 'COMETA', 'CENIT', 'VACÍO'],
  },
  santuario_de_sangre: {
    biomeTitlePrefix: 'OSARIO ANCESTRAL',
    accentColor: '#F87171',
    runeNames: ['CRÁNEO', 'FÉMUR', 'COSTILLA', 'URNA', 'CENIZA', 'ÁNIMA'],
  },
};

export function getBiomeMinigameFlavor(
  dungeonId?: CriptaDungeonId | null
): CriptaBiomeMinigameFlavor {
  if (dungeonId && BIOME_FLAVORS[dungeonId]) {
    return BIOME_FLAVORS[dungeonId]!;
  }
  return {
    biomeTitlePrefix: 'CÁMARA ANCESTRAL',
    accentColor: '#E7A54A',
    runeNames: ['SOL', 'LUNA', 'ECLIPSE', 'SANGRE', 'VACÍO', 'CORONA'],
  };
}

const ALL_MINIGAME_FAMILIES: CriptaMinigameFamilyId[] = [
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

export function pickNextMinigameFamily(
  _dungeonId: CriptaDungeonId,
  roomIndex: number,
  rng: () => number,
  recentFamilies: CriptaMinigameFamilyId[] = []
): CriptaMinigameFamilyId {
  const candidates = ALL_MINIGAME_FAMILIES.filter((f) => !recentFamilies.includes(f));
  const pool = candidates.length > 0 ? candidates : ALL_MINIGAME_FAMILIES;
  const idx = Math.floor(rng() * pool.length + roomIndex) % pool.length;
  return pool[idx];
}

function buildDefaultRouletteSectors(
  flavor: CriptaBiomeMinigameFlavor,
  droppedWeaponId?: CriptaWeaponId
): CriptaMinigameRouletteSector[] {
  return [
    {
      id: 'sec_gold',
      label: 'ARCA REAL (+45 ORO)',
      shortLabel: '+45 ORO',
      outcomeType: 'GOLD',
      isPositive: true,
      color: '#E7A54A',
      iconKind: 'GOLD',
      goldDelta: 45,
      description: 'La aguja señala el Arca Real: +45 ORO para la expedición.',
    },
    {
      id: 'sec_heal',
      label: 'FUENTE VITAL (+24 PV)',
      shortLabel: '+24 VIDA',
      outcomeType: 'HEAL',
      isPositive: true,
      color: '#5EA87A',
      iconKind: 'HEAL',
      hpDelta: 24,
      statusType: 'REGENERATION',
      statusTurns: 2,
      description: 'Energía restauradora baña al grupo (+24 PV y REGENERACIÓN).',
    },
    {
      id: 'sec_pact',
      label: 'TRIBUTO (-8 PV / +35 ORO)',
      shortLabel: 'PACTO +35 ORO',
      outcomeType: 'PACT',
      isPositive: true,
      color: '#C93B5B',
      iconKind: 'CURSE_PACT',
      goldDelta: 35,
      hpDelta: -8,
      description: 'Tributo de sangre: -8 PV a cambio de +35 ORO.',
    },
    {
      id: 'sec_bless',
      label: 'BENDICIÓN SOLAR (+18 PV)',
      shortLabel: 'BENDECIDO',
      outcomeType: 'BUFF',
      isPositive: true,
      color: '#FFD166',
      iconKind: 'WEAPON_BUFF',
      hpDelta: 18,
      statusType: 'BLESSED',
      statusTurns: 3,
      description: 'Bendición del santuario: +18 PV y BENDECIDO (3 turnos).',
    },
    {
      id: 'sec_item',
      label: 'POCIÓN MAYOR (+20 ORO)',
      shortLabel: 'POCIÓN + ORO',
      outcomeType: 'ITEM',
      isPositive: true,
      color: '#38BDF8',
      iconKind: 'ELIXIR',
      goldDelta: 20,
      itemId: 'pocion_mayor',
      description: 'Alijo alquímico: Poción Mayor y +20 ORO.',
    },
    {
      id: 'sec_shock',
      label: 'CHISPAZO RÚNICO (-9 PV)',
      shortLabel: '-9 PV / +15 ORO',
      outcomeType: 'TRAP',
      isPositive: false,
      color: '#EF4444',
      iconKind: 'TRAP',
      hpDelta: -9,
      goldDelta: 15,
      description: 'Descarga del mecanismo: -9 PV pero rescatáis +15 ORO.',
    },
    {
      id: 'sec_weapon',
      label: 'TEMPLE DE ARMA (+30 ORO)',
      shortLabel: 'ARMA +30 ORO',
      outcomeType: 'WEAPON',
      isPositive: true,
      color: flavor.accentColor,
      iconKind: 'WEAPON_BUFF',
      goldDelta: 30,
      weaponId: droppedWeaponId,
      statusType: 'SHIELDED',
      statusTurns: 2,
      description: 'Armamento templado (+30 ORO y ESCUDO por 2 turnos).',
    },
    {
      id: 'sec_jackpot',
      label: '¡PREMIO MAYOR! (+60 ORO)',
      shortLabel: '¡PREMIO MAYOR!',
      outcomeType: 'JACKPOT',
      isPositive: true,
      color: '#FDE047',
      iconKind: 'JACKPOT',
      goldDelta: 60,
      hpDelta: 20,
      statusType: 'BLESSED',
      statusTurns: 3,
      description: '¡Corona de la Fortuna! +60 ORO, +20 PV y BENDECIDO.',
    },
  ];
}

export function createAuthoritativeMinigameState(
  family: CriptaMinigameFamilyId,
  dungeonId: CriptaDungeonId,
  roomIndex: number,
  rng: () => number,
  droppedWeaponId?: CriptaWeaponId
): CriptaRoomMinigameState {
  const def = CRIPTA_MINIGAME_REGISTRY[family] || CRIPTA_MINIGAME_REGISTRY.RUNIC_MEMORY;
  const flavor = getBiomeMinigameFlavor(dungeonId);

  const p0 = Math.floor(rng() * 6);
  const p1 = (p0 + 1 + Math.floor(rng() * 2)) % 6;
  const p2 = (p1 + 1 + Math.floor(rng() * 2)) % 6;
  const targetPattern = [p0, p1, p2];

  const mappedMinigameType: CriptaRoomMinigameState['minigameType'] =
    family === 'ALCHEMICAL_BALANCE'
      ? 'ALCHEMICAL_BALANCE'
      : family === 'PRESSURE_SIGILS'
      ? 'TRAP_STEPPING'
      : family === 'ECLIPSE_PULSE'
      ? 'LOCKPICK_TIMING'
      : 'RUNE_SEQUENCE';

  const weak0 = Math.floor(rng() * 2);
  const weak1 = 2 + Math.floor(rng() * 2);
  const trapChain = [0, 1, 2, 3].find((c) => c !== weak0 && c !== weak1) ?? 1;

  const trueCoffer = Math.floor(rng() * 3);
  const mimicCoffer = (trueCoffer + 1) % 3;

  return {
    minigameInstanceId: `mg_${dungeonId}_${roomIndex}_${family}`,
    family,
    kind:
      family === 'CURSED_ROULETTE'
        ? 'CURSED_ROULETTE'
        : family === 'ALCHEMICAL_BALANCE'
        ? 'ALCHEMICAL_MIX'
        : family === 'CRYPT_LOCK'
        ? 'ARCANE_LOCK'
        : family === 'PRESSURE_SIGILS'
        ? 'PRESSURE_PLATES'
        : family === 'SHADOW_MIRRORS'
        ? 'SHARED_BEAM'
        : family === 'COOP_GAMBLE_CHEST'
        ? 'CHEST_OF_GREED'
        : family === 'FORBIDDEN_COFFERS'
        ? 'FORBIDDEN_CHESTS'
        : 'RUNE_MEMORY',
    minigameType: mappedMinigameType,
    biomeTheme: dungeonId,
    biomeSubtitle: flavor.biomeTitlePrefix,
    title: `${def.defaultTitle} · ${flavor.biomeTitlePrefix}`,
    subtitle: def.defaultSubtitle,
    instructions: def.defaultInstructions,
    completed: false,
    failed: false,
    succeeded: false,
    step: 0,
    currentStep: 0,
    maxSteps: family === 'SOUL_CHAINS' ? 2 : 3,
    attemptsLeft: 3,
    maxAttempts: 3,
    mistakes: 0,
    maxMistakes: 3,
    alchemicalMeter: 28,
    targetPattern,
    targetSequence: targetPattern,
    currentProgress: [],
    playerInputs: [],
    rewardSummary: undefined,
    rewardWeaponId: droppedWeaponId,
    rewardBlessingStatus: 'BLESSED',
    rouletteSectors:
      family === 'CURSED_ROULETTE'
        ? buildDefaultRouletteSectors(flavor, droppedWeaponId)
        : undefined,
    rouletteSpinCount: 0,
    rouletteRerollCostGold: 18,
    rouletteCanReroll: true,
    rouletteLandedSectorIndex: undefined,
    rouletteLandingAngleDeg: 0,
    rouletteSpinStartedAt: undefined,
    sigilClueSymbols: flavor.runeNames,
    sigilLockedPlates: [],
    lockRingAngles: [90, 180, 270],
    lockRingLocked: [false, false, false],
    chainsWeakIndices: [weak0, weak1],
    chainsTrapIndex: trapChain,
    chainsBroken: [false, false, false, false],
    mirrorOrientations: [0, 1, 2, 3],
    mirrorSolution: [1, 2, 0, 1],
    mirrorTargetLit: false,
    gambleChestTier: 1,
    gambleMaxTier: 3,
    gambleAccumulatedGold: 28,
    gambleCurseChancePct: 20,
    sweetSpotStart: 32,
    sweetSpotEnd: 68,
    cofferTrueIndex: trueCoffer,
    cofferMimicIndex: mimicCoffer,
    lastPenaltyDetail: null,
  };
}
