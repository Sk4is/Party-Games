import React, { useState } from 'react';
import { Lock, Delete, Check } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface TecladoMaestroModuleProps {
  operatorState: {
    serial: string;
    ledAux: boolean;
    currentInput: string;
  };
  solved: boolean;
  onAction: (action: { pin: string }) => void;
}

export const TecladoMaestroModule: React.FC<TecladoMaestroModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { serial, ledAux } = operatorState;
  const [pin, setPin] = useState('');

  const handleDigit = (digit: string) => {
    if (solved || pin.length >= 4) return;
    audio.playTerminalBeep();
    setPin((prev) => prev + digit);
  };

  const handleClear = () => {
    if (solved) return;
    audio.playDialClick();
    setPin('');
  };

  const handleEnter = () => {
    if (solved || pin.length !== 4) return;
    audio.playMechanicalSwitch();
    onAction({ pin });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-pink-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-pink-300">
            COMUNICACIONES
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // TERMINAL DE ENTRADA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              ledAux ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'
            }`}
          />
          <span className="text-xs font-mono text-slate-400">
            LED AUX: {ledAux ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Screen displays Serial and PIN */}
      <div className="w-full max-w-xs bg-slate-950 p-3 rounded-xl border border-slate-800 my-2 flex justify-between items-center font-mono">
        <div className="text-xs text-slate-400">
          SERIAL: <span className="text-white font-bold">{serial}</span>
        </div>
        <div className="text-lg font-black tracking-widest text-emerald-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">
          {pin.padEnd(4, '•')}
        </div>
      </div>

      {/* 3x4 Tactical Keypad */}
      <div className="grid grid-cols-3 gap-2 my-2 w-full max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={solved}
            onClick={() => handleDigit(num)}
            className="py-3 bg-slate-850 hover:bg-slate-800 active:scale-95 rounded-xl border border-slate-700 text-slate-200 font-mono text-lg font-bold transition-all cursor-pointer shadow"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          disabled={solved}
          onClick={handleClear}
          className="py-3 bg-red-950/50 hover:bg-red-900/60 active:scale-95 rounded-xl border border-red-500/40 text-red-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={solved}
          onClick={() => handleDigit('0')}
          className="py-3 bg-slate-850 hover:bg-slate-800 active:scale-95 rounded-xl border border-slate-700 text-slate-200 font-mono text-lg font-bold transition-all cursor-pointer shadow"
        >
          0
        </button>
        <button
          type="button"
          disabled={solved || pin.length !== 4}
          onClick={handleEnter}
          className="py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-slate-950 font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>

      <div className="text-xs text-slate-400 font-mono text-center">
        {solved ? (
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            ✓ Acceso Autorizado
          </span>
        ) : (
          <span>Calcula el PIN de 4 dígitos con las fórmulas de descifrado</span>
        )}
      </div>
    </div>
  );
};
