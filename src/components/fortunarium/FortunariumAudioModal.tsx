import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, X, Sliders, Cog, Sparkles } from 'lucide-react';
import {
  fortunariumAudio,
  FortunariumAudioSettings,
} from '../../utils/fortunariumAudio';

interface FortunariumAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FortunariumAudioModal: React.FC<FortunariumAudioModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<FortunariumAudioSettings>(() =>
    fortunariumAudio.getSettings()
  );

  useEffect(() => {
    return fortunariumAudio.subscribe(setSettings);
  }, []);

  if (!isOpen) return null;

  const handleSliderChange = (
    key: 'masterVolume' | 'effectsVolume' | 'machineVolume',
    val: number
  ) => {
    fortunariumAudio.updateSettings({ [key]: val, muted: false });
  };

  const handleToggleMute = () => {
    const nextMuted = !settings.muted;
    fortunariumAudio.updateSettings({ muted: nextMuted });
    if (!nextMuted) {
      fortunariumAudio.playButtonClick();
    }
  };

  return (
    <div
      className="fortunarium-root font-fortunarium fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-stone-950 border border-amber-500/45 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-amber-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400">
              {settings.muted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-fortunarium text-amber-300 tracking-wide">
                AJUSTES DE SONIDO
              </h2>
              <p className="text-[11px] text-stone-400">
                Preferencia local · No afecta al resto de la sala
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          {/* VOLUMEN GENERAL */}
          <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-white">
                <Sliders className="w-4 h-4 text-amber-400" />
                VOLUMEN GENERAL
              </span>
              <span className="font-mono text-amber-300 tabular-nums">
                {settings.muted ? '0%' : `${settings.masterVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.muted ? 0 : settings.masterVolume}
              onChange={(e) =>
                handleSliderChange('masterVolume', Number(e.target.value))
              }
              onMouseUp={() => fortunariumAudio.playButtonClick()}
              className="w-full accent-amber-500 h-2 rounded-lg bg-stone-800 cursor-pointer"
            />
          </div>

          {/* EFECTOS */}
          <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                EFECTOS Y PREMIOS
              </span>
              <span className="font-mono text-emerald-300 tabular-nums">
                {settings.muted ? '0%' : `${settings.effectsVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.muted ? 0 : settings.effectsVolume}
              onChange={(e) =>
                handleSliderChange('effectsVolume', Number(e.target.value))
              }
              onMouseUp={() => fortunariumAudio.playPatternChime(0)}
              className="w-full accent-emerald-400 h-2 rounded-lg bg-stone-800 cursor-pointer"
            />
          </div>

          {/* MÁQUINA */}
          <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-2 text-white">
                <Cog className="w-4 h-4 text-sky-400" />
                MÁQUINA Y RODILLOS
              </span>
              <span className="font-mono text-sky-300 tabular-nums">
                {settings.muted ? '0%' : `${settings.machineVolume}%`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.muted ? 0 : settings.machineVolume}
              onChange={(e) =>
                handleSliderChange('machineVolume', Number(e.target.value))
              }
              onMouseUp={() => fortunariumAudio.playReelLockClack(2)}
              className="w-full accent-sky-400 h-2 rounded-lg bg-stone-800 cursor-pointer"
            />
          </div>
        </div>

        {/* Mute All & Close */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex-1 py-2.5 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              settings.muted
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-200 hover:bg-rose-500/30'
                : 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800'
            }`}
          >
            {settings.muted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Silenciado (Reactivar)</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-stone-400" />
                <span>Silenciar Todo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
