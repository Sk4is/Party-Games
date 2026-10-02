/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LA CRIPTA — CANONICAL CHARACTER & CLASS CONTRACT (SCHEMA V2)
 *
 * Authoritative single source of truth for playable character IDs,
 * schema versioning, unaccented ASCII identifiers, alias normalization,
 * and contract integrity validation.
 */

export const LA_CRIPTA_SCHEMA_VERSION = 2;

/**
 * The 9 Canonical Playable Character IDs in La Cripta.
 * Internal IDs are stable unaccented lowercase ASCII keys.
 */
export const ALL_CRIPTA_CHARACTER_IDS = [
  'caballero',
  'mago',
  'picaro',
  'cazador',
  'clerigo',
  'alquimista',
  'barbaro',
  'bardo',
  'nigromante',
] as const;

export type CriptaCharacterId = (typeof ALL_CRIPTA_CHARACTER_IDS)[number];

/**
 * Canonical uppercase ASCII identifiers (contract standard).
 */
export const ALL_CRIPTA_UPPERCASE_IDS = [
  'CABALLERO',
  'MAGO',
  'PICARO',
  'CAZADOR',
  'CLERIGO',
  'ALQUIMISTA',
  'BARBARO',
  'BARDO',
  'NIGROMANTE',
] as const;

export type CriptaCanonicalUppercaseId = (typeof ALL_CRIPTA_UPPERCASE_IDS)[number];

/**
 * Display names in Spanish with appropriate orthographic accents.
 */
export const CRIPTA_CHARACTER_DISPLAY_NAMES: Record<CriptaCharacterId, string> = {
  caballero: 'CABALLERO',
  mago: 'MAGO',
  picaro: 'PÍCARO',
  cazador: 'CAZADOR',
  clerigo: 'CLÉRIGO',
  alquimista: 'ALQUIMISTA',
  barbaro: 'BÁRBARO',
  bardo: 'BARDO',
  nigromante: 'NIGROMANTE',
};

/**
 * Explicit migration and legacy alias map.
 * Ensures that accented names (BÁRBARO, PÍCARO, CLÉRIGO),
 * English class names (BARBARIAN, BARD, NECROMANCER, etc.),
 * and legacy identifiers (BRUJA, CAZADORA) always resolve
 * to their single canonical ASCII identifier.
 */
export const CRIPTA_CHARACTER_ALIASES: Record<string, CriptaCharacterId> = {
  // Bárbaro
  barbaro: 'barbaro',
  barbarian: 'barbaro',
  berserker: 'barbaro',
  // Bardo
  bardo: 'bardo',
  bard: 'bardo',
  trovador: 'bardo',
  minstrel: 'bardo',
  // Nigromante
  nigromante: 'nigromante',
  necromancer: 'nigromante',
  nigro: 'nigromante',
  // Caballero
  caballero: 'caballero',
  knight: 'caballero',
  warrior: 'caballero',
  paladin: 'caballero',
  // Mago / Bruja
  mago: 'mago',
  mage: 'mago',
  wizard: 'mago',
  bruja: 'mago',
  witch: 'mago',
  sorcerer: 'mago',
  // Pícaro
  picaro: 'picaro',
  rogue: 'picaro',
  thief: 'picaro',
  assassin: 'picaro',
  // Cazador / Cazadora
  cazador: 'cazador',
  cazadora: 'cazador',
  hunter: 'cazador',
  ranger: 'cazador',
  archer: 'cazador',
  // Clérigo
  clerigo: 'clerigo',
  cleric: 'clerigo',
  priest: 'clerigo',
  healer: 'clerigo',
  // Alquimista
  alquimista: 'alquimista',
  alchemist: 'alquimista',
};

/**
 * Normalizes any incoming character identifier (accented, uppercase, English alias,
 * legacy name, raw string) to the canonical unaccented ASCII CriptaCharacterId.
 *
 * Returns null if the identifier is genuinely invalid or unknown.
 */
export function normalizeCriptaCharacterId(raw: unknown): CriptaCharacterId | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  // 1. Direct match with canonical IDs
  if ((ALL_CRIPTA_CHARACTER_IDS as readonly string[]).includes(trimmed)) {
    return trimmed as CriptaCharacterId;
  }

  // 2. Strip diacritics / accents (e.g., 'bárbaro' -> 'barbaro', 'pícaro' -> 'picaro')
  const unaccented = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if ((ALL_CRIPTA_CHARACTER_IDS as readonly string[]).includes(unaccented)) {
    return unaccented as CriptaCharacterId;
  }

  // 3. Known aliases check (unaccented first, then trimmed)
  if (CRIPTA_CHARACTER_ALIASES[unaccented]) {
    return CRIPTA_CHARACTER_ALIASES[unaccented];
  }
  if (CRIPTA_CHARACTER_ALIASES[trimmed]) {
    return CRIPTA_CHARACTER_ALIASES[trimmed];
  }

  return null;
}

/**
 * Converts a canonical character ID into its canonical uppercase form.
 */
export function toCanonicalUppercaseId(id: CriptaCharacterId): CriptaCanonicalUppercaseId {
  switch (id) {
    case 'caballero':
      return 'CABALLERO';
    case 'mago':
      return 'MAGO';
    case 'picaro':
      return 'PICARO';
    case 'cazador':
      return 'CAZADOR';
    case 'clerigo':
      return 'CLERIGO';
    case 'alquimista':
      return 'ALQUIMISTA';
    case 'barbaro':
      return 'BARBARO';
    case 'bardo':
      return 'BARDO';
    case 'nigromante':
      return 'NIGROMANTE';
  }
}

/**
 * Validates consistency between canonical character IDs and all required registries.
 * Logs a clear development warning/error if any character is missing.
 */
export function assertCharacterRegistryCompleteness(
  characterCatalog: Record<string, unknown>,
  mechanicsRegistry?: Record<string, unknown>,
  starterWeapons?: Record<string, unknown>
): boolean {
  let isConsistent = true;

  for (const charId of ALL_CRIPTA_CHARACTER_IDS) {
    if (!characterCatalog[charId]) {
      console.error(
        `[LaCripta Contract Error] Missing character definition for '${charId}' in CRIPTA_CHARACTERS_CATALOG`
      );
      isConsistent = false;
    }
    if (mechanicsRegistry && !mechanicsRegistry[charId]) {
      console.error(
        `[LaCripta Contract Error] Missing class mechanics for '${charId}' in CRIPTA_CLASS_MECHANICS_REGISTRY`
      );
      isConsistent = false;
    }
    if (starterWeapons && !starterWeapons[charId]) {
      console.error(
        `[LaCripta Contract Error] Missing starter weapon for '${charId}' in STARTER_WEAPON_BY_CLASS`
      );
      isConsistent = false;
    }
  }

  return isConsistent;
}
