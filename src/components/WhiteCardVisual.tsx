import React from 'react';
import { Sparkles, Check, Heart, Trophy } from 'lucide-react';

interface WhiteCardVisualProps {
  text: string;
  isRevealed: boolean;
  onFlip?: () => void;
  // Optional interaction & result states
  isSelectable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  onSelect?: () => void;
  // Optional author and votes display (for Results phase)
  authorName?: string;
  authorAvatar?: string;
  authorColor?: string;
  votesCount?: number;
  isWinner?: boolean;
  showAuthor?: boolean;
  className?: string;
}

export const WhiteCardVisual: React.FC<WhiteCardVisualProps> = ({
  text,
  isRevealed,
  onFlip,
  isSelectable = false,
  isSelected = false,
  isDisabled = false,
  disabledReason,
  onSelect,
  authorName,
  authorAvatar,
  authorColor = '#f59e0b',
  votesCount,
  isWinner = false,
  showAuthor = false,
  className = '',
}) => {
  // Determine typography size based on length of the answer
  const getTextSizeClass = (str: string) => {
    const len = str.length;
    if (len < 28) return 'text-xl sm:text-2xl font-black';
    if (len < 65) return 'text-lg sm:text-xl font-bold';
    return 'text-sm sm:text-base font-semibold';
  };

  const handleClick = () => {
    if (!isRevealed && onFlip) {
      onFlip();
      return;
    }
    if (isRevealed && isSelectable && !isDisabled && onSelect) {
      onSelect();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`perspective-1000 group relative w-full h-56 sm:h-64 cursor-pointer select-none transition-transform duration-200 ${
        isSelectable && !isDisabled ? 'hover:-translate-y-1 active:scale-95' : ''
      } ${isDisabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <div
        className={`relative w-full h-full duration-500 transform-style-3d transition-transform ease-out ${
          isRevealed ? 'rotate-y-180' : ''
        }`}
      >
        {/* ==================================================== */}
        {/* FACE DOWN (Card Back)                                */}
        {/* ==================================================== */}
        <div className="absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-stone-900 via-neutral-900 to-black border-2 border-stone-700/80 shadow-xl flex flex-col items-center justify-between backface-hidden overflow-hidden group-hover:border-amber-400/70 group-hover:shadow-amber-500/10 transition-all">
          {/* Decorative card pattern */}
          <div className="absolute inset-2 rounded-xl border border-stone-800/80 pointer-events-none flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-dashed border-stone-700/60 opacity-40 animate-spin [animation-duration:30s]" />
          </div>

          <div className="relative z-10 w-full flex justify-between text-[10px] tracking-widest text-stone-500 font-bold uppercase">
            <span>LA PEOR</span>
            <span>RESPUESTA</span>
          </div>

          {/* Central Logo / Motif */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-800/80 border border-stone-700 text-stone-300 flex items-center justify-center text-2xl sm:text-3xl font-black font-display shadow-inner group-hover:scale-110 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-all">
              ?
            </div>
            <span className="mt-3 text-xs sm:text-sm font-black font-display tracking-wider text-stone-400 group-hover:text-stone-200">
              TOCA PARA REVELAR
            </span>
          </div>

          <div className="relative z-10 w-full text-center text-[9px] text-stone-600 font-mono tracking-wider">
            RESPUESTA ANÓNIMA
          </div>
        </div>

        {/* ==================================================== */}
        {/* FACE UP (Card Front - Answer)                        */}
        {/* ==================================================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-stone-50 text-slate-900 border-2 shadow-xl flex flex-col justify-between backface-hidden rotate-y-180 overflow-hidden transition-all ${
            isWinner
              ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-amber-500/30'
              : isSelected
              ? 'border-emerald-500 ring-4 ring-emerald-500/40'
              : 'border-stone-300'
          }`}
        >
          {/* Subtle inner border */}
          <div className="absolute inset-1.5 rounded-[1.1rem] border border-stone-200/80 pointer-events-none" />

          {/* Header row: Winner or Selected badge or Disabled notice */}
          <div className="relative z-10 flex items-center justify-between min-h-[22px]">
            {isWinner && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-sm animate-bounce">
                <Trophy className="w-3.5 h-3.5" />
                ¡Ganadora!
              </span>
            )}

            {isSelected && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                <Check className="w-3.5 h-3.5" />
                Tu voto
              </span>
            )}

            {isDisabled && disabledReason && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 text-[11px] font-bold">
                {disabledReason}
              </span>
            )}

            {!isWinner && !isSelected && !isDisabled && (
              <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                Respuesta
              </span>
            )}

            {/* Votes counter in results phase */}
            {typeof votesCount === 'number' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 font-black text-xs">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                {votesCount} {votesCount === 1 ? 'voto' : 'votos'}
              </span>
            )}
          </div>

          {/* Answer Text in the Center */}
          <div className="relative z-10 flex-1 flex items-center my-2">
            <p
              className={`text-slate-900 leading-snug break-words hyphens-auto font-['Plus_Jakarta_Sans',sans-serif] ${getTextSizeClass(
                text
              )}`}
            >
              &laquo;{text}&raquo;
            </p>
          </div>

          {/* Footer: Author information (Results phase only) or Watermark */}
          <div className="relative z-10 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
            {showAuthor && authorName ? (
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{authorAvatar || '👤'}</span>
                <span
                  className="font-bold text-xs sm:text-sm uppercase tracking-wider"
                  style={{ color: authorColor }}
                >
                  {authorName}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
                LA PEOR RESPUESTA
              </span>
            )}

            {isSelectable && !isDisabled && !isSelected && (
              <span className="text-[11px] font-bold text-stone-500 group-hover:text-emerald-600 transition-colors">
                Toca para votar
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
