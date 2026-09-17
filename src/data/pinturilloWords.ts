import { PinturilloCategory } from '../types/pinturillo';

export interface DrawableWord {
  id: string;
  word: string;
  category: PinturilloCategory;
  difficulty: 'FACIL' | 'NORMAL' | 'DIFICIL';
  aliases?: string[];
}

type WordEntry = string | { word: string; aliases: string[] };

function buildCategoryWords(
  cat: PinturilloCategory,
  facil: WordEntry[],
  normal: WordEntry[],
  dificil: WordEntry[]
): DrawableWord[] {
  let idx = 1;
  const list: DrawableWord[] = [];

  const addEntries = (entries: WordEntry[], diff: 'FACIL' | 'NORMAL' | 'DIFICIL') => {
    for (const item of entries) {
      if (typeof item === 'string') {
        list.push({
          id: `${cat}_${idx++}`,
          word: item.trim(),
          category: cat,
          difficulty: diff,
        });
      } else {
        list.push({
          id: `${cat}_${idx++}`,
          word: item.word.trim(),
          category: cat,
          difficulty: diff,
          aliases: item.aliases,
        });
      }
    }
  };

  addEntries(facil, 'FACIL');
  addEntries(normal, 'NORMAL');
  addEntries(dificil, 'DIFICIL');
  return list;
}

// ============================================================================
// 1. ANIMALES (~140 palabras: ~85% una sola palabra, ~15% compuestos naturales)
// ============================================================================
const ANIMALES_FACIL: WordEntry[] = [
  'perro', 'gato', 'ratón', 'oso', 'león', 'tigre', 'elefante', 'jirafa', 'mono', 'gorila',
  'vaca', 'toro', 'caballo', 'cerdo', 'oveja', 'cabra', 'pato', 'conejo', 'pez', 'tiburón',
  'delfín', 'ballena', 'tortuga', 'rana', 'serpiente', 'pájaro', 'loro', 'águila', 'búho', 'mariposa',
  'abeja', 'mosca', 'araña', 'hormiga', 'cangrejo', 'caracol', 'gallina', 'gallo', 'burro', 'lobo',
  'zorro', 'pingüino', 'pulpo', 'koala', 'cebra', 'rinoceronte', 'hipopótamo', 'camello', 'foca', 'ciervo',
  'paloma', 'cisne', 'leopardo',
  { word: 'oso polar', aliases: ['polar', 'oso del polo'] },
  { word: 'oso panda', aliases: ['panda'] },
  { word: 'pez payaso', aliases: ['nemo', 'payaso'] },
  { word: 'pavo real', aliases: ['pavorreal'] },
  { word: 'estrella de mar', aliases: ['estrella marina'] },
  { word: 'caballito de mar', aliases: ['hipocampo'] },
  { word: 'pez espada', aliases: ['espadarte'] }
];

const ANIMALES_NORMAL: WordEntry[] = [
  'flamenco', 'erizo', 'ardilla', 'murciélago', 'medusa', 'camaleón', 'castor', 'nutria', 'mapache',
  'pelícano', 'avestruz', 'tucán', 'colibrí', 'halcón', 'gaviota', 'golondrina', 'cuervo', 'pavo',
  'guepardo', 'hiena', 'morsa', 'canguro', 'topo', 'grillo', 'saltamontes', 'mantis', 'luciérnaga',
  'escorpión', 'calamar', 'chimpancé', 'orangután', 'perezoso', 'armadillo', 'ornitorrinco', 'lémur',
  'suricata', 'iguana', 'sapo', 'alce', 'jabalí', 'dromedario', 'langosta', 'mosquito', 'avispa',
  'mariquita', 'libélula', 'salmón', 'atún', 'buitre', 'cigüeña', 'lince',
  { word: 'pez globo', aliases: ['globo'] },
  { word: 'pez martillo', aliases: ['martillo'] },
  { word: 'mantarraya', aliases: ['manta raya', 'raya gigante'] }
];

const ANIMALES_DIFICIL: WordEntry[] = [
  'ajolote', 'narval', 'beluga', 'pangolín', 'capibara', 'ocelote', 'tapir', 'fenec', 'dodo',
  'quetzal', 'kiwi', 'ciempiés', 'milpiés', 'tarántula', 'salamandra', 'gecko',
  { word: 'dragón de komodo', aliases: ['varano de komodo', 'komodo'] },
  { word: 'demonio de tasmania', aliases: ['diablo de tasmania'] },
  { word: 'anguila eléctrica', aliases: ['anguila'] },
  { word: 'pez linterna', aliases: ['rape abisal'] },
  { word: 'pez león', aliases: ['pez leon'] },
  { word: 'cobra real', aliases: ['cobra'] },
  { word: 'anaconda', aliases: ['boa'] },
  { word: 'cangrejo ermitaño', aliases: ['ermitaño'] },
  { word: 'escarabajo pelotero', aliases: ['pelotero'] }
];

// ============================================================================
// 2. COMIDA Y BEBIDA (~135 palabras: ~82% una sola palabra, ~18% compuestos reales)
// ============================================================================
const COMIDA_FACIL: WordEntry[] = [
  'pizza', 'hamburguesa', 'paella', 'croqueta', 'tortilla', 'sushi', 'taco', 'burrito',
  'espaguetis', 'macarrones', 'lasaña', 'helado', 'churros', 'donut', 'galleta', 'tarta',
  'sandía', 'plátano', 'fresa', 'manzana', 'pera', 'naranja', 'limón', 'uva', 'cereza', 'piña',
  'queso', 'pan', 'bocadillo', 'palomitas', 'café', 'cerveza', 'refresco', 'batido', 'zumo',
  'leche', 'chocolate', 'huevo', 'carne', 'pescado', 'pollo', 'sopa', 'arroz', 'ensalada',
  'flan', 'magdalena', 'croissant', 'caramelo', 'chicle', 'salchicha', 'filete', 'jamón',
  'bacon', 'mantequilla', 'miel', 'tomate', 'patata', 'zanahoria',
  { word: 'patatas fritas', aliases: ['papas fritas', 'patatas'] }
];

const COMIDA_NORMAL: WordEntry[] = [
  'gazpacho', 'salmorejo', 'empanada', 'guacamole', 'quesadilla', 'nachos', 'crepe', 'gofre',
  'tortitas', 'brownie', 'tiramisú', 'natillas', 'torrijas', 'alcachofa', 'espárragos', 'berenjena',
  'calabacín', 'champiñón', 'setas', 'aceitunas', 'pepino', 'pimiento', 'aguacate', 'mango',
  'kiwi', 'melocotón', 'albaricoque', 'higo', 'granada', 'frambuesa', 'arándanos', 'moras',
  'melón', 'lentejas', 'garbanzos', 'judías', 'guisantes', 'maíz', 'calamares',
  { word: 'tortilla de patatas', aliases: ['tortilla española', 'tortilla de patata'] },
  { word: 'arroz con leche', aliases: ['arroz con leche'] },
  { word: 'perrito caliente', aliases: ['hot dog', 'hotdog'] },
  { word: 'tarta de queso', aliases: ['cheesecake'] },
  { word: 'ensaladilla rusa', aliases: ['ensaladilla'] },
  { word: 'patatas bravas', aliases: ['bravas'] },
  { word: 'chocolate caliente', aliases: ['cacao caliente'] },
  { word: 'zumo de naranja', aliases: ['jugo de naranja'] }
];

const COMIDA_DIFICIL: WordEntry[] = [
  'ceviche', 'canelones', 'gyozas', 'ramen', 'fideuá', 'carpaccio', 'profiteroles', 'turrón',
  { word: 'pulpo a la gallega', aliases: ['pulpo a feira', 'pulpo'] },
  { word: 'fabada asturiana', aliases: ['fabada'] },
  { word: 'cocido madrileño', aliases: ['cocido'] },
  { word: 'calamares a la romana', aliases: ['calamares rebozados'] },
  { word: 'bogavante', aliases: ['langosta'] },
  { word: 'ostras', aliases: ['ostra'] },
  { word: 'mejillones', aliases: ['mejillon'] },
  { word: 'crema catalana', aliases: ['crema quemada'] },
  { word: 'roscón de reyes', aliases: ['roscon'] },
  { word: 'pisto manchego', aliases: ['pisto'] },
  { word: 'huevos rotos', aliases: ['huevos estrellados'] },
  { word: 'fondue de queso', aliases: ['fondue'] },
  { word: 'pimientos de padrón', aliases: ['pimientos de padron'] }
];

// ============================================================================
// 3. OBJETOS (~140 palabras: ~85% una sola palabra, ~15% compuestos naturales)
// ============================================================================
const OBJETOS_FACIL: WordEntry[] = [
  'paraguas', 'martillo', 'reloj', 'mochila', 'gafas', 'móvil', 'ordenador', 'televisión',
  'nevera', 'tenedor', 'cuchillo', 'cuchara', 'llave', 'maleta', 'ventilador', 'micrófono',
  'extintor', 'cámara', 'linterna', 'espejo', 'silla', 'mesa', 'sofá', 'cama', 'lámpara',
  'cepillo', 'escoba', 'pala', 'tijeras', 'casco', 'globo', 'cometa', 'puerta', 'ventana',
  'armario', 'estantería', 'alfombra', 'cuadro', 'jarrón', 'maceta', 'plato', 'vaso', 'taza',
  'botella', 'sartén', 'olla', 'cubo', 'percha', 'toalla', 'jabón', 'peine', 'lápiz',
  'bolígrafo', 'goma', 'regla', 'cuaderno', 'libro', 'candado', 'bombilla', 'vela'
];

const OBJETOS_NORMAL: WordEntry[] = [
  'aspiradora', 'tostadora', 'microondas', 'lavadora', 'secador', 'plancha', 'cafetera',
  'auriculares', 'teclado', 'ratón', 'pantalla', 'radio', 'altavoz', 'enchufe', 'cable',
  'pilas', 'batería', 'brújula', 'mapa', 'termómetro', 'balanza', 'despertador', 'prismáticos',
  'telescopio', 'microscopio', 'lupa', 'sombrero', 'gorra', 'bufanda', 'guantes', 'cinturón',
  'corbata', 'anillo', 'collar', 'pulsera', 'pendientes', 'grapadora', 'clip', 'sobre',
  'cerilla', 'mechero', 'hucha', 'sacacorchos', 'abrelatas', 'embudo', 'regadera', 'flotador',
  'diana', 'patinete', 'monopatín',
  { word: 'reloj de arena', aliases: ['clepsidra'] },
  { word: 'gafas de sol', aliases: ['lentes de sol'] },
  { word: 'cepillo de dientes', aliases: ['cepillo dental'] },
  { word: 'mando a distancia', aliases: ['mando de la tele', 'control remoto'] }
];

const OBJETOS_DIFICIL: WordEntry[] = [
  'tocadiscos', 'proyector', 'podómetro', 'metrónomo', 'barómetro', 'caleidoscopio', 'periscopio',
  'multímetro', 'gramófono', 'desatascador', 'cortacésped', 'motosierra',
  { word: 'máquina de coser', aliases: ['maquina coser'] },
  { word: 'detector de metales', aliases: ['detector metales'] },
  { word: 'walkie talkie', aliases: ['walkie', 'transmisor'] },
  { word: 'chaleco salvavidas', aliases: ['salvavidas'] },
  { word: 'cinta métrica', aliases: ['metro', 'flexómetro'] },
  { word: 'nivel de burbuja', aliases: ['nivel'] },
  { word: 'gato hidráulico', aliases: ['gato mecanico'] }
];

// ============================================================================
// 4. LUGARES (~130 palabras: ~80% una sola palabra, ~20% monumentos/ciudades famosas)
// ============================================================================
const LUGARES_FACIL: WordEntry[] = [
  'playa', 'hospital', 'aeropuerto', 'castillo', 'colegio', 'universidad', 'supermercado',
  'cementerio', 'parque', 'estadio', 'cine', 'restaurante', 'isla', 'faro', 'gasolinera',
  'biblioteca', 'zoológico', 'museo', 'iglesia', 'cárcel', 'hotel', 'discoteca', 'gimnasio',
  'piscina', 'granja', 'bosque', 'desierto', 'montaña', 'volcán', 'cueva', 'puerto',
  'estación', 'fábrica', 'banco', 'farmacia', 'panadería', 'carnicería', 'teatro', 'circo',
  'casino', 'acuario', 'plaza', 'puente', 'túnel', 'calle', 'rascacielos', 'cabaña', 'iglú', 'pirámide',
  { word: 'parque de atracciones', aliases: ['parque temático', 'feria'] }
];

const LUGARES_NORMAL: WordEntry[] = [
  'comisaría', 'ayuntamiento', 'planetario', 'mirador', 'mezquita', 'catedral', 'templo',
  'helipuerto', 'observatorio', 'campamento', 'mina', 'pantano', 'laberinto', 'oasis',
  'alcantarilla', 'balcón', 'terraza', 'garaje', 'invernadero',
  { word: 'Torre Eiffel', aliases: ['torre eiffel', 'la torre eiffel'] },
  { word: 'Coliseo', aliases: ['coliseo romano', 'coliseo de roma'] },
  { word: 'Estatua de la Libertad', aliases: ['estatua libertad'] },
  { word: 'Big Ben', aliases: ['reloj de londres', 'torre big ben'] },
  { word: 'Sagrada Familia', aliases: ['la sagrada familia'] },
  { word: 'Gran Muralla', aliases: ['gran muralla china', 'muralla china'] },
  { word: 'Taj Mahal', aliases: ['tajmahal'] },
  { word: 'Pirámides de Egipto', aliases: ['piramides', 'giza'] },
  { word: 'Nueva York', aliases: ['new york', 'nueva york'] },
  { word: 'París', aliases: ['paris'] },
  { word: 'Londres', aliases: ['london'] },
  { word: 'Roma', aliases: ['rome'] },
  { word: 'Tokio', aliases: ['tokyo'] },
  { word: 'Venecia', aliases: ['venice'] }
];

const LUGARES_DIFICIL: WordEntry[] = [
  'pentágono', 'búnker', 'hangar', 'monasterio', 'catacumbas', 'acueducto', 'teleférico',
  { word: 'Machu Picchu', aliases: ['machu picchu', 'machupicchu'] },
  { word: 'Stonehenge', aliases: ['stonehenge'] },
  { word: 'Cataratas del Niágara', aliases: ['cataratas niagara', 'niagara'] },
  { word: 'Monte Everest', aliases: ['everest'] },
  { word: 'Gran Cañón', aliases: ['gran canon', 'gran cañon del colorado'] },
  { word: 'Monte Fuji', aliases: ['fuji'] },
  { word: 'Torre de Pisa', aliases: ['torre inclinada'] },
  { word: 'Ópera de Sídney', aliases: ['opera de sydney', 'opera de sidney'] },
  { word: 'Hollywood', aliases: ['letrero de hollywood'] },
  { word: 'estación espacial', aliases: ['estacion internacional', 'iss'] },
  { word: 'plataforma petrolífera', aliases: ['plataforma marina'] },
  { word: 'central nuclear', aliases: ['planta nuclear'] }
];

// ============================================================================
// 5. CINE Y TELEVISIÓN (~125 conceptos: Películas, series y personajes célebres)
// ============================================================================
const CINE_TV_FACIL: WordEntry[] = [
  { word: 'Titanic', aliases: ['el titanic'] },
  { word: 'Shrek', aliases: ['shrek el ogro'] },
  { word: 'Avatar', aliases: ['avatar james cameron'] },
  { word: 'Frozen', aliases: ['elsa frozen', 'olaf'] },
  { word: 'Batman', aliases: ['el caballero oscuro', 'bruce wayne'] },
  { word: 'Superman', aliases: ['clark kent'] },
  { word: 'Spider-Man', aliases: ['spiderman', 'hombre araña', 'el hombre araña'] },
  { word: 'Joker', aliases: ['el bromas', 'el guason'] },
  { word: 'Barbie', aliases: ['muneca barbie'] },
  { word: 'Rocky', aliases: ['rocky balboa'] },
  { word: 'Gladiator', aliases: ['gladiador'] },
  { word: 'Matrix', aliases: ['neo', 'the matrix'] },
  { word: 'Alien', aliases: ['el octavo pasajero', 'xenomorfo'] },
  { word: 'Terminator', aliases: ['arnold terminator'] },
  { word: 'Toy Story', aliases: ['woody y buzz', 'buzz lightyear'] },
  { word: 'Cars', aliases: ['rayo mcqueen', 'rayo macqueen'] },
  { word: 'Los Simpson', aliases: ['los simpsons', 'homer simpson', 'bart simpson'] },
  { word: 'Futurama', aliases: ['bender'] },
  { word: 'Friends', aliases: ['serie friends'] },
  { word: 'Harry Potter', aliases: ['potter', 'hogwarts'] },
  { word: 'Star Wars', aliases: ['la guerra de las galaxias'] },
  { word: 'Bob Esponja', aliases: ['spongebob', 'fondo de bikini'] },
  { word: 'Jurassic Park', aliases: ['parque jurasico', 'dinosaurios jurassic'] },
  { word: 'El Rey León', aliases: ['el rey leon', 'simba'] },
  { word: 'Tarzán', aliases: ['tarzan'] },
  { word: 'Aladdín', aliases: ['aladdin', 'el genio'] },
  { word: 'Pinocho', aliases: ['pinocchio'] },
  { word: 'Cenicienta', aliases: ['cinderella'] },
  { word: 'Coco', aliases: ['pelicula coco'] },
  { word: 'Nemo', aliases: ['buscando a nemo'] },
  { word: 'Minions', aliases: ['los minions', 'minion'] },
  { word: 'Thor', aliases: ['thor dios del trueno'] },
  { word: 'Hulk', aliases: ['el increible hulk'] },
  { word: 'Ironman', aliases: ['iron man', 'tony stark'] },
  { word: 'Deadpool', aliases: ['masacre'] },
  { word: 'Yoda', aliases: ['maestro yoda', 'baby yoda'] },
  { word: 'Drácula', aliases: ['conde dracula', 'dracula'] },
  { word: 'Frankenstein', aliases: ['monstruo de frankenstein'] },
  { word: 'Godzilla', aliases: ['godzila'] },
  { word: 'King Kong', aliases: ['kong'] }
];

const CINE_TV_NORMAL: WordEntry[] = [
  { word: 'Wednesday', aliases: ['miercoles', 'miercoles addams'] },
  { word: 'Stranger Things', aliases: ['stranger things', 'once'] },
  { word: 'Breaking Bad', aliases: ['walter white', 'heisenberg'] },
  { word: 'Los Vengadores', aliases: ['avengers', 'los avengers'] },
  { word: 'El Señor de los Anillos', aliases: ['senor de los anillos', 'el senor de los anillos', 'esdla', 'lotr'] },
  { word: 'Los Increíbles', aliases: ['los increibles', 'mr increible'] },
  { word: 'La Sirenita', aliases: ['ariel'] },
  { word: 'La Bella y la Bestia', aliases: ['bella y la bestia'] },
  { word: 'Cazafantasmas', aliases: ['los cazafantasmas', 'ghostbusters'] },
  { word: 'Regreso al Futuro', aliases: ['volver al futuro', 'delorean'] },
  { word: 'Piratas del Caribe', aliases: ['jack sparrow', 'piratas en el caribe'] },
  { word: 'Misión Imposible', aliases: ['mision imposible', 'tom cruise'] },
  { word: 'El Padrino', aliases: ['the godfather', 'vito corleone'] },
  { word: 'Indiana Jones', aliases: ['indy'] },
  { word: 'Peppa Pig', aliases: ['peppa'] },
  { word: 'Doraemon', aliases: ['gato cosmico'] },
  { word: 'Pocahontas', aliases: ['pocajontas'] },
  { word: 'Mulán', aliases: ['mulan'] },
  { word: 'Hércules', aliases: ['hercules disney'] },
  { word: 'Sherlock Holmes', aliases: ['sherlock'] },
  { word: 'Jack Sparrow', aliases: ['capitan jack sparrow'] },
  { word: 'Gollum', aliases: ['smeagol', 'mi tesoro'] },
  { word: 'Voldemort', aliases: ['lord voldemort', 'el que no debe ser nombrado'] },
  { word: 'Dumbledore', aliases: ['albus dumbledore'] },
  { word: 'Gandalf', aliases: ['gandalf el gris'] },
  { word: 'Darth Vader', aliases: ['anakin', 'vader'] },
  { word: 'Chewbacca', aliases: ['chewie'] },
  { word: 'Robocop', aliases: ['robo cop'] },
  { word: 'Rambo', aliases: ['john rambo'] },
  { word: 'Forrest Gump', aliases: ['gump'] },
  { word: 'Wall-E', aliases: ['walle'] },
  { word: 'Up', aliases: ['up la pelicula', 'casa con globos'] },
  { word: 'Ratatouille', aliases: ['ratatouille cocinero', 'remy'] },
  { word: 'Monstruos SA', aliases: ['monsters inc', 'sulley'] },
  { word: 'Kung Fu Panda', aliases: ['po el panda'] },
  { word: 'Madagascar', aliases: ['los pinguinos de madagascar'] },
  { word: 'Ice Age', aliases: ['la era de hielo', 'scrat'] },
  { word: 'Los Juegos del Hambre', aliases: ['juegos del hambre', 'katniss'] },
  { word: 'Crepúsculo', aliases: ['twilight', 'vampiros crepusculo'] }
];

const CINE_TV_DIFICIL: WordEntry[] = [
  { word: 'Juego de Tronos', aliases: ['game of thrones', 'trono de hierro', 'got'] },
  { word: 'Pulp Fiction', aliases: ['pulp fiction tarantino'] },
  { word: 'El Caballero Oscuro', aliases: ['the dark knight'] },
  { word: 'Interestelar', aliases: ['interstellar'] },
  { word: 'El Club de la Lucha', aliases: ['fight club'] },
  { word: 'Eduardo Manostijeras', aliases: ['el joven manos de tijera'] },
  { word: 'Pesadilla antes de Navidad', aliases: ['jack skellington'] },
  { word: 'Alicia en el País de las Maravillas', aliases: ['alicia en el pais de las maravillas'] },
  { word: 'Blancanieves', aliases: ['blanca nieves'] },
  { word: 'La Pantera Rosa', aliases: ['pantera rosa'] },
  { word: 'Scooby Doo', aliases: ['scooby'] },
  { word: 'Los Picapiedra', aliases: ['pedro picapiedra'] },
  { word: 'El Show de Truman', aliases: ['truman show'] },
  { word: 'Blade Runner', aliases: ['bladerunner'] },
  { word: 'Kill Bill', aliases: ['la novia kill bill'] },
  { word: 'El Resplandor', aliases: ['the shining', 'jack torrance'] },
  { word: 'Men in Black', aliases: ['hombres de negro', 'mib'] },
  { word: 'Karate Kid', aliases: ['daniel san', 'senor miyagi'] },
  { word: 'El Mago de Oz', aliases: ['mago de oz', 'dorothy'] },
  { word: 'ET el Extraterrestre', aliases: ['et', 'e.t.'] },
  { word: 'Tiburón', aliases: ['pelicula tiburon', 'jaws'] }
];

// ============================================================================
// 6. VIDEOJUEGOS (~130 videojuegos reales y franquicias célebres)
// ============================================================================
const VIDEOJUEGOS_FACIL: WordEntry[] = [
  { word: 'Minecraft', aliases: ['maincra'] },
  { word: 'Fortnite', aliases: ['fornite', 'fort night'] },
  { word: 'Roblox', aliases: ['roblox game'] },
  { word: 'Tetris', aliases: ['tetris bloques'] },
  { word: 'Pac-Man', aliases: ['pacman', 'pac man', 'comecocos'] },
  { word: 'Pokémon', aliases: ['pokemon', 'pikachu'] },
  { word: 'FIFA', aliases: ['ea sports fc', 'fifa futbol'] },
  { word: 'Among Us', aliases: ['amongus', 'el impostor'] },
  { word: 'Fall Guys', aliases: ['fallguys'] },
  { word: 'Super Mario', aliases: ['mario bros', 'super mario bros', 'mario'] },
  { word: 'Mario Kart', aliases: ['mariokart', 'carreras de mario'] },
  { word: 'GTA', aliases: ['grand theft auto', 'gta v', 'gta san andreas'] },
  { word: 'Sonic', aliases: ['sonic el erizo', 'sonic the hedgehog'] },
  { word: 'Zelda', aliases: ['the legend of zelda', 'link'] },
  { word: 'Rocket League', aliases: ['coches y futbol'] },
  { word: 'The Sims', aliases: ['los sims', 'sims'] },
  { word: 'Brawl Stars', aliases: ['brawlstars'] },
  { word: 'Clash Royale', aliases: ['clashroyale'] },
  { word: 'Overwatch', aliases: ['over watch'] },
  { word: 'Valorant', aliases: ['valo'] },
  { word: 'Terraria', aliases: ['terraria 2d'] },
  { word: 'Portal', aliases: ['portal gun', 'glados'] },
  { word: 'Skyrim', aliases: ['the elder scrolls skyrim', 'dovahkiin'] },
  { word: 'Doom', aliases: ['doom slayer'] },
  { word: 'Tekken', aliases: ['teken'] },
  { word: 'Street Fighter', aliases: ['ryu y ken', 'streetfighter'] },
  { word: 'Donkey Kong', aliases: ['donkey', 'donkey kong country'] },
  { word: 'Kirby', aliases: ['kirby rosa'] },
  { word: 'Angry Birds', aliases: ['angrybirds', 'pajaros enfadados'] },
  { word: 'Subway Surfers', aliases: ['subway surfer', 'subwaysurfers'] }
];

const VIDEOJUEGOS_NORMAL: WordEntry[] = [
  { word: 'Call of Duty', aliases: ['cod', 'warzone', 'callofduty'] },
  { word: 'League of Legends', aliases: ['lol', 'leagueoflegends'] },
  { word: 'Apex Legends', aliases: ['apex'] },
  { word: 'God of War', aliases: ['kratos', 'godofwar'] },
  { word: 'Genshin Impact', aliases: ['genshin'] },
  { word: 'Hollow Knight', aliases: ['hollowknight'] },
  { word: 'Cuphead', aliases: ['cup head'] },
  { word: 'Crash Bandicoot', aliases: ['crash'] },
  { word: 'Mortal Kombat', aliases: ['mortalkombat', 'scorpion y subzero'] },
  { word: 'Animal Crossing', aliases: ['animalcrossing', 'tom nook'] },
  { word: 'Super Smash Bros', aliases: ['smash bros', 'smash'] },
  { word: 'Red Dead Redemption', aliases: ['red dead', 'rdr2'] },
  { word: 'Counter Strike', aliases: ['csgo', 'cs go', 'counter'] },
  { word: 'World of Warcraft', aliases: ['wow'] },
  { word: 'Resident Evil', aliases: ['biohazard', 'resident evil zombie'] },
  { word: 'Final Fantasy', aliases: ['finalfantasy', 'cloud strife'] },
  { word: 'Assassin\'s Creed', aliases: ['assassins creed', 'credo de asesinos'] },
  { word: 'Monster Hunter', aliases: ['monsterhunter'] },
  { word: 'Need for Speed', aliases: ['nfs', 'needforspeed'] },
  { word: 'Dark Souls', aliases: ['darksouls', 'hoguera'] },
  { word: 'Elden Ring', aliases: ['eldenring', 'tierras intermedias'] },
  { word: 'Cyberpunk', aliases: ['cyberpunk 2077'] },
  { word: 'The Witcher', aliases: ['witcher', 'geralt de rivia'] },
  { word: 'Splatoon', aliases: ['calamares y tinta'] },
  { word: 'Celeste', aliases: ['escalar montana celeste'] },
  { word: 'Rayman', aliases: ['rayman origins'] },
  { word: 'Pikmin', aliases: ['pikmins'] },
  { word: 'Bioshock', aliases: ['big daddy'] },
  { word: 'Rust', aliases: ['juego rust'] },
  { word: 'Subnautica', aliases: ['submarino subnautica'] },
  { word: 'Halo', aliases: ['master chief', 'jefe maestro'] },
  { word: 'Uncharted', aliases: ['nathan drake'] },
  { word: 'Spyro', aliases: ['spyro el dragon'] },
  { word: 'Metroid', aliases: ['samus aran', 'samus'] },
  { word: 'Undertale', aliases: ['sans'] },
  { word: 'Fallout', aliases: ['pipboy', 'refugio fallout'] },
  { word: 'Half-Life', aliases: ['halflife', 'gordon freeman'] },
  { word: 'Tomb Raider', aliases: ['lara croft'] },
  { word: 'Mega Man', aliases: ['megaman'] }
];

const VIDEOJUEGOS_DIFICIL: WordEntry[] = [
  { word: 'Bloodborne', aliases: ['cazador bloodborne'] },
  { word: 'Hades', aliases: ['zagreo hades'] },
  { word: 'Dead Cells', aliases: ['deadcells'] },
  { word: 'Sea of Thieves', aliases: ['mar de ladrones'] },
  { word: 'Team Fortress', aliases: ['tf2'] },
  { word: 'Left 4 Dead', aliases: ['l4d'] },
  { word: 'Payday', aliases: ['payday atracos'] },
  { word: 'Dead by Daylight', aliases: ['dbd'] },
  { word: 'Phasmophobia', aliases: ['fantasmas phasmophobia'] },
  { word: 'Geometry Dash', aliases: ['geometrydash'] },
  { word: 'Stardew Valley', aliases: ['stardew'] },
  { word: 'Factorio', aliases: ['factorio fabricas'] },
  { word: 'Civilization', aliases: ['civ'] },
  { word: 'Age of Empires', aliases: ['age of empires estrategia'] },
  { word: 'SimCity', aliases: ['construir ciudad simcity'] },
  { word: 'Gran Turismo', aliases: ['simulador gran turismo'] },
  { word: 'Guitar Hero', aliases: ['guitarhero', 'guitarra videojuego'] },
  { word: 'Just Dance', aliases: ['justdance'] },
  { word: 'Kingdom Hearts', aliases: ['llave espada'] },
  { word: 'Persona 5', aliases: ['phantom thieves'] },
  { word: 'Sekiro', aliases: ['sekiro sombras mueren dos veces'] },
  { word: 'Metal Gear Solid', aliases: ['metal gear', 'solid snake'] },
  { word: 'Silent Hill', aliases: ['cabeza de piramide', 'niebla silent hill'] },
  { word: 'Dead Space', aliases: ['isaac clarke'] }
];

// ============================================================================
// 7. DEPORTES (~115 disciplinas deportivas y conceptos directos)
// ============================================================================
const DEPORTES_FACIL: WordEntry[] = [
  'fútbol', 'tenis', 'baloncesto', 'boxeo', 'natación', 'surf', 'esquí', 'golf',
  'ciclismo', 'voleibol', 'rugby', 'karate', 'judo', 'patinaje', 'escalada', 'béisbol',
  'hockey', 'pádel', 'atletismo', 'motociclismo', 'gimnasia', 'piragüismo', 'esgrima',
  'waterpolo', 'triatlón', 'remo', 'bádminton', 'balonmano', 'billar', 'dardos', 'bolos', 'ajedrez'
];

const DEPORTES_NORMAL: WordEntry[] = [
  'snowboard', 'windsurf', 'rafting', 'paracaidismo', 'submarinismo', 'vela', 'equitación',
  'taekwondo', 'halterofilia', 'motocross', 'rally', 'polo', 'críquet', 'petanca',
  { word: 'Fórmula 1', aliases: ['f1', 'formula uno', 'formula 1'] },
  { word: 'ping pong', aliases: ['tenis de mesa', 'pingpong'] },
  { word: 'fútbol sala', aliases: ['futsal'] },
  { word: 'salto de longitud', aliases: ['salto longitud'] },
  { word: 'salto de altura', aliases: ['salto altura'] },
  { word: 'tiro con arco', aliases: ['tiro arco', 'arquería'] },
  { word: 'carrera de vallas', aliases: ['vallas'] },
  { word: 'patinaje sobre hielo', aliases: ['patinaje artistico'] },
  { word: 'lucha libre', aliases: ['wrestling'] }
];

const DEPORTES_DIFICIL: WordEntry[] = [
  'curling', 'bobsleigh', 'skeleton', 'biatlón', 'decatlón',
  { word: 'salto con pértiga', aliases: ['pertiga', 'garrocha'] },
  { word: 'lanzamiento de jabalina', aliases: ['jabalina'] },
  { word: 'lanzamiento de disco', aliases: ['disco atletismo'] },
  { word: 'lanzamiento de martillo', aliases: ['martillo atletismo'] },
  { word: 'natación sincronizada', aliases: ['natacion artistica'] },
  { word: 'hockey sobre hielo', aliases: ['hockey hielo'] },
  { word: 'tiro al plato', aliases: ['tiro al pichon'] },
  { word: 'doma clásica', aliases: ['equitacion artistica'] },
  { word: 'salto de trampolín', aliases: ['clavado'] }
];

// ============================================================================
// 8. PROFESIONES (~120 profesiones y oficios reales)
// ============================================================================
const PROFESIONES_FACIL: WordEntry[] = [
  'médico', 'bombero', 'policía', 'profesor', 'cocinero', 'astronauta', 'fontanero',
  'fotógrafo', 'mecánico', 'dentista', 'veterinario', 'piloto', 'cartero', 'pintor',
  'detective', 'abogado', 'juez', 'camarero', 'panadero', 'peluquero', 'electricista',
  'actor', 'cantante', 'periodista', 'socorrista', 'enfermero', 'jardinero', 'pescador',
  'granjero', 'carnicero', 'zapatero', 'carpintero', 'albañil'
];

const PROFESIONES_NORMAL: WordEntry[] = [
  'arquitecto', 'científico', 'locutor', 'músico', 'bailarín', 'mago', 'pastor',
  'cajero', 'arqueólogo', 'paleontólogo', 'buzo', 'relojero', 'joyero', 'escultor',
  'cirujano', 'apicultor', 'guardabosques', 'trapecista', 'minero', 'militar', 'soldado',
  'barrendero', 'cerrajero', 'informático', 'taxista', 'bibliotecario', 'farmacéutico',
  'óptico', 'fisioterapeuta', 'psicólogo',
  { word: 'conductor de autobús', aliases: ['chófer', 'chofer de autobus'] },
  { word: 'azafata de vuelo', aliases: ['azafata', 'auxiliar de vuelo'] },
  { word: 'guía turístico', aliases: ['guia'] }
];

const PROFESIONES_DIFICIL: WordEntry[] = [
  'meteorólogo', 'sommelier', 'luthier', 'restaurador', 'encuadernador', 'domador',
  'titiritero', 'mimo', 'ventrílocuo', 'alpinista', 'acróbata', 'orfebre', 'taxidermista',
  'guardacostas', 'cartógrafo', 'botánico', 'astrónomo', 'geólogo',
  { word: 'controlador aéreo', aliases: ['controlador de vuelo'] },
  { word: 'soplador de vidrio', aliases: ['artesano del vidrio'] },
  { word: 'doble de acción', aliases: ['especialista de cine'] }
];

// ============================================================================
// 9. NATURALEZA (~125 paisajes, clima, fenómenos y elementos naturales)
// ============================================================================
const NATURALEZA_FACIL: WordEntry[] = [
  'volcán', 'tornado', 'montaña', 'río', 'cascada', 'bosque', 'desierto', 'isla',
  'tormenta', 'arcoíris', 'nube', 'relámpago', 'glaciar', 'cueva', 'palmera', 'lago',
  'mar', 'océano', 'playa', 'selva', 'huracán', 'meteorito', 'luna', 'sol', 'estrella',
  'nieve', 'lluvia', 'granizo', 'viento', 'niebla', 'árbol', 'flor', 'rosa', 'margarita',
  'girasol', 'cactus', 'hierba', 'hoja', 'roca', 'piedra'
];

const NATURALEZA_NORMAL: WordEntry[] = [
  'acantilado', 'valle', 'pradera', 'pantano', 'oasis', 'iceberg', 'cometa', 'eclipse',
  'galaxia', 'planeta', 'bambú', 'helecho', 'rama', 'semilla', 'raíz', 'tulipán',
  'orquídea', 'amapola', 'loto', 'musgo', 'seta', 'hongo', 'duna', 'géiser', 'cañón',
  'fiordo', 'arrecife', 'manantial', 'charco', 'marea', 'ola', 'tsunami', 'terremoto',
  { word: 'estrella fugaz', aliases: ['cometa brillante'] },
  { word: 'aurora boreal', aliases: ['luces del norte'] },
  { word: 'luna llena', aliases: ['plenilunio'] },
  { word: 'arrecife de coral', aliases: ['coral'] },
  { word: 'arena movediza', aliases: ['arenas movedizas'] }
];

const NATURALEZA_DIFICIL: WordEntry[] = [
  'secuoya', 'baobab', 'bonsái', 'nenúfar', 'estalactita', 'estalagmita', 'manglar',
  'taiga', 'tundra', 'cráter', 'atolón', 'cenote', 'nebulosa',
  { word: 'sauce llorón', aliases: ['sauce'] },
  { word: 'planta carnívora', aliases: ['carnivora'] },
  { word: 'falla tectónica', aliases: ['grieta sismica'] },
  { word: 'lluvia de estrellas', aliases: ['perseidas'] }
];

// ============================================================================
// 10. ACCIONES Y SITUACIONES (~115 verbos y acciones humanas inmediatas)
// ============================================================================
const ACCIONES_FACIL: WordEntry[] = [
  'bailar', 'dormir', 'correr', 'saltar', 'estornudar', 'cocinar', 'caerse', 'nadar',
  'esconderse', 'casarse', 'surfear', 'cantar', 'llorar', 'reír', 'pescar', 'conducir',
  'volar', 'escalar', 'pelear', 'besar', 'abrazar', 'ducharse', 'patinar', 'bucear',
  'dibujar', 'escribir', 'leer', 'barrer', 'pintar', 'aplaudir', 'silbar', 'bostezar',
  'tropezar', 'resbalar', 'comer', 'beber', 'esquiar', 'soñar', 'gritar', 'saludar'
];

const ACCIONES_NORMAL: WordEntry[] = [
  'afeitarse', 'peinarse', 'vestirse', 'fregar', 'planchar', 'coser', 'tejer', 'podar',
  'regar', 'cavar', 'remar', 'boxear', 'gatear', 'trotar',
  { word: 'dar un beso', aliases: ['besar'] },
  { word: 'chocar los cinco', aliases: ['choca esos cinco', 'high five'] },
  { word: 'montar a caballo', aliases: ['cabalgar'] },
  { word: 'montar en bici', aliases: ['pedalear', 'andar en bicicleta'] },
  { word: 'lavarse los dientes', aliases: ['cepillarse los dientes'] },
  { word: 'abrir un regalo', aliases: ['desenvolver regalo'] },
  { word: 'soplar las velas', aliases: ['apagar las velas'] },
  { word: 'hacer una foto', aliases: ['tomar una foto', 'fotografiar'] },
  { word: 'atarse los cordones', aliases: ['atar cordones'] },
  { word: 'guiñar un ojo', aliases: ['guiño'] },
  { word: 'hacer malabares', aliases: ['malabarismo'] },
  { word: 'hacer equilibrio', aliases: ['equilibrio'] }
];

const ACCIONES_DIFICIL: WordEntry[] = [
  { word: 'hacer autostop', aliases: ['autostop'] },
  { word: 'pedir matrimonio', aliases: ['proposicion de matrimonio', 'pedir la mano'] },
  { word: 'pedir un deseo', aliases: ['deseo'] },
  { word: 'cruzar los dedos', aliases: ['dedos cruzados'] },
  { word: 'hacer yoga', aliases: ['postura de yoga'] },
  { word: 'tocar el piano', aliases: ['pianista'] },
  { word: 'tocar la guitarra', aliases: ['guitarrista'] },
  { word: 'tocar la batería', aliases: ['baterista'] },
  { word: 'tirar la basura', aliases: ['botar la basura'] },
  { word: 'cruzar el paso de cebra', aliases: ['paso de cebra'] },
  { word: 'inflar un globo', aliases: ['soplar un globo'] },
  { word: 'hacer pompas de jabón', aliases: ['burbujas'] },
  { word: 'tirarse en paracaídas', aliases: ['saltar en paracaidas'] },
  { word: 'saltar en trampolín', aliases: ['cama elastica'] }
];

// ============================================================================
// MASTER LIST EXPORT
// ============================================================================
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
  const categoriesPool: PinturilloCategory[] =
    allowedCategories && allowedCategories.length > 0
      ? allowedCategories
      : [
          'animales',
          'comida',
          'objetos',
          'lugares',
          'cine_tv',
          'videojuegos',
          'deportes',
          'profesiones',
          'naturaleza',
          'acciones',
        ];

  // Filter available words by enabled categories and not already used
  const categoryWords = PINTURILLO_WORDS.filter((w) => categoriesPool.includes(w.category));
  const available = categoryWords.filter((w) => !usedWords.has(w.word.toLowerCase()));
  const pool =
    available.length >= count
      ? available
      : categoryWords.length >= count
      ? categoryWords
      : PINTURILLO_WORDS;

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
    const catWords = (byCat[cat] || []).filter((w) => !chosenWordsSet.has(w.word));
    if (catWords.length > 0) {
      // Pick balanced difficulty (40% facil, 45% normal, 15% dificil)
      const r = Math.random();
      const targetDiff = r < 0.4 ? 'FACIL' : r < 0.85 ? 'NORMAL' : 'DIFICIL';
      const matchingDiff = catWords.filter((w) => w.difficulty === targetDiff);
      const chosen =
        matchingDiff.length > 0
          ? matchingDiff[Math.floor(Math.random() * matchingDiff.length)]
          : catWords[Math.floor(Math.random() * catWords.length)];

      selected.push(chosen);
      chosenWordsSet.add(chosen.word);
    }
  }

  // Fill up if needed from remaining pool while ensuring distinct items
  while (selected.length < count) {
    const remaining = pool.filter((w) => !chosenWordsSet.has(w.word));
    if (remaining.length === 0) break;
    const fallback = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(fallback);
    chosenWordsSet.add(fallback.word);
  }

  return selected.slice(0, count);
}
