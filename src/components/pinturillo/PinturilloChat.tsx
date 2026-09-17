import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PinturilloPlayer } from '../../types/pinturillo';
import { Send, CheckCircle2, Flame, Award } from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDrawer = localPlayerId === currentDrawerId;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isDrawer || hasGuessed) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. Player Status Overview Bar */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Jugadores ({players.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {players.map(p => {
            const isPlayerDrawer = p.id === currentDrawerId;
            return (
              <div
                key={p.id}
                title={`${p.name} (${p.score} pts)`}
                className={`relative flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border transition-all ${
                  isPlayerDrawer
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : p.hasGuessed
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="truncate max-w-[60px]">{p.name}</span>
                {isPlayerDrawer && <span title="Dibujando">🎨</span>}
                {p.hasGuessed && <span title="Ha acertado" className="text-emerald-400">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {messages.map(msg => {
          if (msg.isCorrectGuess) {
            return (
              <div
                key={msg.id}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-transparent border-l-4 border-emerald-400 text-emerald-300 font-black text-xs sm:text-sm flex items-center gap-2 animate-fade-in"
              >
                <span className="text-base">{msg.playerAvatar || '🎉'}</span>
                <span>
                  <strong>{msg.playerName}</strong> ha acertado{' '}
                  {msg.pointsEarned ? (
                    <span className="text-amber-400 font-extrabold">(+{msg.pointsEarned.toLocaleString('es-ES')} pts)</span>
                  ) : (
                    '🎉'
                  )}
                </span>
              </div>
            );
          }

          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="py-1 px-2.5 rounded-lg bg-slate-800/60 text-slate-400 text-xs italic text-center"
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
              <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-slate-400">
                <span>{msg.playerAvatar}</span>
                <span style={{ color: msg.playerColor || '#94a3b8' }} className="font-bold">
                  {msg.playerName}
                </span>
              </div>
              <div
                className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words font-medium ${
                  isMe
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-br-none'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Near Miss "Casi" subtle notification */}
      {nearMiss && !hasGuessed && (
        <div className="px-3 py-1.5 bg-amber-500/20 border-t border-amber-500/30 flex items-center gap-1.5 text-amber-300 text-xs font-black animate-pulse">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>¡Muy cerca! ¡Casi lo tienes!</span>
        </div>
      )}

      {/* 4. Chat Input / Guesser State */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        {isDrawer ? (
          <div className="py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <span>🎨</span>
            <span>Estás dibujando. ¡Los demás deben adivinar!</span>
          </div>
        ) : hasGuessed ? (
          <div className="py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-black text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>¡Has acertado! Espera a que termine la ronda.</span>
          </div>
        ) : disabled ? (
          <div className="py-2.5 px-4 rounded-xl bg-slate-800/80 text-slate-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
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
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-amber-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
