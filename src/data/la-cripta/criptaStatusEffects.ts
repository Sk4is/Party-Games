import type {
  CriptaDungeonId,
  CriptaPlayer,
  CriptaPlayerStatusEffect,
  CriptaStatusEffectDefinition,
  CriptaStatusEffectType,
} from '../../types/laCripta';

export const CRIPTA_STATUS_EFFECTS_REGISTRY: Record<
  CriptaStatusEffectType,
  CriptaStatusEffectDefinition
> = {
  POISON: {
    id: 'POISON',
    name: 'VENENO',
    code: 'VEN',
    category: 'DAMAGE_OVER_TIME',
    type: 'debuff',
    description:
      'Toxina virulenta que corroe la sangre: pierde 4 PV por acumulación al final de cada turno (ignora armadura).',
    icon: 'poison',
    stackRule: 'STACK_INTENSITY',
    maxStacks: 3,
    defaultTurns: 3,
    defaultPotency: 4,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#5EA87A',
      borderColor: '#3E7A56',
      bgTint: '#0D1F15',
    },
  },
  BURN: {
    id: 'BURN',
    name: 'QUEMADURA',
    code: 'QUE',
    category: 'DAMAGE_OVER_TIME',
    type: 'debuff',
    description:
      'Brasas infernales adheridas a la coraza: pierde 5 PV al final del turno y reduce 1 de Armadura.',
    icon: 'burn',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 2,
    defaultPotency: 5,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E76F38',
      borderColor: '#B84A1C',
      bgTint: '#24110B',
    },
  },
  BLEED: {
    id: 'BLEED',
    name: 'SANGRADO',
    code: 'SAN',
    category: 'DAMAGE_OVER_TIME',
    type: 'debuff',
    description:
      'Herida abierta por cuchillas: pierde 3 PV al realizar un ataque y 3 PV al final del turno. Se cierra al recibir curación.',
    icon: 'bleed',
    stackRule: 'STACK_INTENSITY',
    maxStacks: 3,
    defaultTurns: 3,
    defaultPotency: 3,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#C93B5B',
      borderColor: '#8F263D',
      bgTint: '#240B12',
    },
  },
  CONFUSION: {
    id: 'CONFUSION',
    name: 'CONFUSIÓN',
    code: 'CNF',
    category: 'CONTROL',
    type: 'debuff',
    description:
      'Susurros del vacío distorsionan la percepción: tus ataques pueden desviarse a un objetivo errático con menor precisión.',
    icon: 'confusion',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 30,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#9B72CF',
      borderColor: '#7656A8',
      bgTint: '#1A1128',
    },
  },
  FROST: {
    id: 'FROST',
    name: 'ESCARCHA',
    code: 'ESC',
    category: 'DEBUFF',
    type: 'debuff',
    description:
      'Frío sepulcral que entumece los músculos: reduce el daño de tus ataques en un 25% y debilita tu guardia.',
    icon: 'frost',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 2,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#69A8A5',
      borderColor: '#437A77',
      bgTint: '#0C1D1F',
    },
  },
  CURSE: {
    id: 'CURSE',
    name: 'MALDICIÓN',
    code: 'MAL',
    category: 'DEBUFF',
    type: 'debuff',
    description:
      'Sello sepulcral sobre el alma: reduce el daño infligido en un 25% y merma la eficacia de las curaciones recibidas.',
    icon: 'curse',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 3,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#B565D9',
      borderColor: '#76369C',
      bgTint: '#1D0E26',
    },
  },
  FEAR: {
    id: 'FEAR',
    name: 'MIEDO',
    code: 'MIE',
    category: 'CONTROL',
    type: 'debuff',
    description:
      'Pavor ante el horror abisal: el temblor reduce la potencia de tus ataques y habilidades en un 25%.',
    icon: 'fear',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#D8A058',
      borderColor: '#8F6226',
      bgTint: '#21170B',
    },
  },
  WEAKENED: {
    id: 'WEAKENED',
    name: 'DEBILITADO',
    code: 'DEB',
    category: 'DEBUFF',
    type: 'debuff',
    description:
      'Agotamiento físico por miasma o impacto pesado: infliges un 20% menos de daño en combate.',
    icon: 'weakened',
    stackRule: 'EXTEND_DURATION',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 20,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#A89C8E',
      borderColor: '#6E6459',
      bgTint: '#171514',
    },
  },
  MARKED: {
    id: 'MARKED',
    name: 'MARCADO',
    code: 'MRC',
    category: 'DEBUFF',
    type: 'debuff',
    description:
      'Señalado como presa prioritaria: el próximo ataque enemigo contra ti inflige un +35% de daño adicional.',
    icon: 'marked',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 35,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E74A5A',
      borderColor: '#9E2432',
      bgTint: '#260C11',
    },
  },
  BLESSED: {
    id: 'BLESSED',
    name: 'BENDECIDO',
    code: 'BEN',
    category: 'BUFF',
    type: 'buff',
    description:
      'Gracia solar consagrada: tus ataques y habilidades infligen un +25% de daño adicional.',
    icon: 'blessed',
    stackRule: 'EXTEND_DURATION',
    maxStacks: 1,
    defaultTurns: 3,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E7A54A',
      borderColor: '#C98736',
      bgTint: '#241B0D',
    },
  },
  SHIELDED: {
    id: 'SHIELDED',
    name: 'ESCUDO',
    code: 'ESC+',
    category: 'BUFF',
    type: 'buff',
    description:
      'Baluarte protector activo: mitiga 3 puntos adicionales de daño en cada embate enemigo.',
    icon: 'shielded',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 3,
    defaultPotency: 3,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#69A8A5',
      borderColor: '#487D7A',
      bgTint: '#0E1F21',
    },
  },
  REGENERATION: {
    id: 'REGENERATION',
    name: 'REGENERACIÓN',
    code: 'REG',
    category: 'BUFF',
    type: 'buff',
    description:
      'Vitalidad restauradora: recupera +5 PV al final de cada turno mientras dure el efecto.',
    icon: 'regeneration',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 3,
    defaultPotency: 5,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#5EA87A',
      borderColor: '#3E7A56',
      bgTint: '#0D2116',
    },
  },
  TORCH_LIGHT: {
    id: 'TORCH_LIGHT',
    name: 'LUZ DE ANTORCHA',
    code: 'LUZ',
    category: 'BUFF',
    type: 'relic',
    description:
      'Llama protectora del grupo: mantiene a raya la penumbra de la cripta mientras el aventurero siga en pie.',
    icon: 'torch',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 99,
    defaultPotency: 1,
    durationRule: 'EXPEDITION',
    visualTreatment: {
      color: '#E7A54A',
      borderColor: '#9E6825',
      bgTint: '#1F160C',
    },
  },
};

export interface BiomeThreatProfile {
  biomeGroup: 'CRYPT' | 'TOXIC_WOODS' | 'INFERNAL_FORGE' | 'FROZEN_DEPTHS' | 'BLOOD_EXECUTION' | 'ARCANE_VOID';
  primaryStatus: CriptaStatusEffectType;
  secondaryStatus: CriptaStatusEffectType;
  trapStatus: CriptaStatusEffectType;
  enemyAbilityLabel: string;
  bossAbilityLabel: string;
}

export const DUNGEON_BIOME_THREAT_PROFILES: Record<CriptaDungeonId, BiomeThreatProfile> = {
  catacumbas_del_rey: {
    biomeGroup: 'CRYPT',
    primaryStatus: 'CURSE',
    secondaryStatus: 'FEAR',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Sello del Monarca Caído',
    bossAbilityLabel: 'Decreto Sepulcral',
  },
  jardin_podrido: {
    biomeGroup: 'TOXIC_WOODS',
    primaryStatus: 'POISON',
    secondaryStatus: 'WEAKENED',
    trapStatus: 'POISON',
    enemyAbilityLabel: 'Nube de Esporas Tóxicas',
    bossAbilityLabel: 'Floración Pestilente',
  },
  forja_infernal: {
    biomeGroup: 'INFERNAL_FORGE',
    primaryStatus: 'BURN',
    secondaryStatus: 'WEAKENED',
    trapStatus: 'BURN',
    enemyAbilityLabel: 'Chorro de Escoria Fundida',
    bossAbilityLabel: 'Martillo del Crisol Ardiente',
  },
  templo_sumergido: {
    biomeGroup: 'FROZEN_DEPTHS',
    primaryStatus: 'FROST',
    secondaryStatus: 'CURSE',
    trapStatus: 'FROST',
    enemyAbilityLabel: 'Marea Abisal Helada',
    bossAbilityLabel: 'Vorágine de las Profundidades',
  },
  minas_abandonadas: {
    biomeGroup: 'INFERNAL_FORGE',
    primaryStatus: 'MARKED',
    secondaryStatus: 'BLEED',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Piqueta Quebrantahuesos',
    bossAbilityLabel: 'Derrumbe de la Veta Oscura',
  },
  castillo_del_verdugo: {
    biomeGroup: 'BLOOD_EXECUTION',
    primaryStatus: 'BLEED',
    secondaryStatus: 'FEAR',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Tajo de Guillotina',
    bossAbilityLabel: 'Sentencia del Cadalso',
  },
  bosque_de_los_susurros: {
    biomeGroup: 'TOXIC_WOODS',
    primaryStatus: 'CONFUSION',
    secondaryStatus: 'POISON',
    trapStatus: 'POISON',
    enemyAbilityLabel: 'Susurro Extraviador',
    bossAbilityLabel: 'Lamento del Roble Ahorcado',
  },
  alcantarillas_imperiales: {
    biomeGroup: 'TOXIC_WOODS',
    primaryStatus: 'POISON',
    secondaryStatus: 'WEAKENED',
    trapStatus: 'POISON',
    enemyAbilityLabel: 'Mordisco Infeccioso',
    bossAbilityLabel: 'Marea de Miasma Imperial',
  },
  biblioteca_prohibida: {
    biomeGroup: 'ARCANE_VOID',
    primaryStatus: 'CONFUSION',
    secondaryStatus: 'CURSE',
    trapStatus: 'CURSE',
    enemyAbilityLabel: 'Glifo de Amnesia Arcana',
    bossAbilityLabel: 'Lectura del Tomo Prohibido',
  },
  torre_del_astrologo: {
    biomeGroup: 'ARCANE_VOID',
    primaryStatus: 'CONFUSION',
    secondaryStatus: 'MARKED',
    trapStatus: 'CONFUSION',
    enemyAbilityLabel: 'Alineación Estelar Ciega',
    bossAbilityLabel: 'Colapso del Planetario',
  },
  la_colmena: {
    biomeGroup: 'TOXIC_WOODS',
    primaryStatus: 'POISON',
    secondaryStatus: 'MARKED',
    trapStatus: 'POISON',
    enemyAbilityLabel: 'Aguijón de Quitina',
    bossAbilityLabel: 'Enjambre Devorador',
  },
  cripta_de_cristal: {
    biomeGroup: 'FROZEN_DEPTHS',
    primaryStatus: 'FROST',
    secondaryStatus: 'BLEED',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Esquirla de Cuarzo Helado',
    bossAbilityLabel: 'Resonancia Prismática',
  },
  prision_maldita: {
    biomeGroup: 'CRYPT',
    primaryStatus: 'FEAR',
    secondaryStatus: 'CURSE',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Cadenas del Tormento',
    bossAbilityLabel: 'Alarido del Carcelero Eterno',
  },
  santuario_de_sangre: {
    biomeGroup: 'BLOOD_EXECUTION',
    primaryStatus: 'BLEED',
    secondaryStatus: 'CURSE',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Ritual de Desangrado',
    bossAbilityLabel: 'Comunión del Cáliz Carmesí',
  },
  ciudad_sepultada: {
    biomeGroup: 'CRYPT',
    primaryStatus: 'CURSE',
    secondaryStatus: 'WEAKENED',
    trapStatus: 'CURSE',
    enemyAbilityLabel: 'Plaga del Faraón de Arena',
    bossAbilityLabel: 'Tormenta de Ceniza Real',
  },
  palacio_de_los_espejos: {
    biomeGroup: 'ARCANE_VOID',
    primaryStatus: 'CONFUSION',
    secondaryStatus: 'FEAR',
    trapStatus: 'CONFUSION',
    enemyAbilityLabel: 'Reflejo Engañoso',
    bossAbilityLabel: 'Laberinto de Azogue',
  },
  cavernas_heladas: {
    biomeGroup: 'FROZEN_DEPTHS',
    primaryStatus: 'FROST',
    secondaryStatus: 'WEAKENED',
    trapStatus: 'FROST',
    enemyAbilityLabel: 'Aliento de Ventisca',
    bossAbilityLabel: 'Tempestad del Colmillo Blanco',
  },
  fortaleza_goblin: {
    biomeGroup: 'INFERNAL_FORGE',
    primaryStatus: 'BURN',
    secondaryStatus: 'MARKED',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Bomba de Brea Ardiente',
    bossAbilityLabel: 'Embestida del Caudillo',
  },
  cementerio_de_gigantes: {
    biomeGroup: 'CRYPT',
    primaryStatus: 'WEAKENED',
    secondaryStatus: 'FEAR',
    trapStatus: 'BLEED',
    enemyAbilityLabel: 'Pisotón Sísmico',
    bossAbilityLabel: 'Quebranto de los Titanes',
  },
  el_abismo: {
    biomeGroup: 'ARCANE_VOID',
    primaryStatus: 'CONFUSION',
    secondaryStatus: 'CURSE',
    trapStatus: 'FEAR',
    enemyAbilityLabel: 'Mirada de la Nada',
    bossAbilityLabel: 'Horizonte de Condenación',
  },
};

export function createStatusEffectInstance(
  effectType: CriptaStatusEffectType,
  targetPlayerId: string,
  sourceId = 'dungeon',
  turnNumber = 1,
  customTurns?: number,
  customPotency?: number
): CriptaPlayerStatusEffect {
  const def = CRIPTA_STATUS_EFFECTS_REGISTRY[effectType];
  return {
    id: `status_${effectType.toLowerCase()}_${targetPlayerId}`,
    effectType,
    name: def.name,
    code: def.code,
    type: def.type,
    sourceId,
    targetPlayerId,
    remainingTurns: customTurns ?? def.defaultTurns,
    stacks: 1,
    potency: customPotency ?? def.defaultPotency,
    appliedAtTurn: turnNumber,
  };
}

/**
 * Authoritatively applies or stacks a status effect on a living player.
 */
export function applyStatusEffectToPlayer(
  player: CriptaPlayer,
  effectType: CriptaStatusEffectType,
  sourceId = 'enemy',
  turnNumber = 1,
  customTurns?: number
): CriptaPlayerStatusEffect | null {
  if (player.isDead || player.hp <= 0) return null;

  const def = CRIPTA_STATUS_EFFECTS_REGISTRY[effectType];
  if (!def) return null;

  const existing = player.statuses.find((s) => s.effectType === effectType);
  const turnsToSet = customTurns ?? def.defaultTurns;

  if (existing) {
    if (def.stackRule === 'STACK_INTENSITY') {
      existing.stacks = Math.min(def.maxStacks, (existing.stacks || 1) + 1);
      existing.remainingTurns = Math.max(existing.remainingTurns, turnsToSet);
    } else if (def.stackRule === 'EXTEND_DURATION') {
      existing.remainingTurns = Math.min(6, existing.remainingTurns + turnsToSet);
    } else {
      // REFRESH
      existing.remainingTurns = Math.max(existing.remainingTurns, turnsToSet);
    }
    existing.appliedAtTurn = turnNumber;
    return existing;
  }

  const created = createStatusEffectInstance(
    effectType,
    player.id,
    sourceId,
    turnNumber,
    turnsToSet
  );
  player.statuses.push(created);
  return created;
}

/**
 * Removes negative debuffs from a player (or a specific count of debuffs).
 */
export function purifyPlayerDebuffs(player: CriptaPlayer, maxToRemove = 99): string[] {
  const removedNames: string[] = [];
  const kept: CriptaPlayerStatusEffect[] = [];

  for (const st of player.statuses) {
    if (st.type === 'debuff' && removedNames.length < maxToRemove) {
      removedNames.push(st.name);
    } else {
      kept.push(st);
    }
  }

  player.statuses = kept;
  return removedNames;
}

/**
 * Checks if a player currently has a specific status effect active.
 */
export function playerHasStatus(
  player: CriptaPlayer,
  effectType: CriptaStatusEffectType
): CriptaPlayerStatusEffect | undefined {
  return player.statuses.find(
    (s) => s.effectType === effectType && (s.remainingTurns > 0 || s.type === 'relic')
  );
}

/**
 * Resolves end-of-turn status effect ticks (POISON, BURN, BLEED, REGENERATION)
 * and decrements remainingTurns for turn-based effects on a player.
 */
export function resolvePlayerTurnEndStatusTicks(player: CriptaPlayer): {
  logSegments: string[];
  diedFromStatus: boolean;
  damageTaken: number;
  healedAmount: number;
} {
  if (player.isDead || player.hp <= 0) {
    return { logSegments: [], diedFromStatus: false, damageTaken: 0, healedAmount: 0 };
  }

  const logSegments: string[] = [];
  let diedFromStatus = false;
  let damageTaken = 0;
  let healedAmount = 0;

  for (const st of player.statuses) {
    if (player.hp <= 0) break;

    if (st.effectType === 'POISON') {
      const dmg = st.potency * Math.max(1, st.stacks);
      player.hp = Math.max(0, player.hp - dmg);
      damageTaken += dmg;
      logSegments.push(`${player.name} sufre -${dmg} PV por VENENO`);
    } else if (st.effectType === 'BURN') {
      const dmg = st.potency;
      player.hp = Math.max(0, player.hp - dmg);
      player.armor = Math.max(0, player.armor - 1);
      damageTaken += dmg;
      logSegments.push(`${player.name} sufre -${dmg} PV y -1 ARMADURA por QUEMADURA`);
    } else if (st.effectType === 'BLEED') {
      const dmg = st.potency * Math.max(1, st.stacks);
      player.hp = Math.max(0, player.hp - dmg);
      damageTaken += dmg;
      logSegments.push(`${player.name} pierde -${dmg} PV por SANGRADO`);
    } else if (st.effectType === 'REGENERATION') {
      const heal = st.potency;
      const before = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      if (player.hp > before) {
        healedAmount += player.hp - before;
        logSegments.push(`${player.name} recupera +${player.hp - before} PV por REGENERACIÓN`);
      }
    }

    // Decrement turn counter for non-expedition statuses
    const def = CRIPTA_STATUS_EFFECTS_REGISTRY[st.effectType];
    if (!def || def.durationRule !== 'EXPEDITION') {
      st.remainingTurns -= 1;
    }
  }

  // Filter out expired statuses
  player.statuses = player.statuses.filter((st) => {
    const def = CRIPTA_STATUS_EFFECTS_REGISTRY[st.effectType];
    if (def?.durationRule === 'EXPEDITION') return true;
    return st.remainingTurns > 0;
  });

  if (player.hp <= 0) {
    player.hp = 0;
    player.isDead = true;
    player.deathsCount = (player.deathsCount || 0) + 1;
    // Clear temporary combat statuses upon death
    player.statuses = [];
    diedFromStatus = true;
    logSegments.push(`¡${player.name} ha sucumbido a sus aflicciones y ha CAÍDO!`);
  }

  return { logSegments, diedFromStatus, damageTaken, healedAmount };
}
