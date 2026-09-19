import React from 'react';
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
  onRequestClear: () => void;
}

// 12 Refined, vibrant party-game palette colors
const PALETTE = [
  { name: 'Negro grafito', hex: '#0f172a' },
  { name: 'Gris pizarra', hex: '#64748b' },
  { name: 'Blanco puro', hex: '#ffffff' },
  { name: 'Marrón madera', hex: '#854d0e' },
  { name: 'Rojo coral', hex: '#ff6b6b' },
  { name: 'Naranja fuego', hex: '#fb923c' },
  { name: 'Amarillo oro', hex: '#ffc928' },
  { name: 'Verde lima', hex: '#4ade80' },
  { name: 'Cian cielo', hex: '#38d9ff' },
  { name: 'Azul vibrante', hex: '#3b82f6' },
  { name: 'Púrpura neón', hex: '#a78bfa' },
  { name: 'Rosa chicle', hex: '#f472b6' },
];

const BRUSH_SIZES = [
  { label: 'Fino', size: 3, dotSize: 4 },
  { label: 'Medio', size: 7, dotSize: 8 },
  { label: 'Grueso', size: 14, dotSize: 13 },
  { label: 'Muy grueso', size: 24, dotSize: 18 },
  { label: 'Extra', size: 40, dotSize: 24 },
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
  onRequestClear,
}) => {
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

  return (
    <div className="relative w-full bg-[#0b1022]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-2 sm:p-3.5 border-2 border-slate-700/80 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.7)] flex flex-col gap-2.5 text-slate-100 select-none overflow-hidden">
      {/* ROW 1: Drawing Tools + Action Buttons */}
      <div className="flex items-center justify-between gap-2 w-full">
        {/* 1. Drawing Tools (Lápiz, Rotulador, Pincel, Goma, Relleno) */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Lápiz (#FFC928) */}
          <button
            type="button"
            onClick={() => handleToolClick('pencil')}
            title="Lápiz: trazo fino y preciso con textura de grafito"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95 shrink-0 ${
              currentTool === 'pencil'
                ? 'bg-[#FFC928] text-slate-950 shadow-[0_0_15px_rgba(255,201,40,0.5)] scale-105 border border-amber-300'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:text-white'
            }`}
          >
            <Pencil className="w-4 h-4 shrink-0" />
            <span>Lápiz</span>
          </button>

          {/* Rotulador (#38D9FF) */}
          <button
            type="button"
            onClick={() => handleToolClick('marker')}
            title="Rotulador: línea suave, opaca y de grosor constante"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95 shrink-0 ${
              currentTool === 'marker'
                ? 'bg-[#38D9FF] text-slate-950 shadow-[0_0_15px_rgba(56,217,255,0.5)] scale-105 border border-cyan-300'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:text-white'
            }`}
          >
            <PenLine className="w-4 h-4 shrink-0" />
            <span>Rotulador</span>
          </button>

          {/* Pincel (#A78BFA) */}
          <button
            type="button"
            onClick={() => handleToolClick('brush')}
            title="Pincel: trazo artístico dinámico sensible a la velocidad"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95 shrink-0 ${
              currentTool === 'brush'
                ? 'bg-[#A78BFA] text-slate-950 shadow-[0_0_15px_rgba(167,139,250,0.5)] scale-105 border border-purple-300'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:text-white'
            }`}
          >
            <Brush className="w-4 h-4 shrink-0" />
            <span>Pincel</span>
          </button>

          {/* Goma (#FF6B6B) */}
          <button
            type="button"
            onClick={() => handleToolClick('eraser')}
            title="Goma: borrar trazos sobre el lienzo blanco"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95 shrink-0 ${
              currentTool === 'eraser'
                ? 'bg-[#FF6B6B] text-white shadow-[0_0_15px_rgba(255,107,107,0.5)] scale-105 border border-rose-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4 shrink-0" />
            <span>Goma</span>
          </button>

          {/* Relleno (#4ADE80) */}
          <button
            type="button"
            onClick={() => handleToolClick('fill')}
            title="Cubo de pintura: rellenar áreas cerradas"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer min-h-[40px] active:scale-95 shrink-0 ${
              currentTool === 'fill'
                ? 'bg-[#4ADE80] text-slate-950 shadow-[0_0_15px_rgba(74,222,128,0.5)] scale-105 border border-emerald-300'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/70 hover:text-white'
            }`}
          >
            <PaintBucket className="w-4 h-4 shrink-0" />
            <span>Relleno</span>
          </button>
        </div>

        {/* 4. Action Buttons (Deshacer, Rehacer, Borrar Todo) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            title="Deshacer último trazo"
            aria-label="Deshacer"
            className="p-2 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 border border-slate-700/60 shadow-sm min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            title="Rehacer trazo"
            aria-label="Rehacer"
            className="p-2 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95 border border-slate-700/60 shadow-sm min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Borrar Todo Button */}
          <button
            type="button"
            onClick={onRequestClear}
            title="Borrar todo el lienzo"
            className="py-2 px-2.5 sm:px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 hover:text-rose-200 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-black shadow-sm min-h-[40px]"
          >
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">BORRAR TODO</span>
          </button>
        </div>
      </div>

      {/* ROW 2: Brush Sizes + Colour Palette Swatches */}
      <div className="flex items-center justify-between gap-2.5 w-full">
        {/* 2. Brush Sizes with visual dot preview */}
        <div className="flex items-center gap-1 sm:gap-2 px-2 py-1 bg-[#070b18] rounded-xl border border-slate-800/90 shadow-inner shrink-0">
          {BRUSH_SIZES.map(b => (
            <button
              key={b.size}
              type="button"
              onClick={() => {
                audio.playPinturilloToolSelect();
                onSelectSize(b.size);
              }}
              title={`Grosor: ${b.label} (${b.size}px)`}
              aria-label={`Grosor ${b.label}`}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                currentSize === b.size
                  ? 'bg-[#00BCEB]/20 border-2 border-[#00BCEB] shadow-[0_0_8px_rgba(0,188,235,0.3)]'
                  : 'hover:bg-slate-800 border border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <div
                className="rounded-full transition-transform"
                style={{
                  width: `${b.dotSize}px`,
                  height: `${b.dotSize}px`,
                  backgroundColor: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
                }}
              />
            </button>
          ))}
        </div>

        {/* 3. Colour Palette Swatches + Color Picker */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {PALETTE.map(c => {
            const isSelected = currentColor.toLowerCase() === c.hex.toLowerCase() && currentTool !== 'eraser';
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => handleColorClick(c.hex)}
                title={c.name}
                aria-label={c.name}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all cursor-pointer border shrink-0 ${
                  c.hex === '#ffffff' ? 'border-slate-400' : 'border-slate-800/80'
                } ${
                  isSelected
                    ? 'scale-125 ring-2 ring-[#00BCEB] ring-offset-2 ring-offset-[#0b1022] shadow-[0_0_10px_rgba(0,188,235,0.6)] z-10'
                    : 'hover:scale-115 opacity-90 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}

          {/* Custom spectrum color picker */}
          <label
            title="Elegir otro color"
            aria-label="Elegir otro color"
            className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#FF6B6B] via-[#4ADE80] to-[#38D9FF] border-2 border-slate-700 cursor-pointer flex items-center justify-center hover:scale-115 transition-transform overflow-hidden shadow-sm shrink-0"
          >
            <input
              type="color"
              value={currentColor}
              onChange={e => handleColorClick(e.target.value)}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
