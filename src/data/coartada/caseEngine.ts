import {
  CaseDossier,
  SuspectDossier,
  SuspectIdentity,
  EvidenceCard,
  EvidenceType,
  EvidenceVisualCategory,
  FinalTruthReveal,
  CoartadaDurationMinutes,
} from '../../types/coartada';
import { GeneratedCaseInternal, validateGeneratedCase } from './caseValidator';

// Mulberry32 PRNG for deterministic, non-biased procedural case generation
export class Mulberry32 {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.range(0, arr.length - 1)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

// Grammatically sound location definition
interface LocationInfo {
  name: string;
  article: 'el' | 'la' | 'los' | 'las';
  prepA: string; // e.g. "al Gran Hotel Mirador", "a la Estación"
  prepEn: string; // e.g. "en el Gran Hotel Mirador", "en la Estación"
  prepDe: string; // e.g. "del Gran Hotel Mirador", "de la Estación"
  subRooms: {
    name: string;
    prepEn: string;
    prepA: string;
  }[];
}

interface VenueDefinition {
  category: string;
  locations: LocationInfo[];
}

const VENUES: VenueDefinition[] = [
  {
    category: 'HOTEL',
    locations: [
      {
        name: 'Gran Hotel Mirador',
        article: 'el',
        prepA: 'al Gran Hotel Mirador',
        prepEn: 'en el Gran Hotel Mirador',
        prepDe: 'del Gran Hotel Mirador',
        subRooms: [
          { name: 'Suite Presidencial 402', prepEn: 'en la Suite Presidencial 402', prepA: 'a la Suite Presidencial 402' },
          { name: 'Bar del Vestíbulo', prepEn: 'en el Bar del Vestíbulo', prepA: 'al Bar del Vestíbulo' },
          { name: 'Terraza Acristalada', prepEn: 'en la Terraza Acristalada', prepA: 'a la Terraza Acristalada' },
          { name: 'Cuarto de Calderas', prepEn: 'en el Cuarto de Calderas', prepA: 'al Cuarto de Calderas' },
          { name: 'Recepción Central', prepEn: 'en la Recepción Central', prepA: 'a la Recepción Central' },
        ],
      },
      {
        name: 'Hospedería del Sol',
        article: 'la',
        prepA: 'a la Hospedería del Sol',
        prepEn: 'en la Hospedería del Sol',
        prepDe: 'de la Hospedería del Sol',
        subRooms: [
          { name: 'Habitación 208', prepEn: 'en la Habitación 208', prepA: 'a la Habitación 208' },
          { name: 'Comedor de Viajeros', prepEn: 'en el Comedor de Viajeros', prepA: 'al Comedor de Viajeros' },
          { name: 'Patio Trasero', prepEn: 'en el Patio Trasero', prepA: 'al Patio Trasero' },
          { name: 'Sótano de Almacén', prepEn: 'en el Sótano de Almacén', prepA: 'al Sótano de Almacén' },
        ],
      },
    ],
  },
  {
    category: 'MUSEO',
    locations: [
      {
        name: 'Museo Arqueológico Provincial',
        article: 'el',
        prepA: 'al Museo Arqueológico Provincial',
        prepEn: 'en el Museo Arqueológico Provincial',
        prepDe: 'del Museo Arqueológico Provincial',
        subRooms: [
          { name: 'Sala de Numismática e Íberos', prepEn: 'en la Sala de Numismática e Íberos', prepA: 'a la Sala de Numismática e Íberos' },
          { name: 'Gabinete de Restauración', prepEn: 'en el Gabinete de Restauración', prepA: 'al Gabinete de Restauración' },
          { name: 'Biblioteca de Investigadores', prepEn: 'en la Biblioteca de Investigadores', prepA: 'a la Biblioteca de Investigadores' },
          { name: 'Claustro de Esculturas', prepEn: 'en el Claustro de Esculturas', prepA: 'al Claustro de Esculturas' },
          { name: 'Almacén de Fondos Reservados', prepEn: 'en el Almacén de Fondos Reservados', prepA: 'al Almacén de Fondos Reservados' },
        ],
      },
    ],
  },
  {
    category: 'OFICINA',
    locations: [
      {
        name: 'Sede Central de Exportaciones Iberia',
        article: 'la',
        prepA: 'a la Sede Central de Exportaciones Iberia',
        prepEn: 'en la Sede Central de Exportaciones Iberia',
        prepDe: 'de la Sede Central de Exportaciones Iberia',
        subRooms: [
          { name: 'Despacho de Presidencia', prepEn: 'en el Despacho de Presidencia', prepA: 'al Despacho de Presidencia' },
          { name: 'Archivo de Contabilidad B', prepEn: 'en el Archivo de Contabilidad B', prepA: 'al Archivo de Contabilidad B' },
          { name: 'Sala de Fotocopiadoras', prepEn: 'en la Sala de Fotocopiadoras', prepA: 'a la Sala de Fotocopiadoras' },
          { name: 'Office de Empleados', prepEn: 'en el Office de Empleados', prepA: 'al Office de Empleados' },
          { name: 'Mostrador de Seguridad', prepEn: 'en el Mostrador de Seguridad', prepA: 'al Mostrador de Seguridad' },
        ],
      },
    ],
  },
  {
    category: 'TEATRO',
    locations: [
      {
        name: 'Teatro Principal de la Ópera',
        article: 'el',
        prepA: 'al Teatro Principal de la Ópera',
        prepEn: 'en el Teatro Principal de la Ópera',
        prepDe: 'del Teatro Principal de la Ópera',
        subRooms: [
          { name: 'Camerino Principal', prepEn: 'en el Camerino Principal', prepA: 'al Camerino Principal' },
          { name: 'Taller de Sastrería', prepEn: 'en el Taller de Sastrería', prepA: 'al Taller de Sastrería' },
          { name: 'Foso de la Orquesta', prepEn: 'en el Foso de la Orquesta', prepA: 'al Foso de la Orquesta' },
          { name: 'Cantina de Músicos', prepEn: 'en la Cantina de Músicos', prepA: 'a la Cantina de Músicos' },
          { name: 'Pasillo de Tramoya Superior', prepEn: 'en el Pasillo de Tramoya Superior', prepA: 'al Pasillo de Tramoya Superior' },
        ],
      },
    ],
  },
  {
    category: 'ESTACIÓN',
    locations: [
      {
        name: 'Estación Central de Ferrocarril',
        article: 'la',
        prepA: 'a la Estación Central de Ferrocarril',
        prepEn: 'en la Estación Central de Ferrocarril',
        prepDe: 'de la Estación Central de Ferrocarril',
        subRooms: [
          { name: 'Consigna de Equipajes', prepEn: 'en la Consigna de Equipajes', prepA: 'a la Consigna de Equipajes' },
          { name: 'Cantina de Andenes', prepEn: 'en la Cantina de Andenes', prepA: 'a la Cantina de Andenes' },
          { name: 'Oficina del Jefe de Estación', prepEn: 'en la Oficina del Jefe de Estación', prepA: 'a la Oficina del Jefe de Estación' },
          { name: 'Andén 3 (Vía Norte)', prepEn: 'en el Andén 3 (Vía Norte)', prepA: 'al Andén 3 (Vía Norte)' },
          { name: 'Sala de Espera de Primera Clase', prepEn: 'en la Sala de Espera de Primera Clase', prepA: 'a la Sala de Espera de Primera Clase' },
        ],
      },
    ],
  },
  {
    category: 'MANSIÓN',
    locations: [
      {
        name: 'Finca Los Castaños',
        article: 'la',
        prepA: 'a la Finca Los Castaños',
        prepEn: 'en la Finca Los Castaños',
        prepDe: 'de la Finca Los Castaños',
        subRooms: [
          { name: 'Biblioteca del Conde', prepEn: 'en la Biblioteca del Conde', prepA: 'a la Biblioteca del Conde' },
          { name: 'Salón de Billar', prepEn: 'en el Salón de Billar', prepA: 'al Salón de Billar' },
          { name: 'Pabellón de Guardeses', prepEn: 'en el Pabellón de Guardeses', prepA: 'al Pabellón de Guardeses' },
          { name: 'Bodega Subterránea', prepEn: 'en la Bodega Subterránea', prepA: 'a la Bodega Subterránea' },
          { name: 'Cochera Posterior', prepEn: 'en la Cochera Posterior', prepA: 'a la Cochera Posterior' },
        ],
      },
    ],
  },
];

// Suspect names pool
const SURNAMES_POOL = [
  'Navarro', 'Salgado', 'Rivera', 'Morales', 'Blanco', 'Vega',
  'Peralta', 'Lozano', 'Cobo', 'Aranda', 'Soler', 'Beltrán',
  'Mendieta', 'Barreda', 'Valverde', 'Cruz', 'Soria', 'Roldán'
];

const NAMES_MEN = ['Marcos', 'Hugo', 'Carlos', 'Javier', 'Mateo', 'Víctor', 'Adrián', 'Guillermo', 'Felipe', 'Eusebio'];
const NAMES_WOMEN = ['Carmen', 'Lucía', 'Irene', 'Elena', 'Raquel', 'Nuria', 'Teresa', 'Silvia', 'Beatriz', 'Mercedes'];

const PROFESSIONS = [
  'Restaurador de arte', 'Contable mercantil', 'Perito tasador', 'Fotógrafo de prensa',
  'Técnico de iluminación', 'Representante comercial', 'Secretario particular', 'Archivero asistente',
  'Relojero joyero', 'Agente de aduanas', 'Músico de cámara', 'Bibliotecario auxiliar'
];

const WITNESS_NAMES = [
  'Don Amador Gil', 'Doña Constanza Valls', 'Inspector Valiente', 'Felipe Ocaña',
  'Elvira Montero', 'Fausto Alarcón', 'Gonzalo Peinado', 'Dolores Sáenz',
  'Tomás Aguilar', 'Pilar Santamaría', 'Consuelo Maza', 'Esteban Lozano'
];

export type IncidentArchetype =
  | 'THEFT'
  | 'MURDER'
  | 'KIDNAPPING_DISAPPEARANCE'
  | 'IDENTITY_IMPERSONATION'
  | 'SABOTAGE'
  | 'FRAUD_FORGERY'
  | 'ESPIONAGE_LEAK';

interface TimeWindowPlan {
  periodLabel: string; // e.g. "Mañana", "Mediodía", "Tarde", "Noche", "Madrugada", "Medianoche cruzada"
  caseDateDay: number;
  caseDateMonth: string;
  caseDateYear: number;
  startMinutes: number; // minutes from 00:00 (e.g. 14*60 + 15 = 855)
  suspectEntryOffset: number; // minutes from start
  alibiActivityMinutes: number;
  incidentStartOffset: number; // minutes when incident occurs
  incidentDuration: number;
  incidentDiscoveryOffset: number;
  crossesMidnight: boolean;
}

const MONTHS_SPANISH = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

function minutesToTimeString(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateProceduralCase(
  durationMinutes: CoartadaDurationMinutes = 10,
  forceGuilty?: boolean,
  seed?: number
): GeneratedCaseInternal {
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    const currentSeed = seed !== undefined ? seed + attempts * 1013 : Date.now() + attempts * 2477;
    const rng = new Mulberry32(currentSeed);

    // 1. Archetype Selection
    const archetypes: IncidentArchetype[] = [
      'THEFT',
      'MURDER',
      'KIDNAPPING_DISAPPEARANCE',
      'IDENTITY_IMPERSONATION',
      'SABOTAGE',
      'FRAUD_FORGERY',
      'ESPIONAGE_LEAK',
    ];
    const archetype = rng.pick(archetypes);

    // 2. Coherent Dates & Varied Times of Day (Requirement 5, 6, 7)
    // Years between 1982 and 1989
    const year = rng.range(1983, 1988);
    const month = rng.pick(MONTHS_SPANISH);
    const day = rng.range(3, 27);
    const nextDay = day + 1;

    // Time of day modes:
    // 0: Morning (08:10 - 09:40)
    // 1: Midday (12:30 - 14:15)
    // 2: Afternoon (16:05 - 17:40)
    // 3: Evening (19:30 - 21:10)
    // 4: Late Night / Cross-Midnight (23:30 - 00:50)
    // 5: Early Morning (02:10 - 03:35)
    const timeMode = rng.range(0, 5);
    let startMin = 0;
    let crossesMidnight = false;
    let periodName = '';

    if (timeMode === 0) {
      startMin = rng.range(8 * 60 + 10, 8 * 60 + 40); // 08:10 to 08:40
      periodName = 'Mañana';
    } else if (timeMode === 1) {
      startMin = rng.range(12 * 60 + 30, 13 * 60 + 10); // 12:30 to 13:10
      periodName = 'Mediodía';
    } else if (timeMode === 2) {
      startMin = rng.range(16 * 60 + 10, 16 * 60 + 45); // 16:10 to 16:45
      periodName = 'Tarde';
    } else if (timeMode === 3) {
      startMin = rng.range(19 * 60 + 20, 20 * 60 + 0); // 19:20 to 20:00
      periodName = 'Noche';
    } else if (timeMode === 4) {
      startMin = rng.range(23 * 60 + 25, 23 * 60 + 45); // 23:25 to 23:45
      crossesMidnight = true;
      periodName = 'Medianoche';
    } else {
      startMin = rng.range(2 * 60 + 5, 2 * 60 + 35); // 02:05 to 02:35
      periodName = 'Madrugada';
    }

    const tEntry = minutesToTimeString(startMin);
    const tActivity = minutesToTimeString(startMin + 12);
    const tIncidentStart = minutesToTimeString(startMin + 26);
    const tIncidentEnd = minutesToTimeString(startMin + 33);
    const tDiscovery = minutesToTimeString(startMin + 45);

    const baseDateStr = `${day} de ${month} de ${year}`;
    const nextDateStr = `${nextDay} de ${month} de ${year}`;
    const incidentDateStr = crossesMidnight ? `${day}–${nextDay} de ${month} de ${year}` : baseDateStr;

    // 3. Location and Rooms
    const venueDef = rng.pick(VENUES);
    const location = rng.pick(venueDef.locations);
    const subRooms = rng.shuffle(location.subRooms);
    const crimeSceneRoom = subRooms[0];
    const alibiRoom = subRooms[1];
    const secretRoom = subRooms.length > 2 ? subRooms[2] : subRooms[0];

    // 4. Suspect Identity & Claimed Identity (Requirement 11, 12, 13, 14, 15)
    const isFemale = rng.next() > 0.5;
    const firstName = isFemale ? rng.pick(NAMES_WOMEN) : rng.pick(NAMES_MEN);
    const surname1 = rng.pick(SURNAMES_POOL);
    let surname2 = rng.pick(SURNAMES_POOL);
    while (surname2 === surname1) {
      surname2 = rng.pick(SURNAMES_POOL);
    }
    const realFullName = `${firstName} ${surname1} ${surname2}`;
    const age = rng.range(32, 58);
    const birthYear = year - age;
    const birthMonth = rng.range(1, 12);
    const birthDay = rng.range(1, 28);
    const realBirthDate = `${birthDay.toString().padStart(2, '0')}/${birthMonth.toString().padStart(2, '0')}/${birthYear}`;
    const profession = rng.pick(PROFESSIONS);
    const address = `Calle de los Álamos, 24, 3º D`;

    // Fictional DNI
    const dniNumber = rng.range(12345678, 89456712);
    const dniLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'][rng.range(0, 20)];
    const realDni = `${dniNumber.toString().slice(0, 2)}.${dniNumber.toString().slice(2, 5)}.${dniNumber.toString().slice(5, 8)}-${dniLetter}`;

    // Discrepancy Generation (Intentional)
    // 0: Birth date record mismatch (administrative mistake)
    // 1: Surname variation (stepparent / alias)
    // 2: DNI expiration / number typo in register
    // 3: Address / profession update delay
    const discrepancyType = rng.range(0, 3);
    let claimedBirthDate = realBirthDate;
    let claimedFullName = realFullName;
    let claimedDni = realDni;
    let identityDiscrepancyInfo: SuspectIdentity['identityDiscrepancy'] | undefined = undefined;

    if (discrepancyType === 0) {
      const wrongMonth = birthMonth === 8 ? 6 : birthMonth + 1;
      const fileRecordDate = `${birthDay.toString().padStart(2, '0')}/${wrongMonth.toString().padStart(2, '0')}/${birthYear}`;
      identityDiscrepancyInfo = {
        field: 'FECHA DE NACIMIENTO',
        fileRecordValue: fileRecordDate,
        realValue: realBirthDate,
        suspectExplanation: `En el archivo del expediente policial figura por error administrativo el mes de ${MONTHS_SPANISH[wrongMonth - 1]}, pero tu partida oficial y tu nacimiento real son en ${MONTHS_SPANISH[birthMonth - 1]}. Nunca llegaste a subsanar el error registral en el padrón municipal.`,
      };
    } else if (discrepancyType === 1) {
      const altSurname = rng.pick(SURNAMES_POOL);
      const fileRecordName = `${firstName} ${surname1} ${altSurname}`;
      identityDiscrepancyInfo = {
        field: 'SEGUNDO APELLIDO / IDENTIFICACIÓN',
        fileRecordValue: fileRecordName,
        realValue: realFullName,
        suspectExplanation: `En algunos registros y reservas privadas utilizas a veces el apellido familiar de tu padrastro («${altSurname}») para preservar la privacidad de tus asuntos personales sin mala intención.`,
      };
    } else if (discrepancyType === 2) {
      const fileRecordDni = `${realDni.slice(0, -1)}K`;
      identityDiscrepancyInfo = {
        field: 'LETRA O NÚMERO DE DOCUMENTO',
        fileRecordValue: fileRecordDni,
        realValue: realDni,
        suspectExplanation: `El duplicado antiguo del documento provisional fue mecanografiado con una letra errónea en la delegación de policía, pero conservas el resguardo en trámite.`,
      };
    } else {
      identityDiscrepancyInfo = {
        field: 'DOMICILIO REGISTRADO',
        fileRecordValue: 'Avenida del Generalísimo, 12',
        realValue: address,
        suspectExplanation: `En el censo antiguo aún figura el domicilio de tus padres donde residías hace dos años, ya que no tramitaste el traslado en la junta municipal de distrito.`,
      };
    }

    const suspectIdentity: SuspectIdentity = {
      fullName: realFullName,
      claimedFullName,
      birthDate: realBirthDate,
      claimedBirthDate,
      age,
      dni: realDni,
      claimedDni,
      profession,
      addressOrCity: address,
      relationshipToCase: `Presente ${location.prepEn} durante la franja crítica de los hechos investigados.`,
      relationshipToVenue: `Visitante acreditado y conocido por los empleados del centro.`,
      identityDiscrepancy: identityDiscrepancyInfo,
    };

    // 5. Guilt State
    const isGuilty = forceGuilty !== undefined ? forceGuilty : rng.next() >= 0.5;

    // 6. Persons of interest
    const complainantName = rng.pick(WITNESS_NAMES);
    let witness1 = rng.pick(WITNESS_NAMES);
    while (witness1 === complainantName) witness1 = rng.pick(WITNESS_NAMES);
    let witness2 = rng.pick(WITNESS_NAMES);
    while (witness2 === complainantName || witness2 === witness1) witness2 = rng.pick(WITNESS_NAMES);

    // 7. Case Story Archetype Customization
    let caseTitle = '';
    let incidentTypeLabel = '';
    let incidentSummary = '';
    let targetNature = '';
    let complainantRole = '';
    let publicAlibi = '';
    let narrativeTone = '';
    let secretTitle = '';
    let secretDetail = '';
    let secretWhyHidden = '';
    let guiltyMotive = '';
    let perpetratorName = isGuilty ? realFullName : complainantName;

    // Timeline arrays
    const actualTimeline: { time: string; dateStr: string; location: string; action: string }[] = [];
    const masterTimeline: { time: string; dateStr: string; actor: string; action: string; significance: string }[] = [];
    const suspiciousFacts: { fact: string; whySuspicious: string; explanation: string }[] = [];

    // Distinct Archetypes
    if (archetype === 'THEFT') {
      incidentTypeLabel = 'ROBO DE PATRIMONIO';
      caseTitle = `La sustracción de piezas de plata ${location.prepEn}`;
      targetNature = 'Juego de candelabros y sellos de orfebrería del siglo XVIII';
      complainantRole = 'Encargado general de custodia';
      narrativeTone = 'Visita programada de catalogación';
      publicAlibi = `Llegué ${location.prepA} a las ${tEntry} con la intención de revisar unas notas de trabajo. Me senté ${alibiRoom.prepEn}, donde permanecí toda la franja horaria sin ausentarme hasta que dieron la alarma a las ${tDiscovery}.`;

      secretTitle = 'Sustracción de cartas confidenciales ajenas';
      secretDetail = `Te ausentaste 10 minutos hacia ${secretRoom.prepEn} para recuperar unas cartas personales comprometedoras antes de que fueran leídas por terceros.`;
      secretWhyHidden = 'Reconocer que forzaste un cajón ajeno para recuperar correspondencia comprometedora te costaría el divorcio y tu prestigio social, aunque jamás tocaste los candelabros robados.';

      guiltyMotive = 'Urgente necesidad de cancelar una fianza bancaria antes del fin de semana.';
    } else if (archetype === 'MURDER') {
      incidentTypeLabel = 'HOMICIDIO';
      caseTitle = `El fallecimiento no accidental de Don Julián ${location.prepEn}`;
      targetNature = 'Informe forense preliminar: intoxicación aguda en café';
      complainantRole = 'Inspector de la Brigada Judicial';
      narrativeTone = 'Cita para una entrevista profesional';
      publicAlibi = `Entré ${location.prepA} sobre las ${tEntry}. Estuve esperando a un conocido ${alibiRoom.prepEn} leyendo la prensa. Jamás me acerqué ${crimeSceneRoom.prepA} ni crucé palabra con el fallecido en esa franja.`;

      secretTitle = 'Reunión clandestina con una persona casada';
      secretDetail = `A las ${tIncidentStart} fuiste discretamente hacia ${secretRoom.prepEn} para mantener un encuentro sentimental clandestino con alguien que te pidió discreción absoluta.`;
      secretWhyHidden = 'Si esa relación clandestina trasciende públicamente, supondrá la ruina de dos familias y un escándalo laboral irremediable.';

      guiltyMotive = 'La víctima tenía en su poder documentación que iba a implicarle en un desfalco irreversible.';
    } else if (archetype === 'KIDNAPPING_DISAPPEARANCE') {
      incidentTypeLabel = 'DESAPARICIÓN FORZOSA';
      caseTitle = `La desaparición de Doña Valeria ${location.prepEn}`;
      targetNature = 'Bolso abandonado con billetes de tren y efectos personales';
      complainantRole = 'Familiar de la persona desaparecida';
      narrativeTone = 'Diligencias personales de viaje';
      publicAlibi = `Llegué ${location.prepA} aproximadamente a las ${tEntry}. Permanecí ${alibiRoom.prepEn} revisando unos papeles hasta que la policía comenzó a acordonar los accesos pasadas las ${tDiscovery}.`;

      secretTitle = 'Entrega de sobre de dinero a un prestamista';
      secretDetail = `Te retiraste hacia ${secretRoom.prepEn} para entregar a escondidas un sobre con dinero en efectivo a un prestamista que te esperaba en la puerta trasera.`;
      secretWhyHidden = 'Nadie en tu círculo sabe que estabas siendo acosado por deudas privadas y temes que esa necesidad de dinero te convierta en el chivo expiatorio de la desaparición.';

      guiltyMotive = 'Planificó facilitar la salida forzosa de la víctima para cobrar una comisión acordada.';
    } else if (archetype === 'IDENTITY_IMPERSONATION') {
      incidentTypeLabel = 'SUPLANTACIÓN DE IDENTIDAD';
      caseTitle = `La falsa acreditación oficial ${location.prepEn}`;
      targetNature = 'Credencial consular sellada con firma manipulada';
      complainantRole = 'Oficial mayor de protocolo';
      narrativeTone = 'Trámite de visado y acreditación';
      publicAlibi = `Acudí ${location.prepA} a las ${tEntry} para realizar una consulta rutinaria de ventanilla. Estuve sentado ${alibiRoom.prepEn} aguardando mi turno sin moverme de la sala hasta el aviso de control a las ${tDiscovery}.`;

      secretTitle = 'Uso de un alias para eludir una sanción fiscal';
      secretDetail = `Utilizaste un nombre familiar alternativo para registrarte temporalmente y no levantar sospechas sobre una inspección tributaria en curso.`;
      secretWhyHidden = 'Si la policía investiga el alias, descubrirán tu litigio tributario pendiente, aunque no tuviste nada que ver con la credencial consular falsificada.';

      guiltyMotive = 'Sustituir la identidad del titular original para acceder a cuentas bancarias restringidas.';
    } else if (archetype === 'SABOTAGE') {
      incidentTypeLabel = 'SABOTAJE TÉCNICO';
      caseTitle = `La desconexión del generador auxiliar ${location.prepEn}`;
      targetNature = 'Cables de alimentación principal seccionados deliberadamente';
      complainantRole = 'Jefe de mantenimiento industrial';
      narrativeTone = 'Inspección de servicio técnico';
      publicAlibi = `Me personé ${location.prepA} a las ${tEntry}. Estuve revisando unos manuales ${alibiRoom.prepEn} sin aproximarme al cuadro eléctrico hasta el corte de suministro sobre las ${tDiscovery}.`;

      secretTitle = 'Retirada de una herramienta propia olvidada';
      secretDetail = `Te desplazaste a toda prisa hacia ${secretRoom.prepEn} para recoger una herramienta que habías dejado allí indebidamente el día anterior.`;
      secretWhyHidden = 'Admitir que entraste sin autorización a esa sala técnica te acarrearía una sanción laboral y la expulsión del gremio profesional.';

      guiltyMotive = 'Inutilizar el sistema para obligar a contratar los servicios de urgencia de su propia empresa asociada.';
    } else if (archetype === 'FRAUD_FORGERY') {
      incidentTypeLabel = 'FALSIFICACIÓN DOCUMENTAL';
      caseTitle = `La alteración del libro de actas societarias ${location.prepEn}`;
      targetNature = 'Páginas sustituidas con sellos y rúbricas calcadas';
      complainantRole = 'Secretario del Consejo de Administración';
      narrativeTone = 'Revisión contable y auditoría';
      publicAlibi = `Llegué ${location.prepA} a las ${tEntry}. Me instalé ${alibiRoom.prepEn} trabajando con mis propios cuadernos de apuntes. En ningún momento tuve acceso a los libros oficiales guardados bajo llave.`;

      secretTitle = 'Destrucción de un borrador de auditoría propio';
      secretDetail = `Aprovechaste para ir hacia ${secretRoom.prepEn} y quemar en una papelera un borrador con cálculos erróneos que te habrían costado el puesto de trabajo.`;
      secretWhyHidden = 'Confesar la destrucción de un borrador interno admitiría negligencia profesional grave, aunque la alteración del libro oficial la cometió otra persona.';

      guiltyMotive = 'Desviar una partida presupuestaria millonaria mediante actas adulteradas.';
    } else {
      // ESPIONAGE_LEAK
      incidentTypeLabel = 'FILTRACIÓN DE SECRETOS INDUSTRIALES';
      caseTitle = `La copia de planos confidenciales ${location.prepEn}`;
      targetNature = 'Carpeta de calcos técnicos fotocopiados ilegalmente';
      complainantRole = 'Director de desarrollo tecnológico';
      narrativeTone = 'Consulta técnica de patentes';
      publicAlibi = `Entré ${location.prepA} sobre las ${tEntry}. Estuve consultando índices generales ${alibiRoom.prepEn} sin pisar el archivo restringido en toda la tarde.`;

      secretTitle = 'Fotocopiar una novela inédita para un certamen';
      secretDetail = `Fuiste a escondidas hacia ${secretRoom.prepEn} para utilizar la fotocopiadora de la empresa para un manuscrito literario personal con el que concursabas.`;
      secretWhyHidden = 'Usar los medios de la empresa para fines particulares te costaría una sanción disciplinaria, aunque los planos de patentes nunca te interesaron.';

      guiltyMotive = 'Tenía apalabrada la venta de los planos a una firma competidora extranjera.';
    }

    incidentSummary = `En fecha ${incidentDateStr}, durante la franja de ${periodName.toLowerCase()} ${location.prepEn}, se constató un suceso de gravedad: «${targetNature}» en ${crimeSceneRoom.name}. La persona sospechosa, retenida para interrogatorio, alega haber estado tranquilamente ${alibiRoom.prepEn}.`;

    // Timeline construction
    actualTimeline.push(
      { time: tEntry, dateStr: baseDateStr, location: location.name, action: `Llegada a las instalaciones ${location.prepDe}.` },
      { time: tActivity, dateStr: baseDateStr, location: alibiRoom.name, action: `Presencia visible inicial ${alibiRoom.prepEn}.` },
      {
        time: tIncidentStart,
        dateStr: crossesMidnight ? nextDateStr : baseDateStr,
        location: isGuilty ? crimeSceneRoom.name : secretRoom.name,
        action: isGuilty
          ? `Acceso directo e ilegítimo a ${crimeSceneRoom.name} para perpetrar el acto investigado.`
          : `Desplazamiento sigiloso hacia ${secretRoom.name} para atender su secreto personal.`,
      },
      {
        time: tDiscovery,
        dateStr: crossesMidnight ? nextDateStr : baseDateStr,
        location: alibiRoom.name,
        action: `Regreso a ${alibiRoom.name} antes de que se desatara el dispositivo de control.`,
      }
    );

    masterTimeline.push(
      { time: tEntry, dateStr: baseDateStr, actor: realFullName, action: `Accede ${location.prepA} según el control de entrada.`, significance: 'Hora de llegada confirmada.' },
      { time: tActivity, dateStr: baseDateStr, actor: witness1, action: `Atestigua ver al sospechoso ${alibiRoom.prepEn}.`, significance: 'Coartada inicial verídica.' },
      {
        time: tIncidentStart,
        dateStr: crossesMidnight ? nextDateStr : baseDateStr,
        actor: isGuilty ? realFullName : perpetratorName,
        action: `Se consuma la acción sobre «${targetNature}» en ${crimeSceneRoom.name}.`,
        significance: isGuilty ? 'El sospechoso es el autor material.' : 'El verdadero culpable actuó mientras el sospechoso estaba en otra parte.',
      },
      {
        time: tIncidentEnd,
        dateStr: crossesMidnight ? nextDateStr : baseDateStr,
        actor: isGuilty ? realFullName : witness2,
        action: `Ruido o movimiento registrado en las proximidades de ${crimeSceneRoom.name}.`,
        significance: 'Punto de inflexión temporal que refuta la versión de inmovilidad total.',
      },
      { time: tDiscovery, dateStr: crossesMidnight ? nextDateStr : baseDateStr, actor: complainantName, action: `Descubrimiento oficial de los hechos y cierre de puertas.`, significance: 'Inicio de la investigación policial.' }
    );

    // Suspicious facts with explanations (Requirement 15, 16)
    suspiciousFacts.push({
      fact: `Ausencia de tu asiento ${alibiRoom.prepEn} entre las ${tIncidentStart} y las ${tIncidentEnd}.`,
      whySuspicious: 'El detective pensará que estuviste en la escena del crimen durante ese lapso crítico.',
      explanation: isGuilty
        ? 'Efectivamente te desplazaste para cometer el delito planificado.'
        : `Abandonaste tu sitio para dirigirte a ${secretRoom.name} a resolver tu asunto confidencial («${secretTitle}»).`,
    });

    if (identityDiscrepancyInfo) {
      suspiciousFacts.push({
        fact: `Discrepancia en ${identityDiscrepancyInfo.field}: el expediente indica «${identityDiscrepancyInfo.fileRecordValue}» y tu dato real es «${identityDiscrepancyInfo.realValue}».`,
        whySuspicious: 'El detective sospechará que estás mintiendo sobre tu identidad o que utilizas documentación falsificada.',
        explanation: identityDiscrepancyInfo.suspectExplanation,
      });
    }

    // 8. EVIDENCE GENERATION (Requirement 29 to 36)
    // Diverse types matching the archetype!
    const evidenceList: EvidenceCard[] = [];

    // Helper to calculate progressive seconds
    const intervalSec = Math.floor((durationMinutes * 60) / 5);

    // Card 1: Initial report (0 seconds)
    const initialCardType: EvidenceType = archetype === 'IDENTITY_IMPERSONATION' || archetype === 'FRAUD_FORGERY' ? 'ID_CARD' : 'REPORT';
    const initialVisual: EvidenceVisualCategory = initialCardType === 'ID_CARD' ? 'ID_CARD' : 'OFFICIAL_REPORT';
    evidenceList.push({
      id: 'EV-01',
      title: initialCardType === 'ID_CARD' ? `Copia de la ficha de identificación oficial` : `Atestado preliminar de la guardia`,
      type: initialCardType,
      visualCategory: initialVisual,
      timestamp: tEntry,
      dateStr: baseDateStr,
      location: location.name,
      source: 'Archivo de Guardia',
      summary: `Registro de entrada de ${realFullName} (${profession}). Consta su presencia acreditada ${location.prepEn}.`,
      details: `Expediente de registro de ${baseDateStr}.\nIdentificación de la persona retenida: ${claimedFullName}.\nDNI registrado: ${claimedDni}.\nProfesión declarada: ${profession}.\nDomicilio acreditado: ${address}.\nObservaciones: El compareciente accede a las dependencias portando una cartera de mano.`,
      revealedAtSeconds: 0,
    });

    // Card 2: Receipt / Ticket / Schedule (scheduled at ~20% time)
    const card2Type: EvidenceType = rng.pick(['TICKET', 'RECEIPT']);
    const card2Visual: EvidenceVisualCategory = card2Type === 'TICKET' ? 'TICKET' : 'RECEIPT';
    const ticketTime = minutesToTimeString(startMin - 20);
    evidenceList.push({
      id: 'EV-02',
      title: card2Type === 'TICKET' ? `Billete de transporte sellado` : `Comprobante de consumición timbrado`,
      type: card2Type,
      visualCategory: card2Visual,
      timestamp: ticketTime,
      dateStr: baseDateStr,
      location: `Taquilla / Establecimiento cercano`,
      source: 'Efectos personales del sospechoso',
      summary: `Justificante sellado a las ${ticketTime} en el que figura la fecha ${baseDateStr}.`,
      details: `SERIE 1984 - TICKET NUM: ${rng.range(1000, 9999)}\nFECHA DE EMISIÓN: ${baseDateStr}\nHORA EXACTA: ${ticketTime}\nIMPORTE: 140 PESETAS\nCONCEPTO: SERVICIO ORDINARIO VALIDADOR AUTOMÁTICO.\nCorrobora la llegada del sospechoso a las inmediaciones poco antes de las ${tEntry}.`,
      revealedAtSeconds: Math.floor(intervalSec * 0.9),
    });

    // Card 3: Witness Statement or Handwritten Note (~45% time)
    const card3Type: EvidenceType = rng.pick(['LETTER', 'REPORT']);
    const card3Visual: EvidenceVisualCategory = card3Type === 'LETTER' ? 'HANDWRITTEN' : 'OFFICIAL_REPORT';
    evidenceList.push({
      id: 'EV-03',
      title: card3Type === 'LETTER' ? `Manuscrito hallado en la papelera` : `Testimonio jurado de ${witness1}`,
      type: card3Type,
      visualCategory: card3Visual,
      timestamp: tActivity,
      dateStr: baseDateStr,
      location: alibiRoom.name,
      source: card3Type === 'LETTER' ? `Inspección de ${alibiRoom.name}` : `Declaración voluntaria testifical`,
      summary: card3Type === 'LETTER'
        ? `Nota manuscrita con anotaciones fechadas el ${baseDateStr} que aluden a un compromiso pendiente.`
        : `${witness1} declara haber visto al sospechoso en ${alibiRoom.name}, pero advierte que no estuvo allí todo el tiempo.`,
      details: card3Type === 'LETTER'
        ? `Transcripción del manuscrito:\n«No olvides resolver el asunto de la correspondencia hoy mismo. Si no lo haces antes de que acabe el día, las consecuencias serán públicas. Recuerda comprobar la fecha: ${baseDateStr}».`
        : `Declaración jurada prestada por ${witness1}:\n«Estuve atendiendo mis tareas en ${alibiRoom.name}. Recuerdo al sospechoso llegar a las ${tEntry}. Sin embargo, sobre las ${tIncidentStart} noté que su mesa estaba completamente vacía. No regresó hasta pasadas las ${tDiscovery}».`,
      revealedAtSeconds: Math.floor(intervalSec * 1.8),
    });

    // Card 4: Photograph or Log (Decisive / Incriminating or Exculpatory clue!) (~70% time)
    const card4Type: EvidenceType = rng.pick(['PHOTO', 'LOG', 'PHONE']);
    const card4Visual: EvidenceVisualCategory = card4Type === 'PHOTO' ? 'PHOTO' : card4Type === 'LOG' ? 'LOG' : 'OFFICIAL_REPORT';
    evidenceList.push({
      id: 'EV-04',
      title: card4Type === 'PHOTO'
        ? `Fotografía de peritaje ocular`
        : card4Type === 'LOG'
        ? `Hoja de firmas de acceso a planta`
        : `Registro de llamadas de centralita`,
      type: card4Type,
      visualCategory: card4Visual,
      timestamp: tIncidentStart,
      dateStr: crossesMidnight ? nextDateStr : baseDateStr,
      location: isGuilty ? crimeSceneRoom.name : secretRoom.name,
      source: 'Equipo de inspección técnica',
      summary: isGuilty
        ? `Prueba determinante: Sitúa indicios concluyentes del sospechoso en ${crimeSceneRoom.name} durante las ${tIncidentStart}.`
        : `Prueba determinante: Demuestra que a las ${tIncidentStart} el acceso a ${crimeSceneRoom.name} fue forzado por una persona de distinta estatura o complexión, o sitúa al sospechoso en ${secretRoom.name}.`,
      details: isGuilty
        ? `INFORME PERICIAL:\nEn el pomo interior de ${crimeSceneRoom.name} y en el suelo adyacente se localizaron fibras textiles idénticas a las del abrigo del sospechoso, confirmando su presencia física activa entre las ${tIncidentStart} y las ${tIncidentEnd}.`
        : `INFORME PERICIAL:\nEl registro técnico confirma que la puerta de ${crimeSceneRoom.name} fue manipulada a las ${tIncidentStart} por alguien con llave maestra del centro, mientras que un empleado del servicio de limpieza atestigua haber escuchado pasos apresurados en dirección a ${secretRoom.name}, no hacia el lugar del crimen.`,
      revealedAtSeconds: Math.floor(intervalSec * 2.8),
    });

    // Card 5: Inventory, Map, or Identity Document (~85% time)
    const card5Type: EvidenceType = rng.pick(['MAP', 'INVENTORY', 'ID_CARD']);
    const card5Visual: EvidenceVisualCategory = card5Type === 'MAP' ? 'MAP' : card5Type === 'INVENTORY' ? 'OFFICIAL_REPORT' : 'ID_CARD';
    evidenceList.push({
      id: 'EV-05',
      title: card5Type === 'MAP'
        ? `Plano de distribución de dependencias`
        : card5Type === 'INVENTORY'
        ? `Hoja de inventario oficial cotejada`
        : `Ficha censal de cotejo de identidad`,
      type: card5Type,
      visualCategory: card5Visual,
      timestamp: tIncidentEnd,
      dateStr: crossesMidnight ? nextDateStr : baseDateStr,
      location: location.name,
      source: 'Archivo técnico de la comisaría',
      summary: identityDiscrepancyInfo
        ? `Contraste documental sobre ${identityDiscrepancyInfo.field}: figura el dato «${identityDiscrepancyInfo.fileRecordValue}».`
        : `Esquema de distancias que demuestra los tiempos exactos de desplazamiento entre ${alibiRoom.name} y ${crimeSceneRoom.name}.`,
      details: identityDiscrepancyInfo
        ? `COTEJO DE EXPEDIENTE:\nSe ha solicitado confirmación telex a la central sobre los datos de ${realFullName}.\nConsta registrada la siguiente anotación oficial: «${identityDiscrepancyInfo.field}: ${identityDiscrepancyInfo.fileRecordValue}».\nCualquier diferencia con la declaración verbal debe ser aclarada durante el interrogatorio.`
        : `ESTUDIO TOPOGRÁFICO:\nEl trayecto entre ${alibiRoom.name} y ${crimeSceneRoom.name} requiere exactamente 2 minutos de marcha a paso moderado. El lapso de 15 minutos en el que el sospechoso estuvo ausente permitía holgadamente el desplazamiento de ida y vuelta.`,
      revealedAtSeconds: Math.floor(intervalSec * 3.7),
    });

    // 9. Case Dossier Assembly
    const caseId = `EXP-${year}-${rng.range(100, 999)}`;
    const caseDossier: CaseDossier = {
      caseId,
      title: caseTitle,
      archetype,
      incidentType: incidentTypeLabel,
      locationCategory: venueDef.category,
      locationName: location.name,
      locationPreposition: location.prepEn,
      dateStr: incidentDateStr,
      incidentEstimatedWindow: `Entre las ${tIncidentStart} y las ${tIncidentEnd}`,
      incidentSummary,
      targetObjectOrNature: targetNature,
      complainantName,
      complainantRole,
      suspectKnownIdentity: {
        name: claimedFullName,
        profession,
        birthDate: claimedBirthDate,
        dni: claimedDni,
        address,
        knownRelation: `Persona retenida en las dependencias para interrogatorio urgente.`,
      },
      suspectPublicName: realFullName,
      suspectPublicRole: `Sospechoso bajo custodia provisional`,
      personsOfInterest: [
        {
          name: realFullName,
          role: 'Sospechoso interrogado',
          description: `Afirma haber permanecido ${alibiRoom.prepEn} durante toda la franja y niega haber pisado ${crimeSceneRoom.name}.`,
        },
        {
          name: complainantName,
          role: complainantRole,
          description: `Descubrió la alteración o suceso a las ${tDiscovery} y solicitó la intervención inmediata de la autoridad.`,
        },
        {
          name: witness1,
          role: 'Testigo presencial',
          description: `Presente en las proximidades de ${alibiRoom.name} durante las horas previas y posteriores.`,
        },
        {
          name: witness2,
          role: 'Personal de servicio de turno',
          description: `Atestigua sobre los movimientos por los pasillos y el estado de los accesos.`,
        },
      ],
      initialBriefingNotes: [
        `Hechos acaecidos ${location.prepEn} en fecha ${incidentDateStr}.`,
        `Ventana crítica de los hechos: de ${tIncidentStart} a ${tIncidentEnd} (horario de ${periodName.toLowerCase()}).`,
        `El sospechoso insiste en que no se levantó de su mesa ${alibiRoom.prepEn}.`,
        `Todas las salidas exteriores estaban cerradas o bajo vigilancia en ese intervalo.`,
      ],
    };

    // 10. Suspect Dossier Assembly
    const suspectDossier: SuspectDossier = {
      identity: suspectIdentity,
      publicAlibi,
      narrativeTone,
      actualTimeline,
      venueFacts: [
        `Conoces bien la distribución ${location.prepDe}, especialmente ${alibiRoom.name} y ${secretRoom.name}.`,
        `Sabes que entre ${alibiRoom.name} y ${crimeSceneRoom.name} se tarda apenas dos minutos cruzando el pasillo principal.`,
        `Para llegar a ${secretRoom.name} no hace falta pasar delante de la puerta de ${crimeSceneRoom.name}.`,
      ],
      secret: {
        title: secretTitle,
        detail: secretDetail,
        whyHidden: secretWhyHidden,
      },
      suspiciousFactsWithExplanations: suspiciousFacts,
      undeniableFacts: [
        `Llegaste ${location.prepA} a las ${tEntry} (quedó registrado por la vigilancia).`,
        `Te levantaste de ${alibiRoom.name} sobre las ${tIncidentStart} y volviste después de las ${tIncidentEnd}. No puedes afirmar que estuviste sentado todo el tiempo.`,
        `Llevabas contigo tu cartera personal con documentación y justificantes de gastos.`,
      ],
    };

    // 11. Final Truth Reveal Assembly
    const clueExplanations = [
      {
        clueTitle: evidenceList[1].title,
        explanation: `Confirma que el sospechoso se encontraba en la zona a la hora indicada (${ticketTime}), validando su hora de entrada a las ${tEntry}.`,
        indicatesGuilt: false,
      },
      {
        clueTitle: evidenceList[2].title,
        explanation: isGuilty
          ? `Evidencia que el sospechoso mintió al afirmar que no se movió de su asiento durante la franja crítica.`
          : `Demuestra que el sospechoso se ausentó para acudir a su cita secreta, pero no que cometiera el delito.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: evidenceList[3].title,
        explanation: isGuilty
          ? `Prueba decisiva: Sitúa irrefutablemente al sospechoso en la escena (${crimeSceneRoom.name}) cometiendo el acto investigado.`
          : `Prueba decisiva: Demuestra que el acto fue perpetrado por otra persona mientras el sospechoso atendía su asunto confidencial.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: evidenceList[4].title,
        explanation: identityDiscrepancyInfo
          ? `Aclara la discrepancia en ${identityDiscrepancyInfo.field}: ${identityDiscrepancyInfo.suspectExplanation}`
          : `Demuestra que el itinerario horario del sospechoso era compatible con la inocencia respecto al crimen principal.`,
        indicatesGuilt: false,
      },
    ];

    const finalTruthReveal: FinalTruthReveal = {
      suspectIsGuilty: isGuilty,
      incidentType: incidentTypeLabel,
      perpetratorName: isGuilty ? realFullName : perpetratorName,
      perpetratorMotive: isGuilty ? guiltyMotive : `El perpetrador real actuó por motivos propios aprovechando la confusión del momento.`,
      actualIncidentSummary: isGuilty
        ? `El sospechoso ${realFullName} era CULPABLE. Aprovechó el intervalo de ${tIncidentStart} a ${tIncidentEnd} para acceder a ${crimeSceneRoom.name} y consumar el acto investigado, regresando luego a ${alibiRoom.name} para fingir una coartada.`
        : `El sospechoso ${realFullName} era INOCENTE del crimen principal. Aunque mintió en su coartada oficial para encubrir su secreto privado («${secretTitle}» en ${secretRoom.name}), el verdadero autor de los hechos fue otra persona que actuó en ${crimeSceneRoom.name}.`,
      fullMasterTimeline: masterTimeline,
      clueExplanations,
      suspectSecretReveal: `EL SECRETO: ${secretTitle}.\n\nQUÉ OCURRIÓ REALMENTE:\n${secretDetail}\n\nPOR QUÉ LO OCULTÓ:\n${secretWhyHidden}`,
      conclusionMessage: isGuilty
        ? `El sospechoso mintió deliberadamente para enmascarar su culpabilidad en el incidente.`
        : `El sospechoso ocultó la verdad por miedo al escándalo personal, pero no cometió el crimen investigado.`,
    };

    const candidate: GeneratedCaseInternal = {
      caseId,
      suspectIsGuilty: isGuilty,
      caseDossier,
      suspectDossier,
      allEvidence: evidenceList,
      finalTruthReveal,
    };

    const validation = validateGeneratedCase(candidate);
    if (validation.valid) {
      return candidate;
    }
  }

  // Fallback safe deterministic generation
  return generateProceduralCase(durationMinutes, forceGuilty, 42);
}
