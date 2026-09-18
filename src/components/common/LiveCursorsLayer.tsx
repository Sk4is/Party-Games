import React from 'react';
import { motion } from 'motion/react';
import { BoardCursor } from '../../types/multiplayer';

interface LiveCursorsLayerProps {
  cursors: Record<string, BoardCursor>;
  currentUserId: string;
}

export const LiveCursorsLayer: React.FC<LiveCursorsLayerProps> = ({
  cursors,
  currentUserId,
}) => {
  const otherCursorsList = (Object.values(cursors) as BoardCursor[]).filter(
    (c: BoardCursor) => c.playerId !== currentUserId && Date.now() - c.updatedAt < 10000
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {otherCursorsList.map((cursor) => (
        <motion.div
          key={cursor.playerId}
          className="absolute flex items-start gap-1"
          initial={false}
          animate={{
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
          }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 320,
            mass: 0.5,
          }}
          style={{
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Custom Stylized Cursor Arrow */}
          <svg
            className="w-5 h-5 drop-shadow-md"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: cursor.color }}
          >
            <path
              d="M3 3l7 18 3.5-7 7-3.5L3 3z"
              fill="currentColor"
              stroke="#0f172a"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>

          {/* Cursor Badge */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg whitespace-nowrap border border-black/20"
            style={{ backgroundColor: cursor.color }}
          >
            <span className="text-xs">{cursor.avatar}</span>
            <span className="text-[11px] tracking-tight">{cursor.name}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
