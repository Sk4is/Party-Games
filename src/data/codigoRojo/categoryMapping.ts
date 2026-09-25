import { CodigoRojoCategory, CodigoRojoModuleType } from '../../types/codigoRojo';

export const ALL_CATEGORIES: CodigoRojoCategory[] = [
  'ELECTRICIDAD',
  'CONTROL',
  'SEÑAL',
  'NAVEGACIÓN',
  'ENERGÍA',
  'SISTEMAS',
  'COMUNICACIONES',
];

export const MODULE_CATEGORY_MAP: Record<CodigoRojoModuleType, CodigoRojoCategory> = {
  // ELECTRICIDAD (4 familias)
  FILAMENTOS: 'ELECTRICIDAD',
  PUERTOS_CONEXION: 'ELECTRICIDAD',
  DIVISOR_VOLTAJE: 'ELECTRICIDAD',
  RELES_HEXADECIMALES: 'ELECTRICIDAD',

  // CONTROL (3 familias)
  MATRIZ_ENERGIA: 'CONTROL',
  PALANCA_SOBRECARGA: 'CONTROL',
  SECUENCIA_CINETICA: 'CONTROL',

  // SEÑAL (2 familias)
  MODULADOR_FRECUENCIA: 'SEÑAL',
  FRECUENCIA_RESONANCIA: 'SEÑAL',

  // NAVEGACIÓN (2 familias)
  RADAR_VECTORIAL: 'NAVEGACIÓN',
  CALIBRADOR_GIROSCOPIO: 'NAVEGACIÓN',

  // ENERGÍA (4 familias)
  VALVULAS_PRESION: 'ENERGÍA',
  REFRIGERANTE_QUIMICO: 'ENERGÍA',
  DISIPADOR_TERMICO: 'ENERGÍA',
  REACTOR_PLASMA: 'ENERGÍA',

  // SISTEMAS (3 familias)
  GLIFOS_CRIPTOGRAFICOS: 'SISTEMAS',
  COMPUERTAS_LOGICAS: 'SISTEMAS',
  SINCRONIZADOR_FASES: 'SISTEMAS',

  // COMUNICACIONES (2 familias)
  TECLADO_MAESTRO: 'COMUNICACIONES',
  SEÑAL_OPTICA: 'COMUNICACIONES',
};

export const CATEGORY_META: Record<
  CodigoRojoCategory,
  {
    title: string;
    description: string;
    accentColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
  }
> = {
  ELECTRICIDAD: {
    title: 'Electricidad',
    description: 'Filamentos conductores, terminales de parcheo, puentes de aguja y relés de conmutación.',
    accentColor: '#3b82f6',
    badgeBg: 'bg-blue-950/70',
    badgeBorder: 'border-blue-500/50',
    badgeText: 'text-blue-300',
  },
  CONTROL: {
    title: 'Control',
    description: 'Pulsadores en retícula, conmutadores de palanca reforzada y émbolos cinéticos.',
    accentColor: '#f59e0b',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-500/50',
    badgeText: 'text-amber-300',
  },
  SEÑAL: {
    title: 'Señal',
    description: 'Monitores de forma de onda senoidal/cuadrada y ecualizadores multibanda acústicos.',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/50',
    badgeText: 'text-emerald-300',
  },
  NAVEGACIÓN: {
    title: 'Navegación',
    description: 'Radares de barrido circular polar y plataformas giroscópicas de horizonte artificial.',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-500/50',
    badgeText: 'text-cyan-300',
  },
  ENERGÍA: {
    title: 'Energía',
    description: 'Manómetros de presión neumática, refrigerante criogénico, disipadores y reactores de plasma.',
    accentColor: '#ef4444',
    badgeBg: 'bg-red-950/70',
    badgeBorder: 'border-red-500/50',
    badgeText: 'text-red-300',
  },
  SISTEMAS: {
    title: 'Sistemas',
    description: 'Cuadrantes de glifos simbólicos, compuertas lógicas integradas y anillos de fase rotativos.',
    accentColor: '#a855f7',
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-500/50',
    badgeText: 'text-purple-300',
  },
  COMUNICACIONES: {
    title: 'Comunicaciones',
    description: 'Terminales con teclado numérico matricial y emisores de impulsos ópticos estroboscópicos.',
    accentColor: '#ec4899',
    badgeBg: 'bg-pink-950/70',
    badgeBorder: 'border-pink-500/50',
    badgeText: 'text-pink-300',
  },
};

export function getModuleCategory(type: CodigoRojoModuleType): CodigoRojoCategory {
  return MODULE_CATEGORY_MAP[type] || 'SISTEMAS';
}
