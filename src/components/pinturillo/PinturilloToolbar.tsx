import React, { useState } from 'react';
import { DrawingTool } from '../../types/pinturillo';
import { audio } from '../../utils/audio';
import { Undo2, Redo2, Trash2, PaintBucket, Eraser, Brush, PenLine, Pencil } from 'lucide-react';

interface PinturilloToolbarProps {
  currentTool: DrawingTool;
  currentColor: string;
  currentSize: number;
  onSelectTool: (tool: DrawingTool) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

const PALETTE = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Gris', hex: '#64748b' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Marrón', hex: '#78350f' },
  { name: 'Rojo', hex: '#ef4444' },
  { name: 'Naranja', hex: '#f97316' },
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Celeste', hex: '#38bdf8' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Violeta', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
];

const BRUSH_SIZES = [
  { label: 'Fino', size: 3, dotSize: 4 },
  { label: 'Medio', size: 7, dotSize: 8 },
  { label: 'Grueso', size: 14, dotSize: 14 },
  { label: 'Muy grueso', size: 24, dotSize: 20 },
  { label: 'Extra', size: 40, dotSize: 26 },
];

export const PinturilloToolbar: React.FC<PinturilloToolbarProps> = ({
  currentTool,
  currentColor,
  currentSize,
  onSelectTool,
  onSelectColor,
  onSelectSize,
  onUndo,
  onRedo,
  onClear,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleToolClick = (tool: DrawingTool) => {
    audio.playPinturilloToolSelect();
    onSelectTool(tool);
  };

  const handleColorClick = (hex: string) => {
    audio.playPinturilloToolSelect();
    onSelectColor(hex);
    if (currentTool === 'eraser') {
      onSelectTool('pencil');
    }
  };

  const handleConfirmClear = () => {
    setShowClearConfirm(false);
    audio.playBombWarning(1.0);
    onClear();
  };

  return (
    <div className="relative w-full bg-slate-900/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3 text-slate-100">
      {/* 1. Drawing Tools (Lápiz, Rotulador, Pincel, Goma, Relleno) */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          onClick={() => handleToolClick('pencil')}
          title="Lápiz fino"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            currentTool === 'pencil'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Lápiz</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('marker')}
          title="Rotulador"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            currentTool === 'marker'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <PenLine className="w-4 h-4" />
          <span className="hidden sm:inline">Rotulador</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('brush')}
          title="Pincel suave"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            currentTool === 'brush'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Brush className="w-4 h-4" />
          <span className="hidden sm:inline">Pincel</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('eraser')}
          title="Goma de borrar"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            currentTool === 'eraser'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Eraser className="w-4 h-4" />
          <span className="hidden sm:inline">Goma</span>
        </button>

        <button
          type="button"
          onClick={() => handleToolClick('fill')}
          title="Cubo de pintura (Relleno)"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            currentTool === 'fill'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <PaintBucket className="w-4 h-4" />
          <span className="hidden sm:inline">Relleno</span>
        </button>
      </div>

      {/* 2. Brush Sizes with visual dot preview */}
      <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-slate-950/60 rounded-xl border border-slate-800">
        {BRUSH_SIZES.map(b => (
          <button
            key={b.size}
            type="button"
            onClick={() => {
              audio.playPinturilloToolSelect();
              onSelectSize(b.size);
            }}
            title={`Grosor: ${b.label} (${b.size}px)`}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              currentSize === b.size
                ? 'bg-amber-500/25 border-2 border-amber-400'
                : 'hover:bg-slate-800 border border-transparent'
            }`}
          >
            <div
              className="rounded-full bg-slate-100 transition-transform"
              style={{
                width: `${b.dotSize}px`,
                height: `${b.dotSize}px`,
                backgroundColor: currentTool === 'eraser' ? '#cbd5e1' : currentColor,
              }}
            />
          </button>
        ))}
      </div>

      {/* 3. Colour Palette Swatches + Color Picker */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
        {PALETTE.map(c => {
          const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase() && currentTool !== 'eraser';
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => handleColorClick(c.hex)}
              title={c.name}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-transform cursor-pointer border ${
                c.hex === '#ffffff' ? 'border-slate-400' : 'border-slate-800'
              } ${isSelected ? 'scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-md' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}

        {/* Custom color picker */}
        <label
          title="Más colores"
          className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-rose-500 via-emerald-400 to-sky-400 border border-slate-700 cursor-pointer flex items-center justify-center hover:scale-110 transition-transform overflow-hidden"
        >
          <input
            type="color"
            value={currentColor}
            onChange={e => handleColorClick(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      {/* 4. Action Buttons (Undo, Redo, Clear) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onUndo}
          title="Deshacer trazo"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          title="Rehacer trazo"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          title="Limpiar todo el lienzo"
          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1 text-xs font-bold"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {/* Clear Canvas Safety Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl">
              🗑️
            </div>
            <h3 className="text-xl font-black text-white mb-2">¿Borrar todo el dibujo?</h3>
            <p className="text-sm text-slate-300 mb-6">
              Esta acción eliminará todos los trazos actuales de la pizarra.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition-all shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
