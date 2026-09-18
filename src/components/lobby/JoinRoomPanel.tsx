import React, { useState } from 'react';
import { ArrowRight, LogIn } from 'lucide-react';
import { audio } from '../../utils/audio';
import { GameSlug } from '../../styles/gameThemes';

interface JoinRoomPanelProps {
  onJoin: (code: string) => void;
  isLoading?: boolean;
  initialCode?: string;
  accentClass?: string;
  gameType?: GameSlug;
}

export const JoinRoomPanel: React.FC<JoinRoomPanelProps> = ({
  onJoin,
  isLoading = false,
  initialCode = '',
  gameType = 'la-bomba',
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

  const inputThemeClass =
    gameType === 'la-peor-respuesta'
      ? 'focus:border-[#FF3B4F] text-[#FF3B4F]'
      : gameType === 'pinturillo'
      ? 'focus:border-[#00BCEB] text-[#00BCEB]'
      : 'focus:border-[#FFB000] text-[#FFB000]';

  const btnThemeClass =
    gameType === 'la-peor-respuesta'
      ? 'bg-[#FF3B4F] hover:bg-[#E6293D] text-white shadow-[#FF3B4F]/25'
      : gameType === 'pinturillo'
      ? 'bg-[#00BCEB] hover:bg-[#009ED0] text-slate-950 shadow-[#00BCEB]/25'
      : 'bg-[#FFB000] hover:bg-[#FF8A00] text-stone-950 shadow-[#FFB000]/25';

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
            className={`w-full text-center tracking-[0.35em] font-mono text-2xl sm:text-3xl font-black py-4 px-4 rounded-2xl bg-stone-950 border-2 border-stone-800 placeholder:text-stone-700 focus:outline-none transition-colors shadow-inner ${inputThemeClass}`}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={`w-full py-4 px-6 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${btnThemeClass}`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
