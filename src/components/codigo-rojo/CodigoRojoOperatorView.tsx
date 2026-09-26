import React, { useState, useEffect, useRef } from 'react';
import {
  CodigoRojoRoomState,
  CodigoRojoModuleState,
} from '../../types/codigoRojo';
import { getModuleCategory } from '../../data/codigoRojo/categoryMapping';
import { FilamentosModule } from './modules/FilamentosModule';
import { ModuladorFrecuenciaModule } from './modules/ModuladorFrecuenciaModule';
import { GlifosCriptograficosModule } from './modules/GlifosCriptograficosModule';
import { MatrizEnergiaModule } from './modules/MatrizEnergiaModule';
import { ValvulasPresionModule } from './modules/ValvulasPresionModule';
import { RelesHexadecimalesModule } from './modules/RelesHexadecimalesModule';
import { RadarVectorialModule } from './modules/RadarVectorialModule';
import { SeñalOpticaModule } from './modules/SeñalOpticaModule';
import { TecladoMaestroModule } from './modules/TecladoMaestroModule';
import { PalancaSobrecargaModule } from './modules/PalancaSobrecargaModule';
import { CompuertasLogicasModule } from './modules/CompuertasLogicasModule';
import { RefrigeranteQuimicoModule } from './modules/RefrigeranteQuimicoModule';
import { PuertosConexionModule } from './modules/PuertosConexionModule';
import { DisipadorTermicoModule } from './modules/DisipadorTermicoModule';
import { SincronizadorFasesModule } from './modules/SincronizadorFasesModule';
import { CalibradorGiroscopioModule } from './modules/CalibradorGiroscopioModule';
import { ReactorPlasmaModule } from './modules/ReactorPlasmaModule';
import { FrecuenciaResonanciaModule } from './modules/FrecuenciaResonanciaModule';
import { SecuenciaCineticaModule } from './modules/SecuenciaCineticaModule';
import { DivisorVoltajeModule } from './modules/DivisorVoltajeModule';
import { CamaraContrapesosModule } from './modules/CamaraContrapesosModule';
import { PrismaRefraccionModule } from './modules/PrismaRefraccionModule';
import { CircuitoRefrigeranteModule } from './modules/CircuitoRefrigeranteModule';
import { AnillosCifradoModule } from './modules/AnillosCifradoModule';
import { MasasMagneticasModule } from './modules/MasasMagneticasModule';
import { PresionPistonModule } from './modules/PresionPistonModule';
import { GiroscopioEstabilizacionModule } from './modules/GiroscopioEstabilizacionModule';
import { CamaraCartuchosModule } from './modules/CamaraCartuchosModule';
import { FlujoGravitacionalModule } from './modules/FlujoGravitacionalModule';
import { PlacasSuperpuestasModule } from './modules/PlacasSuperpuestasModule';
import { CodigoRojoLampEntrance } from './components/CodigoRojoLampEntrance';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface CodigoRojoOperatorViewProps {
  roomState: CodigoRojoRoomState;
  onSubmitAction: (moduleId: string, action: any) => void;
  onAbandon: () => void;
}

export const CodigoRojoOperatorView: React.FC<CodigoRojoOperatorViewProps> = ({
  roomState,
  onSubmitAction,
  onAbandon,
}) => {
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  // Atmospheric overhead lamp entrance sequence: triggered once per new round/mission
  const lastAnimatedMissionRef = useRef<number | null>(null);
  const [isEntranceActive, setIsEntranceActive] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const sessionKey = `cr_lamp_seen_${roomState.code}_m${roomState.missionNumber}`;
    return sessionStorage.getItem(sessionKey) !== 'true';
  });

  useEffect(() => {
    const currentMission = roomState.missionNumber;
    const sessionKey = `cr_lamp_seen_${roomState.code}_m${currentMission}`;
    const alreadySeen = typeof window !== 'undefined' && sessionStorage.getItem(sessionKey) === 'true';

    if (!alreadySeen && lastAnimatedMissionRef.current !== currentMission) {
      setIsEntranceActive(true);
    } else if (alreadySeen && lastAnimatedMissionRef.current === currentMission) {
      setIsEntranceActive(false);
    }
  }, [roomState.code, roomState.missionNumber]);

  const handleEntranceComplete = () => {
    const currentMission = roomState.missionNumber;
    try {
      sessionStorage.setItem(`cr_lamp_seen_${roomState.code}_m${currentMission}`, 'true');
    } catch {
      // ignore
    }
    lastAnimatedMissionRef.current = currentMission;
    setIsEntranceActive(false);
  };

  // Strike & error impact states
  const [isShaking, setIsShaking] = useState(false);
  const [showStrikeFlash, setShowStrikeFlash] = useState(false);

  // Solved module visual feedback
  const [justSolvedModuleId, setJustSolvedModuleId] = useState<string | null>(null);

  // Independent ticking tension volume and mute state
  const [tickingVolume, setTickingVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return 0.35;
    const saved = localStorage.getItem('codigo_rojo_ticking_vol');
    return saved !== null ? parseFloat(saved) : 0.35;
  });

  const [isTickingMuted, setIsTickingMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('codigo_rojo_ticking_muted') === 'true';
  });

  const handleTickingVolumeChange = (newVol: number) => {
    setTickingVolume(newVol);
    if (typeof window !== 'undefined') {
      localStorage.setItem('codigo_rojo_ticking_vol', newVol.toString());
    }
  };

  const handleToggleTickingMute = () => {
    setIsTickingMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('codigo_rojo_ticking_muted', next.toString());
      }
      return next;
    });
  };

  const { modules, strikes, maxStrikes, timeRemainingSeconds, missionNumber } = roomState;
  const activeModule = modules[selectedModuleIndex] || modules[0];

  // Subtle ticking-clock tension sound for Operator, speeding up when countdown is low
  useEffect(() => {
    if (isTickingMuted || tickingVolume <= 0.01) return;

    const urgency =
      timeRemainingSeconds <= 30
        ? 'critical'
        : timeRemainingSeconds <= 60
        ? 'warning'
        : 'normal';
    const intervalMs =
      timeRemainingSeconds <= 30 ? 500 : timeRemainingSeconds <= 60 ? 750 : 1000;

    const intervalId = setInterval(() => {
      audio.playOperatorTick(urgency, tickingVolume);
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [timeRemainingSeconds, isTickingMuted, tickingVolume]);

  // Audio & visual impact feedback for strikes
  const prevStrikesRef = useRef(strikes);
  useEffect(() => {
    if (strikes > prevStrikesRef.current) {
      audio.playStrike();
      setIsShaking(true);
      setShowStrikeFlash(true);
      const shakeTimer = setTimeout(() => setIsShaking(false), 320);
      const flashTimer = setTimeout(() => setShowStrikeFlash(false), 420);
      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(flashTimer);
      };
    }
    prevStrikesRef.current = strikes;
  }, [strikes]);

  // Audio & visual feedback when any module is solved
  const solvedCount = modules.filter((m) => m.solved).length;
  const prevSolvedCountRef = useRef(solvedCount);
  const prevModulesSolvedRef = useRef<Set<string>>(
    new Set(modules.filter((m) => m.solved).map((m) => m.id))
  );

  useEffect(() => {
    if (solvedCount > prevSolvedCountRef.current) {
      audio.playModuleSolved();
      const newlySolved = modules.find(
        (m) => m.solved && !prevModulesSolvedRef.current.has(m.id)
      );
      if (newlySolved) {
        setJustSolvedModuleId(newlySolved.id);
        const timer = setTimeout(() => setJustSolvedModuleId(null), 1200);
        return () => clearTimeout(timer);
      }
    }
    prevSolvedCountRef.current = solvedCount;
    prevModulesSolvedRef.current = new Set(
      modules.filter((m) => m.solved).map((m) => m.id)
    );
  }, [solvedCount, modules]);

  const handleSelectModule = (idx: number) => {
    if (idx !== selectedModuleIndex) {
      audio.playRelayLatch();
      setSelectedModuleIndex(idx);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds <= 60;
  const isCriticalTime = timeRemainingSeconds <= 30;

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between bg-slate-950 text-slate-100 p-3 sm:p-6 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] ${
        isShaking ? 'animate-cr-strike' : ''
      }`}
    >
      {/* Red Emergency Strike Flash Vignette (only for strikes during gameplay) */}
      {showStrikeFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-600/25 shadow-[inset_0_0_100px_rgba(239,68,68,0.8)] transition-opacity duration-300" />
      )}

      {/* Cinematic Overhead Lamp Reveal Entrance (Black -> Overhead Lamp -> Full Panel) */}
      {isEntranceActive && (
        <CodigoRojoLampEntrance
          key={`lamp-${roomState.code}-m${missionNumber}`}
          roomCode={roomState.code}
          missionNumber={missionNumber}
          onComplete={handleEntranceComplete}
        />
      )}

      {/* Tactical Ambient Lighting Glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[340px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isCriticalTime
            ? 'bg-red-600/25 animate-pulse'
            : isLowTime
            ? 'bg-red-600/15'
            : 'bg-red-600/10'
        }`}
      />

      {/* Control Room Top Header */}
      <header
        className={`relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border-2 shadow-2xl backdrop-blur transition-colors ${
          isCriticalTime
            ? 'border-red-500/70 shadow-red-500/20'
            : 'border-red-500/40'
        }`}
      >
        {/* Mission & Role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/60 flex items-center justify-center text-xl">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
                CÓDIGO ROJO • MISIÓN {missionNumber}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-black uppercase text-red-300">
                OPERADOR
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white">
              CONSOLA DE LA MÁQUINA
            </h1>
          </div>
        </div>

        {/* Machine Stamped Serial Number Plate */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-3.5 py-1.5 rounded-xl border-2 border-stone-600/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] font-mono">
          <span className="w-2 h-2 rounded-full bg-stone-500 border border-stone-400 shadow-sm" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">
              Nº SERIE MÁQUINA
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-300 tracking-widest font-mono">
              {roomState.machineSerial || 'CR-4821-X7'}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-stone-500 border border-stone-400 shadow-sm" />
        </div>

        {/* Tension Sound Controls: Independent Volume & Mute */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono shadow-inner">
          <button
            type="button"
            onClick={handleToggleTickingMute}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isTickingMuted || tickingVolume <= 0.01
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-slate-800 text-amber-400 hover:text-white'
            }`}
            title={
              isTickingMuted
                ? 'Activar sonido de tensión (tic-tac)'
                : 'Silenciar sonido de tensión'
            }
          >
            {isTickingMuted || tickingVolume <= 0.01 ? (
              <VolumeX className="w-4 h-4" />
            ) : tickingVolume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 hidden sm:inline uppercase font-bold">
              TIC-TAC:
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isTickingMuted ? 0 : tickingVolume}
              onChange={(e) => {
                if (isTickingMuted) setIsTickingMuted(false);
                handleTickingVolumeChange(parseFloat(e.target.value));
              }}
              className="w-14 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              title={`Volumen del tic-tac: ${Math.round(
                (isTickingMuted ? 0 : tickingVolume) * 100
              )}%`}
            />
            <span className="text-[10px] text-slate-400 w-7 text-right">
              {isTickingMuted ? 'OFF' : `${Math.round(tickingVolume * 100)}%`}
            </span>
          </div>
        </div>

        {/* Strikes Display (X X X) */}
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
          className={`flex items-center gap-2 px-5 py-2 rounded-xl border-2 font-mono font-black text-xl sm:text-2xl transition-all ${
            isLowTime
              ? 'bg-red-950/80 border-red-500 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-slate-950 border-slate-700 text-white shadow-inner'
          }`}
        >
          <Clock className={`w-5 h-5 ${isLowTime ? 'text-red-400' : 'text-slate-400'}`} />
          <span>{formatTimer(timeRemainingSeconds)}</span>
        </div>
      </header>

      {/* Main Console Body */}
      <main className="relative z-10 flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto flex flex-col my-4 gap-4">
        {/* Module Rack Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {modules.map((mod, idx) => {
            const isSelected = selectedModuleIndex === idx;
            const category = getModuleCategory(mod.moduleType);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectModule(idx)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  mod.solved
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : isSelected
                    ? 'bg-red-600/30 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {mod.solved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                )}
                <span>PANEL {idx + 1}</span>
                <span className="font-mono text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700/60 text-cyan-300">
                  {category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Module Panel with physical chassis & CRT screen scanline */}
        <div
          className={`flex-1 w-full min-h-[480px] bg-slate-900/90 rounded-3xl border-2 p-2 sm:p-5 shadow-2xl relative flex flex-col justify-between transition-all cr-crt-screen ${
            activeModule?.solved
              ? 'border-emerald-500/50 shadow-emerald-950/30'
              : 'border-slate-800 shadow-black'
          } ${
            justSolvedModuleId === activeModule?.id ? 'animate-cr-solved' : ''
          }`}
        >
          {/* Physical simulated hex screws on 4 corners */}
          <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono -rotate-45 pointer-events-none select-none z-10">
            +
          </div>
          <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono rotate-45 pointer-events-none select-none z-10">
            +
          </div>
          <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono rotate-12 pointer-events-none select-none z-10">
            +
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-stone-700 border border-stone-500/70 shadow-inner flex items-center justify-center text-[7px] text-stone-400 font-mono -rotate-30 pointer-events-none select-none z-10">
            +
          </div>

          {/* Broad Category Industrial Banner (NO EXACT MANUAL TITLE) */}
          {activeModule && (
            <div className="w-full flex items-center justify-between px-3.5 py-2 mb-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono select-none">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  CATEGORÍA DEL PANEL:
                </span>
                <span className="px-2.5 py-0.5 rounded-md font-mono font-black tracking-widest text-xs uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-500/50 shadow-sm">
                  {getModuleCategory(activeModule.moduleType)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-500">ESTADO:</span>
                <span
                  className={`font-black uppercase tracking-wider ${
                    activeModule.solved ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {activeModule.solved ? '✓ NEUTRALIZADO' : '● ACTIVO'}
                </span>
              </div>
            </div>
          )}

          {activeModule && (
            <>
              {activeModule.moduleType === 'FILAMENTOS' && (
                <FilamentosModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'MODULADOR_FRECUENCIA' && (
                <ModuladorFrecuenciaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'GLIFOS_CRIPTOGRAFICOS' && (
                <GlifosCriptograficosModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'MATRIZ_ENERGIA' && (
                <MatrizEnergiaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'VALVULAS_PRESION' && (
                <ValvulasPresionModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'RELES_HEXADECIMALES' && (
                <RelesHexadecimalesModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'RADAR_VECTORIAL' && (
                <RadarVectorialModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'SEÑAL_OPTICA' && (
                <SeñalOpticaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'TECLADO_MAESTRO' && (
                <TecladoMaestroModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'PALANCA_SOBRECARGA' && (
                <PalancaSobrecargaModule
                  operatorState={activeModule.operatorState}
                  timeRemainingSeconds={timeRemainingSeconds}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'COMPUERTAS_LOGICAS' && (
                <CompuertasLogicasModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'REFRIGERANTE_QUIMICO' && (
                <RefrigeranteQuimicoModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'PUERTOS_CONEXION' && (
                <PuertosConexionModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'DISIPADOR_TERMICO' && (
                <DisipadorTermicoModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'SINCRONIZADOR_FASES' && (
                <SincronizadorFasesModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'CALIBRADOR_GIROSCOPIO' && (
                <CalibradorGiroscopioModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'REACTOR_PLASMA' && (
                <ReactorPlasmaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'FRECUENCIA_RESONANCIA' && (
                <FrecuenciaResonanciaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'SECUENCIA_CINETICA' && (
                <SecuenciaCineticaModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'DIVISOR_VOLTAJE' && (
                <DivisorVoltajeModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'CAMARA_CONTRAPESOS' && (
                <CamaraContrapesosModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'PRISMA_REFRACCION' && (
                <PrismaRefraccionModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'CIRCUITO_REFRIGERANTE' && (
                <CircuitoRefrigeranteModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'ANILLOS_CIFRADO' && (
                <AnillosCifradoModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'MASAS_MAGNETICAS' && (
                <MasasMagneticasModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'PRESION_PISTON' && (
                <PresionPistonModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'GIROSCOPIO_ESTABILIZACION' && (
                <GiroscopioEstabilizacionModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'CAMARA_CARTUCHOS' && (
                <CamaraCartuchosModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'FLUJO_GRAVITACIONAL' && (
                <FlujoGravitacionalModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
              {activeModule.moduleType === 'PLACAS_SUPERPUESTAS' && (
                <PlacasSuperpuestasModule
                  operatorState={activeModule.operatorState}
                  solved={activeModule.solved}
                  onAction={(act) => onSubmitAction(activeModule.id, act)}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer bar with role reminder & leave option */}
      <footer className="relative z-10 w-full max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 py-2">
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          <span>¡No mires el manual de los Guías! Comunica verbalmente lo que ves.</span>
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
