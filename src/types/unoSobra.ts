export interface UnoSobraConfig {
  discussionDurationMinutes: number; // 2 to 10 minutes
  presentationDurationSeconds: 10; // fixed at 10 seconds
  eliminationMode: 'permanent'; // permanent elimination mode
}

export interface UnoSobraRole {
  title: string;
  description: string;
  secretArgument: string;
}

export interface UnoSobraPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  isEliminated: boolean;
  votesReceived: number;
  // Private role assigned authoritatively by server.
  // CRITICAL: Only serialized to the owning player (undefined for others)
  privateRole?: UnoSobraRole;
}

export type UnoSobraPhase =
  | 'LOBBY'
  | 'SCENARIO_INTRO'
  | 'DISCUSSION'
  | 'VOTING'
  | 'ELIMINATION_REVEAL'
  | 'GAME_OVER'
  | 'MATCH_ABORTED';

export interface UnoSobraScenario {
  id: string;
  title: string;
  description: string;
  roles: UnoSobraRole[];
}

export interface UnoSobraRoomState {
  code: string;
  gameType: 'uno-sobra';
  hostId: string;
  phase: UnoSobraPhase;
  config: UnoSobraConfig;
  players: UnoSobraPlayer[];
  currentRound: number;
  activeScenario?: {
    id: string;
    title: string;
    description: string;
    slotsAvailable: number;
  } | null;
  timerRemainingSeconds: number;
  eliminatedPlayerId?: string | null;
  abortReason?: string;
}

export type UnoSobraClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: { id: string; name: string; avatar?: string; color?: string };
    }
  | {
      type: 'RECONNECT';
      code: string;
      playerId: string;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<UnoSobraConfig>;
    }
  | {
      type: 'TOGGLE_READY';
      isReady: boolean;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'CAST_VOTE';
      targetPlayerId: string;
    }
  | {
      type: 'TRANSFER_HOST';
      targetPlayerId: string;
    }
  | {
      type: 'KICK_PLAYER';
      targetPlayerId: string;
    }
  | {
      type: 'RETURN_TO_LOBBY';
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
    };

export type UnoSobraServerMessage =
  | {
      type: 'ROOM_STATE';
      state: UnoSobraRoomState;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };

// Rich pre-configured emergency scenarios with 10 distinct survivor roles each
export const UNO_SOBRA_SCENARIOS: UnoSobraScenario[] = [
  {
    id: 'bunker_radiactivo',
    title: 'BÚNKER SUBTERRÁNEO CLIMÁTICO',
    description: 'Una lluvia ácida y radiación masiva azotan la superficie exterior. El búnker blindado dispone de reservas de oxígeno selladas para un número limitado de supervivientes. Uno de vosotros debe quedarse fuera para que el cierre neumático selle la escotilla a tiempo.',
    roles: [
      { title: 'Médico de Traumatología', description: 'Trata infecciones y heridas graves.', secretArgument: 'Sin mis conocimientos de esterilización y cirugía de urgencia, cualquier corte infectado matará a todo el búnker en semanas.' },
      { title: 'Ingeniero Hidráulico', description: 'Repara los filtros de agua reciclada.', secretArgument: 'Los filtros de condensación se obstruyen cada 48 horas. Solo yo sé desarmar las bombas sin inundar el generador.' },
      { title: 'Botánica Hidropónica', description: 'Cultiva patatas y algas comestibles.', secretArgument: 'Las raciones enlatadas se acabarán en 15 días. Sin mis semillas y nutrientes hidropónicos moriréis todos de hambre.' },
      { title: 'Electricista de Alta Tensión', description: 'Mantiene las baterías del reactor.', secretArgument: 'El conversor de litio emite chispas. Si no calibro el voltaje a diario, habrá un cortocircuito que fundirá las luces.' },
      { title: 'Operador de Radiobaliza', description: 'Rastrea frecuencias de rescate militar.', secretArgument: 'Tengo los códigos cifrados de la frecuencia de evacuación del ejército; si me echáis nadie responderá al SOS.' },
      { title: 'Soldado de Intervención', description: 'Protege contra saqueadores armados.', secretArgument: 'Tengo entrenamiento táctico para defender la puerta de acceso contra bandas desesperadas del exterior.' },
      { title: 'Cocinero de Campaña', description: 'Raciona alimentos y evita intoxicaciones.', secretArgument: 'Sé conservar los víveres para que duren el triple y esterilizar moho sin desperdiciar calorías.' },
      { title: 'Psicóloga de Contención', description: 'Previene brotes de locura y motines.', secretArgument: 'El encierro en 30 metros cuadrados desata psicosis. Mantendré la moral del grupo y mediaré en las disputas letales.' },
      { title: 'Cerrajero y Mecánico', description: 'Mantiene las esclusas herméticas.', secretArgument: 'Las juntas de goma del sellado están carcomidas. Solo yo sé soldar cierres de emergencia con soplete.' },
      { title: 'Archivista Científico', description: 'Guarda manuales y datos de reconstrucción.', secretArgument: 'Poseo la memoria digital con las fórmulas para sintetizar antibióticos y reconstruir la civilización al salir.' },
    ],
  },
  {
    id: 'capsula_orbital',
    title: 'CÁPSULA DE EVACUACIÓN ORBITAL',
    description: 'La estación espacial ha sufrido un impacto de micro-meteoritos. La cápsula de descenso es el único vehículo operativo pero su propulsor de retrofrenado solo soporta el peso de los asientos disponibles.',
    roles: [
      { title: 'Piloto de Maniobras', description: 'Calcula el ángulo de reentrada en la atmósfera.', secretArgument: 'Si la reentrada falla por 2 grados arderemos en la atmósfera. Nadie más ha aterrizado una nave manualmente.' },
      { title: 'Especialista en Soporte Vital', description: 'Regula las mezclas de nitrógeno y O2.', secretArgument: 'El sensor de CO2 está averiado; tengo que calibrar las mezclas de presión a mano cada 10 minutos.' },
      { title: 'Astrofísico de Navegación', description: 'Traza las coordenadas de amerizaje.', secretArgument: 'Sé calcular la trayectoria para caer cerca de los barcos de rescate marítimo y no en medio de la Antártida.' },
      { title: 'Cirujana de Vuelo', description: 'Trata descompresiones y traumatismos.', secretArgument: 'La fuerza de 6G desmayará a la mitad; sé suministrar adrenalina y mantener los corazones estables.' },
      { title: 'Técnico de Comunicaciones Cuánticas', description: 'Transmite telemetría a Cabo Cañaveral.', secretArgument: 'Solo yo tengo la clave de enlace satelital para que los radares militares no nos confundan con un misil enemigo.' },
      { title: 'Experto en Paracaídas Hipersónicos', description: 'Despliega el sistema de frenado final.', secretArgument: 'Los cables pirotécnicos del paracaídas principal están dañados; tendré que accionarlos manualmente durante la caída.' },
      { title: 'Geóloga Planetaria', description: 'Analiza muestras biológicas recuperadas.', secretArgument: 'Transporto en mi traje las muestras de la cura biológica hallada en la luna; sacrificarlas sería condenar a la Tierra.' },
      { title: 'Bombero Espacial', description: 'Controla incendios por fricción térmica.', secretArgument: 'Sé combatir fuegos eléctricos en gravedad cero con retardante de espuma sin consumir el oxígeno respirable.' },
      { title: 'Ingeniero de Escudo Térmico', description: 'Supervisa las losetas cerámicas.', secretArgument: 'Tres losetas del morro tienen fisuras. Sé cómo distribuir la inclinación de la nave para que no se fundan.' },
      { title: 'Oficial de Logística de Supervivencia', description: 'Posee el equipo baliza marítimo.', secretArgument: 'Conozco el protocolo de desalojo en alta mar y manejo la balsa hinchable con desalinizadores solares.' },
    ],
  },
  {
    id: 'bote_polar',
    title: 'EXPEDICIÓN ROMPEHIELOS ÁRTICA',
    description: 'El buque de investigación ha quedado aplastado por el hielo polar a -35°C. El bote salvavidas motorizado tiene combustible limitado y espacio para un número estricto de tripulantes.',
    roles: [
      { title: 'Patrón de Pesca de Altura', description: 'Navega entre bloques de hielo flotante.', secretArgument: 'Conozco estas corrientes heladas desde hace 25 años; esquivaré los icebergs sumergidos en la ventisca.' },
      { title: 'Médico de Congelaciones', description: 'Trata hipotermias severas.', secretArgument: 'Sin mis apósitos térmicos y fármacos vasodilatadores, varios de vosotros perderéis dedos o moriréis en 6 horas.' },
      { title: 'Mecánico de Motores Diésel', description: 'Evita que el gasóleo se congele.', secretArgument: 'A -35°C el combustible se vuelve gelatina. Solo yo sé mezclar aditivos y desatascar los inyectores.' },
      { title: 'Guía Inuit Nativo', description: 'Interpreta el clima y rastrea refugios.', secretArgument: 'Sé leer los cambios del viento, construir iglús de emergencia y cazar focas si quedamos varados en una banquisa.' },
      { title: 'Cazador Experto', description: 'Protege contra osos polares hambrientos.', secretArgument: 'Llevo el único rifle con munición pesada para abatir depredadores árticos que acechan las balsas.' },
      { title: 'Radioperador Militar', description: 'Mantiene contacto con la base de Thule.', secretArgument: 'Tengo la batería solar para la radio de onda corta y sé código Morse para guiar a los hidroaviones.' },
      { title: 'Bióloga Marina Polar', description: 'Distingue hielo seguro de agua trampa.', secretArgument: 'Sé qué capas de hielo soportan el peso del grupo para caminar a pie si el motor se para por completo.' },
      { title: 'Cocinero de Expedición', description: 'Conserva la grasa calórica esencial.', secretArgument: 'Sé fundir nieve sin consumir combustible escaso y racionar el pemmican para mantener la temperatura corporal.' },
      { title: 'Rescatista de Aguas Gélidas', description: 'Experto en extraer náufragos.', secretArgument: 'Si alguien cae al agua helada entrará en shock en 60 segundos; soy el único entrenado para rescatarlo vivo.' },
      { title: 'Líder de Cartografía Satelital', description: 'Posee el mapa de refugios con carbón.', secretArgument: 'Tengo las coordenadas del refugio de madera noruego con estufa de leña y víveres a 15 millas al sur.' },
    ],
  },
  {
    id: 'isla_volcanica',
    title: 'EVACUACIÓN DE ISLA VOLCÁNICA',
    description: 'El volcán ha entrado en erupción pliniana con nubes piroclásticas descendiendo por la ladera. Una avioneta bimotor en una pista corta solo puede despegar con un límite riguroso de peso.',
    roles: [
      { title: 'Piloto de Montaña', description: 'Despega en pistas cortas cubiertas de ceniza.', secretArgument: 'La pista está rota y llueve ceniza volcánica; solo un piloto de vuelo acrobático puede levantar este avión.' },
      { title: 'Vulcanólogo Jefe', description: 'Calcula la dirección del flujo piroclástico.', secretArgument: 'Sé exactamente cuánto tiempo tenemos antes de que la onda expansiva alcance la cola del avión.' },
      { title: 'Paramédica de Inhalaciones', description: 'Administra nebulizadores de oxígeno.', secretArgument: 'La ceniza sulfúrica calcifica los pulmones. Llevo las máscaras de presión positiva indispensables.' },
      { title: 'Mecánico de Turbinas', description: 'Limpia los filtros de aire de ceniza.', secretArgument: 'Los motores se pararán en el aire por la ceniza si no limpio las toberas con aire comprimido al arrancar.' },
      { title: 'Guía de Selva Tropical', description: 'Conoce los caminos despejados.', secretArgument: 'Guié al grupo a través de los ríos de lava y conozco los puntos seguros de aterrizaje de emergencia.' },
      { title: 'Operadora de Torre de Control', description: 'Sincroniza el pasillo aéreo civil.', secretArgument: 'Tengo enlace directo con el aeropuerto continental para que nos autoricen un aterrizaje de emergencia prioritario.' },
      { title: 'Geofísico de Sensores', description: 'Monitoriza los terremotos volcánicos.', secretArgument: 'Puedo anticipar el colapso del terreno bajo la pista para saber el segundo exacto en que soltar frenos.' },
      { title: 'Bombero Forestal', description: 'Extingue fuegos en las alas durante el despegue.', secretArgument: 'Cuento con extintores químicos y trajes aluminizados para despejar chispas de los tanques de gasolina.' },
      { title: 'Guardabosques Isleño', description: 'Posee el botiquín de antídotos de serpientes.', secretArgument: 'Llevo el kit médico con suero antiofídico y agua purificada de reserva para la tripulación.' },
      { title: 'Ingeniero de Combustibles', description: 'Filtra queroseno contaminado.', secretArgument: 'El depósito contiene impurezas; sé purgar el agua del tanque para que los motores no fallen en pleno vuelo.' },
    ],
  },
];
