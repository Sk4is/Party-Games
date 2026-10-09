import React, { useState } from 'react';
import {
  UnoSobraRoomState,
  UnoSobraConfig,
} from '../../types/unoSobra';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import {
  Users,
  Copy,
  Check,
  Crown,
  Settings,
  Clock,
  LogIn,
  Play,
  LogOut,
  Radio,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface UnoSobraLobbyProps {
  roomState: UnoSobraRoomState | null;
  player: PlayerProfile;
  inputCode: string;
  isConnecting: boolean;
  errorMessage: string | null;
  onUpdatePlayer: (updates: Partial<PlayerProfile>) => void;
  onSetInputCode: (code: string) => void;
  onCreateRoom: (config?: Partial<UnoSobraConfig>) => void;
  onJoinRoom: (code: string) => void;
  onUpdateConfig: (config: Partial<UnoSobraConfig>) => void;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const UnoSobraLobby: React.FC<UnoSobraLobbyProps> = ({
  roomState,
  player,
  inputCode,
  isConnecting,
  errorMessage,
  onUpdatePlayer,
  onSetInputCode,
  onCreateRoom,
  onJoinRoom,
  onUpdateConfig,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [localMode, setLocalMode] = useState<'create' | 'join'>('create');

  // Initial config choice for creation
  const [initialDuration, setInitialDuration] = useState<number>(3);

  const isHost = Boolean(roomState && roomState.hostId === player.id);
  const myPlayerState = roomState?.players.find((p) => p.id === player.id);
  const isReady = Boolean(myPlayerState?.isReady);
  const connectedPlayersCount = roomState ? roomState.players.filter((p) => p.isConnected).length : 0;
  const canStart = Boolean(isHost && connectedPlayersCount >= 3);

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard?.writeText(roomState.code);
    setCopied(true);
    audio.playTurnChange();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.name.trim()) return;
    onCreateRoom({
      discussionDurationMinutes: initialDuration,
      presentationDurationSeconds: 10,
      eliminationMode: 'permanent',
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.name.trim() || !inputCode.trim()) return;
    onJoinRoom(inputCode.trim().toUpperCase());
  };

  // =========================================================================
  // CASE 1: NOT IN A ROOM YET -> ENTRY VIEW
  // =========================================================================
  if (!roomState) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6 p-4 sm:p-6 text-slate-100">
        {/* Header Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-widest shadow-md">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>Dilema Social de Supervivencia</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#38BDF8] to-[#F472B6] font-display uppercase tracking-tight">
            UNO SOBRA
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            Plazas estrictamente limitadas. En cada ronda el grupo enfrenta un escenario crítico y debate quién debe quedarse fuera.
          </p>
        </div>

        {/* Identity Section: Priority #1 Full-Width Name Input */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120]/95 border-2 border-purple-500/30 shadow-2xl space-y-3">
          <label htmlFor="player-name-us" className="block text-xs font-black uppercase tracking-wider text-cyan-300">
            TU NOMBRE O APODO
          </label>
          <input
            id="player-name-us"
            type="text"
            maxLength={20}
            value={player.name}
            onChange={(e) => onUpdatePlayer({ name: e.target.value, avatar: '👤' })}
            className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-purple-500/40 text-white font-bold text-base sm:text-lg placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
            placeholder="Escribe tu nombre o apodo..."
            autoComplete="nickname"
          />
          <p className="text-[11px] text-slate-400 font-medium">
            Con este nombre defenderás tu rol confidencial ante el grupo.
          </p>
        </div>

        {/* Mode Selector Tabs: Crear / Unirse */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#070b16] border border-purple-500/20">
          <button
            type="button"
            onClick={() => setLocalMode('create')}
            className={`py-3 text-xs sm:text-sm font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
              localMode === 'create'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear Sala Nueva
          </button>
          <button
            type="button"
            onClick={() => setLocalMode('join')}
            className={`py-3 text-xs sm:text-sm font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
              localMode === 'join'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {/* Create Room Form (Minimal: only Discussion Duration, no categories!) */}
        {localMode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="p-6 rounded-3xl bg-[#0b1120]/95 border-2 border-purple-500/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-purple-500/20 pb-3">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Ajustes de la expedición</span>
            </div>

            {/* Discussion Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200">Tiempo de debate</label>
                <span className="text-sm font-black text-cyan-400 font-mono">{initialDuration} minutos</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={initialDuration}
                onChange={(e) => setInitialDuration(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>2 min (Intenso)</span>
                <span>3 min (Recomendado)</span>
                <span>10 min (Extenso)</span>
              </div>
            </div>

            {/* Automatic Scenarios Notice */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed space-y-1">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Escenarios y roles automáticos</span>
              </div>
              <p>
                Cada ronda selecciona automáticamente una situación de emergencia sin repetir. Cada superviviente recibe en secreto su profesión y argumento crucial para el grupo.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting || !player.name.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isConnecting ? 'Creando sala...' : 'Crear Sala de Evacuación'}</span>
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {localMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="p-6 rounded-3xl bg-[#0b1120]/95 border-2 border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-purple-500/20 pb-3">
              <LogIn className="w-4 h-4 text-purple-400" />
              <span>Introduce el código de sala</span>
            </div>

            <div>
              <label htmlFor="room-code-us" className="block text-xs font-bold text-slate-200 mb-1.5">
                Código de 5 letras
              </label>
              <input
                id="room-code-us"
                type="text"
                maxLength={5}
                value={inputCode}
                onChange={(e) => onSetInputCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-purple-500/40 text-white font-mono font-black text-2xl tracking-widest text-center uppercase focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 shadow-inner"
                autoCapitalize="characters"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting || !inputCode.trim() || !player.name.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isConnecting ? 'Conectando...' : 'Entrar a la Sala'}</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE 2: INSIDE A ROOM -> CONNECTED LOBBY VIEW
  // =========================================================================
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 sm:p-6 text-slate-100">
      {/* Top Bar with Room Code */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0b1120]/90 border-2 border-purple-500/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-2xl shadow-lg shadow-purple-500/40">
            👥
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-cyan-400">
              SALA DE ESPERA
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white">
                {roomState.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 transition-all cursor-pointer"
                title="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>Salir</span>
        </button>
      </div>

      {/* Main Grid: Player List + Room Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Players List (2 columns on md) */}
        <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#0b1120]/95 border-2 border-purple-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wide">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Supervivientes en sala</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black">
              {roomState.players.length} / 10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roomState.players.map((p) => {
              const isMe = p.id === player.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-lg shrink-0">
                      {p.avatar || '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate max-w-[120px]">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" title="Anfitrión" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.isConnected ? (
                          <span className="text-emerald-400 font-semibold">Conectado</span>
                        ) : (
                          <span className="text-rose-400">Desconectado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.isReady ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                        <UserCheck className="w-3 h-3" /> Listo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold uppercase">
                        <UserX className="w-3 h-3" /> Espera
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle Ready Button for Non-Hosts */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onToggleReady(!isReady)}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isReady
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md'
              }`}
            >
              {isReady ? 'Cancelar preparación' : '¡Estoy listo para jugar!'}
            </button>
          </div>
        </div>

        {/* Settings Summary + Admin Start Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1120]/95 border-2 border-purple-500/30 shadow-xl flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-purple-500/20 pb-3">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Configuración</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Tiempo de debate:</span>
                <span className="font-mono font-bold text-cyan-400">{roomState.config.discussionDurationMinutes} min</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Presentación inicial:</span>
                <span className="font-mono font-bold text-purple-300">10 segundos</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Modo eliminación:</span>
                <span className="font-bold text-rose-300 uppercase">Definitiva</span>
              </div>
            </div>

            {/* Host live adjustments */}
            {isHost && (
              <div className="space-y-2 pt-2 border-t border-purple-500/20">
                <label className="text-[11px] font-bold text-slate-300">Modificar minutos de debate:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 3, 5, 8].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onUpdateConfig({ discussionDurationMinutes: d })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        roomState.config.discussionDurationMinutes === d
                          ? 'bg-purple-600 text-white font-black border-cyan-400'
                          : 'bg-black/50 text-slate-300 border-white/10 hover:border-purple-500/40'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Host Start / Notice */}
          <div className="space-y-2 pt-3 border-t border-purple-500/20">
            {connectedPlayersCount < 3 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Se necesitan al menos 3 jugadores para comenzar.</span>
              </div>
            )}

            {isHost ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={onStartGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Evacuación</span>
              </button>
            ) : (
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 font-medium">
                Esperando a que el anfitrión inicie la partida...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
