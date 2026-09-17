import React from 'react';

/**
 * PinturilloBackground: Completely FLAT, SIMPLE, and STATIC dark navy background.
 * Target color: #050A18 across the entire page.
 * Strictly:
 * - NO animated background
 * - NO gradients
 * - NO floating doodles
 * - NO decorative stars
 * - NO background scribbles
 * - NO particles
 * - NO glowing blobs
 * - NO background textures
 * - NO background movement
 * - NO random decorative elements
 */
export const PinturilloBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none -z-10 bg-[#050A18]"
    />
  );
};

// Re-export for backward compatibility
export const PinturilloBackgroundDoodles = PinturilloBackground;
