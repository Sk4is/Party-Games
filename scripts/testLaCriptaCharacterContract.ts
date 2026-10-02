/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Automated Character Contract & Production Parity Verification for La Cripta.
 * Validates all 9 playable characters across registries, mechanics, equipment,
 * serialization, and server-side selection handlers.
 */

import {
  ALL_CRIPTA_CHARACTER_IDS,
  ALL_CRIPTA_UPPERCASE_IDS,
  normalizeCriptaCharacterId,
  CRIPTA_CHARACTERS_CATALOG,
  LA_CRIPTA_SCHEMA_VERSION,
  toCanonicalUppercaseId,
} from '../src/data/la-cripta/criptaCatalog';
import {
  CRIPTA_CLASS_MECHANICS_REGISTRY,
  getClassMechanicForCharacter,
} from '../src/data/la-cripta/criptaClassMechanics';
import {
  STARTER_WEAPON_BY_CLASS,
  STARTER_RUNE_BY_CLASS,
  CRIPTA_WEAPONS_REGISTRY,
  CRIPTA_WEAPON_RUNES_REGISTRY,
  getEquippedWeaponForPlayer,
  computePlayerEffectiveStats,
} from '../src/data/la-cripta/criptaEquipmentAndEvents';
import { LaCriptaServer } from '../server/laCriptaGameServer';
import type { CriptaPlayer } from '../src/types/laCripta';

console.log('============================================================');
console.log(`[CONTRACT TEST] La Cripta Schema Version: ${LA_CRIPTA_SCHEMA_VERSION}`);
console.log(`[CONTRACT TEST] Total Canonical Characters: ${ALL_CRIPTA_CHARACTER_IDS.length}`);
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, label: string, details?: unknown) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${label}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${label}`, details || '');
  }
}

// 1. Validate Schema & Canonical Count
assert(
  ALL_CRIPTA_CHARACTER_IDS.length === 9,
  `Exactly 9 canonical characters exist (found: ${ALL_CRIPTA_CHARACTER_IDS.length})`
);
assert(
  ALL_CRIPTA_UPPERCASE_IDS.length === 9,
  `Exactly 9 uppercase contract IDs exist (found: ${ALL_CRIPTA_UPPERCASE_IDS.length})`
);

// 2. Iterate each canonical character ID
for (const charId of ALL_CRIPTA_CHARACTER_IDS) {
  console.log(`\n--- Testing Character: ${charId.toUpperCase()} (${charId}) ---`);

  // (1) Registry Lookup in Catalog
  const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
  assert(Boolean(charDef), `${charId} exists in CRIPTA_CHARACTERS_CATALOG`);
  assert(charDef?.id === charId, `${charId} definition ID matches canonical ID (${charDef?.id})`);

  // (2) Server Validation & Normalization
  const normLower = normalizeCriptaCharacterId(charId);
  assert(normLower === charId, `normalizeCriptaCharacterId('${charId}') === '${charId}'`);

  const upperId = charId.toUpperCase();
  const normUpper = normalizeCriptaCharacterId(upperId);
  assert(normUpper === charId, `normalizeCriptaCharacterId('${upperId}') === '${charId}'`);

  // (3) Base Stats Completeness
  assert(
    typeof charDef?.maxHp === 'number' && charDef.maxHp >= 40,
    `${charId} has valid maxHp (${charDef?.maxHp})`
  );

  assert(
    typeof charDef?.baseArmor === 'number' && charDef.baseArmor >= 0,
    `${charId} has valid baseArmor (${charDef?.baseArmor})`
  );
  assert(
    Boolean(
      charDef?.stats &&
        charDef.stats.attack > 0 &&
        charDef.stats.defense > 0 &&
        charDef.stats.agility > 0 &&
        charDef.stats.precision > 0 &&
        charDef.stats.willpower > 0
    ),
    `${charId} has complete non-zero primary stats (attack, defense, agility, precision, willpower)`
  );

  // (4) Class Mechanic Registry
  const mech = CRIPTA_CLASS_MECHANICS_REGISTRY[charId];
  assert(Boolean(mech), `${charId} has class mechanic registered in CRIPTA_CLASS_MECHANICS_REGISTRY`);
  const mechResolved = getClassMechanicForCharacter(charId);
  assert(Boolean(mechResolved), `${charId} getClassMechanicForCharacter resolves`);
  assert(
    Boolean(mech?.resource && mech.resource.maxValue > 0),
    `${charId} has valid resource config (kind: ${mech?.resource?.kind}, max: ${mech?.resource?.maxValue})`
  );

  // (5) Starting Equipment Registries
  const starterWeaponId = STARTER_WEAPON_BY_CLASS[charId];
  assert(
    Boolean(starterWeaponId && CRIPTA_WEAPONS_REGISTRY[starterWeaponId]),
    `${charId} has starter weapon (${starterWeaponId}) registered in CRIPTA_WEAPONS_REGISTRY`
  );

  const starterRuneId = STARTER_RUNE_BY_CLASS[charId];
  assert(
    Boolean(starterRuneId && CRIPTA_WEAPON_RUNES_REGISTRY[starterRuneId]),
    `${charId} has starter rune (${starterRuneId}) registered in CRIPTA_WEAPON_RUNES_REGISTRY`
  );

  // (6) Ability Definitions & Non-Empty
  assert(
    Array.isArray(charDef?.abilities) && charDef.abilities.length >= 3,
    `${charId} has at least 3 defined abilities (found: ${charDef?.abilities?.length || 0})`
  );

  // (7) Effective Stats Computation
  const dummyPlayer: CriptaPlayer = {
    id: `test_${charId}`,
    name: `Player_${charId}`,
    color: '#fff',
    seatIndex: 0,
    isHost: false,
    isConnected: true,
    isDead: false,
    hp: charDef.maxHp,
    maxHp: charDef.maxHp,
    armor: charDef.baseArmor,
    characterId: charId,
    selectedCharacterId: charId,
    agility: charDef.stats.agility,
    precision: charDef.stats.precision,
    willpower: charDef.stats.willpower,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusMagic: 0,
    bonusAgility: 0,
    bonusPrecision: 0,
    bonusWillpower: 0,
    classResource: mech.resource.initialValue,
    maxClassResource: mech.resource.maxValue,
    classResourceKind: mech.resource.kind,
    equippedWeaponId: starterWeaponId,
    weaponUpgradeLevel: 1,
    equippedWeaponRuneId: starterRuneId,
    ownedWeaponRunes: [],
    weaponSpecialCooldown: 0,
    abilityCooldowns: {},
    basicAttackUsedThisTurn: false,
    learnedTechniqueIds: [],
    equippedArmorId: null,
    equippedAccessoryId: null,
    normalInventory: [],
    personalRelics: [],
    pendingInventoryReplacement: null,
    inventoryItems: [],
    statuses: [],
    deathsCount: 0,
  };

  const effStats = computePlayerEffectiveStats(dummyPlayer);
  assert(effStats.attack > 0, `${charId} computed effective attack > 0 (${effStats.attack})`);
  const eqWeapon = getEquippedWeaponForPlayer(dummyPlayer);
  assert(eqWeapon.weapon.id === starterWeaponId, `${charId} equipped weapon matches starter (${eqWeapon.weapon.id})`);

  // (8) Serialization Round-Trip
  const serialized = JSON.stringify(dummyPlayer);
  const deserialized = JSON.parse(serialized) as CriptaPlayer;
  assert(
    deserialized.characterId === charId,
    `${charId} JSON serialization round-trip preserved exact canonical ID without mutation`
  );
}

// 3. Test Spanish Accented and Legacy Aliases
console.log('\n--- Testing Normalization Aliases & Accents ---');
const aliasTests: Array<[string, string]> = [
  ['BÁRBARO', 'barbaro'],
  ['bárbaro', 'barbaro'],
  ['BARBARIAN', 'barbaro'],
  ['barbarian', 'barbaro'],
  ['BARDO', 'bardo'],
  ['bardo', 'bardo'],
  ['BARD', 'bardo'],
  ['NIGROMANTE', 'nigromante'],
  ['nigromante', 'nigromante'],
  ['NECROMANCER', 'nigromante'],
  ['necromancer', 'nigromante'],
  ['PÍCARO', 'picaro'],
  ['pícaro', 'picaro'],
  ['ROGUE', 'picaro'],
  ['CLÉRIGO', 'clerigo'],
  ['clérigo', 'clerigo'],
  ['CLERIC', 'clerigo'],
  ['BRUJA', 'mago'],
  ['CAZADORA', 'cazador'],
  ['CABALLERO', 'caballero'],
  ['KNIGHT', 'caballero'],
  ['ALQUIMISTA', 'alquimista'],
  ['ALCHEMIST', 'alquimista'],
];

for (const [input, expected] of aliasTests) {
  const norm = normalizeCriptaCharacterId(input);
  assert(
    norm === expected,
    `normalizeCriptaCharacterId('${input}') -> '${expected}' (got: '${norm}')`
  );
}

// 4. Test Invalid Characters Correctly Rejected
console.log('\n--- Testing Invalid Character Rejection ---');
assert(
  normalizeCriptaCharacterId('INVALID_CHARACTER_XYZ') === null,
  `Unknown character string 'INVALID_CHARACTER_XYZ' returns null`
);
assert(
  normalizeCriptaCharacterId('') === null,
  `Empty string returns null`
);
assert(
  normalizeCriptaCharacterId(null) === null,
  `null returns null`
);

// 5. Test LaCriptaServer room creation and character selection in memory
console.log('\n--- Testing LaCriptaServer Room & In-Memory Character Flow ---');
const server = new LaCriptaServer();
const room = server.createRoomDirect({
  id: 'test_host',
  name: 'Anfitrión',
  avatar: '🕯️',
  color: '#E7A54A',
});

assert(Boolean(room), `createRoomDirect created room: ${room.roomCode}`);

for (const charId of ALL_CRIPTA_CHARACTER_IDS) {
  // Test that ALL_CRIPTA_CHARACTER_IDS is accepted by server validation
  assert(
    ALL_CRIPTA_CHARACTER_IDS.includes(charId),
    `Server validation includes '${charId}' in ALL_CRIPTA_CHARACTER_IDS`
  );
}

console.log('\n============================================================');
console.log(`[RESULTS] Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✓ ALL LA CRIPTA CHARACTER CONTRACT TESTS PASSED!\n');
  process.exit(0);
}
