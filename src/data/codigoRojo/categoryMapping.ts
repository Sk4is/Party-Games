import { CodigoRojoCategory, CodigoRojoModuleType } from '../../types/codigoRojo';

export const ALL_CATEGORIES: CodigoRojoCategory[] = [
  'ELECTRICIDAD',
  'CONTROL',
  'SEÑAL',
  'NAVEGACIÓN',
  'MECÁNICA',
  'ÓPTICA',
  'TÉRMICO',
  'NEUMÁTICA',
  'FLUIDOS',
  'SEGURIDAD',
  'CRIPTOGRAFÍA',
  'CAMPO',
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

  // NAVEGACIÓN (3 familias)
  RADAR_VECTORIAL: 'NAVEGACIÓN',
  CALIBRADOR_GIROSCOPIO: 'NAVEGACIÓN',
  GIROSCOPIO_ESTABILIZACION: 'NAVEGACIÓN',

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

  // 10 NUEVAS FAMILIAS
  CAMARA_CONTRAPESOS: 'MECÁNICA',
  PRISMA_REFRACCION: 'ÓPTICA',
  CIRCUITO_REFRIGERANTE: 'TÉRMICO',
  ANILLOS_CIFRADO: 'CRIPTOGRAFÍA',
  MASAS_MAGNETICAS: 'CAMPO',
  PRESION_PISTON: 'NEUMÁTICA',
  CAMARA_CARTUCHOS: 'MECÁNICA',
  FLUJO_GRAVITACIONAL: 'FLUIDOS',
  PLACAS_SUPERPUESTAS: 'SEGURIDAD',
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
    description: 'Radares de barrido circular polar, plataformas de horizonte y giroscopios de 3 ejes.',
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
  MECÁNICA: {
    title: 'Mecánica',
    description: 'Balanza de contrapesos de par físico y tambor cilíndrico de cartuchos de aleación.',
    accentColor: '#eab308',
    badgeBg: 'bg-yellow-950/70',
    badgeBorder: 'border-yellow-500/50',
    badgeText: 'text-yellow-300',
  },
  ÓPTICA: {
    title: 'Óptica',
    description: 'Prisma de difracción angular rotativo y direccionamiento de haz láser sobre sensores.',
    accentColor: '#14b8a6',
    badgeBg: 'bg-teal-950/70',
    badgeBorder: 'border-teal-500/50',
    badgeText: 'text-teal-300',
  },
  TÉRMICO: {
    title: 'Térmico',
    description: 'Circuito cerrado de fluidos caloportadores, cámaras de mezcla e intercambio térmico.',
    accentColor: '#f97316',
    badgeBg: 'bg-orange-950/70',
    badgeBorder: 'border-orange-500/50',
    badgeText: 'text-orange-300',
  },
  NEUMÁTICA: {
    title: 'Neumática',
    description: 'Cámara de compresión con pistón de tracción manual y enclavamiento mecánico de muescas.',
    accentColor: '#0ea5e9',
    badgeBg: 'bg-sky-950/70',
    badgeBorder: 'border-sky-500/50',
    badgeText: 'text-sky-300',
  },
  FLUIDOS: {
    title: 'Fluidos',
    description: 'Laberinto gravitacional con válvulas orientables de derivación y depósitos de decantación.',
    accentColor: '#6366f1',
    badgeBg: 'bg-indigo-950/70',
    badgeBorder: 'border-indigo-500/50',
    badgeText: 'text-indigo-300',
  },
  SEGURIDAD: {
    title: 'Seguridad',
    description: 'Cerradura de placas de acero troqueladas superpuestas y cerrojos perimetrales de bloqueo.',
    accentColor: '#84cc16',
    badgeBg: 'bg-lime-950/70',
    badgeBorder: 'border-lime-500/50',
    badgeText: 'text-lime-300',
  },
  CRIPTOGRAFÍA: {
    title: 'Criptografía',
    description: 'Rotores mecánicos concéntricos de cifrado con retenes táctiles y cursor de alineación.',
    accentColor: '#d946ef',
    badgeBg: 'bg-fuchsia-950/70',
    badgeBorder: 'border-fuchsia-500/50',
    badgeText: 'text-fuchsia-300',
  },
  CAMPO: {
    title: 'Campo',
    description: 'Matriz ferromagnética de polaridad dipolar con restricción de flujo y núcleo central.',
    accentColor: '#8b5cf6',
    badgeBg: 'bg-violet-950/70',
    badgeBorder: 'border-violet-500/50',
    badgeText: 'text-violet-300',
  },
};

export function getModuleCategory(type: CodigoRojoModuleType): CodigoRojoCategory {
  return MODULE_CATEGORY_MAP[type] || 'SISTEMAS';
}
