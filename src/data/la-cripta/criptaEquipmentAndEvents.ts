import type {
  CriptaAccessoryDefinition,
  CriptaAccessoryId,
  CriptaAcquiredRelic,
  CriptaArmorDefinition,
  CriptaArmorId,
  CriptaCanonicalRoomType,
  CriptaCharacterId,
  CriptaDamageType,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaEncounterSubjectArchetype,
  CriptaPlayer,
  CriptaRoomEnemy,
  CriptaRoomInteractiveObject,
  CriptaStatusEffectType,
  CriptaWeaponDefinition,
  CriptaWeaponId,
  CriptaWeaponRuneDefinition,
  CriptaWeaponRuneId,
} from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from './criptaCatalog';
import { playerHasStatus } from './criptaStatusEffects';
import { playerHasRelic } from './criptaItemsAndRelics';

export const WEAPON_UPGRADE_MAX_LEVEL = 3;

export const STARTER_WEAPON_BY_CLASS: Record<CriptaCharacterId, CriptaWeaponId> = {
  caballero: 'espada_oxidada',
  mago: 'baston_ceniza',
  picaro: 'dagas_melladas',
  cazador: 'arco_cazador',
  clerigo: 'maza_consagrada',
  alquimista: 'lanzador_alquimico',
  barbaro: 'gran_hacha_barbara',
  bardo: 'laud_resonancia_arcana',
  nigromante: 'guadana_de_hueso',
};

export const STARTER_RUNE_BY_CLASS: Record<CriptaCharacterId, CriptaWeaponRuneId> = {
  caballero: 'runa_plomo_contundente',
  mago: 'runa_brasa_infernal',
  picaro: 'runa_toxina_abisal',
  cazador: 'runa_escarcha_permafrost',
  clerigo: 'runa_luz_consagrada',
  alquimista: 'runa_vacio_umbrio',
  barbaro: 'runa_aguja_perforante',
  bardo: 'runa_resonancia_astral',
  nigromante: 'runa_vacio_umbrio',
};

export const ALL_WEAPON_RUNE_IDS: CriptaWeaponRuneId[] = [
  'runa_brasa_infernal',
  'runa_escarcha_permafrost',
  'runa_luz_consagrada',
  'runa_plomo_contundente',
  'runa_toxina_abisal',
  'runa_vacio_umbrio',
  'runa_aguja_perforante',
  'runa_resonancia_astral',
];

export const CRIPTA_WEAPON_RUNES_REGISTRY: Record<
  CriptaWeaponRuneId,
  CriptaWeaponRuneDefinition
> = {
  runa_brasa_infernal: {
    id: 'runa_brasa_infernal',
    name: 'Runa de Brasa Infernal',
    subtitle: 'INFUSIÓN ÍGNEA DE CRISOL',
    rarity: 'RARE',
    infusedDamageType: 'FUEGO',
    secondaryDamageType: 'ALQUIMICO',
    iconKind: 'rune_fire',
    benefitText: 'Convierte el daño del arma a FUEGO (+12% Daño Base) y aplica QUEMADURA al impactar.',
    tradeoffText: 'Contrapartida: -10% Prob. de Crítico por el peso incandescente de la hoja.',
    damageMultiplierDelta: 0.12,
    critBonusDeltaPct: -10,
    onHitStatus: 'BURN',
    basePriceGold: 48,
    accentColor: '#FF7A33',
  },
  runa_escarcha_permafrost: {
    id: 'runa_escarcha_permafrost',
    name: 'Runa de Escarcha Eterna',
    subtitle: 'INFUSIÓN GLACIAL DE CONTROL',
    rarity: 'RARE',
    infusedDamageType: 'HIELO',
    secondaryDamageType: 'MAGICO',
    iconKind: 'rune_ice',
    benefitText: 'Convierte el daño a HIELO, aplica ESCARCHA (-18% daño enemigo) y otorga +2 DEFENSA.',
    tradeoffText: 'Contrapartida: -12% Daño directo (prioriza mitigación y control sobre daño explosivo).',
    damageMultiplierDelta: -0.12,
    bonusDefenseDelta: 2,
    onHitStatus: 'FROST',
    basePriceGold: 46,
    accentColor: '#7BDFF2',
  },
  runa_luz_consagrada: {
    id: 'runa_luz_consagrada',
    name: 'Runa del Sol Consagrado',
    subtitle: 'INFUSIÓN LITÚRGICA DEL ALBA',
    rarity: 'RARE',
    infusedDamageType: 'SAGRADO',
    iconKind: 'rune_holy',
    benefitText: 'Convierte el daño a SAGRADO (+10% Daño Base) y la Técnica de Arma sana +4 PV al grupo.',
    tradeoffText: 'Contrapartida: -8% Prob. de Crítico y purifica la hoja (no aplica Sangrado ni Veneno).',
    damageMultiplierDelta: 0.1,
    critBonusDeltaPct: -8,
    specialHealParty: 4,
    executeBonusPctVsHalfHp: 20,
    disablesBleedAndPoison: true,
    basePriceGold: 52,
    accentColor: '#FFD166',
  },
  runa_plomo_contundente: {
    id: 'runa_plomo_contundente',
    name: 'Runa de Plomo Quebrantahuesos',
    subtitle: 'INFUSIÓN DE IMPACTO CONTUNDENTE',
    rarity: 'UNCOMMON',
    infusedDamageType: 'CONTUNDENTE',
    iconKind: 'rune_blunt',
    benefitText: 'Convierte el daño a CONTUNDENTE e ignora +3 de Armadura enemiga (letal contra Esqueletos y Gólems).',
    tradeoffText: 'Contrapartida: -12% Prob. de Crítico y +1 ronda de enfriamiento en la Técnica de Arma.',
    critBonusDeltaPct: -12,
    armorPierceBonus: 3,
    specialCooldownDelta: 1,
    basePriceGold: 42,
    accentColor: '#D9D0BC',
  },
  runa_toxina_abisal: {
    id: 'runa_toxina_abisal',
    name: 'Runa de Colmillo Micótico',
    subtitle: 'INFUSIÓN ALQUÍMICA CORROSIVA',
    rarity: 'UNCOMMON',
    infusedDamageType: 'VENENO',
    secondaryDamageType: 'ALQUIMICO',
    iconKind: 'rune_poison',
    benefitText: 'Convierte el daño a VENENO / ALQUÍMICO, aplica VENENO en cada golpe y CORROSIÓN en críticos.',
    tradeoffText: 'Contrapartida: -16% Daño directo inicial (convierte el golpe en desgaste prolongado).',
    damageMultiplierDelta: -0.16,
    extraPoisonStacksOnHit: 1,
    onHitStatus: 'POISON',
    onCritStatus: 'CORROSION',
    basePriceGold: 44,
    accentColor: '#5EA87A',
  },
  runa_vacio_umbrio: {
    id: 'runa_vacio_umbrio',
    name: 'Runa del Vacío Umbrío',
    subtitle: 'INFUSIÓN ABISAL PROHIBIDA',
    rarity: 'LEGENDARY',
    infusedDamageType: 'SOMBRA',
    secondaryDamageType: 'MAGICO',
    iconKind: 'rune_shadow',
    benefitText: 'Convierte el daño a SOMBRA (+22% Daño Total) y aplica MALDICIÓN en golpes críticos.',
    tradeoffText: 'Contrapartida: -1 DEFENSA y usar la Técnica de Arma drena -3 PV del portador.',
    damageMultiplierDelta: 0.22,
    bonusDefenseDelta: -1,
    specialHpCost: 3,
    onCritStatus: 'CURSE',
    basePriceGold: 64,
    accentColor: '#C77DFF',
  },
  runa_aguja_perforante: {
    id: 'runa_aguja_perforante',
    name: 'Runa de Aguja Carmesí',
    subtitle: 'INFUSIÓN DE PRECISIÓN LETAL',
    rarity: 'RARE',
    infusedDamageType: 'PERFORANTE',
    iconKind: 'rune_pierce',
    benefitText: 'Convierte el daño a PERFORANTE, otorga +16% Prob. de Crítico y aplica SANGRADO al impactar.',
    tradeoffText: 'Contrapartida: -20% Daño contra enemigos blindados (DEF ≥ 4) si el golpe no es Crítico.',
    critBonusDeltaPct: 16,
    onHitStatus: 'BLEED',
    heavyArmorNonCritPenaltyPct: 20,
    basePriceGold: 50,
    accentColor: '#FF4D6D',
  },
  runa_resonancia_astral: {
    id: 'runa_resonancia_astral',
    name: 'Runa de Resonancia Astral',
    subtitle: 'INFUSIÓN CELESTE DE PRISMA',
    rarity: 'LEGENDARY',
    infusedDamageType: 'ASTRAL',
    secondaryDamageType: 'MAGICO',
    iconKind: 'rune_astral',
    benefitText: 'Convierte el daño a ASTRAL (+2 MAGIA) y añade +35% de tu MAGIA al daño del arma.',
    tradeoffText: 'Contrapartida: -2 ATAQUE físico base.',
    bonusMagicDelta: 2,
    bonusAttackDelta: -2,
    magicScalingBonusPct: 35,
    basePriceGold: 62,
    accentColor: '#69A8A5',
  },
};

export function pickUnownedWeaponRune(
  seed: number,
  step: number,
  ownedRuneIds: CriptaWeaponRuneId[] = []
): CriptaWeaponRuneId {
  const unowned = ALL_WEAPON_RUNE_IDS.filter((id) => !ownedRuneIds.includes(id));
  const pool = unowned.length > 0 ? unowned : ALL_WEAPON_RUNE_IDS;
  const idx = Math.abs((seed + step * 37) | 0) % pool.length;
  return pool[idx];
}

export const CRIPTA_WEAPONS_REGISTRY: Record<CriptaWeaponId, CriptaWeaponDefinition> = {
  espada_oxidada: {
    id: 'espada_oxidada',
    name: 'Espada Oxidada',
    family: 'SWORD',
    rarity: 'COMMON',
    preferredClasses: ['caballero', 'picaro'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 4,
    baseMaxDamage: 6,
    specialEffectText: 'Hoja de acero templado con barrido horizontal.',
    specialAttack: {
      id: 'barrido_acero',
      name: 'Barrido',
      description: 'Tajo amplio que golpea hasta a 2 enemigos adyacentes.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.82,
    },
    basePriceGold: 35,
    accentColor: '#D8C6A0',
  },
  baston_ceniza: {
    id: 'baston_ceniza',
    name: 'Bastón de Ceniza',
    family: 'STAFF',
    rarity: 'COMMON',
    preferredClasses: ['mago', 'clerigo'],
    scalingStat: 'MAGIA',
    baseMinDamage: 5,
    baseMaxDamage: 7,
    bonusMagic: 1,
    specialEffectText: 'Canaliza proyectiles arcanos que ignoran parte de la armadura física.',
    specialAttack: {
      id: 'cadena_arcana',
      name: 'Cadena Arcana',
      description: 'Impacta al objetivo principal y salta a un segundo enemigo.',
      targetRule: 'CHAIN_2',
      cooldownRounds: 2,
      damageMultiplier: 0.9,
      secondaryMultiplier: 0.6,
    },
    basePriceGold: 38,
    accentColor: '#9B72CF',
  },
  dagas_melladas: {
    id: 'dagas_melladas',
    name: 'Dagas Melladas',
    family: 'DAGGER',
    rarity: 'COMMON',
    preferredClasses: ['picaro', 'alquimista'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 4,
    baseMaxDamage: 6,
    critBonusPct: 12,
    specialEffectText: '+12% probabilidad de Crítico. Cortes veloces a puntos vitales.',
    specialAttack: {
      id: 'doble_filo',
      name: 'Doble Filo',
      description: 'Doble cuchillada que perfora 2 de armadura y aplica SANGRADO.',
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 1.15,
      armorPierce: 2,
      appliesStatus: 'BLEED',
    },
    basePriceGold: 36,
    accentColor: '#C93B5B',
  },
  arco_cazador: {
    id: 'arco_cazador',
    name: 'Arco de Tejo',
    family: 'BOW',
    rarity: 'COMMON',
    preferredClasses: ['cazador', 'picaro'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 4,
    baseMaxDamage: 6,
    critBonusPct: 8,
    specialEffectText: 'Disparo preciso a distancia (+8% Crítico).',
    specialAttack: {
      id: 'lluvia_de_flechas',
      name: 'Lluvia de Flechas',
      description: 'Alcanza a todos los enemigos de la sala con una descarga de flechas.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 0.72,
    },
    basePriceGold: 38,
    accentColor: '#5EA87A',
  },
  maza_consagrada: {
    id: 'maza_consagrada',
    name: 'Maza Consagrada',
    family: 'MACE',
    rarity: 'COMMON',
    preferredClasses: ['clerigo', 'caballero'],
    scalingStat: 'MAGIA',
    baseMinDamage: 4,
    baseMaxDamage: 6,
    bonusMagic: 1,
    healBoostPct: 15,
    specialEffectText: '+15% curación sagrada. Escala con MAGIA.',
    specialAttack: {
      id: 'onda_sagrada',
      name: 'Onda Sagrada',
      description: 'Castiga al enemigo con luz consagrada y restaura +4–6 PV al grupo.',
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 0.95,
      partyHealBase: 5,
    },
    basePriceGold: 38,
    accentColor: '#FFD166',
  },
  lanzador_alquimico: {
    id: 'lanzador_alquimico',
    name: 'Lanzador Alquímico',
    family: 'ALCHEMICAL',
    rarity: 'COMMON',
    preferredClasses: ['alquimista', 'cazador'],
    scalingStat: 'MAGIA',
    baseMinDamage: 4,
    baseMaxDamage: 6,
    bonusMagic: 1,
    potionBoostPct: 15,
    specialEffectText: '+15% eficacia de pociones. Proyectiles alquímicos volátiles.',
    specialAttack: {
      id: 'frasco_explosivo',
      name: 'Frasco Explosivo',
      description: 'Estalla sobre todos los enemigos y aplica VENENO.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 2,
      damageMultiplier: 0.7,
      appliesStatus: 'POISON',
    },
    basePriceGold: 38,
    accentColor: '#69A8A5',
  },
  espada_del_sepulcro: {
    id: 'espada_del_sepulcro',
    name: 'Espada del Sepulcro',
    family: 'SWORD',
    rarity: 'UNCOMMON',
    preferredClasses: ['caballero', 'picaro'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusAttack: 1,
    undeadBonusPct: 20,
    specialEffectText: '+20% daño adicional contra no-muertos y guardianes de cripta.',
    specialAttack: {
      id: 'barrido_sepulcral',
      name: 'Barrido Sepulcral',
      description: 'Golpea hasta a 2 enemigos con filo sepulcral.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.88,
    },
    basePriceGold: 62,
    accentColor: '#E7A54A',
  },
  espadon_del_rey_hundido: {
    id: 'espadon_del_rey_hundido',
    name: 'Espadón del Rey Hundido',
    family: 'SWORD',
    rarity: 'RARE',
    preferredClasses: ['caballero'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 7,
    baseMaxDamage: 9,
    bonusAttack: 2,
    onCritStatus: 'CURSE',
    specialEffectText: 'Los golpes críticos debilitan al enemigo y perforan su guardia.',
    specialAttack: {
      id: 'tajo_real',
      name: 'Tajo del Soberano',
      description: 'Mandoble devastador sobre hasta 2 enemigos que ignora 2 de armadura.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.92,
      armorPierce: 2,
    },
    basePriceGold: 88,
    accentColor: '#FFD166',
  },
  hacha_forja_infernal: {
    id: 'hacha_forja_infernal',
    name: 'Hacha de la Forja Infernal',
    family: 'AXE',
    rarity: 'RARE',
    preferredClasses: ['caballero', 'cazador'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 7,
    baseMaxDamage: 9,
    bonusAttack: 2,
    specialEffectText: 'Filo incandescente forjado en brasas abisales.',
    specialAttack: {
      id: 'hendidura_ignea',
      name: 'Hendidura Ígnea',
      description: 'Golpea hasta a 2 enemigos con fuego de forja.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.9,
      appliesStatus: 'BURN',
    },
    basePriceGold: 84,
    accentColor: '#E76F38',
  },
  vara_de_cristal_astral: {
    id: 'vara_de_cristal_astral',
    name: 'Vara de Cristal Astral',
    family: 'STAFF',
    rarity: 'UNCOMMON',
    preferredClasses: ['mago', 'clerigo', 'alquimista'],
    scalingStat: 'MAGIA',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusMagic: 2,
    specialEffectText: 'Cristal resonante que amplifica hechizos y canalizaciones.',
    specialAttack: {
      id: 'cadena_astral',
      name: 'Cadena Astral',
      description: 'Rayo prismático que salta entre 2 enemigos.',
      targetRule: 'CHAIN_2',
      cooldownRounds: 2,
      damageMultiplier: 0.95,
      secondaryMultiplier: 0.65,
    },
    basePriceGold: 66,
    accentColor: '#69A8A5',
  },
  grimorio_prohibido_arma: {
    id: 'grimorio_prohibido_arma',
    name: 'Códice de las Sombras',
    family: 'STAFF',
    rarity: 'RARE',
    preferredClasses: ['mago'],
    scalingStat: 'MAGIA',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusMagic: 3,
    specialEffectText: 'Tomo arcano ancestral de alto poder destructivo.',
    specialAttack: {
      id: 'tormenta_del_vacio',
      name: 'Tormenta del Vacío',
      description: 'Desata energía abisal sobre todos los enemigos de la sala.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 0.82,
    },
    basePriceGold: 92,
    accentColor: '#9B72CF',
  },
  hojas_colmillo_venenoso: {
    id: 'hojas_colmillo_venenoso',
    name: 'Colmillos de Víbora',
    family: 'DAGGER',
    rarity: 'UNCOMMON',
    preferredClasses: ['picaro', 'alquimista'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusAttack: 1,
    critBonusPct: 16,
    onHitStatus: 'POISON',
    specialEffectText: 'Hojas impregnadas en toxina que envenenan al impactar (+16% Crítico).',
    specialAttack: {
      id: 'danza_de_colmillos',
      name: 'Danza de Colmillos',
      description: 'Acuchilla hasta a 2 enemigos aplicando VENENO.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.88,
      appliesStatus: 'POISON',
    },
    basePriceGold: 65,
    accentColor: '#5EA87A',
  },
  arco_de_espinas: {
    id: 'arco_de_espinas',
    name: 'Arco de Espinas',
    family: 'BOW',
    rarity: 'UNCOMMON',
    preferredClasses: ['cazador'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusAttack: 1,
    critBonusPct: 12,
    specialEffectText: 'Flechas espinosas que desgarran las defensas enemigas.',
    specialAttack: {
      id: 'lluvia_de_espinas',
      name: 'Lluvia de Espinas',
      description: 'Hiere a todos los enemigos y aplica SANGRADO.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 0.78,
      appliesStatus: 'BLEED',
    },
    basePriceGold: 66,
    accentColor: '#5EA87A',
  },
  ballesta_de_asedio: {
    id: 'ballesta_de_asedio',
    name: 'Ballesta de Asedio',
    family: 'CROSSBOW',
    rarity: 'RARE',
    preferredClasses: ['cazador', 'picaro'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusAttack: 2,
    specialEffectText: 'Virotes pesados diseñados para perforar corazas de hierro.',
    specialAttack: {
      id: 'virote_perforante',
      name: 'Virote Perforante',
      description: 'Disparo brutal que ignora 3 de armadura y golpea hasta a 2 enemigos.',
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.92,
      armorPierce: 3,
    },
    basePriceGold: 86,
    accentColor: '#E7A54A',
  },
  simbolo_del_alba: {
    id: 'simbolo_del_alba',
    name: 'Cetro del Alba Sagrada',
    family: 'MACE',
    rarity: 'RARE',
    preferredClasses: ['clerigo'],
    scalingStat: 'MAGIA',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusMagic: 2,
    bonusDefense: 1,
    healBoostPct: 25,
    specialEffectText: '+25% curación sagrada y +1 DEFENSA. Bendice los conjuros del Clérigo.',
    specialAttack: {
      id: 'luz_del_alba',
      name: 'Luz del Alba',
      description: 'Purga a los enemigos y restaura +7–9 PV a todo el grupo.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 2,
      damageMultiplier: 0.75,
      partyHealBase: 8,
    },
    basePriceGold: 85,
    accentColor: '#FFD166',
  },
  catalizador_esporas: {
    id: 'catalizador_esporas',
    name: 'Catalizador Micótico',
    family: 'ALCHEMICAL',
    rarity: 'RARE',
    preferredClasses: ['alquimista'],
    scalingStat: 'MAGIA',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusMagic: 2,
    potionBoostPct: 25,
    onHitStatus: 'POISON',
    specialEffectText: '+25% potencia de pociones y aplica esporas tóxicas al golpear.',
    specialAttack: {
      id: 'bomba_micotica',
      name: 'Bomba Micótica',
      description: 'Detona esporas corrosivas sobre todos los enemigos.',
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 2,
      damageMultiplier: 0.8,
      appliesStatus: 'POISON',
    },
    basePriceGold: 82,
    accentColor: '#5EA87A',
  },
  pico_de_minero_runico: {
    id: 'pico_de_minero_runico',
    name: 'Pico de Minero Rúnico',
    family: 'PICKAXE',
    rarity: 'UNCOMMON',
    preferredClasses: ['caballero', 'cazador', 'alquimista'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusAttack: 1,
    bonusDefense: 1,
    specialEffectText: 'Perfora roca y armadura. Desbloquea pasadizos y grietas en eventos.',
    specialAttack: {
      id: 'golpe_sismico',
      name: 'Golpe Sísmico',
      description: 'Quiebra el suelo frente a 2 enemigos ignorando 2 de armadura.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 0.86,
      armorPierce: 2,
    },
    basePriceGold: 58,
    accentColor: '#D8C6A0',
  },
  alabarda_del_juramento: {
    id: 'alabarda_del_juramento',
    name: 'Alabarda del Juramento',
    family: 'HALBERD',
    rarity: 'LEGENDARY',
    preferredClasses: ['caballero'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 8,
    baseMaxDamage: 12,
    bonusAttack: 3,
    bonusDefense: 2,
    specialEffectText: '+3 ATAQUE, +2 DEFENSA. Rompe escudos y otorga Guardia al golpear.',
    specialAttack: {
      id: 'barrido_del_bastion',
      name: 'Barrido del Bastión',
      description: 'Tajo semicircular a todos los enemigos, destruye 3 DEF y otorga +6 Escudo al grupo.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 1.05,
      armorBreak: 3,
      partyShieldBase: 6,
    },
    basePriceGold: 96,
    accentColor: '#FFD166',
  },
  cetro_del_eclipse: {
    id: 'cetro_del_eclipse',
    name: 'Cetro del Eclipse Abisal',
    family: 'STAFF',
    rarity: 'LEGENDARY',
    preferredClasses: ['mago'],
    scalingStat: 'MAGIA',
    baseMinDamage: 8,
    baseMaxDamage: 11,
    bonusMagic: 3,
    critBonusPct: 12,
    onHitStatus: 'BURN',
    specialEffectText: '+3 MAGIA, +12% Crítico. Canaliza fuego estelar que ignora resistencias.',
    specialAttack: {
      id: 'supernova_del_umbral',
      name: 'Supernova del Umbral',
      description: 'Explosión astral sobre todos los enemigos que ignora armadura y aplica Quemadura.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 1.15,
      armorPierce: 5,
      appliesStatus: 'BURN',
    },
    basePriceGold: 98,
    accentColor: '#C77DFF',
  },
  estoque_carmesi: {
    id: 'estoque_carmesi',
    name: 'Estoque Carmesí',
    family: 'DAGGER',
    rarity: 'RARE',
    preferredClasses: ['picaro'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusAttack: 2,
    critBonusPct: 18,
    onHitStatus: 'BLEED',
    specialEffectText: '+2 ATAQUE, +18% Crítico. Perfora arterias aplicando Sangrado al golpear.',
    specialAttack: {
      id: 'estocada_imperial',
      name: 'Estocada Imperial',
      description: 'Golpe de precisión que ignora toda la DEF enemiga y aplica Marcado + Sangrado.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 1.38,
      armorPierce: 8,
      appliesStatus: 'MARKED',
    },
    basePriceGold: 84,
    accentColor: '#FF4D6D',
  },
  guadana_del_verdugo: {
    id: 'guadana_del_verdugo',
    name: 'Guadaña de Sombra Real',
    family: 'DAGGER',
    rarity: 'LEGENDARY',
    preferredClasses: ['picaro', 'cazador'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 9,
    baseMaxDamage: 12,
    bonusAttack: 3,
    critBonusPct: 20,
    onCritStatus: 'BLEED',
    specialEffectText: '+3 ATAQUE, +20% Crítico. Ejecuta objetivos con Veneno, Sangrado o Marca.',
    specialAttack: {
      id: 'cosecha_de_almas',
      name: 'Cosecha de Sombras',
      description: 'Segado letal a 2 objetivos que drena vitalidad (+5 PV al grupo) y aplica Sangrado.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'CLEAVE_2',
      cooldownRounds: 3,
      damageMultiplier: 1.18,
      armorPierce: 4,
      partyHealBase: 5,
      appliesStatus: 'BLEED',
    },
    basePriceGold: 98,
    accentColor: '#E01E5A',
  },
  relicario_serafin: {
    id: 'relicario_serafin',
    name: 'Relicario del Serafín',
    family: 'RELIC_TOME',
    rarity: 'LEGENDARY',
    preferredClasses: ['clerigo'],
    scalingStat: 'MAGIA',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusMagic: 3,
    bonusDefense: 2,
    healBoostPct: 35,
    specialEffectText: '+3 MAGIA, +2 DEFENSA y +35% curación sagrada.',
    specialAttack: {
      id: 'milagro_solar',
      name: 'Milagro del Sol Negro',
      description: 'Restaura +12 PV y +6 Escudo a todo el grupo mientras purga a los enemigos.',
      category: 'HEAL',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 0.85,
      partyHealBase: 12,
      partyShieldBase: 6,
    },
    basePriceGold: 95,
    accentColor: '#FFD166',
  },
  martillo_del_juicio: {
    id: 'martillo_del_juicio',
    name: 'Martillo del Juicio Consagrado',
    family: 'MACE',
    rarity: 'UNCOMMON',
    preferredClasses: ['clerigo', 'caballero'],
    scalingStat: 'MAGIA',
    baseMinDamage: 6,
    baseMaxDamage: 8,
    bonusMagic: 1,
    bonusDefense: 2,
    undeadBonusPct: 25,
    specialEffectText: '+2 DEFENSA, +1 MAGIA y +25% daño a no-muertos.',
    specialAttack: {
      id: 'sentencia_de_luz',
      name: 'Sentencia de Luz',
      description: 'Golpe sagrado que quebranta 3 de armadura enemiga y sana +6 PV al grupo.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 1.15,
      armorBreak: 3,
      partyHealBase: 6,
    },
    basePriceGold: 62,
    accentColor: '#F4A261',
  },
  canon_de_azufre: {
    id: 'canon_de_azufre',
    name: 'Cañón de Azufre Rúnico',
    family: 'CROSSBOW',
    rarity: 'LEGENDARY',
    preferredClasses: ['cazador'],
    scalingStat: 'ATAQUE',
    baseMinDamage: 9,
    baseMaxDamage: 13,
    bonusAttack: 3,
    critBonusPct: 15,
    specialEffectText: '+3 ATAQUE, +15% Crítico. Sus proyectiles destrozan cualquier coraza.',
    specialAttack: {
      id: 'disparo_de_asedio',
      name: 'Andanada de Asedio',
      description: 'Bombardeo perforante sobre todos los enemigos que ignora 5 de DEF y aplica Marcado.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 1.08,
      armorPierce: 5,
      armorBreak: 3,
      appliesStatus: 'MARKED',
    },
    basePriceGold: 96,
    accentColor: '#5EA87A',
  },
  guantelete_mutageno: {
    id: 'guantelete_mutageno',
    name: 'Inyector de Mutágeno Real',
    family: 'ALCHEMICAL',
    rarity: 'LEGENDARY',
    preferredClasses: ['alquimista'],
    scalingStat: 'MAGIA',
    baseMinDamage: 7,
    baseMaxDamage: 11,
    bonusMagic: 3,
    potionBoostPct: 35,
    onHitStatus: 'POISON',
    specialEffectText: '+3 MAGIA, +35% potencia de pociones. Inyecta toxinas corrosivas en cada golpe.',
    specialAttack: {
      id: 'cataclismo_quimico',
      name: 'Cataclismo Químico',
      description: 'Bomba alquímica sobre todos los enemigos (+Veneno y +Quemadura) y sana +8 PV al grupo.',
      category: 'DEBUFF',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 0.98,
      appliesStatus: 'POISON',
      partyHealBase: 8,
    },
    basePriceGold: 94,
    accentColor: '#80FF72',
  },
  gran_hacha_barbara: {
    id: 'gran_hacha_barbara',
    name: 'Gran Hacha de Guerra Bárbara',
    family: 'AXE',
    rarity: 'COMMON',
    preferredClasses: ['barbaro'],
    scalingStat: 'ATAQUE',
    baseDamageType: 'FISICO',
    secondaryDamageType: 'CONTUNDENTE',
    weaponArchetypeLabel: 'Gran Hacha de Dos Manos',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusAttack: 2,
    bonusWillpower: 1,
    critBonusPct: 6,
    onHitStatus: 'BLEED',
    specialEffectText: '+2 ATAQUE, +1 VOLUNTAD. Genera +20 Furia y fractura armaduras al impactar.',
    specialAttack: {
      id: 'tajo_desgarrador_furia',
      name: 'Tajo Desgarrador',
      description: 'Barrido salvaje a 2 enemigos que perfora 3 de DEF, aplica Sangrado y genera +20 Furia.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 1.15,
      armorPierce: 3,
      armorBreak: 2,
      appliesStatus: 'BLEED',
    },
    basePriceGold: 46,
    accentColor: '#D94E34',
  },
  mazo_colosal_rompecraneos: {
    id: 'mazo_colosal_rompecraneos',
    name: 'Mazo Colosal Rompecráneos',
    family: 'MACE',
    rarity: 'RARE',
    preferredClasses: ['barbaro', 'caballero'],
    scalingStat: 'ATAQUE',
    baseDamageType: 'CONTUNDENTE',
    secondaryDamageType: 'FISICO',
    weaponArchetypeLabel: 'Martillo de Guerra Colosal',
    baseMinDamage: 9,
    baseMaxDamage: 13,
    bonusAttack: 3,
    bonusDefense: 1,
    bonusWillpower: 1,
    armorPierceBonus: 3,
    onHitStatus: 'VULNERABLE',
    specialEffectText: '+3 ATAQUE, +1 DEFENSA, +3 Penetración de Armadura. Demuele corazas pesadas.',
    specialAttack: {
      id: 'impacto_rompecraneos',
      name: 'Impacto Rompecráneos',
      description: 'Golpe sísmico que ignora 5 de DEF, destruye 4 de Armadura y aplica Vulnerable.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 1.35,
      armorPierce: 5,
      armorBreak: 4,
      appliesStatus: 'VULNERABLE',
    },
    basePriceGold: 86,
    accentColor: '#E76F38',
  },
  laud_resonancia_arcana: {
    id: 'laud_resonancia_arcana',
    name: 'Laúd Resonador de Bronce',
    family: 'INSTRUMENT',
    rarity: 'COMMON',
    preferredClasses: ['bardo'],
    scalingStat: 'MAGIA',
    secondaryScalingStat: 'VOLUNTAD',
    baseDamageType: 'ASTRAL',
    secondaryDamageType: 'MAGICO',
    weaponArchetypeLabel: 'Instrumento Arcano',
    baseMinDamage: 5,
    baseMaxDamage: 8,
    bonusMagic: 2,
    bonusAgility: 2,
    bonusWillpower: 1,
    healBoostPct: 15,
    onHitStatus: 'WEAKENED',
    specialEffectText: '+2 MAGIA, +2 AGILIDAD, +1 VOLUNTAD. Sus acordes debilitan enemigos e inspiran al grupo.',
    specialAttack: {
      id: 'acorde_de_cadencia',
      name: 'Acorde de Cadencia',
      description: 'Onda armónica a todos los enemigos que aplica Debilitado y otorga +4 Escudo al grupo.',
      category: 'BUFF',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 2,
      damageMultiplier: 0.92,
      appliesStatus: 'WEAKENED',
      partyShieldBase: 4,
      partyHealBase: 5,
    },
    basePriceGold: 46,
    accentColor: '#38B2AC',
  },
  viola_del_eclipse: {
    id: 'viola_del_eclipse',
    name: 'Viola del Eclipse Astral',
    family: 'INSTRUMENT',
    rarity: 'LEGENDARY',
    preferredClasses: ['bardo', 'mago'],
    scalingStat: 'MAGIA',
    secondaryScalingStat: 'PRECISION',
    baseDamageType: 'ASTRAL',
    secondaryDamageType: 'SOMBRA',
    weaponArchetypeLabel: 'Reliquia Sinfónica',
    baseMinDamage: 7,
    baseMaxDamage: 11,
    bonusMagic: 3,
    bonusAgility: 2,
    bonusPrecision: 2,
    bonusWillpower: 2,
    critBonusPct: 12,
    healBoostPct: 20,
    onHitStatus: 'VULNERABLE',
    specialEffectText: '+3 MAGIA, +2 AGILIDAD, +2 PRECISIÓN, +2 VOLUNTAD. Cada acorde resuena con crítica astral.',
    specialAttack: {
      id: 'sinfonia_del_eclipse',
      name: 'Sinfonía del Eclipse',
      description: 'Desata un crescendo astral sobre todos los enemigos (+Vulnerable) y cura +9 PV al grupo.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 1.08,
      appliesStatus: 'VULNERABLE',
      partyHealBase: 9,
      partyShieldBase: 5,
    },
    basePriceGold: 94,
    accentColor: '#81E6D9',
  },
  guadana_de_hueso: {
    id: 'guadana_de_hueso',
    name: 'Guadaña de Hueso Sepulcral',
    family: 'SCYTHE',
    rarity: 'COMMON',
    preferredClasses: ['nigromante'],
    scalingStat: 'MAGIA',
    secondaryScalingStat: 'VOLUNTAD',
    baseDamageType: 'SOMBRA',
    secondaryDamageType: 'FISICO',
    weaponArchetypeLabel: 'Guadaña de Osario',
    baseMinDamage: 6,
    baseMaxDamage: 9,
    bonusMagic: 2,
    bonusWillpower: 2,
    onHitStatus: 'CURSE',
    specialEffectText: '+2 MAGIA, +2 VOLUNTAD. Aplica Maldición al golpear y drena vitalidad para su portador.',
    specialAttack: {
      id: 'siega_de_almas',
      name: 'Siega de Almas',
      description: 'Tajo sombrío sobre 2 enemigos que aplica Maldición, drena 35% de vida y cosecha Esencia.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 1.08,
      appliesStatus: 'CURSE',
      lifestealFraction: 0.35,
      bonusVsDebuffedPct: 25,
    },
    basePriceGold: 46,
    accentColor: '#68D391',
  },
  grimorio_sepulcral: {
    id: 'grimorio_sepulcral',
    name: 'Códice de Ceniza y Almas',
    family: 'RELIC_TOME',
    rarity: 'LEGENDARY',
    preferredClasses: ['nigromante', 'mago', 'clerigo'],
    scalingStat: 'MAGIA',
    secondaryScalingStat: 'VOLUNTAD',
    baseDamageType: 'SOMBRA',
    secondaryDamageType: 'ASTRAL',
    weaponArchetypeLabel: 'Grimorio Necrótico',
    baseMinDamage: 8,
    baseMaxDamage: 12,
    bonusMagic: 3,
    bonusWillpower: 3,
    bonusPrecision: 1,
    healBoostPct: 20,
    onHitStatus: 'CORROSION',
    specialEffectText: '+3 MAGIA, +3 VOLUNTAD. Sus salmos oscuros corroen defensas y convierten el dolor en escudo.',
    specialAttack: {
      id: 'requiem_del_osario',
      name: 'Réquiem del Osario',
      description: 'Maldice y corroe a todos los enemigos, drenando salud para restaurar +8 PV al grupo.',
      category: 'DEBUFF',
      dealsDamage: true,
      targetRule: 'ALL_ENEMIES',
      cooldownRounds: 3,
      damageMultiplier: 1.05,
      appliesStatus: 'CURSE',
      armorBreak: 3,
      partyHealBase: 8,
    },
    basePriceGold: 95,
    accentColor: '#9B72CF',
  },
  espada_bastarda_real: {
    id: 'espada_bastarda_real',
    name: 'Espada Bastarda del Juramento',
    family: 'SWORD',
    rarity: 'RARE',
    preferredClasses: ['caballero', 'barbaro'],
    scalingStat: 'ATAQUE',
    baseDamageType: 'FISICO',
    secondaryDamageType: 'SAGRADO',
    weaponArchetypeLabel: 'Espada Bastarda Templada',
    baseMinDamage: 8,
    baseMaxDamage: 11,
    bonusAttack: 2,
    bonusDefense: 2,
    bonusWillpower: 2,
    specialEffectText: '+2 ATAQUE, +2 DEFENSA, +2 VOLUNTAD. Otorga Escudo al grupo al ejecutar su técnica.',
    specialAttack: {
      id: 'sentencia_del_juramento',
      name: 'Sentencia del Juramento',
      description: 'Tajo consagrado que quiebra 3 de DEF enemiga y otorga +5 Escudo a todo el grupo.',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'CLEAVE_2',
      cooldownRounds: 2,
      damageMultiplier: 1.12,
      armorBreak: 3,
      partyShieldBase: 5,
    },
    basePriceGold: 80,
    accentColor: '#FFD166',
  },
  dagas_sombra_nocturna: {
    id: 'dagas_sombra_nocturna',
    name: 'Colmillos de Sombra Nocturna',
    family: 'DAGGER',
    rarity: 'RARE',
    preferredClasses: ['picaro', 'cazador', 'bardo'],
    scalingStat: 'ATAQUE',
    secondaryScalingStat: 'AGILIDAD',
    baseDamageType: 'PERFORANTE',
    secondaryDamageType: 'SOMBRA',
    weaponArchetypeLabel: 'Dagas de Asesino',
    baseMinDamage: 7,
    baseMaxDamage: 10,
    bonusAttack: 2,
    bonusAgility: 3,
    bonusPrecision: 3,
    critBonusPct: 16,
    onHitStatus: 'BLEED',
    onCritStatus: 'VULNERABLE',
    specialEffectText: '+2 ATAQUE, +3 AGILIDAD, +3 PRECISIÓN, +16% Crítico. +30% daño contra enemigos con estados.',
    specialAttack: {
      id: 'danza_de_penumbra',
      name: 'Danza de Penumbra',
      description: 'Asalto relámpago que ignora 4 de DEF, aplica Sangrado y Vulnerable (+30% vs debilitados).',
      category: 'ATTACK',
      dealsDamage: true,
      targetRule: 'SINGLE',
      cooldownRounds: 2,
      damageMultiplier: 1.28,
      armorPierce: 4,
      appliesStatus: 'BLEED',
      bonusVsDebuffedPct: 30,
    },
    basePriceGold: 84,
    accentColor: '#C93B5B',
  },
};

export const CRIPTA_ARMORS_REGISTRY: Record<CriptaArmorId, CriptaArmorDefinition> = {
  jubon_desgastado: {
    id: 'jubon_desgastado',
    name: 'Jubón de Cuero',
    rarity: 'COMMON',
    bonusDefense: 1,
    bonusMaxHp: 4,
    bonusAgility: 1,
    specialEffectText: '+1 DEFENSA, +1 AGILIDAD y +4 VIDA MÁX.',
    basePriceGold: 32,
  },
  cota_de_malla_cripta: {
    id: 'cota_de_malla_cripta',
    name: 'Cota de Malla de Cripta',
    rarity: 'UNCOMMON',
    bonusDefense: 2,
    bonusMaxHp: 6,
    bonusWillpower: 1,
    specialEffectText: '+2 DEFENSA, +1 VOLUNTAD y +6 VIDA MÁX.',
    basePriceGold: 54,
  },
  coraza_del_sepulturero: {
    id: 'coraza_del_sepulturero',
    name: 'Coraza del Sepulturero',
    rarity: 'RARE',
    bonusDefense: 2,
    bonusMaxHp: 8,
    bonusWillpower: 2,
    statusResistance: 'CURSE',
    specialEffectText: '+2 DEFENSA, +2 VOLUNTAD, +8 VIDA MÁX. Reduce MALDICIÓN en 1 turno.',
    basePriceGold: 74,
  },
  tunica_del_astrologo: {
    id: 'tunica_del_astrologo',
    name: 'Túnica del Astrólogo',
    rarity: 'RARE',
    bonusDefense: 1,
    bonusMaxHp: 5,
    bonusMagic: 2,
    bonusWillpower: 2,
    specialEffectText: '+2 MAGIA, +2 VOLUNTAD, +1 DEFENSA, +5 VIDA MÁX.',
    basePriceGold: 72,
  },
  armadura_escamas_fungicas: {
    id: 'armadura_escamas_fungicas',
    name: 'Escamas del Jardín',
    rarity: 'UNCOMMON',
    bonusDefense: 2,
    bonusMaxHp: 6,
    bonusPrecision: 1,
    statusResistance: 'POISON',
    specialEffectText: '+2 DEFENSA, +1 PRECISIÓN, +6 VIDA MÁX. Resistencia contra VENENO.',
    basePriceGold: 58,
  },
  manto_de_sombra_real: {
    id: 'manto_de_sombra_real',
    name: 'Manto de Sombra Real',
    rarity: 'RARE',
    bonusDefense: 2,
    bonusMaxHp: 7,
    bonusAgility: 2,
    bonusPrecision: 1,
    statusResistance: 'BLEED',
    specialEffectText: '+2 DEFENSA, +2 AGILIDAD, +1 PRECISIÓN, +7 VIDA MÁX. Resiste SANGRADO.',
    basePriceGold: 76,
  },
  placas_del_juramento: {
    id: 'placas_del_juramento',
    name: 'Placas del Juramento Eterno',
    rarity: 'RARE',
    bonusDefense: 3,
    bonusMaxHp: 10,
    bonusWillpower: 2,
    specialEffectText: '+3 DEFENSA, +2 VOLUNTAD y +10 VIDA MÁX. Forjada para la vanguardia.',
    basePriceGold: 82,
  },
};

export const CRIPTA_ACCESSORIES_REGISTRY: Record<CriptaAccessoryId, CriptaAccessoryDefinition> = {
  anillo_del_boticario: {
    id: 'anillo_del_boticario',
    name: 'Anillo del Boticario',
    rarity: 'UNCOMMON',
    bonusMagic: 1,
    bonusPrecision: 1,
    potionBoostPct: 20,
    specialEffectText: '+1 MAGIA, +1 PRECISIÓN · Pociones y elixires +20% efectividad.',
    basePriceGold: 48,
  },
  colgante_de_cristal: {
    id: 'colgante_de_cristal',
    name: 'Colgante de Cristal',
    rarity: 'RARE',
    bonusMagic: 2,
    bonusWillpower: 2,
    specialEffectText: '+2 MAGIA, +2 VOLUNTAD · Potencia hechizos, maldiciones y curaciones.',
    basePriceGold: 64,
  },
  sello_del_cazador: {
    id: 'sello_del_cazador',
    name: 'Anillo del Acechador',
    rarity: 'RARE',
    bonusAttack: 2,
    bonusPrecision: 2,
    bonusAgility: 1,
    critBonusPct: 10,
    specialEffectText: '+2 ATAQUE, +2 PRECISIÓN, +1 AGILIDAD y +10% golpe Crítico.',
    basePriceGold: 64,
  },
  espejo_roto_accesorio: {
    id: 'espejo_roto_accesorio',
    name: 'Fragmento de Espejo Astral',
    rarity: 'UNCOMMON',
    bonusMagic: 1,
    bonusDefense: 1,
    bonusWillpower: 2,
    specialEffectText: '+1 MAGIA, +1 DEFENSA, +2 VOLUNTAD · Revela secretos en espejos y altares.',
    basePriceGold: 52,
  },
  amuleto_rompeescudos: {
    id: 'amuleto_rompeescudos',
    name: 'Amuleto Rompeescudos',
    rarity: 'RARE',
    bonusAttack: 2,
    bonusDefense: 1,
    bonusPrecision: 2,
    specialEffectText: '+2 ATAQUE, +1 DEFENSA, +2 PRECISIÓN · Tus golpes fracturan corazas.',
    basePriceGold: 68,
  },
  reloj_de_arena_astral: {
    id: 'reloj_de_arena_astral',
    name: 'Reloj de Arena Astral',
    rarity: 'RARE',
    bonusMagic: 2,
    bonusAgility: 2,
    critBonusPct: 8,
    specialEffectText: '+2 MAGIA, +2 AGILIDAD y +8% Crítico · Sincroniza el tempo arcano.',
    basePriceGold: 70,
  },
};

export function getWeaponBaseDamageType(weapon: CriptaWeaponDefinition): {
  primary: CriptaDamageType;
  secondary?: CriptaDamageType;
  archetypeLabel: string;
} {
  if (weapon.baseDamageType) {
    return {
      primary: weapon.baseDamageType,
      secondary: weapon.secondaryDamageType,
      archetypeLabel: weapon.weaponArchetypeLabel || weapon.family,
    };
  }
  switch (weapon.id) {
    case 'espada_oxidada':
      return { primary: 'FISICO', archetypeLabel: 'Hoja de Acero' };
    case 'espada_del_sepulcro':
      return { primary: 'FISICO', secondary: 'SAGRADO', archetypeLabel: 'Hoja Sepulcral' };
    case 'espadon_del_rey_hundido':
      return { primary: 'FISICO', secondary: 'CONTUNDENTE', archetypeLabel: 'Mandoble Real' };
    case 'hacha_forja_infernal':
      return { primary: 'FUEGO', secondary: 'FISICO', archetypeLabel: 'Hacha Ígnea' };
    case 'pico_de_minero_runico':
      return { primary: 'CONTUNDENTE', secondary: 'PERFORANTE', archetypeLabel: 'Pico Quebrantarrocas' };
    case 'alabarda_del_juramento':
      return { primary: 'FISICO', secondary: 'CONTUNDENTE', archetypeLabel: 'Alabarda de Bastión' };
    case 'baston_ceniza':
      return { primary: 'MAGICO', secondary: 'FUEGO', archetypeLabel: 'Bastón Arcano' };
    case 'vara_de_cristal_astral':
      return { primary: 'ASTRAL', secondary: 'MAGICO', archetypeLabel: 'Vara Prismática' };
    case 'grimorio_prohibido_arma':
      return { primary: 'SOMBRA', secondary: 'MAGICO', archetypeLabel: 'Tomo del Vacío' };
    case 'cetro_del_eclipse':
      return { primary: 'ASTRAL', secondary: 'FUEGO', archetypeLabel: 'Cetro Estelar' };
    case 'dagas_melladas':
      return { primary: 'PERFORANTE', secondary: 'FISICO', archetypeLabel: 'Dagas Gemelas' };
    case 'hojas_colmillo_venenoso':
      return { primary: 'VENENO', secondary: 'PERFORANTE', archetypeLabel: 'Colmillos Tóxicos' };
    case 'estoque_carmesi':
      return { primary: 'PERFORANTE', archetypeLabel: 'Estoque Imperial' };
    case 'guadana_del_verdugo':
      return { primary: 'SOMBRA', secondary: 'FISICO', archetypeLabel: 'Guadaña de Sombra' };
    case 'arco_cazador':
      return { primary: 'PERFORANTE', archetypeLabel: 'Arco Largo' };
    case 'arco_de_espinas':
      return { primary: 'PERFORANTE', secondary: 'VENENO', archetypeLabel: 'Arco Espinoso' };
    case 'ballesta_de_asedio':
      return { primary: 'PERFORANTE', secondary: 'CONTUNDENTE', archetypeLabel: 'Ballesta Pesada' };
    case 'canon_de_azufre':
      return { primary: 'FUEGO', secondary: 'CONTUNDENTE', archetypeLabel: 'Cañón Rúnico' };
    case 'maza_consagrada':
      return { primary: 'CONTUNDENTE', secondary: 'SAGRADO', archetypeLabel: 'Maza Litúrgica' };
    case 'martillo_del_juicio':
      return { primary: 'SAGRADO', secondary: 'CONTUNDENTE', archetypeLabel: 'Martillo Consagrado' };
    case 'simbolo_del_alba':
      return { primary: 'SAGRADO', archetypeLabel: 'Cetro del Alba' };
    case 'relicario_serafin':
      return { primary: 'SAGRADO', secondary: 'ASTRAL', archetypeLabel: 'Relicario Solar' };
    case 'lanzador_alquimico':
      return { primary: 'ALQUIMICO', secondary: 'VENENO', archetypeLabel: 'Lanzador Volátil' };
    case 'catalizador_esporas':
      return { primary: 'VENENO', secondary: 'ALQUIMICO', archetypeLabel: 'Catalizador Micótico' };
    case 'guantelete_mutageno':
      return { primary: 'ALQUIMICO', secondary: 'FUEGO', archetypeLabel: 'Inyector Químico' };
    default:
      return { primary: 'FISICO', archetypeLabel: 'Arma de Cripta' };
  }
}

export function getEquippedWeaponForPlayer(player: CriptaPlayer): {
  weapon: CriptaWeaponDefinition;
  level: 1 | 2 | 3;
  scaledMin: number;
  scaledMax: number;
  bonusAttack: number;
  bonusMagic: number;
  bonusDefense: number;
  baseDamageType: CriptaDamageType;
  activeDamageType: CriptaDamageType;
  secondaryDamageType?: CriptaDamageType;
  archetypeLabel: string;
  activeRune: CriptaWeaponRuneDefinition | null;
  effectiveCritDeltaPct: number;
  effectiveArmorPierceBonus: number;
  effectiveSpecialCooldown: number;
  effectiveOnHitStatus?: CriptaStatusEffectType;
  effectiveOnCritStatus?: CriptaStatusEffectType;
} {
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const fallbackId = STARTER_WEAPON_BY_CLASS[charId] || 'espada_oxidada';
  const weaponId = player.equippedWeaponId || fallbackId;
  const weapon = CRIPTA_WEAPONS_REGISTRY[weaponId] || CRIPTA_WEAPONS_REGISTRY[fallbackId];
  const level: 1 | 2 | 3 =
    player.weaponUpgradeLevel === 3 ? 3 : player.weaponUpgradeLevel === 2 ? 2 : 1;

  const activeRune = player.equippedWeaponRuneId
    ? CRIPTA_WEAPON_RUNES_REGISTRY[player.equippedWeaponRuneId] || null
    : null;

  const baseTypeInfo = getWeaponBaseDamageType(weapon);
  const activeDamageType: CriptaDamageType = activeRune
    ? activeRune.infusedDamageType
    : baseTypeInfo.primary;
  const secondaryDamageType: CriptaDamageType | undefined = activeRune
    ? activeRune.secondaryDamageType || baseTypeInfo.primary
    : baseTypeInfo.secondary;

  const levelOffset = level - 1;
  const runeMult = 1 + (activeRune?.damageMultiplierDelta || 0);
  const scaledMin = Math.max(2, Math.round((weapon.baseMinDamage + levelOffset) * runeMult));
  const scaledMax = Math.max(
    scaledMin + 1,
    Math.round((weapon.baseMaxDamage + levelOffset * 2) * runeMult)
  );

  const bonusAttack =
    (weapon.bonusAttack || 0) +
    (weapon.scalingStat === 'ATAQUE' && level >= 2 ? levelOffset : 0) +
    (activeRune?.bonusAttackDelta || 0);
  const bonusMagic =
    (weapon.bonusMagic || 0) +
    (weapon.scalingStat === 'MAGIA' && level >= 2 ? levelOffset : 0) +
    (activeRune?.bonusMagicDelta || 0);
  const bonusDefense = (weapon.bonusDefense || 0) + (activeRune?.bonusDefenseDelta || 0);

  const effectiveCritDeltaPct = activeRune?.critBonusDeltaPct || 0;
  const effectiveArmorPierceBonus = activeRune?.armorPierceBonus || 0;
  const effectiveSpecialCooldown = Math.max(
    1,
    (weapon.specialAttack.cooldownRounds || 2) + (activeRune?.specialCooldownDelta || 0)
  );

  let effectiveOnHitStatus = activeRune?.onHitStatus || weapon.onHitStatus;
  let effectiveOnCritStatus = activeRune?.onCritStatus || weapon.onCritStatus;
  if (activeRune?.disablesBleedAndPoison) {
    if (effectiveOnHitStatus === 'BLEED' || effectiveOnHitStatus === 'POISON') {
      effectiveOnHitStatus = undefined;
    }
    if (effectiveOnCritStatus === 'BLEED' || effectiveOnCritStatus === 'POISON') {
      effectiveOnCritStatus = undefined;
    }
  }

  return {
    weapon,
    level,
    scaledMin,
    scaledMax,
    bonusAttack,
    bonusMagic,
    bonusDefense,
    baseDamageType: baseTypeInfo.primary,
    activeDamageType,
    secondaryDamageType,
    archetypeLabel: baseTypeInfo.archetypeLabel,
    activeRune,
    effectiveCritDeltaPct,
    effectiveArmorPierceBonus,
    effectiveSpecialCooldown,
    effectiveOnHitStatus,
    effectiveOnCritStatus,
  };
}

export function getWeaponUpgradeCost(level: 1 | 2 | 3, discountPct = 0): number | null {
  if (level >= 3) return null;
  const raw = level === 1 ? 45 : 78;
  return Math.max(20, Math.round(raw * (1 - discountPct / 100)));
}

export function computePlayerEffectiveStats(player: CriptaPlayer): {
  attack: number;
  defense: number;
  magic: number;
  agility: number;
  precision: number;
  willpower: number;
  maxHpBonus: number;
  critChancePct: number;
  critDamageMult: number;
  dodgeChancePct: number;
  evasionPct: number;
  statusResistPct: number;
  armorPierceBonus: number;
  initiativeScore: number;
  potionBoostPct: number;
  healBoostPct: number;
} {
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
  const eqWeapon = getEquippedWeaponForPlayer(player);
  const armorDef = player.equippedArmorId ? CRIPTA_ARMORS_REGISTRY[player.equippedArmorId] : null;
  const accDef = player.equippedAccessoryId
    ? CRIPTA_ACCESSORIES_REGISTRY[player.equippedAccessoryId]
    : null;

  const classRes = player.classResource || 0;

  const attack =
    (charDef?.stats.attack || 5) +
    (player.bonusAttack || 0) +
    eqWeapon.bonusAttack +
    (armorDef?.bonusAttack || 0) +
    (accDef?.bonusAttack || 0);

  // Bárbaro at 75+ Fury sacrifices 2 defensive stability for massive offensive pressure;
  // Nigromante gains +1 spiritual defense per 2 stored Esencia.
  const barbaroFuryDefPenalty = charId === 'barbaro' && classRes >= 75 ? -2 : 0;
  const nigromanteEssenceDefBonus = charId === 'nigromante' ? Math.floor(classRes / 2) : 0;

  const defense = Math.max(
    1,
    (charDef?.stats.defense || 5) +
      (player.bonusDefense || 0) +
      eqWeapon.bonusDefense +
      (armorDef?.bonusDefense || 0) +
      (accDef?.bonusDefense || 0) +
      barbaroFuryDefPenalty +
      nigromanteEssenceDefBonus
  );

  const magic =
    (charDef?.stats.magic || 5) +
    (player.bonusMagic || 0) +
    eqWeapon.bonusMagic +
    (armorDef?.bonusMagic || 0) +
    (accDef?.bonusMagic || 0);

  const agility = Math.max(
    1,
    (charDef?.stats.agility ?? player.agility ?? 5) +
      (player.bonusAgility || 0) +
      (eqWeapon.weapon.bonusAgility || 0) +
      (armorDef?.bonusAgility || 0) +
      (accDef?.bonusAgility || 0) +
      (playerHasStatus(player, 'HASTE') ? 3 : 0) -
      (playerHasStatus(player, 'SLOW') ? 2 : 0)
  );

  const precision = Math.max(
    1,
    (charDef?.stats.precision ?? player.precision ?? 5) +
      (player.bonusPrecision || 0) +
      (eqWeapon.weapon.bonusPrecision || 0) +
      (armorDef?.bonusPrecision || 0) +
      (accDef?.bonusPrecision || 0) +
      (playerHasStatus(player, 'PRECISION') || playerHasStatus(player, 'INSPIRATION') ? 2 : 0) -
      (playerHasStatus(player, 'BLINDED') ? 3 : 0)
  );

  const willpower = Math.max(
    1,
    (charDef?.stats.willpower ?? player.willpower ?? 5) +
      (player.bonusWillpower || 0) +
      (eqWeapon.weapon.bonusWillpower || 0) +
      (armorDef?.bonusWillpower || 0) +
      (accDef?.bonusWillpower || 0) +
      (playerHasStatus(player, 'BLESSED') ? 2 : 0) -
      (playerHasStatus(player, 'FEAR') || playerHasStatus(player, 'CURSE') ? 2 : 0)
  );

  const maxHpBonus = armorDef?.bonusMaxHp || 0;

  // PRECISIÓN directly governs Critical Hit Chance, Critical Damage Multiplier, and Armor Penetration!
  const classCritBonus = charId === 'picaro' ? 6 : charId === 'cazador' ? 5 : 0;
  const furyCritBonus = charId === 'barbaro' && classRes >= 75 ? 12 : charId === 'barbaro' && classRes >= 50 ? 5 : 0;
  const critChancePct = Math.max(
    3,
    Math.min(
      85,
      Math.round(
        4 +
          precision * 2.2 +
          classCritBonus +
          furyCritBonus +
          (eqWeapon.weapon.critBonusPct || 0) +
          (accDef?.critBonusPct || 0) +
          eqWeapon.effectiveCritDeltaPct
      )
    )
  );

  const critDamageMult = Number((1.4 + Math.max(0, precision - 4) * 0.04).toFixed(2));

  // AGILIDAD directly governs Dodge/Evasion chance and Turn Initiative!
  const dodgeChancePct = Math.max(
    2,
    Math.min(
      48,
      Math.round(
        agility * 2.4 +
          (charId === 'picaro' ? 6 : charId === 'bardo' ? 4 : 0) +
          (playerHasStatus(player, 'STEALTH') ? 15 : 0)
      )
    )
  );

  // VOLUNTAD directly governs Status Resistance, Healing/Shielding output, and Curse potency!
  const statusResistPct = Math.max(
    4,
    Math.min(
      65,
      Math.round(
        willpower * 4.2 +
          (charId === 'clerigo' || charId === 'nigromante' ? 8 : 0) +
          (playerHasStatus(player, 'RESISTANCE') ? 20 : 0)
      )
    )
  );

  const armorPierceBonus =
    Math.floor(precision / 3) +
    (eqWeapon.weapon.armorPierceBonus || 0) +
    eqWeapon.effectiveArmorPierceBonus;

  const initiativeScore = agility * 10 + precision;

  const potionBoostPct =
    (charId === 'alquimista' ? 20 : 0) +
    Math.max(0, (willpower - 5) * 3) +
    (eqWeapon.weapon.potionBoostPct || 0) +
    (accDef?.potionBoostPct || 0) +
    (eqWeapon.level >= 2 && eqWeapon.weapon.family === 'ALCHEMICAL' ? 10 : 0);

  const healBoostPct =
    (charId === 'clerigo' ? 18 : charId === 'bardo' ? 12 : 0) +
    Math.max(0, (willpower - 4) * 4) +
    (eqWeapon.weapon.healBoostPct || 0) +
    (eqWeapon.level >= 2 && (eqWeapon.weapon.family === 'MACE' || eqWeapon.weapon.family === 'INSTRUMENT')
      ? 10
      : 0);

  return {
    attack,
    defense,
    magic,
    agility,
    precision,
    willpower,
    maxHpBonus,
    critChancePct,
    critDamageMult,
    dodgeChancePct,
    evasionPct: dodgeChancePct,
    statusResistPct,
    armorPierceBonus,
    initiativeScore,
    potionBoostPct,
    healBoostPct,
  };
}

export interface CriptaEnemyTraitEntry {
  id: CriptaDamageType;
  label: string;
  modifierText: string;
  multiplierDelta: number; // e.g. +0.25 for +25% weakness, -0.20 for resistance
  iconKind:
    | 'holy'
    | 'arcane'
    | 'blunt'
    | 'pierce'
    | 'alchemy'
    | 'poison'
    | 'slash'
    | 'fire'
    | 'frost'
    | 'shadow'
    | 'astral';
}

export const CRIPTA_DAMAGE_TYPE_META: Record<
  CriptaDamageType,
  {
    id: CriptaDamageType;
    label: string;
    shortLabel: string;
    color: string;
    borderColor: string;
    bgTint: string;
    iconKind: CriptaEnemyTraitEntry['iconKind'];
  }
> = {
  FISICO: {
    id: 'FISICO',
    label: 'CORTE FÍSICO',
    shortLabel: 'CORTE',
    color: '#E2E8F0',
    borderColor: '#94A3B8',
    bgTint: '#161B26',
    iconKind: 'slash',
  },
  CONTUNDENTE: {
    id: 'CONTUNDENTE',
    label: 'CONTUNDENTE',
    shortLabel: 'CONTUNDENTE',
    color: '#D9D0BC',
    borderColor: '#A89F88',
    bgTint: '#1D1A15',
    iconKind: 'blunt',
  },
  PERFORANTE: {
    id: 'PERFORANTE',
    label: 'PERFORANTE',
    shortLabel: 'PERFORANTE',
    color: '#FF758F',
    borderColor: '#C93B5B',
    bgTint: '#24121A',
    iconKind: 'pierce',
  },
  SAGRADO: {
    id: 'SAGRADO',
    label: 'SAGRADO',
    shortLabel: 'SAGRADO',
    color: '#FFD166',
    borderColor: '#E7A54A',
    bgTint: '#261C0E',
    iconKind: 'holy',
  },
  MAGICO: {
    id: 'MAGICO',
    label: 'ARCANO',
    shortLabel: 'ARCANO',
    color: '#C8A6F5',
    borderColor: '#9B72CF',
    bgTint: '#1B1328',
    iconKind: 'arcane',
  },
  FUEGO: {
    id: 'FUEGO',
    label: 'FUEGO ÍGNEO',
    shortLabel: 'FUEGO',
    color: '#FF7A33',
    borderColor: '#E76F38',
    bgTint: '#28140C',
    iconKind: 'fire',
  },
  HIELO: {
    id: 'HIELO',
    label: 'HIELO GLACIAL',
    shortLabel: 'HIELO',
    color: '#7BDFF2',
    borderColor: '#48CAE4',
    bgTint: '#0D1F28',
    iconKind: 'frost',
  },
  ALQUIMICO: {
    id: 'ALQUIMICO',
    label: 'ALQUÍMICO',
    shortLabel: 'ALQUIMIA',
    color: '#80FF72',
    borderColor: '#5EA87A',
    bgTint: '#102418',
    iconKind: 'alchemy',
  },
  VENENO: {
    id: 'VENENO',
    label: 'TOXINA / VENENO',
    shortLabel: 'VENENO',
    color: '#8EE6AE',
    borderColor: '#48BB78',
    bgTint: '#102218',
    iconKind: 'poison',
  },
  SOMBRA: {
    id: 'SOMBRA',
    label: 'SOMBRA ABISAL',
    shortLabel: 'SOMBRA',
    color: '#D6BCFA',
    borderColor: '#805AD5',
    bgTint: '#170E29',
    iconKind: 'shadow',
  },
  ASTRAL: {
    id: 'ASTRAL',
    label: 'LUZ ASTRAL',
    shortLabel: 'ASTRAL',
    color: '#90E0EF',
    borderColor: '#69A8A5',
    bgTint: '#0E1E24',
    iconKind: 'astral',
  },
};

/**
 * Canonical enemy weakness & resistance profile derived from creature archetype.
 * Used both by Enemy Inspection UI AND by the authoritative combat damage resolver!
 */
export function getEnemyWeaknessAndResistanceProfile(enemy: CriptaRoomEnemy): {
  weaknesses: CriptaEnemyTraitEntry[];
  resistances: CriptaEnemyTraitEntry[];
} {
  const arch = enemy.spriteArchetype;

  if (arch === 'skeleton_warrior' || arch === 'bone_colossus' || arch === 'sand_mummy') {
    return {
      weaknesses: [
        {
          id: 'CONTUNDENTE',
          label: 'CONTUNDENTE',
          modifierText: '+28% daño',
          multiplierDelta: 0.28,
          iconKind: 'blunt',
        },
        {
          id: 'SAGRADO',
          label: 'SAGRADO',
          modifierText: '+25% daño',
          multiplierDelta: 0.25,
          iconKind: 'holy',
        },
        ...(arch === 'sand_mummy'
          ? [
              {
                id: 'FUEGO' as const,
                label: 'FUEGO ÍGNEO',
                modifierText: '+30% daño',
                multiplierDelta: 0.3,
                iconKind: 'fire' as const,
              },
            ]
          : []),
      ],
      resistances: [
        {
          id: 'PERFORANTE',
          label: 'PERFORANTE',
          modifierText: '-22% daño',
          multiplierDelta: -0.22,
          iconKind: 'pierce',
        },
        {
          id: 'VENENO',
          label: 'VENENO',
          modifierText: 'Resistente (-25%)',
          multiplierDelta: -0.25,
          iconKind: 'poison',
        },
      ],
    };
  }

  if (arch === 'frost_wolf') {
    return {
      weaknesses: [
        {
          id: 'FUEGO',
          label: 'FUEGO ÍGNEO',
          modifierText: '+30% daño',
          multiplierDelta: 0.3,
          iconKind: 'fire',
        },
        {
          id: 'FISICO',
          label: 'CORTE FÍSICO',
          modifierText: '+18% daño',
          multiplierDelta: 0.18,
          iconKind: 'slash',
        },
      ],
      resistances: [
        {
          id: 'HIELO',
          label: 'HIELO GLACIAL',
          modifierText: 'Resistente (-30%)',
          multiplierDelta: -0.3,
          iconKind: 'frost',
        },
      ],
    };
  }

  if (
    arch === 'chained_wraith' ||
    arch === 'mirror_doppel' ||
    arch === 'wisp_phantom' ||
    arch === 'void_herald' ||
    arch === 'final_boss_phase1' ||
    arch === 'final_boss_phase2'
  ) {
    return {
      weaknesses: [
        {
          id: 'SAGRADO',
          label: 'SAGRADO',
          modifierText: '+28% daño',
          multiplierDelta: 0.28,
          iconKind: 'holy',
        },
        {
          id: 'ASTRAL',
          label: 'LUZ ASTRAL',
          modifierText: '+22% daño',
          multiplierDelta: 0.22,
          iconKind: 'astral',
        },
        {
          id: 'MAGICO',
          label: 'ARCANO',
          modifierText: '+18% daño',
          multiplierDelta: 0.18,
          iconKind: 'arcane',
        },
      ],
      resistances: [
        {
          id: 'FISICO',
          label: 'CORTE FÍSICO',
          modifierText: '-20% daño',
          multiplierDelta: -0.2,
          iconKind: 'slash',
        },
        {
          id: 'SOMBRA',
          label: 'SOMBRA ABISAL',
          modifierText: '-25% daño',
          multiplierDelta: -0.25,
          iconKind: 'shadow',
        },
      ],
    };
  }

  if (
    arch === 'plague_bloom' ||
    arch === 'chitin_drone' ||
    arch === 'sewer_abomination' ||
    arch === 'deep_serpent'
  ) {
    return {
      weaknesses: [
        {
          id: 'FUEGO',
          label: 'FUEGO ÍGNEO',
          modifierText: '+28% daño',
          multiplierDelta: 0.28,
          iconKind: 'fire',
        },
        {
          id: 'ALQUIMICO',
          label: 'ALQUÍMICO',
          modifierText: '+24% daño',
          multiplierDelta: 0.24,
          iconKind: 'alchemy',
        },
        {
          id: 'FISICO',
          label: 'CORTE FÍSICO',
          modifierText: '+16% daño',
          multiplierDelta: 0.16,
          iconKind: 'slash',
        },
      ],
      resistances: [
        {
          id: 'VENENO',
          label: 'VENENO',
          modifierText: 'Resistente (-28%)',
          multiplierDelta: -0.28,
          iconKind: 'poison',
        },
      ],
    };
  }

  if (arch === 'iron_golem' || arch === 'crystal_sentinel') {
    return {
      weaknesses: [
        {
          id: 'CONTUNDENTE',
          label: 'CONTUNDENTE',
          modifierText: '+28% daño',
          multiplierDelta: 0.28,
          iconKind: 'blunt',
        },
        {
          id: 'HIELO',
          label: 'HIELO GLACIAL',
          modifierText: '+22% daño',
          multiplierDelta: 0.22,
          iconKind: 'frost',
        },
        {
          id: 'MAGICO',
          label: 'ARCANO',
          modifierText: '+20% daño',
          multiplierDelta: 0.2,
          iconKind: 'arcane',
        },
      ],
      resistances: [
        {
          id: 'PERFORANTE',
          label: 'PERFORANTE',
          modifierText: '-25% daño',
          multiplierDelta: -0.25,
          iconKind: 'pierce',
        },
        {
          id: 'FUEGO',
          label: 'FUEGO ÍGNEO',
          modifierText: '-20% daño',
          multiplierDelta: -0.2,
          iconKind: 'fire',
        },
      ],
    };
  }

  // Default for executioner, blood_acolyte, arcane_archivist, astral_weaver, goblin_raider, mine_stalker
  return {
    weaknesses: [
      {
        id: 'PERFORANTE',
        label: 'PERFORANTE',
        modifierText: '+22% daño',
        multiplierDelta: 0.22,
        iconKind: 'pierce',
      },
      {
        id: 'VENENO',
        label: 'VENENO',
        modifierText: '+20% daño',
        multiplierDelta: 0.2,
        iconKind: 'poison',
      },
      {
        id: 'SOMBRA',
        label: 'SOMBRA ABISAL',
        modifierText: '+18% daño',
        multiplierDelta: 0.18,
        iconKind: 'shadow',
      },
    ],
    resistances: [
      {
        id: 'MAGICO',
        label: 'ARCANO',
        modifierText: '-15% daño',
        multiplierDelta: -0.15,
        iconKind: 'arcane',
      },
    ],
  };
}

export function getWeaponVsEnemyMatchupSummary(
  player: CriptaPlayer,
  actionType: 'ATTACK' | 'WEAPON_SPECIAL' | 'ABILITY',
  enemy: CriptaRoomEnemy
): {
  multiplier: number;
  state: 'WEAKNESS' | 'RESISTANCE' | 'NEUTRAL';
  matchedTraitLabel?: string;
  activeDamageType: CriptaDamageType;
  activeDamageLabel: string;
  deltaPct: number;
} {
  const eq = getEquippedWeaponForPlayer(player);
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const profile = getEnemyWeaknessAndResistanceProfile(enemy);

  const activeTags = new Set<CriptaDamageType>();
  activeTags.add(eq.activeDamageType);
  if (eq.secondaryDamageType) {
    activeTags.add(eq.secondaryDamageType);
  }

  // If using a class ability without an overriding rune, add class innate affinity
  if (actionType === 'ABILITY' && !eq.activeRune) {
    if (charId === 'clerigo') activeTags.add('SAGRADO');
    if (charId === 'mago') activeTags.add('MAGICO');
    if (charId === 'alquimista') activeTags.add('ALQUIMICO');
    if (charId === 'picaro' || charId === 'cazador') activeTags.add('PERFORANTE');
    if (charId === 'barbaro') activeTags.add('CONTUNDENTE');
    if (charId === 'bardo') activeTags.add('ASTRAL');
    if (charId === 'nigromante') activeTags.add('SOMBRA');
  }

  let bestWeakness: CriptaEnemyTraitEntry | null = null;
  for (const w of profile.weaknesses) {
    if (activeTags.has(w.id)) {
      if (!bestWeakness || w.multiplierDelta > bestWeakness.multiplierDelta) {
        bestWeakness = w;
      }
    }
  }

  const meta = CRIPTA_DAMAGE_TYPE_META[eq.activeDamageType] || CRIPTA_DAMAGE_TYPE_META.FISICO;

  if (bestWeakness) {
    return {
      multiplier: 1 + bestWeakness.multiplierDelta,
      state: 'WEAKNESS',
      matchedTraitLabel: bestWeakness.label,
      activeDamageType: eq.activeDamageType,
      activeDamageLabel: meta.shortLabel,
      deltaPct: Math.round(bestWeakness.multiplierDelta * 100),
    };
  }

  let worstResistance: CriptaEnemyTraitEntry | null = null;
  for (const r of profile.resistances) {
    if (activeTags.has(r.id)) {
      if (!worstResistance || r.multiplierDelta < worstResistance.multiplierDelta) {
        worstResistance = r;
      }
    }
  }

  if (worstResistance) {
    return {
      multiplier: 1 + worstResistance.multiplierDelta,
      state: 'RESISTANCE',
      matchedTraitLabel: worstResistance.label,
      activeDamageType: eq.activeDamageType,
      activeDamageLabel: meta.shortLabel,
      deltaPct: Math.round(worstResistance.multiplierDelta * 100),
    };
  }

  return {
    multiplier: 1,
    state: 'NEUTRAL',
    activeDamageType: eq.activeDamageType,
    activeDamageLabel: meta.shortLabel,
    deltaPct: 0,
  };
}

export function computeWeaponVsEnemyTraitMultiplier(
  player: CriptaPlayer,
  actionType: 'ATTACK' | 'WEAPON_SPECIAL' | 'ABILITY',
  enemy: CriptaRoomEnemy
): number {
  return getWeaponVsEnemyMatchupSummary(player, actionType, enemy).multiplier;
}

export function formatDamageRange(
  min?: number | null,
  max?: number | null,
  targetCount = 1
): string | null {
  if (typeof min !== 'number' || Number.isNaN(min)) return null;
  const safeMin = Math.max(1, Math.round(min));
  const safeMax =
    typeof max === 'number' && !Number.isNaN(max)
      ? Math.max(safeMin, Math.round(max))
      : safeMin;
  const base = safeMin === safeMax ? `${safeMin}` : `~${safeMin}–${safeMax}`;
  return targetCount > 1 ? `${base} × ${targetCount}` : base;
}

/**
 * Computes the enemy's approximate damage range and magic resistance for Enemy Inspection (Sections 5 & 6).
 */
export function computeEnemyApproxDamageRange(
  enemy: CriptaRoomEnemy,
  _floor?: number
): {
  min: number;
  max: number;
  magicRes: number;
} {
  const safeArmor = typeof enemy.armor === 'number' ? enemy.armor : enemy.defense || 0;
  if (typeof enemy.approxMinDamage === 'number' && typeof enemy.approxMaxDamage === 'number') {
    return {
      min: enemy.approxMinDamage,
      max: enemy.approxMaxDamage,
      magicRes:
        typeof enemy.magicResistance === 'number'
          ? enemy.magicResistance
          : Math.max(0, Math.floor(safeArmor * 0.4)),
    };
  }
  const effectiveAtk = Math.max(3, enemy.attack + (enemy.attackBuffBonus || 0));
  const min = Math.max(2, Math.round(effectiveAtk * 0.8));
  const max = Math.max(min + 2, Math.round(effectiveAtk * 1.15));
  const magicRes =
    typeof enemy.magicResistance === 'number'
      ? enemy.magicResistance
      : Math.max(0, Math.floor(safeArmor * 0.4));
  return { min, max, magicRes };
}

/**
 * Centralized damage estimator used both by the Right Action Cards (to show ~4–6 DAÑO)
 * and by the authoritative server combat resolver (Sections 8, 9, 10, 21, 22).
 */
export function estimatePlayerActionDamage(
  player: CriptaPlayer,
  actionType: 'ATTACK' | 'WEAPON_SPECIAL' | 'ABILITY',
  targetEnemy: CriptaRoomEnemy | null,
  allLivingEnemies: CriptaRoomEnemy[] = [],
  partyRelics: CriptaAcquiredRelic[] = [],
  abilityId?: string
): {
  min: number;
  max: number;
  minDamage: number;
  maxDamage: number;
  targetCount: number;
  affectedEnemyIds: string[];
  label: string;
  isMagical: boolean;
  damageType: CriptaDamageType;
  damageTypeLabel: string;
  matchupState: 'WEAKNESS' | 'RESISTANCE' | 'NEUTRAL';
  matchupDeltaPct: number;
} {
  const eq = getEquippedWeaponForPlayer(player);
  const stats = computePlayerEffectiveStats(player);
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
  const dmgMeta = CRIPTA_DAMAGE_TYPE_META[eq.activeDamageType] || CRIPTA_DAMAGE_TYPE_META.FISICO;
  const selectedAbility =
    actionType === 'ABILITY'
      ? charDef?.abilities.find((a) => a.id === abilityId) ||
        charDef?.abilities.find((a) => a.type !== 'PASIVA') ||
        charDef?.abilities[0]
      : undefined;

  if (
    actionType === 'ABILITY' &&
    selectedAbility &&
    (selectedAbility.dealsDamage === false ||
      selectedAbility.kind === 'HEAL' ||
      selectedAbility.kind === 'DEFEND' ||
      selectedAbility.kind === 'BUFF')
  ) {
    return {
      min: 0,
      max: 0,
      minDamage: 0,
      maxDamage: 0,
      targetCount: 0,
      affectedEnemyIds: [],
      label: selectedAbility.kind === 'HEAL' ? 'CURACIÓN' : 'APOYO TÁCTICO',
      isMagical: true,
      damageType: eq.activeDamageType,
      damageTypeLabel: dmgMeta.shortLabel,
      matchupState: 'NEUTRAL',
      matchupDeltaPct: 0,
    };
  }

  const isMagical =
    eq.weapon.scalingStat === 'MAGIA' ||
    eq.activeDamageType === 'MAGICO' ||
    eq.activeDamageType === 'ASTRAL' ||
    eq.activeDamageType === 'SOMBRA' ||
    (actionType === 'ABILITY' &&
      (charId === 'mago' ||
        charId === 'clerigo' ||
        charId === 'alquimista' ||
        charId === 'bardo' ||
        charId === 'nigromante'));

  const statValue = isMagical ? stats.magic : stats.attack;
  const magicHybridBonus = eq.activeRune?.magicScalingBonusPct
    ? Math.round(stats.magic * (eq.activeRune.magicScalingBonusPct / 100))
    : 0;

  // Secondary stat contribution from weapon (AGILIDAD, PRECISIÓN, VOLUNTAD, etc.)
  let secondaryStatBonus = 0;
  const secStat = eq.weapon.secondaryScalingStat;
  if (secStat === 'AGILIDAD') {
    secondaryStatBonus = Math.max(0, Math.round((stats.agility - 4) * 0.35));
  } else if (secStat === 'PRECISION') {
    secondaryStatBonus = Math.max(0, Math.round((stats.precision - 4) * 0.35));
  } else if (secStat === 'VOLUNTAD') {
    secondaryStatBonus = Math.max(0, Math.round((stats.willpower - 4) * 0.35));
  } else if (eq.weapon.family === 'DAGGER') {
    secondaryStatBonus = Math.max(0, Math.round((stats.agility - 5) * 0.3));
  }

  // Grounded stat contribution: +1 per 2 points above baseline 4 + any hybrid/secondary scaling
  const statContribution =
    Math.max(0, Math.round((statValue - 4) * 0.55)) + magicHybridBonus + secondaryStatBonus;

  let actionMultiplier = 1.0;
  let affectedEnemies: CriptaRoomEnemy[] = targetEnemy ? [targetEnemy] : [];

  if (actionType === 'WEAPON_SPECIAL') {
    const spec = eq.weapon.specialAttack;
    actionMultiplier = spec.damageMultiplier;
    if (spec.targetRule === 'ALL_ENEMIES') {
      affectedEnemies = allLivingEnemies.length > 0 ? allLivingEnemies : affectedEnemies;
    } else if (spec.targetRule === 'CLEAVE_2' || spec.targetRule === 'CHAIN_2') {
      if (targetEnemy && allLivingEnemies.length > 1) {
        const secondary = allLivingEnemies.find((e) => e.id !== targetEnemy.id);
        affectedEnemies = secondary ? [targetEnemy, secondary] : [targetEnemy];
      }
    }
  } else if (actionType === 'ABILITY') {
    const abPower = selectedAbility?.power || 8;
    actionMultiplier = Math.max(0.95, abPower / 7.2);
    if (
      selectedAbility?.targetRule === 'ALL_ENEMIES' &&
      allLivingEnemies.length > 1
    ) {
      affectedEnemies = allLivingEnemies;
    }
  }

  let statusMult = 1.0;
  if (playerHasStatus(player, 'FROST')) statusMult -= 0.18;
  if (playerHasStatus(player, 'CURSE')) statusMult -= 0.18;
  if (playerHasStatus(player, 'FEAR')) statusMult -= 0.18;
  if (playerHasStatus(player, 'WEAKENED')) statusMult -= 0.18;
  if (playerHasStatus(player, 'BLESSED')) statusMult += 0.25;
  if (playerHasStatus(player, 'STRENGTHENED')) statusMult += 0.2;
  if (playerHasStatus(player, 'INSPIRATION')) statusMult += 0.16;

  const classRes = player.classResource || 0;

  // Class Passive & Core Mechanic Resource Synergies (All 9 Classes)
  if (charId === 'caballero') {
    if (player.isDefendingThisRound) {
      statusMult += 0.25;
    }
    statusMult += classRes * 0.06;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.25;
    }
  }
  if (charId === 'mago') {
    statusMult += classRes * 0.12;
    if (classRes >= 5) {
      statusMult += 0.25; // SOBRECARGA ARCANA
    }
  }
  if (charId === 'picaro') {
    statusMult += classRes * 0.08;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.28;
    }
    if (
      targetEnemy &&
      ((targetEnemy.poisonStacks || 0) > 0 ||
        (targetEnemy.bleedStacks || 0) > 0 ||
        (targetEnemy.vulnerableTurns || 0) > 0 ||
        (targetEnemy.markedTurns || 0) > 0)
    ) {
      statusMult += 0.3;
    }
  }
  if (charId === 'cazador') {
    statusMult += classRes * 0.12;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.25;
    }
    if (
      targetEnemy &&
      ((targetEnemy.vulnerableTurns || 0) > 0 ||
        (targetEnemy.markedTurns || 0) > 0 ||
        targetEnemy.hp <= targetEnemy.maxHp * 0.5 ||
        (targetEnemy.curseTurns || 0) > 0)
    ) {
      statusMult += 0.25;
    }
  }
  if (charId === 'clerigo') {
    statusMult += classRes * 0.08;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.22;
    }
  }
  if (charId === 'alquimista') {
    statusMult += classRes * 0.1;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.25;
    }
  }

  // BÁRBARO: FURIA thresholds & missing HP scaling (Frenesí de Ceniza)
  if (charId === 'barbaro') {
    const missingHpRatio = Math.max(
      0,
      Math.min(0.8, (player.maxHp - player.hp) / Math.max(1, player.maxHp))
    );
    statusMult += missingHpRatio * 0.35;
    if (classRes >= 75) {
      statusMult += 0.32;
    } else if (classRes >= 50) {
      statusMult += 0.2;
    } else if (classRes >= 25) {
      statusMult += 0.1;
    }
    if (
      actionType === 'ABILITY' &&
      selectedAbility?.id === 'quebrantahuesos' &&
      targetEnemy &&
      ((targetEnemy.armor || 0) > 0 ||
        (targetEnemy.stunTurns || 0) > 0 ||
        (targetEnemy.vulnerableTurns || 0) > 0)
    ) {
      statusMult += 0.35;
    }
  }

  // BARDO: COMPÁS (Tempo 4 = Finale Resonante +35% potencia)
  if (charId === 'bardo') {
    if (classRes >= 4) {
      statusMult += 0.35;
    } else if (classRes === 3) {
      statusMult += 0.15;
    }
  }

  // NIGROMANTE: ESENCIA scaling & Curses/Alchemical synergy
  if (charId === 'nigromante') {
    statusMult += classRes * 0.06;
    if (actionType === 'ABILITY' && selectedAbility?.consumesAllResource && classRes > 0) {
      statusMult += classRes * 0.24;
    }
    if (
      targetEnemy &&
      ((targetEnemy.curseTurns || 0) > 0 ||
        (targetEnemy.poisonStacks || 0) > 0 ||
        (targetEnemy.burnStacks || 0) > 0)
    ) {
      statusMult += 0.22;
    }
  }

  // Relic Synergies
  if (
    actionType === 'ABILITY' &&
    (playerHasRelic(player, partyRelics, 'libro_prohibido') ||
      playerHasRelic(player, partyRelics, 'sello_del_vacio'))
  ) {
    statusMult += 0.28;
  }
  if (playerHasRelic(player, partyRelics, 'corona_de_cristal')) {
    statusMult += 0.32;
  }
  if (
    targetEnemy &&
    (targetEnemy.isElite || targetEnemy.isMiniboss || targetEnemy.isBoss) &&
    playerHasRelic(player, partyRelics, 'diente_del_rey')
  ) {
    statusMult += 0.25;
  }

  if (
    targetEnemy &&
    eq.weapon.undeadBonusPct &&
    (targetEnemy.spriteArchetype === 'skeleton_warrior' ||
      targetEnemy.spriteArchetype === 'bone_colossus' ||
      targetEnemy.spriteArchetype === 'chained_wraith' ||
      targetEnemy.spriteArchetype === 'sand_mummy')
  ) {
    statusMult += eq.weapon.undeadBonusPct / 100;
  }

  let matchupState: 'WEAKNESS' | 'RESISTANCE' | 'NEUTRAL' = 'NEUTRAL';
  let matchupDeltaPct = 0;

  if (targetEnemy) {
    const matchup = getWeaponVsEnemyMatchupSummary(player, actionType, targetEnemy);
    statusMult *= matchup.multiplier;
    matchupState = matchup.state;
    matchupDeltaPct = matchup.deltaPct;

    // Tradeoff from Runa de Aguja Carmesí: -20% non-crit damage vs heavily armored targets (DEF >= 4)
    if (
      eq.activeRune?.heavyArmorNonCritPenaltyPct &&
      (targetEnemy.armor || 0) >= 4
    ) {
      statusMult *= 1 - eq.activeRune.heavyArmorNonCritPenaltyPct / 100;
    }
  }

  if (targetEnemy && (targetEnemy.vulnerableTurns || 0) > 0) {
    statusMult += 0.25;
  }

  statusMult = Math.max(0.45, statusMult);

  const armorPierce =
    (actionType === 'WEAPON_SPECIAL' ? eq.weapon.specialAttack.armorPierce || 0 : 0) +
    (actionType === 'ABILITY' ? selectedAbility?.armorBreak || 0 : 0) +
    stats.armorPierceBonus +
    (charId === 'cazador' ? 2 : charId === 'picaro' ? 1 : charId === 'barbaro' && classRes >= 50 ? 2 : 0) +
    (playerHasRelic(player, partyRelics, 'diente_del_rey') ? 2 : 0);

  let enemyMitigation = 1;
  if (targetEnemy) {
    const baseArmor =
      typeof targetEnemy.armor === 'number' ? targetEnemy.armor : targetEnemy.defense || 0;
    const rawDef = isMagical
      ? computeEnemyApproxDamageRange(targetEnemy).magicRes
      : baseArmor +
        (targetEnemy.armorBuffBonus || 0) +
        ((targetEnemy.defendingRoundsRemaining || 0) > 0 ? 3 : 0);
    const effectiveDef = Math.max(0, rawDef - armorPierce);
    enemyMitigation = Math.round(effectiveDef * 0.6);
  }

  const rawMin = (eq.scaledMin + statContribution) * actionMultiplier * statusMult;
  const rawMax = (eq.scaledMax + statContribution) * actionMultiplier * statusMult;

  const min = Math.max(2, Math.round(rawMin - enemyMitigation));
  const max = Math.max(min + 1, Math.round(rawMax - enemyMitigation));

  const targetCount = Math.max(1, affectedEnemies.length);
  const label =
    targetCount > 1 ? `~${min}–${max} × ${targetCount}` : `~${min}–${max}`;

  return {
    min,
    max,
    minDamage: min,
    maxDamage: max,
    targetCount,
    affectedEnemyIds: affectedEnemies.map((e) => e.id),
    label,
    isMagical,
    damageType: eq.activeDamageType,
    damageTypeLabel: dmgMeta.shortLabel,
    matchupState,
    matchupDeltaPct,
  };
}

/**
 * Authoritative combat damage roller used by the server so actual combat outcomes
 * match the weapon & stat preview unless amplified by an explicit Critical Hit!
 */
export function rollAuthoritativePlayerDamage(
  player: CriptaPlayer,
  actionType: 'ATTACK' | 'WEAPON_SPECIAL' | 'ABILITY',
  targetEnemy: CriptaRoomEnemy,
  currentTurn: number,
  partyRelics: CriptaAcquiredRelic[],
  isSecondaryTarget = false,
  abilityId?: string
): {
  damage: number;
  isCrit: boolean;
  isMagical: boolean;
  damageType: CriptaDamageType;
  matchupState: 'WEAKNESS' | 'RESISTANCE' | 'NEUTRAL';
  appliedOnHitStatus?: CriptaStatusEffectType;
} {
  const est = estimatePlayerActionDamage(
    player,
    actionType,
    targetEnemy,
    [targetEnemy],
    partyRelics,
    abilityId
  );
  const eq = getEquippedWeaponForPlayer(player);
  const stats = computePlayerEffectiveStats(player);

  // Deterministic roll between est.min and est.max (PRECISIÓN tightens variance toward upper bound)
  const hash =
    ((currentTurn * 37 + player.seatIndex * 19 + targetEnemy.hp * 13) & 0x7fffffff) % 100;
  const precisionFloor = Math.min(0.3, Math.max(0, (stats.precision - 5) * 0.04));
  const t = Math.min(1, precisionFloor + ((hash % 100) / 100) * (1 - precisionFloor));
  let rolled = Math.round(est.min + t * (est.max - est.min));

  if (isSecondaryTarget) {
    const secMult = eq.weapon.specialAttack.secondaryMultiplier || 0.65;
    rolled = Math.max(2, Math.round(rolled * secMult));
  }

  const hasWeakened = Boolean(playerHasStatus(player, 'WEAKENED'));
  const hasBlessed = Boolean(playerHasStatus(player, 'BLESSED'));
  const hasCritBoost = Boolean(playerHasStatus(player, 'CRIT_BOOST'));
  const hasInspiration = Boolean(playerHasStatus(player, 'INSPIRATION'));
  const critThreshold =
    stats.critChancePct +
    (hasBlessed ? 10 : 0) +
    (hasCritBoost ? 20 : 0) +
    (hasInspiration ? 10 : 0);
  const critRoll = ((currentTurn * 53 + player.seatIndex * 29 + targetEnemy.maxHp) & 0x7fffffff) % 100;
  const isCrit = !hasWeakened && !isSecondaryTarget && critRoll < critThreshold;

  if (isCrit) {
    // If Runa de Aguja Carmesí is equipped, critical hits ignore the heavy-armor non-crit penalty!
    if (eq.activeRune?.heavyArmorNonCritPenaltyPct && (targetEnemy.armor || 0) >= 4) {
      rolled = Math.round(rolled / (1 - eq.activeRune.heavyArmorNonCritPenaltyPct / 100));
    }
    const baseCritMult = stats.critDamageMult || 1.45;
    const critMult = playerHasRelic(player, partyRelics, 'diente_del_rey')
      ? baseCritMult + 0.2
      : baseCritMult;
    rolled = Math.max(rolled + 2, Math.round(rolled * critMult));
  }

  let appliedOnHitStatus: CriptaStatusEffectType | undefined;
  if (actionType === 'WEAPON_SPECIAL' && eq.weapon.specialAttack.appliesStatus) {
    appliedOnHitStatus = eq.weapon.specialAttack.appliesStatus;
    if (
      eq.activeRune?.disablesBleedAndPoison &&
      (appliedOnHitStatus === 'BLEED' || appliedOnHitStatus === 'POISON')
    ) {
      appliedOnHitStatus = eq.effectiveOnHitStatus;
    }
  } else if (isCrit && eq.effectiveOnCritStatus) {
    appliedOnHitStatus = eq.effectiveOnCritStatus;
  } else if (eq.effectiveOnHitStatus) {
    appliedOnHitStatus = eq.effectiveOnHitStatus;
  }

  return {
    damage: Math.max(2, rolled),
    isCrit,
    isMagical: est.isMagical,
    damageType: est.damageType,
    matchupState: est.matchupState,
    appliedOnHitStatus,
  };
}

export function pickWeaponDropForDungeon(
  dungeonId: CriptaDungeonId,
  roomIndex: number,
  isRareOrElite: boolean,
  preferredClassIds?: CriptaCharacterId[]
): CriptaWeaponId {
  const uncommonPool: CriptaWeaponId[] = [
    'espada_del_sepulcro',
    'vara_de_cristal_astral',
    'hojas_colmillo_venenoso',
    'arco_de_espinas',
    'pico_de_minero_runico',
    'martillo_del_juicio',
    'gran_hacha_barbara',
    'laud_resonancia_arcana',
    'guadana_de_hueso',
  ];
  const rarePool: CriptaWeaponId[] = [
    'espadon_del_rey_hundido',
    'hacha_forja_infernal',
    'grimorio_prohibido_arma',
    'ballesta_de_asedio',
    'simbolo_del_alba',
    'catalizador_esporas',
    'estoque_carmesi',
    'alabarda_del_juramento',
    'cetro_del_eclipse',
    'guadana_del_verdugo',
    'relicario_serafin',
    'canon_de_azufre',
    'guantelete_mutageno',
    'mazo_colosal_rompecraneos',
    'viola_del_eclipse',
    'grimorio_sepulcral',
  ];
  const basePool = isRareOrElite || roomIndex >= 3 ? rarePool : uncommonPool;
  if (preferredClassIds && preferredClassIds.length > 0) {
    const classMatched = basePool.filter((wId) => {
      const def = CRIPTA_WEAPONS_REGISTRY[wId];
      return def?.preferredClasses.some((c) => preferredClassIds.includes(c));
    });
    if (classMatched.length > 0) {
      const idx =
        Math.abs(dungeonId.length * 13 + roomIndex * 7 + (isRareOrElite ? 5 : 0)) %
        classMatched.length;
      return classMatched[idx];
    }
  }
  const pool = isRareOrElite ? rarePool : uncommonPool;
  const idx = (dungeonId.length + roomIndex * 3) % pool.length;
  return pool[idx];
}

export function pickWeaponRuneDropForDungeon(
  dungeonId: CriptaDungeonId,
  roomIndex: number,
  isRareOrElite: boolean
): CriptaWeaponRuneId {
  const biomePreferred: Partial<Record<CriptaDungeonId, CriptaWeaponRuneId[]>> = {
    forja_infernal: ['runa_brasa_infernal', 'runa_plomo_contundente'],
    cripta_de_cristal: ['runa_escarcha_permafrost', 'runa_resonancia_astral'],
    cementerio_de_gigantes: ['runa_luz_consagrada', 'runa_plomo_contundente'],
    catacumbas_del_rey: ['runa_luz_consagrada', 'runa_plomo_contundente'],
    jardin_podrido: ['runa_toxina_abisal', 'runa_brasa_infernal'],
    alcantarillas_imperiales: ['runa_toxina_abisal', 'runa_aguja_perforante'],
    biblioteca_prohibida: ['runa_resonancia_astral', 'runa_vacio_umbrio'],
    torre_del_astrologo: ['runa_resonancia_astral', 'runa_escarcha_permafrost'],
    palacio_de_los_espejos: ['runa_resonancia_astral', 'runa_aguja_perforante'],
    cavernas_heladas: ['runa_escarcha_permafrost', 'runa_plomo_contundente'],
    santuario_de_sangre: ['runa_aguja_perforante', 'runa_vacio_umbrio'],
    el_abismo: ['runa_vacio_umbrio', 'runa_resonancia_astral'],
  };
  const preferred = biomePreferred[dungeonId];
  if (preferred && preferred.length > 0 && !isRareOrElite) {
    return preferred[roomIndex % preferred.length];
  }
  const idx =
    Math.abs(dungeonId.length * 11 + roomIndex * 5 + (isRareOrElite ? 3 : 0)) %
    ALL_WEAPON_RUNE_IDS.length;
  return ALL_WEAPON_RUNE_IDS[idx];
}

export function buildRoomEncounterSubjectAndObjects(
  dungeonId: CriptaDungeonId,
  roomType: CriptaCanonicalRoomType,
  roomIndex: number,
  rng: () => number
): {
  encounterSubject: CriptaDungeonRoom['encounterSubject'];
  interactiveObjects: CriptaRoomInteractiveObject[];
} {
  let encounterSubject: CriptaDungeonRoom['encounterSubject'] | undefined;

  if (roomType === 'SHOP') {
    encounterSubject = {
      archetype: 'MERCHANT',
      name: 'Vendedor del Umbral',
      roleSubtitle: 'MERCADER Y FORJADOR DE RELIQUIAS',
      dialogueQuote: '«Mis hojas y elixires cuestan oro, pero vuestra sangre vale más...»',
    };
  } else if (roomType === 'REST') {
    encounterSubject = {
      archetype: 'CAMPFIRE_SANCTUARY',
      name: 'Hoguera de Ceniza Viva',
      roleSubtitle: 'REFUGIO Y YUNQUE DE CAMPAÑA',
      dialogueQuote: 'Las brasas restauran el cuerpo o permiten templar el filo de vuestras armas.',
    };
  } else if (roomType === 'SHRINE') {
    encounterSubject = {
      archetype: 'SACRED_SHRINE',
      name: 'Altar de la Llama Pálida',
      roleSubtitle: 'SANTUARIO CONSAGRADO',
      dialogueQuote: 'El cáliz responde a la fe del grupo y purifica las maldiciones.',
    };
  } else if (roomType === 'TREASURE' || roomType === 'LOOT' || roomType === 'SECRET') {
    encounterSubject = {
      archetype: 'TREASURE_CHEST',
      name: roomType === 'SECRET' ? 'Relicario Oculto' : 'Arca del Soberano',
      roleSubtitle: 'BOTÍN Y EQUIPAMIENTO',
      dialogueQuote: 'Un cofre reforzado con herrajes antiguos aguarda sobre el pedestal.',
    };
  } else if (roomType === 'TRAP') {
    encounterSubject = {
      archetype: 'MECHANICAL_TRAP',
      name: 'Mecanismo de Cuchillas y Cadenas',
      roleSubtitle: 'PRUEBA DE ATRIBUTOS Y CLASE',
      dialogueQuote: 'Los engranajes vibran bajo las losas. Coordinad quién desactiva el cierre.',
    };
  } else if (roomType === 'PUZZLE') {
    encounterSubject = {
      archetype: 'ANCIENT_SEAL',
      name: 'Tríada de Obeliscos Rúnicos',
      roleSubtitle: 'PRUEBA DE COOPERACIÓN',
      dialogueQuote: 'Los glifos ancestrales deben encenderse en armonía para abrir el sello.',
    };
  } else if (roomType === 'EVENT' || roomType === 'DECISION') {
    const eventProfiles: Array<{
      archetype: CriptaEncounterSubjectArchetype;
      name: string;
      roleSubtitle: string;
      dialogueQuote: string;
    }> = [
      {
        archetype: 'SPECTRAL_KNIGHT',
        name: 'Caballero Espectral Encadenado',
        roleSubtitle: 'ESPÍRITU PRISIONERO · ENCUENTRO INTERACTIVO',
        dialogueQuote: '«Romped mis cadenas de hierro o interrogad mi memoria si osáis...»',
      },
      {
        archetype: 'CURSED_WELL',
        name: 'Pozo de las Aguas Abisales',
        roleSubtitle: 'FUENTE DE INCERTIDUMBRE',
        dialogueQuote: 'El agua fosforescente emana poder arcano y un susurro inquietante.',
      },
      {
        archetype: 'BLACKSMITH_FORGE',
        name: 'Yunque del Herrero Ciego',
        roleSubtitle: 'FORJA ANTIGUA DE ARMAS',
        dialogueQuote: '«Traedme acero y brasas; haré que vuestra arma cante en la oscuridad.»',
      },
      {
        archetype: 'ABYSSAL_MIRROR',
        name: 'Espejo de los Reflejos Rotos',
        roleSubtitle: 'PRUEBA PERSONAL DEL AVENTURERO',
        dialogueQuote: 'El cristal líquido fija su mirada sobre uno de vosotros.',
      },
      {
        archetype: 'INJURED_HOUND',
        name: 'Sabueso de Cripta Herido',
        roleSubtitle: 'CRIATURA DEL SUBSUELO',
        dialogueQuote: 'Una bestia acorralada os observa con cautela junto a un alijo abandonado.',
      },
    ];
    const picked = eventProfiles[(dungeonId.length + roomIndex) % eventProfiles.length];
    encounterSubject = { ...picked };
  }

  // Generate 1–2 optional clickable room objects for observant players (Sections 45 & 46)
  const objectCatalog: Array<{
    objectKind: CriptaRoomInteractiveObject['objectKind'];
    label: string;
    hint: string;
    xPercent: number;
    yPercent: number;
  }> = [
    {
      objectKind: 'SKULL',
      label: 'Cráneo con Runa Grabada',
      hint: 'Un cráneo antiguo oculta un compartimento bajo la mandíbula.',
      xPercent: 16,
      yPercent: 78,
    },
    {
      objectKind: 'WALL_CRACK',
      label: 'Grieta en la Mampostería',
      hint: 'Algo reluce tras las piedras sueltas del muro.',
      xPercent: 82,
      yPercent: 32,
    },
    {
      objectKind: 'MUSHROOM',
      label: 'Hongo Luminiscente',
      hint: 'Sus esporas desprenden un aroma alquímico concentrado.',
      xPercent: 22,
      yPercent: 72,
    },
    {
      objectKind: 'CHALICE',
      label: 'Cáliz Polvoriento',
      hint: 'Un recipiente ceremonial olvidado en la repisa.',
      xPercent: 78,
      yPercent: 64,
    },
    {
      objectKind: 'SKELETON',
      label: 'Restos de Explorador',
      hint: 'Conserva su zurrón de cuero entre las losas.',
      xPercent: 18,
      yPercent: 82,
    },
  ];

  const interactiveObjects: CriptaRoomInteractiveObject[] = [];
  if (rng() > 0.25) {
    const objTemplate = objectCatalog[(roomIndex * 2 + dungeonId.length) % objectCatalog.length];
    interactiveObjects.push({
      id: `room_obj_${roomIndex}_0`,
      label: objTemplate.label,
      hint: objTemplate.hint,
      objectKind: objTemplate.objectKind,
      xPercent: objTemplate.xPercent,
      yPercent: objTemplate.yPercent,
      discovered: false,
    });
  }

  return {
    encounterSubject,
    interactiveObjects,
  };
}

export interface CriptaMysteriousEventBlueprint {
  eventId: string;
  inspectLabel: string;
  inspectSubtitle: string;
  respectLabel: string;
  respectSubtitle: string;
  cautionLabel: string;
  cautionSubtitle: string;
}

const MYSTERIOUS_EVENT_BLUEPRINTS: CriptaMysteriousEventBlueprint[] = [
  {
    eventId: 'ESPECTRO_ENCADENADO',
    inspectLabel: 'DESCIFRAR RUNAS DEL ESPECTRO',
    inspectSubtitle: 'Interrogar su memoria con sabiduría arcana',
    respectLabel: 'LIBERAR SUS CADENAS DE HIERRO',
    respectSubtitle: 'Romper los grilletes y honrar su juramento',
    cautionLabel: 'RODEAR EL PEDESTAL EN SILENCIO',
    cautionSubtitle: 'Evitar perturbar el sello ancestral',
  },
  {
    eventId: 'POZO_ABISAL',
    inspectLabel: 'EXTRAER ESENCIA DEL POZO ABISAL',
    inspectSubtitle: 'Destilar el agua fosforescente en un vial',
    respectLabel: 'SUMERGIR EL ARMA EN LAS AGUAS',
    respectSubtitle: 'Templar el acero con el poder del subsuelo',
    cautionLabel: 'SELLAR EL BROCAL Y AVANZAR',
    cautionSubtitle: 'Recoger las monedas del borde sin beber',
  },
  {
    eventId: 'AUTOMATA_HERRERO',
    inspectLabel: 'ESTUDIAR LOS PLANOS DEL HERRERO CIEGO',
    inspectSubtitle: 'Aprender los grabados rúnicos del yunque',
    respectLabel: 'AVIVAR LA FORJA Y RECLAMAR ACERO',
    respectSubtitle: 'Ayudar al forjador a completar su obra maestra',
    cautionLabel: 'TOMAR LAS BRASAS RESTANTES',
    cautionSubtitle: 'Asegurar suministros y continuar la marcha',
  },
  {
    eventId: 'ESPEJO_ASTRAL',
    inspectLabel: 'CONTEMPLAR EL ESPEJO DEL UMBRAL',
    inspectSubtitle: 'Canalizar el reflejo astral para fortalecer el espíritu',
    respectLabel: 'QUEBRAR EL CRISTAL CON ACERO',
    respectSubtitle: 'Reclamar el armamento atrapado tras el espejo',
    cautionLabel: 'CUBRIR EL ESPEJO CON UN MANTO',
    cautionSubtitle: 'Cruzar la galería sin mirar atrás',
  },
  {
    eventId: 'SABUESO_HERIDO',
    inspectLabel: 'CURAR LAS HERIDAS DEL SABUESO',
    inspectSubtitle: 'Aplicar ungüento y ganar su lealtad en la cripta',
    respectLabel: 'REGISTRAR EL ALIJO DEL EXPLORADOR',
    respectSubtitle: 'Recuperar las armas y provisiones del rincón',
    cautionLabel: 'OFRECER RACIONES Y SEGUIR ADELANTE',
    cautionSubtitle: 'Calmar a la bestia y cruzar sin conflicto',
  },
  {
    eventId: 'FUENTE_Y_JURAMENTO',
    inspectLabel: 'BEBER DE LA FUENTE ANCESTRAL',
    inspectSubtitle: 'Recibir las aguas consagradas del manantial',
    respectLabel: 'FORJAR ALIANZA CON EL GUARDIÁN',
    respectSubtitle: 'Unir aceros y jurar lealtad ante el altar',
    cautionLabel: 'ROMPER SELLO Y AVANZAR',
    cautionSubtitle: 'Quebrar la barrera mágica del umbral',
  },
  {
    eventId: 'BRASERO_Y_ARMERIA',
    inspectLabel: 'ENCENDER EL BRASERO RITUAL',
    inspectSubtitle: 'Avivar la llama ancestral de la cámara',
    respectLabel: 'REPARAR ARMADURA EN EL YUNQUE',
    respectSubtitle: 'Martillar las placas dañadas y templar el acero',
    cautionLabel: 'PURIFICAR ALTAR Y AVANZAR',
    cautionSubtitle: 'Disipar la corrupción antes de cruzar',
  },
];

export function pickMysteriousEventBlueprint(
  dungeonId: CriptaDungeonId,
  roomIndex: number
): CriptaMysteriousEventBlueprint {
  const idx = (dungeonId.length + roomIndex) % MYSTERIOUS_EVENT_BLUEPRINTS.length;
  return MYSTERIOUS_EVENT_BLUEPRINTS[idx];
}

