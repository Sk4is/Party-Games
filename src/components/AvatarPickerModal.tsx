import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dices, Check } from 'lucide-react';
import { AVATARS, getRandomAnimalAvatar } from '../data/players';
import { audio } from '../utils/audio';

interface AvatarPickerModalProps {
  isOpen: boolean;
  playerName: string;
  playerColorHex: string;
  selectedAvatar: string;
  usedAvatars?: string[];
  onSelectAvatar: (avatar: string) => void;
  onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  playerName,
  playerColorHex,
  selectedAvatar,
  usedAvatars = [],
  onSelectAvatar,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePick = (avatar: string) => {
    onSelectAvatar(avatar);
    audio.playSpark();
  };

  const handleRandom = () => {
    // Pick an unused random avatar, excluding current
    const unused = AVATARS.filter((a) => a !== selectedAvatar && !usedAvatars.includes(a));
    const pool = unused.length > 0 ? unused : AVATARS.filter((a) => a !== selectedAvatar);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || getRandomAnimalAvatar();
    onSelectAvatar(chosen);
    audio.playSpark();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full sm:max-w-xl max-h-[85vh] flex flex-col bg-slate-900 border-t-2 sm:border-2 border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/20 shrink-0"
                style={{ backgroundColor: playerColorHex }}
              >
                {selectedAvatar}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black font-display text-white tracking-wide">
                  ELIGE TU ANIMAL
                </h3>
                <p className="text-xs text-slate-400">
                  Avatar para <strong className="text-amber-300">{playerName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                title="Elegir un avatar aleatorio"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>🎲 Aleatorio</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar selector de avatar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Grid of Avatars */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[55vh] grid grid-cols-6 sm:grid-cols-8 gap-2.5 sm:gap-3 bg-slate-900/90">
            {AVATARS.map((avatar, index) => {
              const isSelected = avatar === selectedAvatar;
              const isUsedByOther = usedAvatars.includes(avatar) && !isSelected;

              return (
                <button
                  key={`${avatar}-${index}`}
                  type="button"
                  onClick={() => handlePick(avatar)}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/30 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 z-10'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:scale-105 active:scale-95'
                  }`}
                  title={isSelected ? 'Seleccionado actualmente' : isUsedByOther ? 'En uso por otro jugador' : 'Elegir avatar'}
                >
                  <span>{avatar}</span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  {isUsedByOther && !isSelected && (
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-slate-500/80" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with done button */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              {AVATARS.length} avatares disponibles
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-md active:scale-95 cursor-pointer ml-auto"
            >
              Aceptar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
