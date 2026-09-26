import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cable, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface CableItem {
  id: string; // 'red' | 'yellow' | 'blue' | 'green' | 'white'
  name: string; // 'Rojo' | 'Amarillo' | 'Azul' | 'Verde' | 'Blanco'
  color: string;
}

interface PuertosConexionModuleProps {
  operatorState: {
    busCode: 'BUS-ALFA' | 'BUS-BETA' | 'BUS-GAMMA' | 'BUS-DELTA';
    cables: CableItem[];
    jacks: string[];
    connectedJacks?: Record<string, string | null>;
  };
  solved: boolean;
  onAction: (action: { connections: Record<string, string> }) => void;
}

/**
 * Computes a smooth, natural patch cable Bézier path between source and target points.
 * - Leaves horizontally towards the destination
 * - Applies a subtle, natural catenary droop based on distance (never dipping into cards)
 * - Approaches target smoothly without extreme loops
 */
function computeCablePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  isDragging: boolean
): string {
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.hypot(dx, dy);

  if (dist < 1) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  // Cable exits towards the right from the source panel
  const isTargetToRight = dx >= -20;

  if (isTargetToRight) {
    // Normal forward routing towards jacks on the right
    const horizontalTangent = Math.min(Math.max(dx * 0.45, 35), 90);
    // Gentle natural gravity droop proportional to span (max 26px)
    const sag = Math.min(26, Math.max(4, dist * 0.07));

    const cp1x = startX + horizontalTangent;
    const cp1y = startY + sag;
    const cp2x = endX - Math.min(Math.max(dx * 0.35, 25), 65);
    const cp2y = endY + sag;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  } else {
    // Dragged backwards or upwards: loop around naturally without clipping
    const backwardDist = Math.abs(dx);
    const arcRadius = Math.min(45, Math.max(25, backwardDist * 0.5));
    const sag = isDragging ? 15 : 10;

    const cp1x = startX + arcRadius;
    const cp1y = startY + sag;
    const cp2x = endX;
    const cp2y = endY + sag;

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  }
}

export const PuertosConexionModule: React.FC<PuertosConexionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { busCode, cables = [], jacks = [] } = operatorState;

  // Authoritative semantic connections: cableId -> jackId (or null)
  const [connections, setConnections] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    cables.forEach((c) => {
      initial[c.id] = operatorState.connectedJacks?.[c.id] || null;
    });
    return initial;
  });

  // Local warning message (e.g. occupied jack, incomplete submission)
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Dragging interaction state
  const [draggedCableId, setDraggedCableId] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredJack, setHoveredJack] = useState<string | null>(null);

  // DOM references for SVG coordinate mapping
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRefs = useRef<Record<string, HTMLElement | null>>({});
  const jackRefs = useRef<Record<string, HTMLElement | null>>({});

  // Layout positions version counter
  const [coordsVersion, setCoordsVersion] = useState(0);

  const recomputePositions = useCallback(() => {
    setCoordsVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', recomputePositions);
    // Double trigger to ensure DOM styles and fonts have settled
    const t1 = setTimeout(recomputePositions, 40);
    const t2 = setTimeout(recomputePositions, 150);
    return () => {
      window.removeEventListener('resize', recomputePositions);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [recomputePositions, cables, jacks]);

  // Center point of an element relative to container
  const getElementCenter = useCallback(
    (el: HTMLElement | null): { x: number; y: number } | null => {
      if (!el || !containerRef.current) return null;
      const r = el.getBoundingClientRect();
      const cr = containerRef.current.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - cr.left,
        y: r.top + r.height / 2 - cr.top,
      };
    },
    []
  );

  // Find nearest jack within snap radius (48px)
  const findJackUnderPointer = useCallback(
    (clientX: number, clientY: number): string | null => {
      for (const jackId of jacks) {
        const el = jackRefs.current[jackId];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(clientX - centerX, clientY - centerY);
        if (dist <= 48) {
          return jackId;
        }
      }
      return null;
    },
    [jacks]
  );

  // Start dragging a cable (from source dock or from a connected jack)
  const handleStartDrag = (clientX: number, clientY: number, cableId: string) => {
    if (solved) return;
    setWarningMessage(null);
    setDraggedCableId(cableId);

    if (containerRef.current) {
      const cr = containerRef.current.getBoundingClientRect();
      setPointerPos({
        x: clientX - cr.left,
        y: clientY - cr.top,
      });
    }

    audio.playDialClick();
  };

  // Window-level pointer listeners while dragging for rock-solid tracking
  useEffect(() => {
    if (!draggedCableId) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      setPointerPos({
        x: e.clientX - cr.left,
        y: e.clientY - cr.top,
      });

      const targetJack = findJackUnderPointer(e.clientX, e.clientY);
      setHoveredJack(targetJack);
    };

    const onPointerUp = (e: PointerEvent) => {
      const cableId = draggedCableId;
      const targetJack = findJackUnderPointer(e.clientX, e.clientY);

      if (targetJack) {
        // Check if another cable is already occupying this jack
        const occupyingCableId = Object.keys(connections).find(
          (cid) => cid !== cableId && connections[cid] === targetJack
        );

        if (!occupyingCableId) {
          // Successfully connect to empty jack!
          setConnections((prev) => ({
            ...prev,
            [cableId]: targetJack,
          }));
          audio.playDialClick();
        } else {
          // Jack is already occupied
          setWarningMessage(`LA CLAVIJA ${targetJack} YA ESTÁ OCUPADA`);
          audio.playWireCut();
        }
      } else {
        // Released in empty space -> unplug cable back to idle
        setConnections((prev) => ({
          ...prev,
          [cableId]: null,
        }));
        audio.playWireCut();
      }

      setDraggedCableId(null);
      setPointerPos(null);
      setHoveredJack(null);
      recomputePositions();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [draggedCableId, connections, findJackUnderPointer, recomputePositions]);

  // Unplug an individual cable
  const handleDisconnectCable = (cableId: string) => {
    if (solved) return;
    audio.playWireCut();
    setConnections((prev) => ({
      ...prev,
      [cableId]: null,
    }));
    setWarningMessage(null);
    recomputePositions();
  };

  // Disconnect all cables back to idle
  const handleResetConnections = () => {
    if (solved) return;
    audio.playDialClick();
    const reset: Record<string, string | null> = {};
    cables.forEach((c) => {
      reset[c.id] = null;
    });
    setConnections(reset);
    setWarningMessage(null);
    recomputePositions();
  };

  // Submit complete configuration
  const handleLinkSignal = () => {
    if (solved) return;

    // Check if every cable has been connected
    const unconnected = cables.filter((c) => !connections[c.id]);
    if (unconnected.length > 0) {
      audio.playBombWarning(1.0);
      setWarningMessage(
        `CONECTA TODOS LOS CABLES (${cables.length - unconnected.length}/${cables.length} CONECTADOS)`
      );
      return;
    }

    setWarningMessage(null);
    audio.playMechanicalSwitch();

    // Format authoritative payload: { connections: { red: "J1", ... } }
    const finalConnections: Record<string, string> = {};
    cables.forEach((c) => {
      if (connections[c.id]) {
        finalConnections[c.id] = connections[c.id]!;
      }
    });

    onAction({ connections: finalConnections });
  };

  const allConnected = cables.length > 0 && cables.every((c) => Boolean(connections[c.id]));

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col justify-between w-full h-full p-4 sm:p-6 bg-slate-900/95 rounded-2xl border-2 border-slate-700/80 shadow-2xl select-none overflow-hidden font-mono"
    >
      {/* Module Header Bar */}
      <div className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Cable className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block">
              ELECTRICIDAD • PARCHEO AUXILIAR
            </span>
            <h3 className="text-sm font-black text-white">PLACA DE CONEXIONES</h3>
          </div>
        </div>

        {/* Bus Indicator Plate */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase font-bold text-slate-400 hidden sm:inline">
            BUS DE SEÑAL:
          </span>
          <div className="px-3 py-1 bg-slate-950 border-2 border-amber-500/60 rounded-lg text-amber-300 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            {busCode}
          </div>
        </div>
      </div>

      {/* SVG Canvas for Physical Patch Cables (Rendered on top of cards: z-30, pointer-events-none) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        style={{ overflow: 'visible' }}
        key={coordsVersion}
      >
        <defs>
          <filter id="cable-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {cables.map((cable) => {
          const isDragging = draggedCableId === cable.id;
          const connectedJackId = connections[cable.id];

          // 1. NO CABLES VISIBLE INITIALLY:
          // A cable appears ONLY when dragging OR when already connected!
          if (!isDragging && !connectedJackId) {
            return null;
          }

          const sourceEl = sourceRefs.current[cable.id];
          const sourceCenter = getElementCenter(sourceEl);
          if (!sourceCenter) return null;

          let targetX = 0;
          let targetY = 0;

          if (isDragging && pointerPos) {
            targetX = pointerPos.x;
            targetY = pointerPos.y;
          } else if (connectedJackId) {
            const jackEl = jackRefs.current[connectedJackId];
            const jackCenter = getElementCenter(jackEl);
            if (!jackCenter) return null;
            targetX = jackCenter.x;
            targetY = jackCenter.y;
          } else {
            return null;
          }

          const pathD = computeCablePath(
            sourceCenter.x,
            sourceCenter.y,
            targetX,
            targetY,
            isDragging
          );

          return (
            <g key={cable.id} filter="url(#cable-drop-shadow)">
              {/* Outer rubber jacket / shadow */}
              <path
                d={pathD}
                fill="none"
                stroke="#020617"
                strokeWidth={isDragging ? 8.5 : 7}
                strokeLinecap="round"
              />
              {/* Main colored cable body */}
              <path
                d={pathD}
                fill="none"
                stroke={cable.color}
                strokeWidth={isDragging ? 6 : 5}
                strokeLinecap="round"
                className={isDragging ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}
              />
              {/* Specular highlight strip along the cable */}
              <path
                d={pathD}
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1.4}
                strokeLinecap="round"
              />

              {/* Source exit boot / grommet */}
              <circle
                cx={sourceCenter.x}
                cy={sourceCenter.y}
                r={5.5}
                fill="#0f172a"
                stroke="#475569"
                strokeWidth={1.5}
              />
              <circle
                cx={sourceCenter.x}
                cy={sourceCenter.y}
                r={3}
                fill={cable.color}
              />

              {/* Free draggable connector plug at pointer */}
              {isDragging && (
                <g transform={`translate(${targetX}, ${targetY})`}>
                  {/* Metal barrel */}
                  <rect
                    x={-5}
                    y={-14}
                    width={10}
                    height={28}
                    rx={3}
                    fill="#1e293b"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                  />
                  {/* Cable color identifier band */}
                  <rect
                    x={-4}
                    y={-5}
                    width={8}
                    height={10}
                    rx={1}
                    fill={cable.color}
                  />
                  {/* Tip contact pin */}
                  <circle
                    cx={0}
                    cy={0}
                    r={2.5}
                    fill="#f8fafc"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Main Tactical Workbench: Left Sources vs Right Destination Jacks */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 my-4 items-center">
        {/* Left Column (5 Cols): SOURCE TERMINALS */}
        <div className="md:col-span-5 flex flex-col gap-2.5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              FUENTES DE SEÑAL
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {cables.length} CABLES
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {cables.map((cable) => {
              const connectedJackId = connections[cable.id];
              const isDragging = draggedCableId === cable.id;

              return (
                <div
                  key={cable.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {/* Signal Source Info (Dot + Label) */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: cable.color }}
                    />
                    <span
                      className="text-xs font-black truncate uppercase tracking-wider"
                      style={{ color: cable.color }}
                    >
                      {cable.name}
                    </span>
                  </div>

                  {/* Right side of row: Connector Dock & Status */}
                  <div className="flex items-center gap-2">
                    {connectedJackId ? (
                      /* Connected state: Shows destination jack and disconnect button */
                      <div
                        ref={(el) => (sourceRefs.current[cable.id] = el)}
                        className="flex items-center gap-1.5"
                      >
                        <div
                          onPointerDown={(e) => {
                            e.preventDefault();
                            handleStartDrag(e.clientX, e.clientY, cable.id);
                          }}
                          style={{ touchAction: 'none' }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/60 bg-emerald-950/40 text-emerald-300 font-mono text-xs font-black cursor-grab active:cursor-grabbing hover:bg-emerald-900/50 shadow-sm"
                          title={`Cable ${cable.name} conectado a ${connectedJackId}. Arrastra para mover.`}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cable.color }}
                          />
                          <span>→ {connectedJackId}</span>
                        </div>
                        <button
                          type="button"
                          disabled={solved}
                          onClick={() => handleDisconnectCable(cable.id)}
                          className="w-6 h-6 rounded-md bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/60 text-slate-400 hover:text-red-300 flex items-center justify-center text-xs font-black transition-colors cursor-pointer"
                          title={`Desconectar cable ${cable.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Unconnected / Idle: Tactile draggable [ CONECTOR ] */
                      <div
                        ref={(el) => (sourceRefs.current[cable.id] = el)}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          handleStartDrag(e.clientX, e.clientY, cable.id);
                        }}
                        style={{ touchAction: 'none' }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-mono text-[11px] font-bold cursor-grab active:cursor-grabbing transition-all select-none shadow-sm ${
                          isDragging
                            ? 'bg-amber-400 text-slate-950 border-white scale-105 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-white'
                        }`}
                        title={`Arrastra el conector del cable ${cable.name}`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-slate-400 shadow-sm"
                          style={{ backgroundColor: cable.color }}
                        />
                        <span>CONECTOR</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): DESTINATION JACK BANK */}
        <div className="md:col-span-7 flex flex-col gap-2.5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
              BANCO DE CLAVIJAS JACK (DESTINO)
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              {jacks.length} PUERTOS
            </span>
          </div>

          {/* Grid of Jacks: responsive columns */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 sm:gap-3 py-1">
            {jacks.map((jackId) => {
              const pluggedCableId = Object.keys(connections).find(
                (cid) => connections[cid] === jackId
              );
              const pluggedCable = pluggedCableId
                ? cables.find((c) => c.id === pluggedCableId)
                : null;

              const isHovered = hoveredJack === jackId;
              const isOccupiedByOther =
                pluggedCableId && draggedCableId && pluggedCableId !== draggedCableId;

              let jackStyle = 'border-slate-700 bg-slate-900 text-slate-300';
              if (isHovered) {
                jackStyle = isOccupiedByOther
                  ? 'border-red-500 bg-red-950/40 text-red-300 ring-2 ring-red-500/50'
                  : 'border-amber-400 bg-amber-950/40 text-amber-200 ring-2 ring-amber-400/80 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.5)]';
              } else if (pluggedCable) {
                jackStyle = 'border-slate-600 bg-slate-950 text-white shadow-md';
              }

              return (
                <div
                  key={jackId}
                  className="relative flex flex-col items-center justify-center"
                >
                  <button
                    ref={(el) => (jackRefs.current[jackId] = el)}
                    type="button"
                    disabled={solved}
                    // If plugged, pointer down on jack connector lets player pull it out to move!
                    onPointerDown={(e) => {
                      if (pluggedCableId) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStartDrag(e.clientX, e.clientY, pluggedCableId);
                      }
                    }}
                    style={{ touchAction: 'none' }}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center p-1 transition-all select-none cursor-pointer ${jackStyle}`}
                    title={
                      pluggedCable
                        ? `Conectado a Cable ${pluggedCable.name}. Arrastra para desconectar o mover.`
                        : `Clavija ${jackId}. Suelta un cable aquí para conectar.`
                    }
                  >
                    {/* Metal socket outer collar */}
                    <div
                      className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shadow-inner"
                      style={{
                        backgroundColor: '#020617',
                        borderColor: pluggedCable
                          ? pluggedCable.color
                          : isHovered
                          ? '#fbbf24'
                          : '#475569',
                      }}
                    >
                      {/* Inner receptacle hole */}
                      <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,1)]" />

                      {/* Visible plugged connector pinhead */}
                      {pluggedCable && (
                        <div
                          className="absolute inset-1 rounded-full border-2 border-white shadow-lg animate-pulse"
                          style={{
                            backgroundColor: pluggedCable.color,
                          }}
                        />
                      )}
                    </div>

                    {/* Jack Name (J1..J10) */}
                    <span className="text-[10px] font-black font-mono tracking-wider mt-0.5">
                      {jackId}
                    </span>

                    {/* Plugged cable tiny badge */}
                    {pluggedCable && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border border-white text-[8px] font-black flex items-center justify-center shadow-md uppercase"
                        style={{ backgroundColor: pluggedCable.color, color: '#000000' }}
                        title={`Conectado: ${pluggedCable.name}`}
                      >
                        {pluggedCable.name.slice(0, 1)}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Warning / Error Feedback Banner */}
      {warningMessage && (
        <div className="relative z-10 w-full mb-3 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-200 text-xs font-bold flex items-center gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {/* Bottom Action Footer Bar */}
      <div className="relative z-10 w-full flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          disabled={solved || Object.values(connections).every((j) => j === null)}
          onClick={handleResetConnections}
          className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REINICIAR CABLES</span>
        </button>

        {solved ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CIRCUITO ESTABILIZADO</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLinkSignal}
            className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
              allConnected
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            ENLAZAR SEÑAL
          </button>
        )}
      </div>
    </div>
  );
};
