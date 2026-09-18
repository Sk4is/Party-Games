import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { audio } from '../../utils/audio';

interface RoomCodeProps {
  code: string;
  gameSlug: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo';
}

export const RoomCode: React.FC<RoomCodeProps> = ({ code, gameSlug }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCode = () => {
    audio.playSpark();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    audio.playSpark();
    const url = `${window.location.origin}${window.location.pathname}?game=${gameSlug}&room=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const codeColor =
    gameSlug === 'la-peor-respuesta'
      ? 'text-[#FF3B4F]'
      : gameSlug === 'pinturillo'
      ? 'text-[#00BCEB]'
      : 'text-[#FFB000]';

  const shareBtnColor =
    gameSlug === 'la-peor-respuesta'
      ? 'bg-[#FF3B4F]/15 hover:bg-[#FF3B4F]/25 text-[#FF3B4F] border-[#FF3B4F]/30'
      : gameSlug === 'pinturillo'
      ? 'bg-[#00BCEB]/15 hover:bg-[#00BCEB]/25 text-[#00BCEB] border-[#00BCEB]/30'
      : 'bg-[#FFB000]/15 hover:bg-[#FFB000]/25 text-[#FFB000] border-[#FFB000]/30';

  return (
    <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
            Código de la sala
          </span>
          <div className={`text-3xl sm:text-4xl font-mono font-black tracking-widest ${codeColor}`}>
            {code}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Comparte este código o el enlace con tus amigos para que se unan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-stone-700 transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar código</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-colors cursor-pointer ${shareBtnColor}`}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">¡Enlace copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Compartir enlace</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
