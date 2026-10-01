import React from 'react';
import {
  CriptaAccessoryId,
  CriptaArmorId,
  CriptaCanonicalRoomType,
  CriptaDecisionAnimationType,
  CriptaDecisionSceneType,
  CriptaDungeonDefinition,
  CriptaDungeonId,
  CriptaItemId,
  CriptaRelicId,
  CriptaRoomInteractiveOption,
  CriptaWeaponId,
  CriptaWeaponRuneId,
  DecisionVisualDefinition,
  WeaponVisualDefinition,
} from '../../types/laCripta';
import {
  LaCriptaAccessoryPixelIcon,
  LaCriptaArmorPixelIcon,
  LaCriptaItemPixelIcon,
  LaCriptaRelicPixelIcon,
  LaCriptaWeaponPixelIcon,
  LaCriptaWeaponRunePixelIcon,
} from './LaCriptaItemRelicArt';

/**
 * Canonical Weapon Visual Registry (Sections 12, 13, 14, 15).
 * Maps every canonical weaponId and archetype alias to its distinct family,
 * cultural/era style, material palette, silhouette, and micro-animation.
 */
export const CRIPTA_WEAPON_VISUAL_REGISTRY: Record<string, WeaponVisualDefinition> = {
  espada_oxidada: {
    weaponId: 'espada_oxidada',
    weaponFamily: 'ESPADA',
    eraStyle: 'HIERRO_OXIDADO',
    material: 'Hierro oxidado y cuero gastado',
    biomeOrigin: 'catacumbas_del_rey',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'rusty_notched_broadsword',
      primaryBladeOrHead: '#9CA3AF',
      secondaryShade: '#6B7280',
      deepShadow: '#374151',
      specularHighlight: '#E5E7EB',
      hiltOrShaft: '#78350F',
      accentGemOrRune: '#9A3412',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'FISICO',
    attackEffect: 'SLASH',
  },
  espada_del_sepulcro: {
    weaponId: 'espada_del_sepulcro',
    weaponFamily: 'ESPADA',
    eraStyle: 'SEPULCRAL_ANTIGUO',
    material: 'Acero sepulcral y bronce funerario',
    biomeOrigin: 'cementerio_de_gigantes',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'sepulchral_relic_longsword',
      primaryBladeOrHead: '#CBD5E1',
      secondaryShade: '#94A3B8',
      deepShadow: '#334155',
      specularHighlight: '#F8FAFC',
      hiltOrShaft: '#D97706',
      accentGemOrRune: '#38BDF8',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'SAGRADO',
    attackEffect: 'SLASH',
  },
  espadon_del_rey_hundido: {
    weaponId: 'espadon_del_rey_hundido',
    weaponFamily: 'ESPADÓN',
    eraStyle: 'SOBERANO_HUNDIDO',
    material: 'Oro abisal y acero real',
    biomeOrigin: 'templo_sumergido',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'sunken_king_greatsword',
      primaryBladeOrHead: '#FDE047',
      secondaryShade: '#EAB308',
      deepShadow: '#854D0E',
      specularHighlight: '#FEF9C3',
      hiltOrShaft: '#1E3A8A',
      accentGemOrRune: '#2DD4BF',
    },
    idleEffect: 'ASTRAL_PULSE',
    elementalEffect: 'FISICO',
    attackEffect: 'CLEAVE',
  },
  hacha_forja_infernal: {
    weaponId: 'hacha_forja_infernal',
    weaponFamily: 'HACHA',
    eraStyle: 'FORJA_INFERNAL',
    material: 'Hierro negro y magma vivo',
    biomeOrigin: 'forja_infernal',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'infernal_molten_greataxe',
      primaryBladeOrHead: '#F97316',
      secondaryShade: '#C2410C',
      deepShadow: '#431407',
      specularHighlight: '#FEF08A',
      hiltOrShaft: '#27272A',
      accentGemOrRune: '#FB923C',
    },
    idleEffect: 'EMBER_GLOW',
    elementalEffect: 'FUEGO',
    attackEffect: 'CLEAVE',
  },
  pico_de_minero_runico: {
    weaponId: 'pico_de_minero_runico',
    weaponFamily: 'MARTILLO',
    eraStyle: 'ENANO_RUNICO',
    material: 'Acero templado y cuarzo rúnico',
    biomeOrigin: 'minas_abandonadas',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'runic_dwarven_war_pick',
      primaryBladeOrHead: '#94A3B8',
      secondaryShade: '#64748B',
      deepShadow: '#1E293B',
      specularHighlight: '#E2E8F0',
      hiltOrShaft: '#78350F',
      accentGemOrRune: '#38BDF8',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'CONTUNDENTE',
    attackEffect: 'PIERCE',
  },
  alabarda_del_juramento: {
    weaponId: 'alabarda_del_juramento',
    weaponFamily: 'LANZA',
    eraStyle: 'BASTION_JURAMENTO',
    material: 'Acero de paladín y filigrana solar',
    biomeOrigin: 'castillo_del_verdugo',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'oathkeeper_royal_halberd',
      primaryBladeOrHead: '#E2E8F0',
      secondaryShade: '#94A3B8',
      deepShadow: '#334155',
      specularHighlight: '#FFFFFF',
      hiltOrShaft: '#B45309',
      accentGemOrRune: '#FACC15',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'FISICO',
    attackEffect: 'CLEAVE',
  },
  baston_ceniza: {
    weaponId: 'baston_ceniza',
    weaponFamily: 'BÁCULO',
    eraStyle: 'CENIZA_ARCANA',
    material: 'Madera carbonizada y amatista',
    biomeOrigin: 'bosque_de_los_susurros',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'ashwood_gnarled_staff',
      primaryBladeOrHead: '#A855F7',
      secondaryShade: '#7E22CE',
      deepShadow: '#3B0764',
      specularHighlight: '#F3E8FF',
      hiltOrShaft: '#57534E',
      accentGemOrRune: '#C084FC',
    },
    idleEffect: 'ASTRAL_PULSE',
    elementalEffect: 'MAGICO',
    attackEffect: 'ARCANE_BEAM',
  },
  vara_de_cristal_astral: {
    weaponId: 'vara_de_cristal_astral',
    weaponFamily: 'VARITA',
    eraStyle: 'CRISTAL_ASTRAL',
    material: 'Prisma celeste y plata lunar',
    biomeOrigin: 'cripta_de_cristal',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'astral_prism_wand',
      primaryBladeOrHead: '#67E8F9',
      secondaryShade: '#06B6D4',
      deepShadow: '#164E63',
      specularHighlight: '#ECFEFF',
      hiltOrShaft: '#CBD5E1',
      accentGemOrRune: '#E879F9',
    },
    idleEffect: 'ASTRAL_PULSE',
    elementalEffect: 'ASTRAL',
    attackEffect: 'ARCANE_BEAM',
  },
  grimorio_prohibido_arma: {
    weaponId: 'grimorio_prohibido_arma',
    weaponFamily: 'TOMO',
    eraStyle: 'VACIO_PROHIBIDO',
    material: 'Cuero abisal, oro y pergamino vivo',
    biomeOrigin: 'biblioteca_prohibida',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'forbidden_void_codex',
      primaryBladeOrHead: '#9333EA',
      secondaryShade: '#581C87',
      deepShadow: '#2E1065',
      specularHighlight: '#F3E8FF',
      hiltOrShaft: '#F59E0B',
      accentGemOrRune: '#F43F5E',
    },
    idleEffect: 'SHADOW_MIST',
    elementalEffect: 'SOMBRA',
    attackEffect: 'ARCANE_BEAM',
  },
  cetro_del_eclipse: {
    weaponId: 'cetro_del_eclipse',
    weaponFamily: 'BÁCULO',
    eraStyle: 'ECLIPSE_ABISAL',
    material: 'Astrolabio de latón y sol negro',
    biomeOrigin: 'torre_del_astrologo',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'eclipse_astrolabe_staff',
      primaryBladeOrHead: '#C084FC',
      secondaryShade: '#7E22CE',
      deepShadow: '#1E1B4B',
      specularHighlight: '#FEF08A',
      hiltOrShaft: '#F59E0B',
      accentGemOrRune: '#F97316',
    },
    idleEffect: 'ASTRAL_PULSE',
    elementalEffect: 'ASTRAL',
    attackEffect: 'ARCANE_BEAM',
  },
  dagas_melladas: {
    weaponId: 'dagas_melladas',
    weaponFamily: 'DAGA',
    eraStyle: 'FILO_CALLEJERO',
    material: 'Acero dentado y empuñadura de cuero',
    biomeOrigin: 'prision_maldita',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'twin_serrated_daggers',
      primaryBladeOrHead: '#CBD5E1',
      secondaryShade: '#64748B',
      deepShadow: '#1E293B',
      specularHighlight: '#F8FAFC',
      hiltOrShaft: '#7C2D12',
      accentGemOrRune: '#E11D48',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'PERFORANTE',
    attackEffect: 'PIERCE',
  },
  hojas_colmillo_venenoso: {
    weaponId: 'hojas_colmillo_venenoso',
    weaponFamily: 'DAGA',
    eraStyle: 'COLMILLO_MICOTICO',
    material: 'Quitina curva y glándula de víbora',
    biomeOrigin: 'jardin_podrido',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'venom_fang_kris_daggers',
      primaryBladeOrHead: '#4ADE80',
      secondaryShade: '#16A34A',
      deepShadow: '#14532D',
      specularHighlight: '#DCFCE7',
      hiltOrShaft: '#365314',
      accentGemOrRune: '#A3E635',
    },
    idleEffect: 'VENOM_DRIP',
    elementalEffect: 'VENENO',
    attackEffect: 'PIERCE',
  },
  estoque_carmesi: {
    weaponId: 'estoque_carmesi',
    weaponFamily: 'ESPADA',
    eraStyle: 'IMPERIAL_CARMESI',
    material: 'Acero de duelo y taza de rubí',
    biomeOrigin: 'santuario_de_sangre',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'crimson_imperial_rapier',
      primaryBladeOrHead: '#FDA4AF',
      secondaryShade: '#E11D48',
      deepShadow: '#881337',
      specularHighlight: '#FFF1F2',
      hiltOrShaft: '#FBBF24',
      accentGemOrRune: '#F43F5E',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'PERFORANTE',
    attackEffect: 'PIERCE',
  },
  guadana_del_verdugo: {
    weaponId: 'guadana_del_verdugo',
    weaponFamily: 'HACHA',
    eraStyle: 'VERDUGO_SOMBRIO',
    material: 'Acero umbral y asta de ébano',
    biomeOrigin: 'el_abismo',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'executioner_crescent_scythe',
      primaryBladeOrHead: '#E2E8F0',
      secondaryShade: '#94A3B8',
      deepShadow: '#1E1B4B',
      specularHighlight: '#FFFFFF',
      hiltOrShaft: '#4C1D95',
      accentGemOrRune: '#F43F5E',
    },
    idleEffect: 'SHADOW_MIST',
    elementalEffect: 'SOMBRA',
    attackEffect: 'CLEAVE',
  },
  arco_cazador: {
    weaponId: 'arco_cazador',
    weaponFamily: 'ARCO',
    eraStyle: 'CAZADOR_BOSQUE',
    material: 'Madera de tejo curvada y cuerda tensa',
    biomeOrigin: 'bosque_de_los_susurros',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'yew_longbow',
      primaryBladeOrHead: '#B45309',
      secondaryShade: '#78350F',
      deepShadow: '#451A03',
      specularHighlight: '#FDE68A',
      hiltOrShaft: '#D97706',
      accentGemOrRune: '#34D399',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'PERFORANTE',
    attackEffect: 'PIERCE',
  },
  arco_de_espinas: {
    weaponId: 'arco_de_espinas',
    weaponFamily: 'ARCO',
    eraStyle: 'RAIZ_ESPINOSA',
    material: 'Raíz retorcida viva y espinas sangrantes',
    biomeOrigin: 'jardin_podrido',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'living_thorn_root_bow',
      primaryBladeOrHead: '#65A30D',
      secondaryShade: '#3F6212',
      deepShadow: '#1A2E05',
      specularHighlight: '#BEF264',
      hiltOrShaft: '#713F12',
      accentGemOrRune: '#F43F5E',
    },
    idleEffect: 'VENOM_DRIP',
    elementalEffect: 'PERFORANTE',
    attackEffect: 'PIERCE',
  },
  ballesta_de_asedio: {
    weaponId: 'ballesta_de_asedio',
    weaponFamily: 'BALLESTA',
    eraStyle: 'ASEDIO_PESADO',
    material: 'Arco de acero laminado y torno mecánico',
    biomeOrigin: 'fortaleza_goblin',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'heavy_siege_arbalest',
      primaryBladeOrHead: '#94A3B8',
      secondaryShade: '#475569',
      deepShadow: '#1E293B',
      specularHighlight: '#F8FAFC',
      hiltOrShaft: '#92400E',
      accentGemOrRune: '#F59E0B',
    },
    idleEffect: 'SHIMMER',
    elementalEffect: 'PERFORANTE',
    attackEffect: 'PIERCE',
  },
  canon_de_azufre: {
    weaponId: 'canon_de_azufre',
    weaponFamily: 'BALLESTA',
    eraStyle: 'AZUFRE_RUNICO',
    material: 'Bronce de fundición y recámara ígnea',
    biomeOrigin: 'forja_infernal',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'runic_sulfur_hand_cannon',
      primaryBladeOrHead: '#D97706',
      secondaryShade: '#92400E',
      deepShadow: '#451A03',
      specularHighlight: '#FEF08A',
      hiltOrShaft: '#374151',
      accentGemOrRune: '#F97316',
    },
    idleEffect: 'EMBER_GLOW',
    elementalEffect: 'FUEGO',
    attackEffect: 'ALCHEMICAL_BLAST',
  },
  maza_consagrada: {
    weaponId: 'maza_consagrada',
    weaponFamily: 'MAZA',
    eraStyle: 'LITURGIA_ALBA',
    material: 'Bronce bendito y aletas solares',
    biomeOrigin: 'catacumbas_del_rey',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'consecrated_flanged_mace',
      primaryBladeOrHead: '#FBBF24',
      secondaryShade: '#D97706',
      deepShadow: '#78350F',
      specularHighlight: '#FEF9C3',
      hiltOrShaft: '#64748B',
      accentGemOrRune: '#FDE047',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'CONTUNDENTE',
    attackEffect: 'HOLY_WAVE',
  },
  martillo_del_juicio: {
    weaponId: 'martillo_del_juicio',
    weaponFamily: 'MARTILLO',
    eraStyle: 'SEPULCRAL_ANTIGUO',
    material: 'Hueso de coloso, acero y sello solar',
    biomeOrigin: 'cementerio_de_gigantes',
    rarity: 'UNCOMMON',
    spriteDefinition: {
      silhouetteId: 'ossuary_judgment_warhammer',
      primaryBladeOrHead: '#E2E8F0',
      secondaryShade: '#94A3B8',
      deepShadow: '#334155',
      specularHighlight: '#FFFFFF',
      hiltOrShaft: '#B45309',
      accentGemOrRune: '#FACC15',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'SAGRADO',
    attackEffect: 'HOLY_WAVE',
  },
  simbolo_del_alba: {
    weaponId: 'simbolo_del_alba',
    weaponFamily: 'CETRO',
    eraStyle: 'LITURGIA_ALBA',
    material: 'Oro radiante y custodia de cristal',
    biomeOrigin: 'ciudad_sepultada',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'sacred_dawn_sun_scepter',
      primaryBladeOrHead: '#FDE047',
      secondaryShade: '#F59E0B',
      deepShadow: '#92400E',
      specularHighlight: '#FFFFFF',
      hiltOrShaft: '#D97706',
      accentGemOrRune: '#38BDF8',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'SAGRADO',
    attackEffect: 'HOLY_WAVE',
  },
  relicario_serafin: {
    weaponId: 'relicario_serafin',
    weaponFamily: 'ARTEFACTO',
    eraStyle: 'SERAFIN_SOLAR',
    material: 'Incensario alado de oro e ícor celeste',
    biomeOrigin: 'palacio_de_los_espejos',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'seraphim_winged_religiary',
      primaryBladeOrHead: '#FACC15',
      secondaryShade: '#D97706',
      deepShadow: '#78350F',
      specularHighlight: '#FEF9C3',
      hiltOrShaft: '#E2E8F0',
      accentGemOrRune: '#67E8F9',
    },
    idleEffect: 'HOLY_HALO',
    elementalEffect: 'SAGRADO',
    attackEffect: 'HOLY_WAVE',
  },
  lanzador_alquimico: {
    weaponId: 'lanzador_alquimico',
    weaponFamily: 'ALQUÍMICO',
    eraStyle: 'BOTICARIO_VOLATIL',
    material: 'Latón alquímico y matraces presurizados',
    biomeOrigin: 'alcantarillas_imperiales',
    rarity: 'COMMON',
    spriteDefinition: {
      silhouetteId: 'alchemical_flask_launcher',
      primaryBladeOrHead: '#34D399',
      secondaryShade: '#059669',
      deepShadow: '#064E3B',
      specularHighlight: '#D1FAE5',
      hiltOrShaft: '#B45309',
      accentGemOrRune: '#A7F3D0',
    },
    idleEffect: 'VENOM_DRIP',
    elementalEffect: 'ALQUIMICO',
    attackEffect: 'ALCHEMICAL_BLAST',
  },
  catalizador_esporas: {
    weaponId: 'catalizador_esporas',
    weaponFamily: 'ALQUÍMICO',
    eraStyle: 'COLMILLO_MICOTICO',
    material: 'Incensario fúngico y cepas luminiscentes',
    biomeOrigin: 'jardin_podrido',
    rarity: 'RARE',
    spriteDefinition: {
      silhouetteId: 'mycotic_spore_censer',
      primaryBladeOrHead: '#A3E635',
      secondaryShade: '#4D7C0F',
      deepShadow: '#1A2E05',
      specularHighlight: '#ECFCCB',
      hiltOrShaft: '#78350F',
      accentGemOrRune: '#4ADE80',
    },
    idleEffect: 'VENOM_DRIP',
    elementalEffect: 'VENENO',
    attackEffect: 'ALCHEMICAL_BLAST',
  },
  guantelete_mutageno: {
    weaponId: 'guantelete_mutageno',
    weaponFamily: 'ALQUÍMICO',
    eraStyle: 'BOTICARIO_VOLATIL',
    material: 'Guantelete de bronce y agujas de mutágeno',
    biomeOrigin: 'la_colmena',
    rarity: 'LEGENDARY',
    spriteDefinition: {
      silhouetteId: 'mutagen_injector_gauntlet',
      primaryBladeOrHead: '#4ADE80',
      secondaryShade: '#15803D',
      deepShadow: '#052E16',
      specularHighlight: '#DCFCE7',
      hiltOrShaft: '#D97706',
      accentGemOrRune: '#FACC15',
    },
    idleEffect: 'VENOM_DRIP',
    elementalEffect: 'ALQUIMICO',
    attackEffect: 'ALCHEMICAL_BLAST',
  },
};

export function getWeaponVisualDefinition(
  weaponId?: CriptaWeaponId | string | null
): WeaponVisualDefinition {
  if (!weaponId) return CRIPTA_WEAPON_VISUAL_REGISTRY.espada_oxidada;
  if (CRIPTA_WEAPON_VISUAL_REGISTRY[weaponId]) {
    return CRIPTA_WEAPON_VISUAL_REGISTRY[weaponId];
  }
  const norm = weaponId.toLowerCase();
  if (norm.includes('hacha')) return CRIPTA_WEAPON_VISUAL_REGISTRY.hacha_forja_infernal;
  if (norm.includes('raiz') || norm.includes('espina') || norm.includes('arco'))
    return CRIPTA_WEAPON_VISUAL_REGISTRY.arco_de_espinas;
  if (norm.includes('eclipse') || norm.includes('baculo') || norm.includes('báculo'))
    return CRIPTA_WEAPON_VISUAL_REGISTRY.cetro_del_eclipse;
  if (norm.includes('osario') || norm.includes('martillo'))
    return CRIPTA_WEAPON_VISUAL_REGISTRY.martillo_del_juicio;
  return CRIPTA_WEAPON_VISUAL_REGISTRY.espada_oxidada;
}

/**
 * Biome-specific liquid, stone, flora, and ornament palette for Contextual Decision Art (Section 5).
 */
export function getBiomeDecisionPalette(biomeId: CriptaDungeonId = 'catacumbas_del_rey'): DecisionVisualDefinition['palette'] & {
  floraOrMotif: 'MUSHROOMS_AND_ROOTS' | 'CORAL_AND_BUBBLES' | 'BLOOD_CANDLES_GOLD' | 'CONSTELLATION_BRASS' | 'VOID_SHARDS' | 'MAGMA_IRON' | 'CRYSTAL_PRISMS' | 'FROST_ICICLES' | 'BONE_MONOLITHS';
} {
  switch (biomeId) {
    case 'jardin_podrido':
    case 'bosque_de_los_susurros':
    case 'la_colmena':
      return {
        bgTop: '#07170D',
        bgBottom: '#030A05',
        stonePrimary: '#1E3A28',
        stoneHighlight: '#3B6E4C',
        liquidOrGlow: '#4ADE80',
        liquidSecondary: '#A3E635',
        accent: '#86EFAC',
        particle: '#BEF264',
        floraOrMotif: 'MUSHROOMS_AND_ROOTS',
      };
    case 'templo_sumergido':
    case 'alcantarillas_imperiales':
      return {
        bgTop: '#041829',
        bgBottom: '#020B14',
        stonePrimary: '#164E63',
        stoneHighlight: '#0891B2',
        liquidOrGlow: '#22D3EE',
        liquidSecondary: '#2DD4BF',
        accent: '#67E8F9',
        particle: '#A5F3FC',
        floraOrMotif: 'CORAL_AND_BUBBLES',
      };
    case 'santuario_de_sangre':
    case 'castillo_del_verdugo':
      return {
        bgTop: '#1F060D',
        bgBottom: '#0D0205',
        stonePrimary: '#4C1122',
        stoneHighlight: '#881337',
        liquidOrGlow: '#F43F5E',
        liquidSecondary: '#E11D48',
        accent: '#FBBF24',
        particle: '#FDA4AF',
        floraOrMotif: 'BLOOD_CANDLES_GOLD',
      };
    case 'torre_del_astrologo':
    case 'biblioteca_prohibida':
      return {
        bgTop: '#09102C',
        bgBottom: '#040717',
        stonePrimary: '#1E295B',
        stoneHighlight: '#3B4C99',
        liquidOrGlow: '#60A5FA',
        liquidSecondary: '#C084FC',
        accent: '#FACC15',
        particle: '#FEF08A',
        floraOrMotif: 'CONSTELLATION_BRASS',
      };
    case 'el_abismo':
      return {
        bgTop: '#110524',
        bgBottom: '#06020F',
        stonePrimary: '#2E1065',
        stoneHighlight: '#581C87',
        liquidOrGlow: '#A855F7',
        liquidSecondary: '#EC4899',
        accent: '#D8B4FE',
        particle: '#F0ABFC',
        floraOrMotif: 'VOID_SHARDS',
      };
    case 'forja_infernal':
    case 'fortaleza_goblin':
      return {
        bgTop: '#210905',
        bgBottom: '#0F0402',
        stonePrimary: '#431407',
        stoneHighlight: '#7C2D12',
        liquidOrGlow: '#F97316',
        liquidSecondary: '#EAB308',
        accent: '#FDBA74',
        particle: '#FEF08A',
        floraOrMotif: 'MAGMA_IRON',
      };
    case 'cripta_de_cristal':
    case 'palacio_de_los_espejos':
    case 'minas_abandonadas':
      return {
        bgTop: '#09192E',
        bgBottom: '#040B17',
        stonePrimary: '#1E3A5F',
        stoneHighlight: '#38BDF8',
        liquidOrGlow: '#67E8F9',
        liquidSecondary: '#E879F9',
        accent: '#F0ABFC',
        particle: '#ECFEFF',
        floraOrMotif: 'CRYSTAL_PRISMS',
      };
    case 'cavernas_heladas':
      return {
        bgTop: '#071B2E',
        bgBottom: '#030C17',
        stonePrimary: '#1E4060',
        stoneHighlight: '#7DD3FC',
        liquidOrGlow: '#38BDF8',
        liquidSecondary: '#BAE6FD',
        accent: '#E0F2FE',
        particle: '#F0F9FF',
        floraOrMotif: 'FROST_ICICLES',
      };
    case 'cementerio_de_gigantes':
    case 'catacumbas_del_rey':
    case 'prision_maldita':
    case 'ciudad_sepultada':
    default:
      return {
        bgTop: '#111622',
        bgBottom: '#070A10',
        stonePrimary: '#334155',
        stoneHighlight: '#64748B',
        liquidOrGlow: '#38BDF8',
        liquidSecondary: '#FBBF24',
        accent: '#FDE047',
        particle: '#BAE6FD',
        floraOrMotif: 'BONE_MONOLITHS',
      };
  }
}

/**
 * Resolves the exact DecisionVisualDefinition from:
 * biomeId + roomType + option (label, id, subtitle, effectText) + player's equippedWeaponId.
 * Satisfies Sections 1, 2, 3, 4, 5: Every sentence maps to its exact visual action!
 */
export function resolveDecisionVisualDefinition(params: {
  biomeId: CriptaDungeonId;
  roomType?: CriptaCanonicalRoomType;
  option?: Partial<CriptaRoomInteractiveOption> | null;
  cardTitle?: string;
  equippedWeaponId?: CriptaWeaponId | string | null;
}): DecisionVisualDefinition {
  const {
    biomeId = 'catacumbas_del_rey',
    roomType = 'EVENT',
    option,
    cardTitle = '',
    equippedWeaponId = 'espada_oxidada',
  } = params;

  const rawText = `${option?.label || ''} ${cardTitle} ${option?.subtitle || ''} ${option?.id || ''}`.toUpperCase();
  const pal = getBiomeDecisionPalette(biomeId);
  const wVis = getWeaponVisualDefinition(option?.grantsWeaponId || equippedWeaponId);

  let sceneType: CriptaDecisionSceneType = 'PURIFY_BIOME_ALTAR_OR_FOUNTAIN';
  let animationType: CriptaDecisionAnimationType = 'RELIC_PULSE';
  let subject = wVis.weaponId;
  let secondarySubject = 'biome_well';
  let environmentElement = pal.floraOrMotif;

  if (
    rawText.includes('SUMERGIR EL ARMA') ||
    rawText.includes('TEMPLAR EL ACERO CON EL PODER') ||
    (rawText.includes('SUMERGIR') && rawText.includes('AGUA'))
  ) {
    sceneType = 'SUBMERGE_WEAPON_IN_WELL';
    animationType = 'WATER_RIPPLES';
    subject = String(equippedWeaponId || 'espada_oxidada');
    secondarySubject = 'phosphorescent_well';
  } else if (
    rawText.includes('EXTRAER ESENCIA DEL POZO') ||
    rawText.includes('DESTILAR EL AGUA') ||
    (rawText.includes('EXTRAER') && rawText.includes('POZO'))
  ) {
    sceneType = 'EXTRACT_WELL_ESSENCE';
    animationType = 'POTION_BUBBLES';
    subject = 'luminous_vial';
    secondarySubject = 'phosphorescent_well';
  } else if (
    rawText.includes('SELLAR EL BROCAL') ||
    rawText.includes('SELLAR') && rawText.includes('AVANZAR')
  ) {
    sceneType = 'SEAL_WELL_COVER';
    animationType = 'SEAL_CRACKING';
    subject = 'carved_stone_cover';
    secondarySubject = 'stone_well_rim';
  } else if (rawText.includes('DESCIFRAR RUNAS DEL ESPECTRO')) {
    sceneType = 'DECIPHER_SPECTRAL_RUNES';
    animationType = 'RELIC_PULSE';
    subject = 'spectral_helm_runes';
  } else if (rawText.includes('LIBERAR SUS CADENAS') || rawText.includes('CADENAS DE HIERRO')) {
    sceneType = 'SHATTER_IRON_CHAINS';
    animationType = 'SPARKS_ANVIL';
    subject = 'shattering_shackles';
  } else if (rawText.includes('RODEAR EL PEDESTAL')) {
    sceneType = 'BYPASS_PEDESTAL_SILENTLY';
    animationType = 'RELIC_PULSE';
    subject = 'shadow_bypass_pedestal';
  } else if (rawText.includes('PLANOS DEL HERRERO')) {
    sceneType = 'STUDY_BLACKSMITH_PLANS';
    animationType = 'SCROLL_FLUTTER';
    subject = 'blacksmith_scroll';
  } else if (rawText.includes('AVIVAR LA FORJA') || rawText.includes('RECLAMAR ACERO')) {
    sceneType = 'STOKE_FORGE_CLAIM_STEEL';
    animationType = 'FLAME_FLICKER';
    subject = String(option?.grantsWeaponId || equippedWeaponId || 'espada_del_sepulcro');
  } else if (rawText.includes('BRASAS RESTANTES')) {
    sceneType = 'TAKE_REMAINING_EMBERS';
    animationType = 'FLAME_FLICKER';
    subject = 'glowing_ember_brazier';
  } else if (rawText.includes('CONTEMPLAR EL ESPEJO')) {
    sceneType = 'CONTEMPLATE_ASTRAL_MIRROR';
    animationType = 'CRYSTAL_REFRACTION';
    subject = 'astral_mirror';
  } else if (rawText.includes('QUEBRAR EL CRISTAL')) {
    sceneType = 'SHATTER_MIRROR_WITH_STEEL';
    animationType = 'CRYSTAL_REFRACTION';
    subject = String(option?.grantsWeaponId || equippedWeaponId || 'espada_oxidada');
  } else if (rawText.includes('CUBRIR EL ESPEJO')) {
    sceneType = 'COVER_MIRROR_WITH_CLOAK';
    animationType = 'SCROLL_FLUTTER';
    subject = 'shrouded_mirror';
  } else if (rawText.includes('HERIDAS DEL SABUESO') || rawText.includes('SABUESO')) {
    sceneType = 'HEAL_INJURED_HOUND';
    animationType = 'CLEANSING_RAYS';
    subject = 'crypt_hound_salve';
  } else if (
    rawText.includes('ALIJO DEL EXPLORADOR') ||
    rawText.includes('REGISTRAR CADÁVER') ||
    rawText.includes('RECOGER PERTRECHOS') ||
    rawText.includes('loot_pouch')
  ) {
    sceneType = 'SEARCH_FALLEN_CORPSE';
    animationType = 'POTION_BUBBLES';
    subject = 'explorer_satchel_and_vial';
  } else if (rawText.includes('OFRECER RACIONES')) {
    sceneType = 'OFFER_RATIONS_AND_PASS';
    animationType = 'RELIC_PULSE';
    subject = 'provisions_pack';
  } else if (rawText.includes('FORJAR ALIANZA') || rawText.includes('ALIANZA')) {
    sceneType = 'FORGE_ALLIANCE';
    animationType = 'WEAPON_SHIMMER';
    subject = 'clasped_gauntlets_weapons';
  } else if (
    rawText.includes('BEBER DE LA FUENTE') ||
    rawText.includes('BEBER')
  ) {
    sceneType = 'DRINK_FROM_FOUNTAIN';
    animationType = 'WATER_RIPPLES';
    subject = 'chalice_receiving_water';
  } else if (
    rawText.includes('FORJAR Y MEJORAR ARMA') ||
    rawText.includes('FORJAR ') ||
    rawText.includes('YUNQUE') ||
    Boolean(option?.isWeaponUpgradeOption && !rawText.includes('SANGRE'))
  ) {
    sceneType = 'FORGE_UPGRADE_EQUIPPED_WEAPON';
    animationType = 'SPARKS_ANVIL';
    subject = String(equippedWeaponId || 'espada_oxidada');
  } else if (
    rawText.includes('REPARAR ARMADURA') ||
    rawText.includes('EQUIPAR ARMA Y CORAZA') ||
    rawText.includes('loot_armor')
  ) {
    sceneType = 'REPAIR_OR_EQUIP_ARMOR';
    animationType = 'SPARKS_ANVIL';
    subject = String(option?.grantsArmorId || 'cota_de_malla_cripta');
  } else if (
    rawText.includes('ENCENDER EL BRASERO') ||
    rawText.includes('HOGUERA DE ALMAS') ||
    rawText.includes('DESCANSAR JUNTO A LA HOGUERA') ||
    rawText.includes('rest_heal')
  ) {
    sceneType = 'IGNITE_BRAZIER_OR_CAMPFIRE';
    animationType = 'FLAME_FLICKER';
    subject = 'soul_campfire';
  } else if (rawText.includes('ENTRENAR TÉCNICA') || rawText.includes('TEMPLE TÁCTICO')) {
    sceneType = 'TACTICAL_COMBAT_TRAINING';
    animationType = 'WEAPON_SHIMMER';
    subject = String(equippedWeaponId || 'espada_oxidada');
  } else if (rawText.includes('PACTO DE SANGRE') || rawText.includes('shrine_pact')) {
    sceneType = 'BLOOD_PACT_DARK_FORGE';
    animationType = 'FLAME_FLICKER';
    subject = String(equippedWeaponId || 'espada_oxidada');
  } else if (
    rawText.includes('ABRIR ARCA') ||
    rawText.includes('TESORO PROHIBIDO') ||
    rawText.includes('open_chest') ||
    rawText.includes('secret_hoard')
  ) {
    sceneType = 'OPEN_TREASURE_CHEST';
    animationType = 'TREASURE_SPARKLE';
    subject = String(option?.grantsWeaponId || 'arca_soberano');
  } else if (rawText.includes('DESACTIVAR ENGRANAJES') || rawText.includes('trap_disarm')) {
    sceneType = 'DISARM_TRAP_GEARS';
    animationType = 'SPARKS_ANVIL';
    subject = 'precision_cogs_lockpick';
  } else if (
    rawText.includes('ROMPER SELLO') ||
    rawText.includes('DISOLVER SELLOS') ||
    rawText.includes('trap_arcane')
  ) {
    sceneType = 'BREAK_MAGICAL_SEAL';
    animationType = 'SEAL_CRACKING';
    subject = 'cracking_runic_seal';
  } else if (rawText.includes('COMPUERTA DEL ARSENAL') || rawText.includes('path_left')) {
    sceneType = 'BREACH_ARSENAL_GATE';
    animationType = 'WEAPON_SHIMMER';
    subject = String(option?.grantsWeaponId || equippedWeaponId || 'espada_del_sepulcro');
  } else if (rawText.includes('GRIETA RÚNICA') || rawText.includes('CÁMARA OCULTA')) {
    sceneType = 'DISCOVER_RUNIC_WALL_CRACK';
    animationType = 'CRYSTAL_REFRACTION';
    subject = 'secret_wall_crack';
  } else if (rawText.includes('ELIXIR PURIFICADOR') || rawText.includes('shop_elixir')) {
    sceneType = 'BUY_PURIFYING_ELIXIR';
    animationType = 'POTION_BUBBLES';
    subject = 'solar_blood_elixir';
  } else if (
    rawText.includes('PURIFICAR') ||
    rawText.includes('PLEGARIA DE LUZ') ||
    rawText.includes('CANALIZAR ESENCIA') ||
    roomType === 'SHRINE'
  ) {
    sceneType = 'PURIFY_BIOME_ALTAR_OR_FOUNTAIN';
    animationType = 'CLEANSING_RAYS';
    subject = 'biome_ritual_basin';
  }

  return {
    id: `vis_${biomeId}_${sceneType.toLowerCase()}`,
    biomeId,
    eventId: option?.eventId || roomType,
    decisionId: option?.id || sceneType,
    sceneType,
    subject,
    secondarySubject,
    environmentElement,
    animationType,
    palette: {
      bgTop: pal.bgTop,
      bgBottom: pal.bgBottom,
      stonePrimary: pal.stonePrimary,
      stoneHighlight: pal.stoneHighlight,
      liquidOrGlow: pal.liquidOrGlow,
      liquidSecondary: pal.liquidSecondary,
      accent: pal.accent,
      particle: pal.particle,
    },
    visualLayers: {
      background: `biome_${biomeId}_architecture`,
      middle: secondarySubject,
      foreground: subject,
      effects: [animationType.toLowerCase(), pal.floraOrMotif.toLowerCase()],
    },
  };
}

/**
 * Renders the biome-specific background architecture + flora/ornament motif layer
 * inside a 64x44 pixel-art canvas so the same action looks distinct across biomes (Section 5).
 */
const BiomeContextualBackdropLayer: React.FC<{
  biomeId: CriptaDungeonId;
  palette: ReturnType<typeof getBiomeDecisionPalette>;
}> = ({ palette }) => {
  const motif = palette.floraOrMotif;
  return (
    <g>
      {/* Distant Stone Masonry Bricks */}
      <rect x="0" y="0" width="64" height="44" fill={palette.bgBottom} />
      <rect x="0" y="0" width="64" height="24" fill={palette.bgTop} opacity="0.85" />
      <rect x="3" y="4" width="12" height="5" fill={palette.stonePrimary} opacity="0.35" />
      <rect x="18" y="3" width="14" height="5" fill={palette.stonePrimary} opacity="0.28" />
      <rect x="36" y="4" width="12" height="5" fill={palette.stonePrimary} opacity="0.35" />
      <rect x="51" y="3" width="10" height="5" fill={palette.stonePrimary} opacity="0.28" />
      <rect x="8" y="11" width="14" height="5" fill={palette.stonePrimary} opacity="0.25" />
      <rect x="42" y="11" width="14" height="5" fill={palette.stonePrimary} opacity="0.25" />
      {/* Floor Ledge */}
      <rect x="0" y="35" width="64" height="9" fill={palette.stonePrimary} opacity="0.55" />
      <rect x="0" y="35" width="64" height="1" fill={palette.stoneHighlight} opacity="0.65" />

      {/* Biome-Specific Environmental Motifs (Section 5) */}
      {motif === 'MUSHROOMS_AND_ROOTS' && (
        <g>
          {/* Hanging Roots */}
          <rect x="5" y="0" width="2" height="14" fill="#14532D" />
          <rect x="7" y="0" width="1" height="9" fill="#166534" />
          <rect x="56" y="0" width="2" height="12" fill="#14532D" />
          {/* Glowing Fungal Mushrooms on Floor */}
          <rect x="4" y="31" width="6" height="2" fill="#16A34A" />
          <rect x="5" y="30" width="4" height="1" fill="#4ADE80" />
          <rect x="6" y="33" width="2" height="3" fill="#BBF7D0" />
          <rect x="54" y="32" width="5" height="2" fill="#16A34A" />
          <rect x="55" y="31" width="3" height="1" fill="#A3E635" />
          <rect x="56" y="34" width="2" height="2" fill="#BBF7D0" />
        </g>
      )}

      {motif === 'CORAL_AND_BUBBLES' && (
        <g>
          {/* Subaquatic Coral Branches & Shells */}
          <rect x="4" y="27" width="2" height="9" fill="#0E7490" />
          <rect x="2" y="29" width="2" height="4" fill="#22D3EE" />
          <rect x="6" y="28" width="2" height="5" fill="#2DD4BF" />
          <rect x="56" y="28" width="2" height="8" fill="#0E7490" />
          <rect x="58" y="30" width="2" height="4" fill="#22D3EE" />
          <rect x="9" y="34" width="4" height="2" fill="#FDE68A" />
        </g>
      )}

      {motif === 'BLOOD_CANDLES_GOLD' && (
        <g>
          {/* Ritual Candles & Gold Filigree */}
          <rect x="5" y="26" width="3" height="9" fill="#FDE68A" />
          <rect x="6" y="23" width="1" height="3" fill="#F97316" />
          <rect x="6" y="24" width="1" height="1" fill="#FEF08A" />
          <rect x="56" y="27" width="3" height="8" fill="#FDE68A" />
          <rect x="57" y="24" width="1" height="3" fill="#F97316" />
          <rect x="4" y="35" width="5" height="2" fill="#F59E0B" />
          <rect x="55" y="35" width="5" height="2" fill="#F59E0B" />
        </g>
      )}

      {motif === 'CONSTELLATION_BRASS' && (
        <g>
          {/* Brass Astrolabe Arcs & Star Dots */}
          <rect x="4" y="6" width="1" height="1" fill="#FEF08A" />
          <rect x="12" y="4" width="1" height="1" fill="#93C5FD" />
          <rect x="52" y="5" width="1" height="1" fill="#FEF08A" />
          <rect x="58" y="9" width="1" height="1" fill="#C084FC" />
          <rect x="3" y="29" width="4" height="6" fill="#D97706" opacity="0.7" />
          <rect x="57" y="29" width="4" height="6" fill="#D97706" opacity="0.7" />
        </g>
      )}

      {motif === 'VOID_SHARDS' && (
        <g>
          {/* Floating Anti-Gravity Void Fragments */}
          <rect x="5" y="10" width="3" height="5" fill="#581C87" />
          <rect x="6" y="11" width="1" height="3" fill="#D8B4FE" />
          <rect x="56" y="8" width="3" height="6" fill="#581C87" />
          <rect x="57" y="9" width="1" height="4" fill="#F43F5E" />
        </g>
      )}

      {motif === 'MAGMA_IRON' && (
        <g>
          {/* Molten Floor Seams & Iron Rivets */}
          <rect x="2" y="36" width="14" height="2" fill="#F97316" />
          <rect x="5" y="36" width="6" height="1" fill="#FEF08A" />
          <rect x="48" y="36" width="14" height="2" fill="#F97316" />
          <rect x="52" y="36" width="6" height="1" fill="#FEF08A" />
        </g>
      )}

      {(motif === 'CRYSTAL_PRISMS' || motif === 'FROST_ICICLES') && (
        <g>
          {/* Crystalline Spires on Left & Right */}
          <polygon points="3,35 6,24 9,35" fill={palette.liquidOrGlow} opacity="0.75" />
          <polygon points="5,35 6,26 7,35" fill="#FFFFFF" opacity="0.65" />
          <polygon points="55,35 58,25 61,35" fill={palette.liquidSecondary} opacity="0.75" />
        </g>
      )}
    </g>
  );
};

/**
 * Renders the Contextual Pixel-Art Decision Illustration (Sections 1–8).
 * Combines crisp pixel-art geometry (`shapeRendering="crispEdges"`) with smooth 60 FPS
 * environmental micro-animations (water ripples, bubbles, shimmer, embers, rays).
 */
export const LaCriptaContextualDecisionIllustration: React.FC<{
  biomeId?: CriptaDungeonId;
  roomType?: CriptaCanonicalRoomType;
  option?: Partial<CriptaRoomInteractiveOption> | null;
  cardTitle?: string;
  equippedWeaponId?: CriptaWeaponId | string | null;
  equippedWeaponLevel?: number;
}> = ({
  biomeId = 'catacumbas_del_rey',
  roomType = 'EVENT',
  option,
  cardTitle = '',
  equippedWeaponId = 'espada_oxidada',
  equippedWeaponLevel = 1,
}) => {
  const def = resolveDecisionVisualDefinition({
    biomeId: biomeId as CriptaDungeonId,
    roomType: roomType as CriptaCanonicalRoomType,
    option,
    cardTitle,
    equippedWeaponId,
  });
  const pal = getBiomeDecisionPalette(biomeId as CriptaDungeonId);
  const activeWeaponId = (option?.grantsWeaponId || equippedWeaponId || 'espada_oxidada') as CriptaWeaponId;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      <style>{`
        @keyframes criptaDecRipple {
          0%, 100% { transform: scaleX(0.92); opacity: 0.55; }
          50% { transform: scaleX(1.08); opacity: 0.95; }
        }
        @keyframes criptaDecFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes criptaDecBubble {
          0% { transform: translateY(4px); opacity: 0.2; }
          50% { opacity: 0.95; }
          100% { transform: translateY(-7px); opacity: 0; }
        }
        @keyframes criptaDecPulse {
          0%, 100% { opacity: 0.45; transform: scale(0.96); }
          50% { opacity: 0.92; transform: scale(1.05); }
        }
        @keyframes criptaDecHammer {
          0%, 100% { transform: rotate(0deg) translateY(0px); }
          45% { transform: rotate(-14deg) translateY(-2px); }
          60% { transform: rotate(8deg) translateY(1px); }
        }
      `}</style>

      {/* Smooth 60 FPS Ambient Radial Glow Layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 58%, ${pal.liquidOrGlow}33 0%, transparent 72%)`,
          animation: 'criptaDecPulse 3.2s ease-in-out infinite',
        }}
      />

      {/* Main 64x44 Crisp Pixel-Art Scene */}
      <svg
        viewBox="0 0 64 44"
        shapeRendering="crispEdges"
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      >
        <BiomeContextualBackdropLayer biomeId={biomeId} palette={pal} />

        {/* =================================================================
            SCENE 1: SUMERGIR EL ARMA EN LAS AGUAS (Actual Equipped Weapon entering glowing well)
            ================================================================= */}
        {def.sceneType === 'SUBMERGE_WEAPON_IN_WELL' && (
          <g>
            {/* Stone Well Back Rim */}
            <rect x="12" y="24" width="40" height="4" fill="#1E293B" />
            <rect x="14" y="25" width="36" height="3" fill={pal.stonePrimary} />
            {/* Glowing Biome-Specific Phosphorescent Water Surface */}
            <rect x="15" y="27" width="34" height="7" fill={pal.liquidSecondary} opacity="0.55" />
            <rect x="16" y="28" width="32" height="5" fill={pal.liquidOrGlow} opacity="0.85" />
            <rect x="20" y="29" width="24" height="2" fill="#FFFFFF" opacity="0.65" />
          </g>
        )}

        {/* =================================================================
            SCENE 2: EXTRAER ESENCIA DEL POZO ABISAL (Glass Vial filling with luminous liquid from well)
            ================================================================= */}
        {def.sceneType === 'EXTRACT_WELL_ESSENCE' && (
          <g>
            {/* Stone Well Base */}
            <rect x="12" y="29" width="40" height="11" fill="#0F172A" />
            <rect x="14" y="30" width="36" height="8" fill={pal.stonePrimary} />
            <rect x="16" y="30" width="32" height="3" fill={pal.liquidOrGlow} opacity="0.85" />
            {/* Rising Luminous Stream from Well into Flask */}
            <rect x="30" y="22" width="4" height="9" fill={pal.liquidOrGlow} opacity="0.75" />
            <rect x="31" y="20" width="2" height="11" fill="#FFFFFF" opacity="0.8" />
            {/* Detailed Alchemical Glass Vial / Flask in Foreground */}
            <rect x="28" y="5" width="8" height="3" fill="#B45309" />
            <rect x="29" y="5" width="4" height="2" fill="#FBBF24" />
            <rect x="27" y="8" width="10" height="2" fill="#E0F2FE" />
            <rect x="23" y="10" width="18" height="14" fill="#0F172A" />
            <rect x="24" y="11" width="16" height="12" fill="#38BDF8" opacity="0.28" />
            {/* Luminous Liquid Filling Inside Bottle */}
            <rect x="25" y="14" width="14" height="8" fill={pal.liquidSecondary} />
            <rect x="26" y="15" width="12" height="6" fill={pal.liquidOrGlow} />
            <rect x="25" y="14" width="14" height="1" fill="#FFFFFF" opacity="0.9" />
            {/* Glass Specular Highlight */}
            <rect x="25" y="11" width="2" height="9" fill="#FFFFFF" opacity="0.75" />
            {/* Rising Bubbles */}
            <rect x="29" y="18" width="2" height="2" fill="#FFFFFF" />
            <rect x="34" y="16" width="1" height="1" fill="#FFFFFF" />
            <rect x="22" y="25" width="2" height="2" fill={pal.particle} />
            <rect x="41" y="24" width="2" height="2" fill={pal.particle} />
          </g>
        )}

        {/* =================================================================
            SCENE 3: SELLAR EL BROCAL Y AVANZAR (Heavy carved stone slab sealing the well + coins)
            ================================================================= */}
        {def.sceneType === 'SEAL_WELL_COVER' && (
          <g>
            {/* Stone Well Base */}
            <rect x="12" y="25" width="40" height="14" fill="#0F172A" />
            <rect x="14" y="26" width="36" height="12" fill={pal.stonePrimary} />
            <rect x="18" y="26" width="28" height="2" fill={pal.liquidOrGlow} opacity="0.55" />
            {/* Heavy Carved Stone Cover Slab Sliding Shut Over Well */}
            <rect x="10" y="16" width="44" height="9" fill="#1E293B" />
            <rect x="11" y="17" width="42" height="7" fill={pal.stoneHighlight} />
            <rect x="13" y="18" width="38" height="2" fill="#E2E8F0" opacity="0.45" />
            {/* Carved Seal Rune on Cover */}
            <rect x="26" y="19" width="12" height="3" fill={pal.accent} />
            <rect x="30" y="17" width="4" height="7" fill={pal.accent} />
            {/* Gold Coins on Well Rim */}
            <rect x="15" y="24" width="4" height="2" fill="#FACC15" />
            <rect x="44" y="24" width="4" height="2" fill="#FACC15" />
            <rect x="46" y="23" width="3" height="2" fill="#FEF08A" />
          </g>
        )}

        {/* =================================================================
            SCENE 4: PURIFICAR ALTAR / FUENTE (Biome-Specific Fountain/Altar + Cleansing Light)
            ================================================================= */}
        {def.sceneType === 'PURIFY_BIOME_ALTAR_OR_FOUNTAIN' && (
          <g>
            {/* Descending Cleansing Light Rays */}
            <polygon points="24,0 40,0 46,34 18,34" fill={pal.accent} opacity="0.18" />
            <polygon points="28,0 36,0 40,34 24,34" fill="#FFFFFF" opacity="0.22" />
            {/* Carved Biome Ritual Basin / Altar */}
            <rect x="14" y="22" width="36" height="5" fill="#0F172A" />
            <rect x="15" y="23" width="34" height="3" fill={pal.stoneHighlight} />
            <rect x="20" y="27" width="24" height="9" fill={pal.stonePrimary} />
            <rect x="16" y="34" width="32" height="4" fill="#1E293B" />
            {/* Biome-Tinted Sacred Liquid Inside Basin */}
            <rect x="17" y="21" width="30" height="3" fill={pal.liquidSecondary} />
            <rect x="19" y="21" width="26" height="2" fill={pal.liquidOrGlow} />
            <rect x="24" y="21" width="16" height="1" fill="#FFFFFF" />
            {/* Radiant Cleansing Cross / Crest Above Basin */}
            <rect x="30" y="6" width="4" height="13" fill={pal.accent} />
            <rect x="25" y="10" width="14" height="3" fill={pal.accent} />
            <rect x="31" y="7" width="2" height="11" fill="#FFFFFF" />
            <rect x="27" y="11" width="10" height="1" fill="#FFFFFF" />
          </g>
        )}

        {/* =================================================================
            SCENE 5: DESCIFRAR RUNAS DEL ESPECTRO
            ================================================================= */}
        {def.sceneType === 'DECIPHER_SPECTRAL_RUNES' && (
          <g>
            {/* Spectral Knight Helm Silhouette */}
            <rect x="22" y="12" width="20" height="22" fill="#0F172A" />
            <rect x="24" y="14" width="16" height="18" fill="#334155" />
            <rect x="26" y="15" width="12" height="4" fill="#64748B" />
            {/* Glowing Spectral Eyes */}
            <rect x="26" y="21" width="4" height="2" fill={pal.liquidOrGlow} />
            <rect x="34" y="21" width="4" height="2" fill={pal.liquidOrGlow} />
            {/* Orbiting Deciphered Runes */}
            <rect x="11" y="10" width="5" height="6" fill={pal.accent} />
            <rect x="12" y="11" width="3" height="4" fill="#FFFFFF" />
            <rect x="48" y="10" width="5" height="6" fill={pal.liquidOrGlow} />
            <rect x="49" y="11" width="3" height="4" fill="#FFFFFF" />
            <rect x="29" y="4" width="6" height="5" fill={pal.accent} />
          </g>
        )}

        {/* =================================================================
            SCENE 6: LIBERAR SUS CADENAS DE HIERRO
            ================================================================= */}
        {def.sceneType === 'SHATTER_IRON_CHAINS' && (
          <g>
            {/* Left & Right Heavy Iron Chains */}
            <rect x="6" y="18" width="18" height="6" fill="#334155" />
            <rect x="8" y="19" width="14" height="2" fill="#94A3B8" />
            <rect x="40" y="18" width="18" height="6" fill="#334155" />
            <rect x="42" y="19" width="14" height="2" fill="#94A3B8" />
            {/* Shattering Center Shackle Link & Bright Sparks */}
            <rect x="26" y="15" width="5" height="4" fill="#64748B" />
            <rect x="34" y="22" width="5" height="4" fill="#64748B" />
            <polygon points="32,7 35,17 44,20 35,23 32,33 29,23 20,20 29,17" fill="#FACC15" />
            <polygon points="32,11 34,18 40,20 34,22 32,29 30,22 24,20 30,18" fill="#FFFFFF" />
          </g>
        )}

        {/* =================================================================
            SCENE 7: RODEAR EL PEDESTAL EN SILENCIO
            ================================================================= */}
        {def.sceneType === 'BYPASS_PEDESTAL_SILENTLY' && (
          <g>
            {/* Ancient Sealed Pedestal in Background */}
            <rect x="36" y="12" width="14" height="24" fill="#1E293B" />
            <rect x="38" y="14" width="10" height="20" fill={pal.stonePrimary} />
            <rect x="41" y="18" width="4" height="6" fill={pal.liquidOrGlow} opacity="0.65" />
            {/* Cloaked Explorer Silhouette Stepping Quietly in Foreground */}
            <polygon points="12,36 18,12 28,16 26,36" fill="#0F172A" />
            <polygon points="14,35 19,14 26,17 24,35" fill="#312E81" />
            <rect x="20" y="17" width="3" height="2" fill="#FDE047" />
            {/* Subtle Footstep Path Dots */}
            <rect x="28" y="37" width="3" height="1" fill={pal.accent} opacity="0.7" />
            <rect x="34" y="38" width="3" height="1" fill={pal.accent} opacity="0.9" />
          </g>
        )}

        {/* =================================================================
            SCENE 8: ESTUDIAR LOS PLANOS DEL HERRERO CIEGO
            ================================================================= */}
        {def.sceneType === 'STUDY_BLACKSMITH_PLANS' && (
          <g>
            {/* Unrolled Masterwork Parchment Scroll */}
            <rect x="11" y="8" width="42" height="26" fill="#78350F" />
            <rect x="13" y="10" width="38" height="22" fill="#1E3A8A" />
            <rect x="15" y="12" width="34" height="18" fill="#1D4ED8" />
            {/* Glowing Blueprint Schematic Lines of a Sword & Runes */}
            <rect x="19" y="19" width="22" height="3" fill="#93C5FD" />
            <rect x="37" y="15" width="3" height="11" fill="#FDE047" />
            <rect x="21" y="20" width="16" height="1" fill="#FFFFFF" />
            <rect x="20" y="14" width="6" height="2" fill="#67E8F9" />
            <rect x="20" y="26" width="8" height="2" fill="#67E8F9" />
            {/* Scroll Wooden Rollers */}
            <rect x="9" y="7" width="4" height="28" fill="#D97706" />
            <rect x="51" y="7" width="4" height="28" fill="#D97706" />
          </g>
        )}

        {/* =================================================================
            SCENE 9: TOMAR LAS BRASAS RESTANTES / ENCENDER EL BRASERO / HOGUERA
            ================================================================= */}
        {(def.sceneType === 'TAKE_REMAINING_EMBERS' ||
          def.sceneType === 'IGNITE_BRAZIER_OR_CAMPFIRE') && (
          <g>
            {/* Iron Brazier / Campfire Logs */}
            <rect x="16" y="29" width="32" height="5" fill="#451A03" />
            <rect x="14" y="26" width="36" height="4" fill="#334155" />
            <rect x="18" y="27" width="28" height="2" fill="#EA580C" />
            {/* Roaring Multi-Layered Pixel Flames */}
            <polygon points="20,27 26,10 32,18 38,7 44,27" fill="#EA580C" />
            <polygon points="23,27 28,14 32,20 36,11 41,27" fill="#FACC15" />
            <polygon points="27,27 32,16 37,27" fill="#FFFFFF" />
            {/* Rising Embers */}
            <rect x="22" y="7" width="2" height="2" fill="#FDE047" />
            <rect x="39" y="5" width="2" height="2" fill="#FB923C" />
            <rect x="31" y="4" width="2" height="2" fill="#FEF08A" />
          </g>
        )}

        {/* =================================================================
            SCENE 10: CONTEMPLAR EL ESPEJO DEL UMBRAL / CUBRIR EL ESPEJO
            ================================================================= */}
        {(def.sceneType === 'CONTEMPLATE_ASTRAL_MIRROR' ||
          def.sceneType === 'COVER_MIRROR_WITH_CLOAK') && (
          <g>
            {/* Ornate Silver Mirror Frame */}
            <rect x="19" y="4" width="26" height="34" fill="#334155" />
            <rect x="21" y="6" width="22" height="30" fill="#94A3B8" />
            <rect x="23" y="8" width="18" height="26" fill="#0F172A" />
            <rect x="24" y="9" width="16" height="24" fill="#38BDF8" opacity="0.35" />
            {/* Starry Reflection Inside Mirror */}
            <rect x="26" y="11" width="3" height="14" fill="#E0F2FE" opacity="0.7" />
            <rect x="31" y="14" width="4" height="4" fill="#FACC15" />
            <rect x="29" y="18" width="8" height="12" fill="#C084FC" opacity="0.65" />
            {def.sceneType === 'COVER_MIRROR_WITH_CLOAK' && (
              /* Heavy Velvet Cloak Draping Over Mirror */
              <polygon points="18,4 46,4 48,28 28,36 17,24" fill="#4C1D95" />
            )}
          </g>
        )}

        {/* =================================================================
            SCENE 11: CURAR LAS HERIDAS DEL SABUESO / OFRECER RACIONES
            ================================================================= */}
        {(def.sceneType === 'HEAL_INJURED_HOUND' ||
          def.sceneType === 'OFFER_RATIONS_AND_PASS') && (
          <g>
            {/* Seated Crypt Hound Silhouette */}
            <rect x="18" y="18" width="18" height="16" fill="#1E293B" />
            <rect x="20" y="20" width="14" height="14" fill="#475569" />
            {/* Hound Head & Ears */}
            <rect x="30" y="11" width="12" height="10" fill="#334155" />
            <rect x="31" y="7" width="3" height="4" fill="#1E293B" />
            <rect x="37" y="7" width="3" height="4" fill="#1E293B" />
            <rect x="40" y="14" width="5" height="5" fill="#475569" />
            {/* Glowing Loyal Amber Eye */}
            <rect x="37" y="13" width="2" height="2" fill="#FACC15" />
            {def.sceneType === 'HEAL_INJURED_HOUND' ? (
              <g>
                {/* Clean White Bandage & Crimson Healer Cross on Hound */}
                <rect x="23" y="23" width="9" height="6" fill="#F8FAFC" />
                <rect x="26" y="24" width="3" height="4" fill="#E11D48" />
                <rect x="25" y="25" width="5" height="2" fill="#E11D48" />
                {/* Healing Green Sparks */}
                <rect x="16" y="12" width="3" height="3" fill="#4ADE80" />
                <rect x="46" y="16" width="3" height="3" fill="#4ADE80" />
              </g>
            ) : (
              <g>
                {/* Wrapped Rations Bundle & Flask Offered in Front */}
                <rect x="42" y="27" width="12" height="8" fill="#B45309" />
                <rect x="44" y="28" width="8" height="5" fill="#FDE68A" />
              </g>
            )}
          </g>
        )}

        {/* =================================================================
            SCENE 12: REGISTRAR CADÁVER / ALIJO DEL EXPLORADOR / PERTRECHOS
            ================================================================= */}
        {(def.sceneType === 'SEARCH_FALLEN_CORPSE' ||
          def.sceneType === 'CLAIM_EXPLORER_STASH') && (
          <g>
            {/* Tasteful Fallen Explorer Cloak & Pauldron Silhouette on Stone */}
            <polygon points="6,36 18,24 44,28 54,36" fill="#1E293B" />
            <rect x="14" y="25" width="12" height="8" fill="#334155" />
            {/* Illuminated Leather Satchel & Healing Vial Being Recovered */}
            <rect x="24" y="14" width="16" height="14" fill="#78350F" />
            <rect x="26" y="16" width="12" height="10" fill="#B45309" />
            <rect x="30" y="19" width="4" height="4" fill="#FACC15" />
            {/* Glowing Potion Vial Beside Satchel */}
            <rect x="43" y="18" width="6" height="10" fill="#E11D48" />
            <rect x="44" y="19" width="3" height="7" fill="#FDA4AF" />
            <rect x="44" y="15" width="4" height="3" fill="#FBBF24" />
          </g>
        )}

        {/* =================================================================
            SCENE 13: BEBER DE LA FUENTE / ELIXIR PURIFICADOR
            ================================================================= */}
        {(def.sceneType === 'DRINK_FROM_FOUNTAIN' ||
          def.sceneType === 'BUY_PURIFYING_ELIXIR') && (
          <g>
            {/* Carved Fountain Spout Pouring Luminous Water */}
            <rect x="26" y="2" width="12" height="6" fill={pal.stoneHighlight} />
            <rect x="30" y="8" width="4" height="14" fill={pal.liquidOrGlow} />
            <rect x="31" y="8" width="2" height="14" fill="#FFFFFF" opacity="0.8" />
            {/* Golden Chalice / Cupped Gauntlet Receiving the Water */}
            <rect x="20" y="20" width="24" height="8" fill="#D97706" />
            <rect x="22" y="21" width="20" height="5" fill="#FACC15" />
            <rect x="22" y="20" width="20" height="2" fill={pal.liquidOrGlow} />
            <rect x="29" y="28" width="6" height="6" fill="#B45309" />
            <rect x="23" y="34" width="18" height="3" fill="#FACC15" />
          </g>
        )}

        {/* =================================================================
            SCENE 14: DESACTIVAR ENGRANAJES / ROMPER SELLO / INVESTIGAR GRIETA
            ================================================================= */}
        {def.sceneType === 'DISARM_TRAP_GEARS' && (
          <g>
            {/* Interlocking Bronze Gears */}
            <rect x="14" y="12" width="16" height="16" fill="#B45309" />
            <rect x="16" y="14" width="12" height="12" fill="#F59E0B" />
            <rect x="19" y="17" width="6" height="6" fill="#0F172A" />
            <rect x="32" y="18" width="14" height="14" fill="#475569" />
            <rect x="34" y="20" width="10" height="10" fill="#94A3B8" />
            {/* Precision Dagger / Lockpick Jamming the Mechanism */}
            <polygon points="48,6 54,10 28,24 25,21" fill="#E2E8F0" />
            <rect x="24" y="20" width="4" height="4" fill="#FACC15" />
          </g>
        )}

        {(def.sceneType === 'BREAK_MAGICAL_SEAL' ||
          def.sceneType === 'SHIELD_AGAINST_TRAP') && (
          <g>
            {/* Cracking Runic Seal Tablet */}
            <polygon points="32,4 50,14 50,32 32,40 14,32 14,14" fill="#1E1B4B" />
            <polygon points="32,7 47,15 47,30 32,37 17,30 17,15" fill={pal.stonePrimary} />
            {/* Glowing Fracture Lines Across the Seal */}
            <polygon points="31,7 34,18 44,22 33,25 32,37 29,24 20,19 30,17" fill={pal.liquidOrGlow} />
            <rect x="30" y="17" width="4" height="8" fill="#FFFFFF" />
          </g>
        )}

        {def.sceneType === 'DISCOVER_RUNIC_WALL_CRACK' && (
          <g>
            {/* Dark Masonry Wall with Glowing Secret Fissure */}
            <rect x="10" y="4" width="44" height="34" fill="#0F172A" />
            <rect x="12" y="6" width="40" height="30" fill={pal.stonePrimary} />
            <polygon points="31,6 35,15 29,23 36,30 31,36 27,28 32,21 26,14" fill={pal.liquidOrGlow} />
            <polygon points="32,9 34,15 30,22 34,29 31,34 29,27 32,21 28,14" fill="#FFFFFF" />
          </g>
        )}

        {/* =================================================================
            SCENE 15: FORJAR / MEJORAR ARMA / AVIVAR FORJA / PACTO DE SANGRE
            (Anvil Base underneath the real Weapon Sprite)
            ================================================================= */}
        {(def.sceneType === 'FORGE_UPGRADE_EQUIPPED_WEAPON' ||
          def.sceneType === 'STOKE_FORGE_CLAIM_STEEL' ||
          def.sceneType === 'BLOOD_PACT_DARK_FORGE' ||
          def.sceneType === 'BREACH_ARSENAL_GATE' ||
          def.sceneType === 'TACTICAL_COMBAT_TRAINING' ||
          def.sceneType === 'SHATTER_MIRROR_WITH_STEEL') && (
          <g>
            {/* Heavy Blacksmith Anvil or Pedestal Under the Weapon */}
            <rect x="14" y="28" width="36" height="5" fill="#334155" />
            <rect x="16" y="28" width="32" height="2" fill="#94A3B8" />
            <rect x="22" y="33" width="20" height="6" fill="#1E293B" />
            <rect
              x="18"
              y="26"
              width="28"
              height="2"
              fill={
                def.sceneType === 'BLOOD_PACT_DARK_FORGE'
                  ? '#F43F5E'
                  : '#F97316'
              }
            />
          </g>
        )}

        {/* =================================================================
            SCENE 16: ABRIR ARCA / TESORO PROHIBIDO (Ornate Chest Base)
            ================================================================= */}
        {def.sceneType === 'OPEN_TREASURE_CHEST' && (
          <g>
            {/* Open Ornate Treasure Coffer Spilling Gold */}
            <rect x="14" y="22" width="36" height="15" fill="#451A03" />
            <rect x="16" y="24" width="32" height="11" fill="#78350F" />
            <rect x="14" y="22" width="36" height="3" fill="#F59E0B" />
            <rect x="18" y="20" width="28" height="4" fill="#FACC15" />
            <rect x="29" y="24" width="6" height="6" fill="#FEF08A" />
          </g>
        )}
      </svg>

      {/* ===================================================================
          FOREGROUND DYNAMIC EQUIPMENT OVERLAY:
          Renders the player's REAL EQUIPPED WEAPON or GRANTED GEAR in context!
          =================================================================== */}
      {def.sceneType === 'SUBMERGE_WEAPON_IN_WELL' && (
        <>
          {/* Equipped Weapon Descending Partially Into the Well Water */}
          <div
            className="pointer-events-none absolute inset-x-0 top-[2px] flex items-center justify-center z-10"
            style={{
              clipPath: 'inset(0px 0px 11px 0px)',
              animation: 'criptaDecFloat 2.6s ease-in-out infinite',
            }}
          >
            <div className="rotate-[135deg] scale-95 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">
              <LaCriptaWeaponPixelIcon
                weaponId={activeWeaponId}
                upgradeLevel={equippedWeaponLevel}
                size={40}
              />
            </div>
          </div>

          {/* Foreground Water Ripple & Droplets Occluding the Submerged Tip */}
          <div
            className="pointer-events-none absolute bottom-[9px] w-14 h-2.5 rounded-full border z-20"
            style={{
              borderColor: pal.liquidOrGlow,
              backgroundColor: `${pal.liquidOrGlow}44`,
              boxShadow: `0 0 10px ${pal.liquidOrGlow}`,
              animation: 'criptaDecRipple 2.1s ease-in-out infinite',
            }}
          />
        </>
      )}

      {(def.sceneType === 'FORGE_UPGRADE_EQUIPPED_WEAPON' ||
        def.sceneType === 'STOKE_FORGE_CLAIM_STEEL' ||
        def.sceneType === 'BLOOD_PACT_DARK_FORGE' ||
        def.sceneType === 'BREACH_ARSENAL_GATE' ||
        def.sceneType === 'TACTICAL_COMBAT_TRAINING' ||
        def.sceneType === 'SHATTER_MIRROR_WITH_STEEL' ||
        def.sceneType === 'OPEN_TREASURE_CHEST') && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center pb-2 z-10"
          style={{ animation: 'criptaDecFloat 2.8s ease-in-out infinite' }}
        >
          <LaCriptaWeaponPixelIcon
            weaponId={activeWeaponId}
            upgradeLevel={
              def.sceneType === 'FORGE_UPGRADE_EQUIPPED_WEAPON'
                ? Math.min(3, equippedWeaponLevel + 1)
                : equippedWeaponLevel
            }
            size={38}
          />
        </div>
      )}

      {def.sceneType === 'REPAIR_OR_EQUIP_ARMOR' && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 z-10"
          style={{ animation: 'criptaDecFloat 2.8s ease-in-out infinite' }}
        >
          <LaCriptaArmorPixelIcon
            armorId={option?.grantsArmorId || 'cota_de_malla_cripta'}
            size={34}
          />
          {option?.grantsWeaponId && (
            <LaCriptaWeaponPixelIcon weaponId={option.grantsWeaponId} size={30} />
          )}
        </div>
      )}
    </div>
  );
};

export const LaCriptaContextualDecisionArt = LaCriptaContextualDecisionIllustration;

/**
 * Dungeon-Specific Pixel-Art Door Card Illustration with Closed -> Open Hover Sequence
 * and Strict Clipping so no stairs ever protrude outside the doorway (Sections 9 & 10).
 */
export const LaCriptaDoorCardIllustration: React.FC<{
  dungeon: CriptaDungeonDefinition;
  isHovered?: boolean;
  isReadyOrSelected?: boolean;
}> = ({ dungeon, isHovered = false, isReadyOrSelected = false }) => {
  const pal = dungeon.palette;
  const id = dungeon.id;
  const openActive = isHovered || isReadyOrSelected;
  const clipId = `door_card_aperture_${id}`;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      {/* Subtle Ambient Biome Halo */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: openActive ? 0.95 : 0.45,
          background: `radial-gradient(circle at 50% 55%, ${pal.glow}55 0%, transparent 72%)`,
        }}
      />

      <svg
        viewBox="0 0 64 46"
        shapeRendering="crispEdges"
        className="w-full h-full object-contain overflow-hidden"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          {/* Strict Aperture ClipPath so Interior Stairs & Light NEVER Protrude Outside Doorway */}
          <clipPath id={clipId}>
            <rect x="18" y="8" width="28" height="31" />
          </clipPath>
        </defs>

        {/* 1. OUTER DUNGEON MASONRY WALL & BIOME SURROUNDINGS */}
        <rect x="4" y="2" width="56" height="38" fill={pal.stoneDark} />
        <rect x="8" y="4" width="48" height="35" fill={pal.stone} />
        {/* Carved Archway Pillars & Lintel */}
        <rect x="12" y="4" width="6" height="35" fill={pal.stoneDark} />
        <rect x="46" y="4" width="6" height="35" fill={pal.stoneDark} />
        <rect x="10" y="3" width="44" height="5" fill={pal.stone} />
        <rect x="12" y="4" width="40" height="2" fill={pal.highlight} opacity="0.55" />

        {/* Biome-Specific Architectural Ornaments on the Door Frame (Section 9) */}
        {(id === 'cementerio_de_gigantes' || id === 'catacumbas_del_rey') && (
          <g>
            {/* Funerary Skulls & Weathered Bone Reliefs */}
            <rect x="13" y="12" width="4" height="4" fill="#E2E8F0" />
            <rect x="47" y="12" width="4" height="4" fill="#E2E8F0" />
            <rect x="29" y="3" width="6" height="4" fill="#CBD5E1" />
            <rect x="30" y="5" width="1" height="1" fill="#0F172A" />
            <rect x="33" y="5" width="1" height="1" fill="#0F172A" />
          </g>
        )}

        {(id === 'cripta_de_cristal' || id === 'cavernas_heladas') && (
          <g>
            {/* Crystal Formations Flanking the Frame */}
            <polygon points="8,38 11,22 14,38" fill={pal.highlight} opacity="0.85" />
            <polygon points="50,38 53,22 56,38" fill={pal.glow} opacity="0.85" />
            <rect x="29" y="3" width="6" height="4" fill="#67E8F9" />
          </g>
        )}

        {id === 'palacio_de_los_espejos' && (
          <g>
            {/* Silver Trim & Mirror Keystone */}
            <rect x="12" y="6" width="1" height="32" fill="#F8FAFC" />
            <rect x="51" y="6" width="1" height="32" fill="#F8FAFC" />
            <rect x="28" y="2" width="8" height="5" fill="#E2E8F0" />
            <rect x="30" y="3" width="4" height="3" fill="#C084FC" />
          </g>
        )}

        {(id === 'templo_sumergido' || id === 'alcantarillas_imperiales') && (
          <g>
            {/* Coral Clusters & Wet Cyan Moss */}
            <rect x="11" y="28" width="4" height="10" fill="#0E7490" />
            <rect x="10" y="30" width="3" height="5" fill="#22D3EE" />
            <rect x="49" y="29" width="4" height="9" fill="#0E7490" />
            <rect x="51" y="31" width="3" height="5" fill="#2DD4BF" />
          </g>
        )}

        {(id === 'forja_infernal' || id === 'fortaleza_goblin') && (
          <g>
            {/* Heated Furnace Seams & Iron Rivets */}
            <rect x="13" y="10" width="2" height="26" fill="#F97316" opacity="0.8" />
            <rect x="49" y="10" width="2" height="26" fill="#F97316" opacity="0.8" />
            <rect x="26" y="4" width="12" height="2" fill="#FEF08A" />
          </g>
        )}

        {/* 2. CLIPPED DOORWAY APERTURE: Interior Passage, Descending Stairs & Light (~450ms+) */}
        <g clipPath={`url(#${clipId})`}>
          {/* Deep Void Interior */}
          <rect x="18" y="8" width="28" height="31" fill="#050308" />

          {/* Interior Recessed Descending Steps (Strictly Clipped Inside Aperture!) */}
          <rect x="20" y="23" width="24" height="4" fill="#140F1D" />
          <rect x="22" y="23" width="20" height="1" fill={pal.stone} opacity="0.55" />
          <rect x="19" y="28" width="26" height="4" fill="#1C1528" />
          <rect x="20" y="28" width="24" height="1" fill={pal.highlight} opacity="0.45" />
          <rect x="18" y="33" width="28" height="5" fill="#251B34" />
          <rect x="19" y="33" width="26" height="1" fill={pal.highlight} opacity="0.6" />

          {/* Subtle Light Emerging Behind Open Doorway (~450ms+ sequence) */}
          <rect
            x="18"
            y="8"
            width="28"
            height="31"
            fill={pal.glow}
            className="transition-opacity duration-300 group-hover:delay-300"
            style={{ opacity: openActive ? 0.36 : 0 }}
          />
          <rect
            x="25"
            y="10"
            width="14"
            height="26"
            fill={pal.highlight}
            className="transition-opacity duration-300 group-hover:delay-300"
            style={{ opacity: openActive ? 0.28 : 0 }}
          />

          {/* 3. PHYSICAL LEFT & RIGHT DOOR PANELS (~180-450ms sequence) */}
          {/* Left Door Leaf */}
          <g
            className="transition-transform duration-300 ease-out group-hover:delay-150 group-hover:-translate-x-[10px]"
            style={{
              transform: openActive ? 'translateX(-10px)' : 'translateX(0px)',
            }}
          >
            <rect x="18" y="8" width="14" height="31" fill={pal.stoneDark} />
            <rect x="19" y="9" width="12" height="29" fill={pal.stone} />
            {/* Horizontal Iron Bands */}
            <rect x="18" y="13" width="14" height="2" fill="#1E293B" />
            <rect x="18" y="29" width="14" height="2" fill="#1E293B" />
            {/* Left Ring Handle & Rune (~100ms reaction) */}
            <rect
              x="27"
              y="20"
              width="3"
              height="4"
              fill={pal.highlight}
              className="transition-opacity duration-150 group-hover:delay-75"
              style={{ opacity: openActive ? 1 : 0.7 }}
            />
            <rect
              x="22"
              y="17"
              width="2"
              height="9"
              fill={pal.glow}
              className="transition-opacity duration-150 group-hover:delay-75"
              style={{ opacity: openActive ? 1 : 0.45 }}
            />
          </g>

          {/* Right Door Leaf */}
          <g
            className="transition-transform duration-300 ease-out group-hover:delay-150 group-hover:translate-x-[10px]"
            style={{
              transform: openActive ? 'translateX(10px)' : 'translateX(0px)',
            }}
          >
            <rect x="32" y="8" width="14" height="31" fill={pal.stoneDark} />
            <rect x="33" y="9" width="12" height="29" fill={pal.stone} />
            {/* Horizontal Iron Bands */}
            <rect x="32" y="13" width="14" height="2" fill="#1E293B" />
            <rect x="32" y="29" width="14" height="2" fill="#1E293B" />
            {/* Right Ring Handle & Rune (~100ms reaction) */}
            <rect
              x="34"
              y="20"
              width="3"
              height="4"
              fill={pal.highlight}
              className="transition-opacity duration-150 group-hover:delay-75"
              style={{ opacity: openActive ? 1 : 0.7 }}
            />
            <rect
              x="40"
              y="17"
              width="2"
              height="9"
              fill={pal.glow}
              className="transition-opacity duration-150 group-hover:delay-75"
              style={{ opacity: openActive ? 1 : 0.45 }}
            />
          </g>
        </g>

        {/* 4. FOREGROUND STONE THRESHOLD & FRAME OCCLUSION (Prevents any bottom protrusion) */}
        <rect x="16" y="7" width="32" height="2" fill={pal.stoneDark} />
        <rect x="6" y="38" width="52" height="5" fill={pal.stoneDark} />
        <rect x="8" y="38" width="48" height="2" fill={pal.stone} />
        <rect x="14" y="38" width="36" height="1" fill={pal.highlight} opacity="0.7" />

        {/* Flanking Wall Torches with Flickering Flame */}
        <rect x="14" y="18" width="2" height="5" fill="#78350F" />
        <rect x="13" y="15" width="4" height="3" fill={pal.glow} />
        <rect x="14" y="16" width="2" height="2" fill="#FEF08A" />

        <rect x="48" y="18" width="2" height="5" fill="#78350F" />
        <rect x="47" y="15" width="4" height="3" fill={pal.glow} />
        <rect x="48" y="16" width="2" height="2" fill="#FEF08A" />
      </svg>
    </div>
  );
};
