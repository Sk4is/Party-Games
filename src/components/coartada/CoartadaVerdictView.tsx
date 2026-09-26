import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, FileCheck, AlertCircle } from 'lucide-react';
import {
  CoartadaRole,
  DetectiveVerdictSubmission,
  CaseDossier,
} from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaVerdictViewProps {
  role: CoartadaRole;
  caseDossier?: CaseDossier;
  onSubmitVerdict: (submission: DetectiveVerdictSubmission) => void;
}

export const CoartadaVerdictView: React.FC<CoartadaVerdictViewProps> = ({
  role,
  caseDossier,
  onSubmitVerdict,
}) => {
  const isDetective = role === 'DETECTIVE';
  const [accusedGuilty, setAccusedGuilty] = useState<boolean | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSelectGuilt = (guilty: boolean) => {
    audio.playClick();
    setAccusedGuilty(guilty);
    setErrorNotice(null);
  };

  const handleSubmit = () => {
    if (accusedGuilty === null) {
      setErrorNotice('Debes emitir un dictamen oficial: Culpable o Inocente');
      audio.playError();
      return;
    }

    onSubmitVerdict({
      accusedGuilty,
    });
  };

  // Suspect Waiting View
  if (!isDetective) {
    return (
      <div className="relative z-10 w-full max-w-lg mx-auto p-4 sm:p-6 text-center select-none animate-in fade-in duration-300">
        <div className="p-6 sm:p-8 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-3xl animate-pulse">
            ⚖️
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-serif text-stone-100">
            EL DETECTIVE ESTÁ EMITIENDO SU VEREDICTO...
          </h2>

          <p className="text-xs font-mono text-stone-400 leading-relaxed max-w-sm">
            El tiempo de interrogatorio ha finalizado. El detective está contrastando tus declaraciones con el expediente para determinar si eres culpable o inocente.
          </p>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-500 animate-pulse mt-2">
            <span>Esperando la resolución oficial del caso...</span>
          </div>
        </div>
      </div>
    );
  }

  // Detective Decision Workspace (Mobile responsive: stacks vertically on mobile, keeps desktop layout intact!)
  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto p-3 sm:p-6 select-none animate-in fade-in duration-300 flex flex-col gap-4 sm:gap-6">
      <div className="p-5 sm:p-8 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl overflow-hidden w-full max-w-full">
        <span className="text-xs font-mono uppercase tracking-widest text-red-500 font-bold block mb-1">
          FASE FINAL · DICTAMEN OFICIAL
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-serif text-stone-100 tracking-tight mb-2 break-words">
          ACTA DE CONCLUSIÓN DEL CASO
        </h2>
        <p className="text-xs font-mono text-stone-400 leading-relaxed break-words">
          {caseDossier?.title}
        </p>

        {/* GUILT DETERMINATION: Two clear options */}
        <div className="mt-6 pt-5 border-t border-stone-800">
          <span className="text-xs font-mono font-bold text-stone-300 uppercase block mb-4">
            ¿CUÁL ES TU VEREDICTO SOBRE EL SOSPECHOSO?
          </span>

          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 w-full">
            {/* INOCENTE BUTTON */}
            <button
              type="button"
              onClick={() => handleSelectGuilt(false)}
              className={`w-full min-w-0 p-4 sm:p-5 rounded-xl font-mono text-xs font-bold border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                accusedGuilty === false
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/50'
                  : 'bg-stone-950/60 hover:bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <span className="text-base sm:text-lg font-black tracking-wide">INOCENTE</span>
              <span className="text-[11px] text-stone-400 text-center leading-relaxed">
                Pudo mentir u ocultar un secreto privado, pero no cometió el crimen investigado
              </span>
            </button>

            {/* CULPABLE BUTTON */}
            <button
              type="button"
              onClick={() => handleSelectGuilt(true)}
              className={`w-full min-w-0 p-4 sm:p-5 rounded-xl font-mono text-xs font-bold border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                accusedGuilty === true
                  ? 'bg-red-950/90 border-red-500 text-red-200 shadow-lg shadow-red-950/60 ring-2 ring-red-500/50'
                  : 'bg-stone-950/60 hover:bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <ShieldAlert className="w-8 h-8 text-red-500" />
              <span className="text-base sm:text-lg font-black tracking-wide">CULPABLE</span>
              <span className="text-[11px] text-stone-400 text-center leading-relaxed">
                Es el autor material de los hechos investigados y su coartada es falsa
              </span>
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Submit Verdict Button */}
        <div className="mt-6 pt-5 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-stone-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>FIRMAR Y CONFIRMAR DICTAMEN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
