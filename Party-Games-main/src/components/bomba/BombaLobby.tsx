import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Crown,
  Play,
  Heart,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { BombaRoomState } from '../../types/multiplayer';
import { GameConfig } from '../../types';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { audio } from '../../utils/audio';

interface BombaLobbyProps {
  roomState: BombaRoomState;
  currentUserId: string;
  onUpdateConfig: (cfg: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const BombaLobby: React.FC<BombaLobbyProps> = ({
  roomState,
  currentUserId,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);

  const isHost = roomState.hostId === currentUserId;
  const canStart = roomState.players.length >= 2;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    audio.playSpark();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?game=la-bomba&room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    audio.playSpark();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLivesChange = (lives: number) => {
    if (!isHost) return;
    audio.playTick();
    onUpdateConfig({ startingLives: lives });
  };

  const handleMistakesChange = (mistakes: number) => {
    if (!isHost) return;
    audio.playTick();
    onUpdateConfig({ allowedMistakesPerRound: mistakes });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col p-4 sm:p-6 select-none relative overflow-x-hidden font-sans">
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 border-b border-stone-800/80">
        <button
          type="button"
          onClick={() => setIsAbandonModalOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir de la sala
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
            Sala Online: <span className="font-mono text-amber-400 font-black">{roomState.code}</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Room Code & Settings (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Room Code Card */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Código de Acceso
              </span>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-4xl font-mono font-black tracking-wider text-white">
                  {roomState.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
                    title="Copiar enlace de invitación"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                Comparte este código con tus amigos para que se unan desde su móvil, tablet o PC.
              </p>
            </div>

            {/* Match Configuration Card */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-300">
                  Ajustes de Partida
                </h3>
                {isHost ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Eres Anfitrión
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-500">Solo anfitrión</span>
                )}
              </div>

              {/* Vidas Iniciales */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                    Vidas Iniciales
                  </span>
                  <span className="font-bold text-white font-mono">{roomState.config.startingLives}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleLivesChange(num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        roomState.config.startingLives === num
                          ? 'bg-red-600 text-white shadow-md'
                          : isHost
                          ? 'bg-stone-800 text-stone-400 hover:text-stone-200'
                          : 'bg-stone-800/40 text-stone-500 cursor-default'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fallos Permitidos */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Fallos por Turno
                  </span>
                  <span className="font-bold text-white font-mono">{roomState.config.allowedMistakesPerRound}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleMistakesChange(num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        roomState.config.allowedMistakesPerRound === num
                          ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                          : isHost
                          ? 'bg-stone-800 text-stone-400 hover:text-stone-200'
                          : 'bg-stone-800/40 text-stone-500 cursor-default'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Players List & Start (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-200">
                    Jugadores en la Sala ({roomState.players.length}/10)
                  </h2>
                </div>
                <span className="text-xs text-stone-400">Mínimo 2</span>
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {roomState.players.map((player) => {
                  const isCurrent = player.id === currentUserId;
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 rounded-2xl bg-stone-950 border flex items-center justify-between gap-3 shadow-md relative"
                      style={{
                        borderColor: isCurrent ? player.color : '#292524',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                          style={{
                            backgroundColor: `${player.color}20`,
                            borderColor: player.color,
                          }}
                        >
                          {player.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white tracking-tight">
                              {player.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold text-stone-400">
                                (Tú)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                            {player.isHost && (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                                <Crown className="w-3 h-3" /> Anfitrión
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-stone-500">
                              {player.isConnected ? (
                                <>
                                  <Wifi className="w-3 h-3 text-emerald-400" /> Conectado
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3 h-3 text-stone-600" /> Desconectado
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Start Game Controls */}
              {isHost ? (
                <div>
                  <button
                    type="button"
                    disabled={!canStart}
                    onClick={() => {
                      audio.playSpark();
                      onStartGame();
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-base transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Iniciar Partida
                  </button>
                  {!canStart && (
                    <p className="text-center text-xs text-amber-400/80 mt-2.5 font-medium">
                      ⚠️ Se necesitan al menos 2 jugadores para empezar.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-center">
                  <div className="flex items-center justify-center gap-2 text-stone-300 text-sm font-semibold mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                    Esperando a que el anfitrión inicie la partida...
                  </div>
                  <p className="text-xs text-stone-500">
                    Asegúrate de tener el audio activado para no perderte las pistas de la bomba.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={isAbandonModalOpen}
        onCancel={() => setIsAbandonModalOpen(false)}
        onConfirm={onLeaveRoom}
        title="¿Salir de la sala?"
        message="Saldrás de la sala multijugador y volverás al menú principal."
      />
    </div>
  );
};
