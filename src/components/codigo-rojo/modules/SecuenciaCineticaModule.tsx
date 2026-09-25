import React from 'react';
import { Cog, CheckCircle2 } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface SecuenciaCineticaModuleProps {
  operatorState: {
    pistons: {
      id: number;
      collar: 'Dorado' | 'Carmesí' | 'Cobalto' | 'Esmeralda';
      stroke: 'Corto' | 'Medio' | 'Largo';
      pressed: boolean;
    }[];
    pressedPistonIds?: number[];
    stepProgress?: number;
  };
  solved: boolean;
  onAction: (action: { pressedPistonId: number }) => void;
}

const COLLAR_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  Dorado: { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-300' },
  Carmesí: { bg: 'bg-red-600', border: 'border-red-400', text: 'text-red-400' },
  Cobalto: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-400' },
  Esmeralda: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-400' },
};

export const SecuenciaCineticaModule: React.FC<SecuenciaCineticaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { pistons } = operatorState;
  const pressedIds = operatorState.pressedPistonIds || [];
  const stepProgress = operatorState.stepProgress || 0;

  const handlePistonClick = (id: number) => {
    if (solved || pressedIds.includes(id)) return;
    audio.playClick();
    onAction({ pressedPistonId: id });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cog className="w-4 h-4 text-amber-400 animate-spin [animation-duration:10s]" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-300">
            CONTROL
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // BANCO MECÁNICO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">PASO:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            {[0, 1, 2, 3].map((step) => {
              const isDone = step < (solved ? 4 : stepProgress);
              return (
                <div
                  key={step}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isDone
                      ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                      : 'bg-slate-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 4 Pistons Bank */}
      <div className="w-full flex items-end justify-center gap-3 sm:gap-6 my-6 max-w-md">
        {pistons.map((piston) => {
          const isPressed = solved || pressedIds.includes(piston.id);
          const collar = COLLAR_THEMES[piston.collar] || COLLAR_THEMES.Dorado;

          // Height based on stroke
          const heightClasses =
            piston.stroke === 'Largo'
              ? 'h-40 sm:h-48'
              : piston.stroke === 'Medio'
              ? 'h-32 sm:h-40'
              : 'h-28 sm:h-32';

          return (
            <div key={piston.id} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400">
                P-{piston.id}
              </span>

              {/* Piston Column Cylinder */}
              <button
                type="button"
                disabled={solved || isPressed}
                onClick={() => handlePistonClick(piston.id)}
                className={`w-full max-w-[70px] ${heightClasses} rounded-t-xl border-2 flex flex-col items-center justify-between p-1.5 transition-all transform duration-300 cursor-pointer shadow-lg ${
                  isPressed
                    ? 'translate-y-6 sm:translate-y-8 bg-slate-950 border-emerald-500/70 shadow-emerald-500/10'
                    : 'hover:-translate-y-1 active:translate-y-2 bg-gradient-to-b from-slate-700 to-slate-850 border-slate-600 hover:border-slate-500 shadow-slate-900/60'
                }`}
                title={`Pistón ${piston.id} - Collar ${piston.collar}, Recorrido ${piston.stroke}`}
              >
                {/* Metallic Top Cap */}
                <div className="w-full h-3 bg-slate-400/90 rounded-t-sm shadow" />

                {/* Anodized Color Collar */}
                <div
                  className={`w-full py-1.5 rounded text-center border font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-sm ${collar.bg} ${collar.border}`}
                >
                  {piston.collar}
                </div>

                {/* Stroke Indication Grooves */}
                <div className="flex flex-col gap-1 w-full px-1 items-center">
                  <div className="w-full h-0.5 bg-slate-600" />
                  {piston.stroke !== 'Corto' && <div className="w-full h-0.5 bg-slate-600" />}
                  {piston.stroke === 'Largo' && <div className="w-full h-0.5 bg-slate-600" />}
                </div>

                {/* Base or Locked Indicator */}
                <div className="text-[9px] font-mono font-bold text-slate-400">
                  {isPressed ? 'RETRAÍDO' : piston.stroke}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800">
        <span className="text-xs font-mono font-bold text-center">
          {solved ? (
            <span className="text-emerald-400">✓ Enclavamiento Cinético Desactivado</span>
          ) : (
            <span className="text-slate-300">
              Pulsa los pistones en el orden riguroso de cuatro pasos indicado por el Guía
            </span>
          )}
        </span>
        <span className="text-[11px] text-slate-500 font-mono text-center">
          Un error de orden provocará un fallo y reiniciará los pistones levantados
        </span>
      </div>
    </div>
  );
};
