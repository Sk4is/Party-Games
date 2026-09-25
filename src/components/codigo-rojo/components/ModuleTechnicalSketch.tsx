import React from 'react';
import { CodigoRojoModuleType } from '../../../types/codigoRojo';

interface ModuleTechnicalSketchProps {
  moduleType: CodigoRojoModuleType;
  className?: string;
}

export const ModuleTechnicalSketch: React.FC<ModuleTechnicalSketchProps> = ({
  moduleType,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full rounded-xl bg-slate-950 border-2 border-slate-700/80 p-3 sm:p-4 shadow-inner overflow-hidden select-none ${className}`}
    >
      {/* Blueprint Grid Background Pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="blueprint-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      </svg>

      {/* Blueprint Top Badge */}
      <div className="relative z-10 flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
          <span>📐</span>
          <span>ESQUEMA TÉCNICO DE IDENTIFICACIÓN</span>
        </div>
        <span className="text-slate-500 font-mono">FIG. REF // {moduleType}</span>
      </div>

      {/* Diagram Render */}
      <div className="relative z-10 w-full flex items-center justify-center py-1">
        {renderSketchSvg(moduleType)}
      </div>
    </div>
  );
};

function renderSketchSvg(type: CodigoRojoModuleType) {
  switch (type) {
    // 1. FILAMENTOS (Cables verticales entre bornes)
    case 'FILAMENTOS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          {/* Chassis outline */}
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Upper terminal block */}
          <rect x="25" y="22" width="270" height="14" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="45" cy="29" r="3" fill="#38bdf8" />
          <circle cx="105" cy="29" r="3" fill="#38bdf8" />
          <circle cx="165" cy="29" r="3" fill="#38bdf8" />
          <circle cx="225" cy="29" r="3" fill="#38bdf8" />
          <circle cx="275" cy="29" r="3" fill="#38bdf8" />
          {/* Top LED */}
          <circle cx="35" cy="17" r="3.5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1" />
          <text x="45" y="19" fill="#94a3b8" stroke="none">LED PILOTO</text>
          {/* Lower terminal block */}
          <rect x="25" y="94" width="270" height="14" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="45" cy="101" r="3" fill="#38bdf8" />
          <circle cx="105" cy="101" r="3" fill="#38bdf8" />
          <circle cx="165" cy="101" r="3" fill="#38bdf8" />
          <circle cx="225" cy="101" r="3" fill="#38bdf8" />
          <circle cx="275" cy="101" r="3" fill="#38bdf8" />
          {/* Vertical wires (solid & striped) */}
          <path d="M 65 36 L 65 94" stroke="#ef4444" strokeWidth="3.5" />
          <path d="M 125 36 L 125 94" stroke="#38bdf8" strokeWidth="3.5" />
          <path d="M 185 36 L 185 94" stroke="#eab308" strokeWidth="3.5" strokeDasharray="6 3" />
          <path d="M 245 36 L 245 94" stroke="#f8fafc" strokeWidth="3.5" />
          {/* Annotations */}
          <text x="75" y="68" fill="#64748b" stroke="none">3 - 6 CABLES VERTICALES</text>
          <text x="195" y="80" fill="#f59e0b" stroke="none">(FRANJAS O LISOS)</text>
        </svg>
      );

    // 2. MODULADOR_FRECUENCIA (Osciloscopio con forma de onda)
    case 'MODULADOR_FRECUENCIA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Oscilloscope CRT display */}
          <rect x="25" y="20" width="180" height="75" rx="4" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
          {/* Grid lines */}
          <line x1="25" y1="57" x2="205" y2="57" stroke="#065f46" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="115" y1="20" x2="115" y2="95" stroke="#065f46" strokeWidth="1" strokeDasharray="3 3" />
          {/* Waveform */}
          <path d="M 30 57 Q 45 25 60 57 T 90 57 T 120 57 T 150 57 T 180 57 T 200 57" stroke="#34d399" strokeWidth="2.5" />
          {/* Digital display & buttons */}
          <rect x="25" y="100" width="180" height="15" rx="2" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" />
          <text x="50" y="111" fill="#6ee7b7" stroke="none">FREQ: [ 450.0 kHz ]</text>
          {/* Controls right rack */}
          <rect x="215" y="20" width="80" height="95" rx="4" fill="#1e293b" stroke="#334155" />
          <rect x="225" y="28" width="60" height="16" rx="2" fill="#0f172a" stroke="#10b981" />
          <text x="237" y="39" fill="#34d399" stroke="none">CH-1..4</text>
          <circle cx="240" cy="65" r="9" stroke="#94a3b8" strokeWidth="1.5" fill="#334155" />
          <text x="236" y="68" fill="#f8fafc" stroke="none">-</text>
          <circle cx="270" cy="65" r="9" stroke="#94a3b8" strokeWidth="1.5" fill="#334155" />
          <text x="266" y="68" fill="#f8fafc" stroke="none">+</text>
          <rect x="225" y="85" width="60" height="18" rx="3" fill="#047857" stroke="#10b981" />
          <text x="233" y="97" fill="#ffffff" stroke="none" fontWeight="bold">CALIBRAR</text>
        </svg>
      );

    // 3. GLIFOS_CRIPTOGRAFICOS (Matriz 2x2 de botones rúnicos)
    case 'GLIFOS_CRIPTOGRAFICOS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Top banner */}
          <text x="25" y="24" fill="#fbbf24" stroke="none" fontWeight="bold">4 BOTONES CUADRADOS (MATRIZ 2x2)</text>
          <circle cx="280" cy="22" r="4" fill="#f59e0b" />
          {/* 4 large keypad buttons */}
          <g transform="translate(60, 32)">
            {/* Top-Left */}
            <rect x="0" y="0" width="90" height="40" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="38" y="26" fill="#fbbf24" stroke="none" fontSize="18" fontFamily="sans-serif">⍾</text>
            {/* Top-Right */}
            <rect x="110" y="0" width="90" height="40" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="148" y="26" fill="#fbbf24" stroke="none" fontSize="18" fontFamily="sans-serif">⌬</text>
            {/* Bottom-Left */}
            <rect x="0" y="46" width="90" height="40" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="38" y="72" fill="#fbbf24" stroke="none" fontSize="18" fontFamily="sans-serif">⌖</text>
            {/* Bottom-Right */}
            <rect x="110" y="46" width="90" height="40" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="148" y="72" fill="#fbbf24" stroke="none" fontSize="18" fontFamily="sans-serif">⎊</text>
          </g>
        </svg>
      );

    // 4. MATRIZ_ENERGIA (Matriz 3x3 de pulsadores)
    case 'MATRIZ_ENERGIA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#38bdf8" stroke="none" fontWeight="bold">RETÍCULA 3x3 (9 PULSADORES)</text>
          <rect x="220" y="15" width="70" height="14" rx="2" fill="#1e3a8a" stroke="#3b82f6" />
          <text x="226" y="25" fill="#bfdbfe" stroke="none">ESTADO: CRÍT.</text>
          {/* 3x3 button layout */}
          <g transform="translate(60, 32)">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={c * 38}
                  y={r * 28}
                  width="30"
                  height="22"
                  rx="4"
                  fill={r === 1 && c === 1 ? '#0284c7' : '#1e293b'}
                  stroke={r === 1 && c === 1 ? '#38bdf8' : '#475569'}
                  strokeWidth="1.2"
                />
              ))
            )}
          </g>
          {/* Discharge trigger */}
          <rect x="200" y="55" width="90" height="35" rx="6" fill="#b91c1c" stroke="#ef4444" strokeWidth="1.5" />
          <text x="212" y="76" fill="#ffffff" stroke="none" fontWeight="bold">DESCARGAR</text>
        </svg>
      );

    // 5. VALVULAS_PRESION (3 manómetros circulares con agujas + ruedas giratorias)
    case 'VALVULAS_PRESION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* 3 circular dial gauges */}
          {[55, 160, 265].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy="42" r="22" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              <path d={`M ${cx - 15} 42 A 15 15 0 0 1 ${cx + 15} 42`} stroke="#d97706" strokeWidth="2" strokeDasharray="2 3" />
              {/* Dial needle */}
              <line cx1={cx} cy1={42} x2={cx + (i === 1 ? -8 : 10)} y2={42 - 12} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx={cx} cy="42" r="2.5" fill="#f8fafc" />
              <text x={cx - 14} y="54" fill="#94a3b8" stroke="none" fontSize="8">{['PSI A', 'PSI B', 'PSI C'][i]}</text>
              {/* Valve handle below */}
              <circle cx={cx} cy="88" r="16" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1={cx - 16} y1="88" x2={cx + 16} y2="88" stroke="#cbd5e1" strokeWidth="2" />
              <line x1={cx} y1="72" x2={cx} y2="104" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx={cx} cy="88" r="4" fill="#f59e0b" />
            </g>
          ))}
          <text x="25" y="118" fill="#64748b" stroke="none">3 MANÓMETROS ANALÓGICOS + 3 VÁLVULAS GIRATORIAS (A, B, C)</text>
        </svg>
      );

    // 6. RELES_HEXADECIMALES (4 cajas de relé con interruptores basculantes)
    case 'RELES_HEXADECIMALES':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#c084fc" stroke="none" fontWeight="bold">BANCO DE 4 RELÉS // BUS LÓGICO</text>
          {/* 4 relays */}
          {[45, 115, 185, 255].map((cx, i) => (
            <g key={i}>
              <rect x={cx - 25} y="32" width="50" height="60" rx="4" fill="#1e293b" stroke="#7e22ce" strokeWidth="1.2" />
              <text x={cx - 6} y="44" fill="#94a3b8" stroke="none">R{i + 1}</text>
              {/* Hex display */}
              <rect x={cx - 18} y="48" width="36" height="14" rx="2" fill="#581c87" stroke="#a855f7" />
              <text x={cx - 8} y="59" fill="#f3e8ff" stroke="none" fontWeight="bold">{['0x4', '0xA', '0xF', '0x2'][i]}</text>
              {/* Toggle switch */}
              <rect x={cx - 12} y="68" width="24" height="18" rx="2" fill="#0f172a" stroke="#64748b" />
              <rect x={cx - 10} y={i % 2 === 0 ? 69 : 78} width="20" height="8" rx="2" fill={i % 2 === 0 ? '#10b981' : '#ef4444'} />
            </g>
          ))}
          <text x="35" y="112" fill="#64748b" stroke="none">PANTALLAS HEXADECIMALES + INTERRUPTORES UP/DOWN</text>
        </svg>
      );

    // 7. RADAR_VECTORIAL (Pantalla circular de radar con barrido)
    case 'RADAR_VECTORIAL':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Radar circular screen */}
          <g transform="translate(100, 65)">
            <circle cx="0" cy="0" r="48" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="32" stroke="#047857" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="16" stroke="#047857" strokeWidth="1" strokeDasharray="3 3" />
            {/* Crosshairs */}
            <line x1="-48" y1="0" x2="48" y2="0" stroke="#059669" strokeWidth="1" />
            <line x1="0" y1="-48" x2="0" y2="48" stroke="#059669" strokeWidth="1" />
            {/* Sweep beam & blip */}
            <line x1="0" y1="0" x2="34" y2="-34" stroke="#34d399" strokeWidth="2" />
            <circle cx="22" cy="-22" r="3" fill="#ef4444" stroke="#fca5a5" strokeWidth="1" />
          </g>
          {/* Right quadrant controls */}
          <g transform="translate(180, 25)">
            <text x="0" y="15" fill="#34d399" stroke="none" fontWeight="bold">RETÍCULA POLAR</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">ANILLOS: 1, 2, 3</text>
            <text x="0" y="47" fill="#94a3b8" stroke="none">CUADRANTES: NO, NE, SO, SE</text>
            <rect x="0" y="58" width="50" height="22" rx="4" fill="#047857" stroke="#10b981" />
            <text x="8" y="72" fill="#ffffff" stroke="none" fontWeight="bold">FIJAR [X]</text>
          </g>
        </svg>
      );

    // 8. SEÑAL_OPTICA (Lámpara estroboscópica con destellos)
    case 'SEÑAL_OPTICA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Central Strobe Dome */}
          <g transform="translate(100, 65)">
            <circle cx="0" cy="0" r="36" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            {/* Radiating pulse waves */}
            <circle cx="0" cy="0" r="44" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
            <circle cx="0" cy="0" r="24" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="0" cy="0" r="14" fill="#fbbf24" />
          </g>
          <g transform="translate(170, 25)">
            <text x="0" y="15" fill="#fbbf24" stroke="none" fontWeight="bold">EMISOR ESTROBOSCÓPICO</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">PULSOS LUZ: CORTOS / LARGOS</text>
            <text x="0" y="47" fill="#94a3b8" stroke="none">PATRÓN CÍCLICO REPETITIVO</text>
            <rect x="0" y="58" width="105" height="24" rx="4" fill="#1e293b" stroke="#f59e0b" />
            <text x="10" y="73" fill="#fbbf24" stroke="none">SINTONIZAR FREQ</text>
          </g>
        </svg>
      );

    // 9. TECLADO_MAESTRO (Teclado numérico 3x4 + pantalla LCD)
    case 'TECLADO_MAESTRO':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* LCD Screen on left */}
          <rect x="25" y="25" width="120" height="35" rx="4" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
          <text x="35" y="46" fill="#34d399" stroke="none" fontSize="14" fontWeight="bold">PIN: [ • • • • ]</text>
          <text x="25" y="80" fill="#94a3b8" stroke="none">TECLADO MATRICIAL</text>
          <text x="25" y="95" fill="#64748b" stroke="none">CON PANTALLA DE CÓDIGO</text>
          {/* 3x4 Keypad on right */}
          <g transform="translate(175, 18)">
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['C', '0', 'E'],
            ].map((row, r) =>
              row.map((ch, c) => (
                <g key={`${r}-${c}`}>
                  <rect x={c * 34} y={r * 23} width="28" height="18" rx="3" fill="#1e293b" stroke="#475569" />
                  <text x={c * 34 + 10} y={r * 23 + 13} fill="#f8fafc" stroke="none" fontWeight="bold">
                    {ch}
                  </text>
                </g>
              ))
            )}
          </g>
        </svg>
      );

    // 10. PALANCA_SOBRECARGA (Palanca pesada vertical tipo interruptor maestro)
    case 'PALANCA_SOBRECARGA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Warning stripes */}
          <rect x="25" y="20" width="270" height="10" fill="#dc2626" stroke="#991b1b" />
          <line x1="50" y1="20" x2="60" y2="30" stroke="#fef08a" strokeWidth="3" />
          <line x1="90" y1="20" x2="100" y2="30" stroke="#fef08a" strokeWidth="3" />
          <line x1="130" y1="20" x2="140" y2="30" stroke="#fef08a" strokeWidth="3" />
          <line x1="170" y1="20" x2="180" y2="30" stroke="#fef08a" strokeWidth="3" />
          <line x1="210" y1="20" x2="220" y2="30" stroke="#fef08a" strokeWidth="3" />
          <line x1="250" y1="20" x2="260" y2="30" stroke="#fef08a" strokeWidth="3" />
          {/* Heavy Lever Slot */}
          <rect x="135" y="38" width="50" height="70" rx="6" fill="#020617" stroke="#475569" strokeWidth="1.5" />
          {/* Lever arm */}
          <rect x="150" y="44" width="20" height="35" rx="4" fill="#b91c1c" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="160" cy="44" r="10" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
          <text x="35" y="55" fill="#ef4444" stroke="none" fontWeight="bold">CONMUTADOR DE PALANCA</text>
          <text x="35" y="70" fill="#94a3b8" stroke="none">RANURA VERTICAL DE RECORRIDO</text>
          <text x="35" y="85" fill="#94a3b8" stroke="none">POSICIÓN: ARRIBA / ABAJO</text>
          <text x="210" y="65" fill="#f59e0b" stroke="none">TEMPORIZADO AL SEGUNDO</text>
        </svg>
      );

    // 11. COMPUERTAS_LOGICAS (Circuito integrado con compuerta lógica)
    case 'COMPUERTAS_LOGICAS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#60a5fa" stroke="none" fontWeight="bold">CHIP INTEGRADO // ESQUEMA LÓGICO</text>
          {/* Inputs */}
          <text x="30" y="52" fill="#94a3b8" stroke="none">PIN A</text>
          <circle cx="70" cy="48" r="5" fill="#1e40af" stroke="#60a5fa" />
          <text x="30" y="82" fill="#94a3b8" stroke="none">PIN B</text>
          <circle cx="70" cy="78" r="5" fill="#1e40af" stroke="#60a5fa" />
          {/* Logic gate symbol */}
          <path d="M 75 48 L 120 48" stroke="#60a5fa" strokeWidth="1.5" />
          <path d="M 75 78 L 120 78" stroke="#60a5fa" strokeWidth="1.5" />
          <path d="M 120 40 L 145 40 Q 175 63 145 86 L 120 86 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <text x="130" y="66" fill="#93c5fd" stroke="none" fontWeight="bold">AND</text>
          <path d="M 175 63 L 220 63" stroke="#60a5fa" strokeWidth="1.5" />
          {/* Output node */}
          <circle cx="225" cy="63" r="6" fill="#10b981" stroke="#34d399" />
          <text x="238" y="66" fill="#34d399" stroke="none" fontWeight="bold">SALIDA [Q]</text>
          <text x="25" y="108" fill="#64748b" stroke="none">ENTRADAS BOOLEANAS (0/1) A COMPUERTA LÓGICA</text>
        </svg>
      );

    // 12. REFRIGERANTE_QUIMICO (3 cilindros graduados con líquido)
    case 'REFRIGERANTE_QUIMICO':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#34d399" stroke="none" fontWeight="bold">3 CILINDROS DE FLUIDO GRADUADOS</text>
          {/* 3 glass cylinders */}
          {[60, 160, 260].map((cx, i) => {
            const fills = ['#3b82f6', '#10b981', '#ef4444'];
            const names = ['AZUL', 'VERDE', 'ROJO'];
            return (
              <g key={i}>
                {/* Cylinder container */}
                <rect x={cx - 16} y="32" width="32" height="65" rx="6" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                {/* Fluid */}
                <rect x={cx - 14} y={32 + 25} width="28" height="38" rx="4" fill={fills[i]} opacity="0.8" />
                {/* Graduation lines */}
                <line x1={cx - 16} y1="45" x2={cx - 8} y2="45" stroke="#94a3b8" />
                <line x1={cx - 16} y1="58" x2={cx - 8} y2="58" stroke="#94a3b8" />
                <line x1={cx - 16} y1="72" x2={cx - 8} y2="72" stroke="#94a3b8" />
                <text x={cx - 14} y="110" fill="#94a3b8" stroke="none" fontSize="8">{names[i]}</text>
              </g>
            );
          })}
        </svg>
      );

    // 13. PUERTOS_CONEXION (Dos filas de 4 conectores jack redondos con cables de parcheo)
    case 'PUERTOS_CONEXION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#fbbf24" stroke="none" fontWeight="bold">PANEL DE PARCHEO // 8 CONECTORES JACK</text>
          {/* Top Row: A, B, C, D */}
          {[60, 120, 180, 240].map((cx, i) => (
            <g key={`top-${i}`}>
              <circle cx={cx} cy="42" r="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx={cx} cy="42" r="4" fill="#020617" />
              <text x={cx - 3} y="30" fill="#94a3b8" stroke="none">{['A', 'B', 'C', 'D'][i]}</text>
            </g>
          ))}
          {/* Bottom Row: 1, 2, 3, 4 */}
          {[60, 120, 180, 240].map((cx, i) => (
            <g key={`bot-${i}`}>
              <circle cx={cx} cy="88" r="10" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx={cx} cy="88" r="4" fill="#020617" />
              <text x={cx - 3} y="108" fill="#94a3b8" stroke="none">{i + 1}</text>
            </g>
          ))}
          {/* Patch cable curves */}
          <path d="M 60 42 C 70 65, 110 65, 120 88" stroke="#ef4444" strokeWidth="2.5" fill="none" />
          <path d="M 180 42 C 190 70, 230 70, 240 88" stroke="#eab308" strokeWidth="2.5" fill="none" strokeDasharray="4 2" />
        </svg>
      );

    // 14. DISIPADOR_TERMICO (Radiador con aletas horizontales y deslizador de flujo)
    case 'DISIPADOR_TERMICO':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#fb923c" stroke="none" fontWeight="bold">ALETAS DE REFRIGERACIÓN + CONTROL DESLIZANTE</text>
          {/* Cooling fin grill */}
          <g transform="translate(30, 32)">
            {[0, 10, 20, 30, 40].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="160" y2={y} stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
            ))}
          </g>
          {/* Slider track below */}
          <rect x="30" y="85" width="160" height="12" rx="4" fill="#020617" stroke="#64748b" />
          <rect x="90" y="81" width="22" height="20" rx="4" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
          {/* Temperature meter bar */}
          <rect x="220" y="32" width="65" height="65" rx="4" fill="#1e293b" stroke="#64748b" />
          <text x="230" y="50" fill="#f87171" stroke="none">TEMP °C</text>
          <rect x="230" y="60" width="45" height="10" fill="#dc2626" />
        </svg>
      );

    // 15. SINCRONIZADOR_FASES (Anillos concéntricos giratorios con muescas)
    case 'SINCRONIZADOR_FASES':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Two concentric rings */}
          <g transform="translate(100, 65)">
            <circle cx="0" cy="0" r="44" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="12 4" />
            <circle cx="0" cy="0" r="28" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="8 4" />
            <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
            {/* Alignment notch markers */}
            <line x1="0" y1="-44" x2="0" y2="-36" stroke="#ffffff" strokeWidth="3" />
            <line x1="28" y1="0" x2="20" y2="0" stroke="#ffffff" strokeWidth="3" />
          </g>
          <g transform="translate(170, 30)">
            <text x="0" y="15" fill="#22d3ee" stroke="none" fontWeight="bold">ANILLOS CONCÉNTRICOS</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">ANILLO EXTERIOR / INTERIOR</text>
            <text x="0" y="47" fill="#94a3b8" stroke="none">MUESCAS DE ALINEACIÓN ANGULAR</text>
            <rect x="0" y="58" width="95" height="22" rx="4" fill="#0891b2" stroke="#22d3ee" />
            <text x="12" y="72" fill="#ffffff" stroke="none" fontWeight="bold">SINCRONIZAR</text>
          </g>
        </svg>
      );

    // 16. CALIBRADOR_GIROSCOPIO (Horizonte artificial aeronáutico con escala de cabeceo)
    case 'CALIBRADOR_GIROSCOPIO':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Artificial Horizon Sphere */}
          <g transform="translate(95, 65)">
            <circle cx="0" cy="0" r="42" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            {/* Ground hemisphere */}
            <path d="M -42 0 A 42 42 0 0 0 42 0 Z" fill="#78350f" />
            <line x1="-42" y1="0" x2="42" y2="0" stroke="#f8fafc" strokeWidth="2" />
            {/* Pitch ladder */}
            <line x1="-15" y1="-14" x2="15" y2="-14" stroke="#f8fafc" strokeWidth="1.5" />
            <line x1="-8" y1="-26" x2="8" y2="-26" stroke="#f8fafc" strokeWidth="1.5" />
            <line x1="-15" y1="14" x2="15" y2="14" stroke="#f8fafc" strokeWidth="1.5" />
            {/* Center aircraft symbol */}
            <path d="M -18 0 L -8 0 L 0 -5 L 8 0 L 18 0" stroke="#facc15" strokeWidth="2.5" fill="none" />
          </g>
          <g transform="translate(165, 25)">
            <text x="0" y="15" fill="#38bdf8" stroke="none" fontWeight="bold">HORIZONTE ARTIFICIAL</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">CABECEO (+/- GRADOS)</text>
            <text x="0" y="47" fill="#94a3b8" stroke="none">ROSA DE RUMBO GIRATORIA</text>
            <rect x="0" y="58" width="105" height="22" rx="4" fill="#0369a1" stroke="#38bdf8" />
            <text x="12" y="72" fill="#ffffff" stroke="none" fontWeight="bold">BLOQUEAR EJE</text>
          </g>
        </svg>
      );

    // 17. REACTOR_PLASMA (Cámara toroidal/cilíndrica de confinamiento + 3 cursores magnéticos)
    case 'REACTOR_PLASMA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          {/* Toroidal chamber */}
          <g transform="translate(85, 65)">
            <circle cx="0" cy="0" r="38" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
            <circle cx="0" cy="0" r="22" fill="#4338ca" stroke="#c7d2fe" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="10" fill="#a855f7" />
            {/* 4 magnetic coils */}
            <rect x="-42" y="-6" width="8" height="12" fill="#e0e7ff" />
            <rect x="34" y="-6" width="8" height="12" fill="#e0e7ff" />
            <rect x="-6" y="-42" width="12" height="8" fill="#e0e7ff" />
            <rect x="-6" y="34" width="12" height="8" fill="#e0e7ff" />
          </g>
          {/* 3 magnetic sliders */}
          <g transform="translate(160, 25)">
            <text x="0" y="15" fill="#c7d2fe" stroke="none" fontWeight="bold">NÚCLEO DE PLASMA + 3 CURSORES</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">CAMPO MAGNÉTICO (α, β, γ)</text>
            {/* Sliders */}
            <line x1="15" y1="42" x2="15" y2="80" stroke="#475569" strokeWidth="3" />
            <circle cx="15" cy="55" r="5" fill="#818cf8" />
            <line x1="55" y1="42" x2="55" y2="80" stroke="#475569" strokeWidth="3" />
            <circle cx="55" cy="70" r="5" fill="#818cf8" />
            <line x1="95" y1="42" x2="95" y2="80" stroke="#475569" strokeWidth="3" />
            <circle cx="95" cy="48" r="5" fill="#818cf8" />
          </g>
        </svg>
      );

    // 18. FRECUENCIA_RESONANCIA (Ecualizador multibanda de espectro + dial de resonancia)
    case 'FRECUENCIA_RESONANCIA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#fb7185" stroke="none" fontWeight="bold">ANALIZADOR ESPECTRAL MULTIBANDA (EQ)</text>
          {/* Multi-band spectrum bars */}
          <g transform="translate(35, 35)">
            {[30, 55, 75, 45, 85, 60, 40].map((h, i) => (
              <g key={i}>
                <rect x={i * 18} y={60 - h * 0.6} width="12" height={h * 0.6} rx="2" fill="#f43f5e" />
                <rect x={i * 18} y={60 - h * 0.6 - 4} width="12" height="2" fill="#fecdd3" />
              </g>
            ))}
          </g>
          {/* Central tuning dial */}
          <g transform="translate(225, 65)">
            <circle cx="0" cy="0" r="28" fill="#1e293b" stroke="#f43f5e" strokeWidth="2" />
            <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#fda4af" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="0" x2="12" y2="-12" stroke="#ffffff" strokeWidth="2.5" />
            <text x="-16" y="38" fill="#94a3b8" stroke="none">DIAL RES.</text>
          </g>
        </svg>
      );

    // 19. SECUENCIA_CINETICA (Fila de 4 émbolos/pistones neumáticos con recorrido)
    case 'SECUENCIA_CINETICA':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#f59e0b" stroke="none" fontWeight="bold">BANCO DE 4 PISTONES CINÉTICOS</text>
          {/* 4 vertical pistons */}
          {[45, 115, 185, 255].map((cx, i) => {
            const colors = ['#eab308', '#dc2626', '#2563eb', '#16a34a'];
            const heights = [35, 48, 25, 40];
            return (
              <g key={i}>
                {/* Cylinder base */}
                <rect x={cx - 16} y="65" width="32" height="35" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                {/* Piston shaft */}
                <rect x={cx - 8} y={65 - heights[i]} width="16" height={heights[i]} fill="#94a3b8" />
                {/* Piston plunger head */}
                <rect x={cx - 14} y={65 - heights[i] - 10} width="28" height="12" rx="3" fill={colors[i]} stroke="#fef08a" strokeWidth="1" />
                <text x={cx - 5} y="112" fill="#94a3b8" stroke="none">P{i + 1}</text>
              </g>
            );
          })}
        </svg>
      );

    // 20. DIVISOR_VOLTAJE (Puente de Wheatstone con galvanómetro de aguja)
    case 'DIVISOR_VOLTAJE':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#34d399" stroke="none" fontWeight="bold">PUENTE POTENCIOMÉTRICO (GALVANÓMETRO)</text>
          {/* Galvanometer curved meter */}
          <g transform="translate(100, 70)">
            <rect x="-55" y="-35" width="110" height="60" rx="6" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
            <path d="M -40 -5 A 50 50 0 0 1 40 -5" stroke="#34d399" strokeWidth="1.5" fill="none" strokeDasharray="2 3" />
            <line x1="0" y1="-12" x2="0" y2="-2" stroke="#f8fafc" strokeWidth="2" />
            <text x="-48" y="2" fill="#94a3b8" stroke="none" fontSize="7">-50</text>
            <text x="-4" y="-14" fill="#94a3b8" stroke="none" fontSize="7">0</text>
            <text x="35" y="2" fill="#94a3b8" stroke="none" fontSize="7">+50</text>
            {/* Deflection needle */}
            <line x1="0" y1="18" x2="16" y2="-8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="18" r="3" fill="#f8fafc" />
          </g>
          {/* Resistance decade selector */}
          <g transform="translate(180, 35)">
            <text x="0" y="15" fill="#34d399" stroke="none" fontWeight="bold">DIAL DE EQUILIBRIO</text>
            <text x="0" y="32" fill="#94a3b8" stroke="none">RANGO: 0 - 100 Ω</text>
            <rect x="0" y="42" width="105" height="24" rx="4" fill="#047857" stroke="#10b981" />
            <text x="12" y="58" fill="#ffffff" stroke="none" fontWeight="bold">EQUILIBRAR (0 mV)</text>
          </g>
        </svg>
      );

    default:
      return null;
  }
}
