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
          <text x="228" y="39" fill="#34d399" stroke="none" fontSize="8">CANAL A..D</text>
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

    // 5. VALVULAS_PRESION (1 manómetro central + 3 válvulas A, B, C a 0°, 45°, 90°)
    case 'VALVULAS_PRESION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="8" width="300" height="114" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          
          {/* Central System Pressure Gauge */}
          <g transform="translate(160, 36)">
            {/* Gauge dial */}
            <circle cx="0" cy="0" r="24" fill="#020617" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M -18 0 A 18 18 0 0 1 18 0" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3 2" />
            {/* Color bands: green, amber, red */}
            <path d="M -16 6 A 16 16 0 0 1 -6 -14" stroke="#10b981" strokeWidth="2" />
            <path d="M -6 -14 A 16 16 0 0 1 6 -14" stroke="#f59e0b" strokeWidth="2" />
            <path d="M 6 -14 A 16 16 0 0 1 16 6" stroke="#ef4444" strokeWidth="2" />
            {/* Needle pointing to amber */}
            <line x1="0" y1="0" x2="6" y2="-17" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="0" cy="0" r="2.5" fill="#f8fafc" />
            <text x="-28" y="-12" fill="#94a3b8" stroke="none" fontSize="7" fontWeight="bold">PRESIÓN DEL SISTEMA</text>
            <text x="-12" y="16" fill="#f59e0b" stroke="none" fontSize="8" fontWeight="bold">65 PSI</text>
          </g>

          {/* 3 Valves Below: VÁLVULA A, VÁLVULA B, VÁLVULA C */}
          {[65, 160, 255].map((cx, i) => (
            <g key={i}>
              <text x={cx - 24} y="74" fill="#cbd5e1" stroke="none" fontSize="8" fontWeight="bold">
                {['VÁLVULA A', 'VÁLVULA B', 'VÁLVULA C'][i]}
              </text>
              {/* Valve circular rim */}
              <circle cx={cx} cy="94" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
              {/* Valve handle bar showing 0°, 45°, 90° orientation */}
              <line
                x1={cx - (i === 0 ? 0 : i === 1 ? 9 : 12)}
                y1={94 - (i === 0 ? 12 : i === 1 ? 9 : 0)}
                x2={cx + (i === 0 ? 0 : i === 1 ? 9 : 12)}
                y2={94 + (i === 0 ? 12 : i === 1 ? 9 : 0)}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx={cx} cy="94" r="3.5" fill="#0f172a" stroke="#cbd5e1" />
              <text x={cx - 8} y="116" fill="#64748b" stroke="none" fontSize="7">
                {['90°', '45°', '0°'][i]}
              </text>
            </g>
          ))}
          <text x="28" y="20" fill="#f59e0b" stroke="none" fontSize="8" fontWeight="bold">UN MANÓMETRO CENTRAL + 3 VÁLVULAS (0° / 45° / 90°)</text>
        </svg>
      );

    // 6. RELES_HEXADECIMALES (1 pantalla HEX central + 4 interruptores R1..R4)
    case 'RELES_HEXADECIMALES':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="8" width="300" height="114" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          
          {/* Top Banner & Single Hex Register Display */}
          <g transform="translate(160, 24)">
            <text x="-65" y="-3" fill="#c084fc" stroke="none" fontSize="8" fontWeight="bold">REGISTRO HEXADECIMAL ÚNICO</text>
            <rect x="-40" y="3" width="80" height="20" rx="3" fill="#3b0764" stroke="#a855f7" strokeWidth="1.2" />
            <text x="-16" y="17" fill="#f3e8ff" stroke="none" fontSize="13" fontWeight="black" letterSpacing="1">0x3A</text>
          </g>

          {/* 4 Relay Switches: R1, R2, R3, R4 */}
          {[55, 125, 195, 265].map((cx, i) => {
            const isUp = i % 2 === 0;
            return (
              <g key={i}>
                {/* Relay container */}
                <rect x={cx - 24} y="52" width="48" height="58" rx="4" fill="#1e293b" stroke="#7e22ce" strokeWidth="1" />
                <text x={cx - 7} y="64" fill="#d8b4fe" stroke="none" fontWeight="bold" fontSize="9">R{i + 1}</text>
                <text x={cx - 16} y="74" fill="#64748b" stroke="none" fontSize="6.5">Bit {3 - i}</text>
                
                {/* Lever track & knob */}
                <rect x={cx - 7} y="78" width="14" height="22" rx="7" fill="#0f172a" stroke="#64748b" />
                <circle cx={cx} cy={isUp ? 83 : 95} r="4.5" fill={isUp ? '#c084fc' : '#475569'} stroke="#f3e8ff" strokeWidth="0.8" />
                <text x={cx - 12} y="108" fill={isUp ? '#a855f7' : '#64748b'} stroke="none" fontSize="6">
                  {isUp ? '1 (ARR)' : '0 (ABJ)'}
                </text>
              </g>
            );
          })}
          <text x="35" y="120" fill="#64748b" stroke="none" fontSize="7.5">1 REGISTRO HEX • 4 RELÉS BIESTABLES (R1..R4: 1=ARRIBA, 0=ABAJO)</text>
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
          <rect x="22" y="20" width="138" height="42" rx="4" fill="#022c22" stroke="#10b981" strokeWidth="1.5" />
          <text x="28" y="34" fill="#6ee7b7" stroke="none" fontSize="8" fontWeight="bold">Nº SERIE: SEC-527-X4</text>
          <text x="28" y="52" fill="#34d399" stroke="none" fontSize="13" fontWeight="bold">PIN: [ • • • • ]</text>
          
          {/* Aux LED indicator */}
          <circle cx="28" cy="74" r="3.5" fill="#f59e0b" stroke="#fbbf24" strokeWidth="1" />
          <text x="37" y="77" fill="#fbbf24" stroke="none" fontSize="8" fontWeight="bold">LED AUX: ENCENDIDO/APAGADO</text>

          <text x="22" y="96" fill="#94a3b8" stroke="none">TECLADO DE AUTENTICACIÓN</text>
          <text x="22" y="108" fill="#64748b" stroke="none">SERIAL DE LA MÁQUINA</text>
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

    // 13. PUERTOS_CONEXION (Terminales de cables fuente a la izquierda + banco de clavijas jack a la derecha)
    case 'PUERTOS_CONEXION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="25" y="24" fill="#fbbf24" stroke="none" fontWeight="bold">ENRUTAMIENTO // FUENTES Y BANCO DE JACKS</text>
          
          {/* Left Column: Source Terminals (Rojo, Amarillo, Azul, Verde) */}
          <g transform="translate(25, 34)">
            <text x="0" y="0" fill="#94a3b8" stroke="none" fontSize="8" fontWeight="bold">FUENTES</text>
            {[
              { label: 'ROJO', color: '#ef4444', y: 14 },
              { label: 'AMAR.', color: '#eab308', y: 32 },
              { label: 'AZUL', color: '#3b82f6', y: 50 },
              { label: 'VERD.', color: '#22c55e', y: 68 },
            ].map((src, i) => (
              <g key={`src-${i}`}>
                <circle cx="5" cy={src.y} r="5" fill="#1e293b" stroke={src.color} strokeWidth="2" />
                <circle cx="5" cy={src.y} r="2" fill={src.color} />
                <text x="14" y={src.y + 3} fill={src.color} stroke="none" fontSize="7.5" fontWeight="bold">{src.label}</text>
              </g>
            ))}
          </g>

          {/* Right Area: Bank of Destination Jacks (J1..J8 in 2 rows of 4) */}
          <g transform="translate(130, 34)">
            <text x="0" y="0" fill="#94a3b8" stroke="none" fontSize="8" fontWeight="bold">BANCO DE JACKS</text>
            {/* Row 1: J1..J4 */}
            {[0, 1, 2, 3].map((col) => {
              const cx = col * 40 + 15;
              const cy = 22;
              const num = col + 1;
              return (
                <g key={`jack-${num}`}>
                  <circle cx={cx} cy={cy} r="8.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy} r="3" fill="#020617" />
                  <text x={cx - 5} y={cy + 17} fill="#94a3b8" stroke="none" fontSize="7.5">J{num}</text>
                </g>
              );
            })}
            {/* Row 2: J5..J8 */}
            {[0, 1, 2, 3].map((col) => {
              const cx = col * 40 + 15;
              const cy = 54;
              const num = col + 5;
              return (
                <g key={`jack-${num}`}>
                  <circle cx={cx} cy={cy} r="8.5" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy} r="3" fill="#020617" />
                  <text x={cx - 5} y={cy + 17} fill="#94a3b8" stroke="none" fontSize="7.5">J{num}</text>
                </g>
              );
            })}
          </g>

          {/* Physical Patch Cable curves from source terminals into destination jacks */}
          <path d="M 30 48 C 65 48, 105 56, 145 56" stroke="#ef4444" strokeWidth="2.5" fill="none" />
          <path d="M 30 66 C 70 80, 140 90, 185 88" stroke="#eab308" strokeWidth="2.5" fill="none" />
          <path d="M 30 84 C 80 95, 170 65, 225 56" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
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

    // 21. CAMARA_CONTRAPESOS (Balanza horizontal con brazo basculante y 3 pesas)
    case 'CAMARA_CONTRAPESOS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#eab308" stroke="none" fontWeight="bold">BALANCÍN DE CONTRAPESOS (TORQUE = MASA × POSICIÓN)</text>
          {/* Fulcrum central triangle */}
          <polygon points="160,78 152,94 168,94" fill="#64748b" stroke="#94a3b8" strokeWidth="1.2" />
          {/* Pivoted Balance Beam */}
          <line x1="45" y1="78" x2="275" y2="78" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
          {/* Discrete Slot Notches (-3, -2, -1, 0, +1, +2, +3) */}
          {[-3, -2, -1, 0, 1, 2, 3].map((pos) => {
            const x = 160 + pos * 36;
            return (
              <g key={pos}>
                <line x1={x} y1="74" x2={x} y2="82" stroke="#eab308" strokeWidth="1.5" />
                <text x={x - 4} y="70" fill="#94a3b8" stroke="none" fontSize="7">{pos !== 0 ? Math.abs(pos) : '0'}</text>
              </g>
            );
          })}
          {/* Hanging weights example */}
          <rect x="80" y="84" width="16" height="18" rx="2" fill="#d97706" stroke="#fde047" strokeWidth="1" />
          <text x="82" y="96" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">4kg</text>
          <line x1="88" y1="78" x2="88" y2="84" stroke="#eab308" strokeWidth="1" />
          <rect x="224" y="84" width="16" height="22" rx="2" fill="#b45309" stroke="#fde047" strokeWidth="1" />
          <text x="226" y="98" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">6kg</text>
          <line x1="232" y1="78" x2="232" y2="84" stroke="#eab308" strokeWidth="1" />
          {/* Lock Action Button */}
          <rect x="195" y="102" width="105" height="15" rx="3" fill="#854d0e" stroke="#eab308" strokeWidth="1" />
          <text x="202" y="113" fill="#fef08a" stroke="none" fontSize="7.5" fontWeight="bold">BLOQUEAR EQUILIBRIO</text>
        </svg>
      );

    // 22. PRISMA_REFRACCION (Láser incidente + prisma giratorio + 5 sensores)
    case 'PRISMA_REFRACCION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#14b8a6" stroke="none" fontWeight="bold">DISPERSIÓN ÓPTICA // HAZ INCIDENTE Y MATRIZ S-1..S-5</text>
          {/* Left Laser Emitter */}
          <rect x="25" y="55" width="28" height="20" rx="3" fill="#1e293b" stroke="#0d9488" strokeWidth="1.5" />
          <circle cx="53" cy="65" r="3" fill="#14b8a6" />
          {/* Incoming Ray */}
          <line x1="53" y1="65" x2="135" y2="65" stroke="#2dd4bf" strokeWidth="2.5" />
          {/* Rotating Prism Base */}
          <circle cx="145" cy="65" r="26" fill="#0f172a" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
          {/* Triangular Glass Prism */}
          <polygon points="145,43 130,76 160,76" fill="#042f2e" stroke="#5eead4" strokeWidth="2" opacity="0.85" />
          {/* Refracted Exit Ray */}
          <line x1="145" y1="65" x2="242" y2="48" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="4 2" />
          {/* Sensor Arc S1..S5 */}
          {[
            { id: 'S1', x: 245, y: 32 },
            { id: 'S2', x: 248, y: 48 },
            { id: 'S3', x: 245, y: 65 },
            { id: 'S4', x: 248, y: 82 },
            { id: 'S5', x: 245, y: 98 },
          ].map((s, i) => (
            <g key={s.id}>
              <rect x={s.x} y={s.y - 6} width="22" height="12" rx="2" fill={i === 1 ? '#042f2e' : '#1e293b'} stroke={i === 1 ? '#2dd4bf' : '#64748b'} />
              <text x={s.x + 3} y={s.y + 3} fill={i === 1 ? '#5eead4' : '#94a3b8'} stroke="none" fontSize="7" fontWeight="bold">{s.id}</text>
            </g>
          ))}
          {/* Fix Prism Button */}
          <rect x="25" y="98" width="90" height="16" rx="3" fill="#115e59" stroke="#14b8a6" strokeWidth="1" />
          <text x="36" y="110" fill="#f0fdfa" stroke="none" fontSize="8" fontWeight="bold">FIJAR PRISMA</text>
        </svg>
      );

    // 23. CIRCUITO_REFRIGERANTE (3 depósitos térmicos + cámara de mezcla graduada)
    case 'CIRCUITO_REFRIGERANTE':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#f97316" stroke="none" fontWeight="bold">MEZCLA CRIOGÉNICA // FRÍO (AZUL), TEMPLADO, CALIENTE</text>
          {/* 3 Top Reservoirs */}
          {[
            { label: 'FRÍO', color: '#06b6d4', x: 35 },
            { label: 'TEMPL.', color: '#f59e0b', x: 80 },
            { label: 'CAL.', color: '#ef4444', x: 125 },
          ].map((res) => (
            <g key={res.label}>
              <rect x={res.x} y={32} width="35" height="38" rx="4" fill="#1e293b" stroke={res.color} strokeWidth="1.2" />
              <rect x={res.x + 3} y={50} width="29" height="17" fill={res.color} opacity="0.6" />
              <text x={res.x + 4} y={43} fill={res.color} stroke="none" fontSize="7" fontWeight="bold">{res.label}</text>
            </g>
          ))}
          {/* Central Mixing Chamber */}
          <g transform="translate(180, 32)">
            <rect x="0" y="0" width="48" height="68" rx="5" fill="#020617" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="4" y="32" width="40" height="32" rx="2" fill="#0ea5e9" opacity="0.5" />
            {/* Level graduation marks */}
            {[10, 22, 34, 46, 58].map((ly, i) => (
              <line key={i} x1="38" y1={ly} x2="44" y2={ly} stroke="#94a3b8" strokeWidth="1" />
            ))}
            <text x="12" y="80" fill="#94a3b8" stroke="none" fontSize="7">MEZCLA</text>
          </g>
          {/* Temp Readout & Action */}
          <g transform="translate(236, 32)">
            <rect x="0" y="0" width="68" height="26" rx="4" fill="#431407" stroke="#f97316" />
            <text x="6" y="11" fill="#fed7aa" stroke="none" fontSize="6.5">TEMP NÚCLEO</text>
            <text x="6" y="22" fill="#fb923c" stroke="none" fontSize="10" fontWeight="bold">285 °C</text>
            <rect x="0" y="38" width="68" height="26" rx="4" fill="#c2410c" stroke="#f97316" strokeWidth="1" />
            <text x="4" y="54" fill="#ffffff" stroke="none" fontSize="6.5" fontWeight="bold">REFRIGERAR</text>
          </g>
        </svg>
      );

    // 24. ANILLOS_CIFRADO (3 rotores concéntricos con cursor superior)
    case 'ANILLOS_CIFRADO':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#d946ef" stroke="none" fontWeight="bold">ROTORES CONCÉNTRICOS // SÍMBOLOS, LETRAS (A-F) Y CIFRAS (1-6)</text>
          {/* Concentric Rings */}
          <g transform="translate(100, 68)">
            <circle cx="0" cy="0" r="44" stroke="#c026d3" strokeWidth="2.5" fill="#1e1b4b" />
            <circle cx="0" cy="0" r="30" stroke="#a855f7" strokeWidth="2" fill="#2e1065" />
            <circle cx="0" cy="0" r="16" stroke="#e879f9" strokeWidth="1.5" fill="#0f172a" />
            {/* Top Alignment Cursor Hairline */}
            <line x1="0" y1="-50" x2="0" y2="-44" stroke="#f43f5e" strokeWidth="2.5" />
            <polygon points="0,-44 -4,-49 4,-49" fill="#f43f5e" />
            {/* Sample characters at top */}
            <text x="-4" y="-33" fill="#f5d0fe" stroke="none" fontSize="8" fontWeight="bold">⌬</text>
            <text x="-3" y="-19" fill="#f5d0fe" stroke="none" fontSize="8" fontWeight="bold">B</text>
            <text x="-2" y="-6" fill="#f5d0fe" stroke="none" fontSize="8" fontWeight="bold">3</text>
          </g>
          {/* Rotor Description and Action */}
          <g transform="translate(170, 35)">
            <text x="0" y="12" fill="#e879f9" stroke="none" fontWeight="bold">ALINEACIÓN DE MIRA</text>
            <text x="0" y="26" fill="#94a3b8" stroke="none" fontSize="7.5">EXTERIOR: GLIFO // MEDIO: LETRA</text>
            <text x="0" y="38" fill="#94a3b8" stroke="none" fontSize="7.5">INTERIOR: DÍGITO (1-6)</text>
            <rect x="0" y="48" width="120" height="20" rx="4" fill="#a21caf" stroke="#e879f9" strokeWidth="1" />
            <text x="14" y="61" fill="#ffffff" stroke="none" fontSize="8" fontWeight="bold">BLOQUEAR ANILLOS</text>
          </g>
        </svg>
      );

    // 25. MASAS_MAGNETICAS (Placa metálica 3x3 con núcleo y polos N / S)
    case 'MASAS_MAGNETICAS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#8b5cf6" stroke="none" fontWeight="bold">MATRIZ FERROMAGNÉTICA 3x3 // POLOS [N] (ROJO) Y [S] (AZUL)</text>
          {/* 3x3 Metallic Grid */}
          <g transform="translate(45, 34)">
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const isCenter = r === 1 && c === 1;
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={c * 26}
                    y={r * 26}
                    width="23"
                    height="23"
                    rx="3"
                    fill={isCenter ? '#312e81' : '#1e293b'}
                    stroke={isCenter ? '#818cf8' : '#475569'}
                    strokeWidth="1.2"
                  />
                );
              })
            )}
            {/* Center Core Coil Icon */}
            <circle cx="37" cy="37" r="6" fill="#6366f1" />
            <text x="34" y="40" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">⚡</text>
            {/* Sample placed N and S tokens */}
            <circle cx="11" cy="11" r="7" fill="#dc2626" stroke="#f87171" />
            <text x="8" y="14" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">N</text>
            <circle cx="63" cy="11" r="7" fill="#dc2626" stroke="#f87171" />
            <text x="60" y="14" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">N</text>
            <circle cx="11" cy="63" r="7" fill="#2563eb" stroke="#60a5fa" />
            <text x="9" y="66" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">S</text>
            <circle cx="63" cy="63" r="7" fill="#2563eb" stroke="#60a5fa" />
            <text x="61" y="66" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">S</text>
          </g>
          {/* Side Token Rack & Action */}
          <g transform="translate(150, 35)">
            <text x="0" y="12" fill="#c4b5fd" stroke="none" fontWeight="bold">CONFINAMIENTO DIPOLAR</text>
            <text x="0" y="26" fill="#94a3b8" stroke="none" fontSize="7.5">SIN ADYACENCIA N-N NI S-S</text>
            <text x="0" y="38" fill="#94a3b8" stroke="none" fontSize="7.5">PAR: EN CRUZ // IMPAR: VÉRTICES</text>
            <rect x="0" y="48" width="135" height="20" rx="4" fill="#5b21b6" stroke="#8b5cf6" strokeWidth="1" />
            <text x="14" y="61" fill="#ffffff" stroke="none" fontSize="8" fontWeight="bold">ESTABILIZAR CAMPO</text>
          </g>
        </svg>
      );

    // 26. PRESION_PISTON (Cilindro neumático con 3 muescas y manómetro)
    case 'PRESION_PISTON':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#0ea5e9" stroke="none" fontWeight="bold">CÁMARA NEUMÁTICA // ÉMBOLO Y 3 MUESCAS DE ENCLAVAMIENTO</text>
          {/* Horizontal/Vertical cylinder */}
          <g transform="translate(50, 32)">
            <rect x="0" y="0" width="34" height="74" rx="4" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Piston head & T-handle */}
            <rect x="5" y="30" width="24" height="8" rx="2" fill="#0284c7" stroke="#bae6fd" />
            <line x1="17" y1="0" x2="17" y2="30" stroke="#94a3b8" strokeWidth="3" />
            <line x1="7" y1="0" x2="27" y2="0" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
            {/* 3 Notches markings */}
            {[
              { id: '1', y: 15, label: 'ALTA (20 PSI)' },
              { id: '2', y: 35, label: 'MEDIA (50 PSI)' },
              { id: '3', y: 55, label: 'BAJA (85 PSI)' },
            ].map((n) => (
              <g key={n.id}>
                <line x1="34" y1={n.y} x2="40" y2={n.y} stroke="#f59e0b" strokeWidth="2" />
                <circle cx="43" cy={n.y} r="2" fill="#f59e0b" />
              </g>
            ))}
          </g>
          {/* Pressure Gauge */}
          <g transform="translate(130, 45)">
            <circle cx="20" cy="20" r="18" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1.2" />
            <line x1="20" y1="20" x2="28" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="20" r="2.5" fill="#ffffff" />
            <text x="7" y="46" fill="#94a3b8" stroke="none" fontSize="7">MANÓMETRO</text>
          </g>
          {/* Cylinder Type & Action */}
          <g transform="translate(195, 34)">
            <rect x="0" y="0" width="100" height="24" rx="4" fill="#082f49" stroke="#0284c7" />
            <text x="8" y="10" fill="#7dd3fc" stroke="none" fontSize="6.5">TIPO DE CILINDRO</text>
            <text x="8" y="20" fill="#ffffff" stroke="none" fontSize="8" fontWeight="bold">ALFA / BETA / GAMMA</text>
            <rect x="0" y="44" width="100" height="24" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
            <text x="8" y="59" fill="#ffffff" stroke="none" fontSize="7.5" fontWeight="bold">BLOQUEAR PISTÓN</text>
          </g>
        </svg>
      );

    // 27. GIROSCOPIO_ESTABILIZACION (3 anillos concéntricos ortogonales X, Y, Z)
    case 'GIROSCOPIO_ESTABILIZACION':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#06b6d4" stroke="none" fontWeight="bold">PLATAFORMA GIROSCÓPICA // 3 EJES (X: ROLL, Y: PITCH, Z: YAW)</text>
          {/* Nested 3 Gimbal Rings */}
          <g transform="translate(90, 68)">
            {/* Ring X (Outer - Red) */}
            <circle cx="0" cy="0" r="44" stroke="#ef4444" strokeWidth="2" strokeDasharray="10 3" />
            {/* Ring Y (Middle - Green) */}
            <circle cx="0" cy="0" r="31" stroke="#22c55e" strokeWidth="2" strokeDasharray="8 3" />
            {/* Ring Z (Inner - Blue) */}
            <circle cx="0" cy="0" r="18" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 2" />
            {/* Central spinning brass rotor */}
            <circle cx="0" cy="0" r="8" fill="#eab308" stroke="#ca8a04" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          </g>
          {/* Axis controls description & Action */}
          <g transform="translate(160, 32)">
            <text x="0" y="12" fill="#67e8f9" stroke="none" fontWeight="bold">ALINEACIÓN TRIAXIAL</text>
            <text x="0" y="26" fill="#f87171" stroke="none" fontSize="7.5">EJE X: 0° / 90° / 180° / 270°</text>
            <text x="0" y="38" fill="#4ade80" stroke="none" fontSize="7.5">EJE Y: 0° / 90° / 180° / 270°</text>
            <text x="0" y="50" fill="#60a5fa" stroke="none" fontSize="7.5">EJE Z: 0° / 90° / 180° / 270°</text>
            <rect x="0" y="58" width="130" height="20" rx="4" fill="#0e7490" stroke="#22d3ee" strokeWidth="1" />
            <text x="32" y="71" fill="#ffffff" stroke="none" fontSize="8" fontWeight="bold">ESTABILIZAR</text>
          </g>
        </svg>
      );

    // 28. CAMARA_CARTUCHOS (4 ranuras de cartuchos con materiales y troqueles)
    case 'CAMARA_CARTUCHOS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#eab308" stroke="none" fontWeight="bold">BAHÍA DE 4 CARTUCHOS // MATERIALES (COBRE, ACERO...) Y FORMAS</text>
          {/* 4 Cartridge Slots (1..4) */}
          {[
            { num: 1, mat: 'COBRE', sym: '▲', color: '#ea580c' },
            { num: 2, mat: 'CERÁM.', sym: '●', color: '#e2e8f0' },
            { num: 3, mat: 'ACERO', sym: '◆', color: '#94a3b8' },
            { num: 4, mat: 'TITANIO', sym: '■', color: '#facc15' },
          ].map((c, i) => {
            const x = 30 + i * 50;
            return (
              <g key={c.num}>
                {/* Slot rail */}
                <rect x={x} y="32" width="40" height="58" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                {/* Cartridge body */}
                <rect x={x + 4} y="38" width="32" height="38" rx="3" fill="#0f172a" stroke={c.color} strokeWidth="1.5" />
                <text x={x + 15} y="55" fill={c.color} stroke="none" fontSize="11">{c.sym}</text>
                <text x={x + 7} y="68" fill="#94a3b8" stroke="none" fontSize="6">{c.mat}</text>
                <text x={x + 16} y="82" fill="#64748b" stroke="none" fontSize="7">#{c.num}</text>
              </g>
            );
          })}
          {/* Seal Chamber Action */}
          <rect x="235" y="44" width="70" height="42" rx="4" fill="#854d0e" stroke="#facc15" strokeWidth="1.2" />
          <text x="242" y="62" fill="#fef08a" stroke="none" fontSize="7" fontWeight="bold">SELLAR</text>
          <text x="242" y="74" fill="#fef08a" stroke="none" fontSize="7" fontWeight="bold">CÁMARA</text>
        </svg>
      );

    // 29. FLUJO_GRAVITACIONAL (Laberinto gravitacional con 3 válvulas y 3 depósitos)
    case 'FLUJO_GRAVITACIONAL':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#6366f1" stroke="none" fontWeight="bold">LABERINTO GRAVITACIONAL // ESFERAS (ROJA, AZUL) Y VÁLVULAS</text>
          {/* Top entry chute with 2 spheres */}
          <g transform="translate(100, 30)">
            <rect x="-20" y="0" width="40" height="12" rx="2" fill="#1e293b" stroke="#6366f1" />
            <circle cx="-6" cy="6" r="4" fill="#ef4444" />
            <circle cx="6" cy="6" r="4" fill="#3b82f6" />
          </g>
          {/* 3 Junction Diverter Valves */}
          <g transform="translate(100, 52)">
            {/* Valve 1 (Top) */}
            <circle cx="0" cy="0" r="9" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#f8fafc" strokeWidth="2" />
            {/* Valve 2 (Left) */}
            <circle cx="-35" cy="22" r="9" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="-41" y1="22" x2="-29" y2="22" stroke="#f8fafc" strokeWidth="2" />
            {/* Valve 3 (Right) */}
            <circle cx="35" cy="22" r="9" fill="#1e293b" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="29" y1="22" x2="41" y2="22" stroke="#f8fafc" strokeWidth="2" />
          </g>
          {/* Bottom Reservoirs A, B, C */}
          {[
            { id: 'A', x: 50 },
            { id: 'B', x: 100 },
            { id: 'C', x: 150 },
          ].map((dep) => (
            <g key={dep.id}>
              <rect x={dep.x - 12} y="92" width="24" height="18" rx="2" fill="#0f172a" stroke="#818cf8" strokeWidth="1.2" />
              <text x={dep.x - 3} y="104" fill="#c7d2fe" stroke="none" fontSize="8" fontWeight="bold">{dep.id}</text>
            </g>
          ))}
          {/* Release Trigger */}
          <g transform="translate(205, 45)">
            <rect x="0" y="0" width="95" height="42" rx="4" fill="#3730a3" stroke="#818cf8" strokeWidth="1.5" />
            <text x="24" y="24" fill="#ffffff" stroke="none" fontSize="10" fontWeight="bold">LIBERAR</text>
            <text x="14" y="35" fill="#c7d2fe" stroke="none" fontSize="7">CAÍDA GRAVITATORIA</text>
          </g>
        </svg>
      );

    // 30. PLACAS_SUPERPUESTAS (3 placas con lumbreras retroiluminadas y cerrojo)
    case 'PLACAS_SUPERPUESTAS':
      return (
        <svg viewBox="0 0 320 130" className="w-full max-w-xs h-32 stroke-slate-300 fill-none font-mono text-[9px]">
          <rect x="10" y="10" width="300" height="110" rx="6" stroke="#475569" strokeWidth="1.5" fill="#0f172a" />
          <text x="22" y="23" fill="#84cc16" stroke="none" fontWeight="bold">CERRADURA DE PLACAS // 3 CAPAS DESLIZANTES Y SILUETA ÓPTICA</text>
          {/* Central Backlit Aperture Viewer */}
          <g transform="translate(65, 40)">
            <rect x="0" y="0" width="70" height="60" rx="4" fill="#1e293b" stroke="#84cc16" strokeWidth="1.5" />
            <rect x="8" y="8" width="54" height="44" fill="#020617" />
            {/* Resulting Silhouette Pattern */}
            <path d="M 20 16 L 38 16 L 38 46 L 20 46 Z" fill="#65a30d" opacity="0.8" />
            <circle cx="48" cy="30" r="6" fill="#a3e635" />
            <text x="12" y="66" fill="#94a3b8" stroke="none" fontSize="6.5">SILUETA COMBINADA</text>
          </g>
          {/* 3 Slider Tracks (Placa 1, 2, 3) */}
          <g transform="translate(155, 34)">
            {['P-1 (FRONT)', 'P-2 (MED)', 'P-3 (TRAS)'].map((p, i) => (
              <g key={p}>
                <text x="0" y={i * 22 + 9} fill="#bef264" stroke="none" fontSize="7" fontWeight="bold">{p}</text>
                <rect x="52" y={i * 22 + 2} width="45" height="10" rx="3" fill="#020617" stroke="#475569" />
                <rect x={52 + (i === 0 ? 5 : i === 1 ? 18 : 32)} y={i * 22} width="9" height="14" rx="2" fill="#84cc16" stroke="#ecfccb" />
              </g>
            ))}
          </g>
          {/* Enclavar Action */}
          <rect x="255" y="44" width="50" height="48" rx="4" fill="#3f6212" stroke="#84cc16" strokeWidth="1.2" />
          <text x="260" y="64" fill="#ffffff" stroke="none" fontSize="7" fontWeight="bold">ENCLAVAR</text>
          <text x="263" y="76" fill="#ecfccb" stroke="none" fontSize="6.5">PLACAS</text>
        </svg>
      );

    default:
      return null;
  }
}
