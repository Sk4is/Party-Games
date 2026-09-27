import React, { useState } from 'react';
import { X, Check, Shuffle, Sparkles, User, Palette } from 'lucide-react';
import {
  MolePortrait,
  MOLE_HATS,
  MOLE_FACES,
  MOLE_CLOTHES,
  MOLE_COLORS,
  DEFAULT_MOLE_CUSTOMIZATION,
} from './MolePortrait';
import { MoleCustomization } from '../../types/entreTopos';
import { audio } from '../../utils/audio';

interface MoleCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onSave: (customization: MoleCustomization, newName: string) => void;
  initialCustomization?: MoleCustomization;
}

export const MoleCustomizerModal: React.FC<MoleCustomizerModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onSave,
  initialCustomization = DEFAULT_MOLE_CUSTOMIZATION,
}) => {
  const [name, setName] = useState(playerName);
  const [customization, setCustomization] = useState<MoleCustomization>(initialCustomization);
  const [activeTab, setActiveTab] = useState<'hat' | 'face' | 'clothing' | 'color'>('hat');

  if (!isOpen) return null;

  const handleRandomize = () => {
    audio.playTurnChange();
    const randomHat = MOLE_HATS[Math.floor(Math.random() * MOLE_HATS.length)].id;
    const randomFace = MOLE_FACES[Math.floor(Math.random() * MOLE_FACES.length)].id;
    const randomCloth = MOLE_CLOTHES[Math.floor(Math.random() * MOLE_CLOTHES.length)].id;
    const randomColor = MOLE_COLORS[Math.floor(Math.random() * MOLE_COLORS.length)].id;

    setCustomization({
      hat: randomHat,
      face: randomFace,
      clothing: randomCloth,
      color: randomColor,
    });
  };

  const handleSave = () => {
    audio.playAnswerAccepted();
    onSave(customization, name.trim() || 'Sospechoso');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1e1b18] border-4 border-[#2b241e] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* TOP BAR / HEADER */}
        <div className="px-5 py-4 bg-[#2b241e] border-b-2 border-[#3d3229] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🕵️</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wide font-display">
                PERSONALIZAR MI TOPO
              </h2>
              <p className="text-xs text-amber-400/80 font-medium">
                Crea tu ficha policial de sospechoso antes de infiltrarte
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY: PREVIEW + CONTROLS */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* LEFT: MOLE PASSPORT / SUSPECT CARD */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-[210px] p-4 bg-[#fbf6ea] border-4 border-[#1c1917] rounded-2xl shadow-xl flex flex-col items-center rotate-[-1.5deg]">
              {/* Top Pin / Paperclip */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-4 bg-amber-600 rounded-full border-2 border-black" />
              <div className="text-[10px] uppercase font-black tracking-widest text-[#78523a] mb-1 font-mono">
                FICHA POLICIAL Nº 404
              </div>

              {/* The Mole Avatar */}
              <div className="w-36 h-36 relative my-1">
                <MolePortrait customization={customization} size="lg" />
              </div>

              {/* Name Tag */}
              <div className="w-full mt-2 pt-2 border-t-2 border-dashed border-[#8d6e63]/40 text-center">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 16))}
                  placeholder="Tu alias..."
                  className="w-full text-center font-black text-slate-900 bg-transparent border-b-2 border-slate-400 focus:border-amber-600 focus:outline-none text-base tracking-wide uppercase"
                />
                <span className="text-[9px] text-[#78523a] font-bold uppercase mt-0.5 block">
                  SOSPECHOSO PRINCIPAL
                </span>
              </div>
            </div>

            {/* Randomize button */}
            <button
              type="button"
              onClick={handleRandomize}
              className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Aleatorio loco</span>
            </button>
          </div>

          {/* RIGHT: TABS & ITEMS PICKER */}
          <div className="sm:col-span-7 flex flex-col h-full">
            {/* Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('hat')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'hat'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sombrero
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('face')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'face'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cara
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('clothing')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'clothing'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ropa
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('color')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'color'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Piel
              </button>
            </div>

            {/* Tab content options list */}
            <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 grid grid-cols-2 gap-2">
              {activeTab === 'hat' &&
                MOLE_HATS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audio.playTurnChange();
                      setCustomization((prev) => ({ ...prev, hat: item.id }));
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      customization.hat === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-black/20 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      <MolePortrait
                        size="xs"
                        customization={{ ...customization, hat: item.id }}
                        showShadow={false}
                      />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}

              {activeTab === 'face' &&
                MOLE_FACES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audio.playTurnChange();
                      setCustomization((prev) => ({ ...prev, face: item.id }));
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      customization.face === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-black/20 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      <MolePortrait
                        size="xs"
                        customization={{ ...customization, face: item.id }}
                        showShadow={false}
                      />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}

              {activeTab === 'clothing' &&
                MOLE_CLOTHES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audio.playTurnChange();
                      setCustomization((prev) => ({ ...prev, clothing: item.id }));
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      customization.clothing === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-black/20 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      <MolePortrait
                        size="xs"
                        customization={{ ...customization, clothing: item.id }}
                        showShadow={false}
                      />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}

              {activeTab === 'color' &&
                MOLE_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      audio.playTurnChange();
                      setCustomization((prev) => ({ ...prev, color: col.id }));
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      customization.color === col.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-black/20 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-black/80 shrink-0"
                      style={{ backgroundColor: col.id }}
                    />
                    <span className="truncate">{col.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="px-6 py-4 bg-[#2b241e] border-t-2 border-[#3d3229] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar mi Topo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
