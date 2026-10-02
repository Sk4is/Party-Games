import {
  CriptaCharacterId,
  CriptaClassMechanicDefinition,
  CriptaClassResourceKind,
  CriptaPlayer,
  CriptaPlayerRoundActionType,
  CriptaPlayerStatusEffect,
  CriptaRoomEnemy,
} from '../../types/laCripta';

export const CRIPTA_CLASS_MECHANICS_REGISTRY: Record<
  CriptaCharacterId,
  CriptaClassMechanicDefinition
> = {
  caballero: {
    mechanicId: 'guardia_bastion',
    classId: 'caballero',
    name: 'Guardia de Bastión',
    shortTag: 'GUARDIA TÁCTICA (0–5)',
    shortDescription:
      'Acumula GUARDIA al defender, bloquear ataques o proteger aliados, y la consume para potenciar golpes de escudo o blindar al grupo.',
    gameplayLoopSummary:
      'Alza la guardia o intercepta golpes para acumular ■ GUARDIA y descárgala con Embate de Pavés para romper armaduras.',
    resource: {
      kind: 'GUARDIA',
      label: 'GUARDIA',
      shortLabel: 'GRD',
      minValue: 0,
      maxValue: 5,
      initialValue: 1,
      accentColor: '#69A8A5',
      description:
        'Se genera al usar Guardia de Hierro (+2), Muro de Hierro (+2) o al bloquear golpes enemigos (+1). Cada punto otorga +1 DEF pasiva y potencia Embate de Pavés (+18% daño y +1 ruptura de armadura por punto).',
    },
    uiRepresentation: {
      style: 'BLOCKS',
      maxPips: 5,
      filledSymbol: '■',
      emptySymbol: '□',
    },
    combatHooks: {
      onBasicAttack: 'Si tienes Escudo o Guardia activa, genera +1 GUARDIA.',
      onDefend: 'Genera +2 GUARDIA, provoca al enemigo y protege al aliado más herido (no hace daño).',
      onWeaponSpecial: 'Genera +1 GUARDIA y gana +8% daño por cada GUARDIA activa.',
      onSkill1: 'Embate de Pavés consume toda la GUARDIA (+18% daño, +1 Ruptura DEF y +1 Escudo grupal por punto).',
      onSkill2: 'Muro de Hierro genera +2 GUARDIA y blinda a todo el grupo (no hace daño).',
      onReceiveDamageOrBlock: 'Bloquear un ataque con armadura/escudo genera +1 GUARDIA.',
    },
    soloScaling:
      'En solitario, cada punto de GUARDIA añade +10% de daño de Contragolpe y convierte la defensa en presión constante.',
    multiplayerSynergy:
      'En grupo, redirige ataques dirigidos a aliados heridos hacia el Caballero y otorga Escudo grupal al consumir Guardia.',
  },

  mago: {
    mechanicId: 'sobrecarga_arcana',
    classId: 'mago',
    name: 'Sobrecarga Arcana',
    shortTag: 'CARGA ARCANA (0–5)',
    shortDescription:
      'Canalizar hechizos ofensivos acumula CARGA ARCANA (+12% poder mágico por carga). Al llegar a 5/5 desata Sobrecarga explosiva o puede estabilizarse en escudo.',
    gameplayLoopSummary:
      'Acumula ◆ CARGA ARCANA con hechizos para multiplicar tu daño o libérala con Convergencia Astral antes de sobrecargarte.',
    resource: {
      kind: 'CARGA_ARCANA',
      label: 'CARGA ARCANA',
      shortLabel: 'CARGA',
      minValue: 0,
      maxValue: 5,
      initialValue: 0,
      accentColor: '#9B72CF',
      description:
        'Cada punto de Carga Arcana otorga +12% de daño mágico. Con 3+ Cargas, los hechizos aplican Quemadura adicional. En 5/5 (SOBRECARGA), el siguiente conjuro explota en área (+40% daño) y reinicia la Carga con -3 PV de retroceso arcano.',
    },
    uiRepresentation: {
      style: 'DIAMONDS',
      maxPips: 5,
      filledSymbol: '◆',
      emptySymbol: '◇',
    },
    combatHooks: {
      onBasicAttack: 'Genera +1 CARGA ARCANA y escala con tu MAGIA.',
      onDefend: 'Estabiliza -1 CARGA ARCANA convirtiéndola en +3 Escudo adicional.',
      onWeaponSpecial: 'Genera +1 CARGA ARCANA (+12% daño por carga activa).',
      onSkill1: 'Descarga Arcana genera +2 CARGA ARCANA (en 5/5 detona SOBRECARGA en área y reinicia a 0).',
      onSkill2: 'Convergencia Astral consume toda la CARGA ARCANA de forma segura para otorgar Escudo, curación y Bendición al grupo.',
    },
    soloScaling:
      'En solitario, estabilizar Carga Arcana con Convergencia Astral restaura PV adicionales al Mago.',
    multiplayerSynergy:
      'En grupo, el Mago puede mantener 3–4 Cargas para máximo daño mientras el Caballero o Clérigo lo protegen, o transformar sus Cargas en barrera grupal.',
  },

  picaro: {
    mechanicId: 'ventana_ejecucion',
    classId: 'picaro',
    name: 'Filo de Sombra',
    shortTag: 'COMBO DE EJECUCIÓN (0–3)',
    shortDescription:
      'Genera puntos de COMBO al golpear objetivos con estados alterados, asestar críticos o esquivar, y los consume en remates que perforan toda la armadura.',
    gameplayLoopSummary:
      'Aplica Sangrado/Veneno para abrir ventana de ejecución, acumula ● COMBO y remata con Ejecución Carmesí.',
    resource: {
      kind: 'COMBO',
      label: 'COMBO',
      shortLabel: 'CMB',
      minValue: 0,
      maxValue: 3,
      initialValue: 0,
      accentColor: '#C93B5B',
      description:
        'Ganas +1 COMBO al atacar (+2 si es Crítico o si el enemigo sufre Sangrado, Veneno, Vulnerabilidad o Marca). Ejecución Carmesí consume todo el Combo (+28% daño y +2 Perforación por punto; Crítico garantizado con 3/3 Combo).',
    },
    uiRepresentation: {
      style: 'PIPS',
      maxPips: 3,
      filledSymbol: '●',
      emptySymbol: '○',
    },
    combatHooks: {
      onBasicAttack: 'Genera +1 COMBO (+2 si el blanco sufre estados negativos o si logras golpe Crítico).',
      onDefend: 'Genera +1 COMBO y prepara emboscada (+15% Evasión esta ronda).',
      onWeaponSpecial: 'Genera +1 COMBO y aplica Sangrado/Veneno para habilitar ejecuciones.',
      onSkill1: 'Paso Umbrío aplica Sangrado + Vulnerable, genera +1 COMBO y aumenta tu Evasión.',
      onSkill2: 'Ejecución Carmesí consume todo el COMBO (1–3) para un remate letal que ignora armadura (Crítico seguro con 3/3).',
      onReceiveDamageOrBlock: 'Esquivar un ataque enemigo genera +1 COMBO instantáneo.',
    },
    soloScaling:
      'En solitario, Paso Umbrío aplica tanto Sangrado como Vulnerable por sí mismo para que el Pícaro pueda preparar sus propias ejecuciones.',
    multiplayerSynergy:
      'En grupo, aprovecha el Veneno del Alquimista, la Marca del Cazador o las Maldiciones del Nigromante para ganar +2 COMBO por golpe.',
  },

  cazador: {
    mechanicId: 'presa_marcada',
    classId: 'cazador',
    name: 'Presa Marcada',
    shortTag: 'ACECHO DE CAZA (0–4)',
    shortDescription:
      'Señala a un enemigo prioritario como Presa Marcada para exponer sus puntos débiles a todo el grupo y acumula ACECHO para disparos perforantes.',
    gameplayLoopSummary:
      'Señala al blanco con Marca de Caza (+25% daño recibido) y consume ◈ ACECHO con Tiro Perforante.',
    resource: {
      kind: 'ACECHO',
      label: 'ACECHO',
      shortLabel: 'ACE',
      minValue: 0,
      maxValue: 4,
      initialValue: 1,
      accentColor: '#5EA87A',
      description:
        'Cada punto de ACECHO otorga +5% Probabilidad de Crítico y +1 Perforación de Armadura. Marca de Caza genera +2 ACECHO sin hacer daño directo, y Tiro Perforante consume el ACECHO para atravesar corazas.',
    },
    uiRepresentation: {
      style: 'CROSSHAIRS',
      maxPips: 4,
      filledSymbol: '◈',
      emptySymbol: '◇',
    },
    combatHooks: {
      onBasicAttack: 'Genera +1 ACECHO (+2 si atacas a una Presa Marcada).',
      onDefend: 'Genera +1 ACECHO y calibra puntería (+18% daño en el próximo disparo).',
      onWeaponSpecial: 'Genera +1 ACECHO y aplica daño extra contra objetivos Marcados.',
      onSkill1: 'Marca de Caza señala al objetivo como PRESA MARCADA (+25% daño recibido, -2 DEF) y genera +2 ACECHO (no hace daño directo).',
      onSkill2: 'Tiro Perforante consume todo el ACECHO (+22% daño por punto e ignora 100% de la armadura enemiga con 3+ Acecho).',
    },
    soloScaling:
      'En solitario, marcar a una presa también otorga +3 Escudo de camuflaje al Cazador.',
    multiplayerSynergy:
      'En grupo, la Presa Marcada aumenta un +25% el daño que TODOS los aliados infligen a ese objetivo prioritario.',
  },

  clerigo: {
    mechanicId: 'fervor_sagrado',
    classId: 'clerigo',
    name: 'Fervor Sagrado',
    shortTag: 'FERVOR LITÚRGICO (0–5)',
    shortDescription:
      'Las plegarias de curación, escudos y golpes consagrados acumulan FERVOR SAGRADO, que amplifica las sanaciones y alimenta el Juicio del Alba.',
    gameplayLoopSummary:
      'Sana y purifica al grupo con Luz Consagrada para reunir ✦ FERVOR y abátelo sobre los enemigos con Juicio del Alba.',
    resource: {
      kind: 'FERVOR',
      label: 'FERVOR',
      shortLabel: 'FER',
      minValue: 0,
      maxValue: 5,
      initialValue: 1,
      accentColor: '#FFD166',
      description:
        'Cada punto de FERVOR aumenta un +8% toda curación y escudo otorgado. Luz Consagrada genera +2 FERVOR, y Juicio del Alba consume el FERVOR acumulado para castigar enemigos y sanar al grupo.',
    },
    uiRepresentation: {
      style: 'STARS',
      maxPips: 5,
      filledSymbol: '✦',
      emptySymbol: '✧',
    },
    combatHooks: {
      onBasicAttack: 'Genera +1 FERVOR SAGRADO.',
      onDefend: 'Genera +1 FERVOR SAGRADO y bendice tu escudo.',
      onWeaponSpecial: 'Genera +1 FERVOR y sana levemente a los aliados.',
      onSkill1: 'Luz Consagrada sana al grupo, purifica aflicciones y genera +2 FERVOR (con 4+ Fervor también otorga Escudo grupal; no hace daño).',
      onSkill2: 'Juicio del Alba consume todo tu FERVOR para infligir daño Sagrado (+18% por Fervor) y restaurar +3 PV al grupo por cada Fervor consumido.',
    },
    soloScaling:
      'En solitario, cada punto de FERVOR añade daño Sagrado directo a los ataques básicos y técnicas de maza del Clérigo.',
    multiplayerSynergy:
      'En grupo, convierte la protección y curación de aliados en poder ofensivo sagrado contra jefes y no-muertos.',
  },

  alquimista: {
    mechanicId: 'mezcla_inestable',
    classId: 'alquimista',
    name: 'Mezcla Reactiva',
    shortTag: 'CATALIZADOR (0–3)',
    shortDescription:
      'Sintetiza REACTIVOS al lanzar frascos o usar consumibles y los detona para provocar reacciones químicas en cadena sobre enemigos envenenados o quemados.',
    gameplayLoopSummary:
      'Impregna a los enemigos con Frasco Corrosivo, reúne ◆ REACTIVOS y detónalos con Reacción en Cadena.',
    resource: {
      kind: 'REACTIVOS',
      label: 'REACTIVOS',
      shortLabel: 'REA',
      minValue: 0,
      maxValue: 3,
      initialValue: 1,
      accentColor: '#80FF72',
      description:
        'Sintetizas +1 REACTIVO al atacar, usar objetos de mochila o lanzar Frasco Corrosivo. Reacción en Cadena consume tus Reactivos para detonar instantáneamente el Veneno, Quemadura y Corrosión de todos los enemigos.',
    },
    uiRepresentation: {
      style: 'VIALS',
      maxPips: 3,
      filledSymbol: '◆',
      emptySymbol: '◇',
    },
    combatHooks: {
      onBasicAttack: 'Sintetiza +1 REACTIVO y aplica 1 carga de Veneno si usas arma alquímica.',
      onDefend: 'Sintetiza +1 REACTIVO y destila vapores regenerativos (+3 PV extra).',
      onWeaponSpecial: 'Sintetiza +1 REACTIVO y esparce toxinas sobre los enemigos.',
      onSkill1: 'Frasco Corrosivo aplica Veneno + Corrosión (-2 DEF) en área y sintetiza +1 REACTIVO.',
      onSkill2: 'Reacción en Cadena consume todos los REACTIVOS (1–3) para detonar estados alterados enemigos (+26% daño por Reactivo + daño extra por cada estado activo) y curar al grupo.',
    },
    soloScaling:
      'En solitario, Reacción en Cadena también otorga Escudo alquímico al Alquimista por cada Reactivo consumido.',
    multiplayerSynergy:
      'En grupo, detona no solo su propio Veneno sino también las Quemaduras del Mago, el Sangrado del Pícaro/Bárbaro y las Maldiciones del Nigromante.',
  },

  barbaro: {
    mechanicId: 'furia_sangrienta',
    classId: 'barbaro',
    name: 'Furia Sangrienta',
    shortTag: 'FURIA (0–100)',
    shortDescription:
      'Acumula FURIA al golpear, recibir daño y abatir enemigos. A mayor Furia y menor salud, más devastadores son sus ataques a cambio de menor defensa.',
    gameplayLoopSummary:
      'Carga FURIA en primera línea (25 / 50 / 75 Frenesí) y descárgala con Quebrantahuesos para aplastar defensas y drenar vida.',
    resource: {
      kind: 'FURIA',
      label: 'FURIA',
      shortLabel: 'FUR',
      minValue: 0,
      maxValue: 100,
      initialValue: 0,
      accentColor: '#FF5A36',
      description:
        '25+ Furia: +10% daño. 50+ Furia: +20% daño y +2 Perforación. 75+ Furia (FRENESÍ): +32% daño y +12% Crítico, pero -2 DEFENSA. Quebrantahuesos consume 35 Furia para demoler armaduras y recuperar salud.',
    },
    uiRepresentation: {
      style: 'BAR',
      maxPips: 100,
      filledSymbol: '█',
      emptySymbol: '░',
    },
    combatHooks: {
      onBasicAttack: 'Genera +15 FURIA (+22 en golpe Crítico).',
      onDefend: 'Genera +10 FURIA y templa los músculos sin perder Furia.',
      onWeaponSpecial: 'Genera +20 FURIA y fractura armaduras.',
      onSkill1: 'Grito de Guerra genera +25 FURIA y otorga +1 ATAQUE, +2 Escudo y Bendición al grupo (no hace daño).',
      onSkill2: 'Quebrantahuesos consume 35 FURIA para infligir daño masivo que escala con tu Furia y vida faltante, drenando PV.',
      onReceiveDamageOrBlock: 'Recibir daño directo genera +18 FURIA.',
      onEnemyKill: 'Abatir a un enemigo genera +20 FURIA.',
    },
    soloScaling:
      'En solitario, Quebrantahuesos recupera un mayor porcentaje de la salud faltante para sostener el combate cuerpo a cuerpo.',
    multiplayerSynergy:
      'En grupo, Grito de Guerra potencia el ATAQUE de todos los aliados mientras el Bárbaro destroza la armadura de los enemigos pesados.',
  },

  bardo: {
    mechanicId: 'cadencia_ritmica',
    classId: 'bardo',
    name: 'Cadencia Rítmica',
    shortTag: 'COMPÁS (1 · 2 · 3 · 4★)',
    shortDescription:
      'Cada acción avanza el COMPÁS musical de 1 a 4★. Ejecutar una habilidad o técnica en el Compás 4★ desata un FINALE RESONANTE con +35% de potencia y efectos extra.',
    gameplayLoopSummary:
      'Encadena acciones siguiendo el ritmo 1 → 2 → 3 → 4★ para disparar tu habilidad clave en el Finale Resonante.',
    resource: {
      kind: 'COMPAS',
      label: 'COMPÁS',
      shortLabel: 'CMP',
      minValue: 1,
      maxValue: 4,
      initialValue: 1,
      accentColor: '#38BDF8',
      description:
        'Cada acción avanza el Compás (1 → 2 → 3 → 4★). En el Compás 4★ (FINALE RESONANTE), tu técnica o habilidad gana +35% de potencia, otorga Escudo/Bendición extra al grupo y reinicia el compás a 1.',
    },
    uiRepresentation: {
      style: 'BEATS',
      maxPips: 4,
      filledSymbol: '♪',
      emptySymbol: '·',
    },
    combatHooks: {
      onBasicAttack: 'Avanza +1 COMPÁS.',
      onDefend: 'Avanza +1 COMPÁS y armoniza el escudo grupal.',
      onWeaponSpecial: 'Avanza +1 COMPÁS (en 4★ activa Finale Resonante: +35% potencia y +4 Escudo grupal).',
      onSkill1: 'Acorde Disonante debilita el ataque enemigo y avanza +1 COMPÁS (en 4★ aplica Vulnerable en área y +35% daño).',
      onSkill2: 'Himno del Alba Astral sana al grupo y avanza +1 COMPÁS (en 4★ purifica 2 estados y otorga Regeneración; no hace daño).',
    },
    soloScaling:
      'En solitario, alcanzar el Compás 4★ también otorga +15% de Crítico y +2 Escudo personal al Bardo.',
    multiplayerSynergy:
      'En grupo, sincroniza el Finale Resonante (4★) para amplificar la ofensiva y supervivencia de los 4 aventureros a la vez.',
  },

  nigromante: {
    mechanicId: 'cosecha_de_almas',
    classId: 'nigromante',
    name: 'Cosecha de Almas',
    shortTag: 'ESENCIA DE ALMA (0–5)',
    shortDescription:
      'Extrae ESENCIA DE ALMA al maldecir enemigos, drenar vitalidad o presenciar muertes, y la consume en rituales sepulcrales de daño en área y sostén oscuro.',
    gameplayLoopSummary:
      'Condena enemigos con Maldición de Ceniza para cosechar ✦ ESENCIA y detónala con Explosión Sepulcral.',
    resource: {
      kind: 'ESENCIA',
      label: 'ESENCIA',
      shortLabel: 'ESE',
      minValue: 0,
      maxValue: 5,
      initialValue: 1,
      accentColor: '#34D399',
      description:
        'Cosechas +1 ESENCIA al atacar enemigos malditos, +2 con Maldición de Ceniza y +2 cada vez que muere un enemigo. Cada 2 Esencias otorgan +1 DEF espiritual. Explosión Sepulcral consume toda la Esencia para arrasar en área y sanar al grupo.',
    },
    uiRepresentation: {
      style: 'ORBS',
      maxPips: 5,
      filledSymbol: '✦',
      emptySymbol: '✧',
    },
    combatHooks: {
      onBasicAttack: 'Cosecha +1 ESENCIA (+2 si el objetivo sufre Maldición).',
      onDefend: 'Cosecha +1 ESENCIA y envuelve tu armadura en velo sepulcral.',
      onWeaponSpecial: 'Cosecha +1 ESENCIA y drena vitalidad de objetivos malditos.',
      onSkill1: 'Maldición de Ceniza aplica Maldición + Debilitado a 2 enemigos, drena vida y cosecha +2 ESENCIAS.',
      onSkill2: 'Explosión Sepulcral consume todas tus ESENCIAS (mín. 1) para infligir +26% daño en área y restaurar +3 PV y +2 Escudo grupal por Esencia.',
      onEnemyKill: 'Cada enemigo abatido libera +2 ESENCIAS DE ALMA.',
    },
    soloScaling:
      'En solitario, Maldición de Ceniza drena un +35% adicional de salud directamente para el Nigromante.',
    multiplayerSynergy:
      'En grupo, transforma las bajas enemigas y estados alterados en curación y escudos oscuros para toda la expedición.',
  },
};

export function getClassMechanicForCharacter(
  charId?: CriptaCharacterId | null
): CriptaClassMechanicDefinition | null {
  if (!charId) return null;
  const raw = CRIPTA_CLASS_MECHANICS_REGISTRY[charId];
  if (!raw) return null;
  return {
    ...raw,
    howToGain:
      raw.howToGain ||
      `${raw.combatHooks.onBasicAttack} ${raw.combatHooks.onDefend}`,
    howToSpendOrTrigger:
      raw.howToSpendOrTrigger ||
      `${raw.combatHooks.onSkill1} ${raw.combatHooks.onSkill2}`,
  };
}

/**
 * Returns a concise, high-readability status summary of the player's class mechanic for HUD & Cards.
 */
export function formatPlayerClassMechanicHud(
  player: CriptaPlayer | null | undefined
): {
  mechanic: CriptaClassMechanicDefinition;
  currentValue: number;
  maxValue: number;
  visualBarText: string;
  stateBadgeText: string;
  accentColor: string;
} | null {
  if (!player) return null;
  const charId = player.characterId || player.selectedCharacterId;
  const mechanic = getClassMechanicForCharacter(charId);
  if (!mechanic) return null;

  const res = mechanic.resource;
  const currentValue = Math.max(
    res.minValue,
    Math.min(res.maxValue, player.classResource ?? res.initialValue)
  );
  const maxValue = res.maxValue;

  if (res.kind === 'FURIA') {
    const stateBadgeText =
      currentValue >= 100
        ? '★ FURIA MÁXIMA (+35% DAÑO)'
        : currentValue >= 75
        ? '★ FRENESÍ (+32% DAÑO / -2 DEF)'
        : currentValue >= 50
        ? 'IRA ARDIENTE (+20% DAÑO)'
        : currentValue >= 25
        ? 'TEMPLE (+10% DAÑO)'
        : 'ACUMULANDO FURIA';
    return {
      mechanic,
      currentValue,
      maxValue,
      visualBarText: `${currentValue}/100`,
      stateBadgeText,
      accentColor: res.accentColor,
    };
  }

  if (res.kind === 'COMPAS') {
    const beats = [1, 2, 3, 4]
      .map((b) => (b === currentValue ? (b === 4 ? '[4★]' : `[${b}]`) : b === 4 ? '4★' : `${b}`))
      .join(' · ');
    return {
      mechanic,
      currentValue,
      maxValue,
      visualBarText: beats,
      stateBadgeText:
        currentValue >= 4
          ? '★ ¡FINALE RESONANTE LISTO (+35%)!'
          : `TIEMPO ${currentValue}/4`,
      accentColor: currentValue >= 4 ? '#FFD166' : res.accentColor,
    };
  }

  const filledCount = Math.max(0, Math.min(mechanic.uiRepresentation.maxPips, currentValue));
  const emptyCount = Math.max(0, mechanic.uiRepresentation.maxPips - filledCount);
  const visualBarText =
    mechanic.uiRepresentation.filledSymbol.repeat(filledCount) +
    mechanic.uiRepresentation.emptySymbol.repeat(emptyCount);

  let stateBadgeText = `${currentValue}/${maxValue}`;
  if (res.kind === 'GUARDIA') {
    stateBadgeText =
      currentValue >= 4
        ? `★ BASTIÓN (+${currentValue * 18}% EMBATE)`
        : currentValue > 0
        ? `+${currentValue} DEF · +${currentValue * 18}% EMBATE`
        : 'ALZA GUARDIA PARA CARGAR';
  } else if (res.kind === 'CARGA_ARCANA') {
    stateBadgeText =
      currentValue >= 5
        ? '⚠ ¡SOBRECARGA (+40% ÁREA)!'
        : currentValue > 0
        ? `+${currentValue * 12}% PODER MÁGICO`
        : 'ESTABLE (0/5)';
  } else if (res.kind === 'COMBO') {
    stateBadgeText =
      currentValue >= 3
        ? '★ ¡EJECUCIÓN CRÍTICA LISTA!'
        : currentValue > 0
        ? `+${currentValue * 28}% EN EJECUCIÓN`
        : 'ABRE HERIDA PARA COMBO';
  } else if (res.kind === 'ACECHO') {
    stateBadgeText =
      currentValue >= 3
        ? '★ PERFORACIÓN TOTAL (100%)'
        : currentValue > 0
        ? `+${currentValue * 5}% CRÍT · +${currentValue * 22}% TIRO`
        : 'MARCA UNA PRESA';
  } else if (res.kind === 'FERVOR') {
    stateBadgeText =
      currentValue >= 4
        ? `★ FERVOR RADIANTE (+${currentValue * 8}% CURA)`
        : currentValue > 0
        ? `+${currentValue * 8}% CURA · +${currentValue * 18}% JUICIO`
        : 'REZA O GOLPEA PARA FERVOR';
  } else if (res.kind === 'REACTIVOS') {
    stateBadgeText =
      currentValue >= 3
        ? '★ CATÁLISIS MÁXIMA LISTA'
        : currentValue > 0
        ? `${currentValue}/3 PARA DETONACIÓN`
        : 'SINTETIZA CON FRASCOS';
  } else if (res.kind === 'ESENCIA') {
    stateBadgeText =
      currentValue >= 4
        ? `★ OSARIO LLENO (+${currentValue * 26}% EXPLOSIÓN)`
        : currentValue > 0
        ? `+${Math.floor(currentValue / 2)} DEF · +${currentValue * 26}% RITUAL`
        : 'COSECHA ALMAS';
  }

  return {
    mechanic,
    currentValue,
    maxValue,
    visualBarText,
    stateBadgeText,
    accentColor:
      res.kind === 'CARGA_ARCANA' && currentValue >= 5
        ? '#FF4D6D'
        : res.accentColor,
  };
}

/**
 * Returns a short, scannable badge showing how a combat card interacts with the player's class mechanic.
 */
export function getCardMechanicInteractionBadge(
  player: CriptaPlayer | null | undefined,
  actionType: CriptaPlayerRoundActionType,
  abilityId?: string
): string | null {
  if (!player) return null;
  const charId = player.characterId || player.selectedCharacterId;
  const mechanic = getClassMechanicForCharacter(charId);
  if (!mechanic) return null;

  const cur = player.classResource ?? mechanic.resource.initialValue;

  if (actionType === 'ATTACK') {
    switch (charId) {
      case 'caballero':
        return '◆ GUARDA';
      case 'mago':
        return cur >= 4 ? '◆ SOBRECARGA' : '◆ +1 CARGA';
      case 'picaro':
        return '◆ +1 COMBO';
      case 'cazador':
        return '◆ MARCA';
      case 'clerigo':
        return '◆ +1 FERVOR';
      case 'alquimista':
        return '◆ +1 REACTIVO';
      case 'barbaro':
        return '◆ +15 FURIA';
      case 'bardo':
        return cur >= 4 ? '◆ FINALE 4★' : '◆ +1 COMPÁS';
      case 'nigromante':
        return '◆ +1 ESENCIA';
      default:
        return null;
    }
  }

  if (actionType === 'DEFEND') {
    switch (charId) {
      case 'caballero':
        return '◆ +2 GUARDA';
      case 'mago':
        return '◆ +ESCUDO ARCANO';
      case 'picaro':
        return '◆ +1 COMBO';
      case 'cazador':
        return '◆ +1 ACECHO';
      case 'clerigo':
        return '◆ +1 FERVOR';
      case 'alquimista':
        return '◆ +1 REACTIVO';
      case 'barbaro':
        return '◆ +10 FURIA';
      case 'bardo':
        return '◆ +1 COMPÁS';
      case 'nigromante':
        return '◆ +1 ESENCIA';
      default:
        return null;
    }
  }

  if (actionType === 'WEAPON_SPECIAL') {
    switch (charId) {
      case 'caballero':
        return '◆ +1 GUARDA';
      case 'mago':
        return cur >= 5 ? '◆ SOBRECARGA' : '◆ +1 CARGA';
      case 'picaro':
        return '◆ +1 COMBO';
      case 'cazador':
        return '◆ +1 ACECHO';
      case 'clerigo':
        return '◆ +1 FERVOR';
      case 'alquimista':
        return '◆ +1 REACTIVO';
      case 'barbaro':
        return '◆ +20 FURIA';
      case 'bardo':
        return cur >= 4 ? '◆ FINALE 4★' : '◆ +1 COMPÁS';
      case 'nigromante':
        return '◆ +1 ESENCIA';
      default:
        return null;
    }
  }

  if (actionType === 'ABILITY') {
    if (
      abilityId === 'tajo_de_antorcha' ||
      abilityId === 'embate_de_paves' ||
      abilityId === 'embate_de_escudo'
    ) {
      return cur > 0 ? `◆ USA ${cur} GUARDA` : '◆ GUARDA';
    }
    if (abilityId === 'muro_de_hierro') {
      return '◆ +2 GUARDA';
    }
    if (
      abilityId === 'llama_sepulcral' ||
      abilityId === 'descarga_arcana' ||
      abilityId === 'cadena_relampago'
    ) {
      return cur >= 4 ? '◆ SOBRECARGA' : '◆ +2 CARGA';
    }
    if (
      abilityId === 'velo_de_espejos' ||
      abilityId === 'convergencia_astral' ||
      abilityId === 'nova_de_escarcha'
    ) {
      return cur > 0 ? `◆ USA ${cur} CARGA` : '◆ BARRERA';
    }
    if (
      abilityId === 'ganzua_maestra' ||
      abilityId === 'paso_umbrio' ||
      abilityId === 'hoja_envenenada'
    ) {
      return '◆ +2 COMBO';
    }
    if (
      abilityId === 'filo_artero' ||
      abilityId === 'ejecucion_carmesi' ||
      abilityId === 'bomba_de_humo'
    ) {
      return cur > 0 ? `◆ USA ${cur} COMBO` : '◆ +1 COMBO';
    }
    if (abilityId === 'marca_de_presa' || abilityId === 'marca_de_caza') {
      return '◆ MARCA';
    }
    if (
      abilityId === 'virote_de_plata' ||
      abilityId === 'tiro_perforante' ||
      abilityId === 'lluvia_de_flechas_clase'
    ) {
      return cur > 0 ? `◆ USA ${cur} ACECHO` : '◆ PERFORA DEF';
    }
    if (abilityId === 'luz_consagrada' || abilityId === 'luz_del_relicario') {
      return '◆ +2 FERVOR';
    }
    if (
      abilityId === 'plegaria_de_ceniza' ||
      abilityId === 'juicio_del_alba' ||
      abilityId === 'decreto_sagrado'
    ) {
      return cur > 0 ? `◆ USA ${cur} FERVOR` : '◆ +1 FERVOR';
    }
    if (abilityId === 'destilado_vital' || abilityId === 'elixir_transmutado') {
      return '◆ +2 REACTIVOS';
    }
    if (
      abilityId === 'frasco_corrosivo' ||
      abilityId === 'bomba_corrosiva' ||
      abilityId === 'reaccion_en_cadena'
    ) {
      return cur > 0 ? `◆ DETONA ${cur} REACT.` : '◆ +1 REACTIVO';
    }
    if (abilityId === 'hachazo_brutal') {
      return '◆ +25 FURIA';
    }
    if (abilityId === 'grito_de_guerra') {
      return '◆ +25 FURIA';
    }
    if (abilityId === 'quebrantahuesos') {
      return '◆ -35 FURIA';
    }
    if (abilityId === 'acorde_disonante') {
      return cur >= 3 ? '◆ FINALE 4★' : '◆ +1 COMPÁS';
    }
    if (abilityId === 'balada_del_valor' || abilityId === 'himno_del_alba_astral') {
      return cur >= 3 ? '◆ FINALE 4★' : '◆ +1 COMPÁS';
    }
    if (abilityId === 'coda_del_eclipse') {
      return '◆ FINALE';
    }
    if (
      abilityId === 'drenaje_umbrio' ||
      abilityId === 'maldicion_de_ceniza' ||
      abilityId === 'cosecha_de_almas'
    ) {
      return '◆ +2 ESENCIA';
    }
    if (abilityId === 'pacto_de_ceniza') {
      return '◆ +3 ESENCIA';
    }
    if (
      abilityId === 'explosion_cadaverica' ||
      abilityId === 'explosion_sepulcral' ||
      abilityId === 'explosion_osea'
    ) {
      return cur >= 2 ? `◆ USA ${cur} ESENCIA` : '◆ ESENCIA';
    }
  }

  return null;
}

/**
 * Extracts all active status effects on an enemy into a unified list of CriptaPlayerStatusEffect
 * so the UI can render every single active buff/debuff (Veneno, Sangrado, Quemadura, Escarcha,
 * Corrosión, Maldición, Marcado, Vulnerable, Debilitado, Escudo, Bendecido) with full clarity!
 */
export function getEnemyActiveStatuses(
  enemy: CriptaRoomEnemy | null | undefined
): CriptaPlayerStatusEffect[] {
  if (!enemy || enemy.hp <= 0) return [];
  const list: CriptaPlayerStatusEffect[] = [];

  if ((enemy.poisonStacks || 0) > 0) {
    list.push({
      id: `${enemy.id}_poison`,
      effectType: 'POISON',
      name: 'Veneno',
      code: 'VEN',
      type: 'debuff',
      remainingTurns: enemy.poisonStacks || 1,
      stacks: enemy.poisonStacks || 1,
      potency: (enemy.poisonStacks || 1) * 4,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.bleedStacks || 0) > 0) {
    list.push({
      id: `${enemy.id}_bleed`,
      effectType: 'BLEED',
      name: 'Sangrado',
      code: 'SAN',
      type: 'debuff',
      remainingTurns: enemy.bleedStacks || 1,
      stacks: enemy.bleedStacks || 1,
      potency: (enemy.bleedStacks || 1) * 4,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.burnStacks || 0) > 0) {
    list.push({
      id: `${enemy.id}_burn`,
      effectType: 'BURN',
      name: 'Quemadura',
      code: 'QUE',
      type: 'debuff',
      remainingTurns: enemy.burnStacks || 1,
      stacks: enemy.burnStacks || 1,
      potency: (enemy.burnStacks || 1) * 5,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.corrosionTurns || 0) > 0) {
    list.push({
      id: `${enemy.id}_corrosion`,
      effectType: 'CORROSION',
      name: 'Corrosión',
      code: 'COR',
      type: 'debuff',
      remainingTurns: enemy.corrosionTurns || 1,
      stacks: 1,
      potency: 2,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.markedTurns || 0) > 0) {
    list.push({
      id: `${enemy.id}_marked`,
      effectType: 'MARKED',
      name: 'Presa Marcada',
      code: 'MRC',
      type: 'debuff',
      remainingTurns: enemy.markedTurns || 1,
      stacks: 1,
      potency: 25,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.curseTurns || 0) > 0) {
    list.push({
      id: `${enemy.id}_curse`,
      effectType: 'CURSE',
      name: 'Maldición',
      code: 'MAL',
      type: 'debuff',
      remainingTurns: enemy.curseTurns || 1,
      stacks: 1,
      potency: 20,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.vulnerableTurns || 0) > 0) {
    list.push({
      id: `${enemy.id}_vulnerable`,
      effectType: 'VULNERABLE',
      name: 'Vulnerable',
      code: 'VUL',
      type: 'debuff',
      remainingTurns: enemy.vulnerableTurns || 1,
      stacks: 1,
      potency: 25,
      appliedAtTurn: 1,
    });
  }

  if ((enemy.frostTurns || 0) > 0) {
    list.push({
      id: `${enemy.id}_frost`,
      effectType: 'FROST',
      name: 'Escarcha',
      code: 'ESC',
      type: 'debuff',
      remainingTurns: enemy.frostTurns || 1,
      stacks: 1,
      potency: 18,
      appliedAtTurn: 1,
    });
  }

  if (
    enemy.attackBuffBonus &&
    enemy.attackBuffBonus < 0 &&
    (enemy.attackBuffRounds || 0) > 0
  ) {
    list.push({
      id: `${enemy.id}_weakened`,
      effectType: 'WEAKENED',
      name: 'Debilitado',
      code: 'DEB',
      type: 'debuff',
      remainingTurns: enemy.attackBuffRounds || 1,
      stacks: 1,
      potency: Math.abs(enemy.attackBuffBonus),
      appliedAtTurn: 1,
    });
  }

  if (
    enemy.attackBuffBonus &&
    enemy.attackBuffBonus > 0 &&
    (enemy.attackBuffRounds || 0) > 0
  ) {
    list.push({
      id: `${enemy.id}_blessed`,
      effectType: 'BLESSED',
      name: 'Enfurecido',
      code: 'FUR',
      type: 'buff',
      remainingTurns: enemy.attackBuffRounds || 1,
      stacks: 1,
      potency: enemy.attackBuffBonus,
      appliedAtTurn: 1,
    });
  }

  if (
    enemy.isDefending ||
    (enemy.defendingRoundsRemaining || 0) > 0 ||
    (enemy.armorBuffBonus || 0) > 0
  ) {
    list.push({
      id: `${enemy.id}_shielded`,
      effectType: 'SHIELDED',
      name: 'Guardia Acorazada',
      code: 'GRD',
      type: 'buff',
      remainingTurns:
        enemy.defendingRoundsRemaining || enemy.armorBuffRounds || 1,
      stacks: 1,
      potency: enemy.armorBuffBonus || 3,
      appliedAtTurn: 1,
    });
  }

  return list;
}

/**
 * Unified HUD state helper used by Party HUD, Combat Strip, and Character Sheet Inspection.
 */
export function getPlayerClassMechanicHudState(
  player: CriptaPlayer | null | undefined
): {
  kind: CriptaClassResourceKind;
  label: string;
  shortLabel: string;
  current: number;
  max: number;
  pipsText: string;
  stateBadge: string;
  bonusSummary: string;
  colorHex: string;
  iconSymbol: string;
  isReadyOrThreshold: boolean;
} {
  const formatted = formatPlayerClassMechanicHud(player);
  if (!formatted) {
    return {
      kind: 'GUARDIA',
      label: 'RECURSO',
      shortLabel: 'REC',
      current: 0,
      max: 5,
      pipsText: '□□□□□',
      stateBadge: 'ESTABLE',
      bonusSummary: 'Sin bonificación activa',
      colorHex: '#E7A54A',
      iconSymbol: '■',
      isReadyOrThreshold: false,
    };
  }
  const safeLabel =
    formatted.mechanic.resource?.label ||
    formatted.mechanic.name ||
    'RECURSO';
  const isReadyOrThreshold =
    formatted.mechanic.resource.kind === 'FURIA'
      ? formatted.currentValue >= 50
      : formatted.currentValue >= Math.max(2, formatted.maxValue - 1);
  return {
    kind: formatted.mechanic.resource.kind,
    label: safeLabel,
    shortLabel:
      formatted.mechanic.resource?.shortLabel ||
      safeLabel.slice(0, 4),
    current: formatted.currentValue,
    max: formatted.maxValue,
    pipsText: formatted.visualBarText,
    stateBadge: formatted.stateBadgeText,
    bonusSummary: formatted.stateBadgeText,
    colorHex: formatted.accentColor,
    iconSymbol: formatted.mechanic.uiRepresentation.filledSymbol,
    isReadyOrThreshold,
  };
}

/**
 * Alias for getCardMechanicInteractionBadge used on combat action buttons.
 */
export function getPlayerActionMechanicBadge(
  player: CriptaPlayer | null | undefined,
  actionType: CriptaPlayerRoundActionType,
  abilityId?: string
): string | null {
  return getCardMechanicInteractionBadge(player, actionType, abilityId);
}

