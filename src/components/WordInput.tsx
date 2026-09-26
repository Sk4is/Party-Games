import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, History, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { UsedWord } from '../types';

interface WordInputProps {
  onWordSubmit: (word: string) => void;
  disabled: boolean;
  isValidating: boolean;
  activePlayerName: string;
  requiredSequence: string;
  feedback: {
    type: 'success' | 'error' | null;
    message: string;
    canonicalWord?: string;
  };
  usedWords: UsedWord[];
  currentTypingWord: string;
  onTypingChange: (word: string) => void;
}

export const WordInput: React.FC<WordInputProps> = ({
  onWordSubmit,
  disabled,
  isValidating,
  activePlayerName,
  requiredSequence,
  feedback,
  usedWords,
  currentTypingWord,
  onTypingChange,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingLockRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when enabled
  useEffect(() => {
    if (!disabled && !isValidating && !isSubmitting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, isValidating, isSubmitting]);

  // Unlock submission when validation state finishes or feedback changes
  useEffect(() => {
    if (!isValidating) {
      setIsSubmitting(false);
      submittingLockRef.current = false;
    }
  }, [isValidating, feedback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isValidating || isSubmitting || submittingLockRef.current) return;

    const trimmed = currentTypingWord.trim();
    if (!trimmed) return;

    submittingLockRef.current = true;
    setIsSubmitting(true);
    onWordSubmit(trimmed);
  };

  return (
    <div className="relative z-30 w-full max-w-2xl lg:max-w-[700px] xl:max-w-[760px] mx-auto flex flex-col items-center px-4">
      {/* 
        DEDICATED FIXED VALIDATION MESSAGE AREA IMMEDIATELY ABOVE THE INPUT
        Maintains fixed height so messages NEVER push the input or surrounding UI around.
      */}
      <div className="w-full h-10 min-h-[40px] md:h-11 md:min-h-[44px] mb-2 md:mb-2.5 flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {isValidating ? (
            <motion.div
              key="validating"
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
              <span>Comprobando en el diccionario...</span>
            </motion.div>
          ) : feedback.type ? (
            <motion.div
              key={feedback.type + feedback.message}
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={`px-5 py-1.5 rounded-2xl text-xs sm:text-sm font-black shadow-xl flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                  : 'bg-rose-600 text-white border-2 border-rose-400 animate-shake'
              }`}
            >
              {feedback.type === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>✓ {feedback.canonicalWord?.toUpperCase() || 'VÁLIDA'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{feedback.message}</span>
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Main Input Form with generous size and clear ENVIAR button */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-3.5 xl:gap-4 items-center justify-center"
      >
        <input
          id="word-input-field"
          ref={inputRef}
          type="text"
          disabled={disabled || isValidating || isSubmitting}
          value={currentTypingWord}
          onChange={(e) => onTypingChange(e.target.value)}
          onFocus={(e) => {
            // Mobile-safe scroll into view when virtual keyboard appears
            setTimeout(() => {
              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
          placeholder={
            disabled
              ? 'Esperando...'
              : isValidating || isSubmitting
              ? 'Comprobando...'
              : `Escribe una palabra con «${requiredSequence}»...`
          }
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className="w-full sm:flex-1 h-13 sm:h-14 md:h-[58px] lg:h-[62px] xl:h-16 px-6 md:px-7 xl:px-8 rounded-2xl bg-slate-900/95 border-2 border-slate-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/20 text-slate-100 font-bold text-base sm:text-lg md:text-lg lg:text-xl placeholder:text-slate-500 shadow-2xl focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-950 text-center sm:text-left"
        />

        <button
          id="submit-word-button"
          type="submit"
          disabled={disabled || isValidating || isSubmitting || !currentTypingWord.trim()}
          className="w-full sm:w-auto h-13 sm:h-14 md:h-[58px] lg:h-[62px] xl:h-16 px-8 md:px-9 xl:px-10 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-base md:text-base lg:text-lg tracking-wider shadow-xl shadow-amber-500/25 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>ENVIAR</span>
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </form>

      {/* Collapsible Secondary History Panel */}
      <div className="mt-4 md:mt-5 xl:mt-6 flex flex-col items-center w-full">
        <button
          id="toggle-word-history-button"
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs lg:text-[13px] font-bold transition-all cursor-pointer shadow-md"
        >
          <History className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
          <span>Palabras usadas ({usedWords.length})</span>
          {showHistory ? (
            <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
          )}
        </button>

        {/* Used Words Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              id="used-words-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl mt-3 p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden"
            >
              {usedWords.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-1.5">
                  Aún no se ha dicho ninguna palabra en esta ronda.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {usedWords.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.playerColor }}
                      />
                      <span>{item.canonicalWord || item.word}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({item.playerName})
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
