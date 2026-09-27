/**
 * Unified Multiplayer Room Service
 * Shared client infrastructure for La Bomba, La Peor Respuesta, and Pinturillo.
 */

import { getApiUrl } from '../config/network';
import { backendHealth } from './backendHealth';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface SharedRoomSummary {
  roomId: string;
  roomCode: string;
  code: string;
  gameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada';
  hostId: string;
  phase: string;
  createdAt: number;
  playersCount: number;
  totalPlayers?: number;
  maxPlayers: number;
  isFull: boolean;
  settings?: any;
  players?: any[];
}

export interface ValidateJoinResult {
  valid: boolean;
  room?: SharedRoomSummary;
  wrongGame?: boolean;
  actualGameType?: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada';
  message?: string;
}

/**
 * Creates an online room on the server and returns its metadata and unique room code.
 * Ensures backend is awake first if sleeping, without duplicating requests.
 */
export async function createOnlineRoom(
  gameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada',
  hostPlayer: PlayerProfile,
  config?: any
): Promise<SharedRoomSummary> {
  // Ensure backend is awake before sending room creation request
  await backendHealth.ensureBackendAvailable();

  const res = await fetch(getApiUrl('/api/rooms/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType,
      hostPlayer: {
        id: hostPlayer.id,
        name: hostPlayer.name.trim() || 'Jugador',
        avatar: hostPlayer.avatar || '🦊',
        color: hostPlayer.color || '#f59e0b',
      },
      config,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'NO SE HA PODIDO CREAR LA SALA ONLINE');
  }

  backendHealth.markHealthy();
  return data.room;
}

/**
 * Queries room status by code from the server.
 */
export async function findOnlineRoom(code: string): Promise<SharedRoomSummary> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    throw new Error('Código de sala vacío');
  }

  // Ensure backend is awake
  await backendHealth.ensureBackendAvailable();

  const res = await fetch(getApiUrl(`/api/rooms/${encodeURIComponent(cleanCode)}`));
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.exists) {
    throw new Error(data.message || 'NO SE HA ENCONTRADO ESA SALA');
  }

  backendHealth.markHealthy();
  return data.room;
}

/**
 * Validates joining an online room before attempting socket connection.
 */
export async function validateJoinOnlineRoom(
  code: string,
  gameType?: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada',
  player?: PlayerProfile
): Promise<ValidateJoinResult> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'INTRODUCE UN CÓDIGO DE SALA' };
  }

  try {
    // Ensure backend is awake
    await backendHealth.ensureBackendAvailable();

    const res = await fetch(getApiUrl('/api/rooms/validate-join'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleanCode,
        gameType,
        player,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.valid) {
      return {
        valid: false,
        wrongGame: Boolean(data.wrongGame),
        actualGameType: data.actualGameType,
        message: data.message || 'NO SE HA PODIDO UNIR A LA SALA',
        room: data.room,
      };
    }

    backendHealth.markHealthy();
    return {
      valid: true,
      room: data.room,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message === 'OPERATION_CANCELLED') {
      throw err;
    }
    return {
      valid: false,
      message: 'ERROR DE CONEXIÓN CON EL SERVIDOR',
    };
  }
}
