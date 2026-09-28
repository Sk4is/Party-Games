import React, { useEffect } from 'react';
import { CardRank } from '../../types/cantina';
import { CANTINA_CARD_ASSETS, logCantinaCardAssetError } from '../../data/cantina/cantinaAssets';
import { BookOpen, X } from 'lucide-react';

interface CantinaCadenaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASIC_RULES: { label: string; text: string }[] = [
  {
    label: 'OBJETIVO',
    text: 'Quédate sin cartas antes que los demás.',
  },
  {
    label: 'CONECTA',
    text: 'Juega el número inmediatamente superior o inferior al de la mesa.',
  },
  {
    label: 'CADENAS',
    text: 'Puedes jugar varios números consecutivos en la misma dirección.',
  },
  {
    label: 'DUPLICADOS',
    text: 'Puedes colocar varias copias del mismo número juntas dentro de una cadena.',
  },
  {
    label: 'VUELTA COMPLETA',
    text: 'El 10 conecta con el 1.',
  },
  {
    label: 'ÚLTIMA',
    text: 'Cuando te quede una carta, declara ¡ÚLTIMA! antes de que te pillen.',
  },
];

const SPECIAL_CARDS_GUIDE: {
  rank: CardRank;
  title: string;
  subtitle: string;
  description: string;
}[] = [
  {
    rank: 'J',
    title: 'SALTO',
    subtitle: 'Jota (J)',
    description: 'Salta al siguiente jugador.',
  },
  {
    rank: 'Q',
    title: 'REVERSA',
    subtitle: 'Reina (Q)',
    description: 'Invierte el sentido de los turnos.',
  },
  {
    rank: 'K',
    title: 'ROBO',
    subtitle: 'Rey (K)',
    description:
      'Roba una carta al azar de un rival. Si conecta con la mesa, puedes jugarla inmediatamente.',
  },
  {
    rank: 'JOKER',
    title: 'COMODÍN',
    subtitle: 'Joker',
    description: 'Sustituye exactamente un número que te falte dentro de una cadena.',
  },
  {
    rank: 'BOMBA',
    title: 'BOMBA',
    subtitle: 'Especial (1 en el mazo)',
    description:
      'Colócala a un rival. Tiene 3 turnos para jugar una cadena de al menos 3 cartas. Si falla, roba 3.',
  },
  {
    rank: 'ESPEJO',
    title: 'ESPEJO',
    subtitle: 'Reflejo reactivo',
    description:
      'Refleja el último poder compatible que otro jugador haya usado contra ti.',
  },
  {
    rank: 'REVOLVER',
    title: 'REVÓLVER',
    subtitle: 'Ruleta de Cartas (2 en el mazo)',
    description:
      'Apunta a un rival (3 de 6 recámaras cargadas). ¡BANG! roba 5 cartas de penalización; ¡CLICK! se salva sin robar.',
  },
];

export const CantinaCadenaGuideModal: React.FC<CantinaCadenaGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 select-none"
    >
      {/* Leather-bound Cantina Open Book Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[88vh] rounded-3xl bg-gradient-to-b from-[#26170e] via-[#1c110a] to-[#140c07] border-2 border-amber-500/60 shadow-[0_28px_80px_rgba(0,0,0,0.92),0_0_40px_rgba(245,158,11,0.18)] flex flex-col overflow-hidden"
      >
        {/* Top Leather Spine Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#160d07]/95 border-b border-amber-600/35 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-amber-200 tracking-wider uppercase">
                GUÍA DE CARTAS &bull; MODO CADENA
              </h2>
              <p className="text-[11px] text-amber-100/65">
                Manual de bolsillo de la cantina (la partida sigue en curso)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía de cartas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" /> Cerrar
          </button>
        </div>

        {/* Open-Book Two-Page Layout on Desktop, Single-Page Scroll on Mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_75%)]">
          {/* LEFT PAGE: CÓMO JUGAR (Parchment Panel) */}
          <div className="lg:col-span-5 rounded-2xl bg-gradient-to-b from-[#f3e5c8] via-[#ead7b3] to-[#dfc89e] text-[#2a180d] border-2 border-[#b48a4e] shadow-[inset_0_0_24px_rgba(120,67,21,0.22),0_10px_25px_rgba(0,0,0,0.5)] p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3.5">
              <div className="pb-2.5 border-b-2 border-[#8c5a2b]/35 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black font-serif tracking-wider text-[#3b210e] uppercase">
                  CÓMO JUGAR
                </h3>
                <span className="text-[11px] font-bold text-[#6e421c] uppercase tracking-widest">
                  Reglas Base
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {BASIC_RULES.map((rule) => (
                  <div
                    key={rule.label}
                    className="p-2.5 rounded-xl bg-[#fbf3e1]/75 border border-[#b48a4e]/45 shadow-sm"
                  >
                    <div className="text-[11px] font-black font-serif tracking-wider text-[#7c3f11] uppercase">
                      {rule.label}
                    </div>
                    <p className="text-xs sm:text-[13px] font-semibold text-[#2a180d] leading-snug mt-0.5">
                      {rule.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Chain Example Box */}
            <div className="p-3 rounded-xl bg-[#2a180d] text-amber-100 border border-amber-500/40">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                EJEMPLO DE CADENA CIRCULAR
              </div>
              <div className="mt-1 font-mono font-black text-xs sm:text-sm text-amber-200 tracking-wider">
                Mesa: 8 &rarr; Juegas: 9 &rarr; 10 &rarr; 1 &rarr; 1 &rarr; 2
              </div>
              <p className="mt-1 text-[11px] text-amber-100/80">
                Si no puedes o no quieres jugar, pulsa <strong>ROBAR CARTA</strong> (robas 1).
              </p>
            </div>
          </div>

          {/* RIGHT PAGE: CARTAS ESPECIALES (Real PNG Card Assets) */}
          <div className="lg:col-span-7 rounded-2xl bg-gradient-to-b from-[#f3e5c8] via-[#ead7b3] to-[#dfc89e] text-[#2a180d] border-2 border-[#b48a4e] shadow-[inset_0_0_24px_rgba(120,67,21,0.22),0_10px_25px_rgba(0,0,0,0.5)] p-4 sm:p-5 flex flex-col gap-3.5">
            <div className="pb-2.5 border-b-2 border-[#8c5a2b]/35 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black font-serif tracking-wider text-[#3b210e] uppercase">
                CARTAS ESPECIALES
              </h3>
              <span className="text-[11px] font-bold text-[#6e421c] uppercase tracking-widest">
                Poderes de la Mesa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPECIAL_CARDS_GUIDE.map((item) => {
                const imgSrc = CANTINA_CARD_ASSETS[item.rank];
                return (
                  <div
                    key={item.rank}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#fbf3e1]/80 border border-[#b48a4e]/55 shadow-sm"
                  >
                    {/* Real PNG Card Artwork */}
                    <div className="w-14 h-21 sm:w-16 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-stone-950 border border-[#8c5a2b]/60 shadow-md">
                      <img
                        src={imgSrc}
                        alt={item.title}
                        onError={() => logCantinaCardAssetError(item.rank, imgSrc)}
                        draggable={false}
                        className="w-full h-full object-contain object-center"
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-black font-serif text-[#5c2808] uppercase tracking-wide">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8a5224] uppercase tracking-wider">
                        {item.subtitle}
                      </span>
                      <p className="mt-1 text-[11px] sm:text-xs font-medium text-[#2a180d] leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
