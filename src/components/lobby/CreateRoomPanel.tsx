import React from 'react';
import { Plus } from 'lucide-react';
import { audio } from '../../utils/audio';
import { GameSlug } from '../../styles/gameThemes';

interface CreateRoomPanelProps {
  onCreate: () => void;
  isLoading?: boolean;
  settingsSlot?: React.ReactNode;
  accentClass?: string;
  gameTitle?: string;
  gameType?: GameSlug;
}

export const CreateRoomPanel: React.FC<CreateRoomPanelProps> = ({
  onCreate,
  isLoading = false,
  settingsSlot,
  gameType = 'la-bomba',
}) => {
  const handleClick = () => {
    if (isLoading) return;
    audio.playGameStart();
    onCreate();
  };

  const btnThemeClass =
    gameType === 'la-peor-respuesta'
      ? 'bg-[#FF3B4F] hover:bg-[#E6293D] text-white shadow-[#FF3B4F]/25'
      : gameType === 'pinturillo'
      ? 'bg-[#00BCEB] hover:bg-[#009ED0] text-slate-950 shadow-[#00BCEB]/25'
      : 'bg-[#FFB000] hover:bg-[#FF8A00] text-stone-950 shadow-[#FFB000]/25';

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
          className={`w-full py-4 px-6 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${btnThemeClass}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
