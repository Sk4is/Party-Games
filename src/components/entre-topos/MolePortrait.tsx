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
  hat: 'detective',
  face: 'bigote',
  clothing: 'gabardina',
  color: '#78523A',
};

export const MolePortrait: React.FC<MolePortraitProps> = ({
  customization,
  size = 'md',
  expression = 'normal',
  className = '',
  isAccused = false,
  isTopoReveal = false,
  showShadow = true,
}) => {
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
          <pattern id="halftone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="rgba(0,0,0,0.12)" />
          </pattern>
          {/* Shading gradient */}
          <radialGradient id={`fur-grad-${furColor.replace('#', '')}`} cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor={furColor} />
            <stop offset="100%" stopColor="#1e140d" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* 1. BACKGROUND SHADOW BEHIND MOLE */}
        <ellipse cx="100" cy="188" rx="65" ry="12" fill="rgba(0,0,0,0.3)" />

        {/* 2. BODY / SHOULDERS / UPPER TORSO (Hand-drawn comic curve) */}
        <g id="torso">
          <path
            d="M 40 196 C 42 155, 60 135, 100 135 C 140 135, 158 155, 160 196 Z"
            fill={furColor}
            stroke={outlineColor}
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M 40 196 C 42 155, 60 135, 100 135 C 140 135, 158 155, 160 196 Z"
            fill="url(#halftone)"
          />
        </g>

        {/* 3. CLOTHING (Slots) */}
        <g id="clothing">
          {clothing === 'gabardina' && (
            <g>
              {/* Trench coat base */}
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#d4b483"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Wide collar & lapels */}
              <path
                d="M 68 142 L 52 165 L 75 168 L 70 196 M 132 142 L 148 165 L 125 168 L 130 196"
                fill="#c19d67"
                stroke={outlineColor}
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Buttons */}
              <circle cx="94" cy="172" r="3" fill="#6d5435" stroke={outlineColor} strokeWidth="1.5" />
              <circle cx="94" cy="188" r="3" fill="#6d5435" stroke={outlineColor} strokeWidth="1.5" />
            </g>
          )}

          {clothing === 'traje' && (
            <g>
              {/* Jacket */}
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#1e293b"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* White shirt triangle */}
              <polygon points="85,142 115,142 100,172" fill="#f8fafc" stroke={outlineColor} strokeWidth="2" />
              {/* Red tie */}
              <polygon points="97,148 103,148 105,178 100,190 95,178" fill="#e11d48" stroke={outlineColor} strokeWidth="2" />
              <polygon points="96,145 104,145 102,152 98,152" fill="#be123c" />
            </g>
          )}

          {clothing === 'sudadera' && (
            <g>
              <path
                d="M 42 196 C 45 158, 62 140, 100 140 C 138 140, 155 158, 158 196 Z"
                fill="#3b82f6"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Hood rim */}
              <path
                d="M 65 142 Q 100 156 135 142 Q 100 162 65 142 Z"
                fill="#1d4ed8"
                stroke={outlineColor}
                strokeWidth="3"
              />
              {/* Drawstrings */}
              <line x1="92" y1="156" x2="90" y2="182" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="108" y1="156" x2="110" y2="182" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {clothing === 'rayas' && (
            <g>
              {/* Shirt with convict / mariniere stripes */}
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#f1f5f9"
                stroke={outlineColor}
                strokeWidth="4"
              />
              <path d="M 48 155 Q 100 158 152 155" stroke="#0f172a" strokeWidth="6" />
              <path d="M 44 170 Q 100 173 156 170" stroke="#0f172a" strokeWidth="6" />
              <path d="M 42 185 Q 100 188 158 185" stroke="#0f172a" strokeWidth="6" />
            </g>
          )}

          {clothing === 'pajarita' && (
            <g>
              {/* Formal shirt */}
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#ffffff"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Black bow tie */}
              <polygon points="100,152 82,142 82,162" fill="#09090b" stroke={outlineColor} strokeWidth="2" />
              <polygon points="100,152 118,142 118,162" fill="#09090b" stroke={outlineColor} strokeWidth="2" />
              <circle cx="100" cy="152" r="4.5" fill="#27272a" stroke={outlineColor} strokeWidth="1.5" />
            </g>
          )}

          {clothing === 'bufanda' && (
            <g>
              {/* Scarf bundle */}
              <path
                d="M 58 140 Q 100 154 142 140 Q 146 158 100 162 Q 54 158 58 140 Z"
                fill="#ea580c"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Hanging scarf tail */}
              <path
                d="M 112 156 L 118 196 L 138 196 L 132 156 Z"
                fill="#c2410c"
                stroke={outlineColor}
                strokeWidth="3.5"
              />
              {/* Fringe */}
              <line x1="120" y1="196" x2="120" y2="200" stroke="#7c2d12" strokeWidth="2" />
              <line x1="126" y1="196" x2="126" y2="200" stroke="#7c2d12" strokeWidth="2" />
              <line x1="132" y1="196" x2="132" y2="200" stroke="#7c2d12" strokeWidth="2" />
            </g>
          )}

          {clothing === 'chaleco' && (
            <g>
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#f8fafc"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Tweed vest */}
              <path
                d="M 45 196 L 62 150 L 88 154 L 84 196 Z M 155 196 L 138 150 L 112 154 L 116 196 Z"
                fill="#854d0e"
                stroke={outlineColor}
                strokeWidth="3.5"
              />
              <circle cx="100" cy="168" r="2.5" fill="#facc15" stroke={outlineColor} strokeWidth="1" />
              <circle cx="100" cy="182" r="2.5" fill="#facc15" stroke={outlineColor} strokeWidth="1" />
            </g>
          )}

          {clothing === 'poncho' && (
            <g>
              <polygon
                points="100,138 165,196 35,196"
                fill="#059669"
                stroke={outlineColor}
                strokeWidth="4"
              />
              <polygon points="100,146 150,192 50,192" fill="#f59e0b" />
              <polygon points="100,154 135,188 65,188" fill="#dc2626" />
            </g>
          )}

          {clothing === 'cuello-alto' && (
            <g>
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#09090b"
                stroke={outlineColor}
                strokeWidth="4"
              />
              <ellipse cx="100" cy="138" rx="26" ry="10" fill="#18181b" stroke={outlineColor} strokeWidth="3.5" />
            </g>
          )}

          {clothing === 'peto' && (
            <g>
              <path
                d="M 42 196 C 45 158, 62 142, 100 142 C 138 142, 155 158, 158 196 Z"
                fill="#e2e8f0"
                stroke={outlineColor}
                strokeWidth="4"
              />
              {/* Denim front */}
              <polygon points="70,160 130,160 134,196 66,196" fill="#1d4ed8" stroke={outlineColor} strokeWidth="3" />
              {/* Straps */}
              <line x1="72" y1="142" x2="72" y2="162" stroke="#1e40af" strokeWidth="6" />
              <line x1="128" y1="142" x2="128" y2="162" stroke="#1e40af" strokeWidth="6" />
              <circle cx="72" cy="162" r="3" fill="#eab308" stroke={outlineColor} strokeWidth="1" />
              <circle cx="128" cy="162" r="3" fill="#eab308" stroke={outlineColor} strokeWidth="1" />
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
            fill="url(#halftone)"
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

        {/* 9. PAWS (Holding position) */}
        <g id="paws">
          <ellipse cx="62" cy="166" rx="10" ry="7" fill={furColor} stroke={outlineColor} strokeWidth="3" />
          <line x1="58" y1="168" x2="58" y2="162" stroke={outlineColor} strokeWidth="1.5" />
          <line x1="62" y1="169" x2="62" y2="162" stroke={outlineColor} strokeWidth="1.5" />

          <ellipse cx="138" cy="166" rx="10" ry="7" fill={furColor} stroke={outlineColor} strokeWidth="3" />
          <line x1="138" y1="169" x2="138" y2="162" stroke={outlineColor} strokeWidth="1.5" />
          <line x1="142" y1="168" x2="142" y2="162" stroke={outlineColor} strokeWidth="1.5" />
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
              <path d="M 62 60 C 62 26, 138 26, 138 60 Z" fill="url(#halftone)" />
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
