export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export function getOrCreateUserProfile(): UserProfile {
  let playerId =
    (typeof window !== 'undefined' && localStorage.getItem('fiesta_playerId')) ||
    (typeof window !== 'undefined' && localStorage.getItem('pinturillo_playerId')) ||
    '';

  if (!playerId) {
    playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fiesta_playerId', playerId);
      localStorage.setItem('pinturillo_playerId', playerId);
    }
  }

  const name =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('fiesta_playerName') || localStorage.getItem('pinturillo_playerName'))) ||
    'Jugador';

  const avatar =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('fiesta_playerAvatar') || localStorage.getItem('pinturillo_playerAvatar'))) ||
    '🦊';

  const color =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('fiesta_playerColor') || localStorage.getItem('pinturillo_playerColor'))) ||
    '#f59e0b';

  return { id: playerId, name, avatar, color };
}

export function saveUserProfile(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fiesta_playerId', user.id);
  localStorage.setItem('fiesta_playerName', user.name);
  localStorage.setItem('fiesta_playerAvatar', user.avatar);
  localStorage.setItem('fiesta_playerColor', user.color);

  // Sync with pinturillo keys for consistency
  localStorage.setItem('pinturillo_playerId', user.id);
  localStorage.setItem('pinturillo_playerName', user.name);
  localStorage.setItem('pinturillo_playerAvatar', user.avatar);
  localStorage.setItem('pinturillo_playerColor', user.color);
}
