export interface PlayerColorOption {
  name: string;
  hex: string;
}

export const PLAYER_COLORS: PlayerColorOption[] = [
  { name: 'Ámbar', hex: '#f59e0b' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Púrpura', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Cian', hex: '#06b6d4' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Lima', hex: '#84cc16' },
  { name: 'Turquesa', hex: '#14b8a6' },
];

export const AVATARS: string[] = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
  '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🐔', '🐧', '🐦',
  '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝',
  '🪲', '🐞', '🦋', '🐌', '🐛', '🪱', '🐜', '🕷️', '🦂', '🐢',
  '🐍', '🦎', '🐙', '🦑', '🦀', '🦞', '🐠', '🐟', '🐡', '🦈',
  '🐬', '🐳', '🐋', '🦭', '🐊', '🐆', '🦓', '🦍', '🦧', '🐘',
  '🦛', '🦏', '🐪', '🦒', '🦘', '🦬', '🦙', '🦥', '🦦', '🦨',
  '🦡', '🦔', '🐿️', '🦫', '🦜', '🦚', '🦩', '🦢',
];

/**
 * Returns a random animal avatar, preferring ones not currently in use.
 */
export function getRandomAnimalAvatar(usedAvatars: string[] = []): string {
  const unused = AVATARS.filter((a) => !usedAvatars.includes(a));
  const pool = unused.length > 0 ? unused : AVATARS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export const DEFAULT_PLAYER_NAMES = [
  'Alex',
  'Bea',
  'Carlos',
  'Dani',
];
