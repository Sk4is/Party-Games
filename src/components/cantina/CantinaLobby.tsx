import React, { useState, useEffect, useRef } from 'react';
import {
  CantinaRoomState,
  CantinaConfig,
  CantinaMapId,
} from '../../types/cantina';
import {
  CANTINA_MAP_ASSETS,
  logCantinaMapAssetError,
} from '../../data/cantina/cantinaAssets';
import { audio } from '../../utils/audio';
import {
  Copy,
  Check,
  Users,
  Play,
  Crown,
  ShieldAlert,
  Sparkles,
  Flame,
  LogOut,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';

interface CantinaLobbyProps {
  roomState: CantinaRoomState;
  localPlayerId: string;
  onUpdateConfig: (config: Partial<CantinaConfig>) => void;
  onStartGame: () => void;
  onRequestLeave: () => void;
}

export const CantinaLobby: React.FC<CantinaLobbyProps> = ({
  roomState,
  localPlayerId,
  onUpdateConfig,
  onStartGame,
  onRequestLeave,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => audio.getIsMuted());
  const [audioVolume, setAudioVolume] = useState<number>(() => audio.getVolume());
  const [showVolumePopover, setShowVolumePopover] = useState<boolean>(false);
  const volumeControlRef = useRef<HTMLDivElement | null>(null);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const canStart = isHost && roomState.players.length >= 2;

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleMute = () => {
    const unmuted = audio.toggleMute();
    setIsAudioMuted(!unmuted);
    setAudioVolume(audio.getVolume());
  };

  const handleVolumeChange = (newVal: number) => {
    audio.setVolume(newVal);
    setAudioVolume(audio.getVolume());
    setIsAudioMuted(audio.getIsMuted());
  };

  useEffect(() => {
    if (!showVolumePopover) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(e.target as Node)
      ) {
        setShowVolumePopover(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [showVolumePopover]);

  const currentMode = roomState.config.mode;
  const currentMapId = roomState.config.mapId;

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 bg-[#0c0a09] text-stone-100 font-sans select-none overflow-y-auto">
      {/* Warm ambient lantern illumination */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),rgba(120,53,15,0.05)_45%,transparent_75%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom,rgba(180,83,9,0.06),transparent_60%)] pointer-events-none" />

      {/* Top Header Bar with Lantern Brand, Room Code, Salir & Audio */}
      <div className="relative z-20 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-stone-900/95 via-[#17120e]/95 to-stone-900/95 border border-amber-600/35 rounded-2xl px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.08)] backdrop-blur-md mb-6">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            <div className="absolute -inset-1.5 rounded-2xl bg-amber-500/25 blur-md pointer-events-none" />
            <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-800/35 to-stone-950 border border-amber-400/50 flex items-center justify-center text-2xl shadow-inner shadow-amber-500/25">
              🏮
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-amber-100 tracking-wider font-serif drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                LA CANTINA DEL FAROL
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-[10px] font-black uppercase tracking-widest text-amber-300">
                Sala de Espera
              </span>
            </div>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              Mesa clandestina de faroles y ruleta rusa &bull; 2 a 4 jugadores &bull; Revólver personal por jugador
            </p>
          </div>
        </div>

        {/* Right Controls: Room Code Badge + Salir (left of sound) + Sound Control */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="flex items-center gap-2.5 bg-stone-950/95 px-4 py-2 rounded-xl border border-amber-500/45 shadow-inner">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.18em]">
              SALA
            </span>
            <span className="text-lg sm:text-xl font-mono font-black text-amber-400 tracking-[0.2em]">
              {roomState.code}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copiar código de la mesa"
              className="p-1.5 hover:bg-stone-800 rounded-lg text-amber-300 hover:text-amber-200 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={onRequestLeave}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-stone-300 hover:text-rose-300 bg-stone-900/90 hover:bg-stone-800 rounded-xl border border-stone-700/80 transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>

          {/* Audio Control */}
          <div
            ref={volumeControlRef}
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumePopover(true)}
          >
            <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-700/40 text-amber-200 transition-colors shadow-sm">
              <button
                type="button"
                onClick={handleToggleMute}
                title={isAudioMuted ? 'Activar sonido' : 'Silenciar sonido'}
                className="flex items-center justify-center text-amber-300 hover:text-amber-100 transition-colors"
              >
                {isAudioMuted || audioVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isAudioMuted ? 0 : audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                aria-label="Volumen de la cantina"
                className="hidden sm:block w-16 h-1.5 accent-amber-400 bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>

            {showVolumePopover && (
              <div className="sm:hidden absolute right-0 top-full mt-2 px-3 py-2.5 rounded-xl bg-stone-950/95 border border-amber-600/50 shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isAudioMuted ? 0 : audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volumen"
                  className="w-24 h-1.5 accent-amber-400 bg-stone-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-amber-300 w-8 text-right">
                  {Math.round((isAudioMuted ? 0 : audioVolume) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Lobby Grid */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pb-8">
        {/* Left Column: Player Seats (4 slots) + Start Action */}
        <div className="lg:col-span-5 bg-gradient-to-b from-stone-900/90 to-[#120e0b]/95 border border-amber-900/35 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-amber-100 uppercase tracking-wider font-serif">
                    Asientos de la Mesa
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Cada jugador recibe su propio revólver de 6 recámaras
                  </p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {roomState.players.length} / 4
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const player = roomState.players[slotIdx];
                const isMe = player?.id === localPlayerId;
                return (
                  <div
                    key={slotIdx}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      player
                        ? isMe
                          ? 'bg-gradient-to-r from-amber-950/45 via-stone-900/90 to-stone-950/90 border-amber-500/60 shadow-[0_6px_20px_rgba(245,158,11,0.12)]'
                          : 'bg-stone-950/80 border-stone-800/90'
                        : 'bg-stone-950/35 border-dashed border-stone-800/70 text-stone-600'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold border transition-all ${
                          player
                            ? isMe
                              ? 'bg-amber-950/70 border-amber-400/70 text-white shadow-inner shadow-amber-500/20'
                              : 'bg-stone-900 border-amber-700/40 text-white shadow'
                            : 'border-dashed border-stone-800 text-stone-700 font-mono text-sm'
                        }`}
                      >
                        {player ? player.avatar : `#${slotIdx + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              player ? 'text-stone-100' : 'text-stone-600'
                            }`}
                          >
                            {player ? player.name : `Asiento ${slotIdx + 1} disponible`}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider text-amber-300">
                              Tú
                            </span>
                          )}
                          {player?.isHost && (
                            <span
                              title="Anfitrión de la mesa"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/15 border border-amber-400/35 text-[10px] font-bold text-amber-300"
                            >
                              <Crown className="w-3 h-3 text-amber-400" /> Host
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          {player
                            ? `Asiento ${slotIdx + 1} • Revólver listo (0/6)`
                            : 'Esperando a un tahonero...'}
                        </div>
                      </div>
                    </div>

                    {player && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            player.isConnected
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                              : 'bg-stone-600'
                          }`}
                          title={player.isConnected ? 'Conectado' : 'Desconectado'}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {roomState.players.length < 2 && (
              <div className="p-3.5 bg-amber-950/35 border border-amber-700/40 rounded-xl text-xs text-amber-200/90 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Comparte el código <strong>{roomState.code}</strong>. Se necesitan al menos 2 jugadores para abrir la partida.
                </span>
              </div>
            )}

            {/* Host Start Match Button */}
            {isHost ? (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className={`w-full py-4 px-5 rounded-xl font-black text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl ${
                  canStart
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-[1.01] active:scale-[0.99] border border-amber-300'
                    : 'bg-stone-800/80 text-stone-500 cursor-not-allowed border border-stone-700/50'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                {roomState.players.length < 2
                  ? 'Esperando jugadores (Mín. 2)'
                  : 'Empezar Partida en la Cantina'}
              </button>
            ) : (
              <div className="py-3.5 px-4 rounded-xl bg-stone-950/90 border border-amber-900/35 text-center text-xs text-amber-200/80 font-medium flex items-center justify-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Esperando a que el anfitrión reparta las cartas...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Game Mode & Map Selector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: MODO DE JUEGO */}
          <div className="bg-gradient-to-b from-stone-900/90 to-[#120e0b]/95 border border-amber-900/35 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-amber-100 uppercase tracking-wider font-serif">
                    Modo de Juego
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Define la composición del mazo de 20 cartas
                  </p>
                </div>
              </div>
              {!isHost && (
                <span className="text-[11px] text-amber-300/70 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-lg">
                  El anfitrión elige el modo
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Option 1: CLÁSICO */}
              <button
                type="button"
                disabled={!isHost}
                onClick={() => onUpdateConfig({ mode: 'CLASICO' })}
                className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  currentMode === 'CLASICO'
                    ? 'bg-gradient-to-br from-amber-950/55 via-stone-900/95 to-stone-950 border-amber-400 shadow-[0_8px_25px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/50'
                    : 'bg-stone-950/65 border-stone-800 hover:border-stone-700'
                } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black text-amber-200 tracking-wider font-serif">
                    CLÁSICO
                  </span>
                  {currentMode === 'CLASICO' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Faroles puros, lectura de rivales y nervios de acero. Sin Carta del Diablo.
                </p>
                <div className="pt-1 border-t border-stone-800/80 text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                  20 cartas: 6 J &bull; 6 Q &bull; 6 K &bull; 2 Jokers
                </div>
              </button>

              {/* Option 2: DIABLO */}
              <button
                type="button"
                disabled={!isHost}
                onClick={() => onUpdateConfig({ mode: 'DIABLO' })}
                className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  currentMode === 'DIABLO'
                    ? 'bg-gradient-to-br from-rose-950/60 via-stone-900/95 to-stone-950 border-rose-500 shadow-[0_8px_25px_rgba(244,63,94,0.22)] ring-1 ring-rose-500/50'
                    : 'bg-stone-950/65 border-stone-800 hover:border-stone-700'
                } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black text-rose-300 tracking-wider font-serif flex items-center gap-1.5">
                    DIABLO <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  {currentMode === 'DIABLO' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  La Carta del Diablo acecha en el mazo: si se revela al acusar, todos los demás disparan.
                </p>
                <div className="pt-1 border-t border-stone-800/80 text-[10px] font-bold text-rose-400/90 uppercase tracking-wider">
                  20 cartas (1 carta real pasa a ser El Diablo)
                </div>
              </button>

              {/* Option 3: CADENA */}
              <button
                type="button"
                disabled={!isHost}
                onClick={() => onUpdateConfig({ mode: 'CADENA' })}
                className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  currentMode === 'CADENA'
                    ? 'bg-gradient-to-br from-amber-950/65 via-stone-900/95 to-stone-950 border-amber-400 shadow-[0_8px_25px_rgba(245,158,11,0.24)] ring-1 ring-amber-400/60'
                    : 'bg-stone-950/65 border-stone-800 hover:border-stone-700'
                } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black text-amber-200 tracking-wider font-serif">
                    CADENA
                  </span>
                  {currentMode === 'CADENA' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Conecta números, crea cadenas y usa poderes para dejar a tus rivales sin respuesta.
                </p>
                <div className="pt-1 border-t border-stone-800/80 text-[10px] font-bold text-amber-400/90 uppercase tracking-wider">
                  NÚMEROS &middot; COMBOS &middot; PODERES
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: SELECTOR DE MAPA (All 3 visibly render) */}
          <div className="bg-gradient-to-b from-stone-900/90 to-[#120e0b]/95 border border-amber-900/35 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-amber-100 uppercase tracking-wider font-serif">
                    Escenario de la Cantina
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Cambia la ambientación, perspectiva de cada asiento y dorso de las cartas
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {(Object.keys(CANTINA_MAP_ASSETS) as CantinaMapId[]).map((mapId) => {
                const mapDef = CANTINA_MAP_ASSETS[mapId];
                const isSelected = currentMapId === mapId;

                return (
                  <MapCardOption
                    key={mapId}
                    mapId={mapId}
                    mapDef={mapDef}
                    isSelected={isSelected}
                    isHost={isHost}
                    onSelect={() => onUpdateConfig({ mapId })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapCardOption: React.FC<{
  mapId: CantinaMapId;
  mapDef: (typeof CANTINA_MAP_ASSETS)[CantinaMapId];
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}> = ({ mapId, mapDef, isSelected, isHost, onSelect }) => {
  return (
    <button
      type="button"
      disabled={!isHost}
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden border text-left transition-all flex flex-col ${
        isSelected
          ? 'border-amber-400 ring-2 ring-amber-400/45 shadow-[0_10px_28px_rgba(245,158,11,0.22)]'
          : 'border-stone-800 hover:border-stone-700 bg-stone-950/70'
      } ${isHost ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
    >
      {/* Map Thumbnail Image */}
      <div
        style={{
          backgroundImage: `url("${mapDef.thumbnail}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="relative w-full h-30 overflow-hidden bg-stone-950"
      >
        <img
          src={mapDef.thumbnail}
          alt=""
          onError={() => {
            logCantinaMapAssetError(mapId, 'thumbnail', mapDef.thumbnail);
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-md">
            Elegido
          </div>
        )}
      </div>

      {/* Map Info - Wide and readable, no aggressive truncating */}
      <div className="p-3.5 flex flex-col gap-1.5 bg-stone-950/95 flex-1">
        <h3 className="text-xs font-black text-amber-200 tracking-wider uppercase font-serif">
          {mapDef.name}
        </h3>
        <p className="text-[11px] text-stone-300 leading-relaxed font-normal">
          {mapDef.description}
        </p>
      </div>
    </button>
  );
};
