import React, { useEffect, useRef, useState } from 'react';
import { FortunariumPlayer, FortunariumRemoteCursor } from '../../types/fortunarium';

interface FortunariumCursorsOverlayProps {
  players: FortunariumPlayer[];
  localPlayerId: string;
  subscribeToCursors: (
    listener: (cursor: FortunariumRemoteCursor) => void
  ) => () => void;
}

interface InterpolatedCursor {
  playerId: string;
  name: string;
  color: string;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  lastUpdated: number;
}

export const FortunariumCursorsOverlay: React.FC<FortunariumCursorsOverlayProps> =
  React.memo(({ players, localPlayerId, subscribeToCursors }) => {
    const cursorsMapRef = useRef<Map<string, InterpolatedCursor>>(new Map());
    const domNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);

    // Keep player names & colors synced when roomState.players changes
    useEffect(() => {
      const connectedRemote = players.filter(
        (p) => p.isConnected && p.id !== localPlayerId
      );
      const validIds = new Set(connectedRemote.map((p) => p.id));

      // Remove disconnected players
      for (const existingId of cursorsMapRef.current.keys()) {
        if (!validIds.has(existingId)) {
          cursorsMapRef.current.delete(existingId);
        }
      }

      // Update metadata for connected remote players
      connectedRemote.forEach((p, idx) => {
        const existing = cursorsMapRef.current.get(p.id);
        if (existing) {
          existing.name = p.name;
          existing.color = p.color || '#06b6d4';
        } else {
          // Default resting position near top-right of machine until they move
          const defaultX = 0.78 + (idx % 2) * 0.08;
          const defaultY = 0.22 + idx * 0.1;
          cursorsMapRef.current.set(p.id, {
            playerId: p.id,
            name: p.name,
            color: p.color || '#06b6d4',
            currentX: defaultX,
            currentY: defaultY,
            targetX: defaultX,
            targetY: defaultY,
            lastUpdated: Date.now(),
          });
        }
      });

      setActivePlayerIds(Array.from(cursorsMapRef.current.keys()));
    }, [players, localPlayerId]);

    // Subscribe to incoming cursor packets without re-rendering parent
    useEffect(() => {
      return subscribeToCursors((incoming) => {
        if (incoming.playerId === localPlayerId) return;
        const clampedX = Math.max(0.01, Math.min(0.99, incoming.x));
        const clampedY = Math.max(0.01, Math.min(0.99, incoming.y));

        const existing = cursorsMapRef.current.get(incoming.playerId);
        if (existing) {
          existing.targetX = clampedX;
          existing.targetY = clampedY;
          existing.name = incoming.name || existing.name;
          existing.color = incoming.color || existing.color;
          existing.lastUpdated = incoming.updatedAt;
        } else {
          cursorsMapRef.current.set(incoming.playerId, {
            playerId: incoming.playerId,
            name: incoming.name || 'Operador',
            color: incoming.color || '#06b6d4',
            currentX: clampedX,
            currentY: clampedY,
            targetX: clampedX,
            targetY: clampedY,
            lastUpdated: incoming.updatedAt,
          });
          setActivePlayerIds(Array.from(cursorsMapRef.current.keys()));
        }
      });
    }, [subscribeToCursors, localPlayerId]);

    // Smooth 60fps client-side interpolation loop mutating transform directly
    useEffect(() => {
      let rafId: number;
      const animate = () => {
        for (const [id, cursor] of cursorsMapRef.current.entries()) {
          const dx = cursor.targetX - cursor.currentX;
          const dy = cursor.targetY - cursor.currentY;
          cursor.currentX += dx * 0.28;
          cursor.currentY += dy * 0.28;

          const node = domNodesRef.current.get(id);
          if (node) {
            node.style.left = `${(cursor.currentX * 100).toFixed(2)}%`;
            node.style.top = `${(cursor.currentY * 100).toFixed(2)}%`;
          }
        }
        rafId = requestAnimationFrame(animate);
      };
      rafId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafId);
    }, []);

    return (
      <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden select-none">
        {activePlayerIds.map((pid) => {
          const c = cursorsMapRef.current.get(pid);
          const playerObj = players.find((p) => p.id === pid);
          const color = playerObj?.color || c?.color || '#06b6d4';
          const name = playerObj?.name || c?.name || 'Jugador';
          const initX = c ? c.currentX * 100 : 80;
          const initY = c ? c.currentY * 100 : 25;

          return (
            <div
              key={pid}
              ref={(el) => {
                if (el) domNodesRef.current.set(pid, el);
                else domNodesRef.current.delete(pid);
              }}
              style={{
                left: `${initX}%`,
                top: `${initY}%`,
              }}
              className="absolute -translate-x-1 -translate-y-1 flex items-start gap-1 will-change-[left,top]"
            >
              {/* Clean SVG Arrow Pointer */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] shrink-0"
              >
                <path
                  d="M4 3L11.5 20L14.2 13.5L20.5 10.8L4 3Z"
                  fill={color}
                  stroke="#09060e"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Player Name Tag */}
              <span
                style={{
                  backgroundColor: color,
                }}
                className="mt-3 px-2 py-0.5 rounded-md text-[11px] font-black text-stone-950 shadow-[0_2px_8px_rgba(0,0,0,0.75)] border border-black/40 whitespace-nowrap leading-tight"
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>
    );
  });
