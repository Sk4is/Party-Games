import React from 'react';
import {
  Heart,
  AlertCircle,
  RotateCcw,
  Clock,
  Repeat,
  Lightbulb,
  EyeOff,
  Layers,
  Check,
} from 'lucide-react';
import {
  PinturilloConfig,
  PinturilloCategory,
  PINTURILLO_CATEGORIES_LIST,
} from '../../types/pinturillo';
import { audio } from '../../utils/audio';

/* =========================================================================
   1. LA BOMBA SETTINGS
   ========================================================================= */
export interface BombaSettingsProps {
  startingLives: number;
  allowedMistakesPerRound: number;
  isHost?: boolean;
  onChangeLives?: (num: number) => void;
  onChangeMistakes?: (num: number) => void;
}

export const BombaSettings: React.FC<BombaSettingsProps> = ({
  startingLives,
  allowedMistakesPerRound,
  isHost = true,
  onChangeLives,
  onChangeMistakes,
}) => {
  return (
    <div className="space-y-4">
      {/* Vidas Iniciales */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            Vidas Iniciales
          </span>
          <span className="font-bold text-white font-mono">{startingLives} vidas</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeLives) {
                  audio.playTick();
                  onChangeLives(num);
                }
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                startingLives === num
                  ? 'bg-rose-600 text-white shadow-md font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Fallos Permitidos */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFB000]" />
            Fallos por Turno
          </span>
          <span className="font-bold text-white font-mono">{allowedMistakesPerRound} fallos</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeMistakes) {
                  audio.playTick();
                  onChangeMistakes(num);
                }
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                allowedMistakesPerRound === num
                  ? 'bg-[#FFB000] text-stone-950 shadow-md shadow-[#FFB000]/25 font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. LA PEOR RESPUESTA SETTINGS
   ========================================================================= */
export interface LPRSettingsProps {
  totalRounds: number;
  isHost?: boolean;
  onChangeRounds?: (rounds: number) => void;
}

export const LPRSettings: React.FC<LPRSettingsProps> = ({
  totalRounds,
  isHost = true,
  onChangeRounds,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-stone-300 font-semibold flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5 text-[#FF3B4F]" />
          Rondas por Partida
        </span>
        <span className="font-bold text-white font-mono">
          {totalRounds === -1 ? 'Modo Libre (∞)' : `${totalRounds} rondas`}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {[5, 8, 10, 15].map((num) => (
          <button
            key={num}
            type="button"
            disabled={!isHost}
            onClick={() => {
              if (isHost && onChangeRounds) {
                audio.playTick();
                onChangeRounds(num);
              }
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
              totalRounds === num
                ? 'bg-[#FF3B4F] text-white shadow-md shadow-[#FF3B4F]/25 font-black scale-[1.02]'
                : isHost
                ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!isHost}
        onClick={() => {
          if (isHost && onChangeRounds) {
            audio.playTick();
            onChangeRounds(-1);
          }
        }}
        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
          totalRounds === -1
            ? 'bg-[#FF3B4F] text-white shadow-md shadow-[#FF3B4F]/25 font-black scale-[1.01]'
            : isHost
            ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
            : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
        }`}
      >
        Modo Libre (Sin límite de rondas)
      </button>
    </div>
  );
};

/* =========================================================================
   3. PINTURILLO SETTINGS
   ========================================================================= */
export interface PinturilloSettingsProps {
  config: PinturilloConfig;
  isHost?: boolean;
  onChangeConfig?: (updated: Partial<PinturilloConfig>) => void;
}

const ROUND_TIME_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s (Recomendado)', value: 90 },
  { label: '120s', value: 120 },
  { label: '180s', value: 180 },
];

const VUELTAS_OPTIONS = [
  { label: '1 vuelta', value: 1 },
  { label: '2 vueltas', value: 2 },
  { label: '3 vueltas', value: 3 },
  { label: '5 vueltas', value: 5 },
];

export const PinturilloSettings: React.FC<PinturilloSettingsProps> = ({
  config,
  isHost = true,
  onChangeConfig,
}) => {
  const currentCategories: PinturilloCategory[] =
    config.categories && config.categories.length > 0
      ? config.categories
      : PINTURILLO_CATEGORIES_LIST.map((c) => c.id);

  const hintsEnabled = config.hintsEnabled ?? true;

  const handleToggleCategory = (catId: PinturilloCategory) => {
    if (!isHost || !onChangeConfig) return;
    audio.playClick();
    let updated: PinturilloCategory[];
    if (currentCategories.includes(catId)) {
      if (currentCategories.length <= 1) return; // Must keep at least 1 active
      updated = currentCategories.filter((c) => c !== catId);
    } else {
      updated = [...currentCategories, catId];
    }
    onChangeConfig({ categories: updated });
  };

  const handleSelectAllCategories = () => {
    if (!isHost || !onChangeConfig) return;
    audio.playClick();
    onChangeConfig({ categories: PINTURILLO_CATEGORIES_LIST.map((c) => c.id) });
  };

  return (
    <div className="space-y-5">
      {/* Round Time */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00BCEB]" />
            Tiempo de Dibujo por Turno
          </span>
          <span className="font-bold text-white font-mono">{config.roundTimeSeconds}s</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {ROUND_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeConfig) {
                  audio.playClick();
                  onChangeConfig({ roundTimeSeconds: opt.value });
                }
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                config.roundTimeSeconds === opt.value
                  ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/25 font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vueltas */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-[#00BCEB]" />
            Rondas Completas (Vueltas)
          </span>
          <span className="font-bold text-white font-mono">{config.totalVueltas} vuelta(s)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {VUELTAS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeConfig) {
                  audio.playClick();
                  onChangeConfig({ totalVueltas: opt.value });
                }
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                config.totalVueltas === opt.value
                  ? 'bg-[#00BCEB] text-slate-950 shadow-md shadow-[#00BCEB]/25 font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pistas (Hints) */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-[#00BCEB]" />
            Modo de Pistas
          </span>
          <span className="font-bold text-[#00BCEB]">
            {hintsEnabled ? 'Con pistas automáticas' : 'Sin pistas (Experto)'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!isHost}
            onClick={() => {
              if (isHost && onChangeConfig) {
                audio.playClick();
                onChangeConfig({ hintsEnabled: true });
              }
            }}
            className={`p-3 rounded-2xl text-left border transition-all ${
              hintsEnabled
                ? 'bg-[#00BCEB]/15 border-[#00BCEB] text-[#00BCEB] ring-1 ring-[#00BCEB]/40'
                : isHost
                ? 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 cursor-pointer'
                : 'bg-stone-950/60 border-stone-800/60 text-stone-600 cursor-default'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-[#00BCEB]" />
              <span className="text-xs font-bold uppercase tracking-wide text-white">Con pistas</span>
              {hintsEnabled && <span className="ml-auto text-xs text-[#00BCEB] font-bold">✓</span>}
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">
              Muestra letras reveladas al 50% y 20% del tiempo.
            </p>
          </button>

          <button
            type="button"
            disabled={!isHost}
            onClick={() => {
              if (isHost && onChangeConfig) {
                audio.playClick();
                onChangeConfig({ hintsEnabled: false });
              }
            }}
            className={`p-3 rounded-2xl text-left border transition-all ${
              !hintsEnabled
                ? 'bg-[#00BCEB]/15 border-[#00BCEB] text-[#00BCEB] ring-1 ring-[#00BCEB]/40'
                : isHost
                ? 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 cursor-pointer'
                : 'bg-stone-950/60 border-stone-800/60 text-stone-600 cursor-default'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <EyeOff className="w-3.5 h-3.5 text-[#00BCEB]" />
              <span className="text-xs font-bold uppercase tracking-wide text-white">Sin pistas</span>
              {!hintsEnabled && <span className="ml-auto text-xs text-[#00BCEB] font-bold">✓</span>}
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">
              Solo guiones hasta el final. ¡Mayor reto!
            </p>
          </button>
        </div>
      </div>

      {/* Categorías (10 categories) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-stone-300 font-semibold text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#00BCEB]" />
            Categorías de Palabras ({currentCategories.length}/{PINTURILLO_CATEGORIES_LIST.length})
          </span>
          {isHost && currentCategories.length < PINTURILLO_CATEGORIES_LIST.length && (
            <button
              type="button"
              onClick={handleSelectAllCategories}
              className="text-[11px] font-bold text-[#00BCEB] hover:text-[#009ED0] cursor-pointer underline"
            >
              Seleccionar todas
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-800">
          {PINTURILLO_CATEGORIES_LIST.map((cat) => {
            const isSelected = currentCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                disabled={!isHost}
                onClick={() => handleToggleCategory(cat.id)}
                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#00BCEB]/15 border-[#00BCEB]/80 text-white'
                    : isHost
                    ? 'bg-stone-950 border-stone-800/80 text-stone-500 hover:border-stone-700 cursor-pointer'
                    : 'bg-stone-950/60 border-stone-800/60 text-stone-600 cursor-default'
                }`}
              >
                <span className="text-base shrink-0">{cat.icon}</span>
                <span className={`text-xs font-bold truncate flex-1 ${isSelected ? 'text-[#00BCEB]' : 'text-stone-400'}`}>
                  {cat.name}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#00BCEB] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   4. PALABRA SECRETA SETTINGS
   ========================================================================= */
export interface PalabraSecretaSettingsProps {
  timePerTurn: number; // default 120 (2:00)
  totalRounds: number; // default 3
  isHost?: boolean;
  onChangeTime?: (seconds: number) => void;
  onChangeRounds?: (rounds: number) => void;
}

const PALABRA_SECRETA_TIME_OPTIONS = [
  { label: '60s', sublabel: '1:00', value: 60 },
  { label: '90s', sublabel: '1:30', value: 90 },
  { label: '120s', sublabel: '2:00', value: 120 },
  { label: '150s', sublabel: '2:30', value: 150 },
];

export const PalabraSecretaSettings: React.FC<PalabraSecretaSettingsProps> = ({
  timePerTurn = 120,
  totalRounds = 3,
  isHost = true,
  onChangeTime,
  onChangeRounds,
}) => {
  return (
    <div className="space-y-4">
      {/* Tiempo por Turno */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            Tiempo por Turno
          </span>
          <span className="font-bold text-white font-mono">
            {timePerTurn >= 60 ? `${Math.floor(timePerTurn / 60)}:${(timePerTurn % 60).toString().padStart(2, '0')}` : `${timePerTurn}s`}
          </span>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
          {PALABRA_SECRETA_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeTime) {
                  audio.playTick();
                  onChangeTime(opt.value);
                }
              }}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                timePerTurn === opt.value
                  ? 'bg-[#10B981] text-slate-950 shadow-md shadow-[#10B981]/25 font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] opacity-70 font-mono">({opt.sublabel})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rondas por Partida */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-stone-300 font-semibold flex items-center gap-1.5">
            <Repeat className="w-3.5 h-3.5 text-[#10B981]" />
            Rondas por Partida
          </span>
          <span className="font-bold text-white font-mono">{totalRounds} rondas</span>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5">
          {[2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              disabled={!isHost}
              onClick={() => {
                if (isHost && onChangeRounds) {
                  audio.playTick();
                  onChangeRounds(num);
                }
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                totalRounds === num
                  ? 'bg-[#10B981] text-slate-950 shadow-md shadow-[#10B981]/25 font-black scale-[1.02]'
                  : isHost
                  ? 'bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700 cursor-pointer'
                  : 'bg-stone-950/60 border border-stone-800/60 text-stone-600 cursor-default'
              }`}
            >
              <span>{num}</span>
              <span className="hidden xs:inline ml-1">rondas</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
