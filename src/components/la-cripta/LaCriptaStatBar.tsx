import React, { useEffect, useState } from 'react';
import { CriptaCharacterStats } from '../../types/laCripta';

interface LaCriptaStatRowProps {
  label: 'VIDA' | 'ATAQUE' | 'DEFENSA' | 'MAGIA';
  value: number;
  activeColor: string;
  triggerKey: string;
  compact?: boolean;
}

const TOTAL_SEGMENTS = 10;

export const LaCriptaStatRow: React.FC<LaCriptaStatRowProps> = ({
  label,
  value,
  activeColor,
  triggerKey,
  compact = false,
}) => {
  const clampedValue = Math.max(0, Math.min(TOTAL_SEGMENTS, Math.round(value)));
  const [revealedCount, setRevealedCount] = useState(clampedValue);

  useEffect(() => {
    setRevealedCount(0);
    const timer = setTimeout(() => {
      setRevealedCount(clampedValue);
    }, 20);
    return () => clearTimeout(timer);
  }, [triggerKey, clampedValue]);

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <span
        className={`font-cripta-pixel uppercase tracking-wider text-[#D8C6A0] shrink-0 ${
          compact ? 'text-[10px] w-16' : 'text-xs w-20'
        }`}
      >
        {label}
      </span>

      <div
        className="flex items-center gap-1 flex-1 justify-end"
        aria-label={`${label}: ${clampedValue} de 10`}
      >
        {Array.from({ length: TOTAL_SEGMENTS }).map((_, idx) => {
          const isLit = idx < revealedCount;
          return (
            <span
              key={idx}
              style={{
                transitionDelay: isLit ? `${idx * 22}ms` : '0ms',
                backgroundColor: isLit ? activeColor : '#0B0A0E',
                borderColor: isLit ? '#FFF8E7' : '#282039',
                boxShadow: isLit ? `0 0 6px ${activeColor}66` : 'none',
              }}
              className={`inline-block border transition-colors duration-150 ${
                compact ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3 h-3 sm:w-3.5 sm:h-3.5'
              }`}
            />
          );
        })}
      </div>
    </div>
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
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
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
    </div>
  );
};
