import {
  CaseDossier,
  SuspectDossier,
  EvidenceCard,
  ReconstructionQuestion,
  FinalTruthReveal,
  CoartadaDurationMinutes,
} from '../../types/coartada';
import { GeneratedCaseInternal, validateGeneratedCase } from './caseValidator';

// Mulberry32 PRNG for deterministic, non-biased procedural case generation
class Mulberry32 {
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

interface VenueTemplate {
  category: string;
  names: string[];
  crimeRooms: string[];
  alibiLocations: string[];
  secretLocations: string[];
  objects: { name: string; description: string; complainantRole: string }[];
  staffRoles: string[];
  witnessNames: string[];
}

const VENUES: VenueTemplate[] = [
  {
    category: 'HOTEL',
    names: ['Gran Hotel Mirador', 'Hotel Astoria Palace', 'Hospedería del Sol', 'Hotel Bahía Real'],
    crimeRooms: ['Suite Presidencial 402', 'Habitación 312', 'Despacho de Dirección', 'Caja Fuerte de Recepción'],
    alibiLocations: ['Bar del Vestíbulo', 'Salón de Fumadores', 'Terraza Acristalada', 'Cafetería Central'],
    secretLocations: ['Habitación 205 (habitación contigua)', 'Cuarto de Calderas', 'Escalera de Servicio Este', 'Pasadizo de Mantenimiento'],
    objects: [
      { name: 'Reloj de oro Patek Philippe de 1954', description: 'Pieza de coleccionista con grabado en la tapa trasera', complainantRole: 'Huésped distinguido' },
      { name: 'Collar de esmeraldas colombianas', description: 'Joya familiar valorada en miles de pesetas', complainantRole: 'Diplomática extranjera' },
      { name: 'Maletín con pagarés al portador', description: 'Documentos bancarios de alto valor comercial', complainantRole: 'Empresario industrial' },
    ],
    staffRoles: ['Recepcionista de noche', 'Camarero del bar', 'Gobernanta de planta', 'Conserje jefe'],
    witnessNames: ['Clara Vidal', 'Mateo Rivas', 'Gonzalo Peinado', 'Dolores Sáenz'],
  },
  {
    category: 'MUSEO',
    names: ['Museo de Bellas Artes Provincial', 'Museo Arqueológico San Telmo', 'Instituto de Arte Moderno Dalmau'],
    crimeRooms: ['Sala de Escultura Clásica', 'Bóveda de Restauración', 'Gabinete Numismático', 'Vitrina Central de Orfebrería'],
    alibiLocations: ['Biblioteca de Investigación', 'Cafetería del Claustro', 'Banco del Jardín Interior', 'Patio de Esculturas'],
    secretLocations: ['Archivo de Adquisiciones no catalogadas', 'Taller de Restauración B', 'Sótano de Fondos Reservados'],
    objects: [
      { name: 'Daga ceremonial ibera de plata', description: 'Pieza del siglo III a.C. expuesta bajo vitrina blindada', complainantRole: 'Conservador jefe del museo' },
      { name: 'Óleo sobre tabla de escuela flamenca', description: 'Pintura de pequeño formato sustraída de su marco original', complainantRole: 'Director de adquisiciones' },
      { name: 'Códice iluminado del siglo XIV', description: 'Manuscrito litúrgico con miniaturas en pan de oro', complainantRole: 'Archivera municipal' },
    ],
    staffRoles: ['Vigilante nocturno', 'Técnica de conservación', 'Guía de sala', 'Responsable de seguridad'],
    witnessNames: ['Silvia Peralta', 'Esteban Lozano', 'Beatriz Mendieta', 'Tomás Aguilar'],
  },
  {
    category: 'MANSIÓN',
    names: ['Finca El Castañar', 'Mansión de los Marqueses de Valdepeñas', 'Villa Carmen en la Colina'],
    crimeRooms: ['Estudio Biblioteca', 'Bodega Acorazada', 'Tocador de la Señora', 'Invernadero Principal'],
    alibiLocations: ['Salón de Billar', 'Galería de Retratos', 'Terraza de los Cipreses', 'Pabellón de Invitados'],
    secretLocations: ['Pabellón del Guardés', 'Desván de Antigüedades', 'Cochera de Carruajes Antiguos'],
    objects: [
      { name: 'Testamento ológrafo original', description: 'Pliego notarial firmado con cláusulas hereditarias decisivas', complainantRole: 'Albacea testamentario' },
      { name: 'Juego de cubertería de plata maciza con escudo', description: 'Herencia de cuatro generaciones guardada bajo llave', complainantRole: 'Ama de llaves' },
      { name: 'Pintura al óleo de antepasados familiares', description: 'Retrato de gran valor sentimental y patrimonial', complainantRole: 'Heredero principal' },
    ],
    staffRoles: ['Mayordomo de la casa', 'Chófer particular', 'Cocinera principal', 'Jardinero mayor'],
    witnessNames: ['Eusebio Carranza', 'Mercedes Ocaña', 'Fausto Barreda', 'Adelaida Cruz'],
  },
  {
    category: 'TREN',
    names: ['Expreso Nocturno Cantábrico', 'Vagón Pullman Madrid-París', 'Línea Transatlántica del Norte'],
    crimeRooms: ['Compartimento Privado A-4', 'Vagón Furgón de Equipajes', 'Cabina del Revisor', 'Vagón de Correos'],
    alibiLocations: ['Coche Restaurante', 'Pasillo del Vagón B', 'Plataforma de Fumadores', 'Coche Bar'],
    secretLocations: ['Cabina de servicio entre vagones', 'Compartimento vacío C-12', 'Aseos de segunda clase'],
    objects: [
      { name: 'Sello postal "Error de color de 1851"', description: 'Rareza filatélica custodiada en sobre de cuero', complainantRole: 'Coleccionista belga' },
      { name: 'Planos de la nueva línea férrea de alta presión', description: 'Documentos técnicos de ingeniería confidenciales', complainantRole: 'Ingeniero de obras públicas' },
      { name: 'Bolsa de terciopelo con diamantes tallados', description: 'Gemas destinadas a un joyero de San Sebastián', complainantRole: 'Comerciante de piedras preciosas' },
    ],
    staffRoles: ['Revisor principal', 'Camarero del coche restaurante', 'Mecánico de tracción', 'Auxiliar de literas'],
    witnessNames: ['Leopoldo Santos', 'Rosalía Gil', 'Amador Navarrete', 'Inés Alarcón'],
  },
  {
    category: 'OFICINAS',
    names: ['Edificio Corporativo Nexus', 'Bufete Jurídico Morales & Asociados', 'Sede Central de Exportaciones Iberia'],
    crimeRooms: ['Despacho del Socio Principal', 'Sala de Juntas B', 'Archivo Central de Auditoría', 'Despacho de Contabilidad'],
    alibiLocations: ['Office de Café', 'Sala de Espera de Clientes', 'Pasillo de Ascensores', 'Planta Baja / Recepción'],
    secretLocations: ['Cuarto de Fotocopiadoras y Servidores', 'Archivo Pasivo del Sótano', 'Escalera de Incendios Posterior'],
    objects: [
      { name: 'Copia del borrador de fusión empresarial', description: 'Contrato confidencial con cotizaciones y acuerdos', complainantRole: 'Socio director' },
      { name: 'Libro de contabilidad B en soporte magnético', description: 'Cinta con registros de transacciones no declaradas', complainantRole: 'Auditor externo' },
      { name: 'Firma electrónica y sello notarial corporativo', description: 'Dispositivo físico imprescindible para autorizar pagos', complainantRole: 'Directora financiera' },
    ],
    staffRoles: ['Vigilante de control de accesos', 'Jefe de mantenimiento', 'Limpiador de turno nocturno', 'Recepcionista ejecutiva'],
    witnessNames: ['Óscar Valverde', 'Sonia Quintero', 'Marcos Beltrán', 'Pilar Santamaría'],
  },
  {
    category: 'TEATRO',
    names: ['Gran Teatro Lírico', 'Teatro de la Comedia', 'Teatro Principal de la Ópera'],
    crimeRooms: ['Camerino Principal de la Primera Dama', 'Foso de la Orquesta', 'Oficina de Taquilla Central', 'Cabina de Iluminación'],
    alibiLocations: ['Cantina de Artistas', 'Patio de Butacas', 'Foyer Principal', 'Taller de Sastrería'],
    secretLocations: ['Telar superior sobre el escenario', 'Túnel de utilería bajo el tablado', 'Pasillo de tramoya este'],
    objects: [
      { name: 'Diadema de brillantes de la protagonista', description: 'Joya prestada por una joyería parisina para el estreno', complainantRole: 'Diva soprano principal' },
      { name: 'Partitura manuscrita autógrafa del maestro', description: 'Composición inédita anotada a pluma', complainantRole: 'Director de orquesta' },
      { name: 'Recaudación íntegra de la función benéfica', description: 'Fajadas de billetes guardadas tras la función de gala', complainantRole: 'Empresario teatral' },
    ],
    staffRoles: ['Regidor de escena', 'Técnico electricista', 'Encargada de vestuario', 'Conserje de tramoya'],
    witnessNames: ['Julián Soria', 'Margarita Roldán', 'Héctor Balaguer', 'Consuelo Maza'],
  },
];

const SUSPECT_NAMES = [
  'Hugo Blanco', 'Andrés Salgado', 'Irene Domínguez', 'Carlos Varga',
  'Carmen Morales', 'Javier Navarro', 'Lucía Vega', 'Mateo Rivas',
  'Elena Soler', 'Víctor Barea', 'Raquel Benítez', 'Guillermo Fonfria',
  'Adrián Cobo', 'Nuria Esteve', 'Felipe Aranda', 'Teresa Pardo'
];

const COMPLAINANT_NAMES = [
  'Don Gregorio Estrada', 'Doña Valeria Montero', 'Dr. Ignacio Saavedra',
  'Conde de San Jerónimo', 'Dra. Beatriz de la Quadra', 'Sebastián Almansa',
  'Doña Emilia Piquer', 'Arturo Menéndez Conde'
];

const INNOCENT_SECRETS = [
  {
    title: 'Recuperar cartas comprometedoras',
    detail: 'El sospechoso se ausentó para forzar un cajón ajeno y recuperar unas cartas personales que podrían causarle un escándalo matrimonial si salían a la luz.',
    whyHidden: 'Reconocer que estaba forzando el cajón de otra persona arruinaría su reputación personal y familiar, aunque no tocó el objeto del crimen.',
  },
  {
    title: 'Encuentro clandestino no profesional',
    detail: 'El sospechoso abandonó su posición para verse a escondidas en una zona restringida con una persona con la que mantiene una relación secreta prohibida por las normas de la entidad.',
    whyHidden: 'Admitir esa reunión clandestina conllevaría su despido fulminante inmediato y la pérdida de custodia familiar.',
  },
  {
    title: 'Ocultar una deuda de juego urgente',
    detail: 'Se retiró temporalmente para entregar un sobre de dinero en efectivo a un prestamista que le esperaba discretamente en la salida secundaria.',
    whyHidden: 'Nadie en su entorno sabe que estaba siendo extorsionado por deudas económicas graves y teme que lo acusen por tener necesidad de dinero.',
  },
  {
    title: 'Sustracción de su propio historial médico confidencial',
    detail: 'Aprovechó el descuido del personal para entrar en un archivo contiguo y quemar un informe médico personal con un diagnóstico que le habría descalificado laboralmente.',
    whyHidden: 'Confesar que quemó un documento privado le incriminaría en allanamiento y falsedad documental.',
  },
  {
    title: 'Recuperar una joya que empeñó a espaldas de su socio',
    detail: 'Fue a comprobar si el objeto que él mismo había dejado como fianza fraudulenta seguía en el despacho de al lado antes de que la policía llegara.',
    whyHidden: 'Es un delito civil de estafa mercantil menor, pero nada tiene que ver con la desaparición del objeto principal.',
  },
];

const GUILTY_MOTIVES = [
  {
    title: 'Deuda acuciante y chantaje inminente',
    detail: 'El sospechoso planificó el robo semanas antes para liquidar un chantaje económico antes de la medianoche.',
  },
  {
    title: 'Venganza por un despido encubierto',
    detail: 'Sabía que el denunciante planeaba arruinarlo profesionalmente al día siguiente y decidió asegurarse una compensación definitiva.',
  },
  {
    title: 'Encargo de un intermediario del mercado negro',
    detail: 'Tenía un comprador esperando con el motor en marcha a dos manzanas para sacar el objeto de la ciudad inmediatamente.',
  },
];

export function generateProceduralCase(
  durationMinutes: CoartadaDurationMinutes = 10,
  forceGuilty?: boolean,
  seed?: number
): GeneratedCaseInternal {
  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    attempts++;
    const currentSeed = seed !== undefined ? seed + attempts * 997 : Date.now() + attempts * 1337;
    const rng = new Mulberry32(currentSeed);

    const venue = rng.pick(VENUES);
    const venueName = rng.pick(venue.names);
    const crimeRoom = rng.pick(venue.crimeRooms);
    const alibiLoc = rng.pick(venue.alibiLocations);
    const secretLoc = rng.pick(venue.secretLocations);
    const object = rng.pick(venue.objects);

    const suspectName = rng.pick(SUSPECT_NAMES);
    let complainantName = rng.pick(COMPLAINANT_NAMES);
    while (complainantName === suspectName) {
      complainantName = rng.pick(COMPLAINANT_NAMES);
    }

    let otherWitness1 = rng.pick(venue.witnessNames);
    while (otherWitness1 === suspectName || otherWitness1 === complainantName) {
      otherWitness1 = rng.pick(venue.witnessNames);
    }
    let otherWitness2 = rng.pick(venue.witnessNames);
    while (otherWitness2 === otherWitness1 || otherWitness2 === suspectName || otherWitness2 === complainantName) {
      otherWitness2 = rng.pick(venue.witnessNames);
    }
    const staffRole1 = rng.pick(venue.staffRoles);
    const staffRole2 = rng.pick(venue.staffRoles);

    const isGuilty = forceGuilty !== undefined ? forceGuilty : rng.next() >= 0.5;

    // Timeline base hours (e.g. 23:00 to 00:00)
    const baseHour = 23;
    const tEntry = `${baseHour}:15`;
    const tOrder = `${baseHour}:22`;
    const tSuspectLeavesAlibi = `${baseHour}:36`;
    const tCrimeStart = `${baseHour}:42`;
    const tCrimeEnd = `${baseHour}:46`;
    const tAlarmRaised = `${baseHour}:55`;

    const caseId = `CASO-${rng.range(100, 999)}`;
    const dateStr = `Noche del 14 de Noviembre de 1984`;

    // Case Dossier for Detective
    const caseDossier: CaseDossier = {
      caseId,
      title: `Incidente en ${venueName}: El caso de «${object.name}»`,
      locationCategory: venue.category,
      locationName: venueName,
      dateStr,
      incidentEstimatedWindow: `Entre las ${tCrimeStart} y las ${tCrimeEnd}`,
      incidentSummary: `Durante la noche en ${venueName}, el objeto «${object.name}» desapareció de ${crimeRoom}. Las puertas de acceso exterior estaban vigiladas debido a la tormenta. Toda sospecha apunta a personas que se encontraban en el interior del edificio entre las ${baseHour}:30 y las 00:00.`,
      targetObjectOrNature: `${object.name} — ${object.description}`,
      complainantName,
      complainantRole: object.complainantRole,
      suspectPublicName: suspectName,
      suspectPublicRole: `Persona de interés retenida en la oficina`,
      personsOfInterest: [
        {
          name: suspectName,
          role: 'Sospechoso principal',
          description: `Afirma haber estado tranquilamente en ${alibiLoc} y niega haber pisado ${crimeRoom}.`,
        },
        {
          name: complainantName,
          role: object.complainantRole,
          description: `Denunció la desaparición a las ${tAlarmRaised} tras comprobar que la cerradura había sido manipulada.`,
        },
        {
          name: otherWitness1,
          role: staffRole1,
          description: `Responsable de turno que se hallaba en servicio en las inmediaciones.`,
        },
        {
          name: otherWitness2,
          role: staffRole2,
          description: `Personal que registró movimientos y atestigua las idas y venidas por los pasillos.`,
        },
      ],
      initialBriefingNotes: [
        `La lluvia torrencial impidió la salida por ventanas exteriores.`,
        `El sospechoso fue visto por última vez en ${alibiLoc} antes del incidente.`,
        `Se están recopilando los informes policiales, cámaras y testimonios en tiempo real.`,
      ],
    };

    // Public Alibi
    const suspectPublicAlibi = `Yo llegué a ${venueName} sobre las ${tEntry}. Me senté en ${alibiLoc}, pedí algo y estuve allí toda la noche sin levantarme hasta que sonó la alarma pasadas las ${tAlarmRaised}. No tengo nada que ver con lo ocurrido en ${crimeRoom} ni sé cómo se abre esa puerta.`;

    // Secret
    const secretObj = isGuilty
      ? {
          title: 'Perpetración directa premeditada',
          detail: rng.pick(GUILTY_MOTIVES).detail,
          whyHidden: 'Es el autor material directo del hecho delictivo y si confiesa será detenido de inmediato.',
        }
      : rng.pick(INNOCENT_SECRETS);

    // True perpetrator (if innocent, a 3rd party like the disgruntled staff member)
    const truePerpetratorName = isGuilty ? suspectName : otherWitness1;
    const truePerpetratorMotive = isGuilty
      ? secretObj.detail
      : `Aprovechó su acceso como ${staffRole1} y la confusión de la tormenta para sustraer el objeto, confiando en que las sospechas recayeran sobre ${suspectName}.`;

    // Suspect Actual Timeline
    const suspectTrueTimeline = isGuilty
      ? [
          { time: tEntry, location: venueName, action: 'Entrada en el recinto por la puerta principal mojado por la lluvia.' },
          { time: tOrder, location: alibiLoc, action: 'Pide una consumición para fingir normalidad y ser recordado por los presentes.' },
          { time: tSuspectLeavesAlibi, location: 'Pasillo intermedio', action: 'Se escabulle silenciosamente aprovechando que el personal atiende una llamada.' },
          { time: tCrimeStart, location: crimeRoom, action: `Fuerza el pestillo y accede a ${crimeRoom}. Sustrae «${object.name}» con guantes de cuero.` },
          { time: tCrimeEnd, location: secretLoc, action: 'Oculta el botín tras una rejilla de ventilación para recogerlo al día siguiente.' },
          { time: `${baseHour}:50`, location: alibiLoc, action: 'Regresa apresuradamente a su mesa con la respiración entrecortada fingiendo sorpresa.' },
        ]
      : [
          { time: tEntry, location: venueName, action: 'Llega al recinto con la intención de resolver un asunto personal muy delicado.' },
          { time: tOrder, location: alibiLoc, action: `Permanece en ${alibiLoc} esperando el momento propicio.` },
          { time: tSuspectLeavesAlibi, location: 'Escalera de servicio', action: `Abandona ${alibiLoc} a escondidas dirigiéndose hacia ${secretLoc}.` },
          { time: tCrimeStart, location: secretLoc, action: `Se encuentra en ${secretLoc} ejecutando su secreto: ${secretObj.title.toLowerCase()}.` },
          { time: tCrimeEnd, location: secretLoc, action: `Permanece aún en ${secretLoc} cerrando un cajón y temiendo ser descubierto por los ruidos exteriores.` },
          { time: `${baseHour}:51`, location: alibiLoc, action: 'Vuelve a su asiento procurando no llamar la atención, aliviado por haber terminado.' },
        ];

    // Undeniable facts known to suspect
    const undeniableFacts = [
      `Hay un ticket o consumición registrada a tu nombre en ${alibiLoc} a las ${tOrder}.`,
      `Una persona del personal (${otherWitness2}) te vio levantarte de la mesa cerca de las ${tSuspectLeavesAlibi}.`,
      `El acceso a ${crimeRoom} requería pasar cerca del tiro de escaleras.`,
    ];

    // Venue facts known to suspect
    const venueFacts = [
      `En ${alibiLoc} había música suave y goteras en el cristal exterior.`,
      `El camino hacia ${crimeRoom} pasa junto a un reloj de pared antiguo que daba las campanadas.`,
      `Las luces del pasillo central parpadearon dos veces sobre las ${baseHour}:40 debido a un trueno.`,
    ];

    const suspectDossier: SuspectDossier = {
      publicAlibi: suspectPublicAlibi,
      actualTimeline: suspectTrueTimeline,
      venueFacts,
      secret: secretObj,
      undeniableFacts,
    };

    // Calculate evidence schedule across match duration
    const totalSeconds = durationMinutes * 60;
    // Step distributions: 0s, ~15%, ~33%, ~50%, ~70%, ~85%
    const cardSchedule = [
      0, // immediately available or card 1
      Math.floor(totalSeconds * 0.16),
      Math.floor(totalSeconds * 0.35),
      Math.floor(totalSeconds * 0.52),
      Math.floor(totalSeconds * 0.70),
      Math.floor(totalSeconds * 0.85),
    ];

    // Generate Evidence Cards
    const allEvidence: EvidenceCard[] = [];

    // Clue 1: Receipt / ticket
    allEvidence.push({
      id: 'ev-1',
      title: `Tique de consumición en ${alibiLoc}`,
      type: 'RECEIPT',
      timestamp: tOrder,
      location: alibiLoc,
      source: 'Caja registradora del establecimiento',
      summary: `Comprobante impreso que demuestra la presencia inicial de ${suspectName}.`,
      details: `Factura simplificada nº 4812 a las ${tOrder}. Se facturó un café y una copa a cargo del cliente que ocupaba la mesa lateral. Confirma que ${suspectName} estaba físicamente en ${alibiLoc} a esa hora exacta.`,
      revealedAtSeconds: cardSchedule[0],
    });

    // Clue 2: Hallway Camera / Security Log
    allEvidence.push({
      id: 'ev-2',
      title: `Cámara de seguridad del pasillo central`,
      type: 'CAMERA',
      timestamp: tSuspectLeavesAlibi,
      location: 'Pasillo intermedio entre el vestíbulo y las escaleras',
      source: 'Circuito cerrado de televisión (CCTV analógico)',
      summary: `La grabación muestra a ${suspectName} saliendo de ${alibiLoc}, contradiciendo su versión de que jamás se movió.`,
      details: `A las ${tSuspectLeavesAlibi}, la cámara capta a una figura con la misma indumentaria y estatura de ${suspectName} cruzando el tiro de cámara hacia el ala este. El sospechoso camina con paso ligero y mira a ambos lados antes de doblar la esquina.`,
      revealedAtSeconds: cardSchedule[1],
    });

    // Clue 3: Witness Statement
    allEvidence.push({
      id: 'ev-3',
      title: `Declaración jurada de ${otherWitness2}`,
      type: 'STATEMENT',
      timestamp: `${baseHour}:40`,
      location: 'Distribuidor de la planta principal',
      source: 'Interrogatorio preliminar levantado por la patrulla',
      summary: `${otherWitness2} declara haber escuchado pasos precipitados y el roce de una puerta cerca de ${secretLoc}.`,
      details: `«Estaba reponiendo material cerca de las ${baseHour}:40 cuando escuché chirriar una cerradura. No vi el rostro de nadie porque la luz parpadeaba por la tormenta, pero me fijé en que alguien se metía apresuradamente hacia la zona de ${secretLoc}».`,
      revealedAtSeconds: cardSchedule[2],
    });

    // Clue 4: Access Log or Door Latch Inspection
    if (isGuilty) {
      allEvidence.push({
        id: 'ev-4',
        title: `Informe de cerradura forzada en ${crimeRoom}`,
        type: 'ACCESS_LOG',
        timestamp: tCrimeStart,
        location: crimeRoom,
        source: 'Inspección ocular de la cerradura mecánica',
        summary: `Muescas recientes de forzamiento con navaja de bolsillo en el bombín de ${crimeRoom}.`,
        details: `El cerrojo de ${crimeRoom} presenta raspaduras de bronce frescas y partículas metálicas en el suelo. El método coincide exactamente con una herramienta corta de acero, de dimensiones idénticas a la navaja encontrada entre las pertenencias del sospechoso.`,
        revealedAtSeconds: cardSchedule[3],
      });
    } else {
      allEvidence.push({
        id: 'ev-4',
        title: `Registro de tarjeta maestra de servicio`,
        type: 'ACCESS_LOG',
        timestamp: tCrimeStart,
        location: crimeRoom,
        source: 'Lectura del cilindro electrónico auxiliar',
        summary: `La puerta de ${crimeRoom} fue abierta mediante la tarjeta maestra del personal, no forzada.`,
        details: `A las ${tCrimeStart}, el lector de servicio registró la apertura autorizada con la Tarjeta Maestra nº 2 (asignada al personal de guardia: ${otherWitness1}). Ninguna cerradura fue forzada con ganzúa ni cuchilla.`,
        revealedAtSeconds: cardSchedule[3],
      });
    }

    // Clue 5: Decisive Forensic / Timeline Trace
    if (isGuilty) {
      allEvidence.push({
        id: 'ev-5',
        title: `Cinta analógica de la salida de servicio posterior`,
        type: 'CAMERA',
        timestamp: tCrimeEnd,
        location: secretLoc,
        source: 'Cámara periférica de seguridad',
        summary: `Aparición de ${suspectName} saliendo de ${secretLoc} guardando un bulto antes de regresar.`,
        details: `A las ${tCrimeEnd}, el sospechoso es captado manipulando el falso techo junto a ${secretLoc}. No hay ninguna otra persona en esa zona en ese lapso. Tres minutos después reaparece en ${alibiLoc}.`,
        revealedAtSeconds: cardSchedule[4],
      });
    } else {
      allEvidence.push({
        id: 'ev-5',
        title: `Nota manuscrita hallada en ${secretLoc}`,
        type: 'NOTE',
        timestamp: `${baseHour}:44`,
        location: secretLoc,
        source: 'Inspección del contenedor y archivador de ${secretLoc}',
        summary: `Documento personal firmado que sitúa a ${suspectName} en ${secretLoc} durante la hora del crimen.`,
        details: `Se halló un sobre rasgado con un sello personal de ${suspectName} en ${secretLoc}. La tinta fresca y la hora confirman que ${suspectName} estaba físicamente en ${secretLoc} a las ${tCrimeStart}–${tCrimeEnd}, a más de 120 metros y dos plantas de distancia de ${crimeRoom}.`,
        revealedAtSeconds: cardSchedule[4],
      });
    }

    // Clue 6: Culprit proof / Exculpatory confirmation
    if (isGuilty) {
      allEvidence.push({
        id: 'ev-6',
        title: `Huella dactilar sobre el pomo interior de ${crimeRoom}`,
        type: 'FINGERPRINT',
        timestamp: tCrimeEnd,
        location: crimeRoom,
        source: 'Laboratorio de dactiloscopia policial',
        summary: `Huella parcial del pulgar derecho de ${suspectName} en el pestillo interior.`,
        details: `El revelado con polvo magnético en el pestillo interior de ${crimeRoom} arroja 14 puntos característicos coincidentes con la ficha dactilar de ${suspectName}. No existe justificación legítima para que sus huellas estén en el interior del cerrojo.`,
        revealedAtSeconds: cardSchedule[5],
      });
    } else {
      allEvidence.push({
        id: 'ev-6',
        title: `Testimonio del vigilante exterior sobre ${truePerpetratorName}`,
        type: 'STATEMENT',
        timestamp: tCrimeEnd,
        location: 'Salida de mercancías',
        source: 'Parte de guardia del control de portón',
        summary: `${truePerpetratorName} fue interceptado con una bolsa sospechosa junto a la salida trasera.`,
        details: `A las ${tCrimeEnd}, el vigilante vio a ${truePerpetratorName} abandonando la galería contigua a ${crimeRoom} con el uniforme empapado y ocultando un paquete de tamaño idéntico a «${object.name}».`,
        revealedAtSeconds: cardSchedule[5],
      });
    }

    // Master Timeline for Final Truth
    const fullMasterTimeline = [
      {
        time: tEntry,
        actor: suspectName,
        action: `Llegó a ${venueName} bajo la lluvia y se dirigió a ${alibiLoc}.`,
        significance: 'Ambas partes coinciden en su presencia inicial.',
      },
      {
        time: tOrder,
        actor: suspectName,
        action: `Pidió consumición en ${alibiLoc} confirmada por el tique (Prueba 1).`,
        significance: 'Coartada válida hasta ese momento.',
      },
      {
        time: tSuspectLeavesAlibi,
        actor: suspectName,
        action: `Se levantó de la mesa y abandonó ${alibiLoc} (Prueba 2).`,
        significance: 'Punto de ruptura con su versión pública («no me moví en toda la noche»).',
      },
      {
        time: tCrimeStart,
        actor: isGuilty ? suspectName : truePerpetratorName,
        action: isGuilty
          ? `Accedió a ${crimeRoom} forzando la cerradura y sustrajo «${object.name}».`
          : `${truePerpetratorName} entró en ${crimeRoom} usando la tarjeta maestra mientras ${suspectName} estaba en ${secretLoc}.`,
        significance: 'Momento exacto de la comisión del delito.',
      },
      {
        time: tCrimeEnd,
        actor: isGuilty ? suspectName : truePerpetratorName,
        action: isGuilty
          ? `Ocultó el objeto en ${secretLoc} dejando huellas en el pestillo (Pruebas 5 y 6).`
          : `${truePerpetratorName} intentó salir con el botín mientras ${suspectName} terminaba su asunto en ${secretLoc}.`,
        significance: isGuilty ? 'Consumación del delito por el sospechoso.' : 'Prueba física exculpatoria concluyente.',
      },
      {
        time: tAlarmRaised,
        actor: complainantName,
        action: `Descubrió la sustracción de «${object.name}» y dio la voz de alarma a la policía.`,
        significance: 'Inicio del cierre del edificio y retención de los presentes.',
      },
    ];

    // Clue explanations
    const clueExplanations = [
      {
        clueTitle: allEvidence[0].title,
        explanation: `Acredita que ${suspectName} estuvo en ${alibiLoc} a las ${tOrder}, pero solo hasta las ${tSuspectLeavesAlibi}.`,
        indicatesGuilt: false,
      },
      {
        clueTitle: allEvidence[1].title,
        explanation: `Demuestra que ${suspectName} mintió al decir que no se levantó de la mesa, pues la cámara lo grabó a las ${tSuspectLeavesAlibi}.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: allEvidence[2].title,
        explanation: `Confirma ruidos sospechosos hacia ${secretLoc} en el momento en que ${suspectName} transitaba por allí.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: allEvidence[3].title,
        explanation: isGuilty
          ? `El método de forzamiento concuerda exactamente con la navaja de ${suspectName}.`
          : `La puerta no fue forzada: se usó la tarjeta maestra de ${otherWitness1}, demostrando que el sospechoso no la abrió.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: allEvidence[4].title,
        explanation: isGuilty
          ? `Muestra al sospechoso ocultando el paquete en ${secretLoc}.`
          : `La nota manuscrita sitúa a ${suspectName} en ${secretLoc} protegiendo su secreto, a distancia infranqueable del crimen.`,
        indicatesGuilt: isGuilty,
      },
      {
        clueTitle: allEvidence[5].title,
        explanation: isGuilty
          ? `La huella dactilar en el pestillo interior de ${crimeRoom} vincula irremediablemente a ${suspectName} con el robo.`
          : `El vigilante sorprendió al verdadero autor (${truePerpetratorName}) portando el objeto sustraído.`,
        indicatesGuilt: isGuilty,
      },
    ];

    // Reconstruction questions (Detective selects answer)
    const reconstructionQuestions: ReconstructionQuestion[] = [
      {
        id: 'rq-1',
        prompt: `¿Dónde se encontraba realmente el sospechoso entre las ${tCrimeStart} y las ${tCrimeEnd}?`,
        options: isGuilty
          ? [
              `En ${crimeRoom}, sustrayendo directamente «${object.name}».`,
              `En ${alibiLoc}, como afirmó en todo momento.`,
              `En el aparcamiento exterior huyendo en coche.`,
            ]
          : [
              `En ${secretLoc}, ocultando su secreto personal.`,
              `En ${crimeRoom}, ejecutando la sustracción.`,
              `Sentado plácidamente en ${alibiLoc} sin moverse.`,
            ],
        correctOptionIndex: 0,
        explanation: isGuilty
          ? `Las grabaciones y huellas demuestran que accedió a ${crimeRoom}.`
          : `Estaba en ${secretLoc} intentando resolver su secreto personal, a más de 100 metros del delito.`,
      },
      {
        id: 'rq-2',
        prompt: isGuilty
          ? `¿Cuál fue la prueba definitiva que desmontó la coartada de ${suspectName}?`
          : `¿Por qué mintió ${suspectName} si realmente no cometió el crimen?`,
        options: isGuilty
          ? [
              `La huella dactilar en el pestillo interior de ${crimeRoom} y la cámara de ${tSuspectLeavesAlibi}.`,
              `Un testigo que lo vio salir corriendo por el tejado.`,
              `Una confesión voluntaria firmada a la llegada de la patrulla.`,
            ]
          : [
              `Porque quería ocultar ${secretObj.title.toLowerCase()} y temía un escándalo personal o despido.`,
              `Porque era cómplice pagado del verdadero ladrón.`,
              `Porque confundió la hora de su reloj de pulsera.`,
            ],
        correctOptionIndex: 0,
        explanation: isGuilty
          ? `La coincidencia dactilar y las cámaras desmoronaron su falsa coartada.`
          : `Mintió para salvar su reputación personal por un hecho ajeno al robo, demostrando que mentir no equivale automáticamente a ser culpable.`,
      },
    ];

    const finalTruthReveal: FinalTruthReveal = {
      suspectIsGuilty: isGuilty,
      perpetratorName: truePerpetratorName,
      perpetratorMotive: truePerpetratorMotive,
      actualIncidentSummary: isGuilty
        ? `El sospechoso ${suspectName} planificó minuciosamente la sustracción de «${object.name}». Tras fingir que pasaba la tarde en ${alibiLoc}, se escabulló a las ${tSuspectLeavesAlibi}, forzó el acceso a ${crimeRoom} y escondió la pieza en ${secretLoc}. Su coartada fue derribada por las cámaras y la huella en el pestillo.`
        : `El sospechoso ${suspectName} es TOTALMENTE INOCENTE del robo. Si bien mintió sobre sus movimientos, lo hizo únicamente para proteger un secreto íntimo (${secretObj.title.toLowerCase()}: ${secretObj.detail}). El verdadero autor material fue ${truePerpetratorName}, quien aprovechó la tarjeta maestra para sustraer «${object.name}».`,
      fullMasterTimeline,
      clueExplanations,
      suspectSecretReveal: `EL SECRETO DE ${suspectName.toUpperCase()}:\n${secretObj.title} — ${secretObj.detail}\nMotivo del engaño: ${secretObj.whyHidden}`,
      conclusionMessage: isGuilty
        ? `EL SOSPECHOSO ES CULPABLE. La contradicción horaria y las evidencias científicas revelan la autoría directa.`
        : `EL SOSPECHOSO ES INOCENTE. Mentir para salvaguardar la intimidad no equivale a ser culpable del delito.`,
    };

    const caseData: GeneratedCaseInternal = {
      caseId,
      suspectIsGuilty: isGuilty,
      caseDossier,
      suspectDossier,
      allEvidence,
      reconstructionQuestions,
      finalTruthReveal,
    };

    // Validation
    const validation = validateGeneratedCase(caseData);
    if (validation.valid) {
      return caseData;
    } else {
      console.warn(`[Coartada][CaseValidation] Fallo en intento ${attempts}:`, validation.errors);
    }
  }

  throw new Error('No se pudo generar un caso de Coartada coherente tras varios intentos');
}
