import React from 'react';
import { Plus } from 'lucide-react';
import { audio } from '../../utils/audio';

interface CreateRoomPanelProps {
  onCreate: () => void;
  isLoading?: boolean;
  settingsSlot?: React.ReactNode;
  accentClass?: string;
  gameTitle?: string;
}

export const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  onCreate,
  isLoading = false,
  settingsSlot,
}) => {
  const handleClick = () => {
    if (isLoading) return;
    audio.playGameStart();
    onCreate();
  };

  return (
    <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      {settingsSlot && (
        <div className="space-y-4">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
              Configuración Inicial de la Partida
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              También podrás ajustar estos parámetros en la sala antes de empezar.
            </p>
          </div>
          {settingsSlot}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Crear sala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
