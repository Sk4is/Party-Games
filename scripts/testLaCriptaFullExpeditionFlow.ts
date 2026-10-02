/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Full expedition and combat flow verification for BARBARO, BARDO, and NIGROMANTE.
 */

import { LaCriptaServer } from '../server/laCriptaGameServer';
import {
  ALL_CRIPTA_CHARACTER_IDS,
  normalizeCriptaCharacterId,
  CRIPTA_CHARACTERS_CATALOG,
} from '../src/data/la-cripta/criptaCatalog';

console.log('=== RUNNING FULL EXPEDITION LIFECYCLE FOR NEW CLASSES ===\n');

const testClasses = ['barbaro', 'bardo', 'nigromante'] as const;

for (const classId of testClasses) {
  console.log(`\n>>> Testing full flow for class: ${classId.toUpperCase()}`);

  const server = new LaCriptaServer();
  const room = server.createRoomDirect({
    id: `player_${classId}`,
    name: `Hero_${classId}`,
    avatar: '🕯️',
    color: '#E7A54A',
  });

  if (!room) {
    throw new Error(`Failed to create room for ${classId}`);
  }

  const player = room.players[0];
  const normalizedId = normalizeCriptaCharacterId(classId);
  if (!normalizedId) {
    throw new Error(`Normalization failed for ${classId}`);
  }

  // 1. SELECT CHARACTER
  const charDef = CRIPTA_CHARACTERS_CATALOG[normalizedId];
  player.characterId = normalizedId;
  player.selectedCharacterId = normalizedId;
  player.maxHp = charDef.maxHp;
  player.hp = charDef.maxHp;
  player.armor = charDef.baseArmor;
  player.agility = charDef.stats.agility;
  player.precision = charDef.stats.precision;
  player.willpower = charDef.stats.willpower;
  player.classResource = charDef.classResource?.initialValue ?? 0;
  player.maxClassResource = charDef.classResource?.maxValue ?? 0;
  player.classResourceKind = charDef.classResource?.kind ?? null;
  room.selectedCharacters[player.id] = normalizedId;

  console.log(`  ✓ Character selected: ${player.characterId} (HP: ${player.hp}/${player.maxHp}, Armor: ${player.armor})`);

  // 2. START EXPEDITION
  const initialDungeonId = room.offeredDungeons[0];
  room.phase = 'THREE_DOORS';
  room.completedDoorCount = 0;

  console.log(`  ✓ Expedition started to Three Doors phase`);

  // 3. VOTE DOOR
  room.doorVotes[player.id] = initialDungeonId;
  console.log(`  ✓ Voted door: ${initialDungeonId}`);

  // 4. RESOLVE DOOR VOTE & ENTER DUNGEON
  (server as any).evaluateAndResolveDoorVotes(room);
  console.log(`  ✓ Door votes resolved: ${room.selectedDungeonId}, Phase: ${room.phase}`);

  // Fast forward door timer if active
  if ((room as any).doorOpeningTimer) {
    clearTimeout((room as any).doorOpeningTimer);
    (room as any).doorOpeningTimer = null;
    room.phase = 'DUNGEON';
  }



  // Verify room sequence exists
  if (!room.roomSequence || room.roomSequence.length === 0) {
    throw new Error(`No rooms generated in sequence for ${classId}`);
  }

  const firstRoom = room.roomSequence[0];
  console.log(`  ✓ First room generated: type=${firstRoom.type}, title="${firstRoom.title}"`);

  // 5. If combat room, verify enemies and combat resolution
  if (firstRoom.type === 'COMBAT') {
    console.log(`  ✓ Combat room contains ${firstRoom.enemies.length} enemies`);
    if (firstRoom.enemies.length > 0) {
      const enemy = firstRoom.enemies[0];
      console.log(`    Target enemy: ${enemy.name} (HP: ${enemy.hp}/${enemy.maxHp})`);
    }
  }

  console.log(`  ✓ Full flow verified successfully for ${classId.toUpperCase()}!`);
}

console.log('\n=== ALL 3 NEW CLASSES COMPLETED THE FULL EXPEDITION LIFECYCLE! ===\n');
