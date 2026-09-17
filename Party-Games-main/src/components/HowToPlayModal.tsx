import React, { useState } from 'react';
import { X, Flame, Zap, Heart, AlertTriangle, Paintbrush, Award, Clock } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'bomba' | 'lpr' | 'pinturillo'>('bomba');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        id="how-to-play-modal"
        className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/10 text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <button
          id="close-how-to-play-button"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Cerrar instrucciones"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('bomba')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'bomba'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>💣</span>
            <span>La Bomba</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lpr')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'lpr'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>💀</span>
            <span>La Peor Resp.</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pinturillo')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'pinturillo'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <span>🎨</span>
            <span>Pinturillo</span>
          </button>
        </div>

        {/* TAB 1: LA BOMBA */}
        {activeTab === 'bomba' && (
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                💣
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-amber-400">Reglas de La Bomba</h3>
                <p className="text-xs text-slate-400">Piensa rápido antes de que explote</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <Flame className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  1. Nueva secuencia en cada respuesta válida
                </h4>
                <p>
                  El jugador activo recibe 2 o 3 letras (ej: <span className="text-amber-300 font-bold">«TRA»</span>). Escribe una <strong className="text-white">palabra real en español</strong> que las contenga juntas (ej: <em>«trabajo»</em>). ¡Al acertar pasa al siguiente con nueva secuencia!
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  2. Bomba Global Continua
                </h4>
                <p>
                  Hay una sola mecha compartida continua que dura entre 60 y 180 segundos. La mecha no se reinicia ni se detiene hasta que explota en el turno de alguien.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <Heart className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  3. Vidas y eliminación
                </h4>
                <p>
                  Empiezas con 3 vidas. Cada explosión te quita una vida. ¡El último jugador con vidas gana la partida!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LA PEOR RESPUESTA */}
        {activeTab === 'lpr' && (
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-xl">
                💀
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-amber-400">Reglas de La Peor Respuesta</h3>
                <p className="text-xs text-slate-400">Cuanto peor, mejor</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <h4 className="font-bold text-slate-100 text-base mb-1">1. Pregunta irreverente</h4>
              <p>
                En cada ronda se revela una carta con una situación incómoda, surrealista o absurda.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <h4 className="font-bold text-slate-100 text-base mb-1">2. Respuesta libre secreta</h4>
              <p>
                Cada jugador escribe en secreto su respuesta intentando ser lo más divertido, ingenioso o políticamente incorrecto posible.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
              <h4 className="font-bold text-slate-100 text-base mb-1">3. Votación anónima</h4>
              <p>
                Las respuestas se barajan de forma anónima. Todos votan la que consideren la más graciosa. ¡La más votada se lleva la ronda!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PINTURILLO */}
        {activeTab === 'pinturillo' && (
          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
                🎨
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-cyan-400">Reglas de Pinturillo Online</h3>
                <p className="text-xs text-slate-400">Dibuja, adivina y compite en tiempo real</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <Paintbrush className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  1. Un dibujante con palabra secreta
                </h4>
                <p>
                  Por turnos, un jugador recibe una palabra secreta (¡solo él puede verla!) y debe dibujarla en el gran lienzo blanco usando lápiz, rotulador, pincel, goma o cubo de pintura.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <Award className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  2. Adivina por chat y suma puntos
                </h4>
                <p>
                  Todos los demás intentan adivinar escribiendo en el chat. Cuanto más rápido aciertes, más puntos consigues (hasta 1.500 pts). El dibujante también gana +200 pts por cada acierto.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
              <Clock className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-100 text-base mb-1">
                  3. Pistas y «¡Casi!»
                </h4>
                <p>
                  A medida que corre el tiempo, se van desvelando letras en el panel de pistas. Y si tu respuesta está a solo una letra de diferencia, recibirás un aviso privado de <strong className="text-amber-400">«🔥 ¡Casi!»</strong> para afinar el tiro.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
