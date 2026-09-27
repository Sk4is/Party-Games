export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  words: string[];
}

export const ENTRE_TOPOS_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'animales',
    name: 'Animales',
    icon: '🐾',
    description: 'Fauna salvaje, doméstica y marina de todo el planeta.',
    words: [
      'Perro', 'Gato', 'Delfín', 'León', 'Águila', 'Elefante', 'Oso panda', 'Pulpo',
      'Canguro', 'Jirafa', 'Murciélago', 'Caballo', 'Tiburón', 'Lobo', 'Flamenco',
      'Pingüino', 'Rinoceronte', 'Búho', 'Tigre', 'Camaleón', 'Zorro', 'Erizo',
      'Koala', 'Guepardo', 'Foca', 'Cebra', 'Tortuga', 'Castor', 'Lémur', 'Nutria'
    ],
  },
  {
    id: 'comida',
    name: 'Comida y Gastronomía',
    icon: '🥘',
    description: 'Platos típicos, tapas, dulces y recetas tradicionales.',
    words: [
      'Tortilla de patatas', 'Paella', 'Croquetas', 'Jamón ibérico', 'Gazpacho',
      'Churros con chocolate', 'Pizza', 'Sushi', 'Fabada asturiana', 'Pulpo a la gallega',
      'Empanada', 'Tacos', 'Lentejas con chorizo', 'Salmorejo', 'Pa amb tomàquet',
      'Ensaladilla rusa', 'Torrijas', 'Patatas bravas', 'Hamburguesa', 'Calamares a la romana',
      'Arroz con leche', 'Chistorra', 'Crema catalana', 'Callos a la madrileña',
      'Gildas', 'Flan de huevo', 'Roscón de Reyes', 'Canelones', 'Pisto manchego', 'Pimientos de Padrón'
    ],
  },
  {
    id: 'peliculas-series',
    name: 'Películas y Series',
    icon: '🎬',
    description: 'Clásicos del cine, éxitos de taquilla y series legendarias.',
    words: [
      'Titanic', 'Star Wars', 'El Señor de los Anillos', 'Harry Potter', 'Los Simpson',
      'Juego de Tronos', 'Matrix', 'Jurassic Park', 'Regreso al Futuro', 'La Casa de Papel',
      'Stranger Things', 'Shrek', 'El Rey León', 'Gladiator', 'Spider-Man',
      'Indiana Jones', 'Breaking Bad', 'Pulp Fiction', 'Avatar', 'Toy Story',
      'Piratas del Caribe', 'Los Vengadores', 'Friends', 'El Padrino', 'Pesadilla antes de Navidad',
      'Cazafantasmas', 'El Silencio de los Corderos', 'Forrest Gump', 'Rocky', 'Coco'
    ],
  },
  {
    id: 'lugares-ciudades',
    name: 'Lugares y Ciudades',
    icon: '🌍',
    description: 'Grandes capitales, monumentos y destinos inolvidables.',
    words: [
      'Madrid', 'Barcelona', 'París', 'Roma', 'Nueva York',
      'Tokio', 'Londres', 'Sevilla', 'Venecia', 'El Cairo',
      'Granada', 'Berlín', 'Pirámides de Guiza', 'Benidorm', 'Machu Picchu',
      'Sídney', 'Ámsterdam', 'Santiago de Compostela', 'Atenas', 'Islas Canarias',
      'Torre Eiffel', 'Coliseo de Roma', 'Río de Janeiro', 'San Francisco', 'Praga',
      'La Alhambra', 'Ibiza', 'Estambul', 'Polo Norte', 'Las Vegas'
    ],
  },
  {
    id: 'objetos-cotidianos',
    name: 'Objetos Cotidianos',
    icon: '🔑',
    description: 'Cosas que usamos, llevamos o vemos todos los días.',
    words: [
      'Llaves', 'Paraguas', 'Teléfono móvil', 'Cartera', 'Gafas de sol',
      'Taza de café', 'Reloj de pulsera', 'Zapatillas', 'Auriculares', 'Mochila',
      'Mando a distancia', 'Cuaderno', 'Mechero', 'Botella de agua', 'Cargador',
      'Tijeras', 'Cepillo de dientes', 'Cojín', 'Espejo', 'Monedero',
      'Bolígrafo', 'Gorra', 'Pañuelos de papel', 'Grapadora', 'Peine',
      'Linterna', 'Candado', 'Cuchara', 'Pinzas de ropa', 'Destornillador'
    ],
  },
  {
    id: 'profesiones',
    name: 'Profesiones y Oficios',
    icon: '👷',
    description: 'Trabajos de siempre, vocaciones y profesiones modernas.',
    words: [
      'Bombero', 'Médico', 'Policía', 'Maestro', 'Astronauta',
      'Cocinero', 'Detective privado', 'Piloto de avión', 'Fontanero', 'Juez',
      'Pintor artístico', 'Veterinario', 'Arquitecto', 'Periodista', 'Electricista',
      'Actor de teatro', 'Barrendero', 'Carpintero', 'Cirujano', 'Conductor de autobús',
      'Buzo profesional', 'Arqueólogo', 'Fotógrafo', 'Mecánico', 'Dentista',
      'Jardinero', 'Cartero', 'Enfermero', 'Locutor de radio', 'Camarero'
    ],
  },
  {
    id: 'deportes-juegos',
    name: 'Deportes y Juegos',
    icon: '⚽',
    description: 'Competición, aficiones deportivas y juegos de mesa.',
    words: [
      'Fútbol', 'Baloncesto', 'Tenis', 'Ciclismo', 'Natación',
      'Boxeo', 'Atletismo', 'Fórmula 1', 'Pádel', 'Voleibol',
      'Ajedrez', 'Golf', 'Escalada', 'Esquí de nieve', 'Surf',
      'Dardos', 'Bádminton', 'Rugby', 'Billar', 'Bolos',
      'Patinaje sobre hielo', 'Karate', 'Tenis de mesa', 'Piragüismo', 'Dominó',
      'Paracaidismo', 'Gimnasia rítmica', 'Waterpolo', 'Balonmano', 'Tiro con arco'
    ],
  },
  {
    id: 'videojuegos',
    name: 'Videojuegos',
    icon: '🎮',
    description: 'Franquicias históricas, consolas y fenómenos globales.',
    words: [
      'Super Mario', 'Pokémon', 'Minecraft', 'The Legend of Zelda', 'Fortnite',
      'Tetris', 'Grand Theft Auto', 'FIFA', 'Sonic the Hedgehog', 'Among Us',
      'Pac-Man', 'League of Legends', 'Call of Duty', 'Crash Bandicoot', 'Final Fantasy',
      'Elden Ring', 'Street Fighter', 'Red Dead Redemption', 'Donkey Kong', 'Resident Evil',
      'God of War', 'Animal Crossing', 'The Sims', 'Counter-Strike', 'Mortal Kombat',
      'Metal Gear Solid', 'Halo', 'Dark Souls', 'Tomb Raider', 'World of Warcraft'
    ],
  },
  {
    id: 'musica-instrumentos',
    name: 'Música e Instrumentos',
    icon: '🎸',
    description: 'Sonidos, instrumentos orquestales y géneros musicales.',
    words: [
      'Guitarra española', 'Piano de cola', 'Batería acústica', 'Violín', 'Trompeta',
      'Saxofón', 'Micrófono', 'Bajo eléctrico', 'Acordeón', 'Flauta travesera',
      'Arpa', 'Concierto en vivo', 'Altavoz bluetooth', 'Disco de vinilo', 'Ópera',
      'Rock and roll', 'Flamenco', 'Reguetón', 'Coro de voces', 'Platillos',
      'Ukelele', 'Trombón', 'Violonchelo', 'Clarinete', 'Gaita gallega',
      'Castañuelas', 'Órgano de iglesia', 'Triángulo', 'Xilófono', 'DJ Mixer'
    ],
  },
  {
    id: 'tecnologia-internet',
    name: 'Tecnología e Internet',
    icon: '💻',
    description: 'Gadgets, innovaciones digitales y el mundo conectado.',
    words: [
      'Inteligencia Artificial', 'Red Wi-Fi', 'Satélite espacial', 'Ordenador portátil', 'Código QR',
      'Robot humanoide', 'Impresora 3D', 'Dron con cámara', 'Redes sociales', 'Microchip',
      'Algoritmo', 'Gafas de Realidad Virtual', 'Batería externa', 'Bluetooth', 'Antena 5G',
      'Hacker', 'Disco duro sólido', 'Reloj inteligente', 'Ratón inalámbrico', 'Servidor en la nube',
      'Cámara web', 'Criptomoneda', 'Pantalla táctil', 'Fibra óptica', 'Memoria USB',
      'Panel solar', 'Router', 'Asistente de voz', 'Smartphone', 'Lector de huellas'
    ],
  },
  {
    id: 'naturaleza-geografia',
    name: 'Naturaleza y Fenómenos',
    icon: '🌋',
    description: 'Paisajes espectaculares, clima y fuerzas de la Tierra.',
    words: [
      'Volcán en erupción', 'Cascada gigante', 'Selva tropical', 'Desierto de arena', 'Glaciar de hielo',
      'Río caudaloso', 'Bosque de pinos', 'Cueva subterránea', 'Playa virgen', 'Acantilado',
      'Montaña nevada', 'Valle verde', 'Oasis en el desierto', 'Arrecife de coral', 'Cañón rocoso',
      'Niebla densa', 'Arcoíris', 'Aurora boreal', 'Terremoto', 'Tsunami',
      'Tornado', 'Tormenta eléctrica', 'Rayo', 'Océano profundo', 'Isla desierta',
      'Pantano', 'Géiser', 'Cordillera', 'Estrella fugaz', 'Duna de arena'
    ],
  },
  {
    id: 'transporte',
    name: 'Medios de Transporte',
    icon: '🚀',
    description: 'Vehículos terrestres, aéreos, marítimos y futuristas.',
    words: [
      'Tren de alta velocidad', 'Avión comercial', 'Metro subterráneo', 'Bicicleta de montaña', 'Helicóptero',
      'Barco velero', 'Submarino militar', 'Autobús urbano', 'Tranvía eléctrico', 'Patinete eléctrico',
      'Cohete espacial', 'Taxi', 'Globo aerostático', 'Camión de bomberos', 'Moto scooter',
      'Teleférico', 'Yate de lujo', 'Furgoneta camper', 'Barco pirata', 'Tractor agrícola',
      'Ambulancia', 'Canoa de madera', 'Moto de agua', 'Trineo de nieve', 'Carroza de caballos',
      'Góndola veneciana', 'Sidecar', 'Caravana', 'Ferry', 'Quad todoterreno'
    ],
  },
  {
    id: 'personajes-ficcion',
    name: 'Personajes y Ficción',
    icon: '🧙‍♂️',
    description: 'Héroes, villanos, leyendas y figuras de cuento.',
    words: [
      'Sherlock Holmes', 'Don Quijote de la Mancha', 'Batman', 'Conde Drácula', 'Papá Noel',
      'Cenicienta', 'Robin Hood', 'Frankenstein', 'Tarzán', 'Superman',
      'Peter Pan', 'El Joker', 'Caperucita Roja', 'El Zorro', 'Darth Vader',
      'Pinocho', 'Medusa', 'Sirena marina', 'Hombre Lobo', 'Gandalf el Gris',
      'Aladín', 'Capitán Garfio', 'Hércules', 'Rey Arturo', 'El flautista de Hamelín',
      'Robin', 'Bruja del oeste', 'Minotauro', 'Pegaso', 'Genio de la lámpara'
    ],
  },
  {
    id: 'cosas-casa',
    name: 'Cosas de Casa',
    icon: '🏠',
    description: 'Muebles, electrodomésticos y rincones del hogar.',
    words: [
      'Sofá del salón', 'Nevera congelador', 'Microondas', 'Lavadora', 'Lámpara de noche',
      'Tostadora de pan', 'Sartén antiadherente', 'Alfombra persa', 'Televisión plana', 'Plato de ducha',
      'Mesa de comedor', 'Armario ropero', 'Batidora de vaso', 'Espejo del baño', 'Plancha de ropa',
      'Estantería de libros', 'Radiador de calefacción', 'Almohada viscoelástica', 'Abrelatas manual', 'Tendedero plegable',
      'Cafetera italiana', 'Fregadero', 'Campana extractora', 'Mesilla de noche', 'Escoba y recogedor',
      'Ventilador de techo', 'Jarrón de flores', 'Cubo de basura', 'Cortina de ventana', 'Bidé'
    ],
  },
  {
    id: 'ocio-fiestas',
    name: 'Ocio y Celebraciones',
    icon: '🎉',
    description: 'Momentos divertidos, fiestas populares y tradiciones.',
    words: [
      'Nochevieja y las 12 uvas', 'Carnaval de disfraces', 'Feria de Abril', 'Cumpleaños sorpresa', 'Festival de música',
      'Fiesta de disfraces', 'Parque de atracciones', 'Cine de verano', 'Noche de San Juan', 'Escape room misterioso',
      'Concierto en directo', 'Barbacoa de domingo', 'Sesión de karaoke', 'Campamento de verano', 'Picnic en el césped',
      'Fuegos artificiales', 'Terraza al sol', 'Partida de cartas', 'Cabalgata de Reyes Magos', 'Baile de graduación',
      'Boda y banquete', 'Chiringuito de playa', 'Tarde de bolos', 'Oktoberfest', 'Bingo popular',
      'Espectáculo de magia', 'Patinaje en la plaza', 'Parque acuático', 'Mercadillo navideño', 'Cata de vinos'
    ],
  },
  {
    id: 'ropa-moda',
    name: 'Ropa y Moda',
    icon: '👔',
    description: 'Prendas de vestir, calzado y accesorios de estilo.',
    words: [
      'Pantalón vaquero', 'Gabardina clásica', 'Zapatos de tacón', 'Chaqueta de cuero', 'Camisa de cuadros',
      'Bufanda de lana', 'Boina estilosa', 'Guantes de invierno', 'Bañador de playa', 'Pijama de franela',
      'Corbata de seda', 'Vestido de gala', 'Chaleco acolchado', 'Gorra con visera', 'Sudadera con capucha',
      'Botas de montaña', 'Cinturón de cuero', 'Sandalias de verano', 'Calcetines estampados', 'Albornoz de baño',
      'Pajarita elegante', 'Chándal deportivo', 'Abrigo de plumas', 'Zapatillas deportivas', 'Tirantes elásticos',
      'Bata de estar por casa', 'Impermeable amarillo', 'Gorro de lana', 'Mocasines', 'Bikini'
    ],
  },
];

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface GeneratedBoardInternal {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  words: string[]; // Exactly 16 unique words
  secretWord: string; // The selected secret word
  secretWordIndex: number; // 0 to 15
}

/**
 * Procedurally selects a category, 16 distinct words, and 1 secret word.
 */
export function generateEntreToposBoard(requestedCategoryId?: string): GeneratedBoardInternal {
  let category: CategoryDefinition | undefined;

  if (requestedCategoryId) {
    category = ENTRE_TOPOS_CATEGORIES.find((c) => c.id === requestedCategoryId);
  }

  if (!category) {
    category = ENTRE_TOPOS_CATEGORIES[Math.floor(Math.random() * ENTRE_TOPOS_CATEGORIES.length)];
  }

  // Shuffle all words from this category and pick the first 16
  const shuffledCategoryWords = shuffleArray(category.words);
  const selected16Words = shuffledCategoryWords.slice(0, 16);

  // Pick exactly 1 secret word from the 16
  const secretWordIndex = Math.floor(Math.random() * 16);
  const secretWord = selected16Words[secretWordIndex];

  return {
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.icon,
    words: selected16Words,
    secretWord,
    secretWordIndex,
  };
}
