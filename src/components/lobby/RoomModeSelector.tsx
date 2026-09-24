import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { audio } from '../../utils/audio';
import { GameSlug } from '../../styles/gameThemes';

export type RoomMode = 'create' | 'join';

interface RoomModeSelectorProps {
  mode: RoomMode;
  onChange: (mode: RoomMode) => void;
  accentColor?: string;
  gameType?: GameSlug;
}

export const RoomModeSelector: React.FC<RoomModeSelectorProps> = ({
  mode,
  onChange,
  gameType = 'la-bomba',
}) => {
  const activeClass =
    gameType === 'la-peor-respuesta'
      ? 'bg-[#FF3B4F] text-white shadow-md shadow-[#FF3B4F]/25 scale-[1.01]'
      : gameType === 'pinturillo'
      ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/25 scale-[1.01]'
      : gameType === 'palabra-secreta'
      ? 'bg-[#10B981] text-slate-950 shadow-md shadow-[#10B981]/25 scale-[1.01]'
      : 'bg-[#FFB000] text-stone-950 shadow-md shadow-[#FFB000]/25 scale-[1.01]';

  return (
    <div className="w-full max-w-full min-w-0">
      <div
        className="grid p-1 sm:p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg gap-1 w-full min-w-0"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}
      >
        <button
          type="button"
          onClick={() => {
            if (mode !== 'create') {
              audio.playClick();
              onChange('create');
            }
          }}
          className={`py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-xl text-[11px] xs:text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${
            mode === 'create'
              ? activeClass
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] shrink-0" />
          <span className="truncate">Crear sala</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (mode !== 'join') {
              audio.playClick();
              onChange('join');
            }
          }}
          className={`py-2.5 sm:py-3 px-1.5 sm:px-4 rounded-xl text-[11px] xs:text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 min-w-0 ${
            mode === 'join'
              ? activeClass
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3] shrink-0" />
          <span className="truncate">Unirse a sala</span>
        </button>
      </div>
    </div>
  );
};
