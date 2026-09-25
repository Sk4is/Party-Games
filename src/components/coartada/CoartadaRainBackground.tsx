import React, { useEffect, useRef } from 'react';

interface CoartadaRainBackgroundProps {
  className?: string;
  enableLightning?: boolean;
}

export const CoartadaRainBackground: React.FC<CoartadaRainBackgroundProps> = ({
  className = '',
  enableLightning = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Subtle rain streaks
    const dropCount = Math.min(55, Math.floor(width / 25));
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: Math.random() * 18 + 10,
      speed: Math.random() * 7 + 9,
      opacity: Math.random() * 0.18 + 0.08,
      slant: Math.random() * 1.5 - 0.75,
    }));

    // Occasional very subtle distant lightning
    let lightningOpacity = 0;
    let nextLightningTime = Date.now() + 25000 + Math.random() * 30000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Distant lightning flash (soft sheet, no jumpscare)
      if (enableLightning) {
        const now = Date.now();
        if (now > nextLightningTime) {
          lightningOpacity = 0.06;
          nextLightningTime = now + 35000 + Math.random() * 45000;
        }
        if (lightningOpacity > 0.001) {
          ctx.fillStyle = `rgba(186, 215, 245, ${lightningOpacity})`;
          ctx.fillRect(0, 0, width, height);
          lightningOpacity *= 0.92;
        }
      }

      // Draw subtle falling rain streaks
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.strokeStyle = `rgba(200, 215, 230, ${d.opacity})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.slant * 4, d.y + d.len);
        ctx.stroke();

        d.y += d.speed;
        d.x += d.slant;

        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * width;
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enableLightning]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}>
      {/* Dark rainy night vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] via-[#0d1017] to-[#07080a]" />

      {/* Warm tungsten desk lamp glow from lower corner */}
      <div className="absolute -bottom-24 -left-24 w-[36rem] h-[36rem] rounded-full bg-gradient-to-tr from-amber-600/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-cyan-950/20 to-transparent blur-3xl pointer-events-none" />

      {/* Atmospheric rain canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* Subtle window pane lines */}
      <div className="absolute inset-0 border-8 border-black/40 pointer-events-none" />
      <div className="absolute top-0 bottom-0 left-1/2 w-2 bg-black/30 pointer-events-none hidden md:block" />
      <div className="absolute left-0 right-0 top-1/2 h-2 bg-black/30 pointer-events-none hidden md:block" />
    </div>
  );
};
