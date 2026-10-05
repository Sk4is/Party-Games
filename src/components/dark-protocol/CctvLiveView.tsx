/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { DarkProtocolGameState } from '../../types/darkProtocol';
import { renderLiveCctvFeed } from './renderer/cctvRenderer';

interface CctvLiveViewProps {
  state: DarkProtocolGameState;
  camId: string;
  className?: string;
}

export const CctvLiveView: React.FC<CctvLiveViewProps> = ({
  state,
  camId,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let animId: number;
    let startTime = performance.now();

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Ensure canvas internal resolution matches display size
        const rect = canvas.getBoundingClientRect();
        const targetW = Math.max(320, Math.floor(rect.width));
        const targetH = Math.max(200, Math.floor(rect.height));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const animTimer = (now - startTime) / 1000;
        renderLiveCctvFeed(canvas, stateRef.current, camId, animTimer);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [camId]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black select-none ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
