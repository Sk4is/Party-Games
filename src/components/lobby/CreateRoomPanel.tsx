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
      : gameType === 'palabra-secreta'
      ? 'bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-[#10B981]/25'
      : 'bg-[#FFB000] hover:bg-[#FF8A00] text-stone-950 shadow-[#FFB000]/25';

  return (
    <div className="w-full max-w-full min-w-0 bg-stone-900/70 border border-stone-800/90 rounded-3xl p-3.5 xs:p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-6 box-border">
      {settingsSlot && (
        <div className="space-y-3 sm:space-y-4 w-full min-w-0">
          <div className="border-b border-stone-800 pb-2.5 sm:pb-3 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 break-words">
              Configuración Inicial de la Partida
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 break-words">
              También podrás ajustar estos parámetros en la sala antes de empezar.
            </p>
          </div>
          {settingsSlot}
        </div>
      )}

      <div className="w-full min-w-0 pt-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className={`w-full max-w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${btnThemeClass}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
              <span className="truncate">Crear sala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
