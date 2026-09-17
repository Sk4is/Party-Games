import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Play, HelpCircle, Users, Sparkles, Dices, Shuffle } from 'lucide-react';
import { LPRPlayer, LaPeorRespuestaConfig } from '../types';
import { PLAYER_COLORS, AVATARS, DEFAULT_PLAYER_NAMES, getRandomAnimalAvatar } from '../data/players';
import { SoundToggle } from './SoundToggle';
import { AvatarPickerModal } from './AvatarPickerModal';
import { audio } from '../utils/audio';

interface LaPeorRespuestaSetupProps {
  onStartGame: (players: LPRPlayer[], config: LaPeorRespuestaConfig) => void;
  onBackToMenu: () => void;
}

export const LaPeorRespuestaSetup: React.FC<LaPeorRespuestaSetupProps> = ({
  onStartGame,
  onBackToMenu,
}) => {
  const [totalRounds, setTotalRounds] = useState<number>(10);
  const [activePickerPlayerId, setActivePickerPlayerId] = useState<string | null>(null);

  // Start with 4 default players with distinct avatars
  const [playerList, setPlayerList] = useState<
    Array<{ id: string; name: string; avatar: string; colorIdx: number }>
  >(() => {
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
    if (playerList.length <= 3) {
      setErrorMsg('Se necesitan al menos 3 jugadores para La Peor Respuesta.');
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

  const handleRandomizeAllAvatars = () => {
    const assigned: string[] = [];
    const randomized = playerList.map((p) => {
      const avatar = getRandomAnimalAvatar(assigned);
      assigned.push(avatar);
      return { ...p, avatar };
    });
    setPlayerList(randomized);
    audio.playCardFlip();
  };

  const handleStart = () => {
    if (playerList.length < 3) {
      setErrorMsg('Se necesitan al menos 3 jugadores para jugar a La Peor Respuesta.');
      return;
    }

    const finalPlayers: LPRPlayer[] = playerList.map((p) => ({
      id: p.id,
      name: p.name.trim() || 'Jugador',
      avatar: p.avatar,
      color: PLAYER_COLORS[p.colorIdx].hex,
      score: 0,
    }));

    audio.playCardDealt();
    onStartGame(finalPlayers, { totalRounds });
  };

  const activePickerPlayer = playerList.find((p) => p.id === activePickerPlayerId);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 bg-radial from-stone-950 via-slate-950 to-black text-slate-100">
      {/* Header bar */}
      <header className="flex items-center justify-between w-full max-w-5xl mx-auto pb-6 border-b border-stone-800/80">
        <button
          type="button"
          onClick={() => {
            audio.playTurnChange();
            onBackToMenu();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>

        <div className="flex items-center gap-2 text-center">
          <span className="text-xl">💀</span>
          <span className="font-display font-black text-lg sm:text-xl text-stone-100 tracking-wider">
            LA PEOR RESPUESTA
          </span>
        </div>

        <SoundToggle />
      </header>

      {/* Main setup container */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Player List & Customization (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-stone-100 tracking-wide flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-400" />
                Jugadores ({playerList.length}/10)
              </h2>
              <p className="text-sm text-stone-400 font-medium mt-1">
                Mínimo 3 jugadores &bull; Recomendado de 3 a 6
              </p>
            </div>

            <button
              type="button"
              onClick={handleRandomizeAllAvatars}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-stone-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Aleatorizar todos los avatares"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>Avatares al azar</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold animate-shake flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Player Cards */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {playerList.map((player, idx) => {
              const color = PLAYER_COLORS[player.colorIdx];
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 transition-all shadow-md group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                    {/* Avatar with click-to-pick modal */}
                    <div className="relative group/avatar">
                      <button
                        type="button"
                        onClick={() => setActivePickerPlayerId(player.id)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform hover:scale-105 active:scale-95 shadow-md border cursor-pointer"
                        style={{
                          backgroundColor: `${color.hex}20`,
                          borderColor: `${color.hex}60`,
                        }}
                        title="Cambiar avatar animal"
                      >
                        <span>{player.avatar}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRandomizeSingleAvatar(player.id);
                        }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-800 border border-stone-600 text-stone-300 flex items-center justify-center hover:bg-amber-500 hover:text-slate-950 transition-colors shadow"
                        title="Avatar aleatorio"
                      >
                        <Dices className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      maxLength={18}
                      value={player.name}
                      onChange={(e) => handleNameChange(player.id, e.target.value)}
                      placeholder={`Jugador ${idx + 1}`}
                      className="bg-stone-950/60 border border-stone-800 focus:border-amber-400/80 rounded-xl px-3 py-2 text-stone-100 font-bold text-base w-full max-w-[220px] outline-none transition-all"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(player.id)}
                    disabled={playerList.length <= 3}
                    className={`p-2 rounded-xl border transition-all ${
                      playerList.length <= 3
                        ? 'border-transparent text-stone-700 cursor-not-allowed'
                        : 'border-stone-800 text-stone-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 cursor-pointer'
                    }`}
                    title={
                      playerList.length <= 3
                        ? 'Mínimo 3 jugadores requeridos'
                        : 'Eliminar jugador'
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Player Input */}
          {playerList.length < 10 && (
            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input
                type="text"
                maxLength={18}
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                placeholder="Nombre del nuevo jugador..."
                className="flex-1 bg-stone-950/80 border border-stone-800 focus:border-amber-400 rounded-2xl px-4 py-3 text-stone-100 font-medium placeholder-stone-600 outline-none transition-all"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold border border-stone-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Añadir</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Game Settings & Instructions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Settings Box */}
          <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-6">
            <h3 className="text-lg font-black font-display text-stone-200 tracking-wide uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Configuración de la partida
            </h3>

            {/* Rounds Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Número de rondas
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[5, 10, 15, 20, -1].map((r) => {
                  const label = r === -1 ? '∞' : r.toString();
                  const isSelected = totalRounds === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        audio.playTurnChange();
                        setTotalRounds(r);
                      }}
                      className={`py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                {totalRounds === -1
                  ? 'Modo infinito: jugaréis hasta que decidáis terminar la partida.'
                  : `La partida durará ${totalRounds} rondas.`}
              </p>
            </div>

            {/* Quick Rules Summary */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 text-xs text-stone-300 space-y-2">
              <p className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                ¿Cómo se juega?
              </p>
              <ul className="space-y-1.5 text-stone-400">
                <li className="flex items-start gap-1.5">
                  <span className="text-stone-200 font-bold">1.</span>
                  <span>Aparece una <strong>Carta Negra</strong> con una frase incompleta.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-stone-200 font-bold">2.</span>
                  <span>Cada jugador escribe su <strong>peor respuesta</strong> en secreto.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-stone-200 font-bold">3.</span>
                  <span>Las cartas se barajan y se revelan una a una con un giro 3D.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-stone-200 font-bold">4.</span>
                  <span>Todos votan en secreto su favorita. <strong>¡No puedes votarte a ti mismo!</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-stone-200 font-bold">5.</span>
                  <span>La más votada se lleva <strong>+1 punto</strong>.</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Play className="w-5 h-5 fill-current ml-1" />
              <span>Empezar partida</span>
            </button>
          </div>
        </div>
      </main>

      {/* Avatar Picker Modal */}
      {activePickerPlayer && (
        <AvatarPickerModal
          isOpen={!!activePickerPlayerId}
          currentAvatar={activePickerPlayer.avatar}
          playerName={activePickerPlayer.name}
          onSelectAvatar={handleSelectAvatarForPlayer}
          onClose={() => setActivePickerPlayerId(null)}
        />
      )}
    </div>
  );
};
