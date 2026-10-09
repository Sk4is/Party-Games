import React from 'react';
import { ElPrecioJustoRoomState } from '../../types/elPrecioJusto';
import { Coins, Lock, Award, Users, RotateCcw, LogOut, Eye, BookOpen, ShieldCheck } from 'lucide-react';

interface ElPrecioJustoPlaceholderProps {
  roomState: ElPrecioJustoRoomState;
  myPlayerId: string;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
}

export const ElPrecioJustoPlaceholder: React.FC<ElPrecioJustoPlaceholderProps> = ({
  roomState,
  myPlayerId,
  onReturnToLobby,
  onLeaveRoom,
}) => {
  const isHost = roomState.hostId === myPlayerId;
  const myPlayerState = roomState.players.find((p) => p.id === myPlayerId);

  // Format currency in Spanish Spain locale
  const formatMoney = (val?: number) => {
    if (val === undefined) return '•••••• €';
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col gap-6 p-4 sm:p-6 text-slate-100">
      {/* Luxury Bank Ledger HUD */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#03241b]/95 border-2 border-[#10B981]/50 shadow-[0_0_35px_rgba(16,185,129,0.22)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#F59E0B] flex items-center justify-center text-2xl shadow-lg shadow-[#10B981]/30">
            💰
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] via-[#FBBF24] to-[#F59E0B] font-display">
              EL PRECIO JUSTO
            </h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200/80">
              <span>SALA: <strong className="text-amber-400 font-mono tracking-widest">{roomState.code}</strong></span>
              <span>•</span>
              <span>RONDA #{roomState.currentRound}</span>
              <span>•</span>
              <span>MÁXIMO: {formatMoney(roomState.config.maxMoneyAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={onReturnToLobby}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Volver a la sala</span>
            </button>
          )}
          <button
            onClick={onLeaveRoom}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Abandonar</span>
          </button>
        </div>
      </div>

      {/* Architecture Phase 1 Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-amber-950/60 border border-emerald-500/30 text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
              FASE 1: ARQUITECTURA MULTIJUGADOR VERIFICADA
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              El aislamiento autoritario de importes privados (ningún cliente recibe el dinero ajeno), la sincronización libre de turnos y la generación por órdenes de magnitud (múltiplos de 5, 50, 500, 5.000 y 50.000 €) están activos en el servidor.
            </p>
          </div>
        </div>
      </div>

      {/* Confidential Ledger Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Private Money Vault Card */}
        <div className="lg:col-span-2 flex flex-col gap-5 p-6 rounded-3xl bg-[#021b14]/95 border-2 border-[#10B981]/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Tu libreta confidencial secreta</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DATO AISLADO EN SERVIDOR</span>
            </span>
          </div>

          {/* Player Private Fortune Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-black/60 to-[#022c22]/50 border-2 border-amber-500/30 shadow-inner flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
              💎
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold block mb-1">
                Importe privado asignado a tu patrimonio
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 tabular-nums">
                {formatMoney(myPlayerState?.privateMoneyAmount)}
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Solo tú puedes ver esta cifra. Los demás jugadores solo ven que estás investigando, sin conocer tu importe.
            </p>
          </div>

          {/* Investigation Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Turno de palabra libre
              </span>
              <p className="text-slate-400">
                Sin orden forzado. Podéis interrogaros libremente haciéndoos preguntas cruzadas sobre vuestras fortunas.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> Sin prisa de reloj
              </span>
              <p className="text-slate-400">
                La investigación continúa a vuestro ritmo hasta que el anfitrión avance a la estimación final.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Connected Investors */}
        <div className="flex flex-col gap-4 p-5 rounded-3xl bg-[#03241b]/95 border border-emerald-500/30 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300 uppercase tracking-wider border-b border-emerald-500/20 pb-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Inversores en mesa ({roomState.players.length})</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {roomState.players.map((p) => {
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isMe
                      ? 'bg-emerald-500/20 border-amber-400 shadow-sm'
                      : 'bg-black/40 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isMe && <span className="text-xs text-amber-400">(Tú)</span>}
                        {p.isHost && <span className="text-yellow-400 text-xs">👑</span>}
                      </div>
                      <span className="text-xs text-slate-400">
                        {isMe ? 'Importe secreto visible' : 'Importe secreto oculto'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-amber-300/80">
                    {isMe ? 'PROTEGIDO' : 'CONFIDENCIAL'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
