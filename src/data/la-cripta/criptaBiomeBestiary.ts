import type {
  CriptaDungeonId,
  CriptaEnemyProfession,
  CriptaEnemyVisualProfile,
  CriptaRoomEnemy,
  CriptaStatusEffectType,
} from '../../types/laCripta';
import type { CriptaEnemyTraitEntry } from './criptaEquipmentAndEvents';

export type CriptaUniqueCreatureModelId =
  // 1. Catacumbas del Rey
  | 'CATACUMBAS_GUARDIAN_CRIPTAS'
  | 'CATACUMBAS_ACOLITO_HUESO'
  | 'CATACUMBAS_ESPECTRO_CENIZA'
  | 'CATACUMBAS_ ENJAMBRE_SEPULCRAL'
  | 'CATACUMBAS_CABALLERO_TUMULAR'
  | 'CATACUMBAS_CANTOR_FUNEBRE'
  | 'CATACUMBAS_SENOR_OSARIO'
  | 'CATACUMBAS_REGENTE_INSEPULTO'
  // 2. Jardín Podrido
  | 'JARDIN_HONGO_ERRANTE'
  | 'JARDIN_LARVA_PUTREFACTA'
  | 'JARDIN_TREPADORA_ESPINOSA'
  | 'JARDIN_MOSCA_CARRONERA'
  | 'JARDIN_COLOSO_MICELIO'
  | 'JARDIN_ DAMA_ESPORAS'
  | 'JARDIN_CORAZON_PUTRIDO'
  | 'JARDIN_MATRIARCA_FUNGICA'
  // 3. Forja Infernal
  | 'FORJA_AUTOMA_ESCORIA'
  | 'FORJA_HERRERO_CENIZA'
  | 'FORJA_SALAMANDRA_CRISOL'
  | 'FORJA_MARTILLO_VIVIENTE'
  | 'FORJA_CENTURION_PIROCLASTO'
  | 'FORJA_ YUNQUE_ANIMADO'
  | 'FORJA_TITAN_CRISOL'
  | 'FORJA_SENOR_FUNDICION'
  // 4. Templo Sumergido
  | 'TEMPLO_ACOLITO_ABISAL'
  | 'TEMPLO_ANGUILA_SIMA'
  | 'TEMPLO_GUARDIAN_CORAL'
  | 'TEMPLO_CANTOR_MAREAS'
  | 'TEMPLO_CABALLERO_AHOGADO'
  | 'TEMPLO_HIDRA_SALMUERA'
  | 'TEMPLO_ORACULO_PROFUNDIDADES'
  | 'TEMPLO_LEVIATAN_ALTAR'
  // 5. Minas Abandonadas
  | 'MINAS_MINERO_DESCASCARADO'
  | 'MINAS_ARANUELO_FILON'
  | 'MINAS_MURCIELAGO_SONICO'
  | 'MINAS_EXCAVADOR_CIEGO'
  | 'MINAS_CAPATAZ_GRISU'
  | 'MINAS_GOLEM_ pirita'
  | 'MINAS_DEVORADOR_VETAS'
  | 'MINAS_PERFORADOR_PROFUNDO'
  // 6. Castillo del Verdugo
  | 'VERDUGO_CARCELERO_REAL'
  | 'VERDUGO_SABUESO_CADENAS'
  | 'VERDUGO_PENITENTE_HIERRO'
  | 'VERDUGO_CUERVO_PATIBULO'
  | 'VERDUGO_INQUISIDOR_ESCARLATA'
  | 'VERDUGO_DONCELLA_ESPIGAS'
  | 'VERDUGO_GRAN_VERDUGO'
  | 'VERDUGO_SENOR_CADALSO'
  // 7. Bosque de los Susurros
  | 'BOSQUE_CIERVO_OSAMENTA'
  | 'BOSQUE_SOMBRA_RAMAS'
  | 'BOSQUE_LOBO_NIEBLA'
  | 'BOSQUE_FUEGO_FATUO'
  | 'BOSQUE_ANCIANO_CORTEZA'
  | 'BOSQUE_CAZADOR_ESPECTRAL'
  | 'BOSQUE_ESPIRITU_RAICES'
  | 'BOSQUE_VENADO_CORONA_NEGRA'
  // 8. Alcantarillas Imperiales
  | 'ALCANTARILLAS_RATA_PESTE'
  | 'ALCANTARILLAS_LIMO_CLOACA'
  | 'ALCANTARILLAS_CONTRABANDISTA_MUTADO'
  | 'ALCANTARILLAS_SANGUIJUELA_CANAL'
  | 'ALCANTARILLAS_ABOMINACION_FANGO'
  | 'ALCANTARILLAS_ALQUIMISTA_DESAGUES'
  | 'ALCANTARILLAS_REY_RATAS'
  | 'ALCANTARILLAS_HIDRA_RESIDUOS'
  // 9. Biblioteca Prohibida
  | 'BIBLIOTECA_GRIMORIO_ANIMADO'
  | 'BIBLIOTECA_ESCRIBA_SIN_ROSTRO'
  | 'BIBLIOTECA_POLILLA_PERGAMINO'
  | 'BIBLIOTECA_CUSTODIO_TINTA'
  | 'BIBLIOTECA_ARCHIVERO_SELLADO'
  | 'BIBLIOTECA_ESTATUA_LECTORA'
  | 'BIBLIOTECA_CENSOR_SILENCIO'
  | 'BIBLIOTECA_DEVORADOR_NOMBRES'
  // 10. Torre del Astrólogo
  | 'ASTROLOGO_ACOLITO_ZODIACO'
  | 'ASTROLOGO_ESFERA_ARMILAR'
  | 'ASTROLOGO_HOMUNCULO_ETER'
  | 'ASTROLOGO_CENTINELA_COMETA'
  | 'ASTROLOGO_TEJEDOR_CONSTELACIONES'
  | 'ASTROLOGO_GUARDIAN_ECLIPSE'
  | 'ASTROLOGO_ARCONTE_CENIT'
  | 'ASTROLOGO_OBSERVADOR_INFINITO'
  // 11. La Colmena
  | 'COLMENA_OBRERA_QUITINA'
  | 'COLMENA_ZANGANO_AGUIIJON'
  | 'COLMENA_ESCARABAJO_ACIDO'
  | 'COLMENA_LARVA_INCUBADORA'
  | 'COLMENA_GUARDIA_PRETORIANO'
  | 'COLMENA_TEJEDORA_AMBAR'
  | 'COLMENA_REINA_PROGENIE'
  | 'COLMENA_TIRANO_ENJAMBRE'
  // 12. Cripta de Cristal
  | 'CRISTAL_ESPECTRO_PRISMA'
  | 'CRISTAL_ESCORPION_CUARZO'
  | 'CRISTAL_CENTINELA_GEODA'
  | 'CRISTAL_FRAGMENTO_RESONANTE'
  | 'CRISTAL_CABALLERO_DIAMANTE'
  | 'CRISTAL_CANTOR_REFRACCION'
  | 'CRISTAL_COLOSO_PRISMATICO'
  | 'CRISTAL_SERAFIN_CUARZO'
  // 13. Prisión Maldita
  | 'PRISION_REO_ENCADENADO'
  | 'PRISION_TORTURADOR_CIEGO'
  | 'PRISION_ALMA_ENJAULADA'
  | 'PRISION_MASTIN_CELDA'
  | 'PRISION_ALCAIDE_HIERRO'
  | 'PRISION_PENITENTE_CAMPANA'
  | 'PRISION_CARCELERO_ETERNO'
  | 'PRISION_JUEZ_CADENAS'
  // 14. Santuario de Sangre
  | 'SANGRE_ACOLITO_CARMESI'
  | 'SANGRE_MURCIELAGO_VAMPIRICO'
  | 'SANGRE_FLAGELANTE_CALIZ'
  | 'SANGRE_ SIERVO_DESANGRADO'
  | 'SANGRE_CABALLERO_ARTERIA'
  | 'SANGRE_SACERDOTISA_HEMO'
  | 'SANGRE_CARDENAL_DESOLLADO'
  | 'SANGRE_AVATAR_CALIZ'
  // 15. Ciudad Sepultada
  | 'CIUDAD_GUARDIA_MOMIFICADO'
  | 'CIUDAD_ESCARABAJO_LAPISLAZULI'
  | 'CIUDAD_SACERDOTE_POLVO'
  | 'CIUDAD_CHACAL_ARENA'
  | 'CIUDAD_USURPADOR_DORADO'
  | 'CIUDAD_ESFINGE_ROTA'
  | 'CIUDAD_FARAON_SIN_SOL'
  | 'CIUDAD_MONOLITO_VIVIENTE'
  // 16. Palacio de los Espejos
  | 'ESPEJOS_DOBLE_FRAGMENTADO'
  | 'ESPEJOS_DAMA_AZOGUE'
  | 'ESPEJOS_BUfON_ILUSION'
  | 'ESPEJOS_FILO_CRISTALINO'
  | 'ESPEJOS_DUELISTA_REFLEJO'
  | 'ESPEJOS_MASCARA_PLATEADA'
  | 'ESPEJOS_MONARCA_REFLEJOS'
  | 'ESPEJOS_ ILUSIONISTA_REAL'
  // 17. Cavernas Heladas
  | 'HELADAS_LOBO_ESCARCHA'
  | 'HELADAS_ESPECTRO_VENTISCA'
  | 'HELADAS_TREPADOR_CARAMBANO'
  | 'HELADAS_GUERRERO_CONGELADO'
  | 'HELADAS_TROLL_GLACIAR'
  | 'HELADAS_BRUJA_INVIERNO'
  | 'HELADAS_BEHEMOTH_PERMAFROST'
  | 'HELADAS_SENOR_ALUD'
  // 18. Fortaleza Goblin
  | 'GOBLIN_LANCERO_CHATARRA'
  | 'GOBLIN_PIROMANO_BARRIL'
  | 'GOBLIN_JINETE_HUARGO'
  | 'GOBLIN_TRAMPERO_FURTIVO'
  | 'GOBLIN_CHAMAN_TOTEM'
  | 'GOBLIN_BRUTO_BLINDADO'
  | 'GOBLIN_CAUDILLO_CORONA_HIERRO'
  | 'GOBLIN_MAESTRO_ASEDIO'
  // 19. Cementerio de Gigantes
  | 'GIGANTES_ESQUELETO_COLOSAL'
  | 'GIGANTES_CRANEO_ERRANTE'
  | 'GIGANTES_MANO_DESENTERRADA'
  | 'GIGANTES_PERRO_OSARIO'
  | 'GIGANTES_TITAN_DECAPITADO'
  | 'GIGANTES_GUARDIAN_FOSA'
  | 'GIGANTES_COLOSO_FEMURES'
  | 'GIGANTES_REY_OSARIO'
  // 20. El Abismo & Final Boss
  | 'ABISMO_HERALDO_VACIO'
  | 'ABISMO_LARVA_ESTELAR'
  | 'ABISMO_SOMBRA_DEVORADORA'
  | 'ABISMO_TESTIGO_CIEGO'
  | 'ABISMO_CABALLERO_ECLIPSE'
  | 'ABISMO_CANTOR_NADA'
  | 'ABISMO_PRIMER_CAIDO'
  | 'ABISMO_CORAZON_CRIPTAS'
  | 'FINAL_BOSS_SOBERANO_P1'
  | 'FINAL_BOSS_SOBERANO_P2'
  | 'FINAL_BOSS_OSSUARY_KING_P1'
  | 'FINAL_BOSS_OSSUARY_KING_P2'
  | 'FINAL_BOSS_ASTRAL_LEVIATHAN_P1'
  | 'FINAL_BOSS_ASTRAL_LEVIATHAN_P2';

export interface CriptaCreatureVisualBlueprint {
  id: CriptaUniqueCreatureModelId;
  slug: string;
  name: string;
  title: string;
  dungeonId: CriptaDungeonId;
  tier: 'NORMAL' | 'ELITE' | 'MINIBOSS' | 'FINAL_BOSS';
  roleTag: NonNullable<CriptaRoomEnemy['roleTag']>;
  profession?: CriptaEnemyProfession;
  visualProfile?: CriptaEnemyVisualProfile;
  /**
   * Distinct anatomical family + silhouette variant so no two enemies in any biome
   * ever share the same silhouette, head, weapon, posture, or proportions.
   */
  silhouetteType:
    | 'SKELETAL_SPEAR_GUARD'
    | 'BONE_TOTEM_SHAMAN'
    | 'FLOATING_ASH_WRAITH'
    | 'CRYPT_SCARAB_SWARM'
    | 'TOMB_GREATSHIELD_KNIGHT'
    | 'BELL_DIRGE_CHANTER'
    | 'OSSUARY_THRONE_LORD'
    | 'CROWNED_LICH_REGENT'
    | 'WALKING_MYCELIUM_SHROOM'
    | 'BLOATED_ROT_GRUB'
    | 'THORN_LASHER_VINE'
    | 'CARRION_BLIGHT_FLY'
    | 'SPORE_HULK_COLOSSUS'
    | 'FUNGAL_VEIL_MATRON'
    | 'PULSING_ROT_HEART'
    | 'EMPRESS_MYCELIA'
    | 'SLAG_PISTON_AUTOMATON'
    | 'ASH_ANVIL_BLACKSMITH'
    | 'MOLTEN_CRUCIBLE_NEWT'
    | 'ANIMATED_RUNE_HAMMER'
    | 'PYROCLAST_CENTURION'
    | 'LIVING_FURNACE_ANVIL'
    | 'CRUCIBLE_MAGMA_TITAN'
    | 'FOUNDRY_OVERLORD'
    | 'ABYSSAL_GILL_ACOLYTE'
    | 'TRENCH_SHOCK_EEL'
    | 'BARNACLE_CORAL_SENTINEL'
    | 'TIDAL_CONCH_SIREN'
    | 'ANCHOR_DROWNED_TEMPLAR'
    | 'BRINE_TWO_HEAD_HYDRA'
    | 'ABYSSAL_PEARL_ORACLE'
    | 'ALTAR_LEVIATHAN_COIL'
    | 'HUSK_PICKAXE_MINER'
    | 'VEIN_CRYSTAL_SPIDER'
    | 'SONIC_CAVE_WYRM_BAT'
    | 'BLIND_MOLE_CLAW_DIGGER'
    | 'FIREDAMP_LANTERN_FOREMAN'
    | 'PYRITE_CRAG_GOLEM'
    | 'SEAM_WORM_DEVOURER'
    | 'DRILL_JUGGERNAUT_BOSS'
    | 'KEYRING_DUNGEON_JAILER'
    | 'SPIKED_CHAIN_MASTIFF'
    | 'IRON_CAGE_PENITENT'
    | 'GALLOWS_CARRION_CROW'
    | 'SCARLET_BRAND_INQUISITOR'
    | 'IRON_MAIDEN_CONSTRUCT'
    | 'GRAND_HOODED_EXECUTIONER'
    | 'SCAFFOLD_GUILLOTINE_LORD'
    | 'ANTLER_SKULL_STAG'
    | 'BRANCH_CLAW_LURKER'
    | 'MIST_HOWLER_WOLF'
    | 'LANTERN_WISP_CLUSTER'
    | 'HOLLOW_BARK_TREANT'
    | 'SPECTRAL_LONGBOW_HUNTER'
    | 'ROOT_HEART_ARCHDRUID'
    | 'BLACK_CROWN_WENDIGO_STAG'
    | 'PLAGUE_RAT_PACK'
    | 'TOXIC_GRATE_SLIME'
    | 'MUTATED_PIPE_SMUGGLER'
    | 'BLOATED_CANAL_LEECH'
    | 'SLUDGE_GRAFT_ABOMINATION'
    | 'SEWER_PLAGUE_APOTHECARY'
    | 'CROWNED_RAT_KING'
    | 'EFFLUENT_THREE_NECK_HYDRA'
    | 'TEETH_GRIMOIRE_MIMIC'
    | 'FACELESS_QUILL_SCRIBE'
    | 'PARCHMENT_SILK_MOTH'
    | 'INK_TENDRIL_CUSTODIAN'
    | 'CHAINED_ARCHIVE_KEEPER'
    | 'GARGOYLE_LECTERN_STATUE'
    | 'SILENCE_BELL_CENSOR'
    | 'VOID_TOME_NAME_EATER'
    | 'ZODIAC_STARMAP_ACOLYTE'
    | 'BRASS_ARMILLARY_SPHERE'
    | 'AETHER_FLASK_HOMUNCULUS'
    | 'COMET_HALBERD_SENTINEL'
    | 'CONSTELLATION_LOOM_WEAVER'
    | 'SOLAR_ECLIPSE_WARDEN'
    | 'ZENITH_ASTROLABLE_ARCHON'
    | 'INFINITE_OCULUS_OBSERVER'
    | 'CHITIN_SCYTHE_WORKER'
    | 'WASP_STINGER_DRONE'
    | 'ACID_CARAPACE_BEETLE'
    | 'BROOD_SAC_LARVA'
    | 'MANTIS_PRAETORIAN_GUARD'
    | 'AMBER_SILK_ARACHNID'
    | 'ROYAL_OVIPOSITOR_QUEEN'
    | 'FOUR_WING_SWARM_TYRANT'
    | 'PRISM_REFRACT_WRAITH'
    | 'QUARTZ_PINCER_SCORPION'
    | 'GEODE_OBELISK_SENTINEL'
    | 'RESONATING_SHARD_CLUSTER'
    | 'DIAMOND_AEGIS_PALADIN'
    | 'CHIME_CRYSTAL_CHANTER'
    | 'PRISMATIC_MONOLITH_COLOSSUS'
    | 'SIX_WING_QUARTZ_SERAPH'
    | 'SHACKLED_BALL_PRISONER'
    | 'BLINDFOLD_PINCER_TORTURER'
    | 'HANGING_CAGE_SOUL'
    | 'JAW_COLLAR_CELL_HOUND'
    | 'IRON_KEY_WARDEN'
    | 'BELL_YOKE_FLAGELANT'
    | 'ETERNAL_SHACKLE_OVERSEER'
    | 'GALLOWS_SCALES_JUDGE'
    | 'CRIMSON_CHALICE_ACOLYTE'
    | 'GORGED_VAMPIRE_STRIGOI'
    | 'THORN_WHIP_FLAGELLANT'
    | 'EXSANGUINATED_HUSK_THRALL'
    | 'ARTERIAL_LANCE_KNIGHT'
    | 'HEMO_CENSER_PRIESTESS'
    | 'FLAYED_MITRE_CARDINAL'
    | 'OVERFLOWING_GRAIL_AVATAR'
    | 'KHOPESH_MUMMY_GUARD'
    | 'LAPIS_SCARAB_CONSTRUCT'
    | 'SAND_URN_HIEROPHANT'
    | 'ANUBIS_DUNE_JACKAL'
    | 'GILDED_MASK_USURPER'
    | 'FRACTURED_WING_SPHINX'
    | 'SUNLESS_SARCOPHAGUS_PHARAOH'
    | 'OBELISK_SAND_COLOSSUS'
    | 'SHATTERED_DOPPELGANGER'
    | 'QUICKSILVER_GOWN_LADY'
    | 'JESTER_TWIN_MASK'
    | 'FLOATING_MIRROR_BLADE'
    | 'SILVER_RAPIER_DUELIST'
    | 'FLOATING_PORCELAIN_MASK'
    | 'THRONE_MIRROR_MONARCH'
    | 'KALEIDOSCOPE_GRAND_ILLUSIONIST'
    | 'FROST_FANG_DIRE_WOLF'
    | 'BLIZZARD_SHROUD_BANSHEE'
    | 'ICICLE_CEILING_CRAWLER'
    | 'FROZEN_AXE_DRAUGR'
    | 'GLACIER_TUSK_TROLL'
    | 'RIME_ANTLER_CRONE'
    | 'PERMAFROST_MAMMOTH_BEHEMOTH'
    | 'AVALANCHE_RUNE_JOTUNN'
    | 'SCRAP_SPEAR_GOBLIN'
    | 'POWDER_KEG_BOMBER'
    | 'WARG_MOUNTED_RAIDER'
    | 'BEARTRAP_SNARE_STALKER'
    | 'SKULL_POLE_GOBLIN_SHAMAN'
    | 'BOILER_PLATE_GOBLIN_BRUTE'
    | 'IRON_CROWN_WARBOSS'
    | 'BALLISTA_SIEGE_MASTER'
    | 'COLOSSAL_RIB_SKELETON'
    | 'ROLLING_GIANT_CRANIUM'
    | 'CRAWLING_TITAN_HAND'
    | 'GRAVE_RIBCAGE_HOUND'
    | 'HEADLESS_ATLAS_TITAN'
    | 'GRAVESTONE_CHAIN_WARDEN'
    | 'FEMUR_PILLAR_COLOSSUS'
    | 'OSSUARY_CROWN_GIANT_KING'
    | 'VOID_HALO_HERALD'
    | 'ASTRAL_PARASITE_LARVA'
    | 'UMBRAL_MAW_STALKER'
    | 'MANY_EYED_BLIND_WITNESS'
    | 'ECLIPSE_GREATSWORD_KNIGHT'
    | 'HOLLOW_CHOIR_CHANTER'
    | 'BROKEN_WINGS_FIRST_FALLEN'
    | 'CHAINED_ABYSSAL_HEART'
    | 'SOVEREIGN_PHASE_1'
    | 'SOVEREIGN_PHASE_2'
    | 'OSSUARY_KING_PHASE_1'
    | 'OSSUARY_KING_PHASE_2'
    | 'ASTRAL_LEVIATHAN_PHASE_1'
    | 'ASTRAL_LEVIATHAN_PHASE_2';
  palette: {
    primary: string;
    secondary: string;
    highlight: string;
    eyeGlow: string;
    metal: string;
    dark: string;
  };
  scaleFactor: number;
  idleCadence: 'HEAVY_BREATH' | 'FLOAT_SWAY' | 'PREDATOR_CROUCH' | 'RITUAL_PULSE' | 'SCUTTLE_TWITCH' | 'MARCH_GUARD';
  signatureMoveName: string;
  statusThreat?: CriptaStatusEffectType;
  weaknesses: CriptaEnemyTraitEntry[];
  resistances: CriptaEnemyTraitEntry[];
}

export interface CriptaMinibossArenaDefinition {
  dungeonId: CriptaDungeonId;
  arenaTitle: string;
  arenaSubtitle: string;
  floorSealColor: string;
  altarAccentColor: string;
  centerpieceKind:
    | 'OSSUARY_THRONE'
    | 'MYCELIAL_HEART_ALTAR'
    | 'MOLTEN_ANVIL_CRUCIBLE'
    | 'SUNKEN_LEVIATHAN_SHRINE'
    | 'RUNIC_EXCAVATION_SHAFT'
    | 'GUILLOTINE_SCAFFOLD'
    | 'BLACK_ROOT_MENHIR'
    | 'PLAGUE_SLUICE_CAULDRON'
    | 'FORBIDDEN_CHANDELIER_PODIUM'
    | 'CELESTIAL_ORRERY_RING'
    | 'ROYAL_BROOD_CHAMBER'
    | 'PRISMATIC_GEODE_SANCTUM'
    | 'HANGING_TORTURE_CAGES'
    | 'OVERFLOWING_BLOOD_CHALICE'
    | 'SUNLESS_PHARAOH_DAIS'
    | 'GRAND_SHATTERED_MIRROR'
    | 'GLACIAL_ICE_MONOLITH'
    | 'GOBLIN_WAR_PALISADE'
    | 'TITAN_SKULL_MAUSOLEUM'
    | 'ABYSSAL_ECLIPSE_CORE';
}

export const CRIPTA_MINIBOSS_ARENAS: Record<CriptaDungeonId, CriptaMinibossArenaDefinition> = {
  catacumbas_del_rey: {
    dungeonId: 'catacumbas_del_rey',
    arenaTitle: 'TRONO DEL OSARIO REAL',
    arenaSubtitle: 'SANTUARIO FUNERARIO DE LOS MONARCAS INSEPULTOS',
    floorSealColor: '#5CE6A0',
    altarAccentColor: '#E7A54A',
    centerpieceKind: 'OSSUARY_THRONE',
  },
  jardin_podrido: {
    dungeonId: 'jardin_podrido',
    arenaTitle: 'NÚCLEO DEL MICELIO MADRE',
    arenaSubtitle: 'INVERNADERO DE ESPORAS SOBERANAS',
    floorSealColor: '#B8FF66',
    altarAccentColor: '#A55CC2',
    centerpieceKind: 'MYCELIAL_HEART_ALTAR',
  },
  forja_infernal: {
    dungeonId: 'forja_infernal',
    arenaTitle: 'CRISOL DEL GRAN YUNQUE',
    arenaSubtitle: 'CÁMARA DE FUNDICIÓN PIROCLÁSTICA',
    floorSealColor: '#FF5926',
    altarAccentColor: '#FFD166',
    centerpieceKind: 'MOLTEN_ANVIL_CRUCIBLE',
  },
  templo_sumergido: {
    dungeonId: 'templo_sumergido',
    arenaTitle: 'ALTAR DEL LEVIATÁN AHOGADO',
    arenaSubtitle: 'FOSA ABISAL DE LAS MAREAS NEGRAS',
    floorSealColor: '#38BDF8',
    altarAccentColor: '#2DD4BF',
    centerpieceKind: 'SUNKEN_LEVIATHAN_SHRINE',
  },
  minas_abandonadas: {
    dungeonId: 'minas_abandonadas',
    arenaTitle: 'POZO MADRE DE EXTRACCIÓN',
    arenaSubtitle: 'VETA RÚNICA DEL FONDO DE LA TIERRA',
    floorSealColor: '#F59E0B',
    altarAccentColor: '#38BDF8',
    centerpieceKind: 'RUNIC_EXCAVATION_SHAFT',
  },
  castillo_del_verdugo: {
    dungeonId: 'castillo_del_verdugo',
    arenaTitle: 'CADALSO DE LA SENTENCIA REAL',
    arenaSubtitle: 'PATÍBULO MAYOR DEL INQUISIDOR',
    floorSealColor: '#E11D48',
    altarAccentColor: '#94A3B8',
    centerpieceKind: 'GUILLOTINE_SCAFFOLD',
  },
  bosque_de_los_susurros: {
    dungeonId: 'bosque_de_los_susurros',
    arenaTitle: 'CLARO DE LA CORONA NEGRA',
    arenaSubtitle: 'MENHIR DE LAS RAÍCES SUSURRANTES',
    floorSealColor: '#34D399',
    altarAccentColor: '#A78BFA',
    centerpieceKind: 'BLACK_ROOT_MENHIR',
  },
  alcantarillas_imperiales: {
    dungeonId: 'alcantarillas_imperiales',
    arenaTitle: 'COLECTOR DEL REY DE LAS RATAS',
    arenaSubtitle: 'CISTERNA CENTRAL DE PESTE Y ALQUIMIA',
    floorSealColor: '#84CC16',
    altarAccentColor: '#FACC15',
    centerpieceKind: 'PLAGUE_SLUICE_CAULDRON',
  },
  biblioteca_prohibida: {
    dungeonId: 'biblioteca_prohibida',
    arenaTitle: 'ATRIO DEL SILENCIO SELLADO',
    arenaSubtitle: 'BÓVEDA DE LOS NOMBRES PROHIBIDOS',
    floorSealColor: '#A855F7',
    altarAccentColor: '#FBBF24',
    centerpieceKind: 'FORBIDDEN_CHANDELIER_PODIUM',
  },
  torre_del_astrologo: {
    dungeonId: 'torre_del_astrologo',
    arenaTitle: 'PLANETARIO DEL CENIT ETERNO',
    arenaSubtitle: 'CÚPULA ASTRAL DE LAS ESFERAS',
    floorSealColor: '#60A5FA',
    altarAccentColor: '#FDE047',
    centerpieceKind: 'CELESTIAL_ORRERY_RING',
  },
  la_colmena: {
    dungeonId: 'la_colmena',
    arenaTitle: 'CÁMARA DE LA REINA PROGENIE',
    arenaSubtitle: 'NIDO REAL DE ÁMBAR Y QUITINA',
    floorSealColor: '#F59E0B',
    altarAccentColor: '#84CC16',
    centerpieceKind: 'ROYAL_BROOD_CHAMBER',
  },
  cripta_de_cristal: {
    dungeonId: 'cripta_de_cristal',
    arenaTitle: 'SANTUARIO DE LA GEODA MADRE',
    arenaSubtitle: 'CORAZÓN DE REFRACCIÓN PRISMÁTICA',
    floorSealColor: '#22D3EE',
    altarAccentColor: '#E879F9',
    centerpieceKind: 'PRISMATIC_GEODE_SANCTUM',
  },
  prision_maldita: {
    dungeonId: 'prision_maldita',
    arenaTitle: 'TRIBUNAL DEL JUEZ DE CADENAS',
    arenaSubtitle: 'ROTONDA DE LAS JAULAS COLGANTES',
    floorSealColor: '#38BDF8',
    altarAccentColor: '#F97316',
    centerpieceKind: 'HANGING_TORTURE_CAGES',
  },
  santuario_de_sangre: {
    dungeonId: 'santuario_de_sangre',
    arenaTitle: 'ALTAR DEL CÁLIZ DESBORDANTE',
    arenaSubtitle: 'PRESBITERIO CARMESÍ DE LA SANGRE REAL',
    floorSealColor: '#F43F5E',
    altarAccentColor: '#FBBF24',
    centerpieceKind: 'OVERFLOWING_BLOOD_CHALICE',
  },
  ciudad_sepultada: {
    dungeonId: 'ciudad_sepultada',
    arenaTitle: 'MAUSOLEO DEL FARAÓN SIN SOL',
    arenaSubtitle: 'OBELISCO DORADO BAJO LAS DUNAS',
    floorSealColor: '#F59E0B',
    altarAccentColor: '#38BDF8',
    centerpieceKind: 'SUNLESS_PHARAOH_DAIS',
  },
  palacio_de_los_espejos: {
    dungeonId: 'palacio_de_los_espejos',
    arenaTitle: 'GRAN SALÓN DE LOS MIL REFLEJOS',
    arenaSubtitle: 'TRONO DE AZOGUE DEL MONARCA ILUSORIO',
    floorSealColor: '#E2E8F0',
    altarAccentColor: '#C084FC',
    centerpieceKind: 'GRAND_SHATTERED_MIRROR',
  },
  cavernas_heladas: {
    dungeonId: 'cavernas_heladas',
    arenaTitle: 'TRONO DEL GLACIAR ETERNO',
    arenaSubtitle: 'SANTUARIO CONGELADO DEL JOTUNN',
    floorSealColor: '#38BDF8',
    altarAccentColor: '#E0F2FE',
    centerpieceKind: 'GLACIAL_ICE_MONOLITH',
  },
  fortaleza_goblin: {
    dungeonId: 'fortaleza_goblin',
    arenaTitle: ' ARENA DEL CAUDILLO DE HIERRO',
    arenaSubtitle: 'BASTIÓN DE PÓLVORA Y TROFEOS',
    floorSealColor: '#F97316',
    altarAccentColor: '#84CC16',
    centerpieceKind: 'GOBLIN_WAR_PALISADE',
  },
  cementerio_de_gigantes: {
    dungeonId: 'cementerio_de_gigantes',
    arenaTitle: 'SEPULCRO DEL REY DEL OSARIO',
    arenaSubtitle: 'BÓVEDA CRANEAL DE LOS TITANES ANTIGUOS',
    floorSealColor: '#A3E635',
    altarAccentColor: '#E2E8F0',
    centerpieceKind: 'TITAN_SKULL_MAUSOLEUM',
  },
  el_abismo: {
    dungeonId: 'el_abismo',
    arenaTitle: 'TRONO DEL ECLIPSE ABISAL',
    arenaSubtitle: 'NÚCLEO LATENTE DEL CORAZÓN DE LA CRIPTA',
    floorSealColor: '#C084FC',
    altarAccentColor: '#F43F5E',
    centerpieceKind: 'ABYSSAL_ECLIPSE_CORE',
  },
};

const W_BLUNT_HOLY: CriptaEnemyTraitEntry[] = [
  { id: 'CONTUNDENTE', label: 'CONTUNDENTE', modifierText: '+25% daño', multiplierDelta: 0.25, iconKind: 'blunt' },
  { id: 'SAGRADO', label: 'SAGRADO', modifierText: '+20% daño', multiplierDelta: 0.2, iconKind: 'holy' },
];
const R_PIERCE_POISON: CriptaEnemyTraitEntry[] = [
  { id: 'PERFORANTE', label: 'PERFORANTE', modifierText: '-20% daño', multiplierDelta: -0.2, iconKind: 'pierce' },
  { id: 'VENENO', label: 'VENENO', modifierText: 'Resistente (-25%)', multiplierDelta: -0.25, iconKind: 'poison' },
];

const W_HOLY_ARCANE: CriptaEnemyTraitEntry[] = [
  { id: 'SAGRADO', label: 'SAGRADO', modifierText: '+25% daño', multiplierDelta: 0.25, iconKind: 'holy' },
  { id: 'MAGICO', label: 'ARCANO', modifierText: '+20% daño', multiplierDelta: 0.2, iconKind: 'arcane' },
];
const R_SLASH: CriptaEnemyTraitEntry[] = [
  { id: 'FISICO', label: 'CORTE FÍSICO', modifierText: '-20% daño', multiplierDelta: -0.2, iconKind: 'slash' },
];

const W_ALCHEMY_SLASH: CriptaEnemyTraitEntry[] = [
  { id: 'ALQUIMICO', label: 'FUEGO / ALQUIMIA', modifierText: '+25% daño', multiplierDelta: 0.25, iconKind: 'alchemy' },
  { id: 'FISICO', label: 'TAJO AFILADO', modifierText: '+15% daño', multiplierDelta: 0.15, iconKind: 'slash' },
];
const R_POISON: CriptaEnemyTraitEntry[] = [
  { id: 'VENENO', label: 'VENENO', modifierText: 'Resistente (-25%)', multiplierDelta: -0.25, iconKind: 'poison' },
];

const W_BLUNT_ARCANE: CriptaEnemyTraitEntry[] = [
  { id: 'CONTUNDENTE', label: 'CONTUNDENTE / PICO', modifierText: '+25% daño', multiplierDelta: 0.25, iconKind: 'blunt' },
  { id: 'MAGICO', label: 'ARCANO', modifierText: '+20% daño', multiplierDelta: 0.2, iconKind: 'arcane' },
];
const R_PIERCE_SLASH: CriptaEnemyTraitEntry[] = [
  { id: 'PERFORANTE', label: 'FLECHAS / DAGAS', modifierText: '-25% daño', multiplierDelta: -0.25, iconKind: 'pierce' },
  { id: 'FISICO', label: 'CORTE LIGERO', modifierText: '-15% daño', multiplierDelta: -0.15, iconKind: 'slash' },
];

const W_PIERCE_SLASH: CriptaEnemyTraitEntry[] = [
  { id: 'PERFORANTE', label: 'PERFORANTE', modifierText: '+20% daño', multiplierDelta: 0.2, iconKind: 'pierce' },
  { id: 'FISICO', label: 'ACERO', modifierText: '+15% daño', multiplierDelta: 0.15, iconKind: 'slash' },
];
const R_ARCANE: CriptaEnemyTraitEntry[] = [
  { id: 'MAGICO', label: 'SOMBRA / ARCANO', modifierText: '-15% daño', multiplierDelta: -0.15, iconKind: 'arcane' },
];

type CompactEntrySpec = [
  slug: string,
  id: CriptaUniqueCreatureModelId,
  name: string,
  title: string,
  tier: CriptaCreatureVisualBlueprint['tier'],
  roleTag: CriptaCreatureVisualBlueprint['roleTag'],
  silhouetteType: CriptaCreatureVisualBlueprint['silhouetteType'],
  primary: string,
  secondary: string,
  highlight: string,
  eyeGlow: string,
  idleCadence: CriptaCreatureVisualBlueprint['idleCadence'],
  signatureMoveName: string,
  statusThreat: CriptaStatusEffectType | undefined,
  traitGroup: 'UNDEAD' | 'SPECTRAL' | 'ORGANIC' | 'CONSTRUCT' | 'HUMANOID'
];

const DUNGEON_CREATURE_SPECS: Record<CriptaDungeonId, CompactEntrySpec[]> = {
  catacumbas_del_rey: [
    ['guardian_de_la_cripta', 'CATACUMBAS_GUARDIAN_CRIPTAS', 'Guardián de la Cripta', 'Alabardero del Sepulcro Real', 'NORMAL', 'TANK', 'SKELETAL_SPEAR_GUARD', '#D8C6A0', '#334155', '#5CE6A0', '#5CE6A0', 'MARCH_GUARD', 'Estocada de Osario', 'BLEED', 'UNDEAD'],
    ['acolito_de_hueso', 'CATACUMBAS_ACOLITO_HUESO', 'Acólito de Hueso', 'Chamán de las Catacumbas', 'NORMAL', 'HEALER', 'BONE_TOTEM_SHAMAN', '#CBD5E1', '#4C1D95', '#A78BFA', '#34D399', 'RITUAL_PULSE', 'Plegaria de Médula', 'CURSE', 'UNDEAD'],
    ['espectro_de_ceniza', 'CATACUMBAS_ESPECTRO_CENIZA', 'Espectro de Ceniza', 'Ánima del Mausoleo', 'NORMAL', 'CASTER', 'FLOATING_ASH_WRAITH', '#64748B', '#1E293B', '#38BDF8', '#7DD3FC', 'FLOAT_SWAY', 'Velo de Sudario', 'FEAR', 'SPECTRAL'],
    ['enjambre_sepulcral', 'CATACUMBAS_ ENJAMBRE_SEPULCRAL', 'Enjambre Sepulcral', 'Escarabajos Devoradores de Tumbas', 'NORMAL', 'SWARM', 'CRYPT_SCARAB_SWARM', '#475569', '#0F172A', '#34D399', '#A3E635', 'SCUTTLE_TWITCH', 'Nube Necrófaga', 'POISON', 'ORGANIC'],
    ['caballero_tumular', 'CATACUMBAS_CABALLERO_TUMULAR', 'Caballero Tumular', 'Paladín Caído de la Guardia', 'ELITE', 'TANK', 'TOMB_GREATSHIELD_KNIGHT', '#94A3B8', '#1E293B', '#F59E0B', '#38BDF8', 'HEAVY_BREATH', 'Muro del Mausoleo', 'WEAKENED', 'UNDEAD'],
    ['cantor_funebre', 'CATACUMBAS_CANTOR_FUNEBRE', 'Cantor Fúnebre', 'Heraldo de la Campana Negra', 'ELITE', 'SUPPORT', 'BELL_DIRGE_CHANTER', '#A8A29E', '#31102F', '#E879F9', '#5CE6A0', 'RITUAL_PULSE', 'Réquiem de Bronce', 'CURSE', 'SPECTRAL'],
    ['senor_del_osario', 'CATACUMBAS_SENOR_OSARIO', 'Señor del Osario', 'Guardián del Trono de Cráneos', 'MINIBOSS', 'BOSS', 'OSSUARY_THRONE_LORD', '#E2E8F0', '#3B0764', '#FFD166', '#5CE6A0', 'HEAVY_BREATH', 'Decreto de la Fosa Real', 'CURSE', 'UNDEAD'],
    ['regente_insepulto', 'CATACUMBAS_REGENTE_INSEPULTO', 'Regente Insepulto', 'Monarca de la Corona Quebrada', 'MINIBOSS', 'BOSS', 'CROWNED_LICH_REGENT', '#DDD6FE', '#1E1B4B', '#FBBF24', '#34D399', 'RITUAL_PULSE', 'Cetro de los Cien Reyes', 'FEAR', 'UNDEAD'],
  ],
  jardin_podrido: [
    ['hongo_errante', 'JARDIN_HONGO_ERRANTE', 'Hongo Errante', 'Portador de Sombrero Tóxico', 'NORMAL', 'BRUTE', 'WALKING_MYCELIUM_SHROOM', '#7E22CE', '#14532D', '#B8FF66', '#BEF264', 'HEAVY_BREATH', 'Nube de Esporas', 'POISON', 'ORGANIC'],
    ['larva_putrefacta', 'JARDIN_LARVA_PUTREFACTA', 'Larva Putrefacta', 'Gusano Hinchado de Savia', 'NORMAL', 'TANK', 'BLOATED_ROT_GRUB', '#65A30D', '#365314', '#D9F99D', '#FACC15', 'SCUTTLE_TWITCH', 'Regurgitación Ácida', 'POISON', 'ORGANIC'],
    ['trepadora_espinosa', 'JARDIN_TREPADORA_ESPINOSA', 'Trepadora Espinosa', 'Enredadera Carnívora', 'NORMAL', 'ASSASSIN', 'THORN_LASHER_VINE', '#15803D', '#3F6212', '#F43F5E', '#FB7185', 'PREDATOR_CROUCH', 'Latigazo de Zarza', 'BLEED', 'ORGANIC'],
    ['mosca_carronera', 'JARDIN_MOSCA_CARRONERA', 'Mosca Carroñera', 'Zumbador de Néctar Pútrido', 'NORMAL', 'SWARM', 'CARRION_BLIGHT_FLY', '#4D7C0F', '#1E293B', '#A3E635', '#F97316', 'FLOAT_SWAY', 'Picadura Séptica', 'WEAKENED', 'ORGANIC'],
    ['coloso_de_micelio', 'JARDIN_COLOSO_MICELIO', 'Coloso de Micelio', 'Gigante de Corteza y Hongos', 'ELITE', 'TANK', 'SPORE_HULK_COLOSSUS', '#3F6212', '#581C87', '#84CC16', '#BEF264', 'HEAVY_BREATH', 'Aplastamiento Fúngico', 'POISON', 'ORGANIC'],
    ['dama_de_las_esporas', 'JARDIN_ DAMA_ESPORAS', 'Dama de las Esporas', 'Sacerdotisa del Velo Verde', 'ELITE', 'HEALER', 'FUNGAL_VEIL_MATRON', '#86198F', '#14532D', '#F0ABFC', '#B8FF66', 'RITUAL_PULSE', 'Polen Regenerador', 'CONFUSION', 'ORGANIC'],
    ['corazon_putrido', 'JARDIN_CORAZON_PUTRIDO', 'Corazón Pútrido', 'Núcleo Latente del Jardín', 'MINIBOSS', 'BOSS', 'PULSING_ROT_HEART', '#4D7C0F', '#701A75', '#B8FF66', '#F43F5E', 'RITUAL_PULSE', 'Floración Pestilente', 'POISON', 'ORGANIC'],
    ['matriarca_fungica', 'JARDIN_MATRIARCA_FUNGICA', 'Matriarca Fúngica', 'Soberana del Invernadero Negro', 'MINIBOSS', 'BOSS', 'EMPRESS_MYCELIA', '#6B21A8', '#166534', '#D9F99D', '#A3E635', 'FLOAT_SWAY', 'Marea de Micelio Real', 'POISON', 'ORGANIC'],
  ],
  forja_infernal: [
    ['automata_de_escoria', 'FORJA_AUTOMA_ESCORIA', 'Autómata de Escoria', 'Gólem de Pistones Incandescentes', 'NORMAL', 'TANK', 'SLAG_PISTON_AUTOMATON', '#57534E', '#7C2D12', '#F97316', '#FDE047', 'MARCH_GUARD', 'Prensa de Vapor', 'BURN', 'CONSTRUCT'],
    ['herrero_de_ceniza', 'FORJA_HERRERO_CENIZA', 'Herrero de Ceniza', 'Artesano Encadenado al Yunque', 'NORMAL', 'BRUTE', 'ASH_ANVIL_BLACKSMITH', '#78350F', '#292524', '#FB923C', '#FBBF24', 'HEAVY_BREATH', 'Martillazo al Rojo Vivo', 'BURN', 'HUMANOID'],
    ['salamandra_de_crisol', 'FORJA_SALAMANDRA_CRISOL', 'Salamandra de Crisol', 'Reptil de Magma Fundido', 'NORMAL', 'ASSASSIN', 'MOLTEN_CRUCIBLE_NEWT', '#EA580C', '#7F1D1D', '#FDE047', '#FEF08A', 'PREDATOR_CROUCH', 'Escupitajo de Escoria', 'BURN', 'ORGANIC'],
    ['martillo_viviente', 'FORJA_MARTILLO_VIVIENTE', 'Martillo Viviente', 'Arma Rúnica Animada', 'NORMAL', 'CASTER', 'ANIMATED_RUNE_HAMMER', '#94A3B8', '#9A3412', '#FBBF24', '#38BDF8', 'FLOAT_SWAY', 'Chispa Rompeescudos', 'WEAKENED', 'CONSTRUCT'],
    ['centurion_piroclasto', 'FORJA_CENTURION_PIROCLASTO', 'Centurión Piroclasto', 'Guardia de Placas Volcánicas', 'ELITE', 'TANK', 'PYROCLAST_CENTURION', '#44403C', '#991B1B', '#F97316', '#FDE047', 'MARCH_GUARD', 'Falange de Brasas', 'BURN', 'CONSTRUCT'],
    ['yunque_animado', 'FORJA_ YUNQUE_ANIMADO', 'Yunque Animado', 'Relicario de Hierro Forjado', 'ELITE', 'SUPPORT', 'LIVING_FURNACE_ANVIL', '#334155', '#7C2D12', '#FBBF24', '#FB923C', 'RITUAL_PULSE', 'Temple de Blindaje', 'BURN', 'CONSTRUCT'],
    ['titan_del_crisol', 'FORJA_TITAN_CRISOL', 'Titán del Crisol', 'Coloso de los Hornos Reales', 'MINIBOSS', 'BOSS', 'CRUCIBLE_MAGMA_TITAN', '#7C2D12', '#1C1917', '#FDE047', '#FF5926', 'HEAVY_BREATH', 'Erupción de la Fundición', 'BURN', 'CONSTRUCT'],
    ['senor_de_la_fundicion', 'FORJA_SENOR_FUNDICION', 'Señor de la Fundición', 'Maestro Forjador de Cadenas', 'MINIBOSS', 'BOSS', 'FOUNDRY_OVERLORD', '#9A3412', '#27272A', '#FBBF24', '#F97316', 'HEAVY_BREATH', 'Sentencia del Yunque Mayor', 'BURN', 'CONSTRUCT'],
  ],
  templo_sumergido: [
    ['acolito_abisal', 'TEMPLO_ACOLITO_ABISAL', 'Acólito Abisal', 'Sacerdote de Branquias Azules', 'NORMAL', 'CASTER', 'ABYSSAL_GILL_ACOLYTE', '#0284C7', '#0F172A', '#2DD4BF', '#7DD3FC', 'RITUAL_PULSE', 'Salmo de la Resaca', 'FROST', 'HUMANOID'],
    ['anguila_de_la_sima', 'TEMPLO_ANGUILA_SIMA', 'Anguila de la Sima', 'Depredador Bioluminiscente', 'NORMAL', 'ASSASSIN', 'TRENCH_SHOCK_EEL', '#0D9488', '#082F49', '#67E8F9', '#FDE047', 'PREDATOR_CROUCH', 'Mordisco Abisal', 'BLEED', 'ORGANIC'],
    ['guardian_de_coral', 'TEMPLO_GUARDIAN_CORAL', 'Guardián de Coral', 'Coloso Incrustado de Percebes', 'NORMAL', 'TANK', 'BARNACLE_CORAL_SENTINEL', '#155E75', '#334155', '#FB7185', '#38BDF8', 'HEAVY_BREATH', 'Muro de Arrecife', 'WEAKENED', 'CONSTRUCT'],
    ['cantor_de_mareas', 'TEMPLO_CANTOR_MAREAS', 'Cantor de Mareas', 'Sirena del Caracol Hundido', 'NORMAL', 'HEALER', 'TIDAL_CONCH_SIREN', '#0369A1', '#1E1B4B', '#5EEAD4', '#A5F3FC', 'FLOAT_SWAY', 'Arrullo de Salmuera', 'CONFUSION', 'HUMANOID'],
    ['caballero_ahogado', 'TEMPLO_CABALLERO_AHOGADO', 'Caballero Ahogado', 'Portador del Ancla Oxidada', 'ELITE', 'BRUTE', 'ANCHOR_DROWNED_TEMPLAR', '#1E3A8A', '#0F172A', '#38BDF8', '#2DD4BF', 'MARCH_GUARD', 'Golpe de Ancla Real', 'FROST', 'UNDEAD'],
    ['hidra_de_salmuera', 'TEMPLO_HIDRA_SALMUERA', 'Hidra de Salmuera', 'Bestia Bicéfala del Canal', 'ELITE', 'BRUTE', 'BRINE_TWO_HEAD_HYDRA', '#0F766E', '#083344', '#2DD4BF', '#F43F5E', 'PREDATOR_CROUCH', 'Doble Fauce Marina', 'POISON', 'ORGANIC'],
    ['oraculo_de_las_profundidades', 'TEMPLO_ORACULO_PROFUNDIDADES', 'Oráculo de las Profundidades', 'Vidente de la Perla Negra', 'MINIBOSS', 'BOSS', 'ABYSSAL_PEARL_ORACLE', '#0369A1', '#172554', '#67E8F9', '#FDE047', 'FLOAT_SWAY', 'Marea del Eclipse Hundido', 'CURSE', 'SPECTRAL'],
    ['leviatan_del_altar', 'TEMPLO_LEVIATAN_ALTAR', 'Leviatán del Altar', 'Serpiente Soberana del Templo', 'MINIBOSS', 'BOSS', 'ALTAR_LEVIATHAN_COIL', '#0E7490', '#042F2E', '#2DD4BF', '#38BDF8', 'HEAVY_BREATH', 'Vorágine de la Fosa', 'FROST', 'ORGANIC'],
  ],
  minas_abandonadas: [
    ['minero_descascarado', 'MINAS_MINERO_DESCASCARADO', 'Minero Descascarado', 'Excavador Poseído por la Veta', 'NORMAL', 'BRUTE', 'HUSK_PICKAXE_MINER', '#A16207', '#292524', '#FBBF24', '#38BDF8', 'MARCH_GUARD', 'Picotazo de Galería', 'BLEED', 'UNDEAD'],
    ['aranuelo_de_filon', 'MINAS_ARANUELO_FILON', 'Arañuelo de Filón', 'Arácnido con Dorso de Cuarzo', 'NORMAL', 'ASSASSIN', 'VEIN_CRYSTAL_SPIDER', '#57534E', '#1C1917', '#38BDF8', '#F59E0B', 'SCUTTLE_TWITCH', 'Colmillo Cristalino', 'POISON', 'ORGANIC'],
    ['murcielago_sonico', 'MINAS_MURCIELAGO_SONICO', 'Murciélago Sónico', 'Quiróptero Ciego de Pozo', 'NORMAL', 'SWARM', 'SONIC_CAVE_WYRM_BAT', '#44403C', '#1E1B4B', '#A78BFA', '#F43F5E', 'FLOAT_SWAY', 'Chillido de Derrumbe', 'CONFUSION', 'ORGANIC'],
    ['excavador_ciego', 'MINAS_EXCAVADOR_CIEGO', 'Excavador Ciego', 'Bestia Topo de Garras Férreas', 'NORMAL', 'TANK', 'BLIND_MOLE_CLAW_DIGGER', '#78350F', '#44403C', '#D6D3D1', '#FBBF24', 'PREDATOR_CROUCH', 'Desgarro Subterráneo', 'BLEED', 'ORGANIC'],
    ['capataz_del_grisu', 'MINAS_CAPATAZ_GRISU', 'Capataz del Grisú', 'Portador del Farol Explosivo', 'ELITE', 'CASTER', 'FIREDAMP_LANTERN_FOREMAN', '#92400E', '#1E293B', '#F97316', '#FDE047', 'HEAVY_BREATH', 'Ignición de Grisú', 'BURN', 'UNDEAD'],
    ['golem_de_pirita', 'MINAS_GOLEM_ pirita', 'Gólem de Pirita', 'Coloso de Roca y Oro Falso', 'ELITE', 'TANK', 'PYRITE_CRAG_GOLEM', '#78716C', '#422006', '#FACC15', '#38BDF8', 'HEAVY_BREATH', 'Temblor de Galería', 'WEAKENED', 'CONSTRUCT'],
    ['devorador_de_vetas', 'MINAS_DEVORADOR_VETAS', 'Devorador de Vetas', 'Gusano Acorazado Tragapiedras', 'MINIBOSS', 'BOSS', 'SEAM_WORM_DEVOURER', '#854D0E', '#292524', '#FDE047', '#F97316', 'SCUTTLE_TWITCH', 'Fauces Trituradoras', 'BLEED', 'ORGANIC'],
    ['perforador_profundo', 'MINAS_PERFORADOR_PROFUNDO', 'Perforador Profundo', 'Autómata Taladrador del Pozo Madre', 'MINIBOSS', 'BOSS', 'DRILL_JUGGERNAUT_BOSS', '#57534E', '#78350F', '#F59E0B', '#38BDF8', 'MARCH_GUARD', 'Taladro Sísmico Imperial', 'WEAKENED', 'CONSTRUCT'],
  ],
  castillo_del_verdugo: [
    ['carcelero_real', 'VERDUGO_CARCELERO_REAL', 'Carcelero Real', 'Guardián del Manojo de Llaves', 'NORMAL', 'TANK', 'KEYRING_DUNGEON_JAILER', '#475569', '#1E293B', '#E11D48', '#FBBF24', 'MARCH_GUARD', 'Golpe de Grillete', 'WEAKENED', 'HUMANOID'],
    ['sabueso_de_cadenas', 'VERDUGO_SABUESO_CADENAS', 'Sabueso de Cadenas', 'Mastín Acorazado de Caza', 'NORMAL', 'ASSASSIN', 'SPIKED_CHAIN_MASTIFF', '#334155', '#450A0A', '#F43F5E', '#FB7185', 'PREDATOR_CROUCH', 'Dentellada al Cuello', 'BLEED', 'ORGANIC'],
    ['penitente_de_hierro', 'VERDUGO_PENITENTE_HIERRO', 'Penitente de Hierro', 'Reo con Yelmo-Jaula', 'NORMAL', 'BRUTE', 'IRON_CAGE_PENITENT', '#64748B', '#27272A', '#CBD5E1', '#E11D48', 'HEAVY_BREATH', 'Embestida Ciega', 'BLEED', 'HUMANOID'],
    ['cuervo_de_patibulo', 'VERDUGO_CUERVO_PATIBULO', 'Cuervo de Patíbulo', 'Ave Gigante Picoteadora', 'NORMAL', 'SWARM', 'GALLOWS_CARRION_CROW', '#1E293B', '#0F172A', '#94A3B8', '#F43F5E', 'FLOAT_SWAY', 'Picotazo de Horca', 'MARKED', 'ORGANIC'],
    ['inquisidor_escarlata', 'VERDUGO_INQUISIDOR_ESCARLATA', 'Inquisidor Escarlata', 'Juez del Hierro Candente', 'ELITE', 'CASTER', 'SCARLET_BRAND_INQUISITOR', '#9F1239', '#1E293B', '#FBBF24', '#FDE047', 'RITUAL_PULSE', 'Marca de Herejía', 'BURN', 'HUMANOID'],
    ['doncella_de_espigas', 'VERDUGO_DONCELLA_ESPIGAS', 'Doncella de Espigas', 'Sarcófago de Tortura Viviente', 'ELITE', 'TANK', 'IRON_MAIDEN_CONSTRUCT', '#475569', '#4C0519', '#F43F5E', '#E11D48', 'HEAVY_BREATH', 'Abrazo de Púas', 'BLEED', 'CONSTRUCT'],
    ['el_gran_verdugo', 'VERDUGO_GRAN_VERDUGO', 'El Gran Verdugo', 'Ejecutor Mayor de la Corona', 'MINIBOSS', 'BOSS', 'GRAND_HOODED_EXECUTIONER', '#881337', '#18181B', '#E2E8F0', '#F43F5E', 'HEAVY_BREATH', 'Tajo de Decapitación', 'BLEED', 'HUMANOID'],
    ['senor_del_cadalso', 'VERDUGO_SENOR_CADALSO', 'Señor del Cadalso', 'Guardián de la Guillotina Real', 'MINIBOSS', 'BOSS', 'SCAFFOLD_GUILLOTINE_LORD', '#334155', '#7F1D1D', '#FBBF24', '#E11D48', 'MARCH_GUARD', 'Caída de la Cuchilla', 'BLEED', 'HUMANOID'],
  ],
  bosque_de_los_susurros: [
    ['ciervo_de_osamenta', 'BOSQUE_CIERVO_OSAMENTA', 'Ciervo de Osamenta', 'Venado con Cráneo y Astas Rúnicas', 'NORMAL', 'BRUTE', 'ANTLER_SKULL_STAG', '#D6D3D1', '#14532D', '#34D399', '#6EE7B7', 'PREDATOR_CROUCH', 'Cornada Espectral', 'BLEED', 'UNDEAD'],
    ['sombra_de_las_ramas', 'BOSQUE_SOMBRA_RAMAS', 'Sombra de las Ramas', 'Acechador Arbóreo de Garras Largas', 'NORMAL', 'ASSASSIN', 'BRANCH_CLAW_LURKER', '#1E293B', '#064E3B', '#A78BFA', '#34D399', 'PREDATOR_CROUCH', 'Zarpazo Silencioso', 'FEAR', 'SPECTRAL'],
    ['lobo_de_niebla', 'BOSQUE_LOBO_NIEBLA', 'Lobo de Niebla', 'Huargo Fantasmal del Claro', 'NORMAL', 'ASSASSIN', 'MIST_HOWLER_WOLF', '#64748B', '#0F172A', '#6EE7B7', '#38BDF8', 'PREDATOR_CROUCH', 'Aullido Desorientador', 'WEAKENED', 'ORGANIC'],
    ['fuego_fatuo', 'BOSQUE_FUEGO_FATUO', 'Fuego Fatuo', 'Linterna de Almas Extraviadas', 'NORMAL', 'CASTER', 'LANTERN_WISP_CLUSTER', '#10B981', '#312E81', '#A7F3D0', '#FDE047', 'FLOAT_SWAY', 'Destello Hipnótico', 'CONFUSION', 'SPECTRAL'],
    ['anciano_de_corteza', 'BOSQUE_ANCIANO_CORTEZA', 'Anciano de Corteza', 'Ent Hueco de Raíces Viejas', 'ELITE', 'TANK', 'HOLLOW_BARK_TREANT', '#3F6212', '#1C1917', '#34D399', '#A3E635', 'HEAVY_BREATH', 'Prisión de Raíces', 'WEAKENED', 'ORGANIC'],
    ['cazador_espectral', 'BOSQUE_CAZADOR_ESPECTRAL', 'Cazador Espectral', 'Arquero Fantasma del Bosque', 'ELITE', 'ASSASSIN', 'SPECTRAL_LONGBOW_HUNTER', '#047857', '#1E1B4B', '#6EE7B7', '#C084FC', 'MARCH_GUARD', 'Flecha Susurrante', 'MARKED', 'SPECTRAL'],
    ['espiritu_de_las_raices', 'BOSQUE_ESPIRITU_RAICES', 'Espíritu de las Raíces', 'Archidruida Consumido por el Bosque', 'MINIBOSS', 'BOSS', 'ROOT_HEART_ARCHDRUID', '#065F46', '#3B0764', '#34D399', '#A78BFA', 'RITUAL_PULSE', 'Maldición del Bosque Antiguo', 'CURSE', 'SPECTRAL'],
    ['venado_de_la_corona_negra', 'BOSQUE_VENADO_CORONA_NEGRA', 'Venado de la Corona Negra', 'Soberano Wendigo de la Espesura', 'MINIBOSS', 'BOSS', 'BLACK_CROWN_WENDIGO_STAG', '#E2E8F0', '#064E3B', '#A78BFA', '#34D399', 'HEAVY_BREATH', 'Embiste del Menhir Negro', 'FEAR', 'UNDEAD'],
  ],
  alcantarillas_imperiales: [
    ['rata_de_peste', 'ALCANTARILLAS_RATA_PESTE', 'Rata de Peste', 'Roedor Gigante de Colmillos Verdes', 'NORMAL', 'SWARM', 'PLAGUE_RAT_PACK', '#57534E', '#365314', '#84CC16', '#EF4444', 'SCUTTLE_TWITCH', 'Mordisco Infeccioso', 'POISON', 'ORGANIC'],
    ['limo_de_cloaca', 'ALCANTARILLAS_LIMO_CLOACA', 'Limo de Cloaca', 'Masa Gelatinosa con Cráneos Disueltos', 'NORMAL', 'TANK', 'TOXIC_GRATE_SLIME', '#65A30D', '#14532D', '#BEF264', '#FACC15', 'RITUAL_PULSE', 'Salpicadura Corrosiva', 'POISON', 'ORGANIC'],
    ['contrabandista_mutado', 'ALCANTARILLAS_CONTRABANDISTA_MUTADO', 'Contrabandista Mutado', 'Rufián con Brazo Tentacular', 'NORMAL', 'BRUTE', 'MUTATED_PIPE_SMUGGLER', '#475569', '#3F6212', '#A3E635', '#F97316', 'PREDATOR_CROUCH', 'Garfio Oxidado', 'BLEED', 'HUMANOID'],
    ['sanguijuela_de_canal', 'ALCANTARILLAS_SANGUIJUELA_CANAL', 'Sanguijuela de Canal', 'Parásito Anillado Chupasangre', 'NORMAL', 'HEALER', 'BLOATED_CANAL_LEECH', '#881337', '#1E293B', '#FB7185', '#84CC16', 'SCUTTLE_TWITCH', 'Succión Séptica', 'BLEED', 'ORGANIC'],
    ['abominacion_de_fango', 'ALCANTARILLAS_ABOMINACION_FANGO', 'Abominación de Fango', 'Mole de Lodo y Rejillas de Hierro', 'ELITE', 'TANK', 'SLUDGE_GRAFT_ABOMINATION', '#3F6212', '#27272A', '#84CC16', '#FACC15', 'HEAVY_BREATH', 'Avalancha de Desechos', 'POISON', 'ORGANIC'],
    ['alquimista_de_los_desagues', 'ALCANTARILLAS_ALQUIMISTA_DESAGUES', 'Alquimista de los Desagües', 'Boticario con Máscara de Pico', 'ELITE', 'CASTER', 'SEWER_PLAGUE_APOTHECARY', '#365314', '#1E1B4B', '#BEF264', '#FACC15', 'RITUAL_PULSE', 'Matraz de Peste Verde', 'POISON', 'HUMANOID'],
    ['rey_de_las_ratas', 'ALCANTARILLAS_REY_RATAS', 'Rey de las Ratas', 'Monarca Entrelazado del Colector', 'MINIBOSS', 'BOSS', 'CROWNED_RAT_KING', '#78716C', '#3F6212', '#FACC15', '#84CC16', 'SCUTTLE_TWITCH', 'Decreto de la Plaga Imperial', 'POISON', 'ORGANIC'],
    ['hidra_de_residuos', 'ALCANTARILLAS_HIDRA_RESIDUOS', 'Hidra de Residuos', 'Bestia Tricéfala de la Cisterna', 'MINIBOSS', 'BOSS', 'EFFLUENT_THREE_NECK_HYDRA', '#4D7C0F', '#14532D', '#BEF264', '#F97316', 'HEAVY_BREATH', 'Triple Aliento Pestilente', 'POISON', 'ORGANIC'],
  ],
  biblioteca_prohibida: [
    ['grimorio_animado', 'BIBLIOTECA_GRIMORIO_ANIMADO', 'Grimorio Animado', 'Tomo Encuadernado con Colmillos', 'NORMAL', 'CASTER', 'TEETH_GRIMOIRE_MIMIC', '#7E22CE', '#451A03', '#FBBF24', '#E879F9', 'FLOAT_SWAY', 'Páginas Cortantes', 'BLEED', 'CONSTRUCT'],
    ['escriba_sin_rostro', 'BIBLIOTECA_ESCRIBA_SIN_ROSTRO', 'Escriba sin Rostro', 'Monje de Pluma Carmesí', 'NORMAL', 'SUPPORT', 'FACELESS_QUILL_SCRIBE', '#581C87', '#1E1B4B', '#C084FC', '#FDE047', 'RITUAL_PULSE', 'Glifo de Silencio', 'CURSE', 'HUMANOID'],
    ['polilla_de_pergamino', 'BIBLIOTECA_POLILLA_PERGAMINO', 'Polilla de Pergamino', 'Lepidóptero de Polvo Hipnótico', 'NORMAL', 'SWARM', 'PARCHMENT_SILK_MOTH', '#D6D3D1', '#581C87', '#E879F9', '#FBBF24', 'FLOAT_SWAY', 'Polvo del Olvido', 'CONFUSION', 'ORGANIC'],
    ['custodio_de_tinta', 'BIBLIOTECA_CUSTODIO_TINTA', 'Custodio de Tinta', 'Elemental de Tinta Negra y Sellos', 'NORMAL', 'TANK', 'INK_TENDRIL_CUSTODIAN', '#1E1B4B', '#3B0764', '#A855F7', '#38BDF8', 'RITUAL_PULSE', 'Mancha Abisal', 'WEAKENED', 'SPECTRAL'],
    ['archivero_sellado', 'BIBLIOTECA_ARCHIVERO_SELLADO', 'Archivero Sellado', 'Sabio Atado a Cadenas y Candados', 'ELITE', 'CASTER', 'CHAINED_ARCHIVE_KEEPER', '#6B21A8', '#334155', '#FBBF24', '#C084FC', 'FLOAT_SWAY', 'Anatema del Índice', 'CURSE', 'SPECTRAL'],
    ['estatua_lectora', 'BIBLIOTECA_ESTATUA_LECTORA', 'Estatua Lectora', 'Gárgola de Mármol con Atril', 'ELITE', 'TANK', 'GARGOYLE_LECTERN_STATUE', '#64748B', '#312E81', '#E2E8F0', '#A855F7', 'HEAVY_BREATH', 'Sentencia de Piedra', 'WEAKENED', 'CONSTRUCT'],
    ['censor_del_silencio', 'BIBLIOTECA_CENSOR_SILENCIO', 'Censor del Silencio', 'Inquisidor de la Campana Muda', 'MINIBOSS', 'BOSS', 'SILENCE_BELL_CENSOR', '#4C1D95', '#1E1B4B', '#FBBF24', '#E879F9', 'RITUAL_PULSE', 'Edicto de Mudez Eterna', 'CURSE', 'SPECTRAL'],
    ['devorador_de_nombres', 'BIBLIOTECA_DEVORADOR_NOMBRES', 'Devorador de Nombres', 'Entidad de los Códices Prohibidos', 'MINIBOSS', 'BOSS', 'VOID_TOME_NAME_EATER', '#3B0764', '#0F172A', '#E879F9', '#FDE047', 'FLOAT_SWAY', 'Borrado de la Existencia', 'CONFUSION', 'SPECTRAL'],
  ],
  torre_del_astrologo: [
    ['acolito_del_zodiaco', 'ASTROLOGO_ACOLITO_ZODIACO', 'Acólito del Eclipse', 'Ocultista Acorazado del Sol Negro', 'NORMAL', 'TANK', 'ZODIAC_STARMAP_ACOLYTE', '#1E3A8A', '#0F172A', '#F59E0B', '#38BDF8', 'HEAVY_BREATH', 'Impacto del Sol Negro', 'WEAKENED', 'CONSTRUCT'],
    ['esfera_armilar', 'ASTROLOGO_ESFERA_ARMILAR', 'Esfera Armilar Chamán', 'Ocultista Armilar de las Estrellas', 'NORMAL', 'HEALER', 'BRASS_ARMILLARY_SPHERE', '#D97706', '#1E1B4B', '#FDE047', '#34D399', 'RITUAL_PULSE', 'Curación Oscura Astral', 'CURSE', 'CONSTRUCT'],
    ['homunculo_de_eter', 'ASTROLOGO_HOMUNCULO_ETER', 'Homúnculo de Éter', 'Alquimista en Matraz Astral', 'NORMAL', 'CASTER', 'AETHER_FLASK_HOMUNCULUS', '#38BDF8', '#312E81', '#A5F3FC', '#FDE047', 'FLOAT_SWAY', 'Destilado Sidéreo', 'POISON', 'CONSTRUCT'],
    ['centinela_de_cometa', 'ASTROLOGO_CENTINELA_COMETA', 'Centinela de Cometa', 'Autómata Alabardero Solar', 'NORMAL', 'BRUTE', 'COMET_HALBERD_SENTINEL', '#93C5FD', '#1E3A8A', '#FBBF24', '#60A5FA', 'MARCH_GUARD', 'Lanza Meteorito', 'BURN', 'CONSTRUCT'],
    ['tejedor_de_constelaciones', 'ASTROLOGO_TEJEDOR_CONSTELACIONES', 'Tejedor de Constelaciones', 'Controlador de Seis Brazos Celestes', 'ELITE', 'CASTER', 'CONSTELLATION_LOOM_WEAVER', '#2563EB', '#1E1B4B', '#FDE047', '#C084FC', 'RITUAL_PULSE', 'Hilo del Destino', 'MARKED', 'SPECTRAL'],
    ['guardian_del_eclipse', 'ASTROLOGO_GUARDIAN_ECLIPSE', 'Baluarte del Planisferio', 'Coloso Escudero del Sol Negro', 'ELITE', 'TANK', 'SOLAR_ECLIPSE_WARDEN', '#1E293B', '#1E3A8A', '#F59E0B', '#38BDF8', 'HEAVY_BREATH', 'Escudo de Penumbra', 'CURSE', 'CONSTRUCT'],
    ['arconte_del_cenit', 'ASTROLOGO_ARCONTE_CENIT', 'Arconte del Cenit', 'Soberano del Planetario Mayor', 'MINIBOSS', 'BOSS', 'ZENITH_ASTROLABLE_ARCHON', '#1D4ED8', '#0F172A', '#FDE047', '#38BDF8', 'FLOAT_SWAY', 'Juicio de las Siete Estrellas', 'BURN', 'SPECTRAL'],
    ['observador_del_infinito', 'ASTROLOGO_OBSERVADOR_INFINITO', 'Observador del Infinito', 'Ojo Astral de los Anillos Dorados', 'MINIBOSS', 'BOSS', 'INFINITE_OCULUS_OBSERVER', '#3B82F6', '#1E1B4B', '#FBBF24', '#F43F5E', 'FLOAT_SWAY', 'Mirada del Cosmos Vacío', 'CONFUSION', 'SPECTRAL'],
  ],
  la_colmena: [
    ['obrera_de_quitina', 'COLMENA_OBRERA_QUITINA', 'Obrera de Quitina', 'Mantis recolectora de Guadañas', 'NORMAL', 'ASSASSIN', 'CHITIN_SCYTHE_WORKER', '#D97706', '#3F6212', '#FDE047', '#84CC16', 'SCUTTLE_TWITCH', 'Doble Guadaña', 'BLEED', 'ORGANIC'],
    ['zangano_aguijon', 'COLMENA_ZANGANO_AGUIIJON', 'Zángano Aguijón', 'Avispa Acorazada del Nido', 'NORMAL', 'ASSASSIN', 'WASP_STINGER_DRONE', '#EAB308', '#1C1917', '#BEF264', '#EF4444', 'FLOAT_SWAY', 'Aguijón Venenoso', 'POISON', 'ORGANIC'],
    ['escarabajo_acido', 'COLMENA_ESCARABAJO_ACIDO', 'Escarabajo Ácido', 'Coleóptero Bombardeador de Resina', 'NORMAL', 'TANK', 'ACID_CARAPACE_BEETLE', '#4D7C0F', '#422006', '#A3E635', '#F97316', 'HEAVY_BREATH', 'Chorro Corrosivo', 'POISON', 'ORGANIC'],
    ['larva_incubadora', 'COLMENA_LARVA_INCUBADORA', 'Larva Incubadora', 'Saco Viviente de Jalea Real', 'NORMAL', 'HEALER', 'BROOD_SAC_LARVA', '#F59E0B', '#365314', '#FEF08A', '#84CC16', 'RITUAL_PULSE', 'Secreción Nutricia', 'WEAKENED', 'ORGANIC'],
    ['guardia_pretoriano', 'COLMENA_GUARDIA_PRETORIANO', 'Guardia Pretoriano', 'Coloso de Cuatro Brazos de Quitina', 'ELITE', 'BRUTE', 'MANTIS_PRAETORIAN_GUARD', '#B45309', '#14532D', '#FDE047', '#84CC16', 'MARCH_GUARD', 'Frenesí Mandibular', 'BLEED', 'ORGANIC'],
    ['tejedora_de_ambar', 'COLMENA_TEJEDORA_AMBAR', 'Tejedora de Ámbar', 'Arácnida Escupidora de Resina', 'ELITE', 'SUPPORT', 'AMBER_SILK_ARACHNID', '#D97706', '#292524', '#FBBF24', '#A3E635', 'SCUTTLE_TWITCH', 'Capullo de Ámbar', 'WEAKENED', 'ORGANIC'],
    ['reina_de_la_progenie', 'COLMENA_REINA_PROGENIE', 'Reina de la Progenie', 'Matriarca Coronada del Enjambre', 'MINIBOSS', 'BOSS', 'ROYAL_OVIPOSITOR_QUEEN', '#D97706', '#365314', '#FDE047', '#84CC16', 'RITUAL_PULSE', 'Orden Real del Enjambre', 'POISON', 'ORGANIC'],
    ['tirano_del_enjambre', 'COLMENA_TIRANO_ENJAMBRE', 'Tirano del Enjambre', 'Depredador Alado de Cuatro Alas', 'MINIBOSS', 'BOSS', 'FOUR_WING_SWARM_TYRANT', '#B45309', '#1C1917', '#BEF264', '#F97316', 'HEAVY_BREATH', 'Tormenta de Quitina', 'BLEED', 'ORGANIC'],
  ],
  cripta_de_cristal: [
    ['espectro_de_prisma', 'CRISTAL_ESPECTRO_PRISMA', 'Espectro de Prisma', 'Entidad de Luz Refractada', 'NORMAL', 'CASTER', 'PRISM_REFRACT_WRAITH', '#06B6D4', '#3B0764', '#E879F9', '#A5F3FC', 'FLOAT_SWAY', 'Haz Prismático', 'CONFUSION', 'SPECTRAL'],
    ['escorpion_de_cuarzo', 'CRISTAL_ESCORPION_CUARZO', 'Escorpión de Cuarzo', 'Arácnido con Cola de Amatista', 'NORMAL', 'ASSASSIN', 'QUARTZ_PINCER_SCORPION', '#A855F7', '#164E63', '#67E8F9', '#F43F5E', 'SCUTTLE_TWITCH', 'Aguijón Cristalino', 'BLEED', 'CONSTRUCT'],
    ['centinela_de_geoda', 'CRISTAL_CENTINELA_GEODA', 'Centinela de Geoda', 'Obelisco Viviente con Núcleo', 'NORMAL', 'TANK', 'GEODE_OBELISK_SENTINEL', '#0891B2', '#1E1B4B', '#22D3EE', '#E879F9', 'HEAVY_BREATH', 'Escudo de Facetas', 'WEAKENED', 'CONSTRUCT'],
    ['fragmento_resonante', 'CRISTAL_FRAGMENTO_RESONANTE', 'Fragmento Resonante', 'Enjambre de Esquirlas Flotantes', 'NORMAL', 'SWARM', 'RESONATING_SHARD_CLUSTER', '#67E8F9', '#4C1D95', '#F0ABFC', '#FEF08A', 'FLOAT_SWAY', 'Lluvia de Esquirlas', 'BLEED', 'CONSTRUCT'],
    ['caballero_de_diamante', 'CRISTAL_CABALLERO_DIAMANTE', 'Caballero de Diamante', 'Paladín de Coraza Irrompible', 'ELITE', 'TANK', 'DIAMOND_AEGIS_PALADIN', '#BAE6FD', '#0F172A', '#38BDF8', '#E879F9', 'MARCH_GUARD', 'Égida de Diamante', 'MARKED', 'CONSTRUCT'],
    ['cantor_de_refraccion', 'CRISTAL_CANTOR_REFRACCION', 'Cantor de Refracción', 'Sacerdote de Diapasones de Cuarzo', 'ELITE', 'HEALER', 'CHIME_CRYSTAL_CHANTER', '#C084FC', '#083344', '#67E8F9', '#FDE047', 'RITUAL_PULSE', 'Armonía Cristalina', 'CONFUSION', 'SPECTRAL'],
    ['coloso_prismatico', 'CRISTAL_COLOSO_PRISMATICO', 'Coloso Prismático', 'Titán de la Geoda Madre', 'MINIBOSS', 'BOSS', 'PRISMATIC_MONOLITH_COLOSSUS', '#06B6D4', '#4C1D95', '#F0ABFC', '#22D3EE', 'HEAVY_BREATH', 'Sobrecarga del Prisma Real', 'CONFUSION', 'CONSTRUCT'],
    ['serafin_de_cuarzo', 'CRISTAL_SERAFIN_CUARZO', 'Serafín de Cuarzo', 'Ángel Artificial de Seis Alas', 'MINIBOSS', 'BOSS', 'SIX_WING_QUARTZ_SERAPH', '#E0F2FE', '#3B0764', '#E879F9', '#38BDF8', 'FLOAT_SWAY', 'Juicio de las Mil Facetas', 'MARKED', 'CONSTRUCT'],
  ],
  prision_maldita: [
    ['reo_encadenado', 'PRISION_REO_ENCADENADO', 'Reo Encadenado', 'Condenado Arrastrando Bola de Hierro', 'NORMAL', 'BRUTE', 'SHACKLED_BALL_PRISONER', '#64748B', '#1E293B', '#38BDF8', '#F97316', 'HEAVY_BREATH', 'Lanzamiento de Grillete', 'WEAKENED', 'UNDEAD'],
    ['torturador_ciego', 'PRISION_TORTURADOR_CIEGO', 'Torturador Ciego', 'Verdugo con Tenazas al Rojo', 'NORMAL', 'ASSASSIN', 'BLINDFOLD_PINCER_TORTURER', '#475569', '#450A0A', '#F97316', '#FDE047', 'MARCH_GUARD', 'Tenaza Ardiente', 'BURN', 'HUMANOID'],
    ['alma_enjaulada', 'PRISION_ALMA_ENJAULADA', 'Alma Enjaulada', 'Espectro Suspendido en Jaula', 'NORMAL', 'CASTER', 'HANGING_CAGE_SOUL', '#38BDF8', '#334155', '#7DD3FC', '#A5F3FC', 'FLOAT_SWAY', 'Lamento de Celda', 'FEAR', 'SPECTRAL'],
    ['mastin_de_celda', 'PRISION_MASTIN_CELDA', 'Mastín de Celda', 'Bestia con Bozal de Clavos', 'NORMAL', 'ASSASSIN', 'JAW_COLLAR_CELL_HOUND', '#334155', '#18181B', '#F43F5E', '#38BDF8', 'PREDATOR_CROUCH', 'Desgarro de Presa', 'BLEED', 'ORGANIC'],
    ['alcaide_de_hierro', 'PRISION_ALCAIDE_HIERRO', 'Alcaide de Hierro', 'Guardián de la Llave Maestra', 'ELITE', 'TANK', 'IRON_KEY_WARDEN', '#475569', '#0F172A', '#FBBF24', '#38BDF8', 'MARCH_GUARD', 'Cierre de Compuerta', 'WEAKENED', 'HUMANOID'],
    ['penitente_de_la_campana', 'PRISION_PENITENTE_CAMPANA', 'Penitente de la Campana', 'Coloso Cargando Yugo de Bronce', 'ELITE', 'BRUTE', 'BELL_YOKE_FLAGELANT', '#78716C', '#1E293B', '#F97316', '#38BDF8', 'HEAVY_BREATH', 'Tañido de Condena', 'CURSE', 'UNDEAD'],
    ['carcelero_eterno', 'PRISION_CARCELERO_ETERNO', 'Carcelero Eterno', 'Señor de las Cien Cadenas', 'MINIBOSS', 'BOSS', 'ETERNAL_SHACKLE_OVERSEER', '#334155', '#0F172A', '#38BDF8', '#F97316', 'HEAVY_BREATH', 'Encadenamiento Perpetuo', 'CURSE', 'UNDEAD'],
    ['juez_de_las_cadenas', 'PRISION_JUEZ_CADENAS', 'Juez de las Cadenas', 'Magistrado del Tribunal Maldito', 'MINIBOSS', 'BOSS', 'GALLOWS_SCALES_JUDGE', '#1E293B', '#4C0519', '#FBBF24', '#38BDF8', 'RITUAL_PULSE', 'Veredicto Inapelable', 'FEAR', 'SPECTRAL'],
  ],
  santuario_de_sangre: [
    ['acolito_carmesi', 'SANGRE_ACOLITO_CARMESI', 'Acólito Carmesí', 'Portador del Cáliz de Sangre', 'NORMAL', 'HEALER', 'CRIMSON_CHALICE_ACOLYTE', '#BE123C', '#1E1B4B', '#FBBF24', '#FB7185', 'RITUAL_PULSE', 'Comunión Roja', 'BLEED', 'HUMANOID'],
    ['murcielago_vampirico', 'SANGRE_MURCIELAGO_VAMPIRICO', 'Murciélago Vampírico', 'Strigoi Alado de Colmillos Largos', 'NORMAL', 'ASSASSIN', 'GORGED_VAMPIRE_STRIGOI', '#881337', '#18181B', '#F43F5E', '#FEF08A', 'PREDATOR_CROUCH', 'Drenaje Arterial', 'BLEED', 'ORGANIC'],
    ['flagelante_del_caliz', 'SANGRE_FLAGELANTE_CALIZ', 'Flagelante del Cáliz', 'Fanático de Látigo Espinoso', 'NORMAL', 'BRUTE', 'THORN_WHIP_FLAGELLANT', '#9F1239', '#27272A', '#FDA4AF', '#F43F5E', 'MARCH_GUARD', 'Azote de Sangre', 'BLEED', 'HUMANOID'],
    ['siervo_desangrado', 'SANGRE_ SIERVO_DESANGRADO', 'Siervo Desangrado', 'Receptáculo pálido de Venas Rojas', 'NORMAL', 'TANK', 'EXSANGUINATED_HUSK_THRALL', '#E2E8F0', '#4C0519', '#F43F5E', '#FB7185', 'HEAVY_BREATH', 'Agarre Exangüe', 'WEAKENED', 'UNDEAD'],
    ['caballero_de_la_arteria', 'SANGRE_CABALLERO_ARTERIA', 'Caballero de la Arteria', 'Lancero de Armadura Carmesí', 'ELITE', 'TANK', 'ARTERIAL_LANCE_KNIGHT', '#9F1239', '#18181B', '#FBBF24', '#F43F5E', 'MARCH_GUARD', 'Empalamiento Real', 'BLEED', 'HUMANOID'],
    ['sacerdotisa_hemo', 'SANGRE_SACERDOTISA_HEMO', 'Sacerdotisa Hemo', 'Dama del Incensario de Sangre', 'ELITE', 'HEALER', 'HEMO_CENSER_PRIESTESS', '#E11D48', '#31102F', '#FDE047', '#FB7185', 'RITUAL_PULSE', 'Bautismo Carmesí', 'CURSE', 'HUMANOID'],
    ['cardenal_desollado', 'SANGRE_CARDENAL_DESOLLADO', 'Cardenal Desollado', 'Pontífice del Santuario Rojo', 'MINIBOSS', 'BOSS', 'FLAYED_MITRE_CARDINAL', '#BE123C', '#450A0A', '#FBBF24', '#F43F5E', 'RITUAL_PULSE', 'Liturgia de Exanguinación', 'BLEED', 'HUMANOID'],
    ['avatar_del_caliz', 'SANGRE_AVATAR_CALIZ', 'Avatar del Cáliz', 'Serafín de Sangre Solidificada', 'MINIBOSS', 'BOSS', 'OVERFLOWING_GRAIL_AVATAR', '#E11D48', '#1E1B4B', '#FDE047', '#FDA4AF', 'FLOAT_SWAY', 'Desbordamiento del Grial', 'BLEED', 'SPECTRAL'],
  ],
  ciudad_sepultada: [
    ['guardia_momificado', 'CIUDAD_GUARDIA_MOMIFICADO', 'Guardia Momificado', 'Soldado de Vendas y Khopesh', 'NORMAL', 'TANK', 'KHOPESH_MUMMY_GUARD', '#D6D3D1', '#78350F', '#F59E0B', '#38BDF8', 'MARCH_GUARD', 'Tajo de Khopesh', 'CURSE', 'UNDEAD'],
    ['escarabajo_de_lapislazuli', 'CIUDAD_ESCARABAJO_LAPISLAZULI', 'Escarabajo de Lapislázuli', 'Autómata Sagrado de Oro y Azul', 'NORMAL', 'TANK', 'LAPIS_SCARAB_CONSTRUCT', '#1D4ED8', '#B45309', '#FACC15', '#38BDF8', 'SCUTTLE_TWITCH', 'Caparazón Solar', 'WEAKENED', 'CONSTRUCT'],
    ['sacerdote_del_polvo', 'CIUDAD_SACERDOTE_POLVO', 'Sacerdote del Polvo', 'Hierofante de la Urna Canópica', 'NORMAL', 'CASTER', 'SAND_URN_HIEROPHANT', '#B45309', '#1E293B', '#38BDF8', '#FDE047', 'RITUAL_PULSE', 'Tormenta de Arena Seca', 'CURSE', 'UNDEAD'],
    ['chacal_de_arena', 'CIUDAD_CHACAL_ARENA', 'Chacal de Arena', 'Acechador con Cabeza de Anubis', 'NORMAL', 'ASSASSIN', 'ANUBIS_DUNE_JACKAL', '#292524', '#92400E', '#F59E0B', '#38BDF8', 'PREDATOR_CROUCH', 'Colmillo del Desierto', 'BLEED', 'UNDEAD'],
    ['usurpador_dorado', 'CIUDAD_USURPADOR_DORADO', 'Usurpador Dorado', 'Noble de Máscara Funeraria de Oro', 'ELITE', 'BRUTE', 'GILDED_MASK_USURPER', '#F59E0B', '#1E3A8A', '#FEF08A', '#38BDF8', 'MARCH_GUARD', 'Cetro de las Dunas', 'MARKED', 'UNDEAD'],
    ['esfinge_rota', 'CIUDAD_ESFINGE_ROTA', 'Esfinge Rota', 'Estatua Alada de Arenisca Viva', 'ELITE', 'TANK', 'FRACTURED_WING_SPHINX', '#D97706', '#44403C', '#38BDF8', '#FDE047', 'HEAVY_BREATH', 'Enigma Aplastante', 'CONFUSION', 'CONSTRUCT'],
    ['faraon_sin_sol', 'CIUDAD_FARAON_SIN_SOL', 'Faraón sin Sol', 'Monarca Eterno de la Ciudad Sepultada', 'MINIBOSS', 'BOSS', 'SUNLESS_SARCOPHAGUS_PHARAOH', '#F59E0B', '#172554', '#38BDF8', '#FEF08A', 'RITUAL_PULSE', 'Plaga de la Dinastía Muerta', 'CURSE', 'UNDEAD'],
    ['monolito_viviente', 'CIUDAD_MONOLITO_VIVIENTE', 'Monolito Viviente', 'Obelisco Despierto de Piedra Solar', 'MINIBOSS', 'BOSS', 'OBELISK_SAND_COLOSSUS', '#78350F', '#0F172A', '#FACC15', '#38BDF8', 'HEAVY_BREATH', 'Derrumbe del Obelisco Real', 'WEAKENED', 'CONSTRUCT'],
  ],
  palacio_de_los_espejos: [
    ['doble_fragmentado', 'ESPEJOS_DOBLE_FRAGMENTADO', 'Doble Fragmentado', 'Silueta Asimétrica de Espejo Roto', 'NORMAL', 'ASSASSIN', 'SHATTERED_DOPPELGANGER', '#CBD5E1', '#3B0764', '#C084FC', '#38BDF8', 'PREDATOR_CROUCH', 'Estocada Invertida', 'BLEED', 'SPECTRAL'],
    ['dama_de_azogue', 'ESPEJOS_DAMA_AZOGUE', 'Dama de Azogue', 'Espectro de Vestido de Mercurio', 'NORMAL', 'CASTER', 'QUICKSILVER_GOWN_LADY', '#E2E8F0', '#1E1B4B', '#A855F7', '#67E8F9', 'FLOAT_SWAY', 'Lágrima de Mercurio', 'CONFUSION', 'SPECTRAL'],
    ['bufon_de_ilusion', 'ESPEJOS_BUfON_ILUSION', 'Bufón de Ilusión', 'Arlequín de Doble Máscara', 'NORMAL', 'SUPPORT', 'JESTER_TWIN_MASK', '#9333EA', '#1E293B', '#FBBF24', '#F43F5E', 'SCUTTLE_TWITCH', 'Risa Espejada', 'CONFUSION', 'HUMANOID'],
    ['filo_cristalino', 'ESPEJOS_FILO_CRISTALINO', 'Filo Cristalino', 'Espada Animada en Marco de Plata', 'NORMAL', 'ASSASSIN', 'FLOATING_MIRROR_BLADE', '#F1F5F9', '#4C1D95', '#38BDF8', '#E879F9', 'FLOAT_SWAY', 'Corte Reflejado', 'BLEED', 'CONSTRUCT'],
    ['duelista_del_reflejo', 'ESPEJOS_DUELISTA_REFLEJO', 'Duelista del Reflejo', 'Esgrimista de Capa Plateada', 'ELITE', 'ASSASSIN', 'SILVER_RAPIER_DUELIST', '#E2E8F0', '#31102F', '#FBBF24', '#C084FC', 'MARCH_GUARD', 'Riposta del Salón', 'MARKED', 'HUMANOID'],
    ['mascara_plateada', 'ESPEJOS_MASCARA_PLATEADA', 'Máscara Plateada', 'Rostro Colosal de Porcelana y Azogue', 'ELITE', 'CASTER', 'FLOATING_PORCELAIN_MASK', '#F8FAFC', '#1E1B4B', '#C084FC', '#38BDF8', 'FLOAT_SWAY', 'Mirada Narcisista', 'CONFUSION', 'CONSTRUCT'],
    ['monarca_de_los_reflejos', 'ESPEJOS_MONARCA_REFLEJOS', 'Monarca de los Reflejos', 'Rey del Trono de Cristal Quebrado', 'MINIBOSS', 'BOSS', 'THRONE_MIRROR_MONARCH', '#E2E8F0', '#3B0764', '#FBBF24', '#38BDF8', 'HEAVY_BREATH', 'Soberanía de los Mil Espejos', 'CONFUSION', 'SPECTRAL'],
    ['ilusionista_real', 'ESPEJOS_ ILUSIONISTA_REAL', 'Ilusionista Real', 'Archimago del Caleidoscopio', 'MINIBOSS', 'BOSS', 'KALEIDOSCOPE_GRAND_ILLUSIONIST', '#A855F7', '#0F172A', '#67E8F9', '#F0ABFC', 'RITUAL_PULSE', 'Laberinto de Reflejos', 'CONFUSION', 'HUMANOID'],
  ],
  cavernas_heladas: [
    ['lobo_de_escarcha', 'HELADAS_LOBO_ESCARCHA', 'Lobo de Escarcha', 'Depredador de Pelaje Blanco y Carámbanos', 'NORMAL', 'ASSASSIN', 'FROST_FANG_DIRE_WOLF', '#BAE6FD', '#1E293B', '#38BDF8', '#67E8F9', 'PREDATOR_CROUCH', 'Colmillo Glacial', 'FROST', 'ORGANIC'],
    ['espectro_de_ventisca', 'HELADAS_ESPECTRO_VENTISCA', 'Espectro de Ventisca', 'Ánima Envuelta en Tormenta Polar', 'NORMAL', 'CASTER', 'BLIZZARD_SHROUD_BANSHEE', '#7DD3FC', '#0F172A', '#E0F2FE', '#38BDF8', 'FLOAT_SWAY', 'Suspiro Bajo Cero', 'FROST', 'SPECTRAL'],
    ['trepador_de_carambano', 'HELADAS_TREPADOR_CARAMBANO', 'Trepador de Carámbano', 'Crustáceo de Hielo Afilado', 'NORMAL', 'SWARM', 'ICICLE_CEILING_CRAWLER', '#38BDF8', '#164E63', '#E0F2FE', '#FDE047', 'SCUTTLE_TWITCH', 'Púa de Escarcha', 'BLEED', 'ORGANIC'],
    ['guerrero_congelado', 'HELADAS_GUERRERO_CONGELADO', 'Guerrero Congelado', 'Draugr Vikingo Encerrado en Hielo', 'NORMAL', 'TANK', 'FROZEN_AXE_DRAUGR', '#64748B', '#0C4A6E', '#7DD3FC', '#38BDF8', 'MARCH_GUARD', 'Hachazo Boreal', 'FROST', 'UNDEAD'],
    ['troll_de_glaciar', 'HELADAS_TROLL_GLACIAR', 'Troll de Glaciar', 'Bruto de Colmillos y Espalda Helada', 'ELITE', 'BRUTE', 'GLACIER_TUSK_TROLL', '#0284C7', '#1E293B', '#E0F2FE', '#38BDF8', 'HEAVY_BREATH', 'Puño de Permafrost', 'FROST', 'ORGANIC'],
    ['bruja_del_invierno', 'HELADAS_BRUJA_INVIERNO', 'Bruja del Invierno', 'Chamana con Corona de Astas Heladas', 'ELITE', 'HEALER', 'RIME_ANTLER_CRONE', '#0369A1', '#1E1B4B', '#BAE6FD', '#67E8F9', 'RITUAL_PULSE', 'Velo de Escarcha Eterna', 'FROST', 'HUMANOID'],
    ['behemoth_de_permafrost', 'HELADAS_BEHEMOTH_PERMAFROST', 'Behemoth de Permafrost', 'Bestia Mamut Acorazada de Hielo', 'MINIBOSS', 'BOSS', 'PERMAFROST_MAMMOTH_BEHEMOTH', '#0284C7', '#082F49', '#E0F2FE', '#38BDF8', 'HEAVY_BREATH', 'Estampida del Glaciar', 'FROST', 'ORGANIC'],
    ['senor_del_alud', 'HELADAS_SENOR_ALUD', 'Señor del Alud', 'Gigante Jotunn de Runas Boreales', 'MINIBOSS', 'BOSS', 'AVALANCHE_RUNE_JOTUNN', '#38BDF8', '#0F172A', '#FDE047', '#E0F2FE', 'HEAVY_BREATH', 'Cataclismo de Invierno', 'FROST', 'CONSTRUCT'],
  ],
  fortaleza_goblin: [
    ['lancero_chatarra', 'GOBLIN_LANCERO_CHATARRA', 'Lancero Chatarra', 'Goblin con Escudo de Caldera', 'NORMAL', 'TANK', 'SCRAP_SPEAR_GOBLIN', '#65A30D', '#78350F', '#F97316', '#FACC15', 'MARCH_GUARD', 'Pinchazo Oxidado', 'BLEED', 'HUMANOID'],
    ['piromano_de_barril', 'GOBLIN_PIROMANO_BARRIL', 'Pirómano de Barril', 'Artificiero Cargando Tonel de Pólvora', 'NORMAL', 'CASTER', 'POWDER_KEG_BOMBER', '#4D7C0F', '#991B1B', '#F97316', '#FDE047', 'SCUTTLE_TWITCH', 'Mecha Corta', 'BURN', 'HUMANOID'],
    ['jinete_de_huargo', 'GOBLIN_JINETE_HUARGO', 'Jinete de Huargo', 'Incursor Montado en Bestia Feroz', 'NORMAL', 'ASSASSIN', 'WARG_MOUNTED_RAIDER', '#3F6212', '#44403C', '#EF4444', '#FBBF24', 'PREDATOR_CROUCH', 'Carga de Colmillos', 'BLEED', 'HUMANOID'],
    ['trampero_furtivo', 'GOBLIN_TRAMPERO_FURTIVO', 'Trampero Furtivo', 'Acechador con Cepos de Osos', 'NORMAL', 'SUPPORT', 'BEARTRAP_SNARE_STALKER', '#65A30D', '#292524', '#CBD5E1', '#F97316', 'PREDATOR_CROUCH', 'Cepo Dentado', 'MARKED', 'HUMANOID'],
    ['chaman_del_totem', 'GOBLIN_CHAMAN_TOTEM', 'Chamán del Tótem', 'Brujo con Estandarte de Cráneos', 'ELITE', 'HEALER', 'SKULL_POLE_GOBLIN_SHAMAN', '#4D7C0F', '#581C87', '#A3E635', '#F97316', 'RITUAL_PULSE', 'Danza de Guerra', 'CURSE', 'HUMANOID'],
    ['bruto_blindado', 'GOBLIN_BRUTO_BLINDADO', 'Bruto Blindado', 'Ogro Goblin con Armadura de Horno', 'ELITE', 'BRUTE', 'BOILER_PLATE_GOBLIN_BRUTE', '#44403C', '#365314', '#F97316', '#EF4444', 'HEAVY_BREATH', 'Maza Demoledora', 'WEAKENED', 'HUMANOID'],
    ['caudillo_corona_de_hierro', 'GOBLIN_CAUDILLO_CORONA_HIERRO', 'Caudillo Corona de Hierro', 'Rey de Guerra de la Empalizada', 'MINIBOSS', 'BOSS', 'IRON_CROWN_WARBOSS', '#4D7C0F', '#7C2D12', '#FBBF24', '#EF4444', 'HEAVY_BREATH', 'Grito de Asedio Total', 'BLEED', 'HUMANOID'],
    ['maestro_de_asedio', 'GOBLIN_MAESTRO_ASEDIO', 'Maestro de Asedio', 'Comandante de la Balista Pesada', 'MINIBOSS', 'BOSS', 'BALLISTA_SIEGE_MASTER', '#65A30D', '#27272A', '#F97316', '#FDE047', 'MARCH_GUARD', 'Andanada de Arpón Ardiente', 'BURN', 'HUMANOID'],
  ],
  cementerio_de_gigantes: [
    ['esqueleto_colosal', 'GIGANTES_ESQUELETO_COLOSAL', 'Esqueleto Colosal', 'Torso Titánico con Espadón Roto', 'NORMAL', 'BRUTE', 'COLOSSAL_RIB_SKELETON', '#E2E8F0', '#334155', '#A3E635', '#84CC16', 'HEAVY_BREATH', 'Mandoble de Titán', 'WEAKENED', 'UNDEAD'],
    ['craneo_errante', 'GIGANTES_CRANEO_ERRANTE', 'Sacerdote de Osario Gigante', 'Chamán Esquelético de Vértebras En Llamas', 'NORMAL', 'HEALER', 'ROLLING_GIANT_CRANIUM', '#D6D3D1', '#14532D', '#BEF264', '#4ADE80', 'RITUAL_PULSE', 'Fuego de Osario', 'FEAR', 'UNDEAD'],
    ['mano_desenterrada', 'GIGANTES_MANO_DESENTERRADA', 'Mano Desenterrada', 'Falange Colosal Reptante de Cinco Dedos', 'NORMAL', 'ASSASSIN', 'CRAWLING_TITAN_HAND', '#CBD5E1', '#1E293B', '#A3E635', '#34D399', 'SCUTTLE_TWITCH', 'Apretón Sepulcral', 'WEAKENED', 'UNDEAD'],
    ['perro_de_osario', 'GIGANTES_PERRO_OSARIO', 'Perro de Osario', 'Bestia Cuadrúpeda de Costillas Fusionadas', 'NORMAL', 'ASSASSIN', 'GRAVE_RIBCAGE_HOUND', '#A8A29E', '#1F2937', '#84CC16', '#EF4444', 'PREDATOR_CROUCH', 'Fauce de Fémur', 'BLEED', 'UNDEAD'],
    ['titan_decapitado', 'GIGANTES_TITAN_DECAPITADO', 'Titán Decapitado', 'Coloso sin Cabeza con Pilar Funerario', 'ELITE', 'BRUTE', 'HEADLESS_ATLAS_TITAN', '#94A3B8', '#1E293B', '#FACC15', '#A3E635', 'HEAVY_BREATH', 'Impacto de Mausoleo', 'WEAKENED', 'UNDEAD'],
    ['guardian_de_la_fosa', 'GIGANTES_GUARDIAN_FOSA', 'Guardián de la Fosa', 'Constructo de Lápidas y Cadenas', 'ELITE', 'TANK', 'GRAVESTONE_CHAIN_WARDEN', '#64748B', '#0F172A', '#4ADE80', '#BEF264', 'MARCH_GUARD', 'Lápida Aplastante', 'CURSE', 'UNDEAD'],
    ['coloso_de_femures', 'GIGANTES_COLOSO_FEMURES', 'Coloso de Fémures', 'Amalgama Gigante de Mil Huesos', 'MINIBOSS', 'BOSS', 'FEMUR_PILLAR_COLOSSUS', '#E2E8F0', '#14532D', '#BEF264', '#4ADE80', 'HEAVY_BREATH', 'Terremoto del Osario', 'WEAKENED', 'UNDEAD'],
    ['rey_del_osario', 'GIGANTES_REY_OSARIO', 'Rey del Osario', 'Soberano Gigante de la Corona de Costillas', 'MINIBOSS', 'BOSS', 'OSSUARY_CROWN_GIANT_KING', '#F1F5F9', '#1E293B', '#FBBF24', '#A3E635', 'RITUAL_PULSE', 'Juicio de los Antiguos Titanes', 'CURSE', 'UNDEAD'],
  ],
  el_abismo: [
    ['heraldo_del_vacio', 'ABISMO_HERALDO_VACIO', 'Heraldo del Vacío', 'Profeta del Halo Negro', 'NORMAL', 'CASTER', 'VOID_HALO_HERALD', '#9333EA', '#090514', '#F43F5E', '#E879F9', 'FLOAT_SWAY', 'Pulso de Singularidad', 'CURSE', 'SPECTRAL'],
    ['larva_estelar', 'ABISMO_LARVA_ESTELAR', 'Larva Estelar', 'Parásito Cósmico de Tentáculos', 'NORMAL', 'SWARM', 'ASTRAL_PARASITE_LARVA', '#C084FC', '#1E1B4B', '#38BDF8', '#F43F5E', 'SCUTTLE_TWITCH', 'Mordisco Dimensional', 'CONFUSION', 'ORGANIC'],
    ['sombra_devoradora', 'ABISMO_SOMBRA_DEVORADORA', 'Sombra Devoradora', 'Depredador de Fauces Abisales', 'NORMAL', 'ASSASSIN', 'UMBRAL_MAW_STALKER', '#3B0764', '#090514', '#F43F5E', '#A855F7', 'PREDATOR_CROUCH', 'Desgarro de Umbral', 'BLEED', 'SPECTRAL'],
    ['testigo_ciego', 'ABISMO_TESTIGO_CIEGO', 'Testigo Ciego', 'Ser Flotante de Múltiples Ojos Abiertos', 'NORMAL', 'SUPPORT', 'MANY_EYED_BLIND_WITNESS', '#7E22CE', '#1E1B4B', '#FDE047', '#F43F5E', 'FLOAT_SWAY', 'Mirada de Locura', 'FEAR', 'SPECTRAL'],
    ['caballero_del_eclipse', 'ABISMO_CABALLERO_ECLIPSE', 'Caballero del Eclipse', 'Paladín del Sol Devorado', 'ELITE', 'TANK', 'ECLIPSE_GREATSWORD_KNIGHT', '#4C1D95', '#090514', '#FBBF24', '#F43F5E', 'MARCH_GUARD', 'Mandoble de Horizonte', 'CURSE', 'UNDEAD'],
    ['cantor_de_la_nada', 'ABISMO_CANTOR_NADA', 'Cantor de la Nada', 'Corista sin Rostro del Vacío', 'ELITE', 'HEALER', 'HOLLOW_CHOIR_CHANTER', '#A855F7', '#1E1B4B', '#F43F5E', '#38BDF8', 'RITUAL_PULSE', 'Himno de Entropía', 'WEAKENED', 'SPECTRAL'],
    ['el_primer_caido', 'ABISMO_PRIMER_CAIDO', 'El Primer Caído', 'Arcángel Quebrado del Abismo', 'MINIBOSS', 'BOSS', 'BROKEN_WINGS_FIRST_FALLEN', '#6B21A8', '#090514', '#FBBF24', '#F43F5E', 'HEAVY_BREATH', 'Lanza de la Primera Caída', 'CURSE', 'SPECTRAL'],
    ['corazon_de_la_cripta', 'ABISMO_CORAZON_CRIPTAS', 'Corazón de la Cripta', 'Núcleo Encadenado del Mundo Subterráneo', 'MINIBOSS', 'BOSS', 'CHAINED_ABYSSAL_HEART', '#BE123C', '#2E1065', '#FDE047', '#F43F5E', 'RITUAL_PULSE', 'Latido del Fin de los Tiempos', 'FEAR', 'SPECTRAL'],
  ],
};

function getTraitsByGroup(group: CompactEntrySpec[14]): {
  weaknesses: CriptaEnemyTraitEntry[];
  resistances: CriptaEnemyTraitEntry[];
} {
  switch (group) {
    case 'UNDEAD':
      return { weaknesses: W_BLUNT_HOLY, resistances: R_PIERCE_POISON };
    case 'SPECTRAL':
      return { weaknesses: W_HOLY_ARCANE, resistances: R_SLASH };
    case 'ORGANIC':
      return { weaknesses: W_ALCHEMY_SLASH, resistances: R_POISON };
    case 'CONSTRUCT':
      return { weaknesses: W_BLUNT_ARCANE, resistances: R_PIERCE_SLASH };
    case 'HUMANOID':
    default:
      return { weaknesses: W_PIERCE_SLASH, resistances: R_ARCANE };
  }
}

export const CRIPTA_BIOME_BESTIARY_BY_SLUG: Record<string, CriptaCreatureVisualBlueprint> = {};

function deriveProfessionAndVisualProfile(
  slug: string,
  name: string,
  dungeonId: CriptaDungeonId,
  tier: CriptaCreatureVisualBlueprint['tier'],
  roleTag: CriptaCreatureVisualBlueprint['roleTag'],
  silhouetteType: CriptaCreatureVisualBlueprint['silhouetteType'],
  primary: string,
  secondary: string,
  highlight: string,
  eyeGlow: string,
  traitGroup: CompactEntrySpec[14]
): { profession: CriptaEnemyProfession; visualProfile: CriptaEnemyVisualProfile } {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  let profession: CriptaEnemyProfession = 'GUERRERO';

  if (tier === 'MINIBOSS' || tier === 'FINAL_BOSS' || roleTag === 'BOSS') {
    profession = 'JEFE';
  } else if (
    s === 'esfera_armilar' ||
    s === 'acolito_de_hueso' ||
    s === 'dama_de_las_esporas' ||
    s === 'cantor_de_mareas' ||
    s === 'chaman_del_totem' ||
    s === 'craneo_errante' ||
    s === 'cantor_de_la_nada' ||
    s === 'bruja_del_invierno' ||
    n.includes('chamán') ||
    n.includes('chaman')
  ) {
    profession = 'CHAMÁN';
  } else if (
    s.includes('alquimista') ||
    s.includes('homunculo') ||
    s.includes('piromano') ||
    s.includes('escarabajo_acido') ||
    s.includes('capataz_del_grisu')
  ) {
    profession = 'ALQUIMISTA';
  } else if (
    s.includes('cazador') ||
    s.includes('arquero') ||
    s.includes('ballista') ||
    s.includes('zangano_aguijon') ||
    s.includes('cuervo')
  ) {
    profession = 'TIRADOR';
  } else if (
    s.includes('penitente') ||
    s.includes('flagelante') ||
    s.includes('herrero') ||
    s.includes('contrabandista') ||
    s.includes('jinete')
  ) {
    profession = 'BERSERKER';
  } else if (
    s.includes('larva_incubadora') ||
    s.includes('enjambre') ||
    s.includes('rata_de_peste') ||
    s.includes('fragmento_resonante')
  ) {
    profession = 'INVOCADOR';
  } else if (
    s.includes('tejedor') ||
    s.includes('archivero') ||
    s.includes('alma_enjaulada') ||
    s.includes('testigo_ciego') ||
    s.includes('mascara_plateada') ||
    s.includes('trampero') ||
    s.includes('fuego_fatuo')
  ) {
    profession = 'CONTROLADOR';
  } else if (
    s === 'acolito_del_zodiaco' ||
    s.includes('guardian') ||
    s.includes('custodio') ||
    s.includes('centinela_de_geoda') ||
    s.includes('carcelero') ||
    s.includes('alcaide')
  ) {
    profession = 'GUARDIÁN';
  } else if (roleTag === 'TANK') {
    profession = 'TANQUE';
  } else if (roleTag === 'HEALER') {
    profession = 'CURANDERO';
  } else if (roleTag === 'SUPPORT') {
    profession = 'SOPORTE';
  } else if (roleTag === 'CASTER') {
    profession = 'MAGO';
  } else if (roleTag === 'ASSASSIN') {
    profession = 'ASESINO';
  } else if (roleTag === 'BRUTE') {
    profession = tier === 'ELITE' ? 'BRUTO' : 'GUERRERO';
  }

  let ambientEffect: CriptaEnemyVisualProfile['ambientEffect'] = 'NONE';
  if (profession === 'CHAMÁN') {
    if (dungeonId === 'torre_del_astrologo') ambientEffect = 'ORBIT_STARS';
    else if (dungeonId === 'cementerio_de_gigantes') ambientEffect = 'ORBIT_VERTEBRAE';
    else if (dungeonId === 'jardin_podrido') ambientEffect = 'SPORE_DRIFT';
    else if (dungeonId === 'fortaleza_goblin') ambientEffect = 'SMOKE_CHARMS';
    else if (dungeonId === 'templo_sumergido') ambientEffect = 'ABYSSAL_BUBBLES';
    else if (dungeonId === 'el_abismo') ambientEffect = 'VOID_FRAGMENTS';
    else ambientEffect = 'RUNE_PULSE';
  } else if (profession === 'ALQUIMISTA') {
    ambientEffect = 'ALCHEMICAL_VAPOR';
  } else if (dungeonId === 'torre_del_astrologo') {
    ambientEffect = s === 'acolito_del_zodiaco' ? 'ECLIPSE_CORONA' : 'ORBIT_STARS';
  } else if (dungeonId === 'forja_infernal') {
    ambientEffect = 'EMBER_SPARKS';
  } else if (dungeonId === 'cavernas_heladas') {
    ambientEffect = 'FROST_MIST';
  } else if (dungeonId === 'santuario_de_sangre') {
    ambientEffect = 'BLOOD_DROPLETS';
  } else if (dungeonId === 'el_abismo') {
    ambientEffect = 'VOID_FRAGMENTS';
  }

  const silhouetteModifier: CriptaEnemyVisualProfile['silhouetteModifier'] =
    s === 'acolito_del_zodiaco'
      ? 'RECTANGULAR_FRAME'
      : s === 'esfera_armilar'
      ? 'CELESTIAL_TOTEM'
      : profession === 'TANQUE' || profession === 'GUARDIÁN'
      ? 'WIDE_PLANTED'
      : profession === 'BRUTO' || profession === 'JEFE'
      ? 'COLOSSAL'
      : profession === 'ASESINO' || profession === 'TIRADOR'
      ? 'TALL_LEAN'
      : 'STANDARD';

  const idleAnimation: CriptaEnemyVisualProfile['idleAnimation'] =
    profession === 'CHAMÁN' || profession === 'CURANDERO' || profession === 'INVOCADOR'
      ? 'RITUAL_SWAY'
      : profession === 'BERSERKER'
      ? 'BERSERK_TREMOR'
      : profession === 'ASESINO' || profession === 'TIRADOR'
      ? 'AGILE_CROUCH'
      : traitGroup === 'CONSTRUCT'
      ? 'MECHANICAL_PULSE'
      : traitGroup === 'SPECTRAL'
      ? 'FLOAT_BOB'
      : 'HEAVY_BREATH';

  return {
    profession,
    visualProfile: {
      species: traitGroup,
      archetype: profession,
      biome: dungeonId,
      bodyVariant: silhouetteType,
      headVariant: `${silhouetteType}_HEAD`,
      armorVariant: `${profession}_${dungeonId.toUpperCase()}`,
      weaponVariant: `${profession}_WEAPON`,
      accessoryVariants: [ambientEffect, silhouetteModifier],
      accentPalette: {
        primary,
        secondary,
        trim: highlight,
        glow: eyeGlow,
        eye: eyeGlow,
      },
      idleAnimation,
      secondaryAnimations: ['WEAPON_SWAY', 'CORE_PULSE', ambientEffect],
      ambientEffect,
      combatEffects: [profession],
      silhouetteModifier,
    },
  };
}

(Object.keys(DUNGEON_CREATURE_SPECS) as CriptaDungeonId[]).forEach((dungeonId) => {
  const list = DUNGEON_CREATURE_SPECS[dungeonId];
  list.forEach((spec) => {
    const [
      slug,
      id,
      name,
      title,
      tier,
      roleTag,
      silhouetteType,
      primary,
      secondary,
      highlight,
      eyeGlow,
      idleCadence,
      signatureMoveName,
      statusThreat,
      traitGroup,
    ] = spec;
    const traits = getTraitsByGroup(traitGroup);
    const isLargeNormal =
      tier === 'NORMAL' &&
      (roleTag === 'TANK' ||
        roleTag === 'BRUTE' ||
        slug.includes('esqueleto_colosal') ||
        slug.includes('guardian_de_coral') ||
        slug.includes('automata_de_escoria'));
    const scaleFactor =
      tier === 'MINIBOSS'
        ? 1.68
        : tier === 'ELITE'
        ? 1.42
        : isLargeNormal
        ? 1.34
        : 1.22;
    const { profession, visualProfile } = deriveProfessionAndVisualProfile(
      slug,
      name,
      dungeonId,
      tier,
      roleTag,
      silhouetteType,
      primary,
      secondary,
      highlight,
      eyeGlow,
      traitGroup
    );

    CRIPTA_BIOME_BESTIARY_BY_SLUG[slug] = {
      id,
      slug,
      name,
      title,
      dungeonId,
      tier,
      roleTag,
      profession,
      visualProfile,
      silhouetteType,
      palette: {
        primary,
        secondary,
        highlight,
        eyeGlow,
        metal: '#94A3B8',
        dark: '#09070F',
      },
      scaleFactor,
      idleCadence,
      signatureMoveName,
      statusThreat,
      weaknesses: traits.weaknesses,
      resistances: traits.resistances,
    };
  });
});

// Add 3 Distinct Final Bosses (each with Phase 1 & Phase 2 blueprints)
CRIPTA_BIOME_BESTIARY_BY_SLUG['soberano_del_umbral'] = {
  id: 'FINAL_BOSS_SOBERANO_P1',
  slug: 'soberano_del_umbral',
  name: 'Malkorath, Soberano Encadenado',
  title: 'Monarca de los Tres Sellos · Fase I',
  dungeonId: 'el_abismo',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'SOVEREIGN_PHASE_1',
  palette: {
    primary: '#9333EA',
    secondary: '#1E1B4B',
    highlight: '#FFD166',
    eyeGlow: '#F43F5E',
    metal: '#E2E8F0',
    dark: '#06040B',
  },
  scaleFactor: 1.98,
  idleCadence: 'RITUAL_PULSE',
  signatureMoveName: 'Juicio de las Tres Puertas',
  statusThreat: 'CURSE',
  weaknesses: W_HOLY_ARCANE,
  resistances: R_SLASH,
};

CRIPTA_BIOME_BESTIARY_BY_SLUG['soberano_del_umbral_p2'] = {
  id: 'FINAL_BOSS_SOBERANO_P2',
  slug: 'soberano_del_umbral_p2',
  name: 'El Corazón Desatado de la Cripta',
  title: 'Avatar del Eclipse Eterno · Fase II',
  dungeonId: 'el_abismo',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'SOVEREIGN_PHASE_2',
  palette: {
    primary: '#E11D48',
    secondary: '#3B0764',
    highlight: '#FDE047',
    eyeGlow: '#38BDF8',
    metal: '#F8FAFC',
    dark: '#05020A',
  },
  scaleFactor: 2.12,
  idleCadence: 'RITUAL_PULSE',
  signatureMoveName: 'Cataclismo del Eclipse Eterno',
  statusThreat: 'FEAR',
  weaknesses: W_HOLY_ARCANE,
  resistances: R_SLASH,
};

CRIPTA_BIOME_BESTIARY_BY_SLUG['rey_osario_primordial'] = {
  id: 'FINAL_BOSS_OSSUARY_KING_P1',
  slug: 'rey_osario_primordial',
  name: 'Vexaris, Patriarca del Osario Eterno',
  title: 'Soberano de las Mil Calaveras · Fase I',
  dungeonId: 'cementerio_de_gigantes',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'OSSUARY_KING_PHASE_1',
  palette: {
    primary: '#E2E8F0',
    secondary: '#14532D',
    highlight: '#FBBF24',
    eyeGlow: '#4ADE80',
    metal: '#94A3B8',
    dark: '#050806',
  },
  scaleFactor: 2.02,
  idleCadence: 'HEAVY_BREATH',
  signatureMoveName: 'Decreto de la Catedral de Hueso',
  statusThreat: 'CURSE',
  weaknesses: W_BLUNT_HOLY,
  resistances: R_PIERCE_POISON,
};

CRIPTA_BIOME_BESTIARY_BY_SLUG['rey_osario_primordial_p2'] = {
  id: 'FINAL_BOSS_OSSUARY_KING_P2',
  slug: 'rey_osario_primordial_p2',
  name: 'Behemoth de la Necrópolis Despierta',
  title: 'Dragón-Coloso de Hueso y Ánima · Fase II',
  dungeonId: 'cementerio_de_gigantes',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'OSSUARY_KING_PHASE_2',
  palette: {
    primary: '#F8FAFC',
    secondary: '#064E3B',
    highlight: '#A3E635',
    eyeGlow: '#BEF264',
    metal: '#CBD5E1',
    dark: '#040906',
  },
  scaleFactor: 2.18,
  idleCadence: 'HEAVY_BREATH',
  signatureMoveName: 'Exhalación de las Cien Fosas',
  statusThreat: 'POISON',
  weaknesses: W_BLUNT_HOLY,
  resistances: R_PIERCE_POISON,
};

CRIPTA_BIOME_BESTIARY_BY_SLUG['emperatriz_del_eclipse_carmesi'] = {
  id: 'FINAL_BOSS_ASTRAL_LEVIATHAN_P1',
  slug: 'emperatriz_del_eclipse_carmesi',
  name: 'Nyxara, Arquitecta del Eclipse Carmesí',
  title: 'Oráculo del Sol Devorado · Fase I',
  dungeonId: 'torre_del_astrologo',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'ASTRAL_LEVIATHAN_PHASE_1',
  palette: {
    primary: '#BE123C',
    secondary: '#1E1B4B',
    highlight: '#FDE047',
    eyeGlow: '#38BDF8',
    metal: '#F59E0B',
    dark: '#07040E',
  },
  scaleFactor: 1.98,
  idleCadence: 'FLOAT_SWAY',
  signatureMoveName: 'Alineación del Grial Sangriento',
  statusThreat: 'BLEED',
  weaknesses: W_PIERCE_SLASH,
  resistances: R_ARCANE,
};

CRIPTA_BIOME_BESTIARY_BY_SLUG['emperatriz_del_eclipse_carmesi_p2'] = {
  id: 'FINAL_BOSS_ASTRAL_LEVIATHAN_P2',
  slug: 'emperatriz_del_eclipse_carmesi_p2',
  name: 'Leviatán de la Corona Sangrienta',
  title: 'Deidad del Horizonte Roto · Fase II',
  dungeonId: 'santuario_de_sangre',
  tier: 'FINAL_BOSS',
  roleTag: 'BOSS',
  profession: 'JEFE',
  silhouetteType: 'ASTRAL_LEVIATHAN_PHASE_2',
  palette: {
    primary: '#F43F5E',
    secondary: '#31102F',
    highlight: '#FEF08A',
    eyeGlow: '#67E8F9',
    metal: '#FBBF24',
    dark: '#08020A',
  },
  scaleFactor: 2.16,
  idleCadence: 'FLOAT_SWAY',
  signatureMoveName: 'Singularidad de Marea Roja',
  statusThreat: 'CONFUSION',
  weaknesses: W_PIERCE_SLASH,
  resistances: R_ARCANE,
};

// Map legacy slugs from server DUNGEON_FLAVOR so any existing room state resolves to a unique creature
const LEGACY_SLUG_ALIAS_MAP: Record<string, string> = {
  // Catacumbas
  centinela_de_hueso: 'guardian_de_la_cripta',
  centinela_osario: 'guardian_de_la_cripta',
  arquero_sepulcral: 'espectro_de_ceniza',
  acolito_sepulcral: 'acolito_de_hueso',
  acolito_ceniza: 'acolito_de_hueso',
  campeon_juramentado: 'caballero_tumular',
  senor_del_osario_real: 'senor_del_osario',
  rey_bajo_el_marmol: 'regente_insepulto',
  // Jardín
  brote_venenoso: 'hongo_errante',
  huesped_micelio: 'hongo_errante',
  espora_errante: 'mosca_carronera',
  zarza_estranguladora: 'trepadora_espinosa',
  jardinero_putrefacto: 'coloso_de_micelio',
  reina_micotica_del_jardin: 'matriarca_fungica',
  madre_del_micelio: 'matriarca_fungica',
  // Forja
  automa_de_escoria: 'automata_de_escoria',
  golem_escoria: 'automata_de_escoria',
  forjador_encadenado: 'herrero_de_ceniza',
  herrador_ciego: 'herrero_de_ceniza',
  sabueso_brasa: 'salamandra_de_crisol',
  capataz_del_yunque: 'centurion_piroclasto',
  coloso_de_magma_imperial: 'titan_del_crisol',
  coloso_de_la_caldera: 'titan_del_crisol',
  // Templo
  siervo_abisal: 'acolito_abisal',
  sacerdote_salitre: 'acolito_abisal',
  merodeador_de_coral: 'guardian_de_coral',
  acechador_coral: 'anguila_de_la_sima',
  ahogado_del_coro: 'cantor_de_mareas',
  eraldo_de_la_pleamar: 'caballero_ahogado',
  leviatan_del_altar_hundido: 'leviatan_del_altar',
  leviatan_del_presbiterio: 'leviatan_del_altar',
  // Minas
  excavador_perdido: 'minero_descascarado',
  minero_sepultado: 'minero_descascarado',
  acechador_de_veta: 'aranuelo_de_filon',
  escarabajo_veta: 'aranuelo_de_filon',
  vigia_de_farol: 'excavador_ciego',
  capataz_de_la_grieta: 'capataz_del_grisu',
  capataz_de_la_veta_negra: 'perforador_profundo',
  devorador_de_filones: 'devorador_de_vetas',
  // Verdugo
  carcelero_de_hierro: 'carcelero_real',
  carcelero_encapuchado: 'carcelero_real',
  mastin_de_hierro: 'sabueso_de_cadenas',
  verdugo_encapuchado: 'penitente_de_hierro',
  penitente_encadenado: 'penitente_de_hierro',
  juez_del_cadalso: 'inquisidor_escarlata',
  gran_inquisidor_del_patibulo: 'el_gran_verdugo',
  gran_verdugo_real: 'el_gran_verdugo',
  // Bosque
  espectro_del_claro: 'sombra_de_las_ramas',
  sombra_susurrante: 'sombra_de_las_ramas',
  ciervo_de_niebla: 'ciervo_de_osamenta',
  ciervo_de_hueso: 'ciervo_de_osamenta',
  lenador_hueco: 'lobo_de_niebla',
  dama_del_sauce_blanco: 'cazador_espectral',
  ciervo_blanco_de_los_susurros: 'venado_de_la_corona_negra',
  senor_de_la_asta_palida: 'venado_de_la_corona_negra',
  // Alcantarillas
  rata_de_plaga: 'rata_de_peste',
  rata_de_alquimia: 'rata_de_peste',
  contrabandista_infecto: 'contrabandista_mutado',
  masa_corrosiva: 'limo_de_cloaca',
  rey_de_las_compuertas: 'alquimista_de_los_desagues',
  abominacion_del_canal_real: 'rey_de_las_ratas',
  abominacion_del_colector: 'hidra_de_residuos',
  // Biblioteca
  archivero_ciego: 'escriba_sin_rostro',
  tomo_viviente: 'grimorio_animado',
  tomo_voraz: 'grimorio_animado',
  custodio_de_cera: 'custodio_de_tinta',
  archivero_del_sello: 'archivero_sellado',
  gran_archivero_del_indice: 'censor_del_silencio',
  el_lector_eterno: 'devorador_de_nombres',
  // Astrólogo
  tejedor_astral: 'acolito_del_zodiaco',
  acolito_del_eclipse: 'acolito_del_zodiaco',
  centinela_celeste: 'esfera_armilar',
  esfera_armilar_chaman: 'esfera_armilar',
  espectro_cenital: 'homunculo_de_eter',
  homunculo_astral: 'homunculo_de_eter',
  centinela_de_laton: 'centinela_de_cometa',
  cartografo_del_vacio: 'tejedor_de_constelaciones',
  tejedor_del_vacio: 'tejedor_de_constelaciones',
  oraculo_del_eclipse_eterno: 'arconte_del_cenit',
  oraculo_del_eclipse: 'arconte_del_cenit',
  el_gran_astrologo: 'observador_del_infinito',
  // Colmena
  zangano_de_quitina: 'zangano_aguijon',
  zangano_lancero: 'zangano_aguijon',
  obrera_acida: 'obrera_de_quitina',
  obrera_quitina: 'obrera_de_quitina',
  larva_explosiva: 'escarabajo_acido',
  guardia_real_ambar: 'guardia_pretoriano',
  matriarca_de_la_colmena: 'reina_de_la_progenie',
  soberana_del_enjambre: 'reina_de_la_progenie',
  // Cristal
  golem_de_cuarzo: 'centinela_de_geoda',
  golem_cuarzo: 'centinela_de_geoda',
  esquirla_animada: 'fragmento_resonante',
  espectro_prismatico: 'espectro_de_prisma',
  espectro_refractado: 'espectro_de_prisma',
  cantor_de_cristal: 'cantor_de_refraccion',
  arconte_del_prisma_eterno: 'coloso_prismatico',
  arconte_del_cuarzo: 'serafin_de_cuarzo',
  // Prisión
  espectro_encadenado: 'alma_enjaulada',
  jaula_andante: 'alma_enjaulada',
  torturador_del_bloque: 'torturador_ciego',
  vigia_del_panoptico: 'torturador_ciego',
  carcelero_de_almas: 'alcaide_de_hierro',
  alcaide_de_las_mil_cadenas: 'carcelero_eterno',
  el_primer_condenado: 'juez_de_las_cadenas',
  // Sangre
  acolito_de_sangre: 'acolito_carmesi',
  cantor_del_caliz: 'acolito_carmesi',
  flagelante_carmesi: 'flagelante_del_caliz',
  sabueso_de_altar: 'murcielago_vampirico',
  caballero_carmesi: 'caballero_de_la_arteria',
  obispo_desangrado: 'sacerdotisa_hemo',
  cardenal_del_caliz_rojo: 'cardenal_desollado',
  cardenal_de_la_espina: 'cardenal_desollado',
  // Ciudad Sepultada
  momia_del_desierto: 'guardia_momificado',
  guardian_del_obelisco: 'escarabajo_de_lapislazuli',
  escorpion_de_bronce: 'escarabajo_de_lapislazuli',
  sombra_del_obelisk: 'chacal_de_arena',
  visir_de_ceniza: 'usurpador_dorado',
  faraon_de_las_arenas_negras: 'faraon_sin_sol',
  // Espejos
  reflejo_hostil: 'doble_fragmentado',
  dama_del_espejo: 'dama_de_azogue',
  bailarina_de_azogue: 'dama_de_azogue',
  mascara_de_porcelana: 'bufon_de_ilusion',
  duque_del_azogue: 'duelista_del_reflejo',
  soberana_del_salon_espejado: 'monarca_de_los_reflejos',
  la_reina_fragmentada: 'monarca_de_los_reflejos',
  // Heladas
  lobo_de_escarcha_legacy: 'lobo_de_escarcha',
  espectro_ventisca: 'espectro_de_ventisca',
  aparecido_glacial: 'guerrero_congelado',
  gigante_del_glaciar: 'troll_de_glaciar',
  alfa_de_la_ventisca_eterna: 'behemoth_de_permafrost',
  wyrm_de_la_escarcha: 'senor_del_alud',
  // Goblin
  saqueador_goblin: 'lancero_chatarra',
  lancero_saqueador: 'lancero_chatarra',
  piromano_de_empalizada: 'piromano_de_barril',
  artificiero_goblin: 'piromano_de_barril',
  domador_de_huargos: 'jinete_de_huargo',
  caudillo_chatarrero: 'chaman_del_totem',
  gran_caudillo_rompehuesos: 'caudillo_corona_de_hierro',
  rey_de_la_chatarra: 'caudillo_corona_de_hierro',
  // Gigantes
  coloso_de_hueso: 'esqueleto_colosal',
  esqueleto_gigante: 'esqueleto_colosal',
  saqueador_de_medula: 'craneo_errante',
  cuervo_de_osario: 'mano_desenterrada',
  portador_de_lapida: 'guardian_de_la_fosa',
  portador_del_femur: 'titan_decapitado',
  titan_del_cementerio_antiguo: 'rey_del_osario',
  el_ultimo_titan_hueco: 'rey_del_osario',
  // Abismo & Miniboss aliases
  heraldo_del_vacio_legacy: 'heraldo_del_vacio',
  heraldo_sin_forma: 'heraldo_del_vacio',
  sombra_abisal: 'sombra_devoradora',
  sombra_del_umbral: 'sombra_devoradora',
  caballero_del_vacio: 'testigo_ciego',
  arquitecto_de_la_grieta: 'caballero_del_eclipse',
  senor_del_umbral_abisal: 'el_primer_caido',
  el_que_duerme_abajo: 'corazon_de_la_cripta',
  comandante_del_sepulcro: 'senor_del_osario',
  reina_fungica_menor: 'matriarca_fungica',
  forjador_maldito: 'titan_del_crisol',
  capataz_de_la_veta: 'perforador_profundo',
  gran_inquisidor_del_cadalso: 'el_gran_verdugo',
  ciervo_de_las_almas: 'venado_de_la_corona_negra',
  rey_de_la_cloaca: 'rey_de_las_ratas',
  archivista_encadenado: 'censor_del_silencio',
  pretor_de_quitina: 'reina_de_la_progenie',
  arconte_prismatico: 'coloso_prismatico',
  alcaide_de_las_cadenas: 'carcelero_eterno',
  cardenal_carmesi: 'cardenal_desollado',
  faraon_de_ceniza: 'faraon_sin_sol',
  regente_del_reflejo: 'monarca_de_los_reflejos',
  alfa_de_la_escarcha: 'behemoth_de_permafrost',
  caudillo_rompehuesos: 'caudillo_corona_de_hierro',
  titan_de_osario: 'coloso_de_femures',
  heraldo_del_velo: 'el_primer_caido',
  esquirla_del_vacio_chaman: 'fragmento_resonante',
};

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getBiomeBestiaryEntries(dungeonId: CriptaDungeonId): {
  normals: CriptaCreatureVisualBlueprint[];
  elites: CriptaCreatureVisualBlueprint[];
  minibosses: CriptaCreatureVisualBlueprint[];
} {
  const specs = DUNGEON_CREATURE_SPECS[dungeonId] || DUNGEON_CREATURE_SPECS.catacumbas_del_rey;
  const all = specs.map((s) => CRIPTA_BIOME_BESTIARY_BY_SLUG[s[0]]).filter(Boolean);
  return {
    normals: all.filter((e) => e.tier === 'NORMAL'),
    elites: all.filter((e) => e.tier === 'ELITE'),
    minibosses: all.filter((e) => e.tier === 'MINIBOSS'),
  };
}

/**
 * Resolves ANY CriptaRoomEnemy to its unique CriptaCreatureVisualBlueprint.
 * Guarantees that every canonical enemy slug/name renders a distinct creature design.
 */
export function resolveEnemyVisualBlueprint(
  enemy: Partial<
    Pick<
      CriptaRoomEnemy,
      | 'id'
      | 'slug'
      | 'name'
      | 'isBoss'
      | 'isFinalBoss'
      | 'bossPhase'
      | 'isMiniboss'
      | 'isElite'
      | 'spriteArchetype'
    >
  >,
  dungeonId?: CriptaDungeonId | null
): CriptaCreatureVisualBlueprint {
  const rawSlug = normalizeText(enemy.slug || '');
  if (enemy.isFinalBoss) {
    if (
      rawSlug.includes('rey_osario') ||
      rawSlug.includes('vexaris') ||
      rawSlug.includes('necropolis')
    ) {
      return enemy.bossPhase === 2
        ? CRIPTA_BIOME_BESTIARY_BY_SLUG['rey_osario_primordial_p2']
        : CRIPTA_BIOME_BESTIARY_BY_SLUG['rey_osario_primordial'];
    }
    if (
      rawSlug.includes('emperatriz') ||
      rawSlug.includes('nyxara') ||
      rawSlug.includes('corona_sangrienta')
    ) {
      return enemy.bossPhase === 2
        ? CRIPTA_BIOME_BESTIARY_BY_SLUG['emperatriz_del_eclipse_carmesi_p2']
        : CRIPTA_BIOME_BESTIARY_BY_SLUG['emperatriz_del_eclipse_carmesi'];
    }
    return enemy.bossPhase === 2
      ? CRIPTA_BIOME_BESTIARY_BY_SLUG['soberano_del_umbral_p2']
      : CRIPTA_BIOME_BESTIARY_BY_SLUG['soberano_del_umbral'];
  }

  if (CRIPTA_BIOME_BESTIARY_BY_SLUG[rawSlug]) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[rawSlug];
  }
  if (LEGACY_SLUG_ALIAS_MAP[rawSlug] && CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[rawSlug]]) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[rawSlug]];
  }

  const normName = normalizeText(enemy.name || '');
  if (CRIPTA_BIOME_BESTIARY_BY_SLUG[normName]) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[normName];
  }
  if (LEGACY_SLUG_ALIAS_MAP[normName] && CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[normName]]) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[normName]];
  }

  // Strip appended role suffixes like "_chaman" if needed after checking exact aliases
  const strippedName = normName.replace(/_chaman$/, '');
  if (CRIPTA_BIOME_BESTIARY_BY_SLUG[strippedName]) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[strippedName];
  }
  if (
    LEGACY_SLUG_ALIAS_MAP[strippedName] &&
    CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[strippedName]]
  ) {
    return CRIPTA_BIOME_BESTIARY_BY_SLUG[LEGACY_SLUG_ALIAS_MAP[strippedName]];
  }

  // Fuzzy match against bestiary names
  for (const bp of Object.values(CRIPTA_BIOME_BESTIARY_BY_SLUG)) {
    const bpNorm = normalizeText(bp.name);
    if (bpNorm === normName || bpNorm === strippedName) {
      return bp;
    }
  }

  // Biome-aware fallback that picks a distinct entry by enemy id hash so two enemies in the same room never collide
  const resolvedDungeon = dungeonId || 'catacumbas_del_rey';
  const pool = getBiomeBestiaryEntries(resolvedDungeon);
  let hash = 0;
  const seedStr = `${enemy.id}_${enemy.slug}_${enemy.name}`;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  if (enemy.isMiniboss || enemy.isBoss) {
    return pool.minibosses[hash % Math.max(1, pool.minibosses.length)] || pool.normals[0];
  }
  if (enemy.isElite) {
    return pool.elites[hash % Math.max(1, pool.elites.length)] || pool.normals[0];
  }
  return pool.normals[hash % Math.max(1, pool.normals.length)];
}

export type CriptaMinibossArenaBlueprint = CriptaMinibossArenaDefinition;
export const CRIPTA_MINIBOSS_ARENAS_REGISTRY = CRIPTA_MINIBOSS_ARENAS;


