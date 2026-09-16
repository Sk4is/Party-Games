import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Play, HelpCircle, Users, RefreshCw } from 'lucide-react';
import { Player } from '../types';
import { PLAYER_COLORS, AVATARS, DEFAULT_PLAYER_NAMES } from '../data/players';
import { SoundToggle } from './SoundToggle';
import { HowToPlayModal } from './HowToPlayModal';
import { audio } from '../utils/audio';

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
  onBackToMenu: () => void;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame, onBackToMenu }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Initialize with 4 default players
  const [playerList, setPlayerList] = useState<Array<{ id: string; name: string; avatar: string; colorIdx: number }>>(() => {
    return DEFAULT_PLAYER_NAMES.map((name, i) => ({
      id: `p-${i + 1}`,
      name,
      avatar: AVATARS[i % AVATARS.length],
      colorIdx: i % PLAYER_COLORS.length,
    }));
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
    const newPlayer = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: candidateName,
      avatar: AVATARS[newIdx % AVATARS.length],
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

  const handleCycleAvatar = (id: string) => {
    setPlayerList(
      playerList.map((p) => {
        if (p.id !== id) return p;
        const currentIdx = AVATARS.indexOf(p.avatar);
        const nextIdx = (currentIdx + 1) % AVATARS.length;
        return { ...p, avatar: AVATARS[nextIdx] };
      })
    );
    audio.playSpark();
  };

  const handleStartGame = () => {
    if (playerList.length < 2) {
      setErrorMsg('Añade al menos 2 jugadores para comenzar.');
      return;
    }
    if (playerList.length > 10) {
      setErrorMsg('Máximo 10 jugadores permitidos.');
      return;
    }

    // Prepare full Player objects with 3 lives each
    const initializedPlayers: Player[] = playerList.map((p, i) => {
      const colorObj = PLAYER_COLORS[p.colorIdx % PLAYER_COLORS.length];
      return {
        id: p.id,
        name: p.name.trim() || `Jugador ${i + 1}`,
        color: colorObj.hex,
        avatar: p.avatar,
        lives: 3,
        mistakes: 0,
        multiplier: 1.0,
        isEliminated: false,
        bombsReceived: 0,
        validWordsCount: 0,
        fastestAnswerTimeMs: null,
      };
    });

    audio.playAnswerAccepted();
    onStartGame(initializedPlayers);
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
            💣 La Bomba &bull; Configuración
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-display text-white tracking-wide">
            Jugadores
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-1">
            Mínimo 2 y máximo 10 jugadores. ¡Cada jugador comienza con ❤️❤️❤️ 3 vidas!
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm font-semibold text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Players List Card */}
        <div className="w-full bg-slate-900/90 border-2 border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              Lista de participantes ({playerList.length}/10)
            </span>
            <span>Vidas iniciales: 3</span>
          </div>

          <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
            {playerList.map((player, index) => {
              const colorObj = PLAYER_COLORS[player.colorIdx % PLAYER_COLORS.length];
              return (
                <div
                  key={player.id}
                  id={`player-row-${player.id}`}
                  className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 transition-all hover:border-slate-600"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar with click-to-cycle */}
                    <button
                      type="button"
                      onClick={() => handleCycleAvatar(player.id)}
                      title="Haz clic para cambiar de avatar"
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                      style={{ backgroundColor: colorObj.hex }}
                    >
                      {player.avatar}
                    </button>

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
                          className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-amber-400 rounded-xl px-3 py-1.5 text-slate-100 font-bold text-base focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Initial Lives display & Remove button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-flex text-rose-400 text-sm tracking-widest font-bold">
                      ❤️❤️❤️
                    </span>

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
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-2.5 text-slate-100 font-medium placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              <button
                id="add-player-button"
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-400 font-bold text-sm inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir jugador</span>
              </button>
            </form>
          )}
        </div>

        {/* Start Game Action */}
        <div className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>{playerList.length} jugadores listos</span>
            {playerList.length < 2 && (
              <span className="text-rose-400 ml-2 font-bold">&bull; Faltan jugadores (mínimo 2)</span>
            )}
          </div>

          <button
            id="start-game-button"
            type="button"
            onClick={handleStartGame}
            disabled={playerList.length < 2 || playerList.length > 10}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Empezar partida</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-2">
        La Bomba &bull; Fiesta de Juegos
      </footer>

      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
    </div>
  );
};
