import React, { useState } from 'react';
import { Cable, Unplug } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface PuertosConexionModuleProps {
  operatorState: {
    busCode: 'BUS-ALFA' | 'BUS-BETA' | 'BUS-GAMMA' | 'BUS-DELTA';
    ports: string[];
    cables: { red: [string, string] | null; yellow: [string, string] | null };
  };
  solved: boolean;
  onAction: (action: { red: [string, string]; yellow: [string, string] }) => void;
}

export const PuertosConexionModule: React.FC<PuertosConexionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { busCode, ports } = operatorState;
  const [activeCable, setActiveCable] = useState<'red' | 'yellow'>('red');
  const [pendingStartPort, setPendingStartPort] = useState<string | null>(null);
  const [redCable, setRedCable] = useState<[string, string] | null>(null);
  const [yellowCable, setYellowCable] = useState<[string, string] | null>(null);

  const handlePortClick = (port: string) => {
    if (solved) return;

    audio.playDialClick();
    if (!pendingStartPort) {
      setPendingStartPort(port);
    } else {
      if (pendingStartPort !== port) {
        audio.playWireCut();
        if (activeCable === 'red') {
          setRedCable([pendingStartPort, port]);
        } else {
          setYellowCable([pendingStartPort, port]);
        }
      }
      setPendingStartPort(null);
    }
  };

  const handleClearCable = (color: 'red' | 'yellow') => {
    if (solved) return;
    audio.playDialClick();
    if (color === 'red') setRedCable(null);
    else setYellowCable(null);
    setPendingStartPort(null);
  };

  const handleLinkSignal = () => {
    if (solved || !redCable || !yellowCable) return;
    audio.playMechanicalSwitch();
    onAction({ red: redCable, yellow: yellowCable });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cable className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Placa de Parcheo Auxiliar
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-mono text-xs font-bold">
          {busCode}
        </span>
      </div>

      {/* Cable Selector */}
      <div className="flex gap-4 my-2">
        <button
          type="button"
          onClick={() => {
            setActiveCable('red');
            setPendingStartPort(null);
          }}
          className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCable === 'red'
              ? 'bg-red-500/20 border-red-500 text-red-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Cable Rojo: {redCable ? `${redCable[0]} ↔ ${redCable[1]}` : 'Sin conectar'}
          {redCable && (
            <Unplug
              onClick={(e) => {
                e.stopPropagation();
                handleClearCable('red');
              }}
              className="w-3.5 h-3.5 ml-1 text-slate-400 hover:text-white"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveCable('yellow');
            setPendingStartPort(null);
          }}
          className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeCable === 'yellow'
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          Cable Amarillo: {yellowCable ? `${yellowCable[0]} ↔ ${yellowCable[1]}` : 'Sin conectar'}
          {yellowCable && (
            <Unplug
              onClick={(e) => {
                e.stopPropagation();
                handleClearCable('yellow');
              }}
              className="w-3.5 h-3.5 ml-1 text-slate-400 hover:text-white"
            />
          )}
        </button>
      </div>

      {/* 6 Jack Ports J1-J6 */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 my-4 w-full max-w-sm">
        {ports.map((port) => {
          const isSelected = pendingStartPort === port;
          const hasRed = redCable && (redCable[0] === port || redCable[1] === port);
          const hasYellow = yellowCable && (yellowCable[0] === port || yellowCable[1] === port);

          let portBorder = 'border-slate-700 bg-slate-950';
          if (isSelected) portBorder = 'border-white bg-slate-800 scale-105';
          else if (hasRed) portBorder = 'border-red-500 bg-red-950/30';
          else if (hasYellow) portBorder = 'border-yellow-500 bg-yellow-950/30';

          return (
            <button
              key={port}
              type="button"
              disabled={solved}
              onClick={() => handlePortClick(port)}
              className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer shadow-md ${portBorder}`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center mb-1">
                <div className="w-2 h-2 rounded-full bg-black" />
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">{port}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved || !redCable || !yellowCable}
          onClick={handleLinkSignal}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-40"
        >
          {solved ? 'SEÑAL ENLAZADA ✓' : 'ENLAZAR SEÑAL'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Conecta ambos cables entre los jacks adecuados y pulsa enlazar
        </span>
      </div>
    </div>
  );
};
