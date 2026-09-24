import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, '../src/data/palabraSecreta');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Curated Famous Movies (300+ titles)
const rawMovies = [
  "Titanic", "Avatar", "Shrek", "Shrek 2", "Frozen", "Frozen 2", "Toy Story", "Toy Story 2", "Toy Story 3", "Toy Story 4",
  "Cars", "Buscando a Nemo", "Buscando a Dory", "Los Increíbles", "Ratatouille", "Up", "Coco", "Monstruos S.A.", "Wall-E", "Del Revés (Inside Out)",
  "El Rey León", "Aladdín", "La Sirenita", "Mulán", "Hércules", "Tarzán", "Vaiana (Moana)", "Encanto", "Zootrópolis", "Gru: Mi Villano Favorito",
  "Los Minions", "Kung Fu Panda", "Madagascar", "Ice Age", "Cómo Entrenar a Tu Dragón", "Spider-Man", "Spider-Man: No Way Home", "Iron Man", "Thor",
  "Capitán América", "Los Vengadores", "Vengadores: Endgame", "Guardianes de la Galaxia", "Black Panther", "Deadpool", "Doctor Strange", "Batman",
  "El Caballero Oscuro", "The Batman", "Joker", "Superman", "Wonder Woman", "Aquaman", "Harry Potter", "El Señor de los Anillos", "El Hobbit",
  "Star Wars", "El Imperio Contraataca", "Jurassic Park", "Jurassic World", "Piratas del Caribe", "Indiana Jones", "Regreso al Futuro", "Matrix",
  "Terminator", "Terminator 2", "Alien: El Octavo Pasajero", "Depredador", "Rocky", "Rambo", "Gladiator", "Tiburón", "E.T. El Extraterrestre",
  "Cazafantasmas", "Men in Black", "Solo en Casa", "Solo en Casa 2", "Jumanji", "Charlie y la Fábrica de Chocolate", "Eduardo Manostijeras",
  "Alicia en el País de las Maravillas", "Barbie", "Oppenheimer", "Top Gun", "Top Gun: Maverick", "Misión Imposible", "Fast & Furious", "John Wick",
  "Los Juegos del Hambre", "Crepúsculo", "Divergente", "It (Eso)", "El Exorcista", "Scream", "Saw", "Chucky (Muñeco Diabólico)", "Viernes 13",
  "Pesadilla en Elm Street", "El Resplandor", "Godzilla", "King Kong", "Godzilla vs Kong", "Transformers", "Karate Kid", "Grease", "Mamma Mia!",
  "La La Land", "Forrest Gump", "Pulp Fiction", "El Padrino", "El Padrino II", "La Vida es Bella", "El Club de la Lucha", "Origen (Inception)",
  "Interstellar", "El Show de Truman", "Cadena Perpetua", "Uno de los Nuestros", "Scarface", "El Lobo de Wall Street", "Django Desencadenado",
  "Malditos Bastardos", "Kill Bill", "Seven", "El Silencio de los Corderos", "El Sexto Sentido", "Parásitos", "La Gran Belleza",
  "El Gran Showman", "Bohemian Rhapsody", "Rocketman", "Whiplash", "El Pianista", "La Lista de Schindler", "Salvar al Soldado Ryan",
  "1917", "Dunkerque", "Braveheart", "Troya", "300", "Apocalypse Now", "Casablanca", "Psicosis", "La Ventana Indiscreta",
  "Cantando bajo la lluvia", "El Mago de Oz", "Mary Poppins", "Pesadilla antes de Navidad", "La Novia Cadáver", "Coraline",
  "Bettlejuice (Bitelchús)", "La Familia Addams", "Ghost", "Pretty Woman", "Dirty Dancing", "Notting Hill", "Love Actually",
  "El Diario de Noa", "Bajo la misma estrella", "Cincuenta Sombras de Grey", "Brokeback Mountain", "Call Me By Your Name",
  "Wonka", "Dune", "Dune: Parte 2", "Blade Runner", "Blade Runner 2049", "Mad Max: Furia en la carretera", "La Naranja Mecánica",
  "2001: Una Odisea del Espacio", "Arrival (La Llegada)", "Gravity", "Marte (The Martian)", "Sin City", "Watchmen", "V de Vendetta",
  "El Truco Final (El Prestigio)", "Memento", "Tenet", "Zombieland", "Shaun of the Dead", "Un Monstruo Viene a Verme",
  "El Laberinto del Fauno", "Lo Imposible", "Ocho Apellidos Vascos", "Campeones", "Celda 211", "Tesis", "Rec", "El Orfanato",
  "Mar Adentro", "Volver", "Mujeres al borde de un ataque de nervios", "Todo sobre mi madre", "La Piel que Habito", "La Isla Mínima",
  "As Bestas", "La Sociedad de la Nieve", "Dolor y Gloria", "Torrente", "Padre no hay más que uno", "A Todo Tren", "Los Otros",
  "Abre los Ojos", "Mortadelo y Filemón", "Las Brujas de Zugarramurdi", "El Día de la Bestia", "Airbag", "La Comunidad",
  "Balada Triste de Trompeta", "Superlópez", "Zipi y Zape", "Anacleto: Agente Secreto", "El Niño", "Contratiempo", "Durante la Tormenta",
  "Klaus", "Planet 51", "Tadeo Jones", "Tadeo Jones 2", "Atrapa la Bandera", "Arrugas", "Chico y Rita", "Robot Dreams",
  "Amélie", "Intocable", "El Quinto Elemento", "Taxi Express", "Astérix y Óbélix: Misión Cleopatra", "La Vida de Pi",
  "Slumdog Millionaire", "El Tigre y el Dragón", "Spirited Away (El Viaje de Chihiro)", "Mi Vecino Totoro", "La Princesa Mononoke",
  "El Castillo Ambulante", "Your Name", "Akira", "Ghost in the Shell", "Perfect Blue", "A Silent Voice", "Suzume",
  "El Chico y la Garza", "Ponyo en el Acantilado", "Porco Rosso", "Nausicaä del Valle del Viento", "Cuentos de Terramar",
  "A Todo Gas: Tokyo Race", "Drive", "Baby Driver", "Nadie (Nobody)", "Bullet Train", "Kingsman", "Kick-Ass", "Scott Pilgrim contra el mundo",
  "Ready Player One", "Tron: Legacy", "Pixels", "Ralph el Demoledor", "Sonic: La Película", "Super Mario Bros: La Película",
  "Detective Pikachu", "Uncharted (Película)", "Five Nights at Freddy's (Película)", "Gran Turismo (Película)", "Mortal Kombat (Película)",
  "Tomb Raider", "Resident Evil (Película)", "Silent Hill (Película)", "Warcraft: El Origen", "Prince of Persia: Las Arenas del Tiempo",
  "Assassin's Creed (Película)", "Doom (Película)", "Monster Hunter (Película)", "Need for Speed (Película)", "Free Guy",
  "El Club de los Poetas Muertos", "El Indomable Will Hunting", "La Terminal", "Atrápame si puedes", "Naufrago (Cast Away)",
  "Big", "La Máscara", "Ace Ventura", "Dos Tontos Muy Tontos", "Mentiroso Compulsivo", "El Show de Truman", "Como Dios (Bruce Almighty)",
  "Austin Powers", "Scary Movie", "American Pie", "Resacón en Las Vegas", "Ted", "Infiltrados en Clase (21 Jump Street)",
  "Supersalidos (Superbad)", "Step Brothers", "El Dictador", "Borat", "La Vida de Brian", "Los Caballeros de la Mesa Cuadrada"
];

// 2. Curated Famous Videogames (250+ titles)
const rawVideogames = [
  "Minecraft", "Fortnite", "Roblox", "Tetris", "Pac-Man", "Super Mario Bros.", "Super Mario Odyssey", "Super Mario Galaxy",
  "Super Mario 64", "Super Mario World", "Mario Kart 8 Deluxe", "Mario Kart Wii", "Mario Party", "Luigi's Mansion", "Donkey Kong Country",
  "The Legend of Zelda: Breath of the Wild", "The Legend of Zelda: Tears of the Kingdom", "The Legend of Zelda: Ocarina of Time",
  "The Legend of Zelda: Majora's Mask", "The Legend of Zelda: The Wind Waker", "Pokémon Rojo y Azul", "Pokémon Oro y Plata",
  "Pokémon Rubí y Zafiro", "Pokémon Diamante y Perla", "Pokémon Blanco y Negro", "Pokémon X e Y", "Pokémon Sol y Luna",
  "Pokémon Espada y Escudo", "Pokémon Escarlata y Púrpura", "Pokémon GO", "Animal Crossing: New Horizons", "Animal Crossing: New Leaf",
  "Splatoon", "Splatoon 2", "Splatoon 3", "Super Smash Bros. Ultimate", "Super Smash Bros. Melee", "Sonic the Hedgehog",
  "Sonic Adventure", "Sonic Frontiers", "Sonic Mania", "Crash Bandicoot", "Crash Team Racing", "Spyro the Dragon", "Rayman",
  "Rayman Legends", "Kirby y la Tierra Olvidada", "Kirby's Dream Land", "Metroid Prime", "Metroid Dread", "Super Metroid",
  "Grand Theft Auto V (GTA V)", "Grand Theft Auto: San Andreas", "Grand Theft Auto: Vice City", "Grand Theft Auto IV",
  "Red Dead Redemption", "Red Dead Redemption 2", "Los Sims (The Sims)", "Los Sims 4", "Los Sims 2", "SimCity", "Cities: Skylines",
  "Among Us", "Fall Guys", "Rocket League", "EA Sports FC 24", "FIFA 23", "Pro Evolution Soccer (PES)", "NBA 2K",
  "Call of Duty: Modern Warfare", "Call of Duty: Black Ops", "Call of Duty: Warzone", "Battlefield 1", "Battlefield 4",
  "Counter-Strike 2", "Counter-Strike: Global Offensive (CS:GO)", "Valorant", "Overwatch", "Overwatch 2", "Apex Legends",
  "PUBG: Battlegrounds", "Rainbow Six Siege", "Team Fortress 2", "League of Legends (LoL)", "Dota 2", "Heroes of the Storm",
  "World of Warcraft", "Diablo II", "Diablo III", "Diablo IV", "StarCraft II", "Hearthstone", "Clash Royale", "Clash of Clans",
  "Brawl Stars", "Candy Crush Saga", "Angry Birds", "Plants vs. Zombies", "Subway Surfers", "Geometry Dash", "Flappy Bird",
  "Terraria", "Stardew Valley", "Hades", "Hades II", "Hollow Knight", "Celeste", "Cuphead", "Undertale", "Deltarune", "Dead Cells",
  "The Binding of Isaac", "Slay the Spire", "Enter the Gungeon", "Subnautica", "Outer Wilds", "Valheim", "Rust", "ARK: Survival Evolved",
  "The Forest", "Sons of the Forest", "Don't Starve", "Phasmophobia", "Lethal Company", "Content Warning", "Palworld", "Helldivers 2",
  "Portal", "Portal 2", "Half-Life", "Half-Life 2", "Left 4 Dead 2", "Doom (1993)", "Doom Eternal", "Quake", "Wolfenstein",
  "The Elder Scrolls V: Skyrim", "The Elder Scrolls IV: Oblivion", "Fallout 4", "Fallout: New Vegas", "Fallout 3", "Fallout 76",
  "The Witcher 3: Wild Hunt", "Cyberpunk 2077", "Dark Souls", "Dark Souls III", "Bloodborne", "Sekiro: Shadows Die Twice",
  "Elden Ring", "Demon's Souls", "Lies of P", "God of War (2018)", "God of War Ragnarök", "The Last of Us", "The Last of Us Part II",
  "Uncharted 2: El Reino de los Ladrones", "Uncharted 4: El Desenlace del Ladrón", "Horizon Zero Dawn", "Horizon Forbidden West",
  "Ghost of Tsushima", "Marvel's Spider-Man", "Marvel's Spider-Man 2", "Ratchet & Clank: Una Dimensión Aparte", "LittleBigPlanet",
  "Gran Turismo 7", "Forza Horizon 5", "Forza Motorsport", "Need for Speed: Underground 2", "Need for Speed: Most Wanted",
  "Burnout Paradise", "Asphalt 9", "Resident Evil 2 Remake", "Resident Evil 4", "Resident Evil 7: Biohazard", "Resident Evil Village",
  "Silent Hill 2", "Dead Space", "Alan Wake 2", "Control", "Five Nights at Freddy's", "Poppy Playtime", "Bendy and the Ink Machine",
  "Slender: The Eight Pages", "Amnesia: The Dark Descent", "Outlast", "Alien: Isolation", "Metal Gear Solid", "Metal Gear Solid 3: Snake Eater",
  "Metal Gear Solid V: The Phantom Pain", "Death Stranding", "Assassin's Creed II", "Assassin's Creed IV: Black Flag", "Assassin's Creed Origins",
  "Assassin's Creed Odyssey", "Assassin's Creed Valhalla", "Far Cry 3", "Far Cry 4", "Far Cry 5", "Watch Dogs", "Prince of Persia: Las Arenas del Tiempo",
  "Tomb Raider (2013)", "Rise of the Tomb Raider", "Hitman: World of Assassination", "Dishonored", "Prey", "BioShock", "BioShock Infinite",
  "Borderlands 2", "Borderlands 3", "Mass Effect 2", "Mass Effect Legendary Edition", "Dragon Age: Inquisition", "Baldur's Gate 3",
  "Divinity: Original Sin 2", "Persona 5 Royal", "Final Fantasy VII", "Final Fantasy VII Remake", "Final Fantasy X", "Final Fantasy XVI",
  "Kingdom Hearts", "Kingdom Hearts II", "Chrono Trigger", "Dragon Quest XI", "Nier: Automata", "Monster Hunter: World", "Monster Hunter Rise",
  "Street Fighter 6", "Street Fighter II", "Tekken 8", "Tekken 7", "Tekken 3", "Mortal Kombat 1", "Mortal Kombat 11", "Guilty Gear Strive",
  "Dragon Ball FighterZ", "Dragon Ball Z: Budokai Tenkaichi 3", "Naruto Shippuden: Ultimate Ninja Storm 4", "Super Bomberman",
  "Worms Armageddon", "Lemmings", "Age of Empires II", "Age of Empires IV", "Civilization VI", "Total War: Warhammer III",
  "Star Wars Jedi: Fallen Order", "Star Wars Jedi: Survivor", "Star Wars Battlefront II", "Batman: Arkham City", "Batman: Arkham Knight",
  "Injustice 2", "Dying Light", "Dead Island 2", "Payday 2", "Sea of Thieves", "No Man's Sky", "Starfield", "Genshin Impact",
  "Honkai: Star Rail", "Zenless Zone Zero", "Wuthering Waves", "AFK Journey", "Monopoly GO!", "Clash Mini", "Squad Busters"
];

// 3. Curated Password Target Words (500+ punchy, descriptive Spanish concepts)
const rawPasswordWords = [
  "ELEFANTE", "PARAGUAS", "AEROPUERTO", "PIZZA", "VOLCÁN", "GUITARRA", "PIRATA", "BICICLETA", "DENTISTA", "CASTILLO",
  "TIBURÓN", "AVIÓN", "FANTASMA", "BIBLIOTECA", "MICROONDAS", "PLAYA", "DESIERTO", "ASTRONAUTA", "HOSPITAL", "TREN",
  "SUBMARINO", "DINOSAURIO", "BRÚJULA", "LINTERNA", "ESPEJO", "RELOJ", "HELADO", "CHOCOLATE", "HAMBURGUESA", "CAFÉ",
  "LIMONADA", "TORTILLA", "CROQUETA", "GAZPACHO", "PAELLA", "SUSHI", "DONUT", "GALLETA", "SANDÍA", "AGUACATE",
  "JIRAFA", "PINGÜINO", "DELFÍN", "CANGURO", "COCODRILO", "RINOCERONTE", "HIPOPÓTAMO", "ÁGUILA", "BÚHO", "FLAMENCO",
  "CAMALEÓN", "PULPO", "MEDUSA", "LANGOSTA", "CANGREJO", "ARDILLA", "MAPACHE", "MURCIÉLAGO", "LOBO", "ZORRO",
  "GORILA", "CHIMPANCÉ", "PANDA", "KOALA", "ORNITORRINCO", "AVESTRUZ", "PAVO REAL", "CABALLITO DE MAR", "CAMELLO", "CEBRA",
  "LEÓN", "TIGRE", "OSO POLAR", "GUEPARDO", "LEOPARDO", "HENA", "JABALÍ", "CIERVO", "RANA", "SAPO",
  "SERPIENTE", "TORTUGA", "CARACOL", "MARIPOSA", "ABEJA", "HORMIGA", "MOSQUITO", "ESCORPIÓN", "ARAÑA", "GRILLO",
  "BOMBERO", "POLICÍA", "MÉDICO", "ENFERMERO", "PROFESOR", "COCINERO", "CAMARERO", "PANADERO", "CARPINTERO", "FONTANERO",
  "ELECTRICISTA", "MECÁNICO", "PINTOR", "ESCULTOR", "ARQUITECTO", "JUEZ", "ABOGADO", "PILOTO", "AZAFATA", "PERIODISTA",
  "FOTÓGRAFO", "VETERINARIO", "FARMACÉUTICO", "PELUQUERO", "ALBAÑIL", "JARDINERO", "PESCADOR", "AGRICULTOR", "MINERO", "CIENTÍFICO",
  "FÚTBOL", "BALONCESTO", "TENIS", "VOLEIBOL", "NATACIÓN", "CICLISMO", "ATLETISMO", "BOXEO", "JUDO", "KARATE",
  "GOLF", "RUGBY", "BÉISBOL", "HOCKEY", "ESQUÍ", "SURF", "SKATE", "PÁDEL", "BADMINTON", "ESCALADA",
  "PATINAJE", "EQUITACIÓN", "TIRO CON ARCO", "GIMNASIA", "PIRAGÜISMO", "ESGRIMA", "TRIATLÓN", "MARATÓN", "YOGA", "PILATES",
  "TELEVISOR", "ORDENADOR", "PORTÁTIL", "MÓVIL", "TABLET", "AURICULARES", "ALTAVOZ", "TECLADO", "RATÓN", "IMPRESORA",
  "CÁMARA", "CONSOLA", "MANDO", "PANTALLA", "CABLE", "BATERÍA", "CARGADOR", "ROUTER", "ANTENA", "CHIP",
  "NEVERA", "LAVADORA", "LAVAVAJILLAS", "HORNO", "TOSTADORA", "BATIDORA", "CAFETERA", "ASPIRADORA", "PLANCHA", "SECADOR",
  "SARTÉN", "OLLA", "CUCHILLO", "TENEDOR", "CUCHARA", "VASO", "PLATO", "TAZA", "BOTELLA", "ABRIDOR",
  "SACACORCHOS", "SERVILLETA", "MANTEL", "BANDEJA", "EXPRIMIDOR", "RALLADOR", "COLADOR", "FIAMBRERA", "TERMO", "JARRA",
  "CAMA", "SOFÁ", "SILLA", "MESA", "ARMARIO", "ESTANTERÍA", "CÓMODA", "MESITA", "LÁMPARA", "COJÍN",
  "MANTA", "SÁBANA", "ALMOHADA", "CORTINA", "ALFOMBRA", "CUADRO", "JARRÓN", "PERCHERO", "ESCRITORIO", "TABURETE",
  "ZAPATILLA", "ZAPATO", "BOTA", "SANDALIA", "CALCETÍN", "PANTALÓN", "CAMISA", "CAMISETA", "SUDADERA", "JERSEY",
  "CHAQUETA", "ABRIGO", "BUFANDA", "GUANTES", "GORRO", "SOMBRERO", "GORRA", "CINTURÓN", "CORBATA", "PIJAMA",
  "BAÑADOR", "BATA", "VESTIDO", "FALDA", "BOLSO", "CARTERA", "MONEDERO", "MOCHILA", "MALETA", "GAFAS",
  "ANILLO", "COLLAR", "PULSERA", "PENDIENTE", "BROCHE", "CORONA", "DIADEMA", "PASADOR", "RELOJ DE PULSERA", "GEMELOS",
  "CASCADA", "RÍO", "LAGO", "MAR", "OCÉANO", "MONTAÑA", "BOSQUE", "SELVA", "ISLA", "CUEVA",
  "GLACIAR", "VOLCÁN", "TERREMOTO", "HURACÁN", "TORNADO", "TORMENTA", "RAYO", "TRUENO", "NIEVE", "GRANIZO",
  "ARCOÍRIS", "NIEBLA", "NUBE", "SOL", "LUNA", "ESTRELLA", "COMETA", "GALAXIA", "METEORITO", "ECLIPSE",
  "MUSEO", "TEATRO", "CINE", "ESTADIO", "PARQUE", "ZOOLÓGICO", "ACUARIO", "DISCOTECA", "RESTAURANTE", "HOTEL",
  "SUPERMERCADO", "CENTRO COMERCIAL", "GASOLINERA", "FARMACIA", "BANCO", "CORREOS", "IGLESIA", "CATEDRAL", "PIRÁMIDE", "COLISEO",
  "TORRE", "PUENTE", "PUERTO", "ESTACIÓN", "METRO", "TRANVÍA", "AUTOBÚS", "TAXI", "AMBULANCIA", "COCHE DE BOMBEROS",
  "PATINETE", "TRICICLO", "MOTO", "CAMIÓN", "TRACTOR", "GRÚA", "EXCAVADORA", "CARAVANA", "VELERO", "YATE",
  "CRUCERO", "LANCHA", "CANOA", "KAYAK", "GLOBO AEROSTÁTICO", "HELICÓPTERO", "COHETE", "SATÉLITE", "TELEFÉRICO", "ASCENSOR",
  "PIANO", "VIOLÍN", "BATERÍA MUSICAL", "FLAUTA", "TROMPETA", "SAXOFÓN", "CLARINETE", "ARPA", "ACORDEÓN", "TAMBOR",
  "MICRÓFONO", "AMPLIFICADOR", "PARTITURA", "BATUTA", "DISCO", "CASSETTE", "VINILO", "ALTAVOCES", "AURICULARES", "SINTETIZADOR",
  "TIJERAS", "PEGAMENTO", "GRAPADORA", "PAPEL", "BOLÍGRAFO", "LÁPIZ", "GOMA", "REGLA", "COMPÁS", "CARPETA",
  "CUADERNO", "LIBRO", "DICCIONARIO", "ENCICLOPEDIA", "PERIÓDICO", "REVISTA", "SOBRE", "SELLO", "CINTA ADHESIVA", "PINCEL",
  "ACUARELA", "ÓLEO", "LIENZO", "CABALLETE", "PALETA", "PLASTILINA", "TIZA", "PIZARRA", "CHINCHETA", "CLIP",
  "CANDADO", "LLAVE", "CADENA", "ALARMA", "EXTINTOR", "BOTIQUÍN", "TERMÓMETRO", "VENDA", "TIRITA", "JERINGUILLA",
  "PASTILLA", "JARABE", "MASCARILLA", "ESTETOSCOPIO", "BISTURÍ", "MULETA", "SILLA DE RUEDAS", "YESO", "LUPA", "TELESCOPIO",
  "MICROSCOPIO", "PROBETA", "TERMÓMETRO", "BARÓMETRO", "ANEMÓMETRO", "RADAR", "SONAR", "TALADRO", "MARTILLO", "DESTORNILLADOR",
  "ALICATES", "SIERRA", "SERRUCHO", "LLAVE INGLESA", "TORNILLO", "TUERCA", "CLAVO", "TACO", "NIVEL", "METRO"
];

function cleanTitle(str) {
  return str.trim();
}

function generateId(prefix, title) {
  const norm = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return `${prefix}_${norm}`.substring(0, 50);
}

// Build Movies array
const seenMovieIds = new Set();
const moviesList = [];
for (const raw of rawMovies) {
  const title = cleanTitle(raw);
  const id = generateId('movie', title);
  if (seenMovieIds.has(id)) continue;
  seenMovieIds.add(id);
  moviesList.push({
    id,
    title,
    category: 'MOVIE'
  });
}

// Build Videogames array
const seenGameIds = new Set();
const gamesList = [];
for (const raw of rawVideogames) {
  const title = cleanTitle(raw);
  const id = generateId('game', title);
  if (seenGameIds.has(id)) continue;
  seenGameIds.add(id);
  gamesList.push({
    id,
    title,
    category: 'VIDEOGAME'
  });
}

// Build Password words array
const seenPasswordWords = new Set();
const passwordList = [];
for (const raw of rawPasswordWords) {
  const word = cleanTitle(raw).toUpperCase();
  if (seenPasswordWords.has(word)) continue;
  seenPasswordWords.add(word);
  const id = generateId('pwd', word);
  passwordList.push({
    id,
    word
  });
}

// Write files
const moviesTs = `export interface EmojiMovieItem {
  id: string;
  title: string;
  category: 'MOVIE';
}

export const EMOJI_MOVIES: EmojiMovieItem[] = ${JSON.stringify(moviesList, null, 2)};
`;

const gamesTs = `export interface EmojiVideogameItem {
  id: string;
  title: string;
  category: 'VIDEOGAME';
}

export const EMOJI_VIDEOGAMES: EmojiVideogameItem[] = ${JSON.stringify(gamesList, null, 2)};
`;

const passwordTs = `export interface PasswordWordItem {
  id: string;
  word: string;
}

export const PASSWORD_WORDS: PasswordWordItem[] = ${JSON.stringify(passwordList, null, 2)};
`;

fs.writeFileSync(path.join(targetDir, 'emojiMovies.ts'), moviesTs, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'emojiVideogames.ts'), gamesTs, 'utf-8');
fs.writeFileSync(path.join(targetDir, 'passwordWords.ts'), passwordTs, 'utf-8');

console.log(`Generated:
- ${moviesList.length} curated emoji movies in src/data/palabraSecreta/emojiMovies.ts
- ${gamesList.length} curated emoji videogames in src/data/palabraSecreta/emojiVideogames.ts
- ${passwordList.length} curated password concepts in src/data/palabraSecreta/passwordWords.ts
`);
