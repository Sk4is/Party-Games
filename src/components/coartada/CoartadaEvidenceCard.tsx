import React, { useState } from 'react';
import { Search, Camera, FileText, Receipt, Key, Fingerprint, Phone, MapPin, X, Pin } from 'lucide-react';
import { EvidenceCard } from '../../types/coartada';
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

  const getIcon = () => {
    switch (card.type) {
      case 'CAMERA':
        return <Camera className="w-4 h-4 text-slate-300" />;
      case 'RECEIPT':
        return <Receipt className="w-4 h-4 text-amber-300" />;
      case 'ACCESS_LOG':
        return <Key className="w-4 h-4 text-cyan-300" />;
      case 'FINGERPRINT':
        return <Fingerprint className="w-4 h-4 text-rose-300" />;
      case 'PHONE':
        return <Phone className="w-4 h-4 text-amber-300" />;
      case 'MAP':
        return <MapPin className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-300" />;
    }
  };

  const getTypeLabel = () => {
    switch (card.type) {
      case 'CAMERA':
        return 'GRABACIÓN CCTV';
      case 'RECEIPT':
        return 'TIQUE / REGISTRO';
      case 'ACCESS_LOG':
        return 'CONTROL DE ACCESO';
      case 'FINGERPRINT':
        return 'ANÁLISIS DACTILAR';
      case 'PHONE':
        return 'REGISTRO TELEFÓNICO';
      case 'MAP':
        return 'CROQUIS DE PLANTA';
      case 'NOTE':
        return 'MANUSCRITO';
      default:
        return 'DECLARACIÓN JURADA';
    }
  };

  return (
    <>
      {/* Physical Card on Desk */}
      <div
        onClick={handleOpen}
        className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-1 select-none overflow-hidden ${
          card.type === 'CAMERA'
            ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
            : card.type === 'RECEIPT'
            ? 'bg-stone-900 border-stone-700 text-stone-200 font-mono'
            : card.type === 'FINGERPRINT'
            ? 'bg-[#181412] border-amber-900/60 text-stone-200'
            : 'bg-[#1a1714] border-stone-800 text-stone-200'
        } ${isNew ? 'ring-2 ring-red-600 animate-pulse' : ''}`}
      >
        {/* Subtle Pushpin at top */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Pin className="w-3.5 h-3.5 text-red-700 drop-shadow transform rotate-12" />
        </div>

        {/* Top Header */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/90 mb-1.5">
            {getIcon()}
            <span>{getTypeLabel()}</span>
            <span className="text-stone-500">·</span>
            <span className="text-stone-300">{card.timestamp}</span>
          </div>

          <h4 className="text-sm font-bold text-stone-100 font-serif leading-snug line-clamp-2 mb-2 group-hover:text-amber-200 transition-colors">
            {card.title}
          </h4>

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
              {getIcon()}
              <span>{getTypeLabel()}</span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-300">Hora: {card.timestamp}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-black font-serif text-amber-100 mb-4 leading-snug">
              {card.title}
            </h3>

            {/* Location & Source Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-950/80 rounded-xl border border-stone-800/80 text-xs font-mono mb-4 text-stone-300">
              <div>
                <span className="text-stone-500 block">UBICACIÓN:</span>
                <span className="font-bold text-stone-200">{card.location}</span>
              </div>
              <div>
                <span className="text-stone-500 block">ORIGEN / FUENTE:</span>
                <span className="font-bold text-stone-200">{card.source}</span>
              </div>
            </div>

            {/* Document Body */}
            <div className="bg-[#1f1b17] border border-stone-800 p-4 sm:p-5 rounded-xl text-stone-200 text-sm leading-relaxed whitespace-pre-line font-mono shadow-inner mb-6">
              {card.details}
            </div>

            {/* Summary highlight */}
            <div className="p-3 bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold block font-mono uppercase mb-0.5 text-amber-300">
                DICTAMEN DE LA PRUEBA:
              </span>
              {card.summary}
            </div>

            {/* Bottom Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors"
              >
                Volver al expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
