import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  PlusCircle,
  LogIn,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { PLAYER_COLORS } from '../../data/players';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { audio } from '../../utils/audio';

interface GameRoomEntryProps {
  gameType: 'la-bomba' | 'la-peor-respuesta';
  title: string;
  subtitle: string;
  badgeText: string;
  icon: React.ReactNode;
  minPlayers: number;
  maxPlayers: number;
  currentUser: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  onUpdateUser: (u: { name: string; avatar: string; color: string }) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onBackToMenu: () => void;
  initialRoomCode?: string;
  errorMessage?: string | null;
  isConnecting?: boolean;
}

export const GameRoomEntry: React.FC<GameRoomEntryProps> = ({
  gameType,
  title,
  subtitle,
  badgeText,
  icon,
  minPlayers,
  maxPlayers,
  currentUser,
  onUpdateUser,
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
  initialRoomCode = '',
  errorMessage,
  isConnecting = false,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);

  const handleNameBlur = () => {
    const trimmed = nameInput.trim() || 'Jugador';
    setNameInput(trimmed);
    onUpdateUser({ ...currentUser, name: trimmed });
  };

  const handleColorChange = (hex: string) => {
    onUpdateUser({ ...currentUser, color: hex });
    audio.playSpark();
  };

  const handleAvatarChange = (avatar: string) => {
    onUpdateUser({ ...currentUser, avatar });
    setIsAvatarPickerOpen(false);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase();
    const trimmedName = nameInput.trim() || currentUser.name || 'Jugador';
    if (trimmedName !== currentUser.name) {
      onUpdateUser({ ...currentUser, name: trimmedName });
    }
    if (clean.length >= 4) {
      audio.playTick();
      onJoinRoom(clean);
    }
  };

  const handleCreateSubmit = () => {
    const trimmedName = nameInput.trim() || currentUser.name || 'Jugador';
    if (trimmedName !== currentUser.name) {
      onUpdateUser({ ...currentUser, name: trimmedName });
    }
    audio.playSpark();
    onCreateRoom();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Subtle Background Glow */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          backgroundColor:
            gameType === 'la-bomba' ? '#ef4444' : '#f59e0b',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          backgroundColor:
            gameType === 'la-bomba' ? '#f59e0b' : '#3b82f6',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-900/90 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl mb-3">
            {icon}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-stone-900/90 border border-stone-800 text-stone-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {badgeText} · Multijugador Online
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif tracking-tight text-white mb-1">
            {title}
          </h1>
          <p className="text-sm text-stone-400 max-w-xs mx-auto">
            {subtitle} ({minPlayers} a {maxPlayers} jugadores)
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5 shadow-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Main Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
          {/* User Profile Customization */}
          <div className="mb-6 pb-6 border-b border-stone-800">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Tu Perfil de Jugador
            </label>
            <div className="flex items-center gap-3.5">
              {/* Avatar Selector Button */}
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="relative group w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md border transition-transform hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: `${currentUser.color}20`,
                  borderColor: currentUser.color,
                }}
                title="Cambiar avatar"
              >
                <span>{currentUser.avatar}</span>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-[10px] text-stone-300 shadow">
                  ✎
                </span>
              </button>

              {/* Name Input */}
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={18}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="Tu nombre..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm font-semibold focus:outline-none focus:border-stone-600 transition-colors"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
              {PLAYER_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColorChange(c.hex)}
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c.hex }}
                >
                  {currentUser.color === c.hex && (
                    <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-950 rounded-2xl mb-5 border border-stone-800/80">
            <button
              type="button"
              onClick={() => {
                setTab('create');
                audio.playTick();
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'create'
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Crear Sala
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('join');
                audio.playTick();
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'join'
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Unirse a Sala
            </button>
          </div>

          {/* Tab 1: Create Room */}
          {tab === 'create' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-xs text-stone-400 leading-relaxed">
                Crea una sala privada y comparte el código o el enlace con tus amigos para jugar en tiempo real desde sus propios dispositivos.
              </p>

              <button
                type="button"
                disabled={isConnecting}
                onClick={handleCreateSubmit}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isConnecting ? 'Creando sala...' : 'Crear Sala Online'}
              </button>
            </motion.div>
          )}

          {/* Tab 2: Join Room */}
          {tab === 'join' && (
            <motion.form
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleJoinSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Código de la Sala
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ej. K7P4Q"
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-2xl text-center text-stone-100 font-mono text-xl font-bold tracking-widest uppercase focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={roomCodeInput.trim().length < 4 || isConnecting}
                className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-white text-stone-950 font-black text-sm transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogIn className="w-4 h-4" />
                {isConnecting ? 'Conectando...' : 'Entrar a la Sala'}
              </button>
            </motion.form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[11px] text-stone-500">
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-900/40 border border-stone-800/40">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span>Hasta {maxPlayers} jugadores</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-900/40 border border-stone-800/40">
            <span className="text-emerald-400 font-bold">⚡</span>
            <span>Sincronización en vivo</span>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        playerName={currentUser.name}
        playerColorHex={currentUser.color}
        currentAvatar={currentUser.avatar}
        onSelectAvatar={handleAvatarChange}
        onClose={() => setIsAvatarPickerOpen(false)}
      />
    </div>
  );
};
