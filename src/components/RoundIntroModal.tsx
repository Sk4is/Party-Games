import React, { useState, useEffect, useRef } from 'react';
import { LetterSequence } from '../types';
import { audio } from '../utils/audio';
import { Flame, Play } from 'lucide-react';

interface RoundIntroModalProps {
  sequence: LetterSequence;
  roundNumber: number;
  startingPlayerName?: string;
  onFinish: () => void;
}

export const RoundIntroModal: React.FC<RoundIntroModalProps> = ({
  sequence,
  roundNumber,
  startingPlayerName,
  onFinish,
}) => {
  const [countdown, setCountdown] = useState<number | string>(3);
  const finishedRef = useRef(false);

  const handleComplete = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    // 3, 2, 1, ¡YA! countdown sequence
    audio.playCountdownBeep(false);

    const timer1 = setTimeout(() => {
      if (!finishedRef.current) {
        setCountdown(2);
        audio.playCountdownBeep(false);
      }
    }, 750);

    const timer2 = setTimeout(() => {
      if (!finishedRef.current) {
        setCountdown(1);
        audio.playCountdownBeep(false);
      }
    }, 1500);

    const timer3 = setTimeout(() => {
      if (!finishedRef.current) {
        setCountdown('¡YA!');
        audio.playCountdownBeep(true);
      }
    }, 2250);

    const timer4 = setTimeout(() => {
      handleComplete();
    }, 2850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg text-center flex flex-col items-center">
        {/* Round Badge */}
        <div className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold text-xs sm:text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>Ronda #{roundNumber}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-display tracking-wider text-white mb-1">
          {startingPlayerName ? `¡Empieza ${startingPlayerName}!` : '¡Comienza la ronda!'}
        </h2>

        {/* Sequence Highlight Card */}
        <div className="w-full p-5 sm:p-7 rounded-3xl bg-slate-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 my-3">
          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider mb-2">
            Secuencia inicial:
          </p>

          <div className="inline-block px-7 py-2.5 rounded-2xl bg-amber-400 text-slate-950 font-black font-display text-5xl sm:text-6xl tracking-widest shadow-2xl shadow-amber-500/40">
            {sequence.sequence}
          </div>

          <p className="text-slate-300 text-xs sm:text-sm font-semibold max-w-sm mx-auto mt-3">
            Las letras deben aparecer <strong className="text-amber-300">juntas</strong> y en el <strong className="text-amber-300">mismo orden</strong>.
          </p>

          <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] sm:text-xs text-amber-300 font-bold">
            ⚡ ¡Cada acierto generará una NUEVA combinación para el siguiente jugador!
          </div>

          {sequence.examples && sequence.examples.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Ejemplos:
              </span>
              {sequence.examples.slice(0, 3).map((ex, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 text-xs font-bold border border-slate-700"
                >
                  {ex}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Big Countdown Number & Skip Button */}
        <div className="mt-2 flex flex-col items-center gap-3">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-display font-black text-2xl sm:text-4xl shadow-2xl border-4 transition-all duration-200 ${
              countdown === '¡YA!'
                ? 'bg-rose-600 border-rose-300 text-white scale-110 animate-ping'
                : 'bg-amber-500 border-amber-300 text-slate-950 scale-100'
            }`}
          >
            {countdown}
          </div>

          <button
            type="button"
            onClick={handleComplete}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Saltar cuenta atrás</span>
          </button>
        </div>
      </div>
    </div>
  );
};
