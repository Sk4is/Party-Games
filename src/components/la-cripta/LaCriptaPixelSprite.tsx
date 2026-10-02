import React, { useEffect, useRef, useState } from 'react';
import { CriptaCharacterId, CriptaSpriteAnimationState } from '../../types/laCripta';

interface LaCriptaPixelSpriteProps {
  characterId: CriptaCharacterId;
  animationState?: CriptaSpriteAnimationState;
  size?: 'sm' | 'md' | 'lg' | 'hud';
  isHovered?: boolean;
  classResource?: number;
  className?: string;
}

interface AlchemistBubbleConfig {
  baseX: number;
  bottomY: number;
  topY: number;
  durationSec: number;
  phaseOffset: number;
  driftAmpX: number;
  driftFreq: number;
  color: string;
  coreColor: string;
}

const ALCHEMIST_BUBBLE_CONFIGS: AlchemistBubbleConfig[] = [
  // Main green potion flask in hand (liquid spans y=29..32, neck up to y=20)
  {
    baseX: 37.5,
    bottomY: 31.4,
    topY: 22.8,
    durationSec: 1.95,
    phaseOffset: 0.0,
    driftAmpX: 0.85,
    driftFreq: 4.2,
    color: '#A8F0C2',
    coreColor: '#FFFFFF',
  },
  {
    baseX: 39.8,
    bottomY: 31.6,
    topY: 23.2,
    durationSec: 2.35,
    phaseOffset: 0.92,
    driftAmpX: 0.75,
    driftFreq: 3.6,
    color: '#5CE6A0',
    coreColor: '#D4FFEA',
  },
  {
    baseX: 38.6,
    bottomY: 31.2,
    topY: 22.4,
    durationSec: 1.72,
    phaseOffset: 1.54,
    driftAmpX: 0.65,
    driftFreq: 5.0,
    color: '#D4FFEA',
    coreColor: '#FFFFFF',
  },
  // Secondary belt vial bubble (emerald vial at x=24..25, y=38..41)
  {
    baseX: 24.4,
    bottomY: 40.6,
    topY: 37.6,
    durationSec: 2.1,
    phaseOffset: 0.45,
    driftAmpX: 0.35,
    driftFreq: 3.8,
    color: '#A8F0C2',
    coreColor: '#FFFFFF',
  },
];

/**
 * 60 FPS Runtime Potion Bubble Animator for Alquimista.
 * Uses requestAnimationFrame to interpolate SVG bubble position, horizontal drift,
 * subtle scale growth, and surface pop/fade directly on DOM refs with ZERO React state re-renders.
 */
const AlchemistPotionBubbles60Fps: React.FC = () => {
  const bubbleRefs = useRef<Array<SVGGElement | null>>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      ALCHEMIST_BUBBLE_CONFIGS.forEach((cfg, idx) => {
        const node = bubbleRefs.current[idx];
        if (!node) return;
        const midY = (cfg.bottomY + cfg.topY) * 0.5;
        node.setAttribute('transform', `translate(${cfg.baseX.toFixed(2)}, ${midY.toFixed(2)}) scale(1)`);
        node.setAttribute('opacity', '0.85');
      });
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;

      for (let i = 0; i < ALCHEMIST_BUBBLE_CONFIGS.length; i++) {
        const node = bubbleRefs.current[i];
        if (!node) continue;
        const cfg = ALCHEMIST_BUBBLE_CONFIGS[i];
        const cycle = ((elapsedSec + cfg.phaseOffset) % cfg.durationSec) / cfg.durationSec;

        // Smooth rise from bottom of liquid to top surface
        const easeProgress = 1 - Math.pow(1 - cycle, 1.35);
        const y = cfg.bottomY - (cfg.bottomY - cfg.topY) * easeProgress;
        const x =
          cfg.baseX +
          Math.sin(cycle * Math.PI * cfg.driftFreq + cfg.phaseOffset * 3.1) *
            cfg.driftAmpX *
            Math.sin(cycle * Math.PI);

        // Subtle scale expansion + pop near surface
        const scale =
          cycle < 0.85
            ? 0.72 + cycle * 0.42
            : 1.08 + (cycle - 0.85) * 1.4;

        // Fade in smoothly at spawn, pop/fade out at surface
        const alpha =
          cycle < 0.14
            ? cycle / 0.14
            : cycle > 0.82
            ? Math.max(0, 1 - (cycle - 0.82) / 0.18)
            : 0.92;

        node.setAttribute(
          'transform',
          `translate(${x.toFixed(2)}, ${y.toFixed(2)}) scale(${scale.toFixed(2)})`
        );
        node.setAttribute('opacity', alpha.toFixed(2));
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <g pointerEvents="none">
      {ALCHEMIST_BUBBLE_CONFIGS.map((cfg, idx) => (
        <g
          key={idx}
          ref={(el) => {
            bubbleRefs.current[idx] = el;
          }}
          transform={`translate(${cfg.baseX}, ${cfg.bottomY}) scale(0.8)`}
          opacity="0"
        >
          <rect x="-0.75" y="-0.75" width="1.5" height="1.5" fill={cfg.color} />
          <rect x="-0.4" y="-0.4" width="0.7" height="0.7" fill={cfg.coreColor} />
        </g>
      ))}
    </g>
  );
};

/**
 * 32-bit inspired fantasy pixel-art character portraits (48x48 deliberate pixel grid).
 * Designed with strong silhouettes, 2-3 shading levels per material, recognizable hands
 * and facial features, controlled rim lighting, and restrained class-specific idle life.
 */
export const LaCriptaPixelSprite: React.FC<LaCriptaPixelSpriteProps> = ({
  characterId,
  animationState = 'idle' as CriptaSpriteAnimationState,
  size = 'md',
  isHovered = false,
  classResource = 0,
  className = '',
}) => {
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 280);
    return () => clearTimeout(t);
  }, [characterId]);

  const effectiveState: CriptaSpriteAnimationState = entering
    ? 'enter'
    : (animationState as CriptaSpriteAnimationState);

  // 10-15% larger portrait scale inside selection slots & HUD so characters feel like
  // compact playable character portraits rather than small floating inventory icons.
  const sizeClass =
    size === 'sm'
      ? 'w-14 h-14'
      : size === 'hud'
      ? 'w-[4.25rem] h-[4.25rem] sm:w-[4.75rem] sm:h-[4.75rem]'
      : size === 'lg'
      ? 'w-32 h-32 sm:w-36 sm:h-36'
      : 'w-24 h-24 sm:w-28 sm:h-28';

  const wrapperAnimClass =
    effectiveState === 'enter'
      ? 'animate-cripta-sprite-enter'
      : effectiveState === 'hit' || effectiveState === 'debuff'
      ? 'animate-cripta-sprite-hit'
      : effectiveState === 'heal' || effectiveState === 'buff'
      ? 'animate-cripta-sprite-heal'
      : effectiveState === 'attack'
      ? 'animate-cripta-sprite-attack'
      : effectiveState === 'cast'
      ? 'animate-cripta-sprite-cast'
      : effectiveState === 'defend'
      ? 'animate-cripta-sprite-defend'
      : effectiveState === 'revive'
      ? 'animate-cripta-sprite-revive'
      : '';

  const renderSpritePixels = () => {
    switch (characterId) {
      // =======================================================================
      // 1. CABALLERO — Broad battered knight, horned great-helm, visor eye glow,
      //    segmented pauldrons, leather strap, dented shield with emblem, broadsword
      //    Idle life: subtle 1px torso breathing + occasional metal glint
      // =======================================================================
      case 'caballero':
        return (
          <g>
            {/* Dark Crimson Cloak Backdrop Behind Shoulders (tiny cloth sway) */}
            <g className="animate-cripta-knight-cloth">
              <rect x="8" y="21" width="30" height="25" fill="#100C14" />
              <rect x="9" y="22" width="28" height="24" fill="#471220" />
              <rect x="10" y="23" width="26" height="22" fill="#63192C" />
            </g>

            {/* Heavy Grounded Breathing Torso, Pauldrons & Horned Great-Helm */}
            <g className="animate-cripta-knight-breathe">
              {/* Segmented Steel Pauldrons (1px shoulder/armor movement) */}
              <g className="animate-cripta-knight-shoulder">
                {/* Left Pauldron */}
                <rect x="6" y="21" width="11" height="11" fill="#100C14" />
                <rect x="7" y="22" width="9" height="9" fill="#363E4D" />
                <rect x="7" y="22" width="8" height="4" fill="#58637A" />
                <rect x="8" y="22" width="6" height="2" fill="#8A96AD" />
                <rect x="7" y="26" width="9" height="1" fill="#1F242E" />
                {/* Battle scratch on left pauldron */}
                <rect x="9" y="24" width="3" height="1" fill="#1F242E" />
                <rect x="10" y="25" width="2" height="1" fill="#B8C4D9" />

                {/* Right Pauldron */}
                <rect x="29" y="21" width="11" height="12" fill="#100C14" />
                <rect x="30" y="22" width="9" height="10" fill="#363E4D" />
                <rect x="30" y="22" width="8" height="4" fill="#58637A" />
                <rect x="31" y="22" width="6" height="2" fill="#8A96AD" />
                <rect x="30" y="26" width="9" height="1" fill="#1F242E" />
                <rect x="37" y="22" width="2" height="1" fill="#D0DBE8" />
              </g>

              {/* Breastplate & Crimson Tabard with Folds */}
              <rect x="14" y="23" width="18" height="23" fill="#100C14" />
              <rect x="15" y="24" width="16" height="10" fill="#464F61" />
              <rect x="16" y="24" width="14" height="4" fill="#69758C" />
              {/* Tabard Cloth Folds (3 shading levels + tiny cloth movement) */}
              <g className="animate-cripta-knight-cloth">
                <rect x="15" y="31" width="16" height="15" fill="#571525" />
                <rect x="17" y="31" width="12" height="15" fill="#822037" />
                <rect x="19" y="32" width="3" height="14" fill="#A82E49" />
                <rect x="24" y="32" width="2" height="14" fill="#571525" />
                {/* Golden Tabard Trim */}
                <rect x="22" y="31" width="2" height="15" fill="#C98736" />
                <rect x="22" y="31" width="1" height="15" fill="#E7A54A" />
              </g>

              {/* Diagonal Leather Baldric Strap & Brass Buckle */}
              <rect x="15" y="24" width="3" height="3" fill="#4A2E1B" />
              <rect x="17" y="26" width="3" height="3" fill="#5E3B24" />
              <rect x="19" y="28" width="4" height="3" fill="#4A2E1B" />
              <rect x="22" y="30" width="3" height="3" fill="#5E3B24" />
              <rect x="25" y="32" width="3" height="3" fill="#382214" />
              {/* Brass Buckle */}
              <rect x="19" y="27" width="3" height="3" fill="#E7A54A" />
              <rect x="20" y="28" width="1" height="1" fill="#1F242E" />
              <rect x="19" y="27" width="1" height="1" fill="#FFF3D1" />

              {/* Horned Great-Helm */}
              {/* Left Horn (3-tone bone/ivory) */}
              <rect x="7" y="6" width="5" height="11" fill="#100C14" />
              <rect x="8" y="7" width="3" height="5" fill="#E6DAC3" />
              <rect x="8" y="10" width="4" height="5" fill="#C4B293" />
              <rect x="10" y="13" width="3" height="3" fill="#968466" />
              <rect x="8" y="7" width="1" height="2" fill="#FFFDF7" />
              <rect x="11" y="13" width="3" height="4" fill="#C98736" />

              {/* Right Horn (Battered / Chipped tip) */}
              <rect x="34" y="8" width="5" height="9" fill="#100C14" />
              <rect x="35" y="9" width="3" height="3" fill="#E6DAC3" />
              <rect x="34" y="11" width="4" height="4" fill="#C4B293" />
              <rect x="33" y="13" width="3" height="3" fill="#968466" />
              <rect x="32" y="13" width="3" height="4" fill="#C98736" />

              {/* Helmet Dome & Faceplate */}
              <rect x="13" y="6" width="20" height="18" fill="#100C14" />
              <rect x="14" y="7" width="18" height="16" fill="#363E4D" />
              <rect x="15" y="7" width="16" height="6" fill="#58637A" />
              <rect x="16" y="7" width="13" height="3" fill="#7D8BA3" />
              <rect x="17" y="7" width="7" height="1" fill="#B8C4D9" />
              {/* Battle dent on brow */}
              <rect x="26" y="9" width="3" height="1" fill="#1F242E" />
              <rect x="27" y="10" width="2" height="1" fill="#9BA7BD" />

              {/* Bronze Nasal Cross & Crown Trim */}
              <rect x="22" y="7" width="2" height="16" fill="#9E6825" />
              <rect x="22" y="7" width="1" height="15" fill="#E7A54A" />
              <rect x="14" y="12" width="18" height="2" fill="#C98736" />
              <rect x="15" y="12" width="16" height="1" fill="#E7A54A" />

              {/* Deep Helmet Visor Slit & Glowing Eyes + Rare Visor Highlight & Helmet Glint */}
              <rect x="15" y="14" width="16" height="4" fill="#09070D" />
              <rect x="22" y="14" width="2" height="4" fill="#C98736" />
              <rect x="16" y="15" width="5" height="2" fill="#9E6825" />
              <rect x="25" y="15" width="5" height="2" fill="#9E6825" />
              <rect x="17" y="15" width="3" height="2" fill="#E7A54A" />
              <rect x="26" y="15" width="3" height="2" fill="#E7A54A" />
              <rect x="18" y="15" width="1" height="1" fill="#FFF8E7" />
              <rect x="27" y="15" width="1" height="1" fill="#FFF8E7" />
              {/* Rare Eye/Visor Highlight */}
              <g className="animate-cripta-knight-visor-glint">
                <rect x="17" y="15" width="2" height="1" fill="#FFFFFF" />
                <rect x="26" y="15" width="2" height="1" fill="#FFFFFF" />
              </g>
              {/* Occasional Metallic Glint Across Helmet Brow */}
              <g className="animate-cripta-knight-helmet-glint">
                <rect x="18" y="8" width="4" height="1" fill="#FFFFFF" />
                <rect x="22" y="9" width="2" height="1" fill="#FFF3D1" />
              </g>

              {/* Lower Faceplate Vent Grate & Rivets */}
              <rect x="15" y="19" width="16" height="4" fill="#2A303D" />
              <rect x="17" y="20" width="1" height="2" fill="#09070D" />
              <rect x="19" y="20" width="1" height="2" fill="#09070D" />
              <rect x="26" y="20" width="1" height="2" fill="#09070D" />
              <rect x="28" y="20" width="1" height="2" fill="#09070D" />
            </g>

            {/* Upright Broadsword & Recognizable Steel-Gauntleted Hand (Right) */}
            <g>
              {/* Sword Blade (3-tone steel + fuller + glint) */}
              <rect x="37" y="6" width="6" height="25" fill="#100C14" />
              <rect x="38" y="7" width="4" height="23" fill="#58637A" />
              <rect x="38" y="7" width="2" height="23" fill="#8A96AD" />
              <rect x="38" y="7" width="1" height="18" fill="#C5D1E3" />
              {/* Blade fuller groove */}
              <rect x="40" y="10" width="1" height="17" fill="#2A303D" />
              {/* Blade notch */}
              <rect x="41" y="15" width="2" height="1" fill="#100C14" />
              {/* Animated Metal Glint Pixels */}
              <g className="animate-cripta-glint">
                <rect x="38" y="9" width="2" height="2" fill="#FFFFFF" />
                <rect x="39" y="11" width="1" height="2" fill="#FFF3D1" />
              </g>

              {/* Bronze Crossguard */}
              <rect x="34" y="29" width="12" height="4" fill="#100C14" />
              <rect x="35" y="30" width="10" height="2" fill="#C98736" />
              <rect x="36" y="30" width="8" height="1" fill="#E7A54A" />
              <rect x="35" y="30" width="1" height="1" fill="#FFF3D1" />

              {/* Gauntleted Right Hand Gripping Hilt */}
              <rect x="36" y="32" width="7" height="7" fill="#100C14" />
              <rect x="37" y="33" width="5" height="5" fill="#464F61" />
              {/* Gauntlet fingers */}
              <rect x="37" y="33" width="4" height="1" fill="#8A96AD" />
              <rect x="37" y="35" width="4" height="1" fill="#69758C" />
              <rect x="37" y="37" width="4" height="1" fill="#464F61" />
              {/* Heavy Pommel */}
              <rect x="37" y="39" width="6" height="4" fill="#100C14" />
              <rect x="38" y="40" width="4" height="2" fill="#E7A54A" />
            </g>

            {/* Battered Tower Shield with Rim, Notches & Sun-Cross Emblem (Shifts slightly with body weight) */}
            <g className="animate-cripta-knight-shield">
              <rect x="3" y="21" width="16" height="25" fill="#100C14" />
              {/* Bronze Shield Rim */}
              <rect x="4" y="22" width="14" height="23" fill="#9E6825" />
              <rect x="4" y="22" width="13" height="2" fill="#E7A54A" />
              <rect x="4" y="22" width="2" height="22" fill="#E7A54A" />
              <rect x="4" y="22" width="2" height="2" fill="#FFF3D1" />
              {/* Inner Shield Face (Dark Iron & Wood) */}
              <rect x="6" y="24" width="10" height="19" fill="#252B36" />
              <rect x="6" y="24" width="5" height="19" fill="#343C4A" />
              {/* Battle Notches & Scratches on Shield */}
              <rect x="16" y="27" width="2" height="2" fill="#100C14" />
              <rect x="14" y="36" width="3" height="1" fill="#100C14" />
              <rect x="13" y="37" width="3" height="1" fill="#69758C" />
              {/* Raised Golden Sun-Cross Shield Emblem */}
              <rect x="10" y="27" width="2" height="13" fill="#C98736" />
              <rect x="7" y="32" width="8" height="2" fill="#C98736" />
              <rect x="9" y="31" width="4" height="4" fill="#E7A54A" />
              <rect x="10" y="32" width="2" height="2" fill="#FFF3D1" />
            </g>
          </g>
        );

      // =======================================================================
      // 2. MAGO — Crooked folded wizard hat, rune buckle, partially visible
      //    mysterious face with beard & glowing cyan eyes, layered robes,
      //    amulet, hand gripping gnarled wood staff with pulsing arcane crystal
      // =======================================================================
      case 'mago':
        return (
          <g>
            {/* Layered Arcane Robes & Mantle (Breathing + Tiny Secondary Robe Movement) */}
            <g className="animate-cripta-sprite-idle">
              <rect x="9" y="24" width="26" height="22" fill="#100C14" />
              <rect x="10" y="25" width="24" height="21" fill="#25153D" />
              {/* Robe Folds (3 levels of violet + subtle secondary sway) */}
              <g className="animate-cripta-mage-robe">
                <rect x="12" y="25" width="20" height="21" fill="#3B2361" />
                <rect x="14" y="26" width="5" height="20" fill="#533385" />
                <rect x="25" y="26" width="4" height="20" fill="#533385" />
                <rect x="19" y="28" width="6" height="18" fill="#25153D" />
                {/* Gold Embroidered Stole & Trim */}
                <rect x="13" y="25" width="2" height="21" fill="#C98736" />
                <rect x="13" y="25" width="1" height="21" fill="#E7A54A" />
                <rect x="29" y="25" width="2" height="21" fill="#C98736" />
                <rect x="29" y="25" width="1" height="21" fill="#E7A54A" />
              </g>

              {/* High Arcane Collar */}
              <rect x="10" y="20" width="24" height="6" fill="#100C14" />
              <rect x="11" y="21" width="5" height="4" fill="#533385" />
              <rect x="28" y="21" width="5" height="4" fill="#533385" />
              <rect x="11" y="21" width="4" height="1" fill="#7852B3" />
              <rect x="29" y="21" width="4" height="1" fill="#7852B3" />

              {/* Partially Visible Mysterious Face, Glowing Eyes & Silver Beard */}
              <rect x="14" y="15" width="16" height="10" fill="#09070D" />
              {/* Mysterious Nose Bridge & Cheek Shadow */}
              <rect x="21" y="19" width="2" height="3" fill="#705B53" />
              <rect x="21" y="19" width="1" height="2" fill="#998176" />
              {/* Flowing Silver-Grey Wizard Beard (3 tones) */}
              <rect x="16" y="22" width="12" height="7" fill="#5A6075" />
              <rect x="17" y="22" width="10" height="6" fill="#8A92AB" />
              <rect x="19" y="23" width="6" height="7" fill="#BDC5DE" />
              <rect x="20" y="23" width="4" height="6" fill="#D5DCEF" />
              <rect x="21" y="29" width="2" height="3" fill="#8A92AB" />

              {/* Arcane Pendant Ornament on Chest */}
              <rect x="20" y="32" width="4" height="4" fill="#100C14" />
              <rect x="21" y="33" width="2" height="2" fill="#E7A54A" />
              <rect x="21" y="33" width="1" height="1" fill="#69A8A5" />

              {/* Expressive Glowing Cyan Eyes (Subtly brighten/dim + blink) */}
              <g className="animate-cripta-sprite-blink">
                <g className="animate-cripta-mage-eyes">
                  <rect x="15" y="17" width="5" height="3" fill="#2A5E5C" />
                  <rect x="24" y="17" width="5" height="3" fill="#2A5E5C" />
                  <rect x="16" y="17" width="3" height="2" fill="#69A8A5" />
                  <rect x="25" y="17" width="3" height="2" fill="#69A8A5" />
                  <rect x="17" y="17" width="1" height="1" fill="#FFFFFF" />
                  <rect x="26" y="17" width="1" height="1" fill="#FFFFFF" />
                </g>
              </g>
            </g>

            {/* Oversized Crooked Wizard Hat with Folds & Moving Hat Tip */}
            <g className="animate-cripta-sprite-cloth">
              {/* Wide Sweeping Hat Brim */}
              <rect x="4" y="14" width="34" height="4" fill="#100C14" />
              <rect x="5" y="15" width="32" height="2" fill="#3B2361" />
              <rect x="7" y="14" width="28" height="2" fill="#533385" />
              <rect x="9" y="14" width="20" height="1" fill="#7852B3" />

              {/* Hat Cone with Creased Folds */}
              <rect x="11" y="9" width="20" height="5" fill="#100C14" />
              <rect x="12" y="9" width="18" height="5" fill="#3B2361" />
              <rect x="13" y="9" width="12" height="4" fill="#533385" />
              {/* Fold crease */}
              <rect x="16" y="10" width="8" height="1" fill="#25153D" />

              {/* Upper Crooked Tip Bending Right (Hat tip slightly moves) */}
              <g className="animate-cripta-mage-hat">
                <rect x="14" y="5" width="16" height="4" fill="#100C14" />
                <rect x="15" y="5" width="14" height="4" fill="#533385" />
                <rect x="16" y="5" width="10" height="2" fill="#7852B3" />
                <rect x="19" y="2" width="13" height="3" fill="#100C14" />
                <rect x="20" y="3" width="11" height="2" fill="#68429E" />
                <rect x="21" y="3" width="6" height="1" fill="#9B72CF" />
                <rect x="29" y="4" width="5" height="4" fill="#100C14" />
                <rect x="30" y="5" width="3" height="2" fill="#3B2361" />
              </g>

              {/* Golden Hat Band & Arcane Gem Buckle */}
              <rect x="12" y="12" width="18" height="2" fill="#9E6825" />
              <rect x="13" y="12" width="16" height="1" fill="#E7A54A" />
              <rect x="19" y="10" width="6" height="4" fill="#E7A54A" />
              <rect x="20" y="11" width="4" height="2" fill="#69A8A5" />
              <rect x="21" y="11" width="1" height="1" fill="#FFFFFF" />
            </g>

            {/* Gnarled Wooden Staff, Recognizable Hand & Softly Pulsing Arcane Crystal */}
            <g>
              {/* Staff Shaft (3-tone wood grain) */}
              <rect x="37" y="16" width="5" height="30" fill="#100C14" />
              <rect x="38" y="17" width="3" height="29" fill="#4A2C1A" />
              <rect x="38" y="17" width="2" height="29" fill="#6E4429" />
              <rect x="38" y="19" width="1" height="24" fill="#915E3D" />

              {/* Recognizable Hand Gripping Staff */}
              <rect x="35" y="29" width="7" height="6" fill="#100C14" />
              <rect x="36" y="30" width="5" height="4" fill="#998176" />
              <rect x="36" y="30" width="4" height="1" fill="#C4A89B" />
              <rect x="36" y="32" width="4" height="1" fill="#C4A89B" />

              {/* Golden Staff Head Cradle */}
              <rect x="34" y="13" width="11" height="5" fill="#100C14" />
              <rect x="35" y="14" width="9" height="3" fill="#C98736" />
              <rect x="36" y="14" width="7" height="1" fill="#E7A54A" />
              <rect x="34" y="10" width="2" height="5" fill="#E7A54A" />
              <rect x="43" y="10" width="2" height="5" fill="#C98736" />

              {/* Softly Pulsing Faceted Arcane Crystal */}
              <g className="animate-cripta-mage-crystal">
                <rect x="36" y="5" width="7" height="8" fill="#100C14" />
                <rect x="37" y="6" width="5" height="6" fill="#7852B3" />
                <rect x="38" y="6" width="3" height="5" fill="#9B72CF" />
                <rect x="38" y="7" width="2" height="3" fill="#69A8A5" />
                <rect x="38" y="7" width="1" height="2" fill="#FFFFFF" />
              </g>
              {/* Restrained 60fps Magical Motes Orbiting the Staff */}
              <g className="animate-cripta-mage-mote-a">
                <rect x="33" y="6" width="1.8" height="1.8" fill="#69A8A5" />
                <rect x="33.4" y="6.4" width="0.8" height="0.8" fill="#FFFFFF" />
              </g>
              <g className="animate-cripta-mage-mote-b">
                <rect x="44" y="5" width="1.6" height="1.6" fill="#E7A54A" />
                <rect x="44.3" y="5.3" width="0.8" height="0.8" fill="#FFF8E7" />
              </g>
            </g>
          </g>
        );

      // =======================================================================
      // 3. PÍCARO — Sneaky asymmetric pose, deep hood, visible brow & slanted
      //    eyes above crimson scarf/mask, leather shoulder pad, straps, belt
      //    pouches, gloved hand holding curved dagger with metallic highlight
      // =======================================================================
      case 'picaro':
        return (
          <g>
            {/* Asymmetric Rogue Cloak & Tunic (Subtle breathing + tiny alert weight shift) */}
            <g className="animate-cripta-rogue-stance">
              <rect x="11" y="24" width="24" height="22" fill="#100C14" />
              <rect x="12" y="25" width="22" height="21" fill="#1E1D2B" />
              <rect x="14" y="26" width="18" height="20" fill="#2B293D" />
              <rect x="16" y="27" width="6" height="19" fill="#3B3852" />

              {/* Asymmetric Left Studded Leather Shoulder Guard */}
              <rect x="8" y="23" width="11" height="9" fill="#100C14" />
              <rect x="9" y="24" width="9" height="7" fill="#42291B" />
              <rect x="10" y="24" width="7" height="4" fill="#633F2A" />
              <rect x="11" y="24" width="5" height="2" fill="#85573C" />
              {/* Brass studs */}
              <rect x="11" y="26" width="1" height="1" fill="#E7A54A" />
              <rect x="15" y="26" width="1" height="1" fill="#E7A54A" />

              {/* Diagonal Leather Bandolier, Belt & Coin Pouch */}
              <rect x="14" y="27" width="3" height="3" fill="#42291B" />
              <rect x="17" y="30" width="3" height="3" fill="#5E3B24" />
              <rect x="20" y="33" width="3" height="3" fill="#42291B" />
              <rect x="23" y="36" width="3" height="3" fill="#5E3B24" />
              {/* Small throwing knife hilts on chest strap */}
              <rect x="18" y="28" width="2" height="3" fill="#9FA8BA" />
              <rect x="21" y="30" width="2" height="3" fill="#9FA8BA" />
              {/* Waist Belt & Brass Buckle */}
              <rect x="12" y="39" width="21" height="3" fill="#382214" />
              <rect x="20" y="38" width="4" height="4" fill="#E7A54A" />
              <rect x="21" y="39" width="2" height="2" fill="#100C14" />
              {/* Leather Pouch on Hip */}
              <rect x="13" y="38" width="5" height="6" fill="#100C14" />
              <rect x="14" y="39" width="3" height="4" fill="#6E4730" />
              <rect x="15" y="39" width="2" height="2" fill="#916042" />
              <rect x="15" y="40" width="1" height="1" fill="#E7A54A" />
            </g>

            {/* Deep Pointed Hood with Folds, Alert Head Movement & Blinking Eyes */}
            <g className="animate-cripta-rogue-head">
              <rect x="11" y="6" width="22" height="16" fill="#100C14" />
              <g className="animate-cripta-sprite-cloth">
                <rect x="9" y="5" width="6" height="4" fill="#100C14" />
                <rect x="10" y="6" width="5" height="3" fill="#252436" />
              </g>
              <rect x="12" y="7" width="20" height="14" fill="#252436" />
              <rect x="13" y="7" width="16" height="5" fill="#383652" />
              <rect x="15" y="7" width="10" height="2" fill="#504D73" />

              {/* Visible Upper Face & Brow Between Hood and Scarf */}
              <rect x="14" y="11" width="16" height="9" fill="#09070D" />
              <rect x="15" y="12" width="14" height="6" fill="#8C6E5D" />
              <rect x="16" y="12" width="12" height="3" fill="#B3907D" />
              {/* Subtle brow scar */}
              <rect x="17" y="12" width="1" height="3" fill="#5E4336" />

              {/* Mischievous Slanted Eyes (Blink Occasionally) */}
              <g className="animate-cripta-sprite-blink">
                <rect x="16" y="14" width="5" height="3" fill="#100C14" />
                <rect x="23" y="14" width="5" height="3" fill="#100C14" />
                <rect x="17" y="15" width="3" height="2" fill="#E7A54A" />
                <rect x="24" y="15" width="3" height="2" fill="#E7A54A" />
                <rect x="18" y="15" width="1" height="1" fill="#FFF8E7" />
                <rect x="25" y="15" width="1" height="1" fill="#FFF8E7" />
              </g>

              {/* Wrapped Crimson Scarf / Mask & Billowing Tail */}
              <g>
                <rect x="12" y="18" width="20" height="7" fill="#100C14" />
                <rect x="13" y="19" width="18" height="5" fill="#6E192E" />
                <rect x="14" y="19" width="16" height="3" fill="#9E2442" />
                <rect x="15" y="19" width="12" height="1" fill="#CF385D" />
                <rect x="16" y="22" width="12" height="1" fill="#470F1D" />

                {/* Flowing Scarf Tail on Left */}
                <g className="animate-cripta-scarf-wave">
                  <rect x="4" y="20" width="9" height="6" fill="#100C14" />
                  <rect x="5" y="21" width="8" height="4" fill="#9E2442" />
                  <rect x="6" y="21" width="6" height="2" fill="#CF385D" />
                  <rect x="3" y="24" width="6" height="5" fill="#100C14" />
                  <rect x="4" y="25" width="4" height="3" fill="#6E192E" />
                </g>
              </g>
            </g>

            {/* Recognizable Gloved Hand & Curved Dagger with Occasional Light Glint */}
            <g className="animate-cripta-rogue-dagger">
              {/* Curved Assassin Blade */}
              <rect x="35" y="11" width="7" height="16" fill="#100C14" />
              <rect x="37" y="10" width="5" height="4" fill="#100C14" />
              <rect x="36" y="14" width="5" height="12" fill="#69758C" />
              <rect x="37" y="12" width="3" height="13" fill="#9FA8BA" />
              <rect x="38" y="11" width="2" height="11" fill="#D9E0EC" />
              {/* Venom tip & metallic glint */}
              <rect x="39" y="9" width="2" height="3" fill="#5EA87A" />
              <rect x="39" y="9" width="1" height="1" fill="#A8F0C2" />
              <g className="animate-cripta-blade-glint">
                <rect x="38" y="13" width="2" height="4" fill="#FFFFFF" />
                <rect x="37" y="18" width="1" height="3" fill="#FFF3D1" />
              </g>

              {/* Dagger Crossguard */}
              <rect x="33" y="25" width="9" height="3" fill="#100C14" />
              <rect x="34" y="26" width="7" height="2" fill="#E7A54A" />
              <rect x="35" y="26" width="3" height="1" fill="#FFF3D1" />

              {/* Fingerless Gloved Hand Holding Hilt */}
              <rect x="34" y="28" width="7" height="6" fill="#100C14" />
              <rect x="35" y="29" width="5" height="4" fill="#252436" />
              <rect x="35" y="29" width="3" height="2" fill="#B3907D" />
              <rect x="36" y="34" width="3" height="3" fill="#E7A54A" />
            </g>
          </g>
        );

      // =======================================================================
      // 4. CAZADOR — Rugged hood/hat texture, hawk feather, clear scarred face,
      //    bone/skull shoulder trophy, layered green/brown cloak, hand with crossbow
      // =======================================================================
      case 'cazador':
        return (
          <g>
            {/* Quiver & Fletched Bolts Behind Right Shoulder */}
            <rect x="29" y="8" width="7" height="14" fill="#100C14" />
            <rect x="30" y="12" width="5" height="9" fill="#4A2F1D" />
            <rect x="30" y="9" width="2" height="3" fill="#C93B5B" />
            <rect x="33" y="10" width="2" height="3" fill="#5EA87A" />

            {/* Layered Woodland Cloak & Quilted Leather Jerkin (Subtle breathing + cloak movement) */}
            <g className="animate-cripta-sprite-idle">
              <g className="animate-cripta-sprite-cloth">
                <rect x="8" y="23" width="28" height="23" fill="#100C14" />
                <rect x="9" y="24" width="26" height="22" fill="#1F2E23" />
                <rect x="11" y="25" width="22" height="21" fill="#2E4534" />
              </g>
              {/* Inner Brown Leather Jerkin & Straps */}
              <rect x="15" y="26" width="14" height="20" fill="#3D271A" />
              <rect x="16" y="27" width="12" height="19" fill="#593A27" />
              <rect x="18" y="27" width="3" height="19" fill="#754E36" />
              {/* Leather Chest Belt & Buckle */}
              <rect x="14" y="32" width="16" height="3" fill="#2B1B11" />
              <rect x="20" y="31" width="4" height="4" fill="#E7A54A" />
              <rect x="21" y="32" width="2" height="2" fill="#2B1B11" />

              {/* Bone / Beast-Skull Shoulder Trophy (Left Shoulder) */}
              <rect x="6" y="21" width="12" height="10" fill="#100C14" />
              <rect x="7" y="22" width="10" height="7" fill="#9E927E" />
              <rect x="8" y="22" width="8" height="5" fill="#C7B9A1" />
              <rect x="9" y="22" width="5" height="2" fill="#EDE3CE" />
              {/* Skull eye socket & fangs */}
              <rect x="9" y="24" width="2" height="2" fill="#100C14" />
              <rect x="8" y="27" width="2" height="3" fill="#EDE3CE" />
              <rect x="11" y="27" width="2" height="3" fill="#EDE3CE" />
              <rect x="14" y="27" width="2" height="2" fill="#C7B9A1" />
            </g>

            {/* Clear Rugged Hunter Face, Visual Scanning Head Movement & Feather Plume */}
            <g className="animate-cripta-hunter-scan">
              <rect x="14" y="13" width="16" height="12" fill="#100C14" />
              <rect x="15" y="14" width="14" height="10" fill="#8C6D58" />
              <rect x="16" y="14" width="12" height="7" fill="#B59077" />
              <rect x="18" y="14" width="7" height="3" fill="#D4AF94" />
              {/* Diagonal cheek scar */}
              <rect x="25" y="18" width="1" height="3" fill="#5E3D2B" />
              {/* Rugged Jaw Stubble & Mouth */}
              <rect x="16" y="20" width="12" height="4" fill="#4A382D" />
              <rect x="19" y="21" width="5" height="1" fill="#8C6D58" />

              {/* Keen Hunter Eyes */}
              <g className="animate-cripta-sprite-blink">
                <rect x="16" y="16" width="4" height="3" fill="#100C14" />
                <rect x="24" y="16" width="4" height="3" fill="#100C14" />
                <rect x="17" y="17" width="2" height="2" fill="#E7A54A" />
                <rect x="25" y="17" width="2" height="2" fill="#5EA87A" />
                <rect x="17" y="17" width="1" height="1" fill="#FFF8E7" />
                <rect x="25" y="17" width="1" height="1" fill="#FFF8E7" />
              </g>

              {/* Textured Hood/Stalker Hat & Hawk Feather Plume */}
              <g>
                {/* Wide Leather Hat Brim */}
                <rect x="9" y="11" width="26" height="4" fill="#100C14" />
                <rect x="10" y="12" width="24" height="2" fill="#3D271B" />
                <rect x="12" y="11" width="20" height="2" fill="#5E3D2B" />
                {/* Layered Green/Brown Hood Crown */}
                <rect x="12" y="6" width="20" height="6" fill="#100C14" />
                <rect x="13" y="7" width="18" height="5" fill="#293D30" />
                <rect x="14" y="7" width="14" height="3" fill="#3E5946" />
                <rect x="16" y="7" width="8" height="1" fill="#587A62" />

                {/* Swaying Hawk Feather Plume on Left */}
                <g className="animate-cripta-hunter-feather">
                  <rect x="7" y="3" width="6" height="9" fill="#100C14" />
                  <rect x="8" y="4" width="4" height="7" fill="#3E6B52" />
                  <rect x="8" y="4" width="3" height="5" fill="#5EA87A" />
                  <rect x="8" y="4" width="2" height="2" fill="#E7A54A" />
                  <rect x="9" y="3" width="1" height="1" fill="#FFF3D1" />
                </g>
              </g>
            </g>

            {/* Recognizable Hand & Heavy Ranger Crossbow (Slight bow movement + occasional hand adjustment) */}
            <g className="animate-cripta-hunter-bow">
              {/* Crossbow Steel Prod (Bow Arms) & Taut String */}
              <rect x="29" y="19" width="17" height="4" fill="#100C14" />
              <rect x="30" y="20" width="15" height="2" fill="#69758C" />
              <rect x="32" y="20" width="11" height="1" fill="#9FA8BA" />
              {/* Bowstring */}
              <rect x="31" y="23" width="13" height="1" fill="#D8C6A0" />

              {/* Hardwood Crossbow Stock */}
              <rect x="35" y="17" width="5" height="24" fill="#100C14" />
              <rect x="36" y="18" width="3" height="22" fill="#4A2F1D" />
              <rect x="36" y="18" width="2" height="20" fill="#6E472D" />

              {/* Loaded Golden-Tipped Quarrel (Bolt) */}
              <rect x="36" y="12" width="3" height="7" fill="#100C14" />
              <rect x="37" y="13" width="1" height="6" fill="#E7A54A" />
              <rect x="36" y="13" width="3" height="2" fill="#E7A54A" />
              <rect x="37" y="12" width="1" height="2" fill="#FFF8E7" />

              {/* Leather-Bracered Hand Gripping Stock (Occasional hand adjustment) */}
              <g className="animate-cripta-hunter-hand">
                <rect x="34" y="28" width="7" height="6" fill="#100C14" />
                <rect x="35" y="29" width="5" height="4" fill="#B59077" />
                <rect x="35" y="31" width="5" height="2" fill="#4A2F1D" />
              </g>
            </g>
          </g>
        );

      // =======================================================================
      // 5. CLÉRIGO — Dark-fantasy holy guardian / battle cleric: luminous golden
      //    halo circlet & high sanctuary hood, clear solemn face, layered
      //    vestments & mantle with gold trim, sacred sun-cross emblem, and
      //    iconic sacred censer-staff with warm divine glow accents
      // =======================================================================
      case 'clerigo':
        return (
          <g>
            {/* Radiant Divine Halo Ring Behind Hood */}
            <g className="animate-cripta-relic-glow">
              <rect x="11" y="2" width="22" height="2" fill="#E7A54A" />
              <rect x="14" y="1" width="16" height="1" fill="#FFF8E7" />
              <rect x="8" y="4" width="3" height="6" fill="#C98736" />
              <rect x="33" y="4" width="3" height="6" fill="#E7A54A" />
              <rect x="6" y="9" width="2" height="6" fill="#9E6825" />
              <rect x="36" y="9" width="2" height="6" fill="#C98736" />
              {/* Halo Sun Rays */}
              <rect x="21" y="0" width="2" height="2" fill="#FFF8E7" />
              <rect x="10" y="2" width="2" height="2" fill="#FFD166" />
              <rect x="32" y="2" width="2" height="2" fill="#FFD166" />
            </g>

            {/* Layered Holy Guardian Mantle, Pauldrons & Vestments */}
            <g className="animate-cripta-sprite-idle">
              {/* Outer Sanctuary Mantle (Ivory & Deep Crimson Lining) */}
              <rect x="6" y="22" width="32" height="24" fill="#100C14" />
              <rect x="7" y="23" width="30" height="23" fill="#4A1423" />
              <rect x="8" y="23" width="28" height="23" fill="#B8A990" />
              <rect x="10" y="24" width="24" height="22" fill="#DED1BA" />
              <rect x="12" y="24" width="20" height="22" fill="#F2E8D5" />

              {/* Golden Trimmed Shoulder Mantle Plates */}
              <rect x="6" y="21" width="10" height="9" fill="#100C14" />
              <rect x="7" y="22" width="8" height="7" fill="#D9CCB6" />
              <rect x="7" y="22" width="8" height="2" fill="#E7A54A" />
              <rect x="8" y="22" width="5" height="1" fill="#FFF8E7" />
              <rect x="7" y="27" width="8" height="2" fill="#C98736" />

              <rect x="28" y="21" width="10" height="9" fill="#100C14" />
              <rect x="29" y="22" width="8" height="7" fill="#E6DAC3" />
              <rect x="29" y="22" width="8" height="2" fill="#E7A54A" />
              <rect x="31" y="22" width="5" height="1" fill="#FFF8E7" />
              <rect x="29" y="27" width="8" height="2" fill="#C98736" />

              {/* Deep Burgundy & Gold Battle-Cleric Scapular / Tabard */}
              <rect x="16" y="24" width="12" height="22" fill="#571525" />
              <rect x="17" y="24" width="10" height="22" fill="#7D1E34" />
              <rect x="18" y="25" width="4" height="21" fill="#9E2843" />

              {/* Twin Gold-Embroidered Stoles (Small cloth secondary animation) */}
              <g className="animate-cripta-cleric-stole">
                <rect x="13" y="23" width="3" height="23" fill="#9E6825" />
                <rect x="14" y="23" width="2" height="23" fill="#E7A54A" />
                <rect x="28" y="23" width="3" height="23" fill="#9E6825" />
                <rect x="28" y="23" width="2" height="23" fill="#E7A54A" />
              </g>

              {/* Sacred Sun-Cross Emblem on Chest */}
              <rect x="21" y="27" width="2" height="11" fill="#E7A54A" />
              <rect x="18" y="30" width="8" height="2" fill="#E7A54A" />
              <rect x="20" y="29" width="4" height="4" fill="#FFD166" />
              <rect x="21" y="30" width="2" height="2" fill="#FFFDF7" />

              {/* High Sanctuary Hood, Golden Mitre-Circlet & Tiny Head Movement */}
              <g className="animate-cripta-cleric-head">
                <rect x="11" y="5" width="22" height="18" fill="#100C14" />
                <rect x="12" y="6" width="20" height="16" fill="#C7B89E" />
                <rect x="13" y="6" width="18" height="7" fill="#E6DAC3" />
                <rect x="15" y="6" width="14" height="3" fill="#FFFDF7" />
                {/* Golden Mitre-Circlet with Sun Jewel */}
                <rect x="12" y="9" width="20" height="3" fill="#9E6825" />
                <rect x="13" y="9" width="18" height="2" fill="#E7A54A" />
                <rect x="20" y="7" width="4" height="5" fill="#E7A54A" />
                <rect x="21" y="8" width="2" height="3" fill="#FFF8E7" />

                {/* Clear Battle-Cleric Face Underneath Hood */}
                <rect x="14" y="12" width="16" height="10" fill="#100C14" />
                <rect x="15" y="12" width="14" height="9" fill="#9E7B66" />
                <rect x="16" y="12" width="12" height="7" fill="#C49A80" />
                <rect x="17" y="12" width="9" height="3" fill="#DEB499" />
                {/* Warm divine rim light on right cheek from sacred censer */}
                <rect x="27" y="13" width="2" height="7" fill="#FFD166" />
                {/* Solemn Beard / Chin & Armored Gorget Collar */}
                <rect x="16" y="18" width="12" height="3" fill="#6E5648" />
                <rect x="19" y="18" width="6" height="1" fill="#9E7B66" />
                <rect x="14" y="21" width="16" height="2" fill="#E7A54A" />

                {/* Radiant Divine Eyes */}
                <g className="animate-cripta-sprite-blink">
                  <rect x="16" y="14" width="4" height="3" fill="#100C14" />
                  <rect x="24" y="14" width="4" height="3" fill="#100C14" />
                  <rect x="17" y="14" width="2" height="2" fill="#FFD166" />
                  <rect x="25" y="14" width="2" height="2" fill="#FFD166" />
                  <rect x="17" y="14" width="1" height="1" fill="#FFFFFF" />
                  <rect x="25" y="14" width="1" height="1" fill="#FFFFFF" />
                </g>
              </g>
            </g>

            {/* Iconic Sacred Sun-Staff & Swinging Reliquary Censer + Smooth 60fps Warm Golden Particles */}
            <g>
              {/* Staff Shaft */}
              <rect x="36" y="10" width="4" height="36" fill="#100C14" />
              <rect x="37" y="11" width="2" height="35" fill="#9E6825" />
              <rect x="37" y="11" width="1" height="35" fill="#E7A54A" />

              {/* Sun-Cross Staff Finial */}
              <rect x="33" y="4" width="10" height="8" fill="#100C14" />
              <rect x="34" y="5" width="8" height="6" fill="#E7A54A" />
              <rect x="36" y="3" width="4" height="10" fill="#FFD166" />
              <rect x="37" y="6" width="2" height="4" fill="#FFFFFF" />

              {/* Gauntleted Hand Gripping Staff */}
              <rect x="34" y="26" width="7" height="6" fill="#100C14" />
              <rect x="35" y="27" width="5" height="4" fill="#E6DAC3" />
              <rect x="35" y="27" width="4" height="2" fill="#E7A54A" />

              {/* Hanging Golden Censer & Divine Flame Glow */}
              <rect x="41" y="12" width="2" height="6" fill="#D8C6A0" />
              <rect x="39" y="17" width="7" height="10" fill="#100C14" />
              <rect x="40" y="18" width="5" height="8" fill="#C98736" />
              <g className="animate-cripta-relic-glow">
                <rect x="41" y="19" width="3" height="5" fill="#FFD166" />
                <rect x="42" y="20" width="1" height="3" fill="#FFFFFF" />
              </g>
              {/* Smooth 60fps Warm Golden Particles */}
              <g className="animate-cripta-cleric-mote-a">
                <rect x="43.5" y="15" width="1.8" height="1.8" fill="#FFD166" />
                <rect x="43.9" y="15.4" width="0.8" height="0.8" fill="#FFFFFF" />
              </g>
              <g className="animate-cripta-cleric-mote-b">
                <rect x="32.5" y="16" width="1.6" height="1.6" fill="#FFF8E7" />
                <rect x="32.8" y="16.3" width="0.8" height="0.8" fill="#FFD166" />
              </g>
            </g>
          </g>
        );

      // =======================================================================
      // 7. BÁRBARO — Broad compact silhouette, wild asymmetric hair, weathered
      //    scarred face, fur shoulder mantle, crude iron pauldron on one shoulder,
      //    thick belt with bone trophies, heavy two-handed battleaxe resting on
      //    shoulder, heavy breathing & subtle weapon-metal glint.
      //    High Fury (>=50): heavier breathing. Max Fury (>=100): subtle warm/red
      //    accent around weapon & eyes (NO giant permanent red aura).
      // =======================================================================
      case 'barbaro': {
        const isHighFury = classResource >= 50;
        const isMaxFury = classResource >= 100;
        const breatheClass = isHighFury
          ? 'animate-cripta-barbarian-breathe-heavy'
          : 'animate-cripta-sprite-idle';
        return (
          <g>
            {/* Fur Mantle & Trophy Cloak Behind Shoulders (Independent secondary cloth sway) */}
            <g className="animate-cripta-scarf-wave">
              <rect x="6" y="18" width="34" height="14" fill="#100C14" />
              <rect x="7" y="19" width="32" height="11" fill="#3B271E" />
              <rect x="8" y="19" width="30" height="5" fill="#593C2E" />
              <rect x="10" y="19" width="6" height="3" fill="#7D5642" />
              <rect x="26" y="20" width="7" height="3" fill="#7D5642" />
              {/* Jagged Fur Fringe */}
              <rect x="6" y="28" width="3" height="4" fill="#3B271E" />
              <rect x="11" y="29" width="3" height="4" fill="#593C2E" />
              <rect x="32" y="28" width="3" height="4" fill="#3B271E" />
            </g>

            {/* Massive Two-Handed Battleaxe Resting Across Right Shoulder (1px heft rise/fall) */}
            <g className="animate-cripta-weapon-heft">
              {/* Long Hardwood & Iron-Bound Shaft */}
              <rect x="6" y="26" width="38" height="4" fill="#100C14" />
              <rect x="7" y="27" width="36" height="2" fill="#6E4228" />
              <rect x="12" y="27" width="4" height="2" fill="#9E9A95" />
              <rect x="28" y="27" width="4" height="2" fill="#9E9A95" />
              {/* Colossal Bearded Iron Axe Head (Right Upper Quadrant) */}
              <rect x="33" y="6" width="13" height="20" fill="#100C14" />
              <rect x="34" y="7" width="10" height="18" fill="#4A4E58" />
              <rect x="36" y="8" width="7" height="16" fill="#7C8291" />
              {/* Notched Razor Bevel & Crimson Blood/War-Paint Etching */}
              <rect
                x="41"
                y="7"
                width="4"
                height="18"
                fill={isMaxFury ? '#FCA5A5' : '#C2C8D6'}
              />
              <rect
                x="43"
                y="8"
                width="2"
                height="15"
                fill={isMaxFury ? '#FFE4E6' : '#F0F4FA'}
              />
              <rect x="36" y="11" width="4" height="2" fill="#A8283B" />
              <rect
                x="37"
                y="13"
                width="3"
                height="4"
                fill={isMaxFury ? '#FF4D6D' : '#D94E34'}
              />
              {/* Max Fury subtle warm/crimson edge ember on weapon bevel (no giant aura) */}
              {isMaxFury && (
                <g className="animate-cripta-relic-glow">
                  <rect x="44" y="9" width="1" height="12" fill="#FF4D6D" />
                  <rect x="39" y="6" width="3" height="1" fill="#FF758F" />
                </g>
              )}
              {/* Rare Weapon-Metal Glint */}
              <g className="animate-cripta-blade-glint">
                <rect x="43" y="9" width="2" height="4" fill="#FFFFFF" />
                <rect x="42" y="18" width="2" height="3" fill="#FFF3C4" />
              </g>
            </g>

            {/* Broad Compact Torso, Scarred Chest, Leather Straps & Crude Left Iron Pauldron (Breathing) */}
            <g className={breatheClass}>
              <rect x="9" y="22" width="26" height="24" fill="#100C14" />
              {/* Weathered Muscular Torso */}
              <rect x="11" y="23" width="22" height="15" fill="#9E6F56" />
              <rect x="13" y="23" width="18" height="13" fill="#BD896C" />
              <rect x="15" y="24" width="7" height="6" fill="#D6A184" />
              {/* Diagonal Battle Scar Across Chest */}
              <rect x="19" y="25" width="2" height="2" fill="#7A2836" />
              <rect x="21" y="27" width="2" height="2" fill="#7A2836" />
              <rect x="23" y="29" width="2" height="2" fill="#7A2836" />
              {/* Crossed Heavy Leather Straps & Iron Ring */}
              <rect x="12" y="23" width="4" height="14" fill="#3B2316" />
              <rect x="13" y="24" width="2" height="12" fill="#5E3824" />
              <rect x="11" y="29" width="22" height="3" fill="#3B2316" />
              <rect x="19" y="27" width="5" height="5" fill="#8C6239" />
              <rect x="20" y="28" width="3" height="3" fill="#E7A54A" />

              {/* Asymmetric Crude Spiked Iron Pauldron on Left Shoulder */}
              <rect x="5" y="18" width="10" height="10" fill="#100C14" />
              <rect x="6" y="19" width="8" height="8" fill="#4A4E58" />
              <rect x="7" y="20" width="6" height="5" fill="#7C8291" />
              <rect x="7" y="20" width="4" height="2" fill="#B8C0D0" />
              {/* Iron Spike on Pauldron */}
              <rect x="4" y="16" width="3" height="4" fill="#9E9A95" />
              <rect x="5" y="16" width="2" height="2" fill="#E2E8F0" />
            </g>

            {/* Thick War Belt with Bone/Skull Trophies & Heavy Boots Base */}
            <rect x="10" y="36" width="24" height="6" fill="#100C14" />
            <rect x="11" y="37" width="22" height="4" fill="#422618" />
            <rect x="18" y="36" width="8" height="6" fill="#8F263D" />
            <rect x="19" y="37" width="6" height="4" fill="#E7A54A" />
            {/* Hanging Bone & Fang Trophies on Belt */}
            <rect x="13" y="40" width="3" height="5" fill="#D9D0BC" />
            <rect x="14" y="40" width="1" height="4" fill="#FFF8E7" />
            <rect x="28" y="40" width="4" height="5" fill="#D9D0BC" />
            <rect x="29" y="41" width="1" height="1" fill="#100C14" />
            <rect x="31" y="41" width="1" height="1" fill="#100C14" />

            {/* Gauntleted Right Fist Tightening Around Axe Shaft (moves with weapon) */}
            <g className="animate-cripta-weapon-heft">
              <rect x="28" y="24" width="7" height="6" fill="#100C14" />
              <rect x="29" y="25" width="5" height="4" fill="#BD896C" />
              <rect x="29" y="27" width="5" height="2" fill="#422618" />
            </g>

            {/* Head: Wild Asymmetric Mane, Weathered Face, Scar & Fierce Eyes */}
            <g className={breatheClass}>
              {/* Wild Asymmetric Dark Mane */}
              <rect x="10" y="5" width="22" height="16" fill="#100C14" />
              <rect x="11" y="6" width="20" height="6" fill="#2B1D19" />
              <rect x="9" y="8" width="5" height="11" fill="#2B1D19" />
              <rect x="13" y="6" width="14" height="3" fill="#47312B" />
              {/* crimson war-braid bead */}
              <rect x="10" y="16" width="2" height="3" fill="#D94E34" />

              {/* Weathered Face & Heavy Jaw Beard */}
              <rect x="14" y="10" width="15" height="11" fill="#BD896C" />
              <rect x="15" y="10" width="12" height="4" fill="#D6A184" />
              {/* War Paint & Facial Scar over Left Eye */}
              <rect x="16" y="11" width="2" height="8" fill="#A8283B" />
              <rect x="25" y="15" width="3" height="2" fill="#8F263D" />
              {/* Braided Dark Beard */}
              <rect x="14" y="17" width="15" height="5" fill="#2B1D19" />
              <rect x="17" y="18" width="9" height="3" fill="#47312B" />
              <rect x="20" y="21" width="3" height="3" fill="#D8C6A0" />

              {/* Fierce Amber-Crimson Eyes (Warm red accent at Max Fury) */}
              <g className="animate-cripta-sprite-blink">
                <rect x="16" y="13" width="4" height="3" fill="#100C14" />
                <rect x="24" y="13" width="4" height="3" fill="#100C14" />
                <rect
                  x="17"
                  y="13"
                  width="2"
                  height="2"
                  fill={isMaxFury ? '#FF4D6D' : '#FFD166'}
                />
                <rect
                  x="25"
                  y="13"
                  width="2"
                  height="2"
                  fill={isMaxFury ? '#FF4D6D' : '#FFD166'}
                />
                <rect
                  x="17"
                  y="13"
                  width="1"
                  height="1"
                  fill={isMaxFury ? '#FFF3C4' : '#FFFFFF'}
                />
              </g>
            </g>
          </g>
        );
      }

      // =======================================================================
      // 8. BARDO — Redesigned as a Dark Fantasy Jester (Bufón Sombrío de la Corte):
      //    Two-tone horned jester hood with bronze bells, half-porcelain harlequin
      //    mask over shadowed face, dagged jester collar with bells, diamond-patterned
      //    crimson & obsidian-violet doublet, and cursed lute with strumming hand
      //    animation + subtle rising musical notes.
      // =======================================================================
      case 'bardo':
        return (
          <g>
            {/* Dagged Jester Cloak Tails Behind (Secondary Cloth Sway) */}
            <g className="animate-cripta-scarf-wave">
              <rect x="4" y="22" width="9" height="18" fill="#100C14" />
              <rect x="5" y="23" width="7" height="15" fill="#3D1228" />
              <rect x="6" y="24" width="5" height="11" fill="#7A1C3A" />
              {/* Dagged Pointed Tail Tips & Bronze Bell */}
              <rect x="4" y="37" width="3" height="4" fill="#2A1842" />
              <rect x="8" y="38" width="3" height="3" fill="#7A1C3A" />
              <rect x="5" y="40" width="2" height="2" fill="#E7A54A" />
            </g>

            {/* Dark Fantasy Jester Doublet (Harlequin Diamond Pattern: Crimson & Obsidian-Violet) */}
            <g className="animate-cripta-sprite-idle">
              <rect x="9" y="22" width="25" height="24" fill="#100C14" />
              {/* Left Side: Crimson & Gold Harlequin Diamonds */}
              <rect x="10" y="23" width="12" height="22" fill="#6E1733" />
              <rect x="11" y="24" width="10" height="20" fill="#9E2248" />
              {/* Diamond Checks on Left */}
              <rect x="12" y="26" width="4" height="4" fill="#1E1430" />
              <rect x="16" y="30" width="4" height="4" fill="#1E1430" />
              <rect x="12" y="34" width="4" height="4" fill="#1E1430" />
              <rect x="16" y="38" width="4" height="4" fill="#1E1430" />
              {/* Right Side: Deep Obsidian-Violet & Teal Accent */}
              <rect x="22" y="23" width="11" height="22" fill="#1E1430" />
              <rect x="23" y="24" width="9" height="20" fill="#2E1E4A" />
              <rect x="24" y="26" width="4" height="4" fill="#9E2248" />
              <rect x="24" y="34" width="4" height="4" fill="#9E2248" />
              {/* Center Gold Seam & Brass Buttons */}
              <rect x="21" y="23" width="2" height="22" fill="#C98736" />
              <rect x="21" y="25" width="1" height="18" fill="#FFD166" />

              {/* Dagged Jester Collar (Cuello de Picos con Cascabeles) */}
              <rect x="8" y="20" width="27" height="5" fill="#100C14" />
              <rect x="9" y="21" width="5" height="3" fill="#9E2248" />
              <rect x="14" y="21" width="5" height="4" fill="#2E1E4A" />
              <rect x="19" y="21" width="5" height="3" fill="#E6DAC3" />
              <rect x="24" y="21" width="5" height="4" fill="#9E2248" />
              <rect x="29" y="21" width="5" height="3" fill="#2E1E4A" />
              {/* Collar Bells */}
              <rect x="10" y="24" width="2" height="2" fill="#FFD166" />
              <rect x="16" y="25" width="2" height="2" fill="#FFD166" />
              <rect x="26" y="25" width="2" height="2" fill="#FFD166" />
            </g>

            {/* Two-Horned Dark Jester Hood & Half-Porcelain Harlequin Mask */}
            <g className="animate-cripta-head-turn">
              {/* Left Jester Horn (Crimson, Curving Out Left) */}
              <rect x="4" y="4" width="12" height="8" fill="#100C14" />
              <rect x="8" y="5" width="8" height="5" fill="#7A1C3A" />
              <rect x="5" y="6" width="6" height="5" fill="#B82956" />
              <rect x="3" y="8" width="4" height="4" fill="#7A1C3A" />
              {/* Left Horn Bell (sways gently) */}
              <g className="animate-cripta-jester-bells">
                <rect x="2" y="11" width="4" height="4" fill="#100C14" />
                <rect x="3" y="12" width="2" height="2" fill="#FFD166" />
                <rect x="3" y="12" width="1" height="1" fill="#FFFFFF" />
              </g>

              {/* Right Jester Horn (Obsidian-Violet & Teal, Curving Out Right) */}
              <rect x="26" y="3" width="13" height="8" fill="#100C14" />
              <rect x="26" y="4" width="9" height="5" fill="#2E1E4A" />
              <rect x="32" y="5" width="6" height="5" fill="#462E70" />
              <rect x="36" y="7" width="4" height="4" fill="#235B61" />
              {/* Right Horn Bell */}
              <g className="animate-cripta-jester-bells">
                <rect x="37" y="10" width="4" height="4" fill="#100C14" />
                <rect x="38" y="11" width="2" height="2" fill="#FFD166" />
                <rect x="38" y="11" width="1" height="1" fill="#FFFFFF" />
              </g>

              {/* Jester Cowl Brow (Split Crimson / Obsidian) */}
              <rect x="12" y="6" width="18" height="6" fill="#100C14" />
              <rect x="13" y="7" width="8" height="4" fill="#9E2248" />
              <rect x="21" y="7" width="8" height="4" fill="#2E1E4A" />
              <rect x="20" y="6" width="2" height="5" fill="#E7A54A" />

              {/* Half-Porcelain Harlequin Mask (Left Face) & Shadowed Face (Right Face) */}
              <rect x="13" y="11" width="16" height="10" fill="#100C14" />
              {/* Porcelain White Mask Half (Left) with Crimson Tear Mark */}
              <rect x="14" y="11" width="7" height="9" fill="#E8E2D5" />
              <rect x="15" y="11" width="6" height="7" fill="#FFFDF9" />
              <rect x="17" y="16" width="1" height="3" fill="#C93B5B" />
              <rect x="17" y="12" width="1" height="1" fill="#C93B5B" />
              {/* Shadowed Right Half of Face */}
              <rect x="21" y="11" width="7" height="9" fill="#2B1F38" />
              <rect x="22" y="12" width="5" height="7" fill="#4A3560" />
              {/* Theatrical Jester Smirk */}
              <rect x="16" y="18" width="9" height="1" fill="#100C14" />
              <rect x="15" y="17" width="2" height="1" fill="#C93B5B" />
              <rect x="24" y="17" width="2" height="1" fill="#FFD166" />

              {/* Asymmetric Jester Eyes (Dark Slit in Mask + Glowing Cyan/Gold Eye in Shadow) */}
              <g className="animate-cripta-sprite-blink">
                <rect x="15" y="13" width="4" height="3" fill="#100C14" />
                <rect x="16" y="14" width="2" height="1" fill="#FF4D6D" />
                <rect x="23" y="13" width="4" height="3" fill="#100C14" />
                <rect x="24" y="13" width="2" height="2" fill="#81E6D9" />
                <rect x="24" y="13" width="1" height="1" fill="#FFFFFF" />
              </g>
            </g>

            {/* Cursed Court Lute Held Across Front + Strumming Hand + Rising Notes */}
            <g>
              {/* Lute Neck & Crooked Pegbox */}
              <rect x="34" y="14" width="9" height="11" fill="#100C14" />
              <rect x="35" y="15" width="7" height="9" fill="#5C341D" />
              <rect x="38" y="12" width="6" height="4" fill="#C98736" />
              <rect x="39" y="13" width="4" height="2" fill="#FFD166" />

              {/* Resonator Soundbody */}
              <rect x="23" y="24" width="19" height="16" fill="#100C14" />
              <rect x="24" y="25" width="17" height="14" fill="#6E1D35" />
              <rect x="25" y="26" width="15" height="12" fill="#9E2A4B" />
              <rect x="26" y="27" width="13" height="10" fill="#C47A45" />
              {/* Soundhole & Luminous Strings */}
              <rect x="29" y="28" width="7" height="7" fill="#100C14" />
              <rect x="30" y="29" width="5" height="5" fill="#235B61" />
              <rect x="27" y="30" width="12" height="1" fill="#FFD166" />
              <rect x="27" y="32" width="12" height="1" fill="#81E6D9" />
              <rect x="27" y="34" width="12" height="1" fill="#FFF8E7" />

              {/* Animated White-Gloved Jester Hand Strumming Strings */}
              <g className="animate-cripta-jester-strum">
                <rect x="28" y="28" width="5" height="5" fill="#100C14" />
                <rect x="29" y="29" width="3" height="3" fill="#FFFDF9" />
                <rect x="31" y="31" width="2" height="1" fill="#FFD166" />
              </g>

              {/* Smooth 60fps Rising Musical Note Particles */}
              <g className="animate-cripta-music-notes">
                {/* Note 1 (Cyan eighth note) */}
                <rect x="31" y="19" width="2" height="2" fill="#81E6D9" />
                <rect x="32" y="16" width="1" height="3" fill="#81E6D9" />
                <rect x="33" y="16" width="2" height="1" fill="#81E6D9" />
                {/* Note 2 (Gold note) */}
                <rect x="41" y="20" width="2" height="2" fill="#FFD166" />
                <rect x="42" y="17" width="1" height="3" fill="#FFD166" />
              </g>
            </g>
          </g>
        );

      // =======================================================================
      // 9. NIGROMANTE — Tattered obsidian & bone ritual vestments, carved skull
      //    pauldrons, pale gaunt face under cowled hood with spectral emerald-
      //    violet eyes, bone scythe & floating soul-essence shards
      // =======================================================================
      case 'nigromante':
        return (
          <g>
            {/* Orbiting Soul-Essence Shards & Floating Vertebrae Behind */}
            <g className="animate-cripta-staff-orb">
              <rect x="3" y="11" width="5" height="6" fill="#100C14" />
              <rect x="4" y="12" width="3" height="4" fill="#34D399" />
              <rect x="5" y="12" width="1" height="2" fill="#FFFFFF" />
              <rect x="39" y="9" width="5" height="6" fill="#100C14" />
              <rect x="40" y="10" width="3" height="4" fill="#9B72CF" />
              <rect x="41" y="10" width="1" height="2" fill="#F3E8FF" />
            </g>

            {/* Tattered Obsidian & Ash Ritual Robes (Breathing + Cloth Sway) */}
            <g className="animate-cripta-sprite-idle">
              <rect x="8" y="22" width="28" height="24" fill="#100C14" />
              <rect x="9" y="23" width="26" height="22" fill="#161124" />
              <rect x="11" y="24" width="22" height="21" fill="#231B38" />
              {/* Ribcage Bone Corset / Ritual Stole Down Center */}
              <rect x="18" y="24" width="8" height="20" fill="#3B2D54" />
              <rect x="19" y="25" width="6" height="2" fill="#D9D0BC" />
              <rect x="19" y="29" width="6" height="2" fill="#D9D0BC" />
              <rect x="19" y="33" width="6" height="2" fill="#D9D0BC" />
              <rect x="21" y="24" width="2" height="16" fill="#68D391" />

              {/* Carved Bone Skull Pauldrons on Both Shoulders */}
              <rect x="6" y="20" width="8" height="7" fill="#100C14" />
              <rect x="7" y="21" width="6" height="5" fill="#D9D0BC" />
              <rect x="8" y="21" width="4" height="2" fill="#FFF8E7" />
              <rect x="8" y="23" width="1" height="1" fill="#100C14" />
              <rect x="11" y="23" width="1" height="1" fill="#100C14" />

              <rect x="30" y="20" width="8" height="7" fill="#100C14" />
              <rect x="31" y="21" width="6" height="5" fill="#D9D0BC" />
              <rect x="32" y="21" width="4" height="2" fill="#FFF8E7" />
              <rect x="32" y="23" width="1" height="1" fill="#100C14" />
              <rect x="35" y="23" width="1" height="1" fill="#100C14" />
            </g>

            {/* Deep Cowled Sepulchral Hood & Pale Gaunt Face */}
            <g className="animate-cripta-head-turn">
              <rect x="10" y="4" width="24" height="19" fill="#100C14" />
              <rect x="11" y="5" width="22" height="17" fill="#1D152E" />
              <rect x="13" y="6" width="18" height="6" fill="#2E2247" />
              {/* Bone Crown / Filigree on Hood Brow */}
              <rect x="17" y="7" width="10" height="2" fill="#D9D0BC" />
              <rect x="21" y="5" width="2" height="4" fill="#68D391" />

              {/* Pale Ash-Complexion Face Inside Shadowed Cowl */}
              <rect x="14" y="11" width="16" height="10" fill="#100C14" />
              <rect x="15" y="12" width="14" height="8" fill="#B8B2C8" />
              <rect x="16" y="12" width="12" height="6" fill="#D8D4E6" />
              {/* Dark Ritual Mark on Chin */}
              <rect x="21" y="17" width="2" height="3" fill="#4C1D95" />

              {/* Luminous Spectral Emerald-Violet Eyes */}
              <g className="animate-cripta-sprite-blink">
                <rect x="16" y="13" width="4" height="3" fill="#100C14" />
                <rect x="24" y="13" width="4" height="3" fill="#100C14" />
                <rect x="17" y="13" width="2" height="2" fill="#68D391" />
                <rect x="25" y="13" width="2" height="2" fill="#68D391" />
                <rect x="17" y="13" width="1" height="1" fill="#FFFFFF" />
                <rect x="25" y="13" width="1" height="1" fill="#FFFFFF" />
              </g>
            </g>

            {/* Curved Bone Scythe & Spectral Soul Lantern (Right Side, 1px Heft) */}
            <g className="animate-cripta-weapon-heft">
              {/* Carved Spine Scythe Shaft */}
              <rect x="35" y="8" width="4" height="38" fill="#100C14" />
              <rect x="36" y="9" width="2" height="36" fill="#B5A895" />
              <rect x="36" y="9" width="1" height="36" fill="#E6DEC8" />
              {/* Sweeping Curved Bone & Soul-Steel Scythe Blade at Top */}
              <rect x="24" y="2" width="19" height="7" fill="#100C14" />
              <rect x="25" y="3" width="17" height="5" fill="#D9D0BC" />
              <rect x="26" y="3" width="14" height="2" fill="#FFFFFF" />
              <rect x="25" y="6" width="12" height="2" fill="#68D391" />
              {/* Skeletal Hand Gripping Scythe Shaft */}
              <rect x="34" y="27" width="6" height="5" fill="#100C14" />
              <rect x="35" y="28" width="4" height="3" fill="#D8D4E6" />
              {/* Soul Flame Rising from Scythe Eye & Lantern */}
              <g className="animate-cripta-relic-glow">
                <rect x="35" y="5" width="3" height="3" fill="#68D391" />
                <rect x="36" y="6" width="1" height="1" fill="#FFFFFF" />
                <rect x="39" y="21" width="6" height="8" fill="#100C14" />
                <rect x="40" y="22" width="4" height="6" fill="#68D391" />
                <rect x="41" y="23" width="2" height="4" fill="#E6FFFA" />
              </g>
            </g>
          </g>
        );

      // =======================================================================
      // 6. ALQUIMISTA — Clearer twin brass goggles, face & leather mask,
      //    copper/glass backpack, bandolier with 3 distinct colorful vials,
      //    gloved hand holding bubbling emerald flask
      // =======================================================================
      case 'alquimista':
      default:
        return (
          <g>
            {/* Compact Copper & Glass Alembic Backpack Behind Shoulders (Small apparatus movement) */}
            <g className="animate-cripta-alchemist-apparatus">
              <rect x="5" y="9" width="8" height="19" fill="#100C14" />
              <rect x="6" y="10" width="6" height="17" fill="#3B6E6C" />
              <rect x="7" y="11" width="4" height="14" fill="#69A8A5" />
              <rect x="7" y="12" width="1" height="10" fill="#E0FFFF" />
              <rect x="6" y="10" width="6" height="2" fill="#C98736" />
              {/* Right Copper Condenser Coil */}
              <rect x="30" y="10" width="7" height="15" fill="#100C14" />
              <rect x="31" y="11" width="5" height="13" fill="#8C532B" />
              <rect x="32" y="12" width="3" height="11" fill="#C47A45" />
              <rect x="32" y="13" width="1" height="8" fill="#F2B680" />
            </g>

            {/* Alchemist Coat, Leather Straps & Bandolier Vials (Slight body breathing) */}
            <g className="animate-cripta-sprite-idle">
              <rect x="9" y="24" width="26" height="22" fill="#100C14" />
              <rect x="10" y="25" width="24" height="21" fill="#1D2B30" />
              <rect x="12" y="25" width="20" height="21" fill="#2A3D45" />
              <rect x="14" y="26" width="5" height="20" fill="#3B545E" />
              {/* Leather Backpack Straps & Chest Bandolier */}
              <rect x="11" y="24" width="3" height="14" fill="#42291B" />
              <rect x="13" y="26" width="18" height="4" fill="#42291B" />
              <rect x="14" y="27" width="16" height="2" fill="#633F2A" />

              {/* 3 Recognizable Corked Potion Bottles on Bandolier (Subtly react & reflect) */}
              {/* Vial 1: Crimson Health Elixir */}
              <rect x="14" y="29" width="5" height="8" fill="#100C14" />
              <rect x="15" y="28" width="3" height="2" fill="#C4A48C" />
              <rect x="15" y="30" width="3" height="6" fill="#8F263D" />
              <g className="animate-cripta-alchemist-liquid">
                <rect x="15" y="31" width="2" height="4" fill="#C93B5B" />
              </g>
              <rect x="15" y="31" width="1" height="2" fill="#FFD6DF" className="animate-cripta-alchemist-glint" />

              {/* Vial 2: Amber Alchemical Fire */}
              <rect x="20" y="30" width="5" height="8" fill="#100C14" />
              <rect x="21" y="29" width="3" height="2" fill="#C4A48C" />
              <rect x="21" y="31" width="3" height="6" fill="#C98736" />
              <g className="animate-cripta-alchemist-liquid">
                <rect x="21" y="32" width="2" height="4" fill="#E7A54A" />
              </g>
              <rect x="21" y="32" width="1" height="2" fill="#FFF8E7" className="animate-cripta-alchemist-glint" />

              {/* Vial 3: Violet Mana Ether */}
              <rect x="26" y="31" width="5" height="8" fill="#100C14" />
              <rect x="27" y="30" width="3" height="2" fill="#C4A48C" />
              <rect x="27" y="32" width="3" height="6" fill="#68429E" />
              <g className="animate-cripta-alchemist-liquid">
                <rect x="27" y="33" width="2" height="4" fill="#9B72CF" />
              </g>
              <rect x="27" y="33" width="1" height="2" fill="#F2E6FF" className="animate-cripta-alchemist-glint" />

              {/* Head, Visible Face Bridge, Leather Respirator Mask & Twin Goggles */}
              <rect x="12" y="7" width="20" height="18" fill="#100C14" />
              {/* Dark Hair / Alchemist Cap */}
              <rect x="13" y="8" width="18" height="4" fill="#252336" />
              <rect x="15" y="8" width="12" height="2" fill="#383552" />
              {/* Visible Skin Around Goggles */}
              <rect x="14" y="12" width="16" height="6" fill="#B59077" />

              {/* Stitched Leather Respirator Half-Mask Underneath */}
              <rect x="14" y="18" width="16" height="6" fill="#3B2618" />
              <rect x="15" y="18" width="14" height="5" fill="#593A26" />
              <rect x="17" y="18" width="10" height="2" fill="#785036" />
              {/* Brass Filter Grill on Mask */}
              <rect x="19" y="19" width="6" height="4" fill="#C98736" />
              <rect x="20" y="20" width="4" height="2" fill="#E7A54A" />
              <rect x="21" y="20" width="2" height="2" fill="#100C14" />

              {/* Oversized Twin Brass Goggles with Glass Reflections */}
              {/* Goggle Strap */}
              <rect x="12" y="13" width="20" height="3" fill="#3B2618" />
              {/* Left Goggle Frame */}
              <rect x="12" y="10" width="9" height="8" fill="#100C14" />
              <rect x="13" y="11" width="7" height="6" fill="#C98736" />
              <rect x="13" y="11" width="6" height="1" fill="#E7A54A" />
              {/* Right Goggle Frame */}
              <rect x="23" y="10" width="9" height="8" fill="#100C14" />
              <rect x="24" y="11" width="7" height="6" fill="#C98736" />
              <rect x="24" y="11" width="6" height="1" fill="#E7A54A" />
              {/* Nose Bridge Connector */}
              <rect x="21" y="13" width="2" height="2" fill="#E7A54A" />

              {/* Goggle Lenses */}
              <g className="animate-cripta-sprite-blink">
                {/* Left Cyan Lens */}
                <rect x="14" y="12" width="5" height="4" fill="#2F6663" />
                <rect x="15" y="12" width="4" height="3" fill="#69A8A5" />
                <rect x="15" y="12" width="2" height="2" fill="#FFFFFF" />
                {/* Right Violet Lens */}
                <rect x="25" y="12" width="5" height="4" fill="#533385" />
                <rect x="26" y="12" width="4" height="3" fill="#9B72CF" />
                <rect x="26" y="12" width="2" height="2" fill="#FFFFFF" />
              </g>
            </g>

            {/* Gloved Hand & Bubbling Emerald Potion Flask (Subtle bottle tilt, liquid slosh, glass reflection + 60fps runtime bubbles) */}
            <g className="animate-cripta-alchemist-flask">
              {/* Flask Neck & Cork */}
              <rect x="36" y="21" width="6" height="5" fill="#100C14" />
              <rect x="37" y="22" width="4" height="3" fill="#8CA8A6" />
              <rect x="37" y="22" width="1" height="2" fill="#FFFFFF" />

              {/* Round Glass Flask Bulb */}
              <rect x="33" y="25" width="12" height="13" fill="#100C14" />
              <rect x="34" y="26" width="10" height="11" fill="#2A4745" />
              {/* Bubbling Glowing Emerald Liquid (Sloshes subtly) */}
              <g className="animate-cripta-alchemist-liquid">
                <rect x="34" y="29" width="10" height="8" fill="#2D6E48" />
                <rect x="35" y="29" width="8" height="7" fill="#5EA87A" />
                <rect x="35" y="29" width="8" height="2" fill="#A8F0C2" />
              </g>
              {/* Glass Specular Reflection */}
              <g className="animate-cripta-alchemist-glint">
                <rect x="35" y="27" width="1" height="7" fill="#FFFFFF" />
                <rect x="36" y="34" width="2" height="1" fill="#FFFFFF" />
              </g>

              {/* Leather-Gloved Hand Holding Flask */}
              <rect x="31" y="30" width="5" height="6" fill="#100C14" />
              <rect x="32" y="31" width="4" height="4" fill="#42291B" />
              <rect x="32" y="31" width="3" height="2" fill="#633F2A" />

              {/* 60FPS Runtime Potion Bubbles rising inside liquid & popping near surface */}
              <AlchemistPotionBubbles60Fps />
            </g>
          </g>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClass} ${wrapperAnimClass} ${
        isHovered ? 'scale-105 -translate-y-0.5' : ''
      } transition-transform duration-150 ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full overflow-visible pixelated-art drop-shadow-[0_4px_10px_rgba(0,0,0,0.92)]"
        shapeRendering="crispEdges"
      >
        {renderSpritePixels()}
      </svg>
    </div>
  );
};
