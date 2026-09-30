import React from 'react';
import { CriptaDungeonDefinition } from '../../types/laCripta';

interface LaCriptaDoorArtworkProps {
  dungeon: CriptaDungeonDefinition;
  isHovered?: boolean;
  isVotedByMe?: boolean;
  isOpening?: boolean;
  voteCount?: number;
}

/**
 * Pure pixel-art architectural doorway for each of the 20 La Cripta dungeons.
 * No card headers, no "UMBRAL #XX" badges, no text clutter — just the physical
 * subterranean doorway, bespoke architectural silhouette, and animated double doors.
 */
export const LaCriptaDoorArtwork: React.FC<LaCriptaDoorArtworkProps> = ({
  dungeon,
  isHovered = false,
  isVotedByMe = false,
  isOpening = false,
  voteCount = 0,
}) => {
  const { palette, artTheme } = dungeon;
  const activeIntensity = isOpening || isHovered || isVotedByMe || voteCount > 0;

  const renderArchMotif = () => {
    switch (artTheme.archStyle) {
      case 'gothic_crypt':
        return (
          <g>
            {/* Pointed gothic crown pediment & royal skull reliquary */}
            <polygon points="60,4 78,22 42,22" fill={palette.stoneDark} stroke={palette.highlight} strokeWidth="2" />
            <rect x="46" y="16" width="28" height="14" fill={palette.stoneDark} stroke={palette.highlight} strokeWidth="2" />
            <path d="M50 22 L54 15 L60 20 L66 15 L70 22 Z" fill={palette.glow} />
            <rect x="55" y="22" width="10" height="6" fill="#D9D0BC" />
            <rect x="57" y="24" width="2" height="2" fill="#0B0A0E" />
            <rect x="61" y="24" width="2" height="2" fill="#0B0A0E" />
            {/* Side liturgical candles on sconces */}
            <rect x="15" y="58" width="6" height="3" fill={palette.highlight} />
            <rect x="16" y="48" width="4" height="10" fill="#D9D0BC" />
            <rect x="99" y="58" width="6" height="3" fill={palette.highlight} />
            <rect x="100" y="48" width="4" height="10" fill="#D9D0BC" />
            <rect x="17" y="43" width="2" height="5" fill="#E7A54A" className="animate-cripta-torch" />
            <rect x="101" y="43" width="2" height="5" fill="#E7A54A" className="animate-cripta-torch" />
          </g>
        );

      case 'overgrown_roots':
        return (
          <g>
            {/* Gnarled strangler roots & bioluminescent fungal caps */}
            <path
              d="M12 28 Q38 38 60 16 Q82 38 108 26"
              fill="none"
              stroke="#4A3222"
              strokeWidth="6"
              strokeLinecap="square"
            />
            <path
              d="M18 34 Q30 70 20 124 M102 34 Q90 70 100 124"
              fill="none"
              stroke="#2E4528"
              strokeWidth="4"
            />
            {/* Glowing mushroom clusters */}
            <polygon points="24,52 34,52 31,46 27,46" fill={palette.glow} />
            <rect x="28" y="52" width="2" height="5" fill="#D8C6A0" />
            <polygon points="88,60 98,60 95,54 91,54" fill={palette.highlight} />
            <rect x="92" y="60" width="2" height="5" fill="#D8C6A0" />
            <circle cx="60" cy="21" r="5" fill={palette.glow} />
          </g>
        );

      case 'iron_furnace':
        return (
          <g>
            {/* Heavy industrial iron furnace crown & molten vents */}
            <rect x="38" y="10" width="44" height="20" fill="#1A0F10" stroke={palette.glow} strokeWidth="2" />
            <rect x="44" y="14" width="4" height="12" fill={palette.glow} />
            <rect x="54" y="14" width="4" height="12" fill={palette.glow} />
            <rect x="62" y="14" width="4" height="12" fill={palette.glow} />
            <rect x="72" y="14" width="4" height="12" fill={palette.glow} />
            {/* Iron rivets on pillars */}
            <rect x="18" y="42" width="4" height="4" fill={palette.highlight} />
            <rect x="18" y="76" width="4" height="4" fill={palette.highlight} />
            <rect x="18" y="110" width="4" height="4" fill={palette.highlight} />
            <rect x="98" y="42" width="4" height="4" fill={palette.highlight} />
            <rect x="98" y="76" width="4" height="4" fill={palette.highlight} />
            <rect x="98" y="110" width="4" height="4" fill={palette.highlight} />
          </g>
        );

      case 'sunken_temple':
        return (
          <g>
            {/* Stepped abyssal temple crest & glowing tide eye */}
            <polygon points="60,8 78,24 60,34 42,24" fill={palette.stoneDark} stroke={palette.highlight} strokeWidth="2" />
            <circle cx="60" cy="22" r="5" fill={palette.glow} />
            <rect x="59" y="19" width="2" height="6" fill="#0B0A0E" />
            <path d="M14 134 Q38 128 60 134 T106 134" fill="none" stroke={palette.glow} strokeWidth="3" />
          </g>
        );

      case 'timber_mine':
        return (
          <g>
            {/* Rough-hewn mine crossbeams, iron brackets & hanging lantern */}
            <rect x="10" y="16" width="100" height="14" fill="#47301E" stroke="#1E130B" strokeWidth="2" />
            <rect x="14" y="30" width="14" height="106" fill="#382516" stroke="#1E130B" strokeWidth="2" />
            <rect x="92" y="30" width="14" height="106" fill="#382516" stroke="#1E130B" strokeWidth="2" />
            <line x1="60" y1="30" x2="60" y2="42" stroke="#D8C6A0" strokeWidth="2" />
            <rect x="54" y="42" width="12" height="14" fill="#1E130B" stroke={palette.glow} strokeWidth="1.5" />
            <rect x="57" y="45" width="6" height="8" fill={palette.glow} className="animate-cripta-torch" />
          </g>
        );

      case 'executioner_gate':
        return (
          <g>
            {/* Iron portcullis fangs & hanging dungeon chains */}
            <polygon points="34,32 38,48 42,32" fill="#9FA6B2" />
            <polygon points="48,32 52,50 56,32" fill="#9FA6B2" />
            <polygon points="64,32 68,50 72,32" fill="#9FA6B2" />
            <polygon points="78,32 82,48 86,32" fill="#9FA6B2" />
            <line x1="21" y1="18" x2="21" y2="86" stroke="#8C857B" strokeWidth="3" strokeDasharray="4 2" />
            <line x1="99" y1="18" x2="99" y2="86" stroke="#8C857B" strokeWidth="3" strokeDasharray="4 2" />
            <circle cx="60" cy="21" r="5.5" fill={palette.glow} />
          </g>
        );

      case 'whispering_wood':
        return (
          <g>
            {/* Pale petrified tree trunks curving overhead & spectral wisps */}
            <path d="M18 126 L24 34 L56 14 M102 126 L96 34 L64 14" fill="none" stroke="#C7C2B8" strokeWidth="5" />
            <rect x="38" y="38" width="5" height="5" fill={palette.glow} className="animate-cripta-torch" />
            <rect x="77" y="36" width="5" height="5" fill={palette.glow} className="animate-cripta-torch" />
            <rect x="57" y="18" width="6" height="6" fill="#69A8A5" />
          </g>
        );

      case 'imperial_grate':
        return (
          <g>
            {/* Imperial bronze sluice wheel keystone & sewer canal trough */}
            <circle cx="60" cy="22" r="10" fill={palette.stoneDark} stroke={palette.secondary} strokeWidth="2.5" />
            <line x1="50" y1="22" x2="70" y2="22" stroke={palette.secondary} strokeWidth="2" />
            <line x1="60" y1="12" x2="60" y2="32" stroke={palette.secondary} strokeWidth="2" />
            <rect x="28" y="132" width="64" height="6" fill={palette.glow} opacity="0.75" />
          </g>
        );

      case 'forbidden_tome':
        return (
          <g>
            {/* Sealed obsidian grimoire & glowing arcane glyphs */}
            <rect x="46" y="10" width="28" height="20" fill="#2A183B" stroke={palette.highlight} strokeWidth="2" />
            <circle cx="60" cy="20" r="5" fill={palette.glow} />
            <rect x="18" y="48" width="4" height="4" fill={palette.glow} />
            <rect x="18" y="70" width="4" height="4" fill={palette.glow} />
            <rect x="18" y="92" width="4" height="4" fill={palette.glow} />
            <rect x="98" y="48" width="4" height="4" fill={palette.glow} />
            <rect x="98" y="70" width="4" height="4" fill={palette.glow} />
            <rect x="98" y="92" width="4" height="4" fill={palette.glow} />
          </g>
        );

      case 'astral_observatory':
        return (
          <g>
            {/* Celestial brass astrolabe rings & starlight beacon */}
            <circle cx="60" cy="22" r="12" fill="#0E1324" stroke={palette.highlight} strokeWidth="2" />
            <circle cx="60" cy="22" r="7" fill="none" stroke={palette.glow} strokeWidth="1.5" />
            <rect x="58" y="20" width="4" height="4" fill={palette.highlight} />
            <rect x="18" y="52" width="3" height="3" fill={palette.highlight} />
            <rect x="99" y="52" width="3" height="3" fill={palette.highlight} />
          </g>
        );

      case 'chitin_hive':
        return (
          <g>
            {/* Organic hexagonal chitin cells & amber resin */}
            <polygon points="60,10 70,16 70,26 60,32 50,26 50,16" fill="#3D2610" stroke={palette.glow} strokeWidth="2" />
            <circle cx="60" cy="21" r="4.5" fill={palette.glow} />
            <polygon points="21,48 27,52 27,59 21,63 15,59 15,52" fill="#3D2610" stroke={palette.glow} strokeWidth="1.5" />
            <polygon points="99,48 105,52 105,59 99,63 93,59 93,52" fill="#3D2610" stroke={palette.glow} strokeWidth="1.5" />
          </g>
        );

      case 'prismatic_crystal':
        return (
          <g>
            {/* Jagged quartz & amethyst crystal spires */}
            <polygon points="60,6 68,22 60,32 52,22" fill={palette.glow} stroke="#D9D0BC" strokeWidth="1.5" />
            <polygon points="44,14 52,25 46,32 40,24" fill={palette.secondary} />
            <polygon points="76,14 80,24 74,32 68,25" fill={palette.secondary} />
            <polygon points="14,62 26,54 22,74" fill={palette.glow} />
            <polygon points="106,62 94,54 98,74" fill={palette.glow} />
          </g>
        );

      case 'cursed_chains':
        return (
          <g>
            {/* Crossed ward chains & soul-cage lock */}
            <line x1="16" y1="34" x2="104" y2="56" stroke="#7A7485" strokeWidth="3.5" strokeDasharray="5 2" />
            <line x1="16" y1="56" x2="104" y2="34" stroke="#7A7485" strokeWidth="3.5" strokeDasharray="5 2" />
            <rect x="50" y="12" width="20" height="18" fill="#14101C" stroke={palette.glow} strokeWidth="2" />
            <rect x="57" y="18" width="6" height="6" fill={palette.secondary} className="animate-cripta-torch" />
          </g>
        );

      case 'blood_sanctum':
        return (
          <g>
            {/* Crimson rose window & sacrificial chalice */}
            <circle cx="60" cy="21" r="11" fill="#1C0910" stroke={palette.glow} strokeWidth="2.5" />
            <polygon points="54,18 66,18 62,26 58,26" fill={palette.highlight} />
            <rect x="58" y="26" width="4" height="4" fill={palette.highlight} />
            <rect x="58" y="14" width="4" height="4" fill={palette.glow} />
          </g>
        );

      case 'buried_obelisk':
        return (
          <g>
            {/* Sandstone pyramidion & sun-disc cartouche */}
            <polygon points="40,30 60,8 80,30" fill="#3B2E1E" stroke={palette.highlight} strokeWidth="2" />
            <circle cx="60" cy="22" r="5" fill={palette.glow} />
            <rect x="18" y="44" width="4" height="24" fill={palette.highlight} opacity="0.7" />
            <rect x="98" y="44" width="4" height="24" fill={palette.highlight} opacity="0.7" />
          </g>
        );

      case 'mirror_arch':
        return (
          <g>
            {/* Ornate silver mirror crown & quicksilver crest */}
            <polygon points="60,8 74,21 60,34 46,21" fill="#2A2638" stroke="#D9D0BC" strokeWidth="2" />
            <polygon points="60,13 69,21 60,29 51,21" fill={palette.secondary} opacity="0.85" />
          </g>
        );

      case 'glacial_maw':
        return (
          <g>
            {/* Hanging glacial fangs & frozen rune crest */}
            <polygon points="32,30 36,50 40,30" fill="#9ED2CE" />
            <polygon points="46,30 51,56 56,30" fill="#D9D0BC" />
            <polygon points="64,30 69,54 74,30" fill="#9ED2CE" />
            <polygon points="80,30 84,48 88,30" fill="#D9D0BC" />
            <rect x="57" y="16" width="6" height="6" fill={palette.glow} />
          </g>
        );

      case 'goblin_palisade':
        return (
          <g>
            {/* Jagged scrap-iron war totem & twin smoking braziers */}
            <circle cx="60" cy="21" r="10" fill="#3B2818" stroke={palette.glow} strokeWidth="2" />
            <rect x="57" y="18" width="6" height="6" fill={palette.secondary} />
            <rect x="17" y="42" width="6" height="6" fill={palette.glow} className="animate-cripta-torch" />
            <rect x="97" y="42" width="6" height="6" fill={palette.glow} className="animate-cripta-torch" />
          </g>
        );

      case 'titan_ribs':
        return (
          <g>
            {/* Colossal fossilized bone ribs & giant skull keystone */}
            <path d="M14 108 Q6 54 38 26 M106 108 Q114 54 82 26" fill="none" stroke="#D9D0BC" strokeWidth="5" />
            <rect x="48" y="10" width="24" height="18" fill="#D9D0BC" stroke="#12110F" strokeWidth="2" />
            <rect x="52" y="16" width="4" height="4" fill="#12110F" />
            <rect x="64" y="16" width="4" height="4" fill="#12110F" />
          </g>
        );

      case 'abyssal_rift':
      default:
        return (
          <g>
            {/* Fractured obsidian monolith & pulsing void eye */}
            <polygon points="60,6 72,21 60,36 48,21" fill="#120B1D" stroke={palette.glow} strokeWidth="2" />
            <line x1="60" y1="10" x2="60" y2="32" stroke="#D9D0BC" strokeWidth="2" />
            <circle cx="60" cy="21" r="4.5" fill={palette.glow} className="animate-cripta-torch" />
          </g>
        );
    }
  };

  return (
    <div
      className={`relative w-full aspect-[4/5] max-h-[300px] mx-auto select-none overflow-hidden transition-all duration-300 ${
        isOpening ? 'animate-cripta-door-tremor' : ''
      }`}
    >
      {/* Subtle subterranean wall backlight */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 62%, ${palette.fog} 0%, transparent 74%)`,
          opacity: activeIntensity ? 0.95 : 0.45,
        }}
      />

      {/* =====================================================================
          INTERIOR THRESHOLD (Revealed when the heavy double doors grind open)
          ===================================================================== */}
      <div className="absolute inset-x-[24%] top-[23%] bottom-[6%] overflow-hidden flex flex-col items-center justify-end bg-[#050408]">
        {/* Inner fog & beckoning dungeon light */}
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 38%, ${palette.glow}77 0%, ${palette.fog}99 48%, #050408 92%)`,
            opacity: isOpening ? 1 : activeIntensity ? 0.65 : 0.3,
          }}
        />
        {/* Pixel-art descending stone stairs into the dungeon */}
        <div className="relative z-10 w-full px-3 pb-2 flex flex-col items-center gap-1.5 opacity-95">
          <div
            className="w-9 h-9 rounded-full blur-md transition-transform duration-700"
            style={{
              backgroundColor: palette.glow,
              transform: isOpening ? 'scale(1.35)' : 'scale(0.9)',
            }}
          />
          <div className="w-[48%] h-2 border border-black/90" style={{ backgroundColor: palette.stone }} />
          <div className="w-[64%] h-2.5 border border-black/90" style={{ backgroundColor: palette.stoneDark }} />
          <div className="w-[82%] h-3 border border-black/90" style={{ backgroundColor: palette.stone }} />
          <div className="w-full h-3.5 border border-black/90" style={{ backgroundColor: palette.stoneDark }} />
        </div>
      </div>

      {/* =====================================================================
          LEFT & RIGHT HEAVY DOORS (Slide open when selected / majority locked)
          ===================================================================== */}
      <div className="absolute inset-x-[24%] top-[23%] bottom-[6%] overflow-hidden pointer-events-none">
        <div className="relative w-full h-full flex">
          {/* Left Door Slab */}
          <div
            className="w-1/2 h-full border-r-2 transition-transform ease-in-out relative flex flex-col justify-between p-2"
            style={{
              backgroundColor: palette.stoneDark,
              borderColor: activeIntensity ? palette.glow : '#0B0A0E',
              transitionDuration: isOpening ? '2100ms' : '320ms',
              transform: isOpening
                ? 'translateX(-88%)'
                : isHovered
                ? 'translateX(-4%)'
                : 'translateX(0%)',
              boxShadow: 'inset -6px 0 14px rgba(0,0,0,0.88)',
            }}
          >
            {/* Iron straps & pixel relief */}
            <div className="w-full h-2 border border-black/80" style={{ backgroundColor: palette.stone }} />
            <div
              className="w-4/5 h-12 mx-auto border border-black/85 flex items-center justify-center"
              style={{ backgroundColor: palette.stone }}
            >
              <div
                className="w-2.5 h-2.5 rotate-45 transition-colors duration-300"
                style={{ backgroundColor: activeIntensity ? palette.glow : palette.highlight }}
              />
            </div>
            {/* Heavy iron ring handle */}
            <div
              className="self-end mr-1 w-3.5 h-3.5 border-2"
              style={{ borderColor: activeIntensity ? palette.glow : palette.highlight }}
            />
            <div
              className="w-4/5 h-10 mx-auto border border-black/85"
              style={{ backgroundColor: palette.stone }}
            />
            <div className="w-full h-2 border border-black/80" style={{ backgroundColor: palette.stone }} />
          </div>

          {/* Right Door Slab */}
          <div
            className="w-1/2 h-full border-l-2 transition-transform ease-in-out relative flex flex-col justify-between p-2"
            style={{
              backgroundColor: palette.stoneDark,
              borderColor: activeIntensity ? palette.glow : '#0B0A0E',
              transitionDuration: isOpening ? '2100ms' : '320ms',
              transform: isOpening
                ? 'translateX(88%)'
                : isHovered
                ? 'translateX(4%)'
                : 'translateX(0%)',
              boxShadow: 'inset 6px 0 14px rgba(0,0,0,0.88)',
            }}
          >
            <div className="w-full h-2 border border-black/80" style={{ backgroundColor: palette.stone }} />
            <div
              className="w-4/5 h-12 mx-auto border border-black/85 flex items-center justify-center"
              style={{ backgroundColor: palette.stone }}
            >
              <div
                className="w-2.5 h-2.5 rotate-45 transition-colors duration-300"
                style={{ backgroundColor: activeIntensity ? palette.glow : palette.highlight }}
              />
            </div>
            {/* Heavy iron ring handle */}
            <div
              className="self-start ml-1 w-3.5 h-3.5 border-2"
              style={{ borderColor: activeIntensity ? palette.glow : palette.highlight }}
            />
            <div
              className="w-4/5 h-10 mx-auto border border-black/85"
              style={{ backgroundColor: palette.stone }}
            />
            <div className="w-full h-2 border border-black/80" style={{ backgroundColor: palette.stone }} />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CRISP PIXEL-ART SVG ARCHWAY, PILLARS & BESPOKE DUNGEON RELIEF
          ===================================================================== */}
      <svg
        viewBox="0 0 120 146"
        className="relative z-20 w-full h-full pointer-events-none pixelated-art"
        shapeRendering="crispEdges"
      >
        {/* Left & Right Monumental Stone Pillars */}
        <rect
          x="12"
          y="28"
          width="16"
          height="108"
          fill={palette.stone}
          stroke={activeIntensity ? palette.glow : '#0B0A0E'}
          strokeWidth="2"
        />
        <rect
          x="92"
          y="28"
          width="16"
          height="108"
          fill={palette.stone}
          stroke={activeIntensity ? palette.glow : '#0B0A0E'}
          strokeWidth="2"
        />

        {/* Pillar Masonry Courses */}
        <line x1="12" y1="48" x2="28" y2="48" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="12" y1="68" x2="28" y2="68" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="12" y1="88" x2="28" y2="88" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="12" y1="108" x2="28" y2="108" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="12" y1="124" x2="28" y2="124" stroke="#0B0A0E" strokeWidth="2" />

        <line x1="92" y1="48" x2="108" y2="48" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="92" y1="68" x2="108" y2="68" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="92" y1="88" x2="108" y2="88" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="92" y1="108" x2="108" y2="108" stroke="#0B0A0E" strokeWidth="2" />
        <line x1="92" y1="124" x2="108" y2="124" stroke="#0B0A0E" strokeWidth="2" />

        {/* Top Monumental Stone Lintel */}
        <polygon
          points="8,30 22,12 98,12 112,30"
          fill={palette.stone}
          stroke="#0B0A0E"
          strokeWidth="2"
        />
        <rect
          x="10"
          y="26"
          width="100"
          height="8"
          fill={palette.stoneDark}
          stroke={activeIntensity ? palette.glow : palette.highlight}
          strokeWidth="1.5"
        />

        {/* Ground Threshold Plinth */}
        <rect x="4" y="134" width="112" height="8" fill={palette.stone} stroke="#0B0A0E" strokeWidth="2" />
        <rect x="14" y="138" width="92" height="6" fill={palette.stoneDark} />

        {/* Bespoke Dungeon Architectural Motif */}
        {renderArchMotif()}
      </svg>

      {/* =====================================================================
          SUBTLE AMBIENT MOTES
          ===================================================================== */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        <span
          className="animate-cripta-mote absolute left-[30%] bottom-6 w-1.5 h-1.5"
          style={{ backgroundColor: palette.glow, animationDelay: '0.2s' }}
        />
        <span
          className="animate-cripta-mote absolute left-[52%] bottom-10 w-1.5 h-1.5"
          style={{ backgroundColor: palette.highlight, animationDelay: '1.4s' }}
        />
        <span
          className="animate-cripta-mote absolute left-[70%] bottom-7 w-1.5 h-1.5"
          style={{ backgroundColor: palette.glow, animationDelay: '2.5s' }}
        />
      </div>
    </div>
  );
};
