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
 * High-performance, authentic live CCTV renderer.
 * Renders the real game world from camera perspective directly onto any canvas!
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

  // 1. OFFLINE / UNPOWERED: Real animated TV static noise
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
    ctx.fillText(`SECTOR ${cam.circuitId.replace('sector_', '').toUpperCase()} DESCONECTADO`, w / 2, h / 2 + 28);
    return;
  }

  // 2. LIVE CAMERA VIEW: RENDER REAL WORLD
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Calculate scaling & camera frustum
  const scale = h / 600; // Room height reference 600
  ctx.scale(scale, scale);

  // Position camera viewpoint centered on the camera's location
  const viewWidthInRoom = w / scale;
  let camOffset = cam.x - viewWidthInRoom / 2;
  camOffset = Math.max(0, Math.min(camOffset, room.width - viewWidthInRoom));
  ctx.translate(-camOffset, 0);

  // Base Room Wall
  ctx.fillStyle = isPowered ? '#080d17' : '#030508';
  ctx.fillRect(0, 0, room.width, 600);

  // Wall panels
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

  // Draw Room Machines / Props
  if (room.id === 'control_room') {
    const terminals = [280, 500, 740, 960];
    for (const tx of terminals) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(tx - 40, room.floorY - 80, 80, 80);
      ctx.fillStyle = isPowered ? '#0284c7' : '#040b17';
      ctx.fillRect(tx - 34, room.floorY - 74, 68, 40);
    }
  } else if (room.id === 'generators') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(400, room.floorY - 150, 200, 150);
    ctx.fillStyle = isPowered ? '#f97316' : '#334155';
    ctx.beginPath();
    ctx.arc(1180, room.floorY - 70, 20, 0, Math.PI * 2);
    ctx.fill();
  } else if (room.id === 'laboratory') {
    ctx.fillStyle = isPowered ? 'rgba(16, 185, 129, 0.4)' : '#071f18';
    ctx.fillRect(308, room.floorY - 120, 50, 110);
    ctx.fillStyle = '#334155';
    ctx.fillRect(1000, room.floorY - 100, 90, 100);
  } else if (room.id === 'electrical_room') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(450, room.floorY - 140, 180, 140);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(470, room.floorY - 120, 140, 4);
  }

  // Draw Hiding Spots
  for (const spot of HIDING_SPOTS) {
    if (spot.room === room.id) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(spot.x - spot.width / 2, spot.y, spot.width, spot.height);
    }
  }

  // Draw Doors
  for (const door of Object.values(state.doors)) {
    if (door.fromRoom === room.id) {
      const isDoorLocked = door.lockedByEntity;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(door.fromX - 25, room.floorY - 130, 50, 130);
      ctx.fillStyle = isDoorLocked ? '#dc2626' : '#334155';
      ctx.fillRect(door.fromX - 20, room.floorY - 125, 40, 125);
    }
  }

  // Draw Survivor if in this room!
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

    // Shadow
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

    // Flashlight beam in CCTV
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

    // Check if in camera FOV
    const distToCam = Math.abs(sx - cam.x);
    if (distToCam <= cam.range) {
      survivorDetected = true;
      survivorScreenX = (sx - camOffset) * scale;
      survivorScreenY = (sy - 70) * scale;
    }
  }

  // Draw Manifested Entity if in this room!
  let entityDetected = false;
  let entityScreenX = 0;
  let entityScreenY = 0;

  if (state.entity.isManifested && state.entity.room === room.id) {
    const ex = state.entity.x;
    const ey = room.floorY - 10 + Math.sin(animTimer * 5) * 6;

    ctx.save();
    ctx.translate(ex, ey);

    ctx.fillStyle = '#05010a';
    ctx.beginPath();
    ctx.arc(0, -35, 30, 0, Math.PI * 2);
    ctx.fill();

    // Glowing red eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-6, -42, 4, 3);
    ctx.fillRect(2, -42, 4, 3);

    ctx.restore();

    entityDetected = true;
    entityScreenX = (ex - camOffset) * scale;
    entityScreenY = (ey - 70) * scale;
  }

  ctx.restore();

  // 3. OVERLAYS: SCANLINES, NOISE, OSD
  ctx.save();

  // Subtle surveillance tint (greenish-cyan)
  ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
  ctx.fillRect(0, 0, w, h);

  // Interference Glitch Bands (if sabotaged)
  if (isInterference) {
    ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
    for (let i = 0; i < 5; i++) {
      const gy = (Math.sin(animTimer * 8 + i * 2) * 0.5 + 0.5) * h;
      ctx.fillRect(0, gy, w, 12);
    }
  }

  // CRT Scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }

  // Vignette
  const vGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.7);
  vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);

  // Motion Detection Bounding Box (Survivor)
  if (survivorDetected && survivorScreenX > 0 && survivorScreenX < w) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(survivorScreenX - 20, survivorScreenY, 40, 65);
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OBJETIVO: SUJETO', survivorScreenX, survivorScreenY - 4);
  }

  // Motion Detection Bounding Box (Entity)
  if (entityDetected && entityScreenX > 0 && entityScreenX < w) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(entityScreenX - 25, entityScreenY, 50, 75);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('¡¡ANOMALÍA HOSTIL!!', entityScreenX, entityScreenY - 4);
  }

  // Header OSD
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  const recDot = Math.sin(animTimer * 4) > 0;
  ctx.fillText(`${recDot ? '●' : ' '} REC [${cam.id.toUpperCase()}]`, 12, 18);

  ctx.textAlign = 'right';
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  ctx.fillText(`2026-10-05 ${timeStr}`, w - 12, 18);

  // Footer OSD
  ctx.textAlign = 'left';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${room.name} // SECTOR ${room.sector.replace('sector_', '').toUpperCase()}`, 12, h - 12);

  ctx.textAlign = 'right';
  ctx.fillStyle = isInterference ? '#f59e0b' : '#10b981';
  ctx.fillText(isInterference ? 'SEÑAL: INTERFERENCIA' : 'SEÑAL: ÓPTIMA (30 FPS)', w - 12, h - 12);

  ctx.restore();
}
