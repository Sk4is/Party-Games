import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PinturilloPlayer } from '../../types/pinturillo';
import { Send, CheckCircle2, Flame, Trophy, MessageSquare } from 'lucide-react';

interface PinturilloChatProps {
  messages: ChatMessage[];
  players: PinturilloPlayer[];
  currentDrawerId: string | null;
  localPlayerId: string;
  hasGuessed: boolean;
  nearMiss: boolean;
  disabled?: boolean;
  onSendMessage: (text: string) => void;
}

export const PinturilloChat: React.FC<PinturilloChatProps> = ({
  messages,
  players,
  currentDrawerId,
  localPlayerId,
  hasGuessed,
  nearMiss,
  disabled = false,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'players'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDrawer = localPlayerId === currentDrawerId;

  // Auto-scroll to latest message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isDrawer || hasGuessed) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col h-full bg-[#0b1022]/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 border-slate-700/80 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.7)] overflow-hidden select-none">
      {/* 1. Header with Tab Navigation (Chat vs Ranking) */}
      <div className="px-3 py-2.5 bg-[#070b18] border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-[#FFC928] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>CHAT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeTab === 'players'
                ? 'bg-[#38D9FF] text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>PUNTOS ({players.length})</span>
          </button>
        </div>

        {/* Quick Drawer Avatar badge */}
        <div className="flex items-center gap-1.5 text-xs">
          {players.find(p => p.id === currentDrawerId) && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
              <span>{players.find(p => p.id === currentDrawerId)?.avatar}</span>
              <span className="text-[#38D9FF]">✏️ Dibuja</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Content Area */}
      {activeTab === 'chat' ? (
        /* Messages Stream */
        <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm select-text">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
              <span className="text-3xl mb-1 opacity-70">🎨</span>
              <p className="text-xs font-bold text-slate-300">¡Escribe tus intentos en el chat!</p>
              <p className="text-[11px] text-slate-500 mt-0.5">El primero en acertar gana más puntos.</p>
            </div>
          ) : (
            messages.map(msg => {
              if (msg.isCorrectGuess) {
                return (
                  <div
                    key={msg.id}
                    className="py-2 px-3 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-emerald-600/15 to-transparent border-l-4 border-[#4ADE80] text-emerald-200 font-bold text-xs sm:text-sm flex items-center gap-2 animate-guess-sparkle shadow-sm"
                  >
                    <span className="text-base shrink-0">{msg.playerAvatar || '🎉'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-black">{msg.playerName}</span> ha acertado la palabra
                      {msg.pointsEarned ? (
                        <span className="ml-1.5 text-[#FFC928] font-black">
                          (+{msg.pointsEarned.toLocaleString('es-ES')} pts)
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              }

              if (msg.isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="py-1 px-2.5 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-400 text-xs italic text-center font-medium"
                  >
                    {msg.text}
                  </div>
                );
              }

              const isMe = msg.playerId === localPlayerId;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div className="flex items-center gap-1 mb-0.5 text-[11px] text-slate-400">
                    <span className="text-xs">{msg.playerAvatar}</span>
                    <span style={{ color: msg.playerColor || '#94a3b8' }} className="font-bold">
                      {msg.playerName}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words font-medium text-xs sm:text-sm shadow-sm ${
                      isMe
                        ? 'bg-[#FFC928]/20 border border-[#FFC928]/40 text-amber-100 rounded-br-none'
                        : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Player List & Leaderboard Tab */
        <div className="flex-1 p-3 overflow-y-auto space-y-1.5">
          {sortedPlayers.map((p, idx) => {
            const isPlayerDrawer = p.id === currentDrawerId;
            const isMe = p.id === localPlayerId;
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-slate-800/90 border-[#FFC928]/50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 text-center font-black text-xs text-slate-400">{medal}</span>
                  <span className="text-xl shrink-0">{p.avatar}</span>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-black uppercase text-[#FFC928]">(Tú)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      {isPlayerDrawer ? (
                        <span className="text-[#38D9FF] font-bold">🎨 Dibujando</span>
                      ) : p.hasGuessed ? (
                        <span className="text-[#4ADE80] font-bold">✓ Ha acertado</span>
                      ) : (
                        <span>Intentando...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-black text-[#FFC928]">
                    {p.score.toLocaleString('es-ES')}
                  </span>
                  <span className="text-[10px] block text-slate-400 font-medium">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Near Miss "Casi" alert notification */}
      {nearMiss && !hasGuessed && (
        <div className="px-3 py-1.5 bg-[#FF6B6B]/20 border-t border-[#FF6B6B]/40 flex items-center gap-2 text-rose-300 text-xs font-black animate-pulse">
          <Flame className="w-4 h-4 text-[#FF6B6B] shrink-0" />
          <span>¡Casi lo tienes! ¡Estás muy pero que muy cerca!</span>
        </div>
      )}

      {/* 4. Chat Input / Role State Bar */}
      <div className="p-3 bg-[#070b18] border-t border-slate-800">
        {isDrawer ? (
          <div className="py-2.5 px-4 rounded-xl bg-slate-800/90 text-slate-300 text-xs font-bold text-center flex items-center justify-center gap-2 border border-slate-700">
            <span>🎨</span>
            <span>Estás dibujando. ¡Los demás compañeros deben adivinar!</span>
          </div>
        ) : hasGuessed ? (
          <div className="py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-[#4ADE80] text-xs sm:text-sm font-black text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
            <span>¡Has acertado! Espera a que termine la ronda.</span>
          </div>
        ) : disabled ? (
          <div className="py-2.5 px-4 rounded-xl bg-slate-800/90 text-slate-300 text-xs font-bold text-center flex items-center justify-center gap-2 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#FFC928] animate-pulse" />
            <span>¡Prepárate! La ronda está a punto de comenzar...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              autoFocus
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-[#FFC928] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-2 rounded-xl bg-[#FFC928] hover:bg-[#ffbe0b] disabled:opacity-40 disabled:hover:bg-[#FFC928] text-slate-950 font-black transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
