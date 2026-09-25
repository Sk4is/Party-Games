import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface RelesHexadecimalesModuleProps {
  operatorState: {
    register?: string; // e.g. "0x3A"
    // Backward compatibility
    relays?: string[];
    switches?: number[];
  };
  solved: boolean;
  onAction: (action: { switches: number[] }) => void;
}

export const RelesHexadecimalesModule: React.FC<RelesHexadecimalesModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  // ONE hexadecimal register
  const hexRegister =
    operatorState.register ||
    (operatorState.relays && operatorState.relays.length > 0
      ? `0x${operatorState.relays[0]}`
      : '0x3A');

  // Four binary relay switches: R1, R2, R3, R4 (0 = ABAJO, 1 = ARRIBA)
  const [switches, setSwitches] = useState<[number, number, number, number]>([0, 0, 0, 0]);

  const toggleSwitch = (idx: number) => {
    if (solved) return;
    audio.playMechanicalSwitch();
    setSwitches((prev) => {
      const copy = [...prev] as [number, number, number, number];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return copy;
    });
  };

  const handleVerify = () => {
    if (solved) return;
    audio.playMechanicalSwitch();
    onAction({ switches: [switches[0], switches[1], switches[2], switches[3]] });
  };

  const RELAY_LABELS = [
    { id: 'R1', bit: 'Bit 3 (MSB)', pos: 0 },
    { id: 'R2', bit: 'Bit 2', pos: 1 },
    { id: 'R3', bit: 'Bit 1', pos: 2 },
    { id: 'R4', bit: 'Bit 0 (LSB)', pos: 3 },
  ];

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-purple-300">
            ELECTRICIDAD
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // SUB-BUS 04 &bull; LÓGICA HEXADECIMAL
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-xs font-mono text-purple-300 font-bold">
          REGISTRO BASE 16
        </span>
      </div>

      {/* ONE SINGLE HEXADECIMAL REGISTER DISPLAY */}
      <div className="my-2 sm:my-3 flex flex-col items-center w-full max-w-sm">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
          REGISTRO HEXADECIMAL
        </span>
        <div className="w-full py-3 px-6 bg-slate-950 rounded-2xl border-2 border-purple-500/60 flex items-center justify-center shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]">
          <span className="font-mono text-3xl sm:text-4xl font-black text-purple-300 tracking-widest drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">
            {hexRegister}
          </span>
        </div>
      </div>

      {/* FOUR RELAY SWITCHES: R1, R2, R3, R4 */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-md my-2">
        {RELAY_LABELS.map((item) => {
          const isUp = switches[item.pos] === 1;
          return (
            <div
              key={item.id}
              className="flex flex-col items-center bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-sm"
            >
              <span className="text-xs font-mono font-black text-purple-300 tracking-wider">
                {item.id}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {item.bit}
              </span>

              {/* Physical Toggle switch lever (ARRIBA = 1, ABAJO = 0) */}
              <button
                type="button"
                disabled={solved}
                onClick={() => toggleSwitch(item.pos)}
                className={`w-11 h-20 rounded-full my-2.5 p-1 flex flex-col justify-between items-center transition-all cursor-pointer border-2 ${
                  isUp
                    ? 'bg-purple-950/80 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-900 border-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`${item.id}: Pulsa para cambiar a ${isUp ? 'ABAJO (0)' : 'ARRIBA (1)'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full shadow-md transition-all duration-200 flex items-center justify-center font-mono text-[10px] font-black ${
                    isUp
                      ? 'bg-purple-400 text-purple-950 translate-y-0 shadow-purple-500/50'
                      : 'bg-slate-700 text-slate-300 translate-y-9'
                  }`}
                >
                  {isUp ? '1' : '0'}
                </div>
              </button>

              {/* State label */}
              <span
                className={`text-[10px] font-mono font-black ${
                  isUp ? 'text-purple-300' : 'text-slate-500'
                }`}
              >
                {isUp ? 'ARRIBA (1)' : 'ABAJO (0)'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Verify Button */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          disabled={solved}
          onClick={handleVerify}
          className="w-full max-w-sm px-6 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl text-white font-black tracking-wider uppercase transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {solved ? 'RELÉS ENCLAVADOS ✓' : 'ENCLAVAR RELÉS'}
        </button>
        <span className="text-[11px] text-slate-400 font-mono text-center">
          Configura R1..R4 con los 4 bits calculados y pulsa enclavar
        </span>
      </div>
    </div>
  );
};
