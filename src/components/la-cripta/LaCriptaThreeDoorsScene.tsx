import React, { useState } from 'react';
import {
  AlertTriangle,
  Compass,
  Footprints,
  RotateCcw,
} from 'lucide-react';
import {
  CriptaDungeonId,
  CriptaExpeditionState,
} from '../../types/laCripta';
import {
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_DUNGEONS_REGISTRY,
} from '../../data/la-cripta/criptaCatalog';
import { LaCriptaDoorArtwork } from './LaCriptaDoorArtwork';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

interface LaCriptaThreeDoorsSceneProps {
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  onVoteDoor: (dungeonId: CriptaDungeonId) => void;
  onRetryDungeonInit?: () => void;
  onReturnToLobby: () => void;
  onRerollExpedition: () => void;
}

export const LaCriptaThreeDoorsScene: React.FC<LaCriptaThreeDoorsSceneProps> = ({
  expeditionState,
  currentPlayerId,
  onVoteDoor,
  onRetryDungeonInit,
  onReturnToLobby,
  onRerollExpedition,
}) => {
  const [hoveredDoorId, setHoveredDoorId] = useState<CriptaDungeonId | null>(null);

  const connectedPlayers = expeditionState.players.filter((p) => p.isConnected);
  const totalConnected = Math.max(1, connectedPlayers.length);
  const isSolo = totalConnected === 1;
  const me = expeditionState.players.find((p) => p.id === currentPlayerId);
  const isHost = Boolean(me?.isHost);
  const myVotedDoor = expeditionState.doorVotes[currentPlayerId] || null;

  const isOpeningPhase =
    expeditionState.phase === 'ENTERING_DUNGEON' ||
    expeditionState.phase === 'DOOR_OPENING';

  const isInsideDungeonPhase =
    expeditionState.phase === 'DUNGEON' ||
    expeditionState.phase === 'DUNGEON_ARRIVAL';

  // ===========================================================================
  // DUNGEON ROOM 1: INSIDE THE SELECTED DUNGEON
  // ===========================================================================
  if (isInsideDungeonPhase && expeditionState.selectedDungeonId) {
    const chosenDungeon = CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId];
    const currentNode =
      expeditionState.generatedNodes.find((n) => n.id === expeditionState.currentNodeId) ||
      expeditionState.generatedNodes[0];
    const forwardNodes = expeditionState.generatedNodes.filter(
      (n) => currentNode?.connections.includes(n.id)
    );

    if (!chosenDungeon) return null;

    return (
      <div className="relative flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-center gap-4">
        {/* Dungeon Chamber Stage */}
        <section
          className="relative border-2 p-4 sm:p-6 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.92)]"
          style={{
            backgroundColor: '#120D17',
            borderColor: chosenDungeon.palette.glow,
            backgroundImage: `radial-gradient(circle at 50% 25%, ${chosenDungeon.palette.fog}AA 0%, #0B0A0E 85%)`,
          }}
        >
          {/* Top Chamber Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-3 mb-4">
            <div>
              <div className="text-[11px] font-cripta-pixel uppercase tracking-widest text-[#E7A54A]">
                PISO {expeditionState.floor} · SALA I · {currentNode?.title || 'UMBRAL INTERIOR'}
              </div>
              <h1
                className="font-cripta-display text-2xl sm:text-3xl font-black tracking-wider mt-0.5"
                style={{ color: chosenDungeon.palette.highlight }}
              >
                {chosenDungeon.name}
              </h1>
            </div>

            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onRerollExpedition();
                  }}
                  className="px-3 py-1.5 bg-[#19111D] hover:bg-[#282039] border border-[#E7A54A]/60 text-[#E7A54A] font-cripta-pixel text-[11px] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>OTRO CAMINO</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    onReturnToLobby();
                  }}
                  className="px-3 py-1.5 bg-[#0B0A0E] hover:bg-[#282039] border border-[#D8C6A0]/35 text-[#D8C6A0] font-cripta-pixel text-[11px] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>PREPARACIÓN</span>
                </button>
              </div>
            )}
          </div>

          {/* Illustrated Pixel-Art Interior Chamber */}
          <div
            className="relative w-full border-2 border-[#282039] bg-[#07060A] p-4 sm:p-6 flex flex-col items-center justify-between gap-5"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 45%, ${chosenDungeon.palette.glow}22 0%, #07060A 78%)`,
            }}
          >
            {/* Forward Passages inside Room 1 */}
            <div className="w-full max-w-2xl">
              <div className="text-center text-[11px] font-cripta-pixel uppercase tracking-widest text-[#D8C6A0]/80 mb-3">
                PASAJES DESCUBIERTOS EN LA PRIMERA CÁMARA
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {forwardNodes.map((node, i) => (
                  <div
                    key={node.id}
                    className="p-3 bg-[#120E18] border-2 border-[#282039] flex items-center justify-between gap-3"
                    style={{
                      borderColor: `${chosenDungeon.palette.glow}66`,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Footprints
                        className="w-4 h-4 shrink-0"
                        style={{ color: chosenDungeon.palette.glow }}
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/65">
                          RUTA {i === 0 ? 'IZQUIERDA' : 'DERECHA'} · {node.type}
                        </div>
                        <div className="font-cripta-display text-sm sm:text-base font-bold text-[#D9D0BC] truncate">
                          {node.title}
                        </div>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 text-[10px] font-cripta-pixel border shrink-0"
                      style={{
                        borderColor: chosenDungeon.palette.glow,
                        color: chosenDungeon.palette.highlight,
                      }}
                    >
                      SALA {i + 2}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Adventurers Standing Inside the Chamber Threshold */}
            <div className="flex flex-wrap items-end justify-center gap-5 sm:gap-8 py-2">
              {expeditionState.players.map((p) => {
                const charId = p.characterId ?? p.selectedCharacterId ?? null;
                const cDef = charId ? CRIPTA_CHARACTERS_CATALOG[charId] : null;
                return (
                  <div key={p.id} className="flex flex-col items-center gap-1.5">
                    {charId && (
                      <LaCriptaPixelSprite
                        characterId={charId}
                        animationState="idle"
                        size="md"
                      />
                    )}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0B0A0E] border border-[#282039]">
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-[11px] font-cripta-pixel text-[#D9D0BC]">
                        {p.name}
                      </span>
                      {cDef && (
                        <span
                          className="text-[9px] font-cripta-pixel"
                          style={{ color: cDef.accentColor }}
                        >
                          {cDef.className}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle Chamber Narrative Line */}
            <div className="text-center text-xs font-cripta-pixel text-[#D8C6A0]/80">
              {isSolo
                ? `Has cruzado el umbral de ${chosenDungeon.name}. La oscuridad se abre ante ti.`
                : `El grupo ha cruzado el umbral de ${chosenDungeon.name}.`}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // SCENE 3: THE THREE DUNGEON DOORS (CLEAN ARCHITECTURAL VIEW)
  // ===========================================================================
  const openingDungeonDef =
    isOpeningPhase && expeditionState.selectedDungeonId
      ? CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
      : null;

  return (
    <div className="relative flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-center gap-3 sm:gap-5 select-none">
      {/* Top Title Header */}
      <header className="text-center">
        <h1 className="font-cripta-display text-2xl sm:text-4xl font-black tracking-widest text-[#D8C6A0] uppercase">
          {openingDungeonDef
            ? `ENTRANDO EN ${openingDungeonDef.name}`
            : isSolo
            ? 'ELIGE TU CAMINO'
            : 'ELIGE VUESTRO CAMINO'}
        </h1>

        {!isSolo && !isOpeningPhase && !expeditionState.voteTieWarning && (
          <p className="mt-1 text-xs font-cripta-pixel text-[#D8C6A0]/65 tracking-wider">
            VOTOS DEL GRUPO: {Object.keys(expeditionState.doorVotes).length} / {totalConnected}
          </p>
        )}

        {/* Multiplayer Tie Notice */}
        {expeditionState.voteTieWarning && !isOpeningPhase && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#19111D] border border-[#E7A54A] text-xs font-cripta-pixel text-[#E7A54A]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>EMPATE EN LA VOTACIÓN · CAMBIAD VUESTRO VOTO PARA ABRIR UN CAMINO</span>
          </div>
        )}

        {/* Initialization Retry Notice (if an error ever occurs) */}
        {expeditionState.initializationError && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 px-3 py-1.5 bg-[#19111D] border border-[#C93B5B] text-xs font-cripta-pixel text-[#D9D0BC]">
            <span>{expeditionState.initializationError}</span>
            {onRetryDungeonInit && (
              <button
                type="button"
                onClick={onRetryDungeonInit}
                className="px-2.5 py-0.5 bg-[#E7A54A] text-[#0B0A0E] font-bold cursor-pointer"
              >
                REINTENTAR
              </button>
            )}
          </div>
        )}
      </header>

      {/* THREE ARCHITECTURAL DOORS SIDE-BY-SIDE */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-6 md:gap-8 items-end max-w-5xl mx-auto w-full">
        {expeditionState.offeredDungeons.map((dungeonId) => {
          const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
          if (!dungeon) return null;

          const voters = connectedPlayers.filter(
            (p) => expeditionState.doorVotes[p.id] === dungeonId
          );
          const isVotedByMe = myVotedDoor === dungeonId;
          const isThisDoorOpening =
            isOpeningPhase && expeditionState.selectedDungeonId === dungeonId;
          const isDimmedOtherDoor =
            isOpeningPhase && expeditionState.selectedDungeonId !== dungeonId;
          const isHovered = hoveredDoorId === dungeonId;

          return (
            <div
              key={dungeonId}
              role="button"
              tabIndex={isOpeningPhase ? -1 : 0}
              aria-label={`Puerta a ${dungeon.name}`}
              onMouseEnter={() => {
                setHoveredDoorId(dungeonId);
                if (!isOpeningPhase) {
                  laCriptaAudio.playDoorHover();
                }
              }}
              onMouseLeave={() => {
                setHoveredDoorId((prev) => (prev === dungeonId ? null : prev));
              }}
              onClick={() => {
                if (isOpeningPhase) return;
                laCriptaAudio.playDoorVote();
                onVoteDoor(dungeonId);
              }}
              onKeyDown={(e) => {
                if (isOpeningPhase) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  laCriptaAudio.playDoorVote();
                  onVoteDoor(dungeonId);
                }
              }}
              className={`group relative flex flex-col items-center transition-all duration-500 outline-none ${
                isDimmedOtherDoor
                  ? 'opacity-25 scale-[0.96] pointer-events-none'
                  : isThisDoorOpening
                  ? 'scale-[1.03] z-20'
                  : isVotedByMe
                  ? '-translate-y-1 cursor-pointer'
                  : 'hover:-translate-y-1 cursor-pointer'
              }`}
            >
              {/* The Physical Pixel-Art Doorway */}
              <div
                className="w-full transition-all duration-300"
                style={{
                  filter:
                    isThisDoorOpening
                      ? `drop-shadow(0 0 24px ${dungeon.palette.glow}88)`
                      : isVotedByMe || voters.length > 0
                      ? `drop-shadow(0 0 14px ${dungeon.palette.glow}55)`
                      : isHovered
                      ? `drop-shadow(0 0 10px ${dungeon.palette.highlight}44)`
                      : 'none',
                }}
              >
                <LaCriptaDoorArtwork
                  dungeon={dungeon}
                  isHovered={isHovered}
                  isVotedByMe={isVotedByMe}
                  isOpening={isThisDoorOpening}
                  voteCount={voters.length}
                />
              </div>

              {/* Dungeon Name Directly Beneath the Door */}
              <div className="mt-2.5 text-center px-1">
                <h2
                  className="font-cripta-display text-sm sm:text-lg md:text-xl font-bold tracking-wide transition-colors leading-tight"
                  style={{
                    color:
                      isThisDoorOpening || isVotedByMe || isHovered
                        ? dungeon.palette.highlight
                        : '#D9D0BC',
                  }}
                >
                  {dungeon.name}
                </h2>

                {/* Compact Player Selection Indicators */}
                <div className="mt-1.5 min-h-[22px] flex flex-wrap items-center justify-center gap-1.5">
                  {voters.map((voter) => (
                    <span
                      key={voter.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#140F1A] border text-[10px] font-cripta-pixel text-[#D9D0BC]"
                      style={{ borderColor: voter.color }}
                    >
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: voter.color }}
                      />
                      <span className="truncate max-w-[80px]">{voter.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
