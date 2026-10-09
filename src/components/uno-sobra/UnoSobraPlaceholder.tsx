import React from 'react';
import { UnoSobraRoomState } from '../../types/unoSobra';
import { Skull, Clock, ShieldAlert, Award, Users, RotateCcw, LogOut, Radio, UserCheck, Shield } from 'lucide-react';

interface UnoSobraPlaceholderProps {
  roomState: UnoSobraRoomState;
  myPlayerId: string;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
  onCastVote: (targetPlayerId: string) => void;
}

export const UnoSobraPlaceholder: React.FC<UnoSobraPlaceholderProps> = ({
  roomState,
  myPlayerId,
  onReturnToLobby,
  onLeaveRoom,
  onCastVote,
}) => {
  const isHost = roomState.hostId === myPlayerId;
  const activeScenario = roomState.activeScenario;
  const isIntro = roomState.phase === 'SCENARIO_INTRO';
  const myPlayerState = roomState.players.find((p) => p.id === myPlayerId);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 text-slate-100">
      {/* Dramatic Top HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0b1120]/95 border-2 border-[#8B5CF6]/50 shadow-[0_0_35px_rgba(139,92,246,0.25)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-2xl shadow-lg shadow-[#8B5CF6]/35">
            👥
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] via-[#38BDF8] to-[#F472B6] font-display">
              UNO SOBRA
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200/80">
              <span>SALA: <strong className="text-cyan-400 font-mono tracking-widest">{roomState.code}</strong></span>
              <span>•</span>
              <span>RONDA #{roomState.currentRound}</span>
              <span>•</span>
              <span className="text-purple-300 font-bold uppercase">Eliminación definitiva</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={onReturnToLobby}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Volver a la sala</span>
            </button>
          )}
          <button
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Abandonar</span>
          </button>
        </div>
      </div>

      {/* Main Dramatic Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Card & Discussion */}
        <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-[#070b16]/95 border-2 border-[#8B5CF6]/40 shadow-2xl relative overflow-hidden">
          {/* Phase Badge */}
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-300 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>{isIntro ? 'Presentación del escenario crítico' : 'Fase de debate y alegatos'}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black tracking-wide">
              {isIntro ? 'INTRODUCCIÓN (10s)' : 'DEBATE ABIERTO'}
            </span>
          </div>

          {/* Scenario Description */}
          {activeScenario && (
            <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  Escenario Aleatorio
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                  Plazas disponibles: {activeScenario.slotsAvailable}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white font-display">
                {activeScenario.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {activeScenario.description}
              </p>
            </div>
          )}

          {/* Private Role Box */}
          {myPlayerState?.privateRole && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 to-cyan-950/40 border-2 border-cyan-400/50 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Tu rol confidencial en este escenario</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-200 font-bold uppercase">
                  Privado
                </span>
              </div>
              <div className="text-xl font-black text-white">
                {myPlayerState.privateRole.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {myPlayerState.privateRole.description}
              </p>
              <div className="text-xs text-amber-200 bg-black/50 p-3 rounded-xl border border-amber-500/30 leading-relaxed">
                <strong className="text-amber-400">Tu argumento clave de supervivencia:</strong>{' '}
                {myPlayerState.privateRole.secretArgument}
              </div>
            </div>
          )}

          {/* Countdown timer */}
          <div className="p-6 rounded-2xl bg-black/60 border border-purple-500/30 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-cyan-400 mb-2" />
            <span className="text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-purple-400 tabular-nums">
              {Math.floor(roomState.timerRemainingSeconds / 60)}:
              {(roomState.timerRemainingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
              {isIntro ? 'Tiempo de lectura inicial' : 'Tiempo de debate restante'}
            </span>
          </div>

          {/* Discussion Instructions */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10 text-xs text-slate-300 leading-relaxed">
            💬 <strong>Dinámica de juego:</strong> Hablad libremente ante el grupo y defended por qué vuestro rol es imprescindible para la expedición. Al agotarse el debate, se votará en secreto quién debe abandonar la cápsula.
          </div>
        </div>

        {/* Right: Survivor Status */}
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-[#0b1120]/95 border border-purple-500/30 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300 uppercase tracking-wider border-b border-purple-500/20 pb-3">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Supervivientes ({roomState.players.length})</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {roomState.players.map((p) => {
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    p.isEliminated
                      ? 'bg-rose-950/20 border-rose-500/30 opacity-60'
                      : isMe
                      ? 'bg-purple-900/30 border-purple-500/50'
                      : 'bg-black/30 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{p.avatar || '👤'}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${p.isEliminated ? 'line-through text-rose-300' : 'text-white'}`}>
                          {p.name}
                        </span>
                        {isMe && <span className="text-[10px] text-cyan-300 font-mono">(Tú)</span>}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.isEliminated ? 'Eliminado permanentemente' : p.isConnected ? 'En debate' : 'Desconectado'}
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.isEliminated ? (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                        <Skull className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
