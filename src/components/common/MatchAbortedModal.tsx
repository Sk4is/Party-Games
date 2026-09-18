import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, LogOut } from 'lucide-react';

interface MatchAbortedModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onReturnToMenu: () => void;
  autoReturnSeconds?: number;
}

export const MatchAbortedModal: React.FC<MatchAbortedModalProps> = ({
  isOpen,
  title = 'PARTIDA FINALIZADA',
  message = 'La partida no puede continuar por falta de jugadores suficientes.',
  onReturnToMenu,
  autoReturnSeconds = 5,
}) => {
  const [countdown, setCountdown] = useState(autoReturnSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoReturnSeconds);
      return;
    }

    setCountdown(autoReturnSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReturnToMenu();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoReturnSeconds, onReturnToMenu]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="match-aborted-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-aborted-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col items-center text-center"
        >
          {/* Status Badge Icon */}
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-inner">
            <AlertCircle className="w-7 h-7" />
          </div>

          {/* Heading */}
          <h2
            id="match-aborted-title"
            className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mb-2 uppercase"
          >
            {title}
          </h2>

          {/* Detailed Spanish Reason */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-sm mb-6 font-normal">
            {message}
          </p>

          {/* Auto-return timer note */}
          <p className="text-xs text-slate-400 mb-5 font-mono">
            Volviendo al menú en <span className="text-amber-400 font-bold">{countdown}s</span>...
          </p>

          {/* Return button */}
          <button
            id="match-aborted-return-btn"
            type="button"
            onClick={onReturnToMenu}
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>VOLVER AL MENÚ</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
