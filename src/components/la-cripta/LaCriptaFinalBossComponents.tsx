import React, { useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import {
  CriptaDungeonCompletionSummary,
  CriptaDungeonId,
  CriptaExpeditionState,
  CriptaPlayer,
  CriptaRunStats,
} from '../../types/laCripta';
import { CRIPTA_DUNGEONS_REGISTRY } from '../../data/la-cripta/criptaCatalog';
import { LaCriptaDoorCounterBadge } from './LaCriptaItemRelicArt';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

/**
 * Physical Final Boss Gate in the Door Chamber when completedDoorCount === 3 (Requirements 6 & 7).
 * The 3 normal doors are dark/sealed on the sides, and the colossal central gate
 * "EL CORAZÓN DE LA CRIPTA" unlocks as the physical interaction.
 */
export const LaCriptaFinalBossDoorChamber: React.FC<{
  completedDungeonIds?: CriptaDungeonId[];
  completedBiomes?: CriptaDungeonId[];
  connectedPlayers: CriptaPlayer[];
  finalBossDoorVotes: Record<string, boolean>;
  currentPlayerId: string;
  isOpening: boolean;
  onClickBossDoor: () => void;
}> = ({
  completedDungeonIds,
  completedBiomes,
  connectedPlayers = [],
  finalBossDoorVotes = {},
  currentPlayerId,
  isOpening,
  onClickBossDoor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const FALLBACK_SEAL_BIOMES: CriptaDungeonId[] = [
    'catacumbas_del_rey',
    'forja_infernal',
    'el_abismo',
  ];
  const rawCompleted =
    Array.isArray(completedDungeonIds) && completedDungeonIds.length > 0
      ? completedDungeonIds
      : Array.isArray(completedBiomes) && completedBiomes.length > 0
      ? completedBiomes
      : FALLBACK_SEAL_BIOMES;
  const resolvedCompletedDungeons: CriptaDungeonId[] = [0, 1, 2].map(
    (idx) => rawCompleted[idx] || FALLBACK_SEAL_BIOMES[idx]
  );
  const voters = connectedPlayers.filter(
    (p) => Boolean(finalBossDoorVotes[p.id] || p.votedFinalBossDoor)
  );
  const votedByMe = Boolean(
    finalBossDoorVotes[currentPlayerId] ||
      connectedPlayers.find((p) => p.id === currentPlayerId)?.votedFinalBossDoor
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-4 select-none">
      {/* Top 3 Illuminated Completed Seals Channeling Energy */}
      <div className="flex flex-col items-center gap-2">
        <LaCriptaDoorCounterBadge completedDoorCount={3} />
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-cripta-pixel text-[#E7A54A]">
          {resolvedCompletedDungeons.slice(0, 3).map((dId, idx) => {
            const dName = CRIPTA_DUNGEONS_REGISTRY[dId]?.name || dId;
            return (
              <span
                key={`${dId}_${idx}`}
                className="px-2 py-0.5 bg-[#19111D] border border-[#E7A54A]/60 text-[#FFD166]"
              >
                SELLO {idx + 1}: {dName.toUpperCase()} · ROTO
              </span>
            );
          })}
        </div>
      </div>

      {/* Chamber Composition: Darkened Normal Entrances on Flanks + Colossal Central Final Boss Door */}
      <div className="relative w-full grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        {/* Left Sealed/Extinguished Normal Door */}
        <div className="hidden md:flex flex-col items-center opacity-25 grayscale pointer-events-none">
          <svg width="110" height="150" viewBox="0 0 44 60" shapeRendering="crispEdges">
            <rect x="6" y="8" width="32" height="52" fill="#181322" />
            <rect x="10" y="12" width="24" height="48" fill="#09070D" />
            <rect x="4" y="56" width="36" height="4" fill="#282039" />
            {/* Extinguished torch */}
            <rect x="2" y="26" width="2" height="6" fill="#4A3B2C" />
            <rect x="40" y="26" width="2" height="6" fill="#4A3B2C" />
          </svg>
          <span className="mt-1 text-[9px] font-cripta-pixel text-[#D8C6A0]/40">
            UMBRAL SELLADO
          </span>
        </div>

        {/* Center 3 Columns: THE FINAL BOSS DOOR (Physical Interactive Structure) */}
        <div className="md:col-span-3 flex flex-col items-center">
          <div
            role="button"
            tabIndex={isOpening ? -1 : 0}
            aria-label="Puerta final: El Corazón de la Cripta"
            onMouseEnter={() => {
              setIsHovered(true);
              if (!isOpening) laCriptaAudio.playDoorHover();
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              if (isOpening) return;
              laCriptaAudio.playDoorVote();
              onClickBossDoor();
            }}
            onKeyDown={(e) => {
              if (isOpening) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                laCriptaAudio.playDoorVote();
                onClickBossDoor();
              }
            }}
            className={`dungeonDoorSlot group relative w-full max-w-md flex flex-col items-center cursor-pointer outline-none ${
              isOpening ? 'z-20' : ''
            }`}
            style={{
              filter:
                isOpening || isHovered || votedByMe
                  ? 'drop-shadow(0 0 28px rgba(201,59,91,0.65))'
                  : 'drop-shadow(0 0 16px rgba(231,165,74,0.35))',
            }}
          >
            {/* Colossal Pixel-Art Boss Gate SVG */}
            <svg
              viewBox="0 0 96 112"
              shapeRendering="crispEdges"
              className="w-full h-auto max-h-[320px] select-none"
            >
              {/* Energy Beams Traveling From the 3 Completed Seals Above */}
              <rect x="20" y="0" width="2" height="18" fill="#E7A54A" opacity="0.85" />
              <rect x="47" y="0" width="2" height="14" fill="#FFD166" />
              <rect x="74" y="0" width="2" height="18" fill="#E7A54A" opacity="0.85" />
              <rect x="20" y="16" width="56" height="2" fill="#E7A54A" />

              {/* Outer Monolithic Obsidian Arch */}
              <rect x="10" y="18" width="76" height="90" fill="#1C1326" />
              <rect x="14" y="14" width="68" height="6" fill="#2A1C3B" />
              <rect x="20" y="10" width="56" height="6" fill="#3D2754" />

              {/* Gold & Crimson Runic Trim */}
              <rect x="12" y="20" width="2" height="86" fill="#E7A54A" />
              <rect x="82" y="20" width="2" height="86" fill="#E7A54A" />
              <rect x="14" y="18" width="68" height="2" fill="#FFD166" />

              {/* 3 Unlocked Seal Medallions on the Arch Crown (CLACK · CLACK · CLACK) */}
              <rect x="26" y="12" width="6" height="6" fill="#FFD166" />
              <rect x="45" y="10" width="6" height="6" fill="#C93B5B" />
              <rect x="64" y="12" width="6" height="6" fill="#FFD166" />

              {/* Abyssal Interior Behind the Double Doors */}
              <rect x="18" y="24" width="60" height="82" fill="#07040A" />
              <rect
                x="24"
                y="30"
                width="48"
                height="72"
                fill={isOpening ? '#3A0B19' : '#180710'}
              />
              {/* Pulsing Eclipse Core Inside */}
              <rect
                x="38"
                y="46"
                width="20"
                height="20"
                fill={isOpening || isHovered ? '#C93B5B' : '#8F263D'}
              />
              <rect x="42" y="50" width="12" height="12" fill="#FFD166" />
              <rect x="45" y="53" width="6" height="6" fill="#09070D" />

              {/* Left Heavy Boss Door Leaf (Slides/Swings Open when isOpening or hovered) */}
              <g
                style={{
                  transform: isOpening
                    ? 'translateX(-22px)'
                    : isHovered || votedByMe
                    ? 'translateX(-6px)'
                    : 'translateX(0px)',
                  transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <rect x="18" y="24" width="30" height="82" fill="#231730" />
                <rect x="20" y="26" width="26" height="78" fill="#160E20" />
                <rect x="22" y="32" width="22" height="26" fill="#2E1D40" />
                <rect x="22" y="64" width="22" height="34" fill="#2E1D40" />
                {/* Broken Golden Seal Chain Left */}
                <rect x="30" y="58" width="18" height="4" fill="#E7A54A" />
                <rect x="42" y="54" width="4" height="12" fill="#C93B5B" />
              </g>

              {/* Right Heavy Boss Door Leaf */}
              <g
                style={{
                  transform: isOpening
                    ? 'translateX(22px)'
                    : isHovered || votedByMe
                    ? 'translateX(6px)'
                    : 'translateX(0px)',
                  transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <rect x="48" y="24" width="30" height="82" fill="#231730" />
                <rect x="50" y="26" width="26" height="78" fill="#160E20" />
                <rect x="52" y="32" width="22" height="26" fill="#2E1D40" />
                <rect x="52" y="64" width="22" height="34" fill="#2E1D40" />
                {/* Broken Golden Seal Chain Right */}
                <rect x="48" y="58" width="18" height="4" fill="#E7A54A" />
                <rect x="50" y="54" width="4" height="12" fill="#C93B5B" />
              </g>

              {/* Twin Crimson/Violet Void Braziers */}
              <rect x="4" y="48" width="4" height="14" fill="#3E2D4A" />
              <rect x="3" y="42" width="6" height="6" fill="#C93B5B" />
              <rect x="5" y="40" width="2" height="4" fill="#FFD166" />

              <rect x="88" y="48" width="4" height="14" fill="#3E2D4A" />
              <rect x="87" y="42" width="6" height="6" fill="#C93B5B" />
              <rect x="89" y="40" width="2" height="4" fill="#FFD166" />

              {/* Threshold Steps */}
              <rect x="6" y="106" width="84" height="3" fill="#2A1C3B" />
              <rect x="2" y="109" width="92" height="3" fill="#E7A54A" />
            </svg>

            {/* Clack Seal Status + Boss Area Title */}
            <div className="mt-2 text-center">
              <div className="text-[10px] font-cripta-pixel font-bold tracking-widest text-[#C93B5B] uppercase">
                ✦ CLACK · CLACK · CLACK — LOS TRES SELLOS HAN CAÍDO ✦
              </div>
              <h2 className="font-cripta-display text-xl sm:text-3xl font-black tracking-widest text-[#FFD166] uppercase mt-0.5">
                EL CORAZÓN DE LA CRIPTA
              </h2>
              <p className="text-xs font-cripta-pixel text-[#D9D0BC]/85 mt-0.5">
                Haz clic en la Puerta Ancestral para cruzar el umbral final
              </p>

              {/* Voter Indicators */}
              {voters.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {voters.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#140F1A] border text-[10px] font-cripta-pixel text-[#FFD166]"
                      style={{ borderColor: v.color }}
                    >
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                      <span>{v.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sealed/Extinguished Normal Door */}
        <div className="hidden md:flex flex-col items-center opacity-25 grayscale pointer-events-none">
          <svg width="110" height="150" viewBox="0 0 44 60" shapeRendering="crispEdges">
            <rect x="6" y="8" width="32" height="52" fill="#181322" />
            <rect x="10" y="12" width="24" height="48" fill="#09070D" />
            <rect x="4" y="56" width="36" height="4" fill="#282039" />
            <rect x="2" y="26" width="2" height="6" fill="#4A3B2C" />
            <rect x="40" y="26" width="2" height="6" fill="#4A3B2C" />
          </svg>
          <span className="mt-1 text-[9px] font-cripta-pixel text-[#D8C6A0]/40">
            UMBRAL SELLADO
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Dungeon Completion Summary (Requirement 26):
 * Shown when a normal dungeon (Door 1, 2, or 3) is completed before returning to the Door Chamber.
 */
export const LaCriptaDungeonCompletionBanner: React.FC<{
  summary: CriptaDungeonCompletionSummary;
  isSolo: boolean;
  iAmReady: boolean;
  readyCount: number;
  totalConnected: number;
  onExitDungeonToDoors: () => void;
}> = ({
  summary,
  isSolo,
  iAmReady,
  readyCount,
  totalConnected,
  onExitDungeonToDoors,
}) => {
  return (
    <div className="p-4 bg-[#160F21] border-2 border-[#FFD166] shadow-[0_0_32px_rgba(231,165,74,0.3)] flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-2">
        <div>
          <div className="text-[10px] font-cripta-pixel font-bold tracking-widest text-[#5EA87A] uppercase">
            ✦ MAZMORRA SUPERADA · PUERTA {summary.doorNumberCompleted} / 3 ✦
          </div>
          <h2 className="font-cripta-display text-lg sm:text-2xl font-black text-[#FFD166] uppercase">
            {summary.dungeonName}
          </h2>
        </div>

        <LaCriptaDoorCounterBadge completedDoorCount={summary.doorNumberCompleted} compact />
      </div>

      {/* Compact 4-Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 bg-[#09070D] border border-[#282039]">
          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">ORO CONSEGUIDO</div>
          <div className="font-cripta-mono text-sm font-bold text-[#E7A54A]">
            +{summary.goldEarned}
          </div>
        </div>
        <div className="p-2 bg-[#09070D] border border-[#282039]">
          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">OBJETOS</div>
          <div className="font-cripta-mono text-sm font-bold text-[#D9D0BC]">
            {summary.itemsFound}
          </div>
        </div>
        <div className="p-2 bg-[#09070D] border border-[#282039]">
          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">RELIQUIAS</div>
          <div className="font-cripta-mono text-sm font-bold text-[#B57CFF]">
            {summary.relicsFound}
          </div>
        </div>
        <div className="p-2 bg-[#09070D] border border-[#282039]">
          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">ENEMIGOS</div>
          <div className="font-cripta-mono text-sm font-bold text-[#C93B5B]">
            {summary.enemiesDefeated}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="text-xs font-cripta-pixel text-[#D9D0BC]/85">
          {summary.doorNumberCompleted >= 3
            ? 'Los 3 sellos han caído. Regresad a la Cámara de las Puertas para despertar el Corazón de la Cripta.'
            : 'Vuestro oro, inventario, reliquias y mejoras se conservan para la siguiente puerta.'}
        </span>

        <button
          type="button"
          onClick={() => {
            laCriptaAudio.playDoorVote();
            onExitDungeonToDoors();
          }}
          className="px-4 py-2 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <span>
            {isSolo
              ? 'SALIR Y VOLVER A LAS TRES PUERTAS'
              : iAmReady
              ? `ESPERANDO AL GRUPO (${readyCount}/${totalConnected})`
              : 'SALIR Y VOLVER A LAS TRES PUERTAS'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Dramatic Boss Phase 1 -> Phase 2 Transformation Banner (Requirements 32 & 33).
 */
export const LaCriptaBossPhaseTransitionBanner: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 bg-[#0B0409]/90 flex flex-col items-center justify-center p-4 text-center animate-cripta-crit-pop">
      <svg width="72" height="72" viewBox="0 0 24 24" shapeRendering="crispEdges">
        <rect x="4" y="4" width="16" height="16" fill="#8F263D" />
        <rect x="6" y="6" width="12" height="12" fill="#C93B5B" />
        <rect x="8" y="8" width="8" height="8" fill="#FFD166" />
        <rect x="10" y="10" width="4" height="4" fill="#09070D" />
        <rect x="11" y="1" width="2" height="22" fill="#E7A54A" />
        <rect x="1" y="11" width="22" height="2" fill="#E7A54A" />
      </svg>
      <div className="mt-2 text-xs font-cripta-pixel font-bold tracking-widest text-[#C93B5B] uppercase">
        ✦ LAS CADENAS ANCESTRALES SE QUIEBRAN ✦
      </div>
      <div className="font-cripta-display text-2xl sm:text-4xl font-black tracking-widest text-[#FFD166] uppercase mt-1">
        FASE II · EL CORAZÓN DESATADO
      </div>
      <p className="mt-1 text-xs font-cripta-pixel text-[#D9D0BC] max-w-md">
        Malkorath libera su forma abisal, invoca una Esquirla del Corazón y prepara ataques contra todo el grupo.
      </p>
    </div>
  );
};

/**
 * Complete Run Victory & Authoritative Run Summary (Requirements 38 & 39).
 */
export const LaCriptaRunVictorySummaryPanel: React.FC<{
  runStats?: CriptaRunStats;
  completedDungeonIds: CriptaDungeonId[];
  partyGold: number;
  isHost: boolean;
  onNewExpedition: () => void;
  onReturnToLobby: () => void;
}> = ({
  runStats,
  completedDungeonIds,
  partyGold,
  isHost,
  onNewExpedition,
  onReturnToLobby,
}) => {
  return (
    <div className="p-4 sm:p-5 bg-[#160E20] border-2 border-[#FFD166] shadow-[0_0_44px_rgba(231,165,74,0.4)] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282039] pb-3">
        <div className="flex items-center gap-3">
          <Trophy className="w-9 h-9 text-[#FFD166] shrink-0" />
          <div>
            <div className="text-[10px] font-cripta-pixel font-bold tracking-widest text-[#5EA87A] uppercase">
              ✦ EXPEDICIÓN COMPLETADA · VICTORIA TOTAL ✦
            </div>
            <h2 className="font-cripta-display text-xl sm:text-3xl font-black text-[#FFD166] uppercase">
              ¡LA CRIPTA HA CAÍDO!
            </h2>
          </div>
        </div>

        <LaCriptaDoorCounterBadge completedDoorCount={3} />
      </div>

      {/* Completed Biomes Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]">
          3 MAZMORRAS SUPERADAS:
        </span>
        {completedDungeonIds.map((dId, idx) => (
          <span
            key={`${dId}_vic_${idx}`}
            className="px-2 py-0.5 bg-[#09070D] border border-[#E7A54A] text-[10px] font-cripta-pixel text-[#FFD166]"
          >
            {idx + 1}. {CRIPTA_DUNGEONS_REGISTRY[dId]?.name || dId}
          </span>
        ))}
      </div>

      {/* Run Statistics Grid */}
      {runStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">SALAS VISITADAS</div>
            <div className="font-cripta-mono text-sm font-bold text-[#D9D0BC]">
              {runStats.roomsVisited}
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">
              ENEMIGOS / ÉLITES
            </div>
            <div className="font-cripta-mono text-sm font-bold text-[#C93B5B]">
              {runStats.enemiesDefeated} ({runStats.elitesDefeated} élites)
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">
              ORO GANADO / GASTADO
            </div>
            <div className="font-cripta-mono text-sm font-bold text-[#E7A54A]">
              +{runStats.goldEarned} / -{runStats.goldSpent}
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">
              OBJETOS / RELIQUIAS
            </div>
            <div className="font-cripta-mono text-sm font-bold text-[#B57CFF]">
              {runStats.itemsUsed} usados · {runStats.relicsObtained} reliquias
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">DAÑO INFLIGIDO</div>
            <div className="font-cripta-mono text-sm font-bold text-[#E7A54A]">
              {runStats.damageDealt}
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">DAÑO RECIBIDO</div>
            <div className="font-cripta-mono text-sm font-bold text-[#C93B5B]">
              {runStats.damageReceived}
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">CURACIÓN TOTAL</div>
            <div className="font-cripta-mono text-sm font-bold text-[#5EA87A]">
              +{runStats.healingDone} PV
            </div>
          </div>
          <div className="p-2 bg-[#09070D] border border-[#282039]">
            <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">
              ALIADOS REVIVIDOS
            </div>
            <div className="font-cripta-mono text-sm font-bold text-[#FFD166]">
              {runStats.playersRevived}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
          Tesoro final en las arcas del grupo: <strong className="text-[#E7A54A]">{partyGold} ORO</strong>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => {
                laCriptaAudio.playDoorVote();
                onNewExpedition();
              }}
              className="px-4 py-2 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] font-cripta-pixel text-xs font-bold cursor-pointer"
            >
              NUEVA EXPEDICIÓN COMPLETA
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onReturnToLobby();
            }}
            className="px-3.5 py-2 bg-[#09070D] hover:bg-[#282039] border border-[#D8C6A0]/40 text-[#D8C6A0] font-cripta-pixel text-xs cursor-pointer"
          >
            VOLVER A PREPARACIÓN
          </button>
        </div>
      </div>
    </div>
  );
};

export const LaCriptaBossPhaseTransitionOverlay = LaCriptaBossPhaseTransitionBanner;

export const LaCriptaRunVictoryScreen: React.FC<{
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  onNewExpedition: () => void;
  onReturnToLobby: () => void;
}> = ({ expeditionState, currentPlayerId, onNewExpedition, onReturnToLobby }) => {
  const me = expeditionState.players.find((p) => p.id === currentPlayerId);
  const isHost = Boolean(me?.isHost);

  return (
    <div className="relative flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center">
      <LaCriptaRunVictorySummaryPanel
        runStats={expeditionState.runStats}
        completedDungeonIds={
          expeditionState.completedDungeonIds || expeditionState.completedBiomes || []
        }
        partyGold={expeditionState.partyGold ?? 0}
        isHost={isHost}
        onNewExpedition={onNewExpedition}
        onReturnToLobby={onReturnToLobby}
      />
    </div>
  );
};

export const LaCriptaFinalBossDoorScene: React.FC<{
  completedBiomes?: CriptaDungeonId[];
  completedDungeonIds?: CriptaDungeonId[];
  finalBossDoorVotes?: Record<string, boolean>;
  players: CriptaPlayer[];
  currentPlayerId: string;
  isUnlocking: boolean;
  onVoteBossDoor: () => void;
}> = ({
  completedBiomes,
  completedDungeonIds,
  finalBossDoorVotes = {},
  players = [],
  currentPlayerId,
  isUnlocking,
  onVoteBossDoor,
}) => {
  const connectedPlayers = players.filter((p) => p.isConnected);
  const votesMap: Record<string, boolean> = { ...finalBossDoorVotes };
  for (const p of players) {
    if (p.votedFinalBossDoor) {
      votesMap[p.id] = true;
    }
  }
  const canonicalBiomes =
    Array.isArray(completedDungeonIds) && completedDungeonIds.length > 0
      ? completedDungeonIds
      : Array.isArray(completedBiomes) && completedBiomes.length > 0
      ? completedBiomes
      : [];

  return (
    <LaCriptaFinalBossDoorChamber
      completedDungeonIds={canonicalBiomes}
      completedBiomes={canonicalBiomes}
      connectedPlayers={connectedPlayers}
      finalBossDoorVotes={votesMap}
      currentPlayerId={currentPlayerId}
      isOpening={isUnlocking}
      onClickBossDoor={onVoteBossDoor}
    />
  );
};

export const LaCriptaFinalBossRoomArt: React.FC<{
  phase: 1 | 2 | number;
}> = ({ phase }) => {
  const isPhase2 = phase === 2;
  return (
    <svg
      viewBox="0 0 160 80"
      shapeRendering="crispEdges"
      className="w-full h-full object-cover select-none"
    >
      {/* Abyssal Sky / Sanctuary Vault */}
      <rect
        x="0"
        y="0"
        width="160"
        height="80"
        fill={isPhase2 ? '#14050C' : '#0B0712'}
      />
      <rect
        x="0"
        y="52"
        width="160"
        height="28"
        fill={isPhase2 ? '#230915' : '#160E22'}
      />

      {/* Obsidian Pillars */}
      <rect x="12" y="6" width="12" height="54" fill="#1D1429" />
      <rect x="14" y="6" width="2" height="54" fill={isPhase2 ? '#C93B5B' : '#E7A54A'} />
      <rect x="136" y="6" width="12" height="54" fill="#1D1429" />
      <rect x="144" y="6" width="2" height="54" fill={isPhase2 ? '#C93B5B' : '#E7A54A'} />

      {/* Central Eclipse / Heart of the Crypt Altar */}
      <rect
        x="62"
        y="10"
        width="36"
        height="36"
        fill={isPhase2 ? '#8F263D' : '#3A2352'}
      />
      <rect
        x="68"
        y="16"
        width="24"
        height="24"
        fill={isPhase2 ? '#C93B5B' : '#E7A54A'}
      />
      <rect x="74" y="22" width="12" height="12" fill="#FFD166" />
      <rect x="77" y="25" width="6" height="6" fill="#09070D" />

      {/* Runic Floor Steps */}
      <rect x="36" y="56" width="88" height="4" fill="#2A1C3B" />
      <rect
        x="26"
        y="60"
        width="108"
        height="4"
        fill={isPhase2 ? '#C93B5B' : '#E7A54A'}
      />
    </svg>
  );
};
