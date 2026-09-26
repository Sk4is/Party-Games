import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audio } from '../utils/audio';

interface SoundToggleProps {
  compact?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ compact = false }) => {
  const [isMuted, setIsMuted] = useState(audio.getIsMuted());

  const handleToggle = () => {
    const unmuted = audio.toggleMute();
    setIsMuted(!unmuted);
    if (unmuted) {
      audio.playAnswerAccepted();
    }
  };

  if (compact) {
    return (
      <button
        id="sound-toggle-button-compact"
        type="button"
        onClick={handleToggle}
        aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        className="group w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
        ) : (
          <Volume2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        )}
      </button>
    );
  }

  return (
    <button
      id="sound-toggle-button"
      type="button"
      onClick={handleToggle}
      aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
      className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-md backdrop-blur-md cursor-pointer active:scale-95 select-none"
    >
      {isMuted ? (
        <>
          <VolumeX className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>Silenciado</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Sonido</span>
        </>
      )}
    </button>
  );
};
