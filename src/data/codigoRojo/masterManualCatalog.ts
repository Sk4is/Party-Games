import {
  CodigoRojoCategory,
  CodigoRojoManualSection,
  CodigoRojoModuleType,
} from '../../types/codigoRojo';

export const ALL_28_GLYPHS = [
  { id: 'g1', symbol: '⍾', name: 'Bobina Cuántica', description: 'Círculo con espiral inferior' },
  { id: 'g2', symbol: '⎈', name: 'Timón Estelar', description: 'Volante con tres radios curvos' },
  { id: 'g3', symbol: '⌬', name: 'Anillo Benceno', description: 'Hexágono con círculo concéntrico' },
  { id: 'g4', symbol: '⏣', name: 'Hexágono Sagrado', description: 'Hexágono con punto central' },
  { id: 'g5', symbol: '⌖', name: 'Mira Vectorial', description: 'Doble cruz con retícula abierta' },
  { id: 'g6', symbol: '⍲', name: 'Omega Invertida', description: 'Omega con base cuadrada' },
  { id: 'g7', symbol: '⍚', name: 'Prisma Reflector', description: 'Rombo con flecha vertical' },
  { id: 'g8', symbol: '⏚', name: 'Toma de Tierra', description: 'Línea vertical con tres barras horizontales' },
  { id: 'g9', symbol: '⍡', name: 'Emisor Pulsante', description: 'Círculo con emisión de ondas superiores' },
  { id: 'g10', symbol: '⎇', name: 'Bifurcación Doble', description: 'Rama que se divide en dos vías' },
  { id: 'g11', symbol: '⍰', name: 'Interrogante Cuántico', description: 'Símbolo interrogación encajonado' },
  { id: 'g12', symbol: '⎊', name: 'Triángulo Ocular', description: 'Triángulo con ojo centrado' },
  { id: 'g13', symbol: '⨂', name: 'Círculo Aspa', description: 'Círculo relleno con una X de borde a borde' },
  { id: 'g14', symbol: '⨁', name: 'Cruz Circunscrita', description: 'Círculo partido por una cruz perpendicular' },
  { id: 'g15', symbol: '⊛', name: 'Estrella Circulada', description: 'Estrella de cinco puntas dentro de esfera' },
  { id: 'g16', symbol: '⊜', name: 'Igual Circulado', description: 'Dos barras horizontales en anillo' },
  { id: 'g17', symbol: '⍟', name: 'Pentagrama Encerrado', description: 'Pentagrama en círculo grueso' },
  { id: 'g18', symbol: '⎉', name: 'Disco Ranurado', description: 'Anillo con muesca superior' },
  { id: 'g19', symbol: '⏢', name: 'Campana de Onda', description: 'Trapecio con cresta parabólica' },
  { id: 'g20', symbol: '⍤', name: 'Doble Punto Cóncavo', description: 'Semióvalo con dos puntos de enfoque' },
  { id: 'g21', symbol: '⍥', name: 'Triple Prisma', description: 'Prisma triangular con tres facetas' },
  { id: 'g22', symbol: '⍧', name: 'Electrodo Iónico', description: 'Barra vertical con cátodo asimétrico' },
  { id: 'g23', symbol: '⍭', name: 'Ancla Vectorial', description: 'Base curva con flecha apuntando arriba' },
  { id: 'g24', symbol: '⏃', name: 'Delta Superior', description: 'Triángulo equilátero con pico agudo' },
  { id: 'g25', symbol: '⏄', name: 'Yunque Magnético', description: 'Bloque con soporte ensanchado' },
  { id: 'g26', symbol: '⏅', name: 'Corona de Cúspide', description: 'Tridente corto invertido' },
  { id: 'g27', symbol: '⍱', name: 'Escudo de Polaridad', description: 'Base convexa con dipolo superior' },
  { id: 'g28', symbol: '⍶', name: 'Lazo de Moebius', description: 'Bucle en ocho cerrado' },
];

export const GLYPH_COLUMNS_EXPANDED: string[][] = [
  ['⍾', '⎈', '⌬', '⍰', '⌖', '⍚', '⨂'],
  ['⎊', '⍾', '⎇', '⏣', '⍲', '⎈', '⊛'],
  ['⏚', '⍡', '⎊', '⌬', '⌖', '⍰', '⊜'],
  ['⏣', '⍚', '⍲', '⏚', '⎇', '⍡', '⍟'],
  ['⎈', '⌖', '⍡', '⍾', '⎊', '⌬', '⎉'],
  ['⍰', '⏣', '⍚', '⎇', '⏚', '⍲', '⏢'],
  ['⨂', '⊛', '⊜', '⍟', '⍤', '⍥', '⍧'],
  ['⍭', '⏃', '⏄', '⏅', '⍱', '⍶', '⎈'],
];

export const MASTER_MANUAL_SECTIONS: CodigoRojoManualSection[] = [
  // 1. FILAMENTOS DE POTENCIA
  {
    moduleType: 'FILAMENTOS',
    category: 'ELECTRICIDAD',
    title: 'Filamentos de Potencia',
    subtitle: 'Protocolo de Corte Eléctrico de Emergencia',
    classificationCode: 'DOC-ELE-01',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Panel rectangular con entre 3 y 6 cables verticales suspendidos entre bornes metálicos. Los cables pueden ser lisos o tener franjas bicolor. Hay un indicador luminoso LED piloto en la parte superior.',
    identificationChecklist: [
      'Entre 3 y 6 cables verticales suspendidos entre bornes superior e inferior.',
      'Cables de colores lisos o con franjas bicolores.',
      'Diodo LED piloto superior de color Ámbar/Verde/Rojo/Apagado.',
      'Corte irreversible al hacer clic sobre cualquier cable con la cizalla.',
    ],
    description:
      'Un banco de filamentos conduce energía de reserva al núcleo. Cortar el filamento erróneo provocará una sobrecarga inmediata (Strike). Los filamentos se cuentan de izquierda a derecha (1 a N).',
    rules: [
      {
        condition: 'CASO A: EL MÓDULO TIENE 3 FILAMENTOS',
        action:
          '1. ¿Hay algún filamento con franja y el LED es ÁMBAR? → Corta el 2º filamento.\n2. Si no hay ningún filamento rojo → Corta el 2º filamento azul (o el 1º si no hay azul).\n3. Si el último filamento es blanco liso (sin franja) → Corta el último filamento.\n4. En cualquier otro caso → Corta el 1er filamento.',
      },
      {
        condition: 'CASO B: EL MÓDULO TIENE 4 FILAMENTOS',
        action:
          '1. ¿Hay 2 o más filamentos con franja? → Si la última cifra del número de serie es IMPAR, corta el 1er filamento azul; si es PAR, corta el 2º filamento.\n2. Si hay exactamente 1 filamento rojo y más de 1 filamento amarillo → Corta el primer filamento con franja (o el 4º si ninguno tiene franja).\n3. Si no hay filamentos rojos y el último NO tiene franja → Corta el 2º filamento si la serie es par, o el 1er azul si la serie es impar.\n4. En cualquier otro caso → Corta el penúltimo filamento (posición 3).',
      },
      {
        condition: 'CASO C: EL MÓDULO TIENE 5 FILAMENTOS',
        action:
          '1. Si el último filamento es negro y la serie termina en cifra impar → Corta el 4º filamento.\n2. Si hay exactamente 2 filamentos rojos y al menos 1 tiene franja → Corta el 2º filamento con franja (o el 1er rojo si solo 1 tiene franja).\n3. Si hay filamentos amarillos pero ninguno negro → Corta el 1er filamento.\n4. En cualquier otro caso → Corta el 2º filamento.',
      },
      {
        condition: 'CASO D: EL MÓDULO TIENE 6 FILAMENTOS',
        action:
          '1. Si no hay filamentos amarillos y la serie termina en impar → Corta el 3er filamento.\n2. Si hay exactamente 1 filamento amarillo y 2 o más blancos → Corta el 4º filamento.\n3. Si hay 3 o más filamentos con franja → Corta el 1er filamento con franja.\n4. En cualquier otro caso → Corta el último filamento.',
      },
    ],
    notes: [
      'Los filamentos se numeran de izquierda a derecha (1 a N).',
      'Un solo corte erróneo causará una sobrecarga eléctrica y un Strike.',
      'Pregunta siempre al Operador: número total de cables, si tienen franja, el color del LED y la última cifra del número de serie.',
    ],
  },

  // 2. MODULADOR DE FRECUENCIA
  {
    moduleType: 'MODULADOR_FRECUENCIA',
    category: 'SEÑAL',
    title: 'Modulador de Frecuencia',
    subtitle: 'Calibración Armónica del Osciloscopio',
    classificationCode: 'DOC-WAV-02',
    division: 'Transmisiones y Señales',
    visualIdentification:
      'Pantalla de osciloscopio verde CRT con forma de onda oscilante (SENOIDAL, CUADRADA, TRIANGULAR o DIENTE_SIERRA), visor digital de frecuencia base en kHz, indicador de canal (CANAL-ALPHA, CANAL-BETA, CANAL-GAMMA, CANAL-DELTA) y mandos [-] [+] con tecla «CALIBRAR».',
    identificationChecklist: [
      'Pantalla verde de osciloscopio con retícula de barrido.',
      'Forma de onda visible: SENOIDAL, CUADRADA, TRIANGULAR o DIENTE_SIERRA.',
      'Canal LED activo en la esquina superior (CANAL-ALPHA a CANAL-DELTA).',
      'Visor de frecuencia base en kHz y botones [-] [+] con tecla «CALIBRAR».',
    ],
    description:
      'El osciloscopio táctico emite una portadora desfasada. El Operador debe comunicar la FORMA DE ONDA y el CANAL LED iluminado. Los Guías deben consultar la tabla armónica y sumar o restar el ajuste indicado a la frecuencia base mostrada.',
    tableHeaders: ['Forma de Onda', 'CANAL-ALPHA', 'CANAL-BETA', 'CANAL-GAMMA', 'CANAL-DELTA'],
    tableRows: [
      ['Senoidal (onda suave)', '+15 kHz', '+25 kHz', '-10 kHz', '-20 kHz'],
      ['Cuadrada (bloques rectos)', '-15 kHz', '+20 kHz', '+30 kHz', '+10 kHz'],
      ['Triangular (picos agudos)', '+30 kHz', '-20 kHz', '+15 kHz', '-15 kHz'],
      ['Diente de Sierra (rampa)', '-25 kHz', '-15 kHz', '+20 kHz', '+25 kHz'],
    ],
    rules: [
      {
        condition: '1. Identificación de Onda y Canal:',
        action: 'Cruza la forma de onda del osciloscopio con la columna del canal activo en la tabla armónica superior.',
      },
      {
        condition: '2. Cálculo de la Frecuencia Objetivo:',
        action: 'Frecuencia Objetivo = Frecuencia Base indicada en pantalla + Desfase armónico en kHz.',
      },
      {
        condition: '3. Calibración en consola:',
        action: 'El Operador utiliza los mandos [-] [+] para ajustar la frecuencia en pantalla al valor exacto y pulsa «CALIBRAR».',
      },
    ],
    notes: [
      'La frecuencia final calculada siempre terminará en un múltiplo de 5.',
      'Pulsar «CALIBRAR» con una frecuencia incorrecta provocará un fallo de resonancia (Strike).',
    ],
  },

  // 3. GLIFOS CRIPTOGRÁFICOS
  {
    moduleType: 'GLIFOS_CRIPTOGRAFICOS',
    category: 'SISTEMAS',
    title: 'Glifos Criptográficos',
    subtitle: 'Secuencia de Desbloqueo de Sellos Rúnicos',
    classificationCode: 'DOC-CRIP-03',
    division: 'Criptografía y Protocolos',
    visualIdentification:
      'Teclado de 4 pulsadores grandes con glifos geométricos, astronómicos o rúnicos inscritos. No tienen texto, solo el símbolo grabado en relieve ámbar.',
    identificationChecklist: [
      'Cuatro pulsadores grandes cuadrados en retícula 2x2.',
      'Cada pulsador exhibe un glifo geométrico o astronómico grabado.',
      'Ausencia de texto numérico o alfabético en los botones.',
      'Respuesta sonora táctil al pulsar cada glifo.',
    ],
    description:
      'El módulo contiene 4 pulsadores con glifos misteriosos. Para desactivarlo, deben pulsarse exactamente en el orden vertical (de arriba a abajo) en que aparecen en una de las 8 columnas oficiales de referencia.',
    rules: [
      {
        condition: 'Paso 1: Identificación de los 4 glifos presentes',
        action:
          'El Operador debe describir la forma y rasgos de los 4 símbolos presentes en su consola (utiliza el catálogo de glifos ilustrado en este manual).',
      },
      {
        condition: 'Paso 2: Localización de la columna única',
        action:
          'Busca cuál de las 8 columnas contiene LOS CUATRO glifos presentes en el panel (exactamente una columna contendrá los cuatro).',
      },
      {
        condition: 'Paso 3: Orden de activación',
        action:
          'Indica al Operador que pulse los 4 botones en el orden estricto de arriba abajo según aparecen en esa columna de referencia.',
      },
    ],
    notes: [
      'Pulsar un glifo fuera de orden provocará un bloqueo rúnico y un Strike inmediato, reiniciando la secuencia del módulo.',
      'Compara minuciosamente cada símbolo para no confundir variantes similares (ej. círculos simples vs circunscritos).',
    ],
  },

  // 4. MATRIZ DE ENERGÍA
  {
    moduleType: 'MATRIZ_ENERGIA',
    category: 'CONTROL',
    title: 'Matriz de Celdas de Energía',
    subtitle: 'Disipación de Carga Residual en Matriz 3x3',
    classificationCode: 'DOC-PWR-04',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Retícula cuadrada 3x3 de nueve celdas magnéticas identificadas de A1 a C3. En la parte superior se indica el ESTADO DEL NÚCLEO (ESTABLE, CRÍTICO, PURGA_REQUERIDA o SOBRECALENTAMIENTO). En la base se ubica el pulsador «DESCARGAR MATRIZ».',
    identificationChecklist: [
      'Cuadrícula 3x3 con 9 celdas magnéticas conmutables (A1..C3).',
      'Indicador de diagnóstico del núcleo: ESTABLE, CRÍTICO, PURGA_REQUERIDA o SOBRECALENTAMIENTO.',
      'Botón inferior de descarga «DESCARGAR MATRIZ».',
    ],
    description:
      'La matriz regula el flujo de carga a las celdas principales. Para estabilizar el banco de potencia sin cortocircuitar el reactor, las celdas activas finales deben coincidir exactamente con el patrón de seguridad correspondiente al estado del núcleo.',
    rules: [
      {
        condition: 'Si el núcleo indica «ESTABLE»:',
        action: 'Activa únicamente la diagonal principal: A1, B2 y C3. Apaga todas las demás celdas.',
      },
      {
        condition: 'Si el núcleo indica «CRÍTICO»:',
        action: 'Forma la cruz de emergencia activando: B2 (centro), A2, C2, B1 y B3. Apaga las cuatro esquinas.',
      },
      {
        condition: 'Si el núcleo indica «PURGA_REQUERIDA»:',
        action: 'Activa únicamente las cuatro esquinas: A1, A3, C1 y C3. Apaga todas las celdas centrales y de cruz.',
      },
      {
        condition: 'Si el núcleo indica «SOBRECALENTAMIENTO»:',
        action: 'Activa el rombo perimétrico: A2, B1, B3 y C2. Apaga el centro (B2) y las cuatro esquinas.',
      },
    ],
    notes: [
      'El Operador puede hacer clic sobre cualquier celda para encenderla o apagarla libremente.',
      'Una vez configurado el patrón deseado, debe presionar el botón «DESCARGAR MATRIZ».',
      'Pulsar «DESCARGAR MATRIZ» con un patrón incorrecto producirá una sobretensión y 1 Strike.',
    ],
  },

  // 5. VÁLVULAS DE PRESIÓN
  {
    moduleType: 'VALVULAS_PRESION',
    category: 'ENERGÍA',
    title: 'Válvulas de Presión Neumática',
    subtitle: 'Purga y Compensación de Presión de Fluidos',
    classificationCode: 'DOC-FLU-05',
    division: 'Fluidos y Termodinámica',
    visualIdentification:
      'Un gran manómetro central indica la PRESIÓN DEL SISTEMA en PSI. Debajo se encuentran tres válvulas rotativas rotuladas como VÁLVULA A, VÁLVULA B y VÁLVULA C, ajustables exclusivamente a 0°, 45° o 90°. En la base se ubica el mando de purga «PURGAR PRESIÓN».',
    identificationChecklist: [
      'Un único manómetro central indicador de la PRESIÓN DEL SISTEMA en PSI.',
      'Tres ruedas de válvula giratorias: VÁLVULA A, VÁLVULA B y VÁLVULA C.',
      'Tres únicas posiciones angulares por válvula: 0° (horizontal), 45° (diagonal) y 90° (vertical).',
      'Pulsador de descarga «PURGAR PRESIÓN».',
    ],
    description:
      'Las líneas hidráulicas del núcleo están bajo presión. El Operador debe comunicar la PRESIÓN DEL SISTEMA en PSI leída en el manómetro central. Los Guías determinan la zona de presión y dictan los ángulos exactos (0°, 45° o 90°) a los que deben orientarse la VÁLVULA A, la VÁLVULA B y la VÁLVULA C antes de accionar la purga.',
    rules: [
      {
        condition: 'CASO 1: PRESIÓN DEL SISTEMA > 80 PSI (ZONA ROJA)',
        action:
          '• Si la última cifra del número de serie de la máquina es PAR:\n  Coloca VÁLVULA A a 90°, VÁLVULA B a 45° y VÁLVULA C a 0°.\n• Si la última cifra es IMPAR:\n  Coloca VÁLVULA A a 90°, VÁLVULA B a 0° y VÁLVULA C a 45°.\nDespués acciona «PURGAR PRESIÓN».',
      },
      {
        condition: 'CASO 2: PRESIÓN DEL SISTEMA DE 40 A 80 PSI (ZONA ÁMBAR)',
        action:
          '• Si la última cifra del número de serie es PAR:\n  Coloca VÁLVULA A a 45°, VÁLVULA B a 90° y VÁLVULA C a 45°.\n• Si la última cifra es IMPAR:\n  Coloca VÁLVULA A a 0°, VÁLVULA B a 45° y VÁLVULA C a 90°.\nDespués acciona «PURGAR PRESIÓN».',
      },
      {
        condition: 'CASO 3: PRESIÓN DEL SISTEMA < 40 PSI (ZONA VERDE)',
        action:
          '• Si la última cifra del número de serie es PAR:\n  Coloca VÁLVULA A a 0°, VÁLVULA B a 0° y VÁLVULA C a 90°.\n• Si la última cifra es IMPAR:\n  Coloca VÁLVULA A a 45°, VÁLVULA B a 0° y VÁLVULA C a 45°.\nDespués acciona «PURGAR PRESIÓN».',
      },
    ],
    notes: [
      'Las únicas posiciones válidas para cada válvula son 0°, 45° y 90°.',
      'El Operador puede girar las válvulas libremente sin penalización.',
      'La evaluación se realiza únicamente al pulsar «PURGAR PRESIÓN». Un intento incorrecto sumará como máximo 1 Strike.',
    ],
  },

  // 6. RELÉS HEXADECIMALES
  {
    moduleType: 'RELES_HEXADECIMALES',
    category: 'ELECTRICIDAD',
    title: 'Relés Hexadecimales',
    subtitle: 'Decodificación Lógica de Registro Base 16',
    classificationCode: 'DOC-LOG-06',
    division: 'Lógica Digital y Cómputo',
    visualIdentification:
      'El panel contiene UNA única pantalla central con un Registro Hexadecimal (ej. 0x3A, 0x7F, 0xC4) y debajo un banco de CUATRO interruptores de relé biestables etiquetados R1, R2, R3 y R4. Cada relé puede conmutarse a ARRIBA (1) o ABAJO (0). En la parte inferior se encuentra el pulsador «ENCLAVAR RELÉS».',
    identificationChecklist: [
      'UNA sola pantalla digital con un registro hexadecimal (0x00 a 0xFF).',
      'CUATRO interruptores de palanca verticales: R1, R2, R3, R4.',
      'Dos posiciones por interruptor: ARRIBA (1) y ABAJO (0).',
      'Pulsador de confirmación «ENCLAVAR RELÉS».',
    ],
    description:
      'El bus de datos está bloqueado en un registro hexadecimal. Los Guías deben aplicar la regla correspondiente según el primer carácter del registro y la serie de la máquina para obtener un valor final de 4 bits. Dichos 4 bits determinan la posición de los cuatro relés (R1 a R4).',
    tableHeaders: ['HEX', 'Binario (R1-R2-R3-R4)', 'HEX', 'Binario (R1-R2-R3-R4)'],
    tableRows: [
      ['0', '0000 (Abajo-Abajo-Abajo-Abajo)', '8', '1000 (Arriba-Abajo-Abajo-Abajo)'],
      ['1', '0001 (Abajo-Abajo-Abajo-Arriba)', '9', '1001 (Arriba-Abajo-Abajo-Arriba)'],
      ['2', '0010 (Abajo-Abajo-Arriba-Abajo)', 'A', '1010 (Arriba-Abajo-Arriba-Abajo)'],
      ['3', '0011 (Abajo-Abajo-Arriba-Arriba)', 'B', '1011 (Arriba-Abajo-Arriba-Arriba)'],
      ['4', '0100 (Abajo-Arriba-Abajo-Abajo)', 'C', '1100 (Arriba-Arriba-Abajo-Abajo)'],
      ['5', '0101 (Abajo-Arriba-Abajo-Arriba)', 'D', '1101 (Arriba-Arriba-Abajo-Arriba)'],
      ['6', '0110 (Abajo-Arriba-Arriba-Abajo)', 'E', '1110 (Arriba-Arriba-Arriba-Abajo)'],
      ['7', '0111 (Abajo-Arriba-Arriba-Arriba)', 'F', '1111 (Arriba-Arriba-Arriba-Arriba)'],
    ],
    rules: [
      {
        condition: 'CASO 1: EL PRIMER CARÁCTER TRAS «0x» ES UN NÚMERO (0 al 9):',
        action:
          '• Si la última cifra del número de serie de la máquina es PAR:\n  Aplica operación AND con 0x0F (toma directamente el segundo dígito hexadecimal).\n• Si la última cifra del número de serie es IMPAR:\n  Aplica operación XOR entre el segundo dígito hexadecimal y la última cifra de la serie (módulo 16).',
      },
      {
        condition: 'CASO 2: EL PRIMER CARÁCTER TRAS «0x» ES UNA LETRA (A a la F):',
        action:
          '• Si la última cifra del número de serie es PAR:\n  Aplica operación XOR entre el primer dígito hexadecimal y el segundo dígito hexadecimal.\n• Si la última cifra del número de serie es IMPAR:\n  Invierte los 4 bits del segundo dígito hexadecimal (resta el valor del segundo dígito a 15: ej. 15 - F = 0, 15 - A = 5).',
      },
      {
        condition: 'CONFIGURACIÓN DE LOS 4 RELÉS (1 = ARRIBA, 0 = ABAJO):',
        action:
          'Localiza el valor hexadecimal obtenido (0 a F) en la tabla de referencia superior:\n• R1 = Primer bit (Bit más significativo)\n• R2 = Segundo bit\n• R3 = Tercer bit\n• R4 = Cuarto bit (Bit menos significativo)\nColoca cada interruptor en su posición y pulsa «ENCLAVAR RELÉS».',
      },
    ],
    notes: [
      'Ejemplo: Registro 0x3A con número de serie terminado en 4 (PAR). El primer carácter «3» es numérico y la serie es par → resultado = A (segundo dígito). Según la tabla, A = 1010 → R1 = ARRIBA, R2 = ABAJO, R3 = ARRIBA, R4 = ABAJO.',
      'El Operador puede conmutar los relés libremente sin penalización. La validación ocurre solo al pulsar «ENCLAVAR RELÉS». Un envío erróneo sumará como máximo 1 Strike.',
    ],
  },

  // 7. RADAR VECTORIAL
  {
    moduleType: 'RADAR_VECTORIAL',
    category: 'NAVEGACIÓN',
    title: 'Radar de Coordenadas Tácticas',
    subtitle: 'Identificación de Baliza de Intercepción',
    classificationCode: 'DOC-NAV-07',
    division: 'Navegación y Radares',
    visualIdentification:
      'Una pantalla CRT táctica circular muestra un haz de barrido giratorio y cuatro contactos de radar: TANGO (Noroeste), SIERRA (Noreste), BRAVO (Sureste) y ECHO (Suroeste). Los 3 anillos concéntricos marcan la distancia (1 = interior, 3 = exterior).',
    identificationChecklist: [
      'Pantalla circular de radar con haz giratorio HORARIO o ANTIHORARIO.',
      'Cuatro contactos tácticos rotulados: TANGO, SIERRA, BRAVO y ECHO.',
      'Tres anillos concéntricos numerados del 1 (interior) al 3 (exterior).',
      'Pulsador de fijación «BLOQUEAR VECTOR».',
    ],
    description:
      'Un contacto espurio interfiere el sistema de navegación. El Operador comunica el sentido de giro del haz (HORARIO o ANTIHORARIO) y la posición en anillos de cada contacto. Los Guías determinan cuál es el objetivo auténtico y el Operador pulsa sobre él antes de bloquear el vector.',
    rules: [
      {
        condition: 'Si el haz gira en sentido HORARIO:',
        action: 'El objetivo auténtico es el contacto en el anillo MÁS EXTERIOR (mayor número). En caso de empate, prioriza el orden horario tras el Norte: SIERRA > BRAVO > ECHO > TANGO.',
      },
      {
        condition: 'Si el haz gira en sentido ANTIHORARIO:',
        action: 'El objetivo auténtico es el contacto en el anillo MÁS INTERIOR (menor número). En caso de empate, prioriza los contactos del hemisferio Sur: BRAVO > ECHO > TANGO > SIERRA.',
      },
    ],
    notes: [
      'El Operador debe pulsar sobre la baliza correcta en la pantalla y confirmar con «BLOQUEAR VECTOR».',
      'Bloquear un señuelo falso activará la contramedida defensiva (Strike).',
    ],
  },

  // 8. SEÑAL ÓPTICA
  {
    moduleType: 'SEÑAL_OPTICA',
    category: 'COMUNICACIONES',
    title: 'Transmisor Óptico',
    subtitle: 'Decodificación de Pulsos de Baliza',
    classificationCode: 'DOC-OPT-08',
    division: 'Transmisiones y Señales',
    visualIdentification:
      'Lámpara estroboscópica ámbar central grande que parpadea emitiendo un patrón rítmico repetitivo de 3 destellos (Cortos o Largos), sintonizador selector de frecuencia y pulsador «TRANSMITIR».',
    identificationChecklist: [
      'Foco o cúpula estroboscópica ámbar central.',
      'Emisión rítmica periódica de 3 pulsos (Cortos ~0.3s y Largos ~1.0s con pausa de 2s).',
      'Selector de frecuencia en MHz con menú desplegable o selector de dial.',
      'Botón de confirmación «TRANSMITIR».',
    ],
    description:
      'Una baliza óptica emite un mensaje codificado en 3 pulsos lumínicos. El Operador describe la secuencia de destellos a los Guías para que identifiquen la frecuencia de radio correcta en la tabla y la sintonice.',
    tableHeaders: ['Estación', 'Frecuencia', 'Patrón de Destellos'],
    tableRows: [
      ['CENTINELA', '88.4 MHz', 'Corto - Largo - Corto ( • ▬ • )'],
      ['VANGUARDIA', '92.1 MHz', 'Largo - Largo - Corto ( ▬ ▬ • )'],
      ['FARO NORTE', '96.5 MHz', 'Corto - Corto - Largo ( • • ▬ )'],
      ['OMEGA', '101.8 MHz', 'Largo - Corto - Largo ( ▬ • ▬ )'],
      ['CONDOR', '104.2 MHz', 'Corto - Largo - Largo ( • ▬ ▬ )'],
      ['METEORO', '107.9 MHz', 'Largo - Corto - Corto ( ▬ • • )'],
    ],
    rules: [
      {
        condition: '1. El Operador cuenta la duración de los 3 pulsos luminosos sucesivos.',
        action: 'Un pulso CORTO dura ~0.3s. Un pulso LARGO dura ~1.0s. Hay una pausa larga entre ciclos.',
      },
      {
        condition: '2. Los Guías localizan la estación en la tabla y dictan su frecuencia exacta.',
        action: 'El Operador selecciona la frecuencia en el sintonizador y presiona «TRANSMITIR».',
      },
    ],
    notes: [
      'El botón «REPETIR CICLO» permite al Operador reiniciar la visualización lumínica.',
      'Sintonizar una frecuencia errónea delatará la posición a la red hostil (Strike).',
    ],
  },

  // 9. TECLADO MAESTRO
  {
    moduleType: 'TECLADO_MAESTRO',
    category: 'COMUNICACIONES',
    title: 'Teclado de Autenticación Maestro',
    subtitle: 'Descifrado de Contraseña de Desbloqueo',
    classificationCode: 'DOC-KEY-09',
    division: 'Criptografía y Protocolos',
    visualIdentification:
      'Teclado numérico 0-9 con visor de display de 4 dígitos, pantalla con el número de serie de la máquina (ej: «SEC-527-X4»), LED de Alimentación Auxiliar (ENCENDIDO / APAGADO), tecla de borrado [C] y tecla «ENTER».',
    identificationChecklist: [
      'Teclado matricial numérico clásico 3x4 (dígitos 0 al 9).',
      'Pantalla LCD digital superior que muestra 4 dígitos de PIN.',
      'Visor con el número de serie de la máquina (ej: «SEC-527-X4»).',
      'Indicador LED de Alimentación Auxiliar.',
    ],
    description:
      'Un teclado numérico protegido requiere un código PIN de 4 cifras. El código se deriva aplicando el protocolo criptográfico sobre las cifras numéricas del número de serie de la máquina y el estado del LED auxiliar.',
    rules: [
      {
        condition: 'LECTURA DEL NÚMERO DE SERIE:',
        action:
          'Para este protocolo, ignora las letras y símbolos del número de serie de la máquina. Utiliza únicamente sus cifras numéricas, leídas de izquierda a derecha (Ejemplo de lectura: SEC-527-X4 → 5 · 2 · 7 · 4). La primera cifra numérica es D1, la segunda D2, la tercera D3 y la cuarta D4.',
      },
      {
        condition: '1.ª cifra numérica del PIN (D1):',
        action:
          'Toma la 1.ª cifra numérica del serial (D1). Súmale 3 si el LED auxiliar está ENCENDIDO, o súmale 1 si está APAGADO. Si el resultado es mayor que 9, quédate con la última cifra (o mod 10).',
      },
      {
        condition: '2.ª cifra numérica del PIN (D2):',
        action:
          'Toma la 2.ª cifra numérica del serial (D2) y súmale 5. Si el resultado es mayor que 9, quédate con la última cifra (o mod 10).',
      },
      {
        condition: '3.ª cifra numérica del PIN (D3):',
        action:
          'Toma la 3.ª cifra numérica del serial (D3) y réstale 2. Si el resultado da negativo, toma su valor positivo absoluto (|D3 - 2|).',
      },
      {
        condition: '4.ª cifra numérica del PIN (D4):',
        action:
          'Toma la 4.ª cifra numérica del serial (D4) y multiplícala por 2. Si el resultado es mayor que 9, quédate con la última cifra (o mod 10).',
      },
    ],
    notes: [
      'REGLA DE EXTRACCIÓN: Ignora letras y guiones. En un serial como SEC-527-X4, las 4 cifras son D1=5, D2=2, D3=7 y D4=4 (el 4 final cuenta).',
      'Ejemplo con SEC-527-X4 y LED ENCENDIDO: D1=(5+3=8), D2=(2+5=7), D3=(|7-2|=5), D4=(4×2=8) → PIN = 8758.',
      'El Operador introduce las 4 cifras del PIN calculado y pulsa «ENTER».',
      'Introducir un PIN erróneo sumará 1 Strike y reiniciará la entrada.',
    ],
  },

  // 10. PALANCA DE SOBRECARGA
  {
    moduleType: 'PALANCA_SOBRECARGA',
    category: 'CONTROL',
    title: 'Palanca de Sobrecarga',
    subtitle: 'Descarga Magnética Sincronizada con el Cronómetro',
    classificationCode: 'DOC-NRG-10',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Palanca industrial pesada con guarda de seguridad a rayas amarillas y negras, barra luminiscente en su base (AZUL, AMARILLA o ROJA) y cronómetro de la misión visible en el visor superior.',
    identificationChecklist: [
      'Palanca industrial alojada en ranura vertical.',
      'Franja luminiscente de carga en la base: AZUL, AMARILLA o ROJA.',
      'Sincronización requerida con el último dígito del segundero de la misión.',
    ],
    description:
      'Una palanca industrial acumula energía estática parásita. La descarga solo es segura cuando el último dígito del segundero de la misión coincide con el ciclo armónico de la franja luminosa.',
    rules: [
      {
        condition: 'Si la franja es AZUL:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea exactamente 3 o 7 (ej: 03:43, 02:17).',
      },
      {
        condition: 'Si la franja es AMARILLA:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea PAR (0, 2, 4, 6 u 8).',
      },
      {
        condition: 'Si la franja es ROJA:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea exactamente 5 o 9 (ej: 04:15, 01:09).',
      },
    ],
    notes: [
      '¡Atención al segundero global de la misión visible en la parte superior del panel!',
      'Accionar la palanca en cualquier otro segundo producirá una descarga violenta y 1 Strike.',
    ],
  },

  // 11. COMPUERTAS LÓGICAS
  {
    moduleType: 'COMPUERTAS_LOGICAS',
    category: 'SISTEMAS',
    title: 'Compuertas Lógicas',
    subtitle: 'Ruteo de Shunts de Silicio',
    classificationCode: 'DOC-LOG-11',
    division: 'Lógica Digital y Cómputo',
    visualIdentification:
      'Un circuito integrado procesa dos entradas lógicas fijas (A y B) con valores 0 o 1. El chip lleva impresa la denominación de la compuerta (AND, OR, XOR o NAND). Debajo se encuentran tres interruptores de patillaje [Pin 1], [Pin 2], [Pin 3] y botón «ENERGIZAR».',
    identificationChecklist: [
      'Chip integrado con tipo de compuerta grabado (AND, OR, XOR o NAND).',
      'Valores de entrada binarios A (0 o 1) y B (0 o 1).',
      'Tres interruptores de salida: Pin 1, Pin 2 y Pin 3.',
      'Pulsador de confirmación «ENERGIZAR».',
    ],
    description:
      'Un circuito combinacional requiere configurar los pines de derivación según el resultado binario de la compuerta para permitir el paso seguro de la corriente.',
    rules: [
      {
        condition: 'Compuerta AND:',
        action: 'Salida = 1 solo si A=1 y B=1. En cualquier otro caso, Salida = 0.',
      },
      {
        condition: 'Compuerta OR:',
        action: 'Salida = 1 si A=1 o B=1 (o ambos). Si A=0 y B=0, Salida = 0.',
      },
      {
        condition: 'Compuerta XOR:',
        action: 'Salida = 1 si A y B son DISTINTOS (uno es 0 y el otro 1). Si son iguales, Salida = 0.',
      },
      {
        condition: 'Compuerta NAND:',
        action: 'Salida = 0 solo si A=1 y B=1. En cualquier otro caso, Salida = 1.',
      },
      {
        condition: 'Ruteo final de Pines:',
        action: '• Si el resultado de la compuerta es 1: ACTIVA los Pines 1 y 3 (deja Pin 2 apagado).\n• Si el resultado es 0: ACTIVA únicamente el Pin 2 (deja Pines 1 y 3 apagados).',
      },
    ],
    notes: [
      'El Operador configura los interruptores de los Pines 1, 2 y 3 y presiona «ENERGIZAR».',
      'Una combinación incorrecta activará el disyuntor de seguridad (Strike).',
    ],
  },

  // 12. REFRIGERANTE QUÍMICO
  {
    moduleType: 'REFRIGERANTE_QUIMICO',
    category: 'ENERGÍA',
    title: 'Refrigerante Químico',
    subtitle: 'Neutralización de Reactivos Térmicos',
    classificationCode: 'DOC-CHM-12',
    division: 'Fluidos y Termodinámica',
    visualIdentification:
      'Tres matraces dosifican agentes de enfriamiento: Criolita (Azul), Xenón (Verde) y Pirógeno (Rojo), regulables de nivel 0 a 5 mediante deslizadores. Una tira reactiva de pH en el centro muestra un color (PÚRPURA, CIAN, NARANJA o LIMA). En la base se ubica el botón «INYECTAR MEZCLA».',
    identificationChecklist: [
      'Tres matraces cilíndricos con fluidos Criolita (Azul), Xenón (Verde) y Pirógeno (Rojo).',
      'Deslizadores verticales con niveles discretos del 0 al 5.',
      'Tira reactiva central de color: PÚRPURA, CIAN, NARANJA o LIMA.',
      'Pulsador de inyección «INYECTAR MEZCLA».',
    ],
    description:
      'Para neutralizar el sobrecalentamiento criogénico, se deben dosificar las proporciones exactas de los 3 agentes según el color de la tira reactiva.',
    tableHeaders: ['Tira Reactiva', 'Criolita (Azul)', 'Xenón (Verde)', 'Pirógeno (Rojo)'],
    tableRows: [
      ['PÚRPURA', 'Nivel 4', 'Nivel 1', 'Nivel 3'],
      ['CIAN', 'Nivel 2', 'Nivel 4', 'Nivel 1'],
      ['NARANJA', 'Nivel 3', 'Nivel 3', 'Nivel 5'],
      ['LIMA', 'Nivel 1', 'Nivel 5', 'Nivel 2'],
    ],
    rules: [
      {
        condition: '1. Identificación del color reactivo:',
        action: 'El Operador comunica el color de la tira reactiva central (Púrpura, Cian, Naranja o Lima).',
      },
      {
        condition: '2. Ajuste de deslizadores:',
        action: 'El Operador ajusta los 3 matraces exactamente a los niveles estequiométricos indicados en la tabla.',
      },
      {
        condition: '3. Inyección del compuesto:',
        action: 'Presiona «INYECTAR MEZCLA» para estabilizar la temperatura.',
      },
    ],
    notes: [
      'Una proporción incorrecta generará una reacción violenta y 1 Strike.',
    ],
  },

  // 13. PUERTOS DE CONEXIÓN
  {
    moduleType: 'PUERTOS_CONEXION',
    category: 'ELECTRICIDAD',
    title: 'Placa de Conexiones Auxiliares',
    subtitle: 'Enrutamiento de Parcheo Auxiliar',
    classificationCode: 'DOC-NET-13',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Panel frontal con terminales de cable fuente a la izquierda (Rojo, Amarillo, Azul, Verde*, Blanco*), placa indicadora de bus (BUS-ALFA, BUS-BETA, BUS-GAMMA o BUS-DELTA) y un banco de clavijas jack hembra numeradas (J1 a J7, J8 o J10). Botón «ENLAZAR SEÑAL».',
    identificationChecklist: [
      'Terminales de cable fuente rotulados por color a la izquierda.',
      'Banco de clavijas jack de destino rotuladas (J1..J10).',
      'Placa indicadora del bus activo: BUS-ALFA, BUS-BETA, BUS-GAMMA o BUS-DELTA.',
      'Botón inferior de verificación «ENLAZAR SEÑAL».',
    ],
    description:
      'El cuadro de conmutación auxiliar desvía las líneas de potencia del sistema. El Operador debe comunicar el código del bus y los cables presentes. Los Guías determinan la clavija destino para cada cable consultando la tabla de paridad de la cifra final del número de serie.',
    rules: [
      {
        condition: '1. Comprobación de la última cifra del número de serie:',
        action:
          'Localiza la última cifra numérica del número de serie de la máquina (0-9). Determina si es PAR (0, 2, 4, 6, 8) o IMPAR (1, 3, 5, 7, 9) para seleccionar la tabla de enrutamiento aplicable.',
      },
      {
        condition: '2. Identificación del bus de señal activo:',
        action:
          'El Operador comunica el código del bus (BUS-ALFA, BUS-BETA, BUS-GAMMA o BUS-DELTA).',
      },
      {
        condition: '3. Enrutamiento físico de cada cable fuente:',
        action:
          'Para cada cable presente en el panel, el Operador arrastra el conector del extremo libre y lo enchufa en la clavija jack especificada en la fila del bus correspondiente. Cada jack admite como máximo 1 cable.',
      },
      {
        condition: '4. Enlace y confirmación del circuito:',
        action:
          'Una vez conectados TODOS los cables requeridos en sus respectivas clavijas, el Operador presiona «ENLAZAR SEÑAL». Si la configuración es correcta el panel quedará estabilizado.',
      },
    ],
    tableHeaders: ['Bus Señal', 'C. Rojo', 'C. Amarillo', 'C. Azul', 'C. Verde*', 'C. Blanco*'],
    tableRows: [
      ['[SERIE PAR]', '---', '---', '---', '---', '---'],
      ['BUS-ALFA', 'J1', 'J4', 'J6', 'J2', 'J7'],
      ['BUS-BETA', 'J3', 'J1', 'J5', 'J7', 'J2'],
      ['BUS-GAMMA', 'J5', 'J2', 'J7', 'J4', 'J9'],
      ['BUS-DELTA', 'J2', 'J6', 'J3', 'J8', 'J10'],
      ['[SERIE IMPAR]', '---', '---', '---', '---', '---'],
      ['BUS-ALFA', 'J4', 'J2', 'J7', 'J5', 'J8'],
      ['BUS-BETA', 'J6', 'J3', 'J1', 'J2', 'J9'],
      ['BUS-GAMMA', 'J2', 'J7', 'J5', 'J1', 'J10'],
      ['BUS-DELTA', 'J7', 'J1', 'J4', 'J6', 'J3'],
    ],
    notes: [
      '(*) Los cables Verde y Blanco se incorporan únicamente en dificultades avanzadas.',
      'El Operador puede mover, corregir y recolocar cualquier cable libremente antes de pulsar «ENLAZAR SEÑAL» sin penalización.',
      'Pulsar «ENLAZAR SEÑAL» con una disposición errónea provocará 1 Strike de aviso.',
      'Ejemplo didáctico: En una máquina con serie terminada en 8 (par) y BUS-BETA, el Cable Rojo se conecta a J3, el Cable Amarillo a J1 y el Cable Azul a J5.',
    ],
  },

  // 14. DISIPADOR TÉRMICO
  {
    moduleType: 'DISIPADOR_TERMICO',
    category: 'ENERGÍA',
    title: 'Disipador Térmico',
    subtitle: 'Aletas de Expulsión de Radiación',
    classificationCode: 'DOC-THM-14',
    division: 'Fluidos y Termodinámica',
    visualIdentification:
      'Rejilla con 4 compuertas motorizadas orientadas a los puntos cardinales (NORTE, SUR, ESTE, OESTE), indicador de vector de flujo convectivo de viento e indicador de nivel de alerta (ALERTA-AMARILLA, ALERTA-NARANJA o ALERTA-ROJA). Botón «FIJAR ALETAS».',
    identificationChecklist: [
      'Cuatro aletas conmutables entre ABIERTA y CERRADA (Norte, Sur, Este, Oeste).',
      'Flecha indicadora de dirección de flujo de calor convectivo.',
      'Insignia de alerta térmica: ALERTA-AMARILLA, ALERTA-NARANJA o ALERTA-ROJA.',
      'Pulsador de enclavamiento «FIJAR ALETAS».',
    ],
    description:
      'El calor del reactor debe evacuarse de forma asimétrica para no derretir el blindaje. El Operador orienta las aletas según el flujo del aire caliente y el grado de alerta reportado.',
    rules: [
      {
        condition: 'Si la alerta es ALERTA-AMARILLA:',
        action: '• Si el flujo es NORTE: abre SUR y ESTE.\n• Si es SUR: abre NORTE y OESTE.\n• Si es ESTE: abre NORTE y OESTE.\n• Si es OESTE: abre SUR y ESTE.',
      },
      {
        condition: 'Si la alerta es ALERTA-NARANJA:',
        action: '• Si el flujo es NORTE o SUR: abre ESTE y OESTE (cierra Norte y Sur).\n• Si es ESTE u OESTE: abre NORTE y SUR (cierra Este y Oeste).',
      },
      {
        condition: 'Si la alerta es ALERTA-ROJA:',
        action: 'Abre 3 aletas y cierra ÚNICAMENTE la aleta que apunta en la dirección del flujo de viento.',
      },
    ],
    notes: [
      'El Operador conmuta cada aleta entre ABIERTA y CERRADA y pulsa «FIJAR ALETAS».',
      'Configurar una combinación incorrecta sobrecalentará el fuselaje (Strike).',
    ],
  },

  // 15. SINCRONIZADOR DE FASES
  {
    moduleType: 'SINCRONIZADOR_FASES',
    category: 'SISTEMAS',
    title: 'Sincronizador de Fases Cuánticas',
    subtitle: 'Alineación de Anillos de Aceleración',
    classificationCode: 'DOC-ROT-15',
    division: 'Mecánica y Cinemática',
    visualIdentification:
      'Dos anillos circulares concéntricos graduados en pasos angulares de 60° (0°, 60°, 120°, 180°, 240°, 300°). El Anillo Interior está bloqueado en una posición fija. El Operador hace girar el Anillo Exterior mediante los mandos de giro. Indicador de modo (MODO-RESONANTE o MODO-INVERSO) y botón «ENCLAVAR FASE».',
    identificationChecklist: [
      'Dos anillos concéntricos con muescas graduadas cada 60 grados.',
      'Anillo Interior fijo con aguja de referencia.',
      'Anillo Exterior móvil con botones de giro paso a paso.',
      'Indicador de modo de fase: MODO-RESONANTE o MODO-INVERSO.',
    ],
    description:
      'Dos rotores desfasados generan turbulencia magnética. El Operador debe alinear el Anillo Exterior al ángulo exacto respecto al Anillo Interior antes de acoplar la fase.',
    rules: [
      {
        condition: 'Si el sistema indica MODO-RESONANTE:',
        action: 'Gira el anillo exterior hasta que su marcador marque exactamente +120° en sentido horario respecto al anillo interior (Anillo Exterior = Anillo Interior + 120°, si pasa de 360° resta 360).',
      },
      {
        condition: 'Si el sistema indica MODO-INVERSO:',
        action: 'Gira el anillo exterior a la posición diametralmente opuesta (+180°) respecto al anillo interior (Anillo Exterior = Anillo Interior + 180°, si pasa de 360° resta 360).',
      },
    ],
    notes: [
      'Ejemplo en Modo Resonante: Si el Anillo Interior está en 60°, el Exterior debe situarse a 180° (60 + 120 = 180°).',
      'Una vez alineados, el Operador pulsa «ENCLAVAR FASE». Acoplar a destiempo sumará 1 Strike.',
    ],
  },

  // 16. CALIBRADOR GIROSCÓPICO INERCIAL
  {
    moduleType: 'CALIBRADOR_GIROSCOPIO',
    category: 'NAVEGACIÓN',
    title: 'Calibrador Giroscópico Inercial',
    subtitle: 'Nivelación de Horizonte Artificial y Azimut',
    classificationCode: 'DOC-NAV-16',
    division: 'Navegación y Radares',
    visualIdentification:
      'Instrumento esférico de horizonte artificial con visualización de cabeceo (Pitch) e inclinación (Roll), dial perimetral de rumbo en grados (0° a 360°), selector de eje (Eje X, Eje Y, Eje Z), indicador LED auxiliar y botones de ajuste fino/grueso con pulsador «FIJAR RUMBO».',
    identificationChecklist: [
      'Instrumento circular de horizonte artificial con esfera bicolor.',
      'Escala de cabeceo graduada (+/- grados) y líneas de horizonte.',
      'Rosa perimetral de rumbo azimutal en 360 grados.',
      'Selector de eje (Eje X, Y, Z) y botón «FIJAR RUMBO».',
    ],
    description:
      'La plataforma inercial ha sufrido deriva por turbulencia. El Operador debe comunicar el eje seleccionado, el estado del cabeceo y el rumbo inicial. El Guía calcula el ángulo de compensación exacto y el Operador calibra la esfera antes de bloquear el rumbo.',
    rules: [
      {
        condition: 'PASO 1: SELECCIÓN DEL EJE Y DERIVA BASE',
        action:
          '• Si el panel marca EJE X:\n  - Si la última cifra del número de serie es IMPAR → Deriva base = Azimut actual + 45°.\n  - Si es PAR → Deriva base = Azimut actual + 90°.\n• Si el panel marca EJE Y:\n  - Si la serie es IMPAR → Deriva base = Azimut actual + 180°.\n  - Si es PAR → Deriva base = Azimut actual + 30°.\n• Si el panel marca EJE Z:\n  - Si la serie es IMPAR → Deriva base = Azimut actual + 60°.\n  - Si es PAR → Deriva base = Azimut actual + 120°.',
      },
      {
        condition: 'PASO 2: COMPENSACIÓN POR CABECEO (PITCH)',
        action:
          '• Si el cabeceo marca SUBIENDO (+) → Suma +15° al ángulo.\n• Si el cabeceo marca BAJANDO (-) → Resta -15° al ángulo.\n• Si marca ESTABLE (=) → No apliques corrección por cabeceo.',
      },
      {
        condition: 'PASO 3: INVERSIÓN POR LED AUXILIAR',
        action:
          '• Si el LED auxiliar parpadea en color ÁMBAR, invierte la compensación del Paso 2 (si sumaba, resta; si restaba, suma).\n• Si el LED está en VERDE o apagado, conserva la corrección del Paso 2.',
      },
      {
        condition: 'PASO 4: CALIBRACIÓN Y BLOQUEO',
        action:
          'Obtén el RUMBO OBJETIVO calculado en los pasos anteriores.\n\n• Si el resultado supera 359°, resta 360° hasta que quede entre 0° y 359°.\n• Si el resultado es negativo, suma 360° hasta que quede entre 0° y 359°.\n\nComunica el resultado al Operador. El Operador deberá ajustar el rumbo a ese valor (se admite un margen de ±2°) y pulsar «FIJAR RUMBO».\n\nEJEMPLO:\n• 382° → 22°  (porque 382° - 360° = 22°)\n• -15° → 345°  (porque -15° + 360° = 345°)',
      },
    ],
    notes: [
      'Si el resultado excede 360°, resta 360. Si es negativo, suma 360.',
      'Fijar el rumbo con una desviación mayor a 2 grados provocará una desorientación inercial y un Strike.',
    ],
  },

  // 17. REACTOR DE PLASMA
  {
    moduleType: 'REACTOR_PLASMA',
    category: 'ENERGÍA',
    title: 'Contención de Plasma Cuántico',
    subtitle: 'Equilibrio de Bobinas de Confinamiento Magnético',
    classificationCode: 'DOC-PLAS-17',
    division: 'Física Cuántica y Plasma',
    visualIdentification:
      'Cámara cilíndrica blindada con un núcleo de plasma brillante en su interior (de color Azul Neón, Púrpura Iónico, Verde Tóxico o Ámbar Solar), indicador de temperatura en Kelvin, tres deslizadores de campo magnético graduados del 1 al 5 (Bobina Alfa α, Beta β y Gamma γ), y botón con tapa de seguridad «ESTABILIZAR FLUJO».',
    identificationChecklist: [
      'Cámara de confinamiento cilíndrica con núcleo de plasma luminoso.',
      'Color característico del isótopo (Azul Neón, Púrpura, Verde, Ámbar).',
      'Visor numérico de temperatura del reactor en Kelvin (K).',
      'Tres deslizadores verticales de bobina magnética (α, β, γ).',
    ],
    description:
      'El plasma confinado en la cámara corre peligro de tocar las paredes de contención. El Operador reporta el color del isótopo del núcleo, la temperatura del núcleo y la lectura de los deslizadores. El Guía busca la matriz de equilibrio magnético para fijar los tres niveles antes de estabilizar.',
    rules: [
      {
        condition: 'ISÓTOPO AZUL NEÓN (Plasma de Helio-3)',
        action:
          '• Bobina Alfa (α) = 4 fijada obligatoriamente.\n• Si el número de serie de la máquina contiene al menos UNA VOCAL (A, E, I, O, U) → Bobina Beta (β) = 2 y Bobina Gamma (γ) = 3.\n• Si el número de serie NO contiene vocales → Bobina Beta (β) = 3 y Bobina Gamma (γ) = 1.',
      },
      {
        condition: 'ISÓTOPO PÚRPURA IÓNICO (Plasma de Xenón)',
        action:
          '• Bobina Beta (β) = 5 fijada obligatoriamente.\n• Si la última cifra del número de serie es IMPAR → Bobina Alfa (α) = 2 y Bobina Gamma (γ) = 4.\n• Si la última cifra es PAR → Bobina Alfa (α) = 3 y Bobina Gamma (γ) = 2.',
      },
      {
        condition: 'ISÓTOPO VERDE TÓXICO (Plasma de Antimateria)',
        action:
          '• Bobina Gamma (γ) = 4 fijada obligatoriamente.\n• Si la temperatura del reactor supera los 4000 K → Bobina Alfa (α) = 3 y Bobina Beta (β) = 2.\n• Si la temperatura es de 4000 K o inferior → Bobina Alfa (α) = 1 y Bobina Beta (β) = 5.',
      },
      {
        condition: 'ISÓTOPO ÁMBAR SOLAR (Plasma Tritiado)',
        action:
          '• Alfa (α) = 4, Beta (β) = 2, Gamma (γ) = 3.',
      },
    ],
    notes: [
      'Una vez configurados los tres deslizadores Alfa, Beta y Gamma, el Operador pulsa «ESTABILIZAR FLUJO».',
      'Un confinamiento asimétrico provocará una brecha en la cámara y un Strike inmediato.',
    ],
  },

  // 18. ATENUADOR ACÚSTICO DE RESONANCIA
  {
    moduleType: 'FRECUENCIA_RESONANCIA',
    category: 'SEÑAL',
    title: 'Atenuador Acústico de Resonancia',
    subtitle: 'Amortiguación de Armónicos Ultrasónicos Destructivos',
    classificationCode: 'DOC-SON-18',
    division: 'Transmisiones y Señales',
    visualIdentification:
      'Pantalla de espectro de audio con 6 barras ecualizadoras dinámicas (60Hz, 250Hz, 1kHz, 4kHz, 8kHz, 16kHz) donde una banda crítica vibra en sobrecarga roja; estado de cámara («ALTA PRESIÓN» o «VACÍO PARCIAL»); cuatro interruptores de filtro [F1 Pasabajos], [F2 Notch], [F3 Pasoaltos], [F4 Inversor], y botón luminoso «APLICAR ATENUACIÓN».',
    identificationChecklist: [
      'Ecualizador gráfico con 6 barras verticales de frecuencia.',
      'Una barra espectral vibrando en rojo de sobrecarga crítica.',
      'Indicador de estado de cámara (Alta Presión / Vacío Parcial).',
      'Cuatro conmutadores de filtro [F1, F2, F3, F4] y botón de atenuación.',
    ],
    description:
      'La vibración acústica en las toberas está entrando en resonancia catastrófica. El Operador identifica la frecuencia pico en sobrecarga y el estado de la cámara. El Guía busca los dos o tres filtros que deben activarse para amortiguar el armónico.',
    tableHeaders: ['Frecuencia Pico', 'Condición de la Máquina', 'Filtros a Activar'],
    tableRows: [
      ['60 Hz', 'Cámara en ALTA PRESIÓN', 'Activar F1 (Pasabajos) y F4 (Inversor)'],
      ['60 Hz', 'Cámara en VACÍO PARCIAL', 'Activar F1 (Pasabajos) y F2 (Notch)'],
      ['250 Hz', 'Última cifra de la serie es PAR', 'Activar F2 (Notch) y F3 (Pasoaltos)'],
      ['250 Hz', 'Última cifra de la serie es IMPAR', 'Activar F1 (Pasabajos) y F3 (Pasoaltos)'],
      ['1 kHz', 'La serie contiene la letra C o R', 'Activar F2 (Notch) y F4 (Inversor)'],
      ['1 kHz', 'La serie no contiene C ni R', 'Activar F3 (Pasoaltos) y F4 (Inversor)'],
      ['4 kHz', 'Cualquier condición', 'Activar F1 (Pasabajos), F2 (Notch) y F4 (Inversor)'],
      ['8 kHz', 'Cualquier condición', 'Activar F1 (Pasabajos) y F4 (Inversor)'],
      ['16 kHz', 'Última cifra de la serie es IMPAR', 'Activar F3 (Pasoaltos) y F4 (Inversor)'],
      ['16 kHz', 'Última cifra de la serie es PAR', 'Activar F1 (Pasabajos) y F4 (Inversor)'],
    ],
    rules: [
      {
        condition: '1. Localización del Pico:',
        action: 'El Operador lee la frecuencia de la barra que está en color rojo parpadeante.',
      },
      {
        condition: '2. Verificación de la condición:',
        action: 'El Guía comprueba la fila correspondiente en la tabla armónica superior.',
      },
      {
        condition: '3. Activación y purga sonora:',
        action:
          'El Operador conmuta exactamente los interruptores indicados (los demás deben quedar apagados) y pulsa «APLICAR ATENUACIÓN».',
      },
    ],
    notes: [
      'Cualquier filtro encendido de más o de menos causará un pico de choque supersónico (Strike).',
    ],
  },

  // 19. SECUENCIA CINÉTICA DE PISTONES
  {
    moduleType: 'SECUENCIA_CINETICA',
    category: 'CONTROL',
    title: 'Bloqueo de Pistones Cinéticos',
    subtitle: 'Enclavamiento de Émbolos Neumáticos Interconectados',
    classificationCode: 'DOC-MEC-19',
    division: 'Mecánica y Cinemática',
    visualIdentification:
      'Fila horizontal de cuatro pistones metálicos numerados de izquierda a derecha (P-1, P-2, P-3, P-4). Cada pistón tiene un collar de color (Dorado, Carmesí, Cobalto o Esmeralda) y un recorrido visible (Corto, Medio o Largo). No hay botón de confirmación: cada pulsación en un pistón se evalúa inmediatamente.',
    identificationChecklist: [
      'Fila horizontal de 4 pistones mecánicos verticales (P1 a P4).',
      'Collarines de color en cada émbolo (Dorado, Carmesí, Cobalto, Esmeralda).',
      'Recorridos de carrera visibles (Corto, Medio o Largo).',
      'Pulsación secuencial directa sobre cada pistón sin botón de envío.',
    ],
    description:
      'Cuatro pistones mecánicos traban el engranaje maestro. Para retraerlos de forma segura, el Operador debe pulsar los cuatro pistones en el orden secuencial estricto deducido por el Guía. Cada acierto baja el pistón; un error reinicia el mecanismo.',
    rules: [
      {
        condition: 'PASO 1: PRIMER PISTÓN A ACCIONAR',
        action:
          '• Si hay algún pistón con collar Dorado → Pulsa el pistón Dorado con mayor recorrido (si hay empate, el situado más a la izquierda).\n• Si NO hay pistón Dorado pero hay al menos 2 pistones Carmesí → Pulsa el pistón Carmesí situado más a la derecha.\n• En cualquier otro caso → Pulsa el primer pistón Cobalto (o P-1 si no hay ninguno Cobalto).',
      },
      {
        condition: 'PASO 2: SEGUNDO PISTÓN A ACCIONAR',
        action:
          '• Si el pistón P-4 tiene collar Esmeralda → Pulsa inmediatamente P-1 (si aún no fue pulsado) o P-2.\n• Si la última cifra de la serie es mayor que 4 (5, 6, 7, 8, 9) → Pulsa el pistón inmediatamente contiguo a la derecha del pistón pulsado en el Paso 1 (si era P-4, pulsa P-1).\n• En cualquier otro caso → Pulsa el pistón P-3 (o el más a la izquierda aún disponible).',
      },
      {
        condition: 'PASO 3: TERCER PISTÓN A ACCIONAR',
        action:
          '• De los dos pistones que aún siguen levantados, pulsa aquel cuyo collar tenga color primario (Carmesí o Cobalto).\n• Si ambos o ninguno son primarios, pulsa el de menor numeración.',
      },
      {
        condition: 'PASO 4: CUARTO PISTÓN',
        action: '• Pulsa el único pistón restante para completar el desacople cinético.',
      },
    ],
    notes: [
      'Pulsar un pistón fuera del orden riguroso provocará el bloqueo violento de los émbolos, sumando 1 Strike y reiniciando los pistones levantados a su posición inicial.',
    ],
  },

  // 20. DIVISOR DE VOLTAJE
  {
    moduleType: 'DIVISOR_VOLTAJE',
    category: 'ELECTRICIDAD',
    title: 'Puente Potenciométrico de Precisión',
    subtitle: 'Nulificación Galvánica de Tensión Residual',
    classificationCode: 'DOC-VOLT-20',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Galvanómetro analógico de cero central (-50 mV a +50 mV con aguja móvil reactiva), conmutador de rango de resistencia [R1: Escala x1 | R2: Escala x2 | R3: Escala x3], dial rotatorio de ajuste de voltaje graduado de 00 a 99 con botones [+1] [+10] [-1] [-10] y palanca basculante «EQUILIBRAR PUENTE».',
    identificationChecklist: [
      'Galvanómetro analógico de cero central con aguja móvil reactiva.',
      'Escala curvada de deflexión (-50 mV a +50 mV).',
      'Conmutador de rango de resistencia (Escala R1, R2, R3).',
      'Dial de equilibrio digital graduado y palanca «EQUILIBRAR PUENTE».',
    ],
    description:
      'Un potencial residual en el puente de Wheatstone amenaza con quemar los microfusibles. El Operador reporta la deflexión de la aguja (+ o -) y la escala activa del conmutador R. El Guía calcula la resistencia de balance objetivo y el Operador sintoniza el dial antes de accionar la palanca.',
    rules: [
      {
        condition: '1. Multiplicación base según selector de escala R:',
        action:
          'Toma el valor absoluto de la deflexión en mV y multiplícalo según la escala activa:\n• Escala R1 → Multiplica por 1.\n• Escala R2 → Multiplica por 2.\n• Escala R3 → Multiplica por 3.',
      },
      {
        condition: '2. Rama A: Si la deflexión original es POSITIVA (+):',
        action:
          '• Valor preliminar = (Valor multiplicado + 15).\n• Si el número de serie termina en cifra IMPAR, suma +10 adicionales.\n• Normaliza el valor en módulo 100 (si pasa de 100, réstale 100). Este es el Valor Objetivo.',
      },
      {
        condition: '3. Rama B: Si la deflexión original es NEGATIVA (-):',
        action:
          '• Valor preliminar = 100 - (Valor multiplicado mod 100).\n• Si el número de serie contiene la letra X o K, resta 5 unidades.\n• Normaliza en módulo 100 (si es negativo, suma 100). Este es el Valor Objetivo.',
      },
      {
        condition: '4. Ajuste y Nulificación:',
        action:
          'El Operador ajusta el dial digital al Valor Objetivo exacto y acciona la palanca «EQUILIBRAR PUENTE».',
      },
    ],
    notes: [
      'Al accionar la palanca con el dial en la posición correcta, la aguja caerá suavemente a 0 mV exactos y el módulo quedará resuelto.',
      'Un balance incorrecto producirá una sobretensión galvánica y un Strike.',
    ],
  },
];
