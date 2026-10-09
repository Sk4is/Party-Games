import React, { useState } from 'react';
import {
  ElPrecioJustoRoomState,
  ElPrecioJustoConfig,
} from '../../types/elPrecioJusto';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import {
  Coins,
  Users,
  Copy,
  Check,
  Crown,
  Settings,
  LogIn,
  Play,
  LogOut,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface ElPrecioJustoLobbyProps {
  roomState: ElPrecioJustoRoomState | null;
  player: PlayerProfile;
  inputCode: string;
  isConnecting: boolean;
  errorMessage: string | null;
  onUpdatePlayer: (updates: Partial<PlayerProfile>) => void;
  onSetInputCode: (code: string) => void;
  onCreateRoom: (config?: Partial<ElPrecioJustoConfig>) => void;
  onJoinRoom: (code: string) => void;
  onUpdateConfig: (config: Partial<ElPrecioJustoConfig>) => void;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const MONEY_CHOICES = [10000, 50000, 100000, 500000, 1000000];

export const ElPrecioJustoLobby: React.FC<ElPrecioJustoLobbyProps> = ({
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
  const [initialMaxMoney, setInitialMaxMoney] = useState<number>(100000);

  const isHost = Boolean(roomState && roomState.hostId === player.id);
  const myPlayerState = roomState?.players.find((p) => p.id === player.id);
  const isReady = Boolean(myPlayerState?.isReady);
  const connectedPlayersCount = roomState ? roomState.players.filter((p) => p.isConnected).length : 0;
  const canStart = Boolean(isHost && connectedPlayersCount >= 3);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

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
      maxMoneyAmount: initialMaxMoney,
      minMoneyAmount: 5,
      speakingTurnMode: 'free_speech',
      investigationTimerMode: 'no_forced_timer',
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-widest shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Deducción Secreta de Patrimonio</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] via-[#FBBF24] to-[#F59E0B] font-display uppercase tracking-tight">
            EL PRECIO JUSTO
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
            Cada inversor guarda un importe secreto en su libreta privada. Descubrid la fortuna de los rivales sin delatar la vuestra.
          </p>
        </div>

        {/* Identity Section: Priority #1 Full-Width Name Input */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#021b14]/95 border-2 border-emerald-500/30 shadow-2xl space-y-3">
          <label htmlFor="player-name-epj" className="block text-xs font-black uppercase tracking-wider text-amber-300">
            TU NOMBRE O APODO
          </label>
          <input
            id="player-name-epj"
            type="text"
            maxLength={20}
            value={player.name}
            onChange={(e) => onUpdatePlayer({ name: e.target.value, avatar: '💰' })}
            className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-emerald-500/40 text-white font-bold text-base sm:text-lg placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 transition-all shadow-inner"
            placeholder="Escribe tu nombre o apodo..."
            autoComplete="nickname"
          />
          <p className="text-[11px] text-slate-400 font-medium">
            Tu nombre identificará tu cartera de inversión ante los demás participantes.
          </p>
        </div>

        {/* Mode Selector Tabs: Crear / Unirse */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#03241b] border border-emerald-500/20">
          <button
            type="button"
            onClick={() => setLocalMode('create')}
            className={`py-3 text-xs sm:text-sm font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
              localMode === 'create'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 text-slate-950 font-black shadow-md scale-[1.01]'
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
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-500 text-slate-950 font-black shadow-md scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {/* Create Room Form (Max money up to 1,000,000 €) */}
        {localMode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="p-6 rounded-3xl bg-[#021b14]/95 border-2 border-emerald-500/30 shadow-2xl space-y-5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-emerald-500/20 pb-3">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Ajustes de la mesa de inversión</span>
            </div>

            {/* Max Money choices */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">Importe máximo de la fortuna</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MONEY_CHOICES.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInitialMaxMoney(amt)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      initialMaxMoney === amt
                        ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-black border-amber-300 shadow-md'
                        : 'bg-black/50 border-white/10 text-slate-300 hover:border-emerald-500/40'
                    }`}
                  >
                    {formatMoney(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Rules summary */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200/90 leading-relaxed space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Generación de importes redondeados</span>
              </div>
              <p>
                Los importes secretos se calculan de 5 € hasta {formatMoney(initialMaxMoney)} mediante múltiplos limpios según el orden de magnitud (5, 50, 500, 5.000 o 50.000 €).
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isConnecting ? 'Creando sala...' : 'Abrir Mesa de Inversión'}</span>
            </button>
          </form>
        )}

        {/* Join Room Form */}
        {localMode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="p-6 rounded-3xl bg-[#021b14]/95 border-2 border-emerald-500/30 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-emerald-500/20 pb-3">
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Introduce el código de sala</span>
            </div>

            <div>
              <label htmlFor="room-code-epj" className="block text-xs font-bold text-slate-200 mb-1.5">
                Código de 5 letras
              </label>
              <input
                id="room-code-epj"
                type="text"
                maxLength={5}
                value={inputCode}
                onChange={(e) => onSetInputCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/70 border-2 border-emerald-500/40 text-white font-mono font-black text-2xl tracking-widest text-center uppercase focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 shadow-inner"
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
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isConnecting ? 'Conectando...' : 'Entrar a la Mesa'}</span>
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#03241b]/90 border-2 border-emerald-500/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#F59E0B] flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/40">
            💰
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
                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer"
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
        <div className="md:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#021b14]/95 border-2 border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Inversores en la mesa</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
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
                      ? 'bg-gradient-to-r from-emerald-500/20 to-amber-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg shrink-0">
                      {p.avatar || '💰'}
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
        <div className="p-5 sm:p-6 rounded-3xl bg-[#021b14]/95 border-2 border-emerald-500/30 shadow-xl flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wide border-b border-emerald-500/20 pb-3">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Configuración</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Fortuna máxima:</span>
                <span className="font-mono font-bold text-amber-400">{formatMoney(roomState.config.maxMoneyAmount)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Turnos de palabra:</span>
                <span className="font-bold text-emerald-300">Libres</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="text-slate-400 font-medium">Cronómetro forzado:</span>
                <span className="font-bold text-emerald-300">Desactivado</span>
              </div>
            </div>

            {/* Host live adjustments */}
            {isHost && (
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                <label className="text-[11px] font-bold text-slate-300">Modificar importe máximo:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {MONEY_CHOICES.slice(0, 4).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onUpdateConfig({ maxMoneyAmount: amt })}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        roomState.config.maxMoneyAmount === amt
                          ? 'bg-emerald-600 text-white font-black border-amber-300'
                          : 'bg-black/50 text-slate-300 border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      {formatMoney(amt)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Host Start / Notice */}
          <div className="space-y-2 pt-3 border-t border-emerald-500/20">
            {connectedPlayersCount < 3 && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-amber-300 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Se necesitan al menos 3 jugadores para comenzar.</span>
              </div>
            )}

            {isHost ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={onStartGame}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Comenzar Mesa</span>
              </button>
            ) : (
              <div className="text-center p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-400 font-medium">
                Esperando a que el anfitrión abra la mesa...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
