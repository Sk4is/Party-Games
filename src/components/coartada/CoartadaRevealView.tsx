import React, { useEffect } from 'react';
import { RotateCcw, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  FinalTruthReveal,
  CoartadaVerdictResult,
  CaseDossier,
  CoartadaRole,
} from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaRevealViewProps {
  finalTruth: FinalTruthReveal;
  verdictResult?: CoartadaVerdictResult;
  caseDossier?: CaseDossier;
  playerRole: CoartadaRole;
  onNewCase: () => void;
  onLeaveRoom: () => void;
}

export const CoartadaRevealView: React.FC<CoartadaRevealViewProps> = ({
  finalTruth,
  verdictResult,
  caseDossier,
  playerRole,
  onNewCase,
  onLeaveRoom,
}) => {
  useEffect(() => {
    audio.playPaperSlide();
    const timer = setTimeout(() => {
      audio.playStampHeavy();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const isSolved = verdictResult?.caseSolved ?? false;
  const isGuilty = finalTruth.suspectIsGuilty;
  const detectiveAccusedGuilty = verdictResult?.detectiveSubmission.accusedGuilty;

  return (
    <div className="relative z-10 w-full max-w-3xl mx-auto p-3 sm:p-6 select-none animate-in fade-in duration-300 flex flex-col gap-4 sm:gap-6">
      <div className="p-5 sm:p-8 rounded-2xl bg-[#151210] border-2 border-stone-700 shadow-2xl relative overflow-hidden w-full max-w-full">
        {/* Physical Noir Result Stamp (GREEN strictly for CASO RESUELTO, RED for CASO SIN RESOLVER) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold block mb-1">
              EXPEDIENTE CERRADO · RESOLUCIÓN OFICIAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-stone-100 break-words">
              {caseDossier?.title}
            </h2>
          </div>

          <div
            className={`px-5 py-2.5 rounded-lg border-4 font-mono font-black text-xl sm:text-2xl uppercase tracking-widest transform -rotate-2 shadow-xl animate-in zoom-in-75 duration-300 flex-shrink-0 ${
              isSolved
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/50 shadow-emerald-950/60'
                : 'border-red-600 text-red-400 bg-red-950/40 shadow-red-950/60'
            }`}
          >
            {isSolved ? 'CASO RESUELTO' : 'CASO SIN RESOLVER'}
          </div>
        </div>

        {/* Verdict comparison */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-850">
            <span className="text-stone-500 block uppercase mb-1">DICTAMEN DEL DETECTIVE:</span>
            <span
              className={`font-black text-base ${
                detectiveAccusedGuilty ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {detectiveAccusedGuilty ? 'CULPABLE' : 'INOCENTE'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-850">
            <span className="text-stone-500 block uppercase mb-1">LA VERDAD DEL CASO:</span>
            <span
              className={`font-black text-base ${
                isGuilty ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isGuilty ? 'ERA CULPABLE' : 'ERA INOCENTE'}
            </span>
          </div>
        </div>

        {/* Master Summary */}
        <div className="p-4 sm:p-5 rounded-xl bg-stone-950/70 border border-stone-800 text-stone-200 text-xs sm:text-sm font-mono leading-relaxed mb-6">
          <span className="font-bold text-amber-400 block mb-1 uppercase text-xs">
            QUÉ OCURRIÓ REALMENTE:
          </span>
          <p className="text-stone-300">{finalTruth.actualIncidentSummary}</p>
        </div>

        {/* The Suspect's Secret */}
        <div className="p-4 sm:p-5 rounded-xl bg-red-950/20 border border-red-800/60 text-stone-200 text-xs sm:text-sm font-mono leading-relaxed mb-6">
          <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-xs mb-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>EL SECRETO DEL SOSPECHOSO:</span>
          </div>
          <p className="whitespace-pre-line text-stone-300">
            {finalTruth.suspectSecretReveal}
          </p>
        </div>

        {/* Master Timeline */}
        <div className="mb-6 space-y-2.5">
          <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">
            CRONOLOGÍA MAESTRA DE LOS HECHOS:
          </span>
          <div className="space-y-2">
            {finalTruth.fullMasterTimeline.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-950/60 border border-stone-850 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400 font-bold">
                    {item.time}
                  </span>
                  <span className="font-bold text-stone-200">{item.actor}</span>
                </div>
                <div className="text-stone-300 text-left sm:text-right">
                  <span>{item.action}</span>
                  <span className="text-[10px] text-stone-500 block">{item.significance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clue Breakdown */}
        <div className="mb-8 space-y-2.5">
          <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">
            EXPLICACIÓN DE LAS PRUEBAS:
          </span>
          <div className="space-y-2">
            {finalTruth.clueExplanations.map((clue, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-950/40 border border-stone-850 text-xs font-mono flex items-start gap-2.5"
              >
                <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-stone-200 block mb-0.5">{clue.clueTitle}</span>
                  <span className="text-stone-400">{clue.explanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions: New Case (Role Swap) & Exit */}
        <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-400 font-mono text-xs font-bold border border-stone-800 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Salir de la sala
          </button>

          <button
            type="button"
            onClick={onNewCase}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-stone-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>NUEVO CASO (CAMBIAR ROLES)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
