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
      'Panel rectangular con entre 3 y 6 cables verticales suspendidos entre bornes metálicos. Los cables pueden ser lisos o tener franjas de color. Hay un indicador luminoso LED y una placa de sector (ej. C-14 o SEC-R7).',
    identificationChecklist: [
      'Entre 3 y 6 cables verticales suspendidos entre bornes superior e inferior.',
      'Cables de colores lisos o con franjas bicolores.',
      'Diodo LED piloto superior de color Ámbar/Verde/Rojo.',
      'Chapa metálica de sector de alta tensión.',
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
    subtitle: 'Sintonización Armónica de Canales Portadores',
    classificationCode: 'DOC-WAV-02',
    division: 'Transmisiones y Señales',
    visualIdentification:
      'Pantalla de osciloscopio verde con forma de onda visible (Senoide, Triangular, Cuadrada o Diente de Sierra), visor digital de frecuencia en kHz, selector de canal (CH-1 a CH-4) y botones [-] [+] con tecla «CALIBRAR».',
    identificationChecklist: [
      'Pantalla verde de osciloscopio con retícula milimétrica.',
      'Forma de onda oscilante visible (Senoide, Triangular, Cuadrada, Diente Sierra).',
      'Visor numérico digital de frecuencia base en kHz.',
      'Selector de canales CH-1 a CH-4 y pulsador «CALIBRAR».',
    ],
    description:
      'El oscilador genera una portadora desfasada. Consulta la tabla de compensación según el canal y la onda para calcular la frecuencia de calibración exacta.',
    tableHeaders: ['Forma de Onda', 'CH-1', 'CH-2', 'CH-3', 'CH-4'],
    tableRows: [
      ['Senoide (~)', '+25 kHz', '-15 kHz', '+40 kHz', '+10 kHz'],
      ['Triangular (/\\)', '+10 kHz', '+30 kHz', '-20 kHz', '+35 kHz'],
      ['Cuadrada (П)', '-30 kHz', '+20 kHz', '+15 kHz', '-10 kHz'],
      ['Diente Sierra (/|)', '+45 kHz', '-25 kHz', '+10 kHz', '+50 kHz'],
    ],
    rules: [
      {
        condition: '1. Identifica el canal y la forma de onda que ve el Operador.',
        action: 'Cruza fila y columna en la tabla superior para obtener el desfase base en kHz.',
      },
      {
        condition: '2. Corrección por número de serie:',
        action:
          'Si el número de serie de la máquina termina en cifra PAR, suma +5 kHz al desfase. Si termina en IMPAR, resta -5 kHz.',
      },
      {
        condition: '3. Frecuencia final de sintonización:',
        action:
          'Frecuencia Objetivo = Frecuencia Base indicada en pantalla + Desfase corregido. El Operador ajusta los mandos y pulsa «CALIBRAR».',
      },
    ],
    notes: [
      'Pulsar «CALIBRAR» con una frecuencia desviada provocará una ruptura por resonancia (Strike).',
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
    title: 'Matriz de Energía',
    subtitle: 'Conmutación de Relés de Alta Capacidad',
    classificationCode: 'DOC-PWR-04',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Cuadrícula metálica de 3x3 interruptores basculantes (posiciones ON/OFF) con LEDs indicadores de estado y etiqueta de banco alfa-numérica (ej. BANCO-ALPHA o BANCO-GAMMA).',
    identificationChecklist: [
      'Cuadrícula cuadrada 3x3 con 9 pulsadores o interruptores.',
      'Indicador de estado del núcleo (Estable / Crítico).',
      'Botón grande de ejecución «DESCARGAR» en esquina inferior.',
      'Conmutación independiente de celdas A1..C3.',
    ],
    description:
      'La matriz regula el flujo de carga a las celdas principales. Para estabilizar el banco de potencia, se deben encender únicamente los interruptores requeridos por la máscara lógica.',
    rules: [
      {
        condition: 'Regla 1: Banco ALPHA o BETA',
        action:
          'El objetivo es encender todos los interruptores que formen una cruz (+) centrada en la celda (2,2) más las esquinas activas indicadas por el banco.',
      },
      {
        condition: 'Regla 2: Banco GAMMA o DELTA',
        action:
          'Si la última cifra de la serie es impar, invierte el estado de las celdas periféricas (1,1), (1,3), (3,1), (3,3).',
      },
      {
        condition: 'Regla 3: Verificación de Carga',
        action:
          'Una vez configurada la combinación exacta, el Operador pulsa «ENCLAVAR MATRIZ».',
      },
    ],
    notes: ['Enclavar una combinación inestable causará un arco voltaico y un Strike.'],
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
      'Manómetro analógico central con aguja indicadora de PSI/Bar, tres válvulas rotativas etiquetadas V-1, V-2, V-3, y palanca de descarga «PURGA MAESTRA».',
    identificationChecklist: [
      'Tres manómetros circulares analógicos con agujas de presión (A, B, C).',
      'Tres ruedas de válvula giratorias situadas debajo de cada reloj.',
      'Indicador LED de modo de presión (Verde, Ámbar, Rojo).',
      'Pulsador de purga neumática general.',
    ],
    description:
      'Las líneas hidráulicas están bajo sobrepresión crítica. El Operador debe ajustar las aperturas de las tres válvulas al valor combinado que equilibre la aguja en el punto óptimo.',
    rules: [
      {
        condition: 'Presión en zona ROJA (> 80 PSI):',
        action: 'Abre V-1 al 100%, V-2 al 50% y mantén V-3 cerrada (0%). Luego acciona «PURGA».',
      },
      {
        condition: 'Presión en zona ÁMBAR (40 - 80 PSI):',
        action: 'Abre V-2 al 75%, V-3 al 25% y V-1 cerrada. Luego acciona «PURGA».',
      },
      {
        condition: 'Presión en zona VERDE / BAJA (< 40 PSI):',
        action: 'Ajusta V-1 al 30%, V-2 al 30% y V-3 al 30%. Luego acciona «PURGA».',
      },
    ],
    notes: ['Purgar con la configuración incorrecta reventará los sellos de seguridad (Strike).'],
  },

  // 6. RELÉS HEXADECIMALES
  {
    moduleType: 'RELES_HEXADECIMALES',
    category: 'ELECTRICIDAD',
    title: 'Relés Hexadecimales',
    subtitle: 'Decodificación de Registros en Base 16',
    classificationCode: 'DOC-LOG-06',
    division: 'Lógica Digital y Cómputo',
    visualIdentification:
      'Pantalla alfanumérica mostrando un registro HEX de 2 caracteres (ej. 0x3F, 0xA8, 0xC4), banco de 4 interruptores biestables (Bits 0 a 3) y botón «ENVIAR REGISTRO».',
    identificationChecklist: [
      'Banco de 4 módulos de relé verticales (R1, R2, R3, R4).',
      'Pantallas de lectura hexadecimal de 2 dígitos (ej. 0x4, 0xA, 0xF).',
      'Interruptores basculantes de posición ARRIBA (1) / ABAJO (0).',
      'Indicador superior de bus lógico.',
    ],
    description:
      'El microcontrolador auxiliar se encuentra bloqueado en un registro hexadecimal. Se debe calcular la máscara binaria aplicando la tabla de paridad de sector.',
    rules: [
      {
        condition: 'Si el primer carácter es número (0-9):',
        action: 'Aplica operación AND con la máscara fija 0x0F.',
      },
      {
        condition: 'Si el primer carácter es letra (A-F):',
        action: 'Aplica operación XOR con el último dígito del número de serie de la máquina.',
      },
      {
        condition: 'Configuración de bits:',
        action: 'Ajusta los 4 interruptores al valor binario resultante (1 = ARRIBA, 0 = ABAJO).',
      },
    ],
    notes: ['Un registro mal validado provocará un reinicio forzado del bus de datos (Strike).'],
  },

  // 7. RADAR VECTORIAL
  {
    moduleType: 'RADAR_VECTORIAL',
    category: 'NAVEGACIÓN',
    title: 'Radar Vectorial',
    subtitle: 'Triangulación de Coordenadas de Interferencia',
    classificationCode: 'DOC-NAV-07',
    division: 'Navegación y Radares',
    visualIdentification:
      'Pantalla de radar circular verde con barrido continuo en 360°, ecos o contactos marcados con coordenadas polares, selector de cuadrante (Q1-Q4) y mando «ENGANCHE».',
    identificationChecklist: [
      'Pantalla circular verde de radar con retícula polar de barrido.',
      '3 anillos concéntricos marcados (1, 2, 3).',
      'Haz de barrido giratorio con eco de contacto (blip rojo).',
      'Selector de cuadrantes (NO, NE, SO, SE) y botón «ENGANCHE».',
    ],
    description:
      'Un eco espurio interfiere las señales de navegación. El Operador debe seleccionar el cuadrante correcto y el ángulo azimutal del contacto verificado.',
    rules: [
      {
        condition: 'Eco detectado en Cuadrante Norte (0° - 90°):',
        action: 'Si el barrido es horario, fija ángulo en 45°. Si es antihorario, fija en 60°.',
      },
      {
        condition: 'Eco detectado en otros cuadrantes:',
        action: 'Aplica la regla de desvío polar indicada en la subsección de navegación.',
      },
    ],
    notes: ['Disparar el enganche fuera de rumbo causará una pérdida de señal (Strike).'],
  },

  // 8. SEÑAL ÓPTICA
  {
    moduleType: 'SEÑAL_OPTICA',
    category: 'COMUNICACIONES',
    title: 'Señal Óptica Pulsante',
    subtitle: 'Intercepción y Traducción de Destellos Luminosos',
    classificationCode: 'DOC-OPT-08',
    division: 'Transmisiones y Señales',
    visualIdentification:
      'Lámpara estroboscópica ámbar que parpadea a intervalos rítmicos (cortos y largos), selector de código de 3 caracteres y pulsador «TRANSMITIR ACUSE».',
    identificationChecklist: [
      'Foco o cúpula estroboscópica ámbar central grande.',
      'Emisión rítmica periódica de pulsos de luz cortos y largos.',
      'Barra medidora de frecuencia luminosa.',
      'Botón de sintonización y transmisión de respuesta.',
    ],
    description:
      'Una baliza óptica emite un mensaje codificado en pulsos de luz. El Operador debe contar la duración de los destellos y la pausa larga para descifrar la clave.',
    rules: [
      {
        condition: 'Secuencia de destellos:',
        action: 'Pulsos cortos = Punto (•), Pulsos largos = Raya (—). Identifica la letra o dígito emitido.',
      },
      {
        condition: 'Respuesta requerida:',
        action: 'El manual traduce la letra recibida a la clave de respuesta correspondiente.',
      },
    ],
    notes: ['Transmitir una confirmación errónea alertará a la contramedida (Strike).'],
  },

  // 9. TECLADO MAESTRO
  {
    moduleType: 'TECLADO_MAESTRO',
    category: 'COMUNICACIONES',
    title: 'Teclado Maestro',
    subtitle: 'Comprobación de Códigos de Autorización',
    classificationCode: 'DOC-KEY-09',
    division: 'Criptografía y Protocolos',
    visualIdentification:
      'Teclado numérico 0-9 con visor de display de 4 dígitos, tecla «BORRAR» y tecla «INTRO».',
    identificationChecklist: [
      'Teclado matricial numérico clásico 3x4 (dígitos 0 al 9).',
      'Pantalla LCD digital superior que muestra 4 dígitos de PIN.',
      'Display que indica el serial de autorización de la máquina.',
      'Teclas de corrección [C] e introducción [ENT].',
    ],
    description:
      'El panel solicita un PIN de acceso de 4 cifras. El código no es fijo: se calcula sumando coeficientes según la hora de inicio de la misión y el sector de la máquina.',
    rules: [
      {
        condition: 'Cálculo del PIN:',
        action: 'Suma las cifras pares de la serie de la máquina y multiplica por el dígito de sector.',
      },
      {
        condition: 'Introducción del código:',
        action: 'El Operador teclea los 4 números y pulsa «INTRO».',
      },
    ],
    notes: ['Tres intentos erróneos bloquearán permanentemente el panel.'],
  },

  // 10. PALANCA DE SOBRECARGA
  {
    moduleType: 'PALANCA_SOBRECARGA',
    category: 'CONTROL',
    title: 'Palanca de Sobrecarga',
    subtitle: 'Descarga de Energía Inductiva Acumulada',
    classificationCode: 'DOC-NRG-10',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Palanca industrial pesada con guarda de seguridad a rayas amarillas y negras, barra de carga que se llena progresivamente y luz de advertencia parpadeante.',
    identificationChecklist: [
      'Palanca industrial pesada alojada en ranura vertical.',
      'Guarda de seguridad con franjas diagonales amarillas y negras.',
      'Barra luminosa indicadora de carga (Rojo, Ámbar o Azul).',
      'Requiere soltarse en un segundo específico del temporizador.',
    ],
    description:
      'El acumulador acumula carga parásita. Se debe tirar de la palanca y mantenerla accionada hasta el momento preciso especificado por el cronómetro.',
    rules: [
      {
        condition: 'Momento de liberación de la palanca:',
        action:
          'El Operador debe tirar de la palanca y SOLTARLA cuando el segundero del reloj de la sala termine en una cifra específica (ej. 5 o 0).',
      },
    ],
    notes: ['Soltar la palanca en el segundo incorrecto provocará una descarga destructiva (Strike).'],
  },

  // 11. COMPUERTAS LÓGICAS
  {
    moduleType: 'COMPUERTAS_LOGICAS',
    category: 'SISTEMAS',
    title: 'Compuertas Lógicas',
    subtitle: 'Resolución de Circuitos Booleanos',
    classificationCode: 'DOC-LOG-11',
    division: 'Lógica Digital y Cómputo',
    visualIdentification:
      'Diagrama esquemático con símbolos de compuertas lógicas (AND, OR, XOR, NAND, NOR) con entradas fijas y dos interruptores manuales para resolver la salida Q = 1.',
    identificationChecklist: [
      'Diagrama de circuito integrado con símbolo lógico (AND, OR, XOR).',
      'Dos pines de entrada conmutables [PIN A] y [PIN B].',
      'Salida lógica terminal [Q] con indicador LED.',
      'Denominación de chip integrado (ej. CHIP-AND, CHIP-XOR).',
    ],
    description:
      'Un circuito combinacional requiere fijar las entradas para que la salida final Q alcance el nivel lógico alto (1).',
    rules: [
      {
        condition: 'AND: Salida 1 solo si todas las entradas son 1.',
        action: 'OR: Salida 1 si al menos una entrada es 1. XOR: Salida 1 si las entradas son distintas.',
      },
      {
        condition: 'NAND / NOR: Invierten el resultado de AND y OR respectivamente.',
        action: 'El Guía deduce el estado de los interruptores A y B para que la salida final sea 1.',
      },
    ],
    notes: ['Una combinación que arroje Q = 0 activará el disyuntor de seguridad (Strike).'],
  },

  // 12. REFRIGERANTE QUÍMICO
  {
    moduleType: 'REFRIGERANTE_QUIMICO',
    category: 'ENERGÍA',
    title: 'Refrigerante Químico',
    subtitle: 'Mezcla y Neutralización de Compuestos Criogénicos',
    classificationCode: 'DOC-CHM-12',
    division: 'Fluidos y Termodinámica',
    visualIdentification:
      'Tres matraces cilíndricos transparentes con fluidos de colores (Reactivo A Azul, Reactivo B Rojo, Reactivo C Verde), perillas dosificadoras y botón «INYECTAR MEZCLA».',
    identificationChecklist: [
      'Tres cilindros de vidrio verticales con líquido refrigerante.',
      'Fluidos de colores diferenciados (Azul, Verde, Rojo).',
      'Marcas de graduación de nivel de llenado en los tubos.',
      'Pulsadores dosificadores y botón de inyección.',
    ],
    description:
      'Para neutralizar el sobrecalentamiento del núcleo criogénico, se deben combinar las proporciones exactas de los reactivos según el pH y la temperatura reportada.',
    rules: [
      {
        condition: 'Si la temperatura supera los 350 K:',
        action: 'Fija Reactivo A al 40%, Reactivo B al 40% y Reactivo C al 20%.',
      },
      {
        condition: 'Si la temperatura es 350 K o inferior:',
        action: 'Fija Reactivo A al 20%, Reactivo B al 50% y Reactivo C al 30%.',
      },
    ],
    notes: ['Una mezcla descompensada causará cristalización en los conductos (Strike).'],
  },

  // 13. PUERTOS DE CONEXIÓN
  {
    moduleType: 'PUERTOS_CONEXION',
    category: 'ELECTRICIDAD',
    title: 'Puertos de Conexión de Puente',
    subtitle: 'Ruteo de Cables Patch Jack',
    classificationCode: 'DOC-NET-13',
    division: 'Electricidad y Circuitos',
    visualIdentification:
      'Panel frontal telefónico con 4 conectores jack hembra en la fila superior (A, B, C, D) y 4 en la inferior (1, 2, 3, 4) con dos cables patch para puentear.',
    identificationChecklist: [
      'Placa frontal con dos filas de conectores jack (4 arriba, 4 abajo).',
      'Fila superior identificada con letras (A, B, C, D).',
      'Fila inferior identificada con números (1, 2, 3, 4).',
      'Cables patch de colores puenteando pares de clavijas.',
    ],
    description:
      'El puente telefónico desvía señales de control. El Operador debe conectar los cables patch entre el par de clavijas correcto según la tabla de asignación.',
    rules: [
      {
        condition: 'Conexión primaria:',
        action: 'Si el número de serie termina en número par, conecta Puerto A con Clavija 3.',
      },
      {
        condition: 'Conexión secundaria:',
        action: 'Conecta el segundo cable según la letra de código mostrada en la carcasa.',
      },
    ],
    notes: ['Un cortocircuito por puente erróneo disparará un Strike inmediato.'],
  },

  // 14. DISIPADOR TÉRMICO
  {
    moduleType: 'DISIPADOR_TERMICO',
    category: 'ENERGÍA',
    title: 'Disipador Térmico Dirigido',
    subtitle: 'Alineación de Compuertas de Ventilación',
    classificationCode: 'DOC-THM-14',
    division: 'Fluidos y Termodinámica',
    visualIdentification:
      'Rejilla de escape con 4 aletas direccionales orientables (Norte, Sur, Este, Oeste) e indicador de vector de flujo de calor convectivo.',
    identificationChecklist: [
      'Rejilla radiadora horizontal con aletas metálicas de ventilación.',
      'Mando deslizante transversal sobre carril horizontal.',
      'Barra indicadora de temperatura térmica con zonas de alerta.',
      'Botón de enclavamiento de deflectores.',
    ],
    description:
      'El calor del generador debe ser evacuado hacia las toberas abiertas. El Operador orienta las aletas siguiendo el protocolo aerodinámico.',
    rules: [
      {
        condition: 'Vector de calor hacia el Este:',
        action: 'Abre aleta Este al 100% y aleta Norte al 50%; mantén Oeste y Sur cerradas.',
      },
      {
        condition: 'Vector de calor hacia el Oeste:',
        action: 'Abre aleta Oeste al 100% y aleta Sur al 50%; mantén Este y Norte cerradas.',
      },
    ],
    notes: ['Cerrar todas las aletas provocará una acumulación súbita de calor (Strike).'],
  },

  // 15. SINCRONIZADOR DE FASES
  {
    moduleType: 'SINCRONIZADOR_FASES',
    category: 'SISTEMAS',
    title: 'Sincronizador de Fases Concénctricas',
    subtitle: 'Alineación de Anillos de Inducción Rotativa',
    classificationCode: 'DOC-ROT-15',
    division: 'Mecánica y Cinemática',
    visualIdentification:
      'Dos anillos circulares concéntricos que giran en pantalla con muescas angulares marcadas de 0° a 360°, mandos de giro y gatillo de «ACOPLE DE FASE».',
    identificationChecklist: [
      'Dos anillos concéntricos circulares giratorios.',
      'Muescas y ranuras de alineación angular grabadas.',
      'Controles de giro paso a paso para regular el ángulo.',
      'Pulsador de acoplamiento magnético.',
    ],
    description:
      'Dos rotores de inducción desfasados generan turbulencia magnética. El Operador debe rotar los anillos hasta hacer coincidir el ángulo de fase seguro antes de trabar el acople.',
    rules: [
      {
        condition: 'Cálculo del ángulo de alineación:',
        action:
          'Multiplica el desfase relativo entre anillos por el número de sectores y suma 45° si la serie es par.',
      },
      {
        condition: 'Accionamiento del acople:',
        action: 'Gira el anillo interior a la posición calculada y pulsa «ACOPLE DE FASE».',
      },
    ],
    notes: ['Acoplar fuera del ángulo de tolerancia destruirá los rodamientos magnéticos (Strike).'],
  },

  // =========================================================================
  // 5 NUEVAS FAMILIAS DE MÓDULOS (20 EN TOTAL)
  // =========================================================================

  // 16. CALIBRADOR GIROSCÓPICO (NUEVO)
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
          'El Rumbo Objetivo se normaliza en el rango 0° a 359° (módulo 360). El Operador ajusta los mandos al grado exacto (±2°) y pulsa «FIJAR RUMBO».',
      },
    ],
    notes: [
      'Si el resultado excede 360°, resta 360. Si es negativo, suma 360.',
      'Fijar el rumbo con una desviación mayor a 2 grados provocará una desorientación inercial y un Strike.',
    ],
  },

  // 17. REACTOR DE PLASMA (NUEVO)
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
          '• La suma de Alfa (α) + Beta (β) debe sumar exactamente 6.\n• Si el panel no tiene Strikes acumulados (0 Strikes) → Alfa = 4, Beta = 2, Gamma = 3.\n• Si la máquina ya tiene 1 o más Strikes acumulados → Alfa = 1, Beta = 5, Gamma = 2.',
      },
    ],
    notes: [
      'Una vez configurados los tres deslizadores Alfa, Beta y Gamma, el Operador pulsa «ESTABILIZAR FLUJO».',
      'Un confinamiento asimétrico provocará una brecha en la cámara y un Strike inmediato.',
    ],
  },

  // 18. ATENUADOR ACÚSTICO DE RESONANCIA (NUEVO)
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

  // 19. SECUENCIA CINÉTICA DE PISTONES (NUEVO)
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

  // 20. DIVISOR DE VOLTAJE (NUEVO)
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
