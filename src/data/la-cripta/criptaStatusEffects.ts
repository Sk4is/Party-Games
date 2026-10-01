import type {
  CriptaDungeonId,
  CriptaPlayer,
  CriptaPlayerStatusEffect,
  CriptaStatusCatalogEntry,
  CriptaStatusEffectDefinition,
  CriptaStatusEffectType,
} from '../../types/laCripta';

export const CRIPTA_STATUS_EFFECTS_REGISTRY: Record<
  CriptaStatusEffectType,
  CriptaStatusEffectDefinition
> = {
  // =========================================================================
  // NEGATIVE STATUSES / DEBUFFS / CONTROL (15)
  // =========================================================================
  POISON: {
    id: 'POISON',
    name: 'VENENO',
    code: 'VEN',
    category: 'DAMAGE_OVER_TIME',
    type: 'debuff',
    shortDescription: 'Daño periódico de toxina al final del turno (ignora armadura).',
    description:
      'Toxina virulenta que corroe la sangre: pierde PV por acumulación al final de cada turno (ignora armadura).',
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
    shortDescription: 'Daño ígneo al final del turno y merma 1 punto de Armadura.',
    description:
      'Brasas infernales adheridas a la coraza: pierde PV al final del turno y reduce 1 de Armadura.',
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
    shortDescription: 'Hemorragia periódica al final del turno; se cierra al curarse.',
    description:
      'Herida abierta por cuchillas: pierde PV al realizar un ataque y al final del turno. Se cierra al recibir curación.',
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
    shortDescription: 'Distorsiona la puntería y puede desviar ataques a otro objetivo.',
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
  FEAR: {
    id: 'FEAR',
    name: 'MIEDO',
    code: 'MIE',
    category: 'CONTROL',
    type: 'debuff',
    shortDescription: 'El pavor abisal reduce la potencia ofensiva y de habilidades.',
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
  VULNERABLE: {
    id: 'VULNERABLE',
    name: 'VULNERABLE',
    code: 'VUL',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Defensa resquebrajada: recibe un +25% de daño adicional.',
    description:
      'Guardia fracturada: cualquier ataque recibido inflige un +25% de daño adicional mientras dure la brecha.',
    icon: 'vulnerable',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 2,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E05A47',
      borderColor: '#9E3324',
      bgTint: '#260E0B',
    },
  },
  MARKED: {
    id: 'MARKED',
    name: 'MARCADO',
    code: 'MRC',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Objetivo prioritario: el próximo golpe enemigo inflige +35% de daño.',
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
  BLINDED: {
    id: 'BLINDED',
    name: 'CEGADO',
    code: 'CEG',
    category: 'CONTROL',
    type: 'debuff',
    shortDescription: 'Visión nublada: reduce drásticamente la precisión y el crítico.',
    description:
      'Ceniza o miasma en los ojos: anula la probabilidad de golpe crítico y reduce en un 25% el daño de ataques directos.',
    icon: 'blinded',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#9C8AA5',
      borderColor: '#63536B',
      bgTint: '#17121C',
    },
  },
  SILENCED: {
    id: 'SILENCED',
    name: 'SILENCIADO',
    code: 'SIL',
    category: 'CONTROL',
    type: 'debuff',
    shortDescription: 'Sello arcano que amortigua el poder mágico y de conjuros.',
    description:
      'Sello inquisitorial sobre la voz: reduce en un 30% la potencia de las habilidades mágicas e impide canalizar plegarias.',
    icon: 'silenced',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 30,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#B57CFF',
      borderColor: '#7642B8',
      bgTint: '#1D102E',
    },
  },
  STUNNED: {
    id: 'STUNNED',
    name: 'ATURDIDO',
    code: 'ATU',
    category: 'CONTROL',
    type: 'debuff',
    shortDescription: 'Conmoción severa que entorpece la capacidad de reacción.',
    description:
      'Impacto contundente en el cráneo: reduce la defensa activa y merma la eficacia de la acción del turno.',
    icon: 'stunned',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 1,
    defaultPotency: 35,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FFD166',
      borderColor: '#B88A28',
      bgTint: '#261D0A',
    },
  },
  FROST: {
    id: 'FROST',
    name: 'CONGELADO',
    code: 'CNG',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Escarcha sepulcral que reduce el daño en un 25% y entumece.',
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
    shortDescription: 'Sello oscuro: -25% al daño infligido y menor curación recibida.',
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
  CORROSION: {
    id: 'CORROSION',
    name: 'CORROSIÓN',
    code: 'COR',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Ácido alquímico que degrada las placas de Armadura.',
    description:
      'Ácido corrosivo que disuelve el metal: pierde 2 de Armadura al final del turno y recibe mayor daño físico.',
    icon: 'corrosion',
    stackRule: 'STACK_INTENSITY',
    maxStacks: 3,
    defaultTurns: 2,
    defaultPotency: 2,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#9BD948',
      borderColor: '#618F24',
      bgTint: '#162109',
    },
  },
  WEAKENED: {
    id: 'WEAKENED',
    name: 'DEBILITADO',
    code: 'DEB',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Agotamiento físico: infliges un 20% menos de daño.',
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
  SLOW: {
    id: 'SLOW',
    name: 'LENTITUD',
    code: 'LEN',
    category: 'DEBUFF',
    type: 'debuff',
    shortDescription: 'Grilletes espectrales que lastran la iniciativa y evasión.',
    description:
      'Peso abisal en las extremidades: retrasa tu orden de iniciativa en la ronda y reduce la capacidad de esquiva.',
    icon: 'slow',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 20,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#7E91B5',
      borderColor: '#4E5D7A',
      bgTint: '#101521',
    },
  },

  // =========================================================================
  // POSITIVE STATUSES / BUFFS / DEFENSIVE EFFECTS (16)
  // =========================================================================
  SHIELDED: {
    id: 'SHIELDED',
    name: 'ESCUDO',
    code: 'ESC',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Baluarte protector que mitiga daño en cada embate enemigo.',
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
  ARMORED: {
    id: 'ARMORED',
    name: 'ARMADURA',
    code: 'ARM',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Refuerzo de placas que incrementa la Defensa física.',
    description:
      'Coraza reforzada con hierro rúnico: otorga +3 de Defensa física adicional contra ataques enemigos.',
    icon: 'armored',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 3,
    defaultPotency: 3,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#9DB4C0',
      borderColor: '#5C7482',
      bgTint: '#111A21',
    },
  },
  REGENERATION: {
    id: 'REGENERATION',
    name: 'REGENERACIÓN',
    code: 'REG',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Restaura vitalidad automáticamente al final de cada turno.',
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
  BLESSED: {
    id: 'BLESSED',
    name: 'BENDICIÓN',
    code: 'BEN',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Gracia consagrada: +25% de daño y +10% de crítico.',
    description:
      'Gracia solar consagrada: tus ataques y habilidades infligen un +25% de daño adicional y +10% de probabilidad crítica.',
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
  STRENGTHENED: {
    id: 'STRENGTHENED',
    name: 'FORTALECIDO',
    code: 'FOR',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Furia marcial: incrementa la potencia de todos los ataques.',
    description:
      'Temple de acero ardiente: aumenta el daño de tus ataques con arma y técnicas en un +25%.',
    icon: 'strengthened',
    stackRule: 'REFRESH',
    maxStacks: 2,
    defaultTurns: 3,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FF8A47',
      borderColor: '#C9591E',
      bgTint: '#261208',
    },
  },
  HASTE: {
    id: 'HASTE',
    name: 'CELERIDAD',
    code: 'CEL',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Agilidad sobrenatural: prioridad de turno y reflejos.',
    description:
      'Paso espectral acelerado: otorga prioridad al inicio de la ronda y reduce en 1 turno la recarga de técnicas.',
    icon: 'haste',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 20,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#5CE6D6',
      borderColor: '#2B9E91',
      bgTint: '#0A211F',
    },
  },
  PRECISION: {
    id: 'PRECISION',
    name: 'PRECISIÓN',
    code: 'PRE',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Puntería infalible que ignora parte de la armadura rival.',
    description:
      'Ojo de halcón: tus ataques ignoran 3 puntos de Armadura enemiga y no pueden desviarse por Confusión.',
    icon: 'precision',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 3,
    defaultPotency: 20,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FFD166',
      borderColor: '#B88A28',
      bgTint: '#241B0A',
    },
  },
  CRIT_BOOST: {
    id: 'CRIT_BOOST',
    name: 'CRÍTICO AUMENTADO',
    code: 'CRI+',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Incrementa un +25% la probabilidad de asestar golpes críticos.',
    description:
      'Instinto letal afilado: aumenta en un +25% la probabilidad de golpe crítico en tu próximo ataque.',
    icon: 'crit_boost',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FF5E7E',
      borderColor: '#B82E4B',
      bgTint: '#260A12',
    },
  },
  RESISTANCE: {
    id: 'RESISTANCE',
    name: 'RESISTENCIA',
    code: 'RES',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Resguardo elemental y arcano que mitiga un 25% del daño.',
    description:
      'Temple inquebrantable: reduce en un 25% todo el daño mágico, de aliento y de estados periódicos recibido.',
    icon: 'resistance',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 3,
    defaultPotency: 25,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#76B5E6',
      borderColor: '#3E78A8',
      bgTint: '#0C1A26',
    },
  },
  COUNTER: {
    id: 'COUNTER',
    name: 'CONTRAGOLPE',
    code: 'CTR',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Guardia armada que devuelve daño al atacante enemigo.',
    description:
      'Filo de represalia: al recibir un ataque cuerpo a cuerpo, devuelves automáticamente un tajo de acero al agresor.',
    icon: 'counter',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 6,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E7A54A',
      borderColor: '#A86E24',
      bgTint: '#241709',
    },
  },
  TAUNT: {
    id: 'TAUNT',
    name: 'PROVOCAR',
    code: 'PRV',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Atrae los ataques individuales enemigos para proteger al grupo.',
    description:
      'Baluarte desafiante: los enemigos priorizan atacarte a ti en lugar de a tus aliados heridos.',
    icon: 'taunt',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 100,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FFD166',
      borderColor: '#C98736',
      bgTint: '#261C0B',
    },
  },
  IMMUNITY: {
    id: 'IMMUNITY',
    name: 'INMUNIDAD',
    code: 'INM',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Círculo sagrado que bloquea nuevas aflicciones y maldiciones.',
    description:
      'Sello de pureza absoluta: impide que los enemigos te apliquen nuevos estados negativos mientras permanezca activo.',
    icon: 'immunity',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 100,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#FFF3C4',
      borderColor: '#E7A54A',
      bgTint: '#262110',
    },
  },
  INSPIRATION: {
    id: 'INSPIRATION',
    name: 'INSPIRACIÓN',
    code: 'INS',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Cántico heroico que potencia el Ataque y la Magia del grupo.',
    description:
      'Fervor de la compañía: incrementa +2 de Ataque y +2 de Magia mientras resuene el cántico.',
    icon: 'inspiration',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 3,
    defaultPotency: 20,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#F4B942',
      borderColor: '#B8821E',
      bgTint: '#241A08',
    },
  },
  MAGIC_BARRIER: {
    id: 'MAGIC_BARRIER',
    name: 'BARRERA MÁGICA',
    code: 'BAR',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Domo rúnico que absorbe daño arcano y maldiciones.',
    description:
      'Cúpula prismática: absorbe 5 puntos de daño en el siguiente ataque enemigo y refleja energía arcana.',
    icon: 'magic_barrier',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 2,
    defaultPotency: 5,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#A58BFF',
      borderColor: '#6649C9',
      bgTint: '#16102B',
    },
  },
  STEALTH: {
    id: 'STEALTH',
    name: 'SIGILO',
    code: 'SIG',
    category: 'BUFF',
    type: 'buff',
    shortDescription: 'Manto de sombras: evita ser objetivo directo y potencia el golpe.',
    description:
      'Oculto en la penumbra: los enemigos no pueden fijarte como objetivo individual y tu próximo ataque gana +30% de daño.',
    icon: 'stealth',
    stackRule: 'REFRESH',
    maxStacks: 1,
    defaultTurns: 1,
    defaultPotency: 30,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#8B7EC9',
      borderColor: '#54468F',
      bgTint: '#130F21',
    },
  },
  TORCH_LIGHT: {
    id: 'TORCH_LIGHT',
    name: 'LUZ DE ANTORCHA',
    code: 'LUZ',
    category: 'BUFF',
    type: 'relic',
    shortDescription: 'Llama protectora permanente durante toda la expedición.',
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
  ECLIPSE_DOOM: {
    id: 'ECLIPSE_DOOM',
    name: 'CONDENA DEL ECLIPSE',
    code: 'ECL',
    category: 'SPECIAL_BOSS_EFFECT',
    type: 'debuff',
    shortDescription: 'Marca cataclísmica del Soberano del Umbral.',
    description:
      'Resonancia del Corazón de la Cripta: acumula energía abisal que detona al completarse el ciclo del eclipse si no se purifica.',
    icon: 'eclipse_doom',
    stackRule: 'STACK_INTENSITY',
    maxStacks: 3,
    defaultTurns: 3,
    defaultPotency: 8,
    durationRule: 'TURN_END',
    visualTreatment: {
      color: '#E03E52',
      borderColor: '#8F1D2C',
      bgTint: '#290810',
    },
  },
};

/**
 * Canonical Visual & Tactical Status Catalog for the In-Game CÓDICE DE ESTADOS
 * (Sections 6–16). Describes behavior without duplicating combat resolution logic.
 */
export const CRIPTA_STATUS_CATALOG: CriptaStatusCatalogEntry[] = [
  // NEGATIVE STATUSES (15)
  {
    id: 'POISON',
    category: 'NEGATIVE_STATUS',
    codexTab: 'NEGATIVOS',
    displayName: 'VENENO',
    code: 'VEN',
    shortDescription: 'Daño periódico al final de cada turno que ignora armadura.',
    fullDescription:
      'Toxina orgánica o alquímica que circula por el torrente sanguíneo. Al finalizar el turno del portador, inflige daño directo a la vitalidad ignorando la Armadura.',
    iconDefinition: 'Vial alquímico verde con gotas tóxicas burbujeantes',
    positiveOrNegative: 'NEGATIVE',
    stackable: true,
    maxStacks: 3,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.POISON.visualTreatment,
    combatBehaviorReference: 'Daño periódico por carga al cierre del turno.',
    stackingRuleText: 'Acumulable hasta 3 cargas; cada nueva aplicación suma intensidad y renueva turnos.',
    removalRuleText: 'Se elimina con Antídoto, Sal Purificadora, habilidades de Clérigo o Santuarios.',
  },
  {
    id: 'BLEED',
    category: 'NEGATIVE_STATUS',
    codexTab: 'NEGATIVOS',
    displayName: 'SANGRADO',
    code: 'SAN',
    shortDescription: 'Herida abierta que drena vida al actuar y al final del turno.',
    fullDescription:
      'Corte profundo provocado por cuchillas, garras o trampas de sierra. Drena vitalidad al final de cada turno hasta que la herida sea cauterizada o vendada.',
    iconDefinition: 'Tajo carmesí con gota de sangre',
    positiveOrNegative: 'NEGATIVE',
    stackable: true,
    maxStacks: 3,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.BLEED.visualTreatment,
    combatBehaviorReference: 'Daño periódico por carga al final del turno.',
    stackingRuleText: 'Acumulable hasta 3 cargas de intensidad.',
    removalRuleText: 'Se cierra al usar Venda, recibir curación directa o purificación.',
  },
  {
    id: 'BURN',
    category: 'NEGATIVE_STATUS',
    codexTab: 'NEGATIVOS',
    displayName: 'QUEMADURA',
    code: 'QUE',
    shortDescription: 'Fuego adherido que inflige daño periódico y reduce 1 de Armadura.',
    fullDescription:
      'Llamas de forja o azufre que calientan las placas metálicas. Al final del turno inflige daño ígneo y deteriora en 1 punto la Armadura del objetivo.',
    iconDefinition: 'Llama infernal naranja con núcleo incandescente',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.BURN.visualTreatment,
    combatBehaviorReference: 'Daño periódico + reducción de 1 punto de Armadura por turno.',
    stackingRuleText: 'Renueva su duración al volver a aplicarse.',
    removalRuleText: 'Disipable con Ungüento Ígneo, Sal Purificadora o descanso.',
  },
  {
    id: 'CONFUSION',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'CONFUSIÓN',
    code: 'CNF',
    shortDescription: 'Altera la percepción y puede desviar el objetivo de los ataques.',
    fullDescription:
      'Ilusión psíquica o eco abisal que nubla el juicio táctico. Los ataques individuales tienen riesgo de desviarse hacia otro enemigo aleatorio.',
    iconDefinition: 'Espiral hipnótica violeta y máscara partida',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.CONFUSION.visualTreatment,
    combatBehaviorReference: 'Probabilidad de desviar el objetivo de ataques individuales.',
    stackingRuleText: 'No acumulable; renueva su duración.',
    removalRuleText: 'Se disipa con Tónico de Claridad, Sal Purificadora o plegarias.',
  },
  {
    id: 'FEAR',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'MIEDO',
    code: 'MIE',
    shortDescription: 'Pavor sobrenatural que merma la potencia de ataque y técnicas.',
    fullDescription:
      'Presencia sobrecogedora que hace temblar el pulso del aventurero, reduciendo la potencia ofensiva de sus cartas durante varios turnos.',
    iconDefinition: 'Ojo dilatado con pupila contraída por el terror',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.FEAR.visualTreatment,
    combatBehaviorReference: 'Reduce el multiplicador de daño del portador.',
    stackingRuleText: 'No acumulable; renueva su duración.',
    removalRuleText: 'Se elimina con Tónico de Claridad, Inspiración o Bendición.',
  },
  {
    id: 'VULNERABLE',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'VULNERABLE',
    code: 'VUL',
    shortDescription: 'Guardia abierta: recibe mayor daño de cualquier ataque.',
    fullDescription:
      'Las defensas del objetivo han quedado expuestas tras un impacto contundente o técnica de brecha, aumentando todo el daño recibido.',
    iconDefinition: 'Escudo partido por una grieta central',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.VULNERABLE.visualTreatment,
    combatBehaviorReference: 'Incrementa un +25% el daño recibido por ataques.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Se contrarresta con Escudo, Guardia o purificación.',
  },
  {
    id: 'MARKED',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'MARCADO',
    code: 'MRC',
    shortDescription: 'Señalado como presa: el siguiente golpe contra ti inflige daño extra.',
    fullDescription:
      'Runa de cazador o señal de caudillo que dirige la ferocidad enemiga hacia el portador, amplificando el daño recibido.',
    iconDefinition: 'Diana rúnica carmesí con punto central',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.MARKED.visualTreatment,
    combatBehaviorReference: 'Aumenta el daño recibido del próximo ataque enemigo.',
    stackingRuleText: 'No acumulable; renueva su duración.',
    removalRuleText: 'Se elimina al expirar, con Bomba de Humo o purificación.',
  },
  {
    id: 'BLINDED',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'CEGADO',
    code: 'CEG',
    shortDescription: 'Visión bloqueada: impide asestar críticos y reduce el daño directo.',
    fullDescription:
      'Nube de ceniza, esporas o destello astral que impide ver los puntos débiles del enemigo, reduciendo la eficacia de los ataques.',
    iconDefinition: 'Ojo cerrado atravesado por un trazo diagonal',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.BLINDED.visualTreatment,
    combatBehaviorReference: 'Anula bonificación crítica y reduce daño de ataques.',
    stackingRuleText: 'No acumulable; renueva su duración.',
    removalRuleText: 'Se limpia con Tónico de Claridad o Sal Purificadora.',
  },
  {
    id: 'SILENCED',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'SILENCIADO',
    code: 'SIL',
    shortDescription: 'Mordaza rúnica que debilita la canalización de habilidades mágicas.',
    fullDescription:
      'Sello prohibido que interfiere con la pronunciación de fórmulas arcanas y cánticos sagrados, reduciendo su potencia.',
    iconDefinition: 'Runa vocal sellada con cadenas violetas',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.SILENCED.visualTreatment,
    combatBehaviorReference: 'Reduce la potencia de habilidades de clase mágicas.',
    stackingRuleText: 'No acumulable; renueva su duración.',
    removalRuleText: 'Se elimina con Sal Purificadora o al concluir su duración.',
  },
  {
    id: 'STUNNED',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'ATURDIDO',
    code: 'ATU',
    shortDescription: 'Conmoción intensa que deja al combatiente momentáneamente expuesto.',
    fullDescription:
      'Golpe sísmico o descarga que sacude el equilibrio del aventurero, mermando su capacidad defensiva y ofensiva durante el turno.',
    iconDefinition: 'Estrellas rúnicas doradas girando en espiral',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 1,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.STUNNED.visualTreatment,
    combatBehaviorReference: 'Penaliza la acción y defensa durante 1 turno.',
    stackingRuleText: 'No acumulable.',
    removalRuleText: 'Expira al finalizar el turno o mediante purificación.',
  },
  {
    id: 'FROST',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'CONGELADO',
    code: 'CNG',
    shortDescription: 'Hielo abisal que entumece los músculos y reduce el daño infligido.',
    fullDescription:
      'Escarcha de las cavernas o del Templo Sumergido que cristaliza sobre la armadura, restando fuerza a cada golpe.',
    iconDefinition: 'Cristal de hielo prismático de seis puntas',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.FROST.visualTreatment,
    combatBehaviorReference: 'Reduce el daño infligido por el portador.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Se disipa con Ungüento Ígneo, calor de hoguera o purificación.',
  },
  {
    id: 'CURSE',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'MALDICIÓN',
    code: 'MAL',
    shortDescription: 'Condena espiritual que reduce el daño y la curación recibida.',
    fullDescription:
      'Marca nigromántica que drena el vigor del alma, reduciendo tanto el daño que infliges como la vitalidad que recuperas.',
    iconDefinition: 'Cráneo violeta coronado por runas oscuras',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.CURSE.visualTreatment,
    combatBehaviorReference: 'Reduce daño infligido y eficacia de curación.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Se purifica con Sal Purificadora, Santuarios o habilidades sagradas.',
  },
  {
    id: 'CORROSION',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'CORROSIÓN',
    code: 'COR',
    shortDescription: 'Disuelve progresivamente los puntos de Armadura del objetivo.',
    fullDescription:
      'Secreción ácida de la Colmena o las Alcantarillas que degrada las placas metálicas al final de cada turno.',
    iconDefinition: 'Coraza metálica fundiéndose con gotas ácidas',
    positiveOrNegative: 'NEGATIVE',
    stackable: true,
    maxStacks: 3,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.CORROSION.visualTreatment,
    combatBehaviorReference: 'Reduce la Armadura del portador al cierre del turno.',
    stackingRuleText: 'Acumulable hasta 3 cargas.',
    removalRuleText: 'Se limpia con Sal Purificadora o reparando en la Forja.',
  },
  {
    id: 'WEAKENED',
    category: 'DEBUFF',
    codexTab: 'NEGATIVOS',
    displayName: 'DEBILITADO',
    code: 'DEB',
    shortDescription: 'Fatiga muscular que reduce el daño de tus ataques.',
    fullDescription:
      'Cansancio severo provocado por golpes pesados o esporas debilitantes; tus ataques causan menor impacto.',
    iconDefinition: 'Hoja de espada quebrada por la mitad',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.WEAKENED.visualTreatment,
    combatBehaviorReference: 'Reduce en un 20% el daño infligido.',
    stackingRuleText: 'Extiende su duración si vuelve a aplicarse.',
    removalRuleText: 'Se contrarresta con Elixir de Fuerza, Bendición o descanso.',
  },
  {
    id: 'SLOW',
    category: 'CONTROL_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'LENTITUD',
    code: 'LEN',
    shortDescription: 'Pesadez que retrasa el turno y reduce la capacidad de reacción.',
    fullDescription:
      'Cadenas fantasmales o barro profundo que lastran el movimiento del aventurero durante el combate.',
    iconDefinition: 'Bota lastrada junto a un reloj de arena sombrío',
    positiveOrNegative: 'NEGATIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.SLOW.visualTreatment,
    combatBehaviorReference: 'Reduce prioridad de turno y defensa evasiva.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Se disipa con Celeridad o Sal Purificadora.',
  },

  // POSITIVE STATUSES / BUFFS / DEFENSIVE (16)
  {
    id: 'SHIELDED',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'POSITIVOS',
    displayName: 'ESCUDO',
    code: 'ESC',
    shortDescription: 'Barrera física que mitiga daño en cada ataque enemigo.',
    fullDescription:
      'Postura de baluarte o resguardo rúnico que absorbe parte del impacto de cualquier ataque enemigo durante varios turnos.',
    iconDefinition: 'Escudo heráldico cian con núcleo brillante',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.SHIELDED.visualTreatment,
    combatBehaviorReference: 'Mitiga daño recibido en cada impacto enemigo.',
    stackingRuleText: 'Renueva su duración al volver a aplicarse.',
    removalRuleText: 'Expira al agotar sus turnos.',
  },
  {
    id: 'ARMORED',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'POSITIVOS',
    displayName: 'ARMADURA',
    code: 'ARM',
    shortDescription: 'Incrementa temporalmente la Defensa física del héroe.',
    fullDescription:
      'Endurecimiento de la coraza mediante elixires de hierro o técnicas de caballería, reduciendo el daño físico sufrido.',
    iconDefinition: 'Peto de acero templado con remaches',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.ARMORED.visualTreatment,
    combatBehaviorReference: 'Suma Defensa adicional al cálculo de mitigación.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Dura hasta finalizar sus turnos.',
  },
  {
    id: 'REGENERATION',
    category: 'POSITIVE_STATUS',
    codexTab: 'POSITIVOS',
    displayName: 'REGENERACIÓN',
    code: 'REG',
    shortDescription: 'Restaura puntos de vida al final de cada turno.',
    fullDescription:
      'Flujo vital constante otorgado por tónicos, santuarios o reliquias que sana heridas progresivamente al cierre de cada turno.',
    iconDefinition: 'Corazón esmeralda con destello curativo',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.REGENERATION.visualTreatment,
    combatBehaviorReference: 'Restaura PV al final del turno del portador.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira tras completar sus turnos.',
  },
  {
    id: 'BLESSED',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'BENDICIÓN',
    code: 'BEN',
    shortDescription: 'Aumenta un +25% el daño infligido y +10% la probabilidad crítica.',
    fullDescription:
      'Luz sagrada del Alba que guía las armas y conjuros del portador, incrementando su daño y su precisión crítica.',
    iconDefinition: 'Cruz solar dorada radiante',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.BLESSED.visualTreatment,
    combatBehaviorReference: '+25% al daño total y +10% a la probabilidad de crítico.',
    stackingRuleText: 'Extiende su duración si vuelve a aplicarse.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'STRENGTHENED',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'FORTALECIDO',
    code: 'FOR',
    shortDescription: 'Potencia ofensiva que incrementa el daño de armas y técnicas.',
    fullDescription:
      'Vigor marcial que añade fuerza bruta a cada embate, ideal para romper la guardia de colosos y élites.',
    iconDefinition: 'Espada ascendente envuelta en fulgor ámbar',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 2,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.STRENGTHENED.visualTreatment,
    combatBehaviorReference: '+25% de daño en ataques físicos y técnicas.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al finalizar sus turnos.',
  },
  {
    id: 'HASTE',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'CELERIDAD',
    code: 'CEL',
    shortDescription: 'Aumenta los reflejos y acelera la recuperación de técnicas.',
    fullDescription:
      'Impulso de velocidad que permite actuar con ventaja táctica y aligera el tiempo de enfriamiento de las habilidades.',
    iconDefinition: 'Bota alada con estela turquesa',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.HASTE.visualTreatment,
    combatBehaviorReference: 'Prioridad de turno y reducción de enfriamiento.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al finalizar sus turnos.',
  },
  {
    id: 'PRECISION',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'PRECISIÓN',
    code: 'PRE',
    shortDescription: 'Tus ataques perforan armadura e ignoran desvíos.',
    fullDescription:
      'Concentración absoluta del Cazador o Pícaro que permite dirigir el golpe hacia las junturas de la coraza enemiga.',
    iconDefinition: 'Ojo de águila inscrito en una retícula dorada',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.PRECISION.visualTreatment,
    combatBehaviorReference: 'Ignora 3 puntos de Armadura enemiga.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al finalizar sus turnos.',
  },
  {
    id: 'CRIT_BOOST',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'CRÍTICO AUMENTADO',
    code: 'CRI+',
    shortDescription: 'Incrementa notablemente la probabilidad de golpe crítico.',
    fullDescription:
      'Afila el instinto asesino para encontrar el punto vital del adversario en el siguiente intercambio.',
    iconDefinition: 'Dagas gemelas cruzadas sobre un destello carmesí',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.CRIT_BOOST.visualTreatment,
    combatBehaviorReference: '+25% a la probabilidad de golpe crítico.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'RESISTANCE',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'POSITIVOS',
    displayName: 'RESISTENCIA',
    code: 'RES',
    shortDescription: 'Reduce el daño mágico y elemental recibido.',
    fullDescription:
      'Manto protector que amortigua el impacto de hechizos, alientos dracónicos y explosiones alquímicas.',
    iconDefinition: 'Guantelete rúnico con emblema de resguardo azul',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.RESISTANCE.visualTreatment,
    combatBehaviorReference: '-25% de daño mágico y periódico recibido.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'COUNTER',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'POSITIVOS',
    displayName: 'CONTRAGOLPE',
    code: 'CTR',
    shortDescription: 'Devuelve un tajo automático al enemigo que te ataque.',
    fullDescription:
      'Postura de esgrima defensiva: cuando un enemigo te golpea, respondes al instante con un contraataque.',
    iconDefinition: 'Dos hojas cruzadas describiendo un arco de retorno',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.COUNTER.visualTreatment,
    combatBehaviorReference: 'Inflige daño de represalia al atacante.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'TAUNT',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'CONTROL',
    displayName: 'PROVOCAR',
    code: 'PRV',
    shortDescription: 'Atrae la atención enemiga para proteger al resto del grupo.',
    fullDescription:
      'El portador golpea su escudo y desafía a las criaturas de la sala, convirtiéndose en el objetivo prioritario.',
    iconDefinition: 'Pavés dorado con runa de atención central',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.TAUNT.visualTreatment,
    combatBehaviorReference: 'Fija la prioridad de selección de objetivo enemigo.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'IMMUNITY',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'ESPECIALES',
    displayName: 'INMUNIDAD',
    code: 'INM',
    shortDescription: 'Impide recibir nuevos estados negativos o maldiciones.',
    fullDescription:
      'Círculo consagrado que repele venenos, quemaduras y maldiciones antes de que puedan afectar al héroe.',
    iconDefinition: 'Círculo de sello dorado con estrella central',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.IMMUNITY.visualTreatment,
    combatBehaviorReference: 'Bloquea la aplicación de debuffs.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'INSPIRATION',
    category: 'BUFF',
    codexTab: 'POSITIVOS',
    displayName: 'INSPIRACIÓN',
    code: 'INS',
    shortDescription: 'Eleva el Ataque y la Magia de los aventureros.',
    fullDescription:
      'Estandarte de valor compartido que impulsa tanto las artes marciales como las arcanas del grupo.',
    iconDefinition: 'Estandarte real con destello solar',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.INSPIRATION.visualTreatment,
    combatBehaviorReference: 'Otorga bonificación ofensiva y mágica.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'MAGIC_BARRIER',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'POSITIVOS',
    displayName: 'BARRERA MÁGICA',
    code: 'BAR',
    shortDescription: 'Cúpula arcana que absorbe impacto y protege el espíritu.',
    fullDescription:
      'Tejido de energía astral que amortigua el daño recibido y estabiliza la concentración del lanzador.',
    iconDefinition: 'Domo hexagonal violeta con runa interior',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 2,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.MAGIC_BARRIER.visualTreatment,
    combatBehaviorReference: 'Absorbe daño entrante.',
    stackingRuleText: 'Renueva su duración.',
    removalRuleText: 'Expira al concluir sus turnos.',
  },
  {
    id: 'STEALTH',
    category: 'DEFENSIVE_EFFECT',
    codexTab: 'ESPECIALES',
    displayName: 'SIGILO',
    code: 'SIG',
    shortDescription: 'Oculta al portador en las sombras y potencia su próximo golpe.',
    fullDescription:
      'Técnica de emboscada que dificulta que los enemigos te ataquen directamente y prepara un golpe letal desde la penumbra.',
    iconDefinition: 'Capucha sombría con ojos relucientes',
    positiveOrNegative: 'POSITIVE',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'TURN_END',
    defaultTurns: 1,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.STEALTH.visualTreatment,
    combatBehaviorReference: 'Evita selección directa y bonifica el siguiente ataque.',
    stackingRuleText: 'No acumulable.',
    removalRuleText: 'Se consume al atacar o al finalizar el turno.',
  },
  {
    id: 'TORCH_LIGHT',
    category: 'SPECIAL_BOSS_EFFECT',
    codexTab: 'ESPECIALES',
    displayName: 'LUZ DE ANTORCHA',
    code: 'LUZ',
    shortDescription: 'Llama guía permanente que resguarda al grupo en la cripta.',
    fullDescription:
      'Fuego ancestral encendido en el campamento. Mientras arda, los aventureros mantienen la cordura frente a la oscuridad abisal.',
    iconDefinition: 'Antorcha de hierro forjado con llama viva',
    positiveOrNegative: 'SPECIAL',
    stackable: false,
    maxStacks: 1,
    defaultDurationType: 'EXPEDITION',
    defaultTurns: 99,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT.visualTreatment,
    combatBehaviorReference: 'Activo durante toda la expedición mientras el héroe viva.',
    stackingRuleText: 'Efecto permanente de expedición.',
    removalRuleText: 'Solo se apaga si el aventurero cae en combate.',
  },
  {
    id: 'ECLIPSE_DOOM',
    category: 'SPECIAL_BOSS_EFFECT',
    codexTab: 'ESPECIALES',
    displayName: 'CONDENA DEL ECLIPSE',
    code: 'ECL',
    shortDescription: 'Sello abisal del Rey Exánime que detona al completarse el eclipse.',
    fullDescription:
      'Maldición suprema invocada en el Corazón de la Cripta. Acumula resonancia del vacío en cada ronda y desata daño cataclísmico si no se purifica a tiempo.',
    iconDefinition: 'Sol negro eclipsado con corona carmesí',
    positiveOrNegative: 'SPECIAL',
    stackable: true,
    maxStacks: 3,
    defaultDurationType: 'TURN_END',
    defaultTurns: 3,
    visualAccent: CRIPTA_STATUS_EFFECTS_REGISTRY.ECLIPSE_DOOM.visualTreatment,
    combatBehaviorReference: 'Efecto especial de Jefe Final.',
    stackingRuleText: 'Acumula hasta 3 sellos del eclipse.',
    removalRuleText: 'Purificable mediante reliquias sagradas o plegarias del Clérigo.',
    isBossMysteryUntilSeen: true,
  },
];

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
  customPotency?: number,
  sourceName?: string
): CriptaPlayerStatusEffect {
  const def =
    CRIPTA_STATUS_EFFECTS_REGISTRY[effectType] ||
    CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT;
  return {
    id: `status_${effectType.toLowerCase()}_${targetPlayerId}`,
    effectType,
    name: def.name,
    code: def.code,
    type: def.type,
    sourceId,
    sourceName,
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
  customTurns?: number,
  sourceName?: string
): CriptaPlayerStatusEffect | null {
  if (player.isDead || player.hp <= 0) return null;

  const def = CRIPTA_STATUS_EFFECTS_REGISTRY[effectType];
  if (!def) return null;

  // Check IMMUNITY against negative debuffs
  if (
    def.type === 'debuff' &&
    player.statuses.some((s) => s.effectType === 'IMMUNITY' && s.remainingTurns > 0)
  ) {
    return null;
  }

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
    if (sourceName) existing.sourceName = sourceName;
    existing.appliedAtTurn = turnNumber;
    return existing;
  }

  const created = createStatusEffectInstance(
    effectType,
    player.id,
    sourceId,
    turnNumber,
    turnsToSet,
    undefined,
    sourceName
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
    } else if (st.effectType === 'CORROSION') {
      const armorLoss = Math.max(1, st.stacks);
      player.armor = Math.max(0, player.armor - armorLoss);
      logSegments.push(`${player.name} pierde -${armorLoss} ARMADURA por CORROSIÓN`);
    } else if (st.effectType === 'ECLIPSE_DOOM' && st.remainingTurns <= 1) {
      const dmg = 6 * Math.max(1, st.stacks);
      player.hp = Math.max(0, player.hp - dmg);
      damageTaken += dmg;
      logSegments.push(`¡CONDENA DEL ECLIPSE detona sobre ${player.name} (-${dmg} PV)!`);
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
