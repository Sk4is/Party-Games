import React, { useState } from 'react';
import {
  CodigoRojoRoomState,
  CodigoRojoManualSection,
} from '../../types/codigoRojo';
import {
  BookOpen,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface CodigoRojoGuideViewProps {
  roomState: CodigoRojoRoomState;
  onAbandon: () => void;
}

export const CodigoRojoGuideView: React.FC<CodigoRojoGuideViewProps> = ({
  roomState,
  onAbandon,
}) => {
  const { modules, strikes, maxStrikes, timeRemainingSeconds, missionNumber } = roomState;
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds <= 60;

  // Filter modules by search query
  const filteredModules = modules.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manualSection.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.manualSection.classificationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeModule = modules[selectedPageIndex] || modules[0];
  const section: CodigoRojoManualSection | undefined = activeModule?.manualSection;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 p-3 sm:p-6 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Tactical Status Bar */}
      <header className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border-2 border-red-500/40 shadow-2xl mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                MANUAL TÉCNICO &bull; MISIÓN {missionNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300">
                ROL: GUÍA
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">
              MANUAL DE DESACTIVACIÓN CLASIFICADO
            </h1>
          </div>
        </div>

        {/* Strikes */}
        <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-red-950">
          <span className="text-xs font-mono text-slate-400 font-bold mr-1">STRIKES:</span>
          {Array.from({ length: maxStrikes }).map((_, idx) => {
            const isStruck = idx < strikes;
            return (
              <div
                key={idx}
                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-mono font-black text-sm transition-all ${
                  isStruck
                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_12px_#ef4444] animate-bounce'
                    : 'bg-slate-900 border-slate-700 text-slate-600'
                }`}
              >
                X
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-5 py-2 rounded-xl border-2 font-mono font-black text-xl sm:text-2xl ${
            isLowTime
              ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-slate-950 border-slate-700 text-white shadow-inner'
          }`}
        >
          <Clock className={`w-5 h-5 ${isLowTime ? 'text-red-400' : 'text-slate-400'}`} />
          <span>{formatTimer(timeRemainingSeconds)}</span>
        </div>
      </header>

      {/* Manual Layout: Sidebar Tabs + Paper Document */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mb-4">
        {/* Left Sidebar: Table of contents & Search */}
        <aside className="w-full md:w-72 flex flex-col gap-3">
          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en el manual..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Module Pages List */}
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[500px] p-1 scrollbar-none">
            {modules.map((mod, idx) => {
              const isSelected = selectedPageIndex === idx;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setSelectedPageIndex(idx)}
                  className={`flex-shrink-0 text-left p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-100 text-slate-950 border-amber-500 shadow-md font-bold'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                      PÁGINA {idx + 1} &bull; {mod.manualSection.classificationCode}
                    </span>
                    {mod.solved && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold line-clamp-1">
                    {mod.title}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Main Area: The Classified Document Paper */}
        <div className="flex-1 bg-[#FBF8EF] text-slate-900 rounded-2xl border-4 border-amber-900/20 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[640px]">
          {section ? (
            <div>
              {/* Classified Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b-2 border-slate-300 gap-2">
                <div>
                  <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-widest rounded">
                    ALTO SECRETO // NIVEL 4
                  </span>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    REF: {section.classificationCode} &bull; MÓDULO #{selectedPageIndex + 1}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500">
                    ESTADO EN OPERACIÓN:
                  </div>
                  <span
                    className={`font-mono text-xs font-bold ${
                      activeModule.solved ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {activeModule.solved ? '✓ NEUTRALIZADO' : '● ACTIVO EN MÁQUINA'}
                  </span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="my-5">
                <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-950">
                  {section.title}
                </h2>
                <p className="text-sm font-semibold text-amber-900 mt-0.5 font-mono">
                  {section.subtitle}
                </p>
                <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                  {section.description}
                </p>
              </div>

              {/* Table if present */}
              {section.tableHeaders && section.tableRows && (
                <div className="my-5 overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-amber-200/60 text-slate-900 border-b border-slate-300">
                      <tr>
                        {section.tableHeaders.map((header, hIdx) => (
                          <th key={hIdx} className="p-2.5 font-bold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white/70">
                      {section.tableRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-amber-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 font-medium text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Rules List */}
              <div className="my-5 flex flex-col gap-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  INSTRUCCIONES DE DESACTIVACIÓN:
                </h3>
                {section.rules.map((rule, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3 rounded-lg bg-amber-50/80 border-l-4 border-amber-600 text-xs sm:text-sm leading-snug"
                  >
                    <span className="font-bold text-slate-900 block mb-1">
                      {rule.condition}
                    </span>
                    <span className="text-slate-800 font-medium">
                      👉 {rule.action}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {section.notes && section.notes.length > 0 && (
                <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-950">
                  <span className="font-bold font-mono uppercase block mb-1">
                    AVISO DE SEGURIDAD:
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    {section.notes.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 font-mono text-sm">
              Selecciona una página del manual en la barra lateral
            </div>
          )}

          {/* Page Pagination buttons */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs font-mono text-slate-600 mt-6">
            <button
              type="button"
              disabled={selectedPageIndex <= 0}
              onClick={() => setSelectedPageIndex((p) => p - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Módulo Anterior
            </button>
            <span className="font-bold">
              Página {selectedPageIndex + 1} de {modules.length}
            </span>
            <button
              type="button"
              disabled={selectedPageIndex >= modules.length - 1}
              onClick={() => setSelectedPageIndex((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 cursor-pointer disabled:opacity-30"
            >
              Módulo Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-500 py-2">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Pregunta al Operador sobre lo que ve en su máquina para dar con la regla adecuada.</span>
        </span>
        <button
          type="button"
          onClick={onAbandon}
          className="text-slate-400 hover:text-red-400 transition-colors font-mono cursor-pointer"
        >
          Abandonar Misión
        </button>
      </footer>
    </div>
  );
};
