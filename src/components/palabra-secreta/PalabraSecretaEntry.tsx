import React, { useState } from 'react';
import {
  PalabraSecretaConfig,
  PalabraSecretaGameMode,
} from '../../types/palabraSecreta';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { PlayerProfileSetup, PlayerProfile } from '../lobby/PlayerProfileSetup';
import { RoomModeSelector, RoomMode } from '../lobby/RoomModeSelector';
import { JoinRoomPanel } from '../lobby/JoinRoomPanel';
import { CreateRoomPanel } from '../lobby/CreateRoomPanel';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';
import { audio } from '../../utils/audio';
import { Clock, Repeat, Film, Gamepad2, Check, Sparkles, ShieldAlert, KeyRound, MessageSquare } from 'lucide-react';

interface PalabraSecretaEntryProps {
  initialRoomCode?: string;
  initialName?: string;
  initialAvatar?: string;
  initialColor?: string;
  onCreateRoom: (
    player: { id: string; name: string; avatar: string; color: string },
    config?: Partial<PalabraSecretaConfig>
  ) => void;
  onJoinRoom: (
    code: string,
    player: { id: string; name: string; avatar: string; color: string }
  ) => void;
  onBackToMenu: () => void;
  errorMessage?: string | null;
}

const TIME_OPTIONS = [
  { label: '60s', sublabel: '1:00', value: 60 },
  { label: '90s', sublabel: '1:30', value: 90 },
  { label: '120s', sublabel: '2:00', value: 120 },
  { label: '150s', sublabel: '2:30', value: 150 },
];

const ROUNDS_OPTIONS = [2, 3, 4, 5];

export const PalabraSecretaEntry: React.FC<PalabraSecretaEntryProps> = ({
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
      name: initialName || saved.name || 'Jugador',
      avatar: initialAvatar || saved.avatar || '🦊',
      color: initialColor || saved.color || '#10B981',
    };
  });

  const [mode, setMode] = useState<RoomMode>(initialRoomCode ? 'join' : 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authoritative room mode configuration (Host selects before room creation)
  const [gameMode, setGameMode] = useState<PalabraSecretaGameMode>('CLASSIC');
  const [timePerTurn, setTimePerTurn] = useState<number>(120);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [emojiCategory, setEmojiCategory] = useState<'CINE' | 'VIDEOJUEGOS' | 'BOTH'>('BOTH');

  const handleUpdateProfile = (updated: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
      return next;
    });
  };

  const handleSelectGameMode = (selectedMode: PalabraSecretaGameMode) => {
    audio.playClick();
    setGameMode(selectedMode);
    if (selectedMode === 'PASSWORD') {
      // Password mode default turn settings
      setTimePerTurn(60);
    } else if (selectedMode === 'EMOJI') {
      setTimePerTurn(90);
    } else {
      setTimePerTurn(120);
    }
  };

  const handleToggleEmojiCategory = (cat: 'CINE' | 'VIDEOJUEGOS') => {
    audio.playClick();
    if (emojiCategory === 'BOTH') {
      setEmojiCategory(cat === 'CINE' ? 'VIDEOJUEGOS' : 'CINE');
    } else if (emojiCategory === cat) {
      // Cannot deselect the only active category
      return;
    } else {
      setEmojiCategory('BOTH');
    }
  };

  const handleCreate = () => {
    if (!profile.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onCreateRoom(profile, {
      gameMode,
      timePerTurn,
      totalRounds,
      emojiCategory,
      passwordTargetCount: 10,
      passwordClueBudget: 15,
      maxSkipsPerTurn: 3,
      penaltyOnSkip: true,
      penaltyOnTaboo: true,
      showForbiddenWords: true,
    });
  };

  const handleJoin = (code: string) => {
    if (!profile.name.trim() || !code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onJoinRoom(code.trim().toUpperCase(), profile);
  };

  return (
    <GameLobbyLayout
      title="Palabra Secreta"
      icon="🗣️"
      description="Juego en equipo: adivina y describe palabras, supera contraseñas o descifra enigmas con emojis."
      minPlayers={4}
      maxPlayers={16}
      gameType="palabra-secreta"
      onBack={onBackToMenu}
      backLabel="Menú Principal"
      isOnlineLobby={false}
      errorMessage={errorMessage}
    >
      {/* 1. Setup Player Profile */}
      <PlayerProfileSetup profile={profile} onChange={handleUpdateProfile} />

      {/* 2. Room Mode Selector (Create vs Join) */}
      <RoomModeSelector mode={mode} onChange={setMode} gameType="palabra-secreta" />

      {/* 3. Panel based on mode */}
      {mode === 'create' ? (
        <CreateRoomPanel
          onCreate={handleCreate}
          isLoading={isSubmitting}
          gameType="palabra-secreta"
          settingsSlot={
            <div className="space-y-4 sm:space-y-5 w-full min-w-0">
              {/* SECTION: MODO DE JUEGO */}
              <div className="w-full min-w-0">
                <div className="flex items-center justify-between mb-2 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Modo de Juego
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 font-mono">
                    {gameMode === 'CLASSIC' ? 'Clásico' : gameMode === 'PASSWORD' ? 'Contraseña' : 'Emoji Misterioso'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 w-full min-w-0">
                  {/* Option 1: CLÁSICO */}
                  <button
                    type="button"
                    onClick={() => handleSelectGameMode('CLASSIC')}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col gap-1 min-w-0 ${
                      gameMode === 'CLASSIC'
                        ? 'bg-emerald-500/15 border-[#10B981] shadow-md shadow-emerald-950/40 ring-1 ring-[#10B981]/50'
                        : 'bg-stone-950/70 border-stone-800/90 text-stone-400 hover:border-stone-700 hover:bg-stone-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">🗣️</span>
                        <span className={`text-xs sm:text-sm font-black uppercase tracking-wide truncate ${
                          gameMode === 'CLASSIC' ? 'text-white' : 'text-stone-300'
                        }`}>
                          Clásico
                        </span>
                      </div>
                      {gameMode === 'CLASSIC' && (
                        <div className="w-5 h-5 rounded-full bg-[#10B981] text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] sm:text-xs leading-relaxed break-words ${
                      gameMode === 'CLASSIC' ? 'text-emerald-200/90' : 'text-stone-500'
                    }`}>
                      Describe tantas palabras como puedas antes de que se acabe el tiempo evitando las palabras prohibidas.
                    </p>
                  </button>

                  {/* Option 2: CONTRASEÑA */}
                  <button
                    type="button"
                    onClick={() => handleSelectGameMode('PASSWORD')}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col gap-1 min-w-0 ${
                      gameMode === 'PASSWORD'
                        ? 'bg-emerald-500/15 border-[#10B981] shadow-md shadow-emerald-950/40 ring-1 ring-[#10B981]/50'
                        : 'bg-stone-950/70 border-stone-800/90 text-stone-400 hover:border-stone-700 hover:bg-stone-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">🔑</span>
                        <span className={`text-xs sm:text-sm font-black uppercase tracking-wide truncate ${
                          gameMode === 'PASSWORD' ? 'text-white' : 'text-stone-300'
                        }`}>
                          Contraseña
                        </span>
                      </div>
                      {gameMode === 'PASSWORD' && (
                        <div className="w-5 h-5 rounded-full bg-[#10B981] text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] sm:text-xs leading-relaxed break-words ${
                      gameMode === 'PASSWORD' ? 'text-emerald-200/90' : 'text-stone-500'
                    }`}>
                      Consigue que tu equipo adivine 10 palabras usando el menor número de pistas posible (presupuesto ideal de 15 pistas).
                    </p>
                  </button>

                  {/* Option 3: EMOJI MISTERIOSO */}
                  <button
                    type="button"
                    onClick={() => handleSelectGameMode('EMOJI')}
                    className={`w-full p-3 sm:p-3.5 rounded-2xl text-left transition-all cursor-pointer border flex flex-col gap-1 min-w-0 ${
                      gameMode === 'EMOJI'
                        ? 'bg-emerald-500/15 border-[#10B981] shadow-md shadow-emerald-950/40 ring-1 ring-[#10B981]/50'
                        : 'bg-stone-950/70 border-stone-800/90 text-stone-400 hover:border-stone-700 hover:bg-stone-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">😀</span>
                        <span className={`text-xs sm:text-sm font-black uppercase tracking-wide truncate ${
                          gameMode === 'EMOJI' ? 'text-white' : 'text-stone-300'
                        }`}>
                          Emoji Misterioso
                        </span>
                      </div>
                      {gameMode === 'EMOJI' && (
                        <div className="w-5 h-5 rounded-full bg-[#10B981] text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className={`text-[11px] sm:text-xs leading-relaxed break-words ${
                      gameMode === 'EMOJI' ? 'text-emerald-200/90' : 'text-stone-500'
                    }`}>
                      Consigue que tu equipo adivine películas y videojuegos usando hasta 5 emojis en directo.
                    </p>
                  </button>
                </div>
              </div>

              {/* SECTION: MODE-SPECIFIC SETTINGS */}
              <div className="pt-2 border-t border-stone-800/80 space-y-3 sm:space-y-4 w-full min-w-0">
                {/* 1. Time per turn (Visible in Clásico and Emoji Misterioso) */}
                {gameMode !== 'PASSWORD' && (
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between text-xs mb-2 min-w-0">
                      <span className="text-stone-300 font-semibold flex items-center gap-1.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Tiempo por Turno</span>
                      </span>
                      <span className="font-bold text-white font-mono shrink-0">
                        {timePerTurn >= 60
                          ? `${Math.floor(timePerTurn / 60)}:${(timePerTurn % 60).toString().padStart(2, '0')}`
                          : `${timePerTurn}s`}
                      </span>
                    </div>
                    <div
                      className="grid gap-1.5 sm:gap-2 w-full min-w-0"
                      style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            audio.playTick();
                            setTimePerTurn(opt.value);
                          }}
                          className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer min-w-0 ${
                            timePerTurn === opt.value
                              ? 'bg-[#10B981] text-slate-950 shadow-md shadow-[#10B981]/25 font-black scale-[1.01]'
                              : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className="text-[10px] opacity-75 font-mono">({opt.sublabel})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Rounds per match (Applies to all three modes) */}
                <div className="w-full min-w-0">
                  <div className="flex items-center justify-between text-xs mb-2 min-w-0">
                    <span className="text-stone-300 font-semibold flex items-center gap-1.5 truncate">
                      <Repeat className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span>Rondas por Partida</span>
                    </span>
                    <span className="font-bold text-white font-mono shrink-0">{totalRounds} rondas</span>
                  </div>
                  <div
                    className="grid gap-1.5 sm:gap-2 w-full min-w-0"
                    style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
                  >
                    {ROUNDS_OPTIONS.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          audio.playTick();
                          setTotalRounds(num);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center min-w-0 ${
                          totalRounds === num
                            ? 'bg-[#10B981] text-slate-950 shadow-md shadow-[#10B981]/25 font-black scale-[1.01]'
                            : 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                        }`}
                      >
                        <span>{num}</span>
                        <span className="hidden xs:inline ml-1 text-[10px]">rondas</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Mode-specific extras */}
                {gameMode === 'PASSWORD' && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-stone-300 text-xs space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold min-w-0">
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Reglas de Contraseña</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed break-words">
                      • <strong>10 palabras objetivo</strong> por turno en una sola lista continua.
                    </p>
                    <p className="text-[11px] text-stone-300 leading-relaxed break-words">
                      • Presupuesto ideal: <strong>15 pistas verbales</strong> en total.
                    </p>
                    <p className="text-[11px] text-stone-300 leading-relaxed break-words">
                      • Con ≤15 pistas: ¡bonificación multiplicadora (hasta <strong>x1.5</strong>)!
                    </p>
                    <p className="text-[11px] text-stone-300 leading-relaxed break-words">
                      • Cada pista que exceda de 15 resta <strong>-1 punto</strong> de penalización.
                    </p>
                  </div>
                )}

                {gameMode === 'EMOJI' && (
                  <div className="w-full min-w-0 space-y-2">
                    <div className="flex items-center justify-between text-xs min-w-0">
                      <span className="text-stone-300 font-semibold flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>Categorías de Títulos</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">
                        {emojiCategory === 'BOTH' ? 'Ambas activas' : emojiCategory}
                      </span>
                    </div>
                    <div
                      className="grid gap-2 w-full min-w-0"
                      style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleEmojiCategory('CINE')}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer min-w-0 ${
                          emojiCategory === 'CINE' || emojiCategory === 'BOTH'
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                            : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                        }`}
                      >
                        <Film className="w-4 h-4 shrink-0 text-amber-400" />
                        <span className="text-xs truncate flex-1">Cine</span>
                        {(emojiCategory === 'CINE' || emojiCategory === 'BOTH') && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleEmojiCategory('VIDEOJUEGOS')}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer min-w-0 ${
                          emojiCategory === 'VIDEOJUEGOS' || emojiCategory === 'BOTH'
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold'
                            : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-700'
                        }`}
                      >
                        <Gamepad2 className="w-4 h-4 shrink-0 text-purple-400" />
                        <span className="text-xs truncate flex-1">Videojuegos</span>
                        {(emojiCategory === 'VIDEOJUEGOS' || emojiCategory === 'BOTH') && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        />
      ) : (
        <JoinRoomPanel
          onJoin={handleJoin}
          isLoading={isSubmitting}
          initialCode={initialRoomCode}
          gameType="palabra-secreta"
        />
      )}
    </GameLobbyLayout>
  );
};
