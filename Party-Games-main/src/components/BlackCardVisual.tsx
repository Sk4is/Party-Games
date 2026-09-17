import React from 'react';
import { BlackCard } from '../types';
import { Sparkles } from 'lucide-react';

interface BlackCardVisualProps {
  card: BlackCard;
  className?: string;
  size?: 'normal' | 'large' | 'compact';
}

export const BlackCardVisual: React.FC<BlackCardVisualProps> = ({
  card,
  className = '',
  size = 'normal',
}) => {
  // Helper to format text with underlined blanks
  const renderPromptText = (text: string) => {
    // Split by ____
    const parts = text.split('____');
    if (parts.length === 1) {
      return text;
    }

    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="inline-block border-b-4 border-amber-400/90 text-amber-300 font-black px-2 min-w-[5rem] sm:min-w-[7rem] text-center mx-1 underline-offset-8">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        )}
      </React.Fragment>
    ));
  };

  const sizeClasses = {
    compact: 'p-4 sm:p-5 max-w-lg min-h-[140px]',
    normal: 'p-6 sm:p-8 max-w-xl min-h-[190px]',
    large: 'p-7 sm:p-10 max-w-2xl min-h-[220px]',
  }[size];

  const textClasses = {
    compact: 'text-base sm:text-lg',
    normal: 'text-lg sm:text-2xl',
    large: 'text-xl sm:text-3xl',
  }[size];

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-stone-900 via-neutral-950 to-black border-2 border-stone-700/80 text-white shadow-2xl shadow-black/80 flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${sizeClasses} ${className}`}
    >
      {/* Subtle textured overlay & luxury card border */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-700/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-1 rounded-[1.25rem] border border-stone-800/60 pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest uppercase text-stone-400 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {card.category ? card.category.toUpperCase() : 'CARTA NEGRA'}
        </span>

        {card.blanks === 2 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black tracking-wider uppercase">
            2 Respuestas
          </span>
        )}
      </div>

      {/* Main Prompt Text */}
      <div className="relative z-10 flex-1 flex items-center my-2">
        <h2
          className={`font-black font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-snug text-stone-100 ${textClasses}`}
        >
          {renderPromptText(card.text)}
        </h2>
      </div>

      {/* Bottom Footer Details */}
      <div className="relative z-10 mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-stone-400 text-xs font-bold">
        <span className="tracking-widest uppercase text-[10px] text-stone-400">
          LA PEOR RESPUESTA
        </span>
        <span className="text-[10px] font-mono text-stone-400">#{card.id}</span>
      </div>
    </div>
  );
};
