import {
  CRIPTA_BIOME_BESTIARY_BY_SLUG,
  CriptaUniqueCreatureModelId,
} from '../../../data/la-cripta/criptaBiomeBestiary';
import {
  auditEnemyVisualRegistry,
  AuthoredEnemyVisualDefinition,
} from './LaCriptaBestiaryShared';
import { BESTIARY_VISUALS_PART_1 } from './LaCriptaBestiaryPart1';
import { BESTIARY_VISUALS_PART_2 } from './LaCriptaBestiaryPart2';
import { BESTIARY_VISUALS_PART_3 } from './LaCriptaBestiaryPart3';
import { BESTIARY_VISUALS_PART_4 } from './LaCriptaBestiaryPart4';

export const ENEMY_VISUAL_REGISTRY: Partial<
  Record<CriptaUniqueCreatureModelId, AuthoredEnemyVisualDefinition>
> = {
  ...BESTIARY_VISUALS_PART_1,
  ...BESTIARY_VISUALS_PART_2,
  ...BESTIARY_VISUALS_PART_3,
  ...BESTIARY_VISUALS_PART_4,
};

export const ALL_EXPECTED_BESTIARY_IDS = Object.values(
  CRIPTA_BIOME_BESTIARY_BY_SLUG
).map((bp) => bp.id) as CriptaUniqueCreatureModelId[];

export const BESTIARY_AUDIT_REPORT = auditEnemyVisualRegistry(
  ENEMY_VISUAL_REGISTRY,
  ALL_EXPECTED_BESTIARY_IDS
);
