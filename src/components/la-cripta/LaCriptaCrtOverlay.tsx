import React from 'react';

export const LaCriptaCrtOverlay: React.FC = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 select-none overflow-hidden cripta-crt-scanlines"
      aria-hidden="true"
    />
  );
};
