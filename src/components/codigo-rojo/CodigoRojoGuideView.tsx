import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CodigoRojoRoomState,
  CodigoRojoManualSection,
  CodigoRojoCategory,
} from '../../types/codigoRojo';
import {
  MASTER_MANUAL_SECTIONS,
  ALL_28_GLYPHS,
  GLYPH_COLUMNS_EXPANDED,
} from '../../data/codigoRojo/masterManualCatalog';
import {
  ALL_CATEGORIES,
  CATEGORY_META,
  getModuleCategory,
} from '../../data/codigoRojo/categoryMapping';
import { ModuleTechnicalSketch } from './components/ModuleTechnicalSketch';
import {
  BookOpen,
  Clock,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
  KeyRound,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface CodigoRojoGuideViewProps {
  roomState: CodigoRojoRoomState;
  onAbandon: () => void;
}

export const CodigoRojoGuideView: React.FC<CodigoRojoGuideViewProps> = ({
  roomState,
  onAbandon,
}) => {
  const { strikes, maxStrikes, timeRemainingSeconds, missionNumber } = roomState;
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [operatorNotes, setOperatorNotes] = useState<string>('');

  // Round transition state for Guide: plays once per new round/mission
  const lastGuideMissionRef = useRef<number | null>(null);
  const [showRoundIntro, setShowRoundIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const sessionKey = `cr_guide_seen_${roomState.code}_m${missionNumber}`;
    return sessionStorage.getItem(sessionKey) !== 'true';
  });

  useEffect(() => {
    const sessionKey = `cr_guide_seen_${roomState.code}_m${missionNumber}`;
    const alreadySeen = typeof window !== 'undefined' && sessionStorage.getItem(sessionKey) === 'true';

    if (!alreadySeen && lastGuideMissionRef.current !== missionNumber) {
      setShowRoundIntro(true);
      try {
        sessionStorage.setItem(sessionKey, 'true');
      } catch {
        // ignore
      }
      lastGuideMissionRef.current = missionNumber;
      audio.playPaperPageTurn();
      const timer = setTimeout(() => setShowRoundIntro(false), 1400);
      return () => clearTimeout(timer);
    } else if (alreadySeen) {
      setShowRoundIntro(false);
    }
  }, [roomState.code, missionNumber]);

  // Audio feedback for strikes on the Guide console as well
  const prevStrikesRef = useRef(strikes);
  useEffect(() => {
    if (strikes > prevStrikesRef.current) {
      audio.playStrike();
    }
    prevStrikesRef.current = strikes;
  }, [strikes]);

  const handleSelectSection = (idx: number) => {
    if (idx !== selectedSectionIndex) {
      audio.playPaperPageTurn();
      setSelectedSectionIndex(idx);
    }
  };

  const handleSelectCategory = (cat: string) => {
    if (cat !== selectedCategory) {
      audio.playPaperPageTurn();
      setSelectedCategory(cat);
      setSelectedSectionIndex(0);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds <= 60;

  // Filter sections by search query and category
  const filteredSections = useMemo(() => {
    return MASTER_MANUAL_SECTIONS.filter((sec) => {
      const secCategory = sec.category || getModuleCategory(sec.moduleType);
      const matchesCategory =
        selectedCategory === 'TODOS' || secCategory === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        sec.title.toLowerCase().includes(q) ||
        sec.subtitle.toLowerCase().includes(q) ||
        secCategory.toLowerCase().includes(q) ||
        sec.classificationCode.toLowerCase().includes(q) ||
        (sec.visualIdentification && sec.visualIdentification.toLowerCase().includes(q)) ||
        (sec.identificationChecklist &&
          sec.identificationChecklist.some((item) => item.toLowerCase().includes(q))) ||
        sec.description.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  // Current active section
  const currentSection: CodigoRojoManualSection =
    filteredSections[selectedSectionIndex] ||
    MASTER_MANUAL_SECTIONS[0];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 p-3 sm:p-6 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Cinematic Round Opening Transition for Guide */}
      {showRoundIntro && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in transition-opacity">
          <div className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-3xl">
              📋
            </div>
            <div className="text-center font-mono">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-widest block">
                CÓDIGO ROJO • MISIÓN {missionNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                MANUAL TÉCNICO DESCLASIFICADO
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* Top Tactical Status Bar */}
      <header className="w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl mb-4">
        {/* Mission & Guide Role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                MANUAL TÉCNICO • MISIÓN {missionNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black uppercase text-amber-300">
                ROL: GUÍA
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">
              MANUAL DE DESACTIVACIÓN (30 PROTOCOLOS)
            </h1>
          </div>
        </div>

        {/* Scratchpad note helper for Guide */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 font-bold hidden sm:inline">Nº SERIE:</span>
          <input
            type="text"
            placeholder="Anotar nº serie..."
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value.toUpperCase())}
            className="w-28 sm:w-36 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-amber-300 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-400 placeholder-slate-600"
            title="Anota aquí la serie que te dicte el Operador (ej. CR-4821-X7)"
          />
        </div>

        {/* Strikes Display */}
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

        {/* Digital Countdown Timer */}
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

      {/* Main Content: 30-Module Manual Index + Classified Technical Document */}
      <main className="flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col md:flex-row gap-4 mb-4">
        {/* Left Sidebar: 30-Module Index & Search */}
        <aside className="w-full md:w-80 lg:w-96 flex flex-col gap-3">
          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por categoría, título o elemento..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSectionIndex(0);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Broad Category Filter Tabs */}
          <div className="flex md:flex-wrap items-center gap-1.5 overflow-x-auto md:overflow-x-visible pb-1 scrollbar-none text-[10px] font-mono">
            {['TODOS', ...ALL_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectCategory(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 30-Module Manual Entries List */}
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[580px] p-1 scrollbar-none">
            {filteredSections.map((sec, idx) => {
              const isSelected = selectedSectionIndex === idx;
              const secCategory = sec.category || getModuleCategory(sec.moduleType);
              const meta = CATEGORY_META[secCategory];
              return (
                <button
                  key={sec.classificationCode}
                  type="button"
                  onClick={() => handleSelectSection(idx)}
                  className={`flex-shrink-0 text-left p-3 rounded-xl border-2 transition-all active:scale-[0.98] cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-amber-100 text-slate-950 border-amber-500 shadow-md font-bold'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? 'bg-amber-950 text-amber-200 border-amber-800'
                          : `${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`
                      }`}
                    >
                      {secCategory}
                    </span>
                    <span className="text-[9px] font-mono opacity-60">
                      {sec.classificationCode}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold line-clamp-1">
                    {sec.title}
                  </span>
                </button>
              );
            })}

            {filteredSections.length === 0 && (
              <div className="p-4 text-center text-xs font-mono text-slate-500">
                No se encontraron protocolos con «{searchQuery}»
              </div>
            )}
          </div>
        </aside>

        {/* Right Main Area: Classified Technical Document Paper */}
        <div className="flex-1 bg-[#FBF8EF] text-slate-900 rounded-2xl border-4 border-amber-900/30 shadow-2xl p-5 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[720px] relative">
          {currentSection && (
            <div>
              {/* Classified Top Stamp Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b-2 border-slate-300 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-widest rounded">
                      DOCUMENTO CLASIFICADO // NIVEL 4
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-950 font-mono text-[10px] font-black uppercase rounded border border-amber-500/40">
                      CATEGORÍA: {currentSection.category || getModuleCategory(currentSection.moduleType)}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">
                    CÓDIGO: {currentSection.classificationCode} • SECCIÓN #{selectedSectionIndex + 1} DE {filteredSections.length}
                  </div>
                </div>

                {/* Tactical Rubber Stamped Badge */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:inline-block animate-cr-stamp border-2 border-red-700/80 text-red-700 font-mono font-black text-[10px] tracking-widest px-2 py-0.5 rounded rotate-[-6deg] select-none shadow-sm uppercase">
                    COPIA OFICIAL AUTORIZADA
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-600 font-bold">
                      INSPECCIÓN TÉCNICA
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      DISCIPLINA VERBAL
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="my-5">
                <div className="text-xs font-mono font-black uppercase tracking-wider text-amber-800 mb-1">
                  CATEGORÍA DE PANEL: {currentSection.category}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-950">
                  {currentSection.title}
                </h2>
                <p className="text-sm font-semibold text-amber-900 mt-0.5 font-mono">
                  {currentSection.subtitle}
                </p>
                <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                  {currentSection.description}
                </p>
              </div>

              {/* TECHNICAL SKETCH (Crucial for visual Operator/Guide verification) */}
              <div className="my-4">
                <ModuleTechnicalSketch moduleType={currentSection.moduleType} />
              </div>

              {/* Visual Identification Guide Box & Checklist */}
              <div className="my-4 p-4 bg-amber-100/80 border-2 border-dashed border-amber-400 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-black uppercase tracking-wider text-amber-950">
                  <span>🔍</span>
                  <span>CLAVES VISUALES DE IDENTIFICACIÓN (PÍDELO AL OPERADOR):</span>
                </div>
                {currentSection.identificationChecklist && currentSection.identificationChecklist.length > 0 && (
                  <ul className="list-disc list-inside text-xs sm:text-sm text-amber-950 font-medium space-y-1 my-1">
                    {currentSection.identificationChecklist.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {currentSection.visualIdentification && (
                  <p className="text-xs text-amber-900/90 font-mono italic mt-1 pt-1 border-t border-amber-300">
                    Aspecto global del panel: {currentSection.visualIdentification}
                  </p>
                )}
              </div>

              {/* SPECIAL EXPANDED GLYPH RENDERING FOR GLIFOS_CRIPTOGRAFICOS */}
              {currentSection.moduleType === 'GLIFOS_CRIPTOGRAFICOS' && (
                <div className="my-6 flex flex-col gap-6">
                  {/* Columns Table with Large, High-Contrast Glyphs */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-2">
                      COLUMNAS DE REFERENCIA (ORDEN ESTRICTO DE ARRIBA A ABAJO):
                    </h3>
                    <div className="overflow-x-auto rounded-xl border-2 border-slate-400 bg-white shadow">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="bg-amber-200/80 text-slate-900 border-b-2 border-slate-300 font-mono text-xs">
                            {GLYPH_COLUMNS_EXPANDED.map((_, colIdx) => (
                              <th key={colIdx} className="p-2 font-black border-r border-slate-300 last:border-r-0">
                                COL {colIdx + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 7 }).map((_, rowIdx) => (
                            <tr key={rowIdx} className="border-b border-slate-200 last:border-b-0 hover:bg-amber-50/50">
                              {GLYPH_COLUMNS_EXPANDED.map((col, colIdx) => {
                                const symbol = col[rowIdx];
                                const glyphMeta = ALL_28_GLYPHS.find((g) => g.symbol === symbol);
                                return (
                                  <td
                                    key={colIdx}
                                    className="p-3 border-r border-slate-200 last:border-r-0 align-middle"
                                  >
                                    {symbol ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-4xl sm:text-5xl font-mono text-slate-950 font-bold select-none leading-none">
                                          {symbol}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-600 font-medium">
                                          {glyphMeta?.name || ''}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 28 Glyphs Illustrated Glossary */}
                  <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-300">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-950 mb-3">
                      CATÁLOGO DESCRIPTIVO DE GLIFOS (PARA ACLARAR DUDAS AL OPERADOR):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {ALL_28_GLYPHS.map((glyph) => (
                        <div
                          key={glyph.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
                        >
                          <span className="text-3xl font-mono text-slate-900 leading-none">
                            {glyph.symbol}
                          </span>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-900 leading-tight">
                              {glyph.name}
                            </span>
                            <span className="text-[9px] text-slate-500 leading-tight line-clamp-1">
                              {glyph.description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Standard Table if present */}
              {currentSection.tableHeaders && currentSection.tableRows && (
                <div className="my-5 overflow-x-auto rounded-lg border border-slate-300 bg-white">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-amber-200/60 text-slate-900 border-b border-slate-300">
                      <tr>
                        {currentSection.tableHeaders.map((header, hIdx) => (
                          <th key={hIdx} className="p-2.5 font-bold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentSection.tableRows.map((row, rIdx) => (
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
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  INSTRUCCIONES Y ÁRBOL DE DECISIÓN:
                </h3>
                {currentSection.rules.map((rule, rIdx) => {
                  const isCircularNotice = rule.condition.includes('EL RUMBO ES CIRCULAR');
                  return (
                    <div
                      key={rIdx}
                      className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                        isCircularNotice
                          ? 'bg-cyan-50/95 border-2 border-cyan-500 text-cyan-950 font-mono shadow-md'
                          : 'bg-amber-50/90 border-l-4 border-amber-600'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold block mb-1">
                        {isCircularNotice && <span className="text-cyan-700 text-base">🧭</span>}
                        <span className={isCircularNotice ? 'text-cyan-950 font-black tracking-wide' : 'text-slate-950'}>
                          {rule.condition}
                        </span>
                      </div>
                      <span className={`font-medium whitespace-pre-line block ${isCircularNotice ? 'text-cyan-900' : 'text-slate-800'}`}>
                        {rule.action.startsWith('👉') ? rule.action : `👉 ${rule.action}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Notes & Warnings */}
              {currentSection.notes && currentSection.notes.length > 0 && (
                <div className="my-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-950">
                  <span className="font-bold font-mono uppercase block mb-1">
                    AVISO DE SEGURIDAD OPERATIVA:
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    {currentSection.notes.map((note, nIdx) => (
                      <li key={nIdx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Page Pagination buttons */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-xs font-mono text-slate-600 mt-6">
            <button
              type="button"
              disabled={selectedSectionIndex <= 0}
              onClick={() => handleSelectSection(selectedSectionIndex - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 active:scale-95 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Protocolo Anterior
            </button>
            <span className="font-bold">
              Protocolo {selectedSectionIndex + 1} de {filteredSections.length}
            </span>
            <button
              type="button"
              disabled={selectedSectionIndex >= filteredSections.length - 1}
              onClick={() => handleSelectSection(selectedSectionIndex + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 active:scale-95 cursor-pointer disabled:opacity-30"
            >
              Protocolo Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="w-full max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 py-2">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Pregunta al Operador sobre la forma de la máquina, colores, bornes y LEDs para localizar el protocolo adecuado.</span>
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
