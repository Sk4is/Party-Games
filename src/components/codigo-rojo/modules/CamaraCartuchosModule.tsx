import React, { useState } from 'react';
import { Layers, ArrowLeftRight, Lock } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface Cartridge {
  id: string;
  material: string;
  symbol: string;
  color: string;
}

interface CamaraCartuchosModuleProps {
  operatorState: {
    cartridges: Cartridge[];
  };
  solved: boolean;
  onAction: (action: { materialsOrder: string[] }) => void;
}

const DEFAULT_CARTRIDGES: Cartridge[] = [
  { id: 'cart-1', material: 'ACERO', symbol: 'ROMBO', color: '#94a3b8' },
  { id: 'cart-2', material: 'COBRE', symbol: 'TRIÁNGULO', color: '#ea580c' },
  { id: 'cart-3', material: 'CERÁMICA', symbol: 'CÍRCULO', color: '#e2e8f0' },
  { id: 'cart-4', material: 'TITANIO', symbol: 'CUADRADO', color: '#facc15' },
];

export const CamaraCartuchosModule: React.FC<CamaraCartuchosModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const [cartridges, setCartridges] = useState<Cartridge[]>(
    operatorState?.cartridges || DEFAULT_CARTRIDGES
  );

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleSlotClick = (idx: number) => {
    if (solved) return;
    audio.playClick();
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      // Swap cartridges
      audio.playCartridgeInsert();
      setCartridges((prev) => {
        const copy = [...prev];
        const temp = copy[selectedIdx];
        copy[selectedIdx] = copy[idx];
        copy[idx] = temp;
        return copy;
      });
      setSelectedIdx(null);
    }
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({
      materialsOrder: cartridges.map((c) => c.material),
    });
  };

  const getSymbolGlyph = (sym: string) => {
    if (sym === 'TRIÁNGULO') return '▲';
    if (sym === 'CÍRCULO') return '●';
    if (sym === 'ROMBO') return '◆';
    return '■';
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-yellow-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-yellow-300">
            MECÁNICA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CÁMARA DE CARTUCHOS CILÍNDRICOS
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span>PULSA 2 CARTUCHOS PARA INTERCAMBIAR</span>
        </div>
      </div>

      {/* 4 Cartridge Bays */}
      <div className="w-full max-w-lg my-4 flex flex-col items-center gap-3">
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
          {cartridges.map((cart, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={cart.id}
                type="button"
                onClick={() => handleSlotClick(idx)}
                disabled={solved}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer relative shadow-md ${
                  isSelected
                    ? 'bg-amber-600/30 border-yellow-300 shadow-yellow-500/30 scale-105'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Slot index badge */}
                <span className="text-[9px] font-mono font-bold text-slate-500">
                  RANURA #{idx + 1}
                </span>

                {/* Cylindrical Cartridge Body */}
                <div
                  className="w-10 h-16 rounded-md border flex flex-col items-center justify-around py-1 shadow-inner"
                  style={{ borderColor: cart.color, backgroundColor: `${cart.color}15` }}
                >
                  <span className="text-sm" style={{ color: cart.color }}>
                    {getSymbolGlyph(cart.symbol)}
                  </span>
                  <div className="w-6 h-0.5 bg-slate-600" />
                  <span className="text-[7.5px] font-mono font-black" style={{ color: cart.color }}>
                    {cart.material.slice(0, 3)}
                  </span>
                </div>

                {/* Material description tag */}
                <span className="text-[10px] font-mono font-bold text-white">
                  {cart.material}
                </span>
                <span className="text-[8px] font-mono text-slate-400">
                  {cart.symbol}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-600/30 active:scale-95'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{solved ? 'CÁMARA SELLADA' : 'SELLAR CÁMARA'}</span>
        </button>
      </div>
    </div>
  );
};
