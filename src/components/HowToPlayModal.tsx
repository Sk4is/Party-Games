import React from 'react';
import { X, Flame, Zap, Heart, AlertTriangle } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
            💣
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-amber-400">
              Cómo Jugar a La Bomba
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Reglas rápidas para jugar en grupo
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
            <Flame className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-100 text-base mb-1">
                1. Nueva secuencia en cada respuesta válida
              </h3>
              <p>
                El jugador activo recibe una combinación de 2 o 3 letras (por ejemplo, <span className="text-amber-300 font-bold">«TRA»</span>). Escribe rápidamente una <strong className="text-white">palabra real en español</strong> que contenga esas letras juntas y en ese orden (ej: <em>«trabajo»</em>). ¡Al acertar, <strong className="text-amber-300">se genera inmediatamente una NUEVA secuencia</strong> para el siguiente jugador (ej: <em>«ADO»</em>)!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-100 text-base mb-1">
                2. Tiempo secreto y aleatorio
              </h3>
              <p>
                ¡Cada ronda tiene una duración oculta de entre <span className="text-amber-300 font-semibold">20 y 40 segundos</span>! No hay reloj numérico en pantalla: debes intuir el peligro observando la mecha, las chispas y las expresiones de pánico de la bomba.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
            <Zap className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-100 text-base mb-1">
                3. Penalización por fallos (Velocidad x1,5)
              </h3>
              <p>
                Si dices una palabra que no contiene la secuencia, una palabra que no existe en el diccionario o una palabra ya dicha en la ronda, recibirás <span className="text-yellow-300 font-semibold">+1 Fallo</span> y tu turno continúa. ¡Tus siguientes turnos consumirán la mecha un <span className="text-yellow-300 font-semibold">x1,5 más rápido</span>!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex gap-3.5">
            <Heart className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-100 text-base mb-1">
                4. Vidas y eliminación
              </h3>
              <p>
                Cada jugador empieza con 3 vidas (❤️❤️❤️). Cuando la bomba estalla en tu turno, pierdes una vida y comienza una nueva ronda con una secuencia nueva. Si pierdes las tres vidas quedas <span className="text-rose-400 font-semibold">chamuscado</span>. ¡Gana el último superviviente!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/30 flex gap-3.5">
            <span className="text-xl shrink-0 mt-0.5">🔤</span>
            <div>
              <h3 className="font-bold text-amber-300 text-base mb-1">
                5. Reto del Abecedario (+1 Vida)
              </h3>
              <p>
                Cada jugador tiene su propio progreso del abecedario español (A-Z + Ñ). Con cada palabra válida que uses, tacharás letras nuevas. Si completas las <strong className="text-amber-300">27 letras</strong>, ¡recuperas <strong className="text-emerald-400">+1 vida extra</strong> (máx. 3 vidas)! Tu progreso se mantiene entre rondas y explosiones.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            id="understood-rules-button"
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            ¡Entendido, a jugar!
          </button>
        </div>
      </div>
    </div>
  );
};
