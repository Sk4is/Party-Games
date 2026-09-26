import React, { useState } from 'react';
import {
  Clock,
  BookOpen,
  Folder,
  FileText,
  User,
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Calendar,
  MapPin,
} from 'lucide-react';
import {
  CaseDossier,
  SuspectDossier,
  EvidenceCard,
  CoartadaRole,
} from '../../types/coartada';
import { CoartadaEvidenceCard } from './CoartadaEvidenceCard';
import { audio } from '../../utils/audio';

interface CoartadaPreparationViewProps {
  role: CoartadaRole;
  prepSecondsRemaining: number;
  caseDossier?: CaseDossier;
  suspectDossier?: SuspectDossier;
  initialEvidence?: EvidenceCard[];
}

export const CoartadaPreparationView: React.FC<CoartadaPreparationViewProps> = ({
  role,
  prepSecondsRemaining,
  caseDossier,
  suspectDossier,
  initialEvidence = [],
}) => {
  const isDetective = role === 'DETECTIVE';
  const [suspectTab, setSuspectTab] = useState<'IDENTITY' | 'ALIBI' | 'TRUTH' | 'SECRET' | 'EXPLANATIONS'>('IDENTITY');

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = prepSecondsRemaining <= 15;

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-4 p-3 sm:p-6 select-none animate-in fade-in duration-300">
      {/* Top Banner: Reading countdown */}
      <header className="w-full p-4 rounded-2xl bg-[#141210]/95 border-2 border-amber-600/60 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/60 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                FASE DE PREPARACIÓN PREVIA
              </span>
              <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-[10px] font-mono text-stone-300 font-bold uppercase">
                {isDetective ? '🕵️ ERES EL DETECTIVE' : '💼 ERES EL SOSPECHOSO'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-serif text-stone-100 truncate max-w-sm sm:max-w-lg">
              {caseDossier?.title || 'Lectura del expediente'}
            </h1>
          </div>
        </div>

        {/* Big Prep Countdown */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-base font-mono font-black ${
              isUrgent
                ? 'bg-red-950/80 border-red-500 text-red-300 animate-pulse'
                : 'bg-stone-950 border-amber-700/60 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col text-right">
              <span className="text-lg leading-tight">{formatTimer(prepSecondsRemaining)}</span>
              <span className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold">
                TIEMPO DE LECTURA
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Atmospheric Reminder */}
      <div className="w-full px-4 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between text-xs font-mono text-stone-400">
        <span className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            {isDetective
              ? 'Lee el caso, la identidad conocida del sospechoso y las pruebas preliminares antes de interrogar.'
              : 'Memoriza tu identidad, tu coartada oficial y tus explicaciones. Podrás consultar esta carpeta durante todo el interrogatorio.'}
          </span>
        </span>
        <span className="text-amber-400 font-bold hidden sm:inline text-[11px]">
          El tiempo de interrogatorio empezará después
        </span>
      </div>

      {/* DETECTIVE PREPARATION VIEW */}
      {isDetective && caseDossier && (
        <div className="w-full bg-[#161311] border border-stone-800 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-6">
          {/* Case metadata overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-850">
              <span className="text-stone-500 block uppercase mb-1">FECHA DEL INCIDENTE:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {caseDossier.dateStr}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-850">
              <span className="text-stone-500 block uppercase mb-1">ESCENARIO DE LOS HECHOS:</span>
              <span className="font-bold text-stone-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {caseDossier.locationName}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-850">
              <span className="text-stone-500 block uppercase mb-1">VENTANA CRÍTICA ESTIMADA:</span>
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {caseDossier.incidentEstimatedWindow}
              </span>
            </div>
          </div>

          {/* Incident summary */}
          <div className="p-4 sm:p-5 rounded-xl bg-stone-950/70 border border-stone-800/90 text-stone-200 text-xs sm:text-sm font-mono leading-relaxed">
            <span className="font-bold text-amber-500 uppercase block mb-1 text-xs">
              RESUMEN DE LA DENUNCIA ({caseDossier.incidentType}):
            </span>
            <p className="text-stone-300">{caseDossier.incidentSummary}</p>
            <div className="mt-2 text-stone-400 text-xs">
              <strong className="text-stone-300">Naturaleza de los hechos:</strong> {caseDossier.targetObjectOrNature}
            </div>
          </div>

          {/* Suspect's Known File Record */}
          <div className="p-4 sm:p-5 rounded-xl bg-[#1a1714] border border-amber-900/40">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> FICHA DE IDENTIDAD DEL SOSPECHOSO EN EL EXPEDIENTE:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono text-stone-300">
              <div>
                <span className="text-stone-500 block">NOMBRE REGISTRADO:</span>
                <span className="font-bold text-stone-100">{caseDossier.suspectKnownIdentity.name}</span>
              </div>
              <div>
                <span className="text-stone-500 block">PROFESIÓN:</span>
                <span className="font-bold text-stone-100">{caseDossier.suspectKnownIdentity.profession}</span>
              </div>
              <div>
                <span className="text-stone-500 block">FECHA DE NACIMIENTO:</span>
                <span className="font-bold text-stone-100">{caseDossier.suspectKnownIdentity.birthDate}</span>
              </div>
              <div>
                <span className="text-stone-500 block">DNI REGISTRADO:</span>
                <span className="font-bold text-stone-100">{caseDossier.suspectKnownIdentity.dni}</span>
              </div>
              <div>
                <span className="text-stone-500 block">DOMICILIO:</span>
                <span className="font-bold text-stone-100">{caseDossier.suspectKnownIdentity.address}</span>
              </div>
              <div>
                <span className="text-stone-500 block">SITUACIÓN:</span>
                <span className="font-bold text-amber-300">{caseDossier.suspectKnownIdentity.knownRelation}</span>
              </div>
            </div>
          </div>

          {/* Persons of interest */}
          <div>
            <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block mb-2.5">
              PERSONAS DE INTERÉS:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {caseDossier.personsOfInterest.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-stone-950/60 border border-stone-850 text-xs font-mono"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-100">{p.name}</span>
                    <span className="px-2 py-0.5 rounded bg-stone-900 text-[10px] text-amber-400 font-semibold border border-stone-800">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Initial Evidence Cards if any */}
          {initialEvidence.length > 0 && (
            <div>
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block mb-2.5">
                DOCUMENTACIÓN INICIAL DE GUARDIA:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {initialEvidence.map((card) => (
                  <CoartadaEvidenceCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUSPECT PREPARATION VIEW */}
      {!isDetective && suspectDossier && (
        <div className="w-full bg-[#181512] border-2 border-stone-700 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-stone-800">
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setSuspectTab('IDENTITY');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                suspectTab === 'IDENTITY'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              👤 MIS DATOS
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setSuspectTab('ALIBI');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                suspectTab === 'ALIBI'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              🗣️ MI VERSIÓN PÚBLICA
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setSuspectTab('TRUTH');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                suspectTab === 'TRUTH'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              🕰️ LO QUE OCURRIÓ REALMENTE
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setSuspectTab('SECRET');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                suspectTab === 'SECRET'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              🔒 MI SECRETO
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setSuspectTab('EXPLANATIONS');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                suspectTab === 'EXPLANATIONS'
                  ? 'bg-amber-600 text-stone-950 shadow-md'
                  : 'bg-stone-900 hover:bg-stone-850 text-stone-400 border border-stone-800'
              }`}
            >
              ⚠️ EXPLICACIÓN DE INCONSISTENCIAS
            </button>
          </div>

          {/* TAB 1: IDENTITY (Requirement 11, 12, 13, 15) */}
          {suspectTab === 'IDENTITY' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800">
                <span className="text-xs font-mono font-bold text-amber-500 uppercase block mb-3">
                  QUIÉN ERES (TUS DATOS OFICIALES Y REALES):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-stone-300">
                  <div>
                    <span className="text-stone-500 block uppercase">NOMBRE COMPLETO:</span>
                    <span className="font-bold text-base text-stone-100">{suspectDossier.identity.fullName}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">PROFESIÓN:</span>
                    <span className="font-bold text-stone-100">{suspectDossier.identity.profession}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">FECHA DE NACIMIENTO Y EDAD:</span>
                    <span className="font-bold text-stone-100">
                      {suspectDossier.identity.birthDate} ({suspectDossier.identity.age} años)
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">DNI (DOCUMENTO):</span>
                    <span className="font-bold text-amber-300">{suspectDossier.identity.dni}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">DOMICILIO:</span>
                    <span className="font-bold text-stone-100">{suspectDossier.identity.addressOrCity}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block uppercase">RELACIÓN CON EL LUGAR:</span>
                    <span className="font-bold text-stone-300">{suspectDossier.identity.relationshipToVenue}</span>
                  </div>
                </div>
              </div>

              {/* Defensible Explanation for Discrepancy if exists */}
              {suspectDossier.identity.identityDiscrepancy && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 text-stone-200 text-xs font-mono leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>DATO QUE PODRÍA PARECER SOSPECHOSO EN EL EXPEDIENTE:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-stone-500 block">DATO QUE CONSTA EN EL EXPEDIENTE:</span>
                      <span className="font-bold text-red-300">
                        {suspectDossier.identity.identityDiscrepancy.field}: {suspectDossier.identity.identityDiscrepancy.fileRecordValue}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">TU DATO REAL:</span>
                      <span className="font-bold text-emerald-300">
                        {suspectDossier.identity.identityDiscrepancy.field}: {suspectDossier.identity.identityDiscrepancy.realValue}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-900/40">
                    <span className="text-stone-400 font-bold block mb-1">POR QUÉ NO COINCIDE (TU EXPLICACIÓN REAL):</span>
                    <p className="text-stone-300">{suspectDossier.identity.identityDiscrepancy.suspectExplanation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALIBI */}
          {suspectTab === 'ALIBI' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl bg-stone-950/80 border border-stone-800 text-xs sm:text-sm font-mono leading-relaxed">
                <span className="text-xs font-mono font-bold text-amber-500 uppercase block mb-2">
                  TU COARTADA PÚBLICA (LO QUE SOSTIENES ANTE LA AUTORIDAD):
                </span>
                <p className="text-stone-200 italic font-serif text-sm sm:text-base leading-relaxed">
                  «{suspectDossier.publicAlibi}»
                </p>
                <div className="mt-3 text-[11px] text-stone-500">
                  Tono del relato: {suspectDossier.narrativeTone}
                </div>
              </div>

              {/* Undeniable Facts */}
              <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-850">
                <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  HECHOS QUE NO PUEDES NEGAR (EL DETECTIVE PODRÍA TENER PRUEBAS):
                </span>
                <ul className="space-y-1.5 text-xs font-mono text-stone-300">
                  {suspectDossier.undeniableFacts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: TRUTH */}
          {suspectTab === 'TRUTH' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">
                CRONOLOGÍA EXACTA DE TUS MOVIMIENTOS:
              </span>
              <div className="space-y-2">
                {suspectDossier.actualTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                        {item.time}
                      </span>
                      <span className="text-stone-300 font-bold">{item.location}</span>
                    </div>
                    <span className="text-stone-400 text-left sm:text-right">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SECRET */}
          {suspectTab === 'SECRET' && (
            <div className="p-5 rounded-xl bg-red-950/20 border border-red-800/60 text-stone-200 text-xs sm:text-sm font-mono leading-relaxed space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs">
                <Lock className="w-4 h-4" />
                <span>TU SECRETO PERSONAL ({suspectDossier.secret.title}):</span>
              </div>
              <p className="text-stone-200">{suspectDossier.secret.detail}</p>
              <div className="p-3 rounded-lg bg-stone-950/60 border border-stone-800 text-xs text-stone-400">
                <strong className="text-amber-400 block mb-1">POR QUÉ LO OCULTAS:</strong>
                {suspectDossier.secret.whyHidden}
              </div>
            </div>
          )}

          {/* TAB 5: EXPLANATIONS */}
          {suspectTab === 'EXPLANATIONS' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider block">
                HECHOS SOSPECHOSOS Y TUS EXPLICACIONES DEFENDIBLES:
              </span>
              <div className="space-y-3">
                {suspectDossier.suspiciousFactsWithExplanations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 text-xs font-mono space-y-2"
                  >
                    <div className="text-amber-300 font-bold">⚠️ {item.fact}</div>
                    <div className="text-[11px] text-stone-500">
                      <strong className="text-stone-400">Por qué parece sospechoso:</strong> {item.whySuspicious}
                    </div>
                    <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-750 text-stone-200 text-[11px]">
                      <strong className="text-emerald-400 block mb-0.5">Tu explicación real:</strong>
                      {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
