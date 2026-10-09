import React, { useState } from 'react';
import { CuantoTeAtrevesRoomState } from '../../types/cuantoTeAtreves';
import {
  Flame,
  Clock,
  RotateCcw,
  LogOut,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Trophy,
  ArrowRight,
  User,
  Sparkles,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface CuantoTeAtrevesPlaceholderProps {
  roomState: CuantoTeAtrevesRoomState;
  myPlayerId: string;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
  onSelectPlayer: (playerId: string) => void;
  onSetBet: (bet: number) => void;
  onStartChallenge: () => void;
  onResolveChallenge: (outcome: 'SUCCESS' | 'SURRENDER') => void;
  onTogglePauseTimer: () => void;
  onNextRound: () => void;
  onFinishGame: () => void;
}

export const CuantoTeAtrevesPlaceholder: React.FC<CuantoTeAtrevesPlaceholderProps> = ({
  roomState,
  myPlayerId,
  onReturnToLobby,
  onLeaveRoom,
  onSelectPlayer,
  onSetBet,
  onStartChallenge,
  onResolveChallenge,
  onTogglePauseTimer,
  onNextRound,
  onFinishGame,
}) => {
  const isHost = roomState.hostId === myPlayerId;
  const activePlayer = roomState.players.find((p) => p.id === roomState.activePlayerId);
  const isMyTurn = roomState.activePlayerId === myPlayerId;
  const [localBetInput, setLocalBetInput] = useState<number>(roomState.targetBet || 5);

  const handleBetChange = (delta: number) => {
    const next = Math.max(1, localBetInput + delta);
    setLocalBetInput(next);
    onSetBet(next);
    audio.playClick();
  };

  const handleBetDirect = (val: number) => {
    const next = Math.max(1, Math.floor(val));
    setLocalBetInput(next);
    onSetBet(next);
  };

  const handleSuccessClick = () => {
    audio.playAnswerAccepted();
    onResolveChallenge('SUCCESS');
  };

  const handleSurrenderClick = () => {
    audio.playExplosion();
    onResolveChallenge('SURRENDER');
  };

  // Podium sorting for GAME_OVER
  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-5 p-4 sm:p-6 text-slate-100">
      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#1c0d03]/90 border-2 border-orange-500/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EAB308] flex items-center justify-center text-2xl shadow-lg shadow-orange-500/40">
            🔥
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#F97316] via-[#FACC15] to-[#FB7185] font-display">
              ¿CUÁNTO TE ATREVES?
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-200/80">
              <span>SALA: <strong className="text-amber-400 font-mono tracking-widest">{roomState.code}</strong></span>
              <span>•</span>
              <span>
                RETO #{roomState.currentChallengeNumber} DE {roomState.config.challengesCount === 'unlimited' ? '∞' : roomState.config.challengesCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Volver a la sala</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abandonar</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          PHASE: GAME_OVER (FINAL PODIUM)
          ===================================================================== */}
      {roomState.phase === 'GAME_OVER' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#140802]/95 border-2 border-yellow-500/40 shadow-2xl space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-slate-950 text-3xl shadow-xl shadow-yellow-500/30 mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-tight">
              ¡FIN DE LA PARTIDA!
            </h3>
            <p className="text-sm text-slate-300">
              Clasificación final del show tras todos los desafíos disputados.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2.5">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400 text-white shadow-lg ring-1 ring-yellow-400/50'
                    : 'bg-black/50 border-white/10 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                    idx === 0 ? 'bg-yellow-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="text-left">
                    <div className="font-bold text-sm text-white">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.challengesCompleted} retos logrados</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black font-mono text-amber-400">{p.score} pts</span>
                </div>
              </div>
            ))}
          </div>

          {isHost && (
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onReturnToLobby}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-orange-500/30 transition-all cursor-pointer active:scale-95"
              >
                Volver a la sala de espera
              </button>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHASE A / B / C / D / E / F: ACTIVE GAMEPLAY
          ===================================================================== */}
      {roomState.phase !== 'GAME_OVER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stage Arena (2 Columns) */}
          <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/40 shadow-2xl relative overflow-hidden">
            {/* Phase Indicator Header */}
            <div className="flex items-center justify-between border-b border-orange-500/20 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>
                  {roomState.phase === 'TOPIC_REVEAL' && 'Fase A: Tema Revelado'}
                  {roomState.phase === 'BETTING' && 'Fase B: Apuesta del Desafiante'}
                  {roomState.phase === 'CHALLENGE_ACTIVE' && 'Fase C: Reto en Directo'}
                  {roomState.phase === 'CHALLENGE_RESULT' && 'Resultado del Reto'}
                </span>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                roomState.phase === 'CHALLENGE_ACTIVE'
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse'
                  : 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
              }`}>
                {roomState.phase === 'CHALLENGE_ACTIVE' ? '¡CRONÓMETRO EN MARCHA!' : 'EN ESPERA'}
              </span>
            </div>

            {/* PHASE A & B: TOPIC REVEAL CARD */}
            {roomState.currentTopic && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1c0d03] to-[#2c1303] border-2 border-yellow-500/30 text-center space-y-2 shadow-inner">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>TEMA DEL RETO</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-amber-200">
                  «{roomState.currentTopic.title}»
                </h3>
                {roomState.currentTopic.hint && (
                  <p className="text-xs text-amber-200/80 font-medium max-w-md mx-auto">
                    {roomState.currentTopic.hint}
                  </p>
                )}
              </div>
            )}

            {/* PHASE A: ADMIN SELECTS PLAYER */}
            {roomState.phase === 'TOPIC_REVEAL' && (
              <div className="space-y-4 py-2">
                <div className="text-center sm:text-left">
                  <h4 className="text-base font-bold text-white">
                    {isHost
                      ? '👉 Elige al jugador que intentará el reto:'
                      : 'Esperando a que el anfitrión elija al desafiante...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    El desafiante elegido dirá en voz alta cuántas cosas promete nombrar.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roomState.players.map((p) => {
                    const isEligible = p.isConnected;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!isHost || !isEligible}
                        onClick={() => onSelectPlayer(p.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                          isHost
                            ? 'cursor-pointer hover:border-yellow-400 hover:scale-[1.02] active:scale-95 bg-black/60 border-orange-500/30'
                            : 'cursor-default bg-black/40 border-white/5 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.avatar || '🔥'}</span>
                          <div>
                            <span className="font-bold text-sm text-white block">{p.name}</span>
                            <span className="text-[10px] text-amber-400/80 font-mono">{p.score} pts</span>
                          </div>
                        </div>

                        {isHost && (
                          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            Elegir <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PHASE B & C: SELECTED PLAYER + MAKING BET */}
            {roomState.phase === 'BETTING' && activePlayer && (
              <div className="space-y-5 py-2">
                <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-2xl shrink-0">
                    {activePlayer.avatar || '🔥'}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      DESAFIANTE ELEGIDO
                    </span>
                    <h4 className="text-lg font-black text-white">
                      {activePlayer.name} {isMyTurn && '(¡Eres tú!)'}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isMyTurn
                        ? 'Di en voz alta cuántos ejemplos válidos crees que puedes nombrar antes del tiempo.'
                        : `${activePlayer.name} debe anunciar en voz alta cuántos ejemplos se atreve a nombrar.`}
                    </p>
                  </div>
                </div>

                {/* Bet Input Control */}
                <div className="p-5 rounded-2xl bg-black/60 border-2 border-orange-500/30 space-y-3 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Cifra prometida por el jugador
                  </span>

                  {isHost ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleBetChange(-1)}
                          className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-2xl flex items-center justify-center cursor-pointer active:scale-90"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={localBetInput}
                          onChange={(e) => handleBetDirect(Number(e.target.value))}
                          className="w-24 text-center font-mono font-black text-4xl bg-transparent border-b-2 border-yellow-400 text-yellow-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleBetChange(1)}
                          className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-2xl flex items-center justify-center cursor-pointer active:scale-90"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex justify-center gap-2">
                        {[5, 10, 15, 20].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleBetDirect(preset)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-200 cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        {localBetInput >= 10 ? '🔥 Apuesta épica: ¡Otorga 3 puntos si lo consigue!' : '⚡ Apuesta estándar: Otorga 2 puntos.'}
                      </p>

                      <button
                        type="button"
                        onClick={onStartChallenge}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base uppercase tracking-wider shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>¡COMENZAR RETO!</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <div className="text-4xl font-mono font-black text-yellow-400">
                        {roomState.targetBet || 'Esperando cifra...'}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        El anfitrión está introduciendo la apuesta para iniciar la cuenta atrás.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHASE D & E: ACTIVE CHALLENGE COUNTDOWN */}
            {roomState.phase === 'CHALLENGE_ACTIVE' && (
              <div className="space-y-6 py-2">
                {/* Big Countdown Timer */}
                <div className="p-6 rounded-3xl bg-black/80 border-2 border-orange-500/50 text-center space-y-2 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span>TIEMPO RESTANTE</span>
                  </div>

                  <div className={`text-6xl sm:text-7xl font-mono font-black tracking-tight ${
                    roomState.timerRemainingSeconds <= 5
                      ? 'text-rose-500 animate-ping'
                      : roomState.timerRemainingSeconds <= 10
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}>
                    {roomState.timerRemainingSeconds}s
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-200 text-xs font-bold">
                    <span>Objetivo:</span>
                    <strong className="text-yellow-400 font-mono text-sm">{roomState.targetBet} respuestas</strong>
                    <span>de</span>
                    <strong>{activePlayer?.name}</strong>
                  </div>

                  {roomState.isTimerPaused && (
                    <div className="mt-2 text-xs font-black text-yellow-300 uppercase tracking-wider animate-pulse">
                      [ CRONÓMETRO EN PAUSA ]
                    </div>
                  )}
                </div>

                {/* CRITICAL SECTION 6 CONTROLS FOR ADMINISTRATOR */}
                {isHost ? (
                  <div className="space-y-3">
                    <div className="text-center text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      Controles en directo del anfitrión:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. ¡CONSEGUIDO! */}
                      <button
                        type="button"
                        onClick={handleSuccessClick}
                        className="py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/40 transition-all cursor-pointer active:scale-95 border-2 border-emerald-300"
                      >
                        <CheckCircle2 className="w-7 h-7 shrink-0 text-slate-950" />
                        <span>¡CONSEGUIDO!</span>
                      </button>

                      {/* 2. ME RINDO */}
                      <button
                        type="button"
                        onClick={handleSurrenderClick}
                        className="py-5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-lg sm:text-xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-2xl shadow-rose-600/40 transition-all cursor-pointer active:scale-95 border-2 border-rose-400"
                      >
                        <XCircle className="w-7 h-7 shrink-0 text-white" />
                        <span>ME RINDO</span>
                      </button>
                    </div>

                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={onTogglePauseTimer}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        {roomState.isTimerPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Reanudar tiempo</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Pausar tiempo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                    <div className="text-sm font-bold text-white">
                      Escuchad las respuestas de <strong>{activePlayer?.name}</strong>
                    </div>
                    <p className="text-xs text-slate-400">
                      El anfitrión confirmará «¡CONSEGUIDO!» en cuanto alcance las {roomState.targetBet} respuestas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PHASE F & RESULT: CHALLENGE RESULT NOTICE */}
            {roomState.phase === 'CHALLENGE_RESULT' && roomState.lastResult && (
              <div className="space-y-5 py-2">
                <div className={`p-6 rounded-3xl border-2 text-center space-y-3 shadow-2xl ${
                  roomState.lastResult.success
                    ? 'bg-gradient-to-br from-emerald-950/80 to-black/80 border-emerald-400 text-white'
                    : 'bg-gradient-to-br from-rose-950/80 to-black/80 border-rose-500 text-white'
                }`}>
                  <div className="text-4xl">
                    {roomState.lastResult.success ? '🎉' : roomState.lastResult.surrendered ? '🏳️' : '⏰'}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black font-display uppercase tracking-tight">
                    {roomState.lastResult.success
                      ? '¡RETO CONSEGUIDO!'
                      : roomState.lastResult.surrendered
                      ? '¡EL DESAFIANTE SE HA RENDIDO!'
                      : '¡TIEMPO AGOTADO!'}
                  </h3>

                  <p className="text-sm max-w-md mx-auto text-slate-200">
                    {roomState.lastResult.success
                      ? `${roomState.lastResult.playerName} nombró con éxito los ${roomState.lastResult.targetBet} ejemplos requeridos.`
                      : roomState.lastResult.surrendered
                      ? `${roomState.lastResult.playerName} no pudo alcanzar la cifra prometida.`
                      : 'El cronómetro llegó a cero antes de completar el número prometido.'}
                  </p>

                  <div className="inline-block px-4 py-2 rounded-2xl bg-black/50 border border-white/10 text-sm font-black font-mono">
                    Puntos sumados: <span className={roomState.lastResult.pointsAwarded > 0 ? 'text-emerald-400 text-lg' : 'text-slate-400'}>
                      +{roomState.lastResult.pointsAwarded} pts
                    </span>
                  </div>
                </div>

                {/* Host button to advance or finish */}
                {isHost && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onNextRound}
                      className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Siguiente Reto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {roomState.config.challengesCount === 'unlimited' && (
                      <button
                        type="button"
                        onClick={onFinishGame}
                        className="py-4 px-6 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Finalizar Show
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Group Scores */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#140802]/95 border-2 border-orange-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span>Puntuaciones en directo</span>
              </div>
            </div>

            <div className="space-y-2">
              {sortedPlayers.map((p, idx) => {
                const isActive = p.id === roomState.activePlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-orange-500/20 border-orange-500 text-white ring-1 ring-orange-500'
                        : 'bg-black/40 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">{p.avatar || '🔥'}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white block truncate max-w-[120px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.challengesCompleted} retos logrados
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-black font-mono text-amber-400">
                      {p.score} pts
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scoring reminder */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-amber-300">Reglas de puntuación:</div>
              <div>• Reto conseguido (&lt; 10): <strong>+2 pts</strong></div>
              <div>• Reto conseguido (≥ 10): <strong>+3 pts</strong></div>
              <div>• Reto fallado o rendido: <strong>0 pts</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
