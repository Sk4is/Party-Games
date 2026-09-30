import React from 'react';
import {
  CriptaDungeonDefinition,
  CriptaDungeonRoom,
  CriptaRoomEnemy,
} from '../../types/laCripta';

interface LaCriptaEnemyPixelSpriteProps {
  enemy: CriptaRoomEnemy;
  isTargeted?: boolean;
  animState?: 'idle' | 'hit' | 'lunge' | 'death';
  totalVisibleEnemies?: number;
}

/**
 * Crisp 28x28 pixel-art enemy & boss sprite renderer.
 * Scaled up for the Left Encounter Stage (Section 2: Large Enemies / NPCs).
 */
export const LaCriptaEnemyPixelSprite: React.FC<LaCriptaEnemyPixelSpriteProps> = ({
  enemy,
  isTargeted = false,
  animState = 'idle',
  totalVisibleEnemies = 1,
}) => {
  const baseSizePx = enemy.isFinalBoss
    ? 176
    : enemy.isMiniboss || enemy.isBoss
    ? 154
    : enemy.isElite
    ? 124
    : 108;
  const crowdScale =
    totalVisibleEnemies >= 3 ? 0.78 : totalVisibleEnemies === 2 ? 0.9 : 1;
  const sizePx = Math.round(baseSizePx * crowdScale);
  const accent = enemy.enrageTriggered
    ? '#FF4D6D'
    : enemy.accentColor || '#E7A54A';
  const arch = enemy.spriteArchetype;

  const animClass =
    animState === 'death'
      ? 'animate-cripta-enemy-death'
      : animState === 'hit'
      ? 'animate-cripta-enemy-hit'
      : animState === 'lunge'
      ? 'animate-cripta-enemy-lunge'
      : 'animate-cripta-sprite-idle';

  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 28 28"
      shapeRendering="crispEdges"
      className={`transition-transform duration-200 select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.92)] ${animClass} ${
        isTargeted ? 'scale-105' : ''
      }`}
    >
      {/* Ground shadow & Enrage Crimson Ring */}
      <rect x="5" y="25" width="18" height="2" fill="#050408" opacity="0.85" />
      {enemy.enrageTriggered && (
        <g opacity="0.85">
          <rect x="3" y="24" width="22" height="1" fill="#C93B5B" />
          <rect x="2" y="10" width="1" height="10" fill="#FFD166" />
          <rect x="25" y="10" width="1" height="10" fill="#FFD166" />
        </g>
      )}

      {/* Miniboss / Boss / Elite Crown or Horns */}
      {(enemy.isBoss || enemy.isMiniboss) && (
        <g>
          <rect x="6" y="1" width="2" height="4" fill="#FFD166" />
          <rect x="13" y="0" width="2" height="5" fill="#E7A54A" />
          <rect x="20" y="1" width="2" height="4" fill="#FFD166" />
          <rect
            x="6"
            y="4"
            width="16"
            height="2"
            fill={enemy.enrageTriggered ? '#C93B5B' : '#8F263D'}
          />
        </g>
      )}
      {enemy.isElite && !enemy.isBoss && !enemy.isMiniboss && (
        <g>
          <rect x="6" y="3" width="3" height="2" fill={accent} />
          <rect x="19" y="3" width="3" height="2" fill={accent} />
        </g>
      )}

      {/* Archetype Group 1: Undead / Skeleton / Executioner / Bone Colossus */}
      {(arch === 'skeleton_warrior' ||
        arch === 'executioner' ||
        arch === 'chained_wraith' ||
        arch === 'bone_colossus') && (
        <g>
          {/* Skull Head */}
          <rect x="10" y="5" width="8" height="6" fill="#D9D0BC" />
          <rect x="11" y="11" width="6" height="2" fill="#B8AC93" />
          {/* Glowing Eyes */}
          <rect x="11" y="7" width="2" height="2" fill="#0B0A0E" />
          <rect x="15" y="7" width="2" height="2" fill="#0B0A0E" />
          <rect x="11" y="7" width="1" height="1" fill={accent} />
          <rect x="15" y="7" width="1" height="1" fill={accent} />
          {/* Ribcage & Armor */}
          <rect x="8" y="13" width="12" height="7" fill="#282039" />
          <rect x="10" y="14" width="8" height="1" fill="#D9D0BC" />
          <rect x="10" y="16" width="8" height="1" fill="#D9D0BC" />
          <rect x="10" y="18" width="8" height="1" fill="#D9D0BC" />
          {/* Heavy Cleaver / Greatsword */}
          <rect x="3" y="6" width="3" height="12" fill="#9A96A4" />
          <rect x="4" y="6" width="1" height="10" fill="#D9D0BC" />
          <rect x="2" y="18" width="5" height="2" fill="#E7A54A" />
          {/* Shield */}
          <rect x="20" y="13" width="5" height="8" fill="#4A3830" />
          <rect x="21" y="14" width="3" height="6" fill={accent} />
          {/* Legs */}
          <rect x="10" y="20" width="3" height="5" fill="#B8AC93" />
          <rect x="15" y="20" width="3" height="5" fill="#B8AC93" />
        </g>
      )}

      {/* Archetype Group 2: Beasts / Spores / Serpent / Swarm / Frost Wolf / Goblin */}
      {(arch === 'plague_bloom' ||
        arch === 'deep_serpent' ||
        arch === 'mine_stalker' ||
        arch === 'sewer_abomination' ||
        arch === 'chitin_drone' ||
        arch === 'frost_wolf' ||
        arch === 'goblin_raider') && (
        <g>
          {/* Hood / Carapace / Beast Crest */}
          <rect x="8" y="5" width="12" height="7" fill={accent} />
          <rect x="9" y="7" width="10" height="6" fill="#1E1826" />
          {/* Fierce Eyes & Fangs */}
          <rect x="10" y="8" width="2" height="2" fill="#E7A54A" />
          <rect x="16" y="8" width="2" height="2" fill="#E7A54A" />
          <rect x="11" y="11" width="1" height="2" fill="#D9D0BC" />
          <rect x="16" y="11" width="1" height="2" fill="#D9D0BC" />
          {/* Hunched Torso */}
          <rect x="7" y="13" width="14" height="8" fill="#2A2334" />
          <rect x="9" y="14" width="10" height="5" fill={accent} opacity="0.65" />
          {/* Claws / Jagged Blades */}
          <rect x="3" y="12" width="4" height="6" fill="#D9D0BC" />
          <rect x="21" y="12" width="4" height="6" fill="#D9D0BC" />
          {/* Legs */}
          <rect x="9" y="21" width="4" height="4" fill="#1A1520" />
          <rect x="15" y="21" width="4" height="4" fill="#1A1520" />
        </g>
      )}

      {/* Archetype Group 3: Construct / Arcane / Crystal / Void / Blood / Mirror */}
      {(arch === 'iron_golem' ||
        arch === 'wisp_phantom' ||
        arch === 'arcane_archivist' ||
        arch === 'astral_weaver' ||
        arch === 'crystal_sentinel' ||
        arch === 'blood_acolyte' ||
        arch === 'sand_mummy' ||
        arch === 'mirror_doppel' ||
        arch === 'void_herald') && (
        <g>
          {/* Arcane Halo / Monolith Helm */}
          <rect x="9" y="4" width="10" height="8" fill="#282039" />
          <rect x="10" y="5" width="8" height="6" fill={accent} />
          <rect x="12" y="7" width="4" height="2" fill="#0B0A0E" />
          <rect x="13" y="7" width="2" height="2" fill="#FFFFFF" />
          {/* Robed / Armored Body */}
          <rect x="7" y="12" width="14" height="10" fill="#19111D" />
          <rect x="9" y="13" width="10" height="8" fill="#282039" />
          <rect x="12" y="14" width="4" height="5" fill={accent} />
          {/* Floating Staff / Scepter */}
          <rect x="4" y="5" width="2" height="18" fill="#D8C6A0" />
          <rect x="3" y="3" width="4" height="4" fill={accent} />
          {/* Floating Orb on Right */}
          <rect x="22" y="9" width="4" height="4" fill={accent} />
          <rect x="23" y="10" width="2" height="2" fill="#FFFFFF" />
          {/* Base */}
          <rect x="9" y="22" width="10" height="3" fill="#120D17" />
        </g>
      )}

      {/* Archetype Group 4: Final Boss Phase 1 (Malkorath, Soberano Encadenado) */}
      {arch === 'final_boss_phase1' && (
        <g>
          {/* Runic Chains Binding Shoulders */}
          <rect x="1" y="9" width="26" height="2" fill="#E7A54A" />
          <rect x="3" y="15" width="22" height="2" fill="#E7A54A" />
          {/* Armored Sovereign Helm */}
          <rect x="8" y="4" width="12" height="7" fill="#2A1C3B" />
          <rect x="9" y="5" width="10" height="5" fill="#D8C6A0" />
          <rect x="10" y="7" width="3" height="2" fill="#C93B5B" />
          <rect x="15" y="7" width="3" height="2" fill="#C93B5B" />
          {/* Heavy Obsidian Mantle & Core Seal */}
          <rect x="5" y="11" width="18" height="11" fill="#19111D" />
          <rect x="7" y="12" width="14" height="9" fill="#3D2754" />
          <rect x="11" y="13" width="6" height="6" fill="#E7A54A" />
          <rect x="12" y="14" width="4" height="4" fill="#8F263D" />
          {/* Dual Runeblades */}
          <rect x="2" y="6" width="3" height="16" fill="#D9D0BC" />
          <rect x="23" y="6" width="3" height="16" fill="#D9D0BC" />
          {/* Base */}
          <rect x="8" y="22" width="12" height="3" fill="#0B0A0E" />
        </g>
      )}

      {/* Archetype Group 5: Final Boss Phase 2 (El Corazón Desatado de la Cripta) */}
      {arch === 'final_boss_phase2' && (
        <g>
          {/* Unfurled Abyssal Wings */}
          <rect x="0" y="4" width="7" height="16" fill="#541826" />
          <rect x="2" y="6" width="5" height="12" fill="#C93B5B" />
          <rect x="21" y="4" width="7" height="16" fill="#541826" />
          <rect x="21" y="6" width="5" height="12" fill="#C93B5B" />
          {/* Crowned Eclipse Head */}
          <rect x="9" y="3" width="10" height="7" fill="#160E20" />
          <rect x="10" y="5" width="3" height="2" fill="#FFD166" />
          <rect x="15" y="5" width="3" height="2" fill="#FFD166" />
          {/* Exposed Pulsing Heart Core */}
          <rect x="7" y="10" width="14" height="12" fill="#2A1221" />
          <rect x="9" y="11" width="10" height="10" fill="#C93B5B" />
          <rect x="11" y="13" width="6" height="6" fill="#FFD166" />
          <rect x="13" y="15" width="2" height="2" fill="#FFFFFF" />
          {/* Shattered Chain Fragments */}
          <rect x="4" y="21" width="4" height="2" fill="#E7A54A" />
          <rect x="20" y="21" width="4" height="2" fill="#E7A54A" />
        </g>
      )}
    </svg>
  );
};

interface LaCriptaRoomEnvironmentCanvasProps {
  dungeon: CriptaDungeonDefinition;
  room: CriptaDungeonRoom;
  canAdvance: boolean;
  unclaimedDropsCount?: number;
  onClickExitArchway: () => void;
  onClickSecretHook?: () => void;
  onClickInteractiveObject?: (objectId: string) => void;
  className?: string;
}

/**
 * Illustrated Pixel-Art Chamber Environment Canvas (240x136 crisp SVG).
 * Renders the biome walls, perspective flagstones, torches/particles,
 * room-type specific architectural centerpiece, interactive room objects,
 * secret rune hook, and the interactive exit doorway on the right.
 */
export const LaCriptaRoomEnvironmentCanvas: React.FC<LaCriptaRoomEnvironmentCanvasProps> = ({
  dungeon,
  room,
  canAdvance,
  unclaimedDropsCount = 0,
  onClickExitArchway,
  onClickSecretHook,
  onClickInteractiveObject,
  className = '',
}) => {
  const { stone, stoneDark, highlight, glow, fog, secondary } = dungeon.palette;
  const rType = room.type;
  const isMinibossChamber = rType === 'MINIBOSS' || Boolean(room.isMinibossRoom);
  const hasLivingEnemies = room.enemies && room.enemies.some((e) => e.hp > 0);

  return (
    <div
      className={`relative w-full h-full min-h-[240px] sm:min-h-[310px] overflow-hidden border-2 border-[#282039] bg-[#07060A] flex flex-col justify-between ${className}`}
    >
      <svg
        viewBox="0 0 240 124"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        className="w-full h-full min-h-[240px] sm:min-h-[310px] block select-none"
      >
        {/* 1. Deep Background Cavern / Vault Skybox */}
        <rect x="0" y="0" width="240" height="108" fill={stoneDark} />
        <rect x="8" y="6" width="224" height="66" fill={stone} opacity="0.85" />
        <rect x="16" y="12" width="208" height="56" fill={fog} opacity="0.38" />

        {/* 2. Stone Brick Courses & Columns along Back Wall */}
        {[24, 68, 116, 164].map((colX, idx) => (
          <g key={idx}>
            <rect x={colX} y="8" width="12" height="62" fill={stoneDark} />
            <rect x={colX + 2} y="8" width="8" height="62" fill={stone} />
            <rect x={colX} y="8" width="12" height="4" fill={highlight} opacity="0.35" />
            <rect x={colX} y="66" width="12" height="4" fill={highlight} opacity="0.35" />
            {/* Wall Sconce / Torch between columns */}
            <rect x={colX + 24} y="24" width="4" height="8" fill="#3B2A1E" />
            <rect x={colX + 23} y="20" width="6" height="4" fill={glow} />
            <rect x={colX + 24} y="18" width="4" height="3" fill="#FFF3C4" />
          </g>
        ))}

        {/* 3. Perspective Flagstone Floor (y=70..108) */}
        <rect x="0" y="70" width="240" height="38" fill={stoneDark} />
        <rect x="0" y="70" width="240" height="2" fill={highlight} opacity="0.35" />
        {[0, 30, 60, 90, 120, 150, 180, 210].map((fx) => (
          <g key={fx}>
            <rect x={fx + 2} y="74" width="26" height="10" fill={stone} opacity="0.75" />
            <rect x={fx + 6} y="86" width="24" height="10" fill={stone} opacity="0.55" />
            <rect x={fx} y="98" width="28" height="8" fill={stone} opacity="0.4" />
          </g>
        ))}

        {/* 4. Biome-Specific Environmental Details */}
        {dungeon.artTheme.ambientEffect === 'spores' && (
          <g fill={glow} opacity="0.75">
            <rect x="45" y="34" width="2" height="2" />
            <rect x="95" y="22" width="2" height="2" />
            <rect x="145" y="42" width="2" height="2" />
            <rect x="180" y="28" width="2" height="2" />
          </g>
        )}
        {dungeon.artTheme.ambientEffect === 'embers' && (
          <g>
            <rect x="0" y="102" width="240" height="6" fill={secondary} opacity="0.7" />
            <rect x="52" y="48" width="2" height="2" fill={glow} />
            <rect x="128" y="32" width="2" height="2" fill={glow} />
          </g>
        )}
        {dungeon.artTheme.ambientEffect === 'water_drips' && (
          <g>
            <rect x="0" y="101" width="240" height="7" fill={glow} opacity="0.35" />
            <rect x="88" y="16" width="1" height="14" fill={glow} opacity="0.6" />
            <rect x="154" y="20" width="1" height="16" fill={glow} opacity="0.6" />
          </g>
        )}

        {/* 5. Room Category Physical Centerpiece */}
        {rType === 'TREASURE' && (
          <g>
            {/* Stone Dais + Ornate Gold Chest */}
            <rect x="96" y="64" width="44" height="8" fill={highlight} opacity="0.4" />
            <rect x="104" y="48" width="28" height="16" fill="#6E3B1E" />
            <rect x="104" y="48" width="28" height="4" fill="#E7A54A" />
            <rect x="104" y="56" width="28" height="2" fill="#E7A54A" />
            <rect x="115" y="53" width="6" height="6" fill="#FFF3C4" />
          </g>
        )}

        {rType === 'LOOT' && (
          <g>
            {/* Supply Pack + Glowing Vials + Gold */}
            <rect x="104" y="56" width="16" height="14" fill="#6E472B" />
            <rect x="108" y="58" width="8" height="4" fill="#E7A54A" />
            <rect x="124" y="60" width="6" height="10" fill="#69A8A5" />
            <rect x="96" y="64" width="6" height="6" fill="#E7A54A" />
          </g>
        )}

        {rType === 'REST' && (
          <g>
            {/* Flickering Campfire in the Chamber Center */}
            <rect x="102" y="66" width="32" height="6" fill="#3B2618" />
            <rect x="106" y="64" width="24" height="4" fill="#8F263D" />
            <rect x="110" y="52" width="16" height="12" fill="#E7A54A" />
            <rect x="114" y="44" width="8" height="10" fill="#FFF3C4" />
            <rect x="116" y="38" width="4" height="6" fill={glow} />
          </g>
        )}

        {rType === 'SHRINE' && (
          <g>
            {/* Sacred Altar & Chalice */}
            <rect x="100" y="58" width="36" height="14" fill={highlight} opacity="0.7" />
            <rect x="108" y="44" width="20" height="14" fill={stoneDark} />
            <rect x="112" y="34" width="12" height="10" fill={glow} />
            <rect x="115" y="26" width="6" height="6" fill="#FFF3C4" />
          </g>
        )}

        {rType === 'SHOP' && (
          <g>
            {/* Merchant Booth & Lantern */}
            <rect x="92" y="56" width="52" height="16" fill="#4A2533" />
            <rect x="92" y="56" width="52" height="3" fill="#E7A54A" />
            {/* Hooded Merchant Silhouette */}
            <rect x="112" y="36" width="12" height="20" fill="#19111D" />
            <rect x="115" y="40" width="2" height="2" fill="#E7A54A" />
            <rect x="119" y="40" width="2" height="2" fill="#E7A54A" />
            {/* Wares on table */}
            <rect x="98" y="50" width="5" height="6" fill="#C93B5B" />
            <rect x="106" y="49" width="6" height="7" fill="#69A8A5" />
            <rect x="130" y="50" width="6" height="6" fill="#E7A54A" />
          </g>
        )}

        {rType === 'TRAP' && (
          <g>
            {/* Mechanical Floor Spikes & Chains */}
            {[86, 98, 110, 122, 134, 146].map((sx) => (
              <g key={sx}>
                <rect x={sx} y="60" width="4" height="12" fill="#B8AC93" />
                <rect x={sx + 1} y="56" width="2" height="4" fill="#C93B5B" />
              </g>
            ))}
          </g>
        )}

        {rType === 'PUZZLE' && (
          <g>
            {/* 3 Ancient Rune Obelisks */}
            {[92, 114, 136].map((rx, idx) => {
              const isLit =
                room.puzzleRunes?.solved ||
                room.puzzleRunes?.currentInput.includes(idx);
              return (
                <g key={rx}>
                  <rect x={rx} y="42" width="12" height="28" fill={stoneDark} />
                  <rect
                    x={rx + 2}
                    y="46"
                    width="8"
                    height="12"
                    fill={isLit ? glow : '#282039'}
                  />
                  {isLit && (
                    <rect x={rx + 4} y="48" width="4" height="6" fill="#FFF3C4" />
                  )}
                </g>
              );
            })}
          </g>
        )}

        {rType === 'DECISION' && (
          <g>
            {/* Twin Forked Stone Passages */}
            <rect x="86" y="28" width="26" height="42" fill="#050408" />
            <rect x="84" y="26" width="30" height="4" fill={glow} />
            <rect x="126" y="28" width="26" height="42" fill="#050408" />
            <rect x="124" y="26" width="30" height="4" fill={highlight} />
          </g>
        )}

        {isMinibossChamber && (
          <g>
            {/* Ominous Miniboss Warden Dais, Runic Seal & Crimson Skull Braziers */}
            <rect x="64" y="66" width="108" height="6" fill="#2A0F1B" />
            <rect x="72" y="68" width="92" height="2" fill="#C93B5B" />
            {/* Left & Right Warden Braziers */}
            <rect x="52" y="38" width="10" height="32" fill={stoneDark} />
            <rect x="50" y="34" width="14" height="6" fill="#E7A54A" />
            <rect x="53" y="26" width="8" height="8" fill="#C93B5B" />
            <rect x="55" y="28" width="4" height="4" fill="#FFD166" />

            <rect x="174" y="38" width="10" height="32" fill={stoneDark} />
            <rect x="172" y="34" width="14" height="6" fill="#E7A54A" />
            <rect x="175" y="26" width="8" height="8" fill="#C93B5B" />
            <rect x="177" y="28" width="4" height="4" fill="#FFD166" />
          </g>
        )}

        {(rType === 'EVENT' || rType === 'SECRET') && !hasLivingEnemies && (
          <g className="animate-cripta-sprite-idle">
            {/* Large Focal Event Figure / Pedestal / NPC in Left Stage */}
            <rect x="88" y="64" width="56" height="8" fill={highlight} opacity="0.4" />
            {room.encounterSubject ? (
              <g>
                {/* Large Hooded / Chained / Spectral NPC Figure */}
                <rect x="100" y="20" width="32" height="46" fill="#0B0A0E" />
                <rect x="103" y="22" width="26" height="42" fill="#282039" />
                <rect x="106" y="24" width="20" height="16" fill={glow} opacity="0.85" />
                <rect x="109" y="28" width="4" height="3" fill="#FFF3C4" />
                <rect x="119" y="28" width="4" height="3" fill="#FFF3C4" />
                {/* Chains / Staff / Lantern */}
                <rect x="92" y="32" width="8" height="3" fill="#E7A54A" />
                <rect x="132" y="32" width="8" height="3" fill="#E7A54A" />
                <rect x="136" y="22" width="4" height="38" fill="#D8C6A0" />
                <rect x="134" y="16" width="8" height="8" fill={highlight} />
              </g>
            ) : (
              <g>
                {/* Glowing Monolith / Secret Reliquary */}
                <rect x="102" y="22" width="28" height="44" fill={stoneDark} />
                <rect x="106" y="26" width="20" height="36" fill={glow} opacity="0.8" />
                <rect x="112" y="34" width="8" height="16" fill="#FFF3C4" />
              </g>
            )}
          </g>
        )}

        {/* 6. Right-Side Exit Archway (Interactive Doorway to Next Room) */}
        <g>
          <rect
            x="198"
            y="22"
            width="32"
            height="50"
            fill={canAdvance ? glow : stoneDark}
            opacity={canAdvance ? 0.9 : 0.7}
          />
          <rect
            x="202"
            y="26"
            width="24"
            height="46"
            fill={canAdvance ? '#07050A' : '#16111D'}
          />
          {canAdvance ? (
            <>
              {/* Descending Lit Steps inside Open Exit */}
              <rect x="206" y="42" width="16" height="4" fill={glow} opacity="0.65" />
              <rect x="205" y="50" width="18" height="4" fill={glow} opacity="0.8" />
              <rect x="204" y="58" width="20" height="4" fill={highlight} />
              <rect x="202" y="66" width="24" height="4" fill="#FFF3C4" />
            </>
          ) : (
            <>
              {/* Sealed Iron Bars while threat is active or loot is unclaimed */}
              <rect x="207" y="26" width="2" height="46" fill="#5A5268" />
              <rect x="213" y="26" width="2" height="46" fill="#5A5268" />
              <rect x="219" y="26" width="2" height="46" fill="#5A5268" />
              <rect x="202" y="46" width="24" height="3" fill="#8F263D" />
            </>
          )}
        </g>
      </svg>

      {/* Interactive Room Objects (Skulls, Cracked Walls, Mushrooms, Chalices, Skeletons - Section 16) */}
      {room.interactiveObjects &&
        room.interactiveObjects.length > 0 &&
        onClickInteractiveObject && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {room.interactiveObjects.map((obj) => (
              <button
                key={obj.id}
                type="button"
                disabled={obj.discovered}
                onClick={() => onClickInteractiveObject(obj.id)}
                style={{ left: `${obj.xPercent}%`, top: `${obj.yPercent}%` }}
                title={
                  obj.discovered
                    ? obj.outcomeSummary || `${obj.label} (Inspeccionado)`
                    : `${obj.label}: ${obj.hint}`
                }
                className={`pointer-events-auto -translate-x-1/2 -translate-y-1/2 px-2 py-1 border text-[9px] font-cripta-pixel transition-all flex items-center gap-1 shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${
                  obj.discovered
                    ? 'bg-[#09070D]/80 border-[#282039] text-[#D8C6A0]/45 cursor-default'
                    : 'bg-[#19111D]/95 hover:bg-[#2A1D33] border-[#E7A54A] hover:border-[#FFD166] text-[#FFD166] cursor-pointer hover:scale-105'
                }`}
              >
                <span>
                  {obj.objectKind === 'SKULL'
                    ? '💀'
                    : obj.objectKind === 'WALL_CRACK'
                    ? '🧱'
                    : obj.objectKind === 'MUSHROOM'
                    ? '🍄'
                    : obj.objectKind === 'CHALICE'
                    ? '🏆'
                    : '🦴'}
                </span>
                <span className="truncate max-w-[115px]">
                  {obj.discovered ? '✓ INSPECCIONADO' : obj.label}
                </span>
              </button>
            ))}
          </div>
        )}

      {/* Optional Secret Rune Trigger on Back Wall */}
      {room.secretHook && !room.secretHook.discovered && onClickSecretHook && (
        <button
          type="button"
          onClick={onClickSecretHook}
          title={room.secretHook.hint}
          className="absolute top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#19111D]/90 hover:bg-[#282039] border border-[#9B72CF] text-[9px] font-cripta-pixel text-[#9B72CF] animate-pulse cursor-pointer z-20"
        >
          ✦ RUNA OCULTA EN EL MURO
        </button>
      )}

      {/* Interactive Exit Threshold Button Overlay on Right Archway */}
      {unclaimedDropsCount > 0 && room.resolved ? (
        <div className="absolute right-2 sm:right-4 bottom-3 px-2.5 py-1 bg-[#261810]/95 border-2 border-[#FFD166] font-cripta-pixel text-[9px] sm:text-[10px] font-bold text-[#FFD166] animate-pulse z-20">
          ⚠ RECOGE EL BOTÍN ({unclaimedDropsCount}) ANTES DE SALIR
        </div>
      ) : (
        canAdvance && (
          <button
            type="button"
            onClick={onClickExitArchway}
            className="absolute right-2 sm:right-4 bottom-3 px-3 py-1.5 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-[11px] sm:text-xs font-bold tracking-wider shadow-[0_0_20px_rgba(231,165,74,0.7)] transition-transform hover:scale-105 cursor-pointer z-20"
          >
            {isMinibossChamber ? 'CRUZAR SALIDA →' : 'CRUZAR PUERTA →'}
          </button>
        )
      )}
    </div>
  );
};
