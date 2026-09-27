import React, { useState } from 'react';
import {
  EntreToposRoomState,
  EntreToposConfig,
  MoleCustomization,
  WritingDurationSeconds,
  DiscussionDurationSeconds,
  TotalRoundsCount,
} from '../../types/entreTopos';
import { MolePortrait } from './MolePortrait';
import { MoleCustomizerModal } from './MoleCustomizerModal';
import {
  Crown,
  Play,
  Copy,
  Check,
  Palette,
  Users,
  Clock,
  Sparkles,
  HelpCircle,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposLobbyProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onStartGame: () => void;
  onUpdateConfig: (config: Partial<EntreToposConfig>) => void;
  onUpdateMole: (customization: MoleCustomization, newName?: string) => void;
  onLeaveRoom: () => void;
  onOpenHowToPlay?: () => void;
}

export const EntreToposLobby: React.FC<EntreToposLobbyProps> = ({
  roomState,
  localPlayerId,
  onStartGame,
  onUpdateConfig,
  onUpdateMole,
  onLeaveRoom,
  onOpenHowToPlay,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const playerCount = roomState.players.length;
  const canStart = isHost && playerCount >= 3 && playerCount <= 10;

  const handleCopyCode = () => {
    audio.playTurnChange();
    navigator.clipboard?.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in select-none">
      {/* =========================================================================
          TOP BANNER: ROOM CODE & ACTION BUTTONS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-[#1e1b18]/90 border-2 border-[#3d3229] backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-3xl shadow-inner">
            🕵️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                SALA ENTRE TOPOS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                EN ESPERA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide font-display">
              CÓDIGO:{' '}
              <span className="text-amber-400 tracking-widest font-mono select-all">
                {roomState.code}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedCode ? '¡Copiado!' : 'Copiar código'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomizer(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
          >
            <Palette className="w-4 h-4" />
            <span>Editar Topo</span>
          </button>

          {onOpenHowToPlay && (
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Reglas</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN GRID: PLAYERS GALLERY (3 TO 10 PLAYERS) + HOST CONFIG
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PLAYERS GALLERY (SUSPECT LINEUP) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[#1e1b18]/80 border-2 border-[#3d3229] shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-amber-200 uppercase tracking-wide font-display">
                FILA DE SOSPECHOSOS ({playerCount}/10)
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              Mínimo 3 &bull; Máximo 10
            </span>
          </div>

          {/* SUSPECT MOLE CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {roomState.players.map((p) => {
              const isLocal = p.id === localPlayerId;
              return (
                <div
                  key={p.id}
                  className={`relative p-3.5 rounded-2xl border-2 flex flex-col items-center justify-between transition-all ${
                    isLocal
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-[#2b241e]/70 border-[#3d3229]'
                  }`}
                >
                  {/* Top row badges (never overlap the mole portrait) */}
                  <div className="w-full min-h-[20px] flex items-center justify-between gap-1 mb-1">
                    {p.isHost ? (
                      <div className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow">
                        <Crown className="w-3 h-3 fill-current" />
                        <span>ANFITRIÓN</span>
                      </div>
                    ) : (
                      <span />
                    )}

                    {isLocal && (
                      <div className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                        TÚ
                      </div>
                    )}
                  </div>

                  {/* Mole Portrait */}
                  <div className="w-24 h-24 my-1.5 flex items-center justify-center shrink-0">
                    <MolePortrait
                      customization={p.moleCustomization}
                      size="md"
                      showShadow={true}
                    />
                  </div>

                  {isLocal && (
                    <button
                      type="button"
                      onClick={() => setShowCustomizer(true)}
                      className="mt-1 mb-1 px-2.5 py-1 rounded-lg bg-[#2b241e] hover:bg-[#3d3229] border border-amber-400/40 text-[10px] font-black text-amber-300 uppercase tracking-wider transition-all cursor-pointer"
                    >
                      ✏️ EDITAR TOPO
                    </button>
                  )}

                  {/* Player Name */}
                  <span className="font-black text-sm text-white tracking-wide truncate max-w-full uppercase text-center mt-1">
                    {p.name}
                  </span>

                  <span className="text-[10px] text-amber-400/80 font-bold uppercase mt-0.5">
                    {p.isConnected ? 'LISTO' : 'DESCONECTADO'}
                  </span>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, 3 - playerCount) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[160px] rounded-2xl border-2 border-dashed border-[#3d3229] bg-black/20 flex flex-col items-center justify-center p-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 mb-2">
                  🕵️
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Esperando sospechoso {playerCount + idx + 1}...
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* HOST CONTROLS / ROOM SETTINGS */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-[#1e1b18]/80 border-2 border-[#3d3229] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Clock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-amber-200 uppercase tracking-wide font-display">
                AJUSTES DE PARTIDA
              </h2>
            </div>

            {/* CONFIG: TIEMPO PARA ESCRIBIR */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                Tiempo para escribir
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {([20, 30, 45, 60] as WritingDurationSeconds[]).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      audio.playTurnChange();
                      onUpdateConfig({ writingTimeSeconds: sec });
                    }}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      roomState.config.writingTimeSeconds === sec
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    } ${!isHost ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* CONFIG: TIEMPO DE CHARLA */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                Tiempo de charla
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([60, 90, 120] as DiscussionDurationSeconds[]).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      audio.playTurnChange();
                      onUpdateConfig({ discussionTimeSeconds: sec });
                    }}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      roomState.config.discussionTimeSeconds === sec
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    } ${!isHost ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* CONFIG: RONDAS */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5">
                Rondas de juego
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([1, 3, 5] as TotalRoundsCount[]).map((rounds) => (
                  <button
                    key={rounds}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      audio.playTurnChange();
                      onUpdateConfig({ totalRounds: rounds });
                    }}
                    className={`py-2 text-xs font-black rounded-xl border transition-all ${
                      roomState.config.totalRounds === rounds
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    } ${!isHost ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {rounds} {rounds === 1 ? 'ronda' : 'rondas'}
                  </button>
                ))}
              </div>
            </div>

            {/* NOTIFICATION MESSAGE IF < 3 PLAYERS */}
            {playerCount < 3 && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-xs font-semibold mb-4">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Hacen falta al menos <strong>3 jugadores</strong> para iniciar la partida de deducción social. Invita a tus amigos con el código de sala.
                </span>
              </div>
            )}
          </div>

          {/* START BUTTON (HOST ONLY) */}
          {isHost ? (
            <button
              type="button"
              disabled={!canStart}
              onClick={() => {
                audio.playTurnChange();
                onStartGame();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer font-display"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>
                {playerCount < 3
                  ? `FALTAN ${3 - playerCount} JUGADORES`
                  : 'EMPEZAR PARTIDA'}
              </span>
            </button>
          ) : (
            <div className="w-full py-3.5 px-4 rounded-2xl bg-black/40 border border-white/10 text-center text-xs font-bold text-slate-300 uppercase tracking-wide">
              Esperando a que el anfitrión inicie la partida...
            </div>
          )}
        </div>
      </div>

      {/* CUSTOMIZER MODAL */}
      <MoleCustomizerModal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        playerName={localPlayer?.name || 'Sospechoso'}
        initialCustomization={localPlayer?.moleCustomization}
        onSave={(newCustomization, newName) => {
          onUpdateMole(newCustomization, newName);
          localStorage.setItem('entre_topos_mole_customization_v2', JSON.stringify(newCustomization));
        }}
      />
    </div>
  );
};
