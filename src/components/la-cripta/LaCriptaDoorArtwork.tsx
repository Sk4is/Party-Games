import React from 'react';
import type { CriptaDungeonDefinition } from '../../types/laCripta';

interface LaCriptaDoorArtworkProps {
  dungeon: CriptaDungeonDefinition;
  isHovered: boolean;
  isVotedByMe: boolean;
  isOpening: boolean;
  voteCount: number;
}

/**
 * LA CRIPTA — Monumental Dark-Fantasy Pixel-Art Dungeon Entrances
 *
 * Permanent Baseline Architecture:
 * - `.dungeon-door-stage`: fixed visual height container
 * - `.dungeon-door-anchor`: `position: absolute; bottom: 0`
 * - Every door shares the exact same SVG coordinate space (`viewBox="0 0 140 170"`)
 *   and the exact same stone threshold baseline (`y = 154..166`).
 * - Decorative crowns, skulls, crystals, roots, pipes and gears never alter layout or floor Y.
 */
export const LaCriptaDoorArtwork: React.FC<LaCriptaDoorArtworkProps> = ({
  dungeon,
  isHovered,
  isVotedByMe,
  isOpening,
  voteCount,
}) => {
  const { palette, id } = dungeon;
  const activeIntensity = isOpening || isVotedByMe || isHovered || voteCount > 0;

  const renderUniqueDungeonArchitecture = () => {
    switch (id) {
      case 'cementerio_gigantes':
      case 'catacumbas_del_rey':
        return (
          <g>
            {/* Colossal Burial Monolith Backing & Cracked Grave Slabs */}
            <polygon points="14,34 26,10 114,10 126,34" fill="#171B1A" stroke="#080A09" strokeWidth="2" />
            <polygon points="20,32 30,14 110,14 120,32" fill={palette.stoneDark} />
            {/* Giant Ribcage Arches curving over the lintel */}
            <path
              d="M18,40 Q10,20 34,12 L40,18 Q20,24 24,42 Z"
              fill="#C8C2B0"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <path
              d="M122,40 Q130,20 106,12 L100,18 Q120,24 116,42 Z"
              fill="#C8C2B0"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <path
              d="M24,54 Q14,36 38,24 L42,29 Q24,38 28,54 Z"
              fill="#9E9785"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <path
              d="M116,54 Q126,36 102,24 L98,29 Q116,38 112,54 Z"
              fill="#9E9785"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Giant Cracked Titan Skull at Keystone */}
            <rect x="52" y="4" width="36" height="24" fill="#D5CEBC" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="56" y="6" width="28" height="6" fill="#E8E2D2" />
            <polygon points="52,18 46,26 54,28" fill="#ACA592" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="88,18 94,26 86,28" fill="#ACA592" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Skull Eye Sockets with Spectral Green Light */}
            <rect x="57" y="13" width="9" height="8" fill="#0B0A0E" />
            <rect x="74" y="13" width="9" height="8" fill="#0B0A0E" />
            <rect
              x="59"
              y="15"
              width="5"
              height="4"
              fill={activeIntensity ? palette.highlight : palette.glow}
            />
            <rect
              x="76"
              y="15"
              width="5"
              height="4"
              fill={activeIntensity ? palette.highlight : palette.glow}
            />
            {/* Skull Nasal Cavity & Giant Jaw Teeth */}
            <polygon points="70,18 67,24 73,24" fill="#0B0A0E" />
            <rect x="58" y="26" width="4" height="6" fill="#C8C2B0" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="64" y="26" width="4" height="7" fill="#D5CEBC" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="72" y="26" width="4" height="7" fill="#D5CEBC" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="78" y="26" width="4" height="6" fill="#C8C2B0" stroke="#0B0A0E" strokeWidth="1" />
            {/* Fracture crack on skull */}
            <polyline points="66,5 63,11 68,14 65,19" fill="none" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Tattered Burial Cloth Banners hanging down both pillars */}
            <polygon
              points="17,44 29,44 29,96 25,88 21,98 17,90"
              fill="#2D3A34"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <rect x="21" y="50" width="4" height="28" fill={palette.glow} opacity="0.55" />
            <polygon
              points="111,44 123,44 123,92 119,98 115,88 111,96"
              fill="#2D3A34"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <rect x="115" y="50" width="4" height="28" fill={palette.glow} opacity="0.55" />
            {/* Old Iron Grave Chains & Cracked Headstones at Base */}
            <rect x="8" y="138" width="14" height="18" fill="#313936" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="12" y="133" width="6" height="5" fill="#313936" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="118" y="140" width="14" height="16" fill="#313936" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Spectral Mist along the floor baseline */}
            <rect x="24" y="150" width="92" height="4" fill={palette.glow} opacity="0.28" />
          </g>
        );

      case 'cripta_cristal':
        return (
          <g>
            {/* Dark Carved Obsidian Frame with Prismatic Crystal Clusters */}
            <polygon
              points="68,2 56,28 84,28"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon points="68,4 60,26 70,26" fill="#E6FFFA" opacity="0.65" />
            <polygon
              points="46,8 38,30 58,28"
              fill={palette.glow}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="94,8 82,28 102,30"
              fill="#9F7AEA"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="26,14 16,34 36,32"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="114,14 104,32 124,34"
              fill={palette.glow}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Crystal growths bursting from Left & Right Pillars */}
            <polygon
              points="6,64 18,54 20,72"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="8,82 18,74 18,90"
              fill="#9F7AEA"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="134,64 122,54 120,72"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="132,82 122,74 122,90"
              fill="#9F7AEA"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Crystalline Stalagmites anchored at floor baseline */}
            <polygon
              points="10,156 18,128 26,156"
              fill={palette.glow}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="20,156 26,136 32,156"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="114,156 122,128 130,156"
              fill="#9F7AEA"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="108,156 114,138 120,156"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Floating Crystal Shards around the Arch */}
            <polygon points="12,38 16,32 20,38 16,44" fill={palette.highlight} />
            <polygon points="124,38 128,32 132,38 128,44" fill="#D6BCFA" />
            {/* Prismatic veins in pillars */}
            <line x1="22" y1="44" x2="26" y2="124" stroke={palette.highlight} strokeWidth="2" opacity="0.75" />
            <line x1="118" y1="44" x2="114" y2="124" stroke="#B794F4" strokeWidth="2" opacity="0.75" />
          </g>
        );

      case 'santuario_fuego':
        return (
          <g>
            {/* Charred Basalt Horned Altar Crown & Living Pixel Flames */}
            <polygon points="18,32 8,10 30,24" fill="#2D1410" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="122,32 132,10 110,24" fill="#2D1410" stroke="#0B0A0E" strokeWidth="2" />
            {/* Central Brazier Basin */}
            <polygon points="46,28 54,16 86,16 94,28" fill="#3B1A14" stroke="#0B0A0E" strokeWidth="2" />
            {/* Multi-layered Pixel Flame Plume */}
            <polygon points="70,2 56,22 84,22" fill={palette.glow} />
            <polygon points="58,6 48,24 66,24" fill="#DD6B20" />
            <polygon points="82,6 74,24 92,24" fill="#DD6B20" />
            <polygon points="70,6 62,22 78,22" fill={palette.highlight} />
            <rect x="66" y="12" width="8" height="8" fill="#FFFBEB" />
            {/* Side Torch Braziers on Pillars */}
            <rect x="16" y="54" width="12" height="8" fill="#1A1110" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="22,42 16,54 28,54" fill={palette.glow} />
            <polygon points="22,46 19,54 25,54" fill={palette.highlight} />
            <rect x="112" y="54" width="12" height="8" fill="#1A1110" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="118,42 112,54 124,54" fill={palette.glow} />
            <polygon points="118,46 115,54 121,54" fill={palette.highlight} />
            {/* Molten Magma Veins Cracked into the Pillars */}
            <polyline
              points="20,66 25,82 19,98 26,118 21,144"
              fill="none"
              stroke={palette.glow}
              strokeWidth="2.5"
            />
            <polyline
              points="120,66 115,82 121,98 114,118 119,144"
              fill="none"
              stroke={palette.glow}
              strokeWidth="2.5"
            />
            {/* Glowing Magma Vent Grates at Threshold */}
            <rect x="34" y="156" width="72" height="4" fill={palette.glow} opacity="0.85" />
          </g>
        );

      case 'laboratorio_alquimico':
      case 'alcantarillas_septicas':
        return (
          <g>
            {/* Pressurized Copper Pipes & Alchemical Glass Condensers */}
            <rect x="28" y="10" width="84" height="6" fill="#744210" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="32" y="12" width="76" height="2" fill="#D69E2E" />
            {/* 3 Bubbling Alchemical Glass Tanks on Lintel */}
            <rect x="36" y="4" width="16" height="22" fill="#111C18" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="38" y="11" width="12" height="13" fill={palette.glow} />
            <rect x="40" y="7" width="3" height="3" fill={palette.highlight} />
            <rect x="62" y="2" width="16" height="24" fill="#111C18" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="64" y="8" width="12" height="16" fill={palette.highlight} />
            <rect x="68" y="4" width="4" height="3" fill="#FFFFFF" />
            <rect x="88" y="4" width="16" height="22" fill="#111C18" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="90" y="12" width="12" height="12" fill={palette.glow} />
            {/* Side Copper Conduits & Valve Wheels along Pillars */}
            <rect x="10" y="40" width="6" height="114" fill="#744210" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="124" y="40" width="6" height="114" fill="#744210" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Glass Sight-Tubes glowing with green mutagen */}
            <rect x="19" y="62" width="6" height="38" fill="#0B0A0E" />
            <rect x="20" y="68" width="4" height="30" fill={palette.glow} />
            <rect x="115" y="62" width="6" height="38" fill="#0B0A0E" />
            <rect x="116" y="68" width="4" height="30" fill={palette.glow} />
            {/* Dripping Acid Drops from Lintel */}
            <polygon points="50,36 48,44 52,44" fill={palette.highlight} />
            <polygon points="90,36 88,46 92,46" fill={palette.glow} />
            {/* Toxic Puddle Seepage at Floor Baseline */}
            <rect x="28" y="154" width="84" height="4" fill={palette.glow} opacity="0.65" />
          </g>
        );

      case 'trono_hueso':
        return (
          <g>
            {/* Sovereign Ossuary Crown & Crimson-Gold Reliquary */}
            <polygon
              points="40,26 44,4 58,16 70,2 82,16 96,4 100,26"
              fill={palette.highlight}
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Royal Crimson Jewels in the Bone Crown */}
            <rect x="67" y="10" width="6" height="8" fill="#E53E3E" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="50" y="14" width="5" height="6" fill={palette.glow} stroke="#0B0A0E" strokeWidth="1" />
            <rect x="85" y="14" width="5" height="6" fill={palette.glow} stroke="#0B0A0E" strokeWidth="1" />
            {/* Stacked Ossuary Skulls embedded down Left & Right Pillars */}
            {[46, 68, 90, 112].map((yPos) => (
              <g key={yPos}>
                <rect x="16" y={yPos} width="12" height="12" fill="#D6CEBF" stroke="#0B0A0E" strokeWidth="1.5" />
                <rect x="18" y={yPos + 4} width="3" height="3" fill="#0B0A0E" />
                <rect x="23" y={yPos + 4} width="3" height="3" fill="#0B0A0E" />
                <rect x="112" y={yPos} width="12" height="12" fill="#D6CEBF" stroke="#0B0A0E" strokeWidth="1.5" />
                <rect x="114" y={yPos + 4} width="3" height="3" fill="#0B0A0E" />
                <rect x="119" y={yPos + 4} width="3" height="3" fill="#0B0A0E" />
              </g>
            ))}
            {/* Bone Spikes flanking the Archway */}
            <polygon points="14,28 6,16 22,22" fill="#D6CEBF" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="126,28 134,16 118,22" fill="#D6CEBF" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      case 'forja_abismal':
        return (
          <g>
            {/* Heavy Riveted Dark-Iron Blast Frame & Anvil Crest */}
            <polygon
              points="46,8 94,8 86,18 92,26 48,26 54,18"
              fill="#2D3748"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <rect x="58" y="12" width="24" height="6" fill={palette.glow} />
            {/* Giant Iron Gear Teeth & Riveted Armor Plates on Pillars */}
            <rect x="10" y="36" width="22" height="118" fill="#1A202C" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="36" width="22" height="118" fill="#1A202C" stroke="#0B0A0E" strokeWidth="2" />
            {/* Glowing Furnace Vents along both iron pillars */}
            {[50, 74, 98, 122].map((yPos) => (
              <g key={yPos}>
                <rect x="15" y={yPos} width="12" height="8" fill="#0B0A0E" />
                <rect x="17" y={yPos + 2} width="8" height="4" fill={palette.glow} />
                <rect x="113" y={yPos} width="12" height="8" fill="#0B0A0E" />
                <rect x="115" y={yPos + 2} width="8" height="4" fill={palette.glow} />
              </g>
            ))}
            {/* Heavy Hanging Forge Chains */}
            <rect x="34" y="34" width="4" height="22" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="102" y="34" width="4" height="22" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
            {/* Molten Slag Channel at Floor Threshold */}
            <rect x="26" y="155" width="88" height="4" fill={palette.highlight} />
          </g>
        );

      case 'jardin_marchito':
        return (
          <g>
            {/* Gnarled Thorny Briar Arch & Bioluminescent Fungal Growths */}
            <path
              d="M14,148 C8,104 16,58 28,22 C44,8 96,8 112,22 C124,58 132,104 126,148"
              fill="none"
              stroke="#274029"
              strokeWidth="6"
            />
            {/* Withered Golden-Green Blossoms & Spore Pods */}
            <rect x="62" y="6" width="16" height="14" fill={palette.glow} stroke="#0B0A0E" strokeWidth="2" />
            <rect x="66" y="10" width="8" height="6" fill={palette.highlight} />
            <rect x="34" y="14" width="12" height="10" fill="#9AE6B4" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="94" y="14" width="12" height="10" fill="#9AE6B4" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Shelf Mushrooms & Hanging Vines on Pillars */}
            <polygon points="8,72 26,68 26,78" fill={palette.highlight} stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="132,84 114,80 114,90" fill={palette.highlight} stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="38" y="34" width="4" height="26" fill="#38A169" />
            <rect x="52" y="34" width="3" height="18" fill="#68D391" />
            <rect x="86" y="34" width="4" height="24" fill="#38A169" />
            {/* Root tendrils anchored strictly above y=156 */}
            <polygon points="8,156 24,140 34,156" fill="#223824" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="106,156 116,140 132,156" fill="#223824" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      case 'biblioteca_olvidada':
        return (
          <g>
            {/* Arcane Archive Pediment & Levitating Grimoire Seal */}
            <rect x="48" y="4" width="44" height="22" fill="#2A1B3D" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="52" y="8" width="16" height="14" fill="#F6E05E" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="72" y="8" width="16" height="14" fill="#FAF089" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="68" y="6" width="4" height="18" fill={palette.glow} />
            {/* Glowing Runic Inscriptions carved vertically into Pillars */}
            {[46, 62, 78, 94, 110, 126].map((yPos) => (
              <g key={yPos}>
                <rect x="19" y={yPos} width="6" height="8" fill={palette.highlight} opacity="0.85" />
                <rect x="115" y={yPos} width="6" height="8" fill={palette.highlight} opacity="0.85" />
              </g>
            ))}
            {/* Floating Candle Flames & Levitating Pages */}
            <rect x="20" y="14" width="4" height="10" fill="#EDF2F7" stroke="#0B0A0E" strokeWidth="1" />
            <polygon points="22,6 19,14 25,14" fill="#F6E05E" />
            <rect x="116" y="14" width="4" height="10" fill="#EDF2F7" stroke="#0B0A0E" strokeWidth="1" />
            <polygon points="118,6 115,14 121,14" fill="#F6E05E" />
          </g>
        );

      case 'foso_almas':
      case 'el_abismo':
        return (
          <g>
            {/* Tormented Soul Monoliths & Shackled Spirit Keystone */}
            <polygon
              points="70,2 50,22 70,32 90,22"
              fill="#1A202C"
              stroke={palette.glow}
              strokeWidth="2"
            />
            <rect x="62" y="12" width="16" height="12" fill={palette.highlight} />
            <rect x="65" y="15" width="4" height="4" fill="#0B0A0E" />
            <rect x="71" y="15" width="4" height="4" fill="#0B0A0E" />
            {/* Heavy Soul Chains Crossing the Archway */}
            <line x1="16" y1="22" x2="54" y2="38" stroke={palette.highlight} strokeWidth="3" strokeDasharray="4 2" />
            <line x1="124" y1="22" x2="86" y2="38" stroke={palette.highlight} strokeWidth="3" strokeDasharray="4 2" />
            {/* Wailing Soul Masks carved into the Pillars */}
            {[58, 96].map((yPos) => (
              <g key={yPos}>
                <rect x="16" y={yPos} width="12" height="16" fill="#2D3748" stroke="#0B0A0E" strokeWidth="1.5" />
                <rect x="18" y={yPos + 4} width="3" height="3" fill={palette.highlight} />
                <rect x="23" y={yPos + 4} width="3" height="3" fill={palette.highlight} />
                <rect x="20" y={yPos + 10} width="4" height="4" fill="#0B0A0E" />
                <rect x="112" y={yPos} width="12" height="16" fill="#2D3748" stroke="#0B0A0E" strokeWidth="1.5" />
                <rect x="114" y={yPos + 4} width="3" height="3" fill={palette.highlight} />
                <rect x="119" y={yPos + 4} width="3" height="3" fill={palette.highlight} />
                <rect x="116" y={yPos + 10} width="4" height="4" fill="#0B0A0E" />
              </g>
            ))}
          </g>
        );

      case 'reloj_eterno':
      default:
        return (
          <g>
            {/* Horological Astrolabe Dial & Interlocking Bronze-Gold Gears */}
            <circle
              cx="70"
              cy="18"
              r="14"
              fill="#1A1829"
              stroke={palette.highlight}
              strokeWidth="2.5"
            />
            <circle cx="70" cy="18" r="9" fill="none" stroke={palette.glow} strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Clock Hands */}
            <line x1="70" y1="18" x2="70" y2="7" stroke={palette.highlight} strokeWidth="2.5" />
            <line x1="70" y1="18" x2="79" y2="18" stroke={palette.glow} strokeWidth="2" />
            <rect x="68" y="16" width="4" height="4" fill="#FFFFFF" />
            {/* Side Interlocking Clockwork Cogs */}
            <circle cx="42" cy="22" r="8" fill={palette.stoneDark} stroke={palette.glow} strokeWidth="2" />
            <circle cx="98" cy="22" r="8" fill={palette.stoneDark} stroke={palette.glow} strokeWidth="2" />
            {/* Pendulum Columns & Temporal Hourglass Reliefs on Pillars */}
            <polygon points="18,56 26,56 22,68 26,80 18,80 22,68" fill={palette.highlight} />
            <polygon points="114,56 122,56 118,68 122,80 114,80 118,68" fill={palette.highlight} />
          </g>
        );
    }
  };

  return (
    <div className="dungeon-door-stage relative w-[185px] sm:w-[220px] lg:w-[248px] h-[225px] sm:h-[268px] lg:h-[302px] mx-auto select-none overflow-visible">
      <div className="dungeon-door-anchor absolute inset-x-0 bottom-0 h-full flex items-end justify-center">
        {/* =====================================================================
            AMBIENT BIOME HALO BEHIND THE MONUMENTAL ARCHWAY
            ===================================================================== */}
        <div
          className="pointer-events-none absolute inset-x-4 top-3 bottom-2 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 58%, ${palette.glow}${
              isOpening ? '77' : activeIntensity ? '40' : '1C'
            } 0%, transparent 72%)`,
            transform: isOpening
              ? 'scale(1.12)'
              : activeIntensity
              ? 'scale(1.04)'
              : 'scale(1)',
          }}
        />

        {/* =====================================================================
            INNER DUNGEON PORTAL DEPTH & ANIMATED DOUBLE-LEAF DOORS
            Anchored strictly to the same floor baseline (% coordinates match SVG)
            ===================================================================== */}
        <div
          className="absolute left-[21.5%] right-[21.5%] top-[21.2%] bottom-[8.2%] overflow-hidden bg-[#06050A]"
          style={{
            perspective: '700px',
            boxShadow: isOpening
              ? `inset 0 0 42px ${palette.highlight}, 0 0 28px ${palette.glow}`
              : `inset 0 0 20px rgba(0,0,0,0.95)`,
          }}
        >
          {/* Deep Corridor Interior revealed when the door swings open */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: isOpening ? 1 : activeIntensity ? 0.65 : 0.3,
              background: `radial-gradient(circle at 50% 52%, ${palette.highlight}88 0%, ${palette.glow}55 38%, #07050A 82%)`,
            }}
          >
            {/* Perspective Corridor Arches receding into the dungeon */}
            <div
              className="absolute inset-[14%] border-2 opacity-60"
              style={{ borderColor: palette.glow }}
            />
            <div
              className="absolute inset-[28%] border opacity-80"
              style={{ borderColor: palette.highlight }}
            />
            {/* Stone Stairway / Floor Perspective Lines leading inside */}
            <div
              className="absolute inset-x-0 bottom-0 h-[32%]"
              style={{
                background: `linear-gradient(180deg, ${palette.glow}33 0%, ${palette.stoneDark} 100%)`,
              }}
            />
            {/* Beckoning Vertical Portal Seam */}
            <div
              className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-2 transition-all duration-500"
              style={{
                backgroundColor: palette.highlight,
                boxShadow: `0 0 18px ${palette.highlight}, 0 0 32px ${palette.glow}`,
                opacity: isOpening ? 1 : activeIntensity ? 0.75 : 0.3,
                width: isOpening ? '40%' : activeIntensity ? '6px' : '2px',
              }}
            />
          </div>

          {/* Left & Right Heavy Dungeon Door Leaves */}
          <div className="relative z-10 w-full h-full flex">
            {/* LEFT LEAF */}
            <div
              className="w-1/2 h-full border-r border-black/90 flex flex-col justify-between p-1.5 transition-transform duration-700 ease-out"
              style={{
                backgroundColor: palette.stoneDark,
                backgroundImage: `linear-gradient(180deg, ${palette.stone}44 0%, ${palette.stoneDark} 55%, #07060B 100%)`,
                transformOrigin: 'left center',
                transform: isOpening
                  ? 'rotateY(-76deg)'
                  : isHovered || isVotedByMe
                  ? 'rotateY(-12deg)'
                  : 'rotateY(0deg)',
                boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.85)',
              }}
            >
              {/* Iron Studded Crossbars */}
              <div
                className="w-full h-2.5 border border-black/90 flex items-center justify-around"
                style={{ backgroundColor: palette.stone }}
              >
                <span className="w-1 h-1 bg-black/80" />
                <span className="w-1 h-1 bg-black/80" />
              </div>
              <div
                className="w-5/6 h-11 mx-auto border border-black/85 flex items-center justify-center relative"
                style={{ backgroundColor: palette.stone }}
              >
                <div
                  className="w-2.5 h-2.5 rotate-45 transition-colors duration-300"
                  style={{
                    backgroundColor: activeIntensity ? palette.highlight : palette.glow,
                    boxShadow: activeIntensity ? `0 0 8px ${palette.glow}` : 'none',
                  }}
                />
              </div>
              {/* Heavy Iron Ring Knockers */}
              <div
                className="self-end mr-1 w-3.5 h-3.5 border-2 rounded-none"
                style={{
                  borderColor: activeIntensity ? palette.highlight : palette.glow,
                  backgroundColor: '#0A080E',
                }}
              />
              <div
                className="w-5/6 h-11 mx-auto border border-black/85 flex items-center justify-center"
                style={{ backgroundColor: palette.stone }}
              >
                <div className="w-1.5 h-5 bg-black/60" />
              </div>
              <div
                className="w-full h-2.5 border border-black/90 flex items-center justify-around"
                style={{ backgroundColor: palette.stone }}
              >
                <span className="w-1 h-1 bg-black/80" />
                <span className="w-1 h-1 bg-black/80" />
              </div>
            </div>

            {/* RIGHT LEAF */}
            <div
              className="w-1/2 h-full border-l border-black/90 flex flex-col justify-between p-1.5 transition-transform duration-700 ease-out"
              style={{
                backgroundColor: palette.stoneDark,
                backgroundImage: `linear-gradient(180deg, ${palette.stone}44 0%, ${palette.stoneDark} 55%, #07060B 100%)`,
                transformOrigin: 'right center',
                transform: isOpening
                  ? 'rotateY(76deg)'
                  : isHovered || isVotedByMe
                  ? 'rotateY(12deg)'
                  : 'rotateY(0deg)',
                boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.85)',
              }}
            >
              <div
                className="w-full h-2.5 border border-black/90 flex items-center justify-around"
                style={{ backgroundColor: palette.stone }}
              >
                <span className="w-1 h-1 bg-black/80" />
                <span className="w-1 h-1 bg-black/80" />
              </div>
              <div
                className="w-5/6 h-11 mx-auto border border-black/85 flex items-center justify-center relative"
                style={{ backgroundColor: palette.stone }}
              >
                <div
                  className="w-2.5 h-2.5 rotate-45 transition-colors duration-300"
                  style={{
                    backgroundColor: activeIntensity ? palette.highlight : palette.glow,
                    boxShadow: activeIntensity ? `0 0 8px ${palette.glow}` : 'none',
                  }}
                />
              </div>
              <div
                className="self-start ml-1 w-3.5 h-3.5 border-2 rounded-none"
                style={{
                  borderColor: activeIntensity ? palette.highlight : palette.glow,
                  backgroundColor: '#0A080E',
                }}
              />
              <div
                className="w-5/6 h-11 mx-auto border border-black/85 flex items-center justify-center"
                style={{ backgroundColor: palette.stone }}
              >
                <div className="w-1.5 h-5 bg-black/60" />
              </div>
              <div
                className="w-full h-2.5 border border-black/90 flex items-center justify-around"
                style={{ backgroundColor: palette.stone }}
              >
                <span className="w-1 h-1 bg-black/80" />
                <span className="w-1 h-1 bg-black/80" />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            HIGH-DETAIL PIXEL-ART SVG ARCHWAY, MASONRY & BESPOKE BIOME ARCHITECTURE
            Unified viewBox="0 0 140 170" with identical floor baseline y=156..168
            ===================================================================== */}
        <svg
          viewBox="0 0 140 170"
          className="relative z-20 w-full h-full pointer-events-none pixelated-art block"
          shapeRendering="crispEdges"
        >
          {/* Outer Shadow Backing */}
          <rect x="14" y="34" width="112" height="124" fill="#07060A" opacity="0.55" />

          {/* Left & Right Monumental Ashlar Stone Pillars (Identical coordinates on every door) */}
          <rect
            x="14"
            y="34"
            width="18"
            height="122"
            fill={palette.stone}
            stroke={activeIntensity ? palette.glow : '#0B0A0E'}
            strokeWidth="2"
          />
          <rect x="16" y="36" width="4" height="118" fill={palette.highlight} opacity="0.18" />
          <rect x="26" y="36" width="4" height="118" fill={palette.stoneDark} />

          <rect
            x="108"
            y="34"
            width="18"
            height="122"
            fill={palette.stone}
            stroke={activeIntensity ? palette.glow : '#0B0A0E'}
            strokeWidth="2"
          />
          <rect x="110" y="36" width="4" height="118" fill={palette.stoneDark} />
          <rect x="120" y="36" width="4" height="118" fill={palette.highlight} opacity="0.18" />

          {/* Deliberate Pixel Masonry Courses & Cracks on Left & Right Pillars */}
          {[52, 70, 88, 106, 124, 140].map((yCourse) => (
            <g key={yCourse}>
              <line x1="14" y1={yCourse} x2="32" y2={yCourse} stroke="#0B0A0E" strokeWidth="2" />
              <line x1="108" y1={yCourse} x2="126" y2={yCourse} stroke="#0B0A0E" strokeWidth="2" />
            </g>
          ))}

          {/* Inner Arch Jamb Trim */}
          <rect x="30" y="36" width="3" height="120" fill="#0B0A0E" />
          <rect x="107" y="36" width="3" height="120" fill="#0B0A0E" />

          {/* Top Monumental Stone Lintel & Cornice */}
          <polygon
            points="8,36 24,18 116,18 132,36"
            fill={palette.stone}
            stroke="#0B0A0E"
            strokeWidth="2"
          />
          <rect
            x="12"
            y="30"
            width="116"
            height="8"
            fill={palette.stoneDark}
            stroke={activeIntensity ? palette.highlight : palette.glow}
            strokeWidth="1.5"
          />
          {/* Lintel Dentils (Pixel teeth detail) */}
          {[20, 32, 44, 56, 68, 80, 92, 104, 116].map((xDentil) => (
            <rect
              key={xDentil}
              x={xDentil}
              y="32"
              width="4"
              height="4"
              fill={activeIntensity ? palette.highlight : palette.stone}
            />
          ))}

          {/* UNIFIED GROUND THRESHOLD PLINTH (Always y=156..168 across all 3 doors!) */}
          <rect
            x="4"
            y="156"
            width="132"
            height="8"
            fill={palette.stone}
            stroke="#0B0A0E"
            strokeWidth="2"
          />
          <rect x="6" y="158" width="128" height="2" fill={palette.highlight} opacity="0.28" />
          <rect
            x="10"
            y="163"
            width="120"
            height="5"
            fill={palette.stoneDark}
            stroke="#0B0A0E"
            strokeWidth="1.5"
          />

          {/* Bespoke Dungeon Architectural Storytelling Relief & Crown */}
          {renderUniqueDungeonArchitecture()}
        </svg>

        {/* =====================================================================
            60 FPS AMBIENT BIOME PARTICLES RISING FROM THE THRESHOLD
            ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          <span
            className="animate-cripta-mote absolute left-[28%] bottom-5 w-1.5 h-1.5"
            style={{ backgroundColor: palette.glow, animationDelay: '0.15s' }}
          />
          <span
            className="animate-cripta-mote absolute left-[48%] bottom-9 w-1.5 h-1.5"
            style={{ backgroundColor: palette.highlight, animationDelay: '1.1s' }}
          />
          <span
            className="animate-cripta-mote absolute left-[68%] bottom-6 w-1.5 h-1.5"
            style={{ backgroundColor: palette.glow, animationDelay: '2.05s' }}
          />
          {activeIntensity && (
            <>
              <span
                className="animate-cripta-mote absolute left-[38%] bottom-12 w-2 h-2"
                style={{ backgroundColor: palette.highlight, animationDelay: '0.6s' }}
              />
              <span
                className="animate-cripta-mote absolute left-[60%] bottom-14 w-2 h-2"
                style={{ backgroundColor: palette.glow, animationDelay: '1.6s' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
