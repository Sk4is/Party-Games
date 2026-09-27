/**
 * Centralized Network & Backend URL Configuration
 *
 * Supports split deployment on Render:
 * - FRONTEND: Render Static Site (e.g., https://fam2play-web.onrender.com)
 * - BACKEND: Render Web Service (e.g., https://fam2play.onrender.com / wss://fam2play.onrender.com)
 *
 * Gracefully preserves local development (http://localhost:3000 & ws://localhost:3000)
 * and unified/monolithic single-origin hosting without breaking changes.
 */

function sanitizeBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
}

/**
 * Returns the configured base API URL (e.g. "https://fam2play.onrender.com").
 * When running in the same origin (local monolithic dev or unified deployment)
 * and no VITE_API_BASE_URL is configured, returns empty string "" so that
 * relative endpoints like "/api/rooms/create" resolve automatically to the current origin.
 */
export function getApiBaseUrl(): string {
  const envApiUrl = sanitizeBaseUrl((import.meta as any).env?.VITE_API_BASE_URL);
  if (envApiUrl) {
    return envApiUrl;
  }

  // If VITE_WS_BASE_URL is set, we can infer the API base URL (wss -> https, ws -> http)
  const envWsUrl = sanitizeBaseUrl((import.meta as any).env?.VITE_WS_BASE_URL);
  if (envWsUrl) {
    return envWsUrl.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://');
  }

  // Same-origin fallback
  return '';
}

/**
 * Resolves a full API URL given a relative path.
 * Examples:
 * - getApiUrl('/api/rooms/create') -> "https://fam2play.onrender.com/api/rooms/create" (if VITE_API_BASE_URL is configured)
 * - getApiUrl('/api/rooms/create') -> "/api/rooms/create" (if same-origin / local monolithic)
 */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

/**
 * Returns the base WebSocket URL (e.g. "wss://fam2play.onrender.com" or "ws://localhost:3000").
 */
export function getWsBaseUrl(): string {
  const envWsUrl = sanitizeBaseUrl((import.meta as any).env?.VITE_WS_BASE_URL);
  if (envWsUrl) {
    return envWsUrl;
  }

  // If VITE_API_BASE_URL is set, infer WebSocket base URL (https -> wss, http -> ws)
  const envApiUrl = sanitizeBaseUrl((import.meta as any).env?.VITE_API_BASE_URL);
  if (envApiUrl) {
    return envApiUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
  }

  // Browser fallback: infer from current window location
  if (typeof window !== 'undefined' && window.location) {
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }

  // Local development default fallback (port 3000)
  return 'ws://localhost:3000';
}

/**
 * Builds a game-specific WebSocket URL while preserving existing routes:
 * - /ws/party (La Bomba & La Peor Respuesta)
 * - /ws/pinturillo (Lienzo Loco)
 * - /ws/palabra-secreta (Palabra Secreta)
 * - /ws/codigo-rojo (Código Rojo)
 * - /ws/coartada (Coartada)
 *
 * Supports optional specific env var overrides if defined.
 */
export function getGameWsUrl(gamePath: string, specificEnvVarName?: string): string {
  // 1. Check game-specific override (e.g. VITE_PINTURILLO_WS_URL)
  if (specificEnvVarName) {
    const specificUrl = sanitizeBaseUrl((import.meta as any).env?.[specificEnvVarName]);
    if (specificUrl) {
      return specificUrl;
    }
  }

  // 2. Check general VITE_WS_URL override
  const generalWsOverride = sanitizeBaseUrl((import.meta as any).env?.VITE_WS_URL);
  if (generalWsOverride) {
    if (generalWsOverride.includes('/ws/')) {
      return generalWsOverride;
    }
    const cleanPath = gamePath.startsWith('/') ? gamePath : `/${gamePath}`;
    return `${generalWsOverride}${cleanPath}`;
  }

  // 3. Centralized base WebSocket URL + game path
  const cleanPath = gamePath.startsWith('/') ? gamePath : `/${gamePath}`;
  const base = getWsBaseUrl();
  return `${base}${cleanPath}`;
}
