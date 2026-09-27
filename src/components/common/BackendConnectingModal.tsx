import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, XCircle, Wifi } from 'lucide-react';
import { backendHealth, BackendConnectionState } from '../../services/backendHealth';

export const BackendConnectingModal: React.FC = () => {
  const [state, setState] = useState<BackendConnectionState>(() => backendHealth.getState());

  useEffect(() => {
    const unsubscribe = backendHealth.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  if (!state.isOverlayVisible) {
    return null;
  }

  const handleCancel = () => {
    backendHealth.cancelWait();
  };

  const handleRetry = () => {
    backendHealth.retry();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-connecting-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#04060a]/85 backdrop-blur-md animate-fade-in"
    >
      {/* Background ambient lighting */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-8" />
      <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none translate-y-12" />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#0b0f19] border border-amber-500/25 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden">
        {/* Subtle top accent gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 select-none shadow-[0_0_12px_rgba(245,158,11,0.1)]">
            <Sparkles className="w-3 h-3 text-amber-400" /> FAM2PLAY EN LÍNEA
          </span>
        </div>

        {/* Animated Indeterminate Loader / Emblem */}
        <div className="relative flex items-center justify-center my-6">
          {/* Outer glowing pulsing ring */}
          <div className="absolute w-24 h-24 rounded-full border border-amber-500/20 animate-ping opacity-40 pointer-events-none" />

          {/* Rotating indeterminate spinner ring */}
          <div className="w-20 h-20 rounded-full border-2 border-slate-800 border-t-amber-400 border-r-orange-500 animate-spin" />

          {/* Center Crown / Game Emblem with subtle pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-pulse">
              <span className="text-2xl select-none" role="img" aria-label="FAM2PLAY crown">
                👑
              </span>
            </div>
          </div>
        </div>

        {/* Primary Title */}
        <h2
          id="backend-connecting-title"
          className="text-lg sm:text-xl font-black tracking-wide uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-200 to-amber-100 mb-2"
        >
          {state.statusTitle}
        </h2>

        {/* Secondary Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-sm mx-auto mb-5 whitespace-pre-line">
          {state.errorMessage || state.subText}
        </p>

        {/* Cycling Step Badge (Indeterminate progress, NO fake percentages) */}
        {!state.isTimedOut && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wider mb-6 shadow-inner">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse delay-200" />
            </div>
            <span>{state.stepText}</span>
          </div>
        )}

        {/* Interactive Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {state.isTimedOut ? (
            <>
              <button
                type="button"
                onClick={handleRetry}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wide uppercase shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer border border-slate-700/60"
              >
                <span>Cancelar</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors duration-150 border border-slate-700/50 cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
