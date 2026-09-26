import React, { useEffect } from 'react';
import { CodigoRojoRoomState } from '../../types/codigoRojo';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Home } from 'lucide-react';
import { audio } from '../../utils/audio';

interface MissionResultModalProps {
  roomState: CodigoRojoRoomState;
  isHost: boolean;
  onNextMission: () => void;
  onRestartMatch: () => void;
  onBackToMenu: () => void;
  onSelectOperator?: (playerId: string) => void;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  roomState,
  isHost,
  onNextMission,
  onRestartMatch,
  onBackToMenu,
  onSelectOperator,
}) => {
  const { phase, missionNumber, stats, strikes, maxStrikes, players, endMessage } = roomState;
  const isSuccess = phase === 'MISSION_SUCCESS';

  useEffect(() => {
    if (isSuccess) {
      audio.playVictoryFanfare();
      const timer = setTimeout(() => audio.playStampImpact(), 380);
      return () => clearTimeout(timer);
    } else {
      audio.playDefeatExplosion();
      const timer = setTimeout(() => audio.playStampImpact(), 420);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  const solvedModulesCount = roomState.modules.filter((m) => m.solved).length;
  const totalModulesCount = roomState.modules.length;

  // Identify current assigned operator (manual selection)
  const connected = players.filter((p) => p.isConnected);
  const currentOp =
    connected.find((p) => p.role === 'OPERADOR') ||
    connected.find((p) => p.id === roomState.operatorId) ||
    connected[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 shadow-2xl flex flex-col items-center text-center relative overflow-hidden ${
          isSuccess
            ? 'bg-slate-900 border-emerald-500 shadow-emerald-500/20'
            : 'bg-slate-900 border-red-500 shadow-red-500/20'
        }`}
      >
        {/* Physical Simulated Corner Screws */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono -rotate-45 pointer-events-none select-none">
          +
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono rotate-45 pointer-events-none select-none">
          +
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono rotate-12 pointer-events-none select-none">
          +
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono -rotate-30 pointer-events-none select-none">
          +
        </div>

        {/* Tactical Rubber Stamped Badge */}
        <div
          className={`animate-cr-stamp border-4 font-mono font-black text-xs sm:text-sm tracking-widest px-3.5 py-1 rounded-lg uppercase select-none shadow-lg mb-4 ${
            isSuccess
              ? 'border-emerald-500/90 text-emerald-400 bg-emerald-950/40 rotate-[-6deg]'
              : 'border-red-600/90 text-red-400 bg-red-950/40 rotate-[-8deg]'
          }`}
        >
          {isSuccess
            ? '✓ SISTEMA NEUTRALIZADO'
            : '✖ FALLO CRÍTICO // DETONACIÓN'}
        </div>

        {/* Result Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-xl ${
            isSuccess
              ? 'bg-emerald-500/20 border border-emerald-400'
              : 'bg-red-500/20 border border-red-400'
          }`}
        >
          {isSuccess ? '🏆' : '💥'}
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white mb-1">
          {isSuccess ? '¡MISIÓN CUMPLIDA!' : '¡MISIÓN FALLIDA!'}
        </h2>
        <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-slate-400 mb-5">
          MISIÓN {missionNumber} • {isSuccess ? 'MÁQUINA COMPLETAMENTE DESACTIVADA' : 'COLAPSO DEL SISTEMA'}
        </p>

        {endMessage && !isSuccess && (
          <div className="w-full p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-300 text-xs font-mono font-bold mb-5 shadow-inner">
            CAUSA: {endMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-6 font-mono text-center">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">DURACIÓN</span>
            <span className="text-base sm:text-lg font-bold text-white">
              {formatSecs(stats.missionDurationSeconds || 0)}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">MÓDULOS</span>
            <span
              className={`text-base sm:text-lg font-bold ${
                isSuccess ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {solvedModulesCount}/{totalModulesCount}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">STRIKES</span>
            <span
              className={`text-base sm:text-lg font-bold ${
                strikes > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {strikes} / {maxStrikes}
            </span>
          </div>
        </div>

        {/* Role Assignment / Operator Selection for Next Mission */}
        {connected.length > 0 && (
          <div className="w-full p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col gap-2.5 mb-6 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">
                ROLES PRÓXIMA MISIÓN (1 OPERADOR + {Math.max(0, connected.length - 1)} {connected.length - 1 === 1 ? 'GUÍA' : 'GUÍAS'}):
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                Pulsa para asignar Operador
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {connected.map((p) => {
                const isOp = currentOp?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectOperator && onSelectOperator(p.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isOp
                        ? 'bg-red-950/50 border-red-500/70 text-white shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{p.avatar}</span>
                      <span className="text-xs font-bold truncate">{p.name}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase shrink-0 ${
                        isOp
                          ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isOp ? '🎛️ OPERADOR' : '📖 GUÍA'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {isHost ? (
            <>
              <button
                type="button"
                onClick={onNextMission}
                className="flex-1 py-3.5 px-4 bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl text-white font-black text-sm tracking-wider uppercase transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isSuccess ? 'SIGUIENTE MISIÓN' : 'REINTENTAR MISIÓN'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onRestartMatch}
                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl text-slate-300 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Sala
              </button>
            </>
          ) : (
            <div className="w-full py-3 bg-slate-800/80 rounded-xl text-slate-400 text-xs font-mono">
              Esperando a que el anfitrión inicie la siguiente misión...
            </div>
          )}

          <button
            type="button"
            onClick={onBackToMenu}
            className="py-3.5 px-4 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-800"
          >
            <Home className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>
    </div>
  );
};
