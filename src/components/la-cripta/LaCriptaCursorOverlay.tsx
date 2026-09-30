import React, { useEffect, useRef } from 'react';
import { CriptaPlayer, CriptaRemoteCursor, CriptaSceneId } from '../../types/laCripta';

interface LaCriptaCursorOverlayProps {
  currentPlayerId: string;
  activeSceneId: CriptaSceneId;
  players: CriptaPlayer[];
  subscribeToCursors: (listener: (cursor: CriptaRemoteCursor) => void) => () => void;
}

interface InterpolatedCursorState {
  playerId: string;
  name: string;
  color: string;
  sceneId: CriptaSceneId;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  updatedAt: number;
}

const STALE_CURSOR_MS = 14000;

export const LaCriptaCursorOverlay: React.FC<LaCriptaCursorOverlayProps> = ({
  currentPlayerId,
  activeSceneId,
  players,
  subscribeToCursors,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cursorsMapRef = useRef<Map<string, InterpolatedCursorState>>(new Map());
  const domNodesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeSceneRef = useRef<CriptaSceneId>(activeSceneId);
  activeSceneRef.current = activeSceneId;

  const playersRef = useRef<CriptaPlayer[]>(players);
  playersRef.current = players;

  useEffect(() => {
    const unsubscribe = subscribeToCursors((packet) => {
      if (packet.playerId === currentPlayerId) return;
      const existing = cursorsMapRef.current.get(packet.playerId);
      if (existing) {
        existing.name = packet.name;
        existing.color = packet.color;
        existing.sceneId = packet.sceneId;
        existing.targetX = packet.xNormalized;
        existing.targetY = packet.yNormalized;
        existing.updatedAt = packet.updatedAt;
      } else {
        cursorsMapRef.current.set(packet.playerId, {
          playerId: packet.playerId,
          name: packet.name,
          color: packet.color,
          sceneId: packet.sceneId,
          currentX: packet.xNormalized,
          currentY: packet.yNormalized,
          targetX: packet.xNormalized,
          targetY: packet.yNormalized,
          updatedAt: packet.updatedAt,
        });
      }
    });
    return unsubscribe;
  }, [currentPlayerId, subscribeToCursors]);

  useEffect(() => {
    let rafId = 0;

    const createCursorDomElement = (cursor: InterpolatedCursorState): HTMLDivElement => {
      const el = document.createElement('div');
      el.className =
        'pointer-events-none absolute top-0 left-0 z-50 select-none will-change-transform transition-opacity duration-200';
      el.style.transform = `translate3d(${cursor.currentX * 100}vw, ${cursor.currentY * 100}vh, 0)`;

      el.innerHTML = `
        <div class="relative flex items-start">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
            <path d="M3 2L5 19L9.5 14.5L14.5 21L17.5 19L12.5 12.5L19 11L3 2Z" fill="${cursor.color}" stroke="#0B0A0E" stroke-width="2" stroke-linejoin="miter"/>
            <rect x="4" y="3" width="3" height="3" fill="#FFF8E7" opacity="0.85"/>
          </svg>
          <div
            data-role="cursor-label"
            class="ml-0.5 mt-3.5 px-2 py-0.5 rounded bg-[#0B0A0E]/95 border text-[10px] font-cripta-pixel uppercase tracking-wider whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
            style="border-color: ${cursor.color}; color: #D9D0BC;"
          >
            <span data-role="cursor-dot" class="inline-block w-1.5 h-1.5 rounded-xs mr-1 align-middle" style="background-color: ${cursor.color};"></span>
            <span data-role="cursor-name"></span>
          </div>
        </div>
      `;

      const nameSpan = el.querySelector('[data-role="cursor-name"]');
      if (nameSpan) {
        nameSpan.textContent = cursor.name;
      }
      return el;
    };

    const tick = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        const now = Date.now();
        const connectedIds = new Set(
          playersRef.current.filter((p) => p.isConnected).map((p) => p.id)
        );

        for (const [playerId, state] of cursorsMapRef.current.entries()) {
          const isStale = now - state.updatedAt > STALE_CURSOR_MS;
          const isDisconnected = playersRef.current.length > 0 && !connectedIds.has(playerId);

          if (isStale || isDisconnected) {
            const node = domNodesRef.current.get(playerId);
            if (node && node.parentNode) {
              node.parentNode.removeChild(node);
            }
            domNodesRef.current.delete(playerId);
            cursorsMapRef.current.delete(playerId);
            continue;
          }

          // Smooth exponential interpolation
          state.currentX += (state.targetX - state.currentX) * 0.32;
          state.currentY += (state.targetY - state.currentY) * 0.32;

          let node = domNodesRef.current.get(playerId);
          if (!node) {
            node = createCursorDomElement(state);
            domNodesRef.current.set(playerId, node);
            container.appendChild(node);
          }

          // Update color/name if changed in player list
          const livePlayer = playersRef.current.find((p) => p.id === playerId);
          const effectiveColor = livePlayer?.color || state.color;
          const effectiveName = livePlayer?.name || state.name;

          const nameSpan = node.querySelector('[data-role="cursor-name"]');
          if (nameSpan && nameSpan.textContent !== effectiveName) {
            nameSpan.textContent = effectiveName;
          }
          const pathEl = node.querySelector('path');
          if (pathEl && pathEl.getAttribute('fill') !== effectiveColor) {
            pathEl.setAttribute('fill', effectiveColor);
          }
          const labelEl = node.querySelector('[data-role="cursor-label"]') as HTMLElement | null;
          if (labelEl && labelEl.style.borderColor !== effectiveColor) {
            labelEl.style.borderColor = effectiveColor;
          }
          const dotEl = node.querySelector('[data-role="cursor-dot"]') as HTMLElement | null;
          if (dotEl && dotEl.style.backgroundColor !== effectiveColor) {
            dotEl.style.backgroundColor = effectiveColor;
          }

          const sameScene = state.sceneId === activeSceneRef.current;
          node.style.opacity = sameScene ? '1' : '0.28';

          const pxX = Math.round(state.currentX * width);
          const pxY = Math.round(state.currentY * height);
          node.style.transform = `translate3d(${pxX}px, ${pxY}px, 0)`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    />
  );
};
