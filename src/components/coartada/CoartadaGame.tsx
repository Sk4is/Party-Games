import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  ShieldAlert,
  Volume2,
  VolumeX,
  CloudRain,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { useCoartadaSocket } from '../../hooks/useCoartadaSocket';
import { CoartadaRainBackground } from './CoartadaRainBackground';
import { CoartadaLobby } from './CoartadaLobby';
import { CoartadaRoleReveal } from './CoartadaRoleReveal';
import { CoartadaPreparationView } from './CoartadaPreparationView';
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
  const [rainVolume, setRainVolumeState] = useState(() => audio.getRainVolume());
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [abortCountdown, setAbortCountdown] = useState<number | null>(null);

  const handleToggleSound = () => {
    const nextMuted = audio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleRainVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audio.setRainVolume(val);
    setRainVolumeState(val);
  };

  const {
    connectionStatus,
    roomState,
    errorMessage,
    notebookText,
    newEvidenceAlert,
    timeRemainingSeconds,
    prepSecondsRemaining,
    createRoom,
    joinRoom,
    claimRole,
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

  // Rain ambience lifecycle: active through PREPARATION, INTERROGATION, VERDICT, and CASE_REVEAL
  useEffect(() => {
    const isNoirAtmospherePhase =
      roomState &&
      (roomState.phase === 'PREPARATION' ||
        roomState.phase === 'INTERROGATION' ||
        roomState.phase === 'VERDICT' ||
        roomState.phase === 'CASE_REVEAL');

    if (isNoirAtmospherePhase) {
      audio.startRainAmbience();
    } else {
      audio.stopRainAmbience();
    }

    return () => {
      audio.stopRainAmbience();
    };
  }, [roomState?.phase]);

  // Handle automatic redirect on MATCH_ABORTED after 5 seconds
  useEffect(() => {
    if (roomState?.phase === 'MATCH_ABORTED') {
      setAbortCountdown(5);
      const interval = setInterval(() => {
        setAbortCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            leaveRoom();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setAbortCountdown(null);
    }
  }, [roomState?.phase, leaveRoom]);

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
    createRoom(10, 90);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    audio.playClick();
    joinRoom(inputCode.trim());
  };

  const handlePromptLeave = () => {
    if (
      roomState &&
      (roomState.phase === 'PREPARATION' ||
        roomState.phase === 'INTERROGATION' ||
        roomState.phase === 'VERDICT')
    ) {
      setShowLeaveModal(true);
    } else {
      leaveRoom();
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    audio.playClick();
    leaveRoom();
  };

  const currentPlayer = roomState?.players.find((p) => p.id === player.id);
  const isHost = currentPlayer?.isHost ?? false;
  const playerRole = currentPlayer?.role ?? 'DETECTIVE';

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Noir Rain & Desk Lamp Background */}
      <CoartadaRainBackground />

      {/* Global Top Header (Mobile Responsive & Never overflows) */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-3 sm:px-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-amber-500 font-bold uppercase tracking-wider">COARTADA</span>
          <span className="text-stone-600">/</span>
          <span className="text-stone-400 hidden xs:inline">1984 NOIR INVESTIGATION</span>
        </div>

        {/* Header Sound & Ambient Controls */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {/* Rain Volume Slider */}
          <div className="flex items-center gap-1.5 bg-stone-900/80 px-2 py-1 rounded-lg border border-stone-800 text-stone-400">
            <CloudRain className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-[10px] hidden sm:inline uppercase">Lluvia</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rainVolume}
              onChange={handleRainVolumeChange}
              title={`Volumen de lluvia: ${Math.round(rainVolume * 100)}%`}
              aria-label="Volumen de lluvia ambiental"
              className="w-14 sm:w-20 accent-amber-500 h-1.5 bg-stone-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Master Mute Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-950/90 border border-red-600 rounded-xl shadow-2xl text-xs font-mono text-red-200 flex items-center gap-2 animate-bounce max-w-[90vw]">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="truncate">{errorMessage}</span>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-sm bg-[#161311] border-2 border-stone-700 rounded-2xl shadow-2xl p-6 text-stone-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-950 border border-red-700/60 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif">¿ABANDONAR LA PARTIDA?</h3>
                <span className="text-[11px] font-mono text-stone-400 block">
                  El caso finalizará para ambos jugadores.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800 font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-stone-100 transition-colors cursor-pointer"
              >
                ABANDONAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW ROUTING */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center py-4 w-full px-2 sm:px-4">
        {/* VIEW 1: PRE-ROOM / INITIAL CREATE OR JOIN SCREEN */}
        {!roomState && (
          <div className="w-full max-w-md mx-auto p-3 sm:p-6 flex flex-col gap-6 animate-in fade-in duration-300">
            {/* Back to main menu */}
            <div>
              <button
                type="button"
                onClick={onBackToMenu}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-300 text-xs font-mono font-bold border border-stone-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver a FAM2PLAY
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
            currentPlayerId={player.id}
            onUpdateConfig={updateConfig}
            onClaimRole={claimRole}
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

        {/* VIEW 4: PREPARATION / READING PHASE (Requirement 18-24) */}
        {roomState && roomState.phase === 'PREPARATION' && (
          <CoartadaPreparationView
            role={playerRole}
            prepSecondsRemaining={prepSecondsRemaining}
            caseDossier={roomState.caseDossier}
            suspectDossier={roomState.suspectDossier}
            initialEvidence={roomState.revealedEvidence || []}
          />
        )}

        {/* VIEW 5: INTERROGATION (ASYMMETRIC ROLE WORKSPACES) */}
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
                onLeaveRoom={handlePromptLeave}
              />
            )}

            {playerRole === 'SOSPECHOSO' && roomState.suspectDossier && (
              <CoartadaSuspectDesk
                suspectDossier={roomState.suspectDossier}
                caseDossier={roomState.caseDossier}
                timeRemainingSeconds={timeRemainingSeconds}
                onLeaveRoom={handlePromptLeave}
              />
            )}
          </>
        )}

        {/* VIEW 6: VERDICT PHASE */}
        {roomState && roomState.phase === 'VERDICT' && (
          <CoartadaVerdictView
            role={playerRole}
            caseDossier={roomState.caseDossier}
            onSubmitVerdict={submitVerdict}
          />
        )}

        {/* VIEW 7: CASE REVEAL */}
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

        {/* VIEW 8: MATCH ABORTED (DISCONNECT / LEAVE) (Requirements 56-60) */}
        {roomState && roomState.phase === 'MATCH_ABORTED' && (
          <div className="relative z-10 w-full max-w-md mx-auto p-4 sm:p-6 text-center select-none animate-in fade-in duration-300">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#161311] border border-stone-800 shadow-2xl flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center text-3xl">
                🚪
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-serif text-stone-100">
                PARTIDA FINALIZADA
              </h2>

              <p className="text-xs sm:text-sm font-mono text-stone-300 leading-relaxed">
                {roomState.abortReason || 'El otro jugador ha abandonado la sala.'}
              </p>

              {abortCountdown !== null && (
                <div className="text-xs font-mono text-amber-400">
                  Volviendo al menú en {abortCountdown} segundos...
                </div>
              )}

              <button
                type="button"
                onClick={leaveRoom}
                className="mt-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-bold border border-stone-700 cursor-pointer transition-colors"
              >
                Volver al menú
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center text-[10px] font-mono text-stone-600 py-3">
        COARTADA &bull; Juego de deducción y coartadas para 2 jugadores &bull; 100% en castellano
      </footer>
    </div>
  );
};
