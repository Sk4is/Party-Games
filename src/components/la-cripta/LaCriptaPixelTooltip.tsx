import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface LaCriptaPixelTooltipProps {
  title: string;
  category?: string;
  description: string;
  footerLabel?: string;
  secondaryNote?: string;
  borderColor?: string;
  accentColor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable pixel-art La Cripta tooltip component.
 * Replaces native browser title="..." tooltips across statuses, inventory items,
 * weapons, abilities, and room nodes.
 * Supports desktop hover/focus and mobile tap-to-toggle with viewport-clamped portal positioning.
 */
export const LaCriptaPixelTooltip: React.FC<LaCriptaPixelTooltipProps> = ({
  title,
  category,
  description,
  footerLabel,
  secondaryNote,
  borderColor = '#E7A54A',
  accentColor = '#FFD166',
  icon,
  children,
  className = 'inline-flex',
  disabled = false,
}) => {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  }>({
    top: 0,
    left: 0,
    placement: 'top',
  });

  const updateCoords = () => {
    const el = triggerRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 248;
    const estimatedHeight = 126;
    const margin = 10;

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - tooltipWidth - margin);
    }

    const placeBelow = rect.top < estimatedHeight + 18;
    const top = placeBelow ? rect.bottom + 8 : rect.top - 8;

    setCoords({
      top,
      left,
      placement: placeBelow ? 'bottom' : 'top',
    });
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();

    const handleScrollOrResize = () => updateCoords();
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('pointerdown', handlePointerDownOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (disabled || !title) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => {
          updateCoords();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => {
          updateCoords();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // On touch devices without hover, allow tapping to inspect tooltip
          if (
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(hover: none)').matches
          ) {
            e.stopPropagation();
            updateCoords();
            setOpen((prev) => !prev);
          }
        }}
        className={className}
      >
        {children}
      </span>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: 248,
              transform:
                coords.placement === 'top' ? 'translateY(-100%)' : 'translateY(0)',
              borderColor,
              zIndex: 9999,
            }}
            className="pointer-events-none bg-[#0D0914]/98 border-2 p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.95)] select-none"
          >
            {/* Header Row: Icon + Name + Category */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#2B1F38]">
              <div className="flex items-center gap-1.5 min-w-0">
                {icon && <span className="shrink-0">{icon}</span>}
                <span
                  className="font-cripta-display text-xs font-black uppercase tracking-wider truncate"
                  style={{ color: accentColor }}
                >
                  {title}
                </span>
              </div>
              {category && (
                <span className="px-1.5 py-0.5 bg-[#191224] border border-[#3E2F4B] text-[8px] font-cripta-pixel uppercase tracking-widest text-[#D8C6A0] shrink-0">
                  {category}
                </span>
              )}
            </div>

            {/* Wrapped Description Body */}
            <p className="mt-1.5 text-[10px] font-cripta-pixel text-[#E8DFCE] leading-relaxed whitespace-normal break-words">
              {description}
            </p>

            {secondaryNote && (
              <div className="mt-1 text-[9px] font-cripta-pixel text-[#D8C6A0]/75 whitespace-normal break-words">
                {secondaryNote}
              </div>
            )}

            {/* Footer Row: Remaining Turns / Availability / Value */}
            {footerLabel && (
              <div className="mt-2 pt-1.5 border-t border-[#261B33] flex items-center justify-between text-[9px] font-cripta-pixel font-bold uppercase tracking-wider">
                <span style={{ color: accentColor }}>{footerLabel}</span>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
