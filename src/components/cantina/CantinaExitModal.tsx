import React from 'react';
import { AlertTriangle, RotateCcw, Home, X } from 'lucide-react';

interface CantinaExitModalProps {
  isOpen: boolean;
  isInMatch: boolean;
  onCancel: () => void;
  onReturnToLobby: () => void;
  onReturnToMainMenu: () => void;
}

export const CantinaExitModal: React.FC<CantinaExitModalProps> = ({
  isOpen,
  isInMatch,
  onCancel,
  onReturnToLobby,
  onReturnToMainMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-800/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
            ¿QUIERES SALIR?
          </h2>
          <p className="text-xs text-stone-400 mt-1 leading-relaxed">
            {isInMatch
              ? 'Puedes volver a la sala de espera para reiniciar la partida o marcharte al menú principal.'
              : '¿Deseas abandonar la sala de la cantina?'}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          {isInMatch && (
            <button
              onClick={onReturnToLobby}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <RotateCcw className="w-4 h-4" /> VOLVER A LA SALA
            </button>
          )}

          <button
            onClick={onReturnToMainMenu}
            className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-rose-950/80 hover:border-rose-700 text-stone-200 hover:text-rose-200 font-bold text-xs uppercase tracking-wider transition-colors border border-stone-700 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> VOLVER AL MENÚ
          </button>

          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl text-stone-400 hover:text-white font-semibold text-xs tracking-wider uppercase transition-colors"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};
