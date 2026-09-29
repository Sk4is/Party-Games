import React, { useMemo } from 'react';
import {
  FortunariumRoomState,
  FortunariumUpgradeId,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_SYMBOL_ASSETS,
} from '../../data/fortunarium/fortunariumAssets';
import { RotateCcw, Home, Trophy, Skull, Wrench, Flame, Coins, Dices } from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumEndRunModalProps {
  roomState: FortunariumRoomState;
  installedUpgrades: [FortunariumUpgradeId, number][];
  onRestartMatch: () => void;
  onReturnToLobby: () => void;
}

interface RunCallout {
  id: string;
  title: string;
  playerName: string;
  playerColor: string;
  valueText: string;
  tone: 'amber' | 'emerald' | 'rose' | 'cyan';
  icon: React.ReactNode;
}

export const FortunariumEndRunModal: React.FC<FortunariumEndRunModalProps> = ({
  roomState,
  installedUpgrades,
  onRestartMatch,
  onReturnToLobby,
}) => {
  const isVictory = roomState.phase === 'VICTORY';
  const isIntegrityDefeat = roomState.defeatCause === 'integrity';
  const isInfiniteMode = roomState.totalRounds === null;
  const quotasCompleted = isVictory
    ? roomState.round
    : Math.max(0, roomState.round - 1);

  // Peak credits in match (approximate from highest player generation + starting or current money)
  const peakCredits = useMemo(() => {
    const totalGen = roomState.players.reduce(
      (acc, p) => acc + p.stats.totalMoneyGenerated,
      0
    );
    return Math.max(roomState.money, 140 + Math.round(totalGen * 0.45), roomState.biggestSingleWinInMatch);
  }, [roomState.money, roomState.players, roomState.biggestSingleWinInMatch]);

  // Dynamic Run Callouts (Section 41) — only generated from real non-zero match data
  const runCallouts = useMemo<RunCallout[]>(() => {
    const list: RunCallout[] = [];
    const players = roomState.players;
    if (players.length === 0) return list;

    // 1. MAYOR PREMIO
    const bestSingleWinPlayer = [...players].sort(
      (a, b) => b.stats.biggestSingleWin - a.stats.biggestSingleWin
    )[0];
    if (bestSingleWinPlayer && bestSingleWinPlayer.stats.biggestSingleWin > 0) {
      list.push({
        id: 'biggest_win',
        title: 'MAYOR PREMIO',
        playerName: bestSingleWinPlayer.name,
        playerColor: bestSingleWinPlayer.color,
        valueText: `+${bestSingleWinPlayer.stats.biggestSingleWin} CR en 1 tirada`,
        tone: 'amber',
        icon: <Trophy className="w-3.5 h-3.5 text-amber-300" />,
      });
    }

    // 2. MÁS RENTABLE
    const mostProfitable = [...players].sort(
      (a, b) => b.stats.netBalance - a.stats.netBalance
    )[0];
    if (mostProfitable && mostProfitable.stats.spinsTriggered > 0) {
      const nb = mostProfitable.stats.netBalance;
      list.push({
        id: 'most_profitable',
        title: 'MÁS RENTABLE',
        playerName: mostProfitable.name,
        playerColor: mostProfitable.color,
        valueText: `${nb >= 0 ? '+' : ''}${nb} CR netos`,
        tone: nb >= 0 ? 'emerald' : 'rose',
        icon: <Coins className="w-3.5 h-3.5 text-emerald-300" />,
      });
    }

    // 3. MAYOR PÉRDIDA
    const biggestLoser = [...players].sort(
      (a, b) => b.stats.totalMoneyLost - a.stats.totalMoneyLost
    )[0];
    if (biggestLoser && biggestLoser.stats.totalMoneyLost > 0) {
      list.push({
        id: 'biggest_loss',
        title: 'MAYOR GASTO / PÉRDIDA',
        playerName: biggestLoser.name,
        playerColor: biggestLoser.color,
        valueText: `-${biggestLoser.stats.totalMoneyLost} CR consumidos`,
        tone: 'rose',
        icon: <Flame className="w-3.5 h-3.5 text-rose-300" />,
      });
    }

    // 4. MÁS TIRADAS
    const mostSpins = [...players].sort(
      (a, b) => b.stats.spinsTriggered - a.stats.spinsTriggered
    )[0];
    if (mostSpins && mostSpins.stats.spinsTriggered > 0) {
      list.push({
        id: 'most_spins',
        title: 'MÁS TIRADAS',
        playerName: mostSpins.name,
        playerColor: mostSpins.color,
        valueText: `${mostSpins.stats.spinsTriggered} giros accionados`,
        tone: 'cyan',
        icon: <Dices className="w-3.5 h-3.5 text-cyan-300" />,
      });
    }

    // 5. IMÁN DE DESASTRES
    const disasterPlayer = [...players].sort(
      (a, b) =>
        b.stats.bombsTriggered +
        b.stats.skullsTriggered -
        (a.stats.bombsTriggered + a.stats.skullsTriggered)
    )[0];
    const disasterCount = disasterPlayer
      ? disasterPlayer.stats.bombsTriggered + disasterPlayer.stats.skullsTriggered
      : 0;
    if (disasterPlayer && disasterCount > 0) {
      list.push({
        id: 'disaster_magnet',
        title: 'IMÁN DE DESASTRES',
        playerName: disasterPlayer.name,
        playerColor: disasterPlayer.color,
        valueText: `${disasterPlayer.stats.bombsTriggered} Bombas · ${disasterPlayer.stats.skullsTriggered} Calaveras`,
        tone: 'rose',
        icon: <Skull className="w-3.5 h-3.5 text-rose-300" />,
      });
    }

    // 6. MECÁNICO DEL EQUIPO
    const mechanicPlayer = [...players].sort(
      (a, b) =>
        b.stats.integrityRepaired +
        b.stats.upgradesBought * 15 -
        (a.stats.integrityRepaired + a.stats.upgradesBought * 15)
    )[0];
    if (
      mechanicPlayer &&
      (mechanicPlayer.stats.integrityRepaired > 0 ||
        mechanicPlayer.stats.upgradesBought > 0)
    ) {
      list.push({
        id: 'team_mechanic',
        title: 'MECÁNICO DEL EQUIPO',
        playerName: mechanicPlayer.name,
        playerColor: mechanicPlayer.color,
        valueText: `+${mechanicPlayer.stats.integrityRepaired}% rep. · ${mechanicPlayer.stats.upgradesBought} mejoras`,
        tone: 'emerald',
        icon: <Wrench className="w-3.5 h-3.5 text-emerald-300" />,
      });
    }

    return list.slice(0, 6);
  }, [roomState.players]);

  return (
    <div className="fortunarium-root font-fortunarium fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-3xl border-2 p-5 sm:p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.95)] my-auto ${
          isVictory
            ? 'bg-gradient-to-b from-emerald-950 via-[#071a17] to-slate-950 border-emerald-400/70'
            : isIntegrityDefeat
            ? 'bg-gradient-to-b from-orange-950 via-[#1a0d07] to-slate-950 border-orange-500/70'
            : 'bg-gradient-to-b from-rose-950 via-[#1a070c] to-slate-950 border-rose-500/70'
        }`}
      >
        {/* Top Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/45 border border-white/15 text-[11px] font-mono uppercase tracking-widest text-amber-200 mb-2">
          {isVictory
            ? 'EXPEDICIÓN COMPLETADA · CUOTAS SELLADAS'
            : isIntegrityDefeat
            ? 'COLAPSO MECÁNICO · INTEGRIDAD 0%'
            : 'BANCARROTA · 0 CRÉDITOS PARA GIRAR'}
        </div>

        {/* Hero Title */}
        <h2
          className={`font-fortunarium text-3xl sm:text-5xl tracking-wider uppercase drop-shadow-[0_3px_0_rgba(0,0,0,0.85)] ${
            isVictory
              ? 'text-emerald-300'
              : isIntegrityDefeat
              ? 'text-orange-300'
              : 'text-rose-300'
          }`}
        >
          {isVictory
            ? '¡FORTUNARIUM CONQUISTADO!'
            : isIntegrityDefeat
            ? 'MÁQUINA AVERIADA'
            : 'SIN CRÉDITOS'}
        </h2>

        <p className="mt-1 font-fortunarium text-sm sm:text-lg text-amber-200 tracking-wide">
          {isVictory
            ? 'HABÉIS SELLADO TODAS LAS CUOTAS DE LA CÁMARA'
            : isIntegrityDefeat
            ? 'LA INTEGRIDAD DEL FORTUNARIUM HA LLEGADO A CERO.'
            : 'LA FORTUNA SE HA TERMINADO. FORTUNARIUM HA CERRADO SUS PUERTAS.'}
        </p>

        {/* SECTION 42: RUN SUMMARY BLOCK */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
          <div className="p-2.5 rounded-xl bg-slate-900/85 border border-white/10">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Modo / Cuota Alcanzada
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-amber-300 tabular-nums">
              {isInfiniteMode
                ? `Cuota ${roomState.round} · ∞`
                : `Cuota ${quotasCompleted} / ${roomState.totalRounds}`}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/85 border border-white/10">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Créditos Finales / Pico
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-emerald-300 tabular-nums">
              {roomState.money} CR{' '}
              <span className="text-xs text-slate-400 font-normal">
                (Pico: {peakCredits} CR)
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/85 border border-white/10">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Tiradas / Patrones
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-cyan-300 tabular-nums">
              {roomState.totalSpinsInMatch} giros · {roomState.totalPatternsHit} pat.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/85 border border-white/10">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Mayor Premio / Integridad
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-amber-200 tabular-nums">
              +{roomState.biggestSingleWinInMatch || 0} CR{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({roomState.integrity}%)
              </span>
            </div>
          </div>
        </div>

        {/* Installed Upgrades Bar */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/75 border border-white/10 text-xs font-mono">
          <div>
            <span className="text-slate-400">MEJOR PATRÓN: </span>
            <span className="text-amber-300 font-bold">
              {roomState.bestPatternNameInMatch || '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">MEJORAS INSTALADAS:</span>
            {installedUpgrades.length === 0 ? (
              <span className="text-slate-500">Ninguna</span>
            ) : (
              installedUpgrades.map(([uId, lv]) => (
                <span
                  key={uId}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/30 text-[10px] text-amber-200 font-bold"
                >
                  <img
                    src={
                      FORTUNARIUM_SYMBOL_ASSETS[
                        FORTUNARIUM_UPGRADES_CATALOG[uId].iconSymbol
                      ]
                    }
                    alt={FORTUNARIUM_UPGRADES_CATALOG[uId].name}
                    className="w-3.5 h-3.5 object-contain"
                  />
                  {FORTUNARIUM_UPGRADES_CATALOG[uId].name} Nv.{lv}
                </span>
              ))
            )}
          </div>
        </div>

        {/* SECTION 41: DYNAMIC RUN CALLOUTS / HIGHLIGHTS */}
        {runCallouts.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 text-left mb-1.5">
              DESTACADOS DE LA PARTIDA
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
              {runCallouts.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 flex items-center gap-2.5"
                >
                  <div className="p-2 rounded-lg bg-slate-950 border border-white/10 shrink-0">
                    {c.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">
                      {c.title}
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.playerColor }}
                      />
                      <span className="text-xs font-bold text-white truncate">
                        {c.playerName}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-amber-200 truncate tabular-nums">
                      {c.valueText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTIONS 40, 43, 44: PER-PLAYER DETAILED ECONOMIC BREAKDOWN CARDS */}
        <div className="mt-3.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 text-left mb-1.5">
            BALANCE ECONÓMICO POR JUGADOR ({roomState.players.length})
          </div>
          <div className="space-y-2 text-left max-h-60 overflow-y-auto pr-1">
            {roomState.players.map((p) => {
              const net = p.stats.netBalance;
              const biggestLoss = p.stats.biggestSingleLoss || 0;
              const specialsCount =
                p.stats.specialSymbolsTriggered ??
                p.stats.bombsTriggered +
                  p.stats.skullsTriggered +
                  p.stats.coinsCollected +
                  p.stats.keysFound;
              const defusedCount = p.stats.bombsDefused || 0;
              const repairsDone = p.stats.repairsCount || 0;

              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-900/85 border border-white/12 flex flex-col gap-2"
                >
                  {/* Top row of player card: Identity + Net Balance */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/30"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-fortunarium text-base text-white tracking-wide">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 tabular-nums">
                        {p.stats.spinsTriggered} tiradas
                      </span>
                    </div>

                    <div
                      className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-extrabold tabular-nums border ${
                        net >= 0
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                          : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                      }`}
                    >
                      BALANCE NETO: {net >= 0 ? `+${net}` : net} CR
                    </div>
                  </div>

                  {/* Bottom row: 8 compact scannable stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Créditos Ganados
                      </span>
                      <span className="text-emerald-300 font-bold">
                        +{p.stats.totalMoneyGenerated} CR
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Créditos Perdidos
                      </span>
                      <span className="text-rose-300 font-bold">
                        -{p.stats.totalMoneyLost} CR
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Mejor Premio / Pérdida
                      </span>
                      <span className="text-amber-300 font-bold">
                        +{p.stats.biggestSingleWin} CR
                      </span>{' '}
                      <span className="text-rose-400">
                        / -{biggestLoss} CR
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Patrones / Especiales
                      </span>
                      <span className="text-cyan-300 font-bold">
                        {p.stats.patternsHit} pat.
                      </span>{' '}
                      <span className="text-amber-200">
                        · {specialsCount} esp.
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Bombas (Sufridas / Desact.)
                      </span>
                      <span className="text-rose-300 font-bold">
                        {p.stats.bombsTriggered}
                      </span>{' '}
                      <span className="text-emerald-300">
                        / {defusedCount} desact.
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Calaveras / Monedas
                      </span>
                      <span className="text-purple-300 font-bold">
                        {p.stats.skullsTriggered} 💀
                      </span>{' '}
                      <span className="text-amber-300">
                        · {p.stats.coinsCollected} 🪙
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Integridad (Rep. / Daño)
                      </span>
                      <span className="text-emerald-300 font-bold">
                        +{p.stats.integrityRepaired}%
                      </span>{' '}
                      <span className="text-rose-300">
                        / -{p.stats.integrityDamageCaused}%
                      </span>
                    </div>

                    <div className="px-2 py-1 rounded bg-slate-950/70 border border-white/5">
                      <span className="text-slate-400 block text-[9px] uppercase">
                        Taller (Mejoras / Rep.)
                      </span>
                      <span className="text-amber-200 font-bold">
                        {p.stats.upgradesBought} mej. · {repairsDone} rep.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 46: END SCREEN ACTIONS */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onRestartMatch();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-fortunarium text-base tracking-wider shadow-lg cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            NUEVA PARTIDA
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onReturnToLobby();
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-fortunarium text-base tracking-wider border border-white/15 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            VOLVER A LA SALA
          </button>
        </div>
      </div>
    </div>
  );
};
