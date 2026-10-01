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
 * LA CRIPTA — 20 Canonical Monumental Dungeon Entrances
 *
 * Every single one of the 20 dungeons has its own unmistakable architectural
 * silhouette, frame structure, lintel/archway geometry, and bespoke inner door leaves:
 * 1. catacumbas_del_rey: Royal stone crypt gate, carved crown, funerary statues & skull reliefs
 * 2. jardin_podrido: Twisted root-consumed arch, shelf fungi, toxic flowers & drifting spores
 * 3. forja_infernal: Black riveted iron blast-gate, anvil crown, furnace vents & molten seams
 * 4. templo_sumergido: Eroded abyssal coral/barnacle stone arch, shells, trident & bubbles
 * 5. minas_abandonadas: Timber-beam mine tunnel, iron braces, hanging lantern, rails & crystal veins
 * 6. castillo_del_verdugo: Brutal gothic spiked iron gate, executioner axe crest, chains & crimson banners
 * 7. bosque_de_los_susurros: Ancient hollow tree-trunk doorway, antler-branch arch, bark eyes & charms
 * 8. alcantarillas_imperiales: Circular rusted sewer sluice-gate, pipes, valve wheel & toxic drip
 * 9. biblioteca_prohibida: Monumental grimoire archive portal, book-pillars, wax seals & floating pages
 * 10. torre_del_astrologo: Brass celestial astrolabe ring-portal, moon/sun dial & rotating stars
 * 11. la_colmena: Non-human hexagonal chitin/wax hive orifice, dripping honey, wings & larvae cells
 * 12. cripta_de_cristal: Asymmetric jagged prism crystal spire arch, refracted cyan/violet lock
 * 13. prision_maldita: Padlocked iron cell-bar portcullis, heavy chains & spectral hands behind bars
 * 14. santuario_de_sangre: Crimson ritual altar gate, overflowing blood chalices, channels & candles
 * 15. ciudad_sepultada: Half-buried sandstone civic pylon gate, broken columns, scarab crest & sand drifts
 * 16. palacio_de_los_espejos: Asymmetric silver mirror frame, fractured glass panes & out-of-sync reflection
 * 17. cavernas_heladas: Natural jagged glacial ice-cavern mouth, icicle fangs, frozen chains & frost vapor
 * 18. fortaleza_goblin: Ramshackle scrap-iron & timber gate, mismatched gears, ropes & painted skull
 * 19. cementerio_de_gigantes: Colossal ribcage & mammoth-tusk bone archway crowned by a giant cracked skull
 * 20. el_abismo: Fractured void-obsidian monolith portal, floating runic shards & eclipse eye
 *
 * All 20 doors share the exact same `viewBox="0 0 140 170"` and floor baseline `y = 156..168`.
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

  // Bespoke inner double-leaf doors matching each dungeon's physical material
  const renderBespokeDoorLeaves = (side: 'left' | 'right') => {
    const isLeft = side === 'left';

    switch (id) {
      case 'prision_maldita':
      case 'castillo_del_verdugo':
        // Vertical iron portcullis bars with spiked crossbars and padlocks/spectral hands
        return (
          <div className="relative w-full h-full bg-[#07050A] flex flex-col justify-between p-1 overflow-hidden">
            {/* Vertical Iron Bars */}
            <div className="absolute inset-0 flex justify-around px-1">
              {[0, 1, 2].map((barIdx) => (
                <div
                  key={barIdx}
                  className="w-1.5 h-full border-x border-black"
                  style={{
                    backgroundColor:
                      id === 'castillo_del_verdugo' ? '#3A2026' : '#2D3142',
                  }}
                />
              ))}
            </div>
            {/* Spectral Hands / Crimson Cloth behind bars */}
            {id === 'prision_maldita' ? (
              <div
                className="relative z-10 mt-10 mx-auto w-4 h-5 opacity-80"
                style={{
                  backgroundColor: activeIntensity ? palette.highlight : palette.glow,
                  clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
                }}
              />
            ) : (
              <div
                className="relative z-10 mt-6 mx-auto w-5 h-16 border border-black/80"
                style={{ backgroundColor: '#7A1C2E' }}
              />
            )}
            {/* Riveted Crossbars */}
            <div
              className="relative z-20 w-full h-3 border border-black flex items-center justify-around"
              style={{ backgroundColor: palette.stone }}
            >
              <span className="w-1 h-1 bg-[#FFD166]" />
              <span className="w-1 h-1 bg-[#FFD166]" />
            </div>
            <div
              className="relative z-20 w-full h-3 border border-black flex items-center justify-around"
              style={{ backgroundColor: palette.stone }}
            >
              <span className="w-1 h-1 bg-[#FFD166]" />
              <span className="w-1 h-1 bg-[#FFD166]" />
            </div>
          </div>
        );

      case 'la_colmena':
        // Organic hexagonal chitin & dripping golden honey membrane
        return (
          <div
            className="relative w-full h-full p-1.5 flex flex-col justify-between overflow-hidden"
            style={{
              backgroundColor: '#241508',
              backgroundImage: `radial-gradient(circle at ${
                isLeft ? '80%' : '20%'
              } 50%, ${palette.glow}44 0%, #170C04 90%)`,
            }}
          >
            <div
              className="w-full h-5 border border-black/80"
              style={{
                backgroundColor: '#D97706',
                clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
              }}
            />
            <div
              className="w-4/5 h-10 mx-auto border-2 flex items-center justify-center"
              style={{
                borderColor: '#F59E0B',
                backgroundColor: activeIntensity ? '#FBBF24' : '#78350F',
              }}
            >
              <div className="w-2.5 h-4 bg-[#170C04] rotate-12" />
            </div>
            <div
              className="w-4/5 h-8 mx-auto border"
              style={{
                borderColor: '#B45309',
                backgroundColor: '#451A03',
              }}
            />
            <div className="w-full h-2 bg-[#F59E0B]/70" />
          </div>
        );

      case 'palacio_de_los_espejos':
      case 'cripta_de_cristal':
        // Fractured reflective mirror / translucent crystal panes
        return (
          <div
            className="relative w-full h-full p-1 flex flex-col justify-between overflow-hidden"
            style={{
              backgroundColor: id === 'palacio_de_los_espejos' ? '#171C2B' : '#0E1B24',
              backgroundImage: `linear-gradient(135deg, ${palette.highlight}55 0%, ${palette.stoneDark} 48%, ${palette.glow}44 100%)`,
            }}
          >
            {/* Diagonal Mirror Reflection Slash */}
            <div
              className="pointer-events-none absolute -inset-2 rotate-12 opacity-45"
              style={{
                background: `linear-gradient(90deg, transparent 35%, #FFFFFF 50%, transparent 65%)`,
              }}
            />
            <div
              className="relative z-10 w-5/6 h-12 mx-auto mt-2 border-2 flex items-center justify-center"
              style={{
                borderColor: palette.highlight,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="w-3 h-5 rotate-45"
                style={{
                  backgroundColor: activeIntensity ? '#FFFFFF' : palette.highlight,
                }}
              />
            </div>
            <div
              className="relative z-10 w-5/6 h-12 mx-auto mb-2 border"
              style={{
                borderColor: palette.glow,
                backgroundColor: 'rgba(10,12,22,0.55)',
              }}
            />
          </div>
        );

      case 'bosque_de_los_susurros':
      case 'jardin_podrido':
        // Gnarled Vertical Bark Planks intertwined with glowing moss/spores
        return (
          <div
            className="relative w-full h-full p-1 flex flex-col justify-between"
            style={{
              backgroundColor: '#131D15',
              backgroundImage:
                'repeating-linear-gradient(90deg, #1A281D 0px, #1A281D 5px, #0D150F 5px, #0D150F 7px)',
            }}
          >
            <div
              className="w-full h-3 border border-black"
              style={{ backgroundColor: '#2D4231' }}
            />
            <div className="my-auto flex flex-col items-center gap-2">
              <div
                className="w-3 h-3 rounded-none border border-black"
                style={{
                  backgroundColor: activeIntensity ? palette.highlight : palette.glow,
                  boxShadow: `0 0 8px ${palette.glow}`,
                }}
              />
              <div className="w-4/5 h-1.5 bg-[#3B593F]" />
            </div>
            <div
              className="w-full h-3 border border-black"
              style={{ backgroundColor: '#2D4231' }}
            />
          </div>
        );

      case 'forja_infernal':
      case 'alcantarillas_imperiales':
      case 'fortaleza_goblin':
        // Heavy riveted boiler-plate / oxidized metal with furnace vents or valve wheel
        return (
          <div
            className="relative w-full h-full p-1.5 flex flex-col justify-between"
            style={{
              backgroundColor:
                id === 'forja_infernal'
                  ? '#1A1110'
                  : id === 'alcantarillas_imperiales'
                  ? '#16241F'
                  : '#261C14',
            }}
          >
            <div className="w-full h-2.5 bg-black/80 border border-white/15 flex items-center justify-around">
              <span className="w-1 h-1 bg-[#E7A54A]" />
              <span className="w-1 h-1 bg-[#E7A54A]" />
            </div>
            {/* Glowing Grate or Valve */}
            <div
              className="w-5/6 h-10 mx-auto border-2 border-black flex flex-col justify-around p-1"
              style={{ backgroundColor: '#09070C' }}
            >
              {[0, 1, 2].map((g) => (
                <div
                  key={g}
                  className="w-full h-1"
                  style={{
                    backgroundColor: activeIntensity ? palette.highlight : palette.glow,
                  }}
                />
              ))}
            </div>
            <div
              className={`w-4 h-4 border-2 ${
                isLeft ? 'self-end mr-0.5' : 'self-start ml-0.5'
              }`}
              style={{
                borderColor: palette.highlight,
                backgroundColor: '#0B0A0E',
              }}
            />
            <div className="w-full h-2.5 bg-black/80 border border-white/15 flex items-center justify-around">
              <span className="w-1 h-1 bg-[#E7A54A]" />
              <span className="w-1 h-1 bg-[#E7A54A]" />
            </div>
          </div>
        );

      default:
        // Carved Monumental Stone / Timber Relic Leaves with Biome Insignia
        return (
          <div
            className="relative w-full h-full p-1.5 flex flex-col justify-between"
            style={{
              backgroundColor: palette.stoneDark,
              backgroundImage: `linear-gradient(180deg, ${palette.stone}66 0%, ${palette.stoneDark} 60%, #07060B 100%)`,
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
              className={`${
                isLeft ? 'self-end mr-1' : 'self-start ml-1'
              } w-3.5 h-3.5 border-2`}
              style={{
                borderColor: activeIntensity ? palette.highlight : palette.glow,
                backgroundColor: '#0A080E',
              }}
            />
            <div
              className="w-5/6 h-10 mx-auto border border-black/85 flex items-center justify-center"
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
        );
    }
  };

  /**
   * Renders the complete outer architectural silhouette for each of the 20 dungeons.
   * Notice that we do NOT force generic rectangular stone pillars onto organic/bone/tree/hive/ice doors!
   */
  const renderUniqueDungeonArchitecture = () => {
    switch (id) {
      // =======================================================================
      // 1. CATACUMBAS DEL REY — Royal Stone Crypt Gate, Carved Crown & Statues
      // =======================================================================
      case 'catacumbas_del_rey':
        return (
          <g>
            {/* Stepped Gothic Royal Crypt Pillars */}
            <rect x="14" y="32" width="18" height="124" fill={palette.stone} stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="32" width="18" height="124" fill={palette.stone} stroke="#0B0A0E" strokeWidth="2" />
            {/* Funerary Hooded Knight Statues in Pillar Alcoves */}
            <rect x="17" y="54" width="12" height="36" fill="#0B0A0E" />
            <rect x="19" y="58" width="8" height="10" fill="#9E9689" />
            <rect x="18" y="69" width="10" height="19" fill="#787166" />
            <rect x="22" y="64" width="2" height="22" fill={palette.highlight} />

            <rect x="111" y="54" width="12" height="36" fill="#0B0A0E" />
            <rect x="113" y="58" width="8" height="10" fill="#9E9689" />
            <rect x="112" y="69" width="10" height="19" fill="#787166" />
            <rect x="116" y="64" width="2" height="22" fill={palette.highlight} />

            {/* Royal Pediment & Worn Gold Crown above Lintel */}
            <polygon points="10,34 26,16 114,16 130,34" fill={palette.stoneDark} stroke="#0B0A0E" strokeWidth="2" />
            <polygon
              points="46,24 50,6 60,16 70,2 80,16 90,6 94,24"
              fill="#D69E2E"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <rect x="67" y="11" width="6" height="7" fill="#C93B5B" />
            <rect x="53" y="14" width="4" height="5" fill={palette.highlight} />
            <rect x="83" y="14" width="4" height="5" fill={palette.highlight} />
            {/* Skull Reliefs & Lit Wax Candles on Lintel */}
            <rect x="30" y="22" width="10" height="10" fill="#D8C6A0" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="32" y="25" width="2" height="2" fill="#0B0A0E" />
            <rect x="36" y="25" width="2" height="2" fill="#0B0A0E" />
            <rect x="100" y="22" width="10" height="10" fill="#D8C6A0" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="102" y="25" width="2" height="2" fill="#0B0A0E" />
            <rect x="106" y="25" width="2" height="2" fill="#0B0A0E" />
            {/* Burning Funerary Candles */}
            {[18, 24, 114, 120].map((cx) => (
              <g key={cx}>
                <rect x={cx} y="20" width="3" height="10" fill="#F4EBD9" />
                <polygon points={`${cx + 1.5},13 ${cx - 1},20 ${cx + 4},20`} fill="#FFD166" />
              </g>
            ))}
          </g>
        );

      // =======================================================================
      // 2. JARDÍN PODRIDO — Consumed by Twisted Roots, Giant Fungi & Poison Flowers
      // =======================================================================
      case 'jardin_podrido':
        return (
          <g>
            {/* Organic Asymmetrical Root-Strangled Pillars (Curved outer silhouette) */}
            <path
              d="M8,156 C6,118 12,72 18,30 L34,34 C30,74 28,116 32,156 Z"
              fill="#233626"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <path
              d="M132,156 C134,118 128,72 122,30 L106,34 C110,74 112,116 108,156 Z"
              fill="#233626"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Massive Tangled Briar Canopy Arch */}
            <path
              d="M12,38 C22,6 52,4 70,8 C88,4 118,6 128,38 L112,42 C100,22 40,22 28,42 Z"
              fill="#1B2B1E"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Giant Bioluminescent Shelf Fungi */}
            <polygon points="2,84 26,76 28,90 6,92" fill="#68D391" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="6,102 28,96 28,106" fill="#38A169" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="138,72 112,66 112,80 134,82" fill="#68D391" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="134,112 110,106 112,118" fill="#9AE6B4" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Poisonous Corpse-Flower at Crown */}
            <polygon points="70,2 52,16 60,30 80,30 88,16" fill="#7656A8" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="64" y="12" width="12" height="10" fill={palette.highlight} />
            <rect x="68" y="15" width="4" height="4" fill="#FFD166" />
            {/* Hanging Spore Vines */}
            <rect x="38" y="34" width="3" height="26" fill="#48BB78" />
            <rect x="56" y="32" width="2" height="18" fill="#9AE6B4" />
            <rect x="86" y="34" width="3" height="22" fill="#48BB78" />
            <rect x="98" y="32" width="2" height="28" fill="#68D391" />
          </g>
        );

      // =======================================================================
      // 3. FORJA INFERNAL — Black Forged Metal, Massive Rivets, Furnace Vents & Chains
      // =======================================================================
      case 'forja_infernal':
        return (
          <g>
            {/* Heavy Trapezoidal Blast-Furnace Iron Bulkheads */}
            <polygon
              points="6,156 14,28 32,28 32,156"
              fill="#1E2029"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="134,156 126,28 108,28 108,156"
              fill="#1E2029"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Colossal Forged Anvil Header & Smokestack Vents */}
            <rect x="22" y="4" width="14" height="22" fill="#282A36" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="104" y="4" width="14" height="22" fill="#282A36" stroke="#0B0A0E" strokeWidth="2" />
            <polygon
              points="8,28 22,14 118,14 132,28 122,38 18,38"
              fill="#2B2D3C"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Glowing Molten Furnace Grates along Pillars */}
            {[48, 74, 100, 126].map((vy) => (
              <g key={vy}>
                <rect x="13" y={vy} width="14" height="12" fill="#0B0A0E" />
                <rect x="15" y={vy + 2} width="10" height="3" fill="#FF6B35" />
                <rect x="15" y={vy + 7} width="10" height="3" fill="#FFD166" />
                <rect x="113" y={vy} width="14" height="12" fill="#0B0A0E" />
                <rect x="115" y={vy + 2} width="10" height="3" fill="#FF6B35" />
                <rect x="115" y={vy + 7} width="10" height="3" fill="#FFD166" />
              </g>
            ))}
            {/* Central Molten Crucible Emblem */}
            <polygon points="52,10 88,10 80,26 60,26" fill="#14141B" stroke="#FF6B35" strokeWidth="2" />
            <rect x="62" y="14" width="16" height="8" fill="#FFD166" />
            {/* Hanging Forge Chains */}
            <rect x="35" y="38" width="4" height="28" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="101" y="38" width="4" height="28" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
            {/* Molten Slag Threshold */}
            <rect x="26" y="154" width="88" height="4" fill="#FF6B35" />
          </g>
        );

      // =======================================================================
      // 4. TEMPLO SUMERGIDO — Eroded Sea-Stone, Coral, Shells, Barnacles & Trident
      // =======================================================================
      case 'templo_sumergido':
        return (
          <g>
            {/* Eroded Abyssal Stone Columns with Coral Outgrowths */}
            <rect x="14" y="34" width="18" height="122" fill="#1B3B48" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="34" width="18" height="122" fill="#1B3B48" stroke="#0B0A0E" strokeWidth="2" />
            {/* Scalloped Giant Sea-Shell Pediment Arch */}
            <polygon
              points="12,36 28,14 52,6 70,2 88,6 112,14 128,36"
              fill="#234E5E"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Shell Fluting Ribs & Pearl Keystone */}
            <line x1="70" y1="34" x2="46" y2="10" stroke="#63B3ED" strokeWidth="2" />
            <line x1="70" y1="34" x2="70" y2="4" stroke="#63B3ED" strokeWidth="2.5" />
            <line x1="70" y1="34" x2="94" y2="10" stroke="#63B3ED" strokeWidth="2" />
            <circle cx="70" cy="22" r="7" fill="#E6FFFA" stroke="#0B0A0E" strokeWidth="2" />
            {/* Branching Pink/Cyan Reef Coral on Sides */}
            <polygon points="2,64 14,56 16,74 6,78" fill="#F687B3" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="4,48 14,44 14,56" fill="#4FD1C5" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="138,70 126,60 124,78 134,82" fill="#4FD1C5" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="136,52 126,46 126,58" fill="#F687B3" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Barnacle Clusters & Dripping Water */}
            <circle cx="20" cy="112" r="4" fill="#A0AEC0" stroke="#0B0A0E" strokeWidth="1.5" />
            <circle cx="25" cy="120" r="3" fill="#CBD5E0" stroke="#0B0A0E" strokeWidth="1.5" />
            <circle cx="118" cy="106" r="4" fill="#A0AEC0" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Rising Air Bubbles */}
            <circle cx="42" cy="46" r="2.5" fill="#BEE3F8" />
            <circle cx="96" cy="54" r="2" fill="#BEE3F8" />
          </g>
        );

      // =======================================================================
      // 5. MINAS ABANDONADAS — Timber Mine Shaft, Iron Braces, Lantern, Rails & Crystals
      // =======================================================================
      case 'minas_abandonadas':
        return (
          <g>
            {/* Craggy Excavated Rock Surround */}
            <polygon
              points="4,156 6,34 24,12 116,12 134,34 136,156 112,156 112,36 28,36 28,156"
              fill="#26211D"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Heavy Wooden Support Timber Posts & Cross-Beam */}
            <rect x="16" y="28" width="14" height="128" fill="#6E472B" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="19" y="30" width="4" height="124" fill="#8C5A36" />
            <rect x="110" y="28" width="14" height="128" fill="#6E472B" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="113" y="30" width="4" height="124" fill="#8C5A36" />
            {/* Angled Timber Knee-Braces */}
            <polygon points="30,54 48,36 36,36 30,42" fill="#593820" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="110,54 92,36 104,36 110,42" fill="#593820" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Top Horizontal Timber Lintel with Iron Straps */}
            <rect x="10" y="20" width="120" height="16" fill="#6E472B" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="26" y="18" width="8" height="20" fill="#4A5568" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="106" y="18" width="8" height="20" fill="#4A5568" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Hanging Miner's Lantern at Center of Beam */}
            <line x1="70" y1="36" x2="70" y2="44" stroke="#CBD5E0" strokeWidth="2" />
            <rect x="64" y="44" width="12" height="14" fill="#1A202C" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="66" y="46" width="8" height="9" fill="#FFD166" />
            {/* Glowing Raw Mineral Veins & Crystals in Rock */}
            <polygon points="6,84 16,76 14,92" fill={palette.highlight} stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="134,94 124,86 126,102" fill={palette.glow} stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Minecart Iron Rails on Threshold */}
            <rect x="44" y="154" width="6" height="12" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
            <rect x="90" y="154" width="6" height="12" fill="#718096" stroke="#0B0A0E" strokeWidth="1" />
          </g>
        );

      // =======================================================================
      // 6. CASTILLO DEL VERDUGO — Brutal Gothic Spiked Iron Gate, Executioner Blades
      // =======================================================================
      case 'castillo_del_verdugo':
        return (
          <g>
            {/* Tall Spiked Gothic Buttress Towers */}
            <polygon points="12,156 12,24 22,4 32,24 32,156" fill="#24171D" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="108,156 108,24 118,4 128,24 128,156" fill="#24171D" stroke="#0B0A0E" strokeWidth="2" />
            {/* Twin Executioner Crescent Axe Blades Forming the Arch Crest */}
            <path
              d="M36,28 C36,6 58,4 68,18 L54,32 Z"
              fill="#CBD5E0"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <path
              d="M104,28 C104,6 82,4 72,18 L86,32 Z"
              fill="#CBD5E0"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Crimson Blood Edge on Blades */}
            <rect x="66" y="6" width="8" height="28" fill="#9B1C31" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Downward Guillotine Teeth under Lintel */}
            {[36, 48, 60, 72, 84, 96].map((sx) => (
              <polygon
                key={sx}
                points={`${sx},34 ${sx + 4},46 ${sx + 8},34`}
                fill="#A0AEC0"
                stroke="#0B0A0E"
                strokeWidth="1"
              />
            ))}
            {/* Torn Dark-Red Executioner Banners on Pillars */}
            <polygon points="16,48 28,48 28,108 22,98 16,108" fill="#8A1C33" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="112,48 124,48 124,108 118,98 112,108" fill="#8A1C33" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      // =======================================================================
      // 7. BOSQUE DE LOS SUSURROS — Ancient Hollow Tree Trunk, Antler Branches & Eyes
      // =======================================================================
      case 'bosque_de_los_susurros':
        return (
          <g>
            {/* Gnarled Ancient Tree Trunk Roots & Bark Sides */}
            <polygon
              points="2,156 12,110 14,32 34,36 32,156"
              fill="#2A1E17"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="138,156 128,110 126,32 106,36 108,156"
              fill="#2A1E17"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Interlocking Antler-Branch Canopy Crown */}
            <path
              d="M10,36 Q38,2 70,12 Q102,2 130,36 L112,38 Q70,20 28,38 Z"
              fill="#3B2B22"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Reaching Upper Tree Branches */}
            <polygon points="24,18 10,2 18,2 32,16" fill="#3B2B22" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="116,18 130,2 122,2 108,16" fill="#3B2B22" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="56,12 48,2 54,2 62,12" fill="#4E392D" />
            <polygon points="84,12 92,2 86,2 78,12" fill="#4E392D" />
            {/* Glowing Hidden Eyes Peering from the Bark */}
            <rect x="19" y="64" width="6" height="3" fill={palette.highlight} />
            <rect x="21" y="96" width="5" height="3" fill={palette.glow} />
            <rect x="115" y="72" width="6" height="3" fill={palette.highlight} />
            <rect x="66" y="20" width="8" height="4" fill={palette.highlight} />
            {/* Hanging Bone Talismans / Whisper Charms */}
            <line x1="44" y1="34" x2="44" y2="48" stroke="#D8C6A0" strokeWidth="1.5" />
            <polygon points="44,48 40,56 48,56" fill="#E6FFFA" stroke="#0B0A0E" strokeWidth="1" />
            <line x1="96" y1="34" x2="96" y2="46" stroke="#D8C6A0" strokeWidth="1.5" />
            <polygon points="96,46 92,54 100,54" fill="#E6FFFA" stroke="#0B0A0E" strokeWidth="1" />
          </g>
        );

      // =======================================================================
      // 8. ALCANTARILLAS IMPERIALES — Circular Industrial Sewer Gate, Pipes & Valves
      // =======================================================================
      case 'alcantarillas_imperiales':
        return (
          <g>
            {/* Heavy Oxidized Copper/Iron Pipe Columns */}
            <rect x="8" y="28" width="10" height="128" fill="#5F3711" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="122" y="28" width="10" height="128" fill="#5F3711" stroke="#0B0A0E" strokeWidth="2" />
            {/* Circular Vaulted Sewer Tunnel Ring Frame */}
            <path
              d="M18,156 L18,62 A52,52 0 0,1 122,62 L122,156 L106,156 L106,64 A36,36 0 0,0 34,64 L34,156 Z"
              fill="#2C3E35"
              stroke="#0B0A0E"
              strokeWidth="2.5"
            />
            {/* Imperial Sewer Crest & Red/Brass Valve Wheels */}
            <circle cx="70" cy="18" r="11" fill="#1D2B24" stroke="#D69E2E" strokeWidth="2.5" />
            <line x1="70" y1="7" x2="70" y2="29" stroke="#D69E2E" strokeWidth="2" />
            <line x1="59" y1="18" x2="81" y2="18" stroke="#D69E2E" strokeWidth="2" />
            {/* Side Red Pressure Valve Wheels */}
            <circle cx="24" cy="92" r="7" fill="#9B2C2C" stroke="#0B0A0E" strokeWidth="2" />
            <circle cx="116" cy="92" r="7" fill="#9B2C2C" stroke="#0B0A0E" strokeWidth="2" />
            {/* Dripping Toxic Green Sludge */}
            <polygon points="52,32 49,46 55,46" fill="#68D391" />
            <polygon points="88,32 85,48 91,48" fill="#9AE6B4" />
            <rect x="28" y="154" width="84" height="5" fill="#48BB78" opacity="0.85" />
          </g>
        );

      // =======================================================================
      // 9. BIBLIOTECA PROHIBIDA — Monumental Archive Door, Books, Seals & Runes
      // =======================================================================
      case 'biblioteca_prohibida':
        return (
          <g>
            {/* Towering Carved Mahogany Bookcase-Pillars */}
            <rect x="12" y="26" width="20" height="130" fill="#2D1B2E" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="26" width="20" height="130" fill="#2D1B2E" stroke="#0B0A0E" strokeWidth="2" />
            {/* Stacked Colored Grimoire Spines Embedded in Pillars */}
            {[38, 56, 74, 92, 110, 128].map((by, idx) => (
              <g key={by}>
                <rect
                  x="15"
                  y={by}
                  width="14"
                  height="12"
                  fill={idx % 2 === 0 ? '#8F263D' : '#553C9A'}
                  stroke="#0B0A0E"
                  strokeWidth="1.5"
                />
                <rect x="17" y={by + 3} width="10" height="2" fill="#FFD166" />
                <rect
                  x="111"
                  y={by}
                  width="14"
                  height="12"
                  fill={idx % 2 === 0 ? '#2B6CB0' : '#975A16'}
                  stroke="#0B0A0E"
                  strokeWidth="1.5"
                />
                <rect x="113" y={by + 3} width="10" height="2" fill="#FFD166" />
              </g>
            ))}
            {/* Open Pediment Grimoire & Crimson Wax Seals */}
            <polygon points="8,28 24,10 116,10 132,28" fill="#3B2342" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="46" y="4" width="48" height="24" fill="#2A1836" stroke="#FFD166" strokeWidth="2" />
            <rect x="50" y="7" width="18" height="18" fill="#F7FAFC" />
            <rect x="72" y="7" width="18" height="18" fill="#EDF2F7" />
            <rect x="68" y="5" width="4" height="22" fill="#B794F4" />
            {/* Crimson Wax Seals with Parchment Ribbons */}
            <circle cx="38" cy="28" r="5" fill="#C53030" stroke="#0B0A0E" strokeWidth="1.5" />
            <circle cx="102" cy="28" r="5" fill="#C53030" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Floating Parchment Pages */}
            <polygon points="4,46 12,42 10,52 2,54" fill="#F7FAFC" stroke="#0B0A0E" strokeWidth="1" />
            <polygon points="136,52 128,48 130,58 138,60" fill="#F7FAFC" stroke="#0B0A0E" strokeWidth="1" />
          </g>
        );

      // =======================================================================
      // 10. TORRE DEL ASTRÓLOGO — Brass Celestial Rings, Sun/Moon Dial & Stars
      // =======================================================================
      case 'torre_del_astrologo':
        return (
          <g>
            {/* Slender Lapis-Lazuli & Brass Observatory Columns */}
            <rect x="16" y="34" width="14" height="122" fill="#1A2642" stroke="#D69E2E" strokeWidth="2" />
            <rect x="110" y="34" width="14" height="122" fill="#1A2642" stroke="#D69E2E" strokeWidth="2" />
            {/* Giant Interlocking Brass Astrolabe Rings at Top */}
            <circle cx="70" cy="24" r="21" fill="#0F172A" stroke="#ECC94B" strokeWidth="3" />
            <circle
              cx="70"
              cy="24"
              r="15"
              fill="none"
              stroke="#63B3ED"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Sun & Crescent Moon Celestial Mechanism */}
            <circle cx="65" cy="22" r="6" fill="#F6E05E" />
            <circle cx="75" cy="20" r="5" fill="#63B3ED" />
            {/* Orbiting Star Nodes along the Arch */}
            {[28, 44, 96, 112].map((sx, idx) => (
              <polygon
                key={sx}
                points={`${sx},${idx % 2 === 0 ? 18 : 10} ${sx + 3},${
                  idx % 2 === 0 ? 24 : 16
                } ${sx},${idx % 2 === 0 ? 30 : 22} ${sx - 3},${idx % 2 === 0 ? 24 : 16}`}
                fill="#F6E05E"
                stroke="#0B0A0E"
                strokeWidth="1"
              />
            ))}
          </g>
        );

      // =======================================================================
      // 11. LA COLMENA — Non-Human Hexagonal Wax/Chitin Structure & Dripping Honey
      // =======================================================================
      case 'la_colmena':
        return (
          <g>
            {/* Completely Non-Human Hexagonal Chitin & Wax Outer Carapace */}
            <polygon
              points="18,156 4,94 18,28 48,6 92,6 122,28 136,94 122,156 104,156 114,94 102,38 38,38 26,94 36,156"
              fill="#78350F"
              stroke="#0B0A0E"
              strokeWidth="2.5"
            />
            {/* Honeycomb Hexagonal Cells Embedded in Frame */}
            {[
              [14, 62],
              [18, 78],
              [14, 94],
              [116, 62],
              [112, 78],
              [116, 94],
              [54, 14],
              [70, 12],
              [86, 14],
            ].map(([hx, hy], idx) => (
              <polygon
                key={idx}
                points={`${hx},${hy} ${hx + 6},${hy - 4} ${hx + 12},${hy} ${hx + 12},${
                  hy + 7
                } ${hx + 6},${hy + 11} ${hx},${hy + 7}`}
                fill={idx % 2 === 0 ? '#F59E0B' : '#B45309'}
                stroke="#1C0F05"
                strokeWidth="1.5"
              />
            ))}
            {/* Translucent Insect Wings Flanking Crown */}
            <polygon
              points="46,10 14,2 26,24"
              fill="#FDE68A"
              opacity="0.65"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="94,10 126,2 114,24"
              fill="#FDE68A"
              opacity="0.65"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Thick Golden Honey Drips */}
            <polygon points="46,38 43,54 49,54" fill="#FBBF24" />
            <polygon points="70,38 66,58 74,58" fill="#F59E0B" />
            <polygon points="94,38 91,50 97,50" fill="#FBBF24" />
          </g>
        );

      // =======================================================================
      // 12. CRIPTA DE CRISTAL — Asymmetric Crystalline Arch & Refracted Shards
      // =======================================================================
      case 'cripta_de_cristal':
        return (
          <g>
            {/* Asymmetric Jagged Crystal Pillars (No flat rectangular columns!) */}
            <polygon
              points="8,156 4,102 16,64 8,28 32,36 30,156"
              fill="#234E52"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="132,156 138,88 122,52 134,18 106,36 110,156"
              fill="#44337A"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Towering Asymmetric Crystal Spires at Crown */}
            <polygon
              points="64,2 46,34 78,34"
              fill="#81E6D9"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="88,6 70,34 106,34"
              fill="#B794F4"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="36,10 24,36 52,34"
              fill="#4FD1C5"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            {/* Refracted Internal Facet Highlights */}
            <polygon points="64,5 54,32 66,32" fill="#E6FFFA" opacity="0.75" />
            <polygon points="88,9 78,32 90,32" fill="#FAF5FF" opacity="0.65" />
            {/* Crystalline Stalagmites at Base */}
            <polygon points="6,156 16,122 26,156" fill="#4FD1C5" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="112,156 124,118 134,156" fill="#9F7AEA" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      // =======================================================================
      // 13. PRISIÓN MALDITA — Iron Barred Gate, Padlocks, Chains & Cold Violet Glow
      // =======================================================================
      case 'prision_maldita':
        return (
          <g>
            {/* Dark Iron-Clad Dungeon Cell Blocks */}
            <rect x="12" y="30" width="20" height="126" fill="#1E202B" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="30" width="20" height="126" fill="#1E202B" stroke="#0B0A0E" strokeWidth="2" />
            {/* Prisoner Tally Scratch Marks on Stone */}
            <line x1="16" y1="62" x2="16" y2="70" stroke="#CBD5E0" strokeWidth="1.5" />
            <line x1="20" y1="62" x2="20" y2="70" stroke="#CBD5E0" strokeWidth="1.5" />
            <line x1="24" y1="62" x2="24" y2="70" stroke="#CBD5E0" strokeWidth="1.5" />
            <line x1="14" y1="68" x2="26" y2="64" stroke="#CBD5E0" strokeWidth="1.5" />
            {/* Hanging Iron Gibbet Cage & Giant Padlock at Crown */}
            <polygon points="10,32 28,14 112,14 130,32" fill="#171923" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="58" y="6" width="24" height="26" fill="#2D3748" stroke="#0B0A0E" strokeWidth="2" />
            <circle cx="70" cy="17" r="4" fill={palette.highlight} />
            <rect x="68" y="19" width="4" height="8" fill="#0B0A0E" />
            {/* Crossed Heavy Shackles & Chains Across Arch */}
            <line x1="14" y1="20" x2="58" y2="38" stroke="#A0AEC0" strokeWidth="3.5" strokeDasharray="5 2" />
            <line x1="126" y1="20" x2="82" y2="38" stroke="#A0AEC0" strokeWidth="3.5" strokeDasharray="5 2" />
          </g>
        );

      // =======================================================================
      // 14. SANTUARIO DE SANGRE — Ritual Stone Gate, Chalices, Blood Channels & Candles
      // =======================================================================
      case 'santuario_de_sangre':
        return (
          <g>
            {/* Fluted Crimson-Vein Ritual Pillars */}
            <rect x="14" y="32" width="18" height="124" fill="#2B1218" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="108" y="32" width="18" height="124" fill="#2B1218" stroke="#0B0A0E" strokeWidth="2" />
            {/* Glowing Blood Channels Carved Vertically Down Pillars */}
            <rect x="21" y="36" width="4" height="120" fill="#E53E3E" />
            <rect x="115" y="36" width="4" height="120" fill="#E53E3E" />
            {/* Twin Overflowing Golden Blood Chalices on Pillar Tops */}
            <polygon points="14,22 32,22 27,32 19,32" fill="#D69E2E" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="16" y="19" width="14" height="4" fill="#E53E3E" />
            <polygon points="108,22 126,22 121,32 113,32" fill="#D69E2E" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="110" y="19" width="14" height="4" fill="#E53E3E" />
            {/* Central Crimson Sun Altar Crown & Draped Cloth */}
            <polygon points="36,32 52,8 88,8 104,32" fill="#3D101A" stroke="#0B0A0E" strokeWidth="2" />
            <circle cx="70" cy="20" r="9" fill="#9B1C31" stroke="#F6E05E" strokeWidth="2" />
            <polygon points="32,34 70,48 108,34" fill="#741323" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      // =======================================================================
      // 15. CIUDAD SEPULTADA — Buried Sandstone Pylon Gate, Broken Columns & Sand
      // =======================================================================
      case 'ciudad_sepultada':
        return (
          <g>
            {/* Slanted Monumental Egyptian/Desert Sandstone Pylons (Partially broken right column) */}
            <polygon points="8,156 16,22 34,22 32,156" fill="#976A3E" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="108,156 106,38 120,44 126,34 132,156" fill="#825932" stroke="#0B0A0E" strokeWidth="2" />
            {/* Winged Solar Scarab Cornice */}
            <polygon points="10,24 22,10 118,10 130,24" fill="#B7834D" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="34,18 62,13 62,22" fill="#319795" stroke="#0B0A0E" strokeWidth="1" />
            <polygon points="106,18 78,13 78,22" fill="#319795" stroke="#0B0A0E" strokeWidth="1" />
            <circle cx="70" cy="17" r="6" fill="#ECC94B" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Deep Sand Dunes Partially Burying the Base */}
            <polygon
              points="2,158 18,132 46,150 62,158"
              fill="#D69E2E"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
            <polygon
              points="82,158 106,136 138,158"
              fill="#B7791F"
              stroke="#0B0A0E"
              strokeWidth="1.5"
            />
          </g>
        );

      // =======================================================================
      // 16. PALACIO DE LOS ESPEJOS — Asymmetric Silver Mirror Frame & Diamond Glass
      // =======================================================================
      case 'palacio_de_los_espejos':
        return (
          <g>
            {/* Asymmetric Ornate Silver Filigree Frame */}
            <polygon
              points="14,156 10,42 26,16 34,34 32,156"
              fill="#A0AEC0"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="126,156 132,28 112,8 106,34 108,156"
              fill="#CBD5E0"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Diamond-Shaped Mirror Crown & Fractured Reflective Shards */}
            <polygon
              points="70,2 88,18 70,34 52,18"
              fill="#E2E8F0"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon points="70,6 82,18 70,30 58,18" fill="#63B3ED" />
            <polygon points="70,6 76,18 70,30" fill="#FFFFFF" opacity="0.8" />
            {/* Floating Fractured Mirror Diamonds along Sides */}
            <polygon points="6,74 14,64 22,74 14,84" fill="#E2E8F0" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="118,58 126,48 134,58 126,68" fill="#E2E8F0" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      // =======================================================================
      // 17. CAVERNAS HELADAS — Natural Jagged Glacial Ice Arch, Icicles & Snow
      // =======================================================================
      case 'cavernas_heladas':
        return (
          <g>
            {/* Jagged Glacial Ice Wall Mouth */}
            <polygon
              points="4,156 8,78 16,24 44,6 70,2 96,6 124,24 132,78 136,156 108,156 108,38 32,38 32,156"
              fill="#2C5282"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <polygon
              points="10,148 14,80 22,28 48,12 92,12 118,28 126,80 130,148 112,148 110,36 30,36 28,148"
              fill="#63B3ED"
              opacity="0.65"
            />
            {/* Sharp Hanging Icicle Fangs */}
            {[34, 46, 58, 70, 82, 94, 102].map((ix, idx) => (
              <polygon
                key={ix}
                points={`${ix},34 ${ix + 4},${idx % 2 === 0 ? 54 : 46} ${ix + 8},34`}
                fill="#EBF8FF"
                stroke="#0B0A0E"
                strokeWidth="1"
              />
            ))}
            {/* Snow Drift Accumulation at Base */}
            <polygon points="4,156 22,142 38,156" fill="#FFFFFF" stroke="#0B0A0E" strokeWidth="1.5" />
            <polygon points="102,156 118,142 136,156" fill="#FFFFFF" stroke="#0B0A0E" strokeWidth="1.5" />
          </g>
        );

      // =======================================================================
      // 18. FORTALEZA GOBLIN — Mismatched Scrap Plates, Gears, Ropes & Painted Skull
      // =======================================================================
      case 'fortaleza_goblin':
        return (
          <g>
            {/* Crooked Mismatched Scrap-Metal & Timber Palisade Pillars */}
            <polygon points="10,156 16,26 34,30 30,156" fill="#593E25" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="130,156 124,24 106,30 110,156" fill="#593E25" stroke="#0B0A0E" strokeWidth="2" />
            {/* Patched Rust-Iron Plates Nailed Crookedly */}
            <rect x="12" y="58" width="20" height="24" fill="#718096" stroke="#0B0A0E" strokeWidth="1.5" />
            <rect x="108" y="82" width="20" height="26" fill="#744210" stroke="#0B0A0E" strokeWidth="1.5" />
            {/* Oversized Jury-Rigged Iron Gears & Pulley Ropes */}
            <circle cx="24" cy="24" r="12" fill="#4A5568" stroke="#0B0A0E" strokeWidth="2" />
            <circle cx="24" cy="24" r="5" fill="#D69E2E" />
            <circle cx="116" cy="26" r="10" fill="#744210" stroke="#0B0A0E" strokeWidth="2" />
            {/* Crude Goblin Painted Jaw-Skull Sign on Lintel */}
            <polygon points="38,34 44,8 96,10 102,34" fill="#2D3748" stroke="#0B0A0E" strokeWidth="2" />
            <polygon points="56,14 84,14 80,28 60,28" fill="#ECC94B" />
            <rect x="62" y="17" width="4" height="4" fill="#C53030" />
            <rect x="74" y="17" width="4" height="4" fill="#C53030" />
          </g>
        );

      // =======================================================================
      // 19. CEMENTERIO DE GIGANTES — Enormous Ribcage Arch, Giant Skull & Tusks
      // =======================================================================
      case 'cementerio_de_gigantes':
        return (
          <g>
            {/* Colossal Stacked Femur & Mammoth-Tusk Bone Pillars */}
            <path
              d="M8,156 C10,104 14,56 26,18 L36,24 C28,62 28,108 32,156 Z"
              fill="#D5CEBC"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            <path
              d="M132,156 C130,104 126,56 114,18 L104,24 C112,62 112,108 108,156 Z"
              fill="#D5CEBC"
              stroke="#0B0A0E"
              strokeWidth="2"
            />
            {/* Enormous Curved Rib Bones Forming the Arch */}
            {[42, 68, 94].map((ry) => (
              <g key={ry}>
                <polygon points={`6,${ry} 32,${ry - 8} 32,${ry} 10,${ry + 6}`} fill="#E8E2D2" stroke="#0B0A0E" strokeWidth="1.5" />
                <polygon points={`134,${ry} 108,${ry - 8} 108,${ry} 130,${ry + 6}`} fill="#E8E2D2" stroke="#0B0A0E" strokeWidth="1.5" />
              </g>
            ))}
            {/* Giant Titan Skull Dominating the Crown */}
            <rect x="46" y="2" width="48" height="28" fill="#E8E2D2" stroke="#0B0A0E" strokeWidth="2" />
            <rect x="53" y="12" width="11" height="9" fill="#0B0A0E" />
            <rect x="76" y="12" width="11" height="9" fill="#0B0A0E" />
            <rect x="56" y="14" width="5" height="5" fill={palette.highlight} />
            <rect x="79" y="14" width="5" height="5" fill={palette.highlight} />
            <polygon points="70,18 66,26 74,26" fill="#0B0A0E" />
            {/* Giant Skull Teeth Overhanging the Doorway */}
            {[54, 62, 70, 78, 84].map((tx) => (
              <rect key={tx} x={tx} y="30" width="5" height="8" fill="#D5CEBC" stroke="#0B0A0E" strokeWidth="1" />
            ))}
          </g>
        );

      // =======================================================================
      // 20. EL ABISMO — Void-Fractured Obsidian Monoliths & Eclipse Eye
      // =======================================================================
      case 'el_abismo':
      default:
        return (
          <g>
            {/* Floating Fractured Obsidian Void Monoliths */}
            <polygon points="10,156 6,36 26,12 32,36 30,156" fill="#140D21" stroke={palette.glow} strokeWidth="2" />
            <polygon points="130,156 134,36 114,12 108,36 110,156" fill="#140D21" stroke={palette.glow} strokeWidth="2" />
            {/* Abyssal Eclipse Crown */}
            <polygon points="70,2 44,22 70,36 96,22" fill="#090512" stroke={palette.highlight} strokeWidth="2" />
            <circle cx="70" cy="19" r="8" fill="#05020A" stroke="#FF4D6D" strokeWidth="2" />
            <circle cx="70" cy="19" r="3" fill="#FFD166" />
          </g>
        );
    }
  };

  return (
    <div className="dungeon-door-stage relative w-[185px] sm:w-[220px] lg:w-[248px] h-[225px] sm:h-[268px] lg:h-[302px] mx-auto select-none overflow-visible">
      <div className="dungeon-door-anchor absolute inset-x-0 bottom-0 h-full flex items-end justify-center">
        {/* =====================================================================
            AMBIENT BIOME HALO BEHIND THE MONUMENTAL ARCHWAY (Intensifies on Hover!)
            ===================================================================== */}
        <div
          className="pointer-events-none absolute inset-x-2 top-1 bottom-2 transition-all duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 54%, ${palette.highlight}${
              isOpening ? '99' : isHovered ? '66' : activeIntensity ? '44' : '1E'
            } 0%, ${palette.glow}${
              isOpening ? '66' : isHovered ? '40' : '14'
            } 45%, transparent 74%)`,
            transform: isOpening
              ? 'scale(1.15)'
              : isHovered
              ? 'scale(1.08)'
              : activeIntensity
              ? 'scale(1.04)'
              : 'scale(1)',
          }}
        />

        {/* =====================================================================
            INNER DUNGEON PORTAL DEPTH & BESPOKE BIOME DOUBLE-LEAF DOORS
            Anchored strictly to the same floor baseline (% coordinates match SVG)
            ===================================================================== */}
        <div
          className="absolute left-[21.5%] right-[21.5%] top-[21.2%] bottom-[8.2%] overflow-hidden bg-[#06050A]"
          style={{
            perspective: '700px',
            boxShadow: isOpening
              ? `inset 0 0 42px ${palette.highlight}, 0 0 28px ${palette.glow}`
              : isHovered
              ? `inset 0 0 28px ${palette.glow}88`
              : `inset 0 0 20px rgba(0,0,0,0.95)`,
          }}
        >
          {/* Deep Corridor Interior revealed when the door swings open or cracks on hover */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              opacity: isOpening ? 1 : isHovered ? 0.85 : activeIntensity ? 0.65 : 0.3,
              background: `radial-gradient(circle at 50% 52%, ${palette.highlight}88 0%, ${palette.glow}55 38%, #07050A 82%)`,
            }}
          >
            <div
              className="absolute inset-[14%] border-2 opacity-60"
              style={{ borderColor: palette.glow }}
            />
            <div
              className="absolute inset-[28%] border opacity-80"
              style={{ borderColor: palette.highlight }}
            />
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
                opacity: isOpening ? 1 : isHovered ? 0.9 : activeIntensity ? 0.75 : 0.3,
                width: isOpening ? '42%' : isHovered ? '10px' : activeIntensity ? '6px' : '2px',
              }}
            />
          </div>

          {/* Left & Right Bespoke Dungeon Door Leaves */}
          <div className="relative z-10 w-full h-full flex">
            {/* LEFT LEAF */}
            <div
              className="w-1/2 h-full border-r border-black/90 transition-transform duration-700 ease-out"
              style={{
                transformOrigin: 'left center',
                transform: isOpening
                  ? 'rotateY(-76deg)'
                  : isHovered || isVotedByMe
                  ? 'rotateY(-18deg)'
                  : 'rotateY(0deg)',
                boxShadow: 'inset -4px 0 10px rgba(0,0,0,0.85)',
              }}
            >
              {renderBespokeDoorLeaves('left')}
            </div>

            {/* RIGHT LEAF */}
            <div
              className="w-1/2 h-full border-l border-black/90 transition-transform duration-700 ease-out"
              style={{
                transformOrigin: 'right center',
                transform: isOpening
                  ? 'rotateY(76deg)'
                  : isHovered || isVotedByMe
                  ? 'rotateY(18deg)'
                  : 'rotateY(0deg)',
                boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.85)',
              }}
            >
              {renderBespokeDoorLeaves('right')}
            </div>
          </div>
        </div>

        {/* =====================================================================
            HIGH-DETAIL PIXEL-ART SVG BESPOKE BIOME SILHOUETTE & THRESHOLD
            Unified viewBox="0 0 140 170" with identical floor baseline y=156..168
            ===================================================================== */}
        <svg
          viewBox="0 0 140 170"
          className="relative z-20 w-full h-full pointer-events-none pixelated-art block"
          shapeRendering="crispEdges"
        >
          {/* Inner Doorway Frame Backing */}
          <rect x="29" y="34" width="82" height="122" fill="none" stroke="#0B0A0E" strokeWidth="3" />

          {/* Bespoke Dungeon Architectural Silhouette & Relief */}
          {renderUniqueDungeonArchitecture()}

          {/* UNIFIED GROUND THRESHOLD PLINTH (Always y=156..168 across all 20 doors!) */}
          <rect
            x="4"
            y="156"
            width="132"
            height="8"
            fill={palette.stone}
            stroke="#0B0A0E"
            strokeWidth="2"
          />
          <rect x="6" y="158" width="128" height="2" fill={palette.highlight} opacity="0.35" />
          <rect
            x="10"
            y="163"
            width="120"
            height="5"
            fill={palette.stoneDark}
            stroke="#0B0A0E"
            strokeWidth="1.5"
          />
        </svg>

        {/* =====================================================================
            60 FPS AMBIENT BIOME PARTICLES RISING FROM THE THRESHOLD
            ===================================================================== */}
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
          <span
            className="animate-cripta-mote absolute left-[26%] bottom-5 w-1.5 h-1.5"
            style={{ backgroundColor: palette.glow, animationDelay: '0.15s' }}
          />
          <span
            className="animate-cripta-mote absolute left-[48%] bottom-9 w-1.5 h-1.5"
            style={{ backgroundColor: palette.highlight, animationDelay: '1.1s' }}
          />
          <span
            className="animate-cripta-mote absolute left-[70%] bottom-6 w-1.5 h-1.5"
            style={{ backgroundColor: palette.glow, animationDelay: '2.05s' }}
          />
          {activeIntensity && (
            <>
              <span
                className="animate-cripta-mote absolute left-[34%] bottom-12 w-2 h-2"
                style={{ backgroundColor: palette.highlight, animationDelay: '0.4s' }}
              />
              <span
                className="animate-cripta-mote absolute left-[52%] bottom-16 w-2 h-2"
                style={{ backgroundColor: '#FFFFFF', animationDelay: '0.9s' }}
              />
              <span
                className="animate-cripta-mote absolute left-[64%] bottom-14 w-2 h-2"
                style={{ backgroundColor: palette.glow, animationDelay: '1.4s' }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
