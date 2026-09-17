import React from 'react';
import { Crown, Users, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'motion/react';

export interface LobbyPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected?: boolean;
}

interface PlayerListProps {
  players: LobbyPlayer[];
  currentUserId: string;
  minPlayers: number;
  maxPlayers?: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentUserId,
  minPlayers,
  maxPlayers = 10,
}) => {
  return (
    <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
            Jugadores en la sala ({players.length}/{maxPlayers})
          </h3>
        </div>
        <span className="text-xs text-stone-400 font-medium">
          Mínimo {minPlayers}
        </span>
      </div>

      <div className="divide-y divide-stone-800/60">
        {players.map((player) => {
          const isCurrent = player.id === currentUserId;
          const isConnected = player.isConnected !== false;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-3 px-2 flex items-center justify-between gap-3 transition-colors hover:bg-stone-800/20 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar with player's custom color */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner"
                  style={{
                    backgroundColor: `${player.color}25`,
                    border: `1.5px solid ${player.color}`,
                  }}
                >
                  {player.avatar}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {player.name}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700/80 shrink-0">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                    {player.isHost && (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                        <Crown className="w-3 h-3" /> Anfitrión
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-stone-500 shrink-0">
                      {isConnected ? (
                        <>
                          <Wifi className="w-3 h-3 text-emerald-400" />
                          <span className="text-stone-400">Conectado</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-stone-600" />
                          <span>Desconectado</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {player.isHost && (
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Host</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
