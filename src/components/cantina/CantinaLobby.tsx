import React, { useState } from 'react';
import {
  CantinaRoomState,
  CantinaConfig,
  CantinaGameMode,
  CantinaMapId,
} from '../../types/cantina';
import { CANTINA_MAPS } from '../../data/cantina/maps';
import { Copy, Check, Users, Play, Crown, ShieldAlert, Sparkles, Flame, LogOut } from 'lucide-react';

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

  const currentMode = roomState.config.mode;
  const currentMapId = roomState.config.mapId;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-6 bg-[#0c0a09] text-stone-100 font-sans select-none overflow-y-auto">
      {/* Subtle warm amber radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.08),transparent_65%)] pointer-events-none" />

      {/* Top Bar with Room Code & Host Status */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-900/90 border border-amber-900/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shadow-amber-500/20">
            🥃
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wide font-serif">
              LA CANTINA DEL FAROL
            </h1>
            <p className="text-xs text-stone-400 font-medium">
              Mesa clandestina de faroles y ruleta rusa &bull; 2 a 4 jugadores
            </p>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-xl border border-amber-600/40 shadow-inner">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">SALA:</span>
            <span className="text-xl font-mono font-black text-amber-400 tracking-widest">
              {roomState.code}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copiar código"
              className="p-1.5 hover:bg-stone-800 rounded-lg text-amber-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={onRequestLeave}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-400 hover:text-rose-400 hover:bg-stone-800/80 rounded-xl border border-stone-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Player Seats (4 slots) */}
        <div className="lg:col-span-5 bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Asientos de la Mesa
              </h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {roomState.players.length} / 4
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const player = roomState.players[slotIdx];
              return (
                <div
                  key={slotIdx}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    player
                      ? player.id === localPlayerId
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-stone-950/70 border-stone-800'
                      : 'bg-stone-950/30 border-dashed border-stone-800 text-stone-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold border ${
                        player
                          ? 'bg-stone-800 border-amber-700/50 text-white shadow'
                          : 'border-dashed border-stone-800 text-stone-700'
                      }`}
                    >
                      {player ? player.avatar : `${slotIdx + 1}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${player ? 'text-stone-100' : 'text-stone-600'}`}>
                          {player ? player.name : `Asiento ${slotIdx + 1} (Libre)`}
                        </span>
                        {player?.isHost && (
                          <Crown className="w-3.5 h-3.5 text-amber-400" title="Anfitrión" />
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {player ? (
                          player.id === localPlayerId ? (
                            <span className="text-amber-400 font-semibold">(Tú)</span>
                          ) : (
                            'En la mesa'
                          )
                        ) : (
                          'Esperando jugador...'
                        )}
                      </div>
                    </div>
                  </div>

                  {player && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        player.isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-stone-600'
                      }`}
                      title={player.isConnected ? 'Conectado' : 'Desconectado'}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {roomState.players.length < 2 && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-200/90 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Se necesitan al menos 2 jugadores sentados a la mesa para empezar.</span>
            </div>
          )}

          {/* Host Start Match Button */}
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-xl ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {roomState.players.length < 2 ? 'Esperando jugadores (Mín. 2)' : 'Empezar partida'}
            </button>
          ) : (
            <div className="py-3 px-4 rounded-xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-400 flex items-center justify-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Esperando a que el anfitrión comience la partida...
            </div>
          )}
        </div>

        {/* Right Column: Game Mode & Map Selector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: MODO DE JUEGO */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Modo de Juego
                </h2>
              </div>
              {!isHost && (
                <span className="text-[11px] text-stone-400 italic">
                  Solo el anfitrión puede modificar los ajustes
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: CLÁSICO */}
              <button
                type="button"
                disabled={!isHost}
                onClick={() => onUpdateConfig({ mode: 'CLASICO' })}
                className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  currentMode === 'CLASICO'
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/30'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-amber-300 tracking-wide font-serif">
                    CLÁSICO
                  </span>
                  {currentMode === 'CLASICO' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80" />
                  )}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  &ldquo;Faroles, acusaciones y sangre fría. Sin Carta del Diablo.&rdquo;
                </p>
                <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider mt-1">
                  20 cartas (6 J, 6 Q, 6 K, 2 Jokers)
                </div>
              </button>

              {/* Option 2: DIABLO */}
              <button
                type="button"
                disabled={!isHost}
                onClick={() => onUpdateConfig({ mode: 'DIABLO' })}
                className={`relative p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  currentMode === 'DIABLO'
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/15 ring-2 ring-rose-500/30'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                } ${isHost ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-rose-300 tracking-wide font-serif flex items-center gap-1.5">
                    DIABLO <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  </span>
                  {currentMode === 'DIABLO' && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 shadow-sm shadow-rose-400/80" />
                  )}
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  &ldquo;La Carta del Diablo entra en juego y puede condenar a toda la mesa.&rdquo;
                </p>
                <div className="text-[10px] font-bold text-rose-400/90 uppercase tracking-wider mt-1">
                  20 cartas (1 se transforma en Diablo)
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: SELECTOR DE MAPA (All 3 visibly render) */}
          <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Escenario de la Cantina
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(CANTINA_MAPS) as CantinaMapId[]).map((mapId) => {
                const mapDef = CANTINA_MAPS[mapId];
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
  mapDef: typeof CANTINA_MAPS[CantinaMapId];
  isSelected: boolean;
  isHost: boolean;
  onSelect: () => void;
}> = ({ mapId, mapDef, isSelected, isHost, onSelect }) => {
  const [loadError, setLoadError] = useState(false);

  // If map1 or map2 image file is not on disk, gracefully use working map3 with thematic atmospheric filter
  const imgSrc = loadError ? '/assets/mapas/mapa3/map3pov1.png' : mapDef.thumbnail;
  const filterStyle =
    loadError && mapId === 'mapa1'
      ? { filter: 'hue-rotate(240deg) saturate(1.5) brightness(0.95)' }
      : loadError && mapId === 'mapa2'
      ? { filter: 'sepia(0.85) hue-rotate(320deg) contrast(1.15)' }
      : undefined;

  return (
    <button
      type="button"
      disabled={!isHost}
      onClick={onSelect}
      className={`group relative rounded-xl overflow-hidden border text-left transition-all flex flex-col ${
        isSelected
          ? 'border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/20'
          : 'border-stone-800 hover:border-stone-700 bg-stone-950/60'
      } ${isHost ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'}`}
    >
      {/* Map Thumbnail Image */}
      <div className="relative w-full h-28 overflow-hidden bg-stone-950">
        <img
          src={imgSrc}
          alt={mapDef.name}
          onError={() => setLoadError(true)}
          style={filterStyle}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
        {isSelected && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider">
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
