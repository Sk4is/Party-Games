import React, { useEffect, useState } from 'react';
import { CriptaCharacterId, CriptaSpriteAnimationState } from '../../types/laCripta';

interface LaCriptaPixelSpriteProps {
  characterId: CriptaCharacterId;
  animationState?: CriptaSpriteAnimationState;
  size?: 'sm' | 'md' | 'lg' | 'hud';
  isHovered?: boolean;
  className?: string;
}

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
            {/* Dark Crimson Cloak Backdrop Behind Shoulders */}
            <rect x="8" y="21" width="30" height="25" fill="#100C14" />
            <rect x="9" y="22" width="28" height="24" fill="#471220" />
            <rect x="10" y="23" width="26" height="22" fill="#63192C" />

            {/* Subtle Breathing Torso, Pauldrons & Horned Great-Helm */}
            <g className="animate-cripta-sprite-idle">
              {/* Segmented Steel Pauldrons (Left & Right) */}
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

              {/* Breastplate & Crimson Tabard with Folds */}
              <rect x="14" y="23" width="18" height="23" fill="#100C14" />
              <rect x="15" y="24" width="16" height="10" fill="#464F61" />
              <rect x="16" y="24" width="14" height="4" fill="#69758C" />
              {/* Tabard Cloth Folds (3 shading levels) */}
              <rect x="15" y="31" width="16" height="15" fill="#571525" />
              <rect x="17" y="31" width="12" height="15" fill="#822037" />
              <rect x="19" y="32" width="3" height="14" fill="#A82E49" />
              <rect x="24" y="32" width="2" height="14" fill="#571525" />
              {/* Golden Tabard Trim */}
              <rect x="22" y="31" width="2" height="15" fill="#C98736" />
              <rect x="22" y="31" width="1" height="15" fill="#E7A54A" />

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

              {/* Deep Helmet Visor Slit & Glowing Eyes */}
              <rect x="15" y="14" width="16" height="4" fill="#09070D" />
              <rect x="22" y="14" width="2" height="4" fill="#C98736" />
              <rect x="16" y="15" width="5" height="2" fill="#9E6825" />
              <rect x="25" y="15" width="5" height="2" fill="#9E6825" />
              <rect x="17" y="15" width="3" height="2" fill="#E7A54A" />
              <rect x="26" y="15" width="3" height="2" fill="#E7A54A" />
              <rect x="18" y="15" width="1" height="1" fill="#FFF8E7" />
              <rect x="27" y="15" width="1" height="1" fill="#FFF8E7" />

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

            {/* Battered Tower Shield with Rim, Notches & Sun-Cross Emblem (Left Foreground) */}
            <g>
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
            {/* Layered Arcane Robes & Mantle */}
            <rect x="9" y="24" width="26" height="22" fill="#100C14" />
            <rect x="10" y="25" width="24" height="21" fill="#25153D" />
            {/* Robe Folds (3 levels of violet) */}
            <rect x="12" y="25" width="20" height="21" fill="#3B2361" />
            <rect x="14" y="26" width="5" height="20" fill="#533385" />
            <rect x="25" y="26" width="4" height="20" fill="#533385" />
            <rect x="19" y="28" width="6" height="18" fill="#25153D" />
            {/* Gold Embroidered Stole & Trim */}
            <rect x="13" y="25" width="2" height="21" fill="#C98736" />
            <rect x="13" y="25" width="1" height="21" fill="#E7A54A" />
            <rect x="29" y="25" width="2" height="21" fill="#C98736" />
            <rect x="29" y="25" width="1" height="21" fill="#E7A54A" />

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

            {/* Expressive Glowing Cyan Eyes */}
            <g className="animate-cripta-sprite-blink">
              <rect x="15" y="17" width="5" height="3" fill="#2A5E5C" />
              <rect x="24" y="17" width="5" height="3" fill="#2A5E5C" />
              <rect x="16" y="17" width="3" height="2" fill="#69A8A5" />
              <rect x="25" y="17" width="3" height="2" fill="#69A8A5" />
              <rect x="17" y="17" width="1" height="1" fill="#FFFFFF" />
              <rect x="26" y="17" width="1" height="1" fill="#FFFFFF" />
            </g>

            {/* Oversized Crooked Wizard Hat with Folds & Rune Buckle (Sways 1px) */}
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

              {/* Upper Crooked Tip Bending Right */}
              <rect x="14" y="5" width="16" height="4" fill="#100C14" />
              <rect x="15" y="5" width="14" height="4" fill="#533385" />
              <rect x="16" y="5" width="10" height="2" fill="#7852B3" />
              <rect x="19" y="2" width="13" height="3" fill="#100C14" />
              <rect x="20" y="3" width="11" height="2" fill="#68429E" />
              <rect x="21" y="3" width="6" height="1" fill="#9B72CF" />
              <rect x="29" y="4" width="5" height="4" fill="#100C14" />
              <rect x="30" y="5" width="3" height="2" fill="#3B2361" />

              {/* Golden Hat Band & Arcane Gem Buckle */}
              <rect x="12" y="12" width="18" height="2" fill="#9E6825" />
              <rect x="13" y="12" width="16" height="1" fill="#E7A54A" />
              <rect x="19" y="10" width="6" height="4" fill="#E7A54A" />
              <rect x="20" y="11" width="4" height="2" fill="#69A8A5" />
              <rect x="21" y="11" width="1" height="1" fill="#FFFFFF" />
            </g>

            {/* Gnarled Wooden Staff, Recognizable Hand & Pulsing Arcane Crystal */}
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

              {/* Pulsing Faceted Arcane Crystal & Floating Motes */}
              <g className="animate-cripta-arcane-pulse">
                <rect x="36" y="5" width="7" height="8" fill="#100C14" />
                <rect x="37" y="6" width="5" height="6" fill="#7852B3" />
                <rect x="38" y="6" width="3" height="5" fill="#9B72CF" />
                <rect x="38" y="7" width="2" height="3" fill="#69A8A5" />
                <rect x="38" y="7" width="1" height="2" fill="#FFFFFF" />
                {/* Tiny Arcane Glow Particles */}
                <rect x="33" y="5" width="2" height="2" fill="#69A8A5" />
                <rect x="44" y="4" width="2" height="2" fill="#E7A54A" />
                <rect x="39" y="2" width="2" height="2" fill="#69A8A5" />
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
            {/* Asymmetric Rogue Cloak & Tunic */}
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

            {/* Deep Pointed Hood with Folds & Asymmetric Tail */}
            <rect x="11" y="6" width="22" height="16" fill="#100C14" />
            <rect x="9" y="5" width="6" height="4" fill="#100C14" />
            <rect x="10" y="6" width="5" height="3" fill="#252436" />
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
              <g className="animate-cripta-sprite-cloth">
                <rect x="4" y="20" width="9" height="6" fill="#100C14" />
                <rect x="5" y="21" width="8" height="4" fill="#9E2442" />
                <rect x="6" y="21" width="6" height="2" fill="#CF385D" />
                <rect x="3" y="24" width="6" height="5" fill="#100C14" />
                <rect x="4" y="25" width="4" height="3" fill="#6E192E" />
              </g>
            </g>

            {/* Recognizable Gloved Hand & Curved Dagger with Metallic Highlight */}
            <g>
              {/* Curved Assassin Blade */}
              <rect x="35" y="11" width="7" height="16" fill="#100C14" />
              <rect x="37" y="10" width="5" height="4" fill="#100C14" />
              <rect x="36" y="14" width="5" height="12" fill="#69758C" />
              <rect x="37" y="12" width="3" height="13" fill="#9FA8BA" />
              <rect x="38" y="11" width="2" height="11" fill="#D9E0EC" />
              {/* Venom tip & metallic glint */}
              <rect x="39" y="9" width="2" height="3" fill="#5EA87A" />
              <rect x="39" y="9" width="1" height="1" fill="#A8F0C2" />
              <g className="animate-cripta-glint">
                <rect x="38" y="14" width="1" height="3" fill="#FFFFFF" />
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

            {/* Layered Woodland Cloak & Quilted Leather Jerkin */}
            <rect x="8" y="23" width="28" height="23" fill="#100C14" />
            <rect x="9" y="24" width="26" height="22" fill="#1F2E23" />
            <rect x="11" y="25" width="22" height="21" fill="#2E4534" />
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

            {/* Clear Rugged Hunter Face, Scar & Beard Stubble */}
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
              <g className="animate-cripta-sprite-cloth">
                <rect x="7" y="3" width="6" height="9" fill="#100C14" />
                <rect x="8" y="4" width="4" height="7" fill="#3E6B52" />
                <rect x="8" y="4" width="3" height="5" fill="#5EA87A" />
                <rect x="8" y="4" width="2" height="2" fill="#E7A54A" />
                <rect x="9" y="3" width="1" height="1" fill="#FFF3D1" />
              </g>
            </g>

            {/* Recognizable Hand & Heavy Ranger Crossbow (Right) */}
            <g>
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

              {/* Leather-Bracered Hand Gripping Stock */}
              <rect x="34" y="28" width="7" height="6" fill="#100C14" />
              <rect x="35" y="29" width="5" height="4" fill="#B59077" />
              <rect x="35" y="31" width="5" height="2" fill="#4A2F1D" />
            </g>
          </g>
        );

      // =======================================================================
      // 5. CLÉRIGO — Expressive ceremonial mask/face, halo sun-crown, layered
      //    robes with golden trim, engraved sacred symbol, raised reliquary
      //    lantern casting warm light onto nearby pixels
      // =======================================================================
      case 'clerigo':
        return (
          <g>
            {/* Layered Ceremonial Vestments & Golden Stole */}
            <rect x="8" y="23" width="28" height="23" fill="#100C14" />
            <rect x="9" y="24" width="26" height="22" fill="#9E917B" />
            <rect x="11" y="24" width="22" height="22" fill="#C9B99F" />
            <rect x="13" y="25" width="18" height="21" fill="#E6DAC3" />
            {/* Deep Burgundy Inner Tabard */}
            <rect x="18" y="25" width="8" height="21" fill="#571525" />
            <rect x="19" y="25" width="6" height="21" fill="#7D1E34" />

            {/* Golden Stole with Engraved Sacred Sun-Cross Symbol */}
            <rect x="14" y="24" width="4" height="22" fill="#9E6825" />
            <rect x="15" y="24" width="2" height="22" fill="#E7A54A" />
            <rect x="26" y="24" width="4" height="22" fill="#9E6825" />
            <rect x="26" y="24" width="3" height="22" fill="#E7A54A" />
            {/* Illuminated right shoulder edge from nearby lantern */}
            <rect x="31" y="24" width="3" height="12" fill="#E7A54A" />
            <rect x="33" y="25" width="1" height="8" fill="#FFF3D1" />

            {/* Engraved Sacred Symbol on Chest */}
            <rect x="21" y="28" width="2" height="9" fill="#E7A54A" />
            <rect x="19" y="31" width="6" height="2" fill="#E7A54A" />
            <rect x="21" y="31" width="2" height="2" fill="#FFF8E7" />

            {/* Ceremonial Sun-Crown Halo Rays */}
            <rect x="20" y="2" width="4" height="6" fill="#100C14" />
            <rect x="21" y="3" width="2" height="5" fill="#E7A54A" />
            <rect x="21" y="3" width="1" height="2" fill="#FFF8E7" />
            <rect x="13" y="5" width="4" height="5" fill="#100C14" />
            <rect x="14" y="6" width="2" height="4" fill="#C98736" />
            <rect x="27" y="5" width="4" height="5" fill="#100C14" />
            <rect x="28" y="6" width="2" height="4" fill="#E7A54A" />
            <rect x="9" y="11" width="4" height="3" fill="#C98736" />
            <rect x="31" y="11" width="4" height="3" fill="#E7A54A" />

            {/* Expressive Sculpted Ceremonial Mask / Face */}
            <rect x="13" y="8" width="18" height="16" fill="#100C14" />
            <rect x="14" y="9" width="16" height="14" fill="#9E8E74" />
            <rect x="15" y="9" width="14" height="13" fill="#C7B699" />
            <rect x="16" y="10" width="11" height="10" fill="#E6D8BE" />
            {/* Warm rim light on right side of mask from the sacred lantern */}
            <rect x="28" y="10" width="2" height="12" fill="#E7A54A" />
            <rect x="29" y="12" width="1" height="8" fill="#FFF8E7" />
            {/* Golden Brow Crown & Nose Bridge */}
            <rect x="14" y="9" width="16" height="2" fill="#E7A54A" />
            <rect x="21" y="11" width="2" height="7" fill="#FFFDF7" />
            {/* Carved Serene Lips & Sacred Tear Engravings */}
            <rect x="19" y="20" width="6" height="1" fill="#7D6B52" />
            <rect x="20" y="19" width="4" height="1" fill="#9E6825" />
            <rect x="17" y="17" width="1" height="3" fill="#C98736" />
            <rect x="26" y="17" width="1" height="3" fill="#C98736" />

            {/* Luminous Ceremonial Mask Eyes */}
            <g className="animate-cripta-sprite-blink">
              <rect x="16" y="14" width="4" height="2" fill="#100C14" />
              <rect x="24" y="14" width="4" height="2" fill="#100C14" />
              <rect x="17" y="14" width="2" height="2" fill="#E7A54A" />
              <rect x="25" y="14" width="2" height="2" fill="#E7A54A" />
              <rect x="17" y="14" width="1" height="1" fill="#FFF8E7" />
              <rect x="25" y="14" width="1" height="1" fill="#FFF8E7" />
            </g>

            {/* Raised Hand & Sacred Reliquary Lantern with Fluctuating Light */}
            <g>
              {/* Raised Hand Holding Chain */}
              <rect x="33" y="12" width="11" height="4" fill="#100C14" />
              <rect x="34" y="13" width="9" height="2" fill="#E7A54A" />
              <rect x="34" y="12" width="4" height="3" fill="#E6D8BE" />
              {/* Suspension Chain */}
              <rect x="38" y="16" width="2" height="4" fill="#D8C6A0" />

              {/* Ornate Reliquary Lantern Cage */}
              <rect x="32" y="19" width="14" height="18" fill="#100C14" />
              <rect x="34" y="18" width="10" height="2" fill="#C98736" />
              <rect x="33" y="20" width="12" height="15" fill="#9E6825" />
              <rect x="34" y="20" width="10" height="2" fill="#E7A54A" />
              <rect x="34" y="33" width="10" height="2" fill="#E7A54A" />

              {/* Fluctuating Sacred Flame Inside Reliquary + Illuminated Pixels */}
              <g className="animate-cripta-relic-glow">
                <rect x="35" y="22" width="8" height="11" fill="#E7A54A" />
                <rect x="36" y="23" width="6" height="9" fill="#FFD27D" />
                <rect x="37" y="24" width="4" height="7" fill="#FFFDF5" />
                {/* Sacred cross bars over the light */}
                <rect x="38" y="22" width="2" height="11" fill="#9E6825" />
                <rect x="35" y="26" width="8" height="2" fill="#9E6825" />
                {/* Warm Halo Sparks */}
                <rect x="30" y="19" width="2" height="2" fill="#E7A54A" />
                <rect x="45" y="21" width="2" height="2" fill="#FFF3D1" />
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
            {/* Compact Copper & Glass Alembic Backpack Behind Shoulders */}
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

            {/* Alchemist Coat & Leather Straps */}
            <rect x="9" y="24" width="26" height="22" fill="#100C14" />
            <rect x="10" y="25" width="24" height="21" fill="#1D2B30" />
            <rect x="12" y="25" width="20" height="21" fill="#2A3D45" />
            <rect x="14" y="26" width="5" height="20" fill="#3B545E" />
            {/* Leather Backpack Straps & Chest Bandolier */}
            <rect x="11" y="24" width="3" height="14" fill="#42291B" />
            <rect x="13" y="26" width="18" height="4" fill="#42291B" />
            <rect x="14" y="27" width="16" height="2" fill="#633F2A" />

            {/* 3 Recognizable Corked Potion Bottles on Bandolier */}
            {/* Vial 1: Crimson Health Elixir */}
            <rect x="14" y="29" width="5" height="8" fill="#100C14" />
            <rect x="15" y="28" width="3" height="2" fill="#C4A48C" />
            <rect x="15" y="30" width="3" height="6" fill="#8F263D" />
            <rect x="15" y="31" width="2" height="4" fill="#C93B5B" />
            <rect x="15" y="31" width="1" height="2" fill="#FFD6DF" />

            {/* Vial 2: Amber Alchemical Fire */}
            <rect x="20" y="30" width="5" height="8" fill="#100C14" />
            <rect x="21" y="29" width="3" height="2" fill="#C4A48C" />
            <rect x="21" y="31" width="3" height="6" fill="#C98736" />
            <rect x="21" y="32" width="2" height="4" fill="#E7A54A" />
            <rect x="21" y="32" width="1" height="2" fill="#FFF8E7" />

            {/* Vial 3: Violet Mana Ether */}
            <rect x="26" y="31" width="5" height="8" fill="#100C14" />
            <rect x="27" y="30" width="3" height="2" fill="#C4A48C" />
            <rect x="27" y="32" width="3" height="6" fill="#68429E" />
            <rect x="27" y="33" width="2" height="4" fill="#9B72CF" />
            <rect x="27" y="33" width="1" height="2" fill="#F2E6FF" />

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

            {/* Gloved Hand & Bubbling Emerald Potion Flask (Right) */}
            <g>
              {/* Flask Neck & Cork */}
              <rect x="36" y="21" width="6" height="5" fill="#100C14" />
              <rect x="37" y="22" width="4" height="3" fill="#8CA8A6" />
              <rect x="37" y="22" width="1" height="2" fill="#FFFFFF" />

              {/* Round Glass Flask Bulb */}
              <rect x="33" y="25" width="12" height="13" fill="#100C14" />
              <rect x="34" y="26" width="10" height="11" fill="#2A4745" />
              {/* Bubbling Glowing Emerald Liquid */}
              <rect x="34" y="29" width="10" height="8" fill="#2D6E48" />
              <rect x="35" y="29" width="8" height="7" fill="#5EA87A" />
              <rect x="35" y="29" width="8" height="2" fill="#A8F0C2" />
              {/* Glass Specular Reflection */}
              <rect x="35" y="27" width="1" height="7" fill="#FFFFFF" />
              <rect x="36" y="34" width="2" height="1" fill="#FFFFFF" />

              {/* Leather-Gloved Hand Holding Flask */}
              <rect x="31" y="30" width="5" height="6" fill="#100C14" />
              <rect x="32" y="31" width="4" height="4" fill="#42291B" />
              <rect x="32" y="31" width="3" height="2" fill="#633F2A" />

              {/* Occasional Rising Alchemy Bubbles */}
              <g className="animate-cripta-flask-bubble">
                <rect x="38" y="26" width="2" height="2" fill="#A8F0C2" />
                <rect x="37" y="18" width="2" height="2" fill="#5EA87A" />
                <rect x="40" y="15" width="2" height="2" fill="#A8F0C2" />
              </g>
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
