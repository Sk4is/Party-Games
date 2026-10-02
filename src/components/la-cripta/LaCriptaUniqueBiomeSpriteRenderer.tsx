import React from 'react';
import { CriptaCreatureVisualBlueprint } from '../../data/la-cripta/criptaBiomeBestiary';
import { ENEMY_VISUAL_REGISTRY } from './bestiary/LaCriptaBestiaryRegistry';
import { AuthoredEnemySpriteSvg } from './bestiary/LaCriptaBestiaryShared';

export const LaCriptaUniqueBiomeSpriteSvg: React.FC<{
  blueprint: CriptaCreatureVisualBlueprint;
  torsoY: number;
  headY: number;
  armL: number;
  armR: number;
  wingSpread: number;
  pulse: boolean;
}> = ({ blueprint, torsoY, headY, armL, armR, wingSpread, pulse }) => {
  const visualDef = ENEMY_VISUAL_REGISTRY[blueprint.id];

  return (
    <AuthoredEnemySpriteSvg
      blueprint={blueprint}
      visualDef={visualDef}
      torsoY={torsoY}
      headY={headY}
      armL={armL}
      armR={armR}
      wingSpread={wingSpread}
      pulse={pulse}
    />
  );
};
