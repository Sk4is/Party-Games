import React, { useState } from 'react';
import {
  CodigoRojoRoomState,
  CodigoRojoPlayer,
  CodigoRojoConfig,
  CodigoRojoDifficulty,
  CodigoRojoTimeMode,
} from '../../types/codigoRojo';
import {
  Copy,
  Check,
  Play,
  Users,
  Clock,
  Gauge,
  Crown,
  Share2,
  LogOut,
  Info,
  Shield,
  ArrowRight,
  Edit2,
} from 'lucide-react';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { saveUserProfile } from '../../utils/userProfile';
import { audio } from '../../utils/audio';

interface CodigoRojoLobbyProps {
  roomState: CodigoRojoRoomState;
  currentPlayerId: string;
  isHost: boolean;
  onUpdateConfig: (config: Partial<CodigoRojoConfig>) => void;
  onStartMission: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (playerId: string) => void;
  onUpdateProfile?: (name: string, avatar: string, color: string) => void;
}

export const CodigoRojoLobby: React.FC<CodigoRojoLobbyProps> = ({
  roomState,
  currentPlayerId,
  isHost,
  onUpdateConfig,
  onStartMission,
  onLeaveRoom,
  onKickPlayer,
  onUpdateProfile,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  const { code, config, players } = roomState;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  const handleSelectAvatar = (newAvatar: string) => {
    if (!currentPlayer) return;
    saveUserProfile({
      id: currentPlayer.id,
      name: currentPlayer.name,
      avatar: newAvatar,
      color: currentPlayer.color,
    });
    if (onUpdateProfile) {
      onUpdateProfile(currentPlayer.name, newAvatar, currentPlayer.color);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/?game=codigo-rojo&room=${code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Únete a CÓDIGO ROJO',
        text: `¡Únete a mi sala de CÓDIGO ROJO! Código: ${code}`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Calculate approximate automatic time preview
  const getEstimatedAutoTime = (diff: CodigoRojoDifficulty) => {
    if (diff === 'NORMAL') return '4:30';
    if (diff === 'DIFICIL') return '5:45';
    return '6:30';
  };

  const canStart = players.length >= 2;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-slate-950 text-slate-100 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Ambient Crimson Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-rose-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-2xl shadow-lg shadow-red-500/10">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">
                COOPERATIVO ASIMÉTRICO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase">
                Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              CÓDIGO ROJO
            </h1>
          </div>
        </div>

        {/* Room Code with Copy & Share */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border-2 border-red-500/40 shadow-md">
            <span className="text-xs font-mono text-slate-400 font-bold">SALA:</span>
            <span className="text-xl font-black font-mono tracking-widest text-red-400">
              {code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copiar código"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleShareLink}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all cursor-pointer shadow"
            title="Compartir enlace de sala"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowAbandonConfirm(true)}
            className="p-3 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-all cursor-pointer shadow"
            title="Salir de la sala"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content: Player List + Mission Settings */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
        {/* Left 2 Cols: Players List & Roles Overview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300 font-mono">
              <Users className="w-4 h-4 text-red-400" />
              <span>JUGADORES EN LA SALA ({players.length}/6)</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">Mínimo 2 jugadores</span>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p, idx) => {
              const isOperatorNext = idx === 0; // First in rotation preview
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="flex items-center gap-3">
                    {p.id === currentPlayerId ? (
                      <button
                        type="button"
                        onClick={() => {
                          audio.playClick();
                          setShowAvatarPicker(true);
                        }}
                        className="relative group w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow"
                        style={{
                          backgroundColor: `${p.color}20`,
                          borderColor: p.color,
                        }}
                        title="Haz clic para cambiar tu avatar"
                      >
                        <span>{p.avatar}</span>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-slate-300 group-hover:text-amber-400 shadow">
                          <Edit2 className="w-2.5 h-2.5" />
                        </div>
                      </button>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border"
                        style={{
                          backgroundColor: `${p.color}20`,
                          borderColor: p.color,
                        }}
                      >
                        {p.avatar}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm sm:text-base">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                        {p.id === currentPlayerId && (
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            (Tú)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-slate-400">
                          {isOperatorNext ? (
                            <span className="text-red-400 font-bold">1er OPERADOR</span>
                          ) : (
                            <span className="text-amber-400">GUÍA</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isHost && p.id !== currentPlayerId && onKickPlayer && (
                    <button
                      type="button"
                      onClick={() => onKickPlayer(p.id)}
                      className="text-xs text-slate-500 hover:text-red-400 font-mono p-1 transition-colors cursor-pointer"
                    >
                      Expulsar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Role Explainer Card */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3 mt-2">
            <Info className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-1">
                ¿Cómo funciona la rotación de roles?
              </span>
              En cada misión, exactamente <strong className="text-red-400">1 jugador es el Operador</strong> (quien manipula la máquina y no ve el manual) y todos los demás son <strong className="text-amber-400">Guías</strong> (quienes leen las instrucciones). El rol de Operador rota automáticamente y de forma justa entre todos los jugadores tras cada misión.
            </div>
          </div>
        </div>

        {/* Right 1 Col: Mission Configuration */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300 font-mono">
            <Gauge className="w-4 h-4 text-red-400" />
            <span>AJUSTES DE LA MISIÓN</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-5 shadow-lg">
            {/* Difficulty Selector */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Dificultad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['NORMAL', 'DIFICIL', 'EXTREMO'] as CodigoRojoDifficulty[]).map((diff) => {
                  const isSelected = config.difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      disabled={!isHost}
                      onClick={() =>
                        onUpdateConfig({
                          difficulty: diff,
                          modulesCount: diff === 'NORMAL' ? 3 : diff === 'DIFICIL' ? 4 : 5,
                        })
                      }
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      } ${!isHost ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block mt-1.5">
                {config.difficulty === 'NORMAL'
                  ? '3 módulos &bull; Reglas moderadas &bull; Tiempo generoso'
                  : config.difficulty === 'DIFICIL'
                  ? '4 módulos &bull; Lógica avanzada &bull; Mayor atención'
                  : '5 módulos &bull; Máxima tensión &bull; Comunicación perfecta'}
              </span>
            </div>

            {/* Time Mode */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Sistema de Tiempo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['AUTO', 'CUSTOM'] as CodigoRojoTimeMode[]).map((mode) => {
                  const isSelected = config.timeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      disabled={!isHost}
                      onClick={() => onUpdateConfig({ timeMode: mode })}
                      className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all text-center ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      } ${!isHost ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                      {mode === 'AUTO' ? 'Automático' : 'Personalizado'}
                    </button>
                  );
                })}
              </div>

              {/* Time Details */}
              {config.timeMode === 'AUTO' ? (
                <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">TIEMPO AUTOMÁTICO:</span>
                  <span className="text-red-400 font-bold text-sm">
                    ~{getEstimatedAutoTime(config.difficulty)}
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">DURACIÓN (MIN):</span>
                  <select
                    disabled={!isHost}
                    value={config.customTimeMinutes}
                    onChange={(e) =>
                      onUpdateConfig({ customTimeMinutes: parseInt(e.target.value, 10) })
                    }
                    className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-mono font-bold text-sm"
                  >
                    {[3, 4, 5, 6, 7, 8, 10].map((m) => (
                      <option key={m} value={m}>
                        {m} minutos
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Strikes Limit Info */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">LÍMITE DE STRIKES:</span>
              <span className="text-white font-bold">3 FALLOS</span>
            </div>

            {/* Start Button (Host only) */}
            {isHost ? (
              <button
                type="button"
                onClick={onStartMission}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-base uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>INICIAR MISIÓN</span>
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-400">
                Esperando a que el anfitrión inicie la misión...
              </div>
            )}

            {!canStart && isHost && (
              <span className="text-[11px] text-amber-400 font-mono text-center">
                Se recomienda un mínimo de 2 jugadores para jugar.
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-800/80">
        CÓDIGO ROJO &bull; Comunica lo que ves &bull; No compartas pantalla &bull; 100% en castellano
      </footer>

      {/* Avatar Picker Modal */}
      {currentPlayer && (
        <AvatarPickerModal
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onSelectAvatar={(av) => {
            handleSelectAvatar(av);
            setShowAvatarPicker(false);
          }}
          selectedAvatar={currentPlayer.avatar}
          currentAvatar={currentPlayer.avatar}
          playerName={currentPlayer.name}
          playerColorHex={currentPlayer.color}
          usedAvatars={players.filter((p) => p.id !== currentPlayerId).map((p) => p.avatar)}
        />
      )}

      {/* Abandon modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-red-500/40 p-6 flex flex-col items-center text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-2xl mb-3">
              🚪
            </div>
            <h3 className="text-lg font-bold text-white mb-1">¿Salir de la sala?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Volverás al menú principal y abandonarás la partida.
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowAbandonConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onLeaveRoom}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
