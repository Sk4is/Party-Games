/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020106]/90 backdrop-blur-md p-4 sm:p-6 font-mono text-slate-100 select-none">
      {/* Subtle CRT raster lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090b14] border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden max-h-[92vh]">
        {/* Top Header: Security Personnel Archive */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#04060c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                <span>ARCHIVO DE PERSONAL // PROTOCOLO DE INCIDENCIAS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20">
                  CONFIDENCIAL
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Selecciona el expediente del superviviente asignado a la incursión
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            EXPEDIENTE {selectedIdx + 1} / {SURVIVOR_CHARACTERS.length}
          </div>
        </div>

        {/* Main Content Area: Character Dossier */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto flex-1">
          {/* Left Column: Portrait & Silhouette (col-span-5) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-[#04060c] border border-white/5 rounded-xl p-6 text-center">
            {/* Carousel navigation buttons */}
            <div className="w-full flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1.5">
                {SURVIVOR_CHARACTERS.map((c, i) => (
                  <div
                    key={c.id}
                    className={`w-2.5 h-1.5 rounded-full transition-all ${
                      i === selectedIdx
                        ? 'w-6 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Character Silhouette / Icon Frame */}
            <div
              className="relative w-44 h-44 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-2xl mb-4"
              style={{
                backgroundColor: `${currentChar.secondaryColor}40`,
                borderColor: currentChar.primaryColor,
                boxShadow: `0 0 35px ${currentChar.primaryColor}25`,
              }}
            >
              <div className="text-7xl filter drop-shadow-lg select-none">
                {currentChar.portraitIcon}
              </div>

              {/* ID Stamp Badge */}
              <div
                className="absolute bottom-2 inset-x-3 py-1 rounded bg-black/80 border text-[9px] font-bold tracking-widest uppercase"
                style={{ borderColor: `${currentChar.primaryColor}60`, color: currentChar.primaryColor }}
              >
                {currentChar.role}
              </div>
            </div>

            {/* Character Name & Title */}
            <h2 className="text-xl font-black text-white tracking-wide mb-1">
              {currentChar.name.toUpperCase()}
            </h2>
            <div className="text-xs text-cyan-400 font-bold mb-3">
              {currentChar.title}
            </div>

            {/* Quote */}
            <blockquote className="text-[11px] text-slate-400 italic px-2 border-l-2 border-cyan-500/40 font-sans leading-relaxed">
              &ldquo;{currentChar.quote}&rdquo;
            </blockquote>
          </div>

          {/* Right Column: Traits, Abilities & Stats (col-span-7) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Traits & Abilities Box */}
            <div className="space-y-3 bg-[#04060c] border border-white/5 rounded-xl p-4">
              {/* Passive */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>HABILIDAD PASIVA: {currentChar.passiveTitle.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug font-sans">
                  {currentChar.passiveDesc}
                </p>
              </div>

              {/* Strength */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>VENTAJA TÁCTICA: {currentChar.strengthTitle.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-snug font-sans">
                  {currentChar.strengthDesc}
                </p>
              </div>

              {/* Weakness */}
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>DESVENTAJA / RESTRICCIÓN: {currentChar.weaknessTitle.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-snug font-sans">
                  {currentChar.weaknessDesc}
                </p>
              </div>
            </div>

            {/* Performance Parameters / Stats Bars */}
            <div className="bg-[#04060c] border border-white/5 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                EVALUACIÓN DE APTITUD OPERATIVA
              </div>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>VELOCIDAD DE DESPLAZAMIENTO</span>
                  <span className="font-bold text-cyan-400">{currentChar.stats.speed}%</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded transition-all duration-300"
                    style={{ width: `${currentChar.stats.speed}%` }}
                  />
                </div>
              </div>

              {/* Repair Speed */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>EFICACIA EN REPARACIÓN TÉCNICA</span>
                  <span className="font-bold text-amber-400">{currentChar.stats.repairSpeed}%</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded transition-all duration-300"
                    style={{ width: `${currentChar.stats.repairSpeed}%` }}
                  />
                </div>
              </div>

              {/* Stealth */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>SIGILO Y DISCRECIÓN ACÚSTICA</span>
                  <span className="font-bold text-emerald-400">{currentChar.stats.stealth}%</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded transition-all duration-300"
                    style={{ width: `${currentChar.stats.stealth}%` }}
                  />
                </div>
              </div>

              {/* Stamina */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>RESISTENCIA BAJO PRESIÓN</span>
                  <span className="font-bold text-purple-400">{currentChar.stats.stamina}%</span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded transition-all duration-300"
                    style={{ width: `${currentChar.stats.stamina}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Confirm or Cancel */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-[#04060c]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            VOLVER AL MENÚ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>CONFIRMAR EXPEDIENTE Y ENTRAR</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
