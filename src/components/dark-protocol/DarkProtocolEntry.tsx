/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, RotateCcw, ArrowLeft, Skull, Shield, Monitor, Sparkles } from 'lucide-react';
import { loadTestSession, clearTestSession } from '../../data/darkProtocol/initialState';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface DarkProtocolEntryProps {
  onStartFresh: () => void;
  onResume: () => void;
  onBackToMenu: () => void;
}

export const DarkProtocolEntry: React.FC<DarkProtocolEntryProps> = ({
  onStartFresh,
  onResume,
  onBackToMenu,
}) => {
  const hasSavedSession = Boolean(loadTestSession());
  const [sessionExists, setSessionExists] = useState(hasSavedSession);

  const handleStartFresh = () => {
    darkProtocolAudio.resume();
    darkProtocolAudio.playSwitchClick();
    clearTestSession();
    onStartFresh();
  };

  const handleResume = () => {
    darkProtocolAudio.resume();
    darkProtocolAudio.playSwitchClick();
    onResume();
  };

  const handleResetSession = () => {
    darkProtocolAudio.playSwitchClick();
    clearTestSession();
    setSessionExists(false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#040209] text-slate-100 font-mono overflow-hidden selection:bg-purple-600 selection:text-white">
      {/* Dark industrial atmospheric overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(88,28,135,0.22),transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.02)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold transition-all backdrop-blur-md cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md">
            <Monitor className="w-3.5 h-3.5 text-purple-400" /> EXCLUSIVO PARA PC
          </span>
        </div>
      </header>

      {/* Hero content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full text-center py-8">
        {/* Sinister Entity Eye / Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-900 via-purple-950 to-slate-950 border border-purple-500/40 flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(168,85,247,0.35)] mb-6 animate-pulse">
          👁️
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-purple-100 to-purple-400 mb-3 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]">
          DARK PROTOCOL
        </h1>

        <div className="inline-block px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold text-xs tracking-widest uppercase mb-6">
          [ MODO DE PRUEBA ]
        </div>

        <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed mb-2 max-w-md font-sans">
          Juego cooperativo asimétrico de terror en 2D. Dos supervivientes intentan restablecer los sistemas de una instalación subterránea mientras el Ente sabotea los circuitos y se manifiesta en la oscuridad.
        </p>

        <p className="text-xs text-purple-400/80 mb-8 font-mono">
          Versión de prueba para 1 jugador &bull; Alterna libremente entre Explorador, Operador y Ente
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          {sessionExists && (
            <button
              type="button"
              onClick={handleResume}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(147,51,234,0.45)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>CONTINUAR PRUEBA GUARDADA</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartFresh}
            className={`w-full py-3.5 px-6 rounded-2xl active:scale-98 font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              sessionExists
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10'
                : 'bg-gradient-to-r from-purple-600 via-rose-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_35px_rgba(168,85,247,0.5)]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>INICIAR MODO DE PRUEBA</span>
          </button>

          {sessionExists && (
            <button
              type="button"
              onClick={handleResetSession}
              className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REINICIAR PRUEBA (Borrar sesión guardada)</span>
            </button>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 text-center text-xs text-slate-500 max-w-4xl mx-auto w-full pt-4 border-t border-white/5">
        Controles en teclado: <kbd className="px-1 py-0.5 bg-slate-900 rounded text-slate-300">A</kbd>/<kbd className="px-1 py-0.5 bg-slate-900 rounded text-slate-300">D</kbd> Mover &bull; <kbd className="px-1 py-0.5 bg-slate-900 rounded text-slate-300">E</kbd> Interactuar &bull; <kbd className="px-1 py-0.5 bg-slate-900 rounded text-slate-300">F</kbd> Linterna &bull; <kbd className="px-1 py-0.5 bg-slate-900 rounded text-slate-300">F1/F2/F3</kbd> Cambiar de Rol
      </footer>
    </div>
  );
};
