import { PinturilloCategory } from '../types/pinturillo';

export interface DrawableWord {
  id: string;
  word: string;
  category: PinturilloCategory;
  difficulty: 'FACIL' | 'NORMAL' | 'DIFICIL';
}

// Helper to build list concisely
function buildCategoryWords(
  cat: PinturilloCategory,
  facil: string[],
  normal: string[],
  dificil: string[]
): DrawableWord[] {
  let idx = 1;
  const list: DrawableWord[] = [];
  for (const w of facil) {
    list.push({ id: `${cat}_${idx++}`, word: w.toLowerCase().trim(), category: cat, difficulty: 'FACIL' });
  }
  for (const w of normal) {
    list.push({ id: `${cat}_${idx++}`, word: w.toLowerCase().trim(), category: cat, difficulty: 'NORMAL' });
  }
  for (const w of dificil) {
    list.push({ id: `${cat}_${idx++}`, word: w.toLowerCase().trim(), category: cat, difficulty: 'DIFICIL' });
  }
  return list;
}

// 1. ANIMALES (~135 words)
const ANIMALES_FACIL = [
  'perro', 'gato', 'raton', 'oso', 'leon', 'elefante', 'mono', 'jirafa', 'vaca', 'caballo',
  'cerdo', 'oveja', 'pato', 'conejo', 'pez', 'tiburon', 'delfin', 'ballena', 'tortuga', 'rana',
  'serpiente', 'pajaro', 'loro', 'aguila', 'buho', 'mariposa', 'abeja', 'mosca', 'arana', 'hormiga',
  'cangrejo', 'caracol', 'gallina', 'gallo', 'burro', 'cabra', 'foca', 'zorro', 'lobo', 'pinguino',
  'pulpo', 'koala', 'panda', 'tigre', 'cocodrilo', 'cebra', 'rinoceronte', 'hipopotamo', 'camello',
  'hamster', 'canario', 'huron', 'erizo', 'ciervo', 'paloma', 'cisne', 'cigueña', 'leopardo', 'oso polar'
];
const ANIMALES_NORMAL = [
  'flamenco', 'erizo', 'ardilla', 'murcielago', 'medusa', 'camaleon', 'castor', 'nutria', 'mapache',
  'cisne', 'pelicano', 'avestruz', 'pavo real', 'tucan', 'guepardo', 'leopardo', 'hiena', 'morsa',
  'canguro', 'ornitorrinco', 'lemur', 'suricata', 'topo', 'grillo', 'saltamontes', 'mantis',
  'luciernaga', 'escorpion', 'calamar', 'estrella de mar', 'caballito de mar', 'raya', 'pez espada',
  'pez payaso', 'chimpance', 'gorila', 'orangutan', 'halcon', 'gaviota', 'golondrina', 'colibri',
  'chigüiro', 'armadillo', 'perezoso', 'iguana', 'gecko', 'salamandra', 'sapo', 'ciervo', 'alce', 'jabali',
  'mantarraya', 'langostino', 'salmon', 'atun', 'bacalao', 'ganso', 'buitre', 'lince', 'hiena'
];
const ANIMALES_DIFICIL = [
  'ajolote', 'narval', 'beluga', 'pangolin', 'lemur volador', 'quetzal', 'kiwi', 'dodo', 'lemur de cola anillada',
  'diablo de tasmania', 'ocelote', 'tapir', 'capibara', 'caracal', 'fenec', 'dugongo', 'pez globo', 'anguila electrica',
  'dragon de komodo', 'ciempies', 'milpies', 'cucaracha', 'chinche', 'mariquita', 'escarabajo rinoceronte',
  'pez linterna', 'anaconda', 'cobra real', 'lobo marino', 'orca asesina', 'camaron mantis', 'lechuza',
  'tarantula gigante', 'salamandra de fuego', 'camaleon pantera', 'pez espada gigante', 'escarabajo pelotero',
  'babosa de mar multicolor', 'pez leon venenoso', 'mantarraya gigante', 'cangrejo ermitano', 'pulpo mimico'
];

// 2. COMIDA Y BEBIDA (~135 words)
const COMIDA_FACIL = [
  'pizza', 'hamburguesa', 'patatas fritas', 'helado', 'tarta', 'pastel', 'chocolate', 'galleta',
  'pan', 'huevo', 'leche', 'queso', 'manzana', 'platano', 'pera', 'naranja', 'limon', 'fresa',
  'sandia', 'melon', 'uva', 'cereza', 'pinia', 'tomate', 'zanahoria', 'lechuga', 'cebolla',
  'pescado', 'pollo', 'carne', 'arroz', 'sopa', 'espaguetis', 'bocadillo', 'cafe', 'te',
  'zumo', 'agua', 'refresco', 'palomitas', 'croissant', 'donut', 'magdalena', 'caramelo', 'chicle',
  'bombones', 'salchicha', 'filete', 'pure de patatas', 'ensalada', 'aceite de oliva', 'miel', 'mantequilla'
];
const COMIDA_NORMAL = [
  'paella', 'tortilla de patatas', 'croquetas', 'churros con chocolate', 'gazpacho', 'salmorejo',
  'jamon serrano', 'sushi', 'taco', 'burrito', 'nachos con queso', 'quesadilla', 'guacamole',
  'lasaña', 'raviolis', 'crepe', 'gofre', 'tortitas', 'batido de fresa', 'granizado de limon',
  'cacao', 'ensalada mixta', 'espárragos', 'alcachofa', 'berenjena', 'calabacin', 'champiñon',
  'setas', 'aceitunas', 'pepino', 'pimiento', 'aguacate', 'mango', 'kiwi', 'melocoton', 'albaricoque',
  'higo', 'granada', 'pomelo', 'frambuesa', 'arandanos', 'moras', 'flan', 'natillas', 'arroz con leche',
  'callos a la madrileña', 'empanadillas', 'patatas alioli', 'tortilla francesa', 'torrijas', 'crema de calabaza'
];
const COMIDA_DIFICIL = [
  'fondue de queso', 'pulpo a la gallega', 'fabada asturiana', 'cocido madrileño', 'patatas bravas',
  'empanada gallega', 'calamares a la romana', 'langosta', 'bogavante', 'mejillones al vapor',
  'ostras', 'tiramisu', 'profiteroles', 'brownie con nueces', 'fondant de chocolate', 'mojito sin alcohol',
  'sangria', 'cerveza sin alcohol', 'crema catalana', 'polvoron', 'turron de jijona', 'roscon de reyes',
  'pisto manchego', 'salmorejo cordobes', 'pimientos de padron', 'huevos rotos con jamon', 'ensaladilla rusa'
];

// 3. OBJETOS (~130 words)
const OBJETOS_FACIL = [
  'mesa', 'silla', 'cama', 'sofa', 'armario', 'puerta', 'ventana', 'espejo', 'reloj', 'lampara',
  'bombilla', 'vela', 'libro', 'lapiz', 'boligrafo', 'papel', 'tijeras', 'goma de borrar', 'regla',
  'mochila', 'maleta', 'bolso', 'cartera', 'llave', 'candado', 'telefono', 'movil', 'ordenador',
  'teclado', 'raton de ordenador', 'pantalla', 'television', 'radio', 'altavoz', 'camara', 'gafas',
  'paraguas', 'cepillo de dientes', 'peine', 'jabon', 'toalla', 'vaso', 'taza', 'plato', 'cuchara',
  'tenedor', 'cuchillo', 'sarten', 'olla', 'botella', 'cepillo de pelo', 'esponja de baño', 'cubo de basura',
  'pinza de ropa', 'percha', 'hucha de cerdito', 'abrelatas', 'sacacorchos', 'embudo', 'rallador de queso'
];
const OBJETOS_NORMAL = [
  'microfono', 'auriculares', 'mando a distancia', 'ventilador', 'aspiradora', 'tostadora', 'cafetera',
  'microondas', 'nevera', 'lavadora', 'plancha de ropa', 'secador de pelo', 'bateria portatil',
  'cable usb', 'enchufe', 'linterna', 'pilas', 'brujula', 'mapa', 'globo terraqueo', 'termometro',
  'balanza', 'reloj de arena', 'reloj de pulsera', 'despertador', 'prismáticos', 'telescopio',
  'microscopio', 'lupa', 'gafas de sol', 'sombrero', 'gorra', 'bufanda', 'guantes', 'cinturon',
  'paraguero', 'perchero', 'felpudo', 'estanteria', 'cuadro', 'jarron con flores', 'maceta',
  'cojin', 'manta', 'alfombra', 'cortina', 'extintor', 'caja de herramientas', 'martillo', 'destornillador',
  'regadera de jardin', 'planta artificial', 'termo de cafe', 'botijo de barro', 'abanico espanol', 'fregonas y cubo'
];
const OBJETOS_DIFICIL = [
  'alicate', 'llave inglesa', 'sierra manual', 'taladro electrico', 'cinta metrica', 'carretilla',
  'escalera de mano', 'buzon de correos', 'farola', 'semaforo', 'boca de incendios', 'parquímetro',
  'cabina telefonica', 'maquina expendedora', 'tocadiscos', 'cinta de cassette', 'walkie talkie',
  'proyector de cine', 'maquina de escribir', 'bola de discoteca', 'trofeo dorado', 'medalla de oro',
  'yunque de herrero', 'fuelle de chimenea', 'veleta de viento', 'reloj de sol', 'gramofono antiguo'
];

// 4. LUGARES (~125 words)
const LUGARES_FACIL = [
  'casa', 'colegio', 'parque', 'playa', 'bosque', 'montaña', 'rio', 'isla', 'castillo', 'hospital',
  'supermercado', 'tienda', 'restaurante', 'cine', 'teatro', 'piscina', 'zoo', 'aeropuerto',
  'estacion de tren', 'puerto', 'puente', 'calle', 'plaza', 'granja', 'circo', 'hotel', 'estadio',
  'cabaña de madera', 'terraza de bar', 'churrería', 'quiosco de prensa', 'gasolinera', 'lavadero de coches'
];
const LUGARES_NORMAL = [
  'biblioteca', 'museo de arte', 'banco', 'farmacia', 'panaderia', 'peluqueria', 'gasolinera',
  'aparcamiento', 'comisaria de policia', 'parque de bomberos', 'iglesia', 'catedral', 'cementerio',
  'parque de atracciones', 'acuario', 'bolera', 'discoteca', 'gimnasio', 'pista de hielo',
  'estacion de autobuses', 'parada de metro', 'faro en la costa', 'molino de viento', 'torre eiffel',
  'coliseo romano', 'piramide de egipto', 'estatua de la libertad', 'muralla china', 'cueva oscura',
  'volcan activo', 'desierto de arena', 'glaciar helado', 'cascada de agua', 'selva tropical',
  'embarcadero de madera', 'mercadillo ambulante', 'bodega de vino', 'plaza de toros', 'pista de tenis', 'campo de golf'
];
const LUGARES_DIFICIL = [
  'refugio de montaña', 'observatorio astronomico', 'laboratorio secreto', 'estacion espacial',
  'base antartica', 'isla desierta', 'pueblo fantasma', 'castillo embrujado', 'laberinto de setos',
  'mina de carbon', 'plataforma petrolifera', 'submarino sumergido', 'estudio de grabacion',
  'hangar de aviones', 'trinchera historica', 'tribunal de justicia', 'campamento militar',
  'mercado medieval', 'mirador panoramico', 'puerto deportivo', 'parque nacional protegido',
  'mina de oro abandonada', 'monasterio en la montaña', 'aldea vikinga', 'templo budista', 'isla volcanica'
];

// 5. CINE Y TELEVISIÓN (~120 words)
const CINE_TV_FACIL = [
  'cine', 'camara de cine', 'palomitas de maiz', 'pantalla gigante', 'claqueta de director',
  'silla de director', 'superheroe', 'villano', 'princesa', 'caballero con armadura', 'dragon',
  'mago con varita', 'bruja volando', 'fantasma', 'zombi', 'momia', 'alienigena', 'robot',
  'monstruo', 'pirata con parche', 'vaquero del oeste', 'detective privado', 'agente secreto',
  'estrella de hollywood', 'estatuilla del oscar', 'alfombra roja', 'entrada de cine',
  'espada magica', 'escoba voladora', 'caldero magico', 'mascara de antifaz', 'capa negra', 'pistola laser'
];
const CINE_TV_NORMAL = [
  'capa de superheroe', 'mascara de luchador', 'escudo protector', 'espada laser', 'platillo volante',
  'nave espacial', 'coche fantastico', 'dinosaurio t-rex', 'hombre lobo aullando', 'vampiro con colmillos',
  'calabaza de halloween', 'calavera pirata', 'cofre del tesoro', 'mapa del tesoro', 'isla calavera',
  'barco pirata', 'tren del oeste', 'duelo al amanecer', 'explosion de accion', 'persecucion de coches',
  'salto en paracaidas', 'pelea de artes marciales', 'viaje en el tiempo', 'maquina del tiempo',
  'portal dimensional', 'rayo congelador', 'rayo reductor', 'espejo magico', 'lampara maravillosa',
  'sirena con cola', 'unicornio con cuerno', 'ogro verde', 'duende travieso', 'gargola de piedra'
];
const CINE_TV_DIFICIL = [
  'sombrero seleccionador', 'varita de sauco', 'anillo invisible', 'zapatilla de cristal',
  'manzana envenenada', 'reloj de cuco embrujado', 'cuadro que se mueve', 'armadura parlante',
  'cazafantasmas con mochila', 'monstruo del lago ness', 'pie grande en el bosque', 'king kong en rascacielos',
  'godzilla en la ciudad', 'apocalipsis zombi', 'invasion extraterrestre', 'rueda de prensa',
  'sala de montaje', 'guion de pelicula', 'efectos especiales de pantalla verde', 'doble de accion',
  'coche descapotable de espia', 'reloj con rayos laser', 'baticueva secreta', 'trono de hierro', 'sable de luz doble'
];

// 6. VIDEOJUEGOS (~120 words)
const VIDEOJUEGOS_FACIL = [
  'mando de consola', 'pantalla de juego', 'auriculares gamer', 'teclado mecanico', 'raton gamer',
  'moneda de oro', 'vida extra con corazon', 'seta magica', 'estrella de poder', 'pocion de salud',
  'espada pixelada', 'escudo de madera', 'arco con flechas', 'pistola laser', 'bomba con mecha',
  'caja misteriosa', 'cofre con llave', 'trofeo de platino', 'game over', 'pantalla de victory',
  'llave de oro', 'puerta con candado', 'pocion verde', 'joya azul', 'corona de rey', 'corazon de vida'
];
const VIDEOJUEGOS_NORMAL = [
  'consola portatil', 'maquina recreativa arcade', 'joystick clasico', 'casco de realidad virtual',
  'bloque de ladrillos', 'tuberia verde', 'fantasmas persiguiendo', 'laberinto comecocos',
  'bloque de tetris cayendo', 'creeper verde explotando', 'pico de diamante', 'antorcha encendida',
  'coche de carreras con turbo', 'cascara de platano en pista', 'caparazon rojo teledirigido',
  'anillo dorado flotante', 'esmeralda brillante', 'cristal de mana', 'pergamino magico',
  'botas de velocidad', 'capa de invisibilidad', 'gancho de escalada', 'portal azul y naranja',
  'escudo de pinchos', 'bola de fuego magica', 'martillo de guerra', 'pocion de invisibilidad'
];
const VIDEOJUEGOS_DIFICIL = [
  'jefe final gigante con cuernos', 'barra de vida roja', 'barra de mana azul', 'puntos de experiencia',
  'subida de nivel', 'arbol de habilidades', 'inventario lleno de objetos', 'mapa de mazmorra',
  'trampa de pinchos en suelo', 'plataforma flotante movil', 'punto de guardado brillante',
  'drop de botin legendario', 'speedrun con cronometro', 'combate por turnos', 'arena de batalla',
  'pase de batalla desbloqueado', 'skin dorada exclusiva', 'easter egg oculto', 'zona segura de tormenta',
  'respawn en hoguera', 'arma legendaria resplandeciente', 'torreta automatica', 'robot centinela'
];

// 7. DEPORTES (~120 words)
const DEPORTES_FACIL = [
  'balon de futbol', 'porteria de futbol', 'canasta de baloncesto', 'balon de baloncesto',
  'raqueta de tenis', 'pelota de tenis', 'pelota de golf', 'palo de golf', 'guantes de boxeo',
  'ring de boxeo', 'bicicleta de carreras', 'casco de ciclista', 'patinete', 'monopatin',
  'patines en linea', 'tabla de surf', 'olas para surfear', 'esquis en la nieve', 'trineo',
  'piscina olimpica', 'banador', 'gafas de buceo', 'tubo de snorkel', 'aletas de buceo',
  'pelota de futbol sala', 'cono de entrenamiento', 'silbato deportivo', 'cuerda de saltar'
];
const DEPORTES_NORMAL = [
  'arbitro sacando tarjeta roja', 'tarjeta amarilla', 'silbato de arbitro', 'cinta de meta',
  'podio con medallas', 'copa de campeon', 'bandera a cuadros de f1', 'coche de formula 1',
  'moto de carreras', 'bate de beisbol', 'guante de beisbol', 'balon de rugby', 'red de voleibol',
  'balon de voleibol', 'mesa de ping pong', 'pala de ping pong', 'diana con dardos',
  'arco y flecha olimpico', 'tatami de judo', 'cinturon negro de karate', 'pesas de gimnasio',
  'barra con discos', 'mancuernas', 'cuerda para saltar', 'cinta de correr', 'escalada en roca',
  'arnes de seguridad', 'paracaidismo', 'ala delta planeando', 'kayak en rio bravo', 'piragua',
  'portero parando penalti', 'remate de cabeza en futbol', 'tiro triple de baloncesto', 'salto de longitud'
];
const DEPORTES_DIFICIL = [
  'tiro con arco olimpico', 'salto con pertiga', 'lanzamiento de jabalina', 'lanzamiento de disco',
  'carrera de vallas', 'relevo con testigo', 'gimnasia con cinta ritmica', 'salto de trampolin al agua',
  'natacion sincronizada', 'patinaje artistico sobre hielo', 'curling con escobilla', 'hockey sobre hielo',
  'disco de hockey', 'salto en esqui de trampolin', 'bobsleigh en tubo de hielo', 'triatlon con medalla',
  'esgrima con florete', 'remo en trainera', 'waterpolo en piscina', 'descenso en rafting'
];

// 8. PROFESIONES (~120 words)
const PROFESIONES_FACIL = [
  'medico con bata', 'enfermero', 'bombero apagando fuego', 'policia con placa', 'profesor en pizarra',
  'cocinero con gorro alto', 'camarero con bandeja', 'pintor con brocha', 'astronauta con casco',
  'piloto de avion', 'azafata de vuelo', 'conductor de autobus', 'taxista', 'cartero con cartas',
  'jardinero con regadera', 'pescador con caña', 'granjero con tractor', 'panadero amasando pan',
  'carnicero con cuchillo', 'peluquero con tijeras', 'zapatero arreglando bota', 'mecanico con buzo'
];
const PROFESIONES_NORMAL = [
  'dentista con espejo dental', 'veterinario curando perro', 'fotografo con tripode', 'mecanico bajo coche',
  'fontanero con llave de tubo', 'electricista con cables', 'carpintero con serrucho', 'albanil con ladrillos',
  'arquitecto con planos', 'cientifico con probetas', 'detective con gabardina y lupa', 'juez con mazo',
  'abogado con maletin', 'periodista con microfono', 'locutor de radio', 'musico tocando guitarra',
  'cantante en concierto', 'bailarina de ballet con tutú', 'actor de teatro con mascara', 'mago haciendo truco',
  'guia turistico con bandera', 'socorrista en playa con flotador', 'pastor con ovejas', 'cajero de supermercado'
];
const PROFESIONES_DIFICIL = [
  'arqueologo desenterrando fosil', 'paleontologo con hueso de dinosaurio', 'buzo profesional con bombona',
  'relojero con pinzas diminutas', 'joyero tallando diamante', 'soplador de vidrio artistico',
  'meteorologo señalando mapa', 'controlador aereo en torre', 'escultor con cincel y martillo',
  'cirujano en quirofano con mascarilla', 'apicultor con traje protector', 'sommelier oliendo copa de vino',
  'guardabosques con prismaticos', 'domador de leones con latigo', 'trapecista en el aire',
  'encuadernador artesanal', 'restaurador de cuadros antiguos', 'luthier construyendo violin', 'catador de quesos'
];

// 9. NATURALEZA (~120 words)
const NATURALEZA_FACIL = [
  'sol brillante', 'luna llena', 'estrella fugaz', 'nube blanca', 'lluvia cayendo', 'arcoiris colorido',
  'nieve cayendo', 'relampago en tormenta', 'viento soplando hojas', 'arbol con frutos', 'flor roja',
  'hierba verde', 'montana nevada', 'rio cristalino', 'playa de arena', 'isla tropical con palmera',
  'volcan con lava', 'cueva misteriosa', 'desierto con dunas', 'bosque frondoso',
  'charco de agua de lluvia', 'piedra redonda', 'hoja de otono cayendo', 'rama de arbol', 'semilla germinando'
];
const NATURALEZA_NORMAL = [
  'cascada gigante', 'glaciar de hielo azul', 'iceberg flotante', 'terremoto abriendo grieta',
  'tornado destructivo', 'tsunami con ola gigante', 'aurora boreal verde', 'eclipse solar con anillo',
  'eclipse lunar rojo', 'luna menguante', 'constelacion de estrellas', 'cometa con cola brillante',
  'meteorito cayendo a tierra', 'geiser expulsando agua caliente', 'pantano con niebla espesa',
  'arrecife de coral multicolor', 'oasis con agua y palmeras', 'caniçon rocoso profundo',
  'acantilado sobre el mar', 'duna de arena ondeada', 'estalactitas colgando de techo',
  'manantial de agua dulce', 'laguna con patos', 'selva con lianas colgantes', 'valle entre montanas',
  'pradera verde', 'cordillera nevada', 'playa salvaje', 'pozo de agua natural', 'cueva de hielo',
  'brote de planta verde', 'diente de leon al viento', 'rosa con espinas', 'trebol de cuatro hojas', 'orquidea salvaje'
];
const NATURALEZA_DIFICIL = [
  'planta carnivora atrapando mosca', 'bosque de bambu gigante', 'secuoya milenaria gigante',
  'flor de loto sobre agua', 'girasol gigante mirando al sol', 'nenufar con rana encima',
  'cactus saguaro en el desierto', 'baobab con tronco inmenso', 'campo de lavanda morado',
  'campo de tulipanes holandes', 'hongo bioluminiscente que brilla', 'fosil incrustado en roca',
  'granizo rompiendo hojas', 'olas chocando en rompeolas', 'niebla espesa matutina', 'nieve en copo perfecto',
  'sauce lloron sobre estanque', 'arbol bonsái milenario', 'helecho gigante prehistorico', 'palmera azotada por huracan'
];

// 10. ACCIONES Y SITUACIONES (~120 words)
const ACCIONES_FACIL = [
  'dormir con zzz', 'correr muy rapido', 'bailar con musica', 'cantar con microfono', 'reir a carcajadas',
  'llorar con lagrimas', 'comer pizza', 'beber agua en vaso', 'saltar en cama elastica', 'nadar crol',
  'dibujar en papel', 'escribir carta', 'leer libro gordo', 'cocinar en sarten', 'barrer con escoba',
  'lavar platos con espuma', 'lavarse los dientes', 'ducharse con patito de goma', 'peinarse frente al espejo',
  'abrazar a un amigo', 'saludar con la mano', 'aplaudir entusiasmado', 'guiñar un ojo', 'dar un beso',
  'silbar alegremente', 'guiar el coche', 'abrir un paraguas', 'cerrar una cremallera', 'atar los cordones'
];
const ACCIONES_NORMAL = [
  'hacerse un selfie con palo', 'tropezar con una piedra', 'resbalar con platano', 'estornudar fuerte',
  'bostezar con boca abierta', 'perder el autobus corriendo', 'abrir un regalo con lazo', 'apagar velas de cumpleanos',
  'tirar penalti decisivo', 'pescar bota vieja del agua', 'construir castillo de arena', 'volar cometa con viento',
  'pasear al perro con correa', 'regar las plantas con regadera', 'hacer la compra con carrito',
  'esperar en la cola pacientemente', 'cruzar paso de cebra', 'hacer autostop con pulgar',
  'subir escaleras cansado', 'bajar por tobogan rapido', 'balancearse en columpio alto',
  'hacer pompas de jabon', 'soplar molinillo de viento', 'inflar un globo hasta explotar', 'chocar los cinco',
  'esquivar una pelota', 'pelar una patata', 'hacer una videollamada', 'meter gol por la escuadra', 'buscar en google'
];
const ACCIONES_DIFICIL = [
  'cantar bajo la lluvia con paraguas', 'pedir matrimonio de rodillas con anillo', 'ganar la loteria celebrando',
  'buscar llaves perdidas en el bolso', 'llegar tarde corriendo con tostada en boca', 'dormirse en el transporte publico',
  'pisar un charco y salpicarse', 'intentar abrir tarro atascado con fuerza', 'montar mueble con instrucciones liadas',
  'hacer yoga en postura del arbol', 'dar un susto saliendo de esquina', 'tirarse en bomba a la piscina',
  'mirar las estrellas con manta', 'hacer equilibrio sobre cuerda', 'hacer malabares con tres pelotas'
];

export const PINTURILLO_WORDS: DrawableWord[] = [
  ...buildCategoryWords('animales', ANIMALES_FACIL, ANIMALES_NORMAL, ANIMALES_DIFICIL),
  ...buildCategoryWords('comida', COMIDA_FACIL, COMIDA_NORMAL, COMIDA_DIFICIL),
  ...buildCategoryWords('objetos', OBJETOS_FACIL, OBJETOS_NORMAL, OBJETOS_DIFICIL),
  ...buildCategoryWords('lugares', LUGARES_FACIL, LUGARES_NORMAL, LUGARES_DIFICIL),
  ...buildCategoryWords('cine_tv', CINE_TV_FACIL, CINE_TV_NORMAL, CINE_TV_DIFICIL),
  ...buildCategoryWords('videojuegos', VIDEOJUEGOS_FACIL, VIDEOJUEGOS_NORMAL, VIDEOJUEGOS_DIFICIL),
  ...buildCategoryWords('deportes', DEPORTES_FACIL, DEPORTES_NORMAL, DEPORTES_DIFICIL),
  ...buildCategoryWords('profesiones', PROFESIONES_FACIL, PROFESIONES_NORMAL, PROFESIONES_DIFICIL),
  ...buildCategoryWords('naturaleza', NATURALEZA_FACIL, NATURALEZA_NORMAL, NATURALEZA_DIFICIL),
  ...buildCategoryWords('acciones', ACCIONES_FACIL, ACCIONES_NORMAL, ACCIONES_DIFICIL),
];

// Helper to pick 3 varied words according to enabled categories
export function getRandomWordOptions(
  count: number = 3,
  usedWords: Set<string> = new Set(),
  allowedCategories: PinturilloCategory[] = []
): DrawableWord[] {
  // If no categories provided, allow all
  const categoriesPool = allowedCategories && allowedCategories.length > 0
    ? allowedCategories
    : (['animales', 'comida', 'objetos', 'lugares', 'cine_tv', 'videojuegos', 'deportes', 'profesiones', 'naturaleza', 'acciones'] as PinturilloCategory[]);

  // Filter available words by enabled categories and not already used
  const categoryWords = PINTURILLO_WORDS.filter(w => categoriesPool.includes(w.category));
  const available = categoryWords.filter(w => !usedWords.has(w.word.toLowerCase()));
  const pool = available.length >= count ? available : (categoryWords.length >= count ? categoryWords : PINTURILLO_WORDS);

  // Group by category to maximize semantic and category variety
  const byCat: Partial<Record<PinturilloCategory, DrawableWord[]>> = {};
  for (const w of pool) {
    if (!byCat[w.category]) byCat[w.category] = [];
    byCat[w.category]!.push(w);
  }

  // Shuffle selected categories to avoid predictable order
  const shuffledCats = [...categoriesPool].sort(() => Math.random() - 0.5);

  const selected: DrawableWord[] = [];
  const chosenWordsSet = new Set<string>();

  // Pick one word from distinct categories first
  for (const cat of shuffledCats) {
    if (selected.length >= count) break;
    const catWords = (byCat[cat] || []).filter(w => !chosenWordsSet.has(w.word));
    if (catWords.length > 0) {
      // Pick balanced difficulty (40% facil, 45% normal, 15% dificil)
      const r = Math.random();
      const targetDiff = r < 0.40 ? 'FACIL' : r < 0.85 ? 'NORMAL' : 'DIFICIL';
      const matchingDiff = catWords.filter(w => w.difficulty === targetDiff);
      const chosen = matchingDiff.length > 0
        ? matchingDiff[Math.floor(Math.random() * matchingDiff.length)]
        : catWords[Math.floor(Math.random() * catWords.length)];

      selected.push(chosen);
      chosenWordsSet.add(chosen.word);
    }
  }

  // Fill up if needed
  while (selected.length < count) {
    const remaining = pool.filter(w => !chosenWordsSet.has(w.word));
    if (remaining.length === 0) break;
    const fallback = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(fallback);
    chosenWordsSet.add(fallback.word);
  }

  return selected.slice(0, count);
}
