import React from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { MolePortrait } from './MolePortrait';
import { Trophy, Crown, RotateCcw, Home, Sparkles } from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposFinalResultsViewProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const EntreToposFinalResultsView: React.FC<EntreToposFinalResultsViewProps> = ({
  roomState,
  localPlayerId,
  onPlayAgain,
  onBackToMenu,
}) => {
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;

  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 select-none animate-fade-in text-center items-center">
      {/* FINAL PODIUM BANNER */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-amber-500/20 to-[#1e1b18] border-4 border-amber-500/60 shadow-2xl flex flex-col items-center">
        <span className="text-4xl sm:text-5xl mb-1 animate-bounce">🏆</span>
        <h2 className="text-2xl sm:text-4xl font-black font-display text-white uppercase tracking-wide">
          PODIO FINAL &bull; ENTRE TOPOS
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-amber-300/90 mt-1">
          ¡Fin de la partida! Estos son los mejores detectives y topos de la sesión.
        </p>

        {/* =========================================================================
            3D-STYLE PODIUM BLOCKS
            ========================================================================= */}
        <div className="w-full max-w-lg mt-8 flex items-end justify-center gap-3 sm:gap-5 px-2">
          {/* 2ND PLACE */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 relative mb-2">
                <MolePortrait customization={second.moleCustomization} size="md" />
              </div>
              <span className="text-xs font-black text-white uppercase truncate max-w-[90px]">
                {second.name}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-300">
                {second.score} pts
              </span>
              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-slate-400/20 border-2 border-slate-400/40 flex items-center justify-center font-mono font-black text-2xl text-slate-300 mt-2 shadow-inner">
                2º
              </div>
            </div>
          )}

          {/* 1ST PLACE (WINNER) */}
          {winner && (
            <div className="flex-1 flex flex-col items-center -mt-6">
              <div className="text-amber-400 mb-1">
                <Crown className="w-8 h-8 fill-current animate-bounce" />
              </div>
              <div className="w-36 h-36 flex items-center justify-center mb-2">
                <MolePortrait customization={winner.moleCustomization} size="lg" />
              </div>
              <span className="text-sm font-black text-amber-300 uppercase truncate max-w-[110px]">
                {winner.name}
              </span>
              <span className="text-xs font-mono font-black text-white">
                {winner.score} pts
              </span>
              <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center font-mono font-black text-3xl text-amber-300 mt-2 shadow-lg">
                1º
              </div>
            </div>
          )}

          {/* 3RD PLACE */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 relative mb-2">
                <MolePortrait customization={third.moleCustomization} size="sm" />
              </div>
              <span className="text-xs font-black text-white uppercase truncate max-w-[90px]">
                {third.name}
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-600">
                {third.score} pts
              </span>
              <div className="w-full h-18 sm:h-20 rounded-t-2xl bg-amber-700/20 border-2 border-amber-700/40 flex items-center justify-center font-mono font-black text-xl text-amber-600 mt-2 shadow-inner">
                3º
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL STANDINGS TABLE */}
      <div className="w-full p-5 rounded-3xl bg-[#1e1b18]/90 border-2 border-[#3d3229] shadow-xl text-left">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 font-mono">
          CLASIFICACIÓN COMPLETA
        </h3>
        <div className="flex flex-col gap-2">
          {sortedPlayers.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-black text-sm text-amber-400">
                  {idx + 1}º
                </span>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                  <MolePortrait customization={p.moleCustomization} size="xs" />
                </div>
                <span className="font-black text-sm text-white uppercase truncate max-w-[150px]">
                  {p.name}
                </span>
              </div>
              <span className="font-mono font-black text-base text-amber-300">
                {p.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-3 justify-center w-full max-w-md">
        <button
          type="button"
          onClick={onBackToMenu}
          className="flex-1 py-3 px-4 rounded-2xl bg-[#2b241e] hover:bg-[#3d3229] border border-white/10 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Menú principal</span>
        </button>

        {isHost && (
          <button
            type="button"
            onClick={() => {
              audio.playTurnChange();
              onPlayAgain();
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer font-display"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Volver a la sala</span>
          </button>
        )}
      </div>
    </div>
  );
};
