import React from 'react';
import { AlertTriangle, ArrowLeft, Play } from 'lucide-react';
import { audio } from '../utils/audio';

interface AbandonConfirmationModalProps {
  isOpen: boolean;
  onConfirmAbandon: () => void;
  onCancel: () => void;
}

export const AbandonConfirmationModal: React.FC<AbandonConfirmationModalProps> = ({
  isOpen,
  onConfirmAbandon,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-2xl font-black font-display text-white mb-2 tracking-wide">
          ¿ABANDONAR PARTIDA?
        </h3>
        <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
          Se perderá todo el progreso y los puntos de esta partida actual.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              audio.playSpark();
              onCancel();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4" />
            <span>Seguir jugando</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.playLifeLost();
              onConfirmAbandon();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Abandonar partida</span>
          </button>
        </div>
      </div>
    </div>
  );
};
