import React from 'react';
import {
  CriptaCreatureVisualBlueprint,
} from '../../data/la-cripta/criptaBiomeBestiary';

interface UniqueBiomeSpriteSvgProps {
  blueprint: CriptaCreatureVisualBlueprint;
  torsoY: number;
  headY: number;
  armL: number;
  armR: number;
  wingSpread: number;
  pulse: boolean;
}

type BodyLayout =
  | 'BIPED_WARRIOR'
  | 'ROBED_CASTER'
  | 'FLOATING_WRAITH'
  | 'SWARM_CLUSTER'
  | 'COLOSSAL_BRUTE'
  | 'QUADRUPED_BEAST'
  | 'SERPENT_HYDRA'
  | 'ARACHNID_CRAWLER'
  | 'GEOMETRIC_CONSTRUCT'
  | 'WINGED_CREATURE'
  | 'PULSING_MASS';

type HeadAccessory =
  | 'SKULL'
  | 'CROWN'
  | 'HOOD'
  | 'HORNS'
  | 'ANTLERS'
  | 'MUSHROOM'
  | 'HELM_VISOR'
  | 'CAGE_HELM'
  | 'PLAGUE_MASK'
  | 'ANUBIS'
  | 'MITRE'
  | 'JESTER'
  | 'MULTI_EYE'
  | 'HEADLESS'
  | 'FANG_MAW'
  | 'ASTRAL_RING';

type WeaponProp =
  | 'SPEAR_HALBERD'
  | 'GREAT_SWORD'
  | 'EXECUTION_AXE'
  | 'HEAVY_HAMMER'
  | 'PICKAXE'
  | 'DRILL'
  | 'RITUAL_STAFF'
  | 'TOTEM_POLE'
  | 'GREAT_SHIELD'
  | 'BRONZE_BELL'
  | 'CHAIN_BALL'
  | 'WHIP_VINE'
  | 'ANCHOR'
  | 'LONGBOW'
  | 'ALCHEMICAL_FLASK'
  | 'CHALICE'
  | 'SCALES'
  | 'KHOPESH'
  | 'RAPIER'
  | 'POWDER_KEG'
  | 'TOMBSTONE'
  | 'SCYTHE_CLAWS'
  | 'NONE';

type BackSilhouette =
  | 'NONE'
  | 'CAPE'
  | 'SPORE_PODS'
  | 'FURNACE_PIPES'
  | 'CORAL_FINS'
  | 'CRYSTAL_SHARDS'
  | 'CHAINS'
  | 'BRANCHES'
  | 'WINGS_BAT'
  | 'WINGS_INSECT'
  | 'WINGS_SERAPH'
  | 'MIRROR_FRAME'
  | 'ICE_SPIKES'
  | 'BANNER_POLE'
  | 'ASTRAL_HALO'
  | 'EXTRA_HEADS';

interface decomposedAnatomy {
  body: BodyLayout;
  head: HeadAccessory;
  weapon: WeaponProp;
  back: BackSilhouette;
}

function decomposeSilhouette(
  s: CriptaCreatureVisualBlueprint['silhouetteType']
): decomposedAnatomy {
  switch (s) {
    // 1. Catacumbas
    case 'SKELETAL_SPEAR_GUARD':
      return { body: 'BIPED_WARRIOR', head: 'SKULL', weapon: 'SPEAR_HALBERD', back: 'CAPE' };
    case 'BONE_TOTEM_SHAMAN':
      return { body: 'ROBED_CASTER', head: 'HORNS', weapon: 'TOTEM_POLE', back: 'NONE' };
    case 'FLOATING_ASH_WRAITH':
      return { body: 'FLOATING_WRAITH', head: 'HOOD', weapon: 'SCYTHE_CLAWS', back: 'CHAINS' };
    case 'CRYPT_SCARAB_SWARM':
      return { body: 'SWARM_CLUSTER', head: 'FANG_MAW', weapon: 'NONE', back: 'WINGS_INSECT' };
    case 'TOMB_GREATSHIELD_KNIGHT':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'GREAT_SHIELD', back: 'CAPE' };
    case 'BELL_DIRGE_CHANTER':
      return { body: 'ROBED_CASTER', head: 'HOOD', weapon: 'BRONZE_BELL', back: 'CHAINS' };
    case 'OSSUARY_THRONE_LORD':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'GREAT_SWORD', back: 'BANNER_POLE' };
    case 'CROWNED_LICH_REGENT':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'ASTRAL_HALO' };

    // 2. Jardín Podrido
    case 'WALKING_MYCELIUM_SHROOM':
      return { body: 'COLOSSAL_BRUTE', head: 'MUSHROOM', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'BLOATED_ROT_GRUB':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'THORN_LASHER_VINE':
      return { body: 'SERPENT_HYDRA', head: 'HORNS', weapon: 'WHIP_VINE', back: 'BRANCHES' };
    case 'CARRION_BLIGHT_FLY':
      return { body: 'WINGED_CREATURE', head: 'MULTI_EYE', weapon: 'SCYTHE_CLAWS', back: 'WINGS_INSECT' };
    case 'SPORE_HULK_COLOSSUS':
      return { body: 'COLOSSAL_BRUTE', head: 'MUSHROOM', weapon: 'HEAVY_HAMMER', back: 'BRANCHES' };
    case 'FUNGAL_VEIL_MATRON':
      return { body: 'ROBED_CASTER', head: 'MUSHROOM', weapon: 'RITUAL_STAFF', back: 'SPORE_PODS' };
    case 'PULSING_ROT_HEART':
      return { body: 'PULSING_MASS', head: 'MULTI_EYE', weapon: 'WHIP_VINE', back: 'BRANCHES' };
    case 'EMPRESS_MYCELIA':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'WHIP_VINE', back: 'SPORE_PODS' };

    // 3. Forja Infernal
    case 'SLAG_PISTON_AUTOMATON':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'HEAVY_HAMMER', back: 'FURNACE_PIPES' };
    case 'ASH_ANVIL_BLACKSMITH':
      return { body: 'BIPED_WARRIOR', head: 'HORNS', weapon: 'HEAVY_HAMMER', back: 'CHAINS' };
    case 'MOLTEN_CRUCIBLE_NEWT':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'NONE', back: 'FURNACE_PIPES' };
    case 'ANIMATED_RUNE_HAMMER':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'ASTRAL_RING', weapon: 'HEAVY_HAMMER', back: 'ASTRAL_HALO' };
    case 'PYROCLAST_CENTURION':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'GREAT_SHIELD', back: 'FURNACE_PIPES' };
    case 'LIVING_FURNACE_ANVIL':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'CAGE_HELM', weapon: 'HEAVY_HAMMER', back: 'FURNACE_PIPES' };
    case 'CRUCIBLE_MAGMA_TITAN':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'EXECUTION_AXE', back: 'FURNACE_PIPES' };
    case 'FOUNDRY_OVERLORD':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'CHAIN_BALL', back: 'FURNACE_PIPES' };

    // 4. Templo Sumergido
    case 'ABYSSAL_GILL_ACOLYTE':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'RITUAL_STAFF', back: 'CORAL_FINS' };
    case 'TRENCH_SHOCK_EEL':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'NONE', back: 'CORAL_FINS' };
    case 'BARNACLE_CORAL_SENTINEL':
      return { body: 'COLOSSAL_BRUTE', head: 'CAGE_HELM', weapon: 'GREAT_SHIELD', back: 'CORAL_FINS' };
    case 'TIDAL_CONCH_SIREN':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'CHALICE', back: 'CORAL_FINS' };
    case 'ANCHOR_DROWNED_TEMPLAR':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'ANCHOR', back: 'CHAINS' };
    case 'BRINE_TWO_HEAD_HYDRA':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'NONE', back: 'EXTRA_HEADS' };
    case 'ABYSSAL_PEARL_ORACLE':
      return { body: 'FLOATING_WRAITH', head: 'ASTRAL_RING', weapon: 'RITUAL_STAFF', back: 'ASTRAL_HALO' };
    case 'ALTAR_LEVIATHAN_COIL':
      return { body: 'SERPENT_HYDRA', head: 'CROWN', weapon: 'SPEAR_HALBERD', back: 'CORAL_FINS' };

    // 5. Minas Abandonadas
    case 'HUSK_PICKAXE_MINER':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'PICKAXE', back: 'NONE' };
    case 'VEIN_CRYSTAL_SPIDER':
      return { body: 'ARACHNID_CRAWLER', head: 'MULTI_EYE', weapon: 'SCYTHE_CLAWS', back: 'CRYSTAL_SHARDS' };
    case 'SONIC_CAVE_WYRM_BAT':
      return { body: 'WINGED_CREATURE', head: 'FANG_MAW', weapon: 'NONE', back: 'WINGS_BAT' };
    case 'BLIND_MOLE_CLAW_DIGGER':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'SCYTHE_CLAWS', back: 'NONE' };
    case 'FIREDAMP_LANTERN_FOREMAN':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'POWDER_KEG', back: 'CHAINS' };
    case 'PYRITE_CRAG_GOLEM':
      return { body: 'COLOSSAL_BRUTE', head: 'HEADLESS', weapon: 'HEAVY_HAMMER', back: 'CRYSTAL_SHARDS' };
    case 'SEAM_WORM_DEVOURER':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'DRILL', back: 'CRYSTAL_SHARDS' };
    case 'DRILL_JUGGERNAUT_BOSS':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'DRILL', back: 'FURNACE_PIPES' };

    // 6. Castillo del Verdugo
    case 'KEYRING_DUNGEON_JAILER':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'CHAIN_BALL', back: 'CHAINS' };
    case 'SPIKED_CHAIN_MASTIFF':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'NONE', back: 'CHAINS' };
    case 'IRON_CAGE_PENITENT':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'GREAT_SWORD', back: 'NONE' };
    case 'GALLOWS_CARRION_CROW':
      return { body: 'WINGED_CREATURE', head: 'PLAGUE_MASK', weapon: 'SCYTHE_CLAWS', back: 'WINGS_BAT' };
    case 'SCARLET_BRAND_INQUISITOR':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'SPEAR_HALBERD', back: 'CAPE' };
    case 'IRON_MAIDEN_CONSTRUCT':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'CAGE_HELM', weapon: 'CHAIN_BALL', back: 'CHAINS' };
    case 'GRAND_HOODED_EXECUTIONER':
      return { body: 'COLOSSAL_BRUTE', head: 'HOOD', weapon: 'EXECUTION_AXE', back: 'CAPE' };
    case 'SCAFFOLD_GUILLOTINE_LORD':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'EXECUTION_AXE', back: 'BANNER_POLE' };

    // 7. Bosque de los Susurros
    case 'ANTLER_SKULL_STAG':
      return { body: 'QUADRUPED_BEAST', head: 'ANTLERS', weapon: 'NONE', back: 'BRANCHES' };
    case 'BRANCH_CLAW_LURKER':
      return { body: 'BIPED_WARRIOR', head: 'HORNS', weapon: 'SCYTHE_CLAWS', back: 'BRANCHES' };
    case 'MIST_HOWLER_WOLF':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'NONE', back: 'NONE' };
    case 'LANTERN_WISP_CLUSTER':
      return { body: 'SWARM_CLUSTER', head: 'ASTRAL_RING', weapon: 'NONE', back: 'ASTRAL_HALO' };
    case 'HOLLOW_BARK_TREANT':
      return { body: 'COLOSSAL_BRUTE', head: 'ANTLERS', weapon: 'WHIP_VINE', back: 'BRANCHES' };
    case 'SPECTRAL_LONGBOW_HUNTER':
      return { body: 'BIPED_WARRIOR', head: 'HOOD', weapon: 'LONGBOW', back: 'CAPE' };
    case 'ROOT_HEART_ARCHDRUID':
      return { body: 'ROBED_CASTER', head: 'ANTLERS', weapon: 'RITUAL_STAFF', back: 'BRANCHES' };
    case 'BLACK_CROWN_WENDIGO_STAG':
      return { body: 'COLOSSAL_BRUTE', head: 'ANTLERS', weapon: 'SCYTHE_CLAWS', back: 'ASTRAL_HALO' };

    // 8. Alcantarillas Imperiales
    case 'PLAGUE_RAT_PACK':
      return { body: 'SWARM_CLUSTER', head: 'FANG_MAW', weapon: 'NONE', back: 'NONE' };
    case 'TOXIC_GRATE_SLIME':
      return { body: 'PULSING_MASS', head: 'SKULL', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'MUTATED_PIPE_SMUGGLER':
      return { body: 'BIPED_WARRIOR', head: 'HOOD', weapon: 'ANCHOR', back: 'SPORE_PODS' };
    case 'BLOATED_CANAL_LEECH':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'NONE', back: 'NONE' };
    case 'SLUDGE_GRAFT_ABOMINATION':
      return { body: 'COLOSSAL_BRUTE', head: 'MULTI_EYE', weapon: 'CHAIN_BALL', back: 'SPORE_PODS' };
    case 'SEWER_PLAGUE_APOTHECARY':
      return { body: 'ROBED_CASTER', head: 'PLAGUE_MASK', weapon: 'ALCHEMICAL_FLASK', back: 'SPORE_PODS' };
    case 'CROWNED_RAT_KING':
      return { body: 'SWARM_CLUSTER', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'BANNER_POLE' };
    case 'EFFLUENT_THREE_NECK_HYDRA':
      return { body: 'SERPENT_HYDRA', head: 'FANG_MAW', weapon: 'NONE', back: 'EXTRA_HEADS' };

    // 9. Biblioteca Prohibida
    case 'TEETH_GRIMOIRE_MIMIC':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'FANG_MAW', weapon: 'NONE', back: 'ASTRAL_HALO' };
    case 'FACELESS_QUILL_SCRIBE':
      return { body: 'ROBED_CASTER', head: 'HOOD', weapon: 'RAPIER', back: 'CAPE' };
    case 'PARCHMENT_SILK_MOTH':
      return { body: 'WINGED_CREATURE', head: 'ANTLERS', weapon: 'NONE', back: 'WINGS_INSECT' };
    case 'INK_TENDRIL_CUSTODIAN':
      return { body: 'FLOATING_WRAITH', head: 'MULTI_EYE', weapon: 'WHIP_VINE', back: 'NONE' };
    case 'CHAINED_ARCHIVE_KEEPER':
      return { body: 'ROBED_CASTER', head: 'CAGE_HELM', weapon: 'TOMBSTONE', back: 'CHAINS' };
    case 'GARGOYLE_LECTERN_STATUE':
      return { body: 'COLOSSAL_BRUTE', head: 'HORNS', weapon: 'TOMBSTONE', back: 'WINGS_BAT' };
    case 'SILENCE_BELL_CENSOR':
      return { body: 'FLOATING_WRAITH', head: 'MITRE', weapon: 'BRONZE_BELL', back: 'CHAINS' };
    case 'VOID_TOME_NAME_EATER':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'MULTI_EYE', weapon: 'WHIP_VINE', back: 'WINGS_SERAPH' };

    // 10. Torre del Astrólogo
    case 'ZODIAC_STARMAP_ACOLYTE':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'RITUAL_STAFF', back: 'ASTRAL_HALO' };
    case 'BRASS_ARMILLARY_SPHERE':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'ASTRAL_RING', weapon: 'NONE', back: 'ASTRAL_HALO' };
    case 'AETHER_FLASK_HOMUNCULUS':
      return { body: 'FLOATING_WRAITH', head: 'ASTRAL_RING', weapon: 'ALCHEMICAL_FLASK', back: 'NONE' };
    case 'COMET_HALBERD_SENTINEL':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'SPEAR_HALBERD', back: 'ASTRAL_HALO' };
    case 'CONSTELLATION_LOOM_WEAVER':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'WINGS_SERAPH' };
    case 'SOLAR_ECLIPSE_WARDEN':
      return { body: 'COLOSSAL_BRUTE', head: 'ASTRAL_RING', weapon: 'GREAT_SHIELD', back: 'ASTRAL_HALO' };
    case 'ZENITH_ASTROLABLE_ARCHON':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'ASTRAL_HALO' };
    case 'INFINITE_OCULUS_OBSERVER':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'MULTI_EYE', weapon: 'NONE', back: 'WINGS_SERAPH' };

    // 11. La Colmena
    case 'CHITIN_SCYTHE_WORKER':
      return { body: 'ARACHNID_CRAWLER', head: 'HORNS', weapon: 'SCYTHE_CLAWS', back: 'NONE' };
    case 'WASP_STINGER_DRONE':
      return { body: 'WINGED_CREATURE', head: 'MULTI_EYE', weapon: 'SPEAR_HALBERD', back: 'WINGS_INSECT' };
    case 'ACID_CARAPACE_BEETLE':
      return { body: 'ARACHNID_CRAWLER', head: 'HORNS', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'BROOD_SAC_LARVA':
      return { body: 'PULSING_MASS', head: 'FANG_MAW', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'MANTIS_PRAETORIAN_GUARD':
      return { body: 'COLOSSAL_BRUTE', head: 'HORNS', weapon: 'SCYTHE_CLAWS', back: 'WINGS_INSECT' };
    case 'AMBER_SILK_ARACHNID':
      return { body: 'ARACHNID_CRAWLER', head: 'MULTI_EYE', weapon: 'WHIP_VINE', back: 'SPORE_PODS' };
    case 'ROYAL_OVIPOSITOR_QUEEN':
      return { body: 'PULSING_MASS', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'WINGS_INSECT' };
    case 'FOUR_WING_SWARM_TYRANT':
      return { body: 'WINGED_CREATURE', head: 'CROWN', weapon: 'SCYTHE_CLAWS', back: 'WINGS_INSECT' };

    // 12. Cripta de Cristal
    case 'PRISM_REFRACT_WRAITH':
      return { body: 'FLOATING_WRAITH', head: 'ASTRAL_RING', weapon: 'NONE', back: 'CRYSTAL_SHARDS' };
    case 'QUARTZ_PINCER_SCORPION':
      return { body: 'ARACHNID_CRAWLER', head: 'HORNS', weapon: 'SCYTHE_CLAWS', back: 'CRYSTAL_SHARDS' };
    case 'GEODE_OBELISK_SENTINEL':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'ASTRAL_RING', weapon: 'GREAT_SHIELD', back: 'CRYSTAL_SHARDS' };
    case 'RESONATING_SHARD_CLUSTER':
      return { body: 'SWARM_CLUSTER', head: 'ASTRAL_RING', weapon: 'NONE', back: 'CRYSTAL_SHARDS' };
    case 'DIAMOND_AEGIS_PALADIN':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'GREAT_SHIELD', back: 'CRYSTAL_SHARDS' };
    case 'CHIME_CRYSTAL_CHANTER':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'BRONZE_BELL', back: 'CRYSTAL_SHARDS' };
    case 'PRISMATIC_MONOLITH_COLOSSUS':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'HEAVY_HAMMER', back: 'CRYSTAL_SHARDS' };
    case 'SIX_WING_QUARTZ_SERAPH':
      return { body: 'WINGED_CREATURE', head: 'CROWN', weapon: 'SPEAR_HALBERD', back: 'WINGS_SERAPH' };

    // 13. Prisión Maldita
    case 'SHACKLED_BALL_PRISONER':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'CHAIN_BALL', back: 'CHAINS' };
    case 'BLINDFOLD_PINCER_TORTURER':
      return { body: 'BIPED_WARRIOR', head: 'HOOD', weapon: 'SCYTHE_CLAWS', back: 'NONE' };
    case 'HANGING_CAGE_SOUL':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'SKULL', weapon: 'NONE', back: 'CHAINS' };
    case 'JAW_COLLAR_CELL_HOUND':
      return { body: 'QUADRUPED_BEAST', head: 'CAGE_HELM', weapon: 'NONE', back: 'CHAINS' };
    case 'IRON_KEY_WARDEN':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'HEAVY_HAMMER', back: 'CHAINS' };
    case 'BELL_YOKE_FLAGELANT':
      return { body: 'COLOSSAL_BRUTE', head: 'CAGE_HELM', weapon: 'BRONZE_BELL', back: 'CHAINS' };
    case 'ETERNAL_SHACKLE_OVERSEER':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'CHAIN_BALL', back: 'CHAINS' };
    case 'GALLOWS_SCALES_JUDGE':
      return { body: 'FLOATING_WRAITH', head: 'MITRE', weapon: 'SCALES', back: 'CHAINS' };

    // 14. Santuario de Sangre
    case 'CRIMSON_CHALICE_ACOLYTE':
      return { body: 'ROBED_CASTER', head: 'HOOD', weapon: 'CHALICE', back: 'CAPE' };
    case 'GORGED_VAMPIRE_STRIGOI':
      return { body: 'WINGED_CREATURE', head: 'FANG_MAW', weapon: 'SCYTHE_CLAWS', back: 'WINGS_BAT' };
    case 'THORN_WHIP_FLAGELLANT':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'WHIP_VINE', back: 'NONE' };
    case 'EXSANGUINATED_HUSK_THRALL':
      return { body: 'BIPED_WARRIOR', head: 'SKULL', weapon: 'SCYTHE_CLAWS', back: 'NONE' };
    case 'ARTERIAL_LANCE_KNIGHT':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'SPEAR_HALBERD', back: 'CAPE' };
    case 'HEMO_CENSER_PRIESTESS':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'CHALICE', back: 'ASTRAL_HALO' };
    case 'FLAYED_MITRE_CARDINAL':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'RITUAL_STAFF', back: 'WINGS_BAT' };
    case 'OVERFLOWING_GRAIL_AVATAR':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'CHALICE', back: 'WINGS_SERAPH' };

    // 15. Ciudad Sepultada
    case 'KHOPESH_MUMMY_GUARD':
      return { body: 'BIPED_WARRIOR', head: 'SKULL', weapon: 'KHOPESH', back: 'CAPE' };
    case 'LAPIS_SCARAB_CONSTRUCT':
      return { body: 'ARACHNID_CRAWLER', head: 'ASTRAL_RING', weapon: 'NONE', back: 'WINGS_INSECT' };
    case 'SAND_URN_HIEROPHANT':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'CHALICE', back: 'ASTRAL_HALO' };
    case 'ANUBIS_DUNE_JACKAL':
      return { body: 'QUADRUPED_BEAST', head: 'ANUBIS', weapon: 'KHOPESH', back: 'NONE' };
    case 'GILDED_MASK_USURPER':
      return { body: 'BIPED_WARRIOR', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'CAPE' };
    case 'FRACTURED_WING_SPHINX':
      return { body: 'QUADRUPED_BEAST', head: 'CROWN', weapon: 'NONE', back: 'WINGS_SERAPH' };
    case 'SUNLESS_SARCOPHAGUS_PHARAOH':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'KHOPESH', back: 'ASTRAL_HALO' };
    case 'OBELISK_SAND_COLOSSUS':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'ASTRAL_RING', weapon: 'TOMBSTONE', back: 'ASTRAL_HALO' };

    // 16. Palacio de los Espejos
    case 'SHATTERED_DOPPELGANGER':
      return { body: 'BIPED_WARRIOR', head: 'JESTER', weapon: 'RAPIER', back: 'MIRROR_FRAME' };
    case 'QUICKSILVER_GOWN_LADY':
      return { body: 'FLOATING_WRAITH', head: 'CROWN', weapon: 'NONE', back: 'MIRROR_FRAME' };
    case 'JESTER_TWIN_MASK':
      return { body: 'BIPED_WARRIOR', head: 'JESTER', weapon: 'SCALES', back: 'NONE' };
    case 'FLOATING_MIRROR_BLADE':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'ASTRAL_RING', weapon: 'GREAT_SWORD', back: 'MIRROR_FRAME' };
    case 'SILVER_RAPIER_DUELIST':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'RAPIER', back: 'CAPE' };
    case 'FLOATING_PORCELAIN_MASK':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'JESTER', weapon: 'NONE', back: 'MIRROR_FRAME' };
    case 'THRONE_MIRROR_MONARCH':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'GREAT_SWORD', back: 'MIRROR_FRAME' };
    case 'KALEIDOSCOPE_GRAND_ILLUSIONIST':
      return { body: 'FLOATING_WRAITH', head: 'JESTER', weapon: 'RITUAL_STAFF', back: 'MIRROR_FRAME' };

    // 17. Cavernas Heladas
    case 'FROST_FANG_DIRE_WOLF':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'NONE', back: 'ICE_SPIKES' };
    case 'BLIZZARD_SHROUD_BANSHEE':
      return { body: 'FLOATING_WRAITH', head: 'HOOD', weapon: 'NONE', back: 'ICE_SPIKES' };
    case 'ICICLE_CEILING_CRAWLER':
      return { body: 'ARACHNID_CRAWLER', head: 'HORNS', weapon: 'SCYTHE_CLAWS', back: 'ICE_SPIKES' };
    case 'FROZEN_AXE_DRAUGR':
      return { body: 'BIPED_WARRIOR', head: 'HORNS', weapon: 'EXECUTION_AXE', back: 'ICE_SPIKES' };
    case 'GLACIER_TUSK_TROLL':
      return { body: 'COLOSSAL_BRUTE', head: 'FANG_MAW', weapon: 'HEAVY_HAMMER', back: 'ICE_SPIKES' };
    case 'RIME_ANTLER_CRONE':
      return { body: 'ROBED_CASTER', head: 'ANTLERS', weapon: 'RITUAL_STAFF', back: 'ICE_SPIKES' };
    case 'PERMAFROST_MAMMOTH_BEHEMOTH':
      return { body: 'QUADRUPED_BEAST', head: 'HORNS', weapon: 'NONE', back: 'ICE_SPIKES' };
    case 'AVALANCHE_RUNE_JOTUNN':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'HEAVY_HAMMER', back: 'ICE_SPIKES' };

    // 18. Fortaleza Goblin
    case 'SCRAP_SPEAR_GOBLIN':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'SPEAR_HALBERD', back: 'NONE' };
    case 'POWDER_KEG_BOMBER':
      return { body: 'BIPED_WARRIOR', head: 'HOOD', weapon: 'POWDER_KEG', back: 'FURNACE_PIPES' };
    case 'WARG_MOUNTED_RAIDER':
      return { body: 'QUADRUPED_BEAST', head: 'HORNS', weapon: 'SPEAR_HALBERD', back: 'BANNER_POLE' };
    case 'BEARTRAP_SNARE_STALKER':
      return { body: 'BIPED_WARRIOR', head: 'HOOD', weapon: 'CHAIN_BALL', back: 'NONE' };
    case 'SKULL_POLE_GOBLIN_SHAMAN':
      return { body: 'ROBED_CASTER', head: 'SKULL', weapon: 'TOTEM_POLE', back: 'BANNER_POLE' };
    case 'BOILER_PLATE_GOBLIN_BRUTE':
      return { body: 'COLOSSAL_BRUTE', head: 'CAGE_HELM', weapon: 'HEAVY_HAMMER', back: 'FURNACE_PIPES' };
    case 'IRON_CROWN_WARBOSS':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'EXECUTION_AXE', back: 'BANNER_POLE' };
    case 'BALLISTA_SIEGE_MASTER':
      return { body: 'COLOSSAL_BRUTE', head: 'HELM_VISOR', weapon: 'LONGBOW', back: 'BANNER_POLE' };

    // 19. Cementerio de Gigantes
    case 'COLOSSAL_RIB_SKELETON':
      return { body: 'COLOSSAL_BRUTE', head: 'SKULL', weapon: 'GREAT_SWORD', back: 'NONE' };
    case 'ROLLING_GIANT_CRANIUM':
      return { body: 'GEOMETRIC_CONSTRUCT', head: 'SKULL', weapon: 'NONE', back: 'ASTRAL_HALO' };
    case 'CRAWLING_TITAN_HAND':
      return { body: 'ARACHNID_CRAWLER', head: 'HEADLESS', weapon: 'SCYTHE_CLAWS', back: 'NONE' };
    case 'GRAVE_RIBCAGE_HOUND':
      return { body: 'QUADRUPED_BEAST', head: 'SKULL', weapon: 'NONE', back: 'ICE_SPIKES' };
    case 'HEADLESS_ATLAS_TITAN':
      return { body: 'COLOSSAL_BRUTE', head: 'HEADLESS', weapon: 'TOMBSTONE', back: 'CHAINS' };
    case 'GRAVESTONE_CHAIN_WARDEN':
      return { body: 'BIPED_WARRIOR', head: 'CAGE_HELM', weapon: 'TOMBSTONE', back: 'CHAINS' };
    case 'FEMUR_PILLAR_COLOSSUS':
      return { body: 'COLOSSAL_BRUTE', head: 'HORNS', weapon: 'HEAVY_HAMMER', back: 'ICE_SPIKES' };
    case 'OSSUARY_CROWN_GIANT_KING':
      return { body: 'COLOSSAL_BRUTE', head: 'CROWN', weapon: 'GREAT_SWORD', back: 'ASTRAL_HALO' };

    // 20. El Abismo
    case 'VOID_HALO_HERALD':
      return { body: 'FLOATING_WRAITH', head: 'ASTRAL_RING', weapon: 'RITUAL_STAFF', back: 'ASTRAL_HALO' };
    case 'ASTRAL_PARASITE_LARVA':
      return { body: 'SERPENT_HYDRA', head: 'MULTI_EYE', weapon: 'NONE', back: 'SPORE_PODS' };
    case 'UMBRAL_MAW_STALKER':
      return { body: 'QUADRUPED_BEAST', head: 'FANG_MAW', weapon: 'SCYTHE_CLAWS', back: 'WINGS_BAT' };
    case 'MANY_EYED_BLIND_WITNESS':
      return { body: 'FLOATING_WRAITH', head: 'MULTI_EYE', weapon: 'NONE', back: 'WINGS_SERAPH' };
    case 'ECLIPSE_GREATSWORD_KNIGHT':
      return { body: 'BIPED_WARRIOR', head: 'HELM_VISOR', weapon: 'GREAT_SWORD', back: 'ASTRAL_HALO' };
    case 'HOLLOW_CHOIR_CHANTER':
      return { body: 'ROBED_CASTER', head: 'MITRE', weapon: 'BRONZE_BELL', back: 'ASTRAL_HALO' };
    case 'BROKEN_WINGS_FIRST_FALLEN':
      return { body: 'WINGED_CREATURE', head: 'CROWN', weapon: 'SPEAR_HALBERD', back: 'WINGS_SERAPH' };
    case 'CHAINED_ABYSSAL_HEART':
    case 'SOVEREIGN_PHASE_1':
    case 'SOVEREIGN_PHASE_2':
    default:
      return { body: 'PULSING_MASS', head: 'CROWN', weapon: 'RITUAL_STAFF', back: 'CHAINS' };
  }
}

export const LaCriptaUniqueBiomeSpriteSvg: React.FC<UniqueBiomeSpriteSvgProps> = ({
  blueprint,
  torsoY,
  headY,
  armL,
  armR,
  wingSpread,
  pulse,
}) => {
  const { primary, secondary, highlight, eyeGlow, metal, dark } = blueprint.palette;
  const anatomy = decomposeSilhouette(blueprint.silhouetteType);
  const isMiniboss = blueprint.tier === 'MINIBOSS' || blueprint.tier === 'FINAL_BOSS';
  const isElite = blueprint.tier === 'ELITE';
  const s = blueprint.silhouetteType;

  // Dedicated full-custom silhouettes for iconic non-humanoid / monster species
  if (s === 'ROLLING_GIANT_CRANIUM') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="14" y="56" width="36" height="4" fill="#040307" opacity="0.8" />
        {/* Emerald Ossuary Flames */}
        <rect x="12" y={10 - wingSpread} width="40" height="36" fill={eyeGlow} opacity="0.35" />
        <rect x="18" y={4 - wingSpread} width="8" height="10" fill={highlight} />
        <rect x="38" y={4 - wingSpread} width="8" height="10" fill={highlight} />
        {/* Colossal Cranium */}
        <rect x="14" y="12" width="36" height="30" fill={primary} />
        <rect x="18" y="10" width="28" height="6" fill={primary} />
        <rect x="18" y="22" width="10" height="10" fill={dark} />
        <rect x="36" y="22" width="10" height="10" fill={dark} />
        <rect x="21" y="25" width="5" height="5" fill={eyeGlow} />
        <rect x="38" y="25" width="5" height="5" fill={eyeGlow} />
        <rect x="30" y="30" width="4" height="6" fill={dark} />
        {/* Giant Jaw & Teeth */}
        <rect x="18" y="42" width="28" height="10" fill={secondary} />
        {[20, 25, 30, 35, 40].map((tx) => (
          <rect key={tx} x={tx} y="41" width="3" height="6" fill={primary} />
        ))}
      </g>
    );
  }

  if (s === 'CRAWLING_TITAN_HAND') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="10" y="56" width="44" height="4" fill="#040307" opacity="0.8" />
        {/* Severed Wrist Stump & Tendons */}
        <rect x="38" y="14" width="14" height="16" fill={secondary} />
        <rect x="40" y="10" width="10" height="6" fill={eyeGlow} />
        {/* Giant Metacarpal Palm */}
        <rect x="18" y="22" width="28" height="18" fill={primary} />
        <rect x="22" y="26" width="20" height="10" fill={secondary} />
        {/* Five Articulated Walking Skeletal Fingers */}
        <rect x="8" y={32 + armL} width="6" height="22" fill={primary} />
        <rect x="16" y={36 - armL} width="6" height="20" fill={primary} />
        <rect x="25" y={38 + armR} width="6" height="18" fill={primary} />
        <rect x="34" y={36 - armR} width="6" height="20" fill={primary} />
        <rect x="44" y={34 + armL} width="6" height="20" fill={primary} />
        {[8, 16, 25, 34, 44].map((fx) => (
          <rect key={fx} x={fx} y="52" width="6" height="4" fill={highlight} />
        ))}
      </g>
    );
  }

  if (s === 'TEETH_GRIMOIRE_MIMIC' || s === 'VOID_TOME_NAME_EATER') {
    return (
      <g transform={`translate(0, ${torsoY + headY})`}>
        <rect x="14" y="56" width="36" height="4" fill="#040307" opacity="0.75" />
        {/* Levitating Open Leather Covers */}
        <rect x={8 - wingSpread} y="14" width="22" height="32" fill={secondary} />
        <rect x={34 + wingSpread} y="14" width="22" height="32" fill={secondary} />
        <rect x={11 - wingSpread} y="17" width="18" height="26" fill="#F5E6C8" />
        <rect x={35 + wingSpread} y="17" width="18" height="26" fill="#F5E6C8" />
        {/* Jagged Mimic Maw & Abyssal Tongue */}
        <rect x="26" y="12" width="12" height="36" fill={dark} />
        {[16, 24, 32, 40].map((ty) => (
          <g key={ty}>
            <rect x="24" y={ty} width="4" height="3" fill="#FFF" />
            <rect x="36" y={ty} width="4" height="3" fill="#FFF" />
          </g>
        ))}
        <rect x="29" y="20" width="6" height="6" fill={eyeGlow} />
        <rect x="30" y="30" width="8" height="18" fill={highlight} />
      </g>
    );
  }

  if (s === 'BRASS_ARMILLARY_SPHERE' || s === 'INFINITE_OCULUS_OBSERVER') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="16" y="56" width="32" height="4" fill="#040307" opacity="0.75" />
        {/* Concentric Rotating Celestial Rings */}
        <rect x="10" y="10" width="44" height="4" fill={highlight} />
        <rect x="10" y="42" width="44" height="4" fill={highlight} />
        <rect x="10" y="10" width="4" height="36" fill={primary} />
        <rect x="50" y="10" width="4" height="36" fill={primary} />
        <rect x="18" y={16 + armL} width="28" height="24" fill={secondary} />
        {/* Central Blazing Astral Eye */}
        <rect x="24" y="22" width="16" height="12" fill="#FFF" />
        <rect x="28" y="24" width="8" height="8" fill={eyeGlow} />
        <rect x="30" y="26" width="4" height="4" fill={dark} />
      </g>
    );
  }

  return (
    <g>
      {/* 1. GROUND SHADOW & MINIBOSS / ELITE FLOOR DAIS */}
      <rect x="12" y="57" width="40" height="4" fill="#040307" opacity="0.78" />
      {isMiniboss && (
        <g>
          <rect x="8" y="55" width="48" height="3" fill={secondary} />
          <rect x="10" y="56" width="44" height="1" fill={highlight} opacity={pulse ? 0.95 : 0.65} />
          <rect x="14" y="53" width="4" height="3" fill={highlight} />
          <rect x="46" y="53" width="4" height="3" fill={highlight} />
        </g>
      )}
      {isElite && !isMiniboss && (
        <rect x="14" y="56" width="36" height="2" fill={highlight} opacity="0.55" />
      )}

      {/* 2. BACK SILHOUETTE LAYER (Wings, Halo, Chains, Banner, Shards, Pipes, Extra Heads) */}
      <g transform={`translate(0, ${torsoY})`}>
        {anatomy.back === 'CAPE' && (
          <g>
            <rect x="16" y="18" width="32" height="34" fill={secondary} />
            <rect x="14" y="24" width="4" height="26" fill={dark} />
            <rect x="46" y="24" width="4" height="26" fill={dark} />
            <rect x="18" y="48" width="6" height="5" fill={secondary} />
            <rect x="40" y="48" width="6" height="5" fill={secondary} />
          </g>
        )}

        {anatomy.back === 'WINGS_BAT' && (
          <g>
            <rect x={6 - wingSpread} y="12" width="14" height="22" fill={secondary} />
            <rect x={4 - wingSpread} y="10" width="6" height="4" fill={highlight} />
            <rect x={8 - wingSpread} y="16" width="10" height="14" fill={primary} opacity="0.75" />
            <rect x={44 + wingSpread} y="12" width="14" height="22" fill={secondary} />
            <rect x={54 + wingSpread} y="10" width="6" height="4" fill={highlight} />
            <rect x={46 + wingSpread} y="16" width="10" height="14" fill={primary} opacity="0.75" />
          </g>
        )}

        {anatomy.back === 'WINGS_INSECT' && (
          <g opacity="0.85">
            <rect x={5 - wingSpread} y="14" width="15" height="10" fill={highlight} opacity="0.45" />
            <rect x={8 - wingSpread} y="25" width="12" height="8" fill={primary} opacity="0.55" />
            <rect x={44 + wingSpread} y="14" width="15" height="10" fill={highlight} opacity="0.45" />
            <rect x={44 + wingSpread} y="25" width="12" height="8" fill={primary} opacity="0.55" />
          </g>
        )}

        {anatomy.back === 'WINGS_SERAPH' && (
          <g>
            <rect x={4 - wingSpread} y="8" width="14" height="8" fill={highlight} />
            <rect x={6 - wingSpread} y="18" width="12" height="8" fill={primary} />
            <rect x={8 - wingSpread} y="28" width="10" height="8" fill={secondary} />
            <rect x={46 + wingSpread} y="8" width="14" height="8" fill={highlight} />
            <rect x={46 + wingSpread} y="18" width="12" height="8" fill={primary} />
            <rect x={46 + wingSpread} y="28" width="10" height="8" fill={secondary} />
          </g>
        )}

        {anatomy.back === 'ASTRAL_HALO' && (
          <g>
            <rect x="16" y="4" width="32" height="3" fill={highlight} opacity={pulse ? 0.95 : 0.65} />
            <rect x="12" y="8" width="4" height="18" fill={highlight} opacity="0.75" />
            <rect x="48" y="8" width="4" height="18" fill={highlight} opacity="0.75" />
            <rect x="30" y="1" width="4" height="4" fill={eyeGlow} />
          </g>
        )}

        {anatomy.back === 'FURNACE_PIPES' && (
          <g>
            <rect x="14" y="10" width="5" height="20" fill={metal} />
            <rect x="15" y="7" width="3" height="4" fill={eyeGlow} opacity={pulse ? 1 : 0.6} />
            <rect x="45" y="10" width="5" height="20" fill={metal} />
            <rect x="46" y="7" width="3" height="4" fill={eyeGlow} opacity={pulse ? 1 : 0.6} />
          </g>
        )}

        {anatomy.back === 'CRYSTAL_SHARDS' && (
          <g>
            <rect x="11" y="12" width="6" height="16" fill={highlight} />
            <rect x="13" y="9" width="3" height="5" fill={eyeGlow} />
            <rect x="47" y="12" width="6" height="16" fill={highlight} />
            <rect x="48" y="9" width="3" height="5" fill={eyeGlow} />
          </g>
        )}

        {anatomy.back === 'ICE_SPIKES' && (
          <g>
            <rect x="12" y="11" width="5" height="15" fill="#BAE6FD" />
            <rect x="17" y="8" width="4" height="12" fill="#38BDF8" />
            <rect x="43" y="8" width="4" height="12" fill="#38BDF8" />
            <rect x="47" y="11" width="5" height="15" fill="#BAE6FD" />
          </g>
        )}

        {anatomy.back === 'SPORE_PODS' && (
          <g>
            <rect x="12" y="15" width="7" height="7" fill={secondary} />
            <rect x="14" y="16" width="3" height="3" fill={eyeGlow} />
            <rect x="45" y="15" width="7" height="7" fill={secondary} />
            <rect x="47" y="16" width="3" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.back === 'CORAL_FINS' && (
          <g>
            <rect x="10" y="14" width="8" height="4" fill={highlight} />
            <rect x="12" y="10" width="4" height="6" fill={eyeGlow} />
            <rect x="46" y="14" width="8" height="4" fill={highlight} />
            <rect x="48" y="10" width="4" height="6" fill={eyeGlow} />
          </g>
        )}

        {anatomy.back === 'BRANCHES' && (
          <g>
            <rect x="10" y="8" width="4" height="18" fill={secondary} />
            <rect x="6" y="11" width="5" height="3" fill={secondary} />
            <rect x="50" y="8" width="4" height="18" fill={secondary} />
            <rect x="53" y="11" width="5" height="3" fill={secondary} />
          </g>
        )}

        {anatomy.back === 'CHAINS' && (
          <g>
            <rect x="11" y="6" width="3" height="32" fill={metal} />
            <rect x="10" y="14" width="5" height="3" fill={dark} />
            <rect x="50" y="6" width="3" height="32" fill={metal} />
            <rect x="49" y="14" width="5" height="3" fill={dark} />
          </g>
        )}

        {anatomy.back === 'MIRROR_FRAME' && (
          <g>
            <rect x="12" y="6" width="40" height="44" fill={secondary} />
            <rect x="14" y="8" width="36" height="40" fill="#0F172A" />
            <rect x="12" y="6" width="40" height="3" fill={highlight} />
            <rect x="12" y="47" width="40" height="3" fill={highlight} />
            <rect x="18" y="12" width="6" height="18" fill={highlight} opacity="0.28" />
          </g>
        )}

        {anatomy.back === 'BANNER_POLE' && (
          <g>
            <rect x="46" y="2" width="3" height="48" fill={metal} />
            <rect x="34" y="4" width="13" height="12" fill={secondary} />
            <rect x="36" y="6" width="8" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.back === 'EXTRA_HEADS' && (
          <g>
            {/* Left Secondary Hydra Neck & Head */}
            <rect x="8" y="16" width="8" height="16" fill={secondary} />
            <rect x="6" y="10" width="12" height="8" fill={primary} />
            <rect x="8" y="12" width="3" height="3" fill={eyeGlow} />
            <rect x="6" y="16" width="8" height="2" fill="#FFF" />
            {/* Right Secondary Hydra Neck & Head */}
            <rect x="48" y="16" width="8" height="16" fill={secondary} />
            <rect x="46" y="10" width="12" height="8" fill={primary} />
            <rect x="53" y="12" width="3" height="3" fill={eyeGlow} />
            <rect x="50" y="16" width="8" height="2" fill="#FFF" />
          </g>
        )}
      </g>

      {/* 3. CORE BODY / TORSO / LEGS LAYER */}
      <g transform={`translate(0, ${torsoY})`}>
        {anatomy.body === 'BIPED_WARRIOR' && (
          <g>
            <rect x="22" y="40" width="6" height="16" fill={secondary} />
            <rect x="36" y="40" width="6" height="16" fill={secondary} />
            <rect x="20" y="53" width="8" height="4" fill={metal} />
            <rect x="36" y="53" width="8" height="4" fill={metal} />
            <rect x="19" y="21" width="26" height="20" fill={primary} />
            <rect x="22" y="23" width="20" height="14" fill={secondary} />
            <rect x="24" y="25" width="16" height="3" fill={highlight} />
            <rect x="24" y="31" width="16" height="2" fill={highlight} opacity="0.7" />
            <rect x="16" y="20" width="6" height="7" fill={metal} />
            <rect x="42" y="20" width="6" height="7" fill={metal} />
          </g>
        )}

        {anatomy.body === 'ROBED_CASTER' && (
          <g>
            <rect x="18" y="22" width="28" height="34" fill={secondary} />
            <rect x="21" y="22" width="22" height="32" fill={primary} />
            <rect x="29" y="24" width="6" height="28" fill={highlight} opacity="0.8" />
            <rect x="16" y="48" width="32" height="6" fill={dark} opacity="0.5" />
          </g>
        )}

        {anatomy.body === 'FLOATING_WRAITH' && (
          <g>
            <rect x="19" y="20" width="26" height="22" fill={primary} />
            <rect x="22" y="22" width="20" height="18" fill={secondary} />
            <rect x="26" y="26" width="12" height="8" fill={eyeGlow} opacity={pulse ? 0.85 : 0.45} />
            {/* Tattered Levitating Tail */}
            <rect x="21" y="42" width="6" height="10" fill={primary} />
            <rect x="29" y="42" width="6" height="13" fill={secondary} />
            <rect x="37" y="42" width="6" height="9" fill={primary} />
          </g>
        )}

        {anatomy.body === 'COLOSSAL_BRUTE' && (
          <g>
            <rect x="18" y="40" width="9" height="16" fill={secondary} />
            <rect x="37" y="40" width="9" height="16" fill={secondary} />
            <rect x="15" y="18" width="34" height="24" fill={primary} />
            <rect x="19" y="21" width="26" height="18" fill={secondary} />
            <rect x="11" y="17" width="8" height="10" fill={highlight} />
            <rect x="45" y="17" width="8" height="10" fill={highlight} />
            <rect x="25" y="24" width="14" height="8" fill={eyeGlow} opacity={pulse ? 0.9 : 0.55} />
            <rect x="20" y="38" width="24" height="4" fill={metal} />
          </g>
        )}

        {anatomy.body === 'QUADRUPED_BEAST' && (
          <g>
            {/* Four Distinct Beast Legs */}
            <rect x="14" y="40" width="5" height="16" fill={secondary} />
            <rect x="22" y="42" width="5" height="14" fill={primary} />
            <rect x="37" y="40" width="5" height="16" fill={secondary} />
            <rect x="45" y="42" width="5" height="14" fill={primary} />
            {/* Horizontal Beast Torso & Haunches */}
            <rect x="13" y="26" width="36" height="16" fill={primary} />
            <rect x="16" y="28" width="30" height="11" fill={secondary} />
            <rect x="18" y="24" width="24" height="3" fill={highlight} />
            {/* Tail */}
            <rect x="8" y="24" width="6" height="8" fill={secondary} />
          </g>
        )}

        {anatomy.body === 'SERPENT_HYDRA' && (
          <g>
            {/* Coiled Serpentine Lower Body */}
            <rect x="12" y="46" width="40" height="10" fill={secondary} />
            <rect x="16" y="38" width="32" height="9" fill={primary} />
            <rect x="22" y="22" width="20" height="18" fill={primary} />
            <rect x="26" y="24" width="12" height="28" fill={highlight} opacity="0.7" />
          </g>
        )}

        {anatomy.body === 'ARACHNID_CRAWLER' && (
          <g>
            {/* 6-8 Segmented Chitin Legs */}
            <rect x="6" y="34" width="12" height="4" fill={secondary} />
            <rect x="4" y="38" width="4" height="18" fill={primary} />
            <rect x="10" y="40" width="10" height="4" fill={secondary} />
            <rect x="10" y="44" width="4" height="13" fill={primary} />
            <rect x="46" y="34" width="12" height="4" fill={secondary} />
            <rect x="56" y="38" width="4" height="18" fill={primary} />
            <rect x="44" y="40" width="10" height="4" fill={secondary} />
            <rect x="50" y="44" width="4" height="13" fill={primary} />
            {/* Low Armored Carapace Abdomen */}
            <rect x="16" y="26" width="32" height="18" fill={primary} />
            <rect x="20" y="28" width="24" height="12" fill={secondary} />
            <rect x="24" y="30" width="16" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.body === 'SWARM_CLUSTER' && (
          <g>
            {/* 3 Distinct Pack Members at Staggered Positions */}
            <rect x="8" y="36" width="14" height="14" fill={primary} />
            <rect x="10" y="38" width="4" height="3" fill={eyeGlow} />
            <rect x="25" y="26" width="16" height="18" fill={secondary} />
            <rect x="28" y="29" width="4" height="3" fill={eyeGlow} />
            <rect x="35" y="29" width="4" height="3" fill={eyeGlow} />
            <rect x="42" y="38" width="14" height="14" fill={primary} />
            <rect x="48" y="40" width="4" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.body === 'GEOMETRIC_CONSTRUCT' && (
          <g>
            <rect x="18" y="16" width="28" height="32" fill={primary} />
            <rect x="21" y="19" width="22" height="26" fill={secondary} />
            <rect x="15" y="24" width="34" height="4" fill={highlight} />
            <rect x="26" y="26" width="12" height="12" fill={eyeGlow} opacity={pulse ? 1 : 0.7} />
          </g>
        )}

        {anatomy.body === 'WINGED_CREATURE' && (
          <g>
            <rect x="22" y="22" width="20" height="22" fill={primary} />
            <rect x="25" y="24" width="14" height="16" fill={secondary} />
            <rect x="24" y="44" width="5" height="10" fill={highlight} />
            <rect x="35" y="44" width="5" height="10" fill={highlight} />
          </g>
        )}

        {anatomy.body === 'PULSING_MASS' && (
          <g>
            <rect x="12" y="22" width="40" height="32" fill={secondary} />
            <rect x="15" y="18" width="34" height="32" fill={primary} />
            <rect x="20" y="24" width="24" height="20" fill={highlight} opacity={pulse ? 0.85 : 0.45} />
            <rect x="26" y="28" width="12" height="12" fill={eyeGlow} />
          </g>
        )}
      </g>

      {/* 4. HEAD & CRANIUM SILHOUETTE LAYER */}
      <g transform={`translate(0, ${headY})`}>
        {anatomy.head !== 'HEADLESS' && (
          <g>
            {/* Base Cranium */}
            <rect x="23" y="8" width="18" height="14" fill={primary} />
            <rect x="25" y="10" width="14" height="10" fill={secondary} />
            {/* Glowing Eyes */}
            <rect x="26" y="13" width="4" height="3" fill={eyeGlow} />
            <rect x="34" y="13" width="4" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.head === 'CROWN' && (
          <g>
            <rect x="21" y="3" width="22" height="6" fill={highlight} />
            <rect x="21" y="0" width="4" height="4" fill={highlight} />
            <rect x="30" y="-1" width="4" height="5" fill={eyeGlow} />
            <rect x="39" y="0" width="4" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.head === 'HORNS' && (
          <g>
            <rect x="17" y="4" width="6" height="6" fill={highlight} />
            <rect x="15" y="1" width="4" height="5" fill={highlight} />
            <rect x="41" y="4" width="6" height="6" fill={highlight} />
            <rect x="45" y="1" width="4" height="5" fill={highlight} />
          </g>
        )}

        {anatomy.head === 'ANTLERS' && (
          <g>
            <rect x="15" y="2" width="8" height="3" fill={highlight} />
            <rect x="13" y="-2" width="3" height="7" fill={highlight} />
            <rect x="19" y="-1" width="3" height="5" fill={highlight} />
            <rect x="41" y="2" width="8" height="3" fill={highlight} />
            <rect x="48" y="-2" width="3" height="7" fill={highlight} />
            <rect x="42" y="-1" width="3" height="5" fill={highlight} />
          </g>
        )}

        {anatomy.head === 'MUSHROOM' && (
          <g>
            <rect x="13" y="4" width="38" height="8" fill={primary} />
            <rect x="17" y="1" width="30" height="5" fill={secondary} />
            <rect x="19" y="5" width="4" height="3" fill={eyeGlow} />
            <rect x="30" y="3" width="5" height="3" fill={eyeGlow} />
            <rect x="41" y="5" width="4" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.head === 'PLAGUE_MASK' && (
          <g>
            <rect x="34" y="13" width="14" height="6" fill={highlight} />
            <rect x="44" y="15" width="6" height="4" fill={secondary} />
          </g>
        )}

        {anatomy.head === 'CAGE_HELM' && (
          <g>
            <rect x="21" y="5" width="22" height="18" fill={metal} />
            <rect x="24" y="8" width="3" height="13" fill={dark} />
            <rect x="30" y="8" width="4" height="13" fill={dark} />
            <rect x="37" y="8" width="3" height="13" fill={dark} />
            <rect x="27" y="13" width="3" height="3" fill={eyeGlow} />
            <rect x="34" y="13" width="3" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.head === 'MITRE' && (
          <g>
            <rect x="23" y="0" width="18" height="10" fill={secondary} />
            <rect x="26" y="-2" width="12" height="4" fill={highlight} />
            <rect x="30" y="1" width="4" height="8" fill={highlight} />
          </g>
        )}

        {anatomy.head === 'ANUBIS' && (
          <g>
            <rect x="23" y="1" width="4" height="8" fill={primary} />
            <rect x="37" y="1" width="4" height="8" fill={primary} />
            <rect x="35" y="14" width="11" height="5" fill={primary} />
          </g>
        )}

        {anatomy.head === 'JESTER' && (
          <g>
            <rect x="16" y="4" width="10" height="5" fill={primary} />
            <rect x="14" y="7" width="4" height="4" fill={highlight} />
            <rect x="38" y="4" width="10" height="5" fill={secondary} />
            <rect x="46" y="7" width="4" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.head === 'MULTI_EYE' && (
          <g>
            <rect x="25" y="9" width="3" height="3" fill={eyeGlow} />
            <rect x="31" y="8" width="3" height="3" fill={eyeGlow} />
            <rect x="36" y="9" width="3" height="3" fill={eyeGlow} />
            <rect x="28" y="15" width="3" height="3" fill={eyeGlow} />
            <rect x="33" y="15" width="3" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.head === 'FANG_MAW' && (
          <g>
            <rect x="24" y="17" width="16" height="5" fill={dark} />
            <rect x="25" y="17" width="2" height="3" fill="#FFF" />
            <rect x="29" y="17" width="2" height="4" fill="#FFF" />
            <rect x="33" y="17" width="2" height="4" fill="#FFF" />
            <rect x="37" y="17" width="2" height="3" fill="#FFF" />
          </g>
        )}
      </g>

      {/* 5. FOREGROUND WEAPON / TOOL / PROP LAYER */}
      <g transform={`translate(0, ${torsoY + armR})`}>
        {anatomy.weapon === 'SPEAR_HALBERD' && (
          <g>
            <rect x="50" y="4" width="3" height="52" fill={metal} />
            <rect x="47" y="2" width="9" height="10" fill={highlight} />
            <rect x="44" y="6" width="6" height="6" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'GREAT_SWORD' && (
          <g>
            <rect x="48" y="6" width="6" height="38" fill={metal} />
            <rect x="50" y="8" width="2" height="32" fill={highlight} />
            <rect x="44" y="42" width="14" height="3" fill={highlight} />
            <rect x="49" y="45" width="4" height="7" fill={secondary} />
          </g>
        )}

        {anatomy.weapon === 'EXECUTION_AXE' && (
          <g>
            <rect x="49" y="8" width="3" height="46" fill={secondary} />
            <rect x="40" y="10" width="16" height="14" fill={metal} />
            <rect x="38" y="12" width="4" height="10" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'HEAVY_HAMMER' && (
          <g>
            <rect x="49" y="14" width="3" height="40" fill={secondary} />
            <rect x="41" y="8" width="18" height="11" fill={metal} />
            <rect x="43" y="10" width="14" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'PICKAXE' && (
          <g>
            <rect x="49" y="14" width="3" height="38" fill={secondary} />
            <rect x="40" y="12" width="20" height="4" fill={metal} />
            <rect x="38" y="14" width="4" height="5" fill={highlight} />
            <rect x="58" y="14" width="4" height="5" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'DRILL' && (
          <g>
            <rect x="44" y="24" width="16" height="12" fill={metal} />
            <rect x="48" y="16" width="10" height="8" fill={highlight} />
            <rect x="51" y="10" width="5" height="6" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'RITUAL_STAFF' && (
          <g>
            <rect x="50" y="8" width="3" height="46" fill={highlight} />
            <rect x="46" y="2" width="11" height="9" fill={secondary} />
            <rect x="48" y="4" width="7" height="5" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'TOTEM_POLE' && (
          <g>
            <rect x="48" y="6" width="6" height="48" fill={secondary} />
            <rect x="45" y="8" width="12" height="10" fill={primary} />
            <rect x="47" y="11" width="3" height="3" fill={eyeGlow} />
            <rect x="52" y="11" width="3" height="3" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'GREAT_SHIELD' && (
          <g transform={`translate(0, ${armL - armR})`}>
            <rect x="4" y="16" width="16" height="34" fill={metal} />
            <rect x="6" y="18" width="12" height="30" fill={secondary} />
            <rect x="9" y="24" width="6" height="16" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'BRONZE_BELL' && (
          <g>
            <rect x="44" y="18" width="14" height="16" fill={highlight} />
            <rect x="42" y="32" width="18" height="4" fill={highlight} />
            <rect x="49" y="36" width="4" height="4" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'CHAIN_BALL' && (
          <g>
            <rect x="48" y="22" width="3" height="16" fill={metal} />
            <rect x="43" y="36" width="14" height="14" fill={metal} />
            <rect x="46" y="39" width="8" height="8" fill={dark} />
          </g>
        )}

        {anatomy.weapon === 'WHIP_VINE' && (
          <g>
            <rect x="46" y="20" width="12" height="4" fill={primary} />
            <rect x="54" y="24" width="4" height="16" fill={primary} />
            <rect x="48" y="38" width="8" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'ANCHOR' && (
          <g>
            <rect x="48" y="10" width="4" height="36" fill={metal} />
            <rect x="40" y="40" width="20" height="5" fill={metal} />
            <rect x="38" y="35" width="5" height="6" fill={highlight} />
            <rect x="57" y="35" width="5" height="6" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'LONGBOW' && (
          <g>
            <rect x="48" y="8" width="3" height="38" fill={highlight} />
            <rect x="51" y="10" width="4" height="3" fill={highlight} />
            <rect x="51" y="41" width="4" height="3" fill={highlight} />
            <rect x="44" y="25" width="16" height="2" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'ALCHEMICAL_FLASK' && (
          <g>
            <rect x="45" y="24" width="12" height="14" fill={secondary} />
            <rect x="47" y="28" width="8" height="8" fill={eyeGlow} />
            <rect x="49" y="20" width="4" height="4" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'CHALICE' && (
          <g>
            <rect x="45" y="18" width="12" height="9" fill={highlight} />
            <rect x="47" y="16" width="8" height="3" fill={eyeGlow} />
            <rect x="49" y="27" width="4" height="7" fill={highlight} />
            <rect x="46" y="34" width="10" height="3" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'SCALES' && (
          <g>
            <rect x="42" y="16" width="18" height="3" fill={highlight} />
            <rect x="42" y="19" width="5" height="10" fill={eyeGlow} />
            <rect x="55" y="19" width="5" height="10" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'KHOPESH' && (
          <g>
            <rect x="48" y="32" width="4" height="14" fill={secondary} />
            <rect x="48" y="18" width="4" height="14" fill={highlight} />
            <rect x="52" y="12" width="6" height="12" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'RAPIER' && (
          <g>
            <rect x="50" y="6" width="2" height="34" fill={highlight} />
            <rect x="46" y="36" width="10" height="4" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'POWDER_KEG' && (
          <g>
            <rect x="42" y="20" width="16" height="18" fill={secondary} />
            <rect x="42" y="24" width="16" height="3" fill={metal} />
            <rect x="42" y="32" width="16" height="3" fill={metal} />
            <rect x="49" y="15" width="4" height="5" fill={eyeGlow} />
          </g>
        )}

        {anatomy.weapon === 'TOMBSTONE' && (
          <g>
            <rect x="42" y="14" width="16" height="30" fill={metal} />
            <rect x="44" y="16" width="12" height="26" fill={secondary} />
            <rect x="48" y="20" width="4" height="12" fill={highlight} />
          </g>
        )}

        {anatomy.weapon === 'SCYTHE_CLAWS' && (
          <g>
            <rect x="6" y="24" width="10" height="4" fill={highlight} />
            <rect x="4" y="28" width="4" height="10" fill={eyeGlow} />
            <rect x="48" y="24" width="10" height="4" fill={highlight} />
            <rect x="56" y="28" width="4" height="10" fill={eyeGlow} />
          </g>
        )}
      </g>
    </g>
  );
};
