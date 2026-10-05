/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  X,
} from 'lucide-react';
import { SurvivorCharacter } from '../../types/darkProtocol';
import { SURVIVOR_CHARACTERS } from '../../data/darkProtocol/characters';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface CharacterSelectModalProps {
  initialCharacterId?: string;
  onSelectCharacter: (charId: string) => void;
  onCancel: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  initialCharacterId = 'mara_velasco',
  onSelectCharacter,
  onCancel,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const idx = SURVIVOR_CHARACTERS.findIndex((c) => c.id === initialCharacterId);
    return idx >= 0 ? idx : 0;
  });

  const currentChar = SURVIVOR_CHARACTERS[selectedIdx];

  const handlePrev = () => {
    darkProtocolAudio.playSwitchClick();
    setSelectedIdx((prev) => (prev > 0 ? prev - 1 : SURVIVOR_CHARACTERS.length - 1));
  };

  const handleNext = () => {
    darkProtocolAudio.playSwitchClick();
    setSelectedIdx((prev) => (prev < SURVIVOR_CHARACTERS.length - 1 ? prev + 1 : 0));
  };

  const handleConfirm = () => {
    darkProtocolAudio.playSwitchClick();
    onSelectCharacter(currentChar.id);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePrev();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleNext();
      } else if (e.key === 'Enter') {
        handleConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, currentChar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-5 font-mono text-slate-100 select-none">
      {/* Heavy Industrial Dossier Frame */}
      <div className="relative w-full max-w-4xl bg-[#080c14] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_90px_rgba(6,182,212,0.18)] max-h-[92vh] overflow-hidden">
        {/* Metal Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>

        {/* Top Header: Security Personnel Archive */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <FolderOpen className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                <span>ARCHIVO DE PERSONAL // PROTOCOLO DE INCIDENCIAS</span>
                <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                  CONFIDENCIAL
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Selecciona el expediente del superviviente asignado a la incursión
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 uppercase font-bold hidden sm:inline">
              EXPEDIENTE {selectedIdx + 1} / {SURVIVOR_CHARACTERS.length}
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#475569] transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Character Dossier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto flex-1 pr-1">
          {/* Left Column: Portrait & Visual Silhouette (col-span-5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-[#04070d] border-2 border-[#1e293b] p-5 text-center">
            {/* Carousel navigation buttons */}
            <div className="w-full flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                title="Superviviente anterior [A o Flecha Izq]"
              >
                &larr; ANT
              </button>

              <div className="flex gap-1.5">
                {SURVIVOR_CHARACTERS.map((c, i) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      darkProtocolAudio.playSwitchClick();
                      setSelectedIdx(i);
                    }}
                    className={`w-3 h-3 border cursor-pointer transition-all ${
                      i === selectedIdx
                        ? 'bg-cyan-400 border-white shadow-[0_0_8px_#22d3ee]'
                        : 'bg-[#1e293b] border-[#334155] hover:bg-[#475569]'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="px-2.5 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                title="Superviviente siguiente [D o Flecha Der]"
              >
                SIG &rarr;
              </button>
            </div>

            {/* Silhouette Display Container */}
            <div className="relative w-full aspect-square max-w-[220px] bg-[#020408] border-2 border-cyan-500/30 flex flex-col items-center justify-center p-4 overflow-hidden my-2 shadow-inner">
              {/* Raster Scanline Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />

              {/* Character Emoticon / Silhouette */}
              <div className="text-6xl mb-2 filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse">
                {currentChar.portraitIcon}
              </div>

              {/* Pixel Color Swatches of uniform */}
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-4 h-4 border border-white/20"
                  style={{ backgroundColor: currentChar.primaryColor }}
                  title="Uniforme primario"
                />
                <div
                  className="w-4 h-4 border border-white/20"
                  style={{ backgroundColor: currentChar.secondaryColor }}
                  title="Detalle táctico"
                />
              </div>

              <div
                className="mt-3 text-xs font-black tracking-widest text-cyan-300 uppercase"
                style={{ fontFamily: "'Silkscreen', monospace" }}
              >
                {currentChar.name}
              </div>
            </div>

            {/* Security ID Tag */}
            <div className="w-full bg-[#0a0f18] border border-[#1e293b] p-2 text-center text-[10px] text-slate-400 mt-2">
              IDENTIFICADOR CLASIFICADO: <span className="text-white font-mono font-bold">FAM-{currentChar.id.toUpperCase().slice(0, 8)}</span>
            </div>
          </div>

          {/* Right Column: Personnel File & Bio (col-span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              {/* File Identification Header */}
              <div className="border-b-2 border-[#1e293b] pb-2 mb-3">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-lg font-black text-white tracking-wider"
                    style={{ fontFamily: "'Silkscreen', monospace" }}
                  >
                    {currentChar.name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/40 uppercase font-black">
                    {currentChar.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 italic">
                  &ldquo;{currentChar.quote}&rdquo;
                </div>
              </div>

              {/* Special Ability Card */}
              <div className="p-3 bg-[#03060a] border-2 border-cyan-500/30 mb-3">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                  <Zap className="w-4 h-4" />
                  <span>HABILIDAD: {currentChar.passiveTitle.toUpperCase()}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentChar.passiveDesc}
                </p>
              </div>

              {/* Biometric Performance Ratings */}
              <div className="space-y-2 bg-[#03060a] border-2 border-[#1e293b] p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between border-b border-[#1e293b] pb-1">
                  <span>MÉTRICAS BIOMÉTRICAS DE RENDIMIENTO</span>
                  <span className="text-[9px] text-cyan-400">ESCALA /5</span>
                </div>

                {/* Velocidad */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Velocidad y respuesta de carrera</span>
                    <span className="text-cyan-400 font-mono font-bold">{currentChar.stats.speed}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-2.5 flex-1 border ${
                          lvl <= currentChar.stats.speed
                            ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_6px_#22d3ee]'
                            : 'bg-[#151c28] border-[#1e293b]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resistencia */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Resistencia física y tolerancia</span>
                    <span className="text-emerald-400 font-mono font-bold">{currentChar.stats.stamina}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-2.5 flex-1 border ${
                          lvl <= currentChar.stats.stamina
                            ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_6px_#34d399]'
                            : 'bg-[#151c28] border-[#1e293b]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sigilo */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Sigilo acústico y ocultamiento</span>
                    <span className="text-amber-400 font-mono font-bold">{currentChar.stats.stealth}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-2.5 flex-1 border ${
                          lvl <= currentChar.stats.stealth
                            ? 'bg-amber-400 border-amber-300 shadow-[0_0_6px_#fbbf24]'
                            : 'bg-[#151c28] border-[#1e293b]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Velocidad de Reparación */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-bold">Velocidad en consolas y reparaciones</span>
                    <span className="text-purple-400 font-mono font-bold">{currentChar.stats.repairSpeed}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-2.5 flex-1 border ${
                          lvl <= currentChar.stats.repairSpeed
                            ? 'bg-purple-400 border-purple-300 shadow-[0_0_6px_#c084fc]'
                            : 'bg-[#151c28] border-[#1e293b]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#1e293b]">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                CANCELAR [ESC]
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 border-b-4 border-cyan-800 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer active:translate-y-0.5"
              >
                <span>ASIGNAR EXPEDIENTE [ENTER]</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
