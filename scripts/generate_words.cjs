const fs = require('fs');
const path = require('path');

// 1. ANIMALES (182 entries, ~87% single words)
const ANIMALES_FACIL = [
  'perro', 'gato', 'oso', 'león', 'tigre', 'elefante', 'jirafa', 'mono', 'gorila',
  'vaca', 'toro', 'caballo', 'cerdo', 'oveja', 'cabra', 'pato', 'conejo', 'pez',
  'delfín', 'ballena', 'tortuga', 'rana', 'serpiente', 'pájaro', 'loro', 'águila', 'búho', 'mariposa',
  'abeja', 'mosca', 'araña', 'hormiga', 'cangrejo', 'caracol', 'gallina', 'gallo', 'burro', 'lobo',
  'zorro', 'pingüino', 'pulpo', 'koala', 'cebra', 'rinoceronte', 'hipopótamo', 'camello', 'foca', 'ciervo',
  'paloma', 'cisne', 'leopardo', 'ganso', 'ratoncito', 'pavo', 'buey', 'yegua', 'cordero', 'potro',
  'canario', 'periquito', 'hamster', 'tiburón',
  { word: 'oso polar', aliases: ['polar', 'oso del polo'] },
  { word: 'oso panda', aliases: ['panda'] },
  { word: 'pez payaso', aliases: ['nemo', 'payaso'] },
  { word: 'pavo real', aliases: ['pavorreal'] },
  { word: 'estrella de mar', aliases: ['estrella marina'] },
  { word: 'caballito de mar', aliases: ['hipocampo'] },
  { word: 'pez espada', aliases: ['espadarte'] }
];

const ANIMALES_NORMAL = [
  'flamenco', 'erizo', 'ardilla', 'murciélago', 'medusa', 'camaleón', 'castor', 'nutria', 'mapache',
  'pelícano', 'avestruz', 'tucán', 'colibrí', 'halcón', 'gaviota', 'golondrina', 'cuervo',
  'guepardo', 'hiena', 'morsa', 'canguro', 'topo', 'grillo', 'saltamontes', 'mantis', 'luciérnaga',
  'escorpión', 'calamar', 'chimpancé', 'orangután', 'perezoso', 'armadillo', 'ornitorrinco', 'lémur',
  'suricata', 'iguana', 'sapo', 'alce', 'jabalí', 'dromedario', 'langosta', 'mosquito', 'avispa',
  'mariquita', 'libélula', 'salmón', 'atún', 'buitre', 'cigüeña', 'lince', 'comadreja', 'hurón',
  'tejón', 'gacela', 'ñu', 'chacal', 'chinchilla', 'mangosta', 'caracal', 'ñandú', 'búfalo', 'leona',
  'pantera', 'jaguar', 'dálmata', 'caniche', 'bisonte', 'orca', 'carpa', 'trucha', 'bacalao',
  { word: 'pez globo', aliases: ['globo'] },
  { word: 'mantarraya', aliases: ['manta raya', 'raya gigante'] },
  { word: 'oso pardo', aliases: ['oso'] },
  { word: 'lobo marino', aliases: ['otario'] },
  { word: 'perro salchicha', aliases: ['teckel', 'salchicha'] },
  { word: 'gato negro', aliases: ['gato'] },
  { word: 'tiburón martillo', aliases: ['martillo pez'] },
  { word: 'oso hormiguero', aliases: ['tamandúa', 'hormiguero'] }
];

const ANIMALES_DIFICIL = [
  'ajolote', 'narval', 'beluga', 'pangolín', 'capibara', 'ocelote', 'tapir', 'fenec', 'dodo',
  'quetzal', 'ciempiés', 'milpiés', 'tarántula', 'salamandra', 'gecko', 'walabí', 'wombat',
  'albatros', 'kakapo', 'gavial', 'basilisco', 'barracuda', 'piraña', 'morena', 'anémona',
  { word: 'dragón de komodo', aliases: ['varano de komodo', 'komodo'] },
  { word: 'demonio de tasmania', aliases: ['diablo de tasmania'] },
  { word: 'anguila eléctrica', aliases: ['anguila'] },
  { word: 'pez linterna', aliases: ['rape abisal'] },
  { word: 'pez león', aliases: ['pez leon'] },
  { word: 'cobra real', aliases: ['cobra'] },
  { word: 'anaconda verde', aliases: ['anaconda', 'boa'] },
  { word: 'cangrejo ermitaño', aliases: ['ermitaño'] },
  { word: 'escarabajo pelotero', aliases: ['pelotero'] }
];

// 2. COMIDA (180 entries, ~85% single words)
const COMIDA_FACIL = [
  'pizza', 'hamburguesa', 'paella', 'croqueta', 'tortilla', 'sushi', 'taco', 'burrito',
  'espaguetis', 'macarrones', 'lasaña', 'helado', 'churros', 'donut', 'galleta', 'tarta',
  'sandía', 'plátano', 'fresa', 'manzana', 'pera', 'naranja', 'limón', 'uva', 'cereza', 'piña',
  'melón', 'melocotón', 'tomate', 'zanahoria', 'patata', 'lechuga', 'cebolla', 'ajo', 'pan',
  'queso', 'huevo', 'jamón', 'salchicha', 'chocolate', 'palomitas', 'caramelo', 'bombón',
  'piruleta', 'chicle', 'magdalena', 'bizcocho', 'croissant', 'crepe', 'gofre', 'sopa',
  'arroz', 'bocadillo', 'sandwich', 'empanada', 'kebab', 'nachos', 'yogur', 'miel',
  'mantequilla', 'aceite', 'leche', 'café', 'té', 'zumo', 'refresco', 'batido',
  { word: 'patatas fritas', aliases: ['papas fritas', 'papas'] },
  { word: 'huevo frito', aliases: ['huevo'] },
  { word: 'ensalada mixta', aliases: ['ensalada'] },
  { word: 'tortilla de patatas', aliases: ['tortilla española', 'tortilla'] },
  { word: 'perrito caliente', aliases: ['hot dog', 'hotdog'] },
  { word: 'tarta de cumpleaños', aliases: ['pastel de cumpleaños', 'torta'] },
  { word: 'zumo de naranja', aliases: ['jugo de naranja'] },
  { word: 'chocolate caliente', aliases: ['cacao'] }
];

const COMIDA_NORMAL = [
  'aguacate', 'brócoli', 'berenjena', 'calabacín', 'calabaza', 'pepino', 'espárrago',
  'alcachofa', 'espinacas', 'guisantes', 'garbanzos', 'lentejas', 'alubias', 'maíz', 'aceituna',
  'almendra', 'nuez', 'avellana', 'pistacho', 'cacahuete', 'higo', 'ciruela', 'granada',
  'mango', 'papaya', 'frambuesa', 'arándano', 'mora', 'mandarina', 'pomelo', 'albaricoque',
  'albóndiga', 'filete', 'chuleta', 'costilla', 'calamares', 'gambas', 'langostino', 'mejillón',
  'almeja', 'ostra', 'salmorejo', 'gazpacho', 'fabada', 'cocido', 'guiso', 'canelones',
  'raviolis', 'flan', 'natillas', 'torrija', 'profiterol', 'tiramisú', 'brownie', 'mousse',
  'merengue', 'turrón', 'mazapán', 'polvorón', 'roscón', 'guacamole', 'hummus', 'mostaza',
  'mayonesa', 'kétchup', 'vinagre', 'champiñón comestible',
  { word: 'pan tostado', aliases: ['tostada'] },
  { word: 'leche con galletas', aliases: ['desayuno'] },
  { word: 'puré de patatas', aliases: ['pure'] },
  { word: 'tabla de quesos', aliases: ['quesos'] },
  { word: 'pollo asado', aliases: ['pollo al horno'] },
  { word: 'helado de fresa', aliases: ['cucurucho de fresa'] },
  { word: 'arroz con leche', aliases: ['arroz dulce'] },
  { word: 'pulpo a la gallega', aliases: ['pulpo'] }
];

const COMIDA_DIFICIL = [
  'fondue', 'sashimi', 'ramen', 'dim sum', 'tempura', 'ceviche', 'carpaccio', 'tartar',
  'risotto', 'falafel', 'couscous', 'curry', 'gyoza', 'edamame', 'wasabi', 'mochi',
  'macaron', 'chistorra', 'morcilla', 'sobrasada', 'gazpachuelo',
  { word: 'huevo poché', aliases: ['huevo escalfado'] },
  { word: 'salmón ahumado', aliases: ['salmon'] },
  { word: 'solomillo al punto', aliases: ['solomillo'] },
  { word: 'sopa de cebolla', aliases: ['sopa'] },
  { word: 'pastel de manzana', aliases: ['apple pie', 'tarta de manzana'] },
  { word: 'fondue de chocolate', aliases: ['fuente de chocolate'] },
  { word: 'brocheta de carne', aliases: ['brocheta', 'pincho moruno'] },
  { word: 'empanadilla de atún', aliases: ['empanadilla'] },
  { word: 'paella valenciana', aliases: ['paella de marisco'] }
];

// 3. OBJETOS (194 entries, ~85% single words)
const OBJETOS_FACIL = [
  'martillo', 'paraguas', 'gafas', 'reloj', 'teléfono', 'ordenador', 'televisión', 'silla',
  'mesa', 'sofá', 'cama', 'lámpara', 'llave', 'mochila', 'maleta', 'tijeras', 'cepillo',
  'espejo', 'cámara', 'guitarra', 'globo', 'regalo', 'casco', 'bicicleta', 'patinete',
  'libro', 'lápiz', 'bolígrafo', 'cuaderno', 'regla', 'sacapuntas', 'grapadora', 'pegamento',
  'sobre', 'carta', 'moneda', 'billete', 'cartera', 'bolso', 'peine', 'toalla',
  'secador', 'esponja', 'bañera', 'taza', 'vaso', 'plato', 'tenedor', 'cuchara',
  'cuchillo', 'sartén', 'olla', 'microondas', 'nevera', 'tostadora', 'cafetera', 'batidora',
  'plancha', 'aspiradora', 'escoba', 'fregona', 'cubo', 'candado', 'linterna', 'bombilla',
  'enchufe', 'batería', 'auriculares', 'micrófono', 'altavoz', 'teclado', 'pantalla',
  'dron', 'prismáticos', 'telescopio', 'brújula', 'mapa', 'termómetro',
  { word: 'cepillo de dientes', aliases: ['cepillo dental'] },
  { word: 'pasta de dientes', aliases: ['dentífrico'] },
  { word: 'gafas de sol', aliases: ['lentes de sol'] },
  { word: 'reloj de pulsera', aliases: ['reloj'] },
  { word: 'reloj de arena', aliases: ['clepsidra'] },
  { word: 'cinta adhesiva', aliases: ['fiso', 'celo'] },
  { word: 'pelota de playa', aliases: ['balón de playa'] },
  { word: 'botella de agua', aliases: ['botella'] },
  { word: 'ratón de pc', aliases: ['mouse'] }
];

const OBJETOS_NORMAL = [
  'despertador', 'calendario', 'cuadro', 'florero', 'alfombra', 'cortina', 'cojín', 'percha',
  'botón', 'aguja', 'dedal', 'paracaídas', 'flotador', 'salvavidas', 'yoyó', 'peonza',
  'tirachinas', 'monopatín', 'patines', 'trineo', 'máscara', 'antifaz', 'corona',
  'varita', 'espada', 'escudo', 'arco', 'flecha', 'cañón', 'ancla',
  'timón', 'farolillo', 'mechero', 'cerilla', 'cenicero', 'pipa', 'biberón',
  'chupete', 'sonajero', 'dado', 'baraja', 'trofeo',
  'medalla', 'diploma', 'sello', 'bocina', 'megáfono', 'antena',
  'cable', 'disco', 'cassette', 'tocadiscos', 'piano', 'trompeta', 'saxofón',
  'flauta', 'violín', 'tambor', 'arpa', 'acordeón', 'armónica', 'xilófono', 'maracas',
  'pandereta', 'castañuelas', 'clarinete', 'chelo', 'timbales', 'triángulo musical',
  { word: 'osito de peluche', aliases: ['peluche'] },
  { word: 'bola de cristal', aliases: ['esfera de cristal'] },
  { word: 'caja fuerte', aliases: ['caja de caudales'] },
  { word: 'bote salvavidas', aliases: ['lancha salvavidas'] },
  { word: 'globo terráqueo', aliases: ['mapamundi'] },
  { word: 'papel higiénico', aliases: ['rollo de papel'] },
  { word: 'palo de selfie', aliases: ['selfie stick'] },
  { word: 'máquina de escribir', aliases: ['escribir'] },
  { word: 'cometa voladora', aliases: ['cometa de viento'] },
  { word: 'mando a distancia', aliases: ['control remoto'] },
  { word: 'cubo de rubik', aliases: ['rubik'] },
  { word: 'pistola de agua', aliases: ['pistola de juguete'] }
];

const OBJETOS_DIFICIL = [
  'gramófono', 'periscopio', 'sextante', 'astrolabio', 'fuelle', 'yunque',
  'soldador', 'desbrozadora', 'motosierra', 'cincel', 'garlopa', 'gubia',
  'caleidoscopio', 'diapasón', 'metrónomo', 'estetoscopio', 'báscula', 'densímetro',
  { word: 'reloj de cuco', aliases: ['cuco'] },
  { word: 'máquina de coser', aliases: ['cosedora'] },
  { word: 'cuchillo jamonero', aliases: ['jamonero'] },
  { word: 'detector de metales', aliases: ['detector'] },
  { word: 'proyector de cine', aliases: ['proyector'] },
  { word: 'extintor de incendios', aliases: ['extintor'] },
  { word: 'caja de música', aliases: ['caja musical'] },
  { word: 'reloj de bolsillo', aliases: ['leontina'] }
];

// 4. LUGARES (161 entries, ~81% single words)
const LUGARES_FACIL = [
  'hospital', 'colegio', 'aeropuerto', 'estadio', 'supermercado', 'cine', 'restaurante', 'castillo',
  'iglesia', 'parque', 'zoológico', 'museo', 'biblioteca', 'gimnasio', 'discoteca', 'hotel',
  'gasolinera', 'puerto', 'farmacia', 'panadería', 'carnicería', 'peluquería',
  'banco', 'ayuntamiento', 'comisaría', 'circo', 'acuario', 'cementerio', 'prisión',
  'universidad', 'teatro', 'piscina', 'faro', 'molino', 'pirámide', 'iglú', 'rascacielos',
  'puente', 'túnel', 'plaza', 'calle', 'rotonda', 'fábrica', 'granja', 'invernadero',
  'cabaña', 'parking', 'helipuerto', 'camping', 'spa', 'bolera', 'quiosco', 'tienda',
  'bodega', 'tasca', 'albergue', 'balneario', 'motel', 'ermita', 'bazar', 'mercado',
  { word: 'parque de atracciones', aliases: ['feria'] },
  { word: 'pista de hielo', aliases: ['patinaje'] },
  { word: 'centro comercial', aliases: ['mall'] },
  { word: 'estación de tren', aliases: ['estacion ferroviaria'] },
  { word: 'estación de autobuses', aliases: ['terminal'] },
  { word: 'parada de autobús', aliases: ['marquesina'] },
  { word: 'parque infantil', aliases: ['columpios'] },
  { word: 'casa de madera', aliases: ['cabaña'] },
  { word: 'estación espacial', aliases: ['base espacial'] }
];

const LUGARES_NORMAL = [
  'laboratorio', 'planetario', 'observatorio', 'refugio', 'bungalow',
  'mansión', 'palacio', 'catedral', 'mezquita', 'sinagoga', 'templo', 'monasterio', 'convento',
  'fortaleza', 'muralla', 'búnker', 'trinchera', 'hangar', 'astillero',
  'muelle', 'dique', 'presa', 'acueducto', 'viaducto', 'callejón',
  'avenida', 'bulevar', 'autopista', 'peaje', 'lavandería', 'tintorería', 'ferretería',
  'joyería', 'juguetería', 'librería', 'zapatería', 'floristería', 'óptica', 'tanatorio',
  'tribunal', 'embajada', 'consulado', 'ruinas', 'laberinto', 'parador', 'hospicio',
  { word: 'parque acuático', aliases: ['toboganes'] },
  { word: 'circuito de carreras', aliases: ['karting'] },
  { word: 'estación de metro', aliases: ['boca de metro'] },
  { word: 'torre eiffel', aliases: ['paris'] },
  { word: 'estatua de la libertad', aliases: ['nueva york'] },
  { word: 'gran muralla china', aliases: ['muralla china'] },
  { word: 'coliseo romano', aliases: ['coliseo'] },
  { word: 'casa encantada', aliases: ['mansión encantada'] },
  { word: 'castillo hinchable', aliases: ['colchoneta'] },
  { word: 'taller mecánico', aliases: ['taller'] },
  { word: 'lavado de coches', aliases: ['autolavado'] },
  { word: 'tienda de campaña', aliases: ['carpa'] }
];

const LUGARES_DIFICIL = [
  'alcantarilla', 'catacumba', 'cripta', 'mausoleo', 'dolmen', 'menhir',
  'anfiteatro', 'claustro', 'campanario', 'alcazaba', 'alcázar', 'mazmorra', 'almena',
  'aduana', 'refinería', 'desguace', 'vertedero', 'serrería', 'fundición', 'cenotafio',
  'hipódromo', 'velódromo', 'kartódromo',
  { word: 'puente levadizo', aliases: ['levadizo'] },
  { word: 'foso del castillo', aliases: ['foso'] },
  { word: 'torre del homenaje', aliases: ['torreón'] },
  { word: 'plataforma petrolífera', aliases: ['petrolera'] },
  { word: 'central nuclear', aliases: ['planta nuclear'] },
  { word: 'parque eólico', aliases: ['molinos de viento'] },
  { word: 'huerto solar', aliases: ['placas solares'] },
  { word: 'ciudad sumergida', aliases: ['atlántida'] },
  { word: 'barco fantasma', aliases: ['navío fantasma'] },
  { word: 'base secreta', aliases: ['búnker subterráneo'] }
];

// 5. CINE Y TV (168 entries, ~65% single words)
const CINE_TV_FACIL = [
  'shrek', 'batman', 'superman', 'joker', 'barbie', 'rocky', 'gladiator', 'matrix', 'alien',
  'terminator', 'cars', 'frozen', 'mulan', 'tarzán', 'hércules', 'dumbo', 'pinocho', 'bambi',
  'coco', 'encanto', 'aladdín', 'cenicienta', 'blancanieves', 'thor', 'hulk', 'deadpool',
  'avatar', 'titanic', 'friends', 'wednesday', 'minions', 'rambo', 'robocop', 'gremlins',
  'godzilla', 'dracula', 'frankenstein', 'wolverine', 'aquaman', 'flash', 'catwoman',
  'baymax', 'stitch', 'moana', 'rapunzel', 'fiona', 'dobby', 'snape', 'mandalorian',
  { word: 'spider-man', aliases: ['spiderman', 'hombre araña'] },
  { word: 'harry potter', aliases: ['potter'] },
  { word: 'star wars', aliases: ['la guerra de las galaxias'] },
  { word: 'jurassic park', aliases: ['parque jurásico'] },
  { word: 'bob esponja', aliases: ['spongebob'] },
  { word: 'el rey león', aliases: ['rey leon', 'simba'] },
  { word: 'toy story', aliases: ['woody', 'buzz'] },
  { word: 'los simpson', aliases: ['simpson', 'homer'] },
  { word: 'stranger things', aliases: ['once'] },
  { word: 'breaking bad', aliases: ['walter white', 'heisenberg'] },
  { word: 'la sirenita', aliases: ['ariel'] },
  { word: 'peter pan', aliases: ['campanilla'] },
  { word: 'los vengadores', aliases: ['avengers'] },
  { word: 'iron man', aliases: ['hombre de hierro'] },
  { word: 'capitán américa', aliases: ['capitan america'] },
  { word: 'jack sparrow', aliases: ['piratas del caribe'] },
  { word: 'darth vader', aliases: ['vader'] },
  { word: 'indiana jones', aliases: ['indy'] },
  { word: 'los cazafantasmas', aliases: ['ghostbusters'] },
  { word: 'regreso al futuro', aliases: ['delorean', 'marty mcfly'] },
  { word: 'buscando a nemo', aliases: ['nemo'] },
  { word: 'los increíbles', aliases: ['incredibles'] },
  { word: 'monstruos s.a.', aliases: ['monsters inc', 'sulley'] }
];

const CINE_TV_NORMAL = [
  'futurama', 'madagascar', 'pocahontas', 'depredador', 'beetlejuice',
  'legolas', 'gandalf', 'gollum', 'frodo', 'voldemort', 'hermione', 'hagrid', 'chewbacca',
  'yoda', 'thanos', 'loki', 'magneto', 'pennywise', 'chucky', 'hannibal', 'morfeo', 'trinity',
  'scarface', 'dune', 'oppenheimer', 'amelie', 'casablanca', 'psicosis', 'memento',
  'saw', 'scream', 'venom', 'carnage', 'daredevil', 'shazam', 'neo', 'ratatouille',
  'merlín', 'scrat', 'gru', 'buzz', 'woody', 'spock', 'simba', 'tarzan',
  { word: 'el zorro héroe', aliases: ['zorro héroe', 'don diego de la vega'] },
  { word: 'wonder woman', aliases: ['mujer maravilla'] },
  { word: 'harley quinn', aliases: ['harley'] },
  { word: 'han solo', aliases: ['hansolo'] },
  { word: 'obi-wan kenobi', aliases: ['obi wan'] },
  { word: 'freddy krueger', aliases: ['freddy'] },
  { word: 'jason voorhees', aliases: ['jason'] },
  { word: 'michael myers', aliases: ['myers'] },
  { word: 'forrest gump', aliases: ['gump'] },
  { word: 'pulp fiction', aliases: ['tarantino'] },
  { word: 'el padrino', aliases: ['corleone'] },
  { word: 'la bella y la bestia', aliases: ['bella y bestia'] },
  { word: 'kung fu panda', aliases: ['po'] },
  { word: 'cómo entrenar a tu dragón', aliases: ['desdentao'] },
  { word: 'ice age', aliases: ['la edad de hielo', 'sid'] },
  { word: 'el señor de los anillos', aliases: ['lord of the rings'] },
  { word: 'pesadilla antes de navidad', aliases: ['jack skellington'] },
  { word: 'la familia addams', aliases: ['los addams', 'miércoles addams'] },
  { word: 'juego de tronos', aliases: ['game of thrones'] },
  { word: 'la casa de papel', aliases: ['money heist', 'el profesor'] },
  { word: 'el juego del calamar', aliases: ['squid game'] },
  { word: 'los juegos del hambre', aliases: ['katniss'] },
  { word: 'guardianes de la galaxia', aliases: ['groot', 'rocket'] },
  { word: 'men in black', aliases: ['hombres de negro'] },
  { word: 'misión imposible', aliases: ['ethan hunt'] },
  { word: 'james bond', aliases: ['007', 'agente 007'] }
];

const CINE_TV_DIFICIL = [
  'interstellar', 'inception', 'parasite', 'whiplash', 'birdman',
  'apocalypse', 'vertigo', 'metropolis', 'godfather', 'coraline',
  'wall-e', 'braveheart', 'gladiador', 'exorcista',
  { word: 'blade runner', aliases: ['deckard'] },
  { word: 'el show de truman', aliases: ['truman'] },
  { word: 'el gran lebowski', aliases: ['the dude'] },
  { word: 'el laberinto del fauno', aliases: ['fauno'] },
  { word: 'el viaje de chihiro', aliases: ['chihiro'] },
  { word: 'mi vecino totoro', aliases: ['totoro'] },
  { word: 'la princesa mononoke', aliases: ['mononoke'] },
  { word: 'el club de la lucha', aliases: ['fight club', 'tyler durden'] },
  { word: 'el silencio de los corderos', aliases: ['clarice'] },
  { word: 'cadena perpetua', aliases: ['shawshank'] },
  { word: 'salvar al soldado ryan', aliases: ['soldado ryan'] }
];

// 6. VIDEOJUEGOS (153 entries, ~65% single words)
const VIDEOJUEGOS_FACIL = [
  'minecraft', 'fortnite', 'roblox', 'tetris', 'pac-man', 'pokémon', 'fifa', 'sonic',
  'zelda', 'doom', 'portal', 'tekken', 'skyrim', 'terraria', 'overwatch', 'valorant',
  'pikachu', 'kirby', 'donkey kong', 'bowser', 'yoshi', 'luigi', 'wario', 'waluigi',
  'pikmin', 'rayman', 'spyro', 'fall guys', 'rocket league',
  'brawl stars', 'clash royale', 'kratos', 'steve', 'creeper', 'enderman',
  'sora', 'tifa', 'aerith', 'sephiroth', 'aloy', 'glados',
  { word: 'super mario', aliases: ['mario bros', 'mario'] },
  { word: 'mario kart', aliases: ['mariokart'] },
  { word: 'street fighter', aliases: ['ryu', 'ken'] },
  { word: 'angry birds', aliases: ['pajaros enfadados'] },
  { word: 'plants vs zombies', aliases: ['plantas contra zombies'] },
  { word: 'geometry dash', aliases: ['geometry'] },
  { word: 'flappy bird', aliases: ['flappy'] },
  { word: 'subway surfers', aliases: ['subway'] },
  { word: 'candy crush', aliases: ['candy crush saga'] },
  { word: 'fruit ninja', aliases: ['ninja fruit'] },
  { word: 'temple run', aliases: ['temple'] },
  { word: 'among us', aliases: ['impostor'] },
  { word: 'crash bandicoot', aliases: ['crash'] },
  { word: 'the sims', aliases: ['los sims'] }
];

const VIDEOJUEGOS_NORMAL = [
  'metroid', 'castlevania', 'megaman', 'cuphead', 'undertale', 'celeste',
  'hades', 'subnautica', 'bioshock', 'fallout', 'halo', 'uncharted', 'bloodborne',
  'sekiro', 'cyberpunk', 'splatoon', 'charizard', 'mewtwo', 'gengar', 'eevee',
  'chocobo', 'sans', 'papyrus', 'arthur', 'geralt', 'samus', 'link',
  'peach', 'toad', 'knuckles', 'tails', 'shadow', 'ryu', 'guile', 'chun-li',
  'subzero', 'scorpion', 'raiden', 'limbo', 'fez', 'journey', 'spore', 'dota',
  'alucard', 'wheatley', 'otacon', 'barret', 'cammy',
  { word: 'hollow knight', aliases: ['knight'] },
  { word: 'dead cells', aliases: ['cells'] },
  { word: 'stardew valley', aliases: ['granja stardew'] },
  { word: 'god of war', aliases: ['kratos juego'] },
  { word: 'tomb raider', aliases: ['lara croft'] },
  { word: 'elden ring', aliases: ['tierras intermedias'] },
  { word: 'dark souls', aliases: ['hoguera souls'] },
  { word: 'the witcher', aliases: ['brujo geralt'] },
  { word: 'league of legends', aliases: ['lol'] },
  { word: 'counter-strike', aliases: ['csgo', 'counter'] },
  { word: 'call of duty', aliases: ['cod', 'warzone'] },
  { word: 'apex legends', aliases: ['apex'] },
  { word: 'animal crossing', aliases: ['tom nook'] },
  { word: 'grand theft auto', aliases: ['gta'] },
  { word: 'red dead redemption', aliases: ['rdr2', 'red dead'] },
  { word: 'assassin\'s creed', aliases: ['assassins creed', 'ezio'] },
  { word: 'world of warcraft', aliases: ['wow'] },
  { word: 'team fortress', aliases: ['tf2'] },
  { word: 'super smash bros', aliases: ['smash bros', 'smash'] },
  { word: 'mario party', aliases: ['marioparty'] }
];

const VIDEOJUEGOS_DIFICIL = [
  'half-life', 'persona', 'chronotrigger', 'xenoblade', 'goldeneye', 'earthbound',
  'dishonored', 'control', 'bloodrayne', 'bayonetta', 'ico', 'okami', 'deusex',
  'gordon freeman', 'solid snake', 'simon belmont', 'bloque de tetris',
  { word: 'resident evil', aliases: ['biohazard', 'zombies resident'] },
  { word: 'silent hill', aliases: ['pirámide head'] },
  { word: 'final fantasy', aliases: ['cloud final'] },
  { word: 'monster hunter', aliases: ['cazador de monstruos'] },
  { word: 'metal gear solid', aliases: ['snake'] },
  { word: 'banjo-kazooie', aliases: ['banjo'] },
  { word: 'ratchet and clank', aliases: ['ratchet'] },
  { word: 'portal gun', aliases: ['pistola de portales'] },
  { word: 'espada maestra', aliases: ['master sword'] },
  { word: 'tri fuerza', aliases: ['trifuerza zelda'] },
  { word: 'luigi\'s mansion', aliases: ['aspiradora luigi'] },
  { word: 'espada de diamante', aliases: ['espada minecraft'] },
  { word: 'pico de diamante', aliases: ['pico minecraft'] }
];

// 7. DEPORTES (151 entries, ~77% single words)
const DEPORTES_FACIL = [
  'fútbol', 'baloncesto', 'tenis', 'golf', 'boxeo', 'natación', 'surf', 'esquí', 'ciclismo',
  'voleibol', 'rugby', 'béisbol', 'karate', 'judo', 'atletismo', 'patinaje', 'escalada',
  'pádel', 'ping-pong', 'snowboard', 'gimnasia', 'halterofilia', 'taekwondo', 'esgrima',
  'waterpolo', 'bádminton', 'balonmano', 'hockey', 'equitación', 'submarinismo', 'vela',
  'motociclismo', 'triatlón', 'maratón', 'skate', 'parkour', 'senderismo', 'billar', 'dardos',
  'bolos', 'remo', 'piragüismo', 'ajedrez', 'petanca', 'críquet', 'squash', 'bochas', 'piragua',
  'luge', 'skeleton', 'softbol', 'slalom', 'tiro con carabina', 'polo sobre hierba',
  'pesca deportiva', 'salto con cuerda', 'carrera de obstáculos', 'tiro olímpico',
  'halterofilia olímpica', 'fútbol burbuja',
  { word: 'fórmula 1', aliases: ['f1', 'carreras de coches'] },
  { word: 'tiro con arco', aliases: ['arco y flecha'] },
  { word: 'patinaje sobre hielo', aliases: ['patinaje artistico'] },
  { word: 'salto de longitud', aliases: ['salto'] },
  { word: 'salto de altura', aliases: ['salto alto'] },
  { word: 'lanzamiento de jabalina', aliases: ['jabalina'] },
  { word: 'salto con pértiga', aliases: ['pertiga'] },
  { word: 'lanzamiento de disco', aliases: ['disco atletismo'] },
  { word: 'carrera de relevos', aliases: ['relevos'] },
  { word: 'carrera de vallas', aliases: ['vallas'] }
];

const DEPORTES_NORMAL = [
  'rafting', 'windsurf', 'kitesurf', 'paracaidismo', 'parapente', 'motocross', 'bmx',
  'sumo', 'kickboxing', 'aikido', 'curling', 'biatlón', 'bodyboard', 'kayak', 'canoa',
  'tirolina', 'puenting', 'barranquismo', 'alpinismo', 'crossfit', 'calistenia',
  'pilates', 'yoga', 'aeróbic', 'zumba', 'spinning', 'frontón', 'polo', 'snooker',
  'croquet', 'karting', 'motonaútica', 'senderista', 'pesa', 'anillas',
  'tatami', 'florete', 'frontenis', 'badmington', 'jabalina', 'pértiga', 'decatlón',
  'pentatlón', 'remonte', 'salto base',
  { word: 'lucha libre', aliases: ['wrestling', 'catch'] },
  { word: 'hockey sobre hielo', aliases: ['hockey hielo'] },
  { word: 'paddle surf', aliases: ['sup'] },
  { word: 'salto de trampolín', aliases: ['trampolín'] },
  { word: 'natación sincronizada', aliases: ['sincronizada'] },
  { word: 'gimnasia rítmica', aliases: ['rítmica'] },
  { word: 'gimnasia artística', aliases: ['artística'] },
  { word: 'carrera de karts', aliases: ['karting'] },
  { word: 'carrera de sacos', aliases: ['sacos'] },
  { word: 'vóley playa', aliases: ['voleibol playa'] },
  { word: 'fútbol sala', aliases: ['futsal'] },
  { word: 'tiro al plato', aliases: ['plato'] },
  { word: 'lanzamiento de martillo', aliases: ['martillo atletismo'] },
  { word: 'carrera de caballos', aliases: ['hípica carrera'] },
  { word: 'fútbol americano', aliases: ['rugby americano'] },
  { word: 'polo acuático', aliases: ['waterpolo polo'] }
];

const DEPORTES_DIFICIL = [
  'lacrosse', 'kabaddi', 'capoeira', 'kendo', 'bobsleigh',
  'bareknuckle', 'jiujitsu', 'muaythai', 'kyudo', 'unihockey', 'rollerderby',
  'hurling', 'speedcubing', 'spearfishing', 'orienteering', 'pelota vasca',
  { word: 'esquí de fondo', aliases: ['fondo nórdico'] },
  { word: 'salto en paracaídas', aliases: ['salto tándem'] },
  { word: 'escalada en hielo', aliases: ['escalada glaciar'] },
  { word: 'tira y afloja', aliases: ['soga tira'] },
  { word: 'tiro con pistola', aliases: ['tiro de precisión'] },
  { word: 'salto ecuestre', aliases: ['salto de caballo'] },
  { word: 'doma clásica', aliases: ['doma de caballo'] },
  { word: 'lucha canaria', aliases: ['lucha tradicional'] }
];

// 8. PROFESIONES (151 entries, ~88% single words)
const PROFESIONES_FACIL = [
  'médico', 'bombero', 'policía', 'profesor', 'cocinero', 'piloto', 'astronauta', 'dentista',
  'veterinario', 'camarero', 'mecánico', 'carpintero', 'fontanero', 'electricista', 'fotógrafo',
  'actor', 'cantante', 'pintor', 'científico', 'detective', 'juez', 'socorrista', 'arquitecto',
  'enfermero', 'cirujano', 'farmacéutico', 'cartero', 'jardinero', 'panadero', 'carnicero',
  'pescador', 'agricultor', 'albañil', 'cerrajero', 'peluquero', 'marinero', 'militar',
  'espía', 'arqueólogo', 'buzo', 'minero', 'payaso', 'mago', 'bailarín', 'músico',
  'escritor', 'periodista', 'taxista', 'repartidor', 'árbitro', 'entrenador', 'cajero',
  'barbero', 'pescadero', 'frutero', 'pastor', 'leñador', 'sastre', 'zapatero',
  'locutor', 'presentador', 'estilista', 'masajista',
  { word: 'director de cine', aliases: ['cineasta'] },
  { word: 'conductor de autobús', aliases: ['chófer'] },
  { word: 'azafata de vuelo', aliases: ['tripulante de cabina', 'azafata'] },
  { word: 'guía turístico', aliases: ['guía'] },
  { word: 'limpiador de cristales', aliases: ['limpiacristales'] }
];

const PROFESIONES_NORMAL = [
  'abogado', 'fiscal', 'notario', 'economista', 'contable', 'banquero',
  'escultor', 'grabador', 'ilustrador', 'programador', 'ingeniero', 'geólogo',
  'biólogo', 'químico', 'físico', 'astrónomo', 'meteorólogo', 'historiador',
  'filósofo', 'psicólogo', 'psiquiatra', 'fisioterapeuta', 'podólogo', 'óptico',
  'anestesista', 'pediatra', 'cardiólogo', 'dermatólogo', 'traumatólogo', 'radiólogo',
  'apicultor', 'viticultor', 'estibador', 'tornero', 'relojero', 'joyero', 'modista',
  'tapicero', 'ebanista', 'vidriero', 'cantero', 'deshollinador', 'guardabosques',
  'sommelier', 'barista', 'titiritero', 'acróbata', 'trapecista', 'funambulista',
  'ventrílocuo', 'luthier', 'archivista', 'gemólogo', 'perfumista', 'manicurista',
  { word: 'diseñador gráfico', aliases: ['diseñador'] },
  { word: 'guarda forestal', aliases: ['guardabosques'] },
  { word: 'capitán de barco', aliases: ['capitán'] },
  { word: 'guardia de seguridad', aliases: ['vigilante de seguridad', 'segurata'] },
  { word: 'director de orquesta', aliases: ['maestro'] },
  { word: 'entrenador personal', aliases: ['personal trainer'] }
];

const PROFESIONES_DIFICIL = [
  'paleontólogo', 'egiptólogo', 'antropólogo', 'taxidermista', 'enólogo',
  'contorsionista', 'numismático', 'filatelista', 'paleógrafo', 'oceanógrafo',
  'vulcanólogo', 'sismólogo', 'entomólogo', 'herpetólogo', 'ornitólogo',
  'técnico de sonido', 'actor de doblaje',
  { word: 'maquillador de cine', aliases: ['maquillador'] },
  { word: 'afinador de pianos', aliases: ['afinador'] },
  { word: 'restaurador de arte', aliases: ['restaurador'] },
  { word: 'probador de videojuegos', aliases: ['tester'] },
  { word: 'doble de acción', aliases: ['especialista'] }
];

// 9. NATURALEZA (153 entries, ~86% single words)
const NATURALEZA_FACIL = [
  'sol', 'luna', 'estrella', 'nube', 'lluvia', 'nieve', 'rayo', 'arcoíris', 'volcán', 'cascada',
  'iceberg', 'tornado', 'ola', 'palmera', 'árbol', 'flor', 'rosa', 'girasol', 'margarita',
  'cactus', 'seta', 'hoja', 'césped', 'pradera', 'lago', 'río', 'mar', 'océano', 'selva',
  'glaciar', 'acantilado', 'duna', 'niebla', 'granizo', 'tormenta', 'relámpago', 'meteorito',
  'cráter', 'roca', 'arena', 'tierra', 'barro', 'viento', 'hielo', 'estalactita', 'estalagmita',
  'trueno', 'brisa', 'lava', 'ceniza', 'espuma', 'rama', 'tronco', 'raíz', 'semilla',
  'madroño', 'colmena', 'enjambre', 'telaraña', 'madriguera', 'arboleda',
  { word: 'flor de loto', aliases: ['loto'] },
  { word: 'planta carnívora', aliases: ['venus atrapamoscas'] },
  { word: 'puesta de sol', aliases: ['atardecer', 'ocaso'] },
  { word: 'salida del sol', aliases: ['amanecer', 'alba'] },
  { word: 'luna llena', aliases: ['plenilunio'] },
  { word: 'estrella fugaz', aliases: ['meteoro'] },
  { word: 'árbol de navidad', aliases: ['abeto'] }
];

const NATURALEZA_NORMAL = [
  'huracán', 'tifón', 'ciclón', 'tsunami', 'maremoto', 'avalancha', 'terremoto',
  'fumarola', 'géiser', 'manantial', 'arroyo', 'riachuelo', 'catarata',
  'humedal', 'marisma', 'manglar', 'turbera', 'sabana', 'estepa', 'tundra', 'taiga',
  'desfiladero', 'meseta', 'fiordo', 'atolón', 'arrecife', 'secuoya', 'baobab',
  'eucalipto', 'roble', 'encina', 'pino', 'olivo', 'higuera', 'haya', 'abedul',
  'orquídea', 'tulipán', 'clavel', 'jazmín', 'lavanda', 'romero', 'tomillo', 'hiedra',
  'musgo', 'liquen', 'helecho', 'nenúfar', 'alga', 'rocío', 'escarcha',
  'termitero',
  { word: 'aurora boreal', aliases: ['luces del norte'] },
  { word: 'eclipse solar', aliases: ['eclipse de sol'] },
  { word: 'eclipse lunar', aliases: ['eclipse de luna'] },
  { word: 'lluvia de estrellas', aliases: ['perseidas'] },
  { word: 'sauce llorón', aliases: ['sauce'] },
  { word: 'bosque de bambú', aliases: ['bambú'] },
  { word: 'nido de pájaro', aliases: ['nido'] },
  { word: 'banco de arena', aliases: ['bajío'] },
  { word: 'oasis verde', aliases: ['oasis'] }
];

const NATURALEZA_DIFICIL = [
  'alud', 'fosa', 'morrena', 'serac', 'cresta', 'cúmulo', 'cirro', 'estrato',
  'tolvanera', 'centella', 'germen', 'polen', 'néctar', 'espora',
  { word: 'remolino de viento', aliases: ['remolino'] },
  { word: 'tromba marina', aliases: ['manga de agua'] },
  { word: 'árbol petrificado', aliases: ['madera fósil'] },
  { word: 'fuego fatuo', aliases: ['llama fatua'] },
  { word: 'capullo de seda', aliases: ['crisálida'] },
  { word: 'banco de peces', aliases: ['cardumen'] },
  { word: 'cumbre nevada', aliases: ['pico nevado'] }
];

// 10. ACCIONES (152 entries, ~68% single words)
const ACCIONES_FACIL = [
  'saltar', 'correr', 'dormir', 'bailar', 'cocinar', 'nadar', 'volar', 'llorar', 'reír',
  'estornudar', 'bostezar', 'aplaudir', 'pescar', 'escalar', 'cantar', 'escribir',
  'dibujar', 'pintar', 'leer', 'comer', 'beber', 'gritar', 'susurrar', 'silbar',
  'pensar', 'soñar', 'despertar', 'caer', 'tropezar', 'empujar', 'tirar', 'golpear', 'abrazar',
  'besar', 'saludar', 'despedirse', 'guiñar', 'sonreír', 'conducir', 'frenar', 'acelerar',
  'girar', 'bucear', 'navegar', 'remar', 'barrer', 'fregar', 'planchar', 'coser',
  'celebrar', 'encestar', 'chutar', 'bloquear',
  { word: 'hacer surf', aliases: ['surfear'] },
  { word: 'inflar un globo', aliases: ['hinchar un globo'] },
  { word: 'abrir un regalo', aliases: ['desenvolver un regalo'] },
  { word: 'tocar la guitarra', aliases: ['tocar guitarra'] },
  { word: 'lavarse los dientes', aliases: ['cepillarse los dientes'] },
  { word: 'hacer una foto', aliases: ['tomar una foto', 'fotografiar'] },
  { word: 'comer pizza', aliases: ['zampar pizza'] },
  { word: 'beber agua', aliases: ['tomar agua'] },
  { word: 'leer un libro', aliases: ['hojear un libro'] },
  { word: 'escribir una carta', aliases: ['redactar una carta'] },
  { word: 'pintar un cuadro', aliases: ['hacer un dibujo'] },
  { word: 'cantar una canción', aliases: ['entonar'] },
  { word: 'montar en bici', aliases: ['pedalear'] },
  { word: 'pasear al perro', aliases: ['sacar al perro'] }
];

const ACCIONES_NORMAL = [
  'limpiar', 'aspirar', 'tejer', 'regar', 'podar', 'plantar', 'cosechar', 'amasar',
  'hornear', 'freír', 'hervir', 'batir', 'cortar', 'pelar', 'rallar', 'exprimir',
  'chiflar', 'trotar', 'esquiar', 'surfear', 'trepar', 'gatear', 'arrastrarse',
  'cabalgar', 'chocar', 'regatear', 'rematar',
  'desayunar', 'almorzar', 'merendar', 'cenar', 'brindar', 'saborear', 'masticar',
  'voltereta', 'burlar', 'esquivar', 'atrapar', 'cazar',
  { word: 'patinar sobre hielo', aliases: ['patinaje hielo'] },
  { word: 'hacer la cama', aliases: ['tender cama'] },
  { word: 'abrir la puerta', aliases: ['abrir puerta'] },
  { word: 'cerrar con llave', aliases: ['echar la llave'] },
  { word: 'mirar por la ventana', aliases: ['asomarse'] },
  { word: 'mirar las estrellas', aliases: ['observar el cielo'] },
  { word: 'soplar las velas', aliases: ['apagar las velas'] },
  { word: 'pedir un deseo', aliases: ['desear algo'] },
  { word: 'buscar un tesoro', aliases: ['encontrar un tesoro'] },
  { word: 'tocar el piano', aliases: ['tocar teclado'] },
  { word: 'tocar la batería', aliases: ['tocar tambores'] },
  { word: 'hacer malabares', aliases: ['malabares'] },
  { word: 'hacer un truco', aliases: ['hacer magia'] },
  { word: 'cruzar la calle', aliases: ['cruzar el paso'] },
  { word: 'tirar una bola de nieve', aliases: ['guerra de nieve'] },
  { word: 'hacer castillos de arena', aliases: ['castillo de arena'] },
  { word: 'tomar el sol', aliases: ['broncearse'] },
  { word: 'hacer pompas de jabón', aliases: ['pompas de jabón'] },
  { word: 'saltar a la comba', aliases: ['comba'] },
  { word: 'clavar un clavo', aliases: ['martillear un clavo'] },
  { word: 'apagar la luz', aliases: ['apagar lampara'] },
  { word: 'encender el fuego', aliases: ['prender fuego'] },
  { word: 'dibujar un corazón', aliases: ['dibujar corazon'] }
];

const ACCIONES_DIFICIL = [
  'teletransportarse', 'levitar', 'desaparecer', 'hipnotizar', 'resbalar',
  'volar en cohete', 'dar una voltereta',
  { word: 'tirarse en paracaídas', aliases: ['paracaidismo salto'] },
  { word: 'montar en globo', aliases: ['globo aerostático'] },
  { word: 'caminar por la luna', aliases: ['paseo lunar'] },
  { word: 'explorar una cueva', aliases: ['espeleología acción'] },
  { word: 'abrir una caja fuerte', aliases: ['forzar caja'] },
  { word: 'espiar con prismáticos', aliases: ['vigilar'] },
  { word: 'tropezar con una piedra', aliases: ['tropezar'] },
  { word: 'quedarse sin batería', aliases: ['sin bateria'] },
  { word: 'perder las llaves', aliases: ['extraviar llaves'] },
  { word: 'buscar cobertura móvil', aliases: ['buscar señal'] },
  { word: 'caminar dormido', aliases: ['sonambulismo'] },
  { word: 'tocar la flauta', aliases: ['tocar flauta'] },
  { word: 'bailar tango', aliases: ['bailar baile'] },
  { word: 'escribir en el teclado', aliases: ['teclear'] },
  { word: 'saltar en la cama', aliases: ['brincar en la cama'] }
];

const allCategories = {
  animales: { name: 'Animales', facil: ANIMALES_FACIL, normal: ANIMALES_NORMAL, dificil: ANIMALES_DIFICIL },
  comida: { name: 'Comida', facil: COMIDA_FACIL, normal: COMIDA_NORMAL, dificil: COMIDA_DIFICIL },
  objetos: { name: 'Objetos', facil: OBJETOS_FACIL, normal: OBJETOS_NORMAL, dificil: OBJETOS_DIFICIL },
  lugares: { name: 'Lugares', facil: LUGARES_FACIL, normal: LUGARES_NORMAL, dificil: LUGARES_DIFICIL },
  cine_tv: { name: 'Cine y TV', facil: CINE_TV_FACIL, normal: CINE_TV_NORMAL, dificil: CINE_TV_DIFICIL },
  videojuegos: { name: 'Videojuegos', facil: VIDEOJUEGOS_FACIL, normal: VIDEOJUEGOS_NORMAL, dificil: VIDEOJUEGOS_DIFICIL },
  deportes: { name: 'Deportes', facil: DEPORTES_FACIL, normal: DEPORTES_NORMAL, dificil: DEPORTES_DIFICIL },
  profesiones: { name: 'Profesiones', facil: PROFESIONES_FACIL, normal: PROFESIONES_NORMAL, dificil: PROFESIONES_DIFICIL },
  naturaleza: { name: 'Naturaleza', facil: NATURALEZA_FACIL, normal: NATURALEZA_NORMAL, dificil: NATURALEZA_DIFICIL },
  acciones: { name: 'Acciones', facil: ACCIONES_FACIL, normal: ACCIONES_NORMAL, dificil: ACCIONES_DIFICIL },
};

console.log("=== Category stats ===");
let total = 0;
let totalSingle = 0;
let totalMulti = 0;
const seen = new Map();
const duplicates = [];

for (const [cat, diffs] of Object.entries(allCategories)) {
  const wordsInCat = [...diffs.facil, ...diffs.normal, ...diffs.dificil];
  let catSingle = 0;
  for (const item of wordsInCat) {
    const rawWord = typeof item === 'string' ? item : item.word;
    const cleanWord = rawWord.trim().toLowerCase();
    if (seen.has(cleanWord)) {
      duplicates.push({ word: rawWord, cat1: seen.get(cleanWord), cat2: cat });
    } else {
      seen.set(cleanWord, cat);
    }
    const isSingle = !rawWord.includes(' ');
    if (isSingle) {
      catSingle++;
      totalSingle++;
    } else {
      totalMulti++;
    }
  }
  total += wordsInCat.length;
  console.log(`${cat}: ${wordsInCat.length} words (${Math.round((catSingle / wordsInCat.length) * 100)}% single words)`);
}

console.log("-----------------------");
console.log(`TOTAL: ${total} entries`);
console.log(`Single words: ${totalSingle} (${Math.round((totalSingle / total) * 100)}%)`);
console.log(`Multi words: ${totalMulti} (${Math.round((totalMulti / total) * 100)}%)`);
console.log(`Duplicates: ${duplicates.length}`, duplicates);

// Generate final TypeScript file
let tsContent = `import { PinturilloCategory } from '../types/pinturillo';

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
          id: \`\${cat}_\${idx++}\`,
          word: item.trim(),
          category: cat,
          difficulty: diff,
        });
      } else {
        list.push({
          id: \`\${cat}_\${idx++}\`,
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
`;

for (const [catKey, catData] of Object.entries(allCategories)) {
  const upper = catKey.toUpperCase();
  tsContent += `\n// ============================================================================\n`;
  tsContent += `// ${catData.name.toUpperCase()} (${catData.facil.length + catData.normal.length + catData.dificil.length} palabras)\n`;
  tsContent += `// ============================================================================\n`;

  tsContent += `const ${upper}_FACIL: WordEntry[] = ${JSON.stringify(catData.facil, null, 2)};\n\n`;
  tsContent += `const ${upper}_NORMAL: WordEntry[] = ${JSON.stringify(catData.normal, null, 2)};\n\n`;
  tsContent += `const ${upper}_DIFICIL: WordEntry[] = ${JSON.stringify(catData.dificil, null, 2)};\n\n`;
}

tsContent += `\n// ============================================================================\n`;
tsContent += `// BANCO COMPLETO DE PALABRAS DE PINTURILLO\n`;
tsContent += `// ============================================================================\n`;
tsContent += `export const PINTURILLO_WORDS: DrawableWord[] = [\n`;
for (const catKey of Object.keys(allCategories)) {
  const upper = catKey.toUpperCase();
  tsContent += `  ...buildCategoryWords('${catKey}', ${upper}_FACIL, ${upper}_NORMAL, ${upper}_DIFICIL),\n`;
}
tsContent += `];\n\n`;

tsContent += `/**
 * Obtiene opciones de palabras aleatorias con dificultad y categoría balanceadas,
 * evitando repetir palabras usadas recientemente o ya ofrecidas en rondas recientes.
 */
export function getRandomWordOptions(
  enabledCategories?: PinturilloCategory[],
  usedWords = new Set<string>(),
  count = 3,
  recentlyOfferedWords = new Set<string>()
): DrawableWord[] {
  const categoriesPool: PinturilloCategory[] =
    enabledCategories && enabledCategories.length > 0
      ? enabledCategories
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

  // Filtrar palabras disponibles por categorías activas, excluyendo palabras usadas y ofrecidas recientemente
  const categoryWords = PINTURILLO_WORDS.filter((w) => categoriesPool.includes(w.category));
  
  let available = categoryWords.filter((w) => {
    const lower = w.word.toLowerCase();
    return !usedWords.has(lower) && !recentlyOfferedWords.has(lower);
  });

  // Si nos quedamos con pocas opciones, relajamos la exclusión de palabras recientemente ofrecidas
  if (available.length < count) {
    available = categoryWords.filter((w) => !usedWords.has(w.word.toLowerCase()));
  }

  // Si aun así se agotaron las palabras no usadas, usamos el pool completo de la categoría
  const pool =
    available.length >= count
      ? available
      : categoryWords.length >= count
      ? categoryWords
      : PINTURILLO_WORDS;

  // Agrupar por categoría para maximizar variedad semántica
  const byCat: Partial<Record<PinturilloCategory, DrawableWord[]>> = {};
  for (const w of pool) {
    if (!byCat[w.category]) byCat[w.category] = [];
    byCat[w.category]!.push(w);
  }

  // Barajar las categorías disponibles para evitar orden predecible
  const shuffledCats = [...categoriesPool].sort(() => Math.random() - 0.5);

  const selected: DrawableWord[] = [];
  const chosenWordsSet = new Set<string>();

  // Intentar escoger una palabra de cada categoría distinta primero
  for (const cat of shuffledCats) {
    if (selected.length >= count) break;
    const catWords = (byCat[cat] || []).filter((w) => !chosenWordsSet.has(w.word.toLowerCase()));
    if (catWords.length > 0) {
      // Distribución balanceada: 40% facil, 45% normal, 15% dificil
      const r = Math.random();
      const targetDiff = r < 0.4 ? 'FACIL' : r < 0.85 ? 'NORMAL' : 'DIFICIL';
      const matchingDiff = catWords.filter((w) => w.difficulty === targetDiff);
      const chosen =
        matchingDiff.length > 0
          ? matchingDiff[Math.floor(Math.random() * matchingDiff.length)]
          : catWords[Math.floor(Math.random() * catWords.length)];

      selected.push(chosen);
      chosenWordsSet.add(chosen.word.toLowerCase());
    }
  }

  // Rellenar si faltan opciones asegurando unicidad
  while (selected.length < count) {
    const remaining = pool.filter((w) => !chosenWordsSet.has(w.word.toLowerCase()));
    if (remaining.length === 0) break;
    const fallback = remaining[Math.floor(Math.random() * remaining.length)];
    selected.push(fallback);
    chosenWordsSet.add(fallback.word.toLowerCase());
  }

  return selected.slice(0, count);
}
`;

fs.writeFileSync(path.join(__dirname, '../src/data/pinturilloWords.ts'), tsContent, 'utf-8');
console.log("Successfully wrote /src/data/pinturilloWords.ts!");
