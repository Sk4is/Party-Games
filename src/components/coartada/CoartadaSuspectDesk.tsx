import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Lock,
  Eye,
  AlertTriangle,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { SuspectDossier, CaseDossier } from '../../types/coartada';
import { audio } from '../../utils/audio';

interface CoartadaSuspectDeskProps {
  suspectDossier: SuspectDossier;
  caseDossier?: CaseDossier;
  timeRemainingSeconds: number;
}

export const CoartadaSuspectDesk: React.FC<CoartadaSuspectDeskProps> = ({
  suspectDossier,
  caseDossier,
  timeRemainingSeconds,
}) => {
  const [isDossierOpen, setIsDossierOpen] = useState(true); // Open by default so suspect can read initial facts
  const [activeTab, setActiveTab] = useState<'ALIBI' | 'TRUTH' | 'SECRET' | 'FACTS'>('ALIBI');

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleDossier = () => {
    audio.playPaperSlide();
    setIsDossierOpen((prev) => !prev);
  };

  const isLowTime = timeRemainingSeconds <= 60 && timeRemainingSeconds > 0;

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-4 p-3 sm:p-6 select-none animate-in fade-in duration-300">
      {/* Top HUD */}
      <header className="w-full p-4 rounded-2xl bg-[#141210]/95 border border-stone-800 shadow-xl flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-mono font-black tracking-wider uppercase">
            SOSPECHOSO
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-stone-100 truncate max-w-[200px] sm:max-w-md">
              Mesa de Interrogatorio
            </h1>
            <span className="text-[11px] font-mono text-stone-400 block">
              {caseDossier ? caseDossier.locationName : 'Bajo custodia'} · Mantén la compostura
            </span>
          </div>
        </div>

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
          </div>

          {/* Drawer Toggle Button */}
          <button
            type="button"
            onClick={handleToggleDossier}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDossierOpen
                ? 'bg-amber-600 text-stone-950 border-amber-500 shadow-md'
                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border-stone-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>MI INFORMACIÓN</span>
            {isDossierOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </header>

      {/* Atmospheric Interrogation Reminder Banner */}
      <div className="w-full p-3.5 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between text-xs font-mono text-stone-400">
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500" />
          <span>El detective te hará preguntas verbalmente. Consulta tu información cuando lo necesites.</span>
        </span>
        <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
          Mentir ≠ Culpable
        </span>
      </div>

      {/* MAIN SUSPECT DOSSIER */}
      {isDossierOpen ? (
        <div className="w-full bg-[#181512] border-2 border-stone-700 rounded-2xl shadow-2xl p-5 sm:p-7 animate-in zoom-in-95 duration-200">
          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-stone-800 mb-6">
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveTab('ALIBI');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALIBI'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              TU COARTADA PÚBLICA
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveTab('TRUTH');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'TRUTH'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              LO QUE OCURRIÓ REALMENTE
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveTab('SECRET');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'SECRET'
                  ? 'bg-red-700 text-stone-100 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-red-400 border border-stone-800'
              }`}
            >
              <Lock className="w-3 h-3" /> TU SECRETO
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveTab('FACTS');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'FACTS'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              HECHOS Y ENTORNO
            </button>
          </div>

          {/* TAB 1: TU COARTADA PÚBLICA */}
          {activeTab === 'ALIBI' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Esta es la versión oficial que has declarado a la policía:</span>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 font-mono text-sm leading-relaxed shadow-inner">
                &ldquo;{suspectDossier.publicAlibi}&rdquo;
              </div>

              <p className="text-xs text-stone-400 font-mono leading-relaxed">
                El detective intentará buscar contradicciones en esta historia usando las pruebas que vaya recibiendo.
              </p>
            </div>
          )}

          {/* TAB 2: LO QUE OCURRIÓ REALMENTE (STEP BY STEP TIMELINE) */}
          {activeTab === 'TRUTH' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Tus movimientos reales paso a paso (Privado):</span>
              </div>

              <div className="space-y-2.5">
                {suspectDossier.actualTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-bold">
                        {item.time}
                      </span>
                      <span className="font-bold text-stone-300">{item.location}</span>
                    </div>
                    <span className="text-stone-300 text-left sm:text-right">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TU SECRETO (LO QUE PREFIERES OCULTAR) */}
          {activeTab === 'SECRET' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 uppercase">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>El motivo por el que preferirías no decir toda la verdad:</span>
              </div>

              <div className="p-5 rounded-xl bg-red-950/25 border-2 border-red-800/60 text-stone-200 text-sm font-mono space-y-3 shadow-inner">
                <div className="text-base font-bold font-serif text-red-200">
                  {suspectDossier.secret.title}
                </div>
                <p className="leading-relaxed text-stone-300">
                  {suspectDossier.secret.detail}
                </p>
                <div className="pt-2 border-t border-red-900/40 text-xs text-red-300/90">
                  <span className="font-bold block uppercase mb-0.5">¿Por qué lo ocultas?</span>
                  {suspectDossier.secret.whyHidden}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px] font-mono text-stone-400">
                💡 <strong>Consejo táctico:</strong> Si el detective te arrincona con pruebas incriminatorias, puedes valorar confesar este secreto para demostrar que estabas haciendo algo indebido, pero no el crimen que se investiga.
              </div>
            </div>
          )}

          {/* TAB 4: HECHOS Y ENTORNO */}
          {activeTab === 'FACTS' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase block mb-2">
                  HECHOS QUE NO PUEDES NEGAR (Hay testigos o registros):
                </span>
                <div className="space-y-2">
                  {suspectDossier.undeniableFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-950/70 border border-stone-850 text-xs font-mono text-stone-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-mono font-bold text-stone-400 uppercase block mb-2">
                  DETALLES DEL ENTORNO QUE RECUERDAS:
                </span>
                <div className="space-y-2">
                  {suspectDossier.venueFacts.map((fact, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-950/40 border border-stone-850 text-xs font-mono text-stone-400 flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-stone-500 mt-0.5" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleToggleDossier}
          className="w-full p-4 rounded-xl bg-stone-900/60 hover:bg-stone-900 border border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400 cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Expediente personal minimizado. Pulsa para reabrir tus datos.</span>
          </span>
          <span className="text-amber-400 font-bold">Abrir carpeta</span>
        </div>
      )}
    </div>
  );
};
