import React, { useEffect, useMemo, useState } from 'react';
import {
  CRIPTA_BIOME_BESTIARY_BY_SLUG,
  CriptaCreatureVisualBlueprint,
  CriptaUniqueCreatureModelId,
} from '../../../data/la-cripta/criptaBiomeBestiary';
import { CriptaDungeonId } from '../../../types/laCripta';
import {
  BESTIARY_AUDIT_REPORT,
  ENEMY_VISUAL_REGISTRY,
} from './LaCriptaBestiaryRegistry';
import { AuthoredEnemySpriteSvg } from './LaCriptaBestiaryShared';

const DUNGEON_FILTER_OPTIONS: Array<{ id: 'ALL' | 'REP5' | CriptaDungeonId; label: string }> = [
  { id: 'ALL', label: 'TODOS (166)' },
  { id: 'REP5', label: '★ 5 REPRESENTATIVOS' },
  { id: 'catacumbas_del_rey', label: 'CATACUMBAS' },
  { id: 'jardin_podrido', label: 'JARDÍN' },
  { id: 'forja_infernal', label: 'FORJA' },
  { id: 'templo_sumergido', label: 'TEMPLO' },
  { id: 'minas_abandonadas', label: 'MINAS' },
  { id: 'castillo_del_verdugo', label: 'VERDUGO' },
  { id: 'bosque_de_los_susurros', label: 'BOSQUE' },
  { id: 'alcantarillas_imperiales', label: 'ALCANTARILLAS' },
  { id: 'biblioteca_prohibida', label: 'BIBLIOTECA' },
  { id: 'torre_del_astrologo', label: 'ASTRÓLOGO' },
  { id: 'la_colmena', label: 'COLMENA' },
  { id: 'cripta_de_cristal', label: 'CRISTAL' },
  { id: 'prision_maldita', label: 'PRISIÓN' },
  { id: 'santuario_de_sangre', label: 'SANGRE' },
  { id: 'ciudad_sepultada', label: 'CIUDAD' },
  { id: 'palacio_de_los_espejos', label: 'ESPEJOS' },
  { id: 'cavernas_heladas', label: 'HELADAS' },
  { id: 'fortaleza_goblin', label: 'GOBLIN' },
  { id: 'cementerio_de_gigantes', label: 'GIGANTES' },
  { id: 'el_abismo', label: 'ABISMO + JEFES' },
];

const REPRESENTATIVE_FIVE_IDS: CriptaUniqueCreatureModelId[] = [
  'JARDIN_HONGO_ERRANTE',
  'CATACUMBAS_ACOLITO_HUESO',
  'CATACUMBAS_GUARDIAN_CRIPTAS',
  'BOSQUE_LOBO_NIEBLA',
  'ESPEJOS_DOBLE_FRAGMENTADO',
];

export const LaCriptaEnemyVisualQADebugModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REP5' | CriptaDungeonId>('REP5');
  const [silhouetteMode, setSilhouetteMode] = useState(false);
  const [hideNamesMode, setHideNamesMode] = useState(false);
  const [animTick, setAnimTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => {
      setAnimTick((t) => (t + 1) % 12);
    }, 240);
    return () => window.clearInterval(id);
  }, [isOpen]);

  const allBlueprints = useMemo(
    () => Object.values(CRIPTA_BIOME_BESTIARY_BY_SLUG) as CriptaCreatureVisualBlueprint[],
    []
  );

  const filteredBlueprints = useMemo(() => {
    if (selectedFilter === 'ALL') return allBlueprints;
    if (selectedFilter === 'REP5') {
      return REPRESENTATIVE_FIVE_IDS.map((id) =>
        allBlueprints.find((bp) => bp.id === id)
      ).filter(Boolean) as CriptaCreatureVisualBlueprint[];
    }
    return allBlueprints.filter((b) => b.dungeonId === selectedFilter);
  }, [allBlueprints, selectedFilter]);

  if (!import.meta.env.DEV || !isOpen) return null;

  const wingSpread = (animTick % 3) as 0 | 1 | 2;
  const pulse = animTick % 2 === 0;

  return (
    <div className="fixed inset-0 z-[120] bg-[#06040A]/95 backdrop-blur-md flex flex-col overflow-hidden text-[#F5EFE6] select-none">
      {/* Top QA Header */}
      <div className="px-4 py-3 bg-[#120D1B] border-b border-[#3E2F4B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#F59E0B] text-[#09070D] text-[10px] font-cripta-pixel font-bold uppercase">
              DEV QA ONLY
            </span>
            <h2 className="font-cripta-display text-lg sm:text-xl font-bold uppercase tracking-wider text-[#FFD166]">
              CATÁLOGO DE INSPECCIÓN VISUAL DE ENEMIGOS (LA CRIPTA)
            </h2>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] font-cripta-pixel">
            <span className="text-[#4ADE80]">
              ✓ DEFINIDOS: {allBlueprints.length - BESTIARY_AUDIT_REPORT.missingIds.length} /{' '}
              {allBlueprints.length}
            </span>
            <span
              className={
                BESTIARY_AUDIT_REPORT.duplicatePairs.length === 0
                  ? 'text-[#4ADE80]'
                  : 'text-[#F43F5E]'
              }
            >
              ✓ DUPLICADOS: {BESTIARY_AUDIT_REPORT.duplicatePairs.length}
            </span>
            <span
              className={
                BESTIARY_AUDIT_REPORT.disconnectedIds.length === 0
                  ? 'text-[#4ADE80]'
                  : 'text-[#FBBF24]'
              }
            >
              ✓ ANATOMÍA DESCONECTADA: {BESTIARY_AUDIT_REPORT.disconnectedIds.length}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSilhouetteMode((v) => !v)}
            className={`px-3 py-1.5 border text-[10px] font-cripta-pixel uppercase tracking-wider transition-colors ${
              silhouetteMode
                ? 'bg-[#F8FAFC] text-[#09070D] border-[#FFD166] font-bold'
                : 'bg-[#1C1429] text-[#D8C6A0] border-[#4A3B5C] hover:border-[#FFD166]'
            }`}
          >
            {silhouetteMode ? '◼ MODO SILUETA NEGRA: ACTIVO' : '◻ MODO SILUETA NEGRA (TEST)'}
          </button>

          <button
            type="button"
            onClick={() => setHideNamesMode((v) => !v)}
            className={`px-3 py-1.5 border text-[10px] font-cripta-pixel uppercase tracking-wider transition-colors ${
              hideNamesMode
                ? 'bg-[#E11D48] text-white border-[#FDA4AF] font-bold'
                : 'bg-[#1C1429] text-[#D8C6A0] border-[#4A3B5C] hover:border-[#FFD166]'
            }`}
          >
            {hideNamesMode ? '👁 NOMBRES OCULTOS (TEST CIEGO)' : '👁 OCULTAR NOMBRES (TEST)'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#2A1824] hover:bg-[#4C1D34] border border-[#F43F5E] text-[#FDA4AF] text-[10px] font-cripta-pixel uppercase"
          >
            CERRAR QA [ESC]
          </button>
        </div>
      </div>

      {/* Dungeon Filter Bar */}
      <div className="px-4 py-2 bg-[#0D0914] border-b border-[#2E2238] flex items-center gap-1.5 overflow-x-auto">
        {DUNGEON_FILTER_OPTIONS.map((opt) => {
          const active = selectedFilter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedFilter(opt.id)}
              className={`px-2.5 py-1 text-[9px] font-cripta-pixel uppercase whitespace-nowrap border transition-colors ${
                active
                  ? 'bg-[#2E1C44] border-[#FFD166] text-[#FFD166] font-bold'
                  : 'bg-[#140F1D] border-[#342645] text-[#D8C6A0]/80 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Enemy Visual Cards */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredBlueprints.map((bp) => {
          const vDef = ENEMY_VISUAL_REGISTRY[bp.id];
          const sizePx = Math.round(112 * (vDef?.scaleMultiplier || 1.2));
          return (
            <div
              key={bp.id}
              className={`flex flex-col items-center justify-between p-3 border rounded-none ${
                silhouetteMode
                  ? 'bg-[#CBD5E1] border-[#475569] text-[#0F172A]'
                  : 'bg-[#120D1A] border-[#342645] text-[#F5EFE6]'
              }`}
            >
              {/* Top Tier & Role Badge */}
              <div className="w-full flex items-center justify-between text-[8px] font-cripta-pixel uppercase opacity-80">
                <span>{bp.roleTag}</span>
                <span>{(vDef?.scaleMultiplier || 1).toFixed(2)}x</span>
              </div>

              {/* Sprite Stage */}
              <div className="my-2 h-36 w-full flex items-center justify-center overflow-visible">
                <div style={{ width: `${sizePx}px`, height: `${sizePx}px` }}>
                  <AuthoredEnemySpriteSvg
                    blueprint={bp}
                    visualDef={vDef}
                    torsoY={0}
                    headY={0}
                    armL={0}
                    armR={0}
                    wingSpread={wingSpread}
                    pulse={pulse}
                    silhouetteBlackMode={silhouetteMode}
                  />
                </div>
              </div>

              {/* Creature Identity Footer */}
              <div className="w-full text-center border-t border-current/15 pt-1.5">
                {hideNamesMode ? (
                  <div className="text-[10px] font-cripta-pixel font-bold uppercase tracking-widest opacity-60">
                    [¿QUÉ CRIATURA ES?]
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-cripta-display font-bold uppercase leading-tight">
                      {bp.name}
                    </div>
                    <div className="text-[8px] font-cripta-pixel opacity-70 truncate">
                      {bp.dungeonId.replace(/_/g, ' ')}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
