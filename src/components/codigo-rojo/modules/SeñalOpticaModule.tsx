import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface SeñalOpticaModuleProps {
  operatorState: {
    patternDurations: number[]; // [1, 3, 1] etc
    availableStations: { name: string; freq: string }[];
  };
  solved: boolean;
  onAction: (action: { freq: string }) => void;
}

export const SeñalOpticaModule: React.FC<SeñalOpticaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { patternDurations, availableStations } = operatorState;
  const [selectedFreq, setSelectedFreq] = useState<string>(availableStations[0]?.freq || '');
  const [isLightOn, setIsLightOn] = useState(false);
  const [cycleKey, setCycleKey] = useState(0);

  // Blinking loop for the emergency lamp
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let step = 0;
    let isRunning = true;

    const runSequence = () => {
      if (!isRunning) return;

      if (step < patternDurations.length * 2) {
        if (step % 2 === 0) {
          // Light ON
          const pulseIdx = step / 2;
          const dur = patternDurations[pulseIdx] * 350; // 350ms or 1050ms
          setIsLightOn(true);
          step++;
          timeout = setTimeout(runSequence, dur);
        } else {
          // Pause between pulses (400ms)
          setIsLightOn(false);
          step++;
          timeout = setTimeout(runSequence, 400);
        }
      } else {
        // End of pattern, 2.5s dark pause before repeat
        setIsLightOn(false);
        step = 0;
        timeout = setTimeout(runSequence, 2500);
      }
    };

    runSequence();

    return () => {
      isRunning = false;
      clearTimeout(timeout);
    };
  }, [patternDurations, cycleKey]);

  const handleTune = () => {
    if (solved || !selectedFreq) return;
    audio.playMechanicalSwitch();
    onAction({ freq: selectedFreq });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Transmisor Óptico
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCycleKey((k) => k + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-mono cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Reiniciar Destellos
        </button>
      </div>

      {/* Flashing Light Lamp */}
      <div className="flex flex-col items-center my-4">
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 transition-all duration-100 flex items-center justify-center ${
            isLightOn
              ? 'bg-amber-300 border-amber-200 shadow-[0_0_40px_#fde047]'
              : 'bg-amber-950/40 border-amber-900/80 shadow-none'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full ${
              isLightOn ? 'bg-white' : 'bg-amber-900/60'
            }`}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 mt-2">
          {isLightOn ? 'EMISIÓN ACTIVA' : 'PAUSA'}
        </span>
      </div>

      {/* Radio Frequency Stations selector */}
      <div className="w-full max-w-sm flex flex-col gap-2">
        <label className="text-xs font-mono text-slate-400">
          Sintonizador de Radio Táctica:
        </label>
        <select
          value={selectedFreq}
          onChange={(e) => setSelectedFreq(e.target.value)}
          disabled={solved}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500"
        >
          {availableStations.map((st) => (
            <option key={st.freq} value={st.freq}>
              {st.name} — {st.freq}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full flex flex-col items-center gap-2 mt-3">
        <button
          type="button"
          disabled={solved}
          onClick={handleTune}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'TRANSMISIÓN FIJADA ✓' : 'TRANSMITIR'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Decodifica los destellos (cortos y largos) con el manual y sintoniza
        </span>
      </div>
    </div>
  );
};
