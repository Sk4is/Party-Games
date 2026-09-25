import React, { useEffect } from 'react';
import { CoartadaRole } from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaRoleRevealProps {
  role: CoartadaRole;
  caseTitle?: string;
}

export const CoartadaRoleReveal: React.FC<CoartadaRoleRevealProps> = ({ role, caseTitle }) => {
  useEffect(() => {
    audio.playPaperSlide();
    const timer = setTimeout(() => {
      audio.playStampHeavy();
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const isDetective = role === 'DETECTIVE';

  return (
    <div className="relative z-20 flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto p-6 text-center select-none animate-in fade-in duration-300">
      {/* Physical Folder Landing on Desk */}
      <div className="relative w-full p-8 rounded-2xl bg-[#1a1714] border-2 border-stone-700 shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-500">
        {/* Subtle folder tab at top */}
        <div className="absolute top-0 left-6 px-4 py-1 bg-stone-800 rounded-b-md text-[10px] font-mono text-stone-400 uppercase tracking-widest border-b border-x border-stone-700">
          EXPEDIENTE ASIGNADO
        </div>

        <div className="mt-4 mb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-500 block mb-1">
            TU ROL AUTORIZADO
          </span>

          {/* Heavy Ink Stamp */}
          <div
            className={`inline-block my-4 px-6 py-3 rounded-lg border-4 font-mono font-black text-3xl sm:text-4xl tracking-widest uppercase transform -rotate-3 shadow-md animate-in zoom-in-75 duration-300 ${
              isDetective
                ? 'border-red-600 text-red-500 shadow-red-950/50'
                : 'border-amber-600 text-amber-500 shadow-amber-950/50'
            }`}
          >
            {role}
          </div>
        </div>

        {/* Atmospheric Mission brief */}
        <p className="text-sm font-serif text-stone-300 leading-relaxed mb-4">
          {isDetective
            ? 'Has sido asignado para esclarecer el suceso. Reúne las pruebas, interroga al sospechoso y determina la verdad.'
            : 'Un incidente ha tenido lugar. Tienes una coartada pública, pero también tus propios motivos para guardar silencio.'}
        </p>

        {caseTitle && (
          <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 text-[11px] font-mono text-amber-300/80 truncate">
            {caseTitle}
          </div>
        )}

        <span className="text-[10px] font-mono text-stone-500 block mt-4 animate-pulse">
          Accediendo a la sala de interrogatorios...
        </span>
      </div>
    </div>
  );
};
