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
  const [timeMode, setTimeMode] = useState<CodigoRojoTimeMode>('AUTO');
  const [customMinutes, setCustomMinutes] = useState<number>(5);

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
        timeMode,
        customTimeMinutes: customMinutes,
        modulesCount: difficulty === 'NORMAL' ? 3 : difficulty === 'DIFICIL' ? 4 : 5,
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
                      onClick={() => setDifficulty(d)}
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
                <span className="text-[11px] text-slate-500 font-mono block mt-1.5">
                  {difficulty === 'NORMAL'
                    ? '3 módulos &bull; Desafío equilibrado &bull; Recomendado'
                    : difficulty === 'DIFICIL'
                    ? '4 módulos &bull; Más condiciones &bull; Menos tiempo'
                    : '5 módulos &bull; Máxima tensión &bull; Sin margen de error'}
                </span>
              </div>

              {/* Time System */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-2 font-bold">
                  CRONÓMETRO:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimeMode('AUTO')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      timeMode === 'AUTO'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Automático (~{difficulty === 'NORMAL' ? '4:30' : difficulty === 'DIFICIL' ? '5:45' : '6:30'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMode('CUSTOM')}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      timeMode === 'CUSTOM'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                {timeMode === 'CUSTOM' && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">DURACIÓN (MINUTOS):</span>
                    <select
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10))}
                      className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 font-mono font-bold text-sm"
                    >
                      {[3, 4, 5, 6, 7, 8, 10].map((m) => (
                        <option key={m} value={m}>
                          {m} minutos
                        </option>
                      ))}
                    </select>
                  </div>
                )}
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
          />
        )}
      </div>
    </GameLobbyLayout>
  );
};
