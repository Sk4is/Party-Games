import React from 'react';
import { audio } from '../../utils/audio';
import { Sparkles, Clock } from 'lucide-react';

interface PinturilloWordChoiceModalProps {
  isDrawer: boolean;
  drawerName: string;
  drawerAvatar: string;
  wordOptions?: Array<{ word: string; category: string; difficulty: string }>;
  remainingSeconds: number;
  onSelectWord: (word: string) => void;
}

export const PinturilloWordChoiceModal: React.FC<PinturilloWordChoiceModalProps> = ({
  isDrawer,
  drawerName,
  drawerAvatar,
  wordOptions = [],
  remainingSeconds,
  onSelectWord,
}) => {
  const [chosenWord, setChosenWord] = React.useState<string | null>(null);

  const handleWordClick = (word: string) => {
    if (chosenWord) return;
    setChosenWord(word);
    audio.playPinturilloToolSelect();
    onSelectWord(word);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-md w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border-2 border-amber-500/60 shadow-2xl text-center">
        {/* Ambient glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {isDrawer ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider mb-4 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> ¡Te toca dibujar!
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-display text-white mb-2">
              ELIGE TU PALABRA
            </h3>

            <p className="text-sm text-slate-300 mb-6">
              Selecciona una de las 3 opciones antes de que se acabe el tiempo:
            </p>

            {/* Countdown timer badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-mono font-black text-base flex items-center gap-1.5 shadow-inner">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>{remainingSeconds}s</span>
              </div>
            </div>

            {/* 3 Word Choice Cards */}
            <div className="space-y-3 mb-2">
              {wordOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleWordClick(opt.word)}
                  className="w-full group p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-amber-500 hover:to-orange-500 border-2 border-slate-700 hover:border-amber-300 text-left transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:scale-98 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-black uppercase tracking-wide text-white group-hover:text-slate-950 transition-colors">
                      {opt.word}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-300 group-hover:bg-slate-950/40 group-hover:text-slate-900">
                      {opt.difficulty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-xl animate-bounce">
              {drawerAvatar || '🎨'}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              {drawerName} está eligiendo palabra...
            </h3>

            <p className="text-sm text-slate-400 mb-6">
              ¡Prepara tu ingenio y velocidad en el teclado!
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Tiempo restante: {remainingSeconds}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
