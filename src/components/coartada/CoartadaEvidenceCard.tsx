import React, { useState } from 'react';
import {
  Search,
  Camera,
  FileText,
  Receipt,
  Key,
  Fingerprint,
  Phone,
  MapPin,
  X,
  Pin,
  Ticket,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import { EvidenceCard, EvidenceVisualCategory } from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaEvidenceCardProps {
  card: EvidenceCard;
  isNew?: boolean;
}

export const CoartadaEvidenceCard: React.FC<CoartadaEvidenceCardProps> = ({ card, isNew }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => {
    audio.playPaperSlide();
    setIsModalOpen(true);
  };

  const handleClose = () => {
    audio.playClick();
    setIsModalOpen(false);
  };

  const category = card.visualCategory || 'OFFICIAL_REPORT';

  // Card visual container styling depending on evidence type
  const getContainerStyle = () => {
    switch (category) {
      case 'PHOTO':
        return 'bg-[#121212] border-2 border-stone-600 text-stone-200 shadow-2xl';
      case 'ID_CARD':
        return 'bg-[#201d19] border-2 border-amber-800/70 text-amber-100 shadow-xl';
      case 'HANDWRITTEN':
        return 'bg-[#231e18] border border-amber-700/50 text-stone-200 shadow-md';
      case 'TICKET':
        return 'bg-[#2a221b] border-2 border-dashed border-amber-600/60 text-amber-200 font-mono shadow-md';
      case 'RECEIPT':
        return 'bg-[#1c1a17] border border-stone-700 text-stone-300 font-mono shadow-md';
      case 'MAP':
        return 'bg-[#161a1d] border border-cyan-800/60 text-cyan-100 shadow-lg';
      case 'LOG':
        return 'bg-[#18191a] border border-stone-700 text-stone-200 font-mono shadow-md';
      default:
        return 'bg-[#1a1714] border border-stone-800 text-stone-200 shadow-lg';
    }
  };

  const getBadge = () => {
    switch (category) {
      case 'PHOTO':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-stone-300 bg-stone-800 px-2 py-0.5 rounded">
            <Camera className="w-3 h-3 text-stone-300" /> FOTOGRAFÍA POLICIAL
          </span>
        );
      case 'ID_CARD':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-amber-300 bg-amber-950 border border-amber-700/60 px-2 py-0.5 rounded">
            <UserCheck className="w-3 h-3 text-amber-400" /> DOCUMENTO DE IDENTIDAD
          </span>
        );
      case 'HANDWRITTEN':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-amber-400 bg-stone-900 px-2 py-0.5 rounded">
            <FileText className="w-3 h-3" /> MANUSCRITO CONFIDENCIAL
          </span>
        );
      case 'TICKET':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded border border-dashed border-amber-500/50">
            <Ticket className="w-3 h-3" /> BILLETE OFICIAL
          </span>
        );
      case 'RECEIPT':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-stone-300 bg-stone-900 px-2 py-0.5 rounded">
            <Receipt className="w-3 h-3 text-amber-400" /> COMPROBANTE TIMBRADO
          </span>
        );
      case 'MAP':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            <MapPin className="w-3 h-3" /> PLANO TÉCNICO
          </span>
        );
      case 'LOG':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-stone-300 bg-stone-900 px-2 py-0.5 rounded">
            <Key className="w-3 h-3 text-amber-400" /> REGISTRO DE CONTROL
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-stone-300 bg-stone-900 px-2 py-0.5 rounded">
            <FileCheck2 className="w-3 h-3 text-amber-400" /> INFORME TESTIFICAL
          </span>
        );
    }
  };

  return (
    <>
      {/* Physical Evidence Card on Desk */}
      <div
        onClick={handleOpen}
        className={`group relative flex flex-col justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1 select-none overflow-hidden ${getContainerStyle()} ${
          isNew ? 'ring-2 ring-red-600 animate-pulse' : ''
        }`}
      >
        {/* Pushpin at top */}
        <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
          <Pin className="w-3.5 h-3.5 text-red-600 drop-shadow transform rotate-12" />
        </div>

        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            {getBadge()}
            <span className="text-[10px] font-mono text-stone-400 font-bold mr-4">
              {card.timestamp}
            </span>
          </div>

          <h4 className="text-sm font-bold font-serif leading-snug line-clamp-2 mb-2 group-hover:text-amber-300 transition-colors">
            {card.title}
          </h4>

          {/* Visual Miniature Representation depending on type */}
          {category === 'PHOTO' && (
            <div className="my-2 p-3 bg-black border border-stone-700 rounded-lg flex items-center justify-center gap-2 text-stone-400 text-xs font-mono">
              <Camera className="w-4 h-4 text-stone-500" />
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                [ FOTOGRAFÍA MONOCROMA 1984 ]
              </span>
            </div>
          )}

          {category === 'ID_CARD' && (
            <div className="my-2 p-2.5 bg-stone-950 border border-amber-900/60 rounded-lg flex items-center justify-between text-amber-200/90 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-base">🪪</span>
                <span>REGISTRO OFICIAL DNI</span>
              </div>
              <span className="text-stone-500">REF: POL-84</span>
            </div>
          )}

          {category === 'TICKET' && (
            <div className="my-2 p-2 bg-stone-950 border border-dashed border-amber-600/50 rounded flex items-center justify-between text-[10px] font-mono text-amber-300">
              <span>🎟️ SERIE VALIDADORA</span>
              <span>PASE SELLADO</span>
            </div>
          )}

          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {card.summary}
          </p>
        </div>

        {/* Bottom card footer */}
        <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono text-stone-500">
          <span className="truncate max-w-[130px]">{card.location}</span>
          <span className="inline-flex items-center gap-1 text-amber-400 group-hover:text-amber-300 font-semibold transition-colors">
            <Search className="w-3 h-3" /> Examinar
          </span>
        </div>
      </div>

      {/* Enlarged Inspection Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-lg bg-[#141210] border-2 border-stone-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-stone-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg bg-stone-850 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-stone-800 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              {getBadge()}
              <span className="text-stone-600">·</span>
              <span className="text-stone-300">Hora: {card.timestamp}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-400">{card.dateStr}</span>
            </div>

            {/* Document Title */}
            <h3 className="text-xl sm:text-2xl font-black font-serif text-stone-100 mb-2 leading-tight">
              {card.title}
            </h3>

            {/* Metadata tags */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-stone-400 mb-5 p-3 rounded-xl bg-stone-950/80 border border-stone-850">
              <div>
                <span className="text-stone-600 block text-[10px]">ORIGEN:</span>
                <span className="text-stone-300 font-bold truncate block">{card.source}</span>
              </div>
              <div>
                <span className="text-stone-600 block text-[10px]">LOCALIZACIÓN:</span>
                <span className="text-stone-300 font-bold truncate block">{card.location}</span>
              </div>
            </div>

            {/* Case specific visual design in modal */}
            {category === 'PHOTO' && (
              <div className="mb-4 p-6 bg-stone-950 border-2 border-stone-700 rounded-xl text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-3xl">
                  📷
                </div>
                <div className="text-[11px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                  EXPEDIENTE FOTOGRÁFICO DE PRUEBA MATERIAL
                </div>
                <div className="text-[10px] font-mono text-stone-500">
                  COPIA POLICIAL EN PAPEL FOTOGRÁFICO DE HALUROS DE PLATA
                </div>
              </div>
            )}

            {category === 'ID_CARD' && (
              <div className="mb-4 p-5 bg-[#1e1b17] border-2 border-amber-800/80 rounded-xl space-y-2 font-mono text-xs text-amber-100">
                <div className="flex items-center justify-between border-b border-amber-900/60 pb-2">
                  <span className="font-black tracking-widest text-amber-400">DOCUMENTO NACIONAL DE IDENTIDAD</span>
                  <span className="text-[10px] text-stone-400">ESPAÑA · 1984</span>
                </div>
                <div className="text-[11px] text-stone-300 pt-1">
                  Documento cotejado por la brigada de investigación e incorporado a la causa.
                </div>
              </div>
            )}

            {category === 'TICKET' && (
              <div className="mb-4 p-4 bg-[#231b14] border-2 border-dashed border-amber-600/70 rounded-xl font-mono text-xs text-amber-300 space-y-1">
                <div className="text-center font-bold tracking-widest border-b border-amber-800 pb-1">
                  *** COMPROBANTE OFICIAL TIMBRADO ***
                </div>
                <div className="flex justify-between text-[11px] pt-1">
                  <span>FECHA: {card.dateStr}</span>
                  <span>HORA: {card.timestamp}</span>
                </div>
              </div>
            )}

            {/* Detailed text */}
            <div className="p-4 sm:p-5 rounded-xl bg-stone-950 border border-stone-850 text-stone-200 text-xs sm:text-sm font-mono leading-relaxed whitespace-pre-line">
              {card.details}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-bold border border-stone-700 cursor-pointer transition-colors"
              >
                Volver a la mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
