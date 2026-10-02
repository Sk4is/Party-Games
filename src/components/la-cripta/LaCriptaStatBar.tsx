import React, { useEffect, useState } from 'react';
import { CriptaCharacterStats } from '../../types/laCripta';

export type CriptaPrimaryStatLabel =
  | 'VIDA'
  | 'ATAQUE'
  | 'DEFENSA'
  | 'MAGIA'
  | 'AGILIDAD'
  | 'PRECISIÓN'
  | 'VOLUNTAD';

const STAT_DESCRIPTIONS: Record<CriptaPrimaryStatLabel, string> = {
  VIDA: 'Salud máxima y capacidad de supervivencia ante golpes letales.',
  ATAQUE: 'Potencia de armas cuerpo a cuerpo, impacto físico y ruptura de defensas.',
  DEFENSA: 'Mitigación de daño físico entrante y eficacia de Guardia de Hierro.',
  MAGIA: 'Poder de conjuros arcanos, fórmulas alquímicas, himnos y drenaje sombrío.',
  AGILIDAD: 'Prioridad de turno en combate, probabilidad de Esquiva y velocidad en trampas.',
  PRECISIÓN: 'Probabilidad de Golpe Crítico, multiplicador crítico y perforación de armadura.',
  VOLUNTAD: 'Resistencia a estados negativos, potencia de curación/escudos y eficacia de maldiciones.',
};

export type CriptaStatKey =
  | 'health'
  | 'attack'
  | 'defense'
  | 'magic'
  | 'agility'
  | 'precision'
  | 'willpower';

const STAT_KEY_META: Record<
  CriptaStatKey,
  { label: CriptaPrimaryStatLabel; color: string }
> = {
  health: { label: 'VIDA', color: '#C93B5B' },
  attack: { label: 'ATAQUE', color: '#E7A54A' },
  defense: { label: 'DEFENSA', color: '#69A8A5' },
  magic: { label: 'MAGIA', color: '#9B72CF' },
  agility: { label: 'AGILIDAD', color: '#5EA87A' },
  precision: { label: 'PRECISIÓN', color: '#FFD166' },
  willpower: { label: 'VOLUNTAD', color: '#7BDFF2' },
};

interface LaCriptaStatRowProps {
  label: CriptaPrimaryStatLabel;
  value: number;
  max?: number;
  activeColor: string;
  triggerKey: string;
  compact?: boolean;
  tooltip?: string;
}

const TOTAL_SEGMENTS = 10;

export const LaCriptaStatRow: React.FC<LaCriptaStatRowProps> = ({
  label,
  value,
  max = TOTAL_SEGMENTS,
  activeColor,
  triggerKey,
  compact = false,
  tooltip,
}) => {
  const totalSegs = Math.max(1, max);
  const clampedValue = Math.max(0, Math.min(totalSegs, Math.round(value)));
  const displayNumeric = Math.max(0, Math.round(value));
  const [revealedCount, setRevealedCount] = useState(clampedValue);

  useEffect(() => {
    setRevealedCount(0);
    const timer = setTimeout(() => {
      setRevealedCount(clampedValue);
    }, 20);
    return () => clearTimeout(timer);
  }, [triggerKey, clampedValue]);

  return (
    <div
      className="flex items-center justify-between gap-2 cursor-help"
      title={
        tooltip || `${label} (${displayNumeric}/${totalSegs}): ${STAT_DESCRIPTIONS[label]}`
      }
    >
      <span
        className={`font-cripta-pixel uppercase tracking-wider text-[#D8C6A0] shrink-0 ${
          compact ? 'text-[9px] w-16' : 'text-[10px] sm:text-xs w-20'
        }`}
      >
        {label}
      </span>

      <div
        className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-end"
        aria-label={`${label}: ${displayNumeric} de ${totalSegs}`}
      >
        {Array.from({ length: totalSegs }).map((_, idx) => {
          const isLit = idx < revealedCount;
          return (
            <span
              key={idx}
              style={{
                transitionDelay: isLit ? `${idx * 18}ms` : '0ms',
                backgroundColor: isLit ? activeColor : '#0B0A0E',
                borderColor: isLit ? '#FFF8E7' : '#282039',
                boxShadow: isLit ? `0 0 5px ${activeColor}66` : 'none',
              }}
              className={`inline-block border transition-colors duration-150 ${
                compact ? 'w-2 h-2 sm:w-2.5 sm:h-2.5' : 'w-2.5 h-2.5 sm:w-3 sm:h-3'
              }`}
            />
          );
        })}
      </div>

      <span
        className={`font-cripta-mono font-bold text-right shrink-0 ${
          compact ? 'text-[9px] w-5' : 'text-[10px] w-6'
        }`}
        style={{ color: activeColor }}
      >
        {displayNumeric}
      </span>
    </div>
  );
};

export interface LaCriptaStatSegmentsProps {
  stat: CriptaStatKey;
  value: number;
  max?: number;
  triggerKey?: string;
  compact?: boolean;
  tooltip?: string;
}

export const LaCriptaStatSegments: React.FC<LaCriptaStatSegmentsProps> = ({
  stat,
  value,
  max = 10,
  triggerKey = 'inspect',
  compact = false,
  tooltip,
}) => {
  const meta = STAT_KEY_META[stat] || STAT_KEY_META.attack;
  return (
    <LaCriptaStatRow
      label={meta.label}
      value={value}
      max={max}
      activeColor={meta.color}
      triggerKey={triggerKey}
      compact={compact}
      tooltip={tooltip}
    />
  );
};

interface LaCriptaStatBlockProps {
  stats: CriptaCharacterStats;
  triggerKey: string;
  compact?: boolean;
}

export const LaCriptaStatBlock: React.FC<LaCriptaStatBlockProps> = ({
  stats,
  triggerKey,
  compact = false,
}) => {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <LaCriptaStatRow
        label="VIDA"
        value={stats.health}
        activeColor="#C93B5B"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="ATAQUE"
        value={stats.attack}
        activeColor="#E7A54A"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="DEFENSA"
        value={stats.defense}
        activeColor="#69A8A5"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="MAGIA"
        value={stats.magic}
        activeColor="#9B72CF"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="AGILIDAD"
        value={stats.agility ?? 5}
        activeColor="#5EA87A"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="PRECISIÓN"
        value={stats.precision ?? 5}
        activeColor="#FFD166"
        triggerKey={triggerKey}
        compact={compact}
      />
      <LaCriptaStatRow
        label="VOLUNTAD"
        value={stats.willpower ?? 5}
        activeColor="#7BDFF2"
        triggerKey={triggerKey}
        compact={compact}
      />
    </div>
  );
};

