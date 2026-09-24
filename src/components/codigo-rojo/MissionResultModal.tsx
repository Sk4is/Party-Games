import React from 'react';
import { CodigoRojoRoomState } from '../../types/codigoRojo';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Home } from 'lucide-react';

interface MissionResultModalProps {
  roomState: CodigoRojoRoomState;
  isHost: boolean;
  onNextMission: () => void;
  onRestartMatch: () => void;
  onBackToMenu: () => void;
}

export const MissionResultModal: React.FC<MissionResultModalProps> = ({
  roomState,
  isHost,
  onNextMission,
  onRestartMatch,
  onBackToMenu,
}) => {
  const { phase, missionNumber, stats, strikes, maxStrikes, players, endMessage } = roomState;
  const isSuccess = phase === 'MISSION_SUCCESS';

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}m ${secs}s`;
  };

  // Identify who the next operator will be based on operator rotation
  const connected = players.filter((p) => p.isConnected);
  const nextOp = connected.find((p) => p.id !== roomState.operatorId) || connected[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 shadow-2xl flex flex-col items-center text-center ${
          isSuccess
            ? 'bg-slate-900 border-emerald-500 shadow-emerald-500/20'
            : 'bg-slate-900 border-red-500 shadow-red-500/20'
        }`}
      >
        {/* Result Icon */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-xl ${
            isSuccess ? 'bg-emerald-500/20 border border-emerald-400' : 'bg-red-500/20 border border-red-400'
          }`}
        >
          {isSuccess ? '🏆' : '💥'}
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white mb-1">
          {isSuccess ? '¡MISIÓN CUMPLIDA!' : '¡FALLO CRÍTICO!'}
        </h2>
        <p className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-6">
          MISIÓN {missionNumber} &bull; {isSuccess ? 'MÁQUINA NEUTRALIZADA' : 'COLAPSO DEL SISTEMA'}
        </p>

        {endMessage && !isSuccess && (
          <div className="w-full p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs font-mono font-bold mb-6">
            CAUSA: {endMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">DURACIÓN</span>
            <span className="text-lg font-bold text-white">
              {formatSecs(stats.missionDurationSeconds || 0)}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">STRIKES</span>
            <span
              className={`text-lg font-bold ${
                strikes > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {strikes} / {maxStrikes}
            </span>
          </div>
        </div>

        {/* Next Operator Preview */}
        {nextOp && (
          <div className="w-full p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-between mb-6">
            <div className="text-left">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                PRÓXIMO OPERADOR (ROTACIÓN):
              </span>
              <span className="text-sm font-bold text-slate-200">
                {nextOp.avatar} {nextOp.name}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-black uppercase rounded-full">
              EN TURNO
            </span>
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
