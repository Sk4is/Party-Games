export type CuantoTeAtrevesChallengesCount = 'unlimited' | 5 | 10 | 20;

export interface CuantoTeAtrevesConfig {
  challengeTimeSeconds: number; // 15 to 90 seconds, step of 5
  challengesCount: CuantoTeAtrevesChallengesCount;
}

export interface CuantoTeAtrevesTopic {
  id: string;
  title: string;
  hint?: string;
}

export interface CuantoTeAtrevesPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  score: number;
  challengesCompleted: number;
}

export type CuantoTeAtrevesPhase =
  | 'LOBBY'
  | 'TOPIC_REVEAL'
  | 'BETTING'
  | 'CHALLENGE_ACTIVE'
  | 'CHALLENGE_RESULT'
  | 'GAME_OVER'
  | 'MATCH_ABORTED';

export interface CuantoTeAtrevesLastResult {
  success: boolean;
  surrendered: boolean;
  expired: boolean;
  targetBet: number;
  pointsAwarded: number;
  playerId: string;
  playerName: string;
}

export interface CuantoTeAtrevesRoomState {
  code: string;
  gameType: 'cuanto-te-atreves';
  hostId: string;
  phase: CuantoTeAtrevesPhase;
  config: CuantoTeAtrevesConfig;
  players: CuantoTeAtrevesPlayer[];
  currentChallengeNumber: number;
  activePlayerId: string | null;
  currentTopic: CuantoTeAtrevesTopic | null;
  targetBet: number | null;
  timerRemainingSeconds: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  lastResult: CuantoTeAtrevesLastResult | null;
  abortReason?: string;
}

export type CuantoTeAtrevesClientMessage =
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
      config: Partial<CuantoTeAtrevesConfig>;
    }
  | {
      type: 'TOGGLE_READY';
      isReady: boolean;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'SELECT_PLAYER';
      playerId: string;
    }
  | {
      type: 'SET_BET';
      bet: number;
    }
  | {
      type: 'START_CHALLENGE';
    }
  | {
      type: 'RESOLVE_CHALLENGE';
      outcome: 'SUCCESS' | 'SURRENDER';
    }
  | {
      type: 'TOGGLE_PAUSE_TIMER';
    }
  | {
      type: 'NEXT_ROUND';
    }
  | {
      type: 'FINISH_GAME';
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

export type CuantoTeAtrevesServerMessage =
  | {
      type: 'ROOM_STATE';
      state: CuantoTeAtrevesRoomState;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };

// Clean, accessible, answerable verbal knowledge topics
export const CUANTO_TE_ATREVES_TOPICS: CuantoTeAtrevesTopic[] = [
  { id: 't_1', title: 'Nombra videojuegos', hint: 'De cualquier época, consola, PC o móvil' },
  { id: 't_2', title: 'Nombra países del mundo', hint: 'De cualquier continente' },
  { id: 't_3', title: 'Nombra películas de Disney o Pixar', hint: 'Clásicos o estrenos modernos' },
  { id: 't_4', title: 'Nombra youtubers o streamers hispanohablantes', hint: 'De YouTube, Twitch, Kick o directos' },
  { id: 't_5', title: 'Nombra dibujos animados o series de animación', hint: 'De tu infancia o actuales' },
  { id: 't_6', title: 'Nombra marcas de coches', hint: 'Fabricantes de automóviles de cualquier país' },
  { id: 't_7', title: 'Nombra animales marinos', hint: 'Peces, cetáceos, moluscos, crustáceos...' },
  { id: 't_8', title: 'Nombra equipos de fútbol', hint: 'Nacionales o internacionales' },
  { id: 't_9', title: 'Nombra series de televisión', hint: 'Comedia, drama, suspense, ficción...' },
  { id: 't_10', title: 'Nombra personajes de Pokémon', hint: 'Cualquier especie o generación' },
  { id: 't_11', title: 'Nombra platos y comidas típicas de España', hint: 'Tapas, guisos, arroces o recetas tradicionales' },
  { id: 't_12', title: 'Nombra cantantes o grupos de música', hint: 'De cualquier género o época' },
  { id: 't_13', title: 'Nombra capitales europeas', hint: 'Ciudades capitales de estados europeos' },
  { id: 't_14', title: 'Nombra aplicaciones móviles', hint: 'Redes sociales, mensajería, productividad o juegos' },
  { id: 't_15', title: 'Nombra superhéroes', hint: 'De cómics Marvel, DC o cine' },
  { id: 't_16', title: 'Nombra consolas de videojuegos', hint: 'De sobremesa o portátiles' },
  { id: 't_17', title: 'Nombra películas de terror', hint: 'Miedo, suspense sobrenatural o slasher' },
  { id: 't_18', title: 'Nombra marcas de ropa y moda', hint: 'Tiendas de ropa, alta costura o deportiva' },
  { id: 't_19', title: 'Nombra frutas y verduras', hint: 'De cualquier temporada o variedad' },
  { id: 't_20', title: 'Nombra juegos de mesa', hint: 'Clásicos familiares o modernos' },
  { id: 't_21', title: 'Nombra deportes olímpicos', hint: 'De verano o de invierno' },
  { id: 't_22', title: 'Nombra instrumentos musicales', hint: 'Cuerda, viento, percusión o teclado' },
  { id: 't_23', title: 'Nombra razas de perro', hint: 'Grandes, medianos o pequeños' },
  { id: 't_24', title: 'Nombra profesiones u oficios', hint: 'Cualquier trabajo o vocación' },
  { id: 't_25', title: 'Nombra ciudades de España', hint: 'Poblaciones y municipios de cualquier comunidad' },
  { id: 't_26', title: 'Nombra animales mamíferos', hint: 'Terrestres, aéreos o acuáticos' },
  { id: 't_27', title: 'Nombra personajes de películas de Harry Potter', hint: 'Alumnos, profesores, criaturas o magos' },
  { id: 't_28', title: 'Nombra asignaturas o materias del colegio', hint: 'De primaria, secundaria o bachillerato' },
  { id: 't_29', title: 'Nombra películas de acción', hint: 'Persecuciones, explosiones y héroes de acción' },
  { id: 't_30', title: 'Nombra idiomas del mundo', hint: 'Lenguas habladas en cualquier territorio' },
  { id: 't_31', title: 'Nombra objetos que hay en una cocina', hint: 'Utensilios, electrodomésticos o menaje' },
  { id: 't_32', title: 'Nombra cosas que te llevas a la playa', hint: 'Accesorios, ropa o entretenimiento para la arena' },
  { id: 't_33', title: 'Nombra marcas de refrescos o bebidas', hint: 'Gaseosas, zumos, aguas o energéticas' },
  { id: 't_34', title: 'Nombra villanos de cine, cómics o series', hint: 'Antagonistas célebres' },
  { id: 't_35', title: 'Nombra monumentos famosos del mundo', hint: 'Edificaciones históricas o maravillas' },
  { id: 't_36', title: 'Nombra canciones famosas del verano', hint: 'Éxitos bailables de cualquier año' },
  { id: 't_37', title: 'Nombra marcas de zapatillas deportivas', hint: 'Calzado urbano o para correr' },
  { id: 't_38', title: 'Nombra juegos tradicionales o de cartas', hint: 'La baraja española, juegos de patio o recreo' },
  { id: 't_39', title: 'Nombra flores y plantas', hint: 'De jardín, silvestres o de interior' },
  { id: 't_40', title: 'Nombra objetos que caben en un bolsillo', hint: 'Cosas cotidianas que llevas encima' },
  { id: 't_41', title: 'Nombra programas de televisión famosos', hint: 'Concursos, realities, magacines o noticias' },
  { id: 't_42', title: 'Nombra aves o animales que vuelan', hint: 'Pájaros, insectos o murciélagos' },
  { id: 't_43', title: 'Nombra medios de transporte', hint: 'Terrestres, marítimos o aéreos' },
  { id: 't_44', title: 'Nombra actores o actrices de cine', hint: 'Nacionales o de Hollywood' },
  { id: 't_45', title: 'Nombra planetas y cuerpos del sistema solar', hint: 'Planetas, lunas, estrellas o cometas' },
  { id: 't_46', title: 'Nombra postres o dulces', hint: 'Tartas, pasteles, helados o golosinas' },
  { id: 't_47', title: 'Nombra festividades y celebraciones del año', hint: 'Fiestas señaladas, vacaciones o tradiciones' },
  { id: 't_48', title: 'Nombra partes del cuerpo humano', hint: 'Órganos, extremidades, huesos o articulaciones' },
  { id: 't_49', title: 'Nombra ciudades de América', hint: 'De Norteamérica, Centroamérica o Sudamérica' },
  { id: 't_50', title: 'Nombra marcas de tecnología o electrónica', hint: 'Móviles, ordenadores, televisores o chips' },
];
