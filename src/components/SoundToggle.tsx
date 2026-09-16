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
        className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-rose-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-emerald-400" />
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
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all duration-200 shadow-md backdrop-blur-sm cursor-pointer active:scale-95"
    >
      {isMuted ? (
        <>
          <VolumeX className="w-4 h-4 text-rose-400" />
          <span>🔇 Silencio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>🔊 Sonido</span>
        </>
      )}
    </button>
  );
};
