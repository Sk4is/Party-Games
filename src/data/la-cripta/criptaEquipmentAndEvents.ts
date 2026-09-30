import type {
  CriptaAccessoryDefinition,
  CriptaAccessoryId,
  CriptaAcquiredRelic,
  CriptaArmorDefinition,
  CriptaArmorId,
  CriptaCanonicalRoomType,
  CriptaCharacterId,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaEncounterSubjectArchetype,
  CriptaPlayer,
  CriptaRoomEnemy,
  CriptaRoomInteractiveObject,
  CriptaStatusEffectType,
  CriptaWeaponDefinition,
  CriptaWeaponId,
} from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from './criptaCatalog';
import { playerHasStatus } from './criptaStatusEffects';
import { playerHasRelic } from './criptaItemsAndRelics';
import { resolveEnemyVisualBlueprint } from './criptaBiomeBestiary';

export const WEAPON_UPGRADE_MAX_LEVEL = 3;

export const STARTER_WEAPON_BY_CLASS: Record<CriptaCharacterId, CriptaWeaponId> = {
  caballero: 'espada_oxidada',
  mago: 'baston_ceniza',
  picaro: 'dagas_melladas',
  cazador: 'arco_cazador',
  clerigo: 'maza_consagrada',
  alquimista: 'lanzador_alquimico',
};

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
};

export const CRIPTA_ARMORS_REGISTRY: Record<CriptaArmorId, CriptaArmorDefinition> = {
  jubon_desgastado: {
    id: 'jubon_desgastado',
    name: 'Jubón de Cuero',
    rarity: 'COMMON',
    bonusDefense: 1,
    bonusMaxHp: 4,
    specialEffectText: '+1 DEFENSA y +4 VIDA MÁX.',
    basePriceGold: 32,
  },
  cota_de_malla_cripta: {
    id: 'cota_de_malla_cripta',
    name: 'Cota de Malla de Cripta',
    rarity: 'UNCOMMON',
    bonusDefense: 2,
    bonusMaxHp: 6,
    specialEffectText: '+2 DEFENSA y +6 VIDA MÁX.',
    basePriceGold: 54,
  },
  coraza_del_sepulturero: {
    id: 'coraza_del_sepulturero',
    name: 'Coraza del Sepulturero',
    rarity: 'RARE',
    bonusDefense: 2,
    bonusMaxHp: 8,
    statusResistance: 'CURSE',
    specialEffectText: '+2 DEFENSA, +8 VIDA MÁX. Reduce MALDICIÓN en 1 turno.',
    basePriceGold: 74,
  },
  tunica_del_astrologo: {
    id: 'tunica_del_astrologo',
    name: 'Túnica del Astrólogo',
    rarity: 'RARE',
    bonusDefense: 1,
    bonusMaxHp: 5,
    bonusMagic: 2,
    specialEffectText: '+2 MAGIA, +1 DEFENSA, +5 VIDA MÁX.',
    basePriceGold: 72,
  },
  armadura_escamas_fungicas: {
    id: 'armadura_escamas_fungicas',
    name: 'Escamas del Jardín',
    rarity: 'UNCOMMON',
    bonusDefense: 2,
    bonusMaxHp: 6,
    statusResistance: 'POISON',
    specialEffectText: '+2 DEFENSA, +6 VIDA MÁX. Resistencia contra VENENO.',
    basePriceGold: 58,
  },
  manto_de_sombra_real: {
    id: 'manto_de_sombra_real',
    name: 'Manto de Sombra Real',
    rarity: 'RARE',
    bonusDefense: 2,
    bonusMaxHp: 7,
    statusResistance: 'BLEED',
    specialEffectText: '+2 DEFENSA, +7 VIDA MÁX. Inmunidad parcial a SANGRADO.',
    basePriceGold: 76,
  },
  placas_del_juramento: {
    id: 'placas_del_juramento',
    name: 'Placas del Juramento Eterno',
    rarity: 'RARE',
    bonusDefense: 3,
    bonusMaxHp: 10,
    specialEffectText: '+3 DEFENSA y +10 VIDA MÁX. Forjada para la vanguardia.',
    basePriceGold: 82,
  },
};

export const CRIPTA_ACCESSORIES_REGISTRY: Record<CriptaAccessoryId, CriptaAccessoryDefinition> = {
  anillo_del_boticario: {
    id: 'anillo_del_boticario',
    name: 'Anillo del Boticario',
    rarity: 'UNCOMMON',
    bonusMagic: 1,
    potionBoostPct: 20,
    specialEffectText: '+1 MAGIA · Pociones y elixires +20% efectividad.',
    basePriceGold: 48,
  },
  colgante_de_cristal: {
    id: 'colgante_de_cristal',
    name: 'Colgante de Cristal',
    rarity: 'RARE',
    bonusMagic: 2,
    specialEffectText: '+2 MAGIA · Potencia hechizos y curaciones.',
    basePriceGold: 64,
  },
  sello_del_cazador: {
    id: 'sello_del_cazador',
    name: 'Anillo del Acechador',
    rarity: 'RARE',
    bonusAttack: 2,
    critBonusPct: 10,
    specialEffectText: '+2 ATAQUE y +10% probabilidad de golpe Crítico.',
    basePriceGold: 64,
  },
  espejo_roto_accesorio: {
    id: 'espejo_roto_accesorio',
    name: 'Fragmento de Espejo Astral',
    rarity: 'UNCOMMON',
    bonusMagic: 1,
    bonusDefense: 1,
    specialEffectText: '+1 MAGIA, +1 DEFENSA · Revela secretos en espejos y altares.',
    basePriceGold: 52,
  },
  amuleto_rompeescudos: {
    id: 'amuleto_rompeescudos',
    name: 'Amuleto Rompeescudos',
    rarity: 'RARE',
    bonusAttack: 2,
    bonusDefense: 1,
    specialEffectText: '+2 ATAQUE y +1 DEFENSA · Tus golpes fracturan corazas.',
    basePriceGold: 68,
  },
  reloj_de_arena_astral: {
    id: 'reloj_de_arena_astral',
    name: 'Reloj de Arena Astral',
    rarity: 'RARE',
    bonusMagic: 2,
    critBonusPct: 8,
    specialEffectText: '+2 MAGIA y +8% Crítico · Sincroniza técnicas arcanas.',
    basePriceGold: 70,
  },
};

export function getEquippedWeaponForPlayer(player: CriptaPlayer): {
  weapon: CriptaWeaponDefinition;
  level: 1 | 2 | 3;
  scaledMin: number;
  scaledMax: number;
  bonusAttack: number;
  bonusMagic: number;
  bonusDefense: number;
} {
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const fallbackId = STARTER_WEAPON_BY_CLASS[charId] || 'espada_oxidada';
  const weaponId = player.equippedWeaponId || fallbackId;
  const weapon = CRIPTA_WEAPONS_REGISTRY[weaponId] || CRIPTA_WEAPONS_REGISTRY[fallbackId];
  const level: 1 | 2 | 3 =
    player.weaponUpgradeLevel === 3 ? 3 : player.weaponUpgradeLevel === 2 ? 2 : 1;

  const levelOffset = level - 1;
  const scaledMin = weapon.baseMinDamage + levelOffset;
  const scaledMax = weapon.baseMaxDamage + levelOffset * 2;

  const bonusAttack =
    (weapon.bonusAttack || 0) + (weapon.scalingStat === 'ATAQUE' && level >= 2 ? levelOffset : 0);
  const bonusMagic =
    (weapon.bonusMagic || 0) + (weapon.scalingStat === 'MAGIA' && level >= 2 ? levelOffset : 0);
  const bonusDefense = weapon.bonusDefense || 0;

  return {
    weapon,
    level,
    scaledMin,
    scaledMax,
    bonusAttack,
    bonusMagic,
    bonusDefense,
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
  maxHpBonus: number;
  critChancePct: number;
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

  const attack =
    (charDef?.stats.attack || 5) +
    (player.bonusAttack || 0) +
    eqWeapon.bonusAttack +
    (accDef?.bonusAttack || 0);

  const defense =
    (charDef?.stats.defense || 5) +
    (player.bonusDefense || 0) +
    eqWeapon.bonusDefense +
    (armorDef?.bonusDefense || 0) +
    (accDef?.bonusDefense || 0);

  const magic =
    (charDef?.stats.magic || 5) +
    (player.bonusMagic || 0) +
    eqWeapon.bonusMagic +
    (armorDef?.bonusMagic || 0) +
    (accDef?.bonusMagic || 0);

  const maxHpBonus = armorDef?.bonusMaxHp || 0;

  const baseCrit = charId === 'picaro' ? 18 : charId === 'cazador' ? 15 : 10;
  const critChancePct =
    baseCrit + (eqWeapon.weapon.critBonusPct || 0) + (accDef?.critBonusPct || 0);

  const potionBoostPct =
    (charId === 'alquimista' ? 15 : 0) +
    (eqWeapon.weapon.potionBoostPct || 0) +
    (accDef?.potionBoostPct || 0) +
    (eqWeapon.level >= 2 && eqWeapon.weapon.family === 'ALCHEMICAL' ? 10 : 0);

  const healBoostPct =
    (charId === 'clerigo' ? 15 : 0) +
    (eqWeapon.weapon.healBoostPct || 0) +
    (eqWeapon.level >= 2 && eqWeapon.weapon.family === 'MACE' ? 10 : 0);

  return {
    attack,
    defense,
    magic,
    maxHpBonus,
    critChancePct,
    potionBoostPct,
    healBoostPct,
  };
}

export interface CriptaEnemyTraitEntry {
  id: 'SAGRADO' | 'MAGICO' | 'FISICO' | 'CONTUNDENTE' | 'PERFORANTE' | 'ALQUIMICO' | 'VENENO';
  label: string;
  modifierText: string;
  multiplierDelta: number; // e.g. +0.25 for +25% weakness, -0.20 for resistance
  iconKind: 'holy' | 'arcane' | 'blunt' | 'pierce' | 'alchemy' | 'poison' | 'slash';
}

/**
 * Canonical enemy weakness & resistance profile derived from creature archetype.
 * Used both by Enemy Inspection UI AND by the authoritative combat damage resolver!
 */
export function getEnemyWeaknessAndResistanceProfile(enemy: CriptaRoomEnemy): {
  weaknesses: CriptaEnemyTraitEntry[];
  resistances: CriptaEnemyTraitEntry[];
} {
  const blueprint = resolveEnemyVisualBlueprint(enemy);
  if (blueprint && blueprint.weaknesses.length > 0) {
    return {
      weaknesses: blueprint.weaknesses,
      resistances: blueprint.resistances,
    };
  }
  const arch = enemy.spriteArchetype;

  if (arch === 'skeleton_warrior' || arch === 'bone_colossus') {
    return {
      weaknesses: [
        {
          id: 'CONTUNDENTE',
          label: 'CONTUNDENTE',
          modifierText: '+25% daño',
          multiplierDelta: 0.25,
          iconKind: 'blunt',
        },
        {
          id: 'SAGRADO',
          label: 'SAGRADO',
          modifierText: '+20% daño',
          multiplierDelta: 0.2,
          iconKind: 'holy',
        },
      ],
      resistances: [
        {
          id: 'PERFORANTE',
          label: 'PERFORANTE',
          modifierText: '-20% daño',
          multiplierDelta: -0.2,
          iconKind: 'pierce',
        },
        {
          id: 'VENENO',
          label: 'VENENO',
          modifierText: 'Resistente',
          multiplierDelta: -0.25,
          iconKind: 'poison',
        },
      ],
    };
  }

  if (arch === 'chained_wraith' || arch === 'mirror_doppelganger' || arch === 'lich_sovereign') {
    return {
      weaknesses: [
        {
          id: 'SAGRADO',
          label: 'SAGRADO',
          modifierText: '+25% daño',
          multiplierDelta: 0.25,
          iconKind: 'holy',
        },
        {
          id: 'MAGICO',
          label: 'ARCANO',
          modifierText: '+15% daño',
          multiplierDelta: 0.15,
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
      ],
    };
  }

  if (arch === 'fungal_beast' || arch === 'bat_swarm') {
    return {
      weaknesses: [
        {
          id: 'ALQUIMICO',
          label: 'FUEGO / ALQUIMIA',
          modifierText: '+25% daño',
          multiplierDelta: 0.25,
          iconKind: 'alchemy',
        },
        {
          id: 'FISICO',
          label: 'TAJO AFILADO',
          modifierText: '+15% daño',
          multiplierDelta: 0.15,
          iconKind: 'slash',
        },
      ],
      resistances: [
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

  if (arch === 'Stone_gargoyle') {
    return {
      weaknesses: [
        {
          id: 'CONTUNDENTE',
          label: 'CONTUNDENTE / PICO',
          modifierText: '+25% daño',
          multiplierDelta: 0.25,
          iconKind: 'blunt',
        },
        {
          id: 'MAGICO',
          label: 'MAGIA',
          modifierText: '+20% daño',
          multiplierDelta: 0.2,
          iconKind: 'arcane',
        },
      ],
      resistances: [
        {
          id: 'PERFORANTE',
          label: 'FLECHAS / DAGAS',
          modifierText: '-25% daño',
          multiplierDelta: -0.25,
          iconKind: 'pierce',
        },
      ],
    };
  }

  // Default for cultist_acolyte, inquisitor_lord, crypt_warden, etc.
  return {
    weaknesses: [
      {
        id: 'PERFORANTE',
        label: 'PERFORANTE',
        modifierText: '+20% daño',
        multiplierDelta: 0.2,
        iconKind: 'pierce',
      },
      {
        id: 'FISICO',
        label: 'ACERO',
        modifierText: '+15% daño',
        multiplierDelta: 0.15,
        iconKind: 'slash',
      },
    ],
    resistances: [
      {
        id: 'MAGICO',
        label: 'SOMBRA / ARCANO',
        modifierText: '-15% daño',
        multiplierDelta: -0.15,
        iconKind: 'arcane',
      },
    ],
  };
}

export function computeWeaponVsEnemyTraitMultiplier(
  player: CriptaPlayer,
  actionType: 'ATTACK' | 'WEAPON_SPECIAL' | 'ABILITY',
  enemy: CriptaRoomEnemy
): number {
  const eq = getEquippedWeaponForPlayer(player);
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const fam = eq.weapon.family;
  const profile = getEnemyWeaknessAndResistanceProfile(enemy);

  const activeTags = new Set<CriptaEnemyTraitEntry['id']>();
  if (fam === 'MACE' || charId === 'clerigo') {
    activeTags.add('SAGRADO');
    activeTags.add('CONTUNDENTE');
  }
  if (fam === 'PICKAXE' || fam === 'AXE') {
    activeTags.add('CONTUNDENTE');
    activeTags.add('FISICO');
  }
  if (fam === 'SWORD') {
    activeTags.add('FISICO');
  }
  if (fam === 'DAGGER' || fam === 'BOW' || charId === 'picaro' || charId === 'cazador') {
    activeTags.add('PERFORANTE');
  }
  if (fam === 'STAFF' || (actionType === 'ABILITY' && charId === 'mago')) {
    activeTags.add('MAGICO');
  }
  if (fam === 'ALCHEMICAL' || charId === 'alquimista') {
    activeTags.add('ALQUIMICO');
  }

  let delta = 0;
  for (const w of profile.weaknesses) {
    if (activeTags.has(w.id)) {
      delta = Math.max(delta, w.multiplierDelta);
    }
  }
  if (delta === 0) {
    for (const r of profile.resistances) {
      if (activeTags.has(r.id)) {
        delta = Math.min(delta, r.multiplierDelta);
      }
    }
  }
  return 1 + delta;
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
} {
  const eq = getEquippedWeaponForPlayer(player);
  const stats = computePlayerEffectiveStats(player);
  const charId = player.characterId || player.selectedCharacterId || 'caballero';
  const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
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
      label: selectedAbility.kind === 'HEAL' ? 'CURACIÓN' : 'PROTECCIÓN',
      isMagical: true,
    };
  }

  const isMagical =
    eq.weapon.scalingStat === 'MAGIA' ||
    (actionType === 'ABILITY' &&
      (charId === 'mago' || charId === 'clerigo' || charId === 'alquimista'));

  const statValue = isMagical ? stats.magic : stats.attack;
  // Grounded stat contribution: +1 per 2 points above baseline 4
  const statContribution = Math.max(0, Math.round((statValue - 4) * 0.55));

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

  // Class Passive Synergies
  if (charId === 'caballero' && player.isDefendingThisRound) {
    statusMult += 0.3;
  }
  if (
    charId === 'picaro' &&
    targetEnemy &&
    ((targetEnemy.poisonStacks || 0) > 0 || (targetEnemy.vulnerableTurns || 0) > 0)
  ) {
    statusMult += 0.3;
  }
  if (
    charId === 'cazador' &&
    targetEnemy &&
    ((targetEnemy.vulnerableTurns || 0) > 0 || targetEnemy.hp <= targetEnemy.maxHp * 0.5)
  ) {
    statusMult += 0.25;
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
      targetEnemy.spriteArchetype === 'chained_wraith')
  ) {
    statusMult += eq.weapon.undeadBonusPct / 100;
  }

  if (targetEnemy) {
    const traitMult = computeWeaponVsEnemyTraitMultiplier(player, actionType, targetEnemy);
    statusMult *= traitMult;
  }

  if (targetEnemy && (targetEnemy.vulnerableTurns || 0) > 0) {
    statusMult += 0.25;
  }

  statusMult = Math.max(0.5, statusMult);

  const armorPierce =
    (actionType === 'WEAPON_SPECIAL' ? eq.weapon.specialAttack.armorPierce || 0 : 0) +
    (actionType === 'ABILITY' ? selectedAbility?.armorBreak || 0 : 0) +
    (charId === 'cazador' ? 3 : charId === 'picaro' ? 2 : 0) +
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

  // Deterministic roll between est.min and est.max
  const hash =
    ((currentTurn * 37 + player.seatIndex * 19 + targetEnemy.hp * 13) & 0x7fffffff) % 100;
  const t = (hash % 100) / 100;
  let rolled = Math.round(est.min + t * (est.max - est.min));

  if (isSecondaryTarget) {
    const secMult = eq.weapon.specialAttack.secondaryMultiplier || 0.65;
    rolled = Math.max(2, Math.round(rolled * secMult));
  }

  const hasWeakened = Boolean(playerHasStatus(player, 'WEAKENED'));
  const hasBlessed = Boolean(playerHasStatus(player, 'BLESSED'));
  const critThreshold = stats.critChancePct + (hasBlessed ? 10 : 0);
  const critRoll = ((currentTurn * 53 + player.seatIndex * 29 + targetEnemy.maxHp) & 0x7fffffff) % 100;
  const isCrit = !hasWeakened && !isSecondaryTarget && critRoll < critThreshold;

  if (isCrit) {
    const critMult = playerHasRelic(player, partyRelics, 'diente_del_rey') ? 1.65 : 1.45;
    rolled = Math.max(rolled + 2, Math.round(rolled * critMult));
  }

  let appliedOnHitStatus: CriptaStatusEffectType | undefined;
  if (actionType === 'WEAPON_SPECIAL' && eq.weapon.specialAttack.appliesStatus) {
    appliedOnHitStatus = eq.weapon.specialAttack.appliesStatus;
  } else if (isCrit && eq.weapon.onCritStatus) {
    appliedOnHitStatus = eq.weapon.onCritStatus;
  } else if (eq.weapon.onHitStatus) {
    appliedOnHitStatus = eq.weapon.onHitStatus;
  }

  return {
    damage: Math.max(2, rolled),
    isCrit,
    isMagical: est.isMagical,
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
