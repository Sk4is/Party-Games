/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { DarkProtocolGameState } from '../../types/darkProtocol';
import {
  DarkProtocolCanvasEngine,
  RendererDebugOptions,
  InteractionPromptTarget,
} from './renderer/engine';

interface DarkProtocolCanvasProps {
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onInteractPrompt: (prompt: InteractionPromptTarget | null) => void;
  onRoomChange: (newRoom: string, targetX: number, facing: 'left' | 'right') => void;
  onOpenMinigame: (minigameType: string) => void;
  debugOptions: RendererDebugOptions;
  engineRef?: React.MutableRefObject<DarkProtocolCanvasEngine | null>;
}

export const DarkProtocolCanvas: React.FC<DarkProtocolCanvasProps> = ({
  state,
  onUpdateState,
  onInteractPrompt,
  onRoomChange,
  onOpenMinigame,
  debugOptions,
  engineRef,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const internalEngineRef = useRef<DarkProtocolCanvasEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new DarkProtocolCanvasEngine(
      canvas,
      () => stateRef.current,
      onUpdateState,
      onInteractPrompt,
      onRoomChange,
      onOpenMinigame
    );

    internalEngineRef.current = engine;
    if (engineRef) engineRef.current = engine;
    engine.debugOptions = debugOptions;
    engine.handleResize();
    engine.start();

    // Use ResizeObserver on container to guarantee instant 100% viewport coverage
    const ro = new ResizeObserver(() => {
      engine.handleResize();
    });
    ro.observe(container);

    const handleWindowResize = () => engine.handleResize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      engine.destroy();
      internalEngineRef.current = null;
      if (engineRef) engineRef.current = null;
    };
  }, []);

  // Sync debug options when changed
  useEffect(() => {
    if (internalEngineRef.current) {
      internalEngineRef.current.debugOptions = debugOptions;
    }
  }, [debugOptions]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#030508] select-none flex items-center justify-center"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
