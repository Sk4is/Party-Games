import React from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { MolePortrait } from './MolePortrait';
import { BlackboardView } from './BlackboardView';
import { AlertTriangle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface EntreToposVoteRevealViewProps {
  roomState: EntreToposRoomState;
}

export const EntreToposVoteRevealView: React.FC<EntreToposVoteRevealViewProps> = ({
  roomState,
}) => {
  const accusedPlayer = roomState.players.find((p) => p.id === roomState.accusedPlayerId);
  const isMoleCaught = roomState.isMoleCaught ?? false;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 select-none animate-fade-in text-center items-center">
      {/* =========================================================================
          SUSPENSE VERDICT BANNER
          ========================================================================= */}
      <div
        className={`w-full p-6 sm:p-8 rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center animate-bounce-short ${
          isMoleCaught
            ? 'bg-rose-950/80 border-rose-500 text-rose-100'
            : 'bg-amber-950/80 border-amber-500 text-amber-100'
        }`}
      >
        <span className="text-4xl sm:text-5xl mb-2">
          {isMoleCaught ? '🚨' : '🕵️‍♂️'}
        </span>

        <h2 className="text-2xl sm:text-4xl font-black font-display tracking-wide uppercase mb-1">
          {isMoleCaught ? '¡HAN ATRAPADO AL TOPO!' : '¡EL TOPO HA ESCAPADO!'}
        </h2>

        <p className="text-sm sm:text-lg font-bold max-w-xl text-slate-200">
          {isMoleCaught
            ? `¡La mayoría ha votado a ${accusedPlayer?.name || 'este sospechoso'} y efectivamente era el Topo! Pero aún tiene una oportunidad para robar la victoria...`
            : `El sospechoso más votado (${accusedPlayer?.name || 'el acusado'}) era inocente. ¡El verdadero Topo ha burlado a todos!`}
        </p>
      </div>

      {/* ACCUSED SUSPECT SPOTLIGHT */}
      {accusedPlayer && (
        <div className="relative p-6 rounded-3xl bg-[#1e1b18] border-4 border-[#3d3229] shadow-2xl flex flex-col items-center max-w-md w-full">
          <div className="w-36 h-36 relative -mb-2">
            <MolePortrait
              customization={accusedPlayer.moleCustomization}
              size="lg"
              isAccused={true}
              isTopoReveal={isMoleCaught}
              expression={isMoleCaught ? 'guilty' : 'surprised'}
            />
          </div>

          <h3 className="text-xl font-black text-white uppercase tracking-wide mt-2">
            {accusedPlayer.name}
          </h3>

          <span className="text-xs font-mono font-bold text-amber-400 uppercase mt-0.5">
            Recibió {accusedPlayer.votesReceived} votos
          </span>

          <div className="w-full mt-3">
            <BlackboardView
              clue={accusedPlayer.clue}
              isEditable={false}
              isCompact={true}
              playerName="Su pista fue"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* VOTE TALLY SUMMARY FOR ALL PLAYERS */}
      <div className="w-full p-5 rounded-3xl bg-[#1e1b18]/80 border-2 border-[#3d3229]">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 font-mono">
          DESGLOSE DE VOTOS EMITIDOS
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {roomState.players.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between"
            >
              <span className="text-xs font-bold text-white uppercase truncate max-w-[100px]">
                {p.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-black text-xs">
                {p.votesReceived} {p.votesReceived === 1 ? 'voto' : 'votos'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
