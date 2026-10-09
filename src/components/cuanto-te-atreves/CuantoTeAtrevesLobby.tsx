import React, { useState } from 'react';
import {
  CuantoTeAtrevesRoomState,
  CuantoTeAtrevesConfig,
  CuantoTeAtrevesChallengesCount,
} from '../../types/cuantoTeAtreves';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import {
  Flame,
  Users,
  Copy,
  Check,
  Crown,
  Settings,
  ShieldAlert,
  Clock,
  LogIn,
  Play,
  LogOut,
  UserCheck,
  UserX,
  Volume2,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface CuantoTeAtrevesLobbyProps {
  roomState: CuantoTeAtrevesRoomState | null;
  player: PlayerProfile;
  inputCode: string;
  isConnecting: boolean;
  errorMessage: string | null;
  onUpdatePlayer: (updates: Partial<PlayerProfile>) => void;
  onSetInputCode: (code: string) => void;
  onCreateRoom: (config?: Partial<CuantoTeAtrevesConfig>) => void;
  onJoinRoom: (code: string) => void;
  onUpdateConfig: (config: Partial<CuantoTeAtrevesConfig>) => void;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const CuantoTeAtrevesLobby: React.FC<CuantoTeAtrevesLobbyProps> = ({
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

  // Initial config choices for creation
  const [initialTime, setInitialTime] = useState<number>(45);
  const [initialCount, setInitialCount] = useState<CuantoTeAtrevesChallengesCount>(10);

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
      challengeTimeSeconds: initialTime,
      challengesCount: initialCount,
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-black uppercase tracking-widest shadow-md">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Show de Retos Verbales</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-[#FACC15] to-[#FB7185] font-display uppercase tracking-tight">
            ¿CUÁNTO TE ATREVES?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            Nombra el número de cosas prometido antes de que el reloj llegue a cero. ¿Cuánto te atreves a apostar ante tus amigos?
          </p>
        </div>

        {/* Identity Section: Priority #1 Full-Width Name Input */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-2xl space-y-3">
          <label htmlFor="player-name-cta" className="block text-xs font-black uppercase tracking-wider text-amber-300">
            TU NOMBRE O APODO
          </label>
          <input
            id="player-name-cta"
            type="text"
            maxLength={20}
            value={player.name}
            onChange={(e) => onUpdatePlayer({ name: e.target.value, avatar: '🔥' })}
            className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-orange-500/40 text-white font-bold text-base sm:text-lg placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 transition-all shadow-inner"
            placeholder="Escribe tu nombre o apodo..."
            autoComplete="nickname"
          />
          <p className="text-[11px] text-slate-400 font-medium">
            Este será tu nombre visible durante las rondas y apuestas del show.
          </p>
        </div>

        {/* Mode Selector Tabs: Crear / Unirse */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#1c0d03] border border-orange-500/20">
          <button
            type="button"
            onClick={() => setLocalMode('create')}
            className={`py-3 text-xs sm:text-sm font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
              localMode === 'create'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md scale-[1.01]'
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
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {/* Create Room Form (Minimal: Time + Challenges count) */}
        {localMode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-orange-500/20 pb-3">
              <Settings className="w-4 h-4 text-orange-400" />
              <span>Ajustes de la partida</span>
            </div>

            {/* Time per challenge */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-200">Tiempo por reto</label>
                <span className="text-sm font-black text-amber-400 font-mono">{initialTime} segundos</span>
              </div>
              <input
                type="range"
                min={15}
                max={90}
                step={5}
                value={initialTime}
                onChange={(e) => setInitialTime(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>15s (Rápido)</span>
                <span>45s (Recomendado)</span>
                <span>90s (Extremo)</span>
              </div>
            </div>

            {/* Number of challenges */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">Número de retos</label>
              <div className="grid grid-cols-4 gap-2">
                {([5, 10, 20, 'unlimited'] as CuantoTeAtrevesChallengesCount[]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setInitialCount(cnt)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      initialCount === cnt
                        ? 'bg-orange-500 border-yellow-400 text-slate-950 font-black shadow-md'
                        : 'bg-black/50 border-white/10 text-slate-300 hover:border-orange-500/40'
                    }`}
                  >
                    {cnt === 'unlimited' ? '∞ Libre' : `${cnt} Retos`}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Rule Reminder */}
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <span>
                Cada ronda revela un tema verbal aleatorio (videojuegos, países, películas...). El jugador promete una cifra y el grupo valida las respuestas en voz alta.
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting || !player.name.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isConnecting ? 'Creando sala...' : 'Crear Sala del Show'}</span>
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {localMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-orange-500/20 pb-3">
              <LogIn className="w-4 h-4 text-orange-400" />
              <span>Introduce el código de sala</span>
            </div>

            <div>
              <label htmlFor="room-code-cta" className="block text-xs font-bold text-slate-200 mb-1.5">
                Código de 5 letras
              </label>
              <input
                id="room-code-cta"
                type="text"
                maxLength={5}
                value={inputCode}
                onChange={(e) => onSetInputCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-orange-500/40 text-white font-mono font-black text-2xl tracking-widest text-center uppercase focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30 shadow-inner"
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#1c0d03]/90 border-2 border-orange-500/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EAB308] flex items-center justify-center text-2xl shadow-lg shadow-orange-500/40">
            🔥
          </div>
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
              SALA DE ESPERA
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white">
                {roomState.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 transition-all cursor-pointer"
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
        <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Jugadores en la sala</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black">
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
                      ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 border-orange-500/50 shadow-md ring-1 ring-orange-500/30'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg shrink-0">
                      {p.avatar || '🔥'}
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
        <div className="p-5 sm:p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-xl flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-orange-500/20 pb-3">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>Configuración</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Tiempo de reto:</span>
                <span className="font-mono font-bold text-amber-400">{roomState.config.challengeTimeSeconds}s</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Total de retos:</span>
                <span className="font-mono font-bold text-amber-400">
                  {roomState.config.challengesCount === 'unlimited' ? '∞ Ilimitado' : roomState.config.challengesCount}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Tipo de retos:</span>
                <span className="font-bold text-orange-300">Conocimiento verbal</span>
              </div>
            </div>

            {/* Host live adjustments */}
            {isHost && (
              <div className="space-y-2 pt-2 border-t border-orange-500/20">
                <label className="text-[11px] font-bold text-slate-300">Modificar tiempo por reto:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[30, 45, 60].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUpdateConfig({ challengeTimeSeconds: t })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        roomState.config.challengeTimeSeconds === t
                          ? 'bg-orange-500 text-slate-950 font-black border-yellow-400'
                          : 'bg-black/50 text-slate-300 border-white/10 hover:border-orange-500/40'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Host Start / Notice */}
          <div className="space-y-2 pt-3 border-t border-orange-500/20">
            {connectedPlayersCount < 3 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Se necesitan al menos 3 jugadores para comenzar.</span>
              </div>
            )}

            {isHost ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={onStartGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Comenzar Show</span>
              </button>
            ) : (
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 font-medium">
                Esperando a que el anfitrión inicie el juego...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
