import React from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { NotebookPanel } from './NotebookPanel';
import { BlackboardView } from './BlackboardView';
import { MolePortrait } from './MolePortrait';
import { Clock, CheckCircle2, Pencil } from 'lucide-react';

interface EntreToposWritingViewProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onSubmitClue: (clue: string) => void;
}

export const EntreToposWritingView: React.FC<EntreToposWritingViewProps> = ({
  roomState,
  localPlayerId,
  onSubmitClue,
}) => {
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const myRole = roomState.myRole || localPlayer?.role;
  const isSubmitted = localPlayer?.hasSubmittedClue ?? false;
  const secondsLeft = roomState.timerSecondsRemaining ?? 45;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 select-none animate-fade-in">
      {/* TOP HEADER: TIMER + ROUND PROGRESS */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#1e1b18]/90 border-2 border-[#3d3229] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">✍️</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide font-display">
              FASE DE ESCRITURA &bull; RONDA {roomState.currentRound} DE {roomState.config.totalRounds}
            </h2>
            <p className="text-[11px] text-amber-400/80 font-medium">
              Escribe una palabra o expresión corta (máx. 20 caracteres)
            </p>
          </div>
        </div>

        {/* AUTHORITATIVE TIMER */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 font-mono font-black text-lg sm:text-xl ${
            secondsLeft <= 10
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-amber-500/10 border-amber-400/50 text-amber-300'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{secondsLeft}s</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: THE 16-WORD NOTEBOOK (THE CENTRAL CANVAS) */}
        <div className="lg:col-span-7">
          {roomState.board ? (
            <NotebookPanel board={roomState.board} role={myRole} />
          ) : (
            <div className="p-8 text-center text-slate-400">Cargando cuaderno...</div>
          )}
        </div>

        {/* RIGHT COLUMN: MOLE HOLDING PERSONAL BLACKBOARD */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full p-5 rounded-3xl bg-[#1e1b18]/80 border-2 border-[#3d3229] shadow-xl flex flex-col items-center">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-3">
              TU PIZARRA PERSONAL
            </span>

            {/* Mole portrait holding the board */}
            <div className="w-28 h-28 relative -mb-3 z-10">
              <MolePortrait
                customization={localPlayer?.moleCustomization}
                size="md"
                expression={myRole === 'TOPO' ? 'guilty' : 'normal'}
              />
            </div>

            {/* Blackboard */}
            <BlackboardView
              clue={localPlayer?.clue}
              isEditable={true}
              onSubmitClue={onSubmitClue}
              isSubmitted={isSubmitted}
              playerName={localPlayer?.name}
              className="z-20 w-full"
            />
          </div>

          {/* SUBMISSION STATUS CHIPS FOR ALL PLAYERS */}
          <div className="w-full mt-4 p-4 rounded-2xl bg-[#1e1b18]/70 border border-[#3d3229]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
              ESTADO DE LOS SOSPECHOSOS
            </span>
            <div className="flex flex-wrap gap-2">
              {roomState.players.map((p) => (
                <div
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${
                    p.hasSubmittedClue
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/30 border-white/10 text-slate-400'
                  }`}
                >
                  {p.hasSubmittedClue ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  )}
                  <span className="truncate max-w-[100px]">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
