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

interface DecomposedAnatomy {
  body: BodyLayout;
  head: HeadAccessory;
  weapon: WeaponProp;
  back: BackSilhouette;
}

/**
 * Renders an ASCII pixel-art matrix into crisp run-length-encoded SVG <rect> clusters.
 * Palette key characters:
 *  '.' or ' ' = transparent
 *  '#' = deep outline / dark shadow
 *  '1' = primary body tone
 *  '2' = secondary shadow / under-layer tone
 *  '3' = specular highlight / rim light
 *  '4' = metal / bone / chitin structural tone
 *  '5' = emissive eye / rune / spore glow
 *  '6' = ivory white (teeth / fangs / bone highlight)
 *  '7' = crimson / ember accent
 */
const PixelArtMatrix: React.FC<{
  rows: string[];
  offsetX?: number;
  offsetY?: number;
  palette: Record<string, string>;
}> = ({ rows, offsetX = 0, offsetY = 0, palette }) => {
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      const fill = palette[ch];
      if (!fill) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) {
        run++;
      }
      rects.push(
        <rect
          key={`${y}_${x}`}
          x={offsetX + x}
          y={offsetY + y}
          width={run}
          height={1}
          fill={fill}
        />
      );
      x += run;
    }
  }
  return <g>{rects}</g>;
};

function decomposeSilhouette(
  s: CriptaCreatureVisualBlueprint['silhouetteType']
): DecomposedAnatomy {
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

  const palMap: Record<string, string> = {
    '#': dark || '#09070F',
    '1': primary,
    '2': secondary,
    '3': highlight,
    '4': metal,
    '5': eyeGlow,
    '6': '#F8F4E6',
    '7': '#E11D48',
  };

  // =========================================================================
  // BESPOKE MASTERPIECE SILHOUETTES FOR ICONIC / NON-HUMANOID SPECIES
  // =========================================================================

  // 1. SOVEREIGN OF THE ABYSS (FINAL BOSS PHASE 1 & PHASE 2)
  if (s === 'SOVEREIGN_PHASE_1' || s === 'SOVEREIGN_PHASE_2') {
    const isP2 = s === 'SOVEREIGN_PHASE_2';
    return (
      <g>
        {/* Abyssal Singularity Floor Dais */}
        <rect x="6" y="57" width="52" height="4" fill="#040208" opacity="0.9" />
        <rect x="10" y="55" width="44" height="2" fill={eyeGlow} opacity={pulse ? 0.95 : 0.65} />
        <rect x="16" y="53" width="32" height="2" fill={highlight} opacity="0.8" />

        {/* 6 Layered Seraphic Void Pinions (Animated with wingSpread) */}
        <g transform={`translate(0, ${torsoY})`}>
          {/* Upper Wing Pair */}
          <PixelArtMatrix
            offsetX={2 - wingSpread}
            offsetY={4}
            palette={palMap}
            rows={[
              '..333344........',
              '.331111444......',
              '33112221144.....',
              '311225221144....',
              '.122###22114....',
              '..2#####2214....',
            ]}
          />
          <PixelArtMatrix
            offsetX={46 + wingSpread}
            offsetY={4}
            palette={palMap}
            rows={[
              '........443333..',
              '......444111133.',
              '.....44112221133',
              '....441122522113',
              '....41122###221.',
              '....4122#####2..',
            ]}
          />
          {/* Mid & Lower Wing Pairs */}
          <PixelArtMatrix
            offsetX={3 - Math.round(wingSpread * 0.7)}
            offsetY={16}
            palette={palMap}
            rows={[
              '.3311144........',
              '331222144.......',
              '.12252214.......',
              '..2###221.......',
              '.3112214........',
              '3122#214........',
            ]}
          />
          <PixelArtMatrix
            offsetX={45 + Math.round(wingSpread * 0.7)}
            offsetY={16}
            palette={palMap}
            rows={[
              '........4411133.',
              '.......441222133',
              '.......41225221.',
              '.......122###2..',
              '........4122113.',
              '........412#2213',
            ]}
          />
        </g>

        {/* Sovereign Eclipse Halo & Crowned Skull/Mask */}
        <g transform={`translate(0, ${headY})`}>
          <PixelArtMatrix
            offsetX={18}
            offsetY={0}
            palette={palMap}
            rows={[
              '....3..55..3....',
              '..3.33.55.33.3..',
              '..333335533333..',
              '...4443333444...',
              '..#4111221114#..',
              '.#411######114#.',
              '.#41#55##55#14#.',
              '.#41#56##65#14#.',
              '..#41##55##14#..',
              '..#4126446214#..',
              '...##44##44##...',
            ]}
          />
        </g>

        {/* Sovereign Armored Astral Ribcage & Floating Tattered Mantle */}
        <g transform={`translate(0, ${torsoY})`}>
          <PixelArtMatrix
            offsetX={14}
            offsetY={14}
            palette={palMap}
            rows={[
              '..33444########44433..',
              '.34411122####22111443.',
              '3411223345555433221143',
              '#4122#4456666544#2214#',
              '.#22##4556776554##22#.',
              '..###.4125555214.###..',
              '......#412##214#......',
              '.....#4112##2114#.....',
              '....#2112####2112#....',
              '...#2112######2112#...',
              '..#2112#.2112.#2112#..',
              '..#212#..2112..#212#..',
              '..#21#...#22#...#12#..',
              '...##....#55#....##...',
            ]}
          />
        </g>

        {/* Sovereign Eclipse Greatsword & Void Orb */}
        <g transform={`translate(0, ${torsoY + armR})`}>
          <PixelArtMatrix
            offsetX={46}
            offsetY={4}
            palette={palMap}
            rows={[
              '....35....',
              '...3553...',
              '...3453...',
              '...3453...',
              '...3453...',
              '...3453...',
              '...3453...',
              '...3453...',
              '.33455433.',
              '3344554433',
              '...#44#...',
              '...#44#...',
              '...#33#...',
            ]}
          />
        </g>
        {isP2 && (
          <g transform={`translate(0, ${torsoY + armL})`}>
            <rect x="6" y="18" width="8" height="8" fill={eyeGlow} opacity={pulse ? 0.95 : 0.65} />
            <rect x="8" y="20" width="4" height="4" fill="#FFFFFF" />
          </g>
        )}
      </g>
    );
  }

  // 2. ROLLING GIANT CRANIUM (Cementerio de Gigantes)
  if (s === 'ROLLING_GIANT_CRANIUM') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="12" y="56" width="40" height="4" fill="#040307" opacity="0.82" />
        {/* Soul-Fire Aura */}
        <PixelArtMatrix
          offsetX={12}
          offsetY={4 - wingSpread}
          palette={palMap}
          rows={[
            '....5.....55.....5....',
            '..5535...5335...5355..',
            '.533355.536635.553335.',
          ]}
        />
        {/* Detailed Anatolian Giant Skull with Sutures, Zygomatic Arch & Teeth */}
        <PixelArtMatrix
          offsetX={12}
          offsetY={10}
          palette={palMap}
          rows={[
            '......##########......',
            '....##3311111133##....',
            '..##331111#1111133##..',
            '.#3111111#2111111113#.',
            '.#311111#21111#11113#.',
            '#31112222111122221113#',
            '#112######11######211#',
            '#12#55665#11#56655#21#',
            '#12#56665#44#56665#21#',
            '#112######44######211#',
            '.#4112221####1222114#.',
            '..##44111####11144##..',
            '....##416#6#6#614##...',
            '....#246#6#6#6#642#...',
            '....#22#########22#...',
            '.....#226#6#6#622#....',
            '......###########.....',
          ]}
        />
      </g>
    );
  }

  // 3. CRAWLING TITAN HAND (Cementerio de Gigantes)
  if (s === 'CRAWLING_TITAN_HAND') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="8" y="56" width="48" height="4" fill="#040307" opacity="0.82" />
        <PixelArtMatrix
          offsetX={10}
          offsetY={10}
          palette={palMap}
          rows={[
            '......................######......',
            '....................##553355##....',
            '...................#2244114422#...',
            '..................#241112211142#..',
            '..........########241122##221142#.',
            '........##3311111111122####22114#.',
            '......##31112222221111222222114#..',
            '.....#31122########22111111144#...',
            '....#312#.##########.#211144##....',
          ]}
        />
        {/* 5 Articulated Skeletal/Tendon Walking Fingers */}
        {[
          { x: 8, dy: armL, len: 18 },
          { x: 16, dy: -armL, len: 20 },
          { x: 25, dy: armR, len: 21 },
          { x: 34, dy: -armR, len: 19 },
          { x: 43, dy: armL, len: 16 },
        ].map((f, idx) => (
          <g key={idx} transform={`translate(${f.x}, ${28 + f.dy})`}>
            <rect x="0" y="0" width="5" height="7" fill={primary} />
            <rect x="1" y="1" width="3" height="5" fill={highlight} />
            <rect x="0" y="7" width="5" height="2" fill={dark} />
            <rect x="0" y="9" width="5" height="7" fill={secondary} />
            <rect x="1" y="16" width="5" height="5" fill={metal} />
            <rect x="0" y="20" width="6" height="3" fill="#F8F4E6" />
          </g>
        ))}
      </g>
    );
  }

  // 4. TEETH GRIMOIRE MIMIC & VOID TOME NAME EATER (Biblioteca Prohibida)
  if (s === 'TEETH_GRIMOIRE_MIMIC' || s === 'VOID_TOME_NAME_EATER') {
    return (
      <g transform={`translate(0, ${torsoY + headY})`}>
        <rect x="12" y="56" width="40" height="4" fill="#040307" opacity="0.78" />
        {/* Left & Right Articulated Leather/Gold Book Covers */}
        <g transform={`translate(${-wingSpread}, 0)`}>
          <PixelArtMatrix
            offsetX={6}
            offsetY={12}
            palette={palMap}
            rows={[
              '##################',
              '#3344222222224433#',
              '#3422666666662243#',
              '#4266655665566624#',
              '#2266666666666622#',
              '#2266556666556622#',
              '#2266666666666622#',
              '#4266665555666624#',
              '#3422666666662243#',
              '#3344222222224433#',
              '##################',
            ]}
          />
        </g>
        <g transform={`translate(${wingSpread}, 0)`}>
          <PixelArtMatrix
            offsetX={38}
            offsetY={12}
            palette={palMap}
            rows={[
              '##################',
              '#3344222222224433#',
              '#3422666666662243#',
              '#4266655665566624#',
              '#2266666666666622#',
              '#2266556666556622#',
              '#2266666666666622#',
              '#4266665555666624#',
              '#3422666666662243#',
              '#3344222222224433#',
              '##################',
            ]}
          />
        </g>
        {/* Central Fanged Spine Maw, Multiple Eyes & Lashing Tongue */}
        <PixelArtMatrix
          offsetX={23}
          offsetY={10}
          palette={palMap}
          rows={[
            '....##########....',
            '..##3355##5533##..',
            '.#3466######6643#.',
            '.#466########664#.',
            '.#4##556##655##4#.',
            '.#466########664#.',
            '.#46###7777###64#.',
            '.#466#773377#664#.',
            '.#346#735537#643#.',
            '..##4##7337##4##..',
            '....###7337###....',
            '......#7337#......',
            '.......#77#.......',
          ]}
        />
      </g>
    );
  }

  // 5A. ZODIAC STARMAP ACOLYTE — "ACÓLITO DEL ECLIPSE" (Dark Hooded Eclipse Cultist Caster)
  if (s === 'ZODIAC_STARMAP_ACOLYTE') {
    return (
      <g>
        <rect x="14" y="57" width="36" height="4" fill="#040307" opacity="0.84" />
        {/* Dark Solar Eclipse Corona Halo behind Hood */}
        <g transform={`translate(0, ${torsoY})`}>
          <PixelArtMatrix
            offsetX={16}
            offsetY={2}
            palette={palMap}
            rows={[
              '............33..55..33............',
              '.........333..######..333.........',
              '.......33...##########...33.......',
              '......33..##############..33......',
              '.....35..################..53.....',
              '.....35..################..53.....',
              '......33..##############..33......',
              '.......33...##########...33.......',
            ]}
          />
          {/* Long Tattered Dark-Indigo Eclipse Cultist Robe & Golden Zodiac Trim */}
          <PixelArtMatrix
            offsetX={16}
            offsetY={20}
            palette={palMap}
            rows={[
              '......######################......',
              '....##3311112222332222111133##....',
              '...#33112222113366331122221133#...',
              '..#3112211112235555322111122113#..',
              '..#1121122221113333111222211211#..',
              '..#12112####2111221112####21121#..',
              '...###..#2112111331112112#..###...',
              '........#2111221331221112#........',
              '.......#211122113311221112#.......',
              '......#32112211233211221123#......',
              '.....#3111221122332211221113#.....',
              '....#3311221122#33#2211221133#....',
              '....#31122#.212#..#212.#22113#....',
              '.....####...#22#..#22#...####.....',
              '............####..####............',
            ]}
          />
        </g>
        {/* Deep Pointed Eclipse Hood & Glowing Violet Cultist Eyes */}
        <g transform={`translate(0, ${headY})`}>
          <PixelArtMatrix
            offsetX={20}
            offsetY={5}
            palette={palMap}
            rows={[
              '..........####..........',
              '........##3333##........',
              '.......#31111113#.......',
              '......#3112222113#......',
              '.....#3122####2213#.....',
              '....#312########213#....',
              '....#12##56##65##21#....',
              '....#12##55##55##21#....',
              '.....#12########21#.....',
              '.....#312236632213#.....',
              '......##33333333##......',
            ]}
          />
        </g>
        {/* Left Hand: Raised Dark Eclipse Talisman Orb */}
        <g transform={`translate(0, ${torsoY + armL})`}>
          <PixelArtMatrix
            offsetX={7}
            offsetY={14}
            palette={palMap}
            rows={[
              '..335533..',
              '.35####53.',
              '35#5665#53',
              '5##6776##5',
              '35#5665#53',
              '.35####53.',
              '..335533..',
            ]}
          />
        </g>
        {/* Right Hand: Curved Lunar Ritual Dagger */}
        <g transform={`translate(0, ${torsoY + armR})`}>
          <PixelArtMatrix
            offsetX={45}
            offsetY={11}
            palette={palMap}
            rows={[
              '....663...',
              '..66443...',
              '.644..3...',
              '.644......',
              '..6644....',
              '...335533.',
              '....#33#..',
              '....#22#..',
            ]}
          />
        </g>
      </g>
    );
  }

  // 5B. BRASS ARMILLARY SPHERE — "ESFERA ARMILAR CHAMÁN" (Floating Mechanical-Mystical Shaman Construct)
  if (s === 'BRASS_ARMILLARY_SPHERE') {
    return (
      <g transform={`translate(0, ${torsoY - Math.round(wingSpread * 0.5)})`}>
        <rect x="14" y="56" width="36" height="4" fill="#040307" opacity="0.78" />
        {/* Hanging Shamanic Talismans & Twin Celestial Scroll Banners */}
        <PixelArtMatrix
          offsetX={16}
          offsetY={43}
          palette={palMap}
          rows={[
            '...#33#.......#3553#.......#33#...',
            '...#66#.......#3553#.......#66#...',
            '...#55#........#33#........#55#...',
            '...#66#........#55#........#66#...',
            '...#66#....................#66#...',
            '...####....................####...',
          ]}
        />
        {/* Interlocking Engraved Brass & Bronze Astronomical Rings + Emerald-Cyan Shaman Core */}
        <PixelArtMatrix
          offsetX={10}
          offsetY={6}
          palette={palMap}
          rows={[
            '..............##33##..............',
            '..........####331133####..........',
            '.......###33112222221133###.......',
            '.....##31122..######..22113##.....',
            '....#3112...##555555##...2113#....',
            '...#312...##5533663355##...213#...',
            '..#312...#53366555566335#...213#..',
            '..#12...#5366556666556635#...21#..',
            '.#312###536556666666655635###213#.',
            '.#333333536556665566655635333333#.',
            '.#312###536556666666655635###213#.',
            '..#12...#5366556666556635#...21#..',
            '..#312...#53366555566335#...213#..',
            '...#312...##5533663355##...213#...',
            '....#3112...##555555##...2113#....',
            '.....##31122..######..22113##.....',
            '.......###33112222221133###.......',
            '..........####331133####..........',
            '..............##33##..............',
          ]}
        />
        {/* Orbiting Shamanic Healing Totem Satellites */}
        <g transform={`translate(0, ${armL})`}>
          <rect x="4" y="18" width="5" height="12" fill="#09070F" />
          <rect x="5" y="19" width="3" height="10" fill={highlight} />
          <rect x="5" y="22" width="3" height="4" fill={eyeGlow} />
        </g>
        <g transform={`translate(0, ${armR})`}>
          <rect x="55" y="18" width="5" height="12" fill="#09070F" />
          <rect x="56" y="19" width="3" height="10" fill={highlight} />
          <rect x="56" y="22" width="3" height="4" fill={eyeGlow} />
        </g>
      </g>
    );
  }

  // 5C. INFINITE OCULUS OBSERVER — "OBSERVADOR DEL INFINITO" (Cosmic Multi-Eyed Seraphic Boss)
  if (s === 'INFINITE_OCULUS_OBSERVER') {
    return (
      <g transform={`translate(0, ${torsoY})`}>
        <rect x="8" y="56" width="48" height="4" fill="#040307" opacity="0.85" />
        <rect x="12" y="55" width="40" height="2" fill={highlight} opacity={pulse ? 0.95 : 0.65} />
        {/* 4 Cosmic Seraphic Astral Wings */}
        <PixelArtMatrix
          offsetX={2 - wingSpread}
          offsetY={8}
          palette={palMap}
          rows={[
            '..33335544......',
            '.33665533444....',
            '3366331111444...',
            '.331112252114...',
            '..33663112214...',
            '.336631122214...',
          ]}
        />
        <PixelArtMatrix
          offsetX={46 + wingSpread}
          offsetY={8}
          palette={palMap}
          rows={[
            '......44553333..',
            '....44433556633.',
            '...4441111336633',
            '...411252211133.',
            '...41221136633..',
            '...412221136633.',
          ]}
        />
        {/* Crowned Multi-Eyed Cosmic Singularity Core */}
        <PixelArtMatrix
          offsetX={16}
          offsetY={6}
          palette={palMap}
          rows={[
            '..........33..55..33..........',
            '........33333355333333........',
            '......##33111122111133##......',
            '....##31122#56##65#22113##....',
            '...#31122##566##665##22113#...',
            '..#3122#56##########65#2213#..',
            '..#312#566#55666655#665#213#..',
            '..#312#55##56677665##55#213#..',
            '..#3122####56677665####2213#..',
            '...#31122##55666655##22113#...',
            '....##31122########22113##....',
            '......##33111122111133##......',
            '........######33######........',
          ]}
        />
      </g>
    );
  }

  // =========================================================================
  // ANATOMICAL LAYERED RIG FOR ALL BIOME CREATURES, ELITES & MINIBOSSES
  // =========================================================================

  const isSkeletonSpecies =
    anatomy.head === 'SKULL' ||
    s === 'SKELETAL_SPEAR_GUARD' ||
    s === 'COLOSSAL_RIB_SKELETON' ||
    s === 'EXSANGUINATED_HUSK_THRALL' ||
    s === 'KHOPESH_MUMMY_GUARD';

  return (
    <g>
      {/* 1. GROUND SHADOW & MINIBOSS / ELITE RUNIC DAIS */}
      <rect x="10" y="57" width="44" height="4" fill="#040307" opacity="0.82" />
      <rect x="14" y="56" width="36" height="2" fill="#040307" opacity="0.65" />
      {isMiniboss && (
        <g>
          <rect x="6" y="55" width="52" height="3" fill={secondary} />
          <rect x="8" y="56" width="48" height="1" fill={highlight} opacity={pulse ? 0.98 : 0.68} />
          <rect x="12" y="53" width="4" height="3" fill={highlight} />
          <rect x="48" y="53" width="4" height="3" fill={highlight} />
          <rect x="28" y="54" width="8" height="2" fill={eyeGlow} />
        </g>
      )}
      {isElite && !isMiniboss && (
        <rect x="12" y="56" width="40" height="2" fill={highlight} opacity="0.65" />
      )}

      {/* 2. BACK SILHOUETTE LAYER (Wings, Halos, Chains, Banners, Crystals, Pipes, Extra Hydra Heads) */}
      <g transform={`translate(0, ${torsoY})`}>
        {anatomy.back === 'CAPE' && (
          <PixelArtMatrix
            offsetX={13}
            offsetY={17}
            palette={palMap}
            rows={[
              '..################################..',
              '.#2221111111111111111111111111222#.',
              '.#22112222222222222222222222221122#.',
              '#22122########################22122#',
              '#2122#22111122########22111122#2212#',
              '#212#.2111122##########2211112.#212#',
              '#212#.211122############221112.#212#',
              '#22#..21122##############22112..#22#',
              '.##...2122#..22#....#22..#2212...##.',
              '......22##...2##....##2...##22......',
            ]}
          />
        )}

        {anatomy.back === 'WINGS_BAT' && (
          <g>
            <PixelArtMatrix
              offsetX={2 - wingSpread}
              offsetY={10}
              palette={palMap}
              rows={[
                '....33######......',
                '..##34444444###...',
                '.#4411111111144#..',
                '#411222222221114#.',
                '#41222####2222114#',
                '#4122#....#222114#',
                '#412#......#2211#.',
                '.#4#........#21#..',
              ]}
            />
            <PixelArtMatrix
              offsetX={44 + wingSpread}
              offsetY={10}
              palette={palMap}
              rows={[
                '......######33....',
                '...###44444443##..',
                '..#4411111111144#.',
                '.#411122222222114#',
                '#4112222####22214#',
                '#411222#....#2214#',
                '.#1122#......#214#',
                '..#12#........#4#.',
              ]}
            />
          </g>
        )}

        {anatomy.back === 'WINGS_INSECT' && (
          <g opacity="0.88">
            <PixelArtMatrix
              offsetX={2 - wingSpread}
              offsetY={11}
              palette={palMap}
              rows={[
                '..####333333####..',
                '.#33663355336633#.',
                '#3663366336633663#',
                '.#33663366336633#.',
                '..####333333####..',
                '....##113311##....',
                '...#1166336611#...',
                '....##########....',
              ]}
            />
            <PixelArtMatrix
              offsetX={44 + wingSpread}
              offsetY={11}
              palette={palMap}
              rows={[
                '..####333333####..',
                '.#33663355336633#.',
                '#3663366336633663#',
                '.#33663366336633#.',
                '..####333333####..',
                '....##113311##....',
                '...#1166336611#...',
                '....##########....',
              ]}
            />
          </g>
        )}

        {anatomy.back === 'WINGS_SERAPH' && (
          <g>
            <PixelArtMatrix
              offsetX={2 - wingSpread}
              offsetY={6}
              palette={palMap}
              rows={[
                '..3333334444......',
                '.3366663334444....',
                '336633331111444...',
                '.33311112221144...',
                '..3366633112214...',
                '.33663311222114...',
                '..333112222114....',
                '...3311222114.....',
              ]}
            />
            <PixelArtMatrix
              offsetX={46 + wingSpread}
              offsetY={6}
              palette={palMap}
              rows={[
                '......4444333333..',
                '....4444333666633.',
                '...444111133336633',
                '...44112221111333.',
                '...4122113366633..',
                '...41122211336633.',
                '....411222211333..',
                '.....4112221133...',
              ]}
            />
          </g>
        )}

        {anatomy.back === 'ASTRAL_HALO' && (
          <PixelArtMatrix
            offsetX={14}
            offsetY={2}
            palette={palMap}
            rows={[
              '..............5555..............',
              '.........33333566533333.........',
              '......333.....5555.....333......',
              '....33....................33....',
              '...33......................33...',
              '..35........................53..',
              '..35........................53..',
              '...33......................33...',
            ]}
          />
        )}

        {anatomy.back === 'FURNACE_PIPES' && (
          <PixelArtMatrix
            offsetX={11}
            offsetY={6}
            palette={palMap}
            rows={[
              '..5555....................5555..',
              '.536635..................536635.',
              '.#4444#..................#4444#.',
              '.#4324#..................#4324#.',
              '.#4444#..................#4444#.',
              '.#4324#..................#4324#.',
              '.#4324#..................#4324#.',
              '.######..................######.',
            ]}
          />
        )}

        {anatomy.back === 'CRYSTAL_SHARDS' && (
          <PixelArtMatrix
            offsetX={9}
            offsetY={8}
            palette={palMap}
            rows={[
              '...55......................55...',
              '..5335...55..........55...5335..',
              '.536635.5335........5335.536635.',
              '.#3113#.5365........5635.#3113#.',
              '..#11#..#31#........#13#..#11#..',
              '...##....##..........##....##...',
            ]}
          />
        )}

        {anatomy.back === 'ICE_SPIKES' && (
          <PixelArtMatrix
            offsetX={10}
            offsetY={8}
            palette={palMap}
            rows={[
              '..66........................66..',
              '.6336..66..............66..6336.',
              '.3553.6336............6336.3553.',
              '.3113.3553............3553.3113.',
              '..11...31..............13...11..',
            ]}
          />
        )}

        {anatomy.back === 'SPORE_PODS' && (
          <PixelArtMatrix
            offsetX={10}
            offsetY={12}
            palette={palMap}
            rows={[
              '..####....................####..',
              '.#2552#..................#2552#.',
              '#256652#................#256652#',
              '#225522#................#225522#',
              '.######..................######.',
            ]}
          />
        )}

        {anatomy.back === 'CORAL_FINS' && (
          <PixelArtMatrix
            offsetX={8}
            offsetY={10}
            palette={palMap}
            rows={[
              '..55..33....................33..55..',
              '.53353113..................31135335.',
              '..311122#..................#221113..',
              '...31122#..................#22113...',
            ]}
          />
        )}

        {anatomy.back === 'BRANCHES' && (
          <PixelArtMatrix
            offsetX={7}
            offsetY={6}
            palette={palMap}
            rows={[
              '55....22......................22....55',
              '.22..212......................212..22.',
              '..22212........................21222..',
              '....2122......................2212....',
              '.....212......................212.....',
            ]}
          />
        )}

        {anatomy.back === 'CHAINS' && (
          <PixelArtMatrix
            offsetX={10}
            offsetY={6}
            palette={palMap}
            rows={[
              '.#44#......................#44#.',
              '#4##4#....................#4##4#',
              '.#44#......................#44#.',
              '..##........................##..',
              '.#44#......................#44#.',
              '#4##4#....................#4##4#',
              '.#44#......................#44#.',
              '..##........................##..',
              '.#44#......................#44#.',
            ]}
          />
        )}

        {anatomy.back === 'MIRROR_FRAME' && (
          <PixelArtMatrix
            offsetX={12}
            offsetY={5}
            palette={palMap}
            rows={[
              '..########333333333333########..',
              '.#33444444############44444433#.',
              '#344######11133##11111######443#',
              '#44#11133311111##11111111111#44#',
              '#44#1133111111####1111113311#44#',
              '#44#11111111########11133111#44#',
              '.#344######1111111111######443#.',
              '..########333333333333########..',
            ]}
          />
        )}

        {anatomy.back === 'BANNER_POLE' && (
          <PixelArtMatrix
            offsetX={34}
            offsetY={2}
            palette={palMap}
            rows={[
              '...........#44#.',
              '############44##',
              '#2233333322#44#.',
              '#2355665532#44#.',
              '#2233553322#44#.',
              '#2222222222#44#.',
              '#222.##.222#44#.',
              '.##......###44#.',
              '...........#44#.',
              '...........#44#.',
            ]}
          />
        )}

        {anatomy.back === 'EXTRA_HEADS' && (
          <PixelArtMatrix
            offsetX={5}
            offsetY={9}
            palette={palMap}
            rows={[
              '..######......................######..',
              '.#113311#....................#113311#.',
              '#11566511#..................#11566511#',
              '#122##221#..................#122##221#',
              '#6#6##6#6#..................#6#6##6#6#',
              '.#211112#....................#211112#.',
              '..#2112#......................#2112#..',
              '...#212#......................#212#...',
            ]}
          />
        )}
      </g>

      {/* 3. CORE BODY / ANATOMICAL TORSO / LEGS LAYER */}
      <g transform={`translate(0, ${torsoY})`}>
        {anatomy.body === 'BIPED_WARRIOR' &&
          (isSkeletonSpecies ? (
            /* True Skeletal Ribcage, Spine, Pelvis & Articulated Bone Limbs */
            <PixelArtMatrix
              offsetX={16}
              offsetY={20}
              palette={palMap}
              rows={[
                '..####4444########4444####..',
                '.#4664111144####4411114664#.',
                '.#444#.#6611#44#1166#.#444#.',
                '..#66#..###664466###..#66#..',
                '..#44#..#6611441166#..#44#..',
                '..#66#...###6446###...#66#..',
                '..#44#...#66144166#...#44#..',
                '...##.....###44###.....##...',
                '............#66#............',
                '..........###44###..........',
                '.........#46644664#.........',
                '........#44######44#........',
                '........#66#....#66#........',
                '........#44#....#44#........',
                '.......#4664#..#4664#.......',
                '.......#4444#..#4444#.......',
                '.......#666#....#666#.......',
                '......#44444#..#44444#......',
                '......#######..#######......',
              ]}
            />
          ) : (
            /* Detailed Armored / Muscular Biped Warrior with Pauldrons, Cuirass, Belt & Greaves */
            <PixelArtMatrix
              offsetX={15}
              offsetY={19}
              palette={palMap}
              rows={[
                '..######4444########4444######..',
                '.#433344111122####221111443334#.',
                '#433444113331122221133311444334#',
                '#444#2211111114444111111122#444#',
                '.###.#21122221455412222112#.###.',
                '.....#2112###145541###2112#.....',
                '......#211222144441222112#......',
                '......#444444335533444444#......',
                '......#2211122####2211122#......',
                '......#211222#....#222112#......',
                '......#21122#......#22112#......',
                '......#43344#......#44334#......',
                '......#41124#......#42114#......',
                '......#41124#......#42114#......',
                '.....#4433344#....#4433344#.....',
                '.....#########....#########.....',
              ]}
            />
          ))}

        {anatomy.body === 'ROBED_CASTER' && (
          /* Layered Vestments, Runic Stole, Wide Sleeves & Tattered Hem */
          <PixelArtMatrix
            offsetX={15}
            offsetY={20}
            palette={palMap}
            rows={[
              '....######3333####3333######....',
              '..##221111335544445533111122##..',
              '.#2211122211334554331122211122#.',
              '#211122##22111355311122##221112#',
              '#2112#....#2113443112#....#2112#',
              '.###......#2113553112#......###.',
              '.........#221134431122#.........',
              '........#22112355321122#........',
              '.......#2211223443221122#.......',
              '......#221122235532221122#......',
              '.....#221122#234432#221122#.....',
              '....#221122#.235532.#221122#....',
              '....#21122#..#3333#..#22112#....',
              '....###..##...####...##..###....',
            ]}
          />
        )}

        {anatomy.body === 'FLOATING_WRAITH' && (
          /* Ethereal Spectral Ribcage, Billowing Shroud & Floating Tail Wisps */
          <PixelArtMatrix
            offsetX={15}
            offsetY={19}
            palette={palMap}
            rows={[
              '...#####3333########3333#####...',
              '.##22111331122####22113311122##.',
              '#221122211155555555551112221122#',
              '#2112###2115665##5665112###2112#',
              '.###....#21155####55112#....###.',
              '........#22112####21122#........',
              '.........#221122221122#.........',
              '........#221122##221122#........',
              '.......#21122#2112#22112#.......',
              '......#2112#..#212..#2112#......',
              '.....#212#....#21#....#212#.....',
              '.....#55#......#5#.....#55#.....',
            ]}
          />
        )}

        {anatomy.body === 'COLOSSAL_BRUTE' && (
          /* Massive Juggernaut Shoulders, Reinforced Chestplate, Heavy Gauntlets & Pillar Legs */
          <PixelArtMatrix
            offsetX={10}
            offsetY={17}
            palette={palMap}
            rows={[
              '..########3333############3333########..',
              '.#3344443311112222####2222111133444433#.',
              '#34411114411333311444411333311441111443#',
              '#41122221111111144555544111111112222114#',
              '#4122###221122224566665422221122###2214#',
              '#442#...#2211222445555442221122#...#244#',
              '.###.....#22111122####22111122#.....###.',
              '.........#44334444555544443344#.........',
              '........#22111122######22111122#........',
              '.......#22112222#......#22221122#.......',
              '.......#44334444#......#44443344#.......',
              '.......#41122114#......#41122114#.......',
              '......#4433333344#....#4433333344#......',
              '......############....############......',
            ]}
          />
        )}

        {anatomy.body === 'QUADRUPED_BEAST' && (
          /* Articulated 4-Legged Predator / Stag / Hound with Ribcage, Haunches, Clawed Paws & Tail */
          <g>
            <PixelArtMatrix
              offsetX={8}
              offsetY={22}
              palette={palMap}
              rows={[
                '..####..............................',
                '.#2112#.......######3333########....',
                '#2112#.....###111111111133111111##..',
                '.#212####.#11122221111111122221111#.',
                '..#221111##112233221111112233221111#',
                '...##112222112222221111112222221122#',
                '.....#2211111222222222222222221122#.',
                '......##221122################2112#.',
              ]}
            />
            {/* 4 Articulated Beast Legs Stepping with armL / armR */}
            <g transform={`translate(0, ${Math.round(armL * 0.5)})`}>
              <PixelArtMatrix
                offsetX={16}
                offsetY={38}
                palette={palMap}
                rows={[
                  '#2112#..........#2112#',
                  '#2112#..........#2112#',
                  '.#212#...........#212#',
                  '.#414#...........#414#',
                  '#64146#.........#64146#',
                ]}
              />
            </g>
            <g transform={`translate(0, ${Math.round(-armR * 0.5)})`}>
              <PixelArtMatrix
                offsetX={23}
                offsetY={39}
                palette={palMap}
                rows={[
                  '#2212#............#2212#',
                  '.#212#.............#212#',
                  '.#212#.............#212#',
                  '.#424#.............#424#',
                  '#64246#...........#64246#',
                ]}
              />
            </g>
          </g>
        )}

        {anatomy.body === 'SERPENT_HYDRA' && (
          /* Coiled Serpentine / Leviathan / Worm Body with Ventral Scutes & Dorsal Spines */
          <PixelArtMatrix
            offsetX={10}
            offsetY={20}
            palette={palMap}
            rows={[
              '..............####1111####..............',
              '............##111133331111##............',
              '...........#1122335555332211#...........',
              '..........#112233333333332211#..........',
              '.........#11222333333333322211#.........',
              '.......##11222############22211##.......',
              '.....##1122###..##3333##..###2211##.....',
              '...##1122##...##11333311##...##2211##...',
              '..#1122211####112233332211####1122211#..',
              '.#11223333333333222222223333333322111#..',
              '.#22222222222222222222222222222222222#..',
              '..####################################..',
            ]}
          />
        )}

        {anatomy.body === 'ARACHNID_CRAWLER' && (
          /* Segmented Cephalothorax, Carapace Abdomen & 8 Multi-Jointed Chitinous Legs */
          <g>
            {/* Left & Right 4-Legged Articulated Chitin Arrays */}
            <g transform={`translate(0, ${Math.round(armL * 0.6)})`}>
              <PixelArtMatrix
                offsetX={4}
                offsetY={26}
                palette={palMap}
                rows={[
                  '....####4444##..........................##4444####....',
                  '..##4411....11##......................##11....1144##..',
                  '.#411#........##......................##........#114#.',
                  '#41#....####44##......................##44####....#14#',
                  '#6#...##4411..............................1144##...#6#',
                  '.....#411#....####..................####....#114#.....',
                  '....#41#....##4411..................1144##....#14#....',
                  '....#6#....#411#......................#114#....#6#....',
                  '...........#66#........................#66#...........',
                ]}
              />
            </g>
            {/* Armored Carapace & Abdomen */}
            <PixelArtMatrix
              offsetX={16}
              offsetY={22}
              palette={palMap}
              rows={[
                '......########3333########......',
                '....##22111111355311111122##....',
                '..##221133331115511133331122##..',
                '.#2211335555331111335555331122#.',
                '.#2111222222221111222222221112#.',
                '..#22111111112222221111111122#..',
                '....########################....',
              ]}
            />
          </g>
        )}

        {anatomy.body === 'SWARM_CLUSTER' && (
          /* 3 Distinct Detailed Pack Creatures at Staggered Depths */
          <g>
            <PixelArtMatrix
              offsetX={6}
              offsetY={30}
              palette={palMap}
              rows={[
                '....######............######............######....',
                '..##113311##........##113311##........##113311##..',
                '.#1156116511#......#1156116511#......#1156116511#.',
                '.#1226##6221#......#1226##6221#......#1226##6221#.',
                '..#22111122#........#22111122#........#22111122#..',
                '..#44#..#44#........#44#..#44#........#44#..#44#..',
              ]}
            />
          </g>
        )}

        {anatomy.body === 'GEOMETRIC_CONSTRUCT' && (
          /* Runic Monolith / Iron Maiden / Relic Construct with Glowing Core */
          <PixelArtMatrix
            offsetX={16}
            offsetY={16}
            palette={palMap}
            rows={[
              '....######3333333333######....',
              '..##4411113355555533111144##..',
              '.#44112222115666651122221144#.',
              '#334122###2156776512###221433#',
              '#33412#55#2115555112#55#21433#',
              '.#44112222111111111122221144#.',
              '..#4411112222####2222111144#..',
              '...#441122###....###221144#...',
              '....######..........######....',
            ]}
          />
        )}

        {anatomy.body === 'WINGED_CREATURE' && (
          /* Agile Aerial Predator Torso & Raptorial Talons */
          <PixelArtMatrix
            offsetX={20}
            offsetY={21}
            palette={palMap}
            rows={[
              '....####3333####....',
              '..##111135531111##..',
              '.#1122331111332211#.',
              '.#1222111111112221#.',
              '..#221122##221122#..',
              '...#2112#..#2112#...',
              '...#4334#..#4334#...',
              '..#64##46##64##46#..',
            ]}
          />
        )}

        {anatomy.body === 'PULSING_MASS' && (
          /* Asymmetric Organic Slime / Visceral Heart / Brood Sac with Internal Skull & Bubbles */
          <PixelArtMatrix
            offsetX={10}
            offsetY={19}
            palette={palMap}
            rows={[
              '........########3333########........',
              '.....###11111111333311111111###.....',
              '...##11122223331111113355222111##...',
              '..#112226666221155551125522222211#..',
              '.#112226#5#56215666651222233322211#.',
              '.#1222266###6215677651222366322221#.',
              '#1122222222221115555111222332222211#',
              '#1225522222222221111222222222552221#',
              '#2225522222222222222222222222552222#',
              '.#222222##222222####222222##222222#.',
              '..######..######....######..######..',
            ]}
          />
        )}
      </g>

      {/* 4. ARTICULATED HEAD, CRANIUM, JAWS & HELM SILHOUETTE LAYER */}
      <g transform={`translate(0, ${headY})`}>
        {anatomy.head !== 'HEADLESS' && (
          <g>
            {anatomy.head === 'SKULL' ? (
              /* High-Detail Anatomical Skull with Zygomatic Bones, Eye Sockets & Teeth */
              <PixelArtMatrix
                offsetX={21}
                offsetY={5}
                palette={palMap}
                rows={[
                  '....##########....',
                  '..##6611111166##..',
                  '.#66111111111166#.',
                  '#611####11####116#',
                  '#11#565#11#565#11#',
                  '#11#####44#####11#',
                  '.#41111####11114#.',
                  '..##46#6#6#6#4##..',
                  '...#26#6#6#6#2#...',
                  '....##########....',
                ]}
              />
            ) : anatomy.head === 'ANUBIS' ? (
              /* Jackal-Headed Anubis Guardian with Tall Ears & Golden Snout */
              <PixelArtMatrix
                offsetX={20}
                offsetY={1}
                palette={palMap}
                rows={[
                  '.##..........##.....',
                  '#13#........#31#....',
                  '#13#........#31#....',
                  '#12##########21#....',
                  '#11331111113311###..',
                  '#11115561111111133##',
                  '#1222###11111111114#',
                  '.#22211116#6#6#664#.',
                  '..################..',
                ]}
              />
            ) : anatomy.head === 'PLAGUE_MASK' ? (
              /* Corvid Plague Doctor Beak Mask & Goggles */
              <PixelArtMatrix
                offsetX={20}
                offsetY={5}
                palette={palMap}
                rows={[
                  '..##########........',
                  '.#2211111122#.......',
                  '#211556##5511###....',
                  '#211556##5511333###.',
                  '#221111111133322233#',
                  '.#222111122222222##.',
                  '..###############...',
                ]}
              />
            ) : anatomy.head === 'CAGE_HELM' ? (
              /* Iron Prisoner / Inquisitor Cage Helm with Vertical Bars & Glowing Eyes */
              <PixelArtMatrix
                offsetX={20}
                offsetY={4}
                palette={palMap}
                rows={[
                  '..##############..',
                  '.#44334433443344#.',
                  '.#43##43##43##34#.',
                  '.#435543##435534#.',
                  '.#435643##436534#.',
                  '.#43##43##43##34#.',
                  '.#44334433443344#.',
                  '..##############..',
                ]}
              />
            ) : (
              /* Sculpted Fantasy Creature / Knight / Beast Cranium with Expressive Glowing Eyes */
              <PixelArtMatrix
                offsetX={21}
                offsetY={6}
                palette={palMap}
                rows={[
                  '....##########....',
                  '..##3311111133##..',
                  '.#31112222221113#.',
                  '#3112########2113#',
                  '#112#556##655#211#',
                  '#112#555##555#211#',
                  '.#2122######2212#.',
                  '..##2211441122##..',
                  '....##########....',
                ]}
              />
            )}
          </g>
        )}

        {anatomy.head === 'CROWN' && (
          <PixelArtMatrix
            offsetX={19}
            offsetY={0}
            palette={palMap}
            rows={[
              '.33....3553....33.',
              '.333..335533..333.',
              '.3433334554333343.',
              '.#43333333333334#.',
              '..##############..',
            ]}
          />
        )}

        {anatomy.head === 'HORNS' && (
          <PixelArtMatrix
            offsetX={13}
            offsetY={1}
            palette={palMap}
            rows={[
              '33..............................33',
              '343............................343',
              '.3433........................3343.',
              '..#4433....................3344#..',
              '....###....................###....',
            ]}
          />
        )}

        {anatomy.head === 'ANTLERS' && (
          <PixelArtMatrix
            offsetX={11}
            offsetY={-2}
            palette={palMap}
            rows={[
              '33...33............................33...33',
              '.33..33...33..................33...33..33.',
              '..333333.33....................33.333333..',
              '....333333......................333333....',
              '......333........................333......',
            ]}
          />
        )}

        {anatomy.head === 'MUSHROOM' && (
          <PixelArtMatrix
            offsetX={12}
            offsetY={1}
            palette={palMap}
            rows={[
              '........############........',
              '....####111155111111####....',
              '..##11115511111155111111##..',
              '.#113311111155111111331111#.',
              '#11133112222222222221133111#',
              '.#222222442244224422222222#.',
              '..########################..',
            ]}
          />
        )}

        {anatomy.head === 'MITRE' && (
          <PixelArtMatrix
            offsetX={21}
            offsetY={-1}
            palette={palMap}
            rows={[
              '......##33##......',
              '....##223322##....',
              '...#2211551122#...',
              '..#211335533112#..',
              '..#211113311112#..',
              '..#333333333333#..',
            ]}
          />
        )}

        {anatomy.head === 'JESTER' && (
          <PixelArtMatrix
            offsetX={14}
            offsetY={2}
            palette={palMap}
            rows={[
              '..####..............####..',
              '.#1111##..........##2222#.',
              '#55#1111##########2222#55#',
              '.##..#111133##332222#..##.',
            ]}
          />
        )}

        {anatomy.head === 'MULTI_EYE' && (
          <PixelArtMatrix
            offsetX={23}
            offsetY={7}
            palette={palMap}
            rows={[
              '..56..56..56..',
              '....56..56....',
              '..56..56..56..',
            ]}
          />
        )}

        {anatomy.head === 'FANG_MAW' && (
          <PixelArtMatrix
            offsetX={22}
            offsetY={14}
            palette={palMap}
            rows={[
              '#66#66#66#66#',
              '#6#########6#',
              '.#6#66#66#6#.',
              '..#########..',
            ]}
          />
        )}
      </g>

      {/* 5. FOREGROUND ARTICULATED WEAPON / SHIELD / PROP LAYER */}
      <g transform={`translate(0, ${torsoY + armR})`}>
        {anatomy.weapon === 'SPEAR_HALBERD' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={1}
            palette={palMap}
            rows={[
              '.....63.....',
              '....6336....',
              '...635536...',
              '.3343553433.',
              '344443344443',
              '.33..44..33.',
              '.....44.....',
              '.....44.....',
              '.....22.....',
              '.....22.....',
              '.....22.....',
              '.....22.....',
              '.....22.....',
              '.....44.....',
            ]}
          />
        )}

        {anatomy.weapon === 'GREAT_SWORD' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={2}
            palette={palMap}
            rows={[
              '....63....',
              '...6346...',
              '...6346...',
              '...6346...',
              '...6546...',
              '...6546...',
              '...6346...',
              '...6346...',
              '...6346...',
              '3334554333',
              '.##.22.##.',
              '....22....',
              '....33....',
            ]}
          />
        )}

        {anatomy.weapon === 'EXECUTION_AXE' && (
          <PixelArtMatrix
            offsetX={38}
            offsetY={4}
            palette={palMap}
            rows={[
              '.........44....',
              '..6633444444...',
              '.633444224444..',
              '63444225524443.',
              '63444225524443.',
              '.633444224444..',
              '..6633444444...',
              '.........22....',
              '.........22....',
              '.........22....',
              '.........22....',
              '.........44....',
            ]}
          />
        )}

        {anatomy.weapon === 'HEAVY_HAMMER' && (
          <PixelArtMatrix
            offsetX={39}
            offsetY={5}
            palette={palMap}
            rows={[
              '.##############.',
              '#33444455444433#',
              '#34422255222443#',
              '#33444444444433#',
              '.#####.22.#####.',
              '.......22.......',
              '.......22.......',
              '.......22.......',
              '.......22.......',
              '.......33.......',
            ]}
          />
        )}

        {anatomy.weapon === 'PICKAXE' && (
          <PixelArtMatrix
            offsetX={38}
            offsetY={8}
            palette={palMap}
            rows={[
              '....3344444433....',
              '..33442244224433..',
              '.634#...22...#436.',
              '.6#.....22.....#6.',
              '........22........',
              '........22........',
              '........22........',
            ]}
          />
        )}

        {anatomy.weapon === 'DRILL' && (
          <PixelArtMatrix
            offsetX={43}
            offsetY={8}
            palette={palMap}
            rows={[
              '.....65.....',
              '....6356....',
              '...634436...',
              '..63422436..',
              '.6344224436.',
              '#4433553344#',
              '#4222222224#',
              '############',
            ]}
          />
        )}

        {anatomy.weapon === 'RITUAL_STAFF' && (
          <PixelArtMatrix
            offsetX={45}
            offsetY={1}
            palette={palMap}
            rows={[
              '...335533...',
              '.33.5665.33.',
              '.3..5665..3.',
              '.33..55..33.',
              '...333333...',
              '.....32.....',
              '.....32.....',
              '.....32.....',
              '.....32.....',
              '.....32.....',
              '.....32.....',
            ]}
          />
        )}

        {anatomy.weapon === 'TOTEM_POLE' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={3}
            palette={palMap}
            rows={[
              '..########..',
              '.#66111166#.',
              '.#655##556#.',
              '..#6#66#6#..',
              '...#2332#...',
              '...#2552#...',
              '...#2332#...',
              '...#2222#...',
              '...#2222#...',
            ]}
          />
        )}

        {anatomy.weapon === 'GREAT_SHIELD' && (
          <g transform={`translate(0, ${armL - armR})`}>
            <PixelArtMatrix
              offsetX={3}
              offsetY={15}
              palette={palMap}
              rows={[
                '.################.',
                '#3344443333444433#',
                '#4422223553222244#',
                '#4221113553111224#',
                '#4213335665333124#',
                '#4213556666553124#',
                '#4213335665333124#',
                '#4221113553111224#',
                '.#44222355322244#.',
                '..#442233332244#..',
                '...##44444444##...',
                '.....########.....',
              ]}
            />
          </g>
        )}

        {anatomy.weapon === 'BRONZE_BELL' && (
          <PixelArtMatrix
            offsetX={42}
            offsetY={14}
            palette={palMap}
            rows={[
              '.....####.....',
              '...##3333##...',
              '..#33111133#..',
              '.#3112222113#.',
              '.#3115555113#.',
              '#333333333333#',
              '#####.55.#####',
              '......55......',
            ]}
          />
        )}

        {anatomy.weapon === 'CHAIN_BALL' && (
          <PixelArtMatrix
            offsetX={42}
            offsetY={16}
            palette={palMap}
            rows={[
              '.....#44#.....',
              '.....#44#.....',
              '.....#44#.....',
              '...66####66...',
              '.##44333344##.',
              '64433222233446',
              '.#4422##2244#.',
              '..##444444##..',
              '...66####66...',
            ]}
          />
        )}

        {anatomy.weapon === 'WHIP_VINE' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={16}
            palette={palMap}
            rows={[
              '..331111##....',
              '......##1133..',
              '........#112#.',
              '......66#112#.',
              '....##1122##..',
              '...#5511##....',
            ]}
          />
        )}

        {anatomy.weapon === 'ANCHOR' && (
          <PixelArtMatrix
            offsetX={38}
            offsetY={10}
            palette={palMap}
            rows={[
              '.......####.......',
              '......#4334#......',
              '.......#44#.......',
              '....####44####....',
              '.......#44#.......',
              '.......#44#.......',
              '.63....#44#....36.',
              '.#44###4334###44#.',
              '..##4444334444##..',
              '....##########....',
            ]}
          />
        )}

        {anatomy.weapon === 'LONGBOW' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={6}
            palette={palMap}
            rows={[
              '..336.....',
              '...336....',
              '....326...',
              '....32.6..',
              '5555355555',
              '....32.6..',
              '....326...',
              '...336....',
              '..336.....',
            ]}
          />
        )}

        {anatomy.weapon === 'ALCHEMICAL_FLASK' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={18}
            palette={palMap}
            rows={[
              '....####....',
              '....#33#....',
              '...##66##...',
              '.##665566##.',
              '#6655665566#',
              '#6556655556#',
              '.##########.',
            ]}
          />
        )}

        {anatomy.weapon === 'CHALICE' && (
          <PixelArtMatrix
            offsetX={44}
            offsetY={15}
            palette={palMap}
            rows={[
              '.#55555555#.',
              '#3377777733#',
              '.#33311333#.',
              '..##3333##..',
              '....#33#....',
              '..##3333##..',
            ]}
          />
        )}

        {anatomy.weapon === 'SCALES' && (
          <PixelArtMatrix
            offsetX={40}
            offsetY={14}
            palette={palMap}
            rows={[
              '#######33#######',
              '.#...#....#...#.',
              '#5555#....#5555#',
              '.####......####.',
            ]}
          />
        )}

        {anatomy.weapon === 'KHOPESH' && (
          <PixelArtMatrix
            offsetX={45}
            offsetY={8}
            palette={palMap}
            rows={[
              '....3366..',
              '..334466..',
              '.344..66..',
              '.344......',
              '..3344....',
              '....44....',
              '...3333...',
              '....22....',
            ]}
          />
        )}

        {anatomy.weapon === 'RAPIER' && (
          <PixelArtMatrix
            offsetX={45}
            offsetY={4}
            palette={palMap}
            rows={[
              '....6.....',
              '....6.....',
              '....6.....',
              '....6.....',
              '....6.....',
              '..335533..',
              '.35533553.',
              '....22....',
            ]}
          />
        )}

        {anatomy.weapon === 'POWDER_KEG' && (
          <PixelArtMatrix
            offsetX={41}
            offsetY={14}
            palette={palMap}
            rows={[
              '.....556.....',
              '....53.......',
              '.###########.',
              '#44444444444#',
              '#22111111122#',
              '#22177777122#',
              '#44444444444#',
              '.###########.',
            ]}
          />
        )}

        {anatomy.weapon === 'TOMBSTONE' && (
          <PixelArtMatrix
            offsetX={41}
            offsetY={12}
            palette={palMap}
            rows={[
              '..##########..',
              '.#4433333344#.',
              '#433225522334#',
              '#432255552234#',
              '#433225522334#',
              '#433225522334#',
              '#442222222244#',
              '##############',
            ]}
          />
        )}

        {anatomy.weapon === 'SCYTHE_CLAWS' && (
          <PixelArtMatrix
            offsetX={4}
            offsetY={22}
            palette={palMap}
            rows={[
              '..3366..........................................6633..',
              '.366..............................................663.',
              '665................................................566',
              '65..................................................56',
            ]}
          />
        )}
      </g>

      {/* 7. PROFESSION VISUAL SIGNATURE OVERLAY (Guarantees visual role clarity across all archetypes) */}
      {blueprint.profession === 'CHAMÁN' && (
        <g transform={`translate(0, ${torsoY})`}>
          {/* Floating Shamanic Healing Rune Motes & Talisman Glow */}
          <rect x="7" y="14" width="3" height="5" fill="#10B981" opacity={pulse ? 0.95 : 0.65} />
          <rect x="8" y="15" width="1" height="3" fill="#A7F3D0" />
          <rect x="54" y="14" width="3" height="5" fill="#10B981" opacity={pulse ? 0.95 : 0.65} />
          <rect x="55" y="15" width="1" height="3" fill="#A7F3D0" />
        </g>
      )}
      {blueprint.profession === 'CURANDERO' && (
        <g transform={`translate(0, ${headY})`}>
          {/* Sacred Healer Sanctuary Cross Mote */}
          <rect x="31" y="1" width="2" height="6" fill="#FDE047" />
          <rect x="29" y="3" width="6" height="2" fill="#FDE047" />
          <rect x="31" y="3" width="2" height="2" fill="#FFFFFF" />
        </g>
      )}
      {blueprint.profession === 'ASESINO' && (
        <g transform={`translate(0, ${torsoY + armL})`}>
          {/* Dual Off-Hand Poisoned Assassin Dirk */}
          <rect x="8" y="25" width="7" height="2" fill="#09070F" />
          <rect x="9" y="25" width="5" height="1" fill="#E2E8F0" />
          <rect x="7" y="25" width="2" height="2" fill="#34D399" />
        </g>
      )}
      {blueprint.profession === 'ALQUIMISTA' && (
        <g transform={`translate(0, ${torsoY})`}>
          {/* Belt Alchemical Vials (Emerald & Amber) */}
          <rect x="22" y="36" width="3" height="4" fill="#10B981" />
          <rect x="26" y="36" width="3" height="4" fill="#F59E0B" />
          <rect x="30" y="36" width="3" height="4" fill="#A855F7" />
        </g>
      )}
      {blueprint.profession === 'INVOCADOR' && (
        <g transform={`translate(0, ${torsoY})`}>
          {/* Floating Summoning Portal Sigils */}
          <rect x="6" y="30" width="4" height="4" fill="#A855F7" opacity={pulse ? 0.95 : 0.6} />
          <rect x="7" y="31" width="2" height="2" fill="#F3E8FF" />
          <rect x="54" y="30" width="4" height="4" fill="#A855F7" opacity={pulse ? 0.95 : 0.6} />
          <rect x="55" y="31" width="2" height="2" fill="#F3E8FF" />
        </g>
      )}
      {blueprint.profession === 'BERSERKER' && (
        <g transform={`translate(0, ${headY})`}>
          {/* Crimson Rage Vein / War-Paint Crest */}
          <rect x="12" y="10" width="3" height="6" fill="#EF4444" opacity={pulse ? 0.95 : 0.65} />
          <rect x="49" y="10" width="3" height="6" fill="#EF4444" opacity={pulse ? 0.95 : 0.65} />
        </g>
      )}
    </g>
  );
};
