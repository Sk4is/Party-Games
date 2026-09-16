import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Play, HelpCircle, Users, Heart, Zap, Dices } from 'lucide-react';
import { Player, GameConfig } from '../types';
import { PLAYER_COLORS, AVATARS, DEFAULT_PLAYER_NAMES, getRandomAnimalAvatar } from '../data/players';
import { SoundToggle } from './SoundToggle';
import { HowToPlayModal } from './HowToPlayModal';
import { AvatarPickerModal } from './AvatarPickerModal';
import { audio } from '../utils/audio';

interface PlayerSetupProps {
  onStartGame: (players: Player[], config: GameConfig) => void;
  onBackToMenu: () => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame, onBackToMenu }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Pre-game configuration
  const [startingLives, setStartingLives] = useState<number>(3);
  const [allowedMistakesPerRound, setAllowedMistakesPerRound] = useState<number>(3);

  // Active avatar picker state (which player is editing avatar)
  const [activePickerPlayerId, setActivePickerPlayerId] = useState<string | null>(null);

  // Initialize with 4 default players with distinct random animal avatars
  const [playerList, setPlayerList] = useState<Array<{ id: string; name: string; avatar: string; colorIdx: number }>>(() => {
    const assignedAvatars: string[] = [];
    return DEFAULT_PLAYER_NAMES.map((name, i) => {
      const avatar = getRandomAnimalAvatar(assignedAvatars);
      assignedAvatars.push(avatar);
      return {
        id: `p-${i + 1}`,
        name,
        avatar,
        colorIdx: i % PLAYER_COLORS.length,
      };
    });
  });

  const [newNameInput, setNewNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (playerList.length >= 10) {
      setErrorMsg('El número máximo de jugadores es 10.');
      return;
    }

    const trimmed = newNameInput.trim();
    const candidateName = trimmed || `Jugador ${playerList.length + 1}`;

    const newIdx = playerList.length;
    const usedAvatars = playerList.map((p) => p.avatar);
    const newAvatar = getRandomAnimalAvatar(usedAvatars);

    const newPlayer = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: candidateName,
      avatar: newAvatar,
      colorIdx: newIdx % PLAYER_COLORS.length,
    };

    setPlayerList([...playerList, newPlayer]);
    setNewNameInput('');
    setErrorMsg(null);
    audio.playTurnChange();
  };

  const handleRemovePlayer = (id: string) => {
    if (playerList.length <= 2) {
      setErrorMsg('Se necesitan al menos 2 jugadores para jugar.');
      return;
    }
    setPlayerList(playerList.filter((p) => p.id !== id));
    setErrorMsg(null);
    audio.playSpark();
  };

  const handleNameChange = (id: string, name: string) => {
    setPlayerList(playerList.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const handleRandomizeSingleAvatar = (id: string) => {
    const current = playerList.find((p) => p.id === id);
    if (!current) return;
    const usedAvatars = playerList.filter((p) => p.id !== id).map((p) => p.avatar);
    const newAvatar = getRandomAnimalAvatar([...usedAvatars, current.avatar]);
    setPlayerList(playerList.map((p) => (p.id === id ? { ...p, avatar: newAvatar } : p)));
    audio.playSpark();
  };

  const handleSelectAvatarForPlayer = (avatar: string) => {
    if (!activePickerPlayerId) return;
    setPlayerList(
      playerList.map((p) => (p.id === activePickerPlayerId ? { ...p, avatar } : p))
    );
  };

  const activePickerPlayer = playerList.find((p) => p.id === activePickerPlayerId);

  const handleStartGame = () => {
    if (playerList.length < 2) {
      setErrorMsg('Añade al menos 2 jugadores para comenzar.');
      return;
    }
    if (playerList.length > 10) {
      setErrorMsg('Máximo 10 jugadores permitidos.');
      return;
    }

    const config: GameConfig = {
      startingLives,
      allowedMistakesPerRound,
    };

    // Prepare full Player objects with configured starting lives
    const initializedPlayers: Player[] = playerList.map((p, i) => {
      const colorObj = PLAYER_COLORS[p.colorIdx % PLAYER_COLORS.length];
      return {
        id: p.id,
        name: p.name.trim() || `Jugador ${i + 1}`,
        color: colorObj.hex,
        avatar: p.avatar,
        lives: startingLives,
        mistakes: 0,
        roundMistakes: 0,
        multiplier: 1.0,
        isEliminated: false,
        bombsReceived: 0,
        validWordsCount: 0,
        fastestAnswerTimeMs: null,
        alphabetProgress: [],
      };
    });

    audio.playAnswerAccepted();
    onStartGame(initializedPlayers, config);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-radial from-slate-900 via-slate-950 to-black text-slate-100">
      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto pb-4">
        <button
          id="back-to-menu-button"
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            id="setup-how-to-play-button"
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Cómo jugar</span>
          </button>
          <SoundToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-4 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            💣 La Bomba &bull; Configuración
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-display text-white tracking-wide">
            Preparar Partida
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Mínimo 2 y máximo 10 jugadores con avatares de animales personalizados.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="w-full px-4 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm font-semibold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Players List Card */}
        <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              Jugadores ({playerList.length}/10)
            </span>
            <span className="text-amber-400 font-extrabold">
              Toca el avatar para elegir animal
            </span>
          </div>

          <div className="space-y-3 max-h-[38vh] overflow-y-auto pr-1">
            {playerList.map((player, index) => {
              const colorObj = PLAYER_COLORS[player.colorIdx % PLAYER_COLORS.length];
              return (
                <div
                  key={player.id}
                  id={`player-row-${player.id}`}
                  className="flex items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 transition-all hover:border-slate-600"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    {/* Avatar with click to open picker modal */}
                    <div className="relative flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActivePickerPlayerId(player.id)}
                        title="Toca para cambiar de avatar de animal"
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner border-2 border-white/20 hover:border-amber-400 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                        style={{ backgroundColor: colorObj.hex }}
                      >
                        {player.avatar}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRandomizeSingleAvatar(player.id)}
                        title="Avatar aleatorio"
                        className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 text-xs transition-colors cursor-pointer"
                      >
                        <Dices className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Name input */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-400">#{index + 1}</span>
                        <input
                          id={`player-name-input-${player.id}`}
                          type="text"
                          maxLength={16}
                          value={player.name}
                          onChange={(e) => handleNameChange(player.id, e.target.value)}
                          placeholder={`Jugador ${index + 1}`}
                          className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-1.5 text-slate-100 font-bold text-sm sm:text-base focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Initial Lives preview & Remove button */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-0.5 text-rose-500 text-xs">
                      {Array.from({ length: startingLives }).map((_, i) => (
                        <span key={i}>❤️</span>
                      ))}
                    </div>

                    <button
                      id={`delete-player-button-${player.id}`}
                      type="button"
                      onClick={() => handleRemovePlayer(player.id)}
                      disabled={playerList.length <= 2}
                      title="Eliminar jugador"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Player Input row */}
          {playerList.length < 10 && (
            <form onSubmit={handleAddPlayer} className="mt-4 pt-4 border-t border-slate-800/80 flex gap-2">
              <input
                id="new-player-name-input"
                type="text"
                maxLength={16}
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder="Nombre del nuevo jugador..."
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-slate-100 font-medium placeholder:text-slate-500 focus:outline-none transition-colors text-sm sm:text-base"
              />
              <button
                id="add-player-button"
                type="submit"
                className="px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir jugador</span>
              </button>
            </form>
          )}
        </div>

        {/* PRE-GAME SETTINGS SECTION: CONFIGURACIÓN DE PARTIDA */}
        <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5 text-amber-400">
              ⚙️ CONFIGURACIÓN DE PARTIDA
            </span>
            <span>Reglas de la partida</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* Setting 1: VIDAS INICIALES */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black font-display text-white flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    VIDAS INICIALES
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {startingLives} {startingLives === 1 ? 'vida' : 'vidas'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  ¿Cuántas vidas tiene cada jugador al empezar?
                </p>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isSelected = startingLives === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setStartingLives(num);
                        audio.playSpark();
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-display font-black text-sm sm:text-base transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 border-2 border-rose-400 scale-105'
                          : 'bg-slate-900/90 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Setting 2: FALLOS PERMITIDOS POR RONDA */}
            <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-black font-display text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    FALLOS PERMITIDOS POR RONDA
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {allowedMistakesPerRound} {allowedMistakesPerRound === 1 ? 'fallo' : 'fallos'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  ¿Cuántas veces puedes fallar antes de acelerar la mecha (×1.5)?
                </p>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isSelected = allowedMistakesPerRound === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setAllowedMistakesPerRound(num);
                        audio.playSpark();
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-display font-black text-sm sm:text-base transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border-2 border-amber-300 scale-105'
                          : 'bg-slate-900/90 text-slate-300 hover:bg-slate-700/80 border border-slate-700/80 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Start Game Action & Summary */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Settings Summary before start */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-300 font-bold">
            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              {playerList.length} jugadores
            </span>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1">
              ❤️ {startingLives} {startingLives === 1 ? 'vida' : 'vidas'}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
              ⚡ {allowedMistakesPerRound} {allowedMistakesPerRound === 1 ? 'fallo' : 'fallos'} por ronda
            </span>
          </div>

          <button
            id="start-game-button"
            type="button"
            onClick={handleStartGame}
            disabled={playerList.length < 2 || playerList.length > 10}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>EMPEZAR PARTIDA</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-2">
        La Bomba &bull; Fiesta de Juegos
      </footer>

      {/* Avatar Picker Modal */}
      {activePickerPlayer && (
        <AvatarPickerModal
          isOpen={!!activePickerPlayerId}
          playerName={activePickerPlayer.name}
          playerColorHex={PLAYER_COLORS[activePickerPlayer.colorIdx % PLAYER_COLORS.length].hex}
          selectedAvatar={activePickerPlayer.avatar}
          usedAvatars={playerList.filter((p) => p.id !== activePickerPlayerId).map((p) => p.avatar)}
          onSelectAvatar={handleSelectAvatarForPlayer}
          onClose={() => setActivePickerPlayerId(null)}
        />
      )}

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};

