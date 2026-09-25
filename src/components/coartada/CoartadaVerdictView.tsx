import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, HelpCircle, FileText, Send } from 'lucide-react';
import {
  CoartadaRole,
  ReconstructionQuestion,
  DetectiveVerdictSubmission,
  CaseDossier,
} from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaVerdictViewProps {
  role: CoartadaRole;
  caseDossier?: CaseDossier;
  reconstructionQuestions?: ReconstructionQuestion[];
  onSubmitVerdict: (submission: DetectiveVerdictSubmission) => void;
}

export const CoartadaVerdictView: React.FC<CoartadaVerdictViewProps> = ({
  role,
  caseDossier,
  reconstructionQuestions = [],
  onSubmitVerdict,
}) => {
  const isDetective = role === 'DETECTIVE';

  // Detective State
  const [accusedGuilty, setAccusedGuilty] = useState<boolean | null>(null);
  const [reconstructionAnswers, setReconstructionAnswers] = useState<Record<number, number>>({});
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSelectGuilt = (guilty: boolean) => {
    audio.playClick();
    setAccusedGuilty(guilty);
    setErrorNotice(null);
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    audio.playClick();
    setReconstructionAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
    setErrorNotice(null);
  };

  const handleSubmit = () => {
    if (accusedGuilty === null) {
      setErrorNotice('Debes emitir un dictamen: Culpable o Inocente');
      audio.playError();
      return;
    }

    if (
      reconstructionQuestions.length > 0 &&
      Object.keys(reconstructionAnswers).length < reconstructionQuestions.length
    ) {
      setErrorNotice('Responde a todas las preguntas de reconstrucción para fundamentar tu acta');
      audio.playError();
      return;
    }

    const answersArray = reconstructionQuestions.map(
      (_, idx) => reconstructionAnswers[idx] ?? 0
    );

    onSubmitVerdict({
      accusedGuilty,
      reconstructionAnswers: answersArray,
    });
  };

  // Suspect Waiting View
  if (!isDetective) {
    return (
      <div className="relative z-10 w-full max-w-lg mx-auto p-6 text-center select-none animate-in fade-in duration-300">
        <div className="p-8 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-3xl animate-pulse">
            ⚖️
          </div>

          <h2 className="text-2xl font-black font-serif text-stone-100">
            EL DETECTIVE ESTÁ REDACTANDO SU CONCLUSIÓN...
          </h2>

          <p className="text-xs font-mono text-stone-400 leading-relaxed max-w-sm">
            El tiempo de interrogatorio ha finalizado. El detective está contrastando las pruebas y redactando su acta final sobre tu inocencia o culpabilidad.
          </p>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-500 animate-pulse mt-2">
            <span>Esperando la sentencia oficial...</span>
          </div>
        </div>
      </div>
    );
  }

  // Detective Decision Workspace
  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto p-4 sm:p-6 select-none animate-in fade-in duration-300 flex flex-col gap-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl">
        <span className="text-xs font-mono uppercase tracking-widest text-red-500 font-bold block mb-1">
          FASE FINAL · DICTAMEN OFICIAL
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-serif text-stone-100 tracking-tight mb-2">
          ACTA DE CONCLUSIÓN DEL CASO
        </h2>
        <p className="text-xs font-mono text-stone-400 leading-relaxed">
          {caseDossier?.title}
        </p>

        {/* 1. GUILT DETERMINATION */}
        <div className="mt-6 pt-5 border-t border-stone-800">
          <span className="text-xs font-mono font-bold text-stone-300 uppercase block mb-3">
            1. ¿ES EL SOSPECHOSO CULPABLE O INOCENTE DEL INCIDENTE?
          </span>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSelectGuilt(false)}
              className={`p-4 rounded-xl font-mono text-xs font-bold border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                accusedGuilty === false
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/50'
                  : 'bg-stone-950/60 hover:bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span className="text-sm font-black">INOCENTE</span>
              <span className="text-[10px] text-stone-500 text-center">
                Mintió u ocultó algo ajeno, pero no cometió el crimen
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectGuilt(true)}
              className={`p-4 rounded-xl font-mono text-xs font-bold border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                accusedGuilty === true
                  ? 'bg-red-950/80 border-red-500 text-red-200 shadow-lg shadow-red-950/50'
                  : 'bg-stone-950/60 hover:bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <span className="text-sm font-black">CULPABLE</span>
              <span className="text-[10px] text-stone-500 text-center">
                Es el autor material de los hechos investigados
              </span>
            </button>
          </div>
        </div>

        {/* 2. RECONSTRUCTION QUESTIONS */}
        {reconstructionQuestions.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-800 space-y-5">
            <span className="text-xs font-mono font-bold text-stone-300 uppercase block">
              2. RECONSTRUCCIÓN DE LOS HECHOS:
            </span>

            {reconstructionQuestions.map((q, qIdx) => (
              <div key={q.id} className="p-4 rounded-xl bg-stone-950/70 border border-stone-850">
                <span className="text-xs font-mono font-bold text-amber-300 block mb-3">
                  {qIdx + 1}. {q.prompt}
                </span>

                <div className="space-y-2">
                  {q.options.map((option, optIdx) => {
                    const isSelected = reconstructionAnswers[qIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                        className={`w-full p-2.5 rounded-lg text-left text-xs font-mono transition-all flex items-start gap-2.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600 text-stone-950 font-bold border-amber-400 shadow-sm'
                            : 'bg-stone-900/90 hover:bg-stone-850 text-stone-300 border-stone-800'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] mt-0.5">
                          {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="leading-snug">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error notification */}
        {errorNotice && (
          <div className="mt-4 p-3 bg-red-950/70 border border-red-700/60 rounded-xl text-xs font-mono text-red-300 text-center animate-shake">
            {errorNotice}
          </div>
        )}

        {/* Submit Verdict Button */}
        <div className="mt-6 pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-4 rounded-xl bg-red-700 hover:bg-red-600 active:scale-98 text-stone-100 font-mono text-sm font-black uppercase tracking-wider shadow-xl shadow-red-950/50 cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>FIRMAR Y REVELAR LA VERDAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
