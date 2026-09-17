import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawingTool, NormalizedPoint } from '../../types/pinturillo';
import { audio } from '../../utils/audio';

interface PinturilloCanvasProps {
  isDrawer: boolean;
  strokes: DrawStroke[];
  currentTool: DrawingTool;
  currentColor: string;
  currentSize: number;
  onStrokeStart?: (stroke: DrawStroke) => void;
  onStrokeChunk?: (strokeId: string, points: NormalizedPoint[]) => void;
  onStrokeEnd?: (strokeId: string) => void;
  onFloodFill?: (point: NormalizedPoint, color: string) => void;
}

// Convert hex color to RGBA [r, g, b, a]
function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

// Flood fill algorithm using BFS with 32-bit pixel array for fast performance
function executeFloodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const targetColor = hexToRgba(fillColorHex);

  const startIdx = (Math.floor(startY) * width + Math.floor(startX)) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  // If clicking on same color, do nothing
  if (
    Math.abs(startR - targetColor[0]) < 5 &&
    Math.abs(startG - targetColor[1]) < 5 &&
    Math.abs(startB - targetColor[2]) < 5 &&
    Math.abs(startA - targetColor[3]) < 5
  ) {
    return;
  }

  const matchesStart = (idx: number) => {
    return (
      Math.abs(data[idx] - startR) < 32 &&
      Math.abs(data[idx + 1] - startG) < 32 &&
      Math.abs(data[idx + 2] - startB) < 32 &&
      Math.abs(data[idx + 3] - startA) < 32
    );
  };

  const pixelStack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Uint8Array(width * height);

  while (pixelStack.length > 0) {
    const [x, y] = pixelStack.pop()!;
    let currentY = y;
    let pixelIdx = (currentY * width + x) * 4;

    while (currentY >= 0 && matchesStart(pixelIdx)) {
      currentY--;
      pixelIdx -= width * 4;
    }

    currentY++;
    pixelIdx += width * 4;

    let reachLeft = false;
    let reachRight = false;

    while (currentY < height && matchesStart(pixelIdx)) {
      const vIdx = currentY * width + x;
      if (visited[vIdx]) break;
      visited[vIdx] = 1;

      data[pixelIdx] = targetColor[0];
      data[pixelIdx + 1] = targetColor[1];
      data[pixelIdx + 2] = targetColor[2];
      data[pixelIdx + 3] = targetColor[3];

      if (x > 0) {
        if (matchesStart(pixelIdx - 4)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, currentY]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < width - 1) {
        if (matchesStart(pixelIdx + 4)) {
          if (!reachRight) {
            pixelStack.push([x + 1, currentY]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      currentY++;
      pixelIdx += width * 4;
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export const PinturilloCanvas: React.FC<PinturilloCanvasProps> = ({
  isDrawer,
  strokes,
  currentTool,
  currentColor,
  currentSize,
  onStrokeStart,
  onStrokeChunk,
  onStrokeEnd,
  onFloodFill,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active stroke tracking
  const activeStrokeRef = useRef<DrawStroke | null>(null);
  const pendingChunkRef = useRef<NormalizedPoint[]>([]);
  const chunkTimerRef = useRef<any>(null);

  // Custom cursor position state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isInsideCanvas, setIsInsideCanvas] = useState(false);

  // Redraw complete canvas from strokes history
  const redrawAllStrokes = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Fill pure white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    strokes.forEach(stroke => {
      if (stroke.isFill && stroke.fillPoint) {
        const fx = stroke.fillPoint.x * w;
        const fy = stroke.fillPoint.y * h;
        executeFloodFill(ctx, fx, fy, stroke.color, w, h);
        return;
      }

      if (!stroke.points || stroke.points.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Scale stroke size relative to canvas width
      const scaledSize = Math.max(1.5, stroke.size * (w / 800));
      ctx.lineWidth = scaledSize;

      if (stroke.tool === 'eraser') {
        ctx.strokeStyle = '#FFFFFF';
      } else {
        ctx.strokeStyle = stroke.color;
      }

      const pts = stroke.points;
      if (pts.length === 1) {
        const x = pts[0].x * w;
        const y = pts[0].y * h;
        ctx.fillStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
        ctx.beginPath();
        ctx.arc(x, y, scaledSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.moveTo(pts[0].x * w, pts[0].y * h);

        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const midX = ((p0.x + p1.x) / 2) * w;
          const midY = ((p0.y + p1.y) / 2) * h;
          ctx.quadraticCurveTo(p0.x * w, p0.y * h, midX, midY);
        }

        const last = pts[pts.length - 1];
        ctx.lineTo(last.x * w, last.y * h);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [strokes]);

  // Adjust canvas pixel resolution to match container bounding rect
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const targetW = Math.floor(rect.width);
      const targetH = Math.floor(rect.height);

      if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
        canvas.width = targetW;
        canvas.height = targetH;
        redrawAllStrokes(canvas);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [redrawAllStrokes]);

  // Redraw when strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      redrawAllStrokes(canvas);
    }
  }, [strokes, redrawAllStrokes]);

  // Flush batched chunk points over network
  const flushChunk = useCallback(() => {
    if (!activeStrokeRef.current || pendingChunkRef.current.length === 0) return;
    const chunk = [...pendingChunkRef.current];
    pendingChunkRef.current = [];
    if (onStrokeChunk) {
      onStrokeChunk(activeStrokeRef.current.id, chunk);
    }
  }, [onStrokeChunk]);

  // Pointer Down (Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent default touch scrolling
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clientX / canvas.width));
    const normY = Math.max(0, Math.min(1, clientY / canvas.height));
    const pt: NormalizedPoint = { x: normX, y: normY };

    // Tool: Flood Fill
    if (currentTool === 'fill') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        audio.playPinturilloFill();
        executeFloodFill(ctx, clientX, clientY, currentColor, canvas.width, canvas.height);
        if (onFloodFill) {
          onFloodFill(pt, currentColor);
        }
      }
      return;
    }

    // Tools: Pencil, Marker, Brush, Eraser
    audio.playPinturilloStroke();

    const newStroke: DrawStroke = {
      id: `strk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: currentTool,
      color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
      size: currentSize,
      points: [pt],
    };

    activeStrokeRef.current = newStroke;
    pendingChunkRef.current = [];

    // Render immediately locally
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      const scaledSize = Math.max(1.5, currentSize * (canvas.width / 800));
      ctx.fillStyle = newStroke.color;
      ctx.beginPath();
      ctx.arc(clientX, clientY, scaledSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (onStrokeStart) {
      onStrokeStart(newStroke);
    }

    // Schedule chunk flush timer
    if (!chunkTimerRef.current) {
      chunkTimerRef.current = setInterval(flushChunk, 30);
    }
  };

  // Pointer Move (Mouse, Touch, Stylus)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (isDrawer) {
      setCursorPos({ x: clientX, y: clientY });
    }

    if (!isDrawer || !activeStrokeRef.current) return;

    const normX = Math.max(0, Math.min(1, clientX / canvas.width));
    const normY = Math.max(0, Math.min(1, clientY / canvas.height));
    const pt: NormalizedPoint = { x: normX, y: normY };

    const stroke = activeStrokeRef.current;
    const prevPt = stroke.points[stroke.points.length - 1];

    stroke.points.push(pt);
    pendingChunkRef.current.push(pt);

    // Render continuous smoothed curve locally immediately
    const ctx = canvas.getContext('2d');
    if (ctx && prevPt) {
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const scaledSize = Math.max(1.5, stroke.size * (canvas.width / 800));
      ctx.lineWidth = scaledSize;
      ctx.strokeStyle = stroke.color;

      const p0x = prevPt.x * canvas.width;
      const p0y = prevPt.y * canvas.height;
      const midX = (p0x + clientX) / 2;
      const midY = (p0y + clientY) / 2;

      ctx.moveTo(p0x, p0y);
      ctx.quadraticCurveTo(p0x, p0y, midX, midY);
      ctx.lineTo(clientX, clientY);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !activeStrokeRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    flushChunk();

    if (onStrokeEnd && activeStrokeRef.current) {
      onStrokeEnd(activeStrokeRef.current.id);
    }

    activeStrokeRef.current = null;
  };

  // Render custom floating cursor for drawing tools
  const renderCustomCursor = () => {
    if (!isDrawer || !isInsideCanvas || !cursorPos) return null;

    const canvas = canvasRef.current;
    const scaledSize = canvas ? Math.max(2, currentSize * (canvas.width / 800)) : currentSize;
    const radius = scaledSize / 2;

    return (
      <div
        className="pointer-events-none absolute z-30 transition-none"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          transform: 'translate(0, 0)',
        }}
      >
        {/* Subtle circular outline showing effective brush radius */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-700/60 pointer-events-none"
          style={{
            width: `${Math.max(6, scaledSize)}px`,
            height: `${Math.max(6, scaledSize)}px`,
            backgroundColor: currentTool === 'eraser' ? 'rgba(255,255,255,0.4)' : `${currentColor}22`,
          }}
        />

        {/* Realistic tool icon positioned at drawing tip */}
        <div className="absolute -left-1 -top-7 select-none filter drop-shadow-md">
          {currentTool === 'pencil' && <span className="text-xl">✏️</span>}
          {currentTool === 'marker' && <span className="text-xl">🖊️</span>}
          {currentTool === 'brush' && <span className="text-xl">🖌️</span>}
          {currentTool === 'eraser' && <span className="text-xl">🧽</span>}
          {currentTool === 'fill' && <span className="text-xl">🪣</span>}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsInsideCanvas(true)}
      onMouseLeave={() => {
        setIsInsideCanvas(false);
        setCursorPos(null);
      }}
      className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/80 bg-white select-none ${
        isDrawer ? 'cursor-none' : 'cursor-default'
      }`}
      style={{
        touchAction: 'none', // Crucial: prevents mobile screen pull-to-refresh and page scroll while drawing
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block bg-white"
        style={{ touchAction: 'none' }}
      />

      {/* Drawer custom cursor overlay */}
      {renderCustomCursor()}
    </div>
  );
};
