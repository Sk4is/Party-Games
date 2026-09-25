import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, ShieldAlert, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';
import { useCoartadaSocket } from '../../hooks/useCoartadaSocket';
import { CoartadaRainBackground } from './CoartadaRainBackground';
import { CoartadaLobby } from './CoartadaLobby';
import { CoartadaRoleReveal } from './CoartadaRoleReveal';
import { CoartadaDetectiveDesk } from './CoartadaDetectiveDesk';
import { CoartadaSuspectDesk } from './CoartadaSuspectDesk';
import { CoartadaVerdictView } from './CoartadaVerdictView';
import { CoartadaRevealView } from './CoartadaRevealView';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import { audio } from '../../utils/audio';

interface CoartadaGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (
    game: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada',
    code: string
  ) => void;
}

const PLAYER_KEY = 'fiesta_coartada_player';

export const CoartadaGame: React.FC<CoartadaGameProps> = ({
  onBackToMenu,
  initialRoomCode,
  onSwitchGame,
}) => {
  // Local stored player profile
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(PLAYER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const defaultAvatars = ['🕵️', '💼', '🔍', '🎩', '📁', '📜'];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    return {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'Investigador',
      avatar: randomAvatar,
      color: '#e2e8f0',
    };
  });

  const [inputCode, setInputCode] = useState(initialRoomCode || '');
  const [isMuted, setIsMuted] = useState(() => audio.getIsMuted());

  const handleToggleSound = () => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
  };

  const {
    connectionStatus,
    roomState,
    errorMessage,
    notebookText,
    newEvidenceAlert,
    timeRemainingSeconds,
    createRoom,
    joinRoom,
    updateConfig,
    startCase,
    requestVerdictPhase,
    submitVerdict,
    newCase,
    saveNotebook,
    leaveRoom,
  } = useCoartadaSocket({
    player,
    initialRoomCode,
    enabled: true,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  // Manage gentle rain ambience audio during interrogation
  useEffect(() => {
    if (roomState?.phase === 'INTERROGATION') {
      audio.startRainAmbience();
    } else {
      audio.stopRainAmbience();
    }
    return () => {
      audio.stopRainAmbience();
    };
  }, [roomState?.phase]);

  const handleUpdateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const updated = { ...player, name: newName };
    setPlayer(updated);
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCreateRoom = () => {
    audio.playClick();
    createRoom(10);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    audio.playClick();
    joinRoom(inputCode.trim());
  };

  const currentPlayer = roomState?.players.find((p) => p.id === player.id);
  const isHost = currentPlayer?.isHost ?? false;
  const playerRole = currentPlayer?.role ?? 'DETECTIVE';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Noir Rain & Desk Lamp Background */}
      <CoartadaRainBackground />

      {/* Global Top Mini Header */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-4 pt-3 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold uppercase tracking-wider">COARTADA</span>
          <span className="text-stone-600">/</span>
          <span className="text-stone-400">1984 NOIR INVESTIGATION</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-950/90 border border-red-600 rounded-xl shadow-2xl text-xs font-mono text-red-200 flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN VIEW ROUTING */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center py-4">
        {/* VIEW 1: PRE-ROOM / INITIAL CREATE OR JOIN SCREEN */}
        {!roomState && (
          <div className="w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Back to main menu */}
            <div>
              <button
                type="button"
                onClick={onBackToMenu}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs font-mono font-bold border border-stone-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a Fiesta de Juegos
              </button>
            </div>

            {/* Entrance Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#151210] border border-stone-800 shadow-2xl relative overflow-hidden">
              <div className="mb-6 text-center">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold block mb-1">
                  JUEGO PARA 2 JUGADORES
                </span>
                <h1 className="text-4xl sm:text-5xl font-black font-serif text-stone-100 tracking-tight mb-2">
                  COARTADA
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 font-serif leading-relaxed">
                  Uno es el detective, el otro el sospechoso. Interrogatorio, coartadas y una verdad oculta bajo la lluvia.
                </p>
              </div>

              {/* Player Name Config */}
              <div className="mb-5">
                <label className="text-[10px] font-mono uppercase font-bold text-stone-400 block mb-1">
                  Tu nombre de jugador:
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={player.name}
                  onChange={handleUpdateName}
                  placeholder="Introduce tu nombre..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 text-stone-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/30 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>CREAR NUEVO CASO</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-stone-800" />
                  <span className="absolute px-3 bg-[#151210] text-[10px] font-mono text-stone-500 uppercase">
                    O ÚNETE A UNA SALA
                  </span>
                </div>

                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO (5 LETRAS)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-mono text-xs font-bold border border-stone-700 cursor-pointer transition-all"
                  >
                    Unirse
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LOBBY */}
        {roomState && roomState.phase === 'LOBBY' && (
          <CoartadaLobby
            roomCode={roomState.code}
            players={roomState.players}
            config={roomState.config}
            isHost={isHost}
            onUpdateConfig={updateConfig}
            onStartCase={startCase}
            onLeaveRoom={leaveRoom}
          />
        )}

        {/* VIEW 3: ROLE REVEAL */}
        {roomState && roomState.phase === 'ROLE_REVEAL' && (
          <CoartadaRoleReveal
            role={playerRole}
            caseTitle={roomState.caseDossier?.title}
          />
        )}

        {/* VIEW 4: INTERROGATION (ASYMMETRIC ROLE WORKSPACES) */}
        {roomState && roomState.phase === 'INTERROGATION' && (
          <>
            {playerRole === 'DETECTIVE' && roomState.caseDossier && (
              <CoartadaDetectiveDesk
                caseDossier={roomState.caseDossier}
                revealedEvidence={roomState.revealedEvidence || []}
                notebookText={notebookText}
                onSaveNotebook={saveNotebook}
                onRequestVerdict={requestVerdictPhase}
                timeRemainingSeconds={timeRemainingSeconds}
                newEvidenceAlert={newEvidenceAlert}
              />
            )}

            {playerRole === 'SOSPECHOSO' && roomState.suspectDossier && (
              <CoartadaSuspectDesk
                suspectDossier={roomState.suspectDossier}
                caseDossier={roomState.caseDossier}
                timeRemainingSeconds={timeRemainingSeconds}
              />
            )}
          </>
        )}

        {/* VIEW 5: VERDICT PHASE */}
        {roomState && roomState.phase === 'VERDICT' && (
          <CoartadaVerdictView
            role={playerRole}
            caseDossier={roomState.caseDossier}
            reconstructionQuestions={roomState.reconstructionQuestions}
            onSubmitVerdict={submitVerdict}
          />
        )}

        {/* VIEW 6: CASE REVEAL */}
        {roomState && roomState.phase === 'CASE_REVEAL' && roomState.finalTruthReveal && (
          <CoartadaRevealView
            finalTruth={roomState.finalTruthReveal}
            verdictResult={roomState.verdictResult}
            caseDossier={roomState.caseDossier}
            playerRole={playerRole}
            onNewCase={newCase}
            onLeaveRoom={leaveRoom}
          />
        )}

        {/* VIEW 7: MATCH ABORTED (DISCONNECT / LEAVE) */}
        {roomState && roomState.phase === 'MATCH_ABORTED' && (
          <div className="relative z-10 w-full max-w-md mx-auto p-6 text-center select-none animate-in fade-in duration-300">
            <div className="p-8 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center text-3xl">
                🚪
              </div>

              <h2 className="text-xl font-black font-serif text-stone-100">
                INTERROGATORIO INTERRUMPIDO
              </h2>

              <p className="text-xs font-mono text-stone-400 leading-relaxed">
                {roomState.abortReason || 'El otro jugador ha abandonado el caso.'}
              </p>

              <button
                type="button"
                onClick={leaveRoom}
                className="mt-3 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-bold border border-stone-700 cursor-pointer transition-colors"
              >
                Volver a la sala
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center text-[10px] font-mono text-stone-600 py-3">
        COARTADA &bull; Juego de investigación y deducción para 2 jugadores &bull; 100% en castellano
      </footer>
    </div>
  );
};
