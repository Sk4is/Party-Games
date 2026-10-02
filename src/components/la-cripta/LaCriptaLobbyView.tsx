import React, { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Copy,
  Check,
  Flame,
  Lock,
  Sparkles,
  BookOpen,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  CriptaCharacterId,
  CriptaExpeditionState,
} from '../../types/laCripta';
import {
  ALL_CRIPTA_CHARACTER_IDS,
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_CURSOR_COLORS,
} from '../../data/la-cripta/criptaCatalog';
import { laCriptaAudio } from '../../utils/laCriptaAudio';
import { LaCriptaConnectionStatus } from '../../hooks/useLaCriptaSocket';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import { LaCriptaStatBlock } from './LaCriptaStatBar';

interface LaCriptaLobbyViewProps {
  playerId: string;
  playerName: string;
  playerColor: string;
  onChangePlayerName: (name: string) => void;
  onChangePlayerColor: (color: string) => void;
  expeditionState: CriptaExpeditionState | null;
  connectionStatus: LaCriptaConnectionStatus;
  errorMessage: string | null;
  initialRoomCode?: string;
  onCreateRoom: () => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onSelectCharacter: (charId: CriptaCharacterId) => void;
  onStartExpedition: () => void;
  onBackToMenu: () => void;
}

export const LaCriptaLobbyView: React.FC<LaCriptaLobbyViewProps> = ({
  playerId,
  playerName,
  playerColor,
  onChangePlayerName,
  onChangePlayerColor,
  expeditionState,
  connectionStatus,
  errorMessage,
  initialRoomCode = '',
  onCreateRoom,
  onJoinRoom,
  onSelectCharacter,
  onStartExpedition,
  onBackToMenu,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState(() =>
    typeof initialRoomCode === 'string' ? initialRoomCode.trim().toUpperCase() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodexModal, setShowCodexModal] = useState(false);
  const [hoveredCharacterId, setHoveredCharacterId] = useState<CriptaCharacterId | null>(null);

  const isConnecting = connectionStatus === 'connecting' || isSubmitting;

  const handleCreate = async () => {
    if (isConnecting) return;
    laCriptaAudio.playStoneClick();
    setIsSubmitting(true);
    try {
      await onCreateRoom();
    } catch {
      // Error surfaced via errorMessage state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = String(joinCodeInput || '').trim().toUpperCase();
    if (isConnecting || !cleanCode) return;
    laCriptaAudio.playStoneClick();
    setIsSubmitting(true);
    try {
      await onJoinRoom(cleanCode);
    } catch {
      // Error surfaced via errorMessage state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRoomCode = () => {
    const codeToCopy = expeditionState?.code || expeditionState?.roomCode || '';
    if (!codeToCopy) return;
    laCriptaAudio.playStoneClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codeToCopy).catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  // ===========================================================================
  // VIEW A: ENTRY GATEHOUSE (CREATE / JOIN ROOM ONLY — NO CHARACTER SELECTION)
  // ===========================================================================
  if (!expeditionState) {
    return (
      <div className="relative min-h-screen w-full bg-[#0B0A0E] text-[#D9D0BC] flex flex-col justify-between overflow-x-hidden">
        {/* Atmospheric Dungeon Torchlight & Vignette */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(circle at 20% 18%, rgba(231,165,74,0.12) 0%, transparent 45%), radial-gradient(circle at 80% 18%, rgba(231,165,74,0.12) 0%, transparent 45%), radial-gradient(circle at 50% 65%, rgba(118,86,168,0.16) 0%, #0B0A0E 78%)',
          }}
        />

        {/* Top Bar */}
        <header className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-5 pb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onBackToMenu();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#19111D] hover:bg-[#282039] border border-[#D8C6A0]/25 hover:border-[#E7A54A] text-xs sm:text-sm font-cripta-pixel text-[#D8C6A0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#E7A54A]" />
            <span>VOLVER A FAM2PLAY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              setShowCodexModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#19111D] hover:bg-[#282039] border border-[#7656A8]/50 hover:border-[#E7A54A] text-xs sm:text-sm font-cripta-pixel text-[#D9D0BC] transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#E7A54A]" />
            <span>CÓDICE DE LA CRIPTA</span>
          </button>
        </header>

        {/* Main Gatehouse Content */}
        <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-center">
          {/* Hero Title Banner */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-cripta-pixel uppercase tracking-widest text-[#E7A54A] mb-2">
              <span className="animate-cripta-torch">🕯️</span>
              <span>AVENTURA DE MAZMORRAS · 1 A 4 JUGADORES</span>
              <span className="animate-cripta-torch">🕯️</span>
            </div>
            <h1 className="font-cripta-display text-4xl sm:text-6xl font-black tracking-[0.12em] text-[#D8C6A0] drop-shadow-[0_4px_24px_rgba(231,165,74,0.28)]">
              LA CRIPTA
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#D9D0BC]/80 max-w-2xl mx-auto leading-relaxed">
              Explora en solitario o reúne hasta 4 jugadores en la misma sala. Elegid entre los seis
              aventureros y decidid qué umbral subterráneo abrir.
            </p>
          </div>

          {errorMessage && (
            <div className="max-w-xl mx-auto w-full mb-5 px-4 py-3 rounded-lg bg-[#8F263D]/25 border border-[#8F263D] text-center text-xs sm:text-sm font-cripta-pixel text-[#D9D0BC]">
              {errorMessage}
            </div>
          )}

          {/* Two-Column Stone Layout: Left = Player Identity & Cursor Color, Right = Create / Join Expedition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT PANEL: Player Identity & Shared Pointer Color */}
            <div className="lg:col-span-6 rounded-2xl bg-[#19111D]/95 border-2 border-[#282039] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex flex-col justify-between box-border">
              <div>
                <div className="flex items-center justify-between border-b border-[#282039] pb-3 mb-4 gap-2">
                  <h2 className="font-cripta-display text-lg sm:text-xl font-bold text-[#D8C6A0] tracking-wider">
                    1. TU IDENTIDAD
                  </h2>
                  <span className="text-xs font-cripta-pixel text-[#69A8A5]">
                    PUNTEROS EN VIVO
                  </span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="cripta-player-name"
                      className="block text-xs font-cripta-pixel text-[#D8C6A0] mb-1.5"
                    >
                      NOMBRE DEL JUGADOR
                    </label>
                    <input
                      id="cripta-player-name"
                      type="text"
                      maxLength={20}
                      value={playerName}
                      onChange={(e) => onChangePlayerName(e.target.value)}
                      placeholder="Tu nombre..."
                      className="w-full min-w-0 box-border px-3.5 py-2.5 rounded-lg bg-[#0B0A0E] border border-[#282039] focus:border-[#E7A54A] text-sm font-semibold text-[#D9D0BC] outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-cripta-pixel text-[#D8C6A0] mb-2">
                      COLOR DE TU PUNTERO COMPARTIDO
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {CRIPTA_CURSOR_COLORS.map((c) => {
                        const active = playerColor.toLowerCase() === c.hex.toLowerCase();
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              laCriptaAudio.playStoneClick();
                              onChangePlayerColor(c.hex);
                            }}
                            title={c.label}
                            className={`w-9 h-9 rounded-lg border-2 transition-transform cursor-pointer ${
                              active
                                ? 'scale-110 border-white shadow-[0_0_12px_rgba(231,165,74,0.5)]'
                                : 'border-[#0B0A0E] opacity-75 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview of the 6 Adventurers awaiting inside the room */}
              <div className="mt-6 pt-4 border-t border-[#282039]">
                <div className="text-[11px] font-cripta-pixel text-[#D8C6A0]/80 mb-2">
                  SEIS CLASES DE AVENTURERO DISPONIBLES EN LA SALA:
                </div>
                <div className="grid grid-cols-6 gap-1.5 bg-[#0B0A0E]/90 p-2.5 rounded-xl border border-[#282039]">
                  {ALL_CRIPTA_CHARACTER_IDS.map((cid) => (
                    <div
                      key={cid}
                      className="flex flex-col items-center justify-center py-1"
                      title={CRIPTA_CHARACTERS_CATALOG[cid].className}
                    >
                      <LaCriptaPixelSprite characterId={cid} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Create or Join Expedition (Fixed Overflow Layout) */}
            <div className="lg:col-span-6 rounded-2xl bg-[#19111D]/95 border-2 border-[#282039] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-6 box-border overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-[#282039] pb-3 mb-4 gap-2">
                  <h2 className="font-cripta-display text-lg sm:text-xl font-bold text-[#D8C6A0] tracking-wider">
                    2. SALA DE EXPEDICIÓN
                  </h2>
                  <span className="text-xs font-cripta-pixel text-[#E7A54A] shrink-0">
                    1–4 JUGADORES
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#D9D0BC]/80 leading-relaxed mb-5">
                  Inicia una expedición en solitario, crea una sala para tu grupo o introduce el
                  código de 5 caracteres compartido por otro jugador.
                </p>

                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={handleCreate}
                  className="w-full box-border py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#E7A54A] to-[#C8822B] hover:from-[#F2B65D] hover:to-[#D99034] text-[#0B0A0E] font-cripta-display font-black text-sm sm:text-base tracking-wider shadow-[0_8px_25px_rgba(231,165,74,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Flame className="w-5 h-5 fill-current shrink-0" />
                  <span>{isConnecting ? 'ABRIENDO UMBRAL...' : 'CREAR NUEVA EXPEDICIÓN'}</span>
                </button>
              </div>

              <div className="border-t border-[#282039] pt-5 w-full box-border">
                <form onSubmit={handleJoin} className="space-y-2.5 w-full box-border">
                  <label
                    htmlFor="cripta-join-code"
                    className="block text-xs font-cripta-pixel text-[#D8C6A0]"
                  >
                    UNIRSE CON CÓDIGO DE SALA
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2.5 w-full box-border">
                    <input
                      id="cripta-join-code"
                      type="text"
                      maxLength={8}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="EJ: K7M9F"
                      className="w-full min-w-0 box-border px-3.5 py-2.5 rounded-lg bg-[#0B0A0E] border border-[#282039] focus:border-[#E7A54A] font-cripta-pixel text-sm sm:text-base tracking-[0.16em] uppercase text-[#E7A54A] placeholder:text-[#D9D0BC]/25 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting || !joinCodeInput.trim()}
                      className="shrink-0 w-full sm:w-auto box-border px-5 py-2.5 rounded-lg bg-[#282039] hover:bg-[#7656A8] border border-[#D8C6A0]/35 hover:border-[#D8C6A0] font-cripta-pixel text-xs sm:text-sm text-[#D9D0BC] transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
                    >
                      ENTRAR
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-4 text-xs text-[#D9D0BC]/45 font-cripta-pixel px-4">
          LA CRIPTA · 1–4 JUGADORES · SEIS CLASES Y LAS TRES PUERTAS DEL UMBRAL
        </footer>

        {/* Codex Modal */}
        {showCodexModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-2xl w-full rounded-2xl bg-[#19111D] border-2 border-[#E7A54A]/60 p-6 shadow-2xl text-[#D9D0BC]">
              <div className="flex items-center justify-between border-b border-[#282039] pb-3 mb-4">
                <h3 className="font-cripta-display text-xl font-bold text-[#D8C6A0]">
                  CÓDICE DE LA CRIPTA
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCodexModal(false)}
                  className="p-1.5 rounded bg-[#0B0A0E] text-[#D8C6A0] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm text-[#D9D0BC]/85 leading-relaxed">
                <p>
                  <strong className="text-[#E7A54A]">1. De 1 a 4 Jugadores:</strong> Puedes jugar la
                  expedición completa en solitario (1 jugador) o compartir el código de 5 letras con
                  hasta 4 jugadores en la misma sala.
                </p>
                <p>
                  <strong className="text-[#E7A54A]">2. Elección de Aventurero:</strong>{' '}
                  Una vez dentro de la sala, eliges entre <em>Caballero, Mago, Pícaro, Cazador,
                  Clérigo</em> y <em>Alquimista</em>. En partidas con varios jugadores, cada
                  aventurero solo puede ser elegido por un jugador.
                </p>
                <p>
                  <strong className="text-[#E7A54A]">3. Atributos de Clase:</strong> Cada clase se
                  define por 4 atributos en escala de 10 segmentos: <em>VIDA, ATAQUE, DEFENSA</em> y{' '}
                  <em>MAGIA</em>.
                </p>
                <p>
                  <strong className="text-[#E7A54A]">4. Las Tres Puertas Procedurales:</strong>{' '}
                  Al iniciar la expedición emergen 3 puertas distintas. En solitario tu elección abre
                  el umbral directamente; en grupo, los jugadores votan qué puerta abrir.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // VIEW B: INSIDE THE MULTIPLAYER ROOM — CHARACTER SELECTION STAGE
  // ===========================================================================
  const me = expeditionState.players.find((p) => p.id === playerId);
  const myCharacterId = me?.characterId ?? me?.selectedCharacterId ?? null;
  const isHost = Boolean(me?.isHost);
  const roomCodeDisplay = expeditionState.code || expeditionState.roomCode || '';

  const connectedPlayers = expeditionState.players.filter((p) => p.isConnected);
  const isSolo = connectedPlayers.length === 1;
  const readyPlayersCount = connectedPlayers.filter((p) => Boolean(p.characterId)).length;
  const allActivePlayersHaveCharacter =
    connectedPlayers.length > 0 && connectedPlayers.every((p) => Boolean(p.characterId));

  // Determine which character is shown in the detailed inspection panel:
  // Hovered character takes precedence, then my selected character, then default 'caballero'
  const inspectedCharacterId: CriptaCharacterId =
    hoveredCharacterId || myCharacterId || 'caballero';
  const inspectedCharDef = CRIPTA_CHARACTERS_CATALOG[inspectedCharacterId];
  const inspectedOwner = expeditionState.players.find(
    (p) => p.characterId === inspectedCharacterId
  );

  return (
    <div className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col justify-between gap-4">
      {/* Header Banner: ELIGE A TU AVENTURERO */}
      <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-[#282039] pb-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-cripta-pixel uppercase tracking-widest text-[#E7A54A]">
            <span className="animate-cripta-torch">🕯️</span>
            <span>
              SALA DE EXPEDICIÓN #{roomCodeDisplay} · {connectedPlayers.length}/4 JUGADORES
            </span>
          </div>
          <h1 className="font-cripta-display text-2xl sm:text-3xl font-black tracking-wider text-[#D8C6A0] mt-0.5">
            ELIGE A TU AVENTURERO
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D0BC]/80">
            {isSolo
              ? 'Elige uno de los seis aventureros para adentrarte en La Cripta (o invita hasta 4 jugadores con el código de sala).'
              : 'Cada aventurero solo puede ser elegido por un jugador.'}
          </p>
        </div>

        {/* Cursor color + Room Code Copy + Host Start Button */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Pointer Color Picker */}
          <div className="flex items-center gap-1.5 bg-[#140F1A] px-2.5 py-1.5 border border-[#282039]">
            <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]/75 mr-1">
              PUNTERO:
            </span>
            {CRIPTA_CURSOR_COLORS.map((c) => {
              const active = (me?.color || playerColor).toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    onChangePlayerColor(c.hex);
                  }}
                  title={c.label}
                  className={`w-4 h-4 border transition-transform cursor-pointer ${
                    active ? 'scale-125 border-white' : 'border-black/80 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleCopyRoomCode}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#140F1A] hover:bg-[#282039] border border-[#D8C6A0]/35 text-xs font-cripta-pixel text-[#D8C6A0] transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#69A8A5]" />
                <span className="text-[#69A8A5]">COPIADO</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#E7A54A]" />
                <span>CÓDIGO {roomCodeDisplay}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {errorMessage && (
        <div className="px-4 py-2.5 bg-[#8F263D]/30 border border-[#C93B5B] text-center text-xs font-cripta-pixel text-[#D9D0BC]">
          {errorMessage}
        </div>
      )}

      {/* Main Preparation Stage: Left = 9 Character Cards (3x3 Desktop, 2-col Tablet, 1-2 col Mobile), Right = Detailed Selected/Inspected Character Panel & Start Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* LEFT 7 COLUMNS: The 9 Selectable Adventurer Panels (3x3 Grid) */}
        <section
          aria-label="Selección de aventurero"
          className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3.5"
        >
          {ALL_CRIPTA_CHARACTER_IDS.map((charId) => {
            const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
            const occupyingPlayer = expeditionState.players.find(
              (p) => p.characterId === charId
            );
            const isSelectedByMe = occupyingPlayer?.id === playerId;
            const isOccupiedByOther = Boolean(
              occupyingPlayer && occupyingPlayer.id !== playerId
            );
            const isHovered = hoveredCharacterId === charId;

            return (
              <button
                key={charId}
                type="button"
                onMouseEnter={() => {
                  setHoveredCharacterId(charId);
                  laCriptaAudio.playDoorHover();
                }}
                onMouseLeave={() => {
                  setHoveredCharacterId((prev) => (prev === charId ? null : prev));
                }}
                onClick={() => {
                  if (isOccupiedByOther) {
                    laCriptaAudio.playStoneClick();
                    return;
                  }
                  laCriptaAudio.playCharacterSelect();
                  onSelectCharacter(charId);
                }}
                className={`group relative text-left p-3 sm:p-3.5 bg-[#140F1A] border-2 transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                  isOccupiedByOther
                    ? 'cursor-not-allowed opacity-85'
                    : 'cursor-pointer hover:-translate-y-0.5'
                }`}
                style={{
                  borderColor: isSelectedByMe
                    ? '#E7A54A'
                    : occupyingPlayer
                    ? occupyingPlayer.color
                    : isHovered
                    ? charDef.accentColor
                    : '#282039',
                  boxShadow: isSelectedByMe
                    ? '0 0 24px rgba(231,165,74,0.28), inset 0 0 18px rgba(231,165,74,0.12)'
                    : occupyingPlayer
                    ? `0 0 18px ${occupyingPlayer.color}28`
                    : '0 8px 24px rgba(0,0,0,0.8)',
                }}
              >
                {/* Subtle radial spotlight behind character */}
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                  style={{
                    background: `radial-gradient(circle at 50% 38%, ${charDef.accentColor}26 0%, transparent 70%)`,
                    opacity: isSelectedByMe || isHovered ? 1 : 0.45,
                  }}
                />

                {/* Top Class Header + Resource Pill */}
                <div className="relative z-10 flex items-center justify-between gap-1 w-full mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="font-cripta-display text-sm sm:text-base font-black tracking-wider truncate"
                      style={{ color: isSelectedByMe ? '#E7A54A' : charDef.accentColor }}
                    >
                      {charDef.className}
                    </span>
                    {charDef.resourceName && (
                      <span
                        className="px-1.5 py-0.2 border text-[8px] font-cripta-pixel font-bold uppercase tracking-wider shrink-0"
                        style={{
                          borderColor: `${charDef.accentColor}88`,
                          backgroundColor: '#0B0811',
                          color: charDef.accentColor,
                        }}
                      >
                        {charDef.resourceName}
                      </span>
                    )}
                  </div>
                  {isSelectedByMe && (
                    <CheckCircle2 className="w-4 h-4 text-[#E7A54A] shrink-0" />
                  )}
                  {isOccupiedByOther && (
                    <Lock className="w-3.5 h-3.5 text-[#D8C6A0]/65 shrink-0" />
                  )}
                </div>

                {/* Center Illuminated Pixel-Art Character Sprite */}
                <div className="relative z-10 my-1 py-1.5 flex items-center justify-center bg-[#09070D]/90 border border-[#282039]">
                  <LaCriptaPixelSprite
                    characterId={charId}
                    size="md"
                    isHovered={isHovered || isSelectedByMe}
                    animationState={isSelectedByMe ? 'enter' : 'idle'}
                  />
                </div>

                {/* Mini 7-Stat Preview Bars */}
                <div className="relative z-10 my-1.5">
                  <LaCriptaStatBlock
                    stats={charDef.stats}
                    triggerKey={`card_${charId}`}
                    compact={true}
                  />
                </div>

                {/* Bottom Ownership / Status Strip */}
                <div className="relative z-10 pt-1.5 mt-1 border-t border-[#282039] flex items-center justify-between gap-1.5 min-h-[24px]">
                  {occupyingPlayer ? (
                    <div className="flex items-center gap-1.5 min-w-0 w-full">
                      <span
                        className="w-2.5 h-2.5 shrink-0 border border-black"
                        style={{ backgroundColor: occupyingPlayer.color }}
                      />
                      <span
                        className="font-cripta-pixel text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
                        style={{
                          color: isSelectedByMe ? '#E7A54A' : occupyingPlayer.color,
                        }}
                      >
                        {isSelectedByMe
                          ? `ELEGIDO POR ${occupyingPlayer.name}`
                          : `OCUPADO · ${occupyingPlayer.name}`}
                      </span>
                    </div>
                  ) : (
                    <span className="font-cripta-pixel text-[10px] text-[#D8C6A0]/65 group-hover:text-[#E7A54A] uppercase tracking-wider">
                      DISPONIBLE · ELEGIR
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* RIGHT 5 COLUMNS: Detailed Inspected / Selected Adventurer Dossier + Host Start Control */}
        <section className="xl:col-span-5 bg-[#140F1A] border-2 border-[#282039] p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-[0_12px_34px_rgba(0,0,0,0.88)]">
          <div>
            {/* Dossier Header */}
            <div className="flex items-start gap-4 border-b border-[#282039] pb-4 mb-3">
              <div
                className="p-2 bg-[#09070D] border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: inspectedCharDef.accentColor }}
              >
                <LaCriptaPixelSprite
                  characterId={inspectedCharacterId}
                  size="lg"
                  animationState="idle"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span
                    className="font-cripta-display text-xl sm:text-2xl font-black tracking-wider"
                    style={{ color: inspectedCharDef.accentColor }}
                  >
                    {inspectedCharDef.className}
                  </span>

                  {inspectedOwner ? (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#09070D] border text-[10px] font-cripta-pixel uppercase"
                      style={{
                        borderColor: inspectedOwner.color,
                        color: '#D9D0BC',
                      }}
                    >
                      <span
                        className="w-2 h-2"
                        style={{ backgroundColor: inspectedOwner.color }}
                      />
                      {inspectedOwner.id === playerId
                        ? `SELECCIONADO (${inspectedOwner.name})`
                        : `OCUPADO POR ${inspectedOwner.name}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-cripta-pixel text-[#69A8A5]">
                      LIBRE
                    </span>
                  )}
                </div>

                <div className="text-xs font-semibold text-[#D8C6A0] mt-0.5">
                  {inspectedCharDef.name} ·{' '}
                  <span className="text-[#D9D0BC]/70">{inspectedCharDef.title}</span>
                </div>

                <p className="text-xs text-[#E7A54A] font-medium mt-1">
                  {inspectedCharDef.role}
                </p>
                <p className="text-xs text-[#D9D0BC]/80 mt-1 leading-relaxed">
                  {inspectedCharDef.description}
                </p>
              </div>
            </div>

            {/* Special Class Resource Panel (FURIA / COMPÁS / ESENCIA) */}
            {inspectedCharDef.resourceName && inspectedCharDef.resourceDescription && (
              <div
                className="p-2.5 bg-[#09070D] border-l-2 border border-[#282039] mb-3"
                style={{ borderLeftColor: inspectedCharDef.accentColor }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className="text-[10px] font-cripta-pixel font-bold uppercase tracking-widest"
                    style={{ color: inspectedCharDef.accentColor }}
                  >
                    ✦ RECURSO DE CLASE: {inspectedCharDef.resourceName} (0–{inspectedCharDef.resourceMax})
                  </span>
                  <span className="px-1.5 py-0.2 bg-[#161022] border border-[#3E2F4B] text-[9px] font-cripta-mono text-[#FFD166]">
                    MECÁNICA ÚNICA
                  </span>
                </div>
                <p className="text-[11px] text-[#D9D0BC]/85 leading-snug">
                  {inspectedCharDef.resourceDescription}
                </p>
              </div>
            )}

            {/* 7 Primary 10-Segment Square Stat Bars (VIDA, ATAQUE, DEFENSA, MAGIA, AGILIDAD, PRECISIÓN, VOLUNTAD) */}
            <div className="bg-[#09070D] border border-[#282039] p-3 sm:p-3.5 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-cripta-pixel text-[#D8C6A0] uppercase tracking-wider">
                  7 ATRIBUTOS DEL AVENTURERO
                </span>
                <span className="text-[11px] font-cripta-mono text-[#D8C6A0]/70">
                  PV: {inspectedCharDef.maxHp} · DEF: {inspectedCharDef.baseArmor}
                </span>
              </div>

              <LaCriptaStatBlock
                stats={inspectedCharDef.stats}
                triggerKey={`dossier_${inspectedCharacterId}`}
                compact={false}
              />
            </div>

            {/* Class Synergy Hint */}
            {inspectedCharDef.synergyHint && (
              <div className="px-2.5 py-2 bg-[#120D1B] border border-[#3E2F4B] text-[10px] font-cripta-pixel text-[#D8C6A0]/90 leading-relaxed mb-3">
                <span className="text-[#FFD166] font-bold">✦ SINERGIA DE GRUPO: </span>
                {inspectedCharDef.synergyHint.replace(/^Sinergia:\s*/i, '')}
              </div>
            )}

            {/* Class Abilities Preview */}
            <div className="space-y-1.5 mb-2">
              <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-widest">
                TÉCNICAS Y RASGOS DE CLASE ({inspectedCharDef.abilities.length})
              </div>
              <div className="grid grid-cols-1 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                {inspectedCharDef.abilities.map((ab) => (
                  <div
                    key={ab.id}
                    className="p-2 bg-[#09070D]/90 border border-[#282039] flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-cripta-pixel text-[11px] font-bold text-[#E7A54A]">
                        {ab.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {ab.resourceGain && (
                          <span className="px-1.5 py-0.2 bg-[#1B1429] border border-[#E7A54A]/60 text-[8px] font-cripta-pixel text-[#FFD166]">
                            +{ab.resourceGain} {inspectedCharDef.resourceName || 'REC'}
                          </span>
                        )}
                        {ab.minResourceRequired && (
                          <span className="px-1.5 py-0.2 bg-[#2A121B] border border-[#FF4D6D] text-[8px] font-cripta-pixel text-[#FF8FA3]">
                            REQ. {ab.minResourceRequired}+ {inspectedCharDef.resourceName || 'REC'}
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 bg-[#19111D] border border-[#7656A8]/45 text-[9px] font-cripta-pixel text-[#D8C6A0]">
                          {ab.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#D9D0BC]/75 leading-snug">
                      {ab.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lore Quote */}
            <p className="text-xs text-[#D9D0BC]/65 italic px-1">
              &ldquo;{inspectedCharDef.lore}&rdquo;
            </p>
          </div>

          {/* Bottom Action Area: Select Button + Host Expedition Start Gate */}
          <div className="pt-3 border-t border-[#282039] space-y-3">
            {/* Quick Select button for the currently inspected character */}
            {inspectedOwner?.id !== playerId && (
              <button
                type="button"
                disabled={Boolean(inspectedOwner && inspectedOwner.id !== playerId)}
                onClick={() => {
                  if (inspectedOwner && inspectedOwner.id !== playerId) return;
                  laCriptaAudio.playCharacterSelect();
                  onSelectCharacter(inspectedCharacterId);
                }}
                className="w-full py-2.5 px-4 bg-[#282039] hover:bg-[#3B2E54] border border-[#D8C6A0]/40 font-cripta-pixel text-xs text-[#D9D0BC] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inspectedOwner
                  ? `OCUPADO POR ${inspectedOwner.name.toUpperCase()}`
                  : `ELEGIR A ${inspectedCharDef.className}`}
              </button>
            )}

            {/* Host Start Expedition Gate */}
            <div className="bg-[#09070D] border border-[#282039] p-3">
              <div className="flex items-center justify-between text-[11px] font-cripta-pixel mb-2 gap-2">
                <span className="text-[#D8C6A0]">
                  {isSolo
                    ? allActivePlayersHaveCharacter
                      ? 'AVENTURERO SELECCIONADO'
                      : 'PREPARACIÓN EN SOLITARIO'
                    : `GRUPO LISTO: ${readyPlayersCount}/${connectedPlayers.length}`}
                </span>
                <span
                  className={
                    allActivePlayersHaveCharacter ? 'text-[#5EA87A]' : 'text-[#E7A54A]'
                  }
                >
                  {allActivePlayersHaveCharacter
                    ? isSolo
                      ? '¡LISTO PARA ENTRAR!'
                      : '¡TODOS LISTOS!'
                    : isSolo
                    ? 'Elige a tu aventurero.'
                    : 'Todos los jugadores deben elegir aventurero.'}
                </span>
              </div>

              {isHost ? (
                <button
                  type="button"
                  disabled={!allActivePlayersHaveCharacter}
                  onClick={() => {
                    if (!allActivePlayersHaveCharacter) return;
                    laCriptaAudio.playDoorVote();
                    onStartExpedition();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#E7A54A] to-[#C8822B] hover:from-[#F2B65D] hover:to-[#D99034] text-[#0B0A0E] font-cripta-display font-black text-xs sm:text-sm tracking-wider transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>INICIAR EXPEDICIÓN</span>
                </button>
              ) : (
                <div className="py-2.5 px-3 bg-[#140F1A] border border-[#282039] text-center text-xs font-cripta-pixel text-[#D8C6A0]/80">
                  {allActivePlayersHaveCharacter
                    ? 'ESPERANDO A QUE EL LÍDER INICIE LA EXPEDICIÓN...'
                    : 'Todos los jugadores deben elegir aventurero.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
