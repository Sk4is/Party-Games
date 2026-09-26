import React, { useState } from 'react';
import { CodigoRojoConfig, CodigoRojoDifficulty, CodigoRojoTimeMode } from '../../types/codigoRojo';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { PlayerProfileSetup, PlayerProfile } from '../lobby/PlayerProfileSetup';
import { RoomModeSelector, RoomMode } from '../lobby/RoomModeSelector';
import { JoinRoomPanel } from '../lobby/JoinRoomPanel';
import { CreateRoomPanel } from '../lobby/CreateRoomPanel';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';
import { audio } from '../../utils/audio';
import { ShieldAlert, Gauge, Clock } from 'lucide-react';

interface CodigoRojoEntryProps {
  initialRoomCode?: string;
  initialName?: string;
  initialAvatar?: string;
  initialColor?: string;
  onCreateRoom: (
    player: { id: string; name: string; avatar: string; color: string },
    config?: Partial<CodigoRojoConfig>
  ) => void;
  onJoinRoom: (
    code: string,
    player: { id: string; name: string; avatar: string; color: string }
  ) => void;
  onBackToMenu: () => void;
  errorMessage?: string | null;
}

export const CodigoRojoEntry: React.FC<CodigoRojoEntryProps> = ({
  initialRoomCode = '',
  initialName,
  initialAvatar,
  initialColor,
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
  errorMessage,
}) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: initialName || saved.name || 'Agente',
      avatar: initialAvatar || saved.avatar || '🦊',
      color: initialColor || saved.color || '#ef4444',
    };
  });

  const [mode, setMode] = useState<RoomMode>(initialRoomCode ? 'join' : 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration for room creation
  const [difficulty, setDifficulty] = useState<CodigoRojoDifficulty>('NORMAL');
  const [modulesCount, setModulesCount] = useState<number>(3);
  const [durationSeconds, setDurationSeconds] = useState<number>(270); // Default: 4:30 (270 seconds)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  const getRecommendedSeconds = (diff: CodigoRojoDifficulty, count: number): number => {
    if (diff === 'NORMAL') return count === 2 ? 210 : 270; // 3:30 or 4:30
    if (diff === 'DIFICIL') return count === 4 ? 360 : 450; // 6:00 or 7:30
    return count === 5 ? 450 : 480; // 7:30 or 8:00
  };

  const handleDifficultyChange = (d: CodigoRojoDifficulty) => {
    setDifficulty(d);
    const newCount = d === 'NORMAL' ? 3 : d === 'DIFICIL' ? 4 : 5;
    setModulesCount(newCount);
    if (!isCustomMode) {
      setDurationSeconds(getRecommendedSeconds(d, newCount));
    }
  };

  const handleModuleCountChange = (count: number) => {
    setModulesCount(count);
    if (!isCustomMode) {
      setDurationSeconds(getRecommendedSeconds(difficulty, count));
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getAvailableModuleCounts = (diff: CodigoRojoDifficulty): number[] => {
    if (diff === 'NORMAL') return [2, 3];
    if (diff === 'DIFICIL') return [4, 5];
    return [5, 6];
  };

  const handleUpdateProfile = (updated: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
      return next;
    });
  };

  const handleCreateRoom = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    audio.playClick();
    try {
      onCreateRoom(profile, {
        difficulty,
        timeMode: 'CUSTOM',
        customTimeMinutes: durationSeconds / 60,
        durationSeconds,
        modulesCount,
        maxStrikes: 3,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    audio.playClick();
    try {
      onJoinRoom(code, profile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GameLobbyLayout
      title="CÓDIGO ROJO"
      description="Juego cooperativo asimétrico de comunicación bajo presión."
      icon="🚨"
      minPlayers={2}
      maxPlayers={6}
      onBack={onBackToMenu}
      backLabel="Menú Principal"
    >
      <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-500 text-red-200 text-sm font-bold flex items-center gap-3 animate-shake">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Player Profile Setup */}
        <PlayerProfileSetup
          profile={profile}
          onChange={handleUpdateProfile}
          onUpdate={handleUpdateProfile}
          accentColor="#ef4444"
        />

        {/* Mode Selector: Create or Join */}
        <RoomModeSelector
          mode={mode}
          onChange={(m) => {
            audio.playClick();
            setMode(m);
          }}
          accentColor="#ef4444"
          gameType="codigo-rojo"
        />

        {/* Create Room View */}
        {mode === 'create' && (
          <div className="flex flex-col gap-4">
            {/* Mission Settings Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                <Gauge className="w-4 h-4" /> Configuración de la Misión
              </div>

              {/* Difficulty selector */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2 font-bold">
                  DIFICULTAD:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMAL', 'DIFICIL', 'EXTREMO'] as CodigoRojoDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleDifficultyChange(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all ${
                        difficulty === d
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-400 font-mono mt-2 leading-relaxed">
                  {difficulty === 'NORMAL' ? (
                    <>
                      <span>2 o 3 módulos</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Desafío equilibrado</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Recomendado para empezar</span>
                    </>
                  ) : difficulty === 'DIFICIL' ? (
                    <>
                      <span>4 o 5 módulos</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Lógica avanzada</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Mayor presión</span>
                    </>
                  ) : (
                    <>
                      <span>5 o 6 módulos</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Máxima tensión</span>
                      <span aria-hidden="true" className="text-slate-600 font-bold">•</span>
                      <span>Sin margen de error</span>
                    </>
                  )}
                </div>
              </div>

              {/* Module Count Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400 font-bold">
                    NÚMERO DE MÓDULOS:
                  </label>
                  <span className="text-xs font-mono font-bold text-red-400">
                    {modulesCount} {modulesCount === 1 ? 'módulo' : 'módulos'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {getAvailableModuleCounts(difficulty).map((count) => {
                    const isSelected = modulesCount === count;
                    const isRec =
                      (difficulty === 'NORMAL' && count === 3) ||
                      (difficulty === 'DIFICIL' && count === 4) ||
                      (difficulty === 'EXTREMO' && count === 5);
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleModuleCountChange(count)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{count} módulos</span>
                        {isRec && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-sans uppercase font-black ${
                              isSelected
                                ? 'bg-red-800 text-red-100'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Recomendado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time System */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-slate-400 font-bold">
                    CRONÓMETRO DE MISIÓN:
                  </label>
                  <span className="text-xs font-mono font-black text-red-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(durationSeconds)}
                  </span>
                </div>

                {/* Common Presets Grid (3:00, 3:30, 4:00, 4:30, 5:00, 6:00, 7:30) */}
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mb-2">
                  {[180, 210, 240, 270, 300, 360, 450].map((secs) => {
                    const isSelected = !isCustomMode && durationSeconds === secs;
                    const recSecs = getRecommendedSeconds(difficulty, modulesCount);
                    const isRecommended = recSecs === secs;

                    return (
                      <button
                        key={secs}
                        type="button"
                        onClick={() => {
                          setIsCustomMode(false);
                          setDurationSeconds(secs);
                        }}
                        className={`relative py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-white/50'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{formatDuration(secs)}</span>
                        {isRecommended && (
                          <span className="text-[8px] font-sans font-black uppercase text-amber-300">
                            Rec.
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Custom Option Button */}
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(true)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isCustomMode
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-1 ring-white/50'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>Otro</span>
                    <span className="text-[8px] font-sans uppercase text-slate-400">Manual</span>
                  </button>
                </div>

                {isCustomMode && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">DURACIÓN PERSONALIZADA:</span>
                    <select
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-mono font-bold text-sm"
                    >
                      {[120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480, 540, 600].map((s) => (
                        <option key={s} value={s}>
                          {formatDuration(s)} ({Math.floor(s / 60)} min {s % 60 ? `${s % 60}s` : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Strikes Limit Info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">LÍMITE DE FALLOS:</span>
                <span className="text-white font-bold">3 STRIKES MÁXIMO</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCreateRoom}
              className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-base uppercase tracking-wider transition-all shadow-xl shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'CREANDO SALA...' : 'CREAR SALA'}
            </button>
          </div>
        )}

        {/* Join Room View */}
        {mode === 'join' && (
          <JoinRoomPanel
            initialCode={initialRoomCode}
            onJoin={handleJoinRoom}
            isSubmitting={isSubmitting}
            accentColor="#ef4444"
            gameType="codigo-rojo"
          />
        )}
      </div>
    </GameLobbyLayout>
  );
};
