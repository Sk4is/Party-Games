import React, { useState } from 'react';
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
  Sparkles,
  BookOpen,
  Trophy,
  Volume2,
  ArrowLeft,
  Shield,
  Zap,
  Coins,
  Palette,
} from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { FortunariumRulebookModal } from './FortunariumRulebookModal';
import { FortunariumPrizeTableModal } from './FortunariumPrizeTableModal';
import { FortunariumAudioModal } from './FortunariumAudioModal';

interface FortunariumLobbyProps {
  roomState: FortunariumRoomState;
  localPlayerId: string;
  onUpdateConfig: (config: Partial<FortunariumConfig>) => void;
  onSetCursorColor: (color: string) => void;
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
  const [copied, setCopied] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'normal' | 'special'>('normal');
  const [showRulebook, setShowRulebook] = useState(false);
  const [showPrizeTable, setShowPrizeTable] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = Boolean(localPlayer?.isHost);
  const connectedCount = roomState.players.filter((p) => p.isConnected).length;
  const canStart = isHost && connectedCount >= 1 && connectedCount <= 4;

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(roomState.roomCode);
      setCopied(true);
      fortunariumAudio.playButtonClick();
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="fortunarium-root font-fortunarium min-h-screen w-full bg-[#09060e] text-amber-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto select-none relative">
      {/* Warm brass & crimson casino ambient spotlight */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.14),transparent_65%),radial-gradient(ellipse_at_bottom_right,rgba(225,29,72,0.12),transparent_60%)] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-500/20">
        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            onLeaveRoom();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Salir al Menú</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowRulebook(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/35 text-amber-200 text-xs font-black transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Manual</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowPrizeTable(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/35 text-amber-200 text-xs font-black transition-all cursor-pointer active:scale-95"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Premios</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowAudioModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/35 text-amber-200 text-xs font-black transition-all cursor-pointer active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Sonido</span>
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lobby Logo + Room Code + Cursor Color + Players (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Room Header & Lobby Logo Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-stone-950/90 border border-amber-500/35 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-amber-500/25 to-stone-900 border border-amber-400/50 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                <span className="text-5xl leading-none select-none" role="img" aria-label="Slot Machine">
                  🎰
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Tragaperras de 1 a 4 Jugadores
                </span>
                <h1 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wider mt-0.5">
                  FORTUNARIUM
                </h1>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Una sola máquina física compartida en tiempo real. Superad la cuota de cada ciclo en solitario o con amigos.
                </p>
              </div>
            </div>

            {/* Room Code Box */}
            <div className="p-3.5 rounded-2xl bg-stone-900/95 border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                  Código de Sala
                </div>
                <div className="text-2xl font-mono font-black tracking-[0.22em] text-amber-300">
                  {roomState.roomCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Cursor Color Picker */}
            <div className="p-3.5 rounded-2xl bg-stone-900/75 border border-stone-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Color de tu Cursor en Tiempo Real
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  Visible para todo el equipo
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {FORTUNARIUM_CURSOR_COLORS.map((c) => {
                  const isSelected =
                    (localPlayer?.color || '').toLowerCase() === c.hex.toLowerCase();
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
                      className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                          : 'opacity-75 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 Physical Player Slots */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  Operadores en Sala ({connectedCount}/4)
                </span>
                <span className="text-emerald-400/90">1 a 4 jugadores (Solo o Cooperativo)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const p = roomState.players.find((pl) => pl.seatIndex === slotIdx);
                  const isMe = p?.id === localPlayerId;
                  return (
                    <div
                      key={slotIdx}
                      className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                        p
                          ? isMe
                            ? 'bg-amber-500/15 border-amber-400/60 shadow-md'
                            : 'bg-stone-900/90 border-stone-700/80'
                          : 'bg-stone-950/50 border-stone-800/60 border-dashed opacity-60'
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
                        className="w-10 h-10 rounded-xl bg-stone-950 border border-amber-500/30 flex items-center justify-center text-sm font-black text-amber-300 shrink-0"
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
                                <span className="text-[10px] font-bold text-amber-300">
                                  (Tú)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
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
                            <div className="text-xs font-semibold text-stone-500">
                              Puesto Libre #{slotIdx + 1}
                            </div>
                            <div className="text-[10px] text-stone-600">
                              Esperando jugador...
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
            <div className="pt-2">
              {isHost ? (
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onStartGame();
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {connectedCount === 1
                      ? 'Encender el Fortunarium (Modo Solitario)'
                      : `Encender el Fortunarium (${connectedCount} Jugadores)`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-3 px-4 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs font-semibold text-amber-300/90">
                  Esperando a que el anfitrión inicie la máquina...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Configuration & Ordered Symbol Guide (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Machine Rules & Settings */}
          <div className="p-5 sm:p-6 rounded-3xl bg-stone-950/90 border border-amber-500/30 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-fortunarium text-amber-300 tracking-wide">
                  CALIBRACIÓN DE LA PARTIDA
                </h2>
              </div>
              {!isHost && (
                <span className="text-xs text-stone-400">
                  Configurado por el anfitrión
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Quotas / Infinite Mode (Section 36) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-300">
                  CANTIDAD DE CUOTAS
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800">
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
                          ? 'bg-amber-500 text-stone-950 shadow'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-300">
                  Exigencia del Casino
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800">
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
                          ? 'bg-amber-500 text-stone-950 shadow'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turn Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-stone-300">
                  Control de Palanca
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800">
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
                          ? 'bg-amber-500 text-stone-950 shadow'
                          : 'text-stone-400 hover:text-white'
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
              <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-start gap-2.5">
                <Coins className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-snug">
                  <strong className="text-white block">Caja Común y Estadísticas</strong>
                  El dinero es de todos, pero cada tirada registra quién genera más fortuna o quién arruina al grupo.
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-snug">
                  <strong className="text-white block">Integridad Mecánica</strong>
                  Las Bombas y Calaveras dañan la máquina. Usad Llaves y el Taller antes de que llegue al 0%.
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/70 border border-stone-800 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-stone-300 leading-snug">
                  <strong className="text-white block">Voltaje y Patrones</strong>
                  Combinad líneas, columnas triples y plenos en la cuadrícula 3×5 con multiplicadores de Rayo.
                </div>
              </div>
            </div>
          </div>

          {/* Canonical Symbol Encyclopedia (Ordered Highest to Lowest Value) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-stone-950/90 border border-amber-500/30 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-fortunarium text-amber-300 tracking-wide">
                  SÍMBOLOS Y PREMIOS (MAYOR A MENOR VALOR)
                </h2>
              </div>

              <div className="flex p-1 rounded-xl bg-stone-900 border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    setActiveGuideTab('normal');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeGuideTab === 'normal'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-white'
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
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-white'
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
                      className="p-2.5 rounded-2xl bg-stone-900/85 border border-stone-800 flex flex-col items-center text-center gap-1 relative"
                    >
                      <span className="absolute top-1.5 left-2 text-[10px] font-black text-amber-400/75">
                        #{idx + 1}
                      </span>
                      <div className="w-11 h-11 rounded-xl bg-stone-950 border border-amber-500/20 p-1 flex items-center justify-center">
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-xs font-black text-white">{sym.name}</div>
                      <div className="text-[11px] font-mono font-bold text-amber-300 tabular-nums">
                        3x:{sym.basePayout3} CR · 4x:{sym.basePayout4} CR · 5x:{sym.basePayout5} CR
                      </div>
                      <div className="text-[10px] text-emerald-300/90 font-medium leading-tight">
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
                      className="p-2.5 rounded-2xl bg-stone-900/85 border border-stone-800 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-stone-950 border border-amber-500/25 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={sym.asset}
                          alt={sym.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-amber-300">
                          {sym.name}
                        </div>
                        <p className="text-[11px] text-stone-300 leading-tight mt-0.5">
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
