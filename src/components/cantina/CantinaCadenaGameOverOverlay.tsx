import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CantinaPlayer, CantinaRoomState } from '../../types/cantina';
import { CantinaCard } from './CantinaCard';
import { sortCadenaHand } from '../../utils/cadenaRules';
import { audio } from '../../utils/audio';
import { Check, Crown, RotateCcw, Sparkles, Users } from 'lucide-react';

interface CantinaCadenaGameOverOverlayProps {
  roomState: CantinaRoomState;
  localPlayerId: string;
  onRequestRematch: () => void;
  onReturnToLobby: () => void;
}

const SPARK_PARTICLES = [
  { left: '14%', delay: '0ms', duration: '2600ms', size: 5 },
  { left: '24%', delay: '320ms', duration: '2900ms', size: 4 },
  { left: '36%', delay: '180ms', duration: '2400ms', size: 6 },
  { left: '48%', delay: '540ms', duration: '2800ms', size: 4 },
  { left: '61%', delay: '90ms', duration: '2500ms', size: 5 },
  { left: '74%', delay: '410ms', duration: '3000ms', size: 6 },
  { left: '85%', delay: '260ms', duration: '2700ms', size: 4 },
];

export const CantinaCadenaGameOverOverlay: React.FC<CantinaCadenaGameOverOverlayProps> = ({
  roomState,
  localPlayerId,
  onRequestRematch,
  onReturnToLobby,
}) => {
  // Staged choreography (Requirement 23):
  // stage 1 (0..450ms): table center gold burst, final card settles, hand visibly empty
  // stage 2 (450..1100ms): celebratory headline appears over the table
  // stage 3 (1100ms+): full result card settles cleanly with standings & rematch controls
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const soundPlayedKeyRef = useRef<string>('');

  const winner = useMemo(
    () => roomState.players.find((p) => p.id === roomState.winnerPlayerId) || null,
    [roomState.players, roomState.winnerPlayerId]
  );

  const winnerDisplayName = winner?.name || roomState.winnerName || 'Jugador';

  const localPlayer = useMemo(
    () => roomState.players.find((p) => p.id === localPlayerId) || null,
    [roomState.players, localPlayerId]
  );

  const isLocalWinner = Boolean(
    roomState.winnerPlayerId && roomState.winnerPlayerId === localPlayerId
  );
  const isLocalSpectator = Boolean(!localPlayer || localPlayer.isEliminated);
  const isLocalLoser = Boolean(!isLocalWinner && !isLocalSpectator);

  useEffect(() => {
    setStage(1);
    const t2 = window.setTimeout(() => setStage(2), 450);
    const t3 = window.setTimeout(() => setStage(3), 1100);
    return () => {
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [roomState.currentRound, roomState.winnerPlayerId]);

  useEffect(() => {
    const matchKey = `${roomState.code}-${roomState.currentRound}-${roomState.winnerPlayerId || 'none'}`;
    if (soundPlayedKeyRef.current === matchKey) return;
    soundPlayedKeyRef.current = matchKey;

    if (isLocalWinner) {
      audio.playCadenaVictory();
    } else if (isLocalLoser) {
      const timer = window.setTimeout(() => {
        audio.playCadenaDefeat();
      }, 240);
      return () => window.clearTimeout(timer);
    } else {
      audio.playCadenaVictory();
    }
  }, [
    roomState.code,
    roomState.currentRound,
    roomState.winnerPlayerId,
    isLocalWinner,
    isLocalLoser,
  ]);

  // Sort standings: Winner first (0 cards), then remaining players by cardsCount ascending
  const sortedStandings = useMemo(() => {
    return [...roomState.players].sort((a, b) => {
      if (a.id === roomState.winnerPlayerId) return -1;
      if (b.id === roomState.winnerPlayerId) return 1;
      if (a.cardsCount !== b.cardsCount) return a.cardsCount - b.cardsCount;
      return a.seatIndex - b.seatIndex;
    });
  }, [roomState.players, roomState.winnerPlayerId]);

  const eligibleRematchPlayers = useMemo(
    () => roomState.players.filter((p) => p.isConnected),
    [roomState.players]
  );

  const rematchVoterIds = roomState.rematchReadyPlayerIds || [];
  const hasVotedRematch = rematchVoterIds.includes(localPlayerId);
  const readyCount = eligibleRematchPlayers.filter((p) =>
    rematchVoterIds.includes(p.id)
  ).length;
  const totalEligible = eligibleRematchPlayers.length;

  const localRemainingCards = useMemo(
    () => sortCadenaHand(localPlayer?.hand || []),
    [localPlayer?.hand]
  );
  const localRemainingCount =
    localPlayer?.cardsCount ?? localRemainingCards.length;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center p-4 pointer-events-none select-none overflow-hidden">
      <style>{`
        @keyframes cadenaBurstPulse {
          0% { transform: scale(0.55); opacity: 0; }
          35% { opacity: 0.95; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        @keyframes cadenaSparkFloat {
          0% { transform: translateY(24px) scale(0.7); opacity: 0; }
          25% { opacity: 0.9; }
          80% { opacity: 0.65; }
          100% { transform: translateY(-135px) scale(1.15); opacity: 0; }
        }
        @keyframes cadenaCrownBob {
          0%, 100% { transform: translateY(0px) rotate(-3deg) scale(1); }
          50% { transform: translateY(-5px) rotate(3deg) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cadena-spark-particle,
          .cadena-burst-ring,
          .cadena-crown-badge {
            animation: none !important;
          }
        }
      `}</style>

      {/* Backdrop that gently darkens starting in Stage 2 */}
      <div
        className={`fixed inset-0 transition-all duration-500 ${
          stage === 1
            ? 'bg-black/0 backdrop-blur-none pointer-events-none'
            : stage === 2
            ? 'bg-black/55 backdrop-blur-[3px] pointer-events-auto'
            : 'bg-black/78 backdrop-blur-md pointer-events-auto'
        }`}
      />

      {/* Stage 1..3: Table Center Gold / Amber Burst */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="cadena-burst-ring w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-amber-400/60 bg-radial from-amber-400/30 via-amber-500/10 to-transparent"
          style={{
            animation: 'cadenaBurstPulse 1150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        />
        {isLocalWinner && stage >= 2 && (
          <div className="absolute inset-0 max-w-xl mx-auto pointer-events-none">
            {SPARK_PARTICLES.map((spark, idx) => (
              <span
                key={idx}
                className="cadena-spark-particle absolute bottom-1/3 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.95)]"
                style={{
                  left: spark.left,
                  width: `${spark.size}px`,
                  height: `${spark.size}px`,
                  animation: `cadenaSparkFloat ${spark.duration} ease-out ${spark.delay} infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stage 2+ Celebratory Headline & Stage 3 Settled Result Card */}
      <div
        className={`relative z-10 w-full max-w-lg transition-all duration-500 ease-out ${
          stage === 1
            ? 'opacity-0 translate-y-6 scale-95 pointer-events-none'
            : stage === 2
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
        }`}
      >
        <div
          className={`relative rounded-3xl border-2 px-5 py-6 sm:px-7 sm:py-7 text-center transition-all duration-500 overflow-hidden ${
            isLocalWinner
              ? 'bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-stone-950 border-amber-400/80 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_55px_rgba(245,158,11,0.28)]'
              : 'bg-gradient-to-b from-stone-900/95 via-stone-950/98 to-stone-950 border-amber-600/45 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_35px_rgba(180,83,9,0.18)]'
          }`}
        >
          {/* Ambient top glow inside card */}
          <div
            className={`pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full blur-3xl ${
              isLocalWinner ? 'bg-amber-400/25' : 'bg-amber-600/15'
            }`}
          />

          {/* Crown / Emblem Badge */}
          <div className="relative mx-auto mb-3 flex items-center justify-center">
            <div
              className={`cadena-crown-badge w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-xl ${
                isLocalWinner
                  ? 'bg-gradient-to-br from-amber-400/30 via-amber-500/20 to-amber-900/30 border-amber-300 text-amber-300 shadow-amber-500/25'
                  : 'bg-stone-900/90 border-amber-500/50 text-amber-400 shadow-black/60'
              }`}
              style={{
                animation: 'cadenaCrownBob 3.2s ease-in-out infinite',
              }}
            >
              <Crown className="w-8 h-8 drop-shadow-[0_2px_10px_rgba(251,191,36,0.7)]" />
            </div>
          </div>

          {/* Headline (Stage 2 & Stage 3) */}
          {isLocalWinner ? (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-black tracking-[0.22em] text-amber-300 uppercase mb-2">
                <Sparkles className="w-3 h-3" /> MODO CADENA &middot; PARTIDA #{roomState.currentRound}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 drop-shadow-[0_2px_12px_rgba(245,158,11,0.45)] uppercase">
                ¡VICTORIA!
              </h2>
              <p className="mt-1 text-sm sm:text-base font-black tracking-[0.16em] text-amber-100 uppercase">
                TE HAS QUEDADO SIN CARTAS
              </p>
              <p className="mt-1 text-xs font-bold tracking-widest text-amber-400/90 uppercase">
                👑 {winnerDisplayName} DOMINA LA MESA
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-stone-800/90 border border-amber-500/35 text-[10px] font-black tracking-[0.2em] text-amber-300/90 uppercase mb-2">
                MODO CADENA &middot; FIN DE PARTIDA
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-stone-100 uppercase">
                FIN DE LA CADENA
              </h2>
              <p className="mt-1.5 text-base sm:text-lg font-black tracking-wider text-amber-300 uppercase drop-shadow-[0_1px_8px_rgba(245,158,11,0.35)]">
                {winnerDisplayName.toUpperCase()} GANA LA PARTIDA
              </p>
              <p className="mt-0.5 text-[11px] font-bold tracking-[0.18em] text-stone-300 uppercase">
                SE HA QUEDADO SIN CARTAS
              </p>
            </>
          )}

          {/* Stage 3 Content: Loser Remaining Cards + Final Standings + Rematch Readiness + Actions */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              stage >= 3
                ? 'max-h-[650px] opacity-100 mt-5'
                : 'max-h-0 opacity-0 mt-0 pointer-events-none'
            }`}
          >
            {/* Loser's remaining cards preview — zero scrollbars, centered overlapping fan with bounded height */}
            {isLocalLoser && localRemainingCount > 0 && (
              <div className="mb-3.5 rounded-2xl bg-stone-950/85 border border-stone-800/90 px-4 py-2.5 overflow-visible">
                <p className="text-[11px] font-black tracking-[0.16em] text-amber-200/90 uppercase mb-1.5">
                  TE QUEDABAN {localRemainingCount} CARTA{localRemainingCount === 1 ? '' : 'S'}
                </p>
                {localRemainingCards.length > 0 && (
                  <div className="relative w-full h-[84px] flex items-center justify-center overflow-visible pointer-events-none select-none">
                    {(() => {
                      const count = localRemainingCards.length;
                      const mid = (count - 1) / 2;
                      const stepPx =
                        count <= 1
                          ? 0
                          : Math.max(
                              9,
                              Math.min(28, Math.floor(256 / (count - 1)))
                            );
                      const cardScale =
                        count > 18 ? 0.82 : count > 13 ? 0.88 : count > 9 ? 0.94 : 1;
                      const maxFanAngle = Math.min(11, count * 1.35);

                      return localRemainingCards.map((c, idx) => {
                        const offsetFromMid = idx - mid;
                        const xPx = offsetFromMid * stepPx;
                        const norm =
                          count > 1 ? offsetFromMid / Math.max(1, mid) : 0;
                        const rot = norm * maxFanAngle;
                        const arcY = Math.round(norm * norm * 4);

                        return (
                          <div
                            key={c.id}
                            style={{
                              position: 'absolute',
                              transform: `translate3d(${xPx}px, ${arcY}px, 0) rotate(${rot}deg) scale(${cardScale})`,
                              transformOrigin: '50% 85%',
                              zIndex: idx + 1,
                            }}
                            className="w-12 h-[72px] opacity-92 brightness-95 pointer-events-none"
                          >
                            <CantinaCard
                              rank={c.rank}
                              mapId={roomState.config.mapId}
                              size="sm"
                              style={{ width: '48px', height: '72px' }}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Requirement 27: Final Standings Summary */}
            <div className="mb-4 text-left rounded-2xl bg-stone-950/90 border border-amber-500/25 p-3.5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black tracking-[0.18em] text-stone-400 uppercase">
                  CLASIFICACIÓN FINAL
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400/85">
                  PARTIDA #{roomState.currentRound}
                </span>
              </div>
              <div className="space-y-1.5">
                {sortedStandings.map((p: CantinaPlayer) => {
                  const isPlayerWinner = p.id === roomState.winnerPlayerId;
                  const isMe = p.id === localPlayerId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-colors ${
                        isPlayerWinner
                          ? 'bg-amber-500/15 border-amber-400/60 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.14)]'
                          : isMe
                          ? 'bg-stone-900/90 border-stone-700 text-stone-200'
                          : 'bg-stone-900/55 border-stone-800/80 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm leading-none">
                          {isPlayerWinner ? '👑' : '•'}
                        </span>
                        <span
                          className={`font-bold truncate ${
                            isPlayerWinner ? 'text-amber-300' : 'text-stone-200'
                          }`}
                        >
                          {p.avatar} {p.name}
                          {isMe ? ' (TÚ)' : ''}
                        </span>
                        {!p.isConnected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-semibold uppercase">
                            DESCONECTADO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono font-bold text-[11px]">
                        {isPlayerWinner ? (
                          <span className="text-amber-300 tracking-wider">
                            0 CARTAS &middot; GANADOR
                          </span>
                        ) : (
                          <span className="text-stone-400">
                            {p.cardsCount} CARTA{p.cardsCount === 1 ? '' : 'S'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirement 30-31: Live Rematch Readiness Row */}
            <div className="mb-5 rounded-2xl bg-stone-900/80 border border-stone-800 p-3">
              <div className="flex items-center justify-between text-[10px] font-black tracking-[0.15em] text-stone-400 uppercase mb-2 px-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  REVANCHA EN VIVO
                </span>
                <span className="text-amber-300 font-mono">
                  {readyCount}/{totalEligible} LISTOS
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {eligibleRematchPlayers.map((p) => {
                  const isReady = rematchVoterIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left transition-all duration-300 ${
                        isReady
                          ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-[1.01]'
                          : 'bg-stone-950/70 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span className="text-[11px] font-bold truncate pr-1.5">
                        {p.avatar} {p.name}
                      </span>
                      <span
                        className={`text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                          isReady
                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                            : 'bg-stone-800/90 text-stone-400'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> LISTO
                          </>
                        ) : (
                          'ESPERANDO...'
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirement 28-36: Rematch & Return to Lobby CTAs */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {!isLocalSpectator && (
                <button
                  type="button"
                  disabled={hasVotedRematch}
                  onClick={() => {
                    if (hasVotedRematch) return;
                    audio.playClick();
                    onRequestRematch();
                  }}
                  className={`flex-1 py-3.5 px-5 rounded-xl font-black text-xs sm:text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all ${
                    hasVotedRematch
                      ? 'bg-emerald-900/55 border-2 border-emerald-400/70 text-emerald-200 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.22)]'
                      : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 border-2 border-amber-200 shadow-[0_8px_25px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  {hasVotedRematch ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      ESPERANDO RIVALES... ✓
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                      JUGAR OTRA VEZ
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  audio.playClick();
                  onReturnToLobby();
                }}
                className="py-3.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white border border-stone-700/90 font-bold text-xs tracking-[0.14em] uppercase transition-all cursor-pointer active:scale-95"
              >
                VOLVER A LA SALA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
