import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, Sparkles, Sliders, X } from 'lucide-react';
import { fortunariumAudio, FortunariumAudioSettings } from '../../utils/fortunariumAudio';

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

  const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fortunariumAudio.setMasterVolume( parseFloat(e.target.value) );
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fortunariumAudio.setMusicVolume( parseFloat(e.target.value) );
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fortunariumAudio.setSfxVolume( parseFloat(e.target.value) );
  };

  const handleToggleMute = () => {
    const nextMuted = fortunariumAudio.toggleMute();
    if (!nextMuted) {
      fortunariumAudio.playButtonClick();
    }
  };

  return (
    <div
      className="fortunarium-root font-fortunarium fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="fort-cyber-modal w-full max-w-md rounded-2xl p-5 sm:p-6 text-cyan-50 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#FF2A6D]/35 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1f0915] border border-[#FF2A6D]/65 flex items-center justify-center text-[#FF2A6D] shadow-[0_0_14px_rgba(255,42,109,0.3)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF2A6D] block">
                 CONSOLA ACÚSTICA · SYNTH &amp; MECÁNICA
              </span>
              <h3 className="text-xl font-fortunarium text-white tracking-wide">
                AJUSTES DE SONIDO
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onClose();
            }}
            className="fort-arcade-btn p-2 rounded-xl bg-[#1a0b14] hover:bg-[#291020] border border-[#FF2A6D]/60 text-[#FF2A6D] hover:text-white cursor-pointer"
            title="Cerrar ajustes de sonido"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mute Toggle Banner */}
        <div className="fort-crt-display p-3.5 rounded-xl border border-cyan-400/45 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {settings.muted ? (
              <VolumeX className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                {settings.muted ? 'Audio Silenciado' : 'Sintetizador Activo'}
              </div>
              <div className="text-[11px] text-cyan-200/80 font-sans">
                {settings.muted
                  ? 'Todos los canales están en silencio'
                  : 'Efectos electromecánicos y ambiente activos'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMute}
            className={`fort-arcade-btn px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider cursor-pointer transition border ${
              settings.muted
                ? 'bg-rose-600 hover:bg-rose-500 border-rose-300 text-white shadow-[0_0_14px_rgba(244,63,94,0.45)]'
                : 'bg-[#FF2A6D] hover:bg-[#ff4782] border-pink-200 text-white shadow-[0_0_14px_rgba(255,42,109,0.45)]'
            }`}
          >
            {settings.muted ? 'ACTIVAR' : 'SILENCIAR'}
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-3.5">
          {/* Master Volume */}
          <div className="fort-crt-panel p-3.5 rounded-xl border border-[#FF2A6D]/35 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-pink-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-[#FF2A6D]" />
                Volumen General
              </span>
              <span className="font-mono font-black text-[#FF2A6D] tabular-nums">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.masterVolume}
              onChange={handleMasterChange}
              className="w-full accent-[#FF2A6D] cursor-pointer h-2 bg-[#040811] rounded-lg"
            />
          </div>

          {/* Music / Ambience Volume */}
          <div className="fort-crt-panel p-3.5 rounded-xl border border-cyan-500/35 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Music className="w-4 h-4 text-cyan-400" />
                Ambiente del Taller
              </span>
              <span className="font-mono font-black text-cyan-300 tabular-nums">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.musicVolume}
              onChange={handleMusicChange}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#040811] rounded-lg"
            />
          </div>

          {/* SFX Volume */}
          <div className="fort-crt-panel p-3.5 rounded-xl border border-amber-400/35 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Efectos Mecánicos (SFX)
              </span>
              <span className="font-mono font-black text-amber-300 tabular-nums">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.sfxVolume}
              onChange={handleSfxChange}
              onPointerUp={() => fortunariumAudio.playButtonClick()}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-[#040811] rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            onClose();
          }}
          className="fort-arcade-btn w-full py-2.5 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-fortunarium text-sm tracking-wider shadow-[0_0_20px_rgba(255,42,109,0.4)] cursor-pointer"
        >
          GUARDAR Y VOLVER
        </button>
      </div>
    </div>
  );
};
