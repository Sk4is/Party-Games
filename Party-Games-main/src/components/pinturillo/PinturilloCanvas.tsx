import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawStroke, DrawingTool, NormalizedPoint } from '../../types/pinturillo';
import { audio } from '../../utils/audio';

interface PinturilloCanvasProps {
  isDrawer: boolean;
  strokes: DrawStroke[];
  currentTool: DrawingTool;
  currentColor: string;
  currentSize: number;
  isClearConfirmOpen?: boolean;
  onConfirmClear?: () => void;
  onCancelClear?: () => void;
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

// Pseudo-random noise function for reproducible graphite pencil grain
function getGraphiteJitter(x: number, y: number, seed: number = 1): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return (n - Math.floor(n)) * 2 - 1; // -1 to 1
}

/**
 * 1. LÁPIZ (PENCIL):
 * - Textured, sketchy, graphite feel.
 * - Fine, granular graphite texture with semi-opaque layering (0.80 alpha).
 * - Faint secondary jitter pass producing authentic pencil tooth.
 */
function renderPencilStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke, w: number, h: number) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  const scaledSize = Math.max(1.2, stroke.size * 0.85 * (w / 800));

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = scaledSize;

  if (pts.length === 1) {
    const cx = pts[0].x * w;
    const cy = pts[0].y * h;
    ctx.beginPath();
    ctx.arc(cx, cy, scaledSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Secondary micro-grain specks for authentic graphite texture
    ctx.globalAlpha = 0.45;
    for (let j = 0; j < 4; j++) {
      const jx = getGraphiteJitter(pts[0].x * 100, pts[0].y * 100, j) * (scaledSize * 0.4);
      const jy = getGraphiteJitter(pts[0].x * 100, pts[0].y * 100, j + 10) * (scaledSize * 0.4);
      ctx.fillRect(cx + jx - 0.5, cy + jy - 0.5, 1, 1);
    }
    ctx.restore();
    return;
  }

  // Draw main graphite stroke
  ctx.beginPath();
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

  // Subtle graphite texture: secondary faint jitter pass along the stroke
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = Math.max(0.8, scaledSize * 0.45);
  ctx.beginPath();
  const j0x = getGraphiteJitter(pts[0].x * 200, pts[0].y * 200, 1) * 0.8;
  const j0y = getGraphiteJitter(pts[0].x * 200, pts[0].y * 200, 2) * 0.8;
  ctx.moveTo(pts[0].x * w + j0x, pts[0].y * h + j0y);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const jx = getGraphiteJitter(p.x * 200, p.y * 200, i) * 0.8;
    const jy = getGraphiteJitter(p.x * 200, p.y * 200, i + 50) * 0.8;
    ctx.lineTo(p.x * w + jx, p.y * h + jy);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 2. ROTULADOR (MARKER):
 * - Solid, bold, clean, 100% opaque saturated ink.
 * - Crisp vector-like edges with zero feathering.
 */
function renderMarkerStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke, w: number, h: number) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  const scaledSize = Math.max(2.0, stroke.size * 1.15 * (w / 800));

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = scaledSize;

  if (pts.length === 1) {
    const cx = pts[0].x * w;
    const cy = pts[0].y * h;
    ctx.beginPath();
    ctx.arc(cx, cy, scaledSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
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

  ctx.restore();
}

/**
 * 3. PINCEL (BRUSH):
 * - Fluid, organic stroke with velocity & curve dynamic thickness variation.
 * - Naturally tapered tip & start.
 * - Softer edges / watercolor fluid ink feeling.
 */
function renderBrushStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke, w: number, h: number) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  const baseRadius = Math.max(1.2, (stroke.size * 1.05 * (w / 800)) / 2);

  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = stroke.color;
  ctx.strokeStyle = stroke.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Single point
  if (pts.length === 1) {
    const cx = pts[0].x * w;
    const cy = pts[0].y * h;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Precompute dynamic radius at each point based on distance (speed) and natural start/end tapering
  const n = pts.length;
  const radii: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let speedFactor = 1.0;
    if (i > 0) {
      const dx = (pts[i].x - pts[i - 1].x) * w;
      const dy = (pts[i].y - pts[i - 1].y) * h;
      const dist = Math.sqrt(dx * dx + dy * dy);
      speedFactor = Math.max(0.45, Math.min(1.35, 1.4 - dist / 35));
    }

    const startTaper = n > 3 ? Math.min(1, (i + 1) / 4) : 1;
    const endTaper = n > 4 ? Math.min(1, (n - i) / 4) : 1;
    const taper = Math.min(startTaper, endTaper);

    radii[i] = Math.max(0.8, baseRadius * speedFactor * (0.35 + 0.65 * taper));
  }

  // Render organic ribbon between consecutive points using interpolated overlapping circles
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const x0 = p0.x * w;
    const y0 = p0.y * h;
    const x1 = p1.x * w;
    const y1 = p1.y * h;
    const r0 = radii[i];
    const r1 = radii[i + 1];

    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist / Math.max(1.5, Math.min(r0, r1) * 0.6)));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const curX = x0 + dx * t;
      const curY = y0 + dy * t;
      const curR = r0 + (r1 - r0) * t;

      ctx.beginPath();
      ctx.arc(curX, curY, curR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * 4. GOMA (ERASER):
 * - Solid pure white erasure with crisp round profile.
 */
function renderEraserStroke(ctx: CanvasRenderingContext2D, stroke: DrawStroke, w: number, h: number) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  const scaledSize = Math.max(3.0, stroke.size * 1.5 * (w / 800));

  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = scaledSize;

  if (pts.length === 1) {
    const cx = pts[0].x * w;
    const cy = pts[0].y * h;
    ctx.beginPath();
    ctx.arc(cx, cy, scaledSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
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

  ctx.restore();
}

export const PinturilloCanvas: React.FC<PinturilloCanvasProps> = ({
  isDrawer,
  strokes,
  currentTool,
  currentColor,
  currentSize,
  isClearConfirmOpen = false,
  onConfirmClear,
  onCancelClear,
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
  const [isSweeping, setIsSweeping] = useState(false);

  // Handle ESC key to dismiss clear confirmation modal
  useEffect(() => {
    if (!isClearConfirmOpen || !onCancelClear) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClearConfirmOpen, onCancelClear]);

  // Execute confirm clear with brief white wipe animation
  const handleExecuteConfirm = () => {
    setIsSweeping(true);
    setTimeout(() => setIsSweeping(false), 420);
    if (onConfirmClear) {
      onConfirmClear();
    }
  };

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

      if (stroke.tool === 'pencil') {
        renderPencilStroke(ctx, stroke, w, h);
      } else if (stroke.tool === 'brush') {
        renderBrushStroke(ctx, stroke, w, h);
      } else if (stroke.tool === 'eraser') {
        renderEraserStroke(ctx, stroke, w, h);
      } else {
        renderMarkerStroke(ctx, stroke, w, h);
      }
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
    if (!isDrawer || isClearConfirmOpen) return;

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
      if (newStroke.tool === 'pencil') {
        renderPencilStroke(ctx, newStroke, canvas.width, canvas.height);
      } else if (newStroke.tool === 'brush') {
        renderBrushStroke(ctx, newStroke, canvas.width, canvas.height);
      } else if (newStroke.tool === 'eraser') {
        renderEraserStroke(ctx, newStroke, canvas.width, canvas.height);
      } else {
        renderMarkerStroke(ctx, newStroke, canvas.width, canvas.height);
      }
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
    if (isClearConfirmOpen) {
      setCursorPos(null);
      return;
    }

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

    // Render continuous smoothed segment locally immediately with matching tool characteristics
    const ctx = canvas.getContext('2d');
    if (ctx && prevPt) {
      const w = canvas.width;
      const h = canvas.height;
      const p0x = prevPt.x * w;
      const p0y = prevPt.y * h;

      if (stroke.tool === 'pencil') {
        const scaledSize = Math.max(1.2, stroke.size * 0.85 * (w / 800));
        ctx.save();
        ctx.globalAlpha = 0.82;
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = scaledSize;

        const midX = (p0x + clientX) / 2;
        const midY = (p0y + clientY) / 2;
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.quadraticCurveTo(p0x, p0y, midX, midY);
        ctx.lineTo(clientX, clientY);
        ctx.stroke();

        // Graphite micro-texture jitter pass
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = Math.max(0.8, scaledSize * 0.45);
        const jx = getGraphiteJitter(normX * 200, normY * 200, stroke.points.length) * 0.8;
        const jy = getGraphiteJitter(normX * 200, normY * 200, stroke.points.length + 50) * 0.8;
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(clientX + jx, clientY + jy);
        ctx.stroke();
        ctx.restore();
      } else if (stroke.tool === 'brush') {
        const baseRadius = Math.max(1.2, (stroke.size * 1.05 * (w / 800)) / 2);
        const dx = clientX - p0x;
        const dy = clientY - p0y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speedFactor = Math.max(0.45, Math.min(1.35, 1.4 - dist / 35));
        const curR = Math.max(0.8, baseRadius * speedFactor);

        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = stroke.color;
        const steps = Math.max(1, Math.ceil(dist / Math.max(1.5, curR * 0.6)));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          ctx.beginPath();
          ctx.arc(p0x + dx * t, p0y + dy * t, curR, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (stroke.tool === 'eraser') {
        const scaledSize = Math.max(3.0, stroke.size * 1.5 * (w / 800));
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.fillStyle = '#FFFFFF';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = scaledSize;

        const midX = (p0x + clientX) / 2;
        const midY = (p0y + clientY) / 2;
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.quadraticCurveTo(p0x, p0y, midX, midY);
        ctx.lineTo(clientX, clientY);
        ctx.stroke();
        ctx.restore();
      } else {
        // Marker
        const scaledSize = Math.max(2.0, stroke.size * 1.15 * (w / 800));
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = scaledSize;

        const midX = (p0x + clientX) / 2;
        const midY = (p0y + clientY) / 2;
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.quadraticCurveTo(p0x, p0y, midX, midY);
        ctx.lineTo(clientX, clientY);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || isClearConfirmOpen || !activeStrokeRef.current) return;

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
    if (!isDrawer || !isInsideCanvas || !cursorPos || isClearConfirmOpen) return null;

    const canvas = canvasRef.current;
    let scaledSize = canvas ? Math.max(2, currentSize * (canvas.width / 800)) : currentSize;
    if (currentTool === 'pencil') {
      scaledSize = Math.max(2, scaledSize * 0.85);
    } else if (currentTool === 'marker') {
      scaledSize = Math.max(3, scaledSize * 1.15);
    } else if (currentTool === 'eraser') {
      scaledSize = Math.max(4, scaledSize * 1.5);
    }

    return (
      <div
        className="pointer-events-none absolute z-30 transition-none"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          transform: 'translate(0, 0)',
        }}
      >
        {/* Subtle circular outline showing effective tool footprint */}
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all ${
            currentTool === 'pencil'
              ? 'border border-dashed border-slate-700/80 bg-slate-400/20'
              : currentTool === 'brush'
              ? 'border-2 border-amber-400/70 shadow-[0_0_8px_rgba(245,158,11,0.45)]'
              : currentTool === 'eraser'
              ? 'border-2 border-slate-900 bg-white/80 shadow-md'
              : 'border-2 border-slate-900 shadow-sm'
          }`}
          style={{
            width: `${Math.max(6, scaledSize)}px`,
            height: `${Math.max(6, scaledSize)}px`,
            backgroundColor:
              currentTool === 'eraser'
                ? 'rgba(255,255,255,0.7)'
                : currentTool === 'brush'
                ? `${currentColor}33`
                : currentTool === 'pencil'
                ? `${currentColor}25`
                : `${currentColor}55`,
          }}
        />

        {/* Tool icon positioned at drawing tip */}
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
    <div className="relative w-full h-full">
      {/* Pure White Drawing Canvas Container (#FFFFFF) */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsInsideCanvas(true)}
        onMouseLeave={() => {
          setIsInsideCanvas(false);
          setCursorPos(null);
        }}
        className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/80 bg-white select-none ${
          isDrawer && !isClearConfirmOpen ? 'cursor-none' : 'cursor-default'
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

        {/* Quick White Wipe / Sweep Animation on Clear */}
        {isSweeping && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-95 animate-canvas-sweep" />
          </div>
        )}

        {/* Clear Canvas Safety Confirmation Modal DIRECTLY INSIDE THE WHITE CANVAS */}
        {isClearConfirmOpen && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/25 backdrop-blur-[2px] animate-fade-in select-none"
            onClick={onCancelClear}
          >
            <div
              className="bg-[#0b1022] border-2 border-rose-500/60 rounded-2xl sm:rounded-3xl p-5 sm:p-7 max-w-sm w-full text-center shadow-[0_25px_65px_-10px_rgba(0,0,0,0.9)] animate-modal-pop-in"
              onClick={e => e.stopPropagation()}
            >
              <div
                className="w-13 h-13 sm:w-14 sm:h-14 mx-auto mb-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-3xl shadow-inner animate-bounce"
                style={{ animationDuration: '2.5s' }}
              >
                🗑️
              </div>
              <h3 className="text-lg sm:text-2xl font-black font-display text-white mb-2 tracking-wide">
                ¿BORRAR TODO EL DIBUJO?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 font-medium leading-relaxed">
                Se eliminará todo el dibujo de esta ronda.
              </p>
              <div className="flex items-center gap-2.5 sm:gap-3 justify-center">
                <button
                  type="button"
                  onClick={onCancelClear}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer border border-slate-700 active:scale-95 shadow-sm"
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleExecuteConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-rose-600/40 cursor-pointer active:scale-95"
                >
                  SÍ, BORRAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
