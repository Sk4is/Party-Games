import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, LogOut, ArrowRight } from 'lucide-react';

interface AbandonConfirmationModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
}

export const AbandonConfirmationModal: React.FC<AbandonConfirmationModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  title = '¿Abandonar la partida?',
  message = 'Si sales ahora, saldrás de la sala y perderás tu progreso actual en la partida.',
  cancelText = 'Cancelar',
  confirmText = 'Abandonar',
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-4 xs:p-6 shadow-2xl text-stone-100 min-w-0"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 min-w-0">
              <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5 xs:w-6 xs:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base xs:text-xl font-bold font-serif tracking-tight text-white uppercase truncate">
                  {title}
                </h3>
                <p className="text-[11px] xs:text-xs text-stone-400">Confirmación de salida</p>
              </div>
            </div>

            <p className="text-xs xs:text-sm text-stone-300 leading-relaxed mb-5 sm:mb-6">
              {message}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs xs:text-sm transition-colors border border-stone-700 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs xs:text-sm transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{confirmText}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
