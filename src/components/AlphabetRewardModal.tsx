import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Heart, Sparkles } from 'lucide-react';
import { Player } from '../types';

interface AlphabetRewardModalProps {
  player: Player;
  gainedLife: boolean;
  onDismiss: () => void;
}

export const AlphabetRewardModal: React.FC<AlphabetRewardModalProps> = ({
  player,
  gainedLife,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400 p-6 sm:p-7 text-center shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Floating Trophy Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
          <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1" />
        </div>

        {/* Title */}
        <span className="text-xs font-black uppercase tracking-widest text-amber-400 block mb-1">
          ¡Reto Conseguido!
        </span>
        <h2 className="text-2xl sm:text-3xl font-black font-display text-white mb-2 tracking-wide">
          ¡ABECEDARIO COMPLETADO!
        </h2>

        {/* Player details */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{player.avatar}</span>
          <span className="text-lg font-black text-slate-100">{player.name}</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
          Ha logrado utilizar las <strong className="text-amber-300">27 letras</strong> del abecedario español en palabras válidas.
        </p>

        {/* Reward card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 mb-6 flex items-center justify-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-white font-display">
              {gainedLife ? '+1 VIDA EXTRA' : 'VIDAS AL MÁXIMO'}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {gainedLife
                ? `Vidas recuperadas: ${player.lives}/3`
                : 'Ya tenías las 3 vidas al máximo'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95"
        >
          Continuar jugando
        </button>
      </motion.div>
    </div>
  );
};
