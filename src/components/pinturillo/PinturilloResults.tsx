import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PinturilloPlayer, PinturilloRoomState } from '../../types/pinturillo';
import { audio } from '../../utils/audio';
import { Trophy, Medal, Sparkles, RotateCcw, Home } from 'lucide-react';

interface PinturilloResultsProps {
  phase: 'ROUND_RESULTS' | 'FINAL_RESULTS';
  lastRoundResults?: PinturilloRoomState['lastRoundResults'];
  players: PinturilloPlayer[];
  isHost: boolean;
  onRestartGame?: () => void;
  onLeaveGame: () => void;
}

export const PinturilloResults: React.FC<PinturilloResultsProps> = ({
  phase,
  lastRoundResults,
  players,
  isHost,
  onRestartGame,
  onLeaveGame,
}) => {
  // Fire confetti on round victory or final podium
  useEffect(() => {
    audio.playRoundWinner();
    try {
      confetti({
        particleCount: phase === 'FINAL_RESULTS' ? 120 : 50,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }
  }, [phase]);

  // Sorted players by total score
  const sortedByScore = [...players].sort((a, b) => b.score - a.score);

  if (phase === 'ROUND_RESULTS') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
        <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-[#00BCEB]/50 shadow-2xl text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00BCEB]/20 text-[#00BCEB] text-xs font-black uppercase tracking-wider mb-3 border border-[#00BCEB]/30">
            <Sparkles className="w-3.5 h-3.5" /> Fin de la ronda
          </div>

          <p className="text-xs uppercase font-bold text-slate-400 mb-1">La palabra secreta era:</p>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-widest text-[#00BCEB] uppercase mb-6 drop-shadow-md">
            {lastRoundResults?.word || '???'}
          </h2>

          {/* Scores earned this round */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Puntos obtenidos en esta ronda:
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lastRoundResults?.scoresEarned.map(item => (
                <div
                  key={item.playerId}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.playerAvatar}</span>
                    <span className="font-bold text-slate-200">{item.playerName}</span>
                    {item.isDrawer && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00BCEB]/20 text-cyan-300 font-bold">
                        Dibujante
                      </span>
                    )}
                    {item.order && item.order <= 3 && (
                      <span className="text-xs">
                        {item.order === 1 ? '🥇' : item.order === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                  <span className={`font-mono font-black ${item.points > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    +{item.points.toLocaleString('es-ES')} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00BCEB] animate-ping" />
            <span>Siguiente ronda en breves instantes...</span>
          </div>
        </div>
      </div>
    );
  }

  // FINAL_RESULTS (Podium + Standings)
  const first = sortedByScore[0];
  const second = sortedByScore[1];
  const third = sortedByScore[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative max-w-xl w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border-2 border-[#00BCEB]/60 shadow-2xl text-center my-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00BCEB]/20 text-[#00BCEB] text-xs font-black uppercase tracking-wider mb-4 border border-[#00BCEB]/30">
          <Trophy className="w-4 h-4" /> ¡Partida completada!
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-display text-white mb-6">
          PODIO DE GANADORES
        </h2>

        {/* 3-Player Visual Podium */}
        <div className="grid grid-cols-3 gap-2 items-end mb-8 pt-6">
          {/* 2nd Place */}
          {second ? (
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{second.avatar}</span>
              <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[80px]">
                {second.name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 mb-2">
                {second.score} pts
              </span>
              <div className="w-full h-24 bg-gradient-to-t from-slate-800 to-slate-700 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-slate-300 shadow-lg">
                <span className="text-2xl font-black text-slate-200">2º</span>
                <span className="text-xs text-slate-300 font-bold">Plata</span>
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* 1st Place */}
          {first && (
            <div className="flex flex-col items-center">
              <div className="relative">
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                <span className="text-4xl sm:text-5xl mb-1">{first.avatar}</span>
              </div>
              <span className="font-black text-sm sm:text-base text-amber-300 truncate max-w-[100px]">
                {first.name}
              </span>
              <span className="text-xs font-mono font-black text-amber-400 mb-2">
                {first.score.toLocaleString('es-ES')} pts
              </span>
              <div className="w-full h-32 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-yellow-200 shadow-xl">
                <span className="text-3xl font-black text-slate-950">1º</span>
                <span className="text-xs text-slate-950 font-black">Campeón</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third ? (
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{third.avatar}</span>
              <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[80px]">
                {third.name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400 mb-2">
                {third.score} pts
              </span>
              <div className="w-full h-18 bg-gradient-to-t from-amber-900/60 to-amber-800/60 rounded-t-2xl flex flex-col items-center justify-center border-t-4 border-amber-600 shadow-md">
                <span className="text-xl font-black text-amber-200">3º</span>
                <span className="text-xs text-amber-300 font-bold">Bronce</span>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Full Standings List */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 text-left max-h-40 overflow-y-auto">
          <div className="space-y-1.5">
            {sortedByScore.map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 text-xs w-4">#{idx + 1}</span>
                  <span>{player.avatar}</span>
                  <span className="font-bold text-slate-200">{player.name}</span>
                </div>
                <span className="font-mono font-black text-[#00BCEB]">
                  {player.score.toLocaleString('es-ES')} pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {isHost && onRestartGame && (
            <button
              type="button"
              onClick={onRestartGame}
              className="px-6 py-3 rounded-2xl bg-[#00BCEB] hover:bg-[#009ED0] text-slate-950 font-black text-sm shadow-xl shadow-[#00BCEB]/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar otra vez</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveGame}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Menú principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
