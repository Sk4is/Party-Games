export type GameSlug = 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta';

export interface GameTheme {
  slug: GameSlug;
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  glowHover: string;
  // Border colors
  borderClass: string;
  hoverBorderClass: string;
  // Text colors
  textClass: string;
  hoverTextClass: string;
  // Background & button styles
  bgClass: string;
  buttonClass: string;
  buttonActiveTab: string;
  // Card elements
  iconBg: string;
  cardGlow: string;
  cardBorder: string;
  // How to play title
  howToPlayTitleClass: string;
  // Selected option in controls
  selectedOptionClass: string;
}

export const GAME_THEMES: Record<GameSlug, GameTheme> = {
  'la-bomba': {
    slug: 'la-bomba',
    name: 'La Bomba',
    primary: '#FFB000',
    secondary: '#FF8A00',
    glow: 'rgba(255, 176, 0, 0.20)',
    glowHover: 'rgba(255, 176, 0, 0.35)',
    borderClass: 'border-[#FFB000]/80',
    hoverBorderClass: 'hover:border-[#FFB000]',
    textClass: 'text-[#FFB000]',
    hoverTextClass: 'hover:text-[#FFB000]',
    bgClass: 'bg-[#FFB000]',
    buttonClass: 'bg-[#FFB000] hover:bg-[#FF8A00] text-stone-950 shadow-lg shadow-[#FFB000]/25',
    buttonActiveTab: 'bg-[#FFB000] text-stone-950 shadow-md',
    iconBg: 'bg-gradient-to-br from-[#FFB000] to-[#FF8A00]',
    cardGlow: 'shadow-[0_0_30px_rgba(255,176,0,0.18)]',
    cardBorder: 'border-2 border-[#FFB000]/80 hover:border-[#FFB000]',
    howToPlayTitleClass: 'text-[#FFB000]',
    selectedOptionClass: 'bg-[#FFB000] text-stone-950 shadow-md font-black scale-[1.02]',
  },
  'la-peor-respuesta': {
    slug: 'la-peor-respuesta',
    name: 'La Peor Respuesta',
    primary: '#FF3B4F',
    secondary: '#E6293D',
    glow: 'rgba(255, 59, 79, 0.18)',
    glowHover: 'rgba(255, 59, 79, 0.32)',
    borderClass: 'border-[#FF3B4F]/80',
    hoverBorderClass: 'hover:border-[#FF3B4F]',
    textClass: 'text-[#FF3B4F]',
    hoverTextClass: 'hover:text-[#FF3B4F]',
    bgClass: 'bg-[#FF3B4F]',
    buttonClass: 'bg-[#FF3B4F] hover:bg-[#E6293D] text-white shadow-lg shadow-[#FF3B4F]/25',
    buttonActiveTab: 'bg-[#FF3B4F] text-white shadow-md',
    iconBg: 'bg-gradient-to-br from-[#FF3B4F] to-[#E6293D]',
    cardGlow: 'shadow-[0_0_30px_rgba(255,59,79,0.18)]',
    cardBorder: 'border-2 border-[#FF3B4F]/80 hover:border-[#FF3B4F]',
    howToPlayTitleClass: 'text-[#FF3B4F]',
    selectedOptionClass: 'bg-[#FF3B4F] text-white shadow-md font-black scale-[1.02]',
  },
  'pinturillo': {
    slug: 'pinturillo',
    name: 'Pinturillo',
    primary: '#00BCEB',
    secondary: '#009ED0',
    glow: 'rgba(0, 188, 235, 0.18)',
    glowHover: 'rgba(0, 188, 235, 0.32)',
    borderClass: 'border-[#00BCEB]/80',
    hoverBorderClass: 'hover:border-[#00BCEB]',
    textClass: 'text-[#00BCEB]',
    hoverTextClass: 'hover:text-[#00BCEB]',
    bgClass: 'bg-[#00BCEB]',
    buttonClass: 'bg-[#00BCEB] hover:bg-[#009ED0] text-slate-950 shadow-lg shadow-[#00BCEB]/25',
    buttonActiveTab: 'bg-[#00BCEB] text-slate-950 shadow-md',
    iconBg: 'bg-gradient-to-br from-[#00BCEB] to-[#009ED0]',
    cardGlow: 'shadow-[0_0_30px_rgba(0,188,235,0.18)]',
    cardBorder: 'border-2 border-[#00BCEB]/80 hover:border-[#00BCEB]',
    howToPlayTitleClass: 'text-[#00BCEB]',
    selectedOptionClass: 'bg-[#00BCEB] text-slate-950 shadow-md font-black scale-[1.02]',
  },
  'palabra-secreta': {
    slug: 'palabra-secreta',
    name: 'Palabra Secreta',
    primary: '#10B981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.18)',
    glowHover: 'rgba(16, 185, 129, 0.32)',
    borderClass: 'border-[#10B981]/80',
    hoverBorderClass: 'hover:border-[#10B981]',
    textClass: 'text-[#10B981]',
    hoverTextClass: 'hover:text-[#10B981]',
    bgClass: 'bg-[#10B981]',
    buttonClass: 'bg-[#10B981] hover:bg-[#059669] text-slate-950 shadow-lg shadow-[#10B981]/25',
    buttonActiveTab: 'bg-[#10B981] text-slate-950 shadow-md',
    iconBg: 'bg-gradient-to-br from-[#10B981] to-[#059669]',
    cardGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.18)]',
    cardBorder: 'border-2 border-[#10B981]/80 hover:border-[#10B981]',
    howToPlayTitleClass: 'text-[#10B981]',
    selectedOptionClass: 'bg-[#10B981] text-slate-950 shadow-md font-black scale-[1.02]',
  },
};
