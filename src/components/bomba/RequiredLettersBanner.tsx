import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RequiredLettersBannerProps {
  sequence: string;
}

export const RequiredLettersBanner: React.FC<RequiredLettersBannerProps> = ({ sequence }) => {
  const letters = (sequence || '').toUpperCase().split('').filter(Boolean);

  return (
    <div
      id="required-letters-container"
      className="w-full flex flex-col items-center justify-center py-1 sm:py-1.5 md:py-2 lg:py-2.5 select-none pointer-events-none"
    >
      {/* Eyebrow label */}
      <span className="text-[10px] sm:text-xs md:text-xs lg:text-sm xl:text-[15px] font-black tracking-[0.25em] md:tracking-[0.28em] text-amber-400/90 uppercase font-display mb-1 md:mb-2 xl:mb-2.5 drop-shadow-sm">
        Palabras con
      </span>

      {/* Animated Letters Container with smooth pop/scale on change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sequence || 'empty'}
          initial={{ opacity: 0, scale: 0.82, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.82, y: 8 }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
          className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 lg:gap-3.5 xl:gap-4"
        >
          {letters.length > 0 ? (
            letters.map((char, index) => (
              <motion.div
                key={`${sequence}-${char}-${index}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="relative flex items-center justify-center min-w-[48px] sm:min-w-[56px] md:min-w-[68px] lg:min-w-[78px] xl:min-w-[88px] 2xl:min-w-[96px] h-[52px] sm:h-[60px] md:h-[72px] lg:h-[82px] xl:h-[92px] 2xl:h-[100px] px-2 sm:px-3 md:px-3.5 lg:px-4 xl:px-5 rounded-2xl xl:rounded-3xl bg-gradient-to-b from-amber-500/20 via-slate-900/95 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.35)] md:shadow-[0_0_32px_rgba(245,158,11,0.4)]"
              >
                {/* Top specular shine */}
                <div className="absolute top-1 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent pointer-events-none" />

                {/* Big prominent letter */}
                <span className="font-mono font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] 2xl:text-6xl text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.85)] tracking-tight">
                  {char}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-slate-600 font-mono text-2xl tracking-widest font-black">---</div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
