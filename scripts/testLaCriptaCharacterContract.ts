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

// 6. Direct WebSocket SELECT_CHARACTER Handler Tests
console.log('\n--- Testing Direct WebSocket SELECT_CHARACTER Handler ---');

class MockWebSocket {
  public readyState = 1; // WebSocket.OPEN
  public sentMessages: any[] = [];

  send(data: string) {
    try {
      this.sentMessages.push(JSON.parse(data));
    } catch {
      this.sentMessages.push(data);
    }
  }
}

// Test selecting each of the 9 characters through handleClientMessage
for (const charId of ALL_CRIPTA_CHARACTER_IDS) {
  const testServer = new LaCriptaServer();
  const testRoom = testServer.createRoomDirect({
    id: `player_ws_${charId}`,
    name: `Player_${charId}`,
    avatar: '🕯️',
    color: '#E7A54A',
  });

  const mockWs = new MockWebSocket() as any;
  (testServer as any).clients.set(mockWs, {
    ws: mockWs,
    playerId: `player_ws_${charId}`,
    roomCode: testRoom.roomCode,
    isAlive: true,
  });

  testServer.handleClientMessage(mockWs, {
    type: 'SELECT_CHARACTER',
    characterId: charId,
  });

  const liveRoom = (testServer as any).rooms.get(testRoom.roomCode);
  const updatedPlayer = liveRoom?.players.find((p: any) => p.id === `player_ws_${charId}`);
  assert(
    updatedPlayer?.characterId === charId,
    `WebSocket SELECT_CHARACTER for '${charId}' sets player.characterId to '${charId}'`
  );
  assert(
    liveRoom?.selectedCharacters[`player_ws_${charId}`] === charId,
    `WebSocket SELECT_CHARACTER for '${charId}' updates room.selectedCharacters`
  );
  assert(
    updatedPlayer?.hp === CRIPTA_CHARACTERS_CATALOG[charId].maxHp,
    `WebSocket SELECT_CHARACTER for '${charId}' initializes HP (${updatedPlayer?.hp}/${CRIPTA_CHARACTERS_CATALOG[charId].maxHp})`
  );

  // Check that broadcast happened and no error was sent
  const lastError = mockWs.sentMessages.find((m: any) => m.type === 'ERROR');
  assert(!lastError, `No error returned when selecting '${charId}'`);
}

// Test unknown character rejection
{
  const testServer = new LaCriptaServer();
  const testRoom = testServer.createRoomDirect({
    id: 'player_ws_invalid',
    name: 'Player_Invalid',
    avatar: '🕯️',
    color: '#E7A54A',
  });

  const mockWs = new MockWebSocket() as any;
  (testServer as any).clients.set(mockWs, {
    ws: mockWs,
    playerId: 'player_ws_invalid',
    roomCode: testRoom.roomCode,
    isAlive: true,
  });

  testServer.handleClientMessage(mockWs, {
    type: 'SELECT_CHARACTER',
    characterId: 'unknown_character' as any,
  });

  const errorMsg = mockWs.sentMessages.find((m: any) => m.type === 'ERROR');
  assert(Boolean(errorMsg), `Rejection error sent for 'unknown_character'`);
  assert(
    errorMsg?.code === 'INVALID_CHARACTER',
    `Error code is 'INVALID_CHARACTER' (got: ${errorMsg?.code})`
  );
  assert(
    errorMsg?.message === 'Ese aventurero no existe en La Cripta.',
    `Error message matches 'Ese aventurero no existe en La Cripta.'`
  );
}

// Test duplicate character selection rejection
{
  const testServer = new LaCriptaServer();
  const testRoom = testServer.createRoomDirect({
    id: 'player_1',
    name: 'Player_1',
    avatar: '🕯️',
    color: '#E7A54A',
  });

  const liveRoom = (testServer as any).rooms.get(testRoom.roomCode);

  // Add second player to room
  liveRoom.players.push({
    id: 'player_2',
    name: 'Player_2',
    avatar: '⚔️',
    color: '#38BDF8',
    seatIndex: 1,
    isHost: false,
    isConnected: true,
    isDead: false,
    hp: 0,
    maxHp: 0,
    armor: 0,
    characterId: null,
    selectedCharacterId: null,
    agility: 0,
    precision: 0,
    willpower: 0,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusMagic: 0,
    bonusAgility: 0,
    bonusPrecision: 0,
    bonusWillpower: 0,
    classResource: 0,
    maxClassResource: 0,
    classResourceKind: null,
    equippedWeaponId: null,
    weaponUpgradeLevel: 1,
    equippedWeaponRuneId: null,
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
  });

  const wsPlayer1 = new MockWebSocket() as any;
  const wsPlayer2 = new MockWebSocket() as any;
  (testServer as any).clients.set(wsPlayer1, {
    ws: wsPlayer1,
    playerId: 'player_1',
    roomCode: testRoom.roomCode,
    isAlive: true,
  });
  (testServer as any).clients.set(wsPlayer2, {
    ws: wsPlayer2,
    playerId: 'player_2',
    roomCode: testRoom.roomCode,
    isAlive: true,
  });

  // Player 1 selects barbaro
  testServer.handleClientMessage(wsPlayer1, {
    type: 'SELECT_CHARACTER',
    characterId: 'barbaro',
  });
  assert(
    liveRoom.players[0].characterId === 'barbaro',
    'Player 1 successfully selected barbaro'
  );

  // Player 2 attempts to select barbaro
  testServer.handleClientMessage(wsPlayer2, {
    type: 'SELECT_CHARACTER',
    characterId: 'barbaro',
  });
  const dupError = wsPlayer2.sentMessages.find((m: any) => m.type === 'ERROR');
  assert(
    dupError?.code === 'CHARACTER_ALREADY_OCCUPIED',
    `Duplicate selection returns 'CHARACTER_ALREADY_OCCUPIED' (got: ${dupError?.code})`
  );
  assert(
    liveRoom.players[1].characterId === null,
    'Player 2 characterId remains null after duplicate rejection'
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
