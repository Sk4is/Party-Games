import React from 'react';
import { BoardData, EntreToposRole } from '../../types/entreTopos';
import { AlertTriangle, Eye, ShieldCheck, Sparkles } from 'lucide-react';

interface NotebookPanelProps {
  board: BoardData;
  role?: EntreToposRole;
  interactiveSelectWord?: boolean;
  onSelectWord?: (word: string) => void;
  selectedGuessWord?: string;
  isCompact?: boolean;
  revealedSecretWord?: string; // Revealed at the end of the round for all
}

// Pre-calculated slight rotation angles for hand-drawn paper chips feel
const ROTATIONS = [
  '-0.8deg', '0.6deg', '-1.1deg', '0.9deg',
  '1.2deg', '-0.7deg', '0.5deg', '-1.3deg',
  '-0.6deg', '1.1deg', '-0.9deg', '0.7deg',
  '0.8deg', '-1.2deg', '1.0deg', '-0.5deg',
];

export const NotebookPanel: React.FC<NotebookPanelProps> = ({
  board,
  role,
  interactiveSelectWord = false,
  onSelectWord,
  selectedGuessWord,
  isCompact = false,
  revealedSecretWord,
}) => {
  const isTopo = role === 'TOPO';
  const effectiveSecret = revealedSecretWord || board.secretWord;

  return (
    <div className={`relative w-full mx-auto select-none ${isCompact ? 'max-w-md' : 'max-w-2xl'}`}>
      {/* =========================================================================
          HAND-DRAWN NOTEBOOK PAGE CONTAINER
          Lined / textured paper with binder holes, tape, and ink outlines
          ========================================================================= */}
      <div className="relative bg-[#fcf9ee] text-[#1c1917] rounded-3xl p-4 sm:p-6 md:p-7 border-4 border-[#1e1b18] shadow-[0_16px_36px_rgba(0,0,0,0.55),0_0_0_2px_rgba(255,255,255,0.06)] transform rotate-[-0.5deg]">
        {/* Notebook top spiral / ring holes */}
        <div className="absolute -top-3.5 inset-x-8 flex justify-between pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-6 bg-[#332a22] rounded-full border border-black/60 shadow-inner flex flex-col justify-between p-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-auto opacity-70" />
              <div className="w-1.5 h-1.5 rounded-full bg-black/60 mx-auto" />
            </div>
          ))}
        </div>

        {/* Paper tape on top-right corner */}
        <div className="absolute -top-2.5 -right-2.5 w-16 h-6 bg-[#e2d5b5]/90 border border-[#b8a682] transform rotate-12 shadow-sm pointer-events-none" />

        {/* Subtle lined paper background lines */}
        <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(to_bottom,transparent_27px,#e5ded0_28px)] bg-[size:100%_28px] opacity-35 pointer-events-none" />

        {/* HEADER: CATEGORY BADGE & ROLE BANNER */}
        <div className="relative z-10 mb-4 sm:mb-5 pb-3 border-b-2 border-dashed border-[#8c785e]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl filter drop-shadow-sm">{board.categoryIcon}</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8c785e] block font-mono">
                CATEGORÍA OFICIAL
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-[#1c1917] tracking-tight font-display uppercase">
                {board.categoryName}
              </h3>
            </div>
          </div>

          {/* ROLE BANNER */}
          {isTopo ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 border-2 border-amber-600/80 text-amber-950 text-xs font-black shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-amber-900 tracking-wider">
                  ERES EL TOPO
                </span>
                <span className="text-[9px] font-semibold text-amber-800 leading-tight">
                  No sabes la palabra marcada. ¡Disimula!
                </span>
              </div>
            </div>
          ) : role === 'INOCENTE' ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border-2 border-emerald-600/70 text-emerald-950 text-xs font-black shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                  ERES INOCENTE
                </span>
                <span className="text-[9px] font-semibold text-emerald-800 leading-tight">
                  La palabra marcada con rotulador es la clave
                </span>
              </div>
            </div>
          ) : (
            <span className="text-xs font-bold text-[#8c785e] uppercase">Cuaderno de sospechosos</span>
          )}
        </div>

        {/* =========================================================================
            4x4 WORD GRID (16 WORDS)
            ========================================================================= */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {board.words.map((word, idx) => {
            const isSecret = effectiveSecret === word;
            const isSelectedGuess = selectedGuessWord === word;
            const rotation = ROTATIONS[idx % ROTATIONS.length];

            return (
              <div
                key={idx}
                onClick={() => {
                  if (interactiveSelectWord && onSelectWord) {
                    onSelectWord(word);
                  }
                }}
                style={{ transform: `rotate(${rotation})` }}
                className={`relative group flex items-center justify-center min-h-[58px] sm:min-h-[68px] p-2.5 rounded-xl border-2 transition-all duration-200 ${
                  interactiveSelectWord
                    ? 'cursor-pointer hover:scale-105 active:scale-95'
                    : 'cursor-default'
                } ${
                  isSelectedGuess
                    ? 'bg-amber-100 border-amber-600 ring-4 ring-amber-400/40 shadow-lg'
                    : 'bg-[#fffef9] border-[#292524] shadow-[2px_3px_0px_rgba(0,0,0,0.85)] hover:border-[#1c1917]'
                }`}
              >
                {/* Word index stamp number */}
                <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-[#a89985]">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>

                {/* Word label */}
                <span
                  className={`text-center font-black tracking-tight leading-tight px-1 z-10 select-none ${
                    isCompact ? 'text-xs' : 'text-xs sm:text-sm md:text-base'
                  } ${
                    isSecret && !isTopo
                      ? 'text-rose-950 font-black'
                      : isSelectedGuess
                      ? 'text-amber-950'
                      : 'text-slate-900'
                  }`}
                >
                  {word}
                </span>

                {/* =====================================================================
                    HAND-DRAWN RED MARKER CIRCLE (ONLY FOR INNOCENTS OR END REVEAL!)
                    Authentic thick marker stroke with organic bezier curves & overlap
                    ===================================================================== */}
                {isSecret && !isTopo && (
                  <div className="absolute -inset-1.5 pointer-events-none z-20 flex items-center justify-center overflow-visible">
                    <svg
                      viewBox="0 0 140 70"
                      className="w-full h-full overflow-visible"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Secondary ink bleed / shadow */}
                      <path
                        d="M 12,34 C 10,12 38,6 74,7 C 114,8 132,16 130,37 C 128,56 100,64 66,63 C 28,62 10,50 14,35 C 16,26 32,14 65,11"
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeOpacity="0.45"
                        transform="translate(1, 1)"
                      />
                      {/* Main vibrant crimson hand-drawn marker loop with slight overlap */}
                      <path
                        d="M 12,34 C 10,12 38,6 74,7 C 114,8 132,16 130,37 C 128,56 100,64 66,63 C 28,62 10,50 14,35 C 16,26 32,14 65,11"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          strokeDasharray: 400,
                          strokeDashoffset: 0,
                          animation: 'marker-draw 0.6s cubic-bezier(0.65, 0, 0.35, 1) forwards',
                        }}
                      />
                    </svg>
                  </div>
                )}

                {/* If selected in interactive mole guess mode */}
                {isSelectedGuess && (
                  <div className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono text-[9px] font-black uppercase shadow">
                    ELECCIÓN
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER NOTE / CLUE INSTRUCTIONS */}
        <div className="relative z-10 mt-4 sm:mt-5 pt-3 border-t border-dashed border-[#8c785e]/40 flex items-center justify-between text-[11px] font-semibold text-[#665440]">
          <span className="font-mono">TABLERO DE 16 PALABRAS</span>
          {interactiveSelectWord ? (
            <span className="font-black text-amber-700 animate-pulse uppercase">
              Haz clic en la palabra que crees que es la secreta
            </span>
          ) : isTopo ? (
            <span className="text-amber-800 font-bold">
              Todas las palabras se ven iguales para ti.
            </span>
          ) : (
            <span className="text-emerald-800 font-bold">
              Escribe una pista que demuestre que sabes la palabra.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
