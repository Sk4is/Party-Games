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
} from 'lucide-react';
import {
  PalabraSecretaRoomState,
  PalabraSecretaConfig,
} from '../../types/palabraSecreta';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { RoomCode } from '../lobby/RoomCode';
import { PalabraSecretaSettings } from '../lobby/GameSettings';
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

  const myTeamId = roomState.players.find((p) => p.id === localPlayer.id)?.teamId || 'team-1';

  return (
    <GameLobbyLayout
      title="Palabra Secreta"
      icon="🗣️"
      description="Describe tantas palabras como puedas para que tu equipo las adivine antes de que se acabe el tiempo."
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

      {/* 2. Teams Configuration Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
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
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              {/* Team 1 Header */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stone-800/80">
                {editingTeam === 'team-1' ? (
                  <div className="flex items-center gap-1.5 flex-1">
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
                      className="flex-1 px-2.5 py-1 bg-stone-950 border border-[#10B981] rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTeamName}
                      className="p-1.5 rounded-lg bg-[#10B981] text-stone-950 hover:bg-[#059669] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
                    <h4 className="text-base font-black text-white truncate">{team1.name}</h4>
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
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    team1Players.length >= 2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {team1Players.length} {team1Players.length === 1 ? 'jugador' : 'jugadores'}
                </span>
              </div>

              {/* Team 1 Players List */}
              <div className="space-y-2 min-h-[100px]">
                {team1Players.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 italic">
                    Sin jugadores en este equipo
                  </div>
                ) : (
                  team1Players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        player.id === localPlayer.id
                          ? 'bg-[#10B981]/10 border-[#10B981]/40 text-white'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{player.avatar}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold truncate">
                              {player.name}
                            </span>
                            {player.id === localPlayer.id && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#10B981] text-slate-950 uppercase">
                                Tú
                              </span>
                            )}
                            {player.isHost && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                          className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-bold transition-all border border-stone-700 cursor-pointer flex items-center gap-1 shrink-0"
                          title={`Mover a ${team2.name}`}
                        >
                          <span>Pasar a {team2.name.split(' ')[0]}</span>
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
                className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold transition-colors border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Unirme a {team1.name}</span>
              </button>
            )}
          </div>

          {/* Team 2 */}
          <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              {/* Team 2 Header */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-stone-800/80">
                {editingTeam === 'team-2' ? (
                  <div className="flex items-center gap-1.5 flex-1">
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
                      className="flex-1 px-2.5 py-1 bg-stone-950 border border-[#06B6D4] rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTeamName}
                      className="p-1.5 rounded-lg bg-[#06B6D4] text-stone-950 hover:bg-[#0891B2] cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="p-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-3 h-3 rounded-full bg-[#06B6D4] shrink-0" />
                    <h4 className="text-base font-black text-white truncate">{team2.name}</h4>
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
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    team2Players.length >= 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {team2Players.length} {team2Players.length === 1 ? 'jugador' : 'jugadores'}
                </span>
              </div>

              {/* Team 2 Players List */}
              <div className="space-y-2 min-h-[100px]">
                {team2Players.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 italic">
                    Sin jugadores en este equipo
                  </div>
                ) : (
                  team2Players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        player.id === localPlayer.id
                          ? 'bg-[#06B6D4]/10 border-[#06B6D4]/40 text-white'
                          : 'bg-stone-950/60 border-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{player.avatar}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold truncate">
                              {player.name}
                            </span>
                            {player.id === localPlayer.id && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-[#06B6D4] text-slate-950 uppercase">
                                Tú
                              </span>
                            )}
                            {player.isHost && (
                              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
                          className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-[11px] font-bold transition-all border border-stone-700 cursor-pointer flex items-center gap-1 shrink-0"
                          title={`Mover a ${team1.name}`}
                        >
                          <span>Pasar a {team1.name.split(' ')[0]}</span>
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
                className="mt-3 w-full py-2 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-bold transition-colors border border-stone-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Unirme a {team2.name}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Settings Card */}
      <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="border-b border-stone-800 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
            Ajustes de la Partida
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {isHost
              ? 'Solo tú como anfitrión puedes modificar estos parámetros.'
              : 'Configuración elegida por el anfitrión.'}
          </p>
        </div>

        <PalabraSecretaSettings
          timePerTurn={roomState.config.timePerTurn}
          totalRounds={roomState.config.totalRounds}
          isHost={isHost}
          onChangeTime={(timePerTurn) => onUpdateConfig({ timePerTurn })}
          onChangeRounds={(totalRounds) => onUpdateConfig({ totalRounds })}
        />
      </div>

      {/* 4. Action Button / Status */}
      <div className="space-y-3">
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
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-[#10B981]/25 active:scale-[0.99] cursor-pointer'
                  : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Empezar Partida</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center text-stone-300 text-sm font-semibold flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
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
