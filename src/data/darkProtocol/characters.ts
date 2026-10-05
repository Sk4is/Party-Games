/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SurvivorCharacter } from '../../types/darkProtocol';

export const SURVIVOR_CHARACTERS: SurvivorCharacter[] = [
  {
    id: 'mara_velasco',
    name: 'Mara Velasco',
    title: 'Técnica de Mantenimiento e Instalaciones',
    quote: 'Conozco el entramado de cables y relés de esta estación mejor que quien la diseñó.',
    role: 'Especialista Eléctrica',
    portraitIcon: '🔧',
    primaryColor: '#f59e0b', // Amber
    secondaryColor: '#78350f',
    passiveTitle: 'Manos Diestras',
    passiveDesc: 'Resuelve cuadros eléctricos y bypasses con mayor velocidad y precisión.',
    strengthTitle: 'Tolerancia a Descargas',
    strengthDesc: 'Los fallos en circuitos eléctricos generan la mitad de penalización y ruido.',
    weaknessTitle: 'Complexión Pesada',
    weaknessDesc: 'Velocidad de carrera reducida un 10% durante persecuciones críticas.',
    stats: {
      speed: 70,
      repairSpeed: 95,
      stealth: 65,
      stamina: 75,
    },
  },
  {
    id: 'hector_gaona',
    name: 'Dr. Héctor Gaona',
    title: 'Investigador Criogénico y Bioseguridad',
    quote: 'El frío preserva la materia, pero lo que hay aquí abajo no obedece a las leyes térmicas.',
    role: 'Físico de Fluidos',
    portraitIcon: '🧪',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#164e63',
    passiveTitle: 'Visión Analítica',
    passiveDesc: 'Su linterna posee un haz un 35% más amplio y revela interactables a mayor distancia.',
    strengthTitle: 'Dominio de Presión',
    strengthDesc: 'La estabilización de válvulas y sistemas de fluidos requiere un 40% menos de tiempo de retención.',
    weaknessTitle: 'Movilidad Torpe',
    weaknessDesc: 'Tarda 1 segundo adicional en introducirse y salir de taquillas o conductos estrechos.',
    stats: {
      speed: 65,
      repairSpeed: 85,
      stealth: 60,
      stamina: 70,
    },
  },
  {
    id: 'valeria_cruz',
    name: 'Valeria Cruz',
    title: 'Supervisora de Seguridad y Contención',
    quote: 'He contenido motines peores con menos luz. Mantén la calma y muévete pegado al muro.',
    role: 'Especialista en Supervivencia',
    portraitIcon: '🛡️',
    primaryColor: '#e11d48', // Rose/Red
    secondaryColor: '#4c0519',
    passiveTitle: 'Paso Sigiloso',
    passiveDesc: 'Produce un 40% menos de ruido al caminar y correr cerca de sensores y cámaras.',
    strengthTitle: 'Resistencia Extrema',
    strengthDesc: 'Puede soportar un impacto físico adicional del Ente antes de caer en estado agónico.',
    weaknessTitle: 'Desconocimiento Técnico',
    weaknessDesc: 'No posee ventajas en la resolución de minijuegos mecánicos o eléctricos.',
    stats: {
      speed: 90,
      repairSpeed: 50,
      stealth: 90,
      stamina: 95,
    },
  },
  {
    id: 'sergio_prada',
    name: 'Sergio Prada',
    title: 'Operador de Enlace y Criptoanálisis',
    quote: 'Las frecuencias nunca mienten. Si hay interferencia estática, el Ente está en el cable.',
    role: 'Técnico de Señales',
    portraitIcon: '📡',
    primaryColor: '#10b981', // Emerald
    secondaryColor: '#064e3b',
    passiveTitle: 'Sintonía Precisa',
    passiveDesc: 'Detecta de forma instantánea el bloqueo de ondas y códigos de descifrado.',
    strengthTitle: 'Alerta Temprana',
    strengthDesc: 'Recibe aviso acústico previo cuando una cámara de su sector entra en interferencia.',
    weaknessTitle: 'Tendencia al Pánico',
    weaknessDesc: 'Su tiempo máximo de ocultación en taquillas es de 11 segundos (en lugar de 15s).',
    stats: {
      speed: 80,
      repairSpeed: 80,
      stealth: 75,
      stamina: 60,
    },
  },
];

export function getCharacterById(id: string): SurvivorCharacter {
  return (
    SURVIVOR_CHARACTERS.find((c) => c.id === id) || SURVIVOR_CHARACTERS[0]
  );
}
