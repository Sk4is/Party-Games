import React, { useState, useEffect } from 'react';
import { useEntreToposSocket } from '../../hooks/useEntreToposSocket';
import { EntreToposLobby } from './EntreToposLobby';
import { EntreToposWritingView } from './EntreToposWritingView';
import { EntreToposDiscussionView } from './EntreToposDiscussionView';
import { EntreToposVoteRevealView } from './EntreToposVoteRevealView';
import { EntreToposMoleGuessView } from './EntreToposMoleGuessView';
import { EntreToposRoundResultsView } from './EntreToposRoundResultsView';
import { EntreToposFinalResultsView } from './EntreToposFinalResultsView';
import { HowToPlayModal } from '../HowToPlayModal';
import { SoundToggle } from '../SoundToggle';
import { MoleCustomization } from '../../types/entreTopos';
import { DEFAULT_MOLE_CUSTOMIZATION, MolePortrait } from './MolePortrait';
import { MoleCustomizerModal } from './MoleCustomizerModal';
import { ArrowLeft, HelpCircle, AlertCircle, Play, Users, LogIn } from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: any, code: string) => void;
}

export const EntreToposGame: React.FC<EntreToposGameProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  // Local player profile with persistent ID and custom mole
  const [player, setPlayer] = useState(() => {
    let id = '';
    let name = 'Sospechoso';
    try {
      id = localStorage.getItem('fam2play_player_id') || '';
      if (!id) {
        id = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem('fam2play_player_id', id);
      }
      const savedName = localStorage.getItem('fam2play_player_name');
      if (savedName) name = savedName;
    } catch {
      id = `player_${Date.now()}`;
    }

    let mole: MoleCustomization = DEFAULT_MOLE_CUSTOMIZATION;
    try {
      const raw = localStorage.getItem('entre_topos_mole_customization');
      if (raw) mole = JSON.parse(raw);
    } catch {}

    return {
      id,
      name,
      avatar: '🕵️',
      color: '#f59e0b',
      moleCustomization: mole,
    };
  });

  const [inputCode, setInputCode] = useState(initialRoomCode);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const {
    connectionStatus,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    updateMole,
    updateConfig,
    startGame,
    submitClue,
    castVote,
    moleGuessWord,
    nextRound,
    playAgain,
    leaveRoom,
  } = useEntreToposSocket({
    player,
    initialRoomCode,
    enabled: true,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  const handleCreate = async () => {
    audio.playTurnChange();
    await createRoom();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    audio.playTurnChange();
    await joinRoom(inputCode.trim().toUpperCase());
  };

  // =========================================================================
  // VIEW ROUTER BASED ON ROOM STATE
  // =========================================================================
  return (
    <div className="relative min-h-screen w-full bg-[#0a0806] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background noir comic grain atmosphere */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* TOP NAVIGATION HEADER */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-6xl mx-auto pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (roomState) {
                leaveRoom();
                onBackToMenu();
              } else {
                onBackToMenu();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <span className="font-display font-black text-amber-400 text-lg sm:text-xl tracking-wider select-none">
            ENTRE TOPOS
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cómo jugar</span>
          </button>
          <SoundToggle />
        </div>
      </header>

      {/* ERROR TOAST MESSAGE */}
      {errorMessage && (
        <div className="relative z-30 max-w-md mx-auto mb-4 p-3.5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-bounce-short">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto my-2">
        {/* 1. NOT IN ROOM YET: ROOM CREATION & JOIN VIEW */}
        {!roomState ? (
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#1e1b18]/90 border-2 border-[#3d3229] shadow-2xl flex flex-col items-center text-center animate-fade-in">
            {/* Top Mole illustration */}
            <div
              onClick={() => setShowCustomizer(true)}
              className="cursor-pointer group flex flex-col items-center mb-3"
            >
              <div className="w-28 h-28 relative transform group-hover:scale-105 transition-all">
                <MolePortrait customization={player.moleCustomization} size="lg" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mt-1 group-hover:underline">
                ✏️ Editar mi aspecto
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-display text-white tracking-wide uppercase mb-1">
              ENTRE TOPOS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mb-6">
              Todos conocen la palabra marcada excepto uno... ¿Podrás descubrir al topo antes de que él descubra la palabra?
            </p>

            {/* CREATE ROOM BUTTON */}
            <button
              type="button"
              onClick={handleCreate}
              disabled={connectionStatus === 'connecting'}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer font-display mb-4"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Crear sala nueva</span>
            </button>

            {/* DIVIDER */}
            <div className="w-full flex items-center gap-3 my-2 text-xs font-bold text-slate-500 uppercase">
              <div className="flex-1 h-px bg-white/10" />
              <span>o entra con código</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* JOIN ROOM FORM */}
            <form onSubmit={handleJoin} className="w-full flex flex-col gap-2.5 mt-2">
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO DE 5 LETRAS"
                className="w-full py-3 px-4 rounded-2xl bg-black/40 border-2 border-white/10 focus:border-amber-400 text-center font-mono font-black text-lg tracking-widest text-amber-300 placeholder-slate-500 focus:outline-none uppercase"
              />
              <button
                type="submit"
                disabled={!inputCode.trim() || connectionStatus === 'connecting'}
                className="w-full py-3.5 rounded-2xl bg-[#2b241e] hover:bg-[#3d3229] disabled:opacity-40 border border-white/10 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Entrar a la sala</span>
              </button>
            </form>
          </div>
        ) : (
          /* 2. IN ROOM: DISPATCH BY PHASE */
          <>
            {roomState.phase === 'LOBBY' && (
              <EntreToposLobby
                roomState={roomState}
                localPlayerId={player.id}
                onStartGame={startGame}
                onUpdateConfig={updateConfig}
                onUpdateMole={updateMole}
                onLeaveRoom={leaveRoom}
                onOpenHowToPlay={() => setShowHowToPlay(true)}
              />
            )}

            {roomState.phase === 'ROUND_INTRO' && (
              <div className="p-8 sm:p-12 rounded-3xl bg-[#1e1b18] border-4 border-[#3d3229] shadow-2xl flex flex-col items-center text-center max-w-lg animate-fade-in">
                <span className="text-5xl mb-3 animate-bounce">🕵️</span>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1">
                  PREPÁRATE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-display text-white uppercase tracking-wide">
                  REPARTIENDO ROLES...
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-2">
                  Un topo ha sido seleccionado secretamente por la máquina.
                </p>
                <div className="mt-5 w-12 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
            )}

            {roomState.phase === 'WRITING' && (
              <EntreToposWritingView
                roomState={roomState}
                localPlayerId={player.id}
                onSubmitClue={submitClue}
              />
            )}

            {(roomState.phase === 'DISCUSSION' || roomState.phase === 'VOTING') && (
              <EntreToposDiscussionView
                roomState={roomState}
                localPlayerId={player.id}
                onCastVote={castVote}
              />
            )}

            {roomState.phase === 'VOTE_REVEAL' && (
              <EntreToposVoteRevealView roomState={roomState} />
            )}

            {roomState.phase === 'MOLE_GUESS' && (
              <EntreToposMoleGuessView
                roomState={roomState}
                localPlayerId={player.id}
                onMoleGuessWord={moleGuessWord}
              />
            )}

            {roomState.phase === 'ROUND_RESULTS' && (
              <EntreToposRoundResultsView
                roomState={roomState}
                localPlayerId={player.id}
                onNextRound={nextRound}
                onPlayAgain={playAgain}
              />
            )}

            {roomState.phase === 'FINAL_RESULTS' && (
              <EntreToposFinalResultsView
                roomState={roomState}
                localPlayerId={player.id}
                onPlayAgain={playAgain}
                onBackToMenu={onBackToMenu}
              />
            )}

            {roomState.phase === 'MATCH_ABORTED' && (
              <div className="p-8 rounded-3xl bg-rose-950/90 border-4 border-rose-500 text-center max-w-md shadow-2xl animate-fade-in">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="text-2xl font-black uppercase text-white font-display">
                  PARTIDA INTERRUMPIDA
                </h3>
                <p className="text-xs sm:text-sm text-rose-200 mt-2 font-medium">
                  {roomState.abortReason || 'Demasiados jugadores se han desconectado.'}
                </p>
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-white text-slate-950 font-black text-xs uppercase tracking-wider"
                >
                  Volver al lobby
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 text-center text-[11px] text-slate-500 font-mono py-2">
        ENTRE TOPOS &bull; FAM2PLAY &bull; MÍNIMO 3 &bull; MÁXIMO 10 JUGADORES
      </footer>

      {/* MOLE CUSTOMIZER MODAL */}
      <MoleCustomizerModal
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        playerName={player.name}
        initialCustomization={player.moleCustomization}
        onSave={(newCustomization, newName) => {
          setPlayer((prev) => ({
            ...prev,
            moleCustomization: newCustomization,
            name: newName,
          }));
          updateMole(newCustomization, newName);
          try {
            localStorage.setItem('fam2play_player_name', newName);
            localStorage.setItem('entre_topos_mole_customization', JSON.stringify(newCustomization));
          } catch {}
        }}
      />

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        initialGame="entre-topos"
      />
    </div>
  );
};
