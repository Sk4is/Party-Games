import React, { useState } from 'react';
import {
  Folder,
  BookOpen,
  X,
  Clock,
  Pin,
  FileCheck,
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CaseDossier, EvidenceCard } from '../../types/coartada';
import { CoartadaEvidenceCard } from './CoartadaEvidenceCard';
import { audio } from '../../utils/audio';

interface CoartadaDetectiveDeskProps {
  caseDossier: CaseDossier;
  revealedEvidence: EvidenceCard[];
  notebookText: string;
  onSaveNotebook: (text: string) => void;
  onRequestVerdict: () => void;
  timeRemainingSeconds: number;
  newEvidenceAlert: EvidenceCard | null;
}

export const CoartadaDetectiveDesk: React.FC<CoartadaDetectiveDeskProps> = ({
  caseDossier,
  revealedEvidence,
  notebookText,
  onSaveNotebook,
  onRequestVerdict,
  timeRemainingSeconds,
  newEvidenceAlert,
}) => {
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleDossier = () => {
    audio.playPaperSlide();
    setIsDossierOpen((prev) => !prev);
  };

  const handleToggleNotebook = () => {
    audio.playPaperSlide();
    setIsNotebookOpen((prev) => !prev);
  };

  const handleNotebookChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    audio.playTypewriterKey();
    onSaveNotebook(e.target.value);
  };

  const isLowTime = timeRemainingSeconds <= 60 && timeRemainingSeconds > 0;

  return (
    <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-4 p-3 sm:p-6 select-none animate-in fade-in duration-300">
      {/* Top HUD: Case Title, Timer, Drawer Triggers & Verdict Button */}
      <header className="w-full p-4 rounded-2xl bg-[#141210]/95 border border-stone-800 shadow-xl flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-red-950/70 border border-red-700/60 text-red-300 text-xs font-mono font-black tracking-wider uppercase">
            DETECTIVE
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-stone-100 truncate max-w-[200px] sm:max-w-md">
              {caseDossier.title}
            </h1>
            <span className="text-[11px] font-mono text-stone-400 block">
              {caseDossier.locationName} · {caseDossier.incidentEstimatedWindow}
            </span>
          </div>
        </div>

        {/* Central HUD Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Synchronized Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono font-black ${
              isLowTime
                ? 'bg-red-950/80 border-red-600 text-red-300 animate-pulse'
                : 'bg-stone-950 border-stone-800 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTimer(timeRemainingSeconds)}</span>
            {isLowTime && (
              <span className="text-[10px] text-red-400 font-bold hidden sm:inline ml-1">
                QUEDA 1 MINUTO
              </span>
            )}
          </div>

          {/* Dossier Toggle Button */}
          <button
            type="button"
            onClick={handleToggleDossier}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDossierOpen
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md'
                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-700'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>EXPEDIENTE</span>
            {isDossierOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Notebook Toggle Button */}
          <button
            type="button"
            onClick={handleToggleNotebook}
            className={`relative px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isNotebookOpen
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md'
                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>NOTAS</span>
            {notebookText.trim().length > 0 && !isNotebookOpen && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Proceed to Verdict Button */}
          <button
            type="button"
            onClick={onRequestVerdict}
            className="px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 active:scale-95 text-stone-100 font-mono text-xs font-black uppercase tracking-wider border border-red-500 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DICTAR VEREDICTO</span>
            <span className="sm:hidden">VEREDICTO</span>
          </button>
        </div>
      </header>

      {/* Non-Disruptive New Evidence Arrival Notification */}
      {newEvidenceAlert && (
        <div className="w-full p-3 bg-red-950/90 border-2 border-red-600 rounded-xl shadow-2xl flex items-center justify-between text-stone-100 text-xs font-mono animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-red-600 text-stone-950 font-black text-[10px] uppercase">
              NUEVA PRUEBA
            </span>
            <span className="font-bold">{newEvidenceAlert.title}</span>
            <span className="text-stone-400 hidden sm:inline">({newEvidenceAlert.timestamp})</span>
          </div>
          <span className="text-[11px] text-amber-300 flex items-center gap-1">
            <Search className="w-3 h-3" /> Añadida al tablero
          </span>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="relative w-full flex flex-col lg:flex-row gap-4">
        {/* COLLAPSIBLE CASE DOSSIER DRAWER */}
        {isDossierOpen && (
          <div className="w-full lg:w-96 flex-shrink-0 bg-[#161311] border border-stone-800 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto max-h-[75vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Folder className="w-4 h-4" /> EXPEDIENTE DEL CASO
              </span>
              <button
                type="button"
                onClick={handleToggleDossier}
                className="p-1 rounded text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono text-stone-300">
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold block">INCIDENTE:</span>
                <span className="text-stone-200 font-bold font-serif text-sm block">{caseDossier.targetObjectOrNature}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-stone-950/80 rounded-xl border border-stone-850">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">HORA ESTIMADA:</span>
                  <span className="font-bold text-amber-300">{caseDossier.incidentEstimatedWindow}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block">DENUNCIANTE:</span>
                  <span className="font-bold text-stone-300">{caseDossier.complainantName}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">RESUMEN DEL HECHO:</span>
                <p className="text-stone-300 leading-relaxed bg-stone-950/50 p-3 rounded-xl border border-stone-850">
                  {caseDossier.incidentSummary}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold block mb-2">PERSONAS DE INTERÉS:</span>
                <div className="space-y-2">
                  {caseDossier.personsOfInterest.map((person, pIdx) => (
                    <div key={pIdx} className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px]">
                      <div className="flex items-center justify-between text-stone-200 font-bold mb-0.5">
                        <span>{person.name}</span>
                        <span className="text-stone-500 font-normal">{person.role}</span>
                      </div>
                      <p className="text-stone-400 text-[10px]">{person.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">NOTAS INICIALES:</span>
                <ul className="list-disc list-inside space-y-1 text-stone-400 text-[11px]">
                  {caseDossier.initialBriefingNotes.map((note, nIdx) => (
                    <li key={nIdx}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* INVESTIGATION BOARD (EVIDENCE CARDS ON PHYSICAL DESK) */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-stone-400">
            <span className="font-bold flex items-center gap-1.5 text-stone-300 uppercase tracking-wider">
              <Pin className="w-3.5 h-3.5 text-red-500" /> TABLERO DE PRUEBAS ({revealedEvidence.length})
            </span>
            <span className="text-stone-500">
              Las pruebas adicionales llegarán periódicamente durante el interrogatorio
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {revealedEvidence.map((card) => (
              <CoartadaEvidenceCard
                key={card.id}
                card={card}
                isNew={newEvidenceAlert?.id === card.id}
              />
            ))}
          </div>

          {revealedEvidence.length === 0 && (
            <div className="p-12 rounded-2xl bg-stone-950/40 border border-dashed border-stone-800 flex flex-col items-center justify-center text-center text-stone-500 font-mono text-xs gap-2">
              <Folder className="w-8 h-8 text-stone-700 animate-pulse" />
              <span>Esperando la recepción de las primeras diligencias policiales...</span>
            </div>
          )}
        </div>

        {/* COLLAPSIBLE DETECTIVE NOTEBOOK */}
        {isNotebookOpen && (
          <div className="w-full lg:w-80 flex-shrink-0 bg-[#f4ebd0] text-stone-900 rounded-2xl p-5 shadow-2xl border-2 border-stone-400 animate-in slide-in-from-right duration-200 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-stone-400/60">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-stone-700" /> CUADERNO DE NOTAS
              </span>
              <button
                type="button"
                onClick={handleToggleNotebook}
                className="p-1 rounded text-stone-600 hover:text-stone-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[10px] text-stone-600 leading-tight">
              Tus anotaciones son privadas. Se guardan automáticamente y no serán visibles para el sospechoso.
            </span>

            {/* Freeform Typing Area */}
            <textarea
              value={notebookText}
              onChange={handleNotebookChange}
              placeholder="Escribe tus hipótesis, contradicciones y dudas aquí..."
              className="w-full h-80 bg-transparent text-stone-900 border-none resize-none focus:outline-none text-xs sm:text-sm font-mono leading-relaxed placeholder:text-stone-500/70"
            />

            <div className="pt-2 border-t border-stone-400/60 flex items-center justify-between text-[10px] text-stone-600">
              <span>Guardado automático</span>
              <button
                type="button"
                onClick={handleToggleNotebook}
                className="font-bold uppercase hover:underline cursor-pointer"
              >
                Cerrar cuaderno
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
