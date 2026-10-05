/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DarkProtocolGameState,
  SurvivorTrackingSnapshot,
} from '../../types/darkProtocol';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface BunkerMapSchematicProps {
  state: DarkProtocolGameState;
  mode: 'OPERATOR' | 'ENTITY';
  onSelectRoom?: (roomId: string) => void;
  className?: string;
}

interface RoomBlueprintDef {
  id: string;
  name: string;
  shortCode: string;
  sector: 'sector_a' | 'sector_b' | 'sector_c';
  x: number; // 0-100 SVG coords
  y: number; // 0-100 SVG coords
  w: number;
  h: number;
  camId: string;
  machineLabel: string;
}

// 10 PHYSICAL ROOM BLUEPRINT LAYOUT (Architectural Top-Down Floor Plan)
const BLUEPRINT_ROOMS: RoomBlueprintDef[] = [
  // SECTOR A (Upper Row)
  {
    id: 'control_room',
    name: 'SALA DE CONTROL',
    shortCode: 'CMD-01',
    sector: 'sector_a',
    x: 6,
    y: 6,
    w: 26,
    h: 22,
    camId: 'cam_control',
    machineLabel: 'CONSOLA CCTV / MAPA',
  },
  {
    id: 'security',
    name: 'SEGURIDAD Y RED',
    shortCode: 'SEC-02',
    sector: 'sector_a',
    x: 37,
    y: 6,
    w: 26,
    h: 22,
    camId: 'cam_security',
    machineLabel: 'BYPASS DE RED CCTV',
  },
  {
    id: 'archive',
    name: 'ARCHIVO CLASIFICADO',
    shortCode: 'ARC-03',
    sector: 'sector_a',
    x: 68,
    y: 6,
    w: 26,
    h: 22,
    camId: 'cam_archive',
    machineLabel: 'REGISTROS Y CLAVES',
  },

  // SECTOR B (Middle Row)
  {
    id: 'communications',
    name: 'COMUNICACIONES',
    shortCode: 'COM-04',
    sector: 'sector_b',
    x: 6,
    y: 35,
    w: 26,
    h: 22,
    camId: 'cam_comms',
    machineLabel: 'RADIO SOS (OBJ 3)',
  },
  {
    id: 'laboratory',
    name: 'LABORATORIO',
    sector: 'sector_b',
    x: 37,
    y: 35,
    w: 26,
    h: 22,
    camId: 'cam_lab',
    machineLabel: 'VÁLVULAS CRYO (OBJ 2)',
  },
  {
    id: 'infirmary',
    name: 'ENFERMERÍA',
    sector: 'sector_b',
    x: 68,
    y: 35,
    w: 26,
    h: 22,
    camId: 'cam_infirmary',
    machineLabel: 'TRIAJE MÉDICO',
  },

  // SECTOR C (Lower Row)
  {
    id: 'electrical_room',
    name: 'SALA ELÉCTRICA',
    shortCode: 'PWR-05',
    sector: 'sector_c',
    x: 6,
    y: 64,
    w: 26,
    h: 22,
    camId: 'cam_electrical',
    machineLabel: 'SUBESTACIÓN (OBJ 1)',
  },
  {
    id: 'maintenance',
    name: 'MANTENIMIENTO',
    shortCode: 'MNT-06',
    sector: 'sector_c',
    x: 37,
    y: 64,
    w: 26,
    h: 22,
    camId: 'cam_maintenance',
    machineLabel: 'PURGA DE VAPOR',
  },
  {
    id: 'generators',
    name: 'GENERADORES',
    sector: 'sector_c',
    x: 68,
    y: 64,
    w: 26,
    h: 22,
    camId: 'cam_generators',
    machineLabel: 'TURBINA DE COMBUSTIÓN',
  },

  // SECTOR C: EVACUATION OUTLET (Bottom Airlock)
  {
    id: 'evacuation',
    name: 'ACCESO / EVACUACIÓN',
    sector: 'sector_c',
    x: 37,
    y: 91,
    w: 26,
    h: 8,
    camId: 'cam_evacuation',
    machineLabel: 'TECLADO ESCAPE (OBJ 5)',
  },
];

// Physical corridors connecting the door gaps in the blueprint
const BLUEPRINT_CORRIDORS = [
  // Upper row horizontal
  { x1: 32, y1: 17, x2: 37, y2: 17 }, // Control <-> Security
  { x1: 63, y1: 17, x2: 68, y2: 17 }, // Security <-> Archive
  // Right side vertical (Archive <-> Lab)
  { x1: 81, y1: 28, x2: 81, y2: 35 },
  // Middle row horizontal
  { x1: 32, y1: 46, x2: 37, y2: 46 }, // Comms <-> Lab
  { x1: 63, y1: 46, x2: 68, y2: 46 }, // Lab <-> Infirmary
  // Left side vertical (Control <-> Comms)
  { x1: 19, y1: 28, x2: 19, y2: 35 },
  // Lab to Infirmary cross-link & Infirmary to Generators
  { x1: 81, y1: 57, x2: 81, y2: 64 }, // Infirmary <-> Generators
  // Lower row horizontal
  { x1: 32, y1: 75, x2: 37, y2: 75 }, // Electric <-> Maintenance
  { x1: 63, y1: 75, x2: 68, y2: 75 }, // Maintenance <-> Generators
  // Left side vertical (Comms <-> Electric)
  { x1: 19, y1: 57, x2: 19, y2: 64 },
  // Evacuation access corridors (two routes)
  { x1: 50, y1: 86, x2: 50, y2: 91 }, // Maintenance <-> Evacuation
  { x1: 78, y1: 86, x2: 63, y2: 95 }, // Generators diagonal/dogleg to Evacuation
];

export const BunkerMapSchematic: React.FC<BunkerMapSchematicProps> = ({
  state,
  mode,
  onSelectRoom,
  className = '',
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('control_room');
  const now = Date.now();
  const isEntity = mode === 'ENTITY';

  const selectedRoom = FACILITY_ROOMS[selectedRoomId] || FACILITY_ROOMS.control_room;
  const isSelectedPowered = Boolean(state.circuits[selectedRoom.sector]?.powered);

  // Tracking data
  const explorerData = state.players?.player_explorer;
  const operatorData = state.players?.player_operator;

  // 15-second approximate snapshot for Entity
  const entitySnapshot: SurvivorTrackingSnapshot | undefined =
    state.entityTracking?.snapshots?.player_explorer;
  const snapshotAgeSeconds = entitySnapshot
    ? Math.max(0, Math.floor((now - entitySnapshot.snapshotTimestamp) / 1000))
    : 0;

  const handleRoomClick = (roomId: string) => {
    darkProtocolAudio.playSwitchClick();
    setSelectedRoomId(roomId);
    if (onSelectRoom) onSelectRoom(roomId);
  };

  return (
    <div
      className={`relative w-full rounded-none p-3 font-mono select-none flex flex-col justify-between ${
        isEntity
          ? 'bg-[#08020e] border-2 border-purple-500/50 text-purple-100 shadow-[0_0_40px_rgba(147,51,234,0.25)]'
          : 'bg-[#040810] border-2 border-cyan-500/50 text-cyan-100 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
      } ${className}`}
    >
      {/* Schematic Header OSD */}
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 mb-2 text-xs">
        <div className="flex items-center gap-2 font-black tracking-wider uppercase">
          <div
            className={`w-2.5 h-2.5 ${
              isEntity ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'
            }`}
          />
          <span style={{ fontFamily: "'Silkscreen', monospace" }}>
            {isEntity
              ? 'RED CORROMPIDA // TOPOLOGÍA ARQUITECTÓNICA'
              : 'PLANO TÁCTICO // INSTALACIÓN SUBTERRÁNEA FAM-09 (10 SALAS)'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-slate-400 font-bold hidden md:inline">
            COORDINADAS: SUB-NIVEL 4 // 3 SECTORES
          </span>
          <span
            className={`px-2 py-0.5 border font-black uppercase text-[9px] ${
              isEntity
                ? 'bg-purple-950 text-rose-300 border-purple-500/40'
                : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {isEntity ? `SNAPSHOT 15s (HACE ${snapshotAgeSeconds}s)` : 'TELEMETRÍA EN DIRECTO'}
          </span>
        </div>
      </div>

      {/* Main Architectural Floor Plan SVG */}
      <div className="relative w-full aspect-[16/10] min-h-[380px] max-h-[520px] bg-[#02050a] border border-white/10 overflow-hidden p-2">
        {/* Architectural Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* CRT Scanline & vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px] pointer-events-none opacity-30" />

        <svg viewBox="0 0 100 102" className="w-full h-full relative z-10">
          {/* Corridor Tubes / Passageways */}
          {BLUEPRINT_CORRIDORS.map((c, i) => (
            <g key={i}>
              <line
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke="#0f172a"
                strokeWidth="4"
              />
              <line
                x1={c.x1}
                y1={c.y1}
                x2={c.x2}
                y2={c.y2}
                stroke={isEntity ? '#7e22ce' : '#0284c7'}
                strokeWidth="2"
                strokeDasharray="1.5 1.5"
                className="opacity-75"
              />
            </g>
          ))}

          {/* 10 Architectural Room Blocks */}
          {BLUEPRINT_ROOMS.map((r) => {
            const isPowered = Boolean(state.circuits[r.sector]?.powered);
            const isSelected = selectedRoomId === r.id;

            // Live player positions in OPERATOR mode
            const isExplorerHereLive =
              mode === 'OPERATOR' && state.explorer.room === r.id;
            const isOperatorHereLive =
              mode === 'OPERATOR' && state.operator.room === r.id;

            // Approximate snapshot in ENTITY mode
            const isSnapshotHere =
              mode === 'ENTITY' &&
              entitySnapshot &&
              entitySnapshot.approximateRoomId === r.id;

            // Sector color accent
            const sectorBorderColor =
              r.sector === 'sector_a'
                ? '#38bdf8'
                : r.sector === 'sector_b'
                ? '#34d399'
                : '#f59e0b';

            return (
              <g
                key={r.id}
                onClick={() => handleRoomClick(r.id)}
                className="cursor-pointer transition-opacity hover:opacity-90"
              >
                {/* Outer Concrete Wall (Thick architectural contour) */}
                <rect
                  x={r.x - 0.8}
                  y={r.y - 0.8}
                  width={r.w + 1.6}
                  height={r.h + 1.6}
                  fill="#0f172a"
                  stroke={isSelected ? '#ffffff' : '#334155'}
                  strokeWidth="0.8"
                />

                {/* Inner Room Floor */}
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill={
                    isSelected
                      ? isEntity
                        ? 'rgba(88, 28, 135, 0.5)'
                        : 'rgba(8, 47, 73, 0.65)'
                      : isPowered
                      ? 'rgba(15, 23, 42, 0.9)'
                      : 'rgba(5, 7, 12, 0.95)'
                  }
                  stroke={
                    isSelected
                      ? isEntity
                        ? '#c084fc'
                        : '#38bdf8'
                      : isPowered
                      ? sectorBorderColor
                      : '#b91c1c'
                  }
                  strokeWidth="0.8"
                />

                {/* Stepped Corner Brackets */}
                <rect x={r.x} y={r.y} width="1.8" height="1.8" fill={isPowered ? sectorBorderColor : '#ef4444'} />
                <rect x={r.x + r.w - 1.8} y={r.y} width="1.8" height="1.8" fill={isPowered ? sectorBorderColor : '#ef4444'} />

                {/* Room Short Code */}
                <text
                  x={r.x + 1.8}
                  y={r.y + 3.8}
                  fontSize="2.1"
                  fontFamily="'Silkscreen', monospace"
                  fill={isSelected ? '#ffffff' : '#94a3b8'}
                  fontWeight="bold"
                >
                  {r.shortCode}
                </text>

                {/* Room Name */}
                <text
                  x={r.x + 1.8}
                  y={r.y + 6.8}
                  fontSize="1.8"
                  fontFamily="monospace"
                  fill="#e2e8f0"
                  fontWeight="bold"
                >
                  {r.name.length > 15 ? r.name.slice(0, 14) + '..' : r.name}
                </text>

                {/* Machine / Object Subtitle */}
                <text
                  x={r.x + 1.8}
                  y={r.y + 9.5}
                  fontSize="1.4"
                  fontFamily="monospace"
                  fill={isPowered ? '#a5b4fc' : '#64748b'}
                >
                  {r.machineLabel}
                </text>

                {/* Power Status LED */}
                <circle
                  cx={r.x + r.w - 2.5}
                  cy={r.y + 3.5}
                  r="1"
                  fill={isPowered ? '#10b981' : '#ef4444'}
                />

                {/* =========================================================
                    OPERATOR MODE: LIVE PLAYER MARKERS
                    ========================================================= */}
                {isExplorerHereLive && (
                  <g transform={`translate(${r.x + 2}, ${r.y + 12})`}>
                    <rect
                      x="0"
                      y="0"
                      width="22"
                      height="6.5"
                      fill="#78350f"
                      stroke="#f59e0b"
                      strokeWidth="0.4"
                    />
                    <circle cx="1.8" cy="3.2" r="1" fill="#fbbf24" />
                    <text
                      x="3.8"
                      y="2.8"
                      fontSize="1.6"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {explorerData?.displayName?.toUpperCase() || 'MARA'}
                    </text>
                    <text
                      x="3.8"
                      y="5.2"
                      fontSize="1.3"
                      fill="#fde68a"
                    >
                      [EXPLORADORA]
                    </text>
                  </g>
                )}

                {isOperatorHereLive && (
                  <g transform={`translate(${r.x + 2}, ${r.y + (isExplorerHereLive ? 18 : 12)})`}>
                    <rect
                      x="0"
                      y="0"
                      width="22"
                      height="6.5"
                      fill="#0e7490"
                      stroke="#22d3ee"
                      strokeWidth="0.4"
                    />
                    <circle cx="1.8" cy="3.2" r="1" fill="#22d3ee" />
                    <text
                      x="3.8"
                      y="2.8"
                      fontSize="1.6"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      {operatorData?.displayName?.toUpperCase() || 'OPERADOR'}
                    </text>
                    <text
                      x="3.8"
                      y="5.2"
                      fontSize="1.3"
                      fill="#a5f3fc"
                    >
                      [SALA CONTROL]
                    </text>
                  </g>
                )}

                {/* =========================================================
                    ENTITY MODE: 15-SECOND APPROXIMATE SNAPSHOT MARKER
                    ========================================================= */}
                {isSnapshotHere && (
                  <g transform={`translate(${r.x + 2}, ${r.y + 12})`}>
                    <rect
                      x="0"
                      y="0"
                      width="22"
                      height="7.5"
                      fill="#4c0519"
                      stroke="#f43f5e"
                      strokeWidth="0.5"
                      strokeDasharray="1 0.5"
                    />
                    <circle cx="2" cy="3.8" r="1" fill="#fb7185" className="animate-ping" />
                    <text
                      x="4"
                      y="3.2"
                      fontSize="1.5"
                      fontWeight="bold"
                      fill="#fecdd3"
                    >
                      {entitySnapshot?.displayName?.toUpperCase() || 'SUPERVIVIENTE'}
                    </text>
                    <text
                      x="4"
                      y="5.8"
                      fontSize="1.2"
                      fill="#fda4af"
                    >
                      [HACE {snapshotAgeSeconds}s]
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Blueprint Legend & Selected Room Detail Bar */}
      <div className="mt-2 pt-2 border-t-2 border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#38bdf8]" />
            <span className="text-slate-300">SECTOR A: Mando y Seguridad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#34d399]" />
            <span className="text-slate-300">SECTOR B: Laboratorio y Médico</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#f59e0b]" />
            <span className="text-slate-300">SECTOR C: Ingeniería y Evacuación</span>
          </div>
        </div>

        <div className="text-slate-400 font-bold">
          SALA SELECCIONADA:{' '}
          <strong className="text-white">{selectedRoom.name}</strong> &bull;{' '}
          <span className={isSelectedPowered ? 'text-emerald-400' : 'text-rose-400'}>
            {isSelectedPowered ? 'ENERGIZADO' : 'CORTE TOTAL'}
          </span>
        </div>
      </div>
    </div>
  );
};
