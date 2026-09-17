import React, { useState, useEffect } from 'react';
import { AVATARS } from '../../data/players';
import { audio } from '../../utils/audio';
import { Sparkles, PlusCircle, LogIn, ArrowLeft, Paintbrush } from 'lucide-react';

interface PinturilloEntryProps {
  initialRoomCode?: string;
  onCreateRoom: (player: { id: string; name: string; avatar: string; color: string }) => void;
  onJoinRoom: (code: string, player: { id: string; name: string; avatar: string; color: string }) => void;
  onBackToMenu: () => void;
}

const PLAYER_COLORS = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

export const PinturilloEntry: React.FC<PinturilloEntryProps> = ({
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
}) => {
  const [name, setName] = useState(() => {
    return localStorage.getItem('pinturillo_playerName') || 'Artista';
  });

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('pinturillo_playerAvatar') || '🦊';
  });

  const [color, setColor] = useState(() => {
    return localStorage.getItem('pinturillo_playerColor') || PLAYER_COLORS[0];
  });

  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [showJoinInput, setShowJoinInput] = useState(Boolean(initialRoomCode));

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode.toUpperCase());
      setShowJoinInput(true);
    }
  }, [initialRoomCode]);

  const saveProfile = () => {
    const finalName = name.trim() || 'Artista';
    localStorage.setItem('pinturillo_playerName', finalName);
    localStorage.setItem('pinturillo_playerAvatar', avatar);
    localStorage.setItem('pinturillo_playerColor', color);

    let playerId = localStorage.getItem('pinturillo_playerId');
    if (!playerId) {
      playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('pinturillo_playerId', playerId);
    }

    return {
      id: playerId,
      name: finalName,
      avatar,
      color,
    };
  };

  const handleCreate = () => {
    audio.playClick();
    const player = saveProfile();
    onCreateRoom(player);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    audio.playClick();
    const player = saveProfile();
    onJoinRoom(roomCodeInput.trim().toUpperCase(), player);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Juegos</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
          <Paintbrush className="w-3.5 h-3.5" /> Pinturillo Online
        </div>
      </div>

      {/* Main card */}
      <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 shadow-2xl space-y-8">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide mb-2">
            🎨 PINTURILLO ONLINE
          </h2>
          <p className="text-sm text-slate-400">
            Dibuja con soltura en el gran lienzo blanco o adivina en tiempo real con tus amigos.
          </p>
        </div>

        {/* Profile Customization Section */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tu Perfil de Jugador</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Avatar Preview */}
            <div className="sm:col-span-3 flex flex-col items-center">
              <div
                className="w-18 h-18 rounded-2xl flex items-center justify-center text-4xl shadow-inner border-2"
                style={{ backgroundColor: `${color}22`, borderColor: color }}
              >
                {avatar}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 font-bold">Tu avatar</span>
            </div>

            {/* Name Input & Color Swatches */}
            <div className="sm:col-span-9 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre / Apodo</label>
                <input
                  type="text"
                  maxLength={15}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Escribe tu nombre..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Color Swatches */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Color distintivo</label>
                <div className="flex items-center gap-1.5">
                  {PLAYER_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Avatar selection grid */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2">Elige tu emoji</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
              {AVATARS.slice(0, 24).map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all ${
                    avatar === em ? 'bg-amber-500/30 border-2 border-amber-400 scale-105' : 'hover:bg-slate-800'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons: Create Room or Join Room */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Create Room Button */}
          <button
            type="button"
            onClick={handleCreate}
            className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-left shadow-xl shadow-amber-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-98 flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-950/20 flex items-center justify-center mb-4">
              <PlusCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-black block mb-1">CREAR SALA</span>
              <p className="text-xs text-slate-950/80 font-semibold leading-relaxed">
                Crea una sala privada y comparte el código con tus amigos.
              </p>
            </div>
          </button>

          {/* Join Room Box */}
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 text-slate-300">
                <LogIn className="w-6 h-6" />
              </div>
              <span className="text-xl font-black text-white block mb-1">UNIRSE A SALA</span>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Introduce el código de 5 letras de una sala ya creada.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO (ej. K7P4Q)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-black text-sm tracking-widest text-center uppercase focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={roomCodeInput.trim().length < 4}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-black text-sm transition-all cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
