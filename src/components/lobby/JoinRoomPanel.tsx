import React, { useState } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { audio } from '../../utils/audio';

interface JoinRoomPanelProps {
  onJoin: (code: string) => void;
  isLoading?: boolean;
  initialCode?: string;
  accentClass?: string;
}

export const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({
  onJoin,
  isLoading = false,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode.toUpperCase().trim());

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only alphanumeric uppercase, max 8 chars
    const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length >= 2 && !isLoading) {
      audio.playGameStart();
      onJoin(trimmed);
    }
  };

  const isValid = code.trim().length >= 3;

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200 mb-1">
          Unirse a una sala
        </h3>
        <p className="text-xs text-stone-400">
          Introduce el código de acceso que te ha compartido el anfitrión.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Código de la sala
        </label>
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={handleChange}
            placeholder="K 7 P 4 Q"
            autoFocus
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            maxLength={8}
            className="w-full text-center tracking-[0.35em] font-mono text-2xl sm:text-3xl font-black py-4 px-4 rounded-2xl bg-stone-950 border-2 border-stone-800 focus:border-amber-400 text-amber-400 placeholder:text-stone-700 focus:outline-none transition-colors shadow-inner"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <LogIn className="w-5 h-5 stroke-[2.5]" />
            <span>Entrar en la sala</span>
          </>
        )}
      </button>
    </form>
  );
};
