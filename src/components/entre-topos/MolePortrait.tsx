import React from 'react';
import { MoleCustomization } from '../../types/entreTopos';

export interface MolePortraitProps {
  customization?: Partial<MoleCustomization>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  expression?: 'normal' | 'suspicious' | 'surprised' | 'guilty' | 'proud';
  className?: string;
  isAccused?: boolean;
  isTopoReveal?: boolean;
  showShadow?: boolean;
}

export const MOLE_HATS = [
  { id: 'none', name: 'Sin sombrero' },
  { id: 'boina', name: 'Boina bohemia' },
  { id: 'bombin', name: 'Bombín clásico' },
  { id: 'detective', name: 'Gorra detective' },
  { id: 'corona', name: 'Corona real' },
  { id: 'copa', name: 'Sombrero de copa' },
  { id: 'lana', name: 'Gorro de lana' },
  { id: 'pirata', name: 'Tricornio pirata' },
  { id: 'minero', name: 'Casco de minero' },
  { id: 'fiesta', name: 'Gorro de fiesta' },
  { id: 'mexicano', name: 'Sombrero mariachi' },
];

export const MOLE_FACES = [
  { id: 'none', name: 'Sin accesorio' },
  { id: 'gafas-sol', name: 'Gafas de sol' },
  { id: 'monoculo', name: 'Monóculo' },
  { id: 'bigote', name: 'Bigote rizado' },
  { id: 'gafas-pasta', name: 'Gafas de pasta' },
  { id: 'pipa', name: 'Pipa de detective' },
  { id: 'parche', name: 'Parche pirata' },
  { id: 'cejas', name: 'Cejas pobladas' },
  { id: 'tirita', name: 'Tirita en hocico' },
  { id: 'lupa', name: 'Lupa de pesquisa' },
  { id: 'pecas', name: 'Pecas cómic' },
];

export const MOLE_CLOTHES = [
  { id: 'none', name: 'Sin prenda' },
  { id: 'gabardina', name: 'Gabardina beige' },
  { id: 'traje', name: 'Traje y corbata' },
  { id: 'sudadera', name: 'Sudadera urbana' },
  { id: 'rayas', name: 'Camiseta rayas' },
  { id: 'pajarita', name: 'Camisa y pajarita' },
  { id: 'bufanda', name: 'Bufanda de lana' },
  { id: 'chaleco', name: 'Chaleco vintage' },
  { id: 'poncho', name: 'Poncho a rayas' },
  { id: 'cuello-alto', name: 'Cuello alto noir' },
  { id: 'peto', name: 'Peto vaquero' },
];

export const MOLE_COLORS = [
  { id: '#78523A', name: 'Castaño oscuro' },
  { id: '#5C3D2E', name: 'Chocolate' },
  { id: '#453B34', name: 'Pizarra topo' },
  { id: '#2B2522', name: 'Carbón' },
  { id: '#9C7A65', name: 'Canela' },
  { id: '#B08968', name: 'Arena' },
  { id: '#DDB892', name: 'Trigo claro' },
  { id: '#606C38', name: 'Oliva' },
];

export const DEFAULT_MOLE_CUSTOMIZATION: MoleCustomization = {
  hat: 'none',
  face: 'none',
  clothing: 'none',
  color: '#78523A',
};

const TORSO_PATH = 'M 38 196 C 40 152, 58 134, 100 134 C 142 134, 160 152, 162 196 Z';
const PONCHO_PATH = 'M 32 196 C 36 148, 56 132, 100 132 C 144 132, 164 148, 168 196 Z';

export const MolePortrait: React.FC<MolePortraitProps> = ({
  customization,
  size = 'md',
  expression = 'normal',
  className = '',
  isAccused = false,
  isTopoReveal = false,
  showShadow = true,
}) => {
  const uniqueId = React.useId().replace(/:/g, '');
  const hat = customization?.hat || 'none';
  const face = customization?.face || 'none';
  const clothing = customization?.clothing || 'none';
  const furColor = customization?.color || '#78523A';

  // Dimension mapping
  const sizeClasses = {
    xs: 'w-12 h-12',
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  }[size];

  // Helper for dark outline / shadow color derived from fur
  const outlineColor = '#18120e';
  const snoutColor = '#f4a49c';
  const snoutOutline = '#7a3b35';
  const torsoClipId = `torso-clip-${uniqueId}`;
  const ponchoClipId = `poncho-clip-${uniqueId}`;
  const halftoneId = `halftone-${uniqueId}`;

  // Full-torso garments replace the outer fur torso silhouette so fur never protrudes around edges
  const showBaseFurTorso = clothing === 'none' || clothing === 'bufanda';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}
      style={{
        filter: showShadow ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : undefined,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Halftone / comic ink texture pattern */}
          <pattern id={halftoneId} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="rgba(0,0,0,0.12)" />
          </pattern>
          <clipPath id={torsoClipId}>
            <path d={TORSO_PATH} />
          </clipPath>
          <clipPath id={ponchoClipId}>
            <path d={PONCHO_PATH} />
          </clipPath>
        </defs>

        {/* 1. BACKGROUND SHADOW BEHIND MOLE */}
        <ellipse cx="100" cy="188" rx="65" ry="12" fill="rgba(0,0,0,0.3)" />

        {/* 2. BODY / SHOULDERS / UPPER TORSO (Shown when plain or wearing neck scarf) */}
        {showBaseFurTorso && (
          <g id="torso">
            <path
              d={TORSO_PATH}
              fill={furColor}
              stroke={outlineColor}
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d={TORSO_PATH} fill={`url(#${halftoneId})`} />
          </g>
        )}

        {/* 3. CLOTHING (Slots) */}
        <g id="clothing">
          {clothing === 'gabardina' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                <path d={TORSO_PATH} fill="#d4b483" />
                {/* Inner dark shirt V */}
                <polygon points="80,132 120,132 100,168" fill="#27272a" stroke={outlineColor} strokeWidth="2.5" />
                {/* Center seam */}
                <line x1="100" y1="166" x2="100" y2="198" stroke={outlineColor} strokeWidth="3" />
                {/* Wide collar & lapels */}
                <path
                  d="M 66 134 L 48 164 L 76 168 L 70 198 L 100 198 L 100 166 Z"
                  fill="#c19d67"
                  stroke={outlineColor}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 134 134 L 152 164 L 124 168 L 130 198 L 100 198 L 100 166 Z"
                  fill="#c19d67"
                  stroke={outlineColor}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* Buttons */}
                <circle cx="91" cy="175" r="3" fill="#5c4028" stroke={outlineColor} strokeWidth="1.5" />
                <circle cx="91" cy="188" r="3" fill="#5c4028" stroke={outlineColor} strokeWidth="1.5" />
                <circle cx="109" cy="175" r="3" fill="#5c4028" stroke={outlineColor} strokeWidth="1.5" />
                <circle cx="109" cy="188" r="3" fill="#5c4028" stroke={outlineColor} strokeWidth="1.5" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'traje' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                {/* Jacket base */}
                <path d={TORSO_PATH} fill="#1e293b" />
                {/* White shirt V-zone */}
                <polygon points="78,132 122,132 100,178" fill="#f8fafc" stroke={outlineColor} strokeWidth="2.5" />
                {/* Suit lapels */}
                <polygon points="78,134 64,160 86,166 100,178" fill="#0f172a" stroke={outlineColor} strokeWidth="2.5" />
                <polygon points="122,134 136,160 114,166 100,178" fill="#0f172a" stroke={outlineColor} strokeWidth="2.5" />
                {/* Red tie */}
                <polygon points="96,144 104,144 106,178 100,190 94,178" fill="#e11d48" stroke={outlineColor} strokeWidth="2" />
                <polygon points="94,138 106,138 103,146 97,146" fill="#be123c" stroke={outlineColor} strokeWidth="1.5" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'sudadera' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                <path d={TORSO_PATH} fill="#2563eb" />
                {/* Pocket seam */}
                <path d="M 64 196 L 72 174 L 128 174 L 136 196 Z" fill="#1d4ed8" stroke={outlineColor} strokeWidth="3" />
                {/* Hood rim */}
                <path
                  d="M 58 136 Q 100 156 142 136 Q 100 166 58 136 Z"
                  fill="#1e40af"
                  stroke={outlineColor}
                  strokeWidth="3.5"
                />
                {/* Drawstrings */}
                <line x1="90" y1="152" x2="88" y2="180" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <line x1="110" y1="152" x2="112" y2="180" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'rayas' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                <path d={TORSO_PATH} fill="#f8fafc" />
                <path d="M 30 152 Q 100 156 170 152" stroke="#0f172a" strokeWidth="7" fill="none" />
                <path d="M 30 167 Q 100 171 170 167" stroke="#0f172a" strokeWidth="7" fill="none" />
                <path d="M 30 182 Q 100 186 170 182" stroke="#0f172a" strokeWidth="7" fill="none" />
                {/* Collar trim */}
                <path d="M 70 135 Q 100 148 130 135" fill="none" stroke="#0f172a" strokeWidth="5" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'pajarita' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                {/* Formal white shirt */}
                <path d={TORSO_PATH} fill="#ffffff" />
                {/* Placket and buttons */}
                <line x1="94" y1="146" x2="94" y2="196" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="106" y1="146" x2="106" y2="196" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="100" cy="168" r="2.5" fill="#1e293b" />
                <circle cx="100" cy="182" r="2.5" fill="#1e293b" />
                {/* Black bow tie */}
                <polygon points="100,152 80,141 80,163" fill="#09090b" stroke={outlineColor} strokeWidth="2.5" />
                <polygon points="100,152 120,141 120,163" fill="#09090b" stroke={outlineColor} strokeWidth="2.5" />
                <circle cx="100" cy="152" r="5" fill="#27272a" stroke={outlineColor} strokeWidth="2" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'bufanda' && (
            <g>
              {/* Scarf bundle around neck */}
              <path
                d="M 52 138 Q 100 152 148 138 Q 152 158 100 163 Q 48 158 52 138 Z"
                fill="#ea580c"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Hanging scarf tail */}
              <path
                d="M 112 155 L 118 194 L 138 194 L 132 155 Z"
                fill="#c2410c"
                stroke={outlineColor}
                strokeWidth="3.5"
              />
              {/* Fringe */}
              <line x1="120" y1="194" x2="120" y2="199" stroke="#7c2d12" strokeWidth="2.5" />
              <line x1="126" y1="194" x2="126" y2="199" stroke="#7c2d12" strokeWidth="2.5" />
              <line x1="132" y1="194" x2="132" y2="199" stroke="#7c2d12" strokeWidth="2.5" />
            </g>
          )}

          {clothing === 'chaleco' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                <path d={TORSO_PATH} fill="#f8fafc" />
                {/* Tweed vest panels */}
                <path
                  d="M 36 198 L 36 134 L 78 134 L 94 162 L 92 198 Z"
                  fill="#854d0e"
                  stroke={outlineColor}
                  strokeWidth="3.5"
                />
                <path
                  d="M 164 198 L 164 134 L 122 134 L 106 162 L 108 198 Z"
                  fill="#854d0e"
                  stroke={outlineColor}
                  strokeWidth="3.5"
                />
                <circle cx="100" cy="170" r="2.5" fill="#facc15" stroke={outlineColor} strokeWidth="1.2" />
                <circle cx="100" cy="184" r="2.5" fill="#facc15" stroke={outlineColor} strokeWidth="1.2" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'poncho' && (
            <g>
              <g clipPath={`url(#${ponchoClipId})`}>
                <path d={PONCHO_PATH} fill="#059669" />
                <polygon points="100,142 162,196 38,196" fill="#f59e0b" stroke={outlineColor} strokeWidth="2.5" />
                <polygon points="100,154 144,196 56,196" fill="#dc2626" stroke={outlineColor} strokeWidth="2.5" />
                <polygon points="78,132 122,132 100,154" fill="#78350f" stroke={outlineColor} strokeWidth="2.5" />
              </g>
              <path
                d={PONCHO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}

          {clothing === 'cuello-alto' && (
            <g>
              <path
                d={TORSO_PATH}
                fill="#09090b"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <ellipse cx="100" cy="138" rx="30" ry="11" fill="#18181b" stroke={outlineColor} strokeWidth="4" />
            </g>
          )}

          {clothing === 'peto' && (
            <g>
              <g clipPath={`url(#${torsoClipId})`}>
                {/* Under-shirt */}
                <path d={TORSO_PATH} fill="#e2e8f0" />
                {/* Straps */}
                <rect x="65" y="132" width="12" height="34" fill="#1e40af" stroke={outlineColor} strokeWidth="3" />
                <rect x="123" y="132" width="12" height="34" fill="#1e40af" stroke={outlineColor} strokeWidth="3" />
                {/* Denim front bib */}
                <polygon points="62,160 138,160 142,198 58,198" fill="#1d4ed8" stroke={outlineColor} strokeWidth="3.5" />
                {/* Front pocket */}
                <rect x="84" y="170" width="32" height="18" rx="3" fill="#1e40af" stroke={outlineColor} strokeWidth="2" />
                {/* Brass buttons */}
                <circle cx="71" cy="164" r="3.5" fill="#eab308" stroke={outlineColor} strokeWidth="1.5" />
                <circle cx="129" cy="164" r="3.5" fill="#eab308" stroke={outlineColor} strokeWidth="1.5" />
              </g>
              <path
                d={TORSO_PATH}
                fill="none"
                stroke={outlineColor}
                strokeWidth="5"
                strokeLinejoin="round"
              />
            </g>
          )}
        </g>

        {/* 4. MOLE EARS (Round cute cartoon ears) */}
        <g id="ears">
          <ellipse cx="48" cy="85" rx="14" ry="17" fill={furColor} stroke={outlineColor} strokeWidth="4" />
          <ellipse cx="49" cy="86" rx="8" ry="10" fill="#f4a49c" />
          <ellipse cx="152" cy="85" rx="14" ry="17" fill={furColor} stroke={outlineColor} strokeWidth="4" />
          <ellipse cx="151" cy="86" rx="8" ry="10" fill="#f4a49c" />
        </g>

        {/* 5. MOLE HEAD (Chubby egg-shaped head) */}
        <g id="head">
          <ellipse
            cx="100"
            cy="95"
            rx="56"
            ry="50"
            fill={furColor}
            stroke={outlineColor}
            strokeWidth="5"
          />
          <ellipse
            cx="100"
            cy="95"
            rx="56"
            ry="50"
            fill={`url(#${halftoneId})`}
          />
        </g>

        {/* 6. EYES & EXPRESSION */}
        <g id="eyes">
          {expression === 'suspicious' ? (
            <g>
              {/* Squinting detective eyes */}
              <line x1="74" y1="84" x2="88" y2="86" stroke={outlineColor} strokeWidth="4" strokeLinecap="round" />
              <line x1="112" y1="86" x2="126" y2="84" stroke={outlineColor} strokeWidth="4" strokeLinecap="round" />
              <circle cx="82" cy="88" r="3" fill="#000000" />
              <circle cx="118" cy="88" r="3" fill="#000000" />
            </g>
          ) : expression === 'surprised' ? (
            <g>
              {/* Wide open big round eyes */}
              <circle cx="80" cy="82" r="8" fill="#ffffff" stroke={outlineColor} strokeWidth="3" />
              <circle cx="80" cy="82" r="4" fill="#000000" />
              <circle cx="120" cy="82" r="8" fill="#ffffff" stroke={outlineColor} strokeWidth="3" />
              <circle cx="120" cy="82" r="4" fill="#000000" />
            </g>
          ) : expression === 'guilty' ? (
            <g>
              {/* Looking sideways awkwardly */}
              <circle cx="80" cy="84" r="6" fill="#ffffff" stroke={outlineColor} strokeWidth="3" />
              <circle cx="76" cy="84" r="3.5" fill="#000000" />
              <circle cx="120" cy="84" r="6" fill="#ffffff" stroke={outlineColor} strokeWidth="3" />
              <circle cx="116" cy="84" r="3.5" fill="#000000" />
              {/* Sweat drop */}
              <path d="M 138 72 C 138 68, 142 63, 142 63 C 142 63, 146 68, 146 72 C 146 75, 142 77, 138 72 Z" fill="#38bdf8" />
            </g>
          ) : (
            <g>
              {/* Classic beady cute mole eyes */}
              <ellipse cx="80" cy="84" rx="5.5" ry="6" fill="#09090b" />
              <circle cx="78" cy="82" r="2" fill="#ffffff" />
              <ellipse cx="120" cy="84" rx="5.5" ry="6" fill="#09090b" />
              <circle cx="118" cy="82" r="2" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* 7. SNOUT & NOSE (Exaggerated iconic mole snout) */}
        <g id="snout">
          {/* Flesh snout base */}
          <ellipse
            cx="100"
            cy="106"
            rx="28"
            ry="20"
            fill={snoutColor}
            stroke={snoutOutline}
            strokeWidth="3.5"
          />
          {/* Nostrils */}
          <ellipse cx="92" cy="104" rx="3.5" ry="4.5" fill="#7a3b35" />
          <ellipse cx="108" cy="104" rx="3.5" ry="4.5" fill="#7a3b35" />
          {/* Snout shine highlight */}
          <ellipse cx="100" cy="98" rx="8" ry="3" fill="rgba(255,255,255,0.6)" />
          {/* Cute mouth underneath */}
          <path
            d="M 94 116 Q 100 120 106 116"
            fill="none"
            stroke={snoutOutline}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Whiskers */}
          <line x1="68" y1="104" x2="42" y2="100" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="110" x2="40" y2="114" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="132" y1="104" x2="158" y2="100" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="132" y1="110" x2="160" y2="114" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* 8. FACE ACCESSORY (Slots) */}
        <g id="face-accessory">
          {face === 'gafas-sol' && (
            <g>
              {/* Dark cool sunglasses */}
              <polygon points="68,76 96,76 92,94 72,94" fill="#09090b" stroke={outlineColor} strokeWidth="3" />
              <polygon points="104,76 132,76 128,94 108,94" fill="#09090b" stroke={outlineColor} strokeWidth="3" />
              <line x1="96" y1="80" x2="104" y2="80" stroke={outlineColor} strokeWidth="3" />
              <line x1="68" y1="80" x2="52" y2="84" stroke={outlineColor} strokeWidth="2.5" />
              <line x1="132" y1="80" x2="148" y2="84" stroke={outlineColor} strokeWidth="2.5" />
              {/* White glare slash */}
              <line x1="74" y1="80" x2="84" y2="90" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
              <line x1="110" y1="80" x2="120" y2="90" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {face === 'monoculo' && (
            <g>
              <circle cx="120" cy="84" r="13" fill="rgba(186, 230, 253, 0.35)" stroke="#ca8a04" strokeWidth="3" />
              {/* Monocle chain */}
              <path d="M 132 90 Q 146 112 136 142" fill="none" stroke="#ca8a04" strokeWidth="2" strokeDasharray="2,2" />
            </g>
          )}

          {face === 'bigote' && (
            <g>
              {/* Handlebar mustache */}
              <path
                d="M 100 114 C 92 110, 72 108, 62 118 C 60 120, 64 122, 68 120 C 76 116, 92 118, 100 124 C 108 118, 124 116, 132 120 C 136 122, 140 120, 138 118 C 128 108, 108 110, 100 114 Z"
                fill="#27272a"
                stroke={outlineColor}
                strokeWidth="2.5"
              />
            </g>
          )}

          {face === 'gafas-pasta' && (
            <g>
              {/* Round nerd glasses with tape */}
              <circle cx="78" cy="84" r="14" fill="rgba(255,255,255,0.2)" stroke="#18181b" strokeWidth="4" />
              <circle cx="122" cy="84" r="14" fill="rgba(255,255,255,0.2)" stroke="#18181b" strokeWidth="4" />
              <line x1="92" y1="84" x2="108" y2="84" stroke="#18181b" strokeWidth="4" />
              {/* White tape wrap on bridge */}
              <rect x="96" y="80" width="8" height="8" rx="1" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
            </g>
          )}

          {face === 'pipa' && (
            <g>
              {/* Smoking pipe */}
              <path
                d="M 106 118 Q 120 124 135 120 L 138 106 A 6 6 0 0 1 150 106 L 146 126 Q 122 134 106 118 Z"
                fill="#78350f"
                stroke={outlineColor}
                strokeWidth="2.5"
              />
              {/* Comic smoke puffs */}
              <circle cx="146" cy="98" r="4" fill="rgba(203,213,225,0.7)" />
              <circle cx="152" cy="88" r="6" fill="rgba(203,213,225,0.5)" />
            </g>
          )}

          {face === 'parche' && (
            <g>
              {/* Pirate eyepatch */}
              <line x1="50" y1="68" x2="145" y2="98" stroke={outlineColor} strokeWidth="3" />
              <ellipse cx="80" cy="84" rx="10" ry="11" fill="#09090b" stroke={outlineColor} strokeWidth="2.5" />
            </g>
          )}

          {face === 'cejas' && (
            <g>
              {/* Bushy furrowed brows */}
              <path d="M 68 76 Q 80 68 94 76" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
              <path d="M 106 76 Q 120 68 132 76" fill="none" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
            </g>
          )}

          {face === 'tirita' && (
            <g>
              {/* Band-aid on snout */}
              <rect x="88" y="104" width="24" height="8" rx="2" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" transform="rotate(-15 100 108)" />
              <circle cx="97" cy="107" r="0.8" fill="#c2410c" />
              <circle cx="103" cy="108" r="0.8" fill="#c2410c" />
            </g>
          )}

          {face === 'lupa' && (
            <g>
              {/* Magnifying glass over eye */}
              <circle cx="80" cy="84" r="16" fill="rgba(186, 230, 253, 0.4)" stroke="#78350f" strokeWidth="3.5" />
              <line x1="68" y1="96" x2="52" y2="114" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
            </g>
          )}

          {face === 'pecas' && (
            <g>
              <circle cx="68" cy="94" r="1.5" fill="#78350f" />
              <circle cx="72" cy="98" r="1.5" fill="#78350f" />
              <circle cx="66" cy="102" r="1.5" fill="#78350f" />
              <circle cx="132" cy="94" r="1.5" fill="#78350f" />
              <circle cx="128" cy="98" r="1.5" fill="#78350f" />
              <circle cx="134" cy="102" r="1.5" fill="#78350f" />
            </g>
          )}
        </g>

        {/* 9. PAWS (Resting at bottom rim so they never protrude through torso clothing) */}
        <g id="paws">
          <ellipse cx="60" cy="192" rx="10" ry="6.5" fill={furColor} stroke={outlineColor} strokeWidth="3" />
          <line x1="56" y1="194" x2="56" y2="188" stroke={outlineColor} strokeWidth="1.5" />
          <line x1="60" y1="195" x2="60" y2="188" stroke={outlineColor} strokeWidth="1.5" />

          <ellipse cx="140" cy="192" rx="10" ry="6.5" fill={furColor} stroke={outlineColor} strokeWidth="3" />
          <line x1="140" y1="195" x2="140" y2="188" stroke={outlineColor} strokeWidth="1.5" />
          <line x1="144" y1="194" x2="144" y2="188" stroke={outlineColor} strokeWidth="1.5" />
        </g>

        {/* 10. HATS (Slots) */}
        <g id="hat">
          {hat === 'boina' && (
            <g>
              {/* Slanted artistic beret */}
              <ellipse cx="106" cy="52" rx="46" ry="18" fill="#18181b" stroke={outlineColor} strokeWidth="4" transform="rotate(-8 106 52)" />
              <circle cx="112" cy="38" r="3" fill="#18181b" stroke={outlineColor} strokeWidth="1.5" />
            </g>
          )}

          {hat === 'bombin' && (
            <g>
              {/* Bowler hat */}
              <ellipse cx="100" cy="58" rx="42" ry="8" fill="#1e293b" stroke={outlineColor} strokeWidth="3.5" />
              <path d="M 68 56 C 68 28, 132 28, 132 56 Z" fill="#0f172a" stroke={outlineColor} strokeWidth="4" />
              <rect x="68" y="50" width="64" height="6" fill="#be123c" />
            </g>
          )}

          {hat === 'detective' && (
            <g>
              {/* Deerstalker cap */}
              <path d="M 62 60 C 62 26, 138 26, 138 60 Z" fill="#a89276" stroke={outlineColor} strokeWidth="4" />
              <path d="M 62 60 C 62 26, 138 26, 138 60 Z" fill={`url(#${halftoneId})`} />
              {/* Front and back peaks */}
              <path d="M 52 64 Q 100 52 148 64 Q 100 58 52 64 Z" fill="#8c785e" stroke={outlineColor} strokeWidth="3" />
              {/* Ear flap tied at top */}
              <path d="M 94 28 L 100 22 L 106 28 Z" fill="#524434" stroke={outlineColor} strokeWidth="2" />
            </g>
          )}

          {hat === 'corona' && (
            <g>
              {/* Golden cartoon crown */}
              <polygon points="65,58 70,30 85,45 100,24 115,45 130,30 135,58" fill="#facc15" stroke={outlineColor} strokeWidth="3.5" />
              <circle cx="70" cy="30" r="3" fill="#ef4444" />
              <circle cx="100" cy="24" r="3.5" fill="#3b82f6" />
              <circle cx="130" cy="30" r="3" fill="#ef4444" />
              <rect x="65" y="52" width="70" height="6" fill="#ca8a04" />
            </g>
          )}

          {hat === 'copa' && (
            <g>
              {/* Tall top hat */}
              <ellipse cx="100" cy="58" rx="46" ry="8" fill="#09090b" stroke={outlineColor} strokeWidth="3.5" />
              <rect x="72" y="16" width="56" height="40" rx="2" fill="#18181b" stroke={outlineColor} strokeWidth="4" />
              <rect x="72" y="46" width="56" height="8" fill="#dc2626" />
            </g>
          )}

          {hat === 'lana' && (
            <g>
              {/* Beanie with pompom */}
              <path d="M 64 60 C 64 28, 136 28, 136 60 Z" fill="#ea580c" stroke={outlineColor} strokeWidth="4" />
              <rect x="60" y="52" width="80" height="10" rx="3" fill="#c2410c" stroke={outlineColor} strokeWidth="3" />
              <circle cx="100" cy="24" r="9" fill="#f97316" stroke={outlineColor} strokeWidth="2.5" />
            </g>
          )}

          {hat === 'pirata' && (
            <g>
              {/* Tricorn hat */}
              <polygon points="50,60 100,22 150,60 100,56" fill="#09090b" stroke={outlineColor} strokeWidth="4" />
              <ellipse cx="100" cy="42" rx="4" ry="4" fill="#ffffff" />
              <line x1="94" y1="46" x2="106" y2="46" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {hat === 'minero' && (
            <g>
              {/* Hardhat with headlamp */}
              <ellipse cx="100" cy="58" rx="45" ry="10" fill="#ca8a04" stroke={outlineColor} strokeWidth="3" />
              <path d="M 65 56 C 65 30, 135 30, 135 56 Z" fill="#eab308" stroke={outlineColor} strokeWidth="4" />
              {/* Flashlight beam */}
              <polygon points="100,42 60,8 140,8" fill="rgba(254, 240, 138, 0.25)" />
              <circle cx="100" cy="42" r="7" fill="#fef08a" stroke={outlineColor} strokeWidth="2" />
            </g>
          )}

          {hat === 'fiesta' && (
            <g>
              {/* Party cone hat */}
              <polygon points="100,16 75,56 125,56" fill="#ec4899" stroke={outlineColor} strokeWidth="3.5" />
              <circle cx="100" cy="14" r="5" fill="#facc15" stroke={outlineColor} strokeWidth="1.5" />
              <path d="M 82 46 Q 100 48 118 46" stroke="#38bdf8" strokeWidth="3" />
            </g>
          )}

          {hat === 'mexicano' && (
            <g>
              {/* Wide brim mariachi sombrero */}
              <ellipse cx="100" cy="56" rx="58" ry="14" fill="#f59e0b" stroke={outlineColor} strokeWidth="4" />
              <path d="M 80 50 C 80 20, 120 20, 120 50 Z" fill="#d97706" stroke={outlineColor} strokeWidth="3.5" />
              <path d="M 48 56 Q 100 64 152 56" fill="none" stroke="#dc2626" strokeWidth="2.5" />
            </g>
          )}
        </g>

        {/* 11. ACCUSED STAMP OR TOPO REVEAL BADGE */}
        {isAccused && (
          <g id="accused-stamp" className="animate-pulse">
            <rect x="30" y="70" width="140" height="38" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="3" transform="rotate(-12 100 89)" />
            <text x="100" y="96" fill="#ffffff" fontSize="20" fontWeight="900" textAnchor="middle" transform="rotate(-12 100 89)" fontFamily="Impact, sans-serif" letterSpacing="2">
              ACUSADO
            </text>
          </g>
        )}

        {isTopoReveal && (
          <g id="topo-reveal-badge">
            <rect x="36" y="74" width="128" height="36" rx="6" fill="#000000" stroke="#f59e0b" strokeWidth="3" transform="rotate(8 100 92)" />
            <text x="100" y="99" fill="#f59e0b" fontSize="18" fontWeight="900" textAnchor="middle" transform="rotate(8 100 92)" fontFamily="Impact, sans-serif" letterSpacing="1.5">
              ¡ERA EL TOPO!
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
