/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DarkProtocolGameState, CameraDefinition, RoomZone } from '../../../types/darkProtocol';
import {
  FACILITY_ROOMS,
  FACILITY_LIGHTS,
  FACILITY_INTERACTABLES,
  HIDING_SPOTS,
} from '../../../data/darkProtocol/facilityMap';
import { getCharacterById } from '../../../data/darkProtocol/characters';

/**
 * Authentic live CCTV renderer.
 * Renders the real shared game world across all 10 rooms from camera perspective.
 * All physical actors (Survivor, Operator, manifested Entity) appear inside camera FOV!
 */
export function renderLiveCctvFeed(
  canvas: HTMLCanvasElement,
  state: DarkProtocolGameState,
  camId: string,
  animTimer: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cam = state.cameras[camId];
  if (!cam) return;

  const room = FACILITY_ROOMS[cam.room] || FACILITY_ROOMS.control_room;
  const isPowered = Boolean(state.circuits[cam.circuitId]?.powered);
  const isOnline = cam.state === 'ONLINE' && isPowered;
  const isInterference = cam.state === 'INTERFERENCE' && isPowered;

  const w = canvas.width;
  const h = canvas.height;

  // 1. OFFLINE / UNPOWERED: TV static noise & warning
  if (!isOnline && !isInterference) {
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, w, h);

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      if (Math.random() < 0.22) {
        const v = Math.floor(Math.random() * 90);
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v + 10;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // CRT Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }

    // Centered Warning Message
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CANAL SIN SEÑAL // CORTE DE ENERGÍA', w / 2, h / 2 - 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(cam.name.toUpperCase(), w / 2, h / 2 + 12);
    ctx.fillText(
      `SECTOR ${cam.circuitId.replace('sector_', '').toUpperCase()} DESCONECTADO`,
      w / 2,
      h / 2 + 28
    );
    return;
  }

  // 2. LIVE CAMERA VIEW: RENDER REAL SHARED WORLD
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const scale = h / 600;
  ctx.scale(scale, scale);

  const viewWidthInRoom = w / scale;
  let camOffset = cam.x - viewWidthInRoom / 2;
  camOffset = Math.max(0, Math.min(camOffset, room.width - viewWidthInRoom));
  ctx.translate(-camOffset, 0);

  // Background Wall
  ctx.fillStyle = isPowered ? '#080d17' : '#030508';
  ctx.fillRect(0, 0, room.width, 600);

  // Wall structural ribs
  ctx.strokeStyle = isPowered ? '#111a2c' : '#060a12';
  ctx.lineWidth = 2;
  for (let x = 0; x < room.width; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, room.floorY);
    ctx.stroke();
  }

  // Floor
  ctx.fillStyle = isPowered ? '#1a2233' : '#0b0f17';
  ctx.fillRect(0, room.floorY, room.width, 600 - room.floorY);
  ctx.fillStyle = isPowered ? '#9a3412' : '#3f1a07';
  ctx.fillRect(0, room.floorY - 5, room.width, 5);

  // Ceiling Girder
  ctx.fillStyle = '#0c121e';
  ctx.fillRect(0, 0, room.width, 35);

  // 10 PHYSICAL ROOM SPECIFIC PROPS
  if (room.id === 'control_room') {
    const terminals = [340, 700, 1000];
    for (const tx of terminals) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(tx - 40, room.floorY - 80, 80, 80);
      ctx.fillStyle = isPowered ? '#0284c7' : '#040b17';
      ctx.fillRect(tx - 34, room.floorY - 74, 68, 40);
    }
  } else if (room.id === 'security') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(380 - 45, room.floorY - 110, 90, 110);
    ctx.fillStyle = isPowered ? '#38bdf8' : '#0f172a';
    ctx.fillRect(380 - 35, room.floorY - 95, 70, 45);
  } else if (room.id === 'archive') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(560 - 40, room.floorY - 90, 80, 90);
    ctx.fillStyle = isPowered ? '#fbbf24' : '#0f172a';
    ctx.fillRect(560 - 32, room.floorY - 82, 64, 40);
    ctx.fillStyle = '#334155';
    ctx.fillRect(880 - 45, room.floorY - 100, 90, 100);
  } else if (room.id === 'laboratory') {
    ctx.fillStyle = isPowered ? 'rgba(16, 185, 129, 0.45)' : '#071f18';
    ctx.fillRect(420 - 35, room.floorY - 120, 70, 110);
    ctx.fillStyle = '#334155';
    ctx.fillRect(920 - 45, room.floorY - 100, 90, 100);
  } else if (room.id === 'infirmary') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(620 - 40, room.floorY - 85, 80, 85);
    ctx.fillStyle = isPowered ? '#22c55e' : '#0f172a';
    ctx.fillRect(620 - 30, room.floorY - 75, 60, 35);
  } else if (room.id === 'communications') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(680 - 50, room.floorY - 95, 100, 95);
    ctx.fillStyle = isPowered ? '#38bdf8' : '#0f172a';
    ctx.fillRect(680 - 40, room.floorY - 85, 80, 40);
  } else if (room.id === 'electrical_room') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(820 - 55, room.floorY - 130, 110, 130);
    ctx.fillStyle = isPowered ? '#38bdf8' : '#0f172a';
    ctx.fillRect(820 - 45, room.floorY - 110, 90, 50);
  } else if (room.id === 'maintenance') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(620 - 45, room.floorY - 100, 90, 100);
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(620, room.floorY - 60, 22, 0, Math.PI * 2);
    ctx.stroke();
  } else if (room.id === 'generators') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(600 - 90, room.floorY - 140, 180, 140);
    ctx.fillStyle = isPowered ? '#f97316' : '#334155';
    ctx.beginPath();
    ctx.arc(600, room.floorY - 70, 35, 0, Math.PI * 2);
    ctx.fill();
  } else if (room.id === 'evacuation') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(1050 - 40, room.floorY - 140, 80, 140);
    ctx.fillStyle = state.escapeUnlocked ? '#10b981' : '#dc2626';
    ctx.fillRect(1050 - 30, room.floorY - 130, 60, 130);
  }

  // Draw Hiding Spots in room
  for (const spot of HIDING_SPOTS) {
    if (spot.room === room.id) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
    }
  }

  // Draw Doors in room
  for (const door of Object.values(state.doors)) {
    if (door.fromRoom === room.id) {
      const isDoorLocked = door.lockedByEntity;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(door.fromX - 25, room.floorY - 130, 50, 130);
      ctx.fillStyle = isDoorLocked ? '#dc2626' : '#334155';
      ctx.fillRect(door.fromX - 20, room.floorY - 125, 40, 125);
    }
  }

  // 1. SURVIVOR RENDERING IN CCTV (if in this room and not hiding)
  let survivorDetected = false;
  let survivorScreenX = 0;
  let survivorScreenY = 0;

  if (state.explorer.room === room.id && !state.explorer.isHiding) {
    const char = getCharacterById(state.selectedCharacterId);
    const sx = state.explorer.x;
    const sy = room.floorY;
    const facing = state.explorer.facing;
    const walkBob = Math.sin(animTimer * 10) * 4;

    ctx.save();
    ctx.translate(sx, sy);
    if (facing === 'left') ctx.scale(-1, 1);

    // Contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-8, -20, 6, 20);
    ctx.fillRect(2, -20, 6, 20);

    // Suit
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(-11, -46 + walkBob * 0.4, 22, 26);

    // Head
    ctx.fillStyle = '#334155';
    ctx.fillRect(-8, -60 + walkBob * 0.4, 16, 14);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(2, -56 + walkBob * 0.4, 6, 5);

    // Visible flashlight beam in CCTV
    if (state.explorer.flashlightOn) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(10, -32 + walkBob * 0.4, 5, 8);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(12, -30);
      ctx.lineTo(160, -80);
      ctx.lineTo(160, 40);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    const distToCam = Math.abs(sx - cam.x);
    if (distToCam <= cam.range) {
      survivorDetected = true;
      survivorScreenX = (sx - camOffset) * scale;
      survivorScreenY = (sy - 70) * scale;
    }
  }

  // 2. OPERATOR RENDERING IN CCTV (if physically in this room)
  let operatorDetected = false;
  let operatorScreenX = 0;
  let operatorScreenY = 0;

  if (state.operator.room === room.id) {
    const ox = state.operator.x;
    const oy = room.floorY;

    ctx.save();
    ctx.translate(ox, oy);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, -20, 6, 20);
    ctx.fillRect(1, -20, 6, 20);

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-9, -46, 18, 26);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(1, -40, 4, 6);

    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(-7, -60, 14, 14);

    ctx.restore();

    const distToCam = Math.abs(ox - cam.x);
    if (distToCam <= cam.range) {
      operatorDetected = true;
      operatorScreenX = (ox - camOffset) * scale;
      operatorScreenY = (oy - 70) * scale;
    }
  }

  // 3. MANIFESTED ENTITY RENDERING IN CCTV (visible when inside camera FOV!)
  let entityDetected = false;
  let entityScreenX = 0;
  let entityScreenY = 0;

  if (state.entity.isManifested && state.entity.room === room.id) {
    const ex = state.entity.x;
    const ey = room.floorY - 12 + Math.sin(animTimer * 5) * 6;

    ctx.save();
    ctx.translate(ex, ey);

    // Pulsing shadowy demonic form
    ctx.fillStyle = '#05010a';
    ctx.beginPath();
    ctx.arc(0, -35, 32, 0, Math.PI * 2);
    ctx.fill();

    // Purple distorted aura
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -35, 36 + Math.sin(animTimer * 8) * 4, 0, Math.PI * 2);
    ctx.stroke();

    // Crimson glowing eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8, -42, 5, 4);
    ctx.fillRect(3, -42, 5, 4);

    ctx.restore();

    const distToCam = Math.abs(ex - cam.x);
    if (distToCam <= cam.range) {
      entityDetected = true;
      entityScreenX = (ex - camOffset) * scale;
      entityScreenY = (ey - 70) * scale;
    }
  }

  ctx.restore();

  // 4. OVERLAYS: SCANLINES, NOISE, OSD & DETECTION RETICLES
  ctx.save();

  // Subtle surveillance tint (cyan/green phosphor)
  ctx.fillStyle = isPowered ? 'rgba(6, 182, 212, 0.04)' : 'rgba(239, 68, 68, 0.06)';
  ctx.fillRect(0, 0, w, h);

  // Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // HUD OSD
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`REC ● ${cam.name.toUpperCase()}`, 12, 20);

  ctx.textAlign = 'right';
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 100);
  ctx.fillText(`CANAL ${cam.id.toUpperCase()} // ${timeStr}`, w - 12, 20);

  // Target brackets for detected Survivor
  if (survivorDetected) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(survivorScreenX - 16, survivorScreenY - 10, 32, 60);

    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MARA [EXPLORADORA]', survivorScreenX, survivorScreenY - 16);
  }

  // Target brackets for Operator
  if (operatorDetected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(operatorScreenX - 16, operatorScreenY - 10, 32, 60);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OPERADOR', operatorScreenX, operatorScreenY - 16);
  }

  // Target warning for manifested Entity!
  if (entityDetected) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(entityScreenX - 25, entityScreenY - 15, 50, 70);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! MOVIMIENTO ANÓMALO !', entityScreenX, entityScreenY - 22);
  }

  ctx.restore();
}
