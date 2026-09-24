import React, { useState } from 'react';
import {
  Users,
  Play,
  Shuffle,
  Check,
  Edit2,
  Crown,
  ArrowRightLeft,
  AlertCircle,
  X,
  Clock,
  Repeat,
  Film,
  Gamepad2,
  KeyRound,
  MessageSquare,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import {
  PalabraSecretaRoomState,
  PalabraSecretaConfig,
  PalabraSecretaGameMode,
  EmojiCategory,
} from '../../types/palabraSecreta';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { RoomCode } from '../lobby/RoomCode';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { audio } from '../../utils/audio';

interface PalabraSecretaLobbyProps {
  roomState: PalabraSecretaRoomState;
  localPlayer: { id: string; name: string; avatar: string; color: string };
  isHost: boolean;
  onUpdateConfig: (config: Partial<PalabraSecretaConfig>) => void;
  onSwitchTeam: (targetTeamId: 'team-1' | 'team-2', targetPlayerId?: string) => void;
  onUpdateTeamName: (teamId: 'team-1' | 'team-2', name: string) => void;
  onRandomizeTeams: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onOpenHowToPlay?: () => void;
}

const GAME_MODES: {
  id: PalabraSecretaGameMode;
  name: string;
  icon: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: 'CLASSIC',
    name: 'CLÁSICO',
    icon: '🗣️',
    tagline: 'Palabras sin tabúes',
    description: 'Describe tantas palabras como puedas antes de que se acabe el tiempo.',
  },
  {
    id: 'PASSWORD',
    name: 'CONTRASEÑA',
    icon: '🔑',
    tagline: '10 palabras, 15 pistas',
    description: 'Consigue que tu equipo adivine 10 palabras usando el menor número de pistas posible.',
  },
  {
    id: 'EMOJI',
    name: 'EMOJI MISTERIOSO',
    icon: '😀',
    tagline: 'Cine y videojuegos en emojis',
    description: 'Consigue que tu equipo adivine películas y videojuegos usando hasta 5 emojis.',
  },
];

export const PalabraSecretaLobby: React.FC<PalabraSecretaLobbyProps> = ({
  roomState,
  localPlayer,
  isHost,
  onUpdateConfig,
  onSwitchTeam,
  onUpdateTeamName,
  onRandomizeTeams,
  onStartGame,
  onLeaveRoom,
}) => {
  const [editingTeam, setEditingTeam] = useState<'team-1' | 'team-2' | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);

  const currentMode = roomState.config.gameMode || 'CLASSIC';

  const team1 = roomState.teams['team-1'] || {
    id: 'team-1',
    name: 'Equipo Esmeralda',
    color: '#10B981',
    score: 0,
    playerIds: [],
  };
  const team2 = roomState.teams['team-2'] || {
    id: 'team-2',
    name: 'Equipo Zafiro',
    color: '#06B6D4',
    score: 0,
    playerIds: [],
  };

  const team1Players = roomState.players.filter((p) => team1.playerIds.includes(p.id));
  const team2Players = roomState.players.filter((p) => team2.playerIds.includes(p.id));

  const totalPlayers = roomState.players.length;
  const canStart = totalPlayers >= 4 && team1Players.length >= 2 && team2Players.length >= 2;

  const handleStartEditing = (teamId: 'team-1' | 'team-2') => {
    if (!isHost) return;
    setEditingTeam(teamId);
    setTeamNameInput(roomState.teams[teamId]?.name || (teamId === 'team-1' ? 'Equipo 1' : 'Equipo 2'));
  };

  const handleSaveTeamName = () => {
    if (editingTeam && teamNameInput.trim()) {
      audio.playTick();
      onUpdateTeamName(editingTeam, teamNameInput.trim());
      setEditingTeam(null);
    }
  };

  const handleCancelEditing = () => {
    setEditingTeam(null);
    setTeamNameInput('');
  };

  const handleStart = () => {
    if (!canStart) return;
    audio.playGameStart();
    onStartGame();
  };

  const handleSelectMode = (mode: PalabraSecretaGameMode) => {
    if (!isHost) return;
    audio.playSpark();
    onUpdateConfig({ gameMode: mode });
  };

  const handleSelectEmojiCategory = (cat: EmojiCategory) => {
    if (!isHost) return;
    audio.playTick();
    onUpdateConfig({ emojiCategory: cat });
  };

  const myTeamId = roomState.players.find((p) => p.id === localPlayer.id)?.teamId || 'team-1';

  return (
    <GameLobbyLayout
      title="Palabra Secreta"
      icon="🗣️"
      description="Juego por equipos con 3 modos: Clásico, Contraseña y Emoji Misterioso."
      minPlayers={4}
      maxPlayers={16}
      gameType="palabra-secreta"
      onBack={() => setIsAbandonModalOpen(true)}
      backLabel="Salir de la sala"
      roomCode={roomState.code}
      isOnlineLobby={true}
    >
      {/* 1. Room Code & Share */}
      <RoomCode code={roomState.code} gameSlug="palabra-secreta" />

      {/* 2. Game Mode Selector */}
      <div className="w-full max-w-full min-w-0 bg-stone-900/70 border border-stone-800/90 rounded-3xl p-3.5 xs:p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-4 box-border">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 sm:pb-3 min-w-0 gap-2">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="text-[#10B981] shrink-0">🎮</span>
              <span className="truncate">MODO DE JUEGO</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 break-words">
              {isHost
                ? 'Elige la modalidad para la partida.'
                : 'Modalidad configurada por el anfitrión.'}
            </p>
          </div>
          <span className="px-2 xs:px-2.5 py-1 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] xs:text-xs font-black shrink-0">
            {GAME_MODES.find((m) => m.id === currentMode)?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 w-full min-w-0">
          {GAME_MODES.map((mode) => {
            const isSelected = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                disabled={!isHost}
                onClick={() => handleSelectMode(mode.id)}
                className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all relative flex flex-col justify-between w-full min-w-0 ${
                  isSelected
                    ? 'bg-[#10B981]/15 border-[#10B981] shadow-lg shadow-[#10B981]/15 scale-[1.01]'
                    : isHost
                    ? 'bg-stone-950/70 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60 cursor-pointer'
                    : 'bg-stone-950/40 border-stone-800/60 opacity-60 cursor-default'
                }`}
              >
                <div className="min-w-0 w-full">
                  <div className="flex items-center justify-between mb-1.5 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0">{mode.icon}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#10B981] text-stone-950 flex items-center justify-center text-xs font-black shadow shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className={`text-sm sm:text-base font-black tracking-wide truncate ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                    {mode.name}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#10B981] font-semibold mb-1 truncate">
                    {mode.tagline}
                  </p>
                  <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed break-words">
                    &ldquo;{mode.description}&rdquo;
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Teams Configuration Section */}
      <div className="w-full max-w-full min-w-0 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-2.5 sm:pb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-[#10B981] shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 truncate">
              Equipos de la Partida ({totalPlayers} / 16 Jugadores)
            </h3>
          </div>

          {isHost && (
            <button
              type="button"
              onClick={() => {
                audio.playSpark();
                onRandomizeTeams();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition-all border border-stone-700 cursor-pointer self-start sm:self-auto"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Equilibrar equipos al azar</span>
            </button>
          )}
        </div>

        {/* The 2 Teams Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team 1 */}
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-3.5 sm:p-5 shadow-xl flex flex-col justify-between min-w-0">
            <div>
              {/* Team 1 Header */}
              <div className="flex items-center justify-between gap-1.5 mb-3 pb-2.5 border-b border-stone-800/80 min-w-0">
                {editingTeam === 'team-1' ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTeamName();
                        if (e.key === 'Escape') handleCancelEditing();
                      }}
                      autoFocus
                      maxLength={24}
                      className="w-full min-w-0 px-2 py-1 bg-stone-950 border border-[#10B981] rounded-lg text-xs sm:text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTeamName}
                      className="p-1.5 rounded-lg bg-[#10B981] text-stone-950 hover:bg-[#059669] cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10B981] shrink-0" />
                    <h4 className="text-sm sm:text-base font-black text-white truncate min-w-0">{team1.name}</h4>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleStartEditing('team-1')}
                        title="Editar nombre de equipo"
                        className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                    team1Players.length >= 2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {team1Players.length} {team1Players.length === 1 ? 'jugador' : 'jugadores'}
                </span>
              </div>

              {/* Team 1 Players List */}
              <div className="space-y-1.5 sm:space-y-2 min-h-[90px]">
                {team1Players.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 italic">
                    Sin jugadores en este equipo
                  </div>
                ) : (
                  team1Players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between gap-1.5 p-2 sm:p-2.5 rounded-2xl border transition-all min-w-0 ${
                        player.id === localPlayer.id
                          ? 'bg-[#10B981]/10 border-[#10B981]/40 text-white'
                          : 'bg-stone-950/70 border-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xl shrink-0">{player.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-xs sm:text-sm truncate text-white block min-w-0">
                              {player.name}
                            </span>
                            {player.isHost && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                            )}
                            {player.id === localPlayer.id && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#10B981]/20 text-[#10B981] font-bold shrink-0">
                                Tú
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Move to team 2 button */}
                      {(isHost || player.id === localPlayer.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            audio.playTick();
                            onSwitchTeam('team-2', player.id);
                          }}
                          className="px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[10px] sm:text-[11px] font-bold transition-all border border-stone-700 cursor-pointer flex items-center gap-1 shrink-0"
                          title={`Mover a ${team2.name}`}
                        >
                          <span className="hidden xs:inline">Pasar a {team2.name.split(' ')[0]}</span>
                          <span className="xs:hidden">Mover</span>
                          <ArrowRightLeft className="w-3 h-3 text-[#06B6D4]" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Switch CTA for current player if in other team */}
            {myTeamId === 'team-2' && (
              <button
                type="button"
                onClick={() => {
                  audio.playTick();
                  onSwitchTeam('team-1', localPlayer.id);
                }}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold transition-colors border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer truncate"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span className="truncate">Unirme a {team1.name}</span>
              </button>
            )}
          </div>

          {/* Team 2 */}
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-3.5 sm:p-5 shadow-xl flex flex-col justify-between min-w-0">
            <div>
              {/* Team 2 Header */}
              <div className="flex items-center justify-between gap-1.5 mb-3 pb-2.5 border-b border-stone-800/80 min-w-0">
                {editingTeam === 'team-2' ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <input
                      type="text"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTeamName();
                        if (e.key === 'Escape') handleCancelEditing();
                      }}
                      autoFocus
                      maxLength={24}
                      className="w-full min-w-0 px-2 py-1 bg-stone-950 border border-[#06B6D4] rounded-lg text-xs sm:text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTeamName}
                      className="p-1.5 rounded-lg bg-[#06B6D4] text-stone-950 hover:bg-[#0891B2] cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#06B6D4] shrink-0" />
                    <h4 className="text-sm sm:text-base font-black text-white truncate min-w-0">{team2.name}</h4>
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => handleStartEditing('team-2')}
                        title="Editar nombre de equipo"
                        className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                    team2Players.length >= 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {team2Players.length} {team2Players.length === 1 ? 'jugador' : 'jugadores'}
                </span>
              </div>

              {/* Team 2 Players List */}
              <div className="space-y-1.5 sm:space-y-2 min-h-[90px]">
                {team2Players.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 italic">
                    Sin jugadores en este equipo
                  </div>
                ) : (
                  team2Players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between gap-1.5 p-2 sm:p-2.5 rounded-2xl border transition-all min-w-0 ${
                        player.id === localPlayer.id
                          ? 'bg-[#06B6D4]/10 border-[#06B6D4]/40 text-white'
                          : 'bg-stone-950/70 border-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xl shrink-0">{player.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-xs sm:text-sm truncate text-white block min-w-0">
                              {player.name}
                            </span>
                            {player.isHost && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                            )}
                            {player.id === localPlayer.id && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-[#06B6D4]/20 text-[#06B6D4] font-bold shrink-0">
                                Tú
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Move to team 1 button */}
                      {(isHost || player.id === localPlayer.id) && (
                        <button
                          type="button"
                          onClick={() => {
                            audio.playTick();
                            onSwitchTeam('team-1', player.id);
                          }}
                          className="px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[10px] sm:text-[11px] font-bold transition-all border border-stone-700 cursor-pointer flex items-center gap-1 shrink-0"
                          title={`Mover a ${team1.name}`}
                        >
                          <span className="hidden xs:inline">Pasar a {team1.name.split(' ')[0]}</span>
                          <span className="xs:hidden">Mover</span>
                          <ArrowRightLeft className="w-3 h-3 text-[#10B981]" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Switch CTA for current player if in other team */}
            {myTeamId === 'team-1' && (
              <button
                type="button"
                onClick={() => {
                  audio.playTick();
                  onSwitchTeam('team-2', localPlayer.id);
                }}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold transition-colors border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer truncate"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                <span className="truncate">Unirme a {team2.name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Mode-Specific Settings Card */}
      <div className="w-full max-w-full min-w-0 bg-stone-900/70 border border-stone-800/90 rounded-3xl p-3.5 xs:p-4 sm:p-6 shadow-xl space-y-3 sm:space-y-5 box-border">
        <div className="border-b border-stone-800 pb-2.5 sm:pb-3 flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-200 truncate">
              Ajustes de {GAME_MODES.find((m) => m.id === currentMode)?.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 break-words">
              {isHost
                ? 'Personaliza la duración y rondas para este modo.'
                : 'Ajustes definidos por el anfitrión.'}
            </p>
          </div>
        </div>

        {/* Mode 1: CLÁSICO SETTINGS */}
        {currentMode === 'CLASSIC' && (
          <div className="space-y-4">
            {/* Turn time */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                  Tiempo por Turno
                </span>
                <span className="font-bold text-white font-mono">{roomState.config.timePerTurn}s</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        audio.playTick();
                        onUpdateConfig({ timePerTurn: sec });
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                      roomState.config.timePerTurn === sec
                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/25 scale-[1.02]'
                        : isHost
                        ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                        : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#10B981]" />
                  Rondas por Partida
                </span>
                <span className="font-bold text-white font-mono">{roomState.config.totalRounds} rondas</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        audio.playTick();
                        onUpdateConfig({ totalRounds: num });
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                      roomState.config.totalRounds === num
                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/25 scale-[1.02]'
                        : isHost
                        ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                        : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="hidden xs:inline ml-1">rondas</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode 2: CONTRASEÑA SETTINGS */}
        {currentMode === 'PASSWORD' && (
          <div className="space-y-4">
            {/* Budget Guide Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Reglas de Contraseña</span>
              </div>
              <ul className="text-xs text-stone-300 space-y-1.5 list-disc list-inside">
                <li><strong className="text-white">10 palabras objetivo</strong> secretas por turno para el descriptor.</li>
                <li><strong className="text-white">Presupuesto de 15 pistas verbales</strong> en total para toda la lista.</li>
                <li><strong className="text-emerald-400">Bonificación por eficiencia</strong> si usas 15 o menos pistas (hasta x1.5).</li>
                <li><strong className="text-rose-400">Penalización de -1 punto</strong> por cada pista adicional por encima de 15.</li>
              </ul>
            </div>

            {/* Rounds */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#10B981]" />
                  Rondas por Partida
                </span>
                <span className="font-bold text-white font-mono">{roomState.config.totalRounds} rondas</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        audio.playTick();
                        onUpdateConfig({ totalRounds: num });
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                      roomState.config.totalRounds === num
                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/25 scale-[1.02]'
                        : isHost
                        ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                        : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="hidden xs:inline ml-1">rondas</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode 3: EMOJI MISTERIOSO SETTINGS */}
        {currentMode === 'EMOJI' && (
          <div className="space-y-4">
            {/* Category selection */}
            <div>
              <span className="text-stone-300 font-semibold text-xs mb-2 block">
                Temáticas de Títulos
              </span>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(
                  [
                    { id: 'CINEMA', label: 'Cine', icon: '🎬' },
                    { id: 'VIDEOGAMES', label: 'Videojuegos', icon: '🎮' },
                    { id: 'BOTH', label: 'Ambos', icon: '🎬🎮' },
                  ] as const
                ).map((cat) => {
                  const isCatSelected = (roomState.config.emojiCategory || 'BOTH') === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={!isHost}
                      onClick={() => handleSelectEmojiCategory(cat.id)}
                      className={`py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center gap-1 border ${
                        isCatSelected
                          ? 'bg-[#10B981] text-slate-950 border-[#10B981] font-black shadow-md shadow-[#10B981]/20 scale-[1.02]'
                          : isHost
                          ? 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-white cursor-pointer'
                          : 'bg-stone-950/60 border-stone-800/60 text-stone-600 cursor-default'
                      }`}
                    >
                      <span className="text-base sm:text-lg">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turn time */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                  Tiempo de Turno
                </span>
                <span className="font-bold text-white font-mono">{roomState.config.timePerTurn}s</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {[45, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        audio.playTick();
                        onUpdateConfig({ timePerTurn: sec });
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                      roomState.config.timePerTurn === sec
                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/25 scale-[1.02]'
                        : isHost
                        ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                        : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#10B981]" />
                  Rondas por Partida
                </span>
                <span className="font-bold text-white font-mono">{roomState.config.totalRounds} rondas</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
                {[2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      if (isHost) {
                        audio.playTick();
                        onUpdateConfig({ totalRounds: num });
                      }
                    }}
                    className={`py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all ${
                      roomState.config.totalRounds === num
                        ? 'bg-[#10B981] text-slate-950 font-black shadow-md shadow-[#10B981]/25 scale-[1.02]'
                        : isHost
                        ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                        : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="hidden xs:inline ml-1">rondas</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 flex items-center gap-2">
              <Smile className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>El descriptor elige 1 de 3 opciones y compone hasta 5 emojis. Pasar un título resta 1 punto a la puntuación del turno.</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Action Button / Status */}
      <div className="w-full min-w-0 space-y-3">
        {isHost ? (
          <div>
            {!canStart && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Cada equipo necesita al menos 2 jugadores para empezar (mínimo 4 jugadores en total).</span>
              </div>
            )}

            <button
              id="btn-start-palabra-secreta"
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 text-center ${
                canStart
                  ? 'bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-[#10B981]/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
              <span className="truncate">Empezar Partida ({GAME_MODES.find((m) => m.id === currentMode)?.name})</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center text-stone-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
            <span>Esperando a que el anfitrión inicie la partida...</span>
          </div>
        )}
      </div>

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={isAbandonModalOpen}
        onCancel={() => setIsAbandonModalOpen(false)}
        onConfirm={onLeaveRoom}
        title="¿Salir de la sala?"
        message="Saldrás de la sala multijugador y volverás al menú principal."
        cancelText="Permanecer"
        confirmText="Salir de la sala"
      />
    </GameLobbyLayout>
  );
};
