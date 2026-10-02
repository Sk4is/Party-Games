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
import {
  AuthoredEnemySpriteSvg,
  EnemyVisualScaleClass,
  getResolvedEnemyVisualMeta,
} from './LaCriptaBestiaryShared';

const DUNGEON_FILTER_OPTIONS: Array<{ id: 'ALL' | 'REP_SHOWCASE' | CriptaDungeonId; label: string }> = [
  { id: 'ALL', label: 'TODOS (166)' },
  { id: 'REP_SHOWCASE', label: '★ CRIATURAS CLAVE' },
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

const SIZE_FILTER_OPTIONS: Array<{ id: 'ALL_SIZES' | EnemyVisualScaleClass; label: string }> = [
  { id: 'ALL_SIZES', label: 'TAMAÑO: TODOS' },
  { id: 'TINY', label: 'TINY (0.72–0.78x)' },
  { id: 'SMALL', label: 'SMALL (0.80–0.90x)' },
  { id: 'MEDIUM', label: 'MEDIUM (1.00x)' },
  { id: 'LARGE', label: 'LARGE (1.15–1.32x)' },
  { id: 'HUGE', label: 'HUGE (1.42–1.64x)' },
  { id: 'COLOSSAL', label: 'COLOSSAL (1.80–2.10x)' },
];

const SHOWCASE_CREATURE_IDS: CriptaUniqueCreatureModelId[] = [
  'MINAS_ARANUELO_FILON',
  'BOSQUE_FUEGO_FATUO',
  'BIBLIOTECA_GRIMORIO_ANIMADO',
  'MINAS_MINERO_DESCASCARADO',
  'BIBLIOTECA_ESCRIBA_SIN_ROSTRO',
  'ESPEJOS_BUfON_ILUSION',
  'SANGRE_FLAGELANTE_CALIZ',
  'FORJA_HERRERO_CENIZA',
  'BOSQUE_LOBO_NIEBLA',
  'HELADAS_LOBO_ESCARCHA',
  'FORJA_AUTOMA_ESCORIA',
  'GIGANTES_ESQUELETO_COLOSAL',
];

const SCALE_TEST_LINEUP_IDS: CriptaUniqueCreatureModelId[] = [
  'MINAS_ARANUELO_FILON',
  'BOSQUE_FUEGO_FATUO',
  'BIBLIOTECA_GRIMORIO_ANIMADO',
  'MINAS_MINERO_DESCASCARADO',
  'ESPEJOS_BUfON_ILUSION',
  'BOSQUE_LOBO_NIEBLA',
  'FORJA_AUTOMA_ESCORIA',
  'GIGANTES_ESQUELETO_COLOSAL',
];

const SCALE_CLASS_BADGE_COLORS: Record<EnemyVisualScaleClass, string> = {
  TINY: 'bg-[#1E293B] text-[#94A3B8] border-[#475569]',
  SMALL: 'bg-[#0F292A] text-[#5EEAD4] border-[#14B8A6]',
  MEDIUM: 'bg-[#1E1B4B] text-[#93C5FD] border-[#3B82F6]',
  LARGE: 'bg-[#2E1065] text-[#D8B4FE] border-[#9333EA]',
  HUGE: 'bg-[#431407] text-[#FDBA74] border-[#F97316]',
  COLOSSAL: 'bg-[#450A0A] text-[#FDE047] border-[#EF4444]',
};

export const LaCriptaEnemyVisualQADebugModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REP_SHOWCASE' | CriptaDungeonId>(
    'REP_SHOWCASE'
  );
  const [selectedSizeClass, setSelectedSizeClass] = useState<'ALL_SIZES' | EnemyVisualScaleClass>(
    'ALL_SIZES'
  );
  const [silhouetteMode, setSilhouetteMode] = useState(false);
  const [scaleTestMode, setScaleTestMode] = useState(true);
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

  const blueprintById = useMemo(() => {
    const map = new Map<CriptaUniqueCreatureModelId, CriptaCreatureVisualBlueprint>();
    for (const bp of allBlueprints) {
      map.set(bp.id, bp);
    }
    return map;
  }, [allBlueprints]);

  const filteredBlueprints = useMemo(() => {
    let list: CriptaCreatureVisualBlueprint[];
    if (selectedFilter === 'ALL') {
      list = allBlueprints;
    } else if (selectedFilter === 'REP_SHOWCASE') {
      list = SHOWCASE_CREATURE_IDS.map((id) => blueprintById.get(id)).filter(
        Boolean
      ) as CriptaCreatureVisualBlueprint[];
    } else {
      list = allBlueprints.filter((b) => b.dungeonId === selectedFilter);
    }

    if (selectedSizeClass !== 'ALL_SIZES') {
      list = list.filter((bp) => {
        const meta = getResolvedEnemyVisualMeta(
          bp.id,
          bp,
          ENEMY_VISUAL_REGISTRY[bp.id]
        );
        return meta.visualScaleClass === selectedSizeClass;
      });
    }
    return list;
  }, [allBlueprints, blueprintById, selectedFilter, selectedSizeClass]);

  if (!import.meta.env.DEV || !isOpen) return null;

  const wingSpread = (animTick % 3) as 0 | 1 | 2;
  const pulse = animTick % 2 === 0;

  const renderScaleTestActor = (
    id: CriptaUniqueCreatureModelId,
    baseMediumPx = 156,
    showNameplate = true
  ) => {
    const bp = blueprintById.get(id);
    if (!bp) return null;
    const visualDef = ENEMY_VISUAL_REGISTRY[id];
    const meta = getResolvedEnemyVisualMeta(id, bp, visualDef);
    const heightPx = Math.round(baseMediumPx * meta.visualScale * meta.visualHeightBias);
    const widthPx = Math.round(heightPx * meta.spriteAspectRatio);

    return (
      <div
        key={id}
        className="flex flex-col items-center justify-end shrink-0"
        data-scale-test-id={id}
      >
        {/* Sprite Stage Growing Upward from Shared Stone Floor Baseline */}
        <div
          className={`relative flex items-end justify-center transition-all ${
            silhouetteMode ? 'bg-[#F8FAFC] p-2 rounded' : ''
          }`}
          style={{
            width: `${widthPx}px`,
            height: `${heightPx}px`,
          }}
        >
          <AuthoredEnemySpriteSvg
            blueprint={bp}
            visualDef={visualDef}
            torsoY={0}
            headY={0}
            armL={0}
            armR={0}
            wingSpread={wingSpread}
            pulse={pulse}
            silhouetteBlackMode={silhouetteMode}
          />
        </div>

        {/* Locked Baseline Nameplate Below Shared Floor Line */}
        {showNameplate && (
          <div className="mt-2 w-40 min-h-[66px] bg-[#0B0811] border border-[#3E2F4B] p-1.5 text-center flex flex-col justify-between">
            <div className="text-[10px] font-cripta-display font-bold text-[#F5EFE6] truncate">
              {hideNamesMode ? '??? (SIN NOMBRE)' : bp.name}
            </div>
            <div className="flex items-center justify-center gap-1">
              <span
                className={`px-1.5 py-0.5 text-[8px] font-mono font-bold border rounded ${
                  SCALE_CLASS_BADGE_COLORS[meta.visualScaleClass]
                }`}
              >
                {meta.visualScaleClass} ({meta.visualScale.toFixed(2)}x)
              </span>
            </div>
            <div className="text-[8px] font-mono text-[#94A3B8]">
              {widthPx}×{heightPx}px · AR {meta.spriteAspectRatio.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#06040A]/96 backdrop-blur-md flex flex-col overflow-hidden text-[#F5EFE6] select-none">
      {/* Top QA Header */}
      <div className="px-4 py-3 bg-[#120D1B] border-b border-[#3E2F4B] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#F59E0B] text-[#09070D] text-[10px] font-cripta-pixel font-bold uppercase">
              DEV QA
            </span>
            <h2 className="font-cripta-display text-base sm:text-lg font-bold tracking-wider uppercase text-[#FFD166]">
              LA CRIPTA — AUDITORÍA DE ESCALA, SILUETA Y LEGIBILIDAD (166 CRIATURAS)
            </h2>
          </div>
          <p className="text-[11px] text-[#D8C6A0]/80 mt-0.5">
            Registrados: <strong className="text-[#4ADE80]">{allBlueprints.length}/166</strong> ·
            Faltantes:{' '}
            <strong
              className={
                BESTIARY_AUDIT_REPORT.missingIds.length === 0
                  ? 'text-[#4ADE80]'
                  : 'text-[#EF4444]'
              }
            >
              {BESTIARY_AUDIT_REPORT.missingIds.length}
            </strong>{' '}
            · Duplicados:{' '}
            <strong
              className={
                BESTIARY_AUDIT_REPORT.duplicatePairs.length === 0
                  ? 'text-[#4ADE80]'
                  : 'text-[#EF4444]'
              }
            >
              {BESTIARY_AUDIT_REPORT.duplicatePairs.length}
            </strong>{' '}
            · Proporción 1:1 sin aplastamiento vertical.
          </p>
        </div>

        {/* Interactive QA Test Toggles (Requirement 28: SILHOUETTE TEST & SCALE TEST) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScaleTestMode((v) => !v)}
            className={`px-3 py-1.5 text-xs font-cripta-pixel font-bold uppercase border transition-colors cursor-pointer ${
              scaleTestMode
                ? 'bg-[#F59E0B] text-[#09070D] border-[#FDE047]'
                : 'bg-[#1D152B] text-[#D8C6A0] border-[#4A3B5C] hover:border-[#FFD166]'
            }`}
          >
            {scaleTestMode ? '📏 SCALE TEST: ACTIVO' : '📏 SCALE TEST'}
          </button>

          <button
            type="button"
            onClick={() => setSilhouetteMode((v) => !v)}
            className={`px-3 py-1.5 text-xs font-cripta-pixel font-bold uppercase border transition-colors cursor-pointer ${
              silhouetteMode
                ? 'bg-[#F8FAFC] text-[#09070D] border-[#FFD166]'
                : 'bg-[#1D152B] text-[#D8C6A0] border-[#4A3B5C] hover:border-[#FFD166]'
            }`}
          >
            {silhouetteMode ? '⬛ SILHOUETTE TEST: ACTIVO' : '⬛ SILHOUETTE TEST'}
          </button>

          <button
            type="button"
            onClick={() => setHideNamesMode((v) => !v)}
            className={`px-3 py-1.5 text-xs font-cripta-pixel font-bold uppercase border transition-colors cursor-pointer ${
              hideNamesMode
                ? 'bg-[#E11D48] text-white border-[#FDA4AF]'
                : 'bg-[#1D152B] text-[#D8C6A0] border-[#4A3B5C] hover:border-[#FFD166]'
            }`}
          >
            {hideNamesMode ? '👁 OCULTAR NOMBRES: ACTIVO' : '👁 PRUEBA SIN NOMBRES'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#2A121D] hover:bg-[#3F1A2B] text-[#FDA4AF] border border-[#E11D48] text-xs font-cripta-pixel font-bold uppercase cursor-pointer"
          >
            ✕ CERRAR (ALT+B)
          </button>
        </div>
      </div>

      {/* Size Class Filter Bar (Requirement 28: TINY, SMALL, MEDIUM, LARGE, HUGE, COLOSSAL) */}
      <div className="px-4 py-2 bg-[#0E0A16] border-b border-[#2D223B] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {SIZE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setSelectedSizeClass(opt.id);
              setScaleTestMode(false);
            }}
            className={`px-2.5 py-1 text-[10px] font-cripta-pixel font-bold uppercase whitespace-nowrap border cursor-pointer transition-colors ${
              !scaleTestMode && selectedSizeClass === opt.id
                ? 'bg-[#38BDF8] text-[#09070D] border-[#BAE6FD]'
                : 'bg-[#161022] text-[#D8C6A0]/80 border-[#352847] hover:text-[#F5EFE6]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Dungeon Filter Bar */}
      <div className="px-4 py-2 bg-[#0B0812] border-b border-[#2D223B] flex items-center gap-1.5 overflow-x-auto shrink-0">
        {DUNGEON_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setSelectedFilter(opt.id);
              setScaleTestMode(false);
            }}
            className={`px-2.5 py-1 text-[10px] font-cripta-pixel font-bold uppercase whitespace-nowrap border cursor-pointer transition-colors ${
              !scaleTestMode && selectedFilter === opt.id
                ? 'bg-[#FFD166] text-[#09070D] border-[#FFF3C4]'
                : 'bg-[#161022] text-[#D8C6A0]/80 border-[#352847] hover:text-[#F5EFE6]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Content Area: SCALE TEST View OR Catalog Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {scaleTestMode ? (
          <div className="space-y-6">
            {/* 1. Full Representative Size Hierarchy Lineup on Shared Floor Baseline (Requirement 28) */}
            <div className="p-4 bg-[#110C1A] border-2 border-[#3E2F4B] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-cripta-display font-bold text-[#FFD166] uppercase tracking-wider">
                    1. COMPARATIVA DE ESCALA EN SUELO COMPARTIDO (SMALL → MEDIUM → LARGE → COLOSSAL)
                  </h3>
                  <p className="text-[11px] text-[#D8C6A0]/80">
                    Todos los enemigos están anclados exactamente a la misma línea de suelo (abajo) y crecen hacia arriba manteniendo su relación de aspecto 1:1.
                  </p>
                </div>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-max px-6 pt-6 pb-3 bg-[#09060E] border border-[#2D223B] flex items-end justify-center gap-6 relative">
                  {/* Shared Floor Reference Line */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-[82px] h-[2px] bg-[#F59E0B]/45" />
                  {SCALE_TEST_LINEUP_IDS.map((id) => renderScaleTestActor(id, 152, true))}
                </div>
              </div>
            </div>

            {/* 2. Acceptance Test Pairings (Requirements 29 & 32) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* Acceptance Test 29: Arañuelo + Minero + Esqueleto Colosal */}
              <div className="p-4 bg-[#110C1A] border border-[#3E2F4B] rounded-lg flex flex-col justify-between">
                <div className="mb-2">
                  <div className="text-xs font-cripta-display font-bold text-[#FFD166] uppercase">
                    TEST #29: ARAÑUELO vs MINERO vs ESQUELETO COLOSAL
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">
                    Arañuelo (SMALL 0.82x) · Minero (MEDIUM 1.02x) · Esqueleto Colosal (COLOSSAL 1.92x)
                  </div>
                </div>
                <div className="p-3 bg-[#09060E] border border-[#2D223B] flex items-end justify-center gap-4 overflow-x-auto relative">
                  <div className="pointer-events-none absolute inset-x-0 bottom-[78px] h-[1px] bg-[#38BDF8]/40" />
                  {renderScaleTestActor('MINAS_ARANUELO_FILON', 132, true)}
                  {renderScaleTestActor('MINAS_MINERO_DESCASCARADO', 132, true)}
                  {renderScaleTestActor('GIGANTES_ESQUELETO_COLOSAL', 132, true)}
                </div>
              </div>

              {/* Acceptance Test 32A: Lobo de Niebla + Fuego Fatuo */}
              <div className="p-4 bg-[#110C1A] border border-[#3E2F4B] rounded-lg flex flex-col justify-between">
                <div className="mb-2">
                  <div className="text-xs font-cripta-display font-bold text-[#FFD166] uppercase">
                    TEST #32A: LOBO DE NIEBLA + FUEGO FATUO
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">
                    El lobo domina en tamaño físico (LARGE 1.22x); Fuego Fatuo es pequeño y flotante (SMALL 0.82x).
                  </div>
                </div>
                <div className="p-3 bg-[#09060E] border border-[#2D223B] flex items-end justify-center gap-5 overflow-x-auto relative">
                  <div className="pointer-events-none absolute inset-x-0 bottom-[78px] h-[1px] bg-[#38BDF8]/40" />
                  {renderScaleTestActor('BOSQUE_LOBO_NIEBLA', 152, true)}
                  {renderScaleTestActor('BOSQUE_FUEGO_FATUO', 152, true)}
                </div>
              </div>

              {/* Acceptance Test 32B: Autómata de Escoria + Herrero de Ceniza */}
              <div className="p-4 bg-[#110C1A] border border-[#3E2F4B] rounded-lg flex flex-col justify-between">
                <div className="mb-2">
                  <div className="text-xs font-cripta-display font-bold text-[#FFD166] uppercase">
                    TEST #32B: AUTÓMATA DE ESCORIA + HERRERO DE CENIZA
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">
                    Autómata más pesado/ancho (LARGE 1.30x) junto al Herrero (LARGE 1.16x) con tarjetas alineadas.
                  </div>
                </div>
                <div className="p-3 bg-[#09060E] border border-[#2D223B] flex items-end justify-center gap-5 overflow-x-auto relative">
                  <div className="pointer-events-none absolute inset-x-0 bottom-[78px] h-[1px] bg-[#38BDF8]/40" />
                  {renderScaleTestActor('FORJA_AUTOMA_ESCORIA', 148, true)}
                  {renderScaleTestActor('FORJA_HERRERO_CENIZA', 148, true)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBlueprints.map((bp) => {
              const visualDef = ENEMY_VISUAL_REGISTRY[bp.id];
              const meta = getResolvedEnemyVisualMeta(bp.id, bp, visualDef);
              const previewBasePx = 118;
              const previewH = Math.round(
                previewBasePx * meta.visualScale * meta.visualHeightBias
              );
              const previewW = Math.round(previewH * meta.spriteAspectRatio);

              return (
                <div
                  key={bp.id}
                  className="bg-[#110C1A] border-2 border-[#2F2340] hover:border-[#FFD166]/60 rounded-lg p-3 flex flex-col justify-between transition-colors"
                >
                  {/* Top Metadata Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      {!hideNamesMode ? (
                        <>
                          <div className="font-cripta-display text-sm font-bold text-[#FFD166] leading-tight">
                            {bp.name}
                          </div>
                          <div className="text-[10px] text-[#D8C6A0]/70 font-mono mt-0.5">
                            {bp.id}
                          </div>
                        </>
                      ) : (
                        <div className="font-cripta-pixel text-xs text-[#94A3B8] italic">
                          [IDENTIFICA POR SILUETA]
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-cripta-pixel font-bold uppercase border rounded ${
                        SCALE_CLASS_BADGE_COLORS[meta.visualScaleClass]
                      }`}
                    >
                      {meta.visualScaleClass}
                    </span>
                  </div>

                  {/* Proportional Ground-Anchored Sprite Stage */}
                  <div
                    className={`w-full min-h-[210px] rounded border flex items-end justify-center p-3 overflow-hidden relative ${
                      silhouetteMode
                        ? 'bg-[#F1F5F9] border-[#CBD5E1]'
                        : 'bg-[#08050D] border-[#241A32]'
                    }`}
                  >
                    <div
                      style={{
                        width: `${Math.min(220, previewW)}px`,
                        height: `${Math.min(200, previewH)}px`,
                      }}
                      className="flex items-end justify-center"
                    >
                      <AuthoredEnemySpriteSvg
                        blueprint={bp}
                        visualDef={visualDef}
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

                  {/* Footer Technical Details */}
                  <div className="mt-2 pt-2 border-t border-[#241A32] flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#D8C6A0]/80 font-mono">
                    <span>{bp.dungeonId.replace(/_/g, ' ')}</span>
                    <span>
                      {meta.visualScale.toFixed(2)}x · AR {meta.spriteAspectRatio.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
