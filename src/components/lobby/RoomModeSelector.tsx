import React from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { audio } from '../../utils/audio';

export type RoomMode = 'create' | 'join';

interface RoomModeSelectorProps {
  mode: RoomMode;
  onChange: (mode: RoomMode) => void;
  accentColor?: string;
}

export const RoomModeSelector: React.FC<RoomModeSelectorProps> = ({
  mode,
  onChange,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg">
        <button
          type="button"
          onClick={() => {
            if (mode !== 'create') {
              audio.playClick();
              onChange('create');
            }
          }}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'create'
              ? 'bg-amber-500 text-stone-950 shadow-md scale-[1.01]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Crear sala</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (mode !== 'join') {
              audio.playClick();
              onChange('join');
            }
          }}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'join'
              ? 'bg-amber-500 text-stone-950 shadow-md scale-[1.01]'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
          }`}
        >
          <ArrowRight className="w-4 h-4 stroke-[3]" />
          <span>Unirse a sala</span>
        </button>
      </div>
    </div>
  );
};
