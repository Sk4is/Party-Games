export type SupportedGameType = 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo';

interface RoomMeta {
  code: string;
  gameType: SupportedGameType;
  serverType: 'party' | 'pinturillo';
  createdAt: number;
}

class RoomRegistry {
  private rooms = new Map<string, RoomMeta>();

  register(code: string, gameType: SupportedGameType, serverType: 'party' | 'pinturillo') {
    const cleanCode = code.toUpperCase().trim();
    this.rooms.set(cleanCode, {
      code: cleanCode,
      gameType,
      serverType,
      createdAt: Date.now(),
    });
  }

  unregister(code: string) {
    const cleanCode = code.toUpperCase().trim();
    this.rooms.delete(cleanCode);
  }

  get(code: string): RoomMeta | undefined {
    return this.rooms.get(code.toUpperCase().trim());
  }

  has(code: string): boolean {
    return this.rooms.has(code.toUpperCase().trim());
  }

  generateCode(): string {
    // Human-friendly 5-char code avoiding ambiguous chars: O/0, I/1, L/1
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  getAllRooms(): RoomMeta[] {
    return Array.from(this.rooms.values());
  }
}

export const roomRegistry = new RoomRegistry();
