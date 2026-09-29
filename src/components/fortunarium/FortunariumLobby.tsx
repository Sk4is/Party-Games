import React, { useState, useEffect } from 'react';
import {
  FortunariumRoomState,
  FortunariumConfig,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  NORMAL_SYMBOLS_BY_VALUE_DESC,
  SPECIAL_SYMBOL_IDS,
  FORTUNARIUM_CURSOR_COLORS,
} from '../../data/fortunarium/fortunariumAssets';
import {
  Copy,
  Check,
  Play,
  Users,
  Settings,
  ArrowLeft,
  Trophy,
  Shield,
  Zap,
  Coins,
  BookOpen,
  Sliders,
} from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { FortunariumRulebookModal } from './FortunariumRulebookModal';
import { FortunariumPrizeTableModal } from './FortunariumPrizeTableModal';
import { FortunariumAudioModal } from './FortunariumAudioModal';

interface FortunariumLobbyProps {
  roomState: FortunariumRoomState;
  localPlayerId: string;
  onUpdateConfig: (config: Partial<FortunariumConfig>) => void;
  onSetCursorColor?: (color: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const FortunariumLobby: React.FC<FortunariumLobbyProps> = ({
  roomState,
  localPlayerId,
  onUpdateConfig,
  onSetCursorColor,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'normal' | 'special'>('normal');
  const [showRulebook, setShowRulebook] = useState(false);
  const [showPrizeTable, setShowPrizeTable] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = Boolean(localPlayer?.isHost);
  const connectedCount = roomState.players.filter((p) => p.isConnected).length;
  const canStart = connectedCount >= 1;

  useEffect(() => {
    fortunariumAudio.startMusicLoop('lobby');
    return () => {
      fortunariumAudio.stopMusicLoop();
    };
  }, []);

  const handleCopyCode = async () => {
    try {
      fortunariumAudio.playButtonClick();
      await navigator.clipboard.writeText(roomState.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      fortunariumAudio.playButtonClick();
      const url = new URL(window.location.href);
      url.searchParams.set('game', 'fortunarium');
      url.searchParams.set('room', roomState.roomCode);
      await navigator.clipboard.writeText(url.toString());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <div className="fortunarium-root font-fortunarium fort-lobby-bg relative min-h-screen w-full text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-x-hidden">
      {/* Top Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#FF2A6D]/30">
        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            onLeaveRoom();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0E1628] border border-[#FF2A6D]/45 hover:border-[#FF2A6D] text-slate-100 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-[0_0_16px_rgba(255,42,109,0.2)]"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF2A6D]" />
          <span>Salir al Menú</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowPrizeTable(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0E1628] border border-amber-400/45 hover:border-amber-400 text-amber-200 text-xs font-black transition-all cursor-pointer shadow-md"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Tabla de Premios</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowRulebook(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0E1628] border border-cyan-400/45 hover:border-cyan-400 text-cyan-200 text-xs font-black transition-all cursor-pointer shadow-md"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Manual</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowAudioModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0E1628] border border-[#FF2A6D]/45 hover:border-[#FF2A6D] text-pink-200 text-xs font-bold transition-all cursor-pointer shadow-md"
            title="Ajustes de Audio"
          >
            <Sliders className="w-4 h-4 text-[#FF2A6D]" />
            <span className="hidden sm:inline">Audio</span>
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF2A6D]/15 border border-[#FF2A6D]/45 text-[#FF7AA2] text-xs font-mono font-black tracking-wider uppercase shadow-[0_0_15px_rgba(255,42,109,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#FF2A6D] animate-ping" />
            <span>FORTUNARIUM · 1–4 JUGADORES</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Machine Identity, Room Code & Players (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Canonical Lobby Logo Card */}
          <div className="relative p-6 rounded-2xl fort-cyber-modal overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-[#FF2A6D]/30 via-[#120A1A] to-[#050810] border-2 border-[#FF2A6D]/70 p-2 shadow-[0_0_30px_rgba(255,42,109,0.35)] shrink-0 flex items-center justify-center">
                <span className="text-5xl leading-none select-none" role="img" aria-label="Fortunarium">
                  🎰
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF2A6D] block">
                  UNIDAD INDUSTRIAL COMPARTIDA
                </span>
                <h1 className="text-2xl sm:text-3xl font-fortunarium text-white tracking-wider drop-shadow-[0_0_12px_rgba(255,42,109,0.45)]">
                  FORTUNARIUM
                </h1>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Todos compartís la misma máquina, caja común, integridad y mejoras. ¡Sellad las cuotas antes de fundir el chasis!
                </p>
              </div>
            </div>

            {/* Room Code Box (CRT Readout) */}
            <div className="mt-5 p-4 rounded-xl fort-crt-display border border-[#FF2A6D]/45 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative z-10 text-center sm:text-left">
                <div className="text-[10px] uppercase tracking-widest text-cyan-300/90 font-mono font-bold">
                  CÓDIGO DE SALA
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-[0.25em] text-[#FF2A6D] drop-shadow-[0_0_12px_rgba(255,42,109,0.55)]">
                  {roomState.roomCode}
                </div>
              </div>

              <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF2A6D]/20 hover:bg-[#FF2A6D]/35 border border-[#FF2A6D]/55 text-pink-100 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#FF2A6D]" />
                      <span>Código</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/45 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Enlace Listo</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Invitar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Real-time Cursor Color Picker */}
            {onSetCursorColor && localPlayer && (
              <div className="mt-4 p-3 rounded-xl fort-crt-panel flex items-center justify-between gap-2">
                <span className="relative z-10 text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
                  Color de tu Cursor:
                </span>
                <div className="relative z-10 flex items-center gap-1.5">
                  {FORTUNARIUM_CURSOR_COLORS.map((c) => {
                    const selected =
                      localPlayer.color.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        title={c.label}
                        onClick={() => {
                          fortunariumAudio.playButtonClick();
                          onSetCursorColor(c.hex);
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          selected
                            ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {selected && (
                          <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Players List (1 to 4 seats) */}
            <div className="mt-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[#FF7AA2]">
                  <Users className="w-4 h-4 text-[#FF2A6D]" />
                  Operadores en la Máquina ({connectedCount}/4)
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  1 a 4 Jugadores
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const p = roomState.players.find((pl) => pl.seatIndex === slotIdx);
                  const isMe = p?.id === localPlayerId;
                  return (
                    <div
                      key={slotIdx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        p
                          ? isMe
                            ? 'bg-[#FF2A6D]/15 border-[#FF2A6D]/65 shadow-[0_0_16px_rgba(255,42,109,0.2)]'
                            : 'bg-[#070B14]/90 border-cyan-500/30'
                          : 'bg-[#04070E]/60 border-slate-800/70 border-dashed opacity-60'
                      }`}
                    >
                      <div
                        style={
                          p
                            ? {
                                borderColor: p.color,
                                backgroundColor: `${p.color}22`,
                                color: p.color,
                              }
                            : undefined
                        }
                        className="w-10 h-10 rounded-xl bg-[#050811] border border-[#FF2A6D]/35 flex items-center justify-center text-sm font-black text-pink-200 shrink-0"
                      >
                        {p ? p.name.slice(0, 2).toUpperCase() : `#${slotIdx + 1}`}
                      </div>
                      <div className="min-w-0 flex-1">
                        {p ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="font-bold text-sm text-white truncate">
                                {p.name}
                              </span>
                              {isMe && (
                                <span className="text-[10px] font-black text-[#FF2A6D]">
                                  (Tú)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span>{p.isHost ? 'Jefe de Sala' : `Operador ${slotIdx + 1}`}</span>
                              <span>·</span>
                              <span
                                className={
                                  p.isConnected ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {p.isConnected ? 'Conectado' : 'Reconectando...'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-semibold text-slate-500">
                              Puesto Libre #{slotIdx + 1}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              Esperando operador...
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Match CTA */}
            <div className="pt-4">
              {isHost ? (
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onStartGame();
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF2A6D] via-[#E01E5A] to-[#FF2A6D] hover:from-[#FF4782] hover:to-[#FF2A6D] border border-[#FF7AA2]/60 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(255,42,109,0.42)] cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {connectedCount === 1
                      ? 'Encender el Fortunarium (Modo Solitario)'
                      : `Encender el Fortunarium (${connectedCount} Jugadores)`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-xl fort-crt-panel text-center text-xs font-mono font-bold text-cyan-300">
                  Esperando a que el anfitrión accione el interruptor...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Configuration & Ordered Symbol Guide (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Machine Rules & Settings */}
          <div className="fort-cyber-modal p-5 sm:p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#FF2A6D]/25 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FF2A6D]" />
                <h2 className="text-lg font-fortunarium text-white tracking-wide">
                  CALIBRACIÓN DE LA PARTIDA
                </h2>
              </div>
              {!isHost && (
                <span className="text-xs font-mono text-cyan-300/80">
                  Configurado por el anfitrión
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Quotas / Infinite Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
                  CANTIDAD DE CUOTAS
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#050811] border border-slate-800">
                  {(
                    [
                      { val: 5, label: '5', title: '5 cuotas' },
                      { val: 10, label: '10', title: '10 cuotas' },
                      { val: 15, label: '15', title: '15 cuotas' },
                      { val: 20, label: '20', title: '20 cuotas' },
                      { val: null, label: '∞', title: 'Cuotas ilimitadas' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={String(item.val)}
                      type="button"
                      title={item.title}
                      disabled={!isHost}
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onUpdateConfig({ totalRounds: item.val });
                      }}
                      className={`py-2 px-1 rounded-lg text-xs sm:text-sm font-mono font-black transition-all cursor-pointer disabled:cursor-default tabular-nums ${
                        roomState.config.totalRounds === item.val
                          ? 'bg-[#FF2A6D] text-white shadow-[0_0_12px_rgba(255,42,109,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
                  EXIGENCIA DEL CASINO
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#050811] border border-slate-800">
                  {(
                    [
                      { id: 'normal', label: 'Normal' },
                      { id: 'dificil', label: 'Difícil' },
                      { id: 'temerario', label: 'Letal' },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onUpdateConfig({ difficulty: d.id });
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                        roomState.config.difficulty === d.id
                          ? 'bg-[#FF2A6D] text-white shadow-[0_0_12px_rgba(255,42,109,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turn Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
                  CONTROL DE PALANCA
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#050811] border border-slate-800">
                  {(
                    [
                      { id: 'turns', label: 'Por Turnos' },
                      { id: 'free', label: 'Libre' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onUpdateConfig({ turnMode: m.id });
                      }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                        roomState.config.turnMode === m.id
                          ? 'bg-[#FF2A6D] text-white shadow-[0_0_12px_rgba(255,42,109,0.5)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Core Pillars Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl fort-crt-panel flex items-start gap-2.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 relative z-10" />
                <div className="text-xs text-slate-300 leading-snug relative z-10">
                  <strong className="text-amber-300 block">Caja Común y Cuotas</strong>
                  El dinero es de todos y nunca se reinicia al sellar cuota. ¡Gestionad bien cada crédito!
                </div>
              </div>
              <div className="p-3 rounded-xl fort-crt-panel flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 relative z-10" />
                <div className="text-xs text-slate-300 leading-snug relative z-10">
                  <strong className="text-emerald-300 block">Integridad Mecánica</strong>
                  El coste de reparación sube con cada cuota y uso. Usad Llaves y el Taller antes del 0%.
                </div>
              </div>
              <div className="p-3 rounded-xl fort-crt-panel flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 relative z-10" />
                <div className="text-xs text-slate-300 leading-snug relative z-10">
                  <strong className="text-cyan-300 block">Valor Base × Patrón</strong>
                  Cada símbolo tiene su Valor Base (CR) que se multiplica por el patrón y las mejoras (hasta Nv. 10).
                </div>
              </div>
            </div>
          </div>

          {/* Canonical Symbol Encyclopedia (Ordered Highest to Lowest Value) */}
          <div className="p-5 sm:p-6 rounded-2xl fort-cyber-modal flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#FF2A6D]/25 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FF2A6D]" />
                <h2 className="text-lg font-fortunarium text-white tracking-wide">
                  SÍMBOLOS Y VALORES BASE (MAYOR A MENOR)
                </h2>
              </div>

              <div className="flex p-1 rounded-xl bg-[#050811] border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    setActiveGuideTab('normal');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'normal'
                      ? 'bg-[#FF2A6D] text-white shadow-[0_0_12px_rgba(255,42,109,0.45)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Normales (12)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    setActiveGuideTab('special');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'special'
                      ? 'bg-[#FF2A6D] text-white shadow-[0_0_12px_rgba(255,42,109,0.45)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Especiales (7)
                </button>
              </div>
            </div>

            {activeGuideTab === 'normal' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {NORMAL_SYMBOLS_BY_VALUE_DESC.map((symId, idx) => {
                  const sym = FORTUNARIUM_SYMBOLS[symId];
                  return (
                    <div
                      key={sym.id}
                      className="p-2.5 rounded-xl fort-crt-panel flex flex-col items-center text-center gap-1 relative"
                    >
                      <span className="absolute top-1.5 left-2 text-[10px] font-mono font-black text-[#FF2A6D] z-10">
                        #{idx + 1}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-[#040811] border border-[#FF2A6D]/30 p-1 flex items-center justify-center relative z-10">
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-xs font-black text-white relative z-10">{sym.name}</div>
                      <div className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-[11px] font-mono font-black text-amber-300 tabular-nums relative z-10">
                        Valor Base: {sym.baseSymbolValue} CR
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 tabular-nums relative z-10">
                        3×:{sym.basePayout3} · 4×:{sym.basePayout4} · 5×:{sym.basePayout5}
                      </div>
                      <div className="text-[10px] text-cyan-300/90 font-medium leading-tight relative z-10">
                        {sym.specialProperty}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SPECIAL_SYMBOL_IDS.map((symId) => {
                  const sym = FORTUNARIUM_SYMBOLS[symId];
                  return (
                    <div
                      key={sym.id}
                      className="p-2.5 rounded-xl fort-crt-panel flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#040811] border border-[#FF2A6D]/35 p-1 flex items-center justify-center shrink-0 relative z-10">
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1 relative z-10">
                        <div className="text-xs font-black text-[#FF7AA2]">
                          {sym.name}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                          {sym.specialProperty}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showRulebook && (
        <FortunariumRulebookModal isOpen={true} onClose={() => setShowRulebook(false)} />
      )}
      {showPrizeTable && (
        <FortunariumPrizeTableModal isOpen={true} onClose={() => setShowPrizeTable(false)} />
      )}
      {showAudioModal && (
        <FortunariumAudioModal isOpen={true} onClose={() => setShowAudioModal(false)} />
      )}
    </div>
  );
};
