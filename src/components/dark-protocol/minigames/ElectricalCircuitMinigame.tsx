/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, Zap, RotateCw, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface NodePiece {
  id: number;
  rotation: number; // 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg
  type: 'straight' | 'corner' | 't-shape' | 'fuse';
  fuseArmed?: boolean;
}

// Ports: 0=Top, 1=Right, 2=Bottom, 3=Left
function getNodePorts(node: NodePiece): number[] {
  const rot = (node.rotation % 4 + 4) % 4;
  if (node.type === 'straight') {
    return rot % 2 === 0 ? [1, 3] : [0, 2];
  }
  if (node.type === 'corner') {
    // 0: [0, 1] (Top, Right)
    // 1: [1, 2] (Right, Bottom)
    // 2: [2, 3] (Bottom, Left)
    // 3: [3, 0] (Left, Top)
    return [rot, (rot + 1) % 4];
  }
  if (node.type === 't-shape') {
    // 0: [3, 0, 1] (Left, Top, Right)
    // 1: [0, 1, 2] (Top, Right, Bottom)
    // 2: [1, 2, 3] (Right, Bottom, Left)
    // 3: [2, 3, 0] (Bottom, Left, Top)
    return [(rot + 3) % 4, rot, (rot + 1) % 4];
  }
  if (node.type === 'fuse') {
    if (!node.fuseArmed) return [];
    return rot % 2 === 0 ? [0, 2] : [1, 3];
  }
  return [];
}

interface ElectricalCircuitMinigameProps {
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

export const ElectricalCircuitMinigame: React.FC<ElectricalCircuitMinigameProps> = ({
  onSuccess,
  onFail,
  onClose,
}) => {
  // 3x3 Grid
  // Row 0: 0 (t-shape), 1 (straight), 2 (corner)
  // Row 1: 3 (fuse),    4 (t-shape),  5 (straight)
  // Row 2: 6 (corner),  7 (fuse),     8 (t-shape)
  const [nodes, setNodes] = useState<NodePiece[]>([
    { id: 0, rotation: 1, type: 't-shape' },
    { id: 1, rotation: 1, type: 'straight' },
    { id: 2, rotation: 0, type: 'corner' },
    { id: 3, rotation: 0, type: 'fuse', fuseArmed: true },
    { id: 4, rotation: 2, type: 't-shape' },
    { id: 5, rotation: 3, type: 'straight' },
    { id: 6, rotation: 1, type: 'corner' },
    { id: 7, rotation: 1, type: 'fuse', fuseArmed: true },
    { id: 8, rotation: 3, type: 't-shape' },
  ]);

  const [status, setStatus] = useState<'IDLE' | 'SOLVED' | 'SHORT_CIRCUIT'>('IDLE');
  const [lockout, setLockout] = useState<boolean>(false);

  // Rotate a conduit node
  const rotateNode = (id: number) => {
    if (status === 'SOLVED' || lockout) return;
    darkProtocolAudio.playSwitchClick();
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, rotation: (n.rotation + 1) % 4 } : n))
    );
  };

  // Toggle fuse switch
  const toggleFuse = (id: number) => {
    if (status === 'SOLVED' || lockout) return;
    darkProtocolAudio.playSwitchClick();
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, fuseArmed: !n.fuseArmed } : n))
    );
  };

  // True BFS Power Flow from IN (Node 0, Port 3 - Left)
  const energizedSet = useMemo(() => {
    const energized = new Set<number>();
    const n0Ports = getNodePorts(nodes[0]);
    // Node 0 must connect to Left (port 3) to receive power from the facility feed
    if (!n0Ports.includes(3)) return energized;

    const queue: number[] = [0];
    energized.add(0);

    const opposites: Record<number, number> = { 0: 2, 1: 3, 2: 0, 3: 1 };
    const getNeighbor = (idx: number, port: number): number => {
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      if (port === 0 && r > 0) return (r - 1) * 3 + c;
      if (port === 1 && c < 2) return r * 3 + (c + 1);
      if (port === 2 && r < 2) return (r + 1) * 3 + c;
      if (port === 3 && c > 0) return r * 3 + (c - 1);
      return -1;
    };

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currPorts = getNodePorts(nodes[curr]);

      for (const p of currPorts) {
        const neighbor = getNeighbor(curr, p);
        if (neighbor !== -1 && !energized.has(neighbor)) {
          const neighborPorts = getNodePorts(nodes[neighbor]);
          const neededPort = opposites[p];
          if (neighborPorts.includes(neededPort)) {
            energized.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    return energized;
  }, [nodes]);

  // Check if output is energized and safety fuses closed
  const isOutputReached = useMemo(() => {
    if (!energizedSet.has(8)) return false;
    const n8Ports = getNodePorts(nodes[8]);
    // Node 8 connects to Right (port 1) to deliver power to the sector output
    const n8HasRight = n8Ports.includes(1);
    const fusesArmed = Boolean(nodes[3].fuseArmed && nodes[7].fuseArmed);
    return n8HasRight && fusesArmed;
  }, [energizedSet, nodes]);

  const verifyCircuit = () => {
    if (lockout || status === 'SOLVED') return;

    if (isOutputReached) {
      setStatus('SOLVED');
      darkProtocolAudio.playMinigameSuccess();
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } else {
      setStatus('SHORT_CIRCUIT');
      setLockout(true);
      darkProtocolAudio.playElectricSpark();
      onFail();
      setTimeout(() => {
        setStatus('IDLE');
        setLockout(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#080c14] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.2)] p-6 text-slate-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider">
                CUADRO ELÉCTRICO // SUBESTACIÓN SECTOR C
              </h3>
              <p className="text-[11px] text-cyan-400/80">
                Alinea el camino de corriente desde ENTRADA hasta SALIDA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert notifications */}
        {status === 'SHORT_CIRCUIT' && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/90 border border-rose-500/50 text-rose-300 flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>¡DESCARGA DETECTADA! Bloqueo temporal de disyuntor (2s).</span>
          </div>
        )}

        {status === 'SOLVED' && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 flex items-center gap-2 text-xs">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>¡CIRCUITO CERRADO CON ÉXITO! Suministro eléctrico de Sector C restablecido.</span>
          </div>
        )}

        {/* Circuit Schematic Board */}
        <div className="relative bg-[#03060a] border border-white/10 rounded-xl p-4 mb-4 overflow-hidden">
          {/* Input & Output indicators */}
          <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-cyan-400 mb-2">
            <span className="flex items-center gap-1 text-cyan-300">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" /> ENTRADA (380V)
            </span>
            <span
              className={`flex items-center gap-1 ${
                isOutputReached ? 'text-emerald-400 font-black' : 'text-amber-400'
              }`}
            >
              SALIDA SECTOR C {isOutputReached ? '● CONECTADA' : '○ AISLADA'}
            </span>
          </div>

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-2.5 max-w-[320px] mx-auto py-2">
            {nodes.map((node) => {
              const rotDeg = node.rotation * 90;
              const isEnergized = energizedSet.has(node.id);

              return (
                <div
                  key={node.id}
                  className={`relative aspect-square rounded-xl border flex items-center justify-center p-2 cursor-pointer transition-all active:scale-95 group ${
                    isEnergized
                      ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => rotateNode(node.id)}
                >
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `rotate(${rotDeg}deg)` }}
                  >
                    {node.type === 'straight' && (
                      <div
                        className={`w-full h-3 rounded-sm ${
                          isEnergized ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-600'
                        }`}
                      />
                    )}
                    {node.type === 'corner' && (
                      <div className="relative w-full h-full">
                        <div
                          className={`absolute top-0 right-1/2 w-3 h-1/2 rounded-t-sm ${
                            isEnergized ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                        <div
                          className={`absolute top-1/2 right-0 w-1/2 h-3 -translate-y-1/2 rounded-r-sm ${
                            isEnergized ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                        <div
                          className={`absolute top-1/2 right-1/2 w-3 h-3 -translate-y-1/2 ${
                            isEnergized ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                    )}
                    {node.type === 't-shape' && (
                      <div className="relative w-full h-full">
                        <div
                          className={`absolute top-1/2 left-0 w-full h-3 -translate-y-1/2 ${
                            isEnergized ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                        <div
                          className={`absolute top-1/2 left-1/2 w-3 h-1/2 -translate-x-1/2 ${
                            isEnergized ? 'bg-cyan-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                    )}
                    {node.type === 'fuse' && (
                      <div
                        className={`w-full h-4 rounded flex items-center justify-between px-1.5 border transition-all ${
                          node.fuseArmed
                            ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                            : 'bg-rose-950 border-rose-500 text-rose-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFuse(node.id);
                        }}
                      >
                        <span className="text-[8px] font-black">RELÉ</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            node.fuseArmed ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <RotateCw className="absolute top-1 right-1 w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span>VOLTAJE: 380 V CA</span>
            <span className="text-cyan-400">Clic: Girar conducto &bull; F1/F2 para cooperar</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            SALIR [ESC]
          </button>
          <button
            type="button"
            disabled={status === 'SOLVED' || lockout}
            onClick={verifyCircuit}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              isOutputReached
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md cursor-pointer'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>ACTIVAR DISYUNTOR DE SECTOR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
