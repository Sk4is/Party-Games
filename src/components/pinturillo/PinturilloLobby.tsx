import React, { useState } from 'react';
import { PinturilloRoomState, PinturilloPlayer, PinturilloConfig } from '../../types/pinturillo';
import { AVATARS } from '../../data/players';
import { audio } from '../../utils/audio';
import { Copy, Check, Users, Play, Crown, Clock, Repeat, ArrowLeft, Share2 } from 'lucide-react';

interface PinturilloLobbyProps {
  roomState: PinturilloRoomState;
  localPlayer: { id: string; name: string; avatar: string; color: string };
  isHost: boolean;
  onUpdateConfig: (config: Partial<PinturilloConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const ROUND_TIME_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s (Recomendado)', value: 90 },
  { label: '120s', value: 120 },
  { label: '180s', value: 180 },
];

const VUELTAS_OPTIONS = [
  { label: '1 vuelta', value: 1 },
  { label: '2 vueltas', value: 2 },
  { label: '3 vueltas', value: 3 },
  { label: '5 vueltas', value: 5 },
];

export const PinturilloLobby: React.FC<PinturilloLobbyProps> = ({
  roomState,
  localPlayer,
  isHost,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    audio.playClick();
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    audio.playClick();
    const url = `${window.location.origin}${window.location.pathname}?game=pinturillo&room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStart = () => {
    if (roomState.players.length < 2) return;
    audio.playGameStart();
    onStartGame();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Salir de la sala</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Multijugador Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Room Code, Share, Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* Room Code Card */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border-2 border-amber-500/40 shadow-2xl relative overflow-hidden">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                Código de la sala
              </span>
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-slate-950 border-2 border-amber-400/50 shadow-inner mb-4">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-400">
                  {roomState.code}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡Código copiado!' : 'Copiar código'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-500/40"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Enlace copiado!' : 'Compartir enlace'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Game Settings (Host controls) */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Ajustes de la partida</span>
              {!isHost && (
                <span className="text-xs font-normal text-slate-500 ml-auto">(Solo el anfitrión puede modificarlos)</span>
              )}
            </h3>

            {/* Round Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tiempo de dibujo por turno
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROUND_TIME_OPTIONS.map(opt => {
                  const isSelected = roomState.config.roundTimeSeconds === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        audio.playClick();
                        onUpdateConfig({ roundTimeSeconds: opt.value });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-800 disabled:opacity-60 disabled:hover:bg-slate-850'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Vueltas */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-amber-400" />
                <span>Rondas completas (vueltas)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VUELTAS_OPTIONS.map(opt => {
                  const isSelected = roomState.config.totalVueltas === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        audio.playClick();
                        onUpdateConfig({ totalVueltas: opt.value });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-800 disabled:opacity-60 disabled:hover:bg-slate-850'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Total de turnos calculados:{' '}
                <strong className="text-amber-400">
                  {roomState.players.length * roomState.config.totalVueltas} turnos
                </strong>{' '}
                ({roomState.config.totalVueltas} turno(s) de dibujo por cada jugador).
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Players in lobby & Start Button */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Jugadores en la sala</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-amber-400">
                {roomState.players.length}/10
              </span>
            </div>

            {/* Players list */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-72">
              {roomState.players.map(p => {
                const isMe = p.id === localPlayer.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isMe
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                        {p.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-100">{p.name}</span>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                              Tú
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                    </div>

                    {p.isHost && (
                      <div
                        title="Anfitrión de la sala"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black"
                      >
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Host</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Start Button or Waiting Status */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              {isHost ? (
                <div>
                  <button
                    type="button"
                    disabled={roomState.players.length < 2}
                    onClick={handleStart}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Iniciar Partida</span>
                  </button>

                  {roomState.players.length < 2 && (
                    <p className="text-xs text-center text-amber-400/80 mt-2 font-medium">
                      Invita al menos a 1 amigo para poder empezar (mínimo 2 jugadores).
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Esperando a que el anfitrión inicie la partida...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
