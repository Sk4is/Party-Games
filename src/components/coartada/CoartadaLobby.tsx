import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  Users,
  ArrowLeft,
  Copy,
  Check,
  Play,
  FileSearch,
  Shield,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import {
  CoartadaPlayer,
  CoartadaConfig,
  CoartadaDurationMinutes,
  CoartadaPrepSeconds,
  CoartadaRoleChoice,
} from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaLobbyProps {
  roomCode: string;
  players: CoartadaPlayer[];
  config: CoartadaConfig;
  isHost: boolean;
  currentPlayerId: string;
  onUpdateConfig: (config: Partial<CoartadaConfig>) => void;
  onClaimRole: (role: CoartadaRoleChoice) => void;
  onStartCase: () => void;
  onLeaveRoom: () => void;
}

const DURATION_OPTIONS: CoartadaDurationMinutes[] = [5, 7, 10, 12, 15];
const PREP_OPTIONS: { seconds: CoartadaPrepSeconds; label: string }[] = [
  { seconds: 30, label: '30 s' },
  { seconds: 60, label: '1 min' },
  { seconds: 90, label: '1 min 30 s' },
  { seconds: 120, label: '2 min' },
  { seconds: 150, label: '2 min 30 s' },
  { seconds: 180, label: '3 min' },
];

export const CoartadaLobby: React.FC<CoartadaLobbyProps> = ({
  roomCode,
  players,
  config,
  isHost,
  currentPlayerId,
  onUpdateConfig,
  onClaimRole,
  onStartCase,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      audio.playClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectDuration = (duration: CoartadaDurationMinutes) => {
    if (!isHost) return;
    audio.playClick();
    onUpdateConfig({ durationMinutes: duration });
  };

  const handleSelectPrep = (seconds: CoartadaPrepSeconds) => {
    if (!isHost) return;
    audio.playClick();
    onUpdateConfig({ prepSeconds: seconds });
  };

  const isReadyToStart = players.length === 2;
  const me = players.find((p) => p.id === currentPlayerId);
  const myRolePreference = me?.selectedRolePreference || 'ALEATORIO';

  return (
    <div className="relative z-10 w-full max-w-xl mx-auto p-4 sm:p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs font-mono font-bold border border-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Salir de la sala
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
          <FileSearch className="w-4 h-4 text-amber-500" />
          <span>COARTADA · DEDUCCIÓN 1v1</span>
        </div>
      </div>

      {/* Main Room Dossier Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#151210] border border-stone-800 shadow-2xl relative overflow-hidden">
        {/* Subtle retro stamp in corner */}
        <div className="absolute top-4 right-4 border-2 border-red-700/60 rounded px-2.5 py-0.5 text-[10px] font-mono font-black text-red-600/80 uppercase tracking-widest rotate-6 pointer-events-none select-none">
          CASO RESERVADO
        </div>

        {/* Title */}
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold block mb-1">
            DESPACHO DE INVESTIGACIÓN
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-serif text-stone-100 tracking-tight">
            SALA DE INVESTIGACIÓN
          </h2>
        </div>

        {/* Room Code Display */}
        <div className="mb-6 p-4 rounded-xl bg-stone-950/80 border border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-stone-500 block">
              CÓDIGO PARA EL SEGUNDO JUGADOR:
            </span>
            <div className="text-3xl font-mono font-black text-amber-300 tracking-widest">
              {roomCode}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-stone-700 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar código</span>
              </>
            )}
          </button>
        </div>

        {/* Players List with Assigned / Preferred Roles */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-2">
            <span className="font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> JUGADORES ({players.length}/2):
            </span>
            <span className={players.length === 2 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {players.length === 2 ? 'Sala completa' : 'Esperando segundo jugador...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {players.map((p) => {
              const pref = p.selectedRolePreference || 'ALEATORIO';
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-stone-200 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.avatar || '🕵️'}</span>
                    <div>
                      <span className="font-bold block truncate max-w-[120px]">{p.name}</span>
                      <span className="text-[10px] text-amber-400 font-semibold block">
                        {pref === 'DETECTIVE'
                          ? '🕵️ Detective'
                          : pref === 'SOSPECHOSO'
                          ? '💼 Sospechoso'
                          : '🎲 Aleatorio'}
                      </span>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                </div>
              );
            })}

            {players.length === 1 && (
              <div className="flex items-center justify-center p-3 rounded-xl border border-dashed border-stone-800 text-stone-500 text-xs font-mono animate-pulse">
                <span>Esperando rival...</span>
              </div>
            )}
          </div>
        </div>

        {/* ROLE SELECTION (Requirement 25, 26, 27) */}
        <div className="mb-6 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5 uppercase">
              <Shield className="w-3.5 h-3.5 text-amber-500" /> Selección de Rol:
            </span>
            <span className="text-[10px] font-mono text-stone-500">
              (Tu preferencia para el caso)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onClaimRole('DETECTIVE')}
              className={`p-2.5 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                myRolePreference === 'DETECTIVE'
                  ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800'
              }`}
            >
              <span className="text-base">🕵️</span>
              <span>DETECTIVE</span>
            </button>

            <button
              type="button"
              onClick={() => onClaimRole('SOSPECHOSO')}
              className={`p-2.5 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                myRolePreference === 'SOSPECHOSO'
                  ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800'
              }`}
            >
              <span className="text-base">💼</span>
              <span>SOSPECHOSO</span>
            </button>

            <button
              type="button"
              onClick={() => onClaimRole('ALEATORIO')}
              className={`p-2.5 rounded-xl font-mono text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                myRolePreference === 'ALEATORIO'
                  ? 'bg-amber-600 text-stone-950 border-amber-400 shadow-md shadow-amber-600/30'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-800'
              }`}
            >
              <span className="text-base">🎲</span>
              <span>ALEATORIO</span>
            </button>
          </div>
        </div>

        {/* SETTING 1: DURACIÓN DEL INTERROGATORIO */}
        <div className="mb-5 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5 uppercase">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Duración del interrogatorio:
            </span>
            {!isHost && (
              <span className="text-[10px] font-mono text-stone-500">
                (Configurado por el anfitrión)
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {DURATION_OPTIONS.map((dur) => {
              const isSelected = config.durationMinutes === dur;
              return (
                <button
                  key={dur}
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleSelectDuration(dur)}
                  className={`py-2 rounded-lg font-mono text-xs font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30 border border-amber-400'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800 cursor-pointer'
                  } ${!isHost ? 'cursor-default opacity-85' : ''}`}
                >
                  {dur} min
                </button>
              );
            })}
          </div>
        </div>

        {/* SETTING 2: TIEMPO DE LECTURA (Max 3 min, default 1:30) */}
        <div className="mb-6 pt-4 border-t border-stone-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-stone-300 flex items-center gap-1.5 uppercase">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Tiempo de lectura del expediente:
            </span>
            {!isHost && (
              <span className="text-[10px] font-mono text-stone-500">
                (Configurado por el anfitrión)
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {PREP_OPTIONS.map((opt) => {
              const isSelected = config.prepSeconds === opt.seconds;
              return (
                <button
                  key={opt.seconds}
                  type="button"
                  disabled={!isHost}
                  onClick={() => handleSelectPrep(opt.seconds)}
                  className={`py-2 px-1 rounded-lg font-mono text-xs font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-600/30 border border-amber-400'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800 cursor-pointer'
                  } ${!isHost ? 'cursor-default opacity-85' : ''}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-mono text-stone-500 block mt-2 text-center">
            Fase de preparación previa: el detective y el sospechoso estudian sus expedientes antes de interrogar.
          </span>
        </div>

        {/* Start Game Action */}
        <div className="pt-2">
          {isHost ? (
            <button
              type="button"
              disabled={!isReadyToStart}
              onClick={onStartCase}
              className={`w-full py-4 rounded-xl font-mono text-sm font-black uppercase tracking-wider transition-all transform active:scale-98 shadow-xl flex items-center justify-center gap-2 ${
                isReadyToStart
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 cursor-pointer shadow-amber-600/30'
                  : 'bg-stone-850 text-stone-500 cursor-not-allowed border border-stone-800'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isReadyToStart ? 'INICIAR CASO' : 'SE NECESITAN 2 JUGADORES'}</span>
            </button>
          ) : (
            <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl text-center text-xs font-mono text-stone-400">
              Esperando a que el anfitrión inicie el caso...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
