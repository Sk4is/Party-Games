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
  onSelectOperator?: (operatorPlayerId: string) => void;
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
  onSelectOperator,
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
  const getEstimatedAutoTime = (diff: CodigoRojoDifficulty, count?: number) => {
    if (diff === 'NORMAL') return count === 2 ? '3:30' : '4:30';
    if (diff === 'DIFICIL') return count === 5 ? '6:45' : '5:45';
    return count === 6 ? '7:30' : '6:30';
  };

  const operatorPlayer =
    players.find((p) => p.role === 'OPERADOR') ||
    players.find((p) => p.id === roomState.operatorId) ||
    (players.length > 0 ? players[0] : undefined);
  const operatorCount = players.filter((p) => p.role === 'OPERADOR').length;
  const guideCount = players.filter((p) => p.role === 'GUIA').length;
  const hasExactlyOneOperator = operatorCount === 1;
  const hasAtLeastOneGuide = guideCount >= 1;
  const canStart = players.length >= 2 && hasExactlyOneOperator && hasAtLeastOneGuide;

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-bold">OPERADOR SELECCIONADO:</span>
              {operatorPlayer ? (
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {operatorPlayer.name}
                </span>
              ) : (
                <span className="text-amber-400 font-bold">Ninguno (selecciona uno)</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">
                GUÍAS: <strong className="text-amber-400">{guideCount}</strong>
              </span>
              <span className="text-slate-500">({players.length}/6 agentes)</span>
            </div>
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const isOp = p.role === 'OPERADOR' || (operatorPlayer && operatorPlayer.id === p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border transition-all shadow-md ${
                    isOp
                      ? 'border-red-500/50 shadow-red-950/30 ring-1 ring-red-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.id === currentPlayerId ? (
                      <button
                        type="button"
                        onClick={() => {
                          audio.playClick();
                          setShowAvatarPicker(true);
                        }}
                        className="relative group w-12 h-12 rounded-xl flex items-center justify-center text-2xl border transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow flex-shrink-0"
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
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border flex-shrink-0"
                        style={{
                          backgroundColor: `${p.color}20`,
                          borderColor: p.color,
                        }}
                      >
                        {p.avatar}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {p.name}
                        </span>
                        {p.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                        {p.id === currentPlayerId && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 flex-shrink-0">
                            (Tú)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isOp ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500/80 text-red-300 text-[10px] font-black uppercase tracking-wider shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                            🚨 OPERADOR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                            📋 GUÍA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {!isOp && onSelectOperator && (
                      <button
                        type="button"
                        onClick={() => onSelectOperator(p.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-800 active:scale-95 border border-red-500/60 hover:border-red-400 text-red-200 text-xs font-mono font-bold transition-all cursor-pointer shadow"
                        title={p.id === currentPlayerId ? 'Elegir ser el Operador' : 'Asignar como Operador'}
                      >
                        {p.id === currentPlayerId ? 'Ser Operador' : 'Asignar'}
                      </button>
                    )}

                    {isHost && p.id !== currentPlayerId && onKickPlayer && (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(p.id)}
                        className="text-xs text-slate-500 hover:text-red-400 font-mono p-1 transition-colors cursor-pointer"
                        title="Expulsar jugador"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Explainer Card */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3 mt-2">
            <Shield className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-1">
                Asignación Manual de Roles (1 Operador + 1 o más Guías)
              </span>
              En cada misión debe haber exactamente <strong className="text-red-400">1 Operador</strong> (quien interactúa con los módulos y no ve el manual) y al menos <strong className="text-amber-400">1 Guía</strong> (quienes consultan el manual técnico). Pulsa <strong className="text-red-300">«Ser Operador»</strong> o <strong className="text-red-300">«Asignar»</strong> en cualquier agente para definir quién controla la máquina.
            </div>
          </div>
        </div>

        {/* Right 1 Col: Read-Only Mission Summary & Mission Control */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-300 font-mono">
            <Gauge className="w-4 h-4 text-red-400" />
            <span>MISIÓN CONFIGURADA</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-4 shadow-lg">
            {/* Read-Only Parameters Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Dificultad */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Dificultad
                </span>
                <span className="text-sm font-black font-mono text-white flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.difficulty === 'NORMAL'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                        : config.difficulty === 'DIFICIL'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    }`}
                  />
                  {config.difficulty}
                </span>
              </div>

              {/* Módulos */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Módulos
                </span>
                <span className="text-sm font-black font-mono text-red-400">
                  {config.modulesCount || (config.difficulty === 'NORMAL' ? 3 : config.difficulty === 'DIFICIL' ? 4 : 5)} paneles
                </span>
              </div>

              {/* Tiempo */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Tiempo
                </span>
                <span className="text-sm font-black font-mono text-red-400">
                  {(() => {
                    const secs = config.durationSeconds || (config.customTimeMinutes ? Math.round(config.customTimeMinutes * 60) : 270);
                    const m = Math.floor(secs / 60);
                    const s = secs % 60;
                    return `${m}:${s.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>

              {/* Fallos permitidos */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Fallos máx.
                </span>
                <span className="text-xs font-bold font-mono text-slate-200">
                  {config.maxStrikes || 3} strikes
                </span>
              </div>
            </div>

            {/* Config note */}
            <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/50 flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>Ajustes establecidos por el anfitrión al crear la sala.</span>
            </div>

            <div className="h-px w-full bg-slate-800/80 my-1" />

            {/* Start Button (Host only) or Waiting Banner */}
            {isHost ? (
              <button
                type="button"
                disabled={!canStart}
                onClick={onStartMission}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-base uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>INICIAR MISIÓN</span>
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Esperando a que el anfitrión inicie la misión...</span>
              </div>
            )}

            {!canStart && isHost && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 font-mono text-center leading-tight">
                {players.length < 2
                  ? 'Se requieren al menos 2 jugadores para iniciar la misión.'
                  : !hasExactlyOneOperator
                  ? 'Debes asignar exactamente 1 Operador.'
                  : 'Debe haber al menos 1 Guía en la sala.'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto text-center text-xs text-slate-500 py-3 border-t border-slate-800/80">
        CÓDIGO ROJO • Comunica lo que ves • No compartas pantalla • 100% en castellano
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
