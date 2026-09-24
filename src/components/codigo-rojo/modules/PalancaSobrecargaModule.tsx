import React from 'react';
import { ShieldAlert, ArrowDown } from 'lucide-react';

interface PalancaSobrecargaModuleProps {
  operatorState: {
    chargeColor: 'AZUL' | 'AMARILLO' | 'ROJO';
  };
  timeRemainingSeconds: number;
  solved: boolean;
  onAction: (action: { secondRemaining: number }) => void;
}

export const PalancaSobrecargaModule: React.FC<PalancaSobrecargaModuleProps> = ({
  operatorState,
  timeRemainingSeconds,
  solved,
  onAction,
}) => {
  const { chargeColor } = operatorState;

  const handlePullLever = () => {
    if (solved) return;
    onAction({ secondRemaining: timeRemainingSeconds });
  };

  const colorStyles =
    chargeColor === 'AZUL'
      ? { bg: 'bg-blue-500', glow: 'shadow-[0_0_20px_#3b82f6]', text: 'text-blue-400' }
      : chargeColor === 'AMARILLO'
      ? { bg: 'bg-amber-500', glow: 'shadow-[0_0_20px_#f59e0b]', text: 'text-amber-400' }
      : { bg: 'bg-red-500', glow: 'shadow-[0_0_20px_#ef4444]', text: 'text-red-400' };

  const lastDigit = Math.abs(timeRemainingSeconds % 10);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Palanca de Descarga Magnética
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${colorStyles.bg} ${colorStyles.glow}`} />
          <span className={`text-xs font-mono font-bold ${colorStyles.text}`}>
            FRANJA {chargeColor}
          </span>
        </div>
      </div>

      {/* Big Magnetic Lever Visual */}
      <div className="flex flex-col items-center my-4">
        {/* Glow indicator band */}
        <div
          className={`w-36 sm:w-44 h-4 rounded-full mb-6 ${colorStyles.bg} ${colorStyles.glow}`}
        />

        {/* Industrial Lever Button */}
        <button
          type="button"
          disabled={solved}
          onClick={handlePullLever}
          className={`group relative w-24 h-36 sm:w-28 sm:h-44 rounded-2xl border-4 transition-all duration-150 flex flex-col items-center justify-between p-3 cursor-pointer shadow-2xl ${
            solved
              ? 'bg-emerald-950/80 border-emerald-500 opacity-60 pointer-events-none'
              : 'bg-gradient-to-b from-red-700 via-red-800 to-red-950 border-red-500 hover:brightness-110 active:translate-y-4'
          }`}
        >
          <div className="w-12 h-6 bg-slate-900 rounded-lg border border-red-400/40 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-red-200">ACCIONAR</span>
          </div>

          <ArrowDown className="w-8 h-8 text-white/80 animate-bounce" />

          <div className="w-16 h-3 bg-red-950 rounded-full border border-red-500/40" />
        </button>

        {/* Real-time seconds hint */}
        <div className="mt-4 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400">
          Último dígito actual del segundero:{' '}
          <span className="text-white font-bold text-sm">[{lastDigit}]</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-mono text-center">
        {solved ? (
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            ✓ Descarga Magnética Completada
          </span>
        ) : (
          <span>Acciona la palanca cuando el último dígito del segundero coincida con la regla</span>
        )}
      </div>
    </div>
  );
};
